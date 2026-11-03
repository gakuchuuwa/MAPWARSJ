import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { loadWorldBaseData, queryBaseTile, queryWinterSnow } from '../ui/scene13/WorldBaseMap';
import type { TreeSeason } from '../ui/scene13/TreeAssignment';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { perfDoctor } from '../debug/PerfDoctor';
import {
    loadStrategicForestMask,
    queryStrategicCanopyDensity,
    queryStrategicForestBiome,
} from './StrategicForestMask';
import { loadLandUseMask } from './LandUseMask';
import { FOREST_COVER_THRESHOLD, forestCoverAt } from '../world/environment/forestModel';
import { plantTreeAt } from '../world/environment/plantCatalog';
import { seasonalDeTree } from '../ui/scene13/Scene13DeTrees';
import { localSeasonAtLat } from '../world/environment/seasonalGround';
import { VECTOR_ROAD_DATA } from '../data/VectorRoadData';
import { getStrategicRiverFeatures } from './StrategicRiverProximity';
import { strategicTreeScale } from './strategicSpriteScale';

const PANE = 'vegetationPane';
const SAMPLE_ZOOM = 9;
const MIN_ZOOM = 9;
const MAX_ZOOM = 10;
const CITY_CLEAR_PX = 74;
/** 战略道路穿过密林时的半幅净空（px，SAMPLE_ZOOM=9 下约 16px，形成 32px 宽的 DE 式林间驿道走廊） */
const ROAD_CLEAR_PX = 16;
/** 矢量河流穿过密林时的半幅河道净空（px，SAMPLE_ZOOM=9 下约 16px，让干支流把大片森林自然切开） */
const RIVER_CLEAR_PX = 16;
/** 矢量河流两岸护岸散树簇外扩半径（px，河道净空外侧 16~48px 在开阔平川间断生成三两棵护岸树簇） */
const RIVER_RIPARIAN_PX = 48;
const ROAD_BUCKET_PX = 64;
/** 画布四周离屏余量（px）：平移期间直接由 mapPane GPU 硬件变换同步移动，消除每帧亚像素重采样闪烁 */
const CANVAS_PAD_PX = 160;
/** 镜头平移累计超过该阈值（px）才重定位并重绘离屏余量画布（小于 CANVAS_PAD_PX，屏边不露白） */
const CANVAS_REPAINT_DRIFT_PX = 96;
/** 两次重建之间的最小间隔（ms）。跟拍军团时 GameAppLoop 每帧 setView → 每帧 moveend，
 *  不节流的话整层色块每帧重画。 */
const MIN_RENDER_INTERVAL_MS = 200;
/** 战略树木保持饱满通透的色彩质感，同时留出微透余量与地形自然融合。 */
const TREE_OPACITY = 0.94;
/** 树根处的轻微接地阴影，只用于消除贴图悬浮感，避免在浅色地表留下脏黑斑。 */
const TREE_SHADOW_OPACITY = 0.11;

export interface TreeAssetMeta {
    boxW: number;
    boxH: number;
    anchorX: number;
    anchorY: number;
    frames: number[];
}

/** 
 * 自然树木资产的精确元数据与接地锚点配置
 * 🔴 树根接地锚点（anchorX, anchorY）严格落在树干底座接触地面处，
 *    保证四季切换时无论树冠高矮胖瘦，树木在地面上的根部绝对钉死不动！
 */
