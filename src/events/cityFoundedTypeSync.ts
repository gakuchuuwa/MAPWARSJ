/**
 * 🔴 [2026-11-10 主人令「未到建城年的大城、中城和小城，险要，一律降为城寨，驻军上限按城寨计算；到建城年恢复原城级。」]
 *   （取代 2026-10-19「大城和中城建城年不到降为小城」旧规）
 *
 * 规则：
 *   · 全库据点在 `CITY_FOUNDED_YEAR` 中均已登记建城年；
 *   · 在 **剧本模式（`script`）** 与 **历史模式（`centenarian`）** 下：
 *       若当前年份 < 该据点的建城年（`CITY_FOUNDED_YEAR[cityId]`），大城（`big_city`）、中城（`medium_city`）、
 *       小城（`small_city`）、险要/关隘（`pass`）一律降为 **城寨（`stockade`）**，驻军上限按城寨计算；
 *       一旦当前年份 ≥ 建城年，恢复为其原本的城级；
 *   · 在 **乱斗模式（`melee`）** 或编辑器模式下：一律保持原本的城级。
 */
import { CITIES_V2 } from '../data/cities_v2';
import { CITY_FOUNDED_YEAR } from '../data/cityFoundedYears';
import { clampCityTroopsForCity } from '../config/CityConfig';
import type { CityType } from '../types/core';
import type { CityManager } from '../world/CityManager';

type DowngradableCityType = Exclude<CityType, 'stockade'>;

/** 原始等级为大城、中城、小城或险要（关隘）的据点表（cityId → 原始城级） */
const BASE_DOWNGRADABLE_TYPE = new Map<string, DowngradableCityType>(
    CITIES_V2
        .filter((c): c is typeof c & { type: DowngradableCityType } =>
            c.type === 'big_city' || c.type === 'medium_city' || c.type === 'small_city' || c.type === 'pass',
        )
        .map((c) => [c.id, c.type]),
);

export function isBigOrMediumBaseCity(cityId: string): boolean {
    return BASE_DOWNGRADABLE_TYPE.has(cityId);
}

export function getBaseBigOrMediumCityType(cityId: string): DowngradableCityType | undefined {
    return BASE_DOWNGRADABLE_TYPE.get(cityId);
}

/**
 * 计算某座据点在指定模式与年份下的有效城级：
 * 剧本 / 历史模式下，大城、中城、小城、险要若未到建城年则为 `stockade`（城寨），到年或乱斗模式恢复原城级。
 */
export function resolveEffectiveCityType(
    cityId: string,
    baseType: CityType,
    mode: 'centenarian' | 'script' | 'melee',
    year: number | null,
): CityType {
    if (mode === 'melee' || year === null) return baseType;
    if (baseType === 'stockade') return baseType;
    const founded = CITY_FOUNDED_YEAR[cityId];
    if (founded !== undefined && year < founded) {
        return 'stockade';
    }
    return baseType;
}

/**
 * 同步全图据点的当前有效城级（开局、跨年、剧本推进、切换模式时调用）。
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

    for (const [cityId, baseType] of BASE_DOWNGRADABLE_TYPE) {
        const city = cityManager.getCity(cityId);
        if (!city) continue;
        // 若被编辑器改成了其他非原级且非降级城寨的类型，不覆盖
        if (city.type !== baseType && city.type !== 'stockade') continue;

        const nextType = resolveEffectiveCityType(cityId, baseType, effectiveMode, year);
        if (city.type !== nextType) {
            city.type = nextType;
            city.troops = clampCityTroopsForCity(city, city.troops || 0);
            changed = true;
        }
    }
    return changed;
}
