import { latLngToTile } from '../../map/TileMapConfig';
import {
    DEM_ZOOM,
    TERRARIUM_TILE_SIZE,
    TERRARIUM_TILE_URL,
    decodeTerrariumElevation,
} from './TerrariumCodec';
import { computeSlopeFromTile, type SlopeSample } from './TerrainSlope';

export interface TilePixel {
    tileX: number;
    tileY: number;
    pixelX: number;
    pixelY: number;
    zoom: number;
}

export function latLngToTilePixel(lat: number, lng: number, zoom = DEM_ZOOM): TilePixel {
    const n = Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;
    const xFrac = ((lng + 180) / 360) * n;
    const yFrac =
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

    const tileX = Math.floor(xFrac);
    const tileY = Math.floor(yFrac);
    const pixelX = Math.min(
        TERRARIUM_TILE_SIZE - 1,
        Math.max(0, Math.floor((xFrac - tileX) * TERRARIUM_TILE_SIZE))
    );
    const pixelY = Math.min(
        TERRARIUM_TILE_SIZE - 1,
        Math.max(0, Math.floor((yFrac - tileY) * TERRARIUM_TILE_SIZE))
    );

    return { tileX, tileY, pixelX, pixelY, zoom };
}

function tileCacheKey(zoom: number, x: number, y: number): string {
    return `${zoom}/${x}/${y}`;
}

type TileLoadedListener = () => void;

/**
 * 拉取 Terrarium 瓦片并按像素查询海拔；瓦片 LRU 缓存供同步查询。
 */
export class ElevationSampler {
    private readonly cache = new Map<string, Uint8ClampedArray>();
    private readonly cacheOrder: string[] = [];
    private readonly pending = new Set<string>();
    private readonly maxCacheTiles: number;
    private tileLoadedListeners = new Set<TileLoadedListener>();

    constructor(maxCacheTiles = 320) {
        this.maxCacheTiles = maxCacheTiles;
    }

    onTileLoaded(listener: TileLoadedListener): () => void {
        this.tileLoadedListeners.add(listener);
        return () => this.tileLoadedListeners.delete(listener);
    }

    private notifyTileLoaded(): void {
        for (const listener of this.tileLoadedListeners) {
            listener();
        }
    }

    private touchCache(key: string): void {
        const idx = this.cacheOrder.indexOf(key);
        if (idx >= 0) this.cacheOrder.splice(idx, 1);
        this.cacheOrder.push(key);
    }

    private evictIfNeeded(): void {
        while (this.cache.size > this.maxCacheTiles && this.cacheOrder.length > 0) {
            const oldest = this.cacheOrder.shift()!;
            this.cache.delete(oldest);
        }
    }

    hasTile(zoom: number, x: number, y: number): boolean {
        return this.cache.has(tileCacheKey(zoom, x, y));
    }

    getTileDataSync(zoom: number, tileX: number, tileY: number): Uint8ClampedArray | null {
        const key = tileCacheKey(zoom, tileX, tileY);
        const data = this.cache.get(key);
        if (data) this.touchCache(key);
        return data ?? null;
    }

    /** 同步采样；瓦片未缓存时返回 null 并触发后台拉取 */
    getElevationSync(lat: number, lng: number, zoom = DEM_ZOOM): number | null {
        const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng, zoom);
        const key = tileCacheKey(zoom, tileX, tileY);
        const data = this.cache.get(key);
        if (!data) {
            void this.ensureTile(zoom, tileX, tileY);
            return null;
        }
        this.touchCache(key);
        const idx = (pixelY * TERRARIUM_TILE_SIZE + pixelX) * 4;
        return decodeTerrariumElevation(data[idx], data[idx + 1], data[idx + 2]);
    }

    /** 海拔 + 坡度（3×3 核）；瓦片未缓存时 null */
    getElevationAndSlopeSync(lat: number, lng: number, zoom = DEM_ZOOM): SlopeSample | null {
        const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng, zoom);
        const data = this.getTileDataSync(zoom, tileX, tileY);
        if (!data) {
            void this.ensureTile(zoom, tileX, tileY);
            return null;
        }
        return computeSlopeFromTile(data, pixelX, pixelY);
    }

    scheduleFetch(lat: number, lng: number, zoom = DEM_ZOOM): void {
        const { tileX, tileY } = latLngToTilePixel(lat, lng, zoom);
        void this.ensureTile(zoom, tileX, tileY);
    }

    async ensureTile(zoom: number, x: number, y: number): Promise<boolean> {
        const key = tileCacheKey(zoom, x, y);
        if (this.cache.has(key)) return true;
        if (this.pending.has(key)) return false;

        this.pending.add(key);
        try {
            const url = TERRARIUM_TILE_URL.replace('{z}', String(zoom))
                .replace('{x}', String(x))
                .replace('{y}', String(y));

            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image();
                el.crossOrigin = 'Anonymous';
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error(`Terrarium tile failed: ${url}`));
                el.src = url;
            });

            const canvas = document.createElement('canvas');
            canvas.width = TERRARIUM_TILE_SIZE;
            canvas.height = TERRARIUM_TILE_SIZE;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, TERRARIUM_TILE_SIZE, TERRARIUM_TILE_SIZE);
            this.cache.set(key, imageData.data);
            this.touchCache(key);
            this.evictIfNeeded();
            this.notifyTileLoaded();
            return true;
        } catch (err) {
            console.warn('[ElevationSampler]', err);
            return false;
        } finally {
            this.pending.delete(key);
        }
    }

    /** 预取视口内瓦片（不阻塞） */
    prefetchBounds(
        north: number,
        south: number,
        west: number,
        east: number,
        zoom = DEM_ZOOM,
        padding = 1
    ): void {
        const nw = latLngToTile(north, west, zoom);
        const se = latLngToTile(south, east, zoom);
        const xMin = Math.min(nw.x, se.x) - padding;
        const xMax = Math.max(nw.x, se.x) + padding;
        const yMin = Math.min(nw.y, se.y) - padding;
        const yMax = Math.max(nw.y, se.y) + padding;
        const maxTile = Math.pow(2, zoom);

        for (let ty = yMin; ty <= yMax; ty++) {
            for (let tx = xMin; tx <= xMax; tx++) {
                if (tx < 0 || ty < 0 || tx >= maxTile || ty >= maxTile) continue;
                void this.ensureTile(zoom, tx, ty);
            }
        }
    }

    prefetchLatLng(lat: number, lng: number, radiusTiles = 1, zoom = DEM_ZOOM): void {
        const center = latLngToTile(lat, lng, zoom);
        const maxTile = Math.pow(2, zoom);
        for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
            for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
                const tx = center.x + dx;
                const ty = center.y + dy;
                if (tx < 0 || ty < 0 || tx >= maxTile || ty >= maxTile) continue;
                void this.ensureTile(zoom, tx, ty);
            }
        }
    }

}
