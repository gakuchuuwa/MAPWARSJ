/**
 * 攻城待命：开战前**只转向面城**，绝不 setPosition 传送。
 *
 * [2026-07-09] 走到哪站到哪；路过/他目标军团不纳入重排名单。
 * [2026-07-09] 完全无瞬移感：取消城周槽位吸附（曾导致攻打前「闪一下」）。
 */
import { GameConfig } from '../config/GameConfig';
import { getEuclideanDistance, type LatLng } from '../core/DistanceUtils';
import { OrientationSystem } from '../core/OrientationSystem';
import { Army } from '../legion/Army';

/** 扫描城周待命军团的范围（略大于 COMBAT_RADIUS） */
const NEAR_CITY_SCAN_RADIUS = GameConfig.SIEGE.COMBAT_RADIUS + 0.12;
/** 重排扫描：与开战圈 BATTLE_JOIN_RADIUS 一致 */
const SIEGE_REPOSITION_SCAN_RADIUS = GameConfig.COMBAT.BATTLE_JOIN_RADIUS;

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

/** 开战圈内所有军团（仅扫描，不表示都会改坐标） */
export function collectLegionsNearSiegeCity(cityPos: LatLng, allArmies: Army[]): Army[] {
    return filterArmiesNearCity(allArmies, cityPos, undefined, SIEGE_REPOSITION_SCAN_RADIUS);
}

/**
 * 是否纳入城周朝向整理：仅交战中 / 参战名单 / 目标本城且已停步。
 * 路过、闲置、奔向他城、在途行军 → 不纳入。
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
    const target = army.getTargetCity?.();
    if (cityId && target?.id === cityId && !army.isMarching()) return true;
    void cityPos;
    return false;
}

function faceCity(army: Army, cityPos: LatLng): void {
    army.lastDirection = OrientationSystem.get8DirectionIndex(army.getPosition(), cityPos);
}

/**
 * 参战军团统一面朝据点；**不改坐标**。
 */
export function repositionSiegeArmiesAroundCity(
    cityPos: LatLng,
    armiesToPlace: Army[],
): void {
    const live = armiesToPlace.filter((a) => !a.isDestroyed);
    if (live.length === 0) return;

    const sorted = [...live].sort((a, b) => a.id.localeCompare(b.id));
    for (const army of sorted) {
        faceCity(army, cityPos);
    }
}

export interface RepositionSiegeOpts {
    /** 据点 id：用于识别「目标就是本城」的在途攻城军 */
    cityId?: string | null;
    /** 必须纳入整理的军团（主攻、刚编入的援军、排队者等） */
    forceArmies?: Army[];
    /** 第三方排队判定（可选） */
    isWaitingSiege?: (armyId: string) => boolean;
}

/**
 * 城周开战前整理：只让本场相关军团面朝据点，不传送任何人。
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
    for (const a of opts?.forceArmies ?? []) {
        if (!a.isDestroyed && !toPlace.some((x) => x.id === a.id)) {
            toPlace.push(a);
        }
    }
    if (toPlace.length === 0) return;
    repositionSiegeArmiesAroundCity(cityPos, toPlace);
}

/**
 * 单军团编入攻城：仅转向面城（不再检测位移）。
 * @returns 恒 false（无坐标改动）
 */
export function snapArmyToSiegeStandoff(
    army: Army,
    cityPos: LatLng,
    allArmies: Army[],
    opts?: Omit<RepositionSiegeOpts, 'forceArmies'>,
): boolean {
    if (army.isDestroyed) return false;
    repositionAllLegionsNearSiegeCity(cityPos, allArmies, {
        ...opts,
        forceArmies: [army],
    });
    return false;
}
