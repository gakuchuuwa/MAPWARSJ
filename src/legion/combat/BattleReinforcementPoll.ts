/**
 * 实时开战圈援军：周期性扫描 BATTLE_JOIN_RADIUS 内同旗军团并加入进行中的区域战。
 */
import { BattleField } from '../../combat/BattleField';
import { BattleUnitFactory } from '../../combat/BattleUnitFactory';
import { CombatSystem } from '../../combat/CombatSystem';
import { GameConfig } from '../../config/GameConfig';
import { getEuclideanDistance } from '../../core/DistanceUtils';
import { Army } from '../Army';
import { LatLng } from '../../types/core';
import { SpatialRegistry } from '../../world/SpatialRegistry';
import type { LegionManager } from '../LegionManager';
import {
    applyScriptedQinReinforcementPreset,
    restoreScriptedQinTroops,
    shouldScriptedQinBeDestroyed,
} from '../ScriptedQinLegion';
import { markLegionAnnihilationFeed } from '../LegionAnnihilationFeed';

export const BATTLE_REINFORCEMENT_POLL_INTERVAL_SEC = 0.2;

export interface ReinforcementPollState {
    remainingSec: number;
}

export function createReinforcementPollState(): ReinforcementPollState {
    return { remainingSec: 0 };
}

export interface ReinforcementJoinDeps {
    spatialRegistry: SpatialRegistry;
    removeArmy: (army: Army) => void;
    isArmyWaitingSiege?: (armyId: string) => boolean;
    resolveBattleCityName?: (center: LatLng) => string;
}

export function isEligibleReinforcement(
    legion: Army,
    factionId: string,
    battleField: BattleField,
    center: LatLng,
    deps: ReinforcementJoinDeps
): boolean {
    if (legion.getFactionId() !== factionId) return false;
    if (legion.type !== 'legion' || legion.isDestroyed) return false;
    if (legion.getIsInCombat()) return false;
    if (legion.getTroops() < GameConfig.COMBAT.MIN_SURVIVAL_TROOPS) return false;
    if (battleField.hasUnit(legion.id)) return false;
    if (deps.isArmyWaitingSiege?.(legion.id)) return false;

    const dist = getEuclideanDistance(legion.getPosition(), center);
    return dist <= GameConfig.COMBAT.BATTLE_JOIN_RADIUS;
}

function createLegionAdapter(
    legion: Army,
    deps: ReinforcementJoinDeps,
    side: 'attacker' | 'defender',
    presetResult: 'attacker_win' | 'defender_win' | undefined,
    battleCityName: string
) {
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
            markLegionAnnihilationFeed(legion, side, battleCityName);
            legion.destroy();
            deps.removeArmy(legion);
        }
    );
}

/** 将单支军团加入进行中的区域战；成功返回 true */
export function tryJoinLegionToBattle(
    battleField: BattleField,
    legion: Army,
    isAttacker: boolean,
    center: LatLng,
    deps: ReinforcementJoinDeps
): boolean {
    if (battleField.isOver) return false;

    const factionId = isAttacker
        ? battleField.getAttackerFactionId()
        : battleField.getDefenderFactionId();

    if (!isEligibleReinforcement(legion, factionId, battleField, center, deps)) {
        return false;
    }

    applyScriptedQinReinforcementPreset(battleField, legion, isAttacker);

    legion.stopMovement(true);
    legion.setCombatState(true, battleField.type, center);

    const side: 'attacker' | 'defender' = isAttacker ? 'attacker' : 'defender';
    const battleCityName = deps.resolveBattleCityName?.(center) ?? '未知';
    const adapter = createLegionAdapter(legion, deps, side, battleField.getPresetResult(), battleCityName);
    battleField.addReinforcement(adapter, isAttacker);
    return true;
}

/** 扫描开战圈并将符合条件的援军编入战场 */
export function pollBattleFieldReinforcements(
    battleField: BattleField,
    center: LatLng,
    deps: ReinforcementJoinDeps
): number {
    if (battleField.isOver) return 0;

    const nearby = deps.spatialRegistry.getArmiesInRadius(
        center.lat,
        center.lng,
        GameConfig.COMBAT.BATTLE_JOIN_RADIUS
    );

    let joined = 0;

    for (const isAttacker of [true, false] as const) {
        const factionId = isAttacker
            ? battleField.getAttackerFactionId()
            : battleField.getDefenderFactionId();

        const eligible = nearby
            .filter((legion) => isEligibleReinforcement(legion, factionId, battleField, center, deps))
            .sort((a, b) => (b.getTroops() || 0) - (a.getTroops() || 0));

        for (const legion of eligible) {
            if (tryJoinLegionToBattle(battleField, legion, isAttacker, center, deps)) {
                joined++;
            }
        }
    }

    return joined;
}

function buildJoinDeps(legionManager: LegionManager, siegeWaiter?: (id: string) => boolean): ReinforcementJoinDeps {
    const cityManager = legionManager.getCityManager();
    return {
        spatialRegistry: legionManager.getSpatialRegistry(),
        removeArmy: (army) => legionManager.removeArmy(army),
        isArmyWaitingSiege: siegeWaiter,
        resolveBattleCityName: (center) => {
            const nearest = cityManager.getNearestCity(null, {
                latitude: center.lat,
                longitude: center.lng,
            });
            return nearest?.name ?? '未知';
        },
    };
}

/** 攻城：轮询 activeSieges */
export function pollSiegeReinforcements(
    activeSieges: Map<string, BattleField>,
    getCityPosition: (cityId: string) => LatLng | null,
    legionManager: LegionManager,
    isArmyWaitingSiege?: (armyId: string) => boolean
): number {
    const deps = buildJoinDeps(legionManager, isArmyWaitingSiege);
    let joined = 0;

    for (const [cityId, battleField] of activeSieges) {
        if (battleField.isOver) continue;
        const center = getCityPosition(cityId);
        if (!center) continue;
        joined += pollBattleFieldReinforcements(battleField, center, deps);
    }

    return joined;
}

/** 野战：轮询 CombatSystem 中 type=field 的战场 */
export function pollFieldBattleReinforcements(
    combatSystem: CombatSystem,
    legionManager: LegionManager
): number {
    const deps = buildJoinDeps(legionManager);
    let joined = 0;

    for (const battleField of combatSystem.getActiveBattleFields()) {
        if (battleField.isOver || battleField.type !== 'field') continue;
        const center = battleField.getReferencePosition();
        joined += pollBattleFieldReinforcements(battleField, center, deps);
    }

    return joined;
}

/** 节流：每 BATTLE_REINFORCEMENT_POLL_INTERVAL_SEC 游戏秒执行一次 */
export function tickBattleReinforcementPoll(
    state: ReinforcementPollState,
    deltaTime: number,
    poll: () => void
): void {
    state.remainingSec -= deltaTime;
    if (state.remainingSec > 0) return;
    state.remainingSec = BATTLE_REINFORCEMENT_POLL_INTERVAL_SEC;
    poll();
}
