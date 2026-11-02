import { koppenClassIdAt } from '../../data/KoppenGeigerGrid';
import { queryAridSand, queryWinterSnow } from '../../map/StrategicTerrainMaterial';
import { localSeasonAtLat, type CalendarSeason4 } from './seasonalGround';

/**
 * 天气总表：自然轴「内容层」（遵循 docs/AGENTS/environment-architecture.md）
 *
 * 统一根据（经纬度、海陆属性、海拔、日历季节）判定当地可出现的天气类型与权重，
 * 图层代码（WeatherLayer / CoastalWaveLayer）只消费这里的查询结果，不自写坐标框或气候阈值。
 */
export type WeatherKind =
    | 'SEA_STORM'       // 海上暴风雨（乌云压境 + 狂风急雨 + 闪电雷光 + 巨浪白沫）
    | 'MONSOON_SQUALL'  // 季风骤雨 / 暴雨（密集斜雨 + 水花涟漪 + 暗云）
    | 'DRIZZLE_MIST'    // 烟雨薄雾（轻柔细雨 + 流动云雾）
    | 'SEA_FOG'         // 海雾 / 浓雾（多层半透明云雾团缓缓流淌）
    | 'SNOW'            // 漫天飘雪（摇曳柔光雪花）
    | 'BLIZZARD'        // 塞外暴风雪（狂风斜吹密集雪粒 + 寒霜雾幕）
    | 'SANDSTORM';      // 大漠风沙（昏黄沙幕 + 高速跃移沙粒）

export interface WeatherSpec {
    kind: WeatherKind;
    /** 天气持续时长范围 [最短毫秒, 最长毫秒] */
    durationMs: readonly [number, number];
    /** 气团半径范围（度）[最小, 最大] */
    radiusDeg: readonly [number, number];
    /** 气团漂移速度（度/秒） */
    driftDegPerSec: number;
    /** 主风向角度（弧度，0=向东，PI/2=向南）基准与随机摆幅 */
    windAngleRad: number;
    /** 海面涌浪增幅系数（供 CoastalWaveLayer 联动巨浪白沫，0=无增幅，1=满暴风雨巨浪） */
    waveBoost: number;
}

export const WEATHER_SPECS: Readonly<Record<WeatherKind, WeatherSpec>> = {
    SEA_STORM: {
        kind: 'SEA_STORM',
        durationMs: [28_000, 46_000],
        radiusDeg: [2.2, 4.2],
        driftDegPerSec: 0.035,
        windAngleRad: 0.38,
        waveBoost: 1.0,
    },
    MONSOON_SQUALL: {
        kind: 'MONSOON_SQUALL',
        durationMs: [24_000, 40_000],
        radiusDeg: [2.0, 3.8],
        driftDegPerSec: 0.030,
        windAngleRad: 0.30,
        waveBoost: 0.55,
    },
    DRIZZLE_MIST: {
        kind: 'DRIZZLE_MIST',
        durationMs: [26_000, 44_000],
        radiusDeg: [2.2, 4.0],
        driftDegPerSec: 0.018,
        windAngleRad: 0.16,
        waveBoost: 0.15,
    },
    SEA_FOG: {
        kind: 'SEA_FOG',
        durationMs: [26_000, 45_000],
        radiusDeg: [2.4, 4.5],
        driftDegPerSec: 0.014,
        windAngleRad: 0.08,
        waveBoost: 0.0,
    },
    SNOW: {
        kind: 'SNOW',
        durationMs: [28_000, 48_000],
        radiusDeg: [2.4, 4.4],
        driftDegPerSec: 0.020,
        windAngleRad: 0.18,
        waveBoost: 0.10,
    },
    BLIZZARD: {
        kind: 'BLIZZARD',
        durationMs: [24_000, 40_000],
        radiusDeg: [2.2, 4.2],
        driftDegPerSec: 0.038,
        windAngleRad: 0.45,
        waveBoost: 0.70,
    },
    SANDSTORM: {
        kind: 'SANDSTORM',
        durationMs: [24_000, 42_000],
        radiusDeg: [2.2, 4.2],
        driftDegPerSec: 0.036,
        windAngleRad: 0.12,
        waveBoost: 0.20,
    },
};

export interface WeatherCandidate {
    kind: WeatherKind;
    weight: number;
}

/**
 * 查询指定经纬度、海陆状态、海拔与日历季节下的候选天气池
 */
