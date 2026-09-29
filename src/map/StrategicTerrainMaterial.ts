import { queryBaseTile, setWorldBaseData } from '../ui/scene13/WorldBaseMap';

type Bounds = { north: number; south: number; west: number; east: number };
export type MaterialNode = ReadonlyArray<{ pixels: Uint8ClampedArray; weight: number }>;
const SIZE = 128;
const STEP = 64;
// 世界查找图 + 至多 24 张缩小的材质；只存像素，解码位图立即释放。
export const MATERIAL_BUDGET_BYTES = 12 * 1024 * 1024;
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
        if (image.data.byteLength > MATERIAL_BUDGET_BYTES - 24 * SIZE * SIZE * 4) return false;
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

/** 坡面岩石：陡坡露出的裸岩；Worker 按坡度决定混入多少 */
export const SLOPE_ROCK_TEXTURE = 'rck';

export type TerrainMaterial = {
    /** 气候地表（草/林/沙/雪…），alpha = 有效权重 */
    climate: Uint8ClampedArray<ArrayBuffer>;
    /** 坡面岩石，同一套地理取样；素材缺失时为 null */
    rock: Uint8ClampedArray<ArrayBuffer> | null;
};

export async function createTerrainMaterial(
    bounds: Bounds, width: number, height: number,
    coords?: { z: number; x: number; y: number },
): Promise<TerrainMaterial | null> {
    if (!await loadWorld()) return null;
    const origin = coords ? materialOriginForTile(coords.z, coords.x, coords.y) : undefined;
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
    await Promise.all([...new Set([...nodes.flatMap(node => [...node.keys()]), SLOPE_ROCK_TEXTURE])]
        .map(async name => assets.set(name, await loadTexture(name))));
    const grid = nodes.map(node => [...node].flatMap(([name, weight]) => {
        const pixels = assets.get(name);
        return pixels ? [{ pixels, weight }] : [];
    }));
    const climate = blendMaterialGrid(grid, columns, width, height, origin);
    const rockPixels = assets.get(SLOPE_ROCK_TEXTURE);
    const rock = rockPixels
        ? blendMaterialGrid(Array(columns * rows).fill([{ pixels: rockPixels, weight: 1 }]), columns, width, height, origin)
        : null;
    return { climate, rock };
}
