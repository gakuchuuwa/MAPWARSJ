// 战略水面只取真实水域掩膜；明暗来自 DE 材质，不再透出各块 DEM 的水深接缝。
const SIZE = 128;
/** 海、湖与矢量河流共用的水色；近岸增量只表达视觉过渡。 */
export const STRATEGIC_WATER_PALETTE = {
    /** 浅海中段渐变蓝 (Mid-Shelf Blue) */
    base: [38, 98, 140] as const,
    shoreLift: [12, 38, 28] as const,
    /** 深海深邃蓝 (Abyssal Deep Blue) */
    deep: [22, 62, 100] as const,
    /** 浅滩、内陆宽河与矢量河流共用统一浅蓝绿水色 (Shallows & River Unified Cyan-Blue) */
    coastalAzure: [62, 148, 174] as const,
    /** 贴岸极浅清透水色 (Shore Shallows Highlight) */
    shallowReef: [76, 166, 186] as const,
};
export const STRATEGIC_WATER_COLOR = `rgb(${STRATEGIC_WATER_PALETTE.coastalAzure.join(',')})`;
export const STRATEGIC_RIVER_BANK_COLOR = `rgb(${STRATEGIC_WATER_PALETTE.coastalAzure.map(
    (value, channel) => Math.round(value + STRATEGIC_WATER_PALETTE.shoreLift[channel] * 0.25),
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
    const pad = 32, pw = w + pad * 2, ph = h + pad * 2;
    const distance = new Float32Array(pw * ph);
    const water = new Uint8Array(pw * ph);
    const worldWidth = 2 ** tile.z;
    let hasLand = false;
    for (let y = -pad; y < h + pad; y++) for (let x = -pad; x < w + pad; x++) {
        const tx = Math.floor(x / w), ty = Math.floor(y / h);
        const nx = ((tile.x + tx) % worldWidth + worldWidth) % worldWidth;
        const neighbor = tx === 0 && ty === 0 ? tile : tiles.get(`${tile.z}/${nx}/${tile.y + ty}`);
        const m = neighbor
            ? neighbor.mask[((y % h + h) % h) * w + ((x % w + w) % w)]
            : mask[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
        const i = (y + pad) * pw + x + pad;
        water[i] = m;
        if (m) {
            distance[i] = pad + 1;
        } else {
            distance[i] = 0;
            hasLand = true;
        }
    }
    if (hasLand) {
        // 剔除水面内部因底图 JPEG 压缩产生的单像素孤立噪点（周围 8 邻域 ≥7 个是水），避免在海中产生虚假浅滩光圈或斑点
        for (let y = 1; y < ph - 1; y++) for (let x = 1; x < pw - 1; x++) {
            const i = y * pw + x;
            if (water[i]) continue;
            const n = water[i - pw - 1] + water[i - pw] + water[i - pw + 1]
                    + water[i - 1] + water[i + 1]
                    + water[i + pw - 1] + water[i + pw] + water[i + pw + 1];
            if (n >= 7) distance[i] = pad + 1;
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
    }
    const out = new Uint8ClampedArray(w * h * 4);
    const { base, deep, coastalAzure, shallowReef } = STRATEGIC_WATER_PALETTE;
    const depthT = tile.depthT ?? null;
    const wavePoints: number[] = [];
    const worldPx = 2 ** tile.z * w;

    for (let y = 0; y < h; y++) {
        const wy = tile.y * h + y;
        // 计算当前行的全局纬度，仅在热带与高纬极地做轻微水色微调，温带保持与矢量河流完全一致的 coastalAzure
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (wy + 0.5) / worldPx))) * 180 / Math.PI;
        const absLat = Math.abs(lat);
        const tropicalT = Math.max(0, Math.min(1, (26 - absLat) / 10));
        const arcticT = Math.max(0, Math.min(1, (absLat - 56) / 14));

        const azureR = Math.round(coastalAzure[0] + tropicalT * 3 - arcticT * 5);
        const azureG = Math.round(coastalAzure[1] + tropicalT * 8 - arcticT * 10);
        const azureB = Math.round(coastalAzure[2] + tropicalT * 4 - arcticT * 8);

        const reefR = Math.round(shallowReef[0] + tropicalT * 4 - arcticT * 6);
        const reefG = Math.round(shallowReef[1] + tropicalT * 8 - arcticT * 14);
        const reefB = Math.round(shallowReef[2] + tropicalT * 3 - arcticT * 12);

        for (let x = 0; x < w; x++) {
            const i = (y + pad) * pw + x + pad, o = (y * w + x) * 4;
            if (!water[i]) {
                const coverage = (water[i-1] + water[i+1] + water[i-pw] + water[i+pw]) * 0.25;
                if (coverage > 0) {
                    out[o] = Math.round(azureR * 0.62);
                    out[o+1] = Math.round(azureG * 0.64);
                    out[o+2] = Math.round(azureB * 0.66);
                    out[o+3] = Math.round(coverage * 0.32 * 255);
                }
                continue;
            }
            const wx = tile.x * w + x;

            // 拉长 DE 水纹形成有方向的细浪，双线性采样避免斜向像素台阶。
            const warp = Math.sin(wx / 143 + wy / 219) * 4;
            const swell = waterDetailAt(detail, (wx + wy * 0.25) * 0.22, (wy - wx * 0.12) * 0.8 + warp);
            const grain = waterDetailAt(detail, wx, wy) * 0.20 + swell * 0.62;
            const tone = waterToneAt(wx, wy);

            // 三段连续渐变：浅滩/河流浅蓝 (effD=0, 与矢量河流同色) → 浅海渐变蓝 (effD=0.50) → 深海深蓝 (effD=1.0)
            const d = depthT ? depthT[y * w + x] : 0;
            const dist = distance[i];
            // 连续离岸加深（无 d<0.03 硬阈值跳变，彻底消除海面暗沙/小岛周边的深蓝雀斑）：
            // 河道与近岸（dist <= 8px）保持 0（与矢量河流完全同色）；离岸 8~28px 平滑推向浅海中蓝 (0.50)
            const offshoreT = dist > 8 ? (dist >= 28 ? 0.50 : ((dist - 8) / 20) * 0.50) : 0;
            let effD = Math.max(d, offshoreT);

            // 近岸浅滩过渡带：收窄至离岸 reach (6~10px)，在海岸边缘平滑压浅，避免浅水区过大（dist >= 11 时必在 reach 外，省去三角函数）
            if (dist < 11) {
                const depthFactor = Math.max(0.55, 1 - d * 0.45);
                const reach = (8.5 + Math.sin(wx / 37 + wy / 51) * 1.2 + Math.sin((wx - wy) / 23) * 0.8) * depthFactor;
                if (dist < reach) {
                    const u = Math.max(0, Math.min(1, dist / reach));
                    const coastFade = u * u * (3 - 2 * u); // smoothstep 0..1
                    effD *= coastFade;
                }
            }

            let r: number, g: number, b: number;
            const MID_STOP = 0.50;
            if (effD <= MID_STOP) {
                // 第一段：浅滩/河道浅蓝 (azure) → 浅海渐变蓝 (base)
                const t1 = effD / MID_STOP;
                r = azureR + (base[0] - azureR) * t1;
                g = azureG + (base[1] - azureG) * t1;
                b = azureB + (base[2] - azureB) * t1;
            } else {
                // 第二段：浅海渐变蓝 (base) → 深海深邃蓝 (deep)
                const t2 = Math.min(1, (effD - MID_STOP) / (1 - MID_STOP));
                r = base[0] + (deep[0] - base[0]) * t2;
                g = base[1] + (deep[1] - base[1]) * t2;
                b = base[2] + (deep[2] - base[2]) * t2;
            }

            if (dist < 4.5) {
                // 贴岸 4.5px 内微透清浅浅滩色 (shallowReef)
                const seamT = Math.pow(1 - dist / 4.5, 1.2) * 0.42;
                r = r * (1 - seamT) + reefR * seamT;
                g = g * (1 - seamT) + reefG * seamT;
                b = b * (1 - seamT) + reefB * seamT;
                // 贴岸 1.5px 水岸湿润微暗浸润边，让水体自然嵌入大地
                if (dist < 1.5) {
                    const bankShade = 1 - (1 - dist / 1.5) * 0.12;
                    r *= bankShade;
                    g *= bankShade;
                    b *= bankShade;
                }
            }

            // 岸边极细断续碎沫微光 (距岸 1.4 像素内的点缀微浪，绝不连成白线)
            const glint = dist < 1.4
                ? Math.max(0, Math.sin(wx / 5 + Math.sin(wy / 8)) - 0.52) * 30 : 0;

            out[o] = Math.min(255, Math.max(0, r + tone * 0.7 + grain * 0.65 + glint));
            out[o+1] = Math.min(255, Math.max(0, g + tone * 1.1 + grain * 0.90 + glint * 1.05));
            out[o+2] = Math.min(255, Math.max(0, b + tone * 1.2 + grain * 0.95 + glint * 1.05));
            out[o+3] = 255;

            // 采样浪花微动点（仅在贴岸 1.0 ~ 2.2px 极稀疏采样偶发微沫核）
            if (dist >= 1.0 && dist <= 2.2) {
                if (((x * 17 + y * 23) % 47 === 0) && ((wx + wy) % 11 === 0)) {
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
        }
    }
    return { data: out, waves: new Float32Array(wavePoints) };
}
