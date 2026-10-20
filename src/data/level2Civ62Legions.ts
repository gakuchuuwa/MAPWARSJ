/**
 * 🔴 [2026-09-14 主人定 / 2026-10-16 校正计数] 二级＝「文明 × 时代」层。
 * 实测（本表逐条统计，2026-10-16 第七批后）：古典时代 63 支 + 封建时代 64 支 + 城堡时代 65 支 + 帝国时代 65 支 = **257** 支。
 * 目标形态：66 个文明 × 4 时代 = 264 支（本批先落中原/河朔/江南/巴蜀/河西/白山黑水/漠北/朝鲜/日本 9 个文明的 36 支）。
 * ⚠️ 历史：文件名与常量曾用「59」「62」（旧计数），2026-10-16 起以本表实际条目为准。
 * 军团兵种编制铁律：严格对齐史实特色兵种与精锐/高级档，总数=9
 */
import type { RegionType } from '../systems/RegionSystem';
import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';
import type { BuildingStyle } from './cities_v2';

export interface Level2CivLegionDef {
    name: string;
    civ: string;
    age: 'antiquity' | 'feudal' | 'castle' | 'imperial';
    deStyle: string;
    region: RegionType;
    buildingStyle: BuildingStyle;
    castleId: string;
    castleName: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    shipId: string; // 🔴 [2026-09-16 主人定] 二级军团与四时代海军模型强绑定
    commanderUnit?: string; // 英雄（主队 · 第 10 队）兵模
}

