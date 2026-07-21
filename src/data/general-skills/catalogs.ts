/**
 * 武将技 · 技能目录（从 GeneralSkills.ts 拆出，2026-07-13）
 * 旧 tac_* 存档兼容定义 / 战略技 STRATEGIC_SKILL_CATALOG / 守军·援军系统技。
 * ⚠ 批量脚本不得写本文件——武将档案在 profiles.ts。
 */
import type { CityType } from '../../types/core';
import type { TacticalSkillDef, StrategicSkillDef } from './types';

/**
 * @deprecated 仅供读取旧存档中的 tac_01…tac_10。
 * 新武将不得再分配 tac_*；现行战术技唯一目录是 TacticalSkillCatalog.ts 的 ts_* 条目。
 */

export const TACTICAL_SKILL_CATALOG: Record<string, TacticalSkillDef> = {

    // 【2026-07-03】①以逸待劳改为「己方有效战力×1.2」（原 ally_add_troops +20%真实兵会让满编名将军团越打越滚越多）。

    //   现与③侵掠如火同机制（掷色乘区，不写真实兵力）：≈×1.2≈85% 胜率、与②④⑤同档，且零兵力膨胀。

    tac_01: { id: 'tac_01', grid: '①', displayName: '以逸待劳', timing: 'opening', effect: 'ally_mult_1_2', magnitude: 1.2 },

    tac_02: { id: 'tac_02', grid: '②', displayName: '避实击虚', timing: 'opening', effect: 'enemy_sub_troops', magnitude: 0.167, isOncePerBattle: true },

    tac_03: { id: 'tac_03', grid: '③', displayName: '侵掠如火', timing: 'opening', effect: 'ally_mult_1_2', magnitude: 1.2 },

    tac_04: { id: 'tac_04', grid: '④', displayName: '不战而屈', timing: 'opening', effect: 'enemy_mult_0_8', magnitude: 0.833 },

    tac_05: { id: 'tac_05', grid: '⑤', displayName: '不动如山', timing: 'opening', effect: 'ally_invincible', magnitude: 3, rollEdge: 1.2, isOncePerBattle: true },

    tac_06: { id: 'tac_06', grid: '⑥', displayName: '哀兵必胜', timing: 'comeback', effect: 'ally_add_troops', magnitude: 0.12, isOncePerBattle: true },

    tac_07: { id: 'tac_07', grid: '⑦', displayName: '攻其不备', timing: 'comeback', effect: 'enemy_sub_troops', magnitude: 0.167, isOncePerBattle: true },

    tac_08: { id: 'tac_08', grid: '⑧', displayName: '置之死地', timing: 'comeback', effect: 'ally_mult_1_2', magnitude: 1.2, isOncePerBattle: true },

    tac_09: { id: 'tac_09', grid: '⑨', displayName: '釜底抽薪', timing: 'comeback', effect: 'enemy_mult_0_8', magnitude: 0.833, isOncePerBattle: true },

    tac_10: { id: 'tac_10', grid: '⑩', displayName: '深沟高垒', timing: 'comeback', effect: 'ally_invincible', magnitude: 3, rollEdge: 1.2, isOncePerBattle: true },

};



/**

 * 战略技 v2 · 六大类 + 战术类（2026-07-12 定名）

 *

 * | 类     | 现有技 |

 * |--------|--------|

 * | 加速类 | str_01 / str_10 / str_11 / str_12 |

 * | 加兵类 | str_13 / str_07 / str_28 |

 * | 视野类 | str_16 / str_17 / str_18 |

 * | 威慑类 | str_06 / str_19 / str_20 / str_21 |

 * | 纵横类 | str_22 / str_23 / str_24 |

 * | 防务类 | str_05 / str_25 / str_26 / str_27 |

 * | 战术类 | str_02 / str_03 / str_04 / str_08 / str_09 |

 *

 * 战术类 = 战斗面板乘区，非大地图战略；勿按六大类新配将。

 */

