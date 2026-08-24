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
    ds2: 'ASIAN_PINE',        // 黄土城 / 高原河谷 —— 耐旱针叶
    ds3: 'OAK',               // 温带城 —— 中原、欧洲、日韩
    ds4: 'OLIVE',             // 红土城 / 地中海
    gr4: 'WILLOW',            // 黑土 / 水稻土城 —— 江南、东北，水边柳
    gr5: 'ACACIA',            // 草原城 —— 蒙古、中亚、干地中海
    snd: 'SNOW_PINE',         // 雪原城

    // ── 野战底图 ──
    grs: 'GREEN_OAK',         // 湿润草地
    gr2: 'ASIAN_MAPLE_GREEN', // 温带草地
    gr3: 'BIRCH_GREEN',       // 半干草地
    gr6: 'LUSH_BAMBOO',       // 丛林草地 —— 岭南、东南亚
    gr7: 'ACACIA',            // 干草原
    for: 'OAK',               // 温带林地
    fo2: 'BRAZILWOOD',        // 热带林地
    underbrush_leaves: 'ASIAN_PINE',  // 针叶林地
    pal: 'PALM',              // 砂质沙漠
    qs: 'DEAD_TREE',          // 流沙 —— 只剩枯树
    pal1: 'DEAD_TREE',        // 干涸盐湖
    ds5: 'DRAGON_TREE',       // 戈壁 —— 龙血树
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
    { box: [30.0, 46.0, 129.0, 146.0], bases: ['ds3', 'gr2', 'grs', 'for'],
      tree: 'PEACH_BLOSSOM', why: '日本 —— 樱花' },
    { box: [33.0, 43.5, 124.0, 131.0], bases: ['ds3', 'gr2', 'grs', 'for'],
      tree: 'SCENARIO_TREE_B', why: '朝鲜半岛 —— 阔叶大树' },
    { box: [27.0, 34.0, 110.0, 123.0], bases: ['gr4', 'sh4'],
      tree: 'WILLOW', why: '江南水乡 —— 垂柳' },
    { box: [20.0, 27.0, 104.0, 120.0], bases: ['ds4', 'gr6', 'fo2'],
      tree: 'BAMBOO', why: '岭南 —— 竹' },
    { box: [20.0, 30.0, 96.0, 106.0], bases: ['ds4', 'gr6', 'fo2'],
      tree: 'LUSH_BAMBOO', why: '滇缅 —— 茂竹' },
    { box: [38.0, 54.0, 118.0, 136.0], bases: ['gr4', 'gr3'],
      tree: 'BIRCH_GREEN', why: '东北 —— 白桦' },

    // ── 南亚 / 东南亚 ──
    { box: [-11.0, 8.0, 95.0, 141.0],
      tree: 'WAX_PALM', why: '南洋群岛 —— 蜡棕' },
    { box: [6.0, 35.0, 68.0, 92.0], bases: ['ds4', 'ds3', 'gr5', 'gr7'],
      tree: 'WAX_PALM', why: '印度次大陆 —— 蜡棕' },

    // ── 西亚 / 地中海 ──
    { box: [30.0, 48.0, -10.0, 30.0], bases: ['ds4', 'gr5', 'gr7', 'rck'],
      tree: 'ITALIAN_PINE', why: '地中海北岸 —— 意大利伞松' },
    { box: [27.0, 37.0, -12.0, 12.0], bases: ['ds4', 'gr5', 'gr7'],
      tree: 'OLIVE', why: '马格里布 —— 橄榄' },
    { box: [12.0, 20.0, 42.0, 56.0],
      tree: 'DRAGON_TREE', why: '也门/索科特拉 —— 龙血树原产地' },

    // ── 非洲 ──
    { box: [-35.0, 18.0, -18.0, 52.0], bases: ['gr5', 'gr7', 'ds4', 'ds3'],
      tree: 'BAOBAB', why: '撒哈拉以南非洲 —— 猴面包树' },

    // ── 美洲 ──
    { box: [-56.0, -20.0, -76.0, -53.0], bases: ['ds2', 'gravel_default', 'gr3', 'gr7'],
      tree: 'MONKEY_PUZZLE', why: '南美南部/安第斯 —— 智利南洋杉' },
    { box: [-24.0, 12.0, -82.0, -34.0], bases: ['fo2', 'gr6', 'ds4'],
      tree: 'BRAZILWOOD', why: '亚马逊 —— 巴西木' },

    // ── 欧洲 ──
    { box: [45.0, 62.0, -12.0, 32.0], bases: ['ds3', 'gr2', 'grs', 'for'],
      tree: 'SCENARIO_TREE_C', why: '中西欧 —— 阔叶大树' },
    { box: [48.0, 68.0, 20.0, 60.0], bases: ['ds3', 'gr2', 'gr3', 'for'],
      tree: 'SCENARIO_TREE_E', why: '东欧/俄罗斯 —— 阔叶大树' },
];

export interface TreeQuery {
    /** 底图贴图名（WorldBaseMap 查出来的那个） */
    baseTile: string;
    lat: number;
    lng: number;
    season: TreeSeason;
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
