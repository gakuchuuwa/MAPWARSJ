import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { CITIES_V2, type CityDataV2, type BuildingStyle } from '../data/cities_v2';
import { LandSeaSystem, LandTerrainSystem } from '../world/land-sea';
import { TREE_METAS } from './VegetationLayer';
import { resolveCityDeBuildingStyle } from '../systems/cityDeStyle';

/**
 * CityLifeAmbientLayer — 战略地图「67 文化据点民生生态 & 战火破坏/尸骸渐变」环境层（2026-10-26 主人定稿）。
 *
 * 功能特性：
 *   1. 覆盖全部 67 个文化（农耕稻作、农耕旱作、草原游牧、丝路绿洲驼牧、高原畜牧、山林渔猎、海洋水网渔业、矿冶采集）。
 *   2. 渔猎民族据点周围强制覆盖四季树林与灌丛浆果植被（猎人、樵夫、采集者与林间鹿/野猪在树林灌丛间劳作；
 *      战时树林渐变为倒伏断木 FELLED_GENERIC、树桩 STUMP_GENERIC 与焦枯死树 DEAD_TREE）。
 *   3. 渔业严格在海中（绝不在陆地放渔夫）：在沿海海域生成 DE 渔船（SHP_FISHING_SHIP 撒网/往返航行）与海鱼群
 *      （DORADO_FISH / SALMON_FISH / TUNA_FISH / SHORE_FISH 跃水游弋）；战时渐变为沉没破损渔船（SHP_FISHING_SHIP:sink + SHIP_SINK_SMALL）。
 *   4. 对应四季（每季 15 秒；季末最后 5 秒交叉渐变农田、树林与劳作动作，季首完成衔接）。
 *   5. 战火破坏与尸骸渐变：据点被围攻或周围半径 0.3° 内有军团交战时，通过 damageBlend (0 → 1) 平滑渐变为
 *      被破坏的农车/栅栏/断木废墟、倒地平民尸体、平民白骨、战死牲畜与沉没渔船；完全战毁后保留残骸，
 *      到第二年春季且战斗已结束时，先渐隐残骸，再渐显生产组合。
 */

type Pt = { lat: number; lng: number };

interface SpriteSheetAsset {
    key: string;
    basePath: string;
    action: string;
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
    lastUsed: number;
}

interface StripStaticAsset {
    key: string;
    frames: number;
    boxW: number;
    boxH: number;
    anchorX: number;
    anchorY: number;
    sheet: HTMLImageElement | null;
    ready: boolean;
    lastUsed: number;
}

type LivelihoodCategory =
    | 'farming_rice'
    | 'farming_dry'
    | 'nomadic_steppe'
    | 'nomadic_oasis'
    | 'highland_pastoral'
    | 'forest_hunting'
    | 'forest_logging'
    | 'maritime_fishing'
    | 'mining_foraging';

interface LivelihoodSpec {
    category: LivelihoodCategory;
    villagers: string[];       // SUCAI 下的目录名（仅陆地工种，渔业统一走海上渔船）
    animals: string[];         // SUCAI_ANIMAL 下的目录名
    winterRestAboveLat: number; // 高于此纬度的据点在冬季部分/全部休耕渐隐（90 表示冬季不休）
}

type WarDamagePreset =
    | 'corpse_and_fence'       // 倒地平民尸体 + 被毁木栅栏残骸
    | 'broken_cart_and_bones'  // 倾覆破损农车/辎重车 + 荷锄平民骸骨
    | 'rubble_and_corpse'      // 焦木石块废墟 + 倒地平民尸体
    | 'animal_loss'            // 牲畜白骨 + 破损牧场围栏
    | 'sea_shipwreck';         // 海上渔船被毁沉没 + 残骸水花

/** 渔猎民族据点周围伴生树林与灌丛植被节点 */
interface CityForestProp {
    id: string;
    cityId: string;
    pos: Pt;
    springTree: string;
    summerTree: string;
    autumnTree: string;
    winterTree: string;
    bushName: string;          // 伴生林下灌木/浆果丛（FORAGE_BUSH / UNDERBRUSH / BUSH_TREE_A）
    bushLib: 'SUCAI_NATURE' | 'SUCAI_RESOURCE';
    isBamboo: boolean;
    variant: number;
    scaleJitter: number;
}

interface CityLifeActor {
    id: string;
    cityId: string;
    cityPos: Pt;
    isAnimal: boolean;
    isSeaFishing: boolean;     // 是否为海上渔船 + 鱼群（严格在海中）
    fishResource: string;      // 海中伴生鱼群（DORADO_FISH / SALMON_FISH / TUNA_FISH / SHORE_FISH）
    groundResource?: string;   // 组合内采集物：果子／木材／矿石
    groundResourceLib?: 'SUCAI_RESOURCE' | 'SUCAI_NATURE';
    hasFarm?: boolean;         // 农夫组合带四季农田（旱田或水田）
    seasonalPlot?: SeasonalPlotKind; // 四季地皮套系：旱作农田 / 水稻田 / 游牧草场
    plotCells?: number[];            // 地皮实际铺了哪几块（PLOT_CELL_OFFSETS 下标，1~4 块）；只记在组合主人身上
    buildingResource?: string; // 组合内随机建筑：磨坊／牧栏／毡帐／小屋等
    lib: 'SUCAI' | 'SUCAI_ANIMAL';
    dir: string;
    homePos: Pt;               // 田间/牧场/林间/海上渔场劳作点
    gatePos: Pt;               // 靠近据点城门或近岸港湾的交接点（秋收搬运/渔船返港往返用）
    lastDrawPos: Pt;           // 最近一次绘制的实时坐标（供战火原地渐变倒下/沉没使用）
    facing: number;            // 0..7
    phase: number;
    slotIdx: number;           // 0..N-1
    winterActive: boolean;     // 冬季是否仍出勤
    viewAlpha: number;         // 视口可见度透明度 0..1
    peaceAlpha: number;        // 和平期季节出勤透明度 0..1
    actionAlpha: number;       // 换季动作切换淡入淡出系数 0..1
    damageBlend: number;       // 战火破坏渐变系数：0=和平劳作，1=战火被毁废墟/尸体/沉船
    recoveryYear?: number;     // 完全战毁后允许恢复的年份；仍须等到该年或更晚年份的春季
    combatStartSec: number;    // 本轮进入战火状态的起始秒数
    presentAtCombat: boolean;  // 本轮是否经历过战火；恢复完成后才复位
    inCombatVisual: boolean;   // 当前是否处于战争交叉渐变阶段
    peaceAtCombat: number;     // 本轮开战前的生产透明度，供再次开战时平滑接续
    damagePreset: WarDamagePreset;
    damageVariant: number;     // 破损贴图帧索引
    displayedAction: string;   // 当前正在淡入的动作名
    previousAction?: string;   // 换季时正在淡出的上一季动作
    desiredAction: string;     // 当前季节对应的目标动作名
}

const MIN_ZOOM = 9;
const MAX_ZOOM = 10;
const PANE_ZINDEX = 568;       // 高于陆地动物(560)/植被(565)，低于商队(570)/攻城底层军团(580)/据点(610)/主军团(620)
const VILLAGER_SCALE_BASE = 0.42;
const ANIMAL_SCALE_BASE = 0.48;
const SHIP_SCALE_BASE = 0.46;
const FISH_SCALE_BASE = 0.44;
const WRECK_SCALE_BASE = 0.44;
const HUNTING_TREE_BASE_PX = 27;
type SeasonalPlotKind = 'dry_farm' | 'rice_farm' | 'pasture';
const FARM_BY_SEASON = ['FARM_SPRING', 'FARM_SUMMER', 'FARM_AUTUMN', 'FARM_WINTER'] as const;
const RFARM_BY_SEASON = ['RFARM_SPRING', 'RFARM_SUMMER', 'RFARM_AUTUMN', 'RFARM_WINTER'] as const;
const PASTURE_BY_SEASON = ['PASTURE_SPRING', 'PASTURE_SUMMER', 'PASTURE_AUTUMN', 'PASTURE_WINTER'] as const;
const SEASONAL_PLOT_BY_KIND: Readonly<Record<SeasonalPlotKind, readonly [string, string, string, string]>> = {
    dry_farm: FARM_BY_SEASON,
    rice_farm: RFARM_BY_SEASON,
    pasture: PASTURE_BY_SEASON,
};
/** 农田 / 水田 / 草场最多 2×2 斜角四块（zoom 9 像素，相对四块中心）：0 北、1 西、2 东、3 南；平地够几块铺几块。
 *  草场一块一只牲畜、牧羊人站南块；农田一块一个农夫，南块那个是组合主人（建筑跟他走）。 */
const PLOT_CELL_OFFSETS: readonly (readonly [number, number])[] = [[0, -23], [-35, 0], [35, 0], [0, 23]];
const PLOT_LEADER_CELL = 3;
/** 牲畜在自己那块草场内来回的半程（zoom 9 像素），不出本块 */
const PASTURE_WANDER_PX = 9;
/** 农田 / 水田 / 草场整块地皮内允许的最大高差（米）；超过就是山地，不铺 */
const PLOT_MAX_RELIEF_M = 250;
/** 地皮选址最远半径（经度度数；纬度方向再 ×0.85 ≈ 0.9° ≈ 100 km） */
const PLOT_SEARCH_MAX_DEG = 1.05;
/** 两组地皮落点的最小间距椭圆半径（zoom 9 像素）：2×2 四块宽约 144、高约 102，外加边侧建筑 */
const PLOT_KEEPOUT_X = 170;
const PLOT_KEEPOUT_Y = 120;
const CULL_MARGIN_DEG = 0.5;
// 自动乱斗镜头一直跟着正在打的仗，半径过大会让画面里的据点永远处于战火态、看不到民生。
// 只把战场贴身（约 30 公里）内的据点算进去，被围城本身另由 siegeCityId 判定。
const COMBAT_HIDE_RADIUS_DEG = 0.3;
const FADE_TO_DAMAGE_SEC = 1.1;
/** 生产方式（农田、牧场、猎场、渔场等）出现时的渐显时长（秒） */
const PRODUCTION_FADE_IN_SEC = 1.5;
const FADE_RECOVER_PEACE_SEC = 2.4;
const SEASON_TRANSITION_SEC = 5;
const HUNT_CYCLE_SEC = 30;
const HUNT_DEATH_START_SEC = 10;
const HUNT_DECAY_START_SEC = 13;
const HUNT_CARRY_START_SEC = 23;
const HUNT_RETURN_START_SEC = 27;
const HUNT_NEXT_PREY_SEC = HUNT_RETURN_START_SEC;

/** 67 文化 → 生计配置表（注意：陆地列表不含渔夫，所有渔业一律在海中生成渔船与海鱼群） */
const LIVELIHOOD_SPECS: Record<LivelihoodCategory, LivelihoodSpec> = {
    farming_rice: {
        category: 'farming_rice',
        villagers: ['VIL_MALE_FARMER', 'VIL_FEMALE_FARMER'],
        animals: ['BUFFALO', 'GOOSE', 'CHICKEN'],
        winterRestAboveLat: 29,
    },
    farming_dry: {
        category: 'farming_dry',
        villagers: ['VIL_MALE_FARMER', 'VIL_FEMALE_FARMER'],
        animals: ['COW_BROWN', 'SHEEP', 'PIG'],
        winterRestAboveLat: 27,
    },
    nomadic_steppe: {
        category: 'nomadic_steppe',
        villagers: ['VIL_MALE_SHEPHERD'],
        animals: ['HORSE', 'SHEEP', 'GOAT'],
        winterRestAboveLat: 36,
    },
    nomadic_oasis: {
        category: 'nomadic_oasis',
        villagers: ['VIL_MALE_SHEPHERD'],
        animals: ['CAMEL', 'DROMEDARY', 'GOAT', 'HORSE'],
        winterRestAboveLat: 35,
    },
    highland_pastoral: {
        category: 'highland_pastoral',
        villagers: ['VIL_MALE_SHEPHERD'],
        animals: ['COW_BLACK', 'LLAMA', 'ALPACA', 'SHEEP'],
        winterRestAboveLat: 32,
    },
    forest_hunting: {
        category: 'forest_hunting',
        villagers: ['VIL_MALE_HUNTER'],
        animals: ['DEER', 'BOAR', 'TURKEY', 'GUANACO'],
        winterRestAboveLat: 90, // 渔猎民族支持冬猎踏雪
    },
    forest_logging: {
        category: 'forest_logging',
        villagers: ['VIL_MALE_LUMBERJACK'],
        animals: ['DEER', 'BOAR'],
        winterRestAboveLat: 90,
    },
    maritime_fishing: {
        category: 'maritime_fishing',
        villagers: ['VIL_MALE_FORAGER'], // 仅找不到海域时的陆上组合，绝不再改种田
        animals: ['CHICKEN', 'GOAT'],
        winterRestAboveLat: 48,
    },
    mining_foraging: {
        category: 'mining_foraging',
        villagers: ['VIL_MALE_MINER'],
        animals: ['GOAT', 'COW_BROWN'],
        winterRestAboveLat: 42,
    },
};

