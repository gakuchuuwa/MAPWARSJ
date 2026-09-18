/**
 * 攻城战前 30 秒的攻城武器发放（13 战术层用；引擎八环不读这里）。
 *
 * 🔴 [2026-09-18 主人定死 · 全军团攻城武器终极铁律]
 * 1. 游戏所有势力分 16 + 59 + 3，共 78 种。
 *    古典时代：起始 – 公元 400 年
 *    封建时代：公元 400 年 – 公元 1050 年
 *    城堡时代：公元 1050 年 – 公元 1500 年
 *    帝王时代：公元 1500 年 – 公元 1900 年
 * 2. 武将判定时代，以该武将最辉煌的年代判定，无法判断，以30岁为主。
 * 3. 古典军团的必须套用古典时代攻城武器。
 * 4. 封建军团的必须套用古典时代和封建时代攻城武器。
 * 5. 城堡军团的必须套用古典时代和封建时代和城堡时代+城堡时代攻城热兵器。
 * 6. 帝国时代军团可以套用所有攻城武器。
 * 7. 请符合历史。
 * 8. 攻城武器共 34 个，全部给所有军团套用，每个军团有 9 个攻城武器，确保每样至少两个，必须有冲车！
 */
import type { RegionType } from '../systems/RegionSystem';
import { CULTURE_LEGION_NAMES } from '../types/CultureFormations';
import { LEVEL_2_CIV_59_LEGIONS } from './level2Civ59Legions';
import { LEVEL_3_LEGIONS } from './level3CustomLegions';
import { GENERAL_ERA } from './GeneralEra';
import { GENERAL_CENTURIES } from './GeneralCenturies';

export type SiegeAge = 'antiquity' | 'feudal' | 'castle' | 'imperial';

export const AGE_RANK: Record<SiegeAge, number> = { antiquity: 0, feudal: 1, castle: 2, imperial: 3 };

export const ERA_PREFIX_TO_AGE: Record<string, SiegeAge> = {
    古典: 'antiquity', 封建: 'feudal', 城堡: 'castle', 帝国: 'imperial', 帝王: 'imperial',
};

/** 34 种攻城武器元信息（对应 src/legion-editor/main.ts 全仓唯一时代真源） */
export const SIEGE_UNITS: Record<string, { name: string; age: SiegeAge; isRam?: boolean }> = {
    // ── 古典时代 12 种 ──
    antiquity_battering_ram: { name: '古典轻型攻城槌', age: 'antiquity', isRam: true },
    antiquity_capped_ram: { name: '古典装甲攻城槌高级', age: 'antiquity', isRam: true },
    antiquity_siege_ram: { name: '古典重型攻城槌重装', age: 'antiquity', isRam: true },
    traction_trebuchet: { name: '华夏牵引投石机重装', age: 'antiquity' },
    antiquity_mangonel: { name: '古典轻型投石车', age: 'antiquity' },
    antiquity_onager: { name: '古典中型投石车高级', age: 'antiquity' },
    antiquity_siege_onager: { name: '古典重型投石车重装', age: 'antiquity' },
    antiquity_scorpion: { name: '古典弩炮', age: 'antiquity' },
    antiquity_heavy_scorpion: { name: '古典重型弩炮重装', age: 'antiquity' },
    siege_ballista: { name: '阿契美尼德攻城弩炮重装', age: 'antiquity' },
    antiquity_siege_tower: { name: '古典攻城塔', age: 'antiquity' },
    helepolis: { name: '希腊赫勒波利斯攻城塔重装', age: 'antiquity' },

    // ── 封建时代 6 种 ──
    battering_ram: { name: '轻型攻城槌', age: 'feudal', isRam: true },
    mangonel: { name: '欧洲轻型投石车', age: 'feudal' },
    mounted_trebuchet: { name: '沙漠骆驼投石机高级', age: 'feudal' },
    scorpion: { name: '欧洲弩炮', age: 'feudal' },
    siege_tower: { name: '欧洲攻城塔', age: 'feudal' },
    ballista_elephant: { name: '高棉弩炮战象', age: 'feudal' },

    // ── 城堡时代 13 种 ──
    capped_ram: { name: '欧洲装甲攻城槌高级', age: 'castle', isRam: true },
    siege_ram: { name: '欧洲重型攻城槌重装', age: 'castle', isRam: true },
    onager: { name: '欧洲中型投石车高级', age: 'castle' },
    siege_onager: { name: '欧洲重型投石车重装', age: 'castle' },
    heavy_scorpion: { name: '欧洲重型弩炮重装', age: 'castle' },
    elite_ballista_elephant: { name: '高棉弩炮战象精锐', age: 'castle' },
    flaming_camel: { name: '鞑靼火焰骆驼', age: 'castle' },
    petard: { name: '爆破工兵', age: 'castle' },
    flamethrower: { name: '华夏猛火油柜重装', age: 'castle' },
    rocket_cart: { name: '火箭车', age: 'castle' },
    heavy_rocket_cart: { name: '重型火箭车', age: 'castle' },
    houfnice: { name: '手推榴弹炮', age: 'castle' },
    grenadier: { name: '掷弹兵', age: 'castle' },

    // ── 帝国时代 3 种 ──
    bombard_cannon: { name: '手推攻城火炮', age: 'imperial' },
    organ_gun: { name: '葡萄牙风琴炮', age: 'imperial' },
    elite_organ_gun: { name: '葡萄牙风琴炮精锐', age: 'imperial' },
};

