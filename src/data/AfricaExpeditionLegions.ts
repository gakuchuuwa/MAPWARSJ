/**
 * 非洲文化区远征精锐军团名（2026-08-24 新增，马里/埃塞俄比亚 2 城）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const AFRICA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    manding: { name: '曼丁哥步兵', tier: 4 },   // 廷巴克图·松迪亚塔：马里帝国以步兵为主的大军
    ethiopia: { name: '步弓手军团', tier: 4 },   // 阿克苏姆·埃扎纳：埃塞俄比亚步弓手
};
