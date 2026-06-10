/**
 * HillshadeWorker.ts
 * Offloads heavy terrain math to a background thread
 */

// Define message types
export interface HillshadeRegion {
    center: [number, number];   // [lat, lng]
    radii: [number, number];    // [latDeg, lngDeg]
    color: [number, number, number];
    blendStrength: number;
    elevMin: number;
    elevMax: number;
}

export interface HillshadeRequest {
    id: number;
    width: number;
    height: number;
    data: Uint8ClampedArray; // Heightmap pixels
    params: {
        azimuth: number;
        altitude: number;
        zFactor: number;
        opacity: number;
        useElevationColor: boolean;
    };
    // [NEW] Tile bounds for per-pixel lat/lng calculation
    tileBounds?: {
        north: number;
        south: number;
        west: number;
        east: number;
    };
    // [NEW] Historical regions to apply (sand, wetland, etc.)
    regions?: HillshadeRegion[];
}

export interface HillshadeResponse {
    id: number;
    data: Uint8ClampedArray; // Processed pixels
}

// Pre-allocate LUTs in Worker Scope
let colorLUT: Uint8ClampedArray | null = null;
let noiseLUT: Float32Array | null = null;
const LUT_OFFSET = 500;
const LUT_MAX_ELEV = 9000;

// Initialize LUTs (Copy logic from HillshadeLayer)
function initLUTs() {
    if (colorLUT) return;

    // --- Color LUT ---
    const range = LUT_OFFSET + LUT_MAX_ELEV;
    const lut = new Uint8ClampedArray(range * 3);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpColor = (c1: number[], c2: number[], t: number, out: any, offset: number) => {
        out[offset] = lerp(c1[0], c2[0], t);
        out[offset + 1] = lerp(c1[1], c2[1], t);
        out[offset + 2] = lerp(c1[2], c2[2], t);
    };

    // [OCEAN-REV2] 6 段海洋色阶,潮间带收敛,避免大片浅水发白
    const abyss = [18, 38, 75];             // < -4000m 深渊靛蓝(南海深处)
    const deepOcean = [35, 65, 100];        // -1500m 深海(过渡终点)
    const shelfBlue = [70, 110, 140];       // -300m 大陆坡
    const shallowCyan = [105, 160, 185];    // -30m 大陆架(渤海/黄海主体)
    const shoalCyan = [140, 185, 200];      // -5m 近岸浅水
    const coastalFoam = [180, 200, 200];    // 0m 潮间带(降低亮度,避免白带)
    // [TERRAIN-COLOR-REV2] 参照 Map Library "Vegetation-Based" + EU4 + QGIS 专业制图色阶
    // 低地绿对标 sage green RGB(143,188,143) 16% 饱和,而非"草坪绿"
    const coastalSand = [165, 180, 150];    // 海岸冲积低饱和绿 (16%饱和)
    const lowlandPale = [150, 178, 135];    // 0-400m sage 平原绿 (对标 Map Library)
    const lowlandEnd = [130, 160, 115];     // 400m 锚点林地深绿 (22%饱和)
    const sandBeige = [185, 185, 145];      // 1000m 过渡橄榄黄
    const loessYellow = [212, 192, 138];    // 1300m 黄土起点 (保持)
    const loessMid = [195, 180, 140];       // 2500m 黄土核心 (保持)
    // [TERRAIN-COLOR-REV2] 高原色相由暖转冷,参照 Bartholomew "高海拔灰" + "3000m+ pale blue" 传统
    const gobiBrown = [160, 165, 160];      // ~3000m 高山过渡,引入冷灰绿
    const alpineSteppe = [185, 175, 140];   // ~3800m 高山草甸黄(保持,本身正确)
    const highColdDesert = [145, 150, 160]; // ~4200m 冷调石灰(寒漠)
    const permafrost = [110, 120, 140];     // ~4600m 永冻土冷青灰
    const rockGrey = [85, 95, 115];         // ~5000m 冷板岩(雪线下裸岩)
    const snowWhite = [255, 255, 255];

    for (let i = 0; i < range; i++) {
        const elev = i - LUT_OFFSET;
        const offset = i * 3;
        // [OCEAN-REV2] 6 段海洋色阶,潮间带收敛到 -3~0m
        if (elev < -4000) { lut[offset] = abyss[0]; lut[offset + 1] = abyss[1]; lut[offset + 2] = abyss[2]; }
        else if (elev < -1500) lerpColor(abyss, deepOcean, (elev + 4000) / 2500, lut, offset);
        else if (elev < -300) lerpColor(deepOcean, shelfBlue, (elev + 1500) / 1200, lut, offset);
        else if (elev < -30) lerpColor(shelfBlue, shallowCyan, (elev + 300) / 270, lut, offset);
        else if (elev < -3) lerpColor(shallowCyan, shoalCyan, (elev + 30) / 27, lut, offset);
        else if (elev < 0) lerpColor(shoalCyan, coastalFoam, (elev + 3) / 3, lut, offset);
        else if (elev < 20) lerpColor(coastalFoam, lowlandPale, elev / 20, lut, offset);
        else if (elev < 400) lerpColor(lowlandPale, lowlandEnd, (elev - 20) / 380, lut, offset);
        else if (elev < 1000) lerpColor(lowlandEnd, sandBeige, (elev - 400) / 600, lut, offset);
        else if (elev < 1300) lerpColor(sandBeige, loessYellow, (elev - 1000) / 300, lut, offset);
        else if (elev < 2500) lerpColor(loessYellow, loessMid, (elev - 1300) / 1200, lut, offset);
        else if (elev < 3500) lerpColor(loessMid, gobiBrown, (elev - 2500) / 1000, lut, offset);
        else if (elev < 4000) lerpColor(gobiBrown, alpineSteppe, (elev - 3500) / 500, lut, offset);
        else if (elev < 4400) lerpColor(alpineSteppe, highColdDesert, (elev - 4000) / 400, lut, offset);
        else if (elev < 4800) lerpColor(highColdDesert, permafrost, (elev - 4400) / 400, lut, offset);
        else if (elev < 5200) lerpColor(permafrost, rockGrey, (elev - 4800) / 400, lut, offset);
        else if (elev < 5500) lerpColor(rockGrey, snowWhite, (elev - 5200) / 300, lut, offset);
        else { lut[offset] = snowWhite[0]; lut[offset + 1] = snowWhite[1]; lut[offset + 2] = snowWhite[2]; }
    }
    colorLUT = lut;

    // --- Noise LUT ---
    const size = 256;
    const nLut = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const hash = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
            const noise = (hash - Math.floor(hash) - 0.5) * 4.0;
            nLut[y * size + x] = noise;
        }
    }
    noiseLUT = nLut;
}

