import { CityType } from '../types/core';
import {
    clampCityTroopsForCityWithBaseMax,
    clampCityTroopsWithBaseMax,
    getCityTroopCapMult,
    getLegionTroopCapMult,
    scaleCityBaseMaxTroops,
} from '../systems/CultureTroopCaps';
import type { RegionType } from '../systems/RegionSystem';

export {
    getLegionTroopCapMult,
    getCityTroopCapMult,
    getArmyMaxTroops,
} from '../systems/CultureTroopCaps';

export interface CityTypeConfig {
    name: string;
    maxTroops: number;
    initialTroops: number;
    growthRate: number; // 0.01 = 1%（乱斗季末补兵见 recruitPerSeason）
    /** 乱斗：每季（15 游戏秒）驻军增量 */
    recruitPerSeason: number;
}

export const CITY_CONFIG: Record<CityType, CityTypeConfig> = {
    big_city: {          // 大城
        name: '大城',
        maxTroops: 100000,
        initialTroops: 10000,
        growthRate: 0.012,
        recruitPerSeason: 400,
    },
    medium_city: {       // 中城
        name: '中城',
        maxTroops: 50000,
        initialTroops: 5000,
        growthRate: 0.01,
        recruitPerSeason: 300,
    },
    small_city: {       // 小城（含渡口，可出兵）
        name: '小城',
        maxTroops: 20000,
        initialTroops: 5000,
        growthRate: 0.008,
        recruitPerSeason: 200,
    },
    pass: {             // 关隘（可出兵；守城有额外防御系数见 PASS_GARRISON_MULT）
        name: '关隘',
        maxTroops: 50000,
        initialTroops: 10000,
        growthRate: 0.008,
        recruitPerSeason: 100,
    },
};

/** 据点驻军上限（城型基准 × 文化 CITY_TROOP_CAP_TABLE；无 region 时倍率 1.0） */
export function getCityMaxTroops(type: CityType, region?: RegionType | string | null): number {
    const base = CITY_CONFIG[type]?.maxTroops ?? 0;
    return scaleCityBaseMaxTroops(base, region);
}

export function clampCityTroops(
    type: CityType,
    troops: number,
    region?: RegionType | string | null,
): number {
    const base = CITY_CONFIG[type]?.maxTroops ?? 0;
    return clampCityTroopsWithBaseMax(base, troops, region);
}

/** 据 city.region 或坐标解析文化区后 clamp */
export function clampCityTroopsForCity(
    city: { type: CityType; region?: string; latitude: number; longitude: number },
    troops: number,
): number {
    const base = CITY_CONFIG[city.type]?.maxTroops ?? 0;
    return clampCityTroopsForCityWithBaseMax(city, base, troops);
}
