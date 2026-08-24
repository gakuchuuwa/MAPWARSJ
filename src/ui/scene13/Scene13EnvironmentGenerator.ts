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
    BIOME_GROUND_DECOR,
    detectBiomeAtElevation,
    resolveClimateRegion,
    resolveElevationBand,
    treeCountFor,
    DEFAULT_TERRAIN_TILE,
} from '../Scene13Biome';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import { latLngToTilePixel } from '../../world/land-sea/ElevationSampler';
import { RandomSource, createRandom, hashString } from './Random';
import {
    DE_MAP_THEMES,
    groundTilesForTheme,
    forestFloorTilesForTheme,
    beachTerrainForTheme,
    decorForTheme,
    waterTerrainForTheme,
    isSnowArea,
    resolveDeMapTheme,
    terrainForTheme,
    treesForTheme,
    SECONDARY_TERRAINS,
    type DeMapThemeId,
    type DeMapThemePalette,
} from './Scene13DeMapThemes';

/** 等距菱形瓦片（2:1，DE 同款投影） */
const TILE_W = 64;
const TILE_H = 32;

// ── 水域/沙滩贴图（真实存在于 public/SUCAI_TERRAIN，勿自创） ──
// 🔴 [2026-08-22 主人定] 绿是河，蓝是海：
//   - 海洋与海岸线专属蔚蓝/浅蓝海水（DE 经典 wtr / wt2 / wt4，波光粼粼）；
//   - 内陆河流专属古朴深邃自然墨绿水体（主人选定方案 4：sh4 / sh5，古色古香，无杂乱水草浮萍）。

// ── 方案数据结构 ──────────────────────────────────────────────
// ── 方案数据结构 ──────────────────────────────────────────────────

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
    /** 边缘高斯模糊半径（px，可选）。水/滩等窄条带用较小值获得 DE 式清晰河岸；缺省 polygon=16 / cells=24。 */
    blur?: number;
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
    /** 同一成组摆放内的物件可以相互靠近。 */
    placementGroup?: string;
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
    /** DE 179 张官方地图提炼出的 7 大核心战场拓扑原型 */
    topology?: Scene13Topology;
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
    waterKind: 'sea' | 'lake' | 'river' | 'none';
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
    forceWaterKind?: 'sea' | 'lake' | 'river' | 'none';
    /** 🔧 [2026-08-24 背景图预览工具] 强制 DE 主题，跳过按经纬度解析（工具要定点枚举 18 套主题） */
    forceTheme?: DeMapThemeId;
    /** 🔧 [同上] 强制海拔档；缺省仍按 resolveElevationBand 走 */
    forceElevationBand?: ElevationBand;
    /** 🔧 [同上] 强制海拔米数（喂给树种/地表/丘陵密度判定），覆盖 ESRI 采样 */
    forceElevationM?: number;
    /** 测试/控制用：强制是否生成横贯战场的平坦帝国大道 */
    forceHasRoad?: boolean;
    /** 战斗类型：是否为攻防战（攻城战/据点防守战） */
    isSiege?: boolean;
}

const HALF_TILE_OBSTRUCTION = { x: 0.5, y: 0.5 } as const;
// 挡路障碍物被单位连续接触满 N 秒后释放碰撞（防卡死）。主人 2026-08-21 定「5 秒一切换，就树和岩石」。
const OBSTRUCTION_RELEASE_SEC = 5;
const TREE_MIN_CENTER_SPACING_TILES = 1.4;

/**
 * 林地格上长树的概率。DE 真图实测 472 棵 / 542 格森林地形 ≈ 0.87，
 * 也就是基本一格一棵、树冠互相压着——这才长得出林子。
 */
const TREES_PER_FOREST_TILE = 0.87;

/**
 * 森林地形占**可用地**（屏幕内、非水、走廊外）的比例——不是占全图。
 * 见 buildVegetation 里的说明：我们一屏两军对撞，可用地只有边缘那圈，
 * 照抄 DE 的全图 12.4% 会落得满地零星几棵。改完用 scratch/cmp_forest.mts 量。
 */
function forestCoverOfUsableFor(biome: Biome): number {
    switch (biome) {
        case 'tundra_snow': return 0.07;
        case 'desert': return 0.09;
        case 'cold_steppe': return 0.12;
        case 'savanna':
        case 'mediterranean': return 0.22;
        case 'tropical_rainforest':
        case 'temperate_forest': return 0.52;
        default: return 0.36;
    }
}
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
    'UNDERBRUSH', 'UNDERBRUSH_JUNGLE', 'UNDERBRUSH_RAINFOREST', 'DECAL_ICE',
    // 🔴 [2026-08-21 素材全覆盖] 荒漠地面贴花（干裂/陨坑）——沙漠/高原 flat
    'DECAL_CRACK', 'DECAL_CRATER',
    // 🔴 [2026-08-21 素材全覆盖] 秋季落叶——温带秋战场地面
    'FALLEN_LEAVES_MAPLE_AUTUMN', 'FALLEN_LEAVES_MAPLE_RED', 'FALLEN_LEAVES_PEACH',
]);
const ROCK_COMPANION_ASSETS = new Set([
    'GRASS_DRY', 'GRASS_DRY_PATCH', 'GRASS_GREEN', 'GRASS_GREEN_PATCH', 'WEED',
    'FLOWER', 'FLOWER_1', 'FLOWER_2', 'FLOWER_3', 'FLOWER_4', 'FLOWERBED',
    'PLANT_DEAD', 'PLANT_JUNGLE', 'PLANT_RAINFOREST', 'FERNPATCH',
    'UNDERBRUSH', 'UNDERBRUSH_JUNGLE', 'UNDERBRUSH_RAINFOREST',
    'SHRUB_GREEN', 'BUSH_GREEN', 'CACTUS',
    'FALLEN_LEAVES_MAPLE_AUTUMN', 'FALLEN_LEAVES_MAPLE_RED', 'FALLEN_LEAVES_PEACH',
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
    // 🔴 [2026-08-21 素材全覆盖] 战场遗迹（木桶/墓碑/骸骨）。地毯 RUGS 已移出此集合：
    //    主人 2026-08-21 定「地毯只贴图」——RUGS 不再挂 HALF_TILE_OBSTRUCTION，不参与碰撞/阻挡，仅作地面装饰。
    'BARRELS', 'GRAVES', 'SKELETON',
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
        const a = object.asset;
        // 🔴 [2026-08-21 主人定·方案A] 小 solid 纯贴图（无碰撞）：岩石(ROCK*)/木桶/墓碑/骸骨/芦苇/睡莲
        //    成组密集、反复推挤卡兵 → 一律不阻挡。树（DE_TREE_OBJECTS）+ 悬崖（CLIFF*）保留碰撞。
        if (a.startsWith('ROCK') || a === 'BARRELS' || a === 'GRAVES' || a === 'SKELETON' || a === 'REEDS' || a === 'WATER_LILY' || a === 'OYSTERS') {
            object.obstruction = undefined;
            continue;
        }
        object.obstruction = DE_OBJECT_OBSTRUCTION[a]
            ?? (DE_HALF_TILE_OBJECTS.has(a) ? HALF_TILE_OBSTRUCTION : undefined);
        if (DE_TREE_OBJECTS.has(a)) {
            object.obstructionReleaseAfterSec = OBSTRUCTION_RELEASE_SEC;
        }
    }
}

