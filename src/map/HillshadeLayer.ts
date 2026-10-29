import * as L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import HillshadeWorker from '../workers/HillshadeWorker?worker'; // Vite Worker Import
import type { HillshadeRequest, HillshadeResponse, HillshadeRegion } from '../workers/HillshadeWorker';
import { HISTORICAL_REGIONS, NILE_VALLEY_EXP_BOUNDS } from '../data/HistoricalRegions';
import { gameLog } from '../utils/GameLogger';
import { ESRI_SHADED_RELIEF_URL } from '../world/land-sea/WaterMask';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { MATERIAL_BUDGET_BYTES } from './StrategicTerrainMaterial';
import type { RiverSegmentsMessage } from './RiverStripData';
import { loadWorldBaseData, queryStrategicBackdropTile } from '../ui/scene13/WorldBaseMap';

const BACKDROP_TEX_SIZE = 128;
const backdropTexCache = new Map<string, HTMLCanvasElement>();
const backdropTexPending = new Set<string>();
const backdropListeners = new Set<() => void>();
let worldBaseInitStarted = false;

function notifyBackdropReady(): void {
    for (const fn of backdropListeners) fn();
}

function ensureBackdropTexture(name: string): HTMLCanvasElement | undefined {
    const hit = backdropTexCache.get(name);
    if (hit) return hit;
    if (backdropTexPending.has(name)) return undefined;
    backdropTexPending.add(name);
    const img = new Image();
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = BACKDROP_TEX_SIZE;
        c.height = BACKDROP_TEX_SIZE;
        const cctx = c.getContext('2d');
        if (cctx) {
            cctx.drawImage(img, 0, 0, BACKDROP_TEX_SIZE, BACKDROP_TEX_SIZE);
            if (name === 'wtr') {
                // 海洋贴图叠合战略地图统一海色 #6395b8，保留 DE 水波纹理且与山体瓦片成图海色一致
                cctx.fillStyle = 'rgba(99, 149, 184, 0.72)';
                cctx.fillRect(0, 0, BACKDROP_TEX_SIZE, BACKDROP_TEX_SIZE);
            }
            backdropTexCache.set(name, c);
            notifyBackdropReady();
        }
    };
    img.src = `/SUCAI_TERRAIN/${name}.png`;
    return undefined;
}

// 转换 HistoricalRegion 为 Worker 友好结构(扁平化, 默认值)
const REGIONS_FOR_WORKER: HillshadeRegion[] = HISTORICAL_REGIONS.map(r => ({
    center: r.center,
    radii: r.radii,
    color: r.color,
    blendStrength: r.blendStrength,
    elevMin: r.elevMin ?? -1000,
    elevMax: r.elevMax ?? 9000
}));



// 瓦片 (z, x, y) → lat/lng 边界 (Web Mercator)
function tileBoundsFromCoords(z: number, x: number, y: number) {
    const n = Math.pow(2, z);
    const lngWest = x / n * 360 - 180;
    const lngEast = (x + 1) / n * 360 - 180;
    const latN = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const latS = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    return { north: latN, south: latS, west: lngWest, east: lngEast };
}

/**
 * 未探索迷雾画布向四周外扩的像素宽度（用于云絮 Alpha 透明羽化，直接漫过并柔化相邻已加载瓦片的 256px 刀切硬边）。
 */
interface HillshadeOptions extends L.GridLayerOptions {
    azimuth?: number;
    altitude?: number;
    zFactor?: number;
    shadowOpacity?: number;
    useElevationColor?: boolean;
    /** 沙漠/湿地/古湖等历史区域涂色（HISTORICAL_REGIONS），默认开 */
    useDesertColoring?: boolean;
    /** 战略山体浮雕（Zoom7–12），默认开 */
    experimentalRelief?: boolean;
    /** 尼罗河谷冲积地貌试验（ZOOM 9），独立开关 */
    valleyReliefExp?: boolean;
    /** 7 层高地试验（DE 台地光照，浮雕瓦片 Zoom7–12），默认关 */
    terraceExp?: boolean;
    /** 文明6风格光影试验，默认开 */
    civ6LightExp?: boolean;
}

const WORKER_POOL_SIZE = 3;

