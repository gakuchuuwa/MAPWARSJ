/**
 * 势力时代表（factionId → 年份段 → 四时代）。
 *
 * 🔴🔴 [2026-11-09 主人令「按大部分年份改」——取代下面所有「分段」说法] **每个势力只有一个时代＝它存续年份大部分落在哪个时代**
 *    （按 FactionLifeYears 的起止年对四时代年段取重叠最长者；存续年不全的保留原时代）。势力底下所有武将都跟着这个时代走。
 *    武将本人年代与势力时代对不上 → 另建一个那个时代公认的政权／民族势力，把他挂过去（主人「对不上的可以新建势力」），
 *    不许再在一个势力里按年份拆段。例：李继迁属西夏（1038–1227）＝城堡时代。
 *
 * 🔴 2026-10-25 主人令：「武将有生卒登场年，势力有时代」「按史分年段」「这样能保证一个势力的人，都是一个军团」。
 *    · 时代归**势力**：一个势力在其同一段里只有一个时代 → 全势力的人走同一格（时代 × 据点文化）＝一支军团。
 *    · 时段只给「历史上确实换过军制」的政权（拜占庭军区→普罗尼亚、基辅罗斯→莫斯科、加齐突骑→苏丹亲兵…）；
 *      一朝一军的势力（宋＝宋军、大明＝明军、西夏＝铁鹞子、高丽＝三别班、辽＝皮室）整段只有一个时代。
 *    · 武将落在哪一段：取该将**经典战年（最知名那一战）**，无经典战年取登场年（生年+20，不晚于卒年）；两者皆无 → 保留 GeneralEra 原值。
 *    · 段界依据见各条注释（"按史 + 依据"）；未手裁的势力按该势力现存名将的成名年推定，只约束新增武将，不改现有武将。
 *    · 势力误挂的个别武将（战场人物/错挂政权）
 *
 * 改后武将的军团仍由 getLegionNameOfGeneral 按「时代 × 据点文化」自动取；唯一入口 getGeneralEra()。
 * 校验：scratch/_probe_faction_era_changes.mts（逐将打印旧→新时代，须全为修对）。
 *
 * 🔴 [2026-10-25 主人令]「应该给游戏中每一个势力挂一个时代」「包括以后要新增的势力，也要有」：
 *   · 四时代年段（全局定义）：古典＝起始–476｜封建＝476–1050｜城堡＝1050–1500｜帝国＝1500–1900。
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
    'jiaohuangguo': [{ from: -9999, era: 'castle' }], // 教皇国｜756 丕平献土—1500＝城堡时代罗马教廷军团；1500 后＝帝国时代意大利军团
    'yalan': [{ from: -9999, era: 'antiquity' }], // 亚兰（大马士革王国）｜前 10 世纪–前 732＝古典时代近东军团
    // 🔴 [2026-10-25 补齐·主人令「每个势力都要有时代」] 这三家只有据点、没有武将，此前漏登记：
    'jienei': [{ from: -9999, era: 'feudal' }], // 杰内｜加纳—马里商路商城（8–13 世纪，加纳帝国期入封建段）；势指针＝封建时代加纳军团
    'ghana_diguo': [{ from: -9999, era: 'feudal' }], // 加纳帝国｜瓦加杜加纳（约 300–1200，8–11 世纪盛期，马宁）；势指针＝封建时代加纳军团
    'cueva': [{ from: -9999, era: 'imperial' }], // 库埃瓦｜巴拿马科马格雷酋邦（1510 巴尔沃亚到访）＝帝国段；势指针＝帝国时代格查武士军团
    'song': [{ from: -9999, era: 'castle' }], // 宋国｜宋（960–1279）＝城堡时代中华军团（神臂弓/步人甲/斩马刀），北宋南宋同一支宋军
    'shunde': [{ from: -9999, era: 'imperial' }], // 顺德（宁王朱宸濠 1519）｜帝国时代 × 豫章 江南 = 帝国时代两江军团
    'jianwen': [{ from: -9999, era: 'imperial' }], // 建文（1399–1402）｜帝国时代 × 历下 河朔 = 帝国时代燕晋军团
    'ming_d': [{ from: -9999, era: 'imperial' }], // 大明｜大明（1368–1644）＝帝国时代中国军团（京营/神机/三眼铳），明初明末同为明军
    'dangxiang': [{ from: -9999, era: 'castle' }], // 大夏｜大夏·西夏（982–1227）＝城堡时代大夏军团（铁鹞子冷锻重甲/山讹）
    'goryeo': [{ from: -9999, era: 'castle' }], // 高丽｜高丽（918–1392）＝城堡时代高丽军团（三别抄/别武班）
    'liao_d': [{ from: -9999, era: 'feudal' }], // 大辽｜大辽（907–1125）＝封建时代漠南军团（皮室具装铁骑/铁林军）
    'houliao': [{ from: -9999, era: 'castle' }], // 东辽
    'xiliao': [{ from: -9999, era: 'castle' }], // 西辽
    'manzhou_d': [{ from: -9999, era: 'imperial' }], // 大清｜大清（1616–1912，含建州女真）＝帝国时代八旗军团
    'xixiliwangguo': [{ from: -9999, era: 'castle' }], // 西西里｜古典＝叙拉古城邦（阿加索克利）；476 后＝城堡时代诺曼军团 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'castle' }] → castle｜存续 1130–1816 大部分年份]
    'liangxixili': [{ from: -9999, era: 'imperial' }], // 两西西里王国（1816–1861）
    'abasi': [{ from: -9999, era: 'feudal' }], // 阿拔斯｜阿拔斯（750–1258）：封建＝哈里发军团（四大哈里发—阿拔斯黄金时代）；1050 塞尔柱入主巴格达 → 城堡时代撒拉森军团
    'womaya': [{ from: -9999, era: 'feudal' }], // 倭马亚｜倭马亚（661–1031）：封建＝哈里发军团；1050 后泰法/穆拉比特 → 城堡时代撒拉森军团
    'sashan': [{ from: -9999, era: 'antiquity' }], // 萨珊｜萨珊（224–476）：古典时代萨珊军团；476 后（卑路斯一世起）→ 封建时代霍拉桑军团
    'baizanting': [{ from: -9999, era: 'feudal' }], // 拜占庭｜东罗马早期（–476）＝古典时代拜占庭军团；军区制（476–1071）＝封建时代拜占庭军区军团；1071 曼齐克特后普罗尼亚制 → 城堡时代拜占庭军团 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }, { from: 1071, era: 'castle' }] → feudal｜存续 395–1453 大部分年份]
    'luoma_diguo': [{ from: -9999, era: 'antiquity' }], // 罗马帝国｜罗马帝国（–476）＝古典时代罗马军团
    'aqimeinide': [{ from: -9999, era: 'antiquity' }], // 阿契美尼德｜阿契美尼德（前550–前330）＝古典时代阿契美尼德军团
    'seljuq': [{ from: -9999, era: 'castle' }], // 塞尔柱｜塞尔柱（1037–1194）＝城堡时代加齐突骑军团（桑贾尔）
    'luosi': [{ from: -9999, era: 'castle' }], // 罗斯｜基辅罗斯（862–1240）＝封建时代基辅罗斯军团；1240 蒙古西征后（诺夫哥罗德/莫斯科）→ 城堡时代博亚尔重骑军团；1500 后莫斯科沙皇国 → 帝国时代俄罗斯军团 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1240, era: 'castle' }, { from: 1500, era: 'imperial' }] → castle｜存续 862–1240 大部分年份]
    'osman': [{ from: -9999, era: 'imperial' }], // 奥斯曼｜奥斯曼（1299–1453）＝城堡时代加齐突骑军团；1453 攻陷君士坦丁堡 → 帝国时代苏丹亲兵军团
    'bolan': [{ from: -9999, era: 'castle' }], // 波兰｜皮雅斯特早期（–1138）＝封建时代波兰尼军团；1138 分裂后—1569 → 城堡时代波兰王国军团；1569 卢布林联合 → 帝国时代波兰立陶宛军团 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1138, era: 'castle' }, { from: 1569, era: 'imperial' }] → castle｜存续 1025–1795 大部分年份]
    'mazhaer': [{ from: -9999, era: 'castle' }], // 匈牙利｜阿尔帕德（–1000）＝封建时代马扎尔骑射军团；1050—1526 → 城堡时代匈牙利王国军团；1526 莫哈奇之战后 → 帝国时代匈牙利军团（段界按四时代年段，2026-11-09） 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }, { from: 1526, era: 'imperial' }] → castle｜存续 1000–1918 大部分年份]
    'yinggelan': [{ from: -9999, era: 'castle' }], // 英格兰｜盎格鲁-撒克逊（–1066）＝封建时代盎格鲁撒克逊军团；1067 诺曼征服—1500 → 城堡时代英格兰军团；1500 都铎以后 → 帝国时代英格兰军团 🔴 [2026-11-07 按注释军制史落地：原只挂一段 castle，与注释和史实都不符，艾特尔弗里思（617）、阿尔弗雷德（899）被错算成城堡时代] 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1067, era: 'castle' }, { from: 1500, era: 'imperial' }] → castle｜存续 927–1707 大部分年份]
    'falanji': [{ from: -9999, era: 'feudal' }], // 法兰克｜晚期古典（–476）＝古典军团；墨洛温—加洛林（476–1100）＝封建时代法兰克军团；1100 后卡佩骑士 → 城堡时代法兰西骑士军团
    'gaolu': [{ from: -9999, era: 'castle' }], // 法兰西（别名高卢）｜古典＝高卢战团（维钦托利）；476–1500＝城堡时代法兰西骑士军团；1500 后＝帝国法兰西军团 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'castle' }, { from: 1500, era: 'imperial' }] → castle｜存续 987–1792 大部分年份]
    'menggu_d': [{ from: -9999, era: 'castle' }], // 蒙古｜蒙古（含 10 世纪孛端察儿—元—北元）＝城堡时代漠南蒙古军团；1500 后（达延汗—喀尔喀/卫拉特）→ 帝国时代漠南蒙古军团
    // ══════ 二、单时代势力（整段一个时代）══════
    'kilwa': [{ from: -9999, era: 'castle' }], // 基尔瓦苏丹国｜斯瓦希里海岸（约 957–1513），苏莱曼哈桑
    'mogadishu': [{ from: -9999, era: 'castle' }], // 摩加迪沙苏丹国｜索马里城邦（10–16 世纪），阿布伯克尔
    'malindi': [{ from: -9999, era: 'castle' }], // 马林迪｜斯瓦希里城邦（1414 遣使明朝）＝城堡段；ETHIOPIANS × 城堡＝城堡时代埃塞俄比亚军团
    'hulumusi': [{ from: -9999, era: 'castle' }], // 忽鲁谟斯｜霍尔木兹王国（13–17 世纪，扼波斯湾口；郑和四至忽鲁谟斯）＝城堡段（既有缺口补齐）
    'zuraid': [{ from: -9999, era: 'castle' }], // 祖拉伊德｜亚丁王朝（1083–1174），亚西尔
    'aboerleiya': [{ from: -9999, era: 'castle' }], // 阿尔博雷亚
    'adal': [{ from: -9999, era: 'castle' }], // 阿达尔 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1415–1577 大部分年份]
    'adile': [{ from: -9999, era: 'imperial' }], // 阿迪勒
    'adiyabeina': [{ from: -9999, era: 'antiquity' }], // 阿迪亚贝纳
    'aertai': [{ from: -9999, era: 'castle' }], // 阿尔泰
    'aguelabu': [{ from: -9999, era: 'feudal' }], // 阿格拉布
    'ahaomu': [{ from: -9999, era: 'imperial' }], // 阿豪姆
    'aiaoniya': [{ from: -9999, era: 'antiquity' }], // 爱奥尼亚
    'aiji': [{ from: -9999, era: 'antiquity' }], // 埃及
    'ailan': [{ from: -9999, era: 'antiquity' }], // 埃兰
    'ailao': [{ from: -9999, era: 'antiquity' }], // 哀牢
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
    'aquidan': [{ from: -9999, era: 'feudal' }], // 阿奎丹｜阿基坦公国（奥多 650–735，721 图卢兹之战）＝封建时代法兰克军团
    'arakan': [{ from: -9999, era: 'imperial' }], // 阿拉干
    'ashikaga': [{ from: -9999, era: 'castle' }], // 室町
    'yamato': [{ from: -9999, era: 'feudal' }], // 大和（大和朝廷·平安时代；坂上田村麻吕 758–811）
    'asikanani': [{ from: -9999, era: 'castle' }], // 勃兰登堡藩侯国
    'aswaka': [{ from: -9999, era: 'antiquity' }], // 阿斯瓦卡
    'ava': [{ from: -9999, era: 'castle' }], // 阿瓦王国
    'aztec': [{ from: -9999, era: 'castle' }], // 阿兹特克 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1325–1521 大部分年份]
    'ba': [{ from: -9999, era: 'antiquity' }], // 巴国
    'badakhshan': [{ from: -9999, era: 'imperial' }], // 达克
    'baibo': [{ from: -9999, era: 'antiquity' }], // 黄巾
    'baidi': [{ from: -9999, era: 'antiquity' }], // 白狄
    'baiji': [{ from: -9999, era: 'antiquity' }], // 百济 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -18–660 大部分年份]
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
    'bogendi_wangguo': [{ from: -9999, era: 'feudal' }], // 勃艮第王国（411–534：古典 411–476 → 封建 476–534） 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }] → feudal｜存续 411–1032 大部分年份]
    'bohai': [{ from: -9999, era: 'feudal' }], // 渤海
    'boootiya': [{ from: -9999, era: 'antiquity' }], // 底比斯
    'boren': [{ from: -9999, era: 'imperial' }], // 都掌蛮
    'bosi_puluosi': [{ from: -9999, era: 'antiquity' }], // 博斯普鲁斯
    'bosiniya': [{ from: -9999, era: 'castle' }], // 波斯尼亚
    'boximiya': [{ from: -9999, era: 'imperial' }], // 波西米亚｜城堡 → 1500 起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }] → imperial｜存续 1198–1918 大部分年份]
    'bulabante': [{ from: -9999, era: 'castle' }], // 布拉班特
    'bulu': [{ from: -9999, era: 'antiquity' }], // 波鲁斯
    'buni': [{ from: -9999, era: 'antiquity' }], // 迦太基
    'buriat': [{ from: -9999, era: 'imperial' }], // 布里亚特
    'buyi_d': [{ from: -9999, era: 'imperial' }], // 布依
    'cen_d': [{ from: -9999, era: 'imperial' }], // 岑氏
    'chagatai': [{ from: -9999, era: 'antiquity' }], // 车师
    'chamorro': [{ from: -9999, era: 'castle' }], // 查莫罗 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 800–1695 大部分年份]
    'chanka': [{ from: -9999, era: 'castle' }], // 昌卡
    'chen': [{ from: -9999, era: 'feudal' }], // 陈国
    'chendiaoyan': [{ from: -9999, era: 'castle' }], // 陈吊
    'chenghan': [{ from: -9999, era: 'antiquity' }], // 成汉
    'chengjia': [{ from: -9999, era: 'antiquity' }], // 成家
    'chenla': [{ from: -9999, era: 'feudal' }], // 真腊｜封建（阇耶跋摩二世 802）→ 城堡（吴哥王朝）
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
    'suweihui': [{ from: -9999, era: 'feudal' }], // 苏维汇｜按史分段：部落期古典 → 409 起王国封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 409, era: 'feudal' }] → feudal｜存续 409–585 大部分年份]
    'yibiluliya': [{ from: -9999, era: 'antiquity' }], // 伊比利亚王国（前 3 世纪起）
    'yicha': [{ from: -9999, era: 'imperial' }], // 伊察 🔴[2026-11-09 主人「势力对照年代，要用年份长的，知名度高的」] 存续 1194–1697 按年数是城堡，但伊察以玛雅最后一个独立王国闻名（1697 卡内克降西班牙）→ 帝国
    'mengjiala': [{ from: -9999, era: 'castle' }], // 孟加拉苏丹国（1342 起）
    'yili': [{ from: -9999, era: 'antiquity' }], // 伊利里亚（巴托起义，前 6 年）
    'daqiya': [{ from: -9999, era: 'antiquity' }], // 达契亚（布雷比斯塔）
    'qiajia': [{ from: -9999, era: 'imperial' }], // 恺加王朝（1796 起）
    'arevaci': [{ from: -9999, era: 'antiquity' }], // 阿雷瓦西（凯尔特伊比利亚部落，努曼提亚）
    'epirus_despotate': [{ from: -9999, era: 'castle' }], // 伊庇鲁斯专制国｜存续 1205–1479 大部分年份
    'teotihuacan': [{ from: -9999, era: 'antiquity' }], // 特奥蒂瓦坎｜存续 -100–550 大部分年份
    'salakanagara': [{ from: -9999, era: 'antiquity' }], // 萨拉卡那加拉（传说王国）｜存续 130–362 大部分年份
    'kartli_kakheti': [{ from: -9999, era: 'imperial' }], // 卡特利-卡赫季王国（赫拉克留二世）｜存续 1762–1801 大部分年份
    'helvetii': [{ from: -9999, era: 'antiquity' }], // 赫尔维蒂人（迪维科）｜存续 -200–-58 大部分年份
    'hussites': [{ from: -9999, era: 'castle' }], // 胡斯派（杨·杰士卡）｜存续 1419–1434 大部分年份
    'cherusci': [{ from: -9999, era: 'antiquity' }], // 切鲁西部落（阿米尼乌斯）｜存续 -60–100 大部分年份
    'sweden_medieval': [{ from: -9999, era: 'castle' }], // 中世纪瑞典王国｜存续 1164–1523 大部分年份
    'rus_khaganate': [{ from: -9999, era: 'feudal' }], // 罗斯汗国（留里克，拉多加—诺夫哥罗德）｜存续 830–882 大部分年份
    'byzantium_late': [{ from: -9999, era: 'castle' }], // 晚期拜占庭（科穆宁—巴列奥略）｜存续 1081–1453 大部分年份
    'bulgaria_second': [{ from: -9999, era: 'castle' }], // 第二保加利亚帝国（阿森王朝）｜存续 1185–1396 大部分年份
    'poland_duchy': [{ from: -9999, era: 'feudal' }], // 皮雅斯特波兰公国｜存续 960–1025 大部分年份
    'saxony_electorate': [{ from: -9999, era: 'imperial' }], // 萨克森选侯国｜存续 1356–1806 大部分年份
    'portugal_medieval': [{ from: -9999, era: 'castle' }], // 中世纪葡萄牙王国（勃艮第—阿维斯）｜存续 1139–1495 大部分年份
    'denmark_norway': [{ from: -9999, era: 'imperial' }], // 丹麦-挪威联合王国｜存续 1524–1814 大部分年份
    'denmark_medieval': [{ from: -9999, era: 'castle' }], // 中世纪丹麦王国（含卡尔马联盟）｜存续 1047–1523 大部分年份
    'scotland_stuart': [{ from: -9999, era: 'imperial' }], // 斯图亚特苏格兰｜存续 1371–1707 大部分年份
    'england_modern': [{ from: -9999, era: 'imperial' }], // 近代英格兰（都铎—斯图亚特）｜存续 1485–1707 大部分年份
    'rashtrakuta': [{ from: -9999, era: 'feudal' }], // 拉什特拉库塔王朝（阿目佉跋沙）｜存续 753–982 大部分年份
    'andean_rebellion': [{ from: -9999, era: 'imperial' }], // 1780 年安第斯大起义（托马斯·卡塔里）｜存续 1780–1783 大部分年份
    'abkhazia_kingdom': [{ from: -9999, era: 'feudal' }], // 阿布哈兹王国（巴格拉特三世）｜存续 778–1008 大部分年份
    'early_wokou': [{ from: -9999, era: 'castle' }], // 前期倭寇（阿只拔都）｜存续 1350–1400 大部分年份
    'mac_dynasty': [{ from: -9999, era: 'imperial' }], // 莫朝｜存续 1527–1677 大部分年份
    'restored_hanthawaddy': [{ from: -9999, era: 'imperial' }], // 复兴汉达瓦底（彬尼亚达拉）｜存续 1740–1757 大部分年份
    'mamunid': [{ from: -9999, era: 'feudal' }], // 马蒙王朝（花剌子模）｜存续 995–1017 大部分年份
    // 🔴 [2026-11-09 主人令「建州女真和大清势力合并」] 原 'jianzhou': [{ from: -9999, era: 'imperial' }] 已删（并入大清）
    'bashkir': [{ from: -9999, era: 'imperial' }], // 巴什基尔起义（卡拉萨卡尔）｜存续 1550–1798 大部分年份
    'drevlians': [{ from: -9999, era: 'feudal' }], // 德列夫利安人｜存续 600–946 大部分年份
    'mongol_ancient': [{ from: -9999, era: 'feudal' }], // 蒙兀室韦（孛端察儿）｜存续 700–1130 大部分年份
    'marcomanni': [{ from: -9999, era: 'antiquity' }], // 马科曼尼（马罗博杜斯）｜存续 -100–400 大部分年份
    'serbia_revolution': [{ from: -9999, era: 'imperial' }], // 塞尔维亚革命（辛格利奇）｜存续 1804–1817 大部分年份
    'caledonia': [{ from: -9999, era: 'antiquity' }], // 喀里多尼亚部族（卡尔加库斯）｜存续 1–300 大部分年份
    'goths_migration': [{ from: -9999, era: 'antiquity' }], // 迁徙期哥特人（贝里格、亚拉里克、阿陶尔夫）｜存续 150–418 大部分年份
    'syracuse': [{ from: -9999, era: 'antiquity' }], // 叙拉古（阿加索克利）｜存续 -734–-212 大部分年份
    'hamdanid': [{ from: -9999, era: 'feudal' }], // 哈姆丹王朝（赛弗道莱）｜存续 890–1004 大部分年份
    'wiman_joseon': [{ from: -9999, era: 'antiquity' }], // 卫满朝鲜｜存续 -194–-108 大部分年份
    'gusiluo': [{ from: -9999, era: 'castle' }], // 唃厮啰政权（青唐吐蕃）｜存续 1008–1104 大部分年份
    'yarlung': [{ from: -9999, era: 'antiquity' }], // 雅砻部落（吐蕃前身）｜存续 -127–618 大部分年份
    'old_saxons': [{ from: -9999, era: 'feudal' }], // 古撒克逊人｜存续 150–804 大部分年份
    'alamanni': [{ from: -9999, era: 'antiquity' }], // 阿勒曼尼部落联盟｜存续 213–496 大部分年份
    'magyar_tribes': [{ from: -9999, era: 'feudal' }], // 马扎尔部落联盟（阿尔帕德）｜存续 830–1000 大部分年份
    'taifa_toledo': [{ from: -9999, era: 'feudal' }], // 托莱多泰法王国｜存续 1035–1085 大部分年份
    'florence': [{ from: -9999, era: 'castle' }], // 佛罗伦萨共和国（美第奇）｜存续 1115–1532 大部分年份
    'tuitonga': [{ from: -9999, era: 'castle' }], // 汤加帝国（图伊汤加）｜存续 950–1865 大部分年份
    'rapanui': [{ from: -9999, era: 'castle' }], // 拉帕努伊（复活节岛）｜存续 1000–1888 大部分年份
    'later_baekje': [{ from: -9999, era: 'feudal' }], // 后百济（甄萱）｜存续 892–936 大部分年份
    'arverni': [{ from: -9999, era: 'antiquity' }], // 阿维尔尼（高卢部族，维钦托利）｜存续 -200–-52 大部分年份
    'france_modern': [{ from: -9999, era: 'imperial' }], // 近代法兰西（弗朗索瓦一世起至第二帝国）｜存续 1515–1870 大部分年份
    'imro': [{ from: -9999, era: 'imperial' }], // 内马其顿革命组织（代尔切夫）｜存续 1893–1934 大部分年份
    'bulgaria_third': [{ from: -9999, era: 'imperial' }], // 第三保加利亚国家（含解放运动）｜存续 1878–1946 大部分年份
    'later_le': [{ from: -9999, era: 'imperial' }], // 后黎朝（蓝山起义）｜存续 1428–1789 大部分年份
    'aksum': [{ from: -9999, era: 'feudal' }], // 阿克苏姆王国｜存续 100–940 大部分年份
    'castile_county': [{ from: -9999, era: 'feudal' }], // 卡斯蒂利亚伯国（费尔南·冈萨雷斯）｜存续 850–1065 大部分年份
    'milan_duchy': [{ from: -9999, era: 'imperial' }], // 米兰公国（斯福尔扎）｜存续 1395–1797 大部分年份
    'lombard_league': [{ from: -9999, era: 'castle' }], // 伦巴第联盟（北意大利城邦同盟）｜存续 1167–1250 大部分年份
    'cilicia_armenia': [{ from: -9999, era: 'castle' }], // 奇里乞亚亚美尼亚（鲁本王朝）｜存续 1080–1375 大部分年份
    'armenia_arsacid': [{ from: -9999, era: 'antiquity' }], // 阿萨息斯王朝亚美尼亚（瓦尔丹）｜存续 12–428 大部分年份
    'syunik_bek': [{ from: -9999, era: 'imperial' }], // 休尼克亚美尼亚起义（达维德·贝克）｜存续 1722–1730 大部分年份
    'northumbria': [{ from: -9999, era: 'feudal' }], // 诺森布里亚王国｜存续 593–954 大部分年份
    'wessex': [{ from: -9999, era: 'feudal' }], // 威塞克斯王国（阿尔弗雷德大王）｜存续 519–927 大部分年份
    'subroman_britain': [{ from: -9999, era: 'feudal' }], // 后罗马时代的布立吞诸王国（亚瑟王传说）｜存续 410–600 大部分年份
    'xinmeiliyan': [{ from: -9999, era: 'antiquity' }], // 辛梅里安（黑海北岸游牧民，图格达梅）
    'aixini': [{ from: -9999, era: 'antiquity' }], // 爱西尼（不列颠东部凯尔特部族，布狄卡）
    'taluma': [{ from: -9999, era: 'feudal' }], // 塔鲁玛迦拉（西爪哇，5 世纪） 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }] → feudal｜存续 358–669 大部分年份]
    'cheshihou': [{ from: -9999, era: 'antiquity' }], // 乌垒
    'chimei': [{ from: -9999, era: 'antiquity' }], // 赤眉
'zhangchu': [{ from: -9999, era: 'antiquity' }], // 张楚
'desheng': [{ from: -9999, era: 'castle' }], // 德胜（1465）
    // 🔴 [2026-11-05 按A执行] 'wuzhou_yijun'（婺州义军）已并入隋国，时代随本家
    'choros': [{ from: -9999, era: 'imperial' }], // 萨吾尔 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1417–1635 大部分年份]
    'chosokabe': [{ from: -9999, era: 'imperial' }], // 土佐
    'chuguo': [{ from: -9999, era: 'antiquity' }], // 楚国
    'chuyue': [{ from: -9999, era: 'feudal' }], // 处月
    // 🔴 [2026-11-04] 'daca'（八宿寺）已并入甘丹颇章，时代随本家
    'dacheng': [{ from: -9999, era: 'imperial' }], // 大成
    'dada_ming': [{ from: -9999, era: 'imperial' }], // 鞑靼 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1402–1635 大部分年份]
    'dai': [{ from: -9999, era: 'imperial' }], // 傣族 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1180–1950 大部分年份]
    'dajin': [{ from: -9999, era: 'castle' }], // 大金
    'dalriada': [{ from: -9999, era: 'feudal' }], // 达尔里阿达
    // 🔴 [2026-11-04] 'dalung'（类乌齐宗）已并入甘丹颇章，时代随本家
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
    'dong': [{ from: -9999, era: 'imperial' }], // 隆庆 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1175–1955 大部分年份]
    'donggete': [{ from: -9999, era: 'feudal' }], // 东哥特 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }] → feudal｜存续 493–553 大部分年份]
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
    'erzhu': [{ from: -9999, era: 'feudal' }], // 尔朱
    'ewenki': [{ from: -9999, era: 'imperial' }], // 鄂温克
    'fangguozhen': [{ from: -9999, era: 'castle' }], // 方国珍
    'fangla': [{ from: -9999, era: 'castle' }], // 圣公
    'fanyanna': [{ from: -9999, era: 'feudal' }], // 梵衍那｜4–8 世纪佛教小国（巴米扬），8 世纪为阿拉伯所并 → 封建时代（476–1050）；🔴 [2026-11-08 主人令「改时代＋改人物年份」]
    'feierganna': [{ from: -9999, era: 'castle' }], // 费尔干纳
    'feilisidin': [{ from: -9999, era: 'antiquity' }], // 非利士
    'feiyaka': [{ from: -9999, era: 'imperial' }], // 费雅喀
    'fuguo': [{ from: -9999, era: 'feudal' }], // 附国
    'fujiwara': [{ from: -9999, era: 'castle' }], // 奥州
    'fulandesi': [{ from: -9999, era: 'castle' }], // 阿图瓦
    'fulijiya': [{ from: -9999, era: 'antiquity' }], // 弗里吉亚
    'funan': [{ from: -9999, era: 'antiquity' }], // 扶南
    'fushi': [{ from: -9999, era: 'antiquity' }], // 苻秦
    'fuyu': [{ from: -9999, era: 'antiquity' }], // 夫余
    'galangdiba': [{ from: -9999, era: 'imperial' }], // 波密
    'gaochang': [{ from: -9999, era: 'feudal' }], // 麴氏
    'gaoche': [{ from: -9999, era: 'feudal' }], // 高车（敕勒）450–505，多数年在 476 后 → 封建（2026-11-03 主人定）
    'gaogouli': [{ from: -9999, era: 'antiquity' }], // 高句丽 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -37–668 大部分年份]
    'gaoqi_d': [{ from: -9999, era: 'feudal' }], // 北齐
    'gar_kham': [{ from: -9999, era: 'imperial' }], // 德司
    'gaya': [{ from: -9999, era: 'antiquity' }], // 伽倻
    'gelujiya': [{ from: -9999, era: 'castle' }], // 格鲁吉亚｜城堡 → 1500 起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }] → castle｜存续 1008–1801 大部分年份]
    'geluolu': [{ from: -9999, era: 'feudal' }], // 葛逻禄
    'genji': [{ from: -9999, era: 'castle' }], // 源氏
    'genji_iyo': [{ from: -9999, era: 'castle' }], // 伊予源氏
    'gesake': [{ from: -9999, era: 'imperial' }], // 哥萨克
    'gling': [{ from: -9999, era: 'castle' }], // 玉树
    'golog': [{ from: -9999, era: 'imperial' }], // 果洛
    'gongsun_d': [{ from: -9999, era: 'antiquity' }], // 辽东
    'gouding': [{ from: -9999, era: 'antiquity' }], // 句町
    'gualani': [{ from: -9999, era: 'imperial' }], // 瓜拉尼
    'guanche': [{ from: -9999, era: 'castle' }], // 关切人
    'guishuang': [{ from: -9999, era: 'antiquity' }], // 贵霜
    'guiyi': [{ from: -9999, era: 'feudal' }], // 归义
    'gujarat': [{ from: -9999, era: 'castle' }], // 古吉拉特苏丹国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1394–1573 大部分年份]
    'gulaishi': [{ from: -9999, era: 'feudal' }], // 古莱什部落
    'gurkha': [{ from: -9999, era: 'imperial' }], // 廓喀
    'habusibao': [{ from: -9999, era: 'imperial' }], // 哈布斯堡｜城堡 → 1500 起帝国
    'haikou': [{ from: -9999, era: 'imperial' }], // 海寇
    'haixi_nvzhen': [{ from: -9999, era: 'imperial' }], // 海西
    'hamade': [{ from: -9999, era: 'castle' }], // 哈马德王朝 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → castle｜存续 1014–1152 大部分年份]
    'han': [{ from: -9999, era: 'antiquity' }], // 韩国
    'han_d': [{ from: -9999, era: 'antiquity' }], // 汉国
    'handong': [{ from: -9999, era: 'feudal' }], // 汉东（刘黑闼）
    'douxia': [{ from: -9999, era: 'feudal' }], // 夏（窦建德）
    'mari_ancient': [{ from: -9999, era: 'antiquity' }], // 幼发拉底马里
    'han_zhao': [{ from: -9999, era: 'antiquity' }], // 汉赵
    'hantawadi': [{ from: -9999, era: 'castle' }], // 汉达瓦底 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1287–1539 大部分年份]
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
    'huangwang': [{ from: -9999, era: 'feudal' }], // 黄王
    'huarazim': [{ from: -9999, era: 'castle' }], // 花剌子模
    'hui': [{ from: -9999, era: 'antiquity' }], // 濊族
    'huihu': [{ from: -9999, era: 'feudal' }], // 回鹘
    // 🔴 [2026-11-05 按史修复] 甘州回鹘史实起年为 894（唐昭宗乾宁元年据甘州立国），但 FACTION_ERA 的时代段**首段一律从 -9999 起**（全库口径，无年武将/无首战年者靠首段落段），故此处记 -9999；历史起讫年仍由 FactionLifeYears 记 894–1036
    'ganzhou_huihu': [{ from: -9999, era: 'feudal' }],
    // 🔴 [2026-11-01 按史] 甘州回鹘｜894 年（唐昭宗乾宁元年）据甘州立国—1036 年为西夏所灭，全段封建
    'huite': [{ from: -9999, era: 'imperial' }], // 辉特
    'huluo': [{ from: -9999, era: 'castle' }], // 古尔
    'huohengsuolun': [{ from: -9999, era: 'imperial' }], // 勃兰登堡-普鲁士 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1618–1701 大部分年份]
    'iga_d': [{ from: -9999, era: 'imperial' }], // 伊贺
    'imagawa': [{ from: -9999, era: 'imperial' }], // 今川
    'jialatai': [{ from: -9999, era: 'antiquity' }], // 加拉太
    'jialedi': [{ from: -9999, era: 'antiquity' }], // 迦勒底
    'jiashi_d': [{ from: -9999, era: 'antiquity' }], // 迦尸国
    'jiatailuoniya': [{ from: -9999, era: 'castle' }], // 加泰罗尼亚 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → castle｜存续 878–1714 大部分年份]
    'jie': [{ from: -9999, era: 'antiquity' }], // 羯族 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 319–351 大部分年份]
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
    'kala': [{ from: -9999, era: 'feudal' }], // 喀喇汗｜🔴 [2026-11-07 按史分段] 840–1050 部族征召军（萨图克一朝＝封建时代安西军团）；1050 后西支受塞尔柱影响行伊克塔／古拉姆，军制已变 → 城堡时代；末王奥斯曼 1212 撒马尔罕归此段 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }] → feudal｜存续 840–1212 大部分年份]
    'kalinga': [{ from: -9999, era: 'antiquity' }], // 羯陵伽
    'kaliya': [{ from: -9999, era: 'antiquity' }], // 卡里亚
    'kanan': [{ from: -9999, era: 'antiquity' }], // 推罗
    'kanata': [{ from: -9999, era: 'castle' }], // 维查耶纳伽尔 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1336–1646 大部分年份]
    'kapaduoxiya': [{ from: -9999, era: 'antiquity' }], // 卡帕多细亚
    'karmapa': [{ from: -9999, era: 'imperial' }], // 噶玛
    'kawusi': [{ from: -9999, era: 'imperial' }], // 卡乌斯
    'kazakh': [{ from: -9999, era: 'imperial' }], // 哈萨
    'keerkezi': [{ from: -9999, era: 'feudal' }], // 柯尔克孜
    'keernuwaye': [{ from: -9999, era: 'feudal' }], // 康沃尔（5 世纪末不列颠地方政权）→ 封建（2026-11-03 主人定）
    'keerqin': [{ from: -9999, era: 'imperial' }], // 科尔沁
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
    'ladakh': [{ from: -9999, era: 'castle' }], // 玛域 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 930–1842 大部分年份]
    'lagoniya': [{ from: -9999, era: 'antiquity' }], // 斯巴达
    'lagusa': [{ from: -9999, era: 'castle' }], // 达尔马提亚
    'lancang': [{ from: -9999, era: 'imperial' }], // 澜沧 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1354–1707 大部分年份]
    'lang_clan': [{ from: -9999, era: 'castle' }], // 帕竹朗
    'ldiya': [{ from: -9999, era: 'antiquity' }], // 吕底亚
    'liang_shuofang': [{ from: -9999, era: 'feudal' }], // 鸣凤（萧铣，国号梁，617–621，封建段）
    'liangshidu': [{ from: -9999, era: 'feudal' }], // 永隆（梁师都，国号梁，617–628，封建段）
    'liaozu': [{ from: -9999, era: 'imperial' }], // 寮族
    'linshihong': [{ from: -9999, era: 'feudal' }], // 干越
    'liusong': [{ from: -9999, era: 'antiquity' }], // 刘宋（420–479）＝封建时代（2026-11-03 主人定，原误判古典） 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 420–479 大部分年份]
    'liuzhen': [{ from: -9999, era: 'feudal' }], // 六镇
    'longwu': [{ from: -9999, era: 'imperial' }], // 隆武
    'loulan': [{ from: -9999, era: 'antiquity' }], // 楼兰
    'luchuan': [{ from: -9999, era: 'castle' }], // 麓川
    'lujian': [{ from: -9999, era: 'imperial' }], // 鲁监
    'luohu': [{ from: -9999, era: 'feudal' }], // 罗斛 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → feudal｜存续 648–1388 大部分年份]
    'luomu': [{ from: -9999, era: 'castle' }], // 罗姆
    'luoyue': [{ from: -9999, era: 'antiquity' }], // 骆越
    'lvbu': [{ from: -9999, era: 'antiquity' }], // 徐州（吕布）
    'machu': [{ from: -9999, era: 'feudal' }], // 马楚
    'mahan': [{ from: -9999, era: 'antiquity' }], // 马韩
    'maidina': [{ from: -9999, era: 'feudal' }], // 拉希顿
    'maixiya': [{ from: -9999, era: 'feudal' }], // 麦西亚
    'malacca': [{ from: -9999, era: 'castle' }], // 满剌加
    'malai': [{ from: -9999, era: 'castle' }], // 马来
    'mallabhum': [{ from: -9999, era: 'castle' }], // 末罗王国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 694–1806 大部分年份]
    'malli': [{ from: -9999, era: 'antiquity' }], // 马利
    'mamuluke': [{ from: -9999, era: 'castle' }], // 马穆鲁克
    'manding': [{ from: -9999, era: 'castle' }], // 马里
    'mangshi': [{ from: -9999, era: 'feudal' }], // 土库曼
    'mangsite': [{ from: -9999, era: 'antiquity' }], // 芒斯特 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -100–1118 大部分年份]
    'manzheboyi': [{ from: -9999, era: 'castle' }], // 满者伯夷
    'mapuche': [{ from: -9999, era: 'imperial' }], // 马普切
    'maqidun': [{ from: -9999, era: 'antiquity' }],
    'sesali': [{ from: -9999, era: 'antiquity' }], // 色萨利（古典）
    'maya': [{ from: -9999, era: 'feudal' }], // 玛雅｜按史分段：古典期 → 476 起封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }] → feudal｜存续 100–900 大部分年份]
    'maynila': [{ from: -9999, era: 'imperial' }], // 马尼拉土邦
    'medang': [{ from: -9999, era: 'feudal' }], // 马打蓝
    'meikelunbao': [{ from: -9999, era: 'castle' }], // 文德
    'meitai': [{ from: -9999, era: 'imperial' }], // 曼尼普尔
    'miandian': [{ from: -9999, era: 'castle' }], // 缅甸 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 849–1885 大部分年份]
    'miaomin': [{ from: -9999, era: 'imperial' }], // 苗民
    'midi': [{ from: -9999, era: 'antiquity' }], // 米底
    'min': [{ from: -9999, era: 'feudal' }], // 闽国
    'minangkabau': [{ from: -9999, era: 'imperial' }], // 米南加保 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1347–1833 大部分年份]
    'ming_zheng': [{ from: -9999, era: 'imperial' }], // 明郑
    'minyue': [{ from: -9999, era: 'antiquity' }], // 闽越
    'moerdaweiya': [{ from: -9999, era: 'imperial' }], // 摩尔达维亚 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1346–1859 大部分年份]
    'mojietuo': [{ from: -9999, era: 'antiquity' }], // 摩揭陀王国
    'mombasa': [{ from: -9999, era: 'imperial' }], // 蒙巴萨苏丹国
    'mon': [{ from: -9999, era: 'feudal' }], // 孟族 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → feudal｜存续 400–1057 大部分年份]
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
    'otomo_d': [{ from: -9999, era: 'castle' }], // 大友 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1336–1600 大部分年份]
    'ouchi': [{ from: -9999, era: 'imperial' }], // 大内
    'ouka': [{ from: -9999, era: 'castle' }], // 奥卡
    'ouyue': [{ from: -9999, era: 'antiquity' }], // 瓯越
    'paermila': [{ from: -9999, era: 'antiquity' }], // 帕尔米拉
    'pagan': [{ from: -9999, era: 'castle' }], // 缅国
    'paiwan': [{ from: -9999, era: 'imperial' }], // 排湾
    'pajiama': [{ from: -9999, era: 'antiquity' }], // 帕加马
    'pandiya': [{ from: -9999, era: 'antiquity' }], // 潘地亚 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → antiquity｜存续 -300–1650 大部分年份]
    'peilieya_gongguo': [{ from: -9999, era: 'castle' }], // 佩列公国
    'piketai': [{ from: -9999, era: 'feudal' }], // 皮克特｜–∞起古典（罗马时期喀里多尼亚/皮克特）→ 476起封建（皮克特王国） // 皮克特 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }] → feudal｜存续 297–900 大部分年份]
    'pisha': [{ from: -9999, era: 'antiquity' }], // 毗沙 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -300–1006 大部分年份]
    'pishan': [{ from: -9999, era: 'antiquity' }], // 皮山
    'pomeilaniya': [{ from: -9999, era: 'castle' }], // 波美拉尼亚
    'pufaerci': [{ from: -9999, era: 'castle' }], // 普法尔茨
    'puluowangsi': [{ from: -9999, era: 'castle' }], // 普罗旺斯
    'pusikefu_gongheguo': [{ from: -9999, era: 'castle' }], // 伟利卡亚
    // 🔴 [2026-11-01 补缺格] 骠族｜按史分段：古典＝骠国城邦期（毗湿奴城前 200–室利差罗 4–5 世纪为都）→ 476 起封建（室利差罗盛期至骠国 9 世纪）
    'pyu': [{ from: -9999, era: 'antiquity' }], // 骠族｜骠国城邦（室利差罗 2–9 世纪）：古典（–476）→ 476 起封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }] → antiquity｜存续 -200–832 大部分年份]
    'qi': [{ from: -9999, era: 'antiquity' }], // 齐国
    'qianhui': [{ from: -9999, era: 'imperial' }], // 回军
    'qianliang': [{ from: -9999, era: 'antiquity' }], // 前凉
    'qianshu': [{ from: -9999, era: 'feudal' }], // 前蜀
    'qiemo': [{ from: -9999, era: 'antiquity' }], // 且末
    'qiepantuo': [{ from: -9999, era: 'feudal' }], // 护密
    'qiernigeweifu_gongguo': [{ from: -9999, era: 'castle' }], // 杰斯纳 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → castle｜存续 1024–1402 大部分年份]
    'qifu_d': [{ from: -9999, era: 'antiquity' }], // 乞伏
    'qimu': [{ from: -9999, era: 'castle' }], // 奇穆｜按史分段：900–1050 封建 → 1050 起城堡 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }] → castle｜存续 900–1470 大部分年份]
    'qin': [{ from: -9999, era: 'antiquity' }], // 秦国
    'qiong': [{ from: -9999, era: 'antiquity' }], // 邛谷
    'qiuchi': [{ from: -9999, era: 'antiquity' }], // 仇池
    'qiuci': [{ from: -9999, era: 'antiquity' }], // 龟兹
    'qiufu': [{ from: -9999, era: 'feudal' }], // 剡中
    'qutb_shahi': [{ from: -9999, era: 'imperial' }], // 库特布朝
    'ranwei_d': [{ from: -9999, era: 'antiquity' }], // 冉魏
    'ruishi': [{ from: -9999, era: 'imperial' }], // 瑞士 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1291–1798 大部分年份]
    'ruoqiang': [{ from: -9999, era: 'antiquity' }], // 婼羌
    'saerbadaer': [{ from: -9999, era: 'castle' }], // 萨尔巴达尔
    'safuyi': [{ from: -9999, era: 'castle' }], // 萨伏伊
    'saierweiya': [{ from: -9999, era: 'castle' }], // 塞尔维亚
    'saimien': [{ from: -9999, era: 'feudal' }], // 塞米恩
    'saipulusi': [{ from: -9999, era: 'castle' }], // 塞浦路斯
    'saman': [{ from: -9999, era: 'feudal' }], // 萨曼
    'samtskhe': [{ from: -9999, era: 'castle' }], // 萨姆茨赫
    'sanada': [{ from: -9999, era: 'imperial' }], // 真田
    'sanfoqi': [{ from: -9999, era: 'feudal' }], // 三佛齐
    'scotland': [{ from: -9999, era: 'castle' }], // 苏格兰｜–∞起城堡 → 1500起帝国（高地时代/詹姆斯党起义） // 苏格兰 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }] → castle｜存续年不全，取武将最多的时代]
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
    'shiwaben': [{ from: -9999, era: 'castle' }], // 施瓦本 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → castle｜存续 915–1268 大部分年份]
    'shiwei': [{ from: -9999, era: 'feudal' }], // 室韦
    'shiyuzu': [{ from: -9999, era: 'antiquity' }], // 食鱼族
    'shoni': [{ from: -9999, era: 'castle' }], // 少弐
    'shu': [{ from: -9999, era: 'antiquity' }], // 蜀国
    'shuizu': [{ from: -9999, era: 'imperial' }], // 水族
    'shunga': [{ from: -9999, era: 'antiquity' }], // 巽伽
    'shuntian': [{ from: -9999, era: 'imperial' }], // 天地会
    'siam': [{ from: -9999, era: 'imperial' }], // 暹罗
    'sijitai': [{ from: -9999, era: 'antiquity' }], // 斯基泰
    'so': [{ from: -9999, era: 'imperial' }], // 对马
    'goto': [{ from: -9999, era: 'imperial' }], // 五岛｜宇久氏/五岛氏（战国—江户水军大名，1592 文禄之役、1603 福江藩）＝帝国时代；JAPAN × 帝国＝帝国时代武家军团
    'omura': [{ from: -9999, era: 'imperial' }], // 大村｜大村氏（肥前领主，1571 长崎开港、1580 献长崎予耶稣会）＝帝国时代；JAPAN × 帝国＝帝国时代武家军团
    'sou': [{ from: -9999, era: 'antiquity' }], // 越嶲夷
    'sui': [{ from: -9999, era: 'feudal' }], // 隋国
    'suke': [{ from: -9999, era: 'castle' }], // 素可泰
    'sulu': [{ from: -9999, era: 'imperial' }], // 苏禄 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1405–1915 大部分年份]
    'sumeier': [{ from: -9999, era: 'antiquity' }], // 乌鲁克
    'sunite': [{ from: -9999, era: 'imperial' }], // 苏尼特
    'sunwu_d': [{ from: -9999, era: 'antiquity' }], // 孙吴
    'suogediyana': [{ from: -9999, era: 'antiquity' }], // 索格狄亚那
    'suolun': [{ from: -9999, era: 'imperial' }], // 达斡尔
    'suosuo': [{ from: -9999, era: 'castle' }], // 索索
    'supi': [{ from: -9999, era: 'feudal' }], // 苏毗
    'sute': [{ from: -9999, era: 'antiquity' }], // 诺塔卡
    'suwa_d': [{ from: -9999, era: 'castle' }], // 诹访 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1200–1542 大部分年份]
    'suzidaer': [{ from: -9999, era: 'castle' }], // 苏兹达尔
    'tailuona': [{ from: -9999, era: 'castle' }], // 泰罗纳 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 900–1600 大部分年份]
    'taimier': [{ from: -9999, era: 'imperial' }], // 马拉塔
    'taino_d': [{ from: -9999, era: 'imperial' }], // 泰诺 🔴[2026-11-09 主人「势力对照年代，要用年份长的，知名度高的」] 存续 1200–1512 按年数是城堡，但泰诺知名在 1492 后与西班牙交锋（哈土依），且 TUPI 文化没有城堡军团 → 保留帝国
    'taiping': [{ from: -9999, era: 'imperial' }], // 太平
    'taiyuan': [{ from: -9999, era: 'imperial' }], // 泰沅 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1292–1775 大部分年份]
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
    'huaixi': [{ from: -9999, era: 'feudal' }], // 淮西镇（中唐割据藩镇）
    'gengshi': [{ from: -9999, era: 'antiquity' }], // 更始
    'shierShijun': [{ from: -9999, era: 'feudal' }], // 十二使君
    'xishan': [{ from: -9999, era: 'imperial' }], // 西山
    'malla': [{ from: -9999, era: 'imperial' }], // 加德满都
    // 🔴 [2026-11-04 主人令「按历史修复」] 'shangdu'（上都）与 'wistahm'（维斯塔姆）两个势力已删，并入大元／萨珊，时代随本家
    'mihran': [{ from: -9999, era: 'feudal' }], // 米赫兰 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }] → feudal｜存续 590–591 大部分年份]
    // 🔴 [2026-11-05 按A执行] 'dongyang'（会稽义军）已并入隋国，时代随本家
    'xiwasi': [{ from: -9999, era: 'castle' }], // 埃雷特纳
    'mengguqieke': [{ from: -9999, era: 'castle' }], // 门古切克
    'sumuroyi': [{ from: -9999, era: 'imperial' }], // 米沙鄢人
    'tiaodun_qishi': [{ from: -9999, era: 'castle' }], // 条顿骑士团
    'tiemuer': [{ from: -9999, era: 'castle' }], // 图兰
    'tokugawa': [{ from: -9999, era: 'imperial' }], // 德川
    'tomara_gwalior': [{ from: -9999, era: 'castle' }], // 托摩罗 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1394–1516 大部分年份]
    'toyotomi': [{ from: -9999, era: 'imperial' }], // 丰臣
    'tsangpa': [{ from: -9999, era: 'imperial' }], // 藏巴汗
    'tuerhute': [{ from: -9999, era: 'imperial' }], // 土尔扈特
    'tufa_d': [{ from: -9999, era: 'antiquity' }], // 秃发
    'tujishi': [{ from: -9999, era: 'feudal' }], // 突骑施
    'tujue': [{ from: -9999, era: 'feudal' }], // 突厥
    'tumed': [{ from: -9999, era: 'imperial' }], // 土默特
    'tuoba': [{ from: -9999, era: 'antiquity' }], // 拓跋魏｜北魏（386–534）＝封建时代；势力名 2026-11-03 主人定为「拓跋魏」 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 386–534 大部分年份]
    'tuolemi': [{ from: -9999, era: 'antiquity' }], // 托勒密
    'tuomengde': [{ from: -9999, era: 'castle' }], // 托蒙德
    'tuoming': [{ from: -9999, era: 'imperial' }], // 清真
    'tupi': [{ from: -9999, era: 'imperial' }], // 图皮
    'tutul_xiu': [{ from: -9999, era: 'feudal' }], // 休族
    'uesugi': [{ from: -9999, era: 'imperial' }], // 上杉
    'utsunomiya': [{ from: -9999, era: 'imperial' }], // 宇都宫
    'vidin_tsardom': [{ from: -9999, era: 'castle' }], // 维丁国
    'wandan': [{ from: -9999, era: 'imperial' }], // 万丹｜万丹苏丹国（1527–1682，胡椒大港）＝帝国时代；MALAY × 帝国＝帝国时代马六甲军团
    'bolinixiya': [{ from: -9999, era: 'imperial' }], // 波利尼西亚｜波马雷王朝（约 1742–1803，波马雷一世统一大溪地）＝帝国段；MALAY × 帝国（工作区遗留缺口，顺手补齐）
    'yaqi': [{ from: -9999, era: 'imperial' }], // 亚齐苏丹国｜1496–1903，盛期 16–17 世纪争马六甲海峡（既有缺口补齐）
    'zhamolin': [{ from: -9999, era: 'castle' }], // 扎莫林（科泽科德/卡利卡特）｜1498 达伽马到访，15–16 世纪马拉巴尔胡椒港（既有缺口补齐） 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 1124–1766 大部分年份]
    'walajiyia': [{ from: -9999, era: 'imperial' }], // 瓦拉几亚 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1330–1859 大部分年份]
    'wei': [{ from: -9999, era: 'antiquity' }], // 魏国
    'caowei': [{ from: -9999, era: 'antiquity' }], // 曹魏
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
    'wuji': [{ from: -9999, era: 'feudal' }], // 勿吉 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }] → feudal｜存续 450–600 大部分年份]
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
    'xiangxiong': [{ from: -9999, era: 'antiquity' }], // 象雄 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -400–645 大部分年份]
    'xianhai': [{ from: -9999, era: 'feudal' }], // 咸海
    'xianlingqiang': [{ from: -9999, era: 'antiquity' }], // 先零
    'xiaobolu': [{ from: -9999, era: 'feudal' }], // 勃律
    'xibanya': [{ from: -9999, era: 'imperial' }], // 西班牙
    'xibo_d': [{ from: -9999, era: 'imperial' }], // 锡伯
    'xibolai': [{ from: -9999, era: 'antiquity' }], // 以色列
    'xideweina': [{ from: -9999, era: 'castle' }], // 波洛公国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → castle｜存续 862–1307 大部分年份]
    'xiemian': [{ from: -9999, era: 'feudal' }], // 萨维尔
    'xierhe': [{ from: -9999, era: 'feudal' }], // 锡尔河
    'xihai_d': [{ from: -9999, era: 'feudal' }], // 吐谷浑
    'xike': [{ from: -9999, era: 'imperial' }], // 锡克帝国
    'xikesuosi': [{ from: -9999, era: 'antiquity' }], // 喜克索斯
    'xila': [{ from: -9999, era: 'antiquity' }], // 雅典
    // 🔴 [2026-11-04 主人令「按历史修复」] 'xingelana'（新格拉纳达总督区）已并入西班牙，时代随西班牙
    'xingliao': [{ from: -9999, era: 'feudal' }], // 兴辽
    'xingwei': [{ from: -9999, era: 'imperial' }], // 兴威 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1300–1888 大部分年份]
    'xinluo': [{ from: -9999, era: 'antiquity' }], // 新罗 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -57–935 大部分年份]
    'xiongnu': [{ from: -9999, era: 'antiquity' }], // 匈奴
    'xiongren': [{ from: -9999, era: 'antiquity' }], // 匈人
    'awaer': [{ from: -9999, era: 'feudal' }], // 阿瓦尔汗国（567–822，潘诺尼亚）
    'xiou': [{ from: -9999, era: 'antiquity' }], // 西瓯
    'xiye': [{ from: -9999, era: 'antiquity' }], // 西夜
    'xueyantuo': [{ from: -9999, era: 'feudal' }], // 薛延陀
    'xushouhui': [{ from: -9999, era: 'castle' }], // 天完
    'yada': [{ from: -9999, era: 'feudal' }], // 嚈哒 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }] → feudal｜存续 440–567 大部分年份]
    'yan': [{ from: -9999, era: 'antiquity' }], // 燕国
    'yanda': [{ from: -9999, era: 'feudal' }], // 阿尔洪（约 455–515）→ 封建（2026-11-03 主人定）
    'yang_aner': [{ from: -9999, era: 'castle' }], // 天顺 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }] → castle｜存续 1214–1214 大部分年份]
    'yang_bozhou': [{ from: -9999, era: 'castle' }], // 播州杨氏 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'imperial' }] → castle｜存续 876–1600 大部分年份]
    'yangguan': [{ from: -9999, era: 'antiquity' }], // 西凉
    'xiliangjun': [{ from: -9999, era: 'antiquity' }], // 西凉军（董卓，汉末 189–192）
    'liangzhou': [{ from: -9999, era: 'antiquity' }], // 凉州（汉末凉州之乱）
    'yangwu': [{ from: -9999, era: 'feudal' }], // 杨吴
    'yanqi': [{ from: -9999, era: 'antiquity' }], // 焉耆 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -200–648 大部分年份]
    'yarkand': [{ from: -9999, era: 'imperial' }], // 叶尔羌
    'yashu': [{ from: -9999, era: 'antiquity' }], // 亚述
    // 🔴 [2026-11-04 主人令「按历史修复」] 'yasuer'（亚速尔，葡属群岛）已并入葡萄牙，时代随葡萄牙
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
    'yiluokui': [{ from: -9999, era: 'imperial' }] /* 🔴 2026-11-09 存续 1450—今，大部分年份与知名期都在帝国段 */, // 易洛魁联盟
    'yipilusi': [{ from: -9999, era: 'antiquity' }], // 伊庇鲁斯
    'yiqu': [{ from: -9999, era: 'antiquity' }], // 义渠
    'yiwu': [{ from: -9999, era: 'castle' }], // 伊吾
    'yizhi': [{ from: -9999, era: 'antiquity' }], // 一支
    'yuan_d': [{ from: -9999, era: 'castle' }], // 大元
    'yuan_shao': [{ from: -9999, era: 'antiquity' }], // 袁绍
    'yuenan': [{ from: -9999, era: 'imperial' }], // 越南
    'yumi': [{ from: -9999, era: 'antiquity' }], // 扜弥
    'yun': [{ from: -9999, era: 'antiquity' }], // 允戎
    'yuwen': [{ from: -9999, era: 'feudal' }], // 宇文
    'zhadalan': [{ from: -9999, era: 'castle' }], // 扎答兰
    'zhagewei': [{ from: -9999, era: 'castle' }], // 扎格维
    'zhangshicheng': [{ from: -9999, era: 'castle' }], // 大周
    'zhaowu': [{ from: -9999, era: 'feudal' }], // 昭武 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → feudal｜存续 500–750 大部分年份]
    'zhayan': [{ from: -9999, era: 'castle' }], // 扎扬
    'zhelouqi': [{ from: -9999, era: 'feudal' }], // 乔汉 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → feudal｜存续 551–1192 大部分年份]
    'zhongxiang': [{ from: -9999, era: 'castle' }], // 鼎州
    'zhou': [{ from: -9999, era: 'antiquity' }], // 周国
    'zhuang_d': [{ from: -9999, era: 'imperial' }], // 壮族
    'zhuerqi': [{ from: -9999, era: 'castle' }], // 主儿乞
    'zubu': [{ from: -9999, era: 'feudal' }], // 阻卜 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → feudal｜存续 900–1125 大部分年份]
    // ══════ 三、多时代势力（未手裁：按现存名将成名年推定，不改变现有武将）══════
    'ayinu_ezo': [{ from: -9999, era: 'castle' }], // 阿伊努｜按现存名将成名年推定：–∞起城堡 → 1626起帝国
    'ayoubu': [{ from: -9999, era: 'castle' }], // 阿尤布｜按现存名将成名年推定：–∞起封建 → 1187起城堡
    'bafaliya': [{ from: -9999, era: 'feudal' }], // 巴伐利亚｜按现存名将成名年推定：–∞起封建 → 1388起城堡
    'baojiaer': [{ from: -9999, era: 'castle' }], // 保加尔｜按现存名将成名年推定：–∞起城堡 → 1720起帝国
    'baojialiya': [{ from: -9999, era: 'feudal' }], // 保加利亚｜封建→1190 城堡→1500 帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1190, era: 'castle' }, { from: 1500, era: 'imperial' }] → feudal｜存续 681–1396 大部分年份]
    'baojian_qishi': [{ from: -9999, era: 'castle' }], // 宝剑骑士团｜按现存名将成名年推定：–∞起城堡 → 1470起帝国
    'boluo': [{ from: -9999, era: 'feudal' }], // 波罗帝国｜按现存名将成名年推定：–∞起古典 → 618起封建
    'bulietani': [{ from: -9999, era: 'castle' }], // 布列塔尼｜按现存名将成名年推定：–∞起封建 → 1425起城堡
    'champa': [{ from: -9999, era: 'feudal' }], // 占婆｜按现存名将成名年推定：–∞起古典 → 1150起城堡 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → feudal｜存续 192–1832 大部分年份]
    'cuanshi': [{ from: -9999, era: 'feudal' }], // 爨族｜按现存名将成名年推定：–∞起古典 → 715起封建
    'da_yan': [{ from: -9999, era: 'feudal' }], // 大燕｜按现存名将成名年推定：–∞起古典 → 720起封建
    'dali': [{ from: -9999, era: 'castle' }], // 大理｜按现存名将成名年推定：–∞起封建 → 1065起城堡
    'da_qin': [{ from: -9999, era: 'feudal' }], // 🔴 [2026-10-28 主人令「一个势力不要开战，要不就分开势力」] 大秦（朱泚）｜783 据长安称帝、国号秦（应天），784 改国号汉 → 封建时代
    'danmai': [{ from: -9999, era: 'feudal' }], // 丹麦｜–∞起封建 → 1184起城堡 → 1500起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1184, era: 'castle' }, { from: 1500, era: 'imperial' }] → feudal｜存续年不全，取武将最多的时代]
    'xinbuli': [{ from: -9999, era: 'antiquity' }], // 辛布里（金布里）｜前 113–前 101 辛布里战争
    'daquyue': [{ from: -9999, era: 'feudal' }], // 大瞿越｜按现存名将成名年推定：–∞起封建 → 1405起城堡
    'deli': [{ from: -9999, era: 'castle' }], // 德里苏丹国｜按现存名将成名年推定：–∞起城堡 → 1526起帝国
    'sur': [{ from: -9999, era: 'imperial' }], // 🔴 [2026-10-28 主人批立] 苏尔王朝｜1540 舍尔沙立国，1556 第二次帕尼帕特亡（赫穆战败）→ 帝国时代
    'koln': [{ from: -9999, era: 'castle' }], // 🔴 [2026-10-28 主人批立] 科隆大主教区｜1288 沃林根战役＝城堡时代
    'dublin': [{ from: -9999, era: 'feudal' }], // 🔴 [2026-10-28 主人批立] 都柏林王国｜1014 克朗塔夫战役＝封建时代
    'dulan_d': [{ from: -9999, era: 'imperial' }], // 杜兰尼｜按现存名将成名年推定：–∞起封建 → 1500起城堡 → 1761起帝国
    'ethiopia': [{ from: -9999, era: 'imperial' }], // 埃塞俄比亚｜按现存名将成名年推定：–∞起古典 → 890起封建 → 1150起城堡 → 1623起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1270–1974 大部分年份]
    'ganden': [{ from: -9999, era: 'imperial' }], // 甘丹｜按现存名将成名年推定：–∞起城堡 → 1638起帝国
    'gurjara': [{ from: -9999, era: 'feudal' }], // 瞿折罗｜按现存名将成名年推定：–∞起封建 → 1620起帝国
    'hansa': [{ from: -9999, era: 'imperial' }], // 汉萨｜按现存名将成名年推定：–∞起封建 → 1380起城堡 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1358–1862 大部分年份]
    'inca': [{ from: -9999, era: 'castle' }], // 印加｜按现存名将成名年推定：–∞起城堡 → 1532起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }, { from: 1532, era: 'imperial' }] → castle｜存续 1438–1533 大部分年份]
    'jialixiya': [{ from: -9999, era: 'castle' }], // 哈尔公国｜按现存名将成名年推定：–∞起封建 → 1221起城堡
    'jiazini': [{ from: -9999, era: 'castle' }], // 伽色尼｜按现存名将成名年推定：–∞起封建 → 1110起城堡
    'jilimi': [{ from: -9999, era: 'castle' }], // 吉里｜按现存名将成名年推定：–∞起城堡 → 1620起帝国
    'joseon': [{ from: -9999, era: 'imperial' }], // 朝鲜｜按现存名将成名年推定：–∞起古典 → 1380起城堡 → 1515起帝国
    'kasidiliya': [{ from: -9999, era: 'castle' }], // 卡斯蒂利亚｜按现存名将成名年推定：–∞起城堡 → 1491起帝国
    'kelimiya': [{ from: -9999, era: 'castle' }], // 热那亚共和国｜按现存名将成名年推定：–∞起城堡 → 1486起帝国
    'kelite': [{ from: -9999, era: 'castle' }], // 威尼斯共和国｜按现存名将成名年推定：–∞起城堡 → 1639起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }, { from: 1639, era: 'imperial' }] → castle｜存续 697–1797 大部分年份]
    'kongque': [{ from: -9999, era: 'antiquity' }], // 孔雀帝国｜按现存名将成名年推定：–∞起古典 → 435起封建
    'kuman_oleshky': [{ from: -9999, era: 'castle' }], // 库曼｜库曼人 11–13 世纪 → 城堡（2026-11-03 主人定「库曼算城堡」）
    'kumoxi': [{ from: -9999, era: 'feudal' }], // 库莫奚｜按现存名将成名年推定：–∞起封建 → 1095起城堡
    'leangongguo': [{ from: -9999, era: 'castle' }], // 莱昂｜阿斯图里亚斯—莱昂（718 起）封建 → 1050 起城堡 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1050, era: 'castle' }] → castle｜存续 910–1230 大部分年份]
    'liren': [{ from: -9999, era: 'feudal' }], // 俚族｜按现存名将成名年推定：–∞起封建 → 1480起帝国
    'litaowan': [{ from: -9999, era: 'imperial' }], // 立陶宛｜–∞起城堡 → 1500 起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }, { from: 1500, era: 'imperial' }] → imperial｜存续 1236–1795 大部分年份]
    'lunbadi': [{ from: -9999, era: 'feudal' }], // 伦巴第｜按现存名将成名年推定：–∞起封建 → 1070起城堡 → 1513起帝国
    'gepids': [{ from: -9999, era: 'feudal' }], // 革皮德（5–6 世纪）
    'kalbids': [{ from: -9999, era: 'feudal' }], // 卡尔比德（948–1053 西西里埃米尔）
    'luodian': [{ from: -9999, era: 'castle' }], // 罗甸｜按现存名将成名年推定：–∞起城堡 → 1595起帝国
    'maerta_qishi': [{ from: -9999, era: 'castle' }], // 圣约翰｜按现存名将成名年推定：–∞起城堡 → 1565起帝国
    'mosike_gongguo': [{ from: -9999, era: 'castle' }], // 莫斯公国｜按现存名将成名年推定：–∞起城堡 → 1514起帝国
    'muisca': [{ from: -9999, era: 'castle' }], // 穆伊斯卡｜按现存名将成名年推定：–∞起城堡 → 1520起帝国
    'mulabite': [{ from: -9999, era: 'castle' }],
    'awraba': [{ from: -9999, era: 'feudal' }], // 奥雷巴｜670–688 库萨伊拉（法文维基 Koceïla）→ 封建时代 // 穆拉比特｜按现存名将成名年推定：–∞起封建 → 1086起城堡
    'malin': [{ from: -9999, era: 'castle' }], // 🔴 [2026-10-28 主人批修] 马林王朝｜1244 立国、1331–1348 阿布·哈桑在位，1340 里奥萨拉多＝城堡时代
    'oirat_ming': [{ from: -9999, era: 'imperial' }], // 卫拉特｜按现存名将成名年推定：–∞起城堡 → 1690起帝国
    'panyao': [{ from: -9999, era: 'castle' }], // 盘瑶｜按现存名将成名年推定：–∞起城堡 → 1750起帝国
    'putaoya': [{ from: -9999, era: 'imperial' }], // 葡萄牙｜按现存名将成名年推定：–∞起城堡 → 1520起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }, { from: 1520, era: 'imperial' }] → imperial｜存续 1139–1910 大部分年份]
    'rouran': [{ from: -9999, era: 'antiquity' }], // 柔然｜按现存名将成名年推定：–∞起古典 → 500起封建
    'ruidian_si': [{ from: -9999, era: 'imperial' }], // 瑞典｜按现存名将成名年推定：–∞起封建 → 1230起城堡 → 1570起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }, { from: 1230, era: 'castle' }, { from: 1570, era: 'imperial' }] → imperial｜存续年不全，取武将最多的时代]
    'ryukyu': [{ from: -9999, era: 'imperial' }], // 琉球｜按现存名将成名年推定：–∞起城堡 → 1490起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1429–1879 大部分年份]
    'safawei_d': [{ from: -9999, era: 'imperial' }], // 萨法维｜按现存名将成名年推定：–∞起城堡 → 1510起帝国
    'yinduxila': [{ from: -9999, era: 'antiquity' }], // 印度希腊王国（约前 180–前 10）＝古典时代

    'asakaini': [{ from: -9999, era: 'antiquity' }], // 阿萨凯尼（前 4 世纪斯瓦特河谷）＝古典时代

    'sailiugu': [{ from: -9999, era: 'antiquity' }], // 塞琉古｜按现存名将成名年推定：–∞起古典 → 1050起城堡
    'salai': [{ from: -9999, era: 'imperial' }], // 萨莱诺盖｜按现存名将成名年推定：–∞起城堡 → 1540起帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'castle' }] → imperial｜存续 1395–1634 大部分年份]
    'seleisi': [{ from: -9999, era: 'antiquity' }], // 色雷斯｜按现存名将成名年推定：–∞起古典 → 917起封建
    'sengjialuo': [{ from: -9999, era: 'antiquity' }], // 僧伽罗｜按现存名将成名年推定：–∞起古典 → 980起封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -437–1815 大部分年份]
    'shule': [{ from: -9999, era: 'antiquity' }], // 疏勒｜按现存名将成名年推定：–∞起古典 → 960起封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -200–800 大部分年份]
    'sogdian': [{ from: -9999, era: 'antiquity' }], // 粟特｜按现存名将成名年推定：–∞起古典 → 690起封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -300–722 大部分年份]
    'suomunate': [{ from: -9999, era: 'castle' }], // 索兰基｜按现存名将成名年推定：–∞起封建 → 1163起城堡
    'talasike': [{ from: -9999, era: 'castle' }], // 塔拉斯科｜按现存名将成名年推定：–∞起城堡 → 1505起帝国
    'tubo': [{ from: -9999, era: 'feudal' }], // 吐蕃｜按现存名将成名年推定：–∞起古典 → 530起封建 → 1050起城堡
    'guge': [{ from: -9999, era: 'castle' }], // 古格 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → castle｜存续 910–1635 大部分年份]
    'wende': [{ from: -9999, era: 'castle' }], // 萨克森｜–∞起古典（罗马时期撒克逊人）→ 476起封建 → 1050起城堡 → 1500起帝国（段界按四时代年段，2026-11-09） 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 476, era: 'feudal' }, { from: 1050, era: 'castle' }, { from: 1500, era: 'imperial' }] → castle｜存续 843–1806 大部分年份]
    'wulaertu': [{ from: -9999, era: 'feudal' }], // 亚美尼亚｜古典 → 884 巴格拉图尼王朝封建 → 1050 城堡（奇里乞亚）→ 1500 帝国 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'antiquity' }, { from: 884, era: 'feudal' }, { from: 1050, era: 'castle' }, { from: 1500, era: 'imperial' }] → feudal｜存续 884–1045 大部分年份]
    'xigete': [{ from: -9999, era: 'feudal' }], // 西哥特｜按现存名将成名年推定：–∞起古典 → 708起封建 → 1085起城堡
    'xijue': [{ from: -9999, era: 'feudal' }], // 十箭｜按现存名将成名年推定：–∞起古典 → 660起封建
    'xisi': [{ from: -9999, era: 'feudal' }], // 萨法尔王朝｜按现存名将成名年推定：–∞起古典 → 860起封建
    'yilihanguo_d': [{ from: -9999, era: 'castle' }], // 伊利汗国｜按现存名将成名年推定：–∞起封建 → 1258起城堡
    'you': [{ from: -9999, era: 'antiquity' }], // 幽州｜按现存名将成名年推定：–∞起古典 → 868起封建
    'yuchi': [{ from: -9999, era: 'antiquity' }], // 尉迟｜按现存名将成名年推定：–∞起古典 → 635起封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -232–1006 大部分年份]
    'yue': [{ from: -9999, era: 'antiquity' }], // 越国｜按现存名将成名年推定：–∞起古典 → 560起封建
    'zhao': [{ from: -9999, era: 'antiquity' }], // 赵国｜按现存名将成名年推定：–∞起古典 → 621起封建
    'zhuluo': [{ from: -9999, era: 'antiquity' }], // 朱罗｜按现存名将成名年推定：–∞起古典 → 993起封建 🔴[2026-11-09 主人令「按大部分年份改」原 [{ from: -9999, era: 'feudal' }] → antiquity｜存续 -300–1279 大部分年份]
    'pattani': [{ from: -9999, era: 'imperial' }], // 北大年｜16-17世纪北大年苏丹国（帝国）
    'chalkidike': [{ from: -9999, era: 'antiquity' }], // 卡尔基季基同盟
    'naxos': [{ from: -9999, era: 'antiquity' }], // 纳克索斯
    'phokis': [{ from: -9999, era: 'antiquity' }], // 福基斯
    'wuguobu': [{ from: -9999, era: 'feudal' }], // 五国部
    'balti': [{ from: -9999, era: 'imperial' }], // 巴尔蒂
    // 🔴 [2026-11-05 按A执行] 'qingyuan_yijun'（清远义军）已并入大元，时代随本家
    'zhenghe_yijun': [{ from: -9999, era: 'castle' }], // 头陀军（黄华 1283–1284）
    'latin_empire': [{ from: -9999, era: 'castle' }], // 拉丁帝国
    'anjou': [{ from: -9999, era: 'castle' }], // 安茹
    'pisa': [{ from: -9999, era: 'castle' }], // 比萨共和国
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

/** 判段用的年份：经典战年（最知名那一战）→ 登场年（生年+20，不晚于卒年） */
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
    const segs = fid ? FACTION_ERA[fid] : undefined;
    if (segs && segs.length > 0) {
        // 🔴 [2026-11-07 修] 本表头写明「武将落在哪一段＝经典战年→登场年」，原实现只取 segs[0]，
        //    多段势力（英格兰：盎格鲁-撒克逊→诺曼→都铎）等于分段没生效。改为按年落段。
        if (segs.length === 1) return segs[0].era;
        const y = getGeneralEraYear(generalId);
        if (y != null) {
            const byYear = getFactionEraAt(fid, y);
            if (byYear) return byYear;
        }
        return segs[0].era;
    }
    return GENERAL_ERA[generalId];
}




