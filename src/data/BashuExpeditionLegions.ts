/**
 * 川蜀文化区远征精锐军团名（BASHU）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 依据 史料/古代精锐部队.md §8 川蜀 10 支全收录
 * - 蜀汉多番号分流：蜀/夔/谯/卓各挂一军
 * - 据点取川东近乡或史载成军/战场地
 */
export const BASHU_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    wudu: { name: '阴平先锋', tier: 2 },
    baishui: { name: '白水戍卒', tier: 4 },
    dangzhou: { name: '阴平氐兵', tier: 2 }, // 邓艾偷渡阴平时临时征用的特种奇兵，单次战术奇迹的教科书代表，下调至T2战术
  jinchuan_g: { name: '金川番兵', tier: 4 },    // 勒乌围·金川土兵
  //  miaomin: { name: '苗疆义军', tier: 4 },      // 平陇·石柳邓苗民 — 已迁 DianQianExpeditionLegions
  //  dongzu: { name: '侗家义军', tier: 4 },       // 雷公山·吴勉侗族 — 已迁 DianQianExpeditionLegions
  wuman: { name: '乌蛮山兵', tier: 4 },        // 乌蒙山·乌蛮部

  chenzhou_d: { name: '辰州戍兵', tier: 4 },     // 沅陵·辰州戍兵
  jingmen: { name: '长坂血骑', tier: 3 },        // 赵云长坂坡，全民级文化IP，极高文化知名度，升T2
  bandun: { name: '賨人勇士', tier: 3 },       // 还定三秦的巴渝舞武士，中华武术发源级代表，升入T3知名
  langzhou: { name: '巴西劲卒', tier: 4 },       // 隆城·张飞巴西劲卒（名将突击队）（缺乏极其著名的战术高光，降T3）
  zhuoshi: { name: '井阑劲卒', tier: 4 },         // 临邛·诸葛连弩营（缺乏极其著名的战术高光，降T3）
  tujia_d: { name: '白杆兵', tier: 2 },         // 石柱·§8 #5 秦良玉土司白蜡矛（战功赫赫的特色尖刀）
  shu: { name: '白毦精兵', tier: 2 },           // 刘备的亲卫特种兵，在夷陵之战打出极其强悍的战术掩护保卫刘备，升入T2战术
  yangzhou: { name: '无当飞军', tier: 2 },   // 兴势山·王平统率山地劲旅（山地特种防御）
  shuixi: { name: '罗罗兵', tier: 4 },           // 毕节·§8 #7 水西罗罗兵（奢安之乱）
  // 悬棺武士除名
  chenghan: { name: '流民帅突骑', tier: 1 },      // 鹿头关·§8 #9 成汉李特六夷铁骑（破晋建国，升T1）
  daxi_ming: { name: '大西老营', tier: 1 },     // 涪城·§8 #10 张献忠大西核心营（旗=大西·§12.1.1）
  ba: { name: '巴渝劲卒', tier: 3 },          // 巴渝舞武士的另一称谓，极其著名的西南精锐，升入T3知名
  hezhou: { name: '兴戎军', tier: 1 },          // 钓鱼城·王坚抗蒙毙蒙哥（防御战，降T1）
  kui: { name: '白帝戍卫', tier: 3 },             // 白帝城·刘备白毻兵（顶级近卫，T2）
    qiuchi: { name: '仇池氐兵', tier: 4 },
  // ── 2026-06-16 新增：4座西南名关 ──
  lizhou_d: { name: '剑阁戍卒', tier: 4 },        // 剑门关·廖化（常规番号，降T3）
  fengzhou: { name: '和尚原锐卒', tier: 2 },       // 吴玠和尚原大捷，属于经典的战术/战役防守反击，降为T2战术。
  fu_zhou: { name: '涪陵劲卒', tier: 4 },       // 涪陵·《华阳国志》涪陵劲卒（缺乏极其著名的战术高光，降T3）
  fushi: { name: '氐族劲卒', tier: 4 },         // 略阳·苻洪氐族劲卒（苻氏）（缺乏极其著名的战术高光，降T3）
    yang_bozhou: { name: '播州土兵', tier: 4 },    // 海龙屯·播州杨氏
  yong: { name: '庸国戍卒', tier: 4 },           // 上庸·古庸国
  cong: { name: '賨族勇士', tier: 3 },           // 古巴人（板楯蛮），以巴渝舞战法协助刘邦平定三秦，极具历史辨识度，升入T3知名
    wuxi: { name: '武陵弓蛮', tier: 3 }, // 盘瓠神话起源，自汉至唐一直是西南地区极具代表性的蛮族武装，升入T3知名
  song2: { name: '松州戍卒', tier: 4 },          // 嘉诚·唐蕃古道松州
  yidou: { name: '夷陵奇兵', tier: 2 },          // 三国夷陵之战火烧连营，显著文化知名度，升T2
  // 权州戍兵除名（生造）
  zuo_d: { name: '南中叟兵', tier: 3 },         // 诸葛亮七擒孟获南征核心，显著文化知名度，升T2
  zangke: { name: '牂牁戍卒', tier: 4 },        // 胜境关·古牂牁国地（原夜郎锐卒，避岭南同名）
  wanzhou: { name: '天生城军', tier: 4 },       // 南浦·上官夔天生城
  wumeng: { name: '溪州土兵', tier: 4 },
    agui: { name: '健锐营', tier: 2 },
  fuguo: { name: '附国羌兵', tier: 4 },  // 芒康宗·隋附国羌人部落兵
