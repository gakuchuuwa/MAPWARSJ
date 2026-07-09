/**
 * 攻城待命占位：城周 COMBAT_RADIUS 圈上错开角度，**每支军团**中心间距 ≥ 0.12（约半格六边形，与野战 BATTLE_OFFSET 0.14 同量级）。
 * 0.05 仅 ~20px 屏距，小于方阵贴图宽度，会视觉叠在一起。
 */
import { GameConfig } from '../config/GameConfig';
import { getEuclideanDistance, type LatLng } from '../core/DistanceUtils';
import { OrientationSystem } from '../core/OrientationSystem';
import { Army } from '../legion/Army';
import { gameLog } from '../utils/GameLogger';

/** 任意两支军团最小间距（同势/异势均适用；须大于军团贴图视觉半径） */
const MIN_ARMY_SEPARATION = 0.12;
/** 每圈槽位数：6 槽 @ r≈0.12 时弦长 ≈ MIN_ARMY_SEPARATION */
const SLOT_COUNT = 6;
const MAX_RINGS = 3;
const RING_STEP = 0.04;
/** 扫描城周待命军团的范围（略大于 COMBAT_RADIUS） */
const NEAR_CITY_SCAN_RADIUS = GameConfig.SIEGE.COMBAT_RADIUS + 0.12;
/** 重排时纳入的军团：与开战圈 BATTLE_JOIN_RADIUS 一致，含尚在途/排队者 */
const SIEGE_REPOSITION_SCAN_RADIUS = GameConfig.COMBAT.BATTLE_JOIN_RADIUS;

function standoffRadius(ring: number): number {
    // 首圈略外扩，使 6 槽弦长 ≥ MIN_ARMY_SEPARATION
    return GameConfig.SIEGE.COMBAT_RADIUS + 0.02 + ring * RING_STEP;
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

function filterArmiesNearCity(
    armies: Army[],
    cityPos: LatLng,
    excludeArmyIds?: Set<string>,
    radius: number = NEAR_CITY_SCAN_RADIUS,
): Army[] {
    return armies.filter((a) => {
        if (a.isDestroyed) return false;
        if (a.type !== 'legion') return false;
        if (excludeArmyIds?.has(a.id)) return false;
        return getEuclideanDistance(a.getPosition(), cityPos) <= radius;
    });
}

/** 开战圈内所有军团（异势/同势/在途/排队/已参战） */
export function collectLegionsNearSiegeCity(cityPos: LatLng, allArmies: Army[]): Army[] {
    return filterArmiesNearCity(allArmies, cityPos, undefined, SIEGE_REPOSITION_SCAN_RADIUS);
}

/**
 * 城周一切军团统一重排（解决：异势仍叠——旧逻辑只挪「当前这一支」且行军共路点未触发）。
 */
export function repositionAllLegionsNearSiegeCity(cityPos: LatLng, allArmies: Army[]): void {
    const near = collectLegionsNearSiegeCity(cityPos, allArmies);
    if (near.length === 0) return;
    repositionSiegeArmiesAroundCity(cityPos, near, allArmies);
}

function hasOverlapWithPositions(
    pos: LatLng,
    positions: LatLng[],
    minSep: number = MIN_ARMY_SEPARATION,
): boolean {
    for (const p of positions) {
        if (getEuclideanDistance(pos, p) < minSep) return true;
    }
    return false;
}

function faceCity(army: Army, cityPos: LatLng): void {
    army.lastDirection = OrientationSystem.get8DirectionIndex(army.getPosition(), cityPos);
}

/**
 * 批量为城周参战/待命军团分配互不重叠的圈上槽位（主攻、协战、第三方排队均走此路径）。
 */
export function repositionSiegeArmiesAroundCity(
    cityPos: LatLng,
    armiesToPlace: Army[],
    allArmies: Army[],
): void {
    const live = armiesToPlace.filter((a) => !a.isDestroyed);
    if (live.length === 0) return;

    const placeIds = new Set(live.map((a) => a.id));
    const externalNear = filterArmiesNearCity(
        allArmies.filter((a) => !placeIds.has(a.id)),
        cityPos,
    );

    const blockedPositions: LatLng[] = externalNear.map((a) => a.getPosition());
    const candidates = generateStandoffCandidates(cityPos);
    const sorted = [...live].sort((a, b) => a.id.localeCompare(b.id));

    for (const army of sorted) {
        const armyPos = army.getPosition();
        const free = candidates
            .filter((c) => !hasOverlapWithPositions(c, blockedPositions))
            .sort((a, b) => getEuclideanDistance(armyPos, a) - getEuclideanDistance(armyPos, b));

        if (free.length === 0) {
            gameLog('siege', `⚠️ [SiegeStandoff] ${army.name ?? army.id} 城周无空位（军团过密）`);
            faceCity(army, cityPos);
            blockedPositions.push(armyPos);
            continue;
        }

        const target = free[0];
        if (getEuclideanDistance(armyPos, target) > 0.001) {
            army.setPosition(target.lat, target.lng);
            gameLog(
                'siege',
                `📍 [SiegeStandoff] ${army.name ?? army.id} → (${target.lat.toFixed(3)},${target.lng.toFixed(3)})`,
            );
        }
        faceCity(army, cityPos);
        blockedPositions.push(target);
    }
}

/**
 * 单军团编入攻城（援军 poll / 第三方排队）：与城周已有军团错开，同势亦不占同一格。
 */
export function snapArmyToSiegeStandoff(
    army: Army,
    cityPos: LatLng,
    allArmies: Army[],
): boolean {
    if (army.isDestroyed) return false;
    const before = army.getPosition();
    repositionAllLegionsNearSiegeCity(cityPos, allArmies);
    const after = army.getPosition();
    return getEuclideanDistance(before, after) > 0.001;
}
