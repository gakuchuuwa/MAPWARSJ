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
'chatigangren': '查蒂',
'pelianci': '佩伦',
'zhen': '武珍',
'dongshengwei': '胜',
'dizhou': '棣',
'gaogouli': '高句',
        'xinluo': '新罗',
'manzhou': '爱新',
        'weihaiwei': '威海',
        'tingzhou_d': '汀',
'shaozhou_d': '邵',

        'shu': '蜀',
'yangzhou': '洋',
        'sizhou': '泗',
        'fengzhou': '凤',
'fushi': '苻',
'heishui': '靺鞨',
        'donghui': '东濊',
'gonggu': '宫古',
        'fuguo': '附',
        'gongtang': '贡唐',
'chizhou': '池',
'yada': '厌抵',
'quli': '渠犁',
'juandu': '捐毒',
        'sai': '塞',
        'yangtong': '羊同',

'liangzhou': '凉',

        'ashikaga': '室町',


        'min': '闽',
'najie': '那竭',
        'pangzha': '旁遮',
'wenling': '温陵',
        'qianzhou': '乾',
        'quanzhou': '泉',
        'shang': '商',
        'zhou': '周',
'qi': '齐',
        'jin': '晋',
'chu': '荆',
'wu': '吴',
'yue': '越',
'qin': '秦',
'song': '宋',
        'yan': '燕',
'zhao': '赵',
'wei': '魏',
'han': '韩',
'han_d': '汉',
'dian': '白',
'xin': '上党',
'juqu_d': '沮渠',
'tufa_d': '秃发',
'qiuchi': '仇池',
'helian': '赫连',
'xiongnu': '匈奴',
'xianbei': '鲜卑',
        'jie': '羯',
'beidi': '羌',
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
'manzhou_d': '清',
'ming_d': '明',
'liao_d': '辽',
'dangzhou': '氐',
        'dai_d': '代',
        'dingxiang_d': '定襄',
'xiayang_d': '夏阳',
        'zhongshan': '恒',
'wang_d': '沂',
'xiao_d': '兰陵',
'li_lx_d': '陇西',
'yuan_cj_d': '汝南',
        'xie_cj_d': '信',
'yue_d': '岳',
'qian_d': '秀',
'kong_d': '鲁',
'cao_d': '亳',
        'jiujiang': '浔',
'quanrong': '犬戎',
'suzhou': '肃',
        'sushen': '肃慎',
'guishuang': '贵霜',
'chile': '敕勒',
'rouran': '柔然',
'baishui': '景谷',
        'baiji': '百济',
'tubo': '吐蕃',
        'tujue': '突厥',
'tiele': '铁勒',
'huige': '回纥',
'dayue': '大越',
        'yamato': '大和',
'edo': '武藏',
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
'hashiba': '播磨',
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
        'chaozhou_d': '潮',
        'jiaodong': '胶东',
'jibei': '泰山',
        'wusun': '乌孙',
'dayuan': '大宛',
        'gouding': '句町',
'dongxian': '东海',
'tongma': '胶西',
        'tongzhou': '同',
        'baibo': '黄巾',
        'wuhuan': '乌桓',
'xianlingqiang': '先零',
'cheshihou': '乌垒',
'yelang': '夜郎',
'ailao': '哀牢',
'fuyu': '夫余',
'shule': '疏勒',
        'loulan': '楼',
        'shache': '莎车',
'qiuci': '龟兹',
'yanqi': '焉耆',
'qifu_d': '乞伏',
'tuyu_d': '廓',
        'linyi': '林邑',
'murong': '慕容',
'yingzhou_ying_d': '营',
        'erzhu': '尔朱',
'pizhou': '邳',

'zhai_han': '翟',
        'yin': '殷',
        'hejian': '莫',
'qu_d': '界津',
'liu': '九江',
        'ouyue': '台',
        'taizhou': '泰',

'xiangzhou': '襄',
        'zaoyang_d': '舂陵',
