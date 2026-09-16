import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { queryBaseTile } from '../ui/scene13/WorldBaseMap';
import { pickTree, type TreeSeason } from '../ui/scene13/TreeAssignment';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { perfDoctor } from '../debug/PerfDoctor';
import {
    loadStrategicForestMask,
    queryStrategicCanopyDensity,
    queryStrategicForestBiome,
} from './StrategicForestMask';

const PANE = 'vegetationPane';
const SAMPLE_ZOOM = 9;
const MIN_ZOOM = 9;
const MAX_ZOOM = 10;
const CITY_CLEAR_PX = 46;
/** 两次重建之间的最小间隔（ms）。跟拍军团时 GameAppLoop 每帧 setView → 每帧 moveend，
 *  不节流的话整层色块每帧重画。 */
const MIN_RENDER_INTERVAL_MS = 200;
/** 树贴图在 SAMPLE_ZOOM(9) 时的基准高度（px）。Z9 为 22px，Z10 随缩放自然展开至约 28px。 */
const TREE_BASE_PX = 22;
/** 战略树木保持为环境层，透光度自然，不压过城池、军团、道路和势力边界。 */
const TREE_OPACITY = 0.82;
/** 树根处的轻微接地阴影，只用于消除贴图悬浮感。 */
const TREE_SHADOW_OPACITY = 0.16;

export interface TreeAssetMeta {
    boxW: number;
    boxH: number;
    anchorX: number;
    anchorY: number;
    frames: number[];
}

