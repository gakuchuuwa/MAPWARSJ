import * as L from 'leaflet';
import HillshadeWorker from '../workers/HillshadeWorker?worker'; // Vite Worker Import
import { HillshadeRequest, HillshadeResponse, HillshadeRegion } from '../workers/HillshadeWorker';
import { HISTORICAL_REGIONS } from '../data/HistoricalRegions';
import { gameLog } from '../utils/GameLogger';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';

// 转换 HistoricalRegion 为 Worker 友好结构(扁平化, 默认值)
const REGIONS_FOR_WORKER: HillshadeRegion[] = HISTORICAL_REGIONS.map(r => ({
    center: r.center,
    radii: r.radii,
    color: r.color,
    blendStrength: r.blendStrength,
    elevMin: r.elevMin ?? -1000,
    elevMax: r.elevMax ?? 9000
}));

// [FALLBACK] 高程瓦片加载失败时的兜底平涂色（古图纸色，与 tilePane 的 sepia 滤镜协调）
const FALLBACK_TILE_COLOR = '#C4BA9E';

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
}

export class HillshadeLayer extends L.GridLayer {
    private zFactor: number;
    private shadowOpacity: number;
    private useElevationColor: boolean;

    private worker: Worker;
    private msgIdCounter: number = 0;
    private pendingTiles: Map<number, {
        ctx: CanvasRenderingContext2D,
        tile: HTMLElement,
        done: L.DoneCallback,
        /** 超时重投用：仅重投一次，画布上此时仍是原始高程像素 */
        retried: boolean,
        request: Omit<HillshadeRequest, 'data'>,
    }> = new Map();
    /** reqId → 看门狗定时器；Worker 回包丢失时兜底放行 */
    private tileWatchdogs: Map<number, number> = new Map();

    /** Worker 上色超时（毫秒）：超时先重投一次，再超时则平涂放行 */
    private static readonly WORKER_TIMEOUT_MS = 8000;
    /** 高程瓦片下载超时（毫秒）：onload/onerror 都可能永不触发，须自行兜底 */
    private static readonly DEM_FETCH_TIMEOUT_MS = 20000;

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

        // Initialize Worker
        this.worker = new HillshadeWorker();
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        // [FIX 2026-07-19] Worker 崩溃/消息损坏时必须把挂起瓦片收尾，
        // 否则 done() 永不调用 → Leaflet 判定"仍在加载" → 永久保留低缩放级父瓦片
        // （症状：整块 zoom6 瓦片被放大 16 倍糊在海面上，刷新也不消失）
        this.worker.onerror = (e) => {
            this.flushPendingWithFallback(`Worker 异常(${e.message || '未知'})`);
        };
        this.worker.onmessageerror = () => {
            this.flushPendingWithFallback('Worker 消息反序列化失败');
        };