function getAssetRepulsionRadius(asset: string): number {
    if (asset.startsWith('CLIFF') || asset.startsWith('SHORT_CLIFF') || asset.startsWith('MOUNTAIN_')) return 150;
    if (asset.startsWith('ROCK_FORMATION') || asset === 'ROCK_PILLAR') return 105;
    if (asset.startsWith('ROCK') || asset.startsWith('MINE_') || asset.startsWith('STUMP_')) return 85;
    if (DE_TREE_OBJECTS.has(asset)) return 65;
    if (asset === 'REEDS' || asset === 'WATER_LILY' || asset === 'OYSTERS' || GROUND_COVER_ASSETS.has(asset)) return 15;
    return 40;
}

function isObjectOverlapping(
    x: number,
    y: number,
    asset: string,
    objects: EnvironmentObjectPlan[],
    ignoreIdx = -1,
    placementGroup?: string,
): boolean {
    const r1 = getAssetRepulsionRadius(asset);
    for (let i = 0; i < objects.length; i++) {
        if (i === ignoreIdx) continue;
        const other = objects[i];
        if (placementGroup && placementGroup === other.placementGroup) {
            continue;
        }
        const r2 = getAssetRepulsionRadius(other.asset);
        const minDist = r1 + r2;
        const dx = x - other.x;
        const dy = (y - other.y) * 2; // 等距 2:1 椭圆投影距离
        if (Math.hypot(dx, dy) < minDist) return true;
    }
    return false;
}

/** 全素材独立间距强制约束（保留伴生生态，防止异类大型阻挡物穿模） */
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
        if (!isObjectOverlapping(obj.x, obj.y, obj.asset, accepted, -1, obj.placementGroup)) {
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
): { x: number; y: number } | null {
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = rng.next() * VW;
        const y = rng.next() * VH;
        if (isWater(x, y)) continue;
        if (inBattleCenter && inBattleCenter(x, y)) continue;
        if (asset && objects && isObjectOverlapping(x, y, asset, objects)) continue;
        return { x, y };
    }
    return null;
}

// ── 水域探测（高精度多尺度雷达密网扫描，判定据点是否临水/有江河海湾） ──

