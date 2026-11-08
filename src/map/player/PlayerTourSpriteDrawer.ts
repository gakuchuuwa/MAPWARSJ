/**
 * PlayerTourSpriteDrawer —— 玩家「环球旅行 / 环球航行」两套专属模型（商队车、商船）的绘制口。
 *
 * 🔴 [2026-11-06 主人令]「给项目中的玩家添加商队和商船模型，如果切换到环球旅行，和环球航行的模式的时候，
 *    就自动切换到商队和商船的模式。」
 *
 * 与「商贸交通层」`TradeTrafficLayer` 同一套素材与比例口径：
 *   · 素材：`public/SUCAI_TRADE/<DIR>/`（DE 原生像素、`_meta.json` 动态帧框，含 8 向车、16 向船）；
 *   · 比例：战略地图统一素材 `STRATEGIC_SPRITE_SCALE`（0.40 × DE 原生像素，商队/商船与渔船同一档），
 *     由调用方传入的军团基准 `scale`（0.80 基准）换算；
 *   · 朝向：8 向车走 `get8DirectionFromAngle`，16 向船走「罗盘角 → 等距地面角」并在画的时候补残差微旋；
 *   · 水迹：商船用 `NavalWakeDrawer` 的 DE 水迹（与舰队/环境商船同源），画在船体之下。
 *
 * 只画**一个**精灵 + 玩家金牌（脚下光环）+ 头顶名牌；不画旗、不画方阵、不染势力色（商队/商船是原色）。
 * 素材还没加载完时 `draw()` 返回 false，调用方照旧退回人物兵模 —— 玩家任何时候都不会凭空消失。
 */
import { OrientationSystem } from '../../core/OrientationSystem';
import { CITIES_V2 } from '../../data/cities_v2';
import { NavalWakeDrawer } from '../legion/NavalWakeDrawer';
import { playerTourCaravanDir, playerTourMerchantShipDir, tradeShipSailGroupAt } from '../TradeTrafficLayer';
import { HeroSpriteDrawer } from './HeroSpriteDrawer';
import { needsSail, getSailDeltas, getSailPartDir, loadSailPartAsync, buildSailLayers } from '../../data/NavalSails';

type Pt = { lat: number; lng: number };

/** 玩家环球形态：陆路＝商队车，海上＝商船 */
export type PlayerTourKind = 'caravan' | 'ship';

/**
 * 玩家面板里可选的商队车／商船（🔴 [2026-11-06 主人令]「这些模型请可以在玩家面板中选择」）。
 * 目录与 `public/SUCAI_TRADE/` 一一对应；面板里的「随当地文化」＝不选，按所在地文化自动换。
 */
export const TOUR_CARAVAN_CHOICES: ReadonlyArray<{ dir: string; name: string }> = [
    { dir: 'TRADE_CART_ORIE', name: '丝路骆驼商车' },
    { dir: 'TRADE_CART_WEST', name: '欧洲四轮马车' },
    { dir: 'TRADE_CART_ASIA', name: '东亚黄牛货车' },
    { dir: 'TRADE_CART_AFRI', name: '南亚水牛车' },
    { dir: 'TRADE_CART_MESO', name: '美洲商车' },
    { dir: 'MULE_CART', name: '骡驴驮车' },
];

export const TOUR_SHIP_CHOICES: ReadonlyArray<{ dir: string; name: string }> = [
    { dir: 'JUNK', name: '中式帆船' },
    { dir: 'MERCHANT_SHIP', name: '三角帆商船' },
    { dir: 'TRADE_COG', name: '欧洲柯克船' },
    { dir: 'TRANSPORT_SHIP', name: '远洋渡运船' },
    { dir: 'CANOE', name: '独木舟' },
];

interface TourAsset {
    dir: string;
    dirs16: boolean;
    nDir: number;
    action: 'move' | 'idle';
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
}

/** 车/船行进动画帧率（与商贸交通层的 CART_ANIM_FPS 同频） */
const MOVE_ANIM_FPS = 18;
/**
 * 🔴 [2026-11-08 主人令「环球中，路上不要更换模型，我建议在经过据点的时候，可以跟换模型，这样更加真实」]
 * 经过据点判定半径（度，约 8.8km；略大于 PLAYER_CITY_ARRIVE_DIST=0.06°，确保沿路途经或抵达据点必中）。
 * 在路上/海上行进期间锁定上一次据点的文化车船模型，只有经过据点时才按该据点文化更换。
 */
const PASS_CITY_RADIUS_DEG = 0.08;
const PASS_CITY_RADIUS_SQ = PASS_CITY_RADIUS_DEG * PASS_CITY_RADIUS_DEG;

