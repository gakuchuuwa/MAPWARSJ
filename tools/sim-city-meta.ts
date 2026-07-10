/**
 * 模拟器用据点元数据（关隘 / 文化中心 / 驻军 / 文化上限）
 * 单一来源：cities_v2 分层列表 + RegionSystem.isRegionCenter + CityConfig/CultureTroopCaps
 */
import { T0_CAPITALS, T1_MEDIUM_CITIES, T2_STRATEGIC, PERIPHERY } from '../src/data/cities_v2';
import { getCityMaxTroops } from '../src/config/CityConfig';
import { isRegionCenter } from '../src/systems/RegionSystem';
import type { CityType } from '../src/types/core';
import type { RegionType } from '../src/systems/RegionSystem';

export interface SimCityMeta {
    cityId: string;
    type: CityType;
    region: RegionType;
    troops: number;
    maxTroops: number;
    isPass: boolean;
    isRegionCenter: boolean;
}

const ALL_CITIES = [...T0_CAPITALS, ...T1_MEDIUM_CITIES, ...T2_STRATEGIC, ...PERIPHERY];

/** 据点名 → 模拟用元数据（名册 city 列须与 cities_v2.name 一致） */
export function buildSimCityMetaByName(defaultTroops = 20000): Record<string, SimCityMeta> {
    const map: Record<string, SimCityMeta> = {};
    for (const c of ALL_CITIES) {
        const region = (c.region ?? 'CENTRAL') as RegionType;
        const maxTroops = getCityMaxTroops(c.type, region);
        const troops = Math.min(c.troops ?? defaultTroops, maxTroops);
        map[c.name] = {
            cityId: c.id,
            type: c.type,
            region,
            troops,
            maxTroops,
            isPass: c.type === 'pass',
            isRegionCenter: isRegionCenter(c.id),
        };
    }
    return map;
}

/** 名册守军：盘内兵力 clamp 至文化×城型上限 */
export function resolveSimGarrisonTroops(
    meta: SimCityMeta | undefined,
    fallbackTroops: number,
): number {
    if (!meta) return fallbackTroops;
    return Math.min(fallbackTroops, meta.maxTroops);
}
