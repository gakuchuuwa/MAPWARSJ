import { DynamicFlagTextGenerator } from '../utils/DynamicFlagTextGenerator';
import { SANDBOX_DISPLAY_NAMES } from '../data/SandboxDisplayNames';
import { FLAG_TEXT_WHITE_STYLE_FACTIONS, FLAG_TEXT_BLACK_STYLE_FACTIONS, HISTORICAL_FACTION_COLORS, FLAG_TEXT_LUM_THRESHOLD } from '../data/HistoricalFactionColors';
import type { FactionManager } from '../world/FactionManager';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import {
    PANJUN_REBEL_FLAG_COUNT,
    PANJUN_REBEL_FLAG_ID_MAX,
    PANJUN_REBEL_FLAG_ID_MIN,
} from './RebelFlagConstants';
import { getAllFactionFlagTemplatePaths, getFactionFlagTemplatePath } from '../data/FactionTier';
import { appendBootPlaceholderFlagRulesByFaction, setFactionFlagStyleRule, setRebelFlagStyleRule } from './FlagStyleInjector';
import { notifyFactionFlagReady as dispatchFactionFlagReady } from './factionFlagNotify';
import { gameLog } from '../utils/GameLogger';

/**
 * Manages static assets for cities, specifically Flag generation and processing.
 * Isolates image processing logic from game logic.
 *
 * ── AI / 维护者必读（详版见项目根目录 AGENTS.md 第十节）──
 *
 * ══ 两套系统，禁止混用 ══
 *
 * 【A · 正规势力色系统】FactionManager + HistoricalFactionColors
 *   每个 factionId（≠ panjun）有唯一 hex 势力色，三处共用同一值：
 *     · 势力色 / 领土色块  → getFactionColor()
 *     · 旗帜色             → chromaKey(模板旗, colorHex) → `.flag-faction-{id}`
 *     · 军队色             → FactionTintSystem 读同一 hex 染兵种贴图
 *   固定色表优先，其余每局随机；邻邦 assignSpatialColors 避撞色。
 *
 * 【B · 叛军旗面系统】RebelFlagConstants + processedRebelFlags（与 A 无关）
 *   panjun **没有势力色、不染色、无汉字旗号、无领土色、军队不染色**。
 *   每座叛军城仅随机绑定 S10QZ 7–58 共 52 张**原素材旗面**之一（chromaKey 时 color=null）。
 *   据点 CSS：`.flag-rebel-{index}`；index = getProcessedRebelFlagIndex(cityId)。
 *   52 面素材本身已带各色图案，不是「随机 hex 染同一模板」。
 *   改叛军逻辑勿读 FactionManager；改势力色勿动 processedRebelFlags。
 *
 * 【性能】chromaKey 逐个 + idle 让步；禁止 Promise.all 并行 chromaKey。
 *
 * 【启动 2026-06】占位旗批量 CSS；视口内优先染色；deferred 全图染色推迟到 dragend。
 */
type ChromaScheduleMode = 'boot' | 'background' | 'onDemand';

export class CityAssetManager {
    // Flag asset paths - RESTORED from CityManager.ts.bak
    private static readonly flagPolePath = '/SUCAI/S10QZ/1-1.png';

