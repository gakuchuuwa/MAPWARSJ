/**
 * ZOOM 13 战场环境与气候判定（2026-10-14 精简重构）。
 * 战术模式的地面、树木、水体均由 GL 地面层按地图数据铺设，旧 2D 地面生成管线（generateEnvironment）已废弃删除。
 * 本模块仅保留战场气候判定 resolveEnvironmentClimate，供战场挑地图主题、地面四张贴图、季节与水域类型。
 */
import {
    Biome,
    type ElevationBand,
    type KoppenClass,
    detectBiomeAtElevation,
    resolveClimateRegion,
    resolveElevationBand,
    DEFAULT_TERRAIN_TILE,
} from '../Scene13Biome';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import { latLngToTilePixel } from '../../world/land-sea/ElevationSampler';
import { isNearStrategicRiver } from '../../map/StrategicRiverProximity';
import { queryStrategicBaseTile } from '../../map/StrategicTerrainMaterial';
import { refineBaseTileWithBuildingStyle } from './WorldBaseMap';
import { CITIES_V2 } from '../../data/cities_v2';
import {
    DE_MAP_THEMES,
    forestFloorTilesForTheme,
    beachTerrainForTheme,
    waterTerrainForTheme,
    freshWaterTileForStyle,
    resolveDeMapTheme,
    terrainForTheme,
    type DeMapThemeId,
} from './Scene13DeMapThemes';
import { groundVariationFor } from './DecorFit';

/** 按经纬度查找最近据点的 buildingStyle（供野战或未显式传入 buildingStyle 的战场同源继承当地建筑风格底座） */
export function resolveNearestCityBuildingStyle(lat: number | undefined, lng: number | undefined): string | undefined {
    if (lat === undefined || lng === undefined) return undefined;
    let bestStyle: string | undefined;
    let bestD2 = 16.0; // 最大匹配半径约 4°（~400km）
    for (const c of CITIES_V2) {
        if (!c.buildingStyle) continue;
        const dLat = c.lat - lat;
        const dLng = (c.lng - lng) * Math.cos((lat * Math.PI) / 180);
        const d2 = dLat * dLat + dLng * dLng;
        if (d2 < bestD2) {
            bestD2 = d2;
            bestStyle = c.buildingStyle;
        }
    }
    return bestStyle;
}

/**
 * 战场地面四张基底素材（气候主题取到的值，由环境生成器算好写给地面层）。
 * 🔴 与 Scene13DeMapThemes 的 terrainForTheme / beachTerrainForTheme / forestFloorTilesForTheme /
 *    waterTerrainForTheme 同一份表：这两处都从这里取，不许再各判一次（否则两边漂移）。
 */
export interface Scene13GroundTiles {
    /** 草地/主底图 */
    grass: string;
    /** 沙 / 滩 */
    sand: string;
    /** 森林底（林下腐殖土等） */
    forest: string;
    /** 水体（海边的图＝海水色；河/湖图＝淡水色） */
    water: string;
    /** 护城河/引水渠的水（淡水色；与 water 相同时不另采样） */
    moatWater?: string;
    /** 泥土/黄褐土斑块（DIRT） */
    dirt?: string;
    /** 旱草/枯草/副地表（DRY GRASS / GRAVEL） */
    dry?: string;
}

/** 🔴 [2026-10-14 主人令「删除旧 13 战术模式界面大小的残留」] 战场气候判定的输入：只要坐标与战场身份，不要画布宽高。 */
export interface Scene13ClimateInput {
    lat?: number;
    lng?: number;
    waterProbeLat?: number;
    waterProbeLng?: number;
    seed?: string;
    attackerFactionId?: string | null;
    defenderFactionId?: string | null;
    attackerGeneralId?: string | null;
    defenderGeneralId?: string | null;
    getCalendarSeason?: () => 0 | 1 | 2;
    forceBiome?: Biome;
    forceWaterKind?: 'sea' | 'lake' | 'river' | 'none';
    forceTheme?: DeMapThemeId;
    forceElevationBand?: ElevationBand;
    forceElevationM?: number;
    isSiege?: boolean;
    /** 据点建筑风格（66 种二/三级风格或 16 种一级风格）：作为底图设计的第一层基调 */
    buildingStyle?: string;
}

/** 战场气候判定的结果：新战术模式（GL 地面层）只用这几项挑地图主题、地面四张贴图、季节与时段色调。 */
export interface Scene13ClimatePlan {
    seed: string;
    climateRegion: KoppenClass | null;
    elevationBand: ElevationBand;
    elevationM: number | null;
    slopeDeg: number | null;
    biome: Biome;
    deMapTheme: DeMapThemeId | null;
    season: 0 | 1 | 2;
    baseTerrain: string;
    groundTiles: Partial<Scene13GroundTiles>;
    waterKind: 'sea' | 'lake' | 'river' | 'none';
    buildingStyle?: string;
}

