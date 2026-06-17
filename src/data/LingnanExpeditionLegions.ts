/**
 * 岭南文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 依据 史料/古代精锐部队.md §10 岭南 10 支为主；§9 #18–19、#21 补海岛条目
 * - 不收热兵器专名；不收 §10 #1 泛称「战象部队」、#5/#10 无合格势力条目
 * - 琉球那霸水师改挂岭南（首里城 region=LINGNAN；日本区不收）
 * - 据点优先标志战场；王江泾距嘉兴<50km时取成军地
 */
export const LINGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  zhuang_d: { name: '广西俍兵', tier: 0 },     // 田阳·1555 瓦氏率俍兵6870王江泾斩级1900+（俍兵绿）
  xian_d: { name: '俚人武士', tier: 2 },       // 高凉·§10 #9 冼夫人卫队
  dayue: { name: '铁突军', tier: 1 },           // 昇龙·宣德二年支棱黎问黎魁铁突三千（《大越史记全书》卷十）
  jing: { name: '丁朝禁卫', tier: 3 },         // 华闾·丁部领前李朝都城禁卫（无史籍专名番号）
  trinh: { name: '府僚营', tier: 3 },          // 宣光·郑主府僚军政（无史籍固定精锐番号）
  nguyen_guangnan: { name: '西山军', tier: 2 }, // 富春·§10 #3 阮惠西山朝
  guangnanguo: { name: '黑旗军', tier: 2 },     // 洞海·§10 #4 刘永福（安南册封）
  ryukyu: { name: '那霸水师', tier: 2 },       // 首里·§9 #21 琉球王府水师
  ming_zheng: { name: '郑氏铁人军', tier: 1 }, // 承天·§9 #18 郑成功铁人军
  guangzhou: { name: '摧锋军', tier: 2 },      // 番禺·§9 #15 广南守城（广州据点）
  // §10 #1 战象部队（泛称）→ 不收
  // §10 #5 满者伯夷水师、#7 占婆水师（champa 已挂滇缅）、#10 红旗帮 → 无合格势力/他区已占
  zhancheng: { name: '佛逝象军', tier: 2 },   // 阇槃·占城佛逝象兵
  jingjiang: { name: '靖江府卫', tier: 3 },   // 桂林·明靖江王府卫（旗=靖江·藩王）
  dengmaoqi: { name: '铲平军', tier: 3 },     // 沙戍堡·邓茂七铲平军
  nanyue: { name: '南越戍卒', tier: 2 },        // 龙川·赵佗南越国秦戍（《史记·南越列传》）
  nongzhigao: { name: '侬峒劲卒', tier: 2 },    // 晋兴·侬智高侬峒兵（《宋史·蛮夷传》）
  yelang: { name: '夜郎锐卒', tier: 3 },        // 普定·夜郎国西南夷（《史记》）
  dacheng: { name: '大成水师', tier: 3 },       // 永安·陈开大成国水师（西江）
  linyi: { name: '林邑象兵', tier: 3 },          // 象林·林邑国
  xiou: { name: '西瓯戍兵', tier: 3 },           // 布山·西瓯
  luoyue: { name: '骆越部卒', tier: 3 },         // 花山·骆越
  guangxin: { name: '苍梧戍卒', tier: 3 },       // 苍梧·广信
  taiping: { name: '太平军', tier: 2 },          // 金田村·太平天国
  leizhou: { name: '雷州戍兵', tier: 3 },        // 海康·雷州
  guizhou: { name: '静江军', tier: 2 },       // 古严关·宋桂州静江军
  paiyao: { name: '八排瑶丁', tier: 3 },      // 阳山关·明清连阳八排瑶丁
  daozhou: { name: '湘军道营', tier: 3 },     // 麦岭关·晚清湘军道州营
  dayu: { name: '南赣标军', tier: 3 },        // 横浦关·明王阳明南赣标军
  yingzhou: { name: '南汉巨象军', tier: 1 },  // 湟溪关·五代南汉重装象军
  basha_d: { name: '湄公象卫', tier: 3 },     // 上丁·巴沙国湄公象卫
};
