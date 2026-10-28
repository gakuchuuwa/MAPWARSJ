/**
 * 势力时代表（factionId → 年份段 → 四时代）。
 *
 * 🔴 2026-10-25 主人令：「武将有生卒登场年，势力有时代」「按史分年段」「这样能保证一个势力的人，都是一个军团」。
 *    · 时代归**势力**：一个势力在其同一段里只有一个时代 → 全势力的人走同一格（时代 × 据点文化）＝一支军团。
 *    · 时段只给「历史上确实换过军制」的政权（拜占庭军区→普罗尼亚、基辅罗斯→莫斯科、加齐突骑→苏丹亲兵…）；
 *      一朝一军的势力（宋＝宋军、大明＝明军、西夏＝铁鹞子、高丽＝三别班、辽＝皮室）整段只有一个时代。
 *    · 武将落在哪一段：取该将**首战年（最知名那一战）**，无首战年取登场年（生年+20，不晚于卒年）；两者皆无 → 保留 GeneralEra 原值。
 *    · 段界依据见各条注释（"按史 + 依据"）；未手裁的势力按该势力现存名将的成名年推定，只约束新增武将，不改现有武将。
 *    · 势力误挂的个别武将（战场人物/错挂政权）
 *
 * 改后武将的军团仍由 getLegionNameOfGeneral 按「时代 × 据点文化」自动取；唯一入口 getGeneralEra()。
 * 校验：scratch/_probe_faction_era_changes.mts（逐将打印旧→新时代，须全为修对）。
 *
 * 🔴 [2026-10-25 主人令]「应该给游戏中每一个势力挂一个时代」「包括以后要新增的势力，也要有」：
 *   · 四时代年段（全局定义）：古典＝起始–476｜封建＝476–1050｜城堡＝1050–1500｜帝国＝1500–1914。
 *   · **每个正规势力必须在本表登记时代**：默认一家一个时代；真换过军制的长命政权可按军制史分段（段界不按全球年段硬切）。
 *   · `panshu`（叛军）是游戏机制里的特殊势力（无字旗、不能出征、只兜底「没有武将的据点」），**不挂时代**；
 *     `panjun`（起义占位势力）已于 2026-10-25 按主人令删除——起义首领各自是独立势力，不再有「起义」占位势力。
 *   · 新增势力必须同批在本表登记时代；验收 `scratch/audit_faction_era.mts` 与 batch-manager「运行校验」的「缺势力时代」。
 */
import { GENERAL_ERA, type GeneralEra } from './GeneralEra';
import { FACTION_GENERALS } from './FactionGenerals';
import { GENERAL_FIRST_BATTLES } from './GeneralFirstBattles';
import { getGeneralDebutYear } from './GeneralLifeYears';

export interface FactionEraSegment {
    /** 起始年（含）；-9999 表示该势力最早一段 */
    from: number;
    era: GeneralEra;
}

