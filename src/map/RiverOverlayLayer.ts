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
}

export class RiverOverlayLayer extends L.GridLayer {
    private esriUrl: string;

    private worker: Worker;
    private msgIdCounter: number = 0;
    private pendingTiles: Map<number, { ctx: CanvasRenderingContext2D, tile: HTMLElement, done: L.DoneCallback }> = new Map();

    constructor(options?: L.GridLayerOptions) {
        super({
            tileSize: 256,
            pane: 'riverPane',
            zIndex: 340, // 位于领土/道路(350)之下
            opacity: 0.8,
            ...options
        });

        // Initialize Worker
        this.worker = new Worker(new URL('../workers/RiverWorker.ts', import.meta.url), { type: 'module' });

        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        gameLog('startup', '💧 [RiverOverlayLayer] Web Worker Initialized.');

        // ESRI World Shaded Relief URL (256px tiles)——buildTileUrl 只用这一个源
        this.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
    }

    private handleWorkerMessage(e: MessageEvent<RiverWorkerResponse>) {
        const { id, data } = e.data;
        const task = this.pendingTiles.get(id);

        if (task) {
            const { ctx, tile, done } = task;

            // Create ImageData
            // [FIX] Cast to any to avoid strict "ArrayBufferLike vs ArrayBuffer" TS error
            const imgData = new ImageData(data as any, 256, 256);
            ctx.putImageData(imgData, 0, 0);

            // Mark done
            done(undefined, tile);
            this.pendingTiles.delete(id);
        }
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
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d', { willReadFrequently: true });
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

        // 构造 ESRI 瓦片 URL
        const esriTileUrl = this.esriUrl
            .replace('{z}', coords.z.toString())
            .replace('{y}', coords.y.toString())
            .replace('{x}', coords.x.toString());

        // 加载图片
        const esriImg = new Image();
        esriImg.crossOrigin = 'Anonymous';

        esriImg.onload = async () => {
            try {
                let source: CanvasImageSource = esriImg;

                // ESRI 该级瓦片缓存烤坏（整块纯灰）→ 换父瓦片对应象限，取真实内容
                if (this.isDefectGrayTile(esriImg, size.x, size.y)) {
                    const substitute = await this.buildParentSubstitute(coords, size.x, size.y)
                        .catch(() => null);
                    if (substitute) source = substitute;
                }

                // [OPTIMIZATION] Use createImageBitmap to avoid main thread canvas read
                const bitmap = await createImageBitmap(source as ImageBitmapSource);
                const reqId = this.msgIdCounter++;

                // Store callback info
                this.pendingTiles.set(reqId, { ctx, tile, done });

                // Send to worker with bitmap transfer
                this.worker.postMessage({
                    id: reqId,
                    width: size.x,
                    height: size.y,
                    bitmap: bitmap // Pass bitmap instead of raw data
                }, [bitmap]); // Transfer ownership

            } catch (err) {
                console.error('River bitmap creation failed:', err);
                done(undefined, tile);
            }
        };

        esriImg.onerror = () => {
            done(undefined, tile);
        };

        esriImg.src = esriTileUrl;

        return tile;
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
