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
            if (residentBytes + image.data.byteLength > MATERIAL_BUDGET_BYTES) return null;
            residentBytes += image.data.byteLength;
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

/** 在共享采样节点间混合材质，避免气候块边缘和相邻瓦片出现硬接缝。 */
export function blendMaterialGrid(
    grid: MaterialNode[], columns: number, width: number, height: number,
): Uint8ClampedArray<ArrayBuffer> {
    const output = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        const gy = Math.floor(y / STEP), fy = (y % STEP) / STEP;
        for (let x = 0; x < width; x++) {
            const gx = Math.floor(x / STEP), fx = (x % STEP) / STEP;
            const source = ((y % SIZE) * SIZE + x % SIZE) * 4;
            const target = (y * width + x) * 4;
            let r = 0, g = 0, b = 0, weight = 0;
            for (let corner = 0; corner < 4; corner++) {
                const dx = corner & 1, dy = corner >> 1;
                const cornerWeight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy);
                for (const sample of grid[(gy + dy) * columns + gx + dx]) {
                    const w = sample.weight * cornerWeight;
                    r += sample.pixels[source] * w;
                    g += sample.pixels[source + 1] * w;
                    b += sample.pixels[source + 2] * w;
                    weight += w;
                }
            }
            if (weight === 0) continue;
            output[target] = r / weight;
            output[target + 1] = g / weight;
            output[target + 2] = b / weight;
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
    const nodes: Map<string, number>[] = [];
    for (let y = 0; y < rows; y++) {
        const lat = Math.atan(Math.sinh(northY + (southY - northY) * y * STEP / height)) * 180 / Math.PI;
        for (let x = 0; x < columns; x++) {
            const lng = bounds.west + (bounds.east - bounds.west) * x * STEP / width;
            nodes.push(sampleClimateMaterials(lat, lng, worldWidth, worldHeight,
                (sampleLat, sampleLng) => queryBaseTile({ lat: sampleLat, lng: sampleLng, isSiege: false, isWinter: false })));
        }
    }
    const assets = new Map<string, Uint8ClampedArray | null>();
    await Promise.all([...new Set(nodes.flatMap(node => [...node.keys()]))]
        .map(async name => assets.set(name, await loadTexture(name))));
    const grid = nodes.map(node => [...node].flatMap(([name, weight]) => {
        const pixels = assets.get(name);
        return pixels ? [{ pixels, weight }] : [];
    }));
    return blendMaterialGrid(grid, columns, width, height);
}