'suzhou_d': '宿',
'didao': '熙',
'lanzhou': '兰',
        'lu': '庐',
        'gaoqi_d': '高齐',
        'wuzhou_d': '武周',
'zhuozhou': '涿',
'tujia_d': '土家',
        'zhuang_d': '壮',
'xibo_d': '锡伯',
        'jinling': '南京',
        'wuwu_d': '无为',
'shizhao_d': '邢',
'ranwei_d': '冉魏',
'zu_d': '严',

'aisin_d': '满洲',
'sunwu_d': '孙吴',

'wazhai': '济阴',
'liangshidu': '绥',
'linshihong': '干越',
'kumo': '楮特',
'xijue': '十箭',
'xian_d': '高',
'xiqin': '宁',

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

'zhongxiang': '鼎',
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
'yueyi': '嶲',
'dongxia': '东夏',
'chagatai': '车师',
        'ogodei': '窝阔',
'kelie': '杭爱',
'kereyid': '克烈',
        'naiman': '乃蛮',
        'tatar': '塔塔',
'merkit': '蔑儿',
'ongut': '汪古',
'xushouhui': '天完',
        'zhangshicheng': '大周',
        'luoping': '新会',
        'chendiaoyan': '漳',

'fang_guozhen': '庆元',
        'dengmaoqi': '铲平',
'yezongliu': '处',
'dada_ming': '鞑靼',
'oirat_ming': '卫拉',
        'wala': '瓦剌',
'wuliangha': '兀良',
        'jianzhou_nvzhen': '建',
'haixi_nvzhen': '海西',
'yeren_nvzhen': '萨哈',
        'jilimi': '吉里',
'hezhe': '赫哲',
'luchuan': '麓川',
        'chijin': '赤',
'xihai_d': '吐谷浑',
        'heyuan_d': '河源',
'guiyi': '归义',
'dafeichuan': '退浑',
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
'dzungar': '绰罗',
        'khoshut': '和硕',
        'yarkand': '叶尔',
'khoja': '和卓',
        'gaxa': '噶厦',
'jinchuan_g': '金川',
'jinchuan_x': '赞拉',
        'geng': '靖南',
'shuntian': '天地',
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
'mohe': '完颜',

'shiwei': '室韦',
        'dingling': '丁零',
'nifuhe': '尼夫',
'nanzhong': '南中',

'huimo': '濊貊',
        'mao_wenlong': '毛',


'gaoche': '高车',
'da_yuan': '大元',

'kala': '喀汗',
'xiliao': '大辽',
'sogdian': '粟特',
'muer': '呼',
        'kangju': '康居',
        'geluolu': '葛逻',
        'yuchi': '尉迟',
'an': '乌兹',
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
'choros': '萨吾',
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
        'meitai': '梅',
        'hantawadi': '汉达',
'baiman': '白蛮',
'kunming_yi': '昆明',
        'miao': '苗',
        'pyu': '骠',
        'mon': '孟',
        'yang_bozhou': '播',
'tian_sizhou': '㵲',
'mu_lijiang': '丽江',
'ming_zheng': '明郑',
        'xiou': '西瓯',
'yao': '平阳',
        'jing': '京',
        'muong': '芒',
        'paiwan': '排湾',
        'trinh': '郑主',
'nguyen_guangnan': '阮',

        'cong': '賨',
'langzhou': '阆',
'zhe_d': '府',
        'shanyue': '山越',
        'she_ethnic': '畲',

'wuling': '五溪',

'wang_s': '黟',
'xiang_d': '来凤',
'tan_d': '澧',
'ran_d': '酉阳',
        'chu_d': '舒',
'hu_d': '三门',

'dajin': '金',
        'yizhou': '懿',
'yuan_d': '元',
        'weili': '尉犁',
        'pishan': '皮山',
        'bandun': '板楯',
        'seljuq': '塞尔',

'qingyi': '青衣',
'wuxi': '武陵',
'gumie': '衢',

        'shengmiao': '生苗',


'tuerhute': '土尔',

'kuai': '房',
        'yong': '庸',
