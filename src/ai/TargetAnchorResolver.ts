/**
 * 推进锚点、军队发出点（homeCityId）丢失判定（军团目标选择）
 */
import { getEuclideanDistance } from '../core/DistanceUtils';
import type { City } from '../types/core';

export interface TargetAnchorCityAccess {
    getCity(id: string): City | undefined;
    getCitiesByFaction(factionId: string): City[];
}

/** homeCityId 已不属于本势力（含不存在） */
export function isHomeCityLost(
    homeCityId: string,
    factionId: string,
    cityManager: TargetAnchorCityAccess
): boolean {
    const home = cityManager.getCity(homeCityId);
    if (!home) return true;
    return home.factionId !== factionId;
}

/** 该军唯一出发点（募兵时写入，之后不改） */
export function getArmyOriginCityId(army: {
    homeCityId?: string | null;
    getSourceCityId?: () => string | null;
}): string | null {
    return army.homeCityId ?? army.getSourceCityId?.() ?? null;
}

/**
 * 仅收复「本军」出发点：入参 originCityId 必须来自 getArmyOriginCityId(army)。
 * 不收复友军出发点、不读 STARTING_CAPITALS、不共用势力级首都。
 */
export function resolveRecaptureTarget(
    factionId: string,
    originCityId: string,
    cityManager: TargetAnchorCityAccess
): string | null {
    if (!originCityId) return null;
    if (isHomeCityLost(originCityId, factionId, cityManager)) {
        return originCityId;
    }
    return null;
}

/**
 * 推进锚点 A：距军团当前位置最近的己方据点；若无 → homeCityId
 */
export function resolveForwardAnchor(
    armyPos: { lat: number; lng: number },
    factionId: string,
    homeCityId: string,
    cityManager: TargetAnchorCityAccess
): string {
    const friendly = cityManager.getCitiesByFaction(factionId);
    if (friendly.length === 0) {
        return homeCityId;
    }

    let bestId = homeCityId;
    let bestDist = Infinity;

    for (const city of friendly) {
        const dist = getEuclideanDistance(armyPos, {
            lat: city.latitude,
            lng: city.longitude,
        });
        if (dist < bestDist) {
            bestDist = dist;
            bestId = city.id;
        }
    }

    return bestId;
}
