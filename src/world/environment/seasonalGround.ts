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
 * 地中海型「夏干冬润」气候连续空间权重（0..1，边界 2.5°~3.5° 宽幅羽化，绝无网格硬切边）
 */
export function mediterraneanWeightAt(lat: number, lng: number, aridity = 0.4, sandiness = 0.1): number {
    const medBasin =
        smoothBox(lat, lng, 31.0, 43.5, -9.5, 36.5, 3.0, 3.5) *
        (1 - smoothBox(lat, lng, 28.0, 33.0, 24.0, 35.0, 2.0, 2.5) * 0.75);
    const california = smoothBox(lat, lng, 32.5, 40.5, -124.0, -117.5, 2.5, 2.5);
    const chile = smoothBox(lat, lng, -37.5, -31.5, -73.5, -70.0, 2.5, 1.8);
    const cape = smoothBox(lat, lng, -35.0, -32.0, 17.5, 21.5, 2.0, 2.0);
    const swAus = smoothBox(lat, lng, -35.5, -31.0, 114.5, 139.0, 2.5, 3.0);
    const geoW = Math.max(medBasin, california, chile, cape, swAus);
    if (geoW <= 0.001) return 0;
    const climateW = smoothBand(aridity, 0.14, 0.68, 0.14) * (1 - smoothstep(0.32, 0.52, sandiness));
    return clamp01(geoW * climateW);
}

/**
 * 热带季风 / 稀树草原「旱雨两季」连续空间权重（0..1，纬度与干湿度全程宽幅 smoothstep 羽化）
 */
export function tropicalSavannaWeightAt(lat: number, _lng: number, aridity: number, sandiness: number): number {
    const absLat = Math.abs(lat);
    // 纬度在 7.5°..22.5° 为核心，两侧各以 4.5°（约 500km）平滑羽化至 0，彻底消除 27.5°N 水平断层与柯本网格锯齿
    const latW = smoothBand(absLat, 7.5, 22.5, 4.5);
    if (latW <= 0.001) return 0;
    // 半湿润至半干旱（0.22..0.62）为季风草原核心，向极湿雨林和极旱沙漠两侧各以 0.15 宽度平滑衰减
    const aridW = smoothBand(aridity, 0.22, 0.62, 0.15);
    const sandW = 1 - smoothstep(0.26, 0.46, sandiness);
    return clamp01(latW * aridW * sandW);
}

/**
 * 亚热带湿润常绿季风区连续空间权重（0..1）
 */
function subtropicalHumidWeightAt(lat: number, aridity: number, sandiness: number): number {
    const absLat = Math.abs(lat);
    const latW = smoothBand(absLat, 20.0, 30.5, 4.0);
    if (latW <= 0.001) return 0;
    const humidW = (1 - smoothstep(0.24, 0.42, aridity)) * (1 - smoothstep(0.22, 0.40, sandiness));
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
            rMul: 1 - 0.035 * w,
            gMul: 1 + 0.052 * w,
            bMul: 1 - 0.055 * w,
            targetR: 106,
            targetG: 136,
            targetB: 76,
            targetMix: 0.16 * w,
            dryBias: -0.12 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        return {
            rMul: 1 - 0.065 * w,
            gMul: 1 + 0.042 * w,
            bMul: 1 - 0.030 * w,
            targetR: 84,
            targetG: 122,
            targetB: 68,
            targetMix: 0.18 * w,
            dryBias: -0.16 * w,
            localSeason,
        };
    }
    if (localSeason === 2) {
        const steppeBoost = 1.0 + 0.12 * smoothBand(aridity, 0.24, 0.64, 0.10);
        const aw = clamp01(w * steppeBoost);
        return {
            rMul: 1 + 0.095 * aw,
            gMul: 1 - 0.022 * aw,
            bMul: 1 - 0.14 * aw,
            targetR: 156,
            targetG: 132,
            targetB: 78,
            targetMix: 0.25 * aw,
            dryBias: 0.22 * aw,
            localSeason,
        };
    }
    return {
        rMul: 1 + 0.020 * w,
        gMul: 1 - 0.065 * w,
        bMul: 1 - 0.075 * w,
        targetR: 134,
        targetG: 122,
        targetB: 100,
        targetMix: 0.25 * w,
        dryBias: 0.20 * w,
        localSeason,
    };
}

