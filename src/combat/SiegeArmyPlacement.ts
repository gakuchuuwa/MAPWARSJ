/**
 * 攻城待命占位：城周 COMBAT_RADIUS 圈上错开角度，**每支军团**中心间距 ≥ 0.12（约半格六边形，与野战 BATTLE_OFFSET 0.14 同量级）。
 * 0.05 仅 ~20px 屏距，小于方阵贴图宽度，会视觉叠在一起。
 *
 * [2026-07-09] 只挪「本场参战/排队」军团；路过、战后闲置、奔向他城的军团只作占位阻挡，禁止被传送（曾导致乘胜追击后卡死）。
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
/** 重排扫描：与开战圈 BATTLE_JOIN_RADIUS 一致 */
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

/** 开战圈内所有军团（仅扫描，不表示都该被传送） */
export function collectLegionsNearSiegeCity(cityPos: LatLng, allArmies: Army[]): Army[] {
    return filterArmiesNearCity(allArmies, cityPos, undefined, SIEGE_REPOSITION_SCAN_RADIUS);
}

/**
 * 是否应被城周错开传送：仅交战中 / 明确参战名单 / 目标就是本城的攻城相关单位。
 * 路过、闲置、奔向他城 → 只挡位，不挪。
 */
function shouldRepositionForSiege(
    army: Army,
    cityPos: LatLng,
    cityId: string | null,
    forceIds: Set<string>,
): boolean {
    if (army.isDestroyed || army.type !== 'legion') return false;
    if (forceIds.has(army.id)) return true;
    if (army.getIsInCombat()) return true;
    // 正以该城为攻城目标（在途抵达瞬间、尚未 setCombat）
    const target = army.getTargetCity?.();
    if (cityId && target?.id === cityId) return true;
    // 无 cityId 时：仅圈内且已交战/强制名单（上面已覆盖）
    void cityPos;
    return false;
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
 * 批量为城周参战/待命军团分配互不重叠的圈上槽位。
 * @param armiesToPlace 必须挪位的名单（主攻、协战、排队等）
 * @param allArmies 全图军团：圈内其余单位只作阻挡，不传送
 */
export function repositionSiegeArmiesAroundCity(
    cityPos: LatLng,
    armiesToPlace: Army[],
    allArmies: Army[],
): void {
    const live = armiesToPlace.filter((a) => !a.isDestroyed);
    if (live.length === 0) return;

    const placeIds = new Set(live.map((a) => a.id));
    // 圈内非参战者：占位阻挡，禁止被挪走
    const blockers = filterArmiesNearCity(
        allArmies.filter((a) => !placeIds.has(a.id)),
        cityPos,
        undefined,
        SIEGE_REPOSITION_SCAN_RADIUS,
    );

    const blockedPositions: LatLng[] = blockers.map((a) => a.getPosition());
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

export interface RepositionSiegeOpts {
    /** 据点 id：用于识别「目标就是本城」的在途攻城军 */
    cityId?: string | null;
    /** 必须纳入重排的军团（主攻、刚编入的援军、排队者等） */
    forceArmies?: Army[];
    /** 第三方排队判定（可选） */
    isWaitingSiege?: (armyId: string) => boolean;
}

/**
 * 城周错开：只传送本场相关军团，不碰路过/闲置/他目标行军。
 */
export function repositionAllLegionsNearSiegeCity(
    cityPos: LatLng,
    allArmies: Army[],
    opts?: RepositionSiegeOpts,
): void {
    const cityId = opts?.cityId ?? null;
    const forceIds = new Set((opts?.forceArmies ?? []).map((a) => a.id));
    const near = collectLegionsNearSiegeCity(cityPos, allArmies);
    const toPlace = near.filter((a) => {
        if (opts?.isWaitingSiege?.(a.id)) return true;
        return shouldRepositionForSiege(a, cityPos, cityId, forceIds);
    });
    // force 名单可能刚到圈外边缘：仍强制纳入
    for (const a of opts?.forceArmies ?? []) {
        if (!a.isDestroyed && !toPlace.some((x) => x.id === a.id)) {
            toPlace.push(a);
        }
    }
    if (toPlace.length === 0) return;
    repositionSiegeArmiesAroundCity(cityPos, toPlace, allArmies);
}

/**
 * 单军团编入攻城：只强制挪这一支（+圈内已交战/排队者），不扫射路过闲军。
 */
export function snapArmyToSiegeStandoff(
    army: Army,
    cityPos: LatLng,
    allArmies: Army[],
    opts?: Omit<RepositionSiegeOpts, 'forceArmies'>,
): boolean {
    if (army.isDestroyed) return false;
    const before = army.getPosition();
    repositionAllLegionsNearSiegeCity(cityPos, allArmies, {
        ...opts,
        forceArmies: [army],
    });
    const after = army.getPosition();
    return getEuclideanDistance(before, after) > 0.001;
}
