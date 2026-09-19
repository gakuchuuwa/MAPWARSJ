/**
 * CultureHierarchy.ts — 建筑风格「16 母体 + 59 文明 + 3 专属定制」三级架构权威真理源
 *
 * 🔴 [2026-09-18 主人定死]「59+3都是从16种分化出来的，所有据点都要有16的分类。
 *    http://localhost:5173/_citytest.html，和这个程序要对上，要同步，要符合历史。」
 *
 * 与 public/_citytest.html 保持 100% 相同数据源与层级：
 * - 一层 16：16 套基础建筑母体（城墙与城镇基础素材）
 * - 二层 59：59 座文明专属城堡（用于险要 pass 与代表据点）
 * - 三层 3：3 套自建专属定制（吐蕃 TIBET、西域 WESTERN、漠北蒙古 MOBEI_MONGOL）
 */

// 🔴 [2026-09-18] 二级兜底要用**游戏侧权威表**（文化区 → 59 分支），与 resolveCastleAsset 解析城堡同一条链。
//    不另抄一份字典 —— 抄了必漂移（今天刚在 _citytest.html 上踩过这个坑）。
import { REGION_TO_BRANCH } from '../config/deCastleAssets';

export type Base16StyleKey =
    | 'ASIA' | 'WEST' | 'EAST' | 'SLAV'
    | 'MEDI' | 'ORIE' | 'CEAS' | 'INDI'
    | 'PURU' | 'SEAS' | 'MESO' | 'ANDE'
    | 'AFRI' | 'PERSIAN' | 'GREEK' | 'THRACIAN';

export interface Base16Meta {
    key: Base16StyleKey;
    name: string;
    emoji: string;
    label: string;
}

export const BASE16_STYLES: readonly Base16Meta[] = [
    { key: 'ASIA',     name: '东亚',   emoji: '🏯', label: '🏯 ASIA 东亚' },
    { key: 'CEAS',     name: '中亚',   emoji: '🐴', label: '🐴 CEAS 中亚' },
    { key: 'INDI',     name: '印度',   emoji: '🕌', label: '🕌 INDI 印度' },
    { key: 'WEST',     name: '西欧',   emoji: '🛡️', label: '🛡️ WEST 西欧' },
    { key: 'PURU',     name: '普鲁',   emoji: '🛕', label: '🛕 PURU 普鲁' },
    { key: 'ORIE',     name: '中东',   emoji: '🕌', label: '🕌 ORIE 中东' },
    { key: 'MEDI',     name: '地中海', emoji: '🏛️', label: '🏛️ MEDI 地中海' },
    { key: 'SLAV',     name: '东北欧', emoji: '🌲', label: '🌲 SLAV 东北欧' },
    { key: 'EAST',     name: '东南欧', emoji: '🏛️', label: '🏛️ EAST 东南欧' },
    { key: 'PERSIAN',  name: '波斯',   emoji: '🏛️', label: '🏛️ PERSIAN 波斯' },
    { key: 'SEAS',     name: '东南亚', emoji: '🌴', label: '🌴 SEAS 东南亚' },
    { key: 'GREEK',    name: '希腊',   emoji: '🏛️', label: '🏛️ GREEK 希腊' },
    { key: 'THRACIAN', name: '色雷斯', emoji: '🏛️', label: '🏛️ THRACIAN 色雷斯' },
    { key: 'ANDE',     name: '安第斯', emoji: '🌎', label: '🌎 ANDE 安第斯' },
    { key: 'MESO',     name: '中美',   emoji: '🌎', label: '🌎 MESO 中美' },
    { key: 'AFRI',     name: '非洲',   emoji: '🌍', label: '🌍 AFRI 非洲' },
] as const;

export const BASE16_NAMES: Record<Base16StyleKey, string> = Object.fromEntries(
    BASE16_STYLES.map(s => [s.key, s.name])
) as Record<Base16StyleKey, string>;

export interface CultureBranch {
    key: string;
    deStyle: Base16StyleKey;
    castle: string;
    label: string;
}

export interface CultureGroup {
    group: string;
    deStyle: Base16StyleKey;
    branches: CultureBranch[];
}

