/**
 * SandboxDisplayNames.ts
 *
 * 沙盒模式下势力旗帜上要渲染的"短名"字典 (factionId → 1-2 字)。
 *
 * 历史: 原本作为局部变量定义在 CityAssetManager.getProcessedFlagText 内部，
 * 但 CityEditor 等 UI 需要在编辑时实时检查"某 faction 是否登记了旗号短名"，
 * 因此抽取到独立文件，两个消费者都 import。
 *
 * ⚠ 规范 (来自 cities.ts 顶部注释 + AGENTS.md §4.4):
 *   - 单字势力 (如秦、汉、唐): 用单字
 *   - 复姓/双字势力 (如 hongbang 鸿庞, daxia 大夏, gongsun_d 公孙):
 *     **必须**用完整双字。系统底层 DynamicFlagTextGenerator 原生支持双字垂直排版，
 *     **绝对不允许简化为单字**（如把鸿庞简写为"庞"、大夏简写为"大"）。
 *   - **政权（优先级 2）**：旗号 = 史籍**正式国号**（如 大理、大清、大周、百济、黎）。
 *     禁止自造截字（后百）、地名代国号（兰）、姓代国号（甄）、后缀国/族/人（黎国）。
 *   - 🔴 **中国旗号一字优先（2026-10-26 主人令「中国旗号能用一个字的就用一个字，但是要符合历史」）**：
 *     中国政权的旗号一律写**史籍正式国号**；**国号本为一字的就写一字**（东晋→晋、后晋→晋、
 *     南唐→唐、南汉/成汉/后汉/汉赵→汉、孙吴/杨吴→吴、刘宋→宋、萧齐/高齐→齐、冉魏→魏、
 *     后秦→秦、后赵→赵、后周/武周→周、南梁/后梁→梁、马楚/荆楚→楚、前蜀→蜀、成家/成汉→成、
 *     隋→隋）；**没有通行一字简称的两字国号仍写两字**（大顺、大西、大周、大夏、大燕、大理、南越、吴越、
 *     南诏、天完…不许为凑一字丢「大」或截字；已按通行简称写单字的 明/清/元/金 保持）。**同一国号按史可重旗**（晋国/东晋/后晋 都写「晋」），
 *     靠势力色＋旗形区分，不再强求全局唯一。非中国政权仍守全局唯一。
 *   🔴 **越南政权同理（2026-11-04 主人令「越南的很多势力的旗号只用一个越字，用颜色区分，理由是他们是汉字区」）**：
 *     瞿越（大瞿越）/大越/越南三朝国号本字都是「越」→ 旗号统一「越」；与阮福映同场内战的西山写「西山」（主人：「用西太泛指」）。
 */
