/**
 * 树种分配：这一战该长什么树。
 *
 * 主人定的原则（2026-08-24）：
 *   1. **一个底图一种树** —— 底图定基调，不在同一张图上混种。
 *   2. **地区覆盖** —— 同一种底图在不同地方换树。日本的温带城长樱花，
 *      中原长橡树，欧洲长阔叶大树，虽然底图都是「泥地 3」。
 *   3. **季节变体** —— 同一棵树春夏绿、秋天黄、冬天挂雪。
 *   4. **素材尽量都用上** —— 43 种树素材（31 常规 + 12 战役大树）不该闲置。
 *
 * 三层查询顺序：地区覆盖 → 底图默认 → 兜底；查到之后再套季节变体。
 *
 * 🔴🔴 **判据是「这地方什么植被最多」，不是「这地方有没有」**（主人 2026-08-24 定）。
 *    原话：「不要问什么地方有什么，只按什么地方什么植被最多」
 *         「黄土高原和藏东本来就有松柏，请问是松柏最多吗？？？
 *           不要用小概率事件解释事实情况」。
 *    我曾用「黄土高原本来就有松柏」为 ds2→ASIAN_PINE 辩护——那是拿局部（子午岭油松）
 *    解释整体。黄土高原的天然植被是**温带落叶阔叶林、栎类为主**。
 *    每加一条都要能回答：**这种地面上占优势的树是什么？**
 *
 * 🔴 树是**第二层**（配属），不是底图。底图只能是纯地表材质，见 WorldBaseMap.ts。
 * 🔴 JUNGLE / RAINFOREST 这两个素材名字像树，实际是**地面草丛**（一小撮草），
 *    不能当树用。PINE 那张是枯死的褐色松，只适合荒漠，别拿它当针叶林。
 */

/** 季节：0=春夏 1=秋 2=冬（与 Scene13EnvironmentPlan.season 同源） */
export type TreeSeason = 0 | 1 | 2;

/**
 * 季节变体表：夏 → [秋, 冬]。
 * 没登记的树四季同形（针叶、棕榈、热带树本来就不落叶）。
 */