/** 59 套文明与建筑风格分支（按 16 大建筑母体归类，严格 59 套，与 _citytest.html 100% 对齐） */
export const CULTURE_59_GROUPS: readonly CultureGroup[] = [
    {
        group: '🏯 ASIA 东亚 (9套)',
        deStyle: 'ASIA',
        branches: [
            { key: 'JAPAN',     deStyle: 'ASIA', castle: 'ASIA_CASTLE_AGE3', label: '🏯 日本（重檐天守阁）' },
            { key: 'CENTRAL',   deStyle: 'ASIA', castle: 'CHIN_CASTLE_AGE3', label: '🏯 华夏（北方华北·汉唐城楼）' },
            { key: 'WEI',       deStyle: 'ASIA', castle: 'WEI_CASTLE_AGE3',  label: '🏯 北方（中原高台阙楼）' },
            { key: 'JIANGNAN',  deStyle: 'ASIA', castle: 'WU_CASTLE_AGE3',   label: '🏯 江南（江南水榭坞堡）' },
            { key: 'BASHU',     deStyle: 'ASIA', castle: 'SHU_CASTLE_AGE3',  label: '🏯 巴蜀（巴蜀剑阁木关）' },
            { key: 'KHITAN',    deStyle: 'ASIA', castle: 'KHIT_CASTLE_AGE3', label: '🏯 契丹（辽式边墙要塞）' },
            { key: 'NORTHEAST', deStyle: 'ASIA', castle: 'JURC_CASTLE_AGE3', label: '🏯 女真（居庸金代山城）' },
            { key: 'MONGOL',    deStyle: 'ASIA', castle: 'MONG_CASTLE_AGE3', label: '⛺ 蒙古（塞外王帐石堡）' },
            { key: 'KOREA',     deStyle: 'ASIA', castle: 'KORE_CASTLE_AGE3', label: '🏯 高丽（半岛山城要塞）' },
        ],
    },
    {
        group: '🛡️ WEST 西欧 (7套)',
        deStyle: 'WEST',
        branches: [
            { key: 'GERMANIC',    deStyle: 'WEST', castle: 'WEST_CASTLE_AGE3', label: '🛡️ 条顿（西欧通用石堡）' },
            { key: 'FRANKS',      deStyle: 'WEST', castle: 'FRAN_CASTLE_AGE3', label: '🛡️ 法兰克（加洛林石堡）' },
            { key: 'BURGUNDIANS', deStyle: 'WEST', castle: 'BURG_CASTLE_AGE3', label: '🛡️ 勃艮第（重装城堡）' },
            { key: 'BRITONS',     deStyle: 'WEST', castle: 'CELT_CASTLE_AGE3', label: '🛡️ 不列颠（苏格兰高地圆塔）' },
            { key: 'CELTS',       deStyle: 'WEST', castle: 'CELT_CASTLE_AGE3', label: '🛡️ 凯尔特（苏格兰高地圆塔）' },
            { key: 'VIKINGS',     deStyle: 'WEST', castle: 'VIKI_CASTLE_AGE3', label: '🛡️ 维京（诺斯长屋环形要塞）' },
            { key: 'GOTHS',       deStyle: 'WEST', castle: 'GOTH_CASTLE_AGE3', label: '🛡️ 哥特（蛮族厚重石堡）' },
        ],
    },
    {
        group: '🏛️ EAST 东南欧 (3套)',
        deStyle: 'EAST',
        branches: [
            { key: 'BYZANTINE', deStyle: 'EAST', castle: 'BYZA_CASTLE_AGE3', label: '🏛️ 拜占庭（东罗马·希腊语帝国要塞）' },
            { key: 'ARMENIANS', deStyle: 'EAST', castle: 'ARME_CASTLE_AGE3', label: '⚔️ 亚美尼亚（高山石堡）' },
            { key: 'GEORGIANS', deStyle: 'EAST', castle: 'GEOR_CASTLE_AGE3', label: '⚔️ 格鲁吉亚（高加索石碉）' },
        ],
    },
    {
        group: '🌲 SLAV 东北欧 (6套)',
        deStyle: 'SLAV',
        branches: [
            { key: 'POLES',       deStyle: 'SLAV', castle: 'POLE_CASTLE_AGE3', label: '🛡️ 波兰（马尔堡红砖城堡）' },
            { key: 'BOHEMIANS',   deStyle: 'SLAV', castle: 'BOHE_CASTLE_AGE3', label: '🛡️ 波希米亚（卡尔施泰因城堡）' },
            { key: 'MAGYAR',      deStyle: 'SLAV', castle: 'MAGY_CASTLE_AGE3', label: '🛡️ 马扎尔（匈牙利科文堡）' },
            { key: 'SLAVIC',      deStyle: 'SLAV', castle: 'SLAV_CASTLE_AGE3', label: '⚔️ 斯拉夫（洋葱顶木石要塞）' },
            { key: 'LITHUANIANS', deStyle: 'SLAV', castle: 'LITH_CASTLE_AGE3', label: '⚔️ 立陶宛（特拉凯湖中堡）' },
            { key: 'BULGARIANS',  deStyle: 'SLAV', castle: 'BULG_CASTLE_AGE3', label: '⚔️ 保加利亚（沙皇要塞）' },
        ],
    },
    {
        group: '🏛️ MEDI 地中海 (5套)',
        deStyle: 'MEDI',
        branches: [
            { key: 'LATIN',      deStyle: 'MEDI', castle: 'MEDI_CASTLE_AGE3', label: '🏛️ 意大利（通用古典石堡）' },
            { key: 'ROMA',       deStyle: 'MEDI', castle: 'ROMA_CASTLE_AGE3', label: '🏛️ 罗马（军团古典方石堡）' },
            { key: 'SICILIANS',  deStyle: 'MEDI', castle: 'SICI_CASTLE_AGE3', label: '🏛️ 西西里（诺曼阿拉伯石堡）' },
            { key: 'SPANISH',    deStyle: 'MEDI', castle: 'SPAN_CASTLE_AGE3', label: '🛡️ 西班牙（塞哥维亚高塔要塞）' },
            { key: 'PORTUGUESE', deStyle: 'MEDI', castle: 'PORT_CASTLE_AGE3', label: '🛡️ 葡萄牙（贝伦塔大西洋海堡）' },
        ],
    },
    {
        group: '🕌 ORIE 中东 (1套)',
        deStyle: 'ORIE',
        branches: [
            { key: 'ORIE', deStyle: 'ORIE', castle: 'ORIE_CASTLE_AGE3', label: '🕌 萨拉森（生土要塞）' },
        ],
    },
    {
        group: '🐴 CEAS 中亚 (4套)',
        deStyle: 'CEAS',
        branches: [
            { key: 'HUNS',         deStyle: 'CEAS', castle: 'HUNS_CASTLE_AGE3', label: '⚔️ 匈人（游牧营垒木石要塞）' },
            { key: 'CUMAN',        deStyle: 'CEAS', castle: 'CUMA_CASTLE_AGE3', label: '⚔️ 库曼（草原要塞）' },
            { key: 'TURKS',        deStyle: 'CEAS', castle: 'TURK_CASTLE_AGE3', label: '🕌 奥斯曼（海峡要塞）' },
            { key: 'CENTRAL_ASIA', deStyle: 'CEAS', castle: 'CEAS_CASTLE_AGE3', label: '🐴 鞑靼（赫拉特城堡）' },
        ],
    },
    {
        group: '🕌 INDI 印度 (4套)',
        deStyle: 'INDI',
        branches: [
            { key: 'INDIA',    deStyle: 'INDI', castle: 'INDI_CASTLE_AGE3', label: '🕌 达罗毗荼（石圆塔）' },
            { key: 'MUGHAL',   deStyle: 'INDI', castle: 'HIND_CASTLE_AGE3', label: '🕌 印度斯坦（红砂岩堡）' },
            { key: 'BENGALIS', deStyle: 'INDI', castle: 'BENG_CASTLE_AGE3', label: '🕌 孟加拉（比什努布尔红砖堡）' },
            { key: 'GURJARAS', deStyle: 'INDI', castle: 'GURJ_CASTLE_AGE3', label: '🕌 瞿折罗（瓜廖尔石堡）' },
        ],
    },
    {
        group: '🛕 PURU 普鲁 (1套)',
        deStyle: 'PURU',
        branches: [
            { key: 'PURU', deStyle: 'PURU', castle: 'PURU_CASTLE_AGE3', label: '🛕 普鲁（孔雀帝国粗石圆塔）' },
        ],
    },
    {
        group: '🌴 SEAS 东南亚 (4套)',
        deStyle: 'SEAS',
        branches: [
            { key: 'KHMER',      deStyle: 'SEAS', castle: 'SEAS_CASTLE_AGE3', label: '🌴 高棉（吴哥窟砂岩塔）' },
            { key: 'BURMESE',    deStyle: 'SEAS', castle: 'BURM_CASTLE_AGE3', label: '🌴 缅甸（蒲甘佛塔城堡）' },
            { key: 'VIETNAMESE', deStyle: 'SEAS', castle: 'VIET_CASTLE_AGE3', label: '🌴 越南（升龙城重檐）' },
            { key: 'MALAY',      deStyle: 'SEAS', castle: 'MALA_CASTLE_AGE3', label: '🌴 马来（满剌加木石水寨）' },
        ],
    },
    {
        group: '🌎 MESO 中美 (2套)',
        deStyle: 'MESO',
        branches: [
            { key: 'MAYANS',  deStyle: 'MESO', castle: 'MAYA_CASTLE_AGE3', label: '🌎 玛雅（阶梯金字塔）' },
            { key: 'AMERICA', deStyle: 'MESO', castle: 'MESO_CASTLE_AGE3', label: '🌎 阿兹特克（中美重装金字塔）' },
        ],
    },
    {
        group: '🌎 ANDE 安第斯 (4套)',
        deStyle: 'ANDE',
        branches: [
            { key: 'INCA',    deStyle: 'ANDE', castle: 'INCA_CASTLE_AGE3', label: '🌎 印加（安第斯主轴）' },
            { key: 'MUISCA',  deStyle: 'ANDE', castle: 'MUIS_CASTLE_AGE3', label: '🌎 穆伊斯卡（北安第斯）' },
            { key: 'MAPUCHE', deStyle: 'ANDE', castle: 'MAPU_CASTLE_AGE3', label: '🌎 马普切（南安第斯）' },
            { key: 'TUPI',    deStyle: 'ANDE', castle: 'TUPI_CASTLE_AGE3', label: '🌎 图皮（南美丛林要塞）' },
        ],
    },
    {
        group: '🌍 AFRI 非洲 (3套)',
        deStyle: 'AFRI',
        branches: [
            { key: 'BERBER',     deStyle: 'AFRI', castle: 'BERB_CASTLE_AGE3', label: '🕌 柏柏尔（卡斯巴土堡）' },
            { key: 'AFRICA',     deStyle: 'AFRI', castle: 'AFRI_CASTLE_AGE3', label: '🌍 马里（生土要塞）' },
            { key: 'ETHIOPIANS', deStyle: 'AFRI', castle: 'ETHI_CASTLE_AGE3', label: '🌍 埃塞俄比亚（法西尔盖比石堡）' },
        ],
    },
    {
        group: '🏛️ PERSIAN 波斯 (2套)',
        deStyle: 'PERSIAN',
        branches: [
            { key: 'SASANIAN', deStyle: 'PERSIAN', castle: 'PERS_CASTLE_AGE3',    label: '🏛️ 波斯（巴姆圆城要塞）' },
            { key: 'PERSIAN',  deStyle: 'PERSIAN', castle: 'PERSIAN_CASTLE_AGE3', label: '🏛️ 阿契美尼德（波斯石堡）' },
        ],
    },
    {
        group: '🏛️ GREEK 希腊 (3套)',
        deStyle: 'GREEK',
        branches: [
            { key: 'ATHENIANS',  deStyle: 'GREEK', castle: 'ATHENIANS_CASTLE_AGE3',  label: '🏛️ 雅典（阿提卡卫城要塞）' },
            { key: 'SPARTANS',   deStyle: 'GREEK', castle: 'SPARTANS_CASTLE_AGE3',   label: '🏛️ 斯巴达（拉哥尼亚军营石堡）' },
            { key: 'MACEDONIAN', deStyle: 'GREEK', castle: 'MACEDONIAN_CASTLE_AGE3', label: '🏛️ 马其顿（希马鲁石塔城堡）' },
        ],
    },
    {
        group: '🏛️ THRACIAN 色雷斯 (1套)',
        deStyle: 'THRACIAN',
        branches: [
            { key: 'THRACIAN', deStyle: 'THRACIAN', castle: 'THRACIAN_CASTLE_AGE3', label: '🏛️ 色雷斯（古典要塞）' },
        ],
    },
];

