/**
 * HillshadeWorker.ts
 * Offloads heavy terrain math to a background thread
 */

import { buildWaterMask, isDefectGrayTile } from '../world/land-sea/WaterMask';
import { createTerrainMaterial, getMaterialBytes, type TerrainMaterial, type TerrainRuleTexture } from '../map/StrategicTerrainMaterial';
import type { RiverSegmentsMessage } from '../map/RiverStripData';
import { NILE_ALLUVIAL_POLYGONS, NILE_VALLEY_EXP_BOUNDS, type NileAlluvialPolygon } from '../data/HistoricalRegions';
import {
    applyFourSeasonsToPixelFast,
    applySeasonalGroundToPixel,
    computeSeasonalGroundModulation,
    createSeasonalRowContext,
    updateSeasonalRowContext,
} from '../world/environment/seasonalGround';

interface PreparedNilePolygon extends NileAlluvialPolygon {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

const PREPARED_NILE_POLYGONS: PreparedNilePolygon[] = NILE_ALLUVIAL_POLYGONS.map(poly => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const [pLat, pLng] of poly.points) {
        if (pLat < minLat) minLat = pLat;
        if (pLat > maxLat) maxLat = pLat;
        if (pLng < minLng) minLng = pLng;
        if (pLng > maxLng) maxLng = pLng;
    }
    return {
        ...poly,
        minLat,
        maxLat,
        minLng,
        maxLng
    };
});

function isPointInPolygon(lat: number, lng: number, points: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const yi = points[i][0], xi = points[i][1];
        const yj = points[j][0], xj = points[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function distToPolygonBoundary(lat: number, lng: number, points: [number, number][]): number {
    let minD2 = Infinity;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const ax = points[i][0], ay = points[i][1];
        const bx = points[j][0], by = points[j][1];
        const vx = bx - ax, vy = by - ay;
        const ux = lat - ax, uy = lng - ay;
        const lenSq = vx * vx + vy * vy;
        let t = lenSq > 0 ? (ux * vx + uy * vy) / lenSq : 0;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        const qx = ax + t * vx;
        const qy = ay + t * vy;
        const d2 = (lat - qx) * (lat - qx) + (lng - qy) * (lng - qy);
        if (d2 < minD2) minD2 = d2;
    }
    return Math.sqrt(minD2);
}

/** 水域掩膜取图超时 (ms)；超时即放弃掩膜，绝不拖住山体瓦片出图 */
const WATER_MASK_TIMEOUT_MS = 4000;

const rawDemCache = new Map<string, Float32Array>();
const DEM_CACHE_MAX = 256;
const demPending = new Map<string, Promise<Float32Array | null>>();

function cacheDem(key: string, dem: Float32Array): void {
    rawDemCache.delete(key);
    rawDemCache.set(key, dem);
    while (rawDemCache.size > DEM_CACHE_MAX) rawDemCache.delete(rawDemCache.keys().next().value!);
}

async function fetchDemFloat32(z: number, x: number, y: number): Promise<Float32Array | null> {
    const n = 2 ** z;
    if (y < 0 || y >= n) return null;
    x = ((x % n) + n) % n;
    const key = `${z}/${x}/${y}`;
    const cached = rawDemCache.get(key);
    if (cached) { cacheDem(key, cached); return cached; }
    const pending = demPending.get(key);
    if (pending) return pending;
    const task = loadDemFloat32(z, x, y);
    demPending.set(key, task);
    try { return await task; } finally { demPending.delete(key); }
}

async function loadDemFloat32(z: number, x: number, y: number): Promise<Float32Array | null> {
    const key = `${z}/${x}/${y}`;
    const cached = rawDemCache.get(key);
    if (cached) return cached;

    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
    try {
        // 🔴 [2026-09-30] 超时只重试一次（第二次放宽到 10 秒）。
        //    开局一次派几十块瓦片、每块再取 8 块邻块，网络一挤就有请求撞上 4 秒超时；
        //    缺一块邻块整块瓦片就退回旧版光照，且被图层缓存，地图上留下一块边界笔直的「平」方块
        //    （实测马其顿 zoom 9：953 次请求中断 4 次，对应 4 处方块，scratch/terrain_ab/verify_game.mjs）。
        let resp: Response;
        try {
            resp = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(4000) });
        } catch (err) {
            if ((err as Error)?.name !== 'TimeoutError') throw err;
            resp = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(10000) });
        }
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(256, 256);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { bitmap.close(); return null; }
        ctx.drawImage(bitmap, 0, 0, 256, 256);
        bitmap.close();
        const data = ctx.getImageData(0, 0, 256, 256).data;
        const dem = new Float32Array(256 * 256);
        for (let i = 0, p = 0; p < 256 * 256; i += 4, p++) {
            dem[p] = (data[i] * 256 + data[i + 1] + data[i + 2] * 0.00390625) - 32768;
        }
        if (z > COARSE_Z) {
            await fillSurfaceSea(dem, z, x, y);
        }
        cacheDem(key, dem);
        return dem;
    } catch {
        return null;
    }
}

/**
 * 本瓦片是否存在海平面以下的像素。
 *
 * 掩膜只用来修正「海拔<0 却是陆地」的上色，整块都在海平面以上时它毫无用处。
 * 游戏地图绝大部分是内陆（中原/西域/草原），先做这个判断能让多数瓦片
 * **完全不发** ESRI 请求，避免把晕渲层的网络量翻倍。
 *
 * Terrarium 编码 elev = r*256 + g + b/256 - 32768，故 elev < 0 ⟺ r*256+g+b/256 < 32768。
 * r ≤ 127 时最大值 127*256+255+0.996 < 32768 恒成立；r ≥ 128 时最小值 32768 ⇒ elev ≥ 0。
 * 所以判据精确等价于 **r < 128**，一次比较即可，无需解码。
 */
function hasBelowSeaPixel(data: Uint8ClampedArray, pixelCount: number): boolean {
    for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
        if (data[i] < 128 || (data[i] === 128 && data[i + 1] === 0)) return true;
    }
    return false;
}

/**
 * 内陆湖判据：湖面在高程数据里是完全水平的一片（3×3 邻域 9 个值逐位相等、且在海平面以上）。
 * 🔴 [2026-09-30] 旧版只有「含低于海平面像素」的瓦片才取水体掩膜 → 青海湖、纳木错、贝加尔湖等高原/内陆湖
 *    整片被画成陆地，贝加尔湖只有湖底数据低于海平面的那一块是蓝的，湖面被瓦片边一刀切开。
 *    实测完全水平像素：青海湖 51467、贝加尔 57820、巴尔喀什 43555、纳木错 11225、洞庭湖 2141；
 *    华北平原 36、太行 0、撒哈拉 0、萨赫勒 78、青藏高原面 380、亚马孙 3、西伯利亚平原 629 → 门槛取 1500。
 *    未覆盖：高程数据没压平的小湖（如挪威北部 100m 处的小湖，0 个水平像素），仍只在邻块含海时显示为水。
 */
const LAKE_FLAT_PIXELS = 1500;
function countFlatLandPixels(data: Uint8ClampedArray, w: number, h: number, stopAt: number): number {
    let count = 0;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            if (data[i] < 128) continue;   // 海平面以下不算湖面
            const r = data[i], g = data[i + 1], b = data[i + 2];
            let flat = true;
            for (let dy = -1; dy <= 1 && flat; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const j = i + (dy * w + dx) * 4;
                    if (data[j] !== r || data[j + 1] !== g || data[j + 2] !== b) { flat = false; break; }
                }
            }
            if (flat && ++count >= stopAt) return count;
        }
    }
    return count;
}

// Define message types
export interface HillshadeRegion {
    center: [number, number];   // [lat, lng]
    radii: [number, number];    // [latDeg, lngDeg]
    color: [number, number, number];
    blendStrength: number;
    elevMin: number;
    elevMax: number;
}

export interface HillshadeRequest {
    id: number;
    /** 高程瓦片 URL：由 Worker 自己 fetch + 解码，主线程全程不碰像素 */
    url: string;
    /**
     * 水域掩膜瓦片 URL（ESRI 晕渲底图，同一 z/x/y）。
     * 用途：高程 < 0 但实际是陆地的地方（里海低地、吐鲁番盆地）不再涂成海洋色。
     * 取不到时按 null 处理，颜色退回纯高程判据——不阻塞出图。
     */
    waterMaskUrl?: string;
    width: number;
    height: number;
    params: {
        azimuth: number;
        altitude: number;
        zFactor: number;
        opacity: number;
        useElevationColor: boolean;
    };
    // [NEW] Tile bounds for per-pixel lat/lng calculation
    tileBounds?: {
        north: number;
        south: number;
        west: number;
        east: number;
    };
    // [NEW] Historical regions to apply (sand, wetland, etc.)
    regions?: HillshadeRegion[];
    coords?: { z: number; x: number; y: number };
    experimentalRelief?: boolean;
    valleyReliefExp?: boolean;
    /** 7 层高地试验（DE 台地光照），只在浮雕瓦片上生效 */
    terraceExp?: boolean;
    /** 文明6风格暖金斜阳+冷蓝幽谷+高饱和色温试验 */
    civ6LightExp?: boolean;
    modeVersion?: number;
}

export interface HillshadeResponse {
    id: number;
    materialBytes?: number;
    renderMs?: number;
    /** 算好的瓦片位图（日历春季 0；transferable）；主线程只需 drawImage，零像素拷贝 */
    bitmap?: ImageBitmap;
    /** 算好的日历夏季(1)瓦片位图（含夏草苍翠、地中海夏干焦黄、热带雨季返青、南半球冬雪与冬枯） */
    summerBitmap?: ImageBitmap;
    /** 算好的日历秋季(2)瓦片位图（含温带/北方草原秋草金黄、南半球春芽嫩绿） */
    autumnBitmap?: ImageBitmap;
    /** 算好的日历冬季(3)瓦片位图（含北半球冬雪冰封、无雪温带冬枯霜褐、地中海冬润返青、热带旱季枯黄、南半球盛夏） */
    winterBitmap?: ImageBitmap;
    /** 是否为粗高程插值生成的远景临时兜底瓦片（主线程可先上屏消除异色与硬边，随后后台重拉高清替换） */
    isCoarseFallback?: boolean;
    /** 取图/解码失败：主线程平涂兜底色 */
    error?: string;
}

// Pre-allocate LUTs in Worker Scope
let colorLUT: Uint8ClampedArray | null = null;
let noiseLUT: Float32Array | null = null;
const LUT_OFFSET = 500;
const LUT_MAX_ELEV = 9000;

// Initialize LUTs (Copy logic from HillshadeLayer)
function initLUTs() {
    if (colorLUT) return;

    // --- Color LUT ---
    const range = LUT_OFFSET + LUT_MAX_ELEV;
    const lut = new Uint8ClampedArray(range * 3);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpColor = (c1: number[], c2: number[], t: number, out: any, offset: number) => {
        out[offset] = lerp(c1[0], c2[0], t);
        out[offset + 1] = lerp(c1[1], c2[1], t);
        out[offset + 2] = lerp(c1[2], c2[2], t);
    };

    // [OCEAN-REV2] 6 段海洋色阶,潮间带收敛,避免大片浅水发白
    const abyss = [18, 38, 75];             // < -4000m 深渊靛蓝(南海深处)
    const deepOcean = [35, 65, 100];        // -1500m 深海(过渡终点)
    const shelfBlue = [70, 110, 140];       // -300m 大陆坡
    const shallowCyan = [105, 160, 185];    // -30m 大陆架(渤海/黄海主体)
    const shoalCyan = [140, 185, 200];      // -5m 近岸浅水
    const coastalFoam = [180, 200, 200];    // 0m 潮间带(降低亮度,避免白带)
    // [TERRAIN-COLOR-REV2] 参照 Map Library "Vegetation-Based" + EU4 + QGIS 专业制图色阶
    // 低地绿对标 sage green RGB(143,188,143) 16% 饱和,而非"草坪绿"
    const coastalSand = [165, 180, 150];    // 海岸冲积低饱和绿 (16%饱和)
    const lowlandPale = [150, 178, 135];    // 0-400m sage 平原绿 (对标 Map Library)
    const lowlandEnd = [130, 160, 115];     // 400m 锚点林地深绿 (22%饱和)
    // 🔴 [2026-09-30 主人令「全面修复」地形呈现] 中高山段重排：
    //    旧色阶 1000~4400m 亮度只在 167~181 之间来回（1300m 与 2500m 几乎同色），山脚到山顶看不出层次。
    //    现在色相单向推进：平原绿 → 橄榄 → 卡其 → 黄褐 → 褐（亚高山）→ 高原面浅驼 → 碎屑坡赭 → 冰碛灰。
    //    3800m 起高原面回亮是有意的：青藏高原面广阔平坦，不能整片压成深褐。
    // 🔴 [2026-10-01 主人令「增加地形层次，用 DE 素材，考虑世界范围」] 1000~3200m 四个锚点的色相与明度拉开：
    //    黄绿（山麓）→ 赭黄（中山）→ 橙褐（中高山）→ 深褐（亚高山），平原（≤400m）与 3800m 以上高原锚点一字不动；
    //    这条色阶是全球统一的，改的是色相走向，不挑地区。
    const oliveFoot = [165, 172, 118];      // ~1000m 山麓黄绿（低山林地到草坡）
    const khakiUpland = [186, 168, 122];     // ~1600m 中山温润亚麻驼黄（去除刺眼姜黄，保留干旱高原沉稳真实质感）
    const tanMontane = [176, 142, 104];      // ~2400m 中高山温润赭褐
    const brownSubalpine = [148, 122, 96];   // ~3200m 亚高山深褐（林线附近）
    const plateauSteppe = [178, 160, 122];  // ~3800m 高原面草场浅驼（拉萨河谷/纳木错）
    const highlandPlains = [172, 154, 122]; // ~4400m 高原草原驼色
    const highlandDesert = [162, 148, 126]; // ~4900m 高寒荒漠碎屑坡暖赭
    const subnivalRock = [150, 142, 132];   // ~5300m 亚高山风化岩
    const moraineGrey = [135, 130, 126];    // ~5600m+ 冰碛岩基底(由动态雪线覆盖白雪)

    for (let i = 0; i < range; i++) {
        const elev = i - LUT_OFFSET;
        const offset = i * 3;
        // [OCEAN-REV2] 6 段海洋色阶,潮间带收敛到 -3~0m
        if (elev < -4000) { lut[offset] = abyss[0]; lut[offset + 1] = abyss[1]; lut[offset + 2] = abyss[2]; }
        else if (elev < -1500) lerpColor(abyss, deepOcean, (elev + 4000) / 2500, lut, offset);
        else if (elev < -300) lerpColor(deepOcean, shelfBlue, (elev + 1500) / 1200, lut, offset);
        else if (elev < -30) lerpColor(shelfBlue, shallowCyan, (elev + 300) / 270, lut, offset);
        else if (elev < -3) lerpColor(shallowCyan, shoalCyan, (elev + 30) / 27, lut, offset);
        else if (elev < 0) lerpColor(shoalCyan, coastalSand, (elev + 3) / 3, lut, offset);
        else if (elev < 20) lerpColor(coastalSand, lowlandPale, elev / 20, lut, offset);
        else if (elev < 400) lerpColor(lowlandPale, lowlandEnd, (elev - 20) / 380, lut, offset);
        else if (elev < 1000) lerpColor(lowlandEnd, oliveFoot, (elev - 400) / 600, lut, offset);
        else if (elev < 1600) lerpColor(oliveFoot, khakiUpland, (elev - 1000) / 600, lut, offset);
        else if (elev < 2400) lerpColor(khakiUpland, tanMontane, (elev - 1600) / 800, lut, offset);
        else if (elev < 3200) lerpColor(tanMontane, brownSubalpine, (elev - 2400) / 800, lut, offset);
        else if (elev < 3800) lerpColor(brownSubalpine, plateauSteppe, (elev - 3200) / 600, lut, offset);
        else if (elev < 4400) lerpColor(plateauSteppe, highlandPlains, (elev - 3800) / 600, lut, offset);
        else if (elev < 4900) lerpColor(highlandPlains, highlandDesert, (elev - 4400) / 500, lut, offset);
        else if (elev < 5300) lerpColor(highlandDesert, subnivalRock, (elev - 4900) / 400, lut, offset);
        else if (elev < 5600) lerpColor(subnivalRock, moraineGrey, (elev - 5300) / 300, lut, offset);
        else { lut[offset] = moraineGrey[0]; lut[offset + 1] = moraineGrey[1]; lut[offset + 2] = moraineGrey[2]; }
    }
    colorLUT = lut;

    // --- Noise LUT ---
    const size = 256;
    const nLut = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const hash = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
            const noise = (hash - Math.floor(hash) - 0.5) * 4.0;
            nLut[y * size + x] = noise;
        }
    }
    noiseLUT = nLut;
}

/**
 * 高程像素 → 山体着色像素（纯计算，不碰 IO）。
 * 返回类型显式带 ArrayBuffer：ImageData 构造签名要求 Uint8ClampedArray<ArrayBuffer>，
 * 写成裸 Uint8ClampedArray 会退化成 ArrayBufferLike（含 SharedArrayBuffer）而对不上。
 */
/**
 * 低于海平面、但实际是陆地的地方，按这个高度取色（米）。
 * 里海低地 -17~-27m、吐鲁番盆地 -50~-154m 都属此类：它们是平坦的草原/戈壁盆地，
 * 取低地平原色最贴近实况。地形起伏仍由光照阴影体现，不会变成一块死板平涂。
 */
const LAND_BELOW_SEA_COLOR_ELEV = 10;