export const TREE_METAS: Record<string, TreeAssetMeta> = {
    OAK: { boxW: 332, boxH: 228, anchorX: 132, anchorY: 200, frames: [0, 3, 6, 12, 27, 30, 33, 36, 39] },
    GREEN_OAK: { boxW: 184, boxH: 200, anchorX: 112, anchorY: 172, frames: [0, 3, 6, 9, 12, 15, 18, 21, 24] },
    AUTUMN_OAK: { boxW: 332, boxH: 232, anchorX: 132, anchorY: 200, frames: [0, 3, 6, 12, 18, 21, 27, 30, 33, 36, 39] },
    SNOW_AUTUMN_OAK: { boxW: 204, boxH: 224, anchorX: 128, anchorY: 192, frames: [0, 3, 6, 12, 18, 21, 27, 30, 33, 36, 39] },
    ASIAN_MAPLE_GREEN: { boxW: 336, boxH: 352, anchorX: 136, anchorY: 192, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    ASIAN_MAPLE_AUTUMN: { boxW: 340, boxH: 348, anchorX: 140, anchorY: 188, frames: [0, 2, 4, 6, 8, 10, 12, 14, 16] },
    ASIAN_PINE: { boxW: 232, boxH: 196, anchorX: 130, anchorY: 146, frames: [0, 1, 2, 3] },
    // 🔴 PINE / SNOW_PINE 的第 0/15/18 帧在 DE 原生精灵表中是全秃枯木桩，仅保留 3/6/9/12/21/24 翠绿/覆雪饱满松树帧
    PINE: { boxW: 156, boxH: 192, anchorX: 92, anchorY: 164, frames: [3, 6, 9, 12, 21, 24] },
    SNOW_PINE: { boxW: 152, boxH: 188, anchorX: 92, anchorY: 160, frames: [3, 6, 9, 12, 21, 24] },
    BIRCH_GREEN: { boxW: 204, boxH: 244, anchorX: 136, anchorY: 216, frames: [0, 1, 2, 3, 4, 5, 6, 7] },
    BIRCH_AUTUMN: { boxW: 212, boxH: 240, anchorX: 140, anchorY: 216, frames: [0, 3, 6, 9, 12, 15, 18, 21, 24] },
    BIRCH_WINTER: { boxW: 200, boxH: 196, anchorX: 128, anchorY: 176, frames: [3, 4, 5] },
    PALM: { boxW: 208, boxH: 208, anchorX: 128, anchorY: 180, frames: [6, 12, 15, 21, 27, 30] },
    OLIVE: { boxW: 216, boxH: 176, anchorX: 140, anchorY: 156, frames: [0, 3, 6, 9, 12, 15, 18, 21] },
    CYPRESS: { boxW: 128, boxH: 192, anchorX: 100, anchorY: 184, frames: [0, 3, 6, 9] },
    CYPRESS_DEC: { boxW: 80, boxH: 116, anchorX: 60, anchorY: 108, frames: [0, 1, 2, 3, 4, 5] },
    WILLOW: { boxW: 240, boxH: 240, anchorX: 152, anchorY: 200, frames: [0, 1, 2] },
    BAMBOO: { boxW: 108, boxH: 100, anchorX: 68, anchorY: 76, frames: [9, 10, 11] },
    LUSH_BAMBOO: { boxW: 212, boxH: 180, anchorX: 118, anchorY: 146, frames: [0, 3, 6, 9] },
    PEACH_BLOSSOM: { boxW: 224, boxH: 172, anchorX: 130, anchorY: 138, frames: [0, 1, 2, 3] },
    DEAD_TREE: { boxW: 368, boxH: 232, anchorX: 168, anchorY: 200, frames: [0, 1, 2, 6, 7, 8, 9, 11, 12] },
    RAINFOREST: { boxW: 348, boxH: 240, anchorX: 148, anchorY: 200, frames: [0, 3, 6, 12, 18, 21, 27, 30, 33, 36, 39] },
    BAOBAB: { boxW: 348, boxH: 236, anchorX: 148, anchorY: 200, frames: [0, 3, 6, 9] },
    DRAGON_TREE: { boxW: 200, boxH: 172, anchorX: 124, anchorY: 144, frames: [0, 2, 4, 6] },
    ACACIA: { boxW: 340, boxH: 236, anchorX: 140, anchorY: 196, frames: [0, 3, 6, 9] },
    ITALIAN_PINE: { boxW: 152, boxH: 124, anchorX: 88, anchorY: 96, frames: [0, 2, 4, 6, 8, 10, 12, 14, 16] },
    MONKEY_PUZZLE: { boxW: 220, boxH: 208, anchorX: 140, anchorY: 180, frames: [0, 1, 2, 3] },
    BRAZILWOOD: { boxW: 268, boxH: 244, anchorX: 164, anchorY: 196, frames: [0, 2, 4, 6, 8, 10] },
    MANGROVE: { boxW: 220, boxH: 176, anchorX: 132, anchorY: 144, frames: [0, 2, 4, 6, 8, 10, 12] },
    // 🔴 [2026-09-19 补] CACTUS 是 pickTree 会返回、却漏在元数据表外的一种（美洲荒漠底图用）。
    //    实测：preview 60×76、frames.png 660×76 = 11 帧齐；锚点取最低有彩色像素（树干接地）(36,65)。
    //    漏登记时它会走「按图片尺寸底部居中」兜底（无接地锚点），且不参与预载。
    CACTUS: { boxW: 60, boxH: 76, anchorX: 36, anchorY: 65, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    WAX_PALM: { boxW: 272, boxH: 288, anchorX: 180, anchorY: 264, frames: [0, 1, 2, 3] },
    BUSH_TREE_A: { boxW: 156, boxH: 104, anchorX: 86, anchorY: 74, frames: [0, 1, 2, 3] },
    // 🔴 2026-10-31 植物总表新用到的五种（尺寸取各自 _meta.json；帧逐张看过，剔除枯木杆、贴地小灌丛、秋色帧）
    SPRUCE: { boxW: 144, boxH: 196, anchorX: 96, anchorY: 176, frames: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 21, 23, 24] },
    SPRUCE_SNOW: { boxW: 144, boxH: 184, anchorX: 100, anchorY: 168, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    JUNGLE: { boxW: 332, boxH: 236, anchorX: 132, anchorY: 200, frames: [21, 22, 23, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38] },
    BUSH_TREE_B: { boxW: 156, boxH: 120, anchorX: 72, anchorY: 84, frames: [0, 2, 4, 6, 8, 10, 12, 14, 18, 20, 22, 24, 26, 28, 30, 36, 38, 40, 42, 44] },
    BUSH_TREE_C: { boxW: 168, boxH: 104, anchorX: 92, anchorY: 64, frames: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26] },
    // 战役大树阔叶变体（精确锚定树干底座接地处，消除换季跳动）：
    SCENARIO_TREE_A: { boxW: 176, boxH: 172, anchorX: 112, anchorY: 148, frames: [0, 1, 2] },
    SCENARIO_TREE_B: { boxW: 164, boxH: 188, anchorX: 104, anchorY: 168, frames: [0, 1, 2] },
    SCENARIO_TREE_C: { boxW: 164, boxH: 188, anchorX: 104, anchorY: 164, frames: [0, 1, 2] },
    SCENARIO_TREE_D: { boxW: 172, boxH: 160, anchorX: 108, anchorY: 132, frames: [0, 1, 2] },
    SCENARIO_TREE_E: { boxW: 160, boxH: 188, anchorX: 108, anchorY: 168, frames: [0, 1, 2] },
    SCENARIO_TREE_F: { boxW: 364, boxH: 200, anchorX: 164, anchorY: 180, frames: [0, 1, 2] },
    SCENARIO_TREE_G: { boxW: 184, boxH: 204, anchorX: 120, anchorY: 180, frames: [0, 1, 2] },
    SCENARIO_TREE_H: { boxW: 184, boxH: 204, anchorX: 120, anchorY: 180, frames: [0, 1, 2] },
    SCENARIO_TREE_I: { boxW: 336, boxH: 188, anchorX: 136, anchorY: 172, frames: [0, 1, 2] },
    SCENARIO_TREE_J: { boxW: 160, boxH: 160, anchorX: 104, anchorY: 136, frames: [0, 1, 2] },
    SCENARIO_TREE_K: { boxW: 164, boxH: 160, anchorX: 104, anchorY: 136, frames: [0, 1, 2] },
    SCENARIO_TREE_L: { boxW: 180, boxH: 144, anchorX: 112, anchorY: 120, frames: [0, 1, 2] },
};

/**
 * 一棵树的采样结果。
 * 🔴 只存**经纬度**，不存屏幕坐标、不存 Image 引用：
 *    屏幕坐标一旦固化，地图平移时树就相对地形滑动（「军团一动树也动」）；
 *    Image 引用固化则会绕过按字节预算的贴图缓存淘汰。两者都在 paint() 里现取。
 */
interface TreeDrawCommand {
    lat: number;
    lng: number;
    /** 每棵树固定的高度抖动系数（保证平移/缩放时同一棵树大小稳定） */
    jitter: number;
    asset: string;
    /** 下一季的树种（季末交叉淡出用；与 asset 相同表示这棵不换装） */
    assetNext: string;
    /** 稳定分配的健康形态变体索引 */
    variant: number;
    /** 是否属于成团密林的主树节点 */
    inGrove?: boolean;
    /** SAMPLE_ZOOM 下的世界像素坐标（采样时算一次，paint 不再逐树 latLngToLayerPoint） */
    wx: number;
    wy: number;
    /** 树位键（经纬度 5 位小数），paint 里「上一次画成的贴图」备忘用，采样时算一次 */
    posKey: string;
}

/** 战略地图树贴图缓存：树名 → preview.png（DE 单棵成品图，第 0 帧） */
const TREE_IMG = new Map<string, HTMLImageElement>();
const TREE_IMG_FAILED = new Set<string>();

/** 战略地图多变体精灵图缓存：树名 → frames.png */
const TREE_FRAMES_IMG = new Map<string, HTMLImageElement>();
const TREE_FRAMES_FAILED = new Set<string>();

/**
 * 🔴 [2026-09-19 主人报「樱花树过季就消失了」] 每棵树「上一帧真正画成功的贴图」备忘：
 *   换季那一瞬若本季/下一季两张都还没解码完，drawTreeAsset 会**一张都画不出来**（静默 return）
 *   → 屏幕上就是「樱花淡没了、绿树没来」。这里按树位（经纬度 5 位小数）记住上一次画成的图，
 *   两张都不行时拿它顶上：宁可晚一帧换季，也绝不出现一棵空树。
 */
const LAST_DRAWN_ASSET = new Map<string, string>();
const LAST_DRAWN_MAX = 6000;

function treeImage(asset: string, onReady: () => void): HTMLImageElement | null {
    if (TREE_IMG_FAILED.has(asset)) return null;
    const hit = TREE_IMG.get(asset);
    if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null;
    const img = new Image();
    img.onload = () => onReady();
    img.onerror = () => { TREE_IMG.delete(asset); TREE_IMG_FAILED.add(asset); };
    img.src = `/SUCAI_NATURE/${asset}/preview.png`;
    TREE_IMG.set(asset, img);
    return null;
}

function treeFramesImage(asset: string, onReady: () => void): HTMLImageElement | null {
    if (TREE_FRAMES_FAILED.has(asset)) return null;
    const hit = TREE_FRAMES_IMG.get(asset);
    if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null;
    const img = new Image();
    img.onload = () => onReady();
    img.onerror = () => { TREE_FRAMES_IMG.delete(asset); TREE_FRAMES_FAILED.add(asset); };
    img.src = `/SUCAI_NATURE/${asset}/frames.png`;
    TREE_FRAMES_IMG.set(asset, img);
    return null;
}

/** 检查某树资产是否已在内存中解码完毕 */
function isTreeAssetReady(asset: string): boolean {
    const meta = TREE_METAS[asset];
    if (meta) {
        const frames = TREE_FRAMES_IMG.get(asset);
        if (frames && frames.complete && frames.naturalWidth > 0) return true;
        // 🔴 若该树种第 0 帧被剔除（如 PINE / SNOW_PINE 的 preview.png 是第 0 帧枯木棍），必须等待 frames.png 就绪
        if (!meta.frames.includes(0)) return false;
        const prev = TREE_IMG.get(asset);
        if (prev && prev.complete && prev.naturalWidth > 0) return true;
        return false;
    }
    const im = TREE_IMG.get(asset);
    return !!(im && im.complete && im.naturalWidth > 0);
}

/**
 * 🔴 [2026-09-19 主人令「全面修复」] 撤掉「启动全量预载」。
 *
 * 上一版在构造时调 `preloadAllTreeAssets()`，把 TREE_METAS 里 43 种树 × (preview.png + frames.png)
 * 一次全拉 —— 实测 **86 个文件、13.1 MB**（最肥 RAINFOREST 1.25MB / BAOBAB 1MB / AUTUMN_OAK 0.96MB），
 * 与主人自己的性能铁律冲突（`docs/03-runtime/perf-doctor.md` 把「开机预载」列为已知病灶；
 * 军团那次的教训是全量预载 300+ 单位 → 实测 600 次长任务 / 160 秒）。
 *
 * 而且它是**冗余**的：
 *   1. 采样循环（`renderInner`）对每棵采到的树都会把「本季 asset + 下一季 assetNext」两张
 *      一起预热 —— 屏幕上画得出来的树，本来就提前一整季把下一季贴图拿到手；
 *   2. 真正确保「换季不消失」的是 `paint()` 里那道判断：**两张都解码就绪才允许交叉淡化，
 *      否则整棵满额画老树**。
 * 故只保留「按采样预热 + 就绪才淡化」，不再开机全量拉图。
 */

if (import.meta.env.DEV) {
    perfDoctor.registerCache({
        name: 'VegetationLayer:TREE_IMG(战略树贴图)',
        where: 'src/map/VegetationLayer.ts:TREE_IMG',
        entries: () => TREE_IMG.size,
        bytes: () => {
            let b = 0;
            for (const im of TREE_IMG.values()) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            return b;
        },
        limitKind: 'count',
        limitValue: 133,
    });
}

function hash(x: number, y: number, salt = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453123;
    return n - Math.floor(n);
}

const BASE_FOREST_TILES = new Set([
    'for',
    'fo2',
    'underbrush_leaves',
    'snf',
]);

/** 🔴 绝对禁止长树的地表材质：沙漠沙丘、流沙、干涸盐壳、戈壁砾石、高山裸岩与冰雪 */
const NON_VEGETATION_TILES = new Set([
    'pal',             // 砂质沙漠（塔克拉玛干、撒哈拉等流动沙丘）
    'qs',              // 沙漠流沙（腹地沙丘）
    'pal1',            // 裂开沙漠 / 干涸盐壳（罗布泊、艾丁湖）
    'ds5',             // 戈壁沙漠（砾石戈壁滩）
    'des',             // 极旱荒漠泥地
    'gravel_default',  // 高山高寒砾石 / 流石滩
    'rck',             // 陡峻山地裸岩 / 刃脊
    'sno',             // 积雪雪原
    'sn2',             // 松软深雪
    'snd',             // 雪地地基
    'ice',             // 冰川冰原
]);

/**
 * 基于经纬度的多频连续世界坐标密度场 (0..1)
 * 纯数学函数，无任何随机状态，保证相同经纬度在任何时候、任何缩放级别下输出绝对恒定
 */
function forestNoise(lat: number, lng: number): number {
    // 低频宏观轮廓 (~1.5度波长，约150km，塑造大尺度林区连绵与开阔原野)
    const n1 = Math.sin(lat * 0.85 + lng * 0.62) * Math.cos(lat * 0.71 - lng * 0.79);
    // 中频林缘凹凸与林隙 (~0.35度波长，约35km，塑造有机自然林缘、山谷林隙)
    const n2 = Math.sin(lat * 3.21 - lng * 2.85) * Math.cos(lat * 2.67 + lng * 3.43);
    // 高频林缘毛边与散树 (~0.08度波长，约8km，形成自然的稀疏林缘过渡)
    const n3 = Math.sin(lat * 11.45 + lng * 13.27) * Math.cos(lat * 14.12 - lng * 9.87);

    return 0.5 + 0.30 * n1 + 0.14 * n2 + 0.06 * n3;
}

const RESOLVE_FOREST_BIOMES = new Set([1, 2, 3, 4, 5, 6, 12, 14]);

/** 丝路绿洲、西域/河西、中亚河中、波斯、两河、尼罗河与马格里布绿洲据点建筑风格 */
const OASIS_STYLES = new Set([
    'WESTERN', 'CENTRAL_ASIA', 'SASANIAN', 'PERSIAN', 'ORIE', 'BERBER',
]);

/**
 * 精准地理生境补充判定（2026-10-30 主人令）：
 * 在严守「华北/关中/汾河等农耕大平原不乱长树、流动沙海/戈壁腹地不长树」的前提下，精准还原四大历史生态植被带：
 *   1. 西北与塞北高山森林绿岛（天山北麓雪岭云杉、祁连山青海云杉、阴山/贺兰山松桦林、阿尔泰/杭爱/肯特山泰加林）；
 *   2. 藏东南与雅鲁藏布江中游河谷（海拔 < 3850m）的巨柏林（CYPRESS）；
 *   3. 古典地中海、黎巴嫩雪松山地、阿特拉斯山脉与扎格罗斯/厄尔布尔士山地林（OLIVE / ITALIAN_PINE / CYPRESS / OAK）；
 *   4. 非洲萨赫勒/东非/德干稀树草原疏林（ACACIA / BAOBAB）、也门索科特拉龙血树（DRAGON_TREE）及丝路/大河绿洲红柳椰枣林（BUSH_TREE_A / PALM）。
 */
export function resolveSpecialEcoVegetation(
    lat: number,
    lng: number,
    elev: number | null,
    tile: string,
    forestBiome: number,
    canopyDensity: number,
    noiseVal: number,
    oasisCityBoost: number,
): { weight: number; effectiveTile: string } {
    // 流动流沙、干涸盐壳、常年冰雪与荒漠群系（非绿洲）一票否决
    if (tile === 'qs' || tile === 'pal1' || tile === 'sno' || tile === 'sn2' || tile === 'snd' || tile === 'ice' || tile === 'ic3') {
        return { weight: 0, effectiveTile: tile };
    }
    if (forestBiome === 13 && oasisCityBoost <= 0) {
        return { weight: 0, effectiveTile: tile };
    }

    const clusterFactor = noiseVal >= 0.24 ? Math.min(1, 0.36 + (noiseVal - 0.24) * 1.05) : 0;

    // ① 丝路绿洲据点外围 & 尼罗河/两河冲积绿洲林带（红柳/梭梭灌丛 BUSH_TREE_A 与椰枣棕榈 PALM）
    //    仅对非森林群系（forestBiome === 0 或 13）的干旱底图生效，避免把黎巴嫩山/阿特拉斯山（forestBiome 12）变成沙漠棕榈
    const isAridOasisTile = (forestBiome === 0 || forestBiome === 13) &&
        (tile === 'pal' || tile === 'des' || tile === 'ds2' || tile === 'ds5' || tile === 'gr7' || tile === 'gr3' || tile === 'gr2');
    const isNileOrMesopotamiaOasis = (
        (lat >= 24.0 && lat <= 31.5 && lng >= 29.8 && lng <= 32.6 && (tile === 'ds2' || tile === 'gr2' || tile === 'gr3' || tile === 'des')) ||
        (lat >= 30.0 && lat <= 35.5 && lng >= 43.2 && lng <= 48.5 && (tile === 'ds2' || tile === 'gr2' || tile === 'gr3'))
    ) && (elev === null || elev < 220) && noiseVal >= 0.54;
    if ((oasisCityBoost > 0 && isAridOasisTile) || isNileOrMesopotamiaOasis) {
        const w = Math.max(oasisCityBoost, isNileOrMesopotamiaOasis ? 0.16 + (noiseVal - 0.54) * 0.25 : 0);
        if (w >= 0.12) {
            const isTemperateSilkRoad = lat >= 35.5 && lng >= 45.0 && lng <= 115.0;
            return {
                weight: w,
                effectiveTile: isTemperateSilkRoad ? 'ds5' : 'des',
            };
        }
    }

    if (clusterFactor <= 0) return { weight: 0, effectiveTile: tile };

    // ② 西北与塞北四大高山森林绿岛（严格限山腰林带海拔或 RESOLVE 针叶林群系，盆地戈壁与沙海不长树）
    // 2a. 天山北麓与伊犁河谷雪岭云杉林带（41.8°~44.8°N, 78.5°~94.5°E）
    if (lat >= 41.8 && lat <= 44.8 && lng >= 78.5 && lng <= 94.5 && tile !== 'pal' && tile !== 'des') {
        if (forestBiome === 5 || (elev !== null && elev >= 1400 && elev <= 2850)) {
            const w = (0.42 + 0.25 * Math.min(1, canopyDensity / 18)) * clusterFactor;
            return { weight: w, effectiveTile: 'underbrush_leaves' };
        }
    }
    // 2b. 祁连山北麓与焉支山青海云杉/圆柏水源林（37.0°~39.6°N, 97.5°~103.2°E）
    if (lat >= 37.0 && lat <= 39.6 && lng >= 97.5 && lng <= 103.2 && tile !== 'pal' && tile !== 'des') {
        if (forestBiome === 5 || (elev !== null && elev >= 2050 && elev <= 3450)) {
            const w = (0.44 + 0.22 * Math.min(1, canopyDensity / 12)) * clusterFactor;
            return { weight: w, effectiveTile: 'underbrush_leaves' };
        }
    }
    // 2c. 阴山山脉（大青山/乌拉山）与贺兰山松桦林带
    const isYinshan = lat >= 40.45 && lat <= 41.45 && lng >= 108.2 && lng <= 112.5 && (forestBiome === 5 || (elev !== null && elev >= 1280 && elev <= 2350));
    const isHelanshan = lat >= 38.3 && lat <= 39.35 && lng >= 105.55 && lng <= 106.4 && (forestBiome === 5 || (elev !== null && elev >= 1400 && elev <= 2950));
    if ((isYinshan || isHelanshan) && tile !== 'pal' && tile !== 'des') {
        const w = 0.44 * clusterFactor;
        return { weight: w, effectiveTile: 'underbrush_leaves' };
    }
    // 2d. 阿尔泰山、杭爱山、肯特山（不儿罕合勒敦山）泰加针叶与白桦林带（46.2°~51.8°N, 85.0°~112.5°E）
    if (lat >= 46.2 && lat <= 51.8 && lng >= 85.0 && lng <= 112.5 && tile !== 'pal' && tile !== 'des') {
        if (forestBiome === 5 || forestBiome === 6 || (elev !== null && elev >= 1400 && elev <= 2450 && tile === 'gr7')) {
            const w = (0.38 + 0.35 * Math.min(1, canopyDensity / 30)) * clusterFactor;
            return { weight: w, effectiveTile: 'underbrush_leaves' };
        }
    }

    // ③ 藏东南（林芝）与雅鲁藏布江中游河谷巨柏林（CYPRESS，严格限河谷海拔 < 3850m，藏北高寒羌塘高原不长树）
    if (lat >= 27.5 && lat <= 31.8 && lng >= 88.0 && lng <= 98.8) {
        const inValleyElev = elev === null ? (forestBiome === 4 || forestBiome === 5) : (elev >= 1600 && elev <= 3850);
        if (inValleyElev && ((forestBiome === 4 || forestBiome === 5) || ((tile === 'gravel_default' || tile === 'ds2' || tile === 'gr3') && noiseVal >= 0.45))) {
            const w = (forestBiome === 4 || forestBiome === 5 ? 0.42 + 0.35 * Math.min(1, canopyDensity / 40) : 0.34) * clusterFactor;
            return { weight: w, effectiveTile: 'gravel_default' };
        }
    }

    // ④ 古典地中海、黎巴嫩雪松山地、阿特拉斯山脉与扎格罗斯/厄尔布尔士山地林
    // 4a. 地中海森林与灌木林群系（forestBiome === 12：黎凡特/黎巴嫩、阿特拉斯山脉、希腊/意大利/伊比利亚）
    if (forestBiome === 12 && tile !== 'pal' && tile !== 'des') {
        const isLebanon = lat >= 33.0 && lat <= 36.8 && lng >= 35.1 && lng <= 37.2;
        const isAtlas = lat >= 32.0 && lat <= 37.0 && lng >= -8.0 && lng <= 10.5;
        // 🔴 [2026-10-31 战略地图素材规划] 郁闭度 <22 的是开阔台地/农田/干草原（梅塞塔高原、希腊/意大利平原等），
        //    与通用林区口径一致，不长树；原 >=3 的宽门槛把整个地中海铺满了树。黎巴嫩雪松山、阿特拉斯山地的专条保留。
        const mediterraneanForest = canopyDensity >= 22 || isLebanon || (isAtlas && (elev === null || elev >= 500));
        if (mediterraneanForest) {
            const w = (0.34 + 0.44 * Math.min(1, canopyDensity / 28)) * clusterFactor;
            const effTile = isLebanon && (elev === null || elev >= 550)
                ? 'rck'
                : (tile === 'ds5' || tile === 'gravel_default' ? 'gr7' : tile);
            return { weight: w, effectiveTile: effTile };
        }
    }
    // 4b. 扎格罗斯山脉、厄尔布尔士山脉与小亚细亚山地栎林/阔叶林（30°~40°N, 30°~56°E）
    if (lat >= 30.0 && lat <= 40.0 && lng >= 30.0 && lng <= 56.0 && (forestBiome === 4 || forestBiome === 5) && tile !== 'pal' && tile !== 'des') {
        // 🔴 [2026-10-31] 原「郁闭度 >=1 或海拔 850~2650m」把整个安纳托利亚/伊朗高原铺满；改为真林区（>=22），
        //    或山地林带海拔内且确有疏林（>=8，扎格罗斯栎疏林）。
        if (canopyDensity >= 22 || (canopyDensity >= 8 && elev !== null && elev >= 850 && elev <= 2650)) {
            const w = (0.35 + 0.42 * Math.min(1, canopyDensity / 28)) * clusterFactor;
            const effTile = tile === 'ds5' || tile === 'gravel_default' ? 'gr7' : tile;
            return { weight: w, effectiveTile: effTile };
        }
    }

    // ⑤ 热带/亚热带稀树草原疏林（Savanna：萨赫勒/东非金合欢 ACACIA & 猴面包树 BAOBAB、也门/索科特拉龙血树 DRAGON_TREE、德干高原）
    const isYemenSocotra = lat >= 12.0 && lat <= 17.8 && lng >= 42.5 && lng <= 55.0;
    if (isYemenSocotra && (tile === 'gr5' || tile === 'rck' || tile === 'ds5') && noiseVal >= 0.44) {
        const w = 0.22 + (noiseVal - 0.44) * 0.35;
        return { weight: w, effectiveTile: 'gr5' };
    }
    const isAfricaSavanna = lat >= -24.0 && lat <= 15.8 && lng >= -17.5 && lng <= 51.0;
    const isDeccanSavanna = lat >= 9.5 && lat <= 23.5 && lng >= 72.5 && lng <= 82.5;
    if (
        (isAfricaSavanna || isDeccanSavanna) &&
        (tile === 'gr5' || tile === 'gr7' || tile === 'gr3' || tile === 'ds4' || tile === 'ds2') &&
        noiseVal >= 0.55
    ) {
        // 稀树草原只取噪声峰顶（约 18% 格点）生成 2 棵装疏林簇，82% 面积保持开阔萨凡纳草地
        // 德干高原传 'gr3' 以精确命中 REGION_TREES 的德干金合欢（ACACIA）规则
        const w = 0.16 + (noiseVal - 0.55) * 0.28;
        return { weight: w, effectiveTile: isDeccanSavanna ? 'gr3' : 'gr5' };
    }

    // ⑥ 喜马拉雅与山前冲积扇山麓过渡带（南亚特莱林缘 Terai / Piedmont Transition：26.0°~34.5°N, 71.0°~94.0°E）
    //    连接喜马拉雅高山深林与旁遮普/恒河农耕平原，海拔 150m~420m 的冲积山麓扇带，以疏林散树簇呈现自然生态过渡，消除一刀切断崖秃光感
    if (lat >= 26.0 && lat <= 34.5 && lng >= 71.0 && lng <= 94.0 && tile !== 'pal' && tile !== 'des' && tile !== 'qs') {
        if (elev !== null && elev >= 150 && elev <= 420 && noiseVal >= 0.46) {
            const w = (0.20 + (noiseVal - 0.46) * 0.32) * clusterFactor;
            return { weight: w, effectiveTile: lng < 78 ? 'gr2' : 'gr3' };
        }
    }

    return { weight: 0, effectiveTile: tile };
}

function isStrategicForestArea(biome: number, tile: string, elevation: number, lat: number): boolean {
    // 荒漠、流沙、盐壳、高山裸岩与冰雪一票否决
    if (NON_VEGETATION_TILES.has(tile)) return false;
    if (biome === 13) return false;
    // 真实森林群系（RESOLVE 2017: 1, 2, 3, 4, 5, 6, 12, 14）
    if (RESOLVE_FOREST_BIOMES.has(biome)) return true;
    // 地表材质标注森林
    if (BASE_FOREST_TILES.has(tile)) return true;
    return false;
}

function forestClusterWeight(
    biome: number,
    tile: string,
    canopyDensity: number,
    noiseVal: number,
    /** 森林模型给的实际森林程度（潜在植被 × 史实开垦）；null = 掩膜未载入，走旧的卫星树冠逻辑 */
    forestCover: number | null = null,
    elev: number | null = null,
): number {
    if (NON_VEGETATION_TILES.has(tile) || biome === 13) return 0;

    const isForestTile = BASE_FOREST_TILES.has(tile);
    // 黄土高原（tile === 'ds2'）天然海拔 900~1800m：只有真正具有树冠郁闭（canopy >= 22）或陇山/六盘山/吕梁山高脊（elev >= 1750m）才算山林；
    // 其余黄土梁峁塬面完全留白（不撒零碎小树丛，仅靠河岸护岸林带点缀）。
    const isLoessTableland = tile === 'ds2' && canopyDensity < 22 && (elev === null || elev < 1750);
    const isMountainOrHill = !isLoessTableland && elev !== null && elev >= 165;
    const hasRealCanopy = canopyDensity >= 20 || isForestTile || (forestCover !== null && forestCover >= 0.68 && canopyDensity >= 12);

    // 🔴 2026-11-01 ~ 2026-11-02 专业战略地图「大片深林连冠成海 + 河流道路劈开林海 + 林缘几棵散树成簇 + 亮出高山脊骨」口径：
    //    1. 森林模型 < 0.40 的历史农垦区、黄土高原梁峁塬面（isLoessTableland）、无郁闭度的开阔平川全部留白；
    //    2. 著名大片原始森林（亚马孙雨林、刚果雨林、东南亚雨林、西伯利亚/北欧泰加林、东北大小兴安岭、黑森林/比亚沃维耶扎等：
    //       canopy >= 65 且 forestCover >= 0.68，或热带雨林/泰加林 forestCover >= 0.72 且 canopy >= 42）放宽 noiseGate 至 0.20，
    //       铺出连绵壮阔的林海，再由矢量河流网与战略道路自然切分成块；
    //    3. 高陡山脊线（elev >= 1950m 且非高郁闭深林）自动留白露石，让秦岭、太行、陇山等主脊线的岩石褶皱与阴阳坡光影完整亮出；
    //    4. 林缘外圈（noiseGate - 0.07 <= noiseVal < noiseGate）保留 1~2 株零星树簇，形成「几棵树聚在一起」的自然林缘过渡。
    if (forestCover !== null) {
        if (forestCover < FOREST_COVER_THRESHOLD) return 0;
        if (isLoessTableland) return 0;
        if (!isMountainOrHill && !hasRealCanopy) return 0;

        // 高山裸岩主脊线留白：海拔 >= 1950m 且无强卫星树冠（canopy < 32）的陡脊直接露石
        if (elev !== null && elev >= 1950 && canopyDensity < 32) return 0;

        const isPrimevalMegaForest =
            (canopyDensity >= 65 && forestCover >= 0.68) ||
            ((biome === 1 || biome === 6) && forestCover >= 0.72 && canopyDensity >= 42);
        const isLargeContinuousForest =
            isPrimevalMegaForest ||
            (canopyDensity >= 45 && forestCover >= 0.58) ||
            isForestTile;

        const ridgePenalty = elev !== null && elev > 1300
            ? Math.min(0.16, ((elev - 1300) / 800) * 0.14)
            : 0;
        const baseNoiseGate = isPrimevalMegaForest
            ? 0.20
            : isLargeContinuousForest
                ? 0.30
                : canopyDensity >= 28
                    ? 0.42
                    : 0.50;
        const noiseGate = Math.min(0.68, baseNoiseGate + ridgePenalty);
        // 林缘外圈 0.07 带宽：生成 1~2 棵抱团的散树簇（几棵树在一起），避免大片森林边缘像刀切一样齐整
        const fringeGate = Math.max(0.12, noiseGate - 0.07);
        if (noiseVal < fringeGate) return 0;
        if (noiseVal < noiseGate) {
            const fringeT = (noiseVal - fringeGate) / Math.max(0.01, noiseGate - fringeGate);
            return 0.19 + 0.10 * fringeT;
        }

        const norm = Math.min(1, (forestCover - FOREST_COVER_THRESHOLD) / (1 - FOREST_COVER_THRESHOLD));
        const canopyBoost = Math.min(0.24, canopyDensity / 200);
        const clusterSpan = (noiseVal - noiseGate) / Math.max(0.15, 1 - noiseGate);
        const coreFloor = isPrimevalMegaForest ? 0.42 : (isLargeContinuousForest ? 0.34 : 0.28);
        return Math.min(1, (coreFloor + 0.44 * norm + canopyBoost) * (0.58 + 0.42 * clusterSpan));
    }

    const isForestBiome = RESOLVE_FOREST_BIOMES.has(biome);
    if (!isForestBiome && !isForestTile) return 0;
    if (isLoessTableland) return 0;

    let baseWeight = 0;
    if (isForestTile) {
        const canopy = Math.max(0, Math.min(1, canopyDensity / 100));
        baseWeight = Math.max(0.35, canopy);
    } else if (isForestBiome) {
        if (canopyDensity < 20 && !isMountainOrHill) return 0;
        const norm = Math.min(1.0, Math.max(0.15, (canopyDensity - 15) / 55));
        baseWeight = 0.26 + 0.54 * norm;
    }

    const fallbackGate = canopyDensity >= 65 ? 0.22 : (canopyDensity >= 45 ? 0.32 : 0.46);
    if (noiseVal < fallbackGate) return 0;
    const clusterFactor = 0.55 + 0.45 * ((noiseVal - fallbackGate) / (1 - fallbackGate));

    return baseWeight * clusterFactor;
}

function currentGameYear(): number {
    const y = (window as any).game?.timeSystem?.getYear?.();
    return typeof y === 'number' && Number.isFinite(y) ? y : 0;
}

function currentGameSeason(): number {
    const season = (window as any).game?.timeSystem?.getSeason?.();
    return typeof season === 'number' && season >= 0 && season <= 3 ? season : 0;
}

/** 🔴 [2026-09-11 主人定「4 季节，每个季节一张图」] 树种与游戏四季 **1:1**：春0 夏1 秋2 冬3。
 *  改前是"春夏共用一态"的三态映射 → 樱花/桃花整个夏天都开着（日本更是全年樱花）。 */
function currentTreeSeason(): TreeSeason {
    const s = currentGameSeason();
    return (s >= 0 && s <= 3 ? s : 0) as TreeSeason;
}

/** 下一季：四季轮转（春→夏→秋→冬→春） */
function nextTreeSeason(s: TreeSeason): TreeSeason {
    return (((s + 1) % 4) as TreeSeason);
}

/** 0 = 不混合；>0 = 下一季占的全局基准权重 */
/**
 * 季末交叉淡出窗口：**按秒算，不按季长比例算**。
 *
 * 🔴 [2026-09-11 主人报「植被渐变不对，变着变着就消失了。游戏中是有季节的 15 秒一个季节，你对应了吗」]
 *   原实现 `SEASON_BLEND_WINDOW = 0.45`（**季长的 45%**）→ 按 `GameConfig.TIME.SEASON_DURATION = 15`
 *   （15 游戏秒/季）折算就是 **6.75 秒**都在渐变 —— 将近一半时间树都是半透明的，
 *   再叠加交叉淡出自身的透明度塌陷，视觉上就是"淡着淡着没了"。
 *   改为读 `TimeSystem.getTimeToNextSeason()`（剩余**游戏秒**）：每季 15 秒，前 10 秒稳态展示当季风貌，
 *   季末最后 **5 秒**平滑渐变进入下一季（与 `HillshadeLayer` 地形覆雪、`CityLifeAmbientLayer` 据点民生层严格统一）。
 */
const SEASON_BLEND_SECONDS = 5.0;

/**
 * 淡出进度 0..1。
 * @param offsetSec 该树自己的错峰延迟（0~0.6 秒）：整片林依次换装，不是齐刷一变。
 */
function seasonBlend(offsetSec = 0): number {
    const remain = (window as any).game?.timeSystem?.getTimeToNextSeason?.();
    if (typeof remain !== 'number') return 0;
    const span = Math.max(0.25, SEASON_BLEND_SECONDS - offsetSec);
    const elapsed = SEASON_BLEND_SECONDS - Math.max(0, remain) - offsetSec;   // 已进入窗口多少秒
    if (elapsed <= 0) return 0;
    const t = Math.min(1, elapsed / span);
    // smoothstep：起手收尾都柔，换季那一刻恰好收敛到 1
    return Math.min(1, Math.max(0, t * t * (3 - 2 * t)));
}

function hueClass(asset: string): 'conifer' | 'broadleaf' | 'arid' | 'dead' {
    if (/PINE|CYPRESS|SPRUCE|SNOW_|BAMBOO|CEDAR/i.test(asset)) return 'conifer';
    if (/PALM|ACACIA|BAOBAB|OLIVE|DRAGON_TREE/i.test(asset)) return 'arid';
    if (/DEAD_TREE|BIRCH_WINTER|SCENARIO_TREE_I|SCENARIO_TREE_F/i.test(asset)) return 'dead';
    return 'broadleaf';
}

const PATCH_COLOR: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [36, 86, 52],
    broadleaf: [72, 110, 52],
    arid:      [130, 128, 58],
    dead:      [112, 104, 90],
};
const PATCH_COLOR_AUTUMN: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [88, 104, 52],
    broadleaf: [168, 108, 42],
    arid:      [150, 128, 58],
    dead:      [136, 116, 92],
};
const PATCH_COLOR_WINTER: Record<'conifer' | 'broadleaf' | 'arid' | 'dead', [number, number, number]> = {
    conifer:   [118, 138, 122],
    broadleaf: [176, 172, 160],
    arid:      [160, 154, 138],
    dead:      [150, 140, 124],
};

