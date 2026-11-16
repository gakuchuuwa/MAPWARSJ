/**
 * 海战场面 · 画面层（透明画布，叠在战略地图上）
 *
 * 🔴 [2026-11-16 主人定「按这个方向做」] 舰队对舰队的海战单独成场面：每方 10 艘（九格三排 + 旗舰），自动打。
 * 🔴 [2026-11-16 主人令「尽量还原战略模式的效果，UI 等和陆战差不多；船尾的水花要和战略一致，海面的样式要一致」]
 *   · 海面：不再自己画——画布透明，仗就打在**战略地图的真实海面**上（海岸、海浪层、海洋生物原样），
 *     镜头平移战略地图本身；船按真实海陆绕开陆地（开局就近挑一片够大的水面）。
 *   · 船：与战略地图同一套尺寸（strategicArmyScale × drawNaval 基准）、16 向帧、残差微旋、船帆、势力染色；
 *     船尾/船头浪花直接用 NavalWakeDrawer（DE 原版浪花）。
 *   · 炮弹 / 箭 / 石弹 / 希腊火、落水水花、炮口焰：走战略地图的 ProjectileRenderer（spawnProjectileVolley naval）。
 *   · 旗舰：战略地图同款军旗（LegionFlagDrawer）与名字标签（武将青、军团白、兵力金）。
 *   · 界面：顶部横栏已删（主人令：下面有兵力显示）——兵力看底部战斗面板（与陆战同一套 13 布局），
 *     大事走游戏统一字幕条 SubtitleBanner，右上角只留一个风向罗盘。
 *
 * 生命周期与战术模式同一条路：GameAppCombatHooks 冻结战斗 + battleScene.enter()（暂停大地图），
 *   本层 start() → 每帧 tick() → 判出胜负调 onDecision（→ forceScene13Result 写回兵力）
 *   → 引擎结算 → battleScene.beginLingerAfterDefeat（残局停 3 秒）→ battleScene.exit() → 本层 stop()。
 */

import L from 'leaflet';
import { LegionPhalanxDrawer } from '../map/legion/LegionPhalanxDrawer';
import { NavalWakeDrawer, type WakeProjection } from '../map/legion/NavalWakeDrawer';
import { LegionFlagDrawer } from '../map/legion/LegionFlagDrawer';
import { drawUnitLabel, type UnitLabelStyle } from '../map/UnitLabelCache';
import { strategicArmyScale } from '../map/strategicSpriteScale';
import { SpriteTinter } from '../systems/tinting/SpriteTinter';
import { FactionTintSystem } from '../systems/tinting/FactionTintSystem';
import { TerrainSpeedSystem } from '../core/TerrainSpeedSystem';
import { buildSailLayers } from '../data/NavalSails';
import { getNavalShipChineseName, getNavalShipDrawScale } from '../types/NavalShipTiers';
import { audioManager } from '../audio/AudioManager';
import { NavalFxSprites } from '../map/NavalFxSprites';
import { FX_CFG } from '../ui/scene13/Scene13ProjectilesAndFx';
import { SubtitleBanner } from '../ui/SubtitleBanner';
import { navalHiddenUnitIds, navalSceneFlags } from './navalSceneState';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { syncTacticalWeatherAt, renderTacticalWeather, queryWeatherAt, getSeaStormWaveBoostAt, type TacticalWeatherContext } from '../map/WeatherLayer';
import {
    NavalBattleSim, NAVAL_WORLD_W, NAVAL_WORLD_H, windName,
    type NavalSide, type NavalShip, type NavalEvent, type NavalPhase, type NavalWeatherKind,
} from './NavalBattleSim';
import type { NavalWindCode } from '../data/NavalBattleParams.generated';

export interface NavalWarSideInit {
    factionId: string;
    troops: number;
    shipKey: string;
    flagShipKey?: string;
    rowShipKeys?: { front?: string; main?: string; back?: string };
    /** 名字（武将名优先，其次军团名） */
    name: string;
    generalName?: string | null;
    /** 军团 / 精锐名（旗舰标签第二行，同战略地图） */
    legionName?: string | null;
}

export interface NavalWarInit {
    attacker: NavalWarSideInit;
    defender: NavalWarSideInit;
    seed: string;
    /** 战场所在（战略地图坐标）：开局就近挑一片够大的水面 */
    center?: { lat: number; lng: number } | null;
    /** 跟随军团在守方：守方舰队摆左边 */
    followedOnDefenderSide?: boolean;
    favored?: NavalSide | null;
    title?: string | null;
    /** 史实风向与天气 */
    windCode?: NavalWindCode | null;
    weatherKind?: NavalWeatherKind | null;
    /** 开场附加字幕（如真实史料船数与总兵力） */
    subtitleExtra?: string | null;
    /** 战略地图上要藏起来的军团（参战舰队 + 随军玩家），免得同一支舰队画两份 */
    hiddenUnitIds?: string[];
}

type Fx =
    | { k: 'spark'; x: number; y: number; t: number }
    | { k: 'boom'; x: number; y: number; t: number; big: boolean }
    | { k: 'splash'; x: number; y: number; t: number; big: boolean }
    | { k: 'muzzle'; x: number; y: number; tx: number; ty: number; t: number }
    | { k: 'deImpact'; key: string; x: number; y: number; t: number; dur: number; scale: number }
    | { k: 'text'; x: number; y: number; t: number; text: string; color: string }
    | { k: 'ring'; x: number; y: number; t: number; color: string };

/** 船贴图 1 像素 = 多少世界单位（模拟的船体半径按它定） */
const SPRITE_WS = 0.85;
const SIM_STEP = 1 / 30;
/** 海战场面固定用的战略地图缩放（船与战略地图 zoom 9 同大；一场 20 艘船的仗刚好一屏） */
const NAVAL_SCENE_ZOOM = 9;
/** drawNaval 的船体基准：baseHeight 72 / 帧框基准 64 */
const HULL_BASE = 72 / 64;
/** zoom 9 时 1 世界单位 = 多少屏幕 CSS 像素 */
const U_REF = HULL_BASE * strategicArmyScale(NAVAL_SCENE_ZOOM) * getNavalShipDrawScale(undefined) / SPRITE_WS;
/** 海陆采样格（世界单位）与外扩边（溃逃船会驶出战场矩形） */
const LAND_CELL = 50;
const LAND_MARGIN = 500;
/**
 * 开场准备：海陆掩膜 / 海拔瓦片没加载到的地方 isSeaAt 先答「陆地」并去拉瓦片，
 * 所以开场先停一小会儿（字幕报战名与风向），分几次重采样海岸线、重摆船，拿到可靠的海陆再开船。
 */
const PREP_RESAMPLE_AT = [0.7, 1.6, 2.6];
/** zoom 15 时海陆数据要现拉（zoom 13 的掩膜与高程），多给一次重采样 */
const PREP_RESAMPLE_AT_Z15 = [0.7, 1.6, 2.6, 4.0];

/**
 * 🔴 [2026-11-16 主人令「先做个 zoom15 海战试验版给我看」] 海战把战略地图本身放大到 zoom 15 来打：
 *   船仍是战略地图 zoom 9 的大小，地理放大 64 倍（一屏约 10 公里），海峡、小岛、江河都按真实海岸绕。
 *   默认开；localStorage `mapwar.navalZoom15` 设成 '0' 退回 zoom 9 的旧打法。
 */
const NAVAL_ZOOM15_KEY = 'mapwar.navalZoom15';
const NAVAL_ZOOM15 = 15;
/** zoom 15 时海陆判定用的细数据级别（ESRI 掩膜最细 13；高程同级） */
const FINE_LANDSEA_Z = 13;
function readNavalSceneZoom(): number {
    try { return localStorage.getItem(NAVAL_ZOOM15_KEY) === '0' ? NAVAL_SCENE_ZOOM : NAVAL_ZOOM15; } catch { return NAVAL_ZOOM15; }
}
/** zoom 15 期间（学习陆战战术模式）隐藏战略底图与各类战略图层，改由海战画布 1:1 原生绘制 DE 海面与动态波纹 */
const NAVAL_Z15_STYLE = `
    body.naval-z15 .leaflet-map-pane > .leaflet-pane:not(.leaflet-coastalWave-pane):not(.leaflet-marineLife-pane):not(.leaflet-units-pane):not(.leaflet-unitsLow-pane) {
        visibility: hidden !important;
    }
`;
/** 天气中文名与它对海战的影响（播报用；数值见 NavalBattleSim.WEATHER_EFFECTS） */
const WEATHER_TEXT: Record<string, { name: string; effect: string }> = {
    SEA_STORM: { name: '暴风雨', effect: '海上起了暴风雨，船难操控，弓弩失准，火攻难成' },
    MONSOON_SQUALL: { name: '骤雨', effect: '骤雨倾盆，弓弦受潮，火攻难成' },
    DRIZZLE_MIST: { name: '烟雨', effect: '烟雨蒙蒙，看不远，火势难起' },
    SEA_FOG: { name: '海雾', effect: '海上起雾，弓弩难以及远，双方只能贴近接舷' },
    SNOW: { name: '大雪', effect: '天降大雪，弓弩失准，火势难起' },
    BLIZZARD: { name: '暴风雪', effect: '暴风雪压海，船行艰难，弓弩难中' },
    SANDSTORM: { name: '风沙', effect: '风沙蔽日，弓弩难中' },
};
/** 天气强度低于这个就当晴天（气团边缘只是飘几滴） */
const WEATHER_MIN_STRENGTH = 0.15;
const DEFAULT_COLOR: Record<NavalSide, string> = { attacker: '#d94a3a', defender: '#3a7bd9' };

/** 与 GlobalUnitRenderer 的战略标签同款 */
const LABEL_STYLE_GENERAL: UnitLabelStyle = { id: 'gen', font: 'bold 13px Arial', stroke: 'black', lineWidth: 3, fill: '#00FFFF' };
const LABEL_STYLE_NAME: UnitLabelStyle = { id: 'name', font: 'bold 13px Arial', stroke: 'rgba(0, 0, 0, 0.85)', lineWidth: 3, fill: '#ffffff' };
const LABEL_STYLE_TROOPS: UnitLabelStyle = { id: 'troops', font: 'bold 12px Arial', stroke: 'black', lineWidth: 3, fill: '#ffd700' };

