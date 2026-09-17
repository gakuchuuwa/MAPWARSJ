/**
 * HillshadeWorker.ts
 * Offloads heavy terrain math to a background thread
 */

import { buildWaterMask, isDefectGrayTile } from '../world/land-sea/WaterMask';
import { createTerrainMaterial, getMaterialBytes } from '../map/StrategicTerrainMaterial';
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
        const resp = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(4000) });
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
    const sandBeige = [168, 172, 136];      // 1000m 中山林地到浅暖岩过渡 (温润通透)
    const loessYellow = [186, 178, 142];    // 1300m 中高山温润暖岩石基底
    const loessMid = [188, 178, 146];       // 2500m 亚高山暖石基底
    // [HIGHLAND-EARTH-REV2] 高原与高山温润通透大地色阶（自然地理真实性校准）
    // 2500m-3500m: 亚高山林线至高原河谷草甸，温润通透带微草绿意(林芝/雅江河谷农耕沃土)
    // 3500m-4500m: 高原广袤草场与高寒草甸，明朗金黄与浅驼大地色(拉萨河谷/纳木错圣湖周边)
    // 4500m-5300m: 高寒草原与荒漠碎屑坡，风化暖赭色与浅砂岩色
    // 5300m-5600m: 亚高山裸露风化岩山，暖调砂岩与花岗岩色
    // 5600m+: 亚雪线冰碛碎石，由真实动态雪线覆盖连绵白雪冰川
    const valleyMeadow = [178, 180, 144];   // ~3200m 高原河谷温润高山草甸(带温和草木生机)
    const alpineSteppe = [192, 182, 145];   // ~3800m 高原草甸金黄(明朗温润)
    const highlandPlains = [182, 172, 142]; // ~4400m 高原广袤草原浅驼金(明朗开阔)
    const highlandDesert = [170, 160, 136]; // ~4900m 高寒荒漠暖赭色碎屑坡
    const subnivalRock = [152, 144, 132];   // ~5300m 亚高山暖调花岗岩石
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
        else if (elev < 1000) lerpColor(lowlandEnd, sandBeige, (elev - 400) / 600, lut, offset);
        else if (elev < 1300) lerpColor(sandBeige, loessYellow, (elev - 1000) / 300, lut, offset);
        else if (elev < 2500) lerpColor(loessYellow, loessMid, (elev - 1300) / 1200, lut, offset);
        else if (elev < 3200) lerpColor(loessMid, valleyMeadow, (elev - 2500) / 700, lut, offset);
        else if (elev < 3800) lerpColor(valleyMeadow, alpineSteppe, (elev - 3200) / 600, lut, offset);
        else if (elev < 4400) lerpColor(alpineSteppe, highlandPlains, (elev - 3800) / 600, lut, offset);
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
        if (dem) tiles.set(`${dx}/${dy}`, dem);
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
    material: Uint8ClampedArray | null = null,
    paddedDem: Float32Array | null = null,
    parentDem: Float32Array | null = null,
    caspianDem: Float32Array | null = null,
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
            const latDeg = Math.abs(rowLat);
            // 自然地理学真实自然雪线高度（米，全球 12 大山系实地校准）：
            // 1. 全球海洋/温湿基准雪线 (低纬度 ~5100m，中高纬度每度下降 115m；阿尔卑斯 2800~3100m，挪威 1100~1400m)
            let rowSnowline = 5100;
            if (latDeg > 28) {
                rowSnowline = 5100 - (latDeg - 28) * 115;
            }
            rowSnowline = Math.max(700, rowSnowline);

            // 2. 温带内陆干燥大陆度修正 (天山、阿勒泰、中亚、伊朗，降水减少使雪线自然抬升 300~350m)
            if (tileCenterLng > 45 && tileCenterLng < 105 && rowLat >= 30 && rowLat <= 55) {
                rowSnowline += 350;
            }

            // 3. 青藏高原“第三极”世界最高巨大高原面热岛效应与喜马拉雅极旱雨影抬升 (Mass Elevation Effect)
            // 覆盖青藏高原腹地 (75°E~103°E, 27.2°N~38.0°N)
            // 产生约 +480m 的自然雪线抬升，常年永久雪线稳定于 5550m~5750m：
            // 既彻底释放 4000~5000m 的广大高原草甸与湖盆沃土，又完整保留念青唐古拉、唐古拉与喜马拉雅等 5600m+ 冰川雪山神峰
            if (tileCenterLng >= 75 && tileCenterLng <= 103 && rowLat >= 27.2 && rowLat <= 38.0) {
                const dLng = (tileCenterLng - 88.5) / 13.5;
                const dLat = (rowLat - 32.8) / 5.2;
                const dist2 = dLng * dLng + dLat * dLat;
                if (dist2 < 1.0) {
                    const tibetBoost = (1.0 - dist2 * 0.25) * 480;
                    // 喜马拉雅南坡过渡 (27.2°~28.6°N)：南坡受印度洋季风暴雪影响雪线低，翻过山脊向北极旱
                    let southGradient = 1.0;
                    if (rowLat < 28.6) {
                        southGradient = Math.max(0, (rowLat - 27.2) / 1.4);
                    }
                    rowSnowline += tibetBoost * southGradient;
                }
            }

            for (let x = 0; x < width; x++) {
                const idx = (yM + x) * 4;

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

                const slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy) / divisor);
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
                    const fineWeight = Math.max(elevWeight, reliefWeight);

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
                if (material && colorZ > 0 && material[idx + 3] > 0) {
                    const snowFade = Math.max(0, Math.min(1, (rowSnowline - colorZ) / 500));
                    const blend = 0.60 * snowFade * material[idx + 3] / 255;
                    r += (material[idx] - r) * blend;
                    g += (material[idx + 1] - g) * blend;
                    b += (material[idx + 2] - b) * blend;
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

                    // 冰川积雪高反照率纯白底色（微泛高寒冷青）
                    const snowR = 250, snowG = 252, snowB = 255;
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

                output[idx] = r * shadeFactor;
                output[idx + 1] = g * shadeFactor;
                output[idx + 2] = b * shadeFactor;
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

self.onmessage = async (e: MessageEvent<HillshadeRequest>) => {
    const req = e.data;
    try {
        initLUTs();
        if (!colorLUT || !noiseLUT) throw new Error('LUT init failed');

        const materialPending = req.params.useElevationColor && req.tileBounds
            ? createTerrainMaterial(req.tileBounds, req.width, req.height).catch(() => null)
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

        // 只有本瓦片含海平面以下像素或启用河谷冲积试验时取掩膜。内陆瓦片直接跳过，
        // 沿海/海域/试验瓦片才多等一次，且有超时兜底，保证河流与湖泊保持纯净水色。
        const needMask = hasBelowSeaPixel(src, req.width * req.height) || !!req.valleyReliefExp;
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
        const renderStart = performance.now();
        const output = renderHillshade(src, req, mask, material, paddedDem, parentDem, caspianDem);
        const renderMs = performance.now() - renderStart;
        const bitmap = await createImageBitmap(new ImageData(output, req.width, req.height));

        // Cast to any to avoid TS matching Window.postMessage instead of Worker.postMessage
        (self as any).postMessage({ id: req.id, bitmap, materialBytes: getMaterialBytes(), renderMs } as HillshadeResponse, [bitmap]);
    } catch (err) {
        (self as any).postMessage({ id: req.id, error: String(err) } as HillshadeResponse);
    }
};
