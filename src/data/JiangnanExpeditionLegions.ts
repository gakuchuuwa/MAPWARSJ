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
  chu: { name: '申息之师', tier: 1 },        // 郢城·§9 #3 楚国申息故地精兵
  sunwu_d: { name: '解烦兵', tier: 1 },      // 武昌·§1 #34 孙吴解烦（江南交叉）
  nantang_d: { name: '黑云长剑都', tier: 2 }, // 南京·§9 #4 南唐杨行密
  zhong: { name: '北府兵', tier: 0 },        // 寿春·§9 #5 谢玄刘牢之（旗=仲·袁术仲家）
  hongguang: { name: '克敌军', tier: 1 },       // 广陵·韩世忠黄天荡大破金兵
  lu: { name: '逍遥津死士', tier: 1 },       // 合肥·《三国志·张辽传》八百突围（「十万」见《魏略》注，非演义独有）
  min: { name: '长乐控鹤', tier: 2 },        // 冶城·闽国控鹤军（≠武周洛阳控鹤军）
  chen: { name: '建康水军', tier: 2 },       // 清远·§9 #6 陈霸先江南水师
  xiao_d: { name: '白袍军', tier: 1 },       // 兰陵·§9 #7 陈庆之南梁
  yue_d: { name: '背嵬军', tier: 0 },        // 巴陵·§9 #8 岳飞岳云
  jingzhou: { name: '忠顺军', tier: 1 },     // 襄阳·§9 #11 《宋史·孟珙传》忠顺军（旗=荆·荆州；成军枣阳）
  song: { name: '御前诸军', tier: 2 },       // 临安·孟珙南宋御前诸军
  qian_d: { name: '游奕军', tier: 2 },       // 嘉兴·§9 #13 踏白游奕（岳飞系）
  qi_d: { name: '戚家军', tier: 0 },         // 横屿·§9 #17 横屿大捷战场（成军义乌，据点取标志战）
  haoding: { name: '红袄军', tier: 2 },      // 历城·§9 #14 李全杨妙真
  wu: { name: '锦帆贼', tier: 1 },           // 姑苏·§1 #35 甘宁（江南交叉）
  ruochu: { name: '六卒精锐', tier: 3 },     // 竟陵·§9 #1 若敖六卒（旗=若敖）
  mi_chu: { name: '左右广军', tier: 2 },     // 云梦·§9 #2 楚左广与右广（旗=芈）
  xushouhui: { name: '红巾军', tier: 2 },    // 蕲春·元末徐寿辉天完红巾主力
  // §9 #12 八字军 → 北方 wangyan@飞狐（太行地名旗号；非衡州临烝）
  machu: { name: '武平军', tier: 2 },       // 长沙·马楚武平军节度
  ning: { name: '江西勤王军', tier: 3 },     // 豫章·南宋江西勤王
  huangwang: { name: '冲天军', tier: 2 },       // 仙霞关·黄王冲天军
  yue: { name: '越君子军', tier: 1 },          // 会稽·勾践近卫亲兵（《国语·吴语》）
  zhangshicheng: { name: '盐丁锐旅', tier: 3 }, // 延陵·张士诚盐丁起兵（《明史》）
  ouyue: { name: '东瓯舟师', tier: 3 },        // 临海·东瓯王国水师（《史记·东越列传》）
  huang_d: { name: '黄国锐卒', tier: 3 },      // 潢川·周代黄国（春申君故里）
  chizhou: { name: '池州戍兵', tier: 3 },        // 大通·池州
  ting: { name: '汀州戍卒', tier: 3 },           // 黄连·汀州
  wan: { name: '舒州戍兵', tier: 3 },            // 皖城·舒州
  shenshi: { name: '吴兴部曲', tier: 2 },       // 独松关·吴兴沈氏部曲
};
