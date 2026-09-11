/**
 * 文化二层体系：
 * 第一层 = 16 大基础文化母体（与 16 套建筑风格 1:1 严格对齐，对齐 DE 本体 16 套建筑素材风格集）；
 * 第二层 = 在母体之下，原第一层多余文化（如日本、朝鲜、满洲、青藏、西域、中亚、中东、西亚、北美等）
 *          与各朝代时代文明（古典/封建/城堡/帝国）在此分支派生。
 *
 * ⚠️ 铁律（主人 2026-09-10 定，2026-09-11 校准回 16）：
 *   · 16 套文化、建筑属于第一层文化、建筑、军团，其他所有都在第一层上分支。
 *   · 按 DE 本体素材：16 套建筑风格（含东欧 EAST、印度 INDI），马其顿无成套城镇素材归希腊。
 */

/** 第一层：16 大基础母体文化区（与 16 套建筑风格严格 1:1） */
export const CULTURE_ZONES = [
    '东亚', '中亚', '印度', '西欧', '普鲁',
    '中东', '地中海', '斯拉夫', '东欧', '波斯',
    '东南亚', '希腊', '色雷斯', '安第斯', '中美', '非洲',
] as const;

export type CultureZone = (typeof CULTURE_ZONES)[number];

/** 四时代（古典、封建、城堡、帝国） */
export const CULTURE_ERAS = ['古典', '封建', '城堡', '帝国'] as const;
export type CultureEra = (typeof CULTURE_ERAS)[number];

