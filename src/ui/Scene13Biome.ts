/**
 * 13 战场 biome 判定（P2，2026-08-20）。
 *
 * 判定顺序（先硬后软）：
 *   1. 雪线（按纬度动态）→ tundra_snow
 *   2. 极地（|lat|≥66°）→ tundra_snow
 *   3. 文化区硬基线（REGION_BIOME，优先于纬度和卫星色）
 * 再叠 L2 地貌修正（海拔/坡度 → 岩石/高原/雪）→ 最终选一张 DE 地形贴图。
 *
 * 铺地铁律不变：每场一张、全场统一、纯 createPattern 重复铺。
 */
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { getRegion, type RegionType } from '../systems/RegionSystem';
import { RandomSource, mathRandomSource } from './scene13/Random';

export type Biome =
    | 'tropical_rainforest'
    | 'savanna'
    | 'desert'
    | 'mediterranean'
    | 'temperate_grass'
    | 'temperate_forest'
    | 'boreal'
    | 'tundra_snow';

/** 雪线（按纬度动态）：赤道 4800m → 60° 约 1000m */
export function snowLineFor(lat: number): number {
    return 4800 - Math.abs(lat) * 63;
}

/**
 * biome → 主地形（[夏/春, 秋, 冬]，对齐 sceneSeason 0/1/2）。照抄工单 §3，勿自创。
 */
export const BIOME_TERRAIN: Record<Biome, [string, string, string]> = {
    tropical_rainforest: ['gr8', 'gr8', 'gr8'],
    savanna: ['grs', 'pc1', 'gr5'],
    desert: ['des', 'ds2', 'qs'],
    mediterranean: ['gr2', 'gr4', 'gr5'],
    temperate_grass: ['gr6', 'gr4', 'sn2'],
    temperate_forest: ['gr3', 'for', 'sn2'],
    boreal: ['gr9', 'pm2', 'sno'],
    tundra_snow: ['sno', 'sno', 'ice'],
};

/** 无坐标兜底（13 初始化防御分支）：默认温带森林夏季草皮 */
export const DEFAULT_TERRAIN_TILE = 'gr3';

/**
 * 近海判定：中心或四周 ±1°（≈111km）任一为水 → 近海。
 * 半径取 1° 是因为塞维利亚距海 ~80km，±0.3°（33km）够不着。
 * 瓦片未缓存时 isWaterSync 返回 null（不算水）→ 本局判「内陆」，下局命中。
 */
/**
 * 文化区 → biome 硬基线（2026-08-20 主人定：区域基线优先于纬度和卫星色）。
 * 高程只能经 L2 修正为山地/高原，不改 biome（不会把湿润区改成沙漠）。
 */
const REGION_BIOME: Record<RegionType, Biome> = {
    SLAVIC: 'temperate_forest',      // 东欧温带落叶林
    GERMANIC: 'temperate_forest',    // 中北欧温带森林
    LATIN: 'mediterranean',          // 地中海气候（伊比利亚/意大利/法国南部）
    CENTRAL: 'temperate_forest',     // 中原温带落叶林（较湿润）
    NORTH: 'temperate_grass',        // 华北北部半干旱草原
    JIANGNAN: 'temperate_forest',    // 江南湿润亚热带（竹/枫/松/阔叶）
    LINGNAN: 'tropical_rainforest',  // 岭南亚热带常绿/热带
    BASHU: 'temperate_forest',       // 四川盆地湿润
    DIANQIAN: 'temperate_forest',    // 云贵高原湿润山地
    HEXI: 'desert',                  // 河西走廊干旱
    WESTERN: 'desert',               // 西域干旱
    TIBET: 'tundra_snow',            // 青藏高原高寒
    STEPPE: 'temperate_grass',       // 蒙古高原草原
    NORTHEAST: 'boreal',             // 东北寒温带针叶林
    KOREA: 'temperate_forest',       // 朝鲜湿润温带
    JAPAN: 'temperate_forest',       // 日本湿润温带
    CENTRAL_ASIA: 'desert',          // 中亚干旱
    WEST_ASIA: 'desert',             // 西亚以干旱为主（阿拉伯/埃及/两河）
};

