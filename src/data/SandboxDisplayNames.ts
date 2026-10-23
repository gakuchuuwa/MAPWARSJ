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
 */
export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {
  // ── [2026-08-26 全面检查旗号] 实际旗号 = 本表登记优先，未登记则取势力名前两字
  //    （见 CityAssetManager.getProcessedFlagText）。全量比对 957 个有城势力：
  //    未登记 4 个（本轮新增的大西洋航线势力）+ 撞车 3 组，一并收口，现全部唯一。
  fodejiao: '佛得',  // [2026-08-26] 佛得角
  baiyiya: '巴伊',  // [2026-08-26] 巴伊亚
  tupinijin: '葡属',  // 葡属巴西（圣维森特）
  tuotuonake: '新墨',  // 西属墨西哥（韦拉克鲁斯）
  taino: '古巴',  // 西属古巴（哈瓦那）
    taino_d: '泰诺',  // 泰诺（古巴东部亚拉）
  guanche: '关切',  // [2026-08-26] 加那利原住民关切人（柏柏尔系）
  yasuer: '亚速',  // [2026-08-26] 葡属亚速尔群岛，首府安格拉
  chamorro: '查',  // 查莫罗（关岛·阿加尼亚）

  ayinu_ezo: '阿伊',   // 🔴 [2026-09-12] 原「虾夷」与 ayinu(虾夷)撞旗 → 按势力名「阿伊努」取前两字「阿伊」

  boootiya: '波奥',
  luodesi: '多德',
  kelite: '威共',  // 威尼斯共和国（干地亚要塞）
  leangongguo: '莱昂',
  bohepingyuan: '威尼',
  xixiliwangguo: '西西',
  weixi: '威悉',

  yipilusi: '伊庇',
  lagoniya: '拉哥',
'maqidun': '马其',
  lagusa: '拉古',

  ruidian_yota: '约塔',
'meikelunbao': '文德',
  didi: '佛兰',
  anuo: '阿诺',
'guadaer': '瓜达',
  balunxiya: '巴伦',
  moxina: '墨西',
  sading: '萨丁',
  yidelisi: '伊德',
  qiekase: '第聂',
  baojialiya: '保加',
  saierdika: '索非',
'bosiniya': '波黑',  // 🔴 [2026-09-12] 原「波斯」与 boluosi(波斯帝国·已删，与阿契美尼德重复)撞旗 → 取中文标准简称「波黑」

  mulabite: '穆',

'zhibuluotuo': '直布',
  zhayan: '扎扬',
  babali: '巴巴',
  hamade: '哈马',
'buni': '布匿',
  aguelabu: '阿格',
  telibolisi: '的黎',
'jileinaijia': '基雷',
  talike: '马格',

  maixiya: '麦西',
  nidelan: '尼德',
'boumeilaniyan': '卡舒',
'pomeilaniya': '波美',
  langgeduoke: '朗格',
  aermolika: '摩里',
  tuosikana: '托斯',
  yadelaiya: '亚得',
  talanduo: '大希',
  safuyi: '萨伏',
  kanpaniya: '坎帕',
  jiatailuoniya: '加泰',
  nasier: '纳斯',
  liguliya: '利古',
'seleisi': '色雷',
  bolisiya: '波利',
  zhituo: '沃伦',

  pufaerci: '普法',
  hansa: '汉萨',
  batawei: '巴塔',
  weijing_york: '约维',
  kanbuliya: '坎布',
'gaolu_luoma': '高罗',
  aquidan: '阿奎',
  puluowangsi: '普罗',
  lunbadi: '伦巴',
  xiluoma: '西罗',  // 西罗马（希波）
'donggete': '东哥',
  xigete: '西哥',
  andaluoxiya: '安达',
  alagong: '阿拉',
shaiyue: '巴阡',  // [2026-08-26 旗号去重] 喀尔巴阡：「喀尔」与喀尔喀(外蒙主体)撞，去共同前缀

  gaer: '盖尔',
  mangsite: '芒斯',
'tuomengde': '托蒙',
  piketai: '皮克',
'anggelu': '盎格',
  yinggelan: '英格',
'bogendi': '勃艮',
'bulabante': '班特',
  gaolu: '法兰',
  kaernute: '卡尔',
  bulietani: '布列',
'fulandesi': '阿图',
  xilagu: '西东',
  xila: '阿提',
  putaoya: '葡萄',
  feiniqi: '腓尼',
  mengtainiya: '蒙泰',
'saierweiya': '拉什',
  nuosi: '诺斯',
'luosi': '罗斯',
  liulike: '留里',
  mosike_gongguo: '莫斯',
  eluosi_diguo: '俄罗',
  xieerpuhuofu_gongguo: '谢尔',
  fulajimier_gongguo: '弗拉',
  daniebo: '斯摩',
  qiernigeweifu_gongguo: '切尔',
  jialixiya: '哈尔',
  pusikefu_gongheguo: '普斯',
  ouka: '奥卡',
  xideweina: '波洛',
  jinzhang: '金帐',
  baojiaer: '不里',  // [2026-08-26 旗号去重] 伏尔加保加尔：「保加」与保加利亚(特尔诺沃)撞；《元史》作「不里阿耳」
'baizanting': '拜占',
'taolika': '陶里',
  bosi_puluosi: '博普',
'kelimiya': '热亚',  // 热那亚共和国（卡法）
'keluodiya': '克罗',
  qincha: '钦察',
'litaowan': '立陶',
'bolan': '波兰',
'dabolan': '大波',
  piyasite: '皮雅',
  hongluseniya: '红鲁',
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
'ruidian_si': '瑞典',
'kasidiliya': '卡斯',
  'duluo': '杜罗',
'teluoyi': '达尔',
  'alabo': '大食',
  liwoniya: '利沃',
  chude: '楚德',
  kaleiliya: '卡累',
  deniesite: '德涅',
  nieman: '涅曼',
  fuerjia: '伏尔',
  nuogai: '喀山',
  bashekeer: '乌拉',
  beisilafu: '塞维',
  siluoboda: '斯洛',
  yedi: '野地',
  peilieya_gongguo: '佩列',
  weijiebusike_gongguo: '维捷',
  habusibao: '哈布',
  boximiya: '波西',
'mazhaer': '匈牙',
'xiongyati': '匈雅',
  falanji: '弗兰',
  jialuolin: '加洛',
  rierman: '莱茵',
  pelianci: '佩伦',
  shiwaben: '施瓦',
  asikanani: '阿斯',
'wende': '萨克',
  bafaliya: '巴伐',
  huohengsuolun: '霍亨',
'mozeer': '摩泽',
  ruishi: '瑞士',
  aersasi: '阿尔',
  molaweiya: '奥洛',
  damolaweiya: '摩拉',
  luoma_diguo: '罗马',
  xiongren: '匈人',

  heishui: '黑水',
'fushi': '苻',
  donghui: '东濊',
'gonggu': '宫古',
  fuguo: '附',
  gongtang: '贡唐',

'yada': '厌抵',
'guishuang': '贵霜',
'juandu': '捐毒',
  sai: '塞',
  'sijitai': '斯基',
  yangtong: '羊同',

'zhancheng': '占城',
    'monong': '墨侬',
    'shuizhen': '水真',
    'wala': '瓦剌',
'muer': '呼',
    'xiajiasi': '坚昆',
'zhen': '武珍',
    'shang': '商',
    'zhou': '周',
'qi': '齐',
    'jin': '晋',
'wu': '吴',
'yue': '越',
'nanyue': '南越',
    'guangping': '广平',
'qin': '秦',
'song': '宋',
    'yan': '燕',
'zhao': '赵',
'wei': '魏',
'han': '韩',
'han_d': '汉',
    'shu': '蜀',
'juqu_d': '沮渠',
'tufa_d': '秃发',
'qiuchi': '仇池',
'helian': '赫连',
'xiongnu': '匈奴',
'xianbei': '鲜卑',
    'jie': '羯',
'tuoba': '拓跋',
'yuwen': '宇文',
'chen': '陈',
'sui': '随',
    'tang': '唐',
    'min': '闽',
'shatuo': '沙陀',
'bohai': '渤海',
'dangxiang': '大夏',
'menggu_d': '蒙古',
'manzhou_d': '清',
'ming_d': '明',
'liao_d': '辽',
'kong_d': '鲁',

    'sushen': '肃慎',
'rouran': '柔然',
    'baiji': '百济',
'tubo': '吐蕃',
    'tujue': '突厥',

    'eguo_biandi': '俄边',
'dayue': '大越',
    'yamato': '大和',
'edo': '武藏',
    'izumo': '出云',
'satsuma': '萨摩',
    'ryukyu': '琉球',
    'so': '对马',
    'gaya': '伽倻',
    'aki': '安艺',
    'echigo': '越后',
'kai': '甲斐',
    'chosokabe': '土佐',
'hashiba': '播磨',
    'shimotsuke': '下野',
    'aizu': '会津',
'xingliao': '兴辽',
'gongsun_d': '辽东',
'wusun': '乌孙',
'dayuan': '大宛',
    'gouding': '句町',
    'baibo': '黄巾',
    'wuhuan': '乌桓',
'xianlingqiang': '先零',
'cheshihou': '乌垒',
'yelang': '夜郎',
'ailao': '哀牢',
'fuyu': '夫余',
'shule': '疏勒',
    'loulan': '楼兰',     // 精绝·东汉都护府楼兰属国屯戍（原扜泥城）
    'shache': '莎车',
'qiuci': '龟兹',
'yanqi': '焉耆',

'gaogouli': '高句',
    'xinluo': '新罗',
    'luoyue': '骆越',
    'ba': '巴',
'qifu_d': '乞伏',
    'linyi': '林邑',

    // 2026-05-25 两晋核对追加势力
'murong': '慕容',
    'erzhu': '尔朱',


    // 2026-05-25 汉朝核对追加势力
    'ouyue': '台',

    // 2026-05-25 三国核对追加势力
    // ── 2026-06-16 改：符离·宿（§4.7；旗号「徐」让位下邳徐国）──
    'gaoqi_d': '高齐',
    'wuzhou_d': '武周',
    'zhuang_d': '壮',
'xibo_d': '锡伯',
'ranwei_d': '冉魏',

'sunwu_d': '孙吴',

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
'nongzhigao': '邕',
'fangla': '方',

    // ── 2026-05-25 北宋辽金势力 v2 ──
'yang_aner': '登',
    'dixiang': '新',

    // ── 2026-05-25 元朝蒙古势力 ──
'huarazim': '花剌',
    'pagan': '缅',
    'champa': '占婆',
'dongxia': '东夏',
'chagatai': '车师',
    'ogodei': '窝阔',
'kereyid': '克烈',
    'naiman': '乃蛮',
    'tatar': '塔塔',
'ongut': '汪古',
'xushouhui': '天完',
    'zhangshicheng': '大周',

    // ── 2026-05-25 明朝势力 ──
    'dengmaoqi': '铲平',
'dada_ming': '鞑靼',
'oirat_ming': '卫拉',
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
'chenghan': '成汉',
'longwu': '隆武',
    'lujian': '婺',
'dzungar': '绰罗',
    'khoshut': '和硕',
    'yarkand': '叶尔',
'khoja': '和卓',
    'gaxa': '噶厦',
'jinchuan_g': '金川',
'shuntian': '天地',
'bailian': '白莲',
'chimei': '赤眉',
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
    // ── 2026-05-26 新增：大金、大元 ──
'dajin': '金',
'yuan_d': '元',

    // ── 2026-05-26 新增：肃慎系势力（挹娄、勿吉、靺鞨）──
    'yilou': '挹娄',
    'wuji': '勿吉',

    // ── 2026-05-26 新增：室韦（隋唐时期东北亚部落联盟）──
'shiwei': '室韦',

    // ── 2026-05-26 新增：濊貊、毛文龙（毛文龙旗号用"毛"）──
'huimo': '濊貊',
    'mao_wenlong': '东江',

    // ── 2026-05-26 新增：漠北草原势力旗号 ──
'gaoche': '高车',

    // ── 2026-05-26 新增：西域/中亚势力旗号（14个）──
'kala': '喀汗',
'xiliao': '大辽',
'sogdian': '粟特',
    'suogediyana': '索格',
    'kangju': '康居',
    'geluolu': '葛逻',
    'yuchi': '尉迟',
'an': '乌兹',
'shi_clan': '石',

    
'huyan': '呼衍',
'ashina': '史那',
'ashide': '史德',
'hongirad': '弘吉',
'choros': '萨吾',
    // ── 2026-05-26 新增：青藏高原势力旗号（18个）──
'guge': '古格',
'ladakh': '玛域',
'tsangpa': '藏巴',
'ganden': '甘丹',
    'bailan': '白兰',
'supi': '苏毗',
    'monpa': '门巴',
    'lopi': '珞巴',
'spurgyal': '悉补',
'khon': '昆',
    'lang_clan': '朗',
    'karmapa': '噶玛',
    // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力旗号 ──
    'ava': '阿瓦',
'dongxu': '东吁',
    'meitai': '梅',
    'hantawadi': '汉达',
    'pyu': '骠',
    'mon': '孟',
'ming_zheng': '明郑',
    'xiou': '西瓯',
    'jing': '京',
    'muong': '芒',
    'paiwan': '排湾',
'leloi': '清化',
'nguyen_guangnan': '阮',

    // ── 2026-05-26 Phase 3h：新增賨、僰、谯、折、山越、畲、蒲 ──
    'she_ethnic': '畲',

    
'wuling': '五溪',

    // ── 2026-05-27 新增：汪、向、覃、冉、储 ──

    // ── 自动补全剩余的特殊势力映射，防止显示英文 ──
'cen_d': '岑',
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
    'panyao': '贺',


    // ── 2026-05-28 新增：黎(崖) ──
    // ── 2026-05-28 新增：工布(工布) ──

    // ── 2026-05-28 新增：果洛、土谢图、土默特 ──
'golog': '果洛',
    'tumed': '土默',

    

    

'nong2': '侬',

    // ── 2026-05-27 重制：药罗葛(娑陵) ──

    // ── 2026-05-28 新增：南部(根城/日本)、萨曼(阿母城/中亚)、西域四政权 ──
    'nanbu': '陆奥',
    'saman': '萨曼',
  'sanfoqi': '三佛',
'hepan': '喝槃',
'humi': '瓦罕',

    // ── 2026-05-28 新增：马蒙、古兹根、傣、泰沅、帕銮、罗斛 ──
'mamon': '马朝',
    'guzgan': '古兹',
    'dai': '傣',
'taiyuan': '泰沅',
    'luohu': '罗斛',

    // ── 2026-05-28 新增：黑龙江流域民族/家族 ──
    'feiyaka': '费雅',

'anushidgin': '阿努',
    'nanjie': '南杰',
'gandenpozhang': '冈底',

    

    'liren': '俚',

    // ── 2026-05-28 新增：岭、琼波、索伦、图瓦 ──
'gling': '玉树',
    'khyungpo': '琼波',
'suolun': '达斡',

    // ── 2026-05-28 新增：大隅(赤尾木城)、奄美(赤木名城) ──
    'osumi': '大隅',
    'anmei': '奄美',

    // ── 2026-05-28 新增：康区藏族土司/部落 ──
    'dalung': '达隆',
    'gar_kham': '德司',
    'kongsa': '孔萨',

    // ── 2026-05-28 新增：波密(博窝) ──

    // ── 2026-05-28 新增：达擦(八宿宗/康区) ──
    'daca': '达擦',

    // ── 2026-05-28 新增：景东(银生城/云南) ──

    // ── 2026-05-28 新增：霍尔(索宗/那曲) ──
    'hor': '霍尔',

    // ── 2026-05-28 新增：董(囊谦宗/玉树) ──
    'dong': '隆庆',

    // ── 2026-05-28 新增：白狼(巴塘宗/康区) ──
'bailang': '白狼',

    // ── 2026-05-28 新增：后突(黑沙城/阴山北麓) ──
'duolu': '咄陆',
'dulan': '都兰',
'zhuxie': '朱邪',
'tiemuer': '图兰',
'kawusi': '卡乌',
    'keerkezi': '柯尔',
    'yiduhu': '亦都',
    'yizhi': '一支',
'zhuqian': '筑前',
    'jibei2': '备中',
    'jinchuan': '骏河',
'totomi': '远江',
'owari': '尾张',
'yiwu': '伊吾',
'pulei': '蒲类',
    'duerbote': '杜尔',
    'kaerka': '喀尔',
'huihu': '回鹘',
'wuzhumuqin': '乌珠',
'zhadalan': '扎答',
    'zhuerqi': '主儿',
'panjun': '義',  // 🔴 [2026-10-20 主人令「旗号，用一个字，繁体的义」] 叛军占位势力已改名「起义」，旗面只写单字繁体「義」
'you': '幽',
'pisha': '毗沙',
    'yumi': '扜弥',
    'keliya': '克雅',
    'xiye': '西夜',
    'faqiang': '发羌',
    'jiantang': '建塘',
    'gongbu': '工布',
    'niang': '娘',
    'galangdiba': '波密',
'ali': '阿里',
'pazhu': '年楚',
    'cuanshi': '爨',
'dianguo': '滇',
    'danluo': '耽罗',
    'woju': '沃沮',
'jingcheng_d': '镜',
'chungju_d': '忠',
'naju_d': '罗',
    'chen3': '欢',
'sabeol': '沙伐',
'iga_d': '伊贺',
    'kaga_d': '加贺',
'date_d': '仙台',
    'higo_d': '肥后',
'iyo_d': '伊予',
    'otomo_d': '大友',
    'suwa_d': '诹访',
'beihai': '北海',
    'hui': '濊',
    'xuantu': '玄菟',
'sambyeol': '沃',
    'sheng_d': '升',
    'wure': '兀惹',
'houliao': '东辽',
    'sunite': '苏尼',
'dayuzi': '玉兹',
    'weiwuer': '维吾',
    'wensu': '温宿',
    'keerqin': '科尔',

    // ── 2026-05-31 新增：民族起源地6势力 ──
    'xiangxiong': '象雄',
'zhaowu': '昭武',
    'ruoqiang': '婼羌',

    // ── 2026-05-31 新增：原生小政权都城4势力 ──
    'qiemo': '且末',
    'weitou': '尉头',
'dangchang': '叠',

    // ── 2026-05-31 修复：补齐之前遗漏的10个势力 ──
'xichu': '楚',
'hai2': '海',
    'qiepantuo': '朅盘',
    // ── 2026-06-11 新增：库页岛民族 ──
    'eluoke': '鄂罗',
    'kuye': '库页',
    // ── 2026-06-11 新增：阿伊努（北海道）──
    'ayinu': '虾夷',
    // ── 2026-06-11 新增：北海（北海道北端）──
    // ── 2026-06-11 新增：水达达（黑龙江下游）──
'ewenki': '鄂温',
    // ── 2026-06-11 新增：东平（郡·黑龙江下游）──
    // ── 2026-06-11 新增：外兴安岭/外贝加尔边境 ──
    'bulat': '布拉',
    'buriat': '布里',
    // ── 2026-06-11 新增：锡尔河下游（毡的/养吉干）──
    'xianhai': '咸海',
'nandou': '难兜',
'yanda': '白匈',
'anxi': '安西',
'konbaung': '贡榜',
'tianxiong': '魏博',
    'gar': '噶尔',
    'yun': '允',
    'huangwang': '黄',
    'basha_d': '巴沙',
'taira': '长门',
'yehe': '叶赫',
    
'wula': '乌拉',
'bayegu': '拔野',
    'ketagalan': '凯达',
'suke': '素',
'gaochang': '麴',
'chuyue': '处月',
    'baidi': '白狄',
'lelang': '乐浪',
    'huite': '辉特',
'zubu': '阻卜',
    'kangba': '康巴',
    'nvguo': '女',
    'jiashi': '迦湿',
    'jiashi_d': '迦尸',
'wuhu': '乌护',
'sanada_d': '信浓',
  jiazini: '伽色',
'jibin': '罽宾',
'babuer': '喀布',
  fanyanna: '梵衍',
'bailong': '白龙',
    'kepantuo': '渴盘',
'yangguan': '西凉',
'qinghai': '青海',
'xining': '西宁',
'kalun': '柴达',
    'sagami': '相模',
'mino': '美浓',
'ssangseong': '和',
    // ── 2026-06-19 新增：马尔吉亚纳·乌古斯 ──
'maer_d': '马吉',
'wugu_d': '乌古',
    xierhe: '锡尔',
    'adao_d': '阿克',     // 昆岗·阿克苏道军台
    // ── Phase 1 Missing Flags ──
    'kumoxi': '奚',
    'shanshan': '鄯善',
'guiyi': '归义',
  // —— 2026-06-20 新增：旁遮普·阿托克 ——
  pangzha: '旁遮',
  // —— 2026-06-20 新增：那竭国·顶骨城 ——
'najie': '那竭',
'dulan_d': '杜兰',
  baha: '巴哈',
  hali: '哈里',
  kalan: '卡兰',
'xisi': '锡斯',
  delan: '德兰',
  huluo: '呼罗',
  aba: '阿巴',
'wuyue': '吴越',
'yuezhi': '月氏',
  'minyue': '闽越',
'funan': '扶南',
  'lancang': '澜沧',
  'ahaomu': '阿萨',
'elunchunzu': '鄂伦',
'tajikezu': '塔吉',
'jingpozu': '景颇',

'xingwei': '兴威',
    'saerbadaer': '萨尔',
    'kumisi': '库米',
    'shahelude': '沙赫',
'ribale': '日巴',
'safawei': '吉兰',
'yilihanguo': '阿杰',
    'yilihanguo_d': '伊利',
'asaibaijiang': '阿塞',
    'wulaertu': '亚美',
'wulaertu_guo': '乌图',
'gelujiya': '格鲁',
'bendou': '科穆',
    'keerjisi': '金羊',
    'bendou_d': '本都',
    'saipulusi': '塞浦',
    'heti': '赫梯',
'fulijiya': '弗里',
    'ldiya': '吕底',
    'pajiama': '帕加',
'bitiniya': '比提',
      'luomu': '罗姆',
      'osman': '奥斯',
'sailiugu': '塞琉',
'womaya': '倭马',
    'xibolai': '希伯',
    'aiji': '埃及',
    'dibisi': '上埃',
'tuolemi': '托勒',
    'jialedi': '迦勒',
    'paermila': '帕尔',
'abasi': '阿拔',
'samaila': '萨迈',
    'xikesuosi': '喜克',
'yashu': '亚述',
    'youfaladi': '幼发',
    'midi': '米底',
    'qiliqiya': '奇里',
'aqimeinide': '阿契',
'sashan': '萨珊',
    'ailan': '埃兰',
    'safawei_d': '萨朝',
'sumeier': '苏美',
    'ayoubu': '阿尤',
    'mamuluke': '马穆',
    aosiruowen: '若恩',  // 奥斯若恩（埃德萨）；「奥斯」撞奥斯曼，改取后两字
    'kesa': '可萨',
'aiaoniya': '爱奥',
    'yiaoniya': '伊奥',
    'jialatai': '加拉',
'guyashu': '阿舒',
    'ansxi': '安息',
    'nabatai': '纳巴',
    'xike': '锡克',
    'deli': '德苏',
    'mowoer': '莫卧',
    'jieri': '戒日',
'kongque': '孔雀',
    'mojietuo': '摩揭',
    'boluo': '波罗',
    'sumo': '苏国',
    'beileinisi': '红港',
    'dedan': '德丹',
    'maidina': '拉希',
    'emesene': '埃梅',
    'gulaishi': '古莱',
    'xierwan': '希尔',
    'xiemian': '萨维',
    'yidier': '伊蒂',
    'salai': '诺盖',
    'mangshi': '土库',
    'kejila': '科基',
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
    'xinnidelan': '新尼',
    'xinfalanxi': '新法',
    'xinxibanya': '新西',
    'manzheboyi': '满者',
    'zhelouqi': '遮娄',
    'suosuo': '索索',
    'antiaokegongguo': '赞吉',  // 赞吉王朝（拉塔基亚）
    'aoerlianggongguo': '奥尔',
    'jinquehua': '金雀',
    'apuliya': '阿普',
    'saimien': '塞米',
    'aosimanbeiyiguo': '贝伊',
    'aiduoniya': '埃多',
    'qiesuonisuosi': '切索',
    'mixiya': '密西',
    'xiaaiji': '下埃',
    'kaliya': '卡里',
    'bosidiguo': '波帝',
    'jikelazes': '基克',
'adiyabeina': '亚贝',
    'youbeiya': '优卑',
    'zeta': '泽塔',
    'haerjijiji': '基季',
    'telakaigongguo': '凯纳',
    'duobuluojia': '多布',
    'aertai': '阿勒',
    'kumanni': '库曼',
    'kuman_oleshky': '库曼',
    'feierganna': '费尔',
    'qibucha': '奇布',
    'tamoyue': '塔莫',
    'naweierbuta': '纳韦',
    'alaokaniya': '阿劳',
    'bogendigongguo': '勃公',
    'amaniyake': '阿马',
    'geluositeboguo': '格洛',
    'baerta': '巴尔',
    'saiputimanniya': '塞普',
    'bogengnidielan': '勃尼',
    'gewennesi': '格温',
    'weiershigongguo': '威尔',
    'huanzhou': '驩州',
    'tigelei': '提格',
    'luben': '鲁本',
    'xiaoa': '肖阿',
    'miandian': '缅甸',
    'malai': '马来',
    'taimier': '泰米',
    'xibanya': '西班',
'manding': '曼丁',
'ethiopia': '埃塞',
'zhagewei': '扎维',
    'adal': '阿达',
    'malacca': '满剌',
    'medang': '马打',
    'ternate': '特尔',
    'sulu': '苏禄',
    'puxiangyindu': '葡印',
    'xiyindu': '西印',
    'jialebi': '加勒',
    'gurjara': '瞿折',
    'suomunate': '索姆',
    'zhuluo': '朱罗',
    'sengjialuo': '僧伽',
    'pandiya': '潘地',
    'liaozu': '寮',
    'kushi': '库施',
    'aimala': '艾马',
    'aolisha': '奥萨',
    'kanata': '卡纳',
    'adile': '阿迪',
    'foluolida': '佛罗',
    'fujisi': '福基',
    'yilisi': '埃利',
    'nuowei': '挪威',
    'keernuwaye': '康沃',
    'aodesuosi': '奥德',
    'disidelusi': '蒂斯',
'yisatisi': '伊萨',
    'wuer': '乌尔',
    'pidisha': '毗底',
'jiaye': '伽耶',
    'jienei': '杰内',
'kuertaiya': '巴萨',
'muwaxide': '穆瓦',
    'varendra': '伐连',
    'chatigangren': '查蒂',
    'duonaobaojia': '多瑙',
    'lumiliya': '鲁米',
    'yilaka': '伊拉',
    'xingelana': '新格',
    'gualani': '瓜拉',
'xiadunhe': '下顿',
'dunhe': '顿河',
    'bulu': '补',
    'xiaofulijiya': '小弗',
    'kanan': '迦南',
    'feilisidin': '腓利',
'mallabhum': '末罗',
    'vidin_tsardom': '维丁',
    'gondarine': '贡德',
'valois_angouleme': '瓦卢',
    'samtskhe': '萨姆',
    'tomara_gwalior': '托摩',
    'tawantinsuyu': '塔万',
    'qutb_shahi': '库特',
    'minangkabau': '米南',
    'tutul_xiu': '休',
    'kerman_bam': '克尔',
    'lesser_poland': '小波',
    'braganza_house': '布干', // 🔴 [2026-09-12] 原「布拉」与 bulat(布拉特)撞旗 → 取「布拉干萨」首末两字「布干」
    'trastamara': '特拉',
    'odrysian_late': '奥',
    'jialiboli': '加里',
    'naxos_ancient': '纳克',
    'yamaxun': '亚马',
    'aswaka': '斯瓦', // 🔴 [2026-09-19 主人指出审计警告] 原登记「阿斯」与 asikanani(阿斯坎尼) 撞车；「阿瓦」又撞 ava(阿瓦王国) → 取其所居**斯瓦特**河谷之「斯瓦」
    'aornos': '奥诺', // 奥诺斯岩（公元前326年奥诺斯岩围城战守方）：势力名前两字，全库不撞
    'julushi': '居鲁', // 居鲁士城（公元前329年居鲁士城围攻守方）：势力名前两字，全库不撞
    'malli': '马利',
    // 🔴 [2026-10-20] 原「科塞亚」「乌克西亚」两个无城战役势力已删（武将改挂米底/埃兰），其旗号一并删除
    'genji': '源',
    // 🔴 [2026-09-19 主人指出审计警告「缺旗号」] 源氏·伊予（松山，守将源义经）的旗号。
    //    规则（本文件头）：未登记则取**势力名前两字** = 「源氏」—— 实测**未与任何势力撞车**
    //    （genji 源氏本家登记的是「源」，取源氏姓氏；原「镰仓」与据点名「镰仓」严格相等，违反三者防重 §12.1），故这里把默认值显式登记下来，消掉审计警告。
    'genji_iyo': '源氏',
    'dasaleiti': '达萨',
    'kapaduoxiya': '卡帕',
    'maermajika': '马尔',
    'ameng': '阿蒙',
    'eerbulushi': '厄尔',
    'aliya': '阿利',
    'xuliya': '叙利',


    'sute': '诺塔',
    'xinde': '信德',
    'jiduoluoxiya': '吉德',
    'aolitai': '奥里',
    'shiyuzu': '食鱼',
    'kamanniyaxingsheng': '卡曼',
    'keerman': '锡詹',
    'zhageluosi': '扎格',
    'lulisitan': '卢里',
    'golpayegan_diqu': '古尔',
    'meisuobudamiya': '美索',
    'panfeiliya': '潘菲',
'hesitiya': '赫斯',
'hekaniya': '赫卡',
    'baihaliye': '拜哈',
    'kuida': '沙尔',
    'zhalange': '扎兰',
    'maikelan': '麦克',
    'muertan': '木尔',
    'muxikani': '穆西',
    'xindu': '信度',
  dalriada: '达里',  // 达尔里阿达
  scotland: '苏格',  // 苏格兰
  chanka: '昌卡',  // 昌卡
  ouchi: '大内',  // 大内
  cueva: '库埃',  // 库埃瓦
  maynila: '马尼',  // 马尼拉土邦
  gujarat: '古吉',  // 古吉拉特
  arakan: '若开',  // 阿拉干
  voc: '荷印',  // 荷兰东印度公司
  kosala: '拘萨',  // 拘萨罗
  kalinga: '羯陵',  // 羯陵伽
  anga: '鸯伽',  // 鸯伽
  shunga: '巽伽',  // 巽伽
  antigonid: '安提',  // 安提柯
'hou_han': '后汉',
'yuan_shao': '袁',
'hou_jin': '后晋',
'hou_zhao': '后赵',
'da_yan': '大燕',
'hou_liang': '后梁',
'han_zhao': '汉赵',
'dongjin': '东晋',
'nan_liang': '南梁',
'hou_qin': '后秦',
'yiqu': '义渠',
'hou_zhou': '后周',
'lvbu': '吕布',
'chengjia': '成家',
'qianshu': '前蜀',
'chuguo': '荆楚',
'liusong': '刘宋',
'nanqi': '萧齐',
'yangwu': '杨吴',
'nantang': '南唐',
'machu': '马楚',
'nanhan': '南汉',
'fangguozhen': '浙东',
'liang_shuofang': '大梁',
'qianliang': '前凉',
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
'ryuzoji': '龙造',
'nanchou': '南朝',
'nanbu_shi': '南部',
'shoni': '少弐',
'heishi': '平',
'imagawa': '今川',
'oda': '织田',
'hojo': '北条',
'mahan': '马韩',
'daquyue': '瞿越',
'yuenan': '越南',
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
