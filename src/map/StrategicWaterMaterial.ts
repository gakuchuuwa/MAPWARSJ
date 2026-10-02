// 战略水面只取真实水域掩膜；明暗来自 DE 材质，不再透出各块 DEM 的水深接缝。
const SIZE = 128;
/** 海、湖与矢量河流共用的水色；近岸增量只表达视觉过渡。 */
export const STRATEGIC_WATER_PALETTE = {
    base: [42, 98, 134] as const,
    shoreLift: [12, 38, 28] as const,
    /** 深海色：水深越大越接近它（见 RiverWorker 的 depthT；湖、河、高处的水深度为 0，保持 base） */
    deep: [18, 48, 76] as const,
    /** 近海浅水与河流入海统一水色 (Coastal Azure & River Estuary) */
    coastalAzure: [54, 136, 162] as const,
    /** 贴岸浅滩/极浅清透水色 (Shore Shallows) */
    shallowReef: [64, 156, 174] as const,
};
export const STRATEGIC_WATER_COLOR = `rgb(${STRATEGIC_WATER_PALETTE.base.join(',')})`;
export const STRATEGIC_RIVER_BANK_COLOR = `rgb(${STRATEGIC_WATER_PALETTE.base.map(
    (value, channel) => Math.round(value + STRATEGIC_WATER_PALETTE.shoreLift[channel] * 0.35),
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
    /**
     * 逐像素水深权重 0..1（0 = 浅/湖/河，1 = 深海）。由 RiverWorker 从**同一张粗级（z6）高程**双线性采样得出，
     * 全图每块用同一份数据、同一种算法 → 块与块之间天然连续，没有「这块深、那块浅」的方块。取不到为 null → 平色。
     */
    depthT?: Float32Array | null;
}

export interface StrategicWaterResult {
    data: Uint8ClampedArray;
    waves: Float32Array;
}

/** 邻接瓦片只提供真实水域掩膜，不改变海陆判定。 */
export function renderStrategicWater(
    tile: WaterTileMask, tiles: ReadonlyMap<string, WaterTileMask>, detail: Float32Array | null,
): StrategicWaterResult {
    const { width: w, height: h, mask } = tile;
    const pad = 24, pw = w + pad * 2, ph = h + pad * 2;
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
    const { base, deep } = STRATEGIC_WATER_PALETTE;
    const depthT = tile.depthT ?? null;
    const wavePoints: number[] = [];
    const worldPx = 2 ** tile.z * w;

    for (let y = 0; y < h; y++) {
        const wy = tile.y * h + y;
        // 计算当前行的全局纬度，实现全球水色气候自适应
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (wy + 0.5) / worldPx))) * 180 / Math.PI;
        const absLat = Math.abs(lat);
        // 热带/暖海程度 (0~1) 与 极地/高纬寒海程度 (0~1)
        const tropicalT = Math.max(0, Math.min(1, (28 - absLat) / 10)); // <18° 满热带，>28° 为 0
        const arcticT = Math.max(0, Math.min(1, (absLat - 48) / 14));   // >62° 满寒带，<48° 为 0

        // 全球自适应近海青蓝与浅滩水色（基准 coastalAzure [54, 136, 162] 与河流入海色完全同源）
        const azureR = Math.round(54 + tropicalT * 4 - arcticT * 6);
        const azureG = Math.round(136 + tropicalT * 12 - arcticT * 14);
        const azureB = Math.round(162 + tropicalT * 6 - arcticT * 12);

        const reefR = Math.round(64 + tropicalT * 6 - arcticT * 8);
        const reefG = Math.round(156 + tropicalT * 12 - arcticT * 20);
        const reefB = Math.round(174 + tropicalT * 4 - arcticT * 16);

        for (let x = 0; x < w; x++) {
            const i = (y + pad) * pw + x + pad, o = (y * w + x) * 4;
            const wx = tile.x * w + x;

            // 拉长 DE 水纹形成有方向的细浪，双线性采样避免斜向像素台阶。
            const warp = Math.sin(wx / 143 + wy / 219) * 4;
            const swell = waterDetailAt(detail, (wx + wy * 0.25) * 0.22, (wy - wx * 0.12) * 0.8 + warp);
            const grain = waterDetailAt(detail, wx, wy) * 0.20 + swell * 0.62;
            const tone = waterToneAt(wx, wy);

            // 水深上色：大洋深海接近 deep，近海基调 base
            const d = depthT ? depthT[y * w + x] : 0;
            let r = base[0] + (deep[0] - base[0]) * d;
            let g = base[1] + (deep[1] - base[1]) * d;
            let b = base[2] + (deep[2] - base[2]) * d;

            // 沿岸浅海过渡：与真实海底水深（DEM depthT）有机联动
            // 陡峭海沟/岬角处水深直接坠下（浅水带极窄 4~6px），平缓大陆架/海湾处平缓开阔（11~15px）
            const depthFactor = Math.max(0.35, 1 - d * 0.70);
            const dist = distance[i];
            const reach = (12 + Math.sin(wx / 37 + wy / 51) * 3.0 + Math.sin((wx - wy) / 23) * 1.5) * depthFactor;

            if (water[i] && dist < reach) {
                // 1. 近海与河口浅水渐变（舒缓平滑过渡，与河流入海口浑然一体）
                const shelfT = Math.pow(1 - dist / reach, 1.35) * 0.75;
                r = r * (1 - shelfT) + azureR * shelfT;
                g = g * (1 - shelfT) + azureG * shelfT;
                b = b * (1 - shelfT) + azureB * shelfT;

                // 2. 贴岸极浅清透水层（距岸 3px 内极轻微透沙，透明度克制在 0.45）
                if (dist < 3.0) {
                    const reefT = Math.pow(1 - dist / 3.0, 1.4) * 0.45;
                    r = r * (1 - reefT) + reefR * reefT;
                    g = g * (1 - reefT) + reefG * reefT;
                    b = b * (1 - reefT) + reefB * reefT;
                }
            }

            // 岸边浪花微光 (距离 < 1.6 像素处的柔和白色细浪)
            const glint = water[i] && dist < 1.6
                ? Math.max(0, Math.sin(wx / 5 + Math.sin(wy / 8)) - 0.48) * 35 : 0;

            out[o] = Math.min(255, Math.max(0, r + tone * 0.7 + grain * 0.65 + glint));
            out[o+1] = Math.min(255, Math.max(0, g + tone * 1.1 + grain * 0.90 + glint * 1.05));
            out[o+2] = Math.min(255, Math.max(0, b + tone * 1.2 + grain * 0.95 + glint * 1.05));

            // 采样浪花微动点（在 2.0 ~ 4.8px 浪区疏朗采样，生成散落自然的潮汐微浪核）
            if (water[i] && dist >= 2.0 && dist <= 4.8) {
                if (((x * 13 + y * 17) % 29 === 0) && ((wx + wy) % 7 === 0)) {
                    let nx = (distance[i + 1] - distance[i - 1]) * 0.5;
                    let ny = (distance[i + pw] - distance[i - pw]) * 0.5;
                    const len = Math.hypot(nx, ny);
                    if (len > 0.05) {
                        nx /= len;
                        ny /= len;
                        const noise = Math.sin(wx * 0.08 + wy * 0.06);
                        wavePoints.push(x, y, dist, nx, ny, noise);
                    }
                }
            }

            // 🔴 [2026-09-30 血训] 曾把离岸 16 像素外的水面改透明想透出下层海深 —— 结果内陆湖整片变空。水面一律不透明。
            if (water[i]) out[o+3] = 255;
            else {
                const coverage = (water[i-1] + water[i+1] + water[i-pw] + water[i+pw]) / 4;
                if (coverage > 0) {
                    out[o] = Math.round(reefR * 0.85);
                    out[o+1] = Math.round(reefG * 0.85);
                    out[o+2] = Math.round(reefB * 0.85);
                    out[o+3] = Math.round(coverage * 0.22 * 255);
                }
            }
        }
    }
    return { data: out, waves: new Float32Array(wavePoints) };
}