function probeWater(lat: number | undefined, lng: number | undefined): 'sea' | 'lake' | 'river' | 'none' {
    if (lat === undefined || lng === undefined) return 'none';
    
    // 1. 优先直接检查 ESRI 真实瓦片水体像素（支持 Zoom 13 / 10 / 9 多级瓦片）
    for (const z of [13, 10, 9]) {
        const { tileX, tileY } = latLngToTilePixel(lat, lng, z);
        const maskObj = LandSeaSystem.getWaterSampler().getTileMaskSync(z, tileX, tileY);
        if (maskObj?.mask) {
            let waterPixels = 0;
            const m = maskObj.mask;
            for (let k = 0; k < m.length; k++) {
                if (m[k] === 1) waterPixels++;
            }
            // 🔴 [2026-08-24 主人定·撤销 08-22 的「彻底取消海滩场景」] 真·海 → 左侧海岸线登陆战；
            //    内陆水系仍走中轴河流对峙战场。判据用 isSeaAt，不拿水像素数猜。
            if (waterPixels > 30) {
                return LandSeaSystem.isSeaAt({ lat, lng }) ? 'sea' : 'river';
            }
        }
    }

    // 2. 高精度多尺度同心圆环密网扫描（500米 ~ 25公里，覆盖城郊所有江河水系与海湾）
    const distances = [0.005, 0.015, 0.035, 0.08, 0.20];
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    
    if (LandSeaSystem.isSeaAt({ lat, lng })) return 'sea';
    if (LandSeaSystem.getWaterSampler().isWaterSync(lat, lng) === true) {
        return 'river';
    }

    // 密网环形雷达扫描
    for (const dist of distances) {
        for (const ang of angles) {
            const dlat = dist * Math.cos(ang);
            const dlng = dist * Math.sin(ang);
            const curLat = lat + dlat;
            const curLng = lng + dlng;
            if (LandSeaSystem.isSeaAt({ lat: curLat, lng: curLng })) return 'sea';
            if (LandSeaSystem.getWaterSampler().isWaterSync(curLat, curLng) === true) {
                return 'river';
            }
        }
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
    if (input.forceElevationM !== undefined) elev = input.forceElevationM;
    const climateRegion = hasCoord ? resolveClimateRegion(input.lat!, input.lng!) : null;
    const elevationBand = input.forceElevationBand
        ?? (hasCoord ? resolveElevationBand(input.lat!, climateRegion, elev, input.lng) : 'lowland');
    const biome: Biome = input.forceBiome ?? (hasCoord ? detectBiomeAtElevation(input.lat!, input.lng!, elev) : 'temperate_forest');
    const season = resolveSeason(input.lat, input.lng, input.getCalendarSeason);
    const waterKind = input.forceWaterKind ?? probeWater(input.lat, input.lng);
    const topology: Scene13Topology = resolveBattleTopology(hasCoord, waterKind, elev, slope, biome, rng);
    const theme = input.forceTheme
        ? DE_MAP_THEMES[input.forceTheme]
        : (hasCoord ? resolveDeMapTheme(input.lat!, input.lng!, biome, elev, waterKind) : null);
    const baseTerrain: string = theme
        ? terrainForTheme(theme, biome, season, elevationBand, input.lat, elev, input.isSiege ?? false)
        : DEFAULT_TERRAIN_TILE;
    const patches: TerrainPatchPlan[] = [];
    const objects: EnvironmentObjectPlan[] = [];
    const occupied = new Set<string>();

    if (hasCoord) {
        // ── 第 2 层 ELEVATION：clump 生长 + 高度等级（低地少丘、高地多丘） ──
        const elevation = generateElevation(gw, gh, ox, oy, VW, VH, elev, slope, topology, rng);

        // ── 第 3 层 WATER ──
        // 战斗层尚无山体碰撞/寻路：高程只用地面明暗表现可行走坡地，
        // 不把巨型山峰精灵放进士兵活动区，避免单位从山体上穿过。
        // 水域排斥谓词：陆地物件（植被/资源/残迹）禁止落在水里。
        let isWater: WaterChecker = () => false;
        let isRoad: (x: number, y: number) => boolean = () => false;

        // 🔴 [严格遵循 DE 与史实]：
        // 攻城战为城郭攻防战场，核心为城前平原与城防阵线，绝不擅自横插切断战场的假河；
        // 仅在真正的野战江河渡口 (river_crossing) 或大江野战时生成自然江河。
        if (waterKind === 'sea') {
            // 🔴 [2026-08-21 主人定，2026-08-24 恢复] 攻方恒在左侧，海岸线恒定在左侧（sideLeft = true），
            //    呈现攻方破浪抢滩突击、守方陆地坚守的登陆战演出；严禁海在右侧导致守方出生在水中。
            //    野战与攻防战都出海：主人九成战斗是攻防战，只在野战出就等于看不见。
            isWater = buildCoastline(gw, gh, ox, oy, VW, VH, true, rng, patches, occupied, theme!, season, input.lat, elev, biome);
            for (let i = 0; i < 4; i++) {
                const ra = rng.pick(['ROCK_BEACH', 'ROCK1', 'ROCK2', 'OYSTERS', 'REEDS', 'ROCK_SEA1', 'ROCK_SEA2']);
                const rockX = VW * 0.12 + rng.next() * VW * 0.08;
                objects.push({ asset: ra, x: rockX, y: rng.next() * VH, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
            }
        } else if (!input.isSiege && (topology === 'river_crossing' || waterKind === 'river')) {
            isWater = buildRiver(gw, gh, ox, oy, VW, VH, rng, patches, objects, occupied, theme!, season, input.lat, elev, biome);
        }

        // 水面保持零高程：严禁高程光影或突起切进水面（保持 100% 平坦如砥）
        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) {
                const px = isoCellX(gx, gy, ox);
                const py = isoCellY(gx, gy, oy);
                if (isWater(px, py) || isRoad(px, py)) elevation[gy][gx] = 0;
            }
        }

        // ── 第 4 层 TERRAIN：同一套 DE 主题内的地表变体 + 林地底层 ──
        buildGroundVariation(gw, gh, biome, season, theme!, rng, patches, occupied, input.lat, elev, waterKind, input.isSiege ?? false);
        buildForestFloor(gw, gh, biome, season, theme!, rng, patches, occupied, input.lat, elev);

        // ── 第 5 层 OBJECTS：同一套 DE 主题内的树 / 悬崖断崖 / 平面装饰 / 实体装饰 + 通用资源 ──
        buildVegetation(VW, VH, gw, gh, ox, oy, biome, elevationBand, season, theme!, rng, objects, patches, occupied, isWater, input.lat, elev, waterKind);
        buildResources(VW, VH, season, rng, objects, isWater, waterKind, biome);

        enforceAllObjectSpacing(objects);
        attachDeObjectObstruction(objects);
        return {
            seed, topology, climateRegion, elevationBand, elevationM: elev, slopeDeg: slope,
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

// ── DE 179 张官方地图提炼出的 7 大核心战场拓扑原型 ──────────────────────
export type Scene13Topology =
    | 'highland_ridge'         // 1. 高台山脊坡地 (Acclivity / Arabia)
    | 'canyon_pass'            // 2. 峡谷关隘走廊 (Pass / Canyon / Mountain Pass)
    | 'dense_forest_clearing'  // 3. 密林环抱与林间空地 (Black Forest / Hideout)
    | 'river_crossing'         // 4. 大江天堑隔水对峙 (Rivers / Cross / Cenotes)
    | 'rolling_hills'          // 5. 连绵丘陵与战术双高地 (Mongolia / Gold Rush / SeizeTheMountain)
    | 'steppe_oasis'           // 6. 苍茫草原戈壁绿洲 (Steppe / Oasis / Atacama)
    | 'swamp_marsh'            // 7. 湿地沼泽浅泥水泊 (Bogland / Swamp / Salt Marsh)
    | 'imperial_highway';      // 8. 帝国驿道十字大道 (Highway / Crossroads / Valley)

function resolveBattleTopology(
    hasCoord: boolean,
    waterKind: 'sea' | 'lake' | 'river' | 'none',
    elev: number | null,
    slope: number | null,
    biome: Biome,
    rng: RandomSource
): Scene13Topology {
    // 真实水系优先
    if (waterKind === 'river') return 'river_crossing';
    if (waterKind === 'lake') return rng.chance(0.6) ? 'swamp_marsh' : 'steppe_oasis';
    
    // 真实高山/陡坡优先 (优先高台山脊、峡谷关隘与连绵双高地)
    if (elev !== null && (elev >= 500 || (slope !== null && slope >= 5))) {
        return rng.pick(['rolling_hills', 'highland_ridge', 'canyon_pass']);
    }

    // 森林环境优先
    if (biome === 'temperate_forest' || biome === 'boreal' || biome === 'tropical_rainforest') {
        return rng.pick(['dense_forest_clearing', 'rolling_hills', 'imperial_highway', 'highland_ridge']);
    }

    // 草原/荒漠环境优先
    if (biome === 'cold_steppe' || biome === 'savanna' || biome === 'desert') {
        return rng.pick(['rolling_hills', 'steppe_oasis', 'imperial_highway', 'highland_ridge', 'canyon_pass']);
    }

    // 全局均衡丰富抽选
    return rng.pick([
        'rolling_hills', 'rolling_hills',
        'highland_ridge',
        'canyon_pass',
        'dense_forest_clearing',
        'steppe_oasis',
        'swamp_marsh',
        'imperial_highway'
    ]);
}


// ── 第 2 层：高地（clump 生长；低地少丘、高地多丘） ─────────────

/**
 * DE 式满地微起伏。
 *
 * 🔴 [2026-08-24 对着 DE 真图实测后加] 病根：原本只有 2~4 片大椭圆高台，台面内部全平，
 * 只有台缘才有高差 —— 整张图看着一马平川。拿 DE 场景编辑器生成的真图一比就露馅了：
 *
 *              有高度的格   相邻格有高差的边
 *     DE 真图      21.6%          14.1%
 *     我们(丘陵)   15.5%           3.4%
 *
 * 高度**总量**其实差不多，差的是**颗粒度**：DE 是满地碎的小土包，我们是几个大台地。
 * 所以这里不动原有的战术高地（那是有战斗意义的地形），只在其上叠一层小缓丘。
 *
 * 验收标准就是上表的 14.1%，用 scratch/cmp_elevation.mts 量，不靠肉眼。
 */
function addMicroRelief(
    grid: number[][],
    gw: number,
    gh: number,
    rng: RandomSource,
    density: number = 1
): number[][] {
    // 微丘走 clump 生长而不是画圆：圆的边界太"光滑"，同样面积撑不出 DE 那么多高差边。
    // clump 的轮廓天然曲折，边界/面积比高——这正是 DE 用 21.6% 的面积做出 14.1% 高差边的原因。
    // 每块目标 3~7 格，块与块之间不重叠（各自占格），铺出满地碎缓包。
    const budget = Math.round(gw * gh * 0.115 * density);
    const taken = new Set<string>();
    let placed = 0;
    let guard = 0;
    while (placed < budget && guard++ < budget * 6) {
        const sx = rng.int(1, gw - 2);
        const sy = rng.int(1, gh - 2);
        if (taken.has(`${sx},${sy}`)) continue;
        const target = 3 + rng.int(0, 4);
        const cells = growClump(sx, sy, target, gw, gh, taken, rng);
        for (const [x, y] of cells) {
            // 恒抬 1 级：2/3 级留给战术高地。微丘自己叠高会造出断崖，
            // 而 DE 真图的断崖率是 0.00%，那条必须守住。
            if (grid[y][x] < 1) grid[y][x] = 1;
        }
        placed += cells.length;
    }
    return grid;
}

/**
 * 经典帝国时代式 2.5D 隆起丘陵与战术高地生成：
 * 生成连续高度场，让坡脚、坡腰和丘顶自然过渡，不出现台阶分层。
 */
function generateElevation(
    gw: number,
    gh: number,
    ox: number,
    oy: number,
    VW: number,
    VH: number,
    elev: number | null,
    slope: number | null,
    topology: Scene13Topology,
    rng: RandomSource
): number[][] {
    const grid: number[][] = Array.from({ length: gh }, () => new Array(gw).fill(0));

    if (topology === 'canyon_pass') {
        // 🪨 拓扑 2：峡谷关隘走廊 (Pass / Canyon) —— 北面与南面隆起两道险峻峡谷岩壁，中轴平坦畅通
        const topCliffY = VH * 0.18, botCliffY = VH * 0.82;
        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                const py = isoCellY(x, y, oy);
                if (py < topCliffY) {
                    const d = (topCliffY - py) / 50;
                    grid[y][x] = Math.min(3, Math.max(1, Math.round(d * 2.2)));
                } else if (py > botCliffY) {
                    const d = (py - botCliffY) / 50;
                    grid[y][x] = Math.min(3, Math.max(1, Math.round(d * 2.2)));
                }
            }
        }
        return addMicroRelief(grid, gw, gh, rng, 0.6);
    }

    if (topology === 'rolling_hills') {
        // ⛰️ 拓扑 5：连绵丘陵与战术双高地 (Rolling Hills & Dual Highlands - Mongolia / Gold Rush)
        // 北部 Level 3 主高台 + 南部 Level 2 丘陵群 + 右侧 Level 1 缓坡 + 中央马鞍形鞍部
        const hills = [
            { sx: VW * 0.56, sy: VH * 0.28, rx: 9.5, ry: 6.5, maxH: 3, angle: -0.2 },
            { sx: VW * 0.74, sy: VH * 0.75, rx: 10.5, ry: 7.0, maxH: 2, angle: 0.25 },
            { sx: VW * 0.90, sy: VH * 0.48, rx: 6.5, ry: 5.0, maxH: 1, angle: 0.1 },
        ];
        for (const h of hills) {
            const [cgx, cgy] = screenToGrid(h.sx, h.sy, ox, oy);
            const cx = Math.max(1, Math.min(gw - 2, cgx));
            const cy = Math.max(1, Math.min(gh - 2, cgy));
            for (let y = 0; y < gh; y++) {
                for (let x = 0; x < gw; x++) {
                    const dx = x - cx, dy = y - cy;
                    const rxRot = dx * Math.cos(h.angle) - dy * Math.sin(h.angle);
                    const ryRot = dx * Math.sin(h.angle) + dy * Math.cos(h.angle);
                    const normDist = Math.sqrt((rxRot / h.rx) ** 2 + (ryRot / h.ry) ** 2);
                    const noise = (Math.sin(x * 1.4 + y * 0.8) + Math.cos(x * 0.7 - y * 1.2)) * 0.08;
                    const dist = normDist + noise;
                    let curH = 0;
                    if (dist < 0.40) curH = h.maxH;
                    else if (dist < 0.75) curH = Math.max(1, h.maxH - 1);
                    else if (dist < 1.05) curH = 1;
                    if (curH > grid[y][x]) grid[y][x] = curH;
                }
            }
        }
        return addMicroRelief(grid, gw, gh, rng, 1.2);
    }

    if (topology === 'dense_forest_clearing' || topology === 'swamp_marsh') {
        // 平坦空地/泥泞平缓沼泽：不设战术高地，但 DE 的「平地」图也不是纯平板，仍给轻微起伏
        return addMicroRelief(grid, gw, gh, rng, 0.55);
    }
    
    // 🔴 [2026-08-22 主人定] 彻底告别单调大平原：即使是平原低地，亦随机生成 2~3 处自然起伏战术高地与缓坡丘陵
    const hillCount = (elev !== null && (elev >= 800 || (slope !== null && slope >= 10)))
        ? 3 + rng.int(0, 2)   // 山地/高原：3~4 片大型连绵高地丘陵群
        : (elev !== null && elev >= 300)
            ? 2 + rng.int(0, 2) // 丘陵台地：2~3 片错落战术高地
            : 2 + rng.int(0, 2); // 平原低地：2~3 片自然缓坡起伏高台，打破一马平川

    for (let i = 0; i < hillCount; i++) {
        // 先在可见战场取丘心（中北/中南/中央错开分布），再反算到等距网格
        const hillScreenX = VW * (0.18 + rng.next() * 0.64);
        const hillScreenY = VH * (0.16 + rng.next() * 0.68);
        const [hillGx, hillGy] = screenToGrid(hillScreenX, hillScreenY, ox, oy);
        const cx = Math.max(1, Math.min(gw - 2, hillGx));
        const cy = Math.max(1, Math.min(gh - 2, hillGy));
        const rx = 8 + rng.next() * 6;  // 椭圆长轴 8~14 格
        const ry = 6 + rng.next() * 5;  // 椭圆短轴 6~11 格
        const hMax = (elev !== null && elev >= 800) ? 3 : 2;
        const angle = (rng.next() - 0.5) * 1.0; // 随机山脊走向倾角

        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const rxRot = dx * Math.cos(angle) - dy * Math.sin(angle);
                const ryRot = dx * Math.sin(angle) + dy * Math.cos(angle);
                const normDist = Math.sqrt((rxRot / rx) ** 2 + (ryRot / ry) ** 2);
                // 自然有机地形扰动噪声
                const noise = (Math.sin(x * 1.2 + y * 0.8) + Math.cos(x * 0.7 - y * 1.1)) * 0.08;
                const dist = normDist + noise;

                // 经典 AoE2 DE 同心阶梯式战术高地模型（制高顶台 Level 3/2 + 缓坡肩部 Level 2/1 + 坡脚基底 Level 1）
                let h = 0;
                if (dist < 0.36) {
                    h = hMax; // 峰顶 / 高台制高点（Level 3 或 Level 2）
                } else if (dist < 0.70) {
                    h = Math.max(1, hMax - 1); // 斜坡肩部（Level 2 或 Level 1）
                } else if (dist < 1.08) {
                    h = 1; // 坡脚基底环（Level 1）
                }

                if (h > grid[y][x]) {
                    grid[y][x] = h;
                }
            }
        }
    }
    return addMicroRelief(grid, gw, gh, rng);
}

