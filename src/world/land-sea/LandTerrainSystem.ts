import type { LatLng } from '../../types/core';
import { isSeaElevation } from './TerrariumCodec';
import { LandSeaSystem } from './LandSeaSystem';
import { latLngToTilePixel } from './ElevationSampler';

export type LandTerrainKind = 'sea' | 'plain' | 'mountain';

/**
 * 陆地地形：海拔 + 坡度（方案 B）
 * - 海：elev < 0
 * - 山地：elev ≥ MOUNTAIN_ELEVATION_M 或 slope ≥ MOUNTAIN_SLOPE_DEG
 * - 平原：其余陆地
 */
export const MOUNTAIN_ELEVATION_M = 600;
export const MOUNTAIN_SLOPE_DEG = 12;

export class LandTerrainSystem {
    private static resultCache = new Map<string, LandTerrainKind>();
    private static readonly maxResultCache = 8000;
    private static initialized = false;

    static initialize(): void {
        if (this.initialized) return;
        LandSeaSystem.getSampler().onTileLoaded(() => {
            this.resultCache.clear();
            window.dispatchEvent(new CustomEvent('land-terrain-tiles-updated'));
        });
        this.initialized = true;
    }

    private static cacheKey(lat: number, lng: number): string {
        const { tileX, tileY, pixelX, pixelY, zoom } = latLngToTilePixel(lat, lng);
        return `t:${zoom}/${tileX}/${tileY}:${pixelX},${pixelY}`;
    }

    private static remember(key: string, kind: LandTerrainKind): LandTerrainKind {
        if (this.resultCache.size >= this.maxResultCache) {
            this.resultCache.clear();
        }
        this.resultCache.set(key, kind);
        return kind;
    }

    static classifyAt(latLng: LatLng): LandTerrainKind | null {
        const key = this.cacheKey(latLng.lat, latLng.lng);
        const cached = this.resultCache.get(key);
        if (cached !== undefined) return cached;

        const sample = LandSeaSystem.getSampler().getElevationAndSlopeSync(
            latLng.lat,
            latLng.lng
        );
        if (!sample) {
            return null;
        }

        const { elevationM, slopeDeg } = sample;
        if (isSeaElevation(elevationM)) {
            return this.remember(key, 'sea');
        }
        if (elevationM >= MOUNTAIN_ELEVATION_M || slopeDeg >= MOUNTAIN_SLOPE_DEG) {
            return this.remember(key, 'mountain');
        }
        return this.remember(key, 'plain');
    }

    static isMountainAt(latLng: LatLng): boolean {
        return this.classifyAt(latLng) === 'mountain';
    }

    static isPlainAt(latLng: LatLng): boolean {
        return this.classifyAt(latLng) === 'plain';
    }

    static async classifyAtAsync(latLng: LatLng): Promise<LandTerrainKind> {
        const { tileX, tileY, zoom } = latLngToTilePixel(latLng.lat, latLng.lng);
        await LandSeaSystem.getSampler().ensureTile(zoom, tileX, tileY);
        return this.classifyAt(latLng) ?? 'plain';
    }

    /**
     * 据点建筑浅底：低海拔平原或高海拔雪线（与 Hillshade 浅色区域一致）
     * 瓦片未到时返回 null
     */
    static isBrightTerrainAt(latLng: LatLng): boolean | null {
        const kind = this.classifyAt(latLng);
        if (kind === null) return null;
        if (kind === 'sea' || kind === 'mountain') return false;
        const elev = LandSeaSystem.getElevationSync(latLng.lat, latLng.lng);
        if (elev === null) return null;
        return elev < 1200 || elev > 3200;
    }

    static async isBrightTerrainAtAsync(latLng: LatLng): Promise<boolean> {
        await this.classifyAtAsync(latLng);
        return this.isBrightTerrainAt(latLng) ?? false;
    }
}