/** 第三层专属定制风格（3 套自建，与 _citytest.html 完全对齐） */
export const LAYER3_CUSTOM_GROUPS: readonly CultureGroup[] = [
    {
        group: '🏔️ 青藏高原与高原专属宗堡',
        deStyle: 'PURU',
        branches: [
            { key: 'TIBET', deStyle: 'PURU', castle: 'TIBET_CASTLE_AGE3', label: '🏔️ 吐蕃·青藏（藏式金顶宗堡）' },
        ],
    },
    {
        group: '🏜️ 西域绿洲与专属高台要塞',
        deStyle: 'CEAS',
        branches: [
            { key: 'WESTERN', deStyle: 'CEAS', castle: 'WESTERN_CASTLE_AGE3', label: '🏜️ 西域·绿洲（汉伊高台绿洲要塞）' },
        ],
    },
    {
        group: '🏕️ 漠北蒙古毡帐营地',
        deStyle: 'ASIA',
        branches: [
            { key: 'MOBEI_MONGOL', deStyle: 'ASIA', castle: 'MONG_CASTLE_AGE3', label: '🏕️ 漠北蒙古（毡帐营地）' },
        ],
    },
];

/** 全量分支字典 key → CultureBranch（含 59 文明 + 3 专属） */
export const ALL_BRANCHES_MAP: Record<string, CultureBranch> = {};

