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
 *  【2026-07-13】错配减成落地（设计文档"短板局减成"）：
 *  造势缺劣势（强攻型困于死地最致命）→ 0.75；借势/逆势缺优势（不擅平推硬碾）→ 0.9。
 *  优势格只减到 0.9 不减 0.75：优势侧本有 ≥1.5 兵力差，0.75 会在 r=1.5 阈值两侧
 *  造成"兵多反而更弱"的胜率倒挂断崖（如借势 1.49 倍必胜、1.51 倍反低于五成）；
 *  0.9 保留短板又不倒挂。均势列不动 → 等兵力对局不受影响。 */
export const APTITUDE_POWER_MULT: Record<string, Record<'advantage' | 'balance' | 'disadvantage', number>> = {
    create:   { advantage: 1.35, balance: 1.15, disadvantage: 0.75 },
    leverage: { advantage: 0.9,  balance: 1.35, disadvantage: 1.15 },
    reverse:  { advantage: 0.9,  balance: 1.15, disadvantage: 1.3  },
};

/** 逆势劣势战败 → 胜方战损保底倍率（败不垒） */
export const APTITUDE_LOSER_BITE_FLOOR = 1.5;