const CULTURE_TO_CATEGORY: Readonly<Record<string, LivelihoodCategory>> = {
    // 1. 农耕稻作与水网（12）—— 铺设 DE 水稻田四季图（rc2→rc3→rm1→rm2）
    JIANGNAN: 'farming_rice',
    HUGUANG: 'farming_rice',
    BASHU: 'farming_rice',      // 成都平原都江堰水田稻作区（「水旱从人，不知饥馑」）
    KOREA: 'farming_rice',      // 朝鲜半岛三南与汉江平原水田稻作（畓）
    VIETNAMESE: 'farming_rice',
    BENGALIS: 'farming_rice',
    BURMESE: 'farming_rice',
    KHMER: 'farming_rice',
    PURU: 'farming_rice',
    INDIA: 'farming_rice',
    MUGHAL: 'farming_rice',     // 恒河—亚穆纳河冲积平原季风漫灌稻作区
    DIANQIAN: 'farming_rice',   // 按史：滇黔坝子稻作与山地梯田农业，渔猎不作全域唯一主业

    // 2. 农耕旱作与庄园（25）—— 铺设 DE 旱作农田四季图（fc2→fc3→fm1→fm2）
    CENTRAL: 'farming_dry',
    WEI: 'farming_dry',
    FRANKS: 'farming_dry',
    BURGUNDIANS: 'farming_dry',
    BRITONS: 'farming_dry',
    EAST: 'farming_dry',
    SAXONS: 'farming_dry',
    GERMANIC: 'farming_dry',
    POLES: 'farming_dry',
    SLAVIC: 'farming_dry',
    BULGARIANS: 'farming_dry',
    MAGYAR: 'farming_dry',
    LATIN: 'farming_dry',
    ROMA: 'farming_dry',
    BYZANTINE: 'farming_dry',
    SPARTANS: 'farming_dry',
    GOTHS: 'farming_dry',       // 按史：哥特定居农牧社会，不按纯草原游牧处理
    THRACIAN: 'farming_dry',    // 按史：色雷斯平原农业与山地畜牧并存，不按纯游牧处理
    CELTS: 'farming_dry',       // 按史：凯尔特农业与畜牧为基础，山林渔猎不是全域唯一主业
    GEORGIANS: 'farming_dry',   // 按史：高加索谷地农业、葡萄种植与山地畜牧并存
    MUISCA: 'farming_dry',      // 按史：穆伊斯卡以玉米、马铃薯等高原农业为主，盐与祖母绿开采为副业
    MAYANS: 'farming_dry',      // 玛雅玉米、豆类与南瓜农业
    TUPI: 'farming_dry',        // 图皮木薯等林下轮作农业
    MAPUCHE: 'farming_dry',     // 马普切玉米、马铃薯等农业
    INCA: 'farming_dry',        // 印加梯田与高原农业

    // 3. 草原游牧（7）—— 铺设 DE 牧场四季图（pc2→pc3→pm1→pm2）
    MONGOL: 'nomadic_steppe',
    MOBEI_MONGOL: 'nomadic_steppe',
    YURT: 'nomadic_steppe',
    XIANBEI: 'nomadic_steppe',
    HUNS: 'nomadic_steppe',
    CUMAN: 'nomadic_steppe',
    TURKS: 'nomadic_steppe',

    // 4. 丝路绿洲与荒原驼牧（8）—— 铺设 DE 牧场四季图（pc2→pc3→pm1→pm2）
    KHITAN: 'nomadic_oasis',
    CENTRAL_ASIA: 'nomadic_oasis',
    WESTERN: 'nomadic_oasis',
    PERSIAN: 'nomadic_oasis',
    SASANIAN: 'nomadic_oasis',
    ORIE: 'nomadic_oasis',
    BERBER: 'nomadic_oasis',
    GURJARAS: 'nomadic_oasis',

    // 5. 雪域高原畜牧（1）—— 铺设 DE 牧场四季图（pc2→pc3→pm1→pm2）
    TIBET: 'highland_pastoral',

    // 6. 山林渔猎与伐木（4）；东北固定渔猎，北美非山地固定渔猎，伐木文化只在山地伐木。
    NORTHEAST: 'forest_hunting',
    VARANGIANS: 'forest_logging',
    AMERICA: 'forest_logging',
    LITHUANIANS: 'forest_logging',

    // 7. 海洋渔业与峡湾群岛（8）；只在找到真实海域时捕鱼，内陆恢复各文化农业。
    JAPAN: 'maritime_fishing',
    MALAY: 'maritime_fishing',
    VIKINGS: 'maritime_fishing',
    DANES: 'maritime_fishing',
    PORTUGUESE: 'maritime_fishing',
    GREECE: 'maritime_fishing',
    ATHENIANS: 'maritime_fishing',
    SICILIANS: 'maritime_fishing',

    // 8. 山地矿冶（6）；只在山地采矿，非山地恢复农业，不把特色矿业当成全域唯一主业。
    BOHEMIANS: 'mining_foraging',
    ARMENIANS: 'mining_foraging',
    AFRICA: 'mining_foraging',
    ETHIOPIANS: 'mining_foraging',
    SPANISH: 'mining_foraging',
    MACEDONIAN: 'mining_foraging',
};

/** 牧群按文化配种；每种组合仍固定三只，四畜种池按固定哈希起点连续取三只。 */
const PASTORAL_ANIMAL_POOLS: Readonly<Record<string, readonly string[]>> = {
    MONGOL: ['HORSE', 'SHEEP', 'GOAT'],
    MOBEI_MONGOL: ['HORSE', 'SHEEP', 'GOAT'],
    YURT: ['HORSE', 'SHEEP', 'GOAT'],
    XIANBEI: ['HORSE', 'SHEEP', 'GOAT'],
    HUNS: ['HORSE', 'SHEEP', 'GOAT'],
    CUMAN: ['HORSE', 'SHEEP', 'GOAT'],
    TURKS: ['HORSE', 'SHEEP', 'GOAT'],
    KHITAN: ['HORSE', 'SHEEP', 'GOAT', 'CAMEL'],
    CENTRAL_ASIA: ['CAMEL', 'HORSE', 'SHEEP', 'GOAT'],
    WESTERN: ['CAMEL', 'HORSE', 'SHEEP', 'GOAT'],
    PERSIAN: ['SHEEP', 'SHEEP', 'GOAT'],
    SASANIAN: ['SHEEP', 'SHEEP', 'GOAT'],
    ORIE: ['DROMEDARY', 'GOAT', 'SHEEP', 'HORSE'],
    BERBER: ['DROMEDARY', 'GOAT', 'SHEEP', 'HORSE'],
    GURJARAS: ['CAMEL', 'GOAT', 'SHEEP'],
    // DE 无独立牦牛素材，COW_BLACK 仅作高原牦牛视觉代理；不再把野生盘羊当家畜放牧。
    TIBET: ['COW_BLACK', 'SHEEP', 'GOAT', 'HORSE'],
};

function strHash01(s: string, salt: number): number {
    let h = (salt * 2654435761) | 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 1597334677);
    }
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

/**
 * 地图位移 → DE 八向精灵编号。DE 素材的 8 个方向（对着马 / 渔船 / 村民帧图逐个核过）：
 * 0 东北 · 1 东 · 2 东南 · 3 南（正对镜头）· 4 西南 · 5 西 · 6 西北 · 7 北（背对镜头）。
 * 与战术战场 Scene13WarLayer.dir8 同一套。纬度向北为屏幕上方、经度向东为屏幕右方。
 * 🔴 旧版把 0 当成南，整体偏 135°：往东走脸朝西北，猎人搬肉时看起来倒着走。
 */
function dirFromDelta(dLat: number, dLng: number): number {
    const deg = ((Math.atan2(dLat, dLng) * 180) / Math.PI + 360) % 360;   // 0 东、90 北
    return (((1 - Math.round(deg / 45)) % 8) + 8) % 8;
}

/** 根据渔猎民族文化与纬度返回四季对应的树种组合 [春, 夏, 秋, 冬] 与伴生灌木 */
function pickHuntingForestPalette(style: string, lat: number, idx: number): {
    springTree: string;
    summerTree: string;
    autumnTree: string;
    winterTree: string;
    bushName: string;
    bushLib: 'SUCAI_NATURE' | 'SUCAI_RESOURCE';
    isBamboo: boolean;
} {
    if (style === 'DIANQIAN') {
        const bamboo = idx % 2 === 0;
        return {
            springTree: bamboo ? 'LUSH_BAMBOO' : 'ASIAN_MAPLE_GREEN',
            summerTree: bamboo ? 'LUSH_BAMBOO' : 'GREEN_OAK',
            autumnTree: bamboo ? 'LUSH_BAMBOO' : 'ASIAN_MAPLE_AUTUMN',
            winterTree: bamboo ? 'BAMBOO' : 'ASIAN_PINE',
            bushName: idx % 3 === 0 ? 'FORAGE_BUSH' : 'UNDERBRUSH_JUNGLE',
            bushLib: idx % 3 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: bamboo,
        };
    }
    if (style === 'TUPI' || style === 'MAYANS') {
        const trees = ['RAINFOREST', 'BRAZILWOOD', 'MANGROVE', 'PALM'];
        const t = trees[idx % trees.length];
        return {
            springTree: t,
            summerTree: t,
            autumnTree: t,
            winterTree: t,
            bushName: idx % 2 === 0 ? 'FORAGE_PAPAYA' : 'UNDERBRUSH_JUNGLE',
            bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: false,
        };
    }
    if (style === 'MAPUCHE') {
        const araucaria = idx % 2 === 0;
        return {
            springTree: araucaria ? 'MONKEY_PUZZLE' : 'GREEN_OAK',
            summerTree: araucaria ? 'MONKEY_PUZZLE' : 'PINE',
            autumnTree: araucaria ? 'MONKEY_PUZZLE' : 'AUTUMN_OAK',
            winterTree: araucaria ? 'MONKEY_PUZZLE' : (Math.abs(lat) > 36 ? 'SNOW_PINE' : 'PINE'),
            bushName: idx % 2 === 0 ? 'FORAGE_BUSH' : 'BUSH_TREE_A',
            bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: false,
        };
    }
    if (style === 'NORTHEAST' || style === 'VARANGIANS') {
        const pine = idx % 2 === 0;
        const mainPine = style === 'NORTHEAST' ? 'ASIAN_PINE' : 'PINE';
        return {
            springTree: pine ? mainPine : 'BIRCH_GREEN',
            summerTree: pine ? mainPine : 'BIRCH_GREEN',
            autumnTree: pine ? mainPine : 'BIRCH_AUTUMN',
            winterTree: pine ? 'SNOW_PINE' : 'SNOW_AUTUMN_OAK',
            bushName: idx % 2 === 0 ? 'FORAGE_BUSH' : 'UNDERBRUSH',
            bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
            isBamboo: false,
        };
    }
    // AMERICA / GEORGIANS 等温带山林渔猎
    const isPine = idx % 3 === 0;
    const cold = Math.abs(lat) > 38;
    return {
        springTree: isPine ? 'PINE' : 'GREEN_OAK',
        summerTree: isPine ? 'PINE' : 'GREEN_OAK',
        autumnTree: isPine ? 'PINE' : 'AUTUMN_OAK',
        winterTree: isPine ? (cold ? 'SNOW_PINE' : 'PINE') : (cold ? 'SNOW_AUTUMN_OAK' : 'AUTUMN_OAK'),
        bushName: idx % 2 === 0 ? 'FORAGE_BUSH' : 'BUSH_TREE_A',
        bushLib: idx % 2 === 0 ? 'SUCAI_RESOURCE' : 'SUCAI_NATURE',
        isBamboo: false,
    };
}