    // [PUBLIC] CityEditor 等 UI 模块需要在编辑时实时检测某 faction 是否登记了 flag 映射，
    // 因此从 private 改为 public。仅作只读引用，请勿在外部修改其内容。
    public static readonly factionFlagMap: { [key: string]: string } = {
        'zhen': '甄',
        'dongshengwei': '胜',
        'dizhou': '棣',
        'gaogouli': '高句',
        'xinluo': '新罗',
        'manzhou': '满洲',
        'weihaiwei': '威海',

        'shu': '蜀',
        'yangzhou': '洋',
        'sizhou': '泗',
        'fengzhou': '凤',
        'fushi': '苻',
        'heishui': '黑水',
        'donghui': '东濊',
        'gonggu': '宫古',
        'fuguo': '附',
        'gongtang': '贡唐',
        'chizhou': '池',
        'yada': '厌抵', // 嚈哒帝国@悉万斤；异称避与 yanda「嚈哒」撞旗
        'quli': '渠犁',
        'juandu': '捐毒',
        'sai': '塞',
        'yangtong': '羊同',

        'liangzhou': '凉',

        'ashikaga': '室町',


        'min': '闽',
        'quanzhou': '泉',
        'xiezhou': '解',
        'shang': '商',
        'zhou': '周',
        'qi': '齐',
        'jin': '晋',
        'chu': '江陵',
        'wu': '吴',
'yue': '越',
        'qin': '秦',
        'song': '宋',
        'yan': '燕',
        'zhao': '赵',
'wei': '魏',
'han': '韩',
        'han_d': '汉',
        'dian': '通海',
        'xin': '新',
        'cheng': '简',
        'juqu_d': '沮渠',
        'tufa_d': '秃发',
        'qiuchi': '杨',
'helian': '赫连',
        'xiongnu': '匈奴',
'xianbei': '鲜卑',
        'jie': '羯',
        'beidi': '北地',
        'tuoba': '拓跋',
        'yuwen': '宇文',
'liang_d': '梁',
        'chen': '陈',
        'sui': '随',
        'tang': '唐',
        'shazhou': '沙',
'shatuo': '沙陀',
'qidan': '契丹',
        'bing': '并',
'bohai': '渤海',
        'jurchen': '女真',
'dangxiang': '大夏',
'menggu_d': '蒙古',
        'manzhou_d': '大清',
'ming_d': '大明',
        'liao_d': '大辽',
        'dai_d': '代',
        'dingxiang_d': '定襄',
        'xiayang_d': '夏阳',
        'zhongshan': '恒',
        'wang_d': '王',
        'xiao_d': '萧',
        'li_lx_d': '李',
'yuan_cj_d': '袁',
        'xie_cj_d': '信',
'yue_d': '岳',
        'qian_d': '钱',
        'kong_d': '孔',
'cao_d': '曹',
        'jiujiang': '浔',
        'quanrong': '犬戎',
        'suzhou': '肃',
        'sushen': '肃慎',
'guishuang': '贵霜',
        'chile': '敕勒',
'rouran': '柔然',
        'baiji': '百济',
'tubo': '吐蕃',
        'tujue': '突厥',
'tiele': '铁勒',
        'huige': '回纥',
        'dayue': '大越',
        'yamato': '大和',
'edo': '德川',
        'izumo': '出云',
        'satsuma': '萨摩',
        'ryukyu': '琉球',
        'sagami': '相模',
        'so': '对马',
        'kakizaki': '松前',
        // ── 2026-06-16 改：旗号「藤原」（§4.4 家族；禁「州」字）──
        'fujiwara': '藤原',
        'gaya': '伽倻',
        'aki': '安艺',
        'echigo': '越后',
        'kai': '甲斐',
        'chosokabe': '土佐',
        'hashiba': '丰臣',
        'shimotsuke': '下野',
        'aizu': '会津',
        'xingliao': '兴辽',
'gongsun_d': '辽东',
'cen_d': '岑',
        'donghu': '东胡',
        'luoyue': '骆越',
        'ba': '巴',
        'hezhou': '合',
        'chanzhou': '澶',
        'jiaodong': '胶东',
        'jibei': '济北',
        'wusun': '乌孙',
'dayuan': '大宛',
        'gouding': '句町',
        'dongxian': '郯',
        'tongma': '铜马',
        'tongzhou': '同',
        'baibo': '黄巾',
        'wuhuan': '乌桓',
        'xianlingqiang': '先零',
'cheshihou': '车师',
'yelang': '夜郎',
'ailao': '哀牢',
'fuyu': '夫余',
'shule': '疏勒',
        'loulan': '楼',
        'shache': '莎车',
'qiuci': '龟兹',
        'yanqi': '焉耆',
'qifu_d': '乞伏',
        'tuyu_d': '吐谷',
        'linyi': '林邑',
        'murong': '慕容',
        'yingzhou_ying_d': '营',
        'erzhu': '尔朱',
'pizhou': '邳',

'zhai_han': '翟',
        'yin': '殷',
        'hejian': '莫',
        'qu_d': '麴',
'liu': '九江',
        'ouyue': '台',

        'xiangzhou': '襄',
        'zaoyang_d': '舂陵',
        'suzhou_d': '宿',
        'didao': '陇西',
        'lanzhou': '兰',
        'lu': '庐',
        'gaoqi_d': '高齐',
        'wuzhou_d': '武周',
        'zhuozhou': '涿',
        'tujia_d': '土家',
        'zhuang_d': '壮',
        'xibo_d': '锡伯',
        'nantang_d': '南唐',
        'wuwu_d': '无为',
        'shizhao_d': '石赵',
        'ranwei_d': '冉魏',
        'zu_d': '祖',

        'aisin_d': '爱新',
        'sunwu_d': '孙吴',

        'wazhai': '瓦岗',
        'liangshidu': '银',
        'linshihong': '楚南',
'kumo': '楮特',
        'xijue': '十箭',
        'xian_d': '冼',
        'xiqin': '西秦',

'xueyantuo': '薛延',
        'xiajiasi': '坚昆',
        'tujishi': '突骑',
        'nanzhao': '南诏',
'xiaobolu': '勃律',
        'qiufu': '裘甫',

        'dongdan': '东丹',
'dali': '大理',
        'luodian': '罗甸',

        'guazhou': '瓜',
        'goryeo': '高丽',
'nongzhigao': '邕',
        'fangla': '方',

        'zhongxiang': '钟楚',
        'yang_aner': '登',
        'jinan': '历',
        'dixiang': '帝乡',
        'liwang': '河间',

        'huarazim': '花剌',
        'pagan': '缅',
        'champa': '占婆',
        'zhancheng': '占城',
        'monong': '墨侬',
        'shuizhen': '水真',
    'yueyi': '夷',
'dongxia': '东夏',
'chagatai': '察合',
        'ogodei': '窝阔',
        'kelie': '札合',
        'kereyid': '克烈',
        'naiman': '乃蛮',
        'tatar': '塔塔',
        'merkit': '蔑儿',
'ongut': '汪古',
        'xushouhui': '天完',
        'zhangshicheng': '大周',
        'luoping': '罗平',
        'chendiaoyan': '漳',

        'fang_guozhen': '浙方',
        'dengmaoqi': '铲平',
        'yezongliu': '处',
        'dada_ming': '鞑靼',
        'oirat_ming': '卫拉',
        'wala': '瓦剌',
        'wuliangha': '兀良哈',
        'jianzhou_nvzhen': '建',
'haixi_nvzhen': '海西',
        'yeren_nvzhen': '东海',
        'jilimi': '吉里',
        'hezhe': '赫哲',
'luchuan': '麓川',
        'chijin': '赤',
        'juyan_d': '延',
        'xihai_d': '西海',
        'heyuan_d': '河源',
        'guiyi': '归义',
        'anding_wei': '安定',
        'joseon': '朝鲜',
        'siam': '暹罗',
        'chenla': '真腊',
        'dashun': '大顺',
        'daxi_ming': '大西',
        'chenghan': '成汉',
        'shuixi': '水西',
        'yang_zhou': '扬',
        'longwu': '隆武',
        'lujian': '婺',
        'chahar': '察哈',
        'dzungar': '准噶',
        'khoshut': '和硕',
        'yarkand': '叶尔',
        'khoja': '和卓',
        'gaxa': '噶厦',
        'jinchuan_g': '金川',
        'jinchuan_x': '小川',
        'geng': '靖南',
        'shuntian': '顺天',
        'miaomin': '苗民',
        'gurkha': '廓喀',
        'xiadun': '夏顿',
        'kazakh': '哈萨',
        'kokand': '霍罕',
        'badakhshan': '达克',
        'taiping': '太平',
        'dacheng': '大成',
'pingnan': '平南',
    'pinghai': '平海',
        'qianhui': '回军',
        'miao_qing': '苗军',
        'tuoming': '清真',

        'yilou': '挹娄',
        'wuji': '勿吉',
'mohe': '靺鞨',

'shiwei': '室韦',
        'dingling': '丁零',
        'nifuhe': '尼夫',
    'nanzhong': '南中',

'huimo': '濊貊',
        'mao_wenlong': '毛',


'gaoche': '高车',
        'da_yuan': '北元',

'kala': '喀汗',
        'xiliao': '辽',
'sogdian': '粟特',
        'muer': '穆尔',
        'kangju': '康居',
        'geluolu': '葛逻',
        'yuchi': '尉迟',
        'an': '安',
        'shi_clan': '石',

'huyan': '呼衍',
        'yujiulu': '郁久',
        'ashina': '史那',
        'ashide': '史德',
        'weiming': '嵬名',
        'yeli': '野利',
        'kiyad': '乞颜',
'borjigin': '孛儿',
        'jalair': '札剌',
        'hongirad': '弘吉',
        'choros': '绰罗',
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
        'ava': '掸',
        'dongxu': '东吁',
        'hantawadi': '汉达',
'baiman': '白蛮',
        'kunming_yi': '昆明',
        'miao': '苗',
        'pyu': '骠',
        'mon': '孟',
        'yang_bozhou': '播',
        'tian_sizhou': '田',
'mu_lijiang': '木',
        'ming_zheng': '明郑',
        'xiou': '西瓯',
        'yao': '尧',
        'jing': '京',
        'muong': '芒',
        'paiwan': '排湾',
        'trinh': '郑主',
        'nguyen_guangnan': '广南',

        'cong': '賨',
        'langzhou': '阆',
        'zhe_d': '折',
        'shanyue': '山越',
        'she_ethnic': '畲',

        'wuling': '武陵',

        'wang_s': '汪',
        'xiang_d': '向',
        'tan_d': '覃',
        'ran_d': '冉',
        'chu_d': '储',
        'hu_d': '胡',

        'dajin': '大金',
        'yizhou': '懿',
        'yuan_d': '大元',
        'weili': '尉犁',
        'pishan': '皮山',
        'bandun': '板楯',
        'seljuq': '塞尔',

'qingyi': '青衣',
        'wuxi': '五溪',
        'gumie': '衢',

        'shengmiao': '生苗',


        'tuerhute': '土尔',

        'kuai': '蒯',
        'yong': '庸',
'shen': '申',
        'sou': '叟',

        'shaodang': '烧当',

        'jingjiang': '靖江',
        'xinjiang': '静江',
        'panyao': '贺',
        'jiang_s': '蒋',
        'li_s': '里',
        'leizhou': '雷',

        'nong2': '侬',
        'golog': '果洛',
        'tushetu': '土谢',
        'tumed': '土默特',
        'she': '奢',
        'liao': '僚',
        'yaoluoge': '药罗',

        // ── 2026-05-28 新增：南部(根城)、萨曼(阿母城)、西域四政权 ──
        'nanbu': '陆奥',
        'saman': '萨曼',
        'hepan': '喝槃',
'humi': '瓦罕',

        // ── 2026-05-28 新增：马蒙、古兹根、傣、泰沅、帕銮、罗斛 ──
        'mamon': '马蒙',
        'guzgan': '古兹',
        'dai': '傣',
        'taiyuan': '泰沅',
        'luohu': '罗斛',

        // ── 2026-05-28 新增：黑龙江流域民族/家族 ──
        'nanai': '那乃',
        'feiyaka': '费雅',

        'anushidgin': '阿努',
        'nanjie': '南杰',
        'gandenpozhang': '颇章',
        'dawoer': '达斡',

        'tumengken': '图蒙',
        'liren': '俚',

        // ── 2026-05-28 新增：岭、琼波、索伦、图瓦 ──
        'gling': '岭',
        'khyungpo': '琼波',
        'suolun': '索伦',
        'tuva': '图瓦',

        // ── 2026-05-28 新增：大隅(赤尾木城)、奄美(赤木名城) ──
        'osumi': '大隅',
        'anmei': '奄美',

        // ── 2026-05-28 新增：康区藏族土司/部落 ──
        'dalung': '达隆',
        'gar_kham': '德司',
        'kongsa': '孔萨',
        'mingzheng': '明正',

        // ── 2026-05-28 新增：波密(博窝) ──

        // ── 2026-05-28 新增：达擦(八宿宗/康区) ──
        'daca': '达擦',

        // ── 2026-05-28 新增：景东(银生城/云南) ──
        'jingdong': '景东',

        // ── 2026-05-28 新增：霍尔(索宗/那曲) ──
        'hor': '霍尔',

        // ── 2026-05-28 新增：董(囊谦宗/玉树) ──
        'dong': '隆庆',

        // ── 2026-05-28 新增：白狼(巴塘宗/康区) ──
'bailang': '白狼',

'dulan': '都兰',
'duolu': '咄陆',
'zhuxie': '朱邪',
'hunxie': '浑邪',
        'tiemuer': '帖木儿',
        'kawusi': '卡乌',
        'keerkezi': '柯尔',
        'yiduhu': '亦都',
        'yangshao': '仰韶',
        'yel': '耶律',
        'guzhu': '孤竹',
        'yizhi': '一支',
        'zhuqian': '筑前',
        'jibei2': '备中',
        'jinchuan': '骏河',
        'totomi': '远江',
        'owari': '尾张',
        'yangshe': '羊舌',
        'sima_d': '司马',
        'liguo': '黎',
        'kang': '康',
        'shuofang': '朔方',
        'lushui': '卢水',
        'yingli': '应理',
        'guangwu': '广武',
        'huizhou': '会',
        'pulei': '蒲类',
        'duerbote': '杜尔',
        'zhasaketu': '扎萨',
        'kaerka': '喀尔',
        'huihu': '回鹘',
'wuzhumuqin': '乌珠',
        'xingan': '兴',
        'zhadalan': '扎答',
        'zhuerqi': '主儿',
        'chechen': '车臣',
        'pisha': '毗沙',
        'yumi': '扜弥',
        'keliya': '克里',
        'xiye': '西夜',
        'faqiang': '发羌',
'panjun': 'RANDOM',
       'changshan': '常山',
       'linhu': '林胡',
       'lingqiu': '灵丘',
       'linyu': '临榆',
       'loufan': '楼烦',
       'xianyu': '鲜虞',
       'yi': '易',
       'you': '幽',
       'heng1': '元岳',
        'jiantang': '建塘',
        'gongbu': '工布',
        'niang': '娘',
        'galangdiba': '波密',
        'ali': '阿里',
        'pazhu': '帕竹',
        'qiong': '邛',
        'zhuoshi': '卓',
        'chenzhou_d': '辰',
        'qianzhong': '沅',
        'cuanshi': '爨',
        'dianguo': '滇',
        'xinggu': '兴古',
        'guangxin': '广信',
        'kejia': '客',
        'ouyang': '欧阳',
'danyang': '宣',
        'huai': '淮',
'huaiyang': '淮阳',
'cai': '蔡',
        'shangzhou': '上洛',
        'ying': '郢',
        'heng': '衡',
        'chen2': '郴',
'shixing': '石兴',
        'shaozhou': '曲江',
        'yidou': '宜都',
        'boren': '僰',
'wanzhou': '万',
        'kui': '夔',
        'danluo': '耽罗',
        'woju': '沃沮',
        'jingcheng_d': '镜',
        'chungju_d': '忠',
        'naju_d': '罗',
        'chen3': '欢',
        'sabeol': '沙伐',
        'iga_d': '伊贺',
        'kaga_d': '加贺',
        'date_d': '伊达',
        'higo_d': '肥后',
        'iyo_d': '伊予',
        'otomo_d': '大友',
        'suwa_d': '诹访',
        'beihai': '北海',
        'hui': '濊',
        'luzhou': '渌',
        'xuantu': '玄菟',
        'sambyeol': '沃',
        'ssangseong': '双城',
        'sheng_d': '升',
        'jinzhou': '锦',
        'wure': '兀惹',
        'houliao': '后辽',
        'dazhen': '大真',
        'jilin': '吉林',
        'sunite': '苏尼',
        'dayuzi': '大玉',
        'fu2': '抚',
        'xinping': '邠',
        'huan': '环',
        'wei2': '韦',
        'wenzhou': '温',
        'woye': '沃野',
        'lingwu': '灵',
        'bailian': '白莲',
        'chimei': '赤眉',
        'yunzhong': '云中',
        'qian': '矩',
        'chunshen': '春申',
        'wan': '舒',
        'qingyuan_bd': '清苑',
'zhong': '寿',
'xichu': '楚',
        'huangfu': '泾',
        'guo': '果',
        'zi': '资',
        'long2': '陇',
        'song2': '松',
        'qing': '庆',
        'jingmen': '荆门',
        'pingyuan': '高唐',
        'xuan': '宣府',
        'yiwu': '伊吾',

        'ningkou': '宁寇',
        'hongzhou': '洪',
        'changshaguo': '长沙',
        'weiwuer': '维吾',
        'wensu': '温宿',
        'keerqin': '科尔',
        'xiangxiong': '象雄',
        'qingqiang': '茂',
        'zhaowu': '昭武',
        'ganzhou': '甘',
        'gaoliang': '潘',
        'ruoqiang': '婼羌',
        'qiemo': '且末',
        'weitou': '尉头',
        'dangchang': '迭',
        'mi': '糜',
        'hai2': '瀑池',
        'qiepantuo': '朅盘',
        'eluoke': '鄂罗',
        'ewenki': '鄂温',
        'kuye': '库页',
        'ayinu': '虾夷',
        'ruochu': '若敖',
        'mi_chu': '芈',
        'mino': '美浓',
        'nanyue': '南越',
        'guangzhou': '广',
    'guangping': '广平',
        'duanzhou_d': '端',
        'dongping': '东',
        'maomingan': '茂明',
        'aola': '敖拉',
        'bulat': '布拉',
        'buriat': '布里',
        'xianhai': '咸海',
'nandou': '难兜',
        'yanda': '嚈哒',
        'qincha': '钦察',
        'anxi': '安西',
        'konbaung': '贡榜',
'qi_d': '戚',
        'wangyan': '太行',
        'tianxiong': '魏博',
        'sunqin': '潼津',
'yingzhou_d': '颍',
'yanchuan_d': '郾',
'huang_d': '潢',
'qiguo_d': '杞',
'yiyang_d': '义阳',
'mengcheng_d': '山桑',
        'guide_d': '归德',
        'lulin': '绿林',
        'dang_d': '砀',
        'hao_d': '濠',
        'bozhou_d': '博',
        'hongnong_jun': '弘农',
        'zhengzhou': '郑',
        'ruo': '鄀',
        'gar': '噶尔',
        'ruzhou': '汝',
        'yun': '允',
        'zhi_state': '轵',
        'xiongding': '雄',
        'yaozhou': '耀',
        'huo': '霍',
        'mushi': '穆',
        'lai': '莱',
        'lizhou_d': '利',
        'zuo_d': '笮',
        'zangke': '牂牁',
        'huangwang': '黄',
        'shenshi': '沈',
        'paiyao': '排瑶',
        'guizhou': '桂',
        'daozhou': '道',
        'dayu': '庾',
        'yingzhou': '英',
        'chuzhou_d': '滁',
        'buyi_d': '布依',
        'hani_d': '哈尼',
        'basha_d': '巴沙',
        'taira': '平',
        'wuman': '乌蛮',
        'yehe': '叶赫',
        'xiutu': '休屠',
        'dongzu': '侗',
        'wula': '乌拉',
        'mengwu': '蒙兀',
        'pugu': '仆骨',
        'bayegu': '拔野',
        'ketagalan': '凯达',
        'shanrong': '山戎',
        'suke': '素',
        'gaochang': '高昌',
        'chuyue': '处月',
        'baiyang': '白羊',
        'baidi': '白狄',
        'duomi': '多弥',
        'wumeng': '溪',
        'lelang': '乐浪',
        'huite': '辉特',
        'zubu': '阻卜',
        'kangba': '康巴',
        'nvguo': '女',
        'jiashi': '迦湿',
        'wuhu': '乌护',
        'sanada_d': '真田',
        'jiazini': '伽色',
        'jibin': '罽宾',
        'dulan_d': '杜兰',
        'baha': '巴哈',
        'hali': '哈里',
        'kalan': '卡兰',
        'xisi': '锡斯',
        'delan': '德兰',
        'huluo': '呼罗',
        'aba': '阿巴',
        'fanyanna': '梵衍',
                'wuzhou': '武',
        'bailong': '白龙',
        'jilizhou': '积',
        'nuergan': '都卫', // 奴儿干都司；据点名奴儿干城
        'kepantuo': '渴盘陀',
        'xingxingxia': '星',
        'yangguan': '敦煌',
        'wulianghai': '乌梁海',
        'qinghai': '青海',
        'xining': '西宁',
        'kalun': '卡伦',
        'fu_zhou': '涪',
        // ── 2026-06-19 新增：马尔吉亚纳·乌古斯 ──
        'maer_d': '马尔',
        'wugu_d': '乌',
        'adao_d': '阿',
        'wuyuan_d': '五',
        'chenli_d': '禅',
        'nuoyan_d': '赛',
        'wuli_d': '扎',
        'jiluo_d': '涿邪',
        'heisha_d': '黑沙',
        'kumoxi': '奚',
        'haikou': '寇',
        'shanshan': '鄯善',
};