export function resolveWeatherPoolAt(q: {
    lat: number;
    lng: number;
    isSea: boolean;
    elevM?: number | null;
    calendarSeason: CalendarSeason4;
}): WeatherCandidate[] {
    const { lat, lng, isSea, elevM, calendarSeason } = q;
    const localSeason = localSeasonAtLat(calendarSeason, lat);
    const absLat = Math.abs(lat);
    const koppen = koppenClassIdAt(lat, lng) ?? 14;
    const wf = queryWinterSnow(lat, lng) ?? 0;
    const [arid, sand] = queryAridSand(lat, lng);
    const highAltSnow = (elevM ?? 0) >= 2700;

    // 1. 海域天气池：海上暴风雨、季风骤雨、海雾、高纬海雪
    if (isSea) {
        const pool: WeatherCandidate[] = [];
        const isHighLatColdSea = absLat >= 48 || (localSeason === 3 && absLat >= 38 && wf >= 1);
        if (isHighLatColdSea) {
            pool.push({ kind: 'SEA_STORM', weight: 4 });
            pool.push({ kind: 'BLIZZARD', weight: localSeason === 3 ? 4 : 2 });
            pool.push({ kind: 'SNOW', weight: 3 });
            pool.push({ kind: 'SEA_FOG', weight: 3 });
        } else if (absLat < 26) {
            // 热带与副热带大洋：台风/飓风雷暴、季风骤雨、热带海雾
            pool.push({ kind: 'SEA_STORM', weight: localSeason === 1 || localSeason === 2 ? 6 : 4 });
            pool.push({ kind: 'MONSOON_SQUALL', weight: 5 });
            pool.push({ kind: 'DRIZZLE_MIST', weight: 2 });
            pool.push({ kind: 'SEA_FOG', weight: 2 });
        } else {
            // 温带海域（地中海、东海、北海、大西洋、日本海等）
            pool.push({ kind: 'SEA_STORM', weight: 5 });
            pool.push({ kind: 'MONSOON_SQUALL', weight: 3 });
            pool.push({ kind: 'SEA_FOG', weight: 3 });
            pool.push({ kind: 'DRIZZLE_MIST', weight: 3 });
        }
        return pool;
    }

    // 2. 干旱荒漠与戈壁带（BWh=4, BWk=5，或高沙度/高干旱度）：风沙为主，偶见旱区骤雨或冬雪
    const isDesert = koppen === 4 || koppen === 5 || sand >= 0.30 || arid >= 0.65;
    if (isDesert) {
        const pool: WeatherCandidate[] = [
            { kind: 'SANDSTORM', weight: 7 },
        ];
        if (localSeason === 3 && (koppen === 5 || wf >= 1 || highAltSnow)) {
            pool.push({ kind: 'SNOW', weight: 2 });
            pool.push({ kind: 'BLIZZARD', weight: 1 });
        } else {
            pool.push({ kind: 'DRIZZLE_MIST', weight: 1 });
        }
        return pool;
    }

    // 3. 寒冷降雪态（当地冬季且属于降雪带 wf>=1，或高寒苔原冰原 ET=29/EF=30，或高海拔雪山）
    const isSnowCondition =
        koppen >= 29 ||
        highAltSnow ||
        (localSeason === 3 && (wf >= 1 || koppen >= 17)) ||
        ((localSeason === 0 || localSeason === 2) && (wf === 2 || koppen >= 25));

    if (isSnowCondition) {
        const isSevereCold = wf === 2 || koppen >= 25 || highAltSnow || absLat >= 46;
        return isSevereCold
            ? [
                { kind: 'BLIZZARD', weight: 5 },
                { kind: 'SNOW', weight: 5 },
                { kind: 'SEA_FOG', weight: 2 },
            ]
            : [
                { kind: 'SNOW', weight: 6 },
                { kind: 'BLIZZARD', weight: 2 },
                { kind: 'DRIZZLE_MIST', weight: 2 },
            ];
    }

    // 4. 半干旱草原带（BSh=6, BSk=7）：风沙、雷阵雨、薄雾交错
    if (koppen === 6 || koppen === 7 || arid >= 0.50) {
        return [
            { kind: 'SANDSTORM', weight: 4 },
            { kind: 'MONSOON_SQUALL', weight: localSeason === 1 ? 4 : 2 },
            { kind: 'DRIZZLE_MIST', weight: 2 },
        ];
    }

    // 5. 热带与季风湿润区（Af=1, Am=2, Aw=3, Cwa=11, Cfa=14）
    if (koppen <= 3 || koppen === 11 || (koppen === 14 && absLat < 32)) {
        return [
            { kind: 'MONSOON_SQUALL', weight: localSeason === 1 || localSeason === 2 ? 6 : 3 },
            { kind: 'DRIZZLE_MIST', weight: 4 },
            { kind: 'SEA_FOG', weight: 2 },
        ];
    }

    // 6. 温带/地中海/海洋性气候常规春、夏、秋雨雾
    return [
        { kind: 'DRIZZLE_MIST', weight: 5 },
        { kind: 'MONSOON_SQUALL', weight: localSeason === 1 ? 4 : 2 },
        { kind: 'SEA_FOG', weight: 3 },
    ];
}

export function pickWeightedWeather(pool: readonly WeatherCandidate[], roll01: number): WeatherKind {
    let total = 0;
    for (const item of pool) total += item.weight;
    if (total <= 0) return 'DRIZZLE_MIST';
    let r = roll01 * total;
    for (const item of pool) {
        r -= item.weight;
        if (r <= 0) return item.kind;
    }
    return pool[pool.length - 1].kind;
}
