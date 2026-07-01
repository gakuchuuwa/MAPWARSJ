/**
 * 江南文化区远征精锐军团名（JIANGNAN / RegionSystem「江南」）
 *
 * 【三者防重】旗号 / 据点名 / 番号 — 见 AGENTS.md §12.1、ExpeditionLegions.ts 文件头
 * 写入前：npm run expedition:triple-check
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–6 字，全局不重复
 * - 依据 史料/古代精锐部队.md §9 江南 21 支为主
 * - §1 #34 解烦兵交叉收录（孙吴@武昌，史籍属三国江南精锐）
 * - §9 #18–21 已挂岭南区；#9/#10/#16 无合格势力或与岳军重复
 * - 据点优先标志战场（戚家军@横屿等）；§1 #24 丹阳兵@宛陵城·山越（复用 shanyue）
 */
export const JIANGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, {
name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  chuzhou_d: { name: '清淮劲卒', tier: 4 },        // 清流关·皇甫晖守滁州抗蒙（缺乏极其著名的战术高光，降T3）
  she_ethnic: { name: '畲族山兵', tier: 4 },  // 敕木山·畲族祖山 // 清流关·滁州戍卒     // 武陵山·相单程武陵蛮
  shanyue: { name: '丹阳兵', tier: 1 },      // 宛陵城·§1 #24 丹阳郡精兵（极其有名，升T1）
    chu: { name: '荆州锐士', tier: 4 },       // 金鳞·关羽水淹七军（缺乏极其著名的战术高光，降T3）
  sunwu_d: { name: '解烦兵', tier: 2 },      // 武昌·孙吴禁卫
  jinling: { name: '量沙军', tier: 3 },     // 檀道济唱筹量沙，这是一个计谋/典故，并非一支具有持续战术高光的实体部队，降为T3知名。
  zhong: { name: '北府兵', tier: 0 },        // 寿春·§9 #5 谢玄刘牢之（旗=寿·寿州）
  yang_zhou: { name: '黑云长剑都', tier: 2 },   // 广陵·杨行密黑云长剑都（扬州）
  lu: { name: '逍遥津突将', tier: 2 },       // 合肥·张辽八百破十万（一次性战术突击队）
  min: { name: '闽国亲从', tier: 4 },        // 冶城·王审知闽国亲从
  quanzhou: { name: '清源军', tier: 4 },        // 刺桐·留从效清源军
  chen: { name: '建康水军', tier: 4 },       // 清远·陈霸先水师

  yue_d: { name: '背嵬军', tier: 1 },        // 岳飞背嵬军虽在郾城、颖昌取得重大战略胜利，但未能灭亡金国，不符合"灭国"硬标准，降为T1战略王牌。
      xiangzhou: { name: '襄阳镇军', tier: 4 },     // 襄阳·坚守六年的重镇防卫力量（常规番号，降T3）
  zaoyang_d: { name: '忠顺军', tier: 1 },       // 枣阳·孟珙忠顺军（《宋史·孟珙传》）
  sizhou: { name: '克敌军', tier: 1 },       // 淮安·韩世忠大仪镇大捷以少胜多（泗州）
  qian_d: { name: '嘉兴水师', tier: 4 },      // 嘉兴·俞大猷嘉兴水师（常规番号，降T3）
  qi_d: { name: '戚家军', tier: 1 },         // 横屿·§9 #17 横屿大捷战场（成军义乌，据点取标志战）
  jiujiang: { name: '蒙冲斗舰', tier: 1 },     // 六安·周瑜九江戍守
    fangla: { name: '圣公兵', tier: 4 },             // 缺乏知名度支撑，降T3
  fang_guozhen: { name: '浙东舟师', tier: 4 }, // 庆元·方国珍浙东割据水师
  ruochu: { name: '若敖六卒', tier: 2 },       // 楚国早期精锐，在楚庄王时期有战术高光，但非贯穿时代的战略主力，降为T2战术。
  mi_chu: { name: '左广右广', tier: 4 },       // 云梦·楚庄王亲兵（《左传·宣公》）（缺乏极其著名的战术高光，降T3）
  heng: { name: '衡州义军', tier: 4 },         // 临烝·何腾蛟南明衡州抗清
    yezongliu: { name: '处州矿徒', tier: 4 },
  jinan: { name: '神牌弩手', tier: 2 },   // 历下·铁铉固守济南（防御战术铁壁）
  wu: { name: '句吴利趾', tier: 1 },        // 阊门·孙武句吴利趾
  // 六卒精锐除名（非正式番号，《吴子》军事术语）
    xushouhui: { name: '双刀水师', tier: 4 },         // 常规番号，降T3
  // §9 #12 八字军 → 北方 wangyan@飞狐（太行地名旗号；非衡州临烝）
  changshaguo: { name: '飞虎军', tier: 3 },      // 临湘·辛弃疾长沙飞虎军（地方防卫军）
  hongzhou: { name: '洪都戍卒', tier: 4 },    // 豫章·朱文正洪都保卫战（防御战术铁壁）（常规番号，降T3）
  huangwang: { name: '冲天军', tier: 3 },       // 仙霞关·黄王冲天军
  yue: { name: '越君子军', tier: 1 },        // 会稽·勾践越军（三千越甲可吞吴，符合T1）
  zhangshicheng: { name: '盐丁锐旅', tier: 4 }, // 延陵·张士诚盐丁起兵（《明史》）
  ouyue: { name: '东瓯舟师', tier: 4 },        // 临海·东瓯王国水师（《史记·东越列传》）
  huang_d: { name: '黄国锐卒', tier: 4 },      // 弋阳·孙叔敖黄国故地（缺乏极其著名的战术高光，降T3）
  // 横海校尉除名
  chizhou: { name: '池州戍兵', tier: 4 },        // 大通·池州
  wenzhou: { name: '永嘉水师', tier: 4 },    // 永嘉·张璁整顿海防抗倭（常规番号，降T3）
  hu_d: { name: '浙东义兵', tier: 4 },          // 白峤·胡三省浙东抗元义兵
  wan: { name: '野人原义兵', tier: 4 },            // 皖口·刘源（缺乏极其著名的战术高光，降T3）
  ying: { name: '郢州水军', tier: 4 },           // 郊郢·曹景宗梁郢州据城退魏（《梁书·曹景宗传》）（常规番号，降T3）
  kejia: { name: '客家义军', tier: 4 },          // 黄连·客家区募兵抗元（文天祥沾边）（常规番号，降T3）
  tingzhou_d: { name: '破敌军', tier: 2 },          // 瑞金·陈敏破敌军T2
  fu2: { name: '临川郡兵', tier: 4 },            // 临川·周迪陈朝据守（常规番号，降T3）
  ouyang: { name: '庐陵蛮兵', tier: 4 },         // 庐陵·欧阳頠世居统蛮兵（《梁书》）（缺乏极其著名的战术高光，降T3）
  chu_d: { name: '庐江义旅', tier: 4 },       // 潜山·陆康庐江守城
  shenshi: { name: '吴兴部曲', tier: 4 },       // 独松关·吴兴沈氏部曲（缺乏极其著名的战术高光，降T3）
  wuwu_d: { name: '楼船军', tier: 1 },        // 濡须口·王濬楼船灭吴（《晋书》）
  taizhou: { name: '海陵镇兵', tier: 4 },       // 海陵·李昪发迹之地（常规番号，降T3）
  xie_cj_d: { name: '信州弩士', tier: 4 },      // 葛溪·谢枋得信州抗元（缺乏极其著名的战术高光，降T3）
  liu: { name: '九江劲卒', tier: 4 },            // 六安·英布九江王封地（缺乏极其著名的战术高光，降T3）
  chimei: { name: '赤眉军', tier: 1 },  // 莒城·樊崇起兵攻入长安灭新莽
  chunshen: { name: '春申门客', tier: 3 },  // 上海·战国春申君黄歇的精锐私兵
  wang_d: { name: '琅琊部曲', tier: 4 },  // 琅琊·王导东晋开国丞相（缺乏极其著名的战术高光，降T3）
  jiaodong: { name: '即墨火牛阵', tier: 2 },  // 即墨·田单火牛阵大破燕军（一次性战术奇谋）
  guo: { name: '果州戍兵', tier: 4 },  // 南充·唐果州戍兵
  zi: { name: '资州戍兵', tier: 4 },  // 盘石·唐资州戍兵
  long2: { name: '陇州府兵', tier: 4 },  // 汧源·韦孝宽北周陇州总管（缺乏极其著名的战术高光，降T3）
  jibei: { name: '赤眉余部', tier: 4 },  // 博阳·徐宣赤眉余部退守（缺乏极其著名的战术高光，降T3）
  gouding: { name: '句町部兵', tier: 4 },  // 广南·西南夷句町国部兵
  quanrong: { name: '西戎骑兵', tier: 4 },  // 威戎·犬戎部落武装
qiufu: { name: '剡城义军', tier: 4 },     // 剡城·裘甫起义大破唐军（常规番号，降T3）
    shuntian: { name: '天地会义军', tier: 4 },         // 常规番号，降T3
  lujian: { name: '义乌营', tier: 4 },       // 金华·张煌言募兵抗清（缺乏极其著名的战术高光，降T3）
  danyang: { name: '采石水军', tier: 2 },     // 虞允文采石之战大败金军，绝境逆转，升T2
  linshihong: { name: '大楚水军', tier: 4 },  // 鄱阳·林士弘称帝建楚（常规番号，降T3）
  gumie: { name: '却月阵兵', tier: 2 },       // 信安·刘裕却月阵破魏（特定战术阵法）
  wang_s: { name: '新安兵', tier: 4 },       // 黟城·汪华保据新安六州（缺乏极其著名的战术高光，降T3）
  wenling: { name: '福建水师', tier: 4 },    // 澎湖·施琅平台湾（常规番号，降T3）
  wuyue: { name: '游奕军', tier: 4 },          // 杭州·钱镠吴越游奕军（缺乏极其著名的战术高光，降T3）
  shaozhou_d: { name: '银枪效节军', tier: 2 }, // 邵州·马殷银枪效节军
};
