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
const SAMPLE_STEP = 112;
const MIN_ZOOM = 9;
const MAX_ZOOM = 10;
const CITY_CLEAR_PX = 42;
/** 两次重建之间的最小间隔（ms）。跟拍军团时 GameAppLoop 每帧 setView → 每帧 moveend，
 *  不节流的话整层色块每帧重画。 */
const MIN_RENDER_INTERVAL_MS = 200;
/** 树贴图在 SAMPLE_ZOOM(9) 时的基准高度（px）。每偏离一级 zoom ×1.35。 */
const TREE_BASE_PX = 26;
/** 战略树木保持为环境层，避免压过城池、军团、道路和势力边界。 */
const TREE_OPACITY = 0.78;
/** 树根处的轻微接地阴影，只用于消除贴图悬浮感。 */
const TREE_SHADOW_OPACITY = 0.14;
/** 林片中心的采样步长，位置固定在世界坐标中。
 *  🔴 [2026-09-11 主人定「片更大、分布不用这么多」= 方案 B] 网格 129px(×1.15) → **232px(×2.07)**：
 *     1280×800 / zoom 9 一屏的采样格 62 → 19，林地林片数 约 34 → 约 10（−70%）；
 *     每片棵树 13~23 → 52~76（见下方 count），片内半径按 √count 自动 33px → 63px（片宽约 126px）
 *     ——「半格一片林」，连片成林又留出大片空地。树总量基本持平（一屏几百棵），性能不变。 */
const CLUSTER_STRIDE = SAMPLE_STEP * 2.07;
/** 黄金角错列，避免树木排成行，也避免随机撒点产生大片空隙。 */
const FOREST_GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

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
}

/**
 * 战略地图树贴图缓存：树名 → `public/SUCAI_NATURE/<树名>/preview.png`（DE 单棵成品图）。
 */
const TREE_IMG = new Map<string, HTMLImageElement>();
/** 已确认加载失败的树名（不再重试，免得每帧刷 404） */
const TREE_IMG_FAILED = new Set<string>();

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

function isStrategicForestArea(biome: number, tile: string, elevation: number, lat: number): boolean {
    if (biome === 0) return false;
    if (BASE_FOREST_TILES.has(tile)) return true;
    if (biome === 14) return true;
    if (biome === 6) return Math.abs(lat) >= 50;
    if (biome === 1 || biome === 3) return tile === 'gr6' || elevation >= 350;
    if (biome === 2 || biome === 4 || biome === 5 || biome === 12) return elevation >= 450;
    return false;
}

