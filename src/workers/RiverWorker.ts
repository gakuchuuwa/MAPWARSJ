import { isWaterPixel } from '../world/land-sea/WaterMask';
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
    const tile = { id, width, height, x, y, z, mask };
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
};
