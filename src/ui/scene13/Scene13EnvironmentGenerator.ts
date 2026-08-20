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
    resolveTerrainTileAtElevation,
    pickTreeSpecies,
    treeCountFor,
    BIOME_GROUND_DECOR,
    BIOME_GROUND_VARIATION,
    DEFAULT_TERRAIN_TILE,
} from '../Scene13Biome';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import { getRegion } from '../../systems/RegionSystem';
import { RandomSource, createRandom, hashString } from './Random';

/** 等距菱形瓦片（2:1，DE 同款投影） */
const TILE_W = 64;
const TILE_H = 32;

// ── 水域/沙滩贴图（真实存在于 public/SUCAI_TERRAIN，勿自创） ──
/** 深水（离岸最远，最深） */
const WATER_DEEP = 'wtr';
/** 中水带 */
const WATER_MEDIUM = ['wt4', 'wt5'];
/** 浅水带 */
const WATER_SHALLOW = ['wt2', 'wt3'];
/** 沙滩 */
const BEACH_SAND = ['bch', 'bc2', 'bc3', 'bc4'];
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
    'JUNGLE', 'RAINFOREST', 'BRAZILWOOD', 'MANGROVE', 'ACACIA', 'BAOBAB',
    'PALM', 'WAX_PALM', 'DEAD_TREE', 'OLIVE', 'CYPRESS', 'CYPRESS_DEC',
    'ITALIAN_PINE', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK',
    'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'PEACH_BLOSSOM',
    'PINE', 'ASIAN_PINE', 'SNOW_PINE', 'MONKEY_PUZZLE',
    'LUSH_BAMBOO', 'BAMBOO', 'GREEN_OAK', 'BIRCH_GREEN', 'BIRCH_AUTUMN',
    'BIRCH_WINTER', 'WILLOW',
]);
const DE_HALF_TILE_OBJECTS = new Set([
    'JUNGLE', 'RAINFOREST', 'BRAZILWOOD', 'MANGROVE', 'ACACIA', 'BAOBAB',
    'PALM', 'WAX_PALM', 'DEAD_TREE', 'OLIVE', 'CYPRESS', 'CYPRESS_DEC',
    'ITALIAN_PINE', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK',
    'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'PEACH_BLOSSOM',
    'PINE', 'ASIAN_PINE', 'SNOW_PINE', 'MONKEY_PUZZLE', 'REEDS',
    'LUSH_BAMBOO', 'BAMBOO', 'GREEN_OAK', 'BIRCH_GREEN', 'BIRCH_AUTUMN',
    'BIRCH_WINTER', 'WILLOW', 'ROCK_FORMATION1', 'ROCK_FORMATION2',
    'ROCK_LIMESTONE', 'ROCK_JUNGLE', 'ROCK1', 'ROCK2', 'ROCK3',
    'FORAGE_BUSH', 'MINE_STONE', 'FELLED_GENERIC',
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

function enforceTreeSpacing(objects: EnvironmentObjectPlan[]): void {
    const accepted: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < objects.length;) {
        const object = objects[i];
        if (!DE_TREE_OBJECTS.has(object.asset)) {
            i++;
            continue;
        }
        const separated = accepted.every((other) => {
            const dx = object.x - other.x, dy = object.y - other.y;
            const mapX = dx / TILE_W + dy / TILE_H;
            const mapY = dy / TILE_H - dx / TILE_W;
            return Math.abs(mapX) >= TREE_MIN_CENTER_SPACING_TILES
                || Math.abs(mapY) >= TREE_MIN_CENTER_SPACING_TILES;
        });
        if (!separated) {
            objects.splice(i, 1);
            continue;
        }
        accepted.push({ x: object.x, y: object.y });
        i++;
    }
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
function sampleLandPos(VW: number, VH: number, rng: RandomSource, isWater: WaterChecker): { x: number; y: number } {
    for (let attempt = 0; attempt < 60; attempt++) {
        const x = rng.next() * VW;
        const y = rng.next() * VH;
        if (!isWater(x, y)) return { x, y };
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

// ── 季节判定（照抄 Scene13WarLayer.currentSeasonKind 口径，确定性） ──

function resolveSeason(
    lat: number | undefined,
    lng: number | undefined,
    getCalendarSeason?: () => 0 | 1 | 2
): 0 | 1 | 2 {
    if (lat !== undefined && lng !== undefined) {
        try {
            const sampler = LandSeaSystem.getSampler();
            const elev = sampler.getElevationSync(lat, lng);
            if (elev !== null) {
                if (elev >= 3600) return 2;
                if (elev >= 600) return 1;
                return 0;
            }
            sampler.scheduleFetch(lat, lng);
            const reg = getRegion(lat, lng);
            if (reg === 'TIBET') return 2;
            if (reg === 'WESTERN' || reg === 'STEPPE' || reg === 'HEXI' || reg === 'NORTH' || reg === 'CENTRAL_ASIA' || reg === 'NORTHEAST') {
                return 1;
            }
        } catch {
            // 采样异常 → 走日历兜底
        }
    }
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
    const baseTerrain: string = hasCoord
        ? resolveTerrainTileAtElevation(input.lat!, input.lng!, elev, season, rng)
        : DEFAULT_TERRAIN_TILE;
    const waterKind = input.forceWaterKind ?? probeWater(input.lat, input.lng);
    const reg = hasCoord ? getRegion(input.lat!, input.lng!) : null;

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
            // 🔴 每场只抽一次 sideLeft：海岸地形 + 礁石共用同一方向（P0 修复，勿再二次随机）
            const sideLeft = rng.chance(0.5);
            isWater = buildCoastline(gw, gh, ox, oy, VW, VH, sideLeft, rng, patches, occupied);
            for (let i = 0; i < 4; i++) {
                const ra = rng.chance(0.5) ? 'ROCK_BEACH' : (rng.chance(0.5) ? 'ROCK_SEA1' : 'ROCK_SEA2');
                objects.push({ asset: ra, x: sideLeft ? VW * 0.18 + rng.next() * VW * 0.06 : VW * 0.82 - rng.next() * VW * 0.06, y: rng.next() * VH, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
            }
        } else if (waterKind === 'lake') {
            isWater = buildLake(gw, gh, elev, season, rng, patches, objects, occupied, VW, VH, ox, oy);
        }

        // ── 第 4 层 TERRAIN：农田 + 地表变体 + 林地落叶层 ──
        buildFarms(gw, gh, elev, reg, rng, patches, occupied);
        buildGroundVariation(gw, gh, biome, elevationBand, slope, rng, patches, occupied);
        buildForestFloor(gw, gh, biome, rng, patches, occupied);

        // ── 第 5 层 OBJECTS：树（聚丛）/ 地面装饰 / 资源 / 残迹 / 落叶 ──
        buildVegetation(VW, VH, biome, elevationBand, season, rng, objects, isWater);
        buildResources(VW, VH, rng, objects, isWater);
        buildDebris(VW, VH, rng, objects, isWater);

        enforceTreeSpacing(objects);
        attachDeObjectObstruction(objects);
        return {
            seed, climateRegion, elevationBand, elevationM: elev, slopeDeg: slope,
            biome, season, baseTerrain, waterKind, grid, elevation, terrainPatches: patches, objects,
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

function generateElevation(
    gw: number,
    gh: number,
    elev: number | null,
    slope: number | null,
    rng: RandomSource
): number[][] {
    const grid: number[][] = Array.from({ length: gh }, () => new Array(gw).fill(0));
    // 丘陵数量按海拔/坡度定：低地少、高地多
    let hillCount: number;
    let peakChance: number;
    if (elev !== null && (elev >= 800 || (slope !== null && slope >= 12))) {
        hillCount = 5 + rng.int(0, 1);   // 5~6 山地多丘
        peakChance = 0.9;
    } else if (elev !== null && elev >= 200) {
        hillCount = 3 + rng.int(0, 1);   // 3~4
        peakChance = 0.6;
    } else {
        hillCount = 1 + rng.int(0, 1);   // 1~2 平原少丘
        peakChance = 0.2;
    }
    const elevOcc = new Set<string>();
    for (let i = 0; i < hillCount; i++) {
        const lvl = rng.chance(0.3) ? 2 : 1;
        const sx = 3 + rng.int(0, gw - 6);
        const sy = 3 + rng.int(0, gh - 6);
        const cells = growClump(sx, sy, 10 + rng.int(0, 15), gw, gh, elevOcc, rng);
        for (const [x, y] of cells) if (grid[y][x] < lvl) grid[y][x] = lvl;
    }
    if (rng.chance(peakChance)) {
        const sx = 4 + rng.int(0, gw - 8);
        const sy = 4 + rng.int(0, gh - 8);
        const cells = growClump(sx, sy, 5 + rng.int(0, 6), gw, gh, elevOcc, rng);
        for (const [x, y] of cells) grid[y][x] = 3;
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
    occupied: Set<string>
): WaterChecker {
    // 海岸线按屏幕 y 连续采样随机游走。格子仅供占地判定；最终绘制使用连续多边形。
    const shoreline: Array<{ x: number; y: number }> = [];
    let bx = VW * 0.18;
    const step = TILE_W * 0.8;
    for (let y = -TILE_H; y <= VH + TILE_H; y += TILE_H) {
        const x = sideLeft ? bx : VW - bx;
        shoreline.push({ x, y });
        bx += (rng.next() - 0.5) * step;
        bx = Math.max(VW * 0.08, Math.min(VW * 0.32, bx));
    }

    const boundaryAt = (y: number): number => {
        const f = Math.max(0, Math.min(shoreline.length - 1, (y + TILE_H) / TILE_H));
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

    const beachW = TILE_W * 1.5;   // 沙滩带
    const shallowW = TILE_W * 1.2; // 浅水带
    const mediumW = TILE_W * 1.5;  // 中水带
    const wetW = TILE_W;           // 湿沙水线

    const deep: Array<[number, number]> = [];
    const medium: Array<[number, number]> = [];
    const shallow: Array<[number, number]> = [];
    const beach: Array<[number, number]> = [];
    const wet: Array<[number, number]> = [];

    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = isoCellX(gx, gy, ox);
            const py = isoCellY(gx, gy, oy);
            if (py < -TILE_H || py > VH + TILE_H) continue; // 越界格不铺
            const signedDistance = (px - boundaryAt(py)) * inlandSign;
            if (signedDistance < -shallowW - mediumW) deep.push([gx, gy]);
            else if (signedDistance < -shallowW) medium.push([gx, gy]);
            else if (signedDistance < 0) shallow.push([gx, gy]);
            else if (signedDistance < wetW) wet.push([gx, gy]);
            else if (signedDistance < wetW + beachW) beach.push([gx, gy]);
        }
    }

    const mark = (cells: Array<[number, number]>) => { for (const [x, y] of cells) occupied.add(`${x},${y}`); };
    mark(deep); mark(medium); mark(shallow); mark(beach); mark(wet);

    patches.push({ tile: WATER_DEEP, cells: deep, polygon: bandPolygon(-VW, -shallowW - mediumW), alpha: 1, category: 'shore' });
    patches.push({ tile: rng.pick(WATER_MEDIUM), cells: medium, polygon: bandPolygon(-shallowW - mediumW, -shallowW), alpha: 1, category: 'shore' });
    patches.push({ tile: rng.pick(WATER_SHALLOW), cells: shallow, polygon: bandPolygon(-shallowW, 0), alpha: 1, category: 'shore' });
    patches.push({ tile: BEACH_WET, cells: wet, polygon: bandPolygon(0, wetW), alpha: 1, category: 'shore' });
    patches.push({ tile: rng.pick(BEACH_SAND), cells: beach, polygon: bandPolygon(wetW, wetW + beachW), alpha: 1, category: 'shore' });

    // 水域排斥：signedDistance < 0 即深/中/浅水（滩/湿沙/陆均不算水）
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
    oy: number
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
        const re = swamp ? 'UNDERBRUSH_JUNGLE' : rng.pick(['REEDS', 'WILLOW', 'MANGROVE', 'LUSH_BAMBOO']);
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

// ── 第 4 层：农田/梯田 ─────────────────────────────────────────

function buildFarms(
    gw: number,
    gh: number,
    elev: number | null,
    reg: ReturnType<typeof getRegion> | null,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    occupied: Set<string>
): void {
    if (elev === null) return;
    // 东亚水田 / 其余旱田；东亚山地梯田
    const isEastAsia = reg === 'CENTRAL' || reg === 'JIANGNAN' || reg === 'LINGNAN' || reg === 'JAPAN' || reg === 'KOREA';
    if (isEastAsia && elev >= 800) {
        // 东亚山地梯田
        const t = rng.pick(['rm1', 'rm2']);
        patches.push({ tile: t, cells: growClump(2, 2, 14 + rng.int(0, 8), gw, gh, occupied, rng), alpha: 1, category: 'farm' });
    } else if (elev < 600) {
        const canFarm = isEastAsia || reg === 'LATIN' || reg === 'GERMANIC' || reg === 'WEST_ASIA' || reg === 'SLAVIC' || reg === 'CENTRAL_ASIA';
        if (canFarm) {
            const tiles = isEastAsia ? ['fm1', 'rc1', 'rc2', 'rc3'] : ['fc1', 'fc2', 'fc3', 'fm2'];
            const t = rng.pick(tiles);
            patches.push({ tile: t, cells: growClump(gw - 3, gh - 3, 11 + rng.int(0, 11), gw, gh, occupied, rng), alpha: 1, category: 'farm' });
        }
    }
}

// ── 第 4 层：地表变体（低频、低透明） ───────────────────────────

function buildGroundVariation(
    gw: number,
    gh: number,
    biome: Biome,
    elevationBand: ElevationBand,
    slopeDeg: number | null,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    occupied: Set<string>
): void {
    const variation = BIOME_GROUND_VARIATION[biome];
    for (let i = 0; i < 5; i++) {
        const t = rng.pick(variation);
        const sx = 1 + rng.int(0, gw - 2), sy = 1 + rng.int(0, gh - 2);
        patches.push({ tile: t, cells: growClump(sx, sy, 4 + rng.int(0, 5), gw, gh, occupied, rng), alpha: 0.22, category: 'ground-variation' });
    }

    if (elevationBand === 'lowland' || elevationBand === 'snow') return;
    const dry = biome === 'desert' || biome === 'savanna' || biome === 'temperate_grass';
    const altitudeTiles = elevationBand === 'upland'
        ? (dry ? ['pc1', 'pc2', 'pm1'] : ['pm1', 'rock_wet', 'gravel_wet'])
        : (dry ? ['rck', 'gravel_default', 'qs2'] : ['rck', 'rock_wet', 'gravel_wet']);
    const count = (elevationBand === 'alpine' ? 4 : elevationBand === 'mountain' ? 3 : 1)
        + (slopeDeg !== null && slopeDeg >= 12 ? 1 : 0);
    for (let i = 0; i < count; i++) {
        const sx = 1 + rng.int(0, gw - 2), sy = 1 + rng.int(0, gh - 2);
        patches.push({
            tile: rng.pick(altitudeTiles),
            cells: growClump(sx, sy, 4 + rng.int(0, 7), gw, gh, occupied, rng),
            alpha: elevationBand === 'upland' ? 0.18 : 0.34,
            category: 'ground-variation',
        });
    }
}

// ── 第 4 层：林地落叶层（森林 biome 的 forest-floor 斑块） ─────────

function buildForestFloor(
    gw: number,
    gh: number,
    biome: Biome,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    occupied: Set<string>
): void {
    const isForest = biome === 'tropical_rainforest' || biome === 'temperate_forest' || biome === 'boreal';
    if (!isForest) return;
    const tiles = ['fo2', 'underbrush_leaves'];
    const n = 1 + rng.int(0, 1);
    for (let i = 0; i < n; i++) {
        const sx = 2 + rng.int(0, gw - 4), sy = 2 + rng.int(0, gh - 4);
        patches.push({ tile: rng.pick(tiles), cells: growClump(sx, sy, 8 + rng.int(0, 10), gw, gh, occupied, rng), alpha: 0.5, category: 'forest-floor' });
    }
}

// ── 第 5 层：植被（树聚丛 + 地面装饰 + 落叶） ─────────

function buildVegetation(
    VW: number,
    VH: number,
    biome: Biome,
    elevationBand: ElevationBand,
    season: 0 | 1 | 2,
    rng: RandomSource,
    objects: EnvironmentObjectPlan[],
    isWater: WaterChecker
): void {
    const treeAssets = pickTreeSpecies(biome, season, rng);
    const baseTreeCount = treeCountFor(biome, rng);
    const treeFactor: Record<ElevationBand, number> = {
        lowland: 1,
        upland: 0.9,
        mountain: 0.65,
        alpine: 0.25,
        snow: 0.15,
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
    let placed = 0;
    for (let c = 0; c < clusterCount && placed < treeCount; c++) {
        let cx = 0, cy = 0;
        for (let a = 0; a < 40; a++) {
            cx = VW * (0.15 + rng.next() * 0.7);
            cy = VH * (0.15 + rng.next() * 0.7);
            if (!isWater(cx, cy)) break;
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
                if (sx >= 0 && sx <= VW && sy >= 0 && sy <= VH && hasTreePassage(sx, sy) && !isWater(sx, sy)) {
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

    // 地面装饰（灌木/草/花/岩石，围绕地形散布，数量约为树 2~3 倍）
    const ground = BIOME_GROUND_DECOR[biome];
    const decorCount = treeCount * (2 + rng.int(0, 2));
    for (let i = 0; i < decorCount; i++) {
        const p = sampleLandPos(VW, VH, rng, isWater);
        objects.push({ asset: rng.pick(ground), x: p.x, y: p.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }

    // 秋色落叶贴花（温带系秋季）
    if (season === 1 && (biome === 'temperate_forest' || biome === 'temperate_grass' || biome === 'boreal')) {
        const leaves = ['FALLEN_LEAVES_MAPLE_AUTUMN', 'FALLEN_LEAVES_MAPLE_RED', 'FALLEN_LEAVES_PEACH'];
        for (let i = 0; i < 3; i++) {
            const p = sampleLandPos(VW, VH, rng, isWater);
            objects.push({ asset: rng.pick(leaves), x: p.x, y: p.y, layer: 'ground', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
        }
    }

}

// ── 第 5 层：资源点（低频；已删金矿 + 黄果灌木，主人 2026-08-20 定） ──

function buildResources(VW: number, VH: number, rng: RandomSource, objects: EnvironmentObjectPlan[], isWater: WaterChecker): void {
    const resAssets = ['FORAGE_BUSH', 'MINE_STONE'];
    const resCount = 2 + rng.int(0, 3);
    for (let i = 0; i < resCount; i++) {
        const p = sampleLandPos(VW, VH, rng, isWater);
        objects.push({ asset: rng.pick(resAssets), x: p.x, y: p.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }
}

// ── 第 5 层：战后残迹（低频） ───────────────────────────────────

function buildDebris(VW: number, VH: number, rng: RandomSource, objects: EnvironmentObjectPlan[], isWater: WaterChecker): void {
    const debrisCount = 1 + rng.int(0, 2);
    for (let i = 0; i < debrisCount; i++) {
        const p = sampleLandPos(VW, VH, rng, isWater);
        objects.push({ asset: rng.chance(0.5) ? 'DECAL_CRACK' : 'DECAL_CRATER', x: p.x, y: p.y, layer: 'ground', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }
    const p2 = sampleLandPos(VW, VH, rng, isWater);
    objects.push({ asset: rng.chance(0.5) ? 'FELLED_GENERIC' : 'STUMP_GENERIC', x: p2.x, y: p2.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
}

// 重新导出 hashString，供测试/验收计算种子校验和
export { hashString };
