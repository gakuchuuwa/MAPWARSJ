/**
 * ZOOM 13 环境战场生成器（2026-08-20，CX 设计与开发步骤落地）。
 *
 * 只输出「战场方案」（纯数据），不直接访问 Canvas。Scene13WarLayer 只负责
 * 加载素材 + 把方案画到离屏画布。这样环境逻辑可以脱离整场战斗单独测试。
 *
 * 五层生成管线（照 AoE2 RMS 顺序）：
 *   LAND → ELEVATION → WATER → TERRAIN → OBJECTS
 *
 * 铁律：只影响 ZOOM 13 视觉；不碰 ZOOM 8/9/10；不碰战斗时间/胜负/兵力/伤害/阵型/出兵；
 * 不新增/修改城池坐标；不虚构历史环境；随机一律走注入的 RandomSource。
 */
import {
    Biome,
    type ElevationBand,
    type KoppenClass,
    detectBiomeAtElevation,
    resolveClimateRegion,
    resolveElevationBand,
    treeCountFor,
    DEFAULT_TERRAIN_TILE,
} from '../Scene13Biome';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import { getRegion } from '../../systems/RegionSystem';
import { RandomSource, createRandom, hashString } from './Random';
import {
    groundTilesForTheme,
    forestFloorTilesForTheme,
    decorForTheme,
    isSnowArea,
    resolveDeMapTheme,
    terrainForTheme,
    treesForTheme,
    type DeMapThemeId,
    type DeMapThemePalette,
} from './Scene13DeMapThemes';

/** 等距菱形瓦片（2:1，DE 同款投影） */
const TILE_W = 64;
const TILE_H = 32;

// ── 水域/沙滩贴图（真实存在于 public/SUCAI_TERRAIN，勿自创） ──
// 🔴 [2026-08-21 主人定] 13 战斗全为陆战，不出现深海大洋；水域全线采用「浅滩（sha/sh2/sh3）」贴图，
//   清浅透亮，沙石水底，步骑可涉水作战，与沙滩自然过渡。
/** 深水带（改用标准浅滩 sha） */
const SHALLOW_DEEP = 'sha';
/** 中水带（浅滩多变体 sha / sh2 / sh3） */
const SHALLOW_MEDIUM = ['sha', 'sh2', 'sh3'];
/** 近岸浅水带（透亮浅滩 sh2 / sh3） */
const SHALLOW_NEAR = ['sh2', 'sh3'];
/** 湿沙（水线） */
const BEACH_WET = 'beach_wet';
/** 内陆湖/水塘 */
const POND_TILES = ['wt_brown', 'wt_green', 'wt_yellow', 'wt_yellow2'];
/** 湖岸（普通） */
const POND_EDGE = ['sh2', 'sh3', 'sha'];
/** 湖岸（湿地/沼泽） */
const SWAMP_EDGE = ['sh4', 'sh5'];
/** 冬季冰面 */
const ICE_TILES = ['ice', 'ic2', 'ic3', 'ice_beach'];

// ── 方案数据结构 ──────────────────────────────────────────────

export type TerrainPatchCategory = 'forest-floor' | 'shore' | 'wetland' | 'farm' | 'ground-variation';

export interface TerrainPatchPlan {
    /** 地形贴图名（public/SUCAI_TERRAIN/<tile>.png） */
    tile: string;
    /** 等距网格格 (gx, gy) */
    cells: Array<[number, number]>;
    /** 屏幕空间连续遮罩；海岸使用它消除逐格菱形轮廓，cells 仍保留给占地区域判定。 */
    polygon?: Array<{ x: number; y: number }>;
    alpha: number;
    category: TerrainPatchCategory;
}

export interface EnvironmentObjectPlan {
    /** 自然装饰目录名（public/SUCAI_NATURE/<asset>/） */
    asset: string;
    /** 屏幕像素坐标（画布中心锚点，与 drawDecorSprite 口径一致） */
    x: number;
    y: number;
    /** ground 烙入地面；world 作为独立地图对象参与脚点深度排序 */
    layer: 'ground' | 'world';
    /** 同层稳定次序；不再用它代替世界对象的 y 深度 */
    z: number;
    /** DE DAT 中的对象碰撞半径（地图格）；未设置即不阻挡 */
    obstruction?: { x: number; y: number };
    /** 连续接触这么多秒后只关闭阻挡；图像仍作为 world 对象保留。 */
    obstructionReleaseAfterSec?: number;
    flip: boolean;
    /** 精灵帧（动画 sheet 用；静态素材忽略） */
    frame: number;
}

export interface ObjectRule {
    assets: readonly string[];
    groupCount: [number, number];
    objectsPerGroup: [number, number];
    groupRadius: [number, number];
    allowedBiomes: readonly Biome[];
    requiredTerrain?: string;
    minSpacing?: number;
}

export interface Scene13EnvironmentPlan {
    seed: string;
    /** 30 类 Köppen–Geiger 环境地区；无坐标防御分支为 null。 */
    climateRegion: KoppenClass | null;
    /** 该气候地区内部的海拔档。 */
    elevationBand: ElevationBand;
    elevationM: number | null;
    slopeDeg: number | null;
    biome: Biome;
    deMapTheme: DeMapThemeId | null;
    season: 0 | 1 | 2;
    baseTerrain: string;
    waterKind: 'sea' | 'lake' | 'none';
    grid: { gw: number; gh: number; ox: number; oy: number };
    elevation: number[][];
    terrainPatches: TerrainPatchPlan[];
    objects: EnvironmentObjectPlan[];
}