/**
 * 🔴 [2026-09-30 主人令「先修下层」] 高程数据在海上是拼起来的：缩放 9 有些瓦片给的是**水面高度**而不是水深 ——
 *    塞浦路斯以东、亚得里亚海整块写 0 米，里海中部整块写 -29 米（里海水面），旁边瓦片却是 -500~-780 米真实水深
 *    （实测 scratch 对比：里海缩放 9 与缩放 6 水深差中位 284 米；塞浦路斯以东 118 个海点 42 个是 0 米）。
 *    一块平一块深，交界成直角「悬崖」，颜色和海底光影都画成方块。
 *    做法：在算颜色与光影**之前**，把这类「水面高度」像素用缩放 6 的真实水深（双线性，跨 z6 瓦片连续）填回去，
 *    高程本身连续了，颜色和光影都不再出方块。判据：值是 0 米（或里海一带的 -29 米），且粗一级水深明显更深（深 15 米以上）
 *    —— 真正的 0 米海岸陆地、-28 米里海低地，粗一级不会比它深 15 米，不受影响。缩放 6 在没毛病的海域与缩放 9 只差 1~15 米。
 */
const COARSE_Z = 6;
const CASPIAN_BOX = { south: 36.5, north: 47.3, west: 46.4, east: 55.6 };
function tileLatLngBox(z: number, x: number, y: number) {
    const n = 2 ** z;
    const lat = (yy: number) => { const k = Math.PI - 2 * Math.PI * yy / n; return 180 / Math.PI * Math.atan(0.5 * (Math.exp(k) - Math.exp(-k))); };
    return { west: x / n * 360 - 180, east: (x + 1) / n * 360 - 180, north: lat(y), south: lat(y + 1) };
}
function touchesCaspian(z: number, x: number, y: number): boolean {
    const b = tileLatLngBox(z, x, y);
    return !(b.east < CASPIAN_BOX.west || b.west > CASPIAN_BOX.east || b.north < CASPIAN_BOX.south || b.south > CASPIAN_BOX.north);
}
function isSurfaceValue(v: number, caspian: boolean): boolean {
    return Math.abs(v) < 0.5 || (caspian && Math.abs(v + 29) <= 0.8);
}
/** 就地修补一块 256×256 高程（Float32，米）：水面高度像素换成缩放 6 的真实水深。返回是否改动过。 */
async function fillSurfaceSea(dem: Float32Array, z: number, x: number, y: number): Promise<boolean> {
    if (z <= COARSE_Z) return false;
    const caspian = touchesCaspian(z, x, y);
    let any = false;
    for (let i = 0; i < dem.length; i++) if (isSurfaceValue(dem[i], caspian)) { any = true; break; }
    if (!any) return false;
    const s = 2 ** (z - COARSE_Z);
    const cx0 = Math.floor(x / s), cy0 = Math.floor(y / s);
    const ixMin = Math.floor(((x * 256 + 0.5) / s) - 0.5);
    const ixMax = Math.floor(((x * 256 + 255.5) / s) - 0.5) + 1;
    const iyMin = Math.floor(((y * 256 + 0.5) / s) - 0.5);
    const iyMax = Math.floor(((y * 256 + 255.5) / s) - 0.5) + 1;
    const txMin = Math.floor(ixMin / 256) - cx0, txMax = Math.floor(ixMax / 256) - cx0;
    const tyMin = Math.floor(iyMin / 256) - cy0, tyMax = Math.floor(iyMax / 256) - cy0;
    const coarse = new Map<string, Float32Array | null>();
    const tasks: Promise<void>[] = [];
    for (let dy = tyMin; dy <= tyMax; dy++) {
        for (let dx = txMin; dx <= txMax; dx++) {
            tasks.push(fetchDemFloat32(COARSE_Z, cx0 + dx, cy0 + dy).then(d => { coarse.set(`${dx}/${dy}`, d); }));
        }
    }
    await Promise.all(tasks);
    if (!coarse.get('0/0')) return false;
    const at = (gx: number, gy: number): number | null => {
        const tx = Math.floor(gx / 256) - cx0, ty = Math.floor(gy / 256) - cy0;
        const t = coarse.get(`${tx}/${ty}`);
        if (!t) return null;
        return t[(((gy % 256) + 256) % 256) * 256 + (((gx % 256) + 256) % 256)];
    };
    let changed = false;
    for (let py = 0; py < 256; py++) for (let px = 0; px < 256; px++) {
        const i = py * 256 + px;
        const v = dem[i];
        if (!isSurfaceValue(v, caspian)) continue;
        // 本像素中心在缩放 6 全局像素坐标里的位置（取像素中心，双线性）
        const fx = ((x * 256 + px + 0.5) / s) - 0.5, fy = ((y * 256 + py + 0.5) / s) - 0.5;
        const ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
        const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
        if (a === null || b === null || c === null || d === null) continue;
        const cz = (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay;
        if (cz < v - 15) { dem[i] = cz; changed = true; }
    }
    return changed;
}
/** 把 Float32 高程写回 Terrarium 编码（R*256+G+B/256-32768） */
function writeTerrarium(src: Uint8ClampedArray, dem: Float32Array): void {
    for (let i = 0; i < dem.length; i++) {
        const v = dem[i] + 32768;
        const r = Math.floor(v / 256), g = Math.floor(v - r * 256), b = Math.round((v - r * 256 - g) * 256);
        src[i * 4] = r; src[i * 4 + 1] = g; src[i * 4 + 2] = Math.min(255, b);
    }
}

/**
 * 当目标高清高程瓦片 (z, x, y) 因网络拥塞超时未取到时，从已缓存的父级瓦片或 COARSE_Z(6) 全球粗高程
 * 双线性插值合成 256×256 高程（不污染 rawDemCache），用于先渲染同色系朦胧远景地形，彻底消除空白硬边。
 */
async function synthesizeDemFromCoarser(z: number, x: number, y: number): Promise<Float32Array | null> {
    if (z <= COARSE_Z) return null;
    const n = 2 ** z;
    if (y < 0 || y >= n) return null;
    const normX = ((x % n) + n) % n;

    let ancZ = -1;
    let ancDem: Float32Array | null = null;
    // 1. 优先查内存中已有的最近父级瓦片 (z-1 .. COARSE_Z)
    for (let tryZ = z - 1; tryZ >= COARSE_Z; tryZ--) {
        const s = 2 ** (z - tryZ);
        const ax = Math.floor(normX / s);
        const ay = Math.floor(y / s);
        const hit = rawDemCache.get(`${tryZ}/${ax}/${ay}`);
        if (hit) {
            ancZ = tryZ;
            ancDem = hit;
            break;
        }
    }
    // 2. 若内存无父级，则拉取 COARSE_Z(6) 粗高程（1 块覆盖 z=9 的 64 块瓦片，极易命中且体积小）
    if (!ancDem) {
        const s = 2 ** (z - COARSE_Z);
        const ax = Math.floor(normX / s);
        const ay = Math.floor(y / s);
        ancDem = await fetchDemFloat32(COARSE_Z, ax, ay);
        if (ancDem) ancZ = COARSE_Z;
    }
    if (!ancDem || ancZ < 0) return null;

    const s = 2 ** (z - ancZ);
    const ancOriginX = Math.floor(normX / s) * 256;
    const ancOriginY = Math.floor(y / s) * 256;
    const out = new Float32Array(256 * 256);

    for (let py = 0; py < 256; py++) {
        const fy = Math.max(0, Math.min(255, ((y * 256 + py + 0.5) / s) - 0.5 - ancOriginY));
        const iy = Math.min(254, Math.floor(fy));
        const ay = fy - iy;
        const row0 = iy * 256;
        const row1 = (iy + 1) * 256;
        for (let px = 0; px < 256; px++) {
            const fx = Math.max(0, Math.min(255, ((normX * 256 + px + 0.5) / s) - 0.5 - ancOriginX));
            const ix = Math.min(254, Math.floor(fx));
            const ax = fx - ix;
            const a = ancDem[row0 + ix];
            const b = ancDem[row0 + ix + 1];
            const c = ancDem[row1 + ix];
            const d = ancDem[row1 + ix + 1];
            out[py * 256 + px] = (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay;
        }
    }
    return out;
}

// 🔴 [2026-10-21] 3 → 12：7 层高地试验的坡带（模糊半径 3）与台地投影（最长 8px）都要跨瓦片取样，
//    外扩不够会在瓦片边缘断开。内部像素取值不变（原有算法只用到 ±3）。
const PAD = 12;
const PAD_W = 256 + 2 * PAD;

async function getPaddedDem(src: Uint8ClampedArray, coords: { z: number; x: number; y: number }, centerDem?: Float32Array, skipNetworkNeighbors: boolean = false): Promise<Float32Array | null> {
    let center = centerDem;
    if (!center) {
        center = new Float32Array(256 * 256);
        for (let i = 0; i < center.length; i++) center[i] = src[i * 4] * 256 + src[i * 4 + 1] + src[i * 4 + 2] / 256 - 32768;
        const n = 2 ** coords.z;
        cacheDem(`${coords.z}/${((coords.x % n) + n) % n}/${coords.y}`, center);
    }
    const tiles = new Map<string, Float32Array>([['0/0', center]]);
    if (!skipNetworkNeighbors) {
        await Promise.all([-1, 0, 1].flatMap(dy => [-1, 0, 1].filter(dx => dx !== 0 || dy !== 0).map(async dx => {
            const dem = await fetchDemFloat32(coords.z, coords.x + dx, coords.y + dy);
            if (dem) tiles.set(`${dx}/${dy}`, dem);
        })));
    }
    // 即使个别邻块网络超时，内部 250×250 像素仍用本瓦片真实高程走 3D 浮雕光照（缺失邻块仅在外扩 3px 处钳制本瓦片边缘），彻底消除 256×256 方块断层。
    const padded = new Float32Array(PAD_W * PAD_W);
    for (let y = -PAD; y < 256 + PAD; y++) for (let x = -PAD; x < 256 + PAD; x++) {
        const dx = Math.floor(x / 256), dy = Math.floor(y / 256);
        const tile = tiles.get(`${dx}/${dy}`);
        if (tile) {
            padded[(y + PAD) * PAD_W + x + PAD] = tile[((y + 256) % 256) * 256 + (x + 256) % 256];
        } else {
            const cx = Math.max(0, Math.min(255, x));
            const cy = Math.max(0, Math.min(255, y));
            padded[(y + PAD) * PAD_W + x + PAD] = center[cy * 256 + cx];
        }
    }
    return padded;
}

/**
 * 本瓦片会触发哪些地形规则 → 只加载那几类贴图。每条判定都比渲染里的规则更宽，宁多勿漏：
 * 缺了某张贴图，渲染里那条规则会静默跳过，画面就少一块。
 */
function pickRuleTextures(src: Uint8ClampedArray, mayHaveWater: boolean, req: HillshadeRequest): TerrainRuleTexture[] {
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < src.length; i += 4) {
        const z = src[i] * 256 + src[i + 1] + src[i + 2] / 256 - 32768;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    }
    const hasWater = mayHaveWater;
    const b = req.tileBounds;
    const latMaxAbs = b ? Math.max(Math.abs(b.north), Math.abs(b.south)) : 90;
    const latMinAbs = b ? (b.north * b.south <= 0 ? 0 : Math.min(Math.abs(b.north), Math.abs(b.south))) : 0;
    const out: TerrainRuleTexture[] = [];
    if (maxZ - minZ > 25 || maxZ > 900) out.push('rck', 'rock_wet');          // 坡面岩石与高山裸岩
    if (maxZ > 800) out.push('gr4', 'ds5');                                   // 山地与高山草甸/碎屑坡
    if (latMinAbs < 52) out.push('des', 'pm2');                               // 沙漠（全球沙漠都在 52° 以内）
    if (latMinAbs < 24) out.push('pc1', 'pc2');                               // 热带稀树草原
    if (latMinAbs < 52) out.push('gr2', 'grs');                               // 沙漠中的河流绿带（干旱带都在 52° 以内）
    if (hasWater) out.push('wt2', 'wt4', 'wt3', 'wt5', 'sha', 'bch', 'bc2', 'gravel_wet'); // 海水、浅礁、海岸
    if (hasWater && (latMaxAbs > 32 || maxZ > 1200)) out.push('ice', 'ic2');   // 海冰与冬季冰封河湖
    // 积雪：雪线最低的情形（该瓦片最高纬、不计任何抬升）再放宽 550m，或温寒带冬季降雪区（纬度 > 26°）
    const lowestSnowline = snowlineAt(latMaxAbs, b ? (b.west + b.east) * 0.5 : 0);
    if (maxZ > lowestSnowline - 550 || latMaxAbs > 26) out.push('sno', 'sn2', 'snf', 'snd');
    return out;
}

/**
 * 🔴 [2026-09-30 主人令] 沙漠中的河流绿带：两河流域、印度河、尼罗河、阿姆河……古代最重要的灌溉农业带，
 *    气候分区图每格约 18km，这些十几到几十公里宽的河谷塞不进一格，原来整片按周围沙漠上色（巴比伦、帕塔拉像沙丘）。
 *    线段由主线程从战略地图的河流数据抽稀后发来（口径见 src/map/RiverStripData.ts）。只在干旱区铺（见渲染里的 aridity 门槛），湿润区不受影响。
 */
const RIVER_CELL_DEG = 1;
let riverSegs: Float32Array | null = null;          // [lng1, lat1, lng2, lat2, 半宽km] × N（主线程抽稀好发来）
let riverCells: Map<string, number[]> | null = null;
let resolveRivers: (ok: boolean) => void = () => { };
const riversReady = new Promise<boolean>(resolve => { resolveRivers = resolve; });

/** 主线程发来河流线段：建 1° 格索引 */
function setRiverSegments(segs: Float32Array | null): void {
    if (!segs) { resolveRivers(false); return; }
    const cells = new Map<string, number[]>();
    for (let i = 0; i < segs.length; i += 5) {
        const pad = segs[i + 4] / 111.32;
        const x0 = Math.floor((Math.min(segs[i], segs[i + 2]) - pad * 2) / RIVER_CELL_DEG), x1 = Math.floor((Math.max(segs[i], segs[i + 2]) + pad * 2) / RIVER_CELL_DEG);
        const y0 = Math.floor((Math.min(segs[i + 1], segs[i + 3]) - pad) / RIVER_CELL_DEG), y1 = Math.floor((Math.max(segs[i + 1], segs[i + 3]) + pad) / RIVER_CELL_DEG);
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
            const k = cx + ',' + cy;
            let list = cells.get(k);
            if (!list) { list = []; cells.set(k, list); }
            list.push(i);
        }
    }
    riverSegs = segs; riverCells = cells;
    resolveRivers(true);
}

/** 干旱瓦片等河流数据：主线程启动时就在加载，通常早已送达；最多等 10 秒，超时这块不画绿带 */
function waitRivers(): Promise<boolean> {
    if (riverSegs) return Promise.resolve(true);
    return Promise.race([riversReady, new Promise<boolean>(resolve => setTimeout(() => resolve(false), 10000))]);
}

/** 平滑值噪声（经纬度，约 0.12° 一格），给河流绿带宽窄变化用；全局坐标 → 跨瓦片连续 */
function riverWidthNoise(lng: number, lat: number): number {
    const x = lng / 0.12, y = lat / 0.12;
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const h = (a: number, b: number) => {
        let v = Math.imul(a, 374761393) ^ Math.imul(b, 668265263);
        v = Math.imul(v ^ (v >>> 13), 1274126177);
        return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
    };
    const top = h(ix, iy) * (1 - sx) + h(ix + 1, iy) * sx;
    const bottom = h(ix, iy + 1) * (1 - sx) + h(ix + 1, iy + 1) * sx;
    return top * (1 - sy) + bottom * sy;
}

