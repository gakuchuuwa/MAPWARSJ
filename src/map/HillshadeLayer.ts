import * as L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import HillshadeWorker from '../workers/HillshadeWorker?worker'; // Vite Worker Import
import type { HillshadeRequest, HillshadeResponse, HillshadeRegion } from '../workers/HillshadeWorker';
import { HISTORICAL_REGIONS, NILE_VALLEY_EXP_BOUNDS } from '../data/HistoricalRegions';
import { gameLog } from '../utils/GameLogger';
import { ESRI_SHADED_RELIEF_URL } from '../world/land-sea/WaterMask';
import { MATERIAL_BUDGET_BYTES } from './StrategicTerrainMaterial';
import type { RiverSegmentsMessage } from './RiverStripData';

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
const TILE_CACHE_MAX = 260;

/**
 * 玩家在战略地图移动时，跨过 256px 瓦片边界会同时触发 6~12 块缓存命中或 Worker 批量回传。
 * 采用与 TileDecoder.ts 同口径的双路驱动（requestAnimationFrame + 后台标签页 setTimeout 兜底）帧预算队列，
 * 将单帧瓦片画布合成与 Leaflet DOM 挂载严格控制在 ~2.0ms 以内（每帧保底至少上屏 1 块），优先保证玩家移动丝滑不卡。
 */
const TILE_COMMIT_BUDGET_MS = 2.0;

type PendingTileTask = {
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
};

type TileCommitJob =
    | {
        kind: 'worker';
        task: PendingTileTask;
        bitmap: ImageBitmap;
        summerBitmap?: ImageBitmap;
        autumnBitmap?: ImageBitmap;
        winterBitmap?: ImageBitmap;
        isCoarseFallback?: boolean;
    }
    | {
        kind: 'cache';
        coords: L.Coords;
        size: L.Point;
        bounds: { north: number; south: number; east: number; west: number };
        ctx: CanvasRenderingContext2D;
        tile: HTMLCanvasElement;
        done: L.DoneCallback;
        cacheKey: string;
        isExpTile: boolean;
        isValleyTile: boolean;
        modeVersion: number;
    };

