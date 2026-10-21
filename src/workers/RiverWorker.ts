import { isWaterPixel } from '../world/land-sea/WaterMask';
import { TERRARIUM_TILE_URL } from '../world/land-sea/TerrariumCodec';
import { loadStrategicWaterTexture, renderStrategicWater, type WaterTileMask } from '../map/StrategicWaterMaterial';

export interface RiverWorkerRequest {
    id: number; width: number; height: number; bitmap: ImageBitmap;
    x: number; y: number; z: number;
}
export interface RiverWorkerResponse { id: number; data: Uint8ClampedArray; waves?: Float32Array | null; }
const tiles = new Map<string, WaterTileMask>();
const MAX_TILES_CACHE = 320;
const keyOf = (t: {x: number; y: number; z: number}) => `${t.z}/${t.x}/${t.y}`;

function putTile(key: string, tile: WaterTileMask): void {
    tiles.delete(key);
    tiles.set(key, tile);
    while (tiles.size > MAX_TILES_CACHE) {
        const oldest = tiles.keys().next().value;
        if (oldest === undefined) break;
        tiles.delete(oldest);
    }
}

const PAD = 32;

/**
 * 🔴 2026-10-21「江淮水岸」美化：ESRI 晕渲瓦片是 256px，判出来的水体是硬二值，
 *   放到战略视距后湖岸/海岸就是一格一格的直角台阶。
 *   这里直接读**本地地形瓦片**（512px，和底图同一张，只是不叠标签），按「偏蓝=水」逐子像素判定，
 *   再 2×2 降采样成 0~1 的「水体覆盖率」：形状比 ESRI 细一倍，边缘天然带抗锯齿，
 *   水里画什么、哪块是湖，都跟玩家看到的底图完全对齐。取不到就回落 ESRI 二值掩膜。
 */
const LOCAL_TERRAIN_BASE = '/9dixingtu/Google Terrain Maps without labels  roads and POI  512px';
const coverageCache = new Map<string, Uint8Array | null>();

/** 本地地形瓦片 → 256×256 水体覆盖率（0/64/128/192/256）；取不到返回 null */
async function loadLocalWaterCoverage(x: number, y: number, z: number): Promise<Uint8Array | null> {
    const key = `${z}/${x}/${y}`;
    const cached = coverageCache.get(key);
    if (cached !== undefined) return cached;
    let out: Uint8Array | null = null;
    try {
        const url = encodeURI(`${LOCAL_TERRAIN_BASE}/${x}/${y}.jpg`);
        const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (resp.ok) {
            const bmp = await createImageBitmap(await resp.blob());
            const canvas = new OffscreenCanvas(512, 512);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                ctx.drawImage(bmp, 0, 0, 512, 512);
                const px = ctx.getImageData(0, 0, 512, 512).data;
                const cov = new Uint8Array(256 * 256);
                for (let cy = 0; cy < 256; cy++) {
                    for (let cx = 0; cx < 256; cx++) {
                        let n = 0;
                        for (let sy = 0; sy < 2; sy++) {
                            const rowBase = ((cy * 2 + sy) * 512) * 4;
                            for (let sx = 0; sx < 2; sx++) {
                                const i = rowBase + (cx * 2 + sx) * 4;
                                const r0 = px[i], g0 = px[i + 1], b0 = px[i + 2];
                                if (b0 > g0 + 6 && b0 > 150 && r0 < 205) n++;
                            }
                        }
                        cov[cy * 256 + cx] = n * 64;
                    }
                }
                out = cov;
            }
            bmp.close();
        }
    } catch {
        out = null;
    }
    coverageCache.set(key, out);
    if (coverageCache.size > 220) {
        const oldest = coverageCache.keys().next().value;
        if (oldest !== undefined) coverageCache.delete(oldest);
    }
    return out;
}


