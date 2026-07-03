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