export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {
    'barakzai_afghan': '巴宰', // 巴拉克宰
    'zand_dynasty': '赞德', // 赞德
    'aizu_ashina': '芦名', // 芦名家
    'aq_qoyunlu': '白羊', // 白羊土库曼
    'bulidi': '布迪', // 布里迪埃米尔国
    'tahirid': '塔氏', // 塔希尔埃米尔国
    'heruli': '赫鲁', // 赫鲁利
    'huanchu': '桓楚', // 桓楚
    'gallic_empire': '高卢', // 高卢帝国
    'jingzhou': '荆', // 荆州
    'libiya': '利比', // 利比亚
    'jiaxite': '加喜', // 加喜特
    'hulumusi': '忽鲁',
    'bolinixiya': '波利',
    'pattani': '北大',
    'kilwa': '基尔',
    'handong': '汉东', // 刘黑闼汉东王
    'douxia': '夏', // 窦建德·夏
    'mari_ancient': '马里', // 幼发拉底马里王国
    'mombasa': '蒙巴',
    'mogadishu': '摩加',
    'malindi': '林迪', // 「马林」已被马林苏丹国占用
    'zuraid': '祖拉',

  // ── [2026-08-26 全面检查旗号] 实际旗号 = 本表登记优先，未登记则取势力名前两字
  //    （见 CityAssetManager.getProcessedFlagText）。全量比对 957 个有城势力：
  //    未登记 4 个（本轮新增的大西洋航线势力）+ 撞车 3 组，一并收口，现全部唯一。
    taino_d: '泰诺',  // 泰诺（古巴东部亚拉）
  guanche: '关切',  // [2026-08-26] 加那利原住民关切人（柏柏尔系）
  // 🔴 [2026-11-04 主人令「按历史修复」] 原 'yasuer'（亚速尔，葡属、非政权）已并入葡萄牙，旗号登记删除
  chamorro: '查莫',  // 查莫罗（关岛·阿加尼亚）；[2026-10-24] 音译名不截一字
  ayinu_ezo: '阿伊',   // 🔴 [2026-09-12] 原「虾夷」与 ayinu(虾夷)撞旗 → 按势力名「阿伊努」取前两字「阿伊」

  boootiya: '底比',
  kelite: '威共',  // 威尼斯共和国（干地亚要塞）
  leangongguo: '莱昂',
  xixiliwangguo: '西西',
  'liangxixili': '两西',  // 🔴 [2026-11-03 主人令「还是单独算势力吧，没有打过仗的，可以旗号，颜色一致」] 同系政权单独成势力，旗号/颜色随本家

  yipilusi: '伊庇',
  lagoniya: '斯巴',
'maqidun': '马其',
  sesali: '色萨',
  lagusa: '拉古',

'meikelunbao': '文德',
  didi: '佛兰',
  yidelisi: '伊德',
  baojialiya: '保',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
'bosiniya': '波黑',  // 🔴 [2026-09-12] 原「波斯」与 boluosi(波斯帝国·已删，与阿契美尼德重复)撞旗 → 取中文标准简称「波黑」

  mulabite: '穆拉',
    awraba: '奥雷',  // [2026-10-24 主人令「哪些单字合适就用单字」] 音译名无通行单字简称，不截一字
  'malin': '马林',   // 🔴 [2026-10-28 主人批修] 马林王朝简称（库里无重）

  zhayan: '扎扬',
  hamade: '哈马',
'buni': '迦太',
  aguelabu: '阿格',
'jileinaijia': '昔兰',

  maixiya: '麦西',
  nidelan: '尼德',
'pomeilaniya': '波美',
  talanduo: '塔兰',
  safuyi: '萨伏',
  jiatailuoniya: '加泰',
  nasier: '纳斯',
'seleisi': '色雷',

  pufaerci: '普法',
  hansa: '汉萨',
  batawei: '巴塔',
  weijing_york: '约维',
  aquidan: '阿奎',
  puluowangsi: '普罗',
  lunbadi: '伦巴',
'donggete': '东哥',
  xigete: '哥特',
  alagong: '阿拉',
  aboerleiya: '阿尔',   // 阿尔博雷亚（撒丁判官国）

  mangsite: '芒斯',
'tuomengde': '托蒙',
  piketai: '皮克',
  yinggelan: '英',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
'bulabante': '班特',
  gaolu: '法',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
  kaernute: '卡尔',
  bulietani: '布列',
'fulandesi': '阿图',
  xila: '雅典',
  putaoya: '葡',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
'saierweiya': '拉什',
'luosi': '罗斯',
  eluosi_diguo: '俄',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
  daniebo: '斯摩',
  qiernigeweifu_gongguo: '切尔',
  jialixiya: '哈尔',
  pusikefu_gongheguo: '普斯',
  ouka: '梁赞',   // 🔴 [2026-11-04 按历史修复] 势力改「梁赞」，旗号「梁赞」
  xideweina: '波洛',
  jinzhang: '金帐',
  baojiaer: '不里',  // [2026-08-26 旗号去重] 伏尔加保加尔：「保加」与保加利亚(特尔诺沃)撞；《元史》作「不里阿耳」
'baizanting': '拜占',
  bosi_puluosi: '博普',
'kelimiya': '热亚',  // 热那亚共和国（卡法）
'litaowan': '立',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
'bolan': '波兰',
'baojian_qishi': '宝剑',
  teweier_gongguo: '特维',
  suzidaer: '苏兹',
  gesake: '哥萨',
  moerdaweiya: '摩尔',
  walajiyia: '瓦拉',
  tiaodun_qishi: '条顿',
'shengdian_qishi': '圣殿',
'yelusalengwg': '耶路',
  maerta_qishi: '马耳',
  'danmai': '丹麦',
    'xinbuli': '辛布',   // 辛布里（金布里）
'ruidian_si': '瑞典',
'kasidiliya': '卡斯',
'teluoyi': '特洛',
  peilieya_gongguo: '佩列',
  habusibao: '哈布',
  boximiya: '波西',
    'yidali_wangguo': '意大',   // 意大利王国
    'luxitaniya': '卢西',
    'tuoerkete': '托尔',
    'yadian_gongguo': '雅公',
    'mayapan': '玛潘',
    'songhai': '桑海',
    'shahi': '沙希',
    'xisa': '西萨',
    'xilawangguo': '希腊',
    'mani_beylik': '曼贝',   // 曼尼贝伊国（避让曼尼普尔「曼尼」与马尼拉「马尼」）
    'filiki_eteria': '友爱', // 友爱社
    'ante': '安特',
    'suweihui': '苏维',
    'yibiluliya': '伊比',
    'yicha': '伊察',
    'mengjiala': '孟加',
    'yili': '伊里',
    'daqiya': '达契',
    'qiajia': '恺加',
    'arevaci': '阿雷',
    'epirus_despotate': '伊庇',
    'teotihuacan': '特奥',
    'salakanagara': '萨拉',
    'helvetii': '赫尔',
    'hussites': '胡斯',
    'cherusci': '切鲁',
    'rashtrakuta': '拉什',
    'andean_rebellion': '安起',
    'abkhazia_kingdom': '阿布',
    'mac_dynasty': '莫氏',
    'restored_hanthawaddy': '复汉',
        // 🔴 [2026-11-09 主人令「建州女真和大清势力合并」] 原 jianzhou 的旗号「建州」已删除（原违规：旗号含「州」；势力并入大清，旗号随大清「清」）
    'bashkir': '巴什',
    'drevlians': '德列',
    'marcomanni': '马科',
    'serbia_revolution': '塞革',
    'caledonia': '喀里',
    'goths_migration': '哥特',
    'syracuse': '叙拉',
    'hamdanid': '哈姆',
    'wiman_joseon': '卫',   // 🔴 [2026-11-09 主人令「改成卫」] 原「卫满」是武将名（旗下有卫满、卫右渠），人名不许当旗号 → 取国号「朝鲜」的家族称首字「卫」（史称卫氏朝鲜）
    'gusiluo': '唃厮',
    'old_saxons': '古撒',
    'alamanni': '阿勒',
    'taifa_toledo': '托泰',
    'florence': '佛罗',
    'tuitonga': '汤加',
    'rapanui': '拉帕',
    'later_baekje': '后百',
    'arverni': '阿维',
    'imro': '内马',
    'bulgaria_third': '保公',
    'aksum': '阿克',
    'milan_duchy': '米兰',
    'lombard_league': '伦联',
    'cilicia_armenia': '奇里',
    'armenia_arsacid': '亚萨',
    'syunik_bek': '休尼',
    'northumbria': '诺森',
    'wessex': '威塞',
    'subroman_britain': '布立',
    'xinmeiliyan': '辛梅',
    'aixini': '爱西',
    'taluma': '塔鲁',
    'lugii': '卢吉',
'mazhaer': '匈',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
  falanji: '弗兰',
  koln: '科隆',   // 🔴 [2026-10-28 主人批立] 科隆大主教区简称（库里无重）
  shiwaben: '施瓦',
  asikanani: '勃兰',
'wende': '萨克',
  bafaliya: '巴伐',
  ruishi: '瑞士',
  damolaweiya: '摩拉',
  // 🔴 [2026-11-09 主人令「罗马不要用大秦。罗马不是符号吗」] 罗马帝国挂符号旗 `FACTION_EMBLEM['luoma_diguo'] = 'EAGLE'`（军团鹰），
  //    旗面上不画字 —— 原 2026-11-01 那条「旗号与首府据点名『罗马』逐字相同，改『大秦』」的前提（播报会念成「罗马 罗马军团」）
  //    对符号旗不成立，故按主人令撤回：旗号恢复势力简称「罗马」，盖 11-09 令优先于 11-01 令。
  luoma_diguo: '罗马',
  xiongren: '匈人',
    'awaer': '瓦尔',   // 阿瓦尔

  heishui: '靺鞨',
'fushi': '秦',  // 🔴 [2026-11-03 主人令「势力用历史上的公认称呼，旗号用简称」] 国号秦，不用姓
  fuguo: '附',

'yada': '厌抵',
'guishuang': '贵霜',
  'sijitai': '斯基',

    'shang': '商',
    'zhou': '周',
'qi': '齐',
    'jin': '晋',
'wu': '吴',
'yue': '越',
'nanyue': '南越',
'qin': '秦',
'song': '宋',
    'yan': '燕',
'zhao': '赵',
'wei': '魏',

'caowei': '魏', // 三国曹魏（与战国魏同字重旗，靠势力色区分）
'han': '韩',
'han_d': '汉',
    'shu': '汉',
'juqu_d': '凉',  // 🔴 [2026-11-03] 北凉国号凉，不用姓
'tufa_d': '凉',  // 🔴 [2026-11-03] 南凉国号凉，不用姓
'qiuchi': '仇池',
'helian': '夏',  // 🔴 [2026-11-03] 国号夏，不用姓
'xiongnu': '匈奴',
'xianbei': '鲜卑',
'tuoba': '魏',  // 🔴 [2026-11-03] 北魏国号魏，不用姓
'yuwen': '周',  // 🔴 [2026-11-03] 北周国号周，不用姓
'chen': '陈',
'sui': '隋',
    'tang': '唐',
    'da_qin': '秦',   // 🔴 [2026-10-28] 大秦（朱泚）｜国号秦，一字旗；与前秦、后秦同国号重旗（按史允许）
    'min': '闽',
'shatuo': '沙陀',
'bohai': '渤海',
'dangxiang': '夏',  // 🔴 [2026-11-03 主人令「按建议改」] 「大」是尊称，旗号写国号字
'menggu_d': '蒙古',
'manzhou_d': '清',
'ming_d': '明',
'jianwen': '明',   // 🔴 [2026-11-09 主人令「建文是明」] 建文只是年号，国号仍是明（靖难中的建文朝廷 1399–1402）
'shunde': '明',   // 🔴 [2026-11-09 主人令] 宁王朱宸濠 1519 只改元「顺德」，从未改国号，国号仍是明（原旗号「顺」不截年号首字）
'liao_d': '辽',
'kong_d': '鲁',

'rouran': '柔然',
    'baiji': '百济',
'tubo': '吐蕃',
'tujue': '突厥',

'dayue': '越',  // 🔴 [2026-11-04 主人令「越南势力旗号只用一个越字，用颜色区分；他们是汉字区」] 李陈后黎莫国号「大越」（1054–1804），取国号本字「越」
    'ryukyu': '琉球',
    'so': '对马',
    'goto': '五岛',
    'omura': '大村',
    'wandan': '万丹',
    'gaya': '伽倻',
    'chosokabe': '土佐',
'xingliao': '兴辽',
'gongsun_d': '辽东',
'wusun': '乌孙',
'dayuan': '大宛',
    'gouding': '句町',
    'baibo': '黄巾',
    'wuhuan': '乌桓',
'xianlingqiang': '先零',
'yelang': '夜郎',
'ailao': '哀牢',
'fuyu': '夫余',
'shule': '疏勒',
    'shache': '莎车',
'qiuci': '龟兹',
'yanqi': '焉耆',

'gaogouli': '高句',
    'xinluo': '新罗',
    'luoyue': '骆越',
    'ba': '巴',
'qifu_d': '秦',  // 🔴 [2026-11-03] 西秦国号秦，不用姓

    // 2026-05-25 两晋核对追加势力
'murong': '燕',
    'erzhu': '尔朱',


    // 2026-05-25 汉朝核对追加势力
    'ouyue': '瓯越',

    // 2026-05-25 三国核对追加势力
    // ── 2026-06-16 改：符离·宿（§4.7；旗号「徐」让位下邳徐国）──
    'gaoqi_d': '齐',
    'wuzhou_d': '周',
'xibo_d': '锡伯',
'ranwei_d': '魏',

'sunwu_d': '吴',

    // ── 2026-05-25 新增：隋朝核对追加势力 ──
'linshihong': '干越',
'xijue': '十箭',

    // ── 2026-05-25 新增：唐朝核对追加势力 ──
'xueyantuo': '薛延',
'tujishi': '突骑',
    'nanzhao': '南诏',
'xiaobolu': '勃律',

    // ── 2026-05-25 五代十国势力 ──
'dali': '大理',
    'luodian': '罗甸',

    // ── 2026-05-25 北宋辽金势力 ──
'goryeo': '高丽',
    // 🔴 [2026-11-09 主人令] 侬智高 1052 年破邕州称帝，国号「大南国」（《宋史·广源州蛮传》「僭号仁惠皇帝…号其国曰大南国」）→ 旗号写国号「大南」（国号两字不截字，原写地名「邕」不合旗号规则）
    'nongzhigao': '大南',
'fangla': '圣公',  // 🔴 [2026-11-03] 方腊自号圣公，不用姓

    // ── 2026-05-25 北宋辽金势力 v2 ──
'yang_aner': '天顺',
    'dixiang': '新',

    // ── 2026-05-25 元朝蒙古势力 ──
'huarazim': '花剌',
    'pagan': '缅',
    'champa': '占婆',
'dongxia': '东夏',
'chagatai': '车师',
'kereyid': '克烈',
    'naiman': '乃蛮',
    'tatar': '塔塔',
'ongut': '汪古',
'xushouhui': '天完',
    'zhangshicheng': '周',  // 🔴 [2026-11-03 主人令「按建议改」] 「大」是尊称，旗号写国号字

    // ── 2026-05-25 明朝势力 ──
    'dengmaoqi': '铲平',
'dada_ming': '鞑靼',
'oirat_ming': '瓦剌',   // 🔴 [2026-11-09 主人令「统一旗号，一律改为瓦剌」] 卫拉特＝瓦剌（Oyirad 明清两种译名），旗号统一写「瓦剌」，靠势力色区分（原「卫拉」）
'haixi_nvzhen': '海西',
'yeren_nvzhen': '萨哈',
    'jilimi': '吉里',
    'kakizaki': '松前',
    // ── 2026-06-16 改：旗号「藤原」（§4.4 家族；禁「」字；势力全名仍奥）──
    'fujiwara': '藤原',
'luchuan': '麓川',
'xihai_d': '吐谷',
    'joseon': '朝鲜',
    'siam': '暹罗',
'chenla': '真腊',
    // ── 2026-05-25 明清之际势力（28个）──
    'dashun': '大顺',
'daxi_ming': '大西',
'chenghan': '成',
    // 🔴 [2026-11-09 主人令] 隆武（南明，朱聿键）国号仍是「明」，隆武只是年号 → 旗号写国号「明」
    'longwu': '明',
    // 🔴 [2026-11-09 主人令] 鲁监（鲁王朱以海监国，奉明正朔）→ 旗号写国号「明」（原「婺」是地名简称，无依据）
    'lujian': '明',
    'khoshut': '和硕',
    'yarkand': '叶尔',
'khoja': '和卓',
'jinchuan_g': '金川',
'shuntian': '顺天',   // 🔴 [2026-11-09 主人令「哪有顺这个旗号，有历史出处吗」] 林爽文只有年号「顺天」、没有国号 → 旗号照年号全写「顺天」，不截首字（旧值「顺」无出处）
'bailian': '白莲',
'chimei': '赤眉',
        'zhangchu': '张楚',   // 张楚·陈胜
        'desheng': '汉',   // 🔴 [2026-11-09 主人令] 刘通称汉王（《明史·刘通传》），国号汉；德胜只是年号 → 旗号写国号「汉」
        // 🔴 [2026-11-05 按A执行] 'wuzhou_yijun' 已并入隋国，旗号登记删除
    'gurkha': '廓喀',
'xiadun': '夏顿',
    'kazakh': '哈萨',
'kokand': '霍罕',
    'badakhshan': '达克',
    // ── 2026-05-25 晚清／近代势力（21个）──
'taiping': '太平',
    'dacheng': '大成',
    'tuoming': '清真',
    'ashikaga': '室町',
    'yamato': '大和',   // 大和朝廷（平安）
    // ── 2026-05-26 新增：大金、大元 ──
'dajin': '金',
'yuan_d': '元',

    // ── 2026-05-26 新增：肃慎系势力（挹娄、勿吉、靺鞨）──
    'yilou': '挹娄',
    'wuji': '勿吉',

    // ── 2026-05-26 新增：室韦（隋唐时期东北亚部落联盟）──
'shiwei': '室韦',

    // ── 2026-05-26 新增：濊貊、毛文龙（毛文龙旗号用"毛"）──

    // ── 2026-05-26 新增：漠北草原势力旗号 ──
'gaoche': '高车',

    // ── 2026-05-26 新增：西域/中亚势力旗号（14个）──
'kala': '喀喇',   // 🔴 [2026-11-07 主人令「建立一个喀喇汗国」] 旗号＝势力简称前两字（原「喀汗」是截名凑字）
'sogdian': '粟特',
    'geluolu': '葛逻',
    'yuchi': '于阗',  // 🔴 [2026-11-03] 国名于阗，不用姓
'an': '乌兹',
'shi_clan': '石氏',

    
'hongirad': '弘吉',
    // ── 2026-05-26 新增：青藏高原势力旗号（18个）──
'ladakh': '玛域',
'tsangpa': '藏巴',
'ganden': '甘丹',
'supi': '苏毗',
'khon': '萨迦',
    'lang_clan': '帕竹',
    'karmapa': '噶玛',
    // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力旗号 ──
    'ava': '阿瓦',
'dongxu': '东吁',
    'meitai': '曼尼',
    'hantawadi': '汉达',
    'pyu': '骠',
    'mon': '孟族',
    // 🔴 [2026-11-09 主人令] 明郑旗号改为「明」（与大明同国号同字重旗，靠势力色＋旗形区分）
    'ming_zheng': '明',
    'xiou': '西瓯',
    'paiwan': '排湾',

    // ── 2026-05-26 Phase 3h：新增賨、僰、谯、折、山越、畲、蒲 ──
    'she_ethnic': '畲',

    
'wuling': '五溪',

    // ── 2026-05-27 新增：汪、向、覃、冉、储 ──

    // ── 自动补全剩余的特殊势力映射，防止显示英文 ──
'cen_d': '岑',  // 🔴 [2026-11-04 按历史修复] 势力改「岑氏」（家族），旗号用姓氏「岑」
    // ── 2026-05-27 补充：旗号文字缺失的14个势力 ──
    'weili': '尉犁',
    'pishan': '皮山',
    'bandun': '板楯',
    'seljuq': '塞尔',

    // ── 2026-05-27 新增：青衣、五溪、姑蔑 ──

    // ── 2026-05-27 新增：生苗 ──

    // ── 2026-05-27 新增：且兰 ──

    // ── 2026-05-27 新增：土尔扈特、索、伊吾 ──
'tuerhute': '土尔',

    // ── 2026-05-27 新增：白马、蒯、庸、申、叟 ──
'shen': '申',

    // ── 2026-05-27 新增：烧当 ──
    'shaodang': '烧当',

    // ── 2026-05-27 新增：靖江、盘瑶、马楚、排瑶、士、蒋 ──
    'panyao': '盘瑶',


    // ── 2026-05-28 新增：黎(崖) ──
    // ── 2026-05-28 新增：工布(工布) ──

    // ── 2026-05-28 新增：果洛、土谢图、土默特 ──
'golog': '果洛',
    'tumed': '土默',

    

    


    // ── 2026-05-27 重制：药罗葛(娑陵) ──

    // ── 2026-05-28 新增：南部(根城/日本)、萨曼(阿母城/中亚)、西域四政权 ──
    'saman': '萨曼',
  'sanfoqi': '三佛',

    // ── 2026-05-28 新增：马蒙、古兹根、傣、泰沅、帕銮、罗斛 ──
    'dai': '傣族',
'taiyuan': '泰沅',
    'luohu': '罗斛',

    // ── 2026-05-28 新增：黑龙江流域民族/家族 ──


    

    'liren': '俚',

    // ── 2026-05-28 新增：岭、琼波、索伦、图瓦 ──
'gling': '玉树',
'suolun': '达斡',

    // ── 2026-05-28 新增：大隅(赤尾木城)、奄美(赤木名城) ──

    // ── 2026-05-28 新增：康区藏族土司/部落 ──
    // 🔴 [2026-11-04] 'dalung'（并入甘丹颇章）旗号登记删除
    'gar_kham': '德格',   // 🔴 [2026-11-04 按历史修复] 势力改「德格土司」，旗号「德格」
    'kongsa': '孔萨',

    // ── 2026-05-28 新增：波密(博窝) ──

    // ── 2026-05-28 新增：达擦(八宿宗/康区) ──
    // 🔴 [2026-11-04] 'daca'（并入甘丹颇章）旗号登记删除

    // ── 2026-05-28 新增：景东(银生城/云南) ──

    // ── 2026-05-28 新增：霍尔(索宗/那曲) ──
    'hor': '霍尔',

    // 🔴 [2026-11-10 主人令「删除这个势力」] 'dong'（囊谦土司）已删，旗号登记删除

    // ── 2026-05-28 新增：白狼(巴塘宗/康区) ──
'bailang': '白狼',

    // ── 2026-05-28 新增：后突(黑沙城/阴山北麓) ──
'duolu': '咄陆',
'tiemuer': '帖木',   // 🔴 [2026-11-04 按历史修复] 势力改「帖木儿帝国」，旗号「帖木」
    'keerkezi': '柯尔',
    'yizhi': '一支',
'yiwu': '伊吾',
    'duerbote': '杜尔',
    'kaerka': '喀尔',
'huihu': '回鹘',
'wuzhumuqin': '乌珠',
'zhadalan': '扎答',
    'zhuerqi': '主儿',
    // 🔴 [2026-10-25 主人令「删除起义势力」] `panjun`（势力名「起义」）占位势力的旗号登记已删除。
    // 🔴 [2026-10-24 主人令「义军的旗号是势力简称」] 恢复被并入占位势力的各家政权（旗号取自归并前原值/势力简称）
    'qiufu': '剡中',
    'chendiaoyan': '畲汉',
    'yezongliu': '处',
    'qianhui': '回',   // 🔴 [2026-10-28] 势力改名「回军→回民」，旗号用简称单字「回」（库里无重）
    'miaomin': '苗',
    'zhongxiang': '鼎',
    'yang_bozhou': '播',  // 🔴 [2026-11-03] 地名播州，不用姓
    'she': '奢安',
    'tan_d': '土家',
    'wumeng': '越蛮',
    'boren': '都掌',
    'sou': '越嶲',
    'qiong': '邛谷',
    'dongzu': '侗',
    'shengmiao': '生苗',
    'buyi_d': '布依',
    'shuizu': '水',
    'haikou': '倭',   // 🔴 [2026-11-05 主人令「改成海贼倭寇」] 势力名改「海贼倭寇」，旗号取简称「倭」
    'liuzhen': '六镇',

'you': '幽',
    'yumi': '扜弥',
    'xiye': '西夜',
    'galangdiba': '波密',
    'cuanshi': '爨',
'dianguo': '滇',
    'danluo': '耽罗',
'iga_d': '伊贺',
    'kaga_d': '加贺',
'date_d': '伊达',
    'otomo_d': '大友',
    'suwa_d': '诹访',
    'hui': '濊族',
    'wure': '兀惹',
    'sunite': '苏尼',
    'weiwuer': '乌第',
    'wensu': '温宿',
    'keerqin': '科尔',

    // ── 2026-05-31 新增：民族起源地6势力 ──
    'xiangxiong': '象雄',
'zhaowu': '昭武',
    'ruoqiang': '婼羌',

    // ── 2026-05-31 新增：原生小政权都城4势力 ──
    'qiemo': '且末',
    'weitou': '尉头',

    // ── 2026-05-31 修复：补齐之前遗漏的10个势力 ──
    'qiepantuo': '护密',
    // ── 2026-06-11 新增：库页岛民族 ──
    'eluoke': '鄂罗',
    // ── 2026-06-11 新增：阿伊努（北海道）──
    // ── 2026-06-11 新增：北海（北海道北端）──
    // ── 2026-06-11 新增：水达达（黑龙江下游）──
'ewenki': '鄂温',
    // ── 2026-06-11 新增：东平（郡·黑龙江下游）──
    // ── 2026-06-11 新增：外兴安岭/外贝加尔边境 ──
    'buriat': '布里',
    // ── 2026-06-11 新增：锡尔河下游（毡的/养吉干）──
'yanda': '白匈',
'konbaung': '贡榜',
'tianxiong': '魏博',
'huaixi': '淮西',
'gengshi': '汉',   // 🔴 [2026-11-09 主人令] 刘玄汉室宗亲复汉，国号汉；更始只是年号 → 旗号写国号「汉」
'shierShijun': '使君',
'xishan': '西山',  // 🔴 [2026-11-04 主人「用西不太好，太泛指；不行就用西山」] 西山朝国号虽亦称大越，但与阮福映（越）同场内战，旗号用西山区分
'malla': '玛拉',
// 🔴 [2026-11-04 主人令「按历史修复」] shangdu／wistahm 两个势力已删（都不是政权：两都之战的元内一方、萨珊末期权臣本人），并入大元／萨珊，旗号登记同时删除
'mihran': '米赫',
// 🔴 [2026-11-05 按A执行] 'dongyang'（会稽义军）已并入隋国，旗号登记删除
'xiwasi': '埃雷',
'mengguqieke': '门古',
'sumuroyi': '米沙',
    'yun': '允戎',
    'huangwang': '齐',  // 🔴 [2026-11-03] 黄巢国号大齐，不用姓
'yehe': '叶赫',
    
'wula': '乌拉',
'bayegu': '拔野',
    'ketagalan': '凯达',
'suke': '素可',  // [2026-10-24 主人令「哪些单字合适就用单字」] 音译名无通行单字简称，不截一字
'gaochang': '高昌',  // 🔴 [2026-11-03] 国名高昌，不用姓
'chuyue': '处月',
    'baidi': '白狄',
    'huite': '辉特',
'zubu': '阻卜',
    'jiashi_d': '迦尸',
  jiazini: '伽色',
  fanyanna: '梵衍',
    'kepantuo': '渴盘',
'yangguan': '凉',   // 🔴 [2026-10-28 主人令「势力名字用东南西北上下的，旗帜用一个国号字」] 西凉国号「凉」（史称西凉）→ 凉
'xiliangjun': '董',   // 🔴 [2026-11-03 主人令「就叫西凉军，旗号董」] 董卓集团无国号无称号，旗号用董
    // ── 2026-06-19 新增：马尔吉亚纳·乌古斯 ──
    xierhe: '锡尔',
    // ── Phase 1 Missing Flags ──
    'kumoxi': '奚',
    'shanshan': '鄯善',
'guiyi': '归义',
  // —— 2026-06-20 新增：旁遮普·阿托克 ——
  // —— 2026-06-20 新增：那竭国·顶骨城 ——
'dulan_d': '杜兰',
'xisi': '萨法',   // 🔴 [2026-11-09 主人令] 861 年雅库布据锡斯坦建萨法尔王朝（صفاریان）；「锡斯坦」是地区名 → 势力正名「萨法尔」，旗号「萨法」
  huluo: '呼罗',
'wuyue': '吴越',
  'minyue': '闽越',
'funan': '扶南',
  'lancang': '澜沧',
  'ahaomu': '阿萨',
'elunchunzu': '鄂伦',
'tajikezu': '塔吉',
'jingpozu': '景颇',

'xingwei': '兴威',
    'saerbadaer': '萨尔',
    'yilihanguo_d': '伊利',
    'wulaertu': '亚美',
'wulaertu_guo': '乌图',
'gelujiya': '格',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
'bendou': '特拉',
    'bendou_d': '本都',
    'saipulusi': '塞浦',
    'heti': '赫梯',
'fulijiya': '弗里',
    'ldiya': '吕底',
    'pajiama': '帕加',
      'luomu': '罗姆',
      'osman': '奥斯',
'yinduxila': '印希',

'asakaini': '阿萨',

'sailiugu': '塞琉',
'womaya': '倭马',
    'xibolai': '以色',
    'aiji': '埃及',
'tuolemi': '托勒',
    'jialedi': '迦勒',
    'paermila': '帕尔',
'abasi': '阿拔',
    'xikesuosi': '喜克',
'yashu': '亚述',
    'midi': '米底',
'aqimeinide': '阿契',
'sashan': '萨珊',
    'ailan': '埃兰',
    'safawei_d': '萨朝',
'sumeier': '乌鲁',
    'ayoubu': '阿尤',
    'mamuluke': '马穆',
    aosiruowen: '若恩',  // 奥斯若恩（埃德萨）；「奥斯」撞奥斯曼，改取后两字
    'kesa': '可萨',
'aiaoniya': '爱奥',
    'jialatai': '加拉',
    'ansxi': '安息',
    'nabatai': '纳巴',
    'xike': '锡克',
    'deli': '德苏',
    'sur': '苏尔',   // 🔴 [2026-10-28 主人批立] 苏尔王朝简称（库里无重）
    'mowoer': '莫卧',
    'jieri': '戒日',
'kongque': '孔雀',
    'mojietuo': '摩揭',
    'boluo': '波罗',
    'dedan': '德丹',
    'maidina': '拉希',
    'gulaishi': '古莱',
    'xiemian': '萨维',
    'salai': '诺盖',
    'aztec': '阿兹',
    'yiluokui': '易洛',
    'qimu': '奇穆',
    'talasike': '塔拉',
    'tailuona': '泰罗',
    'teweierqie': '尔切',  // 「特维」已被特维尔公国(teweier_gongguo)占用，取后两字
'inca': '印加',
    'maya': '玛雅',
    'mapuche': '马普',
    'muisca': '穆伊',
    'tupi': '图皮',
    'manzheboyi': '满者',
    'zhelouqi': '乔汉',
    'suosuo': '索索',
    'antiaokegongguo': '赞吉',  // 赞吉王朝（拉塔基亚）
    'saimien': '塞米',
    'kaliya': '卡里',
'adiyabeina': '亚贝',
    'kuman_oleshky': '库曼',
    'tamoyue': '塔莫',
    'bogendigongguo': '勃公',
    'bogendi_wangguo': '勃王',   // 勃艮第王国（古典）
    'amaniyake': '阿马',
    'weiershigongguo': '威尔',
    'taimier': '马拉',
    'xibanya': '西',  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
'manding': '曼丁',
'ethiopia': '埃塞',
'zhagewei': '扎维',
    'adal': '阿达',
    'malacca': '满剌',
    'medang': '马打',
    'ternate': '特尔',
    'sulu': '苏禄',
    'gurjara': '瞿折',
    'suomunate': '索兰',
    'zhuluo': '朱罗',
    'sengjialuo': '僧伽',
    'pandiya': '潘地',
    'kushi': '库施',
    'aolisha': '东恒',
    'kanata': '维查',
    'adile': '比贾',
    'yilisi': '埃利',
    'nuowei': '挪威',
    'keernuwaye': '康沃',
    'wuer': '乌尔',
    'jienei': '杰内',
'muwaxide': '穆瓦',
    'yilaka': '伊拉',
    // 🔴 [2026-11-04 主人令「按历史修复」] xingelana（新格拉纳达总督区）已并入西班牙，旗号登记删除
    'gualani': '瓜拉',
    'bulu': '波罗',
    'kanan': '推罗',
    'feilisidin': '非利',
'mallabhum': '末罗',
    'vidin_tsardom': '维丁',
    'samtskhe': '萨姆',
    'tomara_gwalior': '托摩',
    'qutb_shahi': '库特',
    'minangkabau': '米南',
    'tutul_xiu': '休族',
    'aswaka': '斯瓦', // 🔴 [2026-09-19 主人指出审计警告] 原登记「阿斯」与 asikanani(阿斯坎尼) 撞车；「阿瓦」又撞 ava(阿瓦王国) → 取其所居**斯瓦特**河谷之「斯瓦」
    'malli': '马利',
    // 🔴 [2026-10-20] 原「科塞亚」「乌克西亚」两个无城战役势力已删（武将改挂米底/埃兰），其旗号一并删除
    'genji': '源',
    // 🔴 [2026-09-19 主人指出审计警告「缺旗号」] 伊予源氏（松山，守将源义经）的旗号。
    //    规则（本文件头）：未登记则取**势力名前两字** = 「源氏」—— 实测**未与任何势力撞车**
    //    （genji 源氏本家登记的是「源」，取源氏姓氏；原「镰仓」与据点名「镰仓」严格相等，违反三者防重 §12.1），故这里把默认值显式登记下来，消掉审计警告。
    'genji_iyo': '伊予',  // 🔴 [2026-11-03] 地名伊予，不用姓
    'dasaleiti': '达萨',
    'kapaduoxiya': '卡帕',


    'aolitai': '奥里',
  dalriada: '达里',  // 达尔里阿达
  dublin: '都林',   // 🔴 [2026-10-28 主人批立] 都柏林王国简称（库里无重）
  scotland: '苏',  // 苏格兰；  // [2026-10-24 主人令「哪些单字合适就用单字」] 中文通行国名简称单字
  chanka: '昌卡',  // 昌卡
  ouchi: '大内',  // 大内
  cueva: '库埃',  // 库埃瓦
  maynila: '马尼',  // 马尼拉土邦
  gujarat: '古苏',  // 古吉拉特
  arakan: '若开',  // 阿拉干
  kosala: '拘萨',  // 拘萨罗
  kalinga: '羯陵',  // 羯陵伽
  anga: '鸯伽',  // 鸯伽
  shunga: '巽伽',  // 巽伽
  antigonid: '安提',  // 安提柯
'hou_han': '汉',
'yuan_shao': '冀',  // 🔴 [2026-11-03] 地盘冀州，不用姓
'hou_jin': '晋',
'hou_zhao': '赵',
'da_yan': '燕',  // 🔴 [2026-11-03 主人令「按建议改」] 「大」是尊称，旗号写国号字
'hou_liang': '梁',
'han_zhao': '汉',
'dongjin': '晋',
'nan_liang': '梁',
'hou_qin': '秦',
'yiqu': '义渠',
'hou_zhou': '周',
'lvbu': '徐',
'chengjia': '成',
'qianshu': '蜀',
'chuguo': '楚',
'liusong': '宋',
'nanqi': '齐',
'yangwu': '吴',
'nantang': '唐',
'machu': '楚',
'nanhan': '汉',
'fangguozhen': '浙东',
'liang_shuofang': '梁',  // 🔴 [2026-11-04] 势力改「鸣凤」（萧铣政权，国号梁），旗号仍写国号字「梁」
'liangshidu': '梁',      // 🔴 [2026-11-04 主人令「按历史修复」] 梁师都政权（国号梁、年号永隆）单立一家，与萧铣同国号，按 10-28「同一国号同字重旗」也写「梁」，靠势力色＋旗形区分
'qianliang': '凉',  // 🔴 [2026-11-03 主人令「前凉旗号应该用凉，和其他凉用颜色区分」] 国号「凉」，与阳关、凉州同字重旗，靠势力色区分
'liangzhou': '凉',
'dangchang_guo': '宕昌',
'sanada': '真田',
'tokugawa': '德川',
'amago': '尼子',
'shimazu': '岛津',
'mori': '毛利',
'uesugi': '上杉',
'takeda': '武田',
'toyotomi': '丰臣',
'utsunomiya': '宇都',
'nanchou': '南朝',
'nanbu_shi': '南部',
'shoni': '少弐',
'heishi': '平',
'imagawa': '今川',
'oda': '织田',
'hojo': '北条',
'mahan': '马韩',
'daquyue': '越',  // 🔴 [2026-11-04 同上] 丁朝·前黎国号「大瞿越」（968–1054；瞿＝越南语 cồ「大」的记音），本字仍是「越」
'yuenan': '越',  // 🔴 [2026-11-04 同上] 阮朝国号「越南」（1804 起），取「越」
'jiaohuangguo': '教皇',
'ghana_diguo': '加纳',
'yalan': '亚兰',
    gepids: '革皮',
    kalbids: '卡比',
    'chalkidike': '卡基',   // 卡尔基季基同盟
    'naxos': '纳克',   // 纳克索斯
    'paeonia': '佩奥',   // 佩奥尼亚
    'messenia': '美塞',   // 美塞尼亚
    'rhodes': '罗得',   // 罗得
    'zhongshan': '中山',   // 中山
    'linhu': '林胡',   // 林胡
    'chalcis': '卡基',   // 卡尔基斯
    'plataea': '普拉',   // 普拉提亚
    'methone': '梅托',   // 梅托涅
    'macedon_royal': '王军',   // 马其顿王军
    'arcadia': '阿卡',   // 阿卡迪亚同盟
    'lycia': '吕基',   // 吕基亚
    'dolopes': '多洛',   // 多洛佩斯
    'thasos': '萨索',   // 萨索斯
    'corinth': '科林',   // 科林斯
    'melos': '米洛',   // 米洛斯
    'argos': '阿戈',   // 阿尔戈斯
    'epidaurus': '埃皮',   // 埃皮道鲁斯
    'corcyra': '科西',   // 科西拉
    'mytilene': '米蒂',   // 米蒂利尼
    'jiangnan_yijun': '江南',   // 江南义军
    'jiangqi': '齐',   // 姜齐
    'luoma_gongheguo': '罗马',   // 罗马共和国
    'hasmonean': '哈斯',   // 哈斯蒙尼王国
    'arelat': '勃王',   // 上勃艮第王国
    'hou_womaya': '倭马',   // 后倭马亚
    'ganzhou_huihu': '回鹘',   // 甘州回鹘
    'gaochang_huihu': '回鹘',   // 高昌回鹘
    'guge': '古格',   // 古格
    'xiliao': '辽',   // 西辽
    'dongliao': '辽',   // 东辽
    'daiguo': '代',   // 代国
    'baojialiya2': '保',   // 保加利亚第二帝国
    'houli': '越',   // 后黎
    'zhunge': '准噶',   // 准噶尔
    'thonburi': '吞武',   // 吞武里王国
    'zao_zhuluo': '朱罗',   // 早期朱罗
    'kotte': '科特',   // 科特王国
    'gu_aiji': '埃及',   // 埃及新王国
    'aiji_guwangguo': '埃及',   // 埃及古王国
    'houjin': '金',   // 后金
    'buyid': '白益',   // 白益埃米尔国
    'scaliger': '斯卡',   // 斯卡利杰里家族
    'mantinea': '丁尼',   // 曼丁尼亚
    'phokis': '福基',   // 福基斯
    'wuguobu': '五部',   // 五国部（旗号不含「国」）
    'balti': '巴尔',   // 巴尔蒂
    // 🔴 [2026-11-05 按A执行] 'qingyuan_yijun' 已并入大元，旗号登记删除
    'zhenghe_yijun': '头陀',   // 头陀军（黄华：号头陀军、又称畲军；旗号取势力简称，不含「军」）
    'latin_empire': '拉丁',   // 拉丁帝国
    'anjou': '安茹',   // 安茹
    'pisa': '比萨',
    'yaqi': '亚齐',
    'zhamolin': '古里',   // 卡利卡特（古里＝明代汉籍对 Calicut 的称呼；原文误抄「比萨共和国」，2026-11-09 修正）
  wu_han: '吴',  // 汉初吴国（刘濞，前195–前154，都广陵）
  qi_zhangbu: '齐',  // 张步齐（临淄割据，23–29）
  wangdaer: '汪达',  // 汪达尔—阿兰王国（439 迦太基–534 拜占庭灭）
  kesaiya: '科塞',  // 科塞亚部族（扎格罗斯山，前4世纪抗亚历山大）
  muxikani: '穆西',  // 穆西卡尼部族（印度河下游，前4世纪）
  houmojietuo: '后摩',  // 摩揭陀·普那伐摩（7世纪初）
  sumo: '苏摩',  // 苏摩国（孟加拉 Suhma，前6世纪）
  gushu: '蜀',  // 古蜀·开明王朝（前4世纪–前316 秦灭）
  gaoda: '高达',  // 高达王国（设赏迦，约590–626）
  kelite_amier: '克特',  // 克里特埃米尔国（约824–961）
  kelimiya_han: '克米',  // 克里米亚汗国（1441–1783）
  guzigan: '古兹',  // 古兹甘·法里贡王朝（9–11世纪初）
  bahemani: '巴赫',  // 巴赫曼尼苏丹国（德干，1347–1527）
  halapengcai: '哈利',  // 哈利奔猜王国（泰北孟族，约750–1292）
  dongchahatai: '察合',  // 东察合台汗国（蒙兀儿斯坦，1347–1680）
  buhala: '布哈',  // 布哈拉埃米尔国（曼吉特，1785–1920）
  biluzhi: '俾路',  // 俾路支·林德部落联盟（1480–1533）
  bonape: '波纳',  // 波纳佩·绍德勒王朝（南马都尔，约1200–1628）
  xiaweiyi: '夏威',  // 夏威夷王国（1795–1893）
  yidali_hre: '比安',  // 意大利王国（神圣罗马，962–1801）
  buliedian: '英军',
  zhao_han: '赵',
  dai_chenxi: '代',
  yan_luwan: '燕',
  huainan: '淮南',
  lvlin: '绿林',
  tongma: '铜马',
  wanglang_han: '汉',
  liuyong_liang: '梁',
  yan_pengchong: '渔阳',
  shuoning: '朔宁',
  zhangfeng_jun: '涿郡',
  dou_hexi: '河西',
  canlang_qiang: '参狼',
  zhong_qiang: '钟羌',
  qiedong_qiang: '且冻',
  xianlian_qiang: '东羌',
  baima_di: '白马',
  zhongjia: '仲家',
  guanzhong_jun: '关中',
  hanning: '汉宁',
  qiwanyian_jun: '氐羌',
  zhaowang_lun: '赵王',
  chengdu_ying: '成都',
  hejian_yong: '河间',
  jinzhun_jun: '汉',
  fanya_jun: '谯坞',
  shilang_jun: '河东',
  murong_ren: '平郭',
  duanqi: '齐',
  fuliu_jun: '蒲坂',
  hou_liang_lv: '凉',
  zhaiwei: '魏',
  sunen_jun: '天师',
  qiaoshu: '蜀',
  beiyan: '燕',
  gaiwu_jun: '天台',
  xiangzhou_jun: '蜀公',
  bingzhou_jun: '汉王',
  yangxuangan_jun: '黎阳',
  wagang: '魏',
  xue_qin: '秦',
  yuwen_xu: '宇文',
  wang_zheng: '王郑',
  dingyang: '定杨',
  fusong: '宋',
  qidan_tang: '契丹',
  lihuaiguang_jun: '河中',
  ziqing: '淄青',
  chengde: '成德',
  henghai: '横海',
  zhao_yi: '昭义',
  wujie_huihu: '回鹘',
  luomen_tubo: '洛门',
  lulong: '卢龙',
  jieyan: '燕',
  yichang: '义昌',
  pinglu_wang: '平卢',
  qi_li: '凤翔',
  hou_tang: '唐',
  yiwu_jun: '义武',
  hou_shu: '蜀',
  lishouzhen_jun: '秦王',
  wuping: '武平',
  xingguo_jun: '西川',
  liugubu: '六谷',
  songjiang_jun: '梁山',
  liu_qi: '齐',
  helin_hanting: '和林',
  ogedei: '海都',
  dongdao_zongwang: '东道',
  shangdu_jun: '上都',
  hansong: '宋',
  xuzhou_hongjin: '红巾',
  dayu_ho: '大虞',
  yongxiebu: '永谢',
  asai: '浅井',
  akechi: '明智',
  bobai_jun: '镇兵',
  nikan_wailan: '图伦',
  numidia: '努米',
  vaccaei: '瓦凯',
  pompeians: '元老',
  antonians: '东方',
  liberators: '共和',
  atropatene: '阿特',
  bastarnae: '巴斯',
  aquitani: '阿基',
  camunni: '卡穆',
  cantabri: '坎塔',
  sicambri: '西坎',
  raeti: '雷蒂',
  pannonii: '潘诺',
  hatra: '哈特',
  juthungi: '尤图',
  vandali_tribes: '旺达',
  salian_franks: '萨利',
  ricimer_jun: '权臣',
  alans: '阿兰',
  soissons: '苏瓦',
  tirmidh_musa: '怛蜜',
  bukhara_sogd: '粟布',
  shuman_guo: '舒曼',
  fergana_aleda: '拔汗',
  friuli: '弗留',
  veleti: '维莱',
  bohemia_duchy: '捷克',
  paulicians: '保罗',
  malatya: '马蒂',
  east_anglia: '东盎',
  fatimids: '绿衣',
  zirids: '齐里',
  kakuyids: '卡库',
  basasiri_jun: '亲埃',
  yinaer_jun: '伊纳',
  normandy: '诺曼',
  brionne: '布奥',
  gwynedd: '圭内',
  antioch_principality: '安条',
  nizari: '木剌',
  jacquerie: '扎克',
  liege: '列日',
  lezhe: '莱什',
  bactria: '大夏',
  dayueshi: '月氏',
  kangju: '康居',
  aitolia: '埃托',
  achaea: '亚该',
  emesa: '埃梅',
  tbilisi_emirate: '第比',
  hafsids: '哈夫',
  lorraine: '洛林',
  nan_xiongnu: '南匈',
  yudan_xiongnu: '于单',
  shifa_rouran: '示发',
  maoyi: '茂宜',
};

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept((newModule: any) => {
        if (!newModule?.SANDBOX_DISPLAY_NAMES) return;
        const target = SANDBOX_DISPLAY_NAMES as Record<string, string>;
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, newModule.SANDBOX_DISPLAY_NAMES);
        console.log(`[HMR] SandboxDisplayNames → ${Object.keys(target).length} 条旗号已热更新`);
        window.dispatchEvent(new Event('hmr:flag-data'));
    });
}
