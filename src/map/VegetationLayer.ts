import L from 'leaflet';
import { CITIES_V2 } from '../data/cities_v2';
import { resolveTerrainTile } from '../ui/Scene13Biome';
import { loadWorldBaseData, queryBaseTile, queryWinterSnow } from '../ui/scene13/WorldBaseMap';
import { pickTree, type TreeSeason } from '../ui/scene13/TreeAssignment';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import { perfDoctor } from '../debug/PerfDoctor';
import {
    loadStrategicForestMask,
    queryStrategicCanopyDensity,
    queryStrategicForestBiome,
} from './StrategicForestMask';

const PANE = 'vegetationPane';
const SAMPLE_ZOOM = 9;
const MIN_ZOOM = 9;
const MAX_ZOOM = 10;
const CITY_CLEAR_PX = 46;
/** 画布四周离屏余量（px）：平移期间直接由 mapPane GPU 硬件变换同步移动，消除每帧亚像素重采样闪烁 */
const CANVAS_PAD_PX = 160;
/** 镜头平移累计超过该阈值（px）才重定位并重绘离屏余量画布（小于 CANVAS_PAD_PX，屏边不露白） */
const CANVAS_REPAINT_DRIFT_PX = 96;
/** 两次重建之间的最小间隔（ms）。跟拍军团时 GameAppLoop 每帧 setView → 每帧 moveend，
 *  不节流的话整层色块每帧重画。 */
const MIN_RENDER_INTERVAL_MS = 200;
/** 树贴图在 SAMPLE_ZOOM(9) 时的基准高度（px）。Z9 为 25px，Z10 随缩放自然展开至约 32px。 */
const TREE_BASE_PX = 25;
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

