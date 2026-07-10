/**
 * 14 文化六维 · 兵力上限（军团 / 据点）
 * 单一真理：GameConfig.CULTURE_COMBAT.LEGION_TROOP_CAP_TABLE / CITY_TROOP_CAP_TABLE
 */
import { GameConfig } from '../config/GameConfig';
import type { CityType } from '../types/core';
import { getCityRegion, type RegionType } from './RegionSystem';

export function getLegionTroopCapMult(region?: RegionType | string | null): number {
    if (!region) return 1;
    return GameConfig.CULTURE_COMBAT.LEGION_TROOP_CAP_TABLE[region] ?? 1;
}

export function getCityTroopCapMult(region?: RegionType | string | null): number {
    if (!region) return 1;
    return GameConfig.CULTURE_COMBAT.CITY_TROOP_CAP_TABLE[region] ?? 1;
}

/** 军团兵力上限 = 全兵种基准 × 文化倍率 */
export function getArmyMaxTroops(culture?: RegionType | string | null): number {
    const base = GameConfig.LEGION.ARMY_MAX_TROOPS;
    return Math.floor(base * getLegionTroopCapMult(culture));
}

export function resolveCityCultureRegion(city: {
    region?: string;
    latitude: number;
    longitude: number;
}): RegionType {
    return getCityRegion(city);
}

export function scaleCityBaseMaxTroops(
    baseMax: number,
    region?: RegionType | string | null,
): number {
    return Math.floor(baseMax * getCityTroopCapMult(region));
}

export function clampTroopsToMax(troops: number, max: number): number {
    return Math.max(0, Math.min(max, Math.floor(troops)));
}

export function clampCityTroopsWithBaseMax(
    baseMax: number,
    troops: number,
    region?: RegionType | string | null,
): number {
    return clampTroopsToMax(troops, scaleCityBaseMaxTroops(baseMax, region));
}

export function clampCityTroopsForCityWithBaseMax(
    city: { type: CityType; region?: string; latitude: number; longitude: number },
    baseMaxForType: number,
    troops: number,
): number {
    return clampCityTroopsWithBaseMax(
        baseMaxForType,
        troops,
        resolveCityCultureRegion(city),
    );
}
