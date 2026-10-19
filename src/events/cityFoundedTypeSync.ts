/**
 * 🔴 [2026-10-19 主人定「现在大城据点和中城据点都有建城年。剧本和百岁模式中，如果建城年不到，就是小城。」]
 *
 * 规则：
 *   · 全库 205 座大城（`big_city`，38 座）与中城（`medium_city`，167 座）在 `CITY_FOUNDED_YEAR` 中均已登记建城年；
 *   · 在 **剧本模式（`script`）** 与 **百岁模式（`centenarian`）** 下：
 *       若当前年份 < 该据点的建城年（`CITY_FOUNDED_YEAR[cityId]`），该据点降为 **小城（`small_city`）**；
 *       一旦当前年份 ≥ 建城年，恢复为其原本的大城／中城等级；
 *   · 在 **乱斗模式（`melee`）** 或编辑器模式下：一律保持原本的大城／中城等级。
 */
import { CITIES_V2 } from '../data/cities_v2';
import { CITY_FOUNDED_YEAR } from '../data/cityFoundedYears';
import { clampCityTroopsForCity } from '../config/CityConfig';
import type { CityType } from '../types/core';
import type { CityManager } from '../world/CityManager';

/** 原始等级为大城或中城的据点表（cityId → 'big_city' | 'medium_city'） */
const BASE_BIG_MEDIUM_TYPE = new Map<string, 'big_city' | 'medium_city'>(
    CITIES_V2
        .filter((c): c is typeof c & { type: 'big_city' | 'medium_city' } => c.type === 'big_city' || c.type === 'medium_city')
        .map((c) => [c.id, c.type]),
);

export function isBigOrMediumBaseCity(cityId: string): boolean {
    return BASE_BIG_MEDIUM_TYPE.has(cityId);
}

export function getBaseBigOrMediumCityType(cityId: string): 'big_city' | 'medium_city' | undefined {
    return BASE_BIG_MEDIUM_TYPE.get(cityId);
}

/**
 * 计算某座据点在指定模式与年份下的有效城级：
 * 剧本 / 百岁模式下，大城与中城若未到建城年则为 `small_city`，到年或乱斗模式恢复原城级。
 */
export function resolveEffectiveCityType(
    cityId: string,
    baseType: CityType,
    mode: 'centenarian' | 'script' | 'melee',
    year: number | null,
): CityType {
    if (mode === 'melee' || year === null) return baseType;
    if (baseType !== 'big_city' && baseType !== 'medium_city') return baseType;
    const founded = CITY_FOUNDED_YEAR[cityId];
    if (founded !== undefined && year < founded) {
        return 'small_city';
    }
    return baseType;
}

/**
 * 同步全图大城／中城的当前有效城级（开局、跨年、剧本推进、切换模式时调用）。
 * @returns 是否有任何据点的城级发生变化
 */
export function syncCityFoundedTypes(
    cityManager: CityManager,
    mode: 'centenarian' | 'script' | 'melee',
    year: number | null,
): boolean {
    const isEditor = cityManager.getIsEditorMode();
    const effectiveMode = isEditor ? 'melee' : mode;
    let changed = false;

    for (const [cityId, baseType] of BASE_BIG_MEDIUM_TYPE) {
        const city = cityManager.getCity(cityId);
        if (!city) continue;
        // 若被编辑器改成了关隘/城寨等其他类型，不覆盖
        if (city.type !== baseType && city.type !== 'small_city') continue;

        const nextType = resolveEffectiveCityType(cityId, baseType, effectiveMode, year);
        if (city.type !== nextType) {
            city.type = nextType;
            city.troops = clampCityTroopsForCity(city, city.troops || 0);
            changed = true;
        }
    }
    return changed;
}
