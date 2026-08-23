/**
 * 13 战场 biome 判定（P2，2026-08-20）。
 *
 * 第一层使用 30 个 Köppen–Geiger 气候亚型，第二层再按当地海拔划分
 * lowland / upland / mountain / alpine / snow。文化区不参与气候判定。
 *
 * 铺地铁律不变：每场一张、全场统一、纯 createPattern 重复铺。
 */
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { koppenClassIdAt } from '../data/KoppenGeigerGrid';
import { RandomSource, mathRandomSource } from './scene13/Random';
import { resolveDeMapTheme, terrainForTheme } from './scene13/Scene13DeMapThemes';

export type Biome =
    | 'tropical_rainforest'
    | 'savanna'
    | 'desert'
    | 'mediterranean'
    | 'cold_steppe'
    | 'temperate_grass'
    | 'temperate_forest'
    | 'boreal'
    | 'tundra_snow';

export type KoppenClass =
    | 'Af' | 'Am' | 'Aw'
    | 'BWh' | 'BWk' | 'BSh' | 'BSk'
    | 'Csa' | 'Csb' | 'Csc' | 'Cwa' | 'Cwb' | 'Cwc' | 'Cfa' | 'Cfb' | 'Cfc'
    | 'Dsa' | 'Dsb' | 'Dsc' | 'Dsd' | 'Dwa' | 'Dwb' | 'Dwc' | 'Dwd'
    | 'Dfa' | 'Dfb' | 'Dfc' | 'Dfd'
    | 'ET' | 'EF';

export type ElevationBand = 'lowland' | 'upland' | 'mountain' | 'alpine' | 'high_alpine' | 'snow';

const KOPPEN_CLASS_BY_ID: ReadonlyArray<KoppenClass | null> = [
    null,
    'Af', 'Am', 'Aw',
    'BWh', 'BWk', 'BSh', 'BSk',
    'Csa', 'Csb', 'Csc', 'Cwa', 'Cwb', 'Cwc', 'Cfa', 'Cfb', 'Cfc',
    'Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd',
    'Dfa', 'Dfb', 'Dfc', 'Dfd',
    'ET', 'EF',
];

export const KOPPEN_TO_BIOME: Readonly<Record<KoppenClass, Biome>> = {
    Af: 'tropical_rainforest', Am: 'tropical_rainforest', Aw: 'savanna',
    BWh: 'desert', BWk: 'desert', BSh: 'savanna', BSk: 'cold_steppe',
    Csa: 'mediterranean', Csb: 'mediterranean', Csc: 'mediterranean',
    Cwa: 'temperate_forest', Cwb: 'temperate_forest', Cwc: 'boreal',
    Cfa: 'temperate_forest', Cfb: 'temperate_forest', Cfc: 'boreal',
    Dsa: 'cold_steppe', Dsb: 'cold_steppe', Dsc: 'boreal', Dsd: 'boreal',
    Dwa: 'temperate_forest', Dwb: 'temperate_forest', Dwc: 'boreal', Dwd: 'boreal',
    Dfa: 'temperate_forest', Dfb: 'temperate_forest', Dfc: 'boreal', Dfd: 'boreal',
    ET: 'tundra_snow', EF: 'tundra_snow',
};

interface ElevationThresholds {
    upland: number;
    mountain: number;
    alpine: number;
}

const ELEVATION_THRESHOLDS: Readonly<Record<'A' | 'B' | 'C' | 'D' | 'E', ElevationThresholds>> = {
    A: { upland: 300, mountain: 1200, alpine: 2800 },
    B: { upland: 500, mountain: 1500, alpine: 2800 },
    C: { upland: 200, mountain: 800, alpine: 2000 },
    D: { upland: 200, mountain: 700, alpine: 1600 },
    E: { upland: 0, mountain: 300, alpine: 800 },
};

/**
 * 真实地理雪线（按纬度动态梯级，符合自然地理学与真实历史）：
 * - 0°~30°（热带/亚热带/青藏高原）：雪线 4800m~5200m（仅珠峰/喜马拉雅/乞力马扎罗终年积雪）
 * - 30°~45°（温带中纬度/阿尔卑斯/天山/帕米尔）：雪线 4200m~4500m
 * - 45°~55°（中高纬度/蒙古高原/阿尔泰山/西伯利亚南）：雪线 3500m~3800m（夏季蒙古1700m绝无积雪）
 * - 55°~65°（亚寒带针叶林）：雪线 2600m
 * - 65°+（北极圈与极地）：雪线 1200m~1500m
 */