// ── 种子派生（只用真实数据，禁止凭空假设 battleId） ──────────────

export function deriveEnvironmentSeed(input: {
    lat?: number;
    lng?: number;
    seed?: string;
    attackerFactionId?: string | null;
    defenderFactionId?: string | null;
    attackerGeneralId?: string | null;
    defenderGeneralId?: string | null;
}): string {
    if (input.seed) return input.seed;
    const parts = [
        input.lat ?? '?',
        input.lng ?? '?',
        input.attackerFactionId ?? '?',
        input.defenderFactionId ?? '?',
        input.attackerGeneralId ?? '?',
        input.defenderGeneralId ?? '?',
    ];
    return parts.join('|');
}

// ── 水域探测（高精度多尺度雷达密网扫描，判定据点是否临水/有江河海湾） ──

function probeWater(lat: number | undefined, lng: number | undefined): 'sea' | 'lake' | 'river' | 'none' {
    if (lat === undefined || lng === undefined) return 'none';

    // 高精度多尺度同心圆环密网扫描（500米 ~ 25公里，覆盖城郊所有江河水系与海湾）
    const distances = [0.005, 0.015, 0.035, 0.08, 0.20];
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];

    // 🔴 [2026-09-03 主人定] 港口/沿海城市：海优先（水在一侧海岸线）——先于战略河流检测，
    //    避免河口/海湾/沿海城池被误判成中轴江河战场。
    if (LandSeaSystem.isSeaAt({ lat, lng })) return 'sea';
    for (const dist of distances) {
        for (const ang of angles) {
            const curLat = lat + dist * Math.cos(ang);
            const curLng = lng + dist * Math.sin(ang);
            if (LandSeaSystem.isSeaAt({ lat: curLat, lng: curLng })) return 'sea';
        }
    }

    // 战略地图可见河流还包含 Natural Earth 矢量中心线；复用同一份数据，避免战略有河、战术没河。
    if (isNearStrategicRiver(lat, lng, 25)) return 'river';

    // 1. 优先直接检查 ESRI 真实瓦片水体像素（支持 Zoom 13 / 10 / 9 多级瓦片）
    for (const z of [13, 10, 9]) {
        const { tileX, tileY } = latLngToTilePixel(lat, lng, z);
        const maskObj = LandSeaSystem.getWaterSampler().getTileMaskSync(z, tileX, tileY);
        if (maskObj?.mask) {
            let waterPixels = 0;
            const m = maskObj.mask;
            for (let k = 0; k < m.length; k++) {
                if (m[k] === 1) waterPixels++;
            }
            if (waterPixels > 30) {
                return LandSeaSystem.isSeaAt({ lat, lng }) ? 'sea' : 'river';
            }
        }
    }

    if (LandSeaSystem.isSeaAt({ lat, lng })) return 'sea';
    if (LandSeaSystem.getWaterSampler().isWaterSync(lat, lng) === true) {
        return 'river';
    }

    // 环形雷达（内陆河补充检测）
    for (const dist of distances) {
        for (const ang of angles) {
            const curLat = lat + dist * Math.cos(ang);
            const curLng = lng + dist * Math.sin(ang);
            if (LandSeaSystem.getWaterSampler().isWaterSync(curLat, curLng) === true) {
                return 'river';
            }
        }
    }
    return 'none';
}

// ── 季节判定（以游戏日历为准：夏绿/秋橙/冬白；海拔/区域不再覆盖季节） ──

function resolveSeason(
    _lat: number | undefined,
    _lng: number | undefined,
    getCalendarSeason?: () => 0 | 1 | 2
): 0 | 1 | 2 {
    // 🔴 主人 2026-08-20 定：季节唯一权威 = 游戏日历。原「海拔≥600→秋、区域∈中亚/西域→秋」导致
    //    日历写「夏」战场却出红叶白桦（雷伊血训）。海拔/区域只影响 biome/地表/树密度，绝不改季节。
    return getCalendarSeason?.() ?? 0;
}

// ── 主入口 ─────────────────────────────────────────────────────

/**
 * 🔴 [2026-10-14] 战场气候判定（原 generateEnvironment 的「第 1 层 LAND」原样拆出）：
 * 环境地区 / 海拔档 / biome / 季节 / 主地形 / 水域类型 / DE 地图主题 / 地面四张基底素材。
 * 与画布大小无关 —— 战术模式的地面、树木、水体都由 GL 地面层按地图数据铺，游戏只调用本函数。
 */