export const FACTION_ERA: Readonly<Record<string, readonly FactionEraSegment[]>> = {
    // ══════ 一、手裁：整段一个时代 / 长命政权按史分年段 ══════
    'jiaohuangguo': [{ from: 756, era: 'castle' }, { from: 1500, era: 'imperial' }], // 教皇国｜756 丕平献土—1500＝城堡时代罗马教廷军团；1500 后＝帝国时代意大利军团
    'yalan': [{ from: -9999, era: 'antiquity' }], // 亚兰（大马士革王国）｜前 10 世纪–前 732＝古典时代近东军团
    // 🔴 [2026-10-25 补齐·主人令「每个势力都要有时代」] 这三家只有据点、没有武将，此前漏登记：
    'aodesuosi': [{ from: -9999, era: 'antiquity' }], // 奥德索斯｜瓦尔纳旧称，希腊殖民城邦（前 6 世纪起）＝古典；势指针＝古典时代色雷斯军团
    'jienei': [{ from: -9999, era: 'feudal' }], // 杰内｜加纳—马里商路商城（8–13 世纪，加纳帝国期入封建段）；势指针＝封建时代加纳军团
    'ghana_diguo': [{ from: -9999, era: 'feudal' }], // 加纳帝国｜瓦加杜加纳（约 300–1200，8–11 世纪盛期，通卡·马宁）；势指针＝封建时代加纳军团
    'cueva': [{ from: -9999, era: 'imperial' }], // 库埃瓦｜巴拿马科马格雷酋邦（1510 巴尔沃亚到访）＝帝国段；势指针＝帝国时代格查武士军团
    'song': [{ from: -9999, era: 'castle' }], // 宋国｜宋（960–1279）＝城堡时代中华军团（神臂弓/步人甲/斩马刀），北宋南宋同一支宋军
    'ming_d': [{ from: -9999, era: 'imperial' }], // 大明｜大明（1368–1644）＝帝国时代中国军团（京营/神机/三眼铳），明初明末同为明军
    'dangxiang': [{ from: -9999, era: 'castle' }], // 大夏｜大夏·西夏（982–1227）＝城堡时代大夏军团（铁鹞子冷锻重甲/山讹）
    'goryeo': [{ from: -9999, era: 'castle' }], // 高丽｜高丽（918–1392）＝城堡时代高丽军团（三别抄/别武班）
    'liao_d': [{ from: -9999, era: 'feudal' }], // 大辽｜大辽（907–1125）＝封建时代契丹军团（皮室具装铁骑/铁林军）
    'manzhou_d': [{ from: -9999, era: 'imperial' }], // 大清｜大清（1616–1912，含建州女真）＝帝国时代八旗军团
    'xixiliwangguo': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'castle' }], // 西西里｜古典＝叙拉古城邦（阿加索克利）；476 后＝城堡时代诺曼军团
    'abasi': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }], // 阿拔斯｜阿拔斯（750–1258）：封建＝哈里发军团（四大哈里发—阿拔斯黄金时代）；1050 塞尔柱入主巴格达 → 城堡时代撒拉森军团
    'womaya': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }], // 倭马亚｜倭马亚（661–1031）：封建＝哈里发军团；1050 后泰法/穆拉比特 → 城堡时代撒拉森军团
    'sashan': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }], // 萨珊｜萨珊（224–476）：古典时代萨珊军团；476 后（卑路斯一世起）→ 封建时代霍拉桑军团
    'baizanting': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }, { from: 1071, era: 'castle' }], // 拜占庭｜东罗马早期（–476）＝古典时代拜占庭军团；军区制（476–1071）＝封建时代拜占庭军区军团；1071 曼齐克特后普罗尼亚制 → 城堡时代拜占庭军团
    'luoma_diguo': [{ from: -9999, era: 'antiquity' }], // 罗马帝国｜罗马帝国（–476）＝古典时代罗马军团
    'aqimeinide': [{ from: -9999, era: 'antiquity' }], // 阿契美尼德｜阿契美尼德（前550–前330）＝古典时代阿契美尼德军团
    'seljuq': [{ from: -9999, era: 'castle' }], // 塞尔柱｜塞尔柱（1037–1194）＝城堡时代加齐突骑军团（桑贾尔）
    'luosi': [{ from: -9999, era: 'feudal' }, { from: 1240, era: 'castle' }, { from: 1500, era: 'imperial' }], // 罗斯｜基辅罗斯（862–1240）＝封建时代基辅罗斯军团；1240 蒙古西征后（诺夫哥罗德/莫斯科）→ 城堡时代博亚尔重骑军团；1500 后莫斯科沙皇国 → 帝国时代俄罗斯军团
    'osman': [{ from: -9999, era: 'castle' }, { from: 1453, era: 'imperial' }], // 奥斯曼｜奥斯曼（1299–1453）＝城堡时代加齐突骑军团；1453 攻陷君士坦丁堡 → 帝国时代苏丹亲兵军团
    'bolan': [{ from: -9999, era: 'feudal' }, { from: 1138, era: 'castle' }, { from: 1569, era: 'imperial' }], // 波兰｜皮雅斯特早期（–1138）＝封建时代波兰尼军团；1138 分裂后—1569 → 城堡时代波兰王国军团；1569 卢布林联合 → 帝国时代波兰立陶宛军团
    'mazhaer': [{ from: -9999, era: 'feudal' }, { from: 1000, era: 'castle' }, { from: 1526, era: 'imperial' }], // 匈牙利｜阿尔帕德（–1000）＝封建时代马扎尔骑射军团；1000 圣斯蒂芬受洗—1526 → 城堡时代匈牙利王国军团；1526 莫哈奇之战后 → 帝国时代匈牙利军团
    'yinggelan': [{ from: -9999, era: 'feudal' }, { from: 1066, era: 'castle' }, { from: 1485, era: 'imperial' }], // 英格兰｜盎格鲁-撒克逊（–1066）＝封建时代盎格鲁撒克逊军团；1066 诺曼征服—1485 → 城堡时代英格兰军团；1485 都铎 → 帝国时代英格兰军团
    'falanji': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }, { from: 1100, era: 'castle' }], // 法兰克｜晚期古典（–476）＝古典军团；墨洛温—加洛林（476–1100）＝封建时代法兰克军团；1100 后卡佩骑士 → 城堡时代法兰西骑士军团
    'gaolu': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'castle' }, { from: 1500, era: 'imperial' }], // 法兰西（别名高卢）｜古典＝高卢战团（维钦托利）；476–1500＝城堡时代法兰西骑士军团；1500 后＝帝国法兰西军团
    'menggu_d': [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }], // 蒙古｜蒙古（含 10 世纪孛端察儿—元—北元）＝城堡时代漠南蒙古军团；1500 后（达延汗—喀尔喀/卫拉特）→ 帝国时代漠南蒙古军团
    // ══════ 二、单时代势力（整段一个时代）══════
    'kilwa': [{ from: -9999, era: 'castle' }], // 基尔瓦苏丹国｜斯瓦希里海岸（约 957–1513），苏莱曼·本·哈桑
    'mogadishu': [{ from: -9999, era: 'castle' }], // 摩加迪沙苏丹国｜索马里城邦（10–16 世纪），阿布·伯克尔
    'zuraid': [{ from: -9999, era: 'castle' }], // 祖拉伊德｜亚丁王朝（1083–1174），亚西尔·本·比拉勒
    'aboerleiya': [{ from: -9999, era: 'castle' }], // 阿尔博雷亚
    'adal': [{ from: -9999, era: 'imperial' }], // 阿达尔
    'adao_d': [{ from: -9999, era: 'imperial' }], // 阿克苏道
    'adile': [{ from: -9999, era: 'imperial' }], // 阿迪勒
    'adiyabeina': [{ from: -9999, era: 'antiquity' }], // 阿迪亚贝纳
    'aertai': [{ from: -9999, era: 'castle' }], // 阿尔泰
    'aguelabu': [{ from: -9999, era: 'feudal' }], // 阿格拉布
    'ahaomu': [{ from: -9999, era: 'imperial' }], // 阿豪姆
    'aiaoniya': [{ from: -9999, era: 'antiquity' }], // 爱奥尼亚
    'aiji': [{ from: -9999, era: 'antiquity' }], // 埃及
    'ailan': [{ from: -9999, era: 'antiquity' }], // 埃兰
    'ailao': [{ from: -9999, era: 'antiquity' }], // 哀牢
    'aimala': [{ from: -9999, era: 'imperial' }], // 艾马拉
    'alagong': [{ from: -9999, era: 'castle' }], // 阿拉贡
    'amago': [{ from: -9999, era: 'imperial' }], // 尼子
    'amaniyake': [{ from: -9999, era: 'castle' }], // 阿马尼亚克
    'an': [{ from: -9999, era: 'imperial' }], // 乌兹别克
    'anga': [{ from: -9999, era: 'antiquity' }], // 鸯伽
    'ansxi': [{ from: -9999, era: 'antiquity' }], // 安息帝国
    'antiaokegongguo': [{ from: -9999, era: 'castle' }], // 赞吉王朝
    'antigonid': [{ from: -9999, era: 'antiquity' }], // 安提柯
    'anushidgin': [{ from: -9999, era: 'castle' }], // 伊勒巴斯
    'anxi': [{ from: -9999, era: 'feudal' }], // 安西
    'aolisha': [{ from: -9999, era: 'castle' }], // 东恒伽
    'aolitai': [{ from: -9999, era: 'antiquity' }], // 奥里泰
    'aosiruowen': [{ from: -9999, era: 'antiquity' }], // 奥斯若恩
    'aquidan': [{ from: -9999, era: 'castle' }], // 阿奎丹
    'arakan': [{ from: -9999, era: 'imperial' }], // 阿拉干
    'ashide': [{ from: -9999, era: 'feudal' }], // 阿史德
    'ashikaga': [{ from: -9999, era: 'castle' }], // 室町
    'yamato': [{ from: -9999, era: 'feudal' }], // 大和（大和朝廷·平安时代；坂上田村麻吕 758–811）
    'ashina': [{ from: -9999, era: 'feudal' }], // 阿史那
    'asikanani': [{ from: -9999, era: 'castle' }], // 勃兰登堡藩侯国
    'aswaka': [{ from: -9999, era: 'antiquity' }], // 阿斯瓦卡
    'ava': [{ from: -9999, era: 'castle' }], // 阿瓦王国
    'aztec': [{ from: -9999, era: 'imperial' }], // 阿兹特克
    'ba': [{ from: -9999, era: 'antiquity' }], // 巴国
    'badakhshan': [{ from: -9999, era: 'imperial' }], // 达克
    'baibo': [{ from: -9999, era: 'antiquity' }], // 黄巾
    'baidi': [{ from: -9999, era: 'antiquity' }], // 白狄
    'baiji': [{ from: -9999, era: 'feudal' }], // 百济
    'bailang': [{ from: -9999, era: 'feudal' }], // 白狼
    'bailian': [{ from: -9999, era: 'imperial' }], // 白莲
    'bailong': [{ from: -9999, era: 'antiquity' }], // 白龙
    'bandun': [{ from: -9999, era: 'antiquity' }], // 板楯
    'basha_d': [{ from: -9999, era: 'imperial' }], // 巴沙
    'batawei': [{ from: -9999, era: 'antiquity' }], // 巴塔维
    'bayegu': [{ from: -9999, era: 'feudal' }], // 拔野古
    'bendou': [{ from: -9999, era: 'castle' }], // 特拉布宗
    'bendou_d': [{ from: -9999, era: 'antiquity' }], // 本都
    'bogendigongguo': [{ from: -9999, era: 'castle' }], // 勃艮第公国
    'bogendi_wangguo': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }], // 勃艮第王国（411–534：古典 411–476 → 封建 476–534）
    'bohai': [{ from: -9999, era: 'feudal' }], // 渤海
    'boootiya': [{ from: -9999, era: 'antiquity' }], // 底比斯
    'boren': [{ from: -9999, era: 'imperial' }], // 都掌蛮
    'bosi_puluosi': [{ from: -9999, era: 'antiquity' }], // 博斯普鲁斯
    'bosiniya': [{ from: -9999, era: 'castle' }], // 波斯尼亚
    'boximiya': [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }], // 波西米亚｜城堡 → 1500 起帝国
    'bulabante': [{ from: -9999, era: 'castle' }], // 布拉班特
    'bulu': [{ from: -9999, era: 'antiquity' }], // 波鲁斯
    'buni': [{ from: -9999, era: 'antiquity' }], // 迦太基
    'buriat': [{ from: -9999, era: 'imperial' }], // 布里亚特
    'buyi_d': [{ from: -9999, era: 'imperial' }], // 布依
    'cen_d': [{ from: -9999, era: 'imperial' }], // 岑氏
    'chagatai': [{ from: -9999, era: 'antiquity' }], // 车师
    'chamorro': [{ from: -9999, era: 'imperial' }], // 查莫罗
    'chanka': [{ from: -9999, era: 'castle' }], // 昌卡
    'chen': [{ from: -9999, era: 'feudal' }], // 陈国
    'chendiaoyan': [{ from: -9999, era: 'castle' }], // 陈吊
    'chenghan': [{ from: -9999, era: 'antiquity' }], // 成汉
    'chengjia': [{ from: -9999, era: 'antiquity' }], // 成家
    'chenla': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }], // 真腊｜封建（阇耶跋摩二世 802）→ 城堡（吴哥王朝）
    'yidali_wangguo': [{ from: -9999, era: 'imperial' }], // 意大利王国（1861–1946）
    'luxitaniya': [{ from: -9999, era: 'antiquity' }], // 卢西塔尼亚（前 2 世纪）
    'tuoerkete': [{ from: -9999, era: 'feudal' }], // 托尔特克（约 900–1150）
    'yadian_gongguo': [{ from: -9999, era: 'castle' }], // 雅典公国（1204–1458）
    'mayapan': [{ from: -9999, era: 'castle' }], // 玛雅潘联盟
    'songhai': [{ from: -9999, era: 'imperial' }], // 桑海帝国（1464 起）
    'shahi': [{ from: -9999, era: 'feudal' }], // 印度教沙希（850–1026）
    'xisa': [{ from: -9999, era: 'antiquity' }], // 西萨特拉普（1–2 世纪）
    'xilawangguo': [{ from: -9999, era: 'imperial' }], // 希腊王国（1832 起）
    'ante': [{ from: -9999, era: 'antiquity' }], // 安特（4 世纪）
    'suweihui': [{ from: -9999, era: 'antiquity' }, { from: 409, era: 'feudal' }], // 苏维汇｜按史分段：部落期古典 → 409 起王国封建
    'yibiluliya': [{ from: -9999, era: 'antiquity' }], // 伊比利亚王国（前 3 世纪起）
    'yicha': [{ from: -9999, era: 'imperial' }], // 伊察（16 世纪）
    'mengjiala': [{ from: -9999, era: 'castle' }], // 孟加拉苏丹国（1342 起）
    'yili': [{ from: -9999, era: 'antiquity' }], // 伊利里亚（巴托起义，前 6 年）
    'daqiya': [{ from: -9999, era: 'antiquity' }], // 达契亚（布雷比斯塔）
    'qiajia': [{ from: -9999, era: 'imperial' }], // 恺加王朝（1796 起）
    'liangxixili': [{ from: -9999, era: 'imperial' }], // 两西西里王国（1816–1861）
    'arevaci': [{ from: -9999, era: 'antiquity' }], // 阿雷瓦西（凯尔特伊比利亚部落，努曼提亚）
    'taluma': [{ from: -9999, era: 'antiquity' }], // 塔鲁玛迦拉（西爪哇，5 世纪）
    'cheshihou': [{ from: -9999, era: 'antiquity' }], // 乌垒
    'chimei': [{ from: -9999, era: 'antiquity' }], // 赤眉
    'choros': [{ from: -9999, era: 'castle' }], // 萨吾尔
    'chosokabe': [{ from: -9999, era: 'imperial' }], // 土佐
    'chuguo': [{ from: -9999, era: 'antiquity' }], // 楚国
    'chuyue': [{ from: -9999, era: 'feudal' }], // 处月
    'daca': [{ from: -9999, era: 'imperial' }], // 达擦
    'dacheng': [{ from: -9999, era: 'imperial' }], // 大成
    'dada_ming': [{ from: -9999, era: 'castle' }], // 鞑靼
    'dai': [{ from: -9999, era: 'castle' }], // 傣族
    'dajin': [{ from: -9999, era: 'castle' }], // 大金
    'dalriada': [{ from: -9999, era: 'feudal' }], // 达尔里阿达
    'dalung': [{ from: -9999, era: 'castle' }], // 达隆
    'damolaweiya': [{ from: -9999, era: 'feudal' }], // 大摩拉维亚
    'dangchang_guo': [{ from: -9999, era: 'feudal' }], // 宕昌
    'daniebo': [{ from: -9999, era: 'castle' }], // 斯摩公国
    'danluo': [{ from: -9999, era: 'castle' }], // 耽罗
    'dasaleiti': [{ from: -9999, era: 'antiquity' }], // 达萨雷提
    'dashun': [{ from: -9999, era: 'imperial' }], // 大顺
    'date_d': [{ from: -9999, era: 'imperial' }], // 仙台
    'daxi_ming': [{ from: -9999, era: 'imperial' }], // 大西
    'dayuan': [{ from: -9999, era: 'antiquity' }], // 大宛
    'dayue': [{ from: -9999, era: 'castle' }], // 大越
    'dayuzi': [{ from: -9999, era: 'castle' }], // 玉兹
    'dedan': [{ from: -9999, era: 'antiquity' }], // 德丹王国
    'dengmaoqi': [{ from: -9999, era: 'castle' }], // 铲平
    'dianguo': [{ from: -9999, era: 'antiquity' }], // 滇国
    'didi': [{ from: -9999, era: 'castle' }], // 佛兰德
    'dixiang': [{ from: -9999, era: 'antiquity' }], // 新国
    'dong': [{ from: -9999, era: 'castle' }], // 隆庆
    'donggete': [{ from: -9999, era: 'antiquity' }], // 东哥特
    'dongjin': [{ from: -9999, era: 'antiquity' }], // 东晋
    'dongxia': [{ from: -9999, era: 'castle' }], // 东夏
    'dongxu': [{ from: -9999, era: 'imperial' }], // 东吁
    'dongzu': [{ from: -9999, era: 'castle' }], // 侗族
    'duerbote': [{ from: -9999, era: 'imperial' }], // 杜尔伯特
    'duolu': [{ from: -9999, era: 'feudal' }], // 咄陆
    'dzungar': [{ from: -9999, era: 'imperial' }], // 绰罗斯
    'elunchunzu': [{ from: -9999, era: 'imperial' }], // 鄂伦春
    'eluoke': [{ from: -9999, era: 'imperial' }], // 鄂罗克
    'eluosi_diguo': [{ from: -9999, era: 'imperial' }], // 俄罗斯帝国
    'emesene': [{ from: -9999, era: 'castle' }], // 埃梅塞尼
    'erzhu': [{ from: -9999, era: 'feudal' }], // 尔朱
    'ewenki': [{ from: -9999, era: 'imperial' }], // 鄂温克
    'fangguozhen': [{ from: -9999, era: 'castle' }], // 方国珍
    'fangla': [{ from: -9999, era: 'castle' }], // 圣公
    'fanyanna': [{ from: -9999, era: 'imperial' }], // 梵衍那
    'feierganna': [{ from: -9999, era: 'castle' }], // 费尔干纳
    'feilisidin': [{ from: -9999, era: 'antiquity' }], // 非利士
    'feiyaka': [{ from: -9999, era: 'imperial' }], // 费雅喀
    'fodejiao': [{ from: -9999, era: 'castle' }], // 葡属佛得角
    'foluolida': [{ from: -9999, era: 'imperial' }], // 西属佛罗里达
    'fuguo': [{ from: -9999, era: 'feudal' }], // 附国
    'fujiwara': [{ from: -9999, era: 'castle' }], // 奥州
    'fulandesi': [{ from: -9999, era: 'castle' }], // 阿图瓦
    'fulijiya': [{ from: -9999, era: 'antiquity' }], // 弗里吉亚
    'funan': [{ from: -9999, era: 'antiquity' }], // 扶南
    'fushi': [{ from: -9999, era: 'antiquity' }], // 苻秦
    'fuyu': [{ from: -9999, era: 'antiquity' }], // 夫余
    'galangdiba': [{ from: -9999, era: 'imperial' }], // 波密
    'gaochang': [{ from: -9999, era: 'feudal' }], // 麴氏
    'gaoche': [{ from: -9999, era: 'antiquity' }], // 高车
    'gaogouli': [{ from: -9999, era: 'feudal' }], // 高句丽
    'gaoqi_d': [{ from: -9999, era: 'feudal' }], // 北齐
    'gar_kham': [{ from: -9999, era: 'imperial' }], // 德司
    'gaya': [{ from: -9999, era: 'antiquity' }], // 伽倻
    'gelujiya': [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }], // 格鲁吉亚｜城堡 → 1500 起帝国
    'geluolu': [{ from: -9999, era: 'feudal' }], // 葛逻禄
    'genji': [{ from: -9999, era: 'castle' }], // 源氏
    'genji_iyo': [{ from: -9999, era: 'castle' }], // 源氏·伊予
    'gesake': [{ from: -9999, era: 'imperial' }], // 哥萨克
    'gling': [{ from: -9999, era: 'castle' }], // 玉树
    'golog': [{ from: -9999, era: 'imperial' }], // 果洛
    'gongsun_d': [{ from: -9999, era: 'antiquity' }], // 辽东
    'gouding': [{ from: -9999, era: 'antiquity' }], // 句町
    'gualani': [{ from: -9999, era: 'imperial' }], // 瓜拉尼
    'guanche': [{ from: -9999, era: 'castle' }], // 关切人
    'guge': [{ from: -9999, era: 'feudal' }], // 古格
    'guishuang': [{ from: -9999, era: 'antiquity' }], // 贵霜
    'guiyi': [{ from: -9999, era: 'feudal' }], // 归义
    'gujarat': [{ from: -9999, era: 'imperial' }], // 古吉拉特苏丹国
    'gulaishi': [{ from: -9999, era: 'feudal' }], // 古莱什部落
    'gurkha': [{ from: -9999, era: 'imperial' }], // 廓喀
    'habusibao': [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }], // 哈布斯堡｜城堡 → 1500 起帝国
    'haikou': [{ from: -9999, era: 'imperial' }], // 海寇
    'haixi_nvzhen': [{ from: -9999, era: 'imperial' }], // 海西
    'hamade': [{ from: -9999, era: 'feudal' }], // 哈马德王朝
    'han': [{ from: -9999, era: 'antiquity' }], // 韩国
    'han_d': [{ from: -9999, era: 'antiquity' }], // 汉国
    'handong': [{ from: -9999, era: 'feudal' }], // 汉东（刘黑闼）
    'douxia': [{ from: -9999, era: 'feudal' }], // 夏（窦建德）
    'mari_ancient': [{ from: -9999, era: 'antiquity' }], // 幼发拉底马里
    'han_zhao': [{ from: -9999, era: 'antiquity' }], // 汉赵
    'hantawadi': [{ from: -9999, era: 'imperial' }], // 汉达瓦底
    'heishi': [{ from: -9999, era: 'castle' }], // 平氏
    'heishui': [{ from: -9999, era: 'feudal' }], // 靺鞨
    'helian': [{ from: -9999, era: 'antiquity' }], // 赫连
    'hepan': [{ from: -9999, era: 'feudal' }], // 朅盘陀
    'heti': [{ from: -9999, era: 'antiquity' }], // 赫梯
    'hojo': [{ from: -9999, era: 'imperial' }], // 北条
    'hongirad': [{ from: -9999, era: 'castle' }], // 弘吉剌
    'hor': [{ from: -9999, era: 'imperial' }], // 霍尔
    'hou_han': [{ from: -9999, era: 'feudal' }], // 后汉
    'hou_jin': [{ from: -9999, era: 'feudal' }], // 后晋
    'hou_liang': [{ from: -9999, era: 'feudal' }], // 后梁
    'hou_qin': [{ from: -9999, era: 'antiquity' }], // 后秦
    'hou_zhao': [{ from: -9999, era: 'antiquity' }], // 后赵
    'hou_zhou': [{ from: -9999, era: 'feudal' }], // 后周
    'houliao': [{ from: -9999, era: 'castle' }], // 东辽
    'huangwang': [{ from: -9999, era: 'feudal' }], // 黄王
    'huarazim': [{ from: -9999, era: 'castle' }], // 花剌子模
    'hui': [{ from: -9999, era: 'antiquity' }], // 濊族
    'huihu': [{ from: -9999, era: 'feudal' }], // 回鹘
    'huite': [{ from: -9999, era: 'imperial' }], // 辉特
    'huluo': [{ from: -9999, era: 'castle' }], // 古尔
    'huohengsuolun': [{ from: -9999, era: 'castle' }], // 勃兰登堡-普鲁士
    'huyan': [{ from: -9999, era: 'antiquity' }], // 呼衍
    'iga_d': [{ from: -9999, era: 'imperial' }], // 伊贺
    'imagawa': [{ from: -9999, era: 'imperial' }], // 今川
    'jialatai': [{ from: -9999, era: 'antiquity' }], // 加拉太
    'jialedi': [{ from: -9999, era: 'antiquity' }], // 迦勒底
    'jiashi_d': [{ from: -9999, era: 'antiquity' }], // 迦尸国
    'jiatailuoniya': [{ from: -9999, era: 'feudal' }], // 加泰罗尼亚
    'jie': [{ from: -9999, era: 'feudal' }], // 羯族
    'jieri': [{ from: -9999, era: 'feudal' }], // 戒日帝国
    'jileinaijia': [{ from: -9999, era: 'antiquity' }], // 昔兰尼
    'jin': [{ from: -9999, era: 'antiquity' }], // 晋国
    'jinchuan_g': [{ from: -9999, era: 'imperial' }], // 金川
    'jingpozu': [{ from: -9999, era: 'imperial' }], // 景颇
    'jinzhang': [{ from: -9999, era: 'castle' }], // 金帐
    'juandu': [{ from: -9999, era: 'feudal' }], // 捐毒
    'julushi': [{ from: -9999, era: 'antiquity' }], // 居鲁士
    'juqu_d': [{ from: -9999, era: 'antiquity' }], // 沮渠
    'kaerka': [{ from: -9999, era: 'imperial' }], // 喀尔喀
    'kaernute': [{ from: -9999, era: 'antiquity' }], // 卡尔努特
    'kaga_d': [{ from: -9999, era: 'imperial' }], // 一向宗
    'kakizaki': [{ from: -9999, era: 'imperial' }], // 松前
    'kala': [{ from: -9999, era: 'feudal' }], // 喀喇
    'kalinga': [{ from: -9999, era: 'antiquity' }], // 羯陵伽
    'kaliya': [{ from: -9999, era: 'antiquity' }], // 卡里亚
    'kanan': [{ from: -9999, era: 'antiquity' }], // 推罗
    'kanata': [{ from: -9999, era: 'imperial' }], // 维查耶纳伽尔
    'kangju': [{ from: -9999, era: 'feudal' }], // 康居
    'kapaduoxiya': [{ from: -9999, era: 'antiquity' }], // 卡帕多细亚
    'karmapa': [{ from: -9999, era: 'imperial' }], // 噶玛
    'kawusi': [{ from: -9999, era: 'imperial' }], // 卡乌斯
    'kazakh': [{ from: -9999, era: 'imperial' }], // 哈萨
    'keerjisi': [{ from: -9999, era: 'feudal' }], // 科尔基斯
    'keerkezi': [{ from: -9999, era: 'feudal' }], // 柯尔克孜
    'keernuwaye': [{ from: -9999, era: 'antiquity' }], // 康沃尔
    'keerqin': [{ from: -9999, era: 'imperial' }], // 科尔沁
    'keluodiya': [{ from: -9999, era: 'imperial' }], // 克罗地亚
    'kepantuo': [{ from: -9999, era: 'feudal' }], // 渴盘陀
    'kereyid': [{ from: -9999, era: 'castle' }], // 克烈
    'kesa': [{ from: -9999, era: 'feudal' }], // 可萨
    'ketagalan': [{ from: -9999, era: 'imperial' }], // 凯达格兰
    'khoja': [{ from: -9999, era: 'imperial' }], // 和卓
    'khon': [{ from: -9999, era: 'castle' }], // 萨迦昆
    'khoshut': [{ from: -9999, era: 'imperial' }], // 和硕特
    'khyungpo': [{ from: -9999, era: 'feudal' }], // 琼波
    'kokand': [{ from: -9999, era: 'imperial' }], // 霍罕
    'konbaung': [{ from: -9999, era: 'imperial' }], // 贡榜
    'kong_d': [{ from: -9999, era: 'antiquity' }], // 鲁国
    'kongsa': [{ from: -9999, era: 'imperial' }], // 孔萨
    'kosala': [{ from: -9999, era: 'antiquity' }], // 拘萨罗
    'kushi': [{ from: -9999, era: 'antiquity' }], // 库施
    'kuye': [{ from: -9999, era: 'imperial' }], // 库页
    'ladakh': [{ from: -9999, era: 'imperial' }], // 玛域
    'lagoniya': [{ from: -9999, era: 'antiquity' }], // 斯巴达
    'lagusa': [{ from: -9999, era: 'castle' }], // 达尔马提亚
    'lancang': [{ from: -9999, era: 'castle' }], // 澜沧
    'lang_clan': [{ from: -9999, era: 'castle' }], // 帕竹朗
    'ldiya': [{ from: -9999, era: 'antiquity' }], // 吕底亚
    'liang_shuofang': [{ from: -9999, era: 'feudal' }], // 大梁
    'liaozu': [{ from: -9999, era: 'imperial' }], // 寮族
    'linshihong': [{ from: -9999, era: 'feudal' }], // 干越
    'liusong': [{ from: -9999, era: 'antiquity' }], // 刘宋
    'liuzhen': [{ from: -9999, era: 'feudal' }], // 六镇
    'longwu': [{ from: -9999, era: 'imperial' }], // 隆武
    'loulan': [{ from: -9999, era: 'antiquity' }], // 楼兰
    'luchuan': [{ from: -9999, era: 'castle' }], // 麓川
    'lujian': [{ from: -9999, era: 'imperial' }], // 鲁监
    'luohu': [{ from: -9999, era: 'castle' }], // 罗斛
    'luomu': [{ from: -9999, era: 'castle' }], // 罗姆
    'luoyue': [{ from: -9999, era: 'antiquity' }], // 骆越
    'lvbu': [{ from: -9999, era: 'antiquity' }], // 徐州（吕布）
    'machu': [{ from: -9999, era: 'feudal' }], // 马楚
    'mahan': [{ from: -9999, era: 'antiquity' }], // 马韩
    'maidina': [{ from: -9999, era: 'feudal' }], // 拉希顿
    'maixiya': [{ from: -9999, era: 'feudal' }], // 麦西亚
    'malacca': [{ from: -9999, era: 'castle' }], // 满剌加
    'malai': [{ from: -9999, era: 'castle' }], // 马来
    'mallabhum': [{ from: -9999, era: 'imperial' }], // 末罗王国
    'malli': [{ from: -9999, era: 'antiquity' }], // 马利
    'mamon': [{ from: -9999, era: 'feudal' }], // 马蒙王朝
    'mamuluke': [{ from: -9999, era: 'castle' }], // 马穆鲁克
    'manding': [{ from: -9999, era: 'castle' }], // 马里
    'mangshi': [{ from: -9999, era: 'feudal' }], // 土库曼
    'mangsite': [{ from: -9999, era: 'feudal' }], // 芒斯特
    'manzheboyi': [{ from: -9999, era: 'castle' }], // 满者伯夷
    'mapuche': [{ from: -9999, era: 'imperial' }], // 马普切
    'maqidun': [{ from: -9999, era: 'antiquity' }],
    'sesali': [{ from: -9999, era: 'antiquity' }], // 色萨利（古典）
    'maya': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }], // 玛雅｜按史分段：古典期 → 476 起封建
    'maynila': [{ from: -9999, era: 'imperial' }], // 马尼拉土邦
    'medang': [{ from: -9999, era: 'feudal' }], // 马打蓝
    'meikelunbao': [{ from: -9999, era: 'castle' }], // 文德
    'meitai': [{ from: -9999, era: 'imperial' }], // 曼尼普尔
    'miandian': [{ from: -9999, era: 'imperial' }], // 缅甸
    'miaomin': [{ from: -9999, era: 'imperial' }], // 苗民
    'midi': [{ from: -9999, era: 'antiquity' }], // 米底
    'min': [{ from: -9999, era: 'feudal' }], // 闽国
    'minangkabau': [{ from: -9999, era: 'castle' }], // 米南加保
    'ming_zheng': [{ from: -9999, era: 'imperial' }], // 明郑
    'minyue': [{ from: -9999, era: 'antiquity' }], // 闽越
    'moerdaweiya': [{ from: -9999, era: 'castle' }], // 摩尔达维亚
    'mojietuo': [{ from: -9999, era: 'antiquity' }], // 摩揭陀王国
    'mombasa': [{ from: -9999, era: 'imperial' }], // 蒙巴萨苏丹国
    'mon': [{ from: -9999, era: 'castle' }], // 孟族
    'mori': [{ from: -9999, era: 'imperial' }], // 毛利
    'mowoer': [{ from: -9999, era: 'imperial' }], // 莫卧儿帝国
    'murong': [{ from: -9999, era: 'antiquity' }], // 慕容
    'muwaxide': [{ from: -9999, era: 'castle' }], // 穆瓦希德
    'nabatai': [{ from: -9999, era: 'antiquity' }], // 纳巴泰王国
    'naiman': [{ from: -9999, era: 'castle' }], // 乃蛮
    'nan_liang': [{ from: -9999, era: 'feudal' }], // 南梁
    'nanbu_shi': [{ from: -9999, era: 'imperial' }], // 南部
    'nanchou': [{ from: -9999, era: 'castle' }], // 南朝
    'nanhan': [{ from: -9999, era: 'feudal' }], // 南汉
    'nanqi': [{ from: -9999, era: 'feudal' }], // 南齐
    'nantang': [{ from: -9999, era: 'feudal' }], // 南唐
    'nanyue': [{ from: -9999, era: 'antiquity' }], // 南越
    'nanzhao': [{ from: -9999, era: 'feudal' }], // 南诏
    'nasier': [{ from: -9999, era: 'castle' }], // 纳斯尔
    'naweierbuta': [{ from: -9999, era: 'imperial' }], // 纳韦尔布塔
    'nidelan': [{ from: -9999, era: 'imperial' }], // 尼德兰
    'nongzhigao': [{ from: -9999, era: 'castle' }], // 大南
    'nuowei': [{ from: -9999, era: 'feudal' }], // 挪威
    'oda': [{ from: -9999, era: 'imperial' }], // 织田
    'odrysian_late': [{ from: -9999, era: 'antiquity' }], // 奥德里西亚
    'ongut': [{ from: -9999, era: 'castle' }], // 汪古
    'otomo_d': [{ from: -9999, era: 'imperial' }], // 大友
    'ouchi': [{ from: -9999, era: 'imperial' }], // 大内
    'ouka': [{ from: -9999, era: 'castle' }], // 奥卡
    'ouyue': [{ from: -9999, era: 'antiquity' }], // 瓯越
    'paermila': [{ from: -9999, era: 'antiquity' }], // 帕尔米拉
    'pagan': [{ from: -9999, era: 'castle' }], // 缅国
    'paiwan': [{ from: -9999, era: 'imperial' }], // 排湾
    'pajiama': [{ from: -9999, era: 'antiquity' }], // 帕加马
    'pandiya': [{ from: -9999, era: 'castle' }], // 潘地亚
    'peilieya_gongguo': [{ from: -9999, era: 'castle' }], // 佩列公国
    'piketai': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }], // 皮克特｜–∞起古典（罗马时期喀里多尼亚/皮克特）→ 476起封建（皮克特王国） // 皮克特
    'pisha': [{ from: -9999, era: 'feudal' }], // 毗沙
    'pishan': [{ from: -9999, era: 'antiquity' }], // 皮山
    'pomeilaniya': [{ from: -9999, era: 'castle' }], // 波美拉尼亚
    'pufaerci': [{ from: -9999, era: 'castle' }], // 普法尔茨
    'pulei': [{ from: -9999, era: 'antiquity' }], // 蒲类
    'puluowangsi': [{ from: -9999, era: 'castle' }], // 普罗旺斯
    'pusikefu_gongheguo': [{ from: -9999, era: 'castle' }], // 伟利卡亚
    'puxiangyindu': [{ from: -9999, era: 'imperial' }], // 葡属印度
    'pyu': [{ from: -9999, era: 'feudal' }], // 骠族
    'qi': [{ from: -9999, era: 'antiquity' }], // 齐国
    'qianhui': [{ from: -9999, era: 'imperial' }], // 回军
    'qianliang': [{ from: -9999, era: 'antiquity' }], // 前凉
    'qianshu': [{ from: -9999, era: 'feudal' }], // 前蜀
    'qiemo': [{ from: -9999, era: 'antiquity' }], // 且末
    'qiepantuo': [{ from: -9999, era: 'feudal' }], // 护密
    'qiernigeweifu_gongguo': [{ from: -9999, era: 'feudal' }], // 杰斯纳
    'qifu_d': [{ from: -9999, era: 'antiquity' }], // 乞伏
    'qimu': [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }], // 奇穆｜按史分段：900–1050 封建 → 1050 起城堡
    'qin': [{ from: -9999, era: 'antiquity' }], // 秦国
    'qiong': [{ from: -9999, era: 'antiquity' }], // 邛谷
    'qiuchi': [{ from: -9999, era: 'antiquity' }], // 仇池
    'qiuci': [{ from: -9999, era: 'antiquity' }], // 龟兹
    'qiufu': [{ from: -9999, era: 'feudal' }], // 剡中
    'qutb_shahi': [{ from: -9999, era: 'imperial' }], // 库特布朝
    'ranwei_d': [{ from: -9999, era: 'antiquity' }], // 冉魏
    'ruishi': [{ from: -9999, era: 'castle' }], // 瑞士
    'ruoqiang': [{ from: -9999, era: 'antiquity' }], // 婼羌
    'saerbadaer': [{ from: -9999, era: 'castle' }], // 萨尔巴达尔
    'safuyi': [{ from: -9999, era: 'castle' }], // 萨伏伊
    'sai': [{ from: -9999, era: 'feudal' }], // 塞种
    'saierweiya': [{ from: -9999, era: 'castle' }], // 塞尔维亚
    'saimien': [{ from: -9999, era: 'feudal' }], // 塞米恩
    'saipulusi': [{ from: -9999, era: 'castle' }], // 塞浦路斯
    'saman': [{ from: -9999, era: 'feudal' }], // 萨曼
    'samtskhe': [{ from: -9999, era: 'castle' }], // 萨姆茨赫
    'sanada': [{ from: -9999, era: 'imperial' }], // 真田
    'sanfoqi': [{ from: -9999, era: 'feudal' }], // 三佛齐
    'scotland': [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }], // 苏格兰｜–∞起城堡 → 1500起帝国（高地时代/詹姆斯党起义） // 苏格兰
    'shache': [{ from: -9999, era: 'antiquity' }], // 莎车
    'shang': [{ from: -9999, era: 'antiquity' }], // 商国
    'shanshan': [{ from: -9999, era: 'antiquity' }], // 鄯善
    'shaodang': [{ from: -9999, era: 'antiquity' }], // 烧当
    'shatuo': [{ from: -9999, era: 'feudal' }], // 沙陀
    'she': [{ from: -9999, era: 'imperial' }], // 奢安
    'she_ethnic': [{ from: -9999, era: 'feudal' }], // 畲族
    'shen': [{ from: -9999, era: 'antiquity' }], // 申国
    'shengdian_qishi': [{ from: -9999, era: 'castle' }], // 圣殿骑士团
    'shengmiao': [{ from: -9999, era: 'imperial' }], // 生苗
    'shi_clan': [{ from: -9999, era: 'feudal' }], // 石氏
    'shimazu': [{ from: -9999, era: 'imperial' }], // 岛津
    'shiwaben': [{ from: -9999, era: 'feudal' }], // 施瓦本
    'shiwei': [{ from: -9999, era: 'feudal' }], // 室韦
    'shiyuzu': [{ from: -9999, era: 'antiquity' }], // 食鱼族
    'shoni': [{ from: -9999, era: 'castle' }], // 少弐
    'shu': [{ from: -9999, era: 'antiquity' }], // 蜀国
    'shuizhen': [{ from: -9999, era: 'imperial' }], // 水真
    'shuizu': [{ from: -9999, era: 'imperial' }], // 水族
    'shunga': [{ from: -9999, era: 'antiquity' }], // 巽伽
    'shuntian': [{ from: -9999, era: 'imperial' }], // 天地会
    'siam': [{ from: -9999, era: 'imperial' }], // 暹罗
    'sijitai': [{ from: -9999, era: 'antiquity' }], // 斯基泰
    'so': [{ from: -9999, era: 'imperial' }], // 对马
    'sou': [{ from: -9999, era: 'antiquity' }], // 越嶲夷
    'sui': [{ from: -9999, era: 'feudal' }], // 隋国
    'suke': [{ from: -9999, era: 'castle' }], // 素可泰
    'sulu': [{ from: -9999, era: 'castle' }], // 苏禄
    'sumeier': [{ from: -9999, era: 'antiquity' }], // 乌鲁克
    'sunite': [{ from: -9999, era: 'imperial' }], // 苏尼特
    'sunwu_d': [{ from: -9999, era: 'antiquity' }], // 孙吴
    'suogediyana': [{ from: -9999, era: 'antiquity' }], // 索格狄亚那
    'suolun': [{ from: -9999, era: 'imperial' }], // 达斡尔
    'suosuo': [{ from: -9999, era: 'castle' }], // 索索
    'supi': [{ from: -9999, era: 'feudal' }], // 苏毗
    'sushen': [{ from: -9999, era: 'feudal' }], // 肃慎
    'sute': [{ from: -9999, era: 'antiquity' }], // 诺塔卡
    'suwa_d': [{ from: -9999, era: 'imperial' }], // 诹访
    'suzidaer': [{ from: -9999, era: 'castle' }], // 苏兹达尔
    'tailuona': [{ from: -9999, era: 'imperial' }], // 泰罗纳
    'taimier': [{ from: -9999, era: 'imperial' }], // 马拉塔
    'taino': [{ from: -9999, era: 'imperial' }], // 西属古巴
    'taino_d': [{ from: -9999, era: 'imperial' }], // 泰诺
    'taiping': [{ from: -9999, era: 'imperial' }], // 太平
    'taiyuan': [{ from: -9999, era: 'castle' }], // 泰沅
    'tajikezu': [{ from: -9999, era: 'imperial' }], // 塔吉克
    'takeda': [{ from: -9999, era: 'imperial' }], // 武田
    'talanduo': [{ from: -9999, era: 'antiquity' }], // 塔兰托
    'tamoyue': [{ from: -9999, era: 'imperial' }], // 塔莫约
    'tan_d': [{ from: -9999, era: 'castle' }], // 土家
    'tang': [{ from: -9999, era: 'feudal' }], // 唐国
    'tatar': [{ from: -9999, era: 'castle' }], // 塔塔尔
    'teluoyi': [{ from: -9999, era: 'antiquity' }], // 特洛伊
    'ternate': [{ from: -9999, era: 'imperial' }], // 特尔纳特
    'teweier_gongguo': [{ from: -9999, era: 'castle' }], // 特维公国
    'teweierqie': [{ from: -9999, era: 'imperial' }], // 特维尔切
    'tianxiong': [{ from: -9999, era: 'feudal' }], // 魏博
    'tiaodun_qishi': [{ from: -9999, era: 'castle' }], // 条顿骑士
    'tiemuer': [{ from: -9999, era: 'castle' }], // 图兰
    'tokugawa': [{ from: -9999, era: 'imperial' }], // 德川
    'tomara_gwalior': [{ from: -9999, era: 'imperial' }], // 托摩罗
    'toyotomi': [{ from: -9999, era: 'imperial' }], // 丰臣
    'tsangpa': [{ from: -9999, era: 'imperial' }], // 藏巴汗
    'tuerhute': [{ from: -9999, era: 'imperial' }], // 土尔扈特
    'tufa_d': [{ from: -9999, era: 'antiquity' }], // 秃发
    'tujishi': [{ from: -9999, era: 'feudal' }], // 突骑施
    'tujue': [{ from: -9999, era: 'feudal' }], // 突厥
    'tumed': [{ from: -9999, era: 'imperial' }], // 土默特
    'tuoba': [{ from: -9999, era: 'antiquity' }], // 拓跋
    'tuolemi': [{ from: -9999, era: 'antiquity' }], // 托勒密
    'tuomengde': [{ from: -9999, era: 'castle' }], // 托蒙德
    'tuoming': [{ from: -9999, era: 'imperial' }], // 清真
    'tuosikana': [{ from: -9999, era: 'castle' }], // 托斯卡纳
    'tupi': [{ from: -9999, era: 'imperial' }], // 图皮
    'tupinijin': [{ from: -9999, era: 'imperial' }], // 葡属巴西
    'tutul_xiu': [{ from: -9999, era: 'feudal' }], // 休族
    'uesugi': [{ from: -9999, era: 'imperial' }], // 上杉
    'utsunomiya': [{ from: -9999, era: 'imperial' }], // 宇都宫
    'vidin_tsardom': [{ from: -9999, era: 'castle' }], // 维丁国
    'voc': [{ from: -9999, era: 'imperial' }], // 荷兰东印度公司
    'walajiyia': [{ from: -9999, era: 'castle' }], // 瓦拉几亚
    'wei': [{ from: -9999, era: 'antiquity' }], // 魏国
    'weiershigongguo': [{ from: -9999, era: 'castle' }], // 威尔士公国
    'weijing_york': [{ from: -9999, era: 'feudal' }], // 约维克
    'weili': [{ from: -9999, era: 'antiquity' }], // 尉犁
    'weitou': [{ from: -9999, era: 'antiquity' }], // 尉头
    'weiwuer': [{ from: -9999, era: 'castle' }], // 维吾尔
    'wensu': [{ from: -9999, era: 'antiquity' }], // 温宿
    'wu': [{ from: -9999, era: 'antiquity' }], // 吴国
    'wuer': [{ from: -9999, era: 'antiquity' }], // 乌尔第三王朝
    'wugu_d': [{ from: -9999, era: 'castle' }], // 乌古斯
    'wuhu': [{ from: -9999, era: 'feudal' }], // 乌护
    'wuhuan': [{ from: -9999, era: 'antiquity' }], // 乌桓
    'wuji': [{ from: -9999, era: 'antiquity' }], // 勿吉
    'wula': [{ from: -9999, era: 'imperial' }], // 乌拉
    'wulaertu_guo': [{ from: -9999, era: 'antiquity' }], // 乌拉尔图
    'wuling': [{ from: -9999, era: 'antiquity' }], // 五溪
    'wumeng': [{ from: -9999, era: 'castle' }], // 越州蛮
    'wure': [{ from: -9999, era: 'feudal' }], // 兀惹
    'wusun': [{ from: -9999, era: 'antiquity' }], // 乌孙
    'wuyue': [{ from: -9999, era: 'feudal' }], // 吴越
    'wuzhou_d': [{ from: -9999, era: 'feudal' }], // 武周
    'wuzhumuqin': [{ from: -9999, era: 'imperial' }], // 乌珠穆沁
    'xiadun': [{ from: -9999, era: 'imperial' }], // 夏顿
    'xiajiasi': [{ from: -9999, era: 'feudal' }], // 坚昆
    'xianbei': [{ from: -9999, era: 'antiquity' }], // 鲜卑
    'xiangxiong': [{ from: -9999, era: 'feudal' }], // 象雄
    'xianhai': [{ from: -9999, era: 'feudal' }], // 咸海
    'xianlingqiang': [{ from: -9999, era: 'antiquity' }], // 先零
    'xiaobolu': [{ from: -9999, era: 'feudal' }], // 勃律
    'xibanya': [{ from: -9999, era: 'imperial' }], // 西班牙
    'xibo_d': [{ from: -9999, era: 'imperial' }], // 锡伯
    'xibolai': [{ from: -9999, era: 'antiquity' }], // 以色列
    'xichu': [{ from: -9999, era: 'antiquity' }], // 西楚
    'xideweina': [{ from: -9999, era: 'feudal' }], // 波洛公国
    'xiemian': [{ from: -9999, era: 'feudal' }], // 萨维尔
    'xierhe': [{ from: -9999, era: 'feudal' }], // 锡尔河
    'xierwan': [{ from: -9999, era: 'imperial' }], // 希尔万王国
    'xihai_d': [{ from: -9999, era: 'feudal' }], // 吐谷浑
    'xike': [{ from: -9999, era: 'imperial' }], // 锡克帝国
    'xikesuosi': [{ from: -9999, era: 'antiquity' }], // 喜克索斯
    'xila': [{ from: -9999, era: 'antiquity' }], // 雅典
    'xiliao': [{ from: -9999, era: 'castle' }], // 西辽
    'xinfalanxi': [{ from: -9999, era: 'imperial' }], // 新法兰西
    'xingelana': [{ from: -9999, era: 'imperial' }], // 新格拉纳达
    'xingliao': [{ from: -9999, era: 'feudal' }], // 兴辽
    'xingwei': [{ from: -9999, era: 'castle' }], // 兴威
    'xinluo': [{ from: -9999, era: 'feudal' }], // 新罗
    'xinnidelan': [{ from: -9999, era: 'imperial' }], // 新尼德兰
    'xiongnu': [{ from: -9999, era: 'antiquity' }], // 匈奴
    'xiongren': [{ from: -9999, era: 'antiquity' }], // 匈人
    'awaer': [{ from: -9999, era: 'feudal' }], // 阿瓦尔汗国（567–822，潘诺尼亚）
    'xiou': [{ from: -9999, era: 'antiquity' }], // 西瓯
    'xiye': [{ from: -9999, era: 'antiquity' }], // 西夜
    'xueyantuo': [{ from: -9999, era: 'feudal' }], // 薛延陀
    'xushouhui': [{ from: -9999, era: 'castle' }], // 天完
    'yada': [{ from: -9999, era: 'antiquity' }], // 嚈哒
    'yan': [{ from: -9999, era: 'antiquity' }], // 燕国
    'yanda': [{ from: -9999, era: 'antiquity' }], // 阿尔洪
    'yang_aner': [{ from: -9999, era: 'antiquity' }], // 天顺
    'yang_bozhou': [{ from: -9999, era: 'imperial' }], // 播州杨氏
    'yangguan': [{ from: -9999, era: 'antiquity' }], // 西凉
    'liangzhou': [{ from: -9999, era: 'antiquity' }], // 凉州（汉末凉州之乱）
    'yangwu': [{ from: -9999, era: 'feudal' }], // 杨吴
    'yanqi': [{ from: -9999, era: 'feudal' }], // 焉耆
    'yarkand': [{ from: -9999, era: 'imperial' }], // 叶尔羌
    'yashu': [{ from: -9999, era: 'antiquity' }], // 亚述
    'yasuer': [{ from: -9999, era: 'imperial' }], // 亚速尔
    'yehe': [{ from: -9999, era: 'imperial' }], // 叶赫
    'yelang': [{ from: -9999, era: 'antiquity' }], // 夜郎
    'yelusalengwg': [{ from: -9999, era: 'castle' }], // 耶路撒冷王国
    'yeren_nvzhen': [{ from: -9999, era: 'imperial' }], // 萨哈连
    'yezongliu': [{ from: -9999, era: 'castle' }], // 处州
    'yidelisi': [{ from: -9999, era: 'feudal' }], // 伊德里斯王朝
    'yidier': [{ from: -9999, era: 'feudal' }], // 伊蒂尔汗国
    'yiduhu': [{ from: -9999, era: 'castle' }], // 亦都护
    'yilaka': [{ from: -9999, era: 'imperial' }], // 伊拉卡
    'yilisi': [{ from: -9999, era: 'antiquity' }], // 埃利斯
    'yilou': [{ from: -9999, era: 'antiquity' }], // 挹娄
    'yiluokui': [{ from: -9999, era: 'castle' }], // 易洛魁联盟
    'yipilusi': [{ from: -9999, era: 'antiquity' }], // 伊庇鲁斯
    'yiqu': [{ from: -9999, era: 'antiquity' }], // 义渠
    'yiwu': [{ from: -9999, era: 'castle' }], // 伊吾
    'yizhi': [{ from: -9999, era: 'antiquity' }], // 一支
    'yuan_d': [{ from: -9999, era: 'castle' }], // 大元
    'yuan_shao': [{ from: -9999, era: 'antiquity' }], // 袁绍
    'yuenan': [{ from: -9999, era: 'imperial' }], // 越南
    'yuezhi': [{ from: -9999, era: 'feudal' }], // 月氏
    'yumi': [{ from: -9999, era: 'antiquity' }], // 扜弥
    'yun': [{ from: -9999, era: 'antiquity' }], // 允戎
    'yuwen': [{ from: -9999, era: 'feudal' }], // 宇文
    'zhadalan': [{ from: -9999, era: 'castle' }], // 扎答兰
    'zhagewei': [{ from: -9999, era: 'castle' }], // 扎格维
    'zhangshicheng': [{ from: -9999, era: 'castle' }], // 大周
    'zhaowu': [{ from: -9999, era: 'castle' }], // 昭武
    'zhayan': [{ from: -9999, era: 'castle' }], // 扎扬
    'zhelouqi': [{ from: -9999, era: 'castle' }], // 乔汉
    'zhongxiang': [{ from: -9999, era: 'castle' }], // 鼎州
    'zhou': [{ from: -9999, era: 'antiquity' }], // 周国
    'zhuang_d': [{ from: -9999, era: 'imperial' }], // 壮族
    'zhuerqi': [{ from: -9999, era: 'castle' }], // 主儿乞
    'zubu': [{ from: -9999, era: 'castle' }], // 阻卜
    // ══════ 三、多时代势力（未手裁：按现存名将成名年推定，不改变现有武将）══════
    'ayinu_ezo': [{ from: -9999, era: 'castle' }, { from: 1626, era: 'imperial' }], // 阿伊努｜按现存名将成名年推定：–∞起城堡 → 1626起帝国
    'ayoubu': [{ from: -9999, era: 'feudal' }, { from: 1187, era: 'castle' }], // 阿尤布｜按现存名将成名年推定：–∞起封建 → 1187起城堡
    'bafaliya': [{ from: -9999, era: 'feudal' }, { from: 1388, era: 'castle' }], // 巴伐利亚｜按现存名将成名年推定：–∞起封建 → 1388起城堡
    'baojiaer': [{ from: -9999, era: 'castle' }, { from: 1720, era: 'imperial' }], // 保加尔｜按现存名将成名年推定：–∞起城堡 → 1720起帝国
    'baojialiya': [{ from: -9999, era: 'feudal' }, { from: 1190, era: 'castle' }, { from: 1500, era: 'imperial' }], // 保加利亚｜封建→1190 城堡→1500 帝国
    'baojian_qishi': [{ from: -9999, era: 'castle' }, { from: 1470, era: 'imperial' }], // 宝剑骑士团｜按现存名将成名年推定：–∞起城堡 → 1470起帝国
    'boluo': [{ from: -9999, era: 'antiquity' }, { from: 618, era: 'feudal' }], // 波罗帝国｜按现存名将成名年推定：–∞起古典 → 618起封建
    'bulietani': [{ from: -9999, era: 'feudal' }, { from: 1425, era: 'castle' }], // 布列塔尼｜按现存名将成名年推定：–∞起封建 → 1425起城堡
    'champa': [{ from: -9999, era: 'antiquity' }, { from: 1150, era: 'castle' }], // 占婆｜按现存名将成名年推定：–∞起古典 → 1150起城堡
    'cuanshi': [{ from: -9999, era: 'antiquity' }, { from: 715, era: 'feudal' }], // 爨族｜按现存名将成名年推定：–∞起古典 → 715起封建
    'da_yan': [{ from: -9999, era: 'antiquity' }, { from: 720, era: 'feudal' }], // 大燕｜按现存名将成名年推定：–∞起古典 → 720起封建
    'dali': [{ from: -9999, era: 'feudal' }, { from: 1065, era: 'castle' }], // 大理｜按现存名将成名年推定：–∞起封建 → 1065起城堡
    'danmai': [{ from: -9999, era: 'feudal' }, { from: 1184, era: 'castle' }, { from: 1500, era: 'imperial' }], // 丹麦｜–∞起封建 → 1184起城堡 → 1500起帝国
    'xinbuli': [{ from: -9999, era: 'antiquity' }], // 辛布里（金布里）｜前 113–前 101 辛布里战争
    'daquyue': [{ from: -9999, era: 'feudal' }, { from: 1405, era: 'castle' }], // 大瞿越｜按现存名将成名年推定：–∞起封建 → 1405起城堡
    'deli': [{ from: -9999, era: 'castle' }, { from: 1526, era: 'imperial' }], // 德里苏丹国｜按现存名将成名年推定：–∞起城堡 → 1526起帝国
    'sur': [{ from: -9999, era: 'imperial' }], // 🔴 [2026-10-28 主人批立] 苏尔王朝｜1540 舍尔沙立国，1556 第二次帕尼帕特亡（赫穆战败）→ 帝国时代
    'koln': [{ from: -9999, era: 'castle' }], // 🔴 [2026-10-28 主人批立] 科隆大主教区｜1288 沃林根战役＝城堡时代
    'dublin': [{ from: -9999, era: 'feudal' }], // 🔴 [2026-10-28 主人批立] 都柏林王国｜1014 克朗塔夫战役＝封建时代
    'dulan_d': [{ from: -9999, era: 'feudal' }, { from: 1500, era: 'castle' }, { from: 1761, era: 'imperial' }], // 杜兰尼｜按现存名将成名年推定：–∞起封建 → 1500起城堡 → 1761起帝国
    'ethiopia': [{ from: -9999, era: 'antiquity' }, { from: 890, era: 'feudal' }, { from: 1150, era: 'castle' }, { from: 1623, era: 'imperial' }], // 埃塞俄比亚｜按现存名将成名年推定：–∞起古典 → 890起封建 → 1150起城堡 → 1623起帝国
    'ganden': [{ from: -9999, era: 'castle' }, { from: 1638, era: 'imperial' }], // 甘丹｜按现存名将成名年推定：–∞起城堡 → 1638起帝国
    'gurjara': [{ from: -9999, era: 'feudal' }, { from: 1620, era: 'imperial' }], // 瞿折罗｜按现存名将成名年推定：–∞起封建 → 1620起帝国
    'hansa': [{ from: -9999, era: 'feudal' }, { from: 1380, era: 'castle' }], // 汉萨｜按现存名将成名年推定：–∞起封建 → 1380起城堡
    'inca': [{ from: -9999, era: 'castle' }, { from: 1532, era: 'imperial' }], // 印加｜按现存名将成名年推定：–∞起城堡 → 1532起帝国
    'jialixiya': [{ from: -9999, era: 'feudal' }, { from: 1221, era: 'castle' }], // 哈尔公国｜按现存名将成名年推定：–∞起封建 → 1221起城堡
    'jiazini': [{ from: -9999, era: 'feudal' }, { from: 1110, era: 'castle' }], // 伽色尼｜按现存名将成名年推定：–∞起封建 → 1110起城堡
    'jilimi': [{ from: -9999, era: 'castle' }, { from: 1620, era: 'imperial' }], // 吉里｜按现存名将成名年推定：–∞起城堡 → 1620起帝国
    'joseon': [{ from: -9999, era: 'antiquity' }, { from: 1380, era: 'castle' }, { from: 1515, era: 'imperial' }], // 朝鲜｜按现存名将成名年推定：–∞起古典 → 1380起城堡 → 1515起帝国
    'kasidiliya': [{ from: -9999, era: 'castle' }, { from: 1491, era: 'imperial' }], // 卡斯蒂利亚｜按现存名将成名年推定：–∞起城堡 → 1491起帝国
    'kelimiya': [{ from: -9999, era: 'castle' }, { from: 1486, era: 'imperial' }], // 热那亚共和国｜按现存名将成名年推定：–∞起城堡 → 1486起帝国
    'kelite': [{ from: -9999, era: 'castle' }, { from: 1639, era: 'imperial' }], // 威尼斯共和国｜按现存名将成名年推定：–∞起城堡 → 1639起帝国
    'kongque': [{ from: -9999, era: 'antiquity' }, { from: 435, era: 'feudal' }], // 孔雀帝国｜按现存名将成名年推定：–∞起古典 → 435起封建
    'kuman_oleshky': [{ from: -9999, era: 'antiquity' }, { from: 1200, era: 'castle' }], // 库曼｜按现存名将成名年推定：–∞起古典 → 1200起城堡
    'kumoxi': [{ from: -9999, era: 'feudal' }, { from: 1095, era: 'castle' }], // 库莫奚｜按现存名将成名年推定：–∞起封建 → 1095起城堡
    'leangongguo': [{ from: -9999, era: 'feudal' }, { from: 1191, era: 'castle' }], // 莱昂｜按现存名将成名年推定：–∞起封建 → 1191起城堡
    'liren': [{ from: -9999, era: 'feudal' }, { from: 1480, era: 'imperial' }], // 俚族｜按现存名将成名年推定：–∞起封建 → 1480起帝国
    'litaowan': [{ from: -9999, era: 'castle' }, { from: 1470, era: 'imperial' }], // 立陶宛｜按现存名将成名年推定：–∞起城堡 → 1470起帝国
    'lunbadi': [{ from: -9999, era: 'feudal' }, { from: 1070, era: 'castle' }, { from: 1513, era: 'imperial' }], // 伦巴第｜按现存名将成名年推定：–∞起封建 → 1070起城堡 → 1513起帝国
    'gepids': [{ from: -9999, era: 'feudal' }], // 革皮德（5–6 世纪）
    'kalbids': [{ from: -9999, era: 'castle' }], // 卡尔比德（10–11 世纪）
    'luodian': [{ from: -9999, era: 'castle' }, { from: 1595, era: 'imperial' }], // 罗甸｜按现存名将成名年推定：–∞起城堡 → 1595起帝国
    'maerta_qishi': [{ from: -9999, era: 'castle' }, { from: 1565, era: 'imperial' }], // 圣约翰｜按现存名将成名年推定：–∞起城堡 → 1565起帝国
    'mosike_gongguo': [{ from: -9999, era: 'castle' }, { from: 1514, era: 'imperial' }], // 莫斯公国｜按现存名将成名年推定：–∞起城堡 → 1514起帝国
    'muisca': [{ from: -9999, era: 'castle' }, { from: 1520, era: 'imperial' }], // 穆伊斯卡｜按现存名将成名年推定：–∞起城堡 → 1520起帝国
    'mulabite': [{ from: -9999, era: 'feudal' }, { from: 1086, era: 'castle' }], // 穆拉比特｜按现存名将成名年推定：–∞起封建 → 1086起城堡
    'malin': [{ from: -9999, era: 'castle' }], // 🔴 [2026-10-28 主人批修] 马林王朝｜1244 立国、1331–1348 阿布·哈桑在位，1340 里奥萨拉多＝城堡时代
    'oirat_ming': [{ from: -9999, era: 'castle' }, { from: 1690, era: 'imperial' }], // 卫拉特｜按现存名将成名年推定：–∞起城堡 → 1690起帝国
    'panyao': [{ from: -9999, era: 'castle' }, { from: 1750, era: 'imperial' }], // 盘瑶｜按现存名将成名年推定：–∞起城堡 → 1750起帝国
    'putaoya': [{ from: -9999, era: 'castle' }, { from: 1520, era: 'imperial' }], // 葡萄牙｜按现存名将成名年推定：–∞起城堡 → 1520起帝国
    'rouran': [{ from: -9999, era: 'antiquity' }, { from: 500, era: 'feudal' }], // 柔然｜按现存名将成名年推定：–∞起古典 → 500起封建
    'ruidian_si': [{ from: -9999, era: 'feudal' }, { from: 1230, era: 'castle' }, { from: 1570, era: 'imperial' }], // 瑞典｜按现存名将成名年推定：–∞起封建 → 1230起城堡 → 1570起帝国
    'ryukyu': [{ from: -9999, era: 'castle' }, { from: 1490, era: 'imperial' }], // 琉球｜按现存名将成名年推定：–∞起城堡 → 1490起帝国
    'safawei_d': [{ from: -9999, era: 'castle' }, { from: 1510, era: 'imperial' }], // 萨法维｜按现存名将成名年推定：–∞起城堡 → 1510起帝国
    'sailiugu': [{ from: -9999, era: 'antiquity' }, { from: 1050, era: 'castle' }], // 塞琉古｜按现存名将成名年推定：–∞起古典 → 1050起城堡
    'salai': [{ from: -9999, era: 'castle' }, { from: 1540, era: 'imperial' }], // 萨莱诺盖｜按现存名将成名年推定：–∞起城堡 → 1540起帝国
    'seleisi': [{ from: -9999, era: 'antiquity' }, { from: 917, era: 'feudal' }], // 色雷斯｜按现存名将成名年推定：–∞起古典 → 917起封建
    'sengjialuo': [{ from: -9999, era: 'antiquity' }, { from: 980, era: 'feudal' }], // 僧伽罗｜按现存名将成名年推定：–∞起古典 → 980起封建
    'shule': [{ from: -9999, era: 'antiquity' }, { from: 960, era: 'feudal' }], // 疏勒｜按现存名将成名年推定：–∞起古典 → 960起封建
    'sogdian': [{ from: -9999, era: 'antiquity' }, { from: 690, era: 'feudal' }], // 粟特｜按现存名将成名年推定：–∞起古典 → 690起封建
    'suomunate': [{ from: -9999, era: 'feudal' }, { from: 1163, era: 'castle' }], // 索兰基｜按现存名将成名年推定：–∞起封建 → 1163起城堡
    'talasike': [{ from: -9999, era: 'castle' }, { from: 1505, era: 'imperial' }], // 塔拉斯科｜按现存名将成名年推定：–∞起城堡 → 1505起帝国
    'tubo': [{ from: -9999, era: 'antiquity' }, { from: 530, era: 'feudal' }, { from: 1050, era: 'castle' }], // 吐蕃｜按现存名将成名年推定：–∞起古典 → 530起封建 → 1050起城堡
    'wende': [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }, { from: 993, era: 'castle' }, { from: 1500, era: 'imperial' }], // 萨克森｜–∞起古典（罗马时期撒克逊人）→ 476起封建 → 993起城堡 → 1500起帝国
    'wulaertu': [{ from: -9999, era: 'antiquity' }, { from: 953, era: 'feudal' }, { from: 1140, era: 'castle' }, { from: 1500, era: 'imperial' }], // 亚美尼亚｜古典→953 封建→1140 城堡→1500 帝国
    'xigete': [{ from: -9999, era: 'antiquity' }, { from: 708, era: 'feudal' }, { from: 1085, era: 'castle' }], // 西哥特｜按现存名将成名年推定：–∞起古典 → 708起封建 → 1085起城堡
    'xijue': [{ from: -9999, era: 'antiquity' }, { from: 660, era: 'feudal' }], // 十箭｜按现存名将成名年推定：–∞起古典 → 660起封建
    'xinxibanya': [{ from: -9999, era: 'castle' }, { from: 1505, era: 'imperial' }], // 新西班牙｜按现存名将成名年推定：–∞起城堡 → 1505起帝国
    'xisi': [{ from: -9999, era: 'antiquity' }, { from: 860, era: 'feudal' }], // 萨法尔王朝｜按现存名将成名年推定：–∞起古典 → 860起封建
    'yilihanguo_d': [{ from: -9999, era: 'feudal' }, { from: 1258, era: 'castle' }], // 伊利汗国｜按现存名将成名年推定：–∞起封建 → 1258起城堡
    'you': [{ from: -9999, era: 'antiquity' }, { from: 868, era: 'feudal' }], // 幽州｜按现存名将成名年推定：–∞起古典 → 868起封建
    'yuchi': [{ from: -9999, era: 'antiquity' }, { from: 635, era: 'feudal' }], // 尉迟｜按现存名将成名年推定：–∞起古典 → 635起封建
    'yue': [{ from: -9999, era: 'antiquity' }, { from: 560, era: 'feudal' }], // 越国｜按现存名将成名年推定：–∞起古典 → 560起封建
    'zhao': [{ from: -9999, era: 'antiquity' }, { from: 621, era: 'feudal' }], // 赵国｜按现存名将成名年推定：–∞起古典 → 621起封建
    'zhuluo': [{ from: -9999, era: 'antiquity' }, { from: 993, era: 'feudal' }], // 朱罗｜按现存名将成名年推定：–∞起古典 → 993起封建
    'pattani': [{ from: -9999, era: 'imperial' }], // 北大年｜16-17世纪北大年苏丹国（帝国）
};



