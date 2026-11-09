/**
 * DE 船帆（sail）素材与图层栈表 —— 2026-10-30 主人「我们的船都没有解析帆，是吗？」→「请执行」；同日复核对齐 DE `.dat`
 *
 * DE 的中世纪/近代战船**帆不在船体里**：`u_shp_galley_x1.sld` 等只有船身、桅杆与索具，
 * 帆是独立素材 `u_shp_sail_<group>_<boat|ship>_<2..8>_x1.sld`（10 文化组 × 12 个图层组件）。
 *
 * 经核对 `empires2_x2_p1.dat`（`graphic.deltas`）：
 *   1. `boat_2..6` 与 `ship_2..8` **不是按船大小分的单帆档位**，而是**多桅帆船按画家算法拆开的前后图层组件**：
 *      - `boat_4`、`ship_5`：中心主桅帆（SLD 含全部 16 向）；
 *      - `(boat_2, boat_6)`、`(boat_5, boat_3)`、`(ship_2, ship_8)`、`(ship_3, ship_7)`、`(ship_6, ship_4)`：
 *        副桅/尾桅/斜桁帆的前后半圈成对图层（前半存 DE 角 0..7 即游戏向 2..9，后半存 DE 角 8..15 即游戏向 10..15,0,1），
 *        绕主桅按从后到前的顺序叠画，使船朝南/朝北时多桅遮挡关系始终正确。
 *   2. 船体与船帆共用同一个 DE 热点坐标系 `(hx, hy)`，每面帆只需按 `.dat` 登记的 `offset_y`（`offset_x` 恒为 0）
 *      与船体同缩放系数 `s` 叠画，索具、桅杆脚、鸦巢即逐像素严丝合缝。
 *   3. 古典桨帆船、楼船（LOU_CHUAN，重檐楼阁无帆）、龙船（DRAGON_SHIP，草篷火船无帆）、
 *      古典投石舰/重型投石舰（CATAPULT_SHIP / ONAGER_SHIP，横桁已自带收拢帆布）、
 *      古典火攻船（INCENDIARY_SHIP / HEAVY_INCENDIARY_SHIP，无桅无帆）、卡拉维尔、德罗蒙、维京长船、
 *      中式帆船（JUNK）、巨型桨帆船（THIRISADAI）、龟船、独木舟等在 DE `.dat` 中不挂 `u_shp_sail_*`，不在此列。
 *
 * 素材由 `tools/extract_sail_assets.py` 从 DE 本体解出，落在 `public/SUCAI_SAIL/<GROUP>/<PART>/`。
 */

export type SailGroup = 'afri' | 'asia' | 'ceas' | 'east' | 'medi' | 'meso' | 'orie' | 'seas' | 'slav' | 'west';

export type SailPartId =
    | 'boat_2' | 'boat_3' | 'boat_4' | 'boat_5' | 'boat_6'
    | 'ship_2' | 'ship_3' | 'ship_4' | 'ship_5' | 'ship_6' | 'ship_7' | 'ship_8';

export interface SailDelta {
    part: SailPartId;
    /** DE `.dat` graphic.deltas 的纵向偏移（px，负值向上；offset_x 恒为 0） */
    oy: number;
}

/**
 * 船型 → DE `.dat` 真实船帆图层栈（按从后到前的绘制顺序排列；半圈图层在对应方向自动生效）。
 * 19 型船与 `empires2_x2_p1.dat` 逐条对应。
 */