function colorFor(asset: string, season: TreeSeason): [number, number, number] {
    const c = hueClass(asset);
    if (season === 2) return PATCH_COLOR_AUTUMN[c];   // 秋
    if (season === 3) return PATCH_COLOR_WINTER[c];   // 冬
    return PATCH_COLOR[c];                            // 春 / 夏
}

/**
 * 真实自然地理林线（树木生长的高程上限，米）：
 * 超出林线为高寒草甸、流石滩、冰川与裸岩，树木无法成活。
 * - 青藏高原/喜马拉雅：4000m~4200m
 * - 阿尔卑斯山/中欧高地（纬度 44°~54°）：2150m
 * - 低纬度高山：3600m~3800m
 * - 高纬度寒温带：1200m~1500m
 */
function getTreeLine(lat: number, lng?: number): number {
    const absLat = Math.abs(lat);
    if (lng !== undefined) {
        // 青藏高原、横断山脉、祁连山、贺兰山（25°~40.5°N, 74°~107°E）
        if (lng >= 74 && lng <= 107 && absLat >= 25 && absLat <= 40.5) {
            return 4100;
        }
        // 天山山脉与帕米尔北缘（40.5°~45.2°N, 70°~96°E）：雪岭云杉林线约 2850~2900m
        if (lng >= 70 && lng <= 96 && absLat > 40.5 && absLat <= 45.2) {
            return 2900;
        }
        // 阿尔泰山、杭爱山、肯特山等内陆大陆性山脉（45.2°~52.5°N, 84°~115°E）：林线约 2450m
        if (lng >= 84 && lng <= 115 && absLat > 45.2 && absLat <= 52.5) {
            return 2450;
        }
    }
    if (absLat < 30) return 3800;
    if (absLat < 44) return 2600;
    if (absLat < 54) return 2150; // 阿尔卑斯山、欧洲高地
    if (absLat < 64) return 1400;
    return 600;
}

