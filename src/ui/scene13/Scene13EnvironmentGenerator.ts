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
import { isNearStrategicRiver } from '../../map/StrategicRiverProximity';
import { RandomSource, createRandom, hashString } from './Random';
import {queryBaseTile} from './WorldBaseMap';
import { pickTree, treeDensityFor } from './TreeAssignment';
import { filterDecor, groundDecorFor, countForCover, assetTiles,
         SCATTER_COVER, FLAT_COVER, type DecorFitQuery } from './DecorFit';
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
    treesForTheme,   // 只在拿不到经纬度时兜底，正常走 TreeAssignment
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
    /** 水域碰撞/排斥检查器（输入屏幕 px, py，返回是否在水域中） */
    isWater?: WaterChecker;
}

export interface Scene13EnvironmentInput {
    /** 战场中心经纬度（缺省走防御分支） */
    lat?: number;
    lng?: number;
    /** 攻防战守方据点坐标：只用于判定据点是否临水，不改变镜头与气候坐标。 */
    waterProbeLat?: number;
    waterProbeLng?: number;
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
    /**
     * 强制水域，覆盖 probeWater 的探测结果。
     * 🔴 不只是测试用：**水军攻城战**靠它保证战场左侧一定出海
     *    （主人 2026-08-24：「如果是水军的攻城战，做用左边是海的图」）。
     *    水军打的城本来就在海边，探测失灵就变成内陆战场，那这仗白是水军了。
     */
    forceWaterKind?: 'sea' | 'lake' | 'river' | 'none';
    /** 🔧 [2026-08-24 背景图预览工具] 强制 DE 主题，跳过按经纬度解析（工具要定点枚举 18 套主题） */
    forceTheme?: DeMapThemeId;
    /**
     * 禁植区：这些圆里不长树。攻城战传守方各出生点 + 城池石基半径。
     *
     * 🔴 [2026-08-24] 不传的后果实测过：平均每场攻城战 **3.8 棵树长在守方城池石基上**
     *    （最多 13 棵），而攻城战总共才 10~19 棵——两三成的树戳在城墙和城门前的
     *    硬化石路上。军团走廊拦不住它：守方最后排在 x≈93% VW，走廊只到 82%。
     *    城池位置只有 Scene13WarLayer 知道（它先算 spawns 再调这里），所以由它传进来。
     */
    keepClear?: ReadonlyArray<{ x: number; y: number; r: number }>;
    /** 🔧 [同上] 强制海拔档；缺省仍按 resolveElevationBand 走 */
    forceElevationBand?: ElevationBand;
    /** 🔧 [同上] 强制海拔米数（喂给树种/地表/丘陵密度判定），覆盖 ESRI 采样 */
    forceElevationM?: number;
    /** 测试/控制用：强制是否生成横贯战场的平坦帝国大道 */
    forceHasRoad?: boolean;
    /** 战斗类型：是否为攻防战（攻城战/据点防守战） */
    isSiege?: boolean;
    /** 攻防战正面城墙的实际屏幕 X；临城河据此贴墙生成。 */
    siegeWallFrontX?: number;
}

/** 河岸只允许河滩鹅卵石/湿石（如 ROCK_BEACH/ROCK1/ROCK2/ROCK3）；排除巨型风蚀岩柱(ROCK_FORMATION/ROCK_PILLAR)、海礁与非石物件。 */
export function filterRiverBankRockAssets(assets: readonly string[]): string[] {
    return assets.filter((name) =>
        (name.startsWith('ROCK') || name === 'ROCK_BEACH') &&
        !name.startsWith('ROCK_FORMATION') &&
        name !== 'ROCK_PILLAR' &&
        name !== 'ROCK_JUNGLE' &&
        !name.startsWith('ROCK_SEA')
    );
}

const HALF_TILE_OBSTRUCTION = { x: 0.5, y: 0.5 } as const;
// 挡路障碍物被单位连续接触满 N 秒后释放碰撞（防卡死）。主人 2026-08-21 定「5 秒一切换，就树和岩石」。
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
    // 🔴 [2026-08-24 主人：「你弄那么多树干什么」] 大幅下调。
    //    此前照 DE 地中海**森林**图量的 472 棵去凑，但那是森林图；
    //    DE 的干旱/草原图树本来就稀疏（见主人发的干旱截图，全屏只有几十棵散树）。
    //    而且我们九成是攻城战，主人定「树零星摆几个也行」——
    //    树多了既挡视线又挤掉战场，还把地形起伏盖住。
    switch (biome) {
        case 'tundra_snow': return 0.03;
        case 'desert': return 0.04;
        case 'cold_steppe': return 0.06;
        case 'savanna':
        case 'mediterranean': return 0.10;
        case 'tropical_rainforest':
        case 'temperate_forest': return 0.22;
        default: return 0.15;
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
        // 纯贴图（无碰撞）：树木、岩石、木桶、墓碑、骸骨、芦苇、睡莲。
        // 树仍按 world 层深度排序绘制，只是不再推挤、阻挡士兵。
        if (DE_TREE_OBJECTS.has(a) || a.startsWith('ROCK') || a === 'BARRELS' || a === 'GRAVES' || a === 'SKELETON' || a === 'REEDS' || a === 'WATER_LILY' || a === 'OYSTERS') {
            object.obstruction = undefined;
            object.obstructionReleaseAfterSec = undefined;
            continue;
        }
        object.obstruction = DE_OBJECT_OBSTRUCTION[a]
            ?? (DE_HALF_TILE_OBJECTS.has(a) ? HALF_TILE_OBSTRUCTION : undefined);
    }
}