export const SAIL_DELTAS_BY_SHIP: Record<string, readonly SailDelta[]> = {
    // ── 单桅船（boat_4 全 16 向主帆） ──
    GALLEY:               [{ part: 'boat_4', oy: -13 }],
    BOARDING_GALLEY:      [{ part: 'boat_4', oy: -13 }], // ABGAL：复用 GALLEY 船体与帆
    HULK:                 [{ part: 'boat_4', oy: -10 }],
    DEMO_SHIP:            [{ part: 'boat_4', oy: -19 }],
    DEMO_RAFT:            [{ part: 'boat_4', oy: -6 }],
    // 🔴 [2026-11-08 主人令「做一个吧，毕竟这是玩家初始船模，经常远洋」] 独木舟挂单桅轻帆（boat_4，oy=-4 贴合舟心货捆与船舷支索）
    CANOE:                [{ part: 'boat_4', oy: -4 }],

    // ── 双桅/多桅 boat 系 ──
    TRADE_COG:            [{ part: 'boat_3', oy: -23 }, { part: 'boat_4', oy: -15 }, { part: 'boat_5', oy: -23 }],
    HEAVY_DEMO_SHIP:      [{ part: 'boat_2', oy: -32 }, { part: 'boat_4', oy: -12 }, { part: 'boat_6', oy: -32 }],
    HERO_STOERTEBEKER:    [{ part: 'boat_2', oy: -32 }, { part: 'boat_4', oy: -12 }, { part: 'boat_6', oy: -32 }],
    FIRE_GALLEY:          [{ part: 'boat_2', oy: -16 }, { part: 'boat_3', oy: -16 }, { part: 'boat_5', oy: -16 }, { part: 'boat_6', oy: -16 }],
    WAR_HULK:             [{ part: 'ship_3', oy: -18 }, { part: 'boat_4', oy: -13 }, { part: 'ship_7', oy: -18 }],

    // ── 双桅/三桅/四桅 ship 系 ──
    WAR_GALLEY:           [{ part: 'ship_2', oy: -30 }, { part: 'ship_5', oy: -20 }, { part: 'ship_8', oy: -30 }],
    CANNON_GALLEON:       [{ part: 'ship_3', oy: -25 }, { part: 'ship_5', oy: -25 }, { part: 'ship_7', oy: -25 }],
    ELITE_CANNON_GALLEON: [{ part: 'ship_3', oy: -25 }, { part: 'ship_5', oy: -25 }, { part: 'ship_7', oy: -25 }],
    CATAPULT_GALLEON:     [{ part: 'ship_3', oy: -25 }, { part: 'ship_5', oy: -25 }, { part: 'ship_7', oy: -25 }],
    TRANSPORT_SHIP:       [{ part: 'ship_2', oy: -28 }, { part: 'ship_3', oy: -18 }, { part: 'ship_7', oy: -18 }, { part: 'ship_8', oy: -28 }],
    FIRE_SHIP:            [{ part: 'ship_2', oy: -28 }, { part: 'ship_4', oy: -20 }, { part: 'ship_6', oy: -20 }, { part: 'ship_8', oy: -28 }],
    FAST_FIRE_SHIP:       [{ part: 'ship_2', oy: -28 }, { part: 'ship_3', oy: -14 }, { part: 'ship_4', oy: -20 }, { part: 'ship_6', oy: -20 }, { part: 'ship_7', oy: -14 }, { part: 'ship_8', oy: -28 }],
    CARRACK:              [{ part: 'boat_3', oy: -40 }, { part: 'ship_3', oy: -25 }, { part: 'ship_5', oy: -25 }, { part: 'ship_7', oy: -22 }, { part: 'boat_5', oy: -40 }],
    GALLEON:              [{ part: 'ship_2', oy: -40 }, { part: 'ship_3', oy: -25 }, { part: 'ship_4', oy: -25 }, { part: 'ship_5', oy: -25 }, { part: 'ship_6', oy: -25 }, { part: 'ship_7', oy: -25 }, { part: 'ship_8', oy: -40 }],
};

/** DE 16 母体建筑风格 → 帆文化组（DE 只有这 10 组帆） */
export const DE_STYLE_TO_SAIL_GROUP: Record<string, SailGroup> = {
    WEST: 'west',
    MEDI: 'medi',
    EAST: 'east',
    SLAV: 'slav',
    CEAS: 'ceas',
    ASIA: 'asia',
    ORIE: 'orie',
    SEAS: 'seas',
    AFRI: 'afri',
    MESO: 'meso',
    INDI: 'asia',
    PURU: 'asia',
    ANDE: 'meso',
    GREEK: 'medi',
    THRACIAN: 'medi',
    PERSIAN: 'orie',
};

