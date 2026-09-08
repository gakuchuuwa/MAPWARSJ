/**
 * 文化二层体系：大区(20) × 时代(4) × 民族/朝代(二层)。
 *
 * 第一层 = 20 个泛指大地区民族文化；
 * 第二层 = 在大区之内，按「民族/朝代」再分（如 华夏×古典=古典先秦/古典秦汉，
 *          华夏×封建=封建隋唐、×城堡=城堡两宋、×帝国=帝国大明；朝鲜×古典=古典朝鲜……）。
 *
 * ⚠️ 口径（主人 2026-09 定）/ 二层规则：
 *   · 希腊、色雷斯 → 拉丁；埃及 → 中东；布匿(迦太基) → 非洲。
 *   · 党项/西夏 → 青藏（羌族）；南诏/大理 → 东南亚；马穆鲁克 → 中东；十字军 → 拉丁；柏柏尔 → 非洲。
 *   · 欧洲严格三元(日耳曼/拉丁/斯拉夫)按语言演变与地缘裁定：
 *       日耳曼 = 不列颠/盎格鲁-撒克逊/苏格兰/瑞典/瑞士/神圣罗马/条顿/哥特/汪达尔/伦巴第/法兰克/维京/勃艮第；
 *       拉丁   = 法兰西/凯尔特/十字军/亚马逊/罗马·意大利/西班牙/葡萄牙/西西里/希腊·色雷斯·马其顿·希伦·雇佣·大希腊；
 *       斯拉夫 = 立陶宛/马扎尔/罗斯/保加利亚/波兰/波西米亚/瓦拉几亚/塞尔维亚/东欧。
 *   · 草原带：游牧无固定城池，作为大区但不以城池/据点锚（匈奴/蒙古/突厥/契丹/库曼/柔然/可萨/阿瓦尔/斯基泰/马扎尔后期不如此）。吴三桂 → 帝国大明（帝国时代·华夏）。
 *   · 第四时代 = 帝国时代（无「帝王时代」）。
 *
 * 本表为「region → 大区」的权威映射，供逐武将归位与稀疏格检视使用。
 */

/** 20 大区（顺序即展示/统计顺序） */
export const CULTURE_ZONES = [
    '日本', '朝鲜', '满洲', '草原', '华夏',
    '西域', '青藏', '印度', '东南亚', '波斯',
    '中亚', '中东', '西亚', '阿拉伯', '斯拉夫',
    '拉丁', '日耳曼', '非洲', '北美', '南美',
] as const;

export type CultureZone = (typeof CULTURE_ZONES)[number];

/** 四时代（一层大区 × 时代 → 80 保底格） */
export const CULTURE_ERAS = ['古典', '封建', '城堡', '帝国'] as const;
export type CultureEra = (typeof CULTURE_ERAS)[number];

