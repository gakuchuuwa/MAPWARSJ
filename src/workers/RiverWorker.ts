import { isWaterPixel } from '../world/land-sea/WaterMask';
import { TERRARIUM_TILE_URL } from '../world/land-sea/TerrariumCodec';
import { loadStrategicWaterTexture, renderStrategicWater, type WaterTileMask } from '../map/StrategicWaterMaterial';

export interface RiverWorkerRequest {
    id: number; width: number; height: number; bitmap: ImageBitmap;
    x: number; y: number; z: number;
}
export interface RiverWorkerResponse { id: number; data: Uint8ClampedArray; }
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
        self.postMessage({ id, data }, [data.buffer] as any);
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
    const texture = await loadStrategicWaterTexture();
    if (tiles.get(keyOf(tile)) !== tile) return;
    // 新邻居到达时重绘相邻边缘；不额外请求底图、不把瓦片边界当岸线。
    const worldWidth = 2 ** z;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = ((x + dx) % worldWidth + worldWidth) % worldWidth;
        const neighbor = tiles.get(`${z}/${nx}/${y+dy}`);
        if (!neighbor) continue;
        const data = neighbor.mask.some(v => v !== 0)
            ? renderStrategicWater(neighbor, tiles, texture)
            : new Uint8ClampedArray(width * height * 4);
        self.postMessage({ id: neighbor.id, data }, [data.buffer] as any);
    }

    // 高程晚到：取到后只重画本块（水面在高程 < 0 处才透明，见 renderStrategicWater）；失败就保持不透明
    if (!tile.deep && mask.some(v => v !== 0)) {
        const deep = await fetchDeep(x, y, z, width, height);
        if (!deep || tiles.get(keyOf(tile)) !== tile) return;
        tile.deep = deep;
        const data = renderStrategicWater(tile, tiles, texture);
        self.postMessage({ id, data }, [data.buffer] as any);
    }
};

/** 取同 z/x/y 的 Terrarium 高程瓦片，返回「高程 < 0」逐像素标记；任何失败返回 null */
async function fetchDeep(x: number, y: number, z: number, width: number, height: number): Promise<Uint8Array | null> {
    if (z > 12) return null;
    try {
        const url = TERRARIUM_TILE_URL.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
        const resp = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(6000) });
        if (!resp.ok) return null;
        const bmp = await createImageBitmap(await resp.blob());
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { bmp.close(); return null; }
        ctx.drawImage(bmp, 0, 0, width, height);
        bmp.close();
        const px = ctx.getImageData(0, 0, width, height).data;
        const deep = new Uint8Array(width * height);
        for (let i = 0; i < deep.length; i++) deep[i] = px[i * 4] < 128 ? 1 : 0;   // Terrarium：r < 128 ⟺ 高程 < 0
        return deep;
    } catch {
        return null;
    }
}
