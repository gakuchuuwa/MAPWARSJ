import { GameConfig } from '../config/GameConfig';
import { Army } from './Army';
import { City, LatLng } from '../types/core';
import {
    distanceAlongPolyline,
    getEuclideanDistance,
    minDistanceToPolyline,
} from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';

export interface MarchCityAccess {
    getCity(id: string): City | undefined;
    getCities(): Iterable<City>;
}

/** 行军路径上第一个须攻占的非己方据点（路网节点 + 折线 ZOC，含叛军） */
export function resolveMarchTargetOnPath(
    factionId: string,
    startCityId: string | undefined,
    targetCityId: string,
    marchPath: LatLng[],
    getCityFaction: (id: string) => string | undefined,
    cities: MarchCityAccess,
    resolveFirstHostileOnRoad: (
        factionId: string,
        startCityId: string,
        targetCityId: string,
        getFaction: (id: string) => string | undefined
    ) => string
): string {
    let marchTargetId = targetCityId;
    if (startCityId) {
        marchTargetId = resolveFirstHostileOnRoad(factionId, startCityId, targetCityId, getCityFaction);
    }
    if (marchPath.length >= 2) {
        marchTargetId = findFirstHostileAlongPolyline(factionId, marchPath, marchTargetId, cities);
    }
    return marchTargetId;
}

export function findFirstHostileAlongPolyline(
    factionId: string,
    path: LatLng[],
    fallbackTargetId: string,
    cities: MarchCityAccess
): string {
    const zoc = GameConfig.SIEGE.COMBAT_RADIUS;
    let bestId = fallbackTargetId;
    const fallbackCity = cities.getCity(fallbackTargetId);
    let bestAlong = fallbackCity
        ? distanceAlongPolyline(
              { lat: fallbackCity.latitude, lng: fallbackCity.longitude },
              path
          )
        : Infinity;

    for (const city of cities.getCities()) {
        if (!city.factionId || city.factionId === factionId) continue;
        const cpos = { lat: city.latitude, lng: city.longitude };
        // 军团脚下的城不算行军目标（路径会退化成 0 点）；交给 ZOC 就地开战
        if (getEuclideanDistance(cpos, path[0]) <= zoc) continue;
        if (minDistanceToPolyline(cpos, path) > zoc) continue;
        const along = distanceAlongPolyline(cpos, path);
        if (along < bestAlong) {
            bestAlong = along;
            bestId = city.id;
        }
    }
    return bestId;
}

/** 从军团当前位置接入道路折线（接路已在 getFullPathToCity 完成，此处不再二次 prepend） */
export function buildRoadMarchPath(
    currentPos: LatLng,
    roadPath: LatLng[],
    hostileTarget: boolean
): LatLng[] {
    const path = hostileTarget
        ? trimPathFromEnd(roadPath, GameConfig.SIEGE.COMBAT_RADIUS)
        : [...roadPath];

    if (path.length === 0) {
        return [{ lat: currentPos.lat, lng: currentPos.lng }];
    }
    return path;
}

export function trimPathFromEnd(path: LatLng[], distanceToTrim: number): LatLng[] {
    if (!path || path.length < 2) return path;

    const segments: number[] = [];
    let totalDist = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const d = getEuclideanDistance(path[i], path[i + 1]);
        segments.push(d);
        totalDist += d;
    }

    if (totalDist <= distanceToTrim) {
        return [path[0]];
    }

    const targetDist = totalDist - distanceToTrim;
    let currentDist = 0;
    const newPath: LatLng[] = [path[0]];

    for (let i = 0; i < segments.length; i++) {
        const d = segments[i];
        if (currentDist + d >= targetDist) {
            const remaining = targetDist - currentDist;
            const ratio = remaining / d;
            const p1 = path[i];
            const p2 = path[i + 1];
            newPath.push({
                lat: p1.lat + (p2.lat - p1.lat) * ratio,
                lng: p1.lng + (p2.lng - p1.lng) * ratio,
            });
            break;
        }
        newPath.push(path[i + 1]);
        currentDist += d;
    }
    return newPath;
}

/** 首段过长：多为道路接入异常或起点城选错，便于对照 F12 */
export function logSuspiciousMarchFirstLeg(
    army: Army,
    currentPos: LatLng,
    path: LatLng[],
    roadStartCityId: string | undefined,
    marchTargetId: string,
    cities: MarchCityAccess,
    marchDiagLogCooldown: Map<string, number>
): void {
    if (path.length < 2) return;

    const threshold = GameConfig.AI.MARCH_DIAG_FIRST_LEG;
    const firstLeg = getEuclideanDistance(path[0], path[1]);
    if (firstLeg <= threshold) return;

    const now = performance.now();
    const last = marchDiagLogCooldown.get(army.id) ?? 0;
    if (now - last < 12_000) return;
    marchDiagLogCooldown.set(army.id, now);

    const hop = cities.getCity(marchTargetId);
    gameLog(
        'legionMarch',
        `⚠️ [行军诊断] ${army.name} 首段=${firstLeg.toFixed(3)}(>${threshold}) ` +
            `现位(${currentPos.lat.toFixed(3)},${currentPos.lng.toFixed(3)}) ` +
            `→(${path[1].lat.toFixed(3)},${path[1].lng.toFixed(3)}) ` +
            `home=${army.homeCityId ?? '-'} roadStart=${roadStartCityId ?? '-'} ` +
            `目标=${hop?.name ?? marchTargetId} 兵力=${army.getTroops().toFixed(0)}`
    );
}
