/**
 * 非洲文化区远征精锐军团名（2026-08-24 新增，马里/埃塞俄比亚 2 城）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const AFRICA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    // ── 2026-10-24 环非洲新港（皆史无具名番号，只能 T4 存在之兵）──
    kilwa: { name: '基尔瓦卫队', tier: 4 },      // 基尔瓦苏丹石堡守军/船队（无专名）
    mombasa: { name: '蒙巴萨弓手', tier: 4 },    // 1528 守军 600 弓手＋8 炮、1632 穆松戈罗弓手
    mogadishu: { name: '摩加迪沙军', tier: 4 },  // 苏丹维齐尔/军事指挥官统带，1507 守城动员骑兵步兵战船

    manding: { name: '飞刀女兵', tier: 3 },
    ethiopia: { name: '弯刀勇士', tier: 3 },
    zhagewei: { name: '阿高武士', tier: 4 },
    kushi: { name: '努比亚弓手', tier: 3 },
    jienei: { name: '杰内水军', tier: 4 },
    suosuo: { name: '索索骑兵', tier: 3 },  // 库姆比萨利赫·苏曼古鲁：索索骑兵
    ghana_diguo: { name: '加纳铁骑', tier: 3 },  // 库姆比萨利赫·加纳帝国（通卡·马宁）：al-Bakri 记加纳军以骑兵与弓手为主，取近卫骑兵
    saimien: { name: '塞米恩战士', tier: 3 },  // 塞米恩·尤迪特：塞米恩贝塔以色列战士
    adal: { name: '阿达尔火枪', tier: 2 },   // 塞拉·格拉尼：奥斯曼援助重装火绳枪+精钢弯刀圣战突击主力
};
