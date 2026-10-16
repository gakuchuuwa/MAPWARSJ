/**
 * 三级军团表（自建 / 延伸军团）—— 🔴 [2026-09-14 主人定]
 *
 * > 主人原话：「所有军团只有一级 16 个，二级 62 个，其他都是三级」「怎么还有什么文化表，全部清除」
 *
 * ── 为什么有这个文件 ─────────────────────────────────────────────
 * 一级 16 母体的编制在 `CultureFormations.ts` 的 `BASE_16_TIERS_MAP`，
 * 二级 62 文明的编制在 `level2Civ62Legions.ts`，
 * 唯独三级军团的编制原先**没有自己的表**，散着寄存在 173 个文化区的格子里
 * （`CULTURE_TIERS_MAP` / `CULTURE_FORMATION_MODE`，也就是主人说的「文化表」）。
 * 那套东西不属于三层里的任何一层，是第四份权威，于是同一支军团的编制能在两处打架。
 * 本文件把三级军团的编制搬回军团自己身上；文化区从此只剩一个指针
 * （`CULTURE_LEGION_NAMES`：这个区默认挂哪支军团），不再持有任何编制。
 *
 * ⚠️ 军团数量一支未增未减：搬家前后都是 一级 16 + 二级 62 + 三级 N。
 */
import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';
import type { BuildingStyle } from './cities_v2';

export interface Level3LegionDef {
    /** 军团名（时代 + 民族 + 军团） */
    name: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    /** 默认挂这支军团的文化区（只作溯源用，编制不再按区存） */
    regions: string[];
    /** 归属的 78 种正统军团名（一级 16 母体 16 支 + 二级 62 文明 62 支，🔴 2026-09-16 主人定） */
    parentLegion: string;
    /** 绑定的史实海军战船（对齐四大时代与历史，🔴 2026-09-16 主人定） */
    shipId: string;
    buildingStyle: BuildingStyle;
}