/** ESRI World_Shaded_Relief 最细一级（更高缩放借这一级的父瓦片当水域掩膜） */
const ESRI_MASK_MAX_Z = 13;

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
    private pendingTiles: Map<number, PendingTileTask> = new Map();
    private commitQueue: TileCommitJob[] = [];
    private commitScheduled = false;
    private commitRafId: number | null = null;
    private commitTimerId: number | null = null;
    private activeCacheKeysScratch: Set<string> = new Set();
    /** LRU：Map 迭代序即插入序，命中时删了重插即「最近使用」（日历春季 0 主位图） */
    private tileCache: Map<string, ImageBitmap> = new Map();
    /** 日历夏季(1)瓦片位图缓存（夏草苍翠 / 地中海夏干焦黄 / 热带雨季返青 / 南半球冬雪与冬枯） */
    private summerTileCache: Map<string, ImageBitmap> = new Map();
    /** 日历秋季(2)瓦片位图缓存（温带与草原秋草金黄 / 南半球春芽嫩绿） */
    private autumnTileCache: Map<string, ImageBitmap> = new Map();
    /** 日历冬季(3)瓦片位图缓存（北半球冬雪冰封 / 无雪温带冬枯霜褐 / 地中海冬润返青 / 热带旱季枯黄 / 南半球盛夏） */
    private winterTileCache: Map<string, ImageBitmap> = new Map();
    /** 当前日历季节（0春 1夏 2秋 3冬）与向下一季过渡权重（0..1，季末最后 5 秒 smoothstep 插值） */
    private currentSeason: 0 | 1 | 2 | 3 = 1;
    private currentSeasonBlend: number = 0;
    private seasonTimer: number | null = null;
    private seasonRafId: number | null = null;
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
            keepBuffer: 4,
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
        const initState = this.computeSeasonState();
        this.currentSeason = initState.season;
        this.currentSeasonBlend = initState.blend;
        this.startSeasonBlendWatch();

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
        const { id, bitmap, summerBitmap, autumnBitmap, winterBitmap, error } = e.data;
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
            summerBitmap?.close();
            autumnBitmap?.close();
            winterBitmap?.close();
            return;
        }

        // 快速开关保护：旧 Worker 任务完成时如果 modeVersion 不匹配，直接丢弃位图避免串画
        if (task.modeVersion !== this.modeVersion) {
            bitmap?.close();
            summerBitmap?.close();
            autumnBitmap?.close();
            winterBitmap?.close();
            task.done(undefined, task.tile);
            return;
        }

        const { ctx, tile, done, cacheKey, coords, size, bounds, isExpTile, isValleyTile, retryCount } = task;

        if (!bitmap) {
            summerBitmap?.close();
            autumnBitmap?.close();
            winterBitmap?.close();
            // 取图/解码超时或偶发失败：保留「未探索灰雾」遮罩并在后台自动延时重试，绝不留刺眼蓝洞或死块
            if (error) console.warn('[Hillshade] tile delayed, keeping fog & scheduling retry:', error);
            if (retryCount < 10) {
                const nextRetry = retryCount + 1;
                const delayMs = Math.min(8000, 1200 * nextRetry);
                setTimeout(() => {
                    if (!tile.isConnected || task.modeVersion !== this.modeVersion) return;
                    this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, nextRetry);
                }, delayMs);
            }
            return;
        }

        this.commitQueue.push({
            kind: 'worker',
            task,
            bitmap,
            summerBitmap,
            autumnBitmap,
            winterBitmap,
            isCoarseFallback: e.data.isCoarseFallback,
        });
        this.scheduleCommitDrain();
    }

    private scheduleCommitDrain(): void {
        if (this.commitScheduled) return;
        this.commitScheduled = true;
        const run = () => {
            if (this.commitRafId !== null) {
                cancelAnimationFrame(this.commitRafId);
                this.commitRafId = null;
            }
            if (this.commitTimerId !== null) {
                window.clearTimeout(this.commitTimerId);
                this.commitTimerId = null;
            }
            this.drainCommitQueue();
        };
        this.commitRafId = requestAnimationFrame(run);
        // 后台标签页 rAF 暂停时由 setTimeout 兜底推进，避免切回前台时堆积突刺
        this.commitTimerId = window.setTimeout(run, 100);
    }

    private drainCommitQueue(): void {
        this.commitScheduled = false;
        if (this.commitQueue.length === 0) return;

        const frameStart = performance.now();
        const st = this.computeSeasonState();
        this.currentSeason = st.season;
        this.currentSeasonBlend = st.blend;

        while (this.commitQueue.length > 0) {
            const job = this.commitQueue.shift()!;
            this.executeCommitJob(job);
            if (performance.now() - frameStart >= TILE_COMMIT_BUDGET_MS) {
                break;
            }
        }

        if (this.commitQueue.length > 0) {
            this.scheduleCommitDrain();
        }
    }

    private executeCommitJob(job: TileCommitJob): void {
        if (job.kind === 'worker') {
            const { task, bitmap, summerBitmap, autumnBitmap, winterBitmap, isCoarseFallback } = job;
            if (task.modeVersion !== this.modeVersion) {
                bitmap.close();
                summerBitmap?.close();
                autumnBitmap?.close();
                winterBitmap?.close();
                task.done(undefined, task.tile);
                return;
            }
            const { ctx, tile, done, cacheKey, coords, size, bounds, isExpTile, isValleyTile, retryCount } = task;
            try {
                const _t0 = performance.now();
                if (isCoarseFallback) {
                    if (tile.isConnected) {
                        this.paintTileCanvas(ctx, size.x, size.y, bitmap, summerBitmap, autumnBitmap, winterBitmap);
                        this.attachTileBitmaps(tile, bitmap, summerBitmap, autumnBitmap, winterBitmap, true);
                    } else {
                        bitmap.close();
                        summerBitmap?.close();
                        autumnBitmap?.close();
                        winterBitmap?.close();
                    }
                    if (retryCount < 4) {
                        const nextRetry = retryCount + 1;
                        const delayMs = 2000 * nextRetry;
                        setTimeout(() => {
                            if (!tile.isConnected || task.modeVersion !== this.modeVersion) return;
                            this.dispatchTile(coords, size, bounds, ctx, tile, () => {}, cacheKey, isExpTile, isValleyTile, nextRetry);
                        }, delayMs);
                    }
                } else {
                    if (tile.isConnected) {
                        this.paintTileCanvas(ctx, size.x, size.y, bitmap, summerBitmap, autumnBitmap, winterBitmap);
                        this.attachTileBitmaps(tile, bitmap, summerBitmap, autumnBitmap, winterBitmap, false);
                    }
                    this.cachePut(cacheKey, bitmap, summerBitmap, autumnBitmap, winterBitmap);
                }
                perfDoctor.note('HillshadeLayer.handleWorkerMessage(山体瓦片上屏)', performance.now() - _t0, 'src/map/HillshadeLayer.ts:handleWorkerMessage');
            } catch (err) {
                console.warn('[Hillshade] 位图绘制失败:', err);
                bitmap.close();
                summerBitmap?.close();
                autumnBitmap?.close();
                winterBitmap?.close();
            }
            done(undefined, tile);
            return;
        }

        // job.kind === 'cache'
        const { coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, modeVersion } = job;
        if (modeVersion !== this.modeVersion || !tile.isConnected) {
            done(undefined, tile);
            return;
        }
        const fresh = this.cacheGet(cacheKey);
        if (!fresh) {
            this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, 0);
            return;
        }
        const freshSummer = this.summerTileCache.get(cacheKey);
        const freshAutumn = this.autumnTileCache.get(cacheKey);
        const freshWinter = this.winterTileCache.get(cacheKey);
        try {
            this.attachTileBitmaps(tile, fresh, freshSummer, freshAutumn, freshWinter, false);
            this.paintTileCanvas(ctx, size.x, size.y, fresh, freshSummer, freshAutumn, freshWinter);
        } catch (err) {
            console.warn('[Hillshade] 缓存位图绘制失败，改为重算:', err);
            this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, 0);
            return;
        }
        done(undefined, tile);
    }

    /** 将当前瓦片的四季位图挂载到 DOM 节点，确保粗高程过渡期或缓存淘汰边缘仍能 100% 同步换季 */
    private attachTileBitmaps(
        tile: HTMLCanvasElement,
        spring: ImageBitmap,
        summer?: ImageBitmap,
        autumn?: ImageBitmap,
        winter?: ImageBitmap,
        ownedByTile: boolean = false,
    ): void {
        const prev = (tile as any).__hsBmps as {
            spring?: ImageBitmap;
            summer?: ImageBitmap;
            autumn?: ImageBitmap;
            winter?: ImageBitmap;
            ownedByTile?: boolean;
        } | undefined;
        if (prev?.ownedByTile) {
            if (prev.spring && prev.spring !== spring) prev.spring.close();
            if (prev.summer && prev.summer !== summer) prev.summer.close();
            if (prev.autumn && prev.autumn !== autumn) prev.autumn.close();
            if (prev.winter && prev.winter !== winter) prev.winter.close();
        }
        (tile as any).__hsBmps = { spring, summer, autumn, winter, ownedByTile };
    }

    private releaseTileOwnedBitmaps(tile: HTMLCanvasElement | undefined): void {
        if (!tile) return;
        const prev = (tile as any).__hsBmps as {
            spring?: ImageBitmap;
            summer?: ImageBitmap;
            autumn?: ImageBitmap;
            winter?: ImageBitmap;
            ownedByTile?: boolean;
        } | undefined;
        if (prev?.ownedByTile) {
            prev.spring?.close();
            prev.summer?.close();
            prev.autumn?.close();
            prev.winter?.close();
        }
        delete (tile as any).__hsBmps;
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
        return `${z}/${x}/${y}:${isRelief ? 'relief_4season_v21' : 'std_4season_v12'}:${isValley ? 'valley_nile_v1' : 'v0'}${isRelief && this.terraceExp ? ':terrace7_v1' : ''}`;
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

    /** LRU 写：超上限则淘汰最久未用的一块并释放其显存（保护当前挂载在视口中的活跃瓦片不被淘汰） */
    private cachePut(
        key: string,
        bitmap: ImageBitmap,
        summerBitmap?: ImageBitmap,
        autumnBitmap?: ImageBitmap,
        winterBitmap?: ImageBitmap,
    ): void {
        const prev = this.tileCache.get(key);
        if (prev && prev !== bitmap) prev.close();
        this.tileCache.delete(key);
        this.tileCache.set(key, bitmap);

        const prevSummer = this.summerTileCache.get(key);
        if (prevSummer && prevSummer !== summerBitmap) prevSummer.close();
        this.summerTileCache.delete(key);
        if (summerBitmap) this.summerTileCache.set(key, summerBitmap);

        const prevAutumn = this.autumnTileCache.get(key);
        if (prevAutumn && prevAutumn !== autumnBitmap) prevAutumn.close();
        this.autumnTileCache.delete(key);
        if (autumnBitmap) this.autumnTileCache.set(key, autumnBitmap);

        const prevWinter = this.winterTileCache.get(key);
        if (prevWinter && prevWinter !== winterBitmap) prevWinter.close();
        this.winterTileCache.delete(key);
        if (winterBitmap) {
            this.winterTileCache.set(key, winterBitmap);
        }

        if (this.tileCache.size > TILE_CACHE_MAX) {
            const activeKeys = this.activeCacheKeysScratch;
            activeKeys.clear();
            const tilesObj = (this as any)._tiles as Record<string, { el?: HTMLElement }> | undefined;
            if (tilesObj) {
                for (const k in tilesObj) {
                    const el = tilesObj[k]?.el as any;
                    if (el?.isConnected && el.__hsCacheKey) activeKeys.add(el.__hsCacheKey);
                }
            }
            const targetSize = TILE_CACHE_MAX - 12;
            for (const candKey of this.tileCache.keys()) {
                if (this.tileCache.size <= targetSize) break;
                if (activeKeys.has(candKey)) continue;
                this.tileCache.get(candKey)?.close();
                this.tileCache.delete(candKey);
                this.summerTileCache.get(candKey)?.close();
                this.summerTileCache.delete(candKey);
                this.autumnTileCache.get(candKey)?.close();
                this.autumnTileCache.delete(candKey);
                this.winterTileCache.get(candKey)?.close();
                this.winterTileCache.delete(candKey);
            }
            activeKeys.clear();
        }
    }

    private clearCommitQueue(): void {
        if (this.commitRafId !== null) {
            cancelAnimationFrame(this.commitRafId);
            this.commitRafId = null;
        }
        if (this.commitTimerId !== null) {
            window.clearTimeout(this.commitTimerId);
            this.commitTimerId = null;
        }
        this.commitScheduled = false;
        for (const job of this.commitQueue) {
            if (job.kind === 'worker') {
                job.bitmap.close();
                job.summerBitmap?.close();
                job.autumnBitmap?.close();
                job.winterBitmap?.close();
                job.task.done(undefined, job.task.tile);
            } else {
                job.done(undefined, job.tile);
            }
        }
        this.commitQueue.length = 0;
    }

    /** 参数变了 → 旧位图全部作废 */
    private clearTileCache(): void {
        this.clearCommitQueue();
        const tilesObj = (this as any)._tiles as Record<string, { el?: HTMLElement }> | undefined;
        if (tilesObj) {
            for (const k in tilesObj) {
                this.releaseTileOwnedBitmaps(tilesObj[k]?.el as HTMLCanvasElement | undefined);
            }
        }
        for (const bmp of this.tileCache.values()) bmp.close();
        this.tileCache.clear();
        for (const bmp of this.summerTileCache.values()) bmp.close();
        this.summerTileCache.clear();
        for (const bmp of this.autumnTileCache.values()) bmp.close();
        this.autumnTileCache.clear();
        for (const bmp of this.winterTileCache.values()) bmp.close();
        this.winterTileCache.clear();
    }

    /**
     * 计算当前游戏季节（0春 1夏 2秋 3冬）与向下一季的过渡混合系数（0..1），
     * 与 VegetationLayer / CityLifeAmbientLayer 的 SEASON_BLEND_SECONDS = 5.0 100% 同步。
     */
    private computeSeasonState(): { season: 0 | 1 | 2 | 3; blend: number } {
        const ts = (window as any).game?.timeSystem;
        const rawSeason = ts?.getSeason?.();
        const season = (typeof rawSeason === 'number' ? (rawSeason & 3) : 1) as 0 | 1 | 2 | 3;
        const remain = ts?.getTimeToNextSeason?.();
        const BLEND_SEC = 5.0;
        if (typeof remain !== 'number' || remain >= BLEND_SEC) {
            return { season, blend: 0 };
        }
        const t = Math.min(1, Math.max(0, (BLEND_SEC - Math.max(0, remain)) / BLEND_SEC));
        return { season, blend: t * t * (3 - 2 * t) };
    }

    private pickSeasonBmp(
        season: 0 | 1 | 2 | 3,
        springBmp: ImageBitmap,
        summerBmp?: ImageBitmap,
        autumnBmp?: ImageBitmap,
        winterBmp?: ImageBitmap,
    ): ImageBitmap {
        if (season === 1) return summerBmp ?? springBmp;
        if (season === 2) return autumnBmp ?? summerBmp ?? springBmp;
        if (season === 3) return winterBmp ?? springBmp;
        return springBmp;
    }

    /** 将单张瓦片的四季位图按当前 currentSeason 与 currentSeasonBlend 合成到瓦片画布 */
    private paintTileCanvas(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        springBmp: ImageBitmap,
        summerBmp?: ImageBitmap,
        autumnBmp?: ImageBitmap,
        winterBmp?: ImageBitmap,
    ): void {
        ctx.clearRect(0, 0, width, height);
        const curSeason = this.currentSeason;
        const nextSeason = ((curSeason + 1) & 3) as 0 | 1 | 2 | 3;
        const curBmp = this.pickSeasonBmp(curSeason, springBmp, summerBmp, autumnBmp, winterBmp);
        const nextBmp = this.pickSeasonBmp(nextSeason, springBmp, summerBmp, autumnBmp, winterBmp);
        const blend = curBmp === nextBmp ? 0 : this.currentSeasonBlend;

        if (blend >= 0.999) {
            ctx.globalAlpha = 1;
            ctx.drawImage(nextBmp, 0, 0);
            return;
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(curBmp, 0, 0);
        if (blend > 0.001) {
            ctx.globalAlpha = blend;
            ctx.drawImage(nextBmp, 0, 0);
            ctx.globalAlpha = 1;
        }
    }

    /** 当季节或季节过渡系数变化时，仅重绘当前视口内拥有四季差异位图的活跃瓦片（零 Worker 重算，60FPS 丝滑换季） */
    private seasonPaintDeferred = false;
    private repaintVisibleSeasonTiles(): void {
        if (this._map?.getContainer()?.style?.visibility === 'hidden') {
            this.seasonPaintDeferred = true;
            return;
        }
        this.seasonPaintDeferred = false;
        const tilesObj = (this as any)._tiles as Record<string, { el?: HTMLElement }> | undefined;
        if (!tilesObj) return;
        for (const key in tilesObj) {
            const tile = tilesObj[key]?.el as HTMLCanvasElement | undefined;
            if (!tile || !tile.isConnected) continue;
            const cacheKey = (tile as any).__hsCacheKey as string | undefined;
            const attached = (tile as any).__hsBmps as {
                spring?: ImageBitmap;
                summer?: ImageBitmap;
                autumn?: ImageBitmap;
                winter?: ImageBitmap;
            } | undefined;
            const springBmp = (cacheKey ? this.tileCache.get(cacheKey) : undefined) ?? attached?.spring;
            if (!springBmp) continue;
            const summerBmp = (cacheKey ? this.summerTileCache.get(cacheKey) : undefined) ?? attached?.summer;
            const autumnBmp = (cacheKey ? this.autumnTileCache.get(cacheKey) : undefined) ?? attached?.autumn;
            const winterBmp = (cacheKey ? this.winterTileCache.get(cacheKey) : undefined) ?? attached?.winter;
            if (!summerBmp && !autumnBmp && !winterBmp) continue;
            const ctx = tile.getContext('2d');
            if (!ctx) continue;
            this.paintTileCanvas(ctx, tile.width, tile.height, springBmp, summerBmp, autumnBmp, winterBmp);
        }
    }

    private startSeasonBlendWatch(): void {
        if (this.seasonTimer !== null || this.seasonRafId !== null) return;
        let isRafActive = false;

        const syncBlend = () => {
            if (this.seasonPaintDeferred && this._map?.getContainer()?.style?.visibility !== 'hidden') {
                const st = this.computeSeasonState();
                this.currentSeason = st.season;
                this.currentSeasonBlend = st.blend;
                this.repaintVisibleSeasonTiles();
                return st.blend;
            }
            const st = this.computeSeasonState();
            if (st.season !== this.currentSeason || Math.abs(st.blend - this.currentSeasonBlend) > 0.002) {
                this.currentSeason = st.season;
                this.currentSeasonBlend = st.blend;
                this.repaintVisibleSeasonTiles();
            }
            return st.blend;
        };

        const rafLoop = () => {
            if (this._map?.getContainer()?.style?.visibility === 'hidden') {
                this.seasonPaintDeferred = true;
                isRafActive = false;
                this.seasonRafId = null;
                return;
            }
            const b = syncBlend();
            if (b > 0.001 && b < 0.999) {
                this.seasonRafId = requestAnimationFrame(rafLoop);
            } else {
                isRafActive = false;
                this.seasonRafId = null;
            }
        };

        this.seasonTimer = window.setInterval(() => {
            const b = syncBlend();
            if (b > 0.001 && b < 0.999 && !isRafActive && this._map?.getContainer()?.style?.visibility !== 'hidden') {
                isRafActive = true;
                this.seasonRafId = requestAnimationFrame(rafLoop);
            }
        }, 180);
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
        const bounds = tileBoundsFromCoords(coords.z, coords.x, coords.y);
        const isExpTile = this.isReliefTile(coords.z);
        const isValleyTile = this.isValleyTile(coords.z, bounds);
        const cacheKey = this.tileCacheKey(coords.z, coords.x, coords.y, isExpTile, isValleyTile);
        (tile as any).__hsCacheKey = cacheKey;

        // ── 缓存命中：来回切 zoom 或沿途往返时的常见路径，无网络、无 Worker、无像素回读 ──
        // 统一排入 2.0ms 帧预算队列分帧上屏，避免玩家跨越 256px 瓦片边界时 6~12 块缓存瓦片在同一帧微任务内扎堆 drawImage + DOM 挂载导致主线程卡顿
        const cached = this.cacheGet(cacheKey);
        if (cached) {
            this.statCacheHits++;
            this.commitQueue.push({
                kind: 'cache',
                coords,
                size,
                bounds,
                ctx,
                tile,
                done,
                cacheKey,
                isExpTile,
                isValleyTile,
                modeVersion: this.modeVersion,
            });
            this.scheduleCommitDrain();
            return tile;
        }

        // 未命中缓存（需网络请求 + Worker 计算）：先铺上无缝「未探索灰雾」遮罩，算完后自动拨雾显现地形
        this.dispatchTile(coords, size, bounds, ctx, tile, done, cacheKey, isExpTile, isValleyTile, 0);
        return tile;
    }

    protected _removeTile(key: string): void {
        const tile = (this as any)._tiles?.[key]?.el as HTMLCanvasElement | undefined;
        this.releaseTileOwnedBitmaps(tile);
        (L.GridLayer.prototype as any)._removeTile?.call(this, key);
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
            // 🔴 [2026-11-16 海战 zoom 15 试验] ESRI 晕渲底图最细只到 zoom 13：更高缩放借 zoom 13 父瓦片的对应一块放大用，
            //    否则 zoom 14/15 拿不到掩膜，海拔高于海面的江河湖泊会被画成陆地。zoom ≤ 13 与原来完全一样。
            waterMaskUrl: ESRI_SHADED_RELIEF_URL
                .replace('{z}', String(Math.min(coords.z, ESRI_MASK_MAX_Z)))
                .replace('{y}', String(coords.z > ESRI_MASK_MAX_Z ? coords.y >> (coords.z - ESRI_MASK_MAX_Z) : coords.y))
                .replace('{x}', String(coords.z > ESRI_MASK_MAX_Z ? coords.x >> (coords.z - ESRI_MASK_MAX_Z) : coords.x)),
            waterMaskSub: coords.z > ESRI_MASK_MAX_Z ? (() => {
                const d = coords.z - ESRI_MASK_MAX_Z;
                const sub = 256 >> d;
                return { sx: (coords.x - ((coords.x >> d) << d)) * sub, sy: (coords.y - ((coords.y >> d) << d)) * sub, size: sub };
            })() : undefined,
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

    onAdd(map: L.Map): this {
        const st = this.computeSeasonState();
        this.currentSeason = st.season;
        this.currentSeasonBlend = st.blend;
        this.startSeasonBlendWatch();
        return super.onAdd(map);
    }

    // Cleanup if layer removed
    onRemove(map: L.Map): this {
        if (this.seasonTimer !== null) {
            window.clearInterval(this.seasonTimer);
            this.seasonTimer = null;
        }
        if (this.seasonRafId !== null) {
            cancelAnimationFrame(this.seasonRafId);
            this.seasonRafId = null;
        }
        for (const w of this.workers) w.terminate();
        this.materialBytesByWorker.clear();
        this.workers.length = 0;
        this.pendingTiles.clear();
        this.clearTileCache();
        return super.onRemove(map);
    }
}
