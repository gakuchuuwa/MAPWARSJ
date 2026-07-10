/**
 * 战术技纯常量（无浏览器 / Vite 依赖）
 * ─────────────────────────────────────────
 * 供 TacticalSkillResolver / 审计脚本 / combat-model 等纯逻辑侧引用，
 * 避免拉入 GeneralSkillCombat 整条战斗 + 浏览器依赖链（曾导致 tsx 审计报 virtual: 加载失败）。
 */

/** 普将逆局：侧总兵力 ≤ 开战该侧总兵力 × 此比例时触发
 *  【2026-07-03】0.6→0.80：0.6 触发太晚（敌已 ~80%），逆局技几乎无法翻盘；
 *  提到 0.80 并配合「逆局重算掷 luck」(BattleField)，逆局技胜率 ≈ 开局技 ~85%，武将技间平衡。 */
export const COMEBACK_TROOP_THRESHOLD = 0.80;

/** 三势适性：势×局 开战战力系数（单一真理表；GeneralSkillCombat / combat-model 共用） */
export const APTITUDE_POWER_MULT: Record<string, Record<'advantage' | 'balance' | 'disadvantage', number>> = {
    create:   { advantage: 1.35, balance: 1.15, disadvantage: 1.0  },
    leverage: { advantage: 1.1,  balance: 1.35, disadvantage: 1.15 },
    reverse:  { advantage: 1.0,  balance: 1.15, disadvantage: 1.3  },
};

/** 逆势劣势战败 → 胜方战损保底倍率（败不垒） */
export const APTITUDE_LOSER_BITE_FLOOR = 1.5;
