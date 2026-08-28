/**
 * MAPWAR 军团方阵编辑器 (Legion Editor)
 * 访问：http://localhost:5173/legion-editor.html
 *
 * 功能：自由编辑和分配 925 势力的 AoE2 DE 决定版军团兵种、阵型与比例。
 * 遵循与 batch-manager 相同的暗黑美学与高效交互规范。
 */

import { FACTIONS } from '../data/factions';
import { CITIES_V2 } from '../data/cities_v2';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { HISTORICAL_FACTION_COLORS } from '../data/HistoricalFactionColors';
import { SANDBOX_DISPLAY_NAMES } from '../data/SandboxDisplayNames';
import { REGION_LABELS, REGION_ORDER, RegionType, getCityRegion } from '../systems/RegionSystem';
import {
    NavalFormationMode,
    NAVAL_FORMATION_LABEL,
    CULTURE_TIERS_MAP,
    CULTURE_FORMATION_MODE,
    FormationMode,
    getDefaultSlotsForMode,
    convertSlotsToMode,
    getCultureLegionName,
} from '../types/CultureFormations';
import { CompositionSlot } from '../types/LegionComposition';
import { FACTION_COMPOSITIONS, CustomFactionLegion } from '../data/FactionCompositions';
import { FACTION_GENERALS } from '../data/FactionGenerals';
import { getExpeditionEliteConfig } from '../data/ExpeditionLegions';

// ============================================================
// 1. 全量 AoE2 DE 兵种字典 (分类定义)
// ============================================================

export type UnitCategory = 'infantry' | 'cavalry' | 'ranged' | 'siege' | 'naval' | 'hero';

/**
 * 兵种时代（与游戏一致的四时代）。
 * 🔴 'unknown' = 待核。这不是"该兵种没有时代"，而是没有可靠依据、拒绝编一个值填进去：
 *    三国 / Chronicles / 契丹 · 女真等较新 DLC 的单位，以及「罗马回归」(AoE1) 素材，
 *    时代归属需要对着游戏逐个确认。图鉴里可一键筛出这一档来补。
 */
export type UnitAge = 'dark' | 'feudal' | 'castle' | 'imperial' | 'unknown';

export const AGE_LABEL: Record<UnitAge, string> = {
    dark: '黑暗时代',
    feudal: '封建时代',
    castle: '城堡时代',
    imperial: '帝王时代',
    unknown: '待核',
};

/** 时代排序权重：按解锁先后，待核永远垫底 */
export const AGE_ORDER: UnitAge[] = ['dark', 'feudal', 'castle', 'imperial', 'unknown'];

/**
 * 类别 → 中文标签（全编辑器唯一出处：列表、弹窗页签、图鉴、右侧面板都读它）
 * 与游戏一致：步兵 / 远程 / 骑兵 / 攻城 / 船只 / 英雄。战象不单列，按其实际作战方式归位——
 * 冲撞类战象归骑兵、象背弓手归远程、弩炮象属攻城器械。
 */
export const CATEGORY_LABEL: Record<UnitCategory, string> = {
    infantry: '步兵',
    cavalry: '骑兵',
    ranged: '远程',
    siege: '攻城',
    naval: '船只',
    hero: '英雄',
};

/**
 * 二级分类（兵种鉴赏网站用）：在每个大类内部再细分，按「拿什么武器 / 骑什么」归类。
 * 判据 = 中文名 + DE 真值（class）交叉核对，不看 ID 名字的英文字面。
 */
export type SubCategory =
    // 步兵
    | 'two_handed' | 'sword_shield' | 'spear' | 'special'
    // 远程
    | 'archer' | 'crossbow' | 'thrown' | 'gunpowder'
    // 骑兵
    | 'melee_cav' | 'horse_archer' | 'elephant' | 'chariot'
    // 攻城
    | 'gunpowder_siege' | 'mechanical'
    // 船只
    | 'galley' | 'fire_ship' | 'cannon_ship' | 'demo_ship' | 'warship'
    // 英雄
    | 'mounted_hero' | 'foot_hero' | 'elephant_hero';

export const SUBCATEGORY_LABEL: Record<SubCategory, string> = {
    two_handed: '双手',
    sword_shield: '刀盾',
    spear: '长矛',
    special: '特殊',
    archer: '弓手',
    crossbow: '弩手',
    thrown: '投掷',
    gunpowder: '火器',
    melee_cav: '战骑',
    horse_archer: '弓骑',
    elephant: '象兵',
    chariot: '战车',
    gunpowder_siege: '热兵器',
    mechanical: '冷兵器',
    galley: '桨帆船',
    fire_ship: '喷火船',
    cannon_ship: '炮舰',
    demo_ship: '爆破船',
    warship: '战舰',
    mounted_hero: '骑马',
    foot_hero: '步战',
    elephant_hero: '象驾',
};

/** 每个大类下有哪些子类（图鉴子类过滤下拉 + 排序都用它） */
export const SUBCATEGORY_BY_CATEGORY: Record<UnitCategory, SubCategory[]> = {
    infantry: ['two_handed', 'sword_shield', 'spear', 'special'],
    ranged: ['archer', 'crossbow', 'thrown', 'gunpowder'],
    cavalry: ['melee_cav', 'horse_archer', 'elephant', 'chariot'],
    siege: ['gunpowder_siege', 'mechanical'],
    naval: ['galley', 'fire_ship', 'cannon_ship', 'demo_ship', 'warship'],
    hero: ['mounted_hero', 'foot_hero', 'elephant_hero'],
};

export interface DeUnitDef {
    id: string;
    name: string;
    /**
     * 兵种类别 —— 唯一真源。
     * 🔴 [2026-08-17] 原先每条还各带一个手写的 categoryLabel 中文标签，两处双写长期不同步
     *    （钦察弓骑/蒙古突骑 category 是 cavalry、标签却写"远程"；攻城槌/投石车/大半战象
     *    被塞进 infantry/ranged，导致"战象/攻城"页签只剩 4 个）。现已删除该字段，
     *    中文标签一律由 CATEGORY_LABEL[category] 派生，不再有第二处可写坏的地方。
     */
    category: UnitCategory;
    /** 该兵种在游戏中的解锁时代；'unknown' 表示待核，见 UnitAge 注释 */
    age: UnitAge;
    pathPrefix: string;
    defaultScale?: number;
}