/** 检查 tile 朝向 (dx, dy) 方向的外侧 32px 边缘带内是否存在陆地像素（mask === 0） */
function borderHasLand(tile: WaterTileMask, dx: number, dy: number): boolean {
    const { width: w, height: h, mask } = tile;
    const x0 = dx < 0 ? 0 : (dx > 0 ? w - PAD : 0);
    const x1 = dx < 0 ? PAD : (dx > 0 ? w : w);
    const y0 = dy < 0 ? 0 : (dy > 0 ? h - PAD : 0);
    const y1 = dy < 0 ? PAD : (dy > 0 ? h : h);
    for (let y = y0; y < y1; y++) {
        const row = y * w;
        for (let x = x0; x < x1; x++) {
            if (mask[row + x] === 0) return true;
        }
    }
    return false;
}

self.onmessage = async (e: MessageEvent<RiverWorkerRequest | { removeId: number } | { rebindId: number; x: number; y: number; z: number }>) => {
    if ('removeId' in e.data) {
        return;
    }
    if ('rebindId' in e.data) {
        const key = keyOf(e.data);
        const existing = tiles.get(key);
        if (existing) {
            existing.id = e.data.rebindId;
            putTile(key, existing);
        }
        return;
    }
    const { id, width, height, bitmap, x, y, z } = e.data;
    if (!bitmap) {
        const data = new Uint8ClampedArray(width * height * 4);
        self.postMessage({ id, data, waves: null }, [data.buffer] as any);
        return;
    }
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    bitmap.close();
    const mask = new Uint8Array(width * height);
    let hasWater = false;
    for (let i = 0; i < mask.length; i++) {
        const w = isWaterPixel(pixels[i*4], pixels[i*4+1], pixels[i*4+2]) ? 1 : 0;
        mask[i] = w;
        if (w) hasWater = true;
    }
    // 🔴 有本地地形瓦片时，用它的 512px 覆盖率覆盖 ESRI 二值掩膜（形状与底图一致、边缘带抗锯齿）
    let coverage: Uint8Array | null = null;
    try {
        coverage = await loadLocalWaterCoverage(x, y, z);
    } catch {
        coverage = null;
    }
    if (coverage) {
        hasWater = false;
        for (let i = 0; i < mask.length; i++) {
            const w = coverage[i] >= 128 ? 1 : 0;
            mask[i] = w;
            if (w) hasWater = true;
        }
    }
    const tile: WaterTileMask = { id, width, height, x, y, z, mask, coverage };
    putTile(keyOf(tile), tile);
    // 先等水深算好再画第一次：避免「先平色、后变深」的闪烁与新旧块混排
    const [texture, depthT] = await Promise.all([
        loadStrategicWaterTexture(),
        hasWater ? computeDepthT(x, y, z, width, height).catch(() => null) : Promise.resolve(null),
    ]);
    tile.depthT = depthT;
    if (tiles.get(keyOf(tile)) !== tile) return;
    // 新邻居到达时：仅重绘自身，以及交界 32px 内存在陆地（海岸线跨界）的相邻瓦片；
    // 纯海面交界不改变邻居的岸线距离，跳过无意义的 8 邻域重复重绘。
    const worldWidth = 2 ** z;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const isSelf = dx === 0 && dy === 0;
        const nx = ((x + dx) % worldWidth + worldWidth) % worldWidth;
        const neighbor = isSelf ? tile : tiles.get(`${z}/${nx}/${y+dy}`);
        if (!neighbor) continue;
        // 邻块水深还没算好（undefined）就先别画它，等它自己算完再画 —— 否则会先出一块平色，再变深，拼成方块
        if (neighbor.depthT === undefined) continue;
        if (!isSelf && !borderHasLand(tile, -dx, -dy) && !borderHasLand(neighbor, dx, dy)) {
            continue;
        }
        let data: Uint8ClampedArray;
        let waves: Float32Array | null = null;
        if (neighbor.mask.some(v => v !== 0)) {
            const res = renderStrategicWater(neighbor, tiles, texture);
            data = res.data;
            waves = res.waves;
        } else {
            data = new Uint8ClampedArray(width * height * 4);
        }
        const transferList: Transferable[] = [data.buffer];
        if (waves && waves.buffer) transferList.push(waves.buffer);
        self.postMessage({ id: neighbor.id, data, waves }, transferList as any);
    }
};

