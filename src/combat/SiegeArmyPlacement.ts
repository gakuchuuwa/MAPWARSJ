/**
 * 攻城待命占位：城周 COMBAT_RADIUS 圈上错开角度，异势力间距 ≥ 0.05°（与 MultiLegionFieldBattle 同量级）。
 * 不靠六边形格；与 trimPathFromEnd / ZOC 同一套距离语义。
 */
import { GameConfig } from '../config/GameConfig';
import { getEuclideanDistance, type LatLng } from '../core/DistanceUtils';
import { OrientationSystem } from '../core/OrientationSystem';
import { Army } from '../legion/Army';
import { gameLog } from '../utils/GameLogger';

/** 与 MultiLegionFieldBattle.moveArmiesToBattleParallel 一致 */
const MIN_HOSTILE_SEPARATION = 0.05;
const SLOT_COUNT = 12;
const MAX_RINGS = 3;
const RING_STEP = 0.04;
/** 扫描城周待命军团的范围（略大于 COMBAT_RADIUS） */
const NEAR_CITY_SCAN_RADIUS = GameConfig.SIEGE.COMBAT_RADIUS + 0.12;

function standoffRadius(ring: number): number {
    return GameConfig.SIEGE.COMBAT_RADIUS + ring * RING_STEP;
}

function generateStandoffCandidates(cityPos: LatLng): LatLng[] {
    const out: LatLng[] = [];
    for (let ring = 0; ring < MAX_RINGS; ring++) {
        const dist = standoffRadius(ring);
        for (let i = 0; i < SLOT_COUNT; i++) {
            const angle = (2 * Math.PI * i) / SLOT_COUNT;
            out.push({
                lat: cityPos.lat + dist * Math.sin(angle),
                lng: cityPos.lng + dist * Math.cos(angle),
            });
        }
    }
    return out;
}

function filterArmiesNearCity(armies: Army[], cityPos: LatLng, excludeArmyId?: string): Army[] {
    return armies.filter((a) => {
        if (a.isDestroyed) return false;
        if (excludeArmyId && a.id === excludeArmyId) return false;
        return getEuclideanDistance(a.getPosition(), cityPos) <= NEAR_CITY_SCAN_RADIUS;
    });
}

/** 该点是否与异势力军团过近 */
function hasHostileOverlapAt(
    pos: LatLng,
    factionId: string,
    others: Army[],
    minSep: number = MIN_HOSTILE_SEPARATION,
): boolean {
    for (const other of others) {
        if (other.getFactionId() === factionId) continue;
        if (getEuclideanDistance(pos, other.getPosition()) < minSep) return true;
    }
    return false;
}

function faceCity(army: Army, cityPos: LatLng): void {
    army.lastDirection = OrientationSystem.get8DirectionIndex(army.getPosition(), cityPos);
}

/**
 * 将军团移到城周待命点；异势力不共位。同势力可重叠。
 * @returns 是否发生了位移
 */
export function snapArmyToSiegeStandoff(
    army: Army,
    cityPos: LatLng,
    allArmies: Army[],
): boolean {
    if (army.isDestroyed) return false;

    const factionId = army.getFactionId();
    const armyPos = army.getPosition();
    const others = filterArmiesNearCity(allArmies, cityPos, army.id);

    if (!hasHostileOverlapAt(armyPos, factionId, others)) {
        faceCity(army, cityPos);
        return false;
    }

    const candidates = generateStandoffCandidates(cityPos)
        .filter((c) => !hasHostileOverlapAt(c, factionId, others))
        .sort((a, b) => getEuclideanDistance(armyPos, a) - getEuclideanDistance(armyPos, b));

    if (candidates.length === 0) {
        gameLog('siege', `⚠️ [SiegeStandoff] ${army.name ?? army.id} 城周无空位（异势过密）`);
        faceCity(army, cityPos);
        return false;
    }

    const target = candidates[0];
    army.setPosition(target.lat, target.lng);
    faceCity(army, cityPos);
    gameLog(
        'siege',
        `📍 [SiegeStandoff] ${army.name ?? army.id} 错开至 (${target.lat.toFixed(3)},${target.lng.toFixed(3)})`
    );
    return true;
}
