import { queryBaseTile, setWorldBaseData } from '../ui/scene13/WorldBaseMap';

type Bounds = { north: number; south: number; west: number; east: number };
const SIZE = 128;
const STEP = 64;
// 世界查找图 + 至多 24 张缩小的材质；只存像素，解码位图立即释放。
export const MATERIAL_BUDGET_BYTES = 12 * 1024 * 1024;
const textures = new Map<string, Promise<Uint8ClampedArray | null>>();
let worldReady: Promise<boolean> | undefined;
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
        residentBytes += image.data.byteLength;
        return true;
    }).catch(() => false);
}

function loadTexture(name: string): Promise<Uint8ClampedArray | null> {
    let pending = textures.get(name);
    if (!pending) {
        pending = readPixels(`/SUCAI_TERRAIN/${name}.png`, SIZE).then(image => {
            if (residentBytes + image.data.byteLength > MATERIAL_BUDGET_BYTES) return null;
            residentBytes += image.data.byteLength;
            return image.data;
        }).catch(() => null);
        textures.set(name, pending);
    }
    return pending;
}

/** 在共享采样节点间混合材质，避免气候块边缘和相邻瓦片出现硬接缝。 */
export function blendMaterialGrid(
    grid: (Uint8ClampedArray | null)[], columns: number, width: number, height: number,
): Uint8ClampedArray<ArrayBuffer> {
    const output = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        const gy = Math.floor(y / STEP), fy = (y % STEP) / STEP;
        for (let x = 0; x < width; x++) {
            const gx = Math.floor(x / STEP), fx = (x % STEP) / STEP;
            const a = grid[gy * columns + gx], b = grid[gy * columns + gx + 1];
            const c = grid[(gy + 1) * columns + gx], d = grid[(gy + 1) * columns + gx + 1];
            const wa = a ? (1 - fx) * (1 - fy) : 0, wb = b ? fx * (1 - fy) : 0;
            const wc = c ? (1 - fx) * fy : 0, wd = d ? fx * fy : 0;
            const weight = wa + wb + wc + wd;
            if (weight === 0) continue;
            const source = ((y % SIZE) * SIZE + x % SIZE) * 4;
            const target = (y * width + x) * 4;
            for (let channel = 0; channel < 3; channel++) {
                output[target + channel] = ((a?.[source + channel] ?? 0) * wa
                    + (b?.[source + channel] ?? 0) * wb
                    + (c?.[source + channel] ?? 0) * wc
                    + (d?.[source + channel] ?? 0) * wd) / weight;
            }
            output[target + 3] = weight * 255;
        }
    }
    return output;
}

export async function createTerrainMaterial(
    bounds: Bounds, width: number, height: number,
): Promise<Uint8ClampedArray<ArrayBuffer> | null> {
    if (!await loadWorld()) return null;
    const columns = Math.ceil(width / STEP) + 1;
    const rows = Math.ceil(height / STEP) + 1;
    const northY = Math.asinh(Math.tan(bounds.north * Math.PI / 180));
    const southY = Math.asinh(Math.tan(bounds.south * Math.PI / 180));
    const names: (string | null)[] = [];
    for (let y = 0; y < rows; y++) {
        const lat = Math.atan(Math.sinh(northY + (southY - northY) * y * STEP / height)) * 180 / Math.PI;
        for (let x = 0; x < columns; x++) {
            const lng = bounds.west + (bounds.east - bounds.west) * x * STEP / width;
            names.push(queryBaseTile({ lat, lng, isSiege: false, isWinter: false }));
        }
    }
    const assets = new Map<string, Uint8ClampedArray | null>();
    await Promise.all([...new Set(names)].filter((name): name is string => name !== null)
        .map(async name => assets.set(name, await loadTexture(name))));
    return blendMaterialGrid(names.map(name => name ? assets.get(name) ?? null : null), columns, width, height);
}
