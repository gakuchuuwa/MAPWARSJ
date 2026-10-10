import { GameConfig } from '../config/GameConfig';
import { Army } from './Army';
import { City, LatLng } from '../types/core';
import {
    getEuclideanDistance,
    nearestPointOnPolyline,
} from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import { interpolateLongitudeShortest, shortestLongitudeDelta } from '../utils/GeoLongitude';

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
    cities: MarchCityAccess,
    options?: { minAlong?: number },
): string {
    const zoc = GameConfig.SIEGE.COMBAT_RADIUS;
    const minAlong = options?.minAlong ?? 0;
    let bestId = fallbackTargetId;
    const fallbackCity = cities.getCity(fallbackTargetId);
    const fallbackProjection = fallbackCity
        ? nearestPointOnPolyline(
            { lat: fallbackCity.latitude, lng: fallbackCity.longitude },
            path
        )
        : null;
    let bestAlong = fallbackProjection?.along ?? Infinity;

    // 🔴 [2026-10-11 主人「玩家在战略地图移动时掉帧」] 先用路径外接框（外扩 ZOC）筛掉离路远的城，
    //    再做逐段投影。原来是全部 1100 座城 × 全路径逐段投影，AI 改道那一帧单军团实测 213ms。
    //    框外的城到折线任一点的距离必 > ZOC（欧氏距离 ≥ 各轴差），本来就会被下面的 distance > zoc 跳过 ⇒ 结果不变。
    const lng0 = path[0].lng;
    let minLat = Infinity, maxLat = -Infinity, minDLng = Infinity, maxDLng = -Infinity;
    for (const p of path) {
        const dLng = shortestLongitudeDelta(lng0, p.lng);
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (dLng < minDLng) minDLng = dLng;
        if (dLng > maxDLng) maxDLng = dLng;
    }
    // 路径横跨超过半个地球时经度差会绕回，框不可靠 ⇒ 不筛（保持原逻辑）
    const useBox = maxDLng - minDLng < 170;

    for (const city of cities.getCities()) {
        if (!city.factionId || city.factionId === factionId) continue;
        if (useBox) {
            if (city.latitude < minLat - zoc || city.latitude > maxLat + zoc) continue;
            const dLng = shortestLongitudeDelta(lng0, city.longitude);
            if (dLng < minDLng - zoc || dLng > maxDLng + zoc) continue;
        }
        const cpos = { lat: city.latitude, lng: city.longitude };
        // 军团脚下的城不算行军目标（路径会退化成 0 点）；交给 ZOC 就地开战
        if (getEuclideanDistance(cpos, path[0]) <= zoc) continue;
        const projection = nearestPointOnPolyline(cpos, path);
        if (!projection || projection.distance > zoc) continue;
        const along = projection.along;
        // 远征军团：忽略身后路径上的敌城，避免后方失守时折返「回援」
        if (along < minAlong) continue;
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
                lng: interpolateLongitudeShortest(p1.lng, p2.lng, ratio),
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