export const LEVEL_2_CIV_62_LEGIONS: Level2CivLegionDef[] = [
    {
        // ★ 2026-10-16 主人令（第四批）：罗马 · 古典时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：重步兵为主
        //    描述正文（主人原文，一字未改）：（罗马城；罗马斗兽场、万神殿混凝土大穹顶、图拉真广场记功柱；板条铁甲（Lorica Segmentata）、罗马方形大半身盾（Scutum）、重标枪（Pilum）破坏敌盾后西班牙短剑贴身刺杀、龟甲步兵推进大阵）
        //    英雄队（第 10 队·主将队）：hero_aristides / hero_parmenion / hero_lysander　— 按 248 主将表取，不进三排兵种编制
        name: '古典时代罗马军团', civ: '罗马', age: 'antiquity', deStyle: 'MEDI', region: 'ROMA' as RegionType,
        buildingStyle: 'ROMA',
        castleId: 'ROMA_CASTLE_AGE3', castleName: '罗马 帝国古典方石要塞',
        formationMode: 'fish_scale',
        shipId: 'TRIREME',
        commanderUnit: 'hero_aristides',
        // 🔴 [2026-10-16 主人令「13 支军团的主力4档，请都套用城堡精锐」] 主力4档＝罗马城堡兵【百夫长精锐】。
        slots: [
            { type: 'legionary', count: 3 },
            { type: 'cretan_archer', count: 4 },
            { type: 'elite_centurion', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第七批）：雅典 · 古典时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：重步兵、远程（轻盾标枪）为主
        //    描述正文（主人原文，一字未改）：（雅典、比雷埃夫斯；雅典卫城帕特农纯大理石多立克列柱神殿、比雷埃夫斯长墙石造防御要塞；多利（Dory）长矛密集重步兵方阵、雅典重装青铜圆盾（Aspis）、伊菲克拉特轻盾投矛兵（Peltast）两翼游击协同大阵）
        //    英雄队（第 10 队·主将队）：hero_aristagoras / hero_aristides / hero_themistocles_hoplite　— 按 248 主将表取，不进三排兵种编制
        name: '古典时代雅典军团', civ: '雅典', age: 'antiquity', deStyle: 'GREEK', region: 'ATHENIANS' as RegionType,
        buildingStyle: 'ATHENIANS',
        castleId: 'ATHENIANS_CASTLE_AGE3', castleName: '雅典 卫城多立克柱廊卫堡',
        formationMode: 'fish_scale',
        shipId: 'HERO_THEMISTOCLES',
        commanderUnit: 'hero_themistocles_hoplite',
        slots: [
            { type: 'elite_strategos', count: 3 },
            { type: 'priestess', count: 4 },   // 🔴 [2026-10-19 主人令「把这 5 个法术兵按历史编进对应文明的军团」] 原 cretan_archer；按史：雅典城邦的雅典娜祭司
            { type: 'sacred_band', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第七批）：斯巴达 · 古典时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：重步兵为主
        //    描述正文（主人原文，一字未改）：（斯巴达、拉科尼亚；欧罗塔斯河畔军国战阵训练石台、列奥尼达斯巨石干砌纪念基坛；精锻铁矛、红色羊毛战袍与青铜全脸盔、绝对服从之希腊重装密集长矛铁壁大阵）
        //    英雄队（第 10 队·主将队）：hero_brasidas / hero_lysander　— 按 248 主将表取，不进三排兵种编制
        name: '古典时代斯巴达军团', civ: '斯巴达', age: 'antiquity', deStyle: 'GREEK', region: 'SPARTANS' as RegionType,
        buildingStyle: 'SPARTANS',
        castleId: 'SPARTANS_CASTLE_AGE3', castleName: '斯巴达 泰格特斯山青石重垒',
        formationMode: 'echelon',
        shipId: 'HERO_AEGINETAN',
        commanderUnit: 'hero_brasidas',
        slots: [
            { type: 'rhodian_slinger', count: 4 },
            { type: 'elite_hippeus', count: 3 },
            { type: 'lysander_raider', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第七批）：马其顿 · 古典时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：长枪步兵、重骑兵为主
        //    描述正文（主人原文，一字未改）：（佩拉、韦尔吉纳；菲利普二世韦尔吉纳地下壁画石砌王陵、佩拉王宫整石多立克柱廊台基；六米萨里萨（Sarissa）超长枪、伙伴骑兵人马轻甲、步兵方阵砧板与骑兵重锤合围歼灭大阵）
        //    英雄队（第 10 队·主将队）：hero_cleitus / hero_dismounted_alexander / hero_mounted_alexander / hero_macedonian_commander / hero_parmenion / hero_perdiccas　— 按 248 主将表取，不进三排兵种编制
        name: '古典时代马其顿军团', civ: '马其顿', age: 'antiquity', deStyle: 'GREEK', region: 'MACEDONIAN' as RegionType,
        buildingStyle: 'MACEDONIAN',
        castleId: 'MACEDONIAN_CASTLE_AGE3', castleName: '马其顿 佩拉要塞重石堡',
        formationMode: 'fish_scale',
        // 🔴 [2026-10-02 主人令「给马其顿军团套上」] 舰队模型 = **英雄·地米斯托克利**（旗舰）。
        //    原为 TRIREME；按主人定的「不看人名、只看样式」比对：这条与 TRIREME **同型**
        //    （同船体、同舷侧白圆盾列、同单桅桨列与船首冲角），只差帆色与帆上纹章，
        //    故升为马其顿军团旗舰。素材是完整 16 向战船，登记见 UnitAssets 'HERO_THEMISTOCLES'。
        shipId: 'SHP_FLAGSHIP',
        commanderUnit: 'hero_mounted_alexander',
        // 🔴 [2026-10-16 主人令「13 支军团的主力4档，请都套用城堡精锐」] 主力4档＝马其顿城堡兵【伙伴骑兵精锐】。
        // 🔴 [2026-10-16 主人令「给这6个军团补3档，用独特的普通兵补3档」] 3 档＝紫框独特兵【马其顿方阵步兵】的普通档
        //    （原 3 档是它的「高级」档 → 与 2 档对调，高级档移到 2 档）。
        slots: [
            { type: 'elite_phalangite', count: 3 },
            { type: 'cretan_archer', count: 4 },
            { type: 'elite_companion_cavalry', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第七批）：色雷斯 · 古典时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：轻步兵、远程（标枪）为主
        //    描述正文（主人原文，一字未改）：（塞夫托波利斯、卡赞勒克；卡赞勒克蜂窝状假拱巨石墓室、塞夫托波利斯石木环城防卫要塞；色雷斯双刃长柄弧形斩剑（Rhomphaia）、月牙形轻质皮盾（Pelte）、高机动多重标枪投掷与山林设伏穿插大阵）
        //    英雄队（第 10 队·主将队）：hero_thracian_chieftain / hero_cleitus　— 按 248 主将表取，不进三排兵种编制
        name: '古典时代色雷斯军团', civ: '色雷斯', age: 'antiquity', deStyle: 'THRACIAN', region: 'THRACIAN' as RegionType,
        buildingStyle: 'THRACIAN',
        castleId: 'THRACIAN_CASTLE_AGE3', castleName: '色雷斯 罗多彼山蛮族巨石堡',
        formationMode: 'echelon',
        shipId: 'WAR_LEMBOS',
        commanderUnit: 'hero_thracian_chieftain',
        slots: [
            { type: 'elite_peltast', count: 4 },
            { type: 'elite_rhomphaia_warrior', count: 3 },
            { type: 'thracian_peltast', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第二批·西欧与北欧）：高卢 · 封建时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：（未标评级）｜核心兵种：重骑兵为主
        //    描述正文（主人原文，一字未改）：（亚琛、普瓦捷；亚琛王宫礼拜堂大理石八角殿、圣雷米修道院；查理曼加洛林具装锁甲骑兵、普瓦捷铁壁方阵、十二圣骑士传奇）
        //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_joanofarc / hero_joanthemaid　— 按 248 主将表取，不进三排兵种编制
        name: '封建时代法兰克军团', civ: '法兰克', age: 'feudal', deStyle: 'WEST', region: 'FRANKS' as RegionType,
        buildingStyle: 'FRANKS',
        castleId: 'FRAN_CASTLE_AGE3', castleName: '法兰克 卢瓦尔河双圆塔石堡',
        formationMode: 'echelon',
        shipId: 'GALLEY',
        commanderUnit: 'hero_charlemagne',
        slots: [
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'longswordsman', count: 3 },
            { type: 'knight', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令：日本 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【高级】｜核心兵种：重步兵为主
        //    描述正文（主人原文，一字未改）：（镰仓、京都；镰仓鹤冈八幡宫石阶、京都金阁寺石基木殿、博多湾元寇防垒石墙；镰仓武士下马步战太刀、博多湾石墙长矛阻击、室町禅宗长柄雉刀战阵）
        //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代幕府军团', civ: '日本', age: 'castle', deStyle: 'ASIA', region: 'JAPAN' as RegionType,
        buildingStyle: 'JAPAN',
        castleId: 'ASIA_CASTLE_AGE3', castleName: '东亚/日本 姬路式多重天守阁',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_minamoto',
        slots: [
            { type: 'samurai_elite', count: 3 },
            { type: 'rattan_archer', count: 4 },
            { type: 'ninja', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令：漠北 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：骑射、轻骑兵为主
        //    描述正文（主人原文，一字未改）：（哈拉和林、斡难河；哈拉和林古城遗址石龟、成吉思汗九斿白纛大帐；千户百户编制骑兵、蒙古复合反曲弓、远征欧亚曼古歹诱敌围猎战阵）
        //    英雄队（第 10 队·主将队）：hero_subotai / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代蒙古军团', civ: '漠北蒙古', age: 'castle', deStyle: 'ASIA', region: 'STEPPE' as RegionType,
        buildingStyle: 'MONGOL',
        castleId: 'MONG_CASTLE_AGE3', castleName: '蒙古 哈拉和林木石大斡耳朵',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_genghiskhan',
        slots: [
            { type: 'elite_keshik', count: 3 },
            { type: 'mangudai_elite', count: 4 },
            { type: 'steppe_lancer', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第六批）：阿兹特克 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：重步兵、远程（掷矛器）为主
        //    描述正文（主人原文，一字未改）：（特诺奇蒂特兰、特斯科科；特诺奇蒂特兰大神庙双神平顶多层金字塔、特拉特洛尔科石台集市防卫台垒；硬木镶嵌黑曜石锯剑（Macuahuitl）、鹰武士与美洲虎武士豹皮头盔、羽蛇神坛精锐掷矛手与狂暴步兵突击大阵）
        //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_arariboiamelee　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代阿兹特克军团', civ: '阿兹特克', age: 'castle', deStyle: 'MESO', region: 'AMERICA' as RegionType,
        buildingStyle: 'AMERICA',
        castleId: 'MESO_CASTLE_AGE3', castleName: '中美洲/阿兹特克 特诺奇蒂特兰金字塔',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_itzcoatl',
        slots: [
            { type: 'elite_jaguar_warrior', count: 3 },
            { type: 'priest', count: 4 },   // 🔴 [2026-10-19 主人令「把这 5 个法术兵按历史编进对应文明的军团」] 原 plumed_archer；按史：阿兹特克祭司随军，为献祭俘获战俘
            { type: 'eagle_warrior', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令：朝鲜 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：（未标评级）｜核心兵种：重步兵、重骑兵为主
        //    描述正文（主人原文，一字未改）：（开城、江华岛；开城满月台宫阙石台、江华岛高丽避乱石城要塞；三别抄精锐步卒突击、坚木双刃战斧、别武班神骑军与重步抗蒙要塞大阵）
        //    英雄队（第 10 队·主将队）：elite_war_wagon / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代高丽军团', civ: '高丽', age: 'castle', deStyle: 'ASIA', region: 'GORYEO' as RegionType,
        buildingStyle: 'KOREA',
        castleId: 'KORE_CASTLE_AGE3', castleName: '高丽 汉阳南汉山城堞楼',
        formationMode: 'triangle',
        shipId: 'ELITE_TURTLE_SHIP',
        commanderUnit: 'hero_zhaoyun',
        slots: [
            { type: 'elite_war_wagon', count: 2 },
            { type: 'jian_swordsman', count: 3 },
            { type: 'fire_archer', count: 4 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第六批）：印加 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：重步兵、远程（标枪）为主
        //    描述正文（主人原文，一字未改）：（库斯科、马丘比丘；萨克塞瓦曼多边形百吨巨石无缝咬合城墙、马丘比丘花岗岩悬崖石屋城堡；青铜星芒狼牙棒（Champi）、淬火硬木标枪、安第斯高山皇家石道极速穿插伏击大阵）
        //    英雄队（第 10 队·主将队）：hero_cusiyupanqui / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代印加军团', civ: '印加', age: 'castle', deStyle: 'ANDE', region: 'INCA' as RegionType,
        buildingStyle: 'INCA',
        castleId: 'INCA_CASTLE_AGE3', castleName: '印加 库斯科萨克萨瓦曼巨石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_topayupanqui',
        // 🔴 [2026-10-16 主人令] 印加的城堡兵＝印加枪兵长：精锐进城堡军团 4 档（与 3 档对调）。
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'elite_kamayuk', count: 3 },
            { type: 'champi_warrior', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第六批）：萨赫勒 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：远程（毒弓）、步兵、战象为主
        //    描述正文（主人原文，一字未改）：（廷巴克图、杰内；杰内大清真寺巨型生土夯筑高墙、外露棕榈木横梁（Toron）角楼尖塔；浸毒硬木重弓破甲箭、长刃劈砍重铁剑、横扫热带草原十万步象混编推进大阵）
        //    英雄队（第 10 队·主将队）：hero_sumanguru / hero_sundjata　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代马里军团', civ: '马里', age: 'castle', deStyle: 'AFRI', region: 'MALI' as RegionType,
        buildingStyle: 'AFRICA',
        castleId: 'AFRI_CASTLE_AGE3', castleName: '非洲/马里 杰内大清真寺泥石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_sundjata',
        slots: [
            { type: 'skirmisher', count: 4 },
            { type: 'elite_gbeto', count: 3 },
            { type: 'camel_rider', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第四批）：库曼 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：骑射、轻骑兵为主
        //    描述正文（主人原文，一字未改）：（顿涅茨河谷、第聂伯河下游；草原墓冢石人雕刻（Balbal）立像、黑海北岸连绵毡帐木栅营寨；精钢拟人铁面具头盔、双曲复合硬弓轻骑疾射、诱敌深入曼古歹与快马闪击突骑大阵）
        //    英雄队（第 10 队·主将队）：hero_cumanchief / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代库曼军团', civ: '库曼', age: 'castle', deStyle: 'CEAS', region: 'CUMAN' as RegionType,
        buildingStyle: 'CUMAN',
        castleId: 'CUMA_CASTLE_AGE3', castleName: '库曼 黑海北岸克里米亚要塞',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_kotyankhan',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'elite_kipchak', count: 4 },
            { type: 'steppe_lancer', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第六批）：穆伊斯卡 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【高级】｜核心兵种：步兵为主
        //    描述正文（主人原文，一字未改）：（波哥大、通哈；瓜塔维塔金湖水上献祭木石台垒、首领圆柱厚草重檐议事大殿；金铜合金（Tumbaga）破甲矛头、重型硬木齿棒、高原峡谷哨卡多重木栅关隘守御大阵）
        //    英雄队（第 10 队·主将队）：hero_pacanchique / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代穆伊斯卡军团', civ: '穆伊斯卡', age: 'castle', deStyle: 'ANDE', region: 'MUISCA' as RegionType,
        buildingStyle: 'MUISCA',
        castleId: 'MUIS_CASTLE_AGE3', castleName: '穆伊斯卡 瓜塔维塔黄金湖石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_pacanchique',
        slots: [
            { type: 'elite_guecha_warrior', count: 4 },
            { type: 'elite_temple_guard', count: 3 },
            { type: 'champi_warrior', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第六批）：图皮 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：远程（步弓）、重步兵为主
        //    描述正文（主人原文，一字未改）：（瓜纳巴拉湾、巴伊亚沿海；多家族大型坚木棕榈巨型长屋（Maloca）、多层密排尖刺硬木双重防卫环寨；坚硬巴西红木双刃重剑棒（Ibirapema）、硬木重弓破甲竹箭、大西洋沿海热带雨林伏击突袭大阵）
        //    英雄队（第 10 队·主将队）：hero_arariboiamelee / hero_arariboiaranged / hero_cunhambebe　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代图皮军团', civ: '图皮', age: 'castle', deStyle: 'ANDE', region: 'TUPI' as RegionType,
        buildingStyle: 'TUPI',
        castleId: 'TUPI_CASTLE_AGE3', castleName: '图皮 亚马逊雨林木栅重垒',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_arariboiaranged',
        slots: [
            { type: 'elite_ibirapema_warrior', count: 3 },
            { type: 'elite_blackwood_archer', count: 4 },
            { type: 'champi_warrior', count: 2 },
        ],
    },
    {
        // ★ 2026-10-16 主人令（第四批）：卢西塔尼亚 · 帝国时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：【精锐】｜核心兵种：重步兵、远程（火器）为主
        //    描述正文（主人原文，一字未改）：（里斯本、萨格里什；里斯本贝伦塔四方石砌海防堡垒、热罗尼莫斯修道院曼努埃尔式航海石雕圣殿；精钢甲胸板与莫里恩高顶盔、超长钩戟与重装腰刀、大航海早期风琴排枪车与海外棱堡要塞铁壁大阵）
        //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare　— 按 248 主将表取，不进三排兵种编制
        name: '帝国时代葡萄牙军团', civ: '葡萄牙', age: 'imperial', deStyle: 'MEDI', region: 'PORTUGUESE' as RegionType,
        buildingStyle: 'PORTUGUESE',
        castleId: 'PORT_CASTLE_AGE3', castleName: '葡萄牙 贝伦塔大西洋海堡',
        formationMode: 'fish_scale',
        shipId: 'ELITE_CARAVEL',
        commanderUnit: 'hero_franciscodeorellana',
        // 🔴 [2026-10-16 主人令「葡萄牙→风琴炮 只算2档」] 风琴炮只上 2 档：2 档＝风琴炮精锐；
        //    基础档风琴炮离队（火器/攻城类，不在「步兵/骑兵/远程都要被套用」那条令的范围内）；
        //    3 档＝欧洲重装长枪兵（原 2 档挪来）；4 档补一件本时代火器【火枪手】。
        slots: [
            { type: 'champion', count: 3 },
            { type: 'heavy_crossbowman', count: 4 },
            { type: 'elite_organ_gun', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════
    // 中原　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 中原 · 古典时代 · 古典时代秦汉军团　（三级升二级）────────────────
    //    评级：【高级】｜核心兵种：远程、骑兵为主
    //    描述正文（主人原文，一字未改）：（咸阳、洛阳；秦阿房宫夯土台基、汉未央宫遗址、白马寺；青铜长剑、秦弩连射方阵、汉代铁戟环首刀与轻装具装汉骑）
    //    英雄队（第 10 队·主将队）：hero_lubu / hero_guanyu / hero_zhangfei / hero_liubei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代华夏军团', civ: '中原', age: 'antiquity', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '中原 北方华北·汉唐城楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
        commanderUnit: 'hero_caocao',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_chukonu', count: 4 },
            { type: 'tiger_rider', count: 2 },
        ],
    },
    // ── 中原 · 封建时代 · 封建时代隋唐军团　（三级升二级）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、重骑兵为主
    //    描述正文（主人原文，一字未改）：（长安、洛阳；大雁塔、洛阳龙门奉先寺卢舍那大佛、含元殿；府兵制重步兵、唐陌刀劈砍大阵、明光铠与破阵马槊铁骑）
    //    英雄队（第 10 队·主将队）：hero_lubu / hero_guanyu / hero_zhangfei / hero_liubei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代中华军团', civ: '中原', age: 'feudal', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '中原 北方华北·汉唐城楼',
        formationMode: 'fish_scale',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_guanyu',
        slots: [
            { type: 'liao_dao', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    // ── 中原 · 城堡时代 · 城堡时代宋禁军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、远程为主
    //    描述正文（主人原文，一字未改）：（开封、归德；繁塔、宋开封铁塔、清明上河图虹桥瓮城；神臂弓克敌连珠弩、步人甲重步兵刺猬阵、斩马刀扎垒守备）
    //    英雄队（第 10 队·主将队）：hero_lubu / hero_guanyu / hero_zhangfei / hero_liubei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代宋禁军团', civ: '中原', age: 'castle', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '中原 北方华北·汉唐城楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
        commanderUnit: 'hero_zhaoyun',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'hei_kuang', count: 2 },
        ],
    },
    // ── 中原 · 帝国时代 · 帝国时代华夏军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：远程（火器）、步兵为主
    //    描述正文（主人原文，一字未改）：（北京、南京；明南京紫禁城、明十三陵、早期居庸关长城；京营三大营三眼铳与神机火器、重型长枪圆牌阵、大航海早期内线精甲卫所军）
    //    英雄队（第 10 队·主将队）：hero_lubu / hero_guanyu / hero_zhangfei / hero_liubei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代华夏军团', civ: '中原', age: 'imperial', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '中原 北方华北·汉唐城楼',
        formationMode: 'fish_scale',
        shipId: 'DRAGON_SHIP',
        commanderUnit: 'hero_zhangfei',
        slots: [
            { type: 'jian_swordman_unshielded', count: 3 },
            { type: 'fire_archer', count: 4 },
            { type: 'fire_lancer', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 河朔　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 河朔 · 古典时代 · 古典时代魏晋军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（邺城、洛阳；邺城铜雀台三台遗址、洛阳太极殿基址；魏晋铁骑长标枪、高桥马鞍重甲冲击、筑垒深壕守御战阵）
    //    英雄队（第 10 队·主将队）：hero_caocao / hero_lubu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代太行军团', civ: '河朔', age: 'antiquity', deStyle: 'ASIA', region: 'WEI' as RegionType,
        buildingStyle: 'WEI',
        castleId: 'WEI_CASTLE_AGE3', castleName: '河朔 邺城重檐铜雀楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
        commanderUnit: 'hero_caocao',
        // 🔴 [2026-10-16 主人令「13 支军团的主力4档，请都套用城堡精锐」] 主力4档＝河朔（魏）城堡兵【虎豹骑·魏虎骑兵精锐】。
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'elite_tiger_cavalry', count: 2 },
        ],
    },
    // ── 河朔 · 封建时代 · 封建时代北朝军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（平城/大同、太原；大同云冈石窟、悬空寺石木栈道；人马俱装甲骑具装、拓跋鲜卑重型骑枪、黄河与阴山石垒要塞防区）
    //    英雄队（第 10 队·主将队）：hero_caocao / hero_lubu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代河朔军团', civ: '河朔', age: 'feudal', deStyle: 'ASIA', region: 'WEI' as RegionType,
        buildingStyle: 'WEI',
        castleId: 'WEI_CASTLE_AGE3', castleName: '河朔 邺城重檐铜雀楼',
        formationMode: 'fish_scale',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_yuanshao',
        slots: [
            { type: 'xianbei_raider', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    // ── 河朔 · 城堡时代 · 城堡时代燕云军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、骑射为主
    //    描述正文（主人原文，一字未改）：（幽州/北京、大同；大同华严寺辽代木构薄伽教藏殿、应县木塔；契丹幽蓟汉儿重装长矛步军、重装弓弩骑兵、燕云十六州锁钥关隘防御）
    //    英雄队（第 10 队·主将队）：hero_caocao / hero_lubu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代燕云军团', civ: '河朔', age: 'castle', deStyle: 'ASIA', region: 'WEI' as RegionType,
        buildingStyle: 'WEI',
        castleId: 'WEI_CASTLE_AGE3', castleName: '河朔 邺城重檐铜雀楼',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_caocao',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
            { type: 'hei_kuang', count: 2 },
        ],
    },
    // ── 河朔 · 帝国时代 · 帝国时代大明军团　（三级升二级）────────────────
    //    评级：【高级】｜核心兵种：战车、骑兵为主
    //    描述正文（主人原文，一字未改）：（蓟州、宣府；宣化古城清远楼、宣大长城砖石要塞、紫荆关；九边重镇精锐骑兵、明式腰刀重圆盾、大航海早期塞北防线车营火器联防大阵）
    //    英雄队（第 10 队·主将队）：hero_caocao / hero_lubu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代大明军团', civ: '河朔', age: 'imperial', deStyle: 'ASIA', region: 'WEI' as RegionType,
        buildingStyle: 'WEI',
        castleId: 'WEI_CASTLE_AGE3', castleName: '河朔 邺城重檐铜雀楼',
        formationMode: 'crescent',
        shipId: 'LOU_CHUAN',
        commanderUnit: 'hero_lubu',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'mangudai', count: 2 },
            { type: 'elite_fire_archer', count: 4 },
        ],
    },

    // ── 江南 · 古典时代 · 古典时代吴越军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（强弩）为主
    //    描述正文（主人原文，一字未改）：（阖闾城/苏州、绍兴；阖闾城城门遗址、印山越王巨石陵木椁；精炼青铜折铁干将莫邪双刃剑、越式机发青铜强弩、断发文身林沼步战突击）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代吴越军团', civ: '江南', age: 'antiquity', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'fish_scale',
        shipId: 'INCENDIARY_RAFT',
        commanderUnit: 'hero_sunquan',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    // ── 江南 · 封建时代 · 封建时代南朝军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、远程为主
    //    描述正文（主人原文，一字未改）：（建康/南京、扬州；栖霞山南朝石刻辟邪、鸡鸣寺台城遗址；南朝神弩车重型床弩、北府兵重装长标枪、步射交织守城破胡阵）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代江淮军团', civ: '江南', age: 'feudal', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'fish_scale',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_sunjian',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：火焰弓箭手普通档（精锐留古典军团）。
        slots: [
            { type: 'jian_swordsman', count: 3 },   // 🔴 [2026-10-19 主人令「DE 里没有、兵模还重复的，删除」] 原 jian_swordman_shielded（与华夏步兵同一 DE 单位、同一兵模）
            { type: 'fire_archer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    // ── 江南 · 城堡时代 · 城堡时代南宋军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、重骑兵为主
    //    描述正文（主人原文，一字未改）：（临安/杭州、镇江；杭州雷峰塔砖心、六和塔石木外檐；岳家军麻扎刀破拐子马、神劲背嵬骑兵、韩家军克敌弓重装步骑协同方阵）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代江南军团', civ: '江南', age: 'castle', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'fish_scale',
        shipId: 'JUNK',
        commanderUnit: 'hero_sunjian',
        slots: [
            { type: 'elite_fire_lancer', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'elite_fire_archer', count: 2 },
        ],
    },
    // ── 江南 · 帝国时代 · 帝国时代两江军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（南京、苏州；南京巨型明城墙中华门瓮城、苏州拙政园早期水阁石舫；江南倭寇平定营、戚家军鸳鸯阵藤牌长枪、大航海早期南直隶鸟铳车步协同大阵）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代两江军团', civ: '江南', age: 'imperial', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
        commanderUnit: 'hero_sunce',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 巴蜀　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 巴蜀 · 古典时代 · 古典时代巴蜀军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻步兵为主
    //    描述正文（主人原文，一字未改）：（成都、广汉；三星堆青铜立人青铜神树神坛、金沙遗址；巴蜀柳叶形双刃青铜剑、虎纹铜戈、西南山林步战散兵阵）
    //    英雄队（第 10 队·主将队）：hero_zhugeliang / hero_liubei / hero_guanyu / hero_zhangfei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代巴蜀军团', civ: '巴蜀', age: 'antiquity', deStyle: 'ASIA', region: 'BASHU' as RegionType,
        buildingStyle: 'BASHU',
        castleId: 'SHU_CASTLE_AGE3', castleName: '巴蜀 汉式斗拱望楼',
        formationMode: 'fish_scale',
        shipId: 'INCENDIARY_SHIP',
        commanderUnit: 'hero_zhugeliang',
        slots: [
            { type: 'elite_white_feather_guard', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    // ── 巴蜀 · 封建时代 · 封建时代剑南军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程、步兵为主
    //    描述正文（主人原文，一字未改）：（成都、剑阁；剑门关悬崖栈道石垒、大邑安仁石窟；剑阁关隘重关扼守、白羽强弩山地步卒、抵御吐蕃高山连环石寨）
    //    英雄队（第 10 队·主将队）：hero_zhugeliang / hero_liubei / hero_guanyu / hero_zhangfei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代剑南军团', civ: '巴蜀', age: 'feudal', deStyle: 'ASIA', region: 'BASHU' as RegionType,
        buildingStyle: 'BASHU',
        castleId: 'SHU_CASTLE_AGE3', castleName: '巴蜀 汉式斗拱望楼',
        formationMode: 'fish_scale',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_liubei',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：蜀白毦兵（普通档）替下借来的中国诸葛弩。
        slots: [
            { type: 'liao_dao', count: 3 },
            { type: 'elite_chukonu', count: 4 },
            { type: 'elite_fire_archer', count: 2 },
        ],
    },
    // ── 巴蜀 · 城堡时代 · 城堡时代川峡军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：远程（弩炮）、重步兵为主
    //    描述正文（主人原文，一字未改）：（合川钓鱼城、重庆；合川钓鱼城绝壁石城、白帝城石垣要塞；嘉陵江断崖重弩炮要塞防御、山城天险死守飞石滚木、击毙蒙哥汗山城铁血死士）
    //    英雄队（第 10 队·主将队）：hero_zhugeliang / hero_liubei / hero_guanyu / hero_zhangfei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代川峡军团', civ: '巴蜀', age: 'castle', deStyle: 'ASIA', region: 'BASHU' as RegionType,
        buildingStyle: 'BASHU',
        castleId: 'SHU_CASTLE_AGE3', castleName: '巴蜀 汉式斗拱望楼',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_zhaoyun',
        slots: [
            { type: 'jian_swordman_unshielded', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    // ── 巴蜀 · 帝国时代 · 帝国时代四川军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：长矛步兵为主
    //    描述正文（主人原文，一字未改）：（成都、保宁；成都明蜀王府遗址、昭化古城砖石城垣；西南白杆兵长矛阵原型、土司狼兵高山利刃短刀、大航海早期川陕咽喉山隘卫所步骑大阵）
    //    英雄队（第 10 队·主将队）：hero_zhugeliang / hero_liubei / hero_guanyu / hero_zhangfei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代四川军团', civ: '巴蜀', age: 'imperial', deStyle: 'ASIA', region: 'BASHU' as RegionType,
        buildingStyle: 'BASHU',
        castleId: 'SHU_CASTLE_AGE3', castleName: '巴蜀 汉式斗拱望楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
        commanderUnit: 'hero_guanyu',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'fire_lancer', count: 4 },
            { type: 'elite_chukonu', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 河西　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 河西 · 古典时代 · 古典时代凉州军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（武威、敦煌；嘉峪关汉代烽燧、悬泉置泥土驿置遗址；汉匈西域争霸、西凉铁骑重铠标枪、敦煌长城内线控弦骑射）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代凉州军团', civ: '河西', age: 'antiquity', deStyle: 'ASIA', region: 'KHITAN' as RegionType,
        buildingStyle: 'KHITAN',
        castleId: 'KHIT_CASTLE_AGE3', castleName: '河西 辽阳八角木石塔楼',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_lubu',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_girgenkhan（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'xianbei_raider', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'tiger_rider', count: 2 },
        ],
    },
    // ── 河西 · 封建时代 · 封建时代归义军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、骑兵混编为主
    //    描述正文（主人原文，一字未改）：（敦煌、酒泉；莫高窟张议潮统军出行图、锁阳城夯土古城墙；起义光复河西、唐蕃交锋孤胆守丝路、驼铃商道轻重装步骑大阵）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代归义军团', civ: '河西', age: 'feudal', deStyle: 'ASIA', region: 'KHITAN' as RegionType,
        buildingStyle: 'KHITAN',
        castleId: 'KHIT_CASTLE_AGE3', castleName: '河西 辽阳八角木石塔楼',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_dongzhuo',
        slots: [
            { type: 'liao_dao', count: 3 },
            { type: 'fire_archer', count: 4 },
            { type: 'hei_kuang', count: 2 },
        ],
    },
    // ── 河西 · 城堡时代 · 城堡时代大夏军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（张掖、黑水城；张掖大佛寺西夏木石大殿、黑水城覆钵式佛塔土要塞；党项西夏经略、铁鹞子冷锻重甲铁骑、沙漠城堡堡垒防务）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代大夏军团', civ: '河西', age: 'castle', deStyle: 'ASIA', region: 'KHITAN' as RegionType,
        buildingStyle: 'KHITAN',
        castleId: 'KHIT_CASTLE_AGE3', castleName: '河西 辽阳八角木石塔楼',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_dongzhuo',
        slots: [
            { type: 'elite_keshik', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'steppe_lancer', count: 2 },
        ],
    },
    // ── 河西 · 帝国时代 · 帝国时代陕甘军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、轻骑兵为主
    //    描述正文（主人原文，一字未改）：（肃州/酒泉、嘉峪关；嘉峪关明代砖石雄关城楼、悬壁长城石垒；明九边肃州卫防线长枪手、塞外巡边骑兵、大航海早期丝路边陲烽燧冷兵器卫垒大阵）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代陕甘军团', civ: '河西', age: 'imperial', deStyle: 'ASIA', region: 'KHITAN' as RegionType,
        buildingStyle: 'KHITAN',
        castleId: 'KHIT_CASTLE_AGE3', castleName: '河西 辽阳八角木石塔楼',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_qutlugh',
        slots: [
            { type: 'elite_liao_dao', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
            { type: 'elite_steppe_lancer', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 白山黑水　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 白山黑水 · 古典时代 · 古典时代肃慎军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程（步弓）为主
    //    描述正文（主人原文，一字未改）：（吉林、长白山；石棺墓群、原始木构聚落；楛矢石砮穿甲硬射、原始森林雪原狩猎、白桦木具与骨角石器兵装）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代肃慎军团', civ: '白山黑水', age: 'antiquity', deStyle: 'ASIA', region: 'NORTHEAST' as RegionType,
        buildingStyle: 'NORTHEAST',
        castleId: 'JURC_CASTLE_AGE3', castleName: '东北 会宁府上京双檐角楼',
        formationMode: 'balance_yoke',
        shipId: 'CANOE',
        commanderUnit: 'hero_sudingfang',
        slots: [
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'xianbei_raider', count: 2 },
            { type: 'antiquity_spearman', count: 3 },
        ],
    },
    // ── 白山黑水 · 封建时代 · 封建时代渤海军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵、步兵为主
    //    描述正文（主人原文，一字未改）：（宁安、延边；渤海国上京龙泉府仿唐宫殿台基、贞惠公主墓石构玄室；仿唐五京里坊制、靺鞨重装马刀骑兵、“海东盛国”雄镇关东步骑方阵）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代渤海军团', civ: '白山黑水', age: 'feudal', deStyle: 'ASIA', region: 'NORTHEAST' as RegionType,
        buildingStyle: 'NORTHEAST',
        castleId: 'JURC_CASTLE_AGE3', castleName: '东北 会宁府上京双檐角楼',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_girgenkhan',
        slots: [
            { type: 'jian_swordman_unshielded', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    // ── 白山黑水 · 城堡时代 · 城堡时代大金军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（阿城、金界壕；金上京会宁府夯土皇城遗址、界壕土石要塞；完颜女真铁浮屠重装具装甲骑、猛安谋克拐子马轻骑、界壕防御战阵）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代大金军团', civ: '白山黑水', age: 'castle', deStyle: 'ASIA', region: 'NORTHEAST' as RegionType,
        buildingStyle: 'NORTHEAST',
        castleId: 'JURC_CASTLE_AGE3', castleName: '东北 会宁府上京双檐角楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
        commanderUnit: 'hero_kotyankhan',
        slots: [
            { type: 'elite_iron_pagoda', count: 3 },
            { type: 'kipchak', count: 4 },
            { type: 'steppe_lancer', count: 2 },
        ],
    },
    // ── 白山黑水 · 帝国时代 · 帝国时代八旗军团　（三级升二级）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、远程为主
    //    描述正文（主人原文，一字未改）：（沈阳、兴京；沈阳故宫大政殿十王亭、赫图阿拉老城木石双层城郭；早期满洲八旗重铠铁骑、大拉力角弓重箭破甲射击、白山黑水大航海早期兴京铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代八旗军团', civ: '白山黑水', age: 'imperial', deStyle: 'ASIA', region: 'NORTHEAST' as RegionType,
        buildingStyle: 'NORTHEAST',
        castleId: 'JURC_CASTLE_AGE3', castleName: '东北 会宁府上京双檐角楼',
        formationMode: 'fish_scale',
        shipId: 'GALLEON',
        commanderUnit: 'hero_girgenkhan',
        slots: [
            { type: 'iron_pagoda', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
            { type: 'elite_steppe_lancer', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 漠北　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 漠北 · 古典时代 · 古典时代匈奴军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑射为主
    //    描述正文（主人原文，一字未改）：（龙城/单于庭、色楞格河；诺音乌拉巨冢古墓、草原石圈祭坛；引弓之民鸣镝重箭、白登围困合围骑阵、草原快马奔袭散兵阵）
    //    英雄队（第 10 队·主将队）：hero_subotai / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代匈奴军团', civ: '漠北蒙古', age: 'antiquity', deStyle: 'ASIA', region: 'STEPPE' as RegionType,
        buildingStyle: 'MONGOL',
        castleId: 'MONG_CASTLE_AGE3', castleName: '蒙古 哈拉和林木石大斡耳朵',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_lubu',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_kushluk（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'scythian_horse_archer', count: 3 },
            { type: 'antiquity_cavalry_archer', count: 4 },
            { type: 'tarkan', count: 2 },
        ],
    },
    // ── 漠北 · 封建时代 · 封建时代突厥军团　（三级升二级）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（鄂尔浑河谷、于都斤山；阙特勤碑花岗岩碑座、突厥石人墓群、狼头纛大营；阿史那氏重甲铁骑、侍卫之士“附离”重弯刀、草原冷锻冶铁战甲）
    //    英雄队（第 10 队·主将队）：hero_subotai / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代突厥军团', civ: '漠北蒙古', age: 'feudal', deStyle: 'ASIA', region: 'STEPPE' as RegionType,
        buildingStyle: 'MONGOL',
        castleId: 'MONG_CASTLE_AGE3', castleName: '蒙古 哈拉和林木石大斡耳朵',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_qutlugh',
        slots: [
            { type: 'steppe_lancer', count: 3 },
            { type: 'khan', count: 4 },
            { type: 'scythian_axe_cavalry', count: 2 },
        ],
    },
    // ── 已存在的二级军团（本次不改编制，只补评级/描述/英雄队）：城堡时代蒙古军团
    //    ✔ 见本表里【城堡时代蒙古军团】那一条前的 ★ 批注（评级：【精锐】｜核心兵种：骑射、轻骑兵为主）
    // ── 漠北 · 帝国时代 · 帝国时代喀尔喀军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（哈拉和林/库伦、额尔德尼召；额尔德尼召早期藏传佛教石墙白塔、土谢图汗早期石木行宫；漠北喀尔喀游牧骑兵、长矛复合弓破阵冲锋、大航海早期达延汗北疆铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_subotai / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代喀尔喀军团', civ: '漠北蒙古', age: 'imperial', deStyle: 'ASIA', region: 'STEPPE' as RegionType,
        buildingStyle: 'MONGOL',
        castleId: 'MONG_CASTLE_AGE3', castleName: '蒙古 哈拉和林木石大斡耳朵',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_subotai',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'mangudai', count: 4 },
            { type: 'elite_steppe_lancer', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 朝鲜　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 朝鲜 · 古典时代 · 古典时代高句丽军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、远程为主
    //    描述正文（主人原文，一字未改）：（平壤、集安；好太王碑、将军坟方坛石室古墓、丸都山城石垒；高句丽具装重甲铁骑、险峻山城防御滚石要塞、坚木角弓高台破甲射术）
    //    英雄队（第 10 队·主将队）：elite_war_wagon / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代高句丽军团', civ: '高丽', age: 'antiquity', deStyle: 'ASIA', region: 'GORYEO' as RegionType,
        buildingStyle: 'KOREA',
        castleId: 'KORE_CASTLE_AGE3', castleName: '高丽 汉阳南汉山城堞楼',
        formationMode: 'fish_scale',
        shipId: 'ANT_GALLEY',
        commanderUnit: 'hero_caocao',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'fire_archer', count: 4 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    // ── 朝鲜 · 封建时代 · 封建时代新罗军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（庆州；佛国寺石阶石桥、石窟庵花岗岩圆拱佛窟、瞻星台；花郎道青年剑术武士、骨品制常备长矛步军、半岛初次统合守卫防线）
    //    英雄队（第 10 队·主将队）：elite_war_wagon / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代新罗军团', civ: '高丽', age: 'feudal', deStyle: 'ASIA', region: 'GORYEO' as RegionType,
        buildingStyle: 'KOREA',
        castleId: 'KORE_CASTLE_AGE3', castleName: '高丽 汉阳南汉山城堞楼',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_guanyu',
        slots: [
            { type: 'liao_dao', count: 3 },
            { type: 'fire_archer', count: 4 },
            { type: 'hei_kuang', count: 2 },
        ],
    },
    // ── 朝鲜 · 帝国时代 · 帝国时代朝鲜军团　（三级升二级）────────────────
    //    评级：【高级】｜核心兵种：战车（火箭车）、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（汉阳/首尔；景福宫光化门石台木楼、汉城石砌环山城郭；三手技长矛火绳枪射手协同、神机箭火箭车、大航海早期胜字铳筒与都城山城防卫大阵）
    //    英雄队（第 10 队·主将队）：elite_war_wagon / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代朝鲜军团', civ: '高丽', age: 'imperial', deStyle: 'ASIA', region: 'GORYEO' as RegionType,
        buildingStyle: 'KOREA',
        castleId: 'KORE_CASTLE_AGE3', castleName: '高丽 汉阳南汉山城堞楼',
        formationMode: 'triangle',
        shipId: 'HERO_ADMIRALYISUNSHIN',
        commanderUnit: 'hero_zhouyu',
        slots: [
            { type: 'war_wagon', count: 2 },
            { type: 'jian_swordsman', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 日本　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 日本 · 古典时代 · 古典时代大和军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（奈良吉野、仁德陵；仁德天皇陵巨型前方后圆土冢、吉野里环壕木栅部落要塞；古坟氏姓铁制直刀、挂甲短甲、氏族武士方木盾步战阵）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代大和军团', civ: '日本', age: 'antiquity', deStyle: 'ASIA', region: 'JAPAN' as RegionType,
        buildingStyle: 'JAPAN',
        castleId: 'ASIA_CASTLE_AGE3', castleName: '东亚/日本 姬路式多重天守阁',
        formationMode: 'triangle',
        shipId: 'GALLEY',
        commanderUnit: 'hero_kitabatake',
        slots: [
            { type: 'elite_skirmisher', count: 2 },
            { type: 'jian_swordsman', count: 3 },
            { type: 'bowman', count: 4 },
        ],
    },
    // ── 日本 · 封建时代 · 封建时代平安军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑射为主
    //    描述正文（主人原文，一字未改）：（京都平安京；平安京大内里朱雀门、宇治平等院凤凰堂；源平合战骑马大铠武士、和弓远距离对射“骑射三度”、早期太刀单骑决斗）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代平安军团', civ: '日本', age: 'feudal', deStyle: 'ASIA', region: 'JAPAN' as RegionType,
        buildingStyle: 'JAPAN',
        castleId: 'ASIA_CASTLE_AGE3', castleName: '东亚/日本 姬路式多重天守阁',
        formationMode: 'fish_scale',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_kitabatake',
        slots: [
            { type: 'jian_swordman_unshielded', count: 3 },
            { type: 'rattan_archer', count: 4 },
            { type: 'levy', count: 2 },
        ],
    },
    // ── 已存在的二级军团（本次不改编制，只补评级/描述/英雄队）：城堡时代幕府军团
    //    ✔ 见本表里【城堡时代幕府军团】那一条前的 ★ 批注（评级：【高级】｜核心兵种：重步兵为主）
    // ── 日本 · 帝国时代 · 帝国时代武家军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（小田原、大阪/堺港；小田原城深壕大土垒要塞、织田安土城早期高石垣天守阁；足轻密集长柄枪方阵、战国武士精钢胴丸野太刀、大航海早期堺港早期铁炮协同防线）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代武家军团', civ: '日本', age: 'imperial', deStyle: 'ASIA', region: 'JAPAN' as RegionType,
        buildingStyle: 'JAPAN',
        castleId: 'ASIA_CASTLE_AGE3', castleName: '东亚/日本 姬路式多重天守阁',
        formationMode: 'fish_scale',
        shipId: 'TURTLE_SHIP',
        commanderUnit: 'hero_nobunaga',
        slots: [
            { type: 'samurai', count: 3 },
            { type: 'ninja', count: 4 },
            { type: 'samurai_elite', count: 2 },
        ],
    },


    // ═══════════════════════════════════════════════════════════════════
    // 日耳曼　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 日耳曼 · 古典时代 · 古典时代条顿军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（条顿堡森林、莱茵河东岸；原木栅栏要塞、萨满圣林神坛；泥木长屋聚落、抵御罗马鹰旗防线、狂暴双刃斧与方阵标枪投射）
    //    英雄队（第 10 队·主将队）：hero_ulrichvonjungingen / hero_johnthefearless　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代条顿军团', civ: '条顿', age: 'antiquity', deStyle: 'WEST', region: 'TEUTONS' as RegionType,
        buildingStyle: 'GERMANIC',
        castleId: 'EAST_CASTLE_AGE3', castleName: '条顿 东欧石堡',
        formationMode: 'echelon',
        shipId: 'MONOREME',
        commanderUnit: 'hero_alaric',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_johnthefearless（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'raider', count: 2 },
        ],
    },
    // ── 日耳曼 · 封建时代 · 封建时代东法兰克军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（雷根斯堡、奎德林堡；早期石构巴西利卡、萨克森罗曼式要塞；奥托大帝重骑兵、平定莱希菲尔德、德意志第一帝国奠基骨干）
    //    英雄队（第 10 队·主将队）：hero_ulrichvonjungingen / hero_johnthefearless　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代东法兰克军团', civ: '条顿', age: 'feudal', deStyle: 'WEST', region: 'TEUTONS' as RegionType,
        buildingStyle: 'GERMANIC',
        castleId: 'EAST_CASTLE_AGE3', castleName: '条顿 东欧石堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_henrythelion',
        slots: [
            { type: 'longswordsman', count: 3 },
            { type: 'arbalest', count: 4 },
            { type: 'pikeman', count: 2 },
        ],
    },
    // ── 日耳曼 · 城堡时代 · 城堡时代德意志骑士军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（马尔堡、纽伦堡；马尔堡砖构城堡主楼、高耸砂岩哥特式修道院要塞；白袍黑十字具装重甲骑士、城堡连环推进、条顿骑士团国疆土扩张）
    //    英雄队（第 10 队·主将队）：hero_ulrichvonjungingen / hero_johnthefearless　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代德意志骑士军团', civ: '条顿', age: 'castle', deStyle: 'WEST', region: 'TEUTONS' as RegionType,
        buildingStyle: 'GERMANIC',
        castleId: 'EAST_CASTLE_AGE3', castleName: '条顿 东欧石堡',
        formationMode: 'fish_scale',
        shipId: 'HULK',
        commanderUnit: 'hero_ulrichvonjungingen',
        slots: [
            { type: 'elite_teutonic_knight', count: 3 },
            { type: 'mounted_crossbowman', count: 4 },
            { type: 'cavalier', count: 2 },
        ],
    },
    // ── 日耳曼 · 帝国时代 · 帝国时代帝国佣兵军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（奥格斯堡、纽伦堡；奥格斯堡早期文艺复兴市政厅、纽伦堡石砌重叠城郭；双手破阵巨剑士（Doppelsöldner）、18英尺密集长矛刺猬阵、马克西米利安精钢板甲与早期火绳枪协同步兵）
    //    英雄队（第 10 队·主将队）：hero_ulrichvonjungingen / hero_johnthefearless　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代德意志佣兵军团', civ: '条顿', age: 'imperial', deStyle: 'WEST', region: 'TEUTONS' as RegionType,
        buildingStyle: 'GERMANIC',
        castleId: 'EAST_CASTLE_AGE3', castleName: '条顿 东欧石堡',
        formationMode: 'echelon',
        shipId: 'CANNON_GALLEON',
        commanderUnit: 'hero_siegfried',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'teutonic_knight', count: 3 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 高卢　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 高卢 · 古典时代 · 古典时代高卢军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（卢格杜努姆/里昂、阿莱西亚；尼姆嘉德水道桥、阿莱西亚要塞遗址；高卢长剑勇士、大木盾步兵方阵、抵御凯撒罗马鹰旗防线）
    //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_joanofarc / hero_joanthemaid　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代高卢军团', civ: '法兰克', age: 'antiquity', deStyle: 'WEST', region: 'FRANKS' as RegionType,
        buildingStyle: 'FRANKS',
        castleId: 'FRAN_CASTLE_AGE3', castleName: '法兰克 卢瓦尔河双圆塔石堡',
        formationMode: 'echelon',
        shipId: 'MONOREME',
        commanderUnit: 'hero_joanthemaid',
        slots: [
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'heavy_swordsman', count: 3 },
            { type: 'antiquity_light_cavalry', count: 2 },
        ],
    },
    // ── 已存在的二级军团（本次不改编制，只补评级/描述/英雄队）：封建时代法兰克军团
    //    ✔ 见本表里【封建时代法兰克军团】那一条前的 ★ 批注
    // ── 高卢 · 城堡时代 · 城堡时代法兰西骑士军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（巴黎、兰斯；巴黎圣母院、圣殿塔城堡要塞；重装封建锁甲骑枪骑士、法兰西哥特式尖肋拱顶城堡、十字军东征攻防大阵）
    //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_joanofarc / hero_joanthemaid　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代法兰西骑士军团', civ: '法兰克', age: 'castle', deStyle: 'WEST', region: 'FRANKS' as RegionType,
        buildingStyle: 'FRANKS',
        castleId: 'FRAN_CASTLE_AGE3', castleName: '法兰克 卢瓦尔河双圆塔石堡',
        formationMode: 'echelon',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_joanofarc',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'master_of_the_templar', count: 2 },
        ],
    },
    // ── 高卢 · 帝国时代 · 帝国时代法兰西军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（巴黎、卢瓦尔河谷；香波堡、枫丹白露宫；欧洲全身精钢板甲重装冲击骑兵（Gendarmes）、超长骑枪人马具装、法兰西文艺复兴皇家宫苑规制）
    //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_joanofarc / hero_joanthemaid　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代法兰西军团', civ: '法兰克', age: 'imperial', deStyle: 'WEST', region: 'FRANKS' as RegionType,
        buildingStyle: 'FRANKS',
        castleId: 'FRAN_CASTLE_AGE3', castleName: '法兰克 卢瓦尔河双圆塔石堡',
        formationMode: 'echelon',
        shipId: 'CANNON_GALLEON',
        commanderUnit: 'hero_bernardarmagnac',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'champion', count: 3 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 勃艮第　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 勃艮第 · 古典时代 · 古典时代勃艮第军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（日内瓦、沃尔姆斯；莱芒湖木石防线、沃尔姆斯王宫石基；重装维京式双刃斧、破阵长标枪、莱茵河谷原始部落拓荒大阵）
    //    英雄队（第 10 队·主将队）：hero_johnthefearless / hero_philipthegood　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代勃艮第军团', civ: '勃艮第', age: 'antiquity', deStyle: 'WEST', region: 'BURGUNDIANS' as RegionType,
        buildingStyle: 'BURGUNDIANS',
        castleId: 'BURG_CASTLE_AGE3', castleName: '勃艮第 第戎公爵宫圆锥塔',
        formationMode: 'echelon',
        shipId: 'MONOREME',
        commanderUnit: 'hero_alaric',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_johnthefearless（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'swordsman', count: 3 },
            { type: 'scout_cavalry', count: 2 },
        ],
    },
    // ── 勃艮第 · 封建时代 · 封建时代阿尔勒军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵为主
    //    描述正文（主人原文，一字未改）：（第戎、阿尔勒；克吕尼修道院三期大殿基址、罗曼式回廊拱券；法兰克锁甲封建骑兵、修道庄园卫戍队、罗讷河谷要塞防线）
    //    英雄队（第 10 队·主将队）：hero_johnthefearless / hero_philipthegood　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代阿尔勒军团', civ: '勃艮第', age: 'feudal', deStyle: 'WEST', region: 'BURGUNDIANS' as RegionType,
        buildingStyle: 'BURGUNDIANS',
        castleId: 'BURG_CASTLE_AGE3', castleName: '勃艮第 第戎公爵宫圆锥塔',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_johnthefearless',
        slots: [
            { type: 'longswordsman', count: 3 },
            { type: 'crossbowman', count: 4 },
            { type: 'knight', count: 2 },
        ],
    },
    // ── 勃艮第 · 城堡时代 · 城堡时代勃艮第公国军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（布鲁日、第戎、根特；布鲁日钟楼、根特圣巴夫大教堂；欧洲全套镀金雕花重型全身板甲、长柄战斧（Bec de Corbin）、奢华重装骑兵卫队）
    //    英雄队（第 10 队·主将队）：hero_johnthefearless / hero_philipthegood　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代勃艮第公国军团', civ: '勃艮第', age: 'castle', deStyle: 'WEST', region: 'BURGUNDIANS' as RegionType,
        buildingStyle: 'BURGUNDIANS',
        castleId: 'BURG_CASTLE_AGE3', castleName: '勃艮第 第戎公爵宫圆锥塔',
        formationMode: 'fish_scale',
        shipId: 'WAR_HULK',
        commanderUnit: 'hero_jacquelineofhainaut',
        slots: [
            { type: 'flemish_pikeman', count: 3 },
            { type: 'heavy_crossbowman', count: 4 },
            { type: 'elite_coustillier', count: 2 },
        ],
    },
    // ── 勃艮第 · 帝国时代 · 帝国时代弗兰德斯军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（布鲁塞尔、安特卫普；安特卫普圣母主教座堂、布鲁塞尔大广场行会建筑群；低地超长矛铁壁方阵、重装剑盾甲士突击、大航海早期呢绒商团与早期帝国棱堡）
    //    英雄队（第 10 队·主将队）：hero_johnthefearless / hero_philipthegood　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代弗兰德斯军团', civ: '勃艮第', age: 'imperial', deStyle: 'WEST', region: 'BURGUNDIANS' as RegionType,
        buildingStyle: 'BURGUNDIANS',
        castleId: 'BURG_CASTLE_AGE3', castleName: '勃艮第 第戎公爵宫圆锥塔',
        formationMode: 'echelon',
        shipId: 'ELITE_CANNON_GALLEON',
        commanderUnit: 'hero_philipthegood',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'flemish_pikeman_f', count: 3 },
            { type: 'coustillier', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 不列颠　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 不列颠 · 古典时代 · 古典时代布立吞军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：战车、轻步兵为主
    //    描述正文（主人原文，一字未改）：（伦迪尼乌姆/伦敦、巴斯；哈德良长城石筑段、巨石阵、巴斯罗马浴场；凯尔特青黛涂身长剑勇士、双轮轻战车突击、林地伏击抵抗防线）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare / hero_friartuck　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代布立吞军团', civ: '不列颠', age: 'antiquity', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        buildingStyle: 'BRITONS',
        castleId: 'WEST_CASTLE_AGE3', castleName: '不列颠 西欧通用石堡',
        formationMode: 'crane_wing',
        shipId: 'MONOREME',
        commanderUnit: 'hero_aethelfrith',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_friartuck（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'war_chariot', count: 2 },
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'woad_raider', count: 3 },
        ],
    },
    // ── 不列颠 · 封建时代 · 封建时代盎格鲁撒克逊军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（温彻斯特、约克；厄尔斯巴顿石教堂方塔、木草大厅；阿尔弗雷德铁壁盾墙方阵、双手丹麦长战斧近卫、七国争霸重步大阵）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare / hero_friartuck　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代盎格鲁撒克逊军团', civ: '不列颠', age: 'feudal', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        buildingStyle: 'BRITONS',
        castleId: 'WEST_CASTLE_AGE3', castleName: '不列颠 西欧通用石堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_gilbertdeclare',
        slots: [
            { type: 'swordsman', count: 3 },
            { type: 'laminated_bowman', count: 4 },
            { type: 'antiquity_light_cavalry', count: 2 },
        ],
    },
    // ── 不列颠 · 城堡时代 · 城堡时代英格兰军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：远程（步弓）为主
    //    描述正文（主人原文，一字未改）：（伦敦、温莎；伦敦塔白塔、温莎城堡圣乔治礼拜堂；威尔士紫杉长弓落日箭雨、板甲重装骑士破阵、诺曼厚壁多层要塞）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare / hero_friartuck　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代英格兰军团', civ: '不列颠', age: 'castle', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        buildingStyle: 'BRITONS',
        castleId: 'WEST_CASTLE_AGE3', castleName: '不列颠 西欧通用石堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_HULK',
        commanderUnit: 'hero_henryv',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'longbowman_elite', count: 4 },
            { type: 'cavalier', count: 2 },
        ],
    },
    // ── 不列颠 · 帝国时代 · 帝国时代都铎卫队军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、远程为主
    //    描述正文（主人原文，一字未改）：（伦敦、朴次茅斯；汉普顿宫红砖都铎建筑群、格林威治宫旧殿；皇家重装双手长戟卫士（Yeomen）、都铎玫瑰金线战袍、早期大航海英格兰长弓与火绳枪长戟混合方阵）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare / hero_friartuck　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代都铎卫队军团', civ: '不列颠', age: 'imperial', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        buildingStyle: 'BRITONS',
        castleId: 'WEST_CASTLE_AGE3', castleName: '不列颠 西欧通用石堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEON',
        commanderUnit: 'hero_williamwallace',
        slots: [
            { type: 'champion', count: 3 },
            { type: 'longbowman', count: 4 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 凯尔特　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 凯尔特 · 古典时代 · 古典时代皮克特军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻步兵为主
    //    描述正文（主人原文，一字未改）：（苏格兰高地、设得兰群岛；双层中空圆形石堡Broch、水中克拉诺格木屋；青黛彩绘身躯刺青、高地轻木小盾（Targe）、林地泥沼伏击刺杀战）
    //    英雄队（第 10 队·主将队）：hero_dafyddapgruffydd / hero_llywelynapgruffydd / hero_williamwallace　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代皮克特军团', civ: '凯尔特', age: 'antiquity', deStyle: 'WEST', region: 'CELTS' as RegionType,
        buildingStyle: 'CELTS',
        castleId: 'CELT_CASTLE_AGE3', castleName: '凯尔特 苏格兰高地圆塔',
        formationMode: 'triangle',
        shipId: 'MONOREME',
        commanderUnit: 'hero_aethelfrith',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_dafyddapgruffydd（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'war_dog', count: 2 },
            { type: 'elite_woad_raider', count: 3 },
            { type: 'bowman', count: 4 },
        ],
    },
    // ── 凯尔特 · 封建时代 · 封建时代高王近卫军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（标枪）为主
    //    描述正文（主人原文，一字未改）：（塔拉高地、卡舍尔；卡舍尔之石圆形高塔、修道院凯尔经手抄室；爱尔兰高王标枪突击散兵、凯尔特高十字石雕庇护、克朗塔夫击溃维京长船战阵）
    //    英雄队（第 10 队·主将队）：hero_dafyddapgruffydd / hero_llywelynapgruffydd / hero_williamwallace　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代高王近卫军团', civ: '凯尔特', age: 'feudal', deStyle: 'WEST', region: 'CELTS' as RegionType,
        buildingStyle: 'CELTS',
        castleId: 'CELT_CASTLE_AGE3', castleName: '凯尔特 苏格兰高地圆塔',
        formationMode: 'triangle',
        shipId: 'GALLEY',
        commanderUnit: 'hero_richarddeclare',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：凯尔特靛蓝突袭者（普通档）替链甲剑士。
        slots: [
            { type: 'elite_war_dog', count: 2 },
            { type: 'woad_raider', count: 3 },
            { type: 'elite_skirmisher', count: 4 },
        ],
    },
    // ── 凯尔特 · 城堡时代 · 城堡时代盖尔军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（爱丁堡、斯特灵；爱丁堡火山岩绝壁城堡、斯特灵石桥要塞；苏格兰长矛刺猬圆阵（Schiltron）、双手重型高地斩马阔剑（Claymore）、氏族风笛战吼冲锋）
    //    英雄队（第 10 队·主将队）：hero_dafyddapgruffydd / hero_llywelynapgruffydd / hero_williamwallace　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代盖尔军团', civ: '凯尔特', age: 'castle', deStyle: 'WEST', region: 'CELTS' as RegionType,
        buildingStyle: 'CELTS',
        castleId: 'CELT_CASTLE_AGE3', castleName: '凯尔特 苏格兰高地圆塔',
        formationMode: 'fish_scale',
        shipId: 'HULK',
        commanderUnit: 'hero_dafyddapgruffydd',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
            { type: 'halberdier', count: 2 },
        ],
    },
    // ── 凯尔特 · 帝国时代 · 帝国时代苏格兰高地军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（多尼戈尔、都柏林近郊；卡里克弗格斯诺曼要塞、盖尔石头碉楼塔楼；重装锁子甲双手长柄破甲重斧、宗族长斧近卫狂战、大航海早期抵御都铎入侵铁壁防线）
    //    英雄队（第 10 队·主将队）：hero_dafyddapgruffydd / hero_llywelynapgruffydd / hero_williamwallace　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代苏格兰高地军团', civ: '凯尔特', age: 'imperial', deStyle: 'WEST', region: 'CELTS' as RegionType,
        buildingStyle: 'CELTS',
        castleId: 'CELT_CASTLE_AGE3', castleName: '凯尔特 苏格兰高地圆塔',
        formationMode: 'echelon',
        shipId: 'HEAVY_DEMO_SHIP',
        commanderUnit: 'hero_llywelynapgruffydd',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'light_cavalry', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 斯堪的纳维亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 斯堪的纳维亚 · 古典时代 · 古典时代北欧日耳曼军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（乌普萨拉老城；旧乌普萨拉巨型皇家土冢、石船墓葬阵列；奥丁狂暴熊皮死士、双手重型伐木斧、原始萨满符文石阵血祭冲锋）
    //    英雄队（第 10 队·主将队）：hero_harald / hero_ulf / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代北欧日耳曼军团', civ: '维京', age: 'antiquity', deStyle: 'WEST', region: 'VIKINGS' as RegionType,
        buildingStyle: 'VIKINGS',
        castleId: 'VIKI_CASTLE_AGE3', castleName: '维京 斯堪的纳维亚环形堡垒',
        formationMode: 'echelon',
        shipId: 'LONGBOAT',
        commanderUnit: 'hero_halldor',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_harald（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'skirmisher', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'norse_warrior', count: 2 },
        ],
    },
    // ── 斯堪的纳维亚 · 封建时代 · 封建时代维京军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（海瑟比、比尔卡；乌尔内斯木板教堂、博尔贡木教堂；双手破甲丹麦战斧、圆盾交叠铁壁盾墙（Skjaldborg）、北欧重装异教大军陆地推进方阵）
    //    英雄队（第 10 队·主将队）：hero_harald / hero_ulf / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代维京军团', civ: '维京', age: 'feudal', deStyle: 'WEST', region: 'VIKINGS' as RegionType,
        buildingStyle: 'VIKINGS',
        castleId: 'VIKI_CASTLE_AGE3', castleName: '维京 斯堪的纳维亚环形堡垒',
        formationMode: 'echelon',
        shipId: 'HERO_LEIFERIKSON',
        commanderUnit: 'hero_harald',
        slots: [
            { type: 'elite_skirmisher', count: 4 },
            { type: 'elite_berserk', count: 3 },
            { type: 'norse_chieftain', count: 2 },
        ],
    },
    // ── 斯堪的纳维亚 · 城堡时代 · 城堡时代北欧军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（维斯比、罗斯基勒；维斯比石灰石环形城墙、卡尔马石堡水郭；双手长柄丹麦破甲巨斧、拜占庭式重装锁甲鳞甲、誓死效忠中枢城堡近卫）
    //    英雄队（第 10 队·主将队）：hero_harald / hero_ulf / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代北欧军团', civ: '维京', age: 'castle', deStyle: 'WEST', region: 'VIKINGS' as RegionType,
        buildingStyle: 'VIKINGS',
        castleId: 'VIKI_CASTLE_AGE3', castleName: '维京 斯堪的纳维亚环形堡垒',
        formationMode: 'fish_scale',
        shipId: 'ELITE_LONGBOAT',
        commanderUnit: 'hero_finnarnason',
        slots: [
            { type: 'berserk', count: 3 },
            { type: 'crossbowman', count: 4 },
            { type: 'elite_varangian_guard', count: 2 },
        ],
    },
    // ── 斯堪的纳维亚 · 帝国时代 · 帝国时代达拉纳长矛军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（重弩）为主
    //    描述正文（主人原文，一字未改）：（斯德哥尔摩、达拉纳；早期斯德哥尔摩王家城堡要塞、格里普斯霍尔姆红砖石堡；达拉纳冷锻钢长矛方阵、北欧滑雪重弩猎手、大航海早期卡尔马起义军林地重步防线）
    //    英雄队（第 10 队·主将队）：hero_harald / hero_ulf / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代达拉纳长矛军团', civ: '维京', age: 'imperial', deStyle: 'WEST', region: 'VIKINGS' as RegionType,
        buildingStyle: 'VIKINGS',
        castleId: 'VIKI_CASTLE_AGE3', castleName: '维京 斯堪的纳维亚环形堡垒',
        formationMode: 'fish_scale',
        shipId: 'CATAPULT_GALLEON',
        commanderUnit: 'hero_ulf',
        slots: [
            { type: 'heavy_pikeman', count: 3 },
            { type: 'heavy_crossbowman', count: 4 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 哥特　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 哥特 · 古典时代 · 古典时代西哥特军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（托莱多、阿德里安堡、图卢兹；圣胡安德巴尼奥斯早期马蹄拱教堂、西哥特黄金还愿冠神坛；阿德里安堡重装破阵冲击骑兵、罗马破城者双手大剑、掠夺永恒之城铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_alaric / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代西哥特军团', civ: '哥特', age: 'antiquity', deStyle: 'WEST', region: 'GOTHS' as RegionType,
        buildingStyle: 'GOTHS',
        castleId: 'GOTH_CASTLE_AGE3', castleName: '哥特 早期蛮族石砌据点',
        formationMode: 'fish_scale',
        shipId: 'MONOREME',
        commanderUnit: 'hero_alaric',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_ataulf（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'huskarl', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'shock_cavalry', count: 2 },
        ],
    },
    // ── 哥特 · 封建时代 · 封建时代阿斯图里亚斯军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（奥维耶多、科瓦东加；纳兰科圣玛利亚前罗曼式石堂、圣米格尔浮雕立柱；科瓦东加绝壁以少胜多伏击、阿斯图里亚斯山地锁甲重矛手、西欧收复失地运动传奇先锋）
    //    英雄队（第 10 队·主将队）：hero_alaric / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代阿斯图里亚斯军团', civ: '哥特', age: 'feudal', deStyle: 'WEST', region: 'GOTHS' as RegionType,
        buildingStyle: 'GOTHS',
        castleId: 'GOTH_CASTLE_AGE3', castleName: '哥特 早期蛮族石砌据点',
        formationMode: 'echelon',
        shipId: 'GALLEY',
        commanderUnit: 'hero_ataulf',
        slots: [
            { type: 'elite_skirmisher', count: 4 },
            { type: 'elite_huskarl', count: 3 },
            { type: 'light_cavalry', count: 2 },
        ],
    },
    // ── 哥特 · 城堡时代 · 城堡时代崖城卫队军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、远程（重弩）为主
    //    描述正文（主人原文，一字未改）：（曼古普卡勒崖城；克里米亚喀斯特悬崖城堡主楼、绝壁洞穴修道院防御网；依山雕凿石堡连环重弩防御、高耸石壁双手斩马重斧、孤守抗击异教围攻死士）
    //    英雄队（第 10 队·主将队）：hero_alaric / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代崖城卫队军团', civ: '哥特', age: 'castle', deStyle: 'WEST', region: 'GOTHS' as RegionType,
        buildingStyle: 'GOTHS',
        castleId: 'GOTH_CASTLE_AGE3', castleName: '哥特 早期蛮族石砌据点',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_theodoricthegoth',
        slots: [
            { type: 'huskarl', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
            { type: 'cavalier', count: 2 },
        ],
    },
    // ── 哥特 · 帝国时代 · 帝国时代黑海铁卫军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程、重步兵为主
    //    描述正文（主人原文，一字未改）：（奇福特卡勒、南部黑海山谷；克里米亚岩石要塞高塔、古哥特语雕凿石碑；黑海冷兵器山地强弓死士、重装长戟高地伏击卫队、大航海早期孤傲要塞最后遗族）
    //    英雄队（第 10 队·主将队）：hero_alaric / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代黑海铁卫军团', civ: '哥特', age: 'imperial', deStyle: 'WEST', region: 'GOTHS' as RegionType,
        buildingStyle: 'GOTHS',
        castleId: 'GOTH_CASTLE_AGE3', castleName: '哥特 早期蛮族石砌据点',
        formationMode: 'echelon',
        shipId: 'DROMON',
        commanderUnit: 'hero_ataulf',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'elite_huskarl', count: 3 },
            { type: 'cavalier', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 萨克森　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 萨克森 · 古典时代 · 古典时代撒克逊军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（易北河、威悉河下游；木构神圣伊尔敏苏尔木柱神坛、原木防御营垒；单刃开山短剑（Seax）劈砍、北海沿岸划艇闪击掠夺、原始林地伏击方阵）
    //    英雄队（第 10 队·主将队）：hero_tostig / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代撒克逊军团', civ: '撒克逊', age: 'antiquity', deStyle: 'WEST', region: 'SAXONS' as RegionType,
        buildingStyle: 'SAXONS',
        castleId: 'SAXO_CASTLE_AGE3', castleName: '撒克逊 石木混筑塔堡',
        formationMode: 'echelon',
        shipId: 'MONOREME',
        commanderUnit: 'hero_aethelfrith',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_tostig（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'skirmisher', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'scout_cavalry', count: 2 },
        ],
    },
    // ── 萨克森 · 封建时代 · 封建时代奥托铁卫军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（奎德林堡、马格德堡；奎德林堡圣塞尔瓦蒂乌斯双唱诗席石堂、早期马格德堡水陆堡垒；莱希菲尔德破阵锁甲重骑兵、东部边区开拓戍边大阵、神罗萨克森王朝铁血中坚）
    //    英雄队（第 10 队·主将队）：hero_tostig / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代奥托铁卫军团', civ: '撒克逊', age: 'feudal', deStyle: 'WEST', region: 'SAXONS' as RegionType,
        buildingStyle: 'SAXONS',
        castleId: 'SAXO_CASTLE_AGE3', castleName: '撒克逊 石木混筑塔堡',
        formationMode: 'echelon',
        shipId: 'HULK',
        commanderUnit: 'hero_tostig',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'elite_hearth_troop', count: 3 },
            { type: 'varangian_guard', count: 2 },
        ],
    },
    // ── 萨克森 · 城堡时代 · 城堡时代萨克森选侯国军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（迈森、德累斯顿；迈森阿尔布莱希茨山崖石筑宫堡、早生期哥特式修道院要塞；全套镀黑精钢板甲、易北河重装枪骑兵卫队、七大选帝侯亲卫铁骑）
    //    英雄队（第 10 队·主将队）：hero_tostig / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代萨克森选侯国军团', civ: '撒克逊', age: 'castle', deStyle: 'WEST', region: 'SAXONS' as RegionType,
        buildingStyle: 'SAXONS',
        castleId: 'SAXO_CASTLE_AGE3', castleName: '撒克逊 石木混筑塔堡',
        formationMode: 'echelon',
        shipId: 'TRADE_COG',
        commanderUnit: 'hero_frederickbarbarossa',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'hearth_troop', count: 3 },
            { type: 'elite_varangian_guard', count: 2 },
        ],
    },
    // ── 萨克森 · 帝国时代 · 帝国时代萨克森军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（维滕贝格、托尔高；托尔高哈滕费尔斯文艺复兴早期螺旋梯宫堡、早期多角堡垒要塞；超长密集刺猬矛阵、两手重型破阵巨剑士（Doppelsöldner）、大航海早期施马尔卡尔登同盟铁壁卫队）
    //    英雄队（第 10 队·主将队）：hero_tostig / hero_ataulf　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代萨克森军团', civ: '撒克逊', age: 'imperial', deStyle: 'WEST', region: 'SAXONS' as RegionType,
        buildingStyle: 'SAXONS',
        castleId: 'SAXO_CASTLE_AGE3', castleName: '撒克逊 石木混筑塔堡',
        formationMode: 'fish_scale',
        shipId: 'HERO_STOERTEBEKER',
        commanderUnit: 'hero_tostig',
        slots: [
            { type: 'heavy_pikeman', count: 3 },
            { type: 'heavy_crossbowman', count: 4 },
            { type: 'champion', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 诺夫哥罗德　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 诺夫哥罗德 · 古典时代 · 古典时代楚德林莽军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（标枪）为主
    //    描述正文（主人原文，一字未改）：（伊尔门湖区、拉多加湖沼；原木桩木屋营寨、巨石萨满祭坛；雪橇机动穿插、冷锻猎熊重矛、针叶林浸毒标枪伏击方阵）
    //    英雄队（第 10 队·主将队）：hero_harald / hero_halldor　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代楚德林莽军团', civ: '瓦良格', age: 'antiquity', deStyle: 'WEST', region: 'VARANGIANS' as RegionType,
        buildingStyle: 'VARANGIANS',
        castleId: 'VARA_CASTLE_AGE3', castleName: '瓦良格 诺斯山形屋顶要塞',
        formationMode: 'echelon',
        shipId: 'MONOREME',
        commanderUnit: 'hero_ulf',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_harald（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'skirmisher', count: 4 },
            { type: 'norse_warrior', count: 3 },
            { type: 'antiquity_scout_cavalry', count: 2 },
        ],
    },
    // ── 诺夫哥罗德 · 封建时代 · 封建时代瓦良格军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（拉多加堡、旧诺夫哥罗德；木石混合环形要塞城郭、沃尔霍夫河商贸关垒；瓦良格北欧重装阔剑、交叠彩绘圆盾、罗斯商路重装亲卫步骑护卫队（Druzhina））
    //    英雄队（第 10 队·主将队）：hero_harald / hero_halldor　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代瓦良格军团', civ: '瓦良格', age: 'feudal', deStyle: 'WEST', region: 'VARANGIANS' as RegionType,
        buildingStyle: 'VARANGIANS',
        castleId: 'VARA_CASTLE_AGE3', castleName: '瓦良格 诺斯山形屋顶要塞',
        formationMode: 'echelon',
        shipId: 'LONGBOAT',
        commanderUnit: 'hero_harald',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'elite_varangian_guard', count: 3 },
            { type: 'antiquity_light_cavalry', count: 2 },
        ],
    },
    // ── 诺夫哥罗德 · 城堡时代 · 城堡时代诺夫哥罗德军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（大诺夫哥罗德；圣索菲亚大教堂青铜大门、德捷茨白石要塞城垣；亚历山大·涅夫斯基东斯拉夫面具鳞甲骑兵、重型长矛刺猬拒马大阵、冰上之战破铁十字死士）
    //    英雄队（第 10 队·主将队）：hero_harald / hero_halldor　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代诺夫哥罗德军团', civ: '瓦良格', age: 'castle', deStyle: 'WEST', region: 'VARANGIANS' as RegionType,
        buildingStyle: 'VARANGIANS',
        castleId: 'VARA_CASTLE_AGE3', castleName: '瓦良格 诺斯山形屋顶要塞',
        formationMode: 'balance_yoke',
        shipId: 'ELITE_LONGBOAT',
        commanderUnit: 'hero_alexandernevski',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'elite_varangian_jarl', count: 2 },
            { type: 'varangian_guard', count: 3 },
        ],
    },
    // ── 诺夫哥罗德 · 帝国时代 · 帝国时代北境长斧军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（大诺夫哥罗德、阿尔汉格尔斯克；大诺夫哥罗德贸易货栈钟楼、早期北德维纳河出海口木石堡垒；双手重型长柄月牙破甲战斧（Bardiche）、北境雪地重装皮甲猎手、征服乌拉尔冻土冷兵器先锋卫队）
    //    英雄队（第 10 队·主将队）：hero_harald / hero_halldor　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代北境长斧军团', civ: '瓦良格', age: 'imperial', deStyle: 'WEST', region: 'VARANGIANS' as RegionType,
        buildingStyle: 'VARANGIANS',
        castleId: 'VARA_CASTLE_AGE3', castleName: '瓦良格 诺斯山形屋顶要塞',
        formationMode: 'crescent',
        shipId: 'CATAPULT_GALLEON',
        commanderUnit: 'hero_harald',
        slots: [
            { type: 'elite_varangian_guard', count: 3 },
            { type: 'varangian_jarl', count: 2 },
            { type: 'recurve_bowman', count: 4 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 日德兰　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第二批·西欧与北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 日德兰 · 古典时代 · 古典时代日德兰军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（日德兰半岛森林、尼达姆沼泽；沼泽祭祀神坑原木护坡、朱特人橡木茅草长屋；冷锻生铁宽矛、泥沼浅滩步战突袭、强渡北海无畏冲锋大阵）
    //    英雄队（第 10 队·主将队）：hero_ulf / hero_harald　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代日德兰军团', civ: '丹麦', age: 'antiquity', deStyle: 'WEST', region: 'DANES' as RegionType,
        buildingStyle: 'DANES',
        castleId: 'DANE_CASTLE_AGE3', castleName: '丹麦 圆塔木石堡',
        formationMode: 'echelon',
        shipId: 'LONGBOAT',
        commanderUnit: 'hero_ulf',
        slots: [
            { type: 'skirmisher', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'norse_warrior', count: 2 },
        ],
    },
    // ── 日德兰 · 封建时代 · 封建时代丹麦王国军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（耶灵、特雷勒堡；耶灵石碑符文刻石、精密同心圆土木环形军营要塞；双手长柄丹麦破甲巨斧、八字胡斯韦恩北海铁骑、统一北欧职业王室禁卫大阵）
    //    英雄队（第 10 队·主将队）：hero_ulf / hero_harald　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代丹麦王国军团', civ: '丹麦', age: 'feudal', deStyle: 'WEST', region: 'DANES' as RegionType,
        buildingStyle: 'DANES',
        castleId: 'DANE_CASTLE_AGE3', castleName: '丹麦 圆塔木石堡',
        formationMode: 'echelon',
        shipId: 'HERO_DREKI',
        commanderUnit: 'hero_hrolftheganger',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'elite_jomsviking', count: 3 },
            { type: 'varangian_guard', count: 2 },
        ],
    },
    // ── 日德兰 · 城堡时代 · 城堡时代丹麦骑士军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（罗斯基勒、沃尔丁堡；罗斯基勒双塔红砖主教座堂、沃尔丁堡金鹅石塔水郭；红底白十字波罗的海十字军骑士、全套精钢重装锁子甲、海峡咽喉红砖要塞围攻战）
    //    英雄队（第 10 队·主将队）：hero_ulf / hero_harald　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代丹麦骑士军团', civ: '丹麦', age: 'castle', deStyle: 'WEST', region: 'DANES' as RegionType,
        buildingStyle: 'DANES',
        castleId: 'DANE_CASTLE_AGE3', castleName: '丹麦 圆塔木石堡',
        formationMode: 'echelon',
        shipId: 'THE_MIDDLEBROOK',
        commanderUnit: 'hero_kalfarnason',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'jomsviking', count: 3 },
            { type: 'elite_varangian_guard', count: 2 },
        ],
    },
    // ── 日德兰 · 帝国时代 · 帝国时代丹麦军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（赫尔辛格、哥本哈根；克隆堡宫文艺复兴青铜绿顶城堡、早期松德海峡角楼炮台；重装双手精钢长戟近卫、丹麦王室火绳枪手与重炮营、全欧咽喉要塞陆防铁壁卫队）
    //    英雄队（第 10 队·主将队）：hero_ulf / hero_harald　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代丹麦军团', civ: '丹麦', age: 'imperial', deStyle: 'WEST', region: 'DANES' as RegionType,
        buildingStyle: 'DANES',
        castleId: 'DANE_CASTLE_AGE3', castleName: '丹麦 圆塔木石堡',
        formationMode: 'echelon',
        shipId: 'CATAPULT_GALLEON',
        commanderUnit: 'hero_ulf',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'champion', count: 3 },
            { type: 'mounted_crossbowman_heavy', count: 2 },
        ],
    },


    // ═══════════════════════════════════════════════════════════════════
    // 拜占庭　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 拜占庭 · 古典时代 · 古典时代东罗马军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（君士坦丁堡；狄奥多西三重城墙、君士坦丁凯旋柱、地下水宫；三层护城壕石砌坚壁要塞、东罗马重型标枪方阵、罗马古典城防鹰旗大阵）
    //    英雄队（第 10 队·主将队）：hero_basileus / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代东罗马军团', civ: '拜占庭', age: 'antiquity', deStyle: 'EAST', region: 'BYZANTINE' as RegionType,
        buildingStyle: 'BYZANTINE',
        castleId: 'BYZA_CASTLE_AGE3', castleName: '拜占庭 君士坦丁堡红砖穹顶堡',
        formationMode: 'fish_scale',
        shipId: 'TRIREME',
        commanderUnit: 'hero_basileus',
        slots: [
            { type: 'imperial_legionary', count: 3 },
            { type: 'cretan_archer', count: 4 },
            { type: 'imperial_centurion', count: 2 },
        ],
    },
    // ── 拜占庭 · 封建时代 · 封建时代拜占庭军区军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（君士坦丁堡、安纳托利亚；圣索菲亚大教堂马赛克殿堂、达芙妮修道院；人马俱装重甲冲击铁骑（Cataphract）、手持喷筒式希腊火的伴随重步兵、军区制步骑协同大阵）
    //    英雄队（第 10 队·主将队）：hero_basileus / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代拜占庭军区军团', civ: '拜占庭', age: 'feudal', deStyle: 'EAST', region: 'BYZANTINE' as RegionType,
        buildingStyle: 'BYZANTINE',
        castleId: 'BYZA_CASTLE_AGE3', castleName: '拜占庭 君士坦丁堡红砖穹顶堡',
        formationMode: 'fish_scale',
        shipId: 'DROMON',
        commanderUnit: 'hero_basileus',
        slots: [
            { type: 'equites', count: 3 },
            { type: 'crossbowman', count: 4 },
            { type: 'elite_cataphract', count: 2 },
        ],
    },
    // ── 拜占庭 · 城堡时代 · 城堡时代拜占庭军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（君士坦丁堡、米斯特拉斯；布拉赫奈宫城垣、乔拉教堂石雕修道院；双手长柄破甲重战斧、双头鹰要塞守备步兵、中世纪晚期城门死士防御阵）
    //    英雄队（第 10 队·主将队）：hero_basileus / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代拜占庭军团', civ: '拜占庭', age: 'castle', deStyle: 'EAST', region: 'BYZANTINE' as RegionType,
        buildingStyle: 'BYZANTINE',
        castleId: 'BYZA_CASTLE_AGE3', castleName: '拜占庭 君士坦丁堡红砖穹顶堡',
        formationMode: 'fish_scale',
        shipId: 'DROMON',
        commanderUnit: 'hero_basileus',
        slots: [
            { type: 'elite_varangian_guard', count: 3 },
            { type: 'arbalest', count: 4 },
            { type: 'cataphract', count: 2 },
        ],
    },
    // ── 拜占庭 · 帝国时代 · 帝国时代东正教军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：远程（步弓）、重步兵为主
    //    描述正文（主人原文，一字未改）：（伊斯坦布尔；托普卡帕宫内廷要塞、法提赫早期清真寺铅皮穹顶；重型反曲复合强弓、大马士革弯刀重装白帽步兵、大航海早期横扫地中海巨舰要塞大阵）
    //    英雄队（第 10 队·主将队）：hero_basileus / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代东正教军团', civ: '拜占庭', age: 'imperial', deStyle: 'EAST', region: 'BYZANTINE' as RegionType,
        buildingStyle: 'BYZANTINE',
        castleId: 'BYZA_CASTLE_AGE3', castleName: '拜占庭 君士坦丁堡红砖穹顶堡',
        formationMode: 'echelon',
        shipId: 'DROMON',
        commanderUnit: 'archbishop',   // 🔴 [2026-10-19 主人令「主将队换法术系」「帝国可以用所有的」] 原 hero_tsarkonstantin（战车）；东正教 → 大主教（法术系精英兵，帝国时代军团可用任何时代的英雄／精英兵）
        slots: [
            { type: 'royal_janissary', count: 4 },
            { type: 'elite_guardsman', count: 3 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 亚美尼亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 亚美尼亚 · 古典时代 · 古典时代大亚美尼亚军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（阿尔塔沙特、梯格拉诺克塔；加尼玄武岩希腊化爱奥尼柱式神殿；人马俱装艾鲁齐（Ayrudzi）重骑兵、重型长骑枪破阵冲击、高加索高地大阵）
    //    英雄队（第 10 队·主将队）：hero_thoros / hero_tamar　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代大亚美尼亚军团', civ: '亚美尼亚', age: 'antiquity', deStyle: 'EAST', region: 'ARMENIANS' as RegionType,
        buildingStyle: 'ARMENIANS',
        castleId: 'ARME_CASTLE_AGE3', castleName: '亚美尼亚 埃奇米阿津石砌山顶堡',
        formationMode: 'fish_scale',
        shipId: 'BIREME',
        commanderUnit: 'hero_belisarius',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_thoros（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'antiquity_spearman', count: 3 },
            { type: 'composite_bowman', count: 4 },
            { type: 'cataphract', count: 2 },
        ],
    },
    // ── 亚美尼亚 · 封建时代 · 封建时代巴格拉图尼军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（阿尼城；阿尼千零一座教堂遗址、双层多色玄武岩抗震城墙；复合铁鳞甲高原山地步兵、重型破甲铁骨朵、千城之都商路关隘铁壁防守）
    //    英雄队（第 10 队·主将队）：hero_thoros / hero_tamar　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代巴格拉图尼军团', civ: '亚美尼亚', age: 'feudal', deStyle: 'EAST', region: 'ARMENIANS' as RegionType,
        buildingStyle: 'ARMENIANS',
        castleId: 'ARME_CASTLE_AGE3', castleName: '亚美尼亚 埃奇米阿津石砌山顶堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_stephan',
        slots: [
            { type: 'warrior_priest', count: 3 },
            { type: 'elite_composite_bowman', count: 4 },
            { type: 'knight', count: 2 },
        ],
    },
    // ── 亚美尼亚 · 城堡时代 · 城堡时代奇里乞亚军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、远程（重弩）为主
    //    描述正文（主人原文，一字未改）：（科里科斯、西斯；科里科斯海中浮堡石头要塞、托罗斯山脉悬崖要塞群；融合法兰克骑士重装板甲、地中海海陆双防要塞重弩、十字军东征坚固东方重装铁骑）
    //    英雄队（第 10 队·主将队）：hero_thoros / hero_tamar　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代奇里乞亚军团', civ: '亚美尼亚', age: 'castle', deStyle: 'EAST', region: 'ARMENIANS' as RegionType,
        buildingStyle: 'ARMENIANS',
        castleId: 'ARME_CASTLE_AGE3', castleName: '亚美尼亚 埃奇米阿津石砌山顶堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_thoros',
        slots: [
            { type: 'warrior_priest', count: 3 },
            { type: 'composite_bowman', count: 4 },
            { type: 'frankish_paladin', count: 2 },
        ],
    },
    // ── 亚美尼亚 · 帝国时代 · 帝国时代亚美尼亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程、步兵为主
    //    描述正文（主人原文，一字未改）：（凡城、萨松；凡城阿赫塔马尔岛圣十字修道院、雕花十字架石碑阵（Khachkar）；梅利克自治山地强弓步兵、高山隘口重柄大砍刀伏击、大航海早期孤守高加索石头堡垒卫队）
    //    英雄队（第 10 队·主将队）：hero_thoros / hero_tamar　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代亚美尼亚军团', civ: '亚美尼亚', age: 'imperial', deStyle: 'EAST', region: 'ARMENIANS' as RegionType,
        buildingStyle: 'ARMENIANS',
        castleId: 'ARME_CASTLE_AGE3', castleName: '亚美尼亚 埃奇米阿津石砌山顶堡',
        formationMode: 'fish_scale',
        shipId: 'DROMON',
        commanderUnit: 'hero_thoros',
        slots: [
            { type: 'warrior_priest', count: 3 },
            { type: 'elite_composite_bowman', count: 4 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 高加索　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 高加索 · 古典时代 · 古典时代高加索伊比利亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（姆茨赫塔、乌普利斯齐赫；乌普利斯齐赫砂岩悬崖凿岩城、库拉河水运石桥哨所；高山生铁重砍刀、岩壁粗糙硬木长标枪、高加索高山隘口阻击方阵）
    //    英雄队（第 10 队·主将队）：hero_tamar / hero_thoros　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代高加索伊比利亚军团', civ: '格鲁吉亚', age: 'antiquity', deStyle: 'EAST', region: 'GEORGIANS' as RegionType,
        buildingStyle: 'GEORGIANS',
        castleId: 'GEOR_CASTLE_AGE3', castleName: '格鲁吉亚 高加索斯万石塔古堡',
        formationMode: 'fish_scale',
        shipId: 'BIREME',
        commanderUnit: 'hero_zakare',
        slots: [
            { type: 'sakan_axeman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'monaspa', count: 2 },
        ],
    },
    // ── 高加索 · 封建时代 · 封建时代巴格拉特铁骑军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（姆茨赫塔、库塔伊西；季瓦里多层八角锥顶修道院、巴格拉特高山大教堂；高加索山地重装锁甲骑兵、破阵马刀与冲锋重枪、抗击阿拉伯帝国侵袭山谷铁壁卫队）
    //    英雄队（第 10 队·主将队）：hero_tamar / hero_thoros　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代巴格拉特铁骑军团', civ: '格鲁吉亚', age: 'feudal', deStyle: 'EAST', region: 'GEORGIANS' as RegionType,
        buildingStyle: 'GEORGIANS',
        castleId: 'GEOR_CASTLE_AGE3', castleName: '格鲁吉亚 高加索斯万石塔古堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_ivane',
        slots: [
            { type: 'swordsman', count: 3 },
            { type: 'laminated_bowman', count: 4 },
            { type: 'antiquity_light_cavalry', count: 2 },
        ],
    },
    // ── 高加索 · 城堡时代 · 城堡时代格鲁吉亚军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（第比利斯、瓦尔齐亚；瓦尔齐亚十三层悬崖凿岩修道院洞窟城、斯瓦涅季防御石塔群（Koshki）；高加索东方重板鳞甲骑兵、迪德格里破阵铁骑、高山垂直绝壁要塞防御大阵）
    //    英雄队（第 10 队·主将队）：hero_tamar / hero_thoros　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代格鲁吉亚军团', civ: '格鲁吉亚', age: 'castle', deStyle: 'EAST', region: 'GEORGIANS' as RegionType,
        buildingStyle: 'GEORGIANS',
        castleId: 'GEOR_CASTLE_AGE3', castleName: '格鲁吉亚 高加索斯万石塔古堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_tamar',
        slots: [
            { type: 'elite_guardsman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'elite_monaspa', count: 2 },
        ],
    },
    // ── 高加索 · 帝国时代 · 帝国时代高加索军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（泰拉维、阿纳努里；阿纳努里双塔石筑城堡要塞、纳里卡拉悬崖坚固城郭；全员精钢锁甲大铁圆盾勇士、高山隘口阔剑（Dashna）死斗、大航海早期夹缝孤守要塞宗族军团）
    //    英雄队（第 10 队·主将队）：hero_tamar / hero_thoros　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代高加索军团', civ: '格鲁吉亚', age: 'imperial', deStyle: 'EAST', region: 'GEORGIANS' as RegionType,
        buildingStyle: 'GEORGIANS',
        castleId: 'GEOR_CASTLE_AGE3', castleName: '格鲁吉亚 高加索斯万石塔古堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEON',
        commanderUnit: 'hero_ivane',
        slots: [
            { type: 'elite_guardsman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'monaspa', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 波兰　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 波兰 · 古典时代 · 古典时代卢吉军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（维斯瓦河流域、奥斯特鲁夫；普热沃尔斯克火葬墓穴群、沼泽木桩防御营寨；折刃冷锻长剑（Spatha）、倒钩猎熊重矛、原始橡木森林泥沼伏击大阵）
    //    英雄队（第 10 队·主将队）：hero_jadwiga / hero_jogaila　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代卢吉军团', civ: '波兰', age: 'antiquity', deStyle: 'SLAV', region: 'POLES' as RegionType,
        buildingStyle: 'POLES',
        castleId: 'POLE_CASTLE_AGE3', castleName: '波兰 马尔堡红砖条顿古堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_alaric',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_jogaila（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'maceman', count: 3 },
            { type: 'bowman', count: 4 },
            { type: 'antiquity_scout_cavalry', count: 2 },
        ],
    },
    // ── 波兰 · 封建时代 · 封建时代波兰尼军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵、步兵为主
    //    描述正文（主人原文，一字未改）：（格涅兹诺、波兹南；奥斯特鲁夫莱德尼茨基湖心要塞、粗糙石灰岩圆拱洗礼堂；波兰尼公爵重锁甲亲卫骑兵（Druzhina）、白木大盾铁骨朵、平原聚落戍卫大阵）
    //    英雄队（第 10 队·主将队）：hero_jadwiga / hero_jogaila　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代波兰尼军团', civ: '波兰', age: 'feudal', deStyle: 'SLAV', region: 'POLES' as RegionType,
        buildingStyle: 'POLES',
        castleId: 'POLE_CASTLE_AGE3', castleName: '波兰 马尔堡红砖条顿古堡',
        formationMode: 'echelon',
        shipId: 'GALLEY',
        commanderUnit: 'hero_youngjadwiga',
        slots: [
            { type: 'elite_skirmisher', count: 4 },
            { type: 'pikeman', count: 3 },
            { type: 'light_cavalry', count: 2 },
        ],
    },
    // ── 波兰 · 城堡时代 · 城堡时代波兰王国军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（克拉科夫；瓦维尔城堡石造主楼、圣母圣殿飞拱砖哥特大教堂；重型锻钢全身板甲、格伦瓦德大破条顿黑十字重装骑兵、瓦维尔红砖要塞防御大阵）
    //    英雄队（第 10 队·主将队）：hero_jadwiga / hero_jogaila　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代波兰王国军团', civ: '波兰', age: 'castle', deStyle: 'SLAV', region: 'POLES' as RegionType,
        buildingStyle: 'POLES',
        castleId: 'POLE_CASTLE_AGE3', castleName: '波兰 马尔堡红砖条顿古堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_jogaila',
        slots: [
            { type: 'elite_obuch', count: 3 },
            { type: 'crossbowman', count: 4 },
            { type: 'winged_hussar', count: 2 },
        ],
    },
    // ── 波兰 · 帝国时代 · 帝国时代波兰立陶宛军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（华沙、维尔纽斯；华沙皇家平原石筑城堡、早期萨尔马提亚木石庄园；背负双翼震慑雕羽、5.5米破阵中空超长骑枪（Kopia）、大马士革马刀（Szabla）平原无敌冲锋铁骑）
    //    英雄队（第 10 队·主将队）：hero_jadwiga / hero_jogaila　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代波兰立陶宛军团', civ: '波兰', age: 'imperial', deStyle: 'SLAV', region: 'POLES' as RegionType,
        buildingStyle: 'POLES',
        castleId: 'POLE_CASTLE_AGE3', castleName: '波兰 马尔堡红砖条顿古堡',
        formationMode: 'echelon',
        shipId: 'GALLEON',
        commanderUnit: 'hero_vytautasthegreat',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'obuch', count: 3 },
            { type: 'winged_hussar', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 波希米亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 波希米亚 · 古典时代 · 古典时代波伊军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（伏尔塔瓦河谷扎维斯特；波伊凯尔特大型山丘要塞堡垒Oppidum、土石木框结构围墙；高地粗铁锁甲、凯尔特重型斩剑、山丘环形防御石垒阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_janzizka / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代波伊军团', civ: '波希米亚', age: 'antiquity', deStyle: 'SLAV', region: 'BOHEMIANS' as RegionType,
        buildingStyle: 'BOHEMIANS',
        castleId: 'BOHE_CASTLE_AGE3', castleName: '波希米亚 卡尔施泰因城堡',
        formationMode: 'echelon',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_aethelfrith',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_janzizka（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'rhodian_slinger', count: 4 },
            { type: 'heavy_swordsman', count: 3 },
            { type: 'antiquity_scout_cavalry', count: 2 },
        ],
    },
    // ── 波希米亚 · 封建时代 · 封建时代波希米亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（布拉格高堡；布拉格城堡圣乔治大殿、早期罗曼式石造圆形小堂Rotunda；波希米亚白狮双尾战旗、公爵重锁甲亲卫骑兵、早期伏尔塔瓦河石木要塞群）
    //    英雄队（第 10 队·主将队）：hero_janzizka / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代波希米亚军团', civ: '波希米亚', age: 'feudal', deStyle: 'SLAV', region: 'BOHEMIANS' as RegionType,
        buildingStyle: 'BOHEMIANS',
        castleId: 'BOHE_CASTLE_AGE3', castleName: '波希米亚 卡尔施泰因城堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_ivaylofoot',
        slots: [
            { type: 'obuch', count: 3 },
            { type: 'archer', count: 4 },
            { type: 'light_cavalry', count: 2 },
        ],
    },
    // ── 波希米亚 · 城堡时代 · 城堡时代胡斯军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：战车、步兵为主
    //    描述正文（主人原文，一字未改）：（布拉格、塔博尔、库特纳霍拉；查理大桥石筑双桥塔、圣维特大教堂砂岩肋拱；装甲重型战车阵（Wagenburg）、双手破甲战连枷（Flail）、以步克骑大破神罗十字军铁壁阵）
    //    英雄队（第 10 队·主将队）：hero_janzizka / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代胡斯军团', civ: '波希米亚', age: 'castle', deStyle: 'SLAV', region: 'BOHEMIANS' as RegionType,
        buildingStyle: 'BOHEMIANS',
        castleId: 'BOHE_CASTLE_AGE3', castleName: '波希米亚 卡尔施泰因城堡',
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_janzizka',
        slots: [
            { type: 'elite_hussite_wagon', count: 2 },
            { type: 'pikeman', count: 3 },
            { type: 'arbalest', count: 4 },
        ],
    },
    // ── 波希米亚 · 帝国时代 · 帝国时代波希米亚雇佣军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（布拉格、切斯基克鲁姆洛夫；切斯基克鲁姆洛夫山顶石堡、早期库特纳霍拉造币要塞；文艺复兴黑化精钢半身板甲、超长破骑防卫长枪阵、大航海早期银矿城堡近卫铁壁）
    //    英雄队（第 10 队·主将队）：hero_janzizka / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代波希米亚雇佣军团', civ: '波希米亚', age: 'imperial', deStyle: 'SLAV', region: 'BOHEMIANS' as RegionType,
        buildingStyle: 'BOHEMIANS',
        castleId: 'BOHE_CASTLE_AGE3', castleName: '波希米亚 卡尔施泰因城堡',
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_janzizka',
        // 🔴 [2026-10-16 主人令·按分批时代] 波希米亚（城堡批）胡斯战车：精锐已在城堡军团 2 档；普通进帝国军团 2 档。
        slots: [
            { type: 'hussite_wagon', count: 2 },
            { type: 'champion', count: 3 },
            { type: 'heavy_crossbowman', count: 4 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 马扎尔　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 马扎尔 · 古典时代 · 古典时代潘诺尼亚巡境军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（阿昆库姆/布达佩斯；阿昆库姆露天剧场、多瑙河石砌界墙哨堡；罗马边境重装标枪步兵、重型卵形盾防御方阵、多瑙河浅滩巡逻水陆大阵）
    //    英雄队（第 10 队·主将队）：hero_attila / hero_cumanchief / hero_belaiv　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代潘诺尼亚巡境军团', civ: '马扎尔', age: 'antiquity', deStyle: 'SLAV', region: 'MAGYAR' as RegionType,
        buildingStyle: 'MAGYAR',
        castleId: 'MAGY_CASTLE_AGE3', castleName: '马扎尔 布达佩斯多瑙河石堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_belisarius',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_attila（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'antiquity_light_cavalry', count: 3 },
            { type: 'antiquity_cavalry_archer', count: 4 },
            { type: 'lancer', count: 2 },
        ],
    },
    // ── 马扎尔 · 封建时代 · 封建时代马扎尔军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑射为主
    //    描述正文（主人原文，一字未改）：（埃斯泰尔戈姆、塞克什白堡；埃斯泰尔戈姆早期皇家石堡罗曼式拱门、阿尔帕德帐幕营地；双曲复合角弓风暴、大马士革弯刀轻骑穿插、平定潘诺尼亚掠夺大阵）
    //    英雄队（第 10 队·主将队）：hero_attila / hero_cumanchief / hero_belaiv　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代马扎尔军团', civ: '马扎尔', age: 'feudal', deStyle: 'SLAV', region: 'MAGYAR' as RegionType,
        buildingStyle: 'MAGYAR',
        castleId: 'MAGY_CASTLE_AGE3', castleName: '马扎尔 布达佩斯多瑙河石堡',
        formationMode: 'crescent',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_attila',
        slots: [
            { type: 'raider', count: 3 },
            { type: 'cav_archer', count: 2 },
            { type: 'recurve_bowman', count: 4 },
        ],
    },
    // ── 马扎尔 · 城堡时代 · 城堡时代匈牙利王国军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、战车为主
    //    描述正文（主人原文，一字未改）：（维谢格拉德、布达；维谢格拉德多瑙河所罗门八角石塔、布达王宫早期哥特大厅；马加什国王黑化精钢全身板甲、重装长枪铁壁方阵、胡斯战车协同防御大阵）
    //    英雄队（第 10 队·主将队）：hero_attila / hero_cumanchief / hero_belaiv　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代匈牙利王国军团', civ: '马扎尔', age: 'castle', deStyle: 'SLAV', region: 'MAGYAR' as RegionType,
        buildingStyle: 'MAGYAR',
        castleId: 'MAGY_CASTLE_AGE3', castleName: '马扎尔 布达佩斯多瑙河石堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_jadwiga',
        slots: [
            { type: 'elite_magyar_huszar', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
            { type: 'hussar', count: 2 },
        ],
    },
    // ── 马扎尔 · 帝国时代 · 帝国时代骠骑先锋军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：轻骑兵为主
    //    描述正文（主人原文，一字未改）：（塞克什白堡、莫哈奇；早期多瑙河水郭棱堡要塞、马加什教堂尖顶防御钟楼；非对称匈牙利翼形木盾、兽皮战袍轻装冲锋长骑枪、早期抗击奥斯曼平原骠骑大阵）
    //    英雄队（第 10 队·主将队）：hero_attila / hero_cumanchief / hero_belaiv　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代骠骑先锋军团', civ: '马扎尔', age: 'imperial', deStyle: 'SLAV', region: 'MAGYAR' as RegionType,
        buildingStyle: 'MAGYAR',
        castleId: 'MAGY_CASTLE_AGE3', castleName: '马扎尔 布达佩斯多瑙河石堡',
        formationMode: 'echelon',
        shipId: 'FAST_FIRE_SHIP',
        commanderUnit: 'hero_miklostoldi',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'magyar_huszar', count: 3 },
            { type: 'hussar', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 罗斯　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 罗斯 · 古典时代 · 古典时代安特军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（投矛）为主
    //    描述正文（主人原文，一字未改）：（第聂伯河中游森林沼泽；半穴居半木结构泥坑聚落、原木尖桩防御村寨；多柄倒钩破甲投矛（Sulitsy）、坚韧橡木长盾、林沼浅滩潜伏突袭大阵）
    //    英雄队（第 10 队·主将队）：hero_vladdracula / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代安特军团', civ: '斯拉夫', age: 'antiquity', deStyle: 'SLAV', region: 'SLAVIC' as RegionType,
        buildingStyle: 'SLAVIC',
        castleId: 'SLAV_CASTLE_AGE3', castleName: '东欧/斯拉夫 莫斯科白石克里姆林',
        formationMode: 'echelon',
        shipId: 'MONOREME',
        commanderUnit: 'hero_tsarkonstantin',
        slots: [
            { type: 'elite_skirmisher', count: 4 },
            { type: 'manatarms', count: 3 },
            { type: 'spearman', count: 2 },
        ],
    },
    // ── 罗斯 · 封建时代 · 封建时代基辅罗斯军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、重骑兵为主
    //    描述正文（主人原文，一字未改）：（基辅；基辅圣索菲亚大教堂十三金顶、金门石木防御要塞；尖顶面具锁子甲头盔、大公亲卫双手宽刃剑、基辅城郭抗击游牧骑兵铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_vladdracula / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代基辅罗斯军团', civ: '斯拉夫', age: 'feudal', deStyle: 'SLAV', region: 'SLAVIC' as RegionType,
        buildingStyle: 'SLAVIC',
        castleId: 'SLAV_CASTLE_AGE3', castleName: '东欧/斯拉夫 莫斯科白石克里姆林',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_ivaylofoot',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'laminated_bowman', count: 4 },
            { type: 'light_cavalry', count: 2 },
        ],
    },
    // ── 罗斯 · 城堡时代 · 城堡时代博亚尔重骑军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（莫斯科、弗拉基米尔；弗拉基米尔圣母安息白石浮雕大教堂、早期莫斯科克里姆林红砖城堡城垣；东方叠压铁板鳞甲（Behterets）、库里科沃破阵长矛骑兵、白石要塞防御铁骑）
    //    英雄队（第 10 队·主将队）：hero_vladdracula / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代博亚尔重骑军团', civ: '斯拉夫', age: 'castle', deStyle: 'SLAV', region: 'SLAVIC' as RegionType,
        buildingStyle: 'SLAVIC',
        castleId: 'SLAV_CASTLE_AGE3', castleName: '东欧/斯拉夫 莫斯科白石克里姆林',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_vladdracula',
        slots: [
            { type: 'varangian_guard', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'elite_boyar', count: 2 },
        ],
    },
    // ── 罗斯 · 帝国时代 · 帝国时代俄罗斯军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（莫斯科；瓦西里升天大教堂多色洋葱头穹顶、克里姆林宫伊凡大帝石造八角钟楼；重型长柄月牙破甲战斧（Bardiche）、深红羊毛铁甲卫兵、大航海早期沙皇克里姆林铁壁禁卫大阵）
    //    英雄队（第 10 队·主将队）：hero_vladdracula / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代俄罗斯军团', civ: '斯拉夫', age: 'imperial', deStyle: 'SLAV', region: 'SLAVIC' as RegionType,
        buildingStyle: 'SLAVIC',
        castleId: 'SLAV_CASTLE_AGE3', castleName: '东欧/斯拉夫 莫斯科白石克里姆林',
        formationMode: 'fish_scale',
        shipId: 'HEAVY_DEMO_SHIP',
        commanderUnit: 'hero_vladdracula',
        slots: [
            { type: 'elite_varangian_guard', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'boyar', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 立陶宛　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 立陶宛 · 古典时代 · 古典时代埃斯蒂军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（涅曼河下游、波罗的海沿岸；原始神圣林地石圈、泥沼原木祭坛；粗重硬木狼牙棒、骨角穿甲标枪、波罗的海琥珀古道原始圣林伏击战阵）
    //    英雄队（第 10 队·主将队）：hero_algirdas / hero_jogaila / hero_kestutis / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代埃斯蒂军团', civ: '立陶宛', age: 'antiquity', deStyle: 'SLAV', region: 'LITHUANIANS' as RegionType,
        buildingStyle: 'LITHUANIANS',
        castleId: 'LITH_CASTLE_AGE3', castleName: '立陶宛 特拉凯湖心红砖城堡',
        formationMode: 'echelon',
        shipId: 'MONOREME',
        commanderUnit: 'hero_youngjadwiga',
        slots: [
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'maceman', count: 3 },
            { type: 'antiquity_scout_cavalry', count: 2 },
        ],
    },
    // ── 立陶宛 · 封建时代 · 封建时代立陶宛部族军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（克尔纳韦；克尔纳韦五大防卫土丘山堡要塞、陡峭多重土壕栅栏；双手破甲粗铁战斧、波罗的生铁圆盾刺矛、高台土木壁障阻击维京长船大阵）
    //    英雄队（第 10 队·主将队）：hero_algirdas / hero_jogaila / hero_kestutis / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代立陶宛部族军团', civ: '立陶宛', age: 'feudal', deStyle: 'SLAV', region: 'LITHUANIANS' as RegionType,
        buildingStyle: 'LITHUANIANS',
        castleId: 'LITH_CASTLE_AGE3', castleName: '立陶宛 特拉凯湖心红砖城堡',
        formationMode: 'echelon',
        shipId: 'GALLEY',
        commanderUnit: 'hero_youngjadwiga',
        slots: [
            { type: 'elite_skirmisher', count: 4 },
            { type: 'pikeman', count: 3 },
            { type: 'light_cavalry', count: 2 },
        ],
    },
    // ── 立陶宛 · 城堡时代 · 城堡时代立陶宛大公国军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（特拉凯、维尔纽斯；特拉凯水上红砖城堡、盖迪米纳斯红砖石砌塔楼；格伦瓦德破阵骑射标枪骑兵、东欧紧密锁甲鳞甲、抵御条顿十字军水上要塞铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_algirdas / hero_jogaila / hero_kestutis / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代立陶宛大公国军团', civ: '立陶宛', age: 'castle', deStyle: 'SLAV', region: 'LITHUANIANS' as RegionType,
        buildingStyle: 'LITHUANIANS',
        castleId: 'LITH_CASTLE_AGE3', castleName: '立陶宛 特拉凯湖心红砖城堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_algirdas',
        slots: [
            { type: 'elite_leitis', count: 3 },
            { type: 'pagan_priest', count: 4 },   // 🔴 [2026-10-19 主人令「把这 5 个法术兵按历史编进对应文明的军团」] 原 crossbowman；按史：立陶宛至 1387 年仍奉多神教
            { type: 'winged_hussar', count: 2 },
        ],
    },
    // ── 立陶宛 · 帝国时代 · 帝国时代立陶宛军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：轻骑兵为主
    //    描述正文（主人原文，一字未改）：（维尔纽斯；维尔纽斯圣安妮教堂火焰哥特式外墙、早生期维尔纽斯大学砖石殿堂；超长破甲铁矛轻骑兵（Petyhorcy）、大马士革马刀、大航海早期奥尔沙破阵平原卫队）
    //    英雄队（第 10 队·主将队）：hero_algirdas / hero_jogaila / hero_kestutis / hero_vytautasthegreat　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代立陶宛军团', civ: '立陶宛', age: 'imperial', deStyle: 'SLAV', region: 'LITHUANIANS' as RegionType,
        buildingStyle: 'LITHUANIANS',
        castleId: 'LITH_CASTLE_AGE3', castleName: '立陶宛 特拉凯湖心红砖城堡',
        formationMode: 'echelon',
        shipId: 'CANNON_GALLEON',
        commanderUnit: 'hero_kestutis',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'leitis', count: 3 },
            { type: 'winged_hussar', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 保加利亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第三批·东南欧＋东北欧）
    // ═══════════════════════════════════════════════════════════════════
    // ── 保加利亚 · 古典时代 · 古典时代巴尔干军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（普罗夫迪夫、赛尔迪卡/索非亚；普罗夫迪夫罗马大剧场、大理石列柱广场与石槽排水渠；恐怖双手双刃逆刃长刀（Rhomphaia）、月牙形轻木小盾（Pelte）、多瑙河南岸山地伏击撕裂方阵）
    //    英雄队（第 10 队·主将队）：hero_ivaylo / hero_ivaylofoot / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代巴尔干军团', civ: '保加利亚', age: 'antiquity', deStyle: 'SLAV', region: 'BULGARIANS' as RegionType,
        buildingStyle: 'BULGARIANS',
        castleId: 'BULG_CASTLE_AGE3', castleName: '保加利亚 普雷斯拉夫圆顶城堡',
        formationMode: 'echelon',
        shipId: 'BIREME',
        commanderUnit: 'hero_thracian_chieftain',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_ivaylofoot（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'elite_peltast', count: 4 },
            { type: 'elite_rhomphaia_warrior', count: 3 },
            { type: 'thracian_peltast', count: 2 },
        ],
    },
    // ── 保加利亚 · 封建时代 · 封建时代保加利亚军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（普利斯卡、普利斯拉夫；普利斯卡大罗曼式石砖巴西利卡、圆顶黄金教堂遗址、双层巨石坚固城墙；波亚尔（Bolyar）贵族人马具装重锁甲骑兵、双曲复合角弓风暴、普利斯卡山谷大破拜占庭铁血战阵）
    //    英雄队（第 10 队·主将队）：hero_ivaylo / hero_ivaylofoot / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代保加利亚军团', civ: '保加利亚', age: 'feudal', deStyle: 'SLAV', region: 'BULGARIANS' as RegionType,
        buildingStyle: 'BULGARIANS',
        castleId: 'BULG_CASTLE_AGE3', castleName: '保加利亚 普雷斯拉夫圆顶城堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_ivaylofoot',
        slots: [
            { type: 'elite_konnik_foot', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'elite_konnik', count: 2 },
        ],
    },
    // ── 保加利亚 · 城堡时代 · 城堡时代查雷威茨禁卫军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、重骑兵为主
    //    描述正文（主人原文，一字未改）：（大特尔诺沃；沙皇城要塞Tsarevets山峰条石城垣、特尔诺沃博雅纳红砖盲拱修道院；重型破甲战斧、重装城垣铁卫、阿德里安堡全歼第四次十字军铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_ivaylo / hero_ivaylofoot / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代查雷威茨禁卫军团', civ: '保加利亚', age: 'castle', deStyle: 'SLAV', region: 'BULGARIANS' as RegionType,
        buildingStyle: 'BULGARIANS',
        castleId: 'BULG_CASTLE_AGE3', castleName: '保加利亚 普雷斯拉夫圆顶城堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_ivaylo',
        slots: [
            { type: 'konnik_foot', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'konnik', count: 2 },
        ],
    },
    // ── 保加利亚 · 帝国时代 · 帝国时代保加利亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻步兵为主
    //    描述正文（主人原文，一字未改）：（里拉山脉、巴尔干山谷；里拉修道院早期石造要塞钟楼、隐秘黑白斑驳拱廊藏身所；巴尔干双手重砍刀、高山隘口冷锻倒钩短矛伏击、大航海早期深山孤守信仰海杜克游侠铁卫）
    //    英雄队（第 10 队·主将队）：hero_ivaylo / hero_ivaylofoot / hero_tsarkonstantin　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代保加利亚军团', civ: '保加利亚', age: 'imperial', deStyle: 'SLAV', region: 'BULGARIANS' as RegionType,
        buildingStyle: 'BULGARIANS',
        castleId: 'BULG_CASTLE_AGE3', castleName: '保加利亚 普雷斯拉夫圆顶城堡',
        formationMode: 'echelon',
        shipId: 'GALLEON',
        commanderUnit: 'hero_ivaylo',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'champion', count: 3 },
            { type: 'hussar', count: 2 },
        ],
    },


    // ═══════════════════════════════════════════════════════════════════
    // 伦巴第　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 伦巴第 · 古典时代 · 古典时代伊特鲁里亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（美狄奥兰农/米兰、布雷西亚；布雷西亚卡比托利欧古罗马神庙、米兰圣洛伦佐巨石柱廊；冷锻双手劈砍长剑、坚木卵形大盾、波河平原原始凯尔特狂暴突击大阵）
    //    英雄队（第 10 队·主将队）：hero_sforza / hero_bohemond　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代伊特鲁里亚军团', civ: '意大利', age: 'antiquity', deStyle: 'MEDI', region: 'ITALIANS' as RegionType,
        buildingStyle: 'LATIN',
        castleId: 'MEDI_CASTLE_AGE3', castleName: '地中海/意大利 威尼斯总督红顶宫',
        formationMode: 'fish_scale',
        shipId: 'MONOREME',
        commanderUnit: 'hero_alaric',
        slots: [
            { type: 'heavy_swordsman', count: 3 },
            { type: 'archer', count: 4 },
            { type: 'scout_cavalry', count: 2 },
        ],
    },
    // ── 伦巴第 · 封建时代 · 封建时代伦巴第军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（帕维亚、蒙扎；帕维亚圣米歇尔大殿、蒙扎大教堂铁王冠圣所；阿利曼尼（Arimanni）重锁甲冲锋枪骑兵、伦巴第粗柱罗曼式盲拱堡垒、加冕铁王冠王家护卫大阵）
    //    英雄队（第 10 队·主将队）：hero_sforza / hero_bohemond　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代伦巴第军团', civ: '意大利', age: 'feudal', deStyle: 'MEDI', region: 'ITALIANS' as RegionType,
        buildingStyle: 'LATIN',
        castleId: 'MEDI_CASTLE_AGE3', castleName: '地中海/意大利 威尼斯总督红顶宫',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_bohemond',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'crossbowman', count: 4 },
            { type: 'knight', count: 2 },
        ],
    },
    // ── 伦巴第 · 城堡时代 · 城堡时代意大利城邦军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：战车、长矛步兵为主
    //    描述正文（主人原文，一字未改）：（米兰、曼托瓦；斯福尔扎城堡早期红砖石基、公社执政官官邸Palazzo della Ragione；神圣卡罗乔巨轮战车（Carroccio）、密集长矛刺猬拒马民团、莱尼亚诺大破神罗重骑公社战阵）
    //    英雄队（第 10 队·主将队）：hero_sforza / hero_bohemond　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代意大利城邦军团', civ: '意大利', age: 'castle', deStyle: 'MEDI', region: 'ITALIANS' as RegionType,
        buildingStyle: 'LATIN',
        castleId: 'MEDI_CASTLE_AGE3', castleName: '地中海/意大利 威尼斯总督红顶宫',
        formationMode: 'fish_scale',
        shipId: 'CARRACK',
        commanderUnit: 'hero_sforza',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
            { type: 'cavalier', count: 2 },
        ],
    },
    // ── 伦巴第 · 帝国时代 · 帝国时代意大利雇佣军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、重骑兵为主
    //    描述正文（主人原文，一字未改）：（米兰、帕维亚；米兰斯福尔扎红砖角塔要塞、帕维亚切尔托萨修道院雕花大理石立面；全套顶级镜面防弹全身板甲（Milanese Plate）、精钢重装长戟卫队、大航海早期文艺复兴要塞佣兵队长（Condottieri）铁壁近卫）
    //    英雄队（第 10 队·主将队）：hero_sforza / hero_bohemond　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代意大利雇佣军团', civ: '意大利', age: 'imperial', deStyle: 'MEDI', region: 'ITALIANS' as RegionType,
        buildingStyle: 'LATIN',
        castleId: 'MEDI_CASTLE_AGE3', castleName: '地中海/意大利 威尼斯总督红顶宫',
        formationMode: 'fish_scale',
        shipId: 'ELITE_CANNON_GALLEON',
        commanderUnit: 'hero_sforza',
        slots: [
            { type: 'condottiero', count: 3 },
            { type: 'genoese_crossbowman', count: 4 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 罗马　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 罗马 · 古典时代 · 古典时代罗马军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（罗马城；罗马斗兽场、万神殿混凝土大穹顶、图拉真广场记功柱；板条铁甲（Lorica Segmentata）、罗马方形大半身盾（Scutum）、重标枪（Pilum）破坏敌盾后西班牙短剑贴身刺杀、龟甲步兵推进大阵）
    //    英雄队（第 10 队·主将队）：hero_aristides / hero_parmenion / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 罗马 · 封建时代 · 封建时代教皇国军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（罗马城；旧圣伯多禄大殿巴西利卡式木构屋架、拉特朗圣若望大殿；锁子甲长矛步兵、早期利奥城墙石基要塞防御、抵御撒拉逊海盗劫掠守备大阵）
    //    英雄队（第 10 队·主将队）：hero_aristides / hero_parmenion / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代教皇国军团', civ: '罗马', age: 'feudal', deStyle: 'MEDI', region: 'ROMA' as RegionType,
        buildingStyle: 'ROMA',
        castleId: 'ROMA_CASTLE_AGE3', castleName: '罗马 帝国古典方石要塞',
        formationMode: 'fish_scale',
        shipId: 'BOARDING_GALLEY',
        commanderUnit: 'envoy',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：罗马百夫长（普通档）替步弓手。
        slots: [
            { type: 'legionary', count: 3 },
            { type: 'crossbowman', count: 4 },
            { type: 'centurion', count: 2 },
        ],
    },
    // ── 罗马 · 城堡时代 · 城堡时代教廷军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵、远程（重弩）为主
    //    描述正文（主人原文，一字未改）：（罗马城；圣天使城堡巨石圆筒炮台要塞、科斯马蒂拼花修道院回廊；重装锁甲骑枪骑士、博尔戈高架密道连通石堡要塞、守城石弩与重弩方阵）
    //    英雄队（第 10 队·主将队）：hero_aristides / hero_parmenion / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代教廷军团', civ: '罗马', age: 'castle', deStyle: 'MEDI', region: 'ROMA' as RegionType,
        buildingStyle: 'ROMA',
        castleId: 'ROMA_CASTLE_AGE3', castleName: '罗马 帝国古典方石要塞',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_richardthelionheart',
        slots: [
            { type: 'crusader_knight', count: 3 },
            { type: 'monk', count: 4 },
            { type: 'master_of_the_templar', count: 2 },
        ],
    },
    // ── 罗马 · 帝国时代 · 帝国时代教廷近卫军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（梵蒂冈/罗马；圣伯多禄大教堂米开朗基罗早期穹顶工地、西斯廷礼拜堂要塞建筑群；文艺复兴条纹精钢半身胸甲、精钢双手长戟（Halberd）与重剑、罗马之劫决死掩护台阶血战铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_aristides / hero_parmenion / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代教廷近卫军团', civ: '罗马', age: 'imperial', deStyle: 'MEDI', region: 'ROMA' as RegionType,
        buildingStyle: 'ROMA',
        castleId: 'ROMA_CASTLE_AGE3', castleName: '罗马 帝国古典方石要塞',
        formationMode: 'echelon',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_popeleoi',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'heavy_pikeman', count: 3 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 西西里　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 西西里 · 古典时代 · 古典时代叙拉古军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、远程（弩机）为主
    //    描述正文（主人原文，一字未改）：（叙拉古、阿格里真托；神殿之谷协和多立克柱廊神庙、古希腊采石场与大剧院；青铜阿尔戈斯圆盾、重型长矛刺猬密集方阵、阿基米德投石弩机海陆防卫大阵）
    //    英雄队（第 10 队·主将队）：hero_robertguiscard / hero_bohemond / hero_rogerbosso　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代叙拉古军团', civ: '西西里', age: 'antiquity', deStyle: 'MEDI', region: 'SICILIANS' as RegionType,
        buildingStyle: 'SICILIANS',
        castleId: 'SICI_CASTLE_AGE3', castleName: '西西里 诺曼巴勒莫王宫堡',
        formationMode: 'crescent',
        shipId: 'HERO_DIONYSUS',
        commanderUnit: 'hero_cleon',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_rogerbosso（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'hoplite', count: 3 },
            { type: 'tarantine_cavalry', count: 2 },
            { type: 'gastraphetes', count: 4 },
        ],
    },
    // ── 西西里 · 封建时代 · 封建时代西西里埃米尔军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（巴勒莫、卡塔尼亚；齐萨早期水榭庭院、红色抹灰小穹顶回教聚落清真寺；阿拉伯大马士革弯刀、轻骑突袭复合角弓、西西里丘陵高机动游骑穿插包抄大阵）
    //    英雄队（第 10 队·主将队）：hero_robertguiscard / hero_bohemond / hero_rogerbosso　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代西西里埃米尔军团', civ: '西西里', age: 'feudal', deStyle: 'MEDI', region: 'SICILIANS' as RegionType,
        buildingStyle: 'SICILIANS',
        castleId: 'SICI_CASTLE_AGE3', castleName: '西西里 诺曼巴勒莫王宫堡',
        formationMode: 'fish_scale',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_robertguiscard',
        slots: [
            { type: 'light_cavalry', count: 3 },
            { type: 'cav_archer', count: 4 },
            { type: 'knight', count: 2 },
        ],
    },
    // ── 西西里 · 城堡时代 · 城堡时代诺曼军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（巴勒莫、蒙雷阿莱；巴勒莫帕拉提那礼拜堂、蒙雷阿莱大教堂马赛克巨石城壁；诺曼泪滴形大盾、双手破甲长枪与锁子甲铁骑、融汇拜占庭阿拉伯筑城技术的地中海十字军东征大阵）
    //    英雄队（第 10 队·主将队）：hero_robertguiscard / hero_bohemond / hero_rogerbosso　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代诺曼军团', civ: '西西里', age: 'castle', deStyle: 'MEDI', region: 'SICILIANS' as RegionType,
        buildingStyle: 'SICILIANS',
        castleId: 'SICI_CASTLE_AGE3', castleName: '西西里 诺曼巴勒莫王宫堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_rogerbosso',
        slots: [
            { type: 'elite_serjeant', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
            { type: 'cavalier', count: 2 },
        ],
    },
    // ── 西西里 · 帝国时代 · 帝国时代西西里军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（那不勒斯、墨西拿；墨西拿海峡石砌瞭望塔链、早期卡斯特尔诺沃凯旋门石堡要塞；西班牙大方阵超长枪兵（Tercio雏形）、重装护胸铁甲大圆盾短剑士、大航海早期巡防地中海抗击巴巴里海盗铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_robertguiscard / hero_bohemond / hero_rogerbosso　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代西西里军团', civ: '西西里', age: 'imperial', deStyle: 'MEDI', region: 'SICILIANS' as RegionType,
        buildingStyle: 'SICILIANS',
        castleId: 'SICI_CASTLE_AGE3', castleName: '西西里 诺曼巴勒莫王宫堡',
        formationMode: 'echelon',
        shipId: 'GALLEON',
        commanderUnit: 'hero_robertguiscard',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'serjeant', count: 3 },
            { type: 'paladin', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 安达卢斯　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 安达卢斯 · 古典时代 · 古典时代凯尔特伊比利亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（梅里达、科尔多瓦；梅里达罗马大剧场双列柱舞台、塞哥维亚高架引水桥；双刃反曲折铁阔剑（Falcata）、轻木覆皮小圆盾（Caetra）、山地奔袭穿透方阵）
    //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_sforza　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代凯尔特伊比利亚军团', civ: '西班牙', age: 'antiquity', deStyle: 'MEDI', region: 'SPANISH' as RegionType,
        buildingStyle: 'SPANISH',
        castleId: 'SPAN_CASTLE_AGE3', castleName: '西班牙 塞戈维亚阿尔卡萨堡',
        formationMode: 'fish_scale',
        shipId: 'BIREME',
        commanderUnit: 'hero_aethelfrith',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_bernardarmagnac（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'manatarms', count: 3 },
            { type: 'archer', count: 4 },
            { type: 'scout_cavalry', count: 2 },
        ],
    },
    // ── 安达卢斯 · 封建时代 · 封建时代摩尔游骑军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（科尔多瓦、梅迪纳；科尔多瓦大清真寺红白双层马蹄拱林、梅迪纳·阿扎哈拉石雕宫殿基址；阿拉伯大马士革弯刀、轻装高速突袭骑射手、北非快马穿插包抄轻骑大阵）
    //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_sforza　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代摩尔游骑军团', civ: '西班牙', age: 'feudal', deStyle: 'MEDI', region: 'SPANISH' as RegionType,
        buildingStyle: 'SPANISH',
        castleId: 'SPAN_CASTLE_AGE3', castleName: '西班牙 塞戈维亚阿尔卡萨堡',
        formationMode: 'crescent',
        shipId: 'GALLEY',
        commanderUnit: 'hero_tariqibnziyad',
        slots: [
            { type: 'light_cavalry', count: 3 },
            { type: 'genitour', count: 2 },
            { type: 'cav_archer', count: 4 },
        ],
    },
    // ── 安达卢斯 · 城堡时代 · 城堡时代卡斯蒂利亚军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（塞维利亚、格拉纳达；塞维利亚吉拉尔达砖塔、阿尔罕布拉宫狮子中庭与阿尔卡萨瓦石堡要塞；重装锁甲骑枪骑士、红白十字战袍、收复失地运动（Reconquista）攻坚破城重铠大阵）
    //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_sforza　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代卡斯蒂利亚军团', civ: '西班牙', age: 'castle', deStyle: 'MEDI', region: 'SPANISH' as RegionType,
        buildingStyle: 'SPANISH',
        castleId: 'SPAN_CASTLE_AGE3', castleName: '西班牙 塞戈维亚阿尔卡萨堡',
        formationMode: 'crescent',
        shipId: 'CARRACK',
        commanderUnit: 'hero_elcidcampeador',
        slots: [
            { type: 'crusader_knight', count: 3 },
            { type: 'elite_genitour', count: 2 },
            { type: 'mounted_crossbowman_heavy', count: 4 },
        ],
    },
    // ── 安达卢斯 · 帝国时代 · 帝国时代西班牙方阵军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（托莱多、塞维利亚；托莱多石砌城堡要塞阿尔卡萨尔、塞维利亚早期哥特式大教堂钟塔；托莱多精钢阔剑、超长防骑长枪与精铁圆盾士、大航海早期卡斯蒂利亚大方阵（Tercio）冷兵器巅峰铁壁）
    //    英雄队（第 10 队·主将队）：hero_bernardarmagnac / hero_sforza　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代西班牙方阵军团', civ: '西班牙', age: 'imperial', deStyle: 'MEDI', region: 'SPANISH' as RegionType,
        buildingStyle: 'SPANISH',
        castleId: 'SPAN_CASTLE_AGE3', castleName: '西班牙 塞戈维亚阿尔卡萨堡',
        formationMode: 'crescent',
        shipId: 'ELITE_CANNON_GALLEON',
        commanderUnit: 'hero_kingalfonso',
        // 🔴 [2026-10-16 主人令·撤回] 「帝国无下一时代→落同军团 3 档」自造规则无效。
        //    4 档＝西班牙征服者精锐（主人令「4 档放城堡精锐」）；3 档恢复冠军剑士。
        //    征服者基础档改放新建三级军团「帝国时代西班牙征服军团」3 档。
        slots: [
            { type: 'heavy_pikeman', count: 3 },
            { type: 'elite_conquistador', count: 2 },
            { type: 'heavy_crossbowman', count: 4 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 卢西塔尼亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 卢西塔尼亚 · 古典时代 · 古典时代卢西塔尼亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻步兵为主
    //    描述正文（主人原文，一字未改）：（埃武拉、维塞乌；埃武拉狄安娜罗马神庙哥林斯石柱立面、杜罗河沿岸石垒要塞；维里阿修斯双刃阔短剑、粗鞣牛皮轻小圆盾（Caetra）、高山密林伏击罗马军团散兵大阵）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代卢西塔尼亚军团', civ: '葡萄牙', age: 'antiquity', deStyle: 'MEDI', region: 'PORTUGUESE' as RegionType,
        buildingStyle: 'PORTUGUESE',
        castleId: 'PORT_CASTLE_AGE3', castleName: '葡萄牙 贝伦塔大西洋海堡',
        formationMode: 'fish_scale',
        shipId: 'BIREME',
        commanderUnit: 'hero_aethelfrith',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_edwardlongshanks（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'manatarms', count: 3 },
            { type: 'archer', count: 4 },
            { type: 'scout_cavalry', count: 2 },
        ],
    },
    // ── 卢西塔尼亚 · 封建时代 · 封建时代苏维汇铁骑军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（布拉加、波尔图；布拉加圣弗鲁图奥索前罗曼式希腊十字石殿、早期杜罗河口石木营垒；日耳曼蛮族重装锁甲骑兵、倒钩双手猎矛、大西洋沿岸山地阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代苏维汇铁骑军团', civ: '葡萄牙', age: 'feudal', deStyle: 'MEDI', region: 'PORTUGUESE' as RegionType,
        buildingStyle: 'PORTUGUESE',
        castleId: 'PORT_CASTLE_AGE3', castleName: '葡萄牙 贝伦塔大西洋海堡',
        formationMode: 'echelon',
        shipId: 'GALLEY',
        commanderUnit: 'hero_gilbertdeclare',
        slots: [
            { type: 'throwing_axeman', count: 4 },
            { type: 'swordsman', count: 3 },
            { type: 'light_cavalry', count: 2 },
        ],
    },
    // ── 卢西塔尼亚 · 城堡时代 · 城堡时代葡萄牙王国军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（托马尔、巴塔利亚；托马尔基督会院圆形圣殿与八角石堡、巴塔利亚修道院早期哥特石堂；红十字白袍板甲骑士、重装破甲双手阔剑、收复失地运动与大西洋早期探险骑士大阵）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代葡萄牙王国军团', civ: '葡萄牙', age: 'castle', deStyle: 'MEDI', region: 'PORTUGUESE' as RegionType,
        buildingStyle: 'PORTUGUESE',
        castleId: 'PORT_CASTLE_AGE3', castleName: '葡萄牙 贝伦塔大西洋海堡',
        formationMode: 'fish_scale',
        shipId: 'HERO_VASCODAGAMA',
        commanderUnit: 'hero_elcidcampeador',
        // 🔴 [2026-10-16 主人令·撤回] 「相邻时代军团 2 档」是我自造规则，无效 → 2 档恢复欧洲游侠高级。
        //    风琴炮基础档改放新建三级军团「帝国时代葡萄牙风琴军团」3 档。
        slots: [
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'mounted_crossbowman_heavy', count: 4 },
            { type: 'cavalier', count: 2 },
        ],
    },
    // ── 卢西塔尼亚 · 帝国时代 · 帝国时代葡萄牙军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：重步兵、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（里斯本、萨格里什；里斯本贝伦塔四方石砌海防堡垒、热罗尼莫斯修道院曼努埃尔式航海石雕圣殿；精钢甲胸板与莫里恩高顶盔、超长钩戟与重装腰刀、大航海早期风琴排枪车与海外棱堡要塞铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_edwardlongshanks / hero_gilbertdeclare　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。

    // ═══════════════════════════════════════════════════════════════════
    // 阿拉伯　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 阿拉伯 · 古典时代 · 古典时代黎凡特军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵（骆驼骑兵）、远程为主
    //    描述正文（主人原文，一字未改）：（佩特拉、亚历山大里亚、帕尔米拉；佩特拉卡兹尼砂岩凿岩神殿立面、帕尔米拉十里列柱大道、亚历山大里亚巨石灯塔水郭；青铜重装大圆盾、双曲复合角弓波状射击、近东长矛阵与沙漠重装骆驼铁骑冲锋大阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_shahismail / hero_shahking / hero_imam　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代黎凡特军团', civ: '萨拉森', age: 'antiquity', deStyle: 'ORIE', region: 'ORIE' as RegionType,
        buildingStyle: 'ORIE',
        castleId: 'ORIE_CASTLE_AGE3', castleName: '中东/萨拉森 开罗萨拉丁大城堡',
        formationMode: 'crane_wing',
        shipId: 'BIREME',
        commanderUnit: 'hero_tsarkonstantin',
        slots: [
            { type: 'elite_war_chariot', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'mercenary_hoplite', count: 3 },
        ],
    },
    // ── 阿拉伯 · 封建时代 · 封建时代萨拉森军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：轻骑兵为主
    //    描述正文（主人原文，一字未改）：（巴格达圆城、萨马拉；萨马拉大清真寺螺旋宣礼塔、巴格达运河辐射泥砖石木城垣；大马士革冷锻弧形弯刀（Saif）、轻装突厥式锁子甲骑兵、黑旗哈里发沙漠绿洲狂飚突击阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_shahismail / hero_shahking / hero_imam　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代萨拉森军团', civ: '萨拉森', age: 'feudal', deStyle: 'ORIE', region: 'ORIE' as RegionType,
        buildingStyle: 'ORIE',
        castleId: 'ORIE_CASTLE_AGE3', castleName: '中东/萨拉森 开罗萨拉丁大城堡',
        formationMode: 'fish_scale',
        shipId: 'MERCHANT_SHIP',
        commanderUnit: 'hero_musaibnnusayr',
        slots: [
            { type: 'camel_raider', count: 3 },
            { type: 'eastern_swordsman', count: 4 },
            { type: 'camel_heavy', count: 2 },
        ],
    },
    // ── 阿拉伯 · 城堡时代 · 城堡时代马穆鲁克军团　（三级升二级）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（开罗、大马士革；开罗萨拉丁城堡巨石要塞、苏丹哈桑清真寺高大石砌山门；全套人马具装重锁甲、精钢破甲重骑枪与骑射连发、阿音札鲁特大破蒙古铁骑铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_shahismail / hero_shahking / hero_imam　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代马穆鲁克军团', civ: '萨拉森', age: 'castle', deStyle: 'ORIE', region: 'ORIE' as RegionType,
        buildingStyle: 'ORIE',
        castleId: 'ORIE_CASTLE_AGE3', castleName: '中东/萨拉森 开罗萨拉丁大城堡',
        formationMode: 'fish_scale',
        shipId: 'FIRE_SHIP',
        commanderUnit: 'hero_saladin',
        slots: [
            { type: 'elite_mameluke', count: 3 },
            { type: 'archer_of_the_eyes', count: 4 },
            { type: 'camel_rider', count: 2 },
        ],
    },
    // ── 阿拉伯 · 帝国时代 · 帝国时代阿拉伯军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（麦加、开罗、大马士革；开罗城堡苏莱曼帕夏早期铅顶石砌清真寺、麦加禁寺早期石筑环廊要塞；大马士革精钢长柄弯刀、复合角弓与轻型护胸板、大航海早期扼守红海香料商道沙漠突骑大阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_shahismail / hero_shahking / hero_imam　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代阿拉伯军团', civ: '萨拉森', age: 'imperial', deStyle: 'ORIE', region: 'ORIE' as RegionType,
        buildingStyle: 'ORIE',
        castleId: 'ORIE_CASTLE_AGE3', castleName: '中东/萨拉森 开罗萨拉丁大城堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEON',
        commanderUnit: 'hero_imam',
        slots: [
            { type: 'mameluke', count: 3 },
            { type: 'eastern_swordsman', count: 4 },
            { type: 'camel_raider', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 匈人　四时代二级军团（古典）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 匈人 · 古典时代 · 古典时代匈人军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：骑射、战车（大车阵）为主
    //    描述正文（主人原文，一字未改）：（匈牙利平原、蒂萨河畔行营；阿提拉游牧行幄木垒围城、精工细作原木大厅与金器镶嵌帐殿；非对称反曲复合硬弓、重型骨骲鸣镝射击、奔袭套索与环首弯刀大车阵）
    //    英雄队（第 10 队·主将队）：hero_attila / hero_cumanchief　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代匈人军团', civ: '匈人', age: 'antiquity', deStyle: 'CEAS', region: 'HUNS' as RegionType,
        buildingStyle: 'HUNS',
        castleId: 'HUNS_CASTLE_AGE3', castleName: '匈奴/匈人 简易木石混合要塞',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_bledathehun',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_attila（主将队须为古典时代的英雄或精英兵）
        // 🔴 [2026-10-16 主人令] 匈人只有古典一档：4 档＝城堡精锐【匈奴答剌罕骑兵精锐】；无封建军团，普通档不另放。
        slots: [
            { type: 'antiquity_heavy_cavalry_archer', count: 3 },
            { type: 'elite_tarkan', count: 4 },
            { type: 'antiquity_scout_cavalry', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 库曼　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 库曼 · 古典时代 · 古典时代萨尔马提亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（顿河草原、伏尔加河下游；萨尔马提亚高大古坟库尔干金箔鳞甲墓室、草原原木巡游行营；四米双手重骑枪（Kontos）、骨质铁质混合胸部鳞甲、重骑冲击与侧翼轻骑回旋射击大阵）
    //    英雄队（第 10 队·主将队）：hero_cumanchief / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代萨尔马提亚军团', civ: '库曼', age: 'antiquity', deStyle: 'CEAS', region: 'CUMAN' as RegionType,
        buildingStyle: 'CUMAN',
        castleId: 'CUMA_CASTLE_AGE3', castleName: '库曼 黑海北岸克里米亚要塞',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_belisarius',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_cumanchief（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'amazon_warrior', count: 3 },
            { type: 'amazon_archer', count: 4 },
            { type: 'sarmatian', count: 2 },
        ],
    },
    // ── 库曼 · 封建时代 · 封建时代可萨军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（伊梯尔、萨克尔；萨克尔石灰石巨砖要塞城郭、伏尔加河三角洲木石毡房集市要塞；反曲复合角弓风暴、双刃重铁马刀、丝路咽喉重甲骑兵与突厥铁卫协同大阵）
    //    英雄队（第 10 队·主将队）：hero_cumanchief / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代可萨军团', civ: '库曼', age: 'feudal', deStyle: 'CEAS', region: 'CUMAN' as RegionType,
        buildingStyle: 'CUMAN',
        castleId: 'CUMA_CASTLE_AGE3', castleName: '库曼 黑海北岸克里米亚要塞',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_girgenkhan',
        slots: [
            { type: 'raider', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'sogdian_cataphract', count: 2 },
        ],
    },
    // ── 库曼 · 城堡时代 · 城堡时代库曼军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：骑射、轻骑兵为主
    //    描述正文（主人原文，一字未改）：（顿涅茨河谷、第聂伯河下游；草原墓冢石人雕刻（Balbal）立像、黑海北岸连绵毡帐木栅营寨；精钢拟人铁面具头盔、双曲复合硬弓轻骑疾射、诱敌深入曼古歹与快马闪击突骑大阵）
    //    英雄队（第 10 队·主将队）：hero_cumanchief / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 库曼 · 帝国时代 · 帝国时代哥萨克军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：战车（大车垒）、骑兵、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（扎波罗热塞契、霍尔蒂齐亚岛；第聂伯河沙洲橡木尖桩营寨（Sich）、早期简易原木东正教哨堂；哥萨克长管火绳枪依托掩体齐射、交叠重装大车防御车垒（Tabor）、长矛与东欧马刀（Sabre）轻骑近身突袭大阵）
    //    英雄队（第 10 队·主将队）：hero_cumanchief / hero_kotyankhan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代哥萨克军团', civ: '库曼', age: 'imperial', deStyle: 'CEAS', region: 'CUMAN' as RegionType,
        buildingStyle: 'CUMAN',
        castleId: 'CUMA_CASTLE_AGE3', castleName: '库曼 黑海北岸克里米亚要塞',
        formationMode: 'crescent',
        shipId: 'DEMO_SHIP',
        commanderUnit: 'hero_cumanchief',
        slots: [
            { type: 'elite_steppe_lancer', count: 3 },
            { type: 'conquistador', count: 2 },
            { type: 'kipchak', count: 4 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 安纳托利亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 安纳托利亚 · 古典时代 · 古典时代赫梯军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：战车为主
    //    描述正文（主人原文，一字未改）：（哈图沙；哈图沙双层巨石城墙狮子门、斯芬克斯门要塞、亚兹勒卡亚岩壁浮雕神庙；三人青铜双轮重战车冲击、早期冷锻铁刃剑短矛、巨石卫城干砌地下暗道突袭大阵）
    //    英雄队（第 10 队·主将队）：hero_osman / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代赫梯军团', civ: '奥斯曼', age: 'antiquity', deStyle: 'CEAS', region: 'OTTOMAN' as RegionType,
        buildingStyle: 'TURKS',
        castleId: 'TURK_CASTLE_AGE3', castleName: '奥斯曼 托普卡珀皇宫圆堡',
        formationMode: 'crane_wing',
        shipId: 'BIREME',
        commanderUnit: 'hero_tsarkonstantin',
        // 🔴 [2026-10-16 主人令「象兵、战车只能安排在 2 档」＋「删除，别惹麻烦」] 战车不再上阵（不排 2 档，直接删）；
        //    空出的前排 3 档用非城堡精锐的古典长矛兵补位。
        //    🔴 [2026-10-16 主人令「换掉无素材的那个」] 后排 4 档「欧洲古典剑士特殊」在 SPRITE_PATHS 里没有素材
        //    （全库 3 个古典步兵缺素材之一，上阵渲染兜底）→ 换同属近东古典、有素材的【波斯持盾兵特殊】。
        //    军团改名：赫梯战车军团 → 古典时代赫梯军团。
        slots: [
            { type: 'elite_war_chariot', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'sickle_warrior', count: 3 },
        ],
    },
    // ── 安纳托利亚 · 封建时代 · 封建时代突厥骑射军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑射为主
    //    描述正文（主人原文，一字未改）：（科尼亚、锡瓦斯；科尼亚因杰米纳雷学校精雕石门、苏丹哈尼石砌大驿站防御堡垒；双曲复合角弓高速环形回旋射击、轻型柳叶锁子甲、诱敌深入曼古歹伏击骑兵大阵）
    //    英雄队（第 10 队·主将队）：hero_osman / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代突厥骑射军团', civ: '奥斯曼', age: 'feudal', deStyle: 'CEAS', region: 'OTTOMAN' as RegionType,
        buildingStyle: 'TURKS',
        castleId: 'TURK_CASTLE_AGE3', castleName: '奥斯曼 托普卡珀皇宫圆堡',
        formationMode: 'crescent',
        shipId: 'GALLEY',
        commanderUnit: 'hero_qutlugh',
        slots: [
            { type: 'eastern_swordsman', count: 3 },
            { type: 'cav_archer', count: 2 },
            { type: 'laminated_bowman', count: 4 },
        ],
    },
    // ── 安纳托利亚 · 城堡时代 · 城堡时代加齐突骑军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻骑兵、步兵为主
    //    描述正文（主人原文，一字未改）：（布尔萨、埃迪尔内；布尔萨大清真寺二十小穹顶大殿、乌卢清真寺石造泉池中庭；大马士革钢重型弯刀（Kilij）、锥形精钢尖顶头盔、山地奔袭破阵步骑突击大阵）
    //    英雄队（第 10 队·主将队）：hero_osman / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代加齐突骑军团', civ: '奥斯曼', age: 'castle', deStyle: 'CEAS', region: 'OTTOMAN' as RegionType,
        buildingStyle: 'TURKS',
        castleId: 'TURK_CASTLE_AGE3', castleName: '奥斯曼 托普卡珀皇宫圆堡',
        formationMode: 'crescent',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_osman',
        slots: [
            { type: 'eastern_swordsman', count: 3 },
            { type: 'cav_archer_heavy', count: 2 },
            { type: 'laminated_bowman', count: 4 },
        ],
    },
    // ── 安纳托利亚 · 帝国时代 · 帝国时代土耳其军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、远程（臼炮）为主
    //    描述正文（主人原文，一字未改）：（伊斯坦布尔、埃迪尔内；托普卡帕宫崇敬之门石砌双角塔城堡、巴耶济德二世早期铅顶石砌清真寺；西帕希人马具装重锁甲骑兵、重型长破甲枪与圆牌盾、大航海早期巨型重石球锻铁臼炮围攻大阵）
    //    英雄队（第 10 队·主将队）：hero_osman / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代土耳其军团', civ: '奥斯曼', age: 'imperial', deStyle: 'CEAS', region: 'OTTOMAN' as RegionType,
        buildingStyle: 'TURKS',
        castleId: 'TURK_CASTLE_AGE3', castleName: '奥斯曼 托普卡珀皇宫圆堡',
        formationMode: 'balance_yoke',
        shipId: 'ELITE_CANNON_GALLEON',
        commanderUnit: 'hero_mustafapasha',
        // 🔴 [2026-10-16 主人令·撤回] 「帝国无下一时代→落同军团 3 档」自造规则无效。
        //    4 档＝苏丹亲兵精锐（主人令「4 档放城堡精锐」）；3 档恢复具装枪骑兵高级。
        //    苏丹亲兵基础档改放新建三级军团「帝国时代苏丹亲兵军团」3 档。
        slots: [
            { type: 'elite_janissary', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
            { type: 'elite_guardsman', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 河中　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 河中 · 古典时代 · 古典时代粟特军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、战车、骑射为主
    //    描述正文（主人原文，一字未改）：（阿伊哈努姆、巴克特拉；阿伊哈努姆希腊化卫城多立克柱殿、泥砖希腊剧场与石砌体育馆；萨里萨超长枪重步兵方阵、塞种复合弓轻骑射协同、重型青铜甲双轮战车大阵）
    //    英雄队（第 10 队·主将队）：hero_qutlugh / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代粟特军团', civ: '鞑靼', age: 'antiquity', deStyle: 'CEAS', region: 'CENTRAL_ASIA' as RegionType,
        buildingStyle: 'CENTRAL_ASIA',
        castleId: 'CEAS_CASTLE_AGE3', castleName: '中亚/鞑靼 撒马尔罕帖木儿蓝顶堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_dismounted_alexander',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_qutlugh（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'bactrian_archer', count: 4 },
            { type: 'sogdian_cataphract', count: 2 },
        ],
    },
    // ── 河中 · 封建时代 · 封建时代河中军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（布哈拉、撒马尔罕；伊斯梅尔·萨曼烧结砖几何镂空陵殿、早期布哈拉方砖石木卫城；古拉姆人马锁甲重骑兵、重型破甲铁骨朵、抗击草原游牧袭扰的绿洲深壕营垒大阵）
    //    英雄队（第 10 队·主将队）：hero_qutlugh / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代河中军团', civ: '鞑靼', age: 'feudal', deStyle: 'CEAS', region: 'CENTRAL_ASIA' as RegionType,
        buildingStyle: 'CENTRAL_ASIA',
        castleId: 'CEAS_CASTLE_AGE3', castleName: '中亚/鞑靼 撒马尔罕帖木儿蓝顶堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_tamerlane',
        slots: [
            { type: 'hill_tribesman', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'sarmatian', count: 2 },
        ],
    },
    // ── 河中 · 城堡时代 · 城堡时代帖木儿军团　（三级升二级）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、战象为主
    //    描述正文（主人原文，一字未改）：（撒马尔罕、渴石；比比哈努姆清真寺巨型伊万门、古尔·埃米尔陵高耸蓝绿琉璃瓦葱头双层穹顶；全套东方铁板鳞甲骑兵、超强复合角弓抛射、重装长骑枪与战象协同野战大阵）
    //    英雄队（第 10 队·主将队）：hero_qutlugh / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代帖木儿军团', civ: '鞑靼', age: 'castle', deStyle: 'CEAS', region: 'CENTRAL_ASIA' as RegionType,
        buildingStyle: 'CENTRAL_ASIA',
        castleId: 'CEAS_CASTLE_AGE3', castleName: '中亚/鞑靼 撒马尔罕帖木儿蓝顶堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_tamerlane',
        slots: [
            { type: 'elite_keshik', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'steppe_lancer', count: 2 },
        ],
    },
    // ── 河中 · 帝国时代 · 帝国时代乌兹别克军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵为主
    //    描述正文（主人原文，一字未改）：（布哈拉、希瓦；布哈拉卡隆宣礼塔石砌广场基垒、早期希瓦土坯环形防御城垣；大马士革重型弯刀、中亚轻型锁子甲套护胸板、大航海早期昔班尼汗席卷河中绿洲铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_qutlugh / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代乌兹别克军团', civ: '鞑靼', age: 'imperial', deStyle: 'CEAS', region: 'CENTRAL_ASIA' as RegionType,
        buildingStyle: 'CENTRAL_ASIA',
        castleId: 'CEAS_CASTLE_AGE3', castleName: '中亚/鞑靼 撒马尔罕帖木儿蓝顶堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_qutlugh',
        slots: [
            { type: 'keshik', count: 3 },
            { type: 'mangudai_elite', count: 4 },
            { type: 'elite_steppe_lancer', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 达罗毗荼　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 达罗毗荼 · 古典时代 · 古典时代泰米尔军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻步兵为主
    //    描述正文（主人原文，一字未改）：（普哈尔、乌赖尤尔；早期红砖湿婆祭坛、桑加姆时代海港条石水闸要塞；桑加姆阔刃刺枪（Vel）、竹制轻圆盾、热带雨林与沿海礁石伏击步战大阵）
    //    英雄队（第 10 队·主将队）：hero_generalaraiyan / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代泰米尔军团', civ: '达罗毗荼', age: 'antiquity', deStyle: 'INDI', region: 'INDIA' as RegionType,
        buildingStyle: 'INDIA',
        castleId: 'INDI_CASTLE_AGE3', castleName: '南亚/达罗毗荼 坦贾武尔寺庙高塔堡',
        formationMode: 'triangle',
        shipId: 'ANT_WAR_GALLEY',
        commanderUnit: 'porus_elephant',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 elite_sannahya（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'urumi_swordsman', count: 3 },
            { type: 'pattiyoda_longbowman', count: 4 },
        ],
    },
    // ── 达罗毗荼 · 封建时代 · 封建时代朱罗军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：战象、重步兵为主
    //    描述正文（主人原文，一字未改）：（坦贾武尔、恒河康达朱罗普兰；布里哈迪斯瓦拉大庙巨型花岗岩十三层高耸主殿塔Vimana、八十吨整石重型圆顶；人披铜鳞甲重型战象冲阵、乌兹钢（Wootz）开刃弯剑与软鞭剑（Urumi）、王家近卫重步象兵推进方阵）
    //    英雄队（第 10 队·主将队）：hero_generalaraiyan / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代朱罗军团', civ: '达罗毗荼', age: 'feudal', deStyle: 'INDI', region: 'INDIA' as RegionType,
        buildingStyle: 'INDIA',
        castleId: 'INDI_CASTLE_AGE3', castleName: '南亚/达罗毗荼 坦贾武尔寺庙高塔堡',
        formationMode: 'crane_wing',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_generalaraiyan',
        slots: [
            { type: 'elite_elephant_archer', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'guardsman', count: 3 },
        ],
    },
    // ── 达罗毗荼 · 城堡时代 · 城堡时代维查耶那加尔军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：战象、重步兵为主
    //    描述正文（主人原文，一字未改）：（亨比；维鲁帕克沙大庙神柱殿、维塔拉神庙巨石马车、象房多重圆拱石室；精铁锁甲套长护胸板、高耸战象箭塔投射、花岗岩巨石环形城郭死守要塞大阵）
    //    英雄队（第 10 队·主将队）：hero_generalaraiyan / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代维查耶那加尔军团', civ: '达罗毗荼', age: 'castle', deStyle: 'INDI', region: 'INDIA' as RegionType,
        buildingStyle: 'INDIA',
        castleId: 'INDI_CASTLE_AGE3', castleName: '南亚/达罗毗荼 坦贾武尔寺庙高塔堡',
        formationMode: 'crane_wing',
        shipId: 'THIRISADAI',
        commanderUnit: 'hero_generalaraiyan',
        slots: [
            { type: 'elephant_archer', count: 2 },
            { type: 'elite_skirmisher', count: 4 },
            { type: 'elite_urumi_swordsman', count: 3 },
        ],
    },
    // ── 达罗毗荼 · 帝国时代 · 帝国时代科罗曼德尔军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（马杜赖、坦贾武尔；马杜赖米纳克希神庙早期重叠雕花高耸塔门（Gopuram）、纳亚克早期石砌高墙水寨；印度精钢拳刃（Katar）、双手反曲重斩剑、大航海早期南印度沿海石堡抵御火器与铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_generalaraiyan / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代科罗曼德尔军团', civ: '达罗毗荼', age: 'imperial', deStyle: 'INDI', region: 'INDIA' as RegionType,
        buildingStyle: 'INDIA',
        castleId: 'INDI_CASTLE_AGE3', castleName: '南亚/达罗毗荼 坦贾武尔寺庙高塔堡',
        formationMode: 'crane_wing',
        shipId: 'THIRISADAI',
        commanderUnit: 'hero_rajendrachola',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'imperial_skirmisher', count: 4 },
            { type: 'urumi_swordsman', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 印度斯坦　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第四批·地中海＋中东＋中亚＋印度）
    // ═══════════════════════════════════════════════════════════════════
    // ── 印度斯坦 · 古典时代 · 古典时代孔雀军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：战象、远程（步弓）为主
    //    描述正文（主人原文，一字未改）：（华氏城、王舍城；阿育王石柱猛狮柱头、桑吉大塔浮雕石栏楯、那烂陀红砖佛寺巨壁；竹制六尺超长重步兵大弓、双刃阔铁剑、披挂重铠的双人象轿长枪战象冲阵大阵）
    //    英雄队（第 10 队·主将队）：elite_battle_elephant / hero_prithviraj / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代孔雀军团', civ: '印度斯坦', age: 'antiquity', deStyle: 'INDI', region: 'MUGHAL' as RegionType,
        buildingStyle: 'MUGHAL',
        castleId: 'HIND_CASTLE_AGE3', castleName: '印度斯坦 德里红堡莫卧儿红砂岩',
        formationMode: 'crane_wing',
        shipId: 'ANT_GALLEY',
        commanderUnit: 'porus_elephant',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 elite_sannahya（主将队须为古典时代的英雄或精英兵）
        // 🔴 [2026-10-16 主人令「象兵、战车只能安排在 2 档」＋「删除，别惹麻烦」] 战象不再上阵（不排 2 档，直接删）；
        //    空出的前排 3 档用非城堡精锐的印度部落民补位。军团改名：恒河战象军团 → 孔雀军团。
        slots: [
            { type: 'elite_sannahya', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'indian_tribesman', count: 3 },
        ],
    },
    // ── 印度斯坦 · 封建时代 · 封建时代戒日军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：战象、骑兵为主
    //    描述正文（主人原文，一字未改）：（曲女城、瓦拉纳西；恒河畔多层石砌沐浴坛台、早期曲女城条石佛寺护法石柱；人马铁环轻锁甲、长刃骑兵突击长矛、千乘铁甲巨象开路步骑混编大阵）
    //    英雄队（第 10 队·主将队）：elite_battle_elephant / hero_prithviraj / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代戒日军团', civ: '印度斯坦', age: 'feudal', deStyle: 'INDI', region: 'MUGHAL' as RegionType,
        buildingStyle: 'MUGHAL',
        castleId: 'HIND_CASTLE_AGE3', castleName: '印度斯坦 德里红堡莫卧儿红砂岩',
        formationMode: 'triangle',
        shipId: 'GALLEY',
        commanderUnit: 'hero_ibrahimlodi',
        slots: [
            { type: 'armored_elephant', count: 2 },
            { type: 'indian_tribesman', count: 3 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
        ],
    },
    // ── 印度斯坦 · 城堡时代 · 城堡时代德里苏丹国军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑射、骑兵为主
    //    描述正文（主人原文，一字未改）：（德里、阿杰梅尔；顾特卜塔红砂岩高耸宣礼塔、阿莱达瓦扎石砌穹顶大拱门；大马士革钢重型弯刀（Talwar）、突厥重装锁子甲骑射手、阻击察合台蒙古侵扰的红砂岩要塞守御大阵）
    //    英雄队（第 10 队·主将队）：elite_battle_elephant / hero_prithviraj / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代德里苏丹国军团', civ: '印度斯坦', age: 'castle', deStyle: 'INDI', region: 'MUGHAL' as RegionType,
        buildingStyle: 'MUGHAL',
        castleId: 'HIND_CASTLE_AGE3', castleName: '印度斯坦 德里红堡莫卧儿红砂岩',
        formationMode: 'fish_scale',
        shipId: 'FIRE_SHIP',
        commanderUnit: 'hero_babur',
        slots: [
            { type: 'elite_ghulam', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'camel_heavy', count: 2 },
        ],
    },
    // ── 印度斯坦 · 帝国时代 · 帝国时代莫卧儿军团　（三级升二级）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、战车、战象为主
    //    描述正文（主人原文，一字未改）：（阿格拉、德里；阿格拉红堡早期红砂岩石壁堡垒、巴布尔阿尔巴格四分石砌引水园圃营地；人马重装镜面甲（Char-aina）、重型牛皮战车锁链车垒（Araba）、大航海早期战象拖曳巨炮与中亚铁骑协同平原决战大阵）
    //    英雄队（第 10 队·主将队）：elite_battle_elephant / hero_prithviraj / hero_rajendrachola / elite_sannahya　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代莫卧儿军团', civ: '印度斯坦', age: 'imperial', deStyle: 'INDI', region: 'MUGHAL' as RegionType,
        buildingStyle: 'MUGHAL',
        castleId: 'HIND_CASTLE_AGE3', castleName: '印度斯坦 德里红堡莫卧儿红砂岩',
        formationMode: 'fish_scale',
        shipId: 'CANNON_GALLEON',
        commanderUnit: 'hero_rajendrachola',
        slots: [
            { type: 'ghulam', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'imperial_camel_rider', count: 2 },
        ],
    },


    // ═══════════════════════════════════════════════════════════════════
    // 孟加拉　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第五批·孟加拉＋古吉拉特＋旁遮普＋吴哥＋缅甸＋安南＋南洋）
    // ═══════════════════════════════════════════════════════════════════
    // ── 孟加拉 · 古典时代 · 古典时代高陀军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：战象、远程为主
    //    描述正文（主人原文，一字未改）：（卡尔纳苏瓦尔纳、高达；红砖砌筑多层佛寺基址、湿婆神庙石雕坛座；三角洲轻质硬木大弓、双刃破甲短矛、沼泽水网冲积平原浅滩战象突击大阵）
    //    英雄队（第 10 队·主将队）：elite_ratha_melee / hero_generalaraiyan / hero_rajendrachola　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代高陀军团', civ: '孟加拉', age: 'antiquity', deStyle: 'INDI', region: 'BENGALIS' as RegionType,
        buildingStyle: 'BENGALIS',
        castleId: 'BENG_CASTLE_AGE3', castleName: '孟加拉 恒河三角洲砖石堡',
        formationMode: 'crane_wing',
        shipId: 'ANT_ELITE_GALLEY',
        commanderUnit: 'porus_elephant',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 elite_ratha_melee（主将队须为古典时代的英雄或精英兵）
        // 🔴 [2026-10-16 主人令] ①「象兵、战车只能安排在 2 档」②「象兵和战车不能同时在一个军团，替换不是城堡的精锐兵种」
        //    ⇒ 拉塔弓战车精锐（孟加拉自家城堡兵）压到 2 档；桑纳亚战象高级（普鲁马厩专属，借调而来）离队；
        //      空出的 3 档用非城堡精锐补位——印度部落民（3 档·前排）＋帕提尤达长弓兵基础档（4 档·后排）。
        slots: [
            { type: 'ratha_ranged', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'indian_tribesman', count: 3 },
        ],
    },
    // ── 孟加拉 · 封建时代 · 封建时代波罗军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：战象、战车为主
    //    描述正文（主人原文，一字未改）：（索马普拉、帕哈尔普尔；帕哈尔普尔巨型十字形红砖阶梯佛寺大殿、赤陶浮雕外墙要塞；人披锁甲重型装甲象轿、长刃重斩刀（Khanda）、古印式双马战车（Ratha）远近切换协同穿插大阵）
    //    英雄队（第 10 队·主将队）：elite_ratha_melee / hero_generalaraiyan / hero_rajendrachola　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代波罗军团', civ: '孟加拉', age: 'feudal', deStyle: 'INDI', region: 'BENGALIS' as RegionType,
        buildingStyle: 'BENGALIS',
        castleId: 'BENG_CASTLE_AGE3', castleName: '孟加拉 恒河三角洲砖石堡',
        formationMode: 'crane_wing',
        shipId: 'GALLEY',
        commanderUnit: 'hero_rajendrachola',
        // 🔴 [2026-10-16 主人令] ①城堡兵普通档进同文化封建军团：拉塔战车（普通档）在编；
        //    ②按「象兵、战车只能安排在 2 档」＋「象车不能同队」：拉塔战车压到 2 档，战斗象高级离队。
        slots: [
            { type: 'elite_ratha_ranged', count: 2 },
            { type: 'elite_skirmisher', count: 4 },
            { type: 'indian_tribesman', count: 3 },
        ],
    },
    // ── 孟加拉 · 城堡时代 · 城堡时代孟加拉军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：远程、步兵为主
    //    描述正文（主人原文，一字未改）：（高达、潘杜瓦；阿迪纳大清真寺巨大拱券石砖大殿、沙特贡巴德六十圆顶砖石城堡；复合角弓密集阵列抛射、大马士革钢重型弯刀、三角洲水网竹桩要塞阻击北方铁骑大阵）
    //    英雄队（第 10 队·主将队）：elite_ratha_melee / hero_generalaraiyan / hero_rajendrachola　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代孟加拉军团', civ: '孟加拉', age: 'castle', deStyle: 'INDI', region: 'BENGALIS' as RegionType,
        buildingStyle: 'BENGALIS',
        castleId: 'BENG_CASTLE_AGE3', castleName: '孟加拉 恒河三角洲砖石堡',
        formationMode: 'triangle',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        commanderUnit: 'hero_rajendrachola',
        slots: [
            { type: 'ratha_melee', count: 2 },
            { type: 'indian_tribesman', count: 3 },
            { type: 'laminated_bowman', count: 4 },
        ],
    },
    // ── 孟加拉 · 帝国时代 · 帝国时代恒河军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：战象、长枪步兵为主
    //    描述正文（主人原文，一字未改）：（高达、吉大港；高达乔塔索纳清真寺精雕黑玄武岩石饰贴面殿堂、吉大港早期石垒边防营寨；披挂铁甲的恒河火器战象、竹节涂毒长破甲枪、大航海早期三角洲密林泥沼阻击外敌铁壁大阵）
    //    英雄队（第 10 队·主将队）：elite_ratha_melee / hero_generalaraiyan / hero_rajendrachola　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代恒河军团', civ: '孟加拉', age: 'imperial', deStyle: 'INDI', region: 'BENGALIS' as RegionType,
        buildingStyle: 'BENGALIS',
        castleId: 'BENG_CASTLE_AGE3', castleName: '孟加拉 恒河三角洲砖石堡',
        formationMode: 'triangle',
        shipId: 'GALLEON',
        commanderUnit: 'hero_babur',
        slots: [
            { type: 'elite_ratha_melee', count: 2 },
            { type: 'indian_tribesman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 古吉拉特　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第五批·孟加拉＋古吉拉特＋旁遮普＋吴哥＋缅甸＋安南＋南洋）
    // ═══════════════════════════════════════════════════════════════════
    // ── 古吉拉特 · 古典时代 · 古典时代萨卡军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（乌贾因、朱纳加德；吉尔纳尔岩壁大理石储水大坝敕令铭刻、早期悬崖佛石窟玄武岩雕凿殿堂；塞种双曲复合反曲弓、精钢破甲双手长骑枪、人马具装重鳞甲与高机动骑射迂回大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_rajendrachola / elite_sannahya / hero_chandbardai　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代萨卡军团', civ: '瞿折罗', age: 'antiquity', deStyle: 'INDI', region: 'GURJARAS' as RegionType,
        buildingStyle: 'GURJARAS',
        castleId: 'GURJ_CASTLE_AGE3', castleName: '瞿折罗 索姆纳特多层砂岩堡',
        formationMode: 'echelon',
        shipId: 'BIREME',
        commanderUnit: 'hero_artaphernes',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_prithviraj（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'indian_tribesman', count: 3 },
            { type: 'lancer', count: 2 },
        ],
    },
    // ── 古吉拉特 · 封建时代 · 封建时代古贾拉铁骑军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（巴托利、加利亚考特；巴罗利石刻湿婆神庙群密檐石塔顶、早期古贾拉高原石垒关隘城堡；人披熟牛皮重甲骑兵、长刃重斩刀（Khanda）、抵御阿拉伯军团东进的干旱荒原穿插阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_rajendrachola / elite_sannahya / hero_chandbardai　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代古贾拉铁骑军团', civ: '瞿折罗', age: 'feudal', deStyle: 'INDI', region: 'GURJARAS' as RegionType,
        buildingStyle: 'GURJARAS',
        castleId: 'GURJ_CASTLE_AGE3', castleName: '瞿折罗 索姆纳特多层砂岩堡',
        formationMode: 'echelon',
        shipId: 'GALLEY',
        commanderUnit: 'hero_prithviraj',
        slots: [
            { type: 'elite_chakram_thrower', count: 4 },
            { type: 'camel_scout', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 2 },
        ],
    },
    // ── 古吉拉特 · 城堡时代 · 城堡时代古吉拉特军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、战象为主
    //    描述正文（主人原文，一字未改）：（艾哈迈达巴德、占庞尔；占庞尔大清真寺镂空石雕拱券山门、王后阶梯井（Rani ki Vav）深邃多层石雕防卫水井神殿；大马士革精锻弯刀（Talwar）、精铁护心镜圆盾手、深沟高垒石砌要塞防卫与战象破城协同大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_rajendrachola / elite_sannahya / hero_chandbardai　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代古吉拉特军团', civ: '瞿折罗', age: 'castle', deStyle: 'INDI', region: 'GURJARAS' as RegionType,
        buildingStyle: 'GURJARAS',
        castleId: 'GURJ_CASTLE_AGE3', castleName: '瞿折罗 索姆纳特多层砂岩堡',
        formationMode: 'crane_wing',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_prithvi',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'indian_tribesman', count: 4 },
            { type: 'chakram_thrower', count: 3 },
        ],
    },
    // ── 古吉拉特 · 帝国时代 · 帝国时代古吉拉特军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：步兵、远程（飞轮刃）、重骑兵为主
    //    描述正文（主人原文，一字未改）：（第乌、苏拉特；第乌海峡早期条石城防营垒、占庞尔帕瓦加德山巅石砌防御卫城；乌兹钢反曲重腰刀与精钢飞轮刃（Chakram）、阿拉伯式重型复合角弓、大航海早期古吉拉特要塞步骑协同铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_rajendrachola / elite_sannahya / hero_chandbardai　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代古吉拉特军团', civ: '瞿折罗', age: 'imperial', deStyle: 'INDI', region: 'GURJARAS' as RegionType,
        buildingStyle: 'GURJARAS',
        castleId: 'GURJ_CASTLE_AGE3', castleName: '瞿折罗 索姆纳特多层砂岩堡',
        formationMode: 'fish_scale',
        shipId: 'CANNON_GALLEON',
        commanderUnit: 'hero_prithvi',
        slots: [
            { type: 'chakram_thrower', count: 3 },
            { type: 'indian_tribesman', count: 4 },
            { type: 'shrivamsha_rider', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 旁遮普　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第五批·孟加拉＋古吉拉特＋旁遮普＋吴哥＋缅甸＋安南＋南洋）
    // ═══════════════════════════════════════════════════════════════════
    // ── 旁遮普 · 古典时代 · 古典时代贵霜军团　（三级升二级）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（白沙瓦、塔克西拉；塔克西拉法门法罗舍利塔石坛、犍陀罗希腊式条石佛龛与方石卫城；人马重装精铁具装鳞甲、双刃破甲长骑枪、希腊化重步兵长矛密集方阵与塞种骑射协同大阵）
    //    英雄队（第 10 队·主将队）：porus_elephant / hero_prithviraj　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代贵霜军团', civ: '普鲁', age: 'antiquity', deStyle: 'PURU', region: 'PURU' as RegionType,
        buildingStyle: 'PURU',
        castleId: 'PURU_CASTLE_AGE3', castleName: '普鲁·南亚 旁遮普红砂岩堡',
        formationMode: 'triangle',
        shipId: 'MONOREME',
        commanderUnit: 'porus_elephant',
        // 🔴 [2026-10-16 主人令「13 支军团的主力4档，请都套用城堡精锐」] 主力4档＝普鲁（PURU）城堡兵【帕提尤达长弓兵精锐】。
        // 🔴 [2026-10-16 主人令·回退] 我曾擅自把 3 档改成「帕提尤达长弓兵」（那是它的城堡兵、普通档按规则在
        //    封建沙希军团 3 档，不该塞回本军团）→ 恢复原状（库曼钦察弓骑精锐）。
        slots: [
            { type: 'elite_sannahya', count: 2 },
            { type: 'indian_tribesman', count: 3 },
            { type: 'elite_pattiyoda_longbowman', count: 4 },
        ],
    },
    // ── 旁遮普 · 封建时代 · 封建时代沙希军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：战象、重步兵为主
    //    描述正文（主人原文，一字未改）：（洪德、卡塔斯拉杰；卡塔斯拉杰砂岩神庙群石殿、盐岭悬崖条石要塞城堡；双刃开山重斩剑（Khanda）、精铁锁子胸甲、扼守开伯尔山口险隘阻击北方突骑的大象步兵协同大阵）
    //    英雄队（第 10 队·主将队）：porus_elephant / hero_prithviraj　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代沙希军团', civ: '普鲁', age: 'feudal', deStyle: 'PURU', region: 'PURU' as RegionType,
        buildingStyle: 'PURU',
        castleId: 'PURU_CASTLE_AGE3', castleName: '普鲁·南亚 旁遮普红砂岩堡',
        formationMode: 'triangle',
        shipId: 'INCENDIARY_RAFT',
        commanderUnit: 'hero_mihirabhoja',
        // 🔴 [2026-10-16 主人令] ①城堡兵普通档进同文化封建军团：帕提尤达长弓兵在编；
        //    ②按「象兵只能安排在 2 档」：战斗象压到 2 档，古拉姆离队。
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'pattiyoda_longbowman', count: 4 },
        ],
    },
    // ── 旁遮普 · 城堡时代 · 城堡时代五河军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（拉合尔、木尔坦；木尔坦鲁克尼阿拉姆八角形斜墙多孔红砖陵堡、早期拉合尔护城河石垒要塞；大马士革钢重型弯刀（Talwar）、中亚复合反曲角弓、阻击察合台蒙古侵扰的五河流域重骑穿插大阵）
    //    英雄队（第 10 队·主将队）：porus_elephant / hero_prithviraj　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代五河军团', civ: '普鲁', age: 'castle', deStyle: 'PURU', region: 'PURU' as RegionType,
        buildingStyle: 'PURU',
        castleId: 'PURU_CASTLE_AGE3', castleName: '普鲁·南亚 旁遮普红砂岩堡',
        formationMode: 'triangle',
        shipId: 'INCENDIARY_SHIP',
        commanderUnit: 'hero_babur',
        slots: [
            { type: 'elite_armored_elephant', count: 2 },
            { type: 'elite_guardsman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
        ],
    },
    // ── 旁遮普 · 帝国时代 · 帝国时代旁遮普军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（拉合尔、罗赫塔斯；拉合尔早期坚固砖石防御要塞城堡、盐岭要冲条石关隘石营；重装钢板人马胸铠、长柄破甲钩矛与重型腰刀、大航海早期扼守北印门户抗击中亚铁骑突袭大阵）
    //    英雄队（第 10 队·主将队）：porus_elephant / hero_prithviraj　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代旁遮普军团', civ: '普鲁', age: 'imperial', deStyle: 'PURU', region: 'PURU' as RegionType,
        buildingStyle: 'PURU',
        castleId: 'PURU_CASTLE_AGE3', castleName: '普鲁·南亚 旁遮普红砂岩堡',
        formationMode: 'fish_scale',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        commanderUnit: 'porus_elephant',
        slots: [
            { type: 'elite_guardsman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'imperial_camel_rider', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 吴哥　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第五批·孟加拉＋古吉拉特＋旁遮普＋吴哥＋缅甸＋安南＋南洋）
    // ═══════════════════════════════════════════════════════════════════
    // ── 吴哥 · 古典时代 · 古典时代扶南军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、战象为主
    //    描述正文（主人原文，一字未改）：（奥高埃、毗耶陀补罗；奥高埃运河木桩干栏城郭、早期红土砖砌水神坛要塞；早期驯化林地战象开路、锋锐黑石铁刃刺矛与硬藤盾、湄公河三角洲密林泥沼伏击步象大阵）
    //    英雄队（第 10 队·主将队）：elite_ballista_elephant / hero_gajahmada / hero_leloi / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代扶南军团', civ: '高棉', age: 'antiquity', deStyle: 'SEAS', region: 'KHMER' as RegionType,
        buildingStyle: 'KHMER',
        castleId: 'SEAS_CASTLE_AGE3', castleName: '东南亚/高棉 吴哥窟砂岩塔',
        formationMode: 'triangle',
        shipId: 'INCENDIARY_SHIP',
        commanderUnit: 'bayinnaung_elephant',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 elite_elephant_archer（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'indian_tribesman', count: 3 },
            { type: 'rattan_archer', count: 4 },
        ],
    },
    // ── 吴哥 · 封建时代 · 封建时代高棉军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：战象、远程（象弩）为主
    //    描述正文（主人原文，一字未改）：（吴哥、暹粒；巴戎寺四面观音微笑巨石石叠塔群、西池砂岩环形引水防御水渠网络；双人象背机械重弩（Ballista）、热带青铜重阔剑、巨石回廊前排象军破阵野战大阵）
    //    英雄队（第 10 队·主将队）：elite_ballista_elephant / hero_gajahmada / hero_leloi / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代高棉军团', civ: '高棉', age: 'feudal', deStyle: 'SEAS', region: 'KHMER' as RegionType,
        buildingStyle: 'KHMER',
        castleId: 'SEAS_CASTLE_AGE3', castleName: '东南亚/高棉 吴哥窟砂岩塔',
        formationMode: 'crane_wing',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_suryavarmani',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'guardsman', count: 3 },
        ],
    },
    // ── 吴哥 · 城堡时代 · 城堡时代吴哥军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（吴哥通王城、普拉坎；吴哥城胜利门修罗拉蛇石雕列柱栏杆、普拉坎密林巨石石廊哨塔；长杆钩镰刀（Phkak）、多层硬藤重圆盾、抵御暹罗骑兵的长墙重壕阵地坚守大阵）
    //    英雄队（第 10 队·主将队）：elite_ballista_elephant / hero_gajahmada / hero_leloi / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代吴哥军团', civ: '高棉', age: 'castle', deStyle: 'SEAS', region: 'KHMER' as RegionType,
        buildingStyle: 'KHMER',
        castleId: 'SEAS_CASTLE_AGE3', castleName: '东南亚/高棉 吴哥窟砂岩塔',
        formationMode: 'crane_wing',
        shipId: 'FAST_FIRE_SHIP',
        commanderUnit: 'hero_udayadityavarmani',
        // 🔴 [2026-10-16 主人令·按分批时代] 高棉＝城堡批：弩炮战象精锐进城堡吴哥军团 2 档；
        //    普通进下一时代（帝国洛韦克军团）2 档。象类只占 2 档。
        slots: [
            { type: 'elite_ballista_elephant', count: 2 },
            { type: 'skirmisher', count: 4 },
            { type: 'militia', count: 3 },
        ],
    },
    // ── 吴哥 · 帝国时代 · 帝国时代洛韦克军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、战象为主
    //    描述正文（主人原文，一字未改）：（洛韦克、金边；洛韦克重叠铁竹尖桩防御堡垒、洞里萨河口水运木石营寨要塞；精铁反曲长腰刀、竹节密集涂毒长刺枪、大航海早期依靠河谷水网竹障阻击步象协同大阵）
    //    英雄队（第 10 队·主将队）：elite_ballista_elephant / hero_gajahmada / hero_leloi / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代洛韦克军团', civ: '高棉', age: 'imperial', deStyle: 'SEAS', region: 'KHMER' as RegionType,
        buildingStyle: 'KHMER',
        castleId: 'SEAS_CASTLE_AGE3', castleName: '东南亚/高棉 吴哥窟砂岩塔',
        formationMode: 'crane_wing',
        shipId: 'GALLEON',
        commanderUnit: 'hero_gajahmada',
        // 🔴 [2026-10-16 主人令·按分批时代] 高棉普通档（弩炮战象）进帝国洛韦克军团 2 档。
        slots: [
            { type: 'ballista_elephant', count: 2 },
            { type: 'skirmisher', count: 4 },
            { type: 'militia', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 缅甸　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第五批·孟加拉＋古吉拉特＋旁遮普＋吴哥＋缅甸＋安南＋南洋）
    // ═══════════════════════════════════════════════════════════════════
    // ── 缅甸 · 古典时代 · 古典时代骠人军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程、步兵为主
    //    描述正文（主人原文，一字未改）：（罕林、室利差呾罗；室利差呾罗圆筒形包包基砖塔、伊洛瓦底江畔环形烧结砖厚墙卫城；竹木硬弓近距穿透射击、双刃破甲短矛、环城深壕与密林防御步兵方阵）
    //    英雄队（第 10 队·主将队）：bayinnaung_elephant / hero_gajahmada / elite_battle_elephant / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代骠人军团', civ: '缅甸', age: 'antiquity', deStyle: 'SEAS', region: 'BURMESE' as RegionType,
        buildingStyle: 'BURMESE',
        castleId: 'BURM_CASTLE_AGE3', castleName: '缅甸 蒲甘千佛塔金顶堡',
        formationMode: 'triangle',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        commanderUnit: 'hero_gajahmada',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'bowman', count: 4 },
        ],
    },
    // ── 缅甸 · 封建时代 · 封建时代蒲甘军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：战象、重骑兵为主
    //    描述正文（主人原文，一字未改）：（蒲甘、敏巫；阿难陀寺白色希腊十字形密檐大殿、达玛扬吉梯级无缝咬合红砖石堡；披挂熟牛皮甲战象冲阵、重型破甲刺枪、皇家桂家精锐马军（Cavalry）与巨象踏阵大阵）
    //    英雄队（第 10 队·主将队）：bayinnaung_elephant / hero_gajahmada / elite_battle_elephant / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代蒲甘军团', civ: '缅甸', age: 'feudal', deStyle: 'SEAS', region: 'BURMESE' as RegionType,
        buildingStyle: 'BURMESE',
        castleId: 'BURM_CASTLE_AGE3', castleName: '缅甸 蒲甘千佛塔金顶堡',
        formationMode: 'crane_wing',
        shipId: 'GALLEY',
        commanderUnit: 'hero_tabinshwehti',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'arambai', count: 4 },
            { type: 'pikeman', count: 3 },
        ],
    },
    // ── 缅甸 · 城堡时代 · 城堡时代阿瓦军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、战象为主
    //    描述正文（主人原文，一字未改）：（阿瓦、实皆；实皆山千白塔砖石基垒、阿瓦四方深壕柚木防御水寨；缅甸精钢双手重弯刀（Dha）、坚韧藤牌轻步兵、抵御掸族高地骑兵的山谷设伏象步协同大阵）
    //    英雄队（第 10 队·主将队）：bayinnaung_elephant / hero_gajahmada / elite_battle_elephant / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代阿瓦军团', civ: '缅甸', age: 'castle', deStyle: 'SEAS', region: 'BURMESE' as RegionType,
        buildingStyle: 'BURMESE',
        castleId: 'BURM_CASTLE_AGE3', castleName: '缅甸 蒲甘千佛塔金顶堡',
        formationMode: 'crescent',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        commanderUnit: 'bayinnaung_elephant',
        slots: [
            { type: 'paragon', count: 3 },
            { type: 'elite_arambai', count: 2 },
            { type: 'gastraphetes', count: 4 },
        ],
    },
    // ── 缅甸 · 帝国时代 · 帝国时代东吁军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：战象、远程（飞标）为主
    //    描述正文（主人原文，一字未改）：（东吁、勃固；东吁早期柚木泥石深壕山垒要塞、早期砖石覆钵防卫佛塔营垒；双人木制象轿重长枪、竹柄涂毒投掷飞标、大航海早期收拢流亡部族密林结垒突袭大阵）
    //    英雄队（第 10 队·主将队）：bayinnaung_elephant / hero_gajahmada / elite_battle_elephant / elite_elephant_archer　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代东吁军团', civ: '缅甸', age: 'imperial', deStyle: 'SEAS', region: 'BURMESE' as RegionType,
        buildingStyle: 'BURMESE',
        castleId: 'BURM_CASTLE_AGE3', castleName: '缅甸 蒲甘千佛塔金顶堡',
        formationMode: 'balance_yoke',
        shipId: 'GALLEON',
        commanderUnit: 'bayinnaung_elephant',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'arambai', count: 2 },
            { type: 'paragon', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 安南　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第五批·孟加拉＋古吉拉特＋旁遮普＋吴哥＋缅甸＋安南＋南洋）
    // ═══════════════════════════════════════════════════════════════════
    // ── 安南 · 古典时代 · 古典时代交趾军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程（连弩）、步兵为主
    //    描述正文（主人原文，一字未改）：（古螺城、龙编；古螺城螺旋形三重夯土巨壕水堡、早期青铜冶铸石筑台基；东山青铜机栝连发重弩、涂毒青铜剑与骨镝箭、红河三角洲密林泥沼陷阱步战大阵）
    //    英雄队（第 10 队·主将队）：hero_dinhle / hero_leloi / elite_battle_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代交趾军团', civ: '越南', age: 'antiquity', deStyle: 'SEAS', region: 'VIETNAMESE' as RegionType,
        buildingStyle: 'VIETNAMESE',
        castleId: 'VIET_CASTLE_AGE3', castleName: '越南 顺化京城多檐城门楼',
        formationMode: 'fish_scale',
        shipId: 'INCENDIARY_SHIP',
        commanderUnit: 'hero_zhouyu',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_chukonu', count: 4 },
            { type: 'fire_archer', count: 2 },
        ],
    },
    // ── 安南 · 封建时代 · 封建时代丁黎军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（华闾、白藤江口；华闾喀斯特环形悬崖石筑水陆关隘、丁仙皇早期石构木梁防御要塞；倒钩破甲长铁矛、轻便藤编漆盾、扼守喀斯特隘口与深江铁桩设伏阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_dinhle / hero_leloi / elite_battle_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代瞿越军团', civ: '越南', age: 'feudal', deStyle: 'SEAS', region: 'VIETNAMESE' as RegionType,
        buildingStyle: 'VIETNAMESE',
        castleId: 'VIET_CASTLE_AGE3', castleName: '越南 顺化京城多檐城门楼',
        formationMode: 'triangle',
        shipId: 'GALLEY',
        commanderUnit: 'hero_luunhanchu',
        slots: [
            { type: 'imperial_skirmisher', count: 2 },
            { type: 'jian_swordsman', count: 3 },
            { type: 'rattan_archer', count: 4 },
        ],
    },
    // ── 安南 · 城堡时代 · 城堡时代大越军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、远程（踏张弩）为主
    //    描述正文（主人原文，一字未改）：（升龙、清化；胡朝西都石城巨型青石榫卯咬合城垣、升龙皇城条石护城壕堡垒；长柄双手斩马长刀、重装精铁踏张弩、“杀鞑”刺青死士长枪列阵与白藤江潮汐铁桩火攻大阵）
    //    英雄队（第 10 队·主将队）：hero_dinhle / hero_leloi / elite_battle_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代大越军团', civ: '越南', age: 'castle', deStyle: 'SEAS', region: 'VIETNAMESE' as RegionType,
        buildingStyle: 'VIETNAMESE',
        castleId: 'VIET_CASTLE_AGE3', castleName: '越南 顺化京城多檐城门楼',
        formationMode: 'triangle',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        commanderUnit: 'hero_leloi',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'imperial_skirmisher', count: 3 },
            { type: 'rattan_archer_elite', count: 4 },
        ],
    },
    // ── 安南 · 帝国时代 · 帝国时代安南军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：长枪步兵、远程（藤弓/火器）为主
    //    描述正文（主人原文，一字未改）：（升龙、蓝京；蓝京石雕神道龙栏石坊营垒、升龙外郭坚固砖石多重城防；精钢阔刃腰刀、竹节涂毒超长拒马枪、大航海早期黎朝藤甲步弓手与交趾火铳步象协同大阵）
    //    英雄队（第 10 队·主将队）：hero_dinhle / hero_leloi / elite_battle_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代安南军团', civ: '越南', age: 'imperial', deStyle: 'SEAS', region: 'VIETNAMESE' as RegionType,
        buildingStyle: 'VIETNAMESE',
        castleId: 'VIET_CASTLE_AGE3', castleName: '越南 顺化京城多檐城门楼',
        formationMode: 'fish_scale',
        shipId: 'GALLEON',
        commanderUnit: 'hero_dinhle',
        slots: [
            { type: 'imperial_skirmisher', count: 3 },
            { type: 'rattan_archer', count: 4 },
            { type: 'elite_fire_lancer', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 南洋　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第五批·孟加拉＋古吉拉特＋旁遮普＋吴哥＋缅甸＋安南＋南洋）
    // ═══════════════════════════════════════════════════════════════════
    // ── 南洋 · 古典时代 · 古典时代狼牙脩军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程（吹管）、轻步兵为主
    //    描述正文（主人原文，一字未改）：（北大年、吉打；克拉地峡红土砖砌水神坛基座、早期海口红树林木石围栅要塞；热带坚韧硬木吹管毒针、锋锐双刃青铜刺标、潮间带泥沼密林伏击步战大阵）
    //    英雄队（第 10 队·主将队）：hero_gajahmada / hero_dinhle / hero_jayanegara　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代狼牙脩军团', civ: '马来', age: 'antiquity', deStyle: 'SEAS', region: 'MALAY' as RegionType,
        buildingStyle: 'MALAY',
        castleId: 'MALA_CASTLE_AGE3', castleName: '马来 马六甲海峡水上海堡',
        formationMode: 'crane_wing',
        shipId: 'FAST_FIRE_SHIP',
        commanderUnit: 'hero_gajahmada',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_jayanegara（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'karambit_warrior', count: 3 },
        ],
    },
    // ── 南洋 · 封建时代 · 封建时代三佛齐军团　（三级升二级）────────────────
    //    评级：【高级】｜核心兵种：步兵、远程为主
    //    描述正文（主人原文，一字未改）：（巨港、占碑；穆阿拉占碑红砖大佛塔群、苏门答腊木石防御仓储要塞；双刃阔身马来剑、涂毒吹管与硬木短弓、热带雨林关隘设伏与轻装步兵包抄突击大阵）
    //    英雄队（第 10 队·主将队）：hero_gajahmada / hero_dinhle / hero_jayanegara　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代三佛齐军团', civ: '马来', age: 'feudal', deStyle: 'SEAS', region: 'MALAY' as RegionType,
        buildingStyle: 'MALAY',
        castleId: 'MALA_CASTLE_AGE3', castleName: '马来 马六甲海峡水上海堡',
        formationMode: 'crane_wing',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_suryavarmani',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'karambit_warrior', count: 3 },
        ],
    },
    // ── 南洋 · 城堡时代 · 城堡时代爪哇军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：步兵、战象为主
    //    描述正文（主人原文，一字未改）：（特罗乌兰、玛琅；特罗乌兰巨大红砖分塔门（Candi Bajang Ratu）、加隆拱厚重烧结砖防御水闸；精钢陨铁波刃爪刀（Keris/Karambit）、轻型硬藤圆盾、满者伯夷王室战象与爪刀死士潮水突击大阵）
    //    英雄队（第 10 队·主将队）：hero_gajahmada / hero_dinhle / hero_jayanegara　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代爪哇军团', civ: '马来', age: 'castle', deStyle: 'SEAS', region: 'MALAY' as RegionType,
        buildingStyle: 'MALAY',
        castleId: 'MALA_CASTLE_AGE3', castleName: '马来 马六甲海峡水上海堡',
        formationMode: 'crane_wing',
        shipId: 'FAST_FIRE_SHIP',
        commanderUnit: 'hero_radenwijaya',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'sunda_royal_fighter', count: 4 },
            { type: 'karambit_warrior_elite', count: 3 },
        ],
    },
    // ── 南洋 · 帝国时代 · 帝国时代马六甲军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（轻型火炮）为主
    //    描述正文（主人原文，一字未改）：（马六甲、淡目；淡目大清真寺多层金字塔形柚木重檐神殿、马六甲早期条石木桩防御要塞；重型破甲短矛、毒汁涂刃马来匕首、大航海早期铜制小口径回旋炮（Lantaka）与苏丹战象守御大阵）
    //    英雄队（第 10 队·主将队）：hero_gajahmada / hero_dinhle / hero_jayanegara　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代马六甲军团', civ: '马来', age: 'imperial', deStyle: 'SEAS', region: 'MALAY' as RegionType,
        buildingStyle: 'MALAY',
        castleId: 'MALA_CASTLE_AGE3', castleName: '马来 马六甲海峡水上海堡',
        formationMode: 'crane_wing',
        shipId: 'GALLEON',
        commanderUnit: 'hero_gajahmada',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'imperial_skirmisher', count: 4 },
            { type: 'karambit_warrior', count: 3 },
        ],
    },


    // ═══════════════════════════════════════════════════════════════════
    // 玛雅　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 玛雅 · 古典时代 · 古典时代佩滕军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程（掷矛器）、步兵为主
    //    描述正文（主人原文，一字未改）：（蒂卡尔、帕伦克；蒂卡尔一号巨石神庙梯形实心阶梯金字塔、帕伦克铭文神庙叠涩拱石雕神殿；黑曜石锋刃掷矛器（Atlatl）、燧石重型战矛、热带喀斯特密林伏击与贵族俘获突击大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_cusiyupanqui　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代佩滕军团', civ: '玛雅', age: 'antiquity', deStyle: 'MESO', region: 'MAYANS' as RegionType,
        buildingStyle: 'MAYANS',
        castleId: 'MAYA_CASTLE_AGE3', castleName: '玛雅 奇琴伊察阶梯神庙堡',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_cunhambebe',
        slots: [
            { type: 'antiquity_spearman', count: 3 },
            { type: 'plumed_archer', count: 4 },
            { type: 'eagle_scout', count: 2 },
        ],
    },
    // ── 玛雅 · 封建时代 · 封建时代尤卡坦军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（奇琴伊察、乌斯马尔；库库尔坎金字塔蛇影石阶平台、乌斯马尔四合院繁复石灰岩嵌花石殿；双手带刃硬木战棍、浸盐厚织防箭棉甲、石砌圣井与千柱集结阵列包抄大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_cusiyupanqui　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代尤卡坦军团', civ: '玛雅', age: 'feudal', deStyle: 'MESO', region: 'MAYANS' as RegionType,
        buildingStyle: 'MAYANS',
        castleId: 'MAYA_CASTLE_AGE3', castleName: '玛雅 奇琴伊察阶梯神庙堡',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_cuauhtemoc',
        slots: [
            { type: 'eagle_warrior', count: 3 },
            { type: 'plumed_archer', count: 4 },
            { type: 'eagle_scout', count: 2 },
        ],
    },
    // ── 玛雅 · 城堡时代 · 城堡时代玛雅潘军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程为主
    //    描述正文（主人原文，一字未改）：（玛雅潘、图卢姆；图卢姆临加勒比海悬崖石砌防卫城墙、玛雅潘重叠灰泥护墙石阶祭台；锋利黑曜石木刀、轻韧编织硬藤盾、环城石垒防守与海滨悬崖居高临下投射大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_cusiyupanqui　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代玛雅潘军团', civ: '玛雅', age: 'castle', deStyle: 'MESO', region: 'MAYANS' as RegionType,
        buildingStyle: 'MAYANS',
        castleId: 'MAYA_CASTLE_AGE3', castleName: '玛雅 奇琴伊察阶梯神庙堡',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_pacalii',
        slots: [
            { type: 'jaguar_warrior', count: 3 },
            { type: 'elite_plumed_archer', count: 4 },
            { type: 'eagle_warrior', count: 2 },
        ],
    },
    // ── 玛雅 · 帝国时代 · 帝国时代玛雅军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：远程（步弓）、步兵为主
    //    描述正文（主人原文，一字未改）：（佩滕伊察、塔亚萨尔；佩滕伊察湖心岛条石木桩防御堡垒、热带雨林外围多重壕沟倒刺木寨；淬毒骨镞复合硬木大弓、长柄锋锐黑曜石割刀、大航海早期佩滕密林湖泊阻击殖民远征军游击铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_cusiyupanqui　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代玛雅军团', civ: '玛雅', age: 'imperial', deStyle: 'MESO', region: 'MAYANS' as RegionType,
        buildingStyle: 'MAYANS',
        castleId: 'MAYA_CASTLE_AGE3', castleName: '玛雅 奇琴伊察阶梯神庙堡',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_cusiyupanqui',
        slots: [
            { type: 'jaguar_warrior', count: 3 },
            { type: 'plumed_archer', count: 4 },
            { type: 'elite_eagle_warrior', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 阿兹特克　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 阿兹特克 · 古典时代 · 古典时代特奥蒂瓦坎军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（投枪）为主
    //    描述正文（主人原文，一字未改）：（特奥蒂瓦坎；太阳金字塔巨型玄武岩阶梯大台基、亡灵大道斜面立面（Tablero-Talud）石砌祭坛堡垒；双刃燧石短剑、重型硬木投枪、高原台地密集步兵圆盾冲击大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_arariboiamelee　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代特奥蒂瓦坎军团', civ: '阿兹特克', age: 'antiquity', deStyle: 'MESO', region: 'AMERICA' as RegionType,
        buildingStyle: 'AMERICA',
        castleId: 'MESO_CASTLE_AGE3', castleName: '中美洲/阿兹特克 特诺奇蒂特兰金字塔',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_arariboiamelee',
        slots: [
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'maceman', count: 3 },
            { type: 'antiquity_spearman', count: 2 },
        ],
    },
    // ── 阿兹特克 · 封建时代 · 封建时代托尔特克军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（图拉、乔卢拉；图拉金字塔顶巨型玄武岩武士石柱雕像、羽蛇神浮雕石砌护垣；带刃黑曜石月牙弯曲曲棍、单手圆木漆盾、崇尚生俘之强袭突击步战大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_arariboiamelee　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代托尔特克军团', civ: '阿兹特克', age: 'feudal', deStyle: 'MESO', region: 'AMERICA' as RegionType,
        buildingStyle: 'AMERICA',
        castleId: 'MESO_CASTLE_AGE3', castleName: '中美洲/阿兹特克 特诺奇蒂特兰金字塔',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_itzcoatl',
        slots: [
            { type: 'jaguar_warrior', count: 4 },
            { type: 'eagle_warrior', count: 3 },
            { type: 'eagle_scout', count: 2 },
        ],
    },
    // ── 阿兹特克 · 城堡时代 · 城堡时代阿兹特克军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：重步兵、远程（掷矛器）为主
    //    描述正文（主人原文，一字未改）：（特诺奇蒂特兰、特斯科科；特诺奇蒂特兰大神庙双神平顶多层金字塔、特拉特洛尔科石台集市防卫台垒；硬木镶嵌黑曜石锯剑（Macuahuitl）、鹰武士与美洲虎武士豹皮头盔、羽蛇神坛精锐掷矛手与狂暴步兵突击大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_arariboiamelee　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 阿兹特克 · 帝国时代 · 帝国时代特诺奇军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（特诺奇蒂特兰、特斯科科；特斯科科湖防波石堤巨型水闸要塞、特诺奇蒂特兰断桥湖泊防御石垒；两指浸盐致密防箭棉甲（Ichcahuipilli）、重型黑曜石刺枪、大航海早期特诺奇蒂特兰保卫战湖堤绝命阻击反攻大阵）
    //    英雄队（第 10 队·主将队）：hero_cunhambebe / hero_arariboiamelee　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代特诺奇军团', civ: '阿兹特克', age: 'imperial', deStyle: 'MESO', region: 'AMERICA' as RegionType,
        buildingStyle: 'AMERICA',
        castleId: 'MESO_CASTLE_AGE3', castleName: '中美洲/阿兹特克 特诺奇蒂特兰金字塔',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_arariboiamelee',
        slots: [
            { type: 'elite_eagle_warrior', count: 3 },
            { type: 'iroquois_warrior', count: 4 },
            { type: 'xolotl_warrior', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 印加　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 印加 · 古典时代 · 古典时代莫切军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（特鲁希略、西潘；太阳神殿巨型晒制泥砖阶梯金字塔、月亮神殿彩色战俘浮雕台基；青铜战斧、重型硬木圆头刺棍、沿海荒漠冲沟设伏强袭俘获步战大阵）
    //    英雄队（第 10 队·主将队）：hero_cusiyupanqui / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代莫切军团', civ: '印加', age: 'antiquity', deStyle: 'ANDE', region: 'INCA' as RegionType,
        buildingStyle: 'INCA',
        castleId: 'INCA_CASTLE_AGE3', castleName: '印加 库斯科萨克萨瓦曼巨石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_cusiyupanqui',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_pachacuti（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'champi_runner', count: 3 },
            { type: 'champi_scout', count: 2 },
        ],
    },
    // ── 印加 · 封建时代 · 封建时代安第斯军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程（投石索）、步兵为主
    //    描述正文（主人原文，一字未改）：（的的喀喀湖、阿亚库乔；蒂亚瓦纳科太阳门整石雕凿安山岩门框、卡拉萨萨亚巨石列柱石台祭坛；黑曜石短矛、重型投石索（Huaraca）、高海拔寒区台地密集石盾突击大阵）
    //    英雄队（第 10 队·主将队）：hero_cusiyupanqui / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代安第斯军团', civ: '印加', age: 'feudal', deStyle: 'ANDE', region: 'INCA' as RegionType,
        buildingStyle: 'INCA',
        castleId: 'INCA_CASTLE_AGE3', castleName: '印加 库斯科萨克萨瓦曼巨石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_pachacuti',
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'champi_warrior', count: 3 },
            { type: 'champi_runner', count: 2 },
        ],
    },
    // ── 印加 · 城堡时代 · 城堡时代印加军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：重步兵、远程（标枪）为主
    //    描述正文（主人原文，一字未改）：（库斯科、马丘比丘；萨克塞瓦曼多边形百吨巨石无缝咬合城墙、马丘比丘花岗岩悬崖石屋城堡；青铜星芒狼牙棒（Champi）、淬火硬木标枪、安第斯高山皇家石道极速穿插伏击大阵）
    //    英雄队（第 10 队·主将队）：hero_cusiyupanqui / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 印加 · 帝国时代 · 帝国时代塔万廷军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（库斯科、基多；普卡普卡拉红色石垒前哨卫城、因加皮卡石砌皇家防卫驿站；金铜重合金刺锤、美洲驼硬皮抗震长盾、大航海早期四方极盛高山要隘滚石诱敌阻击铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_cusiyupanqui / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代塔万廷军团', civ: '印加', age: 'imperial', deStyle: 'ANDE', region: 'INCA' as RegionType,
        buildingStyle: 'INCA',
        castleId: 'INCA_CASTLE_AGE3', castleName: '印加 库斯科萨克萨瓦曼巨石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_pachacuti',
        // 🔴 [2026-10-16 主人令] 印加城堡兵＝印加枪兵长：普通档进帝国军团 3 档。
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'kamayuk', count: 3 },
            { type: 'elite_champi_warrior', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 穆伊斯卡　四时代二级军团（封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 穆伊斯卡 · 封建时代 · 封建时代波哥大高原军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（投枪）为主
    //    描述正文（主人原文，一字未改）：（波哥大、通哈；早起高原水网防洪梯田基址、圆形硬木立柱黄泥防御聚落；硬木削尖投掷长枪、双刃黑曜石割刀、安第斯湿地泥沼围猎穿插战阵）
    //    英雄队（第 10 队·主将队）：hero_pacanchique / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代波哥大高原军团', civ: '穆伊斯卡', age: 'feudal', deStyle: 'ANDE', region: 'MUISCA' as RegionType,
        buildingStyle: 'MUISCA',
        castleId: 'MUIS_CASTLE_AGE3', castleName: '穆伊斯卡 瓜塔维塔黄金湖石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_pachacuti',
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'swordsman', count: 3 },
            { type: 'champi_runner', count: 2 },
        ],
    },
    // ── 穆伊斯卡 · 城堡时代 · 城堡时代穆伊斯卡军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【高级】｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（波哥大、通哈；瓜塔维塔金湖水上献祭木石台垒、首领圆柱厚草重檐议事大殿；金铜合金（Tumbaga）破甲矛头、重型硬木齿棒、高原峡谷哨卡多重木栅关隘守御大阵）
    //    英雄队（第 10 队·主将队）：hero_pacanchique / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 穆伊斯卡 · 帝国时代 · 帝国时代格查武士军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：远程（掷矛器）、重步兵为主
    //    描述正文（主人原文，一字未改）：（波哥大、苏加穆西；苏加穆西太阳神殿巨木圆柱防卫石台、通哈高山深壕硬木尖桩要塞；致密硬木掷矛器、金饰羽毛厚织防箭长袍、大航海早期南美北部高原争霸与险道阻击铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_pacanchique / hero_pachacuti　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代格查武士军团', civ: '穆伊斯卡', age: 'imperial', deStyle: 'ANDE', region: 'MUISCA' as RegionType,
        buildingStyle: 'MUISCA',
        castleId: 'MUIS_CASTLE_AGE3', castleName: '穆伊斯卡 瓜塔维塔黄金湖石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_pacanchique',
        slots: [
            { type: 'guecha_warrior', count: 4 },
            { type: 'temple_guard', count: 3 },
            { type: 'elite_champi_warrior', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 马普切　四时代二级军团（封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 马普切 · 封建时代 · 封建时代比奥比奥军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（比奥比奥河谷、特木科；河流冲积阶地深埋巨木桩柱、原始林间开荒硬木环形围栅要塞；重型硬木削尖长枪、坚韧火山玄武岩手斧、温带雨林泥沼设伏短兵近战大阵）
    //    英雄队（第 10 队·主将队）：hero_galvarino / hero_guacolda / hero_lautaro　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代比奥比奥军团', civ: '马普切', age: 'feudal', deStyle: 'ANDE', region: 'MAPUCHE' as RegionType,
        buildingStyle: 'MAPUCHE',
        castleId: 'MAPU_CASTLE_AGE3', castleName: '马普切 安第斯南麓木石据点',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_guacolda',
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'champi_warrior', count: 3 },
            { type: 'champi_runner', count: 2 },
        ],
    },
    // ── 马普切 · 城堡时代 · 城堡时代马普切军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（阿劳卡尼亚、莫乌莱河；大型家族椭圆形木石茅草大长屋（Ruka）、林海深处多重削尖巨木鹿角拒马栅垒；硬木重型狼牙棒（Macana）、致密羊驼毛织造防箭胸甲、莫乌莱河阻击印加十万大军南侵泥潭伏击大阵）
    //    英雄队（第 10 队·主将队）：hero_galvarino / hero_guacolda / hero_lautaro　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代马普切军团', civ: '马普切', age: 'castle', deStyle: 'ANDE', region: 'MAPUCHE' as RegionType,
        buildingStyle: 'MAPUCHE',
        castleId: 'MAPU_CASTLE_AGE3', castleName: '马普切 安第斯南麓木石据点',
        formationMode: 'balance_yoke',
        shipId: 'CANOE',
        commanderUnit: 'hero_lautaro',
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'bolas_rider', count: 2 },
            { type: 'champi_warrior', count: 3 },
        ],
    },
    // ── 马普切 · 帝国时代 · 帝国时代阿劳卡尼亚军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：长枪步兵、远程（投石索）为主
    //    描述正文（主人原文，一字未改）：（比奥比奥河以南、普兰；马普切高地重叠断木陷马坑要塞、雕刻祖先图腾木柱（Chemamull）神圣议事营寨；五米硬木破甲长枪（Coliche）、高精度骨弹投石索（Huilqui）、大航海早期诱敌深入原始雨林坑杀殖民先锋绝命铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_galvarino / hero_guacolda / hero_lautaro　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代阿劳卡尼亚军团', civ: '马普切', age: 'imperial', deStyle: 'ANDE', region: 'MAPUCHE' as RegionType,
        buildingStyle: 'MAPUCHE',
        castleId: 'MAPU_CASTLE_AGE3', castleName: '马普切 安第斯南麓木石据点',
        formationMode: 'balance_yoke',
        shipId: 'CANOE',
        commanderUnit: 'hero_lautaro',
        // 🔴 [2026-10-16 主人令·撤回] 「帝国无下一时代→落同军团 3 档」是我自造规则，无效。
        //    3 档恢复原状（套索骑兵高级）；科纳勇士基础档改放新建三级军团「帝国时代安第斯游击军团」3 档。
        slots: [
            { type: 'slinger', count: 4 },
            { type: 'elite_bolas_rider', count: 2 },
            { type: 'elite_kona', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 图皮　四时代二级军团（城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 图皮 · 城堡时代 · 城堡时代图皮军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：远程（步弓）、重步兵为主
    //    描述正文（主人原文，一字未改）：（瓜纳巴拉湾、巴伊亚沿海；多家族大型坚木棕榈巨型长屋（Maloca）、多层密排尖刺硬木双重防卫环寨；坚硬巴西红木双刃重剑棒（Ibirapema）、硬木重弓破甲竹箭、大西洋沿海热带雨林伏击突袭大阵）
    //    英雄队（第 10 队·主将队）：hero_arariboiamelee / hero_arariboiaranged / hero_cunhambebe　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 图皮 · 帝国时代 · 帝国时代塔莫约军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：步兵、远程（长弓/吹管）为主
    //    描述正文（主人原文，一字未改）：（里约热内卢海湾、圣保罗沿海；海滨巨木双重围栅防御营寨、丛林深壕倒刺硬木防御关垒；重型硬木破甲战棍、热带淬毒骨刺吹管与硬木大弓、大航海早期雨林密道设伏围歼殖民远征军强袭大阵）
    //    英雄队（第 10 队·主将队）：hero_arariboiamelee / hero_arariboiaranged / hero_cunhambebe　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代塔莫约军团', civ: '图皮', age: 'imperial', deStyle: 'ANDE', region: 'TUPI' as RegionType,
        buildingStyle: 'TUPI',
        castleId: 'TUPI_CASTLE_AGE3', castleName: '图皮 亚马逊雨林木栅重垒',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        commanderUnit: 'hero_arariboiamelee',
        slots: [
            { type: 'ibirapema_warrior', count: 3 },
            { type: 'blackwood_archer', count: 4 },
            { type: 'elite_champi_warrior', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 马格里布　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 马格里布 · 古典时代 · 古典时代迦太基军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：战象、轻骑兵、远程为主
    //    描述正文（主人原文，一字未改）：（迦太基、乌提卡；迦太基双重圆形人造军港石造船坞、布尔萨山六层砂岩干砌防御要塞；伊比利亚精钢短剑（Falcata）、巴利阿里编织投石索、战象前导与努米底亚轻骑兵双翼包抄大阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_sumanguru　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代迦太基军团', civ: '柏柏尔', age: 'antiquity', deStyle: 'AFRI', region: 'BERBER' as RegionType,
        buildingStyle: 'BERBER',
        castleId: 'BERB_CASTLE_AGE3', castleName: '柏柏尔 撒哈拉泥砖防御碉堡',
        formationMode: 'balance_yoke',
        shipId: 'LEVIATHAN',
        commanderUnit: 'hero_aristides',
        slots: [
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'tarantine_cavalry', count: 2 },
            { type: 'antiquity_spearman', count: 3 },
        ],
    },
    // ── 马格里布 · 封建时代 · 封建时代柏柏尔军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻骑兵为主
    //    描述正文（主人原文，一字未改）：（非斯、凯鲁万；非斯卡鲁因石砌拱廊大殿、凯鲁万三层方形条石宣礼塔要塞；轻型硬木长骑枪、细密环扣铁锁甲、跨阿特拉斯山脉狂飙突袭沙漠轻骑大阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_sumanguru　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代柏柏尔军团', civ: '柏柏尔', age: 'feudal', deStyle: 'AFRI', region: 'BERBER' as RegionType,
        buildingStyle: 'BERBER',
        castleId: 'BERB_CASTLE_AGE3', castleName: '柏柏尔 撒哈拉泥砖防御碉堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_tariqibnziyad',
        slots: [
            { type: 'elite_camel_archer', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'camel_heavy', count: 2 },
        ],
    },
    // ── 马格里布 · 城堡时代 · 城堡时代摩尔军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：轻骑兵、步兵为主
    //    描述正文（主人原文，一字未改）：（马拉喀什、拉巴特；库图比亚红砂岩巨型宣礼塔、阿特拉斯山谷多层夯土条石卡斯巴要塞（Kasbah）；大马士革双刃重弯刀、人马轻装皮甲、诱敌深入山地穿插与渡海阻击重装骑士大阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_sumanguru　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代摩尔军团', civ: '柏柏尔', age: 'castle', deStyle: 'AFRI', region: 'BERBER' as RegionType,
        buildingStyle: 'BERBER',
        castleId: 'BERB_CASTLE_AGE3', castleName: '柏柏尔 撒哈拉泥砖防御碉堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_tariqibnziyad',
        slots: [
            { type: 'elite_genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
            { type: 'camel_rider', count: 2 },
        ],
    },
    // ── 马格里布 · 帝国时代 · 帝国时代巴巴里军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（火绳枪）、轻骑兵为主
    //    描述正文（主人原文，一字未改）：（阿尔及尔、突尼斯；阿尔及尔沿海险坡白色层叠卡斯巴石砌卫堡、突尼斯早期海港条石防御门楼；北非精钢破甲马刀（Nimcha）、修长摩尔火绳枪与硬角重弓、大航海早期马格里布骆驼射手与海防要塞步骑铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_tariqibnziyad / hero_sumanguru　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代巴巴里军团', civ: '柏柏尔', age: 'imperial', deStyle: 'AFRI', region: 'BERBER' as RegionType,
        buildingStyle: 'BERBER',
        castleId: 'BERB_CASTLE_AGE3', castleName: '柏柏尔 撒哈拉泥砖防御碉堡',
        formationMode: 'balance_yoke',
        shipId: 'FAST_FIRE_SHIP',
        commanderUnit: 'hero_sumanguru',
        slots: [
            { type: 'royal_janissary', count: 4 },
            { type: 'genitour', count: 2 },
            { type: 'champion', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 萨赫勒　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 萨赫勒 · 古典时代 · 古典时代杰内军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（标枪）为主
    //    描述正文（主人原文，一字未改）：（杰内、迪亚；杰内生土晒砖圆形房屋基址、尼日尔河内三角洲早期冶铁环形石泥要塞；锻铁双刃倒刺长枪、重质硬木刺棒与投掷飞刀、河岸泥沼芦苇丛设伏与轻步突袭大阵）
    //    英雄队（第 10 队·主将队）：hero_sumanguru / hero_sundjata　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代杰内军团', civ: '马里', age: 'antiquity', deStyle: 'AFRI', region: 'MALI' as RegionType,
        buildingStyle: 'AFRICA',
        castleId: 'AFRI_CASTLE_AGE3', castleName: '非洲/马里 杰内大清真寺泥石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'dagnajan_elephant',
        slots: [
            { type: 'antiquity_skirmisher', count: 4 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'antiquity_scout_cavalry', count: 2 },
        ],
    },
    // ── 萨赫勒 · 封建时代 · 封建时代加纳军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（昆比萨利赫、奥达戈斯特；昆比萨利赫双城石砌防御城郭、黄色砂岩国王重装石堡；铁质宽刃刺矛、熟牛皮椭圆大盾、跨撒哈拉黄金商道护卫重装步骑协同大阵）
    //    英雄队（第 10 队·主将队）：hero_sumanguru / hero_sundjata　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代加纳军团', civ: '马里', age: 'feudal', deStyle: 'AFRI', region: 'MALI' as RegionType,
        buildingStyle: 'AFRICA',
        castleId: 'AFRI_CASTLE_AGE3', castleName: '非洲/马里 杰内大清真寺泥石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_sumanguru',
        slots: [
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'sosso_guard', count: 3 },
            { type: 'camel_heavy', count: 2 },
        ],
    },
    // ── 萨赫勒 · 城堡时代 · 城堡时代马里军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：远程（毒弓）、步兵、战象为主
    //    描述正文（主人原文，一字未改）：（廷巴克图、杰内；杰内大清真寺巨型生土夯筑高墙、外露棕榈木横梁（Toron）角楼尖塔；浸毒硬木重弓破甲箭、长刃劈砍重铁剑、横扫热带草原十万步象混编推进大阵）
    //    英雄队（第 10 队·主将队）：hero_sumanguru / hero_sundjata　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 萨赫勒 · 帝国时代 · 帝国时代桑海军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、步兵为主
    //    描述正文（主人原文，一字未改）：（加奥、廷巴克图；加奥阿斯基亚阶梯泥土金字塔陵堡、尼日尔河畔粗木夯土警戒要塞；全套锁甲棉甲具装铁骑、双手破甲长刃马刀与毒箭步弓、大航海早期阿斯基亚皇家重骑横扫西非草原决战大阵）
    //    英雄队（第 10 队·主将队）：hero_sumanguru / hero_sundjata　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代桑海军团', civ: '马里', age: 'imperial', deStyle: 'AFRI', region: 'MALI' as RegionType,
        buildingStyle: 'AFRICA',
        castleId: 'AFRI_CASTLE_AGE3', castleName: '非洲/马里 杰内大清真寺泥石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        commanderUnit: 'hero_sundjata',
        slots: [
            { type: 'skirmisher', count: 4 },
            { type: 'gbeto', count: 3 },
            { type: 'camel_heavy', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 埃塞俄比亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 埃塞俄比亚 · 古典时代 · 古典时代阿克苏姆军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、战象、远程为主
    //    描述正文（主人原文，一字未改）：（阿克苏姆、阿杜利斯；阿克苏姆单体整石雕凿巨型方尖碑台、地下条石国王陵寝干砌王宫基垒；双曲反曲木弓、铁尖倒钩投掷长标、红海海陆两栖重步兵方阵与战象冲击大阵）
    //    英雄队（第 10 队·主将队）：hero_yodit / dagnajan_elephant / hero_gidajan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代阿克苏姆军团', civ: '埃塞俄比亚', age: 'antiquity', deStyle: 'AFRI', region: 'ETHIOPIANS' as RegionType,
        buildingStyle: 'ETHIOPIANS',
        castleId: 'ETHI_CASTLE_AGE3', castleName: '埃塞俄比亚 阿克苏姆巨石柱堡',
        formationMode: 'triangle',
        shipId: 'BIREME',
        commanderUnit: 'dagnajan_elephant',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'shotel_warrior', count: 3 },
            { type: 'bowman', count: 4 },
        ],
    },
    // ── 埃塞俄比亚 · 封建时代 · 封建时代拉利贝拉军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（拉利贝拉、罗哈；拉利贝拉红火山凝灰岩就地向下凿空十字形石教堂、深邃石沟防御地道网；双手破甲长铁矛、生牛皮硬质圆盾、高原悬崖险道深沟设伏阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_yodit / dagnajan_elephant / hero_gidajan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代拉利贝拉军团', civ: '埃塞俄比亚', age: 'feudal', deStyle: 'AFRI', region: 'ETHIOPIANS' as RegionType,
        buildingStyle: 'ETHIOPIANS',
        castleId: 'ETHI_CASTLE_AGE3', castleName: '埃塞俄比亚 阿克苏姆巨石柱堡',
        formationMode: 'echelon',
        shipId: 'FIRE_GALLEY',
        commanderUnit: 'hero_yodit',
        slots: [
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'guardsman', count: 3 },
            { type: 'camel_heavy', count: 2 },
        ],
    },
    // ── 埃塞俄比亚 · 城堡时代 · 城堡时代埃塞俄比亚军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（德布勒达摩、安巴盖申；德布勒达摩悬崖平顶石木猴头梁修道院、安巴山天然绝壁天然石堡；双刃弯月长砍刀（Shotel）、高山铁环锁子甲、高海拔山岳要隘居高临下滚石长矛突刺大阵）
    //    英雄队（第 10 队·主将队）：hero_yodit / dagnajan_elephant / hero_gidajan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代埃塞俄比亚军团', civ: '埃塞俄比亚', age: 'castle', deStyle: 'AFRI', region: 'ETHIOPIANS' as RegionType,
        buildingStyle: 'ETHIOPIANS',
        castleId: 'ETHI_CASTLE_AGE3', castleName: '埃塞俄比亚 阿克苏姆巨石柱堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEY',
        commanderUnit: 'hero_gidajan',
        slots: [
            { type: 'elite_shotel_warrior', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
            { type: 'camel_rider', count: 2 },
        ],
    },
    // ── 埃塞俄比亚 · 帝国时代 · 帝国时代阿姆哈拉军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（塔纳湖、安巴；塔纳湖达加埃斯蒂法诺斯石构水寨修道院、阿姆哈拉高原巨石条木移动王营（Katama）；弯月形反刃破盾弯刀、犀牛皮防穿刺长盾、大航海早期高原要隘阻击阿达尔铁骑与会晤外洋使团防卫铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_yodit / dagnajan_elephant / hero_gidajan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代阿姆哈拉军团', civ: '埃塞俄比亚', age: 'imperial', deStyle: 'AFRI', region: 'ETHIOPIANS' as RegionType,
        buildingStyle: 'ETHIOPIANS',
        castleId: 'ETHI_CASTLE_AGE3', castleName: '埃塞俄比亚 阿克苏姆巨石柱堡',
        formationMode: 'fish_scale',
        shipId: 'GALLEON',
        commanderUnit: 'hero_gidajan',
        slots: [
            { type: 'shotel_warrior', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
            { type: 'camel_raider', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 波斯　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 波斯 · 古典时代 · 古典时代萨珊军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、战象、骑射为主
    //    描述正文（主人原文，一字未改）：（泰西封、伊什塔赫尔；泰西封巨型烧结砖拱券大殿（Taq Kasra）、比沙普尔悬崖浮雕战胜凯旋要塞；人马全套精铁具装重铠甲（Clibanarii）、四米双手重穿甲长枪、双曲角弓快速连射与战象突阵协同大阵）
    //    英雄队（第 10 队·主将队）：hero_shahismail / hero_artaphernes / elite_war_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代萨珊军团', civ: '波斯', age: 'antiquity', deStyle: 'PERSIAN', region: 'SASANIAN' as RegionType,
        buildingStyle: 'SASANIAN',
        castleId: 'PERS_CASTLE_AGE3', castleName: '波斯 萨珊泰西封砖石穹顶堡',
        formationMode: 'echelon',
        shipId: 'BIREME',
        commanderUnit: 'hero_artaphernes',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 elite_war_elephant（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'sparabara', count: 3 },
            { type: 'savar', count: 2 },
        ],
    },
    // ── 波斯 · 封建时代 · 封建时代霍拉桑军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑兵为主
    //    描述正文（主人原文，一字未改）：（尼沙普尔、梅尔夫；梅尔夫土木巨大城堡要塞、早期伊斯兰波斯双柱廊石膏浮雕官邸；大马士革锻铁马刀、细密轻装锁子甲、丝路绿洲重骑穿插阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_shahismail / hero_artaphernes / elite_war_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代霍拉桑军团', civ: '波斯', age: 'feudal', deStyle: 'PERSIAN', region: 'SASANIAN' as RegionType,
        buildingStyle: 'SASANIAN',
        castleId: 'PERS_CASTLE_AGE3', castleName: '波斯 萨珊泰西封砖石穹顶堡',
        formationMode: 'crane_wing',
        shipId: 'GALLEY',
        commanderUnit: 'hero_khosrau',
        // 🔴 [2026-10-16 主人令] 波斯战象：精锐在霍拉桑军团 2 档；普通在伊儿军团 2 档。
        slots: [
            { type: 'elite_war_elephant', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'sparabara', count: 3 },
        ],
    },
    // ── 波斯 · 城堡时代 · 城堡时代伊儿军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（大不里士、苏丹尼耶；苏丹尼耶完者都陵墓巨型八角形双层砖砌圆顶、大不里士泥砖石木防卫城垣；东方铁板鳞甲骑兵、复合角弓高坡抛射、重装骑射手与扎格罗斯山隘阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_shahismail / hero_artaphernes / elite_war_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代伊儿军团', civ: '波斯', age: 'castle', deStyle: 'PERSIAN', region: 'SASANIAN' as RegionType,
        buildingStyle: 'SASANIAN',
        castleId: 'PERS_CASTLE_AGE3', castleName: '波斯 萨珊泰西封砖石穹顶堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_shahking',
        // 🔴 [2026-10-16 主人令] 波斯战象：普通档进伊儿军团 2 档（精锐在霍拉桑军团 2 档）。
        slots: [
            { type: 'khan', count: 3 },
            { type: 'mangudai_elite', count: 4 },
            { type: 'keshik', count: 2 },
        ],
    },
    // ── 波斯 · 帝国时代 · 帝国时代红头军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（大不里士、阿尔达比勒；阿尔达比勒萨非祖祠砖石穹顶圣殿、大不里士早期坚固石垒城堡卫郭；大马士革精锻弧形马刀（Shamshir）、十二棱红头高顶尖盔与护胸铁板、大航海早期查尔迪兰阻击火器与高原决战铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_shahismail / hero_artaphernes / elite_war_elephant　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代红头军团', civ: '波斯', age: 'imperial', deStyle: 'PERSIAN', region: 'SASANIAN' as RegionType,
        buildingStyle: 'SASANIAN',
        castleId: 'PERS_CASTLE_AGE3', castleName: '波斯 萨珊泰西封砖石穹顶堡',
        formationMode: 'fish_scale',
        shipId: 'CANNON_GALLEON',
        commanderUnit: 'hero_shahismail',
        slots: [
            { type: 'elite_guardsman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'qizilbash_warrior', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 法尔斯　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第六批·中美＋安第斯＋非洲＋伊朗）
    // ═══════════════════════════════════════════════════════════════════
    // ── 法尔斯 · 古典时代 · 古典时代阿契美尼德军团（2026-10-20 主人令由「长生军团」改名；长生军是精锐名）──
    //    评级：【精锐】｜核心兵种：步兵、战车、远程为主
    //    描述正文（主人原文，一字未改）：（波斯波利斯、帕萨尔加德；波斯波利斯万国之门双翼牛身石雕、百柱大殿双头公牛柱头与巨石台基；双手青铜双刃短剑（Akinakes）、柳条编织蒙皮轻长盾、万人方阵战车冲阵与密集弓箭遮蔽大阵）
    //    英雄队（第 10 队·主将队）：hero_artaphernes / hero_datis　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代阿契美尼德军团', civ: '阿契美尼德', age: 'antiquity', deStyle: 'PERSIAN', region: 'ACHAEMENIDS' as RegionType,
        buildingStyle: 'PERSIAN',
        castleId: 'PERSIAN_CASTLE_AGE3', castleName: '阿契美尼德 波斯波利斯万国门石台',
        formationMode: 'triangle',
        // 旗舰沿用被替换掉的「古典时代阿契美尼德军团」原值：主人 2026-10-05 令登记的
        // 英雄·阿耳忒弥斯旗舰（萨拉米斯海战波斯一方），UnitAssets 'HERO_ARTEMISIA' 完整 16 向战船。
        shipId: 'HERO_ARTEMISIA',
        commanderUnit: 'hero_tsarkonstantin',
        slots: [
            { type: 'war_chariot', count: 2 },
            { type: 'elite_immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
        ],
    },
    // ── 法尔斯 · 封建时代 · 封建时代德莱木军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（设拉子、伊斯法罕；设拉子波斯湾商贸石桥水郭、设拉子石砌城堡早期内廷台基；双手双头重型铁投枪（Zupin）、硬木彩绘圆盾、山地步战方阵与重装突骑穿插大阵）
    //    英雄队（第 10 队·主将队）：hero_artaphernes / hero_datis　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代德莱木军团', civ: '阿契美尼德', age: 'feudal', deStyle: 'PERSIAN', region: 'ACHAEMENIDS' as RegionType,
        buildingStyle: 'PERSIAN',
        castleId: 'PERSIAN_CASTLE_AGE3', castleName: '阿契美尼德 波斯波利斯万国门石台',
        formationMode: 'triangle',
        shipId: 'GALLEY',
        commanderUnit: 'hero_ismail',
        slots: [
            { type: 'war_elephant', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'elite_immortal_ranged', count: 4 },
        ],
    },
    // ── 法尔斯 · 城堡时代 · 城堡时代法尔斯军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程、重步兵为主
    //    描述正文（主人原文，一字未改）：（设拉子、亚兹德；设拉子古老阿提格大清真寺巨型石刻伊万门、亚兹德高耸排风防卫土石风塔城；精钢反曲复合硬弓、长柄破甲铁战斧、扎格罗斯山脉险隘拒止铁骑大阵）
    //    英雄队（第 10 队·主将队）：hero_artaphernes / hero_datis　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代法尔斯军团', civ: '阿契美尼德', age: 'castle', deStyle: 'PERSIAN', region: 'ACHAEMENIDS' as RegionType,
        buildingStyle: 'PERSIAN',
        castleId: 'PERSIAN_CASTLE_AGE3', castleName: '阿契美尼德 波斯波利斯万国门石台',
        formationMode: 'fish_scale',
        shipId: 'WAR_GALLEY',
        commanderUnit: 'hero_darius',
        slots: [
            { type: 'ghulam', count: 3 },
            { type: 'laminated_bowman', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // ── 法尔斯 · 帝国时代 · 帝国时代赞德军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、远程（火器）为主
    //    描述正文（主人原文，一字未改）：（设拉子、阿巴斯港前哨；设拉子城门坚固条石角楼哨卡、波斯湾早期海岸石砌防卫驿站营寨；乌兹钢冷锻弯刀、精铁护心镜与牛皮重盾、大航海早期波斯火绳枪卫队（Tofangchi）与驼载小炮陆防铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_artaphernes / hero_datis　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代赞德军团', civ: '阿契美尼德', age: 'imperial', deStyle: 'PERSIAN', region: 'ACHAEMENIDS' as RegionType,
        buildingStyle: 'PERSIAN',
        castleId: 'PERSIAN_CASTLE_AGE3', castleName: '阿契美尼德 波斯波利斯万国门石台',
        formationMode: 'echelon',
        shipId: 'GALLEON',
        commanderUnit: 'hero_shahismail',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'champion', count: 3 },
            { type: 'qizilbash_warrior', count: 2 },
        ],
    },


    // ═══════════════════════════════════════════════════════════════════
    // 雅典　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 雅典 · 古典时代 · 古典时代雅典军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：重步兵、远程（轻盾标枪）为主
    //    描述正文（主人原文，一字未改）：（雅典、比雷埃夫斯；雅典卫城帕特农纯大理石多立克列柱神殿、比雷埃夫斯长墙石造防御要塞；多利（Dory）长矛密集重步兵方阵、雅典重装青铜圆盾（Aspis）、伊菲克拉特轻盾投矛兵（Peltast）两翼游击协同大阵）
    //    英雄队（第 10 队·主将队）：hero_aristagoras / hero_aristides / hero_themistocles_hoplite　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 雅典 · 封建时代 · 封建时代阿提卡军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（雅典、达芙妮；雅典卡普尼卡雷亚砖雕十字殿堂、达芙妮山隘条石修道院关防石堡；双手重型穿甲铁矛、坚实小圆铁盾、扼守阿提卡峡谷阻击外敌的高地步战大阵）
    //    英雄队（第 10 队·主将队）：hero_aristagoras / hero_aristides / hero_themistocles_hoplite　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代阿提卡军团', civ: '雅典', age: 'feudal', deStyle: 'GREEK', region: 'ATHENIANS' as RegionType,
        buildingStyle: 'ATHENIANS',
        castleId: 'ATHENIANS_CASTLE_AGE3', castleName: '雅典 卫城多立克柱廊卫堡',
        formationMode: 'fish_scale',
        shipId: 'BIREME',
        commanderUnit: 'hero_aristides',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：雅典将军卫队（普通档）替武装剑士（古典军团那份照旧保留）。
        slots: [
            { type: 'strategos', count: 3 },
            { type: 'cretan_archer', count: 4 },
            { type: 'sacred_band', count: 2 },
        ],
    },
    // ── 雅典 · 城堡时代 · 城堡时代雅典公国军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（雅典卫城、底比斯；雅典卫城山门法兰克巨石高耸要塞角楼、卫城条石方砖防卫石堞；全套欧式重型骑士板条锁甲、双手阔刃破甲重剑、十字军山巅卫城居高临下封锁大阵）
    //    英雄队（第 10 队·主将队）：hero_aristagoras / hero_aristides / hero_themistocles_hoplite　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代雅典公国军团', civ: '雅典', age: 'castle', deStyle: 'GREEK', region: 'ATHENIANS' as RegionType,
        buildingStyle: 'ATHENIANS',
        castleId: 'ATHENIANS_CASTLE_AGE3', castleName: '雅典 卫城多立克柱廊卫堡',
        formationMode: 'fish_scale',
        shipId: 'CATAPULT_SHIP',
        commanderUnit: 'hero_constablerichemont',
        slots: [
            { type: 'serjeant', count: 3 },
            { type: 'genoese_crossbowman', count: 4 },
            { type: 'frankish_paladin', count: 2 },
        ],
    },
    // ── 雅典 · 帝国时代 · 帝国时代希腊轻骑军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：轻骑兵为主
    //    描述正文（主人原文，一字未改）：（雅典、纳夫帕克托斯；雅典卫城早期奥斯曼条石加固防御石堡、科林斯海湾条石海防水寨；双头破甲轻骑枪（Assegai）、希腊单刃弧形马刀、大航海早期纵横爱琴海沿岸高机动袭扰反切大阵）
    //    英雄队（第 10 队·主将队）：hero_aristagoras / hero_aristides / hero_themistocles_hoplite　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代希腊轻骑军团', civ: '雅典', age: 'imperial', deStyle: 'GREEK', region: 'ATHENIANS' as RegionType,
        buildingStyle: 'ATHENIANS',
        castleId: 'ATHENIANS_CASTLE_AGE3', castleName: '雅典 卫城多立克柱廊卫堡',
        formationMode: 'echelon',
        shipId: 'ONAGER_SHIP',
        commanderUnit: 'hero_aristagoras',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'heavy_pikeman', count: 3 },
            { type: 'hussar', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 斯巴达　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 斯巴达 · 古典时代 · 古典时代斯巴达军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（斯巴达、拉科尼亚；欧罗塔斯河畔军国战阵训练石台、列奥尼达斯巨石干砌纪念基坛；精锻铁矛、红色羊毛战袍与青铜全脸盔、绝对服从之希腊重装密集长矛铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_brasidas / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 斯巴达 · 封建时代 · 封建时代拉科尼亚军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（莫讷姆瓦夏、吉雄；莫讷姆瓦夏海上独立巨岩双层海防条石要塞、海崖绝壁拜占庭防御城垣；长柄锋锐铁刺矛、坚韧木质蒙皮重盾、扼守悬崖窄道一夫当关绝壁阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_brasidas / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代拉科尼亚军团', civ: '斯巴达', age: 'feudal', deStyle: 'GREEK', region: 'SPARTANS' as RegionType,
        buildingStyle: 'SPARTANS',
        castleId: 'SPARTANS_CASTLE_AGE3', castleName: '斯巴达 泰格特斯山青石重垒',
        formationMode: 'fish_scale',
        shipId: 'WAR_LEMBOS',
        commanderUnit: 'hero_brasidas',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：斯巴达三百卫士（普通档）当 4 档前排主力（古典军团那份照旧保留）。
        slots: [
            { type: 'hippeus', count: 3 },
            { type: 'cretan_archer', count: 4 },
            { type: 'polemarch', count: 2 },
        ],
    },
    // ── 斯巴达 · 城堡时代 · 城堡时代摩里亚军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：远程、步兵为主
    //    描述正文（主人原文，一字未改）：（米斯特拉斯、斯巴达遗址；米斯特拉斯悬崖巨石宫殿城堡群、巴列奥略晚期红砖拱券防御石寨；东方复合角弓连射、双刃精钢斩马剑、依托泰格特斯险峰要隘设伏歼敌大阵）
    //    英雄队（第 10 队·主将队）：hero_brasidas / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代摩里亚军团', civ: '斯巴达', age: 'castle', deStyle: 'GREEK', region: 'SPARTANS' as RegionType,
        buildingStyle: 'SPARTANS',
        castleId: 'SPARTANS_CASTLE_AGE3', castleName: '斯巴达 泰格特斯山青石重垒',
        formationMode: 'fish_scale',
        shipId: 'HEAVY_LEMBOS',
        commanderUnit: 'hero_lysander',
        slots: [
            { type: 'heavy_pikeman', count: 3 },
            { type: 'crossbowman', count: 4 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    // ── 斯巴达 · 帝国时代 · 帝国时代曼尼军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（莫东、曼尼高地；莫东海崖双重坚固条石海防堡垒、曼尼高地花岗岩家族防御石塔要塞群；双手重型铁枪、希腊阔身反曲短刀、大航海早期曼尼险峰绝壁全民皆兵抗击外敌游击绝命大阵）
    //    英雄队（第 10 队·主将队）：hero_brasidas / hero_lysander　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代曼尼军团', civ: '斯巴达', age: 'imperial', deStyle: 'GREEK', region: 'SPARTANS' as RegionType,
        buildingStyle: 'SPARTANS',
        castleId: 'SPARTANS_CASTLE_AGE3', castleName: '斯巴达 泰格特斯山青石重垒',
        formationMode: 'echelon',
        shipId: 'ELITE_LEMBOS',
        commanderUnit: 'hero_brasidas',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'condottiero', count: 3 },
            { type: 'light_cavalry', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 马其顿　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 马其顿 · 古典时代 · 古典时代马其顿军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：长枪步兵、重骑兵为主
    //    描述正文（主人原文，一字未改）：（佩拉、韦尔吉纳；菲利普二世韦尔吉纳地下壁画石砌王陵、佩拉王宫整石多立克柱廊台基；六米萨里萨（Sarissa）超长枪、伙伴骑兵人马轻甲、步兵方阵砧板与骑兵重锤合围歼灭大阵）
    //    英雄队（第 10 队·主将队）：hero_cleitus / hero_dismounted_alexander / hero_mounted_alexander / hero_macedonian_commander / hero_parmenion / hero_perdiccas　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 马其顿 · 封建时代 · 封建时代拜占庭马其顿军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（塞萨洛尼基、佩拉；圣德米特里奥斯五廊式条石教堂基垒、塞萨洛尼基红砖加固防御古城墙；重型铁锁子甲、锋利单手破甲剑、阻击保加利亚与斯拉夫南下的坚城固守步骑大阵）
    //    英雄队（第 10 队·主将队）：hero_cleitus / hero_dismounted_alexander / hero_mounted_alexander / hero_macedonian_commander / hero_parmenion / hero_perdiccas　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代拜占庭马其顿军团', civ: '马其顿', age: 'feudal', deStyle: 'GREEK', region: 'MACEDONIAN' as RegionType,
        buildingStyle: 'MACEDONIAN',
        castleId: 'MACEDONIAN_CASTLE_AGE3', castleName: '马其顿 佩拉要塞重石堡',
        formationMode: 'echelon',
        shipId: 'ANT_GALLEY',
        commanderUnit: 'hero_parmenion',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：马其顿伙伴骑兵（普通档）替城堡档的骑士。
        slots: [
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'phalangite', count: 3 },
            { type: 'companion_cavalry', count: 2 },
        ],
    },
    // ── 马其顿 · 城堡时代 · 城堡时代瓦尔达尔军团（Vardar Legion）　（2026-10-18 主人改名/重写）──
    //    评级：【高级】｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（塞萨洛尼基、斯科皮亚；瓦尔达尔河河口巨石防御石砦、马其顿峡谷咽喉险要关卡哨楼；精锻破甲铁矛、复合角弓与扎甲胸甲、扼守南北交通大动脉要隘节节阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_cleitus / hero_dismounted_alexander / hero_mounted_alexander / hero_macedonian_commander / hero_parmenion / hero_perdiccas　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代瓦尔达尔军团', civ: '马其顿', age: 'castle', deStyle: 'GREEK', region: 'MACEDONIAN' as RegionType,
        buildingStyle: 'MACEDONIAN',
        castleId: 'MACEDONIAN_CASTLE_AGE3', castleName: '马其顿 瓦尔达尔河河口巨石石砦',
        formationMode: 'fish_scale',
        shipId: 'ANT_WAR_GALLEY',
        commanderUnit: 'hero_perdiccas',
        slots: [
            { type: 'heavy_pikeman', count: 4 },
            { type: 'cataphract', count: 3 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // ── 马其顿 · 帝国时代 · 帝国时代马其顿军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程、骑兵为主
    //    描述正文（主人原文，一字未改）：（塞萨洛尼基、卡瓦拉；塞萨洛尼基七塔要塞（Heptapyrgion）内层厚重石壁碉堡、早期卡瓦拉海港条石关卡；复合反曲硬木弓、大马士革弧形马刀、大航海早期扼守爱琴海北岸海陆要冲城塞大阵）
    //    英雄队（第 10 队·主将队）：hero_cleitus / hero_dismounted_alexander / hero_mounted_alexander / hero_macedonian_commander / hero_parmenion / hero_perdiccas　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代马其顿军团', civ: '马其顿', age: 'imperial', deStyle: 'GREEK', region: 'MACEDONIAN' as RegionType,
        buildingStyle: 'MACEDONIAN',
        castleId: 'MACEDONIAN_CASTLE_AGE3', castleName: '马其顿 佩拉要塞重石堡',
        formationMode: 'echelon',
        shipId: 'ANT_ELITE_GALLEY',
        commanderUnit: 'hero_cleitus',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'halberdier', count: 3 },
            { type: 'cavalier', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 色雷斯　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 色雷斯 · 古典时代 · 古典时代色雷斯军团　（同名已在二级（重复→替换保留））────────────────
    //    评级：【精锐】｜核心兵种：轻步兵、远程（标枪）为主
    //    描述正文（主人原文，一字未改）：（塞夫托波利斯、卡赞勒克；卡赞勒克蜂窝状假拱巨石墓室、塞夫托波利斯石木环城防卫要塞；色雷斯双刃长柄弧形斩剑（Rhomphaia）、月牙形轻质皮盾（Pelte）、高机动多重标枪投掷与山林设伏穿插大阵）
    //    英雄队（第 10 队·主将队）：hero_thracian_chieftain / hero_cleitus　— 按 248 主将表取，不进三排兵种编制
    //    ↑ 该名已在二级表，编制一字未动（见本表原条目）。
    // ── 色雷斯 · 封建时代 · 封建时代阿德里安堡军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（阿德里安堡、普罗夫迪夫；阿德里安堡双重马蹄砖石城堞防线、马里查河要冲石砌关卡哨堡；重装双刃破甲阔剑、生铁锁子胸甲、扼守博斯普鲁斯西北咽喉坚壁清野步骑大阵）
    //    英雄队（第 10 队·主将队）：hero_thracian_chieftain / hero_cleitus　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代阿德里安堡军团', civ: '色雷斯', age: 'feudal', deStyle: 'THRACIAN', region: 'THRACIAN' as RegionType,
        buildingStyle: 'THRACIAN',
        castleId: 'THRACIAN_CASTLE_AGE3', castleName: '色雷斯 罗多彼山蛮族巨石堡',
        formationMode: 'echelon',
        shipId: 'LEMBOS',
        commanderUnit: 'hero_thracian_chieftain',
        // 🔴 [2026-10-16 主人令] 城堡兵普通档进同文化封建军团：色雷斯长刃斩手（普通档）替城堡档的双手剑士。
        slots: [
            { type: 'elite_peltast', count: 4 },
            { type: 'rhomphaia_warrior', count: 3 },
            { type: 'thracian_peltast', count: 2 },
        ],
    },
    // ── 色雷斯 · 城堡时代 · 城堡时代罗多彼军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：远程、重步兵为主
    //    描述正文（主人原文，一字未改）：（阿塞诺夫格勒、梅尔尼克；阿森要塞悬崖条石双层城堡教堂、罗多彼山脉险峰花岗岩关防石寨；反曲硬木重复合弓、双手长柄铁战斧、依托喀斯特断崖绝壁滚石阻击与隘口伏击大阵）
    //    英雄队（第 10 队·主将队）：hero_thracian_chieftain / hero_cleitus　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代罗多彼军团', civ: '色雷斯', age: 'castle', deStyle: 'THRACIAN', region: 'THRACIAN' as RegionType,
        buildingStyle: 'THRACIAN',
        castleId: 'THRACIAN_CASTLE_AGE3', castleName: '色雷斯 罗多彼山蛮族巨石堡',
        formationMode: 'fish_scale',
        shipId: 'WAR_LEMBOS',
        commanderUnit: 'hero_ivaylo',
        slots: [
            { type: 'varangian_guard', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'imperial_cavalry', count: 2 },
        ],
    },
    // ── 色雷斯 · 帝国时代 · 帝国时代鲁米利亚军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、战车（车垒）为主
    //    描述正文（主人原文，一字未改）：（埃迪尔内、季莫蒂卡；巴耶济德二世库里耶石砌圆顶建筑群、马里查河畔早期条石防御大营；大马士革钢重型弯刀（Kilij）、锥顶精铁护颈盔与锁子胸甲、大航海早期巴尔干大军集结与重骑锁链车垒推进大阵）
    //    英雄队（第 10 队·主将队）：hero_thracian_chieftain / hero_cleitus　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代鲁米利亚军团', civ: '色雷斯', age: 'imperial', deStyle: 'THRACIAN', region: 'THRACIAN' as RegionType,
        buildingStyle: 'THRACIAN',
        castleId: 'THRACIAN_CASTLE_AGE3', castleName: '色雷斯 罗多彼山蛮族巨石堡',
        formationMode: 'balance_yoke',
        shipId: 'GALLEON',
        commanderUnit: 'hero_thracian_chieftain',
        slots: [
            { type: 'janissary', count: 4 },
            { type: 'cav_archer_heavy', count: 2 },
            { type: 'halberdier', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 吐蕃　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 吐蕃 · 古典时代 · 古典时代象雄军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程为主
    //    描述正文（主人原文，一字未改）：（阿里达巴、穹窿银城；卡尔东高耸泥石窑洞悬崖山寨、象雄黑白条石祭坛垒台；双曲硬木短弓、冷锻倒刺铁矛、高寒山巅悬崖堡寨居高临下滚石檑木阻击大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_guanyu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代象雄军团', civ: '青藏', age: 'antiquity', deStyle: 'PURU', region: 'TIBET' as RegionType,
        buildingStyle: 'TIBET',
        castleId: 'TIBET_CASTLE_AGE3', castleName: '吐蕃 藏式金顶宗堡',
        formationMode: 'crescent',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_lubu',
        slots: [
            { type: 'antiquity_spearman', count: 3 },
            { type: 'antiquity_cavalry_archer', count: 2 },
            { type: 'bowman', count: 4 },
        ],
    },
    // ── 吐蕃 · 封建时代 · 封建时代吐蕃军团　（三级升二级）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、重步兵为主
    //    描述正文（主人原文，一字未改）：（拉萨、山南；雍布拉康第一石木防御碉楼、大昭寺早期梁架法殿与藏王梯形方土陵台；吐蕃百炼冷锻铁叶连缀锁子甲、双手破甲长藏刀、高原铁甲骑兵“桂”与战阵重装步兵长矛大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_guanyu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代吐蕃军团', civ: '青藏', age: 'feudal', deStyle: 'PURU', region: 'TIBET' as RegionType,
        buildingStyle: 'TIBET',
        castleId: 'TIBET_CASTLE_AGE3', castleName: '吐蕃 藏式金顶宗堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_subotai',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'hei_kuang', count: 2 },
        ],
    },
    // ── 吐蕃 · 城堡时代 · 城堡时代萨迦军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：远程（步弓）、步兵为主
    //    描述正文（主人原文，一字未改）：（萨迦、江孜；萨迦南寺极其厚重深灰红白土石城堡护墙、江孜宗山山崖条石防御宗堡；复合角弓密集斜向抛射、生铁护胸圆牌、扼守高山峡谷宗堡天险深壕守御大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_guanyu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代萨迦军团', civ: '青藏', age: 'castle', deStyle: 'PURU', region: 'TIBET_CASTLE' as RegionType,
        buildingStyle: 'TIBET',
        castleId: 'TIBET_CASTLE_AGE3', castleName: '吐蕃 藏式金顶宗堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_genghiskhan',
        slots: [
            { type: 'liao_dao', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'keshik', count: 2 },
        ],
    },
    // ── 吐蕃 · 帝国时代 · 帝国时代卫藏军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵为主
    //    描述正文（主人原文，一字未改）：（仁蚌、乃东；仁蚌宗险峻山脊石砌高耸防御宗垒、乃东早期厚石城堞卫所；精钢环首宽刃藏刀、生牛皮硬质防矢圆盾、大航海早期卫藏高原诸部宗堡拉锯伏击铁壁大阵）
    //    英雄队（第 10 队·主将队）：hero_prithviraj / hero_guanyu　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代卫藏军团', civ: '青藏', age: 'imperial', deStyle: 'PURU', region: 'TIBET_IMPERIAL' as RegionType,
        buildingStyle: 'TIBET',
        castleId: 'TIBET_CASTLE_AGE3', castleName: '吐蕃 藏式金顶宗堡',
        formationMode: 'echelon',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_subotai',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'liao_dao', count: 3 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 西域　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 西域 · 古典时代 · 古典时代西域军团（原「塞种军团」，2026-10-20 主人令改地区／行政泛称）──
    //    评级：（未标评级）｜核心兵种：骑射、轻骑兵为主
    //    描述正文（主人原文，一字未改）：（交河、龟兹；交河台地天然悬崖生土削壁城垣、克孜尔千佛洞早期崖壁石窟防卫营址；塞种反曲双曲角弓、锋锐双刃青铜短剑、人马轻装铁鳞甲与沙漠边缘高机动迂回穿插大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代西域军团', civ: '西域', age: 'antiquity', deStyle: 'CEAS', region: 'WESTERN' as RegionType,
        buildingStyle: 'WESTERN',
        castleId: 'WESTERN_CASTLE_AGE3', castleName: '西域 汉伊高台绿洲要塞',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'scythian_scout',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_kotyankhan（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'sakan_axeman', count: 3 },
            { type: 'elite_scythian_horse_archer', count: 4 },
            { type: 'scythian_axe_cavalry', count: 2 },
        ],
    },
    // ── 西域 · 封建时代 · 封建时代安西军团（原「回鹘军团」，2026-10-20 主人令改地区／行政泛称）──
    //    评级：【高级】｜核心兵种：骑兵为主
    //    描述正文（主人原文，一字未改）：（高昌故城、柏孜克里克；高昌大佛寺厚重夯土外墙与高耸塔台要塞、交河早期砖木关防堡垒；大马士革锻铁弯刀、细密轻型锁子甲、丝路天山南麓绿洲深壕据守与突骑反切大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代安西军团', civ: '西域', age: 'feudal', deStyle: 'CEAS', region: 'WESTERN_FEUDAL' as RegionType,
        buildingStyle: 'WESTERN',
        castleId: 'WESTERN_CASTLE_AGE3', castleName: '西域 汉伊高台绿洲要塞',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_wangtong',
        slots: [
            { type: 'liao_dao', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    // ── 西域 · 城堡时代 · 城堡时代察合台军团　（三级升二级）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（阿力麻里、喀什噶尔；阿力麻里秃黑鲁帖木儿汗麻扎单跨尖拱砖砌门楼、伊犁河谷砖石防御驻营；东方铁板鳞甲骑兵、超强反曲角弓重镝箭、天山南北纵深长驱奔袭合围大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代察合台军团', civ: '西域', age: 'castle', deStyle: 'CEAS', region: 'WESTERN_CASTLE' as RegionType,
        buildingStyle: 'WESTERN',
        castleId: 'WESTERN_CASTLE_AGE3', castleName: '西域 汉伊高台绿洲要塞',
        formationMode: 'crescent',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_tokhtamyshkhan',
        slots: [
            { type: 'hill_tribesman', count: 3 },
            { type: 'kipchak', count: 2 },
            { type: 'recurve_bowman', count: 4 },
        ],
    },
    // ── 西域 · 帝国时代 · 帝国时代叶尔羌军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（莎车、喀什噶尔；莎车早期泥砖护城高台城堡、喀什噶尔古老夯土重垒防御城郭；乌兹钢弧形斩马刀、中亚皮铁复合护胸板、大航海早期扼守塔里木绿洲抵御北方法外游骑围城血战大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代叶尔羌军团', civ: '西域', age: 'imperial', deStyle: 'CEAS', region: 'WESTERN_IMPERIAL' as RegionType,
        buildingStyle: 'WESTERN',
        castleId: 'WESTERN_CASTLE_AGE3', castleName: '西域 汉伊高台绿洲要塞',
        formationMode: 'echelon',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_qutlugh',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'eastern_swordsman', count: 3 },
            { type: 'elite_keshik', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 漠南　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 漠南 · 古典时代 · 古典时代鲜卑军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑射为主
    //    描述正文（主人原文，一字未改）：（盛乐、平城；盛乐厚重夯土环形城垣、阴山山口条石防御营卡；鲜卑反曲硬木复合弓、双刃精铁短矛、鸣镝长程骑射骚扰与高机动马群迂回大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代鲜卑军团', civ: '漠南鲜卑', age: 'antiquity', deStyle: 'ASIA', region: 'XIANBEI' as RegionType,
        buildingStyle: 'XIANBEI',
        castleId: 'MONG_CASTLE_AGE3', castleName: '漠南 塞外王帐石堡',
        formationMode: 'crescent',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_caocao',   // 🔴 [2026-10-19 主人令「古典军团的必须套用古典时代的英雄和精英兵」] 原 hero_kotyankhan（主将队须为古典时代的英雄或精英兵）
        slots: [
            { type: 'antiquity_light_cavalry', count: 3 },
            { type: 'xianbei_raider', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 4 },
        ],
    },
    // ── 漠南 · 封建时代 · 封建时代契丹军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重骑兵为主
    //    描述正文（主人原文，一字未改）：（上京临潢府、中京大定府；临潢府汉城皇城双重石土城堞、巴林左旗舍利八角密檐实心砖塔；人马具装“铁林”全套铁铠、冷锻长刺矛与重型骨朵、诱敌深入长途包抄骑兵大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代契丹军团', civ: '漠南鲜卑', age: 'feudal', deStyle: 'ASIA', region: 'XIANBEI' as RegionType,
        buildingStyle: 'XIANBEI',
        castleId: 'MONG_CASTLE_AGE3', castleName: '漠南 塞外王帐石堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_subotai',
        slots: [
            { type: 'xianbei_raider', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    // ── 漠南 · 城堡时代 · 城堡时代漠南蒙古军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：骑射、战车（车垒）为主
    //    描述正文（主人原文，一字未改）：（应昌、开平；开平卫城残存方石台基城垣、达里诺尔湖畔石木深壕野战寨堡；重型反曲角弓抛射、大马士革锋刃长柄弯刀、草原残部背水结车垒阻击突击大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代漠南蒙古军团', civ: '漠南鲜卑', age: 'castle', deStyle: 'ASIA', region: 'XIANBEI' as RegionType,
        buildingStyle: 'XIANBEI',
        castleId: 'MONG_CASTLE_AGE3', castleName: '漠南 塞外王帐石堡',
        formationMode: 'fish_scale',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_kotyankhan',
        slots: [
            { type: 'khan', count: 3 },
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai_elite', count: 2 },
        ],
    },
    // ── 漠南 · 帝国时代 · 帝国时代察哈尔军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（达里诺尔、土默川；阴山古道土石扼守关垒、达延汗移动汗帐木石护卫营台；精钢柳叶鳞甲骑兵、破甲骨镞强弓、大航海早期六万户平原大会战与应州铁骑包合大阵）
    //    英雄队（第 10 队·主将队）：hero_kotyankhan / hero_kushluk　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代察哈尔军团', civ: '漠南鲜卑', age: 'imperial', deStyle: 'ASIA', region: 'XIANBEI' as RegionType,
        buildingStyle: 'XIANBEI',
        castleId: 'MONG_CASTLE_AGE3', castleName: '漠南 塞外王帐石堡',
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        commanderUnit: 'hero_kushluk',
        slots: [
            { type: 'elite_steppe_lancer', count: 2 },
            { type: 'iron_pagoda', count: 3 },
            { type: 'mangudai', count: 4 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 爱奥尼亚　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立（第七批·希腊＋色雷斯＋三级自建风格）
    // ═══════════════════════════════════════════════════════════════════
    // ── 爱奥尼亚 · 古典时代 · 古典时代爱奥尼亚军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、骑兵为主
    //    描述正文（主人原文，一字未改）：（以弗所、米利都；以弗所阿耳忒弥斯巨石多列爱奥尼亚柱式神殿、米利都石构滨海要塞城池；希腊双手破甲长枪（Dory）、青铜覆面全脸盔与重圆盾、融合吕底亚风格的爱奥尼亚精锐贵族骑兵侧翼包抄大阵）
    //    英雄队（第 10 队·主将队）：—　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代爱奥尼亚军团', civ: '希腊', age: 'antiquity', deStyle: 'GREEK', region: 'GREECE' as RegionType,
        buildingStyle: 'GREECE',
        castleId: 'GREEK_CASTLE_AGE3', castleName: '爱奥尼亚 希腊古典通用要塞',
        formationMode: 'fish_scale',
        shipId: 'LEMBOS',
        commanderUnit: 'hero_aristagoras',
        slots: [
            { type: 'ekdromos', count: 3 },
            { type: 'cretan_archer', count: 4 },
            { type: 'elite_hoplite', count: 2 },
        ],
    },
    // ── 爱奥尼亚 · 封建时代 · 封建时代爱琴军区军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、远程（喷火器）为主
    //    描述正文（主人原文，一字未改）：（士麦那、希俄斯；希俄斯新修道院八角石殿堡垒、士麦那沿海条石防御要塞哨台；轻型铁环锁子甲、双手单刃劈刺剑、手持铜管便携式希腊火喷射器（Cheirosiphona）的守城破阵步兵大阵）
    //    英雄队（第 10 队·主将队）：—　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代爱琴军区军团', civ: '希腊', age: 'feudal', deStyle: 'GREEK', region: 'GREECE' as RegionType,
        buildingStyle: 'GREECE',
        castleId: 'GREEK_CASTLE_AGE3', castleName: '爱奥尼亚 希腊古典通用要塞',
        formationMode: 'fish_scale',
        shipId: 'DROMON',
        commanderUnit: 'hero_themistocles_hoplite',
        slots: [
            { type: 'hoplite', count: 3 },
            { type: 'gastraphetes', count: 4 },
            { type: 'greek_noble_cavalry', count: 2 },   // 🔴 [2026-10-19 主人令「DE 里没有、兵模还重复的，删除」] 原 elite_greek_cavalry（与希腊贵族骑兵同一 DE 单位、同一兵模）
        ],
    },
    // ── 爱奥尼亚 · 城堡时代 · 城堡时代士麦那军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵为主
    //    描述正文（主人原文，一字未改）：（士麦那、福恰；士麦那卡迪费卡莱悬崖花岗岩古堡、圣约翰十字军海防双层条石要塞；欧洲十字军板条胸甲、双手阔刃重破甲剑、依托海崖石堡抵御突厥轻骑围攻大阵）
    //    英雄队（第 10 队·主将队）：—　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代士麦那军团', civ: '希腊', age: 'castle', deStyle: 'GREEK', region: 'GREECE' as RegionType,
        buildingStyle: 'GREECE',
        castleId: 'GREEK_CASTLE_AGE3', castleName: '爱奥尼亚 希腊古典通用要塞',
        formationMode: 'fish_scale',
        shipId: 'FIRE_SHIP',
        commanderUnit: 'hero_aristides',
        slots: [
            { type: 'hoplite', count: 3 },
            { type: 'gastraphetes', count: 4 },
            { type: 'greek_noble_cavalry', count: 2 },
        ],
    },
    // ── 爱奥尼亚 · 帝国时代 · 帝国时代爱琴要塞军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、远程（火炮/复合弓）为主
    //    描述正文（主人原文，一字未改）：（切什梅、伊兹密尔；切什梅滨海厚重条石防御城堡、士麦那内港条石角楼海防要塞；大马士革钢弯刀、反曲硬角复合弓与棱堡岸防重炮、大航海早期扼守小亚细亚西岸海峡城堡陆防铁壁大阵）
    //    英雄队（第 10 队·主将队）：—　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代爱琴要塞军团', civ: '希腊', age: 'imperial', deStyle: 'GREEK', region: 'GREECE' as RegionType,
        buildingStyle: 'GREECE',
        castleId: 'GREEK_CASTLE_AGE3', castleName: '爱奥尼亚 希腊古典通用要塞',
        formationMode: 'echelon',
        shipId: 'FAST_FIRE_SHIP',
        commanderUnit: 'hero_macedonian_commander',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'heavy_pikeman', count: 3 },
            { type: 'cavalier', count: 2 },
        ],
    },

];