for (const g of CULTURE_59_GROUPS) {
    for (const b of g.branches) ALL_BRANCHES_MAP[b.key] = b;
}
for (const g of LAYER3_CUSTOM_GROUPS) {
    for (const b of g.branches) ALL_BRANCHES_MAP[b.key] = b;
}

// 兼容别名与历史值
ALL_BRANCHES_MAP['NORTH'] = ALL_BRANCHES_MAP['CENTRAL'];
/* 🔴 [2026-09-18 主人定「青海（河湟）归东亚、套用 DE 契丹建筑」时清掉的历史别名]
 *   原为 `ALL_BRANCHES_MAP['HEXI'] = ALL_BRANCHES_MAP['WESTERN']`（把河西当西域）。
 *   它与游戏自己那两张表**直接打架**（实测）：
 *     · cityDeStyle.REGION_TO_DE_STYLE['HEXI'] = 'ASIA'      → 游戏按【东亚】素材渲染
 *     · deCastleAssets.REGION_CASTLE['HEXI'] = 'KHIT_CASTLE_AGE3' → 河西的险要城堡是【契丹】辽式边墙要塞
 *     · CultureBase16.HEXI = 'CENTRAL' → 经 REGION_TO_DE_STYLE['CENTRAL']='ASIA' 同样落到东亚
 *   留着它 → 玉门关/姑臧/青海 8 座在编辑器里显示成「中亚 CEAS · 西域」，
 *   而游戏里画的是东亚素材 + 契丹城堡 —— 「看着和游戏不一致」就是这么来的。
 *   清掉后：region='HEXI' 不再当分支，分支由 buildingStyle 决定（河西据点写的是 KHITAN 契丹）→
 *   一级 由 toBase16Style(HEXI→CENTRAL→ASIA) 得【东亚】，与游戏完全一致。
 *   ⚠️ 未写 buildingStyle 的 HEXI 据点则由 REGION_TO_BRANCH['HEXI']='CENTRAL' 推出二级【华夏】。 */
