/**
 * 据点生产方式总表：人文轴（文化给权重）× 自然轴（地理给门槛）。口径见 docs/AGENTS/environment-architecture.md。
 *
 * 🔴 2026-11-05 主人令「我们只有67个文化，有的文化这9种可能都有。请问你觉得该如何符合历史安排？」→「好的，请执行。」
 *   旧做法是一文化一种生产方式（维京沿海只会打鱼、丹麦平原不种田）。现改为两层：
 *   1. 地理是硬门槛：这一带做不了的生产方式直接去掉（没海不打鱼、没山不采矿、没林不伐木打猎、非稻作气候不种稻）；
 *   2. 文化给权重：剩下的按本文化权重抽，每个据点每年的 1~4 组各抽一次。权重 0 = 这个文化从不做。
 *   权重按各文化的史实主业定：主业 4~6，常见副业 2~3，零星 1。
 *
 * 只认实际有据点的 67 个建筑文化（cities_v2 的 buildingStyle）；不在表里的文化按旱作处理。
 */
import { envZoneAt, type EnvZone } from './envZones';
import { koppenClassIdAt } from '../../data/KoppenGeigerGrid';

export type LivelihoodCategory =
    | 'farming_rice'
    | 'farming_dry'
    | 'nomadic_steppe'
    | 'nomadic_oasis'
    | 'highland_pastoral'
    | 'forest_hunting'
    | 'forest_logging'
    | 'maritime_fishing'
    | 'mining_foraging';

export const LIVELIHOOD_CATEGORIES: readonly LivelihoodCategory[] = [
    'farming_rice', 'farming_dry', 'nomadic_steppe', 'nomadic_oasis', 'highland_pastoral',
    'forest_hunting', 'forest_logging', 'maritime_fishing', 'mining_foraging',
];

export const LIVELIHOOD_NAMES: Readonly<Record<LivelihoodCategory, string>> = {
    farming_rice: '稻作', farming_dry: '旱作', nomadic_steppe: '放牧', nomadic_oasis: '驼牧',
    highland_pastoral: '高原畜牧', forest_hunting: '狩猎', forest_logging: '伐木',
    maritime_fishing: '渔业', mining_foraging: '采矿',
};

type W = Partial<Record<LivelihoodCategory, number>>;

/**
 * 67 文化 → 生产方式权重。键名缩写：R 稻作 D 旱作 S 放牧 O 驼牧 H 高原畜牧 Hu 狩猎 L 伐木 F 渔业 M 采矿。
 * 放牧（nomadic_steppe）在定居文化里画的是定居畜牧（牧场＋牧屋，牛羊），毡帐只给游牧文化，见 NOMADIC_HERDER_CULTURES。
 */