function computeRiverStrip(bounds: { north: number; south: number; west: number; east: number }, width: number, height: number): Float32Array | null {
    const segs = riverSegs, cells = riverCells;
    if (!segs || !cells) return null;
    // 候选线段：瓦片范围按最宽绿带（13km × 1.3 倍噪声）外扩后与线段外包框相交的才算
    const padLat = 13 * 1.3 / 111.32;
    const padLng = padLat / Math.max(0.2, Math.cos(Math.max(Math.abs(bounds.north), Math.abs(bounds.south)) * Math.PI / 180));
    const west = bounds.west - padLng, east = bounds.east + padLng, south = bounds.south - padLat, north = bounds.north + padLat;
    const cand = new Set<number>();
    for (let cy = Math.floor(south / RIVER_CELL_DEG); cy <= Math.floor(north / RIVER_CELL_DEG); cy++) {
        for (let cx = Math.floor(west / RIVER_CELL_DEG); cx <= Math.floor(east / RIVER_CELL_DEG); cx++) {
            const list = cells.get(cx + ',' + cy);
            if (!list) continue;
            for (const i of list) {
                if (Math.max(segs[i], segs[i + 2]) < west || Math.min(segs[i], segs[i + 2]) > east) continue;
                if (Math.max(segs[i + 1], segs[i + 3]) < south || Math.min(segs[i + 1], segs[i + 3]) > north) continue;
                cand.add(i);
            }
        }
    }
    if (cand.size === 0) return null;
    const idx = [...cand];
    const STEP = 8, cols = Math.floor(width / STEP) + 1, rows = Math.floor(height / STEP) + 1;
    const node = new Float32Array(cols * rows);
    const northY = Math.asinh(Math.tan(bounds.north * Math.PI / 180));
    const southY = Math.asinh(Math.tan(bounds.south * Math.PI / 180));
    let any = false;
    const rowIdx: number[] = [];
    for (let j = 0; j < rows; j++) {
        const lat = Math.atan(Math.sinh(northY + (southY - northY) * j * STEP / height)) * 180 / Math.PI;
        const kx = Math.cos(lat * Math.PI / 180) * 111.32, ky = 111.32;
        // 这一行只和纬度上够得着的线段比（每行约省掉 2/3）
        rowIdx.length = 0;
        for (const k of idx) {
            if (Math.max(segs[k + 1], segs[k + 3]) >= lat - padLat && Math.min(segs[k + 1], segs[k + 3]) <= lat + padLat) rowIdx.push(k);
        }
        if (rowIdx.length === 0) continue;
        for (let i = 0; i < cols; i++) {
            const lng = bounds.west + (bounds.east - bounds.west) * i * STEP / width;
            let best = Infinity;
            for (const k of rowIdx) {
                const ax = (segs[k] - lng) * kx, ay = (segs[k + 1] - lat) * ky;
                const bx = (segs[k + 2] - lng) * kx, by = (segs[k + 3] - lat) * ky;
                const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
                const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
                const d = Math.hypot(ax + dx * t, ay + dy * t) / segs[k + 4];
                if (d < best) { best = d; if (best < 0.25) break; }   // 已深在绿带里（噪声最窄 0.7 倍也满幅），不必再比
            }
            // 宽度随地理低频噪声起伏（0.7~1.3 倍，约 13km 一格）：等宽的绿带像画上去的公路，自然河谷绿洲宽窄不一
            best /= 0.7 + 0.6 * riverWidthNoise(lng, lat);
            let v = 0;
            if (best <= 0.4) v = 1;
            else if (best < 1) { const t = (1 - best) / 0.6; v = t * t * (3 - 2 * t); }
            node[j * cols + i] = v;
            if (v > 0) any = true;
        }
    }
    if (!any) return null;
    const out = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        const gy = Math.min(rows - 2, Math.floor(y / STEP)), fy = (y - gy * STEP) / STEP;
        for (let x = 0; x < width; x++) {
            const gx = Math.min(cols - 2, Math.floor(x / STEP)), fx = (x - gx * STEP) / STEP;
            const n = gy * cols + gx;
            out[y * width + x] = (node[n] * (1 - fx) + node[n + 1] * fx) * (1 - fy) + (node[n + cols] * (1 - fx) + node[n + cols + 1] * fx) * fy;
        }
    }
    return out;
}

const TX = new Float64Array(3);
const SEASON_RGB12 = new Float64Array(12);
const WINTER_OUT5 = new Float64Array(5);
const SEASON_ROW_CTX = createSeasonalRowContext();
// 5 层平原值噪声（nBig, nA, nB, nC, nD）的 X 轴预计算表（按列 x=0..255 只算一次，整块瓦片 256 行复用）
const WN_IX0 = new Int32Array(256), WN_UX0 = new Float64Array(256);
const WN_IX1 = new Int32Array(256), WN_UX1 = new Float64Array(256);
const WN_IX2 = new Int32Array(256), WN_UX2 = new Float64Array(256);
const WN_IX3 = new Int32Array(256), WN_UX3 = new Float64Array(256);
const WN_IX4 = new Int32Array(256), WN_UX4 = new Float64Array(256);

const rampWorker = (v: number, a: number, b: number) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/**
 * 🔴 2026-10-21 主人令「这片区域需要美化」——战略地图**地表纹理**试点（只做中原，不铺任何道具）。
 *
 * 病根（读代码确认）：战略图的地表色 = 海拔色阶 + 气候/规则贴图（SANCAI_TERRAIN 缩到 128px 再拉大）
 *   + 晕渲。平原坡度和曲率都接近 0 → reliefWeight ≈ 0（没有晕渲细节），
 *   128px 贴图在 Z9 一屏（约 0.7°）里被放大成低频色块 → 整片平原就是一张平涂的绿纸。
 *
 * 做法：在**低起伏农耕地**上按**世界坐标**叠一层纯函数噪声（跨瓦片天然无缝、不随镜头跳动）：
 *   ① 大块干湿摆动（约 0.5° 格）——同一天空下一片偏干草黄、一片偏湿润青绿，破掉「一块绿」；
 *   ② 草土肌理（0.18° / 0.06° / 0.016° 三层平滑噪声）——只有斑驳、没有格子边；
 *   ③ 少数休耕裸土斑（平滑阈值软边）。
 * 🔴 2026-10-21 主人反馈「一堆马赛克」：原先用旋转方格取整给田块上色，方格边就是马赛克，
 *   已整段删除，改为纯平滑值噪声；不再有任何「块边界」。
 * 幅度控制在 ±10% 以内，压在 albedo 上（后面照旧乘 shadeFactor），不动海拔色阶、不动山区。
 * 沙漠/干草原/沙地/坡地/高原台地一律不铺（用 aridity / sandiness / slopeGrad / 海拔门控）。
 */

/** 整数格 → [0,1)，纯函数：同一个世界坐标永远同一个值（跨瓦片、跨缩放一致） */
function worldHash(ix: number, iy: number): number {
    let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 值噪声（双线性 + smoothstep）；x/y 的单位是「格」，不是经纬度 */
function worldNoise(x: number, y: number): number {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = worldHash(ix, iy), b = worldHash(ix + 1, iy);
    const c = worldHash(ix, iy + 1), d = worldHash(ix + 1, iy + 1);
    const ab = a + (b - a) * ux, cd = c + (d - c) * ux;
    return ab + (cd - ab) * uy;
}


/** 掩膜向外扩 R 像素（先横后竖两遍滑窗，O(n)） */
/**
 * 🔴 [2026-10-21 主人令「在战略地图试做 7 层高地」] 照搬战术模式（Scene13GroundLayerGL）的 DE 台地做法：
 *    真实海拔分 0~7 共 8 档 → DE clean_elevation 填窄沟/削尖脊 → 档内平顶、档间一圈坡带四面受光
 *    （向阳 +28% / 背阳 -31% / 侧坡 -10%，台面每档 +2.2% 封顶 7%）＋坡面土石色＋坡脚暗影。
 *    战略地图是俯视、顶点抬不起来，另加「高一档的台地往背光方向投影」补立体感（每档 2.5px，最长 8px）。
 *    全部按绝对海拔和对称/双缓冲运算，结果与瓦片位置无关，跨瓦片无缝。
 */
const TERRACE_THRESHOLDS = [200, 500, 1000, 1500, 2000, 3000, 4500];
const TERRACE_BLUR_R = 3;
const TERRACE_SHADOW_PX_PER_LEVEL = 2.5;
const TERRACE_SHADOW_MAX = 8;

interface TerraceField {
    /** DE 坡面光照倍率（含台面提亮） */
    light: Float32Array;
    /** 坡面权重 0~1（混土石色用） */
    slope: Float32Array;
    /** 坡脚暗影 0~1 */
    foot: Float32Array;
    /** 台地投影倍率（1 = 无投影） */
    shadow: Float32Array;
}

function computeTerrace(pd: Float32Array, azimuthDeg: number): TerraceField {
    const W = PAD_W, N = W * W;
    // 1. 3×3 均值去掉 DEM 噪点，再按绝对海拔分档
    const lev = new Int8Array(N);
    for (let y = 0; y < W; y++) {
        for (let x = 0; x < W; x++) {
            let sum = 0, cnt = 0;
            for (let dy = -1; dy <= 1; dy++) {
                const yy = y + dy;
                if (yy < 0 || yy >= W) continue;
                for (let dx = -1; dx <= 1; dx++) {
                    const xx = x + dx;
                    if (xx < 0 || xx >= W) continue;
                    sum += pd[yy * W + xx];
                    cnt++;
                }
            }
            const z = sum / cnt;
            let l = 0;
            if (z > 0) while (l < TERRACE_THRESHOLDS.length && z >= TERRACE_THRESHOLDS[l]) l++;
            lev[y * W + x] = l;
        }
    }
    // 2. DE clean_elevation：填 1 格窄沟、削 1 格尖脊（双缓冲，不受扫描顺序影响）
    let cur = lev, next = new Int8Array(N);
    for (let pass = 0; pass < 2; pass++) {
        next.set(cur);
        for (let y = 1; y < W - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                const i = y * W + x, h = cur[i];
                const hN = cur[i - W], hS = cur[i + W], hW = cur[i - 1], hE = cur[i + 1];
                if ((hN > h && hS > h) || (hW > h && hE > h)) next[i] = Math.min(7, h + 1);
                else if (h > 0 && ((hN < h && hS < h) || (hW < h && hE < h))) next[i] = h - 1;
            }
        }
        const t = cur; cur = next; next = t;
    }
    const L = cur;
    // 3. 分档盒式模糊成连续坡带（可分离）
    const R = TERRACE_BLUR_R;
    const tmp = new Float32Array(N), Lb = new Float32Array(N);
    for (let y = 0; y < W; y++) {
        for (let x = 0; x < W; x++) {
            let s = 0, c = 0;
            for (let k = -R; k <= R; k++) {
                const xx = x + k;
                if (xx < 0 || xx >= W) continue;
                s += L[y * W + xx]; c++;
            }
            tmp[y * W + x] = s / c;
        }
    }
    for (let y = 0; y < W; y++) {
        for (let x = 0; x < W; x++) {
            let s = 0, c = 0;
            for (let k = -R; k <= R; k++) {
                const yy = y + k;
                if (yy < 0 || yy >= W) continue;
                s += tmp[yy * W + x]; c++;
            }
            Lb[y * W + x] = s / c;
        }
    }
    // 4. 逐像素：DE 四面坡光照 + 坡面权重 + 坡脚暗影 + 台地投影
    const az = azimuthDeg * Math.PI / 180;
    const sunX = Math.sin(az), sunY = -Math.cos(az);   // 屏幕坐标下指向太阳
    const light = new Float32Array(256 * 256);
    const slope = new Float32Array(256 * 256);
    const foot = new Float32Array(256 * 256);
    const shadow = new Float32Array(256 * 256);
    const band = 2 * R + 1;
    const smooth = (a: number, b: number, v: number) => {
        const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
        return t * t * (3 - 2 * t);
    };
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            const px = x + PAD, py = y + PAD, i = py * W + px, o = y * 256 + x;
            const gx = (Lb[i + 1] - Lb[i - 1]) * 0.5 * band;
            const gy = (Lb[i + W] - Lb[i - W]) * 0.5 * band;
            const mag = Math.hypot(gx, gy);
            const towardSun = -(gx * sunX + gy * sunY);
            const cross = Math.abs(gx * sunY - gy * sunX);
            let l = 1.0;
            if (mag > 0.05) {
                if (towardSun > 0.01) l = 1.0 + Math.min(0.28, towardSun * 0.65);
                else if (towardSun < -0.01) l = 1.0 + Math.max(-0.31, towardSun * 0.72);
                else l = 1.0 - Math.min(0.10, cross * 0.22);
            }
            const flat = 1.0 + Math.min(0.07, Lb[i] * 0.022);
            light[o] = Math.max(0.67, Math.min(1.30, l + flat - 1.0));
            slope[o] = smooth(0.02, 0.12, Math.abs(light[o] - flat));
            const e = Math.max(0, Math.min(1, Lb[i] - L[i]));
            foot[o] = smooth(0.02, 0.20, e) * (1 - smooth(0.20, 0.58, e));
            // 台地投影：朝太阳方向找更高的档，落差越大投得越远
            const h0 = L[i];
            let sh = 1.0;
            if (h0 < 7) {
                for (let d = 1; d <= TERRACE_SHADOW_MAX; d++) {
                    const sx = px + Math.round(sunX * d), sy = py + Math.round(sunY * d);
                    const diff = L[sy * W + sx] - h0;
                    if (diff <= 0) continue;
                    const reach = diff * TERRACE_SHADOW_PX_PER_LEVEL;
                    if (d > reach) continue;
                    const s = 1.0 - 0.18 * (1 - (d - 1) / reach);
                    if (s < sh) sh = s;
                }
            }
            shadow[o] = sh;
        }
    }
    return { light, slope, foot, shadow };
}

function dilateMask(mask: Uint8Array, w: number, h: number, R: number): Uint8Array {
    const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
        let count = 0;
        for (let x = 0; x < Math.min(w, R); x++) if (mask[y * w + x]) count++;
        for (let x = 0; x < w; x++) {
            if (x + R < w && mask[y * w + x + R]) count++;
            if (x - R - 1 >= 0 && mask[y * w + x - R - 1]) count--;
            tmp[y * w + x] = count > 0 ? 1 : 0;
        }
    }
    for (let x = 0; x < w; x++) {
        let count = 0;
        for (let y = 0; y < Math.min(h, R); y++) if (tmp[y * w + x]) count++;
        for (let y = 0; y < h; y++) {
            if (y + R < h && tmp[(y + R) * w + x]) count++;
            if (y - R - 1 >= 0 && tmp[(y - R - 1) * w + x]) count--;
            out[y * w + x] = count > 0 ? 1 : 0;
        }
    }
    return out;
}

const rampUp = (v: number, a: number, b: number) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/**
 * 自然雪线高度（米）。
 * 🔴 [2026-09-30] 三处硬边界改为渐变 —— 旧版在北纬 30° 一刀切（+350m 只加在 ≥30°），
 *    拉萨以西约 4900m 的平坦谷地被切出一块边界笔直的白色雪块（scratch/terrain_ab/out/tibet_rect_zoom.png）；
 *    青藏椭圆边缘同样从 +360m 直接跳到 0。数值中心不变，只把切口抹成过渡带。
 */
function snowlineAt(lat: number, lng: number): number {
    const latDeg = Math.abs(lat);
    // 1. 全球物理地理基准雪线（赤道~热带 4900~5100m；副热带高压干旱区 5200m；
    //    30°~46° 温带与地中海平滑过渡至阿尔卑斯 2850~3050m；60° 斯堪的纳维亚 1400m；极地 600m）
    let snowline: number;
    if (latDeg <= 20) {
        snowline = 4900 + (latDeg / 20) * 300;
    } else if (latDeg <= 46) {
        const t = (latDeg - 20) / 26;
        snowline = 5200 - (t * 0.70 + t * t * 0.30) * 2350;
    } else if (latDeg <= 65) {
        const t = (latDeg - 46) / 19;
        snowline = 2850 - t * 1550;
    } else {
        snowline = Math.max(550, 1300 - (latDeg - 65) * 40);
    }

    // 2. 温带内陆干燥大陆度修正 (天山、阿勒泰、中亚、伊朗，降水减少使雪线自然抬升 350m)
    //    范围仍是 45°E~105°E、30°N~55°N，边界各留约 ±1.5~2° 过渡带
    const wLng = rampUp(lng, 43, 47) * (1 - rampUp(lng, 103, 107));
    const wLat = rampUp(lat, 28.5, 31.5) * (1 - rampUp(lat, 53.5, 56.5));
    snowline += 350 * wLng * wLat;

    // 3. 青藏高原“第三极”高原面热岛效应与喜马拉雅雨影抬升 (Mass Elevation Effect)
    //    中心 +480m、椭圆边缘内侧 (dist2 0.8~1.0) 平滑收到 0；
    //    既释放 4000~5000m 的高原草甸与湖盆，又保留念青唐古拉、唐古拉与喜马拉雅等 5600m+ 冰川雪峰
    const dLng = (lng - 88.5) / 13.5;
    const dLat = (lat - 32.8) / 5.2;
    const dist2 = dLng * dLng + dLat * dLat;
    if (dist2 < 1.0) {
        const tibetBoost = (1.0 - dist2 * 0.25) * 480 * (1 - rampUp(dist2, 0.8, 1.0));
        // 喜马拉雅南坡过渡 (27.2°~28.6°N)：南坡受印度洋季风暴雪影响雪线低，翻过山脊向北极旱
        const southGradient = lat < 28.6 ? Math.max(0, (lat - 27.2) / 1.4) : 1.0;
        snowline += tibetBoost * southGradient;
    }
    return snowline;
}

function isCaspianCoord(coords: { z: number; x: number; y: number }): boolean {
    if (coords.z === 9) {
        return coords.x >= 325 && coords.x <= 333 && coords.y >= 189 && coords.y <= 197;
    }
    if (coords.z === 8) {
        return coords.x >= 162 && coords.x <= 166 && coords.y >= 94 && coords.y <= 98;
    }
    if (coords.z === 7) {
        return coords.x >= 81 && coords.x <= 83 && coords.y >= 47 && coords.y <= 49;
    }
    return false;
}

