/**
 * 武将技 · v1 桥接（从 GeneralSkills.ts 拆出，2026-07-13）
 * ts_xxx（现行 TacticalSkillCatalog 条目）→ TacticalSkillDef 格式合成。
 * 同时允许读取已退役的 tac_* 存档 ID，但新数据不得再写 tac_*。
 */
import type { TacticalEffect, TacticalTiming, TacticalSkillDef } from './types';
import { TACTICAL_SKILL_CATALOG } from './catalogs';
import { getTacticalSkillEntry } from '../TacticalSkillCatalog';

/** v1 baseEffect → 旧 effect 桥接（ts_xxx 武将挂载后引擎兼容） */
const V1_EFFECT_BRIDGE: Record<string, { effect: TacticalEffect; timing: TacticalTiming }> = {
    ally_power_mult:            { effect: 'ally_mult_1_2',      timing: 'opening' },
    first_sortie_power_mult:    { effect: 'ally_mult_1_2',      timing: 'opening' },
    first_sortie_comeback_mult: { effect: 'ally_mult_1_2',      timing: 'comeback' },
    enemy_sub_troops_opening:   { effect: 'enemy_sub_troops',   timing: 'opening' },
    ally_add_troops_comeback:   { effect: 'ally_add_troops',    timing: 'comeback' },
    win_casualty_reduction:     { effect: 'ally_casualty_reduce', timing: 'opening' },
    // ── 掷点类 ──
    luck_variance_self:         { effect: 'ally_luck_up',       timing: 'opening' },
    luck_variance_enemy:        { effect: 'enemy_luck_down',    timing: 'opening' },
    luck_lock_self:             { effect: 'ally_luck_lock',     timing: 'opening' },
    recompute_comeback:         { effect: 'ally_recompute',     timing: 'comeback' },
    // ── 兵力类 ──
    ally_add_troops_opening:    { effect: 'ally_add_troops',    timing: 'opening' },
    // ── 战后恢复/咬人类 ──
    elite_casualty_reduction:   { effect: 'ally_elite_casualty', timing: 'opening' },
    lose_enemy_casualty_boost:  { effect: 'lose_effect',        timing: 'comeback' },
    lose_zero_enemy_recovery:   { effect: 'lose_effect',        timing: 'comeback' },
    post_recovery_rate:         { effect: 'ally_recovery',      timing: 'comeback' },
    // ── 克夺反制类 ──
    negate_enemy_skill:         { effect: 'enemy_counter',      timing: 'opening' },
    partial_negate_enemy_skill: { effect: 'enemy_counter',      timing: 'opening' },
    steal_enemy_skill:          { effect: 'enemy_counter',      timing: 'opening' },
    reflect_enemy_opening_cut:  { effect: 'opening_counter',    timing: 'opening' },
    nullify_enemy_opening_cut:  { effect: 'opening_counter',    timing: 'opening' },
    cancel_enemy_terrain_buff:  { effect: 'terrain_counter',    timing: 'opening' },
    halve_enemy_terrain_buff:   { effect: 'terrain_counter',    timing: 'opening' },
    // ts_029 肉薄骨并（dual_sub_troops_opening）已由 v1 原生路径实现双向削兵（GeneralSkillCombat + combat-model）。
};

/** v1 phase → 旧 timing（side_comeback 条件技的 phase 被桥接到 comeback timing） */
function bridgeV1PhaseToTiming(entry: { phase: string; condition: string }): TacticalTiming {
    if (entry.condition === 'side_comeback') return 'comeback';
    if (entry.phase === 'mid_battle_comeback') return 'comeback';
    return 'opening';
}

export function getTacticalSkillDef(skillId: string | null | undefined): TacticalSkillDef | null {
    if (!skillId) return null; // 防御：无战术技（null/空）直接返回，避免下方 startsWith 崩溃
    const direct = TACTICAL_SKILL_CATALOG[skillId];
    if (direct) return direct;
    // v1 桥接：武将已迁移到 ts_xxx，用 v1 catalog 合成旧格式 def
    if (!skillId.startsWith('ts_')) return null;
    const v1 = getTacticalSkillEntry(skillId);
    if (!v1) return null;
    const bridge = V1_EFFECT_BRIDGE[v1.baseEffect];
    if (!bridge) return null;
    const timing = bridgeV1PhaseToTiming(v1);
    const onceEffects: TacticalEffect[] = ['ally_add_troops', 'enemy_sub_troops', 'ally_invincible'];
    return {
        id: v1.id,
        grid: `v1-${v1.index}`,
        displayName: v1.displayName,
        timing,
        effect: bridge.effect,
        magnitude: v1.magnitude,
        isOncePerBattle: timing === 'comeback' || onceEffects.includes(bridge.effect),
    };
}
