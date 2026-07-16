/**
 * 三势·9 格战力系数 —— 层3：武将 aptitude × 兵力局势
 * 不对称设计（2026-07-16 CC 审查定稿）：
 *   本命格 1.20、均势格 1.00、优势格错配 0.90（防断崖：0.90×1.5=1.35 > 运气 1.22）、劣势格错配 0.80
 */
export const APTITUDE_POWER_MULT: Record<string, Record<'advantage' | 'balance' | 'disadvantage', number>> = {
    //          优势   均势   劣势
    create:   { advantage: 1.20, balance: 1.00, disadvantage: 0.80 },
    leverage: { advantage: 0.90, balance: 1.20, disadvantage: 0.80 },
    reverse:  { advantage: 0.90, balance: 1.00, disadvantage: 1.20 },
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
 *   专精本位 1.20 > 双行 1.10 > 专精错位 0.80
 */
export const ATTACK_STYLE_POWER_MULT: Record<string, Record<'attack' | 'defense', number>> = {
    attack:   { attack: 1.20, defense: 0.80 },
    defense:  { attack: 0.80, defense: 1.20 },
    balanced: { attack: 1.10, defense: 1.10 },
};
