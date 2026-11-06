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
import { NavalWakeDrawer } from '../legion/NavalWakeDrawer';
import { playerTourCaravanDir, playerTourMerchantShipDir } from '../TradeTrafficLayer';
import { STRATEGIC_ARMY_SCALE, STRATEGIC_SPRITE_SCALE } from '../strategicSpriteScale';
import { HeroSpriteDrawer } from './HeroSpriteDrawer';

type Pt = { lat: number; lng: number };

/** 玩家环球形态：陆路＝商队车，海上＝商船 */
export type PlayerTourKind = 'caravan' | 'ship';

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
 * 跨文化换车/换船的滞回：玩家走够这么远（纬度/经度各 0.35°≈40 km）才重新判定所在地文化。
 * 不走滞回的话，贴着两个文化区的边界走会一帧一换车。
 */
const RELOOK_DEG = 0.35;

const assets = new Map<string, TourAsset>();
/** 每个玩家当前的皮肤（按文化区选定后钉住，见 RELOOK_DEG） */
const picks = new Map<string, { kind: PlayerTourKind; dir: string; at: Pt }>();
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
            for (let d = 0; d < nDir; d++) {
                const img = new Image();
                img.onload = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                img.onerror = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                img.src = `${base}/${act}_${d}.png`;
                asset.sheets[d] = img;
            }
        })
        .catch((e) => console.warn(`[PlayerTourSprite] 加载 ${dir} 失败:`, e));
    return asset;
}

/**
 * 玩家当前该用哪套商队/商船皮肤：按所在地文化选定，走够 RELOOK_DEG 才重新判定。
 * 环境商队那套「均化轮换」不适用玩家 —— 玩家同一片文化区里始终是同一种车/船。
 */
export function resolvePlayerTourDir(kind: PlayerTourKind, lat: number, lng: number, key: string): string {
    const prev = picks.get(key);
    if (prev && prev.kind === kind
        && Math.abs(prev.at.lat - lat) < RELOOK_DEG
        && Math.abs(prev.at.lng - lng) < RELOOK_DEG) {
        return prev.dir;
    }
    const dir = kind === 'ship' ? playerTourMerchantShipDir(lat, lng) : playerTourCaravanDir(lat, lng);
    picks.set(key, { kind, dir, at: { lat, lng } });
    return dir;
}

/** 切到环球/航行前预热素材（不阻塞；没预热完就先用人物兵模顶着） */
export function preloadPlayerTourModels(lat: number, lng: number): void {
    ensureAsset(playerTourCaravanDir(lat, lng));
    ensureAsset(playerTourMerchantShipDir(lat, lng));
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
    /** 水迹世界坐标 ↔ 屏幕坐标投影（与军团舰队同一套） */
    projection: {
        toWorld(point: { x: number; y: number }): { x: number; y: number };
        toScreen(point: { x: number; y: number }): { x: number; y: number };
    };
}

export class PlayerTourSpriteDrawer {
    /** 画玩家商队/商船；素材没就绪返回 false（调用方退回人物兵模） */
    public static draw(ctx: CanvasRenderingContext2D, o: PlayerTourDrawOptions): boolean {
        const dir = resolvePlayerTourDir(o.kind, o.to.lat, o.to.lng, o.key);
        const asset = ensureAsset(dir);
        if (!asset.ready) return false;

        const d = this.dirIndex(asset, o.key, o.from, o.to);
        // 帧框与贴图必须同一向：个别素材缺某向时退回 0 向，两处一起退，别拿 A 向的框去切 B 向的图
        const idx = asset.dirs[String(d.idx)] ? d.idx : 0;
        const box = asset.dirs[String(idx)];
        const sheet = asset.sheets[idx];
        if (!box || !sheet || !sheet.complete || !sheet.naturalWidth) return false;

        // 比例：军团基准 scale（0.80）→ 战略地图统一素材基准（0.40）
        const px = o.scale * (STRATEGIC_SPRITE_SCALE / STRATEGIC_ARMY_SCALE);
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
                px * 1.45,
                o.tick,
                o.moving,
                undefined,
                shipLen,
                `playerTour:${o.key}`,
                o.projection,
            );
        }

        // 3. 商队车 / 商船船体
        if (Math.abs(rot) > 0.001) {
            ctx.save();
            ctx.translate(o.center.x, o.center.y);
            ctx.rotate(rot);
            ctx.drawImage(sheet, frame * box.fw, 0, box.fw, box.fh, ax - o.center.x, ay - o.center.y, w, h);
            ctx.restore();
        } else {
            ctx.drawImage(sheet, frame * box.fw, 0, box.fw, box.fh, ax, ay, w, h);
        }

        // 4. 头顶名牌
        HeroSpriteDrawer.drawLabel(ctx, o.center, o.name, o.scale);
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
