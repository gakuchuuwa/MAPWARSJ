import { envZoneAt, type EnvZone } from './envZones';
export const resolveEnvZoneId = envZoneAt;
export type EnvZoneId = EnvZone;
import { queryAridSand, queryWinterSnow } from '../../map/StrategicTerrainMaterial';

/**
 * 全球分气候带的春(0)·夏(1)·秋(2)·冬(3)大地四季变化单一真源
 * 战略地图（HillshadeWorker / HillshadeLayer / VegetationLayer / CityLifeAmbientLayer）
 * 与战术地图（Scene13EnvironmentGenerator / Scene13GroundSetup / Scene13GroundLayerGL）共用同一套四季气候法则。
 */
export type CalendarSeason4 = 0 | 1 | 2 | 3;

export interface SeasonalGroundModulation {
    /** 植被/草地层的 RGB 乘子 */
    rMul: number;
    gMul: number;
    bMul: number;
    /** 季节目标色（如秋草金黄、冬枯霜褐、雨季翠绿、旱季枯黄）及其混合权重 0..1 */
    targetR: number;
    targetG: number;
    targetB: number;
    targetMix: number;
    /** 战术地面干草混合偏移（>0 扩大金黄/枯草层，<0 扩大苍翠青草层） */
    dryBias: number;
    /** 当前当地有效季节（0春 1夏 2秋 3冬，南半球已反转） */
    localSeason: CalendarSeason4;
}

function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

/**
 * 连续平滑区间权重：在 [min, max] 内部为 1，两侧各以 feather 宽度做 C¹ smoothstep 羽化过渡，彻底消除任何经纬度或干湿度硬切边
 */
function smoothBand(x: number, min: number, max: number, feather: number): number {
    return smoothstep(min - feather, min + feather, x) * (1 - smoothstep(max - feather, max + feather, x));
}

function smoothBox(
    lat: number,
    lng: number,
    latMin: number,
    latMax: number,
    lngMin: number,
    lngMax: number,
    featherLat: number,
    featherLng: number,
): number {
    return smoothBand(lat, latMin, latMax, featherLat) * smoothBand(lng, lngMin, lngMax, featherLng);
}

/**
 * 南半球权重：北纬 >= +5° 为 0（北半球四季），南纬 <= -5° 为 1（南半球季节反转），赤道 [-5°, +5°] 平滑过渡
 */
export function southernHemisphereWeight(lat: number): number {
    return smoothstep(5, -5, lat);
}

/**
 * 根据纬度将北半球日历季节（0春 1夏 2秋 3冬）转换为当地季节（南半球反转 +2 季）
 */
export function localSeasonAtLat(calendarSeason: CalendarSeason4, lat: number): CalendarSeason4 {
    if (lat < -5) {
        return (((calendarSeason + 2) % 4) as CalendarSeason4);
    }
    return calendarSeason;
}

/**
 * 地中海型「夏干冬润」气候连续空间权重（0..1，边界 3.0°~4.0° 宽幅羽化，绝无网格硬切边）
 */
export function mediterraneanWeightAt(lat: number, lng: number, aridity = 0.4, sandiness = 0.1): number {
    const medBasin =
        smoothBox(lat, lng, 31.0, 43.5, -9.5, 36.5, 3.2, 3.8) *
        (1 - smoothBox(lat, lng, 28.0, 33.0, 24.0, 35.0, 2.2, 2.8) * 0.75);
    const california = smoothBox(lat, lng, 32.5, 40.5, -124.0, -117.5, 2.8, 2.8);
    const chile = smoothBox(lat, lng, -37.5, -31.5, -73.5, -70.0, 2.8, 2.0);
    const cape = smoothBox(lat, lng, -35.0, -32.0, 17.5, 21.5, 2.2, 2.2);
    const swAus = smoothBox(lat, lng, -35.5, -31.0, 114.5, 139.0, 2.8, 3.2);
    const geoW = Math.max(medBasin, california, chile, cape, swAus);
    if (geoW <= 0.001) return 0;
    const climateW = smoothBand(aridity, 0.12, 0.70, 0.22) * (1 - smoothstep(0.25, 0.65, sandiness));
    return clamp01(geoW * climateW);
}

/**
 * 热带季风 / 稀树草原「旱雨两季」连续空间权重（0..1，纬度与干湿度全程宽幅 smoothstep 羽化）
 */
export function tropicalSavannaWeightAt(lat: number, _lng: number, aridity: number, sandiness: number): number {
    const absLat = Math.abs(lat);
    const latW = smoothBand(absLat, 7.5, 23.5, 5.5);
    if (latW <= 0.001) return 0;
    const aridW = smoothBand(aridity, 0.0, 0.80, 0.25);
    const sandW = 1 - smoothstep(0.25, 0.70, sandiness);
    return clamp01(latW * aridW * sandW);
}

/**
 * 亚热带湿润常绿季风区连续空间权重（0..1）
 */
function subtropicalHumidWeightAt(lat: number, aridity: number, sandiness: number): number {
    const absLat = Math.abs(lat);
    const latW = smoothBand(absLat, 19.5, 30.5, 5.0);
    if (latW <= 0.001) return 0;
    const humidW = (1 - smoothstep(0.18, 0.56, aridity)) * (1 - smoothstep(0.16, 0.52, sandiness));
    return clamp01(latW * humidW);
}