/**
 * 已算好的瓦片位图缓存上限。
 * 1080p 视口每层约 60~80 块（256px），存 240 块≈覆盖三个 zoom 层级，
 * 让 9↔10 来回切换第二次起直接命中，既省网络也省 Worker 计算。
 * 单块 256×256 RGBA ≈ 256KB，满载约 60MB。
 */
const TILE_CACHE_MAX = 240;

export class HillshadeLayer extends L.GridLayer {
    private zFactor: number;
    private shadowOpacity: number;
    private useElevationColor: boolean;
    private useDesertColoring: boolean;
    private experimentalRelief: boolean = true;
    private valleyReliefExp: boolean = true;
    private terraceExp: boolean = false;
    private civ6LightExp: boolean = false;
    private modeVersion: number = 0;

    private workers: Worker[] = [];
    /** 沙漠河流绿带用的河流线段（主线程抽稀好）；undefined = 还没加载完，null = 加载失败 */
    private riverSegments: Float32Array | null | undefined = undefined;
    private materialBytesByWorker = new Map<Worker, number>();
    private workerRenderMs = 0;
    private workerRenderSamples = 0;
    private rrIndex: number = 0; // Worker 轮询下标
    private msgIdCounter: number = 0;
    private pendingTiles: Map<number, {
        ctx: CanvasRenderingContext2D;
        tile: HTMLCanvasElement;
        done: L.DoneCallback;
        cacheKey: string;
        modeVersion: number;
        coords: L.Coords;
        size: L.Point;
        bounds: { north: number; south: number; east: number; west: number };
        isExpTile: boolean;
        isValleyTile: boolean;
        retryCount: number;
    }> = new Map();
    /** LRU：Map 迭代序即插入序，命中时删了重插即「最近使用」 */
    private tileCache: Map<string, ImageBitmap> = new Map();
    /** 已发过预取请求的 z/x/y，避免每次 zoomend 重复占用连接 */
    private prefetchedKeys: Set<string> = new Set();

    // [诊断 2026-07-27] 只读计数器，供 ZoomPerfProbe 判断某次缩放到底新算了多少块瓦片
    private statTilesComputed = 0;
    private statCacheHits = 0;

    /** 供性能探针读取的瓦片统计（不影响任何渲染行为） */
    public getStats() {
        return {
            computed: this.statTilesComputed,
            cacheHits: this.statCacheHits,
            cacheSize: this.tileCache.size,
            cacheMax: TILE_CACHE_MAX,
            pending: this.pendingTiles.size,
            materialBytes: [...this.materialBytesByWorker.values()].reduce((sum, bytes) => sum + bytes, 0),
            workerRenderMeanMs: this.workerRenderSamples ? this.workerRenderMs / this.workerRenderSamples : 0,
        };
    }

    constructor(options?: HillshadeOptions) {
        super({
            tileSize: 256,
            opacity: 1.0,
            zIndex: 2,
            // 🔴 [2026-09-18] 与底图同口径：跟拍平移时 50ms 补一次瓦片，别让边缘留空（默认 200ms）
            updateInterval: 50,
            azimuth: 315,
            altitude: 40,
            ...options
        });

        this.zFactor = options?.zFactor ?? 33.0;
        this.shadowOpacity = options?.shadowOpacity ?? 1.0;
        this.useElevationColor = options?.useElevationColor ?? true;
        this.useDesertColoring = options?.useDesertColoring ?? true;
        this.experimentalRelief = options?.experimentalRelief ?? true;
        this.valleyReliefExp = options?.valleyReliefExp ?? true;
        this.terraceExp = options?.terraceExp ?? false;
        this.civ6LightExp = options?.civ6LightExp ?? false;
        perfDoctor.registerCache({
            name: 'HillshadeLayer:DE materials(战略地表)',
            where: 'src/map/StrategicTerrainMaterial.ts:textures',
            entries: () => this.materialBytesByWorker.size,
            bytes: () => [...this.materialBytesByWorker.values()].reduce((sum, bytes) => sum + bytes, 0),
            limitKind: 'bytes',
            limitValue: MATERIAL_BUDGET_BYTES * WORKER_POOL_SIZE,
            churn: () => ({ evicts: 0, reAdds: 0 }),
        });

        this.ensureWorkers();
        this.initBackdropMaterials();

        gameLog('startup', `HillshadeLayer: Initialized with ${WORKER_POOL_SIZE} Web Workers (z=${this.zFactor})`);
    }

