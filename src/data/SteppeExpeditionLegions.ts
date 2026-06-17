/**
 * 草原文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线与日朝东北一致：
 * - 番号至少 3 个汉字
 * - 同势力只挂一个番号（比知名度分流）
 * - 不收热兵器/近代/汉军混编专名（§6 #4 大汉军、#13 准噶尔驼城火枪军等）
 * - 依据 史料/古代精锐部队.md §6 #1–3、#5–12、#14–19
 */
export const STEPPE_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  liao_d: { name: '属珊军', tier: 0 },         // 临潢府·《辽史·兵卫志》述律平属珊三万骑；917幽州
  qidan: { name: '皮室军', tier: 1 },         // 木叶山·辽太祖皮室军（§6 #1；原挂临潢让位属珊）
  yel: { name: '斡鲁朵军', tier: 2 },         // 降圣·契丹宫帐制
  menggu_d: { name: '怯薛宿卫', tier: 0 },     // 哈拉和林·蒙古帝国怯薛（§6 #2）
  borjigin: { name: '那可儿军', tier: 3 },     // 曲雕阿兰·铁木真那可儿（§6 #10）
  ogodei: { name: '探马赤军', tier: 0 },       // 也迷里·木华黎探马赤（§6 #3）
  yuan_d: { name: '秃鲁花军', tier: 2 },       // 上都·元质子军
  xiongnu: { name: '控弦之士', tier: 2 },      // 头曼城·匈奴骑兵
  tujue: { name: '附离亲卫', tier: 1 },       // 于都斤山·突厥附离（《隋书·突厥传》；原突厥狼卫）
  huige: { name: '毗伽近卫', tier: 1 },       // 富贵城·回鹘毗伽可汗近卫（原回鹘铁骑）
  // shatuo → 北方 shatuo:鸦儿军（§1 #50；§6 #8 沙陀铁骑与鸦儿军同系，改挂北方）
  xianbei: { name: '弹汗王卫', tier: 3 },      // 嘎仙洞·弹汗山王庭卫队（§6 #15）
  gaoche: { name: '高车战车', tier: 3 },       // 浚稽山·高车战车兵（§6 #16）
  rouran: { name: '柔然铁骑', tier: 2 },       // 赛尔乌苏·柔然骑兵
  xueyantuo: { name: '同罗突骑', tier: 2 },    // 燕然勒石·薛延陀亲卫（§6 #18）
  naiman: { name: '乃蛮重骑', tier: 2 },       // 福海·乃蛮重装骑兵（§6 #19）
  ongut: { name: '汪古突骑', tier: 2 },        // 净州塞·汪古白鞑靼（§6 #14）
  wala: { name: '瓦剌铁骑', tier: 2 },         // 博尔巴任·也先瓦剌（§6 #12）
  geluolu: { name: '葛逻禄背弓', tier: 2 },    // 弓月城·三姓葛逻禄
  kiyad: { name: '那可儿', tier: 3 },         // 不儿罕山·乞颜那可儿
  kumo: { name: '楮特奥隗部', tier: 3 },     // 马盂山·奚族楮特奥隗部
  // ── 2026-06-16 新增：草原大区平衡补全（20支） ──
  kelie: { name: '克烈护卫军', tier: 2 },
  dingling: { name: '丁零游骑', tier: 3 },
  xiajiasi: { name: '黠戛斯锐卒', tier: 3 },
  donghu: { name: '东胡骑', tier: 3 },
  tiele: { name: '铁勒骁骑', tier: 3 },
  xibo_d: { name: '索伦营', tier: 3 },
  tatar: { name: '塔塔儿死士', tier: 3 },
  merkit: { name: '蔑儿乞猎骑', tier: 3 },
  chahar: { name: '察哈尔八旗', tier: 2 },
  da_yuan: { name: '北元怯薛', tier: 2 },
  huyan: { name: '呼衍精骑', tier: 3 },
  yujiulu: { name: '郁久闾王骑', tier: 2 },
  jalair: { name: '札剌亦儿军', tier: 3 },
  hongirad: { name: '弘吉剌护卫', tier: 2 },
  choros: { name: '绰罗斯骁骑', tier: 3 },
  duolu: { name: '咄陆部铁骑', tier: 2 },
  kaerka: { name: '喀尔喀重骑', tier: 3 },
  zhasaketu: { name: '回鹘牙帐骑', tier: 2 },
  buriat: { name: '林中射手', tier: 3 },
  cheshihou: { name: '车师后王卫', tier: 3 },
};