function renderHillshade(
    data: Uint8ClampedArray,
    req: HillshadeRequest,
    waterMask: Uint8Array | null = null,
    material: TerrainMaterial | null = null,
    paddedDem: Float32Array | null = null,
    parentDem: Float32Array | null = null,
    caspianDem: Float32Array | null = null,
    riverStrip: Float32Array | null = null,
    winterOutput: Uint8ClampedArray<ArrayBuffer> | null = null,
    summerOutput: Uint8ClampedArray<ArrayBuffer> | null = null,
    autumnOutput: Uint8ClampedArray<ArrayBuffer> | null = null,
    seasonDiff?: { summer: boolean; autumn: boolean; winter: boolean },
): Uint8ClampedArray<ArrayBuffer> {
    // LUT 在调用前由 initLUTs() 建好；取成局部常量，让类型收窄在本函数内成立
    initLUTs();
    const colorLut = colorLUT;
    const noiseLut = noiseLUT;
    if (!colorLut || !noiseLut) throw new Error('LUT init failed');

    const { width, height, params, tileBounds, regions } = req;
    const output = new Uint8ClampedArray(width * height * 4);

    // 局部试验光照参数换算（根据当前纬度与 zoom 动态换算水平米/像素）
    const zoom = req.coords?.z ?? 9;
    const rowLatRad = (y: number) => {
        return req.coords
            ? Math.atan(Math.sinh(Math.PI * (1 - 2 * (req.coords.y + (y + 0.5) / height) / 2 ** zoom)))
            : ((tileBounds ? (tileBounds.north + tileBounds.south) / 2 : 40) * Math.PI / 180);
    };
    const rowMeters = (y: number) => {
        return 40075016.686 * Math.cos(rowLatRad(y)) / (256 * 2 ** zoom);
    };

    const tileCenterLng = tileBounds
        ? (tileBounds.west + tileBounds.east) * 0.5
        : (req.coords ? (req.coords.x + 0.5) / 2 ** zoom * 360 - 180 : 50);

    // 主光使用调试参数；补光保持相对方位和高度差。
    const azExpP = params.azimuth * Math.PI / 180.0;
    const altExpP = params.altitude * Math.PI / 180.0;
    const lxP = Math.sin(azExpP) * Math.cos(altExpP);
    const lyP = -Math.cos(azExpP) * Math.cos(altExpP);
    const lzP = Math.sin(altExpP);

    const azExpS = (params.azimuth - 45) * Math.PI / 180.0;
    const altExpS = Math.min(90, params.altitude + 12) * Math.PI / 180.0;
    const lxS = Math.sin(azExpS) * Math.cos(altExpS);
    const lyS = -Math.cos(azExpS) * Math.cos(altExpS);
    const lzS = Math.sin(altExpS);

    const zScale = (params.zFactor / 25.0);
    // 7 层高地试验：需要外扩高程（浮雕瓦片才有），没有就不画
    const terrace = req.terraceExp && paddedDem && width === 256 && height === 256
        ? computeTerrace(paddedDem, params.azimuth)
        : null;

    // [REGION-PREP] 预解析区域用于逐像素查询
    const hasRegions = !!(regions && regions.length > 0 && tileBounds);
    const regionLatStep = hasRegions ? (tileBounds!.south - tileBounds!.north) / height : 0;
    const regionLngStep = hasRegions ? (tileBounds!.east - tileBounds!.west) / width : 0;
    const preparedRegions = hasRegions ? regions!.map(reg => {
        const span = reg.elevMax - reg.elevMin;
        const fade = span > 0 ? Math.min(180, span * 0.25) : 0;
        const invFade = fade > 0 ? 1.0 / fade : 0;
        return {
            ...reg,
            fade,
            invFade,
        };
    }) : [];

    // [NILE-PREP] 尼罗河谷与三角洲冲积黑土壤土层试验判定 (ZOOM 9 专用试验范围)
    const isNileExp = !!(req.valleyReliefExp && req.coords?.z === 9 && tileBounds && !(
        tileBounds.south > NILE_VALLEY_EXP_BOUNDS.north ||
        tileBounds.north < NILE_VALLEY_EXP_BOUNDS.south ||
        tileBounds.east < NILE_VALLEY_EXP_BOUNDS.west ||
        tileBounds.west > NILE_VALLEY_EXP_BOUNDS.east
    ));
    const nileLngStep = isNileExp && tileBounds ? (tileBounds.east - tileBounds.west) / width : 0;
    const nileTileWestHalf = isNileExp && tileBounds ? tileBounds.west + 0.5 * nileLngStep : 0;

    // Process params
    const azimuthRad = (params.azimuth * Math.PI) / 180;
    const altitudeRad = (params.altitude * Math.PI) / 180;
    const cosAzimuth = Math.cos(azimuthRad);
    const sinAzimuth = Math.sin(azimuthRad);
    const cosAltitude = Math.cos(altitudeRad);
    const sinAltitude = Math.sin(altitudeRad);

    // [MULTI-AZIMUTH] 两方向光照混合,模拟"主太阳+西方反射"
    // 主光 = 用户配置方位(默认 NW 315°),保留传统制图日照惯例
    // 副光 = 主光 -45° (W ~270°),补足主光"平行山脊"丢失的细节
    const azPrimary = azimuthRad;
    const azSecondary = azimuthRad - Math.PI / 4;
    const WEIGHT_PRIMARY = 0.65;
    const WEIGHT_SECONDARY = 0.35;

    const INV_8 = 0.125;
    let divisor = 320 - (params.zFactor * 10);
    if (divisor < 20) divisor = 20;

    // [OPTIMIZATION-PERF] Branch logic outside the loop
    // 材质在循环外取一次引用
    const climateMat = material ? material.climate : null;
    const matTapA = material ? material.tapA : null;
    const matTapB = material ? material.tapB : null;
    const matBomb = material ? material.bomb : null;
    const matPatch = material ? material.patch : null;
    const matArid = material ? material.arid : null;
    const matSand = material ? material.sand : null;
    const matWinterSnow = material?.winterSnow ?? null;
    const matWinterDeep = material?.winterDeep ?? null;
    const matWinterSparse = material?.winterSparse ?? null;
    const tex = material ? material.tex : {};
    const texRck = tex.rck, texRockWet = tex.rock_wet, texGravelWet = tex.gravel_wet;
    const texBch = tex.bch, texBc2 = tex.bc2;
    const texSno = tex.sno, texSn2 = tex.sn2, texSnf = tex.snf, texSnd = tex.snd;
    const texIce = tex.ice, texIc2 = tex.ic2;
    const texWt4 = tex.wt4, texWt2 = tex.wt2, texWt3 = tex.wt3, texWt5 = tex.wt5, texSha = tex.sha;
    const texDes = tex.des, texPm2 = tex.pm2, texPc1 = tex.pc1, texPc2 = tex.pc2;
    const texGr4 = tex.gr4, texDs5 = tex.ds5, texGr2 = tex.gr2, texGrs = tex.grs;
    /** 取一张规则贴图在像素 p 的颜色（A/B 两套地理取样按交替权重混合），写入 TX */
    const sampleTex = (t: Uint8ClampedArray | undefined, p: number): boolean => {
        if (!t || !matTapA) return false;
        const ia = matTapA[p], ib = matTapB![p], w = matBomb![p], iw = 1 - w;
        TX[0] = t[ia] * iw + t[ib] * w;
        TX[1] = t[ia + 1] * iw + t[ib + 1] * w;
        TX[2] = t[ia + 2] * iw + t[ib + 2] * w;
        return true;
    };
    /** 两张规则贴图按权重混合（缺一张就只用另一张），写入 TX */
    const mix2 = (ta: Uint8ClampedArray | undefined, wa: number, tb: Uint8ClampedArray | undefined, wb: number, p: number): boolean => {
        if (!ta || wa <= 0) return sampleTex(tb, p);
        if (!tb || wb <= 0) return sampleTex(ta, p);
        sampleTex(ta, p);
        const r0 = TX[0], g0 = TX[1], b0 = TX[2];
        sampleTex(tb, p);
        const k = wb / (wa + wb);
        TX[0] = r0 + (TX[0] - r0) * k; TX[1] = g0 + (TX[1] - g0) * k; TX[2] = b0 + (TX[2] - b0) * k;
        return true;
    };
    // 离水 ≤4px 的陆地像素（海岸沙滩用）；只有带水体掩膜的瓦片才有海岸
    const nearWater = waterMask && matTapA ? dilateMask(waterMask, width, height, 4) : null;
    // 逐像素经度（地表纹理试点用）：与 tileBounds 严格线性，相邻瓦片共用同一条边，跨瓦片连续
    const rowLngStep = tileBounds ? (tileBounds.east - tileBounds.west) / width : 0;
    const tileWestLng = tileBounds ? tileBounds.west : 0;
    const getZ = (baseIdx: number) => (data[baseIdx] * 256 + data[baseIdx + 1] + data[baseIdx + 2] * 0.00390625) - 32768;
    const canFastSeason = typeof applyFourSeasonsToPixelFast === 'function';
    const useFastWorldNoise = width <= 256;
    if (useFastWorldNoise && params.useElevationColor) {
        for (let x = 0; x < width; x++) {
            const plng = tileWestLng + rowLngStep * (x + 0.5);
            const x0 = plng * 2.1 + 13.7; const ix0 = Math.floor(x0); const fx0 = x0 - ix0; WN_IX0[x] = ix0; WN_UX0[x] = fx0 * fx0 * (3 - 2 * fx0);
            const x1 = plng * 5.7 + 71.1; const ix1 = Math.floor(x1); const fx1 = x1 - ix1; WN_IX1[x] = ix1; WN_UX1[x] = fx1 * fx1 * (3 - 2 * fx1);
            const x2 = plng * 17.3 + 11.3; const ix2 = Math.floor(x2); const fx2 = x2 - ix2; WN_IX2[x] = ix2; WN_UX2[x] = fx2 * fx2 * (3 - 2 * fx2);
            const x3 = plng * 61.0 + 91.7; const ix3 = Math.floor(x3); const fx3 = x3 - ix3; WN_IX3[x] = ix3; WN_UX3[x] = fx3 * fx3 * (3 - 2 * fx3);
            const x4 = plng * 190.0 + 37.9; const ix4 = Math.floor(x4); const fx4 = x4 - ix4; WN_IX4[x] = ix4; WN_UX4[x] = fx4 * fx4 * (3 - 2 * fx4);
        }
    }
    if (params.useElevationColor) {
        // --- COLORED RENDERING PATH ---
        // 【2026-07-19 主人定：移除近岸晕染】原有 4 环扩散预计算每瓦片约 200 万次数组读取，
        // 换来的只是 4px 宽淡青边、肉眼几乎不可见，纯属拖慢 Worker。勿再加回。
        for (let y = 0; y < height; y++) {
            const meters = rowMeters(y);
            const invMeters8 = 1 / (8 * meters), invMeters6 = 1 / (6 * meters);
            const yT = (y === 0 ? 0 : y - 1) * width;
            const yM = y * width;
            const yB = (y === height - 1 ? height - 1 : y + 1) * width;
            const noiseYRow = (y & 255) * 256;

            const rowLat = rowLatRad(y) * 180 / Math.PI;
            updateSeasonalRowContext(rowLat, SEASON_ROW_CTX);
            const shWinterW = rowLat < -1.0 ? rampWorker(-rowLat, 1.0, 7.0) : 0;
            const nhWinterW = rowLat > -3.0 ? rampWorker(rowLat, -3.0, 4.0) : 0;
            // 雪线按瓦片东西两边的经度各算一次、逐像素插值：相邻瓦片共用同一条边，跨瓦片连续。
            // （旧版整块瓦片用中心经度，经度相关的抬升在瓦片交界处会断开。）
            const snowlineW = snowlineAt(rowLat, tileBounds ? tileBounds.west : tileCenterLng);
            const snowlineE = snowlineAt(rowLat, tileBounds ? tileBounds.east : tileCenterLng);

            // 5 层平原值噪声的 Y 轴行预计算与相邻像素格点哈希缓存
            const ny0 = rowLat * 2.1 + 5.3; const iy0 = Math.floor(ny0); const fy0 = ny0 - iy0; const uy0 = fy0 * fy0 * (3 - 2 * fy0);
            const ny1 = rowLat * 5.7 + 29.9; const iy1 = Math.floor(ny1); const fy1 = ny1 - iy1; const uy1 = fy1 * fy1 * (3 - 2 * fy1);
            const ny2 = rowLat * 17.3 + 47.2; const iy2 = Math.floor(ny2); const fy2 = ny2 - iy2; const uy2 = fy2 * fy2 * (3 - 2 * fy2);
            const ny3 = rowLat * 61.0 + 3.1; const iy3 = Math.floor(ny3); const fy3 = ny3 - iy3; const uy3 = fy3 * fy3 * (3 - 2 * fy3);
            const ny4 = rowLat * 190.0 + 83.4; const iy4 = Math.floor(ny4); const fy4 = ny4 - iy4; const uy4 = fy4 * fy4 * (3 - 2 * fy4);
            let prevIx0 = -2147483648, a0 = 0, b0 = 0, c0 = 0, d0 = 0;
            let prevIx1 = -2147483648, a1 = 0, b1 = 0, c1 = 0, d1 = 0;
            let prevIx2 = -2147483648, a2 = 0, b2 = 0, c2 = 0, d2 = 0;
            let prevIx3 = -2147483648, a3 = 0, b3 = 0, c3 = 0, d3 = 0;
            let prevIx4 = -2147483648, a4 = 0, b4 = 0, c4 = 0, d4 = 0;

            for (let x = 0; x < width; x++) {
                const idx = (yM + x) * 4;
                const rowSnowline = snowlineW + (snowlineE - snowlineW) * (x + 0.5) / width;
                const pixLng = tileBounds ? (tileWestLng + (x + 0.5) * rowLngStep) : tileCenterLng;

                // X Neighbors
                const xL = (x === 0 ? 0 : x - 1);
                const xR = (x === width - 1 ? width - 1 : x + 1);

                /* 🔴 [2026-09-17 主人报障「瓦片之间有浅色横竖线，新蔡、寿春周围平坦区尤其明显」]
                 * 真凶就是下面这组邻域取值的**边界钳制**（xL/xR/yT/yB 在边缘取自己）：
                 *   x=0 时左邻取自己 → Sobel 的 dzdx 退化成单边差分、梯度被低估约一半
                 *   → 坡度偏小 → 光照偏向"平坦值" → 每块瓦片的左/上/下边各留一条 1px 亮度不连续。
                 *   256px 一块拼起来就是铺满全图的方格网。平坦区明暗均匀所以最扎眼，山区反差大盖住了。
                 *
                 * 实测（scratch/_probe_hs_pixels.mjs，40 张晕渲瓦片，最外 1 列减内部第 3~6 列）：
                 *   上边 均值 -2.09、37/40 一致偏暗；左边 -1.17、31/40 偏暗；下边 -1.04、34/40 偏暗。
                 *   同一量具测底图 jpg 瓦片是 ±0.3 且偏亮/偏暗各半（随机）—— 所以不是底图、不是渲染留缝
                 *   （DOM 上相邻瓦片间隙实测全 0），是这里算出来的。
                 *
                 * 解法：本文件**早就有** getPaddedDem()，会取周围 8 块瓦片拼成带 PAD=3 外扩的高程数组，
                 *   只是一直只服务于浮雕路径。zoom 7~12 且 experimentalRelief（默认开）时它本来就已经算好，
                 *   所以这里改用它是**零额外开销**，不多发一个 DEM 请求。
                 *
                 * ⚠️ 只有边缘像素的取值会变：内部像素在两条路径下数值完全相同
                 *   （getPaddedDem 用 src[..]/256、getZ 用 data[..]*0.00390625，1/256 = 0.00390625，同一个数）。
                 *   paddedDem 为 null（浮雕关掉、或邻块拉取失败）时原样回落钳制，与改之前一致。
                 */
                const pd = paddedDem;
                const idxP = (y + PAD) * PAD_W + (x + PAD);

                const zTL = pd ? pd[idxP - PAD_W - 1] : getZ((yT + xL) * 4);
                const zT = pd ? pd[idxP - PAD_W] : getZ((yT + x) * 4);
                const zTR = pd ? pd[idxP - PAD_W + 1] : getZ((yT + xR) * 4);
                const zL = pd ? pd[idxP - 1] : getZ((yM + xL) * 4);
                const zC = getZ(idx);
                const zR = pd ? pd[idxP + 1] : getZ((yM + xR) * 4);
                const zBL = pd ? pd[idxP + PAD_W - 1] : getZ((yB + xL) * 4);
                const zB = pd ? pd[idxP + PAD_W] : getZ((yB + x) * 4);
                const zBR = pd ? pd[idxP + PAD_W + 1] : getZ((yB + xR) * 4);

                const dzdx = ((zTR + 2 * zR + zBR) - (zTL + 2 * zL + zBL)) * INV_8;
                const dzdy = ((zBL + 2 * zB + zBR) - (zTL + 2 * zT + zTR)) * INV_8;

                const gradMag = Math.sqrt(dzdx * dzdx + dzdy * dzdy);
                const slope = Math.atan(gradMag / divisor);
                // 真实地面坡度（米/米），供坡面岩石用；与晕渲的夸张系数无关
                const slopeGrad = gradMag / meters;
                let aspect = Math.atan2(dzdy, -dzdx);
                if (aspect < 0) aspect += 2 * Math.PI;

                // [MULTI-AZIMUTH] 两方向叠加,主光(NW)+副光(W)加权混合
                // 预计算公共项避免重复运算
                const cosSlope = Math.cos(slope);
                const sinSlope = Math.sin(slope);
                const ambDiff = cosAltitude * cosSlope;
                const dirComp = sinAltitude * sinSlope;
                const hsP = ambDiff + dirComp * Math.cos(azPrimary - aspect);
                const hsS = ambDiff + dirComp * Math.cos(azSecondary - aspect);
                let hillshade = hsP * WEIGHT_PRIMARY + hsS * WEIGHT_SECONDARY;

                // Color Logic
                const zAvg = (zTL + zT + zTR + zL + zR + zBL + zB + zBR) * INV_8;
                let curvature = zC - zAvg;
                if (paddedDem) {
                    const i = (y + PAD) * PAD_W + x + PAD;
                    curvature = zC - (paddedDem[i - PAD_W - 1] + paddedDem[i - PAD_W] + paddedDem[i - PAD_W + 1]
                        + paddedDem[i - 1] + paddedDem[i + 1] + paddedDem[i + PAD_W - 1]
                        + paddedDem[i + PAD_W] + paddedDem[i + PAD_W + 1]) / 8;
                }
                const aoStrength = Math.min(4.0, 1.5 * (params.zFactor * 0.1));
                let aoFactor = (curvature < 0)
                    ? Math.max(0.7, 1.0 + (curvature * 0.004 * aoStrength))
                    : Math.min(1.12, 1.0 + (curvature * 0.003 * aoStrength));
                hillshade *= aoFactor;

                let shadowStrength = 0.42;
                let ambientBase = 0.72;
                if (zC < 1000) { shadowStrength = 0.55; ambientBase = 0.62; }
                else if (zC < 1300) {
                    const t = (zC - 1000) * 0.003333;
                    shadowStrength = 0.55 - (0.13 * t);
                    ambientBase = 0.62 + (0.10 * t);
                }
                if (zC > 4200) {
                    const t = Math.min(1.0, (zC - 4200) * 0.001);
                    shadowStrength = 0.42 - (0.07 * t);
                    ambientBase = 0.72 + (0.07 * t);
                }

                // [FIX] Apply Opacity Parameter
                shadowStrength *= params.opacity;

                let shadeFactor = ambientBase + hillshade * shadowStrength;

                let surfaceNormZ = 1.0;
                if (paddedDem) {
                    const px = x + PAD, py = y + PAD;
                    const idxP = py * PAD_W + px;
                    const pzTL = paddedDem[idxP - PAD_W - 1], pzT = paddedDem[idxP - PAD_W], pzTR = paddedDem[idxP - PAD_W + 1];
                    const pzL  = paddedDem[idxP - 1],                                         pzR  = paddedDem[idxP + 1];
                    const pzBL = paddedDem[idxP + PAD_W - 1], pzB = paddedDem[idxP + PAD_W], pzBR = paddedDem[idxP + PAD_W + 1];

                    const dzdx1 = ((pzTR + 2 * pzR + pzBR) - (pzTL + 2 * pzL + pzBL)) * invMeters8;
                    const dzdy1 = ((pzBL + 2 * pzB + pzBR) - (pzTL + 2 * pzT + pzTR)) * invMeters8;

                    const pzL3 = paddedDem[idxP - 3], pzR3 = paddedDem[idxP + 3];
                    const pzT3 = paddedDem[idxP - 3 * PAD_W], pzB3 = paddedDem[idxP + 3 * PAD_W];
                    const dzdx3 = (pzR3 - pzL3) * invMeters6;
                    const dzdy3 = (pzB3 - pzT3) * invMeters6;

                    // 高程山势增强：山势拔地而起，平原（<300m）保持平坦开阔，山地（>600m~3000m）巍峨挺拔
                    const elevBoost = Math.min(1.58, Math.max(1.0, 1.0 + Math.max(0, zC - 300) * 0.00024));

                    // 局部二阶曲率/拉普拉斯高程差（山脊正、冲沟负；绝对平原趋近于 0）
                    const pzAvg = (pzTL + pzT + pzTR + pzL + pzR + pzBL + pzB + pzBR) * 0.125;
                    const lap = zC - pzAvg;

                    // 综合坡度强度（结合 1 像素高频与 3 像素中频）
                    const slope1Sq = dzdx1 * dzdx1 + dzdy1 * dzdy1;
                    const slope3Sq = dzdx3 * dzdx3 + dzdy3 * dzdy3;
                    const slopeMag = Math.max(Math.sqrt(slope1Sq), Math.sqrt(slope3Sq));

                    // 微地形细节门控（真实坡度与起伏驱动，消除低海拔丘陵断崖的一刀切磨皮模糊）：
                    // 1. 高海拔自然全细节（>400m 的中山与高山）
                    const elevWeight = Math.max(0, Math.min(1, (zC - 220) / 230));
                    // 2. 真实坡度/起伏度贡献：平原（slopeMag < 0.008, |lap| < 0.6m）为 0；
                    //    海峡两岸低矮丘陵/断崖（加里波利半岛、特洛伊台地等 slopeMag 0.012~0.035 或 |lap| 0.6~2.6m）平滑激活至 1.0
                    const slopeWeight = Math.max(0, Math.min(1, (slopeMag - 0.008) / 0.022));
                    const lapWeight = Math.max(0, Math.min(1, (Math.abs(lap) - 0.6) / 1.8));
                    const reliefWeight = Math.max(slopeWeight, lapWeight);
                    // 🔴 [2026-09-30] 海面只用 3 像素粗尺度坡度：水深数据在瓦片交界处有轻微断层（红海实测交界两侧差 13.4m、
                    //    瓦片内部相邻列 8.4m），1 像素细尺度坡度把它放大成一条直缝（光照开 3.04 个亮度级、关 0.15）。
                    //    改后交界台阶 0.19；海底大尺度起伏照旧由 3 像素坡度表现。验收：scratch/terrain_ab/seam_probe.mts
                    const fineWeight = (waterMask !== null && waterMask[yM + x] !== 0) ? 0 : Math.max(elevWeight, reliefWeight);

                    let effDzdx1 = dzdx1, effDzdy1 = dzdy1;
                    let effDzdx3 = dzdx3, effDzdy3 = dzdy3;
                    const isWater = waterMask !== null && waterMask[yM + x] !== 0;
                    if (isWater) {
                        effDzdx1 = Math.max(-0.035, Math.min(0.035, dzdx1 * 0.4));
                        effDzdy1 = Math.max(-0.035, Math.min(0.035, dzdy1 * 0.4));
                        effDzdx3 = Math.max(-0.035, Math.min(0.035, dzdx3 * 0.4));
                        effDzdy3 = Math.max(-0.035, Math.min(0.035, dzdy3 * 0.4));
                    }

                    const gx = (effDzdx1 * 4.0 * 0.55 * fineWeight + effDzdx3 * 6.3 * (1 - 0.55 * fineWeight)) * zScale * elevBoost;
                    const gy = (effDzdy1 * 4.0 * 0.55 * fineWeight + effDzdy3 * 6.3 * (1 - 0.55 * fineWeight)) * zScale * elevBoost;

                    const norm = Math.sqrt(gx * gx + gy * gy + 1.0);
                    const normX = -gx / norm, normY = -gy / norm, normZ = 1.0 / norm;
                    surfaceNormZ = normZ;

                    const illumP = Math.max(0, normX * lxP + normY * lyP + normZ * lzP);
                    const illumS = Math.max(0, normX * lxS + normY * lyS + normZ * lzS);
                    const illum = illumP * 0.76 + illumS * 0.24;

                    const hillDepthT = rampWorker(zC, 120, 680);
                    const ridge = Math.min(0.38, Math.max(0, lap * 0.020)) * fineWeight * (0.50 + 0.50 * hillDepthT);
                    const cavity = Math.min(0.42, Math.max(0, -lap * 0.021)) * fineWeight * (0.35 + 0.65 * hillDepthT);

                    const ambient = 0.33;
                    const contrastIllum = Math.pow(illum, 1.21);
                    const flatIllum = lzP * 0.76 + lzS * 0.24;
                    const flatShade = ambient + 0.86 * Math.pow(flatIllum, 1.21);
                    let expShade = ((ambient + 0.86 * contrastIllum) / flatShade) * (1.0 - cavity * 0.54) * (1.0 + ridge * 0.60);
                    // 🔴 [2026-11-10 低丘防黑斑 + 高山深壑分级]
                    //    平原上的低矮孤丘（<450m，如维罗纳—威尼斯间的尤加内丘陵）阴影下限抬高至 0.56，呈现柔和缓丘，绝不出现黑墨斑；
                    //    真正的中高山脉（>680m）平滑释放至 0.28 深邃峡谷阴影。
                    const baseMinShade = 0.56 - 0.28 * hillDepthT;
                    const minShade = zC > 1200 ? Math.min(0.35, 0.28 + (zC - 1200) * 0.000035) : baseMinShade;
                    expShade = Math.max(minShade, Math.min(1.44, expShade));

                    shadeFactor = 1 + (expShade - 1) * params.opacity;
                }
                // 7 层高地：档内只留 30% 原山影，台地光影由 DE 坡面光照、坡脚暗影与台地投影给出
                const terraceOn = terrace !== null && zC > 0 && !(waterMask !== null && waterMask[yM + x] !== 0);
                if (terraceOn) {
                    const o = yM + x;
                    shadeFactor = (1 + (shadeFactor - 1) * 0.30) * terrace.light[o] * terrace.shadow[o] * (1 - terrace.foot[o] * 0.11);
                }
                //const shadeFactor = Math.min(1.0, ambientBase + hillshade * shadowStrength);

                // [2026-07-28 / 2026-09-14] 取色高度：
                // 1. 低于海平面但掩膜说不是水（里海低地、吐鲁番盆地）→ 按低地陆地上色；
                // 2. 是水且高程被高分辨率数据裁切为 0m（如沿海瓦片与外海瓦片交界）→ 取上级层级真实水深或浅海蓝，消除边界直边方块；
                // 3. 是里海且被抹平为水面海拔 -29m → 取 Z6 真实盆地水深，消除湖内垂直跳崖断层；
                // 4. 正常深海保留原生负高程与海洋六级色阶。
                let colorZ = zC;
                const isWater = waterMask !== null && waterMask[yM + x] !== 0;
                if (isWater) {
                    if (caspianDem && req.coords && isCaspianCoord(req.coords) && Math.abs(colorZ - (-29)) <= 0.8) {
                        const scale = 2 ** (req.coords.z - 6);
                        const subX = ((req.coords.x % scale) + scale) % scale;
                        const subY = ((req.coords.y % scale) + scale) % scale;
                        const px = Math.min(255, Math.max(0, Math.floor((subX * 256 + x) / scale)));
                        const py = Math.min(255, Math.max(0, Math.floor((subY * 256 + y) / scale)));
                        const pz = caspianDem[py * 256 + px];
                        colorZ = pz < -0.5 ? pz : -29;
                    } else if (colorZ >= -0.5) {
                        if (parentDem && req.coords) {
                            const subX = ((req.coords.x % 2) + 2) % 2;
                            const subY = ((req.coords.y % 2) + 2) % 2;
                            const px = subX * 128 + Math.floor(x / 2);
                            const py = subY * 128 + Math.floor(y / 2);
                            const pz = parentDem[py * 256 + px];
                            colorZ = pz < -0.5 ? pz : -15;
                        } else {
                            colorZ = -15;
                        }
                    }
                } else if (zC < 0) {
                    colorZ = LAND_BELOW_SEA_COLOR_ELEV;
                }


                let noise = 0;
                if (colorZ > 0) {
                    noise = noiseLut[noiseYRow + (x & 255)];
                    if (colorZ + noise <= 0) noise = -colorZ + 0.1;
                }

                let elevIndex = Math.floor(colorZ + noise) + LUT_OFFSET;
                if (elevIndex < 0) elevIndex = 0;
                else if (elevIndex > LUT_MAX_ELEV + LUT_OFFSET) elevIndex = LUT_MAX_ELEV + LUT_OFFSET;

                const lIdx = elevIndex * 3;
                let r = colorLut[lIdx];
                let g = colorLut[lIdx + 1];
                let b = colorLut[lIdx + 2];

                // 气候材质提供地表色与纹理；高程仍决定起伏，雪线上方平滑淡出，呈现皑皑白雪。
                // 🔴 [2026-09-18 主人令] 降低平原黄绿反差：低地平原(<400m)由原 0.60 调柔和至 0.35，
                //    保留地表干湿与疏密自然质感的同时，大幅收敛黄绿反差；山地(>400m)平滑过渡至 0.52，呈现巍峨岩土立体感。
                // 🔴 [2026-09-30] 山地上限 0.52 → 0.42：山地的岩土质感改由下面的坡面岩石层提供，
                //    气候贴图压得太重会冲淡海拔色阶（山脚到山顶的层次）。
                // 🔴 [2026-09-30 主人令「多用帝国时代 2 素材，让战略地图色彩丰富」] 贴图由地形规则决定：
                //    气候表只给 20 种贴图；下面按海拔 / 坡度 / 水深 / 纬度 / 海岸，逐像素加入另外 25 种 DE 地表贴图。
                //    干湿与沙地程度来自气候贴图的逐张分类（StrategicTerrainMaterial.CLIMATE_CLASS）。
                const p = yM + x;
                const isLand = colorZ > 0 && !isWater;
                const aridity = matArid ? matArid[p] : 0.5;
                const sandiness = matSand ? matSand[p] : 0;
                const humidity = 1 - aridity;
                const absLat = Math.abs(rowLat);
                const snowFade = Math.max(0, Math.min(1, (rowSnowline - colorZ) / 500));

                const treeLine = Math.max(900, rowSnowline - 1200);
                const alpineT = rampWorker(colorZ, treeLine, rowSnowline - 200);

                if (climateMat && colorZ > 0 && climateMat[idx + 3] > 0) {
                    // 🔴 9-18 主人令「降低平原黄绿反差」＋ 2026-11-10 修正：
                    //    只按真实坡度（slopeGrad）衰减陡坡山脊的绿植贴图，绝不按海拔一刀切压掉高原盆地（如墨西哥谷地、关中、云贵坝子）的绿意。
                    const lowBlend = 0.34 + 0.26 * sandiness;
                    const flatBasinBoost = colorZ > 500
                        ? (1.0 - rampWorker(slopeGrad, 0.015, 0.055)) * 0.14 * humidity
                        : 0;
                    const slopeMute = 1.0 - rampWorker(slopeGrad, 0.045, 0.18) * 0.62 * (1.0 - sandiness * 0.6);
                    const baseBlend = Math.min(0.58, (lowBlend + flatBasinBoost) * slopeMute);
                    // 林线以上低地平原植被自然退隐，让位给高山植被与高寒裸岩
                    const alpineTreeFade = 1.0 - alpineT * 0.58;
                    const blend = baseBlend * snowFade * alpineTreeFade * climateMat[idx + 3] / 255;
                    r += (climateMat[idx] - r) * blend;
                    g += (climateMat[idx + 1] - g) * blend;
                    b += (climateMat[idx + 2] - b) * blend;
                }

                if (isLand && matTapA) {
                    // ① 山地与高山自然带：仅在有坡度起伏的山地（slopeGrad）或林线以上渐入，避免把湿润高原平坦谷地涂成枯黄草甸
                    const montSlopeGate = rampWorker(slopeGrad, 0.022, 0.085);
                    const mont = rampWorker(colorZ, 900, 2200) * 0.34 * montSlopeGate * snowFade;
                    const montWeight = Math.max(mont, alpineT * 0.48 * snowFade);
                    if (montWeight > 0) {
                        if (mix2(texGr4, humidity * 0.7, texDs5, aridity + 0.3 * (1 - humidity), p)) {
                            r += (TX[0] - r) * montWeight; g += (TX[1] - g) * montWeight; b += (TX[2] - b) * montWeight;
                        }
                    }
                    // ② 沙漠沙海与风成沙垅过渡：拉宽低频过渡带并叠入跨瓦片连续的盛行风沙丘长波，消除圆团豹纹斑块感
                    const patch = matPatch![p];
                    const pixLng = tileBounds ? tileBounds.west + (tileBounds.east - tileBounds.west) * (x + 0.5) / width : tileCenterLng;
                    const duneWave = 0.5 + 0.5 * Math.sin((pixLng * 1.35 + rowLat * 0.85) * 9.0 + Math.sin((pixLng * 0.6 - rowLat * 1.1) * 4.5) * 1.4);
                    const ergMask = 0.22 + 0.78 * rampWorker(patch * 0.68 + duneWave * 0.32, 0.24, 0.78);
                    const desert = sandiness > 0.12 && colorZ < 2600
                        ? rampWorker(sandiness, 0.12, 0.88) * ergMask * 0.50 * snowFade * rampWorker(colorZ, 35, 130) : 0;
                    if (desert > 0 && sampleTex(absLat < 34 ? texDes : texPm2, p)) {
                        r += (TX[0] - r) * desert; g += (TX[1] - g) * desert; b += (TX[2] - b) * desert;
                    }
                    // ③ 热带稀树草原：南北回归线附近、半干旱、2000m 以下
                    const savanna = absLat < 24 && colorZ < 2000 && sandiness < 0.65
                        ? (1 - rampWorker(absLat, 16, 24)) * Math.max(0, 1 - Math.abs(aridity - 0.55) / 0.42) * (0.24 + 0.24 * patch) : 0;
                    if (savanna > 0 && mix2(texPc1, 1 - patch, texPc2, patch, p)) {
                        r += (TX[0] - r) * savanna; g += (TX[1] - g) * savanna; b += (TX[2] - b) * savanna;
                    }
                }

                // ⑧ 平原田地 / 草土肌理（2026-10-21 主人令：由中原试点铺到全图）
                //    只作用于低起伏农耕地（干湿 / 沙地 / 坡度 / 海拔四道门控）：斑驳 + 干湿色相，幅度 ±10% 内。
                const pilot = 1;
                if (pilot > 0 && isLand && colorZ > 0 && colorZ < 700 && snowFade > 0.35) {
                    const cropW = pilot
                        * (1 - rampWorker(aridity, 0.32, 0.72))     // 干草原 / 荒漠平滑淡出，不留硬边
                        * (1 - rampWorker(colorZ, 420, 700))       // 高原台地让给海拔色阶
                        * (1 - rampWorker(slopeGrad, 0.030, 0.070))// 坡地让给晕渲
                        * (1 - rampWorker(sandiness, 0.10, 0.58)); // 沙地平滑淡出
                    if (cropW > 0.002) {
                        let nBig: number, nA: number, nB: number, nC: number, nD: number;
                        if (useFastWorldNoise) {
                            const ix0 = WN_IX0[x];
                            if (ix0 !== prevIx0) {
                                if (ix0 === prevIx0 + 1) {
                                    a0 = b0; c0 = d0;
                                    b0 = worldHash(ix0 + 1, iy0); d0 = worldHash(ix0 + 1, iy0 + 1);
                                } else {
                                    a0 = worldHash(ix0, iy0); b0 = worldHash(ix0 + 1, iy0);
                                    c0 = worldHash(ix0, iy0 + 1); d0 = worldHash(ix0 + 1, iy0 + 1);
                                }
                                prevIx0 = ix0;
                            }
                            const ux0 = WN_UX0[x];
                            const ab0 = a0 + (b0 - a0) * ux0, cd0 = c0 + (d0 - c0) * ux0;
                            nBig = ab0 + (cd0 - ab0) * uy0;

                            const ix1 = WN_IX1[x];
                            if (ix1 !== prevIx1) {
                                if (ix1 === prevIx1 + 1) {
                                    a1 = b1; c1 = d1;
                                    b1 = worldHash(ix1 + 1, iy1); d1 = worldHash(ix1 + 1, iy1 + 1);
                                } else {
                                    a1 = worldHash(ix1, iy1); b1 = worldHash(ix1 + 1, iy1);
                                    c1 = worldHash(ix1, iy1 + 1); d1 = worldHash(ix1 + 1, iy1 + 1);
                                }
                                prevIx1 = ix1;
                            }
                            const ux1 = WN_UX1[x];
                            const ab1 = a1 + (b1 - a1) * ux1, cd1 = c1 + (d1 - c1) * ux1;
                            nA = ab1 + (cd1 - ab1) * uy1;

                            const ix2 = WN_IX2[x];
                            if (ix2 !== prevIx2) {
                                if (ix2 === prevIx2 + 1) {
                                    a2 = b2; c2 = d2;
                                    b2 = worldHash(ix2 + 1, iy2); d2 = worldHash(ix2 + 1, iy2 + 1);
                                } else {
                                    a2 = worldHash(ix2, iy2); b2 = worldHash(ix2 + 1, iy2);
                                    c2 = worldHash(ix2, iy2 + 1); d2 = worldHash(ix2 + 1, iy2 + 1);
                                }
                                prevIx2 = ix2;
                            }
                            const ux2 = WN_UX2[x];
                            const ab2 = a2 + (b2 - a2) * ux2, cd2 = c2 + (d2 - c2) * ux2;
                            nB = ab2 + (cd2 - ab2) * uy2;

                            const ix3 = WN_IX3[x];
                            if (ix3 !== prevIx3) {
                                if (ix3 === prevIx3 + 1) {
                                    a3 = b3; c3 = d3;
                                    b3 = worldHash(ix3 + 1, iy3); d3 = worldHash(ix3 + 1, iy3 + 1);
                                } else {
                                    a3 = worldHash(ix3, iy3); b3 = worldHash(ix3 + 1, iy3);
                                    c3 = worldHash(ix3, iy3 + 1); d3 = worldHash(ix3 + 1, iy3 + 1);
                                }
                                prevIx3 = ix3;
                            }
                            const ux3 = WN_UX3[x];
                            const ab3 = a3 + (b3 - a3) * ux3, cd3 = c3 + (d3 - c3) * ux3;
                            nC = ab3 + (cd3 - ab3) * uy3;

                            const ix4 = WN_IX4[x];
                            if (ix4 !== prevIx4) {
                                if (ix4 === prevIx4 + 1) {
                                    a4 = b4; c4 = d4;
                                    b4 = worldHash(ix4 + 1, iy4); d4 = worldHash(ix4 + 1, iy4 + 1);
                                } else {
                                    a4 = worldHash(ix4, iy4); b4 = worldHash(ix4 + 1, iy4);
                                    c4 = worldHash(ix4, iy4 + 1); d4 = worldHash(ix4 + 1, iy4 + 1);
                                }
                                prevIx4 = ix4;
                            }
                            const ux4 = WN_UX4[x];
                            const ab4 = a4 + (b4 - a4) * ux4, cd4 = c4 + (d4 - c4) * ux4;
                            nD = ab4 + (cd4 - ab4) * uy4;
                        } else {
                            const plng = tileWestLng + rowLngStep * (x + 0.5);
                            nBig = worldNoise(plng * 2.1 + 13.7, rowLat * 2.1 + 5.3);
                            nA = worldNoise(plng * 5.7 + 71.1, rowLat * 5.7 + 29.9);
                            nB = worldNoise(plng * 17.3 + 11.3, rowLat * 17.3 + 47.2);
                            nC = worldNoise(plng * 61.0 + 91.7, rowLat * 61.0 + 3.1);
                            nD = worldNoise(plng * 190.0 + 37.9, rowLat * 190.0 + 83.4);
                        }
                        // ① 大块干湿（≈0.5°格）：偏干→土黄，偏湿→青绿
                        const dry = (nBig - 0.5) * 2 * cropW;
                        r += 18 * dry * 0.60;
                        g += 12 * dry * 0.35;
                        b -= 15 * dry * 0.55;
                        // ② 草土肌理：四层**平滑**噪声（值噪声双线性，天然没有硬边/方块），
                        //    ~0.18° 中斑 → ~0.06° 细斑 → ~0.016° 颗粒 → ~0.005° 细砂（1~2px）
                        const mott = (nA - 0.5) * 0.50 + (nB - 0.5) * 0.34 + (nC - 0.5) * 0.08 + (nD - 0.5) * 0.03;
                        const lum = 1 + mott * 0.20 * cropW;
                        r *= lum; g *= lum; b *= lum;
                        // ③ 色相随中斑轻微摆动（黄绿↔青绿），不加格子
                        const hue = (nA - 0.5) * 2;
                        r += 8 * hue * cropW;
                        b -= 7 * hue * cropW;
                        // ④ 少数地方是休耕/翻耕的裸土斑：用平滑阈值取软边，不是方块
                        const bare = rampWorker(nA, 0.60, 0.86);
                        if (bare > 0) {
                            const bw = bare * 0.05 * cropW;
                            r += (166 - r) * bw;
                            g += (148 - g) * bw;
                            b += (108 - b) * bw;
                        }
                    }
                }

                // ⑦ 沙漠中的河流绿带：干旱区（aridity 0.6 起渐入；干草 gr7=0.5 这类温带干草原不算）大河两侧铺绿草，陡坡不铺（河谷崖壁留给岩石）
                let riverGreenW = 0, riverGreenR = 0, riverGreenG = 0, riverGreenB = 0;
                if (isLand && matTapA && riverStrip) {
                    const rs = riverStrip[p];
                    if (rs > 0) {
                        const w = rs * rampWorker(aridity, 0.6, 0.85) * (1 - rampWorker(slopeGrad, 0.03, 0.08)) * 0.62 * snowFade;
                        const pt = matPatch![p];
                        if (w > 0 && mix2(texGr2, 1 - pt, texGrs, pt, p)) {
                            riverGreenW = w; riverGreenR = TX[0]; riverGreenG = TX[1]; riverGreenB = TX[2];
                        }
                    }
                }

                // ④ 坡面露岩与高山裸岩带（2026-11-10 修正：只认真实陡坡与高山脊线，绝不把平坦高原盆地涂成灰褐泥地）：
                // A. 坡面露岩：坡度 0.055（约 3.1°）起露岩，陡坡与山脊转为冷灰褐岩石；
                // B. 高山裸岩带：林线以上随坡度与海拔露出岩石基底。
                let nonVegRockBeach = 0;
                if (isLand && matTapA && texRck) {
                    const slopeT = Math.max(0, Math.min(1, (slopeGrad - 0.055) / 0.23));
                    const mountRock = rampWorker(colorZ, 700, 2200) * rampWorker(slopeGrad, 0.040, 0.13) * 0.68;
                    const alpineRock = alpineT * rampWorker(colorZ, rowSnowline - 750, rowSnowline - 150) * Math.max(0.30, Math.min(1.0, slopeGrad / 0.08));
                    const rockT = Math.max(slopeT, mountRock, alpineRock);
                    if (rockT > 0 && sampleTex(texRck, p)) {
                        const rockMax = 0.62 + 0.24 * Math.max(0, Math.min(1, (zC - 1000) / 1600));
                        const w = rockT * rockT * (3 - 2 * rockT) * rockMax * snowFade;
                        nonVegRockBeach = w;
                        const grey = TX[0] * 0.299 + TX[1] * 0.587 + TX[2] * 0.114;
                        // 冷灰褐岩石基底（保留微弱冷橄榄灰调，使山林树木自然融于山体，不死黑脱节）
                        let tr = (TX[0] + (grey - TX[0]) * 0.42) * 0.92 + 6;
                        let tg = (TX[1] + (grey - TX[1]) * 0.40) * 0.92 + 5;
                        let tb = (TX[2] + (grey - TX[2]) * 0.38) * 0.93 + 6;
                        const wet = humidity * 0.35;
                        if (wet > 0 && sampleTex(texRockWet, p)) {
                            tr += (TX[0] - tr) * wet; tg += (TX[1] - tg) * wet; tb += (TX[2] - tb) * wet;
                        }
                        r += (tr - r) * w;
                        g += (tg - g) * w;
                        b += (tb - b) * w;
                    }
                }

                // ⑤ 海岸沙滩：离海 ≤4px（约 1km）、海拔 20m 以下、不陡；热带白沙 / 温带沙滩 / 寒带湿砾
                //    （12m 时 zoom 9 下只剩最外一圈像素、原尺寸几乎看不见，放宽到 20m）
                if (isLand && matTapA && nearWater && nearWater[p] && colorZ < 20 && slopeGrad < 0.12) {
                    const beach = (1 - rampWorker(colorZ, 6, 20)) * 0.8;
                    const beachTex = absLat < 30 ? texBch : absLat < 55 ? texBc2 : texGravelWet;
                    if (beach > 0 && sampleTex(beachTex, p)) {
                        nonVegRockBeach = Math.max(nonVegRockBeach, beach);
                        r += (TX[0] - r) * beach; g += (TX[1] - g) * beach; b += (TX[2] - b) * beach;
                    }
                }

                // ⑥ 海水：按水深铺 DE 海水（深海 wt4 → 近海 wt2 → 浅海：温带 wt3 / 热带 wt5），
                //    热带浅海成片出礁（sha），极地（|纬度| 76°~82° 渐入）为海冰 —— 巴伦支海南部、挪威海受北大西洋暖流影响终年不冻，门槛不能再往南。保留 45% 原水深色阶，深浅过渡不断层。
                if (!isLand && colorZ < 0 && matTapA && texWt2) {
                    const depth = -colorZ;
                    const tropical = absLat < 28;
                    sampleTex(texWt2, p);
                    let wr = TX[0], wg = TX[1], wb = TX[2];
                    const deepW = rampWorker(depth, 300, 2500);
                    if (deepW > 0 && sampleTex(texWt4, p)) { wr += (TX[0] - wr) * deepW; wg += (TX[1] - wg) * deepW; wb += (TX[2] - wb) * deepW; }
                    const shallowW = 1 - rampWorker(depth, 20, 250);
                    if (shallowW > 0 && sampleTex(tropical ? texWt5 : texWt3, p)) { wr += (TX[0] - wr) * shallowW; wg += (TX[1] - wg) * shallowW; wb += (TX[2] - wb) * shallowW; }
                    const reefW = tropical && depth < 40 ? (1 - rampWorker(depth, 15, 40)) * rampWorker(matPatch![p], 0.5, 0.75) * 0.5 : 0;
                    if (reefW > 0 && sampleTex(texSha, p)) { wr += (TX[0] - wr) * reefW; wg += (TX[1] - wg) * reefW; wb += (TX[2] - wb) * reefW; }
                    const iceW = rampWorker(absLat, 76, 82) * 0.85;
                    if (iceW > 0 && mix2(texIce, 1 - matPatch![p], texIc2, matPatch![p], p)) { wr += (TX[0] - wr) * iceW; wg += (TX[1] - wg) * iceW; wb += (TX[2] - wb) * iceW; }
                    r += (wr - r) * 0.55; g += (wg - g) * 0.55; b += (wb - b) * 0.55;
                }

                // [NILE-ALLUVIAL] 尼罗河谷与三角洲冲积黑土壤土层试验 (ZOOM 9 专用)
                if (isNileExp) {
                    const isWater = waterMask !== null && waterMask[yM + x] !== 0;
                    if (!isWater) {
                        const pixelLng = nileTileWestHalf + x * nileLngStep;
                        for (let pi = 0; pi < PREPARED_NILE_POLYGONS.length; pi++) {
                            const poly = PREPARED_NILE_POLYGONS[pi];
                            if (rowLat < poly.minLat || rowLat > poly.maxLat || pixelLng < poly.minLng || pixelLng > poly.maxLng) continue;
                            if (zC > poly.elevMax) continue;
                            if (!isPointInPolygon(rowLat, pixelLng, poly.points)) continue;

                            let elevWeight = 1.0;
                            if (poly.elevFade > 0 && zC > poly.elevMax - poly.elevFade) {
                                const t = (poly.elevMax - zC) / poly.elevFade;
                                elevWeight = t * t * (3.0 - 2.0 * t);
                            }

                            let edgeWeight = 1.0;
                            if (poly.edgeFadeDeg && poly.edgeFadeDeg > 0) {
                                const d = distToPolygonBoundary(rowLat, pixelLng, poly.points);
                                if (d < poly.edgeFadeDeg) {
                                    const t = d / poly.edgeFadeDeg;
                                    edgeWeight = t * t * (3.0 - 2.0 * t);
                                }
                            }

                            const w = poly.blendStrength * elevWeight * edgeWeight;
                            const iw = 1.0 - w;
                            r = r * iw + poly.color[0] * w;
                            g = g * iw + poly.color[1] * w;
                            b = b * iw + poly.color[2] * w;
                            break;
                        }
                    }
                }

                // [优化第1步] 关闭陆地与高山高频伪随机噪点，消除山体表面的石膏粉砂纸感
                /*
                if (colorZ > 0 && colorZ < 1500) {
                    const grain = 1.0 + (noise * 0.03);
                    r *= grain; g *= grain; b *= grain;
                }
                // [NEW] High Altitude Noise for greater texture
                if (zC > 3000) {
                    const grain = 1.0 + (noise * 0.05); // Stronger grain for rock/mountain
                    r *= grain; g *= grain; b *= grain;
                }
                */
                // [OCEAN-TEXTURE] 海面极轻微噪声,破除"死板纯色",模拟水面光斑
                if (isWater || zC < 0) {
                    const oceanNoise = noiseLut[noiseYRow + (x & 255)];
                    const oceanGrain = 1.0 + (oceanNoise * 0.006); // ±0.6% 亮度微扰
                    r *= oceanGrain; g *= oceanGrain; b *= oceanGrain;
                }
                // [HISTORICAL-REGIONS] 沙漠/湿地/古湖/内陆低洼等历史地理特殊区域着色
                if (hasRegions && (zC > 0 || zC >= -500)) {
                    const lat = tileBounds!.north + y * regionLatStep;
                    const lng = tileBounds!.west + x * regionLngStep;
                    for (let ri = 0; ri < preparedRegions.length; ri++) {
                        const reg = preparedRegions[ri];
                        if (zC < reg.elevMin || zC > reg.elevMax) continue;
                        const dLat = (lat - reg.center[0]) / reg.radii[0];
                        const dLng = (lng - reg.center[1]) / reg.radii[1];
                        const d2 = dLat * dLat + dLng * dLng;
                        if (d2 >= 1.0) continue;

                        // 椭圆空间衰减(平方曲线), 边缘 0 中心 1
                        const falloff = (1.0 - d2) * (1.0 - d2);

                        // 高程垂直羽化(Smoothstep), 上下限边缘平滑淡化，消除生硬等高线切边
                        let elevFalloff = 1.0;
                        if (reg.fade > 0) {
                            if (zC < reg.elevMin + reg.fade) {
                                const t = (zC - reg.elevMin) * reg.invFade;
                                elevFalloff = t * t * (3.0 - 2.0 * t);
                            } else if (zC > reg.elevMax - reg.fade) {
                                const t = (reg.elevMax - zC) * reg.invFade;
                                elevFalloff = t * t * (3.0 - 2.0 * t);
                            }
                        }

                        const w = falloff * elevFalloff * reg.blendStrength;
                        const iw = 1.0 - w;
                        r = r * iw + reg.color[0] * w;
                        g = g * iw + reg.color[1] * w;
                        b = b * iw + reg.color[2] * w;
                    }
                }

                // ⑦（续）河流绿带叠在历史区域与尼罗河试验层之上
                if (riverGreenW > 0) {
                    r += (riverGreenR - r) * riverGreenW; g += (riverGreenG - g) * riverGreenW; b += (riverGreenB - b) * riverGreenW;
                }
                const preSnowR = r, preSnowG = g, preSnowB = b;
                const vegMask = isLand ? Math.max(0, Math.min(1, (1 - nonVegRockBeach) * snowFade)) : 0;
                const patchVal = matPatch ? matPatch[p] : 0.5;

                // 统一高山常年雪线 + 坡面阴阳冷暖 + 7层高地 + 天光散射 + 浮雕增益着色管线
                const shadeAndWriteSeason = (
                    baseR: number,
                    baseG: number,
                    baseB: number,
                    extraWinterSnowW: number,
                    extraWinterSnowline: number,
                    targetBuf: Uint8ClampedArray,
                ) => {
                    let sr = baseR, sg = baseG, sb = baseB;

                    // 真实高山常年雪线与冰川着色（仅当未叠入更高强度的冬季雪线时生效）
                    if (extraWinterSnowW < 0.999 && zC > rowSnowline - 250) {
                        const snowT = Math.min(1.0, (zC - (rowSnowline - 250)) / 450);
                        let snowCover = 1.0;
                        if (paddedDem) {
                            const steepness = Math.max(0, Math.min(1.0, (0.72 - surfaceNormZ) * 4.5));
                            snowCover = 1.0 - steepness * 0.65;
                        }
                        const finalSnow = snowT * snowCover * (1 - extraWinterSnowW);
                        if (finalSnow > 0.002) {
                            let snowR = 250, snowG = 252, snowB = 255;
                            if (sampleTex(texSno, yM + x)) {
                                snowR += (TX[0] * 1.12 - snowR) * 0.35;
                                snowG += (TX[1] * 1.12 - snowG) * 0.35;
                                snowB += (Math.min(255, TX[2] * 1.12) - snowB) * 0.35;
                            }
                            const patchyW = (1 - rampWorker(snowT, 0.2, 0.6));
                            if (patchyW > 0 && mix2(texSnf, humidity, texSnd, aridity, yM + x)) {
                                snowR += (TX[0] - snowR) * patchyW;
                                snowG += (TX[1] - snowG) * patchyW;
                                snowB += (TX[2] - snowB) * patchyW;
                            }
                            sr = sr * (1 - finalSnow) + snowR * finalSnow;
                            sg = sg * (1 - finalSnow) + snowG * finalSnow;
                            sb = sb * (1 - finalSnow) + snowB * finalSnow;
                        }
                    }

                    // 高山雪峰冰棱与山脊微高光
                    if ((zC > extraWinterSnowline || extraWinterSnowW > 0.5) && curvature > 1.2) {
                        const rStr = Math.min(0.45, (curvature - 1.2) * 0.08);
                        const invR = 1 - rStr;
                        sr = sr * invR + 255 * rStr;
                        sg = sg * invR + 255 * rStr;
                        sb = sb * invR + 255 * rStr;
                    }

                    // 阳坡偏暖、阴坡偏冷
                    if (!isWater && zC > 0) {
                        const lit = Math.max(-0.5, Math.min(0.4, shadeFactor - 1));
                        const k = lit * (extraWinterSnowW > 0.3 ? 0.09 : 0.12);
                        sr *= 1 + k;
                        sb *= 1 - k;
                    }

                    // 7 层高地坡面混土石色
                    if (terraceOn) {
                        const effSnowFade = Math.min(snowFade, 1 - Math.min(1, extraWinterSnowW * 0.85));
                        const k = terrace.slope[yM + x] * 0.26 * effSnowFade;
                        sr += (150 - sr) * k;
                        sg += (124 - sg) * k;
                        sb += (92 - sb) * k;
                    }

                    // 🔴 [2026-11-10 军事沙盘做减法（修正版）：按真实坡度区分「浅色通行走廊」与「冷灰褐险峻山脊」]
                    //   1) 可通行的平原、河谷、高原盆地（不论海拔高低，只要地势平坦 slopeGrad 小）：
                    //      保持干净柔和的浅色走廊底盘（湿润高原盆地同步修正海拔色阶的黄褐底色，恢复柔和绿洲/谷地感）；
                    //   2) 不可通行的崇山峻岭（严格由陡坡 slopeGrad 驱动，绝不把高海拔平地误涂成灰褐泥地）：
                    //      去饱和收敛为冷灰褐岩体，依靠 Hillshade 光影立起沟壑纵深，避免底色双重压黑发脏。
                    if (isLand) {
                        const snowKeep = Math.min(snowFade, 1 - Math.min(1, extraWinterSnowW * 0.85));
                        const flatW = 1.0 - rampWorker(slopeGrad, 0.010, 0.034);
                        const corridorW = flatW * snowKeep;
                        const barrierW = rampWorker(slopeGrad, 0.038, 0.17)
                            * (0.25 + 0.75 * rampWorker(colorZ, 220, 850))
                            * snowKeep;

                        // 高海拔湿润与半湿润平坦盆地（如墨西哥谷地、云贵坝子、外高加索高原）：温和中和海拔 LUT 的焦黄褐色，回到自然温润谷地底色
                        if (flatW > 0.05 && colorZ > 550 && humidity > 0.25 && sandiness < 0.40) {
                            const basinGreenW = flatW * rampWorker(colorZ, 550, 1750) * rampWorker(humidity, 0.25, 0.65) * 0.42 * snowKeep;
                            sr += (144 - sr) * basinGreenW;
                            sg += (166 - sg) * basinGreenW;
                            sb += (125 - sb) * basinGreenW;
                        }

                        const baseLuma = sr * 0.299 + sg * 0.587 + sb * 0.114;
                        if (corridorW > 0.01) {
                            // 平原与平坦谷地走廊：轻度去饱和 20%，微提柔和沙盘明度
                            const desat = 0.20 * corridorW;
                            sr = sr + (baseLuma - sr) * desat + 5.5 * corridorW;
                            sg = sg + (baseLuma - sg) * desat + 5.0 * corridorW;
                            sb = sb + (baseLuma - sb) * desat + 3.0 * corridorW;
                        }
                        if (barrierW > 0.01) {
                            // 陡峭山岭：去饱和 36% 靠拢冷灰褐岩体，仅轻微压暗 5%（把明暗交给 Hillshade，不死黑、不与绿树脱节）
                            const desatM = 0.36 * barrierW;
                            const coldR = baseLuma * 0.90 + 6;
                            const coldG = baseLuma * 0.88 + 5;
                            const coldB = baseLuma * 0.85 + 4;
                            sr = (sr + (coldR - sr) * desatM) * (1.0 - 0.05 * barrierW);
                            sg = (sg + (coldG - sg) * desatM) * (1.0 - 0.06 * barrierW);
                            sb = (sb + (coldB - sb) * desatM) * (1.0 - 0.04 * barrierW);
                        }
                    }

                    let sOutR = sr * shadeFactor;
                    let sOutG = sg * shadeFactor;
                    let sOutB = sb * shadeFactor;

                    // 瑞士制图学天光散射（Imhof relief fill：保留深谷冷蓝灰散射通透感，消除焦黑斑块）
                    if (!isWater && zC > 0 && shadeFactor < 0.95) {
                        const shadowDepth = (0.95 - shadeFactor) / 0.95;
                        const elevSky = Math.min(1.0, 0.62 + Math.max(0, zC) * 0.00015 + extraWinterSnowW * 0.18);
                        const skyW = shadowDepth * shadowDepth * (0.25 + extraWinterSnowW * 0.02) * elevSky;
                        sOutR += (132 - sOutR) * skyW * 0.35;
                        sOutG += (158 - sOutG) * skyW * 0.45;
                        sOutB += (196 - sOutB) * skyW * 0.68;
                    }

                    // 山川坡面光影加强（严格按真实坡度 slopeRelief 与山体高度分级驱动，平原低丘温和、崇山峻岭深邃）
                    if (isLand) {
                        const slopeRelief = Math.max(0, Math.min(1, (slopeGrad - 0.022) / 0.220));
                        const mountScale = 0.35 + 0.65 * rampWorker(colorZ, 180, 720);
                        const reliefGain = 1 + 0.24 * slopeRelief * mountScale;
                        sOutR = sr + (sOutR - sr) * reliefGain;
                        sOutG = sg + (sOutG - sg) * reliefGain;
                        sOutB = sb + (sOutB - sb) * reliefGain;
                    }

                    if (req.civ6LightExp) {
                        if (!isWater && zC > 0) {
                            if (shadeFactor >= 1.0) {
                                const sunW = Math.min(1.0, (shadeFactor - 1.0) * 2.5);
                                sOutR = sOutR * (1.03 + sunW * 0.18) + sunW * 9.0;
                                sOutG = sOutG * (1.01 + sunW * 0.07) + sunW * 3.5;
                                sOutB = sOutB * (0.95 - sunW * 0.10);
                            } else {
                                const shW = Math.min(1.0, (1.0 - shadeFactor) * 2.0);
                                sOutR = sOutR * (1.0 - shW * 0.24) + 42.0 * shW * 0.16;
                                sOutG = sOutG * (1.0 - shW * 0.18) + 76.0 * shW * 0.18;
                                sOutB = sOutB * (1.0 - shW * 0.06) + 128.0 * shW * 0.24;
                            }
                        } else if (isWater) {
                            const shallowW = Math.max(0.0, Math.min(1.0, (colorZ + 140.0) / 140.0));
                            sOutR = sOutR * (0.92 + shallowW * 0.12);
                            sOutG = sOutG * (0.98 + shallowW * 0.22) + shallowW * 12.0;
                            sOutB = sOutB * (1.06 + shallowW * 0.10) + shallowW * 8.0;
                        }
                    }

                    targetBuf[idx] = Math.min(255, Math.max(0, sOutR));
                    targetBuf[idx + 1] = Math.min(255, Math.max(0, sOutG));
                    targetBuf[idx + 2] = Math.min(255, Math.max(0, sOutB));
                    targetBuf[idx + 3] = 255;
                };

                // 当地冬季积雪/残雪/冰封叠加（北半球在日历冬 3 触发，南半球在日历夏 1 触发），结果写入 WINTER_OUT5
                const applyLocalWinterSnowAndIce = (
                    inR: number,
                    inG: number,
                    inB: number,
                    hemisphereW: number,
                ): void => {
                    if (hemisphereW <= 0.002) {
                        WINTER_OUT5[0] = inR; WINTER_OUT5[1] = inG; WINTER_OUT5[2] = inB;
                        WINTER_OUT5[3] = 0; WINTER_OUT5[4] = rowSnowline;
                        return;
                    }
                    const wSnow = (matWinterSnow ? matWinterSnow[p] : 0) * hemisphereW;
                    const wDeep = (matWinterDeep ? matWinterDeep[p] : 0) * hemisphereW;
                    const wSparse = (matWinterSparse ? matWinterSparse[p] : 0) * hemisphereW;
                    const winterSnowline = rowSnowline - 420 * rampWorker(absLat, 22, 38) * hemisphereW;
                    if (wSnow <= 0.002 && wSparse <= 0.002 && zC <= winterSnowline - 250) {
                        WINTER_OUT5[0] = inR; WINTER_OUT5[1] = inG; WINTER_OUT5[2] = inB;
                        WINTER_OUT5[3] = 0; WINTER_OUT5[4] = rowSnowline;
                        return;
                    }
                    let wr = inR, wg = inG, wb = inB;
                    let effSnowW = 0;
                    if (isLand) {
                        if (wSparse > 0.002) {
                            const grey0 = wr * 0.299 + wg * 0.587 + wb * 0.114;
                            const dormantW = Math.min(1, wSparse) * 0.24 * (1 - sandiness);
                            wr += (grey0 * 1.04 - wr) * dormantW;
                            wg += (grey0 * 0.96 - wg) * dormantW;
                            wb += (grey0 * 0.94 - wb) * dormantW;

                            const shadeBias = Math.max(0, Math.min(0.28, (1.02 - shadeFactor) * 0.45));
                            const elevBias = Math.min(0.18, Math.max(0, zC - 150) * 0.00025);
                            const sparseField = patchVal * 0.72 + shadeBias + elevBias;
                            const sparseMask = rampWorker(sparseField, 0.55, 0.78) * Math.min(1, wSparse * 1.25);
                            if (sparseMask > 0.005) {
                                let spR = 238, spG = 242, spB = 248;
                                if (mix2(texSn2 ?? texSno, humidity, texSnd, aridity, p)) {
                                    spR += (TX[0] * 1.08 - spR) * 0.45;
                                    spG += (TX[1] * 1.08 - spG) * 0.45;
                                    spB += (Math.min(255, TX[2] * 1.08) - spB) * 0.45;
                                }
                                const sw = sparseMask * 0.76 * (1 - sandiness * 0.65);
                                wr += (spR - wr) * sw;
                                wg += (spG - wg) * sw;
                                wb += (spB - wb) * sw;
                                effSnowW = Math.max(effSnowW, sw * 0.5);
                            }
                        }

                        const alpineWinterT = zC > winterSnowline - 250
                            ? Math.min(1.0, (zC - (winterSnowline - 250)) / 450) * hemisphereW
                            : 0;
                        let climaticSnow = 0;
                        if (wSnow > 0.002) {
                            const edgeMod = (patchVal - 0.48) * 0.34 + Math.max(-0.12, Math.min(0.16, (1.0 - shadeFactor) * 0.35));
                            climaticSnow = wSnow >= 0.96
                                ? 1.0
                                : rampWorker(wSnow + edgeMod * wSnow * (1 - wSnow) * 3.6, 0.12, 0.88);
                        }
                        const rawSnowT = Math.max(climaticSnow, alpineWinterT);
                        if (rawSnowT > 0.002) {
                            let cliffKeep = 1.0;
                            if (paddedDem) {
                                const steepness = Math.max(0, Math.min(1.0, (0.72 - surfaceNormZ) * 4.5));
                                cliffKeep = 1.0 - steepness * 0.62;
                            }
                            const desertAtten = Math.max(
                                rampWorker(sandiness, 0.25, 0.78) * 0.68,
                                rampWorker(aridity, 0.78, 0.96) * (0.45 + 0.25 * (1 - patchVal)),
                            );
                            const aridKeep = alpineWinterT > 0.5 ? 1.0 : (1.0 - desertAtten);
                            const finalWinterSnow = Math.min(0.95, rawSnowT * cliffKeep * (0.86 + 0.09 * wDeep) * aridKeep);

                            let snowR = 246 + wDeep * 4;
                            let snowG = 250 + wDeep * 3;
                            let snowB = 255;
                            const baseSnowTex = wDeep > 0.4 && texSn2 ? texSn2 : texSno;
                            if (sampleTex(baseSnowTex, p)) {
                                snowR += (TX[0] * 1.12 - snowR) * 0.34;
                                snowG += (TX[1] * 1.12 - snowG) * 0.34;
                                snowB += (Math.min(255, TX[2] * 1.12) - snowB) * 0.34;
                            }
                            const detailW = (1 - rampWorker(rawSnowT, 0.35, 0.85)) * 0.48 + (1 - wDeep) * 0.20;
                            if (detailW > 0 && mix2(texSnf, humidity, texSnd, aridity, p)) {
                                snowR += (TX[0] * 1.06 - snowR) * detailW;
                                snowG += (TX[1] * 1.06 - snowG) * detailW;
                                snowB += (Math.min(255, TX[2] * 1.06) - snowB) * detailW;
                            }
                            wr += (snowR - wr) * finalWinterSnow;
                            wg += (snowG - wg) * finalWinterSnow;
                            wb += (snowB - wb) * finalWinterSnow;
                            effSnowW = Math.max(effSnowW, finalWinterSnow);
                        }
                    } else if (isWater && (wSnow > 0.35 || zC > winterSnowline - 100)) {
                        const isInlandOrShallow = colorZ >= -22;
                        if (isInlandOrShallow) {
                            const depthFade = colorZ < -5 ? (1 - rampWorker(-colorZ, 5, 22)) : 1.0;
                            const freezeW = Math.min(1, Math.max(wSnow, zC > winterSnowline ? 0.9 * hemisphereW : 0)) * depthFade * (0.72 + 0.16 * wDeep);
                            if (freezeW > 0.02) {
                                let iceR = 212, iceG = 228, iceB = 242;
                                if (mix2(texIc2, 0.65, texIce, 0.35, p)) {
                                    iceR += (TX[0] * 1.05 - iceR) * 0.55;
                                    iceG += (TX[1] * 1.05 - iceG) * 0.55;
                                    iceB += (Math.min(255, TX[2] * 1.05) - iceB) * 0.55;
                                }
                                wr += (iceR - wr) * freezeW;
                                wg += (iceG - wg) * freezeW;
                                wb += (iceB - wb) * freezeW;
                                effSnowW = Math.max(effSnowW, freezeW);
                            }
                        }
                    }
                    WINTER_OUT5[0] = wr; WINTER_OUT5[1] = wg; WINTER_OUT5[2] = wb;
                    WINTER_OUT5[3] = effSnowW; WINTER_OUT5[4] = winterSnowline;
                };

                const rockMute = 1 - vegMask;
                const hasSeasonalMod = vegMask > 0.002 && canFastSeason;
                if (hasSeasonalMod) {
                    applyFourSeasonsToPixelFast(preSnowR, preSnowG, preSnowB, SEASON_ROW_CTX, pixLng, aridity, sandiness, rockMute, SEASON_RGB12);
                } else {
                    SEASON_RGB12[0] = preSnowR; SEASON_RGB12[1] = preSnowG; SEASON_RGB12[2] = preSnowB;
                    SEASON_RGB12[3] = preSnowR; SEASON_RGB12[4] = preSnowG; SEASON_RGB12[5] = preSnowB;
                    SEASON_RGB12[6] = preSnowR; SEASON_RGB12[7] = preSnowG; SEASON_RGB12[8] = preSnowB;
                    SEASON_RGB12[9] = preSnowR; SEASON_RGB12[10] = preSnowG; SEASON_RGB12[11] = preSnowB;
                }
                // ── 日历春 0（北半球春芽嫩绿 · 南半球秋草金黄 · 地中海春润青翠 · 萨瓦纳旱末微黄） ──
                const spR = SEASON_RGB12[0], spG = SEASON_RGB12[1], spB = SEASON_RGB12[2];
                shadeAndWriteSeason(spR, spG, spB, 0, rowSnowline, output);

                // ── 日历夏 1（北半球盛夏苍翠 · 地中海盛夏焦黄干涸 · 萨瓦纳雨季返青 · 南半球严冬积雪/霜枯） ──
                if (summerOutput) {
                    let suR = SEASON_RGB12[3], suG = SEASON_RGB12[4], suB = SEASON_RGB12[5];
                    let suSnowW = 0;
                    let suSnowline = rowSnowline;
                    if (shWinterW > 0.002) {
                        applyLocalWinterSnowAndIce(suR, suG, suB, shWinterW);
                        suR = WINTER_OUT5[0]; suG = WINTER_OUT5[1]; suB = WINTER_OUT5[2];
                        suSnowW = WINTER_OUT5[3]; suSnowline = WINTER_OUT5[4];
                    }
                    if (Math.abs(suR - spR) < 0.25 && Math.abs(suG - spG) < 0.25 && Math.abs(suB - spB) < 0.25 && suSnowW <= 0.002) {
                        summerOutput[idx] = output[idx];
                        summerOutput[idx + 1] = output[idx + 1];
                        summerOutput[idx + 2] = output[idx + 2];
                        summerOutput[idx + 3] = 255;
                    } else {
                        shadeAndWriteSeason(suR, suG, suB, suSnowW, suSnowline, summerOutput);
                        if (seasonDiff && !seasonDiff.summer) {
                            if (Math.abs(summerOutput[idx] - output[idx]) >= 1 ||
                                Math.abs(summerOutput[idx + 1] - output[idx + 1]) >= 1 ||
                                Math.abs(summerOutput[idx + 2] - output[idx + 2]) >= 1) {
                                seasonDiff.summer = true;
                            }
                        }
                    }
                }

                // ── 日历秋 2（北半球温带平原/森林与北方草原秋草金黄 · 南半球春芽嫩绿） ──
                if (autumnOutput) {
                    const auR = SEASON_RGB12[6], auG = SEASON_RGB12[7], auB = SEASON_RGB12[8];
                    if (Math.abs(auR - spR) < 0.25 && Math.abs(auG - spG) < 0.25 && Math.abs(auB - spB) < 0.25) {
                        autumnOutput[idx] = output[idx];
                        autumnOutput[idx + 1] = output[idx + 1];
                        autumnOutput[idx + 2] = output[idx + 2];
                        autumnOutput[idx + 3] = 255;
                    } else {
                        shadeAndWriteSeason(auR, auG, auB, 0, rowSnowline, autumnOutput);
                        if (seasonDiff && !seasonDiff.autumn) {
                            if (Math.abs(autumnOutput[idx] - output[idx]) >= 1 ||
                                Math.abs(autumnOutput[idx + 1] - output[idx + 1]) >= 1 ||
                                Math.abs(autumnOutput[idx + 2] - output[idx + 2]) >= 1) {
                                seasonDiff.autumn = true;
                            }
                        }
                    }
                }

                // ── 日历冬 3（北半球寒冬皑皑白雪/霜褐枯草/河湖冰封 · 地中海冬雨返青 · 萨瓦纳旱季枯黄 · 南半球盛夏苍翠） ──
                if (winterOutput) {
                    let wiR = SEASON_RGB12[9], wiG = SEASON_RGB12[10], wiB = SEASON_RGB12[11];
                    let wiSnowW = 0;
                    let wiSnowline = rowSnowline;
                    if (nhWinterW > 0.002) {
                        applyLocalWinterSnowAndIce(wiR, wiG, wiB, nhWinterW);
                        wiR = WINTER_OUT5[0]; wiG = WINTER_OUT5[1]; wiB = WINTER_OUT5[2];
                        wiSnowW = WINTER_OUT5[3]; wiSnowline = WINTER_OUT5[4];
                    }
                    if (Math.abs(wiR - spR) < 0.25 && Math.abs(wiG - spG) < 0.25 && Math.abs(wiB - spB) < 0.25 && wiSnowW <= 0.002) {
                        winterOutput[idx] = output[idx];
                        winterOutput[idx + 1] = output[idx + 1];
                        winterOutput[idx + 2] = output[idx + 2];
                        winterOutput[idx + 3] = 255;
                    } else {
                        shadeAndWriteSeason(wiR, wiG, wiB, wiSnowW, wiSnowline, winterOutput);
                        if (seasonDiff && !seasonDiff.winter) {
                            if (Math.abs(winterOutput[idx] - output[idx]) >= 1 ||
                                Math.abs(winterOutput[idx + 1] - output[idx + 1]) >= 1 ||
                                Math.abs(winterOutput[idx + 2] - output[idx + 2]) >= 1) {
                                seasonDiff.winter = true;
                            }
                        }
                    }
                }
            }
        }
    } else {
        // --- GRAYSCALE/HILLSHADE ONLY PATH ---
        for (let y = 0; y < height; y++) {
            const meters = rowMeters(y);
            const invMeters8 = 1 / (8 * meters), invMeters6 = 1 / (6 * meters);
            const yT = (y === 0 ? 0 : y - 1) * width;
            const yM = y * width;
            const yB = (y === height - 1 ? height - 1 : y + 1) * width;

            for (let x = 0; x < width; x++) {
                const idx = (yM + x) * 4;

                const xL = (x === 0 ? 0 : x - 1);
                const xR = (x === width - 1 ? width - 1 : x + 1);

                const zTL = getZ((yT + xL) * 4);
                const zT = getZ((yT + x) * 4);
                const zTR = getZ((yT + xR) * 4);
                const zL = getZ((yM + xL) * 4);
                const zR = getZ((yM + xR) * 4);
                const zBL = getZ((yB + xL) * 4);
                const zB = getZ((yB + x) * 4);
                const zBR = getZ((yB + xR) * 4);

                const dzdx = ((zTR + 2 * zR + zBR) - (zTL + 2 * zL + zBL)) * INV_8;
                const dzdy = ((zBL + 2 * zB + zBR) - (zTL + 2 * zT + zTR)) * INV_8;

                const slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy) / divisor);
                let aspect = Math.atan2(dzdy, -dzdx);
                if (aspect < 0) aspect += 2 * Math.PI;

                // [MULTI-AZIMUTH] grayscale path 同步更新
                const _cosS = Math.cos(slope), _sinS = Math.sin(slope);
                const _ad = cosAltitude * _cosS, _dc = sinAltitude * _sinS;
                let hillshade = (_ad + _dc * Math.cos(azPrimary - aspect)) * WEIGHT_PRIMARY
                              + (_ad + _dc * Math.cos(azSecondary - aspect)) * WEIGHT_SECONDARY;

                if (paddedDem) {
                    const px = x + PAD, py = y + PAD;
                    const idxP = py * PAD_W + px;
                    const pzTL = paddedDem[idxP - PAD_W - 1], pzT = paddedDem[idxP - PAD_W], pzTR = paddedDem[idxP - PAD_W + 1];
                    const pzL  = paddedDem[idxP - 1],                                         pzR  = paddedDem[idxP + 1];
                    const pzBL = paddedDem[idxP + PAD_W - 1], pzB = paddedDem[idxP + PAD_W], pzBR = paddedDem[idxP + PAD_W + 1];

                    const dzdx1 = ((pzTR + 2 * pzR + pzBR) - (pzTL + 2 * pzL + pzBL)) * invMeters8;
                    const dzdy1 = ((pzBL + 2 * pzB + pzBR) - (pzTL + 2 * pzT + pzTR)) * invMeters8;

                    const pzL3 = paddedDem[idxP - 3], pzR3 = paddedDem[idxP + 3];
                    const pzT3 = paddedDem[idxP - 3 * PAD_W], pzB3 = paddedDem[idxP + 3 * PAD_W];
                    const dzdx3 = (pzR3 - pzL3) * invMeters6;
                    const dzdy3 = (pzB3 - pzT3) * invMeters6;

                    const zC = paddedDem[idxP];
                    const elevBoost = Math.min(1.35, Math.max(1.0, 1.0 + Math.max(0, zC - 400) * 0.00015));

                    const fineWeight = Math.max(0, Math.min(1, (zC - 400) / 400));
                    const gx = (dzdx1 * 3.6 * 0.55 * fineWeight + dzdx3 * 5.8 * (1 - 0.55 * fineWeight)) * zScale * elevBoost;
                    const gy = (dzdy1 * 3.6 * 0.55 * fineWeight + dzdy3 * 5.8 * (1 - 0.55 * fineWeight)) * zScale * elevBoost;

                    const norm = Math.sqrt(gx * gx + gy * gy + 1.0);
                    const normX = -gx / norm, normY = -gy / norm, normZ = 1.0 / norm;

                    const illumP = Math.max(0, normX * lxP + normY * lyP + normZ * lzP);
                    const illumS = Math.max(0, normX * lxS + normY * lyS + normZ * lzS);
                    const illum = illumP * 0.75 + illumS * 0.25;

                    hillshade = illum;
                }

                const val = hillshade * 255;
                if (val < 180) {
                    output[idx] = 0; output[idx + 1] = 0; output[idx + 2] = 20;
                    let alpha = (180 - val) * 0.00555 * 255 * params.opacity;
                    output[idx + 3] = (alpha > 240) ? 240 : alpha;
                } else if (val > 220) {
                    output[idx] = 255; output[idx + 1] = 255; output[idx + 2] = 240;
                    let alpha = (val - 220) * 0.02857 * 255 * params.opacity * 0.8;
                    output[idx + 3] = (alpha > 255) ? 255 : alpha;
                } else {
                    output[idx + 3] = 0;
                }
            }
        }
    }

    return output;
}