export interface Scene13EnvironmentInput {
    /** 战场中心经纬度（缺省走防御分支） */
    lat?: number;
    lng?: number;
    /** 显式种子（测试用）；不传则从经纬度 + 双方势力/武将 id 派生 */
    seed?: string;
    /** 画布宽（VW） */
    width: number;
    /** 画布高（VH） */
    height: number;
    /** 双方势力/武将 id（派生种子用，均真实数据） */
    attackerFactionId?: string | null;
    defenderFactionId?: string | null;
    attackerGeneralId?: string | null;
    defenderGeneralId?: string | null;
    /** 日历季节兜底（无坐标 / 采样失败时）；缺省 0 */
    getCalendarSeason?: () => 0 | 1 | 2;
    /** 测试用：强制 biome（覆盖 detectBiome 结果），便于无浏览器环境生成指定环境 */
    forceBiome?: Biome;
    /** 测试用：强制水域（覆盖 probeWater 结果），便于验证海岸/湖生成 */
    forceWaterKind?: 'sea' | 'lake' | 'none';
}

const HALF_TILE_OBSTRUCTION = { x: 0.5, y: 0.5 } as const;
const TREE_OBSTRUCTION_RELEASE_SEC = 3;
const TREE_MIN_CENTER_SPACING_TILES = 1.4;
const DE_TREE_OBJECTS = new Set([
    'DRAGON_TREE', 'BUSH_TREE_A', 'BUSH_TREE_B', 'BUSH_TREE_C',
    'JUNGLE', 'RAINFOREST', 'BRAZILWOOD', 'MANGROVE', 'ACACIA', 'BAOBAB',
    'PALM', 'WAX_PALM', 'DEAD_TREE', 'OLIVE', 'CYPRESS', 'CYPRESS_DEC',
    'ITALIAN_PINE', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK',
    'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'PEACH_BLOSSOM',
    'PINE', 'ASIAN_PINE', 'SNOW_PINE', 'MONKEY_PUZZLE',
    'LUSH_BAMBOO', 'BAMBOO', 'GREEN_OAK', 'BIRCH_GREEN', 'BIRCH_AUTUMN',
    'BIRCH_WINTER', 'WILLOW',
    'SCENARIO_TREE_A', 'SCENARIO_TREE_B', 'SCENARIO_TREE_C', 'SCENARIO_TREE_D',
    'SCENARIO_TREE_E', 'SCENARIO_TREE_F', 'SCENARIO_TREE_G', 'SCENARIO_TREE_H',
    'SCENARIO_TREE_I', 'SCENARIO_TREE_J', 'SCENARIO_TREE_K', 'SCENARIO_TREE_L',
]);
const GROUND_COVER_ASSETS = new Set([
    'GRASS_DRY', 'GRASS_DRY_PATCH', 'GRASS_GREEN', 'GRASS_GREEN_PATCH', 'WEED',
    'FLOWER', 'FLOWER_1', 'FLOWER_2', 'FLOWER_3', 'FLOWER_4', 'FLOWERBED',
    'PLANT_DEAD', 'PLANT_JUNGLE', 'PLANT_RAINFOREST', 'FERNPATCH', 'PLANT',
    'UNDERBRUSH', 'UNDERBRUSH_RAINFOREST', 'DECAL_ICE',
]);
const DE_HALF_TILE_OBJECTS = new Set([
    'DRAGON_TREE', 'BUSH_TREE_A', 'BUSH_TREE_B', 'BUSH_TREE_C',
    'JUNGLE', 'RAINFOREST', 'BRAZILWOOD', 'MANGROVE', 'ACACIA', 'BAOBAB',
    'PALM', 'WAX_PALM', 'DEAD_TREE', 'OLIVE', 'CYPRESS', 'CYPRESS_DEC',
    'ITALIAN_PINE', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK',
    'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'PEACH_BLOSSOM',
    'PINE', 'ASIAN_PINE', 'SNOW_PINE', 'MONKEY_PUZZLE', 'REEDS', 'WATER_LILY',
    'LUSH_BAMBOO', 'BAMBOO', 'GREEN_OAK', 'BIRCH_GREEN', 'BIRCH_AUTUMN',
    'BIRCH_WINTER', 'WILLOW', 'ROCK_FORMATION1', 'ROCK_FORMATION2',
    'ROCK_LIMESTONE', 'ROCK_JUNGLE', 'ROCK1', 'ROCK2', 'ROCK3',
    'FORAGE_BUSH', 'MINE_STONE', 'FELLED_GENERIC', 'FELLED_BAMBOO', 'FELLED_BAOBAB', 'FELLED_LUSH_BAMBOO',
    'STUMP_GENERIC', 'STUMP_BAMBOO', 'STUMP_BAOBAB', 'STUMP_LUSH_BAMBOO',
    'SCENARIO_TREE_A', 'SCENARIO_TREE_B', 'SCENARIO_TREE_C', 'SCENARIO_TREE_D',
    'SCENARIO_TREE_E', 'SCENARIO_TREE_F', 'SCENARIO_TREE_G', 'SCENARIO_TREE_H',
    'SCENARIO_TREE_I', 'SCENARIO_TREE_J', 'SCENARIO_TREE_K', 'SCENARIO_TREE_L',
    // 🔴 [2026-08-21 完善] 悬崖/矮悬崖 = 地形障碍，士兵不得穿过（buildCliffs 生成）
    'CLIFF_DEFAULT', 'CLIFF_LIMESTONE', 'CLIFF_SAND', 'CLIFF_SNOW', 'CLIFF_TERRACE', 'CLIFF_MARBLE',
    'SHORT_CLIFF_ALL', 'SHORT_CLIFF_MARBLE', 'SHORT_CLIFF_SAND', 'SHORT_CLIFF_SNOW',
]);
const DE_OBJECT_OBSTRUCTION: Readonly<Record<string, { x: number; y: number }>> = {
    ROCK_FORMATION3: { x: 1.5, y: 1.5 },
    ROCK_BEACH: { x: 1, y: 1 },
};

