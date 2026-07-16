/**
 * 三势·9 格战力系数 —— 层3：武将 aptitude × 兵力局势
 * 对角线对齐最强，对角线对面谷底，借势永居中游。
 */
export const APTITUDE_POWER_MULT: Record<string, Record<'advantage' | 'balance' | 'disadvantage', number>> = {
    //          优势   均势   劣势
    create:   { advantage: 1.40, balance: 1.00, disadvantage: 0.60 },
    leverage: { advantage: 1.10, balance: 1.20, disadvantage: 1.10 },
    reverse:  { advantage: 0.60, balance: 1.00, disadvantage: 1.40 },
};

/** 普将逆局：侧总兵力 ≤ 开战该侧总兵力 × 此比例时触发 */
export const COMEBACK_TROOP_THRESHOLD = 0.80;

/** 逆势劣势战败 → 胜方战损保底倍率（败不垒） */
export const APTITUDE_LOSER_BITE_FLOOR = 1.5;

/** 翻盘重掷 luck 区间：极小概率（等势层上线后由势调整） */
export const COMEBACK_LUCK_RANGE: [number, number] = [0.25, 0.45];

/**
 * 第四层·攻防风格战力系数
 * 武将 attackStyle → 攻/守不同角色下的 roll 乘数
 *   attack:  攻城专精 ×1.30，守城崩盘 ×0.70
 *   defense: 守城专精 ×1.30，攻城崩盘 ×0.70
 *   balanced:攻守双全，两面 ×1.20
 */
export const ATTACK_STYLE_POWER_MULT: Record<string, Record<'attack' | 'defense', number>> = {
    attack:   { attack: 1.30, defense: 0.70 },
    defense:  { attack: 0.70, defense: 1.30 },
    balanced: { attack: 1.20, defense: 1.20 },
};
