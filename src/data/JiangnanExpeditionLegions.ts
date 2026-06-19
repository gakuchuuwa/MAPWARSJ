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
export const JIANGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, {
name: string; tier: 0 | 1 | 2 | 3 }>> = {
  wuling: { name: '武陵蛮兵', tier: 3 },
  chuzhou_d: { name: '清流关戍卒', tier: 3 },
  yiyang_d: { name: '义阳戍卒', tier: 3 },    // 武胜关·孟宗政三关之捷
  she_ethnic: { name: '畲族山兵', tier: 3 },  // 敕木山·畲族祖山 // 清流关·滁州戍卒     // 武陵山·相单程武陵蛮
  shanyue: { name: '丹阳兵', tier: 2 },      // 宛陵城·§1 #24 丹阳郡精兵；旗=山越 据点=宛陵城 番=丹阳兵 ✅
    chu: { name: '荆州锐士', tier: 2 },       // 金鳞·陆逊镇守江陵
  sunwu_d: { name: '解烦兵', tier: 2 },      // 武昌·孙吴禁卫
  nantang_d: { name: '神武军', tier: 1 },     // 建业·李昪南唐神武军
  zhong: { name: '北府兵', tier: 0 },        // 寿春·§9 #5 谢玄刘牢之（旗=寿·寿州）
  yang_zhou: { name: '黑云长剑都', tier: 1 },   // 广陵·杨行密黑云长剑都（扬州）
  lu: { name: '合肥锐士', tier: 1 },       // 合肥·张辽八百破十万
  min: { name: '闽国亲从', tier: 3 },        // 冶城·王审知闽国亲从
  quanzhou: { name: '清源军', tier: 1 },        // 刺桐·留从效清源军
  chen: { name: '建康水军', tier: 3 },       // 清远·陈霸先水师
  xiao_d: { name: '白袍军', tier: 1 },       // 兰陵·陈庆之七千白袍（《梁书》）
  yue_d: { name: '背嵬军', tier: 0 },        // 巴陵·§9 #8 岳飞岳云
      xiangzhou: { name: '荆鄂都统司', tier: 1 },     // 襄阳·京湖战区
  zaoyang_d: { name: '忠顺军', tier: 1 },       // 枣阳·孟珙忠顺军（《宋史·孟珙传》）
  song: { name: '殿前护圣军', tier: 1 },   // 临安·杨沂中殿前护圣军（宋国）
  sizhou: { name: '克敌军', tier: 1 },       // 淮安·韩世忠克敌军（泗州）
  qian_d: { name: '游奕军', tier: 2 },       // 嘉兴·§9 #13 踏白游奕（岳飞系）
  qi_d: { name: '戚家军', tier: 0 },         // 横屿·§9 #17 横屿大捷战场（成军义乌，据点取标志战）
  jiujiang: { name: '柴桑水师', tier: 2 },     // 柴桑·周瑜鄱阳湖练水军
  fangla: { name: '圣公兵', tier: 1 },         // 睦州·方腊圣公起义克六州
  fang_guozhen: { name: '浙东舟师', tier: 3 }, // 庆元·方国珍浙东割据水师
  ruochu: { name: '若敖六卒', tier: 1 },       // 竟陵·楚若敖氏精锐（《左传》）
  mi_chu: { name: '左广右广', tier: 2 },       // 云梦·楚庄王亲兵（《左传·宣公》）
  heng: { name: '衡州义军', tier: 3 },         // 临烝·何腾蛟南明衡州抗清
  yezongliu: { name: '矿工义军', tier: 3 },     // 丽水·叶宗留矿工起义
  jinan: { name: '济南卫', tier: 2 },        // 历下·铁铉守济南卫
  lai: { name: '莱国义军', tier: 2 },          // 青石关·杨安儿莱国义军
  wu: { name: '句吴利趾', tier: 1 },        // 阊门·孙武句吴利趾
  // 六卒精锐除名（非正式番号，《吴子》军事术语）
  xushouhui: { name: '红巾军', tier: 2 },    // 蕲春·元末徐寿辉天完红巾主力
  // §9 #12 八字军 → 北方 wangyan@飞狐（太行地名旗号；非衡州临烝）
  changshaguo: { name: '武平军', tier: 2 },   // 临湘·马殷长沙国武平军
  hongzhou: { name: '洪都戍卒', tier: 1 },    // 豫章·朱文正洪都保卫战
  huangwang: { name: '冲天军', tier: 2 },       // 仙霞关·黄王冲天军
  yue: { name: '越君子军', tier: 3 },          // 会稽·勾践越军
  zhangshicheng: { name: '盐丁锐旅', tier: 3 }, // 延陵·张士诚盐丁起兵（《明史》）
  ouyue: { name: '东瓯舟师', tier: 3 },        // 临海·东瓯王国水师（《史记·东越列传》）
  huang_d: { name: '黄国锐卒', tier: 3 },      // 潢川·周代黄国（春申君故里）
  // 横海校尉除名
  chizhou: { name: '池州戍兵', tier: 3 },        // 大通·池州
  wenzhou: { name: '永嘉水师', tier: 3 },    // 永嘉·温州水师
  wan: { name: '舒州戍兵', tier: 3 },            // 皖城·舒州
  shenshi: { name: '吴兴部曲', tier: 2 },       // 独松关·吴兴沈氏部曲
  wuwu_d: { name: '楼船军', tier: 1 },        // 濡须口·王濬楼船灭吴（《晋书》）
  xie_cj_d: { name: '信州弩士', tier: 3 },      // 葛溪·信州弩士
  chimei: { name: '赤眉军', tier: 2 },  // 莒城·樊崇赤眉军（《后汉书》有名）
  chunshen: { name: '申江戍卒', tier: 3 },  // 上海·春申君黄歇封地戍卒
  wang_d: { name: '琅琊部曲', tier: 3 },  // 琅琊·王氏部曲私兵
  jiaodong: { name: '即墨死士', tier: 1 },  // 即墨·田单火牛阵大破燕军（《史记》）
  guo: { name: '果州戍兵', tier: 3 },  // 南充·唐果州戍兵
  zi: { name: '资州戍兵', tier: 3 },  // 盘石·唐资州戍兵
  long2: { name: '陇州戍兵', tier: 3 },  // 汧源·唐陇州戍兵
  jibei: { name: '济北卒', tier: 3 },  // 博阳·汉济北国卒
  gouding: { name: '句町部兵', tier: 3 },  // 广南·西南夷句町国部兵
  quanrong: { name: '犬戎骑', tier: 3 },  // 威戎·西周犬戎游骑（《史记·周本纪》）
};