// ── 第 3 层：DE 左侧海岸线（登陆战） ──────────────────────────
//
// 🔴 [2026-08-24] 从 9700d7eb1（8/21 16:59 最后一个能出海岸的版本）原样取回。
//    历史：8/21 主人定「攻方恒在左侧，海岸线恒定在左侧，呈现攻方破浪抢滩突击、
//    守方陆地坚守的登陆战演出；严禁海在右侧导致守方出生在水中」；8/22 主人改口
//    「彻底取消海滩场景」，调用点与函数分两刀删净；8/24 主人要求装回。
//
// 岸线位置：屏幕 x 在 VW*0.05 ~ VW*0.24 之间随机游走（均值约 14%），
//    Catmull-Rom 平滑，沙滩带宽约 0.75 格（≈48px）。这个区间与攻方出兵口有重叠，
//    见 SHORE_* 常量注释。

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
    season: 0 | 1 | 2 = 0,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
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
    const actualBeachTile = beachTerrainForTheme(theme, season, lat, elev, biome);
    patches.push({ tile: actualBeachTile, cells: beach, polygon: bandPolygon(0, beachW), alpha: 0.92, category: 'shore' });

    // 水域排斥：signedDistance < 0 即浅水（滩/陆均不算水）
    return (x, y) => (x - boundaryAt(y)) * inlandSign < 0;
}

// ── 第 3 层：DE 经典江河渡口（仅在野战 river_crossing 中轴生成清澈江河） ──