export function snowLineFor(lat: number, lng?: number): number {
    const absLat = Math.abs(lat);
    // 青藏高原地区（高原热岛效应与低纬度高热，真实永久雪线在 5200m~5800m 以上）
    if (lng !== undefined && lng >= 75 && lng <= 105 && absLat >= 26 && absLat <= 40) {
        return 5200;
    }
    if (absLat < 30) return 5000;
    if (absLat < 45) return 4600;
    if (absLat < 55) return 3600;
    if (absLat < 65) return 2600;
    if (absLat < 75) return 1800;
    return 1200;
}

/** 无坐标兜底（13 初始化防御分支）：默认温带森林夏季草皮 */
export const DEFAULT_TERRAIN_TILE = 'gr3';

export function resolveClimateRegion(lat: number, lng: number): KoppenClass | null {
    const id = koppenClassIdAt(lat, lng);
    return id === null ? null : (KOPPEN_CLASS_BY_ID[id] ?? null);
}

function fallbackBiomeForLatitude(lat: number): Biome {
    const absLat = Math.abs(lat);
    if (absLat < 12) return 'tropical_rainforest';
    if (absLat < 23) return 'savanna';
    if (absLat < 35) return 'temperate_grass';
    if (absLat < 55) return 'temperate_forest';
    if (absLat < 66) return 'boreal';
    return 'tundra_snow';
}

/**
 * 海拔梯级标准划分（与大地图 HillshadeWorker 6阶海拔染色严格 100% 保持一致）：
 * - 0 - 400m    lowland     平原水乡与河谷低地（对标平原绿 #96B287）
 * - 400 - 1000m upland      丘陵低山与台地（对标橄榄黄绿 #B9B991）
 * - 1000- 2500m mountain    黄土高原与干旱中山（对标黄土金黄 #D4C08A）
 * - 2500- 4000m alpine      高山草甸与戈壁砾石原（对标高山灰绿 #A0A5A0 ~ #B9AF8C）
 * - 4000- 雪线  high_alpine 极高山石原与高寒冻土（下界 4000 对齐战略 4000~5200 高寒段）
 * - 雪线以上   snow         终年积雪雪峰与冰川（纬度动态雪线，真实世界）
 */
export function resolveElevationBand(
    lat: number,
    _climate: KoppenClass | null,
    elev: number | null,
    lng?: number,
): ElevationBand {
    if (elev === null) return 'lowland';
    const snowLine = snowLineFor(lat, lng);
    if (elev >= snowLine) return 'snow';
    if (elev >= 4000) return 'high_alpine';
    if (elev >= 2500) return 'alpine';
    if (elev >= 1000) return 'mountain';
    if (elev >= 400) return 'upland';
    return 'lowland';
}

function detectBiomeCore(lat: number, lng: number, elev: number | null): Biome {
    const climate = resolveClimateRegion(lat, lng);
    const band = resolveElevationBand(lat, climate, elev, lng);
    if (band === 'snow') return 'tundra_snow';
    return climate ? KOPPEN_TO_BIOME[climate] : fallbackBiomeForLatitude(lat);
}

/** 已取得海拔时使用，避免再次触发异步地形瓦片采样。 */
export function detectBiomeAtElevation(lat: number, lng: number, elev: number | null): Biome {
    return detectBiomeCore(lat, lng, elev);
}

/** 公开入口：只判 biome（海拔现采） */
export function detectBiome(lat: number, lng: number): Biome {
    const elev = LandSeaSystem.getSampler().getElevationSync(lat, lng);
    return detectBiomeCore(lat, lng, elev);
}

/**
 * 最终入口：给战场中心经纬度 + 本场季节，选一张 DE 地形贴图名。
 * 每场一张、全场统一，纯 createPattern 重复铺（铁律）。
 */
export function resolveTerrainTile(lat: number, lng: number, season: 0 | 1 | 2, rng: RandomSource = mathRandomSource): string {
    const sampler = LandSeaSystem.getSampler();
    const sample = sampler.getElevationAndSlopeSync(lat, lng);
    const elev = sample?.elevationM ?? null;
    return resolveTerrainTileAtElevation(lat, lng, elev, season, rng);
}