export const LIVELIHOOD_WEIGHTS: Readonly<Record<string, W>> = {
    // ── 东亚 ──
    CENTRAL: { farming_dry: 6, farming_rice: 1, maritime_fishing: 1, mining_foraging: 1 },          // 中原粟麦旱作，淮河一线有稻，山东沿海渔盐，山地冶铁
    WEI: { farming_dry: 6, nomadic_steppe: 1, maritime_fishing: 1, mining_foraging: 1 },           // 北方旱作，长城一线兼牧
    JIANGNAN: { farming_rice: 6, maritime_fishing: 2, farming_dry: 1, forest_logging: 1 },        // 水田稻作，太湖与沿海渔业
    HUGUANG: { farming_rice: 6, maritime_fishing: 1, forest_logging: 1, mining_foraging: 1 },     // 两湖稻作，湘南岭南山林与矿
    BASHU: { farming_rice: 5, farming_dry: 2, forest_logging: 1, mining_foraging: 1 },            // 成都平原水田，丘陵旱作，盐井铁冶
    HEXI: { farming_dry: 3, nomadic_steppe: 3, nomadic_oasis: 2 },                                // 河西绿洲屯田与祁连山牧场，驼运
    NORTHEAST: { forest_hunting: 4, farming_dry: 2, maritime_fishing: 2, nomadic_steppe: 1, forest_logging: 1 }, // 渔猎为本，辽河旱作，西部兼牧
    MONGOL: { nomadic_steppe: 6, forest_hunting: 2, nomadic_oasis: 1 },                           // 草原游牧，围猎，戈壁驼群
    XIANBEI: { nomadic_steppe: 5, forest_hunting: 2, farming_dry: 1 },                            // 游牧渔猎，南迁后兼农
    KOREA: { farming_rice: 5, farming_dry: 2, maritime_fishing: 2, mining_foraging: 1 },          // 三南水田，北部旱作，三面临海
    JAPAN: { farming_rice: 6, maritime_fishing: 3, forest_logging: 1, mining_foraging: 1, farming_dry: 1 }, // 水田稻作与沿海渔业，山林与银矿
    TIBET: { highland_pastoral: 6, farming_dry: 2, mining_foraging: 1 },                          // 牦牛畜牧，雅鲁藏布河谷青稞
    WESTERN: { nomadic_oasis: 4, farming_dry: 3, nomadic_steppe: 2, mining_foraging: 1 },         // 西域绿洲农业与驼运，天山牧场，和田玉
    CENTRAL_ASIA: { farming_dry: 3, nomadic_oasis: 3, nomadic_steppe: 3, mining_foraging: 1 },    // 河中灌溉农业，草原游牧，驼队
    TURKS: { nomadic_steppe: 5, farming_dry: 1, nomadic_oasis: 1, forest_hunting: 1 },
    CUMAN: { nomadic_steppe: 6, farming_dry: 1, forest_hunting: 1 },
    HUNS: { nomadic_steppe: 6, forest_hunting: 1 },

    // ── 南亚 · 东南亚 ──（印度文化圈不养猪另见民生层禁猪表）
    INDIA: { farming_rice: 4, farming_dry: 3, nomadic_steppe: 1, maritime_fishing: 1, mining_foraging: 1 },
    MUGHAL: { farming_dry: 4, farming_rice: 3, nomadic_steppe: 1 },                                // 北印度小麦与恒河稻作
    BENGALIS: { farming_rice: 6, maritime_fishing: 2 },                                           // 三角洲水田与河海渔业
    GURJARAS: { nomadic_oasis: 4, farming_dry: 3, nomadic_steppe: 2 },                            // 拉贾斯坦驼牧与旱作
    PURU: { farming_rice: 3, farming_dry: 3, nomadic_steppe: 1, maritime_fishing: 1 },
    KHMER: { farming_rice: 6, maritime_fishing: 2, forest_logging: 1 },                           // 洞里萨湖稻作与渔业
    BURMESE: { farming_rice: 5, farming_dry: 1, forest_logging: 1, maritime_fishing: 1, mining_foraging: 1 },
    VIETNAMESE: { farming_rice: 6, maritime_fishing: 2 },
    MALAY: { maritime_fishing: 4, farming_rice: 3, forest_hunting: 1, forest_logging: 1 },        // 海上贸易与渔业，沿岸稻作

    // ── 西亚 · 北非 · 高加索 ──
    PERSIAN: { farming_dry: 4, nomadic_oasis: 3, nomadic_steppe: 2, mining_foraging: 1 },         // 坎儿井灌溉农业，部落驼羊游牧
    SASANIAN: { farming_dry: 4, nomadic_oasis: 2, nomadic_steppe: 2, mining_foraging: 1 },
    ORIE: { nomadic_oasis: 4, farming_dry: 3, maritime_fishing: 1 },                              // 贝都因驼牧与河谷、绿洲农业
    BERBER: { nomadic_oasis: 3, farming_dry: 3, nomadic_steppe: 2, maritime_fishing: 1, mining_foraging: 1 },
    ARMENIANS: { farming_dry: 4, nomadic_steppe: 2, mining_foraging: 2 },                         // 高原谷地农业，山地放牧，铜铁矿
    GEORGIANS: { farming_dry: 4, nomadic_steppe: 2, mining_foraging: 1, forest_logging: 1 },
    BYZANTINE: { farming_dry: 5, maritime_fishing: 2, nomadic_steppe: 1, mining_foraging: 1 },

    // ── 南欧 ──
    GREECE: { farming_dry: 4, maritime_fishing: 3, nomadic_steppe: 2, mining_foraging: 1 },       // 谷物橄榄，渔业，山地羊群
    ATHENIANS: { farming_dry: 4, maritime_fishing: 3, mining_foraging: 2, nomadic_steppe: 1 },    // 劳里昂银矿
    SPARTANS: { farming_dry: 6, nomadic_steppe: 2, maritime_fishing: 1 },                         // 黑劳士耕种的拉科尼亚农业
    MACEDONIAN: { farming_dry: 4, mining_foraging: 3, nomadic_steppe: 2, forest_logging: 1 },     // 潘盖翁金矿，造船木材
    THRACIAN: { farming_dry: 4, nomadic_steppe: 2, mining_foraging: 2, forest_logging: 1 },
    LATIN: { farming_dry: 5, nomadic_steppe: 1, maritime_fishing: 1, mining_foraging: 1 },
    ROMA: { farming_dry: 5, nomadic_steppe: 1, maritime_fishing: 1, mining_foraging: 1 },
    SICILIANS: { farming_dry: 5, maritime_fishing: 3, nomadic_steppe: 1 },                        // 地中海粮仓，金枪鱼渔业
    SPANISH: { farming_dry: 4, nomadic_steppe: 3, mining_foraging: 2, maritime_fishing: 1 },      // 麦斯塔美利奴羊群，西班牙银矿
    PORTUGUESE: { maritime_fishing: 4, farming_dry: 3, nomadic_steppe: 1 },

    // ── 西欧 · 中欧 ──
    FRANKS: { farming_dry: 6, nomadic_steppe: 1, forest_hunting: 1, forest_logging: 1, maritime_fishing: 1 },
    BURGUNDIANS: { farming_dry: 6, nomadic_steppe: 1, forest_logging: 1 },
    BRITONS: { farming_dry: 5, nomadic_steppe: 3, maritime_fishing: 2, mining_foraging: 1 },      // 羊毛业，康沃尔锡矿
    CELTS: { nomadic_steppe: 4, farming_dry: 3, maritime_fishing: 2, forest_hunting: 1 },         // 以牛为财的畜牧社会
    SAXONS: { farming_dry: 5, nomadic_steppe: 2, forest_hunting: 1, forest_logging: 1, maritime_fishing: 1 },
    GERMANIC: { farming_dry: 5, nomadic_steppe: 2, forest_hunting: 1, forest_logging: 1, mining_foraging: 1 },
    GOTHS: { farming_dry: 5, nomadic_steppe: 2, forest_hunting: 1 },

    // ── 北欧 ──
    VIKINGS: { farming_dry: 4, nomadic_steppe: 3, maritime_fishing: 3, forest_hunting: 1, forest_logging: 1 }, // 农牧为本，渔业捕鲸为补
    DANES: { farming_dry: 5, nomadic_steppe: 2, maritime_fishing: 2 },                            // 北欧最肥沃的平原
    VARANGIANS: { farming_dry: 3, forest_hunting: 3, forest_logging: 2, maritime_fishing: 2, nomadic_steppe: 1 }, // 罗斯林区农耕与毛皮

    // ── 东欧 ──
    POLES: { farming_dry: 6, nomadic_steppe: 1, forest_hunting: 1, forest_logging: 1 },
    BOHEMIANS: { farming_dry: 5, mining_foraging: 2, forest_logging: 1, nomadic_steppe: 1 },      // 库特纳霍拉银矿
    MAGYAR: { farming_dry: 4, nomadic_steppe: 3 },                                                // 潘诺尼亚平原农业与马牛放牧
    SLAVIC: { farming_dry: 5, forest_hunting: 2, forest_logging: 2, nomadic_steppe: 1, maritime_fishing: 1 }, // 黑麦粟旱作，林中狩猎毛皮
    LITHUANIANS: { farming_dry: 4, forest_hunting: 2, forest_logging: 2, nomadic_steppe: 1, maritime_fishing: 1 },
    BULGARIANS: { farming_dry: 5, nomadic_steppe: 2, mining_foraging: 1 },

    // ── 撒哈拉以南非洲 ──
    AFRICA: { farming_dry: 4, nomadic_steppe: 2, mining_foraging: 2, forest_hunting: 1, maritime_fishing: 1 }, // 高粱小米，牛群，马里与津巴布韦金矿
    ETHIOPIANS: { farming_dry: 5, nomadic_steppe: 2, mining_foraging: 1 },                        // 埃塞俄比亚高原苔麸犁耕

    // ── 美洲 ──（1492 年前无牛马猪羊，畜种另见民生层）
    MAYANS: { farming_dry: 6, forest_hunting: 1, maritime_fishing: 1 },                           // 玉米米尔帕轮作
    AMERICA: { forest_hunting: 3, farming_dry: 3, maritime_fishing: 2, forest_logging: 1 },       // 玉米豆南瓜与渔猎
    INCA: { farming_dry: 4, highland_pastoral: 4, mining_foraging: 1 },                           // 梯田马铃薯玉米，羊驼放牧
    MUISCA: { farming_dry: 5, mining_foraging: 2, highland_pastoral: 1 },                         // 高原农业，盐与祖母绿
    MAPUCHE: { farming_dry: 4, highland_pastoral: 2, maritime_fishing: 1, forest_hunting: 1 },
    TUPI: { farming_dry: 4, forest_hunting: 2, maritime_fishing: 2 },                             // 木薯轮作与渔猎
};