self.onmessage = (e: MessageEvent<HillshadeRequest>) => {
    initLUTs();
    if (!colorLUT || !noiseLUT) return;

    const { id, width, height, data, params, tileBounds, regions } = e.data;
    const output = new Uint8ClampedArray(width * height * 4);

    // [REGION-PREP] 预解析区域用于逐像素查询
    const hasRegions = !!(regions && regions.length > 0 && tileBounds);
    const regionLatStep = hasRegions ? (tileBounds!.south - tileBounds!.north) / height : 0;
    const regionLngStep = hasRegions ? (tileBounds!.east - tileBounds!.west) / width : 0;

    // Process params
    const azimuthRad = (params.azimuth * Math.PI) / 180;
    const altitudeRad = (params.altitude * Math.PI) / 180;
    const cosAzimuth = Math.cos(azimuthRad);
    const sinAzimuth = Math.sin(azimuthRad);
    const cosAltitude = Math.cos(altitudeRad);
    const sinAltitude = Math.sin(altitudeRad);

    // [MULTI-AZIMUTH] 两方向光照混合,模拟"主太阳+西方反射"
    // 主光 = 用户配置方位(默认 NW 315°),保留传统制图日照惯例
    // 副光 = 主光 -45° (W ~270°),补足主光"平行山脊"丢失的细节
    const azPrimary = azimuthRad;
    const azSecondary = azimuthRad - Math.PI / 4;
    const WEIGHT_PRIMARY = 0.65;
    const WEIGHT_SECONDARY = 0.35;

    const INV_8 = 0.125;
    let divisor = 320 - (params.zFactor * 10);
    if (divisor < 20) divisor = 20;

    // [OPTIMIZATION-PERF] Branch logic outside the loop
    if (params.useElevationColor) {
        // --- COLORED RENDERING PATH ---
        for (let y = 0; y < height; y++) {
            const yT = (y === 0 ? 0 : y - 1) * width;
            const yM = y * width;
            const yB = (y === height - 1 ? height - 1 : y + 1) * width;
            const noiseYRow = (y & 255) * 256;

            for (let x = 0; x < width; x++) {
                const idx = (yM + x) * 4;

                // X Neighbors
                const xL = (x === 0 ? 0 : x - 1);
                const xR = (x === width - 1 ? width - 1 : x + 1);

                // Fetch Z logic inlined or helper (helper optimizes poorly in some JS engines but keeps code dry)
                // Inlining for max perf in worker
                const getZ = (baseIdx: number) => (data[baseIdx] * 256 + data[baseIdx + 1] + data[baseIdx + 2] * 0.00390625) - 32768;

                const zTL = getZ((yT + xL) * 4);
                const zT = getZ((yT + x) * 4);
                const zTR = getZ((yT + xR) * 4);
                const zL = getZ((yM + xL) * 4);
                const zC = getZ(idx);
                const zR = getZ((yM + xR) * 4);
                const zBL = getZ((yB + xL) * 4);
                const zB = getZ((yB + x) * 4);
                const zBR = getZ((yB + xR) * 4);

                const dzdx = ((zTR + 2 * zR + zBR) - (zTL + 2 * zL + zBL)) * INV_8;
                const dzdy = ((zBL + 2 * zB + zBR) - (zTL + 2 * zT + zTR)) * INV_8;

                const slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy) / divisor);
                let aspect = Math.atan2(dzdy, -dzdx);
                if (aspect < 0) aspect += 2 * Math.PI;

                // [MULTI-AZIMUTH] 两方向叠加,主光(NW)+副光(W)加权混合
                // 预计算公共项避免重复运算
                const cosSlope = Math.cos(slope);
                const sinSlope = Math.sin(slope);
                const ambDiff = cosAltitude * cosSlope;
                const dirComp = sinAltitude * sinSlope;
                const hsP = ambDiff + dirComp * Math.cos(azPrimary - aspect);
                const hsS = ambDiff + dirComp * Math.cos(azSecondary - aspect);
                let hillshade = hsP * WEIGHT_PRIMARY + hsS * WEIGHT_SECONDARY;

                // Color Logic
                const zAvg = (zTL + zT + zTR + zL + zR + zBL + zB + zBR) * INV_8;
                const curvature = zC - zAvg;
                const aoStrength = Math.min(4.0, 1.5 * (params.zFactor * 0.1));
                let aoFactor = (curvature < 0)
                    ? Math.max(0.5, 1.0 + (curvature * 0.004 * aoStrength))
                    : Math.min(1.25, 1.0 + (curvature * 0.003 * aoStrength)); // 山脊增亮上限 1.15→1.25
                hillshade *= aoFactor;

                let shadowStrength = 0.55;
                let ambientBase = 0.70;
                if (zC < 1000) { shadowStrength = 0.75; ambientBase = 0.50; }
                else if (zC < 1300) {
                    const t = (zC - 1000) * 0.003333;
                    shadowStrength = 0.75 - (0.20 * t);
                    ambientBase = 0.50 + (0.20 * t);
                }
                if (zC > 4200) {
                    const t = Math.min(1.0, (zC - 4200) * 0.001);
                    shadowStrength = 0.55 - (0.1 * t);
                    ambientBase = 0.70 + (0.1 * t);
                }

                // [FIX] Apply Opacity Parameter
                shadowStrength *= params.opacity;

                const shadeFactor = ambientBase + hillshade * shadowStrength;
                //const shadeFactor = Math.min(1.0, ambientBase + hillshade * shadowStrength);

                let noise = 0;
                if (zC > 0) {
                    noise = noiseLUT[noiseYRow + (x & 255)];
                    if (zC + noise <= 0) noise = -zC + 0.1;
                }

                let elevIndex = Math.floor(zC + noise) + LUT_OFFSET;
                if (elevIndex < 0) elevIndex = 0;
                else if (elevIndex > LUT_MAX_ELEV + LUT_OFFSET) elevIndex = LUT_MAX_ELEV + LUT_OFFSET;

                const lIdx = elevIndex * 3;
                let r = colorLUT[lIdx];
                let g = colorLUT[lIdx + 1];
                let b = colorLUT[lIdx + 2];

                if (zC > 0 && zC < 1500) {
                    const grain = 1.0 + (noise * 0.03);
                    r *= grain; g *= grain; b *= grain;
                }
                // [NEW] High Altitude Noise for greater texture
                if (zC > 3000) {
                    const grain = 1.0 + (noise * 0.05); // Stronger grain for rock/mountain
                    r *= grain; g *= grain; b *= grain;
                }
                // [OCEAN-TEXTURE] 海面极轻微噪声,破除"死板纯色",模拟水面光斑
                if (zC < 0) {
                    const oceanNoise = noiseLUT[noiseYRow + (x & 255)];
                    const oceanGrain = 1.0 + (oceanNoise * 0.006); // ±0.6% 亮度微扰
                    r *= oceanGrain; g *= oceanGrain; b *= oceanGrain;
                }

                // [HISTORICAL-REGIONS] 沙漠/湿地/古湖等历史地理特殊区域着色
                if (hasRegions && zC > 0) {
                    const lat = tileBounds!.north + y * regionLatStep;
                    const lng = tileBounds!.west + x * regionLngStep;
                    for (let ri = 0; ri < regions!.length; ri++) {
                        const reg = regions![ri];
                        if (zC < reg.elevMin || zC > reg.elevMax) continue;
                        const dLat = (lat - reg.center[0]) / reg.radii[0];
                        const dLng = (lng - reg.center[1]) / reg.radii[1];
                        const d2 = dLat * dLat + dLng * dLng;
                        if (d2 >= 1.0) continue;
                        // 椭圆衰减(平方曲线), 边缘 0 中心 1
                        const falloff = (1.0 - d2) * (1.0 - d2);
                        const w = falloff * reg.blendStrength;
                        const iw = 1.0 - w;
                        r = r * iw + reg.color[0] * w;
                        g = g * iw + reg.color[1] * w;
                        b = b * iw + reg.color[2] * w;
                    }
                }
                if (zC >= 1300 && zC < 3800 && curvature < -0.3) {
                    let eStr = Math.min(0.35, (Math.abs(curvature) - 0.3) * 0.15);
                    if (zC < 1500) eStr *= (zC - 1300) / 200;
                    else if (zC > 3500) eStr *= (3800 - zC) / 300;
                    const invE = 1 - eStr;
                    r = r * invE + 160 * eStr; g = g * invE + 140 * eStr; b = b * invE + 100 * eStr;
                }
                if (zC < 1300 && curvature < -0.5) {
                    const vStr = Math.min(0.2, Math.abs(curvature) * 0.04);
                    const invV = 1 - vStr;
                    r = r * invV + 100 * vStr; g = g * invV + 115 * vStr; b = b * invV + 90 * vStr;
                }
                if (zC > 4000 && curvature > 2.0) {
                    const rStr = Math.min(0.4, (curvature - 2.0) * 0.05);
                    const invR = 1 - rStr;
                    r = r * invR + 230 * rStr; g = g * invR + 220 * rStr; b = b * invR + 210 * rStr;
                }

                output[idx] = r * shadeFactor;
                output[idx + 1] = g * shadeFactor;
                output[idx + 2] = b * shadeFactor;
                output[idx + 3] = 255;
            }
        }
    } else {
        // --- GRAYSCALE/HILLSHADE ONLY PATH ---
        for (let y = 0; y < height; y++) {
            const yT = (y === 0 ? 0 : y - 1) * width;
            const yM = y * width;
            const yB = (y === height - 1 ? height - 1 : y + 1) * width;

            for (let x = 0; x < width; x++) {
                const idx = (yM + x) * 4;

                const xL = (x === 0 ? 0 : x - 1);
                const xR = (x === width - 1 ? width - 1 : x + 1);

                const getZ = (baseIdx: number) => (data[baseIdx] * 256 + data[baseIdx + 1] + data[baseIdx + 2] * 0.00390625) - 32768;

                const zTL = getZ((yT + xL) * 4);
                const zT = getZ((yT + x) * 4);
                const zTR = getZ((yT + xR) * 4);
                const zL = getZ((yM + xL) * 4);
                const zR = getZ((yM + xR) * 4);
                const zBL = getZ((yB + xL) * 4);
                const zB = getZ((yB + x) * 4);
                const zBR = getZ((yB + xR) * 4);

                const dzdx = ((zTR + 2 * zR + zBR) - (zTL + 2 * zL + zBL)) * INV_8;
                const dzdy = ((zBL + 2 * zB + zBR) - (zTL + 2 * zT + zTR)) * INV_8;

                const slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy) / divisor);
                let aspect = Math.atan2(dzdy, -dzdx);
                if (aspect < 0) aspect += 2 * Math.PI;

                // [MULTI-AZIMUTH] grayscale path 同步更新
                const _cosS = Math.cos(slope), _sinS = Math.sin(slope);
                const _ad = cosAltitude * _cosS, _dc = sinAltitude * _sinS;
                let hillshade = (_ad + _dc * Math.cos(azPrimary - aspect)) * WEIGHT_PRIMARY
                              + (_ad + _dc * Math.cos(azSecondary - aspect)) * WEIGHT_SECONDARY;

                const val = hillshade * 255;
                if (val < 180) {
                    output[idx] = 0; output[idx + 1] = 0; output[idx + 2] = 20;
                    let alpha = (180 - val) * 0.00555 * 255 * params.opacity;
                    output[idx + 3] = (alpha > 240) ? 240 : alpha;
                } else if (val > 220) {
                    output[idx] = 255; output[idx + 1] = 255; output[idx + 2] = 240;
                    let alpha = (val - 220) * 0.02857 * 255 * params.opacity * 0.8;
                    output[idx + 3] = (alpha > 255) ? 255 : alpha;
                } else {
                    output[idx + 3] = 0;
                }
            }
        }
    }

    // Return result (transferable)
    // Cast to any to avoid TS matching Window.postMessage instead of Worker.postMessage
    (self as any).postMessage({ id, data: output } as HillshadeResponse, [output.buffer]);
};
