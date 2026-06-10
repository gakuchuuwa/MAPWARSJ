/**
 * 沙盒野战：行军碰撞接战、开战圈援军编入、停步存档
 *
 * 开战瞬间：collectLegionsNearBattleCenter 立即编入圈内援军。
 * 战斗中：CombatSystem 每 0.2s 调用 BattleReinforcementPoll 扫描圈内同旗军团。
 *
 * 停步约定：每支参战军团 stopMovement(true) 一次；二次停步不覆写 savedPathQueue。
 */
import { Battle, CombatSystem, IBattleUnit } from '../../combat/CombatSystem';
import { BattleUnitFactory } from '../../combat/BattleUnitFactory';
import { getEuclideanDistance, minDistanceToPolyline } from '../../core/DistanceUtils';
import { GameConfig } from '../../config/GameConfig';
import { City, LatLng } from '../../types/core';
import { gameLog } from '../../utils/GameLogger';
import { Army } from '../Army';
import {
    resolveScriptedQinPreset,
    restoreScriptedQinTroops,
    shouldScriptedQinBeDestroyed,
} from '../ScriptedQinLegion';
import type { CityManager } from '../../world/CityManager';
import type { SpatialRegistry } from '../../world/SpatialRegistry';

const FIELD_BATTLE_CONTACT_RADIUS = 0.2;
const FIELD_BATTLE_SEARCH_RADIUS = 0.28;

export interface LegionFieldBattleDeps {
    getArmies(): Army[];
    getSpatialRegistry(): SpatialRegistry;
    getCityManager(): CityManager;
    getCombatSystem(): CombatSystem | null;
    removeArmy(army: Army): void;
    triggerSiege(army: Army, city: City): void;
    /** 攻城第三方排队中：不参与野战碰撞 */
    isArmyWaitingSiege?(armyId: string): boolean;
}

function collectLegionsNearBattleCenter(
    deps: LegionFieldBattleDeps,
    center: LatLng,
    factionId: string,
    excludeArmyIds: Set<string>
): Army[] {
    const radius = GameConfig.COMBAT.BATTLE_JOIN_RADIUS;
    const minTroops = GameConfig.COMBAT.MIN_SURVIVAL_TROOPS;

    const candidates = deps.getArmies().filter((legion) => {
        if (legion.getFactionId() !== factionId) return false;
        if (excludeArmyIds.has(legion.id)) return false;
        if (legion.type !== 'legion' || legion.isDestroyed) return false;
        if (legion.getIsInCombat()) return false;
        if (deps.isArmyWaitingSiege?.(legion.id)) return false;
        if (legion.getTroops() < minTroops) return false;
        return getEuclideanDistance(legion.getPosition(), center) <= radius;
    });

    candidates.sort((a, b) => (b.getTroops() || 0) - (a.getTroops() || 0));
    return candidates;
}

function legionToFieldAdapter(
    deps: LegionFieldBattleDeps,
    legion: Army,
    side: 'attacker' | 'defender',
    presetResult?: 'attacker_win' | 'defender_win'
): IBattleUnit {
    return BattleUnitFactory.createAdapter(
        legion.id,
        legion.name || '军团',
        legion.getFactionId(),
        legion,
        'legion',
        legion.getTroops(),
        () => {
            legion.setCombatState(false);
        },
        () => {
            if (!shouldScriptedQinBeDestroyed(presetResult, legion, side)) {
                restoreScriptedQinTroops(legion);
                legion.setCombatState(false);
                return;
            }
            legion.destroy();
            deps.removeArmy(legion);
        }
    );
}

function isArmyInActiveSandboxFieldBattle(
    deps: LegionFieldBattleDeps,
    armyId: string
): boolean {
    const combatSystem = deps.getCombatSystem();
    if (!combatSystem) return false;
    for (const bf of combatSystem.getActiveBattleFields()) {
        if (bf.isOver || bf.type !== 'field') continue;
        if (bf.hasUnit(armyId)) return true;
    }
    return false;
}

function areArmiesInFieldContact(marchSegment: LatLng[], otherPos: LatLng): boolean {
    const r = FIELD_BATTLE_CONTACT_RADIUS;
    if (getEuclideanDistance(marchSegment[marchSegment.length - 1], otherPos) <= r) return true;
    if (marchSegment.length >= 2 && getEuclideanDistance(marchSegment[0], otherPos) <= r) return true;
    if (marchSegment.length >= 2 && minDistanceToPolyline(otherPos, marchSegment) <= r) return true;
    return false;
}

/** 野战结束但 Battle.resolve 未触发 onBattleEnd 时的兜底 */
export function releaseFieldBattleCombatState(battle: Battle): void {
    for (const unit of [battle.attacker, battle.defender]) {
        if (!(unit instanceof Army) || unit.isDestroyed) continue;
        if (!unit.getIsInCombat()) continue;
        unit.setCombatState(false);
    }
}

