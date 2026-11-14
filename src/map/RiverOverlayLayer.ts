import L from 'leaflet';
import { gameLog } from '../utils/GameLogger';

/**
 * RiverOverlayLayer - 基于 Canvas 的河流滤镜图层
 * 同时加载 ESRI 和本地 Google Terrain 瓦片，提取蓝色水域并叠加
 * 
 * [OPTIMIZED] 使用 Web Worker 进行像素处理，避免阻塞主线程。
 */

// Worker Interface
interface RiverWorkerResponse {
    id: number;
    data: Uint8ClampedArray;
    waves?: Float32Array | null;
    ripples?: Float32Array | null;
    cacheKey?: string;
}

interface WaterTileCacheEntry {
    imgData: ImageData;
    waves: Float32Array | null;
    ripples: Float32Array | null;
}

const WATER_TILE_CACHE_MAX = 360;

export class RiverOverlayLayer extends L.GridLayer {
    private esriUrl: string;

    private worker: Worker;
    private msgIdCounter: number = 0;
    private pendingTiles: Map<number, { ctx: CanvasRenderingContext2D, tile: HTMLElement, done: L.DoneCallback, completed: boolean, cacheKey: string }> = new Map();
    private prewarmTasks: Map<number, string> = new Map();
    private prewarmInFlight: Set<string> = new Set();
    /** LRU 缓存已算好的水面瓦片像素与浪花点，平移/缩放回看瞬时上屏 */
    private tileCache: Map<string, WaterTileCacheEntry> = new Map();
    /** 瓦片 putImageData 逐帧预算队列：跟拍跨越瓦片边界时 6~12 块瓦片同时到达，分摊到每帧 ≤2.5ms 避免单帧卡顿 */
    private commitQueue: Array<() => void> = [];
    private commitRaf = 0;

    private enqueueTileCommit(fn: () => void): void {
        this.commitQueue.push(fn);
        if (!this.commitRaf) {
            this.commitRaf = requestAnimationFrame(() => this.drainCommitQueue());
        }
    }

    private drainCommitQueue(): void {
        this.commitRaf = 0;
        const deadline = performance.now() + 2.5;
        while (this.commitQueue.length > 0) {
            this.commitQueue.shift()!();
            if (performance.now() >= deadline) break;
        }
        if (this.commitQueue.length > 0) {
            this.commitRaf = requestAnimationFrame(() => this.drainCommitQueue());
        }
    }

    constructor(options?: L.GridLayerOptions) {
        super({
            tileSize: 256,
            // 🔴 [2026-09-18] 与底图同口径：跟拍平移时 50ms 补一次瓦片，别让边缘留空（默认 200ms）
            updateInterval: 50,
            pane: 'riverPane',
            zIndex: 340, // 位于领土/道路(350)之下
            // DE texture supplies water detail; hide discontinuous DEM colors below.
            opacity: 1.0,
            ...options
        });

        // Initialize Worker
        this.worker = new Worker(new URL('../workers/RiverWorker.ts', import.meta.url), { type: 'module' });

        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.on('tileunload', (event: L.TileEvent) => {
            for (const [id, task] of this.pendingTiles) {
                if (task.tile !== event.tile) continue;
                this.pendingTiles.delete(id);
                this.worker.postMessage({ removeId: id });
            }
        });
        gameLog('startup', '💧 [RiverOverlayLayer] Web Worker Initialized.');

        // ESRI World Shaded Relief URL (256px tiles)——buildTileUrl 只用这一个源
        this.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
    }

    private cachePut(key: string, entry: WaterTileCacheEntry): void {
        this.tileCache.delete(key);
        this.tileCache.set(key, entry);
        if (this.tileCache.size <= WATER_TILE_CACHE_MAX) return;
        const activeKeys = new Set<string>();
        const tilesObj = (this as any)._tiles as Record<string, { coords?: L.Coords; el?: HTMLElement }> | undefined;
        if (tilesObj) {
            for (const k in tilesObj) {
                const c = tilesObj[k]?.coords;
                if (tilesObj[k]?.el?.isConnected && c) activeKeys.add(`${c.z}/${c.x}/${c.y}`);
            }
        }
        for (const candKey of this.tileCache.keys()) {
            if (this.tileCache.size <= WATER_TILE_CACHE_MAX) break;
            if (activeKeys.has(candKey)) continue;
            this.tileCache.delete(candKey);
        }
    }