    // [DYNAMIC REFACTOR] Removed factionFlagTextMap to dynamically generate all texts
    private static readonly factionFlagTextMap: { [key: string]: string } = {};

    // Map to store randomly assigned flags so they stay consistent during one session
    private static assignedRandomFlags: Map<string, string> = new Map();

    // Cache for processed images (Blob URLs / Data URLs)
    private static processedFlagCache: Map<string, string> = new Map();
    // Cache for rebel flags (multiple random flags)
    private static processedRebelFlags: string[] = [];
    /** 旗帜中心区域平均亮度缓存 (0-255). 用于黑/白字自适应选择. */
    private static flagLumCache: Map<string, number> = new Map();

    private static computeLumFromHex(hex: string): number {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 160;
        return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    }

    /** 优先读缓存；否则从固定色或 FactionManager 推算（开局即可用）. */
    private static resolveFlagLum(factionId: string): number {
        const cached = this.flagLumCache.get(factionId);
        if (cached !== undefined) return cached;

        const lum = this.computeLumFromHex(this.resolveFactionDisplayColor(factionId));
        this.flagLumCache.set(factionId, lum);
        return lum;
    }

    /**
     * 旗号汉字用白字还是黑字（AGENTS.md §10.2.1）。
     * true  → 白字 + 黑边（深旗，lum < FLAG_TEXT_LUM_THRESHOLD）
     * false → 黑字 + 白边（浅旗，lum ≥ FLAG_TEXT_LUM_THRESHOLD）
     */
    private static resolveFlagTextIsDark(factionId: string): boolean {
        if (FLAG_TEXT_BLACK_STYLE_FACTIONS.has(factionId)) {
            return false;
        }
        if (FLAG_TEXT_WHITE_STYLE_FACTIONS.has(factionId)) {
            return true;
        }
        return this.resolveFlagLum(factionId) < FLAG_TEXT_LUM_THRESHOLD;
    }