/** 检查本帧移动线段 from→to 是否正处于或穿过某座据点；在路上返回 null */
function findPassingCity(from: Pt, to: Pt): { id: string; lat: number; lng: number } | null {
    const abLat = to.lat - from.lat;
    const abLng = ((((to.lng - from.lng) % 360) + 540) % 360) - 180;
    const abLenSq = abLat * abLat + abLng * abLng;
    let best: { id: string; lat: number; lng: number } | null = null;
    let bestD2 = PASS_CITY_RADIUS_SQ;
    for (const c of CITIES_V2) {
        const apLat = c.lat - from.lat;
        const apLng = ((((c.lng - from.lng) % 360) + 540) % 360) - 180;
        let t = 0;
        if (abLenSq > 1e-12) {
            t = Math.max(0, Math.min(1, (apLat * abLat + apLng * abLng) / abLenSq));
        }
        const dLat = apLat - t * abLat;
        const dLng = apLng - t * abLng;
        const d2 = dLat * dLat + dLng * dLng;
        if (d2 <= bestD2) {
            bestD2 = d2;
            best = c;
        }
    }
    return best;
}

const assets = new Map<string, TourAsset>();
/** 每个玩家当前的皮肤（只在初始化或经过据点时按该据点文化更新，路上锁定不变） */
const picks = new Map<string, {
    kind: PlayerTourKind;
    dir: string;
    readyDir: string;
    anchor: Pt;
    cityId: string | null;
}>();
/** 每个玩家当前的朝向（迟滞用，换皮肤时重置） */
const headings = new Map<string, { asset: string; idx: number; deg: number }>();