'shen': '申',
        'sou': '叟',

        'shaodang': '烧当',

        'jingjiang': '靖江',
        'xinjiang': '静江',
        'panyao': '贺',
'jiang_s': '零陵',
'li_s': '静海',
        'leizhou': '雷',

'nong2': '侬',
'golog': '果洛',
        'tushetu': '土谢',
        'tumed': '土默特',
'she': '永宁',
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
'gandenpozhang': '冈底',
'dawoer': '嫩江',

        'tumengken': '图蒙',
        'liren': '俚',

        // ── 2026-05-28 新增：岭、琼波、索伦、图瓦 ──
'gling': '玉树',
        'khyungpo': '琼波',
'suolun': '达斡',
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
'tiemuer': '图兰',
'kawusi': '卡乌',
        'keerkezi': '柯尔',
        'yiduhu': '亦都',
'yangshao': '三川',
        'yel': '耶律',
'guzhu': '孤竹',
        'yizhi': '一支',
'zhuqian': '筑前',
        'jibei2': '备中',
        'jinchuan': '骏河',
'totomi': '远江',
'owari': '尾张',
        'yangshe': '羊舌',
'sima_d': '河内',
'liguo': '潞',
'kang': '宥',
        'shuofang': '朔方',
'lushui': '卢水',
        'yingli': '应理',
'guangwu': '广武',
        'huizhou': '会',
        'huizhou_d': '徽',
'pulei': '蒲类',
        'duerbote': '杜尔',
        'zhasaketu': '扎萨',
        'kaerka': '喀尔',
'huihu': '回鹘',
'wuzhumuqin': '乌珠',
'xingan': '布特',
'zhadalan': '扎答',
        'zhuerqi': '主儿',
        'chechen': '车臣',
        'pisha': '毗沙',
        'yumi': '扜弥',
        'keliya': '克雅',
        'xiye': '西夜',
        'faqiang': '发羌',
'panjun': 'RANDOM',
'changshan': '常山',
'linhu': '山西',
'lingqiu': '灵丘',
'linyu': '临榆',
'loufan': '楼烦',
'xianyu': '井陉',
       'yi': '易',
'you': '幽',
'heng1': '元岳',
        'jiantang': '建塘',
        'gongbu': '工布',
        'niang': '娘',
        'galangdiba': '波密',
'ali': '阿里',
'pazhu': '年楚',
'qiong': '邛',
'zhuoshi': '卓',
        'chenzhou_d': '辰',
        'qianzhong': '沅',
        'cuanshi': '爨',
'dianguo': '滇',
        'xinggu': '兴古',
        'guangxin': '广信',
'kejia': '宁化',
        'ouyang': '欧阳',
'danyang': '当涂',
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
'date_d': '仙台',
        'higo_d': '肥后',
'iyo_d': '伊予',
        'otomo_d': '大友',
        'suwa_d': '诹访',
'beihai': '北海',
        'hui': '濊',
        'luzhou': '渌',
        'xuantu': '玄菟',
'sambyeol': '沃',
'ssangseong': '和',
        'sheng_d': '升',
        'jinzhou': '锦',
        'wure': '兀惹',
'houliao': '东辽',
'dazhen': '大真',
        'jilin': '吉林',
        'sunite': '苏尼',
'dayuzi': '玉兹',
        'fu2': '抚',
'xinping': '邠',
        'huan': '环',
        'wei2': '韦',
'wenzhou': '温',
'wudu': '阶',
'woye': '沃野',
        'lingzhou': '灵',
'bailian': '白莲',
'chimei': '赤眉',
'yunzhong': '索头',
        'qian': '矩',
'chunshen': '春申',
        'wan': '安庆',
'qingyuan_bd': '清苑',
'zhong': '寿',
'xichu': '楚',
'jingzhou_gs': '泾',
        'guo': '果',
        'zi': '资',
'long2': '陇',
'song2': '松',
'qing': '庆',
        'jingmen': '荆门',
        'pingyuan': '高唐',
'xuan': '宣',
        'yiwu': '伊吾',

