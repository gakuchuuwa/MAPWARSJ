import { Army } from './Army';
import { SiegeData } from '../types/core';
import type { IBattleUnit } from '../combat/CombatSystem';
import type { BattleField } from '../combat/BattleField';

import { isQinMainLegion } from '../data/legions';

/** 历史剧本全局唯一「秦军」：事件外遇敌必胜，战后补满默认兵力 */
export const SCRIPTED_QIN_TROOPS = 10000;

export function isScriptedQinLegion(army: Army): boolean {
    return isQinMainLegion(army) && !army.isDestroyed;
}

export function restoreScriptedQinTroops(armies: Army | Army[]): void {
    const list = Array.isArray(armies) ? armies : [armies];
    for (const army of list) {
        if (isScriptedQinLegion(army)) army.setTroops(SCRIPTED_QIN_TROOPS);
    }
}

export function restoreScriptedQinTroopsInBattle(units: IBattleUnit[]): void {
    for (const unit of units) {
        const entity = unit.getEntity?.() as Army | undefined;
        if (entity?.type === 'legion') restoreScriptedQinTroops(entity);
    }
}

/** 援军加入：事件外秦军介入则锁定其所在方必胜（剧本判负时不改） */
export function applyScriptedQinReinforcementPreset(
    battleField: BattleField,
    legion: Army,
    isAttacker: boolean
): void {
    if (!isScriptedQinLegion(legion)) return;

    const side: 'attacker' | 'defender' = isAttacker ? 'attacker' : 'defender';
    const existing = battleField.getPresetResult();
    if (existing && shouldScriptedQinBeDestroyed(existing, legion, side)) return;

    battleField.applyPresetResult(isAttacker ? 'attacker_win' : 'defender_win');
}

/** 野战 / 非事件遭遇：秦军在场则强制预设胜负 */
export function resolveScriptedQinPreset(
    attLegions: Army[],
    defLegions: Army[]
): 'attacker_win' | 'defender_win' | undefined {
    if (attLegions.some(isScriptedQinLegion)) return 'attacker_win';
    if (defLegions.some(isScriptedQinLegion)) return 'defender_win';
    return undefined;
}

/** 攻城：事件写死的 result 优先；否则秦军遇敌必胜 */
export function resolveSiegeBattleResult(
    siegeData: SiegeData,
    attackerArmy: Army,
    nearbyAttackers: Army[],
    nearbyDefenders: Army[]
): 'attacker_win' | 'defender_win' | undefined {
    if (siegeData.result) return siegeData.result;
    return resolveScriptedQinPreset([attackerArmy, ...nearbyAttackers], nearbyDefenders);
}

/** 剧本明确判负时仍允许销毁秦军（如肥之战）；否则败北回调不销毁 */
export function shouldScriptedQinBeDestroyed(
    presetResult: 'attacker_win' | 'defender_win' | undefined,
    army: Army,
    side: 'attacker' | 'defender'
): boolean {
    if (!isScriptedQinLegion(army)) return true;
    if (!presetResult) return false;
    if (presetResult === 'defender_win' && side === 'attacker') return true;
    if (presetResult === 'attacker_win' && side === 'defender') return true;
    return false;
}