    private static invalidateFlagTextCache(factionId: string): void {
        this.processedFlagCache.delete(`dynamic_text_${factionId}`);
        this.processedFlagCache.delete(`dynamic_text_${factionId}_w`);
        this.processedFlagCache.delete(`dynamic_text_${factionId}_b`);
    }
    private static flagsLoaded = false;
    /** 叛军 S10QZ 7–58 是否已全部 chromaKey（见 PANJUN_REBEL_FLAG_* 常量） */
    private static panjunRebelsFullyLoaded = false;
    private static loadingPromise: Promise<void> | null = null;
    private static flagProcessingPromises = new Map<string, Promise<void>>();
    private static factionFlagReadyCallbacks = new Map<string, Set<() => void>>();
    /** 领土重绘进行中时，后台旗号批次让出主线程 */
    private static territoryWorkActive = false;
    private static chromaScheduleMode: ChromaScheduleMode = 'boot';
    private static bootCityList: Array<{ lat: number; lng: number; factionId: string }> = [];
    private static deferredFactionQueue: string[] = [];
    private static onDemandFactionQueue: string[] = [];
    private static backgroundDrainActive = false;
    private static backgroundDrainPromise: Promise<void> | null = null;
    private static backgroundDrainResolve: (() => void) | null = null;
    private static lastMapInteractionAt = 0;
    private static readonly MAP_INTERACTION_PAUSE_MS = 3000;
    /** 首次拖图前不处理 deferred 队列（仅视口 onDemand + 占位旗） */
    private static deferredDrainUnlocked = false;
    /** 镜头跟随军团：该势力旗号插队到 onDemand 队列最前 */
    private static followPriorityFactionId: string | null = null;
    private static readonly _PANJUN_ID = 'pan' + 'jun';

    public static setTerritoryWorkActive(active: boolean): void {
        CityAssetManager.territoryWorkActive = active;
    }

    public static isTerritoryWorkActive(): boolean {
        return CityAssetManager.territoryWorkActive;
    }

    /** GameApp 启动时注册，供视口内势力按需染色 */
    public static registerFlagCities(
        cities: Array<{ lat: number; lng: number; factionId: string; region?: string }>,
    ): void {
        this.bootCityList = cities.map((c) => ({
            lat: c.lat,
            lng: c.lng,
            factionId: c.factionId,
        }));
    }

    /**
     * 镜头选中跟随军团时调用：该军团所属势力旗号优先染色（西秦「兰」/皋兰等）。
     * factionId 为 null 时清除跟随优先。
     */
    public static prioritizeFollowedFaction(factionId: string | null): void {
        this.followPriorityFactionId = factionId;
        if (factionId && this.needsFactionTint(factionId)) {
            this.deferredFactionQueue = this.deferredFactionQueue.filter((id) => id !== factionId);
            this.bumpOnDemandFactionToFront(factionId);
        }
        this.scheduleBackgroundDrain();
    }

    /** 地图拖动/缩放时调用，暂停后台批量并优先染视口内势力 */
    public static notifyMapInteraction(): void {
        this.lastMapInteractionAt = performance.now();
        this.enqueueFactionsInMapView();
        this.scheduleBackgroundDrain();
    }

    /** 用户首次拖图：解锁全图 deferred 旗号染色 */
    public static unlockDeferredFlagDrain(): void {
        if (this.deferredDrainUnlocked) return;
        this.deferredDrainUnlocked = true;
        gameLog(
            'startup',
            `🚩 [CityAssetManager] 用户已拖图，开始后台染 deferred 旗号（${this.deferredFactionQueue.length} 个待处理）`,
        );
        this.scheduleBackgroundDrain();
    }

    /** 地图就绪：视口内势力先抠绿+染色（含固定色），再后台处理其余 */
    public static async onBootMapReady(): Promise<void> {
        this.enqueueFactionsInMapView();
        await this.preloadViewportFactionFlags();
        this.scheduleBackgroundDrain();
    }

