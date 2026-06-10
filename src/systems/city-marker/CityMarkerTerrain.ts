import {
    CITY_MARKER_BRIGHT_CLASS,
} from '../../config/city-marker-tokens';
import { LandTerrainSystem } from '../../world/land-sea';

const terrainBrightCache = new Map<string, boolean>();
const pendingTerrain = new Set<string>();

export function getCachedBrightTerrain(cityId: string): boolean {
    return terrainBrightCache.get(cityId) ?? false;
}

export function getCityImageContainerClass(cityId: string): string {
    return getCachedBrightTerrain(cityId) ? CITY_MARKER_BRIGHT_CLASS : '';
}

function applyBrightClass(container: HTMLElement | null, bright: boolean): void {
    if (!container) return;
    if (bright) {
        container.classList.add(CITY_MARKER_BRIGHT_CLASS);
    } else {
        container.classList.remove(CITY_MARKER_BRIGHT_CLASS);
    }
}

/** 采样完成后按 cityId 查找当前 marker（避免异步期间 marker 重建导致引用失效） */
export function applyCityMarkerTerrainClass(
    cityId: string,
    bright: boolean,
    resolveContainer: (id: string) => HTMLElement | null,
): void {
    terrainBrightCache.set(cityId, bright);
    applyBrightClass(resolveContainer(cityId), bright);
}

/** DEM 就绪后异步判定浅底；失败则保持默认阴影 */
export function scheduleCityMarkerTerrainSample(
    cityId: string,
    lat: number,
    lng: number,
    resolveContainer: (id: string) => HTMLElement | null,
): void {
    if (terrainBrightCache.has(cityId)) {
        applyBrightClass(resolveContainer(cityId), terrainBrightCache.get(cityId)!);
        return;
    }
    if (pendingTerrain.has(cityId)) {
        return;
    }
    pendingTerrain.add(cityId);

    const run = async () => {
        try {
            const bright = await LandTerrainSystem.isBrightTerrainAtAsync({ lat, lng });
            applyCityMarkerTerrainClass(cityId, bright, resolveContainer);
        } finally {
            pendingTerrain.delete(cityId);
        }
    };

    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => void run(), { timeout: 1200 });
    } else {
        setTimeout(() => void run(), 80);
    }
}

export function clearCityMarkerTerrainCache(): void {
    terrainBrightCache.clear();
    pendingTerrain.clear();
}