/** region → 大区 */
export const REGION_TO_ZONE: Record<string, CultureZone> = {
    // ── 东亚 ──
    JAPAN: '日本', AINU: '日本',
    KOREA: '朝鲜', GORYEO: '朝鲜', JOSEON: '朝鲜', GOJOSEON: '朝鲜',
    NORTHEAST: '满洲', MANCHU: '满洲', JURCHEN: '满洲', MOHE: '满洲',
    STEPPE: '草原', CUMAN: '草原', HUNS: '草原', TURKS: '草原', UIGHUR: '草原',
    ROURAN: '草原', KHAZARS: '草原', AVARS: '草原', SCYTHIANS: '草原', KHITAN: '草原', TANGUT: '青藏',
    // ── 华夏系（按朝代在二层分，一层均为「华夏」）──
    CENTRAL: '华夏', NORTH: '华夏', JIANGNAN: '华夏', LINGNAN: '华夏', BASHU: '华夏',
    DIANQIAN: '华夏', HEXI: '华夏', SONG: '华夏',
    // ── 西域 / 青藏 ──
    WESTERN: '西域', WUSUN: '西域', TIBET: '青藏', QIANG: '青藏', GUSILUO: '青藏',
    // ── 南亚 / 东南亚 ──
    INDIA: '印度', PURU: '印度', MUGHAL: '印度', DELHI: '印度', GURJARAS: '印度',
    BENGALIS: '印度', SIKH: '印度', PASHTUN: '印度',
    MALAY: '东南亚', SRIVIJAYA: '东南亚', VIETNAMESE: '东南亚', KHMER: '东南亚',
    BURMESE: '东南亚', JAVANESE: '东南亚', NANZHAO: '东南亚', DALI: '东南亚',
    // ── 波斯 / 中亚 ──
    PERSIAN: '波斯', SAFAVID: '波斯', ACHAEMENIDS: '波斯', SASANIAN: '波斯',
    CENTRAL_ASIA: '中亚', SOGDIANS: '中亚', HEPHTHALITES: '中亚', KUSHAN: '中亚',
    SELJUQ: '中亚', TIMURID: '中亚', ILKHANATE: '中亚', KARA_KHITAN: '中亚',
    // ── 中东 / 西亚 / 阿拉伯 ──
    BABYLON: '中东', ASSYRIAN: '中东', HITTITES: '中东', HEBREWS: '中东', NABATAEANS: '中东', EGYPT: '中东', MAMLUKS: '中东',
    WEST_ASIA: '西亚', BYZANTINE: '西亚', ARMENIANS: '西亚', GEORGIANS: '西亚', OTTOMAN: '西亚',
    ORIE: '阿拉伯', ALMOHAD: '阿拉伯',
    // ── 斯拉夫 / 拉丁 / 日耳曼 ──
    SLAVIC: '斯拉夫', EAST: '斯拉夫', RUSSIAN: '斯拉夫', BULGARIANS: '斯拉夫', POLES: '斯拉夫',
    BOHEMIANS: '斯拉夫', WALLACHIA: '斯拉夫', SERBIA: '斯拉夫', RUS: '斯拉夫', LITHUANIANS: '斯拉夫', MAGYAR: '斯拉夫',
    LATIN: '拉丁', ITALIANS: '拉丁', SPANISH: '拉丁', PORTUGUESE: '拉丁', SICILIANS: '拉丁', IMPERIAL_ROME: '拉丁',
    GREEK: '拉丁', THRACIAN: '拉丁', MACEDONIAN: '拉丁', HELLENIC: '拉丁', GREEK_MERCENARY: '拉丁', MAGNA_GRAECIA: '拉丁',
    AMAZONS: '拉丁', CRUSADERS: '拉丁', CASTILE: '拉丁', ARAGON: '拉丁', SWISS: '日耳曼', CELTS: '拉丁', FRENCH: '拉丁',
    GERMANIC: '日耳曼', TEUTONS: '日耳曼', VIKINGS: '日耳曼', GOTHS: '日耳曼', VANDALS: '日耳曼', LOMBARDS: '日耳曼',
    FRANKS: '日耳曼', BURGUNDIANS: '日耳曼', BRITONS: '日耳曼', SCOTLAND: '日耳曼', HRE: '日耳曼',
    SWEDISH: '日耳曼', ANGLO_SAXON: '日耳曼',
    // ── 非洲 / 美洲 ──
    AFRICA: '非洲', GHANA: '非洲', ETHIOPIANS: '非洲', KUSH: '非洲', CARTHAGE: '非洲', BERBER: '非洲',
    AMERICA: '北美', MAYANS: '北美', IROQUOIS: '北美', TAIRONA: '北美',
    ANDE: '南美', MAPUCHE: '南美', MUISCA: '南美', TUPI: '南美', TEHUELCHE: '南美', CHIMU: '南美', TARASCAN: '南美',
};

/** 一键取大区（未知回华夏） */
export function zoneOfRegion(region: string | null | undefined): CultureZone {
    return (region && REGION_TO_ZONE[region]) || '华夏';
}