    private handleWorkerMessage(e: MessageEvent<RiverWorkerResponse>) {
        const { id, data, waves, ripples, cacheKey: respCacheKey } = e.data;
        const prewarmKey = this.prewarmTasks.get(id);
        if (prewarmKey !== undefined) {
            this.prewarmTasks.delete(id);
            this.prewarmInFlight.delete(prewarmKey);
            const activeWaves = waves && waves.length > 0 ? waves : null;
            const activeRipples = ripples && ripples.length > 0 ? ripples : null;
            const imgData = new ImageData(data as any, 256, 256);
            this.cachePut(prewarmKey, { imgData, waves: activeWaves, ripples: activeRipples });
            return;
        }
        const task = this.pendingTiles.get(id);

        if (!task) {
            if (respCacheKey && this.tileCache.has(respCacheKey)) {
                // 瓦片已滑出视口卸载，但邻块补齐后重绘出了完整边缘：同步刷新缓存，防止回看时复现硬边
                const activeWaves = waves && waves.length > 0 ? waves : null;
                const activeRipples = ripples && ripples.length > 0 ? ripples : null;
                const imgData = new ImageData(data as any, 256, 256);
                this.cachePut(respCacheKey, { imgData, waves: activeWaves, ripples: activeRipples });
            }
            return;
        }
        if (task) {
            const { ctx, tile, done, cacheKey } = task;
            const activeWaves = waves && waves.length > 0 ? waves : null;
            const activeRipples = ripples && ripples.length > 0 ? ripples : null;
            (tile as any)._coastalWaves = activeWaves;
            (tile as any)._seaRipples = activeRipples;

            // Create ImageData
            // [FIX] Cast to any to avoid strict "ArrayBufferLike vs ArrayBuffer" TS error
            const imgData = new ImageData(data as any, 256, 256);
            this.cachePut(cacheKey, { imgData, waves: activeWaves, ripples: activeRipples });
            this.enqueueTileCommit(() => {
                if (!this.pendingTiles.has(id)) return;
                ctx.putImageData(imgData, 0, 0);
                if (!task.completed) {
                    task.completed = true;
                    done(undefined, tile);
                }
            });
        }
    }

    /** 获取当前加载到 DOM 中、带海岸浪潮或开阔水面细纹的瓦片。 */
    public getActiveWaveTiles(): Array<{
        tile: HTMLElement;
        waves: Float32Array | null;
        ripples: Float32Array | null;
        coords: L.Coords;
    }> {
        const res: Array<{
            tile: HTMLElement;
            waves: Float32Array | null;
            ripples: Float32Array | null;
            coords: L.Coords;
        }> = [];
        const tiles = (this as any)._tiles;
        if (!tiles) return res;
        for (const key in tiles) {
            const el = tiles[key]?.el as any;
            const waves = el?._coastalWaves as Float32Array | null | undefined;
            const ripples = el?._seaRipples as Float32Array | null | undefined;
            if (el && ((waves && waves.length > 0) || (ripples && ripples.length > 0))) {
                res.push({ tile: el, waves: waves ?? null, ripples: ripples ?? null, coords: tiles[key].coords });
            }
        }
        return res;
    }

    // [OPTIMIZATION] Shared Canvas for image data extraction
    private static sharedCanvas: HTMLCanvasElement | null = null;
    private static sharedCtx: CanvasRenderingContext2D | null = null;

    /**
     * ESRI 缓存缺陷瓦片的纯色灰。
     * 实测 2026-07-19：World_Shaded_Relief 在**仅 zoom 10** 的 z6 瓦片 (57,23) 范围
     * （北海道及其东侧海面，z10 的 x=912~927 / y=368~383）整块返回 rgb(51,52,54)，
     * 陆地海面一律如此；同一地点 z9=13431B、z11=7192B 均为完整地形，故非数据缺失，
     * 而是该级瓦片缓存没烤出来。灰色不满足水域判定（需蓝色占优）→ 不涂色 → 露出海底浮雕。
     */
    private static readonly DEFECT_GRAY: readonly [number, number, number] = [51, 52, 54];
    private static readonly DEFECT_TOLERANCE = 6;

