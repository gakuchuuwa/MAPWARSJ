/**
 * 攻城邻格占位：不同势力军团不得共占同一六边形（含第三方排队）。
 * 同势力可共格；城市所在格不可站军团。
 */
import { GridSystem } from '../systems/GridSystem';
import { getHexDistance, getEuclideanDistance, type LatLng } from '../core/DistanceUtils';
import { OrientationSystem } from '../core/OrientationSystem';
import { Army } from '../legion/Army';
import { gameLog } from '../utils/GameLogger';

type HexKey = string;

const SIEGE_OCCUPANCY_SCAN_HEX = 2;
const SIEGE_ALLOCATE_MAX_RING = 3;

function hexKey(q: number, r: number): HexKey {
    return `${q},${r}`;
}

function getCityAxialHex(cityPos: LatLng): { q: number; r: number } {
    return GridSystem.latLngToAxial(cityPos.lat, cityPos.lng);
}

/** 收集攻城圈内各 hex 上的势力占用（同格可多势力，用于异势判重） */
function buildSiegeHexOccupancy(
    cityPos: LatLng,
    armies: Army[],
    excludeArmyId?: string,
): Map<HexKey, Set<string>> {
    const occupancy = new Map<HexKey, Set<string>>();
    const cityHex = getCityAxialHex(cityPos);
    const cityKey = hexKey(cityHex.q, cityHex.r);

    for (const army of armies) {
        if (army.isDestroyed) continue;
        if (excludeArmyId && army.id === excludeArmyId) continue;

        const pos = army.getPosition();
        if (getHexDistance(pos, cityPos) > SIEGE_OCCUPANCY_SCAN_HEX) continue;

        const axial = GridSystem.latLngToAxial(pos.lat, pos.lng);
        const key = hexKey(axial.q, axial.r);
        if (key === cityKey) continue;

        if (!occupancy.has(key)) occupancy.set(key, new Set());
        occupancy.get(key)!.add(army.getFactionId());
    }

    return occupancy;
}

function isHexBlockedForFaction(
    occupancy: Map<HexKey, Set<string>>,
    q: number,
    r: number,
    factionId: string,
    cityHex: { q: number; r: number },
): boolean {
    if (q === cityHex.q && r === cityHex.r) return true;

    const factions = occupancy.get(hexKey(q, r));
    if (!factions) return false;

    for (const fid of factions) {
        if (fid !== factionId) return true;
    }
    return false;
}

function allocateSiegeHex(
    cityPos: LatLng,
    armyPos: LatLng,
    factionId: string,
    occupancy: Map<HexKey, Set<string>>,
    maxRing: number = SIEGE_ALLOCATE_MAX_RING,
): { q: number; r: number } | null {
    const cityHex = getCityAxialHex(cityPos);

    for (let ring = 1; ring <= maxRing; ring++) {
        const ringCandidates: { q: number; r: number; dist: number }[] = [];
        const ringHexes = GridSystem.getHexRing(cityHex.q, cityHex.r, ring);

        for (const h of ringHexes) {
            if (isHexBlockedForFaction(occupancy, h.q, h.r, factionId, cityHex)) continue;
            const center = GridSystem.axialToLatLng(h.q, h.r);
            ringCandidates.push({
                q: h.q,
                r: h.r,
                dist: getEuclideanDistance(armyPos, center),
            });
        }

        if (ringCandidates.length > 0) {
            ringCandidates.sort((a, b) => a.dist - b.dist);
            return { q: ringCandidates[0].q, r: ringCandidates[0].r };
        }
    }

    return null;
}

function placeArmyOnSiegeHex(army: Army, cityPos: LatLng, hex: { q: number; r: number }): void {
    const center = GridSystem.axialToLatLng(hex.q, hex.r);
    army.setPosition(center.lat, center.lng);
    army.lastDirection = OrientationSystem.get8DirectionIndex(center, cityPos);
}

/**
 * 将军团吸附到目标城附近的可用六边形。
 * @returns 是否发生了位移
 */
export function snapArmyToSiegeHexNearCity(
    army: Army,
    cityPos: LatLng,
    allArmies: Army[],
): boolean {
    if (army.isDestroyed) return false;

    const occupancy = buildSiegeHexOccupancy(cityPos, allArmies, army.id);
    const armyPos = army.getPosition();
    const cityHex = getCityAxialHex(cityPos);
    const armyHex = GridSystem.latLngToAxial(armyPos.lat, armyPos.lng);
    const factionId = army.getFactionId();

    const onCityHex = armyHex.q === cityHex.q && armyHex.r === cityHex.r;
    const blocked = isHexBlockedForFaction(occupancy, armyHex.q, armyHex.r, factionId, cityHex);

    if (!onCityHex && !blocked) {
        const center = GridSystem.axialToLatLng(armyHex.q, armyHex.r);
        if (getEuclideanDistance(armyPos, center) > 0.001) {
            placeArmyOnSiegeHex(army, cityPos, armyHex);
            gameLog(
                'siege',
                `📍 [SiegeHex] ${army.name ?? army.id} 吸附邻格 (${armyHex.q},${armyHex.r})`
            );
            return true;
        }
        return false;
    }

    const hex = allocateSiegeHex(cityPos, armyPos, factionId, occupancy);
    if (!hex) {
        gameLog(
            'siege',
            `⚠️ [SiegeHex] ${army.name ?? army.id} 无可用邻格（城圈已满）`
        );
        return false;
    }

    placeArmyOnSiegeHex(army, cityPos, hex);
    gameLog(
        'siege',
        `📍 [SiegeHex] ${army.name ?? army.id} 占位 (${hex.q},${hex.r})，避异势重叠`
    );
    return true;
}
