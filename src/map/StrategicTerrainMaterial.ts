import { queryBaseTile, setWorldBaseData } from '../ui/scene13/WorldBaseMap';

type Bounds = { north: number; south: number; west: number; east: number };
export type MaterialNode = ReadonlyArray<{ pixels: Uint8ClampedArray; weight: number }>;
const SIZE = 128;
const STEP = 64;
// 世界查找图 + 气候贴图与地形规则贴图（128px 缩小版含 mip）；只存像素，解码位图立即释放。
// 🔴 [2026-09-30] 12MB → 16MB：世界气候图 8.9MB + 气候贴图约 20 张 + 地形规则贴图 25 张（每张含 mip 约 85KB）
export const MATERIAL_BUDGET_BYTES = 16 * 1024 * 1024;
const textures = new Map<string, Promise<Uint8ClampedArray | null>>();
let worldReady: Promise<boolean> | undefined;
let worldWidth = 0, worldHeight = 0;
let residentBytes = 0;
export const getMaterialBytes = (): number => residentBytes;

async function readPixels(url: string, size?: number): Promise<ImageData> {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error(`Material HTTP ${response.status}: ${url}`);
    const bitmap = await createImageBitmap(await response.blob());
    try {
        const canvas = new OffscreenCanvas(size ?? bitmap.width, size ?? bitmap.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Material canvas unavailable');
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } finally {
        bitmap.close();
    }
}

function loadWorld(): Promise<boolean> {
    return worldReady ??= readPixels('/world/world-base.png').then(image => {
        if (image.data.byteLength > MATERIAL_BUDGET_BYTES - 48 * SIZE * SIZE * 4) return false;
        setWorldBaseData(image.data, image.width, image.height);
        worldWidth = image.width;
        worldHeight = image.height;
        residentBytes += image.data.byteLength;
        return true;
    }).catch(() => false);
}

function loadTexture(name: string): Promise<Uint8ClampedArray | null> {
    let pending = textures.get(name);
    if (!pending) {
        pending = readPixels(`/SUCAI_TERRAIN/${name}.png`, SIZE).then(image => {
            // mip 链（64/32/16/8）约占原图 1/3，一并计入预算
            const bytes = Math.ceil(image.data.byteLength * 4 / 3);
            if (residentBytes + bytes > MATERIAL_BUDGET_BYTES) return null;
            residentBytes += bytes;
            return image.data;
        }).catch(() => null);
        textures.set(name, pending);
    }
    return pending;
}

/** 在全球气候像素中心之间连续插值；经度环绕，南北极钳制。 */
export function sampleClimateMaterials(
    lat: number, lng: number, width: number, height: number,
    lookup: (lat: number, lng: number) => string | null,
): Map<string, number> {
    const px = (lng + 180) / 360 * width - 0.5;
    const py = (90 - lat) / 180 * height - 0.5;
    const x0 = Math.floor(px), y0 = Math.floor(py);
    const fx = px - x0, fy = py - y0;
    const result = new Map<string, number>();
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const x = ((x0 + dx) % width + width) % width;
        const y = Math.max(0, Math.min(height - 1, y0 + dy));
        const name = lookup(90 - (y + 0.5) / height * 180, (x + 0.5) / width * 360 - 180);
        const weight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy);
        if (name && weight > 0) result.set(name, (result.get(name) ?? 0) + weight);
    }
    return result;
}

