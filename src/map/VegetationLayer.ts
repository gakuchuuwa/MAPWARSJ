import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { queryBaseTile } from '../ui/scene13/WorldBaseMap';
import { pickTree, type TreeSeason } from '../ui/scene13/TreeAssignment';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { lngToDemGlobalX, latToDemGlobalY } from '../world/land-sea/ElevationSampler';
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
/** 森林掩膜内部的采样步长；相邻簇互相咬合，形成连续林冠。 */
const CLUSTER_STRIDE = SAMPLE_STEP * 1.15;
/** 簇半径略大于半个步长，使相邻森林格没有规则空带。 */
const CLUSTER_RADIUS = CLUSTER_STRIDE * 0.58;

/**
 * 季节渐变窗口：季末 45% 的时间里，同一棵树进行平滑换装；
 * 前 55% 时间保持纯正当季风貌，后 45% 时间平缓过渡到下一季。
 *
 * 游戏季节有 4 个（春夏秋冬）但树只有 3 态（春夏/秋/冬），所以真正会换装的过渡是
 * 夏→秋、秋→冬、冬→春 三处；春→夏两边都是 0 态，`pickTree` 结果相同，天然不触发混合。
 */
const SEASON_BLEND_WINDOW = 0.45;

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

/**
 * 水陆判定的纠偏层：海拔说「低于海平面」时，再问一次 WaterMask 是不是其实是陆地。
 */
function maskSaysLand(lat: number, lng: number): boolean {
    return LandSeaSystem.getWaterSampler().isWaterSync(lat, lng) === false;
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

function currentTreeSeason(): TreeSeason {
    const season = currentGameSeason();
    if (season === 2) return 1;
    if (season === 3) return 2;
    return 0;
}

function nextTreeSeason(s: TreeSeason): TreeSeason {
    const gs = currentGameSeason();
    if (gs === 1) return 1;   // 夏 → 下一季是秋
    if (gs === 2) return 2;   // 秋 → 冬
    if (gs === 3) return 0;   // 冬 → 春
    return s;                 // 春 → 夏，树态不变
}

/** 0 = 不混合；>0 = 下一季占的全局基准权重 */
function seasonBlend(): number {
    const p = (window as any).game?.timeSystem?.getSeasonProgress?.();
    if (typeof p !== 'number') return 0;
    if (p <= 1 - SEASON_BLEND_WINDOW) return 0;
    const t = (p - (1 - SEASON_BLEND_WINDOW)) / SEASON_BLEND_WINDOW;   // 0→1 线性
    // smoothstep 曲线：起手和收尾极柔，到换季那一刻严密收敛为 1.0
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
    if (season === 1) return PATCH_COLOR_AUTUMN[c];
    if (season === 2) return PATCH_COLOR_WINTER[c];
    return PATCH_COLOR[c];
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

    private trees: TreeDrawCommand[] = [];

    /**
     * 绘制树木：
     * - 采用 60 FPS 连续插值；
     * - 引入单树经纬度微错峰（Per-Tree Organic Phase）；
     * - 对称 Cross-Fade 交叉淡出，彻底消除换季跳闪与树木消失。
     */
    private paint(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.visible || this.trees.length === 0) return;
        const zoom = Math.floor(this.map.getZoom());
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) return;

        const gameSeason = currentGameSeason();
        const baseBlend = this.sampledGameSeason === gameSeason
            ? Math.min(1, Math.max(0, seasonBlend()))
            : 1;
        const seasonProgress = (window as any).game?.timeSystem?.getSeasonProgress?.() ?? 0;
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

            // 每棵树基于经纬度哈希进行微小错峰（范围 ±0.06），模拟自然森林参差换季
            let treeBlend = baseBlend;
            if (baseBlend > 0 && it.c.assetNext !== it.c.asset) {
                const offset = (hash(it.c.lat, it.c.lng, 99) - 0.5) * 0.12;
                const start = Math.max(0.1, Math.min(0.9, (1 - SEASON_BLEND_WINDOW) + offset));
                if (seasonProgress <= start) {
                    treeBlend = 0;
                } else {
                    const t = (seasonProgress - start) / (1 - start);
                    treeBlend = Math.min(1, Math.max(0, t * t * (3 - 2 * t)));
                }
            }

            if (cur && nxt && cur !== nxt && treeBlend > 0) {
                // 严密对称 Cross-Fade：本季平滑淡出 (1 - treeBlend)，下季平滑淡入 (treeBlend)
                // 在换季交接点 (treeBlend=1) 与新季首帧 (treeBlend=0) 像素级 100% 严密吻合
                drawOne(cur, it, 1 - treeBlend);
                drawOne(nxt, it, treeBlend);
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
        const probeLand = LandSeaSystem.createBlockProber();

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

                if (elev < 0 && !maskSaysLand(clusterLatLng.lat, clusterLatLng.lng)) continue;

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

                const count = Math.round(13 + clusterWeight * 6 + hash(cx, cy, 45) * 4);

                for (let i = 0; i < count; i++) {
                    const ang = hash(cx, cy, i + 50) * Math.PI * 2;
                    const radiusHash = hash(cx, cy, i + 60);
                    const rad = Math.sqrt(radiusHash) * CLUSTER_RADIUS;
                    const px = cxJ + Math.cos(ang) * rad;
                    const py = cyJ + Math.sin(ang) * rad;
                    const ptLatLng = this.map.unproject([px, py], SAMPLE_ZOOM);

                    const ptKind = probeLand(
                        lngToDemGlobalX(ptLatLng.lng), latToDemGlobalY(ptLatLng.lat),
                    );
                    if (ptKind !== 'land') { if (ptKind === 'pending') missingTiles++; continue; }

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

        this.trees = drawCommands;
        this.sampledGameSeason = gameSeason;
        this.paint();
        drawnTrees = drawCommands.length;

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