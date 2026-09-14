// 战略水面只取真实水域掩膜；明暗来自 DE 材质，不再透出各块 DEM 的水深接缝。
const SIZE = 128;
/** 海、湖与矢量河流共用的水色；近岸增量只表达视觉过渡。 */
export const STRATEGIC_WATER_PALETTE = {
    base: [64, 117, 141] as const,
    shoreLift: [17, 24.5, 19.5] as const,
};
export const STRATEGIC_WATER_COLOR = `rgb(${STRATEGIC_WATER_PALETTE.base.join(',')})`;
export const STRATEGIC_RIVER_BANK_COLOR = `rgb(${STRATEGIC_WATER_PALETTE.base.map(
    (value, channel) => Math.round(value + STRATEGIC_WATER_PALETTE.shoreLift[channel] * 0.65),
).join(',')})`;
let texture: Promise<Float32Array | null> | undefined;

export function loadStrategicWaterTexture(): Promise<Float32Array | null> {
    return texture ??= (async () => {
        const response = await fetch('/SUCAI_TERRAIN/wtr.png', { signal: AbortSignal.timeout(4000) });
        if (!response.ok) throw new Error(`Water texture HTTP ${response.status}`);
        const bitmap = await createImageBitmap(await response.blob());
        try {
            const canvas = new OffscreenCanvas(SIZE, SIZE);
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
            const rgba = ctx.getImageData(0, 0, SIZE, SIZE).data;
            const detail = new Float32Array(SIZE * SIZE);
            let mean = 0;
            for (let p = 0; p < detail.length; p++) {
                detail[p] = rgba[p * 4] * 0.2126 + rgba[p * 4 + 1] * 0.7152 + rgba[p * 4 + 2] * 0.0722;
                mean += detail[p];
            }
            mean /= detail.length;
            for (let p = 0; p < detail.length; p++) detail[p] = (detail[p] - mean) * 0.55;
            return detail;
        } finally {
            bitmap.close();
        }
    })().catch(() => null);
}

/** 镜像平铺的周期恰为瓦片宽 256，跨瓦片边缘连续，不出现纹理接缝。 */
export function waterDetailAt(detail: Float32Array | null, x: number, y: number): number {
    const mirror = (v: number) => {
        const p = ((v % 256) + 256) % 256;
        return p < SIZE ? p : 255 - p;
    };
    if (!detail) return 0;
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const a = detail[mirror(iy) * SIZE + mirror(ix)];
    const b = detail[mirror(iy) * SIZE + mirror(ix + 1)];
    const c = detail[mirror(iy + 1) * SIZE + mirror(ix)];
    const d = detail[mirror(iy + 1) * SIZE + mirror(ix + 1)];
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

/** 世界像素连续变化，仅用于美术层次，不假充真实海深。 */
export function waterToneAt(x: number, y: number): number {
    return Math.sin(x / 347 + Math.sin(y / 491) * 0.6) * 1.7
        + Math.sin((x + y * 0.43) / 173) * 0.8;
}

export interface WaterTileMask {
    id: number; width: number; height: number; x: number; y: number; z: number;
    mask: Uint8Array;
}

/** 邻接瓦片只提供真实水域掩膜，不改变海陆判定。 */
export function renderStrategicWater(
    tile: WaterTileMask, tiles: ReadonlyMap<string, WaterTileMask>, detail: Float32Array | null,
): Uint8ClampedArray {
    const { width: w, height: h, mask } = tile;
    const pad = 16, pw = w + pad * 2, ph = h + pad * 2;
    const distance = new Float32Array(pw * ph);
    const water = new Uint8Array(pw * ph);
    const worldWidth = 2 ** tile.z;
    for (let y = -pad; y < h + pad; y++) for (let x = -pad; x < w + pad; x++) {
        const tx = Math.floor(x / w), ty = Math.floor(y / h);
        const nx = ((tile.x + tx) % worldWidth + worldWidth) % worldWidth;
        const neighbor = tx === 0 && ty === 0 ? tile : tiles.get(`${tile.z}/${nx}/${tile.y + ty}`);
        const m = neighbor
            ? neighbor.mask[((y % h + h) % h) * w + ((x % w + w) % w)]
            : mask[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
        const i = (y + pad) * pw + x + pad;
        water[i] = m;
        distance[i] = m ? pad + 1 : 0;
    }
    // 有限范围八邻域距离变换；边缘取相邻瓦片，陆地不会被误当海岸画框。
    for (let y = 1; y < ph; y++) for (let x = 1; x < pw - 1; x++) {
        const i = y * pw + x;
        distance[i] = Math.min(distance[i], distance[i-1]+1, distance[i-pw]+1,
            distance[i-pw-1]+Math.SQRT2, distance[i-pw+1]+Math.SQRT2);
    }
    for (let y = ph - 2; y >= 0; y--) for (let x = pw - 2; x > 0; x--) {
        const i = y * pw + x;
        distance[i] = Math.min(distance[i], distance[i+1]+1, distance[i+pw]+1,
            distance[i+pw-1]+Math.SQRT2, distance[i+pw+1]+Math.SQRT2);
    }
    const out = new Uint8ClampedArray(w * h * 4);
    const { base, shoreLift } = STRATEGIC_WATER_PALETTE;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y + pad) * pw + x + pad, o = (y * w + x) * 4;
        const wx = tile.x * w + x, wy = tile.y * h + y;
        // 拉长 DE 水纹形成有方向的细浪，双线性采样避免斜向像素台阶。
        const warp = Math.sin(wx / 143 + wy / 219) * 4;
        const swell = waterDetailAt(detail, (wx + wy * 0.25) * 0.22, (wy - wx * 0.12) * 0.8 + warp);
        const grain = waterDetailAt(detail, wx, wy) * 0.15 + swell * 0.45;
        const tone = waterToneAt(wx, wy) * 0.75;
        // 岸边亮度与过渡宽度取原效果和减弱版的中间值，突出海岸层次。
        const reach = 7 + Math.sin(wx / 39 + wy / 57) * 2;
        const shore = water[i] ? Math.pow(Math.max(0, 1 - distance[i] / reach), 1.4) : 0;
        // 浪花仅少量点缀岸边，不连续描白边。
        const glint = water[i] && distance[i] < 1.5
            ? Math.max(0, Math.sin(wx / 7 + Math.sin(wy / 11)) - 0.65) * 24 : 0;
        out[o] = base[0] + tone * 0.8 + grain * 0.70 + shore * shoreLift[0] + glint;
        out[o+1] = base[1] + tone * 1.3 + grain + shore * shoreLift[1] + glint;
        out[o+2] = base[2] + tone * 1.4 + grain * 1.05 + shore * shoreLift[2] + glint;
        if (water[i]) out[o+3] = 255;
        else {
            const coverage = (water[i-1] + water[i+1] + water[i-pw] + water[i+pw]) / 4;
            out[o+3] = Math.round(coverage * 0.18 * 255);
        }
    }
    return out;
}
