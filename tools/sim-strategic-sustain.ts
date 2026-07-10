/**
 * 胜后战略续航 — 对齐 GeneralSkillCombat.applyPostBattleStrategicBonus
 * 在 combat-model 基础战后恢复 30% 之后调用。
 *
 * 以战养战 tick 窗口：
 *   · 连战/全图审计（无地图行军）→ TIME.POST_BATTLE_REST（战后驻留秒数）
 *   · 真游戏行军 → FollowResupplySystem 按实际 delta 累计
 */
import { GameConfig } from '../src/config/GameConfig';
import { getStrategicSkillDef } from '../src/data/GeneralSkills';

/** 以战养战：给定军团上限与 tick 秒数，应补兵力 */
export function computeFieldResupplyBonus(troopCap: number, travelSec: number): number {
    const rate = GameConfig.COMBAT.FIELD_RESUPPLY_RATE_PER_CAP_PER_SEC;
    return Math.floor(troopCap * rate * travelSec);
}

/** 连战模拟默认 tick 秒数 = 战后驻留（与 GameTime.POST_BATTLE_REST 一致） */
export function getChainSimFieldResupplySec(): number {
    return GameConfig.TIME.POST_BATTLE_REST;
}

/**
 * 胜后叠战略续航：因粮于敌 / 隐藏1% / 以战养战
 * @param travelSec 以战养战 tick 秒数；默认战后驻留 3 秒
 */
export function applyStrategicSustainAfterVictory(
    survivors: number,
    troopCap: number,
    strategicSkillId: string | null | undefined,
    travelSec: number = getChainSimFieldResupplySec(),
): number {
    let t = survivors;
    const str = strategicSkillId ? getStrategicSkillDef(strategicSkillId) : null;
    if (!str) return Math.min(troopCap, t);

    if (str.effect === 'post_battle_troop_pct') {
        t += Math.floor(t * str.magnitude);
    } else if (str.hiddenPostBattlePct && str.hiddenPostBattlePct > 0) {
        t += Math.floor(t * str.hiddenPostBattlePct);
    }
    if (str.effect === 'field_resupply') {
        t += computeFieldResupplyBonus(troopCap, travelSec);
    }
    return Math.min(troopCap, t);
}