function detectBiomeCore(
    lat: number,
    lng: number,
    absLat: number,
    elev: number | null,
    snowLine: number
): Biome {
    // 1. 雪线 / 极地（物理最硬，先于区域）
    if (elev !== null && elev >= snowLine) return 'tundra_snow';
    if (absLat >= 66) return 'tundra_snow';

    // 2. 文化区硬基线（优先于卫星色和纬度带）
    return REGION_BIOME[getRegion(lat, lng)];
}

/** 公开入口：只判 biome（海拔现采） */
export function detectBiome(lat: number, lng: number): Biome {
    const elev = LandSeaSystem.getSampler().getElevationSync(lat, lng);
    return detectBiomeCore(lat, lng, Math.abs(lat), elev, snowLineFor(lat));
}

/** L2 地貌修正：按海拔/坡度返回地表候选（列表，最终随机取一张） */
function l2Candidates(
    biomeMain: string,
    elev: number | null,
    slopeDeg: number | null,
    snowLine: number
): string[] {
    if (elev !== null) {
        if (elev >= snowLine) return ['sno', 'sn2', 'snf'];
        if (elev >= 2500) return ['pm2', 'qs2', 'gravel_default'];
        if (elev >= 800 || (slopeDeg !== null && slopeDeg >= 12)) {
            return ['rck', 'gravel_default', 'rock_wet'];
        }
        if (elev >= 200) return [biomeMain, biomeMain, biomeMain, 'pc1', 'pc2', 'pm1'];
    }
    return [biomeMain];
}

/**
 * 最终入口：给战场中心经纬度 + 本场季节，选一张 DE 地形贴图名。
 * 每场一张、全场统一，纯 createPattern 重复铺（铁律）。
 */
export function resolveTerrainTile(lat: number, lng: number, season: 0 | 1 | 2, rng: RandomSource = mathRandomSource): string {
    const snowLine = snowLineFor(lat);
    const sampler = LandSeaSystem.getSampler();
    const sample = sampler.getElevationAndSlopeSync(lat, lng);
    const elev = sample?.elevationM ?? null;
    const slope = sample?.slopeDeg ?? null;
    const biome = detectBiomeCore(lat, lng, Math.abs(lat), elev, snowLine);
    const biomeMain = BIOME_TERRAIN[biome][season];
    const candidates = l2Candidates(biomeMain, elev, slope, snowLine);
    return rng.pick(candidates);
}

// ── 植被树种表（P3，2026-08-20）——照抄工单 §B，勿自创 ──────────────────────────
// 资产名 = public/SUCAI_NATURE/<名>/ 的目录名（大写）。

