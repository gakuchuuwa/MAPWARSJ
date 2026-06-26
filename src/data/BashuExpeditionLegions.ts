/**
 * 川蜀文化区远征精锐军团名（BASHU）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 依据 史料/古代精锐部队.md §8 川蜀 10 支全收录
 * - 蜀汉多番号分流：蜀/夔/谯/卓各挂一军
 * - 据点取川东近乡或史载成军/战场地
 */
export const BASHU_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 }>> = {
  wudu: { name: '甘泉驿骑', tier: 3 },         // 甘泉驿·张翼甘泉驿骑
  baishui: { name: '白水戍卒', tier: 3 },       // 白水关·杨怀守关
  dangzhou: { name: '阴平奇兵', tier: 0 },     // 宕昌·邓艾偷渡阴平（经典进攻性以少胜多，升T0）
  jinchuan_g: { name: '金川番兵', tier: 3 },    // 勒乌围·金川土兵
  //  miaomin: { name: '苗疆义军', tier: 3 },      // 平陇·石柳邓苗民 — 已迁 DianQianExpeditionLegions
  //  dongzu: { name: '侗家义军', tier: 3 },       // 雷公山·吴勉侗族 — 已迁 DianQianExpeditionLegions
  wuman: { name: '乌蛮山兵', tier: 3 },        // 乌蒙山·乌蛮部

  chenzhou_d: { name: '辰州戍兵', tier: 3 },     // 沅陵·辰州戍兵
  jingmen: { name: '长坂兵', tier: 3 },          // 当阳·赵云长坂坡
  bandun: { name: '賨人勇士', tier: 2 },       // 汉昌·范目率板楯七姓助刘邦定三秦（T1有名且胜仗）
  langzhou: { name: '巴西劲卒', tier: 2 },       // 隆城·张飞巴西劲卒（有名且胜仗，升T1）
  zhuoshi: { name: '井阑劲卒', tier: 2 },         // 临邛·诸葛连弩营
  tujia_d: { name: '白杆兵', tier: 1 },         // 石柱·§8 #5 秦良玉土司白蜡矛（战功赫赫，特批T1）
  shu: { name: '诸葛连弩士', tier: 1 },           // 成都·诸葛亮连弩兵（蜀国）
  yangzhou: { name: '无当飞军', tier: 1 },   // 兴势山·王平统率山地劲旅（防御战退曹爽，降T1）
  shuixi: { name: '罗罗兵', tier: 3 },           // 毕节·§8 #7 水西罗罗兵（奢安之乱）
  // 悬棺武士除名
  chenghan: { name: '流民帅突骑', tier: 1 },      // 鹿头关·§8 #9 成汉李特六夷铁骑（破晋建国，升T1）
  daxi_ming: { name: '大西老营', tier: 1 },     // 涪城·§8 #10 张献忠大西核心营（旗=大西·§12.1.1）
  ba: { name: '巴渝劲卒', tier: 2 },          // 重庆·巴国巴蔓子劲卒（《华阳国志·巴志》）
  hezhou: { name: '兴戎军', tier: 1 },          // 钓鱼城·王坚抗蒙毙蒙哥（防御战，降T1）
  kui: { name: '白毦兵', tier: 1 },             // 白帝城·刘备白毦兵（防御断后，降T1）
  qiuchi: { name: '武都部曲', tier: 3 },          // 仇池·杨氏世袭部曲（《宋书》杨难当拥部曲数万）
  // ── 2026-06-16 新增：4座西南名关 ──
  lizhou_d: { name: '剑阁戍卒', tier: 2 },        // 剑门关·廖化
  fengzhou: { name: '和尚原锐卒', tier: 1 },       // 大散关·吴玠和尚原大捷（凤州）
  fu_zhou: { name: '涪陵劲卒', tier: 2 },       // 涪陵·《华阳国志》涪陵劲卒
  fushi: { name: '氐族劲卒', tier: 2 },         // 略阳·苻洪氐族劲卒（苻氏）
    yang_bozhou: { name: '播州土兵', tier: 3 },    // 海龙屯·播州杨氏
  yong: { name: '庸国戍卒', tier: 3 },           // 上庸·古庸国
  cong: { name: '賨族勇士', tier: 3 },           // 宕渠·賨族
  wuxi: { name: '五溪蛮兵', tier: 3 },           // 八面山·五溪蛮
  song2: { name: '松州戍卒', tier: 3 },          // 嘉诚·唐蕃古道松州
  yidou: { name: '夷陵奇兵', tier: 3 },          // 夷陵·三国夷陵之战
  // 权州戍兵除名（生造）
  zuo_d: { name: '南中叟兵', tier: 3 },         // 清溪关·西南夷王牌
  zangke: { name: '牂牁戍卒', tier: 3 },        // 胜境关·古牂牁国地（原夜郎锐卒，避岭南同名）
  wanzhou: { name: '天生城军', tier: 3 },       // 南浦·上官夔天生城
  cheng: { name: '西川绿营', tier: 2 },          // 阳安·岳钟琪川督绿营（开疆拓土主战，升T1）
  wumeng: { name: '溪州土兵', tier: 3 },
  jinchuan_x: { name: '金川土兵', tier: 3 },
  fuguo: { name: '附国羌兵', tier: 3 },  // 芒康宗·隋附国羌人部落兵
  jie: { name: '柘羯武士', tier: 2 },  // 羯霜那·玄奘《大唐西域记》载柘羯勇士
qianzhong: { name: '乾嘉苗兵', tier: 2 },     // 芷江·吴八月攻克沅州
  dangchang: { name: '宕昌羌步', tier: 2 },   // 合川·梁弥定宕昌王
  liao: { name: '巴僚弩手', tier: 2 },        // 江阳·侯弘远僚人酋帅
  sou: { name: '越巂叟兵', tier: 2 },         // 乐山·高定元叟族反蜀
  qingqiang: { name: '青羌突骑', tier: 2 },    // 汶川·姜维青羌兵源
  qingyi: { name: '天师道众', tier: 3 },       // 严道·范长生
  // ── 2026-06-18：武陵/叙永/慈利/秀山/房陵/珙县/来凤精锐 ──
  zhongxiang: { name: '钟相义军', tier: 2 },   // 武陵·钟相杨幺起义攻占州县（名气不足，降T2）
  she: { name: '永宁彝兵', tier: 2 },          // 叙永·奢崇明起兵反明（名气不足，降T2）
  tan_d: { name: '慈利土兵', tier: 2 },       // 慈利·覃垕率土兵起义（明正德）
  ran_d: { name: '冉氏土兵', tier: 2 },        // 秀山·冉守忠南宋土兵从征
  kuai: { name: '蒯氏宗兵', tier: 3 },         // 房陵·蒯越宗族私兵（汉末荆襄）
  boren: { name: '僰人藤牌兵', tier: 3 },     // 珙县·僰人阿大（僰道故地）
  xiang_d: { name: '向氏土兵', tier: 3 },      // 来凤·向大坤土司（向王天子）
    qianhui: { name: '回民义军', tier: 2 },
  huizhou: { name: "元戎弩兵", tier: 1 },     // 河池·诸葛亮
};