/** 连续、确定的地理噪声；共享经纬度取相同值，不以瓦片为单位重复。 */
function groundNoise(lat: number, lng: number, cells: number): number {
    const x = (((lng + 180) % 360 + 360) % 360) / 360 * cells;
    const y = (lat + 90) / 360 * cells;
    const ix = Math.floor(x), iy = Math.floor(y);
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    const hash = (cx: number, cy: number) => {
        let h = Math.imul(((cx % cells) + cells) % cells, 374761393)
            ^ Math.imul(cy, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };
    const a = hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx;
    const b = hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx;
    return a * (1 - fy) + b * fy;
}

/** 只调整战略地图温带地表的视觉混合，不改世界查找表及战术地形。 */
export function varyTemperateMaterials(
    materials: Map<string, number>, lat: number, lng: number,
): Map<string, number> {
    if (!['grs', 'gr2', 'for'].some(name => materials.has(name))) return materials;
    // 大片聚散中叠加较小变化；二维格点噪声避免平行正弦条带。
    const variation = groundNoise(lat, lng, 180) * 0.55
        + groundNoise(lat, lng, 540) * 0.30
        + groundNoise(lat, lng, 1440) * 0.15;
    const result = new Map<string, number>();
    const add = (name: string, weight: number) => result.set(name, (result.get(name) ?? 0) + weight);
    for (const [name, weight] of materials) {
        if (name === 'for') {
            // 林下保留土色，局部透出草色，弱化整片黄褐色的边界。
            const grass = 0.28 + variation * 0.30;
            add(name, weight * (1 - grass));
            add('gr2', weight * grass);
        } else if (name === 'grs' || name === 'gr2') {
            // 两张现有温带草地同色系互混，形成柔和的枯绿变化。
            const alternate = name === 'grs' ? 0.18 + variation * 0.25 : 0.08 + variation * 0.22;
            add(name, weight * (1 - alternate));
            add(name === 'grs' ? 'gr2' : 'grs', weight * alternate);
        } else {
            add(name, weight);
        }
    }
    return result;
}

/**
 * 贴图按**地理坐标**取样（2026-09-30 主人令「全面修复」地形呈现）。
 *
 * 旧写法 `x % 128`：每 128 个**屏幕**像素重复一次 ——
 *   ① 缩放时纹理跟着放大缩小（地面「呼吸」）；
 *   ② 每块 256px 瓦片里是同一张图拼 2×2，华北平原上看得出方格（scratch/terrain_ab/out/plain_before.png）。
 * 现在：纹理坐标 = 全局墨卡托像素（换算到 zoom 9）÷ 周期，同一片地面在任何缩放、任何瓦片里取到同一处纹理；
 *   两套不同周期、不同偏移的取样用低频噪声交替（texture bombing），打散重复感；
 *   缩小时换用降采样纹理（mip），放大时双线性，避免闪烁与马赛克。
 */
export type MaterialOrigin = {
    /** 本瓦片左上角的全局墨卡托像素坐标，已换算到 zoom 9 */
    gx9: number; gy9: number;
    /** 每个屏幕像素 = 多少个 zoom 9 像素（2^(9-z)） */
    scale: number;
};
/** zoom 9 下纹理一个周期占多少像素；非 2 的幂，避免与 256px 瓦片网格对齐 */
const PERIOD_A = 160;
const PERIOD_B = 117;
const OFFSET_B: readonly [number, number] = [53.7, 91.3];
/** 两套取样交替的噪声格（zoom 9 像素） */
const BOMB_CELL = 280;
const MIP_MIN = 8;
const mipCache = new WeakMap<Uint8ClampedArray, Uint8ClampedArray[]>();

function mipsOf(base: Uint8ClampedArray): Uint8ClampedArray[] {
    let mips = mipCache.get(base);
    if (mips) return mips;
    mips = [base];
    let size = SIZE, src = base;
    while (size > MIP_MIN) {
        const half = size >> 1;
        const dst = new Uint8ClampedArray(half * half * 4);
        for (let y = 0; y < half; y++) for (let x = 0; x < half; x++) {
            const o = (y * half + x) * 4;
            const a = ((2 * y) * size + 2 * x) * 4, b = a + 4, c = a + size * 4, d = c + 4;
            for (let k = 0; k < 4; k++) dst[o + k] = (src[a + k] + src[b + k] + src[c + k] + src[d + k] + 2) >> 2;
        }
        mips.push(dst);
        src = dst; size = half;
    }
    mipCache.set(base, mips);
    return mips;
}

function hash2(ix: number, iy: number): number {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** 平滑值噪声，输入是 zoom 9 全局像素坐标，跨瓦片、跨缩放连续 */
function bombWeight(x9: number, y9: number): number {
    const x = x9 / BOMB_CELL, y = y9 / BOMB_CELL;
    const ix = Math.floor(x), iy = Math.floor(y);
    const s = (t: number) => t * t * (3 - 2 * t);
    const fx = s(x - ix), fy = s(y - iy);
    const a = hash2(ix, iy) * (1 - fx) + hash2(ix + 1, iy) * fx;
    const b = hash2(ix, iy + 1) * (1 - fx) + hash2(ix + 1, iy + 1) * fx;
    // 拉开对比：大部分地方以一套取样为主，只在过渡带两套相混（相混处纹理对比会被平均掉）
    const v = (a * (1 - fy) + b * fy - 0.5) * 2.2 + 0.5;
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * 一个轴向的取样表。纹理坐标只随 x（或只随 y）变化，所以每块瓦片先把行表、列表算好，
 * 逐像素只查表（旧的逐像素取模/取整让每块瓦片从 4ms 涨到 61ms，实测 scratch/terrain_ab/bench.mts）。
 */
type AxisTable = { near: Int32Array; i0: Int32Array; i1: Int32Array; f: Float32Array };

function axisTable(start9: number, count: number, scale: number, period: number, size: number): AxisTable {
    const near = new Int32Array(count), i0 = new Int32Array(count), i1 = new Int32Array(count), f = new Float32Array(count);
    for (let k = 0; k < count; k++) {
        let u = (start9 + (k + 0.5) * scale) / period * size - 0.5;
        u = ((u % size) + size) % size;
        const fl = Math.floor(u);
        i0[k] = fl % size; i1[k] = (fl + 1) % size; f[k] = u - fl;
        near[k] = f[k] < 0.5 ? i0[k] : i1[k];
    }
    return { near, i0, i1, f };
}

/** 交替权重在 16px 粗网格上算、网格内线性插值；网格点取全局坐标，相邻瓦片共用同一批点，无接缝 */
const BOMB_STEP = 16;

/** 缩小倍数对应的 mip 档：保证每个屏幕像素不超过约 1 个纹素 */
export function materialMipLevel(scale: number): number {
    const maxLevel = Math.log2(SIZE / MIP_MIN);
    const level = Math.round(Math.log2(Math.max(1, scale)));
    return Math.min(maxLevel, Math.max(0, level));
}

/**
 * 在共享采样节点间混合材质，避免气候块边缘和相邻瓦片出现硬接缝。
 * 节点权重仍按屏幕网格（STEP）插值；纹理像素按 origin 给出的地理坐标取样。
 * 缩小（zoom ≤ 9）取最近纹素（与旧版同），放大（zoom ≥ 10）双线性。
 */
export function blendMaterialGrid(
    grid: MaterialNode[], columns: number, width: number, height: number,
    origin: MaterialOrigin = { gx9: 0, gy9: 0, scale: 1 },
): Uint8ClampedArray<ArrayBuffer> {
    const output = new Uint8ClampedArray(width * height * 4);
    // 本瓦片用到的纹理去重，节点权重转成定长向量，逐像素只做一次向量插值
    const texList: Uint8ClampedArray[][] = [];
    const texIndex = new Map<Uint8ClampedArray, number>();
    for (const node of grid) for (const sample of node) {
        if (!texIndex.has(sample.pixels)) { texIndex.set(sample.pixels, texList.length); texList.push(mipsOf(sample.pixels)); }
    }
    const T = texList.length;
    if (T === 0) return output;
    const nodeW = new Float32Array(grid.length * T);
    grid.forEach((node, n) => { for (const sample of node) nodeW[n * T + texIndex.get(sample.pixels)!] += sample.weight; });

    const level = materialMipLevel(origin.scale);
    const size = SIZE >> level;
    const bilinear = origin.scale < 1;
    const ax = axisTable(origin.gx9, width, origin.scale, PERIOD_A, size);
    const ay = axisTable(origin.gy9, height, origin.scale, PERIOD_A, size);
    const bx = axisTable(origin.gx9 + OFFSET_B[0], width, origin.scale, PERIOD_B, size);
    const by = axisTable(origin.gy9 + OFFSET_B[1], height, origin.scale, PERIOD_B, size);
    const bombCols = Math.ceil(width / BOMB_STEP) + 1, bombRows = Math.ceil(height / BOMB_STEP) + 1;
    const bomb = new Float32Array(bombCols * bombRows);
    for (let j = 0; j < bombRows; j++) for (let i = 0; i < bombCols; i++) {
        bomb[j * bombCols + i] = bombWeight(origin.gx9 + i * BOMB_STEP * origin.scale, origin.gy9 + j * BOMB_STEP * origin.scale);
    }
    const wPix = new Float32Array(T);
    const texs = texList.map(m => m[level]);

    for (let y = 0; y < height; y++) {
        const gy = Math.floor(y / STEP), fy = (y % STEP) / STEP;
        const by0 = Math.floor(y / BOMB_STEP), bfy = (y % BOMB_STEP) / BOMB_STEP;
        const rowA = ay.near[y] * size, rowB = by.near[y] * size;
        const rowA0 = ay.i0[y] * size, rowA1 = ay.i1[y] * size, fAy = ay.f[y];
        const rowB0 = by.i0[y] * size, rowB1 = by.i1[y] * size, fBy = by.f[y];
        for (let x = 0; x < width; x++) {
            const gx = Math.floor(x / STEP), fx = (x % STEP) / STEP;
            const n00 = (gy * columns + gx) * T, n10 = n00 + T, n01 = n00 + columns * T, n11 = n01 + T;
            const c00 = (1 - fx) * (1 - fy), c10 = fx * (1 - fy), c01 = (1 - fx) * fy, c11 = fx * fy;
            let weight = 0;
            for (let t = 0; t < T; t++) {
                const w = nodeW[n00 + t] * c00 + (c10 > 0 ? nodeW[n10 + t] * c10 : 0)
                    + (c01 > 0 ? nodeW[n01 + t] * c01 : 0) + (c11 > 0 ? nodeW[n11 + t] * c11 : 0);
                wPix[t] = w; weight += w;
            }
            if (weight === 0) continue;
            const bx0 = Math.floor(x / BOMB_STEP), bfx = (x % BOMB_STEP) / BOMB_STEP;
            const bi = by0 * bombCols + bx0;
            const bw = (bomb[bi] * (1 - bfx) + bomb[bi + 1] * bfx) * (1 - bfy)
                + (bomb[bi + bombCols] * (1 - bfx) + bomb[bi + bombCols + 1] * bfx) * bfy;
            let r = 0, g = 0, b = 0;
            if (!bilinear) {
                const iA = (rowA + ax.near[x]) * 4, iB = (rowB + bx.near[x]) * 4;
                for (let t = 0; t < T; t++) {
                    const w = wPix[t];
                    if (w <= 0) continue;
                    const px = texs[t];
                    const wa = w * (1 - bw), wb = w * bw;
                    r += px[iA] * wa + px[iB] * wb;
                    g += px[iA + 1] * wa + px[iB + 1] * wb;
                    b += px[iA + 2] * wa + px[iB + 2] * wb;
                }
            } else {
                const fAx = ax.f[x], fBx = bx.f[x];
                const a00 = (rowA0 + ax.i0[x]) * 4, a10 = (rowA0 + ax.i1[x]) * 4, a01 = (rowA1 + ax.i0[x]) * 4, a11 = (rowA1 + ax.i1[x]) * 4;
                const b00 = (rowB0 + bx.i0[x]) * 4, b10 = (rowB0 + bx.i1[x]) * 4, b01 = (rowB1 + bx.i0[x]) * 4, b11 = (rowB1 + bx.i1[x]) * 4;
                const wa00 = (1 - fAx) * (1 - fAy), wa10 = fAx * (1 - fAy), wa01 = (1 - fAx) * fAy, wa11 = fAx * fAy;
                const wb00 = (1 - fBx) * (1 - fBy), wb10 = fBx * (1 - fBy), wb01 = (1 - fBx) * fBy, wb11 = fBx * fBy;
                for (let t = 0; t < T; t++) {
                    const w = wPix[t];
                    if (w <= 0) continue;
                    const px = texs[t];
                    const wa = w * (1 - bw), wb = w * bw;
                    for (let k = 0; k < 3; k++) {
                        const va = px[a00 + k] * wa00 + px[a10 + k] * wa10 + px[a01 + k] * wa01 + px[a11 + k] * wa11;
                        const vb = px[b00 + k] * wb00 + px[b10 + k] * wb10 + px[b01 + k] * wb01 + px[b11 + k] * wb11;
                        const v = va * wa + vb * wb;
                        if (k === 0) r += v; else if (k === 1) g += v; else b += v;
                    }
                }
            }
            const target = (y * width + x) * 4;
            output[target] = r / weight;
            output[target + 1] = g / weight;
            output[target + 2] = b / weight;
            output[target + 3] = weight * 255;
        }
    }
    return output;
}

/** 瓦片坐标 → 地理取样原点（zoom 9 全局像素） */
export function materialOriginForTile(z: number, x: number, y: number): MaterialOrigin {
    const scale = 2 ** (9 - z);
    return { gx9: x * 256 * scale, gy9: y * 256 * scale, scale };
}

/**
 * 地形规则贴图（2026-09-30 主人令「多用帝国时代 2 素材，让战略地图色彩丰富」）。
 * 气候表只给出 20 种贴图（全球陆地面积前 5 种占约 60%）；下面这些由 Worker 按海拔/坡度/水深/纬度/海岸逐像素选用。
 * 实测清单：scratch/terrain_ab/tex_usage.mts；素材全部是 DE 本体 terrain/textures（已提取在 public/SUCAI_TERRAIN）。
 */
export const TERRAIN_RULE_TEXTURES = [
    'rck', 'rock_wet', 'gravel_wet',          // 坡面岩石：干岩 / 湿岩 / 湿碎石（寒冷海岸）
    'bch', 'bc2', 'beach_wet',                // 海岸：热带白沙 / 温带沙滩 / 湿沙
    'sno', 'snf', 'snd',                      // 雪线以上积雪 / 雪线附近残雪（带土、带沙）
    'ice', 'ic2',                             // 极地海冰
    'wt4', 'wt2', 'wtr', 'wt3', 'wt5',        // 海水：深海 → 近海 → 热带浅海
    'sha',                                    // 热带浅海礁
    'des', 'pm2',                             // 橙色沙漠 / 橙褐荒漠
    'pc1', 'pc2',                             // 热带稀树草原
    'gr4', 'ds5',                             // 山地：湿润区褐色山地草甸 / 干旱区碎石坡
] as const;
export type TerrainRuleTexture = typeof TERRAIN_RULE_TEXTURES[number];

/**
 * 气候贴图的干湿分类（按 DE 贴图本身的样子逐张定，不用颜色推 —— 林下落叶 for / 山地草甸 gr4 偏棕，
 * 按「红大于绿」推会被当成沙漠，实测在晋中盆地、挪威苔原冒出橙色沙斑）。
 * arid：0 湿润 ~ 1 极干；sand：是不是真沙地（只有它才铺成片的橙色沙）。未列出的按 arid 0.5 / sand 0。
 */
const CLIMATE_CLASS: Readonly<Record<string, { arid: number; sand: number }>> = {
    gr6: { arid: 0, sand: 0 }, gr2: { arid: 0, sand: 0 }, grs: { arid: 0.05, sand: 0 }, fo2: { arid: 0, sand: 0 },
    for: { arid: 0.1, sand: 0 }, underbrush_leaves: { arid: 0.1, sand: 0 }, sh4: { arid: 0, sand: 0 },
    gr3: { arid: 0.2, sand: 0 }, qs2: { arid: 0.2, sand: 0 }, gr4: { arid: 0.35, sand: 0 },
    gr7: { arid: 0.5, sand: 0 }, gr5: { arid: 0.6, sand: 0 }, rck: { arid: 0.7, sand: 0 },
    ds4: { arid: 0.75, sand: 0 }, gravel_default: { arid: 0.8, sand: 0 }, ds2: { arid: 0.8, sand: 0.25 },
    ds5: { arid: 0.9, sand: 0.1 }, pal: { arid: 1, sand: 1 }, pal1: { arid: 1, sand: 1 }, qs: { arid: 1, sand: 1 },
};

export type TerrainMaterial = {
    /** 气候地表（草/林/沙/雪…），alpha = 有效权重 */
    climate: Uint8ClampedArray<ArrayBuffer>;
    /** 逐像素干旱度 0~1、沙地程度 0~1（由气候贴图分类插值；无气候数据处为 0.5 / 0） */
    arid: Float32Array;
    sand: Float32Array;
    /** 每个像素在「A / B 两套地理取样」里的纹素字节下标，及两套交替权重；规则贴图共用 */
    tapA: Int32Array;
    tapB: Int32Array;
    bomb: Float32Array;
    /** 低频地理噪声 0~1（约 25km 一格），规则贴图做「成片」变化用；跨瓦片连续 */
    patch: Float32Array;
    /** 规则贴图（已按本瓦片 mip 档取好）；素材缺失时该键不存在 */
    tex: Partial<Record<TerrainRuleTexture, Uint8ClampedArray>>;
};

/** 规则贴图的逐像素取样表（最近纹素；zoom 10 放大时略粗，只影响海战） */
function buildTaps(width: number, height: number, origin: MaterialOrigin) {
    const level = materialMipLevel(origin.scale);
    const size = SIZE >> level;
    const ax = axisTable(origin.gx9, width, origin.scale, PERIOD_A, size);
    const ay = axisTable(origin.gy9, height, origin.scale, PERIOD_A, size);
    const bx = axisTable(origin.gx9 + OFFSET_B[0], width, origin.scale, PERIOD_B, size);
    const by = axisTable(origin.gy9 + OFFSET_B[1], height, origin.scale, PERIOD_B, size);
    const tapA = new Int32Array(width * height), tapB = new Int32Array(width * height);
    const bomb = new Float32Array(width * height), patch = new Float32Array(width * height);
    const bombCols = Math.ceil(width / BOMB_STEP) + 1, bombRows = Math.ceil(height / BOMB_STEP) + 1;
    const bg = new Float32Array(bombCols * bombRows), pg = new Float32Array(bombCols * bombRows);
    for (let j = 0; j < bombRows; j++) for (let i = 0; i < bombCols; i++) {
        const x9 = origin.gx9 + i * BOMB_STEP * origin.scale, y9 = origin.gy9 + j * BOMB_STEP * origin.scale;
        bg[j * bombCols + i] = bombWeight(x9, y9);
        pg[j * bombCols + i] = patchNoise(x9, y9);
    }
    for (let y = 0; y < height; y++) {
        const rowA = ay.near[y] * size, rowB = by.near[y] * size;
        const by0 = Math.floor(y / BOMB_STEP), bfy = (y % BOMB_STEP) / BOMB_STEP;
        for (let x = 0; x < width; x++) {
            const p = y * width + x;
            tapA[p] = (rowA + ax.near[x]) * 4;
            tapB[p] = (rowB + bx.near[x]) * 4;
            const bx0 = Math.floor(x / BOMB_STEP), bfx = (x % BOMB_STEP) / BOMB_STEP;
            const i = by0 * bombCols + bx0;
            bomb[p] = (bg[i] * (1 - bfx) + bg[i + 1] * bfx) * (1 - bfy) + (bg[i + bombCols] * (1 - bfx) + bg[i + bombCols + 1] * bfx) * bfy;
            patch[p] = (pg[i] * (1 - bfx) + pg[i + 1] * bfx) * (1 - bfy) + (pg[i + bombCols] * (1 - bfx) + pg[i + bombCols + 1] * bfx) * bfy;
        }
    }
    return { tapA, tapB, bomb, patch, level };
}

/** 成片变化用的低频噪声（两个倍频），输入 zoom 9 全局像素 */
function patchNoise(x9: number, y9: number): number {
    const one = (cell: number, seed: number) => {
        const x = x9 / cell + seed, y = y9 / cell - seed;
        const ix = Math.floor(x), iy = Math.floor(y);
        const s = (t: number) => t * t * (3 - 2 * t);
        const fx = s(x - ix), fy = s(y - iy);
        const a = hash2(ix, iy) * (1 - fx) + hash2(ix + 1, iy) * fx;
        const b = hash2(ix, iy + 1) * (1 - fx) + hash2(ix + 1, iy + 1) * fx;
        return a * (1 - fy) + b * fy;
    };
    return one(100, 17.3) * 0.65 + one(37, 5.1) * 0.35;
}

/**
 * @param ruleTextures 本瓦片用得到的规则贴图（Worker 解码高程、拿到水体掩膜后才知道，所以可传 Promise）。
 *   🔴 [2026-09-30] 按需加载：冷启动一屏铺满实测慢 3%~12%，主要是每个 Worker 首次都要拉全部 25 张；
 *   内陆瓦片用不到海水/沙滩，低地用不到雪。缺的贴图 Worker 那条规则自动跳过。
 */
export async function createTerrainMaterial(
    bounds: Bounds, width: number, height: number,
    coords?: { z: number; x: number; y: number },
    ruleTextures: readonly string[] | Promise<readonly string[]> = TERRAIN_RULE_TEXTURES,
): Promise<TerrainMaterial | null> {
    if (!await loadWorld()) return null;
    const origin = coords ? materialOriginForTile(coords.z, coords.x, coords.y) : { gx9: 0, gy9: 0, scale: 1 };
    const columns = Math.ceil(width / STEP) + 1;
    const rows = Math.ceil(height / STEP) + 1;
    const northY = Math.asinh(Math.tan(bounds.north * Math.PI / 180));
    const southY = Math.asinh(Math.tan(bounds.south * Math.PI / 180));
    const nodes: Map<string, number>[] = [];
    for (let y = 0; y < rows; y++) {
        const lat = Math.atan(Math.sinh(northY + (southY - northY) * y * STEP / height)) * 180 / Math.PI;
        for (let x = 0; x < columns; x++) {
            const lng = bounds.west + (bounds.east - bounds.west) * x * STEP / width;
            const climate = sampleClimateMaterials(lat, lng, worldWidth, worldHeight,
                (sampleLat, sampleLng) => queryBaseTile({ lat: sampleLat, lng: sampleLng, isSiege: false, isWinter: false }));
            nodes.push(varyTemperateMaterials(climate, lat, lng));
        }
    }
    const assets = new Map<string, Uint8ClampedArray | null>();
    const climateLoads = Promise.all([...new Set(nodes.flatMap(node => [...node.keys()]))]
        .map(async name => assets.set(name, await loadTexture(name))));
    const rules = await ruleTextures;
    await Promise.all([climateLoads, ...rules.map(async name => assets.set(name, await loadTexture(name)))]);
    const grid = nodes.map(node => [...node].flatMap(([name, weight]) => {
        const pixels = assets.get(name);
        return pixels ? [{ pixels, weight }] : [];
    }));
    const climate = blendMaterialGrid(grid, columns, width, height, origin);
    const nodeArid = nodes.map(node => classOf(node, 'arid', 0.5));
    const nodeSand = nodes.map(node => classOf(node, 'sand', 0));
    return assembleTerrainMaterial(climate, assets, width, height, origin,
        interpolateNodes(nodeArid, columns, width, height), interpolateNodes(nodeSand, columns, width, height));
}

function classOf(node: Map<string, number>, key: 'arid' | 'sand', fallback: number): number {
    let sum = 0, weight = 0;
    for (const [name, w] of node) { sum += (CLIMATE_CLASS[name]?.[key] ?? (key === 'arid' ? 0.5 : 0)) * w; weight += w; }
    return weight > 0 ? sum / weight : fallback;
}

/** 节点值按与气候贴图相同的 STEP 网格双线性插值到逐像素（相邻瓦片共用边上节点，无接缝） */
function interpolateNodes(values: number[], columns: number, width: number, height: number): Float32Array {
    const out = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        const gy = Math.floor(y / STEP), fy = (y % STEP) / STEP;
        for (let x = 0; x < width; x++) {
            const gx = Math.floor(x / STEP), fx = (x % STEP) / STEP;
            const i = gy * columns + gx;
            const top = values[i] * (1 - fx) + (fx > 0 ? values[i + 1] * fx : 0);
            const bottom = fy > 0 ? values[i + columns] * (1 - fx) + (fx > 0 ? values[i + columns + 1] * fx : 0) : 0;
            out[y * width + x] = top * (1 - fy) + bottom * fy;
        }
    }
    return out;
}

/** 气候层 + 规则贴图组装成 Worker 用的材质（测试脚本也直接调用它） */
export function assembleTerrainMaterial(
    climate: Uint8ClampedArray<ArrayBuffer>, assets: ReadonlyMap<string, Uint8ClampedArray | null>,
    width: number, height: number, origin: MaterialOrigin,
    arid: Float32Array = new Float32Array(width * height).fill(0.5),
    sand: Float32Array = new Float32Array(width * height),
): TerrainMaterial {
    const { tapA, tapB, bomb, patch, level } = buildTaps(width, height, origin);
    const tex: TerrainMaterial['tex'] = {};
    for (const name of TERRAIN_RULE_TEXTURES) {
        const pixels = assets.get(name);
        if (pixels) tex[name] = mipsOf(pixels)[level];
    }
    return { climate, arid, sand, tapA, tapB, bomb, patch, tex };
}