    /**
     * 建（或重建）Worker 池。
     * onRemove 会 terminate 整池，而 toggleHillshade 复用同一个图层实例再 addTo，
     * 所以取瓦片前必须确认池子还在，否则 postMessage 打到 undefined。
     */
    private ensureWorkers(): void {
        if (this.workers.length > 0) return;
        for (let i = 0; i < WORKER_POOL_SIZE; i++) {
            const w = new HillshadeWorker();
            w.onmessage = this.handleWorkerMessage.bind(this);
            // 重建的 Worker 也要拿到河流线段（沙漠河流绿带用）
            if (this.riverSegments !== undefined) w.postMessage({ type: 'rivers', segs: this.riverSegments } satisfies RiverSegmentsMessage);
            this.workers.push(w);
        }
        this.rrIndex = 0;
    }

    private handleWorkerMessage(e: MessageEvent<HillshadeResponse>) {
        const { id, bitmap, error } = e.data;
        if (e.data.materialBytes !== undefined) {
            this.materialBytesByWorker.set(e.target as Worker, e.data.materialBytes);
        }
        if (e.data.renderMs !== undefined) {
            this.workerRenderMs += e.data.renderMs;
            this.workerRenderSamples++;
        }
        const task = this.pendingTiles.get(id);
        this.pendingTiles.delete(id);

        if (!task) {
            // 瓦片已被 Leaflet 剔除（快速连切 zoom）：位图无人认领，直接释放
            bitmap?.close();
            return;
        }

        // 快速开关保护：旧 Worker 任务完成时如果 modeVersion 不匹配，直接丢弃位图避免串画
        if (task.modeVersion !== this.modeVersion) {
            bitmap?.close();
            task.done(undefined, task.tile);
            return;
        }

        const { ctx, tile, done, cacheKey, coords, size, bounds, isExpTile, isValleyTile, retryCount } = task;

        if (!bitmap) {
            // 取图/解码超时或偶发失败：保留「未探索灰雾」遮罩并在后台自动延时重试，绝不留刺眼蓝洞或死块
            if (error) console.warn('[Hillshade] tile delayed, keeping fog & scheduling retry:', error);
            if (retryCount < 4) {
                const nextRetry = retryCount + 1;
                const delayMs = 1800 * nextRetry;
                setTimeout(() => {
                    if (!tile.isConnected || task.modeVersion !== this.modeVersion) return;
                    this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, nextRetry);
                }, delayMs);
            }
            return;
        }