    /** 启动前：势力入 deferred 队列，不 chroma、不 drain（等地图/拖图） */
    public static prepareDeferredFlagQueue(allFactions: string[]): void {
        const _PANJUN = this._PANJUN_ID;
        for (const id of allFactions) {
            if (id !== _PANJUN) this.enqueueDeferredFaction(id);
        }
        this.loadingPromise = Promise.resolve();
        gameLog(
            'startup',
            `🚩 [CityAssetManager] 旗号 deferred=${this.deferredFactionQueue.length}（视口按需 + 首次拖图后后台）`,
        );
    }

    private static collectFactionIdsInMapView(): string[] {
        const map = (window as any).game?.map?.getLeafletMap?.() as
            | { getBounds: () => { contains: (p: [number, number]) => boolean } }
            | undefined;
        if (!map || this.bootCityList.length === 0) return [];
        const bounds = map.getBounds();
        const seen = new Set<string>();
        const ids: string[] = [];
        for (const city of this.bootCityList) {
            if (!bounds.contains([city.lat, city.lng])) continue;
            if (seen.has(city.factionId)) continue;
            seen.add(city.factionId);
            ids.push(city.factionId);
        }
        return ids;
    }

    private static async preloadViewportFactionFlags(): Promise<void> {
        const ids = this.collectFactionIdsInMapView().filter((id) => this.needsFactionTint(id));
        if (ids.length === 0) return;
        await this._preloadFlagBatch(ids, { label: 'viewport', scheduleMode: 'boot' });
    }

    private static shouldPauseBackgroundDrain(): boolean {
        if (document.hidden) return false;
        const game = (window as any).game;
        const ts = game?.timeSystem;
        if (!ts || typeof ts.isGamePaused !== 'function') return false;
        if (ts.isGamePaused()) return false;
        return this.mapInteractionPauseRemainingMs() > 0;
    }

    private static mapInteractionPauseRemainingMs(): number {
        if (this.lastMapInteractionAt <= 0) return 0;
        return Math.max(0, this.MAP_INTERACTION_PAUSE_MS - (performance.now() - this.lastMapInteractionAt));
    }

    private static needsFactionTint(factionId: string): boolean {
        if (!factionId || factionId === this._PANJUN_ID) return false;
        return (
            !this.processedFlagCache.has(factionId) ||
            this.placeholderFactionIds.has(factionId)
        );
    }

    private static enqueueDeferredFaction(factionId: string): void {
        if (!this.needsFactionTint(factionId)) return;
        if (
            this.deferredFactionQueue.includes(factionId) ||
            this.onDemandFactionQueue.includes(factionId)
        ) {
            return;
        }
        this.deferredFactionQueue.push(factionId);
    }

    private static bumpOnDemandFactionToFront(factionId: string): void {
        this.onDemandFactionQueue = this.onDemandFactionQueue.filter((id) => id !== factionId);
        this.onDemandFactionQueue.unshift(factionId);
    }

    private static enqueueOnDemandFaction(factionId: string): void {
        if (!this.needsFactionTint(factionId)) return;
        this.deferredFactionQueue = this.deferredFactionQueue.filter((id) => id !== factionId);
        if (factionId === this.followPriorityFactionId) {
            this.bumpOnDemandFactionToFront(factionId);
        } else if (!this.onDemandFactionQueue.includes(factionId)) {
            this.onDemandFactionQueue.push(factionId);
        }
        this.scheduleBackgroundDrain();
    }

    private static enqueueFactionsInMapView(): void {
        for (const factionId of this.collectFactionIdsInMapView()) {
            this.enqueueOnDemandFaction(factionId);
        }
    }

    private static dequeueNextBackgroundFaction(): { id: string; mode: ChromaScheduleMode } | null {
        const followId = this.followPriorityFactionId;
        if (followId && this.needsFactionTint(followId)) {
            return { id: followId, mode: 'onDemand' };
        }
        const onDemand = this.onDemandFactionQueue.shift();
        if (onDemand) return { id: onDemand, mode: 'onDemand' };
        while (this.deferredFactionQueue.length > 0) {
            const id = this.deferredFactionQueue.shift()!;
            if (this.needsFactionTint(id)) return { id, mode: 'background' };
        }
        return null;
    }

    private static scheduleBackgroundDrain(): void {
        if (this.backgroundDrainActive) return;
        this.backgroundDrainActive = true;
        const step = () => {
            const next = this.dequeueNextBackgroundFaction();
            if (!next) {
                this.backgroundDrainActive = false;
                this.flagsLoaded = true;
                this.backgroundDrainResolve?.();
                this.backgroundDrainResolve = null;
                this.backgroundDrainPromise = null;
                gameLog('startup', '🚩 [CityAssetManager] Background flag drain complete');
                return;
            }
            if (next.mode === 'background' && !this.deferredDrainUnlocked) {
                this.deferredFactionQueue.unshift(next.id);
                this.backgroundDrainActive = false;
                return;
            }
            // 地图/跟拍移动期间，除当前跟随军团所属势力外，不做 chromaKey，避免旗号抢主线程。
            const isFollowPriority = !!this.followPriorityFactionId && next.id === this.followPriorityFactionId;
            if (!isFollowPriority && (next.mode === 'background' || next.mode === 'onDemand')) {
                const pauseMs = this.mapInteractionPauseRemainingMs();
                if (pauseMs > 0) {
                    if (next.mode === 'onDemand') {
                        this.onDemandFactionQueue.unshift(next.id);
                    } else {
                        this.deferredFactionQueue.unshift(next.id);
                    }
                    setTimeout(step, Math.min(pauseMs + 50, this.MAP_INTERACTION_PAUSE_MS));
                    return;
                }
            }
            if (next.mode === 'background' && this.shouldPauseBackgroundDrain()) {
                this.deferredFactionQueue.unshift(next.id);
                setTimeout(step, this.MAP_INTERACTION_PAUSE_MS);
                return;
            }
            this.chromaScheduleMode = next.mode;
            const t0 = performance.now();
            const metricKey =
                next.mode === 'onDemand' ? 'flagLoadOnDemand' : 'flagLoadBg';
            void this.processStandardFaction(next.id)
                .catch((e) => console.error('[CityAssetManager] background flag', e))
                .finally(() => {
                    PerformanceMonitor.getInstance().noteAsyncWork(
                        metricKey,
                        performance.now() - t0,
                    );
                    CityAssetManager.scheduleChromaWorkStep(step);
                });
        };
        CityAssetManager.scheduleChromaWorkStep(step);
    }

    private static yieldSchedulingSlice(preferIdle: boolean): Promise<void> {
        if (document.hidden) return Promise.resolve();
        if (preferIdle && CityAssetManager.territoryWorkActive) {
            return CityAssetManager.yieldIdle(100);
        }
        if (preferIdle && typeof requestIdleCallback !== 'undefined') {
            return new Promise((resolve) => {
                requestIdleCallback(() => resolve(), { timeout: 80 });
            });
        }
        return new Promise((resolve) => setTimeout(resolve, 0));
    }

    private static yieldIdle(timeoutMs: number): Promise<void> {
        if (typeof requestIdleCallback !== 'undefined') {
            return new Promise((resolve) => {
                requestIdleCallback(() => resolve(), { timeout: timeoutMs });
            });
        }
        return new Promise((resolve) => setTimeout(resolve, 16));
    }

    /** 洛阳 zoom=9 开局中心（地图未就绪时 fallback 矩形，优先用 Leaflet getBounds） */
    private static readonly BOOT_MAP_CENTER = { lat: 34.62, lng: 112.45 };
    private static readonly BOOT_VIEW_RADIUS_LAT = 1.35;
    private static readonly BOOT_VIEW_RADIUS_LNG = 1.62;

    // 兼容占位；正规势力旗面见 getFactionFlagTemplatePath(factionId)
    private static readonly templateFlagPath = '/SUCAI/S10QZ/7-1.png';
    /** 已抠绿、未染色的模板旗（按 S10QZ 路径缓存，六级各一种形） */
    private static readonly chromaNeutralTemplateByPath = new Map<string, string>();
    private static readonly chromaNeutralTemplatePromises = new Map<string, Promise<string>>();
    /** 仍为占位旗的势力；后台染色完成后从此集合移除 */
    private static readonly placeholderFactionIds = new Set<string>();
    private static boundFactionManager: FactionManager | null = null;

