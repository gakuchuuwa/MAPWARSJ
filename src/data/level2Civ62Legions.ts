/**
 * 🔴 [2026-09-14 主人定 / 2026-10-16 校正计数] 二级＝「文明 × 时代」层。
 * 实测（本表逐条统计，2026-10-16 删旧名后）：古典时代 18 支 + 封建时代 23 支 + 城堡时代 35 支 + 帝国时代 13 支 = **89** 支。
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
}

export const LEVEL_2_CIV_62_LEGIONS: Level2CivLegionDef[] = [
    {
        name: '古典时代凯尔特军团', civ: '凯尔特', age: 'antiquity', deStyle: 'WEST', region: 'CELTS' as RegionType,
        buildingStyle: 'CELTS',
        castleId: 'CELT_CASTLE_AGE3', castleName: '凯尔特 苏格兰高地圆塔',
        formationMode: 'balance_yoke',
        shipId: 'MONOREME',
        slots: [
            { type: 'elite_woad_raider', count: 4 },
            { type: 'woad_raider', count: 2 },
            { type: 'longbowman', count: 3 },
        ],
    },
    {
        name: '古典时代孟加拉军团', civ: '孟加拉', age: 'antiquity', deStyle: 'INDI', region: 'BENGALIS' as RegionType,
        buildingStyle: 'BENGALIS',
        castleId: 'BENG_CASTLE_AGE3', castleName: '孟加拉 恒河三角洲砖石堡',
        formationMode: 'fish_scale',
        shipId: 'ANT_ELITE_GALLEY',
        slots: [
            { type: 'indian_tribesman', count: 3 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
            { type: 'elite_ratha_ranged', count: 2 },
        ],
    },
    {
        name: '古典时代罗马军团', civ: '罗马', age: 'antiquity', deStyle: 'MEDI', region: 'ROMA' as RegionType,
        buildingStyle: 'ROMA',
        castleId: 'ROMA_CASTLE_AGE3', castleName: '罗马 帝国古典方石要塞',
        formationMode: 'balance_yoke',
        shipId: 'TRIREME',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'paragon', count: 2 },
            { type: 'elite_centurion', count: 3 },
        ],
    },
    {
        name: '古典时代阿契美尼德军团', civ: '阿契美尼德', age: 'antiquity', deStyle: 'PERSIAN', region: 'ACHAEMENIDS' as RegionType,
        buildingStyle: 'PERSIAN',
        castleId: 'ACHA_CASTLE_AGE3', castleName: '阿契美尼德 波斯波利斯万国门石台',
        formationMode: 'crane_wing',
        shipId: 'HERO_ARTEMISIA',
        slots: [
            { type: 'war_chariot', count: 2 },
            { type: 'immortal', count: 4 },
            { type: 'elite_immortal_ranged', count: 3 },
        ],
    },
    {
        name: '古典时代雅典军团', civ: '雅典', age: 'antiquity', deStyle: 'GREEK', region: 'ATHENIANS' as RegionType,
        buildingStyle: 'ATHENIANS',
        castleId: 'ATHE_CASTLE_AGE3', castleName: '雅典 卫城多立克柱廊卫堡',
        formationMode: 'echelon',
        shipId: 'TRIREME',
        slots: [
            { type: 'elite_strategos', count: 4 },
            { type: 'strategos', count: 3 },
            { type: 'elite_greek_cavalry', count: 2 },
        ],
    },
    {
        name: '古典时代斯巴达军团', civ: '斯巴达', age: 'antiquity', deStyle: 'GREEK', region: 'SPARTANS' as RegionType,
        buildingStyle: 'SPARTANS',
        castleId: 'SPAR_CASTLE_AGE3', castleName: '斯巴达 泰格特斯山青石重垒',
        formationMode: 'echelon',
        shipId: 'HERO_AEGINETAN',
        slots: [
            { type: 'elite_hippeus', count: 4 },
            { type: 'hippeus', count: 3 },
            { type: 'mercenary_hoplite', count: 2 },
        ],
    },
    {
        name: '古典时代马其顿军团', civ: '马其顿', age: 'antiquity', deStyle: 'GREEK', region: 'MACEDONIAN' as RegionType,
        buildingStyle: 'MACEDONIAN',
        castleId: 'MACE_CASTLE_AGE3', castleName: '马其顿 佩拉要塞重石堡',
        formationMode: 'balance_yoke',
        // 🔴 [2026-10-02 主人令「给马其顿军团套上」] 舰队模型 = **英雄·地米斯托克利**（旗舰）。
        //    原为 TRIREME；按主人定的「不看人名、只看样式」比对：这条与 TRIREME **同型**
        //    （同船体、同舷侧白圆盾列、同单桅桨列与船首冲角），只差帆色与帆上纹章，
        //    故升为马其顿军团旗舰。素材是完整 16 向战船，登记见 UnitAssets 'HERO_THEMISTOCLES'。
        shipId: 'HERO_THEMISTOCLES',
        slots: [
            { type: 'elite_phalangite', count: 4 },
            { type: 'phalangite', count: 2 },
            { type: 'elite_companion_cavalry', count: 3 },
        ],
    },
    {
        name: '古典时代色雷斯军团', civ: '色雷斯', age: 'antiquity', deStyle: 'THRACIAN', region: 'THRACIAN' as RegionType,
        buildingStyle: 'THRACIAN',
        castleId: 'THRA_CASTLE_AGE3', castleName: '色雷斯 罗多彼山蛮族巨石堡',
        formationMode: 'echelon',
        shipId: 'ELITE_LEMBOS',
        slots: [
            { type: 'elite_rhomphaia_warrior', count: 4 },
            { type: 'rhomphaia_warrior', count: 3 },
            { type: 'elite_peltast', count: 2 },
        ],
    },
    {
        name: '古典时代普鲁军团', civ: '普鲁', age: 'antiquity', deStyle: 'PURU', region: 'PURU' as RegionType,
        buildingStyle: 'PURU',
        castleId: 'PURU_CASTLE_AGE3', castleName: '普鲁·南亚 旁遮普红砂岩堡',
        formationMode: 'triangle',
        shipId: 'ANT_ELITE_GALLEY',
        slots: [
            { type: 'elite_sannahya', count: 2 },
            { type: 'pattiyoda_longbowman', count: 3 },
            { type: 'elite_pattiyoda_longbowman', count: 4 },
        ],
    },
    {
        name: '封建时代法兰克军团', civ: '法兰克', age: 'feudal', deStyle: 'WEST', region: 'FRANKS' as RegionType,
        buildingStyle: 'FRANKS',
        castleId: 'FRAN_CASTLE_AGE3', castleName: '法兰克 卢瓦尔河双圆塔石堡',
        formationMode: 'crescent',
        shipId: 'MONOREME',
        slots: [
            { type: 'knight', count: 3 },
            { type: 'swordsman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
        ],
    },
    {
        name: '封建时代哥特军团', civ: '哥特', age: 'feudal', deStyle: 'WEST', region: 'GOTHS' as RegionType,
        buildingStyle: 'GOTHS',
        castleId: 'GOTH_CASTLE_AGE3', castleName: '哥特 早期蛮族石砌据点',
        formationMode: 'echelon',
        shipId: 'ELITE_LEMBOS',
        slots: [
            { type: 'elite_huskarl', count: 4 },
            { type: 'huskarl', count: 3 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    {
        name: '封建时代拜占庭军团', civ: '拜占庭', age: 'feudal', deStyle: 'EAST', region: 'BYZANTINE' as RegionType,
        buildingStyle: 'BYZANTINE',
        castleId: 'BYZA_CASTLE_AGE3', castleName: '拜占庭 君士坦丁堡红砖穹顶堡',
        formationMode: 'balance_yoke',
        shipId: 'DROMON',
        slots: [
            { type: 'elite_cataphract', count: 4 },
            { type: 'cataphract', count: 2 },
            { type: 'cretan_archer', count: 3 },
        ],
    },
    {
        name: '封建时代波斯军团', civ: '波斯', age: 'feudal', deStyle: 'PERSIAN', region: 'SASANIAN' as RegionType,
        buildingStyle: 'SASANIAN',
        castleId: 'PERS_CASTLE_AGE3', castleName: '波斯 萨珊泰西封砖石穹顶堡',
        formationMode: 'triangle',
        shipId: 'GALLEY',
        slots: [
            { type: 'elite_war_elephant', count: 2 },
            { type: 'imperial_cavalry', count: 3 },
            { type: 'sparabara', count: 4 },
        ],
    },
    {
        name: '封建时代维京军团', civ: '维京', age: 'feudal', deStyle: 'WEST', region: 'VIKINGS' as RegionType,
        buildingStyle: 'VIKINGS',
        castleId: 'VIKI_CASTLE_AGE3', castleName: '维京 斯堪的纳维亚环形堡垒',
        formationMode: 'echelon',
        shipId: 'DREKI',
        slots: [
            { type: 'elite_berserk', count: 4 },
            { type: 'berserk', count: 3 },
            { type: 'jarl', count: 2 },
        ],
    },
    {
        name: '封建时代匈人军团', civ: '匈人', age: 'feudal', deStyle: 'CEAS', region: 'HUNS' as RegionType,
        buildingStyle: 'HUNS',
        castleId: 'HUNS_CASTLE_AGE3', castleName: '匈奴/匈人 简易木石混合要塞',
        formationMode: 'echelon',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'elite_tarkan', count: 4 },
            { type: 'tarkan', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 2 },
        ],
    },
    {
        name: '封建时代埃塞俄比亚军团', civ: '埃塞俄比亚', age: 'feudal', deStyle: 'AFRI', region: 'ETHIOPIANS' as RegionType,
        buildingStyle: 'ETHIOPIANS',
        castleId: 'ETHI_CASTLE_AGE3', castleName: '埃塞俄比亚 阿克苏姆巨石柱堡',
        formationMode: 'echelon',
        shipId: 'FIRE_GALLEY',
        slots: [
            { type: 'elite_shotel_warrior', count: 4 },
            { type: 'shotel_warrior', count: 3 },
            { type: 'elite_camel_archer', count: 2 },
        ],
    },
    {
        name: '封建时代柏柏尔军团', civ: '柏柏尔', age: 'feudal', deStyle: 'AFRI', region: 'BERBER' as RegionType,
        buildingStyle: 'BERBER',
        castleId: 'BERB_CASTLE_AGE3', castleName: '柏柏尔 撒哈拉泥砖防御碉堡',
        formationMode: 'triangle',
        shipId: 'GALLEY',
        slots: [
            { type: 'elite_genitour', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    {
        name: '封建时代吴哥军团', civ: '高棉', age: 'feudal', deStyle: 'SEAS', region: 'KHMER' as RegionType,
        buildingStyle: 'KHMER',
        castleId: 'SEAS_CASTLE_AGE3', castleName: '东南亚/高棉 吴哥窟砂岩塔',
        formationMode: 'echelon',
        shipId: 'FIRE_GALLEY',
        slots: [
            { type: 'spearman', count: 4 },
            { type: 'archer', count: 3 },
            { type: 'elite_ballista_elephant', count: 2 },
        ],
    },
    {
        name: '封建时代保加利亚军团', civ: '保加利亚', age: 'feudal', deStyle: 'SLAV', region: 'BULGARIANS' as RegionType,
        buildingStyle: 'BULGARIANS',
        castleId: 'BULG_CASTLE_AGE3', castleName: '保加利亚 普雷斯拉夫圆顶城堡',
        formationMode: 'echelon',
        shipId: 'ELITE_LEMBOS',
        slots: [
            { type: 'elite_konnik', count: 4 },
            { type: 'konnik', count: 3 },
            { type: 'elite_konnik_foot', count: 2 },
        ],
    },
    {
        name: '封建时代瞿折罗军团', civ: '瞿折罗', age: 'feudal', deStyle: 'INDI', region: 'GURJARAS' as RegionType,
        buildingStyle: 'GURJARAS',
        castleId: 'GURJ_CASTLE_AGE3', castleName: '瞿折罗 索姆纳特多层砂岩堡',
        formationMode: 'balance_yoke',
        shipId: 'THIRISADAI',
        // 🔴 [2026-09-14 主人定] 二级军团一律「城堡兵 + 精锐兵 + 缺补兵」。
        //    原先两个精锐（什里瓦姆沙骑手精锐 + 飞轮掷手精锐）、没有城堡兵本体；
        //    且飞轮掷手是帝国档兵种，塞进封建军团也过不了时代闸。
        //    城堡兵取什里瓦姆沙骑手（瞿折罗专属城堡兵），精锐取其精锐档；
        //    缺补兵留骆驼斥候 —— 阿拉伯史家苏莱曼《中国印度见闻录》记瞿折罗-普腊蒂哈拉
        //    「拥有印度最好的骑兵」，其本部拉贾斯坦沙漠正是骆驼骑兵之乡，合史实。
        slots: [
            { type: 'elite_chakram_thrower', count: 4 },
            { type: 'chakram_thrower', count: 2 },
            { type: 'elite_shrivamsha_rider', count: 3 },
        ],
    },
    {
        name: '封建时代亚美尼亚军团', civ: '亚美尼亚', age: 'feudal', deStyle: 'EAST', region: 'ARMENIANS' as RegionType,
        buildingStyle: 'ARMENIANS',
        castleId: 'ARME_CASTLE_AGE3', castleName: '亚美尼亚 埃奇米阿津石砌山顶堡',
        formationMode: 'crescent',
        shipId: 'DROMON',
        slots: [
            { type: 'warrior_priest', count: 3 },
            { type: 'composite_bowman', count: 2 },
            { type: 'elite_composite_bowman', count: 4 },
        ],
    },
    {
        name: '城堡时代不列颠军团', civ: '不列颠', age: 'castle', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        buildingStyle: 'BRITONS',
        castleId: 'WEST_CASTLE_AGE3', castleName: '不列颠 西欧通用石堡',
        formationMode: 'triangle',
        shipId: 'CARRACK',
        slots: [
            { type: 'cavalier', count: 2 },
            { type: 'manatarms', count: 3 },
            { type: 'longbowman_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代条顿军团', civ: '条顿', age: 'castle', deStyle: 'WEST', region: 'TEUTONS' as RegionType,
        buildingStyle: 'GERMANIC',
        castleId: 'EAST_CASTLE_AGE3', castleName: '条顿 东欧石堡',
        formationMode: 'echelon',
        shipId: 'HULK',
        slots: [
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'teutonic_knight', count: 3 },
            { type: 'scout_cavalry', count: 2 },
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
        formationMode: 'echelon',
        shipId: 'ANT_WAR_GALLEY',
        slots: [
            { type: 'samurai_elite', count: 4 },
            { type: 'samurai', count: 3 },
            { type: 'ninja', count: 2 },
        ],
    },
    {
        name: '城堡时代萨拉森军团', civ: '萨拉森', age: 'castle', deStyle: 'ORIE', region: 'ORIE' as RegionType,
        buildingStyle: 'ORIE',
        castleId: 'ORIE_CASTLE_AGE3', castleName: '中东/萨拉森 开罗萨拉丁大城堡',
        formationMode: 'triangle',
        shipId: 'FIRE_SHIP',
        slots: [
            { type: 'camel_heavy', count: 2 },
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
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
        formationMode: 'crescent',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'elite_keshik', count: 3 },
            { type: 'mangudai', count: 2 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代阿兹特克军团', civ: '阿兹特克', age: 'castle', deStyle: 'MESO', region: 'AMERICA' as RegionType,
        buildingStyle: 'AMERICA',
        castleId: 'MESO_CASTLE_AGE3', castleName: '中美洲/阿兹特克 特诺奇蒂特兰金字塔',
        formationMode: 'echelon',
        shipId: 'CANOE',
        slots: [
            { type: 'elite_jaguar_warrior', count: 4 },
            { type: 'jaguar_warrior', count: 3 },
            { type: 'xolotl_warrior', count: 2 },
        ],
    },
    {
        name: '城堡时代玛雅军团', civ: '玛雅', age: 'castle', deStyle: 'MESO', region: 'MAYANS' as RegionType,
        buildingStyle: 'MAYANS',
        castleId: 'MAYA_CASTLE_AGE3', castleName: '玛雅 奇琴伊察阶梯神庙堡',
        formationMode: 'triangle',
        shipId: 'CANOE',
        slots: [
            { type: 'elite_eagle_warrior', count: 2 },
            { type: 'plumed_archer', count: 3 },
            { type: 'elite_plumed_archer', count: 4 },
        ],
    },
    {
        // ★ 2026-10-16 主人令：朝鲜 · 城堡时代 —— 本名已在二级表，重复 → 直接替换保留
        //    评级：（未标评级）｜核心兵种：重步兵、水军为主
        //    描述正文（主人原文，一字未改）：（开城、江华岛；开城满月台宫阙石台、江华岛高丽避乱石城要塞；三别抄精锐步卒突击、坚木双刃战斧、江华岛海防抗蒙水军城堡要塞）
        //    英雄队（第 10 队·主将队）：elite_war_wagon / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
        name: '城堡时代高丽军团', civ: '高丽', age: 'castle', deStyle: 'ASIA', region: 'GORYEO' as RegionType,
        buildingStyle: 'KOREA',
        castleId: 'KORE_CASTLE_AGE3', castleName: '高丽 汉阳南汉山城堞楼',
        formationMode: 'triangle',
        shipId: 'TURTLE_SHIP',
        slots: [
            { type: 'jian_swordsman', count: 2 },
            { type: 'fire_archer', count: 3 },
            { type: 'elite_war_wagon', count: 4 },
        ],
    },
    {
        name: '城堡时代意大利军团', civ: '意大利', age: 'castle', deStyle: 'MEDI', region: 'ITALIANS' as RegionType,
        buildingStyle: 'LATIN',
        castleId: 'MEDI_CASTLE_AGE3', castleName: '地中海/意大利 威尼斯总督红顶宫',
        formationMode: 'triangle',
        shipId: 'ELITE_CARAVEL',
        slots: [
            { type: 'condottiero', count: 2 },
            { type: 'genoese_crossbowman', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    {
        name: '城堡时代印度斯坦军团', civ: '印度斯坦', age: 'castle', deStyle: 'INDI', region: 'MUGHAL' as RegionType,
        buildingStyle: 'MUGHAL',
        castleId: 'HIND_CASTLE_AGE3', castleName: '印度斯坦 德里红堡莫卧儿红砂岩',
        formationMode: 'echelon',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        slots: [
            { type: 'elite_ghulam', count: 4 },
            { type: 'ghulam', count: 3 },
            { type: 'imperial_camel_rider', count: 2 },
        ],
    },
    {
        name: '城堡时代印加军团', civ: '印加', age: 'castle', deStyle: 'ANDE', region: 'INCA' as RegionType,
        buildingStyle: 'INCA',
        castleId: 'INCA_CASTLE_AGE3', castleName: '印加 库斯科萨克萨瓦曼巨石堡',
        formationMode: 'echelon',
        shipId: 'CANOE',
        slots: [
            { type: 'kamayuk', count: 4 },
            { type: 'elite_kamayuk', count: 3 },
            { type: 'champi_runner', count: 2 },
        ],
    },
    {
        name: '城堡时代马扎尔军团', civ: '马扎尔', age: 'castle', deStyle: 'SLAV', region: 'MAGYAR' as RegionType,
        buildingStyle: 'MAGYAR',
        castleId: 'MAGY_CASTLE_AGE3', castleName: '马扎尔 布达佩斯多瑙河石堡',
        formationMode: 'echelon',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'elite_magyar_huszar', count: 4 },
            { type: 'magyar_huszar', count: 3 },
            { type: 'hussite_wagon', count: 2 },
        ],
    },
    {
        name: '城堡时代斯拉夫军团', civ: '斯拉夫', age: 'castle', deStyle: 'SLAV', region: 'SLAVIC' as RegionType,
        buildingStyle: 'SLAVIC',
        castleId: 'SLAV_CASTLE_AGE3', castleName: '东欧/斯拉夫 莫斯科白石克里姆林',
        formationMode: 'echelon',
        shipId: 'WAR_GALLEY',
        slots: [
            { type: 'elite_boyar', count: 4 },
            { type: 'boyar', count: 3 },
            { type: 'recurve_bowman', count: 2 },
        ],
    },
    {
        name: '城堡时代马里军团', civ: '马里', age: 'castle', deStyle: 'AFRI', region: 'MALI' as RegionType,
        buildingStyle: 'AFRICA',
        castleId: 'AFRI_CASTLE_AGE3', castleName: '非洲/马里 杰内大清真寺泥石堡',
        formationMode: 'triangle',
        shipId: 'CANOE',
        slots: [
            { type: 'camel_raider', count: 2 },
            { type: 'gbeto', count: 3 },
            { type: 'elite_gbeto', count: 4 },
        ],
    },
    {
        name: '城堡时代马来军团', civ: '马来', age: 'castle', deStyle: 'SEAS', region: 'MALAY' as RegionType,
        buildingStyle: 'MALAY',
        castleId: 'MALA_CASTLE_AGE3', castleName: '马来 马六甲海峡水上海堡',
        formationMode: 'echelon',
        shipId: 'FAST_FIRE_SHIP',
        slots: [
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'karambit_warrior', count: 3 },
            { type: 'elite_battle_elephant', count: 2 },
        ],
    },
    {
        name: '城堡时代缅甸军团', civ: '缅甸', age: 'castle', deStyle: 'SEAS', region: 'BURMESE' as RegionType,
        buildingStyle: 'BURMESE',
        castleId: 'BURM_CASTLE_AGE3', castleName: '缅甸 蒲甘千佛塔金顶堡',
        formationMode: 'triangle',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'arambai', count: 3 },
            { type: 'elite_arambai', count: 4 },
        ],
    },
    {
        name: '城堡时代越南军团', civ: '越南', age: 'castle', deStyle: 'SEAS', region: 'VIETNAMESE' as RegionType,
        buildingStyle: 'VIETNAMESE',
        castleId: 'VIET_CASTLE_AGE3', castleName: '越南 顺化京城多檐城门楼',
        formationMode: 'triangle',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'rattan_archer', count: 3 },
            { type: 'rattan_archer_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代鞑靼军团', civ: '鞑靼', age: 'castle', deStyle: 'CEAS', region: 'CENTRAL_ASIA' as RegionType,
        buildingStyle: 'CENTRAL_ASIA',
        castleId: 'CEAS_CASTLE_AGE3', castleName: '中亚/鞑靼 撒马尔罕帖木儿蓝顶堡',
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'elite_keshik', count: 2 },
            { type: 'keshik', count: 3 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代库曼军团', civ: '库曼', age: 'castle', deStyle: 'CEAS', region: 'CUMAN' as RegionType,
        buildingStyle: 'CUMAN',
        castleId: 'CUMA_CASTLE_AGE3', castleName: '库曼 黑海北岸克里米亚要塞',
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'elite_steppe_lancer', count: 2 },
            { type: 'kipchak', count: 3 },
            { type: 'elite_kipchak', count: 4 },
        ],
    },
    {
        name: '城堡时代立陶宛军团', civ: '立陶宛', age: 'castle', deStyle: 'SLAV', region: 'LITHUANIANS' as RegionType,
        buildingStyle: 'LITHUANIANS',
        castleId: 'LITH_CASTLE_AGE3', castleName: '立陶宛 特拉凯湖心红砖城堡',
        formationMode: 'echelon',
        shipId: 'ELITE_CARAVEL',
        slots: [
            { type: 'elite_leitis', count: 4 },
            { type: 'leitis', count: 3 },
            { type: 'winged_hussar', count: 2 },
        ],
    },
    {
        name: '城堡时代勃艮第军团', civ: '勃艮第', age: 'castle', deStyle: 'WEST', region: 'BURGUNDIANS' as RegionType,
        buildingStyle: 'BURGUNDIANS',
        castleId: 'BURG_CASTLE_AGE3', castleName: '勃艮第 第戎公爵宫圆锥塔',
        formationMode: 'echelon',
        shipId: 'WAR_HULK',
        slots: [
            { type: 'flemish_pikeman_f', count: 4 },
            { type: 'coustillier', count: 3 },
            { type: 'elite_coustillier', count: 2 },
        ],
    },
    {
        name: '城堡时代西西里军团', civ: '西西里', age: 'castle', deStyle: 'MEDI', region: 'SICILIANS' as RegionType,
        buildingStyle: 'SICILIANS',
        castleId: 'SICI_CASTLE_AGE3', castleName: '西西里 诺曼巴勒莫王宫堡',
        formationMode: 'echelon',
        shipId: 'WAR_GALLEY',
        slots: [
            { type: 'elite_serjeant', count: 4 },
            { type: 'serjeant', count: 3 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    {
        name: '城堡时代波兰军团', civ: '波兰', age: 'castle', deStyle: 'SLAV', region: 'POLES' as RegionType,
        buildingStyle: 'POLES',
        castleId: 'POLE_CASTLE_AGE3', castleName: '波兰 马尔堡红砖条顿古堡',
        formationMode: 'echelon',
        shipId: 'ELITE_CARAVEL',
        slots: [
            { type: 'elite_obuch', count: 4 },
            { type: 'obuch', count: 3 },
            { type: 'winged_hussar', count: 2 },
        ],
    },
    {
        name: '城堡时代波希米亚军团', civ: '波希米亚', age: 'castle', deStyle: 'SLAV', region: 'BOHEMIANS' as RegionType,
        buildingStyle: 'BOHEMIANS',
        castleId: 'BOHE_CASTLE_AGE3', castleName: '波希米亚 卡尔施泰因城堡',
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'arbalest', count: 3 },
            { type: 'elite_hussite_wagon', count: 4 },
        ],
    },
    {
        name: '城堡时代达罗毗荼军团', civ: '达罗毗荼', age: 'castle', deStyle: 'INDI', region: 'INDIA' as RegionType,
        buildingStyle: 'INDIA',
        castleId: 'INDI_CASTLE_AGE3', castleName: '南亚/达罗毗荼 坦贾武尔寺庙高塔堡',
        formationMode: 'echelon',
        shipId: 'THIRISADAI',
        slots: [
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_ratha_melee', count: 2 },
        ],
    },
    {
        name: '城堡时代格鲁吉亚军团', civ: '格鲁吉亚', age: 'castle', deStyle: 'EAST', region: 'GEORGIANS' as RegionType,
        buildingStyle: 'GEORGIANS',
        castleId: 'GEOR_CASTLE_AGE3', castleName: '格鲁吉亚 高加索斯万石塔古堡',
        formationMode: 'echelon',
        shipId: 'DROMON',
        slots: [
            { type: 'elite_monaspa', count: 4 },
            { type: 'monaspa', count: 3 },
            { type: 'elite_composite_bowman', count: 2 },
        ],
    },
    {
        name: '城堡时代穆伊斯卡军团', civ: '穆伊斯卡', age: 'castle', deStyle: 'ANDE', region: 'MUISCA' as RegionType,
        buildingStyle: 'MUISCA',
        castleId: 'MUIS_CASTLE_AGE3', castleName: '穆伊斯卡 瓜塔维塔黄金湖石堡',
        formationMode: 'triangle',
        shipId: 'CANOE',
        slots: [
            { type: 'elite_temple_guard', count: 2 },
            { type: 'guecha_warrior', count: 3 },
            { type: 'elite_guecha_warrior', count: 4 },
        ],
    },
    {
        name: '城堡时代图皮军团', civ: '图皮', age: 'castle', deStyle: 'ANDE', region: 'TUPI' as RegionType,
        buildingStyle: 'TUPI',
        castleId: 'TUPI_CASTLE_AGE3', castleName: '图皮 亚马逊雨林木栅重垒',
        formationMode: 'triangle',
        shipId: 'CANOE',
        slots: [
            { type: 'elite_ibirapema_warrior', count: 2 },
            { type: 'blackwood_archer', count: 3 },
            { type: 'elite_blackwood_archer', count: 4 },
        ],
    },
    {
        name: '帝国时代西班牙军团', civ: '西班牙', age: 'imperial', deStyle: 'MEDI', region: 'SPANISH' as RegionType,
        buildingStyle: 'SPANISH',
        castleId: 'SPAN_CASTLE_AGE3', castleName: '西班牙 塞戈维亚阿尔卡萨堡',
        formationMode: 'triangle',
        shipId: 'GALLEON',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    {
        name: '帝国时代葡萄牙军团', civ: '葡萄牙', age: 'imperial', deStyle: 'MEDI', region: 'PORTUGUESE' as RegionType,
        buildingStyle: 'PORTUGUESE',
        castleId: 'PORT_CASTLE_AGE3', castleName: '葡萄牙 贝伦塔大西洋海堡',
        formationMode: 'triangle',
        shipId: 'CARAVEL',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'organ_gun', count: 3 },
            { type: 'elite_organ_gun', count: 4 },
        ],
    },
    {
        name: '帝国时代奥斯曼军团', civ: '奥斯曼', age: 'imperial', deStyle: 'CEAS', region: 'OTTOMAN' as RegionType,
        buildingStyle: 'TURKS',
        castleId: 'TURK_CASTLE_AGE3', castleName: '奥斯曼 托普卡珀皇宫圆堡',
        formationMode: 'echelon',
        shipId: 'CANNON_GALLEON',
        slots: [
            { type: 'light_cavalry', count: 4 },
            { type: 'janissary', count: 3 },
            { type: 'elite_janissary', count: 2 },
        ],
    },
    {
        name: '帝国时代马普切军团', civ: '马普切', age: 'imperial', deStyle: 'ANDE', region: 'MAPUCHE' as RegionType,
        buildingStyle: 'MAPUCHE',
        castleId: 'MAPU_CASTLE_AGE3', castleName: '马普切 安第斯南麓木石据点',
        formationMode: 'triangle',
        shipId: 'CANOE',
        slots: [
            { type: 'elite_kona', count: 2 },
            { type: 'kona', count: 3 },
            { type: 'elite_bolas_rider', count: 4 },
        ],
    },
    // 🔴 [2026-10-05 主人令「把青藏军团，西域军团，漠南鲜卑军团移动到三级军团。三个建筑风格，也是三级建筑风格」]
    //    原在本表（二级）的三条**时代外兜底条目**已移入三级表 `level3CustomLegions.ts`：
    //      `封建时代吐蕃军团`（region TIBET）｜`古典时代西域军团`（region WESTERN）｜~~`封建时代鲜卑军团`~~（region MONGOL，2026-10-05 已删）
    //    理由（与 `LegionFallbackOnDelete.ts` 里主人原话一致）：青藏／西域／漠北蒙古毡帐是**三级专属建筑风格**，
    //    二级 62 里本来就没有同 region 的条目，《一级16／二级62／三级自建》三层口径里它们属**三级自建**。
    //    它们的时代细分军团（城堡时代吐蕃／帝国时代青藏／封建时代安西／帝王时代维吾尔／帝国时代蒙古…）本就在三级表。
    // 🔴 [2026-10-05 主人令「62 个可玩文明对应 62 支军团」] DE 新增三文明：撒克逊 / 丹麦 / 瓦良格。
    //    时代按其专属兵种的史实定（撒克逊 5 世纪至 1066 年 = 封建；丹麦约姆斯维京 10 世纪 = 封建；瓦良格卫队 1050–1204 年 = 城堡）。
    //    编制 = 本势力精锐（前排 4）+ 城堡兵（中排 3）+ 缺补兵（后排 2）。region 用建筑风格键（SAXONS / DANES / VARANGIANS，不在 RegionType 联合里）。
    {
        name: '封建时代撒克逊军团', civ: '撒克逊', age: 'feudal', deStyle: 'WEST', region: 'SAXONS' as unknown as RegionType,
        buildingStyle: 'SAXONS',
        castleId: 'SAXO_CASTLE_AGE3', castleName: '撒克逊 石木混筑塔堡',
        formationMode: 'echelon',
        shipId: 'LONGBOAT',
        slots: [
            { type: 'elite_hearth_troop', count: 4 },
            { type: 'hearth_troop', count: 3 },
            { type: 'throwing_axeman', count: 2 },
        ],
    },
    {
        name: '封建时代丹麦军团', civ: '丹麦', age: 'feudal', deStyle: 'WEST', region: 'DANES' as unknown as RegionType,
        buildingStyle: 'DANES',
        castleId: 'DANE_CASTLE_AGE3', castleName: '丹麦 圆塔木石堡',
        formationMode: 'echelon',
        shipId: 'ELITE_LONGBOAT',
        slots: [
            { type: 'elite_jomsviking', count: 4 },
            { type: 'jomsviking', count: 3 },
            { type: 'throwing_axeman', count: 2 },
        ],
    },
    {
        name: '城堡时代瓦良格军团', civ: '瓦良格', age: 'castle', deStyle: 'WEST', region: 'VARANGIANS' as unknown as RegionType,
        buildingStyle: 'VARANGIANS',
        castleId: 'VARA_CASTLE_AGE3', castleName: '瓦良格 诺斯山形屋顶要塞',
        formationMode: 'echelon',
        shipId: 'ELITE_LONGBOAT',
        slots: [
            { type: 'elite_varangian_guard', count: 4 },
            { type: 'varangian_jarl', count: 3 },
            { type: 'cretan_archer', count: 2 },
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
        name: '古典时代秦汉军团', civ: '华夏', age: 'antiquity', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '华夏 北方华北·汉唐城楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
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
        name: '封建时代隋唐军团', civ: '华夏', age: 'feudal', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '华夏 北方华北·汉唐城楼',
        formationMode: 'balance_yoke',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'liao_dao', count: 4 },
            { type: 'elite_chukonu', count: 2 },
            { type: 'hei_kuang_heavy', count: 3 },
        ],
    },
    // ── 中原 · 城堡时代 · 城堡时代宋禁军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：重步兵、远程为主
    //    描述正文（主人原文，一字未改）：（开封、归德；繁塔、宋开封铁塔、清明上河图虹桥瓮城；神臂弓克敌连珠弩、步人甲重步兵刺猬阵、斩马刀扎垒守备）
    //    英雄队（第 10 队·主将队）：hero_lubu / hero_guanyu / hero_zhangfei / hero_liubei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代宋禁军团', civ: '华夏', age: 'castle', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '华夏 北方华北·汉唐城楼',
        formationMode: 'balance_yoke',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'liao_dao', count: 4 },
            { type: 'elite_fire_lancer', count: 2 },
            { type: 'elite_chukonu', count: 3 },
        ],
    },
    // ── 中原 · 帝国时代 · 帝国时代华夏军团　（三级升二级）────────────────
    //    评级：（未标评级）｜核心兵种：远程（火器）、步兵为主
    //    描述正文（主人原文，一字未改）：（北京、南京；明南京紫禁城、明十三陵、早期居庸关长城；京营三大营三眼铳与神机火器、重型长枪圆牌阵、大航海早期内线精甲卫所军）
    //    英雄队（第 10 队·主将队）：hero_lubu / hero_guanyu / hero_zhangfei / hero_liubei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代华夏军团', civ: '华夏', age: 'imperial', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        buildingStyle: 'CENTRAL',
        castleId: 'CHIN_CASTLE_AGE3', castleName: '华夏 北方华北·汉唐城楼',
        formationMode: 'echelon',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'jian_swordsman', count: 4 },
            { type: 'chukonu', count: 3 },
            { type: 'fire_archer', count: 2 },
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
        name: '古典时代魏晋军团', civ: '河朔', age: 'antiquity', deStyle: 'ASIA', region: 'WEI' as RegionType,
        buildingStyle: 'WEI',
        castleId: 'WEI_CASTLE_AGE3', castleName: '河朔 邺城重檐铜雀楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
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
        name: '封建时代北朝军团', civ: '河朔', age: 'feudal', deStyle: 'ASIA', region: 'WEI' as RegionType,
        buildingStyle: 'WEI',
        castleId: 'WEI_CASTLE_AGE3', castleName: '河朔 邺城重檐铜雀楼',
        formationMode: 'fish_scale',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'tarkan', count: 3 },
            { type: 'hei_kuang_heavy', count: 4 },
            { type: 'xianbei_raider', count: 2 },
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
        formationMode: 'crane_wing',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'liao_dao', count: 4 },
            { type: 'elite_kipchak', count: 3 },
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
        formationMode: 'echelon',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'fire_lancer', count: 4 },
            { type: 'elite_fire_archer', count: 3 },
            { type: 'mangudai_elite', count: 2 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 江南　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 江南 · 古典时代 · 古典时代吴越军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、水军为主
    //    描述正文（主人原文，一字未改）：（阖闾城/苏州、绍兴；阖闾城水陆城门遗址、印山越王巨石陵木椁；精炼青铜折铁干将莫邪双刃剑、水网舟楫步兵、断发文身林沼突击）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代吴越军团', civ: '江南', age: 'antiquity', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'balance_yoke',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'antiquity_spearman', count: 4 },
            { type: 'elite_white_feather_guard', count: 2 },
            { type: 'elite_fire_archer', count: 3 },
        ],
    },
    // ── 江南 · 封建时代 · 封建时代南朝军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重步兵、水军为主
    //    描述正文（主人原文，一字未改）：（建康/南京、扬州；栖霞山南朝石刻辟邪、鸡鸣寺台城遗址；长江水师连环战舰、北府兵重装长标枪、步射交织守江破胡阵）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '封建时代南朝军团', civ: '江南', age: 'feudal', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'echelon',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'jian_swordman_unshielded', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'recurve_bowman', count: 2 },
        ],
    },
    // ── 江南 · 城堡时代 · 城堡时代临安军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：重步兵、重骑兵为主
    //    描述正文（主人原文，一字未改）：（临安/杭州、镇江；杭州雷峰塔砖心、六和塔石木外檐；岳家军麻扎刀破拐子马、神劲背嵬骑兵、长江铁壁江防蒙冲战船方阵）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代临安军团', civ: '江南', age: 'castle', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'triangle',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'fire_lancer', count: 2 },
            { type: 'liao_dao', count: 3 },
            { type: 'elite_keshik', count: 4 },
        ],
    },
    // ── 江南 · 帝国时代 · 帝国时代两江军团　（本次新建）────────────────
    //    评级：（未标评级）｜核心兵种：步兵、水军为主
    //    描述正文（主人原文，一字未改）：（南京、苏州；南京巨型明城墙中华门瓮城、苏州拙政园早期水阁石舫；江南倭寇平定营、戚家军鸳鸯阵藤牌长枪、大航海早期宝船外海远洋水师）
    //    英雄队（第 10 队·主将队）：hero_sunce / hero_sunjian / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代两江军团', civ: '江南', age: 'imperial', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        buildingStyle: 'JIANGNAN',
        castleId: 'WU_CASTLE_AGE3', castleName: '江南 水乡飞檐水榭',
        formationMode: 'balance_yoke',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'jian_swordman_shielded', count: 4 },
            { type: 'pikeman', count: 2 },
            { type: 'hand_cannoneer', count: 3 },
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
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'antiquity_spearman', count: 4 },
            { type: 'elite_chukonu', count: 2 },
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
        formationMode: 'crescent',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'jian_swordman_unshielded', count: 3 },
            { type: 'crossbowman', count: 2 },
            { type: 'recurve_bowman', count: 4 },
        ],
    },
    // ── 巴蜀 · 城堡时代 · 城堡时代山城军团　（本次新建）────────────────
    //    评级：【精锐】｜核心兵种：远程（弩炮）、重步兵为主
    //    描述正文（主人原文，一字未改）：（合川钓鱼城、重庆；合川钓鱼城绝壁石城、白帝城石垣要塞；嘉陵江断崖重弩炮要塞防御、山城天险死守飞石滚木、击毙蒙哥汗山城铁血死士）
    //    英雄队（第 10 队·主将队）：hero_zhugeliang / hero_liubei / hero_guanyu / hero_zhangfei　— 按 248 主将表取，不进三排兵种编制
    {
        name: '城堡时代山城军团', civ: '巴蜀', age: 'castle', deStyle: 'ASIA', region: 'BASHU' as RegionType,
        buildingStyle: 'BASHU',
        castleId: 'SHU_CASTLE_AGE3', castleName: '巴蜀 汉式斗拱望楼',
        formationMode: 'echelon',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'jian_swordman_shielded', count: 4 },
            { type: 'pikeman', count: 3 },
            { type: 'arbalest', count: 2 },
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
        formationMode: 'balance_yoke',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'pikeman', count: 4 },
            { type: 'champion', count: 2 },
            { type: 'hussar', count: 3 },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // 河西　四时代二级军团（古典 / 封建 / 城堡 / 帝国）—— 2026-10-16 主人令建立
    // ═══════════════════════════════════════════════════════════════════
    // ── 河西 · 古典时代 · 古典时代西凉军团　（本次新建）────────────────
    //    评级：【高级】｜核心兵种：重骑兵、骑射为主
    //    描述正文（主人原文，一字未改）：（武威、敦煌；嘉峪关汉代烽燧、悬泉置泥土驿置遗址；汉匈西域争霸、西凉铁骑重铠标枪、敦煌长城内线控弦骑射）
    //    英雄队（第 10 队·主将队）：hero_girgenkhan / hero_qutlugh　— 按 248 主将表取，不进三排兵种编制
    {
        name: '古典时代西凉军团', civ: '河西', age: 'antiquity', deStyle: 'ASIA', region: 'KHITAN' as RegionType,
        buildingStyle: 'KHITAN',
        castleId: 'KHIT_CASTLE_AGE3', castleName: '河西 辽阳八角木石塔楼',
        formationMode: 'fish_scale',
        shipId: 'CANOE',
        slots: [
            { type: 'lancer', count: 3 },
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'elite_scythian_horse_archer', count: 2 },
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
        formationMode: 'crane_wing',
        shipId: 'GALLEY',
        slots: [
            { type: 'xianbei_raider', count: 2 },
            { type: 'spearman', count: 4 },
            { type: 'tarkan', count: 3 },
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
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'iron_pagoda', count: 2 },
            { type: 'camel_rider', count: 3 },
            { type: 'elite_keshik', count: 4 },
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
        formationMode: 'crescent',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'elite_steppe_lancer', count: 2 },
            { type: 'hussar', count: 4 },
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
        formationMode: 'crescent',
        shipId: 'CANOE',
        slots: [
            { type: 'militia', count: 3 },
            { type: 'antiquity_skirmisher', count: 2 },
            { type: 'chukonu', count: 4 },
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
        formationMode: 'echelon',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'spearman', count: 4 },
            { type: 'xianbei_raider', count: 3 },
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
        slots: [
            { type: 'xianbei_raider', count: 3 },
            { type: 'elite_iron_pagoda', count: 4 },
            { type: 'elite_kipchak', count: 2 },
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
        formationMode: 'balance_yoke',
        shipId: 'WAR_GALLEY',
        slots: [
            { type: 'elite_fire_archer', count: 4 },
            { type: 'elite_iron_pagoda', count: 2 },
            { type: 'kipchak', count: 3 },
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
        formationMode: 'crescent',
        shipId: 'CANOE',
        slots: [
            { type: 'antiquity_light_cavalry', count: 3 },
            { type: 'antiquity_cavalry_archer', count: 2 },
            { type: 'elite_scythian_horse_archer', count: 4 },
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
        formationMode: 'triangle',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'elite_steppe_lancer', count: 3 },
            { type: 'mangudai', count: 4 },
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
        formationMode: 'balance_yoke',
        shipId: 'DEMO_RAFT',
        slots: [
            { type: 'hussar', count: 4 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 3 },
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
        formationMode: 'triangle',
        shipId: 'CANOE',
        slots: [
            { type: 'lancer', count: 2 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
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
        formationMode: 'echelon',
        shipId: 'LOU_CHUAN',
        slots: [
            { type: 'jian_swordsman', count: 4 },
            { type: 'war_wagon', count: 3 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    // ── 已存在的二级军团（本次不改编制，只补评级/描述/英雄队）：城堡时代高丽军团
    //    ✔ 见本表里【城堡时代高丽军团】那一条前的 ★ 批注（评级：（未标评级）｜核心兵种：重步兵、水军为主）
    // ── 朝鲜 · 帝国时代 · 帝国时代朝鲜军团　（三级升二级）────────────────
    //    评级：【高级】｜核心兵种：战车（火箭车）、水军为主
    //    描述正文（主人原文，一字未改）：（汉阳/首尔；景福宫光化门石台木楼、汉城石砌环山城郭；三手技长矛射手协同、神机箭火箭车、大航海早期李舜臣防倭板屋船要塞水军）
    //    英雄队（第 10 队·主将队）：elite_war_wagon / hero_sunquan　— 按 248 主将表取，不进三排兵种编制
    {
        name: '帝国时代朝鲜军团', civ: '高丽', age: 'imperial', deStyle: 'ASIA', region: 'GORYEO' as RegionType,
        buildingStyle: 'KOREA',
        castleId: 'KORE_CASTLE_AGE3', castleName: '高丽 汉阳南汉山城堞楼',
        formationMode: 'crane_wing',
        shipId: 'ELITE_TURTLE_SHIP',
        slots: [
            { type: 'jian_swordman_shielded', count: 2 },
            { type: 'war_wagon', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
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
        formationMode: 'echelon',
        shipId: 'CANOE',
        slots: [
            { type: 'antiquity_spearman', count: 4 },
            { type: 'militia', count: 3 },
            { type: 'antiquity_skirmisher', count: 2 },
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
        formationMode: 'crescent',
        shipId: 'ANT_ELITE_GALLEY',
        slots: [
            { type: 'light_cavalry', count: 3 },
            { type: 'light_riders', count: 2 },
            { type: 'cav_archer_heavy', count: 4 },
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
        formationMode: 'balance_yoke',
        shipId: 'ANT_ELITE_GALLEY',
        slots: [
            { type: 'pikeman', count: 4 },
            { type: 'two_handed_swordsman', count: 2 },
            { type: 'hand_cannoneer', count: 3 },
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
const ottomanLegion = LEVEL_2_CIV_62_LEGIONS.find(l => l.civ === '奥斯曼');
if (ottomanLegion) {
    LEVEL_2_CIV_CIV_MAP.set('突厥', ottomanLegion);
    LEVEL_2_CIV_CIV_MAP.set('土耳其', ottomanLegion);
    LEVEL_2_CIV_62_MAP.set('帝国时代突厥军团', ottomanLegion);
    LEVEL_2_CIV_62_MAP.set('帝国时代土耳其军团', ottomanLegion);
}
// 兼容高丽/朝鲜别名
const goryeoLegion = LEVEL_2_CIV_62_LEGIONS.find(l => l.civ === '高丽');
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