/** 放牧时住毡帐 / 游牧营地的文化（其余文化放牧画定居牧场：牧屋＋牛羊） */
export const NOMADIC_HERDER_CULTURES: ReadonlySet<string> = new Set([
    'MONGOL', 'XIANBEI', 'HUNS', 'CUMAN', 'TURKS', 'HEXI', 'CENTRAL_ASIA', 'WESTERN',
    'PERSIAN', 'SASANIAN', 'ORIE', 'BERBER', 'GURJARAS', 'TIBET',
]);

/** 据点周边的自然条件（海域另由民生层逐组找渔场判定） */
export interface LivelihoodGeo {
    zone: EnvZone;
    /** 附近有山地 */
    mountain: boolean;
    /** 附近天然有林（潜在植被） */
    forest: boolean;
    /** 柯本高山苔原 / 冰原（ET / EF）：种不了地 */
    tundra: boolean;
    /** 柯本热带雨林 / 季风雨林（Af / Am）：不成牧场 */
    rainforest: boolean;
    /** 柯本干旱带（BWh / BWk / BSh / BSk）：骆驼只放在这里 */
    arid: boolean;
}

/** 柯本编号：KoppenGeigerGrid 1=Af 2=Am 4~7=BWh/BWk/BSh/BSk … 29=ET 30=EF */
const KOPPEN_AF = 1, KOPPEN_AM = 2, KOPPEN_B_FIRST = 4, KOPPEN_B_LAST = 7, KOPPEN_ET = 29, KOPPEN_EF = 30;