// ── 水深：一律取 z6 高程（粗级数据没有 z9 那种「海面被压成 0 m / −29 m」的方块），逐像素双线性 ──
const DEPTH_Z = 6;
/** 该深度（米）起算满深色；开方曲线让大陆架到大陆坡变化明显 */
const FULL_DEPTH_M = 3000;
/** 里海湖面约 −28 m：盆地内高程要加回这个值，否则浅岸也会被算成 28 m 深 */
const CASPIAN_SURFACE_M = -28;
const demCache = new Map<string, Promise<Float32Array | null>>();

function fetchDem(z: number, x: number, y: number): Promise<Float32Array | null> {
    const n = 2 ** z;
    if (y < 0 || y >= n) return Promise.resolve(null);
    x = ((x % n) + n) % n;
    const key = `${z}/${x}/${y}`;
    let p = demCache.get(key);
    if (!p) {
        p = (async () => {
            try {
                const url = TERRARIUM_TILE_URL.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
                const resp = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(8000) });
                if (!resp.ok) return null;
                const bmp = await createImageBitmap(await resp.blob());
                const c = new OffscreenCanvas(256, 256);
                const ctx = c.getContext('2d', { willReadFrequently: true });
                if (!ctx) { bmp.close(); return null; }
                ctx.drawImage(bmp, 0, 0, 256, 256);
                bmp.close();
                const px = ctx.getImageData(0, 0, 256, 256).data;
                const dem = new Float32Array(256 * 256);
                for (let i = 0; i < dem.length; i++) dem[i] = px[i*4] * 256 + px[i*4+1] + px[i*4+2] / 256 - 32768;
                return dem;
            } catch { return null; }
        })();
        demCache.set(key, p);
        // 失败的不缓存，下次再试
        p.then(v => { if (!v) demCache.delete(key); });
    }
    return p;
}

