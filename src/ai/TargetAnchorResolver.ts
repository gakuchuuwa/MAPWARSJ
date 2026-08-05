/**
 * 推进锚点、军队发出点（homeCityId）丢失判定（军团目标选择）
 */
import { getEuclideanDistance } from '../core/DistanceUtils';
import type { City } from '../types/core';

export interface TargetAnchorCityAccess {
    getCity(id: string): City | undefined;
    getCitiesByFaction(factionId: string): City[];
}

/**
 * homeCityId 已不属于本势力（含不存在）。
 * 入参只要求 getCity —— 这样行为树和 ExpeditionUI 能共用同一判据。
 * 【务必共用】两边各写一份"家城失守"判断，会出现一边取消远征、另一边
 * 立刻重发的活锁（2026-07-30 修：军情面板「誓师远征」每 0.5 秒刷一条）。
 */
export function isHomeCityLost(
    homeCityId: string,
    factionId: string,
    cityManager: { getCity(id: string): { factionId: string } | undefined }
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
 * 推进锚点 A：距军团最近的己方据点；若无 → homeCityId。
 *
 * [FIX 2026-08-05] 传 roadDistances（军团所在路网城出发的道路距离表）时按**道路**距离选，
 * 不在表里的城 = 走不到 → 直接排除。原先只比直线距离，会把隔海飞地（如日本的城）
 * 选成大陆军团的锚点，于是从飞地周边挑出一座实际根本走不到的目标城，
 * 白跑一轮决策（有 giveUpUnreachable 兜底，不会卡死，但行军路线会绕）。
 * 不传则退回直线距离（保留旧行为，供不便取路网的调用方）。
 */
export function resolveForwardAnchor(
    armyPos: { lat: number; lng: number },
    factionId: string,
    homeCityId: string,
    cityManager: TargetAnchorCityAccess,
    roadDistances?: ReadonlyMap<string, number>
): string {
    const friendly = cityManager.getCitiesByFaction(factionId);
    if (friendly.length === 0) {
        return homeCityId;
    }

    let bestId: string | null = null;
    let bestDist = Infinity;

    for (const city of friendly) {
        // 跳过出生城：≥2万已出发，锚点必须在前沿
        if (city.id === homeCityId) continue;
        let dist: number;
        if (roadDistances) {
            const roadKm = roadDistances.get(city.id);
            if (roadKm === undefined) continue; // 路网不可达（飞地/断路）→ 不能当锚点
            dist = roadKm;
        } else {
            dist = getEuclideanDistance(armyPos, {
                lat: city.latitude,
                lng: city.longitude,
            });
        }
        if (dist < bestDist) {
            bestDist = dist;
            bestId = city.id;
        }
    }

    return bestId ?? homeCityId;
}
