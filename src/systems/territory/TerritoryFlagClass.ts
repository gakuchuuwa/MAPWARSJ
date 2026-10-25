import { CityAssetManager } from '../../assets/CityAssetManager';
import type { City } from '../../types/core';

/** 据点旗号 CSS 类：正规势力 flag-faction-*，叛军（无正规旗面）flag-rebel-* */
export function resolveCityFlagClass(city: City): string {
    // 🔴 [2026-10-24 主人「叛军是旗帜上没有字」「应该是只有旗帜，没有字」]
    //   叛军 `panshu`（特殊势力）走随机叛军原素材 `.flag-rebel-*`；
    //   叛军的字由 `CityAssetManager.isBlankRebelFlagFaction` 在生成旗号文字时拦掉（永远为 null）。
    //   （旧起义占位势力 `panjun` 已于 2026-10-25 删除；`=== 'panjun'` 保留作防御性死判断。）
    if (city.factionId === 'panjun' || CityAssetManager.isBlankRebelFlagFaction(city.factionId)) {
        const index = CityAssetManager.getProcessedRebelFlagIndex(city.id);
        return `flag-rebel-${index}`;
    }
    return `flag-faction-${city.factionId}`;
}