function getAssetRepulsionRadius(asset: string): number {
    if (asset.startsWith('CLIFF') || asset.startsWith('SHORT_CLIFF') || asset.startsWith('MOUNTAIN_')) return 150;
    if (asset.startsWith('BATTLEFIELD:DECAY_')) return 130; // 攻城器械残骸（288×160 大型）
    if (asset.startsWith('BATTLEFIELD:BARRICADE') || asset.startsWith('BATTLEFIELD:STAKE')) return 100; // 拒马鹿角
    if (asset.startsWith('BATTLEFIELD:')) return 55; // 其他战场遗存（骷髅/烽火）
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
        if (asset.startsWith('ROCK') || asset.startsWith('MINE_') || asset.startsWith('BATTLEFIELD:DECAY_') || asset.startsWith('BATTLEFIELD:BARRICADE')) return 3;
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
/**
 * DE `create_object` 的放置约束（见 de-map-algorithm.md §3.2）。
 * 🔴 [2026-08-24 主人：「我不是说了全做吗」] 这几条以前全没有：
 *   - `avoid_forest_zone`（1705 次）  装饰不许长进林子里
 *   - `avoid_cliff_zone`（1492 次）   不许贴着悬崖
 *   - `min_distance_to_map_edge`（896 次） 离图边留距离，免得半个精灵被切掉
 *   - `find_closest`（1570 次）       找**最近**的合法点，而不是随机撞
 */
export interface PlacementLimits {
    /** 这个点在不在林子里 */
    inForest?: (x: number, y: number) => boolean;
    /** 这个点在不在悬崖旁 */
    nearCliff?: (x: number, y: number) => boolean;
    /** 离屏幕边缘至少多少像素 */
    edgeMargin?: number;
    /** true = 从锚点向外找最近的合法点（DE 的 find_closest） */
    findClosest?: { ax: number; ay: number };
}

function sampleLandPos(
    VW: number,
    VH: number,
    rng: RandomSource,
    isWater: WaterChecker,
    asset?: string,
    objects?: EnvironmentObjectPlan[],
    inBattleCenter?: (x: number, y: number) => boolean,
    limits?: PlacementLimits,
): { x: number; y: number } | null {
    const ok = (x: number, y: number): boolean => {
        if (isWater(x, y)) return false;
        if (inBattleCenter && inBattleCenter(x, y)) return false;
        if (limits?.edgeMargin) {
            const m = limits.edgeMargin;
            if (x < m || x > VW - m || y < m || y > VH - m) return false;
        }
        if (limits?.inForest?.(x, y)) return false;
        if (limits?.nearCliff?.(x, y)) return false;
        if (asset && objects && isObjectOverlapping(x, y, asset, objects)) return false;
        return true;
    };
    // find_closest：从锚点螺旋向外扩，取第一个合法点
    if (limits?.findClosest) {
        const { ax, ay } = limits.findClosest;
        if (ok(ax, ay)) return { x: ax, y: ay };
        for (let r = 24; r <= 480; r += 24) {
            for (let k = 0; k < 12; k++) {
                const a = (k / 12) * Math.PI * 2 + rng.next() * 0.3;
                const x = ax + Math.cos(a) * r, y = ay + Math.sin(a) * r * 0.6;
                if (x < 0 || x > VW || y < 0 || y > VH) continue;
                if (ok(x, y)) return { x, y };
            }
        }
        return null;
    }
    for (let attempt = 0; attempt < 100; attempt++) {
        const x = rng.next() * VW;
        const y = rng.next() * VH;
        if (ok(x, y)) return { x, y };
    }
    return null;
}

function sampleSiegeStoneAnchor(VW: number, VH: number, rng: RandomSource): { ax: number; ay: number } {
    const roll = rng.next();
    const quarter = roll < 0.40 ? 0 : roll < 0.70 ? 1 : roll < 0.90 ? 2 : 3;
    return {
        ax: VW * ((quarter + rng.next()) / 4),
        ay: VH * (0.24 + rng.next() * 0.52),
    };
}

// ── 水域探测（高精度多尺度雷达密网扫描，判定据点是否临水/有江河海湾） ──

function probeWater(lat: number | undefined, lng: number | undefined): 'sea' | 'lake' | 'river' | 'none' {
    if (lat === undefined || lng === undefined) return 'none';

    // 战略地图可见河流还包含 Natural Earth 矢量中心线；复用同一份数据，避免战略有河、战术没河。
    if (isNearStrategicRiver(lat, lng, 25)) return 'river';
    
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
    const waterKind = input.forceWaterKind
        ?? probeWater(input.waterProbeLat ?? input.lat, input.waterProbeLng ?? input.lng);
    const topology: Scene13Topology = resolveBattleTopology(hasCoord, waterKind, elev, slope, biome, rng);
    const theme = input.forceTheme
        ? DE_MAP_THEMES[input.forceTheme]
        : (hasCoord ? resolveDeMapTheme(input.lat!, input.lng!, biome, elev, waterKind) : null);
    // ── 底图：优先查真实地理查找表 ──────────────────────────────
    // 🔴 [2026-08-24 主人定稿] 底图由**真实气候数据**决定，不再靠 DE 主题推。
    //    DE 的 18 个主题是它抽随机地图用的，跟真实地理没关系（DE 的「地中海」只是
    //    长得像地中海，不是地中海气候），拿它选底图会让同一个地方年年长不一样。
    //    查找表见 public/world/world-base.png，判据见 docs/02-design/climate-regions.md。
    //    查不到（数据没加载 / 落在海面）才回退到旧的主题逻辑，不在这里编默认值。
    const fromWorld = (input.lat !== undefined && input.lng !== undefined)
        ? queryBaseTile({
            lat: input.lat,
            lng: input.lng,
            isSiege: input.isSiege ?? false,
            isWinter: season === 2,
        })
        : null;
    const baseTerrain: string = fromWorld ?? (theme
        ? terrainForTheme(theme, biome, season, elevationBand, input.lat, elev, input.isSiege ?? false, input.lng)
        : DEFAULT_TERRAIN_TILE);

    // 🔴 [2026-08-24] 植被看**自然环境**，不看地面被踩成什么样。
    //    攻城战底图是「城郊被人踩踏碾压的裸土」，是人为改造的结果；
    //    同一个地点该长什么树、长多少，由当地的野战底图（真实植被条件）决定。
    //    不这么做的后果实测过：149/942 座城的攻城战树比野战还多——因为攻城底图
    //    那 7 张全是宜居地的泥土，天然比当地实际的戈壁/流沙/干草原「湿润」。
    //    攻城战的「树更少」由 treeDensityFor 的 isSiege 折扣负责，不靠底图差异。
    const vegetationTile: string = (input.lat !== undefined && input.lng !== undefined
        ? queryBaseTile({ lat: input.lat, lng: input.lng, isSiege: false, isWinter: season === 2 })
        : null) ?? baseTerrain;
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

        // 🔴 [严格遵循 DE 与史实]：
        // 攻城战为城郭攻防战场，核心为城前平原与城防阵线，绝不擅自横插切断战场的假河；
        // 仅在真正的野战江河渡口 (river_crossing) 或大江野战时生成自然江河。
        if (waterKind === 'sea') {
            // 🔴 [2026-08-21 主人定，2026-08-24 恢复] 攻方恒在左侧，海岸线恒定在左侧（sideLeft = true），
            //    呈现攻方破浪抢滩突击、守方陆地坚守的登陆战演出；严禁海在右侧导致守方出生在水中。
            //    野战与攻防战都出海：主人九成战斗是攻防战，只在野战出就等于看不见。
            isWater = buildCoastline(gw, gh, ox, oy, VW, VH, true, rng, patches, occupied, theme!, season, input.lat, elev, biome, input.lng);
                        // 🔴 [2026-09-01 主人指出「石头有点多」] 海岸线以生蚝海贝、海滩芦苇为主，海礁/海石整条岸线严格封顶最多 1 块，且沿 Y 轴分散
            let coastRockCount = 0;
            const MAX_COAST_ROCKS = 1;
            for (let i = 0; i < 3; i++) {
                const pool = (coastRockCount >= MAX_COAST_ROCKS)
                    ? ['OYSTERS', 'REEDS', 'REEDS']
                    : ['OYSTERS', 'REEDS', 'ROCK_BEACH', 'ROCK_SEA1'];
                const ra = rng.pick(pool);
                if (ra.startsWith('ROCK')) {
                    coastRockCount++;
                }
                const rockX = VW * 0.08 + rng.next() * VW * 0.08;
                const rockY = ((i + 0.5 + (rng.next() - 0.5) * 0.5) / 3) * VH;
                objects.push({ asset: ra, x: rockX, y: rockY, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
            }
        // 🔴 [2026-09-01 主人定] 挨着河的攻防战就该有河 —— 名城多依水而建：
        //    襄阳汉水、马格德堡易北河、巴黎塞纳河、开封汴河，围城方渡河强攻是真实画面。
        //    判据是 probeWater 扫出来的真实水系（waterKind==="river"），不是给每座城硬塞一条。
        //    野战 → 中轴渡口（crossing）；临河城攻防 → 贴城墙外侧的临城河（moat）。
        } else if (topology === 'river_crossing' || waterKind === 'river') {
            // 只有 probeWater 判定「城池周边真有水系」的攻城战才出河；内陆无水的城照旧无河。
            isWater = buildRiver(gw, gh, ox, oy, VW, VH, rng, patches, objects, occupied, theme!, season, input.lat, elev, biome, input.lng,
                                 input.isSiege ? 'moat' : 'crossing', input.siegeWallFrontX);
        } else if (waterKind === 'lake') {
            // 内陆湖 / 绿洲水塘。攻防战也出——水塘只占战场一角，不像江河那样横切战场。
            const corridor = (x: number, y: number): boolean =>
                x >= VW * 0.18 && x <= VW * 0.82 && y >= VH * 0.12 && y <= VH * 0.88;
            isWater = buildLake(gw, gh, ox, oy, VW, VH, rng, patches, occupied,
                                theme!, season, input.lat ?? 35, elev, biome, corridor, input.lng);
        }

        // 水面保持零高程：严禁高程光影或突起切进水面（保持 100% 平坦如砥）
        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) {
                const px = isoCellX(gx, gy, ox);
                const py = isoCellY(gx, gy, oy);
                if (isWater(px, py)) elevation[gy][gx] = 0;
            }
        }

        // ── 第 4 层 TERRAIN：同一套 DE 主题内的地表变体 + 林地底层 ──
        buildGroundVariation(gw, gh, biome, season, theme!, rng, patches, occupied, input.lat, elev, waterKind, input.isSiege ?? false, input.lng, baseTerrain, elevation);
        buildForestFloor(gw, gh, biome, season, theme!, rng, patches, occupied, input.lat, elev, undefined, input.lng, vegetationTile);

        // ── 第 5 层 OBJECTS：同一套 DE 主题内的树 / 悬崖断崖 / 平面装饰 / 实体装饰 + 通用资源 ──
        buildVegetation(VW, VH, gw, gh, ox, oy, biome, elevationBand, season, theme!, rng, objects, patches, occupied, isWater, input.lat, elev, waterKind, vegetationTile, input.lng, input.isSiege ?? false,
                        input.keepClear ?? [], baseTerrain);
        buildResources(VW, VH, season, rng, objects, isWater, waterKind, biome, baseTerrain, input.isSiege ?? false,
                       input.keepClear ?? []);

        enforceAllObjectSpacing(objects);
        attachDeObjectObstruction(objects);
        return {
            seed, topology, climateRegion, elevationBand, elevationM: elev, slopeDeg: slope,
            biome, deMapTheme: theme!.id, season, baseTerrain, waterKind, grid, elevation, terrainPatches: patches, objects, isWater,
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
    | 'rolling_hills'          // 5. 连绵丘陵与战术双高地 (Mongolia / Gold Rush)
    | 'steppe_oasis'           // 6. 苍茫草原戈壁绿洲 (Steppe / Oasis)
    | 'swamp_marsh'            // 7. 湿地沼泽浅泥水泊 (Bogland / Swamp)
    | 'imperial_highway';      // 8. 帝国驿道

function resolveBattleTopology(
    hasCoord: boolean,
    waterKind: 'sea' | 'lake' | 'river' | 'none',
    elev: number | null,
    slope: number | null,
    biome: Biome,
    rng: RandomSource
): Scene13Topology {
    if (waterKind === 'river') return 'river_crossing';
    if (waterKind === 'lake') return rng.chance(0.6) ? 'swamp_marsh' : 'steppe_oasis';
    if (elev !== null && (elev >= 500 || (slope !== null && slope >= 5))) {
        return rng.pick(['rolling_hills', 'highland_ridge', 'canyon_pass']);
    }
    if (biome === 'temperate_forest' || biome === 'boreal' || biome === 'tropical_rainforest') {
        return rng.pick(['dense_forest_clearing', 'rolling_hills', 'imperial_highway', 'highland_ridge']);
    }
    if (biome === 'cold_steppe' || biome === 'savanna' || biome === 'desert') {
        return rng.pick(['rolling_hills', 'steppe_oasis', 'imperial_highway', 'highland_ridge', 'canyon_pass']);
    }
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

// ── 第 2 层：经典帝国时代式 2.5D 高台丘陵与起伏高度场生成 ──────────────────

/**
 * DE 原版正统多尺度自然高台与丘陵群高度场生成器：
 * 1. 错落分布 3~6 处立体战术高地与连绵小山包；
 * 2. 具备清晰完整的海拔层次：Level 2/3 制高平顶 + Level 1/2 宽阔缓坡 + Level 1 坡脚基底；
 * 3. 几何形态有机自然（椭圆旋转走向 + 微量地质扰动），坡度连续，绝无断层。
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
        // 峡谷关隘：在南北两侧生成自然起伏、错落相连的有机山脊群，中间保留开阔行军通道，绝不使用全屏水平直线硬切
        const canyonHills = [
            // 北侧山脊群（顶部边缘，左右错落）
            { rxFrac: 0.22, ryFrac: 0.12, rX: 8, rY: 4.5 },
            { rxFrac: 0.50, ryFrac: 0.09, rX: 10, rY: 5.0 },
            { rxFrac: 0.78, ryFrac: 0.13, rX: 8.5, rY: 4.2 },
            // 南侧山脊群（底部边缘，左右错落）
            { rxFrac: 0.24, ryFrac: 0.88, rX: 8.5, rY: 4.5 },
            { rxFrac: 0.52, ryFrac: 0.91, rX: 9.5, rY: 5.2 },
            { rxFrac: 0.80, ryFrac: 0.87, rX: 8, rY: 4.0 },
        ];

        for (const ch of canyonHills) {
            const hScreenX = VW * (ch.rxFrac + (rng.next() - 0.5) * 0.08);
            const hScreenY = VH * (ch.ryFrac + (rng.next() - 0.5) * 0.04);
            const [hillGx, hillGy] = screenToGrid(hScreenX, hScreenY, ox, oy);
            const cx = Math.max(4, Math.min(gw - 5, hillGx));
            const cy = Math.max(4, Math.min(gh - 5, hillGy));

            const rx = ch.rX + (rng.next() - 0.5) * 2;
            const ry = ch.rY + (rng.next() - 0.5) * 1.5;
            const angle = (rng.next() - 0.5) * 0.8;
            const hMax = (elev !== null && elev >= 800) ? 3 : 2;

            const maxR = Math.ceil(Math.max(rx, ry) * 1.25);
            const minX = Math.max(3, cx - maxR), maxX = Math.min(gw - 4, cx + maxR);
            const minY = Math.max(3, cy - maxR), maxY = Math.min(gh - 4, cy + maxR);

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const rxRot = dx * Math.cos(angle) - dy * Math.sin(angle);
                    const ryRot = dx * Math.sin(angle) + dy * Math.cos(angle);
                    const normDist = Math.sqrt((rxRot / rx) ** 2 + (ryRot / ry) ** 2);
                    if (normDist >= 1.0) continue;

                    let h = 0;
                    if (normDist < 0.38) {
                        h = hMax;
                    } else if (normDist < 0.75) {
                        h = Math.max(1, hMax - 1);
                    } else {
                        h = 1;
                    }

                    if (h > grid[y][x]) {
                        grid[y][x] = h;
                    }
                }
            }
        }
        return grid;
    }

    const hillCount = (elev !== null && (elev >= 800 || (slope !== null && slope >= 10)))
        ? 4 + rng.int(0, 2)
        : (elev !== null && elev >= 300)
            ? 3 + rng.int(0, 2)
            : 2 + rng.int(0, 2);

    for (let i = 0; i < hillCount; i++) {
        // 严格限制在屏幕中央安全区，绝不延伸到屏幕/网格边界
        const regionX = (i % 2) * 0.36 + 0.32 + (rng.next() - 0.5) * 0.12;
        const regionY = Math.floor(i / 2) * 0.36 + 0.32 + (rng.next() - 0.5) * 0.12;
        const hillScreenX = VW * Math.max(0.20, Math.min(0.80, regionX));
        const hillScreenY = VH * Math.max(0.22, Math.min(0.78, regionY));

        const [hillGx, hillGy] = screenToGrid(hillScreenX, hillScreenY, ox, oy);
        const cx = Math.max(5, Math.min(gw - 6, hillGx));
        const cy = Math.max(5, Math.min(gh - 6, hillGy));

        const isMajor = i === 0;
        const rx = isMajor ? (9 + rng.next() * 5) : (4.5 + rng.next() * 3.5);
        const ry = isMajor ? (6.5 + rng.next() * 3.5) : (3.2 + rng.next() * 2.5);
        const hMax = isMajor ? ((elev !== null && elev >= 800) ? 3 : 2) : 1;
        const angle = (rng.next() - 0.5) * 1.5;

        // 仅在局部山丘半径内扫描
        const maxR = Math.ceil(Math.max(rx, ry) * 1.25);
        const minX = Math.max(4, cx - maxR), maxX = Math.min(gw - 5, cx + maxR);
        const minY = Math.max(4, cy - maxR), maxY = Math.min(gh - 5, cy + maxR);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const rxRot = dx * Math.cos(angle) - dy * Math.sin(angle);
                const ryRot = dx * Math.sin(angle) + dy * Math.cos(angle);
                const normDist = Math.sqrt((rxRot / rx) ** 2 + (ryRot / ry) ** 2);
                if (normDist >= 1.0) continue; // 局部严格闭合，超出半径严格归 0

                let h = 0;
                if (normDist < 0.38) {
                    h = hMax; // 丘顶平坦高台
                } else if (normDist < 0.75) {
                    h = Math.max(1, hMax - 1); // 宽阔缓坡
                } else {
                    h = 1; // 坡脚过渡
                }

                if (h > grid[y][x]) {
                    grid[y][x] = h;
                }
            }
        }
    }

    return grid;
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
    /** 战场经度 —— 积雪判定要查真实气候数据，不能只按纬度估 */
    lng?: number,
): WaterChecker {
    // 🌊 DE 原版自然有机海岸线（2026-08-26 美化重构）：
    // 1. 彻底消除平滑圆弧与单调大波浪：引入 5 级分形谐波侵蚀（宏观大走势 + 中频半月小海湾与突岬 + 高频凹凸沙嘴 + 细碎潮汐侵蚀锯齿）；
    // 2. 真实 DE 通透水色生态：金黄水下沙床垫底 -> 近岸清澈通透浅水(透出水下金沙) -> 湿润潮汐沙滩 -> 宽阔干燥金沙过渡带；
    // 3. 严格安全占地：水域与浅水/湿沙带全部标记为 occupied，确保营帐和哨塔必定稳固坐落在干燥陆地草地上。

    // 多频有机岸线边界计算函数（输入 y，输出沿屏幕 x 的岸线位置）
    const baseMargin = VW * 0.13;
    const waveSeed1 = rng.next() * 100;
    const waveSeed2 = rng.next() * 100;
    const waveSeed3 = rng.next() * 100;
    const waveSeed4 = rng.next() * 100;

    const naturalShoreX = (y: number): number => {
        // 1. 低频宏观蜿蜒走向（40~70px）
        const macro = Math.sin(y * 0.0018 + waveSeed1) * (VW * 0.045);
        // 2. 中频半月形海湾与突出岬角（Inlets & Promontories，幅度 25~45px，打破光滑圆弧）
        const meso = Math.sin(y * 0.0075 + waveSeed2) * (TILE_W * 0.55)
            + Math.cos(y * 0.015 + waveSeed3) * (TILE_W * 0.35);
        // 3. 高频潮汐侵蚀小凹凸与细小沙嘴（10~18px）
        const micro = Math.sin(y * 0.035 + waveSeed1 * 1.5) * (TILE_W * 0.18)
            + Math.cos(y * 0.07 + waveSeed2 * 2.1) * (TILE_W * 0.09);
        // 4. 细碎自然沙岸锯齿（3~6px）
        const nano = (Math.sin(y * 0.14 + waveSeed4) + Math.cos(y * 0.22 + waveSeed3)) * (TILE_W * 0.04);

        let bx = baseMargin + macro + meso + micro + nano;
        bx = Math.max(VW * 0.07, Math.min(VW * 0.26, bx));
        return sideLeft ? bx : VW - bx;
    };

    const shoreline: Array<{ x: number; y: number }> = [];
    const sampleStep = Math.max(4, TILE_H / 8); // 密集采样步长（4px），精确捕捉自然凹凸海湾
    for (let y = -TILE_H * 3; y <= VH + TILE_H * 3; y += sampleStep) {
        shoreline.push({ x: naturalShoreX(y), y });
    }

    const boundaryAt = (y: number): number => naturalShoreX(y);
    const inlandSign = sideLeft ? 1 : -1;

    const bandPolygon = (outerOffset: number, innerOffset: number): Array<{ x: number; y: number }> => {
        const outer = shoreline.map((p) => ({ x: p.x + inlandSign * outerOffset, y: p.y }));
        const inner = shoreline.map((p) => ({ x: p.x + inlandSign * innerOffset, y: p.y })).reverse();
        return [...outer, ...inner];
    };

    const shallowW = Math.round(TILE_W * 2.0);   // 近岸透底浅水带宽（约 128px，清澈通透）
    const wetBeachW = Math.round(TILE_W * 0.75);  // 湿润沙滩潮汐过渡带宽（约 48px）
    const dryBeachW = Math.round(TILE_W * 1.50);  // 陆上干燥金沙过渡带宽（约 96px）

    const deep: Array<[number, number]> = [];
    const shallow: Array<[number, number]> = [];
    const wetBeach: Array<[number, number]> = [];
    const dryBeach: Array<[number, number]> = [];
    const subSandbed: Array<[number, number]> = [];

    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = isoCellX(gx, gy, ox);
            const py = isoCellY(gx, gy, oy);
            if (py < -TILE_H * 3 || py > VH + TILE_H * 3) continue;
            const signedDistance = (px - boundaryAt(py)) * inlandSign;
            if (signedDistance < -shallowW) {
                deep.push([gx, gy]);
            } else if (signedDistance < 0) {
                shallow.push([gx, gy]);
                subSandbed.push([gx, gy]);
            } else if (signedDistance < wetBeachW) {
                wetBeach.push([gx, gy]);
            } else if (signedDistance < dryBeachW) {
                dryBeach.push([gx, gy]);
            }
        }
    }

    const mark = (cells: Array<[number, number]>) => { for (const [x, y] of cells) occupied.add(`${x},${y}`); };
    mark(deep); mark(shallow); mark(wetBeach); mark(dryBeach);

    const actualBeachTile = beachTerrainForTheme(theme, season, lat, elev, biome, lng);
    const actualWaterTile = waterTerrainForTheme(theme, season, lat, elev, biome, lng);

    // 1. 水下金色沙床垫底（铺在浅水下，确保水体半透明透视时呈现明亮金黄的浅水河床底质）
    if (subSandbed.length > 0) {
        patches.push({ tile: actualBeachTile, cells: subSandbed, polygon: bandPolygon(-shallowW * 1.2, 0), alpha: 0.95, category: 'shore', blur: 16 });
    }
    // 2. 水陆交界湿沙潮汐带（drt / beach 湿润沙泥色）
    if (wetBeach.length > 0) {
        patches.push({ tile: 'drt', cells: wetBeach, polygon: bandPolygon(-shallowW * 0.2, wetBeachW), alpha: 0.85, category: 'shore', blur: 14 });
    }
    // 3. 陆地干燥金沙过渡边缘（宽阔柔和的岸线沙滩，与内陆草地自然交错咬合）
    if (dryBeach.length > 0) {
        patches.push({ tile: actualBeachTile, cells: dryBeach, polygon: bandPolygon(wetBeachW * 0.5, dryBeachW), alpha: 0.88, category: 'shore', blur: 18 });
    }
    // 4. 外海深水水域：清澈蔚蓝海水（wtr / wt5 / river_clean_green）
    if (deep.length > 0) {
        patches.push({ tile: actualWaterTile, cells: deep, polygon: bandPolygon(-VW, -shallowW * 0.6), alpha: 0.90, category: 'shore', blur: 18 });
    }
    // 5. 近岸浅水带（sh2 = 极度通透的浅水层，水下金沙一览无余，与深水和沙滩柔和交融）
    if (shallow.length > 0) {
        patches.push({ tile: 'sh2', cells: shallow, polygon: bandPolygon(-shallowW * 1.3, 0), alpha: 0.55, category: 'shore', blur: 20 });
    }

    // 水域排斥：signedDistance < 0 视为水域（船只可航行，陆军与建筑不可建）
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
    objects: EnvironmentObjectPlan[],
    occupied: Set<string>,
    theme: DeMapThemePalette,
    season: 0 | 1 | 2 = 0,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
    /** 战场经度 —— 积雪判定要查真实气候数据，不能只按纬度估 */
    lng?: number,
    /**
     * 河道位置。
     *   'crossing' 野战江河渡口 —— 纵向大 S 横贯战场中轴（DE Rivers / Crossing 原样）。
     *   'moat'     临河城攻防 —— 河压在城墙外侧，攻方渡河强攻。
     *
     * 🔴 [2026-09-01 主人定] 只有**真的挨着河**的城才出河（waterKind==='river' 由 probeWater
     *    扫城池周边 500m~25km 的真实水域掩膜得出），不是所有攻城战都塞一条。
     *    史实上名城多依水而建：襄阳汉水、马格德堡易北河、巴黎塞纳河、开封汴河。
     *    ⚠️ 摆幅必须和野战同量级（65/28），收窄过头河会变成一条直线（2026-09-01 实锤）。
     */
    layout: 'crossing' | 'moat' = 'crossing',
    siegeWallFrontX?: number,
): WaterChecker {
    // 🌊 DE 原版 Rivers / Crossing 规范（2026-08-26 美化重构）：
    //   1. Catmull-Rom 样条平滑蜿蜒河道，消除僵硬折线与塑料感；
    //   2. 四层自然河岸分层：湿泥沙岸 (beach_wet) → 清透浅水 (sh2) → 碧绿/蔚蓝江水核心 (river_clean_green/wtr)；
    //   3. 丰富水岸生态：沿岸点缀水草芦苇 (REEDS/WATER_LILY)、河滩鹅卵石与湿石 (ROCK_BEACH/ROCK1/ROCK2)。
    
    const baseHalfW = 56;    // 河心深水半宽（px）
    const halfWVary = 8;     // 弯道半宽起伏
    const shallowDepth = 36; // 浅水环宽度（px，明显展现近岸涉水浅滩）
    const bankDepth = 30;    // 湿泥沙岸宽度（px，自然衔接陆地草地与河岸）

    // 1. 生成 7 个稀疏控制点并用 Catmull-Rom 密集插值
    const numControls = 7;
    const controls: Array<{ x: number; y: number }> = [];
    const moat = layout === 'moat';
    const maxCurveOffset = 65 + 28;
    const outerHalfW = baseHalfW + halfWVary + shallowDepth + bankDepth;
    // 攻方恒在左、城恒在右。临城河的最外岸抵正面城墙，不再假定城墙固定在 0.65 VW。
    const wallX = siegeWallFrontX ?? VW * 0.65;
    const baseCenterX = moat ? wallX - outerHalfW - maxCurveOffset : VW * 0.50;
    const bandLo = moat ? Math.max(VW * 0.32, baseCenterX - maxCurveOffset) : VW * 0.32;
    const bandHi = moat ? wallX - outerHalfW : VW * 0.68;
    const phase1 = rng.next() * Math.PI * 2;
    const phase2 = rng.next() * Math.PI * 2;

    const yMin = -TILE_H * 2;
    const yMax = VH + TILE_H * 2;
    const controlStep = (yMax - yMin) / (numControls - 1);

    for (let i = 0; i < numControls; i++) {
        const y = yMin + i * controlStep;
        const t = i / (numControls - 1);
        // 自然大 S 蛇曲弯折
        const offset = Math.sin(t * Math.PI * 2.0 + phase1) * 65 + Math.cos(t * Math.PI * 3.5 + phase2) * 28;
        const x = Math.max(bandLo, Math.min(bandHi, baseCenterX + offset));
        controls.push({ x, y });
    }

    const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t
            + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
            + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    };

    const numSamplePts = 64;
    const pts: Array<{ x: number; y: number; nx: number; ny: number; wW: number }> = [];
    for (let i = 0; i <= numSamplePts; i++) {
        const y = yMin + (yMax - yMin) * (i / numSamplePts);
        const segment = Math.max(0, Math.min(controls.length - 2, Math.floor((y - yMin) / controlStep)));
        const p0 = controls[Math.max(0, segment - 1)];
        const p1 = controls[segment];
        const p2 = controls[Math.min(controls.length - 1, segment + 1)];
        const p3 = controls[Math.min(controls.length - 1, segment + 2)];
        const t = Math.max(0, Math.min(1, (y - p1.y) / Math.max(1, p2.y - p1.y)));
        const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
        const wW = baseHalfW + Math.sin(i / numSamplePts * Math.PI * 3.0 + phase1) * halfWVary;
        pts.push({ x, y, nx: 0, ny: 0, wW });
    }

    for (let i = 0; i <= numSamplePts; i++) {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(numSamplePts, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        pts[i].nx = -dy / len;
        pts[i].ny = dx / len;
    }

    const waterCells: Array<[number, number]> = [];
    const shallowCells: Array<[number, number]> = [];
    const bankCells: Array<[number, number]> = [];

    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const px = isoCellX(gx, gy, ox);
            const py = isoCellY(gx, gy, oy);
            let minDist = 999999;
            for (let k = 0; k <= numSamplePts; k++) {
                const d = Math.hypot(px - pts[k].x, (py - pts[k].y) * 1.5);
                if (d < minDist) minDist = d;
            }
            if (minDist < baseHalfW) {
                waterCells.push([gx, gy]);
            } else if (minDist < baseHalfW + shallowDepth) {
                shallowCells.push([gx, gy]);
            } else if (minDist < baseHalfW + shallowDepth + bankDepth) {
                bankCells.push([gx, gy]);
            }
        }
    }

    for (const [x, y] of waterCells) occupied.add(`${x},${y}`);
    for (const [x, y] of shallowCells) occupied.add(`${x},${y}`);
    for (const [x, y] of bankCells) occupied.add(`${x},${y}`);

    // 等距投影比例多边形边界
    const wL = pts.map(p => ({ x: p.x + p.nx * p.wW, y: p.y + p.ny * p.wW * 0.55 }));
    const wR = pts.map(p => ({ x: p.x - p.nx * p.wW, y: p.y - p.ny * p.wW * 0.55 })).reverse();
    const sL = pts.map(p => ({ x: p.x + p.nx * (p.wW + shallowDepth), y: p.y + p.ny * (p.wW + shallowDepth) * 0.55 }));
    const sR = pts.map(p => ({ x: p.x - p.nx * (p.wW + shallowDepth), y: p.y - p.ny * (p.wW + shallowDepth) * 0.55 })).reverse();
    const bL = pts.map(p => ({ x: p.x + p.nx * (p.wW + shallowDepth + bankDepth), y: p.y + p.ny * (p.wW + shallowDepth + bankDepth) * 0.55 }));
    const bR = pts.map(p => ({ x: p.x - p.nx * (p.wW + shallowDepth + bankDepth), y: p.y - p.ny * (p.wW + shallowDepth + bankDepth) * 0.55 })).reverse();

    const actualWaterTile = waterTerrainForTheme(theme, season, lat, elev, biome, lng);
    const actualBeachTile = beachTerrainForTheme(theme, season, lat, elev, biome, lng);
    const wetBankTile = actualBeachTile === 'des' ? 'des' : 'beach_wet';

    // 由外向内四层渲染：
    // 1. 湿泥沙岸过渡（消除河岸与陆地草皮的生硬交界）
    if (bankCells.length > 0) {
        patches.push({ tile: wetBankTile, cells: bankCells, polygon: [...bL, ...bR], alpha: 0.85, category: 'shore', blur: 16 });
    }
    // 2. 水下泥沙底床垫底（铺在浅水区下，确保半透明浅水能透出水下沙泥质感）
    if (shallowCells.length > 0) {
        patches.push({ tile: wetBankTile, cells: shallowCells, polygon: [...sL, ...sR], alpha: 0.90, category: 'shore', blur: 14 });
    }
    // 3. 清透见底近岸浅水（sh2 浅水材质，透出水下泥沙河床）
    if (shallowCells.length > 0) {
        patches.push({ tile: 'sh2', cells: shallowCells, polygon: [...sL, ...sR], alpha: 0.58, category: 'shore', blur: 14 });
    }
    // 4. 河心深水核心（清澈翡翠绿/明亮蔚蓝江水）
    if (waterCells.length > 0) {
        patches.push({ tile: actualWaterTile, cells: waterCells, polygon: [...wL, ...wR], alpha: 0.96, category: 'shore', blur: 10 });
    }

    // 4. 水岸自然生态点缀：芦苇、睡莲、河滩湿石
    const decorCount = 8;
    let riverRockCount = 0;
    const MAX_RIVER_ROCKS = 1; // 🔴 [2026-09-01 主人定] 一条河流全长范围内最多只放 1 块石头
    for (let i = 0; i < decorCount; i++) {
        const tIdx = Math.floor((i + rng.next() * 0.8) / decorCount * (numSamplePts - 1));
        const pt = pts[tIdx];
        if (!pt || pt.y < 30 || pt.y > VH - 30) continue;
        const side = rng.chance(0.5) ? 1 : -1;
        const dist = pt.wW + shallowDepth * (0.3 + rng.next() * 0.9);
        const oxX = pt.x + side * pt.nx * dist;
        const oyY = pt.y + side * pt.ny * dist * 0.55;

        // 水生植物（芦苇/睡莲）与河滩岩石（岩石封顶 1 块，其余为芦苇睡莲）
        const bankRocks = filterRiverBankRockAssets(decorForTheme(theme, season, lat, elev, biome, lng).solid);
        const pool = (riverRockCount >= MAX_RIVER_ROCKS || bankRocks.length === 0)
            ? ['REEDS', 'REEDS', 'WATER_LILY']
            : ['REEDS', 'REEDS', 'WATER_LILY', ...bankRocks];
        const asset = rng.pick(pool);
        if (asset.startsWith('ROCK')) {
            riverRockCount++;
        }
        objects.push({
            asset,
            x: oxX,
            y: oyY,
            layer: 'world',
            z: 0,
            flip: rng.chance(0.5),
            frame: rng.int(0, 99999),
        });
    }

    return (px: number, py: number): boolean => {
        for (let k = 0; k <= numSamplePts; k += 2) {
            if (Math.hypot(px - pts[k].x, (py - pts[k].y) * 1.5) < pts[k].wW + 4) return true;
        }
        return false;
    };
}