function attachDeObjectObstruction(objects: EnvironmentObjectPlan[]): void {
    for (const object of objects) {
        object.obstruction = DE_OBJECT_OBSTRUCTION[object.asset]
            ?? (DE_HALF_TILE_OBJECTS.has(object.asset) ? HALF_TILE_OBSTRUCTION : undefined);
        if (DE_TREE_OBJECTS.has(object.asset)) {
            object.obstructionReleaseAfterSec = TREE_OBSTRUCTION_RELEASE_SEC;
        }
    }
}

function getAssetRepulsionRadius(asset: string): number {
    if (asset.startsWith('CLIFF') || asset.startsWith('SHORT_CLIFF') || asset.startsWith('MOUNTAIN_')) return 140;
    if (asset.startsWith('ROCK_FORMATION') || asset === 'ROCK_PILLAR') return 90;
    if (asset.startsWith('ROCK') || asset.startsWith('MINE_') || asset.startsWith('STUMP_')) return 75;
    if (DE_TREE_OBJECTS.has(asset)) return 55;
    return 35; // 平面地饰 / 草花 / 冰面
}

function isObjectOverlapping(
    x: number,
    y: number,
    asset: string,
    objects: EnvironmentObjectPlan[],
    ignoreIdx: number = -1
): boolean {
    const r1 = getAssetRepulsionRadius(asset);
    for (let i = 0; i < objects.length; i++) {
        if (i === ignoreIdx) continue;
        const other = objects[i];
        const r2 = getAssetRepulsionRadius(other.asset);
        const minDist = r1 + r2;
        const dx = x - other.x;
        const dy = (y - other.y) * 2; // 等距 2:1 椭圆投影距离
        if (Math.hypot(dx, dy) < minDist) return true;
    }
    return false;
}

/** 全素材独立间距强制约束（悬崖、岩石、树木、矿产、地饰互斥，严禁贴脸穿插） */
function enforceAllObjectSpacing(objects: EnvironmentObjectPlan[]): void {
    const priority = (asset: string): number => {
        if (asset.startsWith('CLIFF') || asset.startsWith('SHORT_CLIFF')) return 4;
        if (asset.startsWith('ROCK') || asset.startsWith('MINE_')) return 3;
        if (DE_TREE_OBJECTS.has(asset)) return 2;
        return 1;
    };
    const sorted = [...objects].sort((a, b) => priority(b.asset) - priority(a.asset));
    const accepted: EnvironmentObjectPlan[] = [];

    for (const obj of sorted) {
        if (!isObjectOverlapping(obj.x, obj.y, obj.asset, accepted)) {
            accepted.push(obj);
        }
    }

    objects.length = 0;
    objects.push(...accepted);
}

// ── 种子派生（只用真实数据，禁止凭空假设 battleId） ──────────────

export function deriveEnvironmentSeed(input: {
    lat?: number;
    lng?: number;
    attackerFactionId?: string | null;
    defenderFactionId?: string | null;
    attackerGeneralId?: string | null;
    defenderGeneralId?: string | null;
}): string {
    const parts = [
        input.lat ?? '?',
        input.lng ?? '?',
        input.attackerFactionId ?? '?',
        input.defenderFactionId ?? '?',
        input.attackerGeneralId ?? '?',
        input.defenderGeneralId ?? '?',
    ];
    return parts.join('|');
}

// ── 等距网格（与 Scene13WarLayer.setupIsoGrid 同公式，保持单源一致） ──

interface IsoGrid {
    gw: number;
    gh: number;
    ox: number;
    oy: number;
}

function setupIsoGrid(VW: number, VH: number): IsoGrid {
    const H = Math.ceil(VW / 2 + VH) + TILE_H;
    const sum = Math.ceil(H / (TILE_H / 2));
    const gw = Math.ceil(sum / 2);
    const gh = sum - gw;
    const ox = VW / 2;
    const oy = (VH - (gw + gh) * (TILE_H / 2)) / 2;
    return { gw, gh, ox, oy };
}

function isoCellX(gx: number, gy: number, ox: number): number {
    return (gx - gy) * (TILE_W / 2) + ox;
}
function isoCellY(gx: number, gy: number, oy: number): number {
    return (gx + gy) * (TILE_H / 2) + oy;
}

/** 水域排斥谓词：屏幕坐标 (x, y) 是否落在水里（海=侧带；湖=中央 clump） */
type WaterChecker = (x: number, y: number) => boolean;