/** 已取得海拔时使用：保证主地形与本场环境方案使用同一份采样结果。 */
export function resolveTerrainTileAtElevation(
    lat: number,
    lng: number,
    elev: number | null,
    season: 0 | 1 | 2,
    rng: RandomSource = mathRandomSource,
): string {
    const climate = resolveClimateRegion(lat, lng);
    const band = resolveElevationBand(lat, climate, elev);
    const biome = detectBiomeCore(lat, lng, elev);
    const theme = resolveDeMapTheme(lat, lng, biome, elev);
    void rng;
    return terrainForTheme(theme, biome, season, band);
}

// ── 植被树种表（P3，2026-08-20）——照抄工单 §B，勿自创 ──────────────────────────
// 资产名 = public/SUCAI_NATURE/<名>/ 的目录名（大写）。

/** biome × 季节(0绿/1橙/2白) → 树种候选（每场随机选 2~3 种混布） */
export const BIOME_TREES: Record<Biome, [string[], string[], string[]]> = {
    tropical_rainforest: [['JUNGLE', 'RAINFOREST', 'BRAZILWOOD'], ['JUNGLE', 'RAINFOREST', 'BRAZILWOOD'], ['JUNGLE', 'RAINFOREST', 'BRAZILWOOD']],
    savanna: [['ACACIA', 'BAOBAB'], ['ACACIA', 'BAOBAB'], ['ACACIA', 'DEAD_TREE']],
    desert: [['PALM', 'WAX_PALM', 'DEAD_TREE'], ['PALM', 'WAX_PALM', 'DEAD_TREE'], ['PALM', 'WAX_PALM', 'DEAD_TREE']],
    mediterranean: [['OLIVE', 'CYPRESS', 'ITALIAN_PINE', 'CYPRESS_DEC'], ['OLIVE', 'CYPRESS'], ['CYPRESS', 'DEAD_TREE']],
    cold_steppe: [['PINE', 'DEAD_TREE'], ['PINE', 'DEAD_TREE'], ['SNOW_PINE', 'DEAD_TREE']],
    temperate_grass: [['GREEN_OAK', 'BIRCH_GREEN'], ['AUTUMN_OAK', 'BIRCH_AUTUMN'], ['SNOW_AUTUMN_OAK', 'BIRCH_WINTER']],
    temperate_forest: [['GREEN_OAK', 'BIRCH_GREEN', 'WILLOW', 'ASIAN_MAPLE_GREEN', 'PEACH_BLOSSOM'], ['AUTUMN_OAK', 'ASIAN_MAPLE_AUTUMN', 'BIRCH_AUTUMN'], ['SNOW_AUTUMN_OAK', 'SNOW_PINE', 'BIRCH_WINTER', 'DEAD_TREE']],
    boreal: [['PINE', 'ASIAN_PINE'], ['PINE', 'AUTUMN_OAK'], ['SNOW_PINE', 'DEAD_TREE']],
    tundra_snow: [['DEAD_TREE', 'SNOW_PINE'], ['DEAD_TREE', 'SNOW_PINE'], ['DEAD_TREE', 'SNOW_PINE']],
};

/** biome → 灌木/草/花/岩石（低频散布，尺寸小、数量约为树的 2~3 倍） */
export const BIOME_GROUND_DECOR: Record<Biome, string[]> = {
    tropical_rainforest: ['PLANT_JUNGLE', 'PLANT_RAINFOREST', 'FERNPATCH', 'ROCK_JUNGLE', 'UNDERBRUSH_RAINFOREST'],
    savanna: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'CACTUS', 'PLANT_DEAD', 'ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE'],
    desert: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'CACTUS', 'PLANT_DEAD', 'ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE'],
    mediterranean: ['FLOWER_1', 'FLOWER_2', 'FLOWER_3', 'FLOWER_4', 'FLOWERBED', 'SHRUB_GREEN'],
    cold_steppe: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'PLANT_DEAD', 'ROCK1', 'ROCK2'],
    temperate_grass: ['GRASS_GREEN', 'GRASS_GREEN_PATCH', 'BUSH_GREEN', 'UNDERBRUSH'],
    temperate_forest: ['GRASS_GREEN', 'GRASS_GREEN_PATCH', 'BUSH_GREEN', 'UNDERBRUSH'],
    boreal: ['SHRUB_GREEN', 'ROCK1', 'ROCK2', 'ROCK3', 'DECAL_ICE'],
    tundra_snow: ['SHRUB_GREEN', 'ROCK1', 'ROCK2', 'ROCK3', 'DECAL_ICE'],
};

