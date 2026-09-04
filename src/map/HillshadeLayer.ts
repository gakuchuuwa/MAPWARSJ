import * as L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import HillshadeWorker from '../workers/HillshadeWorker?worker'; // Vite Worker Import
import { HillshadeRequest, HillshadeResponse, HillshadeRegion } from '../workers/HillshadeWorker';
import { HISTORICAL_REGIONS } from '../data/HistoricalRegions';
import { gameLog } from '../utils/GameLogger';
import { ESRI_SHADED_RELIEF_URL } from '../world/land-sea/WaterMask';
import { WebGLTerrainRenderer } from '../render/webgl/WebGLTerrainRenderer';

// 转换 HistoricalRegion 为 Worker 友好结构(扁平化, 默认值)
const REGIONS_FOR_WORKER: HillshadeRegion[] = HISTORICAL_REGIONS.map(r => ({
    center: r.center,
    radii: r.radii,
    color: r.color,
    blendStrength: r.blendStrength,
    elevMin: r.elevMin ?? -1000,
    elevMax: r.elevMax ?? 9000
}));

// [FALLBACK] 高程瓦片加载失败或缺失时的兜底色（Sage 海拔平原绿，与全局古卷底色优雅对齐）
const FALLBACK_TILE_COLOR = '#8e9b82';

// 瓦片 (z, x, y) → lat/lng 边界 (Web Mercator)
function tileBoundsFromCoords(z: number, x: number, y: number) {
    const n = Math.pow(2, z);
    const lngWest = x / n * 360 - 180;
    const lngEast = (x + 1) / n * 360 - 180;
    const latN = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const latS = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    return { north: latN, south: latS, west: lngWest, east: lngEast };
}

interface HillshadeOptions extends L.GridLayerOptions {
    azimuth?: number;
    altitude?: number;
    zFactor?: number;
    shadowOpacity?: number;
    useElevationColor?: boolean;
    /** 沙漠/湿地/古湖等历史区域涂色（HISTORICAL_REGIONS），默认开 */
    useDesertColoring?: boolean;
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

