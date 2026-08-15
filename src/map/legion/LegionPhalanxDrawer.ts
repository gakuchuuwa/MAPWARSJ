import { AssetLoader } from '../../core/AssetLoader';
import { SPRITE_PATHS } from '../../config/GameConfig';
import { FormationSystem } from '../../core/FormationSystem';
import { GeneralDrawer } from '../GeneralDrawer';
import { PhalanxVitality } from '../PhalanxVitality';
import { LegionPhalanxStateManager, LegionUnitState } from './LegionPhalanxState';
import { LegionType } from '../../types/UnitTypes';
import { SpriteTinter } from '../../systems/tinting/SpriteTinter';
import { FactionTintSystem } from '../../systems/tinting/FactionTintSystem';
import { getCompositionTier, CompositionTier, expandCompositionSlots } from '../../types/LegionComposition';
import { getNavalShipDrawScale, type NavalShipAssetId } from '../../types/NavalShipTiers';
import { gameLog } from '../../utils/GameLogger';

/** 启动时不预载（S10DB 860+ 素材尚未部署），首次水战再按需加载 */
import { NavalPhalanxStateManager } from './NavalPhalanxState';

/** 启动时不预载（S10DB 860+ 素材尚未部署），首次水战再按需加载 */
const LAZY_BOOT_UNIT_IDS = new Set(['ship_small', 'ship_medium', 'ship_large']);

/** AoE2 DE（SLD）动态帧框素材目录：走 hotspot 对齐渲染，读 `_meta.json`。其余（S10DB/征服版 SLP）走正方形帧。 */
const DE_DYN_DIRS = ['/SUCAI/ARCHER/', '/SUCAI/SAMURAI_ELITE/', '/SUCAI/SAMURAI_DE/', '/SUCAI/FIRE_ARCHER/', '/SUCAI/HEI_KUANG/', '/SUCAI/EASTERN_SWORDSMAN/'];

export type PhalanxAnimState = 'IDLE' | 'MOVE' | 'ATTACK' | 'DAMAGE' | 'DEATH';

export class LegionPhalanxDrawer {

    /** 纯骑 1-2-3 等腰三角 (6 人): 草原 / 青藏 / 西域 */
    private static readonly TRIANGLE_LAYOUT = [
        { r: 0, c: 0 },
        { r: 1, c: -1 }, { r: 1, c: 1 },
        { r: 2, c: -2 }, { r: 2, c: 0 }, { r: 2, c: 2 },
    ] as const;

    private static readonly PURE_CAVALRY_LEGION_TYPES: LegionType[] = ['cavalry', 'archer_cavalry'];

    /**
     * [2026-08-09 13场景阵型] 步兵类型判定：是否展开为 4×2 小阵。
     * 与 UnitAssets.ts / CultureFormations.ts 的步兵分类一致
     * （light_infantry/heavy_infantry/shield/spear/armored/axe + 华夏步兵）。
     * 骑兵（lancer/heavy_cavalry/general_cavalry/horse_archer/huihui_cavalry）、
     * 远程（archer/crossbow/ballista）、象兵（elephant）不是步兵，保持单格。
     */
    private static readonly INFANTRY_TYPES: ReadonlySet<string> = new Set([
        'light_infantry',
        'heavy_infantry',
        'shield',
        'spear',
        'armored',
        'axe',
        'huaxia_infantry',
    ]);

    private static isInfantryType(type: string): boolean {
        return LegionPhalanxDrawer.INFANTRY_TYPES.has(type);
    }

    /**
     * [2026-08-09 13场景阵型] 骑兵类型判定：是否展开为 1-2-3 六人小三角。
     * 与 LegionComposition.getDefaultScaleForUnitType 的骑兵分类一致：
     * lancer/heavy_cavalry/general_cavalry/horse_archer/huihui_cavalry + 任何含 cavalry 的兵种。
     * public：GlobalUnitRenderer 的编队判定（视觉框收缩系数）也用它，两处必须同源。
     */
    public static isCavalryType(type: string): boolean {
        return (
            type === 'lancer' ||
            type === 'heavy_cavalry' ||
            type === 'general_cavalry' ||
            type === 'horse_archer' ||
            type === 'huihui_cavalry' ||
            type.includes('cavalry')
        );
    }

    /**
     * [2026-08-09 13场景阵型] 远程类型判定：是否展开为远程方阵。
     * archer（弓兵）/ crossbow（弩兵）。床弩 ballista 已划入攻城类（主人 2026-08-09 定）。
     * public：GlobalUnitRenderer 的后排射击判定也用它（两处必须同源）。
     */
    public static isRangedType(type: string): boolean {
        return type === 'archer' || type === 'crossbow';
    }

    /**
     * [2026-08-09 13场景阵型] 攻城类型判定：是否展开为 2×2 四人小阵。
     * 主人 2026-08-09 定：象兵/床弩/冲车/井阑/投石均属攻城类。
     * 在槽位数据中实际出现的是 elephant（象兵）与 ballista（床弩兵，拉丁蝎子弩）；
     * 冲车/井阑/投石为独立器械系统（SIEGE_GEAR_DEFS），不占编队槽位。
     */
    private static isSiegeType(type: string): boolean {
        return type === 'elephant' || type === 'ballista';
    }

    /** S10DB 多数步兵/弩弓条带行高 64px；长枪、骑兵条带为 84px。绘制时按 64 归一化，避免同 scale 下 84px 素材显小。 */
    private static readonly S10DB_REF_FRAME_H = 64;

    /**
     * [2026-08-09 接触距离] 各类编队的**横向占位宽度**（单位：单兵宽，含两端各半个精灵）。
     * 与四支展开分支的子间距一一对应，改子间距务必同步改这里：
     *   步兵 4×2 交错 = 3.5 列 × 0.75 + 1 = 3.625  ← 最宽，格位间距按它定
     *   骑兵 1-2-3    = 4 × 0.32 × 0.7 + 1 ≈ 1.90
     *   远程 3×3      = 2 × 0.75 + 1 = 2.50
     *   攻城 2×2      = 1 × 1.20 + 1 = 2.20
     * 用途：**并肩让位**（squadEngagePoint 侧移一个编队宽）。
     * 🔴 2026-08-10 起不再用于接触距离 —— 接触距离改由 getSquadSupportRadius 按**真实外框形状**
     *    （步兵长方形 / 骑兵三角形）沿接敌方向算。用宽度当接触距离会让步兵停在两个多编队
     *    深度之外（主人实锤「步兵隔着一大段距离」），用纵深又只是换一个标量近似，都不对。
     */
    public static getSquadWidthFactor(type: string): number {
        // [2026-08-10 5×2 交错方阵] 步兵/远程统一 5 列交错：并集 = 4.5×0.75 + 1 = 4.375
        if (this.isInfantryType(type)) return 4.375;
        if (this.isCavalryType(type)) return 1.90;
        if (this.isRangedType(type)) return 4.375;
        if (this.isSiegeType(type)) return 3.25; // 攻城 1×4 = 3 × 0.75 + 1（2026-08-10 一排同步，原 2×2 = 2.20 已废弃）
        return 3.625; // 未知兵种按最宽算，宁可留缝也不穿模
    }

