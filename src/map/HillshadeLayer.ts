import * as L from 'leaflet';
import HillshadeWorker from '../workers/HillshadeWorker?worker'; // Vite Worker Import
import { HillshadeRequest, HillshadeResponse, HillshadeRegion } from '../workers/HillshadeWorker';
import { HISTORICAL_REGIONS } from '../data/HistoricalRegions';
import { gameLog } from '../utils/GameLogger';

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
    private pendingTiles: Map<number, { ctx: CanvasRenderingContext2D, tile: HTMLElement, done: L.DoneCallback }> = new Map();

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

        gameLog('startup', `HillshadeLayer: Initialized with Web Worker (z=${this.zFactor})`);
    }

    private handleWorkerMessage(e: MessageEvent<HillshadeResponse>) {
        const { id, data } = e.data;
        const task = this.pendingTiles.get(id);

        if (task) {
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
        img.src = url;

        img.onload = () => {
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

                // Store callback info
                this.pendingTiles.set(reqId, { ctx, tile, done });

                // [PERF] Zero-Copy Transfer: Move buffer ownership to Worker
                const buffer = imgData.data.buffer;
                this.worker.postMessage(request, [buffer]);

            } catch (err) {
                console.error('Hillshade read error (cors?):', err);
                // Fallback or finish
                done(undefined, tile);
            }
        };

        img.onerror = () => {
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
