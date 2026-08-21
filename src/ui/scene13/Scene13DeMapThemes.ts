import type { RegionType } from '../../systems/RegionSystem';
import type { Biome, ElevationBand } from '../Scene13Biome';

export type DeMapThemeId =
    | 'afrotropical_tropical'
    | 'neotropical_temperate'
    | 'neotropical_tropical'
    | 'nearctic_temperate'
    | 'indomalayan_tropical'
    | 'palaearctic_asia_temperate'
    | 'palaearctic_asia_steppe'
    | 'palaearctic_tibetan_plateau'
    | 'palaearctic_middle_east_desert'
    | 'palaearctic_middle_east_highland'
    | 'palaearctic_europe_taiga'
    | 'palaearctic_europe_temperate'
    | 'palaearctic_europe_mediterranean'
    | 'australasian_temperate'
    | 'serengeti'
    | 'palustrine_swamp';

export interface DeMapThemePalette {
    id: DeMapThemeId;
    baseTerrain: string;
    groundTiles: readonly string[];
    forestFloorTiles: readonly string[];
    trees: readonly string[];
    autumnTrees?: readonly string[];
    winterTrees?: readonly string[];
    flatDecor: readonly string[];
    solidDecor: readonly string[];
    waterPlants: readonly string[];
    beachTerrain: string;
}