'ningkou': '居延',
'hongzhou': '洪',
'changshaguo': '湘',
        'weiwuer': '维吾',
        'wensu': '温宿',
        'keerqin': '科尔',
        'xiangxiong': '象雄',
'qingqiang': '冉駹',
'zhaowu': '昭武',
'ganzhou': '甘',
'gaoliang': '潘',
        'ruoqiang': '婼羌',
        'qiemo': '且末',
        'weitou': '尉头',
'dangchang': '叠',
'mi': '朐',
'hai2': '海',
        'qiepantuo': '朅盘',
        'eluoke': '鄂罗',
'ewenki': '鄂温',
        'kuye': '库页',
        'ayinu': '虾夷',
        'ruochu': '若敖',
'mi_chu': '安陆',
        'mino': '美浓',
'nanyue': '南越',
        'guangzhou': '广',
    'guangping': '广平',
'duanzhou_d': '端',
    'dunhe': '顿河',
'dongping': '东平',
'maomingan': '额尔',
        'aola': '敖拉',
        'bulat': '布拉',
        'buriat': '布里',
        'xianhai': '咸海',
'nandou': '难兜',
'yanda': '阿洪',
        'qincha': '钦察',
'anxi': '安西',
'konbaung': '贡榜',
'qi_d': '横水',
'wangyan': '太行',
'tianxiong': '魏博',
        'sunqin': '潼津',
'yingzhou_d': '颍',
'yanchuan_d': '郾',
'huang_d': '潢',
'yuzhou': '豫',
'yiyang_d': '义阳',
'mengcheng_d': '山桑',
        'guide_d': '芒砀',
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
'jiyuan': '济源',
'xiongding': '雄',
        'yaozhou': '耀',
        'huo': '霍',
'mushi': '穆陵',
        'lai': '莱',
        'lizhou_d': '剑',
        'zuo_d': '笮',
        'zangke': '牂牁',
        'huangwang': '黄',
'shenshi': '苕溪',
        'paiyao': '排瑶',
        'guizhou': '桂',
'daozhou': '道',
'dayu': '庾',
        'yingzhou': '英',
        'chuzhou_d': '滁',
'buyi_d': '布依',
        'hani_d': '哈尼',
        'basha_d': '巴沙',
'taira': '长门',
        'wuman': '乌蛮',
'yehe': '叶赫',
'xiutu': '休屠',
        'dongzu': '侗',
'wula': '乌拉',
'mengwu': '蒙兀',
'pugu': '仆骨',
        'bayegu': '拔野',
        'ketagalan': '凯达',
'shanrong': '蓟',
'suke': '素',
'gaochang': '麴',
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
'jiashi': '迦尸',
        'jiashi_d': '瓦拉',
        'wuhu': '乌护',
'sanada_d': '信浓',
        'jiazini': '伽色',
'jibin': '罽宾',
'babuer': '阿富',
'danmai': '丹麦',
'ruidian_si': '瑞典',
'kasidiliya': '卡斯',
'duluo': '杜罗',
'teluoyi': '达尔',
'alabo': '大食',
'dulan_d': '杜兰',
        'baha': '巴哈',
'hali': '萨洛',
        'kalan': '卡兰',
'xisi': '锡斯',
        'delan': '德兰',
'huluo': '古尔',
        'aba': '阿巴',
        'fanyanna': '梵衍',
'wuzhou': '武',
        'bailong': '白龙',
'jilizhou': '积',
        'nuergan': '都卫', // 奴儿干都司；据点名奴儿干城
        'kepantuo': '渴盘陀',
        'xingxingxia': '星',
'yangguan': '西凉',
        'wulianghai': '乌梁海',
'qinghai': '青海',
'xining': '西宁',
'kalun': '柴达',
        'fu_zhou': '涪',
        // ── 2026-06-19 新增：马尔吉亚纳·乌古斯 ──
'maer_d': '马尔',
'wugu_d': '乌古',
        'adao_d': '阿',
        'wuyuan_d': '五',
'chenli_d': '姑衍',
        'nuoyan_d': '赛',
        'wuli_d': '扎',
