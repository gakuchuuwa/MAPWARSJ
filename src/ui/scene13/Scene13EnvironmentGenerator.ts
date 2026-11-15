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
import { queryAridSand, queryStrategicBaseTile } from '../../map/StrategicTerrainMaterial';
import { refineBaseTileWithBuildingStyle } from './WorldBaseMap';
import {
    isMediterraneanClimateAt,
    isTropicalMonsoonOrSavannaAt,
    localSeasonAtLat,
    type CalendarSeason4,
} from '../../world/environment/seasonalGround';
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

// ── 季节判定（以游戏日历为准：春夏绿/秋橙/冬白，含南半球季节反转） ──

function resolveCalendarAndLocalSeason(
    lat: number | undefined,
    getCalendarSeason?: () => 0 | 1 | 2
): { season3: 0 | 1 | 2; localSeason4: CalendarSeason4 } {
    // 🔴 主人 2026-08-20 定：季节唯一权威 = 游戏日历；南半球（lat < -5）季节反转 +2 季
    const tsSeason = (window as any).game?.timeSystem?.getSeason?.();
    let cal4: CalendarSeason4;
    if (typeof tsSeason === 'number') {
        cal4 = (tsSeason & 3) as CalendarSeason4;
    } else if (getCalendarSeason) {
        const s3 = getCalendarSeason();
        cal4 = s3 === 2 ? 3 : s3 === 1 ? 2 : 1;
    } else {
        cal4 = 1;
    }
    const localSeason4 = lat !== undefined ? localSeasonAtLat(cal4, lat) : cal4;
    const season3: 0 | 1 | 2 = localSeason4 === 3 ? 2 : localSeason4 === 2 ? 1 : 0;
    return { season3, localSeason4 };
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
    const { season3: season, localSeason4 } = resolveCalendarAndLocalSeason(input.lat, input.getCalendarSeason);
    const waterKind = input.forceWaterKind ?? probeWater(input.waterProbeLat ?? input.lat, input.waterProbeLng ?? input.lng);
    const theme = input.forceTheme
        ? DE_MAP_THEMES[input.forceTheme]
        : (hasCoord ? resolveDeMapTheme(input.lat!, input.lng!, biome, elev, waterKind) : null);
    const isSiege = input.isSiege ?? false;
    const isWinter = season === 2;
    const buildingStyle = input.buildingStyle ?? (hasCoord ? resolveNearestCityBuildingStyle(input.lat, input.lng) : undefined);
    // 底图由真实气候数据 + 16 种一级建筑风格（含 66 种二/三级子风格）共同决定，查不到才回退到主题逻辑
    // 攻城战城外原野同样保留当地自然草甸/四季地表，区域踩踏土（siegeDirtTile）只用于城内、城周护坡、城门官道与营地
    const nearRiver = hasCoord ? isNearStrategicRiver(input.lat!, input.lng!, 8) : false;
    const fromWorld = hasCoord
        ? queryStrategicBaseTile({
            lat: input.lat!,
            lng: input.lng!,
            isSiege: false,
            isWinter,
            elevM: elev,
            slopeDeg: slope,
            nearRiver,
            buildingStyle,
        })
        : null;
    const rawFallbackTerrain: string = theme
        ? terrainForTheme(theme, biome, season, elevationBand, input.lat, elev, false, input.lng)
        : DEFAULT_TERRAIN_TILE;
    let baseTerrain: string = fromWorld ?? (hasCoord && buildingStyle
        ? refineBaseTileWithBuildingStyle(rawFallbackTerrain, buildingStyle, input.lat!, input.lng!, false, isWinter)
        : rawFallbackTerrain);

    const siegeFromWorld = (isSiege && hasCoord)
        ? queryStrategicBaseTile({
            lat: input.lat!,
            lng: input.lng!,
            isSiege: true,
            isWinter,
            elevM: elev,
            slopeDeg: slope,
            nearRiver,
            buildingStyle,
        })
        : null;
    const siegeFallbackTerrain = (isSiege && theme)
        ? terrainForTheme(theme, biome, season, elevationBand, input.lat, elev, true, input.lng)
        : null;
    const siegeDirtTile = isSiege
        ? (siegeFromWorld ?? (hasCoord && buildingStyle && siegeFallbackTerrain
            ? refineBaseTileWithBuildingStyle(siegeFallbackTerrain, buildingStyle, input.lat!, input.lng!, true, isWinter)
            : siegeFallbackTerrain))
        : null;

    // ── 分气候带四季战术底图与副地表同步（地中海夏干冬润 · 热带旱雨季 · 温带秋草金黄） ──
    let seasonalDryOverride: string | undefined;
    if (hasCoord) {
        const isSnowRaw = /^(sno|sn2|snd|snf|ic3|ice)/.test(baseTerrain);
        if (!isSnowRaw) {
            const [arid, sand] = queryAridSand(input.lat!, input.lng!);
            if (isMediterraneanClimateAt(input.lat!, input.lng!)) {
                if ((localSeason4 === 3 || localSeason4 === 0) && baseTerrain === 'gr7') {
                    // 地中海冬春多雨返青：主草地切向温润绿草 gr3，副草地保留 gr7
                    baseTerrain = 'gr3';
                    seasonalDryOverride = 'gr7';
                } else if (localSeason4 === 1 && (baseTerrain === 'gr2' || baseTerrain === 'grs' || baseTerrain === 'gr3')) {
                    // 地中海盛夏炎热干涸：副地表配金黄干草 gr7
                    seasonalDryOverride = 'gr7';
                }
            } else if (isTropicalMonsoonOrSavannaAt(input.lat!, input.lng!, arid, sand)) {
                if ((localSeason4 === 1 || localSeason4 === 2) && (baseTerrain === 'gr7' || baseTerrain === 'gr5')) {
                    // 热带季风与稀树草原雨季返青：副草地配葱茏青草 gr2/gr3
                    seasonalDryOverride = 'gr2';
                } else if ((localSeason4 === 3 || localSeason4 === 0) && (baseTerrain === 'gr2' || baseTerrain === 'gr3' || baseTerrain === 'gr6')) {
                    // 热带旱季枯黄：副草地配干黄草 gr7
                    seasonalDryOverride = 'gr7';
                }
            } else if (localSeason4 === 2 && (baseTerrain === 'gr2' || baseTerrain === 'grs' || baseTerrain === 'gr3' || baseTerrain === 'for')) {
                // 温带与北方草原秋季：副草地配金黄秋草 gr7，配合 GL 四季着色展现秋草金黄
                seasonalDryOverride = 'gr7';
            }
        }
    }

    let groundTiles: Partial<Scene13GroundTiles> = {};
    if (hasCoord && theme) {
        // 副地表 dry / dirt 按真实地理 baseTerrain 从 DecorFit 同色系变体表取（色差 ≤30），
        // 消除沙漠混草（pal/des 落回 gr7）、雪原混褐泥（sno/sn2 落回 ds3+gr7）及黑土/红壤与主题表脱节问题
        const variations = groundVariationFor(baseTerrain);
        const gList = Array.isArray(theme.groundTiles) ? theme.groundTiles : [];
        const themeDry = seasonalDryOverride
            ?? variations[0]
            ?? gList.find((t) => /gr3|gr7|gr8|gr9|gravel|pc/i.test(t) && t !== baseTerrain)
            ?? (baseTerrain === 'gr7' ? 'gr3' : 'gr7');
        const themeDirt = variations[1]
            ?? variations[0]
            ?? gList.find((t) => /^(ds|des|mud)/i.test(t))
            ?? 'ds3';
        const isSnowBase = baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snd'
            || baseTerrain === 'snf' || baseTerrain === 'ic3' || baseTerrain === 'ice';
        const resolvedDirt = (isSiege && isSnowBase)
            ? ((siegeDirtTile && /^(snd|sn2)$/.test(siegeDirtTile)) ? siegeDirtTile : 'snd')
            : (isSiege && siegeDirtTile && siegeDirtTile !== baseTerrain && !/^(sno|sn2|snf|ic3|ice)$/.test(siegeDirtTile))
                ? siegeDirtTile
                : themeDirt;
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
            dirt: resolvedDirt,
            dry: themeDry,
        };
    }
    return {
        seed, climateRegion, elevationBand, elevationM: elev, slopeDeg: slope,
        biome, deMapTheme: hasCoord && theme ? theme.id : null, season, baseTerrain, groundTiles, waterKind,
        buildingStyle,
    };
}
