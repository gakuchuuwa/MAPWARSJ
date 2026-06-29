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
  zhuang_d: { name: '广西俍兵', tier: 1 },     // 田阳·王江泾抗倭（非以少胜多）
  xian_d: { name: '俚人武士', tier: 2 },       // 高凉·§10 #9 冼夫人卫队
  dayue: { name: '白藤江水师', tier: 0 },           // 昇龙·陈国峻白藤江伏击灭元（区T0锚点·奇袭以少胜多）
  jing: { name: '丁朝禁卫', tier: 3 },         // 华闾·丁部领前李朝都城禁卫（无史籍专名番号）
  trinh: { name: '府僚营', tier: 3 },          // 宣光·郑主府僚军政（无史籍固定精锐番号）
  nguyen_guangnan: { name: '富春禁兵', tier: 2 },       // 富春·阮福映禁兵（政治禁卫降T2）
  // guangnanguo → 洞海城归 panjun
  ryukyu: { name: '那霸水师', tier: 2 },       // 首里·§9 #21 琉球王府水师
  ming_zheng: { name: '郑氏铁人军', tier: 1 }, // 承天·郑成功攻台（以多胜少，降T1）
  guangzhou: { name: '清海军', tier: 2 },      // 番禺·刘隐清海军节度（《旧唐书·刘隐传》）
  // §10 #1 战象部队（泛称）→ 不收
  // §10 #5 满者伯夷水师、#7 占婆水师（champa 已挂滇缅）、#10 红旗帮 → 无合格势力/他区已占
  zhancheng: { name: '占城象兵', tier: 2 },   // 阇槃·占城象兵
  jingjiang: { name: '靖江府卫', tier: 2 },   // 永安·瞿式耜大破李成栋
  xinjiang: { name: '静江弩手', tier: 2 },      // 始安·马塈静江弩手（南宋）
  // 铲平军除名（非正式官军番号）
  nanyue: { name: '南越戍卒', tier: 3 },        // 龙川·赵佗南越国秦戍（《史记》）
  nongzhigao: { name: '侬峒劲卒', tier: 2 },    // 晋兴·侬智高侬峒兵（《宋史·蛮夷传》）
  yelang: { name: '夜郎锐卒', tier: 3 },        // 普定·夜郎国西南夷（《史记》）
  dacheng: { name: '永安戍卒', tier: 3 },       // 永安·明永安千户所戍卒（原大成水师）
  linyi: { name: '林邑象兵', tier: 3 },          // 象林·林邑国
  xiou: { name: '西瓯戍兵', tier: 3 },           // 布山·西瓯
  luoyue: { name: '骆越部卒', tier: 3 },         // 花山·骆越
  guangxin: { name: '苍梧戍卒', tier: 3 },       // 苍梧·广信
  chen: { name: '南朝水师', tier: 2 },              // 清远·陈霸先（修正历史错位，改为南朝水师）
  taiping: { name: '太平军', tier: 1 },          // 金田村·太平天国（威震天下，升T1）
  leizhou: { name: '雷州戍兵', tier: 3 },        // 海康·李茂雷州卫
  monong: { name: '墨侬部卒', tier: 2 },       // 邦敦·阿侬率余部抗宋
  shuizhen: { name: '水真戍卒', tier: 3 },     // 三菩·区大任驻守
  ketagalan: { name: '凯达格兰兵', tier: 3 }, // 艋舺·台北原住民
  li_s: { name: '大汉伏波', tier: 2 },            // 合浦·马援征交趾（非以少胜多）
  shaozhou: { name: '大庾岭义旅', tier: 2 },   // 韶关·张镇孙抗元义军（1277–1278）
  guizhou: { name: '永历铁骑', tier: 1 },       // 古严关·李定国（原肇庆永历，2026-06-19 迁桂州）
  paiyao: { name: '八排瑶丁', tier: 3 },      // 阳山关·明清连阳八排瑶丁
  // 湘军道营除名（无此编制）
  dayu: { name: '南赣标军', tier: 1 },        // 横浦关·明王阳明南赣标军（明代巡抚标营编制，升T1）
    duanzhou_d: { name: '端州义勇', tier: 2 },
  chaozhou_d: { name: '潮州义勇', tier: 2 },       // 海阳·马发
  basha_d: { name: '湄公象卫', tier: 2 },     // 上丁·刀更孟象兵
  dengmaoqi: { name: '铲平义军', tier: 3 },
  shixing: { name: '岭南劲卒', tier: 2 },
  yingzhou: { name: '南汉禁兵', tier: 2 },
  daozhou: { name: '道州弩手', tier: 3 },
  guangping: { name: '象兵水师', tier: 2 },     // 洞海城·阮文张象兵舟船协同
shengmiao: { name: '古州苗兵', tier: 2 },     // 甲定·包利连破清军汛堡
  chendiaoyan: { name: '畲汉义军', tier: 2 },   // 龙溪·陈吊眼攻破漳州
  buyi_d: { name: '盘江布依兵', tier: 2 },       // 罗博·韦朝元布依起义
  paiwan: { name: '牡丹社勇士', tier: 2 },      // 牡丹社·阿禄古抗击日军（战役未胜，降T2）
  miao_qing: { name: '黑旗苗獠', tier: 1 },   // 且兰城·苗军连败红巾军
  geng: { name: '靖南藩兵', tier: 2 },         // 延平·耿精忠三藩起兵
  tian_sizhou: { name: '思州土兵', tier: 2 },    // 镇远·田祐恭归宋封国公
  liren: { name: '儋耳黎兵', tier: 2 },         // 珠崖·符南蛇黎族起义
  luodian: { name: '水西彝兵', tier: 2 },      // 大方城·奢香夫人摄政保境
  longwu: { name: '建宁义旅', tier: 2 },       // 建宁·黄道周募兵抗清
  luoping: { name: '摧锋军', tier: 1 },       // 厓山·张世杰
  xinggu: { name: '爨氏部曲', tier: 3 },       // 罗雄·爨习南中大姓
  nong2: { name: '广源峒兵', tier: 2 },           // 广源·侬智高广源起兵建南天国
  cen_d: { name: '泗城狼兵', tier: 1 },          // 凌云·岑猛泗城狼兵威震广西
  miao: { name: '水西苗兵', tier: 2 },           // 可乐城·水西土司苗兵
  jiang_s: { name: '零陵锐卒', tier: 2 },        // 泉陵·黄盖
  muong: { name: '芒峒刀牌手', tier: 3 },         // 和平·申从岳芒族刀牌手
  panyao: { name: '瑶人弩手', tier: 3 },          // 临贺·盘瑶山地弩手
  chen2: { name: '桂阳戍卒', tier: 3 },           // 桂阳·赵范桂阳戍卒
  qian: { name: '矩州戍卒', tier: 3 },            // 顺元·宋景阳入矩州戍
};
