/**
 * 非洲文化区远征精锐军团名（2026-08-24 新增，马里/埃塞俄比亚 2 城）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const AFRICA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    manding: { name: '飞刀女兵', tier: 3 },
    ethiopia: { name: '弯刀勇士', tier: 3 },
    zhagewei: { name: '阿高武士', tier: 4 },
    kushi: { name: '努比亚弓手', tier: 3 },
    jienei: { name: '杰内水军', tier: 4 },
};