export const LEVEL_3_LEGIONS: Level3LegionDef[] = [
    {
        name: '古典时代亚马逊军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'amazon_archer', count: 2 },
            { type: 'amazon_warrior', count: 4 },
            { type: 'elite_scythian_horse_archer', count: 3 },
        ],
        regions: ['AMAZONS'],
        parentLegion: '古典时代色雷斯军团',
        shipId: 'ELITE_LEMBOS',
        buildingStyle: 'THRACIAN',
    },
    {
        name: '古典时代先秦军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'fire_archer', count: 3 },
            { type: 'war_chariot_ranged', count: 2 },
        ],
        regions: ['PRE_QIN'],
        parentLegion: '古典时代秦汉军团',
        shipId: 'LOU_CHUAN',
        buildingStyle: 'CENTRAL',
    },
    {
        name: '古典时代努比亚军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'antiquity_scout_cavalry', count: 2 },
            { type: 'vanguard', count: 4 },
            { type: 'bactrian_archer', count: 3 },
        ],
        regions: ['KUSH'],
        parentLegion: '非洲军团',
        shipId: 'MONOREME',
        buildingStyle: 'AFRICA',
    },
    {
        name: '古典时代印度军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'sickle_warrior', count: 4 },
            { type: 'elite_pattiyoda_longbowman', count: 3 },
        ],
        regions: ['INDIA'],
        parentLegion: '古典时代贵霜军团',
        shipId: 'ANT_ELITE_GALLEY',
        buildingStyle: 'PURU',
    },
    {
        name: '古典时代埃及军团',
        formationMode: 'echelon',
        slots: [
            { type: 'cretan_archer', count: 4 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'elite_war_chariot', count: 2 },
        ],
        regions: ['EGYPT'],
        parentLegion: '非洲军团',
        shipId: 'MONOREME',
        buildingStyle: 'ORIE',
    },
    {
        name: '古典时代大希腊军团',
        formationMode: 'echelon',
        slots: [
            { type: 'ekdromos', count: 4 },
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'tarantine_cavalry', count: 2 },
        ],
        regions: ['MAGNA_GRAECIA'],
        // 🔴 [2026-10-05 主人令「同时代不能挂」] 原挂 `古典时代雅典军团`（同代）违规 →
        //    改挂同文化、不同代的二级主干；大希腊城邦在公元前 3 世纪属马其顿／伊皮鲁斯势力范围
        //    （皮洛士即应塔兰托之请渡海战罗马），故归马其顿。
        parentLegion: '古典时代马其顿军团',
        shipId: 'TRIREME',
        buildingStyle: 'MACEDONIAN',
    },
    {
        name: '古典时代布匿军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'rhodian_slinger', count: 2 },
            { type: 'vanguard', count: 4 },
            { type: 'companion_cavalry', count: 3 },
        ],
        regions: ['CARTHAGE'],
        parentLegion: '古典时代罗马军团',
        shipId: 'TRIREME',
        buildingStyle: 'ROMA',
    },
    {
        name: '古典时代希伯来军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'levy', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'war_chariot', count: 2 },
        ],
        regions: ['HEBREWS'],
        parentLegion: '中东军团',
        shipId: 'MONOREME',
        buildingStyle: 'ORIE',
    },
    {
        name: '古典时代希腊军团',
        formationMode: 'echelon',
        slots: [
            { type: 'sacred_band', count: 4 },
            { type: 'hoplite', count: 3 },
            { type: 'gastraphetes', count: 2 },
        ],
        regions: ['GREEK'],
        // 🔴 [2026-10-05 主人定「这66的父级都是一级」] 三级基础军团的父级＝一级母体 → 古典希腊属希腊军团。
        parentLegion: '希腊军团',
        shipId: 'HERO_DIONYSUS',
        buildingStyle: 'GREECE',
    },
    // 🔴 [2026-10-05 主人定「同族同时代不另立」＋「删除吧」] —— 已删「古典时代希腊雇佣军团」。
    //    原挂它的 2 个势力都不是雇佣兵，已按主人令改挂同族／同地军团：
    //      特洛伊·赫克托耳 → 古典时代色雷斯军团（小亚细亚西北，隔赫勒斯滂与色雷斯相望）
    //      伊皮鲁斯·皮洛士 → 古典时代马其顿军团（马其顿式方阵＋战象）
    {
        name: '古典时代斯基泰军团',
        formationMode: 'triangle',
        slots: [
            { type: 'sarmatian', count: 2 },
            { type: 'scythian_axe_cavalry', count: 3 },
            { type: 'scythian_horse_archer', count: 4 },
        ],
        regions: ['SCYTHIANS'],
        parentLegion: '古典时代色雷斯军团',
        shipId: 'MONOREME',
        buildingStyle: 'THRACIAN',
    },
    {
        name: '古典时代日耳曼军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'antiquity_light_cavalry', count: 2 },
            { type: 'vanguard', count: 4 },
            { type: 'elite_antiquity_skirmisher', count: 3 },
        ],
        regions: ['GERMANIC'],
        parentLegion: '西欧军团',
        shipId: 'MONOREME',
        buildingStyle: 'GERMANIC',
    },
    {
        name: '古典时代纳巴泰军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'camel_scout', count: 2 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'bactrian_archer', count: 3 },
        ],
        regions: ['NABATAEANS'],
        parentLegion: '中东军团',
        shipId: 'BIREME',
        buildingStyle: 'ORIE',
    },
    {
        name: '古典漠北军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_tarkan', count: 4 },
            { type: 'steppe_lancer', count: 3 },
            { type: 'mangudai', count: 2 },
        ],
        regions: ['STEPPE_ANTIQUITY'],
        // 🔴 [2026-10-05 主人定] 蒙古高原·漠北这条线：主干＝二级「城堡时代蒙古军团」，
        //    四代＝古典匈奴／封建回鹘／城堡蒙古／帝国蒙古。
        parentLegion: '城堡时代蒙古军团',
        shipId: 'CANOE',
        buildingStyle: 'MONGOL',
    },
    // 🔴 [2026-10-16 主人令「有重复的三级军团就删除，以后大部分都只套用 257 个二级军团」]
    //   原三级【古典时代赫梯军团】（HITTITES 哈图沙，锥形：古典掷矛手2 / 古典长枪兵3 / 双轮战车高级4）
    //   ＝ 与二级【古典时代赫梯军团】（奥斯曼·古典·安纳托利亚）同名同史，重复，已删。
    //   HITTITES 文化区指针与弗里吉亚／吕底亚／卡帕多西亚三家势力指针仍写「古典时代赫梯军团」，
    //   取数顺序 一级→二级→三级，现在自然落到留下来的那支二级军团。
    {
        name: '古典时代阿拉伯军团',
        formationMode: 'triangle',
        slots: [
            { type: 'militia', count: 2 },
            { type: 'camel_rider', count: 3 },
            { type: 'camel_heavy', count: 4 },
        ],
        regions: ['ORIE_ANTIQUITY'],
        parentLegion: '中东军团',
        shipId: 'BIREME',
        buildingStyle: 'ORIE',
    },
    {
        name: '古典时代雅隆军团',
        formationMode: 'triangle',
        slots: [
            { type: 'antiquity_light_cavalry', count: 2 },
            { type: 'hill_tribesman', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
        regions: ['YARLUNG'],
        // 🔴 [2026-10-05 主人定「归到古典时代羌族军团」] 雅隆（西藏雅鲁藏布江谷地）属羌藏古族。
        parentLegion: '古典时代羌族军团',
        shipId: 'CANOE',
        buildingStyle: 'TIBET',
    },
    // 🔴 [2026-10-05 主人定「按地区划分，删除古典鲜卑。删除」] —— 已删「古典时代鲜卑军团」。
    //    原先挂它的 12 个势力已按主人令改套「古典时代羌族军团」；
    //    其文化区 `NORTHEAST`（7 座）默认军团一并改指「古典时代羌族军团」。
    {
        name: '封建时代萨珊军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'savar', count: 4 },
            { type: 'elite_skirmisher', count: 2 },
            { type: 'laminated_bowman', count: 3 },
        ],
        regions: ['CENTRAL_ASIA_CASTLE'],
        parentLegion: '中亚军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'SASANIAN',
    },
    {
        name: '城堡时代伊利汗军团',
        formationMode: 'triangle',
        slots: [
            { type: 'laminated_bowman', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'keshik', count: 4 },
        ],
        regions: ['ILKHANATE'],
        parentLegion: '中亚军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'CENTRAL_ASIA',
    },
    {
        name: '城堡时代克丘亚军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'champi_warrior', count: 3 },
            { type: 'slinger', count: 4 },
            { type: 'champi_scout', count: 2 },
        ],
        regions: ['ANDE'],
        parentLegion: '城堡时代印加军团',
        shipId: 'CANOE',
        buildingStyle: 'INCA',
    },
    {
        name: '城堡时代十字军团',
        formationMode: 'triangle',
        slots: [
            { type: 'knight', count: 2 },
            { type: 'cavalier', count: 3 },
            { type: 'crusader_knight', count: 4 },
        ],
        regions: ['CRUSADERS'],
        // 🔴 [2026-10-05 主人定「城堡时代十字军团挂法兰克吧」] 十字军主力＝法兰克人
        //    （阿拉伯／拜占庭均称十字军为「法兰克人」），故挂法兰克那条线（封建→城堡两代）。
        parentLegion: '封建时代法兰克军团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'FRANKS',
    },
    {
        name: '城堡时代卡斯蒂利亚军团',
        formationMode: 'echelon',
        slots: [
            { type: 'cavalier', count: 4 },
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'elite_genitour', count: 2 },
        ],
        regions: ['CASTILE'],
        parentLegion: '帝国时代西班牙方阵军团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'SPANISH',
    },
    {
        name: '城堡时代塞尔柱军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'laminated_bowman', count: 2 },
            { type: 'elite_ghulam', count: 4 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
        regions: ['SELJUQ'],
        parentLegion: '城堡时代马穆鲁克军团',
        shipId: 'WAR_GALLEY',
        buildingStyle: 'ORIE',
    },
    {
        name: '城堡时代塞尔维亚军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 3 },
            { type: 'magyar_huszar', count: 4 },
            { type: 'crossbowman', count: 2 },
        ],
        regions: ['SERBIA'],
        parentLegion: '东北欧军团',
        shipId: 'ELITE_LEMBOS',
        buildingStyle: 'BULGARIANS',
    },
    {
        name: '城堡时代大理军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'jian_swordman_shielded', count: 4 },
            { type: 'elite_chukonu', count: 3 },
        ],
        regions: ['DALI'],
        parentLegion: '东亚军团',
        shipId: 'HEAVY_INCENDIARY_SHIP',
        buildingStyle: 'BASHU',
    },
    {
        name: '城堡时代摩洛哥军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_camel_archer', count: 2 },
            { type: 'cavalier', count: 4 },
            { type: 'bowman', count: 3 },
        ],
        regions: ['ALMOHAD'],
        parentLegion: '封建时代柏柏尔骑兵团',
        shipId: 'WAR_GALLEY',
        buildingStyle: 'BERBER',
    },
    {
        name: '城堡时代易洛魁军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'eagle_scout', count: 3 },
            { type: 'iroquois_warrior', count: 4 },
            { type: 'elite_plumed_archer', count: 2 },
        ],
        regions: ['IROQUOIS'],
        parentLegion: '中美军团',
        shipId: 'CANOE',
        buildingStyle: 'AMERICA',
    },
    {
        name: '城堡时代法兰西军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'paladin', count: 3 },
            { type: 'swordsman', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
        regions: ['FRENCH'],
        parentLegion: '城堡时代长弓军团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'BRITONS',
    },
    {
        name: '城堡时代泰罗纳军团',
        formationMode: 'triangle',
        slots: [
            { type: 'blackwood_archer', count: 2 },
            { type: 'guecha_warrior', count: 3 },
            { type: 'temple_guard', count: 4 },
        ],
        regions: ['TAIRONA'],
        parentLegion: '安第斯军团',
        shipId: 'CANOE',
        buildingStyle: 'TUPI',
    },
    {
        name: '城堡时代罗马军团',
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'imperial_centurion', count: 3 },
            { type: 'centurion', count: 2 },
        ],
        regions: ['HRE'],
        parentLegion: '城堡时代德意志骑士团',
        shipId: 'HEAVY_LEMBOS',
        buildingStyle: 'GERMANIC',
    },
    {
        name: '城堡时代罗斯军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_boyar', count: 3 },
            { type: 'two_handed_swordsman', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
        regions: ['RUS'],
        parentLegion: '城堡时代博亚尔重骑军团',
        shipId: 'WAR_GALLEY',
        buildingStyle: 'SLAVIC',
    },
    {
        name: '城堡时代苏格兰军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'heavy_pikeman', count: 4 },
            { type: 'light_cavalry', count: 2 },
            { type: 'two_handed_swordsman', count: 3 },
        ],
        regions: ['SCOTLAND'],
        parentLegion: '西欧军团',
        shipId: 'ELITE_LONGBOAT',
        buildingStyle: 'CELTS',
    },
    {
        name: '城堡时代西亚军团',
        formationMode: 'echelon',
        slots: [
            { type: 'warrior_priest', count: 4 },
            { type: 'monaspa', count: 3 },
            { type: 'elite_composite_bowman', count: 2 },
        ],
        regions: ['WEST_ASIA_CASTLE'],
        parentLegion: '中东军团',
        shipId: 'FIRE_SHIP',
        buildingStyle: 'ORIE',
    },
    {
        name: '城堡时代非洲军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'gbeto', count: 3 },
            { type: 'camel_heavy', count: 4 },
            { type: 'genitour', count: 2 },
        ],
        regions: ['AFRICA_CASTLE'],
        parentLegion: '城堡时代马里军团',
        shipId: 'CANOE',
        buildingStyle: 'AFRICA',
    },
    {
        name: '古典时代高棉军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elephant_archer', count: 2 },
            { type: 'antiquity_spearman', count: 4 },
            { type: 'archer', count: 3 },
        ],
        regions: ['SEASIA_FEUDAL'],
        parentLegion: '东南亚军团',
        shipId: 'FIRE_GALLEY',
        buildingStyle: 'KHMER',
    },
    {
        name: '封建时代伦巴第军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'cavalier', count: 4 },
            { type: 'throwing_axeman', count: 2 },
        ],
        regions: ['LOMBARDS'],
        parentLegion: '地中海军团',
        shipId: 'GALLEY',
        buildingStyle: 'LATIN',
    },
    {
        name: '封建时代凯尔特军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_war_dog', count: 2 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'woad_raider', count: 3 },
        ],
        regions: ['CELTS_FEUDAL'],
        parentLegion: '西欧军团',
        shipId: 'MONOREME',
        buildingStyle: 'CELTS',
    },
    {
        name: '封建时代印度军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'ratha_melee', count: 2 },
            { type: 'shrivamsha_rider', count: 4 },
            { type: 'chakram_thrower', count: 3 },
        ],
        regions: ['INDIA_FEUDAL'],
        parentLegion: '印度军团',
        shipId: 'THIRISADAI',
        buildingStyle: 'INDIA',
    },
    {
        name: '封建时代嚈哒军团',
        formationMode: 'triangle',
        slots: [
            { type: 'bactrian_archer', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'elite_tarkan', count: 4 },
        ],
        regions: ['HEPHTHALITES'],
        parentLegion: '古典时代匈人军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'HUNS',
    },
    {
        name: '封建漠北军团',
        formationMode: 'triangle',
        slots: [
            { type: 'steppe_lancer', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'elite_scythian_horse_archer', count: 4 },
        ],
        regions: ['UIGHUR'],
        // 🔴 [2026-10-05 主人定] 蒙古高原·漠北这条线：主干＝二级「城堡时代蒙古军团」。
        parentLegion: '城堡时代蒙古军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'MONGOL',
    },
    {
        name: '封建时代罗马军团',
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'imperial_centurion', count: 3 },
            { type: 'raider', count: 2 },
        ],
        regions: ['LATIN_FEUDAL'],
        parentLegion: '地中海军团',
        shipId: 'HEAVY_LEMBOS',
        buildingStyle: 'LATIN',
    },
    {
        name: '封建时代斯拉夫军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_boyar', count: 4 },
            { type: 'composite_bowman', count: 3 },
            { type: 'konnik_foot', count: 2 },
        ],
        regions: ['SLAVIC_FEUDAL'],
        parentLegion: '东北欧军团',
        shipId: 'MONOREME',
        buildingStyle: 'SLAVIC',
    },
    {
        name: '封建时代日耳曼军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'light_riders', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'skirmisher', count: 3 },
        ],
        regions: ['GERMANIC_FEUDAL'],
        parentLegion: '西欧军团',
        shipId: 'ELITE_LONGBOAT',
        buildingStyle: 'GERMANIC',
    },
    // 🔴 [2026-10-05 主人令「删掉 封建时代柔然军团，武将归到封建漠北」] —— 已删「封建时代柔然军团」。
    //    文化区 `ROURAN` 的默认军团与挂它的势力一并改指「封建漠北军团」。
    {
        name: '封建时代格鲁吉亚军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'monaspa', count: 3 },
            { type: 'elite_monaspa', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
        regions: ['GEORGIANS'],
        parentLegion: '封建时代阿尼城卫军',
        shipId: 'DROMON',
        buildingStyle: 'ARMENIANS',
    },
    {
        name: '封建时代河中军团',
        formationMode: 'triangle',
        slots: [
            { type: 'sogdian_cataphract', count: 2 },
            { type: 'steppe_lancer', count: 3 },
            { type: 'elite_kipchak', count: 4 },
        ],
        regions: ['CENTRAL_ASIA'],
        parentLegion: '中亚军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'CENTRAL_ASIA',
    },
    {
        name: '封建时代爪哇军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'imperial_skirmisher', count: 3 },
        ],
        regions: ['JAVANESE'],
        parentLegion: '东南亚军团',
        shipId: 'GALLEY',
        buildingStyle: 'MALAY',
    },
    {
        name: '封建时代玛雅军团',
        formationMode: 'crescent',
        slots: [
            { type: 'eagle_warrior', count: 3 },
            { type: 'slinger', count: 2 },
            { type: 'plumed_archer', count: 4 },
        ],
        regions: ['MAYANS'],
        parentLegion: '中美军团',
        shipId: 'CANOE',
        buildingStyle: 'MAYANS',
    },
    {
        name: '封建时代粟特军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_skirmisher', count: 3 },
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'elite_kipchak', count: 2 },
        ],
        regions: ['SOGDIANS'],
        parentLegion: '中亚军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'CENTRAL_ASIA',
    },
    {
        name: '封建时代罗斯军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'boyar', count: 3 },
            { type: 'elite_composite_bowman', count: 4 },
            { type: 'norse_warrior', count: 2 },
        ],
        regions: ['SLAVIC'],
        parentLegion: '东北欧军团',
        shipId: 'MONOREME',
        buildingStyle: 'SLAVIC',
    },
    {
        name: '封建时代草原军团',
        formationMode: 'triangle',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'mangudai', count: 3 },
            { type: 'mangudai_elite', count: 4 },
        ],
        regions: ['STEPPE_FEUDAL'],
        parentLegion: '古典时代匈人军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'HUNS',
    },
    {
        name: '封建时代西亚军团',
        formationMode: 'echelon',
        slots: [
            { type: 'eastern_swordsman', count: 4 },
            { type: 'savar', count: 3 },
            { type: 'composite_bowman', count: 2 },
        ],
        regions: ['WEST_ASIA'],
        parentLegion: '中东军团',
        shipId: 'FIRE_GALLEY',
        buildingStyle: 'ORIE',
    },
    {
        name: '封建时代阿拉伯军团',
        formationMode: 'triangle',
        slots: [
            { type: 'longswordsman', count: 2 },
            { type: 'elite_mameluke', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
        regions: ['ORIE'],
        parentLegion: '中东军团',
        shipId: 'FIRE_GALLEY',
        buildingStyle: 'ORIE',
    },
    // 🔴 [2026-10-05 主人定「封建时代渤海军团，封建时代高句丽军团选一个删除」] —— 已删「封建时代高句丽军团」。
    //    理由：`KOREA` 那 9 座（国内城／平壤／开城／金城／泗沘…）在**朝鲜半岛**，划归朝鲜半岛那条线；
    //    该文化区默认军团改指「封建时代新罗军团」。白山黑水（满洲）那条线：原改名来的「封建时代白山黑水军团」已按主人令删除，封建节点归新名单的「封建时代渤海军团」（`MOHE` 指针已改指它）。
    {
        name: '帝王时代缅甸军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_armored_elephant', count: 2 },
            { type: 'heavy_pikeman', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
        regions: ['SEASIA_IMPERIAL'],
        parentLegion: '东南亚军团',
        shipId: 'FAST_FIRE_SHIP',
        buildingStyle: 'BURMESE',
    },
    {
        name: '帝王时代乌兹别克军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'elite_steppe_lancer', count: 2 },
            { type: 'elite_kipchak', count: 3 },
        ],
        regions: ['CENTRAL_ASIA_IMPERIAL'],
        parentLegion: '中亚军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'CENTRAL_ASIA',
    },
    {
        name: '帝国时代俄罗斯军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'halberdier', count: 3 },
            { type: 'elite_boyar', count: 4 },
            { type: 'hand_cannoneer', count: 2 },
        ],
        regions: ['RUSSIAN'],
        parentLegion: '东北欧军团',
        shipId: 'WAR_GALLEY',
        buildingStyle: 'SLAVIC',
    },
    {
        name: '帝国时代北美军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_jaguar_warrior', count: 3 },
            { type: 'iroquois_warrior', count: 4 },
            { type: 'elite_plumed_archer', count: 2 },
        ],
        regions: ['NORTHAM_IMPERIAL'],
        parentLegion: '中美军团',
        shipId: 'CANOE',
        buildingStyle: 'AMERICA',
    },
    {
        name: '帝国时代南美军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'kona', count: 3 },
            { type: 'elite_kona', count: 4 },
            { type: 'bolas_rider', count: 2 },
        ],
        regions: ['SOUTHAM_IMPERIAL'],
        parentLegion: '安第斯军团',
        shipId: 'CANOE',
        buildingStyle: 'INCA',
    },
    {
        name: '帝国时代印度军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_elephant_archer', count: 2 },
            { type: 'imperial_camel_rider', count: 4 },
            { type: 'elite_ghulam', count: 3 },
        ],
        regions: ['INDIA_IMPERIAL'],
        parentLegion: '印度军团',
        shipId: 'THIRISADAI',
        buildingStyle: 'INDIA',
    },
    {
        name: '帝国时代图皮军团',
        formationMode: 'triangle',
        slots: [
            { type: 'ibirapema_warrior', count: 2 },
            { type: 'elite_blackwood_archer', count: 3 },
            { type: 'elite_ibirapema_warrior', count: 4 },
        ],
        regions: ['TUPI'],
        parentLegion: '城堡时代图皮军团',
        shipId: 'CANOE',
        buildingStyle: 'TUPI',
    },
    {
        name: '帝国时代拉丁军团',
        formationMode: 'echelon',
        slots: [
            { type: 'cavalier', count: 4 },
            { type: 'champion', count: 3 },
            { type: 'hand_cannoneer', count: 2 },
        ],
        regions: ['LATIN_IMPERIAL'],
        parentLegion: '帝国时代西班牙方阵军团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'SPANISH',
    },
    {
        name: '帝国时代斯拉夫军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_boyar', count: 4 },
            { type: 'composite_bowman', count: 3 },
            { type: 'hand_cannoneer', count: 2 },
        ],
        regions: ['SLAVIC_IMPERIAL'],
        parentLegion: '东北欧军团',
        shipId: 'WAR_GALLEY',
        buildingStyle: 'SLAVIC',
    },
    {
        name: '帝国时代日耳曼军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'hussar', count: 2 },
            { type: 'champion', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
        regions: ['GERMANIC_IMPERIAL'],
        parentLegion: '西欧军团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'GERMANIC',
    },
    {
        name: '帝国时代普什图军团',
        formationMode: 'crescent',
        slots: [
            { type: 'hill_tribesman', count: 3 },
            { type: 'camel_rider', count: 2 },
            { type: 'elite_ghulam', count: 4 },
        ],
        regions: ['PASHTUN'],
        parentLegion: '中亚军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'CENTRAL_ASIA',
    },
    {
        name: '帝国时代波斯军团',
        formationMode: 'triangle',
        slots: [
            { type: 'hand_cannoneer', count: 2 },
            { type: 'camel_heavy', count: 3 },
            { type: 'qizilbash_warrior', count: 4 },
        ],
        regions: ['SAFAVID'],
        parentLegion: '波斯军团',
        shipId: 'WAR_GALLEY',
        buildingStyle: 'SASANIAN',
    },
    {
        name: '帝国时代特维尔切军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'bolas_rider', count: 2 },
            { type: 'elite_bolas_rider', count: 4 },
            { type: 'kona', count: 3 },
        ],
        regions: ['TEHUELCHE'],
        parentLegion: '安第斯军团',
        shipId: 'CANOE',
        buildingStyle: 'MAPUCHE',
    },
    {
        name: '帝国时代瑞典军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'heavy_pikeman', count: 4 },
            { type: 'hussar', count: 2 },
        ],
        regions: ['SWEDISH'],
        parentLegion: '西欧军团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'VIKINGS',
    },
    {
        name: '帝国时代锡克军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_chakram_thrower', count: 3 },
            { type: 'urumi_swordsman', count: 4 },
            { type: 'shrivamsha_rider', count: 2 },
        ],
        regions: ['SIKH'],
        parentLegion: '印度军团',
        shipId: 'DEMO_RAFT',
        buildingStyle: 'INDIA',
    },
    {
        name: '帝国时代非洲军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'camel_heavy', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
            { type: 'royal_janissary', count: 2 },
        ],
        regions: ['AFRICA_IMPERIAL'],
        parentLegion: '非洲军团',
        shipId: 'CANNON_GALLEON',
        buildingStyle: 'AFRICA',
    },
    {
        name: '城堡时代岳家军团',
        formationMode: 'echelon',
        slots: [
            { type: 'liao_dao', count: 4 },
            { type: 'elite_chukonu', count: 3 },
            { type: 'elite_keshik', count: 2 },
        ],
        regions: [],
        parentLegion: '东亚军团',
        shipId: 'LOU_CHUAN',
        buildingStyle: 'CENTRAL',
    },
    {
        name: '古典时代摩揭陀军团',
        formationMode: 'triangle',
        slots: [
            { type: 'ratha_ranged', count: 2 },
            { type: 'antiquity_skirmisher', count: 3 },
            { type: 'sickle_warrior', count: 4 },
        ],
        regions: [],
        parentLegion: '古典时代贵霜军团',
        shipId: 'ANT_ELITE_GALLEY',
        buildingStyle: 'PURU',
    },
    {
        name: '古典时代加拉太军团',
        formationMode: 'triangle',
        slots: [
            { type: 'war_chariot', count: 2 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'antiquity_skirmisher', count: 4 },
        ],
        regions: [],
        parentLegion: '古典时代皮克特军团',
        shipId: 'MONOREME',
        buildingStyle: 'CELTS',
    },
    {
        name: '古典时代腓利斯丁军团',
        formationMode: 'crescent',
        slots: [
            { type: 'sparabara', count: 3 },
            { type: 'lancer', count: 2 },
            { type: 'antiquity_skirmisher', count: 4 },
        ],
        regions: [],
        parentLegion: '地中海军团',
        shipId: 'MONOREME',
        buildingStyle: 'GREECE',
    },
    {
        name: '城堡时代佛兰德军团',
        formationMode: 'echelon',
        slots: [
            { type: 'flemish_pikeman', count: 4 },
            { type: 'coustillier', count: 3 },
            { type: 'crossbowman', count: 2 },
        ],
        regions: ['HRE'],
        parentLegion: '城堡时代勃艮第骑士团',
        shipId: 'ELITE_CARAVEL',
        buildingStyle: 'BURGUNDIANS',
    },
    // 🔴 [2026-10-05 主人令「都套用在游戏中」] 瓦良格卫队本体（兵营兵）与精锐首领，二级瓦良格军团的 3 个槽位放不下，单列一支三级军团，
    //    给罗斯（雅罗斯拉夫，瓦良格卫队的发源地）用；时代按 988 年起的卫队与雅罗斯拉夫在位（1019–1054）定为封建。
    {
        name: '封建时代瓦良格卫队军团',
        formationMode: 'echelon',
        slots: [
            { type: 'varangian_guard', count: 4 },
            { type: 'elite_varangian_jarl', count: 3 },
            { type: 'throwing_axeman', count: 2 },
        ],
        regions: ['VARANGIANS'],
        parentLegion: '城堡时代冰湖铁卫军团',
        shipId: 'ELITE_LONGBOAT',
        buildingStyle: 'VARANGIANS',
    },
    {
        name: '古典时代波斯军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'immortal', count: 4 },
            { type: 'immortal_ranged', count: 2 },
            { type: 'savar', count: 3 },
        ],
        regions: [],
        parentLegion: '波斯军团',
        shipId: 'BIREME',
        buildingStyle: 'SASANIAN',
    },
    // ───────────────────────────────────────────────────────────────────
    // 帝国时代·基础城堡兵专属 4 支　【2026-10-16 主人令新建】
    // 四个帝国文明的城堡兵「普通档」落在各自 3 档。
    // ───────────────────────────────────────────────────────────────────
    {
        name: '帝国时代西班牙征服军团',
        formationMode: 'triangle',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
        regions: ['SPANISH'],
        parentLegion: '帝国时代西班牙方阵军团',
        shipId: 'GALLEON',
        buildingStyle: 'SPANISH',
    },
    {
        name: '帝国时代葡萄牙风琴军团',
        formationMode: 'echelon',
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'organ_gun', count: 3 },
            { type: 'pikeman', count: 2 },
        ],
        regions: ['PORTUGUESE'],
        parentLegion: '帝国时代葡萄牙军团',
        shipId: 'CARAVEL',
        buildingStyle: 'PORTUGUESE',
    },
    {
        name: '帝国时代安第斯游击军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_kona', count: 4 },
            { type: 'kona', count: 3 },
            { type: 'bolas_rider', count: 2 },
        ],
        regions: ['MAPUCHE'],
        parentLegion: '帝国时代阿劳卡尼亚军团',
        shipId: 'CANOE',
        buildingStyle: 'MAPUCHE',
    },
    {
        name: '帝国时代苏丹亲兵军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_janissary', count: 4 },
            { type: 'janissary', count: 3 },
            { type: 'hussar', count: 2 },
        ],
        regions: ['OTTOMAN'],
        parentLegion: '帝国时代土耳其军团',
        shipId: 'CANNON_GALLEON',
        buildingStyle: 'TURKS',
    },
];

export const LEVEL_3_LEGION_MAP: ReadonlyMap<string, Level3LegionDef> =
    new Map(LEVEL_3_LEGIONS.map(l => [l.name, l]));

export const LEVEL_3_LEGION_NAMES: ReadonlySet<string> =
    new Set(LEVEL_3_LEGIONS.map(l => l.name));