function buildRiver(
    gw: number,
    gh: number,
    ox: number,
    oy: number,
    VW: number,
    VH: number,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    _objects: EnvironmentObjectPlan[],
    occupied: Set<string>,
    theme: DeMapThemePalette,
    season: 0 | 1 | 2 = 0,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
): WaterChecker {
    // 🌊 DE 原版 Rivers 规范：大江横贯中轴，清澈江水主导，岸边紧贴草岸
    // 🔴 [2026-08-23 主人改] DE 化大江：更窄 + 更蜿蜒 + 深浅分层
    //   窄：半宽 40±7（总宽 66~94px）——原 100±15（总宽 170~230px）太宽；
    //   深浅：深水核心(不透明) + 浅水环(半透明透出地面) → 河岸 草→浅→深 渐变（DE 渡口河经典）。
    const numPts = 36;
    const pts: Array<{ x: number; y: number; nx: number; ny: number; wW: number }> = [];
    const baseCenterX = VW * 0.52;
    const phase1 = rng.next() * Math.PI * 2;
    const phase2 = rng.next() * Math.PI * 2;
    const baseHalfW = 40;    // 河面半宽（px）
    const halfWVary = 7;     // 半宽起伏
    const shallowDepth = 20; // 浅水环宽度（深水边缘外，px）

    for (let i = 0; i <= numPts; i++) {
        const t = i / numPts;
        // 平缓自然蜿蜒（窄河更显蛇曲）
        const curveOffset = Math.sin(t * Math.PI * 2.0 + phase1) * 58 + Math.cos(t * Math.PI * 4.0 + phase2) * 24;
        const x = baseCenterX + curveOffset;
        const y = -TILE_H * 2 + (VH + TILE_H * 4) * t;
        const wW = baseHalfW + Math.sin(t * Math.PI * 2.5 + phase1) * halfWVary; // 江面半宽 33~47px
        pts.push({ x, y, nx: 0, ny: 0, wW });
    }

    for (let i = 0; i <= numPts; i++) {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(numPts, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        pts[i].nx = -dy / len;
        pts[i].ny = dx / len;
    }

    const waterCells: Array<[number, number]> = [];
    const shallowCells: Array<[number, number]> = []; // 岸边浅水环（深水外侧）

    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = isoCellX(gx, gy, ox);
            const py = isoCellY(gx, gy, oy);
            let minDist = 999999;
            for (let k = 0; k <= numPts; k++) {
                const d = Math.hypot(px - pts[k].x, (py - pts[k].y) * 1.5);
                if (d < minDist) minDist = d;
            }
            if (minDist < baseHalfW) {
                waterCells.push([gx, gy]);
            } else if (minDist < baseHalfW + shallowDepth) {
                shallowCells.push([gx, gy]); // 江岸浅水环
            }
        }
    }

    for (const [x, y] of waterCells) occupied.add(x + ',' + y);
    for (const [x, y] of shallowCells) occupied.add(x + ',' + y);

    const wL = pts.map(p => ({ x: p.x + p.nx * p.wW, y: p.y + p.ny * p.wW * 0.62 }));
    const wR = pts.map(p => ({ x: p.x - p.nx * p.wW, y: p.y - p.ny * p.wW * 0.62 })).reverse();
    const sL = pts.map(p => ({ x: p.x + p.nx * (p.wW + shallowDepth), y: p.y + p.ny * (p.wW + shallowDepth) * 0.62 }));
    const sR = pts.map(p => ({ x: p.x - p.nx * (p.wW + shallowDepth), y: p.y - p.ny * (p.wW + shallowDepth) * 0.62 })).reverse();

    const actualWaterTile = waterTerrainForTheme(theme, season, lat, elev, biome);
    // 先铺浅水环（同一水贴图·半透明 → 透出地面 = 浅水），再铺深水核心（不透明覆盖内侧）。
    //    窄条带用较小 blur（深 8 / 浅 12）→ DE 式清晰河岸，不再是整片高斯糊。
    if (shallowCells.length > 0) {
        patches.push({ tile: actualWaterTile, cells: shallowCells, polygon: [...sL, ...sR], alpha: 0.50, category: 'shore', blur: 12 });
    }
    if (waterCells.length > 0) {
        patches.push({ tile: actualWaterTile, cells: waterCells, polygon: [...wL, ...wR], alpha: 0.96, category: 'shore', blur: 8 });
    }

    return (px: number, py: number): boolean => {
        for (let k = 0; k <= numPts; k += 2) {
            if (Math.hypot(px - pts[k].x, (py - pts[k].y) * 1.5) < pts[k].wW + shallowDepth) return true;
        }
        return false;
    };
}

// ── 第 3 层：横向帝国行军大道（东西水平贯通，平坦开阔，0 阻挡） ──