/** 组装据点自然条件：环境区与柯本取坐标，山地 / 森林由调用方按各自数据源判好传进来 */
export function buildLivelihoodGeo(lat: number, lng: number, mountain: boolean, forest: boolean): LivelihoodGeo {
    const k = koppenClassIdAt(lat, lng) ?? 0;
    return {
        zone: envZoneAt(lat, lng),
        mountain,
        forest,
        tundra: k === KOPPEN_ET || k === KOPPEN_EF,
        rainforest: k === KOPPEN_AF || k === KOPPEN_AM,
        arid: k >= KOPPEN_B_FIRST && k <= KOPPEN_B_LAST,
    };
}

const RICE_ZONES: ReadonlySet<EnvZone> = new Set(['EAS', 'SEA', 'SAS', 'SWM']);
const NO_PASTURE_ZONES: ReadonlySet<EnvZone> = new Set(['SEA', 'EAS', 'NEO', 'HDS']);
/** 骆驼可达的大区（再叠柯本干旱带门槛）：含塔尔沙漠（南亚）、马格里布内陆（地中海区）、萨赫勒（非洲） */
const CAMEL_ZONES: ReadonlySet<EnvZone> = new Set(['HDS', 'CAD', 'WAH', 'STP', 'SAS', 'MED', 'AFR']);
const HIGHLAND_ZONES: ReadonlySet<EnvZone> = new Set(['TIB', 'AND']);