interface DeFxSprite {
    img: HTMLImageElement | null;
    frames: number;
    fw: number;
    fh: number;
    hx: number;
    hy: number;
}
const DE_EXTRA_BASE: Record<string, string> = {
    PROJ_ARROW: '/SUCAI/PROJ_ARROW/',
    PROJ_ARROW_FIRE: '/SUCAI/PROJ_ARROW_FIRE/',
    PROJ_BALL: '/SUCAI/PROJ_BALL/',
    PROJ_ROCK: '/SUCAI/PROJ_ROCK/',
    FLAMETHROWER_FLAME: '/SUCAI_FX/FLAMETHROWER_FLAME/',
    FX_WALL_DUST: '/SUCAI_FX/IMPACT_DUST/dir00/',
};
const DE_FX_KEYS = [
    'FX_FIRE_SMALL', 'FX_FIRE_MEDIUM', 'FX_FIRE_LARGE',
    'FX_EXPLOSION', 'FX_PETARD', 'FX_TREBUCHET_SMOKE', 'FX_WALL_DUST',
    'PROJ_ARROW', 'PROJ_ARROW_FIRE', 'PROJ_BALL', 'PROJ_ROCK', 'FLAMETHROWER_FLAME',
] as const;
const deFxCache = new Map<string, DeFxSprite>();
const DE_SEA_URLS = ['/SUCAI_TERRAIN/wt2.png', '/SUCAI_TERRAIN/wt4.png', '/SUCAI_TERRAIN/wt3.png'] as const;
const deSeaImgs: (HTMLImageElement | null)[] = [null, null, null];
function getDeSeaImg(idx: 0 | 1 | 2): HTMLImageElement | null {
    let img = deSeaImgs[idx];
    if (!img) {
        img = new Image();
        img.src = DE_SEA_URLS[idx];
        deSeaImgs[idx] = img;
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
}
let bakedSeaCanvas: HTMLCanvasElement | null = null;
function getBakedDeSeaCanvas(): HTMLCanvasElement | null {
    if (bakedSeaCanvas) return bakedSeaCanvas;
    const i0 = getDeSeaImg(0), i1 = getDeSeaImg(1), i2 = getDeSeaImg(2);
    if (!i0 || !i1 || !i2) return null;
    const S = Math.max(512, i0.naturalWidth, i0.naturalHeight);
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const g = cv.getContext('2d');
    if (!g) return null;
    g.drawImage(i0, 0, 0, S, S);
    const drawWrapped = (img: HTMLImageElement, alpha: number, ox: number, oy: number) => {
        g.globalAlpha = alpha;
        const dx = ((ox % S) + S) % S;
        const dy = ((oy % S) + S) % S;
        for (const sx of [dx - S, dx]) {
            for (const sy of [dy - S, dy]) {
                g.drawImage(img, sx, sy, S, S);
            }
        }
    };
    drawWrapped(i1, 0.45, Math.round(S * 0.43), Math.round(S * 0.37));
    drawWrapped(i2, 0.22, Math.round(S * 0.19), Math.round(S * 0.71));
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(18, 62, 98, 0.20)';
    g.fillRect(0, 0, S, S);
    bakedSeaCanvas = cv;
    return cv;
}

function getDeFx(key: string): DeFxSprite | null {
    const hit = deFxCache.get(key);
    if (hit) return hit.img && hit.fw > 0 ? hit : null;
    const base = DE_EXTRA_BASE[key] ?? (FX_CFG[key] ? `/SUCAI_FX/${FX_CFG[key].path}/` : null);
    if (!base) return null;
    const entry: DeFxSprite = { img: null, frames: 1, fw: 0, fh: 0, hx: 0, hy: 0 };
    deFxCache.set(key, entry);
    fetch(`${base}_meta.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((m) => {
            if (!m) return;
            entry.frames = m.frames ?? 1;
            entry.fw = m.box_w ?? 0;
            entry.fh = m.box_h ?? 0;
            entry.hx = m.anchor_x ?? 0;
            entry.hy = m.anchor_y ?? 0;
        })
        .catch(() => {});
    const img = new Image();
    img.onload = () => { entry.img = img; };
    img.src = `${base}fly_0.png`;
    return null;
}

function drawDeFxFrame(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    progress: number,
    scale: number,
    alpha = 1,
    rotation = 0,
    frameOverride?: number,
): boolean {
    const fx = getDeFx(key);
    if (!fx || !fx.img || !fx.fw) return false;
    const fr = frameOverride !== undefined
        ? Math.min(fx.frames - 1, Math.max(0, frameOverride))
        : Math.min(fx.frames - 1, Math.max(0, Math.floor(progress * fx.frames)));
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.drawImage(fx.img, fr * fx.fw, 0, fx.fw, fx.fh, -fx.hx * scale, -fx.hy * scale, fx.fw * scale, fx.fh * scale);
    ctx.restore();
    return true;
}

export class NavalWarLayer {
    /** 判出胜负时回调（必须在 start 前赋值） */
    public onDecision: ((winner: NavalSide, survivors: { attacker: number; defender: number }) => void) | null = null;

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private active = false;
    private lingering = false;
    private sim: NavalBattleSim | null = null;
    private init: NavalWarInit | null = null;
    private acc = 0;
    private decided = false;
    private fx: Fx[] = [];
    private focus: { x: number; y: number; until: number } | null = null;
    private colors: Record<NavalSide, string> = { ...DEFAULT_COLOR };
    private wallT = 0;
    private sfxAt: Record<string, number> = {};
    private lastPhase: NavalPhase = 'approach';
    private finalTroops: { attacker: number; defender: number } | null = null;
    private errorLogged = false;
    private runId = 0;
    /** 战场中心（世界 (W/2,H/2) 对应的经纬度）与它在 zoom 9 的投影像素 */
    private centerLL: L.LatLng | null = null;
    private centerPx: L.Point | null = null;
    private landGrid: Uint8Array | null = null;
    private landCols = 0;
    private landRows = 0;
    private panRem = { x: 0, y: 0 };
    /** 镜头：平滑后的目标点（世界坐标）、当前平移速度（CSS px/s）、是否处在「追」的状态（死区迟滞） */
    private camTgt: { x: number; y: number } | null = null;
    private camVel = { x: 0, y: 0 };
    private camMoving = false;
    private subtitleQueue: string[] = [];
    private subtitleAt = -99;
    private shipLenCache = new Map<string, number>();
    private prepStep = 0;
    /** 本场海战用的地图缩放（9 = 旧打法；15 = 试验版） */
    private sceneZoom = NAVAL_SCENE_ZOOM;
    /** 进场前的地图视野，退场原样还回去 */
    private prevView: { center: L.LatLng; zoom: number; maxZoom: number } | null = null;
    private weatherKind: string | null = null;
    private weatherCheckAt = 0;

    /**
     * @param panMap 平移地图：传 GameAppLoop.panByThrottledMoveEnd（与战略跟拍同一个）——
     *   亚像素平移 + moveend 节流、停稳补发。不能每帧 panBy：panBy 每帧都发 moveend，
     *   「等地图停稳才补画」的图层就永远等不到，镜头一动，新露出来的地图就不刷新（主人 11-16 报障）。
     */
    constructor(
        private readonly getMap: () => L.Map | null,
        private readonly panMap?: (map: L.Map, pt: L.Point) => void,
    ) {}

    public attach(): void {
        if (this.canvas) return;
        if (!document.getElementById('naval-war-style')) {
            const st = document.createElement('style');
            st.id = 'naval-war-style';
            st.textContent = `
                body.naval-war-active #debug-control-panel,
                body.naval-war-active .hud-map-panel,
                body.naval-war-active #perf-toggle-btn {
                    display: none !important;
                }
            `;
            document.head.appendChild(st);
        }
        const cv = document.createElement('canvas');
        cv.id = 'naval-war-canvas';
        cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:400;pointer-events:none;display:none;';
        document.body.appendChild(cv);
        this.canvas = cv;
        this.ctx = cv.getContext('2d');
    }

    public isActive(): boolean {
        return this.active || this.lingering;
    }

    /**
     * 战斗面板血槽用的实时兵力（引擎冻结期间数字要跟着船力走）：
     * 开战兵力 × 本方剩余船体比例（被夺的船算到夺船方）。残局待命期间也继续供数。
     */
    public getLiveTroops(): { attacker: number; defender: number } | null {
        if (!this.isActive() || !this.sim || !this.init) return null;
        // 判完胜负：与写回引擎的兵力一致（败方清零），残局停留时数字不再跳
        if (this.finalTroops) return { ...this.finalTroops };
        const hp: Record<NavalSide, number> = { attacker: 0, defender: 0 };
        const max: Record<NavalSide, number> = { attacker: 0, defender: 0 };
        for (const s of this.sim.ships) {
            max[s.origSide] += s.maxHp;
            if (s.state === 'alive' || s.state === 'fled') hp[s.side] += Math.max(0, s.hp);
        }
        const live = (side: NavalSide) => Math.round(this.init![side].troops * Math.min(1, hp[side] / (max[side] || 1)));
        return { attacker: live('attacker'), defender: live('defender') };
    }

    public getInitialTroops(): { attacker: number; defender: number; total: number } | null {
        if (!this.isActive() || !this.init) return null;
        const a = this.init.attacker.troops, d = this.init.defender.troops;
        return { attacker: a, defender: d, total: a + d };
    }

    public start(init: NavalWarInit): void {
        this.attach();
        this.init = init;
        this.runId++;
        const map0 = this.getMap();
        this.sceneZoom = readNavalSceneZoom();
        if (map0) {
            this.prevView = { center: map0.getCenter(), zoom: map0.getZoom(), maxZoom: map0.getMaxZoom() };
            if (map0.getMaxZoom() < this.sceneZoom) map0.setMaxZoom(this.sceneZoom);
        }
        const z15 = this.sceneZoom > NAVAL_SCENE_ZOOM;
        navalSceneFlags.hideAllUnits = z15;
        navalSceneFlags.unitScaleOverride = z15 ? strategicArmyScale(NAVAL_SCENE_ZOOM) : null;
        if (z15 && !document.getElementById('naval-z15-style')) {
            const st = document.createElement('style');
            st.id = 'naval-z15-style';
            st.textContent = NAVAL_Z15_STYLE;
            document.head.appendChild(st);
        }
        document.body.classList.toggle('naval-z15', z15);
        if (z15) {
            this.centerPx = map0 ? map0.project(L.latLng(init.center?.lat ?? 35, init.center?.lng ?? 20), this.sceneZoom) : null;
            this.centerLL = init.center ? L.latLng(init.center.lat, init.center.lng) : (map0 ? map0.getCenter() : null);
            if (map0 && this.centerLL) map0.setView(this.centerLL, this.sceneZoom, { animate: false });
            this.landGrid = null;
        } else {
            this.setupGeography(map0, init.center ?? null);
        }
        this.sim = this.makeSim(init);
        this.prepStep = 0;
        // 与陆战进战术模式同一步：接上战场所在地此刻的天气（没有就按当地气候与季节补一团）
        this.weatherKind = null;
        this.weatherCheckAt = 0;
        const wq = this.weatherQuery();
        if (wq) {
            try { syncTacticalWeatherAt(wq); } catch { /* 天气失败不影响海战 */ }
        }
        this.applyWeather(false);
        this.colors = {
            attacker: FactionTintSystem.getTintHex(init.attacker.factionId) ?? DEFAULT_COLOR.attacker,
            defender: FactionTintSystem.getTintHex(init.defender.factionId) ?? DEFAULT_COLOR.defender,
        };
        if (this.colors.attacker.toLowerCase() === this.colors.defender.toLowerCase()) this.colors.defender = DEFAULT_COLOR.defender;
        this.acc = 0;
        this.decided = false;
        this.fx = [];
        this.focus = null;
        this.wallT = 0;
        this.sfxAt = {};
        this.lastPhase = 'approach';
        this.finalTroops = null;
        this.errorLogged = false;
        this.panRem = { x: 0, y: 0 };
        this.camTgt = null;
        this.camVel = { x: 0, y: 0 };
        this.camMoving = false;
        this.subtitleQueue = [];
        this.subtitleAt = -99;
        this.active = true;
        this.lingering = false;
        navalHiddenUnitIds.clear();
        for (const id of init.hiddenUnitIds ?? []) if (id) navalHiddenUnitIds.add(id);
        LegionPhalanxDrawer.ensureUnitTypeLoading(init.attacker.shipKey);
        LegionPhalanxDrawer.ensureUnitTypeLoading(init.defender.shipKey);
        NavalFxSprites.preload();
        for (const k of DE_FX_KEYS) getDeFx(k);
        getDeSeaImg(0); getDeSeaImg(1); getDeSeaImg(2);
        if (this.canvas) this.canvas.style.display = 'block';
        document.body.classList.add('naval-war-active');
        (window as any).game?.combatUI?.applyScene13Layout?.(true);
        const wind = windName(this.sim.windAng);
        this.say(init.title || `${init.attacker.name} 迎战 ${init.defender.name}`);
        this.say(`海上${wind}，${getNavalShipChineseName(init.attacker.shipKey)} 对 ${getNavalShipChineseName(init.defender.shipKey)}`);
        if (init.subtitleExtra) this.say(init.subtitleExtra);
        this.render(0);
    }

    private makeSim(init: NavalWarInit): NavalBattleSim {
        return new NavalBattleSim({
            attacker: {
                factionId: init.attacker.factionId,
                troops: init.attacker.troops,
                shipKey: init.attacker.shipKey,
                flagShipKey: init.attacker.flagShipKey,
                rowShipKeys: init.attacker.rowShipKeys,
            },
            defender: {
                factionId: init.defender.factionId,
                troops: init.defender.troops,
                shipKey: init.defender.shipKey,
                flagShipKey: init.defender.flagShipKey,
                rowShipKeys: init.defender.rowShipKeys,
            },
            seed: init.seed,
            favored: init.favored ?? null,
            attackerRight: !!init.followedOnDefenderSide,
            isWater: this.landGrid ? (x, y) => this.isWaterAt(x, y) : undefined,
            windCode: init.windCode ?? null,
            weatherKind: init.weatherKind ?? null,
        });
    }

    /** 判完胜负后的残局：船停在原地继续漂、火继续烧，等场景退场 */
    public beginLinger(): void {
        if (!this.active) return;
        this.active = false;
        this.lingering = true;
    }

    public stop(): void {
        if (!this.active && !this.lingering && !this.sim) return;
        this.active = false;
        this.lingering = false;
        this.sim = null;
        this.fx = [];
        this.subtitleQueue = [];
        navalHiddenUnitIds.clear();
        document.body.classList.remove('naval-war-active');
        // 还原地图：视野先回去，再把缩放上限收回（Leaflet 收上限时若还在 15 会自己硬跳）
        const map = this.getMap();
        if (map && this.prevView) {
            try {
                map.setView(this.prevView.center, this.prevView.zoom, { animate: false });
                map.setMaxZoom(this.prevView.maxZoom);
            } catch { /* 地图还原失败不影响收场 */ }
        }
        this.prevView = null;
        navalSceneFlags.hideAllUnits = false;
        navalSceneFlags.unitScaleOverride = null;
        document.body.classList.remove('naval-z15');
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    public tick(dt: number): void {
        if (!this.isActive() || !this.sim) return;
        try {
            this.tickInner(dt);
        } catch (e) {
            // 画面层出错绝不能卡住主循环：记一次错，按当前船力直接判胜负，交还引擎收场
            if (!this.errorLogged) {
                this.errorLogged = true;
                console.error('[NavalWar] 海战场面出错，按当前船力判定胜负', e);
            }
            if (!this.decided && this.sim && this.init) {
                const live = this.getLiveTroops() ?? { attacker: this.init.attacker.troops, defender: this.init.defender.troops };
                const winner: NavalSide = live.attacker >= live.defender ? 'attacker' : 'defender';
                this.sim.result = { winner, winnerStrength: Math.max(0.05, live[winner] / Math.max(1, this.init[winner].troops)), loserStrength: 0 };
                this.decide();
            }
        }
    }

    private tickInner(dt: number): void {
        if (!this.sim) return;
        const realDt = Math.max(0, Math.min(0.1, dt));
        this.wallT += realDt;
        const prepTimes = this.sceneZoom > NAVAL_SCENE_ZOOM ? PREP_RESAMPLE_AT_Z15 : PREP_RESAMPLE_AT;
        if (this.active && !this.decided && this.prepStep < prepTimes.length) {
            // 开场准备：重采样海岸线、重摆船（船还没开动，换中心与重摆都看不出来）
            if (this.wallT >= prepTimes[this.prepStep]) {
                this.prepStep++;
                if (this.init) {
                    this.setupGeography(this.getMap(), this.init.center ?? null, false);
                    this.sim = this.makeSim(this.init);
                    this.weatherKind = null;
                    this.applyWeather(false);
                }
            }
        } else if (this.active && !this.decided) {
            this.acc += realDt;
            while (this.acc >= SIM_STEP) {
                this.acc -= SIM_STEP;
                this.sim.step(SIM_STEP);
                this.handleEvents(this.sim.drainEvents());
                if (this.sim.result) break;
            }
            if (this.sim.result) this.decide();
        }
        if (this.active && !this.decided && this.wallT >= this.weatherCheckAt) {
            this.weatherCheckAt = this.wallT + 1;
            this.applyWeather(true);
        }
        this.updateFx(realDt);
        this.pumpSubtitles();
        this.updateCamera(realDt);
        this.render(realDt);
    }

    private weatherQuery(): TacticalWeatherContext | null {
        if (this.centerLL) return { lat: this.centerLL.lat, lng: this.centerLL.lng, isSea: true };
        const c = this.init?.center;
        return c ? { lat: c.lat, lng: c.lng, isSea: true } : null;
    }

    /**
     * 天气 → 海战：同一团天气决定航速 / 射程 / 命中 / 火攻（NavalBattleSim.setWeather），
     * 风往雨雪斜飘的那边吹（setWindFromWeather）。天气来了、换了、散了都播报一句。
     */
    private applyWeather(announce: boolean): void {
        const sim = this.sim;
        const q = this.weatherQuery();
        if (!sim || !q) return;
        let w: ReturnType<typeof queryWeatherAt> = null;
        try { w = queryWeatherAt(q); } catch { w = null; }
        const kind = w && w.strength >= WEATHER_MIN_STRENGTH && WEATHER_TEXT[w.kind] ? w.kind : null;
        sim.setWeather(kind, w?.strength ?? 0);
        if (kind && w) {
            const xs = Math.sin(w.windAngle);
            if (Math.abs(xs) > 0.02) sim.setWindFromWeather(Math.sign(xs));
        }
        if (kind === this.weatherKind) return;
        const prev = this.weatherKind;
        this.weatherKind = kind;
        if (!announce) {
            if (kind) this.say(WEATHER_TEXT[kind].effect);
            return;
        }
        if (kind) this.say(WEATHER_TEXT[kind].effect, true);
        else if (prev && WEATHER_TEXT[prev]) this.say(`${WEATHER_TEXT[prev].name}渐散，海面转晴`);
    }

    private decide(): void {
        if (this.decided || !this.sim?.result || !this.init) return;
        this.decided = true;
        const r = this.sim.result;
        const winSide = r.winner;
        const loseSide: NavalSide = winSide === 'attacker' ? 'defender' : 'attacker';
        this.subtitleQueue = [];
        this.say(`${this.init[winSide].name} 大胜`, true);
        const survivors = { attacker: 0, defender: 0 };
        survivors[winSide] = Math.max(1, Math.round(this.init[winSide].troops * Math.min(1, r.winnerStrength)));
        survivors[loseSide] = 0;
        this.finalTroops = { ...survivors };
        try {
            this.onDecision?.(winSide, survivors);
        } catch (e) {
            console.error('[NavalWar] 胜负写回失败', e);
        }
    }

    // ─────────────────────────── 战场落在真实海面上 ───────────────────────────

    /** 世界坐标 → 战略地图 zoom 9 像素（墨卡托投影像素是线性的，任何缩放都按 2^(z-9) 换算） */
    private worldToRefPx(x: number, y: number, base: L.Point): L.Point {
        return L.point(base.x + (x - NAVAL_WORLD_W / 2) * U_REF, base.y + (y - NAVAL_WORLD_H / 2) * U_REF);
    }

    /**
     * 选战场中心 + 采样海陆：在开战点附近找一处「战场矩形里陆地最少」的水面（近的优先），
     * 然后按格采样海陆给模拟绕岸用。陆地太多（找不到像样的水面）就不绕岸，免得船卡死。
     */
    private setupGeography(map: L.Map | null, center: { lat: number; lng: number } | null, moveView = true): void {
        this.landGrid = null;
        this.centerLL = null;
        this.centerPx = null;
        if (!map) return;
        const c0 = center ? L.latLng(center.lat, center.lng) : map.getCenter();
        const Z = this.sceneZoom;
        const p0 = map.project(c0, Z);
        const fine = Z > NAVAL_SCENE_ZOOM;
        const seaAt = (p: L.Point): boolean => {
            try {
                const ll = map.unproject(p, Z);
                return fine ? this.fineWaterAt(ll.lat, ll.lng) : TerrainSpeedSystem.isSeaAt({ lat: ll.lat, lng: ll.lng });
            } catch { return true; }
        };
        const landFrac = (base: L.Point): number => {
            let land = 0, n = 0;
            for (let i = 0; i <= 15; i++) {
                for (let j = 0; j <= 8; j++) {
                    const p = this.worldToRefPx(NAVAL_WORLD_W * (-0.15 + 1.30 * i / 15), NAVAL_WORLD_H * (-0.15 + 1.30 * j / 8), base);
                    if (!seaAt(p)) land++;
                    n++;
                }
            }
            return land / n;
        };
        let best = p0, bestScore = Infinity, bestFrac = 1;
        const rings = [0, 300, 600, 1000, 1500, 2200, 3000];
        for (const r of rings) {
            const steps = r === 0 ? 1 : 12;
            for (let k = 0; k < steps; k++) {
                const a = k * Math.PI * 2 / steps;
                const cand = L.point(p0.x + Math.cos(a) * r, p0.y + Math.sin(a) * r);
                const f = landFrac(cand);
                const score = f + r / 12000;
                if (score < bestScore) { bestScore = score; best = cand; bestFrac = f; }
            }
            if (bestFrac === 0) break;   // 整屏全海域，不必再往远找
        }
        this.centerPx = best;
        this.centerLL = map.unproject(best, Z);
        // 只在开场摆一次视野；准备期重采样换了中心也不跳地图，交给镜头平滑平移过去
        if (moveView) map.setView(this.centerLL, Z, { animate: false });
        if (bestFrac > 0.55) return;   // 四面是陆：不绕岸
        const cols = Math.ceil((NAVAL_WORLD_W + LAND_MARGIN * 2) / LAND_CELL) + 1;
        const rows = Math.ceil((NAVAL_WORLD_H + LAND_MARGIN * 2) / LAND_CELL) + 1;
        const grid = new Uint8Array(cols * rows);
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const p = this.worldToRefPx(i * LAND_CELL - LAND_MARGIN, j * LAND_CELL - LAND_MARGIN, best);
                grid[j * cols + i] = seaAt(p) ? 1 : 0;
            }
        }
        this.landGrid = grid;
        this.landCols = cols;
        this.landRows = rows;
    }

    /**
     * zoom 15 用的细海陆判定：ESRI zoom 13 掩膜说是水就是水（江河湖泊也算，船能进），说不是就不是；
     * 掩膜没到先看 zoom 13 高程（≤0 算水），都没到才退回 zoom 9 的粗判定，并去拉细数据。
     */
    private fineWaterAt(lat: number, lng: number): boolean {
        const ws = LandSeaSystem.getWaterSampler();
        const es = LandSeaSystem.getSampler();
        const m = ws.isWaterSync(lat, lng, FINE_LANDSEA_Z);
        if (m === true) return true;
        if (m === false) return false;
        ws.scheduleFetch(lat, lng, FINE_LANDSEA_Z);
        const e = es.getElevationSync(lat, lng, FINE_LANDSEA_Z);
        if (e === null) {
            es.scheduleFetch(lat, lng, FINE_LANDSEA_Z);
            return TerrainSpeedSystem.isSeaAt({ lat, lng });
        }
        return e <= 0;
    }

    /** 开场先把战场一带的 zoom 13 海陆数据拉起来（找水面的搜索范围约 ±2 个战场宽） */
    private prefetchFineLandSea(center: { lat: number; lng: number }): void {
        const map = this.getMap();
        if (!map) return;
        try {
            const p = map.project(L.latLng(center.lat, center.lng), this.sceneZoom);
            const half = NAVAL_WORLD_W * U_REF * 2.2;
            const nw = map.unproject(L.point(p.x - half, p.y - half), this.sceneZoom);
            const se = map.unproject(L.point(p.x + half, p.y + half), this.sceneZoom);
            LandSeaSystem.getWaterSampler().prefetchBounds(nw.lat, se.lat, nw.lng, se.lng, FINE_LANDSEA_Z);
            LandSeaSystem.getSampler().prefetchBounds(nw.lat, se.lat, nw.lng, se.lng, FINE_LANDSEA_Z);
        } catch { /* 预取失败就靠重采样时按需拉 */ }
    }

    /** 船、旗、标签、浪花的缩放：船始终是战略地图 zoom 9 的大小，只有玩家手动缩放时跟着变 */
    private mapScaleAt(zoom: number): number {
        return strategicArmyScale(NAVAL_SCENE_ZOOM) * Math.pow(2, zoom - this.sceneZoom);
    }

    private isWaterAt(x: number, y: number): boolean {
        const g = this.landGrid;
        if (!g) return true;
        const i = Math.round((x + LAND_MARGIN) / LAND_CELL);
        const j = Math.round((y + LAND_MARGIN) / LAND_CELL);
        if (i < 0 || j < 0 || i >= this.landCols || j >= this.landRows) return true;
        return g[j * this.landCols + i] === 1;
    }

    /** 当前缩放下 1 世界单位 = 多少 CSS 像素 */
    private unitPx(map: L.Map): number {
        return U_REF * Math.pow(2, map.getZoom() - this.sceneZoom);
    }

    /** 经纬度 → 容器 CSS 像素（亚像素，与 GlobalUnitRenderer.latLngToContainerPointSubpixel 同法） */
    private llToScreen(map: L.Map, ll: L.LatLngExpression): L.Point {
        const zoom = map.getZoom();
        const projected = map.project(ll, zoom);
        const origin = map.getPixelOrigin();
        const pane = (map as unknown as { _getMapPanePos?: () => L.Point })._getMapPanePos?.() ?? L.point(0, 0);
        return L.point(projected.x - origin.x + pane.x, projected.y - origin.y + pane.y);
    }

    private worldToLatLng(map: L.Map, x: number, y: number): L.LatLng {
        return map.unproject(this.worldToRefPx(x, y, this.centerPx!), this.sceneZoom);
    }

    /** 本帧的世界 → 屏幕换算（每帧取一次锚点，之后都是线性） */
    private frameXf(map: L.Map): { ax: number; ay: number; u: number } {
        const a = this.llToScreen(map, this.centerLL!);
        return { ax: a.x, ay: a.y, u: this.unitPx(map) };
    }

    // ─────────────────────────── 事件 → 特效 / 播报 / 音效 ───────────────────────────

    private sideName(side: NavalSide): string {
        return this.init?.[side].name ?? (side === 'attacker' ? '攻方' : '守方');
    }

    private handleEvents(events: NavalEvent[]): void {
        const sim = this.sim!;
        for (const e of events) {
            switch (e.type) {
                case 'fire': {
                    if (e.weapon === 'cannon') {
                        this.fx.push({ k: 'muzzle', x: e.x, y: e.y, tx: e.tx, ty: e.ty, t: 0 });
                        this.sfx('naval_cannon_fire', 0.35);
                    } else if (e.weapon === 'arrow') this.sfx('naval_arrow_fire', 0.45);
                    else if (e.weapon === 'trebuchet') this.sfx('naval_cannon_fire', 0.9);
                    break;
                }
                case 'impact':
                    if (e.hit) {
                        if (e.weapon === 'cannon') this.fx.push({ k: 'deImpact', key: 'FX_EXPLOSION', x: e.x, y: e.y, t: 0, dur: 0.45, scale: 0.65 });
                        else if (e.weapon === 'trebuchet') this.fx.push({ k: 'deImpact', key: 'FX_TREBUCHET_SMOKE', x: e.x, y: e.y, t: 0, dur: 0.48, scale: 0.72 });
                        else if (e.weapon === 'greekfire') this.fx.push({ k: 'deImpact', key: 'FLAMETHROWER_FLAME', x: e.x, y: e.y, t: 0, dur: 0.4, scale: 0.62 });
                        else this.fx.push({ k: 'spark', x: e.x, y: e.y, t: 0 });
                    } else {
                        this.fx.push({ k: 'splash', x: e.x, y: e.y, t: 0, big: e.weapon === 'cannon' || e.weapon === 'trebuchet' });
                        if (e.weapon !== 'arrow') this.sfx('naval_cannon_splash', 0.4);
                    }
                    break;
                case 'ignite':
                    if (e.isFlag) {
                        this.say(`${this.sideName(e.side)} 旗舰起火`, true);
                        this.focusOn(e.x, e.y, 3);
                    }
                    break;
                case 'ram':
                    this.fx.push({ k: 'splash', x: e.x, y: e.y, t: 0, big: true });
                    this.fx.push({ k: 'deImpact', key: 'FX_WALL_DUST', x: e.x, y: e.y, t: 0, dur: 0.5, scale: 0.72 });
                    this.fx.push({ k: 'boom', x: e.x, y: e.y, t: 0, big: false });
                    this.fx.push({ k: 'text', x: e.x, y: e.y, t: 0, text: '冲撞', color: '#ffffff' });
                    this.sfx('naval_explode', 0.6);
                    break;
                case 'boardStart':
                    this.fx.push({ k: 'deImpact', key: 'FX_WALL_DUST', x: e.x, y: e.y, t: 0, dur: 0.45, scale: 0.55 });
                    this.fx.push({ k: 'text', x: e.x, y: e.y, t: 0, text: '接舷', color: '#ffe9b0' });
                    break;
                case 'capture':
                    this.fx.push({ k: 'ring', x: e.x, y: e.y, t: 0, color: this.colors[e.side] });
                    this.fx.push({ k: 'text', x: e.x, y: e.y, t: 0, text: e.isFlag ? '夺下敌旗舰' : '夺船', color: this.colors[e.side] });
                    if (e.isFlag) {
                        this.say(`${this.sideName(e.side)} 跳帮夺下敌方旗舰`, true);
                        this.focusOn(e.x, e.y, 4);
                    } else {
                        this.say(`${this.sideName(e.side)} 接舷夺下一艘敌船，换上自家旗号`);
                        this.focusOn(e.x, e.y, 2.5);
                    }
                    break;
                case 'sink':
                    this.fx.push({ k: 'splash', x: e.x, y: e.y, t: 0, big: true });
                    this.fx.push({ k: 'boom', x: e.x, y: e.y, t: 0, big: e.explode || e.isFlag });
                    this.sfx(e.explode || e.isFlag ? 'naval_explode' : 'naval_sink', 0.2);
                    if (e.isFlag) {
                        this.say(`${this.sideName(e.side)} 旗舰沉没`, true);
                        this.focusOn(e.x, e.y, 4);
                    } else if (e.explode) {
                        this.fx.push({ k: 'text', x: e.x, y: e.y, t: 0, text: '殉爆', color: '#ffb060' });
                    }
                    break;
                case 'windShift': {
                    const wn = windName(sim.windAng);
                    this.say(e.windward ? `风向转为${wn}，${this.sideName(e.windward)} 占了上风` : `风向转为${wn}`, true);
                    break;
                }
                case 'rout':
                    this.say(e.reason === 'flag'
                        ? `${this.sideName(e.side)} 帅旗已倒，全军溃散`
                        : `${this.sideName(e.side)} 船队折损殆尽，掉头溃逃`, true);
                    break;
                case 'phase':
                    if (e.phase !== this.lastPhase) {
                        this.lastPhase = e.phase;
                        if (e.phase === 'exchange') this.say('进入射程，双方开始对射');
                        else if (e.phase === 'melee') this.say('两军船队绞在一起，接舷肉搏');
                    }
                    break;
            }
        }
    }

    private sfx(key: string, minGap: number): void {
        const last = this.sfxAt[key] ?? -99;
        if (this.wallT - last < minGap) return;
        this.sfxAt[key] = this.wallT;
        try { audioManager.play(key as any); } catch { /* 音效失败不影响演出 */ }
    }

    /** 播报走游戏统一字幕条；排队，一条至少停 2.8 秒。urgent 插到最前、挤掉排着的普通条 */
    private say(text: string, urgent = false): void {
        if (urgent) this.subtitleQueue = [text, ...this.subtitleQueue.slice(0, 1)];
        else if (this.subtitleQueue.length < 3) this.subtitleQueue.push(text);
    }

    private pumpSubtitles(): void {
        if (this.subtitleQueue.length === 0 || this.wallT - this.subtitleAt < 2.8) return;
        const text = this.subtitleQueue.shift()!;
        this.subtitleAt = this.wallT;
        try { SubtitleBanner.show(text, 3200, false, true); } catch { /* 字幕失败不影响演出 */ }
    }

    /**
     * 🔴 [2026-11-16 主人令「海战的跟随镜头…最好不要乱动」] 出大事不再把镜头拉过去（原来起火 / 夺船 / 旗舰沉没
     *    各拉一次、几秒后再拉回，一场仗来回好几趟）。大事只靠字幕播报；保留函数免得调用点散改。
     */
    private focusOn(_x: number, _y: number, _secs: number): void {
        this.focus = null;
    }

    private updateFx(dt: number): void {
        for (let i = this.fx.length - 1; i >= 0; i--) {
            const f = this.fx[i];
            f.t += dt;
            const life = f.k === 'text' ? 1.8
                : f.k === 'boom' ? (f.big ? 2.2 : 1.0)
                : f.k === 'splash' ? (f.big ? 1.15 : 0.75)
                : f.k === 'muzzle' ? NavalFxSprites.durationMs('CANNON_MUZZLE') / 1000
                : f.k === 'deImpact' ? f.dur
                : f.k === 'ring' ? 1.4
                : 0.55;
            if (f.t > life) this.fx.splice(i, 1);
        }
        if (this.fx.length > 300) this.fx.splice(0, this.fx.length - 300);
    }

    // ─────────────────────────── 镜头：平移战略地图本身 ───────────────────────────

    /**
     * 🔴 [2026-11-16 主人令「海战的跟随镜头请检查下，合理吗，最好不要乱动」] 稳定跟拍：
     *   · 目标 = 在场战船（未沉、未溃逃）的重心，旗舰算两份；再做 2.5 秒低通 —— 有船沉 / 逃 / 被夺时重心不跳；
     *     旧写法取「所有船的外框中心」，外框边上一艘船一没，目标就跳几百像素。
     *   · 死区 + 迟滞：重心偏离画面中心超过 16% 屏宽 / 屏高才开始追，追回 3% 以内就停；
     *     旧写法没有死区，船绕着打、目标每帧在变，镜头 95% 的时间都在漂。
     *   · 限速 90 px/s、加速度 80 px/s²：起步、停下都是缓的，不会被一次跳变拽着猛冲（旧写法实测峰值 676 px/s）。
     *   · 出大事不拉镜头（见 focusOn）。
     */
    private updateCamera(dt: number): void {
        const map = this.getMap();
        const sim = this.sim;
        if (!map || !sim || !this.centerLL || dt <= 0) return;
        // ① 在场战船重心（溃逃、下沉的不算；全溃散时退回所有还浮着的船）
        let sx = 0, sy = 0, w = 0;
        for (const pass of [0, 1]) {
            for (const s of sim.ships) {
                if (s.state !== 'alive') continue;
                if (pass === 0 && s.routing) continue;
                const k = s.role === 'flag' ? 2 : 1;
                sx += s.x * k; sy += s.y * k; w += k;
            }
            if (w > 0) break;
        }
        if (w === 0) return;
        const rawX = sx / w;
        const rawY = sy / w + 45;   // 底部有兵力条，取景略往下压一点即可
        if (!this.camTgt) this.camTgt = { x: rawX, y: rawY };
        const a = 1 - Math.exp(-dt / 0.7);
        this.camTgt.x += (rawX - this.camTgt.x) * a;
        this.camTgt.y += (rawY - this.camTgt.y) * a;
        // ② 目标在屏幕上离中心多远
        const xf = this.frameXf(map);
        const size = map.getSize();
        const offX = xf.ax + (this.camTgt.x - NAVAL_WORLD_W / 2) * xf.u - size.x / 2;
        const offY = xf.ay + (this.camTgt.y - NAVAL_WORLD_H / 2) * xf.u - size.y / 2;
        // ③ 死区迟滞
        if (!this.camMoving && (Math.abs(offX) > size.x * 0.08 || Math.abs(offY) > size.y * 0.08)) this.camMoving = true;
        if (this.camMoving && Math.hypot(offX, offY) < Math.min(size.x, size.y) * 0.02) this.camMoving = false;
        // ④ 限速 + 限加速度
        const MAX_V = 220, MAX_A = 280;
        let wantX = 0, wantY = 0;
        if (this.camMoving) {
            wantX = offX * 1.4;
            wantY = offY * 1.4;
            const sp = Math.hypot(wantX, wantY);
            if (sp > MAX_V) { wantX *= MAX_V / sp; wantY *= MAX_V / sp; }
        }
        const dvx = wantX - this.camVel.x, dvy = wantY - this.camVel.y;
        const dv = Math.hypot(dvx, dvy);
        const maxDv = MAX_A * dt;
        if (dv > maxDv) {
            this.camVel.x += dvx * maxDv / dv;
            this.camVel.y += dvy * maxDv / dv;
        } else {
            this.camVel.x = wantX;
            this.camVel.y = wantY;
        }
        const px = this.camVel.x * dt, py = this.camVel.y * dt;
        if (Math.abs(px) + Math.abs(py) < 0.01) return;
        const pt = L.point(px, py);
        if (this.panMap) {
            this.panMap(map, pt);
            return;
        }
        // 兜底（无头测试等没注入平移函数时）：整像素 panBy
        this.panRem.x += pt.x;
        this.panRem.y += pt.y;
        const ix = Math.round(this.panRem.x), iy = Math.round(this.panRem.y);
        if (ix === 0 && iy === 0) return;
        this.panRem.x -= ix;
        this.panRem.y -= iy;
        map.panBy(L.point(ix, iy), { animate: false });
    }

    // ─────────────────────────── 绘制 ───────────────────────────

    private render(_dt: number): void {
        const cv = this.canvas, ctx = this.ctx, sim = this.sim;
        const map = this.getMap();
        if (!cv || !ctx || !sim) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const vw = window.innerWidth, vh = window.innerHeight;
        const cw = Math.round(vw * dpr), ch = Math.round(vh * dpr);
        if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cw, ch);
        if (!map || !this.centerLL) return;
        // 画布铺满视口，地图容器不一定从 (0,0) 开始：按容器偏移对齐
        const rect = map.getContainer().getBoundingClientRect();
        ctx.setTransform(dpr, 0, 0, dpr, rect.left * dpr, rect.top * dpr);
        const xf = this.frameXf(map);
        const zoom = map.getZoom();
        const mapScale = this.mapScaleAt(zoom);
        const toS = (x: number, y: number) => ({ x: xf.ax + (x - NAVAL_WORLD_W / 2) * xf.u, y: xf.ay + (y - NAVAL_WORLD_H / 2) * xf.u });
        const projection: WakeProjection = {
            toWorld: (p) => {
                const ll = map.containerPointToLatLng(L.point(p.x, p.y));
                return { x: ll.lng, y: ll.lat };
            },
            toScreen: (p) => this.llToScreen(map, [p.y, p.x]),
        };
        const order = sim.ships.filter((s) => s.state !== 'sunk' && s.state !== 'fled').sort((a, b) => a.y - b.y);
        const poses = new Map<number, ShipPose>();
        for (const s of order) poses.set(s.id, this.shipPose(s, toS(s.x, s.y), zoom));
        // ① 海面铺底（zoom > 12 时学习陆战 Scene13：1:1 原生 DE 海水贴图 + 世界锚定波纹）+ 船尾/船头浪花
        const tick = performance.now();
        if (zoom > 12) {
            this.drawDeSeaBackground(ctx, toS, vw, vh);
            this.drawSeaRipples(ctx, toS, xf.u, vw, vh, tick, sim.windAng);
        }
        for (const s of order) {
            const p = poses.get(s.id)!;
            NavalWakeDrawer.drawNavalWakes(
                ctx,
                [{ x: p.x, y: p.y, r: 0, isAlive: s.state === 'alive', dir: p.dir, rot: p.rot, deg: p.deg, shipLen: p.len }],
                p.dir, mapScale, tick, s.state === 'alive' && s.speed > 6 && s.boardingWith === null,
                undefined, p.len * 1.15, `navalwar-${this.runId}-${s.id}`, projection,
            );
        }
        for (const s of order) this.drawBoardingLink(ctx, s, toS, xf.u);
        // ② 旗杆（在船后面）→ 船 → 旗面
        const year = (window as any).game?.timeSystem?.getYear?.() ?? -999;
        for (const s of order) {
            const p = poses.get(s.id)!;
            const isFlag = s.role === 'flag' && s.state === 'alive';
            if (isFlag) LegionFlagDrawer.drawPole(ctx, { x: p.x, y: p.y }, mapScale, s.factionId || 'panshu');
            this.drawShip(ctx, s, p, xf.u, mapScale);
            if (isFlag) LegionFlagDrawer.drawFlag(ctx, { x: p.x, y: p.y }, 0, mapScale, Date.now(), s.factionId || 'panshu', year);
        }
        for (const s of order) this.drawBoardingMelee(ctx, s, toS, xf.u, mapScale);
        this.drawProjectiles(ctx, toS, xf.u, mapScale);
        this.drawFx(ctx, toS, xf.u, mapScale);
        for (const s of order) this.drawShipBadge(ctx, s, poses.get(s.id)!, mapScale);
        // ③ 天气：与陆战战术模式同一套整屏雨雪雾（WeatherLayer.renderTactical），盖在船上面
        const wq = this.weatherQuery();
        if (wq) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            try { renderTacticalWeather(ctx, cw, ch, wq); } catch { /* 天气失败不影响海战 */ }
        }
        // ④ 风向罗盘（右上，屏幕坐标）
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.drawWindCompass(ctx, vw);
    }

    /** 屏幕位置 + 16 向帧 + 残差角 + 船长（与 LegionPhalanxDrawer.drawNaval 同一套换算） */
    private shipPose(s: NavalShip, at: { x: number; y: number }, zoom: number): ShipPose {
        const h = s.heading;
        let shipDeg = (Math.atan2(Math.cos(h), -Math.sin(h)) * 180 / Math.PI);
        shipDeg = ((shipDeg % 360) + 360) % 360;
        const shipRad = shipDeg * Math.PI / 180;
        const worldDeg = ((Math.atan2(Math.sin(shipRad), 2 * Math.cos(shipRad)) * 180 / Math.PI) % 360 + 360) % 360;
        const dir = ((Math.round((worldDeg - 45) / 22.5) % 16) + 16) % 16;
        const frameRad = (45 + 22.5 * dir) * Math.PI / 180;
        let resDeg = shipDeg - Math.atan2(Math.sin(frameRad), 0.5 * Math.cos(frameRad)) * 180 / Math.PI;
        while (resDeg > 180) resDeg -= 360;
        while (resDeg < -180) resDeg += 360;
        const hs = HULL_BASE * this.mapScaleAt(zoom) * getNavalShipDrawScale(s.shipKey);
        return { x: at.x, y: at.y, dir, rot: resDeg * Math.PI / 180, deg: shipDeg, hs, len: this.refLen(s.shipKey) * hs };
    }

    /** 参考船长（16 向帧框最长边，素材像素）；素材没到时按楼船量级估 */
    private refLen(key: string): number {
        const hit = this.shipLenCache.get(key);
        if (hit) return hit;
        const dyn = (LegionPhalanxDrawer.getUnitAssets(key) as any)?.dyn?.IDLE;
        if (!dyn?.dirs) return 170;
        let len = 0;
        for (const d of Object.values(dyn.dirs) as { fw: number; fh: number }[]) len = Math.max(len, d.fw, d.fh);
        if (len > 0) this.shipLenCache.set(key, len);
        return len || 170;
    }

    private drawBoardingLink(ctx: CanvasRenderingContext2D, s: NavalShip, toS: (x: number, y: number) => { x: number; y: number }, u: number): void {
        if (s.boardingWith === null || s.state !== 'alive') return;
        const o = this.sim!.getShip(s.boardingWith);
        if (!o || s.id > o.id) return;
        const a = toS(s.x, s.y), b = toS(o.x, o.y);
        const nx = -(b.y - a.y), ny = b.x - a.x;
        const nl = Math.hypot(nx, ny) || 1;
        // 抛绳索带自然垂弧
        ctx.save();
        for (let k = -1; k <= 1; k++) {
            const off = k * 15 * u;
            const ax = a.x + nx / nl * off, ay = a.y + ny / nl * off;
            const bx = b.x + nx / nl * off, by = b.y + ny / nl * off;
            const cx = (ax + bx) / 2, cy = (ay + by) / 2 + 8 * u;
            ctx.strokeStyle = 'rgba(72,52,24,0.9)';
            ctx.lineWidth = Math.max(2, 3.8 * u);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.quadraticCurveTo(cx, cy, bx, by);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(208,168,96,0.95)';
            ctx.lineWidth = Math.max(1.2, 2.0 * u);
            ctx.stroke();
        }
        ctx.restore();
    }

    /** 接舷白刃战特效：纯 DE 撞击尘烟（FX_WALL_DUST / FX_TREBUCHET_SMOKE）＋ Scene13 同款短脉冲交锋火星 */
    private drawBoardingMelee(
        ctx: CanvasRenderingContext2D,
        s: NavalShip,
        toS: (x: number, y: number) => { x: number; y: number },
        u: number,
        mapScale: number,
    ): void {
        if (s.boardingWith === null || s.state !== 'alive') return;
        const o = this.sim!.getShip(s.boardingWith);
        if (!o || s.id > o.id) return;
        const a = toS(s.x, s.y), b = toS(o.x, o.y);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 12 * u;
        const dx = b.x - a.x, dy = b.y - a.y;
        const nx = -dy, ny = dx;
        const nl = Math.hypot(nx, ny) || 1;
        const ux = nx / nl, uy = ny / nl;
        const dustScale = HULL_BASE * mapScale * 0.22;

        ctx.save();
        ctx.lineCap = 'round';
        for (let slot = 0; slot < 3; slot++) {
            const cyc = (this.wallT * 2.4 + s.id * 0.43 + o.id * 0.29 + slot * 0.34) % 1;
            if (cyc > 0.55) continue;
            const k = cyc / 0.55;
            const fade = 1 - k;
            const along = (slot - 1) * 18 * u + Math.sin(slot * 3.1 + Math.floor(this.wallT * 2.4 + slot)) * 6 * u;
            const cx = mx + ux * along;
            const cy = my + uy * along;

            // DE 尘烟精灵（IMPACT_DUST / IMPACT_TREBUCHET_SMOKE）
            drawDeFxFrame(ctx, slot === 1 ? 'FX_TREBUCHET_SMOKE' : 'FX_WALL_DUST', cx, cy + 4 * u, k, dustScale, 0.45 * fade);

            // Scene13 同款兵刃交锋火星
            for (let sp = 0; sp < 5; sp++) {
                const sa = sp * (Math.PI * 2 / 5) + slot * 1.7 + k * 0.4;
                const dist = k * (14 + (sp % 2) * 8) * u;
                const sx = cx + Math.cos(sa) * dist;
                const sy = cy + Math.sin(sa) * dist * 0.7 - Math.sin(k * Math.PI) * 7 * u;
                ctx.strokeStyle = `rgba(255,180,45,${(0.9 * fade).toFixed(3)})`;
                ctx.lineWidth = Math.max(1.1, 2.0 * u * fade);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx - Math.cos(sa) * 5 * u, sy - Math.sin(sa) * 3.5 * u);
                ctx.stroke();
                ctx.fillStyle = `rgba(255,255,255,${fade.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.3 * u * fade, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    /** 与陆战 Scene13 一致：预先将多层 DE 海水贴图烘焙到离屏画布，每帧只做几次纯 GPU drawImage 平铺，不每帧 createPattern/旋转 */
    private drawDeSeaBackground(
        ctx: CanvasRenderingContext2D,
        toS: (x: number, y: number) => { x: number; y: number },
        vw: number,
        vh: number,
    ): void {
        const baked = getBakedDeSeaCanvas();
        if (!baked) {
            ctx.fillStyle = '#255a82';
            ctx.fillRect(0, 0, vw, vh);
            return;
        }
        const o = toS(0, 0);
        const S = baked.width;
        const startX = Math.floor((((o.x % S) + S) % S) - S);
        const startY = Math.floor((((o.y % S) + S) % S) - S);
        for (let y = startY; y < vh; y += S) {
            for (let x = startX; x < vw; x += S) {
                ctx.drawImage(baked, x, y);
            }
        }
    }

    /** zoom > 12 时 CoastalWaveLayer 退场：按同款深蓝波谷+亮波峰画世界锚定的动态海面波纹 */
    private drawSeaRipples(
        ctx: CanvasRenderingContext2D,
        toS: (x: number, y: number) => { x: number; y: number },
        u: number,
        vw: number,
        vh: number,
        tick: number,
        windAng: number,
    ): void {
        if (!this.centerLL) return;
        const t = tick / 1000;
        const stormBoost = getSeaStormWaveBoostAt(this.centerLL.lat, this.centerLL.lng, tick);
        const cell = 54;
        const o0 = toS(0, 0);
        const minWx = -o0.x / u - cell;
        const maxWx = (vw - o0.x) / u + cell;
        const minWy = -o0.y / u - cell;
        const maxWy = (vh - o0.y) / u + cell;
        const ix0 = Math.floor(minWx / cell), ix1 = Math.ceil(maxWx / cell);
        const iy0 = Math.floor(minWy / cell), iy1 = Math.ceil(maxWy / cell);
        const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
        const rippleFreq = 0.16 * (1 + stormBoost * 1.35);
        const travelScale = (4.5 + stormBoost * 4.0) * Math.max(0.75, u * 0.55);
        const halfScale = (1 + stormBoost * 0.45) * Math.max(0.85, u * 0.6);
        const liftScale = 1 + stormBoost * 0.90;
        const waveBaseAng = windAng + Math.PI / 2;

        for (let iy = iy0; iy <= iy1; iy++) {
            for (let ix = ix0; ix <= ix1; ix++) {
                let h = (ix * 374761393 + iy * 668265263) ^ 0x5bf03635;
                h = Math.imul(h ^ (h >>> 13), 1274126177);
                const r0 = ((h >>> 0) & 0xffff) / 65536;
                if (r0 < 0.18) continue;
                const r1 = ((h >>> 16) & 0xff) / 256;
                const r2 = ((h >>> 24) & 0xff) / 256;
                const wx = (ix + 0.15 + r1 * 0.7) * cell;
                const wy = (iy + 0.15 + r2 * 0.7) * cell;
                if (this.landGrid && !this.isWaterAt(wx, wy)) continue;
                const sp = toS(wx, wy);
                if (sp.x < -30 || sp.x > vw + 30 || sp.y < -30 || sp.y > vh + 30) continue;

                const phaseOff = ((h >>> 8) & 0xff) / 256;
                const phase = (t * rippleFreq + phaseOff) % 1;
                const crest = Math.sin(phase * Math.PI);
                if (crest < 0.18 - stormBoost * 0.06) continue;
                const bucket = Math.min(3, Math.floor(crest * 4));
                const angJitter = (r0 - 0.5) * 0.55;
                const ang = waveBaseAng + angJitter;
                const dx = Math.cos(ang), dy = Math.sin(ang);
                const nx = -dy, ny = dx;
                const travel = (phase - 0.5) * travelScale;
                const cx = sp.x - nx * travel, cy = sp.y - ny * travel;
                const baseLen = 8 + r1 * 9;
                const half = baseLen * (0.38 + crest * 0.12) * halfScale;
                const lift = (0.45 + crest * 0.55) * liftScale;
                const path = paths[bucket];
                path.moveTo(cx - dx * half, cy - dy * half);
                path.quadraticCurveTo(cx + nx * lift, cy + ny * lift, cx + dx * half, cy + dy * half);
            }
        }

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const troughAlphaMul = 0.055 * (1 + stormBoost * 1.2);
        const crestAlphaMul = 0.22 * (1 + stormBoost * 1.15);
        for (let bucket = 0; bucket < paths.length; bucket++) {
            const strength = (bucket + 1) / paths.length;
            ctx.strokeStyle = `rgba(8, 45, 72, ${(troughAlphaMul * strength).toFixed(3)})`;
            ctx.lineWidth = 2.0 + stormBoost * 0.7;
            ctx.stroke(paths[bucket]);
            ctx.strokeStyle = `rgba(195, 232, 242, ${(crestAlphaMul * strength).toFixed(3)})`;
            ctx.lineWidth = 0.9 + stormBoost * 0.45;
            ctx.stroke(paths[bucket]);
        }
        ctx.restore();
    }

    /** 全部弹丸使用与陆战（Scene13）同一套 DE 抛射物精灵（PROJ_ARROW / PROJ_BALL / PROJ_ROCK / FLAMETHROWER_FLAME） */
    private drawProjectiles(
        ctx: CanvasRenderingContext2D,
        toS: (x: number, y: number) => { x: number; y: number },
        u: number,
        mapScale: number,
    ): void {
        const sim = this.sim;
        if (!sim || sim.projectiles.length === 0) return;
        const baseScale = HULL_BASE * mapScale * 0.45;
        for (const pr of sim.projectiles) {
            const p = Math.max(0, Math.min(1, pr.t / pr.dur));
            const s0 = toS(pr.x0, pr.y0);
            const s1 = toS(pr.x1, pr.y1);
            const dx = s1.x - s0.x;
            const dy = s1.y - s0.y;
            const dist = Math.hypot(dx, dy);
            const arcH = Math.min(dist * pr.arc, 95 * u);
            const x = s0.x + dx * p;
            const y = s0.y + dy * p - 4 * arcH * p * (1 - p);
            const vy = dy - 4 * arcH * (1 - 2 * p);
            const angle = Math.atan2(vy, dx);

            if (pr.kind === 'arrow') {
                // 学陆战箭塔（Scene13WarLayer.fireDefBuildingVolley）：每发单支 DE 火箭（PROJ_ARROW_FIRE），由船舷随机间隔射出
                const fx = getDeFx('PROJ_ARROW_FIRE') ?? getDeFx('PROJ_ARROW');
                const key = getDeFx('PROJ_ARROW_FIRE') ? 'PROJ_ARROW_FIRE' : 'PROJ_ARROW';
                const midFr = fx ? Math.floor(fx.frames / 2) : 5;
                drawDeFxFrame(ctx, key, x, y, p, baseScale * 1.18, 1, angle, midFr);
            } else if (pr.kind === 'cannon') {
                drawDeFxFrame(ctx, 'PROJ_BALL', x, y, (p * 2) % 1, baseScale * 1.1, 1, angle);
            } else if (pr.kind === 'trebuchet') {
                drawDeFxFrame(ctx, 'PROJ_ROCK', x, y, (p * 2) % 1, baseScale * 1.35, 1, angle);
            } else if (pr.kind === 'greekfire') {
                for (let k = 0; k < 3; k++) {
                    const pk = Math.max(0, Math.min(1, p - k * 0.06));
                    const gx = s0.x + dx * pk;
                    const gy = s0.y + dy * pk - 4 * arcH * pk * (1 - pk);
                    drawDeFxFrame(ctx, 'FLAMETHROWER_FLAME', gx, gy, pk, baseScale * 0.55, 0.92, angle + Math.PI / 4);
                }
            }
        }
    }

    private drawShip(ctx: CanvasRenderingContext2D, s: NavalShip, p: ShipPose, u: number, mapScale: number): void {
        const sim = this.sim!;
        if (p.x < -400 || p.x > window.innerWidth + 400 || p.y < -400 || p.y > window.innerHeight + 400) return;
        const sinkT = s.state === 'sinking' ? sim.time - s.sinkAt : 0;
        const alpha = s.state === 'sinking' ? Math.max(0, 1 - sinkT / 6) : 1;
        // 与 drawNaval 同量级的浮沉横摇（只动贴图，不动逻辑位）
        const bob = Math.sin(this.wallT * 1.6 + s.id * 1.7) * 1.2 * p.hs;
        const sinkY = s.state === 'sinking' ? sinkT / 6 * p.len * 0.7 : 0;
        const roll = Math.sin(this.wallT * 1.1 + s.id) * 0.02 + (s.state === 'sinking' ? sinkT * 0.05 : 0);
        const rot = p.rot + roll;
        // 开火微后坐力 + 中弹微震与受击高光
        const fireAgo = sim.time - s.lastFireAt;
        const recoil = fireAgo >= 0 && fireAgo < 0.18 && s.state === 'alive'
            ? Math.sin((fireAgo / 0.18) * Math.PI) * 3.5 * p.hs
            : 0;
        const hitAgo = sim.time - s.lastHitAt;
        // 接舷肉搏期间每帧都在扣兵力，不再触发船体抖动，保持两船平稳贴舷
        const hitFlash = s.boardingWith === null && s.burnT <= 0 && hitAgo >= 0 && hitAgo < 0.22 && s.state === 'alive' ? 1 - hitAgo / 0.22 : 0;
        const jx = (hitFlash > 0 ? Math.sin(this.wallT * 65 + s.id) * 2.2 * hitFlash * u : 0) - Math.cos(s.heading) * recoil;
        const jy = (hitFlash > 0 ? Math.cos(this.wallT * 58 + s.id) * 1.6 * hitFlash * u : 0) - Math.sin(s.heading) * recoil;

        // 战略海面水线投影：让船体贴合海面而非悬浮
        if (s.state !== 'sunk') {
            ctx.save();
            ctx.globalAlpha = alpha * 0.34;
            ctx.translate(p.x + jx, p.y + jy + bob + 8 * p.hs);
            ctx.rotate(s.heading);
            ctx.fillStyle = '#072238';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.len * 0.44, p.len * 0.16, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const set: any = LegionPhalanxDrawer.getUnitAssets(s.shipKey);
        let drawn = false;
        if (set) {
            const attacking = sim.time - s.lastFireAt < 0.6 && s.state === 'alive';
            const deathFrames: HTMLImageElement[] = set.DEATH ?? [];
            let anim: 'MOVE' | 'ATTACK' | 'IDLE' | 'DEATH' = attacking && set.ATTACK?.length ? 'ATTACK' : (set.MOVE?.length ? 'MOVE' : 'IDLE');
            let useDeath = false;
            if (s.state === 'sinking' && deathFrames.length > 0) { anim = 'DEATH'; useDeath = true; }
            if (s.boardingWith !== null && set.IDLE?.length) anim = 'IDLE';
            const arr: HTMLImageElement[] = set[anim] ?? set.IDLE ?? [];
            const raw = arr[p.dir] || arr[0];
            if (raw && raw.complete && raw.naturalWidth > 0) {
                const img = (SpriteTinter.getTintedSprite(raw, s.factionId) ?? raw) as CanvasImageSource;
                const dyn = set.dyn?.[anim] ?? set.dyn?.IDLE;
                // 战船是 16 向素材：帧框键就是 16 向下标（同 LegionPhalanxDrawer.metaDirFor(…, true)）
                const meta = dyn?.dirs ? dyn.dirs[String(p.dir)] : undefined;
                const frames = dyn?.frames ?? Math.max(1, Math.round(raw.naturalWidth / raw.naturalHeight));
                let fi: number;
                if (useDeath) fi = Math.min(frames - 1, Math.floor(sinkT / 0.15));
                else fi = Math.floor((this.wallT + s.id * 0.13) * frames / 1.5) % frames;
                ctx.save();
                ctx.globalAlpha = useDeath ? Math.min(1, alpha + 0.4) : alpha;
                ctx.translate(p.x + jx, p.y + jy + bob + (useDeath ? 0 : sinkY));
                ctx.rotate(rot);
                const hs = p.hs;
                if (meta) {
                    ctx.drawImage(img, fi * meta.fw, 0, meta.fw, meta.fh, -meta.hx * hs, -meta.hy * hs, meta.fw * hs, meta.fh * hs);
                    if (!useDeath) {
                        const sails = buildSailLayers(s.shipKey, p.dir, hs, LegionPhalanxDrawer.sailGroupOf(s.factionId));
                        if (sails) for (const sl of sails) ctx.drawImage(sl.img, sl.ox, sl.oy, sl.w, sl.h);
                    }
                } else {
                    const fw = raw.naturalWidth / frames;
                    const fh = raw.naturalHeight;
                    ctx.drawImage(img, fi * fw, 0, fw, fh, -fw * hs / 2, -fh * hs / 2, fw * hs, fh * hs);
                }
                ctx.restore();
                drawn = true;
            }
        } else {
            LegionPhalanxDrawer.ensureUnitTypeLoading(s.shipKey);
        }
        if (!drawn) this.drawHullSilhouette(ctx, s, p.x + jx, p.y + jy + bob + sinkY, s.heading, alpha, p.len);
        if (hitFlash > 0.05) {
            ctx.save();
            const g = ctx.createRadialGradient(p.x + jx, p.y + jy - 8 * u, 2, p.x + jx, p.y + jy - 8 * u, p.len * 0.35);
            g.addColorStop(0, `rgba(255,220,140,${(0.45 * hitFlash).toFixed(3)})`);
            g.addColorStop(1, 'rgba(255,140,40,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x + jx, p.y + jy - 8 * u, p.len * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        if (s.burnT > 0 && s.state !== 'sunk') this.drawFire(ctx, s, p.x + jx, p.y + jy + bob + sinkY, u, p.hs, mapScale);
        if (s.state === 'sinking') this.drawBubbles(ctx, p.x, p.y, sinkT, u);
    }

    /** 素材还没到时的剪影：势力色船身，免得第一帧空海 */
    private drawHullSilhouette(ctx: CanvasRenderingContext2D, s: NavalShip, px: number, py: number, h: number, alpha: number, len: number): void {
        const k = len / 130;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(px, py);
        ctx.rotate(h);
        ctx.scale(1, 0.6);
        ctx.fillStyle = '#5a3d22';
        ctx.beginPath();
        ctx.moveTo(65 * k, 0);
        ctx.quadraticCurveTo(20 * k, -24 * k, -60 * k, -20 * k);
        ctx.lineTo(-60 * k, 20 * k);
        ctx.quadraticCurveTo(20 * k, 24 * k, 65 * k, 0);
        ctx.fill();
        ctx.fillStyle = this.colors[s.side];
        ctx.fillRect(-12 * k, -28 * k, 24 * k, 56 * k);
        ctx.restore();
    }

    private drawFire(ctx: CanvasRenderingContext2D, s: NavalShip, px: number, py: number, u: number, hs: number, _mapScale: number): void {
        const fireScale = hs * 1.15;
        // 纯 DE 原版火焰序列帧（FX_FIRE_SMALL / MEDIUM / LARGE，自带焰心与黑烟）
        const spots: readonly [string, number, number][] = s.role === 'flag'
            ? [['FX_FIRE_LARGE', 0, 2], ['FX_FIRE_MEDIUM', -24, 6], ['FX_FIRE_MEDIUM', 24, 0], ['FX_FIRE_SMALL', 8, -10]]
            : [['FX_FIRE_MEDIUM', 0, 2], ['FX_FIRE_SMALL', -18, 6], ['FX_FIRE_SMALL', 18, 0]];
        for (let i = 0; i < spots.length; i++) {
            const [key, dx, dy] = spots[i];
            const phase = ((this.wallT * 0.55 + s.id * 0.17 + i * 0.29) % 1);
            drawDeFxFrame(ctx, key, px + dx * u, py + dy * u, phase, fireScale, 0.95);
        }
    }

    private drawBubbles(ctx: CanvasRenderingContext2D, px: number, py: number, t: number, u: number): void {
        const fade = Math.max(0, 1 - t / 6);
        ctx.save();
        for (let i = 0; i < 4; i++) {
            const p = ((t * 0.55 + i * 0.25) % 1);
            const r = (18 + p * 78) * u;
            ctx.strokeStyle = `rgba(225,246,255,${(0.55 * (1 - p) * fade).toFixed(3)})`;
            ctx.lineWidth = Math.max(1, (2.2 - p * 1.2) * u);
            ctx.beginPath();
            ctx.ellipse(px, py + 8 * u, r * 1.65, r * 0.62, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        for (let i = 0; i < 6; i++) {
            const p = ((t * 1.1 + i * 0.17) % 1);
            const bx = px + Math.sin(i * 2.4 + t * 3) * 32 * u;
            const by = py + 12 * u - p * 36 * u;
            ctx.fillStyle = `rgba(235,250,255,${(0.65 * (1 - p) * fade).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(bx, by, (2.5 + (i % 2) * 1.5) * u, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private drawFx(ctx: CanvasRenderingContext2D, toS: (x: number, y: number) => { x: number; y: number }, u: number, mapScale: number): void {
        const fxScale = HULL_BASE * mapScale * 0.36;
        for (const f of this.fx) {
            const { x: px, y: py } = toS(f.x, f.y);
            switch (f.k) {
                case 'spark': {
                    // Scene13 同款受击火星
                    const k = f.t / 0.55;
                    const fade = 1 - k;
                    ctx.save();
                    ctx.lineCap = 'round';
                    for (let i = 0; i < 6; i++) {
                        const a = i * (Math.PI * 2 / 6) + f.x * 0.13;
                        const r = k * (24 + (i % 3) * 12) * u;
                        const sx = px + Math.cos(a) * r;
                        const sy = py - 12 * u + Math.sin(a) * r * 0.65 - Math.sin(k * Math.PI) * 18 * u;
                        ctx.strokeStyle = `rgba(255,175,30,${(fade * 0.9).toFixed(3)})`;
                        ctx.lineWidth = Math.max(1.2, 2.2 * u * fade);
                        ctx.beginPath();
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(sx - Math.cos(a) * 6 * u, sy - Math.sin(a) * 4 * u);
                        ctx.stroke();
                        ctx.fillStyle = `rgba(255,255,255,${fade.toFixed(3)})`;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 1.4 * u * fade, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                    break;
                }
                case 'splash': {
                    // DE 原版落水水花精灵
                    const life = f.big ? 1.15 : 0.75;
                    const k = Math.min(1, f.t / life);
                    NavalFxSprites.draw(ctx, 'WATER_SPLASH', px, py, k, mapScale * (f.big ? 1.35 : 0.9));
                    break;
                }
                case 'muzzle': {
                    // DE 原版炮口焰（CANNON_MUZZLE）
                    const dur = NavalFxSprites.durationMs('CANNON_MUZZLE') / 1000;
                    const k = Math.min(1, f.t / dur);
                    const aim = toS(f.tx, f.ty);
                    const rot = Math.atan2(aim.y - py, aim.x - px);
                    NavalFxSprites.draw(ctx, 'CANNON_MUZZLE', px, py, k, mapScale, rot);
                    break;
                }
                case 'deImpact': {
                    const k = Math.min(1, f.t / f.dur);
                    drawDeFxFrame(ctx, f.key, px, py - 8 * u, k, fxScale * f.scale, 0.95);
                    break;
                }
                case 'boom': {
                    const life = f.big ? 2.2 : 1.0;
                    const k = Math.min(1, f.t / life);
                    const fade = 1 - k;
                    // 纯 DE 爆炸与烟尘精灵（FX_PETARD / FX_EXPLOSION + FX_TREBUCHET_SMOKE）
                    if (k < 0.55) {
                        const ek = k / 0.55;
                        const key = f.big ? 'FX_PETARD' : 'FX_EXPLOSION';
                        drawDeFxFrame(ctx, key, px, py - 8 * u, ek, fxScale * (f.big ? 1.15 : 0.78), 0.95);
                    }
                    drawDeFxFrame(ctx, 'FX_TREBUCHET_SMOKE', px, py - 12 * u - k * 24 * u, k, fxScale * (f.big ? 1.25 : 0.8), fade * 0.85);
                    break;
                }
                case 'ring': {
                    const k = f.t / 1.4;
                    const fade = 1 - k;
                    ctx.save();
                    ctx.strokeStyle = f.color;
                    ctx.globalAlpha = fade;
                    ctx.lineWidth = Math.max(2, 4.5 * u);
                    ctx.beginPath();
                    ctx.ellipse(px, py, (52 + k * 75) * u, (24 + k * 34) * u, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.strokeStyle = '#ffd97a';
                    ctx.globalAlpha = fade * 0.75;
                    ctx.lineWidth = Math.max(1.2, 2.2 * u);
                    ctx.beginPath();
                    ctx.ellipse(px, py, (36 + k * 52) * u, (16 + k * 24) * u, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                    break;
                }
                case 'text': {
                    // 船上冒字：与战略地图标签同一种描边字，略大
                    const k = f.t / 1.8;
                    const size = Math.max(16, Math.round(22 * Math.max(u, 0.7)));
                    ctx.font = `bold ${size}px "Microsoft YaHei","PingFang SC",sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.lineWidth = Math.max(3, size / 6);
                    ctx.globalAlpha = 1 - k * k;
                    const ty = py - 70 * u - k * 40 * u;
                    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                    ctx.strokeText(f.text, px, ty);
                    ctx.fillStyle = f.color;
                    ctx.fillText(f.text, px, ty);
                    ctx.globalAlpha = 1;
                    break;
                }
            }
        }
    }

    /** 旗舰：战略地图同款名字标签（武将 / 军团 / 兵力）；船受了伤才显示细血条 */
    private drawShipBadge(ctx: CanvasRenderingContext2D, s: NavalShip, p: ShipPose, mapScale: number): void {
        if (s.state !== 'alive' || !this.init) return;
        if (s.hp < s.maxHp - 0.5 || s.boardingWith !== null) {
            const w = Math.max(32, p.len * 0.45);
            const y = p.y - p.len * 0.42;
            const ratio = Math.max(0, Math.min(1, s.hp / s.maxHp));
            ctx.fillStyle = 'rgba(10,12,16,0.78)';
            ctx.fillRect(p.x - w / 2 - 1.5, y - 1.5, w + 3, 7.5);
            ctx.fillStyle = this.colors[s.side];
            ctx.fillRect(p.x - w / 2, y, w * ratio, 4.5);
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.fillRect(p.x - w / 2, y, w * ratio, 1.5);
            if (s.boardingWith !== null) {
                const cr = Math.max(0, Math.min(1, s.crew / s.maxCrew));
                ctx.fillStyle = 'rgba(10,12,16,0.72)';
                ctx.fillRect(p.x - w / 2 - 1, y + 6, w + 2, 4.5);
                ctx.fillStyle = '#f2e6c8';
                ctx.fillRect(p.x - w / 2, y + 6.5, w * cr, 3);
            }
        }
        if (s.role !== 'flag') return;
        const side = this.init[s.side];
        let y = p.y + 75 * mapScale;
        if (side.generalName) {
            drawUnitLabel(ctx, side.generalName, p.x, y, LABEL_STYLE_GENERAL);
            y += 17;
        }
        const legion = side.legionName || (side.generalName ? '' : side.name);
        if (legion) {
            drawUnitLabel(ctx, legion, p.x, y, LABEL_STYLE_NAME);
            y += 17;
        }
        const live = this.getLiveTroops();
        if (live) drawUnitLabel(ctx, `${live[s.side]}`, p.x, y, LABEL_STYLE_TROOPS);
    }

    /** 右上角风向罗盘：海战独有的胜负变数，必须看得见 */
    private drawWindCompass(ctx: CanvasRenderingContext2D, vw: number): void {
        const sim = this.sim!;
        const R = 34;
        const cx = vw - 84, cy = 150;
        const g = ctx.createLinearGradient(0, cy - R - 12, 0, cy + R + 60);
        g.addColorStop(0, 'rgba(22,17,13,0.88)');
        g.addColorStop(1, 'rgba(12,9,7,0.92)');
        ctx.fillStyle = g;
        ctx.strokeStyle = 'rgba(212,175,55,0.45)';
        ctx.lineWidth = 1;
        const bx = cx - R - 40, by = cy - R - 14, bw = (R + 40) * 2, bh = R * 2 + 70;
        ctx.beginPath();
        ctx.roundRect?.(bx, by, bw, bh, 8);
        if (!ctx.roundRect) ctx.rect(bx, by, bw, bh);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(232,220,192,0.45)';
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        ctx.font = "bold 12px 'Noto Serif SC','SimSun',serif";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e8dcc0';
        ctx.fillText('北', cx, cy - R + 13);
        const ax = Math.cos(sim.windAng), ay = Math.sin(sim.windAng);
        ctx.strokeStyle = '#9fd4ff';
        ctx.fillStyle = '#9fd4ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - ax * R * 0.7, cy - ay * R * 0.7);
        ctx.lineTo(cx + ax * R * 0.5, cy + ay * R * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + ax * R * 0.85, cy + ay * R * 0.85);
        ctx.lineTo(cx + ax * R * 0.42 - ay * R * 0.3, cy + ay * R * 0.42 + ax * R * 0.3);
        ctx.lineTo(cx + ax * R * 0.42 + ay * R * 0.3, cy + ay * R * 0.42 - ax * R * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.font = "bold 15px 'Noto Serif SC','SimSun',serif";
        ctx.fillStyle = '#f2e6c8';
        const wName = this.weatherKind && WEATHER_TEXT[this.weatherKind] ? ` · ${WEATHER_TEXT[this.weatherKind].name}` : '';
        ctx.fillText(windName(sim.windAng) + wName, cx, cy + R + 20);
        const ww = sim.windwardSide();
        if (ww && this.init) {
            ctx.font = "bold 12px 'Noto Serif SC','SimSun',serif";
            ctx.fillStyle = this.colors[ww];
            const name = this.init[ww].name;
            ctx.fillText(`上风 ${name.length > 5 ? name.slice(0, 5) : name}`, cx, cy + R + 40);
        }
    }
}

interface ShipPose {
    x: number;
    y: number;
    dir: number;
    rot: number;
    deg: number;
    /** 船体缩放（贴图像素 → CSS 像素） */
    hs: number;
    /** 船长（CSS 像素） */
    len: number;
}