/**
 * 判断某经纬度是否属于地中海型「夏干冬润」气候区（供战术地图单点主副草地判定）
 */
export function isMediterraneanClimateAt(lat: number, lng: number, _zone?: EnvZoneId): boolean {
    return mediterraneanWeightAt(lat, lng, 0.4, 0.1) >= 0.35;
}

/**
 * 判断某经纬度是否属于热带季风 / 稀树草原「旱雨两季」气候区（供战术地图单点主副草地判定）
 */
export function isTropicalMonsoonOrSavannaAt(
    lat: number,
    lng: number,
    aridity: number,
    sandiness: number,
    _zone?: EnvZoneId,
): boolean {
    return tropicalSavannaWeightAt(lat, lng, aridity, sandiness) >= 0.35;
}

const NEUTRAL_MOD: SeasonalGroundModulation = {
    rMul: 1,
    gMul: 1,
    bMul: 1,
    targetR: 128,
    targetG: 140,
    targetB: 90,
    targetMix: 0,
    dryBias: 0,
    localSeason: 1,
};

function lerpMod(a: SeasonalGroundModulation, b: SeasonalGroundModulation, t: number): SeasonalGroundModulation {
    const u = 1 - t;
    return {
        rMul: a.rMul * u + b.rMul * t,
        gMul: a.gMul * u + b.gMul * t,
        bMul: a.bMul * u + b.bMul * t,
        targetR: a.targetR * u + b.targetR * t,
        targetG: a.targetG * u + b.targetG * t,
        targetB: a.targetB * u + b.targetB * t,
        targetMix: a.targetMix * u + b.targetMix * t,
        dryBias: a.dryBias * u + b.dryBias * t,
        localSeason: t >= 0.5 ? b.localSeason : a.localSeason,
    };
}