    /** GameApp 在 assignSpatialColors 之后调用，供旗号染色读固定色/随机色 */
    public static bindFactionManager(fm: FactionManager): void {
        this.boundFactionManager = fm;
    }

    /** 固定色（HistoricalFactionColors）优先，再读 FactionManager */
    private static resolveFactionDisplayColor(factionId: string): string {
        const fixed = HISTORICAL_FACTION_COLORS[factionId];
        if (fixed) return fixed;
        const fm =
            this.boundFactionManager ??
            ((window as any).game?.factionManager as FactionManager | undefined);
        return fm?.getFactionColor(factionId) ?? '#999999';
    }

    /** 抠绿不染色，同一路径只处理一次（六级 → 最多 6 张底图） */
    private static async ensureChromaNeutralTemplateForPath(src: string): Promise<string> {
        const cached = this.chromaNeutralTemplateByPath.get(src);
        if (cached) return cached;

        let pending = this.chromaNeutralTemplatePromises.get(src);
        if (!pending) {
            pending = this.chromaKeyImage(src, null)
                .then((url) => {
                    this.chromaNeutralTemplateByPath.set(src, url);
                    return url;
                })
                .catch(async () => {
                    const fallback = await this.ensureChromaNeutralTemplate();
                    this.chromaNeutralTemplateByPath.set(src, fallback);
                    return fallback;
                })
                .finally(() => {
                    this.chromaNeutralTemplatePromises.delete(src);
                });
            this.chromaNeutralTemplatePromises.set(src, pending);
        }
        return pending;
    }

    private static async ensureChromaNeutralTemplate(): Promise<string> {
        return this.ensureChromaNeutralTemplateForPath(this.templateFlagPath);
    }

    /**
     * 启动占位：按六级选用 9/16/26/57/33/53 抠绿占位，后台再染势力色。
     */
    public static async seedBootPlaceholderFlags(factionIds: string[]): Promise<void> {
        const unique = [...new Set(factionIds)];
        const _PANJUN = 'pan' + 'jun';

        for (const templatePath of getAllFactionFlagTemplatePaths()) {
            await this.ensureChromaNeutralTemplateForPath(templatePath);
            await CityAssetManager.yieldSchedulingSlice(false);
        }

        const placeholderByFaction = new Map<string, string>();
        for (const factionId of unique) {
            if (factionId === _PANJUN) continue;
            const templatePath = getFactionFlagTemplatePath(factionId);
            const tpl =
                this.chromaNeutralTemplateByPath.get(templatePath) ??
                (await this.ensureChromaNeutralTemplateForPath(templatePath));
            this.processedFlagCache.set(factionId, tpl);
            this.placeholderFactionIds.add(factionId);
            placeholderByFaction.set(factionId, tpl);
        }
        appendBootPlaceholderFlagRulesByFaction(placeholderByFaction);
    }

    /**
     * @deprecated 使用 prepareDeferredFlagQueue + onBootMapReady；保留兼容旧调用。
     */
    public static preloadFlagsProgressive(
        allFactions: string[],
        _cities: Array<{ lat: number; lng: number; factionId: string; region?: string }>
    ): { priority: Promise<void>; background: Promise<void> } {
        this.deferredDrainUnlocked = false;
        this.prepareDeferredFlagQueue(allFactions);
        const resolved = Promise.resolve();
        return { priority: resolved, background: resolved };
    }

    /**
     * Preload and process all flag images with chroma key and dynamic faction color tinting.
     */
    /** 等待旗号就绪（优先复用 preloadFlagsProgressive 的 loadingPromise） */
    public static async preloadFlags(neededFactions?: string[]): Promise<void> {
        if (this.flagsLoaded) return;
        if (this.loadingPromise) {
            await this.loadingPromise;
            return;
        }
        this.loadingPromise = this._preloadFlagBatch(
            neededFactions ?? Object.keys(this.factionFlagMap),
            { label: 'full' }
        )
            .then(() => this.ensureFullPanjunRebelFlags())
            .then(() => {
                this.flagsLoaded = true;
            });
        try {
            await this.loadingPromise;
        } finally {
            this.loadingPromise = null;
        }
    }

    private static async ensureFlagPole(): Promise<void> {
        if (this.processedFlagCache.has(this.flagPolePath)) return;
        try {
            const poleUrl = await this.chromaKeyImage(this.flagPolePath, null);
            this.processedFlagCache.set(this.flagPolePath, poleUrl);
        } catch {
            this.processedFlagCache.set(this.flagPolePath, this.flagPolePath);
        }
    }

    /** 后台补全叛军随机旗（若启动阶段未跑满 7–58） */
    private static async ensureFullPanjunRebelFlags(): Promise<void> {
        await this.processPanjunFlags(true);
    }

    private static appendRebelFlagStyleRules(): void {
        this.processedRebelFlags.forEach((url, i) => {
            setRebelFlagStyleRule(i, url);
        });
    }

    /** cityId → 稳定下标（0..len-1），替代 Math.random 避免扎堆与 len=1 时全图 index=0 */
    private static hashCityIdForRebelIndex(cityId: string, len: number): number {
        let h = 5381;
        for (let i = 0; i < cityId.length; i++) {
            h = ((h << 5) + h + cityId.charCodeAt(i)) >>> 0;
        }
        return h % len;
    }

    /** 叛军旗加载完成后刷新已渲染据点的 flag-rebel-* class（补 len=0 时全为 0 的 DOM） */
    private static notifyRebelFlagsReady(): void {
        const cm = (window as any).game?.cityManager as
            | { refreshPanjunRebelFlagMarkers?: () => void }
            | undefined;
        cm?.refreshPanjunRebelFlagMarkers?.();
    }

    /** 新局/刷新：清空叛军 cityId→旗面下标缓存 */
    public static resetRebelFlagAssignments(): void {
        this.assignedRandomFlags.clear();
    }

    /** 画据点前加载叛军旗：S10QZ 编号 PANJUN_REBEL_FLAG_ID_MIN–MAX（52 面）。AGENTS.md §10.3 */
    public static async preloadRebelFlagsForBoot(): Promise<void> {
        this.resetRebelFlagAssignments();
        if (this.panjunRebelsFullyLoaded) {
            if (this.processedRebelFlags.length > 0) {
                this.appendRebelFlagStyleRules();
                this.notifyRebelFlagsReady();
            }
            return;
        }
        await this.ensureFlagPole();
        await this.processPanjunFlags(false);
    }

    /**
     * chromaKey 像素环每步最多处理行数，避免单次 Long Task >50ms。
     * [PERF 2026-06-12] 36 → 512：整面旗（128×320，约 4 万像素）画布+取像素+像素环+
     * 写回+toDataURL 全流程只要 ~3ms，远低于 50ms 预算，没必要切片；
     * 旧值 36 = 每面旗被切成 13 个调度步、步步等 idle（最多 80ms/步），
     * 实测启动 46.7s 里 ~46s 是旗号在排队等 idle 而不是在干活。
     * 仅对超大图（>512 行）保留分片保护。
     */
    private static readonly CHROMA_ROWS_PER_SLICE = 512;