export const LEVEL_2_CIV_62_NAMES: Set<string> = new Set(LEVEL_2_CIV_62_LEGIONS.map(l => l.name));
export const LEVEL_2_CIV_62_MAP: Map<string, Level2CivLegionDef> = new Map(
    LEVEL_2_CIV_62_LEGIONS.map(l => [l.name, l])
);

export const LEVEL_2_CIV_CIV_MAP: Map<string, Level2CivLegionDef> = new Map(
    LEVEL_2_CIV_62_LEGIONS.map(l => [l.civ, l])
);
// 兼容突厥/土耳其别名
// 🔴 [2026-10-16 修 bug] 原 `find(l => l.civ === '奥斯曼')` 取该文明**第一条**——
//    新矩阵下一个文明有 4 条（古典赫梯战车/封建突厥骑射/城堡加齐突骑/帝国土耳其），
//    于是 `LEVEL_2_CIV_62_MAP.set('帝国时代土耳其军团', ottomanLegion)` 把**真条目**覆盖成了「赫梯战车军团」。
//    现改为按军团名取真条目，并删掉那条会覆盖真名的 set。
const ottomanLegion = LEVEL_2_CIV_62_LEGIONS.find(l => l.name === '帝国时代土耳其军团');
if (ottomanLegion) {
    LEVEL_2_CIV_CIV_MAP.set('突厥', ottomanLegion);
    LEVEL_2_CIV_CIV_MAP.set('土耳其', ottomanLegion);
    LEVEL_2_CIV_62_MAP.set('帝国时代突厥军团', ottomanLegion);   // 旧简写别名，指向同一条真条目
}
// 兼容高丽/朝鲜别名
// 🔴 [2026-10-16 同类隐患] 原 `find(l => l.civ === '高丽')` 同样会取到该文明第一条（古典高句丽军团）；
//    改为按真实条目名取「城堡时代高丽军团」（朝鲜文明的城堡节点）。
const goryeoLegion = LEVEL_2_CIV_62_LEGIONS.find(l => l.name === '城堡时代高丽军团')
    ?? LEVEL_2_CIV_62_LEGIONS.find(l => l.civ === '高丽');
if (goryeoLegion) {
    LEVEL_2_CIV_CIV_MAP.set('朝鲜', goryeoLegion);
    LEVEL_2_CIV_62_MAP.set('城堡时代朝鲜军团', goryeoLegion);
}
// 兼容简写别名（如不含“时代”二字的旧名）
LEVEL_2_CIV_62_MAP.set('古典华夏中原军团', LEVEL_2_CIV_62_MAP.get('古典时代秦汉军团')!);
LEVEL_2_CIV_62_MAP.set('古典华夏巴蜀军团', LEVEL_2_CIV_62_MAP.get('古典时代巴蜀军团')!);
LEVEL_2_CIV_62_MAP.set('古典华夏江南军团', LEVEL_2_CIV_62_MAP.get('古典时代吴越军团')!);
LEVEL_2_CIV_62_MAP.set('古典华夏河朔军团', LEVEL_2_CIV_62_MAP.get('古典时代魏晋军团')!);

/**
 * 军团名是否属于「**二级：文明 × 时代（62 文明专属军团）**」——
 * 严格只收录主人定稿的 62 个二级军团名（其余全部归入三级自建军团）。
 */
export function isCivEraLegion(name: string): boolean {
    return LEVEL_2_CIV_62_NAMES.has(name);
}