export const DE_UNITS_CATALOG: DeUnitDef[] = [
    { id: 'swordsman', name: '剑士',           category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/SWORDSMAN/' },
    { id: 'champion', name: '冠军剑士',       category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },
    { id: 'liao_dao', name: '契丹辽刀手',           category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/LIAO_DAO/' },
    { id: 'elite_liao_dao', name: '契丹辽刀手精锐',       category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITE_LIAO_DAO/' },
    { id: 'kamayuk', name: '枪兵长',     category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/KAMAYUK/' },
    { id: 'jian_swordsman', name: '华夏刀剑手',         category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/JIAN_SWORDSMAN/' },
    { id: 'ninja', name: '日本忍者',           category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/NINJA/' },
    { id: 'samurai', name: '日本武士',       category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/SAMURAI_DE/' },
    { id: 'samurai_elite', name: '日本武士精锐',       category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/SAMURAI_ELITE/' },
    { id: 'fire_lancer', name: '南宋火矛手',         category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/FIRE_LANCER/' },
    { id: 'elite_fire_lancer', name: '南宋火矛手高级',     category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITE_FIRE_LANCER/' },
    { id: 'white_feather_guard', name: '蜀白毦兵',         category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/WHITE_FEATHER_GUARD/' },
    { id: 'elite_white_feather_guard', name: '蜀白毦兵精锐',     category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITE_WHITE_FEATHER_GUARD/' },
    { id: 'karambit_warrior', name: '马来爪刀勇士',       category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/KARAMBIT_WARRIOR/' },
    { id: 'karambit_warrior_elite', name: '马来爪刀勇士精锐',   category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/KARAMBIT_WARRIOR_ELITE/' },
    { id: 'elite_guardsman', name: '近卫军高级',     category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITE_GUARDSMAN/' },
    { id: 'eastern_swordsman', name: '东方剑士',       category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/EASTERN_SWORDSMAN/' },
    { id: 'legionary', name: '军团步兵',   category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/LEGIONARY/' },
    { id: 'throwing_axeman', name: '法兰克掷斧兵',         category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/THROWING_AXEMAN/' },
    { id: 'heavy_pikeman', name: '长枪兵重装',     category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/HEAVY_PIKEMAN/' },
    { id: 'pikeman', name: '长枪兵',         category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/PIKEMAN/' },

    { id: 'tiger_rider', name: '魏虎骑兵',         category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/TIGER_RIDER/' },
    { id: 'xianbei_raider', name: '鲜卑掠骑兵',     category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/XIANBEI_RAIDER/' },
    { id: 'iron_pagoda', name: '女真铁浮屠',         category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/IRON_PAGODA/' },
    { id: 'hei_kuang', name: '南北朝黑光铠骑兵',     category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/HEI_KUANG/' },
    { id: 'hei_kuang_heavy', name: '南北朝黑光铠骑兵重装', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/HEI_KUANG_HEAVY/' },
    { id: 'steppe_lancer', name: '草原枪骑兵',       category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/STEPPE_LANCER/' },
    { id: 'elite_steppe_lancer', name: '草原枪骑兵高级',   category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITE_STEPPE_LANCER/' },
    { id: 'keshik', name: '鞑靼怯薛军',         category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/KESHIK/' },
    { id: 'tarkan', name: '匈奴答剌罕骑兵',     category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/TARKAN/' },
    { id: 'elite_tarkan', name: '匈奴答剌罕骑兵精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITE_TARKAN/' },
    { id: 'boyar', name: '斯拉夫贵族铁骑',       category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/BOYAR/' },
    { id: 'savar', name: '萨瓦尔重骑',     category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/SAVAR/' },
    { id: 'camel_heavy', name: '骆驼兵重装',     category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/CAMEL_HEAVY/' },
    { id: 'paladin', name: '游侠(圣骑士)',    category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/PALADIN/' },
    { id: 'coustillier', name: '勃艮第马上轻骑',     category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/COUSTILLIER/' },
    { id: 'light_riders', name: '中世纪轻骑兵',   category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/LIGHT_RIDERS/' },

    { id: 'chukonu', name: '中国诸葛弩',         category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/CHUKONU/' },
    { id: 'elite_chukonu', name: '中国诸葛弩精锐',     category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITE_CHUKONU/' },
    { id: 'longbowman_elite', name: '不列颠长弓兵精锐',     category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/LONGBOWMAN_ELITE/' },
    { id: 'fire_archer', name: '吴火焰弓箭手',     category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/FIRE_ARCHER/' },
    { id: 'elite_fire_archer', name: '吴火焰弓箭手精锐', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/ELITE_FIRE_ARCHER/' },
    { id: 'kipchak', name: '库曼钦察弓骑',       category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/KIPCHAK/' },
    { id: 'elite_kipchak', name: '库曼钦察弓骑精锐',   category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITE_KIPCHAK/' },
    { id: 'mangudai', name: '蒙古突骑',       category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MANGUDAI/' },
    { id: 'mangudai_elite', name: '蒙古突骑精锐',   category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/MANGUDAI_ELITE/' },
    { id: 'rattan_archer', name: '越南藤弓兵',         category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/RATTAN_ARCHER/' },
    { id: 'rattan_archer_elite', name: '越南藤弓兵精锐',     category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/RATTAN_ARCHER_ELITE/' },
    { id: 'imperial_skirmisher', name: '帝王掷矛手',     category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/IMPERIAL_SKIRMISHER/' },
    { id: 'archer', name: '南方步弓手',         category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/ARCHER/' },
    { id: 'cav_archer', name: '骑射手',         category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CAV_ARCHER/' },
    { id: 'cav_archer_heavy', name: '骑射手重装',     category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/CAV_ARCHER_HEAVY/' },
    { id: 'pattiyoda_longbowman', name: '僧伽罗帕提尤达长弓手', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/PATTIYODA_LONGBOWMAN/' },
    { id: 'composite_bowman', name: '亚美尼亚复合弓手',     category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/COMPOSITE_BOWMAN/' },
    { id: 'elite_composite_bowman', name: '亚美尼亚复合弓手精锐', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/ELITE_COMPOSITE_BOWMAN/' },
    { id: 'crossbowman', name: '弩兵',           category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/CROSSBOWMAN/' },
    { id: 'arbalest', name: '劲弩手',         category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ARBALEST/' },
    { id: 'arambai', name: '缅甸飞镖骑兵',       category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ARAMBAI/' },

    { id: 'war_elephant', name: '波斯战象',       category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/WAR_ELEPHANT/' },
    { id: 'battle_elephant', name: '战斗象',         category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/BATTLEELEPHANT/' },
    { id: 'armored_elephant', name: '装甲攻城战象',       category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/ARMORED_ELEPHANT/' },
    { id: 'elite_armored_elephant', name: '装甲攻城战象高级',   category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEARMOREDELEPHANT/' },
    { id: 'ballista_elephant', name: '高棉弩炮战象',       category: 'siege', age: 'castle', pathPrefix: '/SUCAI/BALLISTA_ELEPHANT/' },
    { id: 'elephant_archer', name: '象弓骑兵',       category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELEPHANT_ARCHER/' },
    { id: 'bayinnaung_elephant', name: '莽应龙御驾战象',     category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/BAYINNAUNG_ELEPHANT/' },
    { id: 'dagnajan_elephant', name: '达格纳詹御驾战象',   category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/DAGNAJAN_ELEPHANT/' },
    { id: 'porus_elephant', name: '波鲁斯王战象',     category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/PORUS_ELEPHANT/' },
    { id: 'amazon_archer', name: '亚马逊女弓手', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/AMAZONARCHER/' },
    { id: 'amazon_warrior', name: '亚马逊女战士', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/AMAZONWARRIOR/' },
    { id: 'bactrian_archer', name: '巴克特里亚弓手', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/BACTRIAN_ARCHER/' },
    { id: 'battering_ram', name: '轻型攻城槌', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/BATTERINGRAM/' },
    { id: 'berserk', name: '维京狂战士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/BERSERK/' },
    { id: 'blackwood_archer', name: '图皮黑木弓箭手', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/BLACKWOODARCHER/' },
    { id: 'bolas_rider', name: '马普切套索骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/BOLASRIDER/' },
    { id: 'bombard_cannon', name: '火炮', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/BOMBARDCANNON/' },
    { id: 'camel_archer', name: '柏柏尔骆驼弓骑', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CAMELARCHER/' },
    { id: 'camel_raider', name: '骆驼突袭者', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/CAMEL_RAIDER/' },
    { id: 'camel_rider', name: '骆驼骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CAMELRIDER/' },
    { id: 'camel_scout', name: '古吉拉特骆驼斥候', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/CAMELSCOUT/' },
    { id: 'capped_ram', name: '装甲攻城槌', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/CAPPEDRAM/' },
    { id: 'cataphract', name: '拜占庭圣骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CATAPHRACT/' },
    { id: 'centurion', name: '罗马百夫长', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CENTURION/' },
    { id: 'chakram_thrower', name: '古吉拉特飞轮掷手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/CHAKRAMTHROWER/' },
    { id: 'companion_cavalry', name: '马其顿伙伴骑兵', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/COMPANION_CAVALRY/' },
    { id: 'condottiero', name: '佣兵', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/CONDOTTIERO/' },
    { id: 'conquistador', name: '西班牙征服者', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CONQUISTADOR/' },
    { id: 'cretan_archer', name: '克里特弓箭手', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/CRETAN_ARCHER/' },
    { id: 'eagle_scout', name: '美洲鹰斥候', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/EAGLESCOUT/' },
    { id: 'eagle_warrior', name: '鹰勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/EAGLEWARRIOR/' },
    { id: 'ekdromos', name: '埃克德罗摩斯', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/EKDROMOS/' },
    { id: 'elite_arambai', name: '缅甸飞镖骑兵精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEARAMBAI/' },
    { id: 'elite_ballista_elephant', name: '高棉弩炮战象精锐', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ELITEBALLISTAELEPHANT/' },
    { id: 'elite_battle_elephant', name: '战斗象高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEBATTLEELEPHANT/' },
    { id: 'elite_berserk', name: '维京狂战士精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEBERSERK/' },
    { id: 'elite_blackwood_archer', name: '图皮黑木弓箭手高级', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/ELITEBLACKWOODARCHER/' },
    { id: 'elite_bolas_rider', name: '马普切套索骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEBOLASRIDER/' },
    { id: 'elite_boyar', name: '斯拉夫贵族铁骑精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEBOYAR/' },
    { id: 'elite_camel_archer', name: '柏柏尔骆驼弓骑精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITECAMELARCHER/' },
    { id: 'elite_cataphract', name: '拜占庭圣骑兵精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITECATAPHRACT/' },
    { id: 'elite_centurion', name: '罗马百夫长精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITECENTURION/' },
    { id: 'elite_chakram_thrower', name: '古吉拉特飞轮掷手精锐', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITECHAKRAMTHROWER/' },
    { id: 'elite_champi_warrior', name: '印加尚皮勇士高级', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITECHAMPIWARRIOR/' },
    { id: 'elite_conquistador', name: '西班牙征服者精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITECONQUISTADOR/' },
    { id: 'elite_coustillier', name: '勃艮第马上轻骑精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITECOUSTILLIER/' },
    { id: 'elite_eagle_warrior', name: '鹰勇士高级', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEEAGLEWARRIOR/' },
    { id: 'elite_elephant_archer', name: '象弓骑兵高级', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITEELEPHANTARCHER/' },
    { id: 'elite_gbeto', name: '马里格贝托女兵精锐', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITEGBETO/' },
    { id: 'elite_genitour', name: '标枪骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEGENITOUR/' },
    { id: 'elite_genoese_crossbowman', name: '意大利热那亚弩手精锐', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITEGENOESECROSSBOWMAN/' },
    { id: 'elite_ghulam', name: '印度斯坦古拉姆精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEGHULAM/' },
    { id: 'elite_guecha_warrior', name: '穆伊斯卡格查勇士高级', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/ELITEGUECHAWARRIOR/' },
    { id: 'elite_huskarl', name: '哥特近卫军精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEHUSKARL/' },
    { id: 'elite_hussite_wagon', name: '波希米亚胡斯战车精锐', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ELITEHUSSITEWAGON/' },
    { id: 'elite_ibirapema_warrior', name: '图皮战棍勇士高级', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITEIBIRAPEMAWARRIOR/' },
    { id: 'elite_iron_pagoda', name: '女真铁浮屠精锐', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/ELITEIRONPAGODA/' },
    { id: 'elite_jaguar_warrior', name: '阿兹特克豹勇士精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEJAGUARWARRIOR/' },
    { id: 'elite_janissary', name: '土耳其苏丹亲兵精锐', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITEJANISSARY/' },
    { id: 'elite_kamayuk', name: '印加枪兵长精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEKAMAYUK/' },
    { id: 'elite_keshik', name: '鞑靼怯薛军精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEKESHIK/' },
    { id: 'elite_kona', name: '马普切科纳勇士高级', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/ELITEKONA/' },
    { id: 'elite_konnik', name: '保加利亚骑兵精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEKONNIK/' },
    { id: 'elite_konnik_foot', name: '锤炼兵高级', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEFOOTKONNIK/' },
    { id: 'elite_leitis', name: '立陶宛列提斯精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITELEITIS/' },
    { id: 'elite_magyar_huszar', name: '马扎尔骠骑兵精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEMAGYARHUSZAR/' },
    { id: 'elite_mameluke', name: '萨拉森马穆鲁克精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEMAMELUKE/' },
    { id: 'elite_monaspa', name: '格鲁吉亚莫纳斯帕精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEMONASPA/' },
    { id: 'elite_obuch', name: '波兰奥布奇战锤兵精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEOBUCH/' },
    { id: 'elite_organ_gun', name: '葡萄牙风琴炮精锐', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ELITEORGANGUN/' },
    { id: 'elite_plumed_archer', name: '玛雅羽箭手精锐', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITEPLUMEDARCHER/' },
    { id: 'elite_ratha_melee', name: '孟加拉拉塔战车精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITERATHAMELEE/' },
    { id: 'elite_ratha_ranged', name: '孟加拉拉塔战车(弓)精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITERATHARANGED/' },
    { id: 'elite_scythian_horse_archer', name: '斯基泰骑射手高级', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/' },
    { id: 'elite_serjeant', name: '西西里军士长精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITESERJEANT/' },
    { id: 'elite_shotel_warrior', name: '埃塞俄比亚弯刀勇士精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITESHOTELWARRIOR/' },
    { id: 'elite_shrivamsha_rider', name: '什里瓦姆沙骑手高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITESHRIVAMSHARIDER/' },
    { id: 'elite_skirmisher', name: '掷矛手高级', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITESKIRMISHER/' },
    { id: 'elite_temple_guard', name: '穆伊斯卡神庙守卫高级', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITETEMPLEGUARD/' },
    { id: 'elite_teutonic_knight', name: '条顿武士精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITETEUTONICKNIGHT/' },
    { id: 'elite_throwing_axeman', name: '法兰克掷斧兵精锐', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITETHROWINGAXEMAN/' },
    { id: 'elite_tiger_cavalry', name: '魏虎骑兵精锐', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/ELITETIGERCAVALRY/' },
    { id: 'elite_urumi_swordsman', name: '达罗毗荼软剑士精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEURUMISWORDSMAN/' },
    { id: 'elite_war_chariot', name: '双轮战车高级', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/ELITE_WAR_CHARIOT/' },
    { id: 'elite_war_dog', name: '战犬高级', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITEWARDOG/' },
    { id: 'elite_war_elephant', name: '波斯战象精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEWARELEPHANT/' },
    { id: 'elite_war_wagon', name: '高丽战车精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEWARWAGON/' },
    { id: 'elite_woad_raider', name: '凯尔特靛蓝突袭者精锐', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEWOADRAIDER/' },
    { id: 'flaming_camel', name: '鞑靼火焰骆驼', category: 'siege', age: 'unknown', pathPrefix: '/SUCAI/FLAMINGCAMEL/' },
    { id: 'flemish_pikeman', name: '勃艮第佛兰德民兵', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/FLEMISHPIKEMAN/' },
    { id: 'flemish_pikeman_f', name: '勃艮第佛兰德民兵F', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/FLEMISHPIKEMAN_F/' },
    { id: 'gbeto', name: '马里格贝托女兵', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/GBETO/' },
    { id: 'genitour', name: '标枪骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/GENITOUR/' },
    { id: 'genoese_crossbowman', name: '意大利热那亚弩手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/GENOESECROSSBOWMAN/' },
    { id: 'ghulam', name: '印度斯坦古拉姆', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/GHULAM/' },
    { id: 'greek_noble_cavalry', name: '希腊贵族骑兵', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/GREEK_NOBLE_CAVALRY/' },
    { id: 'grenadier', name: '掷弹兵', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/GRENADIER/' },
    { id: 'guecha_warrior', name: '穆伊斯卡格查勇士', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/GUECHAWARRIOR/' },
    { id: 'hand_cannoneer', name: '火枪手', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/HANDCANNONEER/' },
    { id: 'heavy_rocket_cart', name: '重型火箭车', category: 'siege', age: 'unknown', pathPrefix: '/SUCAI/HEAVYROCKETCART/' },
    { id: 'heavy_scorpion', name: '重型弩炮', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/HEAVYSCORPION/' },
    { id: 'hill_tribesman', name: '山地部落民', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/HILL_TRIBESMAN/' },
    { id: 'hippeus', name: '斯巴达希皮乌斯', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/HIPPEUS/' },
    { id: 'hoplite', name: '希腊重装步兵', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/HOPLITE/' },
    { id: 'houfnice', name: '榴弹炮', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/HOUFNICE/' },
    { id: 'huskarl', name: '哥特近卫军', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/HUSKARL/' },
    { id: 'hussar', name: '骠骑兵', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/HUSSAR/' },
    { id: 'hussite_wagon', name: '波希米亚胡斯战车', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/HUSSITEWAGON/' },
    { id: 'ibirapema_warrior', name: '图皮战棍勇士', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/IBIRAPEMAWARRIOR/' },
    { id: 'immortal', name: '波斯长生军', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/IMMORTAL/' },
    { id: 'immortal_ranged', name: '波斯长生军(弓)', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/RANGED_IMMORTAL/' },
    { id: 'imperial_camel_rider', name: '印度斯坦帝王骆驼骑兵', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/IMPERIALCAMELRIDER/' },
    { id: 'imperial_centurion', name: '帝国百夫长', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/IMPERIALCENTURION/' },
    { id: 'indian_tribesman', name: '印度部落民', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/INDIAN_TRIBESMAN/' },
    { id: 'iroquois_warrior', name: '易洛魁战士', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/IROQUOISWARRIOR/' },
    { id: 'jaguar_warrior', name: '阿兹特克豹勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/JAGUARWARRIOR/' },
    { id: 'janissary', name: '土耳其苏丹亲兵',     category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/JANISSARY/' },
    { id: 'knight', name: '骑士', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/KNIGHT/' },
    { id: 'kona', name: '马普切科纳勇士', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/KONA/' },
    { id: 'konnik', name: '保加利亚骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/KONNIK/' },
    { id: 'konnik_foot', name: '锤炼兵', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/FOOTKONNIK/' },
    { id: 'leitis', name: '立陶宛列提斯', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/LEITIS/' },
    { id: 'longbowman', name: '不列颠长弓兵', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/LONGBOWMAN/' },
    { id: 'magyar_huszar', name: '马扎尔骠骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MAGYARHUSZAR/' },
    { id: 'mameluke', name: '萨拉森马穆鲁克', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MAMELUKE/' },
    { id: 'mangonel', name: '轻型投石车', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/MANGONEL/' },
    { id: 'mercenary_hoplite', name: '希腊雇佣重步兵', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/ELITE_HOPLITE/' },
    { id: 'militia', name: '民兵', category: 'infantry', age: 'dark', pathPrefix: '/SUCAI/MILITIA/' },
    { id: 'monaspa', name: '格鲁吉亚莫纳斯帕', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MONASPA/' },
    { id: 'mounted_trebuchet', name: '骆驼投石机', category: 'siege', age: 'unknown', pathPrefix: '/SUCAI/MOUNTEDTREBUCHET/' },
    { id: 'obuch', name: '波兰奥布奇战锤兵', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/OBUCH/' },
    { id: 'onager', name: '中型投石车', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ONAGER/' },
    { id: 'organ_gun', name: '葡萄牙风琴炮', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ORGANGUN/' },
    { id: 'petard', name: '爆破工兵', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/PETARD/' },
    { id: 'phalangite', name: '马其顿方阵步兵', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/PHALANGITE/' },
    { id: 'plumed_archer', name: '玛雅羽箭手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/PLUMEDARCHER/' },
    { id: 'qizilbash_warrior', name: '红头骑士(奇兹尔巴什)', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/QIZILBASHWARRIOR/' },
    { id: 'ratha_melee', name: '孟加拉拉塔战车', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/RATHAMELEE/' },
    { id: 'ratha_ranged', name: '孟加拉拉塔战车(弓)', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/RATHARANGED/' },
    { id: 'rhodian_slinger', name: '罗得岛投石兵', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/RHODIAN_SLINGER/' },
    { id: 'rhomphaia_warrior', name: '色雷斯长刃斩手', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/RHOMPHAIA_WARRIOR/' },
    { id: 'rocket_cart', name: '火箭车', category: 'siege', age: 'unknown', pathPrefix: '/SUCAI/ROCKETCART/' },
    { id: 'royal_janissary', name: '皇家苏丹亲兵', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/ROYALJANISSARY/' },
    { id: 'sacred_band', name: '底比斯圣队', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/SACRED_BAND/' },
    { id: 'sannahya', name: '孔雀王朝桑纳亚战象', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/SANNAHYA/' },
    { id: 'scorpion', name: '弩炮', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/SCORPION/' },
    { id: 'scythian_axe_cavalry', name: '斯基泰斧骑兵', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/SCYTHIAN_AXE_CAVALRY/' },
    { id: 'scythian_horse_archer', name: '斯基泰骑射手', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/SCYTHIAN_HORSE_ARCHER/' },
    { id: 'serjeant', name: '西西里军士长', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/SERJEANT/' },
    { id: 'shotel_warrior', name: '埃塞俄比亚弯刀勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/SHOTELWARRIOR/' },
    { id: 'shrivamsha_rider', name: '什里瓦姆沙骑手', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/SHRIVAMSHARIDER/' },
    { id: 'sickle_warrior', name: '达罗毗荼镰刀战士', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/SICKLE_WARRIOR/' },
    { id: 'siege_onager', name: '重型攻城投石车', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/SIEGEONAGER/' },
    { id: 'siege_ram', name: '重型攻城槌', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/SIEGERAM/' },
    { id: 'skirmisher', name: '掷矛手', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/SKIRMISHER/' },
    { id: 'slinger', name: '投石兵', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/SLINGER/' },
    { id: 'sogdian_cataphract', name: '粟特甲胄骑兵', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/SOGDIANCATAPHRACT/' },
    { id: 'sparabara', name: '波斯持盾步兵', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/SPARABARA/' },
    { id: 'spearman', name: '长矛兵', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/SPEARMAN/' },
    { id: 'strategos', name: '雅典将军卫队', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/STRATEGOS/' },
    { id: 'takabara', name: '波斯轻盾标枪兵', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/SAKAN_AXEMAN/' },
    { id: 'temple_guard', name: '穆伊斯卡神庙守卫', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/TEMPLEGUARD/' },
    { id: 'teutonic_knight', name: '条顿武士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/TEUTONICKNIGHT/' },
    { id: 'tarantine_cavalry', name: '塔兰丁骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/TARANTINE_CAVALRY/' },
    { id: 'thracian_peltast', name: '色雷斯标枪手', category: 'ranged', age: 'unknown', pathPrefix: '/SUCAI/THRACIAN_PELTAST/' },
    { id: 'traction_trebuchet', name: '牵引投石机', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/TRACTIONTREBUCHET/' },
    { id: 'two_handed_swordsman', name: '双手剑士', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/TWOHANDEDSWORDSMAN/' },
    { id: 'urumi_swordsman', name: '达罗毗荼软剑士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/URUMISWORDSMAN/' },
    { id: 'war_chariot', name: '双轮战车', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/WAR_CHARIOT/' },
    { id: 'war_chariot_ranged', name: '先秦远程战车', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/WARCHARIOT/' },
    { id: 'war_dog', name: '战犬', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/WARDOG/' },
    { id: 'war_wagon', name: '高丽战车', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/WARWAGON/' },
    { id: 'warrior_priest', name: '亚美尼亚修士战士', category: 'infantry', age: 'unknown', pathPrefix: '/SUCAI/WARRIORPRIEST/' },
    { id: 'winged_hussar', name: '翼骑兵', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/WINGEDHUSSAR/' },
    { id: 'woad_raider', name: '凯尔特靛蓝突袭者', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/WOADRAIDER/' },
    { id: 'xolotl_warrior', name: '阿兹特克索洛特尔骑兵', category: 'cavalry', age: 'unknown', pathPrefix: '/SUCAI/XOLOTLWARRIOR/' },

    { id: 'longswordsman', name: '长剑士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/LONGSWORDSMAN/' },

    { id: 'champi_warrior', name: '印加尚皮勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/CHAMPIWARRIOR/' },
    { id: 'champi_runner', name: '印加尚皮飞毛腿', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/CHAMPIRUNNER/' },
    { id: 'champi_scout', name: '印加尚皮斥候', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/CHAMPISCOUT/' },

    { id: 'jian_swordman_unshielded', name: '双手剑士(华夏)', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/JIAN_SWORDMAN_UNSHIELDED/' },

    { id: 'cavalier', name: '骑士重装', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/CAVALIER/' },

    { id: 'flamethrower', name: '猛火油柜(喷火器)', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/FLAMETHROWER/' },
    { id: 'helepolis', name: '希腊赫勒波利斯攻城塔', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/HELEPOLIS/' },
    { id: 'siege_tower', name: '攻城塔', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/SIEGETOWER/' },
    { id: 'halberdier', name: '戟兵', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/HALBERDIER/' },
    { id: 'norse_warrior', name: '诺斯狂暴战士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/NORSE_WARRIOR/' },
    { id: 'sosso_guard', name: '西非索索禁卫军', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/SOSSO_GUARD/' },
    { id: 'elite_greek_cavalry', name: '希腊贵族骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITE_GREEK_CAVALRY/' },
    { id: 'jian_swordman_shielded', name: '持盾刀剑手', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/JIANSWORDMANSHIELDED/' },
    { id: 'levy', name: '征召民兵', category: 'infantry', age: 'dark', pathPrefix: '/SUCAI/LEVY/' },
    { id: 'gastraphetes', name: '希腊腹弩手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/GASTRAPHETES/' },
    { id: 'laminated_bowman', name: '层压复合弓手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/LAMINATED_BOWMAN/' },
    { id: 'recurve_bowman', name: '反曲长弓手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/RECURVE_BOWMAN/' },
    { id: 'paragon', name: '圣殿楷模武士', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/PARAGON/' },
    { id: 'shock_cavalry', name: '冲击重骑兵', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/SHOCK_CAVALRY/' },
    { id: 'imperial_cavalry', name: '帝国具装骑兵', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/IMPERIAL_CAVALRY/' },
    { id: 'equites', name: '罗马伴随骑士', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/EQUITES/' },
    { id: 'sarmatian', name: '萨尔马提亚重骑兵', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/SARMATIAN/' },
    { id: 'elite_peltast', name: '色雷斯标枪手高级', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITE_PELTAST/' },
    { id: 'vanguard', name: '先锋重装步兵', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/VANGUARD/' },
    { id: 'bowman', name: '弓兵', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/BOWMAN/' },
    { id: 'crusader_knight', name: '十字军骑士', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CRUSADERKNIGHT/' },
    { id: 'raider', name: '掠骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/RAIDER/' },
    { id: 'guardsman', name: '近卫军', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/GUARDSMAN/' },
    { id: 'antiquity_skirmisher', name: '古典掷矛手', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/ANTIQUITY_SKIRMISHER/' },
    { id: 'elite_antiquity_skirmisher', name: '古典掷矛手高级', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/' },
    { id: 'antiquity_cavalry_archer', name: '古典骑射手', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ANTIQUITY_CAVALRY_ARCHER/' },
    { id: 'antiquity_heavy_cavalry_archer', name: '古典骑射手重装', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/' },
    { id: 'antiquity_light_cavalry', name: '古典轻骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ANTIQUITY_LIGHT_CAVALRY/' },
    { id: 'antiquity_scout_cavalry', name: '古典斥候骑兵', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/ANTIQUITY_SCOUT_CAVALRY/' },
    { id: 'antiquity_spearman', name: '古典长矛兵', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ANTIQUITY_SPEARMAN/' },
    { id: 'antiquity_battering_ram', name: '古典轻型攻城槌', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ANTIQUITY_BATTERINGRAM/' },
    { id: 'antiquity_capped_ram', name: '古典装甲攻城槌', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ANTIQUITY_CAPPED_RAM/' },
    { id: 'antiquity_scorpion', name: '古典弩炮', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ANTIQUITY_SCORPION/' },
    { id: 'antiquity_heavy_scorpion', name: '古典重型弩炮', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ANTIQUITY_HEAVY_SCORPION/' },
    { id: 'antiquity_mangonel', name: '古典轻型投石车', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ANTIQUITY_MANGONEL/' },
    { id: 'antiquity_onager', name: '古典中型投石车', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ANTIQUITY_ONAGER/' },
    { id: 'antiquity_siege_onager', name: '古典重型投石车', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ANTIQUITY_SIEGE_ONAGER/' },
    { id: 'antiquity_siege_ram', name: '古典重型攻城槌', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ANTIQUITY_SIEGE_RAM/' },
    { id: 'antiquity_siege_tower', name: '古典攻城塔', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ANTIQUITY_SIEGE_TOWER/' },


    // ── 船只 (Ships) ──
    // AoE2 DE 海军单位（16 向，已降采样取偶数向）。游戏内现役只有 galley/war_galley/ant_elite_galley 三档，
    // 其余为图鉴鉴赏用（素材已入库、带 _meta.json）。时代归属除标准线外标 'unknown' 待核。
    { id: 'galley', name: '桨帆船', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI/GALLEY/' },
    { id: 'war_galley', name: '大战舰', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/WAR_GALLEY/' },
    { id: 'ant_galley', name: '古典桨帆船', category: 'naval', age: 'unknown', pathPrefix: '/SUCAI/ANT_GALLEY/' },
    { id: 'ant_war_galley', name: '古典大战舰', category: 'naval', age: 'unknown', pathPrefix: '/SUCAI/ANT_WAR_GALLEY/' },
    { id: 'ant_elite_galley', name: '古典桨帆船高级', category: 'naval', age: 'unknown', pathPrefix: '/SUCAI/ANT_ELITE_GALLEY/' },
    { id: 'fire_galley', name: '喷火桨帆船', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI/FIRE_GALLEY/' },
    { id: 'fire_ship', name: '喷火船', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/FIRE_SHIP/' },
    { id: 'fast_fire_ship', name: '快速喷火船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/FAST_FIRE_SHIP/' },
    { id: 'incendiary_ship', name: '燃烧战船', category: 'naval', age: 'unknown', pathPrefix: '/SUCAI/INCENDIARY_SHIP/' },
    { id: 'heavy_incendiary_ship', name: '重型燃烧战船', category: 'naval', age: 'unknown', pathPrefix: '/SUCAI/HEAVY_INCENDIARY_SHIP/' },
    { id: 'cannon_galleon', name: '炮舰', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/CANNON_GALLEON/' },
    { id: 'elite_cannon_galleon', name: '炮舰高级', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/ELITE_CANNON_GALLEON/' },
    { id: 'caravel', name: '卡拉维尔帆船', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/CARAVEL/' },
    { id: 'elite_caravel', name: '卡拉维尔帆船高级', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/ELITE_CARAVEL/' },
    { id: 'demo_ship', name: '爆破舰', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/DEMO_SHIP/' },
    { id: 'heavy_demo_ship', name: '重型爆破舰', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/HEAVY_DEMO_SHIP/' },
    { id: 'longboat', name: '维京长船', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/LONGBOAT/' },
    { id: 'elite_longboat', name: '维京长船高级', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/ELITE_LONGBOAT/' },
    { id: 'turtle_ship', name: '龟船', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/TURTLE_SHIP/' },
    { id: 'elite_turtle_ship', name: '龟船高级', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/ELITE_TURTLE_SHIP/' },
    { id: 'dragon_ship', name: '龙头战舰', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/DRAGON_SHIP/' },
    { id: 'thirisadai', name: '楼船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/THIRISADAI/' },
    { id: 'catapult_ship', name: '投石舰', category: 'naval', age: 'unknown', pathPrefix: '/SUCAI/CATAPULT_SHIP/' },
    { id: 'onager_ship', name: '重型投石舰', category: 'naval', age: 'unknown', pathPrefix: '/SUCAI/ONAGER_SHIP/' },

    // ── 英雄单位 (Heroes) ──
    { id: 'hero_alaric', name: '英雄·亚拉里克', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ALARIC/' },
    { id: 'hero_algirdas', name: '英雄·阿尔吉尔达斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ALGIRDAS/' },
    { id: 'hero_arariboiamelee', name: '英雄·阿拉里博亚', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ARARIBOIAMELEE/' },
    { id: 'hero_aristagoras', name: '英雄·阿里斯塔哥拉斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ARISTAGORAS/' },
    { id: 'hero_aristides', name: '英雄·阿里斯提德', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ARISTIDES/' },
    { id: 'hero_artaphernes', name: '英雄·阿尔塔弗涅斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ARTAPHERNES/' },
    { id: 'hero_ataulf', name: '英雄·阿陶尔夫', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ATAULF/' },
    { id: 'hero_attila', name: '英雄·阿提拉', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ATTILA/' },
    { id: 'hero_basileus', name: '英雄·巴西琉斯(皇帝)', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/BASILEUS/' },
    { id: 'hero_bayinnaung_elephant', name: '英雄·莽应龙(象驾)', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/BAYINNAUNG_ELEPHANT/' },
    { id: 'hero_bernardarmagnac', name: '英雄·贝尔纳·德·阿马尼亚克', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/BERNARDARMAGNAC/' },
    { id: 'hero_bohemond', name: '英雄·博希蒙德', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/BOHEMOND/' },
    { id: 'hero_brasidas', name: '英雄·巴西达斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/BRASIDAS/' },
    { id: 'hero_caocao', name: '英雄·曹操', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CAOCAO/' },
    { id: 'hero_cleitus', name: '英雄·克雷图斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CLEITUS/' },
    { id: 'hero_cumanchief', name: '英雄·库曼酋长', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CUMANCHIEF/' },
    { id: 'hero_cunhambebe', name: '英雄·昆汉贝贝', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CUNHAMBEBE/' },
    { id: 'hero_cusiyupanqui', name: '英雄·库西尤潘基', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CUSIYUPANQUI/' },
    { id: 'hero_dafyddapgruffydd', name: '英雄·戴菲德', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/DAFYDDAPGRUFFYDD/' },
    { id: 'hero_dagnajan_elephant', name: '英雄·达格纳扬(象兵)', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/DAGNAJAN_ELEPHANT/' },
    { id: 'hero_datis', name: '英雄·达提斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/DATIS/' },
    { id: 'hero_dinhle', name: '英雄·丁礼', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/DINHLE/' },
    { id: 'hero_dismounted_alexander', name: '英雄·步战亚历山大', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/DISMOUNTED_ALEXANDER/' },
    { id: 'hero_mounted_alexander', name: '英雄·骑马亚历山大', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/MOUNTED_ALEXANDER/' },
    { id: 'hero_edwardlongshanks', name: '英雄·长腿爱德华', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/EDWARDLONGSHANKS/' },
    { id: 'hero_gajahmada', name: '英雄·加查·马达', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GAJAHMADA/' },
    { id: 'hero_galvarino', name: '英雄·加尔瓦里诺', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GALVARINO/' },
    { id: 'hero_generalaraiyan', name: '英雄·阿赖扬将军', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GENERALARAIYAN/' },
    { id: 'hero_gidajan', name: '英雄·吉达扬', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GIDAJAN/' },
    { id: 'hero_gilbertdeclare', name: '英雄·吉尔伯特', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GILBERTDECLARE/' },
    { id: 'hero_girgenkhan', name: '英雄·吉尔根汗', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GIRGENKHAN/' },
    { id: 'hero_guacolda', name: '英雄·瓜科尔达', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GUACOLDA/' },
    { id: 'hero_guanyu', name: '英雄·关羽', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/GUANYU/' },
    { id: 'hero_ivaylo', name: '英雄·伊瓦伊洛(骑马)', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/IVAYLO/' },
    { id: 'hero_ivaylofoot', name: '英雄·伊瓦伊洛(步战)', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/IVAYLOFOOT/' },
    { id: 'hero_janzizka', name: '英雄·扬·杰式卡', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/JANZIZKA/' },
    { id: 'hero_joanofarc', name: '英雄·圣女贞德(全甲战马)', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/JOANOFARC/' },
    { id: 'hero_joanthemaid', name: '英雄·奥尔良少女贞德', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/JOANTHEMAID/' },
    { id: 'hero_jogaila', name: '英雄·雅盖沃', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/JOGAILA/' },
    { id: 'hero_johnthefearless', name: '英雄·无畏的约翰', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/JOHNTHEFEARLESS/' },
    { id: 'hero_kestutis', name: '英雄·科斯图提斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/KESTUTIS/' },
    { id: 'hero_kotyankhan', name: '英雄·忽炭汗', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/KOTYANKHAN/' },
    { id: 'hero_kushluk', name: '英雄·屈出律', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/KUSHLUK/' },
    { id: 'hero_lautaro', name: '英雄·劳塔罗', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/LAUTARO/' },
    { id: 'hero_leloi', name: '英雄·黎利', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/LELOI/' },
    { id: 'hero_liubei', name: '英雄·刘备', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/LIUBEI/' },
    { id: 'hero_llywelynapgruffydd', name: '英雄·卢埃林', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/LLYWELYNAPGRUFFYDD/' },
    { id: 'hero_lubu', name: '英雄·吕布', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/LUBU/' },
    { id: 'hero_lysander', name: '英雄·吕山德', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/LYSANDER/' },
    { id: 'hero_macedonian_commander', name: '英雄·马其顿指挥官', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/MACEDONIAN_COMMANDER/' },
    { id: 'hero_osman', name: '英雄·奥斯曼一世', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/OSMAN/' },
    { id: 'hero_pacanchique', name: '英雄·帕坎奇克', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/PACANCHIQUE/' },
    { id: 'hero_pachacuti', name: '英雄·帕查库特克', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/PACHACUTI/' },
    { id: 'hero_parmenion', name: '英雄·帕曼纽', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/PARMENION/' },
    { id: 'hero_perdiccas', name: '英雄·佩尔狄卡斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/PERDICCAS/' },
    { id: 'hero_philipthegood', name: '英雄·好人菲利普', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/PHILIPTHEGOOD/' },
    { id: 'hero_porus_elephant', name: '英雄·波鲁斯(象驾)', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/PORUS_ELEPHANT/' },
    { id: 'hero_prithviraj', name: '英雄·普里特维拉吉', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/PRITHVIRAJ/' },
    { id: 'hero_qutlugh', name: '英雄·忽都鲁', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/QUTLUGH/' },
    { id: 'hero_rajendrachola', name: '英雄·罗贞陀罗·朱罗', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/RAJENDRACHOLA/' },
    { id: 'hero_robertguiscard', name: '英雄·罗贝尔·吉斯卡尔', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ROBERTGUISCARD/' },
    { id: 'hero_rogerbosso', name: '英雄·罗杰·博索', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ROGERBOSSO/' },
    { id: 'hero_sforza', name: '英雄·斯福尔扎', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SFORZA/' },
    { id: 'hero_shahismail', name: '英雄·沙阿·伊斯玛仪', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SHAHISMAIL/' },
    { id: 'hero_strategos', name: '英雄·斯特拉特戈斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/STRATEGOS/' },
    { id: 'hero_subotai', name: '英雄·速不台', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SUBOTAI/' },
    { id: 'hero_sumanguru', name: '英雄·苏曼古鲁', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SUMANGURU/' },
    { id: 'hero_sunce', name: '英雄·孙策', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SUNCE/' },
    { id: 'hero_sundjata', name: '英雄·松迪亚塔', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SUNDJATA/' },
    { id: 'hero_sunjian', name: '英雄·孙坚', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SUNJIAN/' },
    { id: 'hero_sunquan', name: '英雄·孙权', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/SUNQUAN/' },
    { id: 'hero_tariqibnziyad', name: '英雄·塔里克', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/TARIQIBNZIYAD/' },
    { id: 'hero_thoros', name: '英雄·托罗斯', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/THOROS/' },
    { id: 'hero_thracian_chieftain', name: '英雄·色雷斯酋长', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/THRACIAN_CHIEFTAIN/' },
    { id: 'hero_tsarkonstantin', name: '英雄·君士坦丁沙皇', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/TSARKONSTANTIN/' },
    { id: 'hero_ulrichvonjungingen', name: '英雄·容金根', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ULRICHVONJUNGINGEN/' },
    { id: 'hero_vladdracula', name: '英雄·穿刺公德古拉', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/VLADDRACULA/' },
    { id: 'hero_vytautasthegreat', name: '英雄·维陶塔斯大帝', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/VYTAUTASTHEGREAT/' },
    { id: 'hero_williamwallace', name: '英雄·威廉·华莱士', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/WILLIAMWALLACE/' },
    { id: 'hero_yodit', name: '英雄·尤迪特', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/YODIT/' },
    { id: 'hero_zhangfei', name: '英雄·张飞', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ZHANGFEI/' },
];

export const DE_UNITS_MAP = new Map<string, DeUnitDef>(DE_UNITS_CATALOG.map(u => [u.id, u]));

/**
 * 兵种二级分类映射（id → SubCategory），鉴赏网站「子类」字段的唯一真源。
 * 判据 = 中文名（描述性）+ DE unit class 交叉核对，逐条手填，不用关键词启发式一把梭。
 */
export const UNIT_SUBCATEGORY: Record<string, SubCategory> = {
    // ── 步兵 ──
    // 刀盾（单手近战 + 盾：刀/剑/斧/棒/锤等单手兵器，含盾斧兵、盾棒兵）
    swordsman: 'sword_shield', champion: 'sword_shield',
    jian_swordsman: 'sword_shield', samurai: 'sword_shield', samurai_elite: 'sword_shield',
    eastern_swordsman: 'sword_shield', legionary: 'sword_shield', elite_ghulam: 'sword_shield',
    elite_konnik_foot: 'sword_shield', elite_serjeant: 'sword_shield', elite_shotel_warrior: 'sword_shield',
    elite_teutonic_knight: 'sword_shield', elite_woad_raider: 'sword_shield', ghulam: 'sword_shield',
    jian_swordman_shielded: 'sword_shield', konnik_foot: 'sword_shield',
    levy: 'sword_shield', longswordsman: 'sword_shield', militia: 'sword_shield', paragon: 'sword_shield',
    serjeant: 'sword_shield', shotel_warrior: 'sword_shield', teutonic_knight: 'sword_shield',
    vanguard: 'sword_shield', woad_raider: 'sword_shield', condottiero: 'sword_shield',
    takabara: 'sword_shield', champi_warrior: 'sword_shield',
    elite_champi_warrior: 'sword_shield', champi_runner: 'sword_shield', champi_scout: 'sword_shield',
    norse_warrior: 'sword_shield', strategos: 'sword_shield',
    // 长矛（枪/矛/戟/长枪等长杆兵器）
    kamayuk: 'spear', fire_lancer: 'spear', elite_fire_lancer: 'spear', heavy_pikeman: 'spear', pikeman: 'spear',
    liao_dao: 'spear', elite_liao_dao: 'spear', white_feather_guard: 'spear', elite_white_feather_guard: 'spear',
    ekdromos: 'spear', elite_kamayuk: 'spear', flemish_pikeman: 'spear', flemish_pikeman_f: 'spear',
    halberdier: 'spear', hippeus: 'spear', hoplite: 'spear', immortal: 'spear', mercenary_hoplite: 'spear',
    phalangite: 'spear', sosso_guard: 'spear', sparabara: 'spear', spearman: 'spear',
    sacred_band: 'spear', amazon_warrior: 'spear',
    temple_guard: 'spear', elite_temple_guard: 'spear', hill_tribesman: 'spear', indian_tribesman: 'spear',
    guardsman: 'spear', elite_guardsman: 'spear', antiquity_spearman: 'spear',
    // 双手（双手剑/巨斧/战锤/长刃）
    berserk: 'two_handed', elite_berserk: 'two_handed', elite_huskarl: 'two_handed', huskarl: 'two_handed',
    elite_ibirapema_warrior: 'two_handed', ibirapema_warrior: 'two_handed', elite_obuch: 'two_handed', obuch: 'two_handed',
    jian_swordman_unshielded: 'two_handed', rhomphaia_warrior: 'two_handed',
    two_handed_swordsman: 'two_handed',
    // 特殊（野兽/异形兵器/部落奇兵）
    ninja: 'special', karambit_warrior: 'special', karambit_warrior_elite: 'special', eagle_scout: 'special',
    eagle_warrior: 'special', elite_eagle_warrior: 'special', elite_jaguar_warrior: 'special',
    elite_urumi_swordsman: 'special', elite_war_dog: 'special', jaguar_warrior: 'special', urumi_swordsman: 'special',
    war_dog: 'special', warrior_priest: 'special',
    iroquois_warrior: 'special', sickle_warrior: 'special',

    // ── 远程 ──
    // 弓手
    archer: 'archer', bowman: 'archer', longbowman: 'archer', longbowman_elite: 'archer',
    fire_archer: 'archer', elite_fire_archer: 'archer', rattan_archer: 'archer', rattan_archer_elite: 'archer',
    pattiyoda_longbowman: 'archer', composite_bowman: 'archer', elite_composite_bowman: 'archer',
    elephant_archer: 'archer', elite_elephant_archer: 'archer', amazon_archer: 'archer', bactrian_archer: 'archer',
    blackwood_archer: 'archer', elite_blackwood_archer: 'archer', cretan_archer: 'archer',
    elite_plumed_archer: 'archer', plumed_archer: 'archer', immortal_ranged: 'archer',
    laminated_bowman: 'archer', recurve_bowman: 'archer',
    // 弩手
    chukonu: 'crossbow', elite_chukonu: 'crossbow', crossbowman: 'crossbow', arbalest: 'crossbow',
    genoese_crossbowman: 'crossbow', elite_genoese_crossbowman: 'crossbow', gastraphetes: 'crossbow',
    // 投掷
    throwing_axeman: 'thrown', elite_throwing_axeman: 'thrown', imperial_skirmisher: 'thrown',
    chakram_thrower: 'thrown', elite_chakram_thrower: 'thrown', gbeto: 'thrown', elite_gbeto: 'thrown',
    guecha_warrior: 'thrown', elite_guecha_warrior: 'thrown', elite_skirmisher: 'thrown', skirmisher: 'thrown',
    rhodian_slinger: 'thrown', slinger: 'thrown', thracian_peltast: 'thrown', elite_peltast: 'thrown',
    antiquity_skirmisher: 'thrown', elite_antiquity_skirmisher: 'thrown',
    // 火器
    hand_cannoneer: 'gunpowder', grenadier: 'gunpowder', janissary: 'gunpowder', elite_janissary: 'gunpowder',
    royal_janissary: 'gunpowder',

    // ── 骑兵 ──
    // 战骑（近战骑，含骆驼/枪骑/重骑）
    tiger_rider: 'melee_cav', iron_pagoda: 'melee_cav', hei_kuang: 'melee_cav', hei_kuang_heavy: 'melee_cav',
    steppe_lancer: 'melee_cav', elite_steppe_lancer: 'melee_cav', keshik: 'melee_cav', tarkan: 'melee_cav',
    elite_tarkan: 'melee_cav', boyar: 'melee_cav', savar: 'melee_cav', camel_heavy: 'melee_cav', paladin: 'melee_cav',
    coustillier: 'melee_cav', light_riders: 'melee_cav', camel_raider: 'melee_cav', camel_rider: 'melee_cav',
    camel_scout: 'melee_cav', cataphract: 'melee_cav', centurion: 'melee_cav', companion_cavalry: 'melee_cav',
    elite_boyar: 'melee_cav', elite_cataphract: 'melee_cav', elite_centurion: 'melee_cav', elite_coustillier: 'melee_cav',
    elite_iron_pagoda: 'melee_cav', elite_keshik: 'melee_cav', elite_kona: 'melee_cav', elite_konnik: 'melee_cav',
    elite_leitis: 'melee_cav', elite_magyar_huszar: 'melee_cav', elite_mameluke: 'melee_cav', elite_monaspa: 'melee_cav', elite_shrivamsha_rider: 'melee_cav',
    elite_tiger_cavalry: 'melee_cav', greek_noble_cavalry: 'melee_cav', hussar: 'melee_cav',
    imperial_camel_rider: 'melee_cav', imperial_centurion: 'melee_cav', knight: 'melee_cav', kona: 'melee_cav',
    konnik: 'melee_cav', leitis: 'melee_cav', magyar_huszar: 'melee_cav', mameluke: 'melee_cav', monaspa: 'melee_cav',
    qizilbash_warrior: 'melee_cav', scythian_axe_cavalry: 'melee_cav', shrivamsha_rider: 'melee_cav',
    sogdian_cataphract: 'melee_cav', winged_hussar: 'melee_cav', xolotl_warrior: 'melee_cav', cavalier: 'melee_cav',
    elite_greek_cavalry: 'melee_cav', shock_cavalry: 'melee_cav', imperial_cavalry: 'melee_cav', equites: 'melee_cav',
    sarmatian: 'melee_cav', crusader_knight: 'melee_cav', raider: 'melee_cav', antiquity_light_cavalry: 'melee_cav',
    antiquity_scout_cavalry: 'melee_cav',
    // 弓骑（骑射/骑乘火器/标枪骑，class 36 + 23）
    xianbei_raider: 'horse_archer', kipchak: 'horse_archer', elite_kipchak: 'horse_archer', mangudai: 'horse_archer',
    mangudai_elite: 'horse_archer', cav_archer: 'horse_archer', cav_archer_heavy: 'horse_archer', arambai: 'horse_archer',
    bolas_rider: 'horse_archer', camel_archer: 'horse_archer', conquistador: 'horse_archer', elite_arambai: 'horse_archer',
    elite_bolas_rider: 'horse_archer', elite_camel_archer: 'horse_archer', elite_conquistador: 'horse_archer',
    elite_genitour: 'horse_archer', elite_scythian_horse_archer: 'horse_archer', genitour: 'horse_archer',
    scythian_horse_archer: 'horse_archer', tarantine_cavalry: 'horse_archer', antiquity_cavalry_archer: 'horse_archer',
    antiquity_heavy_cavalry_archer: 'horse_archer',
    // 象兵
    war_elephant: 'elephant', battle_elephant: 'elephant', armored_elephant: 'elephant', elite_armored_elephant: 'elephant',
    bayinnaung_elephant: 'elephant', dagnajan_elephant: 'elephant', porus_elephant: 'elephant', sannahya: 'elephant',
    elite_battle_elephant: 'elephant', elite_war_elephant: 'elephant',
    // 战车
    war_chariot: 'chariot', war_chariot_ranged: 'chariot', elite_war_chariot: 'chariot', war_wagon: 'chariot',
    elite_war_wagon: 'chariot', ratha_melee: 'chariot', ratha_ranged: 'chariot', elite_ratha_melee: 'chariot',
    elite_ratha_ranged: 'chariot',

    // ── 攻城 ──
    // 热兵器（火药/火）
    bombard_cannon: 'gunpowder_siege', organ_gun: 'gunpowder_siege', elite_organ_gun: 'gunpowder_siege',
    houfnice: 'gunpowder_siege', rocket_cart: 'gunpowder_siege', heavy_rocket_cart: 'gunpowder_siege',
    flamethrower: 'gunpowder_siege', petard: 'gunpowder_siege', flaming_camel: 'gunpowder_siege',
    // 冷兵器（机械/扭力/重力）
    ballista_elephant: 'mechanical', elite_ballista_elephant: 'mechanical', battering_ram: 'mechanical',
    capped_ram: 'mechanical', hussite_wagon: 'mechanical', elite_hussite_wagon: 'mechanical', heavy_scorpion: 'mechanical',
    mangonel: 'mechanical', mounted_trebuchet: 'mechanical', onager: 'mechanical', scorpion: 'mechanical',
    siege_onager: 'mechanical', siege_ram: 'mechanical', traction_trebuchet: 'mechanical', helepolis: 'mechanical',
    siege_tower: 'mechanical', antiquity_battering_ram: 'mechanical', antiquity_capped_ram: 'mechanical',
    antiquity_scorpion: 'mechanical', antiquity_heavy_scorpion: 'mechanical', antiquity_mangonel: 'mechanical',
    antiquity_onager: 'mechanical', antiquity_siege_onager: 'mechanical', antiquity_siege_ram: 'mechanical',
    antiquity_siege_tower: 'mechanical',

    // ── 船只 ──
    galley: 'galley', war_galley: 'galley', ant_galley: 'galley', ant_war_galley: 'galley', ant_elite_galley: 'galley',
    fire_galley: 'fire_ship', fire_ship: 'fire_ship', fast_fire_ship: 'fire_ship', incendiary_ship: 'fire_ship',
    heavy_incendiary_ship: 'fire_ship',
    cannon_galleon: 'cannon_ship', elite_cannon_galleon: 'cannon_ship', catapult_ship: 'cannon_ship', onager_ship: 'cannon_ship',
    demo_ship: 'demo_ship', heavy_demo_ship: 'demo_ship',
    caravel: 'warship', elite_caravel: 'warship', longboat: 'warship', elite_longboat: 'warship', turtle_ship: 'warship',
    elite_turtle_ship: 'warship', dragon_ship: 'warship', thirisadai: 'warship',

    // ── 英雄（默认骑马；步战/象驾按名显式标）──
    hero_alaric: 'mounted_hero', hero_algirdas: 'mounted_hero', hero_arariboiamelee: 'mounted_hero',
    hero_aristagoras: 'mounted_hero', hero_aristides: 'mounted_hero', hero_artaphernes: 'mounted_hero',
    hero_ataulf: 'mounted_hero', hero_attila: 'mounted_hero', hero_basileus: 'mounted_hero',
    hero_bernardarmagnac: 'mounted_hero', hero_bohemond: 'mounted_hero', hero_brasidas: 'mounted_hero',
    hero_caocao: 'mounted_hero', hero_cleitus: 'mounted_hero', hero_cumanchief: 'mounted_hero',
    hero_cunhambebe: 'mounted_hero', hero_cusiyupanqui: 'mounted_hero', hero_dafyddapgruffydd: 'mounted_hero',
    hero_datis: 'mounted_hero', hero_dinhle: 'mounted_hero', hero_mounted_alexander: 'mounted_hero',
    hero_edwardlongshanks: 'mounted_hero', hero_gajahmada: 'mounted_hero', hero_galvarino: 'mounted_hero',
    hero_generalaraiyan: 'mounted_hero', hero_gidajan: 'mounted_hero', hero_gilbertdeclare: 'mounted_hero',
    hero_girgenkhan: 'mounted_hero', hero_guacolda: 'mounted_hero', hero_guanyu: 'mounted_hero', hero_ivaylo: 'mounted_hero',
    hero_janzizka: 'mounted_hero', hero_joanofarc: 'mounted_hero', hero_jogaila: 'mounted_hero',
    hero_johnthefearless: 'mounted_hero', hero_kestutis: 'mounted_hero', hero_kotyankhan: 'mounted_hero',
    hero_kushluk: 'mounted_hero', hero_lautaro: 'mounted_hero', hero_leloi: 'mounted_hero', hero_liubei: 'mounted_hero',
    hero_llywelynapgruffydd: 'mounted_hero', hero_lubu: 'mounted_hero', hero_lysander: 'mounted_hero',
    hero_macedonian_commander: 'mounted_hero', hero_osman: 'mounted_hero', hero_pacanchique: 'mounted_hero',
    hero_pachacuti: 'mounted_hero', hero_parmenion: 'mounted_hero', hero_perdiccas: 'mounted_hero',
    hero_philipthegood: 'mounted_hero', hero_prithviraj: 'mounted_hero', hero_qutlugh: 'mounted_hero',
    hero_rajendrachola: 'mounted_hero', hero_robertguiscard: 'mounted_hero', hero_rogerbosso: 'mounted_hero',
    hero_sforza: 'mounted_hero', hero_shahismail: 'mounted_hero', hero_strategos: 'mounted_hero',
    hero_subotai: 'mounted_hero', hero_sumanguru: 'mounted_hero', hero_sunce: 'mounted_hero', hero_sundjata: 'mounted_hero',
    hero_sunjian: 'mounted_hero', hero_sunquan: 'mounted_hero', hero_tariqibnziyad: 'mounted_hero', hero_thoros: 'mounted_hero',
    hero_thracian_chieftain: 'mounted_hero', hero_tsarkonstantin: 'mounted_hero', hero_ulrichvonjungingen: 'mounted_hero',
    hero_vladdracula: 'mounted_hero', hero_vytautasthegreat: 'mounted_hero', hero_yodit: 'mounted_hero',
    hero_zhangfei: 'mounted_hero',
    // 步战英雄
    hero_dismounted_alexander: 'foot_hero', hero_ivaylofoot: 'foot_hero', hero_joanthemaid: 'foot_hero',
    hero_williamwallace: 'foot_hero',
    // 象驾英雄
    hero_bayinnaung_elephant: 'elephant_hero', hero_dagnajan_elephant: 'elephant_hero', hero_porus_elephant: 'elephant_hero',
};

/** 取兵种二级分类；未登记返回 undefined（图鉴显示「—」）。 */
export function getUnitSubcategory(id: string): SubCategory | undefined {
    return UNIT_SUBCATEGORY[id];
}

/**
 * 兵种升级档判定：帝国决定版里同一兵种通常有「普通 → 精锐」两档，
 * 部分文明还有帝王/皇家档。这里按中文名前缀 + 英文 ID 前后缀双路识别，
 * 二者任一命中即算高级档（例如 samurai_elite / elite_keshik / hei_kuang_heavy「精锐黑光铠骑兵」）。
 */
export function getUnitTier(u: DeUnitDef): 'elite' | 'base' {
    if (/(精锐|高级|重装|帝王|皇家)/.test(u.name)) return 'elite';
    if (/^(elite_|imperial_|royal_)/.test(u.id)) return 'elite';
    if (/_(elite|heavy)$/.test(u.id)) return 'elite';
    return 'base';
}

/** 旧版兵种 ID（三国志10体系 S10DB 素材）→ 中文名映射 */
const LEGACY_UNIT_NAMES: Record<string, string> = {
    'horse_archer': '弓骑兵',
    'shield': '盾兵',
    'crossbow': '弩兵',
    'spear': '枪兵',
    'lancer': '轻骑兵',
    'general_cavalry': '将骑兵',
    'light_infantry': '轻步兵',
    'heavy_infantry': '重步兵',
    'axe': '斧兵',
    'ballista': '床弩兵',
    'heavy_cavalry': '重骑兵',
    'elephant': '象兵',
    'champion_runner': '印加尚皮飞毛腿',
    'champion_scout': '印加尚皮斥候',
    'ant_scout': '古典斥候骑兵',
};

/** 根据兵种 ID 获取中文显示名（优先 DE 目录 → 旧版映射 → 原始 ID） */
function getUnitDisplayName(unitId: string): string {
    return DE_UNITS_MAP.get(unitId)?.name || LEGACY_UNIT_NAMES[unitId] || unitId;
}

// ============================================================
// 2. 状态模型与数据组织
// ============================================================

interface FactionLegionRow {
    factionId: string;
    factionName: string;
    flagText: string;
    flagColor: string;
    capitalCityId?: string;
    capitalCityName?: string;
    region: RegionType;
    regionLabel: string;
    isCustom: boolean;
    /** 该势力的史实将领名（搜索用：主人习惯按武将找势力，如「施琅」→ wenling） */
    generalName?: string;
    /** 精锐**番号** + tier（如 wenling → 福建水师 T3），出处 ExpeditionLegions。
     *  🔴 番号 ≠ 军团名：军团名是这套三排编成自己的名字，存在 legion.legionName。 */
    eliteName?: string;
    eliteTier?: number;
    /** 军团名称（三排编成这支部队的名字，如「瓦兰吉卫队军团」） */
    legionName?: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    row1Type: string;
    row2Type: string;
    row3Type: string;
}

let localCustomCompositions: Record<string, CustomFactionLegion> = { ...FACTION_COMPOSITIONS };
let allRows: FactionLegionRow[] = [];
let filteredRows: FactionLegionRow[] = [];
let selectedFactionId: string | null = null;
let currentEditingLegion: CustomFactionLegion | null = null;
let clipboardLegion: CustomFactionLegion | null = null;
// 3-layer selection state is declared below

let searchQuery = '';
let selectedRegionFilter: string = 'all';
let selectedStatusFilter: 'all' | 'custom' | 'default' = 'all';
let animState: 'idle' | 'move' | 'attack' = 'idle';
let animDirection: number = 3; // 默认朝南 (3=正南, 0=东北, 1=东, 2=东南, 4=西南, 5=西, 6=西北, 7=北)
let animTimer: number | null = null;
let previewViewMode: 'single' | 'three' | 'phalanx' = 'single';
let singlePreviewRow: number = 0; // 0=前排, 1=中坚, 2=后排
let sortCol: string = 'region';
let sortAsc: boolean = true;

// ── 兵种图鉴视图状态 ──
type MainView = 'factions' | 'units' | 'naval';
let mainView: MainView = 'factions';
let catalogRows: DeUnitDef[] = [];
let catalogSearch = '';
let catalogCatFilter: 'all' | UnitCategory = 'all';
let catalogSubFilter: 'all' | SubCategory = 'all';
let catalogTierFilter: 'all' | 'elite' | 'base' = 'all';
let catalogAgeFilter: 'all' | UnitAge = 'all';
let catalogSortCol: 'name' | 'id' | 'category' | 'subcategory' | 'tier' | 'age' = 'name';
let catalogSortAsc = true;
let selectedUnitId: string | null = null;

// ============================================================
// 3. UI 初始化与注入
// ============================================================

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="le-header">
  <div class="le-title-wrap">
    <div class="le-title">⚔ 军团方阵编辑器</div>
    <span class="le-badge">帝国决定版方阵</span>
  </div>
  <div class="le-header-actions">
    <a href="/" class="le-link">← 返回游戏</a>
    <a href="/batch-manager.html" class="le-link">实体管理</a>
    <a href="/portrait-tuner.html" class="le-link">立绘调校</a>
    <a href="/skill-editor.html" class="le-link">技能管理</a>
    <button type="button" id="le-reload" class="le-btn">刷新数据</button>
    <button type="button" id="le-check-legions" class="le-btn">🧹 检查军团命名</button>
    <button type="button" id="le-save-all" class="le-btn">💾 全部写盘</button>
  </div>
</header>
<div class="le-viewtabs">
  <button type="button" class="le-viewtab active" data-view="factions">⚔ 势力军团编排</button>
  <button type="button" class="le-viewtab" data-view="naval">🚢 海军编排</button>
  <button type="button" class="le-viewtab" data-view="units">🗂 兵种鉴赏 (${DE_UNITS_CATALOG.length})</button>
</div>
<div class="le-toolbar" id="le-toolbar-factions">
  <input id="le-search" class="le-input" type="search" placeholder="搜索 势力 ID / 名称 / 旗号 / 首都 / 武将 / 军团番号…" />
  <select id="le-region-filter" class="le-select">
    <option value="all">全部文化区 (18)</option>
    ${REGION_ORDER.map(r => `<option value="${r}">${REGION_LABELS[r]} (${r})</option>`).join('')}
  </select>
  <select id="le-status-filter" class="le-select">
    <option value="all">全部状态</option>
    <option value="custom">仅已专属定制</option>
    <option value="default">仅文化区默认</option>
  </select>
  <span id="le-stats" class="le-stats">加载中…</span>
</div>
<div class="le-toolbar" id="le-toolbar-units" style="display:none;">
  <input id="le-cat-search" class="le-input" type="search" placeholder="搜索兵种 中文名 / ID / 素材目录…" />
  <select id="le-cat-filter" class="le-select">
    <option value="all">全部类别</option>
    <option value="infantry">🛡️ 步兵</option>
    <option value="cavalry">🐎 骑兵</option>
    <option value="ranged">🏹 远程</option>
    <option value="siege">⚙️ 攻城</option>
    <option value="naval">🚢 船只</option>
    <option value="hero">👑 英雄</option>
  </select>
  <select id="le-sub-filter" class="le-select">
    <option value="all">全部子类</option>
  </select>
  <select id="le-age-filter" class="le-select">
    <option value="all">全部时代</option>
    ${AGE_ORDER.map(a => `<option value="${a}">${a === 'unknown' ? '❓ ' : ''}${AGE_LABEL[a]}</option>`).join('')}
  </select>
  <select id="le-tier-filter" class="le-select">
    <option value="all">全部升级档</option>
    <option value="elite">⭐ 仅精锐 / 帝王档</option>
    <option value="base">仅普通档</option>
  </select>
  <span id="le-cat-stats" class="le-stats">加载中…</span>
</div>
<div class="le-body">
  <!-- 左侧：势力大表 / 兵种图鉴 -->
  <main class="le-main">
    <div id="le-table-wrap" class="le-table-wrap"></div>
    <div id="le-cat-table-wrap" class="le-table-wrap" style="display:none;"></div>
  </main>
  <!-- 右侧：军团配置与实时预览面板 -->
  <aside id="le-panel" class="le-panel">
    <div id="le-panel-content">
      <div class="le-empty-hint">← 请在左侧列表中点击选择一个势力进行军团方阵编辑</div>
    </div>
  </aside>
</div>
<div id="le-toast" class="le-toast"></div>
`;

injectStyles();

const els = {
    search: document.getElementById('le-search') as HTMLInputElement,
    regionFilter: document.getElementById('le-region-filter') as HTMLSelectElement,
    statusFilter: document.getElementById('le-status-filter') as HTMLSelectElement,
    stats: document.getElementById('le-stats')!,
    tableWrap: document.getElementById('le-table-wrap')!,
    panel: document.getElementById('le-panel')!,
    panelContent: document.getElementById('le-panel-content')!,
    toast: document.getElementById('le-toast')!,
    btnReload: document.getElementById('le-reload') as HTMLButtonElement,
    btnSaveAll: document.getElementById('le-save-all') as HTMLButtonElement,
    toolbarFactions: document.getElementById('le-toolbar-factions')!,
    toolbarUnits: document.getElementById('le-toolbar-units')!,
    catSearch: document.getElementById('le-cat-search') as HTMLInputElement,
    catFilter: document.getElementById('le-cat-filter') as HTMLSelectElement,
    subFilter: document.getElementById('le-sub-filter') as HTMLSelectElement,
    tierFilter: document.getElementById('le-tier-filter') as HTMLSelectElement,
    ageFilter: document.getElementById('le-age-filter') as HTMLSelectElement,
    catStats: document.getElementById('le-cat-stats')!,
    catTableWrap: document.getElementById('le-cat-table-wrap')!,
};

/** 输入防抖：兵种搜索每敲一个字要重建整张表 + 重画缩略图，不防抖会明显顿。 */
function debounce<T extends (...args: any[]) => void>(fn: T, ms = 130): (...args: Parameters<T>) => void {
    let timer: number | undefined;
    return (...args: Parameters<T>) => {
        if (timer !== undefined) clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), ms);
    };
}

function injectStyles(): void {
    const s = document.createElement('style');
    s.textContent = `
      .le-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 16px; border-bottom:1px solid #2a2620; background:#141210;
        flex-shrink:0;
      }
      .le-title-wrap { display:flex; align-items:center; gap:10px; }
      .le-title { font-size:18px; font-weight:700; color:#f5e6c8; letter-spacing:1px; }
      .le-badge {
        font-size:11px; background:#2a2416; color:#e0c888;
        border:1px solid #5a4a28; padding:2px 8px; border-radius:10px;
      }
      .le-header-actions { display:flex; gap:12px; align-items:center; }
      .le-link { color:#8ab4c4; font-size:13px; text-decoration:none; }
      .le-link:hover { color:#c8e4f0; text-decoration:underline; }
      .le-toolbar {
        display:flex; gap:12px; align-items:center; padding:8px 16px;
        border-bottom:1px solid #2a2620; background:#12100e; flex-shrink:0;
      }
      .le-input, .le-select {
        background:#1c1916; border:1px solid #3a342c; color:#eee;
        border-radius:4px; padding:6px 10px; font-size:13px; outline:none;
      }
      .le-input:focus, .le-select:focus { border-color:#8a7038; }
      .le-input { width:280px; }
      .le-stats { font-size:12px; color:#a89f8f; flex:1; text-align:right; }
      .le-btn {
        background:#2a2620; color:#e8e0d0; border:1px solid #4a4238;
        border-radius:4px; padding:6px 14px; cursor:pointer; font-size:13px;
        font-weight:600; white-space:nowrap; transition:all 0.15s;
      }
      .le-btn:hover { background:#3a342c; border-color:#6a5e4c; }
      .le-btn-primary { background:#5a4a28; border-color:#8a7038; color:#fff8e8; }
      .le-btn-primary:hover { background:#705c32; border-color:#a88844; }
      .le-btn-warn { background:#5a2828; border-color:#8a3838; color:#ffdede; }
      .le-btn-warn:hover { background:#703232; }
      .le-btn-sm { padding:3px 8px; font-size:12px; }

      /* 视图切换页签 */
      .le-viewtabs {
        display:flex; gap:0; background:#141210; border-bottom:1px solid #2a2620;
        padding:0 16px; flex-shrink:0;
      }
      .le-viewtab {
        background:none; border:none; border-bottom:2px solid transparent;
        color:#a89f8f; font-size:13px; font-weight:bold; padding:9px 18px;
        cursor:pointer; transition:all 0.15s;
      }
      .le-viewtab:hover { color:#f5e6c8; }
      .le-viewtab.active { color:#e0c888; border-bottom-color:#c8a84b; }

      /* 兵种图鉴表 */
      .tier-tag {
        display:inline-block; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:bold;
      }
      .tier-elite { background:#3a2c10; color:#f5d78e; border:1px solid #7a6224; }
      .tier-base  { background:#201e1c; color:#8a8276; border:1px solid #36322c; }
      /* 时代标签：黑暗→封建→城堡→帝王 由暗到亮，待核用醒目的赭红提示需要人工确认 */
      .age-tag {
        display:inline-block; padding:2px 6px; border-radius:3px; font-size:10px;
        font-weight:bold; white-space:nowrap;
      }
      .age-dark     { background:#1a1816; color:#8a8276; border:1px solid #332e28; }
      .age-feudal   { background:#1c2418; color:#9cbe86; border:1px solid #33502c; }
      .age-castle   { background:#1a2230; color:#8ab0dc; border:1px solid #2c4160; }
      .age-imperial { background:#2e2410; color:#f0c860; border:1px solid #6e5420; }
      .age-unknown  { background:#2c1a18; color:#d09080; border:1px solid #5a3028; }

      .cat-tag {
        display:inline-block; padding:2px 6px; border-radius:3px; font-size:10px;
        background:#1a2430; color:#8ab4c4; border:1px solid #2c3f52;
      }
      .sub-tag {
        display:inline-block; padding:2px 6px; border-radius:3px; font-size:10px;
        background:#241f1a; color:#c8b088; border:1px solid #4a3c2a; white-space:nowrap;
      }
      .cell-path { color:#6a6258; font-family:monospace; font-size:10px; }
      td.cell-thumb { padding:2px 8px; }
      .le-cat-thumb {
        width:44px; height:44px; display:block; background:#141210;
        border-radius:3px; image-rendering:pixelated;
      }

      .le-body { flex:1; display:flex; min-height:0; overflow:hidden; }
      .le-main { flex:1; overflow:auto; background:#0e0d0c; }
      .le-panel {
        width:520px; border-left:1px solid #2a2620; background:#12100e;
        overflow-y:auto; padding:16px; flex-shrink:0; display:flex; flex-direction:column;
      }
      /* 只有图鉴视图才加宽到 620：单兵预览的统一比例尺需要这个宽度。
         势力编排视图保持 520，免得把 925 行大表的九列挤没了。 */
      .le-panel.is-units { width:620px; }
      .le-empty-hint {
        color:#7a7266; font-size:13px; text-align:center; padding:60px 20px;
      }

      table.le-table {
        width:100%; border-collapse:collapse; font-size:12px;
      }
      .le-table th {
        background:#1a1816; color:#a89f8f; padding:8px 8px; text-align:left;
        border-bottom:1px solid #2a2620; cursor:pointer; user-select:none;
        position:sticky; top:0; z-index:2; white-space:nowrap;
      }
      .le-table th:hover { color:#f5e6c8; }
      .le-table td {
        padding:6px 8px; border-bottom:1px solid #1a1814; white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis;
      }
      .le-table tr { cursor:pointer; }
      .le-table tr:hover td { background:#1e1c18; }
      .le-table tr.selected td { background:#2a2416 !important; border-bottom-color:#4a3c20; }

      .cell-flag {
        display:inline-block; width:22px; height:22px; line-height:22px;
        text-align:center; border-radius:3px; font-weight:bold; font-size:13px;
        color:#fff; text-shadow:0 1px 2px #000; margin-right:6px; vertical-align:middle;
      }
      .cell-id { color:#8ab4c4; font-family:monospace; margin-left:4px; font-size:11px; }
      .cell-mode { color:#e0c888; font-weight:bold; }
      .cell-unit { color:#d0c8b8; font-size:11px; }
      .status-tag {
        display:inline-block; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:bold;
      }
      .status-custom { background:#1e3820; color:#7cd688; border:1px solid #36663c; }
      .status-default { background:#201e1c; color:#8a8276; border:1px solid #36322c; }

      /* 编辑表单 */
      .le-form-section {
        background:#181614; border:1px solid #2a2620; border-radius:6px;
        padding:12px 14px; margin-bottom:14px;
      }
      .le-section-title {
        color:#f5e6c8; font-size:14px; font-weight:bold; margin-bottom:10px;
        display:flex; justify-content:space-between; align-items:center;
      }
      .le-form-row { margin-bottom:12px; }
      .le-form-row:last-child { margin-bottom:0; }
      
      .le-mode-grid {
        display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;
      }
      .le-mode-btn {
        background:#221f1c; border:1px solid #3a342c; color:#c8bda8;
        padding:8px 4px; border-radius:4px; text-align:center; cursor:pointer;
        font-size:12px; font-weight:bold; transition:all 0.15s;
      }
      .le-mode-btn:hover { background:#2e2a24; border-color:#6a5c48; }
      .le-mode-btn.active {
        background:#4a3c1e; border-color:#c8a84b; color:#fff8e8; box-shadow:0 0 8px rgba(200,168,75,0.25);
      }

      /* 兵种选择行 */
      .le-row-picker {
        background:#1e1c18; border:1px solid #363026; border-radius:6px;
        padding:10px; margin-bottom:8px;
      }
      .le-row-header {
        display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;
      }
      .le-row-title { font-weight:bold; font-size:13px; color:#e0c888; }
      .le-row-scale-wrap { display:flex; align-items:center; gap:6px; font-size:11px; color:#a89f8f; }
      .le-scale-input {
        width:50px; background:#12100e; border:1px solid #3a342c; color:#f5e6c8;
        padding:2px 4px; text-align:center; border-radius:3px; font-size:12px;
      }

      /* 兵种分类选择器 */
      .le-unit-select-btn {
        width:100%; display:flex; justify-content:space-between; align-items:center;
        background:#28241e; border:1px solid #4a4030; color:#fff;
        padding:8px 12px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:bold;
      }
      .le-unit-select-btn:hover { border-color:#c8a84b; background:#322d24; }

      /* Canvas 预览区 */
      .le-preview-wrap {
        background:#0a0908; border:1px solid #2a2620; border-radius:6px;
        padding:8px; margin-bottom:14px; position:relative;
      }
      .le-preview-canvas {
        display:block; width:100%; height:260px; background:#141712;
        border-radius:4px;
      }
      /* 图鉴单兵预览：统一比例尺后最大单位需要 640 高才放得下，见 UNIT_PREVIEW_SCALE。
         pixelated 必须有——放大 2.8 倍的像素素材走默认平滑插值会糊成一团。 */
      .le-unit-canvas { height:640px; image-rendering:pixelated; }
      .le-preview-controls {
        display:flex; gap:8px; align-items:center; margin-top:8px;
      }

      .le-toast {
        position:fixed; bottom:20px; right:20px; padding:10px 18px;
        border-radius:6px; font-size:13px; z-index:1000;
        background:#1a3020; color:#9fd4a8; border:1px solid #3a6a48;
        box-shadow:0 6px 20px rgba(0,0,0,0.6);
        transition: opacity 0.3s;
      }
      .le-toast:empty { display:none; }
      .le-toast.is-error { background:#301a1a; color:#ffb4a8; border-color:#6a3a3a; }

      /* ── 三步向导：选武将 → 选层 → 选军团 → 保存 ── */
      .le-wizard-step {
        border-left:4px solid #c8a84b; background:#191714;
        padding:10px 12px; margin-bottom:12px; border-radius:4px;
      }
      .le-wizard-step .le-step-no {
        font-size:12px; font-weight:bold; color:#c8a84b; letter-spacing:1px;
      }
      .le-wizard-step .le-step-title {
        font-size:14px; font-weight:bold; color:#f5e6c8; margin:2px 0 8px;
      }
      .le-layer-grid { display:flex; gap:8px; }
      .le-layer-btn {
        flex:1; background:#1c1916; border:1px solid #3a342c; border-radius:6px;
        padding:10px 10px; cursor:pointer; text-align:left; transition:all 0.15s;
      }
      .le-layer-btn:hover { background:#24211c; border-color:#6a5e4c; }
      .le-layer-btn.active { background:#3a2c10; border-color:#c8a84b; box-shadow:0 0 0 1px #c8a84b inset; }
      .le-layer-btn .le-layer-title { font-size:13px; font-weight:bold; color:#f5e6c8; }
      .le-layer-btn.active .le-layer-title { color:#f5d78e; }
      .le-layer-btn .le-layer-desc { font-size:10px; color:#a89f8f; margin-top:3px; line-height:1.5; }
      .le-legion-grid {
        display:grid; grid-template-columns:1fr; gap:6px;
        max-height:360px; overflow-y:auto; padding-right:4px;
      }
      .le-legion-card {
        background:#1c1916; border:1px solid #3a342c; border-radius:6px;
        padding:8px 10px; cursor:pointer; transition:all 0.15s;
      }
      .le-legion-card:hover { background:#24211c; border-color:#6a5e4c; }
      .le-legion-card.active {
        background:#2a2416; border-color:#c8a84b; box-shadow:0 0 0 1px #c8a84b inset;
      }
      .le-legion-card .lc-name { font-size:13px; font-weight:bold; color:#f5e6c8; }
      .le-legion-card.active .lc-name { color:#f5d78e; }
      .le-legion-card .lc-meta { font-size:11px; color:#a89f8f; margin-top:2px; line-height:1.5; }
      .le-legion-card .lc-sig { font-size:11px; color:#8ab4c4; margin-top:2px; }
      .le-collapse-toggle {
        display:flex; align-items:center; justify-content:space-between; width:100%;
        background:#1c1916; border:1px solid #3a342c; border-radius:6px;
        padding:9px 12px; cursor:pointer; color:#e8e0d0; font-size:13px; font-weight:bold;
        transition:all 0.15s;
      }
      .le-collapse-toggle:hover { background:#24211c; }
      .le-collapse-body { margin-top:8px; }

      /* Modal 兵种挑选弹窗 */
      .le-modal-overlay {
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.75); z-index:2000;
        display:flex; align-items:center; justify-content:center;
      }
      .le-modal {
        width:650px; max-width:92vw; max-height:85vh; background:#181614;
        border:2px solid #5a4a28; border-radius:8px; box-shadow:0 12px 40px #000;
        display:flex; flex-direction:column; overflow:hidden;
      }
      .le-modal-header {
        padding:12px 16px; background:#221f1a; border-bottom:1px solid #3a342c;
        display:flex; justify-content:space-between; align-items:center;
        color:#f5e6c8; font-size:15px; font-weight:bold;
      }
      .le-modal-tabs {
        display:flex; border-bottom:1px solid #2a2620; background:#141210; padding:0 12px;
      }
      .le-modal-tab {
        padding:10px 16px; font-size:13px; font-weight:bold; color:#a89f8f;
        cursor:pointer; border-bottom:2px solid transparent;
      }
      .le-modal-tab:hover { color:#f5e6c8; }
      .le-modal-tab.active { color:#e0c888; border-bottom-color:#c8a84b; }
      .le-modal-body {
        padding:14px; overflow-y:auto; flex:1; display:grid;
        grid-template-columns: repeat(3, 1fr); gap:8px;
      }
      .le-unit-card {
        background:#201d18; border:1px solid #363024; border-radius:4px;
        padding:8px 10px; cursor:pointer; transition:all 0.15s;
        display:flex; flex-direction:row; align-items:center; gap:8px;
      }
      .le-unit-thumb {
        width:64px; height:64px; flex:0 0 64px; border-radius:3px;
        background:#141210; image-rendering:pixelated;
      }
      .le-unit-card-text { display:flex; flex-direction:column; gap:4px; min-width:0; }
      .le-unit-card:hover {
        background:#302a20; border-color:#c8a84b; transform:translateY(-1px);
      }
      .le-unit-card.active {
        background:#44371c; border-color:#f5d78e;
      }
      .le-unit-card-name { font-weight:bold; font-size:13px; color:#fff8e8; }
      .le-unit-card-id { font-size:11px; font-family:monospace; color:#8ab4c4; }
      .le-unit-card-cat { font-size:10px; color:#c8a84b; }
    `;
    document.head.appendChild(s);
}

function showToast(msg: string, isError: boolean = false): void {
    els.toast.textContent = msg;
    els.toast.className = 'le-toast' + (isError ? ' is-error' : '');
    setTimeout(() => { els.toast.textContent = ''; }, 3500);
}

// ============================================================
// 4. 数据装配与列表构建
// ============================================================

function buildRows(): void {
    const cityMap = new Map(CITIES_V2.map(c => [c.id, c]));
    const capitalMap = new Map<string, string>();
    for (const [fId, cId] of Object.entries(STARTING_CAPITALS)) {
        capitalMap.set(fId, cId);
    }

    allRows = FACTIONS.map(f => {
        const capCityId = capitalMap.get(f.id);
        const capCity = capCityId ? cityMap.get(capCityId) : undefined;
        const region: RegionType = capCity
            ? (capCity.region as RegionType || getCityRegion({ latitude: capCity.lat, longitude: capCity.lng, region: capCity.region }))
            : 'CENTRAL';
        const regionLabel = REGION_LABELS[region] ?? region;
        const flagColor = HISTORICAL_FACTION_COLORS[f.id] || '#8a2020';
        const flagText = SANDBOX_DISPLAY_NAMES[f.id] || f.name.slice(0, 2);

        const custom = localCustomCompositions[f.id];
        const isCustom = !!custom;

        let formationMode: FormationMode = custom?.formationMode ?? CULTURE_FORMATION_MODE[region] ?? 'square';
        let slots: CompositionSlot[] = custom?.slots
            ?? CULTURE_TIERS_MAP[region]?.[0]?.slots
            ?? getDefaultSlotsForMode(formationMode);

        const r1 = slots[0]?.type || 'swordsman';
        const r2 = slots.length > 2 ? slots[1]?.type : slots[0]?.type;
        const r3 = slots[slots.length - 1]?.type || 'archer';

        return {
            factionId: f.id,
            factionName: f.name,
            flagText,
            flagColor,
            capitalCityId: capCityId,
            capitalCityName: capCity?.name || '未知',
            region,
            regionLabel,
            isCustom,
            generalName: FACTION_GENERALS[f.id]?.generalName,
            eliteName: getExpeditionEliteConfig(f.id)?.name,
            eliteTier: getExpeditionEliteConfig(f.id)?.tier,
            legionName: (localCustomCompositions[f.id] as any)?.legionName || undefined,
            formationMode,
            slots,
            row1Type: r1,
            row2Type: r2,
            row3Type: r3,
        };
    });
}

function sortRows(): void {
    filteredRows.sort((a, b) => {
        if (sortCol === 'region') {
            const ia = REGION_ORDER.indexOf(a.region as RegionType);
            const ib = REGION_ORDER.indexOf(b.region as RegionType);
            if (ia !== -1 && ib !== -1 && ia !== ib) {
                return sortAsc ? ia - ib : ib - ia;
            }
            return sortAsc ? a.regionLabel.localeCompare(b.regionLabel, 'zh-CN') : b.regionLabel.localeCompare(a.regionLabel, 'zh-CN');
        }
        if (sortCol === 'isCustom') {
            const na = a.isCustom ? 1 : 0;
            const nb = b.isCustom ? 1 : 0;
            return sortAsc ? na - nb : nb - na;
        }
        let va: any = (a as any)[sortCol] ?? '';
        let vb: any = (b as any)[sortCol] ?? '';
        if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
        return sortAsc ? String(va).localeCompare(String(vb), 'zh-CN') : String(vb).localeCompare(String(va), 'zh-CN');
    });
}

function applyFilter(): void {
    const q = searchQuery.toLowerCase().trim();
    filteredRows = allRows.filter(r => {
        if (selectedRegionFilter !== 'all' && r.region !== selectedRegionFilter) return false;
        if (selectedStatusFilter === 'custom' && !r.isCustom) return false;
        if (selectedStatusFilter === 'default' && r.isCustom) return false;
        if (q) {
            const match = r.factionId.toLowerCase().includes(q)
                || r.factionName.toLowerCase().includes(q)
                || r.flagText.toLowerCase().includes(q)
                || (r.capitalCityName && r.capitalCityName.toLowerCase().includes(q))
                || (r.generalName && r.generalName.toLowerCase().includes(q))
                || (r.eliteName && r.eliteName.toLowerCase().includes(q))
                || (r.legionName && r.legionName.toLowerCase().includes(q));
            if (!match) return false;
        }
        return true;
    });

    sortRows();

    const customCount = allRows.filter(r => r.isCustom).length;
    els.stats.innerHTML = `已定制势力: <b style="color:#7cd688">${customCount}</b> / ${allRows.length} | 当前显示: <b>${filteredRows.length}</b>`;
}

function renderTable(): void {
    if (filteredRows.length === 0) {
        els.tableWrap.innerHTML = `<div class="le-empty-hint">没有匹配的势力</div>`;
        return;
    }

    const sortArrow = (col: string) => sortCol === col ? (sortAsc ? ' <span style="color:#e0c888;">▲</span>' : ' <span style="color:#e0c888;">▼</span>') : '';

    const html = `
    <table class="le-table">
      <thead>
        <tr>
          <th data-col="flagText" style="width:50px;">旗号${sortArrow('flagText')}</th>
          <th data-col="generalName" style="color:#f5e6c8;background:#24201a;">武将 / 势力${sortArrow('generalName')}</th>
          <th data-col="capitalCityName">据点首都${sortArrow('capitalCityName')}</th>
          <th data-col="region" style="width:88px;">文化区${sortArrow('region')}</th>
          <th data-col="formationMode" style="width:100px;">阵型${sortArrow('formationMode')}</th>
          <th data-col="row1Type">前排${sortArrow('row1Type')}</th>
          <th data-col="row2Type">中坚${sortArrow('row2Type')}</th>
          <th data-col="row3Type">后排${sortArrow('row3Type')}</th>
          <th data-col="legionName">军团名${sortArrow('legionName')}</th>
          <th data-col="isCustom" style="width:66px;">状态${sortArrow('isCustom')}</th>
        </tr>
      </thead>
      <tbody>
        ${filteredRows.map(r => `
          <tr data-fid="${r.factionId}" class="${r.factionId === selectedFactionId ? 'selected' : ''}">
            <td><span class="cell-flag" style="background:${r.flagColor}">${r.flagText}</span></td>
            <td>
              <b style="font-size:13px;color:#f5e6c8;">${r.generalName || r.factionName}</b>
              ${r.generalName ? `<div style="font-size:10px;color:#9a9080;">${r.factionName}${r.eliteName ? ` · ${r.eliteName}` : ''}</div>` : ''}
            </td>
            <td>${r.capitalCityName}</td>
            <td><span style="color:#e0c888;font-size:11px;font-weight:bold;">${r.regionLabel}</span></td>
            <td><span class="cell-mode">${getFormationModeLabel(r.formationMode)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row1Type)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row2Type)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row3Type)}</span></td>
            <td>${r.legionName ? `<span style="color:#c9a86a;font-size:11px;">⚔ ${r.legionName}</span>` : `<span style="color:#7a7266;font-size:11px;">—</span>`}</td>
            <td>${r.isCustom ? `<span class="status-tag status-custom">专属</span>` : `<span class="status-tag status-default">默认</span>`}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `;
    els.tableWrap.innerHTML = html;

    els.tableWrap.querySelectorAll('th[data-col]').forEach(th => {
        th.addEventListener('click', () => {
            const col = (th as HTMLElement).dataset.col!;
            if (sortCol === col) {
                sortAsc = !sortAsc;
            } else {
                sortCol = col;
                sortAsc = true;
            }
            sortRows();
            renderTable();
        });
    });

    els.tableWrap.querySelectorAll('tr[data-fid]').forEach(tr => {
        tr.addEventListener('click', () => {
            const fid = (tr as HTMLElement).dataset.fid!;
            selectFaction(fid);
        });
    });
}

function getFormationModeLabel(mode: FormationMode): string {
    switch (mode) {
        case 'square': return '3+3+3 方阵';
        case 'echelon': return '4+3+2 雁行';
        case 'fish_scale': return '3+4+2 鱼鳞';
        case 'crane_wing': return '2+4+3 鹤翼';
        case 'triangle': return '2+3+4 锥形';
        case 'crescent': return '3+2+4 偃月';
        case 'balance_yoke': return '4+2+3 衡轭';
        default: return mode;
    }
}

// ============================================================
// 5. 势力军团编辑面板 (Right Panel)
// ============================================================

function selectFaction(factionId: string): void {
    selectedFactionId = factionId;
    const row = allRows.find(r => r.factionId === factionId);
    if (!row) return;

    // 加载当前军团配置
    const custom = localCustomCompositions[factionId];
    if (custom) {
        currentEditingLegion = {
            legionName: (custom as any).legionName,
            formationMode: custom.formationMode,
            navalFormation: custom.navalFormation ?? 'auto',
            slots: custom.slots.map(s => ({ ...s })),
        };
    } else {
        currentEditingLegion = {
            formationMode: row.formationMode,
            slots: row.slots.map(s => ({ ...s })),
        };
    }

    selectedLayerKey = '';
    selectedLayerTab = resolveCurrentLayer(row);

    renderTable();
    if (mainView === 'naval') renderNavalPanel(row);
    else renderEditPanel(row);
}

/** 取某文化区的默认编成（与 buildRows 的兜底同源，勿另起一套） */
function getRegionDefaultLegion(region: RegionType): CustomFactionLegion {
    const formationMode: FormationMode = CULTURE_FORMATION_MODE[region] ?? 'square';
    const slots: CompositionSlot[] = CULTURE_TIERS_MAP[region]?.[0]?.slots
        ?? getDefaultSlotsForMode(formationMode);
    return { formationMode, slots: slots.map(s => ({ ...s })) };
}

/** 编成摘要：「前排/中坚/后排（阵型）」——写进下拉选项，主人不用逐个试就能挑 */
function legionSummary(mode: FormationMode, slots: CompositionSlot[]): string {
    const r1 = slots[0]?.type || '';
    const r2 = (slots.length > 2 ? slots[1]?.type : slots[0]?.type) || '';
    const r3 = slots[slots.length - 1]?.type || '';
    const names = [r1, r2, r3].map(t => (t ? getUnitDisplayName(t) : '—')).join('/');
    return `${names}（${getFormationModeLabel(mode)}）`;
}

let selectedLayerTab: 'culture' | 'branch' | 'sub' = 'branch';
let selectedLayerKey: string = '';
/** 第二步「选军团」卡片列表的搜索词（按军团名过滤） */
let legionSearchQuery = '';

interface LayerLegionOption {
    key: string;
    label: string;
    legionName: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    description: string;
}

/** 取三层军团体系的全部可选军团 */
function getLayerLegionOptions(layer: 'culture' | 'branch' | 'sub', currentFactionId: string): LayerLegionOption[] {
    if (layer === 'culture') {
        // 第一层：18 大文化区默认军团
        return REGION_ORDER.map(rg => {
            const def = getRegionDefaultLegion(rg);
            const legionName = getCultureLegionName(rg);
            return {
                key: `culture:${rg}`,
                label: `🏛️ ${legionName} (${REGION_LABELS[rg] ?? rg})`,
                legionName,
                formationMode: def.formationMode,
                slots: def.slots.map(s => ({ ...s })),
                description: `${REGION_LABELS[rg] ?? rg}文化默认 · ${legionSummary(def.formationMode, def.slots)}`,
            };
        });
    }

    if (layer === 'branch') {
        // 第二层：支军团（被多武将/势力共享的大军团）
        const branchMap = new Map<string, { fids: string[]; legionName: string; mode: FormationMode; slots: CompositionSlot[] }>();

        for (const row of allRows) {
            const custom = localCustomCompositions[row.factionId];
            const name = custom?.legionName || row.legionName;
            if (!name) continue;
            const mode = custom?.formationMode ?? row.formationMode;
            const slots = custom?.slots ?? row.slots;

            if (!branchMap.has(name)) {
                branchMap.set(name, { fids: [], legionName: name, mode, slots: slots.map(s => ({ ...s })) });
            }
            branchMap.get(name)!.fids.push(row.factionId);
        }

        const options: LayerLegionOption[] = [];
        for (const [name, info] of branchMap.entries()) {
            if (info.fids.length > 1) {
                const generals = info.fids.map(f => (FACTION_GENERALS as any)[f]?.generalName || allRows.find(r => r.factionId === f)?.factionName).filter(Boolean);
                const sampleGens = generals.slice(0, 3).join('/') + (generals.length > 3 ? ` 等${generals.length}将` : '');
                options.push({
                    key: `branch:${name}`,
                    label: `🚩 ${name} (${info.fids.length}将共享: ${sampleGens})`,
                    legionName: name,
                    formationMode: info.mode,
                    slots: info.slots.map(s => ({ ...s })),
                    description: `共享大军团 · ${legionSummary(info.mode, info.slots)}`,
                });
            }
        }
        return options.sort((a, b) => a.legionName.localeCompare(b.legionName, 'zh-Hans-CN'));
    }

    if (layer === 'sub') {
        // 第三层：子军团 = 单武将独享编成的特色军团（同编成同名 = 一个军团，按名聚合）
        const subMap = new Map<string, { fids: string[]; legionName: string; mode: FormationMode; slots: CompositionSlot[] }>();
        for (const row of allRows) {
            if (!row.isCustom) continue;
            const custom = localCustomCompositions[row.factionId];
            const name = custom?.legionName || row.legionName || `${row.factionName}专属军团`;
            if (!name) continue;
            if (!subMap.has(name)) {
                subMap.set(name, {
                    fids: [],
                    legionName: name,
                    mode: custom?.formationMode ?? row.formationMode,
                    slots: (custom?.slots ?? row.slots).map(s => ({ ...s })),
                });
            }
            subMap.get(name)!.fids.push(row.factionId);
        }

        const options: LayerLegionOption[] = [];
        for (const [name, info] of subMap.entries()) {
            // 判据（主人 2026-08-20）：编成对应几个武将 —— ≤1 个 = 第三层；>1 个 = 第二层（branch 已收）
            const genCount = info.fids.filter(f => (FACTION_GENERALS as any)[f]).length;
            if (genCount > 1) continue;
            const fid = info.fids[0];
            const row = allRows.find(r => r.factionId === fid);
            const owner = row?.generalName ? `武将:${row.generalName}` : (row ? `势力:${row.factionName}` : '');
            options.push({
                key: `sub:${name}`,
                label: `⭐ ${name} (${owner} · ${row?.regionLabel ?? ''})`,
                legionName: name,
                formationMode: info.mode,
                slots: info.slots.map(s => ({ ...s })),
                description: `${row?.regionLabel ?? ''} · ${legionSummary(info.mode, info.slots)}`,
            });
        }
        return options.sort((a, b) => a.legionName.localeCompare(b.legionName, 'zh-Hans-CN'));
    }

    return [];
}

/** 层全名（信息卡 / 步骤标题用） */
const LAYER_FULL_LABEL: Record<'culture' | 'branch' | 'sub', string> = {
    culture: '第一层 · 文化军团',
    branch: '第二层 · 支军团',
    sub: '第三层 · 子军团',
};

/** 编成签名：阵型 + slots 的 type:count 序列（同名铁律判据） */
function legionSig(v: { formationMode: string; slots: { type: string; count: number }[] }): string {
    return v.formationMode + '|' + v.slots.map(s => `${s.type}:${s.count}`).join(',');
}

/** 当前军团属于哪一层：按 legionName 在三个层的选项里命中判定（与是否已定制无关） */
function resolveCurrentLayer(row: FactionLegionRow): 'culture' | 'branch' | 'sub' {
    const name = currentEditingLegion?.legionName?.trim();
    if (!name) return 'culture';
    if (getLayerLegionOptions('culture', row.factionId).some(o => o.legionName === name)) return 'culture';
    if (getLayerLegionOptions('branch', row.factionId).some(o => o.legionName === name)) return 'branch';
    return 'sub';
}

/** 军团卡是否处于「当前生效」态：显式选中 > 与当前编辑配置同编成同名 */
function isOptionActive(opt: LayerLegionOption, current: CustomFactionLegion | null): boolean {
    if (selectedLayerKey) return selectedLayerKey === opt.key;
    if (!current) return false;
    if ((current.legionName ?? '').trim() !== opt.legionName) return false;
    if (current.formationMode !== opt.formationMode) return false;
    return legionSig(current) === legionSig(opt);
}

/** 🚢 海军编排面板：独立栏目，与陆军阵型各管各的（主人定：不许混在陆军面板里） */
function renderNavalPanel(row: FactionLegionRow): void {
    if (!currentEditingLegion) return;
    const cur: NavalFormationMode = currentEditingLegion.navalFormation ?? 'auto';
    const desc: Record<NavalFormationMode, string> = {
        auto: '≤4 艘单纵 / ≥5 艘双列（旧行为）',
        column: '鱼贯而行 · 内河海峡最窄不蹭岸',
        double: '纵深减半 · 正面加宽一个船身',
        line: '横向排开 · 舷侧齐射面最大',
        wedge: '旗舰居前 · 后随向两翼斜后展开',
    };
    els.panelContent.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;background:#181614;border:1px solid #2a2620;border-radius:6px;padding:12px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="cell-flag" style="background:${row.flagColor};width:32px;height:32px;line-height:32px;font-size:16px;">${row.flagText}</span>
        <div>
          <div style="font-size:16px;font-weight:bold;color:#f5e6c8;">${currentEditingLegion?.legionName || row.factionName}</div>
          <div style="font-size:11px;color:#a89f8f;margin-top:2px;">首都：${row.capitalCityName} | 文化区：${row.regionLabel}${row.generalName ? ` | 武将：${row.generalName}` : ''}</div>
        </div>
      </div>
    </div>

    <div class="le-form-section">
      <div class="le-section-title">
        <span>舰队队形</span>
        <span style="font-size:11px;color:#a89f8f;font-weight:normal;">船数随兵力自动定（1~8 艘），旗舰领航</span>
      </div>
      <div class="le-mode-grid" style="grid-template-columns: repeat(2, 1fr);">
        ${(['auto', 'column', 'double', 'line', 'wedge'] as NavalFormationMode[]).map(nm => `
          <div class="le-mode-btn ${cur === nm ? 'active' : ''}" data-naval="${nm}">
            <div>${NAVAL_FORMATION_LABEL[nm]}</div>
            <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">${desc[nm]}</div>
          </div>`).join('')}
      </div>
      <div style="font-size:11px;color:#7e7666;margin-top:8px;">海军队形与陆军阵型互不影响：同一势力上岸打陆战用陆军阵型，下水才用这个。</div>
    </div>

    <div style="display:flex;gap:8px;margin-top:14px;">
      <button type="button" id="le-btn-save-naval" class="le-btn le-btn-primary" style="flex:1;">💾 保存【${row.factionName}】海军阵型</button>
    </div>
    `;

    els.panelContent.querySelectorAll('.le-mode-btn[data-naval]').forEach(btn => {
        btn.addEventListener('click', () => {
            const nm = (btn as HTMLElement).dataset.naval as NavalFormationMode;
            if (currentEditingLegion && (currentEditingLegion.navalFormation ?? 'auto') !== nm) {
                currentEditingLegion.navalFormation = nm;
                renderNavalPanel(row);
            }
        });
    });

    document.getElementById('le-btn-save-naval')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        localCustomCompositions[row.factionId] = {
            legionName: currentEditingLegion.legionName,
            formationMode: currentEditingLegion.formationMode,
            navalFormation: currentEditingLegion.navalFormation ?? 'auto',
            slots: currentEditingLegion.slots.map(sl => ({ ...sl })),
        };
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        await saveAllCompositions();
        showToast(`🚢【${row.factionName}】海军阵型已保存并写入文件`);
    });
}

function renderEditPanel(row: FactionLegionRow): void {
    if (!currentEditingLegion) return;

    // 记住「高级微调」折叠面板的展开状态（重渲染时恢复，避免自动收缩）
    const tuneDetailsOpen = (document.getElementById('le-tune-details') as HTMLDetailsElement | null)?.open ?? true;

    const mode = currentEditingLegion.formationMode;
    const slots = currentEditingLegion.slots;

    // 三步向导状态：当前层 / 三层选项 / 当前层可选军团
    const curLayer = resolveCurrentLayer(row);
    const currentLegionName = currentEditingLegion.legionName?.trim()
        || (curLayer === 'culture' ? getCultureLegionName(row.region) : `${row.factionName}军团`);
    const optCulture = getLayerLegionOptions('culture', row.factionId);
    const optBranch = getLayerLegionOptions('branch', row.factionId);
    const optSub = getLayerLegionOptions('sub', row.factionId);
    const activeLayerOpts = selectedLayerTab === 'culture' ? optCulture : selectedLayerTab === 'branch' ? optBranch : optSub;

    const rowLabels = mode === 'triangle'
        ? ['前排尖刀 (2人)', '中坚突击 (3人)', '后排底边 (4人 · 4档主力)']
        : (mode === 'echelon'
            ? ['前排宽阵 (4人 · 4档主力)', '中坚力量 (3人)', '后排压阵 (2人)']
            : (mode === 'fish_scale'
                ? ['前排抵挡 (3人)', '中阔鳞叠 (4人 · 4档主力)', '后排尾收 (2人)']
                : (mode === 'crane_wing'
                    ? ['前排双锋 (2人)', '两翼展开 (4人 · 4档主力)', '后排中军 (3人)']
                    : (mode === 'crescent'
                        ? ['前排拒马 (3人)', '中军枢纽 (2人)', '后排决胜 (4人 · 4档主力)']
                        : (mode === 'balance_yoke'
                            ? ['前排横推 (4人 · 4档主力)', '中军穿插 (2人)', '后排托底 (3人)']
                            : ['前排正线 (3人)', '中列核心 (3人)', '后排压阵 (3人)'])))));

    // 归一化 slot
    const row1Type = slots[0]?.type || 'swordsman';
    const row1Scale = slots[0]?.scale ?? DE_UNITS_MAP.get(row1Type)?.defaultScale ?? 1.0;

    const midIdx = 1;
    const row2Type = slots[midIdx]?.type || slots[0]?.type || 'lancer';
    const row2Scale = slots[midIdx]?.scale ?? DE_UNITS_MAP.get(row2Type)?.defaultScale ?? 1.0;

    const backIdx = slots.length - 1;
    const row3Type = slots[backIdx]?.type || 'archer';
    const row3Scale = slots[backIdx]?.scale ?? DE_UNITS_MAP.get(row3Type)?.defaultScale ?? 1.0;

    const html = `
    <!-- 武将信息卡 -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:#181614;border:1px solid #2a2620;border-radius:6px;padding:12px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="cell-flag" style="background:${row.flagColor};width:32px;height:32px;line-height:32px;font-size:16px;">${row.flagText}</span>
        <div>
          <div style="font-size:17px;font-weight:bold;color:#f5e6c8;">${row.generalName || row.factionName}</div>
          <div style="font-size:11px;color:#a89f8f;margin-top:2px;">势力：${row.factionName} | 据点：${row.capitalCityName} | 文化区：${row.regionLabel}${row.eliteName ? ` | 精锐番号：${row.eliteName} T${row.eliteTier}` : ''}</div>
        </div>
      </div>
      <div>
        ${row.isCustom ? `<span class="status-tag status-custom" style="font-size:12px;padding:4px 8px;">专属定制</span>` : `<span class="status-tag status-default" style="font-size:12px;padding:4px 8px;">文化默认</span>`}
      </div>
    </div>

    <!-- 当前军团状态 -->
    <div style="background:#141210;border:1px solid #2a2620;border-radius:6px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:11px;color:#a89f8f;">当前军团：</span>
      <b style="color:#f5d78e;font-size:13px;">【${currentEditingLegion?.legionName?.trim() || (curLayer === 'culture' ? getCultureLegionName(row.region) : row.factionName + '军团')}】</b>
      <span style="font-size:11px;color:#8ab4c4;">${LAYER_FULL_LABEL[curLayer]} · ${legionSummary(mode, slots)}</span>
    </div>

    <!-- 第一步：选层 -->
    <div class="le-wizard-step">
      <div class="le-step-no">第一步 · 选择层级</div>
      <div class="le-step-title">为【${row.generalName || row.factionName}】选哪一层军团？</div>
      <div class="le-layer-grid">
        <button type="button" class="le-layer-btn ${selectedLayerTab === 'culture' ? 'active' : ''}" data-layer="culture">
          <div class="le-layer-title">🏛️ 第一层 · 文化军团 (${optCulture.length})</div>
          <div class="le-layer-desc">18 大文化区默认<br/>「文化+军团」命名</div>
        </button>
        <button type="button" class="le-layer-btn ${selectedLayerTab === 'branch' ? 'active' : ''}" data-layer="branch">
          <div class="le-layer-title">🚩 第二层 · 支军团 (${optBranch.length})</div>
          <div class="le-layer-desc">多武将共享大军团<br/>「地区/朝代+军团」命名</div>
        </button>
        <button type="button" class="le-layer-btn ${selectedLayerTab === 'sub' ? 'active' : ''}" data-layer="sub">
          <div class="le-layer-title">⭐ 第三层 · 子军团 (${optSub.length})</div>
          <div class="le-layer-desc">单武将专属特色<br/>「特色名+军团」命名</div>
        </button>
      </div>
    </div>

    <!-- 第二步：选军团 -->
    <div class="le-wizard-step">
      <div class="le-step-no">第二步 · 选择军团</div>
      <div class="le-step-title">从【${LAYER_FULL_LABEL[selectedLayerTab]}】中挑选：</div>
      <input id="le-legion-search" class="le-input" type="search" placeholder="🔍 搜索军团名…" value="${legionSearchQuery}" style="width:100%;box-sizing:border-box;margin-bottom:8px;" />
      <div class="le-legion-grid">
        ${filterLegionOptionsByQuery(activeLayerOpts).map(opt => `
          <div class="le-legion-card ${isOptionActive(opt, currentEditingLegion) ? 'active' : ''}" data-key="${opt.key}" title="${opt.label}">
            <div class="lc-name">${opt.legionName}${isOptionActive(opt, currentEditingLegion) ? ' ✓' : ''}</div>
            <div class="lc-meta">${opt.description}</div>
          </div>
        `).join('') || (activeLayerOpts.length
            ? '<div class="le-empty-hint" style="padding:14px;">无匹配军团</div>'
            : '<div class="le-empty-hint" style="padding:14px;">该层暂无军团可选</div>')}
      </div>
      <div style="font-size:11px;color:#8a8070;margin-top:6px;">💡 点击军团卡片立即套用（阵型/兵种/名称联动）；可展开下方「高级微调」细调，最后点底部保存。</div>
    </div>

    <!-- ⚙ 高级微调（折叠） -->
    <details id="le-tune-details" class="le-form-section">
      <summary class="le-collapse-toggle">⚙ 高级微调（阵型 / 三排兵种 / 预览）<span style="color:#8a8070;">▾</span></summary>
      <div class="le-collapse-body">

    <!-- 军团名称 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>军团名称</span>
        <span style="font-size:11px;color:#a89f8f;font-weight:normal;">必须以「军团」二字结尾</span>
      </div>
      <input id="le-legion-name-input" class="le-input" type="text" value="${currentEditingLegion?.legionName || row.legionName || row.factionName + '军团'}" placeholder="例如：秦国军团、大秦长城军团" style="width:100%;font-size:13px;font-weight:bold;color:#f5e6c8;box-sizing:border-box;" />
    </div>

    <!-- 阵型选择 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>1. 阵型选择（七阵体系）</span>
        <span style="font-size:11px;color:#a89f8f;font-weight:normal;">全阵型均为 9 人 · 精锐主力优先置于 4 档</span>
      </div>
      <div class="le-mode-grid" style="grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));">
        <div class="le-mode-btn ${mode === 'square' ? 'active' : ''}" data-mode="square">
          <div>3+3+3 方阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">九宫等边·攻守均衡</div>
        </div>
        <div class="le-mode-btn ${mode === 'echelon' ? 'active' : ''}" data-mode="echelon">
          <div>4+3+2 雁行阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">前排4档·重装推进</div>
        </div>
        <div class="le-mode-btn ${mode === 'fish_scale' ? 'active' : ''}" data-mode="fish_scale">
          <div>3+4+2 鱼鳞阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">中坚4档·重拳突破</div>
        </div>
        <div class="le-mode-btn ${mode === 'crane_wing' ? 'active' : ''}" data-mode="crane_wing">
          <div>2+4+3 鹤翼阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">中坚4档·合围包抄</div>
        </div>
        <div class="le-mode-btn ${mode === 'triangle' ? 'active' : ''}" data-mode="triangle">
          <div>2+3+4 锥形阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">后排4档·后劲冲锋</div>
        </div>
        <div class="le-mode-btn ${mode === 'crescent' ? 'active' : ''}" data-mode="crescent">
          <div>3+2+4 偃月阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">后排4档·后发制人</div>
        </div>
        <div class="le-mode-btn ${mode === 'balance_yoke' ? 'active' : ''}" data-mode="balance_yoke">
          <div>4+2+3 衡轭阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">前排4档·前线硬碰</div>
        </div>
      </div>
    </div>

<!-- 三排兵种选择 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>2. 三排兵种搭配</span>
        <span style="font-size:11px;color:#a89f8f;font-weight:normal;">点击选择兵种</span>
      </div>

      <!-- 排 0 -->
      <div class="le-row-picker">
        <div class="le-row-header">
          <span class="le-row-title">${rowLabels[0]}</span>
          <div class="le-row-scale-wrap">
            缩放: <input type="number" step="0.1" min="0.5" max="2.5" value="${row1Scale}" class="le-scale-input" data-row="0" />
          </div>
        </div>
        <button type="button" class="le-unit-select-btn" data-row="0">
          <span>${getUnitDisplayName(row1Type)}</span>
          <span style="font-size:11px;color:#8ab4c4;">${getUnitDisplayName(row1Type)} ▾</span>
        </button>
      </div>

      <!-- 排 1 -->
      <div class="le-row-picker">
        <div class="le-row-header">
          <span class="le-row-title">${rowLabels[1]}</span>
          <div class="le-row-scale-wrap">
            缩放: <input type="number" step="0.1" min="0.5" max="2.5" value="${row2Scale}" class="le-scale-input" data-row="1" />
          </div>
        </div>
        <button type="button" class="le-unit-select-btn" data-row="1">
          <span>${getUnitDisplayName(row2Type)}</span>
          <span style="font-size:11px;color:#8ab4c4;">${getUnitDisplayName(row2Type)} ▾</span>
        </button>
      </div>

      <!-- 排 2 -->
      <div class="le-row-picker">
        <div class="le-row-header">
          <span class="le-row-title">${rowLabels[2]}</span>
          <div class="le-row-scale-wrap">
            缩放: <input type="number" step="0.1" min="0.5" max="2.5" value="${row3Scale}" class="le-scale-input" data-row="2" />
          </div>
        </div>
        <button type="button" class="le-unit-select-btn" data-row="2">
          <span>${getUnitDisplayName(row3Type)}</span>
          <span style="font-size:11px;color:#8ab4c4;">${getUnitDisplayName(row3Type)} ▾</span>
        </button>
      </div>
    </div>

    <!-- 实时 Canvas 预览 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>3. 军团实时动态预览</span>
        <div style="display:flex;gap:4px;">
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'single' ? 'le-btn-primary' : ''}" id="le-view-single">🔍 单兵特写</button>
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'three' ? 'le-btn-primary' : ''}" id="le-view-three">🛡️ 三排各1兵</button>
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'phalanx' ? 'le-btn-primary' : ''}" id="le-view-phalanx">⚔ 9人方阵</button>
        </div>
      </div>
      <div class="le-preview-wrap">
        <canvas id="le-canvas" class="le-preview-canvas" width="480" height="260"></canvas>
      </div>
      <div class="le-preview-controls">
        <button type="button" class="le-btn le-btn-sm ${animState === 'idle' ? 'le-btn-primary' : ''}" id="le-anim-idle">🧍 待机</button>
        <button type="button" class="le-btn le-btn-sm ${animState === 'move' ? 'le-btn-primary' : ''}" id="le-anim-move">🚶 移动</button>
        <button type="button" class="le-btn le-btn-sm ${animState === 'attack' ? 'le-btn-primary' : ''}" id="le-anim-attack">⚔️ 攻击</button>
        
        ${previewViewMode === 'single' ? `
        <div style="display:flex;gap:4px;margin-left:8px;">
          <button type="button" class="le-btn le-btn-sm ${singlePreviewRow === 0 ? 'le-btn-primary' : ''}" id="le-single-r0">前排</button>
          <button type="button" class="le-btn le-btn-sm ${singlePreviewRow === 1 ? 'le-btn-primary' : ''}" id="le-single-r1">中坚</button>
          <button type="button" class="le-btn le-btn-sm ${singlePreviewRow === 2 ? 'le-btn-primary' : ''}" id="le-single-r2">后排</button>
        </div>
        ` : ''}

        <span style="font-size:12px;color:#a89f8f;margin-left:auto;">朝向:</span>
        <select id="le-anim-dir" class="le-select" style="padding:2px 6px;font-size:12px;">
          <option value="3" ${animDirection === 3 ? 'selected' : ''}>南 (3)</option>
          <option value="2" ${animDirection === 2 ? 'selected' : ''}>东南 (2)</option>
          <option value="1" ${animDirection === 1 ? 'selected' : ''}>东 (1)</option>
          <option value="0" ${animDirection === 0 ? 'selected' : ''}>东北 (0)</option>
          <option value="7" ${animDirection === 7 ? 'selected' : ''}>北 (7)</option>
          <option value="6" ${animDirection === 6 ? 'selected' : ''}>西北 (6)</option>
          <option value="5" ${animDirection === 5 ? 'selected' : ''}>西 (5)</option>
          <option value="4" ${animDirection === 4 ? 'selected' : ''}>西南 (4)</option>
        </select>
      </div>
    </div>

      </div>
    </details>

    <!-- 第三步：保存 -->
    <div class="le-wizard-step" style="border-left-color:#7cd688;">
      <div class="le-step-no">第三步 · 保存</div>
      <div class="le-step-title">确认并落盘</div>
      <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;">
        <button type="button" id="le-btn-save-single" class="le-btn le-btn-primary" style="flex:1;font-size:14px;padding:10px;">💾 为【${row.factionName}】保存【${currentLegionName}】配置</button>
        ${row.isCustom ? `<button type="button" id="le-btn-reset-single" class="le-btn le-btn-warn">🗑️ 恢复文化默认</button>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button type="button" id="le-btn-copy" class="le-btn" style="flex:1;">📋 复制配置</button>
        <button type="button" id="le-btn-paste" class="le-btn" style="flex:1;" ${clipboardLegion ? '' : 'disabled'}>📋 粘贴配置</button>
        <button type="button" id="le-btn-apply-region" class="le-btn" style="flex:1.4;">🌐 一键套用全【${row.regionLabel}】</button>
      </div>
    </div>
    `;

    els.panelContent.innerHTML = html;
    const tuneDetails = document.getElementById('le-tune-details') as HTMLDetailsElement | null;
    if (tuneDetails) tuneDetails.open = tuneDetailsOpen;
    bindPanelEvents(row);
    startCanvasPreview();
}

function bindPanelEvents(row: FactionLegionRow): void {
    // 阵型切换
    els.panelContent.querySelectorAll('.le-mode-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = (btn as HTMLElement).dataset.mode as FormationMode;
            if (currentEditingLegion && currentEditingLegion.formationMode !== mode) {
                currentEditingLegion.formationMode = mode;
                currentEditingLegion.slots = convertSlotsToMode(currentEditingLegion.slots, mode);
                renderEditPanel(row);
            }
        });
    });

    // 兵种选择弹窗打开
    els.panelContent.querySelectorAll('.le-unit-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rowIdx = parseInt((btn as HTMLElement).dataset.row!, 10);
            openUnitPickerModal(row, rowIdx);
        });
    });

    // 比例变更（监听 input+change 以实时响应微调箭头）
    els.panelContent.querySelectorAll('.le-scale-input').forEach(input => {
        const handleScale = () => {
            const rowIdx = parseInt((input as HTMLElement).dataset.row!, 10);
            const scale = parseFloat((input as HTMLInputElement).value) || 1.0;
            if (currentEditingLegion) {
                updateRowScale(currentEditingLegion, rowIdx, scale);
                startCanvasPreview();
            }
        };
        input.addEventListener('input', handleScale);
        input.addEventListener('change', handleScale);
    });

    // 动画切换
    const btnIdle = document.getElementById('le-anim-idle');
    const btnMove = document.getElementById('le-anim-move');
    const btnAttack = document.getElementById('le-anim-attack');
    const selDir = document.getElementById('le-anim-dir') as HTMLSelectElement;

    btnIdle?.addEventListener('click', () => { animState = 'idle'; renderEditPanel(row); });
    btnMove?.addEventListener('click', () => { animState = 'move'; renderEditPanel(row); });
    btnAttack?.addEventListener('click', () => { animState = 'attack'; renderEditPanel(row); });
    selDir?.addEventListener('change', () => { animDirection = parseInt(selDir.value, 10); startCanvasPreview(); });

    // 视图模式切换
    document.getElementById('le-view-single')?.addEventListener('click', () => { previewViewMode = 'single'; renderEditPanel(row); });
    document.getElementById('le-view-three')?.addEventListener('click', () => { previewViewMode = 'three'; renderEditPanel(row); });
    document.getElementById('le-view-phalanx')?.addEventListener('click', () => { previewViewMode = 'phalanx'; renderEditPanel(row); });
    document.getElementById('le-single-r0')?.addEventListener('click', () => { singlePreviewRow = 0; renderEditPanel(row); });
    document.getElementById('le-single-r1')?.addEventListener('click', () => { singlePreviewRow = 1; renderEditPanel(row); });
    document.getElementById('le-single-r2')?.addEventListener('click', () => { singlePreviewRow = 2; renderEditPanel(row); });

    // 保存单条专属
    document.getElementById('le-btn-save-single')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        const savedLegionName = currentEditingLegion.legionName?.trim()
            || (resolveCurrentLayer(row) === 'culture' ? getCultureLegionName(row.region) : `${row.factionName}军团`);

        // 军团改名：若改了名且旧名被其他势力共享，则同步改名，保证「同名 = 同一军团」
        const newLegionName = currentEditingLegion.legionName?.trim();
        const oldLegionName = localCustomCompositions[row.factionId]?.legionName?.trim();
        let syncCount = 0;
        if (newLegionName && oldLegionName && oldLegionName !== newLegionName) {
            for (const fid of Object.keys(localCustomCompositions)) {
                const comp = localCustomCompositions[fid];
                if (fid !== row.factionId && comp?.legionName === oldLegionName) {
                    localCustomCompositions[fid] = { ...comp, legionName: newLegionName };
                    syncCount++;
                }
            }
        }

        localCustomCompositions[row.factionId] = {
            legionName: currentEditingLegion.legionName,
            formationMode: currentEditingLegion.formationMode,
            navalFormation: currentEditingLegion.navalFormation ?? 'auto',
            slots: currentEditingLegion.slots.map(s => ({ ...s })),
        };
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        // [2026-08-20] 点保存 = 直接落盘。原来分「存内存」+「顶部保存全部配置」两步，
        // 结果就是主人点了保存、刷新后没了（实锤「保存不上」）。所见即所存，不留陷阱。
        await saveAllCompositions();
        showToast(`✅ 已为【${row.factionName}】保存【${savedLegionName}】配置并写入文件`
            + (syncCount > 0 ? `；军团改名同步更新了 ${syncCount} 个共享同名势力` : ''));
    });

    // 重置恢复默认
    document.getElementById('le-btn-reset-single')?.addEventListener('click', async () => {
        delete localCustomCompositions[row.factionId];
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        await saveAllCompositions();
        showToast(`🗑️ 已恢复【${row.factionName}】为文化默认并写入文件`);
    });

    // ── 三步向导 · 第一步：选层 ──
    els.panelContent.querySelectorAll('.le-layer-btn[data-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = (btn as HTMLElement).dataset.layer as 'culture' | 'branch' | 'sub';
            if (selectedLayerTab === layer) return;
            selectedLayerTab = layer;
            selectedLayerKey = '';
            renderEditPanel(row);
        });
    });

    // ── 三步向导 · 第二步：选军团（选中即套用） ──
    els.panelContent.querySelectorAll('.le-legion-card[data-key]').forEach(card => bindLegionCard(card as HTMLElement, row));

    // 第二步军团搜索：只重绘卡片网格，保持搜索框焦点
    const legionSearchInput = document.getElementById('le-legion-search') as HTMLInputElement | null;
    legionSearchInput?.addEventListener('input', () => {
        legionSearchQuery = legionSearchInput.value;
        renderLegionCardGrid(row);
    });

    document.getElementById('le-legion-name-input')?.addEventListener('input', (e) => {
        if (currentEditingLegion) {
            currentEditingLegion.legionName = (e.target as HTMLInputElement).value;
        }
    });

    document.getElementById('le-btn-copy')?.addEventListener('click', () => {
        if (!currentEditingLegion) return;
        clipboardLegion = {
            formationMode: currentEditingLegion.formationMode,
            slots: currentEditingLegion.slots.map(s => ({ ...s })),
        };
        showToast(`📋 已复制【${row.factionName}】的军团方阵配置！`);
        renderEditPanel(row);
    });

    // 粘贴
    document.getElementById('le-btn-paste')?.addEventListener('click', () => {
        if (!clipboardLegion) return;
        currentEditingLegion = {
            formationMode: clipboardLegion.formationMode,
            slots: clipboardLegion.slots.map(s => ({ ...s })),
        };
        renderEditPanel(row);
        showToast(`📋 已粘贴配置！`);
    });

    // 一键套用全区
    document.getElementById('le-btn-apply-region')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        const confirmMsg = `确定要将当前军团方阵配置批量应用到所有【${row.regionLabel}】区(${row.region})的势力吗？`;
        if (!confirm(confirmMsg)) return;

        let count = 0;
        allRows.forEach(r => {
            if (r.region === row.region) {
                localCustomCompositions[r.factionId] = {
                    formationMode: currentEditingLegion!.formationMode,
                    slots: currentEditingLegion!.slots.map(s => ({ ...s })),
                };
                count++;
            }
        });
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        await saveAllCompositions();
        showToast(`🌐 已为【${row.regionLabel}】区 ${count} 个势力统一设置方阵并写入文件`);
    });
}

/** 按当前搜索词过滤「第二步」军团卡片（仅匹配军团名） */
function filterLegionOptionsByQuery(options: LayerLegionOption[]): LayerLegionOption[] {
    const q = legionSearchQuery.trim().toLowerCase();
    return q ? options.filter(o => o.legionName.toLowerCase().includes(q)) : options;
}

/** 绑定单个「选军团」卡片点击（选中即套用） */
function bindLegionCard(card: HTMLElement, row: FactionLegionRow): void {
    card.addEventListener('click', () => {
        const key = card.dataset.key!;
        if (selectedLayerKey === key) return;
        const options = getLayerLegionOptions(selectedLayerTab, row.factionId);
        const target = options.find(o => o.key === key);
        if (!target) { showToast('找不到该军团配置', true); return; }

        currentEditingLegion = {
            legionName: target.legionName,
            formationMode: target.formationMode,
            navalFormation: currentEditingLegion?.navalFormation ?? 'auto',
            slots: target.slots.map(s => ({ ...s })),
        };
        selectedLayerKey = key;
        renderEditPanel(row);
        showToast(`⬇ 已为【${row.generalName || row.factionName}】套用【${target.legionName}】(${LAYER_FULL_LABEL[selectedLayerTab]})，点底部保存落盘`);
    });
}

/** 仅重绘「第二步」军团卡片网格（保持搜索框焦点，不整屏重渲染） */
function renderLegionCardGrid(row: FactionLegionRow): void {
    const gridEl = els.panelContent.querySelector('.le-legion-grid');
    if (!gridEl) return;
    const options = getLayerLegionOptions(selectedLayerTab, row.factionId);
    const visible = filterLegionOptionsByQuery(options);
    gridEl.innerHTML = visible.map(opt => `
      <div class="le-legion-card ${isOptionActive(opt, currentEditingLegion) ? 'active' : ''}" data-key="${opt.key}" title="${opt.label}">
        <div class="lc-name">${opt.legionName}${isOptionActive(opt, currentEditingLegion) ? ' ✓' : ''}</div>
        <div class="lc-meta">${opt.description}</div>
      </div>
    `).join('') || (options.length
        ? '<div class="le-empty-hint" style="padding:14px;">无匹配军团</div>'
        : '<div class="le-empty-hint" style="padding:14px;">该层暂无军团可选</div>');
    gridEl.querySelectorAll('.le-legion-card[data-key]').forEach(card => bindLegionCard(card as HTMLElement, row));
}

/** 某势力的实际军团名（自定义优先；否则文化区默认军团名） */
function effectiveLegionName(row: FactionLegionRow): string {
    const custom = localCustomCompositions[row.factionId];
    const n = custom?.legionName?.trim();
    if (n) return n;
    return getCultureLegionName(row.region) ?? `${row.factionName}军团`;
}

/**
 * 军团命名铁律自动校验：
 *   ① 相同编制（阵型 + 兵种 type:count 序列 = legionSig）的军团必须同名；
 *   ② 军团不能重名（同名军团必须同编制）。
 * 返回违规信息列表；无违规则空数组。
 */
function computeLegionNameViolations(): string[] {
    const violations: string[] = [];

    // 每势力 → { 军团名, 编制签名 }（覆盖自定义与文化区默认）
    const eff = allRows.map(r => ({
        factionName: r.factionName,
        name: effectiveLegionName(r),
        sig: legionSig(r),
    }));

    // ① 相同编制必须同名
    const sigMap = new Map<string, string[]>();
    const sigFactions = new Map<string, string[]>();
    for (const e of eff) {
        if (!sigMap.has(e.sig)) { sigMap.set(e.sig, []); sigFactions.set(e.sig, []); }
        if (!sigMap.get(e.sig)!.includes(e.name)) sigMap.get(e.sig)!.push(e.name);
        sigFactions.get(e.sig)!.push(e.factionName);
    }
    for (const [sig, names] of sigMap.entries()) {
        if (names.length > 1) {
            violations.push(`相同编制（${sig}）但军团名不同：${sigFactions.get(sig)!.join('、')} → 名字 ${names.join(' / ')}（相同编制军团必须同名）`);
        }
    }

    // ② 军团不能重名（同名不同编）
    const nameSigs = new Map<string, Set<string>>();
    const nameFactions = new Map<string, string[]>();
    for (const e of eff) {
        if (!nameSigs.has(e.name)) { nameSigs.set(e.name, new Set()); nameFactions.set(e.name, []); }
        nameSigs.get(e.name)!.add(e.sig);
        nameFactions.get(e.name)!.push(e.factionName);
    }
    for (const [name, sigs] of nameSigs.entries()) {
        if (sigs.size > 1) {
            violations.push(`军团名【${name}】被用于不同编制（重名）：${nameFactions.get(name)!.join('、')}（同名军团必须同编制）`);
        }
    }

    return violations;
}

/** 校验并自动报错：无违规提示通过；有违规弹窗列出全部 */
function reportLegionNameViolations(): void {
    const violations = computeLegionNameViolations();
    if (violations.length === 0) {
        showToast('✅ 军团命名检查通过：无同名/相同编制不同名违规');
        return;
    }
    openLegionViolationsModal(violations);
}

/** 违规列表弹窗 */
function openLegionViolationsModal(violations: string[]): void {
    const overlay = document.createElement('div');
    overlay.className = 'le-modal-overlay';
    overlay.innerHTML = `
    <div class="le-modal" style="width:720px;">
      <div class="le-modal-header">
        <span style="color:#ffb4a8;">⚠️ 军团命名铁律违规 (${violations.length})</span>
        <button type="button" class="le-btn le-btn-sm" id="le-viol-close">✕</button>
      </div>
      <div class="le-modal-body" style="grid-template-columns:1fr;gap:8px;max-height:70vh;">
        <div style="font-size:12px;color:#a89f8f;margin-bottom:4px;">相同编制必须同名 / 同名必须同编制。请先修复以下违规再落盘：</div>
        ${violations.map(v => `<div style="background:#2a1616;border:1px solid #5a2a2a;border-radius:4px;padding:8px 10px;font-size:12px;color:#ffd0c0;">${v}</div>`).join('')}
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#le-viol-close')?.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', function onKey(e: KeyboardEvent) {
        if ((e as any).isComposing) return;
        if (e.key === 'Escape') { window.removeEventListener('keydown', onKey); close(); }
    });
}

function updateRowUnit(legion: CustomFactionLegion, rowIdx: number, unitId: string): void {
    const mode = legion.formationMode;
    const def = DE_UNITS_MAP.get(unitId);
    const defScale = def?.defaultScale ?? 1.0;

    let counts = [3, 3, 3];
    if (mode === 'triangle') counts = [2, 3, 4];
    else if (mode === 'echelon') counts = [4, 3, 2];
    else if (mode === 'fish_scale') counts = [3, 4, 2];
    else if (mode === 'crane_wing') counts = [2, 4, 3];
    else if (mode === 'crescent') counts = [3, 2, 4];
    else if (mode === 'balance_yoke') counts = [4, 2, 3];
    else if (mode === 'square') counts = [3, 3, 3];

    legion.slots[rowIdx] = { type: unitId, count: counts[rowIdx], scale: legion.slots[rowIdx]?.scale ?? defScale };
}

function updateRowScale(legion: CustomFactionLegion, rowIdx: number, scale: number): void {
    if (legion.slots[rowIdx]) legion.slots[rowIdx].scale = scale;
}

// ============================================================
// 6. 兵种挑选弹窗 (Unit Picker Modal)
// ============================================================

function openUnitPickerModal(row: FactionLegionRow, rowIdx: number): void {
    const overlay = document.createElement('div');
    overlay.className = 'le-modal-overlay';

    let currentTab: UnitCategory = 'infantry';
    let unitSearch = '';
    let isSearchComposing = false;
    const rowTitle = ['前排', '中坚', '后排'][rowIdx];

    const closeModal = () => {
        window.removeEventListener('keydown', handleKey);
        overlay.remove();
    };

    const handleKey = (e: KeyboardEvent) => {
        if (!e.isComposing && e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKey);

    const renderModalContent = () => {
        const q = unitSearch.trim().toLowerCase();
        // 🔴 搜索框非空 → 跨 tab 按名字/ID 搜；空 → 按当前 tab 过滤
        const units = (q
            ? DE_UNITS_CATALOG.filter(u => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
            : DE_UNITS_CATALOG.filter(u => u.category === currentTab))
            .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN') || a.id.localeCompare(b.id));
        overlay.innerHTML = `
        <div class="le-modal">
          <div class="le-modal-header">
            <span>选择【${rowTitle}】兵种</span>
            <button type="button" class="le-btn le-btn-sm" id="le-modal-close" style="font-size:14px;padding:2px 8px;cursor:pointer;">✕</button>
          </div>
          <div class="le-modal-tabs">
            <div class="le-modal-tab ${currentTab === 'infantry' ? 'active' : ''}" data-cat="infantry">🛡️ 步兵 (${DE_UNITS_CATALOG.filter(u=>u.category==='infantry').length})</div>
            <div class="le-modal-tab ${currentTab === 'cavalry' ? 'active' : ''}" data-cat="cavalry">🐎 骑兵 (${DE_UNITS_CATALOG.filter(u=>u.category==='cavalry').length})</div>
            <div class="le-modal-tab ${currentTab === 'ranged' ? 'active' : ''}" data-cat="ranged">🏹 远程 (${DE_UNITS_CATALOG.filter(u=>u.category==='ranged').length})</div>
            <div class="le-modal-tab ${currentTab === 'siege' ? 'active' : ''}" data-cat="siege">⚙️ 攻城 (${DE_UNITS_CATALOG.filter(u=>u.category==='siege').length})</div>
            <div class="le-modal-tab ${currentTab === 'hero' ? 'active' : ''}" data-cat="hero">👑 英雄 (${DE_UNITS_CATALOG.filter(u=>u.category==='hero').length})</div>
          </div>
          <input id="le-unit-search" class="le-input" type="search" placeholder="🔍 搜索兵种名称 / ID…" style="margin:8px 12px;width:calc(100% - 24px);box-sizing:border-box;" />
          <div class="le-modal-body">
            ${units.map(u => `
              <div class="le-unit-card" data-uid="${u.id}">
                <canvas class="le-unit-thumb" data-uid="${u.id}" width="64" height="64"></canvas>
                <div class="le-unit-card-text">
                  <div class="le-unit-card-name">${u.name}</div>
                  <div class="le-unit-card-cat">${CATEGORY_LABEL[u.category]}${getUnitTier(u) === 'elite' ? ' · ⭐精锐' : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        `;

        overlay.querySelector('#le-modal-close')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closeModal();
        });

        overlay.querySelectorAll('.le-modal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                currentTab = (tab as HTMLElement).dataset.cat as UnitCategory;
                renderModalContent();
            });
        });

        // 🔴 兵种搜索：防抖后过滤（重建 DOM 后恢复 value 并重新聚焦，避免每敲一字失焦清空）
        const rerenderSearch = debounce(() => {
            renderModalContent();
            const inp = overlay.querySelector('#le-unit-search') as HTMLInputElement | null;
            if (inp) {
                inp.value = unitSearch;
                inp.focus();
                inp.setSelectionRange(unitSearch.length, unitSearch.length);
            }
        });
        const searchInput = overlay.querySelector('#le-unit-search') as HTMLInputElement | null;
        searchInput?.addEventListener('compositionstart', () => {
            isSearchComposing = true;
        });
        searchInput?.addEventListener('compositionend', (e) => {
            isSearchComposing = false;
            unitSearch = (e.target as HTMLInputElement).value;
            rerenderSearch();
        });
        searchInput?.addEventListener('input', (e) => {
            unitSearch = (e.target as HTMLInputElement).value;
            if (!isSearchComposing && !(e as InputEvent).isComposing) rerenderSearch();
        });

        overlay.querySelectorAll('.le-unit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = (card as HTMLElement).dataset.uid!;
                if (currentEditingLegion) {
                    updateRowUnit(currentEditingLegion, rowIdx, uid);
                    renderEditPanel(row);
                }
                closeModal();
            });
        });

        // 🔴 缩略图：异步加载 idle 朝南第一帧（loadSprite/loadMeta 有缓存，切 tab/搜索不重复拉网），
        //    只画滚进视口的，避免一次性画满 200+ 张。
        observeThumbs(overlay);
    };

    document.body.appendChild(overlay);
    renderModalContent();

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// ============================================================
// 6.5 兵种图鉴 (Unit Catalog) —— 查看 / 排序 / 筛选全部 DE 兵种
// ============================================================

/** 类别排序权重：按 步兵 → 骑兵 → 远程 → 攻城 → 船只 → 英雄 的战场站位顺序，而非拼音顺序。 */
const CATEGORY_ORDER: UnitCategory[] = ['infantry', 'cavalry', 'ranged', 'siege', 'naval', 'hero'];

function switchMainView(view: MainView): void {
    if (mainView === view) return;
    mainView = view;

    // 切视图必须停掉上一个 Canvas 循环，否则两套预览会同时跑在同一个 rAF 上互相踩。
    if (animTimer !== null) {
        cancelAnimationFrame(animTimer);
        animTimer = null;
    }

    const isUnits = view === 'units';
    const isNaval = view === 'naval';   // 海军栏目复用左侧势力表与搜索栏
    els.panel.classList.toggle('is-units', isUnits);
    els.toolbarFactions.style.display = isUnits ? 'none' : '';
    els.toolbarUnits.style.display = isUnits ? '' : 'none';
    els.tableWrap.style.display = isUnits ? 'none' : '';
    els.catTableWrap.style.display = isUnits ? '' : 'none';

    document.querySelectorAll('.le-viewtab').forEach(t => {
        t.classList.toggle('active', (t as HTMLElement).dataset.view === view);
    });

    if (isUnits) {
        populateSubFilter();
        applyCatalogFilter();
        renderCatalogTable();
        if (selectedUnitId) {
            renderUnitPanel(selectedUnitId);
        } else {
            els.panelContent.innerHTML = `<div class="le-empty-hint">← 请在左侧兵种图鉴中点击任意兵种，查看其动作与素材信息</div>`;
        }
    } else {
        renderTable();
        const row = allRows.find(r => r.factionId === selectedFactionId);
        if (row) {
            if (isNaval) renderNavalPanel(row);
            else renderEditPanel(row);
        } else {
            els.panelContent.innerHTML = `<div class="le-empty-hint">← 请在左侧点击任意势力</div>`;
        }
    }
}

/** 根据当前选中大类，刷新子类下拉选项；「全部类别」时列出所有子类（按大类 optgroup 分组）。 */
function populateSubFilter(): void {
    const cat = catalogCatFilter;
    const groups: [string, SubCategory[]][] = cat === 'all'
        ? (CATEGORY_ORDER as UnitCategory[]).map(c => [CATEGORY_LABEL[c], SUBCATEGORY_BY_CATEGORY[c]])
        : [[CATEGORY_LABEL[cat], SUBCATEGORY_BY_CATEGORY[cat]]];
    els.subFilter.innerHTML = `<option value="all">全部子类</option>`
        + groups.map(([label, subs]) =>
            `<optgroup label="${label}">${subs.map(s => `<option value="${s}">${SUBCATEGORY_LABEL[s]}</option>`).join('')}</optgroup>`
        ).join('');
}

function applyCatalogFilter(): void {
    const q = catalogSearch.trim().toLowerCase();
    catalogRows = DE_UNITS_CATALOG.filter(u => {
        if (catalogCatFilter !== 'all' && u.category !== catalogCatFilter) return false;
        if (catalogSubFilter !== 'all' && getUnitSubcategory(u.id) !== catalogSubFilter) return false;
        if (catalogTierFilter !== 'all' && getUnitTier(u) !== catalogTierFilter) return false;
        if (catalogAgeFilter !== 'all' && u.age !== catalogAgeFilter) return false;
        if (q) {
            const hit = u.name.toLowerCase().includes(q)
                || u.id.toLowerCase().includes(q)
                || u.pathPrefix.toLowerCase().includes(q);
            if (!hit) return false;
        }
        return true;
    });

    sortCatalogRows();

    const eliteTotal = DE_UNITS_CATALOG.filter(u => getUnitTier(u) === 'elite').length;
    const unknownTotal = DE_UNITS_CATALOG.filter(u => u.age === 'unknown').length;
    els.catStats.innerHTML =
        `全部兵种 <b>${DE_UNITS_CATALOG.length}</b> | 精锐档 <b style="color:#f5d78e">${eliteTotal}</b>`
        + ` | 时代待核 <b style="color:#c88a7a">${unknownTotal}</b> | 当前显示 <b>${catalogRows.length}</b>`;
}

function sortCatalogRows(): void {
    const dir = catalogSortAsc ? 1 : -1;
    catalogRows.sort((a, b) => {
        if (catalogSortCol === 'category') {
            const d = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
            if (d !== 0) return dir * d;
            return a.name.localeCompare(b.name, 'zh-CN');
        }
        if (catalogSortCol === 'subcategory') {
            const sa = getUnitSubcategory(a.id) ?? '';
            const sb = getUnitSubcategory(b.id) ?? '';
            const d = sa.localeCompare(sb);
            if (d !== 0) return dir * d;
            return a.name.localeCompare(b.name, 'zh-CN');
        }
        if (catalogSortCol === 'tier') {
            const ta = getUnitTier(a) === 'elite' ? 1 : 0;
            const tb = getUnitTier(b) === 'elite' ? 1 : 0;
            if (ta !== tb) return dir * (ta - tb);
            return a.name.localeCompare(b.name, 'zh-CN');
        }
        if (catalogSortCol === 'age') {
            const d = AGE_ORDER.indexOf(a.age) - AGE_ORDER.indexOf(b.age);
            if (d !== 0) return dir * d;
            return a.name.localeCompare(b.name, 'zh-CN');
        }
        if (catalogSortCol === 'id') return dir * a.id.localeCompare(b.id);
        return dir * a.name.localeCompare(b.name, 'zh-CN');
    });
}

function renderCatalogTable(): void {
    if (catalogRows.length === 0) {
        els.catTableWrap.innerHTML = `<div class="le-empty-hint">没有匹配的兵种</div>`;
        return;
    }

    const arrow = (col: string) => catalogSortCol === col
        ? (catalogSortAsc ? ' <span style="color:#e0c888;">▲</span>' : ' <span style="color:#e0c888;">▼</span>')
        : '';

    els.catTableWrap.innerHTML = `
    <table class="le-table">
      <thead>
        <tr>
          <th style="width:56px;">预览</th>
          <th data-col="name" style="color:#f5e6c8;background:#24201a;">兵种名称${arrow('name')}</th>
          <th data-col="age" style="width:90px;">时代${arrow('age')}</th>
          <th data-col="tier" style="width:80px;">升级档${arrow('tier')}</th>
          <th data-col="category" style="width:100px;">类别${arrow('category')}</th>
          <th data-col="subcategory" style="width:90px;">子类${arrow('subcategory')}</th>
          <th data-col="id" style="width:200px;">兵种 ID${arrow('id')}</th>
          <th>素材目录</th>
        </tr>
      </thead>
      <tbody>
        ${catalogRows.map(u => {
            const tier = getUnitTier(u);
            const sub = getUnitSubcategory(u.id);
            return `
          <tr data-uid="${u.id}" class="${u.id === selectedUnitId ? 'selected' : ''}">
            <td class="cell-thumb"><canvas class="le-cat-thumb" data-uid="${u.id}" width="44" height="44"></canvas></td>
            <td><b style="font-size:13px;">${u.name}</b></td>
            <td><span class="age-tag age-${u.age}">${AGE_LABEL[u.age]}</span></td>
            <td>${tier === 'elite'
                ? `<span class="tier-tag tier-elite">⭐ 精锐</span>`
                : `<span class="tier-tag tier-base">普通</span>`}</td>
            <td><span class="cat-tag">${CATEGORY_LABEL[u.category]}</span></td>
            <td>${sub ? `<span class="sub-tag">${SUBCATEGORY_LABEL[sub]}</span>` : `<span style="color:#7a7266;">—</span>`}</td>
            <td><span class="cell-id" style="margin-left:0;">${u.id}</span></td>
            <td><span class="cell-path">${u.pathPrefix}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    `;

    els.catTableWrap.querySelectorAll('th[data-col]').forEach(th => {
        th.addEventListener('click', () => {
            const col = (th as HTMLElement).dataset.col as typeof catalogSortCol;
            if (catalogSortCol === col) catalogSortAsc = !catalogSortAsc;
            else { catalogSortCol = col; catalogSortAsc = true; }
            sortCatalogRows();
            renderCatalogTable();
        });
    });

    els.catTableWrap.querySelectorAll('tr[data-uid]').forEach(tr => {
        tr.addEventListener('click', () => {
            selectedUnitId = (tr as HTMLElement).dataset.uid!;
            els.catTableWrap.querySelectorAll('tr[data-uid]').forEach(o => {
                o.classList.toggle('selected', (o as HTMLElement).dataset.uid === selectedUnitId);
            });
            renderUnitPanel(selectedUnitId);
        });
    });

    observeThumbs(els.catTableWrap);
}

/** 右侧面板：单兵种动作预览 + 素材帧信息 */
function renderUnitPanel(unitId: string): void {
    const u = DE_UNITS_MAP.get(unitId);
    if (!u) return;
    const tier = getUnitTier(u);
    const sub = getUnitSubcategory(u.id);

    els.panelContent.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;background:#181614;border:1px solid #2a2620;border-radius:6px;padding:12px;margin-bottom:14px;">
      <div>
        <div style="font-size:17px;font-weight:bold;color:#f5e6c8;">${u.name}</div>
        <div style="font-size:11px;color:#a89f8f;margin-top:3px;font-family:monospace;">${u.id}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <span class="age-tag age-${u.age}">${AGE_LABEL[u.age]}</span>
        <span class="cat-tag">${CATEGORY_LABEL[u.category]}</span>
        ${sub ? `<span class="sub-tag">${SUBCATEGORY_LABEL[sub]}</span>` : ''}
        ${tier === 'elite' ? `<span class="tier-tag tier-elite">⭐ 精锐</span>` : `<span class="tier-tag tier-base">普通</span>`}
      </div>
    </div>

    <div class="le-form-section">
      <div class="le-section-title"><span>动作预览</span></div>
      <div class="le-preview-wrap">
        <canvas id="le-unit-canvas" class="le-preview-canvas le-unit-canvas" width="540" height="640"></canvas>
      </div>
      <div class="le-preview-controls">
        <button type="button" class="le-btn le-btn-sm ${animState === 'idle' ? 'le-btn-primary' : ''}" id="le-u-idle">🧍 待机</button>
        <button type="button" class="le-btn le-btn-sm ${animState === 'move' ? 'le-btn-primary' : ''}" id="le-u-move">🚶 移动</button>
        <button type="button" class="le-btn le-btn-sm ${animState === 'attack' ? 'le-btn-primary' : ''}" id="le-u-attack">⚔️ 攻击</button>
        <span style="font-size:12px;color:#a89f8f;margin-left:auto;">朝向:</span>
        <select id="le-u-dir" class="le-select" style="padding:2px 6px;font-size:12px;">
          ${[[3, '南'], [2, '东南'], [1, '东'], [0, '东北'], [7, '北'], [6, '西北'], [5, '西'], [4, '西南']]
            .map(([v, t]) => `<option value="${v}" ${animDirection === v ? 'selected' : ''}>${t} (${v})</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="le-form-section">
      <div class="le-section-title"><span>素材信息</span></div>
      <div style="font-size:12px;color:#a89f8f;line-height:1.9;">
        素材目录：<span class="cell-path" style="font-size:11px;">${u.pathPrefix}</span>
        <div id="le-unit-meta">读取 _meta.json…</div>
      </div>
    </div>
    `;

    document.getElementById('le-u-idle')?.addEventListener('click', () => { animState = 'idle'; renderUnitPanel(unitId); });
    document.getElementById('le-u-move')?.addEventListener('click', () => { animState = 'move'; renderUnitPanel(unitId); });
    document.getElementById('le-u-attack')?.addEventListener('click', () => { animState = 'attack'; renderUnitPanel(unitId); });
    const dirSel = document.getElementById('le-u-dir') as HTMLSelectElement | null;
    dirSel?.addEventListener('change', () => {
        animDirection = parseInt(dirSel.value, 10);
        startUnitCanvasPreview(unitId);
    });

    startUnitCanvasPreview(unitId);
    fillUnitMeta(u);
}

async function fillUnitMeta(u: DeUnitDef): Promise<void> {
    const meta = await loadMeta(u.pathPrefix);
    const box = document.getElementById('le-unit-meta');
    if (!box) return;
    if (!meta) {
        box.innerHTML = `<span style="color:#c88a7a;">未找到 _meta.json（按方图兜底切帧）</span>`;
        return;
    }
    const lines = (['idle', 'move', 'attack', 'death'] as const).map(act => {
        const a = meta[act];
        if (!a) return `${act}：<span style="color:#7a7266;">无</span>`;
        const d = a.dirs?.['3'] || Object.values(a.dirs || {})[0];
        const size = d ? `${Math.round(d.fw)}×${Math.round(d.fh)}` : '?';
        return `${act}：<b style="color:#e0c888;">${a.frames}</b> 帧 · ${Object.keys(a.dirs || {}).length} 方向 · 帧尺寸 ${size}`;
    });
    box.innerHTML = lines.join('<br/>');
}

/**
 * 图鉴单兵预览的统一比例尺 —— 所有兵种、所有动作、所有朝向一律用这一个倍率。
 *
 * 🔴 [2026-08-17] 原来这里按帧尺寸自适应放大（让最大边占画布 72%），结果大小根本不统一：
 *    同一个兵种 idle 是 24×52、move/attack 是 32×48，倍率跟着帧尺寸变，一切动作就跳大跳小；
 *    兵种之间更是小兵被放大、战象被缩小，完全看不出体型差别。
 *    现固定为 2.8：全库最大帧是 188×224（弩炮 attack / 桑纳亚 move），×2.8 = 526×627,
 *    在 540×640 画布内刚好放得下；最小的 32×48 也有 90×134，细节看得很清。
 *    ⚠️ 倍率上限由**最大帧宽**卡死（188 × 2.8 = 526 ≈ 画布宽 540）。想再放大就得同时加宽
 *       右侧面板（.le-panel width）、画布 width 和这个数，只调这一个会把弩炮、桑纳亚裁掉两边。
 */
const UNIT_PREVIEW_SCALE = 2.8;

/** 图鉴用单兵预览：与方阵预览共用 animTimer，切换时互斥。 */
function startUnitCanvasPreview(unitId: string): void {
    if (animTimer !== null) {
        cancelAnimationFrame(animTimer);
        animTimer = null;
    }
    const canvas = document.getElementById('le-unit-canvas') as HTMLCanvasElement | null;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const prefix = getUnitPathPrefix(unitId);
    let frame = 0;

    // 像素素材放大必须关掉平滑插值，否则 2.8 倍下边缘全糊
    ctx.imageSmoothingEnabled = false;

    // 各兵种统一踩这条地面线，配合固定倍率即可直接目测体型差
    const groundY = canvas.height * 0.82;

    const loop = () => {
        ctx.fillStyle = '#141812';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e241c';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
        ctx.strokeStyle = '#2e3a28';
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();

        const action = animState === 'attack' ? 'attack' : (animState === 'move' ? 'move' : 'idle');
        const imgUrl = `${prefix}${action}_${animDirection}.png`;

        if (!metaCache.has(prefix)) loadMeta(prefix).catch(() => {});
        const meta = metaCache.get(prefix) || null;
        const img = spriteCache.get(imgUrl);

        if (img && img.complete && img.naturalWidth > 0) {
            const actMeta = meta?.[action];
            const dirMeta = actMeta?.dirs?.[String(animDirection)];
            let totalFrames: number, fw: number, fh: number, hx: number, hy: number;
            if (actMeta && dirMeta) {
                totalFrames = actMeta.frames; fw = dirMeta.fw; fh = dirMeta.fh; hx = dirMeta.hx; hy = dirMeta.hy;
            } else {
                totalFrames = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
                fw = img.naturalWidth / totalFrames; fh = img.naturalHeight; hx = fw / 2; hy = fh / 2;
            }
            const speedDivisor = animState === 'idle' ? 3 : 2;
            const cur = Math.floor(frame / speedDivisor) % totalFrames;

            const s = UNIT_PREVIEW_SCALE;
            const dw = fw * s, dh = fh * s;

            // 水平按整帧居中（不按锚点：器械类的 hx 常年偏在一侧，按锚点会左右乱跑）
            const dx = (canvas.width - dw) / 2;
            // 垂直让锚点踩在地面线上，使各兵种站在同一水平线便于比体型；
            // 少数器械帧的锚点在帧外，会顶出画布，故再钳制回可视区。
            let dy = groundY - hy * s;
            if (dh >= canvas.height - 8) dy = (canvas.height - dh) / 2;
            else dy = Math.max(4, Math.min(dy, canvas.height - dh - 4));

            ctx.drawImage(img, cur * fw, 0, fw, fh, dx, dy, dw, dh);

            ctx.fillStyle = '#7a7266';
            ctx.font = '11px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(
                `${action}_${animDirection}.png · 第 ${cur + 1}/${totalFrames} 帧 · 帧 ${Math.round(fw)}×${Math.round(fh)} · 统一 ${s}×`,
                8, canvas.height - 8,
            );
        } else {
            loadSprite(imgUrl).catch(() => {});
            ctx.fillStyle = '#7a7266';
            ctx.font = '12px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`载入 ${action}_${animDirection}.png …`, canvas.width / 2, canvas.height / 2);
        }

        frame++;
        animTimer = requestAnimationFrame(loop);
    };
    loop();
}

// ============================================================
// 7. 轻量 Canvas 动态预览 (精确帧切片与视图模式)
// ============================================================

interface DynMetaDir {
    fw: number;
    fh: number;
    hx: number;
    hy: number;
}
interface DynMetaAction {
    frames: number;
    dirs: Record<string, DynMetaDir>;
}
interface DynMeta {
    idle?: DynMetaAction;
    move?: DynMetaAction;
    attack?: DynMetaAction;
    death?: DynMetaAction;
}

const spriteCache = new Map<string, HTMLImageElement>();
const metaCache = new Map<string, DynMeta | null>();

const LEGACY_TO_DE_FALLBACK: Record<string, string> = {
    'horse_archer': 'cav_archer',
    'shield': 'swordsman',
    'crossbow': 'crossbowman',
    'spear': 'pikeman',
    'lancer': 'light_riders',
    'general_cavalry': 'tiger_rider',
    'light_infantry': 'swordsman',
    'heavy_infantry': 'heavy_pikeman',
    'axe': 'throwing_axeman',
    'ballista': 'ballista_elephant',
    'heavy_cavalry': 'paladin',
    'elephant': 'war_elephant',
};

function getUnitPathPrefix(unitId: string): string {
    const def = DE_UNITS_MAP.get(unitId);
    if (def) return def.pathPrefix;
    const fallback = LEGACY_TO_DE_FALLBACK[unitId];
    if (fallback && DE_UNITS_MAP.has(fallback)) {
        return DE_UNITS_MAP.get(fallback)!.pathPrefix;
    }
    return '/SUCAI/SWORDSMAN/';
}

function loadSprite(url: string): Promise<HTMLImageElement> {
    if (spriteCache.has(url)) return Promise.resolve(spriteCache.get(url)!);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            spriteCache.set(url, img);
            resolve(img);
        };
        img.onerror = () => reject(new Error('Failed to load ' + url));
    });
}

async function loadMeta(pathPrefix: string): Promise<DynMeta | null> {
    if (metaCache.has(pathPrefix)) return metaCache.get(pathPrefix)!;
    try {
        const res = await fetch(`${pathPrefix}_meta.json`);
        if (!res.ok) {
            metaCache.set(pathPrefix, null);
            return null;
        }
        const data = (await res.json()) as DynMeta;
        metaCache.set(pathPrefix, data);
        return data;
    } catch {
        metaCache.set(pathPrefix, null);
        return null;
    }
}

/** 兵种卡片缩略图：画 idle 朝南方向（dir=3，正对玩家）的第一帧，等比缩进 64×64 居中。 */
async function drawUnitThumb(canvas: HTMLCanvasElement, unitId: string): Promise<void> {
    const prefix = getUnitPathPrefix(unitId);
    const imgUrl = `${prefix}idle_3.png`;
    try {
        const img = await loadSprite(imgUrl);
        let meta = metaCache.get(prefix);
        if (meta === undefined) meta = await loadMeta(prefix);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const actMeta = meta?.idle;
        const dirMeta = actMeta?.dirs?.['3'];
        let fw: number, fh: number;
        if (actMeta && dirMeta) { fw = dirMeta.fw; fh = dirMeta.fh; }
        else { fw = img.naturalHeight; fh = img.naturalHeight; }   // 兜底：假设正方形帧
        const size = canvas.width;
        const scale = Math.min(size / fw, size / fh);
        const dw = fw * scale, dh = fh * scale;
        const dx = (size - dw) / 2, dy = (size - dh) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, fw, fh, dx, dy, dw, dh);   // 第 0 帧（sx=0, sy=0）
    } catch { /* 素材加载失败 → 留空占位，不拖累列表 */ }
}

/**
 * 缩略图懒加载：230 个兵种一次性全画会拖慢弹窗/图鉴的每次重建
 * （实测搜索每敲一字 148ms）。改为只画滚进视口的那些，已画过的打标不重画。
 */
let thumbObserver: IntersectionObserver | null = null;
function observeThumbs(root: ParentNode): void {
    if (!thumbObserver) {
        thumbObserver = new IntersectionObserver((entries) => {
            for (const en of entries) {
                if (!en.isIntersecting) continue;
                const c = en.target as HTMLCanvasElement;
                thumbObserver!.unobserve(c);
                if (c.dataset.drawn === '1') continue;
                c.dataset.drawn = '1';
                drawUnitThumb(c, c.dataset.uid!);
            }
        }, { rootMargin: '160px' });
    }
    root.querySelectorAll<HTMLCanvasElement>('canvas[data-uid]').forEach(c => thumbObserver!.observe(c));
}

function startCanvasPreview(): void {
    if (animTimer !== null) {
        cancelAnimationFrame(animTimer);
        animTimer = null;
    }

    const canvas = document.getElementById('le-canvas') as HTMLCanvasElement;
    if (!canvas || !currentEditingLegion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mode = currentEditingLegion.formationMode;
    const slots = currentEditingLegion.slots;

    let unitPositions: Array<{ x: number; y: number; type: string; scale: number; label: string }> = [];

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (previewViewMode === 'single') {
        // 单兵大图特写模式（2.4倍高清放大，细节极清晰）
        let unitType = 'swordsman';
        let unitScale = 1.0;
        let rowTitle = '前排';
        if (singlePreviewRow === 0) {
            unitType = slots[0]?.type || 'swordsman';
            unitScale = slots[0]?.scale ?? 1.0;
            rowTitle = '前排';
        } else if (singlePreviewRow === 1) {
            unitType = slots[1]?.type || 'lancer';
            unitScale = slots[1]?.scale ?? 1.0;
            rowTitle = '中坚';
        } else {
            unitType = slots[slots.length - 1]?.type || 'archer';
            unitScale = slots[slots.length - 1]?.scale ?? 1.0;
            rowTitle = '后排';
        }
        unitPositions.push({
            x: cx,
            y: cy - 10,
            type: unitType,
            scale: unitScale * 2.4,
            label: `${rowTitle} · ${getUnitDisplayName(unitType)}`,
        });
    } else if (previewViewMode === 'three') {
        // 三排各一兵清晰展示模式（1.7倍放大）
        const t0 = slots[0]?.type || 'swordsman';
        const s0 = (slots[0]?.scale ?? 1.0) * 1.7;
        const t1 = slots[1]?.type || 'lancer';
        const s1 = (slots[1]?.scale ?? 1.0) * 1.7;
        const t2 = slots[slots.length - 1]?.type || 'archer';
        const s2 = (slots[slots.length - 1]?.scale ?? 1.0) * 1.7;

        // [2026-08-20 主人定] 前排在**右**、后排在左：跟拍的军团大多是进攻方，
        // 接敌面朝右，所以平铺展示的左右顺序要与战场上的前后关系一致（后排 ← 中坚 ← 前排｜敌人）。
        unitPositions.push({ x: cx + 140, y: cy - 10, type: t0, scale: s0, label: `前排 · ${getUnitDisplayName(t0)}` });
        unitPositions.push({ x: cx,       y: cy - 10, type: t1, scale: s1, label: `中坚 · ${getUnitDisplayName(t1)}` });
        unitPositions.push({ x: cx - 140, y: cy - 10, type: t2, scale: s2, label: `后排 · ${getUnitDisplayName(t2)}` });
    } else {
        // 9 人方阵排布模式（根据 animDirection 朝向自然旋转阵型）
        const spacingX = 52;
        const spacingY = 66; // 前后排距拉开为 60% 长方形军阵
        const pScale = 1.15;

        // 旋转角度与游戏主引擎 LegionPhalanxDrawer 完全统一：angle = (animDirection + 1) * π / 4
        const fAngle = (animDirection + 1) * Math.PI / 4;
        const cos = Math.cos(fAngle);
        const sin = Math.sin(fAngle);

        const addUnitWithRot = (ox: number, oy: number, type: string, scale: number, label: string) => {
            const rx = ox * cos - oy * sin;
            const ry = ox * sin + oy * cos;
            unitPositions.push({
                x: cx + rx,
                y: cy - 10 + ry,
                type,
                scale,
                label,
            });
        };

        if (mode === 'triangle') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            // 前2 (r=0, c=-0.5, 0.5)
            addUnitWithRot(-0.5 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(0.5 * spacingX, -spacingY, t0, s0, '');
            // 中3 (r=1, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, 0, t1, s1, '');
            addUnitWithRot(0, 0, t1, s1, '');
            addUnitWithRot(1.0 * spacingX, 0, t1, s1, '');
            // 后4 (r=2, c=-1.5, -0.5, 0.5, 1.5)
            addUnitWithRot(-1.5 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(-0.5 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(0.5 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(1.5 * spacingX, spacingY, t2, s2, '');
        } else if (mode === 'echelon') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            // 前4 (r=0, c=-1.5, -0.5, 0.5, 1.5)
            addUnitWithRot(-1.5 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(-0.5 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(0.5 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(1.5 * spacingX, -spacingY, t0, s0, '');
            // 中3 (r=1, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, 0, t1, s1, '');
            addUnitWithRot(0, 0, t1, s1, '');
            addUnitWithRot(1.0 * spacingX, 0, t1, s1, '');
            // 后2 (r=2, c=-0.5, 0.5)
            addUnitWithRot(-0.5 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(0.5 * spacingX, spacingY, t2, s2, '');
        } else if (mode === 'fish_scale') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            // 前3 (r=0, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(0, -spacingY, t0, s0, '');
            addUnitWithRot(1.0 * spacingX, -spacingY, t0, s0, '');
            // 中4 (r=1, c=-1.5, -0.5, 0.5, 1.5)
            addUnitWithRot(-1.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(-0.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(0.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(1.5 * spacingX, 0, t1, s1, '');
            // 后2 (r=2, c=-1, 1)
            addUnitWithRot(-1.0 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(1.0 * spacingX, spacingY, t2, s2, '');
        } else if (mode === 'crane_wing') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            // 前2 (r=0, c=-1, 1)
            addUnitWithRot(-1.0 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(1.0 * spacingX, -spacingY, t0, s0, '');
            // 中4 (r=1, c=-1.5, -0.5, 0.5, 1.5)
            addUnitWithRot(-1.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(-0.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(0.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(1.5 * spacingX, 0, t1, s1, '');
            // 后3 (r=2, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(0, spacingY, t2, s2, '');
            addUnitWithRot(1.0 * spacingX, spacingY, t2, s2, '');
        } else if (mode === 'crescent') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            // 前3 (r=0, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(0, -spacingY, t0, s0, '');
            addUnitWithRot(1.0 * spacingX, -spacingY, t0, s0, '');
            // 中2 (r=1, c=-0.5, 0.5)
            addUnitWithRot(-0.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(0.5 * spacingX, 0, t1, s1, '');
            // 后4 (r=2, c=-1.5, -0.5, 0.5, 1.5)
            addUnitWithRot(-1.5 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(-0.5 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(0.5 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(1.5 * spacingX, spacingY, t2, s2, '');
        } else if (mode === 'balance_yoke') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            // 前4 (r=0, c=-1.5, -0.5, 0.5, 1.5)
            addUnitWithRot(-1.5 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(-0.5 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(0.5 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(1.5 * spacingX, -spacingY, t0, s0, '');
            // 中2 (r=1, c=-0.5, 0.5)
            addUnitWithRot(-0.5 * spacingX, 0, t1, s1, '');
            addUnitWithRot(0.5 * spacingX, 0, t1, s1, '');
            // 后3 (r=2, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(0, spacingY, t2, s2, '');
            addUnitWithRot(1.0 * spacingX, spacingY, t2, s2, '');
        } else {
            // square: 3+3+3 方阵
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            // 前3 (r=0, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, -spacingY, t0, s0, '');
            addUnitWithRot(0, -spacingY, t0, s0, '');
            addUnitWithRot(1.0 * spacingX, -spacingY, t0, s0, '');
            // 中3 (r=1, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, 0, t1, s1, '');
            addUnitWithRot(0, 0, t1, s1, '');
            addUnitWithRot(1.0 * spacingX, 0, t1, s1, '');
            // 后3 (r=2, c=-1, 0, 1)
            addUnitWithRot(-1.0 * spacingX, spacingY, t2, s2, '');
            addUnitWithRot(0, spacingY, t2, s2, '');
            addUnitWithRot(1.0 * spacingX, spacingY, t2, s2, '');
        }
    }

    let frame = 0;
    const renderLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制沙盘网格背景
        ctx.fillStyle = '#141812';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e241c';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // 绘制士兵（按 Y 轴排序以保证前后遮挡正确）
        const sorted = [...unitPositions].sort((a, b) => a.y - b.y);

        sorted.forEach(u => {
            const prefix = getUnitPathPrefix(u.type);
            const actionName = animState === 'attack' ? 'attack' : (animState === 'move' ? 'move' : 'idle');
            const imgUrl = `${prefix}${actionName}_${animDirection}.png`;

            if (!metaCache.has(prefix)) {
                loadMeta(prefix).catch(() => {});
            }
            const meta = metaCache.get(prefix) || null;

            const img = spriteCache.get(imgUrl);
            if (img && img.complete && img.naturalWidth > 0) {
                const actMeta = meta?.[actionName];
                const dirMeta = actMeta?.dirs?.[String(animDirection)];

                let totalFrames = 1;
                let fw = 0;
                let fh = 0;
                let hx = 0;
                let hy = 0;

                if (actMeta && dirMeta) {
                    totalFrames = actMeta.frames;
                    fw = dirMeta.fw;
                    fh = dirMeta.fh;
                    hx = dirMeta.hx;
                    hy = dirMeta.hy;
                } else {
                    totalFrames = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
                    fw = img.naturalWidth / totalFrames;
                    fh = img.naturalHeight;
                    hx = fw / 2;
                    hy = fh / 2;
                }

                // 动画帧索引（大幅加快动作播放速度：移动/攻击 30fps 敏捷干脆，待机 20fps 自然舒展）
                const speedDivisor = animState === 'idle' ? 3 : 2;
                const curFrame = Math.floor(frame / speedDivisor) % totalFrames;
                const sx = curFrame * fw;
                const sy = 0;
                const sw = fw;
                const sh = fh;

                const s = u.scale;
                const dw = fw * s;
                const dh = fh * s;
                const dx = u.x - hx * s;
                const dy = u.y - hy * s;

                // 绘制单帧
                ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

                // 绘制标签（若有）
                if (u.label) {
                    ctx.fillStyle = '#f5e6c8';
                    ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                    ctx.fillText(u.label, u.x, u.y + (fh - hy) * s + 18);
                    ctx.shadowBlur = 0;
                }
            } else {
                loadSprite(imgUrl).catch(() => {});
                // 占位圆
                ctx.fillStyle = '#4a3c20';
                ctx.beginPath();
                ctx.arc(u.x, u.y, 10 * u.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        frame++;
        animTimer = requestAnimationFrame(renderLoop);
    };

    renderLoop();
}

// ============================================================
// 8. 存盘与全局事件
// ============================================================

async function saveAllCompositions(): Promise<void> {
    try {
        els.btnSaveAll.disabled = true;
        els.btnSaveAll.textContent = '💾 保存中…';

        const res = await fetch('/api/save-faction-compositions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ compositions: localCustomCompositions }),
        });

        if (!res.ok) throw new Error(await res.text());

        showToast('🎉 已写入 FactionCompositions.ts');
        // 🔴 自动报错：写盘后自动校验军团命名铁律，有违规弹窗列出
        reportLegionNameViolations();
    } catch (e: any) {
        showToast('❌ 保存失败：' + (e?.message || e), true);
    } finally {
        els.btnSaveAll.disabled = false;
        els.btnSaveAll.textContent = '💾 全部写盘';
    }
}

// 事件绑定
els.search.addEventListener('input', () => {
    searchQuery = els.search.value;
    applyFilter();
    renderTable();
});

els.regionFilter.addEventListener('change', () => {
    selectedRegionFilter = els.regionFilter.value;
    applyFilter();
    renderTable();
});

els.statusFilter.addEventListener('change', () => {
    selectedStatusFilter = els.statusFilter.value as any;
    applyFilter();
    renderTable();
});

// 视图切换：势力军团 ↔ 兵种图鉴
document.querySelectorAll('.le-viewtab').forEach(tab => {
    tab.addEventListener('click', () => {
        switchMainView((tab as HTMLElement).dataset.view as MainView);
    });
});

// 兵种图鉴筛选
const runCatalogFilter = () => { applyCatalogFilter(); renderCatalogTable(); };
els.catSearch.addEventListener('input', debounce(() => {
    catalogSearch = els.catSearch.value;
    runCatalogFilter();
}));
els.catFilter.addEventListener('change', () => {
    catalogCatFilter = els.catFilter.value as typeof catalogCatFilter;
    catalogSubFilter = 'all';
    populateSubFilter();
    runCatalogFilter();
});
els.subFilter.addEventListener('change', () => {
    catalogSubFilter = els.subFilter.value as typeof catalogSubFilter;
    runCatalogFilter();
});
els.tierFilter.addEventListener('change', () => {
    catalogTierFilter = els.tierFilter.value as typeof catalogTierFilter;
    runCatalogFilter();
});
els.ageFilter.addEventListener('change', () => {
    catalogAgeFilter = els.ageFilter.value as typeof catalogAgeFilter;
    runCatalogFilter();
});

els.btnReload.addEventListener('click', () => {
    localCustomCompositions = { ...FACTION_COMPOSITIONS };
    buildRows();
    applyFilter();
    renderTable();
    if (selectedFactionId) selectFaction(selectedFactionId);
    showToast('🔄 已重新载入势力军团数据');
});

els.btnSaveAll.addEventListener('click', () => {
    saveAllCompositions();
});

// 「检查军团命名」：手动触发命名铁律校验（自动报错）
document.getElementById('le-check-legions')?.addEventListener('click', () => {
    buildRows();
    applyFilter();
    renderTable();
    reportLegionNameViolations();
});

// 快捷键 Ctrl+S 保存
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAllCompositions();
    }
});

// 启动执行
buildRows();
applyFilter();
renderTable();

// 默认选中第一个势力
if (filteredRows.length > 0) {
    selectFaction(filteredRows[0].factionId);
}
