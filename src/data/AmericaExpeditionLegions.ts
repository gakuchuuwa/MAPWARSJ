/**
 * 美洲文化区远征精锐军团名（2026-08-24 新增，阿兹特克/印加/玛雅/马普切/穆伊斯卡/图皮 6 城）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const AMERICA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    aztec: { name: '美洲豹武士', tier: 3 },  // 特诺奇提特兰·库奥特莫克：阿兹特克美洲豹武士（荣冠战争核心）
    inca: { name: '印加枪兵长', tier: 3 },
    maya: { name: '羽箭手', tier: 4 },       // 蒂卡尔·亚斯纳昌：玛雅贵族羽箭手
    mapuche: { name: '科纳勇士', tier: 3 },  // 图卡佩尔·劳塔罗：马普切精英青年战士，图卡佩尔大捷
    muisca: { name: '格查战士', tier: 3 },   // 巴卡塔·萨瓜曼奇卡：穆伊斯卡精锐战士（木乃伊传统）
    tupi: { name: '图皮战士', tier: 4 },     // 瓜纳巴拉·阿拉里博亚：图皮弓手
};