const TREE_GRID_STEP = 46;
/** 采样窗对齐粒度（格距整数倍）：跟拍平移每走这么远才整层重采样一次 */
const RESAMPLE_CHUNK_PX = TREE_GRID_STEP * 4;
/** 换季渐变期 paint 的最短间隔（≈30fps）：原来每帧整层重画 5000 棵树×2 */
const BLEND_PAINT_MIN_INTERVAL_MS = 33;
/** 单次重建最多保留的树数（兼顾密林连冠咬合与大视口 60FPS 拖动流畅度） */
const MAX_TREES_PER_RENDER = 5000;

/** 四季 DE 风格林下阴翳基底离屏缓存（春0 夏1 秋2 冬3） */
const UNDERBRUSH_CANVAS: (HTMLCanvasElement | null)[] = [null, null, null, null];

function getUnderbrushSprite(season: TreeSeason): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const s = season >= 0 && season <= 3 ? season : 0;
    if (UNDERBRUSH_CANVAS[s]) return UNDERBRUSH_CANVAS[s];
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 36;
    const cx = c.getContext('2d');
    if (cx) {
        // DE 林下柔光底色：仅在成团密林中心轻铺一层温润苔草/落叶底韵，视觉缝合相邻树冠间隙，绝不压脏浅色荒原/沙地地表
        const colors = [
            'rgba(36, 56, 26, 0.22)', // 春：温润草绿
            'rgba(28, 48, 22, 0.24)', // 夏：深翠林荫
            'rgba(60, 48, 24, 0.20)', // 秋：暖金落叶
            'rgba(44, 50, 40, 0.14)', // 冬：清透微影
        ];
        const color = colors[s];
        const grad = cx.createRadialGradient(32, 18, 2, 32, 18, 30);
        grad.addColorStop(0, color);
        grad.addColorStop(0.55, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = grad;
        cx.beginPath();
        cx.ellipse(32, 18, 30, 16, 0, 0, Math.PI * 2);
        cx.fill();
    }
    UNDERBRUSH_CANVAS[s] = c;
    return c;
}

