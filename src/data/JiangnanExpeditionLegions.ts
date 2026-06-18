/**
 * 南方文化区远征精锐军团名（JIANGNAN / RegionSystem「南方」）
 *
 * 【三者防重】旗号 / 据点名 / 番号 — 见 AGENTS.md §12.1、ExpeditionLegions.ts 文件头
 * 写入前：npm run expedition:triple-check
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 依据 史料/古代精锐部队.md §9 南方 21 支为主
 * - §1 #34 解烦兵交叉收录（孙吴@武昌，史籍属三国江南精锐）
 * - §9 #18–21 已挂岭南区；#9/#10/#16 无合格势力或与岳军重复
 * - 据点优先标志战场（戚家军@横屿等）；§1 #24 丹阳兵@宛陵城·山越（复用 shanyue）
 */
export const JIANGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  shanyue: { name: '丹阳兵', tier: 2 },      // 宛陵城·§1 #24 丹阳郡精兵；旗=山越 据点=宛陵城 番=丹阳兵 ✅
    chu: { name: '荆州锐士', tier: 2 },       // 金鳞·陆逊镇守江陵
  sunwu_d: { name: '解烦兵', tier: 2 },      // 武昌·孙吴禁卫
  nantang_d: { name: '黑云长剑都', tier: 2 }, // 南京·§9 #4 南唐杨行密
  zhong: { name: '北府兵', tier: 0 },        // 寿春·§9 #5 谢玄刘牢之（旗=寿·寿州）
  hongguang: { name: '扬州义兵', tier: 2 },       // 广陵·史可法扬州义兵
  lu: { name: '逍遥津死士', tier: 1 },       // 合肥·张辽800破十万（《三国志》）
  min: { name: '闽国亲从', tier: 2 },        // 冶城·王审知闽国亲从
  chen: { name: '建康水军', tier: 3 },       // 清远·陈霸先水师
  xiao_d: { name: '白袍军', tier: 1 },       // 兰陵·陈庆之七千白袍（《梁书》）
  yue_d: { name: '背嵬军', tier: 0 },        // 巴陵·§9 #8 岳飞岳云
      xiangzhou: { name: '襄鄂都统司', tier: 2 },     // 襄阳·吕文焕守襄（1267-1273）
  zaoyang_d: { name: '忠顺军', tier: 1 },       // 枣阳·孟珙忠顺军（《宋史·孟珙传》）
  song: { name: '克敌军', tier: 1 },       // 临安·韩世忠（《宋史·韩世忠传》克敌军）
  qian_d: { name: '游奕军', tier: 2 },       // 嘉兴·§9 #13 踏白游奕（岳飞系）
  qi_d: { name: '戚家军', tier: 0 },         // 横屿·§9 #17 横屿大捷战场（成军义乌，据点取标志战）
  jinan: { name: '济南卫', tier: 2 },        // 历下·铁铉守济南卫
  lai: { name: '红袄军', tier: 2 },          // 青石关·杨安儿红袄军
  wu: { name: '句吴利趾', tier: 1 },        // 阊门·孙武句吴利趾
  // 六卒精锐除名（非正式番号，《吴子》军事术语）
  xushouhui: { name: '红巾军', tier: 2 },    // 蕲春·元末徐寿辉天完红巾主力
  // §9 #12 八字军 → 北方 wangyan@飞狐（太行地名旗号；非衡州临烝）
  changshaguo: { name: '武平军', tier: 2 },   // 临湘·马殷长沙国武平军
  machu: { name: '武平军', tier: 2 },       // 马楚武平军（据点待定）
  ning: { name: '江西勤王军', tier: 3 },     // 豫章·南宋江西勤王
  huangwang: { name: '冲天军', tier: 2 },       // 仙霞关·黄王冲天军
  yue: { name: '越君子军', tier: 3 },          // 会稽·勾践越军
  zhangshicheng: { name: '盐丁锐旅', tier: 3 }, // 延陵·张士诚盐丁起兵（《明史》）
  ouyue: { name: '东瓯舟师', tier: 3 },        // 临海·东瓯王国水师（《史记·东越列传》）
  huang_d: { name: '黄国锐卒', tier: 3 },      // 潢川·周代黄国（春申君故里）
  // 横海校尉除名
  chizhou: { name: '池州戍兵', tier: 3 },        // 大通·池州
  ting: { name: '汀州戍卒', tier: 3 },           // 黄连·汀州
  wan: { name: '舒州戍兵', tier: 3 },            // 皖城·舒州
  shenshi: { name: '吴兴部曲', tier: 2 },       // 独松关·吴兴沈氏部曲
  wuwu_d: { name: '楼船军', tier: 1 },        // 濡须口·王濬楼船灭吴（《晋书》）
  xie_cj_d: { name: '信州弩士', tier: 3 },      // 葛溪·信州弩士
};