/** 本帧行军线段与敌军在接战半径内则开战（含空间索引 + 线段扫掠） */
export function tryEngageFieldBattle(
    deps: LegionFieldBattleDeps,
    army: Army,
    oldPos: LatLng,
    newPos: LatLng
): boolean {
    if (isArmyInActiveSandboxFieldBattle(deps, army.id)) return false;

    const marchSegment: LatLng[] =
        Math.abs(oldPos.lat - newPos.lat) > 1e-9 || Math.abs(oldPos.lng - newPos.lng) > 1e-9
            ? [oldPos, newPos]
            : [newPos];

    const nearbyArmies = deps.getSpatialRegistry().getArmiesInRadius(
        newPos.lat,
        newPos.lng,
        FIELD_BATTLE_SEARCH_RADIUS
    );

    const cityManager = deps.getCityManager();

    for (const otherArmy of nearbyArmies) {
        if (otherArmy === army || otherArmy.isDestroyed || otherArmy.getTroops() <= 0) continue;
        if (otherArmy.getFactionId() === army.getFactionId()) continue;
        if (otherArmy.getFactionId() === 'neutral') continue;

        const opPos = otherArmy.getPosition();
        if (!areArmiesInFieldContact(marchSegment, opPos)) continue;

        if (otherArmy.getIsInCombat()) continue;
        if (isArmyInActiveSandboxFieldBattle(deps, otherArmy.id)) continue;
        if (deps.isArmyWaitingSiege?.(otherArmy.id)) continue;

        let otherIsGarrison = false;
        const nearestCity = cityManager.getNearestCity(null, {
            latitude: opPos.lat,
            longitude: opPos.lng,
        });
        if (nearestCity && nearestCity.factionId === otherArmy.getFactionId()) {
            if (
                getEuclideanDistance(opPos, {
                    lat: nearestCity.latitude,
                    lng: nearestCity.longitude,
                }) <= 0.2
            ) {
                otherIsGarrison = true;
            }
        }

        if (otherIsGarrison) {
            gameLog(
                'legionSiege',
                `🏰 ${army.name} 撞驻军 ${otherArmy.name} @${nearestCity!.name}，转攻城`
            );
            deps.triggerSiege(army, nearestCity!);
            return true;
        }

        startFieldBattleBetween(deps, army, otherArmy);
        return true;
    }

    return false;
}

/** 野战：相遇点为圆心，开战圈内同旗军团一并参战 */
function startFieldBattleBetween(
    deps: LegionFieldBattleDeps,
    army: Army,
    otherArmy: Army
): void {
    if (
        isArmyInActiveSandboxFieldBattle(deps, army.id) ||
        isArmyInActiveSandboxFieldBattle(deps, otherArmy.id)
    ) {
        return;
    }

    const posA = army.getPosition();
    const posB = otherArmy.getPosition();
    const center = { lat: (posA.lat + posB.lat) / 2, lng: (posA.lng + posB.lng) / 2 };

    const attFaction = army.getFactionId();
    const defFaction = otherArmy.getFactionId();
    if (!attFaction || !defFaction || attFaction === defFaction) return;

    const exclude = new Set<string>([army.id, otherArmy.id]);
    const attLegions = [
        army,
        ...collectLegionsNearBattleCenter(deps, center, attFaction, exclude),
    ];
    attLegions.forEach((l) => exclude.add(l.id));
    const defLegions = [
        otherArmy,
        ...collectLegionsNearBattleCenter(deps, center, defFaction, exclude),
    ];

    const combatSystem = deps.getCombatSystem();
    if (!combatSystem) {
        army.setCombatState(true, 'field', center);
        otherArmy.setCombatState(true, 'field', center);
        return;
    }

    const presetResult = resolveScriptedQinPreset(attLegions, defLegions);
    const allLegions = [...attLegions, ...defLegions];

    const attUnits = attLegions.map((l) => legionToFieldAdapter(deps, l, 'attacker', presetResult));
    const defUnits = defLegions.map((l) => legionToFieldAdapter(deps, l, 'defender', presetResult));

    for (const legion of allLegions) {
        legion.stopMovement(true);
        legion.setCombatState(true, 'field', center);
    }

    const extra = attLegions.length + defLegions.length - 2;
    if (extra > 0) {
        gameLog(
            'legionMarch',
            `⚔️ 野战 @相遇点：${attFaction} ${attLegions.length}支 vs ${defFaction} ${defLegions.length}支（开战圈≈30km）`
        );
    } else {
        gameLog('legionMarch', `⚔️ ${army.name} 野战遭遇 ${otherArmy.name}`);
    }

    combatSystem.startRegionalBattle(
        attFaction,
        attUnits,
        defFaction,
        defUnits,
        presetResult
    );
}