qianzhong: { name: '乾嘉苗兵', tier: 4 },     // 芷江·吴八月攻克沅州（缺乏极其著名的战术高光，降T3）
    dangchang: { name: '陇右铁骑', tier: 1 },         // 唐代抗击吐蕃、威震西域的绝对战略主力野战军，升入T1战略
  liao: { name: '巴僚弩手', tier: 4 },        // 江阳·侯弘远僚人酋帅（缺乏极其著名的战术高光，降T3）
  sou: { name: '越巂叟兵', tier: 4 },         // 乐山·高定元叟族反蜀（缺乏极其著名的战术高光，降T3）
  qingqiang: { name: '青羌突骑', tier: 3 },    // 姜维北伐核心兵源，三国文化特色异族骑兵，升T2
  qingyi: { name: '天师道众', tier: 3 },       // 汉末张鲁政教合一的道教武装（鬼卒/祭酒），文化辨识度极高，升入T3知名
  // ── 2026-06-18：武陵/叙永/慈利/秀山/房陵/珙县/来凤精锐 ──
    zhongxiang: { name: '锦帆贼', tier: 2 },
  she: { name: '永宁彝兵', tier: 3 },          // 叙永·奢崇明起兵反明（名气不足，降T2）（缺乏进攻高光，降T3）
  tan_d: { name: '慈利土兵', tier: 4 },       // 慈利·覃垕率土兵起义（明正德）（常规番号，降T3）
  ran_d: { name: '冉氏土兵', tier: 4 },        // 秀山·冉守忠南宋土兵从征（常规番号，降T3）
  kuai: { name: '蒯氏宗兵', tier: 4 },         // 房陵·蒯越宗族私兵（汉末荆襄）
  boren: { name: '僰人藤牌兵', tier: 3 },     // 悬棺僰人特色武装，西南藤牌兵代表，升入T3知名
  xiang_d: { name: '向氏土兵', tier: 4 },      // 来凤·向大坤土司（向王天子）
    qianhui: { name: '回民义军', tier: 4 },           // 常规番号，降T3
  huizhou_d: { name: '元戎弩兵', tier: 2 }, // 诸葛亮损益连弩部队，战术辨识度极高的特种精锐，升入T2战术
    wuling: { name: '五溪藤甲', tier: 3 },            // 三国藤甲兵文化符号（火烧藤甲），显著文化知名度，升T2
    zizhou: { name: '忠武八都', tier: 1 },            // 唐末平定黄巢、维持中原局势的绝对王牌主力军，升入T1战略,
    weizhou: { name: '奉义军', tier: 1 },
};