/** 屏幕坐标 → 等距网格 (gx, gy)（isoCellX/Y 的逆） */
function screenToGrid(x: number, y: number, ox: number, oy: number): [number, number] {
    const a = (x - ox) * 2 / TILE_W;   // gx - gy
    const b = (y - oy) * 2 / TILE_H;   // gx + gy
    return [Math.round((a + b) / 2), Math.round((b - a) / 2)];
}

/** 在非水域随机取一个屏幕坐标（水域内重采样，最多 60 次；兜底返回最后随机值） */
function sampleLandPos(
    VW: number,
    VH: number,
    rng: RandomSource,
    isWater: WaterChecker,
    asset?: string,
    objects?: EnvironmentObjectPlan[],
    inBattleCenter?: (x: number, y: number) => boolean,
): { x: number; y: number } {
    for (let attempt = 0; attempt < 80; attempt++) {
        const x = rng.next() * VW;
        const y = rng.next() * VH;
        if (isWater(x, y)) continue;
        if (inBattleCenter && inBattleCenter(x, y)) continue;
        if (asset && objects && isObjectOverlapping(x, y, asset, objects)) continue;
        return { x, y };
    }
    return { x: rng.next() * VW, y: rng.next() * VH };
}

// ── 水域探测（照抄 Scene13WarLayer.probeWater 口径，确定性） ──

function probeWater(lat: number | undefined, lng: number | undefined): 'sea' | 'lake' | 'none' {
    if (lat === undefined || lng === undefined) return 'none';
    const off = 0.8;
    const probes: Array<[number, number]> = [[0, 0], [off, 0], [-off, 0], [0, off], [0, -off]];
    for (const [dlat, dlng] of probes) {
        if (LandSeaSystem.isSeaAt({ lat: lat + dlat, lng: lng + dlng })) return 'sea';
        if (LandSeaSystem.getWaterSampler().isWaterSync(lat + dlat, lng + dlng) === true) return 'lake';
    }
    return 'none';
}

// ── 季节判定（以游戏日历为准：夏绿/秋橙/冬白；海拔/区域不再覆盖季节） ──

function resolveSeason(
    _lat: number | undefined,
    _lng: number | undefined,
    getCalendarSeason?: () => 0 | 1 | 2
): 0 | 1 | 2 {
    // 🔴 主人 2026-08-20 定：季节唯一权威 = 游戏日历。原「海拔≥600→秋、区域∈中亚/西域→秋」导致
    //    日历写「夏」战场却出红叶白桦（雷伊血训）。海拔/区域只影响 biome/地表/树密度，绝不改季节。
    return getCalendarSeason?.() ?? 0;
}

// ── clump 生长（照 RMS 斑块机制；注入 rng，不再 Math.random） ──

function growClump(
    seedGx: number,
    seedGy: number,
    target: number,
    gw: number,
    gh: number,
    occupied: Set<string>,
    rng: RandomSource
): Array<[number, number]> {
    const key = (x: number, y: number) => `${x},${y}`;
    const cells: Array<[number, number]> = [[seedGx, seedGy]];
    const frontier: Array<[number, number]> = [[seedGx, seedGy]];
    occupied.add(key(seedGx, seedGy));
    while (cells.length < target && frontier.length > 0) {
        const fi = rng.int(0, frontier.length - 1);
        const [cx, cy] = frontier[fi];
        const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (let i = 3; i > 0; i--) {
            const j = rng.int(0, i);
            const t = dirs[i];
            dirs[i] = dirs[j];
            dirs[j] = t;
        }
        let grown = false;
        for (const [dx, dy] of dirs) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
            const k = key(nx, ny);
            if (occupied.has(k)) continue;
            occupied.add(k);
            cells.push([nx, ny]);
            frontier.push([nx, ny]);
            grown = true;
            break;
        }
        if (!grown) frontier.splice(fi, 1);
    }
    return cells;
}

// ── 主入口 ─────────────────────────────────────────────────────

