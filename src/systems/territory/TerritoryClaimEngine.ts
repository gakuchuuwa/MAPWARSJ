import { City } from '../../types/core';
import { GridSystem } from '../GridSystem';

export interface TerritoryClaim {
    key: number;
    hexCenter: { lat: number; lng: number };
    city: City;
    rawDist: number;
}

/** 两城 BFS 圈可能重叠的最大轴向距离（大城 3+3 + 缓冲） */
export const TERRITORY_INFLUENCE_HEX = 8;

export function getMaxRadiusForCity(city: City): number {
    const cityType = city.type.toLowerCase();
    if (cityType === 'big_city' || cityType.includes('big') || cityType.includes('capital')) {
        return 3;
    }
    if (cityType === 'medium_city' || cityType === 'pass' || cityType.includes('medium')) {
        return 2;
    }
    return 1;
}

export function buildCityCoreIndex(cities: City[]): Map<number, string> {
    const cityLocations = new Map<number, string>();
    const hexDirs = [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 1, r: -1 },
        { q: 0, r: -1 },
        { q: -1, r: 0 },
        { q: -1, r: 1 },
        { q: 0, r: 1 },
    ];
    cities.forEach((c) => {
        const axial = GridSystem.latLngToAxial(c.latitude, c.longitude);
        hexDirs.forEach((dir) => {
            const key = GridSystem.getSpatialKey(axial.q + dir.q, axial.r + dir.r);
            if (!cityLocations.has(key)) {
                cityLocations.set(key, c.factionId);
            }
        });
    });
    return cityLocations;
}

export function computeAffectedCityIds(cities: City[], seedCityIds: string[]): Set<string> {
    const byId = new Map(cities.map((c) => [c.id, c]));
    const affected = new Set<string>();
    for (const seedId of seedCityIds) {
        const seed = byId.get(seedId);
        if (!seed) continue;
        const seedAxial = GridSystem.latLngToAxial(seed.latitude, seed.longitude);
        for (const city of cities) {
            const d = GridSystem.getDistance(
                seedAxial,
                GridSystem.latLngToAxial(city.latitude, city.longitude)
            );
            if (d <= TERRITORY_INFLUENCE_HEX) {
                affected.add(city.id);
            }
        }
    }
    return affected;
}

/** 单城 BFS 领土主张（与 TerritorySystem 全图逻辑一致） */
export function computeClaimsForCity(
    city: City,
    cityLocations: Map<number, string>
): TerritoryClaim[] {
    const claims: TerritoryClaim[] = [];
    const centerAxial = GridSystem.latLngToAxial(city.latitude, city.longitude);
    const openSet = [{ q: centerAxial.q, r: centerAxial.r, cost: 0 }];
    const centerKey = GridSystem.getSpatialKey(centerAxial.q, centerAxial.r);
    claims.push({
        key: centerKey,
        hexCenter: GridSystem.axialToLatLng(centerAxial.q, centerAxial.r),
        city,
        rawDist: 0,
    });

    const visited = new Map<number, number>();
    visited.set(centerKey, 0);
    const maxRadius = getMaxRadiusForCity(city);
    const roadRegistry = (window as any).roadRegistry;

    let head = 0;
    while (head < openSet.length) {
        const curr = openSet[head++];
        const dirs = [
            { q: 1, r: 0 },
            { q: 1, r: -1 },
            { q: 0, r: -1 },
            { q: -1, r: 0 },
            { q: -1, r: 1 },
            { q: 0, r: 1 },
        ];

        for (const dir of dirs) {
            const nq = curr.q + dir.q;
            const nr = curr.r + dir.r;
            const nKey = GridSystem.getSpatialKey(nq, nr);

            const nextRoadKey = `${nq},${nr}`;
            const currRoadKey = `${curr.q},${curr.r}`;
            let isNextRoad = false;
            let isCurrRoad = false;
            if (roadRegistry) {
                const customRoads = roadRegistry.getCustomRoadHexes();
                isNextRoad = customRoads.has(nextRoadKey);
                isCurrRoad = customRoads.has(currRoadKey);
            }

            let stepCost = 1.0;
            if (isCurrRoad && isNextRoad) {
                stepCost = 0.05;
            } else if (!isCurrRoad && isNextRoad) {
                stepCost = 0.05;
            } else if (isCurrRoad && !isNextRoad) {
                const distCurr = GridSystem.getDistance(centerAxial, { q: curr.q, r: curr.r });
                if (distCurr > maxRadius) {
                    stepCost = 999;
                } else {
                    const distNext = GridSystem.getDistance(centerAxial, { q: nq, r: nr });
                    stepCost = distNext <= maxRadius ? 1.0 : 10.0;
                }
            }

            const occupantFaction = cityLocations.get(nKey);
            if (occupantFaction && occupantFaction !== city.factionId) {
                stepCost = 999;
            }

            const newCost = curr.cost + stepCost;
            const physicalDist = GridSystem.getDistance(centerAxial, { q: nq, r: nr });
            if (physicalDist > maxRadius) continue;

            if (newCost <= maxRadius) {
                if (!visited.has(nKey) || newCost < visited.get(nKey)!) {
                    visited.set(nKey, newCost);
                    openSet.push({ q: nq, r: nr, cost: newCost });
                    claims.push({
                        key: nKey,
                        hexCenter: GridSystem.axialToLatLng(nq, nr),
                        city,
                        rawDist: newCost,
                    });
                }
            }
        }
    }
    return claims;
}