/** 24 种自然树木资产的精确元数据与站立健康帧变体白名单（彻底剔除采伐/倒伏/枯木桩动作帧） */
export const TREE_METAS: Record<string, TreeAssetMeta> = {
    OAK: { boxW: 332, boxH: 228, anchorX: 132, anchorY: 200, frames: [0, 3, 6, 12, 18, 21, 27, 30, 33, 36, 39] },
    GREEN_OAK: { boxW: 184, boxH: 200, anchorX: 112, anchorY: 172, frames: [0, 3, 6, 9, 12, 15, 18, 21, 24] },
    AUTUMN_OAK: { boxW: 332, boxH: 232, anchorX: 132, anchorY: 200, frames: [0, 3, 6, 12, 18, 21, 27, 30, 33, 36, 39] },
    SNOW_AUTUMN_OAK: { boxW: 204, boxH: 224, anchorX: 128, anchorY: 192, frames: [0, 3, 6, 12, 18, 21, 27, 30, 33, 36, 39] },
    ASIAN_MAPLE_GREEN: { boxW: 336, boxH: 352, anchorX: 136, anchorY: 192, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    ASIAN_MAPLE_AUTUMN: { boxW: 340, boxH: 348, anchorX: 140, anchorY: 188, frames: [0, 2, 4, 6, 8, 10, 12, 14, 16] },
    ASIAN_PINE: { boxW: 232, boxH: 196, anchorX: 130, anchorY: 146, frames: [0, 1, 2, 3] },
    PINE: { boxW: 156, boxH: 192, anchorX: 92, anchorY: 164, frames: [0, 3, 6, 9, 12, 15, 18, 21, 24] },
    SNOW_PINE: { boxW: 152, boxH: 188, anchorX: 92, anchorY: 160, frames: [3, 6, 9, 12, 15, 21, 24] },
    BIRCH_GREEN: { boxW: 204, boxH: 244, anchorX: 136, anchorY: 216, frames: [0, 1, 2, 3, 4, 5, 6, 7] },
    BIRCH_AUTUMN: { boxW: 212, boxH: 240, anchorX: 140, anchorY: 216, frames: [0, 3, 6, 9, 12, 15, 18, 21, 24] },
    BIRCH_WINTER: { boxW: 200, boxH: 196, anchorX: 128, anchorY: 176, frames: [3, 4, 5] },
    PALM: { boxW: 208, boxH: 208, anchorX: 128, anchorY: 180, frames: [6, 12, 15, 21, 27, 30] },
    OLIVE: { boxW: 216, boxH: 176, anchorX: 140, anchorY: 156, frames: [0, 3, 6, 9, 12, 15, 18, 21] },
    CYPRESS: { boxW: 128, boxH: 192, anchorX: 100, anchorY: 184, frames: [0, 3, 6, 9] },
    WILLOW: { boxW: 240, boxH: 240, anchorX: 152, anchorY: 200, frames: [0, 1, 2] },
    BAMBOO: { boxW: 108, boxH: 100, anchorX: 68, anchorY: 76, frames: [9, 10, 11] },
    LUSH_BAMBOO: { boxW: 212, boxH: 180, anchorX: 118, anchorY: 146, frames: [0, 3, 6, 9] },
    PEACH_BLOSSOM: { boxW: 224, boxH: 172, anchorX: 130, anchorY: 138, frames: [0, 1, 2, 3] },
    DEAD_TREE: { boxW: 368, boxH: 232, anchorX: 168, anchorY: 200, frames: [0, 1, 2, 6, 7, 8, 9, 11, 12] },
    RAINFOREST: { boxW: 348, boxH: 240, anchorX: 148, anchorY: 200, frames: [0, 3, 6, 12, 18, 21, 27, 30, 33, 36, 39] },
    BAOBAB: { boxW: 348, boxH: 236, anchorX: 148, anchorY: 200, frames: [0, 3, 6, 9] },
    DRAGON_TREE: { boxW: 200, boxH: 172, anchorX: 124, anchorY: 144, frames: [0, 2, 4, 6] },
    ACACIA: { boxW: 340, boxH: 236, anchorX: 140, anchorY: 196, frames: [0, 3, 6, 9] },
};

/**
 * 一棵树的采样结果。
 * 🔴 只存**经纬度**，不存屏幕坐标、不存 Image 引用：
 *    屏幕坐标一旦固化，地图平移时树就相对地形滑动（「军团一动树也动」）；
 *    Image 引用固化则会绕过按字节预算的贴图缓存淘汰。两者都在 paint() 里现取。
 */
interface TreeDrawCommand {
    lat: number;
    lng: number;
    /** 每棵树固定的高度抖动系数（保证平移/缩放时同一棵树大小稳定） */
    jitter: number;
    asset: string;
    /** 下一季的树种（季末交叉淡出用；与 asset 相同表示这棵不换装） */
    assetNext: string;
    /** 稳定分配的健康形态变体索引 */
    variant: number;
}

/** 战略地图树贴图缓存：树名 → preview.png（DE 单棵成品图，第 0 帧） */
const TREE_IMG = new Map<string, HTMLImageElement>();
const TREE_IMG_FAILED = new Set<string>();

/** 战略地图多变体精灵图缓存：树名 → frames.png */
const TREE_FRAMES_IMG = new Map<string, HTMLImageElement>();
const TREE_FRAMES_FAILED = new Set<string>();

function treeImage(asset: string, onReady: () => void): HTMLImageElement | null {
    if (TREE_IMG_FAILED.has(asset)) return null;
    const hit = TREE_IMG.get(asset);
    if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null;
    const img = new Image();
    img.onload = () => onReady();
    img.onerror = () => { TREE_IMG.delete(asset); TREE_IMG_FAILED.add(asset); };
    img.src = `/SUCAI_NATURE/${asset}/preview.png`;
    TREE_IMG.set(asset, img);
    return null;
}

function treeFramesImage(asset: string, onReady: () => void): HTMLImageElement | null {
    if (TREE_FRAMES_FAILED.has(asset)) return null;
    const hit = TREE_FRAMES_IMG.get(asset);
    if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null;
    const img = new Image();
    img.onload = () => onReady();
    img.onerror = () => { TREE_FRAMES_IMG.delete(asset); TREE_FRAMES_FAILED.add(asset); };
    img.src = `/SUCAI_NATURE/${asset}/frames.png`;
    TREE_FRAMES_IMG.set(asset, img);
    return null;
}

if (import.meta.env.DEV) {
    perfDoctor.registerCache({
        name: 'VegetationLayer:TREE_IMG(战略树贴图)',
        where: 'src/map/VegetationLayer.ts:TREE_IMG',
        entries: () => TREE_IMG.size,
        bytes: () => {
            let b = 0;
            for (const im of TREE_IMG.values()) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            return b;
        },
        limitKind: 'count',
        limitValue: 133,
    });
}

function hash(x: number, y: number, salt = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453123;
    return n - Math.floor(n);
}

const BASE_FOREST_TILES = new Set([
    'for',
    'fo2',
    'underbrush_leaves',
    'snf',
]);

/** 🔴 绝对禁止长树的地表材质：沙漠沙丘、流沙、干涸盐壳、戈壁砾石、高山裸岩与冰雪 */
const NON_VEGETATION_TILES = new Set([
    'pal',             // 砂质沙漠（塔克拉玛干、撒哈拉等流动沙丘）
    'qs',              // 沙漠流沙（腹地沙丘）
    'pal1',            // 裂开沙漠 / 干涸盐壳（罗布泊、艾丁湖）
    'ds5',             // 戈壁沙漠（砾石戈壁滩）
    'des',             // 极旱荒漠泥地
    'gravel_default',  // 高山高寒砾石 / 流石滩
    'rck',             // 陡峻山地裸岩 / 刃脊
    'sno',             // 积雪雪原
    'sn2',             // 松软深雪
    'snd',             // 雪地地基
    'ice',             // 冰川冰原
]);

/**
 * 基于经纬度的多频连续世界坐标密度场 (0..1)
 * 纯数学函数，无任何随机状态，保证相同经纬度在任何时候、任何缩放级别下输出绝对恒定
 */
function forestNoise(lat: number, lng: number): number {
    // 低频宏观轮廓 (~1.5度波长，约150km，塑造大尺度林区连绵与开阔原野)
    const n1 = Math.sin(lat * 0.85 + lng * 0.62) * Math.cos(lat * 0.71 - lng * 0.79);
    // 中频林缘凹凸与林隙 (~0.35度波长，约35km，塑造有机自然林缘、山谷林隙)
    const n2 = Math.sin(lat * 3.21 - lng * 2.85) * Math.cos(lat * 2.67 + lng * 3.43);
    // 高频林缘毛边与散树 (~0.08度波长，约8km，形成自然的稀疏林缘过渡)
    const n3 = Math.sin(lat * 11.45 + lng * 13.27) * Math.cos(lat * 14.12 - lng * 9.87);

    return 0.5 + 0.30 * n1 + 0.14 * n2 + 0.06 * n3;
}

const RESOLVE_FOREST_BIOMES = new Set([1, 2, 3, 4, 5, 6, 12, 14]);

function isStrategicForestArea(biome: number, tile: string, elevation: number, lat: number): boolean {
    // 荒漠、流沙、盐壳、高山裸岩与冰雪一票否决
    if (NON_VEGETATION_TILES.has(tile)) return false;
    if (biome === 13) return false;
    // 真实森林群系（RESOLVE 2017: 1, 2, 3, 4, 5, 6, 12, 14）
    if (RESOLVE_FOREST_BIOMES.has(biome)) return true;
    // 地表材质标注森林
    if (BASE_FOREST_TILES.has(tile)) return true;
    return false;
}

function forestClusterWeight(
    biome: number,
    tile: string,
    canopyDensity: number,
    noiseVal: number,
): number {
    if (NON_VEGETATION_TILES.has(tile) || biome === 13) return 0;

    const isForestBiome = RESOLVE_FOREST_BIOMES.has(biome);
    const isForestTile = BASE_FOREST_TILES.has(tile);
    if (!isForestBiome && !isForestTile) return 0;

    // 🔴 解决「有的地方的树是不是太多了」：
    // 1. 真实郁闭度低于 22% 属于开阔农田平原、干草原、平川河谷，坚决不长树；
    //    把平原（汾河谷地、太原盆地、关中平原、华北大平原）彻底还给开阔农田与沃野！
    // 2. 地表材质显式标注森林的（for, fo2, snf），即使 canopy 偏低也给予适当树林呈现；
    // 3. 聚簇门控：连续世界坐标场低于 0.38 的直接留白，高于 0.38 的凝聚成块状/带状自然林海。
    let baseWeight = 0;
    if (isForestTile) {
        const canopy = Math.max(0, Math.min(1, canopyDensity / 100));
        baseWeight = Math.max(0.35, canopy);
    } else if (isForestBiome) {
        if (canopyDensity < 22) return 0; // 开阔平原农田/干旱荒草坚决 0 树木
        const norm = Math.min(1.0, (canopyDensity - 22) / 53);
        baseWeight = 0.20 + 0.60 * norm;
    }

    // 连续噪声场强门控：消除均匀撒点感，塑造有致的林带与山川留白
    if (noiseVal < 0.38) return 0;
    const clusterFactor = Math.pow((noiseVal - 0.38) / 0.62, 1.25);

    return baseWeight * clusterFactor;
}

function currentGameSeason(): number {
    const season = (window as any).game?.timeSystem?.getSeason?.();
    return typeof season === 'number' && season >= 0 && season <= 3 ? season : 0;
}

/** 🔴 [2026-09-11 主人定「4 季节，每个季节一张图」] 树种与游戏四季 **1:1**：春0 夏1 秋2 冬3。
 *  改前是"春夏共用一态"的三态映射 → 樱花/桃花整个夏天都开着（日本更是全年樱花）。 */
function currentTreeSeason(): TreeSeason {
    const s = currentGameSeason();
    return (s >= 0 && s <= 3 ? s : 0) as TreeSeason;
}

/** 下一季：四季轮转（春→夏→秋→冬→春） */
function nextTreeSeason(s: TreeSeason): TreeSeason {
    return (((s + 1) % 4) as TreeSeason);
}

/** 0 = 不混合；>0 = 下一季占的全局基准权重 */
/**
 * 季末交叉淡出窗口：**按秒算，不按季长比例算**。
 *
 * 🔴 [2026-09-11 主人报「植被渐变不对，变着变着就消失了。游戏中是有季节的 15 秒一个季节，你对应了吗」]
 *   原实现 `SEASON_BLEND_WINDOW = 0.45`（**季长的 45%**）→ 按 `GameConfig.TIME.SEASON_DURATION = 15`
 *   （15 游戏秒/季）折算就是 **6.75 秒**都在渐变 —— 将近一半时间树都是半透明的，
 *   再叠加交叉淡出自身的透明度塌陷，视觉上就是"淡着淡着没了"。
 *   改为读 `TimeSystem.getTimeToNextSeason()`（剩余**游戏秒**）：只在季末最后 **2 秒**才淡出，
 *   1× 倍速下占一季 13%（原来 45%）。口径与季节长度自动同步，以后改 SEASON_DURATION 不用再动这里。
 */
const SEASON_BLEND_SECONDS = 2.0;

/**
 * 淡出进度 0..1。
 * @param offsetSec 该树自己的错峰延迟（0~0.35 秒）：整片林依次换装，不是齐刷一变。
 */
function seasonBlend(offsetSec = 0): number {
    const remain = (window as any).game?.timeSystem?.getTimeToNextSeason?.();
    if (typeof remain !== 'number') return 0;
    const span = Math.max(0.25, SEASON_BLEND_SECONDS - offsetSec);
    const elapsed = SEASON_BLEND_SECONDS - Math.max(0, remain) - offsetSec;   // 已进入窗口多少秒
    if (elapsed <= 0) return 0;
    const t = Math.min(1, elapsed / span);
    // smoothstep：起手收尾都柔，换季那一刻恰好收敛到 1
    return Math.min(1, Math.max(0, t * t * (3 - 2 * t)));
}

function hueClass(asset: string): 'conifer' | 'broadleaf' | 'arid' | 'dead' {
    if (/PINE|CYPRESS|SNOW_|BAMBOO|CEDAR/i.test(asset)) return 'conifer';
    if (/PALM|ACACIA|BAOBAB|OLIVE|DRAGON_TREE/i.test(asset)) return 'arid';
    if (/DEAD_TREE/i.test(asset)) return 'dead';
    return 'broadleaf';
}

const PATCH_COLOR: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [36, 86, 52],
    broadleaf: [72, 110, 52],
    arid:      [130, 128, 58],
    dead:      [112, 104, 90],
};
const PATCH_COLOR_AUTUMN: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [88, 104, 52],
    broadleaf: [168, 108, 42],
    arid:      [150, 128, 58],
    dead:      [136, 116, 92],
};
const PATCH_COLOR_WINTER: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [118, 138, 122],
    broadleaf: [176, 172, 160],
    arid:      [160, 154, 138],
    dead:      [150, 140, 124],
};