/** 16 套母体军团名称映射 */
export const BASE_16_LEGION_NAMES: Record<string, string> = {
    CENTRAL: '东亚军团', STEPPE: '中亚军团', INDIA: '印度军团', GERMANIC: '西欧军团',
    PURU: '普鲁军团', ORIE: '中东军团', LATIN: '地中海军团', SLAVIC: '东北欧军团',
    EAST: '东南欧军团', PERSIAN: '波斯军团', MALAY: '东南亚军团', GREEK: '希腊军团',
    THRACIAN: '色雷斯军团', ANDE: '安第斯军团', AMERICA: '中美军团', AFRICA: '非洲军团',
};

export function isBase16CultureLegion(name: string): boolean {
    return Object.values(BASE_16_LEGION_NAMES).includes(name);
}

/** 171 个文化区回溯到 16 母体 base region 的映射 */
const BASE_16_MAP: Record<string, string> = {
    CENTRAL: 'CENTRAL', PRE_QIN: 'CENTRAL', NORTH: 'CENTRAL', HEXI: 'CENTRAL', NORTHEAST: 'CENTRAL', JIANGNAN: 'CENTRAL',
    KOREA: 'CENTRAL', GOJOSEON: 'CENTRAL', KHITAN: 'CENTRAL', MOHE: 'CENTRAL', NANZHAO: 'CENTRAL', SONG: 'CENTRAL',
    JURCHEN: 'CENTRAL', DALI: 'CENTRAL', GORYEO: 'CENTRAL', VIETNAMESE: 'MALAY', MING: 'CENTRAL', MANCHU: 'CENTRAL',
    HUAXIA_IMPERIAL: 'CENTRAL', JOSEON: 'CENTRAL', KARA_KHITAN: 'CENTRAL', JAPAN: 'CENTRAL', JAPAN_ANTIQUITY: 'CENTRAL',
    JAPAN_IMPERIAL: 'CENTRAL', BASHU: 'CENTRAL', WEI: 'CENTRAL', WU: 'CENTRAL', SHU: 'CENTRAL',
    STEPPE: 'STEPPE', STEPPE_IMPERIAL: 'STEPPE', STEPPE_ANTIQUITY: 'STEPPE', STEPPE_FEUDAL: 'STEPPE', CUMAN: 'STEPPE',
    TURKS: 'STEPPE', TIMURID: 'STEPPE', ILKHANATE: 'STEPPE', CENTRAL_ASIA: 'STEPPE', CENTRAL_ASIA_ANTIQUITY: 'STEPPE',
    CENTRAL_ASIA_CASTLE: 'STEPPE', CENTRAL_ASIA_IMPERIAL: 'STEPPE', MOBEI_MONGOL: 'STEPPE', MONGOL: 'STEPPE', HUNS: 'STEPPE',
    INDIA: 'INDIA', BENGALIS: 'INDIA', GURJARAS: 'INDIA', INDIA_FEUDAL: 'INDIA', INDIA_CASTLE: 'INDIA', INDIA_IMPERIAL: 'INDIA',
    DELHI: 'INDIA', MUGHAL: 'INDIA', SIKH: 'INDIA',
    GERMANIC: 'GERMANIC', FRANKS: 'GERMANIC', GOTHS: 'GERMANIC', CELTS: 'GERMANIC', VIKINGS: 'GERMANIC', TEUTONS: 'GERMANIC',
    BRITONS: 'GERMANIC', BURGUNDIANS: 'GERMANIC', GERMANIC_FEUDAL: 'GERMANIC', GERMANIC_CASTLE: 'GERMANIC', GERMANIC_IMPERIAL: 'GERMANIC',
    PURU: 'PURU', TIBET: 'PURU', TIBET_CASTLE: 'PURU', TIBET_IMPERIAL: 'PURU',
    ORIE: 'ORIE', ORIE_ANTIQUITY: 'ORIE', WEST_ASIA: 'ORIE', WEST_ASIA_ANTIQUITY: 'ORIE', WEST_ASIA_CASTLE: 'ORIE',
    BERBER: 'AFRICA', TANGUT: 'ORIE',
    LATIN: 'LATIN', ROMA: 'LATIN', ITALIANS: 'LATIN', SPANISH: 'LATIN', PORTUGUESE: 'LATIN', SICILIANS: 'LATIN',
    LATIN_FEUDAL: 'LATIN', LATIN_CASTLE: 'LATIN', LATIN_IMPERIAL: 'LATIN',
    SLAVIC: 'SLAVIC', BULGARIANS: 'SLAVIC', POLES: 'SLAVIC', BOHEMIANS: 'SLAVIC', LITHUANIANS: 'SLAVIC', MAGYAR: 'SLAVIC',
    EAST: 'EAST', BYZANTINE: 'EAST', ARMENIANS: 'EAST', GEORGIANS: 'EAST',
    PERSIAN: 'PERSIAN', ACHAEMENIDS: 'PERSIAN', SASANIAN: 'PERSIAN', PERSIAN_CASTLE: 'PERSIAN',
    MALAY: 'MALAY', KHMER: 'MALAY', BURMESE: 'MALAY', SEASIA_ANTIQUITY: 'MALAY', SEASIA_FEUDAL: 'MALAY', SEASIA_CASTLE: 'MALAY', SEASIA_IMPERIAL: 'MALAY',
    GREEK: 'GREEK', ATHENIANS: 'GREEK', SPARTANS: 'GREEK', MACEDONIAN: 'GREEK', HELLENIC: 'GREEK',
    THRACIAN: 'THRACIAN',
    ANDE: 'ANDE', INCA: 'ANDE', MUISCA: 'ANDE', TUPI: 'ANDE', MAPUCHE: 'ANDE',
    AMERICA: 'AMERICA', MAYANS: 'AMERICA',
    AFRICA: 'AFRICA', ETHIOPIANS: 'AFRICA', MALI: 'AFRICA',
};