/**
 * 地理门槛：这一带能不能做这种生产。只看自然条件，不看文化。
 * 渔业在这里一律放行，是否真有海由民生层找渔场决定（找不到就本组换别的）。
 */
export function livelihoodGeoAllowed(cat: LivelihoodCategory, geo: LivelihoodGeo, lat: number, lng: number): boolean {
    switch (cat) {
        case 'farming_rice':
            // 稻作气候区；朝鲜半岛南部按水田稻作（华北平原—朝鲜区里只认东经 124° 以东、北纬 39° 以南）
            if (geo.tundra) return false;
            return RICE_ZONES.has(geo.zone) || (geo.zone === 'NCP' && lng >= 124 && lat < 39);
        case 'farming_dry':
            return geo.zone !== 'ARC' && !geo.tundra;
        case 'nomadic_steppe':
            return !NO_PASTURE_ZONES.has(geo.zone) && !geo.rainforest;
        case 'nomadic_oasis':
            // 骆驼只在干旱草原荒漠（柯本 B 带）；森林草原、山地针叶林、高山苔原都不是 B 带，自然排除
            return CAMEL_ZONES.has(geo.zone) && geo.arid;
        case 'highland_pastoral':
            return HIGHLAND_ZONES.has(geo.zone) || geo.mountain;
        case 'forest_hunting':
        case 'forest_logging':
            return geo.forest;
        case 'mining_foraging':
            return geo.mountain;
        case 'maritime_fishing':
            return true;
    }
}

/** 本文化在这片地理下可选的生产方式与权重（已去掉权重 0 与地理不允许的） */
export function livelihoodCandidates(
    style: string, geo: LivelihoodGeo, lat: number, lng: number,
): { cat: LivelihoodCategory; w: number }[] {
    const weights = LIVELIHOOD_WEIGHTS[style] ?? { farming_dry: 1 };
    const out: { cat: LivelihoodCategory; w: number }[] = [];
    for (const cat of LIVELIHOOD_CATEGORIES) {
        const w = weights[cat] ?? 0;
        if (w > 0 && livelihoodGeoAllowed(cat, geo, lat, lng)) out.push({ cat, w });
    }
    // 全被地理挡掉（极少）：北极海岸只剩渔猎，高山苔原只能放牧，其余退旱作
    if (!out.length) out.push({ cat: geo.zone === 'ARC' ? 'forest_hunting' : geo.tundra ? 'nomadic_steppe' : 'farming_dry', w: 1 });
    return out;
}

/** 按权重抽一种；roll01 ∈ [0,1)，exclude 里的不参与（例如本组找不到渔场后去掉渔业重抽） */
export function pickLivelihood(
    cands: readonly { cat: LivelihoodCategory; w: number }[],
    roll01: number,
    exclude?: ReadonlySet<LivelihoodCategory>,
): LivelihoodCategory | null {
    const pool = exclude ? cands.filter((c) => !exclude.has(c.cat)) : cands;
    let total = 0;
    for (const c of pool) total += c.w;
    if (total <= 0) return null;
    let r = roll01 * total;
    for (const c of pool) {
        r -= c.w;
        if (r < 0) return c.cat;
    }
    return pool[pool.length - 1].cat;
}
