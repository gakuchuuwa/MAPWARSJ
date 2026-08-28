/**
 * 马来文化区远征精锐军团名（2026-08-24 新增，满剌加 1 城；2026-08-29 增马打蓝 1 城）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const MALAY_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    malacca: { name: '爪刀勇士', tier: 4 },   // 马六甲·拜里米苏拉：马来 Karambit 爪刀勇士
    medang: { name: '爪哇象兵', tier: 3 },   // 卡拉桑·帕南卡兰：马打蓝/古爪哇战象兵
    ternate: { name: '摩鹿加水兵', tier: 2 },   // 德尔纳特·巴布拉：卡拉科阿桨帆战船香料群岛突击水军，1575攻陷卡斯特拉要塞
    sulu: { name: '苏禄珠海勇', tier: 3 },   // 霍洛·巴杜卡：苏禄苏丹近卫，潜水夺船/马来短剑吹箭，兵种特色鲜明
    xishudongyin: { name: '王城守备队', tier: 1 },   // 马尼拉·莱加斯皮：西属东印度正规军，驻守马尼拉王城(Intramuros)，重炮火枪，建制延续1571-1898
};