function buildHorizontalHighway(
    gw: number,
    gh: number,
    ox: number,
    oy: number,
    VW: number,
    VH: number,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    objects: EnvironmentObjectPlan[],
    occupied: Set<string>,
    theme: DeMapThemePalette,
    season: 0 | 1 | 2 = 0,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
    baseTerrain: string = 'gr7',
): (x: number, y: number) => boolean {
    const centerY = VH * (0.48 + (rng.next() - 0.5) * 0.08); // 正中央附近 (44% ~ 52%)
    const controls: Array<{ x: number; y: number }> = [
        { x: -VW * 0.25, y: centerY + (rng.next() - 0.5) * 20 },
        { x: -VW * 0.05, y: centerY + (rng.next() - 0.5) * 25 },
        { x: VW * 0.25,  y: centerY + (rng.next() - 0.5) * 30 },
        { x: VW * 0.50,  y: centerY + (rng.next() - 0.5) * 20 },
        { x: VW * 0.75,  y: centerY + (rng.next() - 0.5) * 30 },
        { x: VW * 1.05,  y: centerY + (rng.next() - 0.5) * 25 },
        { x: VW * 1.25,  y: centerY + (rng.next() - 0.5) * 20 },
    ];

    const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t
            + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
            + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    };

    const roadPts: Array<{ x: number; y: number }> = [];
    const sampleStep = TILE_W / 2;
    for (let x = -VW * 0.25; x <= VW * 1.25; x += sampleStep) {
        const segTotal = controls.length - 3;
        const u = Math.max(0, Math.min(1, (x + VW * 0.25) / (VW * 1.5)));
        const segIdx = Math.min(segTotal - 1, Math.floor(u * segTotal));
        const t = (u * segTotal) - segIdx;
        const p0 = controls[segIdx];
        const p1 = controls[segIdx + 1];
        const p2 = controls[segIdx + 2];
        const p3 = controls[segIdx + 3];
        roadPts.push({ x, y: catmullRom(p0.y, p1.y, p2.y, p3.y, t) });
    }

    const yAt = (x: number): number => {
        const f = Math.max(0, Math.min(roadPts.length - 1, (x + VW * 0.25) / sampleStep));
        const i = Math.min(roadPts.length - 2, Math.floor(f));
        const t = f - i;
        return roadPts[i].y + (roadPts[i + 1].y - roadPts[i].y) * t;
    };

    // 🔴 [2026-08-21 美化] 适度收窄路宽（约 100px），自然起伏波浪，与周围地表完美融合
    const roadHalfW = 50;
    const roadPolyLeft: Array<{ x: number; y: number }> = [];
    const roadPolyRight: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < roadPts.length; i++) {
        const pt = roadPts[i];
        const noise = Math.sin(i * 0.35) * 10 + Math.cos(i * 0.18) * 6;
        roadPolyLeft.push({ x: pt.x, y: pt.y - (roadHalfW + noise) });
        roadPolyRight.push({ x: pt.x, y: pt.y + (roadHalfW + noise) });
    }
    const roadPolygon = [...roadPolyLeft, ...roadPolyRight.reverse()];

    const roadCells: Array<[number, number]> = [];
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = isoCellX(gx, gy, ox);
            const py = isoCellY(gx, gy, oy);
            if (Math.abs(py - yAt(px)) <= roadHalfW) {
                roadCells.push([gx, gy]);
            }
        }
    }
    for (const [cx, cy] of roadCells) occupied.add(`${cx},${cy}`);

    // 🔴 [2026-08-21 材质协同] 道路材质与周围 baseTerrain 严格协调，绝不在非雪地刷出孤立雪道！
    const isAmbientSnow = baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snf';
    let roadTile = 'rd2'; // DE Road 碎石路（古代驿道/车辙土路）——砾石(gravel_default/ds5)是地形，不当道路
    if (isAmbientSnow) {
        roadTile = 'sn2'; // 仅当大环境全为深雪时，道路才为踩实的雪原车辙
    } else if (
        theme.id === 'palaearctic_asia_steppe' ||
        biome === 'cold_steppe' ||
        baseTerrain === 'pm2' ||
        baseTerrain === 'gr4' ||
        baseTerrain === 'ds5'
    ) {
        roadTile = 'rd5'; // 塞外草原/黄土高原/干旱土：DE Road 砾石路（干旱地路面砾石裸露）——ds5沙漠砾石是地形，不当道路
    } else if (
        theme.id === 'palaearctic_middle_east_desert' ||
        theme.id === 'palaearctic_middle_east_highland' ||
        biome === 'desert' ||
        baseTerrain === 'pal'
    ) {
        roadTile = 'ds3'; // 荒漠/西亚高原：沙石行军道
    } else if (theme.id === 'palaearctic_tibetan_plateau') {
        roadTile = 'pm2'; // 青藏高原：高寒冻土草甸泥道
    } else if (biome === 'tropical_rainforest' || biome === 'savanna') {
        roadTile = biome === 'tropical_rainforest' ? 'fo2' : 'ds4';
    } else if (season === 2) {
        roadTile = 'gravel_wet'; // 温带冬季湿润车辙碎石路
    }

    patches.push({
        tile: roadTile,
        cells: roadCells,
        polygon: roadPolygon,
        alpha: 0.68, // 柔和半透明混合，透出下方地貌质感，彻底消除生硬贴片感
        category: 'shore',
    });

    // 沿路边自然点缀 2~3 个碎石或干草
    const roadDecors = ['ROCK1', 'ROCK2', 'GRASS_DRY'];
    for (let i = 0; i < 3; i++) {
        const rx = VW * (0.15 + rng.next() * 0.7);
        const ry = yAt(rx) + (rng.chance(0.5) ? -1 : 1) * (roadHalfW + 8 + rng.next() * 15);
        const asset = rng.pick(roadDecors);
        objects.push({ asset, x: rx, y: ry, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }

    return (x, y) => Math.abs(y - yAt(x)) <= roadHalfW + 15;
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
    waterKind?: 'sea' | 'lake' | 'river' | 'none',
    isSiege: boolean = false,
): void {
    const variation = groundTilesForTheme(theme, biome, season, lat, elev, isSiege);
    // 🔴 [2026-08-21 修·净州塞截图] 冬季雪原：变化层含冻土/枯草/砾石（pm*/gr4/ds5）时
    //    加强斑块（9 个、更大、更浓）——DE 冬季地面 = 雪 + 露土枯草斑块，雪盖不住一切。
    const isWinterSnow = season === 2 && isSnowArea(lat ?? 35, elev ?? null, biome);
    // 🔴 [2026-08-23 P2 多色系咬合] 加权斑块池 = 主色系变体 + 副色系（学 DE create_terrain 多层咬合）
    const secondary = isSiege
        ? [{ tile: 'ds5', weight: 1.0 }, { tile: 'gravel_default', weight: 0.5 }] // 攻城：泥地+砾石副色
        : (SECONDARY_TERRAINS[biome] ?? []);
    const pool = [
        ...variation.map(t => ({ tile: t, weight: 1.0 })),
        ...secondary,
    ];
    const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
    const pickWeighted = (): string => {
        let r = rng.next() * totalWeight;
        for (const p of pool) {
            r -= p.weight;
            if (r <= 0) return p.tile;
        }
        return pool[pool.length - 1].tile;
    };
    // 🔴 [2026-08-23 对齐 DE] DE 的 RMS create_terrain 是「整片副地形铺上去、靠 blends 咬边」，
    //    不是薄薄一层半透明色。旧参数（8 片 / 5~11 格 / alpha 0.25）实测只覆盖全场 ~5%、
    //    还只有 1/4 浓度 → 屏幕上等于一整片纯色。改为 DE 口径：片数与尺寸翻倍、浓度拉满，
    //    边缘的自然过渡交给 compositeSoftPatch 里的 blends 有机咬合（DE 同款）。
    const patchCount = isWinterSnow ? 12 : 14;
    for (let i = 0; i < patchCount; i++) {
        const t = pickWeighted();
        const sx = 1 + rng.int(0, gw - 2), sy = 1 + rng.int(0, gh - 2);
        const clump = isWinterSnow ? 10 + rng.int(0, 12) : 8 + rng.int(0, 10);
        const alpha = isWinterSnow
            ? (t.startsWith('sn') || t === 'sno' ? 0.82 : 0.45)
            : 0.75;
        patches.push({ tile: t, cells: growClump(sx, sy, clump, gw, gh, occupied, rng), alpha, category: 'ground-variation' });
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
    waterKind?: 'sea' | 'lake' | 'river' | 'none',
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
    gw: number,
    gh: number,
    ox: number,
    oy: number,
    biome: Biome,
    elevationBand: ElevationBand,
    season: 0 | 1 | 2,
    theme: DeMapThemePalette,
    rng: RandomSource,
    objects: EnvironmentObjectPlan[],
    patches: TerrainPatchPlan[],
    occupied: Set<string>,
    isWater: WaterChecker,
    lat?: number,
    elev?: number | null,
    waterKind?: 'sea' | 'lake' | 'river' | 'none',
): void {
    const treeAssets = treesForTheme(theme, season, elevationBand, lat, elev, biome);
    const primaryTree = rng.pick(treeAssets);
    const otherTrees = treeAssets.filter((t) => t !== primaryTree);
    const secondaryTree = otherTrees.length ? rng.pick(otherTrees) : null;
    const baseTreeCount = treeCountFor(biome, rng);
    const treeFactor: Record<ElevationBand, number> = {
        lowland: 1,
        upland: 0.9,
        mountain: 0.65,
        alpine: 0.35,
        high_alpine: 0.1,
        snow: 0.05,
    };
    const treeCount = Math.max(4, Math.round(baseTreeCount * treeFactor[elevationBand]));
    const clusterCount = Math.max(2, Math.round(treeCount / 5));
    const perCluster = Math.max(3, Math.round(treeCount / clusterCount));
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

    const inArmyCorridor = (x: number, y: number): boolean => {
        return x >= VW * 0.18 && x <= VW * 0.82 && y >= VH * 0.12 && y <= VH * 0.88;
    };

    const forestFloorTiles = forestFloorTilesForTheme(theme, biome, season, lat, elev);
    const forestFloorTile = forestFloorTiles.length > 0 ? rng.pick(forestFloorTiles) : 'pc1';

    // ── DE 式林地：先铺成团林地地块，再在地块上长满树 ───────────────────
    //
    // 🔴 [2026-08-24 对着 DE 场景编辑器生成的真图重写] 原来的做法是「在草地上随机撒 15~24 棵
    // 孤树」，怎么调参数都长不出 DE 那种林子。拿 DE 真图一比才看清是结构性错误：
    //
    //                        森林               同尺寸(66x66)树数
    //     DE 真图     一种**地形**，占 12.4%          472 棵
    //     我们(旧)    没有这个概念，纯撒点          15~24 棵
    //
    // DE 的做法写在 Arabia.rms 里：先 `create_terrain FOREST_PLACEHOLDER`（`land_percent 6~10`、
    // `number_of_clumps 10~14`）铺出成团的林地地块，再在这些地块上长树。所以 DE 的树要么
    // 密密麻麻连成林，要么是刻意的几株 straggler，不存在均匀散布的孤树。
    //
    // 铁律：林地必须留在军团走廊之外。树是阻挡物，而 13 的编队不会绕路（这点和 DE 不同，
    // DE 的单位会寻路），中场被树封死会直接打不起来。
    // 可用地 = 屏幕内 ∧ 非水 ∧ 走廊外。
    // 🔴 预算必须按**可用格**算，不能按 gw*gh。原因：66×66 的等距网格投影成菱形，
    //    真正落在这块矩形屏幕里的只有一部分；再刨掉军团走廊（两军东西对进、纵向铺满
    //    80% 屏高，中间那块必须空着），剩下的只有上下边缘和四角。
    //    早先按 gw*gh × 12.4% 下预算，绝大多数格子长在屏幕外或走廊里被筛掉，
    //    最后只落地 50 棵树——数字对了，位置全废。
    //
    //    也因此 DE 的「全图 12.4%」不能照搬：DE 是 144×144 大地图、单位只占一角；
    //    我们是两军贴满一屏对撞。这里改成在**可用区内**铺到 DE 林块那种密度，
    //    效果是边缘厚实林带 + 中间开阔战场——既像 DE，又不挡军团。
    const availableCells: Array<[number, number]> = [];
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = isoCellX(gx, gy, ox), py = isoCellY(gx, gy, oy);
            if (px < 0 || px > VW || py < 0 || py > VH) continue;
            if (isWater(px, py) || inArmyCorridor(px, py)) continue;
            availableCells.push([gx, gy]);
        }
    }
    const availableSet = new Set(availableCells.map(([x, y]) => `${x},${y}`));
    const forestBudget = Math.round(
        availableCells.length * forestCoverOfUsableFor(biome) * treeFactor[elevationBand]);
    const forestClumps = 12 + rng.int(0, 5);          // DE: number_of_clumps 10~14（我们可用区是环形，多切几块才散得开）
    const perClumpTarget = Math.max(4, Math.round(forestBudget / forestClumps));
    const forestCells: Array<[number, number]> = [];
    const forestTaken = new Set<string>();

    // 🔴 林块必须**彼此分开**，否则会连成一圈环。
    //    可用区本身就是个环（走廊外那圈），clump 又随便挑种子随便长，长着长着就首尾相接，
    //    出来是一条围着战场的绿框——DE 的林子是几个各自独立、大小不一的团，中间有断口。
    //    所以：种子之间强制留距离，块大小随机浮动。
    const seeds: Array<[number, number]> = [];
    const MIN_SEED_DIST = 9;                          // 格。小于这个数相邻两块会粘连成片
    for (let c = 0; c < forestClumps && forestCells.length < forestBudget; c++) {
        let seed: [number, number] | null = null;
        for (let a = 0; a < 80; a++) {
            const cand = availableCells[rng.int(0, availableCells.length - 1)];
            if (forestTaken.has(`${cand[0]},${cand[1]}`)) continue;
            // 🔴 [2026-08-24 主人定] 攻方从左入场、守方在右，而右侧大多要摆城池——
            //    林地一律偏左布置，右半只留少量，免得树挡住城。
            if (isoCellX(cand[0], cand[1], ox) > VW * 0.5 && !rng.chance(0.22)) continue;
            let tooClose = false;
            for (const s of seeds) {
                if (Math.hypot(cand[0] - s[0], cand[1] - s[1]) < MIN_SEED_DIST) { tooClose = true; break; }
            }
            if (tooClose) continue;
            seed = cand; break;
        }
        if (!seed) continue;
        seeds.push(seed);
        // 块大小 0.55~1.45 倍浮动：DE 的林块有大有小，一律同尺寸会显得是刷出来的
        const target = Math.max(4, Math.round(perClumpTarget * (0.55 + rng.next() * 0.9)));
        for (const cell of growClump(seed[0], seed[1], target, gw, gh, forestTaken, rng)) {
            // clump 会长出可用区，逐格再筛一次
            if (!availableSet.has(`${cell[0]},${cell[1]}`)) continue;
            forestCells.push(cell);
        }
    }

    // 林地地表（DE 的森林是实打实的一种地形，不是半透明叠色）
    if (forestCells.length > 0) {
        patches.push({
            tile: forestFloorTile,
            cells: forestCells,
            alpha: season === 2 ? 0.55 : 0.85,
            category: 'forest-floor',
        });
        for (const [gx, gy] of forestCells) occupied.add(`${gx},${gy}`);
    }

    // 在林地格上长树。DE 实测 472 棵 / 542 格 ≈ 0.87 棵每格，基本一格一棵、树冠互相压着，
    // 所以这里**不套用 hasTreePassage 的最小间距**——那条约束正是旧版长不出林子的原因。
    let placed = 0;
    for (const [gx, gy] of forestCells) {
        if (!rng.chance(TREES_PER_FOREST_TILE)) continue;
        const jx = (rng.next() - 0.5) * TILE_W * 0.5;   // 格内轻微抖动，免得排成棋盘
        const jy = (rng.next() - 0.5) * TILE_H * 0.5;
        const tx = isoCellX(gx, gy, ox) + jx;
        const ty = isoCellY(gx, gy, oy) + jy;
        if (tx < 0 || tx > VW || ty < 0 || ty > VH) continue;
        const asset = (secondaryTree && rng.chance(0.15)) ? secondaryTree : primaryTree;
        // 🔴 placementGroup 让同组物件互不排斥。没有它，enforceAllObjectSpacing 会按
        //    树的斥力半径 65px（两棵树最小间距 130px ≈ 隔两格）把密林剔成稀疏散点——
        //    这正是「林地铺了 444 格却只长出 58 棵树」的原因。DE 的森林就是一格一棵、
        //    树冠互相压着，同一片林子内部不该有间距约束。
        objects.push({
            asset, x: tx, y: ty, layer: 'world', z: 1,
            flip: rng.chance(0.5), frame: rng.int(0, 99999),
            placementGroup: 'forest',
        });
        treePositions.push({ x: tx, y: ty });
        placed++;
    }

    // 林外散株（DE: STRAGGLER_FOREST，number_of_tiles 64 / number_of_clumps 3）：
    // 空地上零星几棵孤树，这才是「孤树」该出现的地方。散株保留最小间距。
    const stragglers = Math.max(3, Math.round(treeCount * 0.5));
    for (let i = 0; i < stragglers; i++) {
        let tx = 0, ty = 0, ok = false;
        for (let a = 0; a < 40; a++) {
            const px = VW * (0.05 + rng.next() * 0.90);
            const py = VH * (0.05 + rng.next() * 0.90);
            if (isWater(px, py) || inArmyCorridor(px, py)) continue;
            if (!hasTreePassage(px, py)) continue;
            if (isObjectOverlapping(px, py, 'PINE', objects)) continue;
            tx = px; ty = py; ok = true; break;
        }
        if (!ok) continue;
        const asset = (secondaryTree && rng.chance(0.3)) ? secondaryTree : primaryTree;
        objects.push({ asset, x: tx, y: ty, layer: 'world', z: 1, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
        treePositions.push({ x: tx, y: ty });
        placed++;

        // 孤树伴生：树下偶见灌木/蕨类/倒木
        if (rng.chance(0.40)) {
            const companionAsset = rng.pick(['SHRUB_GREEN', 'BUSH_GREEN', 'FERNPATCH', 'FELLED_GENERIC', 'STUMP_GENERIC']);
            const compX = tx + (rng.next() - 0.5) * 36;
            const compY = ty + (rng.next() - 0.5) * 20;
            if (!isWater(compX, compY) && !inArmyCorridor(compX, compY)) {
                objects.push({
                    asset: companionAsset,
                    x: compX,
                    y: compY,
                    layer: GROUND_COVER_ASSETS.has(companionAsset) ? 'ground' : 'world',
                    z: 0,
                    flip: rng.chance(0.5),
                    frame: rng.int(0, 99999),
                });
            }
        }
    }
    const themeDecor = decorForTheme(theme, season, lat, elev, biome);

    // 🔴【岩石成套伴生系统】：全图 4~7 处岩石群，主岩石必定紧密伴生碎石、灌木与草花
    const solidDecorCount = 4 + rng.int(0, 3);
    for (let i = 0; i < solidDecorCount; i++) {
        const asset = rng.pick(themeDecor.solid);
        const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, inArmyCorridor);
        if (p) {
            const placementGroup = asset.startsWith('ROCK') ? `solid-${i}` : undefined;
            objects.push({
                asset,
                x: p.x,
                y: p.y,
                layer: 'world',
                z: 0,
                flip: rng.chance(0.5),
                frame: rng.int(0, 99999),
                placementGroup,
            });

            if (placementGroup) {
                // 1. 伴生小碎石 1~2 块
                const smallRockCount = 1 + rng.int(0, 2);
                for (let si = 0; si < smallRockCount; si++) {
                    const ang = rng.next() * Math.PI * 2;
                    const dist = 22 + rng.next() * 24;
                    const sx = p.x + Math.cos(ang) * dist;
                    const sy = p.y + Math.sin(ang) * dist * 0.6;
                    if (sx >= 0 && sx <= VW && sy >= 0 && sy <= VH && !isWater(sx, sy) && !inArmyCorridor(sx, sy)) {
                        const sAsset = rng.pick(['ROCK1', 'ROCK2', 'ROCK3']);
                        objects.push({
                            asset: sAsset,
                            x: sx,
                            y: sy,
                            layer: 'world',
                            z: 0,
                            flip: rng.chance(0.5),
                            frame: rng.int(0, 99999),
                            placementGroup,
                        });
                    }
                }

                // 2. 伴生野生灌木与矮丛 1~2 株
                const bushCount = 1 + rng.int(0, 1);
                for (let bi = 0; bi < bushCount; bi++) {
                    const ang = rng.next() * Math.PI * 2;
                    const dist = 18 + rng.next() * 20;
                    const bx = p.x + Math.cos(ang) * dist;
                    const by = p.y + Math.sin(ang) * dist * 0.6;
                    if (bx >= 0 && bx <= VW && by >= 0 && by <= VH && !isWater(bx, by) && !inArmyCorridor(bx, by)) {
                        const bAsset = rng.pick(['BUSH_GREEN', 'SHRUB_GREEN', 'FERNPATCH']);
                        objects.push({
                            asset: bAsset,
                            x: bx,
                            y: by,
                            layer: GROUND_COVER_ASSETS.has(bAsset) ? 'ground' : 'world',
                            z: 0,
                            flip: rng.chance(0.5),
                            frame: rng.int(0, 99999),
                            placementGroup,
                        });
                    }
                }
            }
        }
    }

    // 🔴【荒原枯荣伴生】：干旱荒原与沙漠生成枯木、动物骨骸与干草
    if (biome === 'desert' || biome === 'cold_steppe' || biome === 'savanna') {
        const wasteCount = 2 + rng.int(0, 2);
        for (let i = 0; i < wasteCount; i++) {
            const p = sampleLandPos(VW, VH, rng, isWater, 'DEAD_TREE', objects, inArmyCorridor);
            if (p) {
                objects.push({
                    asset: 'DEAD_TREE',
                    x: p.x,
                    y: p.y,
                    layer: 'world',
                    z: 0,
                    flip: rng.chance(0.5),
                    frame: rng.int(0, 99999),
                });
                if (rng.chance(0.6)) {
                    const skelAsset = rng.pick(['ANIMAL_SKELETON', 'SKELETON', 'STUMP_GENERIC', 'PLANT_DEAD']);
                    objects.push({
                        asset: skelAsset,
                        x: p.x + (rng.next() - 0.5) * 32,
                        y: p.y + (rng.next() - 0.5) * 18,
                        layer: GROUND_COVER_ASSETS.has(skelAsset) ? 'ground' : 'world',
                        z: 0,
                        flip: rng.chance(0.5),
                        frame: rng.int(0, 99999),
                    });
                }
            }
        }
    }

    // ── 开阔平原微点缀（草地微花草/贴花，100% 不挡路，赋予辽阔平原生命力） ──
    const decorCount = 14 + rng.int(0, 10);
    for (let i = 0; i < decorCount; i++) {
        const asset = rng.pick(themeDecor.flat);
        const p = sampleLandPos(VW, VH, rng, isWater, asset, objects);
        if (p) {
            objects.push({
                asset,
                x: p.x,
                y: p.y,
                layer: GROUND_COVER_ASSETS.has(asset) ? 'ground' : 'world',
                z: 0,
                flip: rng.chance(0.5),
                frame: rng.int(0, 99999),
            });
        }
    }

    // 🔴 [2026-08-23 主人] 地上长草：BIOME_GROUND_DECOR（草/花/灌木/小植物）此前从未接线 → 地面光秃无草。
    //    补 DE 级植被覆盖：数量≈树的 2~3 倍（原注释「数量约为树的 2~3 倍」的意图），
    //    只撒 GROUND_COVER_ASSETS 里的地面贴花（草/花/小植物，烘焙入地面、100% 不挡路），
    //    剔掉岩石/灌木/仙人掌（岩石走 solidDecor、灌木走树伴生，避免世界层精灵堆太密）。
    const groundDecorAssets = (BIOME_GROUND_DECOR[biome] ?? []).filter((a) => GROUND_COVER_ASSETS.has(a));
    if (groundDecorAssets.length > 0) {
        const groundDecorCount = Math.max(40, Math.round(treeCount * 2.5));
        for (let i = 0; i < groundDecorCount; i++) {
            const asset = rng.pick(groundDecorAssets);
            const p = sampleLandPos(VW, VH, rng, isWater, asset, objects);
            if (p) {
                objects.push({
                    asset,
                    x: p.x,
                    y: p.y,
                    layer: 'ground',
                    z: 0,
                    flip: rng.chance(0.5),
                    frame: rng.int(0, 99999),
                });
            }
        }
    }
}

function buildResources(VW: number, VH: number, season: 0 | 1 | 2, rng: RandomSource, objects: EnvironmentObjectPlan[], isWater: WaterChecker, waterKind: 'sea' | 'lake' | 'river' | 'none' | undefined, biome: Biome): void {
    // 🔴 [2026-08-21 素材全覆盖] 资源按 biome 科学分配：
    //    热带（雨林/稀树草原）= 木瓜/菠萝；温带（林/草原/地中海）= 浆果/果灌；
    //    干旱（沙漠/冷草原）= 果灌少量；寒带 = 无果（仅石矿）；冬季全部仅石矿。
    let resAssets: string[];
    if (season === 2) {
        resAssets = ['MINE_STONE'];
    } else if (biome === 'tropical_rainforest' || biome === 'savanna') {
        resAssets = ['FORAGE_PAPAYA', 'FORAGE_PINEAPPLE', 'MINE_STONE'];
    } else if (biome === 'temperate_forest' || biome === 'temperate_grass' || biome === 'mediterranean') {
        resAssets = ['FORAGE_BUSH', 'FORAGE_FRUIT', 'MINE_STONE'];
    } else if (biome === 'desert' || biome === 'cold_steppe') {
        resAssets = ['FORAGE_FRUIT', 'MINE_STONE'];
    } else {
        resAssets = ['MINE_STONE'];
    }
    const resCount = 2 + rng.int(0, 2);
    const inArmyCorridor = (x: number, y: number): boolean => {
        return x >= VW * 0.15 && x <= VW * 0.85 && y >= VH * 0.10 && y <= VH * 0.90;
    };

    for (let i = 0; i < resCount; i++) {
        const asset = rng.pick(resAssets);
        const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, inArmyCorridor);
        if (p) objects.push({ asset, x: p.x, y: p.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }
}


// 重新导出 hashString，供测试/验收计算种子校验和
export { hashString };
