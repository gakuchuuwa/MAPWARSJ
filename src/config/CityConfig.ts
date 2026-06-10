import { CityType } from '../types/core';

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

/** 据点类型驻军上限（大城 10 万 / 中城 5 万 / 小城 2 万 / 关隘 5 万） */
export function getCityMaxTroops(type: CityType): number {
    return CITY_CONFIG[type]?.maxTroops ?? 0;
}

export function clampCityTroops(type: CityType, troops: number): number {
    const max = getCityMaxTroops(type);
    return Math.max(0, Math.min(max, Math.floor(troops)));
}