function buildSubtropicalMod(localSeason: CalendarSeason4, w: number): SeasonalGroundModulation {
    if (localSeason === 0) {
        return {
            rMul: 1 - 0.030 * w,
            gMul: 1 + 0.045 * w,
            bMul: 1 - 0.045 * w,
            targetR: 104,
            targetG: 134,
            targetB: 76,
            targetMix: 0.12 * w,
            dryBias: -0.10 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        return {
            rMul: 1 - 0.055 * w,
            gMul: 1 + 0.035 * w,
            bMul: 1 - 0.025 * w,
            targetR: 84,
            targetG: 120,
            targetB: 68,
            targetMix: 0.14 * w,
            dryBias: -0.14 * w,
            localSeason,
        };
    }
    if (localSeason === 2) {
        return {
            rMul: 1 + 0.065 * w,
            gMul: 1 - 0.010 * w,
            bMul: 1 - 0.095 * w,
            targetR: 152,
            targetG: 134,
            targetB: 80,
            targetMix: 0.17 * w,
            dryBias: 0.12 * w,
            localSeason,
        };
    }
    return {
        rMul: 1 - 0.015 * w,
        gMul: 1 - 0.040 * w,
        bMul: 1 - 0.015 * w,
        targetR: 110,
        targetG: 116,
        targetB: 96,
        targetMix: 0.15 * w,
        dryBias: 0.08 * w,
        localSeason,
    };
}

function buildSavannaMod(localSeason: CalendarSeason4, w: number): SeasonalGroundModulation {
    if (localSeason === 1) {
        // 雨季盛期（当地夏季）：季风雨水充沛，草原返青苍翠
        return {
            rMul: 1 - 0.085 * w,
            gMul: 1 + 0.065 * w,
            bMul: 1 - 0.040 * w,
            targetR: 88,
            targetG: 124,
            targetB: 68,
            targetMix: 0.20 * w,
            dryBias: -0.18 * w,
            localSeason,
        };
    }
    if (localSeason === 2) {
        // 雨季退却（当地秋季）：由绿转暖金橄榄，与亚热带/温带秋季同向自然衔接，杜绝南北反向撞色
        return {
            rMul: 1 + 0.055 * w,
            gMul: 1 - 0.010 * w,
            bMul: 1 - 0.085 * w,
            targetR: 148,
            targetG: 132,
            targetB: 80,
            targetMix: 0.18 * w,
            dryBias: 0.12 * w,
            localSeason,
        };
    }
    // 旱季（当地冬、春）：草木干涸暖褐
    const dryStrength = localSeason === 0 ? 1.0 : 0.85;
    const sw = w * dryStrength;
    return {
        rMul: 1 + 0.075 * sw,
        gMul: 1 - 0.030 * sw,
        bMul: 1 - 0.110 * sw,
        targetR: 158,
        targetG: 132,
        targetB: 84,
        targetMix: 0.21 * sw,
        dryBias: 0.18 * sw,
        localSeason,
    };
}

function buildMediterraneanMod(localSeason: CalendarSeason4, w: number): SeasonalGroundModulation {
    if (localSeason === 3) {
        return {
            rMul: 1 - 0.080 * w,
            gMul: 1 + 0.065 * w,
            bMul: 1 - 0.035 * w,
            targetR: 94,
            targetG: 128,
            targetB: 72,
            targetMix: 0.22 * w,
            dryBias: -0.18 * w,
            localSeason,
        };
    }
    if (localSeason === 0) {
        return {
            rMul: 1 - 0.060 * w,
            gMul: 1 + 0.060 * w,
            bMul: 1 - 0.045 * w,
            targetR: 104,
            targetG: 134,
            targetB: 74,
            targetMix: 0.18 * w,
            dryBias: -0.15 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        return {
            rMul: 1 + 0.075 * w,
            gMul: 1 - 0.025 * w,
            bMul: 1 - 0.110 * w,
            targetR: 164,
            targetG: 140,
            targetB: 88,
            targetMix: 0.22 * w,
            dryBias: 0.20 * w,
            localSeason,
        };
    }
    return {
        rMul: 1 + 0.020 * w,
        gMul: 1 + 0.010 * w,
        bMul: 1 - 0.040 * w,
        targetR: 138,
        targetG: 130,
        targetB: 86,
        targetMix: 0.12 * w,
        dryBias: 0.06 * w,
        localSeason,
    };
}

/**
 * 计算指定当地季节（0春 1夏 2秋 3冬）在该经纬度与气候参数下的地表色彩与干湿调制
 * 全程采用连续 smoothstep 空间权重与干湿度插值，不使用任何离散网格或布尔硬切边。
 */
function computeLocalSeasonModulation(
    localSeason: CalendarSeason4,
    lat: number,
    lng: number,
    aridity: number,
    sandiness: number,
    _zone?: EnvZoneId,
): SeasonalGroundModulation {
    // 1. 极旱真荒漠（撒哈拉、塔克拉玛干、塔尔沙漠核心、阿拉伯腹地等）连续平滑衰减至中性黄沙
    const desertMute = smoothstep(0.34, 0.56, sandiness) * 0.88 + smoothstep(0.68, 0.88, aridity) * 0.72;
    // 2. 赤道核心常绿雨林（|lat| < 9° 且极湿润）连续平滑衰减至四季常青
    const absLat = Math.abs(lat);
    const eqEvergreen = (1 - smoothstep(4.5, 9.5, absLat)) * (1 - smoothstep(0.14, 0.28, aridity));
    const vegWeight = clamp01((1 - desertMute) * (1 - eqEvergreen));
    if (vegWeight < 0.005) {
        return { ...NEUTRAL_MOD, localSeason };
    }

    const tempLatW = vegWeight * (0.45 + 0.55 * smoothstep(14, 28, absLat));
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