export function generateEnvironment(input: Scene13EnvironmentInput): Scene13EnvironmentPlan {
    const seed =
        input.seed ?? deriveEnvironmentSeed(input);
    const rng = createRandom(seed);
    const VW = input.width;
    const VH = input.height;
    const grid = setupIsoGrid(VW, VH);
    const { gw, gh, ox, oy } = grid;

    // ── 第 1 层 LAND：环境地区 / 海拔档 / biome / 季节 / 主地形 / 水域 ──
    const hasCoord = input.lat !== undefined && input.lng !== undefined;
    let elev: number | null = null;
    let slope: number | null = null;
    if (hasCoord) {
        const sample = LandSeaSystem.getSampler().getElevationAndSlopeSync(input.lat!, input.lng!);
        elev = sample?.elevationM ?? null;
        slope = sample?.slopeDeg ?? null;
    }
    const climateRegion = hasCoord ? resolveClimateRegion(input.lat!, input.lng!) : null;
    const elevationBand = hasCoord ? resolveElevationBand(input.lat!, climateRegion, elev) : 'lowland';
    const biome: Biome = input.forceBiome ?? (hasCoord ? detectBiomeAtElevation(input.lat!, input.lng!, elev) : 'temperate_forest');
    const season = resolveSeason(input.lat, input.lng, input.getCalendarSeason);
    const waterKind = input.forceWaterKind ?? probeWater(input.lat, input.lng);
    const reg = hasCoord ? getRegion(input.lat!, input.lng!) : null;
    const theme = hasCoord ? resolveDeMapTheme(input.lat!, input.lng!, biome, reg!, elev, waterKind) : null;
    const baseTerrain: string = theme
        ? terrainForTheme(theme, biome, season, elevationBand, input.lat, elev)
        : DEFAULT_TERRAIN_TILE;
    const patches: TerrainPatchPlan[] = [];
    const objects: EnvironmentObjectPlan[] = [];
    const occupied = new Set<string>();

    if (hasCoord) {
        // ── 第 2 层 ELEVATION：clump 生长 + 高度等级（低地少丘、高地多丘） ──
        const elevation = generateElevation(gw, gh, elev, slope, rng);

        // ── 第 3 层 WATER ──
        // 战斗层尚无山体碰撞/寻路：高程只用地面明暗表现可行走坡地，
        // 不把巨型山峰精灵放进士兵活动区，避免单位从山体上穿过。
        // 水域排斥谓词：陆地物件（植被/资源/残迹）禁止落在水里。
        let isWater: WaterChecker = () => false;
        if (waterKind === 'sea') {
            // 🔴 每场只抽一次 sideLeft：海岸地形 + 浅滩物件共用同一方向（P0 修复，勿再二次随机）
            const sideLeft = rng.chance(0.5);
            isWater = buildCoastline(gw, gh, ox, oy, VW, VH, sideLeft, rng, patches, occupied, theme!);
            for (let i = 0; i < 4; i++) {
                const ra = rng.pick(['ROCK_BEACH', 'ROCK1', 'ROCK2', 'OYSTERS', 'REEDS']);
                const oxPos = sideLeft ? VW * 0.12 + rng.next() * VW * 0.08 : VW * 0.88 - rng.next() * VW * 0.08;
                objects.push({ asset: ra, x: oxPos, y: rng.next() * VH, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
            }
        } else if (waterKind === 'lake') {
            isWater = buildLake(gw, gh, elev, season, rng, patches, objects, occupied, VW, VH, ox, oy, theme!);
        }

        // ── 第 4 层 TERRAIN：同一套 DE 主题内的地表变体 + 林地底层 ──
        buildGroundVariation(gw, gh, biome, season, theme!, rng, patches, occupied, input.lat, elev);
        buildForestFloor(gw, gh, biome, season, theme!, rng, patches, occupied, input.lat, elev);

        // ── 第 5 层 OBJECTS：同一套 DE 主题内的树 / 悬崖断崖 / 平面装饰 / 实体装饰 + 通用资源 ──
        buildVegetation(VW, VH, biome, elevationBand, season, theme!, rng, objects, isWater, input.lat, elev);
        buildResources(VW, VH, season, rng, objects, isWater);

        enforceAllObjectSpacing(objects);
        attachDeObjectObstruction(objects);
        return {
            seed, climateRegion, elevationBand, elevationM: elev, slopeDeg: slope,
            biome, deMapTheme: theme!.id, season, baseTerrain, waterKind, grid, elevation, terrainPatches: patches, objects,
        };
    }

    // 防御分支：无坐标 → 只有主地形，无斑块/物件/高程
    return {
        seed,
        climateRegion,
        elevationBand,
        elevationM: elev,
        slopeDeg: slope,
        biome,
        deMapTheme: null,
        season,
        baseTerrain,
        waterKind,
        grid,
        elevation: Array.from({ length: gh }, () => new Array(gw).fill(0)),
        terrainPatches: [],
        objects: [],
    };
}

// ── 第 2 层：高地（clump 生长；低地少丘、高地多丘） ─────────────

/**
 * 经典帝国时代式 2.5D 隆起丘陵与战术高地生成：
 * 生成连绵起伏的「隆起丘陵高地」（峰顶高台 + 斜坡肩部 + 坡脚基底三级渐进环），
 * 让地面真实隆起形成战略高地，士兵在高处占领制高点俯瞰交战。
 */
function generateElevation(
    gw: number,
    gh: number,
    elev: number | null,
    slope: number | null,
    rng: RandomSource
): number[][] {
    const grid: number[][] = Array.from({ length: gh }, () => new Array(gw).fill(0));
    
    // 丘陵数量与高度按真实地理海拔/坡度定：
    const hillCount = (elev !== null && (elev >= 800 || (slope !== null && slope >= 10)))
        ? 2 + rng.int(0, 2)   // 山地/高原：2~3 片大型连绵高地丘陵
        : (elev !== null && elev >= 300)
            ? 1 + rng.int(0, 2) // 丘陵台地：1~2 片战术丘陵
            : 1 + rng.int(0, 1); // 平原低地：1 片自然缓坡丘陵

    for (let i = 0; i < hillCount; i++) {
        // 丘陵中心分布于战场不同方位（左侧高地、右侧山脊、中央制高点）
        const cx = Math.floor(gw * (0.2 + rng.next() * 0.6));
        const cy = Math.floor(gh * (0.2 + rng.next() * 0.6));
        const rx = 7 + rng.next() * 5;  // 椭圆长轴 7~12 格
        const ry = 5.5 + rng.next() * 4; // 椭圆短轴 5.5~9.5 格
        const hMax = (elev !== null && elev >= 1000) ? 3 : (elev !== null && elev >= 300 ? 2 : 2);
        const angle = (rng.next() - 0.5) * 0.8; // 随机山脊走向倾角

        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const rxRot = dx * Math.cos(angle) - dy * Math.sin(angle);
                const ryRot = dx * Math.sin(angle) + dy * Math.cos(angle);
                const normDist = Math.sqrt((rxRot / rx) ** 2 + (ryRot / ry) ** 2);
                // 自然有机地形扰动噪声
                const noise = (Math.sin(x * 1.3 + y * 0.7) + Math.cos(x * 0.8 - y * 1.1)) * 0.07;
                const dist = normDist + noise;

                let h = 0;
                if (dist < 0.38) {
                    h = hMax; // 峰顶 / 高台制高点（Level 3 或 Level 2）
                } else if (dist < 0.72) {
                    h = Math.max(1, hMax - 1); // 斜坡肩部（Level 2 或 Level 1）
                } else if (dist < 1.05) {
                    h = 1; // 坡脚基底环（Level 1）
                }

                if (h > grid[y][x]) {
                    grid[y][x] = h;
                }
            }
        }
    }
    return grid;
}

