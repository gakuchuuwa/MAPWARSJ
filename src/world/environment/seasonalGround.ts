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
 * 判断某经纬度是否属于地中海型「夏干冬润」气候区
 * （环地中海、加利福尼亚、智利中部、南非好望角、西南澳）
 */
export function isMediterraneanClimateAt(lat: number, lng: number, zone?: EnvZoneId): boolean {
    const z = zone ?? resolveEnvZoneId(lat, lng);
    if (z === 'MED') return true;
    // 加利福尼亚沿岸
    if (lat >= 32 && lat <= 41 && lng >= -124.5 && lng <= -117) return true;
    // 智利中部（圣地亚哥谷地）
    if (lat >= -38 && lat <= -31 && lng >= -73.5 && lng <= -69.8) return true;
    // 南非开普敦地区
    if (lat >= -35 && lat <= -32 && lng >= 17.5 && lng <= 21.5) return true;
    // 澳大利亚西南部与阿德莱德
    if (lat >= -36 && lat <= -31 && ((lng >= 114.5 && lng <= 120) || (lng >= 136 && lng <= 140))) return true;
    return false;
}

/**
 * 判断某经纬度是否属于热带季风 / 稀树草原「旱雨两季」气候区
 * （印度次大陆、中南半岛旱雨区、非洲萨赫勒—东非—南非稀树草原、南美利亚诺斯/塞拉多、北澳季风草原）
 */
