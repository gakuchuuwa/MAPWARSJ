import type L from 'leaflet';
import type { LatLng } from '../../types/core';
import { ElevationSampler, latLngToTilePixel } from './ElevationSampler';
import { DEM_ZOOM, TERRARIUM_TILE_SIZE, decodeTerrariumElevation, isSeaElevation } from './TerrariumCodec';

type LandSeaKind = 'land' | 'sea';

/**
 * 陆海判定：Terrarium DEM 海拔 < 0 = 海域。
 * 与 HillshadeLayer 渲染同源，不依赖 DOM 像素猜色。
 */
export class LandSeaSystem {
    private static sampler = new ElevationSampler();
    private static resultCache = new Map<string, boolean>();
    private static readonly maxResultCache = 8000;
    private static mapBound = false;

    static getSampler(): ElevationSampler {
        return this.sampler;
    }

    static initialize(): void {
        if (this.mapBound) return;
        this.sampler.onTileLoaded(() => {
            this.resultCache.clear();
            window.dispatchEvent(new CustomEvent('land-sea-tiles-updated'));
        });
        this.mapBound = true;
    }

    static bindLeafletMap(map: L.Map): void {
        this.initialize();
        const prefetch = () => {
            const b = map.getBounds();
            this.sampler.prefetchBounds(b.getNorth(), b.getSouth(), b.getWest(), b.getEast());
        };
        map.on('moveend', prefetch);
        map.on('zoomend', prefetch);
        prefetch();
    }

    static prefetchViewport(map: L.Map): void {
        const b = map.getBounds();
        this.sampler.prefetchBounds(b.getNorth(), b.getSouth(), b.getWest(), b.getEast());
    }

    private static cacheKey(lat: number, lng: number): string {
        const { tileX, tileY, pixelX, pixelY, zoom } = latLngToTilePixel(lat, lng);
        return `${zoom}/${tileX}/${tileY}:${pixelX},${pixelY}`;
    }

    private static rememberResult(key: string, isSea: boolean): boolean {
        if (this.resultCache.size >= this.maxResultCache) {
            this.resultCache.clear();
        }
        this.resultCache.set(key, isSea);
        return isSea;
    }

    /** 同步查询；瓦片未到时返回 false（陆）并后台拉瓦片，下一帧再判 */
    static isSeaAt(latLng: LatLng): boolean {
        const key = this.cacheKey(latLng.lat, latLng.lng);
        const cached = this.resultCache.get(key);
        if (cached !== undefined) return cached;

        const elev = this.sampler.getElevationSync(latLng.lat, latLng.lng);
        if (elev === null) {
            this.sampler.scheduleFetch(latLng.lat, latLng.lng);
            return false;
        }
        return this.rememberResult(key, isSeaElevation(elev));
    }

    static isLandAt(latLng: LatLng): boolean {
        return !this.isSeaAt(latLng);
    }

    static getLandSeaKind(latLng: LatLng): LandSeaKind {
        return this.isSeaAt(latLng) ? 'sea' : 'land';
    }

    static async isSeaAtAsync(latLng: LatLng): Promise<boolean> {
        const { tileX, tileY, pixelX, pixelY, zoom } = latLngToTilePixel(
            latLng.lat,
            latLng.lng
        );
        await this.sampler.ensureTile(zoom, tileX, tileY);
        return this.isSeaAt(latLng);
    }

    /** 海拔（米）；瓦片未到时 null */
    static getElevationSync(lat: number, lng: number): number | null {
        return this.sampler.getElevationSync(lat, lng);
    }

    /**
     * 按 Leaflet 地图像素直接采样海拔（避免逐格 lat/lng 三角运算）。
     * globalX/globalY 为 zoom 级世界像素坐标；瓦片未缓存时 null 并触发后台拉取。
     */
    static getElevationAtMapPixel(
        globalX: number,
        globalY: number,
        zoom = DEM_ZOOM,
        scheduleLat?: number,
        scheduleLng?: number
    ): number | null {
        const tileX = Math.floor(globalX / TERRARIUM_TILE_SIZE);
        const tileY = Math.floor(globalY / TERRARIUM_TILE_SIZE);
        const pixelX = Math.min(
            TERRARIUM_TILE_SIZE - 1,
            Math.max(0, Math.floor(globalX - tileX * TERRARIUM_TILE_SIZE))
        );
        const pixelY = Math.min(
            TERRARIUM_TILE_SIZE - 1,
            Math.max(0, Math.floor(globalY - tileY * TERRARIUM_TILE_SIZE))
        );

        const data = this.sampler.getTileDataSync(zoom, tileX, tileY);
        if (!data) {
            if (scheduleLat !== undefined && scheduleLng !== undefined) {
                this.sampler.scheduleFetch(scheduleLat, scheduleLng, zoom);
            }
            return null;
        }

        const idx = (pixelY * TERRARIUM_TILE_SIZE + pixelX) * 4;
        return decodeTerrariumElevation(data[idx], data[idx + 1], data[idx + 2]);
    }

    /**
     * 批量采样矩形网格海拔；coords 为 [globalX, globalY, lat, lng] 四元组数组。
     * 返回与 coords 等长的海拔数组（瓦片未到时为 null）。
     */
    static sampleElevationBlock(
        coords: ReadonlyArray<{ globalX: number; globalY: number; lat: number; lng: number }>,
        zoom = DEM_ZOOM
    ): (number | null)[] {
        const out: (number | null)[] = new Array(coords.length);
        for (let i = 0; i < coords.length; i++) {
            const c = coords[i];
            out[i] = this.getElevationAtMapPixel(c.globalX, c.globalY, zoom, c.lat, c.lng);
        }
        return out;
    }
}