function getBaseLegionName(region: string): string {
    const base = BASE_16_MAP[region] || 'CENTRAL';
    return BASE_16_LEGION_NAMES[base] || '东亚军团';
}

const REGION_LEGION_FALLBACK: Readonly<Record<string, string>> = (() => {
    const m: Record<string, string> = {};
    for (const L of LEVEL_2_CIV_59_LEGIONS) if (!m[String(L.region)]) m[String(L.region)] = L.name;
    for (const L of LEVEL_3_LEGIONS) for (const r of L.regions) if (!m[r]) m[r] = L.name;
    return m;
})();

/**
 * 军团时代判定：指针表 -> 二三级表 -> 古典兜底。
 */
export function legionSiegeAge(culture: RegionType | string): SiegeAge {
    const key = String(culture);
    const pointerName = (CULTURE_LEGION_NAMES as Record<string, string>)[key] ?? '';
    const fromPointer = ERA_PREFIX_TO_AGE[pointerName.slice(0, 2)];
    if (fromPointer) return fromPointer;
    const fallbackName = REGION_LEGION_FALLBACK[key] ?? '';
    return ERA_PREFIX_TO_AGE[fallbackName.slice(0, 2)] ?? 'antiquity';
}

/**
 * 武将判定时代：以该武将最辉煌的年代判定（成名世纪/成名年代），无法判断以30岁为主。
 */
