/**
 * 🔴 [2026-09-14 主人定] 二级：59 个文明专属军团（严格按四时代划分与 59 文明专属城堡对应）
 * 古典时代 13 支 + 封建时代 13 支 + 城堡时代 29 支 + 帝国时代 4 支 = 59 支
 * 军团兵种编制铁律：严格对齐史实特色兵种与精锐/高级档，总数=9
 */
import type { RegionType } from '../systems/RegionSystem';
import type { FormationMode, CompositionSlot } from '../types/CultureFormations';

export interface Level2CivLegionDef {
    name: string;
    civ: string;
    age: 'antiquity' | 'feudal' | 'castle' | 'imperial';
    deStyle: string;
    region: RegionType;
    castleId: string;
    castleName: string;
    formationMode: FormationMode;
    slots: CompositionSlot[];
}

export const LEVEL_2_CIV_59_LEGIONS: Level2CivLegionDef[] = [
    {
        name: '古典华夏中原军团', civ: '中国', age: 'antiquity', deStyle: 'ASIA', region: 'CENTRAL' as RegionType,
        castleId: 'CHIN_CASTLE_AGE3', castleName: '中国 北方华北·汉唐城楼',
        formationMode: 'square',
        slots: [
            { type: 'elite_white_feather_guard', count: 3 },
            { type: 'elite_chukonu', count: 3 },
            { type: 'elite_fire_archer', count: 3 },
        ],
    },
    {
        name: '古典华夏巴蜀军团', civ: '蜀', age: 'antiquity', deStyle: 'ASIA', region: 'BASHU' as RegionType,
        castleId: 'SHU_CASTLE_AGE3', castleName: '蜀汉 汉式斗拱望楼',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_white_feather_guard', count: 4 },
            { type: 'white_feather_guard', count: 3 },
            { type: 'elite_chukonu', count: 2 },
        ],
    },
    {
        name: '古典华夏江南军团', civ: '吴', age: 'antiquity', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        castleId: 'WU_CASTLE_AGE3', castleName: '东吴 水乡飞檐水榭',
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordman_shielded', count: 2 },
            { type: 'fire_archer', count: 3 },
            { type: 'elite_fire_archer', count: 4 },
        ],
    },
    {
        name: '古典华夏北方军团', civ: '曹魏', age: 'antiquity', deStyle: 'ASIA', region: 'WEI' as RegionType,
        castleId: 'WEI_CASTLE_AGE3', castleName: '曹魏 邺城重檐铜雀楼',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_tiger_cavalry', count: 4 },
            { type: 'tiger_rider', count: 3 },
            { type: 'elite_chukonu', count: 2 },
        ],
    },
    {
        name: '古典时代凯尔特军团', civ: '凯尔特', age: 'antiquity', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        castleId: 'CELT_CASTLE_AGE3', castleName: '不列颠/凯尔特 苏格兰高地圆塔',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_woad_raider', count: 4 },
            { type: 'woad_raider', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 2 },
        ],
    },
    {
        name: '古典时代孟加拉军团', civ: '孟加拉', age: 'antiquity', deStyle: 'INDI', region: 'BENGALIS' as RegionType,
        castleId: 'BENG_CASTLE_AGE3', castleName: '孟加拉 恒河三角洲砖石堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_ratha_melee', count: 4 },
            { type: 'ratha_melee', count: 3 },
            { type: 'elite_ratha_ranged', count: 2 },
        ],
    },
    {
        name: '古典时代罗马军团', civ: '罗马', age: 'antiquity', deStyle: 'MEDI', region: 'ROMA' as RegionType,
        castleId: 'ROMA_CASTLE_AGE3', castleName: '罗马 帝国古典方石要塞',
        formationMode: 'echelon',
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'centurion', count: 3 },
            { type: 'elite_centurion', count: 2 },
        ],
    },
    {
        name: '古典时代阿契美尼德军团', civ: '阿契美尼德', age: 'antiquity', deStyle: 'PERSIAN', region: 'ACHAEMENIDS' as RegionType,
        castleId: 'ACHA_CASTLE_AGE3', castleName: '阿契美尼德 波斯波利斯万国门石台',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_immortal', count: 4 },
            { type: 'immortal', count: 3 },
            { type: 'elite_immortal_ranged', count: 2 },
        ],
    },
    {
        name: '古典时代雅典军团', civ: '雅典', age: 'antiquity', deStyle: 'GREEK', region: 'ATHENIANS' as RegionType,
        castleId: 'ATHE_CASTLE_AGE3', castleName: '雅典 卫城多立克柱廊卫堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_strategos', count: 4 },
            { type: 'strategos', count: 3 },
            { type: 'elite_greek_cavalry', count: 2 },
        ],
    },
    {
        name: '古典时代斯巴达军团', civ: '斯巴达', age: 'antiquity', deStyle: 'GREEK', region: 'SPARTANS' as RegionType,
        castleId: 'SPAR_CASTLE_AGE3', castleName: '斯巴达 泰格特斯山青石重垒',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_hippeus', count: 4 },
            { type: 'hippeus', count: 3 },
            { type: 'elite_greek_cavalry', count: 2 },
        ],
    },
    {
        name: '古典时代马其顿军团', civ: '马其顿', age: 'antiquity', deStyle: 'GREEK', region: 'MACEDONIAN' as RegionType,
        castleId: 'MACE_CASTLE_AGE3', castleName: '马其顿 佩拉要塞重石堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_phalangite', count: 4 },
            { type: 'phalangite', count: 3 },
            { type: 'elite_companion_cavalry', count: 2 },
        ],
    },
    {
        name: '古典时代色雷斯军团', civ: '色雷斯', age: 'antiquity', deStyle: 'THRACIAN', region: 'THRACIAN' as RegionType,
        castleId: 'THRA_CASTLE_AGE3', castleName: '色雷斯 罗多彼山蛮族巨石堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_rhomphaia_warrior', count: 4 },
            { type: 'rhomphaia_warrior', count: 3 },
            { type: 'elite_peltast', count: 2 },
        ],
    },
    {
        name: '古典时代普鲁军团', civ: '普鲁', age: 'antiquity', deStyle: 'PURU', region: 'PURU' as RegionType,
        castleId: 'PURU_CASTLE_AGE3', castleName: '普鲁·南亚 旁遮普红砂岩堡',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_sannahya', count: 2 },
            { type: 'pattiyoda_longbowman', count: 3 },
            { type: 'elite_pattiyoda_longbowman', count: 4 },
        ],
    },
    {
        name: '封建时代法兰克军团', civ: '法兰克', age: 'feudal', deStyle: 'WEST', region: 'FRANKS' as RegionType,
        castleId: 'FRAN_CASTLE_AGE3', castleName: '法兰克 卢瓦尔河双圆塔石堡',
        formationMode: 'triangle',
        slots: [
            { type: 'frankish_paladin', count: 2 },
            { type: 'throwing_axeman', count: 3 },
            { type: 'elite_throwing_axeman', count: 4 },
        ],
    },
    {
        name: '封建时代哥特军团', civ: '哥特', age: 'feudal', deStyle: 'WEST', region: 'GOTHS' as RegionType,
        castleId: 'GOTH_CASTLE_AGE3', castleName: '哥特 早期蛮族石砌据点',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_huskarl', count: 4 },
            { type: 'huskarl', count: 3 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    {
        name: '封建时代拜占庭军团', civ: '拜占庭', age: 'feudal', deStyle: 'EAST', region: 'BYZANTINE' as RegionType,
        castleId: 'BYZA_CASTLE_AGE3', castleName: '拜占庭 君士坦丁堡红砖穹顶堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_cataphract', count: 4 },
            { type: 'cataphract', count: 3 },
            { type: 'heavy_pikeman', count: 2 },
        ],
    },
    {
        name: '封建时代波斯军团', civ: '波斯', age: 'feudal', deStyle: 'PERSIAN', region: 'SASANIAN' as RegionType,
        castleId: 'PERS_CASTLE_AGE3', castleName: '波斯 萨珊泰西封砖石穹顶堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_war_elephant', count: 4 },
            { type: 'war_elephant', count: 3 },
            { type: 'savar', count: 2 },
        ],
    },
    {
        name: '封建时代维京军团', civ: '维京', age: 'feudal', deStyle: 'WEST', region: 'VIKINGS' as RegionType,
        castleId: 'VIKI_CASTLE_AGE3', castleName: '维京 斯堪的纳维亚环形堡垒',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_berserk', count: 4 },
            { type: 'berserk', count: 3 },
            { type: 'jarl', count: 2 },
        ],
    },
    {
        name: '封建时代匈人军团', civ: '匈人', age: 'feudal', deStyle: 'CEAS', region: 'HUNS' as RegionType,
        castleId: 'HUNS_CASTLE_AGE3', castleName: '匈奴/匈人 简易木石混合要塞',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_tarkan', count: 4 },
            { type: 'tarkan', count: 3 },
            { type: 'cav_archer_heavy', count: 2 },
        ],
    },
    {
        name: '封建时代埃塞俄比亚军团', civ: '埃塞俄比亚', age: 'feudal', deStyle: 'AFRI', region: 'ETHIOPIANS' as RegionType,
        castleId: 'ETHI_CASTLE_AGE3', castleName: '埃塞俄比亚 阿克苏姆巨石柱堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_shotel_warrior', count: 4 },
            { type: 'shotel_warrior', count: 3 },
            { type: 'elite_camel_archer', count: 2 },
        ],
    },
    {
        name: '封建时代柏柏尔军团', civ: '柏柏尔', age: 'feudal', deStyle: 'AFRI', region: 'BERBER' as RegionType,
        castleId: 'BERB_CASTLE_AGE3', castleName: '柏柏尔 撒哈拉泥砖防御碉堡',
        formationMode: 'triangle',
        slots: [
            { type: 'camel_raider', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    {
        name: '封建时代高棉军团', civ: '高棉', age: 'feudal', deStyle: 'SEAS', region: 'KHMER' as RegionType,
        castleId: 'SEAS_CASTLE_AGE3', castleName: '东南亚/高棉 吴哥窟砂岩塔',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'ballista_elephant', count: 3 },
            { type: 'elite_ballista_elephant', count: 4 },
        ],
    },
    {
        name: '封建时代保加利亚军团', civ: '保加利亚', age: 'feudal', deStyle: 'SLAV', region: 'BULGARIANS' as RegionType,
        castleId: 'BULG_CASTLE_AGE3', castleName: '保加利亚 普雷斯拉夫圆顶城堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_konnik', count: 4 },
            { type: 'konnik', count: 3 },
            { type: 'elite_konnik_foot', count: 2 },
        ],
    },
    {
        name: '封建时代瞿折罗军团', civ: '瞿折罗', age: 'feudal', deStyle: 'INDI', region: 'GURJARAS' as RegionType,
        castleId: 'GURJ_CASTLE_AGE3', castleName: '瞿折罗 索姆纳特多层砂岩堡',
        formationMode: 'triangle',
        slots: [
            { type: 'camel_scout', count: 2 },
            { type: 'elite_shrivamsha_rider', count: 3 },
            { type: 'elite_chakram_thrower', count: 4 },
        ],
    },
    {
        name: '封建时代亚美尼亚军团', civ: '亚美尼亚', age: 'feudal', deStyle: 'EAST', region: 'ARMENIANS' as RegionType,
        castleId: 'ARME_CASTLE_AGE3', castleName: '亚美尼亚 埃奇米阿津石砌山顶堡',
        formationMode: 'triangle',
        slots: [
            { type: 'warrior_priest', count: 2 },
            { type: 'composite_bowman', count: 3 },
            { type: 'elite_composite_bowman', count: 4 },
        ],
    },
    {
        name: '封建时代契丹军团', civ: '契丹', age: 'feudal', deStyle: 'ASIA', region: 'KHITAN' as RegionType,
        castleId: 'KHIT_CASTLE_AGE3', castleName: '契丹 辽阳八角木石塔楼',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_liao_dao', count: 4 },
            { type: 'liao_dao', count: 3 },
            { type: 'hei_kuang_heavy', count: 2 },
        ],
    },
    {
        name: '城堡时代不列颠军团', civ: '不列颠', age: 'castle', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        castleId: 'CELT_CASTLE_AGE3', castleName: '不列颠/凯尔特 苏格兰高地圆塔',
        formationMode: 'triangle',
        slots: [
            { type: 'paladin', count: 2 },
            { type: 'longbowman', count: 3 },
            { type: 'longbowman_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代条顿军团', civ: '条顿', age: 'castle', deStyle: 'WEST', region: 'GERMANIC' as RegionType,
        castleId: 'WEST_CASTLE_AGE3', castleName: '西欧/条顿 莱茵河方型石砌堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'teutonic_knight', count: 3 },
            { type: 'arbalest', count: 2 },
        ],
    },
    {
        name: '城堡时代日本军团', civ: '日本', age: 'castle', deStyle: 'ASIA', region: 'JAPAN' as RegionType,
        castleId: 'ASIA_CASTLE_AGE3', castleName: '东亚/日本 姬路式多重天守阁',
        formationMode: 'echelon',
        slots: [
            { type: 'samurai_elite', count: 4 },
            { type: 'samurai', count: 3 },
            { type: 'ninja', count: 2 },
        ],
    },
    {
        name: '城堡时代萨拉森军团', civ: '萨拉森', age: 'castle', deStyle: 'ORIE', region: 'ORIE' as RegionType,
        castleId: 'ORIE_CASTLE_AGE3', castleName: '中东/萨拉森 开罗萨拉丁大城堡',
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
        ],
    },
    {
        name: '城堡时代蒙古军团', civ: '蒙古', age: 'castle', deStyle: 'ASIA', region: 'MONGOL' as RegionType,
        castleId: 'MONG_CASTLE_AGE3', castleName: '蒙古 哈拉和林木石大斡耳朵',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_keshik', count: 2 },
            { type: 'mangudai', count: 3 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代阿兹特克军团', civ: '阿兹特克', age: 'castle', deStyle: 'MESO', region: 'AMERICA' as RegionType,
        castleId: 'MESO_CASTLE_AGE3', castleName: '中美洲/阿兹特克 特诺奇蒂特兰金字塔',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_jaguar_warrior', count: 4 },
            { type: 'jaguar_warrior', count: 3 },
            { type: 'xolotl_warrior', count: 2 },
        ],
    },
    {
        name: '城堡时代玛雅军团', civ: '玛雅', age: 'castle', deStyle: 'MESO', region: 'MAYANS' as RegionType,
        castleId: 'MAYA_CASTLE_AGE3', castleName: '玛雅 奇琴伊察阶梯神庙堡',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_eagle_warrior', count: 2 },
            { type: 'plumed_archer', count: 3 },
            { type: 'elite_plumed_archer', count: 4 },
        ],
    },
    {
        name: '城堡时代朝鲜军团', civ: '朝鲜', age: 'castle', deStyle: 'ASIA', region: 'KOREA' as RegionType,
        castleId: 'KORE_CASTLE_AGE3', castleName: '朝鲜 汉阳南汉山城堞楼',
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordman_shielded', count: 2 },
            { type: 'war_wagon', count: 3 },
            { type: 'elite_war_wagon', count: 4 },
        ],
    },
    {
        name: '城堡时代意大利军团', civ: '意大利', age: 'castle', deStyle: 'MEDI', region: 'LATIN' as RegionType,
        castleId: 'MEDI_CASTLE_AGE3', castleName: '地中海/意大利 威尼斯总督红顶宫',
        formationMode: 'triangle',
        slots: [
            { type: 'condottiero', count: 2 },
            { type: 'genoese_crossbowman', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    {
        name: '城堡时代印度斯坦军团', civ: '印度斯坦', age: 'castle', deStyle: 'INDI', region: 'MUGHAL' as RegionType,
        castleId: 'HIND_CASTLE_AGE3', castleName: '印度斯坦 德里红堡莫卧儿红砂岩',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_ghulam', count: 4 },
            { type: 'ghulam', count: 3 },
            { type: 'imperial_camel_rider', count: 2 },
        ],
    },
    {
        name: '城堡时代印加军团', civ: '印加', age: 'castle', deStyle: 'ANDE', region: 'INCA' as RegionType,
        castleId: 'INCA_CASTLE_AGE3', castleName: '印加 库斯科萨克萨瓦曼巨石堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_champi_warrior', count: 4 },
            { type: 'champi_warrior', count: 3 },
            { type: 'slinger', count: 2 },
        ],
    },
    {
        name: '城堡时代马扎尔军团', civ: '马扎尔', age: 'castle', deStyle: 'SLAV', region: 'MAGYAR' as RegionType,
        castleId: 'MAGY_CASTLE_AGE3', castleName: '马扎尔 布达佩斯多瑙河石堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_magyar_huszar', count: 4 },
            { type: 'magyar_huszar', count: 3 },
            { type: 'recurve_bowman', count: 2 },
        ],
    },
    {
        name: '城堡时代斯拉夫军团', civ: '斯拉夫', age: 'castle', deStyle: 'SLAV', region: 'SLAVIC' as RegionType,
        castleId: 'SLAV_CASTLE_AGE3', castleName: '东欧/斯拉夫 莫斯科白石克里姆林',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_boyar', count: 4 },
            { type: 'boyar', count: 3 },
            { type: 'heavy_pikeman', count: 2 },
        ],
    },
    {
        name: '城堡时代马里军团', civ: '马里', age: 'castle', deStyle: 'AFRI', region: 'AFRICA' as RegionType,
        castleId: 'AFRI_CASTLE_AGE3', castleName: '非洲/马里 杰内大清真寺泥石堡',
        formationMode: 'triangle',
        slots: [
            { type: 'cavalier', count: 2 },
            { type: 'gbeto', count: 3 },
            { type: 'elite_gbeto', count: 4 },
        ],
    },
    {
        name: '城堡时代马来军团', civ: '马来', age: 'castle', deStyle: 'SEAS', region: 'MALAY' as RegionType,
        castleId: 'MALA_CASTLE_AGE3', castleName: '马来 马六甲海峡水上海堡',
        formationMode: 'echelon',
        slots: [
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'karambit_warrior', count: 3 },
            { type: 'elite_battle_elephant', count: 2 },
        ],
    },
    {
        name: '城堡时代缅甸军团', civ: '缅甸', age: 'castle', deStyle: 'SEAS', region: 'BURMESE' as RegionType,
        castleId: 'BURM_CASTLE_AGE3', castleName: '缅甸 蒲甘千佛塔金顶堡',
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'arambai', count: 3 },
            { type: 'elite_arambai', count: 4 },
        ],
    },
    {
        name: '城堡时代越南军团', civ: '越南', age: 'castle', deStyle: 'SEAS', region: 'VIETNAMESE' as RegionType,
        castleId: 'VIET_CASTLE_AGE3', castleName: '越南 顺化京城多檐城门楼',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'rattan_archer', count: 3 },
            { type: 'rattan_archer_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代鞑靼军团', civ: '鞑靼', age: 'castle', deStyle: 'CEAS', region: 'CENTRAL_ASIA' as RegionType,
        castleId: 'CEAS_CASTLE_AGE3', castleName: '中亚/鞑靼 撒马尔罕帖木儿蓝顶堡',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_keshik', count: 2 },
            { type: 'mangudai', count: 3 },
            { type: 'mangudai_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代库曼军团', civ: '库曼', age: 'castle', deStyle: 'CEAS', region: 'CUMAN' as RegionType,
        castleId: 'CUMA_CASTLE_AGE3', castleName: '库曼 黑海北岸克里米亚要塞',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_steppe_lancer', count: 2 },
            { type: 'kipchak', count: 3 },
            { type: 'elite_kipchak', count: 4 },
        ],
    },
    {
        name: '城堡时代立陶宛军团', civ: '立陶宛', age: 'castle', deStyle: 'SLAV', region: 'LITHUANIANS' as RegionType,
        castleId: 'LITH_CASTLE_AGE3', castleName: '立陶宛 特拉凯湖心红砖城堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_leitis', count: 4 },
            { type: 'leitis', count: 3 },
            { type: 'winged_hussar', count: 2 },
        ],
    },
    {
        name: '城堡时代勃艮第军团', civ: '勃艮第', age: 'castle', deStyle: 'WEST', region: 'BURGUNDIANS' as RegionType,
        castleId: 'BURG_CASTLE_AGE3', castleName: '勃艮第 第戎公爵宫圆锥塔',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_coustillier', count: 4 },
            { type: 'coustillier', count: 3 },
            { type: 'flemish_pikeman', count: 2 },
        ],
    },
    {
        name: '城堡时代西西里军团', civ: '西西里', age: 'castle', deStyle: 'MEDI', region: 'SICILIANS' as RegionType,
        castleId: 'SICI_CASTLE_AGE3', castleName: '西西里 诺曼巴勒莫王宫堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_serjeant', count: 4 },
            { type: 'serjeant', count: 3 },
            { type: 'crusader_knight', count: 2 },
        ],
    },
    {
        name: '城堡时代波兰军团', civ: '波兰', age: 'castle', deStyle: 'SLAV', region: 'POLES' as RegionType,
        castleId: 'POLE_CASTLE_AGE3', castleName: '波兰 马尔堡红砖条顿古堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_obuch', count: 4 },
            { type: 'obuch', count: 3 },
            { type: 'winged_hussar', count: 2 },
        ],
    },
    {
        name: '城堡时代波希米亚军团', civ: '波希米亚', age: 'castle', deStyle: 'SLAV', region: 'BOHEMIANS' as RegionType,
        castleId: 'BOHE_CASTLE_AGE3', castleName: '波希米亚 卡尔施泰因城堡',
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'hussite_wagon', count: 3 },
            { type: 'elite_hussite_wagon', count: 4 },
        ],
    },
    {
        name: '城堡时代达罗毗荼军团', civ: '达罗毗荼', age: 'castle', deStyle: 'INDI', region: 'INDIA' as RegionType,
        castleId: 'INDI_CASTLE_AGE3', castleName: '南亚/达罗毗荼 坦贾武尔寺庙高塔堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_elephant_archer', count: 2 },
        ],
    },
    {
        name: '城堡时代格鲁吉亚军团', civ: '格鲁吉亚', age: 'castle', deStyle: 'EAST', region: 'GEORGIANS' as RegionType,
        castleId: 'GEOR_CASTLE_AGE3', castleName: '格鲁吉亚 高加索斯万石塔古堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_monaspa', count: 4 },
            { type: 'monaspa', count: 3 },
            { type: 'elite_composite_bowman', count: 2 },
        ],
    },
    {
        name: '城堡时代女真军团', civ: '女真', age: 'castle', deStyle: 'ASIA', region: 'NORTHEAST' as RegionType,
        castleId: 'JURC_CASTLE_AGE3', castleName: '女真 会宁府上京双檐角楼',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_iron_pagoda', count: 4 },
            { type: 'iron_pagoda', count: 3 },
            { type: 'jian_swordman_shielded', count: 2 },
        ],
    },
    {
        name: '城堡时代穆伊斯卡军团', civ: '穆伊斯卡', age: 'castle', deStyle: 'ANDE', region: 'MUISCA' as RegionType,
        castleId: 'MUIS_CASTLE_AGE3', castleName: '穆伊斯卡 瓜塔维塔黄金湖石堡',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_temple_guard', count: 2 },
            { type: 'guecha_warrior', count: 3 },
            { type: 'elite_guecha_warrior', count: 4 },
        ],
    },
    {
        name: '城堡时代图皮军团', civ: '图皮', age: 'castle', deStyle: 'ANDE', region: 'TUPI' as RegionType,
        castleId: 'TUPI_CASTLE_AGE3', castleName: '图皮 亚马逊雨林木栅重垒',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_ibirapema_warrior', count: 2 },
            { type: 'blackwood_archer', count: 3 },
            { type: 'elite_blackwood_archer', count: 4 },
        ],
    },
    {
        name: '帝国时代西班牙军团', civ: '西班牙', age: 'imperial', deStyle: 'MEDI', region: 'SPANISH' as RegionType,
        castleId: 'SPAN_CASTLE_AGE3', castleName: '西班牙 塞戈维亚阿尔卡萨堡',
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    {
        name: '帝国时代葡萄牙军团', civ: '葡萄牙', age: 'imperial', deStyle: 'MEDI', region: 'PORTUGUESE' as RegionType,
        castleId: 'PORT_CASTLE_AGE3', castleName: '葡萄牙 贝伦塔大西洋海堡',
        formationMode: 'triangle',
        slots: [
            { type: 'cavalier', count: 2 },
            { type: 'organ_gun', count: 3 },
            { type: 'elite_organ_gun', count: 4 },
        ],
    },
    {
        name: '帝国时代土耳其军团', civ: '土耳其', age: 'imperial', deStyle: 'CEAS', region: 'TURKS' as RegionType,
        castleId: 'TURK_CASTLE_AGE3', castleName: '土耳其/奥斯曼 托普卡珀皇宫圆堡',
        formationMode: 'triangle',
        slots: [
            { type: 'hussar', count: 2 },
            { type: 'janissary', count: 3 },
            { type: 'elite_janissary', count: 4 },
        ],
    },
    {
        name: '帝国时代马普切军团', civ: '马普切', age: 'imperial', deStyle: 'ANDE', region: 'MAPUCHE' as RegionType,
        castleId: 'MAPU_CASTLE_AGE3', castleName: '马普切 安第斯南麓木石据点',
        formationMode: 'triangle',
        slots: [
            { type: 'elite_kona', count: 2 },
            { type: 'bolas_rider', count: 3 },
            { type: 'elite_bolas_rider', count: 4 },
        ],
    },
];

export const LEVEL_2_CIV_59_NAMES: Set<string> = new Set(LEVEL_2_CIV_59_LEGIONS.map(l => l.name));
export const LEVEL_2_CIV_59_MAP: Map<string, Level2CivLegionDef> = new Map(
    LEVEL_2_CIV_59_LEGIONS.map(l => [l.name, l])
);

export const LEVEL_2_CIV_CIV_MAP: Map<string, Level2CivLegionDef> = new Map(
    LEVEL_2_CIV_59_LEGIONS.map(l => [l.civ, l])
);
// 兼容突厥别名
const turkLegion = LEVEL_2_CIV_59_LEGIONS.find(l => l.civ === '土耳其');
if (turkLegion) {
    LEVEL_2_CIV_CIV_MAP.set('突厥', turkLegion);
    LEVEL_2_CIV_59_MAP.set('帝国时代突厥军团', turkLegion);
}

/**
 * 军团名是否属于「**二级：文明 × 时代（59 文明专属军团）**」——
 * 严格只收录主人定稿的 59 个二级军团名（其余全部归入三级自建军团）。
 */
export function isCivEraLegion(name: string): boolean {
    return LEVEL_2_CIV_59_NAMES.has(name);
}
