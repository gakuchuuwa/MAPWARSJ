/**
 * 🔴 [2026-09-14 主人定] 二级：59 个文明专属军团（严格按四时代划分与 59 文明专属城堡对应）
 * 古典时代 13 支 + 封建时代 13 支 + 城堡时代 29 支 + 帝国时代 4 支 = 59 支
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
        formationMode: 'crescent',
        slots: [
            { type: 'jian_swordsman', count: 3 },
            { type: 'antiquity_light_cavalry', count: 2 },
            { type: 'chukonu', count: 4 },
        ],
    },
    {
        name: '古典时代凯尔特军团', civ: '凯尔特', age: 'antiquity', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        castleId: 'CELT_CASTLE_AGE3', castleName: '不列颠/凯尔特 苏格兰高地圆塔',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_woad_raider', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'knight', count: 2 },
        ],
    },
    {
        name: '古典时代孟加拉军团', civ: '孟加拉', age: 'antiquity', deStyle: 'INDI', region: 'BENGALIS' as RegionType,
        castleId: 'BENG_CASTLE_AGE3', castleName: '孟加拉 比什努布尔红砖堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'antiquity_spearman', count: 3 },
            { type: 'elite_ratha_melee', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '古典时代罗马军团', civ: '罗马', age: 'antiquity', deStyle: 'MEDI', region: 'ROMA' as RegionType,
        castleId: 'ROMA_CASTLE_AGE3', castleName: '罗马 军团古典方石堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'antiquity_spearman', count: 3 },
            { type: 'legionary', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '古典时代阿契美尼德军团', civ: '阿契美尼德', age: 'antiquity', deStyle: 'PERSIAN', region: 'PERSIAN' as RegionType,
        castleId: 'PERSIAN_CASTLE_AGE3', castleName: '波斯传统 阿契美尼德石堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'sparabara', count: 3 },
            { type: 'immortal', count: 4 },
            { type: 'antiquity_light_cavalry', count: 2 },
        ],
    },
    {
        name: '古典时代雅典军团', civ: '雅典', age: 'antiquity', deStyle: 'GREEK', region: 'ATHENIANS' as RegionType,
        castleId: 'ATHENIANS_CASTLE_AGE3', castleName: '雅典 阿提卡卫城要塞',
        formationMode: 'fish_scale',
        slots: [
            { type: 'hoplite', count: 3 },
            { type: 'strategos', count: 4 },
            { type: 'gastraphetes', count: 2 },
        ],
    },
    {
        name: '古典时代斯巴达军团', civ: '斯巴达', age: 'antiquity', deStyle: 'GREEK', region: 'SPARTANS' as RegionType,
        castleId: 'SPARTANS_CASTLE_AGE3', castleName: '斯巴达 拉哥尼亚军营石堡',
        formationMode: 'crane_wing',
        slots: [
            { type: 'hoplite', count: 2 },
            { type: 'hippeus', count: 4 },
            { type: 'gastraphetes', count: 3 },
        ],
    },
    {
        name: '华夏巴蜀军团', civ: '蜀', age: 'antiquity', deStyle: 'ASIA', region: 'BASHU' as RegionType,
        castleId: 'SHU_CASTLE_AGE3', castleName: '蜀汉 巴蜀剑阁木关',
        formationMode: 'echelon',
        slots: [
            { type: 'white_feather_guard', count: 4 },
            { type: 'chukonu', count: 3 },
            { type: 'antiquity_light_cavalry', count: 2 },
        ],
    },
    {
        name: '华夏江南军团', civ: '吴', age: 'antiquity', deStyle: 'ASIA', region: 'JIANGNAN' as RegionType,
        castleId: 'WU_CASTLE_AGE3', castleName: '孙吴 江南水榭坞堡',
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'fire_archer', count: 4 },
        ],
    },
    {
        name: '华夏北方军团', civ: '曹魏', age: 'antiquity', deStyle: 'ASIA', region: 'WEI' as RegionType,
        castleId: 'WEI_CASTLE_AGE3', castleName: '曹魏 中原高台阙楼',
        formationMode: 'crane_wing',
        slots: [
            { type: 'jian_swordsman', count: 2 },
            { type: 'tiger_rider', count: 4 },
            { type: 'crossbowman', count: 3 },
        ],
    },
    {
        name: '古典时代马其顿军团', civ: '马其顿', age: 'antiquity', deStyle: 'GREEK', region: 'MACEDONIAN' as RegionType,
        castleId: 'MACEDONIAN_CASTLE_AGE3', castleName: '马其顿 希马鲁石塔城堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'hoplite', count: 3 },
            { type: 'phalangite', count: 4 },
            { type: 'companion_cavalry', count: 2 },
        ],
    },
    {
        name: '古典时代色雷斯军团', civ: '色雷斯', age: 'antiquity', deStyle: 'THRACIAN', region: 'THRACIAN' as RegionType,
        castleId: 'THRACIAN_CASTLE_AGE3', castleName: '色雷斯 古典要塞',
        formationMode: 'echelon',
        slots: [
            { type: 'rhomphaia_warrior', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'scout_cavalry', count: 2 },
        ],
    },
    {
        name: '古典时代普鲁军团', civ: '普鲁', age: 'antiquity', deStyle: 'PURU', region: 'PURU' as RegionType,
        castleId: 'PURU_CASTLE_AGE3', castleName: '普鲁 孔雀帝国粗石圆塔',
        formationMode: 'triangle',
        slots: [
            { type: 'war_elephant', count: 2 },
            { type: 'spearman', count: 3 },
            { type: 'pattiyoda_longbowman', count: 4 },
        ],
    },
    {
        name: '封建时代法兰克军团', civ: '法兰克', age: 'feudal', deStyle: 'WEST', region: 'FRANKS' as RegionType,
        castleId: 'FRAN_CASTLE_AGE3', castleName: '法兰克 加洛林石堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'spearman', count: 3 },
            { type: 'throwing_axeman', count: 4 },
            { type: 'knight', count: 2 },
        ],
    },
    {
        name: '封建时代哥特军团', civ: '哥特', age: 'feudal', deStyle: 'WEST', region: 'GOTHS' as RegionType,
        castleId: 'GOTH_CASTLE_AGE3', castleName: '哥特 蛮族厚重石堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_huskarl', count: 4 },
            { type: 'pikeman', count: 3 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '封建时代拜占庭军团', civ: '拜占庭', age: 'feudal', deStyle: 'EAST', region: 'BYZANTINE' as RegionType,
        castleId: 'BYZA_CASTLE_AGE3', castleName: '拜占庭 东罗马·希腊语帝国要塞',
        formationMode: 'crane_wing',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'cataphract', count: 4 },
            { type: 'archer', count: 3 },
        ],
    },
    {
        name: '封建时代波斯军团', civ: '波斯', age: 'feudal', deStyle: 'PERSIAN', region: 'SASANIAN' as RegionType,
        castleId: 'PERS_CASTLE_AGE3', castleName: '萨珊波斯 巴姆圆城要塞',
        formationMode: 'echelon',
        slots: [
            { type: 'war_elephant', count: 4 },
            { type: 'knight', count: 3 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '封建时代维京军团', civ: '维京', age: 'feudal', deStyle: 'WEST', region: 'VIKINGS' as RegionType,
        castleId: 'VIKI_CASTLE_AGE3', castleName: '维京 诺斯长屋环形要塞',
        formationMode: 'echelon',
        slots: [
            { type: 'berserk', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '封建时代匈人军团', civ: '匈人', age: 'feudal', deStyle: 'CEAS', region: 'HUNS' as RegionType,
        castleId: 'HUNS_CASTLE_AGE3', castleName: '匈人 游牧营垒木石要塞',
        formationMode: 'crane_wing',
        slots: [
            { type: 'cav_archer', count: 2 },
            { type: 'tarkan', count: 4 },
            { type: 'scout_cavalry', count: 3 },
        ],
    },
    {
        name: '封建时代埃塞俄比亚军团', civ: '埃塞俄比亚', age: 'feudal', deStyle: 'AFRI', region: 'ETHIOPIANS' as RegionType,
        castleId: 'ETHI_CASTLE_AGE3', castleName: '埃塞俄比亚 法西尔盖比石堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'spearman', count: 3 },
            { type: 'elite_shotel_warrior', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '封建时代柏柏尔军团', civ: '柏柏尔', age: 'feudal', deStyle: 'AFRI', region: 'BERBER' as RegionType,
        castleId: 'BERB_CASTLE_AGE3', castleName: '北非柏柏尔 卡斯巴土堡',
        formationMode: 'triangle',
        slots: [
            { type: 'scout_cavalry', count: 2 },
            { type: 'spearman', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    {
        name: '封建时代高棉军团', civ: '高棉', age: 'feudal', deStyle: 'SEAS', region: 'KHMER' as RegionType,
        castleId: 'SEAS_CASTLE_AGE3', castleName: '东南亚/高棉 吴哥窟砂岩塔',
        formationMode: 'triangle',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'ballista_elephant', count: 4 },
        ],
    },
    {
        name: '封建时代保加利亚军团', civ: '保加利亚', age: 'feudal', deStyle: 'SLAV', region: 'BULGARIANS' as RegionType,
        castleId: 'BULG_CASTLE_AGE3', castleName: '保加利亚 沙皇要塞',
        formationMode: 'crane_wing',
        slots: [
            { type: 'scout_cavalry', count: 2 },
            { type: 'elite_konnik', count: 4 },
            { type: 'spearman', count: 3 },
        ],
    },
    {
        name: '封建时代瞿折罗军团', civ: '瞿折罗', age: 'feudal', deStyle: 'INDI', region: 'GURJARAS' as RegionType,
        castleId: 'GURJ_CASTLE_AGE3', castleName: '瞿折罗 瓜廖尔石堡',
        formationMode: 'triangle',
        slots: [
            { type: 'camel_rider', count: 2 },
            { type: 'spearman', count: 3 },
            { type: 'chakram_thrower', count: 4 },
        ],
    },
    {
        name: '封建时代亚美尼亚军团', civ: '亚美尼亚', age: 'feudal', deStyle: 'EAST', region: 'ARMENIANS' as RegionType,
        castleId: 'ARME_CASTLE_AGE3', castleName: '亚美尼亚 高山石堡',
        formationMode: 'triangle',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'composite_bowman', count: 4 },
        ],
    },
    {
        name: '封建时代契丹军团', civ: '契丹', age: 'feudal', deStyle: 'ASIA', region: 'KHITAN' as RegionType,
        castleId: 'KHIT_CASTLE_AGE3', castleName: '契丹 辽式边墙要塞',
        formationMode: 'echelon',
        slots: [
            { type: 'liao_dao', count: 4 },
            { type: 'steppe_lancer', count: 3 },
            { type: 'cav_archer', count: 2 },
        ],
    },
    {
        name: '城堡时代不列颠军团', civ: '不列颠', age: 'castle', deStyle: 'WEST', region: 'BRITONS' as RegionType,
        castleId: 'CELT_CASTLE_AGE3', castleName: '不列颠/凯尔特 苏格兰高地圆塔',
        formationMode: 'triangle',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'longbowman_elite', count: 4 },
        ],
    },
    {
        name: '城堡时代条顿军团', civ: '条顿', age: 'castle', deStyle: 'WEST', region: 'GERMANIC' as RegionType,
        castleId: 'WEST_CASTLE_AGE3', castleName: '日耳曼 西欧通用石堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'heavy_pikeman', count: 3 },
            { type: 'knight', count: 2 },
        ],
    },
    {
        name: '城堡时代日本军团', civ: '日本', age: 'castle', deStyle: 'ASIA', region: 'JAPAN' as RegionType,
        castleId: 'ASIA_CASTLE_AGE3', castleName: '日本 重檐天守阁',
        formationMode: 'fish_scale',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'samurai', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '城堡时代萨拉森军团', civ: '萨拉森', age: 'castle', deStyle: 'ORIE', region: 'ORIE' as RegionType,
        castleId: 'ORIE_CASTLE_AGE3', castleName: '阿拉伯 萨拉森生土要塞',
        formationMode: 'crane_wing',
        slots: [
            { type: 'knight', count: 2 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'cav_archer', count: 3 },
        ],
    },
    {
        name: '城堡时代蒙古军团', civ: '蒙古', age: 'castle', deStyle: 'ASIA', region: 'MONGOL' as RegionType,
        castleId: 'MONG_CASTLE_AGE3', castleName: '蒙古 塞外王帐石堡',
        formationMode: 'crescent',
        slots: [
            { type: 'steppe_lancer', count: 3 },
            { type: 'keshik', count: 2 },
            { type: 'mangudai', count: 4 },
        ],
    },
    {
        name: '城堡时代阿兹特克军团', civ: '阿兹特克', age: 'castle', deStyle: 'MESO', region: 'AMERICA' as RegionType,
        castleId: 'MESO_CASTLE_AGE3', castleName: '阿兹特克/墨西加 中美重装金字塔',
        formationMode: 'fish_scale',
        slots: [
            { type: 'spearman', count: 3 },
            { type: 'elite_jaguar_warrior', count: 4 },
            { type: 'eagle_warrior', count: 2 },
        ],
    },
    {
        name: '城堡时代玛雅军团', civ: '玛雅', age: 'castle', deStyle: 'MESO', region: 'MAYANS' as RegionType,
        castleId: 'MAYA_CASTLE_AGE3', castleName: '玛雅 阶梯金字塔',
        formationMode: 'triangle',
        slots: [
            { type: 'eagle_scout', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'elite_plumed_archer', count: 4 },
        ],
    },
    {
        name: '城堡时代朝鲜军团', civ: '朝鲜', age: 'castle', deStyle: 'ASIA', region: 'KOREA' as RegionType,
        castleId: 'KORE_CASTLE_AGE3', castleName: '朝鲜 半岛山城要塞',
        formationMode: 'crescent',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'knight', count: 2 },
            { type: 'elite_war_wagon', count: 4 },
        ],
    },
    {
        name: '城堡时代意大利军团', civ: '意大利', age: 'castle', deStyle: 'MEDI', region: 'LATIN' as RegionType,
        castleId: 'MEDI_CASTLE_AGE3', castleName: '地中海 通用古典石堡',
        formationMode: 'triangle',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'condottiero', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    {
        name: '城堡时代印度斯坦军团', civ: '印度斯坦', age: 'castle', deStyle: 'INDI', region: 'MUGHAL' as RegionType,
        castleId: 'HIND_CASTLE_AGE3', castleName: '印度斯坦/莫卧儿 红砂岩堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'elite_ghulam', count: 4 },
            { type: 'camel_heavy', count: 2 },
        ],
    },
    {
        name: '城堡时代印加军团', civ: '印加', age: 'castle', deStyle: 'ANDE', region: 'INCA' as RegionType,
        castleId: 'INCA_CASTLE_AGE3', castleName: '印加 安第斯主轴',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_champi_warrior', count: 4 },
            { type: 'kamayuk', count: 3 },
            { type: 'eagle_warrior', count: 2 },
        ],
    },
    {
        name: '城堡时代马扎尔军团', civ: '马扎尔', age: 'castle', deStyle: 'SLAV', region: 'MAGYAR' as RegionType,
        castleId: 'MAGY_CASTLE_AGE3', castleName: '马扎尔 匈牙利科文堡',
        formationMode: 'crane_wing',
        slots: [
            { type: 'cav_archer', count: 2 },
            { type: 'elite_magyar_huszar', count: 4 },
            { type: 'knight', count: 3 },
        ],
    },
    {
        name: '城堡时代斯拉夫军团', civ: '斯拉夫', age: 'castle', deStyle: 'SLAV', region: 'SLAVIC' as RegionType,
        castleId: 'SLAV_CASTLE_AGE3', castleName: '东北欧 洋葱顶木石要塞',
        formationMode: 'crane_wing',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'boyar', count: 4 },
            { type: 'archer', count: 3 },
        ],
    },
    {
        name: '城堡时代马里军团', civ: '马里', age: 'castle', deStyle: 'AFRI', region: 'AFRICA' as RegionType,
        castleId: 'AFRI_CASTLE_AGE3', castleName: '西非马里 生土要塞',
        formationMode: 'triangle',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'elite_gbeto', count: 4 },
        ],
    },
    {
        name: '帝国时代马来军团', civ: '马来', age: 'imperial', deStyle: 'SEAS', region: 'MALAY' as RegionType,
        castleId: 'MALA_CASTLE_AGE3', castleName: '马来 满剌加木石水寨',
        formationMode: 'echelon',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
    },
    {
        name: '城堡时代缅甸军团', civ: '缅甸', age: 'castle', deStyle: 'SEAS', region: 'BURMESE' as RegionType,
        castleId: 'BURM_CASTLE_AGE3', castleName: '缅甸 蒲甘佛塔城堡',
        formationMode: 'crane_wing',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'arambai', count: 4 },
            { type: 'war_elephant', count: 3 },
        ],
    },
    {
        name: '城堡时代越南军团', civ: '越南', age: 'castle', deStyle: 'SEAS', region: 'VIETNAMESE' as RegionType,
        castleId: 'VIET_CASTLE_AGE3', castleName: '大越 升龙城重檐',
        formationMode: 'triangle',
        slots: [
            { type: 'swordsman', count: 2 },
            { type: 'spearman', count: 3 },
            { type: 'rattan_archer', count: 4 },
        ],
    },
    {
        name: '城堡时代鞑靼军团', civ: '鞑靼', age: 'castle', deStyle: 'CEAS', region: 'CENTRAL_ASIA' as RegionType,
        castleId: 'CEAS_CASTLE_AGE3', castleName: '中亚 鞑靼赫拉特城堡',
        formationMode: 'crane_wing',
        slots: [
            { type: 'cav_archer', count: 2 },
            { type: 'keshik', count: 4 },
            { type: 'steppe_lancer', count: 3 },
        ],
    },
    {
        name: '城堡时代库曼军团', civ: '库曼', age: 'castle', deStyle: 'CEAS', region: 'CUMAN' as RegionType,
        castleId: 'CUMA_CASTLE_AGE3', castleName: '库曼 草原要塞',
        formationMode: 'crescent',
        slots: [
            { type: 'steppe_lancer', count: 3 },
            { type: 'knight', count: 2 },
            { type: 'kipchak', count: 4 },
        ],
    },
    {
        name: '城堡时代立陶宛军团', civ: '立陶宛', age: 'castle', deStyle: 'SLAV', region: 'LITHUANIANS' as RegionType,
        castleId: 'LITH_CASTLE_AGE3', castleName: '立陶宛 特拉凯湖中堡',
        formationMode: 'crane_wing',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'elite_leitis', count: 4 },
            { type: 'hussar', count: 3 },
        ],
    },
    {
        name: '帝国时代勃艮第军团', civ: '勃艮第', age: 'imperial', deStyle: 'WEST', region: 'BURGUNDIANS' as RegionType,
        castleId: 'BURG_CASTLE_AGE3', castleName: '勃艮第 重装城堡',
        formationMode: 'crane_wing',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'elite_coustillier', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
        ],
    },
    {
        name: '帝国时代西西里军团', civ: '西西里', age: 'imperial', deStyle: 'MEDI', region: 'SICILIANS' as RegionType,
        castleId: 'SICI_CASTLE_AGE3', castleName: '西西里 诺曼阿拉伯石堡',
        formationMode: 'fish_scale',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    {
        name: '城堡时代波兰军团', civ: '波兰', age: 'castle', deStyle: 'SLAV', region: 'POLES' as RegionType,
        castleId: 'POLE_CASTLE_AGE3', castleName: '波兰 马尔堡红砖城堡',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_obuch', count: 4 },
            { type: 'pikeman', count: 3 },
            { type: 'hussar', count: 2 },
        ],
    },
    {
        name: '城堡时代波希米亚军团', civ: '波希米亚', age: 'castle', deStyle: 'SLAV', region: 'BOHEMIANS' as RegionType,
        castleId: 'BOHE_CASTLE_AGE3', castleName: '波希米亚 卡尔施泰因城堡',
        formationMode: 'triangle',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'elite_hussite_wagon', count: 4 },
        ],
    },
    {
        name: '城堡时代达罗毗荼军团', civ: '达罗毗荼', age: 'castle', deStyle: 'INDI', region: 'INDIA' as RegionType,
        castleId: 'INDI_CASTLE_AGE3', castleName: '印度 达罗毗荼石圆塔',
        formationMode: 'fish_scale',
        slots: [
            { type: 'pikeman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'war_elephant', count: 2 },
        ],
    },
    {
        name: '城堡时代格鲁吉亚军团', civ: '格鲁吉亚', age: 'castle', deStyle: 'EAST', region: 'GEORGIANS' as RegionType,
        castleId: 'GEOR_CASTLE_AGE3', castleName: '格鲁吉亚 高加索石碉',
        formationMode: 'crane_wing',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'elite_monaspa', count: 4 },
            { type: 'knight', count: 3 },
        ],
    },
    {
        name: '城堡时代女真军团', civ: '女真', age: 'castle', deStyle: 'ASIA', region: 'NORTHEAST' as RegionType,
        castleId: 'JURC_CASTLE_AGE3', castleName: '女真 居庸金代山城',
        formationMode: 'crane_wing',
        slots: [
            { type: 'cav_archer', count: 2 },
            { type: 'iron_pagoda', count: 4 },
            { type: 'heavy_pikeman', count: 3 },
        ],
    },
    {
        name: '城堡时代穆伊斯卡军团', civ: '穆伊斯卡', age: 'castle', deStyle: 'ANDE', region: 'MUISCA' as RegionType,
        castleId: 'MUIS_CASTLE_AGE3', castleName: '穆伊斯卡 北安第斯',
        formationMode: 'echelon',
        slots: [
            { type: 'elite_guecha_warrior', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'archer', count: 2 },
        ],
    },
    {
        name: '城堡时代图皮军团', civ: '图皮', age: 'castle', deStyle: 'ANDE', region: 'TUPI' as RegionType,
        castleId: 'TUPI_CASTLE_AGE3', castleName: '图皮 南美丛林要塞',
        formationMode: 'triangle',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'blackwood_archer', count: 4 },
        ],
    },
    {
        name: '帝国时代西班牙军团', civ: '西班牙', age: 'imperial', deStyle: 'MEDI', region: 'SPANISH' as RegionType,
        castleId: 'SPAN_CASTLE_AGE3', castleName: '西班牙 塞哥维亚高塔要塞',
        formationMode: 'crane_wing',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 4 },
            { type: 'condottiero', count: 3 },
        ],
    },
    {
        name: '城堡时代葡萄牙军团', civ: '葡萄牙', age: 'castle', deStyle: 'MEDI', region: 'PORTUGUESE' as RegionType,
        castleId: 'PORT_CASTLE_AGE3', castleName: '葡萄牙 贝伦塔大西洋海堡',
        formationMode: 'triangle',
        slots: [
            { type: 'pikeman', count: 2 },
            { type: 'crossbowman', count: 3 },
            { type: 'organ_gun', count: 4 },
        ],
    },
    {
        name: '城堡时代马普切军团', civ: '马普切', age: 'castle', deStyle: 'ANDE', region: 'MAPUCHE' as RegionType,
        castleId: 'MAPU_CASTLE_AGE3', castleName: '马普切 南安第斯',
        formationMode: 'crane_wing',
        slots: [
            { type: 'spearman', count: 2 },
            { type: 'bolas_rider', count: 4 },
            { type: 'light_cavalry', count: 3 },
        ],
    },
    {
        name: '城堡时代突厥军团', civ: '突厥', age: 'castle', deStyle: 'CEAS', region: 'TURKS' as RegionType,
        castleId: 'TURK_CASTLE_AGE3', castleName: '突厥/奥斯曼 海峡要塞',
        formationMode: 'triangle',
        slots: [
            { type: 'light_cavalry', count: 2 },
            { type: 'swordsman', count: 3 },
            { type: 'janissary', count: 4 },
        ],
    },
];

export const LEVEL_2_CIV_59_NAMES: Set<string> = new Set(LEVEL_2_CIV_59_LEGIONS.map(l => l.name));
export const LEVEL_2_CIV_59_MAP: Map<string, Level2CivLegionDef> = new Map(LEVEL_2_CIV_59_LEGIONS.map(l => [l.name, l]));

/**
 * 军团名是否属于「**二级：文明 × 时代（59 文明专属军团）**」——
 * 严格只收录主人定稿的 59 个二级军团名（其余全部归入三级自建军团）。
 */
export function isCivEraLegion(name: string): boolean {
    return LEVEL_2_CIV_59_NAMES.has(name);
}