export function generalSiegeAge(generalId: string): SiegeAge | null {
    const era = (GENERAL_ERA as Record<string, SiegeAge>)[generalId];
    if (era) return era;
    const century = (GENERAL_CENTURIES as Record<string, number>)[generalId];
    if (century != null) {
        if (century <= 4) return 'antiquity';
        if (century <= 10) return 'feudal';
        if (century <= 15) return 'castle';
        return 'imperial';
    }
    return null;
}

/**
 * 78 种势力军团攻城武器配置表（16母体各时代 + 59二级 + 3三级专属）。
 * 每支军团严格 9 辆攻城武器，严格包含破门冲车，每种选配武器数量严格 >= 2，全局 34 种武器无遗漏且每样使用 >= 2 次。
 */
export const LEGION_78_SIEGE_MAP: Record<string, { age: SiegeAge; weapons: string[] }> = {
    // ══════════════════════════════════════════════════════════════════════
    // 一、二级 59 文明专属军团
    // ══════════════════════════════════════════════════════════════════════

    // ── 1. 古典时代 (13 支) ──
    '古典时代华夏中原军团': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion'],
    },
    '古典时代华夏巴蜀军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '古典时代华夏江南军团': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代华夏北方军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion'],
    },
    '古典时代凯尔特军团': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '古典时代孟加拉军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '古典时代罗马军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代阿契美尼德军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'siege_ballista', 'siege_ballista', 'siege_ballista', 'siege_ballista'],
    },
    '古典时代雅典军团': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion', 'helepolis', 'helepolis'],
    },
    '古典时代斯巴达军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代马其顿军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'helepolis', 'helepolis'],
    },
    '古典时代色雷斯军团': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '古典时代普鲁军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion'],
    },

    // ── 2. 封建时代 (7 支) ──
    '封建时代哥特军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion'],
    },
    '封建时代萨珊波斯军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'siege_ballista', 'siege_ballista'],
    },
    '封建时代高棉军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_onager', 'ballista_elephant', 'ballista_elephant'],
    },
    '封建时代法兰克军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '封建时代古吉拉特军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'mangonel', 'mangonel', 'ballista_elephant', 'ballista_elephant'],
    },
    '封建时代阿拉伯军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'siege_tower', 'siege_tower'],
    },
    '封建时代保加利亚军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'mangonel', 'scorpion', 'scorpion'],
    },

    // ── 3. 城堡时代 (28 支) ──
    '城堡时代华夏宋朝军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower'],
    },
    '城堡时代西辽军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower'],
    },
    '城堡时代法兰西军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '城堡时代不列颠军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '城堡时代条顿军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '城堡时代拜占庭军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '城堡时代阿尤布军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'grenadier', 'grenadier'],
    },
    '城堡时代塞尔柱军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'flaming_camel', 'flaming_camel'],
    },
    '城堡时代蒙古军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flaming_camel', 'flaming_camel'],
    },
    '城堡时代德里军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_onager', 'antiquity_onager', 'grenadier', 'grenadier'],
    },
    '城堡时代高丽军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'rocket_cart', 'rocket_cart'],
    },
    '城堡时代波兰军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '城堡时代波希米亚军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'houfnice', 'houfnice', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '城堡时代格鲁吉亚军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '城堡时代立陶宛军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '城堡时代亚美尼亚军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '城堡时代马扎尔军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '城堡时代印加军团': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'capped_ram', 'siege_ram', 'siege_ram', 'siege_ram'],
    },
    '城堡时代玛雅军团': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'capped_ram', 'siege_ram', 'siege_ram', 'siege_ram'],
    },
    '城堡时代大理军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower'],
    },
    '城堡时代金朝军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower'],
    },
    '城堡时代库曼军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flaming_camel', 'flaming_camel'],
    },
    '城堡时代意大利军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '城堡时代西班牙军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '城堡时代西西里军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '城堡时代勃艮第军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '城堡时代马里军团': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'grenadier', 'grenadier'],
    },
    '城堡时代埃塞俄比亚军团': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'grenadier', 'grenadier'],
    },

    // ── 4. 帝国时代 (11 支) ──
    '帝国时代华夏明朝军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'heavy_rocket_cart', 'heavy_rocket_cart', 'bombard_cannon', 'bombard_cannon'],
    },
    '帝国时代大清军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'heavy_rocket_cart', 'heavy_rocket_cart', 'bombard_cannon', 'bombard_cannon'],
    },
    '帝国时代奥斯曼军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'grenadier', 'grenadier'],
    },
    '帝国时代莫卧儿军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'grenadier', 'grenadier'],
    },
    '帝国时代葡萄牙军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'bombard_cannon', 'bombard_cannon', 'organ_gun', 'organ_gun', 'elite_organ_gun', 'elite_organ_gun'],
    },
    '帝国时代荷兰军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'bombard_cannon', 'bombard_cannon'],
    },
    '帝国时代瑞典军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'bombard_cannon', 'bombard_cannon'],
    },
    '帝国时代俄罗斯军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'bombard_cannon', 'bombard_cannon'],
    },
    '帝国时代朝鲜军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'heavy_rocket_cart', 'heavy_rocket_cart', 'bombard_cannon', 'bombard_cannon'],
    },
    '帝国时代锡克军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'grenadier', 'grenadier'],
    },
    '帝国时代缅甸军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'elite_ballista_elephant', 'elite_ballista_elephant', 'bombard_cannon', 'bombard_cannon'],
    },

    // ══════════════════════════════════════════════════════════════════════
    // 二、三级 3 专属自建军团
    // ══════════════════════════════════════════════════════════════════════
    '吐蕃军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'grenadier', 'grenadier'],
    },
    '西域军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'siege_ballista', 'siege_ballista', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '漠北蒙古军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flaming_camel', 'flaming_camel'],
    },

    // ══════════════════════════════════════════════════════════════════════
    // 三、一级 16 套母体军团（4 时代分支）
    // ══════════════════════════════════════════════════════════════════════

    // CENTRAL 东亚军团
    '东亚军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion'],
    },
    '东亚军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion'],
    },
    '东亚军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower'],
    },
    '东亚军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'heavy_rocket_cart', 'heavy_rocket_cart', 'bombard_cannon', 'bombard_cannon'],
    },

    // STEPPE 中亚军团
    '中亚军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '中亚军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion'],
    },
    '中亚军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'flaming_camel', 'flaming_camel'],
    },
    '中亚军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'flaming_camel', 'flaming_camel', 'bombard_cannon', 'bombard_cannon'],
    },

    // INDIA 印度军团
    '印度军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '印度军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'mangonel', 'mangonel', 'ballista_elephant', 'ballista_elephant'],
    },
    '印度军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '印度军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'grenadier', 'grenadier'],
    },

    // GERMANIC 西欧军团
    '西欧军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '西欧军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '西欧军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '西欧军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'bombard_cannon', 'bombard_cannon'],
    },

    // PURU 普鲁军团
    '普鲁军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion'],
    },
    '普鲁军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'mangonel', 'mangonel', 'ballista_elephant', 'ballista_elephant'],
    },
    '普鲁军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '普鲁军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'grenadier', 'grenadier'],
    },

    // ORIE 中东军团
    '中东军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '中东军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'siege_tower', 'siege_tower'],
    },
    '中东军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'mounted_trebuchet', 'grenadier', 'grenadier'],
    },
    '中东军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'grenadier', 'grenadier'],
    },

    // LATIN 地中海军团
    '地中海军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '地中海军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '地中海军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'petard', 'petard'],
    },
    '地中海军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'bombard_cannon', 'bombard_cannon', 'organ_gun', 'organ_gun', 'elite_organ_gun', 'elite_organ_gun'],
    },

    // SLAVIC 东北欧军团
    '东北欧军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '东北欧军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'mangonel', 'scorpion', 'scorpion'],
    },
    '东北欧军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '东北欧军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'bombard_cannon', 'bombard_cannon'],
    },

    // EAST 东南欧军团
    '东南欧军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '东南欧军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '东南欧军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '东南欧军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },

    // PERSIAN 波斯军团
    '波斯军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'siege_ballista', 'siege_ballista', 'siege_ballista', 'siege_ballista'],
    },
    '波斯军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'siege_ballista', 'siege_ballista'],
    },
    '波斯军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'siege_ballista', 'siege_ballista', 'grenadier', 'grenadier'],
    },
    '波斯军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'bombard_cannon', 'bombard_cannon', 'siege_ballista', 'siege_ballista', 'grenadier', 'grenadier'],
    },

    // MALAY 东南亚军团
    '东南亚军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '东南亚军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_onager', 'ballista_elephant', 'ballista_elephant'],
    },
    '东南亚军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'elite_ballista_elephant', 'elite_ballista_elephant', 'grenadier', 'grenadier'],
    },
    '东南亚军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'elite_ballista_elephant', 'elite_ballista_elephant', 'bombard_cannon', 'bombard_cannon'],
    },

    // GREEK 希腊军团
    '希腊军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion', 'helepolis', 'helepolis'],
    },
    '希腊军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '希腊军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '希腊军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },

    // THRACIAN 色雷斯军团
    '色雷斯军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '色雷斯军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'mangonel', 'scorpion', 'scorpion'],
    },
    '色雷斯军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
    '色雷斯军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },

    // ANDE 安第斯军团
    '安第斯军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram'],
    },
    '安第斯军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram'],
    },
    '安第斯军团_castle': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'capped_ram', 'siege_ram', 'siege_ram', 'siege_ram'],
    },
    '安第斯军团_imperial': {
        age: 'imperial',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'capped_ram', 'siege_ram', 'siege_ram', 'siege_ram'],
    },

    // AMERICA 中美军团
    '中美军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram'],
    },
    '中美军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram'],
    },
    '中美军团_castle': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'capped_ram', 'siege_ram', 'siege_ram', 'siege_ram'],
    },
    '中美军团_imperial': {
        age: 'imperial',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'capped_ram', 'siege_ram', 'siege_ram', 'siege_ram'],
    },

    // AFRICA 非洲军团
    '非洲军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '非洲军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'mangonel', 'antiquity_scorpion', 'antiquity_scorpion'],
    },
    '非洲军团_castle': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'grenadier', 'grenadier'],
    },
    '非洲军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion', 'grenadier', 'grenadier'],
    },
};

