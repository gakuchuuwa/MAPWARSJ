/**
 * 🔴 军团编辑器最高铁律：一个军团只能有一种编制。
 * 三排兵种按前/中/后顺序一致 + 阵型一样 = 同一种编制。
 * 武将换军团只改归属；编辑军团必须全体同步，严禁同名多编制。
 * 所有编写者必须先读本目录 AGENTS.md；界面、快捷键、保存接口遵守同一规则。
 */
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
    getRegionLegionComposition,
    getLegionCompositionByName,
    applyCultureFormationPatch,
    patchLegionComposition,
    dropLegionFromMemory,
    CULTURE_LEGION_NAMES,
    FormationMode,
    getDefaultSlotsForMode,
    convertSlotsToMode,
    getCultureLegionName,
    getBase16FormationConfig,
} from '../types/CultureFormations';
import { CompositionSlot, getDefaultScaleForUnitType } from '../types/LegionComposition';
import { FACTION_COMPOSITIONS, CustomFactionLegion } from '../data/FactionCompositions';
import { FACTION_GENERALS, getFactionGeneral } from '../data/FactionGenerals';
import { GENERAL_ERA } from '../data/GeneralEra';
import { getExpeditionEliteConfig } from '../data/ExpeditionLegions';
import { WAR_TYPES, type WarType } from '../data/WarTypes';
import { DE_UNIT_SOURCE_TYPE, DE_SOURCE_TYPE_LABEL, DE_SOURCE_TYPE_ORDER, type DeSourceType } from '../data/deUnitSourceTypes';
import { getCombatPower, getPowerRefs, getLegionPower, invalidateCombatPowerCache } from '../data/CombatPower';
import { listNavalShipWeapons, listCultureNavalShips, type NavalWeapon, getCultureNavalShip, getNavalShipChineseName, getNavalWeapons } from '../types/NavalShipTiers';
import { STRATEGIC_SPACING_X, STRATEGIC_SPACING_Y, SPRITE_BASE_H } from '../config/LegionSpacing';
import {
    Level2CivLegionDef,
    LEVEL_2_CIV_62_LEGIONS,
    LEVEL_2_CIV_62_NAMES,
    LEVEL_2_CIV_62_MAP,
    isCivEraLegion,
} from '../data/level2Civ62Legions';
import { LEVEL_3_LEGION_NAMES, LEVEL_3_LEGIONS } from '../data/level3CustomLegions';
import { LEGION_78_SIEGE_MAP } from '../data/SiegeWeaponsByCulture';
import { mountLegionPanel } from '../legion-panel/main';
import { resolveFallbackForFaction, planFallbackForDeletedLegion, isBaseFallbackLegion } from '../systems/LegionFallbackOnDelete';

// ============================================================
// 1. 全量 AoE2 DE 兵种字典 (分类定义)
// ============================================================

// 🔴 [2026-10-19 主人令「村民、渔船、贸易车、僧侣、女祭司、传教士，归到一个新的非战斗类」] civilian＝非战斗
// other＝其他（DE 动物、秘籍玩笑单位：不编入军团，故不参加「步兵/骑兵/远程都要被军团套用」校验）
export type UnitCategory = 'infantry' | 'cavalry' | 'ranged' | 'siege' | 'naval' | 'hero' | 'civilian' | 'other';

/**
 * 兵种时代（与游戏一致的四时代）。
 * 🔴 'unknown' = 待核。这不是"该兵种没有时代"，而是没有可靠依据、拒绝编一个值填进去：
 *    三国 / Chronicles / 契丹 · 女真等较新 DLC 的单位，以及「罗马回归」(AoE1) 素材，
 *    时代归属需要对着游戏逐个确认。图鉴里可一键筛出这一档来补。
 */
export type UnitAge = 'antiquity' | 'feudal' | 'castle' | 'imperial';

export const AGE_LABEL: Record<UnitAge, string> = {
    antiquity: '古典时代',
    feudal: '封建时代',
    castle: '城堡时代',
    imperial: '帝国时代',
};

/** 时代排序权重：按解锁先后，待核永远垫底 */
export const AGE_ORDER: UnitAge[] = ['antiquity', 'feudal', 'castle', 'imperial'];

/**
 * 四时代的历史断代与归档铁律（2026-09-06 确立）：
 * 核心准则：【符合历史，游戏合理】
 * 
 * 1. 绝对断代尺度：
 *    - 古典时代（antiquity）：起始 – 公元 476 年
 *    - 封建时代（feudal）：公元 476 年 – 公元 1050 年
 *    - 城堡时代（castle）：公元 1050 年 – 公元 1500 年
 *    - 帝国时代（imperial）：公元 1500 年 – 公元 1900 年
 *
 * 2. 基础与精锐进阶跨度铁律：
 *    - 所有的基础形态与进阶/重装/精锐形态，必须【在同一时代】或者【差一个时代】，绝对不允许断层式跨越两个时代！
 *    - 古典兵种进阶：同在古典时代（如双轮战车高级、百夫长精锐），或差一代进入封建时代（如三国三大精锐军团）。
 *    - 封建兵种进阶：同在封建时代（如南北朝黑光铠重装、匈奴答剌罕精锐），或差一代进入城堡时代（如高级近卫军、高级掷矛手、中级大战舰）。
 *    - 城堡兵种进阶：差一代进入帝国时代（如诸葛弩精锐、日本武士精锐、蒙古突骑精锐等中世纪城堡特色兵）。
 *
 * 3. 科技树与兵器生态合理性：
 *    - 封建时代为轻装交锋生态（轻步、轻骑、轻射手），杜绝火器早产与重型攻城武器前置；
 *    - 城堡时代为主力城堡特色兵、重骑兵、攻城武器厂器械盛期；
 *    - 帝国时代为火器（火枪手、加农火炮）、大航海战舰（盖伦帆船、卡拉克船）与终极精锐进阶。
 *
 * 4. 🔴 [2026-09-09 主人定] 攻城冷兵器 26 件按【三个时代】铺开（帝国时代不放冷兵器攻城器）：
 *    原先只有古典与城堡两档，封建时代一件都没有 —— 断代尺度里 476–1050 这段空着不合理。
 *    - 古典 12：古典冲车三档 / 古典投石三档 / 古典弩炮两档 / 古典攻城塔 /
 *        赫勒波利斯（前 305 罗德岛围城）/ 华夏牵引投石机（汉末霹雳车，官渡之战已有）/
 *        阿契美尼德攻城弩炮（DE dat 归属 civ Achaemenids，编年史「希腊之战」波斯专属）
 *    - 封建 6（476–1050，全是基础/轻型形态，不违反「重型攻城武器不前置」）：
 *        轻型攻城槌（早期中世纪木冲车）、欧洲轻型投石车（阿瓦尔人 6 世纪带进欧洲的牵引砲）、
 *        欧洲弩炮（罗马晚期→拜占庭延续的扭力弩炮）、攻城塔（法兰克/维京/拜占庭围城连续使用）、
 *        沙漠骆驼投石机（阿拉伯征服期驮载曼加尼克）、高棉弩炮战象（吴哥王朝 802 年起）
 *    - 城堡 8（1050–1500，全是装甲/重型/精锐档，器械盛期）：
 *        装甲攻城槌、重型攻城槌、中型投石车、重型投石车、重型弩炮、
 *        精锐弩炮战象、火焰骆驼（帖木儿 1398 德里之战）、爆破工兵
 *    进阶链全部满足「同代或差一代」：轻冲车封建→装甲/重型城堡；轻投石封建→中/重城堡；
 *    弩炮封建→重弩炮城堡；弩炮象封建→精锐城堡。
 *    实际发放（哪个文化、哪个时代发哪几件）在 src/data/SiegeWeaponsByCulture.ts，
 *    验收 `npm run siege:era-audit`。
 */
export const AGE_YEARS: Record<UnitAge, { span: string; anchor: string }> = {
    antiquity: { span: '起始 – 公元 476 年', anchor: '起始至公元 476 年' },
    feudal: { span: '公元 400 年 – 公元 1050 年', anchor: '公元 400 年至 1050 年' },
    castle: { span: '公元 1050 年 – 公元 1500 年', anchor: '公元 1050 年至 1500 年' },
    imperial: { span: '公元 1500 年 – 公元 1900 年', anchor: '公元 1500 年至 1900 年' },
};


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
    civilian: '非战斗',
    other: '其他',
};

/**
 * 二级分类（兵种鉴赏网站用）：在每个大类内部再细分，按「拿什么武器 / 骑什么」归类。
 * 判据 = 中文名 + DE 真值（class）交叉核对，不看 ID 名字的英文字面。
 */
export type SubCategory =
    // 步兵
    | 'sword_shield' | 'spear' | 'two_handed'
    // 远程
    | 'archer' | 'crossbow' | 'thrown' | 'gunpowder' | 'magic'
    // 骑兵
    | 'melee_cav' | 'horse_archer' | 'elephant' | 'chariot'
    // 攻城
    | 'gunpowder_siege' | 'mechanical'
    // 船只
    | 'galley' | 'fire_ship' | 'cannon_ship' | 'demo_ship' | 'warship'
    // 英雄
    | 'mounted_hero' | 'horse_archer_hero' | 'foot_hero' | 'foot_archer_hero' | 'magic_hero' | 'elephant_hero' | 'naval_hero' | 'noncombat_hero';

export const SUBCATEGORY_LABEL: Record<SubCategory, string> = {
    sword_shield: '刀盾',
    spear: '长矛',
    two_handed: '双手',
    archer: '弓手',
    crossbow: '弩手',
    thrown: '投掷',
    gunpowder: '火器',
    magic: '法术',
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
    horse_archer_hero: '弓骑',
    foot_hero: '步战',
    foot_archer_hero: '步射',
    magic_hero: '法术',
    elephant_hero: '象驾',
    naval_hero: '旗舰',
    noncombat_hero: '非战斗',
};

/** 每个大类下有哪些子类（图鉴子类过滤下拉 + 排序都用它） */
export const SUBCATEGORY_BY_CATEGORY: Record<UnitCategory, SubCategory[]> = {
    infantry: ['sword_shield', 'spear', 'two_handed'],
    ranged: ['archer', 'crossbow', 'thrown', 'gunpowder', 'magic'],   // 🔴 [2026-10-19 主人令「所有传教士，祭祀，僧侣，异教徒都是法术」「法术属于远程中的一类」]
    cavalry: ['melee_cav', 'horse_archer', 'elephant', 'chariot'],
    siege: ['gunpowder_siege', 'mechanical'],
    naval: ['galley', 'fire_ship', 'cannon_ship', 'demo_ship', 'warship'],
    hero: ['mounted_hero', 'horse_archer_hero', 'foot_hero', 'foot_archer_hero', 'magic_hero', 'elephant_hero', 'naval_hero', 'noncombat_hero'],
    civilian: [],
    other: [],
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
    { id: 'swordsman', name: '链甲剑士', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/SWORDSMAN/' },
    { id: 'champion', name: '冠军剑士', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },
    { id: 'liao_dao', name: '契丹辽刀手', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/LIAO_DAO/' },
    { id: 'elite_liao_dao', name: '契丹辽刀手精锐', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ELITE_LIAO_DAO/' },
    { id: 'kamayuk', name: '印加枪兵长', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/KAMAYUK/' },
    { id: 'jian_swordsman', name: '华夏步兵', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/JIAN_SWORDSMAN/' },
    { id: 'ninja', name: '日本忍者特殊', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/NINJA/' },
    { id: 'samurai', name: '日本武士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/SAMURAI_DE/' },
    { id: 'samurai_elite', name: '日本武士精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/SAMURAI_ELITE/' },
    { id: 'fire_lancer', name: '南宋火矛手', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/FIRE_LANCER/' },
    { id: 'elite_fire_lancer', name: '南宋火矛手高级', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITE_FIRE_LANCER/' },
    { id: 'white_feather_guard', name: '蜀白毦兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/WHITE_FEATHER_GUARD/' },
    { id: 'elite_white_feather_guard', name: '蜀白毦兵精锐', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_WHITE_FEATHER_GUARD/' },
    { id: 'karambit_warrior', name: '马来爪刀勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/KARAMBIT_WARRIOR/' },
    { id: 'karambit_warrior_elite', name: '马来爪刀勇士精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/KARAMBIT_WARRIOR_ELITE/' },
    { id: 'elite_guardsman', name: '古典长戟兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_GUARDSMAN/' },
    { id: 'eastern_swordsman', name: '穆斯林东方剑士特殊', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/EASTERN_SWORDSMAN/' },
    { id: 'legionary', name: '罗马军团步兵', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/LEGIONARY/' },
    { id: 'throwing_axeman', name: '法兰克掷斧兵', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/THROWING_AXEMAN/' },
    { id: 'heavy_pikeman', name: '欧洲重装长枪兵特殊', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/HEAVY_PIKEMAN/' },
    { id: 'pikeman', name: '长枪兵', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/PIKEMAN/' },
    { id: 'tiger_rider', name: '魏虎骑兵', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/TIGER_RIDER/' },
    { id: 'xianbei_raider', name: '鲜卑掠骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/XIANBEI_RAIDER/' },
    { id: 'iron_pagoda', name: '女真铁浮屠', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/IRON_PAGODA/' },
    { id: 'hei_kuang', name: '南北朝黑光铠骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/HEI_KUANG/' },
    { id: 'hei_kuang_heavy', name: '南北朝黑光铠骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/HEI_KUANG_HEAVY/' },
    { id: 'steppe_lancer', name: '草原枪骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/STEPPE_LANCER/' },
    { id: 'elite_steppe_lancer', name: '草原枪骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITE_STEPPE_LANCER/' },
    { id: 'keshik', name: '鞑靼怯薛军', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/KESHIK/' },
    { id: 'tarkan', name: '匈奴答剌罕骑兵', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/TARKAN/' },
    { id: 'elite_tarkan', name: '匈奴答剌罕骑兵精锐', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/ELITE_TARKAN/' },
    { id: 'boyar', name: '斯拉夫贵族铁骑', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/BOYAR/' },
    { id: 'savar', name: '萨珊波斯萨瓦兰骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/SAVAR/' },
    { id: 'camel_heavy', name: '骆驼骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/CAMEL_HEAVY/' },
    { id: 'paladin', name: '骑士游侠高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/PALADIN/' },
    { id: 'coustillier', name: '勃艮第马上轻骑', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/COUSTILLIER/' },
    { id: 'chukonu', name: '中国诸葛弩', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/CHUKONU/' },
    { id: 'elite_chukonu', name: '中国诸葛弩精锐', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_CHUKONU/' },
    { id: 'longbowman_elite', name: '不列颠长弓兵精锐', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/LONGBOWMAN_ELITE/' },
    { id: 'fire_archer', name: '吴火焰弓箭手', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/FIRE_ARCHER/' },
    { id: 'elite_fire_archer', name: '吴火焰弓箭手精锐', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_FIRE_ARCHER/' },
    { id: 'kipchak', name: '库曼钦察弓骑', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/KIPCHAK/' },
    { id: 'elite_kipchak', name: '库曼钦察弓骑精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITE_KIPCHAK/' },
    { id: 'mangudai', name: '蒙古突骑', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MANGUDAI/' },
    { id: 'mangudai_elite', name: '蒙古突骑精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MANGUDAI_ELITE/' },
    { id: 'rattan_archer', name: '越南藤弓兵', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/RATTAN_ARCHER/' },
    { id: 'rattan_archer_elite', name: '越南藤弓兵精锐', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/RATTAN_ARCHER_ELITE/' },
    { id: 'imperial_skirmisher', name: '越南掷矛手高级', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/IMPERIAL_SKIRMISHER/' },
    { id: 'archer', name: '步弓手', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/ARCHER/' },
    { id: 'cav_archer', name: '骑射手', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CAV_ARCHER/' },
    { id: 'cav_archer_heavy', name: '骑射手高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/CAV_ARCHER_HEAVY/' },
    { id: 'pattiyoda_longbowman', name: '帕提尤达长弓兵', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/PATTIYODA_LONGBOWMAN/' },
    { id: 'elite_pattiyoda_longbowman', name: '帕提尤达长弓兵精锐', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/PATTIYODA_LONGBOWMAN/' },
    { id: 'composite_bowman', name: '亚美尼亚复合弓手', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/COMPOSITE_BOWMAN/' },
    { id: 'elite_composite_bowman', name: '亚美尼亚复合弓手精锐', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/ELITE_COMPOSITE_BOWMAN/' },
    { id: 'crossbowman', name: '劲弩手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/CROSSBOWMAN/' },
    { id: 'arbalest', name: '劲弩手高级', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ARBALEST/' },
    { id: 'arambai', name: '缅甸飞镖骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ARAMBAI/' },
    { id: 'war_elephant', name: '波斯战象', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/WAR_ELEPHANT/' },
    { id: 'battle_elephant', name: '战斗象', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/BATTLEELEPHANT/' },
    { id: 'armored_elephant', name: '装甲攻城战象', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ARMORED_ELEPHANT/' },
    { id: 'elite_armored_elephant', name: '装甲攻城战象高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEARMOREDELEPHANT/' },
    { id: 'ballista_elephant', name: '高棉弩炮战象', category: 'siege', age: 'feudal', pathPrefix: '/SUCAI/BALLISTA_ELEPHANT/' },
    { id: 'elephant_archer', name: '象弓骑兵', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELEPHANT_ARCHER/' },
    { id: 'amazon_archer', name: '亚马逊女弓手特殊', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/AMAZONARCHER/' },
    { id: 'amazon_warrior', name: '亚马逊女战士特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/AMAZONWARRIOR/' },
    { id: 'bactrian_archer', name: '巴克特里亚弓手特殊', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/BACTRIAN_ARCHER/' },
    { id: 'battering_ram', name: '轻型攻城槌', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/BATTERINGRAM/' },
    { id: 'berserk', name: '维京狂战士', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/BERSERK/' },
    { id: 'blackwood_archer', name: '图皮黑木弓箭手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/BLACKWOODARCHER/' },
    { id: 'bolas_rider', name: '马普切套索骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/BOLASRIDER/' },
    { id: 'bombard_cannon', name: '手推攻城火炮', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/BOMBARDCANNON/' },
    { id: 'camel_archer', name: '柏柏尔骆驼弓骑', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/CAMELARCHER/' },
    { id: 'camel_raider', name: '阿拉伯骆驼突袭者特殊', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/CAMEL_RAIDER/' },
    { id: 'camel_rider', name: '骆驼骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CAMELRIDER/' },
    { id: 'camel_scout', name: '古吉拉特骆驼斥候', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/CAMELSCOUT/' },
    { id: 'capped_ram', name: '中型攻城槌高级', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/CAPPEDRAM/' },
    { id: 'cataphract', name: '拜占庭圣骑兵', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/CATAPHRACT/' },
    { id: 'centurion', name: '罗马百夫长', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/CENTURION/' },
    { id: 'chakram_thrower', name: '古吉拉特飞轮掷手', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/CHAKRAMTHROWER/' },
    { id: 'companion_cavalry', name: '马其顿伙伴骑兵', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/COMPANION_CAVALRY/' },
    { id: 'elite_companion_cavalry', name: '马其顿伙伴骑兵精锐', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/COMPANION_CAVALRY/' },
    { id: 'condottiero', name: '意大利佣兵高级', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/CONDOTTIERO/' },
    { id: 'conquistador', name: '西班牙征服者', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/CONQUISTADOR/' },
    { id: 'cretan_archer', name: '克里特弓手特殊', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/CRETAN_ARCHER/' },
    { id: 'eagle_scout', name: '美洲鹰斥候', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/EAGLESCOUT/' },
    { id: 'eagle_warrior', name: '鹰勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/EAGLEWARRIOR/' },
    { id: 'ekdromos', name: '希腊轻装突击兵特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/EKDROMOS/' },
    { id: 'elite_arambai', name: '缅甸飞镖骑兵精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEARAMBAI/' },
    { id: 'elite_ballista_elephant', name: '高棉弩炮战象精锐', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ELITEBALLISTAELEPHANT/' },
    { id: 'elite_battle_elephant', name: '战斗象高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEBATTLEELEPHANT/' },
    { id: 'elite_berserk', name: '维京狂战士精锐', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ELITEBERSERK/' },
    { id: 'elite_blackwood_archer', name: '图皮黑木弓箭手精锐', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITEBLACKWOODARCHER/' },
    { id: 'elite_bolas_rider', name: '马普切套索骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEBOLASRIDER/' },
    { id: 'elite_boyar', name: '斯拉夫贵族铁骑精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEBOYAR/' },
    { id: 'elite_camel_archer', name: '柏柏尔骆驼弓骑精锐', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/ELITECAMELARCHER/' },
    { id: 'elite_cataphract', name: '拜占庭圣骑兵精锐', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/ELITECATAPHRACT/' },
    { id: 'elite_centurion', name: '罗马百夫长精锐', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ELITECENTURION/' },
    { id: 'elite_chakram_thrower', name: '古吉拉特飞轮掷手精锐', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/ELITECHAKRAMTHROWER/' },
    { id: 'elite_champi_warrior', name: '蔷琵战士', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITECHAMPIWARRIOR/' },
    { id: 'elite_conquistador', name: '西班牙征服者精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITECONQUISTADOR/' },
    { id: 'elite_coustillier', name: '勃艮第马上轻骑精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITECOUSTILLIER/' },
    { id: 'elite_eagle_warrior', name: '鹰战士', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEEAGLEWARRIOR/' },
    { id: 'elite_elephant_archer', name: '象弓骑兵高级', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITEELEPHANTARCHER/' },
    { id: 'elite_gbeto', name: '马里格贝托女兵精锐', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITEGBETO/' },
    { id: 'elite_genitour', name: '标枪骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEGENITOUR/' },
    { id: 'elite_genoese_crossbowman', name: '意大利热那亚弩手精锐', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITEGENOESECROSSBOWMAN/' },
    { id: 'elite_ghulam', name: '印度斯坦古拉姆精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/ELITEGHULAM/' },
    { id: 'elite_guecha_warrior', name: '穆伊斯卡格查勇士精锐', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITEGUECHAWARRIOR/' },
    { id: 'elite_huskarl', name: '哥特近卫军精锐', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ELITEHUSKARL/' },
    { id: 'hearth_troop', name: '撒克逊扈从部队', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/HEARTHTROOP/' },
    { id: 'elite_hearth_troop', name: '撒克逊扈从部队精锐', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ELITEHEARTHTROOP/' },
    { id: 'jomsviking', name: '丹麦约姆斯维京', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/JOMSVIKING/' },
    { id: 'elite_jomsviking', name: '丹麦约姆斯维京精锐', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ELITEJOMSVIKING/' },
    { id: 'varangian_guard', name: '瓦良格卫队', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/VARANGIANGUARD/' },
    { id: 'elite_varangian_guard', name: '瓦良格卫队高级', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEVARANGIANGUARD/' },
    { id: 'varangian_jarl', name: '瓦良格首领', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/JARL/' },
    { id: 'elite_varangian_jarl', name: '瓦良格首领精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEJARL/' },
    { id: 'elite_hussite_wagon', name: '波希米亚胡斯战车精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEHUSSITEWAGON/' },
    { id: 'elite_ibirapema_warrior', name: '图皮战棍勇士高级', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITEIBIRAPEMAWARRIOR/' },
    { id: 'elite_iron_pagoda', name: '女真铁浮屠精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEIRONPAGODA/' },
    { id: 'elite_jaguar_warrior', name: '阿兹特克豹勇士精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/ELITEJAGUARWARRIOR/' },
    { id: 'elite_janissary', name: '土耳其苏丹亲兵精锐', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ELITEJANISSARY/' },
    { id: 'elite_kamayuk', name: '印加枪兵长精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/ELITEKAMAYUK/' },
    { id: 'elite_keshik', name: '鞑靼怯薛军精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEKESHIK/' },
    { id: 'elite_kona', name: '马普切科纳勇士精锐', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITEKONA/' },
    { id: 'elite_konnik', name: '保加利亚骑兵精锐', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/ELITEKONNIK/' },
    { id: 'elite_konnik_foot', name: '锤炼兵高级', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ELITEFOOTKONNIK/' },
    { id: 'elite_leitis', name: '立陶宛列提斯精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITELEITIS/' },
    { id: 'elite_magyar_huszar', name: '马扎尔骠骑兵精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEMAGYARHUSZAR/' },
    { id: 'elite_mameluke', name: '萨拉森马穆鲁克精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEMAMELUKE/' },
    { id: 'elite_monaspa', name: '格鲁吉亚莫纳斯帕精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEMONASPA/' },
    { id: 'elite_obuch', name: '波兰奥布奇战锤兵精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/ELITEOBUCH/' },
    { id: 'elite_organ_gun', name: '葡萄牙风琴炮精锐', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ELITEORGANGUN/' },
    { id: 'elite_plumed_archer', name: '玛雅羽箭手精锐', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITEPLUMEDARCHER/' },
    { id: 'elite_ratha_melee', name: '孟加拉拉塔战车高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ELITERATHAMELEE/' },
    { id: 'elite_ratha_ranged', name: '孟加拉拉塔弓战车精锐', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ELITERATHARANGED/' },
    { id: 'elite_scythian_horse_archer', name: '斯基泰骑射手高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/' },
    { id: 'elite_serjeant', name: '西西里军士长精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/ELITESERJEANT/' },
    { id: 'elite_shotel_warrior', name: '埃塞俄比亚弯刀勇士精锐', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/ELITESHOTELWARRIOR/' },
    { id: 'elite_shrivamsha_rider', name: '什里瓦姆沙骑手高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/ELITESHRIVAMSHARIDER/' },
    { id: 'elite_skirmisher', name: '掷矛手高级', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/ELITESKIRMISHER/' },
    { id: 'elite_temple_guard', name: '穆伊斯卡神庙守卫高级', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/ELITETEMPLEGUARD/' },
    { id: 'elite_teutonic_knight', name: '条顿武士精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/ELITETEUTONICKNIGHT/' },
    { id: 'elite_throwing_axeman', name: '法兰克掷斧兵精锐', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/ELITETHROWINGAXEMAN/' },
    { id: 'elite_tiger_cavalry', name: '魏虎骑兵精锐', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ELITETIGERCAVALRY/' },
    { id: 'elite_urumi_swordsman', name: '达罗毗荼软剑士精锐', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/ELITEURUMISWORDSMAN/' },
    { id: 'elite_war_chariot', name: '双轮战车高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_WAR_CHARIOT/' },
    { id: 'elite_war_dog', name: '战犬高级', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/ELITEWARDOG/' },
    { id: 'elite_war_elephant', name: '波斯战象精锐', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/ELITEWARELEPHANT/' },
    { id: 'bayinnaung_elephant', name: '缅甸御驾战象', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/BAYINNAUNG_ELEPHANT/' },
    { id: 'dagnajan_elephant', name: '达格纳詹御驾战象', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/DAGNAJAN_ELEPHANT/' },
    { id: 'porus_elephant', name: '波鲁斯王战象', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/PORUS_ELEPHANT/' },
    { id: 'elite_war_wagon', name: '高丽战车精锐', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/ELITEWARWAGON/' },
    { id: 'elite_woad_raider', name: '凯尔特靛蓝突袭者精锐', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/ELITEWOADRAIDER/' },
    { id: 'flaming_camel', name: '鞑靼火焰骆驼', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/FLAMINGCAMEL/' },
    { id: 'flemish_pikeman', name: '勃艮第佛兰德民兵', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/FLEMISHPIKEMAN/' },
    { id: 'flemish_pikeman_f', name: '勃艮第佛兰德民兵高级', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/FLEMISHPIKEMAN_F/' },
    { id: 'gbeto', name: '马里格贝托女兵', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/GBETO/' },
    { id: 'genitour', name: '标枪骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/GENITOUR/' },
    { id: 'genoese_crossbowman', name: '意大利热那亚弩手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/GENOESECROSSBOWMAN/' },
    { id: 'ghulam', name: '印度斯坦古拉姆', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/GHULAM/' },
    { id: 'greek_noble_cavalry', name: '希腊贵族骑兵特殊', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/GREEK_NOBLE_CAVALRY/' },
    { id: 'grenadier', name: '掷弹兵', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/GRENADIER/' },
    { id: 'guecha_warrior', name: '穆伊斯卡格查勇士', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/GUECHAWARRIOR/' },
    { id: 'hand_cannoneer', name: '火枪手', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/HANDCANNONEER/' },
    { id: 'heavy_rocket_cart', name: '重型火箭车精锐', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/HEAVYROCKETCART/' },
    { id: 'heavy_scorpion', name: '中型弩炮高级', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/HEAVYSCORPION/' },
    { id: 'hill_tribesman', name: '中亚山地部落民特殊', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/HILL_TRIBESMAN/' },
    { id: 'hippeus', name: '斯巴达三百', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/HIPPEUS/' },
    { id: 'elite_hippeus', name: '斯巴达三百精锐', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/HIPPEUS/' },
    { id: 'hoplite', name: '希腊步兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/HOPLITE/' },
    { id: 'elite_hoplite', name: '希腊步兵高级', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/HOPLITE/' },
    { id: 'strategos', name: '雅典将军卫队', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/STRATEGOS/' },
    { id: 'elite_strategos', name: '雅典将军卫队精锐', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/STRATEGOS/' },
    { id: 'houfnice', name: '手推榴弹炮', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/HOUFNICE/' },
    { id: 'huskarl', name: '哥特近卫军', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/HUSKARL/' },
    { id: 'hussar', name: '骠骑兵', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/HUSSAR/' },
    { id: 'hussite_wagon', name: '波希米亚胡斯战车', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/HUSSITEWAGON/' },
    { id: 'ibirapema_warrior', name: '图皮战棍勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/IBIRAPEMAWARRIOR/' },
    { id: 'immortal', name: '波斯长生军', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/IMMORTAL/' },
    { id: 'elite_immortal', name: '波斯长生军精锐', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/IMMORTAL/' },
    { id: 'immortal_ranged', name: '波斯长生军弓手', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/RANGED_IMMORTAL/' },
    { id: 'elite_immortal_ranged', name: '波斯长生军弓手高级', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/RANGED_IMMORTAL/' },
    { id: 'imperial_camel_rider', name: '印度斯坦帝王骆驼兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/IMPERIALCAMELRIDER/' },
    { id: 'imperial_centurion', name: '罗马帝国百夫长特殊', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/IMPERIALCENTURION/' },
    { id: 'indian_tribesman', name: '印度部落民特殊', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/INDIAN_TRIBESMAN/' },
    { id: 'iroquois_warrior', name: '易洛魁战士特殊', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/IROQUOISWARRIOR/' },
    { id: 'jaguar_warrior', name: '阿兹特克豹勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/JAGUARWARRIOR/' },
    { id: 'janissary', name: '土耳其苏丹亲兵', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/JANISSARY/' },
    { id: 'knight', name: '骑士', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/KNIGHT/' },
    { id: 'kona', name: '马普切科纳勇士', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/KONA/' },
    { id: 'konnik', name: '保加利亚骑兵', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/KONNIK/' },
    { id: 'konnik_foot', name: '锤炼兵', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/FOOTKONNIK/' },
    { id: 'leitis', name: '立陶宛列提斯', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/LEITIS/' },
    { id: 'longbowman', name: '不列颠长弓兵', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/LONGBOWMAN/' },
    { id: 'magyar_huszar', name: '马扎尔骠骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MAGYARHUSZAR/' },
    { id: 'mameluke', name: '萨拉森马穆鲁克', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MAMELUKE/' },
    { id: 'mangonel', name: '轻型投石车', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/MANGONEL/' },
    { id: 'mercenary_hoplite', name: '希腊雇佣重装步兵特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_HOPLITE/' },
    { id: 'militia', name: '武装民兵', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/MILITIA/' },
    { id: 'monaspa', name: '格鲁吉亚莫纳斯帕', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MONASPA/' },
    { id: 'mounted_trebuchet', name: '沙漠骆驼投石机高级', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/MOUNTEDTREBUCHET/' },
    { id: 'obuch', name: '波兰奥布奇战锤兵', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/OBUCH/' },
    { id: 'onager', name: '中型投石车高级', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ONAGER/' },
    { id: 'organ_gun', name: '葡萄牙风琴炮', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/ORGANGUN/' },
    { id: 'petard', name: '爆破工兵', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/PETARD/' },
    { id: 'phalangite', name: '马其顿方阵步兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/PHALANGITE/' },
    { id: 'elite_phalangite', name: '马其顿方阵步兵高级', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/PHALANGITE/' },
    { id: 'plumed_archer', name: '玛雅羽箭手', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/PLUMEDARCHER/' },
    { id: 'qizilbash_warrior', name: '波斯红头战士特殊', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/QIZILBASHWARRIOR/' },
    { id: 'ratha_melee', name: '孟加拉拉塔战车', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/RATHAMELEE/' },
    { id: 'ratha_ranged', name: '孟加拉拉塔弓战车', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/RATHARANGED/' },
    { id: 'rhodian_slinger', name: '罗得岛投石手特殊', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/RHODIAN_SLINGER/' },
    { id: 'rhomphaia_warrior', name: '色雷斯长刃斩手', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/RHOMPHAIA_WARRIOR/' },
    { id: 'elite_rhomphaia_warrior', name: '色雷斯长刃斩手精锐', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/RHOMPHAIA_WARRIOR/' },
    { id: 'rocket_cart', name: '火箭车', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/ROCKETCART/' },
    { id: 'royal_janissary', name: '奥斯曼皇家亲兵特殊', category: 'ranged', age: 'imperial', pathPrefix: '/SUCAI/ROYALJANISSARY/' },
    { id: 'sacred_band', name: '底比斯圣队特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/SACRED_BAND/' },
    { id: 'sannahya', name: '桑纳亚战象', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/SANNAHYA/' },
    { id: 'elite_sannahya', name: '桑纳亚战象高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/SANNAHYA/' },
    { id: 'scorpion', name: '轻型弩炮机', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/SCORPION/' },
    { id: 'scythian_axe_cavalry', name: '斯基泰斧骑兵特殊', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/SCYTHIAN_AXE_CAVALRY/' },
    { id: 'scythian_horse_archer', name: '斯基泰骑射手特殊', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/SCYTHIAN_HORSE_ARCHER/' },
    { id: 'serjeant', name: '西西里军士长', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/SERJEANT/' },
    { id: 'shotel_warrior', name: '埃塞俄比亚弯刀勇士', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/SHOTELWARRIOR/' },
    { id: 'shrivamsha_rider', name: '什里瓦姆沙骑手', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/SHRIVAMSHARIDER/' },
    { id: 'sickle_warrior', name: '赫梯镰刀战士特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/SICKLE_WARRIOR/' },
    { id: 'siege_onager', name: '重型投石车高级', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/SIEGEONAGER/' },
    { id: 'siege_ram', name: '重型攻城槌高级', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/SIEGERAM/' },
    { id: 'skirmisher', name: '掷矛手', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/SKIRMISHER/' },
    { id: 'slinger', name: '投石兵', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/SLINGER/' },
    { id: 'sogdian_cataphract', name: '粟特甲胄骑兵特殊', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/SOGDIANCATAPHRACT/' },
    { id: 'sparabara', name: '波斯持盾兵特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/SPARABARA/' },
    { id: 'spearman', name: '长矛兵', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/SPEARMAN/' },
    { id: 'sakan_axeman', name: '塞种斧兵特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/SAKAN_AXEMAN/' },
    { id: 'temple_guard', name: '穆伊斯卡神庙守卫', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/TEMPLEGUARD/' },
    { id: 'teutonic_knight', name: '条顿武士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/TEUTONICKNIGHT/' },
    { id: 'tarantine_cavalry', name: '塔兰托骑兵特殊', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/TARANTINE_CAVALRY/' },
    { id: 'thracian_peltast', name: '色雷斯雇佣轻盾兵特殊', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/THRACIAN_PELTAST/' },
    { id: 'traction_trebuchet', name: '华夏牵引投石机重装', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/TRACTIONTREBUCHET/' },
    { id: 'two_handed_swordsman', name: '双手剑士', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/TWOHANDEDSWORDSMAN/' },
    { id: 'urumi_swordsman', name: '达罗毗荼软剑士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/URUMISWORDSMAN/' },
    { id: 'war_chariot', name: '双轮战车', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/WAR_CHARIOT/' },
    { id: 'war_chariot_ranged', name: '先秦远程战车', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/WARCHARIOT/' },
    { id: 'war_dog', name: '战犬', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/WARDOG/' },
    { id: 'war_wagon', name: '高丽战车', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/WARWAGON/' },
    { id: 'warrior_priest', name: '亚美尼亚修士战士高级', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/WARRIORPRIEST/' },
    { id: 'winged_hussar', name: '波兰翼骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/WINGEDHUSSAR/' },
    { id: 'woad_raider', name: '凯尔特靛蓝突袭者', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/WOADRAIDER/' },
    { id: 'xolotl_warrior', name: '阿兹特克索洛特尔骑兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/XOLOTLWARRIOR/' },
    { id: 'longswordsman', name: '重装剑士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/LONGSWORDSMAN/' },
    { id: 'champi_warrior', name: '蔷琵勇士', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/CHAMPIWARRIOR/' },
    { id: 'champi_runner', name: '蔷琵飞毛腿', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/CHAMPIRUNNER/' },
    { id: 'champi_scout', name: '蔷琵斥候', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/CHAMPISCOUT/' },
    { id: 'jian_swordman_unshielded', name: '华夏双手步兵', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/JIAN_SWORDMAN_UNSHIELDED/' },
    { id: 'cavalier', name: '骑士高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/CAVALIER/' },
    { id: 'flamethrower', name: '华夏喷火车特殊', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/FLAMETHROWER/' },
    { id: 'helepolis', name: '希腊破城塔特殊', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/HELEPOLIS/' },
    { id: 'siege_tower', name: '攻城塔', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/SIEGETOWER/' },
    { id: 'halberdier', name: '长戟兵', category: 'infantry', age: 'imperial', pathPrefix: '/SUCAI/HALBERDIER/' },
    { id: 'norse_warrior', name: '维京北欧战士特殊', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/NORSE_WARRIOR/' },
    { id: 'sosso_guard', name: '西非索索禁卫高级', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SOSSO_GUARD/' },
    { id: 'levy', name: '古典民兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/LEVY/' },
    { id: 'gastraphetes', name: '腹弩兵', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/GASTRAPHETES/' },
    { id: 'laminated_bowman', name: '复合弓手', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/LAMINATED_BOWMAN/' },
    { id: 'recurve_bowman', name: '反曲长弓手', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/RECURVE_BOWMAN/' },
    { id: 'paragon', name: '荣誉剑士', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/PARAGON/' },
    { id: 'shock_cavalry', name: '古典枪骑兵高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/SHOCK_CAVALRY/' },
    { id: 'imperial_cavalry', name: '具装枪骑兵高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/IMPERIAL_CAVALRY/' },
    { id: 'equites', name: '罗马伴随骑士高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/EQUITES/' },
    { id: 'sarmatian', name: '萨尔马提亚骑兵', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/SARMATIAN/' },
    { id: 'elite_peltast', name: '色雷斯标枪手高级', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_PELTAST/' },
    { id: 'bowman', name: '古典弓手', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/BOWMAN/' },
    { id: 'crusader_knight', name: '欧洲十字军骑士特殊', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/CRUSADERKNIGHT/' },
    { id: 'raider', name: '掠骑兵', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/RAIDER/' },
    { id: 'guardsman', name: '古典长枪兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/GUARDSMAN/' },
    { id: 'antiquity_skirmisher', name: '古典掷矛手', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_SKIRMISHER/' },
    { id: 'elite_antiquity_skirmisher', name: '古典掷矛手高级', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/' },
    { id: 'antiquity_cavalry_archer', name: '古典骑射手', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_CAVALRY_ARCHER/' },
    { id: 'antiquity_heavy_cavalry_archer', name: '古典骑射手高级', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/' },
    { id: 'antiquity_light_cavalry', name: '古典轻骑兵', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_LIGHT_CAVALRY/' },
    { id: 'antiquity_scout_cavalry', name: '古典斥候', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_SCOUT_CAVALRY/' },
    { id: 'antiquity_spearman', name: '古典长矛兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_SPEARMAN/' },
    { id: 'antiquity_battering_ram', name: '古典轻型攻城槌', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_BATTERINGRAM/' },
    { id: 'antiquity_capped_ram', name: '古典中型攻城槌高级', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_CAPPED_RAM/' },
    { id: 'antiquity_scorpion', name: '古典轻型弩炮机', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_SCORPION/' },
    { id: 'antiquity_heavy_scorpion', name: '古典中型弩炮高级', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_HEAVY_SCORPION/' },
    { id: 'antiquity_mangonel', name: '古典轻型投石车', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_MANGONEL/' },
    { id: 'antiquity_onager', name: '古典中型投石车高级', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_ONAGER/' },
    { id: 'antiquity_siege_onager', name: '古典重型投石车高级', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_SIEGE_ONAGER/' },
    { id: 'antiquity_siege_ram', name: '古典重型攻城槌高级', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_SIEGE_RAM/' },
    { id: 'antiquity_siege_tower', name: '古典攻城塔', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/ANTIQUITY_SIEGE_TOWER/' },
    { id: 'galley', name: '桨帆船', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI/GALLEY/' },
    { id: 'war_galley', name: '大战舰', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/WAR_GALLEY/' },
    { id: 'ant_galley', name: '古典桨帆船', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/ANT_GALLEY/' },
    { id: 'ant_war_galley', name: '古典大战舰', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/ANT_WAR_GALLEY/' },
    { id: 'ant_elite_galley', name: '古典桨帆船高级', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/ANT_ELITE_GALLEY/' },
    { id: 'fire_galley', name: '喷火桨帆船', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI/FIRE_GALLEY/' },
    { id: 'fire_ship', name: '喷火船', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/FIRE_SHIP/' },
    { id: 'fast_fire_ship', name: '快速喷火船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/FAST_FIRE_SHIP/' },
    { id: 'incendiary_ship', name: '燃烧战船', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/INCENDIARY_SHIP/' },
    { id: 'heavy_incendiary_ship', name: '重型燃烧战船', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/HEAVY_INCENDIARY_SHIP/' },
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
    { id: 'thirisadai', name: '孟加拉楼船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/THIRISADAI/' },
    { id: 'catapult_ship', name: '投石舰', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/CATAPULT_SHIP/' },
    // 🔴 [2026-09-18 全面修复] ONAGER_SHIP 原叫「重型投石舰」，档次写错了：DE 本体官方简中是
    //    「中型投石船」（Onager＝中型投石车，本项目陆地兵种 onager 亦自叫「欧洲中型投石车高级」），
    //    重型是 Siege Onager。改为「中型投石舰」，与 NavalShipTiers 的 NAVAL_SHIP_CHINESE_NAMES 同名。
    { id: 'onager_ship', name: '中型投石舰', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/ONAGER_SHIP/' },
    { id: 'hero_jadwiga', name: '英雄·雅德维加·波兰', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/JADWIGA/' },   // [2026-09-07 补提] 波兰女王 1373–1399
    { id: 'hero_tamar', name: '英雄·塔玛尔·格鲁吉亚', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/TAMAR/' },   // [2026-09-07 补提] 格鲁吉亚女王 1160–1213
    { id: 'hero_zhugeliang', name: '英雄·诸葛亮·巴蜀', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ZHUGELIANG/' },   // [2026-09-07 补提] 蜀汉丞相 181–234
    { id: 'hero_bucephalus', name: '英雄·布塞法洛斯·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/BUCEPHALUS/' },   // [2026-09-07 补提] 亚历山大的战马，前 355–326
    { id: 'hero_alaric', name: '英雄·亚拉里克·哥特', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ALARIC/' },
    { id: 'hero_algirdas', name: '英雄·阿尔吉尔达斯·立陶宛', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ALGIRDAS/' },
    { id: 'hero_arariboiamelee', name: '英雄·阿拉里博亚·图皮', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ARARIBOIAMELEE/' },
    { id: 'hero_friartuck', name: '英雄·塔克修士·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_WEST/' },
    { id: 'hero_imam', name: '英雄·伊玛目·萨拉森', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_ORIE/' },
    { id: 'hero_chandbardai', name: '英雄·昌德·菩达一·瞿折罗', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_ASIA/' },
    { id: 'hero_belaiv', name: '英雄·贝拉四世国王·马扎尔', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KING_WEST/' },
    { id: 'hero_shahking', name: '英雄·沙阿王·波斯', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KING_ORIE/' },
    { id: 'hero_jayanegara', name: '英雄·贾亚纳加拉·马来', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KING_SEAS/' },
    { id: 'hero_harald', name: '英雄·哈拉尔·维京', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/HARALD/' },
    { id: 'hero_ulf', name: '英雄·乌尔夫·奥斯帕克松·维京', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ULF/' },
    { id: 'hero_halldor', name: '英雄·哈尔多尔·斯诺拉松·维京', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/HALLDOR/' },
    { id: 'hero_tostig', name: '英雄·托斯蒂格·葛温森·撒克逊', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/TOSTIG/' },
    { id: 'hero_themistocles_hoplite', name: '英雄·地米斯托克利（步战）·雅典', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/THEMISTOCLES/' },
    { id: 'hero_arariboiaranged', name: '英雄·阿拉里博亚（弓手）·图皮', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ARARIBOIARANGED/' },
    { id: 'hero_aristagoras', name: '英雄·阿里斯塔哥拉斯·希腊', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ARISTAGORAS/' },
    { id: 'hero_aristides', name: '英雄·阿里斯提德·雅典', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ARISTIDES/' },
    { id: 'hero_artaphernes', name: '英雄·阿尔塔弗涅斯·阿契美尼德', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ARTAPHERNES/' },
    { id: 'hero_ataulf', name: '英雄·阿陶尔夫·哥特', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ATAULF/' },
    { id: 'hero_attila', name: '英雄·阿提拉·匈人', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ATTILA/' },
    { id: 'hero_basileus', name: '英雄·皇帝巴西琉斯·拜占庭', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/BASILEUS/' },
    { id: 'hero_bernardarmagnac', name: '英雄·贝尔纳·德·阿马尼亚克·法兰克', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/BERNARDARMAGNAC/' },
    { id: 'hero_bohemond', name: '英雄·博希蒙德·西西里', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/BOHEMOND/' },
    { id: 'hero_brasidas', name: '英雄·巴西达斯·斯巴达', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/BRASIDAS/' },
    { id: 'hero_caocao', name: '英雄·曹操·中原', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/CAOCAO/' },
    { id: 'hero_cleitus', name: '英雄·克雷图斯·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/CLEITUS/' },
    { id: 'hero_cumanchief', name: '英雄·巴奇曼·库曼', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/CUMANCHIEF/' },   // [2026-09-08 主人定·通用形象改挂真实人物] 钦察抗蒙首领，在册 qincha_baqiman@萨拉托夫；忽炭汗已有专属素材 hero_kotyankhan，不占这套
    { id: 'hero_cunhambebe', name: '英雄·昆汉贝贝·图皮', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/CUNHAMBEBE/' },
    { id: 'hero_cusiyupanqui', name: '英雄·库西尤潘基·印加', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/CUSIYUPANQUI/' },
    { id: 'hero_dafyddapgruffydd', name: '英雄·戴菲德·凯尔特', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/DAFYDDAPGRUFFYDD/' },
    { id: 'hero_datis', name: '英雄·达提斯·阿契美尼德', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/DATIS/' },
    { id: 'hero_dinhle', name: '英雄·丁礼·越南', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/DINHLE/' },
    { id: 'hero_dismounted_alexander', name: '英雄·步战亚历山大·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/DISMOUNTED_ALEXANDER/' },
    { id: 'hero_mounted_alexander', name: '英雄·骑马亚历山大·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/MOUNTED_ALEXANDER/' },
    { id: 'hero_edwardlongshanks', name: '英雄·长腿爱德华·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/EDWARDLONGSHANKS/' },
    { id: 'hero_gajahmada', name: '英雄·加查·马达·马来', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/GAJAHMADA/' },
    { id: 'hero_galvarino', name: '英雄·加尔瓦里诺·马普切', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/GALVARINO/' },
    { id: 'hero_generalaraiyan', name: '英雄·拉贾拉贾一世·达罗毗荼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/GENERALARAIYAN/' },   // [2026-09-08 主人定·通用形象改挂真实人物] 朱罗海权开创者 985–1014；Araiyan 是泰米尔语「王/首领」，素材本属朱罗系
    { id: 'hero_gidajan', name: '英雄·吉达扬·埃塞俄比亚', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/GIDAJAN/' },
    { id: 'hero_gilbertdeclare', name: '英雄·吉尔伯特·不列颠', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/GILBERTDECLARE/' },
    { id: 'hero_girgenkhan', name: '英雄·吉尔根汗·库曼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/GIRGENKHAN/' },
    { id: 'hero_guacolda', name: '英雄·瓜科尔达·马普切', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/GUACOLDA/' },
    { id: 'hero_guanyu', name: '英雄·关羽·河朔', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/GUANYU/' },
    { id: 'hero_ivaylo', name: '英雄·骑马伊瓦伊洛·保加利亚', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/IVAYLO/' },
    { id: 'hero_ivaylofoot', name: '英雄·步战伊瓦伊洛·保加利亚', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/IVAYLOFOOT/' },
    { id: 'hero_janzizka', name: '英雄·扬·杰式卡·波希米亚', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/JANZIZKA/' },
    { id: 'hero_joanofarc', name: '英雄·全甲战马圣女贞德·法兰克', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/JOANOFARC/' },
    { id: 'hero_joanthemaid', name: '英雄·少女战士·法兰克', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/JOANTHEMAID/' },
    { id: 'hero_jogaila', name: '英雄·雅盖沃·波兰', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/JOGAILA/' },
    { id: 'hero_johnthefearless', name: '英雄·无畏的约翰·勃艮第', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/JOHNTHEFEARLESS/' },
    { id: 'hero_kestutis', name: '英雄·科斯图提斯·立陶宛', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KESTUTIS/' },
    { id: 'hero_kotyankhan', name: '英雄·忽炭汗·库曼', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KOTYANKHAN/' },
    { id: 'hero_kushluk', name: '英雄·屈出律·鞑靼', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KUSHLUK/' },
    { id: 'hero_lautaro', name: '英雄·劳塔罗·马普切', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/LAUTARO/' },
    { id: 'hero_leloi', name: '英雄·黎利·越南', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/LELOI/' },
    { id: 'hero_liubei', name: '英雄·刘备·巴蜀', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/LIUBEI/' },
    { id: 'hero_llywelynapgruffydd', name: '英雄·卢埃林·凯尔特', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/LLYWELYNAPGRUFFYDD/' },
    { id: 'hero_lubu', name: '英雄·吕布·河朔', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/LUBU/' },
    { id: 'hero_lysander', name: '英雄·吕山德·斯巴达', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/LYSANDER/' },
    { id: 'hero_macedonian_commander', name: '英雄·腓力二世·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/MACEDONIAN_COMMANDER/' },   // [2026-09-08 主人定·通用形象改挂真实人物] 马其顿方阵/萨里沙/伙伴骑兵的缔造者，前 382–336；亚历山大已有 MOUNTED/DISMOUNTED_ALEXANDER 两套专属素材
    { id: 'hero_osman', name: '英雄·奥斯曼一世·奥斯曼', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/OSMAN/' },
    { id: 'hero_pacanchique', name: '英雄·帕坎奇克·穆伊斯卡', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/PACANCHIQUE/' },
    { id: 'hero_pachacuti', name: '英雄·帕查库特克·印加', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/PACHACUTI/' },
    { id: 'hero_parmenion', name: '英雄·帕曼纽·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/PARMENION/' },
    { id: 'hero_perdiccas', name: '英雄·佩尔狄卡斯·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/PERDICCAS/' },
    { id: 'hero_philipthegood', name: '英雄·好人菲利普·勃艮第', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/PHILIPTHEGOOD/' },
    { id: 'hero_prithviraj', name: '英雄·普里特维拉吉·瞿折罗', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/PRITHVIRAJ/' },
    { id: 'hero_qutlugh', name: '英雄·忽都鲁·鞑靼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/QUTLUGH/' },
    { id: 'hero_rajendrachola', name: '英雄·罗贞陀罗·朱罗·达罗毗荼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/RAJENDRACHOLA/' },
    { id: 'hero_robertguiscard', name: '英雄·罗贝尔·吉斯卡尔·西西里', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ROBERTGUISCARD/' },
    { id: 'hero_rogerbosso', name: '英雄·罗杰·博索·西西里', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ROGERBOSSO/' },
    { id: 'hero_sforza', name: '英雄·斯福尔扎·意大利', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/SFORZA/' },
    { id: 'hero_shahismail', name: '英雄·沙阿·伊斯玛仪·波斯', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SHAHISMAIL/' },
    { id: 'hero_subotai', name: '英雄·速不台·漠北蒙古', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SUBOTAI/' },
    { id: 'hero_sumanguru', name: '英雄·苏曼古鲁·马里', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SUMANGURU/' },
    { id: 'hero_sunce', name: '英雄·孙策·江南', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/SUNCE/' },
    { id: 'hero_sundjata', name: '英雄·松迪亚塔·马里', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/SUNDJATA/' },
    { id: 'hero_sunjian', name: '英雄·孙坚·江南', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SUNJIAN/' },
    { id: 'hero_sunquan', name: '英雄·孙权·江南', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/SUNQUAN/' },
    { id: 'hero_tariqibnziyad', name: '英雄·塔里克·柏柏尔', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/TARIQIBNZIYAD/' },
    { id: 'hero_thoros', name: '英雄·托罗斯·亚美尼亚', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/THOROS/' },
    { id: 'hero_thracian_chieftain', name: '英雄·塞乌特斯三世·色雷斯', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/THRACIAN_CHIEFTAIN/' },   // [2026-09-08 主人定·通用形象改挂真实人物] 奥德里西亚色雷斯王，在册 gen_seuthes_iii@塞乌托波利（正是色雷斯区中心）
    { id: 'hero_tsarkonstantin', name: '英雄·君士坦丁沙皇·保加利亚', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/TSARKONSTANTIN/' },
    { id: 'hero_ulrichvonjungingen', name: '英雄·容金根·条顿', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ULRICHVONJUNGINGEN/' },
    { id: 'hero_vladdracula', name: '英雄·穿刺公德古拉·斯拉夫', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/VLADDRACULA/' },
    { id: 'hero_vytautasthegreat', name: '英雄·维陶塔斯大帝·立陶宛', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/VYTAUTASTHEGREAT/' },
    { id: 'hero_williamwallace', name: '英雄·威廉·华莱士·凯尔特', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/WILLIAMWALLACE/' },
    { id: 'hero_yodit', name: '英雄·尤迪特·埃塞俄比亚', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/YODIT/' },
    { id: 'hero_zhangfei', name: '英雄·张飞·巴蜀', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ZHANGFEI/' },
    { id: 'manatarms', name: '武装剑士', category: 'infantry', age: 'feudal', pathPrefix: '/SUCAI/MANATARMS/' },
    { id: 'sunda_royal_fighter', name: '爪哇巽他皇家战士高级', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/SUNDA_ROYAL_FIGHTER/' },
    { id: 'envoy', name: '英雄·柏朗嘉宾·意大利', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ENVOY/' },   // [2026-09-08 主人定·通用形象改挂真实人物] 1245–47 教皇派往蒙古汗庭的正式使节，字面意义的「欧洲使者」
    { id: 'lancer', name: '古典枪骑兵', category: 'cavalry', age: 'antiquity', pathPrefix: '/SUCAI/LANCER/' },
    { id: 'scout_cavalry', name: '斥候骑兵', category: 'cavalry', age: 'feudal', pathPrefix: '/SUCAI/SCOUTCAVALRY/' },
    { id: 'light_cavalry', name: '轻骑兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/LIGHTCAVALRY/' },
    { id: 'frankish_paladin', name: '中世纪枪骑兵', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },
    { id: 'siege_ballista', name: '古典波斯攻城弩炮', category: 'siege', age: 'antiquity', pathPrefix: '/SUCAI/SIEGE_BALLISTA/' },
    { id: 'monoreme', name: '单列桨座战船', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/MONOREME/' },
    { id: 'bireme', name: '双列桨座战船', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/BIREME/' },
    { id: 'trireme', name: '三列桨座战船', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/TRIREME/' },
    { id: 'lembos', name: '希腊轻型伦博斯', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/LEMBOS/' },
    { id: 'war_lembos', name: '希腊战型伦博斯高级', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/WAR_LEMBOS/' },
    { id: 'elite_lembos', name: '希腊旗舰伦博斯重装', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_LEMBOS/' },
    { id: 'heavy_lembos', name: '希腊重型伦博斯重装', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/HEAVY_LEMBOS/' },
    { id: 'dromon', name: '德罗蒙战舰', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/DROMON/' },
    { id: 'hulk', name: '霍克船', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI/HULK/' },
    { id: 'war_hulk', name: '霍克船高级', category: 'naval', age: 'castle', pathPrefix: '/SUCAI/WAR_HULK/' },
    { id: 'galleon', name: '盖伦帆船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/GALLEON/' },
    { id: 'carrack', name: '克拉克帆船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/CARRACK/' },
    { id: 'catapult_galleon', name: '投石盖伦船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/CATAPULT_GALLEON/' },
    { id: 'demo_raft', name: '爆破木筏', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI/DEMO_RAFT/' },
    { id: 'incendiary_raft', name: '燃烧木筏', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/INCENDIARY_RAFT/' },
    { id: 'canoe', name: '美洲独木舟特殊', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/CANOE/' },
    { id: 'merchant_ship', name: '商船', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/MERCHANT_SHIP/' },
    { id: 'junk', name: '中式帆船', category: 'naval', age: 'castle', pathPrefix: '/SUCAI_TRADE/JUNK/' },
    { id: 'trade_cog', name: '柯克货船', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI_TRADE/TRADE_COG/' },
    { id: 'transport_ship', name: '运输船', category: 'naval', age: 'feudal', pathPrefix: '/SUCAI_TRADE/TRANSPORT_SHIP/' },
    { id: 'lou_chuan', name: '中国楼船', category: 'naval', age: 'imperial', pathPrefix: '/SUCAI/LOU_CHUAN/' },
    { id: 'leviathan', name: '利维坦', category: 'naval', age: 'antiquity', pathPrefix: '/SUCAI/LEVIATHAN/' },
    // 🔴 [2026-10-02 纠正] 这条素材是完整 16 向战船旗舰，类别属于 hero（子类 naval_hero 旗舰），
    //    与阿尔特米西亚等另外 3 艘旗舰完全同档，全库 4 艘英雄旗舰整齐划一。
    { id: 'hero_themistocles', name: '英雄·地米斯托克利·雅典', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/HERO_THEMISTOCLES/' },
    { id: 'hero_artemisia', name: '英雄·阿尔特米西亚·阿契美尼德', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/HERO_ARTEMISIA/' },
    { id: 'hero_dionysus', name: '英雄·狄奥尼索斯·希腊', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/HERO_DIONYSUS/' },
    { id: 'hero_dreki', name: '英雄·龙船·维京', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/DREKI/' },
    { id: 'hero_stoertebeker', name: '英雄·斯托尔特贝克·条顿', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/HEAVY_DEMO_SHIP/' },
    { id: 'hero_aeginetan', name: '英雄·波利克里托斯·希腊', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/HERO_AEGINETAN/' },   // [2026-09-08 主人定·通用形象改挂真实人物] 希罗多德点名记载的萨拉米斯海战埃伊纳英雄；素材是 u_shp 舰船类，须海军将领
    // ── 2026-10-14 补 6 个「科技树有、鉴赏无」的 DE 官方战斗兵种（属性照 DE dat，素材 u_* SLD 提取）──
    { id: 'maceman', name: '古典钉锤兵', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/VANGUARD/' },
    { id: 'mounted_crossbowman', name: '骑马弩兵', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/MOUNTEDCROSSBOWMAN/' },
    { id: 'mounted_crossbowman_heavy', name: '骑马弩兵高级', category: 'cavalry', age: 'imperial', pathPrefix: '/SUCAI/MOUNTEDCROSSBOWMAN_HEAVY/' },
    { id: 'polemarch', name: '军事执政官', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/POLEMARCH/' },
    // ── 2026-10-16 补 9 个「科技树没有、兵种鉴赏漏收」的 DE 官方单位（暗桩/战役/废弃内容）──
    //    数据：DE dat（geniusutils 实测）+ 官方 zh 串；素材复用 DE 本体同模型目录（DE 自己也是复用）
    { id: 'bandit', name: '强盗特殊', category: 'infantry', age: 'castle', pathPrefix: '/SUCAI/MILITIA/' },
    { id: 'heavy_crossbowman', name: '欧洲重装弩手特殊', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/GENOESECROSSBOWMAN/' },
    { id: 'heavy_swordsman', name: '欧洲古典剑士特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/HEAVYSWORDSMAN/' },
    { id: 'imperial_legionary', name: '罗马帝国军团兵特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/LEGIONARY/' },
    { id: 'khan', name: '蒙古可汗特殊', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/HERO_KHAN/' },
    { id: 'mounted_samurai', name: '倭寇骑士特殊', category: 'cavalry', age: 'castle', pathPrefix: '/SUCAI/HUSSAR/' },
    { id: 'lysander_raider', name: '斯巴达吕山德掠夺者特殊', category: 'infantry', age: 'antiquity', pathPrefix: '/SUCAI/MERCENARY_HOPLITE/' },
    { id: 'outlaw', name: '亡命之徒特殊', category: 'ranged', age: 'feudal', pathPrefix: '/SUCAI/ARCHER/' },
    // ── 2026-10-19 主人令「全部解析……不能缺少任何单位」：补入 DE 有、兵种鉴赏原先没有的单位（tools/de-add-missing-units.mjs 生成）──
    { id: 'missionary', name: '传教士', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/MONK_MISSIONARY/' },   // [2026-10-19 补入] DE「Missionary」dat#775；素材 /SUCAI/MONK_MISSIONARY/
    { id: 'fishing_ship', name: '渔船', category: 'civilian', age: 'feudal', pathPrefix: '/SUCAI/SHP_FISHING_SHIP/' },   // [2026-10-19 补入] DE「Fishing Ship」dat#13；素材 /SUCAI/SHP_FISHING_SHIP/
    { id: 'monk', name: '僧侣', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/MONK_WEST/' },   // [2026-10-19 补入] DE「Monk」dat#125；借用「英雄·塔克修士·不列颠」兵模
    { id: 'priestess', name: '女祭司', category: 'ranged', age: 'antiquity', pathPrefix: '/SUCAI/PRIESTESS/' },   // [2026-10-19 补入] DE「Priestess」dat#125；素材 /SUCAI/PRIESTESS/
    { id: 'trade_cart', name: '贸易车', category: 'civilian', age: 'feudal', pathPrefix: '/SUCAI_TRADE/TRADE_CART_WEST/' },   // [2026-10-19 补入] DE「Trade Cart」dat#204；素材 /SUCAI_TRADE/TRADE_CART_WEST/
    { id: 'trebuchet_packed', name: '巨型投石机（打包）', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/SIE_PACKED_TREBUCHET/' },   // [2026-10-19 补入] DE「Trebuchet (Packed)」dat#331；素材 /SUCAI/SIE_PACKED_TREBUCHET/
    { id: 'villager', name: '村民', category: 'civilian', age: 'feudal', pathPrefix: '/SUCAI/VIL_MALE_VILLAGER/' },   // [2026-10-19 补入] DE「Villager」dat#1810；素材 /SUCAI/VIL_MALE_VILLAGER/
    { id: 'hero_aethelfrith', name: '英雄·艾特尔弗里思·撒克逊', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ELITEWOADRAIDER/' },   // [2026-10-19 补入] DE「Aethelfrith」dat#169；借用「凯尔特靛蓝突袭者精锐」兵模
    { id: 'archbishop', name: '大主教', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_WEST/' },   // [2026-10-19 补入] DE「Archbishop」dat#177；借用「英雄·塔克修士·不列颠」兵模
    { id: 'archer_of_the_eyes', name: '神眼步弓手', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ARBALEST/' },   // [2026-10-19 补入] DE「Archer of the Eyes」dat#686；借用「劲弩手高级」兵模
    { id: 'bad_neighbor', name: '坏邻居', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/SIE_UNPACKED_TREBUCHET/' },   // [2026-10-19 补入] DE「Bad Neighbor」dat#682；素材 /SUCAI/SIE_UNPACKED_TREBUCHET/
    { id: 'hero_belisarius', name: '英雄·贝利沙鲁斯·拜占庭', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/IMPERIALCENTURION/' },   // [2026-10-19 补入] DE「Belisarius」dat#167；借用「罗马帝国百夫长特殊」兵模
    { id: 'hero_charlemagne', name: '英雄·查理曼·法兰克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITETHROWINGAXEMAN/' },   // [2026-10-19 补入] DE「Charlemagne」dat#165；借用「法兰克掷斧兵精锐」兵模
    { id: 'hero_charlesmartel', name: '英雄·查理马特·法兰克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITETHROWINGAXEMAN/' },   // [2026-10-19 补入] DE「Charles Martel」dat#424；借用「法兰克掷斧兵精锐」兵模
    { id: 'hero_constablerichemont', name: '英雄·康斯塔伯理察蒙·法兰克', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「Constable Richemont」dat#646；借用「中世纪枪骑兵高级」兵模
    { id: 'hero_dukedalencon', name: '英雄·阿朗松公爵·法兰克', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「Duke D'Alençon」dat#638；借用「中世纪枪骑兵高级」兵模；DE 官方中文「诺曼底公爵」译错：Alençon＝阿朗松
    { id: 'hero_elcid', name: '英雄·熙德·西班牙', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },   // [2026-10-19 补入] DE「El Cid」dat#198；借用「冠军剑士」兵模
    { id: 'emperor_in_a_barrel', name: '装在桶里的皇帝', category: 'hero', age: 'castle', pathPrefix: '/SUCAI_TRADE/TRADE_CART_WEST/' },   // [2026-10-19 补入] DE「Emperor in a Barrel」dat#733；素材 /SUCAI_TRADE/TRADE_CART_WEST/
    { id: 'hero_erikthered', name: '英雄·红胡子艾里克·维京', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEBERSERK/' },   // [2026-10-19 补入] DE「Erik the Red」dat#171；借用「维京狂战士精锐」兵模
    { id: 'hero_gawain', name: '英雄·高文爵士·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/CAVALIER/' },   // [2026-10-19 补入] DE「Gawain」dat#175；借用「骑士高级」兵模
    { id: 'hero_genghiskhan', name: '英雄·成吉思汗·漠北蒙古', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/MANGUDAI_ELITE/' },   // [2026-10-19 补入] DE「Genghis Khan」dat#731；借用「蒙古突骑精锐」兵模
    { id: 'gods_own_sling', name: '神之弓', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/SIE_UNPACKED_TREBUCHET/' },   // [2026-10-19 补入] DE「God's Own Sling」dat#683；素材 /SUCAI/SIE_UNPACKED_TREBUCHET/
    { id: 'hero_guyjosselyne', name: '英雄·盖佐斯尔立·法兰克', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/PALADIN/' },   // [2026-10-19 补入] DE「Guy Josselyne」dat#648；借用「骑士游侠高级」兵模
    { id: 'hero_hrolftheganger', name: '英雄·首领罗夫·维京', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/BERSERK/' },   // [2026-10-19 补入] DE「Hrolf the Ganger」dat#428；借用「维京狂战士」兵模
    { id: 'hunting_wolf', name: '猎狼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/WOLF/' },   // [2026-10-19 补入] DE「Hunting Wolf」dat#700；素材 /SUCAI_ANIMAL/WOLF/
    { id: 'hero_jeanbureau', name: '英雄·让·彼罗·法兰克', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/BOMBARDCANNON/' },   // [2026-10-19 补入] DE「Jean Bureau」dat#650；借用「手推攻城火炮」兵模
    { id: 'hero_jeandelorrain', name: '英雄·让·德·洛兰·法兰克', category: 'siege', age: 'imperial', pathPrefix: '/SUCAI/BOMBARDCANNON/' },   // [2026-10-19 补入] DE「Jean de Lorrain」dat#644；借用「手推攻城火炮」兵模
    { id: 'hero_kingarthur', name: '英雄·亚瑟王·不列颠', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },   // [2026-10-19 补入] DE「King Arthur」dat#173；借用「冠军剑士」兵模
    { id: 'hero_kitabatake', name: '英雄·北畠氏·日本', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/SAMURAI_DE/' },   // [2026-10-19 补入] DE「Kitabatake」dat#195；借用「日本武士」兵模
    { id: 'hero_lahire', name: '英雄·拉海尔·法兰克', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },   // [2026-10-19 补入] DE「La Hire」dat#640；借用「冠军剑士」兵模
    { id: 'hero_lancelot', name: '英雄·兰斯洛特·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/PALADIN/' },   // [2026-10-19 补入] DE「Lancelot」dat#174；借用「骑士游侠高级」兵模
    { id: 'hero_lorddegraville', name: '英雄·格拉维尔领主·法兰克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ARBALEST/' },   // [2026-10-19 补入] DE「Lord de Graville」dat#642；借用「劲弩手高级」兵模
    { id: 'master_of_the_templar', name: '圣殿骑士团', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「Master of the Templar」dat#680；借用「中世纪枪骑兵高级」兵模
    { id: 'hero_minamoto', name: '英雄·源氏·日本', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/SAMURAI_ELITE/' },   // [2026-10-19 补入] DE「Minamoto」dat#196；借用「日本武士精锐」兵模
    { id: 'hero_mordred', name: '英雄·莫特列德·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/PALADIN/' },   // [2026-10-19 补入] DE「Mordred」dat#176；借用「骑士游侠高级」兵模
    { id: 'ornlu_the_wolf', name: '灰狼欧鲁', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/WOLF/' },   // [2026-10-19 补入] DE「Ornlu the Wolf」dat#707；素材 /SUCAI_ANIMAL/WOLF/
    { id: 'hero_reynalddechatillon', name: '英雄·沙蒂永的雷纳德·法兰克', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「Reynald de Chatillon」dat#678；借用「中世纪枪骑兵高级」兵模
    { id: 'hero_richardthelionheart', name: '英雄·狮心王理查·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/PALADIN/' },   // [2026-10-19 补入] DE「Richard the Lionheart」dat#160；借用「骑士游侠高级」兵模
    { id: 'hero_robinhood', name: '英雄·罗宾汉·不列颠', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/LONGBOWMAN_ELITE/' },   // [2026-10-19 补入] DE「Robin Hood」dat#200；借用「不列颠长弓兵精锐」兵模
    { id: 'hero_roland', name: '英雄·罗兰·法兰克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/KNIGHT/' },   // [2026-10-19 补入] DE「Roland」dat#166；借用「骑士」兵模
    { id: 'saboteur', name: '破坏者', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/PETARD/' },   // [2026-10-19 补入] DE「Saboteur」dat#706；借用「爆破工兵」兵模
    { id: 'hero_sheriffofnottingham', name: '英雄·诺丁安的郡长·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/LONGSWORDSMAN/' },   // [2026-10-19 补入] DE「Sheriff of Nottingham」dat#164；借用「重装剑士」兵模
    { id: 'hero_siegfried', name: '英雄·齐格菲·条顿', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },   // [2026-10-19 补入] DE「Siegfried」dat#170；借用「冠军剑士」兵模
    { id: 'hero_sieurbertrand', name: '英雄·伯特兰爵士·法兰克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/KNIGHT/' },   // [2026-10-19 补入] DE「Sieur Bertrand」dat#636；借用「骑士」兵模
    { id: 'hero_sieurdemetz', name: '英雄·德·梅斯爵士·法兰克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/KNIGHT/' },   // [2026-10-19 补入] DE「Sieur de Metz」dat#634；借用「骑士」兵模
    { id: 'hero_sirjohnfastolf', name: '英雄·约翰法斯托夫爵士·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「Sir John Fastolf」dat#652；借用「中世纪枪骑兵高级」兵模
    { id: 'hero_tamerlane', name: '英雄·帖木儿·鞑靼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/MANGUDAI_ELITE/' },   // [2026-10-19 补入] DE「Tamerlane」dat#172；借用「蒙古突骑精锐」兵模
    { id: 'hero_theblackprince', name: '英雄·黑亲王·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/CAVALIER/' },   // [2026-10-19 补入] DE「The Black Prince」dat#161；借用「骑士高级」兵模
    { id: 'hero_theodoricthegoth', name: '英雄·狄奥多里克·哥特', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEHUSKARL/' },   // [2026-10-19 补入] DE「Theodoric the Goth」dat#168；借用「哥特近卫军精锐」兵模
    { id: 'hero_admiralyisunshin', name: '英雄·李舜臣将军·高丽', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ELITE_TURTLE_SHIP/' },   // [2026-10-19 补入] DE「Admiral Yi Sun-Shin」dat#844；借用「龟船高级」兵模
    { id: 'hero_alexandernevski', name: '英雄·亚历山大·涅夫斯基·斯拉夫', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/CAVALIER/' },   // [2026-10-19 补入] DE「Alexander Nevski」dat#197；借用「骑士高级」兵模；DE 官方中文「亚历山大 莱斯基」译错
    { id: 'hero_bledathehun', name: '英雄·布莱达·匈人', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/STEPPE_LANCER/' },   // [2026-10-19 补入] DE「Bleda the Hun」dat#779；借用「草原枪骑兵」兵模；DE 官方中文「匈奴王布莱达」把匈人写成匈奴（项目定：匈奴不是匈人）
    { id: 'hero_elcidcampeador', name: '英雄·熙德·坎培多尔·西班牙', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「El Cid Campeador」dat#824；借用「中世纪枪骑兵高级」兵模
    { id: 'hero_henryv', name: '英雄·亨利五世·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/PALADIN/' },   // [2026-10-19 补入] DE「Henry V」dat#847；借用「骑士游侠高级」兵模
    { id: 'hero_kingalfonso', name: '英雄·阿方索国王·西班牙', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KING_WEST/' },   // [2026-10-19 补入] DE「King Alfonso」dat#840；借用「英雄·贝拉四世国王·马扎尔」兵模
    { id: 'hero_kingsancho', name: '英雄·桑丘国王·西班牙', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KING_WEST/' },   // [2026-10-19 补入] DE「King Sancho」dat#838；借用「英雄·贝拉四世国王·马扎尔」兵模
    { id: 'hero_nobunaga', name: '英雄·织田信长·日本', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/SAMURAI_ELITE/' },   // [2026-10-19 补入] DE「Nobunaga」dat#845；借用「日本武士精锐」兵模
    { id: 'hero_popeleoi', name: '英雄·教皇利奥一世·罗马', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_WEST/' },   // [2026-10-19 补入] DE「Pope Leo I」dat#781；借用「英雄·塔克修士·不列颠」兵模；DE 官方中文「罗马教皇里奥一世」，改用通行译名
    { id: 'scythian_scout', name: '斯基泰斥候', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/LIGHTCAVALRY/' },   // [2026-10-19 补入] DE「Scythian Scout」dat#852；借用「轻骑兵」兵模
    { id: 'scythian_wild_woman', name: '斯基泰野女人', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/JOANTHEMAID/' },   // [2026-10-19 补入] DE「Scythian Wild Woman」dat#783；借用「英雄·少女战士·法兰克」兵模
    { id: 'hero_williamtheconqueror', name: '英雄·征服者威廉·法兰克', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「William the Conqueror」dat#849；借用「中世纪枪骑兵高级」兵模
    { id: 'hero_cuauhtemoc', name: '英雄·瓜特穆斯·阿兹特克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEEAGLEWARRIOR/' },   // [2026-10-19 补入] DE「Cuauhtemoc」dat#307；借用「鹰战士」兵模
    { id: 'hero_franciscodeorellana', name: '英雄·弗朗西斯科·德·奥雷利亚纳·西班牙', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CONQUISTADOR/' },   // [2026-10-19 补入] DE「Francisco de Orellana」dat#425；借用「西班牙征服者」兵模
    { id: 'hero_frederickbarbarossa', name: '英雄·腓特烈·巴巴罗萨·条顿', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/TEUTONICKNIGHT/' },   // [2026-10-19 补入] DE「Frederick Barbarossa」dat#429；借用「条顿武士」兵模
    { id: 'hero_gonzalopizarro', name: '英雄·贡萨洛·皮萨罗·西班牙', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ELITECONQUISTADOR/' },   // [2026-10-19 补入] DE「Gonzalo Pizarro」dat#427；借用「西班牙征服者精锐」兵模
    { id: 'norse_chieftain', name: '北欧酋长', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/JARL/' },   // [2026-10-19 补入] DE「Norse Chieftain」dat#931；借用「瓦良格首领」兵模
    { id: 'hero_khosrau', name: '英雄·霍斯劳·波斯', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEELEPHANTARCHER/' },   // [2026-10-19 补入] DE「Khosrau」dat#930；借用「象弓骑兵高级」兵模
    { id: 'hero_prithvi', name: '英雄·布里陀毗·瞿折罗', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/CROSSBOWMAN/' },   // [2026-10-19 补入] DE「Prithvi」dat#926；借用「劲弩手」兵模
    { id: 'queen', name: '皇后', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/QUEEN_WEST/' },   // [2026-10-19 补入] DE「Queen」dat#923；素材 /SUCAI/QUEEN_WEST/
    { id: 'hero_saladin', name: '英雄·萨拉丁·萨拉森', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ELITEMAMELUKE/' },   // [2026-10-19 补入] DE「Saladin」dat#929；借用「萨拉森马穆鲁克精锐」兵模
    { id: 'hero_sanyogita', name: '英雄·姗悦姬妲·瞿折罗', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/QUEEN_WEST/' },   // [2026-10-19 补入] DE「Sanyogita」dat#925；素材 /SUCAI/QUEEN_WEST/
    { id: 'hero_abrahaelephant', name: '英雄·阿布拉哈战象·埃塞俄比亚', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEWARELEPHANT/' },   // [2026-10-19 补入] DE「Abraha Elephant」dat#1071；借用「波斯战象精锐」兵模
    { id: 'hero_babur', name: '英雄·巴布尔·印度斯坦', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/IMPERIALCAMELRIDER/' },   // [2026-10-19 补入] DE「Babur」dat#1070；借用「印度斯坦帝王骆驼兵高级」兵模
    { id: 'hero_guglielmoembriaco', name: '英雄·古列尔莫·安布里科·意大利', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEGENOESECROSSBOWMAN/' },   // [2026-10-19 补入] DE「Guglielmo Embriaco」dat#1072；借用「意大利热那亚弩手精锐」兵模
    { id: 'hero_henryii', name: '英雄·亨利二世·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/TWOHANDEDSWORDSMAN/' },   // [2026-10-19 补入] DE「Henry II」dat#1040；借用「双手剑士」兵模
    { id: 'hero_huaynacapac', name: '英雄·瓦伊纳·卡帕克·印加', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/SLINGER/' },   // [2026-10-19 补入] DE「Huayna Capac」dat#1075；借用「投石兵」兵模
    { id: 'hero_itzcoatl', name: '英雄·伊兹科阿图·阿兹特克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEJAGUARWARRIOR/' },   // [2026-10-19 补入] DE「Itzcoatl」dat#1067；借用「阿兹特克豹勇士精锐」兵模
    { id: 'hero_littlejohn', name: '英雄·小约翰·不列颠', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SPEARMAN/' },   // [2026-10-19 补入] DE「Little John」dat#1077；借用「长矛兵」兵模
    { id: 'hero_miklostoldi', name: '英雄·米克罗斯·陶笛·马扎尔', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ELITEMAGYARHUSZAR/' },   // [2026-10-19 补入] DE「Miklos Toldi」dat#1076；借用「马扎尔骠骑兵精锐」兵模
    { id: 'hero_musaibnnusayr', name: '英雄·穆萨·伊本·奴萨尔·萨拉森', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITECAMELARCHER/' },   // [2026-10-19 补入] DE「Musa ibn Nusayr」dat#1034；借用「柏柏尔骆驼弓骑精锐」兵模
    { id: 'hero_mustafapasha', name: '英雄·穆斯塔法帕夏·奥斯曼', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/ELITEJANISSARY/' },   // [2026-10-19 补入] DE「Mustafa Pasha」dat#1068；借用「土耳其苏丹亲兵精锐」兵模
    { id: 'hero_pacalii', name: '英雄·帕柯二世·玛雅', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ELITEPLUMEDARCHER/' },   // [2026-10-19 补入] DE「Pacal II」dat#1069；借用「玛雅羽箭手精锐」兵模
    { id: 'hero_princessyodit', name: '英雄·游娣特公主·埃塞俄比亚', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/QUEEN_WEST/' },   // [2026-10-19 补入] DE「Princess Yodit」dat#1039；素材 /SUCAI/QUEEN_WEST/
    { id: 'hero_richarddeclare', name: '英雄·理查·德·克莱尔伯爵·不列颠', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/LIGHTCAVALRY/' },   // [2026-10-19 补入] DE「Richard de Clare」dat#1037；借用「轻骑兵」兵模
    { id: 'hero_sudingfang', name: '英雄·苏定方·中原', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_CHUKONU/' },   // [2026-10-19 补入] DE「Su Dingfang」dat#1073；借用「中国诸葛弩精锐」兵模
    { id: 'hero_tristan', name: '英雄·崔士坦爵士·不列颠', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MAGYARHUSZAR/' },   // [2026-10-19 补入] DE「Tristan」dat#1038；借用「马扎尔骠骑兵」兵模
    { id: 'hero_yekunoamlak', name: '英雄·耶库诺·阿姆拉克·埃塞俄比亚', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITESHOTELWARRIOR/' },   // [2026-10-19 补入] DE「Yekuno Amlak」dat#1064；借用「埃塞俄比亚弯刀勇士精锐」兵模
    { id: 'hero_zawiszatheblack', name: '英雄·黑衣扎维沙·波兰', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/HUSSAR/' },   // [2026-10-19 补入] DE「Zawisza the Black」dat#1078；借用「骠骑兵」兵模
    { id: 'hero_buibi', name: '英雄·裴备·越南', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_ASIA/' },   // [2026-10-19 补入] DE「Bui Bi」dat#1183；借用「英雄·昌德·菩达一·瞿折罗」兵模
    { id: 'hero_jayaviravarman', name: '英雄·阇耶毗罗跋摩·高棉', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KARAMBIT_WARRIOR_ELITE/' },   // [2026-10-19 补入] DE「Jayaviravarman」dat#1164；借用「马来爪刀勇士精锐」兵模
    { id: 'hero_lelai', name: '英雄·黎来·越南', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },   // [2026-10-19 补入] DE「Le Lai」dat#1179；借用「冠军剑士」兵模
    { id: 'hero_letrien', name: '英雄·李篆·越南', category: 'hero', age: 'imperial', pathPrefix: '/SUCAI/CHAMPION/' },   // [2026-10-19 补入] DE「Le Trien」dat#1181；借用「冠军剑士」兵模
    { id: 'hero_luunhanchu', name: '英雄·刘仁澍·越南', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ARBALEST/' },   // [2026-10-19 补入] DE「Luu Nhan Chu」dat#1182；借用「劲弩手高级」兵模
    { id: 'hero_radenwijaya', name: '英雄·拉登甲亮·马来', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/CAVALIER/' },   // [2026-10-19 补入] DE「Raden Wijaya」dat#1159；借用「骑士高级」兵模
    { id: 'hero_suryavarmani', name: '英雄·苏耶跋摩一世·高棉', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEBATTLEELEPHANT/' },   // [2026-10-19 补入] DE「Suryavarman I」dat#1162；借用「战斗象高级」兵模
    { id: 'hero_tabinshwehti', name: '英雄·莽瑞体·缅甸', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEELEPHANTARCHER/' },   // [2026-10-19 补入] DE「Tabinshwehti」dat#1166；借用「象弓骑兵高级」兵模
    { id: 'hero_udayadityavarmani', name: '英雄·乌达雅迭耶跋摩一世·高棉', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/KING_SEAS/' },   // [2026-10-19 补入] DE「Udayadityavarman I」dat#1163；借用「英雄·贾亚纳加拉·马来」兵模
    { id: 'hero_wangtong', name: '英雄·王通·中原', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/DINHLE/' },   // [2026-10-19 补入] DE「Wang Tong」dat#1185；借用「英雄·丁礼·越南」兵模
    { id: 'hero_henrythelion', name: '英雄·猛狮亨利·撒克逊', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/KNIGHT/' },   // [2026-10-19 补入] DE「Henry the Lion」dat#418；借用「骑士」兵模
    { id: 'hero_leiferikson', name: '英雄·莱夫·埃里克松·维京', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITE_LONGBOAT/' },   // [2026-10-19 补入] DE「Leif Erikson」dat#106；借用「维京长船高级」兵模
    { id: 'the_middlebrook', name: '米德尔布鲁克', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITE_LONGBOAT/' },   // [2026-10-19 补入] DE「The Middlebrook」dat#1631；借用「维京长船高级」兵模
    { id: 'hero_tokhtamyshkhan', name: '英雄·脱脱迷失汗·鞑靼', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ELITEKESHIK/' },   // [2026-10-19 补入] DE「Tokhtamysh Khan」dat#1262；借用「鞑靼怯薛军精锐」兵模
    { id: 'hero_topayupanqui', name: '英雄·托巴·尤潘基·印加', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ELITEJAGUARWARRIOR/' },   // [2026-10-19 补入] DE「Topa Yupanqui」dat#703；借用「阿兹特克豹勇士精锐」兵模
    { id: 'hero_uruskhan', name: '英雄·兀鲁思汗·鞑靼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITE_KIPCHAK/' },   // [2026-10-19 补入] DE「Urus Khan」dat#1276；借用「库曼钦察弓骑精锐」兵模
    { id: 'hero_vascodagama', name: '英雄·瓦斯科·达·伽马·葡萄牙', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ELITE_CARAVEL/' },   // [2026-10-19 补入] DE「Vasco da Gama」dat#203；借用「卡拉维尔帆船高级」兵模
    { id: 'hero_jacquelineofhainaut', name: '英雄·埃诺的杰奎琳·勃艮第', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/QUEEN_WEST/' },   // [2026-10-19 补入] DE「Jacqueline of Hainaut」dat#1692；素材 /SUCAI/QUEEN_WEST/
    { id: 'warwolf_trebuchet', name: '战狼号巨型投石机', category: 'siege', age: 'castle', pathPrefix: '/SUCAI/SIE_UNPACKED_TREBUCHET/' },   // [2026-10-19 补入] DE「Warwolf Trebuchet」dat#1690；素材 /SUCAI/SIE_UNPACKED_TREBUCHET/
    { id: 'hero_dmitryofmoscow', name: '英雄·莫斯科的德米特里·斯拉夫', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/CAVALIER/' },   // [2026-10-19 补入] DE「Dmitry of Moscow」dat#1730；借用「骑士高级」兵模
    { id: 'hero_emperorsigismund', name: '英雄·西吉斯蒙德皇帝·条顿', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/FRANKISHPALADIN/' },   // [2026-10-19 补入] DE「Emperor Sigismund」dat#1729；借用「中世纪枪骑兵高级」兵模
    { id: 'hero_mikhailoftver', name: '英雄·特维尔亲王米哈伊尔·斯拉夫', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ELITEBOYAR/' },   // [2026-10-19 补入] DE「Mikhail of Tver」dat#1731；借用「斯拉夫贵族铁骑精锐」兵模
    { id: 'hero_youngjadwiga', name: '英雄·年轻的雅德维加·波兰', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/JOANTHEMAID/' },   // [2026-10-19 补入] DE「Young Jadwiga」dat#1732；借用「英雄·少女战士·法兰克」兵模
    { id: 'hero_amoghavarsha', name: '英雄·阿目佉跋沙·达罗毗荼', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ELITEURUMISWORDSMAN/' },   // [2026-10-19 补入] DE「Amoghavarsha」dat#1763；借用「达罗毗荼软剑士精锐」兵模
    { id: 'hero_ibrahimlodi', name: '英雄·易卜拉欣·洛迪·印度斯坦', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/HERO_KHAN/' },   // [2026-10-19 补入] DE「Ibrahim Lodi」dat#1771；借用「蒙古可汗特殊」兵模
    { id: 'hero_mihirabhoja', name: '英雄·迷企罗·波阇·瞿折罗', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITESHRIVAMSHARIDER/' },   // [2026-10-19 补入] DE「Mihira Bhoja」dat#1762；借用「什里瓦姆沙骑手高级」兵模
    { id: 'hero_shaybanikhan', name: '英雄·昔班尼汗·鞑靼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/GIRGENKHAN/' },   // [2026-10-19 补入] DE「Shaybani Khan」dat#1772；借用「英雄·吉尔根汗·库曼」兵模
    { id: 'hero_youngbabur', name: '英雄·年轻的巴布尔·印度斯坦', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/CAMEL_HEAVY/' },   // [2026-10-19 补入] DE「Young Babur」dat#1768；借用「骆驼骑兵高级」兵模
    { id: 'hero_ismail', name: '英雄·亦思马因·波斯', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SCOUTCAVALRY/' },   // [2026-10-19 补入] DE「Ismail」dat#1819；借用「斥候骑兵」兵模
    { id: 'hero_ivane', name: '英雄·伊万·格鲁吉亚', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/CATAPHRACT/' },   // [2026-10-19 补入] DE「Ivane」dat#1825；借用「拜占庭圣骑兵」兵模
    { id: 'hero_mleh', name: '英雄·姆莱·亚美尼亚', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/TWOHANDEDSWORDSMAN/' },   // [2026-10-19 补入] DE「Mleh」dat#1828；借用「双手剑士」兵模
    { id: 'hero_selimthegrim', name: '英雄·冷酷者塞利姆·奥斯曼', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/SAVAR/' },   // [2026-10-19 补入] DE「Selim the Grim」dat#1820；借用「萨珊波斯萨瓦兰骑兵高级」兵模
    { id: 'hero_stephan', name: '英雄·斯蒂芬·亚美尼亚', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/WARRIORPRIEST/' },   // [2026-10-19 补入] DE「Stephan」dat#1827；借用「亚美尼亚修士战士高级」兵模
    { id: 'hero_yury', name: '英雄·尤里·斯拉夫', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/IVAYLO/' },   // [2026-10-19 补入] DE「Yury」dat#1824；借用「英雄·骑马伊瓦伊洛·保加利亚」兵模
    { id: 'hero_zakare', name: '英雄·扎卡雷·格鲁吉亚', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/WARRIORPRIEST/' },   // [2026-10-19 补入] DE「Zakare」dat#1826；借用「亚美尼亚修士战士高级」兵模
    { id: 'hero_dongzhuo', name: '英雄·董卓·河西', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/HEI_KUANG_HEAVY/' },   // [2026-10-19 补入] DE「Dong Zhuo」dat#2045；借用「南北朝黑光铠骑兵高级」兵模
    { id: 'emperor_in_a_litter', name: '乘舆中的皇帝', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/EMPERORLITTER/' },   // [2026-10-19 补入] DE「Emperor in a Litter」dat#1988；素材 /SUCAI/EMPERORLITTER/；DE 官方中文「草垫中的皇帝」译错：litter＝乘舆、肩舆
    { id: 'hero_liubiao', name: '英雄·刘表·江南', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/WARCHARIOT/' },   // [2026-10-19 补入] DE「Liu Biao」dat#2049；借用「先秦远程战车」兵模
    { id: 'hero_whitetigeryan', name: '英雄·严白虎·江南', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITETIGERCAVALRY/' },   // [2026-10-19 补入] DE「White Tiger Yan」dat#2048；借用「魏虎骑兵精锐」兵模
    { id: 'hero_yuji', name: '英雄·于吉·江南', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_ASIA/' },   // [2026-10-19 补入] DE「Yu Ji」dat#2047；借用「英雄·昌德·菩达一·瞿折罗」兵模
    { id: 'hero_yuanshao', name: '英雄·袁绍·河朔', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/XIANBEI_RAIDER/' },   // [2026-10-19 补入] DE「Yuan Shao」dat#2046；借用「鲜卑掠骑兵」兵模
    { id: 'hero_zhangjue', name: '英雄·张角·中原', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/MONK_ASIA/' },   // [2026-10-19 补入] DE「Zhang Jue」dat#2050；借用「英雄·昌德·菩达一·瞿折罗」兵模
    { id: 'hero_zhaoyun', name: '英雄·赵云·巴蜀', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/ELITE_STEPPE_LANCER/' },   // [2026-10-19 补入] DE「Zhao Yun」dat#2051；借用「草原枪骑兵高级」兵模
    { id: 'hero_zhouyu', name: '英雄·周瑜·江南', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_FIRE_ARCHER/' },   // [2026-10-19 补入] DE「Zhou Yu」dat#2044；借用「吴火焰弓箭手精锐」兵模
    { id: 'hero_einarpaunchshaker', name: '英雄·神射手埃纳尔·维京', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITE_COMPOSITE_BOWMAN/' },   // [2026-10-19 补入] DE「Einar Paunch-Shaker」dat#2727；借用「亚美尼亚复合弓手精锐」兵模
    { id: 'hero_finnarnason', name: '英雄·芬恩·阿纳森·维京', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/HALBERDIER/' },   // [2026-10-19 补入] DE「Finn Arnason」dat#2725；借用「长戟兵」兵模
    { id: 'hero_kalfarnason', name: '英雄·卡尔夫·阿纳森·维京', category: 'hero', age: 'castle', pathPrefix: '/SUCAI/LONGSWORDSMAN/' },   // [2026-10-19 补入] DE「Kalf Arnason」dat#2726；借用「重装剑士」兵模
    { id: 'hero_cleon', name: '英雄·克里昂·雅典', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/STRATEGOS/' },   // [2026-10-19 补入] DE「Cleon」dat#2346；借用「雅典将军卫队」兵模
    { id: 'hero_darius', name: '英雄·大流士·阿契美尼德', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/ELITE_WAR_CHARIOT/' },   // [2026-10-19 补入] DE「Darius」dat#2347；借用「双轮战车高级」兵模
    { id: 'hero_leonidas', name: '英雄·列奥尼达·斯巴达', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/HIPPEUS/' },   // [2026-10-19 补入] DE「Leonidas」dat#2316；借用「斯巴达三百」兵模
    { id: 'hero_miltiades', name: '英雄·米太亚德·雅典', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/POLEMARCH/' },   // [2026-10-19 补入] DE「Miltiades」dat#2314；借用「军事执政官」兵模
    { id: 'hero_flagshipofnearchos', name: '英雄·尼阿库斯旗舰·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/SHP_FLAGSHIP/' },   // [2026-10-19 补入] DE「Flagship of Nearchos」dat#2442；素材 /SUCAI/SHP_FLAGSHIP/
    { id: 'hero_hephaistion', name: '英雄·赫菲斯提昂·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/MACEDONIAN_COMMANDER/' },   // [2026-10-19 补入] DE「Hephaistion」dat#2402；借用「英雄·腓力二世·马其顿」兵模
    { id: 'hero_nearchos', name: '英雄·尼阿库斯·马其顿', category: 'hero', age: 'antiquity', pathPrefix: '/SUCAI/MACEDONIAN_COMMANDER/' },   // [2026-10-19 补入] DE「Nearchos」dat#2404；借用「英雄·腓力二世·马其顿」兵模
    // ── 2026-10-19 主人令「全部解析……不能缺少任何单位」：补入 DE 有、兵种鉴赏原先没有的单位（tools/de-add-missing-units.mjs 生成）──
    { id: 'hero_haraldhardrada', name: '英雄·哈拉尔·哈德拉达·维京', category: 'hero', age: 'feudal', pathPrefix: '/SUCAI/ELITEBERSERK/' },   // [2026-10-19 补入] DE「Harald Hardrada」dat#426；借用「英雄·红胡子艾里克·维京」兵模
    // ── 2026-10-19 主人令「全部解析……不能缺少任何单位」：补入 DE 有、兵种鉴赏原先没有的单位（tools/de-add-missing-units.mjs 生成）──
    { id: 'alfred_the_alpaca', name: '羊驼阿弗瑞德', category: 'other', age: 'imperial', pathPrefix: '/SUCAI/ALFRED/' },   // [2026-10-19 补入] DE「Alfred the Alpaca」dat#934；素材 /SUCAI/ALFRED/
    { id: 'alpaca', name: '羊驼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/ALPACA/' },   // [2026-10-19 补入] DE「Alpaca」dat#2614；素材 /SUCAI_ANIMAL/ALPACA/
    { id: 'bactrian_camel', name: '双峰骆驼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/DROMEDARY/' },   // [2026-10-19 补入] DE「Bactrian Camel」dat#1237；素材 /SUCAI_ANIMAL/DROMEDARY/
    { id: 'camel', name: '骆驼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/CAMEL/' },   // [2026-10-19 补入] DE「Camel」dat#897；素材 /SUCAI_ANIMAL/CAMEL/
    { id: 'cart', name: '推车', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI_TRADE/TRADE_CART_WEST/' },   // [2026-10-19 补入] DE「Cart」dat#1338；借用「装在桶里的皇帝」兵模
    { id: 'cobra_car', name: '眼镜蛇跑车', category: 'other', age: 'imperial', pathPrefix: '/SUCAI/SIE_COBRA_CAR/' },   // [2026-10-19 补入] DE「Cobra Car」dat#748；素材 /SUCAI/SIE_COBRA_CAR/
    { id: 'dire_wolf', name: '恶狼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/WOLF/' },   // [2026-10-19 补入] DE「Dire Wolf」dat#89；借用「猎狼」兵模
    { id: 'donkey', name: '毛驴', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/DONKEY/' },   // [2026-10-19 补入] DE「Donkey」dat#846；素材 /SUCAI_ANIMAL/DONKEY/
    { id: 'dummy_target', name: '假人目标', category: 'other', age: 'imperial', pathPrefix: '/SUCAI/TRAINING_DUMMY/' },   // [2026-10-19 补入] DE「Dummy Target」dat#1956；素材 /SUCAI/TRAINING_DUMMY/
    { id: 'furious_the_monkey_boy', name: '狂暴猴孩', category: 'other', age: 'imperial', pathPrefix: '/SUCAI_ANIMAL/MONKEY/' },   // [2026-10-19 补入] DE「Furious the Monkey Boy」dat#860；素材 /SUCAI_ANIMAL/MONKEY/
    { id: 'horse', name: '马', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/HORSE/' },   // [2026-10-19 补入] DE「Horse」dat#814；素材 /SUCAI_ANIMAL/HORSE/
    { id: 'iron_boar', name: '铁甲野猪', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/BOAR/' },   // [2026-10-19 补入] DE「Iron Boar」dat#810；素材 /SUCAI_ANIMAL/BOAR/
    { id: 'king', name: '国王', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/KING_WEST/' },   // [2026-10-19 补入] DE「King」dat#434；借用「英雄·贝拉四世国王·马扎尔」兵模
    { id: 'merchant', name: '商人', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI_TRADE/MERCHANT_WEST/' },   // [2026-10-19 补入] DE「Merchant」dat#1572；素材 /SUCAI_TRADE/MERCHANT_WEST/
    { id: 'monkey', name: '猴子', category: 'other', age: 'imperial', pathPrefix: '/SUCAI_ANIMAL/MONKEY/' },   // [2026-10-19 补入] DE「Monkey」dat#2096；素材 /SUCAI_ANIMAL/MONKEY/
    { id: 'nessie', name: '尼西', category: 'other', age: 'feudal', pathPrefix: '/SUCAI/NESSIE/' },   // [2026-10-19 补入] DE「Nessie」dat#1973；素材 /SUCAI/NESSIE/
    { id: 'ox_cart', name: '牛推车', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/MISC_CART_OX/' },   // [2026-10-19 补入] DE「Ox Cart」dat#1271；素材 /SUCAI/MISC_CART_OX/
    { id: 'ox_wagon', name: '牛战车', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/MISC_WAGON_OX/' },   // [2026-10-19 补入] DE「Ox Wagon」dat#1273；素材 /SUCAI/MISC_WAGON_OX/
    { id: 'pagan_priest', name: '异教祭司', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/MONK_PAGAN_PRIEST/' },   // [2026-10-19 补入] DE「Pagan Priest」dat#1940；素材 /SUCAI/MONK_PAGAN_PRIEST/
    { id: 'penguin', name: '企鹅', category: 'other', age: 'imperial', pathPrefix: '/SUCAI_ANIMAL/PENGUIN/' },   // [2026-10-19 补入] DE「Penguin」dat#2097；素材 /SUCAI_ANIMAL/PENGUIN/
    { id: 'photonman', name: '装备激光武器的人', category: 'other', age: 'imperial', pathPrefix: '/SUCAI/ARC_PHOTONMAN/' },   // [2026-10-19 补入] DE「Photonman」dat#1577；素材 /SUCAI/ARC_PHOTONMAN/
    { id: 'priest', name: '祭司', category: 'ranged', age: 'castle', pathPrefix: '/SUCAI/MONK_PRIEST/' },   // [2026-10-19 补入] DE「Priest」dat#1023；素材 /SUCAI/MONK_PRIEST/
    { id: 'rabid_wolf', name: '狂暴之狼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/WOLF/' },   // [2026-10-19 补入] DE「Rabid Wolf」dat#202；借用「猎狼」兵模
    { id: 'relic_cart', name: '圣物推车', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/MISC_RELIC/' },   // [2026-10-19 补入] DE「Relic Cart」dat#159；素材 /SUCAI/MISC_RELIC/
    { id: 'repairer', name: '修理工', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/VIL_MALE_BUILDER/' },   // [2026-10-19 补入] DE「Repairer」dat#156；素材 /SUCAI/VIL_MALE_BUILDER/
    { id: 'sharkatzor', name: '骑鲨圣猫', category: 'other', age: 'imperial', pathPrefix: '/SUCAI/CHEAT_SHARKATZOR/' },   // [2026-10-19 补入] DE「Sharkatzor」dat#1222；素材 /SUCAI/CHEAT_SHARKATZOR/
    { id: 'stormy_dog', name: '风暴犬', category: 'other', age: 'imperial', pathPrefix: '/SUCAI/CHEAT_STORMYDOG/' },   // [2026-10-19 补入] DE「Stormy Dog」dat#862；素材 /SUCAI/CHEAT_STORMYDOG/
    { id: 'treasure_chest', name: '宝藏箱', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/TREASURE_CHEST/' },   // [2026-10-19 补入] DE「Treasure Chest」dat#2289；素材 /SUCAI/TREASURE_CHEST/
    { id: 'war_penguin', name: '战争企鹅', category: 'other', age: 'imperial', pathPrefix: '/SUCAI_ANIMAL/PENGUIN/' },   // [2026-10-19 补入] DE「War Penguin」dat#639；素材 /SUCAI_ANIMAL/PENGUIN/
    { id: 'wheeled_ship', name: '轮式船', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/MISC_WHEELED_SHIP/' },   // [2026-10-19 补入] DE「Wheeled Ship」dat#2730；素材 /SUCAI/MISC_WHEELED_SHIP/
    { id: 'wild_alpaca', name: '野羊驼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/ALPACA/' },   // [2026-10-19 补入] DE「Wild Alpaca」dat#2615；素材 /SUCAI_ANIMAL/ALPACA/
    { id: 'wild_bactrian_camel', name: '野双峰骆驼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/DROMEDARY/' },   // [2026-10-19 补入] DE「Wild Bactrian Camel」dat#1247；素材 /SUCAI_ANIMAL/DROMEDARY/
    { id: 'wild_camel', name: '野骆驼', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/CAMEL/' },   // [2026-10-19 补入] DE「Wild Camel」dat#884；素材 /SUCAI_ANIMAL/CAMEL/
    { id: 'wild_horse', name: '野马', category: 'other', age: 'feudal', pathPrefix: '/SUCAI_ANIMAL/HORSE/' },   // [2026-10-19 补入] DE「Wild Horse」dat#835；素材 /SUCAI_ANIMAL/HORSE/
    { id: 'goat', name: '山羊', category: 'other', age: 'imperial', pathPrefix: '/SUCAI_ANIMAL/GOAT/' },   // [2026-10-19 补入] DE「Goat」dat#1060；素材 /SUCAI_ANIMAL/GOAT/
    { id: 'spy', name: '间谍', category: 'civilian', age: 'castle', pathPrefix: '/SUCAI/MANATARMS/' },   // [2026-10-19 补入] DE「Spy」dat#138；借用「武装剑士」兵模
]

export const DE_UNITS_MAP = new Map<string, DeUnitDef>(DE_UNITS_CATALOG.map(u => [u.id, u]));

// 兼容外部系统（如战斗场景、势力方阵配置）对去重前旧 ID 的引用

/**
 * 兵种二级分类映射（id → SubCategory），鉴赏网站「子类」字段的唯一真源。
 * 判据 = 中文名（描述性）+ DE unit class 交叉核对，逐条手填，不用关键词启发式一把梭。
 */
export const UNIT_SUBCATEGORY: Record<string, SubCategory> = {
    heavy_swordsman: 'sword_shield',
    manatarms: 'sword_shield',
    
    
    sunda_royal_fighter: 'foot_hero',
    lancer: 'melee_cav',
    scout_cavalry: 'melee_cav',
    light_cavalry: 'melee_cav',
    frankish_paladin: 'mounted_hero',
    siege_ballista: 'mechanical',
    monoreme: 'galley',
    bireme: 'galley',
    trireme: 'galley',
    lembos: 'galley',
    war_lembos: 'galley',
    elite_lembos: 'galley',
    heavy_lembos: 'galley',
    dromon: 'cannon_ship',
    hulk: 'warship',
    war_hulk: 'warship',
    galleon: 'galley',
    carrack: 'warship',
    catapult_galleon: 'cannon_ship',
    demo_raft: 'demo_ship',
    incendiary_raft: 'fire_ship',
    canoe: 'warship',
    merchant_ship: 'warship',
    junk: 'warship',
    trade_cog: 'warship',
    transport_ship: 'warship',
    lou_chuan: 'warship',
    leviathan: 'warship',


    // ── 步兵 ──
    // 刀盾（单手近战 + 盾：刀/剑/斧/棒/锤等单手兵器，含盾斧兵、盾棒兵）
    swordsman: 'sword_shield', champion: 'two_handed',
    jian_swordsman: 'sword_shield',
    eastern_swordsman: 'sword_shield', legionary: 'sword_shield',
    bandit: 'sword_shield', imperial_legionary: 'sword_shield',
    elite_konnik_foot: 'sword_shield', elite_serjeant: 'sword_shield',
    elite_teutonic_knight: 'sword_shield', elite_woad_raider: 'sword_shield',
    konnik_foot: 'sword_shield',
    levy: 'sword_shield', longswordsman: 'sword_shield', militia: 'sword_shield', paragon: 'sword_shield',
    serjeant: 'sword_shield', teutonic_knight: 'sword_shield',
    woad_raider: 'sword_shield', condottiero: 'sword_shield', maceman: 'sword_shield',
    sakan_axeman: 'sword_shield', champi_warrior: 'sword_shield',
    elite_champi_warrior: 'sword_shield', champi_runner: 'sword_shield', champi_scout: 'sword_shield',
    norse_warrior: 'sword_shield', strategos: 'sword_shield', elite_strategos: 'sword_shield',
    huskarl: 'sword_shield', elite_huskarl: 'sword_shield',
    hearth_troop: 'sword_shield', elite_hearth_troop: 'sword_shield', jomsviking: 'spear', elite_jomsviking: 'spear',
    varangian_guard: 'two_handed', elite_varangian_guard: 'two_handed',
    berserk: 'sword_shield', elite_berserk: 'sword_shield',
    jaguar_warrior: 'sword_shield', elite_jaguar_warrior: 'sword_shield',
    urumi_swordsman: 'sword_shield', elite_urumi_swordsman: 'sword_shield',
    sickle_warrior: 'sword_shield', ekdromos: 'sword_shield',
    // 长矛（枪/矛/戟/长枪等长杆兵器）
    kamayuk: 'spear', fire_lancer: 'spear', elite_fire_lancer: 'spear', heavy_pikeman: 'spear', pikeman: 'spear',
    white_feather_guard: 'spear', elite_white_feather_guard: 'spear',
    ghulam: 'spear', elite_ghulam: 'spear',
    elite_kamayuk: 'spear', flemish_pikeman: 'spear', flemish_pikeman_f: 'spear',
    halberdier: 'spear', hippeus: 'spear', elite_hippeus: 'spear', hoplite: 'spear', elite_hoplite: 'spear', immortal: 'spear', elite_immortal: 'spear', mercenary_hoplite: 'spear',
    lysander_raider: 'spear',
    phalangite: 'spear', elite_phalangite: 'spear', sosso_guard: 'foot_hero', sparabara: 'spear', spearman: 'spear',
    sacred_band: 'spear', amazon_warrior: 'spear', polemarch: 'spear',
    temple_guard: 'spear', elite_temple_guard: 'spear', hill_tribesman: 'spear', indian_tribesman: 'spear',
    guardsman: 'spear', elite_guardsman: 'spear', antiquity_spearman: 'spear',
    eagle_scout: 'spear', eagle_warrior: 'spear', elite_eagle_warrior: 'spear',
    // 双手（双手剑/巨斧/战锤/长刃/无盾近战）
    liao_dao: 'two_handed', elite_liao_dao: 'two_handed',
    elite_ibirapema_warrior: 'two_handed', ibirapema_warrior: 'two_handed', elite_obuch: 'two_handed', obuch: 'two_handed',
    jian_swordman_unshielded: 'two_handed', rhomphaia_warrior: 'two_handed', elite_rhomphaia_warrior: 'two_handed',
    two_handed_swordsman: 'two_handed',
    ninja: 'two_handed',
    samurai: 'two_handed', samurai_elite: 'two_handed',
    shotel_warrior: 'two_handed', elite_shotel_warrior: 'two_handed',
    karambit_warrior: 'two_handed', karambit_warrior_elite: 'two_handed',
    war_dog: 'two_handed', elite_war_dog: 'two_handed',
    warrior_priest: 'two_handed', iroquois_warrior: 'two_handed',

    // ── 远程 ──
    // 弓手
    archer: 'archer', bowman: 'archer', longbowman: 'archer', longbowman_elite: 'archer',
    fire_archer: 'archer', elite_fire_archer: 'archer', rattan_archer: 'archer', rattan_archer_elite: 'archer',
    pattiyoda_longbowman: 'archer', elite_pattiyoda_longbowman: 'archer', composite_bowman: 'archer', elite_composite_bowman: 'archer',
    elephant_archer: 'archer', elite_elephant_archer: 'archer', amazon_archer: 'archer', bactrian_archer: 'archer',
    blackwood_archer: 'archer', elite_blackwood_archer: 'archer', cretan_archer: 'archer',
    elite_plumed_archer: 'archer', plumed_archer: 'archer', immortal_ranged: 'archer', elite_immortal_ranged: 'archer',
    laminated_bowman: 'archer', recurve_bowman: 'archer', outlaw: 'archer',
    // 弩手
    chukonu: 'crossbow', elite_chukonu: 'crossbow', crossbowman: 'crossbow', arbalest: 'crossbow', 
    genoese_crossbowman: 'crossbow', elite_genoese_crossbowman: 'crossbow', gastraphetes: 'crossbow',
    heavy_crossbowman: 'crossbow',
    // 投掷
    throwing_axeman: 'thrown', elite_throwing_axeman: 'thrown', imperial_skirmisher: 'thrown',
    chakram_thrower: 'thrown', elite_chakram_thrower: 'thrown', gbeto: 'thrown', elite_gbeto: 'thrown',
    guecha_warrior: 'thrown', elite_guecha_warrior: 'thrown', elite_skirmisher: 'thrown', skirmisher: 'thrown',
    rhodian_slinger: 'thrown', slinger: 'thrown', thracian_peltast: 'thrown', elite_peltast: 'thrown',
    antiquity_skirmisher: 'thrown', elite_antiquity_skirmisher: 'thrown', grenadier: 'gunpowder_siege',
    // 火器
    hand_cannoneer: 'gunpowder', janissary: 'gunpowder', elite_janissary: 'gunpowder',
    royal_janissary: 'gunpowder',

    // ── 骑兵 ──
    // 战骑（近战骑，含骆驼/枪骑/重骑）
    tiger_rider: 'melee_cav', iron_pagoda: 'melee_cav', hei_kuang: 'melee_cav', hei_kuang_heavy: 'melee_cav',
    steppe_lancer: 'melee_cav', elite_steppe_lancer: 'melee_cav', keshik: 'melee_cav', tarkan: 'melee_cav',
    elite_tarkan: 'melee_cav', boyar: 'melee_cav', savar: 'melee_cav', camel_heavy: 'melee_cav', paladin: 'melee_cav',
    coustillier: 'melee_cav', camel_raider: 'melee_cav', camel_rider: 'melee_cav',
    camel_scout: 'melee_cav', cataphract: 'melee_cav', centurion: 'melee_cav', companion_cavalry: 'melee_cav', elite_companion_cavalry: 'melee_cav',
    elite_boyar: 'melee_cav', elite_cataphract: 'melee_cav', elite_centurion: 'melee_cav', elite_coustillier: 'melee_cav',
    elite_iron_pagoda: 'melee_cav', elite_keshik: 'melee_cav', elite_kona: 'melee_cav', elite_konnik: 'melee_cav',
    elite_leitis: 'melee_cav', elite_magyar_huszar: 'melee_cav', elite_mameluke: 'melee_cav', elite_monaspa: 'melee_cav', elite_shrivamsha_rider: 'melee_cav',
    elite_tiger_cavalry: 'melee_cav', greek_noble_cavalry: 'melee_cav', hussar: 'melee_cav',
    imperial_camel_rider: 'melee_cav', imperial_centurion: 'melee_cav', knight: 'melee_cav', kona: 'melee_cav',
    konnik: 'melee_cav', leitis: 'melee_cav', magyar_huszar: 'melee_cav', mameluke: 'melee_cav', monaspa: 'melee_cav',
    qizilbash_warrior: 'melee_cav', scythian_axe_cavalry: 'melee_cav', shrivamsha_rider: 'melee_cav',
    sogdian_cataphract: 'melee_cav', winged_hussar: 'melee_cav', xolotl_warrior: 'melee_cav', cavalier: 'melee_cav',
    shock_cavalry: 'melee_cav', imperial_cavalry: 'melee_cav', equites: 'melee_cav',
    sarmatian: 'melee_cav', crusader_knight: 'melee_cav', raider: 'melee_cav', antiquity_light_cavalry: 'melee_cav',
    antiquity_scout_cavalry: 'melee_cav', mounted_samurai: 'melee_cav',
    // 弓骑（骑射/骑乘火器/标枪骑，class 36 + 23）
    xianbei_raider: 'horse_archer', kipchak: 'horse_archer', elite_kipchak: 'horse_archer', mangudai: 'horse_archer',
    mangudai_elite: 'horse_archer', cav_archer: 'horse_archer', cav_archer_heavy: 'horse_archer', arambai: 'horse_archer',
    bolas_rider: 'horse_archer', camel_archer: 'horse_archer', conquistador: 'horse_archer', elite_arambai: 'horse_archer',
    elite_bolas_rider: 'horse_archer', elite_camel_archer: 'horse_archer', elite_conquistador: 'horse_archer',
    elite_genitour: 'horse_archer', elite_scythian_horse_archer: 'horse_archer', genitour: 'horse_archer',
    scythian_horse_archer: 'horse_archer', tarantine_cavalry: 'horse_archer', varangian_jarl: 'horse_archer', elite_varangian_jarl: 'horse_archer', antiquity_cavalry_archer: 'horse_archer',
    antiquity_heavy_cavalry_archer: 'horse_archer', mounted_crossbowman: 'horse_archer', mounted_crossbowman_heavy: 'horse_archer',
    khan: 'horse_archer',
    // 象兵
    war_elephant: 'elephant', battle_elephant: 'elephant', armored_elephant: 'elephant', elite_armored_elephant: 'elephant',
    sannahya: 'elephant', elite_sannahya: 'elephant', elite_battle_elephant: 'elephant', elite_war_elephant: 'elephant',
    // 战车
    war_chariot: 'chariot', war_chariot_ranged: 'chariot', elite_war_chariot: 'chariot', war_wagon: 'chariot',
    elite_war_wagon: 'chariot', ratha_melee: 'chariot', ratha_ranged: 'chariot', elite_ratha_melee: 'chariot',
    elite_ratha_ranged: 'chariot',

    // ── 攻城 ──
    // 热兵器（火药/火）
    bombard_cannon: 'gunpowder_siege', organ_gun: 'gunpowder_siege', elite_organ_gun: 'gunpowder_siege',
    houfnice: 'gunpowder_siege', rocket_cart: 'gunpowder_siege', heavy_rocket_cart: 'gunpowder_siege',
    flamethrower: 'gunpowder_siege', petard: 'mechanical', flaming_camel: 'mechanical',
    hero_jeanbureau: 'gunpowder_siege', hero_jeandelorrain: 'gunpowder_siege',
    hussite_wagon: 'chariot', elite_hussite_wagon: 'chariot',
    // 冷兵器（机械/扭力/重力）
    ballista_elephant: 'mechanical', elite_ballista_elephant: 'mechanical', battering_ram: 'mechanical',
    capped_ram: 'mechanical', heavy_scorpion: 'mechanical',
    mangonel: 'mechanical', mounted_trebuchet: 'mechanical', onager: 'mechanical', scorpion: 'mechanical',
    siege_onager: 'mechanical', siege_ram: 'mechanical', traction_trebuchet: 'mechanical', helepolis: 'mechanical',
    siege_tower: 'mechanical', antiquity_battering_ram: 'mechanical', antiquity_capped_ram: 'mechanical',
    antiquity_scorpion: 'mechanical', antiquity_heavy_scorpion: 'mechanical', antiquity_mangonel: 'mechanical',
    antiquity_onager: 'mechanical', antiquity_siege_onager: 'mechanical', antiquity_siege_ram: 'mechanical',
    antiquity_siege_tower: 'mechanical',
    bad_neighbor: 'mechanical', gods_own_sling: 'mechanical', warwolf_trebuchet: 'mechanical', saboteur: 'mechanical',

    // ── 船只 ──
    galley: 'galley', war_galley: 'galley', ant_galley: 'galley', ant_war_galley: 'galley', ant_elite_galley: 'galley',
    fire_galley: 'fire_ship', fire_ship: 'fire_ship', fast_fire_ship: 'fire_ship', incendiary_ship: 'fire_ship',
    heavy_incendiary_ship: 'fire_ship',
    cannon_galleon: 'cannon_ship', elite_cannon_galleon: 'cannon_ship', catapult_ship: 'cannon_ship', onager_ship: 'cannon_ship',
    demo_ship: 'demo_ship', heavy_demo_ship: 'demo_ship',
    caravel: 'warship', elite_caravel: 'warship', longboat: 'warship', elite_longboat: 'warship', turtle_ship: 'warship',
    elite_turtle_ship: 'warship', dragon_ship: 'warship', thirisadai: 'warship',

    // ── 英雄：骑马（41 位）＋ 弓骑（10 位）──
    // 🔴 [2026-10-19 主人令「英雄分类再细，添加一个弓骑类」] 弓骑 = 骑马且 WarTypes 为远程穿刺攻击（rng>0、dmgType pierce）的英雄
    hero_alaric: 'mounted_hero', hero_algirdas: 'mounted_hero', hero_aristagoras: 'mounted_hero',
    hero_artaphernes: 'horse_archer_hero', hero_attila: 'mounted_hero', hero_basileus: 'foot_hero',
    hero_bernardarmagnac: 'mounted_hero', hero_bohemond: 'mounted_hero', hero_caocao: 'mounted_hero',
    hero_cleitus: 'mounted_hero', hero_cumanchief: 'mounted_hero', hero_datis: 'mounted_hero',
    hero_dinhle: 'mounted_hero', hero_mounted_alexander: 'mounted_hero', hero_edwardlongshanks: 'mounted_hero',
    hero_generalaraiyan: 'mounted_hero', hero_gilbertdeclare: 'mounted_hero', hero_girgenkhan: 'horse_archer_hero',
    hero_guanyu: 'mounted_hero', hero_ivaylo: 'mounted_hero', hero_janzizka: 'mounted_hero',
    hero_joanofarc: 'mounted_hero', hero_jogaila: 'mounted_hero', hero_johnthefearless: 'mounted_hero',
    hero_kestutis: 'mounted_hero', hero_kotyankhan: 'horse_archer_hero', hero_kushluk: 'mounted_hero',
    hero_lautaro: 'mounted_hero', hero_lubu: 'horse_archer_hero', hero_osman: 'horse_archer_hero',
    hero_perdiccas: 'mounted_hero', hero_philipthegood: 'mounted_hero', hero_prithviraj: 'horse_archer_hero',
    hero_qutlugh: 'horse_archer_hero', hero_rajendrachola: 'mounted_hero', hero_robertguiscard: 'mounted_hero',
    hero_rogerbosso: 'mounted_hero', hero_shahismail: 'mounted_hero', hero_subotai: 'horse_archer_hero',
    hero_sumanguru: 'mounted_hero', hero_sunce: 'mounted_hero', hero_sundjata: 'mounted_hero',
    hero_sunjian: 'mounted_hero', hero_sunquan: 'horse_archer_hero', hero_tariqibnziyad: 'horse_archer_hero',
    hero_thoros: 'mounted_hero', hero_thracian_chieftain: 'mounted_hero', hero_tsarkonstantin: 'mounted_hero',
    hero_ulrichvonjungingen: 'mounted_hero', hero_vladdracula: 'mounted_hero', hero_vytautasthegreat: 'mounted_hero',
    envoy: 'mounted_hero', hero_jadwiga: 'magic_hero',
    hero_tamar: 'magic_hero', hero_bucephalus: 'noncombat_hero',

    // ── 英雄：步战 ＋ 步射 ＋ 法术 ──
    // 🔴 [2026-10-19 主人令「添加一个步射类」「添加一个法术类，例如 hero_chandbardai」]
    //    步射 = 步战且 WarTypes 为远程穿刺攻击的英雄；法术 = WarTypes 注明「非攻击性英雄统一设为简单魔法形态」的英雄（布塞法洛斯是马、不进法师类，仍归非战斗）
    hero_arariboiamelee: 'foot_hero', hero_aristides: 'foot_hero', hero_ataulf: 'foot_hero',
    hero_friartuck: 'magic_hero', hero_imam: 'magic_hero', hero_chandbardai: 'magic_hero', hero_belaiv: 'magic_hero', hero_shahking: 'magic_hero', hero_jayanegara: 'magic_hero',
    hero_harald: 'foot_hero', hero_ulf: 'foot_hero', hero_halldor: 'foot_hero', hero_tostig: 'mounted_hero',
    hero_themistocles_hoplite: 'foot_hero', hero_arariboiaranged: 'foot_archer_hero',
    hero_brasidas: 'foot_hero', hero_cunhambebe: 'foot_hero', hero_cusiyupanqui: 'foot_hero',
    hero_dafyddapgruffydd: 'foot_hero', hero_dismounted_alexander: 'foot_hero', hero_gajahmada: 'foot_hero',
    hero_galvarino: 'foot_hero', hero_gidajan: 'foot_hero', hero_guacolda: 'foot_hero',
    hero_ivaylofoot: 'foot_hero', hero_joanthemaid: 'foot_hero', hero_leloi: 'foot_hero',
    hero_liubei: 'foot_hero', hero_llywelynapgruffydd: 'foot_hero', hero_lysander: 'foot_hero',
    hero_macedonian_commander: 'foot_hero', hero_pacanchique: 'foot_hero', hero_pachacuti: 'foot_hero',
    hero_parmenion: 'foot_hero', hero_sforza: 'foot_hero', hero_williamwallace: 'foot_hero',
    hero_yodit: 'foot_archer_hero', hero_zhangfei: 'foot_hero', hero_zhugeliang: 'magic_hero',

    // ── 英雄：旗舰（4 位）──
    hero_themistocles: 'naval_hero', hero_artemisia: 'naval_hero', hero_dreki: 'naval_hero', hero_stoertebeker: 'naval_hero',
    hero_dionysus: 'naval_hero', hero_aeginetan: 'naval_hero',

    // ── 英雄：象驾（3 位）──
    porus_elephant: 'elephant_hero', dagnajan_elephant: 'elephant_hero', bayinnaung_elephant: 'elephant_hero',
    // ── 2026-10-19 补入的 DE 单位 ──
    trebuchet_packed: 'mechanical',
    hero_aethelfrith: 'foot_hero',
    archbishop: 'magic_hero',
    archer_of_the_eyes: 'foot_archer_hero',
    hero_belisarius: 'mounted_hero',
    hero_charlemagne: 'foot_hero',
    hero_charlesmartel: 'foot_hero',
    hero_constablerichemont: 'mounted_hero',
    hero_dukedalencon: 'mounted_hero',
    hero_elcid: 'foot_hero',
    emperor_in_a_barrel: 'noncombat_hero',
    hero_erikthered: 'foot_hero',
    hero_gawain: 'mounted_hero',
    hero_genghiskhan: 'horse_archer_hero',
    hero_guyjosselyne: 'mounted_hero',
    hero_hrolftheganger: 'foot_hero',
    hunting_wolf: 'foot_hero',
    hero_kingarthur: 'foot_hero',
    hero_kitabatake: 'foot_hero',
    hero_lahire: 'foot_hero',
    hero_lancelot: 'mounted_hero',
    hero_lorddegraville: 'foot_archer_hero',
    master_of_the_templar: 'mounted_hero',
    hero_minamoto: 'foot_hero',
    hero_mordred: 'mounted_hero',
    ornlu_the_wolf: 'foot_hero',
    hero_reynalddechatillon: 'mounted_hero',
    hero_richardthelionheart: 'mounted_hero',
    hero_robinhood: 'foot_archer_hero',
    hero_roland: 'mounted_hero',
    hero_sheriffofnottingham: 'foot_hero',
    hero_siegfried: 'foot_hero',
    hero_sieurbertrand: 'mounted_hero',
    hero_sieurdemetz: 'mounted_hero',
    hero_sirjohnfastolf: 'mounted_hero',
    hero_tamerlane: 'horse_archer_hero',
    hero_theblackprince: 'mounted_hero',
    hero_theodoricthegoth: 'foot_hero',
    hero_admiralyisunshin: 'naval_hero',
    hero_alexandernevski: 'mounted_hero',
    hero_bledathehun: 'mounted_hero',
    hero_elcidcampeador: 'mounted_hero',
    hero_henryv: 'mounted_hero',
    hero_kingalfonso: 'magic_hero',
    hero_kingsancho: 'magic_hero',
    hero_nobunaga: 'foot_hero',
    hero_popeleoi: 'magic_hero',
    scythian_scout: 'mounted_hero',
    scythian_wild_woman: 'foot_hero',
    hero_williamtheconqueror: 'mounted_hero',
    hero_cuauhtemoc: 'foot_hero',
    hero_franciscodeorellana: 'horse_archer_hero',
    hero_frederickbarbarossa: 'foot_hero',
    hero_gonzalopizarro: 'horse_archer_hero',
    norse_chieftain: 'mounted_hero',
    hero_khosrau: 'elephant_hero',
    hero_prithvi: 'foot_archer_hero',
    queen: 'magic_hero',
    hero_saladin: 'mounted_hero',
    hero_sanyogita: 'magic_hero',
    hero_abrahaelephant: 'elephant_hero',
    hero_babur: 'mounted_hero',
    hero_guglielmoembriaco: 'foot_archer_hero',
    hero_henryii: 'foot_hero',
    hero_huaynacapac: 'foot_archer_hero',
    hero_itzcoatl: 'foot_hero',
    hero_littlejohn: 'foot_hero',
    hero_miklostoldi: 'mounted_hero',
    hero_musaibnnusayr: 'horse_archer_hero',
    hero_mustafapasha: 'foot_archer_hero',
    hero_pacalii: 'foot_archer_hero',
    hero_princessyodit: 'magic_hero',
    hero_richarddeclare: 'mounted_hero',
    hero_sudingfang: 'foot_archer_hero',
    hero_tristan: 'mounted_hero',
    hero_yekunoamlak: 'foot_hero',
    hero_zawiszatheblack: 'mounted_hero',
    hero_buibi: 'magic_hero',
    hero_jayaviravarman: 'foot_hero',
    hero_lelai: 'foot_hero',
    hero_letrien: 'foot_hero',
    hero_luunhanchu: 'foot_archer_hero',
    hero_radenwijaya: 'mounted_hero',
    hero_suryavarmani: 'elephant_hero',
    hero_tabinshwehti: 'elephant_hero',
    hero_udayadityavarmani: 'magic_hero',
    hero_wangtong: 'mounted_hero',
    hero_henrythelion: 'mounted_hero',
    hero_leiferikson: 'naval_hero',
    the_middlebrook: 'naval_hero',
    hero_tokhtamyshkhan: 'mounted_hero',
    hero_topayupanqui: 'foot_hero',
    hero_uruskhan: 'horse_archer_hero',
    hero_vascodagama: 'naval_hero',
    hero_jacquelineofhainaut: 'magic_hero',
    hero_dmitryofmoscow: 'mounted_hero',
    hero_emperorsigismund: 'mounted_hero',
    hero_mikhailoftver: 'mounted_hero',
    hero_youngjadwiga: 'foot_hero',
    hero_amoghavarsha: 'foot_hero',
    hero_ibrahimlodi: 'horse_archer_hero',
    hero_mihirabhoja: 'mounted_hero',
    hero_shaybanikhan: 'horse_archer_hero',
    hero_youngbabur: 'mounted_hero',
    hero_ismail: 'mounted_hero',
    hero_ivane: 'mounted_hero',
    hero_mleh: 'foot_hero',
    hero_selimthegrim: 'mounted_hero',
    hero_stephan: 'foot_hero',
    hero_yury: 'foot_hero',
    hero_zakare: 'foot_hero',
    hero_dongzhuo: 'mounted_hero',
    emperor_in_a_litter: 'noncombat_hero',
    hero_liubiao: 'horse_archer_hero',
    hero_whitetigeryan: 'mounted_hero',
    hero_yuji: 'magic_hero',
    hero_yuanshao: 'horse_archer_hero',
    hero_zhangjue: 'magic_hero',
    hero_zhaoyun: 'mounted_hero',
    hero_zhouyu: 'foot_archer_hero',
    hero_einarpaunchshaker: 'foot_archer_hero',
    hero_finnarnason: 'foot_hero',
    hero_kalfarnason: 'foot_hero',
    hero_cleon: 'foot_hero',
    hero_darius: 'mounted_hero',
    hero_leonidas: 'foot_hero',
    hero_miltiades: 'foot_hero',
    hero_flagshipofnearchos: 'naval_hero',
    hero_hephaistion: 'foot_hero',
    hero_nearchos: 'foot_hero',
    // ── 2026-10-19 补入的 DE 单位 ──
    hero_haraldhardrada: 'foot_hero',
    // ── 2026-10-19 补入的 DE 单位 ──
    cobra_car: 'mechanical',
    sharkatzor: 'mechanical',
    // 🔴 [2026-10-19 主人令「所有传教士，祭祀，僧侣，异教徒都是法术」「法术属于远程中的一类」]
    priestess: 'magic', missionary: 'magic', priest: 'magic', pagan_priest: 'magic', monk: 'magic',
};

/** 取兵种二级分类；未登记返回 undefined（图鉴显示「—」）。 */
export function getUnitSubcategory(id: string): SubCategory | undefined {
    return UNIT_SUBCATEGORY[id];
}

/**
 * 兵种升级档判定：帝国决定版里同一兵种通常有「普通 → 精锐」两档，
 * 部分文明还有帝国/皇家档。这里按中文名前缀 + 英文 ID 前后缀双路识别，
 * 二者任一命中即算高级档（例如 samurai_elite / elite_keshik / hei_kuang_heavy「精锐黑光铠骑兵」）。
 */
export function getUnitTier(u: DeUnitDef): 'elite' | 'base' {
    if (/(精锐|高级|重装|帝国|皇家)/.test(u.name)) return 'elite';
    if (/^(elite_|imperial_|royal_)/.test(u.id)) return 'elite';
    if (/_(elite|heavy)$/.test(u.id)) return 'elite';
    return 'base';
}

/** 旧版兵种 ID（三国志10体系 S10DB 素材）→ 中文名映射 */
// ── 兵种属性 ──
//   数值直接读 13 战斗在用的那张 WAR_TYPES（src/data/WarTypes.ts），出处是本机 empires2_x2_p1.dat。
//   鉴赏只读不改；要改数值改那张表。船只走 NavalShipTiers（13 没有海战），没有的一律显示「—」，不编。

/** DE 护甲类（armor class）编号 → 中文；编号含义抄自 WarTypes.ts 表头，表里没有的照原样显示数字。 */
const ARMOR_CLASS_LABEL: Record<number, string> = {
    1: '步兵', 3: '基础穿刺', 4: '基础近战', 5: '战象', 8: '骑兵', 11: '建筑',
    13: '石质防御', 15: '射手', 16: '船', 17: '冲车', 19: '独特单位', 20: '攻城武器',
    21: '标准建筑', 22: '城墙', 26: '城堡', 27: '长枪', 28: '弓骑', 29: '鹰勇士',
    30: '骆驼', 31: '有机',
};
const armorClassName = (c: number): string => ARMOR_CLASS_LABEL[c] ?? `类${c}`;

const getUnitStats = (unitId: string): WarType | undefined => WAR_TYPES[unitId];

/** 射程：WAR_TYPES 存像素（DE 格 ×40），鉴赏按 DE 的「格」显示更好读。 */
const rangeInTiles = (rngPx: number): string => rngPx > 0 ? String(+(rngPx / 40).toFixed(1)) : '—';

/** 素材目录名（大写）—— 船只那两张表按它作键，不是兵种 id。 */
const assetDirOf = (u: DeUnitDef): string =>
    u.pathPrefix.split('/').filter(Boolean).pop()?.toUpperCase() ?? '';

const NAVAL_WEAPON_LABEL: Record<NavalWeapon, string> = {
    cannon: '火炮', greekfire: '希腊火', trebuchet: '抛石', arrow: '弓弩', ram: '撞角',
};

/** 船只属性：武器（含 DE 依据）+ 哪些文化在用。战船不进 WAR_TYPES，属性从这两张表来。 */
function getShipInfo(u: DeUnitDef): { weapons: string; why: string; regions: string[] } | undefined {
    if (u.category !== 'naval' && getUnitSubcategory(u.id) !== 'naval_hero') return undefined;
    const dir = assetDirOf(u);
    const extra = listNavalShipWeapons()[dir];
    // 箭是所有船的基础层，NavalShipTiers 表里不写；表里没有的船 = 只有箭
    const weapons: NavalWeapon[] = ['arrow', ...(extra?.weapons ?? [])];
    return {
        weapons: weapons.map(w => NAVAL_WEAPON_LABEL[w]).join(' + '),
        why: extra?.why ?? 'DE 表未单列 = 只有甲板弓手的箭',
        regions: listCultureNavalShips().find(c => c.ship === dir)?.regions ?? [],
    };
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
    /** 该势力开局名将的 generalId（军团看武将时代用） */
    generalId?: string;
    /** 首都据点的建筑风格（军团看建筑风格用） */
    buildingStyle?: string;
    /** 该势力的史实将领名（搜索用：主人习惯按武将找势力，如「施琅」→ wenling） */
    generalName?: string;
    /** 精锐**番号** + tier（如 wenling → 福建水师 T3），出处 ExpeditionLegions。
     *  🔴 番号 ≠ 军团名：军团名是这套三排编成自己的名字，存在 legion.legionName。 */
    eliteName?: string;
    eliteTier?: number;
    /** 军团名称（三排编成这支部队的名字，如「瓦兰吉卫队军团」）。
     *  没有势力专属名时回退成**所属文化区的军团名**。 */
    legionName?: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    row1Type: string;
    row2Type: string;
    row3Type: string;
    commanderUnit?: string;
}

/** 编辑器内存态：势力表本身**只存指针**（2026-09-14 副本已删），
 *  编辑界面要显示/改三排兵种，所以在内存里把它挂的那支军团的编制取出来带上。
 *  这份编制**不会**再被写回势力表——保存只写军团自己那条记录。 */
type EditableLegion = CustomFactionLegion & {
    formationMode: FormationMode;
    slots: CompositionSlot[];
    commanderUnit?: string;
    tierSlots?: Record<number, { type: string; scale?: number }>;
};

function toEditableLegion(c: CustomFactionLegion): EditableLegion {
    const comp = getLegionCompositionByName(c.legionName);
    return {
        ...c,
        formationMode: comp?.formationMode ?? 'square',
        slots: (comp?.slots ?? []).map(s => ({ ...s })),
        commanderUnit: comp?.commanderUnit,
    };
}

function buildLocalCompositions(): Record<string, EditableLegion> {
    const out: Record<string, EditableLegion> = {};
    for (const [fid, c] of Object.entries(FACTION_COMPOSITIONS)) out[fid] = toEditableLegion(c);
    return out;
}

let localCustomCompositions: Record<string, EditableLegion> = buildLocalCompositions();
let allRows: FactionLegionRow[] = [];
let filteredRows: FactionLegionRow[] = [];
let selectedFactionId: string | null = null;
let currentEditingLegion: EditableLegion | null = null;
let clipboardLegion: EditableLegion | null = null;
// 3-layer selection state is declared below

let searchQuery = '';
let selectedRegionFilter: string = 'all';
let animState: 'idle' | 'move' | 'attack' = 'idle';
let animDirection: number = 2; // 默认朝东南 (3=正南, 0=东北, 1=东, 2=东南, 4=西南, 5=西, 6=西北, 7=北)
let animTimer: number | null = null;
let previewViewMode: 'single' | 'three' | 'phalanx' | 'strategic' = 'three';
/** 兵种缩略图全体朝向（选择兵种弹窗可改，默认东南=2） */
let unitThumbDir: number = 2;
let singlePreviewRow: number = 0; // 0=前排, 1=中坚, 2=后排
let sortCol: string = 'region';
let sortAsc: boolean = true;

// ── 战略地图军团鉴赏状态 ──
let stratAction: 'idle' | 'move' | 'attack' = 'idle';
let stratDir: number = 2; // 默认朝东南 (3=正南, 0=东北, 1=东, 2=东南, 4=西南, 5=西, 6=西北, 7=北)
let stratZoom: number = 1.0; // 默认 1.00x，支持 0.70x (Zoom 9) 与 1.25x
let stratShowCollision: boolean = true;
let stratChariotOverrideScale: number | null = null;
let stratAnimTimer: number | null = null;

// ── 兵种图鉴视图状态 ──
type MainView = 'factions' | 'units' | 'naval' | 'strategic' | 'legions';
let mainView: MainView = 'factions';
let catalogRows: DeUnitDef[] = [];
let catalogSearch = '';
let catalogCatFilter: 'all' | UnitCategory = 'all';
let catalogSubFilter: 'all' | SubCategory = 'all';
let catalogTierFilter: 'all' | 'elite' | 'base' = 'all';
let catalogAgeFilter: 'all' | UnitAge = 'all';
// 🔴 [2026-10-19 主人令] DE 来源七类：城堡兵、文化兵、区域兵、特殊兵、普通兵、英雄、精英兵；none＝DE 查不到出处（项目自建）
let catalogSrcFilter: 'all' | DeSourceType | 'none' = 'all';
const getUnitSource = (id: string): DeSourceType | 'none' => DE_UNIT_SOURCE_TYPE[id] ?? 'none';
const srcLabel = (t: DeSourceType | 'none'): string => t === 'none' ? '项目自建' : DE_SOURCE_TYPE_LABEL[t];
let catalogSortCol: 'name' | 'id' | 'category' | 'subcategory' | 'source' | 'tier' | 'age' | 'hp' | 'atk' | 'rng' | 'power' | 'model' = 'name';
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
  </div>
</header>
<aside id="le-composition-rule" style="flex-shrink:0;padding:2px 16px;border-bottom:1px solid #8a6038;background:#302016;color:#9c8a6e;font-size:10px;line-height:1.35;">🔴 铁律：一个军团只能有一种编制，严禁同一军团多种编制 —— 前排/中排/后排兵种一致且阵型一样即同一种编制；武将换军团只改归属，编辑军团编制时所有使用者全部同步。</aside>
<div class="le-viewtabs">
  <button type="button" class="le-viewtab active" data-view="factions">⚔ 势力军团编排</button>
  <button type="button" class="le-viewtab" data-view="legions">🏵 军团编辑</button>
  <button type="button" class="le-viewtab" data-view="naval">🚢 海军编排</button>
  <button type="button" class="le-viewtab" data-view="units">🗂 兵种鉴赏 (${DE_UNITS_CATALOG.length})</button>
  <button type="button" class="le-viewtab" data-view="strategic">🗺️ 战略地图军团鉴赏</button>
</div>
<div class="le-toolbar" id="le-toolbar-factions">
  <input id="le-search" class="le-input" type="search" placeholder="搜索 军团 / 兵种 / 据点 / 势力 / 武将 / 精锐 / 旗号 / ID…" />
  <select id="le-region-filter" class="le-select">
    <option value="all">全部文化区 (18)</option>
    ${REGION_ORDER.map(r => `<option value="${r}">${REGION_LABELS[r]} (${r})</option>`).join('')}
  </select>
  <span id="le-stats" class="le-stats">加载中…</span>
</div>
<div class="le-toolbar" id="le-toolbar-units" style="display:none;">
  <input id="le-cat-search" class="le-input" type="search" placeholder="搜索兵种 中文名 / ID / 素材目录…" />
  <select id="le-cat-filter" class="le-select">
    <option value="all">全部类别 (${DE_UNITS_CATALOG.length})</option>
    <option value="infantry">🛡️ 步兵 (${DE_UNITS_CATALOG.filter(u => u.category === 'infantry').length})</option>
    <option value="cavalry">🐎 骑兵 (${DE_UNITS_CATALOG.filter(u => u.category === 'cavalry').length})</option>
    <option value="ranged">🏹 远程 (${DE_UNITS_CATALOG.filter(u => u.category === 'ranged').length})</option>
    <option value="siege">⚙️ 攻城 (${DE_UNITS_CATALOG.filter(u => u.category === 'siege').length})</option>
    <option value="naval">🚢 船只 (${DE_UNITS_CATALOG.filter(u => u.category === 'naval').length})</option>
    <option value="hero">👑 英雄 (${DE_UNITS_CATALOG.filter(u => u.category === 'hero').length})</option>
    <option value="civilian">🧺 非战斗 (${DE_UNITS_CATALOG.filter(u => u.category === 'civilian').length})</option>
    <option value="other">🐾 其他 (${DE_UNITS_CATALOG.filter(u => u.category === 'other').length})</option>
  </select>
  <select id="le-sub-filter" class="le-select">
    <option value="all">全部子类 (${DE_UNITS_CATALOG.length})</option>
  </select>
  <select id="le-age-filter" class="le-select">
    <option value="all">全部时代 (${DE_UNITS_CATALOG.length})</option>
    ${AGE_ORDER.map(a => `<option value="${a}">${AGE_LABEL[a]} (${DE_UNITS_CATALOG.filter(u => u.age === a).length})（${AGE_YEARS[a].span}）</option>`).join('')}
  </select>
  <select id="le-tier-filter" class="le-select">
    <option value="all">全部升级档 (${DE_UNITS_CATALOG.length})</option>
    <option value="elite">⭐ 仅精锐 / 帝国档 (${DE_UNITS_CATALOG.filter(u => getUnitTier(u) === 'elite').length})</option>
    <option value="base">仅普通档 (${DE_UNITS_CATALOG.filter(u => getUnitTier(u) !== 'elite').length})</option>
  </select>
  <select id="le-src-filter" class="le-select" title="按 DE 来源分：城堡兵、文化兵、区域兵、特殊兵、普通兵、英雄、精英兵">
    <option value="all">全部来源 (${DE_UNITS_CATALOG.length})</option>
    ${[...DE_SOURCE_TYPE_ORDER, 'none' as const].map(t => `<option value="${t}">${srcLabel(t)} (${DE_UNITS_CATALOG.filter(u => getUnitSource(u.id) === t).length})</option>`).join('')}
  </select>
  <span id="le-cat-stats" class="le-stats">加载中…</span>
</div>
<div class="le-body">
  <!-- 左侧：势力大表 / 兵种图鉴 -->
  <main class="le-main">
    <div id="le-table-wrap" class="le-table-wrap"></div>
    <div id="le-cat-table-wrap" class="le-table-wrap" style="display:none;"></div>
    <!-- 🔴 [2026-09-15 主人「为什么不放一起」] 军团编辑与其它视图并排，占满整个主区 -->
    <!-- 🔴 [2026-09-15] height:100% 是必须的：父级 .le-main 是 block+overflow:auto，
         flex:1 在这里不生效，wrap 会被内容撑到近万像素，右侧 420px 编辑栏跟着被顶到顶部、
         一往下拉就滚出屏幕。锁成一屏高之后，左表自己滚、右编辑栏常驻。 -->
    <div id="le-legion-wrap" style="display:none;height:100%;min-height:0;flex-direction:column;overflow:hidden;"></div>
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
    stats: document.getElementById('le-stats')!,
    tableWrap: document.getElementById('le-table-wrap')!,
    panel: document.getElementById('le-panel')!,
    panelContent: document.getElementById('le-panel-content')!,
    toast: document.getElementById('le-toast')!,
    btnReload: document.getElementById('le-reload') as HTMLButtonElement,
    toolbarFactions: document.getElementById('le-toolbar-factions')!,
    toolbarUnits: document.getElementById('le-toolbar-units')!,
    catSearch: document.getElementById('le-cat-search') as HTMLInputElement,
    catFilter: document.getElementById('le-cat-filter') as HTMLSelectElement,
    subFilter: document.getElementById('le-sub-filter') as HTMLSelectElement,
    tierFilter: document.getElementById('le-tier-filter') as HTMLSelectElement,
    srcFilter: document.getElementById('le-src-filter') as HTMLSelectElement,
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
      .le-btn-sm { padding:3px 8px; font-size:12px; }
      .le-btn-xs { padding:2px 6px; font-size:11px; }

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
      /* 时代标签：黑暗→封建→城堡→帝国 由暗到亮，待核用醒目的赭红提示需要人工确认 */
      .age-tag {
        display:inline-block; padding:2px 6px; border-radius:3px; font-size:10px;
        font-weight:bold; white-space:nowrap;
      }
      .age-antiquity{ background:#1a1816; color:#8a8276; border:1px solid #332e28; }
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
      .stat-cell { text-align:center; font-family:monospace; font-size:12px; }
      .le-power-bar {
        display:flex; align-items:center; gap:12px; margin-bottom:10px; padding:8px 10px;
        background:#1a1712; border:1px solid #3a3228; border-radius:6px;
      }
      .le-power-num { font-size:26px; font-weight:bold; color:#e0c060; font-family:monospace; }
      .le-power-unit { font-size:11px; color:#8a8175; margin-left:6px; }
      .le-power-note { font-size:11px; color:#8a8175; line-height:1.6; flex:1; }
      .le-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
      .le-stat-box { background:#181614; border:1px solid #2a2620; border-radius:5px; padding:6px 4px; text-align:center; }
      .le-stat-label { font-size:10px; color:#8a8175; }
      .le-stat-value { font-size:15px; font-weight:bold; color:#f5e6c8; font-family:monospace; margin-top:2px; }
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
         战略地图鉴赏加宽到 760：大地图方阵与全景沙盘需要足够的视界。
         势力编排视图保持 520，免得把 925 行大表的九列挤没了。 */
      .le-panel.is-units { width:620px; }
      .le-panel.is-strategic { width:760px; }
      .le-strat-stage { display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
      .le-strat-canvas-wrap {
        position:relative; width:100%; height:380px; background:#141f12;
        border:1px solid #2a3824; border-radius:6px; overflow:hidden;
        box-shadow:inset 0 0 35px rgba(0,0,0,0.6);
      }
      .le-strat-canvas { width:100%; height:100%; display:block; }
      .le-strat-toolbar {
        display:flex; flex-wrap:wrap; gap:8px; align-items:center;
        background:#1a1714; border:1px solid #302a22; padding:8px 10px; border-radius:5px;
      }
      .le-overlap-alert {
        background:#301414; border:1px solid #702828; color:#ffb0a0;
        border-radius:5px; padding:10px 14px; font-size:12px; line-height:1.6; margin-bottom:12px;
      }
      .le-overlap-ok {
        background:#162618; border:1px solid #2c5430; color:#b0e8b8;
        border-radius:5px; padding:10px 14px; font-size:12px; line-height:1.6; margin-bottom:12px;
      }
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
        /* 🔴 [2026-10-16 主人令「错误提示显示太短，还没看完就不显示了，请长一点」]
           长报错（如 EPERM 整段）要能换行、能选中复制；错误条还可以点一下关闭。 */
        max-width:min(760px, 62vw); line-height:1.5; white-space:pre-wrap;
        user-select:text;
      }
      .le-toast:empty { display:none; }
      .le-toast.is-error { background:#301a1a; color:#ffb4a8; border-color:#6a3a3a; cursor:pointer; }
      .le-toast.is-error::after { content:'  ✕ 点一下关闭'; opacity:0.55; font-size:11px; }

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
      .le-era-tabs { display:flex; gap:4px; margin-bottom:8px; }
      .le-era-btn {
        flex:1; padding:5px 4px; font-size:11px; cursor:pointer; white-space:nowrap;
        background:#1a1816; color:#a89f8f; border:1px solid #2f2a24; border-radius:4px;
      }
      .le-era-btn:hover { color:#f5e6c8; border-color:#4a4238; }
      .le-era-btn.active { background:#3a3020; color:#f5d78e; border-color:#7a6438; font-weight:bold; }
      .le-legion-grid {
        display:grid; grid-template-columns:1fr; gap:6px;
        max-height:360px; overflow-y:auto; padding-right:4px;
      }
      .le-legion-card {
        background:#1c1916; border:1px solid #3a342c; border-radius:6px;
        padding:8px 10px; cursor:pointer; transition:all 0.15s; position:relative;
      }
      .le-legion-delete {
        position:absolute; top:4px; right:4px; padding:2px 6px; font-size:11px;
        background:transparent; border:1px solid #5a4038; border-radius:4px;
        color:#c88a7a; cursor:pointer; line-height:1.4;
      }
      .le-legion-delete:hover { background:#3a2018; border-color:#c0503a; color:#f0a090; }
      .le-legion-card:hover { background:#24211c; border-color:#6a5e4c; }
      .le-legion-card.active {
        background:#2a2416; border-color:#c8a84b; box-shadow:0 0 0 1px #c8a84b inset;
      }
      .le-legion-card .lc-name { font-size:13px; font-weight:bold; color:#f5e6c8; }
      .le-legion-card.active .lc-name { color:#f5d78e; }
      .le-legion-card .lc-meta { font-size:11px; color:#a89f8f; margin-top:2px; line-height:1.5; }
      .le-legion-card .lc-power { font-size:11px; font-weight:bold; font-family:monospace; margin-left:6px; float:right; }
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

      /* 🔴 [2026-10-18 主人令「在军团编辑中添加一个功能，我在选兵种的时候，鼠标移动到兵种的图标，就放大，现在看不清」]
         兵种图标悬停放大镜：body 下的单例浮层，position:fixed + pointer-events:none
         —— 不占布局、不挡点击，也不会因为浮层盖住图标而触发 mouseout 造成闪烁。
         canvas 里的素材是 nearest-neighbor 放大（见 drawUnitThumb 的 crisp 参数），
         再用 image-rendering:pixelated 兜一层，保证像素兵种放大后边缘不糊。 */
      .le-unit-thumb { cursor:zoom-in; }
      .le-thumb-zoom {
        position:fixed; left:0; top:0; z-index:30000; pointer-events:none;
        display:flex; flex-direction:column; gap:6px; padding:8px;
        border-radius:8px; background:rgba(16,14,12,0.97); border:1px solid #6a5a32;
        box-shadow:0 12px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(200,168,75,0.15) inset;
        visibility:hidden; opacity:0; transition:opacity 0.08s ease-out;
      }
      .le-thumb-zoom.is-on { visibility:visible; opacity:1; }
      .le-thumb-zoom canvas {
        width:256px; height:256px; display:block; border-radius:4px;
        background:#0a0908; image-rendering:pixelated;
      }
      .le-thumb-zoom .le-thumb-zoom-name {
        width:256px; font-size:13px; font-weight:bold; color:#fff8e8;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      .le-thumb-zoom .le-thumb-zoom-meta {
        display:flex; justify-content:space-between; gap:8px;
        width:256px; font-size:10px; color:#a89f8f;
      }
      .le-thumb-zoom .le-thumb-zoom-cat { color:#c8a84b; }
      .le-thumb-zoom .le-thumb-zoom-id {
        font-family:monospace; color:#8ab4c4;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }
    `;
    document.head.appendChild(s);
}

/**
 * 🔴 [2026-10-16 主人令「错误提示显示太短，还没看完就不显示了，请长一点」]
 *  · 错误（isError）：**不自动消失，点一下才关** —— 长报错（EPERM 那种整段）能慢慢看完、能选中复制；
 *  · 普通提示：按字数给时间（3.5 秒起、每字 120ms、封顶 12 秒），长成功文案也看得完。
 */
let toastTimer: number | undefined;
let toastClickBound = false;
function showToast(msg: string, isError: boolean = false): void {
    window.clearTimeout(toastTimer);
    els.toast.textContent = msg;
    els.toast.className = 'le-toast' + (isError ? ' is-error' : '');
    els.toast.title = isError ? '点一下关闭' : '';
    if (!toastClickBound) {
        toastClickBound = true;
        els.toast.addEventListener('click', () => {
            window.clearTimeout(toastTimer);
            els.toast.textContent = '';
            els.toast.className = 'le-toast';
            els.toast.title = '';
        });
    }
    if (isError) { toastTimer = undefined; return; }   // 错误常驻，等主人点
    toastTimer = window.setTimeout(() => { els.toast.textContent = ''; },
        Math.min(12000, Math.max(3500, msg.length * 120)));
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
        // 🔴 [2026-08-31 修] 绝不能直接用 `capCity.region` 原始值。
        //    getCityRegion 内部做了三件事：旧名翻译(LEGACY_REGION_MAP) → 校验在不在 REGION_ORDER
        //    → 不合法才回落坐标判定。原来写成 `capCity.region || getCityRegion(...)`，
        //    等于**把校验整个绕过去**：cities_v2 里混进来的 AoE2 文明名（FRANKS/INCAS/INDIANS/
        //    PERSIANS/THRACIANS）被当成合法文化区直接采用，界面上文化列显示原始 ID，
        //    保底军团被静默算成【中原军团】。统一走 getCityRegion，一处校验管到底。
        const region: RegionType = capCity
            ? getCityRegion({ latitude: capCity.lat, longitude: capCity.lng, region: capCity.region })
            : 'CENTRAL';
        const regionLabel = REGION_LABELS[region] ?? region;
        const flagColor = HISTORICAL_FACTION_COLORS[f.id] || '#8a2020';
        const flagText = SANDBOX_DISPLAY_NAMES[f.id] || f.name.slice(0, 2);

        const custom = localCustomCompositions[f.id];

        // 🔴 [2026-09-15 治本·主人报「城堡时代白山黑水军团有两个」]
        //    编制**只有一个权威 = 军团自己那条记录**，这里一律按军团名**实时**解析。
        //
        //    改前是「势力快照的 slots 优先、文化区实时解析兜底」，等于同一个军团名有两条取数路：
        //      · 势力在势力表里有条目 → 读 localCustomCompositions[fid].slots
        //        （那是 toEditableLegion 在**页面加载时**解出来的快照）
        //      · 势力跟随文化区       → 读 getRegionLegionComposition(region)（每次重绘实时解）
        //    军团编制一改而快照没重建，这两条就给出不同的三排 —— 同一个军团名当场裂成两种编制，
        //    界面弹「军团编制冲突」。女真那次就是：3 家有条目的读到旧编制（古典骑射手），
        //    7 家跟文化区的读到新编制（库曼钦察弓骑）。
        //    现在两条路合并成一条，**快照再陈旧也影响不到三排**，物理上不可能裂。
        //    快照只剩它该管的事：这家势力挂哪支军团（legionName / legionType / navalFormation）。
        const effName = (custom as any)?.legionName?.trim() || getCultureLegionName(region);
        const liveComp = getLegionCompositionByName(effName) ?? getRegionLegionComposition(region);
        let formationMode: FormationMode = liveComp?.formationMode ?? 'square';
        let slots: CompositionSlot[] = liveComp?.slots ?? getDefaultSlotsForMode(formationMode);

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
            generalName: getFactionGeneral(f.id)?.generalName,
            generalId: getFactionGeneral(f.id)?.generalId,
            buildingStyle: capCity?.buildingStyle,
            eliteName: getExpeditionEliteConfig(f.id)?.name,
            eliteTier: getExpeditionEliteConfig(f.id)?.tier,
            // 🔴 [2026-09-06] 势力没有专属军团名时，回退显示**所属文化区的军团名**。
            //    原来只读 localCustomCompositions（= FACTION_COMPOSITIONS），而走文化军团的势力
            //    压根不在那张表里 —— 于是「军团名」列一律显示「—」，编好的哥特文化军团看着像没保存
            //    （主人 2026-09-06 报「军团总是保存不上」，实际编成早已写进 CultureFormations.ts）。
            //    ⚠️ 铁律：一个文化 = 一个军团 = 一种编制。表格里**不分两类显示**（曾加过灰/金两种样式，
            //    主人 2026-09-06 明确否决），军团名就是军团名，一个样子。
            legionName: (localCustomCompositions[f.id] as any)?.legionName || getCultureLegionName(region),
            formationMode,
            slots,
            legionPower: getLegionPower(slots)?.index ?? 0,
            row1Type: r1,
            row2Type: r2,
            row3Type: r3,
            commanderUnit: liveComp?.commanderUnit,
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
        if (sortCol === 'legionName') {
            const la = effectiveLegionName(a);
            const lb = effectiveLegionName(b);
            return sortAsc ? la.localeCompare(lb, 'zh-CN') : lb.localeCompare(la, 'zh-CN');
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
        if (q) {
            const shipAssetId = getCultureNavalShip(r.region, r.factionId, r.legionName);
            const shipName = getNavalShipChineseName(shipAssetId);
            const slotMatch = r.slots.some(s => {
                if (!s?.type) return false;
                const name = getUnitDisplayName(s.type).toLowerCase();
                return s.type.toLowerCase().includes(q) || name.includes(q);
            });
            // 🔴 [2026-10-19 主人报「军团编辑搜索，找不到英雄人名」] 主将队（英雄兵模）也要参与搜索：
            //    之前只搜势力/军团名/三排/舰队，搜「雅德维加」「张角」这种主将人名永远 0 结果。
            const commanderName = r.commanderUnit ? getUnitDisplayName(r.commanderUnit).toLowerCase() : '';
            const commanderMatch = !!r.commanderUnit
                && (commanderName.includes(q) || r.commanderUnit.toLowerCase().includes(q));
            const match = r.factionId.toLowerCase().includes(q)
                || r.factionName.toLowerCase().includes(q)
                || r.flagText.toLowerCase().includes(q)
                || (r.capitalCityName && r.capitalCityName.toLowerCase().includes(q))
                || (r.generalName && r.generalName.toLowerCase().includes(q))
                || (r.eliteName && r.eliteName.toLowerCase().includes(q))
                || effectiveLegionName(r).toLowerCase().includes(q)
                || slotMatch
                || commanderMatch
                || shipName.toLowerCase().includes(q)
                || shipAssetId.toLowerCase().includes(q);
            if (!match) return false;
        }
        return true;
    });

    sortRows();

    els.stats.innerHTML = `当前显示: <b>${filteredRows.length}</b>`;
}

/**
 * 🔴 军团编制唯一铁律（2026-09-09 主人重申）
 * 一个军团只能有一种编制，不然就报错！一种编制是指三排兵种排列一样。
 * 检查当前所有势力中，哪些军团名存在 2 种及以上编制签名。
 */
function getMultiCompositionLegionNames(): Set<string> {
    const nameSigs = new Map<string, Set<string>>();
    for (const r of allRows) {
        const n = effectiveLegionName(r);
        if (!n) continue;
        if (!nameSigs.has(n)) nameSigs.set(n, new Set());
        nameSigs.get(n)!.add(legionSig(r));
    }
    const conflicts = new Set<string>();
    // ② 同名不同编
    for (const [name, sigs] of nameSigs.entries()) {
        if (sigs.size > 1) conflicts.add(name);
    }
    return conflicts;
}

function renderTable(): void {
    if (filteredRows.length === 0) {
        els.tableWrap.innerHTML = `<div class="le-empty-hint">没有匹配的势力</div>`;
        return;
    }

    const sortArrow = (col: string) => sortCol === col ? (sortAsc ? ' <span style="color:#e0c888;">▲</span>' : ' <span style="color:#e0c888;">▼</span>') : '';
    const conflictLegions = getMultiCompositionLegionNames();

    const html = `
    <table class="le-table">
      <thead>
        <tr>
          <th data-col="flagText" style="width:50px;">旗号${sortArrow('flagText')}</th>
          <th data-col="generalName" style="color:#f5e6c8;background:#24201a;">武将 / 势力${sortArrow('generalName')}</th>
          <th data-col="capitalCityName">据点首都${sortArrow('capitalCityName')}</th>
          <th data-col="region" style="width:88px;">文化区${sortArrow('region')}</th>
          <th data-col="formationMode" style="width:100px;">阵型${sortArrow('formationMode')}</th>
          <th data-col="legionPower" style="width:64px;" title="军团战力：按格位人数加权平均的兵种战力，口径与单兵战力一致（中位兵=100）。不含相克与阵型战术收益">战力${sortArrow('legionPower')}</th>
          <th data-col="row1Type">前排${sortArrow('row1Type')}</th>
          <th data-col="row2Type">中坚${sortArrow('row2Type')}</th>
          <th data-col="row3Type">后排${sortArrow('row3Type')}</th>
          <th data-col="legionName">军团名${sortArrow('legionName')}</th>
        </tr>
      </thead>
      <tbody>
        ${filteredRows.map(r => {
          const rowLegionName = effectiveLegionName(r);
          const hasConflict = conflictLegions.has(rowLegionName);
          return `
          <tr data-fid="${r.factionId}" class="${r.factionId === selectedFactionId ? 'selected' : ''} ${hasConflict ? 'has-conflict' : ''}" style="${hasConflict ? 'background:rgba(120,20,20,0.18);' : ''}">
            <td><span class="cell-flag" style="background:${r.flagColor}">${r.flagText}</span></td>
            <td>
              <b style="font-size:13px;color:#f5e6c8;">${r.generalName || r.factionName}</b>
              ${r.generalName ? `<div style="font-size:10px;color:#9a9080;">${r.factionName}${r.eliteName ? ` · ${r.eliteName}` : ''}</div>` : ''}
            </td>
            <td>${r.capitalCityName}</td>
            <td><span style="color:#e0c888;font-size:11px;font-weight:bold;">${r.regionLabel}</span></td>
            <td><span class="cell-mode">${getFormationModeLabel(r.formationMode)}</span></td>
            <td>${(() => {
                const lp = getLegionPower(r.slots);
                if (!lp) return '<span style="color:#5a5348;">—</span>';
                const detail = lp.rows.map((x, i) => `${['前排', '中坚', '后排'][i] ?? '第' + (i + 1) + '排'} ${getUnitDisplayName(x.type)}×${x.count} = ${x.index ?? '?'}`).join('\n');
                const color = lp.index >= 200 ? '#e08a5a' : lp.index >= 100 ? '#e0c060' : '#8fae8f';
                return `<b style="color:${color};font-family:monospace;font-size:13px;" title="${detail}${lp.unknownCount ? '\n（有 ' + lp.unknownCount + ' 人查不到战力，未计入平均）' : ''}">${lp.index}</b>`;
            })()}</td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row1Type)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row2Type)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row3Type)}</span></td>
            <td>${r.legionName
                ? `<span style="color:${hasConflict ? '#ff8a80' : '#c9a86a'};font-size:11px;font-weight:${hasConflict ? 'bold' : 'normal'};">${r.legionName}</span>${hasConflict ? '<span style="background:#5a1e1e;color:#ff9e9e;padding:1px 5px;border-radius:3px;font-size:10px;margin-left:4px;border:1px solid #a03030;font-weight:bold;" title="❌ 编制冲突：一个军团只能有一种编制！同名必须同编制（三排兵种+阵型相同=同一种编制）。">⚠️ 冲突</span>' : ''}`
                : `<span style="color:#7a7266;font-size:11px;">—</span>`}</td>
          </tr>
        `;}).join('')}
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
        // 🔴 [2026-09-10 主人定] custom 省略 legionName = 跟随文化军团名，必须兜底，
        //    否则「保存军团编制」把军团名当成「势力名+军团」走错分支，只改一家不联动同名势力，
        //    → 同名不同编（主人报「城堡时代马扎尔军团：匈牙利 ↔ 匈雅提」）。
        // 🔴 [2026-09-15 治本] 编辑态的三排也**按军团名现查**，不再吃势力快照。
        //    `row` 是 buildRows 刚按军团记录实时解出来的，直接用它即可；
        //    读快照的话，快照一旧，编辑面板会显示旧编制，一按保存就把旧编制写回军团记录。
        currentEditingLegion = {
            legionName: custom.legionName || getCultureLegionName(row.region),
            legionType: custom.legionType || 'region',
            formationMode: row.formationMode,
            navalFormation: custom.navalFormation ?? 'auto',
            slots: row.slots.map(s => ({ ...s })),
            commanderUnit: row.commanderUnit,
        };
    } else {
        // 🔴 [2026-09-09 修复] 势力没有自定义编成时，它跟随**所属文化军团**，必须补齐
        //    军团名 + legionType='region'。原来这里只填阵型和兵种，currentEditingLegion.legionName
        //    为空 → 「保存军团编制」会把军团名当成「势力名+军团」，走错成特定军团分支：
        //    文化军团改不动、还额外在内存里多出一份同编制军团（主人报「点保存没用 / 出现两支」）。
        currentEditingLegion = {
            legionName: row.legionName || getCultureLegionName(row.region),
            legionType: 'region',
            formationMode: row.formationMode,
            navalFormation: 'auto',
            slots: row.slots.map(s => ({ ...s })),
            commanderUnit: row.commanderUnit,
        };
    }

    selectedLayerKey = '';
    selectedLayerTab = resolveCurrentLayer(row);

    renderTable();
    if (mainView === 'naval') renderNavalPanel(row);
    else if (mainView === 'strategic') renderStrategicPanel(row);
    else renderEditPanel(row);
}

/** 取某文化区的默认编成（与 buildRows 的兜底同源，勿另起一套） */
function getRegionDefaultLegion(region: RegionType): EditableLegion {
    const comp = getRegionLegionComposition(region);
    const formationMode: FormationMode = comp?.formationMode ?? 'square';
    const slots: CompositionSlot[] = comp?.slots ?? getDefaultSlotsForMode(formationMode);
    return { formationMode, slots: slots.map(s => ({ ...s })), commanderUnit: comp?.commanderUnit };
}

/** 取一级16母体文化军团专属默认编成（与二层时代军团彻底物理隔离） */
function getBase16RegionDefaultLegion(region: RegionType): EditableLegion {
    const base16 = getBase16FormationConfig(region);
    if (base16) {
        return { formationMode: base16.formationMode, slots: base16.slots.map(s => ({ ...s })), commanderUnit: base16.commanderUnit };
    }
    return getRegionDefaultLegion(region);
}

/**
 * 删除军团（2026-09-11 主人定「在第三级军团旁边添加删除功能」后扩展）。
 *
 * 三级自建军团可能挂在**两个层级**上，两边都要回落：
 *   ① **势力级**：`localCustomCompositions[factionId].legionName === 该名` → 删掉该势力条目，
 *      它恢复为所在文化的军团；
 *   ② **文化区级**：`CULTURE_LEGION_NAMES[region] === 该名` → 把该文化区**回落成 16 母体文化军团**
 *      （`getBase16LegionName` + 母体默认编成），走 `saveCultureComposition` 落盘。
 *
 * **唯一不可删的是「一级：16 母体文化军团」本身**（`isBase16CultureLegion`）——
 * 那是全游戏 16 个母体底座，删了没有东西可回落。
 * ⚠️ 旧版拦的是 `isRegionLegionName`（凡名字等于"某文化区默认军团名"就禁删），
 *    结果**三级里 128 个文化区级军团全被挡住、一个删除按钮都不显示**，正是主人报的那个问题。
 */
async function deleteSpecificLegion(legionName: string): Promise<void> {
    if (isBase16CultureLegion(legionName)) {
        showToast('❌ 一级：16 母体文化军团不可删除（可删的是二/三级军团）', true);
        return;
    }

    // ① 势力级制定条目
    const affected: string[] = [];
    const affectedIds: string[] = [];
    for (const row of allRows) {
        const custom = localCustomCompositions[row.factionId];
        if (custom?.legionName?.trim() === legionName) {
            delete localCustomCompositions[row.factionId];
            affected.push(row.factionName);
            affectedIds.push(row.factionId);
        }
    }

    // ② 文化区级：用这个名字的文化区 → 回落成各自的 16 母体文化军团
    const cultures = (REGION_ORDER as RegionType[]).filter(r => getCultureLegionName(r) === legionName);
    for (const r of cultures) {
        const base = getBase16RegionDefaultLegion(r);
        await saveCultureComposition(r, {
            legionName: getBase16LegionName(r),
            formationMode: base.formationMode,
            slots: base.slots.map(s => ({ ...s })),
        });
    }

    // 🔴 [2026-09-14 主人报障「这 12 支我都删除了」] ③ **删军团本身那条记录**。
    //    原来只解开①势力②文化区的挂靠，军团记录还留在三级表里 ——
    //    于是「删了还在」，无人套用的报错也永远消不掉；
    //    而且这 12 支本来就没人挂，原来会直接 return，等于什么都没干。
    try {
        const res = await fetch('/api/delete-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ legionName }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        dropLegionFromMemory(legionName);
    } catch (e: any) {
        showToast('❌ 删除失败：' + (e?.message || e), true);
        return;
    }

    localCustomCompositions = buildLocalCompositions();
    buildRows();
    applyFilter();
    renderTable();
    // 🔴 [2026-09-16 主人定 / 2026-10-16 主人「只套二级，跟一级没关系」] 势力级按规则重新套军团：
    //    看武将时代 + 据点建筑风格 → 套「该风格 × 该时代」那支二级军团；套不上就跟随文化区。
    //    详见 src/systems/LegionFallbackOnDelete.ts 的文件头。
    let toL2 = 0;
    const unplaced: string[] = [];
    for (const factionId of affectedIds) {
        const r = resolveFallbackForFaction(factionId);
        if ('newLegionName' in r) {
            await saveOneFactionLegion(factionId, r.newLegionName, 'sub');
            toL2++;
        } else {
            // 套不上（没武将 / 没据点 / 这一格二级还没有军团）→ 清空条目，跟随文化区
            await saveOneFactionLegion(factionId, null);
            unplaced.push(`${factionId}（${r.reason}）`);
        }
    }
    showToast(
        `🗑 已删除军团【${legionName}】`
        + (affectedIds.length
            ? `：${affectedIds.length} 个势力重新套军团（二级 ${toL2}${unplaced.length ? ` / 套不上 ${unplaced.length}` : ''}）`
            : '（此前无势力使用）')
        + (cultures.length ? `，${cultures.length} 个文化区回落母体军团` : ''),
    );
    if (unplaced.length) console.warn('[DeleteLegion] 这些势力套不上二级军团，已跟随文化区：', unplaced);
}

/** 编成摘要：「前排/中坚/后排（阵型）」——写进下拉选项，主人不用逐个试就能挑 */
function legionSummary(mode: FormationMode, slots: CompositionSlot[]): string {
    const r1 = slots[0]?.type || '';
    const r2 = (slots.length > 2 ? slots[1]?.type : slots[0]?.type) || '';
    const r3 = slots[slots.length - 1]?.type || '';
    const names = [r1, r2, r3].map(t => (t ? getUnitDisplayName(t) : '—')).join('/');
    return `${names}（${getFormationModeLabel(mode)}）`;
}

let selectedLayerTab: LegionLayer = 'culture';
let selectedLayerKey: string = '';
/** 第二步「选军团」卡片列表的搜索词（按军团名过滤） */
let legionSearchQuery = '';
/** 军团时代筛选（文化军团按四时代分开看） */
let legionEraFilter: 'all' | UnitAge = 'all';

/** 军团名前缀 → 时代。文化军团名本身就带时代（如「城堡时代阿兹特克军团」），名字即权威。 */
const LEGION_ERA_PREFIX: Record<string, UnitAge> = {
    '古典': 'antiquity', '封建': 'feudal', '城堡': 'castle', '帝国': 'imperial',
};

/** 一支军团的时代：**以军团名的时代前缀为准**（作者写死的意图）；
 *  没有前缀的（部分特定军团）才退回按编成里最晚那个兵种推定。 */
function getLegionEra(legionName: string, slots: Array<{ type: string }>): UnitAge {
    const l2Def = LEVEL_2_CIV_62_MAP.get(legionName);
    if (l2Def) return l2Def.age;
    const m = legionName.match(/^(古典|封建|城堡|帝国)/);
    if (m) return LEGION_ERA_PREFIX[m[1]];
    let idx = 0;
    for (const s of slots) {
        const u = DE_UNITS_MAP.get(s.type);
        if (!u) continue;
        const i = AGE_ORDER.indexOf(u.age);
        if (i > idx) idx = i;
    }
    return AGE_ORDER[idx];
}

interface LayerLegionOption {
    key: string;
    label: string;
    legionName: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    commanderUnit?: string;
    description: string;
    shipId?: string;
    shipName?: string;
}

/** 16 母体的代表 region（一级文化军团 = 16 母体各一支；按母体默认军团名识别，覆盖「蒙古/罗马/罗斯/马来/克丘亚/墨西加/曼丁哥」等文明名） */
export const BASE_16_REGIONS = [
    'CENTRAL', 'STEPPE', 'INDIA', 'GERMANIC', 'PURU',
    'ORIE', 'LATIN', 'SLAVIC', 'EAST', 'PERSIAN',
    'MALAY', 'GREEK', 'THRACIAN', 'ANDE', 'AMERICA', 'AFRICA',
] as const;

/** 🔴 [2026-09-10 主人定] 第一层文化军团名 = 16 母体地区名 + 军团（跨时代母体，不带时代前缀） */
export const BASE_16_LEGION_NAMES: Record<string, string> = {
    CENTRAL: '东亚军团', STEPPE: '中亚军团', INDIA: '印度军团', GERMANIC: '西欧军团',
    PURU: '普鲁军团', ORIE: '中东军团', LATIN: '地中海军团', SLAVIC: '东北欧军团',
    EAST: '东南欧军团', PERSIAN: '波斯军团', MALAY: '东南亚军团', GREEK: '希腊军团',
    THRACIAN: '色雷斯军团', ANDE: '安第斯军团', AMERICA: '中美军团', AFRICA: '非洲军团',
};

/** 取第一层文化军团名（16 母体地区名 + 军团）；未知母体兜底东亚军团 */
export function getBase16LegionName(region: RegionType | null | undefined): string {
    return (region && BASE_16_LEGION_NAMES[region]) || BASE_16_LEGION_NAMES.CENTRAL;
}

/** 判断军团名是否属于「一级：16 母体文化军团」（= 16 母体地区名 + 军团） */
export function isBase16CultureLegion(name: string): boolean {
    return Object.values(BASE_16_LEGION_NAMES).includes(name);
}

/** 地区军团名基（文化区默认军团名的「地区名」部分） */
const REGION_LEGION_BASE_SET = new Set<string>(
    Object.values(CULTURE_LEGION_NAMES).map(n => n.replace(/军团$/, '')),
);
const REGION_TAB_LABEL_SET = new Set<string>(Object.values(REGION_LABELS));

/** 名字是否属于「地区军团」（地区名 / 地区默认军团名，精确匹配） */
function isRegionLegionName(name: string): boolean {
    const base = (name || '').replace(/军团$/, '').trim();
    if (!base) return false;
    return REGION_LEGION_BASE_SET.has(base) || REGION_TAB_LABEL_SET.has(base);
}

/**
 * 🔴 [2026-09-14 主人报障「点保存后军团自动改名叫契丹军团，也没有时代了，再改就改不了」]
 *    军团名为空时的兜底**绝不能用 `势力名 + 军团`** —— 势力「契丹」会落成「契丹军团」，
 *    丢掉时代前缀，违反命名铁律（时代 + 民族 + 军团）；更要命的是这个名字匹配不上任何
 *    文化区，于是被当成**新建的三级自建军团**存了下去，原来的二级军团再也改不回来。
 *    实测已污染 6 个契丹系势力（后辽/契丹/辽/东丹/耶律/库莫奚），已一并改回。
 *    正确兜底 = 该势力所在文化区的军团名（「封建时代归义军团」）。
 */
function fallbackLegionNameOf(r: { region?: RegionType | null; factionName: string }): string {
    return getCultureLegionName(r.region as RegionType) || `${r.factionName}军团`;
}

/** 🔴 [2026-09-11 主人定] **三级军团分类**（2026-10-02 加四级剧本军团） */
export type LegionLayer = 'culture' | 'sub' | 'custom';

export { isCivEraLegion, LEVEL_2_CIV_62_LEGIONS, LEVEL_2_CIV_62_NAMES, LEVEL_2_CIV_62_MAP };
export type { Level2CivLegionDef };

/** 🔴 [2026-09-14 主人定] 三级军团分类：
 *  一级 culture：**16 母体文化军团**（`BASE_16_LEGION_NAMES`，与建筑风格一层 16 母体对齐）
 *  二级 sub    ：**文明 × 时代（62 文明专属军团）**（与建筑风格二层 62 文明专属城堡对齐）
 *  三级 custom ：**其余全部** —— 主人自建 / 延伸出来的军团（已彻底去重） */
function classifyLegionTab(name: string, _sharedCount: number): LegionLayer {
    if (isBase16CultureLegion(name)) return 'culture';
    return isCivEraLegion(name) ? 'sub' : 'custom';
}

/** 全部独立军团（=地区默认 + 所有自定义军团），按军团名聚合 */
interface DistinctLegionEntry {
    name: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    commanderUnit?: string;
    fids: string[];
    region?: RegionType;
    buildingStyle?: string;
}
function getAllDistinctLegions(): Map<string, DistinctLegionEntry> {
    const map = new Map<string, DistinctLegionEntry>();
    // 🔴 [2026-09-16 主人报障「【中东军团】编制不一致：达尔达尼亚、本都、弗里吉亚、吕底亚 ↔ 系统基准预设」]
    //    **一级 16 母体必须先登记**，顺序不能反。原来是「文化区默认」先跑、母体后跑且 `if (!map.has)`：
    //      · `getCultureLegionName('WEST_ASIA_ANTIQUITY')` 返回的就是母体名「中东军团」；
    //      · 但编制取的是 `getRegionLegionComposition('WEST_ASIA_ANTIQUITY')` = **null**
    //        （母体配置只在 ORIE 这个键上开，具体区经 toBase16 归属过去，本就不该有自己的编制）
    //        → 兜底成 `square` + 默认兵种，却顶着「中东军团」这个名字占了位；
    //      · 轮到母体那轮，`map.has('中东军团')` 已为真 → **真正的 ORIE 编制被跳过**。
    //    基准于是成了「square|一堆默认兵」，而势力实际生效的是真母体
    //    「balance_yoke|camel_heavy,shock_cavalry,cav_archer_heavy」，当场判定编制不一致。
    //    母体是编制的权威（只在 16 母体开键），所以它先写、文化区默认只补空位。
    // 1. 一级：16 母体文化军团（权威，先登记）
    for (const rg of BASE_16_REGIONS) {
        const name = getBase16LegionName(rg as RegionType);
        if (!map.has(name)) {
            const def = getBase16RegionDefaultLegion(rg as RegionType);
            map.set(name, { name, formationMode: def.formationMode, slots: def.slots.map(s => ({ ...s })), commanderUnit: def.commanderUnit, fids: [], region: rg as RegionType });
        }
    }
    // 1.5 文化区默认军团（二层时代文明军团）：只补母体没占的名字
    for (const rg of REGION_ORDER) {
        const def = getRegionDefaultLegion(rg);
        const name = getCultureLegionName(rg);
        if (!map.has(name)) {
            map.set(name, { name, formationMode: def.formationMode, slots: def.slots.map(s => ({ ...s })), commanderUnit: def.commanderUnit, fids: [], region: rg });
        }
    }
    // 1.6 二级：62 个文明专属军团（权威定义：62 文明 × 时代专属城堡）
    for (const l2 of LEVEL_2_CIV_62_LEGIONS) {
        if (!map.has(l2.name)) {
            map.set(l2.name, {
                name: l2.name,
                formationMode: l2.formationMode,
                slots: l2.slots.map(s => ({ ...s })),
                commanderUnit: l2.commanderUnit,
                fids: [],
                region: l2.region as RegionType,
                buildingStyle: l2.buildingStyle,
            });
        } else {
            // 若已有占位（例如来自文化默认），校准为 62 文明权威编制
            const existing = map.get(l2.name)!;
            existing.formationMode = l2.formationMode;
            existing.slots = l2.slots.map(s => ({ ...s }));
            if (l2.commanderUnit) existing.commanderUnit = l2.commanderUnit;
            if (!existing.region) existing.region = l2.region as RegionType;
            if (!existing.buildingStyle) existing.buildingStyle = l2.buildingStyle;
        }
    }
    /* 1.7 三级：自建 / 延伸军团 —— 🔴 [2026-09-18 主人报障「新建的军团不在第一页显示」「还是不显示呀」]
     *
     * 病根：本函数原先只登记 ① 16 母体 ② 文化区默认 ③ 62 文明 ④ **被势力用到的军团名**，
     *   三级表从来没有被整表登记过 —— 一支三级军团只有在「已经有势力在用」时才会从第 2 步溜进来。
     *   于是新建一支还没指派给任何势力的三级军团（如「城堡时代帖木儿军团」），
     *   数据明明已经写进 level3CustomLegions.ts、模块里也读得到，
     *   「选军团 → 三级：自建军团」里却搜不到它，主人以为没建成。
     *
     * 实测（scratch/_probe_l3_search.mjs，全新加载的页面）：
     *   模块 LEVEL_3_LEGIONS 124 支、含「城堡时代帖木儿军团」；而选军团区搜它 → 「无匹配军团」。
     *
     * 解法：与 1.6 二级同样整表登记，fids 留空（还没势力用），编制只认军团自己那条记录。
     * ⚠️ 仍然是 `if (!map.has(name))` —— 上面几步已登记的名字不覆盖，不给同一个军团名立第二份权威。 */
    for (const l3 of LEVEL_3_LEGIONS) {
        if (!map.has(l3.name)) {
            map.set(l3.name, {
                name: l3.name,
                formationMode: l3.formationMode,
                slots: l3.slots.map(s => ({ ...s })),
                commanderUnit: l3.commanderUnit,
                fids: [],
                region: l3.regions?.[0] as RegionType | undefined,
                buildingStyle: l3.buildingStyle,
            });
        }
    }
    // 2. 所有势力（含隐式默认），按 effectiveLegionName 归入对应军团。
    //    隐式势力（无显式 legionName）的军团 = 文化区默认名，必须算进文化军团的 fids，
    //    否则「文化军团」页签会误显示 0 势力（2026-08-30 主人：65 个文化军团每个都该有势力）。
    // 🔴 [2026-09-15 治本] 这一步**只挂势力，不碰编制**。
    //    编制在上面 1 / 1.5 / 1.6 三步里已经按军团自己那条记录填好了；
    //    这里再拿势力快照 custom.slots 去覆盖，就是给同一个军团名立第二份权威 ——
    //    快照一旦陈旧，同名军团当场裂成两种编制（女真那次就是这么来的）。
    //    名字还没登记过的（三级自建军团）按军团名现查一次，仍然只认军团记录。
    for (const row of allRows) {
        const name = effectiveLegionName(row);
        if (!name) continue;
        let entry = map.get(name);
        if (!entry) {
            const live = getLegionCompositionByName(name);
            entry = {
                name,
                formationMode: live?.formationMode ?? 'square',
                slots: (live?.slots ?? []).map(s => ({ ...s })),
                commanderUnit: live?.commanderUnit,
                fids: [],
            };
            map.set(name, entry);
        }
        entry.fids.push(row.factionId);
        // 🔴 [2026-09-15 治本] 这里原有一条「势力表副本优先于二级硬表」的分支，已整条删除。
        //    它 2026-09-14 加进来的前提是「二级 62 表没有任何保存接口能写它」——
        //    这个前提**现在是假的**：vite.config 的 serverSaveLegionComposition 会依次尝试
        //    level2Civ62Legions.ts / level3CustomLegions.ts 并直接写盘（已核对源码）。
        //    前提没了，这条分支就只剩害处：它让「势力表里的编制副本」压过军团自己那条记录，
        //    等于给同一个军团名立了第二份权威 —— 正是 [势力表不许存文化军团副本] 那条铁律
        //    禁的东西，副本必漂移。女真裂成两种编制就是它放行的。
    }
    /* 🔴 [2026-09-18 主人报障「势力军团编排 / 军团编辑 这两个怎么不同步呀」]
     *
     * 病根：上面 1 / 1.5 / 1.6 / 1.7 四步是**直接从静态表读 slots**（BASE_16 / LEVEL_2 / LEVEL_3），
     *   而「军团编辑」页走的是 `getLegionCompositionByName()` —— 它第一顺位读
     *   `LEGION_RUNTIME_PATCH`（编辑器保存编制后立刻写进去，不等 HMR）。
     *   于是在「军团编辑」里改完编制保存：那一页当场变了，切回「势力军团编排」还是旧编制，
     *   要等 Vite HMR 把数据文件重新导入才对得上 —— 两页看起来就是不同步。
     *
     * 解法：出口处统一以 `getLegionCompositionByName()` 为准覆盖一遍编制。
     *   它本身就是三层表的唯一查询口（补丁 → 一级 → 二级 → 三级），两页从此同一个数据源。
     *   查不到的（还没登记的名字）保留静态值不动，不额外造兜底。
     */
    for (const entry of map.values()) {
        const live = getLegionCompositionByName(entry.name);
        if (!live) continue;
        entry.formationMode = live.formationMode;
        entry.slots = live.slots.map(s => ({ ...s }));
        entry.commanderUnit = live.commanderUnit;
    }
    return map;
}

/** 取三层军团的全部可选军团
 *  一级 culture：16 母体文化军团
 *  二级 sub    ：文明 × 时代（62 DE 文明 × 4 时代）
 *  三级 custom ：其余全部（主人自建 / 延伸军团） */
function getLayerLegionOptions(layer: LegionLayer, currentFactionId: string): LayerLegionOption[] {
    const all = getAllDistinctLegions();
    const options: LayerLegionOption[] = [];

    // 🔴 [2026-09-10 主人定] 一级：文化军团（严格只收 16 母体文化军团，名字 = 地区名 + 军团，跨时代母体不带时代）
    if (layer === 'culture') {
        for (const rg of BASE_16_REGIONS) {
            const name = getBase16LegionName(rg as RegionType);
            const cultName = name.replace(/军团$/, '');
            const def = getBase16RegionDefaultLegion(rg as RegionType);
            const shipId = getCultureNavalShip(rg as RegionType, null, name);
            const shipName = getNavalShipChineseName(shipId);
            const fidsCount = all.get(name)?.fids.length ?? 0;
            options.push({
                key: `culture:${name}`,
                label: `🏛️ ${name} (${cultName})`,
                legionName: name,
                formationMode: def.formationMode,
                slots: def.slots.map(s => ({ ...s })),
                commanderUnit: def.commanderUnit,
                description: `${cultName} · ${fidsCount ? `${fidsCount} 势力使用` : '文化默认'} · ${legionSummary(def.formationMode, def.slots)}`,
                shipId,
                shipName,
            });
        }
        return options.sort((a, b) => a.legionName.localeCompare(b.legionName, 'zh-Hans-CN'));
    }

    // 🔴 [2026-09-10 主人定] 二级/三级军团
    for (const entry of all.values()) {
        const tab = classifyLegionTab(entry.name, entry.fids.length);
        if (tab !== layer) continue;

        const fid = entry.fids[0];
        const row = fid ? allRows.find(r => r.factionId === fid) : undefined;
        const regLabel = row?.regionLabel || (entry.region ? (REGION_LABELS[entry.region] || entry.region) : '');
        const countText = entry.fids.length ? `${entry.fids.length} 势力` : (layer === 'sub' ? '文明默认' : '文化默认');
        const l2Def = LEVEL_2_CIV_62_MAP.get(entry.name);
        const icon = layer === 'sub' ? '🏰' : '⭐';
        const label = `${icon} ${entry.name} (${regLabel ? `${regLabel} · ` : ''}${countText})`;
        const castlePrefix = l2Def ? `🏰 ${l2Def.castleName} · ` : '';
        const description = `${castlePrefix}${regLabel ? `${regLabel} · ` : ''}${entry.fids.length ? `${entry.fids.length} 势力使用` : (layer === 'sub' ? '文明默认' : '文化默认')} · ${legionSummary(entry.formationMode, entry.slots)}`;
        const shipId = getCultureNavalShip(row?.region ?? entry.region ?? null, fid ?? null, entry.name);
        const shipName = getNavalShipChineseName(shipId);

        options.push({
            key: `${layer}:${entry.name}`,
            label,
            legionName: entry.name,
            formationMode: entry.formationMode,
            slots: entry.slots.map(s => ({ ...s })),
            commanderUnit: entry.commanderUnit,
            description,
            shipId,
            shipName,
        });
    }

    return options.sort((a, b) => a.legionName.localeCompare(b.legionName, 'zh-Hans-CN'));
}


/** 层全名（信息卡 / 步骤标题用） */
const LAYER_FULL_LABEL: Record<LegionLayer, string> = {
    culture: '一级：文化军团（16 母体）',
    sub: '二级：文明 × 时代（62 文明）',
    custom: '三级：自定义军团',
};

/** 当前军团属于哪一类：一级16母体 / 二级文明×时代 / 三级自建 */
function resolveCurrentLayer(row: FactionLegionRow): LegionLayer {
    const name = currentEditingLegion?.legionName?.trim() || effectiveLegionName(row);
    if (name) {
        return classifyLegionTab(name, 0);
    }
    const lt = currentEditingLegion?.legionType;
    if (lt === 'sub') return 'sub';
    return classifyLegionTab(getBase16LegionName(row.region), 0);
}
/** 编制铁律：前/中/后三排兵种 + 阵型 + 英雄主队；缩放不产生新编制，人数由阵型确定。 */
function legionSig(v: { formationMode: string; slots: { type: string; count: number }[]; commanderUnit?: string }): string {
    return v.formationMode + '|' + v.slots.map(s => s.type).join(',') + '|' + (v.commanderUnit || '');
}

/** 军团卡是否处于「当前生效」态：显式选中 > 与当前编辑配置同编成同名 */
function isOptionActive(opt: LayerLegionOption, current: EditableLegion | null): boolean {
    if (selectedLayerKey) return selectedLayerKey === opt.key;
    if (!current) return false;
    if ((current.legionName ?? '').trim() !== opt.legionName) return false;
    if (current.formationMode !== opt.formationMode) return false;
    return legionSig(current) === legionSig(opt);
}

/** 🚢 海军编排面板：独立栏目，与陆军阵型各管各的（主人定：不许混在陆军面板里） */
function renderNavalPanel(row: FactionLegionRow): void {
    if (!currentEditingLegion) return;
    if (stratAnimTimer !== null) {
        cancelAnimationFrame(stratAnimTimer);
        stratAnimTimer = null;
    }
    els.panel.classList.remove('is-strategic');
    const cur: NavalFormationMode = currentEditingLegion.navalFormation ?? 'auto';
    const desc: Record<NavalFormationMode, string> = {
        auto: '鱼贯而行 · 战列线（默认，等同单纵队）',
        column: '鱼贯而行 · 内河海峡最窄不蹭岸',
        double: '纵深减半 · 正面加宽一个船身',
        line: '横向排开 · 舷侧齐射面最大',
        wedge: '旗舰居前 · 后随向两翼斜后展开',
    };
    const shipAssetId = getCultureNavalShip(row.region, row.factionId);
    const shipName = getNavalShipChineseName(shipAssetId);
    const shipWeapons = getNavalWeapons(shipAssetId, row.factionId);
    const weaponLabel: Record<string, string> = {
        cannon: '火炮', greekfire: '希腊火', trebuchet: '抛石', arrow: '弓弩', ram: '撞角',
    };
    const weaponsStr = shipWeapons.map(w => weaponLabel[w] || w).join(' + ');
    const shipWhy = listCultureNavalShips().find(c => c.ship === shipAssetId)?.why ?? '史实战舰配置';

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
        <span>套用战舰</span>
        <span style="font-size:11px;color:#8ab4c4;font-weight:normal;">出处 NavalShipTiers</span>
      </div>
      <div style="background:#141210;border:1px solid #2a2620;border-radius:6px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:15px;font-weight:bold;color:#7ec0ee;">🚢 ${shipName} <span style="font-size:11px;color:#8a8070;font-weight:normal;font-family:monospace;">(${shipAssetId})</span></div>
          <div style="font-size:11px;color:#a89f8f;margin-top:4px;">舰载武器：<b style="color:#e0c060;">${weaponsStr}</b></div>
          <div style="font-size:11px;color:#7a7266;margin-top:2px;">考据依据：${shipWhy}</div>
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
            legionType: currentEditingLegion.legionType,
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

// ============================================================
// 5.5 战略地图军团鉴赏 (Strategic Map Legion Appreciation)
// ============================================================

function isChariotUnit(unitId: string): boolean {
    const sub = getUnitSubcategory(unitId);
    return sub === 'chariot' || unitId.includes('chariot') || unitId.includes('wagon') || unitId.includes('ratha');
}

function isElephantUnit(unitId: string): boolean {
    const sub = getUnitSubcategory(unitId);
    return sub === 'elephant' || unitId.includes('elephant');
}

function getFormation9Layout(mode: FormationMode): readonly { r: number; c: number; rowIdx: number }[] {
    switch (mode) {
        case 'triangle': // 2 + 3 + 4
            return [
                { r: 0, c: -0.5, rowIdx: 0 }, { r: 0, c: 0.5, rowIdx: 0 },
                { r: 1, c: -1.0, rowIdx: 1 }, { r: 1, c: 0, rowIdx: 1 }, { r: 1, c: 1.0, rowIdx: 1 },
                { r: 2, c: -1.5, rowIdx: 2 }, { r: 2, c: -0.5, rowIdx: 2 }, { r: 2, c: 0.5, rowIdx: 2 }, { r: 2, c: 1.5, rowIdx: 2 },
            ];
        case 'echelon': // 4 + 3 + 2
            return [
                { r: 0, c: -1.5, rowIdx: 0 }, { r: 0, c: -0.5, rowIdx: 0 }, { r: 0, c: 0.5, rowIdx: 0 }, { r: 0, c: 1.5, rowIdx: 0 },
                { r: 1, c: -1.0, rowIdx: 1 }, { r: 1, c: 0, rowIdx: 1 }, { r: 1, c: 1.0, rowIdx: 1 },
                { r: 2, c: -0.5, rowIdx: 2 }, { r: 2, c: 0.5, rowIdx: 2 },
            ];
        case 'fish_scale': // 3 + 4 + 2
            return [
                { r: 0, c: -1.0, rowIdx: 0 }, { r: 0, c: 0, rowIdx: 0 }, { r: 0, c: 1.0, rowIdx: 0 },
                { r: 1, c: -1.5, rowIdx: 1 }, { r: 1, c: -0.5, rowIdx: 1 }, { r: 1, c: 0.5, rowIdx: 1 }, { r: 1, c: 1.5, rowIdx: 1 },
                { r: 2, c: -1.0, rowIdx: 2 }, { r: 2, c: 1.0, rowIdx: 2 },
            ];
        case 'crane_wing': // 2 + 4 + 3
            return [
                { r: 0, c: -1.0, rowIdx: 0 }, { r: 0, c: 1.0, rowIdx: 0 },
                { r: 1, c: -1.5, rowIdx: 1 }, { r: 1, c: -0.5, rowIdx: 1 }, { r: 1, c: 0.5, rowIdx: 1 }, { r: 1, c: 1.5, rowIdx: 1 },
                { r: 2, c: -1.0, rowIdx: 2 }, { r: 2, c: 0, rowIdx: 2 }, { r: 2, c: 1.0, rowIdx: 2 },
            ];
        case 'crescent': // 3 + 2 + 4
            return [
                { r: 0, c: -1.0, rowIdx: 0 }, { r: 0, c: 0, rowIdx: 0 }, { r: 0, c: 1.0, rowIdx: 0 },
                { r: 1, c: -0.5, rowIdx: 1 }, { r: 1, c: 0.5, rowIdx: 1 },
                { r: 2, c: -1.5, rowIdx: 2 }, { r: 2, c: -0.5, rowIdx: 2 }, { r: 2, c: 0.5, rowIdx: 2 }, { r: 2, c: 1.5, rowIdx: 2 },
            ];
        case 'balance_yoke': // 4 + 2 + 3
            return [
                { r: 0, c: -1.5, rowIdx: 0 }, { r: 0, c: -0.5, rowIdx: 0 }, { r: 0, c: 0.5, rowIdx: 0 }, { r: 0, c: 1.5, rowIdx: 0 },
                { r: 1, c: -0.5, rowIdx: 1 }, { r: 1, c: 0.5, rowIdx: 1 },
                { r: 2, c: -1.0, rowIdx: 2 }, { r: 2, c: 0, rowIdx: 2 }, { r: 2, c: 1.0, rowIdx: 2 },
            ];
        case 'square': // 3 + 3 + 3
        default:
            return [
                { r: 0, c: -1.0, rowIdx: 0 }, { r: 0, c: 0, rowIdx: 0 }, { r: 0, c: 1.0, rowIdx: 0 },
                { r: 1, c: -1.0, rowIdx: 1 }, { r: 1, c: 0, rowIdx: 1 }, { r: 1, c: 1.0, rowIdx: 1 },
                { r: 2, c: -1.0, rowIdx: 2 }, { r: 2, c: 0, rowIdx: 2 }, { r: 2, c: 1.0, rowIdx: 2 },
            ];
    }
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(18, 28, 16, 0.75)';
    ctx.fill();
    ctx.strokeStyle = '#3a5036';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#a0b898';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -13);
    ctx.fillText('S', 0, 13);
    ctx.fillText('E', 13, 0);
    ctx.fillText('W', -13, 0);

    const angle = (dir + 1) * Math.PI / 4;
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(3.5, 4);
    ctx.lineTo(0, 1.5);
    ctx.lineTo(-3.5, 4);
    ctx.closePath();
    ctx.fillStyle = '#e0c060';
    ctx.fill();
    ctx.restore();
}

function drawLegionFlag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, text: string, frame: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#8a7040';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, -22);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, -23, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const wave = Math.sin(frame * 0.08) * 3;
    ctx.fillStyle = color || '#a02020';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(24, -20 + wave);
    ctx.lineTo(20, -6 + wave);
    ctx.lineTo(0, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f5e6c8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text || '军', 10, -14 + wave * 0.5);
    ctx.restore();
}

function drawLegionHUD(ctx: CanvasRenderingContext2D, cx: number, cy: number, flagChar: string, legionName: string): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = `${flagChar ? `[${flagChar}] ` : ''}${legionName}`;
    ctx.font = 'bold 13px "Noto Serif SC", serif';
    const tw = ctx.measureText(text).width;
    const pw = Math.max(130, tw + 24);
    const ph = 26;

    ctx.fillStyle = 'rgba(18, 16, 14, 0.85)';
    ctx.strokeStyle = '#4a3c28';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f5e6c8';
    ctx.fillText(text, cx, cy - 2);

    const barW = pw - 16;
    const barH = 3;
    const barY = cy + 8;
    ctx.fillStyle = '#2a1a14';
    ctx.fillRect(cx - barW / 2, barY, barW, barH);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(cx - barW / 2, barY, barW, barH);
    ctx.restore();
}

function renderStrategicDiagnostics(
    mode: FormationMode,
    slots: CompositionSlot[],
    activeChariotScale: number,
): string {
    const chariotSlot = slots.find(s => isChariotUnit(s.type));
    if (chariotSlot) {
        if (activeChariotScale >= 0.9) {
            return `
            <div class="le-overlap-alert">
              ⚠️ <b>【换排警报 · 战车 1.00x 原大】后排战车车头侵入中坚排（越界 9px · 换排混杂）！</b><br>
              🔴 <b>铁律准则：同排密集左右重叠没事，关键是绝不跨排侵入、三排兵必须清晰分明！</b><br>
              实测物理数据：战略地图标准排距常数为 <b>63px</b>，而先秦远程战车 1.00x 原大时车体纵深长达 144px，车头与战马向前冲出 <b>72px</b>。<br>
              换排实测后果：后排战车车头<b>直接跨过中坚排基准线向前侵占 9px</b>，车头战马直接扎进中坚排步兵身位中！前后排兵模互相践踏穿插，导致<b>视觉上“后排跑到中排”，发生严重换排，三排次序彻底混淆</b>！
            </div>
            `;
        } else {
            return `
            <div class="le-overlap-ok">
              ✅ <b>【三排清晰 · 战车 0.57x 规整】纵深保持 22px 明确净空缓冲，绝不换排！</b><br>
              🔴 <b>铁律准则：同排重叠没事，关键是不要换排，三排兵要清晰！</b><br>
              实测物理数据：战车适配 0.57x 后，纵深绘制尺寸收至 82px，车头前伸仅 41px。<br>
              三排清晰呈现：后排战车车头与中坚排基准线保持 <b>22px 纵深安全缓冲净空</b>，战车规规矩矩待在后排，<b>前排、中坚、后排三排阵线层次分明、各安其位、绝对不换排、三排兵种清清楚楚！</b>
            </div>
            `;
        }
    }
    return `
    <div class="le-overlap-ok">
      ✅ <b>【三排清晰 · 阵型合格】</b>：同排兵种密集重叠属于正常方阵；前中后三排排距充足（纵深 63px），各排留有安全缓冲，<b>三排兵种独立清晰、绝不换排</b>。
    </div>
    `;
}

/**
 * 🔴 [2026-10-09 主人令「所有战略，战术，所有兵模显示的比例都应该一致」]
 * 编成 slot 的**生效比例**：显式 `scale` 优先，否则取兵种默认值
 * （战车类的阵型适配比例 —— 见 `types/LegionComposition.getDefaultScaleForUnitType`）。
 *
 * 之前编辑器各处一律 `slot.scale ?? 1.0`，而游戏用的是兵种默认值 → 同一支军团
 * 编辑器画原大、游戏里被压过（高丽战车 1.0 vs 0.53），预览与真机对不上。
 * 这里返回**副本**（不写回编成数据，存盘仍按原样），供各处预览/诊断统一取用。
 */
function withEffectiveScales(slots: CompositionSlot[]): CompositionSlot[] {
    return slots.map((s) => (s.scale === undefined ? { ...s, scale: getDefaultScaleForUnitType(s.type) } : s));
}

function renderStrategicPanel(row: FactionLegionRow): void {
    if (!currentEditingLegion) return;
    if (animTimer !== null) {
        cancelAnimationFrame(animTimer);
        animTimer = null;
    }
    els.panel.classList.add('is-strategic');
    const mode = currentEditingLegion.formationMode;
    const slots = withEffectiveScales(currentEditingLegion.slots);
    const currentLegionName = currentEditingLegion.legionName?.trim()
        || (row.legionName || getCultureLegionName(row.region));
    const power = getLegionPower(slots);

    const chariotSlot = slots.find(s => isChariotUnit(s.type));
    const hasChariot = !!chariotSlot;
    const activeChariotScale = (stratChariotOverrideScale !== null)
        ? stratChariotOverrideScale
        : (chariotSlot?.scale ?? getDefaultScaleForUnitType(chariotSlot?.type ?? ''));

    const modeLabels: Record<FormationMode, string> = {
        square: '3+3+3 方阵（九宫等边·攻守均衡）',
        echelon: '4+3+2 雁行阵（前排4档·重装推进）',
        fish_scale: '3+4+2 鱼鳞阵（中坚4档·重拳突破）',
        crane_wing: '2+4+3 鹤翼阵（中坚4档·合围包抄）',
        triangle: '2+3+4 锥形阵（后排4档·后劲冲锋）',
        crescent: '3+2+4 偃月阵（后排4档·后发制人）',
        balance_yoke: '4+2+3 衡轭阵（前排4档·前线硬碰）',
    };

    els.panelContent.innerHTML = `
    <!-- 军团名片头 -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:#181614;border:1px solid #2a2620;border-radius:6px;padding:12px 14px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="cell-flag" style="background:${row.flagColor};width:36px;height:36px;line-height:36px;font-size:18px;">${row.flagText}</span>
        <div>
          <div style="font-size:17px;font-weight:bold;color:#f5e6c8;display:flex;align-items:center;gap:8px;">
            <span>${currentLegionName}</span>
            <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:#3a2c10;color:#f5d78e;border:1px solid #7a6224;">战力: ${power}</span>
          </div>
          <div style="font-size:11px;color:#a89f8f;margin-top:3px;">
            据点：${row.capitalCityName || '无'} | 势力：${row.factionName} | 文化区：${row.regionLabel} | 守将：<span style="color:#d8b888;">${row.generalName || '无'}</span>
          </div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;font-weight:bold;color:#e0c888;">${modeLabels[mode] || mode}</div>
        <div style="font-size:10px;color:#8ab4c4;margin-top:2px;">战略地图真机参数：间距 46×63 · 身高 68px</div>
      </div>
    </div>

    <!-- 战略地图可视化舞台 -->
    <div class="le-strat-stage">
      <div class="le-strat-toolbar">
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-size:12px;color:#a89f8f;">动作:</span>
          <button type="button" class="le-btn le-btn-sm ${stratAction === 'idle' ? 'le-btn-primary' : ''}" id="le-strat-act-idle">待机</button>
          <button type="button" class="le-btn le-btn-sm ${stratAction === 'move' ? 'le-btn-primary' : ''}" id="le-strat-act-move">行军</button>
          <button type="button" class="le-btn le-btn-sm ${stratAction === 'attack' ? 'le-btn-primary' : ''}" id="le-strat-act-attack">攻击</button>
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-left:8px;">
          <span style="font-size:12px;color:#a89f8f;">朝向:</span>
          <select id="le-strat-dir" class="le-select" style="padding:2px 6px;font-size:12px;">
            <option value="3" ${stratDir === 3 ? 'selected' : ''}>南 (3)</option>
            <option value="2" ${stratDir === 2 ? 'selected' : ''}>东南 (2 - 默认)</option>
            <option value="1" ${stratDir === 1 ? 'selected' : ''}>东 (1)</option>
            <option value="0" ${stratDir === 0 ? 'selected' : ''}>东北 (0)</option>
            <option value="7" ${stratDir === 7 ? 'selected' : ''}>北 (7)</option>
            <option value="6" ${stratDir === 6 ? 'selected' : ''}>西北 (6)</option>
            <option value="5" ${stratDir === 5 ? 'selected' : ''}>西 (5)</option>
            <option value="4" ${stratDir === 4 ? 'selected' : ''}>西南 (4)</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-left:8px;">
          <span style="font-size:12px;color:#a89f8f;">缩放:</span>
          <select id="le-strat-zoom" class="le-select" style="padding:2px 6px;font-size:12px;">
            <option value="0.7" ${stratZoom === 0.7 ? 'selected' : ''}>0.70x (Zoom 9 大地图实测)</option>
            <option value="1.0" ${stratZoom === 1.0 ? 'selected' : ''}>1.00x (100% 原始基准尺寸)</option>
            <option value="1.25" ${stratZoom === 1.25 ? 'selected' : ''}>1.25x (特写放大)</option>
          </select>
        </div>
        <label style="font-size:12px;color:#a89f8f;display:flex;align-items:center;gap:4px;margin-left:auto;cursor:pointer;">
          <input type="checkbox" id="le-strat-show-collision" ${stratShowCollision ? 'checked' : ''} /> 📐 三排排线与换排监测
        </label>
      </div>

      ${hasChariot ? `
      <!-- 战车专属对比切换栏（核心防换排检测工具） -->
      <div style="display:flex;align-items:center;gap:10px;background:#261d15;border:1px solid #704820;border-radius:5px;padding:8px 12px;">
        <span style="font-size:12px;font-weight:bold;color:#f3d7aa;">战车换排检测对比:</span>
        <button type="button" class="le-btn le-btn-sm ${activeChariotScale === 1.0 ? 'le-btn-primary' : ''}" id="le-strat-chariot-10">战车 1.0 (原大 · 测换排)</button>
        <button type="button" class="le-btn le-btn-sm ${activeChariotScale === 0.57 ? 'le-btn-primary' : ''}" id="le-strat-chariot-057">战车 0.57 (规整 · 三排清晰)</button>
        <span style="font-size:11px;color:#d8b888;margin-left:auto;">当前测试缩放: <b>${activeChariotScale}x</b></span>
      </div>
      ` : ''}

      <div class="le-strat-canvas-wrap">
        <canvas id="le-strategic-canvas" width="720" height="380" class="le-strat-canvas"></canvas>
      </div>
    </div>

    <!-- 阵型物理排布诊断与换排提示 -->
    ${renderStrategicDiagnostics(mode, slots, activeChariotScale)}

    <!-- 战略地图三排实测参数表（防换排监控） -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>战略地图三排兵种实测参数（防换排监控）</span>
        <span style="font-size:11px;color:#8ab4c4;font-weight:normal;">排距常数：纵向 63px · 横向 46px · 基准身高 68px</span>
      </div>
      <table class="le-table" style="font-size:11px;">
        <thead>
          <tr>
            <th>排位</th>
            <th>兵种</th>
            <th>格数</th>
            <th>缩放 (Scale)</th>
            <th>实测绘制宽×高</th>
            <th>纵向前伸 (Reach)</th>
            <th>排前安全净距 (Clearance)</th>
            <th>三排清晰度判定</th>
          </tr>
        </thead>
        <tbody>
          ${slots.map((s, idx) => {
            const rowNames = ['前排', '中坚', '后排'];
            const u = DE_UNITS_MAP.get(s.type);
            const isC = isChariotUnit(s.type);
            const effectiveScale = (isC && stratChariotOverrideScale !== null) ? stratChariotOverrideScale : (s.scale ?? getDefaultScaleForUnitType(s.type));
            const approxW = Math.round((isC ? 152 : 64) * effectiveScale * (SPRITE_BASE_H / 64));
            const approxH = Math.round((isC ? 136 : 64) * effectiveScale * (SPRITE_BASE_H / 64));
            const reach = Math.round((isC ? 68 : 32) * effectiveScale * (SPRITE_BASE_H / 64));
            const clearanceVal = 63 - reach;
            const clearance = idx === 0 ? '—— (前锋顶线)' : `${clearanceVal > 0 ? '+' : ''}${clearanceVal} px`;
            const isInvaded = idx > 0 && clearanceVal < 0;
            return `
            <tr>
              <td style="color:#e0c888;font-weight:bold;">${rowNames[idx]}</td>
              <td>${getUnitDisplayName(s.type)} <span style="color:#6a6258;">(${s.type})</span></td>
              <td><b>${s.count}</b></td>
              <td><span class="tier-tag ${effectiveScale !== 1.0 ? 'tier-elite' : 'tier-base'}">${effectiveScale}x</span></td>
              <td style="font-family:monospace;">${approxW} × ${approxH} px</td>
              <td style="font-family:monospace;">${reach} px</td>
              <td style="font-family:monospace;font-weight:bold;color:${isInvaded ? '#ff7777' : (idx === 0 ? '#aaa' : '#77ff88')};">${clearance}</td>
              <td>${isInvaded ? '<span style="color:#ff7777;font-weight:bold;">⚠️ 侵入前排 (换排混杂)</span>' : '<span style="color:#77ff88;">✅ 层次清晰 (绝不换排)</span>'}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    `;

    bindStrategicEvents(row);
    startStrategicCanvas(row);
}

function bindStrategicEvents(row: FactionLegionRow): void {
    document.getElementById('le-strat-act-idle')?.addEventListener('click', () => {
        stratAction = 'idle';
        renderStrategicPanel(row);
    });
    document.getElementById('le-strat-act-move')?.addEventListener('click', () => {
        stratAction = 'move';
        renderStrategicPanel(row);
    });
    document.getElementById('le-strat-act-attack')?.addEventListener('click', () => {
        stratAction = 'attack';
        renderStrategicPanel(row);
    });
    document.getElementById('le-strat-dir')?.addEventListener('change', (e) => {
        stratDir = parseInt((e.target as HTMLSelectElement).value, 10);
        startStrategicCanvas(row);
    });
    document.getElementById('le-strat-zoom')?.addEventListener('change', (e) => {
        stratZoom = parseFloat((e.target as HTMLSelectElement).value);
        startStrategicCanvas(row);
    });
    document.getElementById('le-strat-show-collision')?.addEventListener('change', (e) => {
        stratShowCollision = (e.target as HTMLInputElement).checked;
        startStrategicCanvas(row);
    });
    document.getElementById('le-strat-chariot-10')?.addEventListener('click', () => {
        stratChariotOverrideScale = 1.0;
        renderStrategicPanel(row);
    });
    document.getElementById('le-strat-chariot-057')?.addEventListener('click', () => {
        stratChariotOverrideScale = 0.57;
        renderStrategicPanel(row);
    });
}

function startStrategicCanvas(row: FactionLegionRow): void {
    if (stratAnimTimer !== null) {
        cancelAnimationFrame(stratAnimTimer);
        stratAnimTimer = null;
    }

    const canvas = document.getElementById('le-strategic-canvas') as HTMLCanvasElement;
    if (!canvas || !currentEditingLegion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mode = currentEditingLegion.formationMode;
    const slots = withEffectiveScales(currentEditingLegion.slots);
    const layout = getFormation9Layout(mode);

    const spacingX = STRATEGIC_SPACING_X * stratZoom;
    const spacingY = STRATEGIC_SPACING_Y * stratZoom;
    const fAngle = (stratDir + 1) * Math.PI / 4;
    const cos = Math.cos(fAngle);
    const sin = Math.sin(fAngle);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 15;

    const unitPositions: Array<{
        x: number;
        y: number;
        type: string;
        scale: number;
        rowIdx: number;
        slotIdx: number;
        c: number;
        r: number;
    }> = [];

    layout.forEach((pos, idx) => {
        const rowSlot = slots[pos.rowIdx];
        if (!rowSlot) return;
        const uType = rowSlot.type;
        const isC = isChariotUnit(uType);
        const slotScale = (isC && stratChariotOverrideScale !== null)
            ? stratChariotOverrideScale
            : (rowSlot.scale ?? getDefaultScaleForUnitType(uType));

        const originalX = pos.c * spacingX;
        const originalY = (pos.r - 1.0) * spacingY;
        const rx = originalX * cos - originalY * sin;
        const ry = originalX * sin + originalY * cos;

        unitPositions.push({
            x: cx + rx,
            y: cy + ry,
            type: uType,
            scale: slotScale,
            rowIdx: pos.rowIdx,
            slotIdx: idx,
            c: pos.c,
            r: pos.r,
        });
    });

    let frame = 0;
    let phase = 0;
    let lastT = 0;
    const renderLoop = () => {
        const nowMs = performance.now();
        if (!lastT) lastT = nowMs;
        phase += Math.min(0.1, (nowMs - lastT) / 1000);
        lastT = nowMs;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. 战略地图写实地形底色
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#162315');
        grad.addColorStop(1, '#111b10');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. 战略经纬坐标网格（46×63 真实步长）
        ctx.strokeStyle = 'rgba(38, 62, 36, 0.4)';
        ctx.lineWidth = 1;
        const stepX = Math.max(20, spacingX);
        const stepY = Math.max(20, spacingY);
        for (let x = (cx % stepX); x < canvas.width; x += stepX) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = (cy % stepY); y < canvas.height; y += stepY) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // 3. 战略罗盘方向标（右上角）
        drawCompass(ctx, canvas.width - 45, 45, stratDir);

        // 4. 脚底占位与三排阵线标记（主人铁律：重叠没事，关键是不要换排，三排兵要清晰）
        if (stratShowCollision) {
            // 4.1 三排基准排位线
            const rowLineLabels = ['【前排】', '【中坚】', '【后排】'];
            const rowLineColors = ['rgba(234, 179, 8, 0.75)', 'rgba(56, 189, 248, 0.75)', 'rgba(192, 132, 252, 0.75)'];
            const halfW = 160 * stratZoom;

            for (let r = 0; r < 3; r++) {
                const oy = (r - 1.0) * spacingY;
                const x1 = cx + (-halfW) * cos - oy * sin;
                const y1 = cy + (-halfW) * sin + oy * cos;
                const x2 = cx + (+halfW) * cos - oy * sin;
                const y2 = cy + (+halfW) * sin + oy * cos;

                ctx.save();
                ctx.strokeStyle = rowLineColors[r];
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 5]);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = rowLineColors[r];
                ctx.textBaseline = 'middle';
                const slotType = slots[r]?.type;
                const slotName = slotType ? getUnitDisplayName(slotType) : '';
                ctx.fillText(`${rowLineLabels[r]} ${slotName}`, x1 + (x1 < x2 ? -8 : 8), y1);
                ctx.restore();
            }

            // 4.2 脚底格位准星
            unitPositions.forEach(u => {
                ctx.save();
                ctx.translate(u.x, u.y);
                ctx.beginPath();
                ctx.ellipse(0, 0, 16 * stratZoom, 8 * stratZoom, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(70, 150, 60, 0.2)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(100, 200, 90, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(130, 230, 110, 0.7)';
                ctx.beginPath();
                ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
                ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                ctx.stroke();
                ctx.restore();
            });
        }

        // 5. 准备待绘制 Sprite
        const drawItems: Array<{
            u: typeof unitPositions[0];
            img: HTMLImageElement;
            sx: number; sy: number; sw: number; sh: number;
            dx: number; dy: number; dw: number; dh: number;
        }> = [];

        unitPositions.forEach(u => {
            const prefix = getUnitPathPrefix(u.type);
            const actionName = stratAction;
            const imgUrl = `${prefix}${actionName}_${stratDir}.png`;

            if (!metaCache.has(prefix)) {
                loadMeta(prefix).catch(() => {});
            }
            if (!spriteCache.has(imgUrl)) {
                loadSprite(imgUrl).catch(() => {});
            }
            const meta = metaCache.get(prefix) || null;
            const img = spriteCache.get(imgUrl);

            if (img && img.complete && img.naturalWidth > 0) {
                const actMeta = meta?.[actionName];
                const dirMeta = actMeta?.dirs?.[String(stratDir)];

                let totalFrames = 1;
                let fw = 0; let fh = 0; let hx = 0; let hy = 0;
                if (actMeta && dirMeta) {
                    totalFrames = actMeta.frames;
                    fw = dirMeta.fw; fh = dirMeta.fh; hx = dirMeta.hx; hy = dirMeta.hy;
                } else {
                    totalFrames = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
                    fw = img.naturalWidth / totalFrames; fh = img.naturalHeight;
                    hx = fw / 2; hy = fh / 2;
                }

                const speedDivisor = stratAction === 'idle' ? 3 : 2;
                const cycle = previewCycleSec(actMeta, totalFrames, speedDivisor);
                const curFrame = Math.floor(phase / cycle.sec * totalFrames) % totalFrames;
                const sx = curFrame * fw;
                const sy = 0;
                const sw = fw;
                const sh = fh;

                // 🔴 战略地图真机绘制比例公式（与 LegionPhalanxDrawer.ts 1813 行逐像素对齐）：
                const baseHeight = SPRITE_BASE_H; // 68
                const s = (baseHeight * stratZoom * u.scale) / 64;
                const dw = fw * s;
                const dh = fh * s;
                const dx = u.x - hx * s;
                const dy = u.y - hy * s;

                drawItems.push({ u, img, sx, sy, sw, sh, dx, dy, dw, dh });
            }
        });

        // 6. 跨排侵占（换排）检测（主人铁律：同排重叠没事，关键是不要换排，三排兵要清晰）
        if (stratShowCollision) {
            for (let i = 0; i < drawItems.length; i++) {
                for (let j = i + 1; j < drawItems.length; j++) {
                    const a = drawItems[i];
                    const b = drawItems[j];
                    // 仅检测不同排之间（跨排穿模即为换排）
                    if (a.u.rowIdx !== b.u.rowIdx) {
                        const left = Math.max(a.dx, b.dx);
                        const right = Math.min(a.dx + a.dw, b.dx + b.dw);
                        const top = Math.max(a.dy, b.dy);
                        const bottom = Math.min(a.dy + a.dh, b.dy + b.dh);
                        if (right > left && bottom > top) {
                            const overlapWidth = right - left;
                            const overlapHeight = bottom - top;
                            if (overlapWidth > 8 && overlapHeight > 8) {
                                ctx.save();
                                ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
                                ctx.fillRect(left, top, overlapWidth, overlapHeight);
                                ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
                                ctx.lineWidth = 1.5;
                                ctx.setLineDash([4, 3]);
                                ctx.strokeRect(left, top, overlapWidth, overlapHeight);

                                ctx.setLineDash([]);
                                ctx.fillStyle = '#fca5a5';
                                ctx.font = 'bold 11px sans-serif';
                                ctx.fillText(`⚠️ 跨排侵占(换排) ${Math.round(overlapHeight / stratZoom)}px`, left + 2, top - 4);
                                ctx.restore();
                            }
                        }
                    }
                }
            }
        }

        // 7. Y 轴排序后绘制 Sprite
        drawItems.sort((a, b) => a.u.y - b.u.y);
        drawItems.forEach(item => {
            ctx.drawImage(item.img, item.sx, item.sy, item.sw, item.sh, item.dx, item.dy, item.dw, item.dh);
            if (stratShowCollision) {
                ctx.strokeStyle = 'rgba(150, 180, 140, 0.25)';
                ctx.lineWidth = 1;
                ctx.strokeRect(item.dx, item.dy, item.dw, item.dh);
            }
        });

        // 8. 绘制军团战旗
        drawLegionFlag(ctx, cx, cy - 75 * stratZoom, row.flagColor, row.flagText, frame);

        // 9. 顶部军团信息浮牌
        drawLegionHUD(ctx, cx, 24, row.flagText, currentEditingLegion?.legionName || row.legionName || '军团');

        frame++;
        stratAnimTimer = requestAnimationFrame(renderLoop);
    };

    renderLoop();
}

function renderEditPanel(row: FactionLegionRow): void {
    if (!currentEditingLegion) return;
    if (stratAnimTimer !== null) {
        cancelAnimationFrame(stratAnimTimer);
        stratAnimTimer = null;
    }
    els.panel.classList.remove('is-strategic');

    // 记住「高级微调」折叠面板的展开状态（重渲染时恢复，避免自动收缩）
    const tuneDetailsOpen = (document.getElementById('le-tune-details') as HTMLDetailsElement | null)?.open ?? true;
    // 点卡片会整块重渲染面板，不记住滚动位置的话军团列表每次都弹回顶部（主人 2026-09-07 报）
    const prevGridScroll = els.panelContent.querySelector('.le-legion-grid')?.scrollTop ?? 0;
    const prevPanelScroll = els.panelContent.scrollTop;

    const mode = currentEditingLegion.formationMode;
    const slots = withEffectiveScales(currentEditingLegion.slots);

    // 三步向导状态：当前层 / 三层选项 / 当前层可选军团
    const curLayer = resolveCurrentLayer(row);
    const curLegionType: 'region' | 'sub' = isBase16CultureLegion(currentEditingLegion?.legionName || '') ? 'region' : 'sub';
    const currentLegionName = currentEditingLegion.legionName?.trim()
        || (curLayer === 'culture' ? getBase16LegionName(row.region) : `${row.factionName}军团`);
    const optCulture = getLayerLegionOptions('culture', row.factionId);
    const optSub = getLayerLegionOptions('sub', row.factionId);
    const optCustom = getLayerLegionOptions('custom', row.factionId);
    const activeLayerOpts = selectedLayerTab === 'culture' ? optCulture
        : selectedLayerTab === 'sub' ? optSub : optCustom;
    const legionCounts = { culture: optCulture.length, sub: optSub.length, custom: optCustom.length };

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

    const conflictLegions = getMultiCompositionLegionNames();
    const isMultiComp = conflictLegions.has(currentLegionName);
    const savedLegion = getAllDistinctLegions().get(currentLegionName);
    const isModified = savedLegion && legionSig(savedLegion) !== legionSig(currentEditingLegion);

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
      <button id="le-copy-faction" title="把这个势力的武将 / 据点 / 文化区 / 番号 / 军团 / 三排编制 / 战舰 / 战力复制成文本"
        style="flex:0 0 auto;padding:6px 12px;background:#243246;border:1px solid #4a5568;color:#cbd5e1;
        border-radius:4px;font-size:12px;cursor:pointer;white-space:nowrap;">📋 一键复制</button>
    </div>

    <!-- 当前军团状态 -->
    <div style="background:#141210;border:1px solid #2a2620;border-radius:6px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:11px;color:#a89f8f;">当前军团：</span>
      <b style="color:#f5d78e;font-size:13px;">【${currentEditingLegion?.legionName?.trim() || (curLayer === 'culture' ? getCultureLegionName(row.region) : row.factionName + '军团')}】</b>
      <span style="font-size:11px;color:#8ab4c4;">${LAYER_FULL_LABEL[curLayer]} · ${legionSummary(mode, slots)}</span>
      <span style="font-size:11px;padding:2px 7px;background:#182635;border:1px solid #284766;color:#7ec0ee;border-radius:3px;">🚢 套用战舰：${getNavalShipChineseName(getCultureNavalShip(row.region, row.factionId))}</span>
    </div>

    ${isMultiComp ? `
    <!-- 🔴 军团编制冲突报错 -->
    <div style="background:#3d1414;border:1px solid #9e2a2a;border-radius:6px;padding:10px 14px;margin-bottom:12px;color:#ffb4a8;">
      <div style="font-weight:bold;font-size:13px;color:#ff6b6b;display:flex;align-items:center;gap:6px;">
        <span>❌ 军团编制冲突：一个军团只能有一种编制，不然就报错！</span>
      </div>
      <div style="font-size:12px;margin-top:6px;color:#f0c0b8;line-height:1.5;">
        军团【${currentLegionName}】当前在多个势力间存在不同编制。<b>一种编制是指三排兵种排列一样（前排、中坚、后排兵种相同且阵型相同）。</b><br/>
        若要统一该军团编制，请选择或配置好三排兵种后，点击下方<b>「② 保存军团编制 · 全体同步」</b>！
      </div>
    </div>
    ` : (isModified ? `
    <!-- ⚠️ 编制未保存修改提示 -->
    <div style="background:#2d2010;border:1px solid #735020;border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:11px;color:#e8d098;line-height:1.5;">
      ⚠️ <b>编制已修改（未保存）：</b>当前三排兵种排列与已保存编制不一致。<b>一个军团只能有一种编制，不然就报错。</b><br/>
      若要更新此军团所有使用者，请点击下方<b>「② 保存军团编制 · 全体同步」</b>；若要创建独立新军团，请点击下方<b>「③ 另存为新军团」</b>。
    </div>
    ` : '')}

    <!-- 选军团：从现有军团套用（同名同编制） -->
    <div class="le-wizard-step">
      <div class="le-step-no">选军团</div>
      <div class="le-step-title">从现有军团选择（选好后点「保存武将换军团」；修改兵种或阵型后点「保存军团编制」）</div>
      <div class="le-layer-grid" style="margin-bottom:8px;">
        <button type="button" class="le-layer-btn ${selectedLayerTab === 'culture' ? 'active' : ''}" data-legiontab="culture">
          <div class="le-layer-title">🏛️ 一级：文化军团（16 母体） <span style="color:#e0c888;">${legionCounts.culture}</span></div>
        </button>
        <button type="button" class="le-layer-btn ${selectedLayerTab === 'sub' ? 'active' : ''}" data-legiontab="sub">
          <div class="le-layer-title">⭐ 二级：文明 × 时代（62 文明） <span style="color:#e0c888;">${legionCounts.sub}</span></div>
        </button>
        <button type="button" class="le-layer-btn ${selectedLayerTab === 'custom' ? 'active' : ''}" data-legiontab="custom">
          <div class="le-layer-title">✍️ 三级：自建军团 <span style="color:#e0c888;">${legionCounts.custom}</span></div>
        </button>
      </div>
      <div class="le-era-tabs" style="${selectedLayerTab === 'culture' ? 'display:none;' : ''}">
        <button type="button" class="le-era-btn ${legionEraFilter === 'all' ? 'active' : ''}" data-legionera="all">全部</button>
        ${AGE_ORDER.map(a => '<button type="button" class="le-era-btn ' + (legionEraFilter === a ? 'active' : '') + '" data-legionera="' + a + '" title="' + AGE_YEARS[a].span + '　' + AGE_YEARS[a].anchor + '">' + AGE_LABEL[a] + '</button>').join('')}
      </div>
      <input id="le-legion-search" class="le-input" type="search" placeholder="🔍 搜索军团名 / 兵种…" style="width:100%;margin-bottom:8px;box-sizing:border-box;" value="${legionSearchQuery}" />
      <div class="le-legion-grid"></div>
    </div>

    <!-- 第一步 · 英雄主队 + 三排兵 -->
    <div class="le-wizard-step">
      <div class="le-step-no">第一步</div>
      <div class="le-step-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
        <span>英雄主队 ＋ 三排兵种搭配（切阵型 2/3/4 档自动跟随）</span>
        <span style="display:inline-flex;gap:4px;">
          <button type="button" class="le-btn le-btn-sm le-row-swap" data-a="0" data-b="1" title="一键对调前排与中坚兵种" style="padding:2px 7px;font-size:11px;">⇅ 前↔中</button>
          <button type="button" class="le-btn le-btn-sm le-row-swap" data-a="1" data-b="2" title="一键对调中坚与后排兵种" style="padding:2px 7px;font-size:11px;">⇅ 中↔后</button>
          <button type="button" class="le-btn le-btn-sm le-row-swap" data-a="0" data-b="2" title="一键对调前排与后排兵种" style="padding:2px 7px;font-size:11px;">⇅ 前↔后</button>
        </span>
      </div>

      <div class="le-row-picker" style="border-color:#5a4622;background:#1f1a12;">
        <div class="le-row-header">
          <span class="le-row-title" style="color:#f5d78e;">👑 英雄主力队（第 10 队 · 全阵矛头）</span>
          ${currentEditingLegion.commanderUnit ? `<button type="button" id="le-commander-clear" class="le-btn le-btn-sm" style="padding:1px 6px;font-size:10px;" title="清空军团专属英雄兵模，回退默认英雄">✕ 清空</button>` : `<span style="font-size:10px;color:#8a8070;">未指定则按武将/文明默认</span>`}
        </div>
        <button type="button" class="le-unit-select-btn" data-row="-1">
          <span>${currentEditingLegion.commanderUnit ? getUnitDisplayName(currentEditingLegion.commanderUnit) : '（默认 · 点击指定本军团英雄主力兵模）'}</span>
          <span style="font-size:11px;color:#f5d78e;">${currentEditingLegion.commanderUnit ? getUnitDisplayName(currentEditingLegion.commanderUnit) : '选择英雄'} ▾</span>
        </button>
      </div>

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

    <!-- 第二步 · 阵型 -->
    <div class="le-wizard-step">
      <div class="le-step-no">第二步</div>
      <div class="le-step-title">阵型选择（七阵体系 · 全阵型 9 人 · 精锐主力优先 4 档）</div>
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

    <!-- 第三步 · 军团种类 -->
    <div class="le-wizard-step">
      <div class="le-step-no">第三步</div>
      <div class="le-step-title">军团层级（一级：文化军团 / 二级：制定军团）</div>
      <div class="le-layer-grid">
        <button type="button" class="le-layer-btn ${curLegionType === 'region' ? 'active' : ''}" data-legiontype="region">
          <div class="le-layer-title">🏛️ 一级：文化军团 <span style="color:#e0c888;">${legionCounts.culture}</span></div>
          <div class="le-layer-desc">16大区文化<br/>一文化一个·一键可恢复</div>
        </button>
        <button type="button" class="le-layer-btn ${curLegionType === 'sub' ? 'active' : ''}" data-legiontype="sub">
          <div class="le-layer-title">⭐ 二级：制定军团 <span style="color:#e0c888;">${legionCounts.sub}</span></div>
          <div class="le-layer-desc">从16文化母体延伸<br/>专属独立制定</div>
        </button>
      </div>
    </div>

    <!-- 军团名称 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>军团名称</span>
        <span style="font-size:11px;color:#a89f8f;font-weight:normal;">须包含时代且以「军团」二字结尾</span>
      </div>
      <input id="le-legion-name-input" class="le-input" type="text" value="${currentEditingLegion?.legionName || row.legionName || ''}" placeholder="例如：古典时代华夏军团、城堡时代蒙古军团" style="width:100%;font-size:13px;font-weight:bold;color:#f5e6c8;box-sizing:border-box;" />
      ${row.eliteName ? `<div style="font-size:11px;color:#8ab4c4;margin-top:6px;">精锐番号：${row.eliteName}${row.eliteTier != null ? ` T${row.eliteTier}` : ''}</div>` : ''}
    </div>

    <!-- 实时预览（折叠） -->
    <details id="le-tune-details" class="le-form-section">
      <summary class="le-collapse-toggle">⚙ 军团实时动态预览<span style="color:#8a8070;">▾</span></summary>
      <div class="le-collapse-body">
        <div class="le-preview-wrap">
          <canvas id="le-canvas" class="le-preview-canvas" width="480" height="260"></canvas>
        </div>
        <div class="le-preview-controls">
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'single' ? 'le-btn-primary' : ''}" id="le-view-single">🔍 单兵特写</button>
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'three' ? 'le-btn-primary' : ''}" id="le-view-three">🛡️ 三排各1兵</button>
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'phalanx' ? 'le-btn-primary' : ''}" id="le-view-phalanx">⚔ 9人方阵</button>
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'strategic' ? 'le-btn-primary' : ''}" id="le-view-strategic">🗺️ 战略真机</button>
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
    </details>

    <!-- 保存：两件事分开（2026-09-07 主人定「一个是武将套用军团，一个编辑军团，分开了」） -->
    <div class="le-form-section">
      <div class="le-section-title"><span>① 保存武将换军团 · 只改归属</span></div>
      <div style="font-size:11px;color:var(--muted-foreground);margin-bottom:8px;line-height:1.5;">
        把已保存的【${currentLegionName}】套用给【${row.generalName || row.factionName}】，只改归属。<b>修改过三排兵种或阵型，请先用下方按钮保存军团编制，全体同步。</b>
      </div>
      <button type="button" id="le-btn-apply-faction" class="le-btn le-btn-primary" style="width:100%;font-size:14px;padding:10px;">💾 保存武将换军团：【${row.generalName || row.factionName}】→【${currentLegionName}】</button>
      <button type="button" id="le-btn-revert-culture" class="le-btn le-btn-ghost" style="width:100%;font-size:13px;padding:9px;margin-top:8px;">↺ 恢复并保存归属：一级文化军团【${getCultureLegionName(row.region)}】</button>
    </div>

    <div class="le-form-section">
      <div class="le-section-title"><span>② 保存军团编制</span></div>
      <div style="font-size:11px;color:var(--muted-foreground);margin-bottom:8px;line-height:1.5;">
        把上面编好的三排兵种与阵型，写进【${currentLegionName}】这一条记录。用它的势力自动跟着变。
      </div>
      <button type="button" id="le-btn-save-single" class="le-btn le-btn-primary" style="width:100%;font-size:14px;padding:10px;background:#5a3c28;border-color:#8a6038;">💾 保存军团编制：【${currentLegionName}】（Ctrl+S）</button>
    </div>

    <div class="le-form-section">
      <div class="le-section-title"><span>③ 另存为三级制定军团 · 新名称</span></div>
      <div style="font-size:11px;color:var(--muted-foreground);margin-bottom:8px;line-height:1.5;">
        将当前编制保存为一个新名称的三级制定军团，并给【${row.generalName || row.factionName}】使用。已有军团名请使用上方「保存军团编制」。
      </div>
      <button type="button" id="le-btn-save-as" class="le-btn le-btn-ghost" style="width:100%;font-size:13px;padding:9px;margin-top:8px;">📄 另存为三级制定军团（起个新名字，只给这一家）</button>
    </div>
    `;

    els.panelContent.innerHTML = html;
    // 🔴 [2026-09-16 主人「给这里的势力添加一个一键复制势力武将军团等信息」]
    //    把当前选中势力的一整块信息拼成纯文本丢进剪贴板：武将 / 势力 / 据点 / 文化区 /
    //    精锐番号 / 军团名与层级 / 阵型 / 三排兵种与人数 / 战舰 / 战力。
    //    用**当前编辑中的** slots 与 mode（不是静态表），所以改了还没保存也能照实复制。
    document.getElementById('le-copy-faction')?.addEventListener('click', async () => {
        const legionName = currentEditingLegion?.legionName?.trim()
            || (curLayer === 'culture' ? getCultureLegionName(row.region) : row.factionName + '军团');
        const power = getLegionPower(slots)?.index ?? 0;
        const ship = getNavalShipChineseName(getCultureNavalShip(row.region, row.factionId));
        const rowLabels = ['前排', '中坚', '后排'];
        const lines = [
            `${row.generalName || row.factionName} · ${row.factionName}`,
            `据点：${row.capitalCityName ?? '未知'} ｜ 文化区：${row.regionLabel}`
                + (row.eliteName ? ` ｜ 精锐番号：${row.eliteName} T${row.eliteTier}` : ''),
            `军团：${legionName}（${LAYER_FULL_LABEL[curLayer]}）`,
            `阵型：${getFormationModeLabel(mode)}`,
            ...(currentEditingLegion?.commanderUnit ? [`英雄主队：${getUnitDisplayName(currentEditingLegion.commanderUnit)}`] : []),
            ...slots.map((sl, i) => `${rowLabels[i] ?? '第' + (i + 1) + '排'}：${getUnitDisplayName(sl.type)} ×${sl.count}`),
            `战舰：${ship}`,
            `战力：${power}`,
        ];
        const text = lines.join(String.fromCharCode(10));
        try {
            await navigator.clipboard.writeText(text);
            showToast('📋 已复制【' + (row.generalName || row.factionName) + '】的势力信息');
        } catch {
            // 剪贴板被拒（没焦点/权限）时退回选中文本，让主人自己 Ctrl+C，别让点击毫无反应
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:50%;top:20%;transform:translateX(-50%);z-index:20000;width:min(560px,90vw);height:220px;';
            document.body.appendChild(ta);
            ta.select();
            showToast('⚠️ 剪贴板不可用，已选中文本，按 Ctrl+C 复制；点空白处关闭', true);
            const close = (): void => { ta.remove(); document.removeEventListener('click', close); };
            setTimeout(() => document.addEventListener('click', close), 300);
        }
    });

    const tuneDetails = document.getElementById('le-tune-details') as HTMLDetailsElement | null;
    if (tuneDetails) tuneDetails.open = tuneDetailsOpen;
    bindPanelEvents(row);
    renderLegionCardGrid(row);
    // 还原滚动位置：网格自己滚 + 面板整体滚，两个都要还，否则点完卡片视线被甩走
    const grid = els.panelContent.querySelector('.le-legion-grid');
    if (grid) grid.scrollTop = prevGridScroll;
    els.panelContent.scrollTop = prevPanelScroll;
    startCanvasPreview();
}

function bindPanelEvents(row: FactionLegionRow): void {
    // 阵型切换（2 / 3 / 4 档位兵种自动跟随）
    els.panelContent.querySelectorAll('.le-mode-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = (btn as HTMLElement).dataset.mode as FormationMode;
            if (currentEditingLegion && currentEditingLegion.formationMode !== mode) {
                const oldCounts = getDefaultSlotsForMode(currentEditingLegion.formationMode).map(s => s.count);
                const newCounts = getDefaultSlotsForMode(mode).map(s => s.count);
                const oldDistinct = new Set(oldCounts).size === 3;
                const newDistinct = new Set(newCounts).size === 3;
                if (!currentEditingLegion.tierSlots) currentEditingLegion.tierSlots = {};
                if (oldDistinct) {
                    oldCounts.forEach((cnt, idx) => {
                        const sl = currentEditingLegion!.slots[idx];
                        if (sl) currentEditingLegion!.tierSlots![cnt] = { type: sl.type, scale: sl.scale };
                    });
                }
                if (newDistinct && currentEditingLegion.tierSlots[2] && currentEditingLegion.tierSlots[3] && currentEditingLegion.tierSlots[4]) {
                    currentEditingLegion.slots = newCounts.map((cnt, idx) => {
                        const saved = currentEditingLegion!.tierSlots![cnt];
                        const fallback = currentEditingLegion!.slots[idx];
                        return {
                            type: saved?.type || fallback?.type || 'swordsman',
                            count: cnt,
                            ...(saved?.scale !== undefined ? { scale: saved.scale } : (fallback?.scale !== undefined ? { scale: fallback.scale } : {})),
                        };
                    });
                } else {
                    currentEditingLegion.slots = convertSlotsToMode(currentEditingLegion.slots, mode);
                }
                currentEditingLegion.formationMode = mode;
                renderEditPanel(row);
            }
        });
    });

    // 三排之间一键对调
    els.panelContent.querySelectorAll('.le-row-swap').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentEditingLegion) return;
            const a = parseInt((btn as HTMLElement).dataset.a!, 10);
            const b = parseInt((btn as HTMLElement).dataset.b!, 10);
            const slA = currentEditingLegion.slots[a];
            const slB = currentEditingLegion.slots[b];
            if (!slA || !slB) return;
            const tmpType = slA.type;
            const tmpScale = slA.scale;
            slA.type = slB.type;
            slA.scale = slB.scale;
            slB.type = tmpType;
            slB.scale = tmpScale;
            const counts = getDefaultSlotsForMode(currentEditingLegion.formationMode).map(s => s.count);
            if (new Set(counts).size === 3) {
                currentEditingLegion.tierSlots = {};
                counts.forEach((cnt, idx) => {
                    const sl = currentEditingLegion!.slots[idx];
                    if (sl) currentEditingLegion!.tierSlots![cnt] = { type: sl.type, scale: sl.scale };
                });
            }
            renderEditPanel(row);
        });
    });

    // 清空军团专属英雄兵模
    document.getElementById('le-commander-clear')?.addEventListener('click', () => {
        if (!currentEditingLegion) return;
        currentEditingLegion.commanderUnit = undefined;
        renderEditPanel(row);
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
    document.getElementById('le-view-strategic')?.addEventListener('click', () => { previewViewMode = 'strategic'; renderEditPanel(row); });
    document.getElementById('le-single-r0')?.addEventListener('click', () => { singlePreviewRow = 0; renderEditPanel(row); });
    document.getElementById('le-single-r1')?.addEventListener('click', () => { singlePreviewRow = 1; renderEditPanel(row); });
    document.getElementById('le-single-r2')?.addEventListener('click', () => { singlePreviewRow = 2; renderEditPanel(row); });

    // 一键恢复文化军团
    document.getElementById('le-btn-revert-culture')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        const previous = localCustomCompositions[row.factionId];
        delete localCustomCompositions[row.factionId];
        const saved = await saveOneFactionLegion(row.factionId, null);
        if (!saved) {
            if (previous) localCustomCompositions[row.factionId] = previous;
            buildRows();
            applyFilter();
            selectFaction(row.factionId);
            return;
        }
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        showToast(`↺ 已恢复【${row.factionName}】为一级文化军团【${getCultureLegionName(row.region)}】`);
    });

    // ① 保存武将换军团 · 只改归属：只写 FactionCompositions 一条，绝不碰文化军团、也不碰别的势力。
    //    🔴 [2026-09-07 主人定「一个是武将套用军团，一个编辑军团，分开了」]
    //       原来只有一个 💾，它会按「当前是不是文化层」自己决定写哪儿 —— 结果主人想给
    //       某个武将换支军团，却把整个文化区冲掉（罗马、希腊、赫梯先后中招三次）。
    document.getElementById('le-btn-apply-faction')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        const name = currentEditingLegion.legionName?.trim() || fallbackLegionNameOf(row);
        const savedLegion = getAllDistinctLegions().get(name);
        if (!savedLegion || legionSig(savedLegion) !== legionSig(currentEditingLegion)) {
            showToast('❌ 一个军团只能有一种编制。一种编制是指三排兵种排列一样！请先保存军团编制（全体同步），再给武将换军团。', true);
            return;
        }
        localCustomCompositions[row.factionId] = {
            legionName: name,
            legionType: currentEditingLegion.legionType,
            formationMode: savedLegion.formationMode,
            navalFormation: currentEditingLegion.navalFormation ?? 'auto',
            slots: savedLegion.slots.map(s => ({ ...s })),
            commanderUnit: savedLegion.commanderUnit,
        };
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        if (await saveOneFactionLegion(row.factionId, name, currentEditingLegion.legionType || 'sub')) {
            showToast(`✅ 武将换军团已保存：【${row.generalName || row.factionName}】→【${name}】（只改这一家的归属）`);
        }
    });

    // 保存单条专属
    // 🔴 [2026-09-14 主人定「这个功能只有一个，就是保存编辑好的军团，别给我搞别的」]
    //    ② 保存军团编制 —— 只把当前编好的三排兵种 + 阵型写进**这支军团那一条记录**。
    //    不写势力表、不写文化区指针、没有「全体同步」：编制只有一份，
    //    用它的势力读的就是这一份，本来就会跟着变，没有第二份需要同步。
    document.getElementById('le-btn-save-single')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        const legionName = currentEditingLegion.legionName?.trim() || fallbackLegionNameOf(row);
        if (legionName.includes('军军团')) {
            showToast('❌ 军团名不能含「军军团」（军+军团重复），请改为「XX军团」', true);
            return;
        }
        const slots = currentEditingLegion.slots.map(s => ({ ...s }));
        const formationMode = currentEditingLegion.formationMode;
        const commanderUnit = currentEditingLegion.commanderUnit?.trim() || null;
        try {
            const res = await fetch('/api/save-legion-composition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legionName, formationMode, slots, commanderUnit }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
            // 内存同步：静态表是页面加载时导入的，不同步的话下面重绘会把界面刷回旧编制
            patchLegionComposition(legionName, slots, formationMode, undefined, commanderUnit);
            // 🔴 [2026-09-14 主人报障「保存后为什么不刷新」] 只打补丁不够：
            //    localCustomCompositions 是**页面加载时按军团记录解出来的快照**，
            //    保存后它还留着旧编制，buildRows 优先读它 → 表格纹丝不动。
            //    必须拿打完补丁的军团记录重新解一遍。
            localCustomCompositions = buildLocalCompositions();
            buildRows();
            applyFilter();
            renderTable();
            if (selectedFactionId) selectFaction(selectedFactionId);
            showToast(`✅ 【${legionName}】编制已保存（写入 ${json.file}）`);
        } catch (e: any) {
            showToast('❌ 保存失败：' + (e?.message || e), true);
        }
    });

    // 另存为新军团：独立命名，不联动同名势力
    document.getElementById('le-btn-save-as')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        const curName = currentEditingLegion.legionName?.trim() || fallbackLegionNameOf(row);
        const newName = (window.prompt('输入新军团名（另存为独立军团，不会同步到其他同名势力）：', curName))?.trim();
        if (!newName) return;
        if (getAllDistinctLegions().has(newName)) {
            showToast(`❌ 军团【${newName}】已存在。一个军团只能有一种编制（三排兵种排列一样），请使用「保存军团编制（全体同步）」或填写未被占用的新名称！`, true);
            return;
        }
        if (newName.includes('军军团')) {
            showToast('❌ 军团名不能含「军军团」（军+军团重复），请改为「XX军团」', true);
            return;
        }
        // 🔴 [2026-09-14 修] 势力表只存指针后，这里**必须先把新军团本身建出来**：
        //    原来只写 localCustomCompositions（= 指针）再 saveAllCompositions，
        //    而那条路径已经不写编制了 —— 新军团只有名字没有编制，刷新后就成了
        //    「势力指向不存在的军团」，三排兵种全丢。
        const slots = currentEditingLegion.slots.map(s => ({ ...s }));
        const formationMode = currentEditingLegion.formationMode;
        const commanderUnit = currentEditingLegion.commanderUnit?.trim() || null;
        try {
            const res = await fetch('/api/save-legion-composition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legionName: newName, formationMode, slots, commanderUnit }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        } catch (e: any) {
            showToast('❌ 新军团创建失败：' + (e?.message || e), true);
            return;
        }
        patchLegionComposition(newName, slots, formationMode, undefined, commanderUnit);
        currentEditingLegion.legionName = newName;
        localCustomCompositions[row.factionId] = {
            ...localCustomCompositions[row.factionId],
            legionName: newName,
            legionType: currentEditingLegion.legionType,
            navalFormation: currentEditingLegion.navalFormation ?? 'auto',
            formationMode,
            slots,
            commanderUnit: commanderUnit || undefined,
        };
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        if (!await saveOneFactionLegion(row.factionId, newName, 'sub')) return;
        showToast(`✅ 已另存为【${newName}】三级军团：编制已建，【${row.factionName}】已挂上`);
    });

    // 军团种类选择（第三步）
    els.panelContent.querySelectorAll('.le-layer-btn[data-legiontype]').forEach(btn => {
        btn.addEventListener('click', () => {
            const lt = (btn as HTMLElement).dataset.legiontype as 'region' | 'sub';
            if (currentEditingLegion) {
                currentEditingLegion.legionType = lt;
                // 🔴 [2026-09-10 主人定] 军团命名都要加时代，不再自动命名
                renderEditPanel(row);
            }
        });
    });

    // 选军团 · 三层切换（仅更新标签高亮 + 重绘卡片，不整屏重渲染，保住搜索框焦点）
    els.panelContent.querySelectorAll('.le-layer-btn[data-legiontab]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedLayerTab = (btn as HTMLElement).dataset.legiontab as LegionLayer;
            els.panelContent.querySelectorAll('.le-layer-btn[data-legiontab]').forEach(b => {
                b.classList.toggle('active', (b as HTMLElement).dataset.legiontab === selectedLayerTab);
            });
            renderLegionCardGrid(row);
        });
    });

    // 选军团 · 搜索过滤（仅重绘卡片网格，保持输入焦点）
    document.getElementById('le-legion-search')?.addEventListener('input', (e) => {
        legionSearchQuery = (e.target as HTMLInputElement).value;
        renderLegionCardGrid(row);
    });

    document.getElementById('le-legion-name-input')?.addEventListener('input', (e) => {
        if (currentEditingLegion) {
            currentEditingLegion.legionName = (e.target as HTMLInputElement).value;
        }
    });
}

/** 按当前搜索词过滤「第二步」军团卡片（匹配军团名与所含兵种） */
function filterLegionOptionsByQuery(options: LayerLegionOption[]): LayerLegionOption[] {
    const q = legionSearchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => {
        if (o.legionName.toLowerCase().includes(q)) return true;
        return o.slots.some(s => {
            if (!s?.type) return false;
            const name = getUnitDisplayName(s.type).toLowerCase();
            return s.type.toLowerCase().includes(q) || name.includes(q);
        });
    });
}

/** 点击卡片只选择；换归属与编辑编制由各自保存按钮落盘。 */
function bindLegionCard(card: HTMLElement, row: FactionLegionRow): void {
    card.addEventListener('click', () => {
        const key = card.dataset.key!;
        if (selectedLayerKey === key) return;
        const options = getLayerLegionOptions(selectedLayerTab, row.factionId);
        const target = options.find(o => o.key === key);
        if (!target) { showToast('找不到该军团配置', true); return; }

        const tierSlots: Record<number, { type: string; scale?: number }> = {};
        if (target.formationMode !== 'square') {
            target.slots.forEach(s => {
                if (s.count === 2 || s.count === 3 || s.count === 4) {
                    tierSlots[s.count] = { type: s.type, scale: s.scale };
                }
            });
        }
        currentEditingLegion = {
            legionName: target.legionName,
            formationMode: target.formationMode,
            navalFormation: currentEditingLegion?.navalFormation ?? 'auto',
            slots: target.slots.map(s => ({ ...s })),
            commanderUnit: target.commanderUnit,
            tierSlots,
            legionType: isBase16CultureLegion(target.legionName) ? 'region' : 'sub',
        };
        selectedLayerKey = key;
        renderEditPanel(row);
        showToast(`已选中【${target.legionName}】；给【${row.generalName || row.factionName}】换军团请点「保存武将换军团」，修改编制请点「保存军团编制」`);
    });
}

/** 仅重绘「第二步」军团卡片网格（保持搜索框焦点，不整屏重渲染） */
function renderLegionCardGrid(row: FactionLegionRow): void {
    const gridEl = els.panelContent.querySelector('.le-legion-grid');
    if (!gridEl) return;
    const isCultureLayer = selectedLayerTab === 'culture';
    const eraTabsEl = els.panelContent.querySelector('.le-era-tabs') as HTMLElement | null;
    if (eraTabsEl) {
        eraTabsEl.style.display = isCultureLayer ? 'none' : 'flex';
    }
    const options = getLayerLegionOptions(selectedLayerTab, row.factionId);
    const visible = filterLegionOptionsByQuery(options)
        .filter(o => isCultureLayer || legionEraFilter === 'all' || getLegionEra(o.legionName, o.slots) === legionEraFilter);
    const isSubLayer = selectedLayerTab !== 'culture';   // 二级 / 三级都算"非一级"（都可有时代筛选、都可删）
    const eraCount = (a: UnitAge) => options.filter(o => getLegionEra(o.legionName, o.slots) === a).length;
    gridEl.innerHTML = visible.map(opt => `
      <div class="le-legion-card ${isOptionActive(opt, currentEditingLegion) ? 'active' : ''}" data-key="${opt.key}" title="${opt.label}">
        <div class="lc-name">${opt.legionName}${isOptionActive(opt, currentEditingLegion) ? ' ✓' : ''}
          ${isBase16CultureLegion(opt.legionName) || isCultureLayer ? '' : `<span class="age-tag age-${getLegionEra(opt.legionName, opt.slots)}" style="font-size:9px;padding:1px 4px;margin-left:4px;">${AGE_LABEL[getLegionEra(opt.legionName, opt.slots)]}</span>`}
          ${opt.shipName ? `<span class="le-ship-tag" style="font-size:9px;padding:1px 5px;margin-left:4px;background:#182635;border:1px solid #284766;color:#7ec0ee;border-radius:3px;font-weight:normal;" title="套用战舰：${opt.shipName} (${opt.shipId})">🚢 ${opt.shipName}</span>` : ''}
          ${(() => {
            const lp = getLegionPower(opt.slots);
            if (!lp) return '';
            const detail = lp.rows.map((x, i) => `${['前排', '中坚', '后排'][i] ?? '第' + (i + 1) + '排'} ${getUnitDisplayName(x.type)}×${x.count} = ${x.index ?? '?'}`).join('\n');
            const color = lp.index >= 200 ? '#e08a5a' : lp.index >= 100 ? '#e0c060' : '#8fae8f';
            return `<span class="lc-power" style="color:${color};" title="军团战力 ${lp.index}（按格位人数加权平均，中位兵=100）&#10;${detail}">⚔ ${lp.index}</span>`;
          })()}
        </div>
        <div class="lc-meta">${opt.description}</div>
        ${isSubLayer && !isBase16CultureLegion(opt.legionName) ? `<button type="button" class="le-legion-delete" data-delete-name="${opt.legionName}" title="删除此三级军团；用它的势力按「武将的时代 + 据点的建筑风格」重新套二级军团（66 种建筑风格 × 4 时代），套不上就跟随文化区（一级 16 与二级 257 不可删）">🗑</button>` : ''}
      </div>
    `).join('') || (options.length
        ? '<div class="le-empty-hint" style="padding:14px;">无匹配军团</div>'
        : '<div class="le-empty-hint" style="padding:14px;">该类型暂无军团可选</div>');
    els.panelContent.querySelectorAll('.le-era-btn[data-legionera]').forEach(b => {
        const a = (b as HTMLElement).dataset.legionera!;
        if (a !== 'all') b.textContent = `${AGE_LABEL[a as UnitAge]} ${eraCount(a as UnitAge)}`;
        else b.textContent = `全部 ${options.length}`;
        b.classList.toggle('active', legionEraFilter === a);
        b.addEventListener('click', () => {
            legionEraFilter = a as 'all' | UnitAge;
            renderLegionCardGrid(row);
        });
    });
    gridEl.querySelectorAll('.le-legion-card[data-key]').forEach(card => bindLegionCard(card as HTMLElement, row));
    // 删除军团（二/三级都渲染删除按钮；只有「一级 16 母体军团」不渲染，天然不可删）
    gridEl.querySelectorAll('.le-legion-delete[data-delete-name]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const name = (btn as HTMLElement).dataset.deleteName!;
            if (isBase16CultureLegion(name)) {
                showToast('❌ 一级：16 母体文化军团不可删除', true);
                return;
            }
            // 🔴 [2026-10-16 主人定] 二级全部 257 支是武将保底军团，不可删除
            if (isBaseFallbackLegion(name)) {
                showToast('❌ 二级军团不可删除：66 种建筑风格 × 4 时代的武将靠它套军团', true);
                return;
            }
            // 🔴 [2026-09-16] 先把重新套军团的结果算出来给主人看，再问删不删
            const _plan = planFallbackForDeletedLegion(name);
            const _lines = _plan.items.slice(0, 8).map(i => '  · ' + i.note).join(String.fromCharCode(10));
            const _more = _plan.items.length > 8 ? String.fromCharCode(10) + `  …另有 ${_plan.items.length - 8} 家` : '';
            const _skip = _plan.skipped.length ? String.fromCharCode(10) + `套不上的 ${_plan.skipped.length} 家将跟随文化区` : '';
            if (!window.confirm(
                `删除军团【${name}】？` + String.fromCharCode(10, 10)
                + `用它的 ${_plan.items.length + _plan.skipped.length} 家势力将重新套二级军团（武将时代 × 据点建筑风格）：`
                + String.fromCharCode(10) + _lines + _more + _skip,
            )) return;
            await deleteSpecificLegion(name);
            renderEditPanel(row);
        });
    });
}

/** 某势力的实际军团名（自定义优先；否则文化区默认军团名） */
function effectiveLegionName(row: FactionLegionRow): string {
    const custom = localCustomCompositions[row.factionId];
    const n = custom?.legionName?.trim();
    if (n) return n;
    return getCultureLegionName(row.region) ?? `${row.factionName}军团`;
}

/** 该军团名是否已被其他势力/武将使用（独立军团单占用判据，排除当前势力） */
function isLegionUsedByOther(factionId: string, legionName: string): boolean {
    if (!legionName) return false;
    for (const fid of Object.keys(localCustomCompositions)) {
        if (fid === factionId) continue;
        if (localCustomCompositions[fid]?.legionName?.trim() === legionName) return true;
    }
    return false;
}

/**
 * 军团命名铁律自动校验（2026-09-10 主人定）：唯一铁律「一个军团只能有一种编制」。
 *   同名军团（前/中/后三排兵种 + 阵型）必须一致，不一致 = 违规。
 * 返回违规信息列表；无违规则空数组。
 */
/** 战斗兵模的类别（英雄、非战斗、其他不在其内） */
const COMBAT_CATEGORIES: UnitCategory[] = ['infantry', 'cavalry', 'ranged', 'siege', 'naval'];

/**
 * 战斗兵模套用统计（2026-10-19 主人令）：返回总数、各类数量、没被任何军团套用的兵模。
 * 套用来源：全部独立军团的三排兵种、二级军团硬表、势力实际编成、攻城武器发放表、舰队船型。
 */
function computeCombatUnitCoverage(): { total: number; summary: string; unused: DeUnitDef[] } {
    const used = new Set<string>();
    for (const entry of getAllDistinctLegions().values()) for (const s of entry.slots) used.add(s.type);
    // 二级军团的权威硬表：势力存过自己的副本时，getAllDistinctLegions 会优先显示副本，硬表里的兵种会被遮住，这里补上
    for (const l2 of LEVEL_2_CIV_62_LEGIONS) {
        for (const s of l2.slots) used.add(s.type);
        if (l2.shipId) used.add(String(l2.shipId).toLowerCase());
    }
    for (const l3 of LEVEL_3_LEGIONS) {
        for (const s of l3.slots) used.add(s.type);
        if ((l3 as any).shipId) used.add(String((l3 as any).shipId).toLowerCase());
    }
    for (const r of allRows) for (const s of r.slots) used.add(s.type);
    for (const v of Object.values(LEGION_78_SIEGE_MAP)) for (const w of v.weapons) used.add(w);
    const combat = DE_UNITS_CATALOG.filter((u) => COMBAT_CATEGORIES.includes(u.category));
    const summary = COMBAT_CATEGORIES.map((c) => `${CATEGORY_LABEL[c]} ${combat.filter((u) => u.category === c).length}`).join('、');
    return { total: combat.length, summary, unused: combat.filter((u) => !used.has(u.id)) };
}

function computeLegionNameViolations(): string[] {
    const violations: string[] = [];

    // 每势力 → { 军团名, 编制签名 }（覆盖自定义与文化区默认）
    const eff = allRows.map(r => ({
        factionName: r.factionName,
        name: effectiveLegionName(r),
        sig: legionSig(r),
        // 没有自定义编成的势力，编制来自文化保底 —— 报错时要标出来，否则看不懂为什么会「重名」
        hasCustom: !!localCustomCompositions[r.factionId],
    }));

    // 🔴 [2026-09-10 主人定] 唯一铁律：一个军团只能有一种编制（前/中/后三排兵种 + 阵型一致）。
    const nameSigs = new Map<string, Set<string>>();
    const nameFactions = new Map<string, string[]>();
    for (const e of eff) {
        if (!nameSigs.has(e.name)) { nameSigs.set(e.name, new Set()); nameFactions.set(e.name, []); }
        nameSigs.get(e.name)!.add(e.sig);
        nameFactions.get(e.name)!.push(e.factionName);
    }

    // 🔴 [2026-09-14 主人定] 基准预设对照：一级母体文化军团与二级62文明军团基准编制检查。
    //    凡势力使用了系统预设的军团名，其实际编制必须与该军团的系统基准编制一致；
    //    若有势力使用了该军团名但编制与基准不符，必须即刻报错。
    const distinctMap = getAllDistinctLegions();
    for (const [distName, distDef] of distinctMap.entries()) {
        const isBase16 = BASE_16_REGIONS.some(rg => getBase16LegionName(rg as RegionType) === distName);
        const isLevel2 = LEVEL_2_CIV_62_NAMES.has(distName);
        if (!isBase16 && !isLevel2) continue;

        // 🔴 [2026-09-14 修] 这里原本自己拼 `mode:typexN+…`，而势力那边的 `e.sig` 是
        //    `legionSig()` 拼的 `mode|type,type,type` —— 两套格式**永远不可能相等**，
        //    于是每一支一级/二级军团都被判成「↔ 系统基准预设」（实测 35 条全是这么来的）。
        //    编制铁律只看「三排兵种 + 阵型」，人数由阵型定，必须走同一个 legionSig。
        const distSig = legionSig(distDef);
        for (const e of eff) {
            if (e.name === distName && e.sig !== distSig) {
                if (!nameSigs.has(distName)) {
                    nameSigs.set(distName, new Set());
                    nameFactions.set(distName, []);
                }
                nameSigs.get(distName)!.add(distSig);
                nameSigs.get(distName)!.add(e.sig);
            }
        }
    }

    for (const [name, sigs] of nameSigs.entries()) {
        if (sigs.size > 1) {
            // 🔴 [2026-09-07 主人改口] 只写**哪两拨势力的编制不一样**就够，不要逐格 diff。
            //    （原 2026-09-01 要求「讲清差在哪一格」，实际读起来太长，已作废。
            //     要看差在哪，点进那个势力对比编成即可。）
            const groups = new Map<string, string[]>();
            for (const e of eff) {
                if (e.name !== name) continue;
                if (!groups.has(e.sig)) groups.set(e.sig, []);
                groups.get(e.sig)!.push(e.factionName);
            }
            if (distinctMap.has(name)) {
                const dDef = distinctMap.get(name)!;
                const dSig = legionSig(dDef);   // [2026-09-14 修] 同上，必须与 e.sig 同一套拼法
                if (!groups.has(dSig)) {
                    groups.set(dSig, ['系统基准预设']);
                }
            }
            const entries = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
            const side = (fs: string[]) => fs.length > 4 ? `${fs.slice(0, 4).join('、')}等 ${fs.length} 家` : fs.join('、');
            violations.push(
                `【${name}】编制不一致（一个军团只能有一种编制，三排兵种排列必须一样）：` + entries.map(([, fs]) => side(fs)).join('　↔　'),
            );
        }
    }

    // 🔴 [2026-10-19 主人令「添加一个自动检查，一共多少兵模，哪个兵模没有被套用，就要报错」「战斗兵模没有被套用，就报错」]
    //    战斗兵模 ＝ 步兵、骑兵、远程、攻城、船只（英雄、非战斗、其他不算）。
    //    「套用」＝ 被任何一支军团用上：三排兵种（含一/二/三级军团与势力副本）、攻城武器发放表、舰队船型（shipId）。
    //    判据是「有没有军团用它」而不是「有没有势力用它」（2026-09-14 修：军团定义里用了、只是暂时没势力挂的，不算没套用）。
    const cov = computeCombatUnitCoverage();
    if (cov.unused.length > 0) {
        violations.push(
            `【兵模】战斗兵模共 ${cov.total} 个（${cov.summary}），${cov.unused.length} 个没有被任何军团套用，已套用 ${cov.total - cov.unused.length} 个`,
        );
        for (const cat of COMBAT_CATEGORIES) {
            const list = cov.unused.filter((u) => u.category === cat);
            if (list.length > 0) {
                violations.push(`【${CATEGORY_LABEL[cat]}】${list.length} 个兵模未被套用：${list.map((u) => `${u.name}（${u.id}）`).join('、')}`);
            }
        }
    }

    // 🔴 [2026-09-14 主人定 / 2026-10-18 修正] 军团套用检查：
    //    二级军团按「武将时代＋据点建筑文化」对应（符合历史，不用硬套）：
    //    仅当全图存在对应 (buildingStyle + age) 且未挂三级军团的势力、该二级军团却无人套用时报错；
    //    全图物理上无该时代对应建筑风格据点的跨时代延伸二级军团允许空置。
    //    三级军团仍要求必须有势力套用。
    const legionUsers = new Map<string, number>();
    const activeStyleAges = new Set<string>();
    for (const r of allRows) {
        const n = effectiveLegionName(r);
        if (n) legionUsers.set(n, (legionUsers.get(n) ?? 0) + 1);
        if (n && !LEVEL_3_LEGION_NAMES.has(n) && r.buildingStyle && r.generalId) {
            const gEra = GENERAL_ERA[r.generalId];
            if (gEra) activeStyleAges.add(`${r.buildingStyle}|${gEra}`);
        }
    }
    const unusedL2 = LEVEL_2_CIV_62_LEGIONS
        .filter(l => !legionUsers.has(l.name) && activeStyleAges.has(`${l.buildingStyle}|${l.age}`))
        .map(l => l.name);
    if (unusedL2.length > 0) {
        violations.push(
            `【二级军团】${unusedL2.length} 支有对应（时代+建筑文化）势力却未套用：${unusedL2.join('、')}`,
        );
    }
    const unusedL3 = [...LEVEL_3_LEGION_NAMES].filter(n => !legionUsers.has(n));
    if (unusedL3.length > 0) {
        violations.push(
            `【三级军团】${unusedL3.length} 支没有任何势力套用：${unusedL3.join('、')}`,
        );
    }

    // 🔴 [2026-09-11 主人定] 武将套用检查：军团没被武将套用 → 报错（所有军团必须都被武将套用）。
    const nameHasGeneral = new Map<string, boolean>();
    for (const r of allRows) {
        const n = effectiveLegionName(r);
        if (!n) continue;
        if (!nameHasGeneral.has(n)) nameHasGeneral.set(n, false);
        if (r.generalName) nameHasGeneral.set(n, true);
    }
    for (const [name, has] of nameHasGeneral.entries()) {
        if (!has) violations.push(`【${name}】没有被武将套用（所有军团必须都被武将套用）`);
    }

    // 🔴 [2026-09-11 主人定] 象兵/战车检查：一个军团只能一排象兵或一排战车，同时出现象兵+战车也要报错。
    const seenEleChariot = new Set<string>();
    for (const r of allRows) {
        const n = effectiveLegionName(r);
        if (!n || seenEleChariot.has(n)) continue;
        seenEleChariot.add(n);
        const ele = r.slots.filter(s => getUnitSubcategory(s.type) === 'elephant').length;
        const cha = r.slots.filter(s => getUnitSubcategory(s.type) === 'chariot').length;
        if (ele > 1 || cha > 1 || (ele > 0 && cha > 0)) {
            violations.push(`【${n}】象兵/战车违规：象兵 ${ele} 排、战车 ${cha} 排（一个军团只能一排象兵或一排战车，不能同时出现）`);
        }
    }

    return violations;
}

/** 校验并自动报错：无违规提示通过；有违规弹窗列出全部 */
function reportLegionNameViolations(silentWhenClean = false): void {
    const violations = computeLegionNameViolations();
    if (violations.length === 0) {
        // 打开编辑器时的自动校验走 silent：没错就别弹绿条打扰
        if (!silentWhenClean) { const c = computeCombatUnitCoverage(); showToast(`✅ 军团检查通过：战斗兵模共 ${c.total} 个，全部已套用`); }
        return;
    }
    openLegionViolationsModal(violations);
}

/**
 * 一键修复（2026-09-10 主人定）：唯一铁律「一个军团只能有一种编制」。
 *
 * 规则：**同名不同编** → 最早的那个保留原名，后来的按「原名·文化标签」改名（必要时加序号）。
 *      不采用「直接回落文化军团」，因为那会**丢掉人工调好的编制**；改名只动名字，数据不丢。
 */
async function autoFixLegions(): Promise<string> {
    const actions: string[] = [];
    let changed = 0;

    // 文化区 → 文化军团名（同名不同编修复时判「是不是文化军团」用）
    const cultureNameByRegion = new Map<RegionType, string>();
    for (const rg of REGION_ORDER) {
        cultureNameByRegion.set(rg, getCultureLegionName(rg));
    }

    // ── 同名不同编 → 后来者改名（保编制，不丢数据）────────────
    const nameToSigs = new Map<string, Map<string, FactionLegionRow[]>>();
    for (const row of allRows) {
        const n = effectiveLegionName(row);
        const sig = legionSig(row);
        if (!nameToSigs.has(n)) nameToSigs.set(n, new Map());
        const m = nameToSigs.get(n)!;
        if (!m.has(sig)) m.set(sig, []);
        m.get(sig)!.push(row);
    }
    const takenNames = new Set(allRows.map(r => effectiveLegionName(r)));
    for (const [name, sigMap2] of nameToSigs) {
        if (sigMap2.size <= 1) continue;
        // 文化军团名冲突：文化军团保名，冲突的另一编制改名
        const entries = [...sigMap2.entries()];
        entries.sort((a, b) => {
            const ra = a[1].some(r => isRegionLegionName(effectiveLegionName(r)) && cultureNameByRegion.get(r.region as RegionType) === name) ? -1 : 0;
            const rb = b[1].some(r => isRegionLegionName(effectiveLegionName(r)) && cultureNameByRegion.get(r.region as RegionType) === name) ? -1 : 0;
            return ra - rb;
        });
        for (let i = 1; i < entries.length; i++) {
            const rows = entries[i][1];
            // 新名字优先用「势力名 + 军团」（effectiveLegionName 的兜底同款，最自然）；
            // 撞名了再退到「原名·文化标签军团」，还撞就加序号。
            let candidate = `${rows[0].factionName}军团`;
            if (takenNames.has(candidate)) {
                const label = REGION_LABELS[rows[0].region as RegionType] ?? rows[0].region;
                candidate = `${name.replace(/军团$/, '')}·${label}军团`;
                let n2 = 2;
                while (takenNames.has(candidate)) candidate = `${name.replace(/军团$/, '')}·${label}${n2++}军团`;
            }
            takenNames.add(candidate);
            for (const row of rows) {
                const custom = localCustomCompositions[row.factionId];
                if (!custom) continue;   // 跟随文化默认的不动（文化军团保名）
                localCustomCompositions[row.factionId] = { ...custom, legionName: candidate, legionType: 'sub' };
                actions.push(`${row.factionName}：${name} → ${candidate}（同名不同编，保留编制改名）`);
                changed++;
            }
        }
    }

    if (changed === 0) {
        const remain = computeLegionNameViolations();
        return remain.length === 0
            ? '✅ 没有需要修复的军团（同名不同编已修复）'
            : '⚠️ 仍有同名不同编的军团，请在编辑器里逐个改出相同编制或改名。';
    }
    buildRows();
    applyFilter();
    await saveAllCompositions();
    const NL = String.fromCharCode(10);
    const head = `✅ 一键修复完成：${changed} 处`;
    const shown = actions.length <= 12 ? actions : actions.slice(0, 12);
    const suffix = actions.length > 12 ? `${NL}…共 ${actions.length} 条` : '';
    return [head, ...shown].join(NL) + suffix;
}

function openLegionViolationsModal(violations: string[]): void {
    const existing = document.querySelector('.le-modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'le-modal-overlay';
    overlay.innerHTML = `
    <div class="le-modal" style="width:720px;">
      <div class="le-modal-header">
        <span style="color:#ffb4a8;">⚠️ 军团校验违规 (${violations.length})</span>
        <button type="button" class="le-btn le-btn-sm" id="le-viol-close">✕</button>
      </div>
      <div class="le-modal-body" style="grid-template-columns:1fr;gap:8px;max-height:70vh;">
        <div style="font-size:12px;color:#a89f8f;margin-bottom:4px;">① 一个军团只能有一种编制（同名同编）；② 战斗兵模（步兵、骑兵、远程、攻城、船只）都要被军团套用；③ 所有军团必须都被武将套用；④ 一个军团只能一排象兵或一排战车（不能同时出现）。以下违规请查看：</div>
        ${violations.map(v => `<div style="background:#2a1616;border:1px solid #5a2a2a;border-radius:4px;padding:8px 10px;font-size:12px;color:#ffd0c0;">${v}</div>`).join('')}
        <button type="button" class="le-btn le-btn-primary" id="le-auto-fix" style="width:100%;font-size:13px;padding:9px;margin-top:4px;">🛠 一键修复（同名不同编：后来的自动改名）</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#le-viol-close')?.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    overlay.querySelector('#le-auto-fix')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const msg = await autoFixLegions();
        showToast(msg);
        close();
        const remain = computeLegionNameViolations();
        if (remain.length > 0) openLegionViolationsModal(remain);
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', function onKey(e: KeyboardEvent) {
        if ((e as any).isComposing) return;
        if (e.key === 'Escape') { window.removeEventListener('keydown', onKey); close(); }
    });
}

function updateRowUnit(legion: EditableLegion, rowIdx: number, unitId: string): void {
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

    const sc = legion.slots[rowIdx]?.scale ?? defScale;
    legion.slots[rowIdx] = { type: unitId, count: counts[rowIdx], scale: sc };
    if (mode !== 'square') {
        if (!legion.tierSlots) legion.tierSlots = {};
        legion.tierSlots[counts[rowIdx]] = { type: unitId, scale: sc };
    }
}

function updateRowScale(legion: EditableLegion, rowIdx: number, scale: number): void {
    if (legion.slots[rowIdx]) {
        legion.slots[rowIdx].scale = scale;
        const cnt = legion.slots[rowIdx].count;
        if (legion.formationMode !== 'square' && (cnt === 2 || cnt === 3 || cnt === 4)) {
            if (!legion.tierSlots) legion.tierSlots = {};
            legion.tierSlots[cnt] = { type: legion.slots[rowIdx].type, scale };
        }
    }
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openUnitPickerModal(row: FactionLegionRow, rowIdx: number): void {
    const overlay = document.createElement('div');
    overlay.className = 'le-modal-overlay';

    const isCommander = rowIdx === -1;
    let currentTab: UnitCategory = isCommander ? 'hero' : 'infantry';
    let unitSearch = '';
    let isSearchComposing = false;
    let unitStatusFilter: 'all' | 'applied' | 'unapplied' = 'all';
    /** 兵种鉴赏同款「子分类」筛选（刀盾/长矛/弓手/弩手/战骑/弓骑…） */
    let currentSub: 'all' | SubCategory = 'all';
    const rowTitle = isCommander ? '英雄（主队 · 第 10 队）' : ['前排', '中坚', '后排'][rowIdx];
    const isAllowed = (u: { id: string; category: UnitCategory }) => {
        if (!isCommander) return true;
        if (u.category !== 'hero') return false;
        const sub = getUnitSubcategory(u.id);
        if (sub === 'naval_hero' || sub === 'noncombat_hero') return false;
        if (['scythian_scout', 'norse_chieftain', 'sosso_guard', 'master_of_the_templar', 'sunda_royal_fighter'].includes(u.id)) return false;
        return true;
    };

    // 预计算全部军团的兵种/英雄使用情况
    const distinctMap = getAllDistinctLegions();
    const usageMap = new Map<string, string[]>();
    for (const d of distinctMap.values()) {
        if (isCommander) {
            if (d.commanderUnit) {
                if (!usageMap.has(d.commanderUnit)) usageMap.set(d.commanderUnit, []);
                if (!usageMap.get(d.commanderUnit)!.includes(d.name)) usageMap.get(d.commanderUnit)!.push(d.name);
            }
            for (const s of d.slots) {
                if (s.type) {
                    if (!usageMap.has(s.type)) usageMap.set(s.type, []);
                    if (!usageMap.get(s.type)!.includes(d.name)) usageMap.get(s.type)!.push(d.name);
                }
            }
        } else {
            for (const s of d.slots) {
                if (s.type) {
                    if (!usageMap.has(s.type)) usageMap.set(s.type, []);
                    if (!usageMap.get(s.type)!.includes(d.name)) usageMap.get(s.type)!.push(d.name);
                }
            }
            if (d.commanderUnit) {
                if (!usageMap.has(d.commanderUnit)) usageMap.set(d.commanderUnit, []);
                if (!usageMap.get(d.commanderUnit)!.includes(d.name)) usageMap.get(d.commanderUnit)!.push(d.name);
            }
        }
    }

    const closeModal = () => {
        window.removeEventListener('keydown', handleKey);
        hideThumbZoom();   // 关弹窗先收放大镜，别把浮层留在页面上
        overlay.remove();
    };

    const handleKey = (e: KeyboardEvent) => {
        if (!e.isComposing && e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKey);

    const renderModalContent = () => {
        // 切 tab / 搜索会整块换掉图标节点，mouseout 不一定补发 —— 先主动收起放大镜
        hideThumbZoom();
        const q = unitSearch.trim().toLowerCase();

        const candidateUnits = DE_UNITS_CATALOG.filter(u => {
            if (!isAllowed(u)) return false;
            if (q) return true; // 搜索模式跨 tab
            return u.category === currentTab;
        }).filter(u => currentSub === 'all' || getUnitSubcategory(u.id) === currentSub);

        const appliedTotal = candidateUnits.filter(u => (usageMap.get(u.id)?.length ?? 0) > 0).length;
        const unappliedTotal = candidateUnits.length - appliedTotal;

        const units = candidateUnits.filter(u => {
            const used = usageMap.get(u.id) ?? [];
            const isApplied = used.length > 0;
            if (unitStatusFilter === 'applied' && !isApplied) return false;
            if (unitStatusFilter === 'unapplied' && isApplied) return false;

            if (!q) return true;
            if (u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)) return true;
            if (isApplied && (q === '已套用' || q === '已用' || q === 'applied')) return true;
            if (!isApplied && (q === '未套用' || q === '闲置' || q === '空闲' || q === 'unapplied')) return true;
            if (used.some(leg => leg.toLowerCase().includes(q))) return true;
            return false;
        }).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN') || a.id.localeCompare(b.id));

        const subOptions = (SUBCATEGORY_BY_CATEGORY[currentTab] || []).filter(s => !isCommander || (s !== 'naval_hero' && s !== 'noncombat_hero'));
        const subCount = (s: SubCategory) => DE_UNITS_CATALOG.filter(u => isAllowed(u) && getUnitSubcategory(u.id) === s).length;
        const modalTabsHtml = isCommander
            ? `<div class="le-modal-tab active" data-cat="hero">👑 战斗英雄 (${DE_UNITS_CATALOG.filter(u => isAllowed(u) && u.category === 'hero').length})</div>`
            : CATEGORY_ORDER.map(c => {
                const count = DE_UNITS_CATALOG.filter(u => u.category === c).length;
                const icon = c === 'infantry' ? '🛡️ ' : c === 'cavalry' ? '🐎 ' : c === 'ranged' ? '🏹 ' : c === 'siege' ? '⚙️ ' : c === 'naval' ? '🚢 ' : c === 'hero' ? '👑 ' : c === 'civilian' ? '🧺 ' : '🐾 ';
                return `<div class="le-modal-tab ${currentTab === c ? 'active' : ''}" data-cat="${c}">${icon}${CATEGORY_LABEL[c]} (${count})</div>`;
            }).join('');
        overlay.innerHTML = `
        <div class="le-modal">
          <div class="le-modal-header">
            <span>选择【${rowTitle}】兵种</span>
            <button type="button" class="le-btn le-btn-sm" id="le-modal-close" style="font-size:14px;padding:2px 8px;cursor:pointer;">✕</button>
          </div>
          <div class="le-modal-tabs">
            ${modalTabsHtml}
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px 0;">
            <span style="font-size:11px;color:#a89f8f;white-space:nowrap;">子分类:</span>
            <select id="le-unit-subfilter" class="le-select" style="flex:1;padding:2px 6px;font-size:12px;">
              <option value="all">全部子类 (${DE_UNITS_CATALOG.filter(u => isAllowed(u) && u.category === currentTab).length})</option>
              ${subOptions.map(s => `<option value="${s}" ${currentSub === s ? 'selected' : ''}>${SUBCATEGORY_LABEL[s]} (${subCount(s)})</option>`).join('')}
            </select>
          </div>
          <input id="le-unit-search" class="le-input" type="search" placeholder="🔍 搜索兵种名称 / 军团名 / ID…" style="margin:8px 12px;width:calc(100% - 24px);box-sizing:border-box;" />
          <div style="display:flex;align-items:center;gap:8px;padding:0 12px;margin-bottom:8px;flex-wrap:wrap;">
            <span style="font-size:11px;color:#a89f8f;">全体朝向:</span>
            <select id="le-thumb-dir" class="le-select" style="padding:2px 6px;font-size:12px;">
              <option value="2" ${unitThumbDir === 2 ? 'selected' : ''}>东南 (2)</option>
              <option value="3" ${unitThumbDir === 3 ? 'selected' : ''}>南 (3)</option>
              <option value="1" ${unitThumbDir === 1 ? 'selected' : ''}>东 (1)</option>
              <option value="0" ${unitThumbDir === 0 ? 'selected' : ''}>东北 (0)</option>
              <option value="7" ${unitThumbDir === 7 ? 'selected' : ''}>北 (7)</option>
              <option value="6" ${unitThumbDir === 6 ? 'selected' : ''}>西北 (6)</option>
              <option value="5" ${unitThumbDir === 5 ? 'selected' : ''}>西 (5)</option>
              <option value="4" ${unitThumbDir === 4 ? 'selected' : ''}>西南 (4)</option>
            </select>
            <div style="display:inline-flex;gap:3px;align-items:center;margin-left:4px;">
              <button type="button" data-status="all" class="le-pk-status-btn" style="background:${unitStatusFilter === 'all' ? '#4a3e2c' : '#1e1c18'};border:1px solid ${unitStatusFilter === 'all' ? '#c8a84b' : '#363024'};color:${unitStatusFilter === 'all' ? '#f5e6c8' : '#8a8378'};border-radius:4px;padding:3px 7px;cursor:pointer;font-size:11px;">全部 (${candidateUnits.length})</button>
              <button type="button" data-status="applied" class="le-pk-status-btn" style="background:${unitStatusFilter === 'applied' ? '#183620' : '#1e1c18'};border:1px solid ${unitStatusFilter === 'applied' ? '#38a169' : '#363024'};color:${unitStatusFilter === 'applied' ? '#7ee787' : '#8a8378'};border-radius:4px;padding:3px 7px;cursor:pointer;font-size:11px;">✓ 已套用 (${appliedTotal})</button>
              <button type="button" data-status="unapplied" class="le-pk-status-btn" style="background:${unitStatusFilter === 'unapplied' ? '#352417' : '#1e1c18'};border:1px solid ${unitStatusFilter === 'unapplied' ? '#c05621' : '#363024'};color:${unitStatusFilter === 'unapplied' ? '#fbd38d' : '#8a8378'};border-radius:4px;padding:3px 7px;cursor:pointer;font-size:11px;">⚪ 未套用 (${unappliedTotal})</button>
            </div>
            <span style="margin-left:auto;font-size:11px;color:#8a8070;white-space:nowrap;">🔍 悬停放大 · 显示 ${units.length} 个</span>
          </div>
          <div class="le-modal-body">
            ${units.map(u => {
              const sub = getUnitSubcategory(u.id);
              const subText = sub ? ` · ${SUBCATEGORY_LABEL[sub]}` : '';
              const tierText = getUnitTier(u) === 'elite' ? ' · ⭐精锐' : '';
              const used = usageMap.get(u.id) ?? [];
              const isApplied = used.length > 0;
              const roleTxt = isCommander ? '作为主将' : '作为编制';
              const usedTooltip = isApplied
                  ? `【${u.name}】${roleTxt}已套用于 ${used.length} 支军团：\n` + used.map((l, i) => `  ${i + 1}. ${l}`).join('\n')
                  : `【${u.name}】当前未在任何军团中套用（闲置）`;
              return `
              <div class="le-unit-card" data-uid="${u.id}" title="${esc(usedTooltip)}" style="${isApplied ? 'background:#162218;border-color:#2d5a38;' : ''}">
                <canvas class="le-unit-thumb" data-uid="${u.id}" width="64" height="64"></canvas>
                <div class="le-unit-card-text" style="min-width:0;flex:1;">
                  <div class="le-unit-card-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.name}</div>
                  <div class="le-unit-card-cat">${CATEGORY_LABEL[u.category]}${subText}${tierText}</div>
                  ${isApplied ? `
                    <div style="font-size:10px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(usedTooltip)}">
                      <span style="display:inline-block;padding:0 4px;border-radius:2px;background:#183620;border:1px solid #2d6639;color:#7ee787;font-weight:bold;font-size:9px;">✓ 已套用${used.length > 1 ? ` (${used.length})` : ''}</span>
                      <span style="color:#9ae6b4;font-size:10px;margin-left:2px;">${esc(used[0])}</span>
                    </div>
                  ` : `
                    <div style="font-size:10px;margin-top:3px;">
                      <span style="display:inline-block;padding:0 4px;border-radius:2px;background:#1d1b17;border:1px solid #332d24;color:#7a7266;font-size:9px;">⚪ 未套用（闲置）</span>
                    </div>
                  `}
                </div>
              </div>
            `;}).join('')}
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
                currentSub = 'all';
                renderModalContent();
            });
        });

        overlay.querySelectorAll('.le-pk-status-btn').forEach(b => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                unitStatusFilter = (b as HTMLElement).dataset.status as 'all' | 'applied' | 'unapplied';
                renderModalContent();
            });
        });

        // 子分类筛选（兵种鉴赏同款二级分类）
        overlay.querySelector('#le-unit-subfilter')?.addEventListener('change', (e) => {
            currentSub = ((e.target as HTMLSelectElement).value || 'all') as 'all' | SubCategory;
            renderModalContent();
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

        // 全体朝向：切换后重置并重画全部缩略图
        const thumbDirSel = overlay.querySelector('#le-thumb-dir') as HTMLSelectElement | null;
        thumbDirSel?.addEventListener('change', () => {
            unitThumbDir = parseInt(thumbDirSel.value, 10) || 2;
            redrawUnitThumbsIn(overlay);
        });

        overlay.querySelectorAll('.le-unit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = (card as HTMLElement).dataset.uid!;
                if (currentEditingLegion) {
                    if (isCommander) {
                        currentEditingLegion.commanderUnit = uid;
                    } else {
                        updateRowUnit(currentEditingLegion, rowIdx, uid);
                    }
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
    // 悬停放大只挂一次（事件委托）：renderModalContent 换 tab / 搜索重建图标节点后依然生效
    attachUnitThumbZoom(overlay);
    renderModalContent();

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// ============================================================
// 6.5 兵种图鉴 (Unit Catalog) —— 查看 / 排序 / 筛选全部 DE 兵种
// ============================================================

/** 类别排序权重：按 步兵 → 骑兵 → 远程 → 攻城 → 船只 → 英雄 的战场站位顺序，而非拼音顺序。 */
const CATEGORY_ORDER: UnitCategory[] = ['infantry', 'cavalry', 'ranged', 'siege', 'naval', 'hero', 'civilian', 'other'];

function switchMainView(view: MainView): void {
    if (mainView === view) return;
    mainView = view;

    // 切视图必须停掉上一个 Canvas 循环，否则两套预览会同时跑在同一个 rAF 上互相踩。
    if (animTimer !== null) {
        cancelAnimationFrame(animTimer);
        animTimer = null;
    }
    if (stratAnimTimer !== null) {
        cancelAnimationFrame(stratAnimTimer);
        stratAnimTimer = null;
    }

    const isUnits = view === 'units';
    const isNaval = view === 'naval';   // 海军栏目复用左侧势力表与搜索栏
    const isStrategic = view === 'strategic';
    // 🔴 [2026-09-15] 军团编辑：独占主区，右侧势力配置面板和两个工具栏一起收起
    const isLegions = view === 'legions';
    const legionWrap = document.getElementById('le-legion-wrap')!;
    legionWrap.style.display = isLegions ? 'flex' : 'none';
    els.panel.style.display = isLegions ? 'none' : '';
    els.panel.classList.toggle('is-units', isUnits);
    els.panel.classList.toggle('is-strategic', isStrategic);
    els.toolbarFactions.style.display = (isUnits || isLegions) ? 'none' : '';
    els.toolbarUnits.style.display = isUnits ? '' : 'none';
    els.tableWrap.style.display = (isUnits || isLegions) ? 'none' : '';
    els.catTableWrap.style.display = isUnits ? '' : 'none';
    if (isLegions) {
        mountLegionPanel(legionWrap);
        document.querySelectorAll('.le-viewtab').forEach(x => {
            x.classList.toggle('active', (x as HTMLElement).dataset.view === view);
        });
        return;
    }

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
            else if (isStrategic) renderStrategicPanel(row);
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
        ? (CATEGORY_ORDER as UnitCategory[]).map(c => [
            `${CATEGORY_LABEL[c]} (${DE_UNITS_CATALOG.filter(u => u.category === c).length})`,
            SUBCATEGORY_BY_CATEGORY[c]
        ])
        : [[
            `${CATEGORY_LABEL[cat]} (${DE_UNITS_CATALOG.filter(u => u.category === cat).length})`,
            SUBCATEGORY_BY_CATEGORY[cat]
        ]];
    const totalInCat = cat === 'all'
        ? DE_UNITS_CATALOG.length
        : DE_UNITS_CATALOG.filter(u => u.category === cat).length;
    els.subFilter.innerHTML = `<option value="all">全部子类 (${totalInCat})</option>`
        + groups.map(([label, subs]) =>
            `<optgroup label="${label}">${subs.map(s => {
                const count = DE_UNITS_CATALOG.filter(u => getUnitSubcategory(u.id) === s).length;
                return `<option value="${s}">${SUBCATEGORY_LABEL[s]} (${count})</option>`;
            }).join('')}</optgroup>`
        ).join('');
}

function applyCatalogFilter(): void {
    const q = catalogSearch.trim().toLowerCase();
    catalogRows = DE_UNITS_CATALOG.filter(u => {
        if (catalogCatFilter !== 'all' && u.category !== catalogCatFilter) return false;
        if (catalogSubFilter !== 'all' && getUnitSubcategory(u.id) !== catalogSubFilter) return false;
        if (catalogTierFilter !== 'all' && getUnitTier(u) !== catalogTierFilter) return false;
        if (catalogAgeFilter !== 'all' && u.age !== catalogAgeFilter) return false;
        if (catalogSrcFilter !== 'all' && getUnitSource(u.id) !== catalogSrcFilter) return false;
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
    const infC = DE_UNITS_CATALOG.filter(u => u.category === 'infantry').length;
    const cavC = DE_UNITS_CATALOG.filter(u => u.category === 'cavalry').length;
    const ranC = DE_UNITS_CATALOG.filter(u => u.category === 'ranged').length;
    const sieC = DE_UNITS_CATALOG.filter(u => u.category === 'siege').length;
    const navC = DE_UNITS_CATALOG.filter(u => u.category === 'naval').length;
    const herC = DE_UNITS_CATALOG.filter(u => u.category === 'hero').length;

    els.catStats.innerHTML =
        `全部 <b>${DE_UNITS_CATALOG.length}</b>`
        + ` <span style="color:#8c8273;margin:0 4px;">|</span> 步 <b>${infC}</b> · 骑 <b>${cavC}</b> · 远 <b>${ranC}</b> · 械 <b>${sieC}</b> · 船 <b>${navC}</b> · 雄 <b>${herC}</b>`
        + ` <span style="color:#8c8273;margin:0 4px;">|</span> 精锐 <b style="color:#f5d78e">${eliteTotal}</b>`
        + ` <span style="color:#8c8273;margin:0 4px;">|</span> 当前显示 <b>${catalogRows.length}</b>`;
}

/**
 * 🔴 [2026-10-19 主人令「给兵模添加一个标签，相同兵模的 ID 可以一目了然」]
 * 兵模标签 = 该兵种所借素材目录（pathPrefix 最后一段，大写）。
 * 同一个标签 = 同一套兵模样子（同一张/同一组贴图）；标签后的人数 = 全库有多少个兵种共用这个兵模。
 */
function unitModelTag(u: DeUnitDef): string {
    const seg = u.pathPrefix.split('/').filter(Boolean).pop();
    return (seg ?? u.id).toUpperCase();
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
        if (catalogSortCol === 'source') {
            const order: Array<DeSourceType | 'none'> = [...DE_SOURCE_TYPE_ORDER, 'none'];
            const d = order.indexOf(getUnitSource(a.id)) - order.indexOf(getUnitSource(b.id));
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
        if (catalogSortCol === 'power') {
            const pa = getCombatPower(a.id)?.index, pb = getCombatPower(b.id)?.index;
            if (pa == null && pb == null) return a.name.localeCompare(b.name, 'zh-CN');
            if (pa == null) return 1;
            if (pb == null) return -1;
            if (pa !== pb) return dir * (pa - pb);
            return a.name.localeCompare(b.name, 'zh-CN');
        }
        if (catalogSortCol === 'hp' || catalogSortCol === 'atk' || catalogSortCol === 'rng') {
            // 没属性的（船只等）一律沉底，不跟着正反序来回跳
            const sa = getUnitStats(a.id), sb = getUnitStats(b.id);
            if (!sa && !sb) return a.name.localeCompare(b.name, 'zh-CN');
            if (!sa) return 1;
            if (!sb) return -1;
            const d = sa[catalogSortCol] - sb[catalogSortCol];
            if (d !== 0) return dir * d;
            return a.name.localeCompare(b.name, 'zh-CN');
        }
        if (catalogSortCol === 'model') {
            const d = unitModelTag(a).localeCompare(unitModelTag(b));
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

    const prevScroll = els.catTableWrap.scrollTop;
    const arrow = (col: string) => catalogSortCol === col
        ? (catalogSortAsc ? ' <span style="color:#e0c888;">▲</span>' : ' <span style="color:#e0c888;">▼</span>')
        : '';

    // 兵模标签 → 共用同一套素材的全部兵种 id（含自己）
    const modelGroups = new Map<string, string[]>();
    for (const u of DE_UNITS_CATALOG) {
        const tag = unitModelTag(u);
        if (!modelGroups.has(tag)) modelGroups.set(tag, []);
        modelGroups.get(tag)!.push(u.id);
    }

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
          <th data-col="source" style="width:80px;" title="DE 来源：城堡兵、文化兵、区域兵、特殊兵、普通兵、英雄、精英兵">来源${arrow('source')}</th>
          <th data-col="power" style="width:62px;" title="综合战力指数：√(有效输出 × 有效血)，全表中位数=100。只作粗排序，不含相克">战力${arrow('power')}</th>
          <th data-col="hp" style="width:52px;" title="DE hit_points">血${arrow('hp')}</th>
          <th data-col="atk" style="width:52px;" title="DE displayed_attack 基础攻击">攻${arrow('atk')}</th>
          <th style="width:62px;" title="近防 / 远防（DE melee armor / pierce armor）">防</th>
          <th data-col="rng" style="width:58px;" title="DE max_range，单位「格」；白刃 = 贴身">射程${arrow('rng')}</th>
          <th style="width:52px;" title="DE reload_time 装填秒数，越小越快">射速</th>
          <th data-col="id" style="width:170px;">兵种 ID${arrow('id')}</th>
          <th data-col="model" style="width:104px;" title="兵模标签 = 同一套素材（同一张/同一组贴图）；×人数 = 全库共用这个兵模的兵种数，「独」= 全库只有它自己用这套素材">兵模${arrow('model')}</th>
          <th>素材目录</th>
        </tr>
      </thead>
      <tbody>
        ${catalogRows.map(u => {
            const tier = getUnitTier(u);
            const sub = getUnitSubcategory(u.id);
            const st = getUnitStats(u.id);
            const pw = getCombatPower(u.id);
            const modelTag = unitModelTag(u);
            const modelPeers = modelGroups.get(modelTag) ?? [u.id];
            const modelShared = modelPeers.length > 1;
            const dash = `<span style="color:#5a5348;">—</span>`;
            return `
          <tr data-uid="${u.id}" class="${u.id === selectedUnitId ? 'selected' : ''}">
            <td class="cell-thumb"><canvas class="le-cat-thumb" data-uid="${u.id}" width="44" height="44"></canvas></td>
            <td>
              <div style="display:flex;align-items:center;gap:6px;">
                <b style="font-size:13px;">${u.name}</b>
                <button type="button" class="le-quick-rename-btn" data-uid="${u.id}" data-uname="${u.name}" title="修改兵种名称" style="background:transparent;border:none;cursor:pointer;font-size:12px;opacity:0.6;padding:1px 3px;border-radius:3px;color:#f5e6c8;">✏️</button>
              </div>
            </td>
            <td><span class="age-tag age-${u.age}" title="${AGE_YEARS[u.age].span}　${AGE_YEARS[u.age].anchor}">${AGE_LABEL[u.age]}</span></td>
            <td>${tier === 'elite'
                ? `<span class="tier-tag tier-elite">⭐ 精锐</span>`
                : `<span class="tier-tag tier-base">普通</span>`}</td>
            <td><span class="cat-tag">${CATEGORY_LABEL[u.category]}</span></td>
            <td>${sub ? `<span class="sub-tag">${SUBCATEGORY_LABEL[sub]}</span>` : `<span style="color:#7a7266;">—</span>`}</td>
            <td><span class="sub-tag"${getUnitSource(u.id) === 'none' ? ' style="opacity:.6;"' : ''}>${srcLabel(getUnitSource(u.id))}</span></td>
            <td class="stat-cell">${pw ? `<b style="color:${pw.index >= 200 ? '#e08a5a' : pw.index >= 100 ? '#e0c060' : '#8fae8f'};font-size:13px;">${pw.index}</b>` : dash}</td>
            <td class="stat-cell">${st ? `<b style="color:#d98a7a;">${st.hp}</b>` : dash}</td>
            <td class="stat-cell">${st ? `<b style="color:#e0c060;">${st.atk}</b>` : dash}</td>
            <td class="stat-cell">${st ? `<span style="color:#9fb8c8;">${st.meleeArmor}/${st.pierceArmor}</span>` : dash}</td>
            <td class="stat-cell">${st ? (st.rng > 0 ? rangeInTiles(st.rng) : `<span style="color:#7a7266;">白刃</span>`) : dash}</td>
            <td class="stat-cell">${st ? st.reload : dash}</td>
            <td><span class="cell-id" style="margin-left:0;">${u.id}</span></td>
            <td><span class="sub-tag" style="font-family:monospace;${modelShared ? '' : 'color:#f0d080;'}" title="${modelShared ? '共用兵模（' + modelPeers.length + ' 个兵种）：' + modelPeers.join('、') : '独用兵模：全库只有它自己用这套素材'}">${modelTag}${modelShared ? ' ×' + modelPeers.length : ' 独'}</span></td>
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

    els.catTableWrap.querySelectorAll('.le-quick-rename-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const uid = (btn as HTMLElement).dataset.uid!;
            selectedUnitId = uid;
            els.catTableWrap.querySelectorAll('tr[data-uid]').forEach(o => {
                o.classList.toggle('selected', (o as HTMLElement).dataset.uid === selectedUnitId);
            });
            renderUnitPanel(selectedUnitId);
            const currentName = (btn as HTMLElement).dataset.uname || '';
            const newName = window.prompt(`修改兵种名称（ID: ${uid}）：`, currentName);
            if (newName !== null && newName.trim() && newName.trim() !== currentName) {
                doRenameUnit(uid, newName.trim());
            }
        });
    });

    observeThumbs(els.catTableWrap);
    els.catTableWrap.scrollTop = prevScroll;
}

/**
 * 兵种改名：同步修改 main.ts (DE_UNITS_CATALOG), WarTypes.ts, NavalShipTiers.ts 并写盘
 */
async function doRenameUnit(unitId: string, newName: string): Promise<boolean> {
    const trimmed = newName.trim();
    if (!trimmed) {
        showToast('❌ 兵种名称不能为空', true);
        return false;
    }
    const u = DE_UNITS_MAP.get(unitId);
    if (u && u.name === trimmed) {
        showToast('名称未改变');
        return false;
    }
    try {
        const res = await fetch('/api/rename-unit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId, newName: trimmed }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
            showToast(`❌ 改名失败: ${data.error || res.statusText}`, true);
            return false;
        }
        if (u) u.name = trimmed;
        const catalogItem = DE_UNITS_CATALOG.find(x => x.id === unitId);
        if (catalogItem) catalogItem.name = trimmed;
        if (WAR_TYPES[unitId]) {
            WAR_TYPES[unitId].name = trimmed;
        }

        // 跨页面广播联通：通知 de-wiki.html 科技树同步重绘
        try {
            localStorage.setItem('de-wiki-unit-rename', JSON.stringify({ unitId, newName: trimmed, t: Date.now() }));
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('de-wiki-sync');
                bc.postMessage({ type: 'unit-renamed', unitId, newName: trimmed });
                bc.close();
            }
        } catch {}

        showToast(`✅ 兵种改名已保存：【${trimmed}】`);
        // [2026-10-16 主人报「改一次名字就刷新一次，很慢」] 不再整表重建（全部缩略图重画 + 全势力 buildRows），
        // 兵种鉴赏只就地改这一行；势力表行数据只存兵种 id、名字是渲染时取的，故不必 buildRows，延后重绘即可。
        const catRow = els.catTableWrap.querySelector(`tr[data-uid="${CSS.escape(unitId)}"]`);
        const catName = catRow?.querySelector('td b');
        if (catName) catName.textContent = trimmed;
        const catBtn = catRow?.querySelector('.le-quick-rename-btn') as HTMLElement | null;
        if (catBtn) catBtn.dataset.uname = trimmed;
        renderUnitPanel(unitId);
        setTimeout(() => { applyFilter(); renderTable(); }, 0);
        return true;
    } catch (err: any) {
        showToast(`❌ 改名网络错误: ${err.message}`, true);
        return false;
    }
}

/** 接收来自 de-wiki.html 等页面的兵种改名事件，实时刷新兵种鉴赏与军团表 */
function applyRemoteUnitRename(unitId: string, newName: string): void {
    const trimmed = (newName || '').trim();
    if (!unitId || !trimmed) return;
    const u = DE_UNITS_MAP.get(unitId);
    if (!u || u.name === trimmed) return;
    u.name = trimmed;
    const catalogItem = DE_UNITS_CATALOG.find(x => x.id === unitId);
    if (catalogItem) catalogItem.name = trimmed;
    if (WAR_TYPES[unitId]) WAR_TYPES[unitId].name = trimmed;
    applyCatalogFilter();
    renderCatalogTable();
    if (selectedUnitId === unitId && mainView === 'units') {
        renderUnitPanel(unitId);
    }
    buildRows();
    applyFilter();
    renderTable();
}

async function syncUnitNamesFromServer(): Promise<void> {
    try {
        const res = await fetch(`/de-techtree/legion-names.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const names: Record<string, string> = data?.names || {};
        let changed = false;
        let changedSelected = false;
        for (const [uid, name] of Object.entries(names)) {
            const u = DE_UNITS_MAP.get(uid);
            if (u && name && u.name !== name) {
                u.name = name;
                const cat = DE_UNITS_CATALOG.find(x => x.id === uid);
                if (cat) cat.name = name;
                if (WAR_TYPES[uid]) WAR_TYPES[uid].name = name;
                changed = true;
                if (selectedUnitId === uid) changedSelected = true;
            }
        }
        if (changed) {
            applyCatalogFilter();
            renderCatalogTable();
            if (changedSelected && selectedUnitId && mainView === 'units') {
                renderUnitPanel(selectedUnitId);
            }
            buildRows();
            applyFilter();
            renderTable();
        }
    } catch { /* ignore */ }
}

if (typeof window !== 'undefined') {
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('de-wiki-sync');
            bc.onmessage = (ev) => {
                if (ev?.data?.type === 'unit-renamed' && ev.data.unitId && ev.data.newName) {
                    applyRemoteUnitRename(String(ev.data.unitId), String(ev.data.newName));
                }
            };
        }
    } catch { /* ignore */ }
    window.addEventListener('storage', (e) => {
        if (e.key === 'de-wiki-unit-rename' && e.newValue) {
            try {
                const d = JSON.parse(e.newValue);
                if (d?.unitId && d?.newName) applyRemoteUnitRename(String(d.unitId), String(d.newName));
            } catch { /* ignore */ }
        }
    });
    window.addEventListener('focus', () => { void syncUnitNamesFromServer(); });
}

/**
 * 兵种类别、子分类与时代更新：同步修改 main.ts (DE_UNITS_CATALOG, UNIT_SUBCATEGORY) 并写盘
 */
async function doUpdateUnitClassification(
    unitId: string,
    newCategory: UnitCategory,
    newSubcategory: SubCategory,
    newAge: UnitAge
): Promise<boolean> {
    const u = DE_UNITS_MAP.get(unitId);
    const oldSub = getUnitSubcategory(unitId);
    if (u && u.category === newCategory && oldSub === newSubcategory && u.age === newAge) {
        showToast('分类与时代未作改动');
        return false;
    }
    try {
        const res = await fetch('/api/update-unit-meta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                unitId,
                category: newCategory,
                subcategory: newSubcategory,
                age: newAge,
            }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
            showToast(`❌ 分类保存失败: ${data.error || res.statusText}`, true);
            return false;
        }

        // 更新内存状态
        if (u) {
            u.category = newCategory;
            u.age = newAge;
        }
        const catalogItem = DE_UNITS_CATALOG.find(x => x.id === unitId);
        if (catalogItem) {
            catalogItem.category = newCategory;
            catalogItem.age = newAge;
        }
        UNIT_SUBCATEGORY[unitId] = newSubcategory;

        showToast(`✅ 兵种分类已更新：【${u?.name || unitId}】（${AGE_LABEL[newAge]} · ${CATEGORY_LABEL[newCategory]} · ${SUBCATEGORY_LABEL[newSubcategory]}）`);

        populateSubFilter();
        applyCatalogFilter();
        renderCatalogTable();
        renderUnitPanel(unitId);
        buildRows();
        applyFilter();
        renderTable();
        return true;
    } catch (err: any) {
        showToast(`❌ 保存网络错误: ${err.message}`, true);
        return false;
    }
}

const EDITABLE_UNIT_STATS = [
    { key: 'hp', label: '生命', min: 0, scale: 1 },
    { key: 'atk', label: '攻击', min: 0, scale: 1 },
    { key: 'meleeArmor', label: '近防', scale: 1 },
    { key: 'pierceArmor', label: '远防', scale: 1 },
    { key: 'rng', label: '射程（格；0为白刃）', min: 0, scale: 40 },
    { key: 'reload', label: '装填时间（秒；越小越快）', min: 0, scale: 1 },
    { key: 'spd', label: '移速（像素/秒）', min: 0, scale: 1 },
    { key: 'sz', label: '体型（倍率）', min: 0, scale: 1 },
] as const;

/** 右侧面板的「战斗属性」段：陆战兵种读 WAR_TYPES，船只读 NavalShipTiers。 */
function renderUnitStatsSection(u: DeUnitDef): string {
    const box = (label: string, value: string, tip = '') =>
        `<div class="le-stat-box" ${tip ? `title="${tip}"` : ''}>
           <div class="le-stat-label">${label}</div><div class="le-stat-value">${value}</div>
         </div>`;

    const st = getUnitStats(u.id);
    if (st) {
        const bonus = st.bonus
            ? Object.entries(st.bonus).map(([c, v]) => `对${armorClassName(+c)} <b>+${v}</b>`).join('、')
            : '无';
        const tags = st.armorTags?.length ? st.armorTags.map(armorClassName).join('、') : '无';
        const flags = [
            st.aoe ? '范围伤' : '',
            st.kite ? `放风筝 ${st.kite}px` : '',
            st.dmgType === 'pierce' ? '穿刺伤害' : '近战伤害',
        ].filter(Boolean).join(' · ');
        return `
    <div class="le-form-section">
      <div class="le-section-title"><span>战斗属性</span>
        <button type="button" class="le-btn le-btn-sm" id="le-stats-edit">✏️ 编辑属性</button>
      </div>
      <form id="le-stats-form" hidden style="margin:10px 0;padding:12px;border:1px solid #5b4b2d;border-radius:5px;">
        <div style="font-size:12px;color:#c8bda8;margin-bottom:10px;">修改此兵种的统一战斗属性，所有使用它的军团共用。</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
          ${EDITABLE_UNIT_STATS.map(f => `<label style="font-size:12px;color:#c8bda8;">${f.label}<input class="le-input" name="${f.key}" type="number" step="any" required ${'min' in f ? `min="${f.min}"` : ''} value="${st[f.key] / f.scale}" style="display:block;width:100%;box-sizing:border-box;margin-top:4px;"></label>`).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" class="le-btn le-btn-sm le-btn-primary" id="le-stats-save">💾 保存战斗属性</button>
          <button type="button" class="le-btn le-btn-sm" id="le-stats-cancel">取消</button>
        </div>
        <div id="le-stats-status" role="status" style="font-size:12px;color:#e0c888;margin-top:8px;"></div>
      </form>
      ${(() => {
          const pw = getCombatPower(u.id);
          if (!pw) return '';
          const refs = getPowerRefs();
          return `<div class="le-power-bar">
            <div><span class="le-power-num">${pw.index}</span><span class="le-power-unit">战力指数</span></div>
            <div class="le-power-note">
              √(有效输出 ${pw.dps.toFixed(1)} × 有效血 ${Math.round(pw.ehp)})，全表中位数 = 100<br>
              护甲折算参考敌方攻击：近战 ${refs.melee} / 穿刺 ${refs.pierce}（DE 护甲是减法，换参考值排名会变）<br>
              <b>不含相克</b>——长枪对骑兵那类加成只在特定对手身上兑现，看下面「加成伤害」
            </div>
          </div>`;
      })()}
      <div class="le-stat-grid">
        ${box('血', String(st.hp), 'DE hit_points')}
        ${box('攻', String(st.atk), 'DE displayed_attack（基础攻击，不含加成）')}
        ${box('近防', String(st.meleeArmor), 'DE melee armor')}
        ${box('远防', String(st.pierceArmor), 'DE pierce armor')}
        ${box('射程', st.rng > 0 ? `${rangeInTiles(st.rng)} 格` : '白刃', `DE max_range；表里存 ${st.rng}px = 格×40`)}
        ${box('射速', `${st.reload}s`, 'DE reload_time 装填时间，越小越快')}
        ${box('移速', String(st.spd), 'px/秒；DE 五维不含移速，这是 13 自己的档位')}
        ${box('体型', `×${st.sz}`, '渲染尺寸倍率')}
      </div>
      <div style="font-size:12px;color:#a89f8f;line-height:1.9;margin-top:8px;">
        <div>伤害特性：<span style="color:#c8bda8;">${flags}</span></div>
        <div>加成伤害：<span style="color:#c8bda8;">${bonus}</span></div>
        <div>自身护甲类：<span style="color:#8a8175;">${tags}</span></div>
      </div>
    </div>`;
    }

    const ship = getShipInfo(u);
    if (ship) {
        const regions = ship.regions.length
            ? ship.regions.map(r => REGION_LABELS[r as RegionType] ?? r).join('、')
            : '无文化指派（未被任何文化选用）';
        return `
    <div class="le-form-section">
      <div class="le-section-title"><span>战船属性</span>
        <span style="font-size:11px;color:#7a7266;font-weight:normal;">出处 NavalShipTiers</span>
      </div>
      <div style="font-size:12px;color:#a89f8f;line-height:1.9;">
        <div>武器：<span style="color:#e0c060;font-weight:bold;">${ship.weapons}</span></div>
        <div style="color:#7a7266;font-size:11px;">依据：${ship.why}</div>
        <div style="margin-top:6px;">使用文化：<span style="color:#c8bda8;">${regions}</span></div>
        <div style="color:#7a7266;font-size:11px;margin-top:6px;">海战只在战略地图，13 不结算船，所以战船没有血/攻/防五维。</div>
      </div>
    </div>`;
    }

    return `
    <div class="le-form-section">
      <div class="le-section-title"><span>战斗属性</span></div>
      <div style="font-size:12px;color:#7a7266;line-height:1.9;">WAR_TYPES 里没有这一条，暂无数值。</div>
    </div>`;
}

/** 查询使用指定兵种的所有军团及其势力 */
function getLegionsUsingUnit(unitId: string): { legionName: string; factions: string[] }[] {
    const map = new Map<string, Set<string>>();
    for (const r of allRows) {
        if (r.slots.some(s => s.type === unitId)) {
            const legName = effectiveLegionName(r);
            if (!map.has(legName)) {
                map.set(legName, new Set());
            }
            map.get(legName)!.add(r.factionName);
        }
    }
    return Array.from(map.entries()).map(([legionName, factionSet]) => ({
        legionName,
        factions: Array.from(factionSet),
    }));
}

/** 右侧面板：单兵种动作预览 + 素材帧信息 */
function renderUnitPanel(unitId: string): void {
    if (stratAnimTimer !== null) {
        cancelAnimationFrame(stratAnimTimer);
        stratAnimTimer = null;
    }
    els.panel.classList.remove('is-strategic');
    const u = DE_UNITS_MAP.get(unitId);
    if (!u) return;
    const tier = getUnitTier(u);
    const sub = getUnitSubcategory(u.id);
    const legionsUsing = getLegionsUsingUnit(unitId);

    els.panelContent.innerHTML = `
    <div style="background:#181614;border:1px solid #2a2620;border-radius:6px;padding:12px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="font-size:17px;font-weight:bold;color:#f5e6c8;" id="le-unit-title-name">${u.name}</div>
            <button type="button" id="le-unit-btn-toggle-rename" class="le-btn le-btn-xs" style="background:#2a2620;border:1px solid #4a4235;color:#e0c060;cursor:pointer;" title="修改兵种名称">✏️ 改名</button>
          </div>
          <div style="font-size:11px;color:#a89f8f;margin-top:3px;font-family:monospace;">${u.id}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <span class="age-tag age-${u.age}" title="${AGE_YEARS[u.age].anchor}">${AGE_LABEL[u.age]}　<span style="opacity:.65;font-weight:normal;">${AGE_YEARS[u.age].span}</span></span>
          <span class="cat-tag">${CATEGORY_LABEL[u.category]}</span>
          ${sub ? `<span class="sub-tag">${SUBCATEGORY_LABEL[sub]}</span>` : ''}
          <span class="sub-tag" title="DE 来源">${srcLabel(getUnitSource(u.id))}</span>
          ${tier === 'elite' ? `<span class="tier-tag tier-elite">⭐ 精锐</span>` : `<span class="tier-tag tier-base">普通</span>`}
          <button type="button" id="le-unit-btn-toggle-classify" class="le-btn le-btn-xs" style="background:#202820;border:1px solid #3c5a3c;color:#a0d8a0;cursor:pointer;margin-left:4px;" title="修改兵种类别、子分类与时代">⚙️ 设定分类/时代</button>
        </div>
      </div>
      <div id="le-unit-rename-row" style="display:none;margin-top:8px;padding-top:8px;border-top:1px dashed #332d24;">
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" id="le-unit-rename-input" value="${u.name}" style="background:#100e0c;border:1px solid #5a4f3d;color:#f5e6c8;padding:4px 8px;border-radius:4px;font-size:13px;width:180px;" placeholder="输入新兵种名">
          <button type="button" id="le-unit-rename-save" class="le-btn le-btn-sm le-btn-primary" style="cursor:pointer;">💾 保存</button>
          <button type="button" id="le-unit-rename-cancel" class="le-btn le-btn-sm" style="background:#222;border:1px solid #444;color:#aaa;cursor:pointer;">取消</button>
        </div>
      </div>
      <div id="le-unit-classify-row" style="display:none;margin-top:10px;padding:10px 12px;background:#141210;border:1px solid #3a3225;border-radius:5px;">
        <div style="font-size:12px;font-weight:bold;color:#e0c888;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
          <span>⚙️ 兵种类别、子分类与时代设定</span>
          <span style="font-size:11px;color:#8a8175;font-weight:normal;">自动同步 DE_UNITS_CATALOG 与 UNIT_SUBCATEGORY</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div>
            <label style="display:block;font-size:11px;color:#a89f8f;margin-bottom:4px;">时代</label>
            <select id="le-edit-unit-age" class="le-select" style="width:100%;padding:4px 6px;font-size:12px;">
              ${AGE_ORDER.map(a => `<option value="${a}" ${u.age === a ? 'selected' : ''}>${AGE_LABEL[a]} (${AGE_YEARS[a].span})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#a89f8f;margin-bottom:4px;">类别</label>
            <select id="le-edit-unit-category" class="le-select" style="width:100%;padding:4px 6px;font-size:12px;">
              ${CATEGORY_ORDER.map(c => `<option value="${c}" ${u.category === c ? 'selected' : ''}>${CATEGORY_LABEL[c]}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#a89f8f;margin-bottom:4px;">子分类</label>
            <select id="le-edit-unit-subcategory" class="le-select" style="width:100%;padding:4px 6px;font-size:12px;">
            </select>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
          <button type="button" id="le-unit-classify-save" class="le-btn le-btn-sm le-btn-primary" style="cursor:pointer;padding:3px 12px;">💾 保存分类与时代</button>
          <button type="button" id="le-unit-classify-cancel" class="le-btn le-btn-sm" style="background:#222;border:1px solid #444;color:#aaa;cursor:pointer;">取消</button>
        </div>
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

    ${renderUnitStatsSection(u)}

    <div class="le-form-section">
      <div class="le-section-title"><span>所属军团 (${legionsUsing.length})</span></div>
      <div style="font-size:12px;color:#a89f8f;line-height:1.8;">
        ${legionsUsing.length === 0
            ? '<span style="color:#7a7266;">暂无军团编制使用此兵种</span>'
            : legionsUsing.map(l => `
                <div style="margin-bottom:6px;">
                  <b style="color:#e0c888;">${l.legionName}</b>
                  <div style="color:#8a8175;font-size:11px;">使用势力（${l.factions.length}个）：${l.factions.slice(0, 10).join('、')}${l.factions.length > 10 ? ' 等' : ''}</div>
                </div>
              `).join('')}
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

    const statsForm = document.getElementById('le-stats-form') as HTMLFormElement | null;
    const originalStats = getUnitStats(unitId);
    if (statsForm && originalStats) {
        const expected = Object.fromEntries(EDITABLE_UNIT_STATS.map(f => [f.key, originalStats[f.key]]));
        document.getElementById('le-stats-edit')?.addEventListener('click', () => {
            statsForm.hidden = !statsForm.hidden;
            if (!statsForm.hidden) statsForm.querySelector('input')?.focus();
        });
        document.getElementById('le-stats-cancel')?.addEventListener('click', () => { statsForm.reset(); statsForm.hidden = true; });
        statsForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (!statsForm.reportValidity()) return;
            const values = Object.fromEntries(EDITABLE_UNIT_STATS.map(f => [f.key, Number((statsForm.elements.namedItem(f.key) as HTMLInputElement).value) * f.scale]));
            const button = document.getElementById('le-stats-save') as HTMLButtonElement;
            const status = document.getElementById('le-stats-status')!;
            button.disabled = true;
            status.textContent = '正在保存…';
            try {
                const response = await fetch('/api/save-unit-stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unitId, values, expected }) });
                const data = await response.json();
                if (!response.ok || !data.ok) throw new Error(data.error || '保存失败');
                Object.assign(originalStats, data.values);
                invalidateCombatPowerCache();
                applyCatalogFilter(); renderCatalogTable();
                if (selectedUnitId === unitId) renderUnitPanel(unitId);
                showToast('✅ 战斗属性已保存，游戏重新加载后使用新数值');
            } catch (error: any) { status.textContent = `保存失败：${error.message}`; }
            finally { button.disabled = false; }
        });
    }

    document.getElementById('le-u-idle')?.addEventListener('click', () => { animState = 'idle'; renderUnitPanel(unitId); });
    document.getElementById('le-u-move')?.addEventListener('click', () => { animState = 'move'; renderUnitPanel(unitId); });
    document.getElementById('le-u-attack')?.addEventListener('click', () => { animState = 'attack'; renderUnitPanel(unitId); });
    const dirSel = document.getElementById('le-u-dir') as HTMLSelectElement | null;
    dirSel?.addEventListener('change', () => {
        animDirection = parseInt(dirSel.value, 10);
        startUnitCanvasPreview(unitId);
    });

    const btnToggleRename = document.getElementById('le-unit-btn-toggle-rename');
    const renameRow = document.getElementById('le-unit-rename-row');
    const renameInput = document.getElementById('le-unit-rename-input') as HTMLInputElement | null;
    const renameSave = document.getElementById('le-unit-rename-save');
    const renameCancel = document.getElementById('le-unit-rename-cancel');

    if (btnToggleRename && renameRow && renameInput) {
        btnToggleRename.addEventListener('click', () => {
            const isHidden = renameRow.style.display === 'none';
            renameRow.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                renameInput.value = u.name;
                renameInput.focus();
                renameInput.select();
            }
        });

        const executeRename = () => {
            const newName = renameInput.value.trim();
            if (newName && newName !== u.name) {
                doRenameUnit(unitId, newName);
            } else if (!newName) {
                showToast('❌ 兵种名称不能为空', true);
            } else {
                renameRow.style.display = 'none';
            }
        };

        renameSave?.addEventListener('click', executeRename);
        renameCancel?.addEventListener('click', () => {
            renameRow.style.display = 'none';
        });

        renameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeRename();
            } else if (e.key === 'Escape') {
                renameRow.style.display = 'none';
            }
        });
    }

    const btnToggleClassify = document.getElementById('le-unit-btn-toggle-classify');
    const classifyRow = document.getElementById('le-unit-classify-row');
    const selCat = document.getElementById('le-edit-unit-category') as HTMLSelectElement | null;
    const selSub = document.getElementById('le-edit-unit-subcategory') as HTMLSelectElement | null;
    const selAge = document.getElementById('le-edit-unit-age') as HTMLSelectElement | null;
    const saveClassify = document.getElementById('le-unit-classify-save');
    const cancelClassify = document.getElementById('le-unit-classify-cancel');

    const updateSubcatOptions = (cat: UnitCategory, targetSub?: SubCategory) => {
        if (!selSub) return;
        const subList = SUBCATEGORY_BY_CATEGORY[cat] || [];
        selSub.innerHTML = subList.map(s => `<option value="${s}">${SUBCATEGORY_LABEL[s] || s}</option>`).join('');
        if (targetSub && subList.includes(targetSub)) {
            selSub.value = targetSub;
        } else if (subList.length > 0) {
            selSub.value = subList[0];
        }
    };

    if (btnToggleClassify && classifyRow && selCat && selSub && selAge) {
        btnToggleClassify.addEventListener('click', () => {
            const isHidden = classifyRow.style.display === 'none';
            classifyRow.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                selCat.value = u.category;
                selAge.value = u.age;
                updateSubcatOptions(u.category, sub);
            }
        });

        selCat.addEventListener('change', () => {
            const newCat = selCat.value as UnitCategory;
            updateSubcatOptions(newCat);
        });

        saveClassify?.addEventListener('click', () => {
            const newCat = selCat.value as UnitCategory;
            const newSub = selSub.value as SubCategory;
            const newAge = selAge.value as UnitAge;
            doUpdateUnitClassification(unitId, newCat, newSub, newAge);
        });

        cancelClassify?.addEventListener('click', () => {
            classifyRow.style.display = 'none';
        });
    }

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
        // 🔴 [2026-10-15] 把 dur（DE 真实时长）一并显示：图鉴预览按它播，一眼能对出循环秒数
        const durTxt = typeof a.dur === 'number' && a.dur > 0
            ? ` · 循环 <b style="color:#9fd08a;">${a.dur.toFixed(2)}s</b>（DE 原速）`
            : ' · <span style="color:#7a7266;">无 dur（图鉴兜底速）</span>';
        return `${act}：<b style="color:#e0c888;">${a.frames}</b> 帧 · ${Object.keys(a.dirs || {}).length} 方向 · 帧尺寸 ${size}${durTxt}`;
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
    // 🔴 [2026-10-15] 改为**时间基准（秒）**而不是 rAF 拍数：拍数无法表达"这一轮该播几秒"，
    //    于是 dur（DE 原版时长）再准也看不出来。现在与 13 战场同一条规则（loopRate）。
    let phase = 0;      // 已播秒数
    let lastT = 0;      // 上一帧时间戳(ms)

    // 像素素材放大必须关掉平滑插值，否则 2.8 倍下边缘全糊
    ctx.imageSmoothingEnabled = false;

    // 各兵种统一踩这条地面线，配合固定倍率即可直接目测体型差
    const groundY = canvas.height * 0.82;

    const loop = () => {
        const nowMs = performance.now();
        if (!lastT) lastT = nowMs;
        phase += Math.min(0.1, (nowMs - lastT) / 1000);   // 卡顿/切后台时最多按 100ms 计
        lastT = nowMs;
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
            const cycle = previewCycleSec(actMeta, totalFrames, speedDivisor);
            const cur = Math.floor(phase / cycle.sec * totalFrames) % totalFrames;

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
                `${action}_${animDirection}.png · 第 ${cur + 1}/${totalFrames} 帧 · 帧 ${Math.round(fw)}×${Math.round(fh)} · 统一 ${s}×`
                + ` · 循环 ${cycle.sec.toFixed(2)}s${cycle.fromDe ? '（DE 原速）' : '（无 dur 兜底）'}`,
                8, canvas.height - 8,
            );
        } else {
            loadSprite(imgUrl).catch(() => {});
            ctx.fillStyle = '#7a7266';
            ctx.font = '12px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`载入 ${action}_${animDirection}.png …`, canvas.width / 2, canvas.height / 2);
        }

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
    /**
     * 🔴 [2026-10-15] 该动作在 AoE2 DE 里的真实时长（秒）= dat 的 frame_count × frame_duration。
     * 13 战场渲染层（Scene13WarLayer 的 loopRate）读到它就按 DE 原节奏播，读不到才整段压进
     * 1.5s（待命）/1.0s（移动）。图鉴预览此前写死 speedDivisor、看不到这条差异，现同样读它。
     */
    dur?: number;
}
interface DynMeta {
    idle?: DynMetaAction;
    move?: DynMetaAction;
    attack?: DynMetaAction;
    death?: DynMetaAction;
}

/**
 * 图鉴预览一轮动画要播多少秒。
 * @param divisor 该动作的旧手感除数（待机 3 / 移动·攻击 2，60fps 下 = 20 / 30 fps），
 *                仅在素材没写 `dur` 时兜底，保证没数据的老素材观感与改动前一致。
 */
function previewCycleSec(
    actMeta: DynMetaAction | undefined,
    totalFrames: number,
    divisor: number,
): { sec: number; fromDe: boolean } {
    const dur = actMeta?.dur;
    if (typeof dur === 'number' && dur > 0) return { sec: dur, fromDe: true };
    return { sec: (Math.max(1, totalFrames) * divisor) / 60, fromDe: false };
}

const spriteCache = new Map<string, HTMLImageElement>();
const metaCache = new Map<string, DynMeta | null>();

const LEGACY_TO_DE_FALLBACK: Record<string, string> = {
    'horse_archer': 'cav_archer',
    'shield': 'swordsman',
    'crossbow': 'crossbowman',
    'spear': 'pikeman',
    'lancer': 'light_cavalry',
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

/**
 * 兵种卡片缩略图：画 idle 当前朝向的第一帧，等比缩进 canvas.width 见方并居中。
 * 卡片的 64×64、图鉴的 44×44、悬停放大镜的 256×256 共用这一条链（同朝向、同缓存）。
 *
 * @param crisp 放大镜用 true：关掉 drawImage 的平滑插值，像素素材放大后边缘才不糊
 *              （与图鉴单兵预览 `ctx.imageSmoothingEnabled = false` 同一口径）；
 *              缩略图默认 false，缩小采样时有平滑反而更干净。
 */
export async function drawUnitThumb(canvas: HTMLCanvasElement, unitId: string, crisp: boolean = false): Promise<void> {
    const prefix = getUnitPathPrefix(unitId);
    const imgUrl = `${prefix}idle_${unitThumbDir}.png`;
    try {
        const img = await loadSprite(imgUrl);
        let meta = metaCache.get(prefix);
        if (meta === undefined) meta = await loadMeta(prefix);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = !crisp;
        const actMeta = meta?.idle;
        const dirMeta = actMeta?.dirs?.[String(unitThumbDir)];
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
export function observeThumbs(root: ParentNode): void {
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

/** 重置并立即重画全部兵种缩略图（切换全体朝向后用） */
function redrawUnitThumbsIn(root: ParentNode): void {
    root.querySelectorAll<HTMLCanvasElement>('canvas[data-uid]').forEach(c => {
        c.dataset.drawn = '';
        drawUnitThumb(c, c.dataset.uid!);
    });
}

// ============================================================
// 6.9 兵种图标悬停放大镜（选兵种时 64px 图标看不清）
// ============================================================
/**
 * 🔴 [2026-10-18 主人令「在军团编辑中添加一个功能，我在选兵种的时候，鼠标移动到兵种的图标，就放大，现在看不清」]
 *
 * 选兵弹窗里的缩略图只有 64px，兵种长相分不清。鼠标移到图标上 → 在光标旁浮出 256px 放大镜，
 * 画的是同一帧（同朝向、同 loadSprite/meta 缓存），像素素材走 nearest-neighbor 保持锐利。
 *
 * 几个必须守住的细节：
 *  · 浮层是 body 下单例 + position:fixed + pointer-events:none —— 不占布局、不挡点击，
 *    也不会因为浮层盖住图标触发 mouseout → 抖动闪烁；
 *  · 事件委托挂在弹窗根节点，只认 `canvas.le-unit-thumb`（卡片文字/空白处不弹）；
 *  · 滚动时立刻收起（fixed 浮层不跟滚，会和图标脱节）；
 *  · 弹窗重绘 / 关闭都主动 hide，innerHTML 换掉后不残留旧图。
 */
const THUMB_ZOOM_SIZE = 256;
/** 浮层外框尺寸（含 padding/border）：256 画布 + 左右 8px padding×2 + 1px border×2 ≈ 274；这里留 18 余量。 */
const THUMB_ZOOM_W = THUMB_ZOOM_SIZE + 18;
/** 画布 + 名称行 + 分类/ID 行 + 间距 + padding ≈ 308；留到 312。 */
const THUMB_ZOOM_H = THUMB_ZOOM_SIZE + 56;

let thumbZoomEl: HTMLDivElement | null = null;
let thumbZoomCanvas: HTMLCanvasElement | null = null;
let thumbZoomUid: string | null = null;
let thumbZoomGlobalBound = false;

function ensureThumbZoom(): HTMLDivElement {
    if (thumbZoomEl) return thumbZoomEl;
    const el = document.createElement('div');
    el.className = 'le-thumb-zoom';
    el.innerHTML = `
      <canvas width="${THUMB_ZOOM_SIZE}" height="${THUMB_ZOOM_SIZE}"></canvas>
      <div class="le-thumb-zoom-name"></div>
      <div class="le-thumb-zoom-meta"><span class="le-thumb-zoom-cat"></span><span class="le-thumb-zoom-id"></span></div>`;
    document.body.appendChild(el);
    thumbZoomEl = el;
    thumbZoomCanvas = el.querySelector('canvas');
    return el;
}

/** 收起放大镜（滚动 / 重绘 / 关弹窗 / 点选后都要调）。 */
export function hideThumbZoom(): void {
    thumbZoomUid = null;
    thumbZoomEl?.classList.remove('is-on');
}

/** 跟手定位：默认在光标右下 18px；右/下越界翻到左侧/上方，最后再钳进视口（四周留 8px）。 */
function positionThumbZoom(ev: MouseEvent): void {
    const el = thumbZoomEl;
    if (!el) return;
    // 用实测尺寸（visibility:hidden 时布局仍可量）；偶发 0 才退回常量兜底
    const w = el.offsetWidth || THUMB_ZOOM_W;
    const h = el.offsetHeight || THUMB_ZOOM_H;
    const gap = 18, margin = 8;
    let x = ev.clientX + gap;
    let y = ev.clientY + gap;
    if (x + w > window.innerWidth - margin) x = ev.clientX - gap - w;
    if (y + h > window.innerHeight - margin) y = ev.clientY - gap - h;
    x = Math.max(margin, Math.min(x, window.innerWidth - w - margin));
    y = Math.max(margin, Math.min(y, window.innerHeight - h - margin));
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

function showThumbZoom(uid: string, ev: MouseEvent): void {
    const el = ensureThumbZoom();
    const canvas = thumbZoomCanvas!;
    if (thumbZoomUid !== uid) {
        thumbZoomUid = uid;
        const def = DE_UNITS_MAP.get(uid);
        el.querySelector('.le-thumb-zoom-name')!.textContent = def?.name || uid;
        el.querySelector('.le-thumb-zoom-cat')!.textContent = def
            ? `${CATEGORY_LABEL[def.category]}${getUnitTier(def) === 'elite' ? ' · ⭐精锐' : ''}`
            : '';
        el.querySelector('.le-thumb-zoom-id')!.textContent = uid;
        // 换兵种才重画；同一张图连续 hover 只挪位置。先擦掉旧图：
        // 素材加载失败时 drawUnitThumb 会保留原内容，别让上一张图顶着新名字。
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        drawUnitThumb(canvas, uid, true);
    }
    el.classList.add('is-on');
    positionThumbZoom(ev);
}

/**
 * 给弹窗里的兵种图标挂「悬停放大」。事件委托：一次挂载，之后 renderModalContent
 * 怎么重建 DOM 都生效，也不会随着切 tab / 搜索累积监听。
 */
export function attachUnitThumbZoom(root: HTMLElement): void {
    const thumbOf = (t: EventTarget | null): HTMLCanvasElement | null => {
        const el = t instanceof Element ? t.closest('canvas.le-unit-thumb') : null;
        return el instanceof HTMLCanvasElement ? el : null;
    };
    root.addEventListener('mouseover', (e) => {
        const thumb = thumbOf(e.target);
        const uid = thumb?.dataset.uid;
        if (uid) showThumbZoom(uid, e);
    });
    root.addEventListener('mousemove', (e) => {
        if (!thumbZoomUid) return;
        if (thumbOf(e.target)) positionThumbZoom(e);
        else hideThumbZoom();   // 移到卡片文字/列间空白就收起
    });
    root.addEventListener('mouseout', (e) => {
        if (!thumbOf(e.target)) return;
        if (thumbOf(e.relatedTarget)) return;   // 直接挪到相邻图标：交给那一张的 mouseover 接手
        hideThumbZoom();
    });
    // 滚动后 fixed 浮层会和图标脱节 → 立刻收起；scroll 不冒泡，必须 capture
    root.addEventListener('scroll', hideThumbZoom, true);
    if (!thumbZoomGlobalBound) {
        thumbZoomGlobalBound = true;
        window.addEventListener('resize', hideThumbZoom);
    }
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
    const slots = withEffectiveScales(currentEditingLegion.slots);

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
        const isStrat = previewViewMode === 'strategic';
        const spacingX = isStrat ? STRATEGIC_SPACING_X : 52;
        const spacingY = isStrat ? STRATEGIC_SPACING_Y : 66; // 前后排距拉开为 60% 长方形军阵
        const pScale = isStrat ? (SPRITE_BASE_H / 64) : 1.15;

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

    // 🔴 [2026-10-15] 与图鉴单兵预览同一把尺：时间基准（秒）+ `_meta.json` 的 dur（DE 原速）
    let phase = 0;
    let lastT = 0;
    const renderLoop = () => {
        const nowMs = performance.now();
        if (!lastT) lastT = nowMs;
        phase += Math.min(0.1, (nowMs - lastT) / 1000);
        lastT = nowMs;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制沙盘网格背景
        ctx.fillStyle = '#141812';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e241c';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
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

                // 动画帧索引：有 dur 按 DE 原速（待机 3.0s、重装剑士 4.0s…），没有则维持老手感
                // （移动/攻击 30fps 敏捷干脆，待机 20fps 自然舒展）
                const speedDivisor = animState === 'idle' ? 3 : 2;
                const cycle = previewCycleSec(actMeta, totalFrames, speedDivisor);
                const curFrame = Math.floor(phase / cycle.sec * totalFrames) % totalFrames;
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

        animTimer = requestAnimationFrame(renderLoop);
    };

    renderLoop();
}

// ============================================================
// 8. 存盘与全局事件
// ============================================================

/**
 * 保存文化军团编制。
 *
 * 🔴 [2026-09-07 主人定] 两条铁律，都是被实际事故逼出来的：
 *   ① **同名一律覆盖**：一个军团名只能有一种编制。保存时把**所有同名的文化军团 + 势力军团**
 *      一起刷成这一份 —— 原来只改自己那一个，同名的别人不动，于是每存一次就多留一份
 *      「同名不同编」，界面弹「编制不一致」，军团越改越多。主人原话「重名不覆盖，那么军团
 *      岂不是越改越多」。
 *   ② **写完立刻同步内存**：`CULTURE_*` 是页面加载时导入的静态对象，保存只写文件不改它们，
 *      而保存后又立刻 buildRows/renderTable 用这份旧内存重绘 —— 于是「选了阵型、点保存、
 *      阵型自己弹回去」。文件其实是对的，是界面拿旧数据把自己覆盖了。
 */
async function saveCultureComposition(culture: RegionType, legion: EditableLegion): Promise<void> {
    try {
        const legionName = legion.legionName?.trim() || getCultureLegionName(culture);
        const slots = legion.slots.map(s => ({ ...s }));
        const formationMode = legion.formationMode;

        // ① 找出所有同名的文化区（含改名前就叫这个名的），一起覆盖
        const alsoCultures = (REGION_ORDER as RegionType[]).filter(
            r => r !== culture && getCultureLegionName(r) === legionName,
        );

        const res = await fetch('/api/save-culture-formations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ culture, slots, formationMode, legionName, alsoCultures }),
        });
        if (!res.ok) throw new Error(await res.text());

        // ② 内存同步（否则下面重绘会把界面刷回旧编制）
        // 🔴 [2026-09-14] 文化表已删：内存同步改成「按军团名打补丁」，文化区只更新指针
        for (const r of [culture, ...alsoCultures]) {
            (CULTURE_LEGION_NAMES as Record<string, string>)[r] = legionName;
            applyCultureFormationPatch(r as RegionType, slots, formationMode);
        }

        // 🔴 [2026-09-15 主人报障「城堡时代白山黑水军团有两个」] 保存后**必须整体重建快照**。
        //    表格里同一个军团名之所以会裂成两种编制，是因为它有**两条解析路径**：
        //      · 势力有专属条目 → 读 localCustomCompositions[fid].slots（**页面加载时解出来的快照**）
        //      · 势力跟随文化区 → 读 getRegionLegionComposition(region)（**每次重绘实时解**）
        //    只要快照没跟着刷新，这两条就会给出不同的三排 —— 界面就弹「军团编制冲突」。
        //    下面 ③ 逐行覆盖只补了「名字对得上」的那些行，与 save-legion-composition 那条路
        //    （3313 行整体 buildLocalCompositions）口径不一致；这里补齐成同一口径，
        //    让快照永远不可能和实时解析打架。
        localCustomCompositions = buildLocalCompositions();

        // ③ 势力表里同名的势力军团也一起覆盖（同名 = 同一个军团，全体同步）
        let factionSync = 0;
        for (const r of allRows) {
            if (effectiveLegionName(r) !== legionName) continue;
            const existing = localCustomCompositions[r.factionId];
            localCustomCompositions[r.factionId] = {
                ...(existing || {}),
                legionName,
                legionType: existing?.legionType || 'region',
                formationMode,
                navalFormation: existing?.navalFormation ?? 'auto',
                slots: slots.map(s => ({ ...s })),
            };
            factionSync++;
        }
        if (factionSync > 0 && !await saveAllCompositions()) {
            showToast('❌ 文化军团已写入，但同名势力同步失败，请再次保存。', true);
            return;
        }

        showToast(`✅ 军团编制已保存：【${legionName}】（所有使用者同步）`
            + (alsoCultures.length ? `，同名文化区同步 ${alsoCultures.length} 个` : '')
            + (factionSync ? `，同名势力同步 ${factionSync} 个` : ''));

        buildRows();
        applyFilter();
        renderTable();
        if (selectedFactionId) selectFaction(selectedFactionId);
    } catch (e: any) {
        showToast('❌ 保存失败：' + (e?.message || e), true);
    }
}

/** 🔴 [2026-09-15 主人定「把这个分开」] 势力归属**单条**落盘。
 *  军团编辑器从此不再走整表覆盖的 /api/save-faction-compositions ——
 *  那条路曾把 465 条势力归属洗成 1 条。要批量改归属请去「势力归属」那一页。 */
async function saveOneFactionLegion(factionId: string, legionName: string | null, legionType?: string): Promise<boolean> {
    try {
        const res = await fetch('/api/save-faction-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factionId, legionName, legionType }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        return true;
    } catch (e: any) {
        showToast('❌ 归属保存失败：' + (e?.message || e), true);
        return false;
    }
}

async function saveAllCompositions(): Promise<boolean> {
    // 🔴 强闸门（2026-09-10 主人定）：唯一铁律「一个军团只能有一种编制」。
    //    同名军团前/中/后三排兵种 + 阵型不一致 → 拦截，不许保存，提示错误。
    const violations = computeLegionNameViolations();
    const multiCompViolations = violations.filter(v =>
        v.includes('编制不一致') || v.includes('多种编制')
        || v.includes('没有被武将套用') || v.includes('象兵/战车违规'),
    );
    if (multiCompViolations.length > 0) {
        showToast('❌ 保存已被拦截：一个军团只能有一种编制，不然就报错！', true);
        openLegionViolationsModal(violations);
        return false;
    }

    try {
        const res = await fetch('/api/save-faction-compositions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ compositions: localCustomCompositions }),
        });

        if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
        showToast('❌ 保存失败：' + (e?.message || e), true);
        return false;
    }

    showToast('🎉 已写入 FactionCompositions.ts');
    // 🔴 自动报错：写盘后自动校验军团命名铁律，有违规弹窗列出
    reportLegionNameViolations();
    return true;
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
els.srcFilter.addEventListener('change', () => {
    catalogSrcFilter = els.srcFilter.value as typeof catalogSrcFilter;
    runCatalogFilter();
});

els.btnReload.addEventListener('click', () => {
    localCustomCompositions = buildLocalCompositions();
    buildRows();
    applyFilter();
    renderTable();
    if (selectedFactionId) selectFaction(selectedFactionId);
    showToast('🔄 已重新载入势力军团数据');
});

// 「检查军团命名」：手动触发命名铁律校验（自动报错）
document.getElementById('le-check-legions')?.addEventListener('click', () => {
    buildRows();
    applyFilter();
    renderTable();
    reportLegionNameViolations();
});

// Ctrl+S 明确对应「保存军团编制」；武将换军团使用独立的归属保存按钮。
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveButton = document.getElementById('le-btn-save-single')
            ?? document.getElementById('le-btn-save-naval');
        if (saveButton) saveButton.click();
    }
});

// 启动执行
buildRows();
applyFilter();
renderTable();


// 🔴 [2026-09-01 主人要求「有错误要自动弹出」] 打开编辑器就自动校验一次，
//    有违规直接弹窗，没有就安静 —— 不用改的事一律不提示。
reportLegionNameViolations(true);
// 默认选中第一个势力
if (filteredRows.length > 0) {
    selectFaction(filteredRows[0].factionId);
}
