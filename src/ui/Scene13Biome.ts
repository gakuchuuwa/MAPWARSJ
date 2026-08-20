/**
 * 13 战场 biome 判定（P2，2026-08-20）。
 *
 * 判定顺序（先硬后软）：
 *   1. 雪线（按纬度动态）→ tundra_snow
 *   2. 地中海气候带（30~45° 近海）→ mediterranean
 *   3. 卫星色（ESRI World Imagery 中位色）→ 直接映射
 *   4. 纬度带兜底
 *   5. 文化区修正（青藏/西域/河西/中亚特化区）
 * 再叠 L2 地貌修正（海拔/坡度 → 岩石/高原/雪）→ 最终选一张 DE 地形贴图。
 *
 * 铺地铁律不变：每场一张、全场统一、纯 createPattern 重复铺。
 */
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { ImagerySampler } from '../world/land-sea/ImagerySampler';
import { getRegion } from '../systems/RegionSystem';
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
const BIOME_TERRAIN: Record<Biome, [string, string, string]> = {
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
function isNearSea(lat: number, lng: number): boolean {
    const ws = LandSeaSystem.getWaterSampler();
    const off = 1.0;
    const pts: Array<[number, number]> = [
        [lat, lng],
        [lat + off, lng],
        [lat - off, lng],
        [lat, lng + off],
        [lat, lng - off],
    ];
    for (const [la, lo] of pts) {
        if (ws.isWaterSync(la, lo) === true) return true;
    }
    return false;
}

/** 纬度带：采样未命中时的主判据 */
function latBand(lat: number, lng: number, green: boolean): Biome {
    const absLat = Math.abs(lat);
    if (absLat < 12) return 'tropical_rainforest';
    if (absLat < 23) return 'savanna';
    if (absLat < 35) {
        if (green) return 'mediterranean'; // 绿 → 强制排除 desert
        return isNearSea(lat, lng) ? 'mediterranean' : 'desert';
    }
    if (absLat < 50) return green ? 'temperate_forest' : 'temperate_grass';
    if (absLat < 66) return 'boreal';
    return 'tundra_snow';
}

function detectBiomeCore(
    lat: number,
    lng: number,
    absLat: number,
    elev: number | null,
    snowLine: number
): Biome {
    // 1. 雪线 / 极地（最硬）
    if (elev !== null && elev >= snowLine) return 'tundra_snow';
    if (absLat >= 66) return 'tundra_snow';

    // 2. 地中海气候带（30~45° 近海）：方案 §2.2 + 验收「塞维利亚→gr2」。
    //    必须先于卫星色，否则 37° 塞维利亚会被「yellow→desert」误判成沙漠。
    if (absLat >= 30 && absLat < 45 && isNearSea(lat, lng)) return 'mediterranean';

    const reg = getRegion(lat, lng);

    // 3. 卫星色（命中才用）
    const tone = ImagerySampler.getInstance().getToneSync(lat, lng);
    if (tone !== null) {
        switch (tone) {
            case 'white':
                return 'tundra_snow';
            case 'gray':
                return 'desert'; // 高海拔灰 → L2 换岩石地表
            case 'yellow':
                return yellowBiome(lat, lng, absLat, reg);
            case 'green':
                return latBand(lat, lng, true);
            case 'blue':
                return latBand(lat, lng, false);
        }
    }

    // 4. 纬度带兜底
    const band = latBand(lat, lng, false);

    // 5. 文化区修正（覆盖纬度带对特化区的粗判；采样命中时不会走到这里）
    if (reg === 'TIBET') return 'tundra_snow';
    if (isDesertRegion(reg)) return 'desert';
    // STEPPE/NORTH/NORTHEAST 是干旱草原非荒漠，纬度带已给 temperate_grass，无需改

    return band;
}

/** 真正荒漠文化区（yellow 在这些区 → 沙漠） */
function isDesertRegion(reg: ReturnType<typeof getRegion>): boolean {
    return reg === 'WESTERN' || reg === 'HEXI' || reg === 'CENTRAL_ASIA';
}

/** 干旱草原文化区（yellow 在这些区 → 温带草原，不是沙漠） */
function isSteppeRegion(reg: ReturnType<typeof getRegion>): boolean {
    return reg === 'STEPPE' || reg === 'NORTH' || reg === 'NORTHEAST';
}

/**
 * 「yellow」（H20~60）既覆盖沙漠沙色、也覆盖草原枯黄——卫星色分不开，
 * 必须用文化区拆：西域/河西/中亚=荒漠，草原/北方/东北=温带草原。
 * 无文化区信息时退回纬度带：<35° 内陆荒漠、≥35° 草原。
 */
function yellowBiome(lat: number, lng: number, absLat: number, reg: ReturnType<typeof getRegion>): Biome {
    if (absLat < 23) return 'savanna';
    if (isDesertRegion(reg)) return 'desert';
    if (isSteppeRegion(reg)) return 'temperate_grass';
    return absLat < 35 ? 'desert' : 'temperate_grass';
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
