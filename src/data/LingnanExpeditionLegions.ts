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
export const LINGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  zhuang_d: { name: '广西俍兵', tier: 3 },     // 大明西南最强土司武装之一，雄于天下，抗倭名军，升入T3知名
  xian_d: { name: '俚人武士', tier: 3 },       // 冼夫人统领的俚人武装，维系岭南一统的绝对民族力量，升入T3知名
  dayue: { name: '白藤江水师', tier: 0 },           // 昇龙·陈国峻白藤江伏击灭元（区T0锚点·奇袭以少胜多）
  jing: { name: '丁朝禁卫', tier: 4 },         // 华闾·丁部领前李朝都城禁卫（无史籍专名番号）
  leloi: { name: '蓝山义军', tier: 1 },        // 蓝山·黎利抗明复国主力
    nguyen_guangnan: { name: '富春禁卫', tier: 3 },
  // guangnanguo → 洞海城归 panjun
  ryukyu: { name: '那霸水师', tier: 3 },       // 琉球王国武装代表，东亚海上贸易网络重要文化符号，升入T3知名
  guangzhou: { name: '清海军', tier: 4 },      // 番禺·刘隐清海军节度（《旧唐书·刘隐传》）（缺乏极其著名的战术高光，降T3）
  // §10 #1 战象部队（泛称）→ 不收
  // §10 #5 满者伯夷水师、#7 占婆水师（champa 已挂滇缅）、#10 红旗帮 → 无合格势力/他区已占
    zhancheng: { name: '占城象兵', tier: 4 },
  jingjiang: { name: '靖江府卫', tier: 4 },   // 永安·瞿式耜大破李成栋（缺乏极其著名的战术高光，降T3）
  xinjiang: { name: '静江弩手', tier: 4 },      // 始安·马塈静江弩手（南宋）（缺乏极其著名的战术高光，降T3）
  // 铲平军除名（非正式官军番号）
    nanyue: { name: '南越象军', tier: 3 },
  nongzhigao: { name: '侬峒劲卒', tier: 4 },    // 晋兴·侬智高侬峒兵（《宋史·蛮夷传》）（缺乏极其著名的战术高光，降T3）
  yelang: { name: '夜郎锐卒', tier: 3 },        // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  dacheng: { name: '永安戍卒', tier: 4 },       // 永安·明永安千户所戍卒（原大成水师）
  linyi: { name: '林邑象兵', tier: 4 },          // 象林·林邑国
  xiou: { name: '西瓯戍兵', tier: 4 },           // 布山·西瓯
  luoyue: { name: '骆越部卒', tier: 4 },         // 花山·骆越
  guangxin: { name: '苍梧越甲', tier: 4 },       // 苍梧·百越特色重甲步兵
  taiping: { name: '太平军', tier: 1 },          // 金田村·太平天国（威震天下的战略绝对主力）
  leizhou: { name: '雷州戍兵', tier: 4 },        // 海康·李茂雷州卫
  monong: { name: '墨侬部卒', tier: 4 },       // 邦敦·阿侬率余部抗宋（缺乏极其著名的战术高光，降T3）
  shuizhen: { name: '水真戍卒', tier: 4 },     // 三菩·区大任驻守
  ketagalan: { name: '凯达格兰兵', tier: 3 }, // 台湾平埔族原住民代表，极具海岛南岛语族历史文化辨识度，升入T3知名
    li_s: { name: '天威劈浪军', tier: 2 },
  shaozhou: { name: '大庾岭义旅', tier: 4 },   // 韶关·张镇孙抗元义军（1277–1278）（常规番号，降T3）
  guizhou: { name: '永历铁骑', tier: 1 },       // 古严关·李定国（原肇庆永历，2026-06-19 迁桂州）
  paiyao: { name: '八排瑶丁', tier: 4 },      // 阳山关·明清连阳八排瑶丁
  // 湘军道营除名（无此编制）
    duanzhou_d: { name: '端州义勇', tier: 4 },        // 常规番号，降T3
  chaozhou_d: { name: '潮州义勇', tier: 4 },       // 海阳·马发（常规番号，降T3）
  basha_d: { name: '湄公象卫', tier: 4 },     // 上丁·刀更孟象兵（缺乏极其著名的战术高光，降T3）
  dengmaoqi: { name: '铲平义军', tier: 4 },
    shixing: { name: '大庾岭突锋', tier: 3 },
  yingzhou: { name: '南汉禁兵', tier: 4 },            // 常规番号，降T3
    daozhou: { name: '道州弩手', tier: 4 },
  guangping: { name: '象兵水师', tier: 4 },     // 洞海城·阮文张象兵舟船协同（常规番号，降T3）