    private workers: Worker[] = [];
    private rrIndex: number = 0; // Worker 轮询下标
    private msgIdCounter: number = 0;
    private pendingTiles: Map<number, { ctx: CanvasRenderingContext2D, tile: HTMLElement, done: L.DoneCallback, cacheKey: string }> = new Map();
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
        };
    }

    constructor(options?: HillshadeOptions) {
        super({
            tileSize: 256,
            opacity: 1.0,
            zIndex: 2,
            azimuth: 315,
            altitude: 40,
            ...options
        });

        this.zFactor = options?.zFactor ?? 25.0;
        this.shadowOpacity = options?.shadowOpacity ?? 1.0;
        this.useElevationColor = options?.useElevationColor ?? true;
        this.useDesertColoring = options?.useDesertColoring ?? true;

        this.ensureWorkers();

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
            this.workers.push(w);
        }
        this.rrIndex = 0;
    }

    private handleWorkerMessage(e: MessageEvent<HillshadeResponse>) {
        const { id, bitmap, error } = e.data;
        const task = this.pendingTiles.get(id);
        this.pendingTiles.delete(id);

        if (!task) {
            // 瓦片已被 Leaflet 剔除（快速连切 zoom）：位图无人认领，直接释放
            bitmap?.close();
            return;
        }

        const { ctx, tile, done, cacheKey } = task;

        if (!bitmap) {
            // [FALLBACK] 取图/解码失败：平涂古图纸色，杜绝山体消失露出底图空白
            if (error) console.warn('[Hillshade] tile failed:', error);
            ctx.fillStyle = FALLBACK_TILE_COLOR;
            ctx.fillRect(0, 0, tile.clientWidth || 256, tile.clientHeight || 256);
            done(undefined, tile);
            return;
        }

        try {
            const _t0 = performance.now();
            ctx.drawImage(bitmap, 0, 0);
            this.cachePut(cacheKey, bitmap);
            perfDoctor.note('HillshadeLayer.handleWorkerMessage(山体瓦片上屏)', performance.now() - _t0, 'src/map/HillshadeLayer.ts:handleWorkerMessage');
        } catch (err) {
            // 位图刚从 Worker transfer 过来，正常不会 detach；真出事也必须保证 done() 被调，
            // 否则 Leaflet 会把这块瓦片永远挂在加载态。
            console.warn('[Hillshade] 位图绘制失败，改用兜底色:', err);
            ctx.fillStyle = FALLBACK_TILE_COLOR;
            ctx.fillRect(0, 0, tile.clientWidth || 256, tile.clientHeight || 256);
            bitmap.close();
        }
        done(undefined, tile);
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
        const targetZooms = [currentZoom - 1, currentZoom + 1].filter(z => z >= 7 && z <= 12);
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
                    // 已算好或已预取过：不再重复占用连接
                    if (this.tileCache.has(key) || this.prefetchedKeys.has(key)) continue;
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
            this.clearTileCache();
            this.redraw();
        }
    }

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

        // 创建时立即填古纸色，消除 zoom 切换期间透明底 + 红绿高程色暴露
        ctx.fillStyle = FALLBACK_TILE_COLOR;
        ctx.fillRect(0, 0, size.x, size.y);

        const cacheKey = `${coords.z}/${coords.x}/${coords.y}`;

        // ── 缓存命中：来回切 zoom 时的常见路径，无网络、无 Worker、无像素回读 ──
        const cached = this.cacheGet(cacheKey);
        if (cached) {
            this.statCacheHits++;
            // done() 必须异步：Leaflet 在 createTile 返回后才把该瓦片登记进 _tiles
            queueMicrotask(() => {
                const fresh = this.cacheGet(cacheKey);
                try {
                    if (fresh) {
                        ctx.drawImage(fresh, 0, 0);
                    } else {
                        ctx.fillStyle = FALLBACK_TILE_COLOR;
                        ctx.fillRect(0, 0, size.x, size.y);
                    }
                } catch (err) {
                    console.warn('[Hillshade] 缓存位图绘制失败，改用兜底色:', err);
                    ctx.fillStyle = FALLBACK_TILE_COLOR;
                    ctx.fillRect(0, 0, size.x, size.y);
                }
                done(undefined, tile);
            });
            return tile;
        }

        // ── GPU WebGL 硬件光照渲染管线优先 (<0.3ms 极速出图) ──
        const gpuRenderer = WebGLTerrainRenderer.getInstance();
        if (gpuRenderer) {
            const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${coords.z}/${coords.x}/${coords.y}.png`;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const _t0 = performance.now();
                    const renderedCanvas = gpuRenderer.renderTileToCanvas(img, {
                        azimuth: (this.options as HillshadeOptions).azimuth || 315,
                        altitude: (this.options as HillshadeOptions).altitude || 40,
                        zFactor: this.zFactor,
                        shadowOpacity: this.shadowOpacity,
                        useElevationColor: this.useElevationColor,
                    });
                    ctx.drawImage(renderedCanvas, 0, 0);
                    this.statTilesComputed++;
                    perfDoctor.note('HillshadeLayer.createTile(GPU硬件地形渲染)', performance.now() - _t0, 'src/map/HillshadeLayer.ts:createTile');
                    createImageBitmap(tile).then(bmp => {
                        this.cachePut(cacheKey, bmp);
                    }).catch(() => {});
                    done(undefined, tile);
                } catch (err) {
                    console.warn('[Hillshade] GPU渲染异常，回退Worker:', err);
                    this.dispatchToWorker(coords, ctx, tile, done, cacheKey, size);
                }
            };
            img.onerror = () => {
                ctx.fillStyle = FALLBACK_TILE_COLOR;
                ctx.fillRect(0, 0, size.x, size.y);
                done(undefined, tile);
            };
            img.src = url;
            return tile;
        }

        // ── 降级回退：Web Worker CPU 软算 ──
        this.dispatchToWorker(coords, ctx, tile, done, cacheKey, size);
        return tile;
    }

    /**
     * Web Worker 软算派发路径 (WebGL 不可用或渲染异常时的可靠降级)
     */
    private dispatchToWorker(
        coords: L.Coords,
        ctx: CanvasRenderingContext2D,
        tile: HTMLCanvasElement,
        done: L.DoneCallback,
        cacheKey: string,
        size: L.Point
    ): void {
        this.ensureWorkers();
        const reqId = this.msgIdCounter++;
        const bounds = tileBoundsFromCoords(coords.z, coords.x, coords.y);
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
            waterMaskUrl: ESRI_SHADED_RELIEF_URL
                .replace('{z}', String(coords.z))
                .replace('{y}', String(coords.y))
                .replace('{x}', String(coords.x)),
            width: size.x,
            height: size.y,
            params: {
                azimuth: (this.options as HillshadeOptions).azimuth || 315,
                altitude: (this.options as HillshadeOptions).altitude || 40,
                zFactor: this.zFactor,
                opacity: this.shadowOpacity,
                useElevationColor: this.useElevationColor
            },
            tileBounds: bounds,
            regions: relevantRegions
        };

        this.statTilesComputed++;
        this.pendingTiles.set(reqId, { ctx, tile, done, cacheKey });

        this.workers[this.rrIndex].postMessage(request);
        this.rrIndex = (this.rrIndex + 1) % this.workers.length;
    }

    // [FIX] 避免过渡动画完成时图层已被 remove 导致的 TypeError: Cannot read properties of null (reading 'getCenter')
    protected _resetView(e?: any): void {
        if (!this._map) return;
        (L.GridLayer.prototype as any)._resetView?.call(this, e);
    }

    // Cleanup if layer removed
    onRemove(map: L.Map): this {
        for (const w of this.workers) w.terminate();
        this.workers.length = 0;
        this.pendingTiles.clear();
        this.clearTileCache();
        return super.onRemove(map);
    }
}