/** 丝路绿洲、西域/河西、两河、尼罗河与阿den/阿拉伯绿洲据点建筑风格 */
const OASIS_STYLES = new Set([
    'XINJIANG', 'HEXI', 'TRANSOXIANA', 'PERSIA', 'SASANIAN',
    'ARABIA', 'EGYPT', 'MESOPOTAMIA', 'MAGHREB', 'TANGUT',
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

    const clusterFactor = noiseVal >= 0.36 ? Math.pow((noiseVal - 0.36) / 0.64, 1.20) : 0;

    // ① 丝路绿洲据点外围 & 尼罗河/两河冲积绿洲林带（红柳/梭梭灌丛 BUSH_TREE_A 与椰枣棕榈 PALM）
    const isNileOrMesopotamiaOasis = (
        (lat >= 24.0 && lat <= 31.5 && lng >= 29.8 && lng <= 32.6 && (tile === 'ds2' || tile === 'gr2' || tile === 'gr3' || tile === 'des')) ||
        (lat >= 30.0 && lat <= 35.5 && lng >= 43.2 && lng <= 48.5 && (tile === 'ds2' || tile === 'gr2' || tile === 'gr3'))
    ) && (elev === null || elev < 220) && noiseVal >= 0.54;
    if (oasisCityBoost > 0 || isNileOrMesopotamiaOasis) {
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
    const isYinshan = lat >= 40.45 && lat <= 41.45 && lng >= 108.2 && lng <= 112.5 && elev !== null && elev >= 1320 && elev <= 2300;
    const isHelanshan = lat >= 38.3 && lat <= 39.35 && lng >= 105.55 && lng <= 106.4 && (forestBiome === 5 || (elev !== null && elev >= 1450 && elev <= 2900));
    if ((isYinshan || isHelanshan) && tile !== 'pal' && tile !== 'des') {
        const w = 0.42 * clusterFactor;
        return { weight: w, effectiveTile: isYinshan && lng >= 110.2 ? 'gr3' : 'underbrush_leaves' };
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
        if (canopyDensity >= 3 || isLebanon || (isAtlas && (elev === null || elev >= 500))) {
            const w = (0.34 + 0.44 * Math.min(1, canopyDensity / 28)) * clusterFactor;
            const effTile = isLebanon && (elev === null || elev >= 550)
                ? 'rck'
                : (tile === 'ds5' || tile === 'gravel_default' ? 'gr7' : tile);
            return { weight: w, effectiveTile: effTile };
        }
    }
    // 4b. 扎格罗斯山脉、厄尔布尔士山脉与小亚细亚山地栎林/阔叶林（30°~40°N, 30°~56°E）
    if (lat >= 30.0 && lat <= 40.0 && lng >= 30.0 && lng <= 56.0 && (forestBiome === 4 || forestBiome === 5) && tile !== 'pal' && tile !== 'des') {
        if (canopyDensity >= 1 || (elev !== null && elev >= 850 && elev <= 2650)) {
            const w = (0.35 + 0.42 * Math.min(1, canopyDensity / 28)) * clusterFactor;
            const effTile = tile === 'ds5' || tile === 'gravel_default' ? 'gr7' : tile;
            return { weight: w, effectiveTile: effTile };
        }
    }

    // ⑤ 热带/亚热带稀树草原疏林（Savanna：萨赫勒/东非金合欢 ACACIA & 猴面包树 BAOBAB、也门/索科特拉龙血树 DRAGON_TREE、德干高原）
    const isAfricaSavanna = lat >= -24.0 && lat <= 15.8 && lng >= -17.5 && lng <= 51.0;
    const isYemenSocotra = lat >= 12.0 && lat <= 17.8 && lng >= 42.5 && lng <= 55.0;
    const isDeccanSavanna = lat >= 9.5 && lat <= 23.5 && lng >= 72.5 && lng <= 82.5;
    if (
        (isAfricaSavanna || isYemenSocotra || isDeccanSavanna) &&
        (tile === 'gr5' || tile === 'gr7' || tile === 'gr3' || tile === 'ds4' || tile === 'ds2') &&
        noiseVal >= 0.55
    ) {
        // 稀树草原只取噪声峰顶（约 18% 格点）生成 2 棵装疏林簇，82% 面积保持开阔萨凡纳草地
        const w = 0.16 + (noiseVal - 0.55) * 0.28;
        return { weight: w, effectiveTile: 'gr5' };
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
): number {
    if (NON_VEGETATION_TILES.has(tile) || biome === 13) return 0;

    const isForestBiome = RESOLVE_FOREST_BIOMES.has(biome);
    const isForestTile = BASE_FOREST_TILES.has(tile);
    if (!isForestBiome && !isForestTile) return 0;

    // 🔴 解决「有的地方的树是不是太多了」：
    // 1. 真实郁闭度低于 22% 属于开阔农田平原、干草原、平川河谷，坚决不长树；
    //    把平原（汾河谷地、太原盆地、关中平原、华北大平原）彻底还给开阔农田与沃野！
    // 2. 地表材质显式标注森林的（for, fo2, snf），即使 canopy 偏低也给予适当树林呈现；
    // 3. 聚簇门控：连续世界坐标场低于 0.38 的直接留白，高于 0.38 的凝聚成块状/带状自然林海。
    let baseWeight = 0;
    if (isForestTile) {
        const canopy = Math.max(0, Math.min(1, canopyDensity / 100));
        baseWeight = Math.max(0.35, canopy);
    } else if (isForestBiome) {
        if (canopyDensity < 22) return 0; // 开阔平原农田/干旱荒草坚决 0 树木
        const norm = Math.min(1.0, (canopyDensity - 22) / 53);
        baseWeight = 0.20 + 0.60 * norm;
    }

    // 连续噪声场强门控：消除均匀撒点感，塑造有致的林带与山川留白
    if (noiseVal < 0.38) return 0;
    const clusterFactor = Math.pow((noiseVal - 0.38) / 0.62, 1.25);

    return baseWeight * clusterFactor;
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
    if (/PINE|CYPRESS|SNOW_|BAMBOO|CEDAR/i.test(asset)) return 'conifer';
    if (/PALM|ACACIA|BAOBAB|OLIVE|DRAGON_TREE/i.test(asset)) return 'arid';
    if (/DEAD_TREE/i.test(asset)) return 'dead';
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
    if (lng !== undefined && lng >= 75 && lng <= 105 && absLat >= 26 && absLat <= 40) {
        return 4100;
    }
    if (absLat < 30) return 3800;
    if (absLat < 44) return 2600;
    if (absLat < 54) return 2150; // 阿尔卑斯山、欧洲高地
    if (absLat < 64) return 1400;
    return 600;
}

const TREE_GRID_STEP = 46;

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
        // DE 林下柔光底色：仅在成团密林中心轻铺一层温润苔草/落叶底韵，绝不压脏浅色荒原地表
        const colors = [
            'rgba(40, 58, 28, 0.13)', // 春：温润草绿
            'rgba(32, 52, 24, 0.14)', // 夏：深翠林荫
            'rgba(62, 50, 26, 0.13)', // 秋：暖金落叶
            'rgba(46, 52, 42, 0.10)', // 冬：清透微影
        ];
        const color = colors[s];
        const grad = cx.createRadialGradient(32, 18, 2, 32, 18, 30);
        grad.addColorStop(0, color);
        grad.addColorStop(0.50, color);
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
        if (this.terrainReadyTimer !== null) return;
        this.terrainReadyTimer = window.setTimeout(() => {
            this.terrainReadyTimer = null;
            this.lastRenderKey = '';
            this.scheduleRender(0);
        }, 250);
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
        this.resize();
        this.render();
        void loadStrategicForestMask().then((ready) => {
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
                this.paint();
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
        const hScale = TREE_BASE_PX * Math.pow(1.35, zoom - SAMPLE_ZOOM);
        const W = this.canvas.width, H = this.canvas.height;
        const topLeftX = this.canvasTopLeft.x;
        const topLeftY = this.canvasTopLeft.y;

        const items: { x: number; y: number; h: number; c: TreeDrawCommand }[] = [];
        if (LAST_DRAWN_ASSET.size > LAST_DRAWN_MAX) LAST_DRAWN_ASSET.clear();   // 防无限增长
        for (const c of this.trees) {
            // 使用整数 Layer 像素坐标减去整数 canvasTopLeft，保证每棵树在画布上的根部坐标恒为整数，平移重绘零亚像素跳变
            const layerPt = this.map.latLngToLayerPoint([c.lat, c.lng]);
            const x = layerPt.x - topLeftX;
            const y = layerPt.y - topLeftY;
            const h = hScale * c.jitter;
            if (x < -h * 2 || x > W + h * 2 || y < -h * 2 || y > H + h * 2) continue;
            items.push({ x, y, h, c });
        }
        items.sort((a, b) => a.y - b.y || a.x - b.x);

        const drawTreeAsset = (
            asset: string,
            variant: number,
            it: { x: number; y: number; h: number },
            alpha: number,
        ): string | null => {
            if (alpha <= 0.002) return null;
            const meta = TREE_METAS[asset];
            ctx.globalAlpha = alpha * TREE_OPACITY;

            if (meta) {
                const framesImg = treeFramesImage(asset, this.onTreeImageReady);
                // 🔴 若该树种第 0 帧被剔除（如 PINE / SNOW_PINE 的 preview.png 是第 0 帧枯木棍），绝不回退画 preview.png
                const prevImg = meta.frames.includes(0) ? treeImage(asset, this.onTreeImageReady) : null;

                const h = Math.round(it.h);
                const w = Math.round(it.h * (meta.boxW / meta.boxH));
                const dx = it.x - Math.round(w * (meta.anchorX / meta.boxW));
                const dy = it.y - Math.round(h * (meta.anchorY / meta.boxH));

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
            // 兜底：未配置元数据的资产按底部居中对齐
            const im = treeImage(asset, this.onTreeImageReady);
            if (im) {
                const h = Math.round(it.h);
                const w = Math.round(it.h * (im.naturalWidth / im.naturalHeight));
                ctx.drawImage(im, it.x - Math.round(w / 2), it.y - h, w, h);
                return asset;
            }
            return null;
        };

        // 🔴 DE 原生树木精灵（frames.png）自身已内置柔化好的左下角等轴测地面阴影；
        //    不再叠加反向右下角椭圆阴影或暗黑泥印，保持树干根部与翠绿/黄褐地表干净通透融合。
        for (const it of items) {
            /** 树位键（经纬度 5 位小数）：给「上一帧画成的贴图」备忘用，四季之间坐标绝对不变 */
            const posKey = `${Math.round(it.c.lat * 1e5)},${Math.round(it.c.lng * 1e5)}`;

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

    private renderInner(): void {
        if (!this.visible) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }

        const zoom = Math.floor(this.map.getZoom());
        const inRange = zoom >= MIN_ZOOM && zoom <= MAX_ZOOM;
        this.canvas.style.display = inRange ? 'block' : 'none';
        if (!inRange) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.lastRenderKey = ''; return; }

        const size = this.map.getSize();
        const targetW = size.x + CANVAS_PAD_PX * 2;
        const targetH = size.y + CANVAS_PAD_PX * 2;
        if (size.x > 0 && (this.canvas.width !== targetW || this.canvas.height !== targetH)) this.resize();

        const bounds = this.map.getBounds();
        const nw = this.map.project(bounds.getNorthWest(), SAMPLE_ZOOM);
        const se = this.map.project(bounds.getSouthEast(), SAMPLE_ZOOM);
        const xMin = Math.floor((nw.x - CANVAS_PAD_PX) / TREE_GRID_STEP) * TREE_GRID_STEP;
        const xMax = Math.ceil((se.x + CANVAS_PAD_PX) / TREE_GRID_STEP) * TREE_GRID_STEP;
        const yMin = Math.floor((nw.y - CANVAS_PAD_PX) / TREE_GRID_STEP) * TREE_GRID_STEP;
        const yMax = Math.ceil((se.y + CANVAS_PAD_PX) / TREE_GRID_STEP) * TREE_GRID_STEP;

        const gameSeason = currentGameSeason();
        const season = currentTreeSeason();
        const nextSeason = nextTreeSeason(season);

        const key = `${zoom}|${xMin}|${xMax}|${yMin}|${yMax}|${gameSeason}`;
        if (key === this.lastRenderKey) return;
        this.lastRenderKey = key;
        this.lastRenderAt = performance.now();
        // 🔴 [2026-09-18 修消失] 禁止在此处提前 clearRect：旧树必须持续显示在画布上，直到 paint() 原子绘制新树！

        let missingTiles = 0;
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
                return {
                    lat: city.lat,
                    lng: city.lng,
                    wx: wpt.x,
                    wy: wpt.y,
                    isForestHunting: FOREST_HUNTING_STYLES.has(city.buildingStyle ?? ''),
                };
            });

        for (let gy = yMin; gy <= yMax; gy += TREE_GRID_STEP) {
            for (let gx = xMin; gx <= xMax; gx += TREE_GRID_STEP) {
                // 有机微抖动：打破网格机械感
                const px = gx + TREE_GRID_STEP * 0.5 + (hash(gx, gy, 11) - 0.5) * (TREE_GRID_STEP * 0.65);
                const py = gy + TREE_GRID_STEP * 0.5 + (hash(gx, gy, 12) - 0.5) * (TREE_GRID_STEP * 0.65);
                const ptLatLng = this.map.unproject([px, py], SAMPLE_ZOOM);
                if (ptLatLng.lat < -58 || ptLatLng.lat > 75) continue;

                // 据点避让统一在 SAMPLE_ZOOM 世界像素坐标系下计算，彻底杜绝因平移/缩放亚像素取整导致的城周树木闪现
                if (visibleCities.some((c) => Math.hypot(c.wx - px, c.wy - py) < (c.isForestHunting ? 24 : CITY_CLEAR_PX))) continue;

                const water = waterSampler.isWaterSync(ptLatLng.lat, ptLatLng.lng);
                if (water === true) continue;
                if (water === null) {
                    waterSampler.scheduleFetch(ptLatLng.lat, ptLatLng.lng);
                }

                // 检查是否处于渔猎民族据点周围 0.36°（约 40km）林带内
                let huntingCityBoost = 0;
                for (const c of visibleCities) {
                    if (!c.isForestHunting) continue;
                    const dLat = ptLatLng.lat - c.lat;
                    const dLng = ptLatLng.lng - c.lng;
                    const d = Math.hypot(dLat, dLng);
                    if (d < 0.36) {
                        huntingCityBoost = Math.max(huntingCityBoost, 0.52 * (1 - d / 0.45));
                    }
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
                } else if (elev > treeLine || elev < 0 || (water === null && elev <= 0)) {
                    continue;
                }

                // 地表材质与生物群系判定
                const tile = queryBaseTile({ lat: ptLatLng.lat, lng: ptLatLng.lng, isSiege: false, isWinter: false })
                    ?? resolveTerrainTile(ptLatLng.lat, ptLatLng.lng, 0);
                if (NON_VEGETATION_TILES.has(tile)) continue;

                const forestBiome = queryStrategicForestBiome(ptLatLng.lat, ptLatLng.lng);
                if (forestBiome === 13) continue; // 荒漠生态群系坚决不长树

                // elev 可能为 null（上面「低地先放行」那条分支），按低地兜底取值，与该分支意图一致
                if (huntingCityBoost <= 0 && !isStrategicForestArea(forestBiome, tile, elev ?? 250, ptLatLng.lat)) continue;

                // 连续世界坐标密度场：消除椭圆规则感，呈现犬牙交错与山谷林隙
                const noiseVal = forestNoise(ptLatLng.lat, ptLatLng.lng);

                // 真实卫星郁闭度驱动（0~100%）：决定当前格点是否生长树木（渔猎民族据点周围强制拥有树林植被覆盖）
                const canopyDensity = queryStrategicCanopyDensity(ptLatLng.lat, ptLatLng.lng);
                const clusterWeight = Math.max(
                    huntingCityBoost,
                    forestClusterWeight(forestBiome, tile, canopyDensity, noiseVal),
                );
                // 🔴 [2026-10-21 主人问「战略地图上的树该成片，还是该单个？」→ 成片]
                //    原来按 clusterWeight 当概率逐格抽签（hash > weight 就留白）→ 林区里也是稀稀拉拉的孤树，像噪点。
                //    改为按权重定「林区」：权重够高的格子连成片栽（权重是连续场，天然连片），
                //    林缘（权重低）只做软过渡，不再有单棵孤树；林区内部只留少量随机林隙。
                if (clusterWeight < 0.12) continue;
                if (clusterWeight < 0.24 && hash(gx, gy, 46) > (clusterWeight - 0.12) / 0.12) continue;   // 林缘软过渡
                if (clusterWeight >= 0.24 && clusterWeight < 0.40 && hash(gx, gy, 47) > 0.88) continue;   // 林内偶有小林隙

                // 🔴 自然树丛聚簇（Grove Clustering）：一格至少 2 棵（不再有孤树），林区深处 3~4 棵，
                //    主树高大居中 + 伴生树错落环绕，相邻格的树丛连成林海。
                const count = clusterWeight >= 0.40
                    ? (hash(gx, gy, 53) > 0.5 ? 4 : 3)
                    : (clusterWeight >= 0.24 ? 3 : 2);

                for (let i = 0; i < count; i++) {
                    let curPx = px;
                    let curPy = py;
                    if (i > 0) {
                        const baseAng = hash(gx, gy, 31) * Math.PI * 2 + (i - 1) * (Math.PI * 0.72);
                        const ang = baseAng + (hash(gx, gy, i * 17 + 31) - 0.5) * 0.48;
                        const dist = 6 + hash(gx, gy, i * 19 + 32) * 7;
                        curPx += Math.cos(ang) * dist;
                        curPy += Math.sin(ang) * dist * 0.68;
                    }
                    const curLatLng = i === 0 ? ptLatLng : this.map.unproject([curPx, curPy], SAMPLE_ZOOM);

                    // 🔴 严格保护四季系统：春/夏/秋/冬 4 季树种 1:1 动态轮转；
                    //    同时保证「战略冬天与战术冬天 100% 同源一致」：
                    //    1. 在冬季真积雪区（world-base winterFlag ∈ {1, 2, 3} 或高寒雪线林带），松柏与阔叶林全部披挂 DE 饱满覆雪树冠（SNOW_PINE / SNOW_AUTUMN_OAK），消除白雪地上长翠绿树冠或金黄秋橡树的割裂感；
                    //    2. 在冬季无雪区与零星残雪区（winterFlag === 0 或 4），绝不误戴厚白雪冠；
                    //    3. 在战略地图尺度（25px）下，将全秃枯树枝（BIRCH_WINTER / SCENARIO_TREE_I / DEAD_TREE）映射为覆雪/金秋/灌丛饱满树冠，消除像插着一排枯黑铁丝的违和感。
                    const isPermSnowTile = tile === 'sno' || tile === 'sn2' || tile === 'snf' || tile === 'snd' || tile === 'ic3' || tile === 'ice';
                    const wf = queryWinterSnow(curLatLng.lat, curLatLng.lng);
                    const isAlpineWinterSnow = elev !== null && Math.abs(curLatLng.lat) >= 26 && elev >= treeLine - 350;
                    const hasWinterSnowGround = wf === 1 || wf === 2 || wf === 3 || isAlpineWinterSnow;

                    const resolveStrategicTreeForSeason = (s: TreeSeason): string => {
                        const isSnow = isPermSnowTile || (s === 3 && hasWinterSnowGround);
                        // 🔴 传入夏季常态底图 tile 以命中 REGION_TREES 生态分区（保留各地区真实的针叶 vs 落叶阔叶树种比例），
                        //    再按 isSnow 与战术 seasonalDeTree 同一套规则映射为 SNOW_PINE / SNOW_AUTUMN_OAK。
                        const a = pickTree({ baseTile: tile, lat: curLatLng.lat, lng: curLatLng.lng, season: s, isSiege: false });

                        if (a === 'DEAD_TREE') return isSnow ? 'SNOW_PINE' : 'BUSH_TREE_A';

                        if (isSnow) {
                            if (
                                a === 'PINE' ||
                                a === 'ASIAN_PINE' ||
                                a === 'SNOW_PINE' ||
                                a === 'ITALIAN_PINE' ||
                                a === 'CYPRESS' ||
                                a === 'CYPRESS_DEC' ||
                                a === 'MONKEY_PUZZLE' ||
                                a === 'BAMBOO' ||
                                a === 'LUSH_BAMBOO'
                            ) {
                                return 'SNOW_PINE';
                            }
                            if (a === 'BIRCH_WINTER' || a === 'BIRCH_AUTUMN' || a === 'BIRCH_GREEN') {
                                return (Math.abs(curLatLng.lat) > 46 || wf === 2 || (wf === 3 && ((gx + gy + i) & 1) === 0))
                                    ? 'SNOW_PINE'
                                    : 'SNOW_AUTUMN_OAK';
                            }
                            if (
                                a === 'SCENARIO_TREE_I' ||
                                a === 'OAK' ||
                                a === 'GREEN_OAK' ||
                                a === 'AUTUMN_OAK' ||
                                a === 'SNOW_AUTUMN_OAK' ||
                                a === 'ASIAN_MAPLE_GREEN' ||
                                a === 'ASIAN_MAPLE_AUTUMN' ||
                                a === 'PEACH_BLOSSOM' ||
                                a === 'WILLOW' ||
                                a === 'OLIVE' ||
                                a.startsWith('SCENARIO_TREE_')
                            ) {
                                return 'SNOW_AUTUMN_OAK';
                            }
                            return a;
                        }

                        // 非覆雪地面（含春/夏/秋及冬季无雪/零星残雪区）：确保不残留重度白雪冠或枯黑铁丝枝
                        if (a === 'BIRCH_WINTER') return Math.abs(curLatLng.lat) > 46 ? 'ASIAN_PINE' : 'AUTUMN_OAK';
                        if (a === 'SCENARIO_TREE_I' || a === 'SNOW_AUTUMN_OAK') return 'AUTUMN_OAK';
                        if (a === 'SNOW_PINE') return 'ASIAN_PINE';
                        return a;
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

                    // 主树（i===0）挺拔饱满，伴生树（i>0）高低错落拱卫，形成自然树丛轮廓
                    const jitter = count > 1
                        ? (i === 0 ? 1.06 + hash(gx, gy, 71) * 0.22 : 0.76 + hash(gx, gy, i * 23 + 71) * 0.24)
                        : (0.92 + hash(gx, gy, 71) * 0.26);
                    const variant = Math.floor(hash(gx, gy, i * 37 + 89) * 100);
                    drawCommands.push({
                        lat: curLatLng.lat,
                        lng: curLatLng.lng,
                        jitter,
                        asset,
                        assetNext,
                        variant,
                        inGrove: count >= 2 && i === 0,
                    });
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
        const keepOldTrees = drawCommands.length === 0 && this.trees.length > 0 && missingTiles > 0;
        if (!keepOldTrees) this.trees = drawCommands;
        this.sampledGameSeason = gameSeason;
        this.paint();
        drawnTrees = this.trees.length;

        this.lastTreeCount = drawnTrees;
        if (pendingImages > 0) this.lastRenderKey = '';

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