/**
 * 取图 → 解码 → 着色 → 回传位图，全在 Worker 内完成。
 *
 * [PERF 2026-07-27] 旧实现在主线程 new Image() + drawImage + getImageData 逐块回读像素，
 * 再把 256KB 缓冲拷给 Worker：一次换 zoom 上百块瓦片的 onload 回调挤在同一帧，
 * 实测单帧阻塞近 1 秒。现在主线程只剩一句 drawImage(bitmap)。
 */
/**
 * 取 ESRI 瓦片并转成水域掩膜。
 * 任何失败（无 URL / 网络错 / 解码错）都返回 null，调用方按纯高程判据出图——
 * 掩膜是锦上添花，绝不能因为它拿不到就让整块瓦片画不出来。
 */
async function fetchWaterMask(
    url: string | undefined,
    width: number,
    height: number,
): Promise<Uint8Array | null> {
    if (!url) return null;
    try {
        // [必须有超时] 本请求与高程瓦片一起 Promise.all，掩膜挂住 = 整块山体永远画不出来 ⇒ 地图空白。
        // 掩膜只是锦上添花，宁可不要也不能拖住出图。
        const resp = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(WATER_MASK_TIMEOUT_MS) });
        if (!resp.ok) return null;
        const bmp = await createImageBitmap(await resp.blob());
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | null;
        if (!ctx) { bmp.close(); return null; }
        ctx.drawImage(bmp, 0, 0, width, height);
        bmp.close();
        const rgba = ctx.getImageData(0, 0, width, height).data;
        // ESRI 该级瓦片缓存烤坏（整块纯灰）→ 会被误读成「整块都是陆地」，
        // 拿去改上色会把那片海刷成陆地色。弃用，退回纯高程判据。
        if (isDefectGrayTile(rgba, width, height)) return null;
        return buildWaterMask(rgba, width * height);
    } catch {
        return null;
    }
}