// ── 第 3 层：海岸线（圈带分层 + 有机边界，照 coastal/water_blending.inc） ──

function buildCoastline(
    gw: number,
    gh: number,
    ox: number,
    oy: number,
    VW: number,
    VH: number,
    sideLeft: boolean,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    occupied: Set<string>,
    theme: DeMapThemePalette,
): WaterChecker {
    // 海岸线按屏幕 y 连续采样随机游走。格子仅供占地判定；最终绘制使用连续多边形。
    const controls: Array<{ x: number; y: number }> = [];
    let bx = VW * 0.14;
    const controlStep = TILE_H * 4;
    for (let y = -controlStep; y <= VH + controlStep; y += controlStep) {
        const x = sideLeft ? bx : VW - bx;
        controls.push({ x, y });
        bx += (rng.next() - 0.5) * TILE_W * 1.4;
        bx = Math.max(VW * 0.06, Math.min(VW * 0.24, bx));
    }

    // DE watershore 过渡图集的岸缘不是逐格直线：用 Catmull-Rom 穿过稀疏控制点，
    // 再以 1/4 格密采样，保留自然弯曲但消除一段段小方折线。
    const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t
            + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
            + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    };
    const shoreline: Array<{ x: number; y: number }> = [];
    const sampleStep = TILE_H / 4;
    for (let y = -TILE_H; y <= VH + TILE_H; y += sampleStep) {
        const segment = Math.max(0, Math.min(controls.length - 2, Math.floor((y + controlStep) / controlStep)));
        const p0 = controls[Math.max(0, segment - 1)];
        const p1 = controls[segment];
        const p2 = controls[Math.min(controls.length - 1, segment + 1)];
        const p3 = controls[Math.min(controls.length - 1, segment + 2)];
        const t = Math.max(0, Math.min(1, (y - p1.y) / Math.max(1, p2.y - p1.y)));
        const minX = sideLeft ? VW * 0.05 : VW * 0.76;
        const maxX = sideLeft ? VW * 0.24 : VW * 0.95;
        shoreline.push({ x: Math.max(minX, Math.min(maxX, catmullRom(p0.x, p1.x, p2.x, p3.x, t))), y });
    }

    const boundaryAt = (y: number): number => {
        const f = Math.max(0, Math.min(shoreline.length - 1, (y + TILE_H) / sampleStep));
        const i = Math.min(shoreline.length - 2, Math.floor(f));
        const t = f - i;
        return shoreline[i].x + (shoreline[i + 1].x - shoreline[i].x) * t;
    };
    const inlandSign = sideLeft ? 1 : -1;
    const bandPolygon = (outerOffset: number, innerOffset: number): Array<{ x: number; y: number }> => {
        const outer = shoreline.map((p) => ({ x: p.x + inlandSign * outerOffset, y: p.y }));
        const inner = shoreline.map((p) => ({ x: p.x + inlandSign * innerOffset, y: p.y })).reverse();
        return [...outer, ...inner];
    };

    const beachW = Math.round(TILE_W * 0.75);   // DE 标准自然沙滩边缘（收窄为约 58px，不再多层斑驳）

    const water: Array<[number, number]> = [];
    const beach: Array<[number, number]> = [];

    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = isoCellX(gx, gy, ox);
            const py = isoCellY(gx, gy, oy);
            if (py < -TILE_H || py > VH + TILE_H) continue; // 越界格不铺
            const signedDistance = (px - boundaryAt(py)) * inlandSign;
            if (signedDistance < 0) water.push([gx, gy]);
            else if (signedDistance < beachW) beach.push([gx, gy]);
        }
    }

    const mark = (cells: Array<[number, number]>) => { for (const [x, y] of cells) occupied.add(`${x},${y}`); };
    mark(water); mark(beach);

    // 1. 统一清透浅滩水体（DE 标准纯净浅水，不再多层分段条纹）
    patches.push({ tile: 'sh2', cells: water, polygon: bandPolygon(-VW, 0), alpha: 1, category: 'shore' });
    // 2. 柔和沙滩过渡边缘（DE 标准岸线衔接）
    patches.push({ tile: theme.beachTerrain, cells: beach, polygon: bandPolygon(0, beachW), alpha: 0.9, category: 'shore' });

    // 水域排斥：signedDistance < 0 即浅水（滩/陆均不算水）
    return (x, y) => (x - boundaryAt(y)) * inlandSign < 0;
}