export const STRATEGIC_SKILL_CATALOG: Record<string, StrategicSkillDef> = {

    // ── 战术类（战斗面板乘区，非大地图战略）──

    // str_03: { id: "str_03", grid: 'S③', displayName: '因敌制胜', effect: 'equal_power_mult', magnitude: 1.3, engineStatus: 'ready', category: 'tactical', note: '双方兵力接近时自身战力 ×1.3' },

    // str_04: { id: "str_04", grid: 'S④', displayName: '威震华夏', effect: 'advantage_skill_effect_mult', magnitude: 1.2, engineStatus: 'ready', category: 'tactical', note: '优势时战术技效果 ×1.2' },

    // str_09: { id: "str_09", grid: 'S⑨', displayName: '以寡击众', effect: 'disadvantage_power_mult', magnitude: 1.4, engineStatus: 'ready', category: 'tactical', note: '劣势时自身战力 ×1.4' },

    // str_02: { id: "str_02", grid: 'S②', displayName: '因地制宜', effect: 'terrain_tactical_double', magnitude: 2.0, engineStatus: 'ready', category: 'tactical', note: '地形匹配时战术技效果翻倍' },

    // str_08: { id: "str_08", grid: 'S⑧', displayName: '固若金汤', effect: 'garrison_defense_mult', magnitude: 1.3, engineStatus: 'ready', category: 'tactical', note: '守城时城防战力 ×1.3' },

    // ── 加速类 ──

    str_01: { id: 'str_01', grid: 'S①', displayName: '兵贵神速', effect: 'march_speed_mult', magnitude: 1.2, engineStatus: 'ready', category: 'speed', note: '行军速度 ×1.2（逆势·劣势突围）' },

    str_10: { id: 'str_10', grid: 'S⑩', displayName: '如履平地', effect: 'mountain_march_immunity', magnitude: 1, engineStatus: 'ready', category: 'speed', note: '山地按平原速度走（均势·迂回奇袭）' },

    str_11: { id: 'str_11', grid: 'S⑪', displayName: '长驱深入', effect: 'ignore_small_city_zoc', magnitude: 0.5, engineStatus: 'ready', category: 'speed', note: '远征军团默认：50% 概率绕过 small_city ZOC（不占武将战略格；非远征时仅 str_11 将可触发）' },

    str_12: { id: 'str_12', grid: 'S⑫', displayName: '乘胜追击', effect: 'skip_post_battle_rest', magnitude: 0, engineStatus: 'ready', category: 'speed', note: '胜后休整置 0（造势）' },

    // ── 加兵类 ──

    str_13: { id: 'str_13', grid: 'S⑬', displayName: '以战养战', effect: 'march_attrition_immunity', magnitude: 1, engineStatus: 'ready', category: 'supply', note: '行军减兵全免（均势）' },

    str_07: { id: 'str_07', grid: 'S⑦', displayName: '因粮于敌', effect: 'post_battle_troop_pct', magnitude: 0, engineStatus: 'ready', category: 'supply', postBattlePctByCityType: { pass: 0.01, small_city: 0.02, medium_city: 0.03, big_city: 0.04 }, note: '攻城胜后按城型补兵（逆势·以战养战）' },

    str_28: { id: 'str_28', grid: 'S㉘', displayName: '调兵遣将', effect: 'recruit_troops_mult', magnitude: 1.10, engineStatus: 'ready', category: 'supply', note: '征兵时出征兵力 ×1.1（造势）' },

    str_06: { id: 'str_06', grid: 'S⑥', displayName: '招降纳叛', effect: 'post_battle_recruit_enemy_pct', magnitude: 0.10, engineStatus: 'ready', category: 'supply', note: '胜后收编敌10%（造势）' },

    // ── 威慑类 ──

    // ── 防务类 ──

    str_05: { id: 'str_05', grid: 'S⑤', displayName: '坚壁清野', effect: 'siege_approach_attrition', magnitude: 0.10, engineStatus: 'ready', category: 'defense', note: '本城被攻击（含沿途）时来犯军每秒减10%（逆势，录入锚将）' },

    // ── 视野类 ──

    str_16: { id: 'str_16', grid: 'S⑯', displayName: '神出鬼没', effect: 'hide_during_peacetime', magnitude: 1, engineStatus: 'ready', category: 'vision', note: '非战斗不可见（均势）' },

    str_17: { id: 'str_17', grid: 'S⑰', displayName: '偃旗息鼓', effect: 'hide_troop_count', magnitude: 1, engineStatus: 'ready', category: 'vision', note: '非战斗隐藏武将名、精锐番号与兵力（逆势）' },

    str_18: { id: 'str_18', grid: 'S⑱', displayName: '虚张声势', effect: 'bluff_troop_count', magnitude: 2, engineStatus: 'ready', category: 'vision', note: '非战斗兵力×2（造势）' },

    // ── 威慑类 ──

    str_19: { id: 'str_19', grid: 'S⑲', displayName: '不战而屈', effect: 'intimidate_instant_win', magnitude: 0.01, engineStatus: 'ready', category: 'deterrence', note: '优势1%不战占城（造势）' },

    str_20: { id: 'str_20', grid: 'S⑳', displayName: '先声夺人', effect: 'pre_battle_intimidate', magnitude: 0.10, engineStatus: 'ready', category: 'deterrence', note: '攻城前削守军10%（均势）' },

    str_21: { id: 'str_21', grid: 'S㉑', displayName: '越城而走', effect: 'skip_disadvantaged_siege', magnitude: 0.10, engineStatus: 'ready', category: 'deterrence', note: '劣势10%跳城重选（逆势）' },

    // ── 纵横类 ──

    str_22: { id: 'str_22', grid: 'S㉒', displayName: '纵横捭阖', effect: 'sabotage_garrison', magnitude: 0.10, engineStatus: 'ready', category: 'diplomacy', note: '10%概率攻城封杀守将/精（造势）。原名翦除羽翼；magnitude=触发概率' },

    str_23: { id: 'str_23', grid: 'S㉓', displayName: '飞箝擒王', effect: 'sabotage_general', magnitude: 0.15, engineStatus: 'ready', category: 'diplomacy', note: '15%的几率，攻城战封杀守将（均势）' },

    str_24: { id: 'str_24', grid: 'S㉔', displayName: '转丸破军', effect: 'sabotage_elite', magnitude: 0.15, engineStatus: 'ready', category: 'diplomacy', note: '15%的几率，攻城战封杀精锐（逆势）' },

    // ── 防务类 ──

    str_25: { id: 'str_25', grid: 'S㉕', displayName: '足食足兵', effect: 'city_growth_mult', magnitude: 2.0, engineStatus: 'ready', category: 'defense', note: '产兵加速×2（造势）' },

    str_26: { id: 'str_26', grid: 'S㉖', displayName: '招兵买马', effect: 'recruit_cooldown_mult', magnitude: 0.5, engineStatus: 'ready', category: 'defense', note: '军团离城即可再募（造势）' },

    str_27: { id: 'str_27', grid: 'S㉗', displayName: '屯兵经略', effect: 'garrison_reserve_troops', magnitude: 2000, engineStatus: 'ready', category: 'defense', note: '征兵后留兵≥2000（均势）' },

};