    /**
     * [2026-08-10 调试可视化] 画编队外框（DEV 专用，生产剥离）：旋转矩形 = 编队占位
     * （宽 = getSquadWidthFactor×单兵宽，深 = 纵深 factor×单兵高），红短线 = 编队朝向。
     * 供主人直观核对编队间距 / 接触线 / 「隔空」到底隔多远。仅 denseFront(13) 下由 draw 调用，
     * 攻方与守军（renderSiegeDefenders 也走 draw）自动全覆盖。
     */
    public static debugDrawSquadBox(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        direction: number,
        dw: number,
        dh: number,
        type: string,
    ): void {
        // [2026-08-10 主人定] 外框要比编队本身小（交战判定框语义）——占位矩形收进编队
        // 视觉内。骑兵是 1-2-3 三角阵、矩形框四角空，观感框特大 → 骑兵单独再缩（主人
        // 2026-08-10「把骑兵边框再次缩小」）。**判定与视觉同源**（squadContactDistance
        // 用同一组系数），框相切 = 判定碰到 = 开战（主人：「边框碰到才能开战」）。
        const SHRINK = this.isCavalryType(type) ? 0.55 : 0.70;
        const w = dw * LegionPhalanxDrawer.getSquadWidthFactor(type) * SHRINK;
        let depth: number;
        // [2026-08-10 5×2 十人方阵] 步兵/远程 2 排：深度 = 1×0.4 + 1 = 1.4 兵高
        if (this.isInfantryType(type)) depth = 1.40;
        else if (this.isCavalryType(type)) depth = 1.70;
        else if (this.isRangedType(type)) depth = 1.40;
        else if (this.isSiegeType(type)) depth = 1.00; // 攻城 1×4 单排深 = 1 精灵高（2026-08-10 一排同步）
        else depth = 1.50;
        const h = dh * depth * SHRINK;
        const angle = (direction + 1) * Math.PI / 4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(0, 230, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.restore();
    }

    /**
     * [2026-08-10 接触距离] 各类编队的**纵深占位**（单位：单兵**高**，含两端各半个精灵）。
     * 两队正面对撞时，挨上的是双方的前排 —— 中心距 = (己方纵深 + 敌方纵深) / 2 × 单兵高，
     * 与横向宽度无关。数值由四支展开分支的 localY 跨度反算，改子间距务必同步改这里：
     *   步兵 4×2   localY=(sr-0.5)×dh×0.50, sr∈{0,1} → 1×0.50+1 = 1.50
     *   骑兵 1-2-3 localY=(r-1.0)×dh×0.35, r∈{0,1,2} → 2×0.35+1 = 1.70
     *   远程 3×3   localY=(sr-1.0)×dh×0.50, sr∈{0,1,2} → 2×0.50+1 = 2.00 ← 最深，格位纵距按它定
     *   攻城 2×2   localY=(sr-0.5)×dh×0.80, sr∈{0,1} → 1×0.80+1 = 1.80
     * 单兵高从格位纵距反解：unitH = sp.y / (2.00 × 1.10)（与 computeDenseSpacing 同一套常数）。
     */
    /**
     * [2026-08-10 编队外框·主人定稿] 编队外框沿某方向的「支撑半径」——
     * 从编队中心出发、沿 dl 方向走到外框边缘的距离（凸集支撑函数）。
     *
     * 外框形状：**步兵/远程/攻城 = 长方形，骑兵 = 三角形（尖端朝前）**，与各自的
     * 子兵展开一一对应。两个编队「外框刚好贴上」的中心距 =
     *     支撑半径_我(d) + 支撑半径_敌(−d)      （d = 我 → 敌 的单位方向）
     * 这比旧的「一个标量停止距离」准得多：编队是扁的/尖的，从正面压上来和从侧面
     * 包过来，该停的距离本就不同，标量做不到（旧写法步兵一律停在最宽的 3.625 外）。
     *
     * 数学：外框 = 子兵中心点的凸包 ⊕ 单个精灵矩形（Minkowski 和），
     * 而凸集的支撑函数可加，所以直接把两段支撑相加即可：
     *   点阵凸包：矩形阵 = halfSpanX|dx| + halfSpanY|dy|；三角阵 = 三顶点投影取最大
     *   精灵矩形：(dw/2)|dx| + (dh/2)|dy|
     *
     * 各阵的点阵半跨（与四支展开分支的子间距逐项对应，改子间距务必同步改这里）：
     *   步兵 4×2   x ±1.75×0.75 = ±1.3125 dw   y ±0.5×0.50 = ±0.25 dh
     *   远程 3×3   x ±1.0 ×0.75 = ±0.75   dw   y ±1.0×0.50 = ±0.50 dh
     *   攻城 2×2   x ±0.5 ×1.20 = ±0.60   dw   y ±0.5×0.80 = ±0.40 dh
     *   骑兵三角   顶点 (0,−0.35dh) / (±2×0.32×0.7 dw, +0.35dh) = (±0.448dw, +0.35dh)
     * 校验：加回一个精灵后总宽 = 3.625/1.896/2.50/2.20 兵宽（与 getSquadWidthFactor 一致），
     *       总深 = 1.50/1.70/2.00/1.80 兵高。
     *
     * @param dlx,dly 单位方向，**编队本地坐标**（+x = 阵型横向，+y = 阵型纵深/后方）
     * @param dw,dh   单兵渲染宽 / 高（像素）
     */
    public static getSquadSupportRadius(
        type: string,
        dlx: number,
        dly: number,
        dw: number,
        dh: number,
    ): number {
        // [2026-08-10 据点编队] 城图（据点）＝守方一个不可动的编队：外框 = 城图矩形本体，
        // dw/dh 由发布方传城图全宽/全高（halfW×2 / halfH×2），支撑半径 = 矩形方向投影。
        // 城图不可缩（本体），无精灵加成段。
        if (type === 'city') {
            return (dw / 2) * Math.abs(dlx) + (dh / 2) * Math.abs(dly);
        }
        // 单个精灵那一段（所有兵种共用）
        const sprite = (dw / 2) * Math.abs(dlx) + (dh / 2) * Math.abs(dly);

        if (this.isCavalryType(type)) {
            // 三角形：尖端 (0,−0.35dh) 在前，底边两角 (±0.448dw, +0.35dh)
            const tipY = -0.35 * dh;
            const baseX = 0.448 * dw;
            const baseY = 0.35 * dh;
            const hull = Math.max(tipY * dly, baseX * Math.abs(dlx) + baseY * dly);
            return hull + sprite;
        }

        let halfX: number;
        let halfY: number;
        // [2026-08-10 5×2 交错方阵] 步兵/远程统一 5 列 2 排交错：halfX = 2.25×0.75 列距半跨、
        // halfY = 0.5×0.4 排距半跨
        if (this.isInfantryType(type)) { halfX = 1.6875 * dw; halfY = 0.20 * dh; }
        else if (this.isRangedType(type)) { halfX = 1.6875 * dw; halfY = 0.20 * dh; }
        else if (this.isSiegeType(type)) { halfX = 1.125 * dw; halfY = 0; } // 1×4 单排：1.5×0.75 / 无纵深（2026-08-10 一排同步）
        else { halfX = 1.3125 * dw; halfY = 0.25 * dh; } // 未知按步兵（最宽）
        return halfX * Math.abs(dlx) + halfY * Math.abs(dly) + sprite;
    }


    /**
     * 密集编队（zoom13 战斗场景）的 3×3 格位间距 —— 唯一实现，draw() 与外部对齐都走这里。
     *
     * 格位间距必须由「单兵实际绘制尺寸」推导，不能用估计常数：
     *   dw = SPRITE_BASE_H * scale * slotScale * (frameH / S10DB_REF_FRAME_H) * (frameW / frameH)
     * 编队占位需含两端各半个精灵，不能只算中心点跨度：
     *   步兵 4×2 交错 横向 3.5×0.75+1 = 3.625 兵宽 ← 最宽
     *   远程 3×3      纵深 2×0.50+1  = 2.00 兵高 ← 最深
     */
    private static computeDenseSpacing(
        refSprite: HTMLImageElement,
        refTotalFrames: number,
        scale: number,
        cultureScales: number[] | null,
    ): { x: number; y: number } {
        const SPRITE_BASE_H = 60;      // 与 draw() 循环内 baseHeight 一致
        // [2026-08-10 修·编队挤团] 5×2 交错方阵并集宽 = 4.5 列距 + 两端半兵 = 4.375 兵宽
        // （与 getSquadWidthFactor 步兵同源）。原 3.625 是 4×2 时代旧值 → 编队实际宽 > 格距
        // → 相邻编队横向压叠（主人实锤「一上来就重叠/挤成一团」）。
        const INFANTRY_SPAN_W = 4.375; // 最宽编队（步兵/远程 5×2 交错）横向占位（兵宽）
        // [2026-08-10 修·出场交叉] 格距参考素材是 64px，但中排重骑素材是 84px；
        // 骑兵阵深实际需 1.70×84/64 = 2.231 个参考兵高。旧 2.00 不足，导致同一军团
        // 中排骑兵刚出场就侵入前后排（主人连续实锤「一出来两军就交叉」）。
        const DEEPEST_SPAN_H = 2.25;   // 向上取整覆盖 84px 骑兵真实阵深
        const GAP = 1.10;              // 编队之间留 10% 缝

        const refFrameW = refSprite.width / refTotalFrames;
        const refFrameH = refSprite.height;
        const maxSlotScale = cultureScales && cultureScales.length
            ? Math.max(...cultureScales)
            : 1;
        const unitH = SPRITE_BASE_H * scale * maxSlotScale
            * (refFrameH / LegionPhalanxDrawer.S10DB_REF_FRAME_H);
        const unitW = unitH * (refFrameW / refFrameH);

        return { x: unitW * INFANTRY_SPAN_W * GAP, y: unitH * DEEPEST_SPAN_H * GAP };
    }

    /**
     * 供外部（攻城团锚点等）对齐 3×3 格位用：按与 draw() 同一套资源解析算出密集格位间距。
     * 资源未就绪返回 null —— 调用方应退回原行为，不要自己猜数值。
     */
    public static getDenseSquadSpacing(
        unitAssetsId: string,
        legionType: string,
        direction: number,
        scale: number,
        cultureScales: number[] | null,
    ): { x: number; y: number } | null {
        const assets = this.unitSpriteCache.get(unitAssetsId)
            ?? this.unitSpriteCache.get(legionType)
            ?? this.unitSpriteCache.get('mixed')
            ?? this.unitSpriteCache.get('light_infantry');
        if (!assets) return null;
        const refSprite = assets.IDLE[direction] || assets.IDLE[0];
        if (!refSprite) return null;
        return this.computeDenseSpacing(
            refSprite, this.getFrameCount(refSprite), scale, cultureScales,
        );
    }

    // [DYNAMIC ASSET SYSTEM]
    // Key: unitAssetId (e.g. 'huaxia_infantry') -> Local Sprite Cache
    private static unitSpriteCache: Map<string, {
        MOVE: HTMLImageElement[],
        ATTACK: HTMLImageElement[],
        IDLE: HTMLImageElement[],
        DAMAGE: HTMLImageElement[],
        DEATH: HTMLImageElement[],
        /**
         * AoE2 DE 动态帧框元数据（有此项 = 走 hotspot 对齐渲染；无此项 = S10DB 正方形帧）。
         * 键 = cacheEntry 字段名（MOVE/ATTACK/IDLE/DAMAGE/DEATH/SHOOT/CHARGE），
         * 值 = { frames: 帧数, dirs: { [dir]: { fw, fh, hx, hy } } }，
         * fw/fh = 该动作该方向 box 尺寸，hx/hy = hotspot(canvas中心) 在 box 里的位置。
         */
        dyn?: Record<string, { frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }>;
        SECONDARY?: {
            MOVE: HTMLImageElement[],
            ATTACK: HTMLImageElement[],
            IDLE: HTMLImageElement[],
            DAMAGE: HTMLImageElement[],
            DEATH: HTMLImageElement[],
            SHOOT: HTMLImageElement[]
        },
        TERTIARY?: {
            MOVE: HTMLImageElement[],
            ATTACK: HTMLImageElement[],
            IDLE: HTMLImageElement[],
            DAMAGE: HTMLImageElement[],
            DEATH: HTMLImageElement[],
            SHOOT: HTMLImageElement[]
        }
    }> = new Map();

    /** AoE2 DE 元数据缓存（目录 → dyn，键 = cacheEntry 字段名） */
    private static dynMetaCache: Map<string, Record<string, { frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }>> = new Map();

    /** 读 AoE2 DE 素材的 `_meta.json`（帧数 + 每方向 box 尺寸/hotspot 偏移），映射到 cacheEntry 字段名。 */
    private static async loadDynMeta(dir: string): Promise<Record<string, { frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }> | null> {
        const cached = this.dynMetaCache.get(dir);
        if (cached) return cached;
        try {
            const res = await fetch(`${dir}_meta.json`);
            if (!res.ok) return null;
            const meta: any = await res.json();
            const dyn: Record<string, { frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }> = {};
            // _meta.json 的 action 键 → cacheEntry 字段名；DAMAGE/SHOOT/CHARGE 复用 attack。
            const map: Record<string, string[]> = {
                idle: ['IDLE'], move: ['MOVE'], attack: ['ATTACK', 'DAMAGE', 'SHOOT', 'CHARGE'], death: ['DEATH'],
            };
            for (const [act, slots] of Object.entries(map)) {
                if (!meta[act]) continue;
                for (const slot of slots) {
                    dyn[slot] = { frames: meta[act].frames, dirs: meta[act].dirs };
                }
            }
            this.dynMetaCache.set(dir, dyn);
            return dyn;
        } catch { return null; }
    }

    // [RTS INTERFACE] Expose assets for RTS renderer
    public static getUnitAssets(unitAssetsId: string) {
        return this.unitSpriteCache.get(unitAssetsId);
    }

    private static isLoaded = false;
    // [PERF-FIX] Re-entrancy guard：防止被并发调用时重复跑全量 canvas 处理
    private static loadingPromise: Promise<void> | null = null;

    // ─── 攻城器械通用系统（2026-07-18）────────────────────────────
    private static readonly SIEGE_GEAR_DEFS = {
        ram: {
            attackIds: [731, 732, 733, 734, 735, 736, 737, 738],
            deathIds: [755, 756, 757, 758, 759, 760, 761, 762],
            posOffsetX: 0,      // 正中
            posOffsetY: -2.0,  // 第一排前
            scaleMul: 0.70,
        },
        well_lan: {
            attackIds: [774, 775, 776, 777, 778, 779, 780, 781],
            deathIds: [782, 783, 784, 785, 786, 787, 788, 789],
            posOffsetX: -1.7,    // 第三排左
            posOffsetY: +0.75,   // 左稍前
            scaleMul: 0.70,
        },
        well_lan_r: {
            attackIds: [774, 775, 776, 777, 778, 779, 780, 781],
            deathIds: [782, 783, 784, 785, 786, 787, 788, 789],
            posOffsetX: +1.7,    // 第三排右
            posOffsetY: +0.85,
            scaleMul: 0.70,
        },
        catapult_l: {
            attackIds: [801, 802, 803, 804, 805, 806, 807, 808],
            deathIds: [825, 826, 827, 828, 829, 830, 831, 832],
            posOffsetX: -0.8,     // 第三排后左
            posOffsetY: +1.70,    // 左稍前
            scaleMul: 0.70,
            frameStagger: 0,
            frameSpeed: 250,
        },
        catapult_r: {
            attackIds: [801, 802, 803, 804, 805, 806, 807, 808],
            deathIds: [825, 826, 827, 828, 829, 830, 831, 832],
            posOffsetX: +0.8,     // 第三排后右
            posOffsetY: +1.90,    // 右稍后
            scaleMul: 0.70,
            frameStagger: 4,      // 错开半周期
            frameSpeed: 250,      // 投石慢速（ms/帧）
        },
    } as const;

    /** 每场攻城随机交换井阑/投石机位置：key = unitId（+ 团索引，13 场景 4 团各自独立随机） */
    private static gearShuffle = new Map<string, Record<string, 'well' | 'catapult'>>();
    private static readonly SHUFFLE_GEAR_KEYS = ['well_lan', 'well_lan_r', 'catapult_l', 'catapult_r'] as const;

    private static ensureGearShuffle(unitId: string, groupIndex = 0): Record<string, 'well' | 'catapult'> {
        // [2026-08-09 主人定] 4 个攻城团完全一样 → 每团独立随机（key 含团索引），
        // 团与团之间的井阑/投石分布不再相同。
        const key = `${unitId}|${groupIndex}`;
        let s = this.gearShuffle.get(key);
        if (!s) {
            const types: ('well' | 'catapult')[] = ['well', 'well', 'catapult', 'catapult'];
            for (let i = types.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [types[i], types[j]] = [types[j], types[i]];
            }
            s = {};
            for (let i = 0; i < this.SHUFFLE_GEAR_KEYS.length; i++) {
                s[this.SHUFFLE_GEAR_KEYS[i]] = types[i];
            }
            this.gearShuffle.set(key, s);
        }
        return s;
    }


    private static siegeGearCaches = new Map<string, any>();

    private static getGearCache(type: string): any {
        let c = this.siegeGearCaches.get(type);
        if (!c) {
            c = {
                attackSprites: [],
                deathSprites: [],
                deathStarts: new Map(),
                deathThresholds: new Map(),
                loaded: false,
                loading: false,
            } as any;
            this.siegeGearCaches.set(type, c);
        }
        return c;
    }

    /** 外部查询：该 unit 是否曾参与攻城（用于覆灭后保留器械尸体） */
    public static wasSiegeUnit(unitId: string): boolean {
        for (const cache of this.siegeGearCaches.values()) {
            if (cache.deathThresholds.has(unitId)) return true;
        }
        return false;
    }

    /** 攻城器械渐显起始 tick：key = unitId */
    private static gearSpawnTicks = new Map<string, number>();
    private static readonly GEAR_SPAWN_DURATION = 2000; // 2 秒渐显
    /** 攻城器械渐隐起始 tick：key = unitId（胜利后 4 秒淡出） */
    private static gearFadeOutStarts = new Map<string, number>();
    private static readonly GEAR_FADE_OUT_DURATION = 4000; // 4 秒渐隐

    private static async ensureSiegeGearLoaded(type: string): Promise<void> {
        const cache = this.getGearCache(type);
        if (cache.loaded) return;
        if (cache.loading) {
            let waited = 0;
            while (cache.loading && waited < 100) {
                await new Promise(r => setTimeout(r, 50));
                waited++;
            }
            return;
        }
        cache.loading = true;
        const def = (LegionPhalanxDrawer.SIEGE_GEAR_DEFS as any)[type];
        try {
            const allPaths = [
                ...def.attackIds.map((id: number) => `/SUCAI/S10DB/${id}-1.png`),
                ...def.deathIds.map((id: number) => `/SUCAI/S10DB/${id}-1.png`),
            ];
            await AssetLoader.preloadImages(allPaths);
            for (const id of def.attackIds) {
                const raw = AssetLoader.getImage(`/SUCAI/S10DB/${id}-1.png`);
                if (raw) cache.attackSprites.push(await this.processImage(raw));
            }
            for (const id of def.deathIds) {
                const raw = AssetLoader.getImage(`/SUCAI/S10DB/${id}-1.png`);
                if (raw) cache.deathSprites.push(await this.processImage(raw));
            }
            cache.loaded = true;
            gameLog('unit', `🔨 攻城器械 ${type} 加载完成`);
        } finally {
            cache.loading = false;
        }
    }

    public static async preload(): Promise<void> {
        if (this.isLoaded) return;
        if (this.loadingPromise) return this.loadingPromise;
        this.loadingPromise = this._doPreload();
        try {
            await this.loadingPromise;
        } finally {
            this.loadingPromise = null;
        }
    }

    private static async _doPreload(): Promise<void> {

        // [PERF-FIX] 分批 + 每批让出主线程
        // 原版用 Promise.all 把一个 unit type 的所有动画帧 (5-15 套动画 × 4-8 帧)
        // 一次 processImage —— 每张都是同步 getImageData + 像素循环 + putImageData
        // + toDataURL (浏览器最慢的 API 之一)。这是和 preloadFlags 同等量级的主线程
        // 杀手，且在 GameApp.start 里两者还并发。
        //
        // 后台标签时跳过 yield —— setTimeout 在后台被钳制到 1000ms，几十个 yield 累计
        // 几十秒会让"切走再回来"启动慢到几分钟。后台时反正没人看 UI，
        // 同步连跑最快完成。前台时维持 yield 避免主线程卡死。
        const yieldMain = () => document.hidden
            ? Promise.resolve()
            : new Promise<void>(r => setTimeout(r, 0));
        const PROC_BATCH = 4;

        const loadBatch = async (sourcePaths: readonly string[], targetArray: HTMLImageElement[]) => {
            await AssetLoader.preloadImages([...sourcePaths]);
            // 分批 processImage 而不是一把梭，每批之间 yield
            for (let i = 0; i < sourcePaths.length; i += PROC_BATCH) {
                const slice = sourcePaths.slice(i, i + PROC_BATCH);
                await Promise.all(slice.map(async (path, batchIdx) => {
                    const realIdx = i + batchIdx;
                    const img = AssetLoader.getImage(path);
                    if (img) {
                        const processed = await this.processImage(img);
                        targetArray[realIdx] = processed;
                    }
                }));
                if (i + PROC_BATCH < sourcePaths.length) {
                    await yieldMain();
                }
            }
        };

        gameLog('unit', '🔄 LegionPhalanxDrawer: Processing Dynamic Unit Assets...');

        // 1. Load Generic / Legacy Assets (if needed)
        // ...

        // 2. Load Granular Unit Assets from GameConfig.UNIT_ASSETS
        const unitAssets = SPRITE_PATHS.UNIT_ASSETS as any;
        if (unitAssets) {
            for (const [key, assets] of Object.entries(unitAssets)) {
                if (LAZY_BOOT_UNIT_IDS.has(key)) continue;
                const config = assets as any;
                const cacheEntry = {
                    MOVE: [] as HTMLImageElement[],
                    ATTACK: [] as HTMLImageElement[],
                    IDLE: [] as HTMLImageElement[],
                    DAMAGE: [] as HTMLImageElement[],
                    DEATH: [] as HTMLImageElement[],
                    SHOOT: [] as HTMLImageElement[],  // [NEW] For mounted archers
                    CHARGE: [] as HTMLImageElement[], // [NEW] For cavalry charge animation
                    SECONDARY: config.SECONDARY ? {
                        MOVE: [] as HTMLImageElement[],
                        ATTACK: [] as HTMLImageElement[],
                        IDLE: [] as HTMLImageElement[],
                        DAMAGE: [] as HTMLImageElement[],

                        DEATH: [] as HTMLImageElement[],
                        SHOOT: [] as HTMLImageElement[],
                        CHARGE: [] as HTMLImageElement[] // [NEW] Added CHARGE support for Secondary
                    } : undefined,
                    TERTIARY: config.TERTIARY ? {
                        MOVE: [] as HTMLImageElement[],
                        ATTACK: [] as HTMLImageElement[],
                        IDLE: [] as HTMLImageElement[],
                        DAMAGE: [] as HTMLImageElement[],
                        DEATH: [] as HTMLImageElement[],
                        SHOOT: [] as HTMLImageElement[]
                    } : undefined
                };

                // 🔴 AoE2 DE 动态帧框：读 `_meta.json`（帧数 + 每方向 box 尺寸/hotspot 偏移），渲染走 hotspot 对齐。
                const _firstUrl: string = (config.MOVE?.[0] ?? config.ATTACK?.[0] ?? config.IDLE?.[0] ?? config.DEATH?.[0] ?? '') as string;
                if (typeof _firstUrl === 'string' && DE_DYN_DIRS.some(dir => _firstUrl.includes(dir))) {
                    const _dir = _firstUrl.substring(0, _firstUrl.lastIndexOf('/') + 1);
                    const dyn = await LegionPhalanxDrawer.loadDynMeta(_dir);
                    if (dyn) (cacheEntry as any).dyn = dyn;
                }

                const promises = [
                    loadBatch(config.MOVE, cacheEntry.MOVE),
                    loadBatch(config.ATTACK, cacheEntry.ATTACK),
                    loadBatch(config.IDLE, cacheEntry.IDLE),
                    loadBatch(config.DAMAGE, cacheEntry.DAMAGE),
                    loadBatch(config.DEATH, cacheEntry.DEATH),
                ];

                // [NEW] Load SHOOT and CHARGE if available
                if (config.SHOOT) {
                    promises.push(loadBatch(config.SHOOT, cacheEntry.SHOOT));
                }
                if (config.CHARGE) {
                    promises.push(loadBatch(config.CHARGE, cacheEntry.CHARGE));
                }

                if (config.SECONDARY && cacheEntry.SECONDARY) {
                    promises.push(loadBatch(config.SECONDARY.MOVE, cacheEntry.SECONDARY.MOVE));
                    promises.push(loadBatch(config.SECONDARY.ATTACK, cacheEntry.SECONDARY.ATTACK));
                    promises.push(loadBatch(config.SECONDARY.IDLE, cacheEntry.SECONDARY.IDLE));
                    promises.push(loadBatch(config.SECONDARY.DAMAGE, cacheEntry.SECONDARY.DAMAGE));
                    promises.push(loadBatch(config.SECONDARY.DEATH, cacheEntry.SECONDARY.DEATH));
                    if (config.SECONDARY.SHOOT) {
                        promises.push(loadBatch(config.SECONDARY.SHOOT, cacheEntry.SECONDARY.SHOOT));
                    }
                    if (config.SECONDARY.CHARGE) {
                        promises.push(loadBatch(config.SECONDARY.CHARGE, cacheEntry.SECONDARY.CHARGE));
                    }

                }

                // [NEW] TERTIARY Support (for 3-tier formations like Mixed)
                if (config.TERTIARY && (cacheEntry as any).TERTIARY) {
                    const tert = (cacheEntry as any).TERTIARY;
                    promises.push(loadBatch(config.TERTIARY.MOVE, tert.MOVE));
                    promises.push(loadBatch(config.TERTIARY.ATTACK, tert.ATTACK));
                    promises.push(loadBatch(config.TERTIARY.IDLE, tert.IDLE));
                    promises.push(loadBatch(config.TERTIARY.DAMAGE, tert.DAMAGE));
                    promises.push(loadBatch(config.TERTIARY.DEATH, tert.DEATH));
                    if (config.TERTIARY.SHOOT) {
                        promises.push(loadBatch(config.TERTIARY.SHOOT, tert.SHOOT));
                    }
                }

                await Promise.all(promises);
                this.unitSpriteCache.set(key, cacheEntry);
                // [PERF] 每个 unit type 处理完再让一次主线程，
                // 避免连续多个 unit type 紧挨着跑（即使内部已经分批）
                await yieldMain();
            }
        }


        await GeneralDrawer.preload();

        // 预载攻城器械素材（避免首次攻城时懒加载延迟）
        gameLog('unit', '🔨 预载攻城器械素材...');
        for (const gearType of Object.keys(LegionPhalanxDrawer.SIEGE_GEAR_DEFS)) {
            await LegionPhalanxDrawer.ensureSiegeGearLoaded(gearType);
        }

        this.isLoaded = true;
        gameLog('unit', '✅ LegionPhalanxDrawer: All dynamic unit assets loaded.');
    }

    // ─── 船贴图懒加载（2026-06-12 修复）────────────────────────────
    // LAZY_BOOT_UNIT_IDS 当年只做了"启动跳过"没做"事后加载"，
    // unitSpriteCache 永远没有三种船 → drawNaval 永远早退 → 船从不显示。
    // 现在由 drawNaval 首次被调用时触发后台加载（与 _doPreload 同样的分批 + 抠绿流程）。
    private static navalLoadStarted = false;

    private static ensureNavalAssetsLoading(): void {
        if (this.navalLoadStarted) return;
        this.navalLoadStarted = true;
        void this._loadNavalAssets().catch((e) => {
            gameLog('unit', '❌ 船贴图懒加载失败', e);
            this.navalLoadStarted = false; // 允许下次重试
        });
    }

    private static async _loadNavalAssets(): Promise<void> {
        const yieldMain = () => document.hidden
            ? Promise.resolve()
            : new Promise<void>(r => setTimeout(r, 0));
        const PROC_BATCH = 4;

        const loadBatch = async (sourcePaths: readonly string[], targetArray: HTMLImageElement[]) => {
            await AssetLoader.preloadImages([...sourcePaths]);
            for (let i = 0; i < sourcePaths.length; i += PROC_BATCH) {
                const slice = sourcePaths.slice(i, i + PROC_BATCH);
                await Promise.all(slice.map(async (path, batchIdx) => {
                    const img = AssetLoader.getImage(path);
                    if (img) {
                        targetArray[i + batchIdx] = await this.processImage(img);
                    }
                }));
                if (i + PROC_BATCH < sourcePaths.length) await yieldMain();
            }
        };

        const unitAssets = SPRITE_PATHS.UNIT_ASSETS as any;
        for (const key of LAZY_BOOT_UNIT_IDS) {
            const config = unitAssets?.[key];
            if (!config || this.unitSpriteCache.has(key)) continue;

            const cacheEntry = {
                MOVE: [] as HTMLImageElement[],
                ATTACK: [] as HTMLImageElement[],
                IDLE: [] as HTMLImageElement[],
                DAMAGE: [] as HTMLImageElement[],
                DEATH: [] as HTMLImageElement[],
            };
            await Promise.all([
                loadBatch(config.MOVE, cacheEntry.MOVE),
                loadBatch(config.ATTACK, cacheEntry.ATTACK),
                loadBatch(config.IDLE, cacheEntry.IDLE),
                loadBatch(config.DAMAGE, cacheEntry.DAMAGE),
                loadBatch(config.DEATH, cacheEntry.DEATH),
            ]);
            this.unitSpriteCache.set(key, cacheEntry);
            await yieldMain();
        }
        gameLog('unit', '⛵ 船贴图懒加载完成（<2万 / 2-5万 / ≥5万 三档）');
    }

    /**
     * 抠绿结果按源图 URL 缓存。
     * [PERF 2026-08-05] S10DB 帧被多个 unit type 共用（如 154-161 被 8 个单位各引一次），
     * 开局 42 个单位共发起 2416 次 processImage，去重后只有 600 张不同的图 —— 75% 是重复劳动，
     * 每次都要 getImageData + 像素环 + putImageData + toDataURL + 二次 decode。
     * AssetLoader 只对下载去重、不对处理结果去重，所以缓存放在这一层。
     * 产物只作 drawImage 源使用（只读），多处共享同一个 HTMLImageElement 是安全的。
     */
    private static processedBySrc = new Map<string, Promise<HTMLImageElement>>();

    private static processImage(img: HTMLImageElement): Promise<HTMLImageElement> {
        // 未就绪的图走原路返回且不入缓存 —— 否则会把没抠绿的原图永久钉死在缓存里
        if (!img.complete || img.naturalWidth === 0) return Promise.resolve(img);
        const key = img.src;
        if (!key) return this.doProcessImage(img);
        const hit = this.processedBySrc.get(key);
        if (hit) return hit;
        const pending = this.doProcessImage(img);
        this.processedBySrc.set(key, pending);
        return pending;
    }

    private static doProcessImage(img: HTMLImageElement): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            if (!img.complete || img.naturalWidth === 0) { resolve(img); return; }
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(img); return; }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 1] > 200 && data[i] < 100 && data[i + 2] < 100) data[i + 3] = 0;
            }
            ctx.putImageData(imageData, 0, 0);
            const newImg = new Image();
            // [2026-08-15 玩家色遮罩] 抠绿后 src 变 data: URL，丢失原始路径；
            // 保留 sourceUrl 供 SpriteTinter 推导同目录 `.pc.png` 遮罩（帝国决定 DE 素材）。
            (newImg as any).sourceUrl = img.src;
            newImg.onload = () => resolve(newImg);
            newImg.src = canvas.toDataURL();
        });
    }

    // [New Standard] 3x3 Grid Offset


    // [POOLED RENDERING] Reuse objects to reduce GC
    private static renderPool: { y: number, drawParams: any }[] = [];
    private static poolIndex = 0;

    // [OFFSET CACHING] Cache grid calculations
    // Key: `${index}_${rows}_${cols}_${spacingX}_${spacingY}_${direction}`
    private static offsetCache: Map<string, { x: number, y: number }> = new Map();

    private static getPooledItem(): { y: number, drawParams: any } {
        if (this.poolIndex >= this.renderPool.length) {
            this.renderPool.push({
                y: 0,
                drawParams: {
                    img: null,
                    sx: 0, sy: 0, sw: 0, sh: 0,
                    dx: 0, dy: 0, dw: 0, dh: 0,
                    alpha: 1, scale: 1 // [NEW] Supports opacity and scale
                }
            });
        }
        return this.renderPool[this.poolIndex++];
    }
    private static resetPool(): void {
        this.poolIndex = 0;
    }

    public static resetUnit(unitId: string): void {
        LegionPhalanxStateManager.reset(unitId);
        this.clearSiegeSoldierMaps(unitId);
        // 攻城器械 deathThresholds / spawn / fade 故意保留：
        // 战终后仍靠 wasSiegeUnit 继续画 4s 渐隐；真正清理由 clearSiegeGearState。
    }

    /** 攻城器械相关 Map 全清（渐隐结束 / 单位注销） */
    public static clearSiegeGearState(unitId: string): void {
        this.gearSpawnTicks.delete(unitId);
        this.gearFadeOutStarts.delete(unitId);
        this.gearShuffle.delete(unitId);
        for (const cache of this.siegeGearCaches.values()) {
            cache.deathStarts?.delete(unitId);
            cache.deathThresholds?.delete(unitId);
        }
    }

    /** 单位从渲染器移除：方阵 + 器械状态一并释放 */
    public static disposeUnit(unitId: string): void {
        this.resetUnit(unitId);
        this.clearSiegeGearState(unitId);
        this.resetNavalDeath(unitId);
        NavalPhalanxStateManager.dispose(unitId);
    }

    // [NEW] Helper: Get Frame Count based on Aspect Ratio
    private static getFrameCount(img: HTMLImageElement | null): number {
        if (!img || img.naturalWidth === 0) return 1;
        // If width approx equals height (< 2x), it's single frame (S10DB/NPC)
        if (img.naturalWidth < img.naturalHeight * 2) return 1;
        // 帧数 = 宽/高（每帧正方形）：S10DB 8 帧不变；AoE2 全帧（30~60）也支持（2026-08-15 修「少帧」）
        return Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
    }

    /**
     * 方阵微动参数（2026-07-18 主人定：只动方阵绘制层，行军 bob + 待机 sway）
     * 振幅按 scale 缩放：直播远观（scale<1）自动收敛为微光感，近看才有明显起伏。
     */
    private static readonly MICRO_MOTION = {
        SWAY_AMP: 0.7,          // 待机呼吸振幅（px，scale=1 基准）
        SWAY_SPEED: 0.0011,     // 待机呼吸角速度（rad/ms，≈5.7s 一次呼吸）
        BOB_INF_AMP: 1.5,       // 步兵行军起伏振幅
        BOB_INF_SPEED: 0.0052,  // 步兵步频：对齐 150ms×8 帧步态循环（约每步一伏）
        BOB_CAV_AMP: 1.4,       // 骑兵起伏振幅
        BOB_CAV_SPEED: 0.0078,  // 骑兵步频：快而碎（小跑）
        BOB_ELE_AMP: 2.0,       // 象兵起伏振幅：更沉
        BOB_ELE_SPEED: 0.0039,  // 象兵步频：更稳
    } as const;

    /**
     * 方阵微动偏移：待机/交战 sway（双轴错相呼吸漂移），行军 bob（按兵种分频的步态起伏）。
     * 逐 slot 错开相位，避免整阵同频"僵尸共振"。纯函数只读 tick，不改任何游戏状态。
     */
    private static getMicroMotion(
        slotIndex: number,
        state: PhalanxAnimState,
        unitType: string,
        tick: number,
        scale: number,
    ): { dx: number; dy: number } {
        const MM = LegionPhalanxDrawer.MICRO_MOTION;
        const phase = slotIndex * 0.9;

        if (state === 'MOVE') {
            const isElephant = unitType.includes('elephant');
            // 与上方骑兵冲锋同一判定：弓骑/枪骑算骑，步弓/弩不算
            const isCavalry = !isElephant && (
                (unitType.includes('cavalry') ||
                    unitType === 'lancer' ||
                    unitType === 'general_cavalry' ||
                    unitType === 'horse_archer') &&
                unitType !== 'archer' &&
                unitType !== 'crossbow'
            );
            const amp = isElephant ? MM.BOB_ELE_AMP : isCavalry ? MM.BOB_CAV_AMP : MM.BOB_INF_AMP;
            const speed = isElephant ? MM.BOB_ELE_SPEED : isCavalry ? MM.BOB_CAV_SPEED : MM.BOB_INF_SPEED;
            return { dx: 0, dy: Math.sin(tick * speed + phase) * -amp * scale };
        }

        if (state === 'DEATH') return { dx: 0, dy: 0 };

        // IDLE / ATTACK / DAMAGE：双轴呼吸漂移（x、y 频率错开，避免圆周式机械感）
        const amp = MM.SWAY_AMP * scale;
        const t = tick * MM.SWAY_SPEED + phase;
        return { dx: Math.sin(t) * amp, dy: Math.cos(t * 0.83) * amp * 0.7 };
    }

    /**
     * Draw a Legion Phalanx (3x3 Grid or Hex)
     */
    public static draw(
        unitId: string,
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        troops: number,
        tick: number = 0,
        hasGeneral: boolean = false,
        isFighting: boolean = false,
        projectFn?: (lat: number, lng: number) => { x: number, y: number },
        unprojectFn?: (x: number, y: number) => { lat: number, lng: number },
        legionType: LegionType = 'infantry',
        factionId: string = 'zhonghua',
        cultureSlots: string[] | null = null,
        unitAssetsId: string = 'light_infantry',
        isPlayer: boolean = false, // [NEW] Identify plain player units
        cultureScales: number[] | null = null, // [NEW] Custom scales
        denseFront: boolean = false, // [2026-08-09 13场景阵型] 第一排 3 步兵 → 3 组 2×4（每组 8 个），贴图/动画沿用原 slot
        /** [2026-08-09 编队独立移动] 9 个格位（编队）各自的额外屏幕偏移（像素），旋转前叠加随 direction 转。
         *  每个编队独立推进时由渲染层传入，静止/非场景为 null → 与改动前逐像素一致。 */
        squadOffsets: readonly { x: number; y: number }[] | null = null,
        /** [2026-08-09 编队独立战斗] 9 个格位各自的动作状态（MOVE/ATTACK/IDLE）；null = 整军 state。
         *  仅覆盖常规动作选择，整军 DEATH/DAMAGE 仍优先（编队级不覆盖死亡/受击）。 */
        squadStates: readonly (string | null)[] | null = null,
        /** [2026-08-09 编队级朝向] 9 个格位各自的朝向（0-7，面向自己的目标）；null = 整军 direction。
         *  默认不传 → 其他 zoom 与改动前逐像素一致。 */
        squadDirections: readonly number[] | null = null
    ): void {
        if (!this.isLoaded) return;

        // --- 1. SETUP & CONFIG ---
        // [CLEANED] Data-driven: cultureSlots defines count. No more hardcoded legionType checks.
        let count = 9; // Default for 3x3
        let gridSize = 3; // Default 3x3
        let isTriangleFormation = false;

        // Priority 1: Use cultureSlots length (from editor / CultureFormations.ts)
        if (cultureSlots && cultureSlots.length > 0) {
            count = cultureSlots.length;
            isTriangleFormation = count === 6;
            gridSize = 3;
            if (!isTriangleFormation) {
                gridSize = Math.ceil(Math.sqrt(count));
            }
        } else {
            // Priority 2: Try legacy getCompositionTier fallback
            const tier = getCompositionTier(troops, legionType);
            if (tier) {
                gridSize = tier.gridSize;
                count = gridSize * gridSize;
            }
            if (LegionPhalanxDrawer.PURE_CAVALRY_LEGION_TYPES.includes(legionType)) {
                count = 6;
                isTriangleFormation = true;
                gridSize = 3;
            }
        }

        const rows = gridSize;
        const cols = gridSize;

        // Retrieve Asset Cache
        let assets = this.unitSpriteCache.get(unitAssetsId);

        if (!assets) {
            assets = this.unitSpriteCache.get(legionType);
        }
        if (!assets) {
            assets = this.unitSpriteCache.get('mixed');
        }
        if (!assets) {
            assets = this.unitSpriteCache.get('light_infantry');
        }
        if (!assets) {
            console.error(`❌ [LPD] CRITICAL: No assets found for ${unitAssetsId} / ${legionType}. Rendering Aborted.`);
            return;
        }

        // Base Dimension Reference (from Primary Idle)
        const refSprite = assets.IDLE[direction] || assets.IDLE[0];
        if (!refSprite) return;

        const refTotalFrames = this.getFrameCount(refSprite);
        const baseHeight = 75; // Standard size for all units

        // [DYNAMIC RATIO]
        // Do NOT force unitRatio here. We calculate it per-sprite in the loop.
        // We just need a rough spacing estimation here.
        // Assuming typical sprite is roughly square-ish or 0.8 ratio.
        const estRatio = 0.8;
        const renderH = baseHeight * scale;
        const estRenderW = renderH * estRatio;

        // Spacing based on estimated width
        // [3x3 TUNED] Balanced spacing - not too dense, not too loose
        let spacingX = estRenderW * 0.50;
        let spacingY = renderH * 0.42;

        // [2026-08-09 13场景阵型] 主阵 3×3 间距放大到「编队占位尺寸」：
        // 9 个格位 = 9 个编队锚点，按比例分开，避免 8人/6人编队互相重叠（主人截图实锤「9个编队挤在一起」）。
        // 步兵编队最宽（4 列交错并集 ≈ 3.5×0.75 = 2.625 兵宽），主阵间距须大于它并留缝：
        //   squadW = 4.0 兵宽（编队 2.625 + 缝 ≈ 1.4 兵宽）
        //   squadH = 1.6 兵高（编队 2 排深 1.0 + 缝 ≈ 0.6）
        if (denseFront) {
            const dense = LegionPhalanxDrawer.computeDenseSpacing(
                refSprite, refTotalFrames, scale, cultureScales,
            );
            spacingX = dense.x;
            spacingY = dense.y;
        }

        // --- 2. UPDATE STATE ---
        // 全局 DEATH（整军覆灭尸体）：对齐水军——不因 isFighting=false 走和平补员/清态；
        // 用 isFighting=true 保住战中槽位，由下方 DEATH 分支画尸体，保留 CORPSE_DISPLAY_MS。
        // [2026-08-09 阵亡位置] 位置回调叠加编队推进偏移（squadOffsets 旋转前 → 转屏幕）：
        // 否则编队推进后阵亡，deadLat/deadLng 还是「原地」位置，尸体倒在没推进的原地（主人实锤）。
        const currentState = LegionPhalanxStateManager.update(
            unitId, troops, rows, cols, count, direction, tick,
            isFighting || state === 'DEATH',
            center, unprojectFn,
            (idx) => {
                const baseOff = this.getFormationOffset(idx, spacingX, spacingY, direction, legionType, rows, isTriangleFormation);
                const squadOff = squadOffsets && squadOffsets[idx];
                if (!squadOff) return baseOff;
                const sa = (direction + 1) * Math.PI / 4;
                const sc = Math.cos(sa);
                const ss = Math.sin(sa);
                return {
                    x: baseOff.x + squadOff.x * sc - squadOff.y * ss,
                    y: baseOff.y + squadOff.x * ss + squadOff.y * sc,
                };
            },
            // [2026-08-09 编队级阵亡] 13 场景（denseFront）：关闭整军随机侵蚀，
            // 槽位死亡改由 squadStates[i]='DEATH' 逐编队驱动（见下方 effState==='DEATH' 分支）。
            // 8/9/10 denseFront=false → skipErosion=false → 整军侵蚀逐像素不变。
            denseFront,
        );

        // 整军 DEATH 且兵力归零：残留 ALIVE 格一并标死，避免只画「活着的站桩」
        if (state === 'DEATH' && troops <= 0) {
            for (const slot of currentState.slots) {
                if (slot.state === 'ALIVE') {
                    slot.state = 'DYING';
                    if (slot.deathDirection === undefined) {
                        slot.deathDirection = Math.floor(Math.random() * 8);
                    }
                    slot.stateStartTime = tick;
                }
            }
        }

        this.resetPool();
        const activeItems: { y: number, drawParams: any }[] = [];
        const totalSlots = currentState.slots.length;

        // --- 3. RENDER LOOP ---
        // [NEW] Spawn Animation Progress（整军 DEATH 尸体不走出场渐显，避免「先全透明」像直接消失）
        const spawnDuration = 800;
        const timeAlive = tick - (currentState.spawnTick || 0);
        const isSpawning = state !== 'DEATH' && timeAlive < spawnDuration && timeAlive >= 0;

        // B. Select Sprite Set & Identify Unit Type (Moved Up for Logic)
        for (let i = 0; i < totalSlots; i++) {
            const slot = currentState.slots[i];
            // [2026-08-09 编队独立战斗] 编队级动作/朝向：squadStates/squadDirections 逐格位覆盖；
            // 整军 DEATH/DAMAGE 仍优先（编队级不覆盖死亡/受击）。默认 null → 整军 state/direction，其他 zoom 不变。
            const effState: PhalanxAnimState = (state === 'DEATH' || state === 'DAMAGE')
                ? state
                : ((squadStates?.[i] ?? state) as PhalanxAnimState);
            const effDir = squadDirections?.[i] ?? direction;
            // [2026-08-10] 13 场景槽位生死的**唯一权威**是编队级 squadStates（整军侵蚀/复活已门控关闭）。
            // 这里补上「编队活着但槽位还是尸体」的回正：进 13 之前在 8/9/10 被整军侵蚀杀掉的槽位，
            // 若不回正就永远缺人（复活逻辑已随侵蚀一起关掉，不会再帮忙补）。
            if (denseFront && squadStates && squadStates[i] && squadStates[i] !== 'DEATH'
                && state !== 'DEATH' && slot.state !== 'ALIVE') {
                slot.state = 'ALIVE';
                slot.stateStartTime = tick;
                slot.deathDirection = undefined;
                slot.deadOffsetX = undefined;
                slot.deadOffsetY = undefined;
                slot.deadLat = undefined;
                slot.deadLng = undefined;
            }
            let currentSet = assets;
            let resolvedUnitType = unitAssetsId; // Default
            let isMixed = false; // [FIX] Declared at loop scope for combat crowding logic

            // [NEW] 14-culture formation slots override
            if (cultureSlots && i < cultureSlots.length) {
                resolvedUnitType = cultureSlots[i];
                currentSet = this.unitSpriteCache.get(resolvedUnitType) || assets;
            } else {
                // [GENERIC FALLBACK] 
                // If no cultureSlots are defined (e.g. legacy or unconfigured army),
                // attempt to resolve via generic getCompositionTier data structure.
                const tier = getCompositionTier(troops, legionType);
                if (tier) {
                    const expandedSlots = expandCompositionSlots(tier.slots);
                    resolvedUnitType = expandedSlots[i] || unitAssetsId;
                    currentSet = this.unitSpriteCache.get(resolvedUnitType) || assets;
                }
            }

            // A. Calculate Position
            let drawX: number, drawY: number;
            let dynamicScale = 1.0;
            let dynamicAlpha = 1.0;

            // [NEW] Spawn Animation
            if (isSpawning) {
                const cx = (cols - 1) / 2;
                const cy = (rows - 1) / 2;
                const r = Math.floor(i / cols);
                const c = i % cols;
                const dist = Math.sqrt((r - cy) ** 2 + (c - cx) ** 2);

                const delay = dist * 50;
                const unitTime = timeAlive - delay;

                if (unitTime < 0) {
                    dynamicScale = 0;
                    dynamicAlpha = 0;
                } else {
                    const progress = Math.min(1, unitTime / 400);
                    const back = (t: number) => {
                        const c1 = 1.70158;
                        const c3 = c1 + 1;
                        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                    };
                    dynamicScale = back(progress);
                    dynamicAlpha = progress;
                }
            } else {
                dynamicScale = 1.0;
                dynamicAlpha = 1.0;
            }

            // Skip if invisible
            if (dynamicAlpha <= 0.01) continue;

            const baseOffset = this.getFormationOffset(i, spacingX, spacingY, direction, legionType, rows, isTriangleFormation);
            // [2026-08-09 编队独立移动] 每编队独立推进偏移（像素，旋转前叠加随 direction 转）：
            // getFormationOffset 有缓存（key 不含偏移），返回的是共享对象 → 只读，另建新对象叠加。
            let drawOffset = baseOffset;
            const squadOff = squadOffsets && squadOffsets[i];
            if (squadOff) {
                const sa = (direction + 1) * Math.PI / 4;
                const sc = Math.cos(sa);
                const ss = Math.sin(sa);
                drawOffset = {
                    x: baseOffset.x + squadOff.x * sc - squadOff.y * ss,
                    y: baseOffset.y + squadOff.x * ss + squadOff.y * sc,
                };
            }
            drawX = center.x + drawOffset.x;
            drawY = center.y + drawOffset.y;

            if ((slot.state === 'DEAD' || slot.state === 'DYING') && slot.deadLat && slot.deadLng && projectFn) {
                const proj = projectFn(slot.deadLat, slot.deadLng);
                drawX = proj.x;
                drawY = proj.y;
            } else if (isFighting && slot.state !== 'DEAD' && slot.state !== 'DYING') {

                // [2026-08-09 13场景阵型] 13 战斗场景不要骑兵冲锋位移特效（主人定）：
                // 全军待命定格，骑兵不许前后 surge 位移。跳过 2. CAVALRY CHARGE 整段。
                if (!denseFront) {
                // 2. CAVALRY CHARGE (Refined with resolvedUnitType)
                // Identify if this unit IS a cavalry type unit
                const isCavalryUnit =
                    (resolvedUnitType.includes('cavalry') ||
                    resolvedUnitType === 'lancer' ||
                    resolvedUnitType === 'general_cavalry' ||
                    resolvedUnitType === 'horse_archer') &&
                    resolvedUnitType !== 'archer' &&
                    resolvedUnitType !== 'crossbow';

                // Only charge if it IS cavalry, AND we are in a mixed/cavalry context
                // (Pure infantry shouldn't charge even if they have cavalry name? No, sticking to intent)
                // The intent: "Cavalry rows in mixed formations or pure cavalry should charge"

                if (isCavalryUnit) {
                    const cycleDur = 2000;
                    const unitPhase = (i * 0.35) * 1000;
                    const phase = ((tick + unitPhase) % cycleDur) / cycleDur;

                    const formationAngle = (direction + 1) * Math.PI / 4;
                    const chargeAngle = formationAngle - Math.PI / 2;

                    // Rank Multiplier Logic
                    let rankMultiplier = 0.5;
                    // Simple heuristic: Further back = larger surge to pass front
                    const rowIdx = isTriangleFormation
                        ? (LegionPhalanxDrawer.TRIANGLE_LAYOUT[i]?.r ?? 2)
                        : Math.floor(i / cols);
                    if (rowIdx === 0) rankMultiplier = 0.3;
                    else if (rowIdx === 1) rankMultiplier = 0.8;
                    else if (rowIdx >= 2) rankMultiplier = 1.2;

                    const baseSurge = spacingY * 1.2;
                    const chargeRange = baseSurge * rankMultiplier;

                    const rawSin = Math.sin(phase * Math.PI * 2);
                    let surgeFactor = rawSin;
                    if (surgeFactor < 0) surgeFactor *= 0.2;

                    drawX += Math.cos(chargeAngle) * (surgeFactor * chargeRange);
                    drawY += Math.sin(chargeAngle) * (surgeFactor * chargeRange);

                    if (surgeFactor > 0) {
                        dynamicScale = 1.0 + (surgeFactor * 0.10);
                    }
                }
                }

                // 3. JITTER
                // 【2026-08-10 修】13 场景（denseFront）跳过 jitter：主阵间距被放大到编队占位
                // （spacingX ≈ 4 兵宽 ≈ 400px）后，jitterAmt = 8×(spacingX/35) ≈ 91px，
                // 比步兵列距（75px）还大 → 子兵被随机打散、兵与兵交叉重叠，
                // 编队视觉中心偏离锚点（主人实锤「锚点交叉」）。
                // 13 演出档要的是围绕编队中心的严格对称排列；8/9/10 denseFront=false 不变。
                const jitterAmt = denseFront ? 0 : 8 * (spacingX / 35);
                const seed = (i * 9301 + 49297) % 233280;
                const rnd = seed / 233280.0;
                drawX += (rnd - 0.5) * jitterAmt;
                drawY += ((1.0 - rnd) - 0.5) * jitterAmt;
            }

            // 3.5 方阵微动（2026-07-18 主人定：行军 bob + 待机 sway，全项目只此一处）
            // 仅活体士兵；尸体保持静止，出生渐显期不叠加（缩放入场本身已足够动感）
            if (slot.state === 'ALIVE' && !isSpawning) {
                // [2026-08-09 编队独立战斗] 微动按编队级状态（推进中走 bob，到位 sway）
                const mm = LegionPhalanxDrawer.getMicroMotion(i, effState, resolvedUnitType, tick, scale);
                drawX += mm.dx;
                drawY += mm.dy;
            }

            // C. Select Specific Sprite based on State
            // (Note: currentSet is already selected above)
            let rawSprite: HTMLImageElement | undefined;
            let animState = state; // Default to global state

            if (slot.state === 'DYING' || slot.state === 'DEAD') {
                const deathDir = slot.deathDirection ?? direction;
                rawSprite = currentSet.DEATH[deathDir] || currentSet.DEATH[0];
                animState = 'DEATH';
            } else if (state === 'DEATH') {
                // [2026-05-30] 全局 DEATH 状态 (ArmyEditor 预览用)
                // 每兵真随机朝向 (Math.random) + 起始时间
                // slot.deathDirection 设一次后缓存, 不闪
                if (slot.deathDirection === undefined) {
                    slot.deathDirection = Math.floor(Math.random() * 8);
                    slot.stateStartTime = tick;
                }
                rawSprite = currentSet.DEATH[slot.deathDirection] || currentSet.DEATH[0];
                animState = 'DEATH';
            } else if (effState === 'DEATH') {
                // [2026-08-09 编队级阵亡] 编队独立死亡：首次进入把槽位转 DYING
                // （设死亡朝向/起始帧），后续帧走 slot DYING/DEAD 分支播死亡动画 +
                // 尸体保留——与整军侵蚀死亡同构。死亡位置 = 当前位置（drawX/drawY 已含
                // squadOffsets 推进偏移，未设 deadLat 时 950 行直接用当前坐标画尸体）。
                if (slot.state === 'ALIVE') {
                    slot.state = 'DYING';
                    slot.stateStartTime = tick;
                    slot.deathDirection = Math.floor(Math.random() * 8);
                    // 【2026-08-10 修】尸体必须钉在**地面世界坐标**，与侵蚀死亡同一套（见 LegionPhalanxState
                    // 的 deadLat/deadLng）。原来只改 slot.state，954 行的锚定条件不成立 → 尸体退回
                    // 「军团 center + 冻结偏移」，军团一动尸体就跟着飘走（主人此前实锤过同类问题）。
                    // drawX/drawY 已含本编队推进偏移，倒在推进到的位置，不是出发点。
                    if (unprojectFn) {
                        const world = unprojectFn(drawX, drawY);
                        slot.deadLat = world.lat;
                        slot.deadLng = world.lng;
                        slot.deadOffsetX = drawX - center.x;
                        slot.deadOffsetY = drawY - center.y;
                    }
                }
                const deathDir = slot.deathDirection ?? direction;
                rawSprite = currentSet.DEATH[deathDir] || currentSet.DEATH[0];
                animState = 'DEATH';
            } else if (effState === 'DAMAGE') {
                animState = 'DAMAGE';
                rawSprite = currentSet.DAMAGE[effDir] || currentSet.DAMAGE[0];
            } else if (effState === 'ATTACK') {
                // [2026-08-10 修·动作定格] animState 必须跟随编队级状态——它驱动下方帧循环，
                // 漏设时整军兜底 IDLE 会把攻击/移动动画锁死在第 0 帧（主人实锤「没有动作」）。
                animState = 'ATTACK';
                // [2026-08-09 消失修复·进入条件] 轮播只在 SHOOT/CHARGE「本方向帧真实可用」时进——
                // 原来只看数组非空，元素未加载完(complete=false)时取到无效帧 → 1037 跳过整格消失（主人实锤弓骑闪没）。
                const shootFrame = (currentSet as any).SHOOT?.[effDir] ?? (currentSet as any).SHOOT?.[0];
                const chargeFrame = (currentSet as any).CHARGE?.[effDir] ?? (currentSet as any).CHARGE?.[0];
                if (shootFrame && chargeFrame && shootFrame.complete && chargeFrame.complete) {
                    const cycleDuration = 4000;
                    // [2026-08-10 每个编队单独] 13 场景（denseFront）：轮播加格位相位，
                    // 9 编队按 450ms 间隔铺满一圈，各自节奏；8/9/10 denseFront=false → 纯全局 tick 逐像素不变。
                    const cyclePhase = ((tick + (denseFront ? i * 450 : 0)) % cycleDuration) / cycleDuration;
                    if (cyclePhase < 0.25) rawSprite = shootFrame;
                    else if (cyclePhase < 0.50) rawSprite = chargeFrame;
                    else if (cyclePhase < 0.75) rawSprite = currentSet.ATTACK[effDir] || currentSet.ATTACK[0];
                    else rawSprite = shootFrame;
                } else if ((currentSet as any).SHOOT && (currentSet as any).SHOOT.length > 0) {
                    rawSprite = (currentSet as any).SHOOT[effDir] || (currentSet as any).SHOOT[0];
                } else {
                    rawSprite = currentSet.ATTACK[effDir] || currentSet.ATTACK[0];
                }
            } else if (effState === 'MOVE') {
                animState = 'MOVE';
                rawSprite = currentSet.MOVE[effDir] || currentSet.MOVE[0];
            } else {
                animState = 'IDLE';
                rawSprite = currentSet.IDLE[effDir] || currentSet.IDLE[0];
            }

            // Fallback to IDLE if specific action missing
            if (!rawSprite && effState !== 'IDLE') {
                rawSprite = currentSet.IDLE[effDir] || currentSet.IDLE[0];
            }

            // [2026-08-09 消失修复·兜底] 素材未加载完(complete=false / naturalWidth=0)时
            // 退待命帧再试一次——原 1033 兜底只处理「空」，漏掉「加载中」→ 整格消失（主人实锤）。
            // 加载完成自动恢复攻击帧，观众几乎察觉不到。
            if (!rawSprite || !rawSprite.complete || rawSprite.naturalWidth === 0) {
                rawSprite = currentSet.IDLE[direction] || currentSet.IDLE[0];
                if (!rawSprite || !rawSprite.complete || rawSprite.naturalWidth === 0) continue;
            }

            // D. Tinting (Apply Tint)
            // Ideally we cache this, but SpriteTinter has internal cache
            const tintedSprite = SpriteTinter.getTintedSprite(rawSprite, factionId);
            if (!tintedSprite) continue;

            // E. Frame Calculation
            // 🔴 AoE2 DE 动态帧框：帧数/box 尺寸/hotspot 从元数据读；无 dyn = S10DB 正方形帧（getFrameCount）。
            const dynEntry = currentSet.dyn?.[animState];
            // 🔴 [2026-08-15 尸体贴图错乱修复] 死亡动画的朝向是 slot.deathDirection（随机 0-7），
            //    不是编队朝向 effDir。dyn 帧框必须跟着「实际贴图朝向」走——否则 frameW/frameH 用了
            //    错方向的 box（东/西向 120×64 vs 南向 40×112），帧切片 sx=fr*frameW 错位、跨帧切到邻帧内容，
            //    靠旗/身体被切碎、尸体贴图错乱（主人实锤「尸体贴图都不正确」）。
            const dynSpriteDir = animState === 'DEATH' ? (slot.deathDirection ?? direction) : effDir;
            const dynDir = dynEntry?.dirs?.[String(dynSpriteDir)];
            const spriteTotalFrames = dynEntry ? dynEntry.frames : this.getFrameCount(tintedSprite);
            let currentFrameIndex = 0;

            if (slot.state === 'ALIVE') {
                if (animState === 'DEATH') {
                    // [2026-05-30] DEATH 不循环, 播 1 次冻结末帧
                    const startT = slot.stateStartTime || tick;
                    const timeDead = tick - startT;
                    const deathFrame = Math.floor(timeDead / 150);
                    currentFrameIndex = Math.min(deathFrame, spriteTotalFrames - 1);
                } else if (animState === 'MOVE' || animState === 'ATTACK' || animState === 'DAMAGE') {
                    // 帧循环
                    // [2026-08-10 每个编队单独] 13 场景（denseFront）：stagger = i（步长 1 与任何帧数互质，
                    // 相邻编队必不同相，9 格全铺满）；8/9/10 denseFront=false → 原 i*2（4 帧素材只有 2 种相位）逐像素不变。
                    const stagger = denseFront ? i : i * 2;
                    // [2026-08-15 主人：攻击速度提高一倍] 攻击动画帧率 ×2（150ms→75ms/帧），移动/受击保持原速。
                    const frameMs = animState === 'ATTACK' ? 75 : 150;
                    currentFrameIndex = Math.floor((tick / frameMs) + stagger) % spriteTotalFrames;
                } else {
                    // IDLE: Force Frame 0
                    currentFrameIndex = 0;
                }
            } else if (slot.state === 'DYING' || slot.state === 'DEAD') {
                // Death Animation
                if (spriteTotalFrames === 1) {
                    currentFrameIndex = 0; // Single frame corpse
                } else {
                    const timeDead = tick - slot.stateStartTime;
                    const deathFrame = Math.floor(timeDead / 150);
                    currentFrameIndex = Math.min(deathFrame, spriteTotalFrames - 1);
                }

                // Transition to fully DEAD if anim done
                if (currentFrameIndex >= spriteTotalFrames - 1) {
                    slot.state = 'DEAD';
                }
            }

            // F. Prepare Draw
            // 🔴 AoE2 DE 动态帧框（hotspot 对齐）：帧宽/帧高/hotspot 从元数据读，统一缩放 s，hotspot 对齐单位位置。
            //    S10DB 正方形帧：帧宽=宽/帧数，中心对齐（原逻辑不变）。
            const frameW = dynDir ? dynDir.fw : tintedSprite.width / spriteTotalFrames;
            const frameH = dynDir ? dynDir.fh : tintedSprite.height;
            const frameCol = currentFrameIndex;

            // Pool Item
            const item = this.getPooledItem();
            item.y = drawY + renderH / 2;

            item.drawParams.img = tintedSprite;
            item.drawParams.sx = frameCol * frameW;
            item.drawParams.sy = 0;
            item.drawParams.sw = frameW;
            item.drawParams.sh = frameH;
            item.drawParams.alpha = dynamicAlpha; // Store Alpha

            let scalingFactor = 1.0; // [USER REQUEST] Default to 1.0 exactly.

            // [DYNAMIC RENDERING]
            // If the user has saved custom culture scales from the editor, 
            // those scales OVERRIDE the legacy perspective scaling entirely
            // to ensure 100% visual consistency with the editor's UI grid.
            if (cultureScales && i < cultureScales.length) {
                scalingFactor = cultureScales[i];
            }
            // Apply dynamic scale (spawn animation etc.) into the single scaling factor
            scalingFactor *= dynamicScale;

            const baseHeight = 60;
            if (dynDir) {
                // 🔴 DE：统一缩放 s（站立高度 64 参考），hotspot(canvas中心) 对齐单位位置，脚底随动作浮动。
                const s = baseHeight * scale * scalingFactor / 64;
                item.drawParams.dx = drawX - dynDir.hx * s;
                item.drawParams.dy = drawY - dynDir.hy * s;
                item.drawParams.dw = frameW * s;
                item.drawParams.dh = frameH * s;
            } else {
                // S10DB：中心对齐（原逻辑，height-based sizing，脚底不参与）
                const currentRatio = frameW / frameH;
                const frameHeightNorm = frameH / this.S10DB_REF_FRAME_H;
                const targetH = baseHeight * scale * scalingFactor * frameHeightNorm;
                const targetW = targetH * currentRatio;
                item.drawParams.dx = drawX - targetW / 2;
                item.drawParams.dy = drawY - targetH * 0.5;
                item.drawParams.dw = targetW;
                item.drawParams.dh = targetH;
            }

            // [DEBUG] One-time dimension check
            if (!(LegionPhalanxDrawer as any)._debugLogDone && unitAssetsId === 'huaxia_infantry' && (i === 0 || i === 6)) {
                console.log(`🔍 [LPD Analysis] Slot ${i} (${i === 0 ? 'Infantry' : 'Crossbow'}):`,
                    `NatSize: ${tintedSprite.width}x${tintedSprite.height}`,
                    `Frames: ${spriteTotalFrames}`,
                    `FrameSize: ${frameW.toFixed(1)}x${frameH}`,
                    `Ratio: ${(frameW / frameH).toFixed(2)}`,
                    `Render: ${item.drawParams.dw.toFixed(1)}x${item.drawParams.dh.toFixed(1)}`
                );
                if (i === 6) (LegionPhalanxDrawer as any)._debugLogDone = true;
            }

            // [2026-08-10 调试可视化] 13 场景显示编队外框（DEV 门控，生产剥离）：
            // 青色旋转矩形 = 编队占位（宽×纵深按兵种），红短线 = 朝向。
            // 用途：直观检查编队间距 / 接触线 / 「隔空」到底隔多远。
            if (denseFront && import.meta.env.DEV) {
                LegionPhalanxDrawer.debugDrawSquadBox(
                    ctx, drawX, drawY, direction,
                    item.drawParams.dw, item.drawParams.dh, resolvedUnitType,
                );
            }

            // [2026-08-09 13场景阵型] 步兵格 → 4×2 小阵（8 人）/ 骑兵格 → 1-2-3 三角（6 人）/ 远程格 → 2×3（6 人）
            // 克隆同一 slot 的绘制参数（共享状态：同生同死同动画），各自独立战斗单位。
            // 按兵种类型判定：步兵展开 4 列×2 排；骑兵展开 1-2-3 三角；远程展开 2 排×3 列；象兵保持单格。
            if (denseFront && LegionPhalanxDrawer.isInfantryType(resolvedUnitType)) {
                // [2026-08-10 主人：步兵 5×2 十人方阵] 5 列 × 2 排（10 人），排距 0.4（第二排往前）。
                // 🔴 改这里必须同步 getSquadSupportRadius（步兵 halfX/halfY）、
                //    getSquadWidthFactor（= 列并集）、debug depth（= 排并集）。
                const SUB_ROWS = 2; // 2 排（纵深，第二排往前：排距 0.4）
                const SUB_COLS = 5; // 5 列（横向）
                // 子间距：横向列距 = 兵宽 × 0.75，纵深排距 = 兵高 × 0.4（紧凑）
                const subSpacingX = item.drawParams.dw * 0.75;
                const subSpacingY = item.drawParams.dh * 0.4;
                // 锚点 = 本格位中心（item.drawParams.dx/dy 已含 baseOffset 偏移）。
                // 🔴 不再减 baseOffset：item.drawParams.dx 本身就 = center + baseOffset - w/2，
                //    再减 baseOffset 会把 9 个编队全部拉回军团中心重叠（主人实锤「步兵挤成一团」根因，2026-08-09 修）。
                // 🔴 子偏移必须先按「阵内坐标」算，再用 direction 旋转到屏幕——
                //    直接沿屏幕 X 轴排会在军团朝东西时变成纵向（主人截图实锤「竖着」）。
                // 旋转矩阵（与 getFormationOffset 同款：angle = (direction+1)*π/4）
                const fAngle = (direction + 1) * Math.PI / 4;
                const fCos = Math.cos(fAngle);
                const fSin = Math.sin(fAngle);
                const toScreen = (ox: number, oy: number) => ({
                    x: ox * fCos - oy * fSin,
                    y: ox * fSin + oy * fCos,
                });
                for (let sub = 0; sub < SUB_ROWS * SUB_COLS; sub++) {
                    const sr = Math.floor(sub / SUB_COLS); // 0..1
                    const sc = sub % SUB_COLS;             // 0..3
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // [2026-08-10 5×2 十人方阵·交错] 第二排插第一排间隙（主人 08-09 定的交错，
                    // 5×2 改成对齐后被主人否：「怎么前后对齐啦」）。
                    // 对称交错：排 0 起点 -2.25、排 1 起点 -1.75（偏 +0.5 插缝），并集 ±2.25 列距
                    const localX = ((sr === 0 ? -2.25 : -1.75) + sc) * subSpacingX;
                    const localY = (sr - 0.5) * subSpacingY;
                    const scr = toScreen(localX, localY);
                    dp.dx = item.drawParams.dx + scr.x;
                    dp.dy = item.drawParams.dy + scr.y;
                    subItem.y = item.y + scr.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else if (denseFront && LegionPhalanxDrawer.isCavalryType(resolvedUnitType)) {
                // 1-2-3 等腰三角（6 人）：尖端在前（排 0 单骑），两翼展开（排 1 双骑 / 排 2 三骑）
                // 子间距：翼展(上下) = 兵宽 × 0.32，纵深(前后) = 兵高 × 0.35（2026-08-09 主人定：
                // 「不是前后密集度，是上下密集度」——上下/翼展再收紧，前后保持第一次密集的 0.35）
                const triSpacingX = item.drawParams.dw * 0.32;
                const triSpacingY = item.drawParams.dh * 0.35;
                // 旋转矩阵（与 getFormationOffset 同款）：三角偏移按阵内坐标算，再转到屏幕
                const cAngle = (direction + 1) * Math.PI / 4;
                const cCos = Math.cos(cAngle);
                const cSin = Math.sin(cAngle);
                const toScreenC = (ox: number, oy: number) => ({
                    x: ox * cCos - oy * cSin,
                    y: ox * cSin + oy * cCos,
                });
                for (let sub = 0; sub < 6; sub++) {
                    const pos = LegionPhalanxDrawer.TRIANGLE_LAYOUT[sub] ?? LegionPhalanxDrawer.TRIANGLE_LAYOUT[0];
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // 阵内坐标：X = c × 0.7×triSpacingX（横向），Y = (r-1) × triSpacingY（纵深，尖端 r=0 在前）
                    const scrC = toScreenC(pos.c * triSpacingX * 0.7, (pos.r - 1.0) * triSpacingY);
                    dp.dx = item.drawParams.dx + scrC.x;
                    dp.dy = item.drawParams.dy + scrC.y;
                    subItem.y = item.y + scrC.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else if (denseFront && LegionPhalanxDrawer.isRangedType(resolvedUnitType)) {
                // [2026-08-10 主人：远程弓手/弩手改为和步兵一样] 5×2 十人方阵（同步兵）。
                // 🔴 改这里必须同步 getSquadSupportRadius（远程 halfX/halfY）、
                //    getSquadWidthFactor、debug depth。
                const subSpacingX = item.drawParams.dw * 0.75;
                const subSpacingY = item.drawParams.dh * 0.4;
                // 旋转矩阵（与步兵/骑兵同款）：方阵随军团 direction 转向，斜向行军不滑步
                const rAngle = (direction + 1) * Math.PI / 4;
                const rCos = Math.cos(rAngle);
                const rSin = Math.sin(rAngle);
                const toScreenR = (ox: number, oy: number) => ({
                    x: ox * rCos - oy * rSin,
                    y: ox * rSin + oy * rCos,
                });
                const R_COLS = 5;
                const R_ROWS = 2;
                for (let sub = 0; sub < R_ROWS * R_COLS; sub++) {
                    const sr = Math.floor(sub / R_COLS); // 0..1
                    const sc = sub % R_COLS;             // 0..4
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // 阵内相对坐标（5 列交错：排 0 起点 -2.25 / 排 1 起点 -1.75 插缝；2 排 ±0.5）
                    const localX = ((sr === 0 ? -2.25 : -1.75) + sc) * subSpacingX;
                    const localY = (sr - 0.5) * subSpacingY;
                    const scr = toScreenR(localX, localY);
                    dp.dx = item.drawParams.dx + scr.x;
                    dp.dy = item.drawParams.dy + scr.y;
                    subItem.y = item.y + scr.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else if (denseFront && LegionPhalanxDrawer.isSiegeType(resolvedUnitType)) {
                // 1×4 一字横排（2026-08-10 主人「把大象排成一排不要2*2了」——与冲车
                // 4 台一排同风格）。子间距横向 = 兵宽 × 0.75（步兵同款，紧凑）。
                // 🔴 改这里必须同步 getSquadSupportRadius 的攻城 halfX（= 1.5×间距）
                //    与 getSquadWidthFactor（= 3×间距 + 1 精灵）。
                const subSpacingX = item.drawParams.dw * 0.75;
                const subSpacingY = item.drawParams.dh * 0.5;
                // 旋转矩阵（与步兵/骑兵同款）：器械方阵随军团 direction 转向
                const sAngle = (direction + 1) * Math.PI / 4;
                const sCos = Math.cos(sAngle);
                const sSin = Math.sin(sAngle);
                const toScreenS = (ox: number, oy: number) => ({
                    x: ox * sCos - oy * sSin,
                    y: ox * sSin + oy * sCos,
                });
                const S_COLS = 4;
                const S_ROWS = 1;
                for (let sub = 0; sub < S_ROWS * S_COLS; sub++) {
                    const sr = Math.floor(sub / S_COLS); // 0
                    const sc = sub % S_COLS;             // 0..3
                    const subItem = this.getPooledItem();
                    const dp = subItem.drawParams;
                    dp.img = item.drawParams.img;
                    dp.sx = item.drawParams.sx;
                    dp.sy = item.drawParams.sy;
                    dp.sw = item.drawParams.sw;
                    dp.sh = item.drawParams.sh;
                    // 阵内相对坐标（单排居中：y = 0）→ 旋转到屏幕；y 深度排序用旋转后 y
                    const localX = (sc - 1.5) * subSpacingX;
                    const localY = (sr - 0) * subSpacingY;
                    const scr = toScreenS(localX, localY);
                    dp.dx = item.drawParams.dx + scr.x;
                    dp.dy = item.drawParams.dy + scr.y;
                    subItem.y = item.y + scr.y;
                    dp.dw = item.drawParams.dw;
                    dp.dh = item.drawParams.dh;
                    dp.alpha = item.drawParams.alpha;
                    dp.scale = item.drawParams.scale;
                    activeItems.push(subItem);
                }
            } else {
                activeItems.push(item);
            }
        }

        // --- 4. FLUSH ---
        activeItems.sort((a, b) => a.y - b.y);
        // [FIX 2026-07-28] 原来是「设成 p.alpha，再硬重置成 1.0」，两处都错：
        //   · 设值时覆盖了外层透明度，而不是与之相乘
        //   · 重置成 1.0 而非恢复原值 ⇒ 一旦有一个兵 alpha<1，其后所有兵都被拉回全不透明
        // 外层调用方是会设 globalAlpha 的（GlobalUnitRenderer 的尸体渐隐、器械渐隐），
        // 这样写会把外层的淡出整个抹掉。改为先存基准、按基准相乘、再恢复基准。
        // 目前 p.alpha<1 只出现在出场动画，与尸体渐隐碰不到一起，属提前堵住的隐患。
        const baseAlpha = ctx.globalAlpha;
        for (let i = 0; i < activeItems.length; i++) {
            const p = activeItems[i].drawParams;
            if (p.alpha < 1) ctx.globalAlpha = baseAlpha * p.alpha;
            ctx.drawImage(p.img, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.dw, p.dh);
            if (p.alpha < 1) ctx.globalAlpha = baseAlpha;
        }
    }

    /**
     * 海上五船编队（2026-07-18 主人定）：中大船 + 前 2 小船 + 后 2 中船
     *   r = 航行方向轴（-1 前 / +1 后），c = 左右横轴；全图统一样式，不按兵力分档
     */
    /** 舰队逐艘阵亡起始时间（参考陆军 PhalanxAnimState 逐兵阵亡） */
    private static navalDeathStarts = new Map<string, number[]>();

    public static resetNavalDeath(unitId: string): void {
        this.navalDeathStarts.delete(unitId);
    }

    /** 为舰队分配逐艘阵亡起始时间（首次进入 DEATH 时调用） */
    private static ensureNavalDeathStarts(unitId: string, shipCount: number, now: number): number[] {
        let starts = this.navalDeathStarts.get(unitId);
        if (!starts) {
            // 5 艘船：大船最后一个沉（旗舰），小船→中船→大船 各间隔 600ms
            // 索引 0=大船(中) 1=小船(前左) 2=小船(前右) 3=中船(后左) 4=中船(后右)
            const delayMs = [1800, 0, 300, 600, 900]; // 前小船先沉 → 后中船 → 旗舰最后
            starts = delayMs.slice(0, shipCount).map(d => now + d);
            this.navalDeathStarts.set(unitId, starts);
        }
        return starts;
    }

    private static readonly NAVAL_FORMATION = [
        { r: 0, c: 0, ship: 'ship_large' },
        { r: 1, c: -1.5, ship: 'ship_medium' }, { r: 1, c: 1.5, ship: 'ship_small' },
        { r: -1, c: -1.5, ship: 'ship_medium' }, { r: -1, c: 1.5, ship: 'ship_small' },
    ] as const;

    public static drawNaval(
        ctx: CanvasRenderingContext2D,
        center: { x: number; y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        troops: number,
        tick: number,
        factionId: string,
        lockedShipId: NavalShipAssetId | null = null,
        unitId: string = '',
    ): void {
        // 五船定编（2026-07-18 主人定）：样式全图统一，不按兵力/登船锁定分档；
        // troops、lockedShipId 保留签名兼容，不再参与船型选择。
        // 海军船贴图略微缩小（baseHeight 72），避免靠港/围城时遮挡过重。
        const baseHeight = 72;

        // 逐舰阵亡状态更新（2026-07-18）：参照 LegionPhalanxStateManager 模式
        const isFighting = state === 'ATTACK' || state === 'DAMAGE';
        if (unitId) {
            NavalPhalanxStateManager.update(unitId, troops, isFighting, tick);
            // 非战时重置状态（战后补员/切换单位）
            if (!isFighting && state !== 'DEATH') {
                NavalPhalanxStateManager.reset(unitId);
            }
        }

        // 按三档船型各备一份贴图集与绘制尺寸；缺任一档 → 触发懒加载，等下一帧
        interface NavalTypeDraw {
            set: NonNullable<ReturnType<typeof LegionPhalanxDrawer.getUnitAssets>>;
            totalFrames: number;
            w: number;
            h: number;
        }
        const typeDraws = new Map<NavalShipAssetId, NavalTypeDraw>();
        for (const typeId of ['ship_small', 'ship_medium', 'ship_large'] as const) {
            const set = this.unitSpriteCache.get(typeId);
            const sample = set?.IDLE[direction] || set?.IDLE[0];
            if (!set || !sample?.complete || sample.naturalWidth === 0) {
                this.ensureNavalAssetsLoading();
                return;
            }
            const totalFrames = this.getFrameCount(sample);
            const frameW = sample.width / totalFrames;
            const frameH = sample.height;
            const h = baseHeight * scale * (frameH / this.S10DB_REF_FRAME_H) * getNavalShipDrawScale(typeId);
            typeDraws.set(typeId, { set, totalFrames, w: h * (frameW / frameH), h });
        }

        // 编队间距以旗舰（大船）尺寸为基准：纵向 0.45 船高、横向 0.40 船宽
        const flagship = typeDraws.get('ship_large')!;
        const shipDepth = flagship.h * 0.45;
        const shipSpread = flagship.w * 0.40;

        // 对角朝向（1,3,5,7）c 轴加 0.15 补偿视觉压缩；正朝向不变
        const isDiagonal = direction % 2 === 1;
        const cMult = isDiagonal ? 1.15 : 1.0;

        // 旋转角（与陆军一致）
        const angle = (direction + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // 收集 5 艘船的位置（中 1 大船 + 前 2 小船 + 后 2 中船），逐舰读取阵亡状态
        const ships: { x: number; y: number; img: HTMLImageElement; sx: number; sy: number; sw: number; sh: number; w: number; h: number }[] = [];
        const navalState = unitId ? NavalPhalanxStateManager.getState(unitId) : undefined;

        for (let i = 0; i < this.NAVAL_FORMATION.length; i++) {
            const pos = this.NAVAL_FORMATION[i] ?? this.NAVAL_FORMATION[0];
            const td = typeDraws.get(pos.ship)!;
            const currentSet = td.set;
            const ox = pos.r * shipDepth;
            const oy = pos.c * shipSpread * cMult;
            const dx = center.x + (ox * cos - oy * sin);
            const dy = center.y + (ox * sin + oy * cos);

            // 逐舰读取个体状态（2026-07-18）
            const shipSlot = navalState?.ships[i];
            const shipDying = shipSlot?.state === 'DYING';
            const shipDead = shipSlot?.state === 'DEAD';

            let rawSprite: HTMLImageElement | undefined;
            let currentFrameIndex = 0;

            if (shipDead) {
                // 残骸：定格在死亡动画最后一帧，随军团尸体一同渐隐
                rawSprite = currentSet.DEATH[shipSlot.deathDirection] || currentSet.DEATH[0];
                currentFrameIndex = td.totalFrames - 1;
            } else if (shipDying) {
                // 逐舰阵亡动画：用该舰的 stateStartTime 驱动
                rawSprite = currentSet.DEATH[shipSlot.deathDirection] || currentSet.DEATH[0];
                const timeDead = Math.max(0, tick - shipSlot.stateStartTime);
                currentFrameIndex = Math.min(Math.floor(timeDead / 150), td.totalFrames - 1);
            } else if (state === 'DEATH') {
                // 全局 DEATH（战斗结束残余舰统一沉没）
                rawSprite = currentSet.DEATH[direction] || currentSet.DEATH[0];
                const starts = this.ensureNavalDeathStarts(unitId, this.NAVAL_FORMATION.length, tick);
                const timeDead = Math.max(0, tick - (starts[i] ?? tick));
                currentFrameIndex = Math.min(Math.floor(timeDead / 150), td.totalFrames - 1);
            } else if (state === 'DAMAGE') {
                rawSprite = currentSet.DAMAGE[direction] || currentSet.DAMAGE[0];
                currentFrameIndex = Math.floor((tick + i * 80) / 150) % td.totalFrames;
            } else if (state === 'ATTACK') {
                rawSprite = currentSet.ATTACK[direction] || currentSet.ATTACK[0];
                currentFrameIndex = Math.floor((tick + i * 80) / 150) % td.totalFrames;
            } else if (state === 'MOVE') {
                rawSprite = currentSet.MOVE[direction] || currentSet.MOVE[0];
                currentFrameIndex = Math.floor((tick + i * 80) / 150) % td.totalFrames;
            } else {
                rawSprite = currentSet.IDLE[direction] || currentSet.IDLE[0];
            }
            if (!rawSprite?.complete || rawSprite.naturalWidth === 0) continue;

            const tintedSprite = SpriteTinter.getTintedSprite(rawSprite, factionId);
            if (!tintedSprite) continue;

            const tfw = tintedSprite.width / td.totalFrames;
            ships.push({
                x: dx, y: dy,
                img: tintedSprite,
                sx: currentFrameIndex * tfw, sy: 0, sw: tfw, sh: tintedSprite.height,
                w: td.w, h: td.h,
            });
        }

        // 后先画（Y 排序）
        ships.sort((a, b) => a.y - b.y);
        for (const s of ships) {
            ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh,
                s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
        }
    }

    // [NEW] Custom Formation Offset Calculation
    // ─── 攻城器械通用绘制（2026-07-18）────────────────────────────

    /** 绘制所有攻城器械（冲车、井阑等） */
    public static drawSiegeGear(
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        tick: number,
        spacingX: number,
        spacingY: number,
        unitId: string,
        troops: number,
        /**
         * 攻城团整体复制偏移，**单位是像素**（阵内坐标，旋转前叠加，随 direction 一起转）。
         * 用像素是为了能和 3×3 编队格位对齐——两边的「格」不是同一个单位
         * （器械走 ramSpacing≈30px，编队格位走 getDenseSquadSpacing）。
         * 默认单个 {0,0} = 与改动前逐像素一致，其他 zoom 不受影响。
         */
        groupOffsets: readonly { x: number; y: number }[] = [{ x: 0, y: 0 }],
    ): void {
        // [2026-08-09 13锁死] 13 战斗场景：编队推进 state=MOVE / 交战 ATTACK，战斗仍在进行——
        // 器械不得因非 ATTACK 状态误判「胜利渐隐」而淡出消失（主人实锤 13 看不到冲车）。
        // 13 下器械一律定格攻击姿态（与士兵同节奏），仅 zoom 已到 13 才生效。
        const scene13 = (window as any).game?.battleScene?.isActive?.() === true
            && ((window as any).gameMap?.getLeafletMap?.().getZoom?.() ?? 0) >= 13;
        if (scene13 && state !== 'DEATH') {
            state = 'ATTACK';
            LegionPhalanxDrawer.gearFadeOutStarts.delete(unitId);
        }
        // 多器械类型共用 unitId 的 spawn/fade 标记；整轮画完后再删，避免同帧后几种器械重开渐隐
        let fadeFullyDone = false;
        for (const gearType of Object.keys(LegionPhalanxDrawer.SIEGE_GEAR_DEFS) as string[]) {
            drawSingleGear(gearType);
        }
        if (fadeFullyDone) {
            LegionPhalanxDrawer.clearSiegeGearState(unitId);
        }

        function drawSingleGear(origType: string): void {
            // 冲车独立编队（13 场景，主人 2026-08-09 定）：不随 4 攻城团复制，
            // 4 台一字横排顶在最前排中央——冲车攻城门，后排够不到城门，只能一排 4 个。
            // 横向间距 2.5 格（≈105px，冲车宽 ≈103px，几乎不重叠）；
            // 偏移单位 = 格（×spacingX/Y），叠加在 ram 自身「第一排前」posOffset 之上；
            // 其余器械仍走 groupOffsets（像素，整团复制）。
            const ramFrontExtra = [
                { x: -3.75, y: -1.2 }, { x: -1.25, y: -1.2 },
                { x: +1.25, y: -1.2 }, { x: +3.75, y: -1.2 },
            ] as const;
            const useRamFront = origType === 'ram'
                && (window as any).game?.battleScene?.isActive?.() === true
                // 13 锁死：仅 zoom 已到 13 才独立排冲车（flyTo 途中/非 13 保持整团复制）
                && ((window as any).gameMap?.getLeafletMap?.().getZoom?.() ?? 0) >= 13;
            const offsets = useRamFront ? ramFrontExtra : groupOffsets;
            // [2026-08-09 主人定] 4 个攻城团各自独立随机：井阑/投石互换按团索引取映射，
            // 团与团之间的器械分布不再相同。
            for (let gi = 0; gi < offsets.length; gi++) {
                const g = offsets[gi];
                // 井阑/投石 4 个位置随机交换：用互换类型的精灵帧，保持原坐标
                let type = origType;
                let extraPosOverride: { x?: number; y?: number } = {};
                if ((LegionPhalanxDrawer.SHUFFLE_GEAR_KEYS as readonly string[]).includes(origType)) {
                    const shuffle = LegionPhalanxDrawer.ensureGearShuffle(unitId, gi);
                    if (shuffle[origType] !== (origType.startsWith('catapult') ? 'catapult' : 'well')) {
                        type = origType.startsWith('catapult')
                            ? (origType === 'catapult_l' ? 'well_lan' : 'well_lan_r')
                            : (origType === 'well_lan' ? 'catapult_l' : 'catapult_r');
                        const rawDef = (LegionPhalanxDrawer.SIEGE_GEAR_DEFS as any)[origType];
                        extraPosOverride = { x: rawDef.posOffsetX, y: rawDef.posOffsetY };
                    }
                }
                const cache = LegionPhalanxDrawer.getGearCache(type);
                const def = (LegionPhalanxDrawer.SIEGE_GEAR_DEFS as any)[type];

                if (!cache.loaded) {
                    void LegionPhalanxDrawer.ensureSiegeGearLoaded(type);
                    continue;
                }

            // 战斗结束 + 兵力 > 0 = 胜利，器械渐隐
            if (state !== 'ATTACK' && state !== 'DEATH' && troops > 0) {
                if (!LegionPhalanxDrawer.gearFadeOutStarts.has(unitId)) {
                    LegionPhalanxDrawer.gearFadeOutStarts.set(unitId, tick);
                }
                const fadeStart = LegionPhalanxDrawer.gearFadeOutStarts.get(unitId)!;
                const fadeElapsed = tick - fadeStart;
                if (fadeElapsed >= LegionPhalanxDrawer.GEAR_FADE_OUT_DURATION) {
                    // 渐隐完毕，清本器械状态；共享 spawn/fade 等整轮结束后再删
                    cache.deathStarts.delete(unitId);
                    cache.deathThresholds.delete(unitId);
                    fadeFullyDone = true;
                    continue;
                }
                // 继续画，alpha 由下面统一处理
            } else {
                // 战斗中，清除渐隐标记
                LegionPhalanxDrawer.gearFadeOutStarts.delete(unitId);
            }

            // 首次攻城：记录渐显起始 tick
            if (!LegionPhalanxDrawer.gearSpawnTicks.has(unitId)) {
                LegionPhalanxDrawer.gearSpawnTicks.set(unitId, tick);
            }
            const spawnStart = LegionPhalanxDrawer.gearSpawnTicks.get(unitId)!;
            const spawnElapsed = tick - spawnStart;
            let gearAlpha = Math.min(1, spawnElapsed / LegionPhalanxDrawer.GEAR_SPAWN_DURATION);

            // 胜利渐隐（与渐显取较暗值：速胜时器械未显全，若直接覆盖会先跳亮再淡出）
            const fadeOutStart = LegionPhalanxDrawer.gearFadeOutStarts.get(unitId);
            if (fadeOutStart !== undefined) {
                const fadeElapsed = tick - fadeOutStart;
                gearAlpha = Math.min(gearAlpha, Math.max(0, 1 - fadeElapsed / LegionPhalanxDrawer.GEAR_FADE_OUT_DURATION));
            }

            // 随机阵亡阈值，首次设置
            if (!cache.deathThresholds.has(unitId)) {
                cache.deathThresholds.set(unitId, 0.05 + Math.random() * 0.90);
            }
            const threshold = cache.deathThresholds.get(unitId)!;

            const phState = LegionPhalanxStateManager.getState(unitId);
            const maxT = phState?.maxTroops ?? troops;
            const aliveRatio = maxT > 0 ? troops / maxT : 0;

            if (!cache.deathStarts.has(unitId) && aliveRatio <= threshold) {
                cache.deathStarts.set(unitId, tick);
            }
            const gearDead = cache.deathStarts.has(unitId);

            const dirIdx = ((direction % 8) + 8) % 8;
            let sprite: HTMLImageElement | null = null;
            let frameCount = 1;
            let frameIndex = 0;

            if (state === 'DEATH' || gearDead) {
                sprite = cache.deathSprites[dirIdx] ?? null;
                if (!sprite || !sprite.complete || sprite.naturalWidth === 0) continue;
                frameCount = Math.floor(sprite.width / sprite.height);
                let deathStart = cache.deathStarts.get(unitId);
                if (deathStart === undefined) {
                    deathStart = tick;
                    cache.deathStarts.set(unitId, deathStart);
                }
                const elapsed = tick - deathStart;
                frameIndex = Math.min(Math.floor(elapsed / 150), frameCount - 1);
            } else if (state === 'ATTACK' || fadeOutStart !== undefined) {
                // [修复 2026-07-18] 胜利渐隐期 state 已非 ATTACK，原先掉进末尾 return 导致器械瞬间消失
                // （4 秒渐隐计时空转、无物可画）。渐隐期继续画攻击贴图，帧定格在战斗结束瞬间。
                sprite = cache.attackSprites[dirIdx] ?? null;
                if (!sprite || !sprite.complete || sprite.naturalWidth === 0) continue;
                frameCount = Math.floor(sprite.width / sprite.height);
                const speed = def.frameSpeed ?? 150;
                const animTick = fadeOutStart !== undefined ? fadeOutStart : tick;
                frameIndex = (Math.floor((animTick / speed)) + (def.frameStagger ?? 0)) % frameCount;
            } else {
                continue;
            }

            const frameW = sprite.width / frameCount;
            const frameH = sprite.height;

            // ── 位置 ──
            const angle = (direction + 1) * Math.PI / 4;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const baseOffX = extraPosOverride.x ?? def.posOffsetX;
            const baseOffY = extraPosOverride.y ?? def.posOffsetY;

            // ── 尺寸 ──
            const baseHeight = 60;
            const currentRatio = frameW / frameH;
            const frameHeightNorm = frameH / LegionPhalanxDrawer.S10DB_REF_FRAME_H;
            const targetH = baseHeight * scale * def.scaleMul * frameHeightNorm;
            const targetW = targetH * currentRatio;

            const sx = frameIndex * frameW;
            const prevAlpha = ctx.globalAlpha;
            ctx.globalAlpha = prevAlpha * gearAlpha;

            // 攻城团整体复制：团偏移在旋转前加到器械自身偏移上，整团随 direction 一起转。
            // groupOffsets 默认单元素 {0,0} → 与改动前逐像素一致。
            // 冲车（useRamFront）不走团复制：4 台一字横排顶最前，偏移是格单位 ×spacing。
            // 当前团 = 外层 gi 循环的 g（每团独立随机器械分布）。
            const origX = useRamFront
                ? (baseOffX + g.x) * spacingX
                : baseOffX * spacingX + g.x;
            const origY = useRamFront
                ? (baseOffY + g.y) * spacingY
                : baseOffY * spacingY + g.y;
            const gx = center.x + (origX * cos - origY * sin);
            const gy = center.y + (origX * sin + origY * cos);
            ctx.drawImage(
                sprite,
                sx, 0, frameW, frameH,
                gx - targetW / 2, gy - targetH * 0.5, targetW, targetH,
            );
            ctx.globalAlpha = prevAlpha;
            } // end for gi（攻城团循环）
        }
    }

    /** 攻城额外士兵阵亡起始 tick：key = unitId|offsetX（逐兵独立，对齐正规方阵格） */
    private static siegeSoldierDeathStarts = new Map<string, number>();
    /** 攻城额外士兵阵亡朝向（随机 0~8，设一次缓存，对齐正规方阵格） */
    private static siegeSoldierDeathDirs = new Map<string, number>();
    /** 攻城额外士兵阵亡阈值（0.05~0.95 存活率，与攻城器械同制） */
    private static siegeSoldierDeathThresholds = new Map<string, number>();

    /** 按 unitId 前缀清攻城额外士兵状态（reset/dispose 时调用） */
    private static clearSiegeSoldierMaps(unitId: string): void {
        const prefix = `${unitId}|`;
        for (const map of [
            this.siegeSoldierDeathStarts,
            this.siegeSoldierDeathDirs,
            this.siegeSoldierDeathThresholds,
        ]) {
            for (const key of [...map.keys()]) {
                if (key.startsWith(prefix)) map.delete(key);
            }
        }
    }

    /**
     * 攻城额外士兵：在方阵指定偏移位置画一个兵种精灵。
     * 阵亡行为对齐正规方阵格（2026-07-22 修复）：
     *   逐兵独立 key（unitId|offsetX）→ 随机阵亡阈值（0.05~0.95 存活率，与攻城器械同制）随战损逐个倒下、
     *   随机阵亡朝向（0~8 缓存不闪）、独立计时播一次冻结末帧、死后标记保留不复活、SpriteTinter 染势力色。
     */
    public static drawSiegeSoldier(
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        tick: number,
        spacingX: number,
        spacingY: number,
        unitType: string,     // e.g. 'archer'
        offsetX: number,      // in spacingX units
        offsetY: number,      // in spacingY units
        unitId: string,
        factionId: string,
        troops: number,
    ): void {
        const assets = this.unitSpriteCache.get(unitType);
        if (!assets) return;

        const slotKey = `${unitId}|${offsetX}`;

        // 随机阵亡阈值（首次设置）：存活率跌破即死（随战损逐个倒下）；整军 DEATH 无条件死
        if (!LegionPhalanxDrawer.siegeSoldierDeathThresholds.has(slotKey)) {
            LegionPhalanxDrawer.siegeSoldierDeathThresholds.set(slotKey, 0.05 + Math.random() * 0.90);
        }
        const phState = LegionPhalanxStateManager.getState(unitId);
        const maxT = phState?.maxTroops ?? troops;
        const aliveRatio = maxT > 0 ? troops / maxT : 0;
        const isDead =
            state === 'DEATH' ||
            aliveRatio <= (LegionPhalanxDrawer.siegeSoldierDeathThresholds.get(slotKey) ?? 0);

        // 随机阵亡朝向（设一次缓存，对齐正规方阵格，不闪）
        if (isDead && !LegionPhalanxDrawer.siegeSoldierDeathDirs.has(slotKey)) {
            LegionPhalanxDrawer.siegeSoldierDeathDirs.set(slotKey, Math.floor(Math.random() * 8));
        }

        const dirIdx = ((direction % 8) + 8) % 8;
        let sprite: HTMLImageElement | null = null;

        if (isDead) {
            const deathDir = LegionPhalanxDrawer.siegeSoldierDeathDirs.get(slotKey) ?? dirIdx;
            sprite = assets.DEATH[deathDir] || assets.DEATH[0];
        } else if (state === 'ATTACK') {
            const shoot = (assets as any).SHOOT;
            if (shoot && shoot.length > 0) {
                sprite = shoot[dirIdx] || shoot[0];
            } else {
                sprite = assets.ATTACK[dirIdx] || assets.ATTACK[0];
            }
        } else if (state === 'MOVE') {
            sprite = assets.MOVE[dirIdx] || assets.MOVE[0];
        } else {
            sprite = assets.IDLE[dirIdx] || assets.IDLE[0];
        }

        if (!sprite || !sprite.complete || sprite.naturalWidth === 0) return;

        // 势力染色（与正规方阵同一 SpriteTinter；帧参数以染色后贴图为准）
        const tinted = SpriteTinter.getTintedSprite(sprite, factionId);
        if (!tinted) return;
        const frameCount = Math.max(1, Math.floor(tinted.width / tinted.height));

        let frameIndex: number;
        if (isDead) {
            // 阵亡：播一次冻结末帧（和正规方阵一致）；标记保留，状态切换不复活
            if (!LegionPhalanxDrawer.siegeSoldierDeathStarts.has(slotKey)) {
                LegionPhalanxDrawer.siegeSoldierDeathStarts.set(slotKey, tick);
            }
            const deathStart = LegionPhalanxDrawer.siegeSoldierDeathStarts.get(slotKey)!;
            const elapsed = tick - deathStart;
            frameIndex = Math.min(Math.floor(elapsed / 150), frameCount - 1);
        } else {
            frameIndex = Math.floor((tick / 150)) % frameCount;
        }

        const frameW = tinted.width / frameCount;
        const frameH = tinted.height;

        const angle = (direction + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const origX = offsetX * spacingX;
        const origY = offsetY * spacingY;
        const gx = center.x + (origX * cos - origY * sin);
        const gy = center.y + (origX * sin + origY * cos);

        const baseHeight = 60;
        const currentRatio = frameW / frameH;
        const frameHeightNorm = frameH / this.S10DB_REF_FRAME_H;
        const targetH = baseHeight * scale * 1.0 * frameHeightNorm;
        const targetW = targetH * currentRatio;

        const sx = frameIndex * frameW;
        ctx.drawImage(
            tinted,
            sx, 0, frameW, frameH,
            gx - targetW / 2, gy - targetH * 0.5, targetW, targetH,
        );
    }

    private static getFormationOffset(
        index: number,
        spacingX: number,
        spacingY: number,
        direction: number,
        type: LegionType,
        gridSizeInput?: number,
        useTriangle: boolean = false
    ): { x: number, y: number } {
        const key = `${index}_${direction}_${spacingX.toFixed(2)}_${spacingY.toFixed(2)}_${type}_${gridSizeInput}_${useTriangle ? 'tri' : 'grid'}`;

        if (this.offsetCache.has(key)) {
            return this.offsetCache.get(key)!;
        }

        let originalX = 0;
        let originalY = 0;

        // --- FORMATION LOGIC ---
        if (useTriangle && index < 6) {
            const pos = LegionPhalanxDrawer.TRIANGLE_LAYOUT[index] ?? LegionPhalanxDrawer.TRIANGLE_LAYOUT[0];
            originalY = (pos.r - 1.0) * spacingY;
            originalX = pos.c * spacingX * 0.7;
        } else {
            const gridSize = gridSizeInput || 3;
            const rows = gridSize;
            const cols = gridSize;
            const r = Math.floor(index / cols);
            const c = index % cols;

            const centerX = (cols - 1) / 2;
            const centerY = (rows - 1) / 2;

            originalX = (c - centerX) * spacingX;
            originalY = (r - centerY) * spacingY;
        }

        // [ROTATION]
        // Rotate the formation based on direction
        const angle = (direction + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const result = {
            x: originalX * cos - originalY * sin,
            y: originalX * sin + originalY * cos
        };

        if (this.offsetCache.size > 2000) this.offsetCache.clear();
        this.offsetCache.set(key, result);

        return result;
    }
}