function forestClusterWeight(
    biome: number,
    tile: string,
    canopyDensity: number,
): number {
    const canopy = Math.max(0, Math.min(1, (canopyDensity - 8) / 62));
    let historicalFloor = 0.14;
    if (BASE_FOREST_TILES.has(tile)) historicalFloor = 0.55;
    else if (biome === 6) historicalFloor = 0.34;
    else if (biome === 1 || biome === 3) historicalFloor = 0.22;
    return Math.max(historicalFloor, canopy);
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

    private readonly onViewportChanged = () => this.scheduleRender();
    private readonly onResize = () => { this.resize(); this.scheduleRender(); };
    private readonly onCanvasFollow = () => {
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));
        this.paint();
    };
    private readonly onTerrainReady = () => { this.lastRenderKey = ''; this.scheduleRender(200); };

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

        const drawOne = (im: HTMLImageElement, it: { x: number; y: number; h: number }, alpha: number) => {
            if (alpha <= 0.002) return;
            const w = it.h * (im.naturalWidth / im.naturalHeight);
            ctx.globalAlpha = alpha * TREE_OPACITY;
            ctx.drawImage(im, it.x - w / 2, it.y - it.h, w, it.h);
        };

        const drawContactShadow = (it: { x: number; y: number; h: number }) => {
            ctx.save();
            ctx.globalAlpha = TREE_SHADOW_OPACITY;
            ctx.fillStyle = '#182016';
            ctx.beginPath();
            ctx.ellipse(it.x, it.y - 1, it.h * 0.28, Math.max(1.2, it.h * 0.07), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        for (const it of items) {
            const cur = treeImage(it.c.asset, this.onTreeImageReady);
            const nxt = it.c.assetNext !== it.c.asset
                ? treeImage(it.c.assetNext, this.onTreeImageReady) : cur;

            if (cur || nxt) drawContactShadow(it);

            // 每棵树基于经纬度哈希做**秒级**错峰（0~0.35 秒）：整片林依次换装，不是齐刷一变
            let treeBlend = baseBlend;
            if (baseBlend > 0 && it.c.assetNext !== it.c.asset) {
                treeBlend = seasonBlend(hash(it.c.lat, it.c.lng, 99) * 0.35);
            }

            if (cur && nxt && cur !== nxt && treeBlend > 0) {
                // 🔴 [2026-09-11 主人报「植被变着变着就消失了」] 交叉淡出**不许掉不透明度**：
                //   旧写法本季 ×(1−b) + 下季 ×b —— 两张**不同**贴图叠出来的覆盖度是 `1−b(1−b)`，
                //   中点塌到 0.75，再乘 TREE_OPACITY 0.78 → 0.585，所以看着就是"淡着淡着没了"。
                //   现按「两层叠合覆盖度恒定 = 单棵树 TREE_OPACITY」反解下季那层的 alpha：
                //     1−(1−a₁)(1−a₂) = TREE_OPACITY，取 a₁ = (1−b)·TREE_OPACITY  →  a₂ = 1 − (1−TREE_OPACITY)/(1−a₁)
                //   b=0 → a₂=0、b=1 → a₂=TREE_OPACITY，两端与"单棵树"完全一致，中点也不再塌陷。
                const a1 = (1 - treeBlend) * TREE_OPACITY;
                const a2 = 1 - (1 - TREE_OPACITY) / (1 - a1);
                drawOne(cur, it, 1 - treeBlend);
                drawOne(nxt, it, a2 / TREE_OPACITY);
            } else if (cur) {
                drawOne(cur, it, 1);
            } else if (nxt) {
                drawOne(nxt, it, 1);
            }
            ctx.globalAlpha = 1;
        }
    }

    private onTreeImageReady = (): void => {
        this.paint();
    };

    private scheduleRender(delay = 0): void {
        if (!this.visible) return;
        if (this.renderTimer !== null) window.clearTimeout(this.renderTimer);
        const since = performance.now() - this.lastRenderAt;
        const wait = Math.max(delay, since >= MIN_RENDER_INTERVAL_MS ? 0 : MIN_RENDER_INTERVAL_MS - since);
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
        const xMin = Math.floor(nw.x / CLUSTER_STRIDE) * CLUSTER_STRIDE;
        const xMax = Math.ceil(se.x / CLUSTER_STRIDE) * CLUSTER_STRIDE;
        const yMin = Math.floor(nw.y / CLUSTER_STRIDE) * CLUSTER_STRIDE;
        const yMax = Math.ceil(se.y / CLUSTER_STRIDE) * CLUSTER_STRIDE;

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

        for (let cy = yMin; cy <= yMax; cy += CLUSTER_STRIDE) {
            for (let cx = xMin; cx <= xMax; cx += CLUSTER_STRIDE) {
                const cxJ = cx + CLUSTER_STRIDE * 0.5 + (hash(cx, cy, 41) - 0.5) * CLUSTER_STRIDE * 0.5;
                const cyJ = cy + CLUSTER_STRIDE * 0.5 + (hash(cx, cy, 42) - 0.5) * CLUSTER_STRIDE * 0.5;
                const clusterLatLng = this.map.unproject([cxJ, cyJ], SAMPLE_ZOOM);
                if (clusterLatLng.lat < -58 || clusterLatLng.lat > 75) continue;

                const elev = LandSeaSystem.getElevationAtMapPixel(
                    cxJ, cyJ, SAMPLE_ZOOM, clusterLatLng.lat, clusterLatLng.lng,
                );
                if (elev === null) { missingTiles++; continue; }
                if (elev > 3600) continue;

                const clusterWater = waterSampler.isWaterSync(clusterLatLng.lat, clusterLatLng.lng);
                if (clusterWater !== false) { if (clusterWater === null) missingTiles++; continue; }

                // 🔴 [2026-09-01 修复「树木有时候有、有时候消失」]
                //    林区采样必须统一使用【常态自然地理底图】(isWinter: false / season: 0)！
                //    严禁传入随季节变化的 isWinter: true，否则冬季大量温带林地被判定为雪原而判定失败，
                //    导致大片森林在冬天凭空消失、春天又突然冒出。森林空间分布是恒定的地理现实！
                const tile = queryBaseTile({ lat: clusterLatLng.lat, lng: clusterLatLng.lng, isSiege: false, isWinter: false })
                    ?? resolveTerrainTile(clusterLatLng.lat, clusterLatLng.lng, 0);
                const forestBiome = queryStrategicForestBiome(clusterLatLng.lat, clusterLatLng.lng);
                if (!isStrategicForestArea(forestBiome, tile, elev, clusterLatLng.lat)) continue;

                const canopyDensity = queryStrategicCanopyDensity(clusterLatLng.lat, clusterLatLng.lng);
                const clusterWeight = forestClusterWeight(forestBiome, tile, canopyDensity);
                if (hash(cx, cy, 46) > clusterWeight) continue;

                // 🔴 [2026-09-11 主人定] ① 片更大、分布更少；② 主人补「大小别都差不多，有的可以更大」：
                //    尺寸做**长尾分布**，并按郁闭度放大差异 ——
                //      · 疏林/林缘（canopy≈0）      → 15~26 棵的小片（半径约 20~26px）
                //      · 普通林地                    → 30~90 棵
                //      · 密林（canopy≈1）掷到大值    → 150~200 棵的**大片**（半径约 110px，片宽 220px）
                //    半径仍按 √count 推导，所以大片自然铺开、小片自然收拢，密度（棵/像素²）与原来一致。
                const canopy = Math.max(0, Math.min(1, (canopyDensity - 8) / 62));
                const sizeRoll = hash(cx, cy, 45);                        // 0~1：这片是"小丛"还是"大林"
                const sizeMul = 0.6 + Math.pow(sizeRoll, 2.5) * (0.4 + canopy * 1.6);
                const count = Math.round((18 + clusterWeight * 60) * sizeMul);

                // 同样的树数收拢成林片：林内树冠相接，外围少数树拉开形成疏林缘。
                // 半径按树冠尺寸和棵数推导，不再把二十来棵树撒满直径约 150px 的圆。
                const radius = TREE_BASE_PX * Math.sqrt(count) * 0.30;
                const rotation = hash(cx, cy, 47) * Math.PI * 2;
                const stretch = 1.05 + hash(cx, cy, 48) * 0.35;
                const coreCount = count - 2;
                for (let i = 0; i < count; i++) {
                    const ang = rotation + i * FOREST_GOLDEN_ANGLE;
                    const fraction = i < coreCount ? Math.sqrt((i + 0.5) / coreCount) : 1.25 + (i - coreCount) * 0.18;
                    const rad = radius * fraction * (0.94 + hash(cx, cy, i + 60) * 0.12);
                    const px = cxJ + Math.cos(ang) * rad * stretch;
                    const py = cyJ + Math.sin(ang) * rad * 0.70;
                    const ptLatLng = this.map.unproject([px, py], SAMPLE_ZOOM);

                    // 植被按水域掩膜逐株落地：海拔非负也不代表不是水面。
                    // 掩膜未就绪先不种，瓦片到达后由现有重绘事件补齐。
                    const water = waterSampler.isWaterSync(ptLatLng.lat, ptLatLng.lng);
                    if (water !== false) { if (water === null) missingTiles++; continue; }

                    const ptTile = queryBaseTile({ lat: ptLatLng.lat, lng: ptLatLng.lng, isSiege: false, isWinter: false })
                        ?? resolveTerrainTile(ptLatLng.lat, ptLatLng.lng, 0);
                    const ptBiome = queryStrategicForestBiome(ptLatLng.lat, ptLatLng.lng);
                    if (!isStrategicForestArea(ptBiome, ptTile, elev, ptLatLng.lat)) continue;

                    const center = this.map.latLngToContainerPoint(ptLatLng);
                    if (visibleCities.some((p) => p.distanceTo(center) < CITY_CLEAR_PX)) continue;

                    const asset = pickTree({ baseTile: ptTile, lat: ptLatLng.lat, lng: ptLatLng.lng, season, isSiege: false });
                    const assetNext = pickTree({
                        baseTile: ptTile, lat: ptLatLng.lat, lng: ptLatLng.lng,
                        season: nextSeason, isSiege: false,
                    });

                    if (!treeImage(asset, this.onTreeImageReady)) pendingImages++;
                    if (assetNext !== asset) treeImage(assetNext, this.onTreeImageReady);
                    const jitter = 0.85 + hash(cx, cy, i + 70) * 0.35;
                    drawCommands.push({ lat: ptLatLng.lat, lng: ptLatLng.lng, jitter, asset, assetNext });
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