/** 守军系统技 effect（非武将战术技 / 战略技） */

export type GarrisonSystemEffect = 'pass_garrison_mult';



export interface GarrisonSystemSkillDef {

    displayName: string;

}



export const PASS_GARRISON_DEFENSE_SKILL: GarrisonSystemSkillDef = {

    displayName: '据险而守',

};



/** 14 文化中心据点守军系统技（守土继绝，与关隘「据险而守」同机制不同名） */

export const REGION_CENTER_DEFENSE_SKILL: GarrisonSystemSkillDef = {

    displayName: '守土继绝',

};



export type ReinforcementSystemEffect = 'reinforcement_join_luck';



export interface ReinforcementJoinSkillDef {

    displayName: string;

    luckMin: number;

    luckMax: number;

}



export const REINFORCEMENT_JOIN_SKILL: ReinforcementJoinSkillDef = {

    displayName: '合兵一处',

    luckMin: 0.9,

    luckMax: 1.1,

};



/** 全员通用系统技（每将皆有，不占技能槽，静默生效不飘字；战斗结算引擎直引） */

/** 整编归伍：胜后收编败军。普通取胜 = 敌开战总兵 15%，以少胜多（胜方开战兵 < 败方）= 30%；
 *  全侧按兵力分摊，逐军团封顶军团上限（maxTroops）。与战略技「招降纳叛」(+10%) 叠加。 */
export interface ConscriptDefeatedSkillDef {
    displayName: string;
    baseRate: number;
    underdogRate: number;
}

export const CONSCRIPT_DEFEATED_SKILL: ConscriptDefeatedSkillDef = {
    displayName: '整编归伍',
    baseRate: 0.15,
    underdogRate: 0.30,
};

/** 裹创复战：胜方恢复本场战损（比例走 GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE）。
 *  本常量只提供技能名，数值不在此重复，避免两处漂移。 */
export const POST_BATTLE_RECOVERY_SKILL: { displayName: string } = {
    displayName: '裹创复战',
};

export function getStrategicSkillDef(skillId: string): StrategicSkillDef | null {
    return STRATEGIC_SKILL_CATALOG[skillId] ?? null;
}

/** S④威震华夏等：攻城胜后按守方城型取续航比例 */
export function resolvePostBattlePctByCityType(
    skill: StrategicSkillDef | null | undefined,
    cityType: CityType | null | undefined,
): number {
    if (!skill?.postBattlePctByCityType || !cityType) return 0;
    return skill.postBattlePctByCityType[cityType] ?? 0;
}