export class CityLifeAmbientLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private running = false;
    private lastTime = 0;
    private nowMs = 0;
    private assets = new Map<string, SpriteSheetAsset>();
    private stripAssets = new Map<string, StripStaticAsset>();
    private actorsByCity = new Map<string, CityLifeActor[]>();
    /** 本次生成某据点时，有地皮因高程瓦片未到而被拒（见 isPlotCellFlatLand） */
    private plotElevPending = false;
    /** 已定案的所有地皮（农田 / 水田 / 草场）的 zoom 9 像素落点，新地皮不许与之重叠 */
    private placedPlots: { x: number; y: number }[] = [];
    private forestByCity = new Map<string, CityForestProp[]>();
    private categoryByCity = new Map<string, LivelihoodCategory>();
    private activeActors = new Map<string, CityLifeActor>();
    private endangeredCities = new Set<string>();
    private lastCombatScanMs = 0;
    private clearedWhileHidden = false;
    private layerVisible = true;
    private layoutDirty = false;
    private lastLayoutRebuildMs = 0;

    private static readonly ASSET_BUDGET_BYTES = 64 * 1024 * 1024;

    constructor(map: L.Map) {
        this.map = map;
        let pane = map.getPane('cityLifePane');
        if (!pane) {
            pane = map.createPane('cityLifePane');
            pane.style.zIndex = String(PANE_ZINDEX);
            pane.style.pointerEvents = 'none';
        }
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'leaflet-zoom-animated';
        this.canvas.style.pointerEvents = 'none';
        pane.appendChild(this.canvas);
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('CityLifeAmbientLayer: 2d context unavailable');
        this.ctx = ctx;

        this.resize();
        map.on('resize', () => this.resize());
        map.on('move zoom viewreset moveend zoomend', () => this.reposition());

        // 陆海瓦片加载完成后要重算海中渔场与陆地落点。该事件实测每秒几十次，
        // 直接清空会让角色每帧重建、透明度归零而永远显示不出来，所以只打标记，由 update 节流重排。
        window.addEventListener('land-sea-tiles-updated', () => {
            this.layoutDirty = true;
        });
    }

    private resize(): void {
        const s = this.map.getSize();
        this.canvas.width = s.x;
        this.canvas.height = s.y;
        this.reposition();
    }

    private reposition(): void {
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }

    public stop(): void {
        this.running = false;
    }

    public setVisible(v: boolean): void {
        this.layerVisible = v;
        this.canvas.style.display = v ? 'block' : 'none';
    }

    public debugAssetCount(): number {
        return this.assets.size + this.stripAssets.size;
    }

    public debugAssetBytes(): number {
        let b = 0;
        for (const a of this.assets.values()) {
            for (const im of a.sheets) {
                if (im) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            }
        }
        for (const st of this.stripAssets.values()) {
            if (st.sheet) b += (st.sheet.naturalWidth || 0) * (st.sheet.naturalHeight || 0) * 4;
        }
        return b;
    }

    private getSeason(): number {
        const s = (window as any).game?.timeSystem?.getSeason?.();
        return typeof s === 'number' && s >= 0 && s <= 3 ? s : 0;
    }

    private getYear(): number {
        const year = (window as any).game?.timeSystem?.getYear?.();
        return typeof year === 'number' && Number.isFinite(year) ? year : 0;
    }

    /** 每季 15 秒，季末最后 5 秒平滑进入下一季；smoothstep 让起手与收尾更柔。 */
    private getSeasonBlend(): number {
        const remaining = (window as any).game?.timeSystem?.getTimeToNextSeason?.();
        if (typeof remaining !== 'number' || !Number.isFinite(remaining)) return 0;
        const t = Math.min(1, Math.max(0, (SEASON_TRANSITION_SEC - Math.max(0, remaining)) / SEASON_TRANSITION_SEC));
        return t * t * (3 - 2 * t);
    }

    private isHiddenNow(): boolean {
        if (!this.layerVisible) return true;
        // scene13War 在自动乱斗时也会短暂激活；只有真正进入 13 战术画面才遮挡战略民生层。
        const tacticalCovered = this.map.getZoom() >= 13 && (
            (window as any).game?.scene13War?.isActive?.() === true
            || (window as any).game?.battleScene?.isLingering?.() === true
        );
        if (tacticalCovered) return true;
        // 开局地图尚未 setView 时 getZoom() 为 NaN，getBounds() 会抛错，此时先当作隐藏。
        if (!(this.map as any)._loaded) return true;
        const s = this.map.getSize();
        if (s.x === 0 || s.y === 0) return true;
        const z = Math.round(this.map.getZoom());
        if (!Number.isFinite(z)) return true;
        return z < MIN_ZOOM || z > MAX_ZOOM;
    }

    private isSea(pos: Pt): boolean {
        try {
            return LandSeaSystem.isSeaAt(pos);
        } catch {
            return false;
        }
    }

    /** 所有据点都要等中心与近岸海陆采样完成，不能把“瓦片未到”误当成陆地并永久锁定农业或把地皮落进海里。 */
    private hasPendingLandSeaAround(cLat: number, cLng: number): boolean {
        for (const radius of [0, 0.20, 0.40, 0.64]) {
            const steps = radius === 0 ? 1 : 8;
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                try {
                    const kind = LandSeaSystem.probeLandSea(
                        cLat + Math.sin(angle) * radius,
                        cLng + Math.cos(angle) * radius
                    );
                    if (kind === 'pending') {
                        this.isSea({ lat: cLat + Math.sin(angle) * radius, lng: cLng + Math.cos(angle) * radius });   // 顺手催拉瓦片
                        return true;
                    }
                } catch {
                    return true;
                }
            }
        }
        return false;
    }

    /** 中心与近郊任一已加载采样点为山地即成立；全部未加载时返回 null，避免把未知当平原。 */
    private isMountainArea(cLat: number, cLng: number): boolean | null {
        let hasKnownLand = false;
        for (let i = 0; i < 9; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = i === 0 ? 0 : 0.18;
            try {
                const kind = LandTerrainSystem.classifyAt({
                    lat: cLat + Math.sin(angle) * radius,
                    lng: cLng + Math.cos(angle) * radius,
                });
                if (kind === 'mountain') return true;
                if (kind === 'plain') hasKnownLand = true;
            } catch {
                // 地形瓦片未准备好时等待后续帧，不据此改变据点生产。
            }
        }
        return hasKnownLand ? false : null;
    }

    /** 文化限定可选主业，地理只在首次成功判定时选定；之后永久锁定，不因瓦片重排改变。 */
    private resolveCityCategory(city: CityDataV2): LivelihoodCategory | null {
        const cached = this.categoryByCity.get(city.id);
        if (cached) return cached;

        const style: BuildingStyle = city.buildingStyle ?? 'CENTRAL';
        const base = CULTURE_TO_CATEGORY[style] ?? 'farming_dry';
        if (base !== 'forest_logging' && base !== 'mining_foraging') {
            this.categoryByCity.set(city.id, base);
            return base;
        }

        const mountain = this.isMountainArea(city.lat, city.lng);
        if (mountain === null) return null;
        const resolved = mountain
            ? base
            : base === 'forest_logging'
                ? (style === 'AMERICA' ? 'forest_hunting' : 'farming_dry')
                : 'farming_dry';
        this.categoryByCity.set(city.id, resolved);
        return resolved;
    }

    /**
     * 地皮选址：返回 pos 处能铺的地皮块号。农田 / 水田 / 草场都最多 2×2 四块，
     * 主人所在的南块必须能铺，其余三块各自判、能铺几块铺几块（平原多半四块，山谷常常只剩一两块）。
     */
    private plotCellsAt(pos: Pt): number[] {
        const p = this.map.project([pos.lat, pos.lng], 9);
        const s = PLOT_CELL_OFFSETS[PLOT_LEADER_CELL];
        if (!this.isPlotCellFlatLand(p.x, p.y)) return [];
        const cells: number[] = [];
        PLOT_CELL_OFFSETS.forEach(([ox, oy], k) => {
            if (k === PLOT_LEADER_CELL || this.isPlotCellFlatLand(p.x + ox - s[0], p.y + oy - s[1])) cells.push(k);
        });
        return cells;
    }

    /**
     * 一块地皮（zoom 9 像素中心 x,y）按画出来的菱形撒点：不碰海、不碰湖河、块内高差不超过阈值。
     * 高差超了就是压在山脊上，会把山形盖成一片平绿。
     */
    private plotPx(pos: Pt): { x: number; y: number } {
        const p = this.map.project([pos.lat, pos.lng], 9);
        return { x: p.x, y: p.y };
    }

    /**
     * 整组地皮（2×2 四块 + 外侧建筑）占约 ±150×±100 个 zoom 9 像素；两组落点落在对方这个椭圆内就算重叠。
     * 同时对照全局已定案的地皮和本据点刚放的地皮。
     */
    private plotOverlaps(pos: Pt, extra: { x: number; y: number }[]): boolean {
        const q = this.plotPx(pos);
        for (const list of [this.placedPlots, extra]) {
            for (const o of list) {
                const dx = (q.x - o.x) / PLOT_KEEPOUT_X;
                const dy = (q.y - o.y) / PLOT_KEEPOUT_Y;
                if (dx * dx + dy * dy < 1) return true;
            }
        }
        return false;
    }

    private isPlotCellFlatLand(x: number, y: number): boolean {
        // 128×96 贴图 0.58 缩放后的半宽 / 半高，绘制时整体下移 4 像素
        const hw = 128 * 0.58 / 2;
        const hh = 96 * 0.58 / 2;
        let minElev = Infinity;
        let maxElev = -Infinity;
        for (let gx = -2; gx <= 2; gx++) {
            for (let gy = -2; gy <= 2; gy++) {
                if (Math.abs(gx) + Math.abs(gy) > 2) continue;
                const ll = this.map.unproject([x + gx / 2 * hw, y + 4 + gy / 2 * hh], 9);
                if (this.isSea({ lat: ll.lat, lng: ll.lng })) return false;
                // 内陆湖、河也不许压：掩膜说是水就算
                if (LandSeaSystem.getWaterSampler().isWaterSync(ll.lat, ll.lng) === true) return false;
                const elev = LandSeaSystem.getElevationSync(ll.lat, ll.lng);
                if (elev === null) {
                    // 高程没到：本据点这次先不定案（不入缓存），拉到瓦片再判，免得「不知道」被当成平地
                    LandSeaSystem.getSampler().scheduleFetch(ll.lat, ll.lng);
                    this.plotElevPending = true;
                    return false;
                }
                if (elev < minElev) minElev = elev;
                if (elev > maxElev) maxElev = elev;
            }
        }
        return maxElev - minElev <= PLOT_MAX_RELIEF_M;
    }

    private isFarmFullyOnLand(pos: Pt): boolean {
        if (this.isSea(pos)) return false;
        // 128×96 贴图在 0.58 缩放下的半宽／半高，额外留一点柔边余量。
        const radiusLng = 0.108;
        const radiusLat = 0.082;
        for (const [ring, steps] of [[0.5, 8], [1, 16]] as const) {
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                if (this.isSea({
                    lat: pos.lat + Math.sin(angle) * radiusLat * ring,
                    lng: pos.lng + Math.cos(angle) * radiusLng * ring,
                })) return false;
            }
        }
        return true;
    }

    /** 严格判定某点处于真实海域（中心点及周围至少 3 个邻点均为海，防止渔船搁浅在岸线陆地上） */
    private isDeepEnoughSea(pos: Pt): boolean {
        if (!this.isSea(pos)) return false;
        const d = 0.024;
        let seaCount = 0;
        if (this.isSea({ lat: pos.lat + d, lng: pos.lng })) seaCount++;
        if (this.isSea({ lat: pos.lat - d, lng: pos.lng })) seaCount++;
        if (this.isSea({ lat: pos.lat, lng: pos.lng + d })) seaCount++;
        if (this.isSea({ lat: pos.lat, lng: pos.lng - d })) seaCount++;
        return seaCount >= 3;
    }

    /** 在据点周边搜寻真实海域渔场点（0.10° ~ 0.68°），并同时返回近岸港湾海域点（全在海中） */
    private findSeaFishingSpot(cLat: number, cLng: number, baseAngle: number, distBias: number): { homePos: Pt; gatePos: Pt } | null {
        const radii = [0.14, 0.20, 0.27, 0.35, 0.44, 0.54, 0.64];
        const angleSteps = 20;
        for (const r of radii) {
            const actualR = r + distBias * 0.05;
            for (let step = 0; step < angleSteps; step++) {
                const offset = (step % 2 === 0 ? 1 : -1) * Math.ceil(step / 2) * ((Math.PI * 2) / angleSteps);
                const ang = baseAngle + offset;
                const cand: Pt = {
                    lat: cLat + Math.sin(ang) * actualR * 0.85,
                    lng: cLng + Math.cos(ang) * actualR,
                };
                if (this.isDeepEnoughSea(cand)) {
                    // 寻找从外海渔场朝据点方向推进的近岸港湾海域点（同样必须在海中）
                    let gatePos = cand;
                    for (const f of [0.55, 0.68, 0.80]) {
                        const nearCand = {
                            lat: cLat + (cand.lat - cLat) * f,
                            lng: cLng + (cand.lng - cLng) * f,
                        };
                        if (this.isSea(nearCand)) {
                            gatePos = nearCand;
                            break;
                        }
                    }
                    return { homePos: cand, gatePos };
                }
            }
        }
        return null;
    }

    /** 树林由文化固定：渔猎／伐木据点始终有，其他文化即使靠近山地也不临时追加。 */
    private getOrCreateCityForest(city: CityDataV2): CityForestProp[] {
        let list = this.forestByCity.get(city.id);
        if (list) return list;
        list = [];

        const style: BuildingStyle = city.buildingStyle ?? 'CENTRAL';
        const cat = this.resolveCityCategory(city);
        if (cat === null) return list;
        if (cat !== 'forest_hunting' && cat !== 'forest_logging') {
            this.forestByCity.set(city.id, list);
            return list;
        }

        const cLat = city.lat;
        const cLng = city.lng;
        const groveCount = 9; // 环绕据点生成 9 簇高低错落的四季树木与灌丛

        for (let i = 0; i < groveCount; i++) {
            const h1 = strHash01(city.id, i * 31 + 101);
            const h2 = strHash01(city.id, i * 31 + 102);
            const h3 = strHash01(city.id, i * 31 + 103);

            const baseAngle = (i / groveCount) * Math.PI * 2 + (h1 - 0.5) * 0.45;
            // 打猎与伐木分开：猎场移到远处外围，伐木林场仍环绕山地据点。
            const distDeg = cat === 'forest_hunting' ? 0.38 + h2 * 0.10 : 0.095 + h2 * 0.165;
            let pos: Pt | null = null;
            for (let attempt = 0; attempt < 8; attempt++) {
                const ang = baseAngle + attempt * (Math.PI / 4);
                const cand = {
                    lat: cLat + Math.sin(ang) * distDeg * 0.85,
                    lng: cLng + Math.cos(ang) * distDeg,
                };
                const validLand = cat === 'forest_hunting' ? this.isFarmFullyOnLand(cand) : !this.isSea(cand);
                if (validLand) {
                    pos = cand;
                    break;
                }
            }
            if (!pos) continue;

            const pal = pickHuntingForestPalette(style, cLat, i);
            list.push({
                id: `${city.id}_forest_${i}`,
                cityId: city.id,
                pos,
                springTree: pal.springTree,
                summerTree: pal.summerTree,
                autumnTree: pal.autumnTree,
                winterTree: pal.winterTree,
                bushName: pal.bushName,
                bushLib: pal.bushLib,
                isBamboo: pal.isBamboo,
                variant: Math.floor(h3 * 100),
                scaleJitter: 0.86 + h1 * 0.30,
            });
        }

        this.forestByCity.set(city.id, list);
        return list;
    }

    /** 按城级生成 1~4 套民生组合；固定约一半据点显示，险要不生成。 */
    private getOrCreateCityActors(city: CityDataV2): CityLifeActor[] {
        let list = this.actorsByCity.get(city.id);
        if (list) return list;
        list = [];
        this.plotElevPending = false;

        const cityType = String(city.type);
        const isPass = cityType === 'pass' || cityType === 'Pass';
        const maxSlots = cityType === 'big_city' ? 4
            : cityType === 'medium_city' ? 3
                : cityType === 'small_city' ? 2
                    : cityType === 'stockade' ? 1
                        : 0;
        // 同一据点永远保持同一显示结果与套数，不因视口移动、陆海瓦片重排而重掷。
        if (isPass || maxSlots === 0 || strHash01(city.id, 501) >= 0.5) {
            this.actorsByCity.set(city.id, list);
            return list;
        }
        const totalSlots = maxSlots === 1 ? 1 : 1 + Math.floor(strHash01(city.id, 502) * maxSlots);

        const style: BuildingStyle = city.buildingStyle ?? 'CENTRAL';
        const cat = this.resolveCityCategory(city);
        if (cat === null) return list;
        // 海陆瓦片没到时一律先不生成（不入缓存，下一帧再来），否则「未到」按陆处理，农田草场会永久落进海里。
        if (this.hasPendingLandSeaAround(city.lat, city.lng)) return list;
        // 海洋文化只有找到真实海域才捕鱼；内陆据点按史固定为稻作或旱作，不再退化成采果子。
        const landCat: LivelihoodCategory = cat === 'maritime_fishing'
            ? (style === 'JAPAN' || style === 'MALAY' ? 'farming_rice' : 'farming_dry')
            : cat;
        const spec = LIVELIHOOD_SPECS[landCat];
        const villagerPool = spec.villagers;

        let animalPool = spec.animals;
        if (style === 'INCA') animalPool = ['LLAMA', 'ALPACA'];
        else if (style === 'MAPUCHE') animalPool = ['GUANACO', 'HORSE'];
        else if (style === 'AMERICA' || style === 'MAYANS' || style === 'TUPI') animalPool = ['TURKEY', 'DEER'];

        const cLat = city.lat;
        const cLng = city.lng;
        const isColdWinter = Math.abs(cLat) >= LIVELIHOOD_SPECS[cat].winterRestAboveLat;
        const deStyle = resolveCityDeBuildingStyle(city.id, city.type, city.region, cLat, cLng, city.buildingStyle);

        const villagerPresets: WarDamagePreset[] = [
            'corpse_and_fence',
            'broken_cart_and_bones',
            'rubble_and_corpse',
        ];
        const fishPool = Math.abs(cLat) > 42
            ? ['SALMON_FISH', 'SHORE_FISH', 'TUNA_FISH']
            : ['DORADO_FISH', 'TUNA_FISH', 'SHORE_FISH', 'SALMON_FISH'];

        // 树林只跟随已经固定为渔猎／伐木的据点，其他文化即使靠近山地也不临时追加。
        const forestNodes = landCat === 'forest_hunting' || landCat === 'forest_logging' ? this.getOrCreateCityForest(city) : [];

        const newPlots: { x: number; y: number }[] = [];   // 本据点这次新放的地皮（提交时才进全局登记）
        for (let i = 0; i < totalSlots; i++) {
            const h2 = strHash01(city.id, i * 17 + 2);
            const h3 = strHash01(city.id, i * 17 + 3);
            const h4 = strHash01(city.id, i * 17 + 4);

            const baseAngle = (i / totalSlots) * Math.PI * 2 + (h3 - 0.5) * 0.7;

            // 海洋文化同城各套都捕鱼；若附近完全没有海域，整城统一回落农业，绝不混搭。
            const wantsSeaFishing = !isPass && cat === 'maritime_fishing';

            if (wantsSeaFishing) {
                const seaSpot = this.findSeaFishingSpot(cLat, cLng, baseAngle, h4);
                if (seaSpot) {
                    const facing = Math.floor(strHash01(city.id, i * 17 + 5) * 8) % 8;
                    const phase = Math.floor(strHash01(city.id, i * 17 + 6) * 1000);
                    const damageVariant = Math.floor(strHash01(city.id, i * 17 + 7) * 100);
                    const fishResource = fishPool[Math.floor(h2 * fishPool.length) % fishPool.length];
                    const winterActive = !isColdWinter || i === 0;
                    // 船坞只随机出现在部分渔业组合；样式跟随文化，位置固定在近岸港湾。
                    const buildingResource = strHash01(city.id, i * 17 + 301) < 0.38
                        ? `${deStyle && deStyle !== 'YURT' ? deStyle : 'WEST'}_DOCK_AGE2`
                        : undefined;

                    list.push({
                        id: `${city.id}_life_${i}`,
                        cityId: city.id,
                        cityPos: { lat: cLat, lng: cLng },
                        isAnimal: false,
                        isSeaFishing: true,
                        fishResource,
                        buildingResource,
                        lib: 'SUCAI',
                        dir: 'SHP_FISHING_SHIP',
                        homePos: seaSpot.homePos,
                        gatePos: seaSpot.gatePos,
                        lastDrawPos: { lat: seaSpot.homePos.lat, lng: seaSpot.homePos.lng },
                        facing,
                        phase,
                        slotIdx: i,
                        winterActive,
                        viewAlpha: 1,
                        peaceAlpha: 1,
                        actionAlpha: 1,
                        damageBlend: 0,
                        combatStartSec: 0,
                        presentAtCombat: false,
                        inCombatVisual: false,
                        peaceAtCombat: 1,
                        damagePreset: 'sea_shipwreck',
                        damageVariant,
                        displayedAction: 'work',
                        desiredAction: 'work',
                    });
                    continue;
                }
                // 沿海城市个别角度找不到渔场时宁可少一套，也不混入另一种生产。
                continue;
            }

            // 同一文化只从同一种生产工种中选择；农夫的男女差异不改变生产类型。
            const dir = villagerPool[Math.floor(h2 * villagerPool.length) % villagerPool.length];
            const isFarmer = dir === 'VIL_MALE_FARMER' || dir === 'VIL_FEMALE_FARMER';
            const isPastoral = dir === 'VIL_MALE_SHEPHERD';
            const isHunter = dir === 'VIL_MALE_HUNTER';
            const plotKind: SeasonalPlotKind | undefined = isFarmer ? (landCat === 'farming_rice' ? 'rice_farm' : 'dry_farm') : isPastoral ? 'pasture' : undefined;

            let homePos: Pt | null = null;
            let plotCells: number[] | undefined;
            // 有地皮的组合：在所有候选点里取能铺块数最多的；满四块即可提前停。
            const maxCells = PLOT_CELL_OFFSETS.length;
            const tryPlot = (cand: Pt): boolean => {
                // 平地少的地方（沙漠绿洲、山谷）各组会抢同一块：与已放好的地皮重叠的候选一律作废，继续往外找
                if (this.plotOverlaps(cand, newPlots)) return false;
                const cells = this.plotCellsAt(cand);
                if (cells.length > (plotCells?.length ?? 0)) {
                    homePos = cand;
                    plotCells = cells;
                }
                return cells.length >= maxCells;
            };
            // 林间工种围绕树林；农田、猎场与牧场都放到外围，避免压住据点。
            if (!isFarmer && forestNodes.length > 0) {
                const fn = forestNodes[(i * 2) % forestNodes.length];
                const cand = {
                    lat: fn.pos.lat + (h3 - 0.5) * 0.022,
                    lng: fn.pos.lng + (h4 - 0.5) * 0.026,
                };
                if (isPastoral) {
                    tryPlot(cand);
                } else if (isHunter ? this.isFarmFullyOnLand(cand) : !this.isSea(cand)) {
                    homePos = cand;
                }
            }

            if (!homePos || (plotKind && (plotCells?.length ?? 0) < maxCells)) {
                const distDeg = isPastoral || isHunter ? 0.38 + h4 * 0.10 : isFarmer ? 0.30 + h4 * 0.10 : 0.14 + h4 * 0.11;
                // 有地皮的组合要找平地：由近到远八方向逐圈找，最远到据点周围约 100 km
                // （据点间距 >40 km 且只有一半据点放民生，100 km 内找平地不会挤到别家）。
                const rings = plotKind
                    ? [...new Set([distDeg * 0.75, distDeg, distDeg * 1.3, 0.75, 0.9, PLOT_SEARCH_MAX_DEG])]
                        .filter((d) => d <= PLOT_SEARCH_MAX_DEG).sort((a, b) => a - b)
                    : [distDeg];
                for (let attempt = 0; attempt < 8 * rings.length; attempt++) {
                    const ang = baseAngle + attempt * (Math.PI / 4);
                    const d = rings[Math.floor(attempt / 8)];
                    const cand = {
                        lat: cLat + Math.sin(ang) * d * 0.85,
                        lng: cLng + Math.cos(ang) * d,
                    };
                    if (plotKind) {
                        if (tryPlot(cand)) break;
                    } else if (isHunter ? this.isFarmFullyOnLand(cand) : !this.isSea(cand)) {
                        homePos = cand;
                        break;
                    }
                }
            }
            if (!homePos) continue;
            if (plotKind) newPlots.push(this.plotPx(homePos));

            // 猎人只在猎场旁短距离搬运，交接点保持在已验收的陆上范围内，不跨海回城。
            const gatePos = isHunter ? {
                lat: homePos.lat + (cLat - homePos.lat) * 0.15,
                lng: homePos.lng + (cLng - homePos.lng) * 0.15,
            } : {
                lat: cLat + (homePos.lat - cLat) * 0.38,
                lng: cLng + (homePos.lng - cLng) * 0.38,
            };

            const facing = Math.floor(strHash01(city.id, i * 17 + 5) * 8) % 8;
            const phase = Math.floor(strHash01(city.id, i * 17 + 6) * 1000);
            const damageVariant = Math.floor(strHash01(city.id, i * 17 + 7) * 100);
            const winterActive = !isColdWinter || dir === 'VIL_MALE_LUMBERJACK' || dir === 'VIL_MALE_HUNTER' || i === 0;

            let groundResource: string | undefined;
            let groundResourceLib: 'SUCAI_RESOURCE' | 'SUCAI_NATURE' | undefined;
            if (dir === 'VIL_MALE_FORAGER') {
                groundResource = ['TUPI', 'MAYANS', 'AFRICA', 'MUISCA'].includes(style) ? 'FORAGE_PAPAYA' : 'FORAGE_BUSH';
                groundResourceLib = 'SUCAI_RESOURCE';
            } else if (dir === 'VIL_MALE_LUMBERJACK') {
                groundResource = 'FELLED_GENERIC';
                groundResourceLib = 'SUCAI_NATURE';
            } else if (dir === 'VIL_MALE_MINER') {
                groundResource = h3 < 0.5 ? 'GOLD_MINE' : 'STONE_MINE';
                groundResourceLib = 'SUCAI_RESOURCE';
            }

            // 建筑与组合绑定，使用据点与槽位的固定哈希：重排地图不会随机闪换。
            let buildingResource: string | undefined;
            const buildingRoll = strHash01(city.id, i * 17 + 301);
            const buildingVariant = Math.floor(strHash01(city.id, i * 17 + 302) * 4);
            if (buildingRoll < (isFarmer ? 0.55 : 0.38)) {
                if (isFarmer) {
                    if (buildingVariant < 2) {
                        const millAge = buildingVariant % 2 === 0 ? 2 : 3;
                        buildingResource = deStyle && deStyle !== 'YURT'
                            ? `${deStyle}_MILL_AGE${millAge}`
                            : 'DARK_MILL_AGE1';
                    } else {
                        buildingResource = buildingVariant === 2 ? 'HUT_A' : 'DARK_HOUSE_AGE1';
                    }
                } else if (dir === 'VIL_MALE_SHEPHERD') {
                    buildingResource = ['DARK_PASTURE', 'YURT_A', 'YURT_B', 'YURT_C'][buildingVariant];
                } else if (dir === 'VIL_MALE_LUMBERJACK') {
                    buildingResource = buildingVariant % 2 === 0 ? 'GREEK_LUMBER_CAMP_AGE2' : 'THRACIAN_LUMBER_CAMP_AGE2';
                } else if (dir === 'VIL_MALE_HUNTER' || dir === 'VIL_MALE_FORAGER') {
                    buildingResource = ['HUT_A', 'HUT_B', 'HUT_C'][buildingVariant % 3];
                } else if (dir === 'VIL_MALE_MINER') {
                    buildingResource = buildingVariant % 2 === 0 ? 'HUT_D' : 'DARK_HOUSE_AGE1';
                }
            }

            list.push({
                id: `${city.id}_life_${i}`,
                cityId: city.id,
                cityPos: { lat: cLat, lng: cLng },
                isAnimal: false,
                isSeaFishing: false,
                fishResource: '',
                groundResource,
                groundResourceLib,
                hasFarm: isFarmer,
                seasonalPlot: plotKind,
                plotCells,
                buildingResource,
                lib: 'SUCAI',
                dir,
                homePos,
                gatePos,
                lastDrawPos: { lat: homePos.lat, lng: homePos.lng },
                facing,
                phase,
                slotIdx: i,
                winterActive,
                viewAlpha: 1,
                peaceAlpha: 1,
                actionAlpha: 1,
                damageBlend: 0,
                combatStartSec: 0,
                presentAtCombat: false,
                inCombatVisual: false,
                peaceAtCombat: 1,
                damagePreset: villagerPresets[i % villagerPresets.length],
                damageVariant,
                displayedAction: 'work',
                desiredAction: 'work',
            });

            // 农田一块一个农夫：南块是组合主人（地皮、建筑都记在他身上），其余几块各补一个只种地的农夫。
            if (isFarmer && plotCells) {
                const owner = list[list.length - 1];
                for (const k of plotCells) {
                    if (k === PLOT_LEADER_CELL) continue;
                    const pos = this.plotCellPos(owner.homePos, k, 0, 0);
                    list.push({
                        ...owner,
                        id: `${owner.id}_field_${k}`,
                        groundResource: undefined,
                        groundResourceLib: undefined,
                        hasFarm: false,
                        seasonalPlot: undefined,
                        plotCells: undefined,
                        buildingResource: undefined,
                        homePos: pos,
                        gatePos: { ...pos },
                        lastDrawPos: { ...pos },
                        facing: (facing + k * 3) % 8,
                        phase: phase + k * 137,
                    });
                }
            }
        }

        if (cat === 'maritime_fishing' && list.length === 0) {
            // 确认附近没有可用渔场后，整城固定回落到该文化的农业，后续重排也不再改换。
            this.categoryByCity.set(city.id, landCat);
            return this.getOrCreateCityActors(city);
        }

        // 民生组合：1 个牧羊人固定带 4 只牲畜（四块草场一块一只）；1 个猎人固定带 1 只本地猎物。
        // 动物只在组合中央的两侧小范围真实往返，不与主人分散到据点不同位置。
        const preyPool = animalPool.filter((dir) => ['DEER', 'BOAR', 'TURKEY', 'GUANACO'].includes(dir));
        const groupLeaders = list.filter((actor) => actor.dir === 'VIL_MALE_SHEPHERD' || actor.dir === 'VIL_MALE_HUNTER');
        for (const leader of groupLeaders) {
            const isShepherd = leader.dir === 'VIL_MALE_SHEPHERD';
            // 牧羊组合草场实际铺了几块就放几只，一块一只；牧羊人所在的南块也放一只陪着他。
            const cellList = isShepherd ? (leader.plotCells ?? [PLOT_LEADER_CELL]) : [0];
            const pastoralPool = PASTORAL_ANIMAL_POOLS[style] ?? LIVELIHOOD_SPECS[cat].animals;
            const pastoralOffset = Math.floor(strHash01(leader.id, 206) * pastoralPool.length) % pastoralPool.length;
            for (const j of cellList) {
                let homePos: Pt | null = null;
                let gatePos: Pt | null = null;
                const baseAngle = strHash01(leader.id, j * 23 + 201) * Math.PI * 2;
                const distDeg = 0.022 + strHash01(leader.id, j * 23 + 202) * 0.010;
                // 牧羊组合：每只牲畜各占一块草场，只在本块中心两侧小范围往返，不再穿过同一个中心叠在一起。
                // 牧羊人那块：牲畜站在他身旁偏东北，走动幅度减半，不踩到人。
                const withShepherd = j === PLOT_LEADER_CELL;
                const cx = withShepherd ? 16 : 0;
                const cy = withShepherd ? -6 : 0;
                const wander = withShepherd ? PASTURE_WANDER_PX * 0.5 : PASTURE_WANDER_PX;
                const center = isShepherd ? this.plotCellPos(leader.homePos, j, cx, cy) : leader.homePos;
                for (let attempt = 0; attempt < 8; attempt++) {
                    const ang = baseAngle + attempt * (Math.PI / 4);
                    let a: Pt;
                    let b: Pt;
                    if (isShepherd) {
                        const wx = Math.cos(ang) * wander;
                        const wy = Math.sin(ang) * wander * 0.6;
                        a = this.plotCellPos(leader.homePos, j, cx + wx, cy + wy);
                        b = this.plotCellPos(leader.homePos, j, cx - wx, cy - wy);
                    } else {
                        const dLat = Math.sin(ang) * distDeg;
                        const dLng = Math.cos(ang) * distDeg;
                        a = { lat: leader.homePos.lat + dLat, lng: leader.homePos.lng + dLng };
                        b = { lat: leader.homePos.lat - dLat, lng: leader.homePos.lng - dLng };
                    }
                    const mid = { lat: center.lat, lng: center.lng };
                    if (!this.isSea(a) && !this.isSea(mid) && !this.isSea(b)) {
                        homePos = a;
                        gatePos = b;
                        break;
                    }
                }
                if (!homePos || !gatePos) continue;

                // 一个牧场（四块）只养一种：按牧羊人哈希从文化畜种池里挑一种，四只都是它；不同牧场才会不同。
                const animalDir = isShepherd
                    ? pastoralPool[pastoralOffset]   // 四块合为一个牧场：一个牧场只养一种牲畜
                    : preyPool[Math.floor(strHash01(leader.id, 206) * preyPool.length) % preyPool.length] ?? 'DEER';
                const id = `${leader.id}_${isShepherd ? 'sheep' : 'prey'}_${j}`;
                list.push({
                    id,
                    cityId: leader.cityId,
                    cityPos: { ...leader.cityPos },
                    isAnimal: true,
                    isSeaFishing: false,
                    fishResource: '',
                    lib: 'SUCAI_ANIMAL',
                    dir: animalDir,
                    homePos,
                    gatePos,
                    lastDrawPos: { ...homePos },
                    facing: Math.floor(strHash01(id, 203) * 8) % 8,
                    phase: Math.floor(strHash01(id, 204) * 1000),
                    slotIdx: leader.slotIdx,
                    winterActive: leader.winterActive,
                    viewAlpha: 1,
                    peaceAlpha: 1,
                    actionAlpha: 1,
                    damageBlend: 0,
                    combatStartSec: 0,
                    presentAtCombat: false,
                    inCombatVisual: false,
                    peaceAtCombat: 1,
                    damagePreset: 'animal_loss',
                    damageVariant: Math.floor(strHash01(id, 205) * 100),
                    displayedAction: 'walk',
                    desiredAction: 'walk',
                });
            }
        }

        // 重排落点时沿用同一角色已有的战火状态，避免战损画面闪烁
        for (const actor of list) {
            const prev = this.activeActors.get(actor.id);
            if (!prev) continue;
            actor.viewAlpha = prev.viewAlpha;
            actor.peaceAlpha = prev.peaceAlpha;
            actor.actionAlpha = prev.actionAlpha;
            actor.damageBlend = prev.damageBlend;
            actor.recoveryYear = prev.recoveryYear;
            actor.combatStartSec = prev.combatStartSec;
            actor.presentAtCombat = prev.presentAtCombat;
            actor.inCombatVisual = prev.inCombatVisual;
            actor.peaceAtCombat = prev.peaceAtCombat;
            actor.displayedAction = prev.displayedAction;
            actor.previousAction = prev.previousAction;
            actor.desiredAction = prev.desiredAction;
            if (prev.damageBlend > 0) actor.lastDrawPos = prev.lastDrawPos;
            this.activeActors.set(actor.id, actor);
        }

        // 有地皮因高程未到被拒：整城这次不定案、不入缓存，下一帧瓦片到了重排，免得地皮永久缺失
        if (this.plotElevPending) return [];

        this.placedPlots.push(...newPlots);
        this.actorsByCity.set(city.id, list);
        return list;
    }

    /** 计算某个角色在当前季节应当执行的动作名 */
    private resolveSeasonalAction(actor: CityLifeActor, season: number): string {
        if (actor.isSeaFishing) {
            // 渔船全年生产，秋季部分船只往返渔场与港湾，冬季也不停航闲置。
            if (season === 2) return actor.slotIdx % 2 === 0 ? 'move' : 'work';
            return 'work';
        }
        if (actor.isAnimal) return this.usesIdleWalkCycle(actor) ? 'idle' : 'walk';
        // 所有陆地组合全年持续生产，换季只换劳作动作，不离开农田、资源或牧群。
        const isFarmer = actor.dir === 'VIL_MALE_FARMER' || actor.dir === 'VIL_FEMALE_FARMER';
        if (season === 0 && isFarmer) return actor.slotIdx % 2 === 0 ? 'seed' : 'work';
        return 'work';
    }

    /** 马与骆驼停驻吃草和间歇走动共用同一套行为，其他牲畜保持原样。 */
    /** 组合主人脚下（南块）为基准，求第 cell 块地皮中心再偏 (dx,dy) zoom 9 像素处的经纬度。 */
    private plotCellPos(shepherdHome: Pt, cell: number, dx: number, dy: number): Pt {
        const o = PLOT_CELL_OFFSETS[cell];
        const s = PLOT_CELL_OFFSETS[PLOT_LEADER_CELL];
        const p = this.map.project([shepherdHome.lat, shepherdHome.lng], 9);
        const ll = this.map.unproject([p.x + o[0] - s[0] + dx, p.y + o[1] - s[1] + dy], 9);
        return { lat: ll.lat, lng: ll.lng };
    }

    private usesIdleWalkCycle(actor: CityLifeActor): boolean {
        return actor.dir === 'HORSE' || actor.dir === 'CAMEL' || actor.dir === 'DROMEDARY';
    }

    /** 每 12 秒停驻吃草 8 秒、真实走动 4 秒；cycle 只累计走动时间，停驻时不滑移。 */
    private getIdleWalkMotion(actor: CityLifeActor, tSec: number): { walking: boolean; cycle: number } {
        const cycleSec = 12;
        const idleSec = 8;
        const walkSec = cycleSec - idleSec;
        const clock = Math.max(0, tSec) + ((actor.phase % 100) / 100) * cycleSec;
        const round = Math.floor(clock / cycleSec);
        const local = clock - round * cycleSec;
        const walkedSec = round * walkSec + Math.min(walkSec, Math.max(0, local - idleSec));
        return {
            walking: local >= idleSec,
            cycle: (walkedSec * 0.12) % 2,
        };
    }

    private isHuntPrey(actor: CityLifeActor): boolean {
        return actor.isAnimal && actor.id.includes('_prey_');
    }

    /** DE 猎捕顺序：活动 → 倒地死亡 → 收集期间尸体腐烂 → 猎人搬走后下一只接替。 */
    private getHuntVisual(actor: CityLifeActor, tSec: number): { stage: 'alive' | 'death' | 'decay'; elapsed: number } {
        const phase = (tSec + actor.phase % HUNT_CYCLE_SEC) % HUNT_CYCLE_SEC;
        if (phase >= HUNT_NEXT_PREY_SEC || phase < HUNT_DEATH_START_SEC) return { stage: 'alive', elapsed: phase };
        if (phase < HUNT_DECAY_START_SEC) return { stage: 'death', elapsed: phase - HUNT_DEATH_START_SEC };
        return { stage: 'decay', elapsed: phase - HUNT_DECAY_START_SEC };
    }

    /** 猎人与自己的猎物共用相位：射箭 → 等倒地 → taskA 收集 → 搬运 → 空手返回。 */
    private getHunterBehavior(actor: CityLifeActor, tSec: number): { action: string; cycle: number | null } {
        const preyPhase = Math.floor(strHash01(`${actor.id}_prey_0`, 204) * 1000);
        const phase = (tSec + preyPhase % HUNT_CYCLE_SEC) % HUNT_CYCLE_SEC;
        if (phase < HUNT_DEATH_START_SEC) return { action: 'work', cycle: null };
        if (phase < HUNT_DECAY_START_SEC) return { action: 'idle', cycle: null };
        if (phase < HUNT_CARRY_START_SEC) return { action: 'gather', cycle: null };
        if (phase < HUNT_RETURN_START_SEC) {
            return { action: 'carry', cycle: (phase - HUNT_CARRY_START_SEC) / (HUNT_RETURN_START_SEC - HUNT_CARRY_START_SEC) };
        }
        return { action: 'move', cycle: 1 + (phase - HUNT_RETURN_START_SEC) / (HUNT_CYCLE_SEC - HUNT_RETURN_START_SEC) };
    }

    /** 扫描当前处于战斗波及中的据点集合；战后不再按秒数延长战争状态。 */
    private scanEndangeredCities(nowMs: number, visibleCities: CityDataV2[]): void {
        if (nowMs - this.lastCombatScanMs < 200) return;
        this.lastCombatScanMs = nowMs;
        this.endangeredCities.clear();

        const game = (window as any).game;
        if (!game) return;

        const armies: any[] = game.legionManager?.getArmies?.() ?? [];
        const combatPositions: Pt[] = [];

        for (const a of armies) {
            if (!a || a.isDestroyed) continue;
            const inFight = a.getIsInCombat?.() === true
                || a.isAttacking
                || a.isBattling
                || a.inCombat
                || a.state === 'COMBAT'
                || a.state === 'SIEGE';
            // siegeTargetCityId 在战后仍会保留用于城图外推，只有真实交战时才能作为攻城依据。
            if (inFight && a.siegeTargetCityId) {
                this.endangeredCities.add(a.siegeTargetCityId);
            }
            if (inFight && typeof a.getPosition === 'function') {
                const pos = a.getPosition();
                if (pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)) {
                    combatPositions.push(pos);
                }
            }
        }

        const activeBattles: any[] = game.combatSystem?.getActiveBattleFields?.() ?? [];
        for (const bf of activeBattles) {
            if (!bf || bf.isOver) continue;
            if (bf.siegeCityId) {
                this.endangeredCities.add(bf.siegeCityId);
            }
            const p = bf.getReferencePosition?.()
                ?? bf.position
                ?? bf.center
                ?? (Number.isFinite(bf.lat) ? { lat: bf.lat, lng: bf.lng } : null);
            if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
                combatPositions.push(p);
            }
        }

        if (combatPositions.length > 0) {
            const r2 = COMBAT_HIDE_RADIUS_DEG * COMBAT_HIDE_RADIUS_DEG;
            for (const c of visibleCities) {
                for (const cp of combatPositions) {
                    const dLat = c.lat - cp.lat;
                    const dLng = c.lng - cp.lng;
                    if (dLat * dLat + dLng * dLng <= r2) {
                        this.endangeredCities.add(c.id);
                        break;
                    }
                }
            }
        }
    }

    private loadAsset(lib: 'SUCAI' | 'SUCAI_ANIMAL', dir: string, action: string): void {
        const key = `${lib}/${dir}:${action}`;
        if (this.assets.has(key)) return;
        const basePath = `/${lib}/${dir}`;
        const asset: SpriteSheetAsset = {
            key,
            basePath,
            action,
            frames: 1,
            dirs: {},
            sheets: [],
            ready: false,
            lastUsed: performance.now(),
        };
        this.assets.set(key, asset);

        fetch(`${basePath}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
            .then((meta) => {
                const act = meta[action] ? action : meta['work'] ? 'work' : meta['move'] ? 'move' : meta['walk'] ? 'walk' : 'idle';
                const actBlock = meta[act];
                if (!actBlock) return;
                asset.frames = actBlock.frames ?? 1;
                asset.dirs = actBlock.dirs ?? {};
                const dirKeys = Object.keys(asset.dirs);
                const numDirs = dirKeys.length === 1 ? 1 : 8;
                asset.sheets = new Array(8).fill(null);
                let loaded = 0;
                for (let d = 0; d < numDirs; d++) {
                    const img = new Image();
                    img.onload = () => {
                        loaded++;
                        if (loaded === numDirs) {
                            if (numDirs === 1) {
                                for (let k = 1; k < 8; k++) asset.sheets[k] = img;
                            }
                            asset.ready = true;
                        }
                    };
                    img.onerror = () => {
                        loaded++;
                        if (loaded === numDirs) asset.ready = true;
                    };
                    img.src = `${basePath}/${act}_${d}.png`;
                    asset.sheets[d] = img;
                }
            })
            .catch(() => {});
    }

    private assetFor(lib: 'SUCAI' | 'SUCAI_ANIMAL', dir: string, action: string): SpriteSheetAsset | undefined {
        const key = `${lib}/${dir}:${action}`;
        let a = this.assets.get(key);
        if (!a) {
            this.loadAsset(lib, dir, action);
            return undefined;
        }
        a.lastUsed = performance.now();
        return a.ready ? a : undefined;
    }

    /** 加载单行精灵条资产（支持 SUCAI_BATTLEFIELD / SUCAI_NATURE / SUCAI_RESOURCE） */
    private loadStripAsset(folder: 'SUCAI_BATTLEFIELD' | 'SUCAI_NATURE' | 'SUCAI_RESOURCE' | 'SUCAI_BUILDING', name: string): void {
        const key = `${folder}/${name}`;
        if (this.stripAssets.has(key)) return;
        const basePath = `/${folder}/${name}`;
        const treeMeta = folder === 'SUCAI_NATURE' ? TREE_METAS[name] : undefined;
        const st: StripStaticAsset = {
            key,
            frames: 1,
            boxW: treeMeta?.boxW ?? 64,
            boxH: treeMeta?.boxH ?? 64,
            anchorX: treeMeta?.anchorX ?? 32,
            anchorY: treeMeta?.anchorY ?? 32,
            sheet: null,
            ready: false,
            lastUsed: performance.now(),
        };
        this.stripAssets.set(key, st);

        fetch(`${basePath}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`strip meta ${r.status}`))))
            .then((meta) => {
                st.frames = Math.max(1, meta.frames ?? 1);
                st.boxW = treeMeta?.boxW ?? meta.box_w ?? 64;
                st.boxH = treeMeta?.boxH ?? meta.box_h ?? 64;
                st.anchorX = treeMeta?.anchorX ?? meta.anchor_x ?? Math.floor(st.boxW / 2);
                st.anchorY = treeMeta?.anchorY ?? meta.anchor_y ?? Math.floor(st.boxH / 2);
                const img = new Image();
                let triedPreview = false;
                img.onload = () => { st.ready = true; };
                img.onerror = () => {
                    // 部分 DE 小屋只保留单帧 preview.png，与 frames.png 一样是有效静态素材。
                    if (folder === 'SUCAI_BUILDING' && !triedPreview) {
                        triedPreview = true;
                        img.src = `${basePath}/preview.png`;
                    } else {
                        st.ready = false;
                    }
                };
                img.src = `${basePath}/frames.png`;
                st.sheet = img;
            })
            .catch(() => {});
    }

    private stripAssetFor(folder: 'SUCAI_BATTLEFIELD' | 'SUCAI_NATURE' | 'SUCAI_RESOURCE' | 'SUCAI_BUILDING', name: string): StripStaticAsset | undefined {
        const key = `${folder}/${name}`;
        let st = this.stripAssets.get(key);
        if (!st) {
            this.loadStripAsset(folder, name);
            return undefined;
        }
        st.lastUsed = performance.now();
        return st.ready ? st : undefined;
    }

    /** 预热战时所需的破坏残骸、沉船与尸体贴图 */
    private preloadWarDamageAssetsForActor(actor: CityLifeActor): void {
        if (actor.isSeaFishing) {
            this.loadAsset('SUCAI', 'SHP_FISHING_SHIP', 'sink');
            this.loadAsset('SUCAI', 'SHIP_SINK_SMALL', 'idle');
            return;
        }
        if (actor.isAnimal) {
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'ANIMAL_SKELETON');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE');
        } else {
            this.loadAsset('SUCAI', 'VIL_MALE_VILLAGER', 'death');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'CART_BROKEN');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'SKELETON_CIVILIAN');
            this.loadStripAsset('SUCAI_BATTLEFIELD', 'BARRICADE_RUBBLE_A');
        }
    }

    private evictAssets(): void {
        let bytes = this.debugAssetBytes();
        if (bytes <= CityLifeAmbientLayer.ASSET_BUDGET_BYTES) return;
        const inUse = new Set<string>();
        for (const a of this.activeActors.values()) {
            inUse.add(`${a.lib}/${a.dir}:${a.displayedAction}`);
            if (a.previousAction) inUse.add(`${a.lib}/${a.dir}:${a.previousAction}`);
            inUse.add(`${a.lib}/${a.dir}:${a.desiredAction}`);
            if (this.isHuntPrey(a)) {
                inUse.add(`${a.lib}/${a.dir}:death`);
                inUse.add(`${a.lib}/${a.dir}:decay`);
            }
            if (a.dir === 'VIL_MALE_HUNTER') {
                for (const action of ['work', 'idle', 'gather', 'carry', 'move']) {
                    inUse.add(`${a.lib}/${a.dir}:${action}`);
                }
            }
            if (a.damageBlend > 0) {
                inUse.add('SUCAI/VIL_MALE_VILLAGER:death');
                inUse.add('SUCAI/SHP_FISHING_SHIP:sink');
                inUse.add('SUCAI/SHIP_SINK_SMALL:idle');
            }
        }
        const cands = [...this.assets.entries()]
            .filter(([k]) => !inUse.has(k))
            .sort((x, y) => x[1].lastUsed - y[1].lastUsed);
        for (const [k, a] of cands) {
            if (bytes <= CityLifeAmbientLayer.ASSET_BUDGET_BYTES) break;
            for (const im of a.sheets) {
                if (im) bytes -= (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            }
            this.assets.delete(k);
        }
    }

    private update(dt: number): void {
        if (this.layoutDirty && this.nowMs - this.lastLayoutRebuildMs >= 3000) {
            this.layoutDirty = false;
            this.lastLayoutRebuildMs = this.nowMs;
            this.actorsByCity.clear();
            this.placedPlots = [];   // 地皮登记随布局一起重来，否则旧落点会挡住自己的新落点
            this.forestByCity.clear();
        }

        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const minLat = sw.lat - CULL_MARGIN_DEG;
        const maxLat = ne.lat + CULL_MARGIN_DEG;
        const minLng = sw.lng - CULL_MARGIN_DEG;
        const maxLng = ne.lng + CULL_MARGIN_DEG;

        const visibleCities: CityDataV2[] = [];
        for (const c of CITIES_V2) {
            if (c.lat >= minLat && c.lat <= maxLat && c.lng >= minLng && c.lng <= maxLng) {
                visibleCities.push(c);
            }
        }

        this.scanEndangeredCities(this.nowMs, visibleCities);
        const season = this.getSeason();
        const nextSeason = (season + 1) % 4;
        const seasonBlend = this.getSeasonBlend();
        const actionSeason = seasonBlend > 0 ? nextSeason : season;
        const inViewActorIds = new Set<string>();
        const tSec = this.nowMs / 1000;

        for (const city of visibleCities) {
            const actors = this.getOrCreateCityActors(city);
            const forestProps = actors.length > 0 ? this.getOrCreateCityForest(city) : [];
            const cityInWar = this.endangeredCities.has(city.id);

            // 同时预热当前季与下一季，保证季末五秒交叉渐变不会闪空。
            for (const fp of forestProps) {
                const trees = [fp.springTree, fp.summerTree, fp.autumnTree, fp.winterTree];
                this.loadStripAsset('SUCAI_NATURE', trees[season]);
                this.loadStripAsset('SUCAI_NATURE', trees[nextSeason]);
                this.loadStripAsset(fp.bushLib, fp.bushName);
                if (cityInWar) {
                    this.loadStripAsset('SUCAI_NATURE', fp.isBamboo ? 'FELLED_LUSH_BAMBOO' : 'FELLED_GENERIC');
                    this.loadStripAsset('SUCAI_NATURE', fp.isBamboo ? 'STUMP_LUSH_BAMBOO' : 'STUMP_GENERIC');
                    this.loadStripAsset('SUCAI_NATURE', 'DEAD_TREE');
                }
            }

            for (const actor of actors) {
                inViewActorIds.add(actor.id);
                if (!this.activeActors.has(actor.id)) {
                    actor.viewAlpha = 0;   // 新出现的生产组合（地皮、农夫、牲畜、建筑、树林）从全透明渐显
                    this.activeActors.set(actor.id, actor);
                }
                const seasonalAction = this.resolveSeasonalAction(actor, actionSeason);
                actor.desiredAction = actor.dir === 'VIL_MALE_HUNTER'
                    ? this.getHunterBehavior(actor, tSec).action
                    : this.usesIdleWalkCycle(actor)
                        ? (this.getIdleWalkMotion(actor, tSec).walking ? 'walk' : 'idle')
                        : seasonalAction;
                this.loadAsset(actor.lib, actor.dir, actor.desiredAction);
                if (this.usesIdleWalkCycle(actor)) {
                    this.loadAsset(actor.lib, actor.dir, 'idle');
                    this.loadAsset(actor.lib, actor.dir, 'walk');
                }
                if (actor.dir === 'VIL_MALE_HUNTER') {
                    // 五段动作全部预载，避免收集或搬运切换时短暂闪空。
                    for (const action of ['work', 'idle', 'gather', 'carry', 'move']) {
                        this.loadAsset(actor.lib, actor.dir, action);
                    }
                }
                if (actor.previousAction) this.loadAsset(actor.lib, actor.dir, actor.previousAction);
                if (this.isHuntPrey(actor)) {
                    this.loadAsset(actor.lib, actor.dir, 'death');
                    this.loadAsset(actor.lib, actor.dir, 'decay');
                }
                if (actor.isSeaFishing && actor.fishResource) {
                    this.loadStripAsset('SUCAI_RESOURCE', actor.fishResource);
                }
                if (actor.seasonalPlot) {
                    const plotBySeason = SEASONAL_PLOT_BY_KIND[actor.seasonalPlot];
                    this.loadStripAsset('SUCAI_RESOURCE', plotBySeason[season]);
                    this.loadStripAsset('SUCAI_RESOURCE', plotBySeason[nextSeason]);
                }
                if (actor.groundResource && actor.groundResourceLib) {
                    this.loadStripAsset(actor.groundResourceLib, actor.groundResource);
                }
                if (actor.buildingResource) {
                    this.loadStripAsset('SUCAI_BUILDING', actor.buildingResource);
                }
                if (cityInWar || actor.damageBlend > 0) {
                    this.preloadWarDamageAssetsForActor(actor);
                }
            }
        }

        for (const [id, actor] of this.activeActors.entries()) {
            const inView = inViewActorIds.has(id);
            if (!inView) {
                this.activeActors.delete(id);
                continue;
            }

            const inCombat = this.endangeredCities.has(actor.cityId);

            actor.viewAlpha = Math.min(1, actor.viewAlpha + dt / PRODUCTION_FADE_IN_SEC);
            if (actor.desiredAction !== actor.displayedAction) {
                if (this.usesIdleWalkCycle(actor) || actor.dir === 'VIL_MALE_HUNTER') {
                    // 吃草、迈步与猎捕工序都是行为切换，直接换动作，不做五秒半透明交叉渐隐。
                    actor.previousAction = undefined;
                    actor.displayedAction = actor.desiredAction;
                    actor.actionAlpha = 1;
                } else {
                    actor.previousAction = actor.displayedAction;
                    actor.displayedAction = actor.desiredAction;
                    actor.actionAlpha = 0;
                }
            }
            if (actor.previousAction && actor.previousAction !== actor.displayedAction) {
                // 有季末时间基准时与农田、树林严格同步；手动跳季时也在五秒内完成。
                actor.actionAlpha = seasonBlend > 0
                    ? seasonBlend
                    : Math.min(1, actor.actionAlpha + dt / SEASON_TRANSITION_SEC);
                if (actor.actionAlpha >= 1) {
                    actor.actionAlpha = 1;
                    actor.previousAction = undefined;
                }
            } else {
                actor.previousAction = undefined;
                actor.actionAlpha = 1;
            }

            if (inCombat || actor.inCombatVisual) {
                // 开战时记录当前生产透明度；短暂战斗也先完成战损渐变，不直接跳没。
                if (!actor.inCombatVisual) {
                    actor.inCombatVisual = true;
                    actor.combatStartSec = tSec;
                    actor.presentAtCombat = true;
                    actor.peaceAtCombat = actor.peaceAlpha;
                    actor.recoveryYear = undefined;
                }
                actor.damageBlend = Math.min(1, actor.damageBlend + dt / FADE_TO_DAMAGE_SEC);
                actor.peaceAlpha = actor.peaceAtCombat * (1 - actor.damageBlend);
                if (actor.damageBlend >= 1 && actor.recoveryYear === undefined) {
                    actor.recoveryYear = this.getYear() + 1;
                }
                if (!inCombat && actor.damageBlend >= 1) actor.inCombatVisual = false;
            } else if (actor.damageBlend > 0) {
                // 第一阶段：完全战毁后保留残骸，到第二年或更晚年份的春季才渐隐；生产始终保持隐藏。
                actor.peaceAlpha = 0;
                const canRecover = season === 0
                    && actor.recoveryYear !== undefined
                    && this.getYear() >= actor.recoveryYear;
                if (canRecover) {
                    actor.damageBlend = Math.max(0, actor.damageBlend - dt / FADE_RECOVER_PEACE_SEC);
                }
            } else if (actor.presentAtCombat) {
                // 第二阶段：残骸全部消失后，原生产组合才渐显并恢复持续生产。
                actor.peaceAlpha = Math.min(1, actor.peaceAlpha + dt / FADE_RECOVER_PEACE_SEC);
                if (actor.peaceAlpha >= 1) {
                    actor.presentAtCombat = false;
                    actor.peaceAtCombat = 1;
                    actor.recoveryYear = undefined;
                }
            } else {
                actor.peaceAlpha = 1;
            }
        }
    }

    /** 绘制单行精灵条中的指定帧（破坏残骸、灌丛浆果、海鱼群、砍伐树桩等） */
    private drawStripSprite(
        folder: 'SUCAI_BATTLEFIELD' | 'SUCAI_NATURE' | 'SUCAI_RESOURCE' | 'SUCAI_BUILDING',
        name: string,
        frameIdx: number,
        px: number,
        py: number,
        scale: number,
        alpha: number
    ): void {
        if (alpha <= 0.01) return;
        const st = this.stripAssetFor(folder, name);
        if (!st || !st.sheet || !st.sheet.complete || !st.sheet.naturalWidth) return;

        const frame = frameIdx % Math.max(1, st.frames);
        const sx = frame * st.boxW;
        const dx = px - st.anchorX * scale;
        const dy = py - st.anchorY * scale;

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.ctx.drawImage(
            st.sheet,
            sx,
            0,
            st.boxW,
            st.boxH,
            dx,
            dy,
            st.boxW * scale,
            st.boxH * scale
        );
        this.ctx.restore();
    }

    /** 绘制渔猎据点的单棵季节性树木（严格对齐树根锚点） */
    private drawHuntingTree(treeName: string, variant: number, px: number, py: number, targetH: number, alpha: number): void {
        if (alpha <= 0.01) return;
        const st = this.stripAssetFor('SUCAI_NATURE', treeName);
        if (!st || !st.sheet || !st.sheet.complete || !st.sheet.naturalWidth) return;

        const treeMeta = TREE_METAS[treeName];
        const validFrames = treeMeta?.frames;
        const frame = validFrames && validFrames.length > 0
            ? validFrames[variant % validFrames.length]
            : (variant % Math.max(1, st.frames));

        const w = targetH * (st.boxW / st.boxH);
        const dx = px - w * (st.anchorX / st.boxW);
        const dy = py - targetH * (st.anchorY / st.boxH);

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.95));
        this.ctx.drawImage(st.sheet, frame * st.boxW, 0, st.boxW, st.boxH, dx, dy, w, targetH);
        this.ctx.restore();
    }

    /** 绘制 8 方向死亡倒地、尸体腐烂或沉没并定格的精灵。 */
    private drawDirectionalCorpse(
        lib: 'SUCAI' | 'SUCAI_ANIMAL',
        dir: string,
        action: string,
        facing: number,
        elapsedCombatSec: number,
        px: number,
        py: number,
        scale: number,
        alpha: number
    ): void {
        if (alpha <= 0.01) return;
        const deathAsset = this.assetFor(lib, dir, action);
        if (!deathAsset) return;

        const box = deathAsset.dirs[String(facing)] ?? deathAsset.dirs['0'];
        if (!box) return;
        const sheet = deathAsset.sheets[facing] ?? deathAsset.sheets[0];
        if (!sheet || !sheet.complete || !sheet.naturalWidth) return;

        const totalFrames = Math.max(1, deathAsset.frames);
        const animFrame = Math.floor(Math.max(0, elapsedCombatSec) * 16);
        const frame = Math.min(totalFrames - 1, animFrame);

        const fw = box.fw;
        const fh = box.fh;
        const dx = px - box.hx * scale;
        const dy = py - box.hy * scale;

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        this.ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
        this.ctx.restore();
    }

    /** 绘制战时被破坏的图、尸体、沉船与牲畜损失（随 damageBlend 0->1 渐显） */
    private drawWarDamageForActor(
        actor: CityLifeActor,
        pt: L.Point,
        facing: number,
        zoomFactor: number,
        tSec: number,
        damageAlpha: number
    ): void {
        const wreckScale = WRECK_SCALE_BASE * zoomFactor;
        const elapsed = Math.max(0, tSec - actor.combatStartSec);

        if (actor.isSeaFishing || actor.damagePreset === 'sea_shipwreck') {
            // 海中渔船战损：播放 DE 原版渔船破裂沉没动画（SHP_FISHING_SHIP:sink）+ 海面漂浮沉船残骸水花（SHIP_SINK_SMALL）
            const shipScale = SHIP_SCALE_BASE * zoomFactor;
            this.drawDirectionalCorpse('SUCAI', 'SHIP_SINK_SMALL', 'idle', 0, elapsed * 0.7, pt.x, pt.y + 2 * zoomFactor, shipScale * 0.95, damageAlpha * 0.85);
            this.drawDirectionalCorpse('SUCAI', 'SHP_FISHING_SHIP', 'sink', facing, elapsed, pt.x, pt.y, shipScale, damageAlpha);
            return;
        }

        const corpseScale = VILLAGER_SCALE_BASE * zoomFactor;
        const ox = ((actor.damageVariant % 7) - 3) * 4.5 * zoomFactor;
        const oy = (((actor.damageVariant >> 2) % 5) - 2) * 3.5 * zoomFactor;

        if (actor.damagePreset === 'animal_loss') {
            // 战争损失沿用统一的白骨与牧场残骸，不改变猎捕组合的 DE 死亡／腐烂流程。
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE', actor.damageVariant, pt.x - 10 * zoomFactor, pt.y - 5 * zoomFactor, wreckScale * 0.9, damageAlpha * 0.92);
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'ANIMAL_SKELETON', actor.damageVariant, pt.x + 12 * zoomFactor + ox * 0.4, pt.y + 6 * zoomFactor + oy * 0.4, wreckScale * 0.88, damageAlpha * 0.95);
            return;
        }

        if (actor.damagePreset === 'broken_cart_and_bones') {
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'CART_BROKEN', actor.damageVariant, pt.x - 6 * zoomFactor, pt.y - 3 * zoomFactor, wreckScale, damageAlpha);
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'SKELETON_CIVILIAN', actor.damageVariant, pt.x + 14 * zoomFactor, pt.y + 7 * zoomFactor, wreckScale * 0.95, damageAlpha);
            this.drawDirectionalCorpse('SUCAI', 'VIL_MALE_VILLAGER', 'death', facing, elapsed, pt.x + ox, pt.y + oy, corpseScale, damageAlpha * 0.95);
            return;
        }

        if (actor.damagePreset === 'rubble_and_corpse') {
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'BARRICADE_RUBBLE_A', actor.damageVariant, pt.x, pt.y - 2 * zoomFactor, wreckScale * 0.82, damageAlpha * 0.92);
            this.drawDirectionalCorpse('SUCAI', 'VIL_MALE_VILLAGER', 'death', facing, elapsed, pt.x + 8 * zoomFactor, pt.y + 5 * zoomFactor, corpseScale, damageAlpha);
            this.drawStripSprite('SUCAI_BATTLEFIELD', 'SKELETON_CIVILIAN', actor.damageVariant + 3, pt.x - 12 * zoomFactor, pt.y + 6 * zoomFactor, wreckScale * 0.9, damageAlpha * 0.9);
            return;
        }

        this.drawStripSprite('SUCAI_BATTLEFIELD', 'FENCE_RUBBLE', actor.damageVariant, pt.x - 8 * zoomFactor, pt.y - 4 * zoomFactor, wreckScale, damageAlpha);
        this.drawDirectionalCorpse('SUCAI', 'VIL_MALE_VILLAGER', 'death', facing, elapsed, pt.x + 5 * zoomFactor, pt.y + 3 * zoomFactor, corpseScale, damageAlpha);
    }

    private draw(): void {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const zoom = this.map.getZoom();
        const zoomFactor = Math.pow(2, zoom - 9);
        const m = 64;
        const tSec = this.nowMs / 1000;
        const season = this.getSeason();
        const nextSeason = (season + 1) % 4;
        const seasonBlend = this.getSeasonBlend();

        // 树林与生产组合同步经过“战损 → 残骸渐隐 → 生产渐显”三个阶段。
        const cityState = new Map<string, { viewAlpha: number; damageBlend: number; peaceAlpha: number }>();
        for (const a of this.activeActors.values()) {
            const prev = cityState.get(a.cityId);
            if (!prev || a.viewAlpha > prev.viewAlpha) {
                cityState.set(a.cityId, { viewAlpha: a.viewAlpha, damageBlend: a.damageBlend, peaceAlpha: a.peaceAlpha });
            }
        }

        // 1. 先绘制渔猎民族据点周围的四季树林、灌丛浆果与战时砍伐/焚毁断木树桩
        const treeBaseH = HUNTING_TREE_BASE_PX * Math.pow(1.35, zoom - 9);
        for (const [cityId, st] of cityState.entries()) {
            if (st.viewAlpha <= 0.01) continue;
            const forestProps = this.forestByCity.get(cityId);
            if (!forestProps || forestProps.length === 0) continue;

            for (const fp of forestProps) {
                const pt = this.map.latLngToContainerPoint([fp.pos.lat, fp.pos.lng]);
                if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;

                const peaceAlpha = st.viewAlpha * st.peaceAlpha;
                const damageAlpha = st.viewAlpha * st.damageBlend;
                const bushScale = 0.36 * zoomFactor;

                // 战火破坏态：树林渐变为被砍倒的断木（FELLED_GENERIC）、树桩（STUMP_GENERIC）与焦枯死树（DEAD_TREE）
                if (damageAlpha > 0.01) {
                    const felledName = fp.isBamboo ? 'FELLED_LUSH_BAMBOO' : 'FELLED_GENERIC';
                    const stumpName = fp.isBamboo ? 'STUMP_LUSH_BAMBOO' : 'STUMP_GENERIC';
                    this.drawStripSprite('SUCAI_NATURE', stumpName, fp.variant, pt.x - 10 * zoomFactor, pt.y + 3 * zoomFactor, 0.48 * zoomFactor, damageAlpha);
                    this.drawStripSprite('SUCAI_NATURE', felledName, fp.variant, pt.x + 4 * zoomFactor, pt.y + 2 * zoomFactor, 0.42 * zoomFactor, damageAlpha);
                    if (fp.variant % 2 === 0) {
                        this.drawHuntingTree('DEAD_TREE', fp.variant, pt.x - 6 * zoomFactor, pt.y - 2 * zoomFactor, treeBaseH * fp.scaleJitter * 0.85, damageAlpha * 0.88);
                    }
                }

                // 和平四季态：主树与伴生小树同步交叉渐变；同树种不叠画，避免半透明发虚。
                if (peaceAlpha > 0.01) {
                    this.drawStripSprite(fp.bushLib, fp.bushName, fp.variant, pt.x + 11 * zoomFactor, pt.y + 5 * zoomFactor, bushScale, peaceAlpha * 0.92);
                    const trees = [fp.springTree, fp.summerTree, fp.autumnTree, fp.winterTree];
                    const curTree = trees[season];
                    const nextTree = trees[nextSeason];
                    const mainH = treeBaseH * fp.scaleJitter;
                    const subH = mainH * 0.78;
                    if (curTree === nextTree) {
                        this.drawHuntingTree(curTree, fp.variant, pt.x, pt.y, mainH, peaceAlpha);
                        this.drawHuntingTree(curTree, fp.variant + 2, pt.x - 12 * zoomFactor, pt.y + 4 * zoomFactor, subH, peaceAlpha);
                    } else {
                        this.drawHuntingTree(curTree, fp.variant, pt.x, pt.y, mainH, peaceAlpha * (1 - seasonBlend));
                        this.drawHuntingTree(curTree, fp.variant + 2, pt.x - 12 * zoomFactor, pt.y + 4 * zoomFactor, subH, peaceAlpha * (1 - seasonBlend));
                        this.drawHuntingTree(nextTree, fp.variant, pt.x, pt.y, mainH, peaceAlpha * seasonBlend);
                        this.drawHuntingTree(nextTree, fp.variant + 2, pt.x - 12 * zoomFactor, pt.y + 4 * zoomFactor, subH, peaceAlpha * seasonBlend);
                    }
                }
            }
        }

        // 2. 按纬度从北到南排序绘制民生角色、海中渔船鱼群与战损尸骸
        const list = [...this.activeActors.values()].filter(
            (a) => a.viewAlpha > 0.01 && (a.peaceAlpha > 0.01 || a.damageBlend > 0.01)
        );
        list.sort((a, b) => b.homePos.lat - a.homePos.lat);

        // 所有农田与草场先统一铺底；不能按组合穿插绘制，否则后画的地皮会盖住先画的动物。
        for (const actor of list) {
            if (actor.isSeaFishing || actor.isAnimal || !actor.seasonalPlot) continue;
            const peaceFinalAlpha = actor.viewAlpha * actor.peaceAlpha;
            if (peaceFinalAlpha <= 0.01) continue;
            const groupPt = this.map.latLngToContainerPoint([actor.homePos.lat, actor.homePos.lng]);
            const plotBySeason = SEASONAL_PLOT_BY_KIND[actor.seasonalPlot];
            // 农田 / 水田 / 草场都按选址时判出的块数铺 1~4 块（主人在南块）。
            const s = PLOT_CELL_OFFSETS[PLOT_LEADER_CELL];
            const cells = (actor.plotCells ?? [PLOT_LEADER_CELL])
                .map((k) => [PLOT_CELL_OFFSETS[k][0] - s[0], PLOT_CELL_OFFSETS[k][1] - s[1]] as const);
            for (const [ox, oy] of cells) {
                const px = groupPt.x + ox * zoomFactor;
                const py = groupPt.y + (oy + 4) * zoomFactor;
                this.drawStripSprite(
                    'SUCAI_RESOURCE', plotBySeason[season], 0,
                    px, py, 0.58 * zoomFactor,
                    peaceFinalAlpha * (1 - seasonBlend)
                );
                this.drawStripSprite(
                    'SUCAI_RESOURCE', plotBySeason[nextSeason], 0,
                    px, py, 0.58 * zoomFactor,
                    peaceFinalAlpha * seasonBlend
                );
            }
        }

        for (const actor of list) {
            const act = actor.displayedAction;
            const huntVisual = this.isHuntPrey(actor) ? this.getHuntVisual(actor, tSec) : null;
            const idleWalkMotion = this.usesIdleWalkCycle(actor) ? this.getIdleWalkMotion(actor, tSec) : null;
            const hunterBehavior = actor.dir === 'VIL_MALE_HUNTER' ? this.getHunterBehavior(actor, tSec) : null;
            let drawLat = actor.homePos.lat;
            let drawLng = actor.homePos.lng;
            let facing = actor.facing;

            if (actor.damageBlend <= 0.05) {
                if (huntVisual && huntVisual.stage !== 'alive') {
                    // 死亡后锁定在倒地位置，尸体不能继续跟着行走端点移动。
                    drawLat = actor.lastDrawPos.lat;
                    drawLng = actor.lastDrawPos.lng;
                } else if (idleWalkMotion || (hunterBehavior && hunterBehavior.cycle !== null) || act === 'carry' || act === 'move' || act === 'walk') {
                    const speed = actor.isSeaFishing ? 0.10 : act === 'walk' ? 0.08 : 0.14;
                    const cycle = idleWalkMotion?.cycle ?? hunterBehavior?.cycle ?? (tSec * speed + (actor.phase % 100) / 100) % 2;
                    const u = cycle <= 1 ? cycle : 2 - cycle;
                    drawLat = actor.homePos.lat + (actor.gatePos.lat - actor.homePos.lat) * u;
                    drawLng = actor.homePos.lng + (actor.gatePos.lng - actor.homePos.lng) * u;
                    const dLat = cycle <= 1
                        ? actor.gatePos.lat - actor.homePos.lat
                        : actor.homePos.lat - actor.gatePos.lat;
                    const dLng = cycle <= 1
                        ? actor.gatePos.lng - actor.homePos.lng
                        : actor.homePos.lng - actor.gatePos.lng;
                    facing = dirFromDelta(dLat, dLng);
                } else if (hunterBehavior) {
                    // 猎人原地射箭 / 等倒地 / 剖肉：面朝自己的猎物（DE 里猎人始终对着猎物），不再随机转向
                    const prey = this.activeActors.get(`${actor.id}_prey_0`);
                    if (prey) {
                        const dLat = prey.lastDrawPos.lat - actor.homePos.lat;
                        const dLng = prey.lastDrawPos.lng - actor.homePos.lng;
                        if (dLat !== 0 || dLng !== 0) facing = dirFromDelta(dLat, dLng);
                    }
                } else {
                    const turnOffset = Math.floor((tSec + actor.phase) / 8) % 2;
                    facing = (actor.facing + turnOffset) % 8;
                }
                if (!huntVisual || huntVisual.stage === 'alive') {
                    actor.lastDrawPos.lat = drawLat;
                    actor.lastDrawPos.lng = drawLng;
                }
            } else {
                drawLat = actor.lastDrawPos.lat;
                drawLng = actor.lastDrawPos.lng;
            }

            const pt = this.map.latLngToContainerPoint([drawLat, drawLng]);
            if (pt.x < -m || pt.x > this.canvas.width + m || pt.y < -m || pt.y > this.canvas.height + m) continue;

            // 战火破坏层（破损农车/栅栏废墟、平民尸体、牲畜尸骨、沉没渔船），随 damageBlend (0 -> 1) 渐显
            const damageAlpha = actor.presentAtCombat ? actor.viewAlpha * actor.damageBlend : 0;
            if (damageAlpha > 0.01) {
                this.drawWarDamageForActor(actor, pt, facing, zoomFactor, tSec, damageAlpha);
            }

            // 战争透明度与换季动作透明度分开，避免换季时整组农田、资源和建筑一起消失。
            const peaceFinalAlpha = actor.viewAlpha * actor.peaceAlpha;
            if (peaceFinalAlpha > 0.01) {
                // 农田与草场已在角色前统一铺底；果子、木材、矿石与随机建筑仍固定在主人脚下／两侧。
                if (!actor.isSeaFishing && !actor.isAnimal) {
                    const groupPt = this.map.latLngToContainerPoint([actor.homePos.lat, actor.homePos.lng]);
                    const side = actor.slotIdx % 2 === 0 ? -1 : 1;
                    if (actor.groundResource && actor.groundResourceLib) {
                        this.drawStripSprite(
                            actor.groundResourceLib,
                            actor.groundResource,
                            actor.damageVariant,
                            groupPt.x - side * 15 * zoomFactor,
                            groupPt.y + 5 * zoomFactor,
                            0.48 * zoomFactor,
                            peaceFinalAlpha
                        );
                    }
                    if (actor.buildingResource) {
                        this.drawStripSprite(
                            'SUCAI_BUILDING',
                            actor.buildingResource,
                            actor.damageVariant,
                            // 四块地皮东西两块中心在 ±35，有地皮的组合把建筑挪到地皮外侧，不压人和牲畜
                            groupPt.x + side * (actor.seasonalPlot ? 62 : 28) * zoomFactor,
                            groupPt.y - 7 * zoomFactor,
                            0.22 * zoomFactor,
                            peaceFinalAlpha
                        );
                    }
                }

                // 船坞固定在近岸港湾，不跟随渔船往返；与渔船、鱼群同属一套生产组合。
                if (actor.isSeaFishing && actor.buildingResource) {
                    const dockPt = this.map.latLngToContainerPoint([actor.gatePos.lat, actor.gatePos.lng]);
                    this.drawStripSprite(
                        'SUCAI_BUILDING',
                        actor.buildingResource,
                        actor.damageVariant,
                        dockPt.x,
                        dockPt.y - 5 * zoomFactor,
                        0.22 * zoomFactor,
                        peaceFinalAlpha
                    );
                }

                // 鱼群跟随渔船实时位置，船返港时也不会把鱼群独自留在渔场。
                if (actor.isSeaFishing && actor.fishResource) {
                    const fishFrame = Math.floor(tSec * 15 + actor.phase);
                    this.drawStripSprite(
                        'SUCAI_RESOURCE',
                        actor.fishResource,
                        fishFrame,
                        pt.x + 12 * zoomFactor,
                        pt.y + 6 * zoomFactor,
                        FISH_SCALE_BASE * zoomFactor,
                        peaceFinalAlpha * 0.92
                    );
                }

                const baseScale = actor.isSeaFishing
                    ? SHIP_SCALE_BASE
                    : actor.isAnimal
                        ? ANIMAL_SCALE_BASE
                        : VILLAGER_SCALE_BASE;
                const scale = baseScale * zoomFactor;
                if (huntVisual && huntVisual.stage !== 'alive') {
                    this.drawDirectionalCorpse(
                        actor.lib,
                        actor.dir,
                        huntVisual.stage,
                        facing,
                        huntVisual.elapsed,
                        pt.x,
                        pt.y,
                        scale,
                        peaceFinalAlpha
                    );
                    continue;
                }
                const actionLayers = actor.previousAction && actor.previousAction !== actor.displayedAction
                    ? [
                        { action: actor.previousAction, weight: 1 - actor.actionAlpha },
                        { action: actor.displayedAction, weight: actor.actionAlpha },
                    ]
                    : [{ action: actor.displayedAction, weight: 1 }];

                for (const actionLayer of actionLayers) {
                    if (actionLayer.weight <= 0.001) continue;
                    const asset = this.assetFor(actor.lib, actor.dir, actionLayer.action);
                    if (!asset) continue;
                    const box = asset.dirs[String(facing)] ?? asset.dirs['0'];
                    if (!box) continue;
                    const sheet = asset.sheets[facing] ?? asset.sheets[0];
                    if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

                    const fps = actionLayer.action === 'idle' ? 10 : 14;
                    const frame = Math.floor(tSec * fps + actor.phase) % Math.max(1, asset.frames);
                    const fw = box.fw;
                    const fh = box.fh;
                    const dx = pt.x - box.hx * scale;
                    const dy = pt.y - box.hy * scale;

                    ctx.save();
                    ctx.globalAlpha = Math.max(0, Math.min(1, peaceFinalAlpha * actionLayer.weight));
                    ctx.drawImage(sheet, frame * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
                    ctx.restore();
                }
            }
        }
    }

    private tick(now: number): void {
        if (!this.running) return;
        const dt = Math.min(0.1, this.lastTime > 0 ? (now - this.lastTime) / 1000 : 0.016);
        this.lastTime = now;
        this.nowMs = now;

        if (this.isHiddenNow()) {
            if (!this.clearedWhileHidden) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.clearedWhileHidden = true;
            }
            requestAnimationFrame(this.tick.bind(this));
            return;
        }
        this.clearedWhileHidden = false;

        // 单帧出错不能让整条帧循环断掉（否则整局都不再显示），下一帧照常继续。
        try {
            const t0 = performance.now();
            this.update(dt);
            this.evictAssets();
            this.draw();
            perfDoctor.note('CityLifeAmbientLayer.tick(据点民生层)', performance.now() - t0, 'src/map/CityLifeAmbientLayer.ts:tick');
        } catch (e) {
            console.error('[CityLifeAmbientLayer] tick 出错', e);
        }
        requestAnimationFrame(this.tick.bind(this));
    }
}

let singleton: CityLifeAmbientLayer | null = null;
let visible = true;

export function initializeCityLifeAmbientLayer(gameMap: GameMap): CityLifeAmbientLayer {
    if (singleton) return singleton;
    singleton = new CityLifeAmbientLayer(gameMap.getLeafletMap());
    if (import.meta.env.DEV) {
        perfDoctor.registerCache({
            name: 'CityLifeAmbientLayer:assets(据点民生与战损素材)',
            where: 'src/map/CityLifeAmbientLayer.ts:ASSET_BUDGET_BYTES',
            entries: () => singleton!.debugAssetCount(),
            bytes: () => singleton!.debugAssetBytes(),
            limitKind: 'bytes',
            limitValue: 64 * 1024 * 1024,
        });
    }
    singleton.setVisible(visible);
    return singleton;
}

export function getCityLifeAmbientLayer(): CityLifeAmbientLayer | null {
    return singleton;
}

export function setCityLifeAmbientLayerVisible(nextVisible: boolean): void {
    visible = nextVisible;
    singleton?.setVisible(nextVisible);
}