/** 势力在指定年份所属的时代（段内取最近一段的起点） */
export function getFactionEraAt(factionId: string | null | undefined, year: number | null | undefined): GeneralEra | undefined {
    if (!factionId) return undefined;
    const segs = FACTION_ERA[factionId];
    if (!segs || segs.length === 0) return undefined;
    if (year == null || !Number.isFinite(year)) return segs[segs.length - 1].era;
    let era: GeneralEra | undefined = segs[0].era;
    for (const s of segs) { if (year >= s.from) era = s.era; else break; }
    return era;
}

/** 判段用的年份：首战年（最知名那一战）→ 登场年（生年+20，不晚于卒年） */
export function getGeneralEraYear(generalId: string | null | undefined): number | null {
    if (!generalId) return null;
    const fb = GENERAL_FIRST_BATTLES[generalId];
    if (fb && typeof fb.battleYear === 'number' && Number.isFinite(fb.battleYear)) return fb.battleYear;
    return getGeneralDebutYear(generalId);
}

/**
 * generalId → 势力（**以条目自写的 `factionId` 为准，没有才用所在名单块的键**）。
 * ⚠️ 不走 `getFactionIdOfGeneral`：那个索引只记名单块的键，忽略条目里的 `factionId` 覆盖
 *    （2026-10-25 实测：阿布·哈桑被答成「伊德里斯」、莱加斯皮被答成「阿拉贡」），判时代会判错势力。
 */
const GENERAL_FACTION: Readonly<Map<string, string>> = (() => {
    const m = new Map<string, string>();
    const pending: Array<[string, string]> = [];
    for (const [blockFid, entry] of Object.entries(FACTION_GENERALS)) {
        const list = Array.isArray(entry) ? entry : [entry];
        for (const g of list) {
            if (!g?.generalId) continue;
            const own = (g as { factionId?: string }).factionId;
            if (own) { if (!m.has(g.generalId)) m.set(g.generalId, own); }
            else pending.push([g.generalId, blockFid]);
        }
    }
    for (const [gid, fid] of pending) if (!m.has(gid)) m.set(gid, fid);
    return m;
})();

/** 武将的时代：势力时代（按成名年落段）→ 保留表 → GeneralEra 原值兜底 */
export function getGeneralEra(generalId: string | null | undefined, factionIdHint?: string | null): GeneralEra | undefined {
    if (!generalId) return undefined;
    const fid = GENERAL_FACTION.get(generalId) ?? factionIdHint;
    const era = getFactionEraAt(fid, getGeneralEraYear(generalId));
    if (era) return era;
    return GENERAL_ERA[generalId];
}