'jiluo_d': '涿邪',
        'heisha_d': '黑沙',
        'kumoxi': '奚',
'haikou': '寇',
        'shanshan': '鄯善',
'wuyue': '吴越',
'xiyuduhu': '都护',
'zizhou': '梓',
        'cangzhou': '沧',
'yuezhi': '月氏',
        'minyue': '闽越',
'funan': '扶南',
'lancang': '澜沧',
'ahaomu': '阿萨',
'elunchunzu': '鄂伦',
'wazu': '佤',
'tajikezu': '塔吉',
'jingpozu': '景颇',
'shuizu': '水',
        'liuzhou': '柳',
'agui': '儹拉',
'luming': '郧',
'dingzhou': '定',
'shanzhou': '鄯',
'weizhou': '维',
'yingzhou_d2': '应',
'dongsheng': '云中',
'weiyuan': '亹源',
        'yansui': '延绥',
'xiazhou': '夏',
'yanzhou': '盐',
'shizhou': '西河',
        'leloi': '清化',
'cangsong': '苍松',
'manghuti': '忙忽',
'xingwei': '兴威',
        'saerbadaer': '萨尔',
        'kumisi': '库米',
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
        'heti': '赫梯',
'fulijiya': '弗里',
        'ldiya': '吕底',
        'pajiama': '帕加',
'bitiniya': '比提',
        'luomu': '罗姆',
        'osman': '奥斯',
'baizanting': '拜占',
'sailiugu': '塞琉',
'womaya': '倭马',
        'xibolai': '希伯',
        'aiji': '埃及',
        'dibisi': '上埃',
        'kushen': '库什',
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
        'safawei_d': '萨法',
        'sumeier': '苏美',
        'ayoubu': '阿尤',
        'mamuluke': '马穆',
        // ── 2026-08-04 新增：奥斯若恩 @ 埃德萨 ──
        'aosiruowen': '奥斯',
        'kesa': '可萨',
'aiaoniya': '爱奥',
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
        'sumo': '苏摩',
        'beileinisi': '红港',
        'dedan': '德丹',
        'maidina': '麦地',
        'gulaishi': '古莱',
        'xierwan': '希尔',
        'xiemian': '谢缅',
        'yidier': '伊蒂',
        'salai': '诺盖',
        'mangshi': '曼格',
        'kejila': '科基',
        'buni': '布匿',
        'talike': '塔里',
        'guadaer': '瓜达',
        'baojian_qishi': '宝剑',
        // ── 2026-08-04 新增：大波兰 @ 波兹南 ──
'dabolan': '大波',
        // ── 2026-08-04 新增：斯洛博达 @ 哈尔科夫 ──
        'siluoboda': '斯洛',
'keluodiya': '克罗',
        // ── 2026-08-04 新增：野地 @ 沃罗涅日 ──
        'yedi': '野地',
        'luosi': '罗斯',
'shaiyue': '喀尔',
        'meikelunbao': '文德',
'wende': '萨克',
        'boumeilaniyan': '卡舒',
        'pomeilaniya': '波美',
'mazhaer': '匈牙',
'xiongyati': '匈雅',
'mangsite': '芒斯',
'kaleiliya': '卡累',
        'bosiniya': '波斯',
        'taolika': '陶里',
'shengdian_qishi': '圣殿',
        'yelusalengwg': '耶路',
        'mozeer': '摩泽',
'seleisi': '色雷',
        'maerta_qishi': '马耳',
        'andaluoxiya': '安达',
        'aztec': '阿兹',
'inca': '印加',
        'maya': '玛雅',
        'mapuche': '马普',
        'muisca': '穆伊',
        'tupi': '图皮',
        'xibanya': '西班',