// ── 第 3 层：内陆湖/湿地（clump 生长，连续区域非散点） ─────────

function buildLake(
    gw: number,
    gh: number,
    elev: number | null,
    season: 0 | 1 | 2,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    objects: EnvironmentObjectPlan[],
    occupied: Set<string>,
    VW: number,
    VH: number,
    ox: number,
    oy: number,
    theme: DeMapThemePalette,
): WaterChecker {
    const swamp = elev !== null && elev < 200 && rng.chance(0.35);
    if (season === 2) {
        // 冬季 → 冰面
        const iceTile = rng.pick(ICE_TILES);
        const n = 1 + rng.int(0, 2);
        for (let i = 0; i < n; i++) {
            const sx = 2 + rng.int(0, gw - 4), sy = 2 + rng.int(0, gh - 4);
            patches.push({ tile: iceTile, cells: growClump(sx, sy, 8 + rng.int(0, 6), gw, gh, occupied, rng), alpha: 1, category: 'wetland' });
        }
        for (let i = 0; i < 3; i++) objects.push({ asset: 'DECAL_ICE', x: rng.next() * VW, y: rng.next() * VH, layer: 'ground', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
        return () => false;
    }
    const pond = rng.pick(POND_TILES);
    const edgeTile = swamp ? rng.pick(SWAMP_EDGE) : rng.pick(POND_EDGE);
    const nClumps = 2 + rng.int(0, 2);
    const allPond: Array<[number, number]> = [];
    for (let i = 0; i < nClumps; i++) {
        const sx = 2 + rng.int(0, gw - 4), sy = 2 + rng.int(0, gh - 4);
        allPond.push(...growClump(sx, sy, 6 + rng.int(0, 5), gw, gh, occupied, rng));
    }
    // 描边：湖岸相邻格（连续区域）
    const pondSet = new Set(allPond.map(([x, y]) => `${x},${y}`));
    const edgeCells: Array<[number, number]> = [];
    const edgeSet = new Set<string>();
    for (const [x, y] of allPond) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
            const k = `${nx},${ny}`;
            if (!pondSet.has(k) && !edgeSet.has(k)) { edgeSet.add(k); edgeCells.push([nx, ny]); }
        }
    }
    patches.push({ tile: edgeTile, cells: edgeCells, alpha: 1, category: 'wetland' });
    patches.push({ tile: pond, cells: allPond, alpha: 1, category: 'wetland' });

    // 水岸芦苇/灌木（围绕水域）
    const px0 = allPond.length ? isoCellX(allPond[0][0], allPond[0][1], ox) : VW * 0.4;
    const py0 = allPond.length ? isoCellY(allPond[0][0], allPond[0][1], oy) : VH * 0.4;
    for (let i = 0; i < 4; i++) {
        const re = rng.pick(theme.waterPlants);
        const rx = Math.max(0, Math.min(VW, px0 + rng.next() * VW * 0.3 - VW * 0.15));
        const ry = Math.max(0, Math.min(VH, py0 + rng.next() * VH * 0.25 - VH * 0.12));
        objects.push({ asset: re, x: rx, y: ry, layer: 'world', z: 1, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }

    // 水域排斥：湖 = 中央 pond 格子集合（pondSet 见上文描边段）
    return (x, y) => {
        const [gx, gy] = screenToGrid(x, y, ox, oy);
        return pondSet.has(`${gx},${gy}`);
    };
}

// ── 第 4 层：地表变体（低频、低透明） ───────────────────────────

function buildGroundVariation(
    gw: number,
    gh: number,
    biome: Biome,
    season: 0 | 1 | 2,
    theme: DeMapThemePalette,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    occupied: Set<string>,
    lat?: number,
    elev?: number | null,
): void {
    const variation = groundTilesForTheme(theme, biome, season, lat, elev);
    for (let i = 0; i < 5; i++) {
        const t = rng.pick(variation);
        const sx = 1 + rng.int(0, gw - 2), sy = 1 + rng.int(0, gh - 2);
        patches.push({ tile: t, cells: growClump(sx, sy, 4 + rng.int(0, 5), gw, gh, occupied, rng), alpha: 0.22, category: 'ground-variation' });
    }
}

// ── 第 4 层：林地落叶层（森林 biome 的 forest-floor 斑块） ─────────

function buildForestFloor(
    gw: number,
    gh: number,
    biome: Biome,
    season: 0 | 1 | 2,
    theme: DeMapThemePalette,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    occupied: Set<string>,
    lat?: number,
    elev?: number | null,
): void {
    const tiles = forestFloorTilesForTheme(theme, biome, season, lat, elev);
    if (tiles.length === 0) return;
    const n = 1 + rng.int(0, 1);
    for (let i = 0; i < n; i++) {
        const sx = 2 + rng.int(0, gw - 4), sy = 2 + rng.int(0, gh - 4);
        patches.push({ tile: rng.pick(tiles), cells: growClump(sx, sy, 8 + rng.int(0, 10), gw, gh, occupied, rng), alpha: season === 2 ? 0.35 : 0.5, category: 'forest-floor' });
    }
}

// ── 第 5 层：植被（树聚丛 + 地面装饰 + 落叶） ─────────

function buildVegetation(
    VW: number,
    VH: number,
    biome: Biome,
    elevationBand: ElevationBand,
    season: 0 | 1 | 2,
    theme: DeMapThemePalette,
    rng: RandomSource,
    objects: EnvironmentObjectPlan[],
    isWater: WaterChecker,
    lat?: number,
    elev?: number | null,
): void {
    const treeAssets = treesForTheme(theme, season, lat, elev, biome);
    const baseTreeCount = treeCountFor(biome, rng);
    const treeFactor: Record<ElevationBand, number> = {
        lowland: 1,
        upland: 0.9,
        mountain: 0.65,
        alpine: 0.35,
        high_alpine: 0.1,
        snow: 0.05,
    };
    const treeCount = Math.max(2, Math.round(baseTreeCount * treeFactor[elevationBand]));
    // DE 聚丛成林：3~5 林斑 + 高斯散布
    const clusterCount = Math.max(2, Math.round(treeCount / 6));
    const perCluster = Math.max(2, Math.round(treeCount / clusterCount));
    const treePositions = objects
        .filter((object) => DE_TREE_OBJECTS.has(object.asset))
        .map((object) => ({ x: object.x, y: object.y }));
    const hasTreePassage = (x: number, y: number): boolean => treePositions.every((other) => {
        const dx = x - other.x, dy = y - other.y;
        const mapX = dx / TILE_W + dy / TILE_H;
        const mapY = dy / TILE_H - dx / TILE_W;
        return Math.abs(mapX) >= TREE_MIN_CENTER_SPACING_TILES
            || Math.abs(mapY) >= TREE_MIN_CENTER_SPACING_TILES;
    });
    // 中央战斗区留空（攻方左、守方右，中央交火区不长树，主人 2026-08-20 检查植被时定）
    const centerX0 = VW * 0.32, centerX1 = VW * 0.68;
    const centerY0 = VH * 0.24, centerY1 = VH * 0.76;
    const inBattleCenter = (x: number, y: number): boolean =>
        x > centerX0 && x < centerX1 && y > centerY0 && y < centerY1;
    let placed = 0;
    for (let c = 0; c < clusterCount && placed < treeCount; c++) {
        let cx = 0, cy = 0;
        for (let a = 0; a < 40; a++) {
            cx = VW * (0.15 + rng.next() * 0.7);
            cy = VH * (0.15 + rng.next() * 0.7);
            if (!isWater(cx, cy) && !inBattleCenter(cx, cy)) break;
        }
        const radius = 60 + rng.next() * 70;
        const n = Math.min(perCluster, treeCount - placed);
        for (let k = 0; k < n; k++) {
            // 🔴 Box-Muller 高斯半径无上界会越界 → 越界重新采样（非 clamp，避免树堆成边缘直线）
            let tx = 0, ty = 0;
            let found = false;
            for (let attempt = 0; attempt < 80; attempt++) {
                const u1 = Math.max(rng.next(), 1e-9), u2 = rng.next();
                const r = radius * Math.sqrt(-2 * Math.log(u1));
                const ang = u2 * Math.PI * 2;
                const sx = cx + r * Math.cos(ang);
                const sy = cy + r * Math.sin(ang);
                if (sx >= 0 && sx <= VW && sy >= 0 && sy <= VH && hasTreePassage(sx, sy) && !isWater(sx, sy) && !inBattleCenter(sx, sy) && !isObjectOverlapping(sx, sy, 'PINE', objects)) {
                    tx = sx;
                    ty = sy;
                    found = true;
                    break;
                }
            }
            if (!found) continue;
            objects.push({ asset: rng.pick(treeAssets), x: tx, y: ty, layer: 'world', z: 1, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
            treePositions.push({ x: tx, y: ty });
            placed++;
        }
    }

    // 地面装饰（灌木/草/花/岩石，冬季严禁出现绿花/夏草）
    const themeDecor = decorForTheme(theme, season, lat, elev, biome);
    const ground = [...themeDecor.flat, ...themeDecor.solid];
    const decorCount = 8 + rng.int(0, 8);   // 8~16 稀疏点缀（原 treeCount*2~4 过密如雪花，主人 2026-08-20 否）
    for (let i = 0; i < decorCount; i++) {
        const asset = rng.pick(ground);
        const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, inBattleCenter);
        objects.push({ asset, x: p.x, y: p.y, layer: GROUND_COVER_ASSETS.has(asset) ? 'ground' : 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }

}

// ── 第 5 层：资源点（低频；已删金矿 + 黄果灌木，主人 2026-08-20 定） ──

function buildResources(VW: number, VH: number, season: 0 | 1 | 2, rng: RandomSource, objects: EnvironmentObjectPlan[], isWater: WaterChecker): void {
    const resAssets = season === 2 ? ['MINE_STONE'] : ['FORAGE_BUSH', 'MINE_STONE'];
    const resCount = 2 + rng.int(0, 3);
    const centerX0 = VW * 0.32, centerX1 = VW * 0.68;
    const centerY0 = VH * 0.24, centerY1 = VH * 0.76;
    const inBattleCenter = (x: number, y: number): boolean =>
        x > centerX0 && x < centerX1 && y > centerY0 && y < centerY1;

    for (let i = 0; i < resCount; i++) {
        const asset = rng.pick(resAssets);
        const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, inBattleCenter);
        objects.push({ asset, x: p.x, y: p.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }
}


// 重新导出 hashString，供测试/验收计算种子校验和
export { hashString };
