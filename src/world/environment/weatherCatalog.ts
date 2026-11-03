import { koppenClassIdAt } from '../../data/KoppenGeigerGrid';
import { queryWinterSnow } from '../../map/StrategicTerrainMaterial';
import { queryBaseTile } from '../../ui/scene13/WorldBaseMap';
import { envZoneAt } from './envZones';
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
        radiusDeg: [2.0, 3.0],
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
        radiusDeg: [2.0, 3.2],
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
 * 查询冬季降雪标志（优先读取 world-base.png 的 queryWinterSnow；若首屏异步加载尚未就绪，则按柯本气候带与自然区精确回退）
 */
function resolveWinterSnowFlagAt(lat: number, lng: number, koppen: number, zone: string): number {
    const raw = queryWinterSnow(lat, lng);
    if (raw !== null) return raw;
    const absLat = Math.abs(lat);
    if (zone === 'ARC' || zone === 'SIB' || koppen >= 27) return 2;
    if (
        zone === 'TIB' ||
        zone === 'NEB' ||
        koppen >= 17 ||
        ((zone === 'STP' || zone === 'CEU') && absLat >= 40)
    ) {
        return 1;
    }
    if ((zone === 'CAD' || koppen === 5) && absLat >= 36) return 4;
    if ((zone === 'LOE' || zone === 'NCP' || zone === 'WAH' || zone === 'STP' || zone === 'CEU') && absLat >= 33) {
        return absLat >= 37.5 ? 1 : 4;
    }
    if (zone === 'EAS' && absLat >= 29.5 && absLat < 33 && lng >= 111) return 4;
    return 0;
}

/**
 * 判定指定坐标与日历季节是否具备降雪气候条件（供 WeatherLayer 阻断越界雪团使用，统一收口在内容层）
 * - 自动按南北半球转换当地季节 localSeason；
 * - 青藏高寒（TIB）、北极（ARC）、高山苔原冰原（ET/EF）及高海拔雪山（>=2700m 或 gravel_default）允许高寒降雪；
 * - 热带低地（|lat| < 24° 且非高山）终年无雪；亚热带低地（|lat| < 33° 且非高山）春夏秋绝不下雪。
 */
