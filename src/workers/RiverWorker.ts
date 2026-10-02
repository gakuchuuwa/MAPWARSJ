import { isWaterPixel } from '../world/land-sea/WaterMask';
import { TERRARIUM_TILE_URL } from '../world/land-sea/TerrariumCodec';
import { loadStrategicWaterTexture, renderStrategicWater, type WaterTileMask } from '../map/StrategicWaterMaterial';

export interface RiverWorkerRequest {
    id: number; width: number; height: number; bitmap: ImageBitmap;
    x: number; y: number; z: number;
}
export interface RiverWorkerResponse { id: number; data: Uint8ClampedArray; waves?: Float32Array | null; }
const tiles = new Map<string, WaterTileMask>();
const keyOf = (t: {x: number; y: number; z: number}) => `${t.z}/${t.x}/${t.y}`;

self.onmessage = async (e: MessageEvent<RiverWorkerRequest | { removeId: number }>) => {
    if ('removeId' in e.data) {
        for (const [key, tile] of tiles) if (tile.id === e.data.removeId) tiles.delete(key);
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
    for (let i = 0; i < mask.length; i++) {
        mask[i] = isWaterPixel(pixels[i*4], pixels[i*4+1], pixels[i*4+2]) ? 1 : 0;
    }
    const tile: WaterTileMask = { id, width, height, x, y, z, mask };
    tiles.set(keyOf(tile), tile);
    const hasWater = mask.some(v => v !== 0);
    // 先等水深算好再画第一次：避免「先平色、后变深」的闪烁与新旧块混排
    const [texture, depthT] = await Promise.all([
        loadStrategicWaterTexture(),
        hasWater ? computeDepthT(x, y, z, width, height).catch(() => null) : Promise.resolve(null),
    ]);
    tile.depthT = depthT;
    if (tiles.get(keyOf(tile)) !== tile) return;
    // 新邻居到达时重绘相邻边缘；不额外请求底图、不把瓦片边界当岸线。
    const worldWidth = 2 ** z;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = ((x + dx) % worldWidth + worldWidth) % worldWidth;
        const neighbor = tiles.get(`${z}/${nx}/${y+dy}`);
        if (!neighbor) continue;
        // 邻块水深还没算好（undefined）就先别画它，等它自己算完再画 —— 否则会先出一块平色，再变深，拼成方块
        if (neighbor.depthT === undefined) continue;
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
    // 本块在粗级世界像素里的范围（留 1 像素给双线性）
    const gx0 = Math.floor((x * w) / scale) - 1, gx1 = Math.floor(((x + 1) * w) / scale) + 1;
    const gy0 = Math.floor((y * h) / scale) - 1, gy1 = Math.floor(((y + 1) * h) / scale) + 1;
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
    const elevAt = (gx: number, gy: number): number => {
        gy = Math.max(0, Math.min(n * 256 - 1, gy));
        const tx = Math.floor(gx / 256), ty = Math.floor(gy / 256);
        const dem = tiles.get(`${tx}/${ty}`)!;
        return dem[(gy - ty * 256) * 256 + (gx - tx * 256)];
    };
    const worldPx = 2 ** z * w;
    const out = new Float32Array(w * h);
    for (let py = 0; py < h; py++) {
        const wy = y * h + py + 0.5;
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * wy / worldPx))) * 180 / Math.PI;
        const fy = wy / scale - 0.5;
        const iy = Math.floor(fy), ty = fy - iy;
        for (let px = 0; px < w; px++) {
            const wx = x * w + px + 0.5;
            const fx = wx / scale - 0.5;
            const ix = Math.floor(fx), tx = fx - ix;
            let e = (elevAt(ix, iy) * (1 - tx) + elevAt(ix + 1, iy) * tx) * (1 - ty)
                  + (elevAt(ix, iy + 1) * (1 - tx) + elevAt(ix + 1, iy + 1) * tx) * ty;
            const lng = wx / worldPx * 360 - 180;
            if (lat > 36.5 && lat < 47.3 && lng > 46.4 && lng < 55.6) e -= CASPIAN_SURFACE_M;
            const depth = -e;
            out[py * w + px] = depth > 0 ? Math.min(1, Math.sqrt(depth / FULL_DEPTH_M)) : 0;
        }
    }
    return out;
}
