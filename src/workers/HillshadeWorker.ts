/**
 * HillshadeWorker.ts
 * Offloads heavy terrain math to a background thread
 */

import { buildWaterMask, isDefectGrayTile } from '../world/land-sea/WaterMask';
import { createTerrainMaterial, getMaterialBytes, type TerrainMaterial, type TerrainRuleTexture } from '../map/StrategicTerrainMaterial';
import type { RiverSegmentsMessage } from '../map/RiverStripData';
import { NILE_ALLUVIAL_POLYGONS, NILE_VALLEY_EXP_BOUNDS, type NileAlluvialPolygon } from '../data/HistoricalRegions';

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
const DEM_CACHE_MAX = 80;
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
    modeVersion?: number;
}

export interface HillshadeResponse {
    id: number;
    materialBytes?: number;
    renderMs?: number;
    /** 算好的瓦片位图（transferable）；主线程只需 drawImage，零像素拷贝 */
    bitmap?: ImageBitmap;
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
    const oliveFoot = [172, 172, 102];      // ~1000m 山麓黄绿（低山林地到草坡）
    const khakiUpland = [206, 168, 96];     // ~1600m 中山赭黄
    const tanMontane = [192, 136, 80];      // ~2400m 中高山橙褐
    const brownSubalpine = [146, 110, 78];  // ~3200m 亚高山深褐（林线附近）
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
    const coarse = new Map<string, Float32Array | null>();
    await Promise.all([-1, 0, 1].flatMap(dy => [-1, 0, 1].map(async dx => {
        coarse.set(`${dx}/${dy}`, await fetchDemFloat32(COARSE_Z, cx0 + dx, cy0 + dy));
    })));
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

const PAD = 3;
const PAD_W = 256 + 2 * PAD;

async function getPaddedDem(src: Uint8ClampedArray, coords: { z: number; x: number; y: number }): Promise<Float32Array | null> {
    const center = new Float32Array(256 * 256);
    for (let i = 0; i < center.length; i++) center[i] = src[i * 4] * 256 + src[i * 4 + 1] + src[i * 4 + 2] / 256 - 32768;
    const n = 2 ** coords.z;
    cacheDem(`${coords.z}/${((coords.x % n) + n) % n}/${coords.y}`, center);
    const tiles = new Map<string, Float32Array>([['0/0', center]]);
    const neighbors = await Promise.all([-1, 0, 1].flatMap(dy => [-1, 0, 1].filter(dx => dx !== 0 || dy !== 0).map(async dx => {
        const dem = await fetchDemFloat32(coords.z, coords.x + dx, coords.y + dy);
        if (dem) { await fillSurfaceSea(dem, coords.z, coords.x + dx, coords.y + dy); tiles.set(`${dx}/${dy}`, dem); }
        return dem !== null;
    })));
    // 邻块不可用时整块使用原版光照，不能用假高度冒充连续地形。
    if (neighbors.some(ok => !ok)) return null;
    const padded = new Float32Array(PAD_W * PAD_W);
    for (let y = -PAD; y < 256 + PAD; y++) for (let x = -PAD; x < 256 + PAD; x++) {
        const dx = Math.floor(x / 256), dy = Math.floor(y / 256);
        padded[(y + PAD) * PAD_W + x + PAD] = tiles.get(`${dx}/${dy}`)![((y + 256) % 256) * 256 + (x + 256) % 256];
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
    if (hasWater && latMaxAbs > 76) out.push('ice', 'ic2');                   // 海冰
    // 积雪：雪线最低的情形（该瓦片最高纬、不计任何抬升）再放宽 350m
    const lowestSnowline = snowlineAt(latMaxAbs, b ? (b.west + b.east) * 0.5 : 0);
    if (maxZ > lowestSnowline - 350) out.push('sno', 'snf', 'snd');
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
const rampWorker = (v: number, a: number, b: number) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** 掩膜向外扩 R 像素（先横后竖两遍滑窗，O(n)） */
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
    const tex = material ? material.tex : {};
    const texRck = tex.rck, texRockWet = tex.rock_wet, texGravelWet = tex.gravel_wet;
    const texBch = tex.bch, texBc2 = tex.bc2;
    const texSno = tex.sno, texSnf = tex.snf, texSnd = tex.snd;
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
            // 雪线按瓦片东西两边的经度各算一次、逐像素插值：相邻瓦片共用同一条边，跨瓦片连续。
            // （旧版整块瓦片用中心经度，经度相关的抬升在瓦片交界处会断开。）
            const snowlineW = snowlineAt(rowLat, tileBounds ? tileBounds.west : tileCenterLng);
            const snowlineE = snowlineAt(rowLat, tileBounds ? tileBounds.east : tileCenterLng);

            for (let x = 0; x < width; x++) {
                const idx = (yM + x) * 4;
                const rowSnowline = snowlineW + (snowlineE - snowlineW) * (x + 0.5) / width;

                // X Neighbors
                const xL = (x === 0 ? 0 : x - 1);
                const xR = (x === width - 1 ? width - 1 : x + 1);

                // Fetch Z logic inlined or helper (helper optimizes poorly in some JS engines but keeps code dry)
                // Inlining for max perf in worker
                const getZ = (baseIdx: number) => (data[baseIdx] * 256 + data[baseIdx + 1] + data[baseIdx + 2] * 0.00390625) - 32768;

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

                    // 高程山势增强：山势拔地而起，平原（<400m）保持平坦开阔，山地（>800m~3000m）巍峨挺拔
                    const elevBoost = Math.min(1.35, Math.max(1.0, 1.0 + Math.max(0, zC - 400) * 0.00015));

                    // 局部二阶曲率/拉普拉斯高程差（山脊正、冲沟负；绝对平原趋近于 0）
                    const pzAvg = (pzTL + pzT + pzTR + pzL + pzR + pzBL + pzB + pzBR) * 0.125;
                    const lap = zC - pzAvg;

                    // 综合坡度强度（结合 1 像素高频与 3 像素中频）
                    const slope1Sq = dzdx1 * dzdx1 + dzdy1 * dzdy1;
                    const slope3Sq = dzdx3 * dzdx3 + dzdy3 * dzdy3;
                    const slopeMag = Math.max(Math.sqrt(slope1Sq), Math.sqrt(slope3Sq));

                    // 微地形细节门控（真实坡度与起伏驱动，消除低海拔丘陵断崖的一刀切磨皮模糊）：
                    // 1. 高海拔自然全细节（>400m 的中山与高山）
                    const elevWeight = Math.max(0, Math.min(1, (zC - 250) / 250));
                    // 2. 真实坡度/起伏度贡献：平原（slopeMag < 0.008, |lap| < 0.6m）为 0；
                    //    海峡两岸低矮丘陵/断崖（加里波利半岛、特洛伊台地等 slopeMag 0.012~0.035 或 |lap| 0.6~2.6m）平滑激活至 1.0
                    const slopeWeight = Math.max(0, Math.min(1, (slopeMag - 0.008) / 0.024));
                    const lapWeight = Math.max(0, Math.min(1, (Math.abs(lap) - 0.6) / 2.0));
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

                    const gx = (effDzdx1 * 3.6 * 0.55 * fineWeight + effDzdx3 * 5.8 * (1 - 0.55 * fineWeight)) * zScale * elevBoost;
                    const gy = (effDzdy1 * 3.6 * 0.55 * fineWeight + effDzdy3 * 5.8 * (1 - 0.55 * fineWeight)) * zScale * elevBoost;

                    const norm = Math.sqrt(gx * gx + gy * gy + 1.0);
                    const normX = -gx / norm, normY = -gy / norm, normZ = 1.0 / norm;
                    surfaceNormZ = normZ;

                    const illumP = Math.max(0, normX * lxP + normY * lyP + normZ * lzP);
                    const illumS = Math.max(0, normX * lxS + normY * lyS + normZ * lzS);
                    const illum = illumP * 0.75 + illumS * 0.25;

                    const ridge = Math.min(0.32, Math.max(0, lap * 0.018)) * fineWeight;
                    const cavity = Math.min(0.42, Math.max(0, -lap * 0.022)) * fineWeight;

                    const ambient = 0.36;
                    const contrastIllum = Math.pow(illum, 1.18);
                    const flatIllum = lzP * 0.75 + lzS * 0.25;
                    const flatShade = ambient + 0.84 * Math.pow(flatIllum, 1.18);
                    let expShade = ((ambient + 0.84 * contrastIllum) / flatShade) * (1.0 - cavity * 0.55) * (1.0 + ridge * 0.55);
                    // 高海拔天空散射光通透度（消除4000m+高山深谷死黑阴影，呈现通透岩壁立体质感）
                    const minShade = zC > 3500 ? Math.min(0.40, 0.28 + (zC - 3500) * 0.00006) : 0.28;
                    expShade = Math.max(minShade, Math.min(1.42, expShade));

                    shadeFactor = 1 + (expShade - 1) * params.opacity;
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
                    // 🔴 9-18 主人令「降低平原黄绿反差」：低地草地（含干草 gr7，它和青草交错正是黄绿反差的来源）保持 0.35 不动；
                    //    只有沙地（pal/qs 等）不存在黄绿反差问题，按沙地程度提到 0.60，让贴图成为主色。
                    const lowBlend = 0.35 + 0.25 * sandiness;
                    const baseBlend = colorZ < 400 ? lowBlend : Math.min(0.60, lowBlend + (colorZ - 400) * 0.0002);
                    // 林线以上低地平原植被自然退隐，让位给高山植被与高寒裸岩
                    const alpineTreeFade = 1.0 - alpineT * 0.55;
                    const blend = baseBlend * snowFade * alpineTreeFade * climateMat[idx + 3] / 255;
                    r += (climateMat[idx] - r) * blend;
                    g += (climateMat[idx + 1] - g) * blend;
                    b += (climateMat[idx + 2] - b) * blend;
                }

                if (isLand && matTapA) {
                    // ① 山地与高山自然带：900m 起中山植被渐入；林线以上转为高寒草甸与碎屑流
                    const mont = rampWorker(colorZ, 900, 2200) * 0.38 * snowFade;
                    const montWeight = Math.max(mont, alpineT * 0.52 * snowFade);
                    if (montWeight > 0) {
                        if (mix2(texGr4, humidity * 0.7, texDs5, aridity + 0.3 * (1 - humidity), p)) {
                            r += (TX[0] - r) * montWeight; g += (TX[1] - g) * montWeight; b += (TX[2] - b) * montWeight;
                        }
                    }
                    // ② 沙漠成片：干旱低中海拔，按低频噪声成片铺橙色沙（热带 des，温带 pm2）
                    const patch = matPatch![p];
                    const desert = sandiness > 0.3 && colorZ < 2600
                        ? rampWorker(sandiness, 0.3, 0.9) * rampWorker(patch, 0.40, 0.70) * 0.55 * snowFade * rampWorker(colorZ, 60, 140) : 0;
                    if (desert > 0 && sampleTex(absLat < 34 ? texDes : texPm2, p)) {
                        r += (TX[0] - r) * desert; g += (TX[1] - g) * desert; b += (TX[2] - b) * desert;
                    }
                    // ③ 热带稀树草原：南北回归线附近、半干旱、2000m 以下
                    const savanna = absLat < 24 && colorZ < 2000 && sandiness < 0.5
                        ? (1 - rampWorker(absLat, 18, 24)) * Math.max(0, 1 - Math.abs(aridity - 0.55) / 0.35) * (0.25 + 0.25 * patch) : 0;
                    if (savanna > 0 && mix2(texPc1, 1 - patch, texPc2, patch, p)) {
                        r += (TX[0] - r) * savanna; g += (TX[1] - g) * savanna; b += (TX[2] - b) * savanna;
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

                // ④ 坡面露岩与高山裸岩带：
                // A. 坡面露岩：坡度 0.10（约 5.7°）起露岩，0.42（约 23°）以上陡崖以岩石为主；
                // B. 高山裸岩带：林线以上随海拔升高土层变薄，高寒冰劈风化露岩；雪线下方 500m 内即使缓坡也露出岩石基底。
                if (isLand && matTapA && texRck) {
                    const slopeT = Math.max(0, Math.min(1, (slopeGrad - 0.10) / 0.32));
                    const alpineRock = alpineT * rampWorker(colorZ, rowSnowline - 750, rowSnowline - 150) * Math.max(0.30, Math.min(1.0, slopeGrad / 0.08));
                    const rockT = Math.max(slopeT, alpineRock);
                    if (rockT > 0 && sampleTex(texRck, p)) {
                        const rockMax = 0.60 + 0.30 * Math.max(0, Math.min(1, (zC - 1200) / 1600));
                        const w = rockT * rockT * (3 - 2 * rockT) * rockMax * snowFade;
                        const grey = TX[0] * 0.299 + TX[1] * 0.587 + TX[2] * 0.114;
                        let tr = (TX[0] + (grey - TX[0]) * 0.40) * 0.94;
                        let tg = (TX[1] + (grey - TX[1]) * 0.40) * 0.94;
                        let tb = (TX[2] + (grey - TX[2]) * 0.40) * 0.94 + 4;
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

                // 真实高山雪线与常年冰川着色（严格符合欧亚大陆自然地理学规律）
                if (zC > rowSnowline - 250) {
                    // 进入雪线过渡带：前 250m 为冰碛岩石与雪融过渡区，向上过渡为深厚积雪
                    const snowT = Math.min(1.0, (zC - (rowSnowline - 250)) / 450);

                    // 陡峭山体物理排雪（陡崖坡度 > 45° 时露出冷板岩裸岩，形成角峰与刃脊）
                    let snowCover = 1.0;
                    if (paddedDem) {
                        const steepness = Math.max(0, Math.min(1.0, (0.72 - surfaceNormZ) * 4.5));
                        snowCover = 1.0 - steepness * 0.65;
                    }
                    const finalSnow = snowT * snowCover;

                    // 冰川积雪高反照率底色（微泛高寒冷青）；🔴 [2026-09-30] 叠 DE 雪地贴图 sno 的纹理（35%），不再是一片死白
                    let snowR = 250, snowG = 252, snowB = 255;
                    if (sampleTex(texSno, yM + x)) {
                        snowR += (TX[0] * 1.12 - snowR) * 0.35; snowG += (TX[1] * 1.12 - snowG) * 0.35; snowB += (Math.min(255, TX[2] * 1.12) - snowB) * 0.35;
                    }
                    // 雪线附近（snowT < 0.6）先铺残雪：湿润区 snf（雪夹土），干旱高原 snd（雪夹沙）
                    const patchyW = (1 - rampWorker(snowT, 0.2, 0.6));
                    if (patchyW > 0 && mix2(texSnf, humidity, texSnd, aridity, yM + x)) {
                        snowR += (TX[0] - snowR) * patchyW; snowG += (TX[1] - snowG) * patchyW; snowB += (TX[2] - snowB) * patchyW;
                    }
                    r = r * (1 - finalSnow) + snowR * finalSnow;
                    g = g * (1 - finalSnow) + snowG * finalSnow;
                    b = b * (1 - finalSnow) + snowB * finalSnow;
                }

                // 高山雪峰冰棱与山脊微高光（只作用于雪线以上山脊）
                if (zC > rowSnowline && curvature > 1.2) {
                    const rStr = Math.min(0.45, (curvature - 1.2) * 0.08);
                    const invR = 1 - rStr;
                    r = r * invR + 255 * rStr;
                    g = g * invR + 255 * rStr;
                    b = b * invR + 255 * rStr;
                }

                // 🔴 [2026-09-30] 阳坡偏暖、阴坡偏冷（制图常用手法，只作用于陆地），加强立体感
                if (!isWater && zC > 0) {
                    const lit = Math.max(-0.5, Math.min(0.4, shadeFactor - 1));
                    const k = lit * 0.12;
                    r *= 1 + k;
                    b *= 1 - k;
                }

                let outR = r * shadeFactor;
                let outG = g * shadeFactor;
                let outB = b * shadeFactor;

                // 瑞士制图学天光散射（Imhof relief fill）：背阴山坡不陷入死黑，由清透冷调天光（瑞利散射）填充，
                // 既保持阴阳立体反差，又让谷地与山脊背阴面纹理清晰可辨、质感通透巍峨。
                if (!isWater && zC > 0 && shadeFactor < 0.95) {
                    const shadowDepth = (0.95 - shadeFactor) / 0.95;
                    const elevSky = Math.min(1.0, 0.60 + Math.max(0, zC) * 0.00015);
                    const skyW = shadowDepth * shadowDepth * 0.22 * elevSky;
                    outR += (130 - outR) * skyW * 0.35;
                    outG += (160 - outG) * skyW * 0.45;
                    outB += (195 - outB) * skyW * 0.70;
                }

                output[idx] = Math.min(255, Math.max(0, outR));
                output[idx + 1] = Math.min(255, Math.max(0, outG));
                output[idx + 2] = Math.min(255, Math.max(0, outB));
                output[idx + 3] = 255;
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

                const getZ = (baseIdx: number) => (data[baseIdx] * 256 + data[baseIdx + 1] + data[baseIdx + 2] * 0.00390625) - 32768;

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
        const resp = await fetch(req.url, { mode: 'cors', signal: AbortSignal.timeout(8000) });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const srcBitmap = await createImageBitmap(await resp.blob());
        const canvas = new OffscreenCanvas(req.width, req.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | null;
        if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable');
        ctx.drawImage(srcBitmap, 0, 0, req.width, req.height);
        srcBitmap.close();

        const src = ctx.getImageData(0, 0, req.width, req.height).data;
        // 先把「水面高度」的海像素填成真实水深，后面的颜色、光影、掩膜判断都用填好的高程（见 fillSurfaceSea）
        if (req.coords && req.width === 256 && req.height === 256) {
            const dem0 = new Float32Array(256 * 256);
            for (let i = 0; i < dem0.length; i++) dem0[i] = src[i * 4] * 256 + src[i * 4 + 1] + src[i * 4 + 2] / 256 - 32768;
            if (await fillSurfaceSea(dem0, req.coords.z, req.coords.x, req.coords.y)) writeTerrarium(src, dem0);
        }

        // 只有本瓦片含海平面以下像素或启用河谷冲积试验时取掩膜。内陆瓦片直接跳过，
        // 沿海/海域/试验瓦片才多等一次，且有超时兜底，保证河流与湖泊保持纯净水色。
        const hasBelowSea = hasBelowSeaPixel(src, req.width * req.height);
        const mayHaveLake = !hasBelowSea && countFlatLandPixels(src, req.width, req.height, LAKE_FLAT_PIXELS) >= LAKE_FLAT_PIXELS;
        const needMask = hasBelowSea || mayHaveLake || !!req.valleyReliefExp;
        // 规则贴图在高程解码后立即开拉，与水体掩膜下载并行（「会去取掩膜」是「有水」的必要条件，按它判宁多勿漏）
        resolveRules(pickRuleTextures(src, hasBelowSea || mayHaveLake, req));
        const mask = needMask
            ? await fetchWaterMask(req.waterMaskUrl, req.width, req.height)
            : null;

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

        const paddedDem = req.experimentalRelief && req.coords && req.coords.z >= 7 && req.coords.z <= 12
            ? await getPaddedDem(src, req.coords) : null;

        const [material, parentDem, caspianDem] = await Promise.all([materialPending, parentDemPending, caspianDemPending]);
        // 干旱瓦片才要河流绿带（河流线段由主线程发来，见 setRiverSegments）
        let riverStrip: Float32Array | null = null;
        if (material && req.tileBounds) {
            let maxArid = 0;
            for (let i = 0; i < material.arid.length; i += 64) if (material.arid[i] > maxArid) maxArid = material.arid[i];
            if (maxArid >= 0.6 && await waitRivers()) riverStrip = computeRiverStrip(req.tileBounds, req.width, req.height);
        }
        const renderStart = performance.now();
        const output = renderHillshade(src, req, mask, material, paddedDem, parentDem, caspianDem, riverStrip);
        const renderMs = performance.now() - renderStart;
        const bitmap = await createImageBitmap(new ImageData(output, req.width, req.height));

        // Cast to any to avoid TS matching Window.postMessage instead of Worker.postMessage
        (self as any).postMessage({ id: req.id, bitmap, materialBytes: getMaterialBytes(), renderMs } as HillshadeResponse, [bitmap]);
    } catch (err) {
        (self as any).postMessage({ id: req.id, error: String(err) } as HillshadeResponse);
    }
};
