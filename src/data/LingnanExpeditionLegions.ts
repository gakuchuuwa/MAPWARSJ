/**
 * 岭南文化区远征精锐军团名（GAME_DIRECTION 远征细则 2026-06-11）
 *
 * 收录红线：
 * - 每文化区 ≥10 条；番号 3–5 字，全局不重复
 * - 依据 史料/古代精锐部队.md §10 岭南 10 支为主；§9 #18–19、#21 补海岛条目
 * - 不收热兵器专名；不收 §10 #1 泛称「战象部队」、#5/#10 无合格势力条目
 * - 琉球那霸水师改挂岭南（首里城 region=LINGNAN；日本区不收）
 * - 据点优先标志战场；王江泾距嘉兴<50km时取成军地
 */
export const LINGNAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
  zhuang_d: { name: '广西俍兵', tier: 3 },     // 大明西南最强土司武装之一，雄于天下，抗倭名军，升入T3知名
    dayue: { name: '白藤江射手', tier: 0 },
  // guangnanguo → 洞海城归 panjun
  ryukyu: { name: '那霸水师', tier: 3 },       // 琉球王国武装代表，东亚海上贸易网络重要文化符号，升入T3知名
  // §10 #1 战象部队（泛称）→ 不收
  // §10 #5 满者伯夷水师、#7 占婆水师（champa 已挂滇缅）、#10 红旗帮 → 无合格势力/他区已占
  // 铲平军除名（非正式官军番号）
    nanyue: { name: '南越象军', tier: 3 },
  nongzhigao: { name: '侬峒劲卒', tier: 4 },    // 晋兴·侬智高侬峒兵（《宋史·蛮夷传》）（缺乏极其著名的战术高光，降T3）
  yelang: { name: '夜郎锐卒', tier: 3 },        // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
  dacheng: { name: '永安戍卒', tier: 4 },       // 永安·明永安千户所戍卒（原大成水师）
  xiou: { name: '西瓯戍兵', tier: 4 },           // 布山·西瓯
  luoyue: { name: '骆越部卒', tier: 4 },         // 花山·骆越
  shuizhen: { name: '水真戍卒', tier: 4 },     // 三菩·区大任驻守
  ketagalan: { name: '凯达格兰兵', tier: 3 }, // 台湾平埔族原住民代表，极具海岛南岛语族历史文化辨识度，升入T3知名
  // 湘军道营除名（无此编制）
  basha_d: { name: '湄公象卫', tier: 4 },     // 上丁·刀更孟象兵（缺乏极其著名的战术高光，降T3）
  dengmaoqi: { name: '铲平义军', tier: 4 },
  paiwan: { name: '牡丹社勇士', tier: 3 },      // 牡丹社事件中的原住民武装，属于地方抗击，缺乏正规的战术大捷，属于风土特色，降为T3知名。
  liren: { name: '儋耳黎兵', tier: 3 },         // 海南岛黎族武装代表，极具风土民族辨识度，升入T3知名
  luodian: { name: '水西彝兵', tier: 3 },      // 贵州水西土司（安氏/奢香）武装，长达千年的西南实力派代表，升入T3知名
    cen_d: { name: '泗城狼兵', tier: 3 },
  panyao: { name: '瑶人弩手', tier: 4 },          // 临贺·盘瑶山地弩手
    minyue: { name: '闽越甲卒', tier: 4 },            // 缺乏知名度支撑，降T3
    funan: { name: '扶南大舶', tier: 3 },
    lancang: { name: '澜沧象兵', tier: 3 },           // 偏安一隅或区域性小国武装，缺乏宏大战略影响力，剥夺T1/T2资格，降回T3知名风土符号
    chen: { name: '百越甲兵', tier: 3 },
    liaozu: { name: '寮族兵', tier: 3 },
    shijun: { name: '使君乡兵', tier: 4 },   // 杜洞江·吴日庆：杜洞江·吴日庆：十二使君各据乡兵，968年为丁部领所平
};