export function isTropicalMonsoonOrSavannaAt(
    lat: number,
    lng: number,
    aridity: number,
    sandiness: number,
    zone?: EnvZoneId,
): boolean {
    if (sandiness > 0.46 || aridity > 0.80) return false;
    const absLat = Math.abs(lat);
    if (absLat > 27.5) return false;
    // 赤道常绿雨林核心（亚马逊核心、刚果盆地核心、马来群岛赤道带）四季常青
    if (absLat < 7.5 && aridity < 0.18) return false;
    const z = zone ?? resolveEnvZoneId(lat, lng);
    if (z === 'SAS') return absLat <= 27.5 && aridity >= 0.12 && aridity <= 0.76;
    if (z === 'AFR') return absLat >= 5 && absLat <= 26 && aridity >= 0.16 && aridity <= 0.78;
    if (z === 'SEA') return absLat >= 9 && absLat <= 23.5 && aridity >= 0.15;
    if (z === 'AUS') return lat >= -23.5 && lat <= -10.5 && aridity <= 0.76;
    if (z === 'NEO' || z === 'AND') return absLat >= 5 && absLat <= 24 && aridity >= 0.15 && aridity <= 0.76;
    return absLat >= 8 && absLat <= 24.5 && aridity >= 0.18 && aridity <= 0.75;
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

/**
 * 计算指定当地季节（0春 1夏 2秋 3冬）在该经纬度与气候参数下的地表色彩与干湿调制
 */
function computeLocalSeasonModulation(
    localSeason: CalendarSeason4,
    lat: number,
    lng: number,
    aridity: number,
    sandiness: number,
    zone?: EnvZoneId,
): SeasonalGroundModulation {
    // 1. 极旱真荒漠（撒哈拉、塔克拉玛干、阿拉伯腹地等）终年黄沙不变
    const desertMute = smoothstep(0.36, 0.55, sandiness) * 0.85 + smoothstep(0.72, 0.88, aridity) * 0.65;
    const vegWeight = clamp01(1 - desertMute);
    if (vegWeight < 0.02) {
        return { ...NEUTRAL_MOD, localSeason };
    }

    const absLat = Math.abs(lat);
    // 2. 赤道核心常绿雨林（|lat| < 8° 且极湿润）终年常绿
    if (absLat < 8.5 && aridity < 0.18) {
        const eqFade = smoothstep(5.0, 8.5, absLat);
        if (eqFade < 0.05) {
            return { ...NEUTRAL_MOD, localSeason };
        }
    }

    const z = zone ?? resolveEnvZoneId(lat, lng);

    // 3. 地中海气候（夏干金黄 · 冬春润泽返青）
    if (isMediterraneanClimateAt(lat, lng, z)) {
        const w = vegWeight;
        if (localSeason === 3) {
            // 当地冬季：温和多雨，冬草返青苍翠
            return {
                rMul: 1 - 0.14 * w,
                gMul: 1 + 0.11 * w,
                bMul: 1 - 0.06 * w,
                targetR: 98,
                targetG: 132,
                targetB: 68,
                targetMix: 0.34 * w,
                dryBias: -0.28 * w,
                localSeason,
            };
        }
        if (localSeason === 0) {
            // 当地春季：春草繁茂鲜绿
            return {
                rMul: 1 - 0.11 * w,
                gMul: 1 + 0.10 * w,
                bMul: 1 - 0.08 * w,
                targetR: 108,
                targetG: 140,
                targetB: 70,
                targetMix: 0.30 * w,
                dryBias: -0.24 * w,
                localSeason,
            };
        }
        if (localSeason === 1) {
            // 当地夏季：副高控制，盛夏焦黄干涸
            return {
                rMul: 1 + 0.10 * w,
                gMul: 1 - 0.03 * w,
                bMul: 1 - 0.18 * w,
                targetR: 196,
                targetG: 162,
                targetB: 88,
                targetMix: 0.32 * w,
                dryBias: 0.30 * w,
                localSeason,
            };
        }
        // 当地秋季：秋雨初至，半黄半绿过渡
        return {
            rMul: 1 + 0.02 * w,
            gMul: 1 + 0.02 * w,
            bMul: 1 - 0.06 * w,
            targetR: 152,
            targetG: 142,
            targetB: 84,
            targetMix: 0.16 * w,
            dryBias: 0.06 * w,
            localSeason,
        };
    }

    // 4. 热带季风与稀树草原（旱季枯黄 · 雨季返青）
    if (isTropicalMonsoonOrSavannaAt(lat, lng, aridity, sandiness, z)) {
        const w = vegWeight * smoothstep(5.5, 11.0, absLat);
        if (localSeason === 1 || localSeason === 2) {
            // 雨季（当地夏、秋）：雨水丰沛，草原与季风林葱茏返青
            const wetStrength = localSeason === 1 ? 1.0 : 0.78;
            const sw = w * wetStrength;
            return {
                rMul: 1 - 0.15 * sw,
                gMul: 1 + 0.12 * sw,
                bMul: 1 - 0.08 * sw,
                targetR: 92,
                targetG: 132,
                targetB: 62,
                targetMix: 0.35 * sw,
                dryBias: -0.30 * sw,
                localSeason,
            };
        }
        // 旱季（当地冬、春）：大地干涸枯黄
        const dryStrength = localSeason === 0 ? 1.0 : 0.85;
        const sw = w * dryStrength;
        return {
            rMul: 1 + 0.12 * sw,
            gMul: 1 - 0.05 * sw,
            bMul: 1 - 0.20 * sw,
            targetR: 188,
            targetG: 146,
            targetB: 78,
            targetMix: 0.34 * sw,
            dryBias: 0.28 * sw,
            localSeason,
        };
    }

    // 5. 亚热带常绿季风区（江南、华南、云贵、美东南、巴拉那流域等：20°..31°，湿润）
    const isSubtropicalHumid =
        absLat >= 19 && absLat <= 31.5 && aridity < 0.36 && (z === 'EAS' || z === 'SWM' || z === 'SEA' || z === 'NAM' || z === 'NEO' || z === 'AND');
    if (isSubtropicalHumid) {
        const w = vegWeight;
        if (localSeason === 0) {
            // 春：新绿明快
            return {
                rMul: 1 - 0.05 * w,
                gMul: 1 + 0.07 * w,
                bMul: 1 - 0.07 * w,
                targetR: 112,
                targetG: 144,
                targetB: 72,
                targetMix: 0.18 * w,
                dryBias: -0.15 * w,
                localSeason,
            };
        }
        if (localSeason === 1) {
            // 夏：浓郁苍翠
            return {
                rMul: 1 - 0.07 * w,
                gMul: 1 + 0.05 * w,
                bMul: 1 - 0.04 * w,
                targetR: 86,
                targetG: 126,
                targetB: 64,
                targetMix: 0.16 * w,
                dryBias: -0.20 * w,
                localSeason,
            };
        }
        if (localSeason === 2) {
            // 秋：晚稻与秋林微泛金黄暖意
            return {
                rMul: 1 + 0.09 * w,
                gMul: 1 + 0.01 * w,
                bMul: 1 - 0.15 * w,
                targetR: 178,
                targetG: 152,
                targetB: 76,
                targetMix: 0.24 * w,
                dryBias: 0.18 * w,
                localSeason,
            };
        }
        // 冬：亚热带冬日清冷苍绿（微降饱和度）
        return {
            rMul: 1 - 0.02 * w,
            gMul: 1 - 0.05 * w,
            bMul: 1 - 0.02 * w,
            targetR: 116,
            targetG: 122,
            targetB: 96,
            targetMix: 0.20 * w,
            dryBias: 0.10 * w,
            localSeason,
        };
    }

    // 6. 温带平原、温带森林、大陆性草原与高寒草甸（华北、黄土、塞北、东北、西欧、东欧、北美、潘帕斯、巴塔哥尼亚等）
    const tempLatWeight = smoothstep(18, 30, absLat);
    const w = vegWeight * Math.max(0.35, tempLatWeight);
    if (localSeason === 0) {
        // 当地春季：春芽嫩绿（草木萌发，嫩黄绿生机）
        return {
            rMul: 1 - 0.05 * w,
            gMul: 1 + 0.08 * w,
            bMul: 1 - 0.10 * w,
            targetR: 118,
            targetG: 148,
            targetB: 72,
            targetMix: 0.24 * w,
            dryBias: -0.16 * w,
            localSeason,
        };
    }
    if (localSeason === 1) {
        // 当地夏季：夏草苍翠（丰茂深绿，草原返青）
        return {
            rMul: 1 - 0.09 * w,
            gMul: 1 + 0.06 * w,
            bMul: 1 - 0.06 * w,
            targetR: 92,
            targetG: 132,
            targetB: 66,
            targetMix: 0.22 * w,
            dryBias: -0.22 * w,
            localSeason,
        };
    }
    if (localSeason === 2) {
        // 当地秋季：秋草金黄（北方草原、温带平原与山林化作金黄琥珀色）
        const steppeBoost = aridity >= 0.22 && aridity <= 0.68 ? 1.15 : 1.0;
        const aw = clamp01(w * steppeBoost);
        return {
            rMul: 1 + 0.16 * aw,
            gMul: 1 - 0.02 * aw,
            bMul: 1 - 0.24 * aw,
            targetR: 194,
            targetG: 154,
            targetB: 74,
            targetMix: 0.42 * aw,
            dryBias: 0.36 * aw,
            localSeason,
        };
    }
    // 当地冬季（未被积雪完全覆盖的温带无雪/薄雪区，如关中、江淮、西欧平原、潘帕斯草原）：冬枯霜褐
    return {
        rMul: 1 + 0.03 * w,
        gMul: 1 - 0.09 * w,
        bMul: 1 - 0.12 * w,
        targetR: 146,
        targetG: 132,
        targetB: 102,
        targetMix: 0.36 * w,
        dryBias: 0.28 * w,
        localSeason,
    };
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
        // 保持原本纹理的明暗细节（luma ratio），只朝季节目标色相偏移
        const targetLuma = Math.max(1, 0.299 * mod.targetR + 0.587 * mod.targetG + 0.114 * mod.targetB);
        const detailScale = clamp01(luma / targetLuma * 0.65 + 0.35 * (luma / 128)) * 1.15;
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
