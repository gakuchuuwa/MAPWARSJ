import { CityAssetManager } from '../../assets/CityAssetManager';
import type { City } from '../../types/core';

/** 据点旗号 CSS 类：正规势力 flag-faction-*，叛军 flag-rebel-* */
export function resolveCityFlagClass(city: City): string {
    if (city.factionId === 'panjun') {
        const index = CityAssetManager.getProcessedRebelFlagIndex(city.id);
        return `flag-rebel-${index}`;
    }
    return `flag-faction-${city.factionId}`;
}