shengmiao: { name: '古州苗兵', tier: 4 },     // 甲定·包利连破清军汛堡（缺乏极其著名的战术高光，降T3）
  chendiaoyan: { name: '畲汉义军', tier: 4 },   // 龙溪·陈吊眼攻破漳州（常规番号，降T3）
  buyi_d: { name: '盘江布依兵', tier: 4 },       // 罗博·韦朝元布依起义（缺乏极其著名的战术高光，降T3）
  paiwan: { name: '牡丹社勇士', tier: 3 },      // 牡丹社事件中的原住民武装，属于地方抗击，缺乏正规的战术大捷，属于风土特色，降为T3知名。
    miao_qing: { name: '黑旗苗獠', tier: 3 },
  geng: { name: '靖南藩兵', tier: 4 },         // 延平·耿精忠三藩起兵（缺乏极其著名的战术高光，降T3）
  tian_sizhou: { name: '思州土兵', tier: 4 },    // 镇远·田祐恭归宋封国公（常规番号，降T3）
  liren: { name: '儋耳黎兵', tier: 3 },         // 海南岛黎族武装代表，极具风土民族辨识度，升入T3知名
  luodian: { name: '水西彝兵', tier: 3 },      // 贵州水西土司（安氏/奢香）武装，长达千年的西南实力派代表，升入T3知名
  longwu: { name: '建宁义旅', tier: 4 },       // 建宁·黄道周募兵抗清（常规番号，降T3）
  luoping: { name: '摧锋军', tier: 2 },       // 南宋最精锐水陆两栖部队（李宝唐岛之战主力），维持半壁江山的战术尖刀，升入T2战术
  xinggu: { name: '爨氏部曲', tier: 3 },       // 统治云南数百年爨氏家族的文化象征，西南历史丰碑，升入T3知名
    nong2: { name: '侬峒狼兵', tier: 3 },
  cen_d: { name: '泗城狼兵', tier: 3 },          // 大明西南最强土司武装之一，雄于天下，抗倭名军，升入T3知名
  miao: { name: '水西苗兵', tier: 4 },           // 可乐城·水西土司苗兵（缺乏极其著名的战术高光，降T3）
    jiang_s: { name: '零陵蒙冲', tier: 3 },
  muong: { name: '芒峒刀牌手', tier: 4 },         // 和平·申从岳芒族刀牌手
  panyao: { name: '瑶人弩手', tier: 4 },          // 临贺·盘瑶山地弩手
  chen2: { name: '桂阳戍卒', tier: 4 },           // 桂阳·赵范桂阳戍卒
  qian: { name: '矩州戍卒', tier: 4 },            // 顺元·宋景阳入矩州戍,
    minyue: { name: '闽越甲卒', tier: 4 },            // 缺乏知名度支撑，降T3
    funan: { name: '扶南大舶', tier: 3 },             // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    lancang: { name: '澜沧象兵', tier: 3 },           // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    liuzhou: { name: '柳州狼兵', tier: 3 },           // 大明西南最强土司武装之一，雄于天下，抗倭名军，升入T3知名,
    chen: { name: '百越甲兵', tier: 3 },
};