export class VegetationLayer {
    private readonly map: L.Map;
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private visible = false;
    private renderTimer: number | null = null;
    private lastRenderKey = '';
    private lastRenderAt = 0;
    private retryKey = '';
    private retryCount = 0;

    private terrainReadyTimer: number | null = null;
    /** 画布当前锚定的整数 Layer 坐标左上角，以及锚定时的整数 panePos */
    private canvasTopLeft: L.Point = L.point(0, 0);
    private paintedPaneX = Number.NaN;
    private paintedPaneY = Number.NaN;
    private paintedZoom = Number.NaN;

    private getMapPanePos(): L.Point {
        return (this.map as unknown as { _getMapPanePos(): L.Point })._getMapPanePos();
    }

    /** 将画布锚定在整数 Layer 像素坐标上，使每棵树的画布坐标 (dx, dy) 恒为整数，彻底消除亚像素重采样闪烁 */
    private syncCanvasPosition(): void {
        const panePos = this.getMapPanePos();
        const px = Math.round(panePos.x);
        const py = Math.round(panePos.y);
        this.paintedPaneX = px;
        this.paintedPaneY = py;
        this.paintedZoom = Math.floor(this.map.getZoom());
        this.canvasTopLeft = L.point(-px - CANVAS_PAD_PX, -py - CANVAS_PAD_PX);
        L.DomUtil.setPosition(this.canvas, this.canvasTopLeft);
    }

    private readonly onViewportChanged = () => { this.scheduleRender(); };
    private readonly onZoomChanged = () => { this.lastRenderKey = ''; this.paint(); this.scheduleRender(0); };
    private readonly onResize = () => { this.resize(); this.lastRenderKey = ''; this.scheduleRender(); };
    private readonly onCanvasFollow = () => {
        // 平移期间画布已在 mapPane 内随 GPU translate3d 与底图严丝合缝同步移动；
        // 仅当累计平移超出安全余量或缩放改变时才重锚定重绘，避免每帧 60FPS 重采样导致竹林/树木闪烁。
        const panePos = this.getMapPanePos();
        const zoom = Math.floor(this.map.getZoom());
        if (
            zoom !== this.paintedZoom ||
            !Number.isFinite(this.paintedPaneX) ||
            Math.abs(panePos.x - this.paintedPaneX) > CANVAS_REPAINT_DRIFT_PX ||
            Math.abs(panePos.y - this.paintedPaneY) > CANVAS_REPAINT_DRIFT_PX
        ) {
            this.paint();
        }
    };
    private readonly onTerrainReady = () => {
        // 🔴 [2026-11-02 主人报「玩家移动有点卡」] 跟拍行军时新瓦片一批批到，原来每批都把整层作废重采样
        //    （实测重采样里强制的占 16/19）。上一次采样若高程/水域全齐，新瓦片改变不了结果 → 不必重算。
        if (!this.lastRenderIncomplete) return;
        if (this.terrainReadyTimer !== null) return;
        // 合并窗 250 → 500ms：行军进新区时瓦片是一批批到的，合并成更少的几次重采样
        this.terrainReadyTimer = window.setTimeout(() => {
            this.terrainReadyTimer = null;
            this.lastRenderKey = '';
            this.scheduleRender(0);
        }, 500);
    };

    constructor(map: L.Map) {
        this.map = map;
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE)!;
        pane.style.zIndex = '565';
        pane.style.pointerEvents = 'none';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'strategic-vegetation leaflet-zoom-animated';
        this.canvas.style.pointerEvents = 'none';
        this.ctx = this.canvas.getContext('2d')!;
        pane.appendChild(this.canvas);

        map.on('moveend', this.onViewportChanged);
        map.on('zoomend', this.onZoomChanged);
        map.on('move', this.onCanvasFollow);
        map.on('resize', this.onResize);
        window.addEventListener('land-sea-tiles-updated', this.onTerrainReady);
        window.addEventListener('strategic-rivers-ready', () => {
            this.lastRenderKey = '';
            this.scheduleRender();
        });
        this.resize();
        this.render();
        void loadStrategicForestMask().then((ready) => {
            if (!ready) return;
            this.lastRenderKey = '';
            this.scheduleRender();
        });
        void loadLandUseMask().then((ready) => {
            if (!ready) return;
            this.lastRenderKey = '';
            this.scheduleRender();
        });
        void loadWorldBaseData('/world/world-base.png').then((ready) => {
            if (!ready) return;
            this.lastRenderKey = '';
            this.scheduleRender();
        });
        this.startSeasonBlendWatch();
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
        this.lastRenderKey = '';
        if (visible) this.scheduleRender();
        else this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private resize(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x + CANVAS_PAD_PX * 2;
        this.canvas.height = size.y + CANVAS_PAD_PX * 2;
        this.syncCanvasPosition();
    }

    /**
     * 季节渐变驱动：
     * - 低频轮询（200ms）检测换季与进入渐变窗口；
     * - 一旦进入渐变期，无缝唤醒 requestAnimationFrame 进行 60 FPS 极度丝滑重绘；
     * - 渐变结束或非过渡期自动平稳休眠，零多余性能开销。
     */
    private startSeasonBlendWatch(): void {
        if (this.seasonTimer !== null || this.rafId !== null) return;

        let isRafActive = false;
        let lastBlendPaintAt = 0;

        const rafLoop = () => {
            if (!this.visible) {
                isRafActive = false;
                this.rafId = null;
                return;
            }
            const gameSeason = currentGameSeason();
            if (this.sampledGameSeason !== gameSeason) {
                this.lastRenderKey = '';
                this.render(); // 换季翻转瞬间立即同步重绘，零延迟无缝接盘新季
                isRafActive = false;
                this.rafId = null;
                return;
            }
            const blend = seasonBlend();
            if (blend > 0) {
                // 5 秒渐变不需要 60fps 整层重画：≈30fps 足够平滑，paint 次数减半
                const now = performance.now();
                if (now - lastBlendPaintAt >= BLEND_PAINT_MIN_INTERVAL_MS) {
                    lastBlendPaintAt = now;
                    this.paint();
                }
                this.rafId = requestAnimationFrame(rafLoop);
            } else {
                isRafActive = false;
                this.rafId = null;
            }
        };

        this.seasonTimer = window.setInterval(() => {
            if (!this.visible) return;
            if (this.paintDeferred && this.map.getContainer().style.visibility !== 'hidden') this.paint();
            const gameSeason = currentGameSeason();
            if (this.sampledGameSeason !== gameSeason) {
                this.lastRenderKey = '';
                this.render(); // 换季立即同步重绘
                return;
            }
            if (seasonBlend() > 0 && !isRafActive) {
                isRafActive = true;
                this.rafId = requestAnimationFrame(rafLoop);
            }
        }, 200);
    }
    private seasonTimer: number | null = null;
    private rafId: number | null = null;
    private sampledGameSeason = -1;
    private paintDeferred = false;

    private trees: TreeDrawCommand[] = [];