ALL_BRANCHES_MAP['STEPPE'] = ALL_BRANCHES_MAP['MONGOL'];
ALL_BRANCHES_MAP['WEST_ASIA'] = ALL_BRANCHES_MAP['TURKS'];
ALL_BRANCHES_MAP['OTTOMAN'] = ALL_BRANCHES_MAP['TURKS'];
ALL_BRANCHES_MAP['RUSSIAN'] = ALL_BRANCHES_MAP['SLAVIC'];
ALL_BRANCHES_MAP['YURT'] = ALL_BRANCHES_MAP['MOBEI_MONGOL'];

/**
 * 任何风格/区域代码 → 16 母体建筑风格 Key（100% 覆盖率，0 悬空）
 */
export function toBase16Style(code?: string | null): Base16StyleKey | null {
    if (!code) return null;
    const upper = code.trim().toUpperCase();
    // 1. 直通 16 母体
    if (BASE16_STYLES.some(s => s.key === upper)) return upper as Base16StyleKey;
    // 2. 查 59+3 分支字典
    const b = ALL_BRANCHES_MAP[upper];
    if (b) return b.deStyle;
    // 3. 处理带时代后缀的区域（如 TIBET_IMPERIAL / CENTRAL_ASIA_CASTLE / STEPPE_FEUDAL）
    const prefix = upper.replace(/_(ANTIQUITY|FEUDAL|CASTLE|IMPERIAL)$/, '');
    if (BASE16_STYLES.some(s => s.key === prefix)) return prefix as Base16StyleKey;
    const b2 = ALL_BRANCHES_MAP[prefix];
    if (b2) return b2.deStyle;
    return null;
}