const SEASON_VARIANT: Readonly<Record<string, [string, string]>> = {
    OAK: ['AUTUMN_OAK', 'SNOW_AUTUMN_OAK'],
    GREEN_OAK: ['AUTUMN_OAK', 'SNOW_AUTUMN_OAK'],
    ASIAN_MAPLE_GREEN: ['ASIAN_MAPLE_AUTUMN', 'ASIAN_MAPLE_AUTUMN'],
    BIRCH_GREEN: ['BIRCH_AUTUMN', 'BIRCH_WINTER'],
    ASIAN_PINE: ['ASIAN_PINE', 'SNOW_PINE'],
    CYPRESS: ['CYPRESS_DEC', 'CYPRESS_DEC'],
    WILLOW: ['WILLOW', 'BIRCH_WINTER'],
    // 战役大树：ST_G 是银杏（金黄扇叶），ST_I 是白色冬枯树
    SCENARIO_TREE_A: ['SCENARIO_TREE_G', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_B: ['SCENARIO_TREE_G', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_C: ['SCENARIO_TREE_G', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_D: ['SCENARIO_TREE_F', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_E: ['SCENARIO_TREE_G', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_H: ['SCENARIO_TREE_F', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_J: ['SCENARIO_TREE_G', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_K: ['SCENARIO_TREE_F', 'SCENARIO_TREE_I'],
    SCENARIO_TREE_L: ['SCENARIO_TREE_G', 'SCENARIO_TREE_I'],
    PEACH_BLOSSOM: ['ASIAN_MAPLE_AUTUMN', 'BIRCH_WINTER'],
    MONKEY_PUZZLE: ['MONKEY_PUZZLE', 'SNOW_PINE'],
    ITALIAN_PINE: ['ITALIAN_PINE', 'ITALIAN_PINE'],
};

/**
 * 底图 → 默认树。底图定基调。
 * key 是贴图名（见 WorldBaseMap 的 SIEGE_TILES / FIELD_TILES）。
 */
const TREE_BY_BASE: Readonly<Record<string, string>> = {
    // ── 攻城战底图 ──
    des: 'PALM',              // 极旱绿洲城 —— 敦煌、和田、巴格达、开罗
    ds2: 'OAK',               // 黄土城 —— 天然植被是温带落叶阔叶林，**栎类占优**（不是松柏）
    ds3: 'OAK',               // 温带城 —— 中原、欧洲、日韩
    ds4: 'OLIVE',             // 红土城 / 地中海
    gr4: 'WILLOW',            // 黑土 / 水稻土城 —— 江南、东北，水边柳
    // 🔴 草原底图的默认树是**橡树**不是金合欢：金合欢只长在非洲/阿拉伯/印度的
    //    热带稀树草原，欧亚温带草原（布拉格、蒙古）长它是硬伤。ACACIA 走地区覆盖。
    gr5: 'OAK',               // 草原城 —— 温带草原散生阔叶
    snd: 'SNOW_PINE',         // 雪原城

    // ── 野战底图 ──
    grs: 'GREEN_OAK',         // 湿润草地
    gr2: 'ASIAN_MAPLE_GREEN', // 温带草地 —— 东亚温带草地边缘的槭/栎混交，槭作区分色
    gr3: 'BIRCH_GREEN',       // 半干草地
    gr6: 'LUSH_BAMBOO',       // 丛林草地 —— 岭南、东南亚
    gr7: 'OAK',               // 干草原 —— 同 gr5，热带稀树草原走地区覆盖
    for: 'OAK',               // 温带林地
    fo2: 'BRAZILWOOD',        // 热带林地
    underbrush_leaves: 'ASIAN_PINE',  // 针叶林地
    pal: 'PALM',              // 砂质沙漠
    qs: 'DEAD_TREE',          // 流沙 —— 只剩枯树
    pal1: 'DEAD_TREE',        // 干涸盐湖
    // 🔴 戈壁的优势种是梭梭/红柳（素材没有），绝不是龙血树——那只长在也门/索科特拉，
    //    已由地区框单独覆盖。戈壁近乎无乔木，用枯木最实；攻城战自动换成绿洲棕榈。
    ds5: 'DEAD_TREE',         // 戈壁 —— 近乎无乔木
    gravel_default: 'ASIAN_PINE',  // 高山砾石
    qs2: 'MANGROVE',          // 沼泽 —— 红树
    sh4: 'WILLOW',            // 浅滩湿地
    rck: 'CYPRESS',           // 裸岩 —— 柏
    sno: 'SNOW_PINE',         // 冬季雪原
    sn2: 'SNOW_PINE',         // 冬季深雪
    snf: 'SNOW_PINE',         // 冬季雪林地
};

/**
 * 地区覆盖：同一种底图在不同地方换树。
 * 按经纬度框匹配，**先匹配到的先用**，所以特殊地区要排在前面。
 * base 留空表示对该地区的所有底图生效。
 */
interface RegionTree {
    /** [南纬, 北纬, 西经, 东经] */
    box: [number, number, number, number];
    /** 只对这些底图生效；不填 = 该地区通用 */
    bases?: readonly string[];
    tree: string;
    /** 注释用，说明为什么是这棵 */
    why: string;
}

const REGION_TREES: readonly RegionTree[] = [
    // ── 东亚 ──
    // ds4 必须带上：江户就是 ds4，漏了它日本会长出橄榄树
    { box: [30.0, 46.0, 129.0, 146.0], bases: ['ds3', 'ds4', 'gr2', 'grs', 'for'],
      tree: 'PEACH_BLOSSOM', why: '日本 —— 樱花' },
    { box: [33.0, 43.5, 124.0, 131.0], bases: ['ds3', 'ds4', 'gr2', 'grs', 'for'],
      tree: 'SCENARIO_TREE_B', why: '朝鲜半岛 —— 阔叶大树' },
    { box: [27.0, 34.0, 110.0, 123.0], bases: ['gr4', 'sh4'],
      tree: 'WILLOW', why: '江南水乡 —— 垂柳' },
    // 东界必须到 129：台南 120.2、首里 127.7、奄美 129.5 都在这条线以东，卡短了会漏成橄榄树
    { box: [20.0, 30.5, 104.0, 132.0], bases: ['ds4', 'ds3', 'gr6', 'fo2', 'grs', 'gr2'],
      tree: 'BAMBOO', why: '岭南 + 闽浙 + 台湾 + 琉球 —— 竹' },
    { box: [20.0, 30.0, 92.0, 106.0], bases: ['ds4', 'ds3', 'gr6', 'fo2', 'grs', 'gr2'],
      tree: 'LUSH_BAMBOO', why: '滇缅 + 阿萨姆 —— 茂竹' },
    // 中南半岛：顺化(16.5N)这一带原先谁都没盖到，落到 ds4 默认的橄榄
    { box: [8.0, 23.0, 92.0, 110.0], bases: ['ds4', 'ds3', 'gr6', 'fo2', 'grs', 'gr2'],
      tree: 'LUSH_BAMBOO', why: '中南半岛 —— 茂竹' },
    { box: [38.0, 54.0, 118.0, 136.0], bases: ['gr4', 'gr3'],
      tree: 'BIRCH_GREEN', why: '东北 —— 白桦' },
    { box: [24.0, 34.0, 97.0, 110.0], bases: ['ds4', 'ds3', 'gr2', 'grs', 'for'],
      tree: 'BAMBOO', why: '巴蜀/云贵 —— 成都平原的红土长竹樟，不是橄榄' },
    { box: [32.0, 42.0, 110.0, 122.0], bases: ['ds3', 'gr2', 'grs', 'for'],
      tree: 'SCENARIO_TREE_L', why: '华北中原 —— 榆槐类高大阔叶' },
    // 🔴 [2026-08-24 主人：「沙漠中种松树吗？？？」] 藏西/昆仑/帕米尔是**高山荒漠**，
    //    走 gravel_default 默认的 ASIAN_PINE 就成了沙漠种松（列城 3500m、萨毗城昆仑北麓）。
    //    那条默认在阿尔卑斯/天山这类湿润高山对，干旱高原不对。
    //    西藏有古柏（雅鲁藏布巨柏、藏东南柏木），柏比松耐旱得多。
    { box: [28.0, 40.0, 72.0, 96.0], bases: ['gravel_default', 'des', 'snd', 'rck', 'ds5', 'pal'],
      tree: 'CYPRESS', why: '藏西/昆仑/帕米尔高山荒漠 —— 藏柏' },

    // ── 南亚 / 东南亚 ──
    { box: [-11.0, 8.0, 95.0, 141.0],
      tree: 'WAX_PALM', why: '南洋群岛 —— 蜡棕' },
    // fo2/gr6 必须带上：泰米尔纳德(坦贾武尔 10.8°N)是热带林地底图，
    // 漏了它会落到 fo2 默认的巴西木——南印度长巴西木是硬伤。
    { box: [6.0, 35.0, 68.0, 92.0], bases: ['ds4', 'ds3', 'gr5', 'gr7', 'fo2', 'gr6', 'grs', 'gr2'],
      tree: 'WAX_PALM', why: '印度次大陆 —— 蜡棕' },

    // ── 西亚 / 地中海 ──
    // 🔴 南界必须 36 不能 30：30 会把**摩洛哥**(马拉喀什 31.6°N)圈进「地中海北岸」，
    //    撒哈拉边缘的绿洲城长出意大利伞松。北岸 = 欧洲侧，北非归马格里布框。
    //    黎凡特(33°N,35°E)不在任何框内 → 落到 ds4 默认的 OLIVE，正好对（橄榄老家）。
    { box: [36.0, 48.0, -10.0, 30.0], bases: ['ds4', 'gr5', 'gr7', 'rck'],
      tree: 'ITALIAN_PINE', why: '地中海北岸 —— 意大利伞松' },
    // ds2/ds3 必须带上：马拉喀什(31.6°N)是 ds2，漏了它会被地中海北岸框吃掉、
    // 长出**意大利伞松**——撒哈拉边缘的绿洲城长伞松是硬伤。摩洛哥是橄榄产区。
    { box: [27.0, 37.0, -12.0, 12.0], bases: ['ds4', 'ds3', 'ds2', 'gr5', 'gr7'],
      tree: 'OLIVE', why: '马格里布 —— 橄榄' },
    { box: [12.0, 20.0, 42.0, 56.0],
      tree: 'DRAGON_TREE', why: '也门/索科特拉 —— 龙血树原产地' },

    // ── 非洲 / 阿拉伯：金合欢 + 猴面包树的老家 ──
    // 纯沙漠底图（pal/qs/pal1/des）不覆盖 —— 那里只剩棕榈和枯树。
    // gr2/grs/for 必须带上：埃塞俄比亚高原是 gr2，漏了它阿克苏姆会长出亚洲枫
    { box: [-35.0, 16.0, -18.0, 52.0],
      bases: ['gr5', 'gr7', 'ds4', 'ds3', 'ds2', 'gr3', 'gr2', 'grs', 'for', 'gr6', 'fo2'],
      tree: 'BAOBAB', why: '撒哈拉以南非洲 —— 猴面包树' },
    { box: [12.0, 30.0, -18.0, 60.0], bases: ['gr5', 'gr7', 'ds2', 'ds3', 'gr3', 'gr2', 'grs'],
      tree: 'ACACIA', why: '萨赫勒 + 阿拉伯半岛 —— 稀树草原金合欢' },
    { box: [8.0, 30.0, 68.0, 92.0], bases: ['gr5', 'gr7', 'gr3'],
      tree: 'ACACIA', why: '德干/塔尔干旱区 —— 金合欢' },

    // ── 美洲 ──
    // 城池表里美洲只有 6 座，全在中南美；北美东部一座都没有，所以那棵大树给中美高原。
    { box: [2.0, 24.0, -106.0, -70.0], bases: ['ds3', 'ds4', 'ds2', 'gr2', 'grs', 'gr5', 'gr7', 'gr3'],
      tree: 'SCENARIO_TREE_J', why: '中美/安第斯北高原 —— 阔叶大树' },
    // 北界必须到 2°N 接上中美框：库斯科在 -13.5，卡在 -20 会掉进两框中间的空隙，
    // 落到底图默认的亚洲松——秘鲁高原长亚洲松是硬伤。
    { box: [-56.0, 2.0, -82.0, -53.0],
      bases: ['ds2', 'gravel_default', 'gr3', 'gr7', 'gr5', 'rck', 'ds3', 'gr2', 'grs'],
      tree: 'MONKEY_PUZZLE', why: '安第斯 —— 智利南洋杉' },
    { box: [-24.0, 12.0, -82.0, -34.0], bases: ['fo2', 'gr6', 'ds4'],
      tree: 'BRAZILWOOD', why: '亚马逊 —— 巴西木' },

    // ── 欧洲：温带阔叶带一地一种大树，别让整个欧洲长同一棵 ──
    // 🔴 顺序敏感：这些小框必须排在「中西欧」大框前面，否则被它先吃掉。
    { box: [49.0, 61.0, -11.0, 2.0], bases: ['ds3', 'gr2', 'grs', 'for', 'gr3'],
      tree: 'SCENARIO_TREE_A', why: '不列颠/爱尔兰 —— 阔叶大树' },
    { box: [38.0, 48.0, 13.0, 31.0], bases: ['ds3', 'gr2', 'grs', 'for', 'gr3'],
      tree: 'SCENARIO_TREE_D', why: '巴尔干 —— 阔叶大树' },
    // 意大利半岛的温带底图原先漏了：佛罗伦萨落到通用橡树，该是伞松
    { box: [37.0, 46.5, 6.5, 19.0], bases: ['ds3', 'gr2', 'grs', 'for', 'gr3'],
      tree: 'ITALIAN_PINE', why: '意大利半岛 —— 伞松' },
    { box: [39.0, 45.0, -10.0, 4.0], bases: ['ds3', 'gr2', 'grs', 'for'],
      tree: 'SCENARIO_TREE_K', why: '伊比利亚北部大西洋岸 —— 阔叶大树' },
    { box: [35.0, 45.0, 26.0, 52.0], bases: ['ds3', 'gr2', 'grs', 'for', 'gr3'],
      tree: 'SCENARIO_TREE_H', why: '安纳托利亚北岸/高加索 —— 阔叶大树' },
    // 让出 grs：实测中欧的 grs 城是尚贝里(阿尔卑斯)、维雷茨基(喀尔巴阡)这类
    // 湿润山地草甸，交给底图默认的 GREEN_OAK（绿橡）——否则这棵树全局零使用。
    { box: [45.0, 62.0, -12.0, 32.0], bases: ['ds3', 'gr2', 'for'],
      tree: 'SCENARIO_TREE_C', why: '中西欧 —— 阔叶大树' },
    { box: [48.0, 68.0, 20.0, 60.0], bases: ['ds3', 'gr2', 'gr3', 'for'],
      tree: 'SCENARIO_TREE_E', why: '东欧/俄罗斯 —— 阔叶大树' },
];

/**
 * 树密度：这一战该长多少棵。
 *
 * 🔴 [2026-08-24 主人定]「不要太密，毕竟是战场，主要表现的是军团」。
 *    调之前实测均值 104 棵/图（温带到 160），树把战场糊满了。
 *
 * 两个数：
 *   - `forestCover` 林块占**可用地**（屏幕内、非水、非军团走廊）的比例，是密度主体
 *   - `stragglers`  林外零星孤树的棵数
 *
 * 换算基准（`npx tsx tools/audit-tree-density.mts` 实测）：
 *   forestCover 每 1 个百分点 ≈ 落地 7 棵树。改完必须重跑那个脚本，别照公式算——
 *   树先按预算生成，再被间距、走廊、屏幕外三道剔除，账面和落地差得远。
 *
 * 梯度比绝对值更重要：真实世界温带林地和沙漠差一个数量级，
 * 旧表只差 3.8 倍（温带 159 / 沙漠 42），等于没分气候。
 */
export interface TreeDensity {
    /** 林块占可用地的比例 */
    forestCover: number;
    /** 林外散株棵数 */
    stragglers: number;
}

const DENSITY_BY_BASE: Readonly<Record<string, TreeDensity>> = {
    // ── 林地：唯一该有成片林子的一档，但也远不到「密林」──
    for:                { forestCover: 0.050, stragglers: 8 },   // 温带林地
    underbrush_leaves:  { forestCover: 0.050, stragglers: 8 },   // 针叶林地
    fo2:                { forestCover: 0.048, stragglers: 7 },   // 热带林地
    gr6:                { forestCover: 0.040, stragglers: 7 },   // 丛林草地
    snf:                { forestCover: 0.036, stragglers: 5 },   // 冬季雪林地

    // ── 温带农耕带：城郊有树，但主要是开阔耕地 ──
    ds3:                { forestCover: 0.022, stragglers: 6 },
    ds4:                { forestCover: 0.020, stragglers: 6 },
    gr4:                { forestCover: 0.022, stragglers: 6 },
    gr2:                { forestCover: 0.020, stragglers: 6 },
    grs:                { forestCover: 0.022, stragglers: 6 },

    // ── 湿地：水边成排的树，不成林 ──
    qs2:                { forestCover: 0.016, stragglers: 6 },
    sh4:                { forestCover: 0.015, stragglers: 6 },

    // ── 半干 / 高地：疏林 ──
    ds2:                { forestCover: 0.011, stragglers: 5 },
    gr3:                { forestCover: 0.012, stragglers: 5 },
    rck:                { forestCover: 0.009, stragglers: 4 },
    gravel_default:     { forestCover: 0.009, stragglers: 4 },

    // ── 草原：散生孤树，几乎没有成片林 ──
    gr5:                { forestCover: 0.007, stragglers: 5 },
    gr7:                { forestCover: 0.007, stragglers: 5 },

    // ── 雪原 ──
    snd:                { forestCover: 0.004, stragglers: 4 },
    sno:                { forestCover: 0.004, stragglers: 4 },
    sn2:                { forestCover: 0.002, stragglers: 3 },

    // ── 极旱：几棵而已 ──
    des:                { forestCover: 0.002, stragglers: 3 },
    pal:                { forestCover: 0.002, stragglers: 3 },
    ds5:                { forestCover: 0.002, stragglers: 3 },
    qs:                 { forestCover: 0.001, stragglers: 3 },
    pal1:               { forestCover: 0.001, stragglers: 3 },
};

/** 兜底密度：查不到底图时按温带农耕算 */
const FALLBACK_DENSITY: TreeDensity = { forestCover: 0.020, stragglers: 6 };

/**
 * 攻城战的树比野战少。
 * 🔴 [2026-08-24 主人定] 这是真实的：城郊的林子早被砍去做梁柱、烧柴、修攻城器械，
 *    剩下的地被开成耕地牧场。城下从来不是林子，是清出来的开阔地。
 */
const SIEGE_TREE_SCALE = 0.6;

/** 查这一战该长多少树。底图查不到就兜底。 */
export function treeDensityFor(baseTile: string, isSiege = false): TreeDensity {
    const d = DENSITY_BY_BASE[baseTile] ?? FALLBACK_DENSITY;
    if (!isSiege) return d;
    return {
        forestCover: d.forestCover * SIEGE_TREE_SCALE,
        stragglers: Math.max(2, Math.round(d.stragglers * SIEGE_TREE_SCALE)),
    };
}

/**
 * 枯树只长在野外。
 * 🔴 [2026-08-24 主人定] 城郊不会有立着的枯树——早被拾去当柴烧了。
 *    攻城战里凡是要放 DEAD_TREE 的地方，一律换成活树或干脆不放。
 */
export function allowsDeadTree(isSiege: boolean): boolean {
    return !isSiege;
}

export interface TreeQuery {
    /** 底图贴图名（WorldBaseMap 查出来的那个） */
    baseTile: string;
    lat: number;
    lng: number;
    season: TreeSeason;
    /** 攻城战：城郊不出枯树 */
    isSiege?: boolean;
}

/** 兜底树：查不到时用，四季通用、地域中性 */
const FALLBACK_TREE = 'OAK';

/**
 * 查这一战该长什么树。
 * 顺序：地区覆盖 → 底图默认 → 兜底；拿到之后套季节变体。
 */
export function pickTree(q: TreeQuery): string {
    let tree: string | undefined;

    for (const r of REGION_TREES) {
        const [s, n, w, e] = r.box;
        if (q.lat < s || q.lat > n || q.lng < w || q.lng > e) continue;
        if (r.bases && !r.bases.includes(q.baseTile)) continue;
        tree = r.tree;
        break;
    }
    if (!tree) tree = TREE_BY_BASE[q.baseTile];
    if (!tree) tree = FALLBACK_TREE;

    // 攻城战不出枯树：城郊的枯木早被拾去烧了。换成耐旱的活树。
    if (tree === 'DEAD_TREE' && !allowsDeadTree(q.isSiege ?? false)) tree = 'PALM';

    if (q.season === 0) return tree;
    const variant = SEASON_VARIANT[tree];
    if (!variant) return tree;          // 针叶/棕榈/热带树四季同形
    return q.season === 1 ? variant[0] : variant[1];
}

/** 调试/验收用：把三张表暴露出去 */
export function treeTables(): {
    byBase: Readonly<Record<string, string>>;
    regions: readonly RegionTree[];
    seasons: Readonly<Record<string, [string, string]>>;
} {
    return { byBase: TREE_BY_BASE, regions: REGION_TREES, seasons: SEASON_VARIANT };
}