    /**
     * 绘制树木：
     * - 采用 60 FPS 连续插值；
     * - 引入单树经纬度微错峰（Per-Tree Organic Phase）；
     * - 对称 Cross-Fade 交叉淡出，彻底消除换季跳闪与树木消失。
     */
    private paint(): void {
        // 战略地图被独立战场覆盖时，换季渐变不再反复重画屏下的整层树木。
        if (this.map.getContainer().style.visibility === 'hidden') { this.paintDeferred = true; return; }
        this.paintDeferred = false;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.visible || this.trees.length === 0) return;
        const zoom = Math.floor(this.map.getZoom());
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) return;

        const gameSeason = currentGameSeason();
        // 换季翻转瞬间若 paint 先于 seasonTimer 触发，立即同步执行 renderInner 刷新四季树种，杜绝闪回上一季旧树
        if (this.sampledGameSeason !== -1 && this.sampledGameSeason !== gameSeason) {
            this.lastRenderKey = '';
            this.renderInner();
            return;
        }
        this.syncCanvasPosition();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const baseBlend = this.sampledGameSeason === gameSeason
            ? Math.min(1, Math.max(0, seasonBlend()))
            : 0;
        const treeBaseScale = strategicTreeScale(zoom);
        const W = this.canvas.width, H = this.canvas.height;
        const topLeftX = this.canvasTopLeft.x;
        const topLeftY = this.canvasTopLeft.y;

        const items: { x: number; y: number; s: number; c: TreeDrawCommand }[] = [];
        if (LAST_DRAWN_ASSET.size > LAST_DRAWN_MAX) LAST_DRAWN_ASSET.clear();   // 防无限增长
        // 🔴 [2026-11-02 主人报「玩家移动有点卡」] 不再逐树 latLngToLayerPoint（每棵新建 LatLng/Point）：
        //    采样时已存 SAMPLE_ZOOM 世界像素，按缩放比换算后同样取整（与 latLngToLayerPoint 的 _round 一致）。
        const zoomScale = this.map.getZoomScale(this.map.getZoom(), SAMPLE_ZOOM);
        const origin = this.map.getPixelOrigin();
        for (const c of this.trees) {
            // 使用整数 Layer 像素坐标减去整数 canvasTopLeft，保证每棵树在画布上的根部坐标恒为整数，平移重绘零亚像素跳变
            const x = Math.round(c.wx * zoomScale) - origin.x - topLeftX;
            const y = Math.round(c.wy * zoomScale) - origin.y - topLeftY;
            const s = treeBaseScale * c.jitter;
            const pad = 380 * s;
            if (x < -pad || x > W + pad || y < -pad || y > H + pad) continue;
            items.push({ x, y, s, c });
        }
        items.sort((a, b) => a.y - b.y || a.x - b.x);

        const drawTreeAsset = (
            asset: string,
            variant: number,
            it: { x: number; y: number; s: number },
            alpha: number,
        ): string | null => {
            if (alpha <= 0.002) return null;
            const meta = TREE_METAS[asset];
            ctx.globalAlpha = alpha * TREE_OPACITY;

            if (meta) {
                const framesImg = treeFramesImage(asset, this.onTreeImageReady);
                // 🔴 若该树种第 0 帧被剔除（如 PINE / SNOW_PINE 的 preview.png 是第 0 帧枯木棍），绝不回退画 preview.png
                const prevImg = meta.frames.includes(0) ? treeImage(asset, this.onTreeImageReady) : null;

                // 🔴 2026-11-01 主人令「让素材的显示大小都和 DE 一致，所有素材显示大小比例一致」：
                //    直接按 DE 原生 boxW × boxH 乘统一缩放系数 it.s，保留乔木、竹林、灌木、仙人掌各自的 DE 原生高矮胖瘦比例。
                const w = Math.round(meta.boxW * it.s);
                const h = Math.round(meta.boxH * it.s);
                const dx = it.x - Math.round(meta.anchorX * it.s);
                const dy = it.y - Math.round(meta.anchorY * it.s);

                if (framesImg) {
                    const frameIdx = meta.frames[variant % meta.frames.length];
                    const sx = frameIdx * meta.boxW;
                    ctx.drawImage(framesImg, sx, 0, meta.boxW, meta.boxH, dx, dy, w, h);
                    return asset;
                }
                if (prevImg) {
                    ctx.drawImage(prevImg, 0, 0, prevImg.naturalWidth, prevImg.naturalHeight, dx, dy, w, h);
                    return asset;
                }
                return null;   // 两张都没就绪：由调用方用「上一次画成的图」兜底，绝不留空
            }
            // 兜底：未配置元数据的资产按原生尺寸等比缩放、底部居中对齐
            const im = treeImage(asset, this.onTreeImageReady);
            if (im) {
                const w = Math.round(im.naturalWidth * it.s);
                const h = Math.round(im.naturalHeight * it.s);
                ctx.drawImage(im, it.x - Math.round(w / 2), it.y - h, w, h);
                return asset;
            }
            return null;
        };

        // 🔴 DE 原生树木精灵（frames.png）自身已内置柔化好的左下角等轴测地面阴影；
        //    不再叠加额外黑椭圆底荫（截图中会外露成黑圆斑/膏药印），靠 40px DE 饱满树冠自身层叠咬合，保持树根与地表干净通透融合。
        for (const it of items) {
            /** 树位键（经纬度 5 位小数）：给「上一帧画成的贴图」备忘用，四季之间坐标绝对不变 */
            const posKey = it.c.posKey;

            // 每棵树基于经纬度哈希做秒级错峰（0~0.60 秒）：整片林在 5 秒窗口内依次换装覆雪/融雪
            let treeBlend = baseBlend;
            if (baseBlend > 0 && it.c.assetNext !== it.c.asset) {
                treeBlend = seasonBlend(hash(it.c.lat, it.c.lng, 99) * 0.60);
            }

            // 🔴 零消失铁律：只有当下一季新树贴图完全解码就绪时，才允许进入交叉淡出；
            // 若下一季新树尚未就绪，100% 满额绘制当前老树，绝不让画面中出现任何一帧无树或消失！
            const currentReady = isTreeAssetReady(it.c.asset);
            const nextReady = it.c.assetNext !== it.c.asset && isTreeAssetReady(it.c.assetNext);

            if (currentReady && nextReady && treeBlend > 0) {
                const a1 = (1 - treeBlend) * TREE_OPACITY;
                const a2 = 1 - (1 - TREE_OPACITY) / (1 - a1);
                drawTreeAsset(it.c.asset, it.c.variant, it, 1 - treeBlend);
                drawTreeAsset(it.c.assetNext, it.c.variant, it, a2 / TREE_OPACITY);
                LAST_DRAWN_ASSET.set(posKey, it.c.assetNext);
            } else if (!currentReady && nextReady) {
                // 本季贴图还没解码完、下一季却已就绪 → 先按新季满额画，绝不空着
                if (drawTreeAsset(it.c.assetNext, it.c.variant, it, 1)) LAST_DRAWN_ASSET.set(posKey, it.c.assetNext);
            } else {
                // 其余一律满额画本季老树（下一季没就绪就不淡化，杜绝"老树淡没了、新树没来"）
                const drawn = drawTreeAsset(it.c.asset, it.c.variant, it, 1);
                if (drawn) LAST_DRAWN_ASSET.set(posKey, drawn);
                else {
                    // 🔴 [2026-09-19] 本季与下一季两张都还没就绪（换季那一瞬最易发生）→
                    //   用这棵树上一次真正画成的贴图顶上：宁可晚一帧换季，也绝不留一棵空树。
                    const last = LAST_DRAWN_ASSET.get(posKey);
                    if (last && last !== it.c.asset && last !== it.c.assetNext) {
                        drawTreeAsset(last, it.c.variant, it, 1);
                    }
                }
            }
            ctx.globalAlpha = 1;
        }
    }

    private onTreeImageReady = (): void => {
        this.paint();
    };

    private scheduleRender(delay = 0): void {
        if (!this.visible) return;
        const since = performance.now() - this.lastRenderAt;
        const wait = Math.max(delay, since >= MIN_RENDER_INTERVAL_MS ? 0 : MIN_RENDER_INTERVAL_MS - since);
        if (this.renderTimer !== null) {
            if (delay === 0 && wait === 0) {
                window.clearTimeout(this.renderTimer);
            } else {
                return;
            }
        }
        this.renderTimer = window.setTimeout(() => {
            this.renderTimer = null;
            this.render();
        }, wait);
    }

    private render(): void {
        if (!import.meta.env.DEV) { this.renderInner(); return; }
        const t0 = performance.now();
        this.renderInner();
        perfDoctor.note('VegetationLayer.render', performance.now() - t0,
            'src/map/VegetationLayer.ts:render', this.lastTreeCount);
    }

    private lastTreeCount = 0;
    /** 上一次采样有高程/水域瓦片没到（true = 新瓦片到了要重采样；开局为 true） */
    private lastRenderIncomplete = true;

    private renderInner(): void {
        if (!this.visible) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }

        const zoom = Math.floor(this.map.getZoom());
        const inRange = zoom >= MIN_ZOOM && zoom <= MAX_ZOOM;
        this.canvas.style.display = inRange ? 'block' : 'none';
        if (!inRange) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.lastRenderKey = ''; return; }
        // 森林模型按史实开垦随年份变化：一次渲染取一次年份（换季重绘时自然跟上新年份）
        const gameYear = currentGameYear();

        const size = this.map.getSize();
        const targetW = size.x + CANVAS_PAD_PX * 2;
        const targetH = size.y + CANVAS_PAD_PX * 2;
        if (size.x > 0 && (this.canvas.width !== targetW || this.canvas.height !== targetH)) this.resize();

        const bounds = this.map.getBounds();
        const nw = this.map.project(bounds.getNorthWest(), SAMPLE_ZOOM);
        const se = this.map.project(bounds.getSouthEast(), SAMPLE_ZOOM);
        // 🔴 [2026-11-02 主人报「玩家移动有点卡」] 采样窗按 RESAMPLE_CHUNK_PX（=4 格）外扩对齐，
        //    原来按 1 格（46px）对齐 → 跟拍每走 46px 就整层重采样一次（实测 4.6 次/秒、单次最长 75ms）。
        //    CHUNK 是格距整数倍，树位网格不变，同一棵树位置/树种完全不变，只是重采样频率降到约 1/4。
        const xMin = Math.floor((nw.x - CANVAS_PAD_PX) / RESAMPLE_CHUNK_PX) * RESAMPLE_CHUNK_PX;
        const xMax = Math.ceil((se.x + CANVAS_PAD_PX) / RESAMPLE_CHUNK_PX) * RESAMPLE_CHUNK_PX;
        const yMin = Math.floor((nw.y - CANVAS_PAD_PX) / RESAMPLE_CHUNK_PX) * RESAMPLE_CHUNK_PX;
        const yMax = Math.ceil((se.y + CANVAS_PAD_PX) / RESAMPLE_CHUNK_PX) * RESAMPLE_CHUNK_PX;
        // 抽稀比例只按原窗口（视口 + 余量）内的树算，外扩那圈不挤占配额，也不随外扩宽窄让屏内树忽多忽少
        const coreXMin = nw.x - CANVAS_PAD_PX, coreXMax = se.x + CANVAS_PAD_PX;
        const coreYMin = nw.y - CANVAS_PAD_PX, coreYMax = se.y + CANVAS_PAD_PX;

        const gameSeason = currentGameSeason();
        const season = currentTreeSeason();
        const nextSeason = nextTreeSeason(season);

        const key = `${zoom}|${xMin}|${xMax}|${yMin}|${yMax}|${gameSeason}`;
        if (key === this.lastRenderKey) return;
        this.lastRenderKey = key;
        this.lastRenderAt = performance.now();
        // 🔴 [2026-09-18 修消失] 禁止在此处提前 clearRect：旧树必须持续显示在画布上，直到 paint() 原子绘制新树！

        let missingTiles = 0;
        let waterNulls = 0;
        let pendingImages = 0;
        let drawnTrees = 0;
        const drawCommands: TreeDrawCommand[] = [];
        const waterSampler = LandSeaSystem.getWaterSampler();

        const FOREST_HUNTING_STYLES = new Set([
            'NORTHEAST', 'VARANGIANS', 'DIANQIAN', 'MAPUCHE',
            'TUPI', 'AMERICA', 'MAYANS', 'GEORGIANS',
        ]);
        const paddedBounds = bounds.pad(0.48);
        const visibleCities = CITIES_V2
            .filter((city) => paddedBounds.contains([city.lat, city.lng]))
            .map((city) => {
                const wpt = this.map.project([city.lat, city.lng], SAMPLE_ZOOM);
                const style = city.buildingStyle ?? '';
                return {
                    lat: city.lat,
                    lng: city.lng,
                    wx: wpt.x,
                    wy: wpt.y,
                    isForestHunting: FOREST_HUNTING_STYLES.has(style),
                    isOasisCity: OASIS_STYLES.has(style) || (style === 'HEXI' && city.lng <= 107.0),
                };
            });

        // 🔴 [2026-11-01 主人令「密林连冠成海 + 疏林/绿洲保持成簇 + 战略道路自动留出林间走廊，分布摆放学习 DE」]
        //    构建视口内战略道路的世界像素空间哈希桶（SAMPLE_ZOOM），密林遇到官道/山道自动退让，劈出清晰的林间行军走廊（如秦岭栈道、条顿堡林道）。
        const roadBuckets = new Map<string, Array<[number, number, number, number]>>();
        const rLatMin = paddedBounds.getSouth();
        const rLatMax = paddedBounds.getNorth();
        const rLngMin = paddedBounds.getWest();
        const rLngMax = paddedBounds.getEast();
        for (const feat of VECTOR_ROAD_DATA.features) {
            const coords = feat.geometry?.coordinates;
            if (!coords || coords.length < 2) continue;
            const sy = feat.properties?.startYear;
            const ey = feat.properties?.endYear;
            if (sy !== undefined && gameYear < sy) continue;
            if (ey !== undefined && gameYear > ey) continue;
            let prevWpt: { x: number; y: number } | null = null;
            let prevIn = false;
            for (let k = 0; k < coords.length; k++) {
                const [lng, lat] = coords[k];
                const curIn = lat >= rLatMin && lat <= rLatMax && lng >= rLngMin && lng <= rLngMax;
                if (!curIn && !prevIn) {
                    prevWpt = null;
                    prevIn = false;
                    continue;
                }
                const wpt = this.map.project([lat, lng], SAMPLE_ZOOM);
                if (prevWpt === null && k > 0) {
                    const [pLng, pLat] = coords[k - 1];
                    prevWpt = this.map.project([pLat, pLng], SAMPLE_ZOOM);
                }
                if (prevWpt !== null) {
                    const bx0 = Math.floor((Math.min(prevWpt.x, wpt.x) - ROAD_CLEAR_PX) / ROAD_BUCKET_PX);
                    const bx1 = Math.floor((Math.max(prevWpt.x, wpt.x) + ROAD_CLEAR_PX) / ROAD_BUCKET_PX);
                    const by0 = Math.floor((Math.min(prevWpt.y, wpt.y) - ROAD_CLEAR_PX) / ROAD_BUCKET_PX);
                    const by1 = Math.floor((Math.max(prevWpt.y, wpt.y) + ROAD_CLEAR_PX) / ROAD_BUCKET_PX);
                    const seg: [number, number, number, number] = [prevWpt.x, prevWpt.y, wpt.x, wpt.y];
                    for (let by = by0; by <= by1; by++) {
                        for (let bx = bx0; bx <= bx1; bx++) {
                            const key = `${bx},${by}`;
                            let arr = roadBuckets.get(key);
                            if (!arr) {
                                arr = [];
                                roadBuckets.set(key, arr);
                            }
                            arr.push(seg);
                        }
                    }
                }
                prevWpt = wpt;
                prevIn = curIn;
            }
        }
        const distSqToRoad = (tx: number, ty: number): number => {
            const segs = roadBuckets.get(`${Math.floor(tx / ROAD_BUCKET_PX)},${Math.floor(ty / ROAD_BUCKET_PX)}`);
            if (!segs) return Infinity;
            let best = Infinity;
            for (const [x1, y1, x2, y2] of segs) {
                const dx = x2 - x1;
                const dy = y2 - y1;
                const lenSq = dx * dx + dy * dy;
                let t = lenSq > 1e-6 ? ((tx - x1) * dx + (ty - y1) * dy) / lenSq : 0;
                if (t < 0) t = 0;
                else if (t > 1) t = 1;
                const ddx = tx - (x1 + t * dx);
                const ddy = ty - (y1 + t * dy);
                const dSq = ddx * ddx + ddy * ddy;
                if (dSq < best) best = dSq;
            }
            return best;
        };

        // 🔴 [2026-11-02 主人令「矢量河流道路分开森林 + 多铺亚马孙等大片森林」]
        //    构建视口内矢量河流中心线的世界像素空间哈希桶（SAMPLE_ZOOM），让干支流像《全面战争》一样把成片林海清晰切开，
        //    并在河道净空带外侧（16~48px）为开阔河谷提供护岸散树簇加成。
        const riverBuckets = new Map<string, Array<[number, number, number, number]>>();
        for (const entry of getStrategicRiverFeatures()) {
            const [minLng, minLat, maxLng, maxLat] = entry.bbox;
            if (maxLng < rLngMin || minLng > rLngMax || maxLat < rLatMin || minLat > rLatMax) continue;
            for (const line of entry.lines) {
                if (line.length < 2) continue;
                let prevWpt: { x: number; y: number } | null = null;
                let prevIn = false;
                for (let k = 0; k < line.length; k++) {
                    const [lng, lat] = line[k];
                    const curIn = lat >= rLatMin && lat <= rLatMax && lng >= rLngMin && lng <= rLngMax;
                    if (!curIn && !prevIn) {
                        prevWpt = null;
                        prevIn = false;
                        continue;
                    }
                    const wpt = this.map.project([lat, lng], SAMPLE_ZOOM);
                    if (prevWpt === null && k > 0) {
                        const [pLng, pLat] = line[k - 1];
                        prevWpt = this.map.project([pLat, pLng], SAMPLE_ZOOM);
                    }
                    if (prevWpt !== null) {
                        const bx0 = Math.floor((Math.min(prevWpt.x, wpt.x) - RIVER_RIPARIAN_PX) / ROAD_BUCKET_PX);
                        const bx1 = Math.floor((Math.max(prevWpt.x, wpt.x) + RIVER_RIPARIAN_PX) / ROAD_BUCKET_PX);
                        const by0 = Math.floor((Math.min(prevWpt.y, wpt.y) - RIVER_RIPARIAN_PX) / ROAD_BUCKET_PX);
                        const by1 = Math.floor((Math.max(prevWpt.y, wpt.y) + RIVER_RIPARIAN_PX) / ROAD_BUCKET_PX);
                        const seg: [number, number, number, number] = [prevWpt.x, prevWpt.y, wpt.x, wpt.y];
                        for (let by = by0; by <= by1; by++) {
                            for (let bx = bx0; bx <= bx1; bx++) {
                                const key = `${bx},${by}`;
                                let arr = riverBuckets.get(key);
                                if (!arr) {
                                    arr = [];
                                    riverBuckets.set(key, arr);
                                }
                                arr.push(seg);
                            }
                        }
                    }
                    prevWpt = wpt;
                    prevIn = curIn;
                }
            }
        }
        const distSqToRiver = (tx: number, ty: number): number => {
            const segs = riverBuckets.get(`${Math.floor(tx / ROAD_BUCKET_PX)},${Math.floor(ty / ROAD_BUCKET_PX)}`);
            if (!segs) return Infinity;
            let best = Infinity;
            for (const [x1, y1, x2, y2] of segs) {
                const dx = x2 - x1;
                const dy = y2 - y1;
                const lenSq = dx * dx + dy * dy;
                let t = lenSq > 1e-6 ? ((tx - x1) * dx + (ty - y1) * dy) / lenSq : 0;
                if (t < 0) t = 0;
                else if (t > 1) t = 1;
                const ddx = tx - (x1 + t * dx);
                const ddy = ty - (y1 + t * dy);
                const dSq = ddx * ddx + ddy * ddy;
                if (dSq < best) best = dSq;
            }
            return best;
        };

        for (let gy = yMin; gy <= yMax; gy += TREE_GRID_STEP) {
            for (let gx = xMin; gx <= xMax; gx += TREE_GRID_STEP) {
                // 有机微抖动：打破网格机械感
                const px = gx + TREE_GRID_STEP * 0.5 + (hash(gx, gy, 11) - 0.5) * (TREE_GRID_STEP * 0.65);
                const py = gy + TREE_GRID_STEP * 0.5 + (hash(gx, gy, 12) - 0.5) * (TREE_GRID_STEP * 0.65);
                const ptLatLng = this.map.unproject([px, py], SAMPLE_ZOOM);
                if (ptLatLng.lat < -58 || ptLatLng.lat > 75) continue;

                // 据点避让统一在 SAMPLE_ZOOM 世界像素坐标系下计算，彻底杜绝因平移/缩放亚像素取整导致的城周树木闪现
                if (visibleCities.some((c) => Math.hypot(c.wx - px, c.wy - py) < (c.isForestHunting ? 34 : CITY_CLEAR_PX))) continue;

                const water = waterSampler.isWaterSync(ptLatLng.lat, ptLatLng.lng);
                if (water === true || LandSeaSystem.isSeaAt(ptLatLng)) continue;
                if (water === null) {
                    waterNulls++;
                    waterSampler.scheduleFetch(ptLatLng.lat, ptLatLng.lng);
                }

                // 自然地理林线与高寒冻土门控：
                // 1. 阿尔卑斯山（44°~54°N）林线 2150m，青藏高原 4100m，高纬度 1400m；
                // 2. 超出林线或裸岩、高山雪原一律不长树，刃脊与雪峰自然裸露。
                const treeLine = getTreeLine(ptLatLng.lat, ptLatLng.lng);
                const elev = LandSeaSystem.getElevationAtMapPixel(
                    px, py, SAMPLE_ZOOM, ptLatLng.lat, ptLatLng.lng,
                );
                // 🔴 高程瓦片未就绪时：极高海拔区（青藏高原/喜马拉雅）严格等待真瓦片剔除超林线树，
                //    平原与已知低地丘陵先放行渲染，避免外网瓦片慢时整层树木被饿死/全图秃光。
                const isHighPlateau = ptLatLng.lng >= 75 && ptLatLng.lng <= 105 && Math.abs(ptLatLng.lat) >= 26 && Math.abs(ptLatLng.lat) <= 40;
                if (elev === null) {
                    missingTiles++;
                    if (isHighPlateau) continue;
                } else if (elev > treeLine || elev <= 0) {
                    continue;
                }

                // 检查是否处于渔猎民族据点周围 0.36°（约 40km）林带内，或干旱区绿洲重镇周围 0.10°~0.28° 绿洲林带内
                let huntingCityBoost = 0;
                let oasisCityBoost = 0;
                for (const c of visibleCities) {
                    if (c.isForestHunting && (elev === null || elev >= 145)) {
                        const d = Math.hypot(ptLatLng.lat - c.lat, ptLatLng.lng - c.lng);
                        if (d < 0.32) {
                            huntingCityBoost = Math.max(huntingCityBoost, 0.48 * (1 - d / 0.36));
                        }
                    } else if (c.isOasisCity && (elev === null || elev < 1850)) {
                        const d = Math.hypot(ptLatLng.lat - c.lat, ptLatLng.lng - c.lng);
                        if (d >= 0.10 && d <= 0.28) {
                            oasisCityBoost = Math.max(oasisCityBoost, 0.30 * (1 - (d - 0.10) / 0.22));
                        }
                    }
                }

                // 地表材质与生物群系判定
                const tile = queryBaseTile({ lat: ptLatLng.lat, lng: ptLatLng.lng, isSiege: false, isWinter: false })
                    ?? resolveTerrainTile(ptLatLng.lat, ptLatLng.lng, 0);
                const forestBiome = queryStrategicForestBiome(ptLatLng.lat, ptLatLng.lng);
                const canopyDensity = queryStrategicCanopyDensity(ptLatLng.lat, ptLatLng.lng);
                // 连续世界坐标密度场：消除椭圆规则感，呈现犬牙交错与山谷林隙
                const noiseVal = forestNoise(ptLatLng.lat, ptLatLng.lng);

                // 四大特殊历史与生态林带补齐判定（西北/漠北高山林岛、藏东南河谷柏林、古典地中海/黎巴嫩/扎格罗斯山地林、热带稀树草原与丝路/两河/尼罗河绿洲林）
                const specialEco = resolveSpecialEcoVegetation(
                    ptLatLng.lat,
                    ptLatLng.lng,
                    elev,
                    tile,
                    forestBiome,
                    canopyDensity,
                    noiseVal,
                    oasisCityBoost,
                );

                // 🔴 [2026-11-01 ~ 2026-11-02 主人令「平原河流与山麓过渡带进行适度精细化优化」]
                //    内陆平原大河护岸林带：在温带/亚热带/热带农耕大平原（即便周围农田因开垦使 forestCover < 0.40），
                //    紧贴河道两岸（邻格 0.022°≈2.4km 有水或邻近矢量河流中心线 16~52px 且海拔 > 3m 非海岸）按噪声场间断保留河岸护岸散树丛。
                let riparianBoost = 0;
                if (
                    (elev === null || (elev > 3 && elev < treeLine)) &&
                    forestBiome !== 13 &&
                    !NON_VEGETATION_TILES.has(tile) &&
                    noiseVal >= 0.44
                ) {
                    const R_STEP = 0.022;
                    const riverDistSq = distSqToRiver(px, py);
                    const nearVectorRiverBank =
                        riverDistSq >= RIVER_CLEAR_PX * RIVER_CLEAR_PX &&
                        riverDistSq <= (RIVER_RIPARIAN_PX + 4) * (RIVER_RIPARIAN_PX + 4);
                    const nearRiver =
                        nearVectorRiverBank ||
                        waterSampler.isWaterSync(ptLatLng.lat + R_STEP, ptLatLng.lng) === true ||
                        waterSampler.isWaterSync(ptLatLng.lat - R_STEP, ptLatLng.lng) === true ||
                        waterSampler.isWaterSync(ptLatLng.lat, ptLatLng.lng + R_STEP) === true ||
                        waterSampler.isWaterSync(ptLatLng.lat, ptLatLng.lng - R_STEP) === true;
                    if (nearRiver) {
                        riparianBoost = 0.16 + 0.18 * ((noiseVal - 0.44) / 0.56);
                    }
                }

                if (specialEco.weight <= 0 && riparianBoost <= 0) {
                    if (NON_VEGETATION_TILES.has(tile)) continue;
                    if (forestBiome === 13) continue; // 荒漠生态群系坚决不长树
                    // elev 可能为 null（上面「低地先放行」那条分支），按低地兜底取值，与该分支意图一致
                    if (huntingCityBoost <= 0 && !isStrategicForestArea(forestBiome, tile, elev ?? 250, ptLatLng.lat)) continue;
                }

                let treeTile = specialEco.weight > 0 ? specialEco.effectiveTile : tile;
                if (riparianBoost > 0 && specialEco.weight <= 0 && (ptLatLng.lat >= 20 && ptLatLng.lat <= 35 && ptLatLng.lng >= 68 && ptLatLng.lng <= 95)) {
                    // 南亚河流河岸散树
                    treeTile = ptLatLng.lng < 78 ? 'gr2' : 'gr3';
                }

                const naturalForestWeight = forestClusterWeight(
                    forestBiome,
                    tile,
                    canopyDensity,
                    noiseVal,
                    forestCoverAt(ptLatLng.lat, ptLatLng.lng, gameYear, elev),
                    elev,
                );
                const clusterWeight = Math.max(
                    huntingCityBoost,
                    specialEco.weight,
                    riparianBoost,
                    naturalForestWeight,
                );
                // 🔴 [2026-10-21 ~ 2026-11-01 主人令「密林连冠成海 + 疏林/绿洲保持成簇 + 战略道路自动留出林间走廊，分布摆放学习 DE」]
                if (clusterWeight < 0.18) continue;
                if (clusterWeight < 0.32 && hash(gx, gy, 46) > (clusterWeight - 0.18) / 0.14) continue;   // 林缘软过渡
                if (clusterWeight >= 0.32 && clusterWeight < 0.44 && hash(gx, gy, 47) > 0.85) continue;   // 林缘浅带偶有小林隙

                // 区分「郁闭密林」与「稀树草原/绿洲/河岸疏林/山麓林缘」
                const isSparseEco =
                    (specialEco.weight > 0 && naturalForestWeight < 0.34 && (treeTile === 'sv1' || treeTile === 'sv2' || treeTile === 'du1' || treeTile === 'des' || treeTile === 'gr2' || treeTile === 'gr3')) ||
                    (riparianBoost > 0 && naturalForestWeight < 0.28 && huntingCityBoost < 0.28);
                const isDenseCanopy = !isSparseEco && clusterWeight >= 0.36;

                const count = isDenseCanopy
                    ? (clusterWeight >= 0.56 ? 3 : 2)
                    : (clusterWeight >= 0.28 ? 2 : 1);

                // DE 同团树种内聚：2×2 格共享主树种抽签（使竹林成片、松林成带、桦林成林），伴生树 25% 概率混入本区次要树种
                const clumpCellX = Math.floor(gx / (TREE_GRID_STEP * 2));
                const clumpCellY = Math.floor(gy / (TREE_GRID_STEP * 2));
                const clumpRoll = hash(clumpCellX, clumpCellY, 67);
                const quadRot = Math.floor(hash(gx, gy, 59) * 4);

                let placedInCell = 0;
                for (let i = 0; i < count; i++) {
                    let curPx = px;
                    let curPy = py;
                    if (isDenseCanopy) {
                        // 密林按 2×2 子象限（每象限 23×23px）旋转抽样 2~3 株 + 随机抖动，既成团连冠又留出山脊透气感
                        const qIdx = (i + quadRot) & 3;
                        const qx = qIdx & 1;
                        const qy = (qIdx >> 1) & 1;
                        const halfStep = TREE_GRID_STEP * 0.5;
                        curPx = gx + (qx + 0.5) * halfStep + (hash(gx, gy, i * 17 + 31) - 0.5) * (halfStep * 0.72);
                        curPy = gy + (qy + 0.5) * halfStep + (hash(gx, gy, i * 19 + 32) - 0.5) * (halfStep * 0.72);
                    } else if (i > 0) {
                        const baseAng = hash(gx, gy, 31) * Math.PI * 2 + (i - 1) * ((Math.PI * 2) / Math.max(1, count - 1));
                        const ang = baseAng + (hash(gx, gy, i * 17 + 31) - 0.5) * 0.52;
                        const dist = 6.0 + hash(gx, gy, i * 19 + 32) * 4.5;
                        curPx += Math.cos(ang) * dist;
                        curPy += Math.sin(ang) * dist * 0.74;
                    }

                    // 单株树干级城郊避让、战略官道退让与矢量河流退让：确保城墙净空圈、林间古道与河谷水道干干净净
                    if (visibleCities.some((c) => Math.hypot(c.wx - curPx, c.wy - curPy) < (c.isForestHunting ? 32 : CITY_CLEAR_PX - 4))) continue;
                    if (distSqToRoad(curPx, curPy) < ROAD_CLEAR_PX * ROAD_CLEAR_PX) continue;
                    if (distSqToRiver(curPx, curPy) < RIVER_CLEAR_PX * RIVER_CLEAR_PX) continue;

                    const curLatLng = this.map.unproject([curPx, curPy], SAMPLE_ZOOM);

                    // 🔴 [2026-11-02 修「有的树进海了」]
                    //    1. 单株树偏移后重新校验落点水体与海洋：严禁密林子树抖动或象限抽样甩进海水/湖泊
                    //    2. 校验树根接地处（curPx, curPy）的海拔，<= 0m 直接剔除
                    //    3. 岸线安全边距检测（低海拔/近海区 8px 退让）：杜绝岸边悬崖林木半身探入海湾
                    const curWater = waterSampler.isWaterSync(curLatLng.lat, curLatLng.lng);
                    if (curWater === true || LandSeaSystem.isSeaAt(curLatLng)) continue;

                    const curElev = LandSeaSystem.getElevationAtMapPixel(
                        curPx, curPy, SAMPLE_ZOOM, curLatLng.lat, curLatLng.lng,
                    );
                    if (curElev !== null && curElev <= 0) continue;

                    if (curElev === null || curElev < 80) {
                        const COAST_MARGIN_PX = 8;
                        const pE = this.map.unproject([curPx + COAST_MARGIN_PX, curPy], SAMPLE_ZOOM);
                        const pW = this.map.unproject([curPx - COAST_MARGIN_PX, curPy], SAMPLE_ZOOM);
                        const pS = this.map.unproject([curPx, curPy + COAST_MARGIN_PX], SAMPLE_ZOOM);
                        const pN = this.map.unproject([curPx, curPy - COAST_MARGIN_PX], SAMPLE_ZOOM);
                        if (
                            LandSeaSystem.isSeaAt(pE) ||
                            LandSeaSystem.isSeaAt(pW) ||
                            LandSeaSystem.isSeaAt(pS) ||
                            LandSeaSystem.isSeaAt(pN)
                        ) {
                            continue;
                        }
                    }

                    // 🔴 2026-10-31 ~ 2026-11-01 主人令「植被符合区域，战略和战术保持一致」「按真实的地理，历史模拟」：
                    //    树种从植物总表本区主树种按权重取，四季物候（温带落叶阔叶冬枯/覆雪、常绿与针叶冬青/披雪、荒漠枯木）
                    //    完全由与战术共用的 seasonalDeTree(base, s, isSnow) 统一决定，不再在战略层把枯树/冬枝强行改成灌木或松树。
                    const isPermSnowTile = tile === 'sno' || tile === 'sn2' || tile === 'snf' || tile === 'snd' || tile === 'ic3' || tile === 'ice';
                    const wf = queryWinterSnow(curLatLng.lat, curLatLng.lng);
                    const isAlpineWinterSnow = elev !== null && Math.abs(curLatLng.lat) >= 26 && elev >= treeLine - 350;
                    const hasWinterSnowGround = wf === 1 || wf === 2 || wf === 3 || isAlpineWinterSnow;

                    // 主树与 75% 伴生树沿用本树团主导树种抽签（clumpRoll），25% 伴生树独立抽签作为混交林点缀
                    const speciesRoll = (i === 0 || hash(gx, gy, i * 29 + 61) < 0.75)
                        ? clumpRoll
                        : hash(gx, gy, i * 13 + 71);
                    const resolveStrategicTreeForSeason = (s: TreeSeason): string => {
                        const localS = localSeasonAtLat(s, curLatLng.lat);
                        const isSnow = isPermSnowTile || (localS === 3 && hasWinterSnowGround);
                        return seasonalDeTree(plantTreeAt(curLatLng.lat, curLatLng.lng, speciesRoll), localS, isSnow);
                    };
                    const asset = resolveStrategicTreeForSeason(season);
                    const assetNext = resolveStrategicTreeForSeason(nextSeason);

                    // 预热多变体精灵图（对于第 0 帧可用者兼顾 preview.png）
                    const preloadAsset = (targetAsset: string): boolean => {
                        const m = TREE_METAS[targetAsset];
                        if (m && !m.frames.includes(0)) {
                            return !!treeFramesImage(targetAsset, this.onTreeImageReady);
                        }
                        return !!(treeFramesImage(targetAsset, this.onTreeImageReady) || treeImage(targetAsset, this.onTreeImageReady));
                    };
                    if (!preloadAsset(asset)) pendingImages++;
                    if (assetNext !== asset && !preloadAsset(assetNext)) pendingImages++;

                    // DE 原生精灵帧内已自带不同高矮树形变体，严格保持 jitter = 1，不额外缩放破坏 DE 比例
                    const jitter = 1;
                    const variant = Math.floor(hash(gx, gy, i * 37 + 89) * 100);
                    const wpt = this.map.project(curLatLng, SAMPLE_ZOOM);
                    drawCommands.push({
                        lat: curLatLng.lat,
                        lng: curLatLng.lng,
                        jitter,
                        asset,
                        assetNext,
                        variant,
                        inGrove: isDenseCanopy && placedInCell === 0,
                        wx: wpt.x,
                        wy: wpt.y,
                        posKey: `${Math.round(curLatLng.lat * 1e5)},${Math.round(curLatLng.lng * 1e5)}`,
                    });
                    placedInCell++;
                }
            }
        }

        // 🔴 [2026-09-11 主人报「植被在渐变的过程中有一段消失的状态」]
        //   实测成因：视口的地形/水域掩膜尚未就绪时，采样会**整片跳过**（missingTiles>0），
        //   于是 drawCommands 为空 → this.trees = [] → paint() 清完画布就 return（`trees.length===0` 早退）
        //   → **整层植被空白**，要等掩膜到齐（下面的 15 次重试）才回来；换季要重算整层，正好撞上这个空窗。
        //   因此：**新采样为空 + 旧列表非空 + 确有瓦片未就绪** → 保留旧列表继续显示（跟拍移动时旧树大多仍在屏内，不会闪白），
        //   并沿用下面的重试逻辑，等掩膜到了再换成新列表。
        // 🔴 [2026-09-19 主人令「全面修复」] 上一版把判据放宽成「新采样不足旧列表 60% 也保留旧树」——
        //   那会让镜头移到另一片区域时整批留下旧树、新视口该长的树反而不画（旧树又多在屏外＝等于少画树），
        //   故收窄回上面这条原判据：只在「新采样为空」时兜底。
        // 🔴 [2026-10-31] 单次重建树数封顶：超出时按树位哈希等比抽稀（保留林区形状），防大视口拖动时 paint 过重
        let coreCount = 0;
        for (const c of drawCommands) {
            if (c.wx >= coreXMin && c.wx <= coreXMax && c.wy >= coreYMin && c.wy <= coreYMax) coreCount++;
        }
        if (coreCount > MAX_TREES_PER_RENDER) {
            const keep = MAX_TREES_PER_RENDER / coreCount;
            const thinned = drawCommands.filter((c) => hash(Math.round(c.lat * 1e4), Math.round(c.lng * 1e4), 77) < keep);
            drawCommands.length = 0;
            drawCommands.push(...thinned);
        }
        const keepOldTrees = drawCommands.length === 0 && this.trees.length > 0 && missingTiles > 0;
        if (!keepOldTrees) this.trees = drawCommands;
        this.sampledGameSeason = gameSeason;
        this.paint();
        drawnTrees = this.trees.length;

        this.lastTreeCount = drawnTrees;
        this.lastRenderIncomplete = missingTiles > 0 || waterNulls > 0;
        // 🔴 [2026-11-02] 贴图未解码不再作废采样键：这些树已在 drawCommands 里，贴图一到 onTreeImageReady 会 paint 补画；
        //    原来只要有一张没到，下一次 moveend 就整层重采样一次（跟拍时 ≈ 每秒数次）。
        void pendingImages;

        if (missingTiles > 0) {
            if (this.retryKey !== key) { this.retryKey = key; this.retryCount = 0; }
            if (this.retryCount < 15) {
                this.retryCount++;
                this.lastRenderKey = '';
                this.scheduleRender(600 + this.retryCount * 300);
            }
        }
    }

    private drawPatch(x: number, y: number, radius: number, r: number, g: number, b: number, alpha: number): void {
        const ctx = this.ctx;
        const grad = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
