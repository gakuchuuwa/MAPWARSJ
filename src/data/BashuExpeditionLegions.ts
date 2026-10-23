/**
 * 川蜀文化区远征精锐军团名（BASHU）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复
 * - 依据 史料/古代精锐部队.md §8 川蜀 10 支全收录
 * - 蜀汉多番号分流：蜀/夔/谯/卓各挂一军
 * - 据点取川东近乡或史载成军/战场地
 */
export const BASHU_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  //  miaomin: { name: '苗疆义军', tier: 4 },      // 平陇·石柳邓苗民 — 已迁 DianQianExpeditionLegions
  //  dongzu: { name: '侗家义军', tier: 4 },       // 雷公山·吴勉侗族 — 已迁 DianQianExpeditionLegions

  chenzhou_d: { name: '辰州戍兵', tier: 4 },     // 沅陵·辰州戍兵
  jingmen: { name: '长坂血骑', tier: 3 },        // 赵云长坂坡，全民级文化IP，极高文化知名度，升T2
  bandun: { name: '賨人勇士', tier: 3 },       // 还定三秦的巴渝舞武士，中华武术发源级代表，升入T3知名
  shu: { name: '白毦精兵', tier: 2 },           // 刘备的亲卫特种兵，在夷陵之战打出极其强悍的战术掩护保卫刘备，升入T2战术
  // 悬棺武士除名
    chenghan: { name: '流民帅突骑', tier: 2 },
  ba: { name: '巴渝劲卒', tier: 3 },          // 巴渝舞武士的另一称谓，极其著名的西南精锐，升入T3知名
    qiuchi: { name: '百顷氐兵', tier: 3 },
  // ── 2026-06-16 新增：4座西南名关 ──
  yidou: { name: '夷陵奇兵', tier: 2 },          // 三国夷陵之战火烧连营，显著文化知名度，升T2
  // 权州戍兵除名（生造）
  fuguo: { name: '附国羌兵', tier: 4 },  // 芒康宗·隋附国羌人部落兵
qianzhong: { name: '乾嘉苗兵', tier: 4 },     // 芷江·吴八月攻克沅州（缺乏极其著名的战术高光，降T3）
    dangchang: { name: '陇右铁骑', tier: 2 },
  // ── 2026-06-18：武陵/叙永/慈利/秀山/房陵/珙县/来凤精锐 ──
    zhongxiang: { name: '锦帆贼', tier: 2 },
    xiang_d: { name: '散毛土兵', tier: 4 },
    wuling: { name: '五溪藤甲', tier: 3 },            // 三国藤甲兵文化符号（火烧藤甲），显著文化知名度，升T2
    haikou: { name: '五岛水军', tier: 4 },
};
