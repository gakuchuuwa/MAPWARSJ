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
  chuzhou_d: { name: '清淮劲卒', tier: 2 },        // 清流关·皇甫晖守滁州抗蒙
  yiyang_d: { name: '义阳戍卒', tier: 3 },    // 武胜关·孟宗政三关之捷
  she_ethnic: { name: '畲族山兵', tier: 3 },  // 敕木山·畲族祖山 // 清流关·滁州戍卒     // 武陵山·相单程武陵蛮
  shanyue: { name: '丹阳兵', tier: 1 },      // 宛陵城·§1 #24 丹阳郡精兵（极其有名，升T1）
    chu: { name: '荆州锐士', tier: 2 },       // 金鳞·关羽水淹七军
  sunwu_d: { name: '解烦兵', tier: 2 },      // 武昌·孙吴禁卫
  jinling: { name: '量沙军', tier: 2 },     // 金陵·檀道济唱筹量沙（掩护撤退无大捷，降T2）
  zhong: { name: '北府兵', tier: 0 },        // 寿春·§9 #5 谢玄刘牢之（旗=寿·寿州）
  yang_zhou: { name: '黑云长剑都', tier: 1 },   // 广陵·杨行密黑云长剑都（扬州）
  lu: { name: '逍遥津突将', tier: 1 },       // 合肥·张辽八百破十万（专属名号：突将，非泛指）
  min: { name: '闽国亲从', tier: 3 },        // 冶城·王审知闽国亲从
  quanzhou: { name: '清源军', tier: 1 },        // 刺桐·留从效清源军
  chen: { name: '建康水军', tier: 3 },       // 清远·陈霸先水师

  yue_d: { name: '背嵬军', tier: 0 },        // 巴陵·§9 #8 岳飞岳云
      xiangzhou: { name: '荆鄂都统司', tier: 1 },     // 襄阳·京湖战区
  zaoyang_d: { name: '忠顺军', tier: 1 },       // 枣阳·孟珙忠顺军（《宋史·孟珙传》）
  song: { name: '殿前护圣军', tier: 1 },   // 临安·杨沂中殿前护圣军（宋国）
  sizhou: { name: '克敌军', tier: 1 },       // 淮安·韩世忠大仪镇大捷以少胜多（泗州）
  qian_d: { name: '嘉兴水师', tier: 2 },      // 嘉兴·俞大猷嘉兴水师
  qi_d: { name: '戚家军', tier: 0 },         // 横屿·§9 #17 横屿大捷战场（成军义乌，据点取标志战）
  jiujiang: { name: '蒙冲斗舰', tier: 1 },     // 六安·周瑜九江戍守
  fangla: { name: '圣公兵', tier: 1 },         // 睦州·方腊圣公起义克六州
  fang_guozhen: { name: '浙东舟师', tier: 3 }, // 庆元·方国珍浙东割据水师
  ruochu: { name: '若敖六卒', tier: 1 },       // 竟陵·楚若敖氏精锐（《左传》）
  mi_chu: { name: '左广右广', tier: 2 },       // 云梦·楚庄王亲兵（《左传·宣公》）
  heng: { name: '衡州义军', tier: 3 },         // 临烝·何腾蛟南明衡州抗清
  yezongliu: { name: '矿工义军', tier: 3 },     // 丽水·叶宗留矿工起义
  jinan: { name: '神牌弩手', tier: 2 },   // 历下·铁铉固守济南（纯防御战，降T2）
  wu: { name: '句吴利趾', tier: 1 },        // 阊门·孙武句吴利趾
  // 六卒精锐除名（非正式番号，《吴子》军事术语）
  xushouhui: { name: '红巾军', tier: 2 },    // 蕲春·元末徐寿辉天完红巾主力
  // §9 #12 八字军 → 北方 wangyan@飞狐（太行地名旗号；非衡州临烝）
  changshaguo: { name: '飞虎军', tier: 1 },      // 临湘·辛弃疾长沙飞虎军
  hongzhou: { name: '洪都戍卒', tier: 2 },    // 豫章·朱文正洪都保卫战（纯防御战，降T2）
  huangwang: { name: '冲天军', tier: 2 },       // 仙霞关·黄王冲天军
  yue: { name: '越君子军', tier: 1 },          // 会稽·勾践越军（三千越甲可吞吴，升T1）
  zhangshicheng: { name: '盐丁锐旅', tier: 3 }, // 延陵·张士诚盐丁起兵（《明史》）
  ouyue: { name: '东瓯舟师', tier: 3 },        // 临海·东瓯王国水师（《史记·东越列传》）
  huang_d: { name: '黄国锐卒', tier: 2 },      // 弋阳·孙叔敖黄国故地
  // 横海校尉除名
  chizhou: { name: '池州戍兵', tier: 3 },        // 大通·池州
  wenzhou: { name: '永嘉水师', tier: 2 },    // 永嘉·张璁整顿海防抗倭
  hu_d: { name: '浙东义兵', tier: 3 },          // 白峤·胡三省浙东抗元义兵
  wan: { name: '野人原义兵', tier: 2 },            // 皖口·刘源
  ying: { name: '郢州水军', tier: 2 },           // 郊郢·曹景宗梁郢州据城退魏（《梁书·曹景宗传》）
  kejia: { name: '客家义军', tier: 2 },          // 黄连·客家区募兵抗元（文天祥沾边）
  tingzhou_d: { name: '破敌军', tier: 2 },          // 瑞金·陈敏破敌军T2
  fu2: { name: '临川郡兵', tier: 2 },            // 临川·周迪陈朝据守
  ouyang: { name: '庐陵蛮兵', tier: 2 },         // 庐陵·欧阳頠世居统蛮兵（《梁书》）
  chu_d: { name: '舒州团练兵', tier: 3 },       // 潜山·唐舒州团练（储光羲诗人沾边）
  shenshi: { name: '吴兴部曲', tier: 2 },       // 独松关·吴兴沈氏部曲
  wuwu_d: { name: '楼船军', tier: 1 },        // 濡须口·王濬楼船灭吴（《晋书》）
  xie_cj_d: { name: '信州弩士', tier: 2 },      // 葛溪·谢枋得信州抗元
  liu: { name: '九江劲卒', tier: 2 },            // 六安·英布九江王封地
  chimei: { name: '赤眉军', tier: 1 },  // 莒城·樊崇起兵攻入长安灭新莽
  chunshen: { name: '申江戍卒', tier: 3 },  // 上海·春申君黄歇封地戍卒
  wang_d: { name: '琅琊部曲', tier: 2 },  // 琅琊·王导东晋开国丞相
  jiaodong: { name: '即墨火牛阵', tier: 1 },  // 即墨·田单火牛阵大破燕军（《史记》）
  guo: { name: '果州戍兵', tier: 3 },  // 南充·唐果州戍兵
  zi: { name: '资州戍兵', tier: 3 },  // 盘石·唐资州戍兵
  long2: { name: '陇州府兵', tier: 2 },  // 汧源·韦孝宽北周陇州总管
  jibei: { name: '赤眉余部', tier: 2 },  // 博阳·徐宣赤眉余部退守
  gouding: { name: '句町部兵', tier: 3 },  // 广南·西南夷句町国部兵
  quanrong: { name: '西戎骑兵', tier: 3 },  // 威戎·犬戎部落武装
qiufu: { name: '剡城义军', tier: 2 },     // 剡城·裘甫起义大破唐军
  shuntian: { name: '天地会义军', tier: 1 }, // 彰化·林爽文台湾最大民变
  lujian: { name: '义乌营', tier: 2 },       // 金华·张煌言募兵抗清
  danyang: { name: '采石水军', tier: 2 },     // 鸠兹·虞允文督师采石矶
  linshihong: { name: '大楚水军', tier: 2 },  // 鄱阳·林士弘称帝建楚
  gumie: { name: '却月阵兵', tier: 0 },       // 信安·刘裕却月阵破魏（以少胜多神战，升T0）
  wang_s: { name: '新安兵', tier: 2 },       // 黟城·汪华保据新安六州
  wenling: { name: '福建水师', tier: 2 },    // 澎湖·施琅平台湾
  wuyue: { name: '游奕军', tier: 2 },          // 杭州·钱镠吴越游奕军
};