self.onmessage = async (e: MessageEvent<HillshadeRequest | RiverSegmentsMessage>) => {
    if ((e.data as RiverSegmentsMessage).type === 'rivers') { setRiverSegments((e.data as RiverSegmentsMessage).segs); return; }
    const req = e.data as HillshadeRequest;
    try {
        initLUTs();
        if (!colorLUT || !noiseLUT) throw new Error('LUT init failed');

        // 规则贴图要等高程与水体掩膜到手才知道用哪些；气候贴图先行加载，与高程下载并行
        let resolveRules: (names: readonly TerrainRuleTexture[]) => void = () => { };
        const rulesNeeded = new Promise<readonly TerrainRuleTexture[]>(resolve => { resolveRules = resolve; });
        const materialPending = req.params.useElevationColor && req.tileBounds
            ? createTerrainMaterial(req.tileBounds, req.width, req.height, req.coords, rulesNeeded).catch(() => null)
            : Promise.resolve(null);
        let src: Uint8ClampedArray;
        let centerDem: Float32Array | null = null;
        let usedCoarseFallback = false;
        if (req.coords && req.width === 256 && req.height === 256) {
            centerDem = await fetchDemFloat32(req.coords.z, req.coords.x, req.coords.y);
            if (!centerDem) {
                centerDem = await synthesizeDemFromCoarser(req.coords.z, req.coords.x, req.coords.y);
                if (centerDem) usedCoarseFallback = true;
            }
            if (!centerDem) throw new Error('DEM load failed');
            src = new Uint8ClampedArray(256 * 256 * 4);
            writeTerrarium(src, centerDem);
        } else {
            const resp = await fetch(req.url, { mode: 'cors', signal: AbortSignal.timeout(8000) });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const srcBitmap = await createImageBitmap(await resp.blob());
            const canvas = new OffscreenCanvas(req.width, req.height);
            const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | null;
            if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable');
            ctx.drawImage(srcBitmap, 0, 0, req.width, req.height);
            srcBitmap.close();

            src = ctx.getImageData(0, 0, req.width, req.height).data;
        }

        // 只有本瓦片含海平面以下像素或启用河谷冲积试验时取掩膜。内陆瓦片直接跳过，
        // 沿海/海域/试验瓦片才多等一次，且有超时兜底，保证河流与湖泊保持纯净水色。
        const hasBelowSea = hasBelowSeaPixel(src, req.width * req.height);
        const mayHaveLake = !hasBelowSea && countFlatLandPixels(src, req.width, req.height, LAKE_FLAT_PIXELS) >= LAKE_FLAT_PIXELS;
        const needMask = hasBelowSea || mayHaveLake || !!req.valleyReliefExp;
        // 规则贴图在高程解码后立即开拉，与水体掩膜及邻块下载并行
        resolveRules(pickRuleTextures(src, hasBelowSea || mayHaveLake, req));
        const maskPending = needMask
            ? fetchWaterMask(req.waterMaskUrl, req.width, req.height)
            : Promise.resolve(null);
        const paddedDemPending = req.experimentalRelief && req.coords && req.coords.z >= 7 && req.coords.z <= 12
            ? getPaddedDem(src, req.coords, centerDem ?? undefined, usedCoarseFallback)
            : Promise.resolve(null);

        const [mask, paddedDem] = await Promise.all([maskPending, paddedDemPending]);

        let hasClampedSea = false;
        let hasCaspianFlat = false;
        const isCaspian = req.coords ? isCaspianCoord(req.coords) : false;
        if (mask && req.coords && req.coords.z >= 7) {
            for (let i = 0, p = 0; p < req.width * req.height; i += 4, p++) {
                if (mask[p] !== 0) {
                    if (src[i] === 128 && src[i + 1] === 0) {
                        hasClampedSea = true;
                    }
                    if (isCaspian && src[i] === 127 && src[i + 1] === 227) {
                        hasCaspianFlat = true;
                    }
                    if (hasClampedSea && (!isCaspian || hasCaspianFlat)) break;
                }
            }
        }
        const parentDemPending = hasClampedSea && req.coords && req.coords.z >= 8
            ? fetchDemFloat32(req.coords.z - 1, Math.floor(req.coords.x / 2), Math.floor(req.coords.y / 2))
            : Promise.resolve(null);
        const caspianDemPending = hasCaspianFlat
            ? fetchDemFloat32(6, 41, 24)
            : Promise.resolve(null);

        const [material, parentDem, caspianDem] = await Promise.all([materialPending, parentDemPending, caspianDemPending]);
        // 干旱瓦片才要河流绿带（河流线段由主线程发来，见 setRiverSegments）
        let riverStrip: Float32Array | null = null;
        if (material && req.tileBounds) {
            let maxArid = 0;
            for (let i = 0; i < material.arid.length; i += 53) if (material.arid[i] > maxArid) maxArid = material.arid[i];
            if (maxArid >= 0.50 && await waitRivers()) riverStrip = computeRiverStrip(req.tileBounds, req.width, req.height);
        }
        const renderStart = performance.now();
        const useSeasonalColor = !!req.params.useElevationColor;
        const summerOutput = useSeasonalColor ? new Uint8ClampedArray(req.width * req.height * 4) : null;
        const autumnOutput = useSeasonalColor ? new Uint8ClampedArray(req.width * req.height * 4) : null;
        const winterOutput = useSeasonalColor ? new Uint8ClampedArray(req.width * req.height * 4) : null;
        const seasonDiff = { summer: false, autumn: false, winter: false };
        const output = renderHillshade(
            src, req, mask, material, paddedDem, parentDem, caspianDem, riverStrip,
            winterOutput, summerOutput, autumnOutput, seasonDiff,
        );
        const renderMs = performance.now() - renderStart;
        const bitmap = await createImageBitmap(new ImageData(output, req.width, req.height));
        const summerBitmap = (summerOutput && seasonDiff.summer)
            ? await createImageBitmap(new ImageData(summerOutput, req.width, req.height))
            : undefined;
        const autumnBitmap = (autumnOutput && seasonDiff.autumn)
            ? await createImageBitmap(new ImageData(autumnOutput, req.width, req.height))
            : undefined;
        const winterBitmap = (winterOutput && seasonDiff.winter)
            ? await createImageBitmap(new ImageData(winterOutput, req.width, req.height))
            : undefined;
        const transfer: Transferable[] = [bitmap];
        if (summerBitmap) transfer.push(summerBitmap);
        if (autumnBitmap) transfer.push(autumnBitmap);
        if (winterBitmap) transfer.push(winterBitmap);

        // Cast to any to avoid TS matching Window.postMessage instead of Worker.postMessage
        (self as any).postMessage({
            id: req.id,
            bitmap,
            summerBitmap,
            autumnBitmap,
            winterBitmap,
            isCoarseFallback: usedCoarseFallback || undefined,
            materialBytes: getMaterialBytes(),
            renderMs,
        } as HillshadeResponse, transfer);
    } catch (err) {
        (self as any).postMessage({ id: req.id, error: String(err) } as HillshadeResponse);
    }
};
