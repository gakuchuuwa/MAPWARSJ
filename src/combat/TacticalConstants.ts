/**
 * 三势环（第4环）—— 兵势 × 将势，9 格系数
 * 铁律「每环平衡」：行等 3.30、列等 3.30，全在 1.00–1.20 内。
 */
export const APTITUDE_POWER_MULT: Record<string, Record<'advantage' | 'balance' | 'disadvantage', number>> = {
    //          优势   均势   劣势
    create:   { advantage: 1.20, balance: 1.10, disadvantage: 1.00 }, // 造势
    leverage: { advantage: 1.00, balance: 1.20, disadvantage: 1.10 }, // 借势
    reverse:  { advantage: 1.10, balance: 1.00, disadvantage: 1.20 }, // 逆势
};

/** 普将逆局：侧总兵力 ≤ 开战该侧总兵力 × 此比例时触发 */
export const COMEBACK_TROOP_THRESHOLD = 0.80;

/**
 * 战斗三幕进度分界（与 BattleField 战损 / CombatUI 摆幅 / 武将技脉冲 / 攻城火势共用）。
 * 主人 2026-07 定：12s + 12s + 6s @ 30s 有将战 → 40% / 40% / 20%。
 *   第一幕 胶着   0%   ~ 40%
 *   第二幕 相持  40%   ~ 80%
 *   第三幕 溃败  80%   ~ 100%
 * 放在本叶子模块（零依赖），供 map 层等无法引入 GeneralSkillCombat 的模块直接取用；
 * GeneralSkillCombat 原样再导出，旧引用不受影响。
 */
export const PHASE_STALEMATE_START = 0.4;
export const PHASE_COLLAPSE_START = 0.8;

/** 三幕起点比例，按序：第一幕 0、第二幕 0.4、第三幕 0.8 */
export const PHASE_START_RATIOS: readonly number[] = [0, PHASE_STALEMATE_START, PHASE_COLLAPSE_START];

/**
 * 局势判定阈值：我方/敌方 > 1.5 优势，< 0.67 劣势，其间均势。
 * 三势系数、技能脉冲排序、战斗时长共用此定义。
 */
export const SITUATION_ADVANTAGE_RATIO = 1.5;
export const SITUATION_DISADVANTAGE_RATIO = 0.67;

export type SituationKind = 'advantage' | 'balance' | 'disadvantage';

/** 按「我方/敌方」比值判局势（比值可来自兵力，也可来自八环乘完的有效战力） */
export function resolveSituationKind(selfOverOpponent: number): SituationKind {
    if (selfOverOpponent > SITUATION_ADVANTAGE_RATIO) return 'advantage';
    if (selfOverOpponent < SITUATION_DISADVANTAGE_RATIO) return 'disadvantage';
    return 'balance';
}

/** 逆势劣势战败 → 胜方战损保底倍率（败不垒） */
export const APTITUDE_LOSER_BITE_FLOOR = 1.5;

/**
 * 败战·险 翻盘重掷 luck 区间（六计中唯一能反转胜负的计）。
 * 在册/不在册均值同为 0.35，在册更宽——典故主更可能掷出 0.45 的高值，也更可能掷崩。
 */
export const COMEBACK_LUCK_RANGE: [number, number] = [0.25, 0.45];
/** 不在册（通用败战技）翻盘重掷区间：更窄更平庸 */
export const COMEBACK_LUCK_RANGE_GENERIC: [number, number] = [0.30, 0.40];

/**
 * 攻防环（第5环）—— 攻方/守方 × attackStyle
 *   善攻：攻城×1.20 / 守城×1.00 —— 擅长攻，守也不扣
 *   善防：攻城×1.00 / 守城×1.20 —— 擅长守，攻也不扣
 *   双行：攻城×1.20 / 守城×1.20 —— 既能攻又能守
 */
export const ATTACK_STYLE_POWER_MULT: Record<string, Record<'attack' | 'defense', number>> = {
    attack:   { attack: 1.20, defense: 1.00 },  // 善攻
    defense:  { attack: 1.00, defense: 1.20 },  // 善防
    balanced: { attack: 1.20, defense: 1.20 },  // 双行（既能攻又能守）
};

/**
 * 第五层·名将光环（2026-07-16 · 第 8 环）
 * 名将 (tier='famous') ×1.20，普将 ×1.00。
 */
export const FAMOUS_GENERAL_MULT = 1.20;