    /**
     * chroma 分片调度：只用 idle/setTimeout，禁止 rAF（与 GameApp / 画布共用 rAF 会「半秒一停」）。
     */
    private static scheduleChromaWorkStep(cb: () => void): void {
        if (document.hidden) {
            setTimeout(cb, 0);
            return;
        }
        const mode = this.chromaScheduleMode;
        const timeout =
            mode === 'background' ? 450 : mode === 'onDemand' ? 120 : 80;
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(cb, { timeout });
            return;
        }
        setTimeout(cb, mode === 'background' ? 48 : 0);
    }

    /** 叛军 S10QZ 7–58 共 52 面；可断点续载（processedRebelFlags.length） */
    private static async processPanjunFlags(preferIdleYield = false): Promise<void> {
        if (this.panjunRebelsFullyLoaded) return;
        const _PANJUN = 'pan' + 'jun';
        const minId = PANJUN_REBEL_FLAG_ID_MIN;
        const maxId = PANJUN_REBEL_FLAG_ID_MAX;
        const start = minId + this.processedRebelFlags.length;
        if (start > maxId) {
            this.panjunRebelsFullyLoaded = true;
            return;
        }
        const rebelT0 = performance.now();
        const prevMode = this.chromaScheduleMode;
        this.chromaScheduleMode = preferIdleYield ? 'background' : 'boot';
        for (let i = start; i <= maxId; i++) {
            const path = `/SUCAI/S10QZ/${i}-1.png`;
            const dataUrl = await this.chromaKeyImage(path, null).catch(() => null);
            if (dataUrl) this.processedRebelFlags.push(dataUrl);
            await CityAssetManager.yieldSchedulingSlice(preferIdleYield);
        }
        this.chromaScheduleMode = prevMode;
        const loaded = this.processedRebelFlags.length;
        if (loaded > 0) {
            this.processedFlagCache.set(_PANJUN, this.processedRebelFlags[0]);
        }
        if (loaded === 0) {
            console.error(
                `[CityAssetManager] 叛军旗 0/${PANJUN_REBEL_FLAG_COUNT} 加载成功，请检查 /SUCAI/S10QZ/${PANJUN_REBEL_FLAG_ID_MIN}-${PANJUN_REBEL_FLAG_ID_MAX}-1.png`,
            );
            this.panjunRebelsFullyLoaded = false;
            return;
        }
        if (loaded < PANJUN_REBEL_FLAG_COUNT) {
            console.warn(
                `[CityAssetManager] 叛军旗仅 ${loaded}/${PANJUN_REBEL_FLAG_COUNT}；未加载的编号将不可分配，相邻城易撞旗`,
            );
        } else {
            gameLog('startup', `🚩 [CityAssetManager] 叛军旗 ${loaded}/${PANJUN_REBEL_FLAG_COUNT} 就绪`);
        }
        this.panjunRebelsFullyLoaded = true;
        this.appendRebelFlagStyleRules();
        this.notifyRebelFlagsReady();
        const metricKey = preferIdleYield ? 'flagLoadBg' : 'flagLoadBoot';
        PerformanceMonitor.getInstance().noteAsyncWork(metricKey, performance.now() - rebelT0);
    }

    private static async processStandardFaction(factionId: string): Promise<void> {
        if (this.processedFlagCache.has(factionId) && !this.placeholderFactionIds.has(factionId)) {
            setFactionFlagStyleRule(factionId, this.processedFlagCache.get(factionId)!);
            this.notifyFactionFlagReady(factionId);
            return;
        }
        try {
            const colorHex = this.resolveFactionDisplayColor(factionId);
            const templatePath = getFactionFlagTemplatePath(factionId);
            const dataUrl = await this.chromaKeyImage(templatePath, colorHex);
            this.processedFlagCache.set(factionId, dataUrl);
            this.placeholderFactionIds.delete(factionId);
            const rgb = this.hexToRgb(colorHex);
            if (rgb) {
                const lum = this.computeLumFromHex(colorHex);
                this.flagLumCache.set(factionId, lum);
            }
            this.invalidateFlagTextCache(factionId);
            setFactionFlagStyleRule(factionId, dataUrl);
            this.notifyFactionFlagReady(factionId);
        } catch (e) {
            console.error(`Failed to process flag for faction: ${factionId}`, e);
            const templatePath = getFactionFlagTemplatePath(factionId);
            const fallback =
                this.chromaNeutralTemplateByPath.get(templatePath) ?? this.templateFlagPath;
            this.processedFlagCache.set(factionId, fallback);
            setFactionFlagStyleRule(factionId, fallback);
            this.notifyFactionFlagReady(factionId);
        }
    }

    /** 势力旗号染色完成（或已缓存）时回调；占城后轻量 patch 用 */
    public static whenFactionFlagReady(factionId: string, cb: () => void): void {
        if (!factionId || factionId === 'panjun') return;
        if (this.processedFlagCache.has(factionId) && !this.placeholderFactionIds.has(factionId)) {
            cb();
            return;
        }
        let listeners = this.factionFlagReadyCallbacks.get(factionId);
        if (!listeners) {
            listeners = new Set();
            this.factionFlagReadyCallbacks.set(factionId, listeners);
        }
        listeners.add(cb);
    }

    private static notifyFactionFlagReady(factionId: string): void {
        dispatchFactionFlagReady(factionId, this.factionFlagReadyCallbacks);
        this.refreshMapFlagTextForFaction(factionId);
    }

    /** 旗号染色完成后刷新视口内该势力据点的字色 overlay */
    private static refreshMapFlagTextForFaction(factionId: string): void {
        const ts = (window as any).game?.cityManager?.getTerritorySystem?.();
        ts?.patchFactionFlagText?.(factionId);
    }

    private static async _preloadFlagBatch(
        factionIds: string[],
        opts: { label?: string; scheduleMode?: ChromaScheduleMode } = {},
    ): Promise<void> {
        const label = opts.label ?? 'batch';
        const unique = [...new Set(factionIds)];
        if (unique.length === 0) return;

        gameLog('startup', `🚩 [CityAssetManager] Preloading flags [${label}]: ${unique.length} factions`);
        await this.ensureFlagPole();

        const startTime = performance.now();
        const isBackground = label === 'background';
        const prevMode = this.chromaScheduleMode;
        this.chromaScheduleMode = opts.scheduleMode ?? (isBackground ? 'background' : 'boot');
        const _PANJUN = this._PANJUN_ID;
        const processFaction = async (factionId: string): Promise<void> => {
            if (factionId === _PANJUN) {
                if (this.panjunRebelsFullyLoaded) return;
                await this.processPanjunFlags(isBackground);
                return;
            }
            await this.processStandardFaction(factionId);
        };

        // chromaKey + toDataURL 必须逐个做并让步，并行会占死主线程（F12 都打不开）
        for (let i = 0; i < unique.length; i++) {
            await processFaction(unique[i]);
            await CityAssetManager.yieldSchedulingSlice(isBackground);
        }

        this.chromaScheduleMode = prevMode;
        const duration = performance.now() - startTime;
        const metricKey =
            label === 'priority' || label === 'full' ? 'flagLoadBoot' : 'flagLoadBg';
        PerformanceMonitor.getInstance().noteAsyncWork(metricKey, duration);
        gameLog(
            'startup',
            `🚩 [CityAssetManager] [${label}] done in ${duration.toFixed(0)}ms (${unique.length} factions)`,
        );
    }

    /** 确保势力旗号 CSS 已就绪（占城等新 faction 时按需补载，绝不阻塞主线程） */
    public static async ensureFactionFlag(factionId: string): Promise<void> {
        if (!factionId || factionId === 'panjun') return;

        // 如果已经处理完染色（且不是占位），直接应用并返回
        if (this.processedFlagCache.has(factionId) && !this.placeholderFactionIds.has(factionId)) {
            setFactionFlagStyleRule(factionId, this.processedFlagCache.get(factionId)!);
            this.getProcessedFlagText(factionId);
            this.notifyFactionFlagReady(factionId);
            return;
        }

        // 没处理完或者是占位：
        // 1. 如果连占位图都没有，立刻塞一个“已抠绿未染色”的中立旗作为临时占位，防止显示绿幕原图
        if (!this.processedFlagCache.has(factionId)) {
            const tpl = await this.ensureChromaNeutralTemplate();
            this.processedFlagCache.set(factionId, tpl);
            this.placeholderFactionIds.add(factionId);
            setFactionFlagStyleRule(factionId, tpl);
            this.getProcessedFlagText(factionId);
        }

        // 2. 如果后台已经有这个势力的染色任务在排队或执行，直接返回即可，避免重复发起
        if (this.flagProcessingPromises.has(factionId)) {
            return;
        }

        this.enqueueOnDemandFaction(factionId);
        const promise = new Promise<void>((resolve) => {
            const check = () => {
                if (!this.needsFactionTint(factionId)) {
                    this.flagProcessingPromises.delete(factionId);
                    resolve();
                    return;
                }
                setTimeout(check, 80);
            };
            setTimeout(check, 80);
        });
        this.flagProcessingPromises.set(factionId, promise);
    }

    private static hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Get processed flag data URL for a faction.
     */
    public static getProcessedFlag(factionId: string): string {
        const cached = this.processedFlagCache.get(factionId);
        if (cached) return cached;
        const templatePath = getFactionFlagTemplatePath(factionId);
        return this.chromaNeutralTemplateByPath.get(templatePath) || this.templateFlagPath;
    }

    /**
     * 叛军据点 → `flag-rebel-{index}`；index 为 processedRebelFlags 下标，非 S10QZ 素材编号。
     * 素材编号见 PANJUN_REBEL_FLAG_ID_MIN–MAX（7–58，共 52 面）。
     *
     * 【叛军专用 · 与 FactionManager 势力色无关】
     * 当前实现：hash(cityId) % len 稳定分配，局内缓存；非 Math.random()。
     * len=1 时仍全图 index=0（素材未齐）；len=52 时每城不同面。不做邻城避重复。
     */
    public static getProcessedRebelFlagIndex(cityId: string): number {
        const len = this.processedRebelFlags.length;
        if (len === 0) return 0;

        const cached = this.assignedRandomFlags.get(cityId);
        if (cached !== undefined) {
            const idx = Number.parseInt(cached, 10);
            if (Number.isFinite(idx) && idx >= 0 && idx < len) return idx;
        }

        const index = this.hashCityIdForRebelIndex(cityId, len);
        this.assignedRandomFlags.set(cityId, String(index));
        return index;
    }

    /**
     * 叛军据点旗号：每局随机 52 面之一，同一局内同一 cityId 不变。
     */
    public static getProcessedRebelFlag(cityId: string): string {
        if (this.processedRebelFlags.length === 0) {
            return this.getProcessedFlag('panjun');
        }
        const index = this.getProcessedRebelFlagIndex(cityId);
        return this.processedRebelFlags[index];
    }

    /**
     * [DYNAMIC REFACTOR] Dynamically render flag text using DynamicFlagTextGenerator
     */
    public static getProcessedFlagText(factionId: string): string | null {
        // [USER-REQUEST] Hide flag text for panjun
        if (!factionId || factionId === 'panjun') return null;

        let textToRender = SANDBOX_DISPLAY_NAMES[factionId];

        if (!textToRender) {
            const factionManager = (window as any).game?.factionManager;
            const factionName = factionManager ? factionManager.getFactionName(factionId) : '';
            textToRender = (factionName && factionName !== '未知势力') ? factionName : factionId;
        }

        // 旗号仅显示前两字（AGENTS.md：旗面 1–2 汉字）
        if (textToRender && textToRender !== 'RANDOM') {
            textToRender = Array.from(textToRender).slice(0, 2).join('');
        }

        // §10.2.1：浅旗黑字白边，深旗白字黑边
        const useWhiteText = this.resolveFlagTextIsDark(factionId);
        const fill   = useWhiteText ? '#f0f0e8' : '#1a1a1a';
        const stroke = useWhiteText ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.70)';

        const variantKey = `dynamic_text_${factionId}_${useWhiteText ? 'w' : 'b'}`;
        if (this.processedFlagCache.has(variantKey)) {
            return this.processedFlagCache.get(variantKey)!;
        }

        const textImgUrl = DynamicFlagTextGenerator.generate(textToRender, fill, stroke);
        this.processedFlagCache.set(variantKey, textImgUrl);
        return textImgUrl;
    }

    /**
     * Get special flag text variant.
     */
    public static getSpecialFlagText(key: string): string | null {
        // [COMPATIBILITY] Return a dynamically rendered variant based on key, or null
        const cacheKey = `special_dynamic_text_${key}`;
        if (this.processedFlagCache.has(cacheKey)) {
            return this.processedFlagCache.get(cacheKey)!;
        }

        let word = '汉';
        if (key === 'zhonghua_variant') word = '魏'; // Legacy variant swap support

        const textImgUrl = DynamicFlagTextGenerator.generate(word);
        this.processedFlagCache.set(cacheKey, textImgUrl);
        return textImgUrl;
    }

    /**
     * Get processed pole image.
     */
    public static getProcessedPole(): string {
        return this.processedFlagCache.get(this.flagPolePath) || this.flagPolePath;
    }

    /**
     * Apply chroma key to remove green background from image, and optionally tint to a hex color.
     * 像素环分片 + rAF 让步，避免 img.onload 内一次性扫全图触发 50ms+ Long Task。
     */
    private static async chromaKeyImage(src: string, tintColorHex: string | null): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onerror = () => reject(new Error(`Failed to load flag image: ${src}`));
            img.onload = () => {
                const w = img.width;
                const h = img.height;

                // [PERF 2026-06-12] 整面旗合并为单个调度步（像素算法未动）：
                // 旧版把 画布→取像素→像素环×9片→写回→toDataURL 切成 13 步、步步等 idle，
                // 等待时间是实际工作（~3ms）的百倍，是启动 46.7s 的主因。
                // 现在小图一步做完；超大图（>CHROMA_ROWS_PER_SLICE 行）仍按行分片让步。
                let tintR = 255;
                let tintG = 255;
                let tintB = 255;
                if (tintColorHex) {
                    const rgb = CityAssetManager.hexToRgb(tintColorHex);
                    if (rgb) {
                        tintR = rgb.r;
                        tintG = rgb.g;
                        tintB = rgb.b;
                    }
                }

                let canvas: HTMLCanvasElement | null = null;
                let ctx: CanvasRenderingContext2D | null = null;
                let imageData: ImageData | null = null;
                let y0 = 0;
                const rowsPerSlice = CityAssetManager.CHROMA_ROWS_PER_SLICE;

                const processSlice = () => {
                    try {
                        if (!canvas) {
                            canvas = document.createElement('canvas');
                            canvas.width = w;
                            canvas.height = h;
                            ctx = canvas.getContext('2d');
                            if (!ctx) {
                                reject(new Error('Canvas 2d unavailable'));
                                return;
                            }
                            ctx.drawImage(img, 0, 0);
                            imageData = ctx.getImageData(0, 0, w, h);
                        }
                        const data = imageData!.data;

                        const yEnd = Math.min(y0 + rowsPerSlice, h);
                        for (let y = y0; y < yEnd; y++) {
                            let i = y * w * 4;
                            const rowEnd = i + w * 4;
                            while (i < rowEnd) {
                                const r = data[i];
                                const g = data[i + 1];
                                const b = data[i + 2];
                                const a = data[i + 3];

                                if (g > 200 && r < 100 && b < 100) {
                                    data[i + 3] = 0;
                                } else if (tintColorHex && a > 0) {
                                    let lum =
                                        (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                                    lum = Math.min(1, lum * 1.5);
                                    data[i] = Math.round(lum * tintR);
                                    data[i + 1] = Math.round(lum * tintG);
                                    data[i + 2] = Math.round(lum * tintB);
                                }
                                i += 4;
                            }
                        }
                        y0 = yEnd;
                        if (y0 < h) {
                            CityAssetManager.scheduleChromaWorkStep(processSlice);
                            return;
                        }

                        ctx!.putImageData(imageData!, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    } catch (e) {
                        reject(e);
                    }
                };

                CityAssetManager.scheduleChromaWorkStep(processSlice);
            };
            img.src = src;
        });
    }
}
