/**
 * 河西文化区远征精锐军团名（HEXI / RegionSystem「河西」）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复；史料具名
 * - 依据 史料/古代精锐部队.md §7 河西 12 支
 * - §7 #5 泼喜军（骆驼抛石）→ 不收；#12 嘉峪关戍卒（火器）→ 不收
 * - 三者防重：见 ExpeditionLegions.ts、ExpeditionTripleNameAllow.ts
 */
export const HEXI_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  xiliang: { name: '西凉铁骑', tier: 1 },       // 皋兰·§7 #1 马腾韩遂马超（旗=西凉·政权，§12.1.1 白名单）
  dangxiang: { name: '铁鹞子', tier: 0 },        // 兴庆府·§7 #2 西夏元昊直辖重骑
  weiming: { name: '步跋子', tier: 1 },          // 河南地·§7 #3 西夏步战精锐
  yeli: { name: '擒生军', tier: 3 },             // 克夷门·§7 #6 西夏监军司擒俘前锋（野利氏权臣）
  guiyi: { name: '沙州劲旅', tier: 3 },          // 敦煌·§7 #4 张议潮归义军（番号避旗号「归义」及「义」字）
  xianlingqiang: { name: '凉州大马', tier: 3 },  // 允吾·§7 #7 金城羌氐·凉州边民铁骑
  tufa_d: { name: '南凉铁骑', tier: 1 },         // 浇河·§7 #8 秃发鲜卑（番号避旗号「秃发」）
  juqu_d: { name: '北凉精锐', tier: 3 },         // 张掖·§7 #9 沮渠蒙逊卢水胡（番号避旗号「沮渠」）
  liang: { name: '凉州突骑', tier: 2 },          // 姑臧·后汉凉州精锐骑兵（突骑＝冲锋陷阵突击力量）
  hunxie: { name: '甘州铁骑', tier: 1 },         // 酒泉城·§7 #11 甘州回鹘（旗=浑邪；草原 huige 已占「回鹘铁骑」）
  qifu_d: { name: '苑川突骑', tier: 2 },         // 枹罕·西秦乞伏鲜卑突骑（苑川故地）
  anding_wei: { name: '长征健儿', tier: 2 },      // 苦峪堡·安定卫长征健儿
  qiang: { name: '北地骑', tier: 3 },             // 萧关·羌族北地骑
  chijin: { name: '赤斤蒙古卫', tier: 3 },        // 赤金堡·赤斤蒙古卫
  // 赤亭关 @ gaochang（西域）已有「赤亭关守军」；后秦姚氏羌骑无合格 1势力=1据点，不收 yao_qiang
  juyan: { name: '居延戍卒', tier: 2 }, // 肩水金关·汉居延戍卒
};