export function resolveEnvironmentClimate(input: Scene13ClimateInput): Scene13ClimatePlan {
    const seed = input.seed ?? deriveEnvironmentSeed(input);
    const hasCoord = input.lat !== undefined && input.lng !== undefined;
    let elev: number | null = null;
    let slope: number | null = null;
    if (hasCoord) {
        const sample = LandSeaSystem.getSampler().getElevationAndSlopeSync(input.lat!, input.lng!);
        elev = sample?.elevationM ?? null;
        slope = sample?.slopeDeg ?? null;
    }
    if (input.forceElevationM !== undefined) elev = input.forceElevationM;
    const climateRegion = hasCoord ? resolveClimateRegion(input.lat!, input.lng!) : null;
    const elevationBand = input.forceElevationBand
        ?? (hasCoord ? resolveElevationBand(input.lat!, climateRegion, elev, input.lng) : 'lowland');
    const biome: Biome = input.forceBiome ?? (hasCoord ? detectBiomeAtElevation(input.lat!, input.lng!, elev) : 'temperate_forest');
    const season = resolveSeason(input.lat, input.lng, input.getCalendarSeason);
    const waterKind = input.forceWaterKind ?? probeWater(input.waterProbeLat ?? input.lat, input.waterProbeLng ?? input.lng);
    const theme = input.forceTheme
        ? DE_MAP_THEMES[input.forceTheme]
        : (hasCoord ? resolveDeMapTheme(input.lat!, input.lng!, biome, elev, waterKind) : null);
    const isSiege = input.isSiege ?? false;
    const isWinter = season === 2;
    const buildingStyle = input.buildingStyle ?? (hasCoord ? resolveNearestCityBuildingStyle(input.lat, input.lng) : undefined);
    // 底图由真实气候数据 + 16 种一级建筑风格（含 66 种二/三级子风格）共同决定，查不到才回退到主题逻辑
    const fromWorld = hasCoord
        ? queryStrategicBaseTile({
            lat: input.lat!,
            lng: input.lng!,
            isSiege,
            isWinter,
            elevM: elev,
            slopeDeg: slope,
            nearRiver: isNearStrategicRiver(input.lat!, input.lng!, 8),
            buildingStyle,
        })
        : null;
    const rawFallbackTerrain: string = theme
        ? terrainForTheme(theme, biome, season, elevationBand, input.lat, elev, isSiege, input.lng)
        : DEFAULT_TERRAIN_TILE;
    const baseTerrain: string = fromWorld ?? (hasCoord && buildingStyle
        ? refineBaseTileWithBuildingStyle(rawFallbackTerrain, buildingStyle, input.lat!, input.lng!, isSiege, isWinter)
        : rawFallbackTerrain);
    let groundTiles: Partial<Scene13GroundTiles> = {};
    if (hasCoord && theme) {
        // 副地表 dry / dirt 按真实地理 baseTerrain 从 DecorFit 同色系变体表取（色差 ≤30），
        // 消除沙漠混草（pal/des 落回 gr7）、雪原混褐泥（sno/sn2 落回 ds3+gr7）及黑土/红壤与主题表脱节问题
        const variations = groundVariationFor(baseTerrain);
        const gList = Array.isArray(theme.groundTiles) ? theme.groundTiles : [];
        const themeDry = variations[0]
            ?? gList.find((t) => /gr3|gr7|gr8|gr9|gravel|pc/i.test(t) && t !== baseTerrain)
            ?? (baseTerrain === 'gr7' ? 'gr3' : 'gr7');
        const themeDirt = variations[1]
            ?? variations[0]
            ?? gList.find((t) => /^(ds|des|mud)/i.test(t))
            ?? 'ds3';
        const isSnowBase = baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snd'
            || baseTerrain === 'snf' || baseTerrain === 'ic3' || baseTerrain === 'ice';
        const isAlpineGravelBase = baseTerrain === 'gravel_default' || baseTerrain === 'rck';
        groundTiles = {
            grass: baseTerrain,
            sand: beachTerrainForTheme(theme, season, input.lat ?? 35, elev, biome, input.lng),
            forest: isAlpineGravelBase
                ? 'gravel_default'
                : isSnowBase
                    ? 'snf'
                    : forestFloorTilesForTheme(theme, biome, season, input.lat ?? 35, elev, input.lng)[0],
            // 🔴 [2026-10-21 主人令「一个据点图用一种水；淡水一种，海水一种」] 海边的图用海水色；河、湖、无水的图用该文化区的淡水色；
            //    护城河一律淡水色（moatWater）。冬季结冰（ic2）不换色。
            water: ((): string => {
                const sea = waterTerrainForTheme(theme, season, input.lat ?? 35, elev, biome, input.lng);
                return (waterKind === 'sea' || sea === 'ic2') ? sea : freshWaterTileForStyle(buildingStyle);
            })(),
            moatWater: ((): string => {
                const sea = waterTerrainForTheme(theme, season, input.lat ?? 35, elev, biome, input.lng);
                return sea === 'ic2' ? sea : freshWaterTileForStyle(buildingStyle);
            })(),
            dirt: themeDirt,
            dry: themeDry,
        };
    }
    return {
        seed, climateRegion, elevationBand, elevationM: elev, slopeDeg: slope,
        biome, deMapTheme: hasCoord && theme ? theme.id : null, season, baseTerrain, groundTiles, waterKind,
        buildingStyle,
    };
}