/** 需要叠帆的船型 */
export function needsSail(shipId: string | null | undefined): boolean {
    return !!shipId && shipId in SAIL_DELTAS_BY_SHIP;
}

/** 取某船型的 DE 船帆图层栈 */
export function getSailDeltas(shipId: string): readonly SailDelta[] | null {
    return SAIL_DELTAS_BY_SHIP[shipId] ?? null;
}

/** 取某个帆图层组件的素材目录（相对 public） */
export function getSailPartDir(part: SailPartId, group: SailGroup): string {
    return `/SUCAI_SAIL/${group.toUpperCase()}/${part}`;
}

export interface SailPartDirMeta {
    fw: number;
    fh: number;
    hx: number;
    hy: number;
}

export interface SailPartAsset {
    imgs: Record<number, HTMLImageElement>;
    dirs: Record<string, SailPartDirMeta>;
}

const sailPartCache = new Map<string, SailPartAsset>();
const sailPartInFlight = new Map<string, Promise<SailPartAsset | null>>();

/** 异步加载某个帆图层组件的贴图与热点元数据（全局共用同一份缓存） */
export function loadSailPartAsync(dir: string): Promise<SailPartAsset | null> {
    const hit = sailPartCache.get(dir);
    if (hit) return Promise.resolve(hit);
    const inflight = sailPartInFlight.get(dir);
    if (inflight) return inflight;

    const p = fetch(`${dir}/_meta.json`)
        .then(r => (r.ok ? r.json() : null))
        .then((meta: any) => {
            const dirs: Record<string, SailPartDirMeta> = meta?.idle?.dirs ?? {};
            const keys = Object.keys(dirs);
            if (keys.length === 0) return null;
            return new Promise<SailPartAsset>((resolve) => {
                const imgs: Record<number, HTMLImageElement> = {};
                let pending = keys.length;
                const settle = () => {
                    if (--pending <= 0) {
                        const asset: SailPartAsset = { imgs, dirs };
                        sailPartCache.set(dir, asset);
                        resolve(asset);
                    }
                };
                for (const k of keys) {
                    const d = Number(k);
                    const img = new Image();
                    img.onload = settle;
                    img.onerror = settle;
                    img.src = `${dir}/idle_${d}.png`;
                    imgs[d] = img;
                }
            });
        })
        .catch(() => null)
        .finally(() => {
            sailPartInFlight.delete(dir);
        });

    sailPartInFlight.set(dir, p);
    return p;
}

/** 同步取某个帆图层组件；首次调用发起后台加载并返回 null（下一帧即就绪） */
export function getSailPart(dir: string): SailPartAsset | null {
    const hit = sailPartCache.get(dir);
    if (hit) return hit;
    void loadSailPartAsync(dir);
    return null;
}

/** 按船型、方向、缩放系数生成相对船体热点 (0,0) 的 DE 帆图层绘制表 */
export function buildSailLayers(
    shipId: string,
    shipDir: number,
    scale: number,
    group: SailGroup = 'west',
): { img: HTMLImageElement; ox: number; oy: number; w: number; h: number }[] | undefined {
    const deltas = getSailDeltas(shipId);
    if (!deltas || deltas.length === 0) return undefined;
    const out: { img: HTMLImageElement; ox: number; oy: number; w: number; h: number }[] = [];
    for (const dl of deltas) {
        const part = getSailPart(getSailPartDir(dl.part, group))
            ?? (group !== 'west' ? getSailPart(getSailPartDir(dl.part, 'west')) : null);
        if (!part) continue;
        const sm = part.dirs[String(shipDir)];
        const simg = part.imgs[shipDir];
        if (!sm || !simg || !simg.complete || simg.naturalWidth === 0) continue;
        out.push({
            img: simg,
            ox: -sm.hx * scale,
            oy: (-sm.hy + dl.oy) * scale,
            w: sm.fw * scale,
            h: sm.fh * scale,
        });
    }
    return out.length > 0 ? out : undefined;
}

