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
  xiliang: { name: '西凉铁骑', tier: 2 },       // 皋兰·凉州骑兵泛称
  dangxiang: { name: '铁鹞子', tier: 0 },        // 兴庆府·1041好水川诱伏，铁鹞子冲阵，任福战死（李元昊）
  qing: { name: '忠孝军', tier: 0 },         // 安化·庆州治；大昌原四百破八千（完颜陈和尚）
  weiming: { name: '步跋子', tier: 2 },          // 河南地·§7 #3 西夏步战精锐
  yeli: { name: '擒生军', tier: 2 },             // 克夷门·西夏监军司
  guiyi: { name: '沙州劲旅', tier: 2 },          // 敦煌·§7 #4 张议潮归义军（番号避旗号「归义」及「义」字）
  xianlingqiang: { name: '凉州大马', tier: 2 },  // 允吾·凉州骑兵泛称
  tufa_d: { name: '南凉铁骑', tier: 2 },         // 浇河·§7 #8 秃发鲜卑（番号避旗号「秃发」）
  juqu_d: { name: '北凉精锐', tier: 2 },         // 张掖·沮渠蒙逊卢水胡
  liang: { name: '凉州突骑', tier: 2 },          // 姑臧·窦融河西骑兵美称（史书泛称，非固定番号；突骑＝突击骑）
  hunxie: { name: '甘州铁骑', tier: 2 },         // 酒泉城·§7 #11 甘州回鹘铁骑（夜落纥；旗=浑邪·部族）
  qifu_d: { name: '苑川突骑', tier: 2 },         // 枹罕·西秦乞伏鲜卑突骑（苑川故地）
  anding_wei: { name: '长征健儿', tier: 2 },      // 苦峪堡·唐安西征募健儿
  qiang: { name: '北地骑', tier: 3 },             // 萧关·羌族北地骑
  yingli: { name: '泼喜军', tier: 1 },            // 鸣沙·西夏泼喜旋风砲驼兵
  chijin: { name: '赤斤蒙古卫', tier: 2 },        // 赤金堡·明关西七卫
  dongshengwei: { name: '东胜卫戍', tier: 3 },     // 东胜卫·明代卫所
  zhai_han: { name: '翟国狄骑', tier: 3 },         // 肤施·春秋赤狄翟国
  huizhou: { name: '会州边兵', tier: 3 },          // 祖厉·唐代会州
  // 赤亭关 @ gaochang（西域）已有「高昌铁骑」；后秦姚氏羌骑无合格 1势力=1据点，不收 yao_qiang
  juyan: { name: '居延戍卒', tier: 3 },              // 肩水金关·汉居延戍卒（居延汉简）
};