function colorFor(asset: string, season: TreeSeason): [number, number, number] {
    const c = hueClass(asset);
    if (season === 2) return PATCH_COLOR_AUTUMN[c];   // 秋
    if (season === 3) return PATCH_COLOR_WINTER[c];   // 冬
    return PATCH_COLOR[c];                            // 春 / 夏
}

/**
 * 真实自然地理林线（树木生长的高程上限，米）：
 * 超出林线为高寒草甸、流石滩、冰川与裸岩，树木无法成活。
 * - 青藏高原/喜马拉雅：4000m~4200m
 * - 阿尔卑斯山/中欧高地（纬度 44°~54°）：2150m
 * - 低纬度高山：3600m~3800m
 * - 高纬度寒温带：1200m~1500m
 */
function getTreeLine(lat: number, lng?: number): number {
    const absLat = Math.abs(lat);
    if (lng !== undefined && lng >= 75 && lng <= 105 && absLat >= 26 && absLat <= 40) {
        return 4100;
    }
    if (absLat < 30) return 3800;
    if (absLat < 44) return 2600;
    if (absLat < 54) return 2150; // 阿尔卑斯山、欧洲高地
    if (absLat < 64) return 1400;
    return 600;
}

const TREE_GRID_STEP = 42;

export class VegetationLayer {
    private readonly map: L.Map;
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private visible = false;
    private renderTimer: number | null = null;
    private lastRenderKey = '';
    private lastRenderAt = 0;
    private retryKey = '';
    private retryCount = 0;