/**
 * 攻城战攻方攻城武器发放函数（全游戏 78 种军团攻城武器真源）。
 *
 * 判定链：
 * 1. 优先命中 59 二级文明军团或 3 三级专属自建军团；
 * 2. 属于 16 母体军团：时代按【主帅成名年代 > 军团名前缀 > 文化区指针】裁决，取对应时代分支；
 * 3. 兜底返回东亚军团古典配置。
 */
export function getSiegeWeaponsForCulture(
    culture: RegionType | string,
    legionName?: string | null,
    generalId?: string | null,
): string[] {
    const key = String(culture);
    const effLegion = legionName || (CULTURE_LEGION_NAMES as Record<string, string>)[key] || REGION_LEGION_FALLBACK[key] || '';

    // 1. 直接命中 59 二级或 3 三级专属军团
    if (effLegion && LEGION_78_SIEGE_MAP[effLegion]) {
        return [...LEGION_78_SIEGE_MAP[effLegion].weapons];
    }

    // 2. 16 套母体军团
    const baseName = isBase16CultureLegion(effLegion) ? effLegion : getBaseLegionName(key);

    // 时代判定：优先主帅成名年代（最辉煌年代/30岁），次选军团名时代，最后文化区时代保底
    let age: SiegeAge = 'antiquity';
    if (generalId) {
        const gAge = generalSiegeAge(generalId);
        if (gAge) age = gAge;
        else if (effLegion && ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)]) age = ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)];
        else age = legionSiegeAge(key);
    } else if (effLegion && ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)]) {
        age = ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)];
    } else {
        age = legionSiegeAge(key);
    }

    const mappedKey = `${baseName}_${age}`;
    if (LEGION_78_SIEGE_MAP[mappedKey]) {
        return [...LEGION_78_SIEGE_MAP[mappedKey].weapons];
    }

    // 终极兜底：东亚军团古典配置
    return [...LEGION_78_SIEGE_MAP['东亚军团_antiquity'].weapons];
}
