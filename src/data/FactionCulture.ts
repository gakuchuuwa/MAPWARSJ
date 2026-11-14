/**
 * 势力文化（67 文化之一）。🔴 [2026-11-13 主人定] 军团＝势力时代 × 势力文化；武将文化跟势力走。
 * 来源：GG《势力文化表_2026-11-13》（大势力按首都定文化；大元＝漠南、大清＝东北按主人裁定）。
 * 2026-11-13 按史改 7 家：马科曼尼→波希米亚、苏维汇→葡萄牙、哥萨克→库曼、罗斯 1054 前→瓦良格、
 *   卡尔比德→西西里、博斯普鲁斯→拜占庭、普斯科夫→瓦良格（各为对应二级军团的原型政权）。
 * 分段势力写 [起始年, 文化][]，按武将经典战年（无则登场年）落段；叛军不填。
 */
import type { BuildingStyle } from './cities_v2';

export const FACTION_CULTURE: Record<string, BuildingStyle | readonly (readonly [number, BuildingStyle])[]> = {
    "barakzai_afghan": 'PERSIAN',   // 巴拉克宰
    "zand_dynasty": 'PERSIAN',   // 赞德
    "aizu_ashina": 'JAPAN',   // 芦名家
    "aq_qoyunlu": 'SASANIAN',   // 白羊土库曼
    "bulidi": 'ORIE',   // 布里迪埃米尔国
    "tahirid": 'SASANIAN',   // 塔希尔埃米尔国
    "heruli": 'GOTHS',   // 赫鲁利
    "huanchu": 'JIANGNAN',   // 桓楚
    "gallic_empire": 'ROMA',   // 高卢帝国
    "jingzhou": 'HUGUANG',   // 荆州
    "libiya": 'BERBER',   // 利比亚
    "jiaxite": 'ORIE',   // 加喜特
    "hulumusi": 'PERSIAN',   // 忽鲁谟斯
    "bolinixiya": 'MALAY',   // 波利尼西亚
    "latin_empire": 'FRANKS',   // 拉丁帝国
    "anjou": 'FRANKS',   // 安茹
    "pisa": 'LATIN',   // 比萨共和国
    "chalkidike": 'GREECE',   // 卡尔基季基同盟
    "paeonia": 'THRACIAN',   // 佩奥尼亚
    "messenia": 'GREECE',   // 美塞尼亚
    "rhodes": 'GREECE',   // 罗得
    "zhongshan": 'WEI',   // 中山国
    "linhu": 'XIANBEI',   // 林胡
    "chalcis": 'GREECE',   // 卡尔基斯
    "plataea": 'GREECE',   // 普拉提亚
    "methone": 'GREECE',   // 梅托涅
    "lycia": 'GREECE',   // 吕基亚
    "dolopes": 'GREECE',   // 多洛佩斯
    "thasos": 'GREECE',   // 萨索斯
    "corinth": 'GREECE',   // 科林斯
    "melos": 'GREECE',   // 米洛斯
    "argos": 'GREECE',   // 阿尔戈斯
    "epidaurus": 'GREECE',   // 埃皮道鲁斯
    "corcyra": 'GREECE',   // 科西拉
    "mytilene": 'GREECE',   // 米蒂利尼
    "jiangnan_yijun": 'JIANGNAN',   // 江南义军
    "jiangqi": 'CENTRAL',   // 姜齐
    "luoma_gongheguo": 'ROMA',   // 罗马共和国
    "hasmonean": 'ORIE',   // 哈斯蒙尼王国
    "arelat": 'BURGUNDIANS',   // 上勃艮第王国
    "hou_womaya": 'ORIE',   // 后倭马亚
    "ganzhou_huihu": 'HEXI',   // 甘州回鹘
    "gaochang_huihu": 'WESTERN',   // 高昌回鹘
    "guge": 'TIBET',   // 古格
    "xiliao": 'WESTERN',   // 西辽
    "dongliao": 'XIANBEI',   // 东辽
    "daiguo": 'XIANBEI',   // 代国
    "baojialiya2": 'BULGARIANS',   // 保加利亚第二帝国
    "houli": 'VIETNAMESE',   // 后黎
    "zhunge": 'MONGOL',   // 准噶尔
    "thonburi": 'KHMER',   // 吞武里王国
    "zao_zhuluo": 'INDIA',   // 早期朱罗
    "kotte": 'INDIA',   // 科特王国
    "gu_aiji": 'ORIE',   // 埃及新王国
    "aiji_guwangguo": 'ORIE',   // 埃及古王国
    "houjin": 'NORTHEAST',   // 后金
    "buyid": 'PERSIAN',   // 白益埃米尔国
    "scaliger": 'LATIN',   // 斯卡利杰里家族
    "mantinea": 'GREECE',   // 曼丁尼亚
    "arcadia": 'GREECE',   // 阿卡迪亚同盟
    "macedon_royal": 'MACEDONIAN',   // 马其顿王军
    "naxos": 'GREECE',   // 纳克索斯
    "phokis": 'GREECE',   // 福基斯
    "wuguobu": 'NORTHEAST',   // 五国部
    "balti": 'TIBET',   // 巴尔蒂
    "zhenghe_yijun": 'HUGUANG',   // 头陀军
    "desheng": 'HUGUANG',   // 德胜
    "zhangchu": 'CENTRAL',   // 张楚
    "pattani": 'MALAY',   // 北大年
    "kilwa": 'ORIE',   // 基尔瓦苏丹国
    "mombasa": 'ORIE',   // 蒙巴萨苏丹国
    "mogadishu": 'ORIE',   // 摩加迪沙苏丹国
    "malindi": 'ORIE',   // 马林迪苏丹国
    "zuraid": 'ORIE',   // 祖拉伊德
    "ayinu_ezo": 'JAPAN',   // 阿伊努
    "boootiya": 'GREECE',   // 底比斯
    "kelite": 'LATIN',   // 威尼斯共和国
    "leangongguo": 'SPANISH',   // 莱昂
    "xixiliwangguo": 'SICILIANS',   // 西西里
    "liangxixili": 'SICILIANS',   // 两西西里
    "yipilusi": 'GREECE',   // 伊庇鲁斯
    "lagoniya": 'SPARTANS',   // 斯巴达
    "maqidun": 'MACEDONIAN',   // 马其顿
    "sesali": 'GREECE',   // 色萨利
    "lagusa": 'LATIN',   // 达尔马提亚
    "meikelunbao": 'POLES',   // 文德
    "didi": 'BURGUNDIANS',   // 佛兰德
    "yidelisi": 'BERBER',   // 摩洛哥
    "baojialiya": 'BULGARIANS',   // 保加利亚
    "bosiniya": 'SLAVIC',   // 波斯尼亚
    "mulabite": 'BERBER',   // 穆拉比特
    "awraba": 'BERBER',   // 奥雷巴
    "malin": 'BERBER',   // 马林苏丹国
    "zhayan": 'BERBER',   // 扎扬
    "hamade": 'BERBER',   // 哈马德苏丹国
    "buni": 'BERBER',   // 迦太基
    "aguelabu": 'ORIE',   // 阿格拉布
    "jileinaijia": 'GREECE',   // 昔兰尼
    "maixiya": 'BRITONS',   // 麦西亚
    "nidelan": 'GERMANIC',   // 尼德兰
    "pomeilaniya": [[1121, 'POLES'], [1348, 'GERMANIC']],   // 波美拉尼亚
    "talanduo": 'GREECE',   // 塔兰托
    "safuyi": [[1003, 'BURGUNDIANS'], [1563, 'LATIN']],   // 萨伏伊
    "jiatailuoniya": 'SPANISH',   // 加泰罗尼亚
    "nasier": 'ORIE',   // 纳斯尔
    "seleisi": 'THRACIAN',   // 色雷斯
    "pufaerci": 'GERMANIC',   // 普法尔茨
    "hansa": 'SAXONS',   // 汉萨
    "batawei": 'GERMANIC',   // 巴塔维
    "weijing_york": 'VIKINGS',   // 约维克
    "aquidan": 'FRANKS',   // 阿奎丹
    "puluowangsi": 'FRANKS',   // 普罗旺斯
    "lunbadi": 'LATIN',   // 伦巴第
    "gepids": 'GOTHS',   // 革皮德
    "kalbids": 'SICILIANS',   // 卡尔比德（巴勒莫西西里埃米尔国 948–1053；对应封建时代埃米尔军团）
    "donggete": 'GOTHS',   // 东哥特
    "xigete": 'GOTHS',   // 西哥特
    "alagong": 'SPANISH',   // 阿拉贡
    "xila": 'ATHENIANS',   // 雅典
    "fulandesi": 'FRANKS',   // 阿图瓦
    "bulabante": 'BURGUNDIANS',   // 布拉班特
    "gaolu": 'FRANKS',   // 法兰西
    "kaernute": 'FRANKS',   // 卡尔努特
    "yinggelan": 'BRITONS',   // 英格兰
    "piketai": 'CELTS',   // 皮克特
    "mangsite": 'CELTS',   // 芒斯特
    "tuomengde": 'CELTS',   // 托蒙德
    "bulietani": 'CELTS',   // 布列塔尼
    "saierweiya": 'SLAVIC',   // 塞尔维亚
    "luoma_diguo": 'ROMA',   // 罗马帝国
    "xiongren": 'HUNS',   // 匈人
    "awaer": 'HUNS',   // 阿瓦尔
    "putaoya": 'PORTUGUESE',   // 葡萄牙
    "habusibao": 'GERMANIC',   // 哈布斯堡
    "boximiya": 'BOHEMIANS',   // 波西米亚
    "yidali_wangguo": 'LATIN',   // 意大利王国
    "luxitaniya": 'PORTUGUESE',   // 卢西塔尼亚
    "tuoerkete": 'AMERICA',   // 托尔特克
    "yadian_gongguo": 'ATHENIANS',   // 雅典公国
    "mayapan": 'MAYANS',   // 玛雅潘
    "songhai": 'AFRICA',   // 桑海
    "shahi": 'PURU',   // 沙希
    "xisa": 'GURJARAS',   // 西萨特拉普
    "xilawangguo": 'GREECE',   // 希腊王国
    "ante": 'SLAVIC',   // 安特
    "suweihui": 'PORTUGUESE',   // 苏维汇（王国在加利西亚，409–585；对应封建时代苏维汇铁骑军团）
    "yibiluliya": 'GEORGIANS',   // 伊比利亚
    "yicha": 'MAYANS',   // 伊察
    "mengjiala": 'BENGALIS',   // 孟加拉
    "yili": 'THRACIAN',   // 伊利里亚
    "daqiya": 'THRACIAN',   // 达契亚
    "qiajia": 'PERSIAN',   // 恺加
    "arevaci": 'SPANISH',   // 阿雷瓦西
    "epirus_despotate": 'GREECE',   // 伊庇鲁斯专制国
    "teotihuacan": 'AMERICA',   // 特奥蒂瓦坎
    "salakanagara": 'MALAY',   // 萨拉卡那加拉
    "helvetii": 'FRANKS',   // 赫尔维蒂
    "hussites": 'BOHEMIANS',   // 胡斯派
    "cherusci": 'GERMANIC',   // 切鲁西
    "rashtrakuta": 'INDIA',   // 拉什特拉库塔
    "andean_rebellion": 'INCA',   // 安第斯起义军
    "abkhazia_kingdom": 'GEORGIANS',   // 阿布哈兹王国
    "mac_dynasty": 'VIETNAMESE',   // 莫氏
    "restored_hanthawaddy": 'BURMESE',   // 复兴汉达瓦底
    "bashkir": 'CENTRAL_ASIA',   // 巴什基尔
    "drevlians": 'SLAVIC',   // 德列夫利安人
    "marcomanni": 'BOHEMIANS',   // 马科曼尼（马罗博杜斯王国在波希米亚；对应古典时代马科曼尼军团）
    "serbia_revolution": 'SLAVIC',   // 塞尔维亚革命
    "caledonia": 'CELTS',   // 喀里多尼亚
    "goths_migration": 'GOTHS',   // 哥特人
    "syracuse": 'SICILIANS',   // 叙拉古
    "hamdanid": 'ORIE',   // 哈姆丹埃米尔国
    "wiman_joseon": 'KOREA',   // 卫满朝鲜
    "gusiluo": 'TIBET',   // 唃厮啰
    "old_saxons": 'SAXONS',   // 古撒克逊
    "alamanni": 'GERMANIC',   // 阿勒曼尼
    "taifa_toledo": 'BERBER',   // 托莱多泰法
    "florence": 'LATIN',   // 佛罗伦萨共和国
    "tuitonga": 'MALAY',   // 汤加帝国
    "rapanui": 'MALAY',   // 拉帕努伊
    "later_baekje": 'KOREA',   // 后百济
    "arverni": 'FRANKS',   // 阿维尔尼
    "imro": 'BULGARIANS',   // 内马其顿革命组织
    "bulgaria_third": 'BULGARIANS',   // 保加利亚公国
    "aksum": 'ETHIOPIANS',   // 阿克苏姆王国
    "milan_duchy": 'LATIN',   // 米兰公国
    "lombard_league": 'LATIN',   // 伦巴第联盟
    "cilicia_armenia": 'ARMENIANS',   // 奇里乞亚亚美尼亚
    "armenia_arsacid": 'ARMENIANS',   // 阿萨息斯亚美尼亚
    "syunik_bek": 'ARMENIANS',   // 休尼克
    "northumbria": 'BRITONS',   // 诺森布里亚
    "wessex": 'BRITONS',   // 威塞克斯
    "subroman_britain": 'CELTS',   // 后罗马不列颠
    "xinmeiliyan": 'CUMAN',   // 辛梅里安
    "aixini": 'BRITONS',   // 爱西尼
    "taluma": 'MALAY',   // 塔鲁玛迦拉
    "mazhaer": 'MAGYAR',   // 匈牙利
    "falanji": 'FRANKS',   // 法兰克
    "koln": 'GERMANIC',   // 科隆大主教区
    "shiwaben": 'GERMANIC',   // 施瓦本
    "asikanani": 'GERMANIC',   // 勃兰登堡藩侯国
    "wende": 'SAXONS',   // 萨克森
    "bafaliya": 'GERMANIC',   // 巴伐利亚
    "ruishi": 'GERMANIC',   // 瑞士
    "damolaweiya": 'BOHEMIANS',   // 摩拉维亚
    "luosi": [[830, 'VARANGIANS'], [1054, 'SLAVIC']],   // 罗斯（留里克至智者雅罗斯拉夫卒，军队核心为瓦良格亲兵；其后斯拉夫化）
    "eluosi_diguo": 'SLAVIC',   // 俄罗斯帝国
    "daniebo": 'SLAVIC',   // 斯摩棱斯克
    "qiernigeweifu_gongguo": 'SLAVIC',   // 切尔尼戈夫
    "jialixiya": 'SLAVIC',   // 加利西亚
    "pusikefu_gongheguo": 'VARANGIANS',   // 普斯科夫（西北罗斯共和国，1348 前属诺夫哥罗德领地；对应城堡时代诺夫哥罗德军团）
    "ouka": 'SLAVIC',   // 梁赞
    "xideweina": 'SLAVIC',   // 波洛茨克
    "jinzhang": 'CENTRAL_ASIA',   // 金帐
    "baojiaer": 'CUMAN',   // 保加尔
    "baizanting": 'BYZANTINE',   // 拜占庭
    "bosi_puluosi": 'BYZANTINE',   // 博斯普鲁斯（刻赤海峡博斯普鲁斯王国；对应古典时代博斯普鲁斯军团）
    "kelimiya": 'LATIN',   // 热那亚共和国
    "litaowan": 'LITHUANIANS',   // 立陶宛
    "bolan": 'POLES',   // 波兰
    "baojian_qishi": 'GERMANIC',   // 宝剑骑士团
    "teweier_gongguo": 'SLAVIC',   // 特维尔
    "suzidaer": 'SLAVIC',   // 苏兹达尔
    "gesake": 'CUMAN',   // 哥萨克（草原轻骑战法；对应帝国时代哥萨克军团）
    "moerdaweiya": 'SLAVIC',   // 摩尔达维亚
    "walajiyia": 'SLAVIC',   // 瓦拉几亚
    "tiaodun_qishi": 'GERMANIC',   // 条顿骑士团
    "yelusalengwg": 'FRANKS',   // 耶路撒冷王国
    "shengdian_qishi": 'FRANKS',   // 圣殿骑士团
    "maerta_qishi": 'LATIN',   // 圣约翰
    "danmai": 'DANES',   // 丹麦
    "xinbuli": 'DANES',   // 辛布里
    "ruidian_si": 'VIKINGS',   // 瑞典
    "kasidiliya": 'SPANISH',   // 卡斯蒂利亚
    "aboerleiya": 'SICILIANS',   // 阿尔博雷亚
    "teluoyi": 'TURKS',   // 特洛伊
    "peilieya_gongguo": 'SLAVIC',   // 佩列亚斯拉夫
    "heishui": 'NORTHEAST',   // 靺鞨
    "fuguo": 'TIBET',   // 附国
    "fushi": 'CENTRAL',   // 苻秦
    "yada": 'CENTRAL_ASIA',   // 嚈哒
    "guishuang": 'CENTRAL_ASIA',   // 贵霜
    "bailian": 'HUGUANG',   // 白莲
    "chimei": 'CENTRAL',   // 赤眉
    "shang": 'CENTRAL',   // 殷商
    "zhou": 'CENTRAL',   // 姬周
    "qi": 'CENTRAL',   // 齐国
    "jin": 'WEI',   // 晋国
    "wu": 'JIANGNAN',   // 吴国
    "yue": 'JIANGNAN',   // 越国
    "nanyue": 'HUGUANG',   // 南越
    "qin": 'CENTRAL',   // 秦国
    "song": [[960, 'CENTRAL'], [1127, 'JIANGNAN']],   // 赵宋
    "yan": 'WEI',   // 燕国
    "zhao": 'WEI',   // 赵国
    "douxia": 'WEI',   // 夏
    "wei": 'WEI',   // 魏国
    "caowei": 'WEI',   // 曹魏
    "han": 'CENTRAL',   // 韩国
    "han_d": 'CENTRAL',   // 刘汉
    "handong": 'WEI',   // 汉东
    "shu": 'BASHU',   // 蜀汉
    "juqu_d": 'HEXI',   // 沮渠凉国
    "tufa_d": 'XIANBEI',   // 秃发凉国
    "qiuchi": 'BASHU',   // 仇池
    "helian": 'XIANBEI',   // 赫连夏国
    "xiongnu": 'MONGOL',   // 匈奴
    "xianbei": 'XIANBEI',   // 鲜卑
    "tuoba": 'WEI',   // 拓跋魏
    "yuwen": 'CENTRAL',   // 宇文周
    "chen": 'JIANGNAN',   // 陈国
    "sui": 'CENTRAL',   // 隋国
    "tang": 'CENTRAL',   // 李唐
    "da_qin": 'CENTRAL',   // 大秦
    "min": 'HUGUANG',   // 闽国
    "shatuo": 'WEI',   // 沙陀
    "bohai": 'NORTHEAST',   // 渤海
    "dangxiang": 'HEXI',   // 大夏
    "menggu_d": 'MONGOL',   // 蒙古
    "manzhou_d": 'NORTHEAST',   // 大清
    "ming_d": 'WEI',   // 大明
    "jianwen": 'JIANGNAN',   // 建文
    "shunde": 'JIANGNAN',   // 顺德
    "liao_d": 'XIANBEI',   // 大辽
    "kong_d": 'CENTRAL',   // 鲁国
    "wusun": 'WESTERN',   // 乌孙
    "dayuan": 'WESTERN',   // 大宛
    "gouding": 'BASHU',   // 句町
    "wuhuan": 'XIANBEI',   // 乌桓
    "xianlingqiang": 'HEXI',   // 先零
    "yelang": 'BASHU',   // 夜郎
    "ailao": 'BASHU',   // 哀牢
    "fuyu": 'NORTHEAST',   // 夫余
    "shule": 'WESTERN',   // 疏勒
    "shache": 'WESTERN',   // 莎车
    "qiuci": 'WESTERN',   // 龟兹
    "yanqi": 'WESTERN',   // 焉耆
    "gaogouli": 'KOREA',   // 高句丽
    "xinluo": 'KOREA',   // 新罗
    "ashikaga": 'JAPAN',   // 室町
    "yamato": 'JAPAN',   // 大和
    "rouran": 'MONGOL',   // 柔然
    "baiji": 'KOREA',   // 百济
    "tubo": 'TIBET',   // 吐蕃
    "tujue": 'MONGOL',   // 突厥
    "dayue": 'VIETNAMESE',   // 大越
    "ryukyu": 'JAPAN',   // 琉球
    "so": 'JAPAN',   // 对马
    "goto": 'JAPAN',   // 五岛
    "omura": 'JAPAN',   // 大村
    "kakizaki": 'JAPAN',   // 松前
    "fujiwara": 'JAPAN',   // 奥州
    "genji": 'JAPAN',   // 源氏
    "genji_iyo": 'JAPAN',   // 伊予源氏
    "gaya": 'KOREA',   // 伽倻
    "chosokabe": 'JAPAN',   // 土佐
    "xingliao": 'NORTHEAST',   // 兴辽
    "gongsun_d": 'WEI',   // 辽东
    "luoyue": 'VIETNAMESE',   // 骆越
    "ba": 'BASHU',   // 巴国
    "qifu_d": 'XIANBEI',   // 乞伏秦国
    "murong": 'XIANBEI',   // 慕容燕
    "erzhu": 'WEI',   // 尔朱契胡
    "baibo": 'WEI',   // 黄巾
    "ouyue": 'JIANGNAN',   // 瓯越
    "gaoqi_d": 'WEI',   // 高齐
    "wuzhou_d": 'CENTRAL',   // 武周
    "xibo_d": 'NORTHEAST',   // 锡伯
    "ranwei_d": 'WEI',   // 冉魏
    "sunwu_d": 'JIANGNAN',   // 孙吴
    "linshihong": 'JIANGNAN',   // 干越
    "xijue": 'CENTRAL_ASIA',   // 十箭
    "xueyantuo": 'MONGOL',   // 薛延陀
    "tujishi": 'CENTRAL_ASIA',   // 突骑施
    "nanzhao": 'BASHU',   // 南诏
    "xiaobolu": 'TIBET',   // 勃律
    "dali": 'BASHU',   // 大理
    "luodian": 'BASHU',   // 罗甸
    "goryeo": 'KOREA',   // 高丽
    "nongzhigao": 'HUGUANG',   // 大南国
    "fangla": 'JIANGNAN',   // 圣公
    "yang_aner": 'CENTRAL',   // 天顺
    "huarazim": 'CENTRAL_ASIA',   // 花剌子模
    "pagan": 'BURMESE',   // 蒲甘
    "champa": 'KHMER',   // 占婆
    "dongxia": 'NORTHEAST',   // 东夏
    "chagatai": 'WESTERN',   // 车师
    "kereyid": 'MONGOL',   // 克烈
    "naiman": 'MONGOL',   // 乃蛮
    "tatar": 'MONGOL',   // 塔塔尔
    "ongut": 'XIANBEI',   // 汪古
    "xushouhui": 'HUGUANG',   // 天完
    "zhangshicheng": 'JIANGNAN',   // 大周
    "dixiang": 'CENTRAL',   // 新国
    "dengmaoqi": 'HUGUANG',   // 铲平
    "dada_ming": 'XIANBEI',   // 鞑靼
    "oirat_ming": 'MONGOL',   // 卫拉特
    "haixi_nvzhen": 'NORTHEAST',   // 海西
    "yeren_nvzhen": 'NORTHEAST',   // 萨哈连
    "jilimi": 'NORTHEAST',   // 吉里
    "luchuan": 'BURMESE',   // 麓川
    "xihai_d": 'TIBET',   // 吐谷浑
    "mari_ancient": 'ORIE',   // 马里王国
    "guiyi": 'HEXI',   // 归义
    "joseon": 'KOREA',   // 朝鲜
    "siam": 'KHMER',   // 暹罗
    "chenla": 'KHMER',   // 真腊
    "dashun": 'CENTRAL',   // 大顺
    "daxi_ming": 'BASHU',   // 大西
    "chenghan": 'BASHU',   // 成汉
    "longwu": 'HUGUANG',   // 隆武
    "lujian": 'JIANGNAN',   // 鲁监
    "khoshut": 'MONGOL',   // 和硕特
    "yarkand": 'WESTERN',   // 叶尔羌
    "khoja": 'WESTERN',   // 和卓
    "jinchuan_g": 'TIBET',   // 金川
    "shuntian": 'JIANGNAN',   // 顺天军
    "gurkha": 'TIBET',   // 廓喀
    "xiadun": 'TIBET',   // 夏顿
    "kazakh": 'CENTRAL_ASIA',   // 哈萨
    "kokand": 'CENTRAL_ASIA',   // 霍罕
    "badakhshan": 'CENTRAL_ASIA',   // 达克
    "taiping": 'JIANGNAN',   // 太平
    "dacheng": 'HUGUANG',   // 大成
    "tuoming": 'WESTERN',   // 清真
    "dajin": 'NORTHEAST',   // 大金
    "yuan_d": 'XIANBEI',   // 大元
    "yilou": 'NORTHEAST',   // 挹娄
    "wuji": 'NORTHEAST',   // 勿吉
    "shiwei": 'MONGOL',   // 室韦
    "kala": 'CENTRAL_ASIA',   // 喀喇汗国
    "jiazini": 'CENTRAL_ASIA',   // 伽色尼
    "fanyanna": 'CENTRAL_ASIA',   // 梵衍那
    "sogdian": 'CENTRAL_ASIA',   // 粟特
    "geluolu": 'CENTRAL_ASIA',   // 葛逻禄
    "yuchi": 'WESTERN',   // 尉迟于阗
    "an": 'CENTRAL_ASIA',   // 乌兹别克
    "shi_clan": 'CENTRAL_ASIA',   // 石氏
    "gaoche": 'MONGOL',   // 高车
    "hongirad": 'MONGOL',   // 弘吉剌
    "ladakh": 'TIBET',   // 玛域
    "tsangpa": 'TIBET',   // 藏巴汗
    "ganden": 'TIBET',   // 甘丹颇章
    "supi": 'TIBET',   // 苏毗
    "khon": 'TIBET',   // 萨迦昆
    "lang_clan": 'TIBET',   // 帕竹朗
    "karmapa": 'TIBET',   // 噶玛
    "ava": 'BURMESE',   // 阿瓦王国
    "dongxu": 'BURMESE',   // 东吁
    "meitai": 'BURMESE',   // 曼尼普尔
    "hantawadi": 'BURMESE',   // 汉达瓦底
    "pyu": 'BURMESE',   // 骠族
    "mon": 'BURMESE',   // 孟族
    "ming_zheng": 'JIANGNAN',   // 明郑
    "xiou": 'HUGUANG',   // 西瓯
    "paiwan": 'MALAY',   // 排湾
    "she_ethnic": 'JIANGNAN',   // 畲族
    "wuling": 'HUGUANG',   // 五溪
    "weili": 'WESTERN',   // 尉犁
    "pishan": 'WESTERN',   // 皮山
    "tuerhute": 'MONGOL',   // 土尔扈特
    "bandun": 'BASHU',   // 板楯
    "seljuq": 'CENTRAL_ASIA',   // 塞尔柱帝国
    "osman": 'TURKS',   // 奥斯曼帝国
    "cen_d": 'HUGUANG',   // 岑氏
    "shen": 'CENTRAL',   // 申国
    "shaodang": 'TIBET',   // 烧当
    "panyao": 'HUGUANG',   // 盘瑶
    "golog": 'TIBET',   // 果洛
    "tumed": 'XIANBEI',   // 土默特
    "saman": 'CENTRAL_ASIA',   // 萨曼
    "dai": 'BURMESE',   // 傣族
    "taiyuan": 'KHMER',   // 泰沅
    "luohu": 'KHMER',   // 罗斛
    "liren": 'HUGUANG',   // 俚族
    "gling": 'TIBET',   // 玉树二十五族
    "suolun": 'NORTHEAST',   // 达斡尔
    "gar_kham": 'TIBET',   // 德格土司
    "kongsa": 'TIBET',   // 孔萨土司
    "hor": 'TIBET',   // 霍尔三十九族
    "bailang": 'TIBET',   // 白狼
    "duolu": 'CENTRAL_ASIA',   // 咄陆
    "tiemuer": 'CENTRAL_ASIA',   // 帖木儿帝国
    "keerkezi": 'MONGOL',   // 柯尔克孜
    "yizhi": 'JAPAN',   // 一支
    "yiwu": 'WESTERN',   // 伊吾
    "duerbote": 'MONGOL',   // 杜尔伯特
    "kaerka": 'MONGOL',   // 喀尔喀
    "huihu": 'MONGOL',   // 回鹘
    "wuzhumuqin": 'XIANBEI',   // 乌珠穆沁
    "zhadalan": 'MONGOL',   // 扎答兰
    "zhuerqi": 'MONGOL',   // 主儿乞
    "qiufu": 'JIANGNAN',   // 剡中
    "chendiaoyan": 'HUGUANG',   // 畲汉
    "yezongliu": 'JIANGNAN',   // 处州
    "qianhui": 'HEXI',   // 回民
    "miaomin": 'HUGUANG',   // 苗民
    "zhongxiang": 'HUGUANG',   // 鼎州
    "yang_bozhou": 'BASHU',   // 播州杨氏
    "she": 'BASHU',   // 奢安
    "tan_d": 'HUGUANG',   // 土家
    "wumeng": 'BASHU',   // 越州蛮
    "boren": 'BASHU',   // 都掌蛮
    "sou": 'BASHU',   // 越嶲夷
    "qiong": 'BASHU',   // 邛谷
    "dongzu": 'BASHU',   // 侗族
    "shengmiao": 'BASHU',   // 生苗
    "buyi_d": 'BASHU',   // 布依
    "shuizu": 'BASHU',   // 水族
    "haikou": 'JAPAN',   // 海贼倭寇
    "liuzhen": 'WEI',   // 六镇
    "you": 'WEI',   // 幽州
    "yumi": 'WESTERN',   // 扜弥
    "xiye": 'WESTERN',   // 西夜
    "galangdiba": 'TIBET',   // 波密土司
    "cuanshi": 'BASHU',   // 爨族
    "dianguo": 'BASHU',   // 滇国
    "danluo": 'KOREA',   // 耽罗
    "hui": 'KOREA',   // 濊族
    "wure": 'NORTHEAST',   // 兀惹
    "sunite": 'XIANBEI',   // 苏尼特
    "weiwuer": 'WESTERN',   // 维吾尔
    "wensu": 'WESTERN',   // 温宿
    "keerqin": 'XIANBEI',   // 科尔沁
    "xiangxiong": 'TIBET',   // 象雄
    "zhaowu": 'CENTRAL_ASIA',   // 昭武
    "ruoqiang": 'WESTERN',   // 婼羌
    "qiemo": 'WESTERN',   // 且末
    "weitou": 'WESTERN',   // 尉头
    "qiepantuo": 'WESTERN',   // 护密
    "eluoke": 'NORTHEAST',   // 鄂罗克
    "ewenki": 'NORTHEAST',   // 鄂温克
    "buriat": 'MONGOL',   // 布里亚特
    "iga_d": 'JAPAN',   // 伊贺
    "kaga_d": 'JAPAN',   // 一向宗
    "date_d": 'JAPAN',   // 伊达家
    "otomo_d": 'JAPAN',   // 大友家
    "suwa_d": 'JAPAN',   // 诹访家
    "yanda": 'CENTRAL_ASIA',   // 阿尔洪
    "konbaung": 'BURMESE',   // 贡榜
    "tianxiong": 'WEI',   // 魏博
    "huaixi": 'CENTRAL',   // 淮西
    "gengshi": 'CENTRAL',   // 更始
    "shierShijun": 'VIETNAMESE',   // 十二使君
    "xishan": 'VIETNAMESE',   // 西山
    "malla": 'TIBET',   // 马拉王国
    "mihran": 'SASANIAN',   // 米赫兰
    "xiwasi": 'TURKS',   // 埃雷特纳
    "mengguqieke": 'TURKS',   // 门古切克
    "sumuroyi": 'MALAY',   // 米沙鄢人
    "yun": 'HEXI',   // 允戎
    "huangwang": 'CENTRAL',   // 大齐
    "yehe": 'NORTHEAST',   // 叶赫
    "wula": 'NORTHEAST',   // 乌拉
    "bayegu": 'MONGOL',   // 拔野古
    "ketagalan": 'MALAY',   // 凯达格兰
    "suke": 'KHMER',   // 素可泰
    "gaochang": 'WESTERN',   // 麴氏高昌
    "chuyue": 'CENTRAL_ASIA',   // 处月
    "baidi": 'XIANBEI',   // 白狄
    "huite": 'MONGOL',   // 辉特
    "zubu": 'MONGOL',   // 阻卜
    "xisi": 'PERSIAN',   // 萨法尔
    "dulan_d": 'PERSIAN',   // 杜兰尼
    "huluo": 'PERSIAN',   // 古尔
    "xierhe": 'CENTRAL_ASIA',   // 乌古斯叶护国
    "yangguan": 'HEXI',   // 西凉
    "xiliangjun": 'HEXI',   // 西凉军
    "kepantuo": 'WESTERN',   // 渴盘陀
    "kumoxi": 'XIANBEI',   // 库莫奚
    "shanshan": 'WESTERN',   // 鄯善
    "wuyue": 'JIANGNAN',   // 吴越
    "minyue": 'HUGUANG',   // 闽越
    "funan": 'KHMER',   // 扶南
    "lancang": 'KHMER',   // 澜沧
    "ahaomu": 'BENGALIS',   // 阿豪姆
    "elunchunzu": 'NORTHEAST',   // 鄂伦春
    "tajikezu": 'CENTRAL_ASIA',   // 塔吉克
    "jingpozu": 'BURMESE',   // 景颇
    "xingwei": 'BURMESE',   // 兴威
    "saerbadaer": 'SASANIAN',   // 萨尔巴达尔
    "yilihanguo_d": 'SASANIAN',   // 伊利汗国
    "wulaertu": 'ARMENIANS',   // 亚美尼亚
    "wulaertu_guo": 'ARMENIANS',   // 乌拉尔图
    "gelujiya": 'GEORGIANS',   // 格鲁吉亚
    "bendou": 'BYZANTINE',   // 特拉布宗
    "saipulusi": 'FRANKS',   // 塞浦路斯
    "bendou_d": 'GREECE',   // 本都
    "heti": 'TURKS',   // 赫梯
    "fulijiya": 'TURKS',   // 弗里吉亚
    "ldiya": 'TURKS',   // 吕底亚
    "pajiama": 'GREECE',   // 帕加马
    "luomu": 'TURKS',   // 罗姆
    "yinduxila": 'MACEDONIAN',   // 印度希腊王国
    "asakaini": 'PURU',   // 阿萨凯尼
    "sailiugu": 'MACEDONIAN',   // 塞琉古帝国
    "womaya": 'ORIE',   // 倭马亚
    "xibolai": 'ORIE',   // 以色列
    "aiji": 'ORIE',   // 埃及
    "tuolemi": 'MACEDONIAN',   // 托勒密
    "jialedi": 'ORIE',   // 迦勒底
    "paermila": 'ORIE',   // 帕尔米拉
    "abasi": 'ORIE',   // 阿拔斯哈里发国
    "xikesuosi": 'ORIE',   // 喜克索斯
    "yashu": 'ORIE',   // 亚述
    "midi": 'PERSIAN',   // 米底
    "aqimeinide": 'PERSIAN',   // 阿契美尼德
    "sashan": 'SASANIAN',   // 萨珊
    "ailan": 'PERSIAN',   // 埃兰
    "safawei_d": 'SASANIAN',   // 萨法维
    "sumeier": 'ORIE',   // 乌鲁克
    "ayoubu": 'ORIE',   // 阿尤布
    "mamuluke": 'ORIE',   // 马穆鲁克
    "aosiruowen": 'ORIE',   // 奥斯若恩
    "kesa": 'CUMAN',   // 可萨
    "aiaoniya": 'GREECE',   // 爱奥尼亚
    "jialatai": 'FRANKS',   // 加拉太
    "ansxi": 'SASANIAN',   // 安息帝国
    "nabatai": 'ORIE',   // 纳巴泰王国
    "xike": 'PURU',   // 锡克帝国
    "deli": 'MUGHAL',   // 德里苏丹国
    "sur": 'MUGHAL',   // 苏尔帝国
    "mowoer": 'MUGHAL',   // 莫卧儿帝国
    "jieri": 'MUGHAL',   // 戒日帝国
    "kongque": 'MUGHAL',   // 孔雀帝国
    "mojietuo": 'MUGHAL',   // 摩揭陀王国
    "boluo": 'BENGALIS',   // 波罗帝国
    "dedan": 'ORIE',   // 德丹王国
    "maidina": 'ORIE',   // 拉希顿
    "gulaishi": 'ORIE',   // 古莱什部落
    "jiashi_d": 'MUGHAL',   // 迦尸国
    "xiemian": 'CUMAN',   // 萨维尔
    "salai": 'CENTRAL_ASIA',   // 诺盖汗国
    "aztec": 'AMERICA',   // 阿兹特克
    "taino_d": 'TUPI',   // 泰诺
    "guanche": 'BERBER',   // 关切人
    "chamorro": 'MALAY',   // 查莫罗
    "inca": 'INCA',   // 印加
    "maya": 'MAYANS',   // 玛雅
    "mapuche": 'MAPUCHE',   // 马普切
    "muisca": 'MUISCA',   // 穆伊斯卡
    "tupi": 'TUPI',   // 图皮
    "yiluokui": 'AMERICA',   // 易洛魁联盟
    "qimu": 'INCA',   // 奇穆
    "talasike": 'AMERICA',   // 塔拉斯科
    "tailuona": 'MUISCA',   // 泰罗纳
    "teweierqie": 'MAPUCHE',   // 特维尔切
    "manzheboyi": 'MALAY',   // 满者伯夷
    "zhelouqi": 'GURJARAS',   // 乔汉
    "suosuo": 'AFRICA',   // 索索
    "ghana_diguo": 'AFRICA',   // 加纳帝国
    "antiaokegongguo": 'ORIE',   // 赞吉
    "saimien": 'ETHIOPIANS',   // 塞米恩
    "kaliya": 'GREECE',   // 卡里亚
    "adiyabeina": 'ORIE',   // 阿迪亚贝纳
    "tamoyue": 'TUPI',   // 塔莫约
    "bogendigongguo": 'BURGUNDIANS',   // 勃艮第公国
    "bogendi_wangguo": 'BURGUNDIANS',   // 勃艮第王国
    "amaniyake": 'FRANKS',   // 阿马尼亚克
    "weiershigongguo": 'CELTS',   // 威尔士公国
    "taimier": 'INDIA',   // 马拉塔
    "xibanya": 'SPANISH',   // 西班牙
    "manding": 'AFRICA',   // 马里
    "ethiopia": 'ETHIOPIANS',   // 埃塞俄比亚
    "zhagewei": 'ETHIOPIANS',   // 扎格维
    "adal": 'ORIE',   // 阿达尔
    "malacca": 'MALAY',   // 满剌加
    "sanfoqi": 'MALAY',   // 三佛齐
    "medang": 'MALAY',   // 马打蓝
    "ternate": 'MALAY',   // 特尔纳特
    "sulu": 'MALAY',   // 苏禄苏丹国
    "gurjara": 'GURJARAS',   // 瞿折罗
    "suomunate": 'GURJARAS',   // 索兰基
    "zhuluo": 'INDIA',   // 朱罗
    "sengjialuo": 'INDIA',   // 僧伽罗
    "pandiya": 'INDIA',   // 潘地亚
    "kushi": 'ETHIOPIANS',   // 库施
    "aolisha": 'INDIA',   // 东恒伽
    "kanata": 'INDIA',   // 维查耶纳伽尔
    "adile": 'MUGHAL',   // 比贾普尔
    "yilisi": 'GREECE',   // 埃利斯
    "nuowei": 'VIKINGS',   // 挪威
    "keernuwaye": 'CELTS',   // 康沃尔
    "wuer": 'ORIE',   // 新苏美尔
    "jienei": 'AFRICA',   // 杰内
    "muwaxide": 'BERBER',   // 穆瓦希德
    "yilaka": 'MUISCA',   // 伊拉卡
    "gualani": 'TUPI',   // 瓜拉尼
    "bulu": 'PURU',   // 波罗婆
    "mallabhum": 'BENGALIS',   // 末罗王国
    "vidin_tsardom": 'BULGARIANS',   // 维丁国
    "samtskhe": 'GEORGIANS',   // 萨姆茨赫
    "tomara_gwalior": 'MUGHAL',   // 托摩罗
    "kanan": 'ORIE',   // 推罗
    "feilisidin": 'ORIE',   // 非利士
    "qutb_shahi": 'MUGHAL',   // 戈尔康达
    "minangkabau": 'MALAY',   // 米南加保
    "tutul_xiu": 'MAYANS',   // 休族
    "sijitai": 'CUMAN',   // 斯基泰
    "aswaka": 'PURU',   // 阿斯瓦卡
    "malli": 'PURU',   // 马利
    "dasaleiti": 'THRACIAN',   // 达萨雷提
    "kapaduoxiya": 'TURKS',   // 卡帕多细亚
    "aolitai": 'PURU',   // 奥里泰
    "kuman_oleshky": 'CUMAN',   // 库曼
    "dalriada": 'CELTS',   // 达尔里阿达
    "dublin": 'VIKINGS',   // 都柏林王国
    "scotland": 'CELTS',   // 苏格兰
    "chanka": 'INCA',   // 昌卡
    "ouchi": 'JAPAN',   // 大内
    "cueva": 'MUISCA',   // 库埃瓦
    "maynila": 'MALAY',   // 马尼拉土邦
    "gujarat": 'GURJARAS',   // 古吉拉特苏丹国
    "arakan": 'BURMESE',   // 阿拉干
    "wandan": 'MALAY',   // 万丹
    "kosala": 'MUGHAL',   // 拘萨罗
    "kalinga": 'INDIA',   // 羯陵伽
    "anga": 'MUGHAL',   // 鸯伽
    "shunga": 'MUGHAL',   // 巽伽
    "antigonid": 'MACEDONIAN',   // 安提柯
    "hou_han": 'WEI',   // 后汉
    "yuan_shao": 'WEI',   // 冀州
    "hou_jin": 'WEI',   // 石晋
    "hou_zhao": 'WEI',   // 石赵
    "da_yan": 'WEI',   // 大燕
    "hou_liang": 'CENTRAL',   // 朱梁
    "han_zhao": 'WEI',   // 汉赵
    "dongjin": 'JIANGNAN',   // 司马晋
    "nan_liang": 'JIANGNAN',   // 萧梁
    "hou_qin": 'CENTRAL',   // 姚秦
    "yiqu": 'HEXI',   // 义渠
    "hou_zhou": 'CENTRAL',   // 郭周
    "lvbu": 'CENTRAL',   // 徐州
    "chengjia": 'BASHU',   // 成家
    "qianshu": 'BASHU',   // 王蜀
    "chuguo": 'HUGUANG',   // 楚国
    "liusong": 'JIANGNAN',   // 刘宋
    "nanqi": 'JIANGNAN',   // 萧齐
    "yangwu": 'JIANGNAN',   // 杨吴
    "nantang": 'JIANGNAN',   // 南唐
    "machu": 'HUGUANG',   // 马楚
    "nanhan": 'HUGUANG',   // 南汉
    "fangguozhen": 'JIANGNAN',   // 浙东
    "liang_shuofang": 'HUGUANG',   // 鸣凤
    "liangshidu": 'XIANBEI',   // 永隆
    "qianliang": 'HEXI',   // 前凉
    "liangzhou": 'HEXI',   // 凉州
    "dangchang_guo": 'TIBET',   // 宕昌
    "sanada": 'JAPAN',   // 真田家
    "tokugawa": 'JAPAN',   // 德川家
    "amago": 'JAPAN',   // 尼子
    "shimazu": 'JAPAN',   // 岛津家
    "mori": 'JAPAN',   // 毛利家
    "uesugi": 'JAPAN',   // 上杉家
    "takeda": 'JAPAN',   // 武田家
    "toyotomi": 'JAPAN',   // 丰臣家
    "utsunomiya": 'JAPAN',   // 宇都宫家
    "nanchou": 'JAPAN',   // 大觉寺统
    "nanbu_shi": 'JAPAN',   // 南部家
    "shoni": 'JAPAN',   // 少弐
    "heishi": 'JAPAN',   // 平氏
    "imagawa": 'JAPAN',   // 今川家
    "oda": 'JAPAN',   // 织田家
    "hojo": 'JAPAN',   // 北条家
    "mahan": 'KOREA',   // 马韩
    "daquyue": 'VIETNAMESE',   // 大瞿越
    "yuenan": 'VIETNAMESE',   // 越南
    "jiaohuangguo": 'ROMA',   // 教皇国
    "yalan": 'ORIE',   // 亚兰
    "yaqi": 'MALAY',   // 亚齐苏丹国
    "zhamolin": 'INDIA',   // 卡利卡特
    "lugii": 'POLES',   // 卢吉联盟
    "wu_han": 'JIANGNAN',   // 刘吴
    "qi_zhangbu": 'CENTRAL',   // 张齐
    "wangdaer": 'GOTHS',   // 汪达尔王国
    "kesaiya": 'PERSIAN',   // 科塞亚
    "muxikani": 'PURU',   // 穆西卡尼
    "houmojietuo": 'MUGHAL',   // 后摩揭陀
    "sumo": 'BENGALIS',   // 苏摩国
    "gushu": 'BASHU',   // 古蜀
    "gaoda": 'BENGALIS',   // 高达王国
    "kelite_amier": 'ORIE',   // 克里特埃米尔国
    "kelimiya_han": 'CENTRAL_ASIA',   // 克里米亚汗国
    "guzigan": 'SASANIAN',   // 古兹甘
    "bahemani": 'MUGHAL',   // 巴赫曼尼苏丹国
    "halapengcai": 'BURMESE',   // 哈利奔猜王国
    "dongchahatai": 'WESTERN',   // 东察合台汗国
    "buhala": 'CENTRAL_ASIA',   // 布哈拉埃米尔国
    "biluzhi": 'PERSIAN',   // 俾路支
    "bonape": 'MALAY',   // 波纳佩
    "xiaweiyi": 'MALAY',   // 夏威夷王国
    "yidali_hre": 'LATIN',   // 比安德拉泰伯国
    "buliedian": 'BRITONS',
    "zhao_han": 'WEI',
    "dai_chenxi": 'WEI',
    "yan_luwan": 'WEI',
    "huainan": 'JIANGNAN',
    "lvlin": 'HUGUANG',
    "tongma": 'WEI',
    "wanglang_han": 'WEI',
    "liuyong_liang": 'CENTRAL',
    "yan_pengchong": 'WEI',
    "shuoning": 'CENTRAL',
    "zhangfeng_jun": 'WEI',
    "dou_hexi": 'CENTRAL',
    "canlang_qiang": 'TIBET',
    "zhong_qiang": 'TIBET',
    "qiedong_qiang": 'TIBET',
    "xianlian_qiang": 'TIBET',
    "baima_di": 'TIBET',
    "zhongjia": 'CENTRAL',
    "guanzhong_jun": 'WEI',
    "hanning": 'BASHU',
    "qiwanyian_jun": 'TIBET',
    "zhaowang_lun": 'CENTRAL',
    "chengdu_ying": 'CENTRAL',
    "hejian_yong": 'CENTRAL',
    "jinzhun_jun": 'CENTRAL',
    "fanya_jun": 'CENTRAL',
    "shilang_jun": 'XIANBEI',
    "murong_ren": 'XIANBEI',
    "duanqi": 'XIANBEI',
    "fuliu_jun": 'TIBET',
    "hou_liang_lv": 'TIBET',
    "zhaiwei": 'CENTRAL',
    "sunen_jun": 'JIANGNAN',
    "qiaoshu": 'BASHU',
    "beiyan": 'XIANBEI',
    "gaiwu_jun": 'XIANBEI',
    "xiangzhou_jun": 'XIANBEI',
    "bingzhou_jun": 'CENTRAL',
    "yangxuangan_jun": 'CENTRAL',
    "wagang": 'CENTRAL',
    "xue_qin": 'CENTRAL',
    "yuwen_xu": 'CENTRAL',
    "wang_zheng": 'CENTRAL',
    "dingyang": 'CENTRAL',
    "fusong": 'JIANGNAN',
    "qidan_tang": 'XIANBEI',
    "lihuaiguang_jun": 'CENTRAL',
    "ziqing": 'CENTRAL',
    "chengde": 'WEI',
    "henghai": 'WEI',
    "zhao_yi": 'WEI',
    "wujie_huihu": 'TURKS',
    "luomen_tubo": 'TIBET',
    "lulong": 'WEI',
    "jieyan": 'WEI',
    "yichang": 'WEI',
    "pinglu_wang": 'CENTRAL',
    "qi_li": 'CENTRAL',
    "hou_tang": 'XIANBEI',
    "yiwu_jun": 'WEI',
    "hou_shu": 'BASHU',
    "lishouzhen_jun": 'CENTRAL',
    "wuping": 'HUGUANG',
    "xingguo_jun": 'BASHU',
    "liugubu": 'TIBET',
    "songjiang_jun": 'CENTRAL',
    "liu_qi": 'CENTRAL',
    "helin_hanting": 'MONGOL',
    "ogedei": 'MONGOL',
    "dongdao_zongwang": 'MONGOL',
    "shangdu_jun": 'XIANBEI',
    "hansong": 'CENTRAL',
    "xuzhou_hongjin": 'CENTRAL',
    "dayu_ho": 'VIETNAMESE',
    "yongxiebu": 'XIANBEI',
    "asai": 'JAPAN',
    "akechi": 'JAPAN',
    "bobai_jun": 'MONGOL',
    "nikan_wailan": 'NORTHEAST',
    "numidia": 'BERBER',
    "vaccaei": 'CELTS',
    "pompeians": 'ROMA',
    "antonians": 'ROMA',
    "liberators": 'ROMA',
    "atropatene": 'PERSIAN',
    "bastarnae": 'GOTHS',
    "aquitani": 'CELTS',
    "camunni": 'CELTS',
    "cantabri": 'CELTS',
    "sicambri": 'GERMANIC',
    "raeti": 'CELTS',
    "pannonii": 'MACEDONIAN',
    "hatra": 'ORIE',
    "juthungi": 'GERMANIC',
    "vandali_tribes": 'GOTHS',
    "salian_franks": 'FRANKS',
    "ricimer_jun": 'ROMA',
    "alans": 'HUNS',
    "soissons": 'ROMA',
    "tirmidh_musa": 'PERSIAN',
    "bukhara_sogd": 'CENTRAL_ASIA',
    "shuman_guo": 'CENTRAL_ASIA',
    "fergana_aleda": 'CENTRAL_ASIA',
    "friuli": 'LATIN',
    "veleti": 'SLAVIC',
    "bohemia_duchy": 'BOHEMIANS',
    "paulicians": 'ARMENIANS',
    "malatya": 'ORIE',
    "east_anglia": 'BRITONS',
    "fatimids": 'ORIE',
    "zirids": 'BERBER',
    "kakuyids": 'PERSIAN',
    "basasiri_jun": 'TURKS',
    "yinaer_jun": 'TURKS',
    "normandy": 'FRANKS',
    "brionne": 'FRANKS',
    "gwynedd": 'CELTS',
    "antioch_principality": 'FRANKS',
    "nizari": 'PERSIAN',
    "jacquerie": 'FRANKS',
    "liege": 'BURGUNDIANS',
    "lezhe": 'GREECE',
    "bactria": 'MACEDONIAN',
    "dayueshi": 'CENTRAL_ASIA',
    "kangju": 'CENTRAL_ASIA',
    "aitolia": 'GREECE',
    "achaea": 'GREECE',
    "emesa": 'ORIE',
    "tbilisi_emirate": 'ORIE',
    "hafsids": 'BERBER',
    "lorraine": 'FRANKS',
    "nan_xiongnu": 'MONGOL',
    "yudan_xiongnu": 'MONGOL',
    "shifa_rouran": 'MONGOL',
    "maoyi": 'MALAY',
};

/** 势力在某年的文化；年份未知取第一段 */
export function getFactionCultureAt(factionId: string, year: number | null | undefined): BuildingStyle | undefined {
    const v = FACTION_CULTURE[factionId];
    if (!v || typeof v === 'string') return v as BuildingStyle | undefined;
    let hit = v[0]?.[1];
    if (year != null) for (const [from, c] of v) if (year >= from) hit = c;
    return hit;
}