    private terrainReadyTimer: number | null = null;
    private readonly onViewportChanged = () => { this.lastRenderKey = ''; this.scheduleRender(); };
    private readonly onResize = () => { this.resize(); this.lastRenderKey = ''; this.scheduleRender(); };
    private readonly onCanvasFollow = () => {
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));
        this.paint();
    };
    private readonly onTerrainReady = () => {
        if (this.terrainReadyTimer !== null) return;
        this.terrainReadyTimer = window.setTimeout(() => {
            this.terrainReadyTimer = null;
            this.lastRenderKey = '';
            this.scheduleRender(0);
        }, 250);
    };

    constructor(map: L.Map) {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        pane.style.zIndex = '565';
        pane.style.pointerEvents = 'none';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'strategic-vegetation leaflet-zoom-animated';
        this.canvas.style.pointerEvents = 'none';
        this.ctx = this.canvas.getContext('2d')!;
        pane.appendChild(this.canvas);

        map.on('moveend zoomend', this.onViewportChanged);
        map.on('move zoom', this.onCanvasFollow);
        map.on('resize', this.onResize);
        window.addEventListener('land-sea-tiles-updated', this.onTerrainReady);
        this.resize();
        this.render();
        void loadStrategicForestMask().then((ready) => {
            if (!ready) return;
            this.lastRenderKey = '';
            this.scheduleRender();
        });
        this.startSeasonBlendWatch();
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
        this.lastRenderKey = '';
        if (visible) this.scheduleRender();
        else this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private resize(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));
    }

    /**
     * 季节渐变驱动：
     * - 低频轮询（200ms）检测换季与进入渐变窗口；
     * - 一旦进入渐变期，无缝唤醒 requestAnimationFrame 进行 60 FPS 极度丝滑重绘；
     * - 渐变结束或非过渡期自动平稳休眠，零多余性能开销。
     */
    private startSeasonBlendWatch(): void {
        if (this.seasonTimer !== null || this.rafId !== null) return;

        let isRafActive = false;

        const rafLoop = () => {
            if (!this.visible) {
                isRafActive = false;
                this.rafId = null;
                return;
            }
            const gameSeason = currentGameSeason();
            if (this.sampledGameSeason !== gameSeason) {
                this.lastRenderKey = '';
                this.scheduleRender();
                isRafActive = false;
                this.rafId = null;
                return;
            }
            const blend = seasonBlend();
            if (blend > 0) {
                this.paint();
                this.rafId = requestAnimationFrame(rafLoop);
            } else {
                isRafActive = false;
                this.rafId = null;
            }
        };

        this.seasonTimer = window.setInterval(() => {
            if (!this.visible) return;
            if (this.paintDeferred && this.map.getContainer().style.visibility !== 'hidden') this.paint();
            const gameSeason = currentGameSeason();
            if (this.sampledGameSeason !== gameSeason) {
                this.lastRenderKey = '';
                this.scheduleRender();
                return;
            }
            if (seasonBlend() > 0 && !isRafActive) {
                isRafActive = true;
                this.rafId = requestAnimationFrame(rafLoop);
            }
        }, 200);
    }
    private seasonTimer: number | null = null;
    private rafId: number | null = null;
    private sampledGameSeason = -1;
    private paintDeferred = false;

    private trees: TreeDrawCommand[] = [];

    /**
     * 绘制树木：
     * - 采用 60 FPS 连续插值；
     * - 引入单树经纬度微错峰（Per-Tree Organic Phase）；
     * - 对称 Cross-Fade 交叉淡出，彻底消除换季跳闪与树木消失。
     */
    private paint(): void {
        // 战略地图被独立战场覆盖时，换季渐变不再反复重画屏下的整层树木。
        if (this.map.getContainer().style.visibility === 'hidden') { this.paintDeferred = true; return; }
        this.paintDeferred = false;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.visible || this.trees.length === 0) return;
        const zoom = Math.floor(this.map.getZoom());
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) return;

        const gameSeason = currentGameSeason();
        // 淡出窗口按**剩余游戏秒**判定（见 SEASON_BLEND_SECONDS）；刚换季那帧 sampledGameSeason 还没跟上，
        // 此时先按"不淡"处理，等下一次 render 用新季贴图重算。
        const baseBlend = this.sampledGameSeason === gameSeason
            ? Math.min(1, Math.max(0, seasonBlend()))
            : 0;
        const hScale = TREE_BASE_PX * Math.pow(1.35, zoom - SAMPLE_ZOOM);
        const W = this.canvas.width, H = this.canvas.height;

        const items: { x: number; y: number; h: number; c: TreeDrawCommand }[] = [];
        for (const c of this.trees) {
            const pt = this.map.latLngToContainerPoint([c.lat, c.lng]);
            const h = hScale * c.jitter;
            if (pt.x < -h * 2 || pt.x > W + h * 2 || pt.y < -h * 2 || pt.y > H + h * 2) continue;
            items.push({ x: pt.x, y: pt.y, h, c });
        }
        items.sort((a, b) => a.y - b.y || a.x - b.x);

        const drawTreeAsset = (
            asset: string,
            variant: number,
            it: { x: number; y: number; h: number },
            alpha: number,
        ) => {
            if (alpha <= 0.002) return;
            const meta = TREE_METAS[asset];
            ctx.globalAlpha = alpha * TREE_OPACITY;

            if (meta) {
                const framesImg = treeFramesImage(asset, this.onTreeImageReady);
                const prevImg = treeImage(asset, this.onTreeImageReady);

                const w = it.h * (meta.boxW / meta.boxH);
                const dx = it.x - w * (meta.anchorX / meta.boxW);
                const dy = it.y - it.h * (meta.anchorY / meta.boxH);

                if (framesImg) {
                    const frameIdx = meta.frames[variant % meta.frames.length];
                    const sx = frameIdx * meta.boxW;
                    ctx.drawImage(framesImg, sx, 0, meta.boxW, meta.boxH, dx, dy, w, it.h);
                    return;
                }
                if (prevImg) {
                    ctx.drawImage(prevImg, 0, 0, prevImg.naturalWidth, prevImg.naturalHeight, dx, dy, w, it.h);
                    return;
                }
            } else {
                // 兜底：未配置元数据的资产按底部居中对齐
                const im = treeImage(asset, this.onTreeImageReady);
                if (im) {
                    const w = it.h * (im.naturalWidth / im.naturalHeight);
                    ctx.drawImage(im, it.x - w / 2, it.y - it.h, w, it.h);
                }
            }
        };

        const drawContactShadow = (it: { x: number; y: number; h: number }) => {
            ctx.save();
            ctx.globalAlpha = TREE_SHADOW_OPACITY;
            ctx.fillStyle = '#141c12';
            ctx.beginPath();
            // 椭圆中心严格落在 (it.x, it.y)，与树根锚点接地处完全重合
            ctx.ellipse(it.x, it.y, it.h * 0.22, Math.max(1.0, it.h * 0.06), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        for (const it of items) {
            drawContactShadow(it);

            // 每棵树基于经纬度哈希做秒级错峰（0~0.35 秒）：整片林依次换装
            let treeBlend = baseBlend;
            if (baseBlend > 0 && it.c.assetNext !== it.c.asset) {
                treeBlend = seasonBlend(hash(it.c.lat, it.c.lng, 99) * 0.35);
            }

            if (it.c.assetNext !== it.c.asset && treeBlend > 0) {
                const a1 = (1 - treeBlend) * TREE_OPACITY;
                const a2 = 1 - (1 - TREE_OPACITY) / (1 - a1);
                drawTreeAsset(it.c.asset, it.c.variant, it, 1 - treeBlend);
                drawTreeAsset(it.c.assetNext, it.c.variant, it, a2 / TREE_OPACITY);
            } else {
                drawTreeAsset(it.c.asset, it.c.variant, it, 1);
            }
            ctx.globalAlpha = 1;
        }
    }

    private onTreeImageReady = (): void => {
        this.paint();
    };

    private scheduleRender(delay = 0): void {
        if (!this.visible) return;
        const since = performance.now() - this.lastRenderAt;
        const wait = Math.max(delay, since >= MIN_RENDER_INTERVAL_MS ? 0 : MIN_RENDER_INTERVAL_MS - since);
        if (this.renderTimer !== null) {
            if (delay === 0 && wait === 0) {
                window.clearTimeout(this.renderTimer);
            } else {
                return;
            }
        }
        this.renderTimer = window.setTimeout(() => {
            this.renderTimer = null;
            this.render();
        }, wait);
    }

    private render(): void {
        if (!import.meta.env.DEV) { this.renderInner(); return; }
        const t0 = performance.now();
        this.renderInner();
        perfDoctor.note('VegetationLayer.render', performance.now() - t0,
            'src/map/VegetationLayer.ts:render', this.lastTreeCount);
    }

    private lastTreeCount = 0;

    private renderInner(): void {
        if (!this.visible) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }

        const zoom = Math.floor(this.map.getZoom());
        const inRange = zoom >= MIN_ZOOM && zoom <= MAX_ZOOM;
        this.canvas.style.display = inRange ? 'block' : 'none';
        if (!inRange) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.lastRenderKey = ''; return; }

        const size = this.map.getSize();
        if (size.x > 0 && (this.canvas.width !== size.x || this.canvas.height !== size.y)) this.resize();

        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));

        const bounds = this.map.getBounds();
        const nw = this.map.project(bounds.getNorthWest(), SAMPLE_ZOOM);
        const se = this.map.project(bounds.getSouthEast(), SAMPLE_ZOOM);
        const xMin = Math.floor(nw.x / TREE_GRID_STEP) * TREE_GRID_STEP;
        const xMax = Math.ceil(se.x / TREE_GRID_STEP) * TREE_GRID_STEP;
        const yMin = Math.floor(nw.y / TREE_GRID_STEP) * TREE_GRID_STEP;
        const yMax = Math.ceil(se.y / TREE_GRID_STEP) * TREE_GRID_STEP;

        const gameSeason = currentGameSeason();
        const season = currentTreeSeason();
        const nextSeason = nextTreeSeason(season);

        const key = `${zoom}|${xMin}|${xMax}|${yMin}|${yMax}|${gameSeason}`;
        if (key === this.lastRenderKey) return;
        this.lastRenderKey = key;
        this.lastRenderAt = performance.now();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let missingTiles = 0;
        let pendingImages = 0;
        let drawnTrees = 0;
        const drawCommands: TreeDrawCommand[] = [];
        const waterSampler = LandSeaSystem.getWaterSampler();

        const paddedBounds = bounds.pad(0.08);
        const visibleCities = CITIES_V2
            .filter((city) => paddedBounds.contains([city.lat, city.lng]))
            .map((city) => this.map.latLngToContainerPoint([city.lat, city.lng]));

        for (let gy = yMin; gy <= yMax; gy += TREE_GRID_STEP) {
            for (let gx = xMin; gx <= xMax; gx += TREE_GRID_STEP) {
                // 有机微抖动：打破网格机械感
                const px = gx + TREE_GRID_STEP * 0.5 + (hash(gx, gy, 11) - 0.5) * (TREE_GRID_STEP * 0.65);
                const py = gy + TREE_GRID_STEP * 0.5 + (hash(gx, gy, 12) - 0.5) * (TREE_GRID_STEP * 0.65);
                const ptLatLng = this.map.unproject([px, py], SAMPLE_ZOOM);
                if (ptLatLng.lat < -58 || ptLatLng.lat > 75) continue;

                const water = waterSampler.isWaterSync(ptLatLng.lat, ptLatLng.lng);
                if (water !== false) {
                    if (water === null) missingTiles++;
                    continue;
                }

                // 据点避让
                const center = this.map.latLngToContainerPoint(ptLatLng);
                if (visibleCities.some((p) => p.distanceTo(center) < CITY_CLEAR_PX)) continue;

                // 自然地理林线与高寒冻土门控：
                // 1. 阿尔卑斯山（44°~54°N）林线 2150m，青藏高原 4100m，高纬度 1400m；
                // 2. 超出林线或裸岩、高山雪原一律不长树，刃脊与雪峰自然裸露。
                const treeLine = getTreeLine(ptLatLng.lat, ptLatLng.lng);
                const elev = LandSeaSystem.getElevationAtMapPixel(
                    px, py, SAMPLE_ZOOM, ptLatLng.lat, ptLatLng.lng,
                );
                // 🔴 高程瓦片未就绪时：极高海拔区（青藏高原/喜马拉雅）严格等待真瓦片剔除超林线树，
                //    平原与已知低地丘陵先放行渲染，避免外网瓦片慢时整层树木被饿死/全图秃光。
                const isHighPlateau = ptLatLng.lng >= 75 && ptLatLng.lng <= 105 && Math.abs(ptLatLng.lat) >= 26 && Math.abs(ptLatLng.lat) <= 40;
                if (elev === null) {
                    missingTiles++;
                    if (isHighPlateau) continue;
                } else if (elev > treeLine || elev < 0) {
                    continue;
                }

                // 地表材质与生物群系判定
                const tile = queryBaseTile({ lat: ptLatLng.lat, lng: ptLatLng.lng, isSiege: false, isWinter: false })
                    ?? resolveTerrainTile(ptLatLng.lat, ptLatLng.lng, 0);
                if (NON_VEGETATION_TILES.has(tile)) continue;

                const forestBiome = queryStrategicForestBiome(ptLatLng.lat, ptLatLng.lng);
                if (forestBiome === 13) continue; // 荒漠生态群系坚决不长树

                // elev 可能为 null（上面「低地先放行」那条分支），按低地兜底取值，与该分支意图一致
                if (!isStrategicForestArea(forestBiome, tile, elev ?? 250, ptLatLng.lat)) continue;

                // 连续世界坐标密度场：消除椭圆规则感，呈现犬牙交错与山谷林隙
                const noiseVal = forestNoise(ptLatLng.lat, ptLatLng.lng);

                // 真实卫星郁闭度驱动（0~100%）：决定当前格点是否生长树木
                const canopyDensity = queryStrategicCanopyDensity(ptLatLng.lat, ptLatLng.lng);
                const clusterWeight = forestClusterWeight(forestBiome, tile, canopyDensity, noiseVal);
                if (clusterWeight <= 0 || hash(gx, gy, 46) > clusterWeight) continue;

                // 绝大多数单棵点缀自然透气，只有核心密林且聚簇中心偶有 2 棵成小丛
                const count = canopyDensity >= 65 && noiseVal > 0.72 && hash(gx, gy, 53) > 0.65 ? 2 : 1;

                for (let i = 0; i < count; i++) {
                    let curPx = px;
                    let curPy = py;
                    if (i > 0) {
                        const ang = hash(gx, gy, i * 17 + 31) * Math.PI * 2;
                        const dist = 10 + hash(gx, gy, i * 19 + 32) * 12;
                        curPx += Math.cos(ang) * dist;
                        curPy += Math.sin(ang) * dist * 0.75;
                    }
                    const curLatLng = i === 0 ? ptLatLng : this.map.unproject([curPx, curPy], SAMPLE_ZOOM);

                    // 🔴 严格保护四季系统：春/夏/秋/冬 4 季树种 1:1 动态轮转
                    const asset = pickTree({ baseTile: tile, lat: curLatLng.lat, lng: curLatLng.lng, season, isSiege: false });
                    const assetNext = pickTree({
                        baseTile: tile, lat: curLatLng.lat, lng: curLatLng.lng,
                        season: nextSeason, isSiege: false,
                    });

                    // 预热多变体精灵图与单棵成品预览图
                    if (!treeFramesImage(asset, this.onTreeImageReady) && !treeImage(asset, this.onTreeImageReady)) pendingImages++;
                    if (assetNext !== asset) {
                        if (!treeFramesImage(assetNext, this.onTreeImageReady) && !treeImage(assetNext, this.onTreeImageReady)) pendingImages++;
                    }

                    const jitter = 0.85 + hash(gx, gy, i * 23 + 71) * 0.35;
                    const variant = Math.floor(hash(gx, gy, i * 37 + 89) * 100);
                    drawCommands.push({ lat: curLatLng.lat, lng: curLatLng.lng, jitter, asset, assetNext, variant });
                }
            }
        }

        // 🔴 [2026-09-11 主人报「植被在渐变的过程中有一段消失的状态」]
        //   实测成因：视口的地形/水域掩膜尚未就绪时，采样会**整片跳过**（missingTiles>0），
        //   于是 drawCommands 为空 → this.trees = [] → paint() 清完画布就 return（`trees.length===0` 早退）
        //   → **整层植被空白**，要等掩膜到齐（下面的 15 次重试）才回来；换季要重算整层，正好撞上这个空窗。
        //   因此：**新采样为空 + 旧列表非空 + 确有瓦片未就绪** → 保留旧列表继续显示（跟拍移动时旧树大多仍在屏内，不会闪白），
        //   并沿用下面的重试逻辑，等掩膜到了再换成新列表。
        const keepOldTrees = drawCommands.length === 0 && this.trees.length > 0 && missingTiles > 0;
        if (!keepOldTrees) this.trees = drawCommands;
        this.sampledGameSeason = gameSeason;
        this.paint();
        drawnTrees = this.trees.length;

        this.lastTreeCount = drawnTrees;
        if (pendingImages > 0) this.lastRenderKey = '';

        if (missingTiles > 0) {
            if (this.retryKey !== key) { this.retryKey = key; this.retryCount = 0; }
            if (this.retryCount < 15) {
                this.retryCount++;
                this.lastRenderKey = '';
                this.scheduleRender(600 + this.retryCount * 300);
            }
        }
    }

    private drawPatch(x: number, y: number, radius: number, r: number, g: number, b: number, alpha: number): void {
        const ctx = this.ctx;
        const grad = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