/**
 * 对 reassignKeys 内的六角格做竞争性分配（仅使用 affected 城市的主张列表）
 */
export async function assignHexesSubset(
    reassignKeys: Set<number>,
    cityClaimsMap: Map<string, TerritoryClaim[]>,
    cities: City[],
    affectedIds: Set<string>,
    hexOwnership: Map<number, City>,
    onAbort: () => boolean,
    yieldEveryOps = 200
): Promise<void> {
    const assignedHexes = new Set<number>();
    for (const key of hexOwnership.keys()) {
        if (!reassignKeys.has(key)) assignedHexes.add(key);
    }

    const cityById = new Map(cities.map((c) => [c.id, c]));
    const filteredClaimsMap = new Map<string, TerritoryClaim[]>();
    for (const cityId of affectedIds) {
        const list = (cityClaimsMap.get(cityId) || []).filter((c) => reassignKeys.has(c.key));
        list.sort((a, b) => {
            if (Math.abs(a.rawDist - b.rawDist) > 0.001) return a.rawDist - b.rawDist;
            return a.key - b.key;
        });
        filteredClaimsMap.set(cityId, list);
    }

    const cityClaimIndices = new Map<string, number>();
    for (const cityId of affectedIds) cityClaimIndices.set(cityId, 0);

    let candidatePool = new Map<string, TerritoryClaim>();
    for (const cityId of affectedIds) {
        const list = filteredClaimsMap.get(cityId)!;
        if (list.length > 0) candidatePool.set(cityId, list[0]);
    }

    const keysToWin = new Set(reassignKeys);
    let opsSinceYield = 0;

    while (candidatePool.size > 0) {
        let bestCityId: string | null = null;
        let minScore = Infinity;

        for (const [cityId, claim] of candidatePool.entries()) {
            let activeClaim = claim;
            while (assignedHexes.has(activeClaim.key) || !keysToWin.has(activeClaim.key)) {
                const list = filteredClaimsMap.get(cityId)!;
                const idx = cityClaimIndices.get(cityId)! + 1;
                cityClaimIndices.set(cityId, idx);
                if (idx < list.length) {
                    activeClaim = list[idx];
                    candidatePool.set(cityId, activeClaim);
                } else {
                    candidatePool.delete(cityId);
                    activeClaim = null as unknown as TerritoryClaim;
                    break;
                }
            }
            if (!activeClaim || !keysToWin.has(activeClaim.key)) continue;

            const { q: hq, r: hr } = GridSystem.getCoordsFromKey(activeClaim.key);
            const cityRef = cityById.get(cityId)!;
            const physicalDist = GridSystem.getDistance(
                GridSystem.latLngToAxial(cityRef.latitude, cityRef.longitude),
                { q: hq, r: hr }
            );

            let score = activeClaim.rawDist;
            if (physicalDist <= 1) score -= 2000;
            else if (physicalDist <= 2) score -= 1000;
            else if (physicalDist <= 3) score -= 500;

            if (score < minScore) {
                minScore = score;
                bestCityId = cityId;
            } else if (score === minScore && bestCityId) {
                if (activeClaim.rawDist < candidatePool.get(bestCityId)!.rawDist) {
                    bestCityId = cityId;
                }
            }
        }

        if (!bestCityId) break;

        const winnerClaim = candidatePool.get(bestCityId)!;
        if (!keysToWin.has(winnerClaim.key)) {
            candidatePool.delete(bestCityId);
            continue;
        }

        hexOwnership.set(winnerClaim.key, winnerClaim.city);
        assignedHexes.add(winnerClaim.key);

        const list = filteredClaimsMap.get(bestCityId)!;
        const idx = cityClaimIndices.get(bestCityId)! + 1;
        cityClaimIndices.set(bestCityId, idx);
        if (idx < list.length) {
            candidatePool.set(bestCityId, list[idx]);
        } else {
            candidatePool.delete(bestCityId);
        }

        opsSinceYield++;
        if (opsSinceYield > yieldEveryOps) {
            if (onAbort()) return;
            opsSinceYield = 0;
            await new Promise((r) => setTimeout(r, 0));
        }
    }
}