// ── 第 3 层：内陆湖 / 绿洲水塘 ────────────────────────────────
//
// 🔴 [2026-08-24 补] 此前 waterKind 有 'lake' 这个值、probeWater 会返回它、
//    resolveBattleTopology 也按它分支（swamp_marsh / steppe_oasis），
//    但**没有任何代码生成湖** —— 所有判定为「湖」的战场实际一滴水都没有。
//
// 形态照 DE 的绿洲/水塘：不规则卵形水面 + 一圈浅水 + 一圈沙滩，边缘柔和。
// 位置避开军团走廊（水会挡路，13 的编队不会绕行）。
function buildLake(
    gw: number,
    gh: number,
    ox: number,
    oy: number,
    VW: number,
    VH: number,
    rng: RandomSource,
    patches: TerrainPatchPlan[],
    occupied: Set<string>,
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    lat: number,
    elev: number | null,
    biome: Biome,
    inCorridor: (x: number, y: number) => boolean,
    /** 战场经度 —— 积雪判定要查真实气候数据，不能只按纬度估 */
    lng?: number,
): WaterChecker {
    // 1~2 个水塘。DE 的绿洲通常是一大一小，不是一个正圆
    const count = rng.chance(0.35) ? 2 : 1;
    interface Pond { cx: number; cy: number; rx: number; ry: number; rot: number; wob: number[] }
    const ponds: Pond[] = [];

    for (let i = 0; i < count; i++) {
        let cx = 0, cy = 0, ok = false;
        const rx = (i === 0 ? 150 : 95) + rng.next() * 60;
        const ry = rx * (0.52 + rng.next() * 0.18);        // 等距压扁
        for (let a = 0; a < 60; a++) {
            const px = VW * (0.10 + rng.next() * 0.80);
            const py = VH * (0.12 + rng.next() * 0.76);
            // 塘心与整圈边缘都要在走廊外，否则水会横在两军之间
            if (inCorridor(px, py)) continue;
            if (inCorridor(px - rx, py) || inCorridor(px + rx, py)) continue;
            if (inCorridor(px, py - ry) || inCorridor(px, py + ry)) continue;
            cx = px; cy = py; ok = true; break;
        }
        if (!ok) continue;
        // 边缘扰动：8 个方向上的半径倍率，卵形而非正椭圆
        const wob: number[] = [];
        for (let k = 0; k < 8; k++) wob.push(0.82 + rng.next() * 0.36);
        ponds.push({ cx, cy, rx, ry, rot: rng.next() * Math.PI, wob });
    }
    if (ponds.length === 0) return () => false;

    /** 归一化距离：<1 在水里，1~SHORE 浅水，SHORE~BEACH 沙滩 */
    const SHORE = 1.16, BEACH = 1.34;
    const distOf = (px: number, py: number): number => {
        let best = 999;
        for (const p of ponds) {
            const dx = px - p.cx, dy = py - p.cy;
            const c = Math.cos(p.rot), sn = Math.sin(p.rot);
            const ux = (dx * c - dy * sn) / p.rx;
            const uy = (dx * sn + dy * c) / p.ry;
            const ang = Math.atan2(uy, ux);
            const seg = ((ang + Math.PI) / (Math.PI * 2)) * 8;
            const i0 = Math.floor(seg) % 8, i1 = (i0 + 1) % 8, t = seg - Math.floor(seg);
            const wob = p.wob[i0] * (1 - t) + p.wob[i1] * t;
            const d = Math.hypot(ux, uy) / wob;
            if (d < best) best = d;
        }
        return best;
    };

    const deep: Array<[number, number]> = [];
    const shallow: Array<[number, number]> = [];
    const sand: Array<[number, number]> = [];
    for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
            const d = distOf(isoCellX(gx, gy, ox), isoCellY(gx, gy, oy));
            if (d < 1) deep.push([gx, gy]);
            else if (d < SHORE) shallow.push([gx, gy]);
            else if (d < BEACH) sand.push([gx, gy]);
        }
    }
    for (const [x, y] of [...deep, ...shallow, ...sand]) occupied.add(x + ',' + y);

    const waterTile = waterTerrainForTheme(theme, season, lat, elev, biome, lng);
    const beachTile = beachTerrainForTheme(theme, season, lat, elev, biome, lng);
    // 由外向内：沙滩 → 浅水 → 深水，与 DE 的 草→滩→浅→深 同序
    if (sand.length > 0) {
        patches.push({ tile: beachTile, cells: sand, alpha: 0.85, category: 'shore', blur: 14 });
    }
    if (shallow.length > 0) {
        patches.push({ tile: 'sh2', cells: shallow, alpha: 0.72, category: 'shore', blur: 12 });
    }
    if (deep.length > 0) {
        patches.push({ tile: waterTile, cells: deep, alpha: 0.96, category: 'shore', blur: 8 });
    }

    return (px: number, py: number): boolean => distOf(px, py) < SHORE;
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
    lng?: number,
    baseTerrain?: string,
    elevation?: number[][]
): void {
    // 彻底清除杂乱的 75 个地表碎雀斑与脏补丁，保持底图纯净、连贯、自然的 DE 质感
    return;
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
    /** 战场经度 —— 积雪判定要查真实气候数据，不能只按纬度估 */
    lng?: number,
    /** 脚下这张底图 —— 只有林地底图才铺落叶层 */
    baseTerrainTile: string = '',
): void {
    // 🔴 [2026-08-24 主人截图] 林下落叶层只能铺在**真有林子**的地方。
    //    库斯科（安第斯高原草地，底图 ds2）曾被铺了一片 `for` 森林地面、alpha 0.85 几乎不透明，
    //    在浅黄土上就是一块突兀的深褐斑。没有树的地方哪来的落叶层。
    const FOREST_FLOOR_BASES = new Set(['for', 'fo2', 'underbrush_leaves', 'gr6', 'snf']);
    if (baseTerrainTile && !FOREST_FLOOR_BASES.has(baseTerrainTile)) return;
    const tiles = forestFloorTilesForTheme(theme, biome, season, lat, elev, lng);
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
    /** 定植被的底图 —— 当地**野战**底图（自然环境），不是脚下踩的那张，见 vegetationTile */
    baseTile: string = '',
    lng?: number,
    /** 攻城战：树更少、且不出枯树（城郊被砍伐开垦，枯木被拾作柴火） */
    isSiege: boolean = false,
    /** 禁植区（守方城池石基等），圆内不长树 */
    keepClear: ReadonlyArray<{ x: number; y: number; r: number }> = [],
    /**
     * 脚下这张底图。
     * 🔴 和 baseTile（植被底图）是两回事：
     *    **树**看自然环境（当地野战底图）——城郊被踩踏的土不代表这里能长什么树；
     *    **草石**看脚下的地——草直接长在这块土上，地什么样草就什么样，
     *    这也是 DE `terrain_to_place_on` 的语义。
     */
    groundTile: string = '',
): void {
    // 🔴 [2026-08-24 主人定] 一个底图一种树：底图定基调，同一张图上不混种。
    //    地区覆盖 + 季节变体都在 TreeAssignment 里，见那个文件的头注释。
    //    只有拿不到经纬度（旧调用/单测）才回落到按主题挑一把树。
    let primaryTree: string;
    let secondaryTree: string | null = null;
    if (lat !== undefined && lng !== undefined) {
        primaryTree = pickTree({ baseTile, lat, lng, season, isSiege });
    } else {
        const treeAssets = treesForTheme(theme, season, elevationBand, lat, elev, biome, lng);
        primaryTree = rng.pick(treeAssets);
        const otherTrees = treeAssets.filter((t) => t !== primaryTree);
        secondaryTree = otherTrees.length ? rng.pick(otherTrees) : null;
    }
    const treeFactor: Record<ElevationBand, number> = {
        lowland: 1,
        upland: 0.9,
        mountain: 0.65,
        alpine: 0.35,
        high_alpine: 0.1,
        snow: 0.05,
    };
    // 🔴 [2026-08-24 主人：「不要太密，毕竟是战场，主要表现的是军团」]
    //    密度按底图（= 气候产物）查表，和树种同源，见 TreeAssignment.DENSITY_BY_BASE。
    //    拿不到底图才回落到旧的按 biome 那套。
    const density = baseTile ? treeDensityFor(baseTile, isSiege) : null;
    const treeCount = density
        ? Math.max(3, Math.round(density.stragglers * treeFactor[elevationBand]))
        : Math.max(4, Math.round(treeCountFor(biome, rng) * treeFactor[elevationBand]));
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
    // 🔴 守方城池/城门前石路上不长树。走廊拦不住这块：守方最后排在 x≈93% VW，
    //    走廊只到 82%，实测平均 3.8 棵树戳在城基上。
    const inKeepClear = (x: number, y: number): boolean =>
        keepClear.some((k) => (x - k.x) * (x - k.x) + (y - k.y) * (y - k.y) <= k.r * k.r);

    const forestFloorTiles = forestFloorTilesForTheme(theme, biome, season, lat, elev, lng);
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
            if (isWater(px, py) || inArmyCorridor(px, py) || inKeepClear(px, py)) continue;
            availableCells.push([gx, gy]);
        }
    }
    const availableSet = new Set(availableCells.map(([x, y]) => `${x},${y}`));
    const forestBudget = Math.round(availableCells.length * treeFactor[elevationBand]
        * (density ? density.forestCover : forestCoverOfUsableFor(biome)));
    // 🔴 [2026-08-24] 预算太小就**整个不要林块**，树全走林外散株。
    //    原来 perClumpTarget 有 `Math.max(4, ...)` 兜底，于是库斯科（安第斯高原，
    //    forestCover 只有 0.0066、预算不到 3 格）照样铺出一小撮 8 格的林地地表，
    //    alpha 0.85 几乎不透明，树又稀得没长上去——屏幕上就是一块孤零零的深色菱形斑。
    //    干旱区/高原本来就没有成片林，只有散树，这才是对的。
    //    clumps 归零即可：后面铺地表和长树都以 forestCells 为准，空了自然全跳过。
    const MIN_FOREST_BUDGET = 12;
    const forestClumps = forestBudget < MIN_FOREST_BUDGET
        ? 0
        : 12 + rng.int(0, 5);                        // DE: number_of_clumps 10~14（我们可用区是环形，多切几块才散得开）
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
            // 🔴 [2026-08-24 主人定] 攻方从左入场、守方在右，右侧要摆城池——
            //    树尽量长在左边（攻方那侧），右半只留少量，免得挡住城。
            //    只在攻城战偏：野战没有城要护，偏左会让右半光秃一片。
            if (isSiege && isoCellX(cand[0], cand[1], ox) > VW * 0.5 && !rng.chance(0.22)) continue;
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
    // treeCount 现在**就是**散株目标棵数（旧版是「总数的一半」），别再打对折。
    const stragglers = Math.max(3, density ? treeCount : Math.round(treeCount * 0.5));
    for (let i = 0; i < stragglers; i++) {
        let tx = 0, ty = 0, ok = false;
        for (let a = 0; a < 40; a++) {
            const px = VW * (0.05 + rng.next() * 0.90);
            const py = VH * (0.05 + rng.next() * 0.90);
            // 散株同样偏左。原先只有林块偏、散株照撒右半，攻城战右侧仍是一片树。
            if (isSiege && px > VW * 0.5 && !rng.chance(0.22)) continue;
            if (isWater(px, py) || inArmyCorridor(px, py) || inKeepClear(px, py)) continue;
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
    const themeDecor0 = decorForTheme(theme, season, lat, elev, biome, lng);
    // 🔴 [2026-08-24] 季节 / 文化 / 人烟三道闸，判据集中在 DecorFit。
    //    文化专属素材**不能靠 DE 气候主题分**：把十字架墓碑挂到
    //    palaearctic_europe_mediterranean 上之后，智利的图卡佩尔照样长出十字架
    //    ——那个主题实际是「地中海气候」，加州、南非、澳洲西南、智利中部全在内。
    const fitQ: DecorFitQuery = {
        lat: lat ?? 35, lng: lng ?? 0, season,
        winterSnow: season === 2 && isSnowArea(lat ?? 35, elev ?? null, biome, lng),
        isSiege,
    };
    // 🔴 [2026-08-24 照 DE 的 terrain_to_place_on 改] 草/花/石按**底图**取，不按 biome。
    //    底图是真实气候查表的产物，biome 是另一套并行体系——两套并行必然对不上。
    //    与树同源：底图定基调。拿不到底图才回落到主题表。
    const byBase = groundTile ? groundDecorFor(groundTile) : null;
    const themeDecor = {
        flat: filterDecor(byBase ? byBase.flat : themeDecor0.flat, fitQ),
        solid: filterDecor(byBase ? byBase.solid : themeDecor0.solid, fitQ),
    };

    // 🔴 [2026-08-24] DE 的放置约束，以前全没有（见 de-map-algorithm.md §3.2）：
    //    avoid_forest_zone 1705 次 / avoid_cliff_zone 1492 次 / min_distance_to_map_edge 896 次。
    //    林地格在上面已经算好（forestCells），悬崖来自 objects 里的 CLIFF*。
    const forestSet = new Set(forestCells.map(([x, y]) => x + ',' + y));
    const inForestZone = (x: number, y: number): boolean => {
        if (!forestSet.size) return false;
        const a = (x - ox) * 2 / TILE_W, b = (y - oy) * 2 / TILE_H;
        const gx = Math.round((a + b) / 2), gy = Math.round((b - a) / 2);
        return forestSet.has(gx + ',' + gy);
    };
    const cliffs = objects.filter((o) => o.asset.startsWith('CLIFF') || o.asset.startsWith('SHORT_CLIFF'));
    const nearCliffZone = (x: number, y: number): boolean =>
        cliffs.some((c) => Math.hypot(x - c.x, (y - c.y) * 1.6) < 90);
    /** DE 的 min_distance_to_map_edge：中位 1~6 格，取 1.5 格 ≈ 96px，免得精灵被图边切一半 */
    const decorLimits: PlacementLimits = {
        inForest: inForestZone,
        nearCliff: nearCliffZone,
        edgeMargin: TILE_W * 1.5,
    };

    // 🔴【岩石成套伴生系统】：主岩石必定紧密伴生碎石、灌木与草花。
    //
    // 🔴 [2026-08-24 主人质问「为什么石头这么多」后按 DE 实算，勿再拍脑袋往上调]
    //    权威口径 = AoE2DE/resources/_common/drs/gamedata_x2/Arabia.rms：
    //      SOLID_OBJECT   number_of_objects 4      （主岩石）
    //      SOLID_SURROUND number_of_objects 32 ×2  （环绕碎石，actor_area_to_place_in 主岩石区）
    //      → 全图共 68 个石头 / TINY 图 144×144 = 20736 格 = 0.0033 个/格
    //    我们一屏：屏内 2111 格、可用（走廊外）1066 格
    //      → 换算 **3.5 ~ 6.9 个石头**（含伴生碎石在内的总数）
    //
    //    我曾按主人发的 DE 截图目测「一屏 18~22 处」把这里从 4~7 提到 10~16，
    //    实测总石头数飙到 34 个、超 DE 密度 5~10 倍。那张截图是**战役地图（手工摆放）**，
    //    不是随机地图，不能拿来当密度基准。
    //    主岩石只放 1~2 个，避免大块岩石挤占战场。
    const solidDecorCount = 1; // 🔴 [2026-09-01 主人指出「石头有点多」] 全图主岩石固定为 1 处
    // 🔴 [2026-08-26 主人「这种大石头没必要放这么多吧，1-2 块即可」] 巨岩单独限量。
    //    solid 池按底图分两类体量：草地配 ROCK1/2（小岩块堆，2~4 个不显多），
    //    沙漠/戈壁配 ROCK_FORMATION*（层叠柱状风蚀岩，一块就占掉小半屏）。
    //    同样是 2~4 个，小石头正常、巨岩满屏 —— 所以不砍全局数量，只给巨岩设上限 2。
    //    真实沙漠里 mesa 本就稀疏，这同时也更符合史地。
    // 🔴 [2026-08-26 主人定死] 一张图最多只允许 1 块大石头（绝不堆砌 2~3 块占满屏幕与河道）
    const LARGE_ROCKS = new Set([
        'ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_PILLAR',
        'ROCK_JUNGLE', 'ROCK_LIMESTONE', 'ROCK3'
    ]);
    const MAX_LARGE_ROCKS = 1;
    const smallSolids = themeDecor.solid.filter((a: string) => !LARGE_ROCKS.has(a));
    let largeRockCount = objects.filter((o) => LARGE_ROCKS.has(o.asset)).length;
    for (let i = 0; i < solidDecorCount; i++) {
        let asset = rng.pick(themeDecor.solid);
        if (LARGE_ROCKS.has(asset)) {
            if (largeRockCount >= MAX_LARGE_ROCKS) {
                // 超额的巨岩降级成同底图的小石头；该底图没有小石头就整块跳过（宁可少也不堆）
                if (!smallSolids.length) continue;
                asset = rng.pick(smallSolids);
            } else {
                largeRockCount++;
            }
        }
        const solidExclusion = isSiege && asset.startsWith('ROCK') ? inKeepClear : inArmyCorridor;
        const anchor = isSiege && asset.startsWith('ROCK')
            ? sampleSiegeStoneAnchor(VW, VH, rng)
            : {
                ax: solidDecorCount === 1
                    ? VW * (0.28 + rng.next() * 0.34)
                    : VW * ((i === 0 ? 0.28 : 0.62) + (rng.next() - 0.5) * 0.10),
                ay: VH * (0.24 + rng.next() * 0.52),
            };
        const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, solidExclusion, {
            ...decorLimits,
            findClosest: anchor,
        });
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
                // 🔴 [2026-08-26 按 DE 本体定量] 标准来自 DE 随机地图脚本，不是估的：
                //    resources/_common/drs/gamedata_x2/Arabia.rms（沙漠图）
                //      create_object SOLID_OBJECT   { number_of_objects  4; second_object SOLID_UNDERBRUSH }
                //      create_object SOLID_SURROUND { number_of_objects 32; actor_area_to_place_in 560 }
                //    → 整图 4 主岩 + 32 环绕 = 36 块，按格数换算到 13 一屏（2025 格）：
                //      2 人图 5.1 块 / 4 人图 3.5 块。原来 1~3 档实测 9.0 块、1~2 档 7.5 块，均超标。
                //
                //    🔴 还有一处结构性差异（暂未改，只记账）：DE 主岩石的 second_object 是
                //    **SOLID_UNDERBRUSH（Dead Plant 枯草 / Flower Bed 花丛）—— 是植被不是碎石**；
                //    碎石走独立的 SOLID_SURROUND。我们把伴生做成了碎石，等于把 DE 的
                //    「岩石＋枯草」变成「岩石＋更多岩石」，石头数天然翻倍。
                //    降到 0~1 后一屏平均 4.5 块，落在 DE 的 3.5~5.1 区间内。
                const smallRockCount = rng.int(0, 1);
                for (let si = 0; si < smallRockCount; si++) {
                    const ang = rng.next() * Math.PI * 2;
                    const dist = 22 + rng.next() * 24;
                    const sx = p.x + Math.cos(ang) * dist;
                    const sy = p.y + Math.sin(ang) * dist * 0.6;
                    const rockExclusion = isSiege ? inKeepClear : inArmyCorridor;
                    if (sx >= 0 && sx <= VW && sy >= 0 && sy <= VH && !isWater(sx, sy) && !rockExclusion(sx, sy)) {
                        // 🔴 [2026-08-24] 伴生碎石从**该底图配的石头**里取，别硬编码。
                        //    原来写死 ROCK1/2/3，于是 ROCK3（橙褐色沙漠岩盘）
                        //    出现在德国温带、俄罗斯雪原——底图明明只配了灰岩。
                        // 🔴 [2026-08-26 修·限量漏了伴生这条路] 伴生碎石必须从**小石头**里抽。
                        //    原来直接 pick(themeDecor.solid)，而沙漠池是
                        //    ['ROCK3','ROCK_FORMATION2','ROCK_FORMATION3'] —— 一块「碎石」能抽出
                        //    一座层叠岩柱。于是主岩石卡在 2 块、伴生又冒出第 3 第 4 块，
                        //    主人实测截图仍是满屏大石头。碎石就该是碎石，巨岩一律排除。
                        const sPool = smallSolids.length ? smallSolids : ['ROCK1', 'ROCK2'];
                        const sAsset = rng.pick(sPool);
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
                        // 🔴 [2026-08-24] 和伴生碎石同一个毛病：写死了喜湿灌木，
                        //    于是**沙漠里的岩石旁长出蕨类**（播仙、玉门关、贝雷尼斯…）。
                        //    改从该底图配的 flat 列表里取——沙漠取到的是枯枝/仙人掌。
                        //
                        // 🔴 但必须挑**最小的那个**：DE 的 `SOLID_UNDERBRUSH` 是岩石旁的
                        //    下层植被，本来就小。直接 rng.pick 会抽到大件——
                        //    gr2 的 flat 是 FLOWER_1(56.6 格)，4 个主岩石各伴生 1~2 个
                        //    就是 6 个 × 56.6 = **覆盖 16%**，草花覆盖直接超标（实测德源 21%）。
                        const bAsset = themeDecor.flat.length
                            ? themeDecor.flat.reduce((a, b) => (assetTiles(a) <= assetTiles(b) ? a : b))
                            : 'SHRUB_GREEN';
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
    // 🔴 [2026-08-24 主人定] 攻城战不出枯树——城郊的枯木早被拾去当柴烧了。
    if (!isSiege && (biome === 'desert' || biome === 'cold_steppe' || biome === 'savanna')) {
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
                    // 🔴 [2026-08-24] 去掉 STUMP_GENERIC：这是**荒原**枯荣伴生（沙漠/冷草原/
                    //    稀树草原），那里根本没有树，哪来的树桩。DE 里 Stump 的角色是
                    //    `FOREST_AESTHETIC`（森林装饰，伐木留下的），只长在林地。
                    //    我们的树桩走 1568 行的树伴生，那条是对的。
                    const skelAsset = rng.pick(['ANIMAL_SKELETON', 'SKELETON', 'PLANT_DEAD']);
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
    //
    // 🔴 [2026-08-24 照 DE 的 RMS 改] DE 的 `AESTHETIC_FLAT` / `AESTHETIC_GROUPED`
    //    都带 `group_placement_radius 3`——**草花是成簇长的，不是均匀撒的**。
    //    我们原来一个个随机撒，出来是均匀的噪点，没有 DE 那种「这一丛那一丛」的层次。
    //    （查的是 AoE2DE/resources/_common/drs/gamedata_x2/Arabia.rms，
    //      见 docs/02-design/climate-regions.md §5.6.9 的六槽表。）
    //    同理 `#const AESTHETIC_FLAT` 也是一个常量：全场同一种，只是分成几簇。
    const flatAsset = rng.pick(themeDecor.flat);
    // 同样按覆盖率反推：FLOWER_1 一个占 57 格，BUSH_GREEN 只占 3 格，
    // 写死簇数会让前者铺满、后者看不见。
    const flatTotal = countForCover(flatAsset, availableCells.length, FLAT_COVER);
    const flatClusters = Math.max(2, Math.min(10, Math.round(flatTotal / 3)));
    for (let c = 0; c < flatClusters; c++) {
        const anchor = sampleLandPos(VW, VH, rng, isWater, flatAsset, objects, undefined, decorLimits);
        if (!anchor) continue;
        const asset = flatAsset;
        const perCluster = Math.max(1, Math.round(flatTotal / flatClusters));
        for (let k = 0; k < perCluster; k++) {
            // group_placement_radius 3 格 ≈ 3 个 tile 宽；等距要把 y 压扁一半
            const ang = rng.next() * Math.PI * 2;
            const dist = rng.next() * TILE_W * 1.5;
            const x = anchor.x + Math.cos(ang) * dist;
            const y = anchor.y + Math.sin(ang) * dist * 0.5;
            if (x < 0 || x > VW || y < 0 || y > VH) continue;
            if (isWater(x, y)) continue;
            objects.push({
                asset,
                x, y,
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
    // 🔴 [2026-08-24] BIOME_GROUND_DECOR **不看季节**，所以寒带/苔原的夏天地上也撒冰
    //    （DECAL_ICE 是一块白蓝色的冰）。实测非冬季战场撒了 883 块——主人截图里
    //    干草原上那些白色云朵斑块就是它。走 DecorFit 统一把三道闸都过一遍。
    const groundDecorAssets = filterDecor(
        (byBase ? byBase.scatter : (BIOME_GROUND_DECOR[biome] ?? []))
            .filter((a) => GROUND_COVER_ASSETS.has(a)), fitQ);
    if (groundDecorAssets.length > 0) {
        // 🔴 不能挂在 treeCount 上：2026-08-24 把树密度砍到 1/5 后，
        //    花草会被连带砍掉，但主人要稀的是**树**（挡视线、挤战场），不是地上的草。
        //    改成跟湿润度走——林地草多、沙漠草少，与树的棵数无关。
        //    🔴 [2026-08-24 同上，回退] 我曾照那张战役截图把这里从 40~60 提到 90~120，
        //    主人一眼看出「草也是（太多）」。DE 的 AESTHETIC_SCATTER 虽写 1024，
        //    但带 `temp_min_distance_group_placement 42`——间距约束才是真正的密度上限，
        //    number_of_objects 只是「想放这么多」。别拿 1024 当依据。
        // 🔴 [2026-08-24 主人：「这个有必要这么多草吗」] 数量按**目标覆盖率**反推，
        //    不再写死。写死数量的后果：换个素材覆盖率差十倍——
        //    GRASS_GREEN_PATCH 一个就占 30 格，撒 59 个 = 铺满 85%；
        //    UNDERBRUSH_JUNGLE 7.3 格 × 59 = 21%（丛林图满屏就是它）。
        //    见 DecorFit.ASSET_TILES 的实测尺寸表。
        // 🔴 [2026-08-24 照 DE 的 RMS 改] DE 的 `#const AESTHETIC_SCATTER` 是**一个**常量，
        //    整个地形主题从头到尾只撒**同一种**散布素材，不是每株换一种。
        //    我们原来逐株 rng.pick，出来是杂乱的混合噪点。
        //    这和主人定的「一个底图一种树」是同一条逻辑——底图定基调，图上不混种。
        const scatterAsset = rng.pick(groundDecorAssets);
        const groundDecorCount = countForCover(scatterAsset, availableCells.length, SCATTER_COVER);
        for (let i = 0; i < groundDecorCount; i++) {
            const asset = scatterAsset;
            // 满地草不避林（林下本来就有草），但要避悬崖和图边
            const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, undefined,
                { nearCliff: nearCliffZone, edgeMargin: TILE_W });
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

function buildResources(VW: number, VH: number, season: 0 | 1 | 2, rng: RandomSource, objects: EnvironmentObjectPlan[], isWater: WaterChecker, waterKind: 'sea' | 'lake' | 'river' | 'none' | undefined, biome: Biome, baseTile: string = '', isSiege: boolean = false, keepClear: ReadonlyArray<{ x: number; y: number; r: number }> = []): void {
    // 资源按**脚下底图**分配（不是 biome）。
    // 🔴 [2026-08-24 主人：「沙漠中种松树吗？？？」顺查到的同类问题]
    //    原来按 biome 分，于是安定、琅琊这些干裂黄土地(ds2)上长出**浆果丛**。
    //    可采集的浆果需要水，干旱地面上只该有石矿。与草石树同一条：底图定基调。
    const ARID_BASES = new Set(['des', 'pal', 'qs', 'pal1', 'ds5']);
    const TROPICAL_BASES = new Set(['fo2', 'gr6']);
    const SNOW_BASES = new Set(['snd', 'sno', 'sn2', 'snf']);
    let resAssets: string[];
    if (season === 2 || SNOW_BASES.has(baseTile)) {
        resAssets = ['MINE_STONE'];                                   // 冬季/雪原：无果
    } else if (TROPICAL_BASES.has(baseTile)) {
        resAssets = ['FORAGE_PAPAYA', 'FORAGE_PINEAPPLE', 'MINE_STONE'];
    } else if (ARID_BASES.has(baseTile)) {
        resAssets = ['MINE_STONE'];                                   // 真沙漠：只有石矿
    } else if (baseTile === 'ds2' || baseTile === 'gr5' || baseTile === 'gr7' || baseTile === 'gr3') {
        resAssets = ['FORAGE_FRUIT', 'MINE_STONE'];                   // 半干旱：耐旱果灌
    } else if (baseTile) {
        resAssets = ['FORAGE_BUSH', 'FORAGE_FRUIT', 'MINE_STONE'];    // 温带湿润
    } else if (biome === 'tropical_rainforest' || biome === 'savanna') {
        resAssets = ['FORAGE_PAPAYA', 'FORAGE_PINEAPPLE', 'MINE_STONE'];
    } else if (biome === 'temperate_forest' || biome === 'temperate_grass' || biome === 'mediterranean') {
        resAssets = ['FORAGE_BUSH', 'FORAGE_FRUIT', 'MINE_STONE'];
    } else {
        resAssets = ['MINE_STONE'];
    }
    const resCount = 2 + rng.int(0, 2);
    const inArmyCorridor = (x: number, y: number): boolean => {
        return x >= VW * 0.15 && x <= VW * 0.85 && y >= VH * 0.10 && y <= VH * 0.90;
    };
    const inDefenderCity = (x: number, y: number): boolean =>
        keepClear.some((k) => (x - k.x) * (x - k.x) + (y - k.y) * (y - k.y) <= k.r * k.r);

    for (let i = 0; i < resCount; i++) {
        const asset = rng.pick(resAssets);
        const resourceExclusion = isSiege && asset === 'MINE_STONE' ? inDefenderCity : inArmyCorridor;
        const limits = isSiege && asset === 'MINE_STONE'
            ? { findClosest: sampleSiegeStoneAnchor(VW, VH, rng) }
            : undefined;
        const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, resourceExclusion, limits);
        if (p) objects.push({ asset, x: p.x, y: p.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
    }

    // ── [2026-08-31] 战场遗存氛围（BATTLEFIELD: 前缀 = SUCAI_BATTLEFIELD 素材，preview.png 单帧）──
    //   攻城战：倒毁攻城器械残骸 + 拒马鹿角 + 插地烽火；野战：古战场骷髅冢/穿刺遗骸。
    if (isSiege) {
        // 🔴 [2026-08-31] 攻方从左入场、守方城在右侧：残骸是攻方攻城器械倒下的遗存，
        //    只放左侧（城外）。右侧（城内）与中间军团走廊一并排除，免得残骸戳进城里。
        const outsideCityLeft = (x: number, y: number): boolean => inArmyCorridor(x, y) || x >= VW * 0.5;
        const DECAY_POOL = ['BATTLEFIELD:DECAY_TREBUCHET', 'BATTLEFIELD:DECAY_MANGONEL', 'BATTLEFIELD:DECAY_ONAGER', 'BATTLEFIELD:DECAY_BATTERING_RAM', 'BATTLEFIELD:DECAY_SCORPION'];
        const TORCH_POOL = ['BATTLEFIELD:TORCH_A', 'BATTLEFIELD:TORCH_B'];
        // 攻城器械残骸 1~2 个（大型，限量）
        const decayCount = 1 + rng.int(0, 1);
        for (let i = 0; i < decayCount; i++) {
            const asset = rng.pick(DECAY_POOL);
            const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, outsideCityLeft);
            if (p) objects.push({ asset, x: p.x, y: p.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
        }
        // 插地烽火 1~2 个
        const torchCount = 1 + rng.int(0, 1);
        for (let i = 0; i < torchCount; i++) {
            const asset = rng.pick(TORCH_POOL);
            const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, outsideCityLeft);
            if (p) objects.push({ asset, x: p.x, y: p.y, layer: 'world', z: 0, flip: false, frame: rng.int(0, 99999) });
        }
    } else {
        // 野战古战场遗骸 1~2 个（骷髅冢/穿刺遗骸，扩展现有骷髅氛围）
        const RELIC_POOL = ['BATTLEFIELD:SKELETON_BATTLEFIELD', 'BATTLEFIELD:SKELETON_SOLDIER', 'BATTLEFIELD:IMPALED_CORPSE'];
        const relicCount = 1 + rng.int(0, 1);
        for (let i = 0; i < relicCount; i++) {
            const asset = rng.pick(RELIC_POOL);
            const p = sampleLandPos(VW, VH, rng, isWater, asset, objects, inArmyCorridor);
            if (p) objects.push({ asset, x: p.x, y: p.y, layer: 'world', z: 0, flip: rng.chance(0.5), frame: rng.int(0, 99999) });
        }
    }
}


// 重新导出 hashString，供测试/验收计算种子校验和
export { hashString };