function buildTemperateMod(localSeason: CalendarSeason4, w: number, aridity: number): SeasonalGroundModulation {
    if (localSeason === 0) {
        return {
            rMul: 1 - 0.032 * w,
            gMul: 1 + 0.048 * w,
            bMul: 1 - 0.048 * w,
            targetR: 108,
            targetG: 136,
            targetB: 78,
            targetMix: 0.15 * w,
            dryBias: -0.12 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        return {
            rMul: 1 - 0.060 * w,
            gMul: 1 + 0.040 * w,
            bMul: 1 - 0.028 * w,
            targetR: 86,
            targetG: 122,
            targetB: 68,
            targetMix: 0.17 * w,
            dryBias: -0.16 * w,
            localSeason,
        };
    }
    if (localSeason === 2) {
        const steppeBoost = 1.0 + 0.10 * smoothBand(aridity, 0.22, 0.66, 0.18);
        const aw = clamp01(w * steppeBoost);
        return {
            rMul: 1 + 0.088 * aw,
            gMul: 1 - 0.020 * aw,
            bMul: 1 - 0.130 * aw,
            targetR: 156,
            targetG: 132,
            targetB: 78,
            targetMix: 0.24 * aw,
            dryBias: 0.22 * aw,
            localSeason,
        };
    }
    return {
        rMul: 1 + 0.020 * w,
        gMul: 1 - 0.060 * w,
        bMul: 1 - 0.070 * w,
        targetR: 134,
        targetG: 122,
        targetB: 100,
        targetMix: 0.23 * w,
        dryBias: 0.20 * w,
        localSeason,
    };
}

function buildSubtropicalMod(localSeason: CalendarSeason4, w: number): SeasonalGroundModulation {
    if (localSeason === 0) {
        return {
            rMul: 1 - 0.028 * w,
            gMul: 1 + 0.042 * w,
            bMul: 1 - 0.042 * w,
            targetR: 106,
            targetG: 134,
            targetB: 78,
            targetMix: 0.12 * w,
            dryBias: -0.10 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        return {
            rMul: 1 - 0.052 * w,
            gMul: 1 + 0.035 * w,
            bMul: 1 - 0.024 * w,
            targetR: 86,
            targetG: 120,
            targetB: 68,
            targetMix: 0.14 * w,
            dryBias: -0.14 * w,
            localSeason,
        };
    }
    if (localSeason === 2) {
        return {
            rMul: 1 + 0.062 * w,
            gMul: 1 - 0.010 * w,
            bMul: 1 - 0.090 * w,
            targetR: 152,
            targetG: 134,
            targetB: 80,
            targetMix: 0.17 * w,
            dryBias: 0.12 * w,
            localSeason,
        };
    }
    return {
        rMul: 1 - 0.010 * w,
        gMul: 1 - 0.038 * w,
        bMul: 1 - 0.018 * w,
        targetR: 114,
        targetG: 118,
        targetB: 96,
        targetMix: 0.15 * w,
        dryBias: 0.08 * w,
        localSeason,
    };
}

function buildSavannaMod(localSeason: CalendarSeason4, w: number): SeasonalGroundModulation {
    if (localSeason === 0) {
        // 春季过渡：温润橄榄嫩绿，与毗邻亚热带/温带春季同色向自然衔接，彻底消除干湿交界处绿黄反向硬切
        return {
            rMul: 1 - 0.020 * w,
            gMul: 1 + 0.032 * w,
            bMul: 1 - 0.035 * w,
            targetR: 112,
            targetG: 134,
            targetB: 78,
            targetMix: 0.11 * w,
            dryBias: -0.06 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        // 雨季盛期（当地夏季）：季风雨水充沛，草原返青苍翠
        return {
            rMul: 1 - 0.068 * w,
            gMul: 1 + 0.052 * w,
            bMul: 1 - 0.032 * w,
            targetR: 88,
            targetG: 124,
            targetB: 68,
            targetMix: 0.18 * w,
            dryBias: -0.16 * w,
            localSeason,
        };
    }
    if (localSeason === 2) {
        // 雨季退却（当地秋季）：由绿转暖金橄榄，与亚热带/温带秋季同向自然衔接
        return {
            rMul: 1 + 0.058 * w,
            gMul: 1 - 0.012 * w,
            bMul: 1 - 0.088 * w,
            targetR: 150,
            targetG: 132,
            targetB: 80,
            targetMix: 0.18 * w,
            dryBias: 0.14 * w,
            localSeason,
        };
    }
    // 旱季（当地冬季）：草木干涸暖褐，与温带冬枯同向过渡
    return {
        rMul: 1 + 0.032 * w,
        gMul: 1 - 0.045 * w,
        bMul: 1 - 0.065 * w,
        targetR: 138,
        targetG: 124,
        targetB: 94,
        targetMix: 0.19 * w,
        dryBias: 0.16 * w,
        localSeason,
    };
}

function buildMediterraneanMod(localSeason: CalendarSeason4, w: number): SeasonalGroundModulation {
    if (localSeason === 3) {
        return {
            rMul: 1 - 0.068 * w,
            gMul: 1 + 0.055 * w,
            bMul: 1 - 0.032 * w,
            targetR: 96,
            targetG: 128,
            targetB: 74,
            targetMix: 0.20 * w,
            dryBias: -0.16 * w,
            localSeason,
        };
    }
    if (localSeason === 0) {
        return {
            rMul: 1 - 0.050 * w,
            gMul: 1 + 0.052 * w,
            bMul: 1 - 0.042 * w,
            targetR: 104,
            targetG: 134,
            targetB: 76,
            targetMix: 0.17 * w,
            dryBias: -0.14 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        return {
            rMul: 1 + 0.068 * w,
            gMul: 1 - 0.022 * w,
            bMul: 1 - 0.098 * w,
            targetR: 160,
            targetG: 138,
            targetB: 86,
            targetMix: 0.20 * w,
            dryBias: 0.18 * w,
            localSeason,
        };
    }
    return {
        rMul: 1 + 0.025 * w,
        gMul: 1 + 0.005 * w,
        bMul: 1 - 0.045 * w,
        targetR: 140,
        targetG: 130,
        targetB: 84,
        targetMix: 0.14 * w,
        dryBias: 0.08 * w,
        localSeason,
    };
}

/**
 * 计算指定当地季节（0春 1夏 2秋 3冬）在该经纬度与气候参数下的地表色彩与干湿调制
 * 全程采用连续宽幅 smoothstep 空间权重与干湿度插值，不使用任何离散网格或陡峭阈值。
 */
function computeLocalSeasonModulation(
    localSeason: CalendarSeason4,
    lat: number,
    lng: number,
    aridity: number,
    sandiness: number,
    _zone?: EnvZoneId,
): SeasonalGroundModulation {
    // 1. 从湿润草林 → 半干旱草原 → 极旱真荒漠（撒哈拉、塔克拉玛干、塔尔、阿拉伯、河套戈壁等）全程宽幅连续平滑衰减，
    //    仅在真荒漠（高沙度 pal/qs/pal1/ds5）压制季节色彩，使黄土高原（ds2）与巴蜀/恒河红壤（ds4）保留自然四季变化
    const desertMute = clamp01(
        smoothstep(0.36, 0.88, sandiness) * 0.68 +
        smoothstep(0.62, 0.96, aridity) * 0.42,
    );
    // 2. 赤道核心常绿雨林（|lat| < 9° 且极湿润）连续平滑衰减至四季常青
    const absLat = Math.abs(lat);
    const eqEvergreen = (1 - smoothstep(4.5, 9.5, absLat)) * (1 - smoothstep(0.14, 0.32, aridity));
    const vegWeight = clamp01((1 - desertMute) * (1 - eqEvergreen));
    if (vegWeight < 0.005) {
        return { ...NEUTRAL_MOD, localSeason };
    }

    const tempLatW = vegWeight * (0.48 + 0.52 * smoothstep(14, 28, absLat));
    let mod = buildTemperateMod(localSeason, tempLatW, aridity);

    const subtropW = subtropicalHumidWeightAt(lat, aridity, sandiness);
    if (subtropW > 0.001) {
        mod = lerpMod(mod, buildSubtropicalMod(localSeason, vegWeight), subtropW);
    }

    const savW = tropicalSavannaWeightAt(lat, lng, aridity, sandiness);
    if (savW > 0.001) {
        mod = lerpMod(mod, buildSavannaMod(localSeason, vegWeight), savW);
    }

    const medW = mediterraneanWeightAt(lat, lng, aridity, sandiness);
    if (medW > 0.001) {
        mod = lerpMod(mod, buildMediterraneanMod(localSeason, vegWeight), medW);
    }

    return mod;
}

/**
 * 计算北半球日历季节 `calendarSeason` (0春 1夏 2秋 3冬) 下某经纬度像元的四季地表调制参数
 * （自动处理南半球季节反转与赤道平滑过渡）
 */
export function computeSeasonalGroundModulation(
    calendarSeason: CalendarSeason4,
    lat: number,
    lng: number,
    aridity: number,
    sandiness: number,
    zone?: EnvZoneId,
): SeasonalGroundModulation {
    const shW = southernHemisphereWeight(lat);
    if (shW <= 0.001) {
        return computeLocalSeasonModulation(calendarSeason, lat, lng, aridity, sandiness, zone);
    }
    const shSeason = (((calendarSeason + 2) % 4) as CalendarSeason4);
    if (shW >= 0.999) {
        return computeLocalSeasonModulation(shSeason, lat, lng, aridity, sandiness, zone);
    }
    const nhMod = computeLocalSeasonModulation(calendarSeason, lat, lng, aridity, sandiness, zone);
    const shMod = computeLocalSeasonModulation(shSeason, lat, lng, aridity, sandiness, zone);
    return lerpMod(nhMod, shMod, shW);
}

/**
 * 将四季地表色彩调制应用到像元基础反照率 RGB（在山体阴影 shadeFactor 之前调用）
 * 只对非裸岩、非纯沙漠的地表植被/草地/土壤层生效，保留阴影与水体对比度。
 */
export function applySeasonalGroundToPixel(
    r: number,
    g: number,
    b: number,
    mod: SeasonalGroundModulation,
    rockWeight = 0,
): [number, number, number] {
    const landW = clamp01(1 - rockWeight * 0.85);
    if (landW <= 0.001) return [r, g, b];

    // 识别像元中的植被/草地绿色度或草原土黄度，避免把纯灰黑岩石染黄
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const greenDominance = clamp01((g - r * 0.72) / 48);
    const organicWeight = clamp01(0.45 + 0.55 * Math.max(greenDominance, clamp01(chroma / 55))) * landW;

    const rMul = 1 + (mod.rMul - 1) * organicWeight;
    const gMul = 1 + (mod.gMul - 1) * organicWeight;
    const bMul = 1 + (mod.bMul - 1) * organicWeight;

    let nr = r * rMul;
    let ng = g * gMul;
    let nb = b * bMul;

    const mixW = mod.targetMix * organicWeight;
    if (mixW > 0.001) {
        // 保持原本纹理的明暗细节（luma ratio），只朝季节目标色相偏移（去掉旧版 * 1.15 的过曝提亮）
        const targetLuma = Math.max(1, 0.299 * mod.targetR + 0.587 * mod.targetG + 0.114 * mod.targetB);
        const detailScale = clamp01(luma / targetLuma * 0.72 + 0.28 * (luma / 128)) * 1.02;
        const tr = mod.targetR * detailScale;
        const tg = mod.targetG * detailScale;
        const tb = mod.targetB * detailScale;
        nr = nr * (1 - mixW) + tr * mixW;
        ng = ng * (1 - mixW) + tg * mixW;
        nb = nb * (1 - mixW) + tb * mixW;
    }

    return [
        nr < 0 ? 0 : nr > 255 ? 255 : nr,
        ng < 0 ? 0 : ng > 255 ? 255 : ng,
        nb < 0 ? 0 : nb > 255 ? 255 : nb,
    ];
}

/**
 * 战略地图瓦片（HillshadeWorker）按行预计算的纬度气候权重上下文，
 * 避免同一行 256 个像素 × 4 个季节重复计算仅依赖 rowLat 的 smoothstep。
 */
export interface SeasonalRowContext {
    lat: number;
    absLat: number;
    shW: number;
    eqLatW: number;
    tempLatFactor: number;
    subtropLatW: number;
    savLatW: number;
    medBasinLatA: number;
    medBasinLatB: number;
    californiaLat: number;
    chileLat: number;
    capeLat: number;
    swAusLat: number;
    hasMedLat: boolean;
}

export function createSeasonalRowContext(): SeasonalRowContext {
    return {
        lat: 0,
        absLat: 0,
        shW: 0,
        eqLatW: 0,
        tempLatFactor: 0,
        subtropLatW: 0,
        savLatW: 0,
        medBasinLatA: 0,
        medBasinLatB: 0,
        californiaLat: 0,
        chileLat: 0,
        capeLat: 0,
        swAusLat: 0,
        hasMedLat: false,
    };
}

export function updateSeasonalRowContext(rowLat: number, ctx: SeasonalRowContext): void {
    const absLat = Math.abs(rowLat);
    ctx.lat = rowLat;
    ctx.absLat = absLat;
    ctx.shW = smoothstep(5, -5, rowLat);
    ctx.eqLatW = 1 - smoothstep(4.5, 9.5, absLat);
    ctx.tempLatFactor = 0.48 + 0.52 * smoothstep(14, 28, absLat);
    ctx.subtropLatW = smoothBand(absLat, 19.5, 30.5, 5.0);
    ctx.savLatW = smoothBand(absLat, 7.5, 23.5, 5.5);

    const medBasinLatA = smoothBand(rowLat, 31.0, 43.5, 3.2);
    const medBasinLatB = smoothBand(rowLat, 28.0, 33.0, 2.2);
    const californiaLat = smoothBand(rowLat, 32.5, 40.5, 2.8);
    const chileLat = smoothBand(rowLat, -37.5, -31.5, 2.8);
    const capeLat = smoothBand(rowLat, -35.0, -32.0, 2.2);
    const swAusLat = smoothBand(rowLat, -35.5, -31.0, 2.8);

    ctx.medBasinLatA = medBasinLatA;
    ctx.medBasinLatB = medBasinLatB;
    ctx.californiaLat = californiaLat;
    ctx.chileLat = chileLat;
    ctx.capeLat = capeLat;
    ctx.swAusLat = swAusLat;
    ctx.hasMedLat = (medBasinLatA + californiaLat + chileLat + capeLat + swAusLat) > 0;
}

// 4 个当地季节 × 7 个调制参数 [rMul, gMul, bMul, targetR, targetG, targetB, targetMix] 的零分配暂存区
const LOCAL_SEASON_MODS_SCRATCH = new Float64Array(28);

function writeLocalSeasonMod(
    localSeason: CalendarSeason4,
    tempLatW: number,
    tempAw2: number,
    vegWeight: number,
    subtropW: number,
    savW: number,
    medW: number,
    out: Float64Array,
    base: number,
): void {
    let rMul: number, gMul: number, bMul: number;
    let targetR: number, targetG: number, targetB: number, targetMix: number;

    // 1. Temperate base
    if (localSeason === 0) {
        rMul = 1 - 0.032 * tempLatW;
        gMul = 1 + 0.048 * tempLatW;
        bMul = 1 - 0.048 * tempLatW;
        targetR = 108; targetG = 136; targetB = 78;
        targetMix = 0.15 * tempLatW;
    } else if (localSeason === 1) {
        rMul = 1 - 0.060 * tempLatW;
        gMul = 1 + 0.040 * tempLatW;
        bMul = 1 - 0.028 * tempLatW;
        targetR = 86; targetG = 122; targetB = 68;
        targetMix = 0.17 * tempLatW;
    } else if (localSeason === 2) {
        rMul = 1 + 0.088 * tempAw2;
        gMul = 1 - 0.020 * tempAw2;
        bMul = 1 - 0.130 * tempAw2;
        targetR = 156; targetG = 132; targetB = 78;
        targetMix = 0.24 * tempAw2;
    } else {
        rMul = 1 + 0.020 * tempLatW;
        gMul = 1 - 0.060 * tempLatW;
        bMul = 1 - 0.070 * tempLatW;
        targetR = 134; targetG = 122; targetB = 100;
        targetMix = 0.23 * tempLatW;
    }

    // 2. Subtropical humid lerp
    if (subtropW > 0.001) {
        const u = 1 - subtropW;
        let brMul: number, bgMul: number, bbMul: number, bTR: number, bTG: number, bTB: number, bTM: number;
        if (localSeason === 0) {
            brMul = 1 - 0.028 * vegWeight; bgMul = 1 + 0.042 * vegWeight; bbMul = 1 - 0.042 * vegWeight;
            bTR = 106; bTG = 134; bTB = 78; bTM = 0.12 * vegWeight;
        } else if (localSeason === 1) {
            brMul = 1 - 0.052 * vegWeight; bgMul = 1 + 0.035 * vegWeight; bbMul = 1 - 0.024 * vegWeight;
            bTR = 86; bTG = 120; bTB = 68; bTM = 0.14 * vegWeight;
        } else if (localSeason === 2) {
            brMul = 1 + 0.062 * vegWeight; bgMul = 1 - 0.010 * vegWeight; bbMul = 1 - 0.090 * vegWeight;
            bTR = 152; bTG = 134; bTB = 80; bTM = 0.17 * vegWeight;
        } else {
            brMul = 1 - 0.010 * vegWeight; bgMul = 1 - 0.038 * vegWeight; bbMul = 1 - 0.018 * vegWeight;
            bTR = 114; bTG = 118; bTB = 96; bTM = 0.15 * vegWeight;
        }
        rMul = rMul * u + brMul * subtropW;
        gMul = gMul * u + bgMul * subtropW;
        bMul = bMul * u + bbMul * subtropW;
        targetR = targetR * u + bTR * subtropW;
        targetG = targetG * u + bTG * subtropW;
        targetB = targetB * u + bTB * subtropW;
        targetMix = targetMix * u + bTM * subtropW;
    }

    // 3. Tropical savanna lerp
    if (savW > 0.001) {
        const u = 1 - savW;
        let brMul: number, bgMul: number, bbMul: number, bTR: number, bTG: number, bTB: number, bTM: number;
        if (localSeason === 0) {
            brMul = 1 - 0.020 * vegWeight; bgMul = 1 + 0.032 * vegWeight; bbMul = 1 - 0.035 * vegWeight;
            bTR = 112; bTG = 134; bTB = 78; bTM = 0.11 * vegWeight;
        } else if (localSeason === 1) {
            brMul = 1 - 0.068 * vegWeight; bgMul = 1 + 0.052 * vegWeight; bbMul = 1 - 0.032 * vegWeight;
            bTR = 88; bTG = 124; bTB = 68; bTM = 0.18 * vegWeight;
        } else if (localSeason === 2) {
            brMul = 1 + 0.058 * vegWeight; bgMul = 1 - 0.012 * vegWeight; bbMul = 1 - 0.088 * vegWeight;
            bTR = 150; bTG = 132; bTB = 80; bTM = 0.18 * vegWeight;
        } else {
            brMul = 1 + 0.032 * vegWeight; bgMul = 1 - 0.045 * vegWeight; bbMul = 1 - 0.065 * vegWeight;
            bTR = 138; bTG = 124; bTB = 94; bTM = 0.19 * vegWeight;
        }
        rMul = rMul * u + brMul * savW;
        gMul = gMul * u + bgMul * savW;
        bMul = bMul * u + bbMul * savW;
        targetR = targetR * u + bTR * savW;
        targetG = targetG * u + bTG * savW;
        targetB = targetB * u + bTB * savW;
        targetMix = targetMix * u + bTM * savW;
    }

    // 4. Mediterranean lerp
    if (medW > 0.001) {
        const u = 1 - medW;
        let brMul: number, bgMul: number, bbMul: number, bTR: number, bTG: number, bTB: number, bTM: number;
        if (localSeason === 3) {
            brMul = 1 - 0.068 * vegWeight; bgMul = 1 + 0.055 * vegWeight; bbMul = 1 - 0.032 * vegWeight;
            bTR = 96; bTG = 128; bTB = 74; bTM = 0.20 * vegWeight;
        } else if (localSeason === 0) {
            brMul = 1 - 0.050 * vegWeight; bgMul = 1 + 0.052 * vegWeight; bbMul = 1 - 0.042 * vegWeight;
            bTR = 104; bTG = 134; bTB = 76; bTM = 0.17 * vegWeight;
        } else if (localSeason === 1) {
            brMul = 1 + 0.068 * vegWeight; bgMul = 1 - 0.022 * vegWeight; bbMul = 1 - 0.098 * vegWeight;
            bTR = 160; bTG = 138; bTB = 86; bTM = 0.20 * vegWeight;
        } else {
            brMul = 1 + 0.025 * vegWeight; bgMul = 1 + 0.005 * vegWeight; bbMul = 1 - 0.045 * vegWeight;
            bTR = 140; bTG = 130; bTB = 84; bTM = 0.14 * vegWeight;
        }
        rMul = rMul * u + brMul * medW;
        gMul = gMul * u + bgMul * medW;
        bMul = bMul * u + bbMul * medW;
        targetR = targetR * u + bTR * medW;
        targetG = targetG * u + bTG * medW;
        targetB = targetB * u + bTB * medW;
        targetMix = targetMix * u + bTM * medW;
    }

    out[base] = rMul;
    out[base + 1] = gMul;
    out[base + 2] = bMul;
    out[base + 3] = targetR;
    out[base + 4] = targetG;
    out[base + 5] = targetB;
    out[base + 6] = targetMix;
}

/**
 * 零堆分配批量计算单像素的春(0)·夏(1)·秋(2)·冬(3)四季地表反照率 RGB，
 * 写入长度为 12 的 Float64Array `[spR,spG,spB, suR,suG,suB, auR,auG,auB, wiR,wiG,wiB]`。
 * 数学结果与逐季调用 `applySeasonalGroundToPixel(..., computeSeasonalGroundModulation(s, ...))` 100% 逐位一致。
 */
export function applyFourSeasonsToPixelFast(
    r: number,
    g: number,
    b: number,
    rowCtx: SeasonalRowContext,
    lng: number,
    aridity: number,
    sandiness: number,
    rockWeight: number,
    outRGB12: Float64Array,
): void {
    const landW = clamp01(1 - rockWeight * 0.85);
    if (landW <= 0.001) {
        outRGB12[0] = r; outRGB12[1] = g; outRGB12[2] = b;
        outRGB12[3] = r; outRGB12[4] = g; outRGB12[5] = b;
        outRGB12[6] = r; outRGB12[7] = g; outRGB12[8] = b;
        outRGB12[9] = r; outRGB12[10] = g; outRGB12[11] = b;
        return;
    }

    const desertMute = clamp01(
        smoothstep(0.36, 0.88, sandiness) * 0.68 +
        smoothstep(0.62, 0.96, aridity) * 0.42,
    );
    const eqEvergreen = rowCtx.eqLatW * (1 - smoothstep(0.14, 0.32, aridity));
    const vegWeight = clamp01((1 - desertMute) * (1 - eqEvergreen));
    if (vegWeight < 0.005) {
        const cr = r < 0 ? 0 : r > 255 ? 255 : r;
        const cg = g < 0 ? 0 : g > 255 ? 255 : g;
        const cb = b < 0 ? 0 : b > 255 ? 255 : b;
        outRGB12[0] = cr; outRGB12[1] = cg; outRGB12[2] = cb;
        outRGB12[3] = cr; outRGB12[4] = cg; outRGB12[5] = cb;
        outRGB12[6] = cr; outRGB12[7] = cg; outRGB12[8] = cb;
        outRGB12[9] = cr; outRGB12[10] = cg; outRGB12[11] = cb;
        return;
    }

    // 1. 像素级气候空间权重（只算 1 次，复用于全部 4 个季节）
    const tempLatW = vegWeight * rowCtx.tempLatFactor;
    const steppeBoost = 1.0 + 0.10 * smoothBand(aridity, 0.22, 0.66, 0.18);
    const tempAw2 = clamp01(tempLatW * steppeBoost);

    const subtropW = rowCtx.subtropLatW <= 0.001
        ? 0
        : clamp01(rowCtx.subtropLatW * ((1 - smoothstep(0.18, 0.56, aridity)) * (1 - smoothstep(0.16, 0.52, sandiness))));

    const savW = rowCtx.savLatW <= 0.001
        ? 0
        : clamp01(rowCtx.savLatW * smoothBand(aridity, 0.0, 0.80, 0.25) * (1 - smoothstep(0.25, 0.70, sandiness)));

    let medW = 0;
    if (rowCtx.hasMedLat) {
        const medBasin =
            (rowCtx.medBasinLatA * smoothBand(lng, -9.5, 36.5, 3.8)) *
            (1 - (rowCtx.medBasinLatB * smoothBand(lng, 24.0, 35.0, 2.8)) * 0.75);
        const california = rowCtx.californiaLat * smoothBand(lng, -124.0, -117.5, 2.8);
        const chile = rowCtx.chileLat * smoothBand(lng, -73.5, -70.0, 2.0);
        const cape = rowCtx.capeLat * smoothBand(lng, 17.5, 21.5, 2.2);
        const swAus = rowCtx.swAusLat * smoothBand(lng, 114.5, 139.0, 3.2);
        const geoW = Math.max(medBasin, california, chile, cape, swAus);
        if (geoW > 0.001) {
            const climateW = smoothBand(aridity, 0.12, 0.70, 0.22) * (1 - smoothstep(0.25, 0.65, sandiness));
            medW = clamp01(geoW * climateW);
        }
    }

    // 2. 一次性写出 4 个当地季节调制参数
    writeLocalSeasonMod(0, tempLatW, tempAw2, vegWeight, subtropW, savW, medW, LOCAL_SEASON_MODS_SCRATCH, 0);
    writeLocalSeasonMod(1, tempLatW, tempAw2, vegWeight, subtropW, savW, medW, LOCAL_SEASON_MODS_SCRATCH, 7);
    writeLocalSeasonMod(2, tempLatW, tempAw2, vegWeight, subtropW, savW, medW, LOCAL_SEASON_MODS_SCRATCH, 14);
    writeLocalSeasonMod(3, tempLatW, tempAw2, vegWeight, subtropW, savW, medW, LOCAL_SEASON_MODS_SCRATCH, 21);

    // 3. 像素级有机植被响应权重（只算 1 次）
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const greenDominance = clamp01((g - r * 0.72) / 48);
    const organicWeight = clamp01(0.45 + 0.55 * Math.max(greenDominance, clamp01(chroma / 55))) * landW;
    const shW = rowCtx.shW;

    // 4. 合成北半球日历四季 s = 0..3
    for (let s = 0; s < 4; s++) {
        let mRMul: number, mGMul: number, mBMul: number;
        let mTR: number, mTG: number, mTB: number, mTM: number;

        if (shW <= 0.001) {
            const b0 = s * 7;
            mRMul = LOCAL_SEASON_MODS_SCRATCH[b0];
            mGMul = LOCAL_SEASON_MODS_SCRATCH[b0 + 1];
            mBMul = LOCAL_SEASON_MODS_SCRATCH[b0 + 2];
            mTR = LOCAL_SEASON_MODS_SCRATCH[b0 + 3];
            mTG = LOCAL_SEASON_MODS_SCRATCH[b0 + 4];
            mTB = LOCAL_SEASON_MODS_SCRATCH[b0 + 5];
            mTM = LOCAL_SEASON_MODS_SCRATCH[b0 + 6];
        } else if (shW >= 0.999) {
            const b1 = ((s + 2) & 3) * 7;
            mRMul = LOCAL_SEASON_MODS_SCRATCH[b1];
            mGMul = LOCAL_SEASON_MODS_SCRATCH[b1 + 1];
            mBMul = LOCAL_SEASON_MODS_SCRATCH[b1 + 2];
            mTR = LOCAL_SEASON_MODS_SCRATCH[b1 + 3];
            mTG = LOCAL_SEASON_MODS_SCRATCH[b1 + 4];
            mTB = LOCAL_SEASON_MODS_SCRATCH[b1 + 5];
            mTM = LOCAL_SEASON_MODS_SCRATCH[b1 + 6];
        } else {
            const b0 = s * 7;
            const b1 = ((s + 2) & 3) * 7;
            const u = 1 - shW;
            mRMul = LOCAL_SEASON_MODS_SCRATCH[b0] * u + LOCAL_SEASON_MODS_SCRATCH[b1] * shW;
            mGMul = LOCAL_SEASON_MODS_SCRATCH[b0 + 1] * u + LOCAL_SEASON_MODS_SCRATCH[b1 + 1] * shW;
            mBMul = LOCAL_SEASON_MODS_SCRATCH[b0 + 2] * u + LOCAL_SEASON_MODS_SCRATCH[b1 + 2] * shW;
            mTR = LOCAL_SEASON_MODS_SCRATCH[b0 + 3] * u + LOCAL_SEASON_MODS_SCRATCH[b1 + 3] * shW;
            mTG = LOCAL_SEASON_MODS_SCRATCH[b0 + 4] * u + LOCAL_SEASON_MODS_SCRATCH[b1 + 4] * shW;
            mTB = LOCAL_SEASON_MODS_SCRATCH[b0 + 5] * u + LOCAL_SEASON_MODS_SCRATCH[b1 + 5] * shW;
            mTM = LOCAL_SEASON_MODS_SCRATCH[b0 + 6] * u + LOCAL_SEASON_MODS_SCRATCH[b1 + 6] * shW;
        }

        const rMul = 1 + (mRMul - 1) * organicWeight;
        const gMul = 1 + (mGMul - 1) * organicWeight;
        const bMul = 1 + (mBMul - 1) * organicWeight;

        let nr = r * rMul;
        let ng = g * gMul;
        let nb = b * bMul;

        const mixW = mTM * organicWeight;
        if (mixW > 0.001) {
            const targetLuma = Math.max(1, 0.299 * mTR + 0.587 * mTG + 0.114 * mTB);
            const detailScale = clamp01(luma / targetLuma * 0.72 + 0.28 * (luma / 128)) * 1.02;
            const tr = mTR * detailScale;
            const tg = mTG * detailScale;
            const tb = mTB * detailScale;
            const oneMinusMix = 1 - mixW;
            nr = nr * oneMinusMix + tr * mixW;
            ng = ng * oneMinusMix + tg * mixW;
            nb = nb * oneMinusMix + tb * mixW;
        }

        const outIdx = s * 3;
        outRGB12[outIdx] = nr < 0 ? 0 : nr > 255 ? 255 : nr;
        outRGB12[outIdx + 1] = ng < 0 ? 0 : ng > 255 ? 255 : ng;
        outRGB12[outIdx + 2] = nb < 0 ? 0 : nb > 255 ? 255 : nb;
    }
}

/**
 * 战术地面 WebGL 着色器（Scene13GroundLayerGL）实时四季同步 Uniform 参数
 */
export interface TacticalSeasonalGroundUniforms {
    /** 草地与干草纹理的季节 RGB 乘子 */
    tint: [number, number, number];
    /** 季节目标色（归一化 0..1 RGB + 混合强度 A） */
    gold: [number, number, number, number];
    /** 干草混合偏移（-0.35..+0.40） */
    dryBias: number;
}

/**
 * 计算战术地图在 `(lat, lng)`、当前日历季节与季节过渡进度 `seasonBlend` (0..1) 下的 WebGL 地面四季参数
 */
export function resolveTacticalSeasonalGroundUniforms(
    lat: number,
    lng: number,
    calendarSeason: CalendarSeason4,
    nextCalendarSeason: CalendarSeason4,
    seasonBlend: number,
    isSnowGround: boolean,
): TacticalSeasonalGroundUniforms {
    if (isSnowGround) {
        return {
            tint: [1, 1, 1],
            gold: [1, 1, 1, 0],
            dryBias: 0,
        };
    }
    const [aridity, sandiness] = queryAridSand(lat, lng);
    const zone = resolveEnvZoneId(lat, lng);
    const modA = computeSeasonalGroundModulation(calendarSeason, lat, lng, aridity, sandiness, zone);
    const modB =
        seasonBlend > 0.001
            ? computeSeasonalGroundModulation(nextCalendarSeason, lat, lng, aridity, sandiness, zone)
            : modA;
    const mod = seasonBlend > 0.001 ? lerpMod(modA, modB, clamp01(seasonBlend)) : modA;

    // 若当地处于冬季薄雪区（winterFlag === 4），微增清冷霜白感
    const wFlag = queryWinterSnow(lat, lng);
    const isLocalWinter = mod.localSeason === 3;
    const frostBoost = isLocalWinter && wFlag === 4 ? 0.12 : 0;

    return {
        tint: [mod.rMul, mod.gMul, mod.bMul],
        gold: [
            clamp01(mod.targetR / 255 + frostBoost),
            clamp01(mod.targetG / 255 + frostBoost),
            clamp01(mod.targetB / 255 + frostBoost * 1.15),
            clamp01(mod.targetMix + frostBoost * 0.5),
        ],
        dryBias: mod.dryBias,
    };
}