export const DE_MAP_THEMES: Readonly<Record<DeMapThemeId, DeMapThemePalette>> = {
    afrotropical_tropical: {
        id: 'afrotropical_tropical',
        baseTerrain: 'des',
        groundTiles: ['qs', 'pal', 'ds3', 'ds2', 'gr5'],
        forestFloorTiles: ['des', 'pal', 'for'],
        // [2026-08-21 分类修正] 非洲热带雨林用雨林/丛林树；DRAGON_TREE（龙血树）是也门/索科特拉岩岛树，非非洲雨林
        trees: ['JUNGLE', 'RAINFOREST'],
        // flat 改雨林下层植被；原 CACTUS/ANIMAL_SKELETON/PLANT_DEAD 是沙漠/干地物，放雨林 = 张冠李戴
        flatDecor: ['FERNPATCH', 'PLANT_RAINFOREST', 'UNDERBRUSH_RAINFOREST'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2'],
        waterPlants: ['REEDS', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    neotropical_temperate: {
        id: 'neotropical_temperate',
        baseTerrain: 'grs',
        groundTiles: ['gr6', 'gr7', 'gr8', 'for'],
        forestFloorTiles: ['for', 'ds3'],
        trees: ['MONKEY_PUZZLE'],
        flatDecor: ['WEED', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ANIMAL_SKELETON'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    neotropical_tropical: {
        id: 'neotropical_tropical',
        baseTerrain: 'gr6',
        groundTiles: ['fo2', 'gr7', 'gr3', 'for'],
        forestFloorTiles: ['for', 'fo2'],
        trees: ['JUNGLE', 'RAINFOREST'],
        flatDecor: ['WEED', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ANIMAL_SKELETON'],
        waterPlants: ['REEDS', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bc2',
    },
    nearctic_temperate: {
        id: 'nearctic_temperate',
        baseTerrain: 'ds3',
        groundTiles: ['grs', 'gr3', 'gr2', 'ds3'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['PINE'],
        autumnTrees: ['PINE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['BUSH_GREEN', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    indomalayan_tropical: {
        id: 'indomalayan_tropical',
        baseTerrain: 'gr7',
        groundTiles: ['gr6', 'grs', 'gr3'],
        forestFloorTiles: ['fo2', 'underbrush_leaves'],
        trees: ['BAMBOO', 'LUSH_BAMBOO'],
        flatDecor: ['SHRUB_GREEN', 'BUSH_GREEN', 'WEED'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK_JUNGLE'],
        waterPlants: ['REEDS', 'LUSH_BAMBOO', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_temperate: {
        id: 'palaearctic_asia_temperate',
        baseTerrain: 'gr7',
        // 🔴 [2026-08-21 修·乌舍城截图] 原 groundTiles 混 ds3（干旱黄褐土）→ 东北/华北战场
        //    显示黄褐干旱（乌舍城实锤）。亚洲温带湿润区（Dwa/Dwb）是黑土/草绿：
        //    换 gr2（深绿黑土）+ gr7 + gr4，去掉干旱土。
        groundTiles: ['gr2', 'gr7', 'gr4'],
        forestFloorTiles: ['for', 'fo2'],
        // [2026-08-21 分类修正] 亚洲温带主树 = 枫树/松；BUSH_TREE_B 是灌木树（下层植被），当主树 = 张冠李戴
        trees: ['ASIAN_MAPLE_GREEN', 'ASIAN_PINE'],
        autumnTrees: ['ASIAN_MAPLE_AUTUMN'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_middle_east_desert: {
        id: 'palaearctic_middle_east_desert',
        baseTerrain: 'pal',
        groundTiles: ['ds2', 'des', 'ds4', 'qs'],
        forestFloorTiles: ['pal', 'for'],
        trees: ['PALM'],
        flatDecor: ['PLANT_DEAD', 'CACTUS', 'ANIMAL_SKELETON'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3'],
        waterPlants: ['REEDS', 'PALM', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_taiga: {
        id: 'palaearctic_europe_taiga',
        baseTerrain: 'gr7',
        groundTiles: ['gr2', 'gr4', 'for', 'grs'],
        forestFloorTiles: ['for', 'snf', 'underbrush_leaves'],
        trees: ['DEAD_TREE', 'PINE'],
        autumnTrees: ['DEAD_TREE', 'PINE', 'AUTUMN_OAK'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        flatDecor: ['SHRUB_GREEN', 'STUMP_GENERIC'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_temperate: {
        id: 'palaearctic_europe_temperate',
        baseTerrain: 'gr2',
        groundTiles: ['for', 'gr3', 'gr2'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['BUSH_TREE_A', 'OAK'],
        autumnTrees: ['BUSH_TREE_A', 'AUTUMN_OAK'],
        winterTrees: ['DEAD_TREE', 'SNOW_AUTUMN_OAK'],
        flatDecor: ['FLOWER', 'STUMP_GENERIC', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_mediterranean: {
        id: 'palaearctic_europe_mediterranean',
        baseTerrain: 'gr3',
        groundTiles: ['gr7', 'pm1', 'pc3', 'ds3'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['OLIVE', 'ITALIAN_PINE'],
        winterTrees: ['OLIVE', 'ITALIAN_PINE'],
        flatDecor: ['FLOWER', 'STUMP_GENERIC', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'OLIVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    australasian_temperate: {
        id: 'australasian_temperate',
        baseTerrain: 'gr7',
        groundTiles: ['gr4', 'ds3', 'for', 'ds5'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        // [2026-08-21 主人定「能套用就套用」] 原 BIRCH（桦树=北半球树，澳洲无）→ WAX_PALM（澳洲热带/亚热带棕榈，DE 无澳洲专属树，取最接近）
        trees: ['WAX_PALM'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    serengeti: {
        id: 'serengeti',
        baseTerrain: 'ds4',
        groundTiles: ['gr5', 'rd1', 'rd2', 'ds5', 'des', 'grs', 'gr2', 'gr3'],
        forestFloorTiles: ['gr5', 'ds4'],
        trees: ['ACACIA', 'BAOBAB'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'PLANT_DEAD'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_middle_east_highland: {
        id: 'palaearctic_middle_east_highland',
        baseTerrain: 'ds3',
        groundTiles: ['ds2', 'pm1', 'gr4', 'qs', 'des'],
        forestFloorTiles: ['ds3', 'pal'],
        // [2026-08-21 完善] 伊朗高原无棕榈（棕榈是波斯湾低地绿洲植物）→ PINE（厄尔布尔士/扎格罗斯山松林）替代
        trees: ['OLIVE', 'DEAD_TREE', 'PINE'],
        autumnTrees: ['OLIVE', 'DEAD_TREE'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        flatDecor: ['GRASS_DRY', 'PLANT_DEAD', 'WEED', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'ROCK_LIMESTONE'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_steppe: {
        id: 'palaearctic_asia_steppe',
        baseTerrain: 'pm2',
        groundTiles: ['gr4', 'ds3', 'pm1', 'ds5'],
        forestFloorTiles: ['ds3', 'for'],
        trees: ['PINE', 'DEAD_TREE'],
        autumnTrees: ['PINE', 'DEAD_TREE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'PLANT_DEAD'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_tibetan_plateau: {
        id: 'palaearctic_tibetan_plateau',
        baseTerrain: 'pm2',
        groundTiles: ['gr4', 'ds5', 'pm1', 'sno'],
        forestFloorTiles: ['ds3', 'snf'],
        trees: ['PINE', 'DEAD_TREE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['SHRUB_GREEN', 'PLANT_DEAD', 'DECAL_ICE'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'ROCK_LIMESTONE'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    // 🔴 [2026-08-21 补全·DE Swamp biome] 沼泽湿地主题（全球低洼湿地通用）：
    //   DE 沼泽 = 棕/绿水 + 湿泥地 + 芦苇/睡莲 + 枯树柳树 + 湿滩边缘。素材全来自 DE：
    //   wt_brown/wt_green/wt_yellow（棕绿黄水）、gravel_wet/r01（湿泥）、beach_wet（湿滩）、
    //   REEDS/WATER_LILY/WILLOW/DEAD_TREE（水岸植物）。
    palustrine_swamp: {
        id: 'palustrine_swamp',
        baseTerrain: 'gravel_wet',
        groundTiles: ['wt_brown', 'wt_green', 'r01', 'gravel_wet'],
        forestFloorTiles: ['r01', 'underbrush_leaves'],
        trees: ['DEAD_TREE', 'WILLOW'],
        flatDecor: ['GRASS_GREEN_PATCH', 'UNDERBRUSH', 'WEED'],
        solidDecor: ['STUMP_GENERIC', 'ROCK1', 'ROCK2'],
        waterPlants: ['REEDS', 'WATER_LILY', 'WILLOW'],
        beachTerrain: 'beach_wet',
    },
};


export function isSnowArea(lat: number, elev: number | null, biome: Biome): boolean {
    if (elev !== null && elev >= (4800 - Math.abs(lat) * 63)) return true; // 高海拔终年雪线
    if (biome === 'tundra_snow' || biome === 'boreal') return true;
    // 低纬度热带/亚热带/沙漠：绝不下雪（如越南/岭南/华南低地/东南亚/中东低地）
    if (Math.abs(lat) < 25 && (elev === null || elev < 2000)) return false;
    if (biome === 'tropical_rainforest' || biome === 'savanna' || biome === 'desert') return false;
    // 温带/寒带中高纬度（华北/东北/塞外/欧洲/朝鲜/日本/高原）：冬季降雪
    return true;
}

export function resolveDeMapTheme(
    lat: number,
    lng: number,
    biome: Biome,
    region: RegionType,
    elev: number | null = null,
    waterKind: 'sea' | 'lake' | 'none' | undefined = undefined,
): DeMapThemePalette {
    // 🔴 [2026-08-21 完善·地理带优先] RegionSystem.getRegion 用城市多边形包含判定，
    //   粗多边形互相覆盖/漏覆盖（实测：武威→TIBET、大不里士/摩苏尔/拉合尔→CENTRAL_ASIA、
    //   巴黎→LATIN、游离点→CENTRAL）。故分流以「经纬度地理带 + 海拔」为第一判据，
    //   region 文化区仅作辅助（polygon 可靠时生效）。这才能满足「地区 × 海拔」两个维度的严格划分。

    // 0. 澳洲大陆（lat < -10 才落澳洲；印尼爪哇/新几内亚是热带雨林，不能被澳洲主题劫持）
    if (lat < -10 && lng >= 100) return DE_MAP_THEMES.australasian_temperate;

    // 1. 热带雨林 biome（按经度分非洲/南美/东南亚）
    if (biome === 'tropical_rainforest') {
        if (lng < -30) return DE_MAP_THEMES.neotropical_tropical;
        if (lng < 55) return DE_MAP_THEMES.afrotropical_tropical;
        return DE_MAP_THEMES.indomalayan_tropical;
    }

    // 2. 岭南 / 越南 / 东南亚热带亚热带水乡（限定东亚-东南亚海域 lng 90~130、lat 0~24；
    //    全世界低纬各归其主：撒哈拉/阿拉伯→沙漠、非洲稀树草原→serengeti、墨西哥→北美；
    //    🔴 海拔过滤：云贵高原（lat 25+、elev 1900）被岭南 polygon 覆盖，但高海拔是温带不是热带水乡）
    if ((region === 'LINGNAN' && (elev ?? 500) < 1500) || (lng > 90 && lng < 130 && lat > 0 && lat < 24)) {
        return DE_MAP_THEMES.indomalayan_tropical;
    }

    // 3. 青藏高原（区域 + 海拔双保险：region polygon 把河西武威误归 TIBET，用海拔排除；
    //    🔴 阈值对齐大地图海拔染色（HillshadeWorker）：2500m = 高原冷灰绿起点（loessMid→gobiBrown）；
    //    🔴🔴 [2026-08-21 修 bug] 必须 `elev !== null` 才启用海拔条件：原 `(elev ?? 4000) >= 2500`
    //    在海拔采样失败（null）时默认 4000m，导致成都盆地(500m)/武威(1500m)被当青藏高原——
    //    它们坐标恰在 lat 26-40/lng 78-105 带内。无海拔数据时宁可落温带（绿），不可误判高原（黄褐）。
    //    拉萨 3650 ✓ / 武威 1500 ✗（→ 河西黄土带））
    if (elev !== null && elev >= 2500 && (region === 'TIBET' || (lat > 26 && lat < 40 && lng > 78 && lng < 105))) {
        return DE_MAP_THEMES.palaearctic_tibetan_plateau;
    }

    // 4. 西亚带（安纳托利亚/黎凡特/两河/伊朗高原：lng 26~62、lat 25~43；
    //    覆盖大不里士/摩苏尔/马什哈德/贝鲁特——它们被 RegionSystem 误归中亚）
    if (lng > 26 && lng < 62 && lat > 25 && lat < 43) {
        if (biome === 'desert' || lat < 31) return DE_MAP_THEMES.palaearctic_middle_east_desert; // 两河/波斯湾低地
        // 🔴 [2026-08-21 完善] 地中海东岸（黎凡特海岸 lat 33-36、安纳托利亚西岸）都是地中海气候：
        //    原 lat>36 漏掉贝鲁特（33.9）→ 改成 lng<40（东地中海沿岸带）即可
        if (biome === 'mediterranean' && lng < 40) return DE_MAP_THEMES.palaearctic_europe_mediterranean;
        return DE_MAP_THEMES.palaearctic_middle_east_highland; // 伊朗高原/扎格罗斯
    }

    // 5. 中亚 / 阿富汗 / 巴基斯坦带（lng 62~90、lat 25~45：伊朗东部/阿富汗/俾路支/旁遮普干旱带）
    if (lng >= 62 && lng < 90 && lat > 25 && lat < 45) {
        if (biome === 'desert') return DE_MAP_THEMES.palaearctic_middle_east_desert;
        return DE_MAP_THEMES.palaearctic_asia_steppe;
    }

    // 6. 河西 / 陇右黄土高原带（lng 90~110、lat 33~42 且非青藏高海拔：武威/兰州/陇西；
    //    🔴 阈值与青藏带对称：<2500m 落河西黄土，≥2500m 落青藏（与大地图色阶 2500 高原起点一致））
    if (lng >= 90 && lng < 110 && lat > 33 && lat < 42 && (elev ?? 1000) < 2500) {
        return DE_MAP_THEMES.palaearctic_asia_steppe;
    }

    // 7. 塞外蒙古草原（region STEPPE 或 蒙古高原带 lng 85~125、lat 42~55）
    if (region === 'STEPPE' || (lng > 85 && lng < 125 && lat > 42 && lat < 55)) {
        return DE_MAP_THEMES.palaearctic_asia_steppe;
    }

    // 8. 华北 / 晋北黄土高原（region NORTH 且海拔 ≥ 600 → 黄土高原；低地 → 华北温带）
    if (region === 'NORTH') {
        if (elev !== null && elev >= 600) return DE_MAP_THEMES.palaearctic_asia_steppe;
        return DE_MAP_THEMES.palaearctic_asia_temperate;
    }

    // 9. 热带稀树草原（印度 savanna → 东南亚；其余 → 塞伦盖蒂）
    if (biome === 'savanna') {
        if (lng >= 55 && lat < 30) return DE_MAP_THEMES.indomalayan_tropical;
        return DE_MAP_THEMES.serengeti;
    }
    // 10. 沙漠 / 地中海（先排除——绿洲/地中海不沼泽）/ 低洼湿地（DE Swamp biome） / 寒带
    if (biome === 'desert') return DE_MAP_THEMES.palaearctic_middle_east_desert;
    if (biome === 'mediterranean') return DE_MAP_THEMES.palaearctic_europe_mediterranean;
    // 🔴 [2026-08-21 补全·Swamp] 内陆水域（lake）+ 低地（<200m）→ 沼泽主题，优先于寒带针叶林：
    //   东北松嫩/三江湿地（boreal）、北欧波罗的海沿岸、中欧低地、洞庭湖边——低洼湿地就是沼泽观感。
    //   只认 lake 不认 sea——海边（东京湾/大连）是海岸战场不是沼泽。
    //   🔴 阈值与 buildLake 的沼泽判定（elev<200）统一，避免「湖是沼泽、主题却不是」的割裂。
    if (waterKind === 'lake' && elev !== null && elev < 200) {
        return DE_MAP_THEMES.palustrine_swamp;
    }
    if (biome === 'boreal' || biome === 'tundra_snow') {
        return lng < -30 ? DE_MAP_THEMES.nearctic_temperate : DE_MAP_THEMES.palaearctic_europe_taiga;
    }
    // 11. 美洲（lng < -30）
    if (lng < -30) {
        return lat < 0 ? DE_MAP_THEMES.neotropical_temperate : DE_MAP_THEMES.nearctic_temperate;
    }

    // 12. 欧洲文化区（region polygon 可靠时生效）
    if (region === 'SLAVIC') return DE_MAP_THEMES.palaearctic_europe_taiga;
    if (region === 'GERMANIC') return DE_MAP_THEMES.palaearctic_europe_temperate;
    if (region === 'LATIN') {
        // 🔴 [2026-08-21 完善] 巴黎被 polygon 归 LATIN（罗马区），但巴黎是温带海洋性不是地中海气候：
        //    LATIN 区按纬度再分流——lat ≥ 45（法国北部/米兰）→ 温带；< 45（西班牙/意大利南部）→ 地中海
        if (lat >= 45) return DE_MAP_THEMES.palaearctic_europe_temperate;
        return DE_MAP_THEMES.palaearctic_europe_mediterranean;
    }

    // 12.5 → 已并入第 10 步（沼泽优先于寒带；desert/mediterranean 先排除）

    // 13. 东亚（日本/朝鲜/华东华北 lng ≥ 60）→ 亚洲温带
    if (lng >= 60) return DE_MAP_THEMES.palaearctic_asia_temperate;
    return DE_MAP_THEMES.palaearctic_europe_temperate;
}

export function terrainForTheme(
    theme: DeMapThemePalette,
    biome: Biome,
    season: 0 | 1 | 2,
    elevationBand: ElevationBand,
    lat: number = 35,
    elev: number | null = null,
): string {
    // 1. 终年积雪雪峰 / 冰川（>4800m 或达到纬度雪线）
    if (elevationBand === 'snow') return season === 2 ? 'ice' : 'sno';

    // 2. 极高山石原与高寒冻土（3800m - 4800m）：冷调冻土
    if (elevationBand === 'high_alpine') {
        return season === 2 ? 'sno' : 'ds5';
    }

    // 3. 高山草甸与戈壁砾石原（2500m - 3800m）：高寒石质土
    if (elevationBand === 'alpine') {
        if (season === 2 && isSnowArea(lat, elev, biome)) return 'sn2';
        return 'pm2';
    }

    // 4. 黄土高原与干旱中山（1000m - 2500m）：黄土 / 黄褐土
    if (elevationBand === 'mountain') {
        if (season === 2 && isSnowArea(lat, elev, biome)) return 'sn2';
        if (theme.id === 'palaearctic_middle_east_highland' || theme.id === 'palaearctic_asia_steppe') {
            return theme.baseTerrain;
        }
        if (theme.id === 'palaearctic_asia_temperate' || theme.id === 'palaearctic_europe_temperate') {
            return 'gr4'; // 温带山地草坡
        }
    }

    // 5. 冬季合法降雪
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        if (biome === 'tundra_snow' || biome === 'boreal') return 'sno';
        if (biome === 'cold_steppe' || biome === 'temperate_grass' || biome === 'temperate_forest') return 'sn2';
    }

    // 6. 基础地表
    return theme.baseTerrain;
}

export function treesForTheme(
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
): readonly string[] {
    if (season === 2 && isSnowArea(lat, elev, biome) && theme.winterTrees?.length) return theme.winterTrees;
    if (season === 1 && theme.autumnTrees?.length) return theme.autumnTrees;
    return theme.trees;
}

export function groundTilesForTheme(
    theme: DeMapThemePalette,
    biome: Biome,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
): readonly string[] {
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        if (biome === 'tundra_snow' || biome === 'boreal') return ['sno', 'sn2', 'snf'];
        return ['sn2', 'snf', 'sno'];
    }
    return theme.groundTiles;
}

export function forestFloorTilesForTheme(
    theme: DeMapThemePalette,
    biome: Biome,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
): readonly string[] {
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        return ['snf', 'sno'];
    }
    return theme.forestFloorTiles;
}

export function decorForTheme(
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
): { flat: readonly string[]; solid: readonly string[] } {
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        return {
            flat: ['SHRUB_GREEN', 'DECAL_ICE'],
            solid: ['ROCK1', 'ROCK2', 'DECAL_ICE'],
        };
    }
    return {
        flat: theme.flatDecor,
        solid: theme.solidDecor,
    };
}