/** biome × 季节(0绿/1橙/2白) → 树种候选（每场随机选 2~3 种混布） */
export const BIOME_TREES: Record<Biome, [string[], string[], string[]]> = {
    tropical_rainforest: [['JUNGLE', 'RAINFOREST', 'BRAZILWOOD'], ['JUNGLE', 'RAINFOREST', 'BRAZILWOOD'], ['JUNGLE', 'RAINFOREST', 'BRAZILWOOD']],
    savanna: [['ACACIA', 'BAOBAB'], ['ACACIA', 'BAOBAB'], ['ACACIA', 'DEAD_TREE']],
    desert: [['PALM', 'WAX_PALM', 'DEAD_TREE'], ['PALM', 'WAX_PALM', 'DEAD_TREE'], ['PALM', 'WAX_PALM', 'DEAD_TREE']],
    mediterranean: [['OLIVE', 'CYPRESS', 'ITALIAN_PINE', 'CYPRESS_DEC'], ['OLIVE', 'CYPRESS'], ['CYPRESS', 'DEAD_TREE']],
    temperate_grass: [['GREEN_OAK', 'BIRCH_GREEN'], ['AUTUMN_OAK', 'BIRCH_AUTUMN'], ['SNOW_AUTUMN_OAK', 'BIRCH_WINTER']],
    temperate_forest: [['GREEN_OAK', 'BIRCH_GREEN', 'WILLOW', 'ASIAN_MAPLE_GREEN', 'BAMBOO', 'PEACH_BLOSSOM'], ['AUTUMN_OAK', 'ASIAN_MAPLE_AUTUMN', 'BIRCH_AUTUMN'], ['SNOW_AUTUMN_OAK', 'SNOW_PINE', 'BIRCH_WINTER', 'DEAD_TREE']],
    boreal: [['PINE', 'ASIAN_PINE', 'MONKEY_PUZZLE'], ['PINE', 'AUTUMN_OAK'], ['SNOW_PINE', 'DEAD_TREE']],
    tundra_snow: [['DEAD_TREE', 'SNOW_PINE'], ['DEAD_TREE', 'SNOW_PINE'], ['DEAD_TREE', 'SNOW_PINE']],
};

/** biome → 灌木/草/花/岩石（低频散布，尺寸小、数量约为树的 2~3 倍） */
export const BIOME_GROUND_DECOR: Record<Biome, string[]> = {
    tropical_rainforest: ['PLANT_JUNGLE', 'PLANT_RAINFOREST', 'FERNPATCH', 'ROCK_JUNGLE', 'UNDERBRUSH_RAINFOREST'],
    savanna: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'CACTUS', 'PLANT_DEAD', 'ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE'],
    desert: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'CACTUS', 'PLANT_DEAD', 'ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE'],
    mediterranean: ['FLOWER_1', 'FLOWER_2', 'FLOWER_3', 'FLOWER_4', 'FLOWERBED', 'SHRUB_GREEN'],
    temperate_grass: ['GRASS_GREEN', 'GRASS_GREEN_PATCH', 'BUSH_GREEN', 'UNDERBRUSH'],
    temperate_forest: ['GRASS_GREEN', 'GRASS_GREEN_PATCH', 'BUSH_GREEN', 'UNDERBRUSH'],
    boreal: ['SHRUB_GREEN', 'ROCK1', 'ROCK2', 'ROCK3', 'DECAL_ICE'],
    tundra_snow: ['SHRUB_GREEN', 'ROCK1', 'ROCK2', 'ROCK3', 'DECAL_ICE'],
};

/** L2 山地追加大件（elev≥800 或坡度≥12° 时贴边撒） */
export const MOUNTAIN_ASSETS: string[] = [
    'MOUNTAIN_01', 'MOUNTAIN_02', 'MOUNTAIN_03', 'MOUNTAIN_04', 'MOUNTAIN_05', 'MOUNTAIN_06',
    'MOUNTAIN_07', 'MOUNTAIN_08', 'MOUNTAIN_09', 'MOUNTAIN_10', 'MOUNTAIN_11',
    'CLIFF_DEFAULT', 'CLIFF_LIMESTONE', 'CLIFF_SAND', 'CLIFF_SNOW', 'CLIFF_TERRACE',
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
    desert: ['ds3', 'ds4', 'ds5', 'pal', 'pal1', 'snd'],
    mediterranean: ['gr7', 'sr2'],
    temperate_grass: ['gr7', 'sr2'],
    temperate_forest: ['fo2', 'underbrush_leaves'],
    boreal: ['fo2', 'r01', 'gravel_wet'],
    tundra_snow: ['r01', 'gravel_wet', 'snd'],
};

/** 从树种池随机选 2~3 种混布（树可混种，与地形不同） */
export function pickTreeSpecies(biome: Biome, season: 0 | 1 | 2, rng: RandomSource = mathRandomSource): string[] {
    const pool = BIOME_TREES[biome][season];
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
