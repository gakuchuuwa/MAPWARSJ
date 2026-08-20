/**
 * ZOOM 13 环境生成器 · 确定性随机数（2026-08-20）。
 *
 * 环境随机数必须可复现：同一 seed → 完全相同的环境。战斗 AI / 伤害 / 出兵
 * 一律不得使用本模块的随机源（它们继续用 Math.random / 引擎自己的随机）。
 *
 * 种子来源（Scene13WarLayer.start 内派生）：战场中心经纬度 + 双方 factionId +
 * 双方 generalId，全部为真实数据。禁止凭空假设存在 battleId。
 */

/** 随机源接口：生成器内部只依赖这个抽象，便于测试注入固定种子 */
export interface RandomSource {
    /** [0, 1) */
    next(): number;
    /** 闭区间 [min, max] 的整数（含两端） */
    int(min: number, max: number): number;
    /** 从非空数组等概率抽一个 */
    pick<T>(items: readonly T[]): T;
    /** 以 probability 的概率返回 true */
    chance(probability: number): boolean;
}

/** 兜底随机源（Math.random 包装）：供尚未迁移到 PRNG 的旧调用点过渡用 */
export const mathRandomSource: RandomSource = {
    next: () => Math.random(),
    int: (min, max) => min + ((Math.random() * (max - min + 1)) | 0),
    pick: (items) => items[(Math.random() * items.length) | 0],
    chance: (p) => Math.random() < p,
};

/** FNV-1a 32 位哈希：把任意字符串（种子）稳定映射成 uint32 */
export function hashString(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32：小体积、高质量、完全确定性的 32 位种子 PRNG */
function mulberry32(a: number): () => number {
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** 由种子字符串构造确定性随机源（hash → mulberry32） */
export function createRandom(seed: string): RandomSource {
    const gen = mulberry32(hashString(seed));
    return {
        next: () => gen(),
        int: (min, max) => min + ((gen() * (max - min + 1)) | 0),
        pick: (items) => items[(gen() * items.length) | 0],
        chance: (p) => gen() < p,
    };
}