'manding': '曼丁',
'ethiopia': '埃塞',
'zhagewei': '扎格',
        'adal': '阿达',
        'malacca': '满剌',
        'medang': '马打',
        'ternate': '特尔',
        'sulu': '苏禄',
        'xishudongyin': '西属',
        'puxiangyindu': '葡印',
        'xiyindu': '西印',
        'jialebi': '加勒',
        'gurjara': '瞿折',
        'suomunate': '索姆',
        'zhuluo': '朱罗',
        'sengjialuo': '僧伽',
        'pandiya': '潘地',
        'gaolu_luoma': '高罗',
        'donggete': '东哥',
        'litaowan': '立陶',
        'bogendi': '勃艮',
        'bulabante': '班特',
        'kaernute': '卡尔',
        'xiongren': '匈人',
    'liaozu': '寮',
    'kushi': '库施',
    'aimala': '艾马',
    'aolisha': '奥里',
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
    'kuertaiya': '库尔',
'muwaxide': '穆瓦',
    'varendra': '伐连',
    'duonaobaojia': '多瑙',
    'lumiliya': '鲁米',
    'yilaka': '伊拉',
    'xingelana': '新格',
    'eluosi_diguo': '俄罗',
    'gualani': '瓜拉',
    'xiadunhe': '下顿',
        'kelimiya': '克里',
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

    public static invalidateFlagTextCache(factionId: string): void {
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
        // [PERF 2026-07-20] 启动不再 await 视口旗批量染色。
        // 全屏视口可含 24+ 势力：串行逐面 fetch/染色与地图渲染长任务(399 个/78 秒)互相排队,
        // 实测把启动拖到 89 秒——而真实像素工作只有 2.4 秒,其余全是等。
        // enqueueFactionsInMapView 已把同一批势力塞进 onDemand 队列,scheduleBackgroundDrain
        // 优先消化视口旗(不受地图移动暂停影响)：旗先显示占位、随后逐面上色,启动即刻放行。
        // 小视口(1 面旗)本来就 3.5 秒,不受影响;大视口从 89 秒回到 ~10 秒。
        this.enqueueFactionsInMapView();
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

    // [2026-07-20 删] preloadViewportFactionFlags：曾在启动时 await 批量染视口旗,
    // 是 89 秒慢启动主因;视口旗现走 enqueueFactionsInMapView → onDemand 队列后台上色。

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
            // 地图移动期间只暂停全图扫尾（background），视口 onDemand 不暂停——
            // 镜头跟随军团时持续触发 move → pauseMs 永远 > 0，若也暂停 onDemand 则视口陌生势力旗帜永远刷不到。
            if (next.mode === 'background') {
                const pauseMs = this.mapInteractionPauseRemainingMs();
                if (pauseMs > 0) {
                    this.deferredFactionQueue.unshift(next.id);
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

    /**
     * [PERF 2026-07-19] 不受后台标签页节流的让步。
     * setTimeout/rIC 在后台或失焦窗口被 Chrome 钳到 ≥1 秒一次；MessageChannel 不受该限制。
     */
    private static macroYield(): Promise<void> {
        return new Promise((resolve) => {
            const ch = new MessageChannel();
            ch.port1.onmessage = () => {
                ch.port1.close();
                ch.port2.close();
                resolve();
            };
            ch.port2.postMessage(0);
        });
    }

    private static lastYieldAt = 0;
    /** 让步预算：累计工作满这么久才让一次（单面旗染色实测 ~7ms） */
    private static readonly YIELD_BUDGET_MS = 24;

    /**
     * [PERF 2026-07-19] 改为「按时间预算让步」。
     * 旧版每染一面旗就 setTimeout(0) 让步一次，后台标签页被钳成 1 秒/面 →
     * 视口 70 面旗吃掉 70 秒启动（实际像素工作仅 ~7ms/面）。
     * 现在只在累计工作超预算时才让步，且走 MessageChannel 不吃节流。
     */
    private static yieldSchedulingSlice(preferIdle: boolean): Promise<void> {
        if (document.hidden) return Promise.resolve();
        const now = performance.now();
        if (now - CityAssetManager.lastYieldAt < CityAssetManager.YIELD_BUDGET_MS) {
            return Promise.resolve();
        }
        CityAssetManager.lastYieldAt = now;
        if (preferIdle && CityAssetManager.territoryWorkActive) {
            return CityAssetManager.yieldIdle(100);
        }
        if (preferIdle && typeof requestIdleCallback !== 'undefined') {
            return new Promise((resolve) => {
                requestIdleCallback(() => resolve(), { timeout: 80 });
            });
        }
        return CityAssetManager.macroYield();
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

        // [PERF 2026-07-17] 6 张模板并行处理：像素工作仅 ~3ms/张，启动期主线程被山体瓦片等挤占时
        // 逐张 await 的每个 hop 要等数百 ms～数秒，改并行让等待重叠（6 张不构成并行 chromaKey 风暴）。
        await Promise.all(
            getAllFactionFlagTemplatePaths().map((p) => this.ensureChromaNeutralTemplateForPath(p)),
        );

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

    /** 等待全部旗号就绪（正规势力全表 + 叛军 52 面）；启动主链不走这里，见 prepareDeferredFlagQueue */
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

    /** [诊断 2026-07-17] 旗帜管线耗时分解（图片加载/像素工作/让步等待），finishBoot 随 boot-timing 上报 */
    public static readonly flagPerf = { imgLoadMs: 0, sliceMs: 0, yieldMs: 0, flags: 0 };

    /**
     * 画据点前加载叛军旗兜底面。S10QZ 编号 PANJUN_REBEL_FLAG_ID_MIN–MAX 共 52 面，
     * 但**开局只 await 第 1 面**（开局全图皆叛军城，全量 await 是白等），
     * 其余 3 秒后后台断点续载补满。AGENTS.md §10.3
     */
    public static async preloadRebelFlagsForBoot(): Promise<void> {
        (window as any).__flagPerf = this.flagPerf;
        this.resetRebelFlagAssignments();
        if (this.panjunRebelsFullyLoaded) {
            if (this.processedRebelFlags.length > 0) {
                this.appendRebelFlagStyleRules();
                this.notifyRebelFlagsReady();
            }
            return;
        }
        await this.ensureFlagPole();
        // [PERF 2026-07-17 主人定] 沙盒开局除各势力首都外全图皆叛军城（约 660+ 座，见 GameAppCityLoader），
        // 但启动全量 await 52 面仍是白等：只装第 1 面兜底（开局短暂全穿同一面旗），
        // 其余开局 3s 后后台断点续载补满，notifyRebelFlagsReady 会刷新已渲染据点换上各自的旗。
        await this.processPanjunFlags(false, 1);
        setTimeout(() => { void this.ensureFullPanjunRebelFlags().catch(() => { /* 后台补载失败下次 preloadFlags 再续 */ }); }, 3000);
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
        // 占城触发的 onDemand / boot 旗帜尽快处理（不硬等，用空闲调度）；
        // background 全图扫尾降到 120ms，避免长时间灰旗（原 450ms 导致全图刷新数分钟）
        const timeout =
            mode === 'background' ? 120 : mode === 'onDemand' ? 32 : 32;
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(cb, { timeout });
            return;
        }
        setTimeout(cb, mode === 'background' ? 16 : 0);
    }

    /**
     * 叛军旗装载串行闸。
     * [FIX 2026-08-05] 有两个入口会同时触发补载：preloadRebelFlagsForBoot 的 3 秒定时器，
     * 和 LegionFlagDrawer.preload → preloadFlags() 链尾的 ensureFullPanjunRebelFlags。
     * 而 panjunRebelsFullyLoaded 要跑完才置位、中途没有在途标记，两条线会各自按进入时的
     * processedRebelFlags.length 算起点、同时往同一个数组里 push —— 52 面旗被抠两遍、
     * 数组里还会塞进重复项，且正好砸在启动最堵的窗口。串起来跑，后一条自然从断点续载。
     */
    private static panjunFlagChain: Promise<void> = Promise.resolve();

    private static processPanjunFlags(preferIdleYield = false, maxCount?: number): Promise<void> {
        const next = this.panjunFlagChain.then(() => this.runProcessPanjunFlags(preferIdleYield, maxCount));
        this.panjunFlagChain = next.catch(() => { /* 失败不阻断后续补载 */ });
        return next;
    }

    /** 叛军 S10QZ 7–58 共 52 面；可断点续载（processedRebelFlags.length） */
    private static async runProcessPanjunFlags(preferIdleYield = false, maxCount?: number): Promise<void> {
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
        const endId = maxCount !== undefined ? Math.min(maxId, start + maxCount - 1) : maxId;
        for (let i = start; i <= endId; i++) {
            const path = `/SUCAI/S10QZ/${i}-1.png`;
            const dataUrl = await this.chromaKeyImage(path, null).catch(() => null);
            if (dataUrl) this.processedRebelFlags.push(dataUrl);
            const tYield = performance.now();
            await CityAssetManager.yieldSchedulingSlice(preferIdleYield);
            this.flagPerf.yieldMs += performance.now() - tYield;
            this.flagPerf.flags++;
        }
        this.chromaScheduleMode = prevMode;
        const loaded = this.processedRebelFlags.length;
        if (loaded > 0) {
            this.processedFlagCache.set(_PANJUN, this.processedRebelFlags[0]);
        }
        // [PERF 2026-07-17] 部分装载（开局仅兜底面）：样式先可用，不标记完成，留给后台断点续载补满
        if (endId < maxId) {
            if (loaded > 0) {
                this.appendRebelFlagStyleRules();
                this.notifyRebelFlagsReady();
            }
            return;
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

        // 岳飞北伐脚本进行中：郾川旗面临时改「岳」（结束/覆没后恢复「郾」）
        if (factionId === 'yanchuan_d' && (window as any).__yuefeiExpeditionActive) {
            textToRender = '岳';
        }
        // 霍去病封狼居胥脚本进行中：肃州旗面临时改「汉」（结束/覆没后恢复）
        if (factionId === 'suzhou' && (window as any).__huoqubingExpeditionActive) {
            textToRender = '汉';
        }
        // 诸葛亮北伐中原脚本进行中：季汉旗面临时改「漢」（结束/覆没后恢复）
        if (factionId === 'huizhou_d' && (window as any).__zhugeliangExpeditionActive) {
            textToRender = '漢';
        }

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
        // [PERF 2026-07-17] fetch+createImageBitmap 取代 <img>：后台标签页里 <img> 的加载/解码
        // 被 Chrome 降优先级（52 面叛军旗串行实测 9.2s，文件仅 ~3KB/面）；fetch 不受该节流。
        // 行为不变：成功返回 dataURL，加载失败照旧抛错（调用方 catch 兜底）。
        const tStart = performance.now();
        const resp = await fetch(src);
        if (!resp.ok) throw new Error(`Failed to load flag image: ${src}`);
        const blob = await resp.blob();
        const img = await createImageBitmap(blob);
        CityAssetManager.flagPerf.imgLoadMs += performance.now() - tStart;
        return new Promise((resolve, reject) => {
            const run = () => {
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
                    const tSlice = performance.now();
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
                            CityAssetManager.flagPerf.sliceMs += performance.now() - tSlice;
                            CityAssetManager.scheduleChromaWorkStep(processSlice);
                            return;
                        }

                        ctx!.putImageData(imageData!, 0, 0);
                        const out = canvas.toDataURL('image/png');
                        CityAssetManager.flagPerf.sliceMs += performance.now() - tSlice;
                        resolve(out);
                    } catch (e) {
                        reject(e);
                    }
                };

                // [PERF 2026-07-17] 小图（≤CHROMA_ROWS_PER_SLICE 行）同步一步做完，不进调度器：
                // rIC/setTimeout 在后台标签页被节流到 ≥1 秒/次，52 面叛军旗的调度 hop 曾把启动
                // 吃到 98s（实际像素工作仅 ~3ms/面，见 2026-06-12 同病历史）。超大图仍分片走调度。
                if (h <= rowsPerSlice) {
                    processSlice();
                } else {
                    CityAssetManager.scheduleChromaWorkStep(processSlice);
                }
            };
            run();
        });
    }
}