export interface CityBase16Resolution {
    /** 16 母体建筑风格代码 */
    base16: Base16StyleKey;
    /** 16 母体中文名（如 东亚 / 西欧 / 中亚） */
    base16Name: string;
    /** 16 母体 Emoji */
    base16Emoji: string;
    /** 二层59文明或三层3自建分支 key（若有） */
    branchKey: string | null;
    /** 二层59文明或三层3自建分支标签中文名（若有） */
    branchName: string | null;
    /** 完整展示标签（如：东亚 ASIA · 江南 JIANGNAN） */
    displayLabel: string;
}

/**
 * 权威解析任意据点的 16 母体分类与细分分支（1088 座据点 100% 归类到 16 母体）
 */
export function resolveCityHierarchy(city: { buildingStyle?: string; region?: string }): CityBase16Resolution {
    const bs = city.buildingStyle?.trim() || '';
    const reg = city.region?.trim() || '';

    // 确定细分分支（59 或 3）
    let branchKey: string | null = null;
    let branchName: string | null = null;
    let base: Base16StyleKey = 'ASIA';

    // 1. 🔴 [2026-09-18 主人「必须一套数据」] **与游戏同序：buildingStyle 优先**。
    //    游戏侧 resolveCityDeBuildingStyle 就是「显式 buildingStyle 优先，否则按 region 兜底」；
    //    本函数原来反过来（region 优先）→ 实测 174 座据点里，编辑器显示的二级与战场实际用的不同，
    //    其中 33 座连一级素材都不一样（例：卡法 数据 buildingStyle=LATIN 意大利，
    //    但 region 里留着 STEPPE，编辑器就显示"草原"，而游戏画的是地中海素材）。
    if (bs && ALL_BRANCHES_MAP[bs.toUpperCase()] && !BASE16_STYLES.some(s => s.key === bs.toUpperCase())) {
        // buildingStyle 填了 59/3 分支名（如 JIANGNAN, WEI, MOBEI_MONGOL, KHITAN）→ 以它为准
        branchKey = bs.toUpperCase();
    } else if (reg && ALL_BRANCHES_MAP[reg.toUpperCase()]) {
        // buildingStyle 是 16 母体（或没写）→ 再看 region 是否是 62 类键
        branchKey = reg.toUpperCase();
    }
    // 1.5 🔴 [2026-09-18 主人报障「选了一个据点，怎么不显示二级或者三级？」
    //     与**游戏同源**：region 不是 62 类键时，用游戏权威表 REGION_TO_BRANCH 推出二级。
    //     实测（scratch/probe_hierarchy_branch.mts）：不改这一条，**258 座**据点在本页
    //     显示不出二/三级（表格「—」、面板 ②③ 为空），而游戏里其实有——
    //     如 底比斯 region=GREEK → ATHENIANS（雅典）、布鲁日/罗斯托克 region=HRE → GERMANIC（条顿）、
    //     维罗纳/比萨 region=ITALIANS → LATIN（意大利）。这条链与 resolveCastleAsset 解析城堡完全同一条。
    if (!branchKey && reg) {
        const viaRegion = REGION_TO_BRANCH[reg.toUpperCase()];
        if (viaRegion && ALL_BRANCHES_MAP[viaRegion]) branchKey = viaRegion;
    }

    if (branchKey) {
        const b = ALL_BRANCHES_MAP[branchKey];
        if (b) {
            base = b.deStyle;
            branchName = b.label.replace(/^[^\s]+\s+/, '').trim();
        }
    } else {
        base = toBase16Style(bs) || toBase16Style(reg) || 'ASIA';
    }

    const meta = BASE16_STYLES.find(s => s.key === base) || BASE16_STYLES[0];
    let displayLabel = `${meta.emoji} ${meta.name} (${meta.key})`;
    if (branchKey && branchName) {
        displayLabel += ` · ${branchName}`;
    }

    return {
        base16: meta.key,
        base16Name: meta.name,
        base16Emoji: meta.emoji,
        branchKey,
        branchName,
        displayLabel,
    };
}