async function computeDepthT(x: number, y: number, z: number, w: number, h: number): Promise<Float32Array | null> {
    const dz = Math.min(DEPTH_Z, z);
    const scale = 2 ** (z - dz);            // 本级 1 像素 = 1/scale 个粗级像素
    // 本块在粗级世界像素里的范围（外扩 4 像素供三遍 3×3 高斯平滑 + 插值，基于世界坐标跨瓦片天然无缝）
    const gx0 = Math.floor((x * w) / scale) - 4, gx1 = Math.floor(((x + 1) * w) / scale) + 4;
    const gy0 = Math.floor((y * h) / scale) - 4, gy1 = Math.floor(((y + 1) * h) / scale) + 4;
    const tiles = new Map<string, Float32Array | null>();
    const need: Promise<void>[] = [];
    for (let ty = Math.floor(gy0 / 256); ty <= Math.floor(gy1 / 256); ty++) {
        for (let tx = Math.floor(gx0 / 256); tx <= Math.floor(gx1 / 256); tx++) {
            need.push(fetchDem(dz, tx, ty).then(d => { tiles.set(`${tx}/${ty}`, d); }));
        }
    }
    await Promise.all(need);
    for (const d of tiles.values()) if (!d) return null;   // 缺一块就整块平色，绝不半深半浅
    const n = 2 ** dz;
    const coarseWorldPx = n * 256;
    const rawElevAt = (gx: number, gy: number): number => {
        gy = Math.max(0, Math.min(coarseWorldPx - 1, gy));
        const tx = Math.floor(gx / 256), ty = Math.floor(gy / 256);
        const dem = tiles.get(`${tx}/${ty}`)!;
        return dem[(gy - ty * 256) * 256 + (gx - tx * 256)];
    };

    // 🔴 关键全球化设计：先在每个粗网格点上把米制高程转为有界水深权重 t0 ∈ [0, 1]，再对 t0 做多遍高斯平滑。
    //    原因：全球大陆架边缘或海沟处（如加勒比海、日本海沟、地中海），相邻两个 z=6 粗像素水深可从 20m 骤降到 2000m+；
    //    若直接对「米」做平滑与插值，-2000m 会以 100 倍权重吞噬 -20m，导致 20m→300m 过渡带被挤压在 1~2 个屏幕像素内，
    //    在全图大陆架边缘暴露出 z=6 粗网格的锯齿折线。先映射到有界 [0, 1] 再平滑，任何海沟深度都不会拉偏过渡带宽。
    const gw = gx1 - gx0 + 1, gh = gy1 - gy0 + 1;
    let bufA = new Float32Array(gw * gh);
    let bufB = new Float32Array(gw * gh);
    for (let gy = gy0; gy <= gy1; gy++) {
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (gy + 0.5) / coarseWorldPx))) * 180 / Math.PI;
        const inCaspianLat = lat > 36.5 && lat < 47.3;
        const rowOff = (gy - gy0) * gw;
        for (let gx = gx0; gx <= gx1; gx++) {
            let e = rawElevAt(gx, gy);
            if (inCaspianLat) {
                const lng = (gx + 0.5) / coarseWorldPx * 360 - 180;
                if (lng > 46.4 && lng < 55.6) e -= CASPIAN_SURFACE_M;
            }
            const depth = -e;
            let t = 0;
            if (depth > 0) {
                if (depth <= 35) {
                    t = Math.pow(depth / 35, 0.80) * 0.50;
                } else {
                    const s = Math.min(1, (depth - 35) / 1400);
                    t = 0.50 + 0.50 * Math.pow(s, 0.60);
                }
            }
            bufA[rowOff + (gx - gx0)] = t;
        }
    }

    // 抑制深海中孤立 1~2 粗像素的水下暗沙尖峰（周围 8 邻域平均明显更深时，向邻域拉拢，避免无岛屿处浮现亮蓝斑块）
    for (let y0 = 1; y0 < gh - 1; y0++) {
        const rowOff = y0 * gw;
        for (let x0 = 1; x0 < gw - 1; x0++) {
            const c = rowOff + x0;
            const v = bufA[c];
            const ringMean = (
                bufA[c - gw - 1] + bufA[c - gw] + bufA[c - gw + 1] +
                bufA[c - 1] + bufA[c + 1] +
                bufA[c + gw - 1] + bufA[c + gw] + bufA[c + gw + 1]
            ) * 0.125;
            bufB[c] = ringMean - v > 0.12 ? v + (ringMean - v) * 0.65 : v;
        }
    }
    bufA.set(bufB);

    // 三遍 3×3 高斯核平滑（等效 7×7 高斯核）：将 z=6 粗网格阶跃完全抹成宽广柔和的海底渐变带
    for (let pass = 0; pass < 3; pass++) {
        const margin = pass + 1;
        for (let y0 = margin; y0 < gh - margin; y0++) {
            const rowOff = y0 * gw;
            for (let x0 = margin; x0 < gw - margin; x0++) {
                const c = rowOff + x0;
                bufB[c] = (
                    bufA[c - gw - 1] + bufA[c - gw] * 2 + bufA[c - gw + 1] +
                    bufA[c - 1] * 2 + bufA[c] * 4 + bufA[c + 1] * 2 +
                    bufA[c + gw - 1] + bufA[c + gw] * 2 + bufA[c + gw + 1]
                ) * 0.0625;
            }
        }
        const tmp = bufA; bufA = bufB; bufB = tmp;
    }

    const out = new Float32Array(w * h);
    for (let py = 0; py < h; py++) {
        const wy = y * h + py + 0.5;
        const fy = wy / scale - 0.5;
        const iy = Math.floor(fy), rawTy = fy - iy;
        const ty = rawTy * rawTy * (3 - 2 * rawTy);
        const rowOff = (iy - gy0) * gw;
        for (let px = 0; px < w; px++) {
            const wx = x * w + px + 0.5;
            const fx = wx / scale - 0.5;
            const ix = Math.floor(fx), rawTx = fx - ix;
            const tx = rawTx * rawTx * (3 - 2 * rawTx);
            const idx = rowOff + (ix - gx0);
            out[py * w + px] =
                (bufA[idx] * (1 - tx) + bufA[idx + 1] * tx) * (1 - ty) +
                (bufA[idx + gw] * (1 - tx) + bufA[idx + gw + 1] * tx) * ty;
        }
    }
    return out;
}
