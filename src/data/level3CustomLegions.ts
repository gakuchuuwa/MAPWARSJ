/**
 * 三级军团表（自建 / 延伸军团）—— 🔴 [2026-09-14 主人定]
 *
 * > 主人原话：「所有军团只有一级 16 个，二级 59 个，其他都是三级」「怎么还有什么文化表，全部清除」
 *
 * ── 为什么有这个文件 ─────────────────────────────────────────────
 * 一级 16 母体的编制在 `CultureFormations.ts` 的 `BASE_16_TIERS_MAP`，
 * 二级 59 文明的编制在 `level2Civ59Legions.ts`，
 * 唯独三级军团的编制原先**没有自己的表**，散着寄存在 173 个文化区的格子里
 * （`CULTURE_TIERS_MAP` / `CULTURE_FORMATION_MODE`，也就是主人说的「文化表」）。
 * 那套东西不属于三层里的任何一层，是第四份权威，于是同一支军团的编制能在两处打架。
 * 本文件把三级军团的编制搬回军团自己身上；文化区从此只剩一个指针
 * （`CULTURE_LEGION_NAMES`：这个区默认挂哪支军团），不再持有任何编制。
 *
 * ⚠️ 军团数量一支未增未减：搬家前后都是 一级 16 + 二级 59 + 三级 N。
 */
import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';

export interface Level3LegionDef {
    /** 军团名（时代 + 民族 + 军团） */
    name: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    /** 默认挂这支军团的文化区（只作溯源用，编制不再按区存） */
    regions: string[];
}