export function canSustainSnowAt(
    lat: number,
    lng: number,
    calendarSeason: CalendarSeason4,
    elevM?: number | null,
): boolean {
    const localSeason = localSeasonAtLat(calendarSeason, lat);
    const absLat = Math.abs(lat);
    const koppen = koppenClassIdAt(lat, lng) ?? 14;
    const zone = envZoneAt(lat, lng);
    const wf = resolveWinterSnowFlagAt(lat, lng, koppen, zone);
    const tile = queryBaseTile({ lat, lng, isSiege: false, isWinter: false });
    const elev = elevM ?? 0;
    const isAlpineOrPolar =
        elev >= 2700 ||
        koppen >= 29 ||
        zone === 'TIB' ||
        zone === 'ARC' ||
        tile === 'gravel_default';

    if (isAlpineOrPolar) {
        if (localSeason === 1) {
            return koppen >= 29 || zone === 'TIB' || zone === 'ARC' || elev >= 3200;
        }
        return true;
    }
    // 热带低地、无雪热荒漠、地中海夏干冬雨低地：终年不具备降雪条件
    if (absLat < 24 && elev < 2200) return false;
    if ((koppen === 4 || zone === 'HDS') && wf === 0 && elev < 1500) return false;
    if ((zone === 'MED' || koppen === 8 || koppen === 9 || koppen === 10) && wf === 0 && elev < 1500) {
        return false;
    }
    // 华南、岭南、江南南缘及亚热带无雪区（|lat| < 28° 或 |lat| < 33° 且 wf=0）冬季只下雨不下雪
    if (absLat < 28 && elev < 2000) return false;
    if (absLat < 33 && wf === 0 && elev < 1500) return false;

    if (localSeason === 3) {
        return wf >= 1 || koppen >= 17 || elev >= 1500;
    }
    if (localSeason === 0 || localSeason === 2) {
        return absLat >= 48 && (wf === 2 || wf === 3 || koppen >= 27 || zone === 'SIB');
    }
    return absLat >= 66;
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
    const zone = envZoneAt(lat, lng);
    const wf = resolveWinterSnowFlagAt(lat, lng, koppen, zone);
    const tile = queryBaseTile({ lat, lng, isSiege: false, isWinter: false });
    const highAltSnow = (elevM ?? 0) >= 2700;

    // 1. 海域天气池：按极地寒洋、温带冷海、地中海夏干冬雨、热带台风洋面分级
    if (isSea) {
        // 极地冰洋或亚极地寒洋春秋冬季
        if (absLat >= 66 || (localSeason !== 1 && absLat >= 58)) {
            return [
                { kind: 'SEA_STORM', weight: 4 },
                { kind: 'BLIZZARD', weight: localSeason === 3 ? 4 : 2 },
                { kind: 'SNOW', weight: 4 },
                { kind: 'SEA_FOG', weight: 3 },
            ];
        }
        // 中高纬寒海冬季（42°以上结冰/积雪海区，如波罗的海、鄂霍次克海、日本海北部、北海北部冬季）
        if (localSeason === 3 && absLat >= 42 && (wf === 1 || wf === 2 || wf === 3 || koppen >= 21 || absLat >= 54)) {
            return [
                { kind: 'SEA_STORM', weight: 4 },
                { kind: 'BLIZZARD', weight: 3 },
                { kind: 'SNOW', weight: 4 },
                { kind: 'SEA_FOG', weight: 3 },
            ];
        }
        // 西欧北大西洋暖流海域冬季（英吉利海峡、比斯开湾等）：冬雨海暴为主，偶见海雪，无塞外暴雪
        if (localSeason === 3 && absLat >= 44) {
            return [
                { kind: 'SEA_STORM', weight: 5 },
                { kind: 'SEA_FOG', weight: 4 },
                { kind: 'DRIZZLE_MIST', weight: 3 },
                { kind: 'SNOW', weight: 2 },
            ];
        }
        // 热带/副热带干旱内海与海峡（红海、亚丁湾、波斯湾等，zone=HDS 或 koppen=4）：
        // 按史（《厄立特里亚海航行记》Periplus Maris Erythraei、伊本·马吉德《航海原则与规则全书》Kitab al-Fawa'id）：
        // 红海、亚丁湾、波斯湾航海气象以季风大风/海暴（SEA_STORM，如红海北风与亚丁湾西南季风巨浪）及上升流海雾（SEA_FOG）为主，
        // 少连绵季风豪雨，海面上不出现陆地贴地跃移飞沙的大漠沙尘暴（SANDSTORM 仅限陆地荒漠）。
        if ((zone === 'HDS' || koppen === 4) && absLat < 31) {
            return [
                { kind: 'SEA_STORM', weight: 5 },
                { kind: 'SEA_FOG', weight: 4 },
                { kind: 'DRIZZLE_MIST', weight: 1 },
            ];
        }
        // 热带与副热带大洋：夏秋台风/飓风雷暴高发，冬春信风阵雨与海雾
        if (absLat < 26) {
            const isStormSeason = localSeason === 1 || localSeason === 2;
            return [
                { kind: 'SEA_STORM', weight: isStormSeason ? 6 : 3 },
                { kind: 'MONSOON_SQUALL', weight: isStormSeason ? 5 : 4 },
                { kind: 'DRIZZLE_MIST', weight: 2 },
                { kind: 'SEA_FOG', weight: 2 },
            ];
        }
        // 地中海海域：夏季副高控制风平浪静多海雾微雨，冬季西风带风暴骤雨
        const isMedSea = lat >= 30 && lat <= 45.5 && lng >= -6 && lng <= 36.5;
        if (isMedSea) {
            if (localSeason === 1) {
                return [
                    { kind: 'SEA_FOG', weight: 4 },
                    { kind: 'DRIZZLE_MIST', weight: 3 },
                    { kind: 'SEA_STORM', weight: 2 },
                ];
            }
            if (localSeason === 3) {
                return [
                    { kind: 'SEA_STORM', weight: 5 },
                    { kind: 'MONSOON_SQUALL', weight: 4 },
                    { kind: 'DRIZZLE_MIST', weight: 3 },
                    { kind: 'SEA_FOG', weight: 2 },
                ];
            }
        }
        // 常规温带海域（东海、黄海、日本海南部、中纬大西洋等）：终年不下雪
        return [
            { kind: 'SEA_STORM', weight: 5 },
            { kind: 'MONSOON_SQUALL', weight: 3 },
            { kind: 'SEA_FOG', weight: 3 },
            { kind: 'DRIZZLE_MIST', weight: 3 },
        ];
    }

    // 2. 高原高寒与极地苔原带（青藏高寒 TIB、北极 ARC、极地/高山苔原冰原 ET=29/EF=30、高山砾石冻土 gravel_default）：
    //    优先于荒漠判定，防止青藏高原（逻些/拉萨、当雄）与安第斯高原（库斯科）因砾石底图被误判为沙尘暴沙漠。
    const isAlpineOrPolarZone =
        zone === 'TIB' ||
        zone === 'ARC' ||
        koppen >= 29 ||
        highAltSnow ||
        tile === 'gravel_default';
    if (isAlpineOrPolarZone) {
        if (localSeason === 3) {
            return [
                { kind: 'BLIZZARD', weight: wf === 4 ? 3 : 5 },
                { kind: 'SNOW', weight: 6 },
                { kind: 'SEA_FOG', weight: 2 },
            ];
        }
        if (localSeason === 0 || localSeason === 2) {
            const pool: WeatherCandidate[] = [
                { kind: 'SNOW', weight: 5 },
                { kind: 'DRIZZLE_MIST', weight: 3 },
                { kind: 'SEA_FOG', weight: 3 },
            ];
            if (koppen >= 29 || wf === 2 || zone === 'ARC' || (elevM ?? 0) >= 3600) {
                pool.push({ kind: 'BLIZZARD', weight: 2 });
            }
            return pool;
        }
        // 当地夏季：终年冰原/北极仍飞雪，高原主体（拉萨、昌都、库斯科）进入高原雨季（夜雨、云雾、偶有高寒飞雪）
        if (koppen === 30 || zone === 'ARC' || (elevM ?? 0) >= 4500) {
            return [
                { kind: 'SNOW', weight: 5 },
                { kind: 'BLIZZARD', weight: 3 },
                { kind: 'SEA_FOG', weight: 3 },
            ];
        }
        return [
            { kind: 'MONSOON_SQUALL', weight: 4 },
            { kind: 'DRIZZLE_MIST', weight: 4 },
            { kind: 'SEA_FOG', weight: 3 },
            { kind: 'SNOW', weight: 2 },
        ];
    }

    // 3. 真实干旱荒漠与戈壁带（BWh=4, BWk=5，或中亚冷荒漠 CAD / 西亚北非热荒漠 HDS，或真荒漠底图 pal/qs/pal1/ds5/des）：
    //    注意：绝不用 ds4（巴蜀/恒河红壤）、ds2（关中/黄土）或 gr7（地中海/巴蜀草地）判荒漠！
    const isTrueDesertTile =
        tile === 'pal' || tile === 'qs' || tile === 'pal1' || tile === 'ds5' || tile === 'des';
    const isDesert = koppen === 4 || koppen === 5 || zone === 'CAD' || zone === 'HDS' || isTrueDesertTile;
    if (isDesert) {
        // 热带/副热带无雪热荒漠（撒哈拉、阿拉伯、塔尔、叙利亚大漠 wf=0）：大漠黄沙，绝不下烟雨或飞雪
        if ((koppen === 4 || zone === 'HDS') && wf === 0) {
            return [
                { kind: 'SANDSTORM', weight: 10 },
            ];
        }
        // 温带冷荒漠与戈壁冬季（中亚、河西走廊、准噶尔、塔里木）
        if (localSeason === 3) {
            if (wf === 1 || wf === 2 || wf === 3) {
                // 冬季稳定积雪冷荒漠/天山北麓/准噶尔/河西东段（如姑臧、迪化、北庭、也迷里）：冬雪寒潮为主，兼有寒漠风沙
                return [
                    { kind: 'SNOW', weight: 6 },
                    { kind: 'BLIZZARD', weight: 3 },
                    { kind: 'SANDSTORM', weight: 2 },
                ];
            }
            if (wf === 4 || koppen === 5) {
                // 塔里木/罗布泊/敦煌/张掖等极旱雨影盆地冬季（零星残雪 flag=4）：风沙与寒雪交错，无液态细雨
                return [
                    { kind: 'SANDSTORM', weight: 5 },
                    { kind: 'SNOW', weight: 4 },
                ];
            }
        }
        return [
            { kind: 'SANDSTORM', weight: 10 },
        ];
    }

    // 4. 寒冷降雪态（温带/寒温带冬季降雪，以及西伯利亚/泰加林春秋降雪）：
    //    - 秦淮以南及亚热带（|lat| < 33°）：春夏秋绝对不下雪；冬季仅 |lat| >= 28° 且 wf >= 1（如江淮金陵、合肥、襄阳）有瑞雪；
    //    - 华南、岭南及热带低地（|lat| < 24°）：终年无雪；
    //    - 地中海气候低地（MED / Csa/Csb 且 wf=0）：夏干冬雨，冬季只下雨不下雪；
    //    - 秦淮以北冬季稳定降雪区（wf=1/2/3 或 koppen>=17）：冬季降水一律为瑞雪/风雪（配寒雾），不在隆冬下液态细雨。
    const isSubtropicalOrTropical = absLat < 33;
    const isTropicalWarm = absLat < 24 && (elevM ?? 0) < 2200;
    const isMediterraneanLowland =
        (zone === 'MED' || koppen === 8 || koppen === 9 || koppen === 10) &&
        wf === 0 &&
        (elevM ?? 0) < 1500;

    const isSnowCondition =
        !isTropicalWarm &&
        !isMediterraneanLowland &&
        ((!isSubtropicalOrTropical && localSeason === 3 && (wf >= 1 || koppen >= 17)) ||
            (!isSubtropicalOrTropical &&
                (localSeason === 0 || localSeason === 2) &&
                absLat >= 48 &&
                (wf === 2 || wf === 3 || koppen >= 27 || zone === 'SIB')) ||
            (isSubtropicalOrTropical && localSeason === 3 && absLat >= 28 && wf >= 1));

    if (isSnowCondition) {
        // 塞外暴风雪（BLIZZARD）仅限：深雪/寒温带雪林（wf=2/3）、亚寒带泰加林（koppen>=27）、
        // 或冬季稳定积雪（wf=1）的塞外/高纬大陆性严寒区（koppen>=23，或塞外 absLat>=40.2，或东北 NEB / 欧亚草原 STP / 北亚 SIB / 中东欧 CEU）
        const isSevereCold =
            !isSubtropicalOrTropical &&
            (wf === 2 ||
                wf === 3 ||
                koppen >= 27 ||
                (wf === 1 &&
                    (koppen >= 23 ||
                        (koppen >= 21 && absLat >= 40.2) ||
                        zone === 'NEB' ||
                        zone === 'STP' ||
                        zone === 'SIB' ||
                        zone === 'CEU')));

        if (isSevereCold) {
            return [
                { kind: 'BLIZZARD', weight: 5 },
                { kind: 'SNOW', weight: 5 },
                { kind: 'SEA_FOG', weight: 2 },
            ];
        }
        // 塞北/幽燕/黄土高原北部长城沿线（LOE / WAH 或幽燕 absLat>=38.5 且 wf=1，如北京/蓟城、大同、晋阳、安定、真定、怛罗斯）：瑞雪为主，偶有北方寒潮风雪
        if (!isSubtropicalOrTropical && wf === 1 && (zone === 'LOE' || zone === 'WAH' || koppen === 7 || absLat >= 38.5)) {
            return [
                { kind: 'SNOW', weight: 6 },
                { kind: 'BLIZZARD', weight: 2 },
                { kind: 'SEA_FOG', weight: 2 },
            ];
        }
        // 秦淮以北冬季降雪区（华北平原 NCP、关中洛阳 LOE、中欧 CEU、本州北部等）：冬季漫天瑞雪与寒雾，不下液态烟雨
        if (!isSubtropicalOrTropical && localSeason === 3 && zone !== 'WEU') {
            return [
                { kind: 'SNOW', weight: 8 },
                { kind: 'SEA_FOG', weight: 2 },
            ];
        }
        // 亚热带北缘冬季瑞雪过渡带（江淮金陵/合肥/襄阳 absLat 28°~33°）与西欧海洋性零星小雪带（WEU wf=4）：瑞雪与寒雨薄雾交织
        return [
            { kind: 'SNOW', weight: 6 },
            { kind: 'DRIZZLE_MIST', weight: 3 },
            { kind: 'SEA_FOG', weight: 2 },
        ];
    }

    // 5. 地中海气候区（MED 或 Csa=8, Csb=9, Csc=10）：典型「夏干冬雨」，绝不刮大漠沙尘暴
    if (zone === 'MED' || koppen === 8 || koppen === 9 || koppen === 10) {
        if (localSeason === 3) {
            // 冬季西风带温和多雨
            return [
                { kind: 'MONSOON_SQUALL', weight: 5 },
                { kind: 'DRIZZLE_MIST', weight: 5 },
                { kind: 'SEA_FOG', weight: 3 },
            ];
        }
        if (localSeason === 1) {
            // 夏季副高控制晴燥少大雨，仅偶有海雾或微雨
            return [
                { kind: 'SEA_FOG', weight: 5 },
                { kind: 'DRIZZLE_MIST', weight: 4 },
                { kind: 'MONSOON_SQUALL', weight: 1 },
            ];
        }
        // 春秋过渡季
        return [
            { kind: 'DRIZZLE_MIST', weight: 5 },
            { kind: 'MONSOON_SQUALL', weight: 3 },
            { kind: 'SEA_FOG', weight: 3 },
        ];
    }

    // 6. 半干旱草原与黄土高原（欧亚草原 STP、西亚高原草原 WAH、黄土高原 LOE、或热带半干旱草原 BSh=6）：
    //    排除华北平原（NCP）、西欧（WEU）、中东欧（CEU）以及黑海沿岸等温带湿润区（Cfa=14, Cfb=15）
    const isHumidOceanicOrSubtropical = koppen === 14 || koppen === 15 || koppen === 16;
    const isSteppeOrLoess =
        !isHumidOceanicOrSubtropical &&
        (zone === 'STP' ||
            zone === 'WAH' ||
            zone === 'LOE' ||
            koppen === 6 ||
            (koppen === 7 && zone !== 'NCP' && zone !== 'WEU' && zone !== 'CEU' && zone !== 'NEB'));

    if (isSteppeOrLoess) {
        // 黄土高原（LOE）：关中河洛温润带 vs 塞上黄土高原
        if (zone === 'LOE') {
            const isGuanzhongOrHeluo = koppen === 11 || lat < 35.0;
            if (localSeason === 1) {
                // 夏季东南季风雷雨盛期，无大漠风沙
                return [
                    { kind: 'MONSOON_SQUALL', weight: 6 },
                    { kind: 'DRIZZLE_MIST', weight: 4 },
                    { kind: 'SEA_FOG', weight: 2 },
                ];
            }
            if (localSeason === 2) {
                // 秋季（关中/秦岭华西秋雨绵绵，陇右晋北秋高气爽）
                return isGuanzhongOrHeluo
                    ? [
                        { kind: 'DRIZZLE_MIST', weight: 6 },
                        { kind: 'MONSOON_SQUALL', weight: 3 },
                        { kind: 'SEA_FOG', weight: 2 },
                    ]
                    : [
                        { kind: 'DRIZZLE_MIST', weight: 5 },
                        { kind: 'MONSOON_SQUALL', weight: 2 },
                        { kind: 'SANDSTORM', weight: 2 },
                    ];
            }
            // 春季：关中春雨偶伴轻沙，塞北黄土春风多沙
            return isGuanzhongOrHeluo
                ? [
                    { kind: 'DRIZZLE_MIST', weight: 5 },
                    { kind: 'MONSOON_SQUALL', weight: 3 },
                    { kind: 'SANDSTORM', weight: 2 },
                ]
                : [
                    { kind: 'SANDSTORM', weight: 4 },
                    { kind: 'DRIZZLE_MIST', weight: 3 },
                    { kind: 'MONSOON_SQUALL', weight: 2 },
                ];
        }

        // 欧亚草原（STP）、西亚高原草原（WAH）及半干旱草原（BSh/BSk）：夏季为草原雨季，冬春旱季多风沙
        if (localSeason === 1) {
            return [
                { kind: 'MONSOON_SQUALL', weight: 5 },
                { kind: 'DRIZZLE_MIST', weight: 3 },
                { kind: 'SANDSTORM', weight: 2 },
            ];
        }
        return [
            { kind: 'SANDSTORM', weight: 4 },
            { kind: 'DRIZZLE_MIST', weight: 3 },
            { kind: 'MONSOON_SQUALL', weight: 2 },
        ];
    }

    // 7. 热带与亚热带季风湿润区（东亚亚热带 EAS 江南/巴蜀/岭南、西南山地 SWM、东南亚 SEA、南亚季风 SAS、中美亚马孙 NEO、非洲湿润区）
    if (
        zone === 'EAS' ||
        zone === 'SWM' ||
        zone === 'SEA' ||
        zone === 'SAS' ||
        zone === 'NEO' ||
        koppen <= 3 ||
        koppen === 11 ||
        koppen === 12 ||
        (koppen === 14 && absLat < 32)
    ) {
        const isWetSeason = localSeason === 1 || localSeason === 2;
        return [
            { kind: 'MONSOON_SQUALL', weight: isWetSeason ? 6 : 3 },
            { kind: 'DRIZZLE_MIST', weight: 5 },
            { kind: 'SEA_FOG', weight: 3 },
        ];
    }

    // 8. 温带海洋性与温带大陆性/季风气候常规春、夏、秋及无雪暖冬（西欧 WEU、中东欧 CEU、华北 NCP、东北 NEB、北美 NAM 等）
    return [
        { kind: 'DRIZZLE_MIST', weight: 5 },
        { kind: 'MONSOON_SQUALL', weight: localSeason === 1 ? 5 : 2 },
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

/**
 * 校验并按地域气候与当前季节矫正天气类型（用于气团跨气候带漂移、季节切换或战略↔战术同步）：
 * - 若战术地图地表已是积雪/冰原（isSnowGround=true），降水一律转为降雪/暴风雪（绝不在雪地上淋液态大雨）；
 * - 若当前为 SNOW/BLIZZARD 但该坐标当前季节不具备降雪条件（如转入春季、或进入南方/地中海/热荒漠），自动切换为当地主天气；
 * - 若季节更替导致当前气团 kind 不再属于当地该季节候选池（如北方入冬后原秋雨气团、或入春后原冬雪气团），自动平滑转化为当季主导天气。
 */
export function coerceWeatherKindForLocation(
    currentKind: WeatherKind,
    q: {
        lat: number;
        lng: number;
        isSea: boolean;
        elevM?: number | null;
        calendarSeason: CalendarSeason4;
        isSnowGround?: boolean;
    },
): WeatherKind {
    const pool = resolveWeatherPoolAt(q);
    if (q.isSnowGround) {
        if (currentKind === 'SNOW' || currentKind === 'BLIZZARD' || currentKind === 'SEA_FOG') {
            return currentKind;
        }
        return pool.some((c) => c.kind === 'BLIZZARD') ? 'BLIZZARD' : 'SNOW';
    }
    if (
        (currentKind === 'SNOW' || currentKind === 'BLIZZARD') &&
        !canSustainSnowAt(q.lat, q.lng, q.calendarSeason, q.elevM)
    ) {
        let best = pool[0]?.kind ?? 'DRIZZLE_MIST';
        let bestW = -1;
        for (const item of pool) {
            if (item.kind !== 'SNOW' && item.kind !== 'BLIZZARD' && item.weight > bestW) {
                bestW = item.weight;
                best = item.kind;
            }
        }
        return best;
    }
    if (pool.some((c) => c.kind === currentKind)) {
        return currentKind;
    }
    let best = pool[0]?.kind ?? 'DRIZZLE_MIST';
    let bestW = -1;
    for (const item of pool) {
        if (item.weight > bestW) {
            bestW = item.weight;
            best = item.kind;
        }
    }
    return best;
}
