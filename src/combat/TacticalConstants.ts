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

/** 三势适性：势×局 开战战力系数（单一真理表；GeneralSkillCombat / combat-model 共用）
 *  【2026-07-16】0.7–1.3 区间统一设计：
 *  造势：顺风碾压(1.30) / 均势(1.00) / 逆风崩盘(0.70)
 *  借势：永不吃亏永不高光(0.90/1.20/0.90)
 *  逆势：顺风松懈(0.70) / 均势(1.00) / 逆风觉醒(1.30) */
export const APTITUDE_POWER_MULT: Record<string, Record<'advantage' | 'balance' | 'disadvantage', number>> = {
    create:   { advantage: 1.30, balance: 1.00, disadvantage: 0.70 },
    leverage: { advantage: 0.90, balance: 1.20, disadvantage: 0.90 },
    reverse:  { advantage: 0.70, balance: 1.00, disadvantage: 1.30 },
};

/** 逆势劣势战败 → 胜方战损保底倍率（败不垒） */
export const APTITUDE_LOSER_BITE_FLOOR = 1.5;

/** 翻盘重掷 luck 区间：极小概率（等势层上线后由势调整） */
export const COMEBACK_LUCK_RANGE: [number, number] = [0.25, 0.45];

/**
 * 第四层·攻防风格战力系数（2026-07-16）
 * 武将 attackStyle → 攻/守不同角色下的 roll 乘数
 *   attack:  攻城专精，攻方 ×1.25，守方 ×1.00
 *   defense: 守城专精，攻方 ×1.00，守方 ×1.25
 *   balanced:攻守双全，两面 ×1.20
 */
export const ATTACK_STYLE_POWER_MULT: Record<string, Record<'attack' | 'defense', number>> = {
    attack:   { attack: 1.25, defense: 1.00 },
    defense:  { attack: 1.00, defense: 1.25 },
    balanced: { attack: 1.20, defense: 1.20 },
};