/** 载入一套商贸素材（与 TradeTrafficLayer.loadAsset 同一套 _meta.json 约定） */
function ensureAsset(dir: string): TourAsset {
    const existed = assets.get(dir);
    if (existed) return existed;
    const asset: TourAsset = {
        dir, dirs16: false, nDir: 8, action: 'idle', frames: 1,
        dirs: {}, sheets: [], ready: false,
    };
    assets.set(dir, asset);
    const base = `/SUCAI_TRADE/${dir}`;
    fetch(`${base}/_meta.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
        .then((meta) => {
            asset.dirs16 = meta.dirs16 === true;
            asset.nDir = meta.nDir ?? (asset.dirs16 ? 16 : 8);
            const act = meta.move ? 'move' : 'idle';
            asset.action = act;
            asset.frames = meta[act]?.frames ?? 1;
            asset.dirs = meta[act]?.dirs ?? {};
            const nDir = asset.nDir;
            asset.sheets = new Array(nDir).fill(null);
            let loaded = 0;
            const sailDeltas = needsSail(dir) ? getSailDeltas(dir) : null;
            const defaultGroup = dir === 'CANOE' ? 'meso' : 'west';
            const sailReady = sailDeltas
                ? Promise.all(sailDeltas.map((dl) => loadSailPartAsync(getSailPartDir(dl.part, defaultGroup))))
                : Promise.resolve(null);
            for (let d = 0; d < nDir; d++) {
                const img = new Image();
                img.onload = () => {
                    loaded++;
                    if (loaded === nDir) void sailReady.then(() => { asset.ready = true; });
                };
                img.onerror = () => {
                    loaded++;
                    if (loaded === nDir) void sailReady.then(() => { asset.ready = true; });
                };
                img.src = `${base}/${act}_${d}.png`;
                asset.sheets[d] = img;
            }
        })
        .catch((e) => console.warn(`[PlayerTourSprite] 加载 ${dir} 失败:`, e));
    return asset;
}

/**
 * 玩家当前该用哪套商队/商船皮肤：
 *   ① 面板里手选了就用手选的那套（`override`）；
 *   ② 否则只在「首次进入该形态」或「经过据点」时按据点文化更新，在路上/海上行进途中保持不变。
 */
export function resolvePlayerTourDir(
    kind: PlayerTourKind,
    lat: number,
    lng: number,
    key: string,
    override?: string | null,
    from?: Pt,
): string {
    const prev = picks.get(key);
    const passing = findPassingCity(from ?? { lat, lng }, { lat, lng });
    if (!prev || prev.kind !== kind) {
        const anchor = passing ? { lat: passing.lat, lng: passing.lng } : { lat, lng };
        const dir = kind === 'ship'
            ? playerTourMerchantShipDir(anchor.lat, anchor.lng)
            : playerTourCaravanDir(anchor.lat, anchor.lng);
        picks.set(key, { kind, dir, readyDir: dir, anchor, cityId: passing?.id ?? null });
    } else if (passing && passing.id !== prev.cityId) {
        const anchor = { lat: passing.lat, lng: passing.lng };
        const dir = kind === 'ship'
            ? playerTourMerchantShipDir(anchor.lat, anchor.lng)
            : playerTourCaravanDir(anchor.lat, anchor.lng);
        prev.dir = dir;
        prev.anchor = anchor;
        prev.cityId = passing.id;
    }
    if (override) return override;
    return picks.get(key)!.dir;
}

/** 切到环球/航行前预热素材（不阻塞；没预热完就先用人物兵模顶着） */
export function preloadPlayerTourModels(
    lat: number,
    lng: number,
    caravanDir?: string | null,
    shipDir?: string | null,
): void {
    ensureAsset(caravanDir || playerTourCaravanDir(lat, lng));
    const sDir = shipDir || playerTourMerchantShipDir(lat, lng);
    ensureAsset(sDir);
    if (needsSail(sDir)) {
        const group = tradeShipSailGroupAt(lat, lng, sDir);
        const deltas = getSailDeltas(sDir);
        if (deltas) {
            for (const dl of deltas) {
                void loadSailPartAsync(getSailPartDir(dl.part, group));
            }
        }
    }
}

export interface PlayerTourDrawOptions {
    kind: PlayerTourKind;
    /** 状态 key（玩家军团 id）：朝向迟滞与皮肤缓存按它分账 */
    key: string;
    center: { x: number; y: number };
    /** 上一帧坐标（算朝向） */
    from: Pt;
    /** 本帧坐标（算朝向、选文化） */
    to: Pt;
    moving: boolean;
    /** 战略军团基准（strategicArmyScale，zoom9 时 0.80） */
    scale: number;
    tick: number;
    name: string;
    /** 玩家面板手选的素材目录；null/缺省 = 按所在地文化自动 */
    overrideDir?: string | null;
    /** 水迹世界坐标 ↔ 屏幕坐标投影（与军团舰队同一套） */
    projection: {
        toWorld(point: { x: number; y: number }): { x: number; y: number };
        toScreen(point: { x: number; y: number }): { x: number; y: number };
    };
}

export class PlayerTourSpriteDrawer {
    /** 画玩家商队/商船；素材没就绪返回 false（调用方退回人物兵模） */
    public static draw(ctx: CanvasRenderingContext2D, o: PlayerTourDrawOptions): boolean {
        const targetDir = resolvePlayerTourDir(o.kind, o.to.lat, o.to.lng, o.key, o.overrideDir ?? null, o.from);
        let dir = targetDir;
        let asset = ensureAsset(dir);
        const state = picks.get(o.key);
        if (!asset.ready && state && state.readyDir !== dir) {
            const fallbackAsset = ensureAsset(state.readyDir);
            if (fallbackAsset.ready) {
                dir = state.readyDir;
                asset = fallbackAsset;
            }
        }
        if (!asset.ready) return false;
        if (state) state.readyDir = dir;

        const d = this.dirIndex(asset, o.key, o.from, o.to);
        // 帧框与贴图必须同一向：个别素材缺某向时退回 0 向，两处一起退，别拿 A 向的框去切 B 向的图
        const idx = asset.dirs[String(d.idx)] ? d.idx : 0;
        const box = asset.dirs[String(idx)];
        const sheet = asset.sheets[idx];
        if (!box || !sheet || !sheet.complete || !sheet.naturalWidth) return false;

        // 🔴 [2026-11-06 主人报「商船模型大小和之前不一致」] 比例改成**与军团兵模／战船／玩家人物同一基准**：
        //    DE 原生像素 × scale（zoom9 = 0.80；`LegionPhalanxDrawer.drawNaval` 的
        //    `SPRITE_BASE_H(64) × scale × getNavalShipDrawScale(1.0) / 64` 就是这一条）。
        //    原来这里乘了 STRATEGIC_SPRITE_SCALE/STRATEGIC_ARMY_SCALE = 0.5，等于只有战船的一半。
        const px = o.scale;
        const animating = o.moving && asset.action === 'move' && asset.frames > 1;
        const frame = animating ? Math.floor(o.tick / 1000 * MOVE_ANIM_FPS) % asset.frames : 0;

        const w = box.fw * px;
        const h = box.fh * px;
        const ax = o.center.x - box.hx * px;
        const ay = o.center.y - box.hy * px;

        // 16 向船：扣掉 22.5° 台阶的残差，船身与航迹同一条线（与 LegionPhalanxDrawer.drawNaval 同源）
        let rot = 0;
        if (asset.dirs16) {
            const hullRad = (45 + 22.5 * idx) * Math.PI / 180;
            const frameScreenDeg = Math.atan2(Math.sin(hullRad), 0.5 * Math.cos(hullRad)) * 180 / Math.PI;
            let res = d.deg - frameScreenDeg;
            while (res > 180) res -= 360;
            while (res < -180) res += 360;
            rot = res * Math.PI / 180;
        }

        // 1. 玩家金牌（脚下光环）垫在最底，商队/商船也照旧认人
        HeroSpriteDrawer.drawAura(ctx, o.center, o.scale, o.tick);

        // 2. 商船水迹（DE 水迹，画在船体之下；停船只停止发射，已有浪花自然淡出）
        if (o.kind === 'ship') {
            const shipLen = Math.max(box.fw, box.fh) * px;
            NavalWakeDrawer.drawNavalWakes(
                ctx,
                [{ x: o.center.x, y: o.center.y, r: 1, isAlive: true, dir: idx, rot, deg: d.deg, shipLen }],
                idx,
                o.scale,   // 与战船同一条水迹基准（drawNaval 传的就是 scale）
                o.tick,
                o.moving,
                undefined,
                shipLen,
                `playerTour:${o.key}`,
                o.projection,
            );
        }

        // 3. 商队车 / 商船船体（若 DE 该船型有独立船帆图层栈，按同热点与缩放叠画；帆文化组同样锁定于所经据点）
        const sailAnchor = state?.anchor ?? o.to;
        const sails = o.kind === 'ship' && needsSail(dir)
            ? buildSailLayers(dir, idx, px, tradeShipSailGroupAt(sailAnchor.lat, sailAnchor.lng, dir))
            : undefined;
        if (Math.abs(rot) > 0.001) {
            ctx.save();
            ctx.translate(o.center.x, o.center.y);
            ctx.rotate(rot);
            ctx.drawImage(sheet, frame * box.fw, 0, box.fw, box.fh, ax - o.center.x, ay - o.center.y, w, h);
            if (sails) {
                for (const sl of sails) {
                    ctx.drawImage(sl.img, sl.ox, sl.oy, sl.w, sl.h);
                }
            }
            ctx.restore();
        } else {
            ctx.drawImage(sheet, frame * box.fw, 0, box.fw, box.fh, ax, ay, w, h);
            if (sails) {
                for (const sl of sails) {
                    ctx.drawImage(sl.img, o.center.x + sl.ox, o.center.y + sl.oy, sl.w, sl.h);
                }
            }
        }

        // 4. 头顶名牌（模型变高时名牌跟着抬高，别压在车顶/船帆上）
        let topReach = box.hy * px;
        if (sails) {
            for (const sl of sails) {
                topReach = Math.max(topReach, -sl.oy);
            }
        }
        const lift = Math.max(0, topReach - HeroSpriteDrawer.labelLift(o.scale));
        HeroSpriteDrawer.drawLabel(ctx, { x: o.center.x, y: o.center.y - lift }, o.name, o.scale);
        return true;
    }

    /**
     * 朝向量化（与 TradeTrafficLayer.dirIndex 同一套：屏幕轴角度 + 迟滞死区 + 16 向等距换算）。
     * 玩家站着不动（两个坐标一样）时沿用上一次朝向，不许原地转头。
     */
    private static dirIndex(asset: TourAsset, key: string, from: Pt, to: Pt): { idx: number; deg: number } {
        const last = headings.get(key);
        const moved = Math.abs(to.lat - from.lat) > 1e-7 || Math.abs(to.lng - from.lng) > 1e-7;
        if (!moved) {
            if (last && last.asset === asset.dir) return { idx: last.idx, deg: last.deg };
            const deg = asset.dirs16 ? 45 : 0;
            const idx = asset.dirs16 ? 0 : OrientationSystem.get8DirectionFromAngle(deg);
            headings.set(key, { asset: asset.dir, idx, deg });
            return { idx, deg };
        }
        const deg = asset.dirs16
            ? OrientationSystem.getScreenCompassDeg(from, to)
            : OrientationSystem.getScreenAngleDeg(from, to);
        const half = asset.dirs16 ? 11.25 : 22.5;
        if (last && last.asset === asset.dir && Number.isFinite(last.deg)) {
            let diff = ((deg - last.deg) % 360 + 360) % 360;
            if (diff > 180) diff -= 360;
            if (Math.abs(diff) <= half + 10) return { idx: last.idx, deg: last.deg };
        }
        // 16 向帧按等距地面朝向排（竖向压 0.5），屏幕角先换算成地面朝向再取帧
        const rad = deg * Math.PI / 180;
        const worldDeg = Math.atan2(Math.sin(rad), 2 * Math.cos(rad)) * 180 / Math.PI;
        const idx = asset.dirs16
            ? ((Math.round((worldDeg - 45) / 22.5) % 16) + 16) % 16
            : OrientationSystem.get8DirectionFromAngle(deg);
        headings.set(key, { asset: asset.dir, idx, deg });
        return { idx, deg };
    }
}