/** region (第二层分支) → 第一层母体大区 */
export const REGION_TO_ZONE: Record<string, CultureZone> = {
    // ── 东亚（二层分支：华夏本部、日本、朝鲜、满洲、青藏、西域等）──
    CENTRAL: '东亚', PRE_QIN: '东亚', NORTH: '东亚', JIANGNAN: '东亚', BASHU: '东亚',
    HEXI: '东亚', SONG: '东亚', MING: '东亚', HUAXIA_IMPERIAL: '东亚',
    JAPAN: '东亚', AINU: '东亚', JAPAN_ANTIQUITY: '东亚', JAPAN_IMPERIAL: '东亚',
    KOREA: '东亚', GORYEO: '东亚', JOSEON: '东亚', GOJOSEON: '东亚',
    NORTHEAST: '东亚', MANCHU: '东亚', JURCHEN: '东亚', MOHE: '东亚',
    WESTERN: '中亚', WUSUN: '中亚', WESTERN_FEUDAL: '中亚', WESTERN_CASTLE: '中亚', WESTERN_IMPERIAL: '中亚',
    TIBET: '印度', QIANG: '东亚', TIBET_IMPERIAL: '印度', TIBET_CASTLE: '印度', YARLUNG: '印度', TANGUT: '东亚',

    // ── 草原（二层分支：欧亚游牧诸部、中亚游牧等）──
    STEPPE: '中亚', CUMAN: '中亚', HUNS: '中亚', TURKS: '中亚', UIGHUR: '中亚',
    STEPPE_IMPERIAL: '中亚', STEPPE_ANTIQUITY: '中亚', STEPPE_FEUDAL: '中亚',
    ROURAN: '中亚', KHAZARS: '中亚', AVARS: '中亚', SCYTHIANS: '中亚', KHITAN: '东亚',
    CENTRAL_ASIA: '中亚', SOGDIANS: '中亚', HEPHTHALITES: '中亚', KUSHAN: '中亚',
    CENTRAL_ASIA_IMPERIAL: '中亚', CENTRAL_ASIA_ANTIQUITY: '中亚', CENTRAL_ASIA_CASTLE: '中亚',
    SELJUQ: '中亚', TIMURID: '中亚', ILKHANATE: '中亚', KARA_KHITAN: '中亚',

    // ── 印度（二层分支：孔雀、笈多、德里、莫卧儿等）──
    INDIA: '印度', MUGHAL: '印度', DELHI: '印度', GURJARAS: '印度',
    INDIA_FEUDAL: '印度', INDIA_CASTLE: '印度', INDIA_IMPERIAL: '印度',
    BENGALIS: '印度', SIKH: '印度', PASHTUN: '波斯',

    // ── 普鲁（二层分支：古典南亚、达罗毗荼等）──
    PURU: '普鲁',

    // ── 东南亚（二层分支：吴哥、蒲甘、大越、南诏大理、室利佛逝等）──
    MALAY: '东南亚', SRIVIJAYA: '东南亚', VIETNAMESE: '东亚', KHMER: '东南亚',
    SEASIA_ANTIQUITY: '东南亚', SEASIA_IMPERIAL: '东南亚', SEASIA_CASTLE: '东南亚', SEASIA_FEUDAL: '东南亚',
    BURMESE: '东南亚', JAVANESE: '东南亚', NANZHAO: '东亚', DALI: '东亚',

    // ── 波斯（二层分支：阿契美尼德、萨珊、萨法维等）──
    PERSIAN: '波斯', SAFAVID: '波斯', ACHAEMENIDS: '波斯', SASANIAN: '波斯', PERSIAN_CASTLE: '波斯',

    // ── 阿拉伯（二层分支：中东古文明、四大哈里发、马穆鲁克、小亚细亚等）──
    BABYLON: '中东', ASSYRIAN: '中东', HITTITES: '中东', HEBREWS: '中东',
    NABATAEANS: '中东', EGYPT: '中东', MAMLUKS: '中东',
    ORIE: '中东', ALMOHAD: '中东', ORIE_ANTIQUITY: '中东',
    WEST_ASIA: '中东', WEST_ASIA_ANTIQUITY: '中东', WEST_ASIA_CASTLE: '中东',

    // ── 拜占庭（二层分支：东罗马军区、格鲁吉亚、亚美尼亚、奥斯曼等）──
    EAST: '希腊', BYZANTINE: '东欧', ARMENIANS: '地中海', GEORGIANS: '地中海', OTTOMAN: '中东',

    // ── 斯拉夫（二层分支：罗斯、波兰、立陶宛、保加利亚、波希米亚等）──
    SLAVIC: '斯拉夫', RUSSIAN: '斯拉夫', BULGARIANS: '斯拉夫', POLES: '东欧',
    SLAVIC_FEUDAL: '斯拉夫', SLAVIC_CASTLE: '斯拉夫', SLAVIC_IMPERIAL: '斯拉夫',
    BOHEMIANS: '斯拉夫', SERBIA: '斯拉夫', RUS: '斯拉夫', LITHUANIANS: '东欧', MAGYAR: '东欧',

    // ── 拉丁（二层分支：古罗马、意大利、西班牙、葡萄牙、十字军、法国等）──
    LATIN: '地中海', ITALIANS: '地中海', SPANISH: '地中海', PORTUGUESE: '地中海', SICILIANS: '地中海',
    IMPERIAL_ROME: '地中海', LATIN_FEUDAL: '地中海', LATIN_CASTLE: '地中海', LATIN_IMPERIAL: '地中海',
    AMAZONS: '地中海', CRUSADERS: '西欧', CASTILE: '地中海', ARAGON: '地中海', CELTS_FEUDAL: '西欧', FRENCH: '西欧',

    // ── 希腊（二层分支：马其顿、雅典/斯巴达、希伦、大希腊等）──
    GREEK: '希腊', MACEDONIAN: '希腊', HELLENIC: '希腊', GREEK_MERCENARY: '希腊', MAGNA_GRAECIA: '希腊',

    // ── 色雷斯（二层分支：古典色雷斯、萨尔马提亚等）──
    THRACIAN: '色雷斯',

    // ── 日耳曼（二层分支：条顿、维京、哥特、法兰克、不列颠、神圣罗马等）──
    GERMANIC: '西欧', TEUTONS: '西欧', VIKINGS: '斯拉夫', GOTHS: '西欧', VANDALS: '西欧',
    LOMBARDS: '西欧', GERMANIC_FEUDAL: '西欧', GERMANIC_IMPERIAL: '西欧', GERMANIC_CASTLE: '西欧',
    FRANKS: '西欧', BURGUNDIANS: '西欧', BRITONS: '西欧', SCOTLAND: '西欧', HRE: '西欧',
    SWEDISH: '西欧', ANGLO_SAXON: '西欧',

    // ── 非洲（二层分支：努比亚、阿克苏姆、加纳、马里、柏柏尔、迦太基等）──
    AFRICA: '非洲', GHANA: '非洲', ETHIOPIANS: '非洲', KUSH: '非洲', CARTHAGE: '地中海', BERBER: '中东',
    AFRICA_IMPERIAL: '非洲', AFRICA_ANTIQUITY: '非洲', AFRICA_CASTLE: '非洲',

    // ── 中美洲（二层分支：玛雅、阿兹特克、北美易洛魁等）──
    AMERICA: '地中海', MAYANS: '中美', IROQUOIS: '中美', TAIRONA: '安第斯', TARASCAN: '中美',
    NORTHAM_IMPERIAL: '中美', NORTHAM_FEUDAL: '中美',

    // ── 安第斯（二层分支：印加、奇穆、马普切、图皮等）──
    ANDE: '安第斯', MAPUCHE: '安第斯', MUISCA: '安第斯', TUPI: '安第斯', TEHUELCHE: '安第斯',
    CHIMU: '安第斯', SOUTHAM_IMPERIAL: '安第斯',
};

/** 一键取第一层母体大区（未知回华夏） */
export function zoneOfRegion(region: string | null | undefined): CultureZone {
    return (region && REGION_TO_ZONE[region]) || '东亚';
}
