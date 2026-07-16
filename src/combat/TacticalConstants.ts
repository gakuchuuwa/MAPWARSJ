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