        try {
            const _t0 = performance.now();
            // removed exitFogState
            ctx.clearRect(0, 0, size.x, size.y);
            ctx.drawImage(bitmap, 0, 0);
            if (e.data.isCoarseFallback) {
                // 粗高程远景兜底已上屏（无缝同色系过渡），不写入高清缓存，后台静默重拉高清瓦片替换
                bitmap.close();
                if (retryCount < 4) {
                    const nextRetry = retryCount + 1;
                    const delayMs = 2000 * nextRetry;
                    setTimeout(() => {
                        if (!tile.isConnected || task.modeVersion !== this.modeVersion) return;
                        this.dispatchTile(coords, size, bounds, ctx, tile, () => {}, cacheKey, isExpTile, isValleyTile, nextRetry);
                    }, delayMs);
                }
            } else {
                this.cachePut(cacheKey, bitmap);
            }
            perfDoctor.note('HillshadeLayer.handleWorkerMessage(山体瓦片上屏)', performance.now() - _t0, 'src/map/HillshadeLayer.ts:handleWorkerMessage');
        } catch (err) {
            // 异常兜底：保持灰雾并释放位图
            console.warn('[Hillshade] 位图绘制失败:', err);
            bitmap.close();
        }
        done(undefined, tile);
    }

    /** 山体浮雕试验的适用瓦片：只在战略档位 zoom7~12 生效 */
    private isReliefTile(z: number): boolean {
        return this.experimentalRelief && z >= 7 && z <= 12;
    }

    /** 尼罗河谷试验的适用瓦片：zoom9 且与试验范围相交 */
    private isValleyTile(z: number, bounds: { north: number; south: number; east: number; west: number }): boolean {
        return this.valleyReliefExp && z === 9 && !(
            bounds.south > NILE_VALLEY_EXP_BOUNDS.north ||
            bounds.north < NILE_VALLEY_EXP_BOUNDS.south ||
            bounds.east < NILE_VALLEY_EXP_BOUNDS.west ||
            bounds.west > NILE_VALLEY_EXP_BOUNDS.east
        );
    }

    /**
     * 位图缓存键：坐标 + 渲染模式标签。
     * 🔴 createTile 与 prefetchAdjacentZoom 必须走这一个函数——两边各写一份标签字面量时，
     *    预取侧的版本号落后（v3 vs v6）就再也判不出「这块已经算好了」，每次切 zoom 都白发一轮请求。
     */
    private tileCacheKey(z: number, x: number, y: number, isRelief: boolean, isValley: boolean): string {
        return `${z}/${x}/${y}:${isRelief ? 'relief_snow_v15' : 'std_v7'}:${isValley ? 'valley_nile_v1' : 'v0'}${isRelief && this.terraceExp ? ':terrace7_v1' : ''}`;
    }

    /** LRU 读：命中则移到队尾标记为最近使用 */
    private cacheGet(key: string): ImageBitmap | undefined {
        const hit = this.tileCache.get(key);
        if (hit) {
            this.tileCache.delete(key);
            this.tileCache.set(key, hit);
        }
        return hit;
    }

    /** LRU 写：超上限则淘汰最久未用的一块并释放其显存 */
    private cachePut(key: string, bitmap: ImageBitmap): void {
        // [FIX 2026-07-28] 同键覆盖时必须释放旧位图，否则那块显存再没人能回收
        //（两个 Worker 同时算出同一块瓦片时会走到；虽罕见但确实泄漏）。
        // 安全性：缓存命中路径已改为在微任务里重新查缓存，拿到的必是新位图，
        // 不会有人还攥着这个被 close 的旧引用。
        const prev = this.tileCache.get(key);
        if (prev && prev !== bitmap) prev.close();
        this.tileCache.delete(key);
        this.tileCache.set(key, bitmap);
        while (this.tileCache.size > TILE_CACHE_MAX) {
            const oldestKey = this.tileCache.keys().next().value as string | undefined;
            if (oldestKey === undefined) break;
            this.tileCache.get(oldestKey)?.close();
            this.tileCache.delete(oldestKey);
        }
    }

    /** 参数变了 → 旧位图全部作废 */
    private clearTileCache(): void {
        for (const bmp of this.tileCache.values()) bmp.close();
        this.tileCache.clear();
    }

    /**
     * 预取相邻 zoom level 的高程 PNG，灌进浏览器 HTTP 缓存。
     *
     * [PERF 2026-07-27] 旧实现每次 zoomend 都无条件重发最多 120 个请求（上下两级各 60 块），
     * 打的是和可见瓦片同一个域，等于每次切镜头都自己制造网络拥塞。现在：
     * 已算好（在位图缓存里）或已预取过的一律跳过，且读完响应体及时释放连接。
     */
    public prefetchAdjacentZoom(currentZoom: number, map: L.Map): void {
        const targetZooms = [currentZoom - 1, currentZoom + 1].filter(z => z >= 9 && z <= 10);
        if (targetZooms.length === 0) return;

        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const PREFETCH_LIMIT = 60; // 最多预取 60 块

        for (const z of targetZooms) {
            const n = Math.pow(2, z);
            const xMin = Math.floor((sw.lng + 180) / 360 * n);
            const xMax = Math.floor((ne.lng + 180) / 360 * n);
            const latRad = (lat: number) => lat * Math.PI / 180;
            const yMax = Math.floor((1 - Math.log(Math.tan(latRad(sw.lat)) + 1 / Math.cos(latRad(sw.lat))) / Math.PI) / 2 * n);
            const yMin = Math.floor((1 - Math.log(Math.tan(latRad(ne.lat)) + 1 / Math.cos(latRad(ne.lat))) / Math.PI) / 2 * n);

            let count = 0;
            for (let x = xMin; x <= xMax && count < PREFETCH_LIMIT; x++) {
                for (let y = yMin; y <= yMax && count < PREFETCH_LIMIT; y++) {
                    const key = `${z}/${x}/${y}`;
                    const cacheKey = this.tileCacheKey(
                        z, x, y,
                        this.isReliefTile(z),
                        this.isValleyTile(z, tileBoundsFromCoords(z, x, y)),
                    );
                    if (this.tileCache.has(cacheKey) || this.prefetchedKeys.has(key)) continue;
                    this.prefetchedKeys.add(key);

                    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
                    // 只灌 HTTP 缓存，不解码：Worker 稍后 fetch 同一 URL 时直接命中。
                    // 必须读完 body，否则连接迟迟不归还，反过来卡住可见瓦片。
                    fetch(url, { mode: 'cors' })
                        .then(r => r.arrayBuffer())
                        .catch(() => { this.prefetchedKeys.delete(key); });
                    count++;
                }
            }
        }
    }

    public setParams(params: { zFactor?: number; shadowOpacity?: number; altitude?: number; useElevationColor?: boolean; useDesertColoring?: boolean }) {
        let changed = false;
        if (params.zFactor !== undefined && params.zFactor !== this.zFactor) {
            this.zFactor = params.zFactor;
            changed = true;
        }
        if (params.shadowOpacity !== undefined && params.shadowOpacity !== this.shadowOpacity) {
            this.shadowOpacity = params.shadowOpacity;
            changed = true;
        }
        if (params.altitude !== undefined && params.altitude !== (this.options as HillshadeOptions).altitude) {
            (this.options as HillshadeOptions).altitude = params.altitude;
            changed = true;
        }
        if (params.useElevationColor !== undefined && params.useElevationColor !== this.useElevationColor) {
            this.useElevationColor = params.useElevationColor;
            changed = true;
        }
        if (params.useDesertColoring !== undefined && params.useDesertColoring !== this.useDesertColoring) {
            this.useDesertColoring = params.useDesertColoring;
            changed = true;
        }

        if (changed) {
            // 参数变了，缓存里算好的位图全部作废
            this.modeVersion++;
            this.clearTileCache();
            this.redraw();
        }
    }

    public setExperimentalRelief(enabled: boolean): void {
        if (this.experimentalRelief === enabled) return;
        this.experimentalRelief = enabled;
        this.modeVersion++;
        this.clearTileCache();
        this.redraw();
    }

    /**
     * 🔴 [2026-09-30] 河流线段（src/map/RiverStripData.ts 抽稀）发给各 Worker，干旱瓦片画沙漠河流绿带用。
     *    主线程本来就要加载解析这份河流数据，在这里转交，Worker 不再各自下载 6MB。
     */
    public setRiverSegments(segs: Float32Array | null): void {
        this.riverSegments = segs;
        for (const w of this.workers) w.postMessage({ type: 'rivers', segs } satisfies RiverSegmentsMessage);
    }

    public setValleyReliefExp(enabled: boolean): void {
        if (this.valleyReliefExp === enabled) return;
        this.valleyReliefExp = enabled;
        this.modeVersion++;
        this.clearTileCache();
        this.redraw();
    }

    public setTerraceExp(enabled: boolean): void {
        if (this.terraceExp === enabled) return;
        this.terraceExp = enabled;
        this.modeVersion++;
        this.clearTileCache();
        this.redraw();
    }

    public setCiv6LightExp(enabled: boolean): void {
        if (this.civ6LightExp === enabled) return;
        this.civ6LightExp = enabled;
        this.modeVersion++;
        this.clearTileCache();
        this.redraw();
    }

    /**
     * 瓦片尚未算完时的同步垫底绘制（彻底取代冷灰雾）：
     * 1. 优先从内存 tileCache 查找已缓存的父级瓦片（z-1..z-4）局部放大垫底；
     * 2. 若从高倍缩放到低倍，叠加已缓存的子级瓦片（z+1 四象限）；
     * 3. 若均无缓存，按内存海陆采样（不触发网络请求）铺暖沙盘宣纸色（#b8a377）或海洋蓝（#6395b8）。
     */
    private drawProvisionalBackdrop(
        ctx: CanvasRenderingContext2D,
        size: L.Point,
        coords: L.Coords,
        bounds: { north: number; south: number; east: number; west: number },
    ): void {
        let drewAncestor = false;
        const minAncZ = Math.max(4, coords.z - 4);
        for (let ancZ = coords.z - 1; ancZ >= minAncZ; ancZ--) {
            const scale = 1 << (coords.z - ancZ);
            const ancX = Math.floor(coords.x / scale);
            const ancY = Math.floor(coords.y / scale);
            const ancBounds = tileBoundsFromCoords(ancZ, ancX, ancY);
            const ancKey = this.tileCacheKey(ancZ, ancX, ancY, this.isReliefTile(ancZ), this.isValleyTile(ancZ, ancBounds));
            const ancBmp = this.tileCache.get(ancKey);
            if (ancBmp) {
                const subW = size.x / scale;
                const subH = size.y / scale;
                const sx = (coords.x - ancX * scale) * subW;
                const sy = (coords.y - ancY * scale) * subH;
                try {
                    ctx.save();
                    ctx.imageSmoothingEnabled = true;
                    ctx.drawImage(ancBmp, sx, sy, subW, subH, 0, 0, size.x, size.y);
                    ctx.restore();
                    drewAncestor = true;
                    break;
                } catch {
                    // ignore detached bitmap
                }
            }
        }

        let drewChildCount = 0;
        const childZ = coords.z + 1;
        if (childZ <= 12) {
            const halfW = size.x / 2;
            const halfH = size.y / 2;
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const cx = coords.x * 2 + dx;
                    const cy = coords.y * 2 + dy;
                    const cBounds = tileBoundsFromCoords(childZ, cx, cy);
                    const cKey = this.tileCacheKey(childZ, cx, cy, this.isReliefTile(childZ), this.isValleyTile(childZ, cBounds));
                    const cBmp = this.tileCache.get(cKey);
                    if (cBmp) {
                        try {
                            ctx.save();
                            ctx.imageSmoothingEnabled = true;
                            ctx.drawImage(cBmp, 0, 0, size.x, size.y, dx * halfW, dy * halfH, halfW, halfH);
                            ctx.restore();
                            drewChildCount++;
                        } catch {
                            // ignore detached bitmap
                        }
                    }
                }
            }
        }

        if (drewAncestor || drewChildCount === 4) return;

        const GRID = 8;
        const cellW = size.x / GRID;
        const cellH = size.y / GRID;
        for (let gy = 0; gy < GRID; gy++) {
            const lat = bounds.north - ((gy + 0.5) / GRID) * (bounds.north - bounds.south);
            for (let gx = 0; gx < GRID; gx++) {
                if (drewChildCount > 0) {
                    const qx = gx < GRID / 2 ? 0 : 1;
                    const qy = gy < GRID / 2 ? 0 : 1;
                    const cx = coords.x * 2 + qx;
                    const cy = coords.y * 2 + qy;
                    const cBounds = tileBoundsFromCoords(childZ, cx, cy);
                    const cKey = this.tileCacheKey(childZ, cx, cy, this.isReliefTile(childZ), this.isValleyTile(childZ, cBounds));
                    if (this.tileCache.has(cKey)) continue;
                }
                const lng = bounds.west + ((gx + 0.5) / GRID) * (bounds.east - bounds.west);
                const landSea = LandSeaSystem.probeLandSea(lat, lng);
                const wbTile = queryStrategicBackdropTile(lat, lng);
                const isSea = landSea === 'sea' || wbTile === 'sea';
                const texName = isSea ? 'wtr' : (wbTile && wbTile !== 'sea' ? wbTile : 'gr2');
                const texCanvas = ensureBackdropTexture(texName) ?? (isSea ? undefined : backdropTexCache.get('gr2'));
                const dx = gx * cellW;
                const dy = gy * cellH;
                if (texCanvas) {
                    const sx = (((coords.x * size.x + dx) % BACKDROP_TEX_SIZE) + BACKDROP_TEX_SIZE) % BACKDROP_TEX_SIZE;
                    const sy = (((coords.y * size.y + dy) % BACKDROP_TEX_SIZE) + BACKDROP_TEX_SIZE) % BACKDROP_TEX_SIZE;
                    const sw = Math.min(cellW, BACKDROP_TEX_SIZE - sx);
                    const sh = Math.min(cellH, BACKDROP_TEX_SIZE - sy);
                    ctx.drawImage(texCanvas, sx, sy, sw, sh, dx, dy, cellW + 0.5, cellH + 0.5);
                } else {
                    ctx.fillStyle = isSea ? '#6395b8' : '#b8a377';
                    ctx.fillRect(dx, dy, cellW + 0.5, cellH + 0.5);
                }
            }
        }
    }

    private initBackdropMaterials(): void {
        if (!worldBaseInitStarted) {
            worldBaseInitStarted = true;
            loadWorldBaseData('/world/world-base.png').then(ok => {
                if (ok) notifyBackdropReady();
            });
            for (const pre of ['gr2', 'grs', 'gr3', 'ds2', 'ds5', 'pal', 'for', 'wtr']) {
                ensureBackdropTexture(pre);
            }
        }
        backdropListeners.add(this.handleBackdropReady);
    }

    private handleBackdropReady = (): void => {
        for (const task of this.pendingTiles.values()) {
            if (!task.tile.isConnected || task.modeVersion !== this.modeVersion) continue;
            this.drawProvisionalBackdrop(task.ctx, task.size, task.coords, task.bounds);
        }
    };

    createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
        const tile = L.DomUtil.create('canvas', 'leaflet-tile') as HTMLCanvasElement;
        tile.style.pointerEvents = 'none';

        const size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;

        const ctx = tile.getContext('2d');
        if (!ctx) {
            done(new Error("Canvas context missing"), tile);
            return tile;
        }

        // 创建时保持透明，在 Worker 计算完成前自然透出底图，彻底消除棋盘方块闪烁

        this.ensureWorkers();
        this.initBackdropMaterials();
        const bounds = tileBoundsFromCoords(coords.z, coords.x, coords.y);
        const isExpTile = this.isReliefTile(coords.z);
        const isValleyTile = this.isValleyTile(coords.z, bounds);
        const cacheKey = this.tileCacheKey(coords.z, coords.x, coords.y, isExpTile, isValleyTile);

        // ── 缓存命中：来回切 zoom 时的常见路径，无网络、无 Worker、无像素回读 ──
        const cached = this.cacheGet(cacheKey);
        if (cached) {
            this.statCacheHits++;
            // done() 必须异步：Leaflet 在 createTile 返回后才把该瓦片登记进 _tiles
            queueMicrotask(() => {
                // [FIX 2026-07-28] 不能用上面捕获的 cached 引用画图。
                // 微任务这一跳之间，位图可能已经被 close() 掉：
                //   · 缩放 → applyHillshadeForZoom → setParams → clearTileCache() 释放全部位图
                //   · 新瓦片入缓存 → cachePut 触发 LRU 淘汰，close 掉最久未用的一块
                // 对已释放的 ImageBitmap 调 drawImage 会抛
                // InvalidStateError: The image source is detached。
                // 改为重新查一次缓存：条目还在 ⇒ 位图必定有效（淘汰是「close + 删键」成对做的）。
                const fresh = this.cacheGet(cacheKey);
                if (!fresh) {
                    this.drawProvisionalBackdrop(ctx, size, coords, bounds);
                    this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, 0);
                    return;
                }
                try {
                    ctx.drawImage(fresh, 0, 0);
                } catch (err) {
                    // 兜底：绘制异常时重算，同样不留空白瓦片
                    console.warn('[Hillshade] 缓存位图绘制失败，改为重算:', err);
                    this.drawProvisionalBackdrop(ctx, size, coords, bounds);
                    this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, 0);
                    return;
                }
                done(undefined, tile);
            });
            return tile;
        }

        // 未命中缓存（需网络请求 + Worker 计算）：先铺上无缝「未探索灰雾」遮罩，算完后自动拨雾显现地形
        this.drawProvisionalBackdrop(ctx, size, coords, bounds);
        this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, 0);
        return tile;
    }

    /**
     * 把一块瓦片派发给 Worker 计算。
     * 🔴 单独成方法是因为**缓存命中的那条路径也可能落空**（见 createTile 里的微任务）：
     *    落空时必须重新走这里算一遍，绝不能 done() 一张空白画布 —— 那会被 Leaflet 记成
     *    「已加载」，此后永不重建，图上就留下一块**永久透明的方格**。
     */
    private dispatchTile(
        coords: L.Coords,
        size: L.Point,
        bounds: { north: number; south: number; east: number; west: number },
        ctx: CanvasRenderingContext2D,
        tile: HTMLCanvasElement,
        done: L.DoneCallback,
        cacheKey: string,
        isExpTile: boolean,
        isValleyTile: boolean,
        retryCount: number = 0,
    ): void {
        this.ensureWorkers();
        this.initBackdropMaterials();
        const reqId = this.msgIdCounter++;
        // 仅传与当前瓦片相交的区域,减少 Worker 内逐像素检查的循环次数
        // 沙漠涂色关闭（调试开关）→ 不传任何区域，Worker 走纯海拔着色，可对比开关前后效果
        const relevantRegions = this.useDesertColoring
            ? REGIONS_FOR_WORKER.filter(r => {
                const latMin = r.center[0] - r.radii[0];
                const latMax = r.center[0] + r.radii[0];
                const lngMin = r.center[1] - r.radii[1];
                const lngMax = r.center[1] + r.radii[1];
                return !(latMax < bounds.south || latMin > bounds.north ||
                         lngMax < bounds.west || lngMin > bounds.east);
            })
            : [];

        const request: HillshadeRequest = {
            id: reqId,
            url: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${coords.z}/${coords.x}/${coords.y}.png`,
            // 注意 ESRI 是 {z}/{y}/{x}，y 在前。Worker 只在该瓦片确实含海平面以下像素时
            // 才会真去取（见 hasBelowSeaPixel），内陆瓦片这个 URL 根本不会被请求。
            waterMaskUrl: ESRI_SHADED_RELIEF_URL
                .replace('{z}', String(coords.z))
                .replace('{y}', String(coords.y))
                .replace('{x}', String(coords.x)),
            width: size.x,
            height: size.y,
            params: {
                azimuth: (this.options as HillshadeOptions).azimuth ?? 315,
                altitude: (this.options as HillshadeOptions).altitude ?? 40,
                zFactor: this.zFactor,
                opacity: this.shadowOpacity,
                useElevationColor: this.useElevationColor
            },
            tileBounds: bounds,
            regions: relevantRegions,
            coords: { z: coords.z, x: coords.x, y: coords.y },
            experimentalRelief: isExpTile,
            valleyReliefExp: isValleyTile,
            terraceExp: isExpTile && this.terraceExp,
            civ6LightExp: this.civ6LightExp,
            modeVersion: this.modeVersion
        };

        this.statTilesComputed++;
        this.pendingTiles.set(reqId, {
            ctx,
            tile,
            done,
            cacheKey,
            modeVersion: this.modeVersion,
            coords,
            size,
            bounds,
            isExpTile,
            isValleyTile,
            retryCount,
        });

        // 按 2×2 瓦片块空间分配 Worker：相邻瓦片共享同一 Worker 内的 rawDemCache 与 demPending，避免 3 个 Worker 重复拉取同一批邻块高程
        const workerIdx = ((Math.floor(coords.x / 2) + Math.floor(coords.y / 2)) % this.workers.length + this.workers.length) % this.workers.length;
        this.workers[workerIdx].postMessage(request);
    }

    // [FIX] 避免过渡动画完成时图层已被 remove 导致的 TypeError: Cannot read properties of null (reading 'getCenter')
    protected _resetView(e?: any): void {
        if (!this._map) return;
        (L.GridLayer.prototype as any)._resetView?.call(this, e);
    }

    // Cleanup if layer removed
    onRemove(map: L.Map): this {
        backdropListeners.delete(this.handleBackdropReady);
        for (const w of this.workers) w.terminate();
        this.materialBytesByWorker.clear();
        this.workers.length = 0;
        this.pendingTiles.clear();
        this.clearTileCache();
        return super.onRemove(map);
    }
}