/** L2 山地追加大件（elev≥800 或坡度≥12° 时贴边撒） */
export const MOUNTAIN_ASSETS: string[] = [
    'MOUNTAIN_01', 'MOUNTAIN_02', 'MOUNTAIN_03', 'MOUNTAIN_04', 'MOUNTAIN_05', 'MOUNTAIN_06',
    'MOUNTAIN_07', 'MOUNTAIN_08', 'MOUNTAIN_09', 'MOUNTAIN_10', 'MOUNTAIN_11',
    'CLIFF_DEFAULT', 'CLIFF_LIMESTONE', 'CLIFF_SAND', 'CLIFF_SNOW', 'CLIFF_TERRACE', 'CLIFF_MARBLE',
    'SHORT_CLIFF_ALL', 'SHORT_CLIFF_MARBLE', 'SHORT_CLIFF_SAND', 'SHORT_CLIFF_SNOW',
    'ROCK_PILLAR',
];

/**
 * 地表备用变体：P2 定稿映射（每季一张）之外的富余贴图，L3 低频散贴打散单调。
 * 覆盖核对：des/ds2/qs 已进主映射，其余沙漠变体（ds3/ds4/ds5/pal/pal1/snd）、
 * 草地变体（gr7）、稀树变体（pc3/sr2）、林地地表（fo2/underbrush_leaves）、
 * 砾石/岩（gravel_wet/r01）全在此表，无一闲置。
 */
export const BIOME_GROUND_VARIATION: Record<Biome, string[]> = {
    tropical_rainforest: ['fo2', 'underbrush_leaves'],
    savanna: ['gr7', 'pc3', 'sr2'],
    desert: ['ds3', 'ds4', 'ds5', 'pal', 'pal1'], // 🔴 [2026-08-23 清账] 移除 snd（雪地基，误入沙漠变体池）
    mediterranean: ['gr7', 'sr2'],
    cold_steppe: ['pc1', 'pc2', 'pm1', 'r01'],
    temperate_grass: ['gr7', 'sr2'],
    temperate_forest: ['fo2', 'underbrush_leaves'],
    boreal: ['fo2', 'r01', 'gravel_wet'],
    tundra_snow: ['r01', 'gravel_wet', 'snd'],
};

/** 东亚限定树种（樱花/竹/亚洲枫/亚洲松）：非东亚文化区不得出现（沃罗涅日=斯拉夫 → 无樱花） */
export const EAST_ASIA_ONLY_TREES: ReadonlySet<string> = new Set([
    'PEACH_BLOSSOM', 'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'BAMBOO', 'LUSH_BAMBOO', 'ASIAN_PINE',
]);

/** 亚热带（Cwa/Cwb）不该出现的北温带白桦：亚热带常绿阔叶林无白桦（符合历史，主人 2026-08-20 定） */
export const SUBTROPICAL_EXCLUDED_TREES: ReadonlySet<string> = new Set([
    'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER',
]);

/** 从树种池随机选 2~3 种混布（树可混种，与地形不同；非东亚过滤掉樱花/竹/亚洲枫） */
export function pickTreeSpecies(biome: Biome, season: 0 | 1 | 2, rng: RandomSource = mathRandomSource, isEastAsia = true, isSubtropical = false): string[] {
    let pool = BIOME_TREES[biome][season];
    if (!isEastAsia) pool = pool.filter((t) => !EAST_ASIA_ONLY_TREES.has(t));
    if (isSubtropical) pool = pool.filter((t) => !SUBTROPICAL_EXCLUDED_TREES.has(t));
    const n = Math.min(pool.length, 2 + rng.int(0, 1));
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, n);
}

/** 每场树木数量（按 biome 密度；tundra 极稀、森林茂密） */
export function treeCountFor(biome: Biome, rng: RandomSource = mathRandomSource): number {
    switch (biome) {
        case 'tundra_snow':
            return 3 + rng.int(0, 2);        // 2~5 极稀
        case 'desert':
            return 6 + rng.int(0, 4);        // 6~10 稀疏
        case 'cold_steppe':
            return 5 + rng.int(0, 4);
        case 'savanna':
        case 'mediterranean':
            return 9 + rng.int(0, 5);        // 9~14
        case 'tropical_rainforest':
        case 'temperate_forest':
            return 15 + rng.int(0, 9);      // 15~24 茂密
        default:
            return 11 + rng.int(0, 7);       // 11~18 温带草原/寒带
    }
}