        gameLog('startup', `HillshadeLayer: Initialized with Web Worker (z=${this.zFactor})`);
    }

    /** 清除某块瓦片的看门狗（成功回包或已收尾时调用） */
    private clearWatchdog(reqId: number): void {
        const t = this.tileWatchdogs.get(reqId);
        if (t !== undefined) {
            clearTimeout(t);
            this.tileWatchdogs.delete(reqId);
        }
    }

    /** 兜底收尾：平涂古图纸色并 done()，让 Leaflet 释放父瓦片（下次平移/缩放会重新请求） */
    private finishWithFallback(reqId: number, reason: string): void {
        const task = this.pendingTiles.get(reqId);
        if (!task) return;
        this.pendingTiles.delete(reqId);
        this.clearWatchdog(reqId);
        const size = this.getTileSize();
        task.ctx.fillStyle = FALLBACK_TILE_COLOR;
        task.ctx.fillRect(0, 0, size.x, size.y);
        console.warn(`[Hillshade] ${reason} → 该瓦片平涂兜底放行`);
        task.done(undefined, task.tile);
    }

    private flushPendingWithFallback(reason: string): void {
        for (const id of [...this.pendingTiles.keys()]) this.finishWithFallback(id, reason);
    }

    /** Worker 超时：首次重投（画布仍存原始高程像素），再超时则兜底放行 */
    private onWorkerTimeout(reqId: number): void {
        const task = this.pendingTiles.get(reqId);
        if (!task) return;
        this.tileWatchdogs.delete(reqId);

        if (!task.retried) {
            task.retried = true;
            try {
                const size = this.getTileSize();
                const imgData = task.ctx.getImageData(0, 0, size.x, size.y);
                this.worker.postMessage(
                    { ...task.request, data: imgData.data } as HillshadeRequest,
                    [imgData.data.buffer],
                );
                this.armWatchdog(reqId);
                return;
            } catch {
                /* 像素读取失败 → 落到兜底 */
            }
        }
        this.finishWithFallback(reqId, 'Worker 上色超时');
    }

    private armWatchdog(reqId: number): void {
        this.tileWatchdogs.set(
            reqId,
            window.setTimeout(() => this.onWorkerTimeout(reqId), HillshadeLayer.WORKER_TIMEOUT_MS),
        );
    }

    private handleWorkerMessage(e: MessageEvent<HillshadeResponse>) {
        const { id, data } = e.data;
        const task = this.pendingTiles.get(id);

        if (task) {
            this.clearWatchdog(id);
            const { ctx, tile, done } = task;
            // Create ImageData from buffer
            // [FIX] Ensure it is treated as Uint8ClampedArray for TS compatibility
            const validData = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data);
            const imgData = new ImageData(validData as any, 256, 256); // Assuming standard tile size
            ctx.putImageData(imgData, 0, 0);

            // Mark Leaflet tile as done
            done(undefined, tile);
            this.pendingTiles.delete(id);
        }
    }

    public setParams(params: { zFactor?: number; shadowOpacity?: number; altitude?: number; useElevationColor?: boolean }) {
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

        if (changed) {
            // Cancel pending? Not strictly necessary, just redraw.
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

        const img = new Image();
        img.crossOrigin = "Anonymous";
        // Use high-res tiles if zoom is high?
        // Standard endpoint:
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${coords.z}/${coords.x}/${coords.y}.png`;

        // [FIX 2026-07-19] 下载挂死兜底：连接被吊住时 onload/onerror 都可能永不触发，
        // 那样 done() 就永远不会调用，Leaflet 会一直拿父瓦片顶着（放大糊一块）
        let settled = false;
        const fetchTimer = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            img.src = '';   // 中断请求
            ctx.fillStyle = FALLBACK_TILE_COLOR;
            ctx.fillRect(0, 0, size.x, size.y);
            console.warn(`[Hillshade] 高程瓦片下载超时 z${coords.z}/${coords.x}/${coords.y} → 平涂兜底放行`);
            done(undefined, tile);
        }, HillshadeLayer.DEM_FETCH_TIMEOUT_MS);

        img.src = url;

        img.onload = () => {
            if (settled) return;
            settled = true;
            clearTimeout(fetchTimer);
            // [诊断 2026-07-17] 量化每块山体瓦片占用主线程的时长（drawImage+getImageData 有 GPU 同步风险）
            const tTileMain = performance.now();
            // Draw image to canvas to get pixel data
            ctx.drawImage(img, 0, 0);
            // Verify context read
            try {
                const imgData = ctx.getImageData(0, 0, size.x, size.y);

                // Prepare Worker Request
                const reqId = this.msgIdCounter++;
                const bounds = tileBoundsFromCoords(coords.z, coords.x, coords.y);
                // 仅传与当前瓦片相交的区域,减少 Worker 内逐像素检查的循环次数
                const relevantRegions = REGIONS_FOR_WORKER.filter(r => {
                    const latMin = r.center[0] - r.radii[0];
                    const latMax = r.center[0] + r.radii[0];
                    const lngMin = r.center[1] - r.radii[1];
                    const lngMax = r.center[1] + r.radii[1];
                    return !(latMax < bounds.south || latMin > bounds.north ||
                             lngMax < bounds.west || lngMin > bounds.east);
                });
                const request: HillshadeRequest = {
                    id: reqId,
                    width: size.x,
                    height: size.y,
                    data: imgData.data, // Uint8ClampedArray transfers efficiently
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

                // Store callback info（request 去掉 data 留作超时重投用）
                const { data: _omit, ...reqNoData } = request;
                this.pendingTiles.set(reqId, { ctx, tile, done, retried: false, request: reqNoData });
                this.armWatchdog(reqId);

                // [PERF] Zero-Copy Transfer: Move buffer ownership to Worker
                const buffer = imgData.data.buffer;
                this.worker.postMessage(request, [buffer]);
                PerformanceMonitor.getInstance().noteAsyncWork('hillshadeTileMain', performance.now() - tTileMain);

            } catch (err) {
                console.error('Hillshade read error (cors?):', err);
                // [FALLBACK] 像素读取失败同样平涂兜底，不留透明"秃斑"
                ctx.fillStyle = FALLBACK_TILE_COLOR;
                ctx.fillRect(0, 0, size.x, size.y);
                done(undefined, tile);
            }
        };

        // [FALLBACK] 高程瓦片加载失败(断网/被墙/超时)：平涂古图纸色兜底，
        // 让 Leaflet 正常收下这块瓦片，杜绝山体消失露出底图空白
        img.onerror = () => {
            if (settled) return;
            settled = true;
            clearTimeout(fetchTimer);
            ctx.fillStyle = FALLBACK_TILE_COLOR;
            ctx.fillRect(0, 0, size.x, size.y);
            done(undefined, tile);
        };

        return tile;
    }

    // Cleanup if layer removed
    onRemove(map: L.Map): this {
        // We could terminate worker, but if layer is re-added, we'd need to re-init.
        // For now keep it alive or minimal cleanup.
        return super.onRemove(map);
    }
}