export const LEVEL_3_LEGIONS: Level3LegionDef[] = [
    {
        name: '古典时代东南亚军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'vanguard', count: 4 },
            { type: 'antiquity_skirmisher', count: 3 },
        ],
        regions: ['SEASIA_ANTIQUITY'],
    },
    {
        name: '古典时代中亚军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'antiquity_heavy_cavalry_archer', count: 2 },
            { type: 'bactrian_archer', count: 3 },
        ],
        regions: ['CENTRAL_ASIA_ANTIQUITY'],
    },
    {
        name: '古典时代乌孙军团',
        formationMode: 'triangle',
        slots: [
            { type: 'sakan_axeman', count: 2 },
            { type: 'antiquity_light_cavalry', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
        regions: ['WUSUN'],
    },
    {
        name: '古典时代亚美尼亚军团',
        formationMode: 'crescent',
        slots: [
            { type: 'warrior_priest', count: 3 },
            { type: 'hill_tribesman', count: 2 },
            { type: 'elite_composite_bowman', count: 4 },
        ],
        regions: ['ARMENIANS'],
    },
    {
        name: '古典时代亚述军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'thracian_peltast', count: 2 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'war_chariot', count: 3 },
        ],
        regions: ['ASSYRIAN'],
    },
    {
        name: '古典时代亚马逊军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'amazon_archer', count: 2 },
            { type: 'elite_scythian_horse_archer', count: 4 },
            { type: 'amazon_warrior', count: 3 },
        ],
        regions: ['AMAZONS'],
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
    },
    {
        name: '古典时代华夏军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'fire_archer', count: 3 },
            { type: 'elite_chukonu', count: 2 },
        ],
        regions: ['CENTRAL'],
    },
    {
        name: '古典时代印度军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'antiquity_heavy_cavalry_archer', count: 2 },
            { type: 'ratha_melee', count: 4 },
            { type: 'sickle_warrior', count: 3 },
        ],
        regions: ['INDIA'],
    },
    {
        name: '古典时代埃及军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_war_chariot', count: 4 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'cretan_archer', count: 2 },
        ],
        regions: ['EGYPT'],
    },
    {
        name: '古典时代塞种军团',
        formationMode: 'triangle',
        slots: [
            { type: 'sakan_axeman', count: 2 },
            { type: 'bactrian_archer', count: 3 },
            { type: 'elite_scythian_horse_archer', count: 4 },
        ],
        regions: ['WESTERN'],
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
    },
    {
        name: '古典时代巴比伦军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'elite_war_chariot', count: 4 },
            { type: 'guardsman', count: 2 },
            { type: 'elite_guardsman', count: 3 },
        ],
        regions: ['BABYLON'],
    },
    {
        name: '古典时代布匿军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'mercenary_hoplite', count: 4 },
            { type: 'rhodian_slinger', count: 3 },
        ],
        regions: ['CARTHAGE'],
    },
    {
        name: '古典时代希伦军团',
        formationMode: 'echelon',
        slots: [
            { type: 'hippeus', count: 4 },
            { type: 'sacred_band', count: 3 },
            { type: 'strategos', count: 2 },
        ],
        regions: ['HELLENIC'],
    },
    {
        name: '古典时代希伯来军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'levy', count: 3 },
            { type: 'vanguard', count: 4 },
            { type: 'war_chariot', count: 2 },
        ],
        regions: ['HEBREWS'],
    },
    {
        name: '古典时代希腊军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'hoplite', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'gastraphetes', count: 2 },
        ],
        regions: ['GREEK'],
    },
    {
        name: '古典时代希腊雇佣军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'mercenary_hoplite', count: 4 },
            { type: 'shock_cavalry', count: 2 },
            { type: 'gastraphetes', count: 3 },
        ],
        regions: ['GREEK_MERCENARY'],
    },
    {
        name: '古典时代斯基泰军团',
        formationMode: 'triangle',
        slots: [
            { type: 'scythian_axe_cavalry', count: 2 },
            { type: 'scythian_horse_archer', count: 3 },
            { type: 'elite_scythian_horse_archer', count: 4 },
        ],
        regions: ['SCYTHIANS'],
    },
    {
        name: '古典时代日本军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'samurai', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'ninja', count: 2 },
        ],
        regions: ['JAPAN_ANTIQUITY'],
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
    },
    {
        name: '古典时代月氏军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'antiquity_cavalry_archer', count: 3 },
        ],
        regions: ['KUSHAN'],
    },
    {
        name: '古典时代朝鲜军团',
        formationMode: 'square',
        slots: [
            { type: 'antiquity_spearman', count: 3 },
            { type: 'antiquity_skirmisher', count: 3 },
            { type: 'antiquity_cavalry_archer', count: 3 },
        ],
        regions: ['GOJOSEON'],
    },
    {
        name: '古典时代波斯军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'sparabara', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'immortal', count: 2 },
        ],
        regions: ['PERSIAN'],
    },
    {
        name: '古典时代秦汉军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_chukonu', count: 4 },
            { type: 'tiger_rider', count: 2 },
        ],
        regions: ['NORTH', 'HEXI'],
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
    },
    {
        name: '古典时代罗马禁卫军团',
        formationMode: 'echelon',
        slots: [
            { type: 'equites', count: 4 },
            { type: 'centurion', count: 3 },
            { type: 'imperial_centurion', count: 2 },
        ],
        regions: ['IMPERIAL_ROME'],
    },
    {
        name: '古典时代羌族军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'antiquity_cavalry_archer', count: 4 },
            { type: 'hill_tribesman', count: 2 },
            { type: 'antiquity_heavy_cavalry_archer', count: 3 },
        ],
        regions: ['QIANG'],
    },
    {
        name: '古典时代草原军团',
        formationMode: 'square',
        slots: [
            { type: 'mangudai', count: 3 },
            { type: 'xianbei_raider', count: 3 },
            { type: 'elite_kipchak', count: 3 },
        ],
        regions: ['STEPPE_ANTIQUITY'],
    },
    {
        name: '古典时代西亚军团',
        formationMode: 'echelon',
        slots: [
            { type: 'hoplite', count: 4 },
            { type: 'shock_cavalry', count: 3 },
            { type: 'rhodian_slinger', count: 2 },
        ],
        regions: ['WEST_ASIA_ANTIQUITY'],
    },
    {
        name: '古典时代赫梯军团',
        formationMode: 'triangle',
        slots: [
            { type: 'antiquity_skirmisher', count: 2 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'elite_war_chariot', count: 4 },
        ],
        regions: ['HITTITES'],
    },
    {
        name: '古典时代阿拉伯军团',
        formationMode: 'triangle',
        slots: [
            { type: 'camel_scout', count: 2 },
            { type: 'antiquity_heavy_cavalry_archer', count: 3 },
            { type: 'elite_antiquity_skirmisher', count: 4 },
        ],
        regions: ['ORIE_ANTIQUITY'],
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
    },
    {
        name: '古典时代非洲军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'shotel_warrior', count: 3 },
            { type: 'elite_shotel_warrior', count: 4 },
            { type: 'camel_scout', count: 2 },
        ],
        regions: ['AFRICA_ANTIQUITY'],
    },
    {
        name: '古典时代鲜卑军团',
        formationMode: 'crescent',
        slots: [
            { type: 'tiger_rider', count: 3 },
            { type: 'xianbei_raider', count: 2 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
        ],
        regions: ['NORTHEAST'],
    },
    {
        name: '城堡时代东南亚军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'armored_elephant', count: 2 },
            { type: 'sunda_royal_fighter', count: 4 },
            { type: 'rattan_archer', count: 3 },
        ],
        regions: ['SEASIA_CASTLE'],
    },
    {
        name: '城堡时代两宋军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'liao_dao', count: 4 },
            { type: 'elite_fire_lancer', count: 2 },
            { type: 'elite_chukonu', count: 3 },
        ],
        regions: ['SONG'],
    },
    {
        name: '城堡时代中亚军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'savar', count: 4 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'elite_kipchak', count: 3 },
        ],
        regions: ['CENTRAL_ASIA_CASTLE'],
    },
    {
        name: '城堡时代京族军团',
        formationMode: 'triangle',
        slots: [
            { type: 'white_feather_guard', count: 2 },
            { type: 'imperial_skirmisher', count: 3 },
            { type: 'rattan_archer_elite', count: 4 },
        ],
        regions: ['VIETNAMESE'],
    },
    {
        name: '城堡时代伊利汗军团',
        formationMode: 'triangle',
        slots: [
            { type: 'imperial_cavalry', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'keshik', count: 4 },
        ],
        regions: ['ILKHANATE'],
    },
    {
        name: '城堡时代克丘亚军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'champi_warrior', count: 3 },
            { type: 'elite_kamayuk', count: 4 },
            { type: 'champi_scout', count: 2 },
        ],
        regions: ['ANDE'],
    },
    {
        name: '城堡时代党项军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'hill_tribesman', count: 2 },
            { type: 'chukonu', count: 4 },
            { type: 'elite_keshik', count: 3 },
        ],
        regions: ['TANGUT'],
    },
    {
        name: '城堡时代十字军团',
        formationMode: 'triangle',
        slots: [
            { type: 'teutonic_knight', count: 2 },
            { type: 'paragon', count: 3 },
            { type: 'crusader_knight', count: 4 },
        ],
        regions: ['CRUSADERS'],
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
    },
    {
        name: '城堡时代印度军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'armored_elephant', count: 2 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'pattiyoda_longbowman', count: 3 },
        ],
        regions: ['INDIA_CASTLE'],
    },
    {
        name: '城堡时代吐蕃军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'hei_kuang', count: 2 },
            { type: 'hei_kuang_heavy', count: 4 },
            { type: 'cav_archer', count: 3 },
        ],
        regions: ['TIBET_CASTLE'],
    },
    {
        name: '城堡时代塔拉斯科军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'jaguar_warrior', count: 3 },
            { type: 'elite_jaguar_warrior', count: 4 },
            { type: 'plumed_archer', count: 2 },
        ],
        regions: ['TARASCAN'],
    },
    {
        name: '城堡时代塞尔柱军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'camel_rider', count: 2 },
            { type: 'elite_ghulam', count: 4 },
            { type: 'longswordsman', count: 3 },
        ],
        regions: ['SELJUQ'],
    },
    {
        name: '城堡时代塞尔维亚军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 3 },
            { type: 'cavalier', count: 4 },
            { type: 'knight', count: 2 },
        ],
        regions: ['SERBIA'],
    },
    {
        name: '城堡时代墨西加军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'jaguar_warrior', count: 3 },
            { type: 'elite_eagle_warrior', count: 4 },
            { type: 'xolotl_warrior', count: 2 },
        ],
        regions: ['AMERICA'],
    },
    {
        name: '城堡时代大理军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'crossbowman', count: 4 },
            { type: 'jian_swordman_shielded', count: 3 },
        ],
        regions: ['DALI'],
    },
    {
        name: '城堡时代奇穆军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_champi_warrior', count: 4 },
            { type: 'kamayuk', count: 3 },
            { type: 'champi_runner', count: 2 },
        ],
        regions: ['CHIMU'],
    },
    {
        name: '城堡时代奥斯曼军团',
        formationMode: 'crescent',
        slots: [
            { type: 'janissary', count: 3 },
            { type: 'elite_janissary', count: 2 },
            { type: 'royal_janissary', count: 4 },
        ],
        regions: ['OTTOMAN'],
    },
    {
        name: '城堡时代帖木儿军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_keshik', count: 4 },
            { type: 'mangudai_elite', count: 3 },
            { type: 'elite_steppe_lancer', count: 2 },
        ],
        regions: ['TIMURID'],
    },
    {
        name: '城堡时代德里军团',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_armored_elephant', count: 2 },
            { type: 'elite_ghulam', count: 3 },
            { type: 'ghulam', count: 4 },
        ],
        regions: ['DELHI'],
    },
    {
        name: '城堡时代拉丁军团',
        formationMode: 'echelon',
        slots: [
            { type: 'cavalier', count: 4 },
            { type: 'halberdier', count: 3 },
            { type: 'arbalest', count: 2 },
        ],
        regions: ['LATIN_CASTLE'],
    },
    {
        name: '城堡时代捷克军团',
        formationMode: 'echelon',
        slots: [
            { type: 'halberdier', count: 4 },
            { type: 'arbalest', count: 3 },
            { type: 'elite_hussite_wagon', count: 2 },
        ],
        regions: ['BOHEMIANS'],
    },
    {
        name: '城堡时代摩洛哥军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_camel_archer', count: 2 },
            { type: 'cavalier', count: 4 },
            { type: 'elite_genitour', count: 3 },
        ],
        regions: ['ALMOHAD'],
    },
    {
        name: '城堡时代日耳曼军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'knight', count: 2 },
            { type: 'two_handed_swordsman', count: 4 },
            { type: 'crossbowman', count: 3 },
        ],
        regions: ['GERMANIC_CASTLE'],
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
    },
    {
        name: '城堡时代曼丁哥军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'sosso_guard', count: 3 },
            { type: 'elite_gbeto', count: 4 },
            { type: 'camel_archer', count: 2 },
        ],
        regions: ['AFRICA'],
    },
    {
        name: '城堡时代法兰西军团',
        formationMode: 'triangle',
        slots: [
            { type: 'coustillier', count: 2 },
            { type: 'genoese_crossbowman', count: 3 },
            { type: 'frankish_paladin', count: 4 },
        ],
        regions: ['FRENCH'],
    },
    {
        name: '城堡时代波斯军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'camel_rider', count: 3 },
            { type: 'imperial_cavalry', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
        regions: ['PERSIAN_CASTLE'],
    },
    {
        name: '城堡时代泰罗纳军团',
        formationMode: 'triangle',
        slots: [
            { type: 'blackwood_archer', count: 2 },
            { type: 'guecha_warrior', count: 3 },
            { type: 'elite_temple_guard', count: 4 },
        ],
        regions: ['TAIRONA'],
    },
    {
        name: '城堡时代神圣罗马军团',
        formationMode: 'echelon',
        slots: [
            { type: 'cavalier', count: 4 },
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'crossbowman', count: 2 },
        ],
        regions: ['HRE'],
    },
    {
        name: '城堡时代缅族军团',
        formationMode: 'triangle',
        slots: [
            { type: 'armored_elephant', count: 2 },
            { type: 'arambai', count: 3 },
            { type: 'elite_arambai', count: 4 },
        ],
        regions: ['BURMESE'],
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
    },
    {
        name: '城堡时代西域军团',
        formationMode: 'triangle',
        slots: [
            { type: 'steppe_lancer', count: 2 },
            { type: 'keshik', count: 3 },
            { type: 'elite_keshik', count: 4 },
        ],
        regions: ['WESTERN_CASTLE'],
    },
    {
        name: '城堡时代西辽军团',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_steppe_lancer', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'keshik', count: 4 },
        ],
        regions: ['KARA_KHITAN'],
    },
    {
        name: '城堡时代诺曼军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'serjeant', count: 2 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
        regions: ['SICILIANS'],
    },
    {
        name: '城堡时代镰仓军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'samurai', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
        regions: ['JAPAN'],
    },
    {
        name: '城堡时代阿伊努军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'hill_tribesman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'war_dog', count: 2 },
        ],
        regions: ['AINU'],
    },
    {
        name: '城堡时代阿拉贡军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'cavalier', count: 3 },
            { type: 'two_handed_swordsman', count: 4 },
            { type: 'elite_genitour', count: 2 },
        ],
        regions: ['ARAGON'],
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
    },
    {
        name: '城堡时代马穆鲁克军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_camel_archer', count: 2 },
            { type: 'mameluke', count: 4 },
            { type: 'camel_rider', count: 3 },
        ],
        regions: ['MAMLUKS'],
    },
    {
        name: '城堡时代高棉军团',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_ballista_elephant', count: 2 },
            { type: 'archer', count: 3 },
            { type: 'heavy_pikeman', count: 4 },
        ],
        regions: ['KHMER'],
    },
    {
        name: '封建时代三佛齐军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'karambit_warrior', count: 2 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'rattan_archer_elite', count: 3 },
        ],
        regions: ['SRIVIJAYA'],
    },
    {
        name: '封建时代东南亚军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'eastern_swordsman', count: 4 },
            { type: 'archer', count: 3 },
        ],
        regions: ['SEASIA_FEUDAL'],
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
    },
    {
        name: '封建时代加纳军团',
        formationMode: 'echelon',
        slots: [
            { type: 'sosso_guard', count: 4 },
            { type: 'pikeman', count: 3 },
            { type: 'elite_skirmisher', count: 2 },
        ],
        regions: ['GHANA'],
    },
    {
        name: '封建时代印度军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_elephant_archer', count: 2 },
            { type: 'shrivamsha_rider', count: 4 },
            { type: 'chakram_thrower', count: 3 },
        ],
        regions: ['INDIA_FEUDAL'],
    },
    {
        name: '封建时代可萨军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'elite_konnik', count: 4 },
            { type: 'cav_archer', count: 3 },
        ],
        regions: ['KHAZARS'],
    },
    {
        name: '封建时代吐蕃军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'hei_kuang_heavy', count: 4 },
            { type: 'cav_archer', count: 3 },
        ],
        regions: ['TIBET'],
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
    },
    {
        name: '封建时代回鹘军团',
        formationMode: 'triangle',
        slots: [
            { type: 'steppe_lancer', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'elite_scythian_horse_archer', count: 4 },
        ],
        regions: ['UIGHUR'],
    },
    {
        name: '封建时代孟加拉军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_ratha_melee', count: 4 },
            { type: 'sickle_warrior', count: 3 },
            { type: 'chakram_thrower', count: 2 },
        ],
        regions: ['BENGALIS'],
    },
    {
        name: '封建时代希腊军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },
            { type: 'elite_cataphract', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
        regions: ['BYZANTINE'],
    },
    {
        name: '封建时代拉丁军团',
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_antiquity_skirmisher', count: 2 },
        ],
        regions: ['LATIN_FEUDAL'],
    },
    {
        name: '封建时代斯拉夫军团',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_boyar', count: 4 },
            { type: 'composite_bowman', count: 3 },
            { type: 'berserk', count: 2 },
        ],
        regions: ['SLAVIC_FEUDAL'],
    },
    {
        name: '封建时代日耳曼军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'scout_cavalry', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'elite_skirmisher', count: 3 },
        ],
        regions: ['GERMANIC_FEUDAL'],
    },
    {
        name: '封建时代柔然军团',
        formationMode: 'triangle',
        slots: [
            { type: 'raider', count: 2 },
            { type: 'cav_archer_heavy', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
        ],
        regions: ['ROURAN'],
    },
    {
        name: '封建时代格鲁吉亚军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'monaspa', count: 3 },
            { type: 'elite_monaspa', count: 4 },
            { type: 'cav_archer', count: 2 },
        ],
        regions: ['GEORGIANS'],
    },
    {
        name: '封建时代汪达尔军团',
        formationMode: 'echelon',
        slots: [
            { type: 'cavalier', count: 4 },
            { type: 'lancer', count: 3 },
            { type: 'scout_cavalry', count: 2 },
        ],
        regions: ['VANDALS'],
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
    },
    {
        name: '封建时代爪哇军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'sunda_royal_fighter', count: 3 },
        ],
        regions: ['JAVANESE'],
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
    },
    {
        name: '封建时代白蛮军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'elite_chukonu', count: 4 },
            { type: 'archer', count: 3 },
        ],
        regions: ['NANZHAO'],
    },
    {
        name: '封建时代盎格鲁-撒克逊军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'manatarms', count: 3 },
            { type: 'champion', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
        regions: ['ANGLO_SAXON'],
    },
    {
        name: '封建时代突厥军团',
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'cav_archer_heavy', count: 3 },
            { type: 'elite_steppe_lancer', count: 4 },
        ],
        regions: ['TURKS'],
    },
    {
        name: '封建时代粟特军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'bactrian_archer', count: 3 },
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'camel_rider', count: 2 },
        ],
        regions: ['SOGDIANS'],
    },
    {
        name: '封建时代罗斯军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'boyar', count: 3 },
            { type: 'elite_composite_bowman', count: 4 },
            { type: 'berserk', count: 2 },
        ],
        regions: ['SLAVIC'],
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
    },
    {
        name: '封建时代西域军团',
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'cav_archer_heavy', count: 4 },
        ],
        regions: ['WESTERN_FEUDAL'],
    },
    {
        name: '封建时代阿拉伯军团',
        formationMode: 'triangle',
        slots: [
            { type: 'camel_rider', count: 2 },
            { type: 'elite_mameluke', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
        regions: ['ORIE'],
    },
    {
        name: '封建时代隋唐军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'liao_dao', count: 4 },
            { type: 'elite_chukonu', count: 2 },
            { type: 'hei_kuang_heavy', count: 3 },
        ],
        regions: ['JIANGNAN'],
    },
    {
        name: '封建时代靺鞨军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'laminated_bowman', count: 3 },
            { type: 'hei_kuang_heavy', count: 4 },
            { type: 'spearman', count: 2 },
        ],
        regions: ['MOHE'],
    },
    {
        name: '封建时代高句丽军团',
        formationMode: 'echelon',
        slots: [
            { type: 'jian_swordman_unshielded', count: 4 },
            { type: 'bowman', count: 3 },
            { type: 'iron_pagoda', count: 2 },
        ],
        regions: ['KOREA'],
    },
    {
        name: '帝国时代东南亚军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_armored_elephant', count: 2 },
            { type: 'champion', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
        regions: ['SEASIA_IMPERIAL'],
    },
    {
        name: '帝国时代中亚军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'elite_kipchak', count: 4 },
            { type: 'kipchak', count: 2 },
            { type: 'hand_cannoneer', count: 3 },
        ],
        regions: ['CENTRAL_ASIA_IMPERIAL'],
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
    },
    {
        name: '帝国时代北美军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'elite_conquistador', count: 3 },
            { type: 'iroquois_warrior', count: 4 },
            { type: 'hand_cannoneer', count: 2 },
        ],
        regions: ['NORTHAM_IMPERIAL'],
    },
    {
        name: '帝国时代华夏军团',
        formationMode: 'echelon',
        slots: [
            { type: 'jian_swordsman', count: 4 },
            { type: 'chukonu', count: 3 },
            { type: 'fire_archer', count: 2 },
        ],
        regions: ['HUAXIA_IMPERIAL'],
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
    },
    {
        name: '帝国时代印度军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_armored_elephant', count: 2 },
            { type: 'imperial_camel_rider', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
        regions: ['INDIA_IMPERIAL'],
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
    },
    {
        name: '帝国时代大明军团',
        formationMode: 'echelon',
        slots: [
            { type: 'fire_lancer', count: 4 },
            { type: 'elite_fire_archer', count: 3 },
            { type: 'mangudai_elite', count: 2 },
        ],
        regions: ['MING'],
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
    },
    {
        name: '帝国时代日本军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'samurai', count: 3 },
            { type: 'samurai_elite', count: 4 },
            { type: 'ninja', count: 2 },
        ],
        regions: ['JAPAN_IMPERIAL'],
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
    },
    {
        name: '帝国时代朝鲜军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'jian_swordman_shielded', count: 2 },
            { type: 'war_wagon', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
        regions: ['JOSEON'],
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
    },
    {
        name: '帝国时代满洲军团',
        formationMode: 'square',
        slots: [
            { type: 'kipchak', count: 3 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'cav_archer_heavy', count: 3 },
        ],
        regions: ['MANCHU'],
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
    },
    {
        name: '帝国时代草原军团',
        formationMode: 'balance_yoke',
        slots: [
            { type: 'elite_keshik', count: 4 },
            { type: 'elite_steppe_lancer', count: 2 },
            { type: 'mangudai_elite', count: 3 },
        ],
        regions: ['STEPPE_IMPERIAL'],
    },
    {
        name: '帝国时代莫卧儿军团',
        formationMode: 'crane_wing',
        slots: [
            { type: 'war_elephant', count: 2 },
            { type: 'archer', count: 4 },
            { type: 'imperial_camel_rider', count: 3 },
        ],
        regions: ['MUGHAL'],
    },
    {
        name: '帝国时代西域军团',
        formationMode: 'triangle',
        slots: [
            { type: 'kipchak', count: 2 },
            { type: 'elite_kipchak', count: 3 },
            { type: 'hand_cannoneer', count: 4 },
        ],
        regions: ['WESTERN_IMPERIAL'],
    },
    {
        name: '帝国时代锡克军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'chakram_thrower', count: 3 },
            { type: 'urumi_swordsman', count: 4 },
            { type: 'shrivamsha_rider', count: 2 },
        ],
        regions: ['SIKH'],
    },
    {
        name: '帝国时代青藏军团',
        formationMode: 'triangle',
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'keshik', count: 3 },
            { type: 'mangudai_elite', count: 4 },
        ],
        regions: ['TIBET_IMPERIAL'],
    },
    {
        name: '帝国时代非洲军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'genitour', count: 3 },
            { type: 'elite_genitour', count: 4 },
            { type: 'hand_cannoneer', count: 2 },
        ],
        regions: ['AFRICA_IMPERIAL'],
    },
    {
        name: '古典时代魏晋军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'white_feather_guard', count: 3 },
            { type: 'chukonu', count: 4 },
            { type: 'elite_tiger_cavalry', count: 2 },
        ],
        regions: [],
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
    },
    {
        name: '城堡时代孟加拉军团',
        formationMode: 'triangle',
        slots: [
            { type: 'ghulam', count: 2 },
            { type: 'chakram_thrower', count: 3 },
            { type: 'elite_ratha_ranged', count: 4 },
        ],
        regions: [],
    },
    {
        name: '古典时代摩揭陀军团',
        formationMode: 'triangle',
        slots: [
            { type: 'sickle_warrior', count: 2 },
            { type: 'antiquity_skirmisher', count: 3 },
            { type: 'ratha_ranged', count: 4 },
        ],
        regions: [],
    },
    {
        name: '古典时代加拉太军团',
        formationMode: 'triangle',
        slots: [
            { type: 'antiquity_skirmisher', count: 2 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'war_chariot', count: 4 },
        ],
        regions: [],
    },
    {
        name: '古典时代波斯联合军团',
        formationMode: 'fish_scale',
        slots: [
            { type: 'mercenary_hoplite', count: 3 },
            { type: 'lancer', count: 4 },
            { type: 'antiquity_skirmisher', count: 2 },
        ],
        regions: [],
    },
    {
        name: '古典时代迦南军团',
        formationMode: 'crescent',
        slots: [
            { type: 'mercenary_hoplite', count: 3 },
            { type: 'sparabara', count: 2 },
            { type: 'antiquity_skirmisher', count: 4 },
        ],
        regions: [],
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
    },
];

export const LEVEL_3_LEGION_MAP: ReadonlyMap<string, Level3LegionDef> =
    new Map(LEVEL_3_LEGIONS.map(l => [l.name, l]));

export const LEVEL_3_LEGION_NAMES: ReadonlySet<string> =
    new Set(LEVEL_3_LEGIONS.map(l => l.name));