    private buildTileUrl(z: number, x: number, y: number): string {
        return this.esriUrl
            .replace('{z}', z.toString())
            .replace('{y}', y.toString())
            .replace('{x}', x.toString());
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`ESRI tile load failed: ${url}`));
            img.src = url;
        });
    }

    /**
     * 是否整块都是缺陷灰。抽 8×8 网格，任一点不符即否——
     * 正常晕渲图必有纹理，不可能整块同一个精确灰值，故误判概率极低。
     */
    private isDefectGrayTile(img: CanvasImageSource, w: number, h: number): boolean {
        if (!RiverOverlayLayer.sharedCanvas) {
            RiverOverlayLayer.sharedCanvas = document.createElement('canvas');
            RiverOverlayLayer.sharedCanvas.width = w;
            RiverOverlayLayer.sharedCanvas.height = h;
            RiverOverlayLayer.sharedCtx = RiverOverlayLayer.sharedCanvas.getContext('2d', { willReadFrequently: true });
        }
        const g = RiverOverlayLayer.sharedCtx;
        if (!g) return false;
        g.drawImage(img as CanvasImageSource, 0, 0);
        let d: Uint8ClampedArray;
        try {
            d = g.getImageData(0, 0, w, h).data;
        } catch {
            return false; // 跨域污染等读不到像素时，按"正常"处理，不改变原行为
        }
        const [gr, gg, gb] = RiverOverlayLayer.DEFECT_GRAY;
        const tol = RiverOverlayLayer.DEFECT_TOLERANCE;
        for (let sy = 0; sy < 8; sy++) {
            for (let sx = 0; sx < 8; sx++) {
                const px = Math.min(w - 1, Math.floor((sx + 0.5) * w / 8));
                const py = Math.min(h - 1, Math.floor((sy + 0.5) * h / 8));
                const i = (py * w + px) * 4;
                if (Math.abs(d[i] - gr) > tol ||
                    Math.abs(d[i + 1] - gg) > tol ||
                    Math.abs(d[i + 2] - gb) > tol) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 缺陷瓦片替补：取上一级父瓦片的对应象限放大到整块。
     * 父级完好（实测 z9/z11 均正常），因此拿到的是真实地形内容而非猜色填充；
     * 一块父瓦片被 4 块子瓦片共用，浏览器 HTTP 缓存下额外请求很少。
     */
    private async buildParentSubstitute(
        coords: L.Coords,
        w: number,
        h: number,
    ): Promise<HTMLCanvasElement | null> {
        if (coords.z < 1) return null;
        const parent = await this.loadImage(
            this.buildTileUrl(coords.z - 1, coords.x >> 1, coords.y >> 1),
        );
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d');
        if (!g) return null;
        g.imageSmoothingEnabled = true;
        // 本瓦片位于父瓦片的哪个象限
        const sx = (coords.x & 1) * (w / 2);
        const sy = (coords.y & 1) * (h / 2);
        g.drawImage(parent, sx, sy, w / 2, h / 2, 0, 0, w, h);
        return c;
    }

    /**
     * 创建瓦片
     */
    protected createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
        const tile = L.DomUtil.create('canvas', 'leaflet-tile') as HTMLCanvasElement;
        const size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;
        tile.style.pointerEvents = 'none';

        const ctx = tile.getContext('2d');
        if (!ctx) {
            done(undefined, tile);
            return tile;
        }

        const cacheKey = `${coords.z}/${coords.x}/${coords.y}`;
        const cached = this.tileCache.get(cacheKey);
        if (cached) {
            this.tileCache.delete(cacheKey);
            this.tileCache.set(cacheKey, cached);
            (tile as any)._coastalWaves = cached.waves;
            (tile as any)._seaRipples = cached.ripples;
            const reqId = this.msgIdCounter++;
            this.pendingTiles.set(reqId, { ctx, tile, done, completed: true, cacheKey });
            this.worker.postMessage({ rebindId: reqId, x: coords.x, y: coords.y, z: coords.z });
            this.enqueueTileCommit(() => {
                if (!this.pendingTiles.has(reqId)) return;
                ctx.putImageData(cached.imgData, 0, 0);
                done(undefined, tile);
            });
            return tile;
        }

        // 构造 ESRI 瓦片 URL
        const esriTileUrl = this.esriUrl
            .replace('{z}', coords.z.toString())
            .replace('{y}', coords.y.toString())
            .replace('{x}', coords.x.toString());

        // 加载图片
        const esriImg = new Image();
        let unloaded = false;
        const onUnload = (event: L.TileEvent) => {
            if ((event.tile as HTMLElement) === tile) {
                unloaded = true;
                esriImg.src = '';
                this.off('tileunload', onUnload);
            }
        };
        this.on('tileunload', onUnload);
        esriImg.crossOrigin = 'Anonymous';

        esriImg.onload = async () => {
            try {
                let source: CanvasImageSource = esriImg;

                // 仅在已知 ESRI z10 缺陷区块（北海道及东侧海面 x=912~927, y=368~383）才回读像素检测，避免主线程每块瓦片同步 getImageData
                const mayBeDefect = coords.z === 10 && coords.x >= 912 && coords.x <= 927 && coords.y >= 368 && coords.y <= 383;
                if (mayBeDefect && this.isDefectGrayTile(esriImg, size.x, size.y)) {
                    const substitute = await this.buildParentSubstitute(coords, size.x, size.y)
                        .catch(() => null);
                    if (substitute) source = substitute;
                }

                // [OPTIMIZATION] Use createImageBitmap to avoid main thread canvas read
                const bitmap = await createImageBitmap(source as ImageBitmapSource);
                if (unloaded) { bitmap.close(); return; }
                this.off('tileunload', onUnload);
                const reqId = this.msgIdCounter++;

                // Store callback info
                this.pendingTiles.set(reqId, { ctx, tile, done, completed: false, cacheKey });

                // Send to worker with bitmap transfer
                this.worker.postMessage({
                    id: reqId,
                    width: size.x,
                    height: size.y,
                    x: coords.x, y: coords.y, z: coords.z,
                    bitmap: bitmap // Pass bitmap instead of raw data
                }, [bitmap]); // Transfer ownership

            } catch (err) {
                this.off('tileunload', onUnload);
                console.error('River bitmap creation failed:', err);
                if (!cached) done(undefined, tile);
            }
        };

        esriImg.onerror = () => {
            this.off('tileunload', onUnload);
            if (!cached) done(undefined, tile);
        };

        esriImg.src = esriTileUrl;

        return tile;
    }

    public prewarmTileRect(z: number, xMin: number, xMax: number, yMin: number, yMax: number): void {
        const n = 1 << z;
        const size = this.getTileSize();
        const cyMin = Math.max(0, yMin);
        const cyMax = Math.min(n - 1, yMax);
        for (let y = cyMin; y <= cyMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
                const wx = ((x % n) + n) % n;
                const cacheKey = `${z}/${wx}/${y}`;
                const hit = this.tileCache.get(cacheKey);
                if (hit) {
                    this.tileCache.delete(cacheKey);
                    this.tileCache.set(cacheKey, hit);
                    continue;
                }
                if (this.prewarmInFlight.has(cacheKey)) continue;
                this.prewarmInFlight.add(cacheKey);

                const url = this.buildTileUrl(z, wx, y);
                this.loadImage(url)
                    .then(async (esriImg) => {
                        let source: CanvasImageSource = esriImg;
                        const mayBeDefect = z === 10 && wx >= 912 && wx <= 927 && y >= 368 && y <= 383;
                        if (mayBeDefect && this.isDefectGrayTile(esriImg, size.x, size.y)) {
                            const substitute = await this.buildParentSubstitute({ x: wx, y, z } as L.Coords, size.x, size.y).catch(() => null);
                            if (substitute) source = substitute;
                        }
                        const bitmap = await createImageBitmap(source as ImageBitmapSource);
                        const reqId = this.msgIdCounter++;
                        this.prewarmTasks.set(reqId, cacheKey);
                        this.worker.postMessage(
                            { id: reqId, width: size.x, height: size.y, x: wx, y, z, bitmap },
                            [bitmap],
                        );
                    })
                    .catch(() => {
                        this.prewarmInFlight.delete(cacheKey);
                    });
            }
        }
    }

    public isPrewarmSettled(): boolean {
        return this.prewarmInFlight.size === 0;
    }

    public isViewportSettled(): boolean {
        if (this.commitQueue.length > 0) return false;
        const tilesObj = (this as any)._tiles as Record<string, { current?: boolean; loaded?: unknown }> | undefined;
        if (!tilesObj) return true;
        for (const k in tilesObj) {
            const t = tilesObj[k];
            if (t?.current && !t.loaded) return false;
        }
        return true;
    }

    public addTo(map: L.Map): this {
        // @ts-ignore
        if (!map.getPane(this.options.pane)) {
            // @ts-ignore
            map.createPane(this.options.pane);
            // @ts-ignore
            map.getPane(this.options.pane).style.zIndex = this.options.zIndex;
        }
        return super.addTo(map);
    }

    public onRemove(map: L.Map): this {
        // Optional: terminate worker to save memory if layer is destroyed
        // this.worker.terminate();
        return super.onRemove(map);
    }
}
