import type { Biome, ElevationBand } from '../Scene13Biome';

export type DeMapThemeId =
    | 'afrotropical_tropical'
    | 'neotropical_temperate'
    | 'neotropical_tropical'
    | 'nearctic_temperate'
    | 'indomalayan_tropical'
    | 'palaearctic_asia_temperate'
    | 'palaearctic_asia_steppe'
    | 'palaearctic_asia_desert'
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
    // 🔴 [2026-08-21 素材全覆盖] 秋季地面装饰（落叶等）——season 1 时优先于 flatDecor
    autumnFlatDecor?: readonly string[];
    solidDecor: readonly string[];
    waterPlants: readonly string[];
    beachTerrain: string;
}

export const DE_MAP_THEMES: Readonly<Record<DeMapThemeId, DeMapThemePalette>> = {
    afrotropical_tropical: {
        id: 'afrotropical_tropical',
        // 🔴 [2026-08-21 素材科学审查] 原 baseTerrain='des'（沙漠沙）+ groundTiles 混 qs/pal/ds2/ds3
        //    （石英沙/棕榈沙/沙漠土）——非洲热带雨林（刚果盆地）是深色腐殖土密林，不是沙地（张冠李戴）。
        baseTerrain: 'fo2',
        groundTiles: ['fo2', 'gr3', 'gr7'],
        forestFloorTiles: ['for', 'fo2'],
        // [2026-08-21 分类修正] 非洲热带雨林用雨林/丛林树；DRAGON_TREE（龙血树）是也门/索科特拉岩岛树，非非洲雨林
        trees: ['JUNGLE', 'RAINFOREST'],
        // flat 改雨林下层植被；原 CACTUS/ANIMAL_SKELETON/PLANT_DEAD 是沙漠/干地物，放雨林 = 张冠李戴
        flatDecor: ['FERNPATCH', 'PLANT_RAINFOREST', 'UNDERBRUSH_RAINFOREST'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE'],
        waterPlants: ['REEDS', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    neotropical_temperate: {
        id: 'neotropical_temperate',
        baseTerrain: 'grs',
        groundTiles: ['gr6', 'gr7', 'gr8', 'for', 'gr9'],
        forestFloorTiles: ['for', 'ds3'],
        trees: ['MONKEY_PUZZLE'],
        flatDecor: ['WEED', 'FLOWER', 'SHRUB_GREEN'],
        // 🔴 [2026-08-21 素材科学审查] ANIMAL_SKELETON（骸骨=沙漠/干地物）放南美温带（巴塔哥尼亚）→ ROCK3
        solidDecor: ['ROCK1', 'ROCK2'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    neotropical_tropical: {
        id: 'neotropical_tropical',
        baseTerrain: 'gr6',
        groundTiles: ['fo2', 'gr7', 'gr3', 'for'],
        forestFloorTiles: ['for', 'fo2'],
        trees: ['JUNGLE', 'RAINFOREST'],
        // 🔴 [2026-08-21 素材科学审查] 原 flat=WEED/FLOWER/SHRUB_GREEN（温带通用装饰）——亚马逊雨林
        //    下层是蕨丛/雨林植物/藤蔓（与非洲雨林同模式）；solid 改 ROCK_JUNGLE（雨林岩）。
        flatDecor: ['FERNPATCH', 'PLANT_RAINFOREST', 'UNDERBRUSH_RAINFOREST'],
        solidDecor: ['ROCK_JUNGLE', 'ROCK1'],
        waterPlants: ['REEDS', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bc2',
    },
    nearctic_temperate: {
        id: 'nearctic_temperate',
        baseTerrain: 'ds3',
        groundTiles: ['grs', 'gr3', 'gr2', 'ds3', 'pc1', 'pc2'],
        forestFloorTiles: ['for', 'pc1', 'pc2', 'underbrush_leaves'],
        trees: ['PINE'],
        autumnTrees: ['PINE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['BUSH_GREEN', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    indomalayan_tropical: {
        id: 'indomalayan_tropical',
        // 🔴 [2026-08-22 主人定] 岭南/华南/东南亚亚热带常绿雨林水乡：纯正深绿湿润黑土与茂密草绿，彻底去除干黄草(grs)
        baseTerrain: 'gr7',
        groundTiles: ['gr2', 'gr7', 'gr9', 'fo2'],
        forestFloorTiles: ['fo2', 'for', 'underbrush_leaves'],
        trees: ['BAMBOO', 'LUSH_BAMBOO', 'RAINFOREST'],
        // 🔴 [2026-08-21 素材科学审查] 原 flat=SHRUB_GREEN/BUSH_GREEN/WEED（温带通用）——东南亚雨林/竹丛
        //    下层是丛林蕨/藤丛（DE UNDERBRUSH_JUNGLE/PLANT_JUNGLE）。
        flatDecor: ['UNDERBRUSH_JUNGLE', 'PLANT_JUNGLE', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK_JUNGLE'],
        waterPlants: ['REEDS', 'LUSH_BAMBOO', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_temperate: {
        id: 'palaearctic_asia_temperate',
        baseTerrain: 'gr7',
        // 🔴 [2026-08-21 修·乌舍城截图] 原 groundTiles 混 ds3（干旱黄褐土）→ 东北/华北战场
        //    显示黄褐干旱（乌舍城实锤）。亚洲温带湿润区（Dwa/Dwb）是黑土/草绿：
        //    换 gr2（深绿黑土）+ gr7 + gr4 + gr9，去掉干旱土。
        groundTiles: ['gr2', 'gr7', 'gr4', 'gr9'],
        forestFloorTiles: ['for', 'fo2', 'pc1', 'pc2'],
        // [2026-08-21 分类修正] 亚洲温带主树 = 枫树/松；BUSH_TREE_B 是灌木树（下层植被），当主树 = 张冠李戴
        trees: ['ASIAN_MAPLE_GREEN', 'ASIAN_PINE'],
        autumnTrees: ['ASIAN_MAPLE_AUTUMN'],
        winterTrees: ['SNOW_PINE', 'ASIAN_PINE', 'SNOW_AUTUMN_OAK', 'DEAD_TREE'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        // 🔴 [2026-08-21 素材全覆盖] 秋季枫叶落叶（DE FALLEN_LEAVES_MAPLE）
        autumnFlatDecor: ['FALLEN_LEAVES_MAPLE_AUTUMN', 'FALLEN_LEAVES_MAPLE_RED', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_middle_east_desert: {
        id: 'palaearctic_middle_east_desert',
        baseTerrain: 'pal',
        // 🔴 [2026-08-23 清账] 移除 snd（官方 Snow Foundation 雪地基，误入沙漠）——归雪地类（§2.4.1）
        groundTiles: ['ds2', 'des', 'ds4', 'qs', 'qs2', 'pal1'],
        forestFloorTiles: ['pal', 'pal1', 'for'],
        trees: ['PALM'],
        // 🔴 [2026-08-21 素材全覆盖] DECAL_CRACK 干裂地/ DECAL_CRATER 陨坑（荒漠地貌贴花）
        flatDecor: ['PLANT_DEAD', 'CACTUS', 'ANIMAL_SKELETON', 'DECAL_CRACK', 'DECAL_CRATER'],
        // 🔴 [2026-08-21 素材全覆盖] 丝路商栈（木桶/地毯）+ 古战场遗迹（墓碑/骸骨）——荒漠商旅战场
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'BARRELS', 'RUGS', 'GRAVES', 'SKELETON'],
        waterPlants: ['REEDS', 'PALM', 'WATER_LILY'],
        beachTerrain: 'bc3',
    },
    palaearctic_europe_taiga: {
        id: 'palaearctic_europe_taiga',
        baseTerrain: 'gr7',
        groundTiles: ['gr2', 'gr4', 'for', 'grs', 'pc1', 'pc2', 'rock_wet'],
        forestFloorTiles: ['for', 'pc1', 'pc2', 'snf', 'underbrush_leaves'],
        trees: ['DEAD_TREE', 'PINE'],
        autumnTrees: ['DEAD_TREE', 'PINE', 'AUTUMN_OAK'],
        winterTrees: ['SNOW_PINE', 'ASIAN_PINE', 'SNOW_AUTUMN_OAK', 'DEAD_TREE'],
        // 🔴 [2026-08-21 素材科学审查] flat 的 STUMP_GENERIC（实体树桩）挪到 solid——平面装饰层放
        //    枯植/干草更符合寒带针叶林（苔藓地衣/枯枝落叶，DE taiga 下层）
        flatDecor: ['SHRUB_GREEN', 'PLANT_DEAD', 'GRASS_DRY_PATCH'],
        solidDecor: ['ROCK1', 'ROCK2', 'STUMP_GENERIC'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_temperate: {
        id: 'palaearctic_europe_temperate',
        baseTerrain: 'gr2',
        // 🔴 [2026-08-21 素材全覆盖] 欧洲温带深绿黑土 + 草地变体
        groundTiles: ['for', 'gr3', 'gr2', 'gr9'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['BUSH_TREE_A', 'OAK'],
        autumnTrees: ['BUSH_TREE_A', 'AUTUMN_OAK'],
        winterTrees: ['SNOW_PINE', 'SNOW_AUTUMN_OAK', 'DEAD_TREE'],
        // 🔴 [2026-08-21 素材科学审查] STUMP 挪 solid；温带 flat = 野花/灌木/杂草（DE 温带下层）
        flatDecor: ['FLOWER', 'BUSH_GREEN', 'WEED'],
        // 🔴 [2026-08-21 素材全覆盖] 秋季橡树落叶（DE FALLEN_LEAVES_MAPLE 泛化为欧洲秋叶）
        autumnFlatDecor: ['FALLEN_LEAVES_MAPLE_AUTUMN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'STUMP_GENERIC'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_mediterranean: {
        id: 'palaearctic_europe_mediterranean',
        baseTerrain: 'gr3',
        groundTiles: ['gr7', 'pm1', 'pc3', 'pc1', 'ds3'],
        forestFloorTiles: ['for', 'pc1', 'underbrush_leaves'],
        trees: ['OLIVE', 'ITALIAN_PINE'],
        winterTrees: ['OLIVE', 'ITALIAN_PINE'],
        // 🔴 [2026-08-21 素材科学审查] STUMP 挪 solid；地中海 flat = 花/灌木/枯植（地中海夏旱，枯植点缀）
        flatDecor: ['FLOWER', 'SHRUB_GREEN', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 秋季桃叶落叶（DE FALLEN_LEAVES_PEACH——地中海桃树）
        autumnFlatDecor: ['FALLEN_LEAVES_PEACH', 'FLOWER', 'SHRUB_GREEN'],
        // 🔴 [2026-08-21 素材全覆盖] 地中海商港木桶/地毯（腓尼基/威尼斯商栈）+ 海滩 bc4
        solidDecor: ['ROCK1', 'ROCK2', 'STUMP_GENERIC', 'BARRELS', 'RUGS'],
        waterPlants: ['REEDS', 'OLIVE', 'WATER_LILY'],
        beachTerrain: 'bc4',
    },
    australasian_temperate: {
        id: 'australasian_temperate',
        baseTerrain: 'gr7',
        // 🔴 [2026-08-21 素材科学审查] 去 ds3/ds5（干旱土）——澳洲东南（悉尼/墨尔本）是湿润温带森林
        groundTiles: ['gr4', 'gr7', 'for', 'gr6', 'gr9'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        // [2026-08-21 主人定「能套用就套用」] 原 BIRCH（桦树=北半球树，澳洲无）→ WAX_PALM（澳洲热带/亚热带棕榈，DE 无澳洲专属树，取最接近）
        trees: ['WAX_PALM'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2'],
        waterPlants: ['REEDS', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    serengeti: {
        id: 'serengeti',
        baseTerrain: 'ds4',
        // 🔴 [2026-08-21 素材全覆盖] 沙漠纯金沙 snd 入塞伦盖蒂干草与沙化区域
        // 🔴 [2026-08-23 清账] 移除 snd（雪地基，误入塞伦盖蒂）——归雪地类（§2.4.1）
        groundTiles: ['gr5', 'rd1', 'rd2', 'ds5', 'des', 'grs', 'gr2', 'gr3'],
        forestFloorTiles: ['gr5', 'ds4'],
        trees: ['ACACIA', 'BAOBAB'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 古战场遗骸（骸骨/墓碑）——非洲草原战场
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE', 'SKELETON', 'GRAVES'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_middle_east_highland: {
        id: 'palaearctic_middle_east_highland',
        baseTerrain: 'ds3',
        // 🔴 [2026-08-21 素材全覆盖] 岩石地/碎石/塞外冷岩 sr2 入伊朗高原
        groundTiles: ['ds2', 'pm1', 'gr4', 'rck', 'rc2', 'sr2'],
        forestFloorTiles: ['ds3', 'pal', 'pal1'],
        // [2026-08-21 完善] 伊朗高原无棕榈（棕榈是波斯湾低地绿洲植物）→ PINE（厄尔布尔士/扎格罗斯山松林）替代
        trees: ['OLIVE', 'DEAD_TREE', 'PINE'],
        autumnTrees: ['OLIVE', 'DEAD_TREE'],
        winterTrees: ['SNOW_PINE', 'ASIAN_PINE', 'SNOW_AUTUMN_OAK', 'DEAD_TREE'],
        // 🔴 [2026-08-21 素材全覆盖] DECAL_CRACK 干裂地 + 商旅地毯/古墓（高原丝路）
        flatDecor: ['GRASS_DRY', 'PLANT_DEAD', 'WEED', 'SHRUB_GREEN', 'DECAL_CRACK'],
        solidDecor: ['ROCK1', 'ROCK2', 'RUGS', 'GRAVES'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_steppe: {
        id: 'palaearctic_asia_steppe',
        baseTerrain: 'pm2',
        // 🔴 [2026-08-21 素材全覆盖] 碎石与冷岩 sr2 入塞外干草原
        groundTiles: ['gr4', 'ds3', 'pm1', 'ds5', 'sr2'],
        forestFloorTiles: ['ds3', 'for'],
        trees: ['PINE', 'DEAD_TREE'],
        autumnTrees: ['PINE', 'DEAD_TREE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 古战场遗迹（草原石墓/骸骨）——游牧战场
        solidDecor: ['ROCK1', 'ROCK2', 'GRAVES', 'SKELETON'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_tibetan_plateau: {
        id: 'palaearctic_tibetan_plateau',
        baseTerrain: 'gr2', // 夏季为绿意盎然的羌塘/藏南高寒草甸
        // 高原多变地表：绿草、高寒冷土、向阳干草、碎石岩地、冷岩 sr2
        groundTiles: ['gr2', 'pm2', 'gr4', 'ds5', 'rck', 'rc3', 'sr2'],
        forestFloorTiles: ['ds3', 'grs'],
        trees: ['ASIAN_PINE', 'PINE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['FLOWER_1', 'FLOWER_2', 'FLOWER_3', 'FLOWER_4', 'FLOWERBED', 'FERNPATCH', 'GRASS_GREEN_PATCH'],
        // 高原古墓（石墓）与高原岩石——吐蕃/古格战场
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'GRAVES'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_desert: {
        id: 'palaearctic_asia_desert',
        baseTerrain: 'ds2', // 经典干燥戈壁黄土沙原
        // 🔴 [2026-08-23 清账] 移除 snd（雪地基，误入亚洲沙漠）——归雪地类（§2.4.1）
        groundTiles: ['des', 'ds2', 'ds3', 'ds5', 'rck', 'qs'],
        forestFloorTiles: ['ds2', 'ds3', 'for'],
        trees: ['DEAD_TREE', 'DRAGON_TREE', 'BUSH_TREE_A', 'ASIAN_PINE'],
        autumnTrees: ['DEAD_TREE', 'DRAGON_TREE'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        flatDecor: ['PLANT_DEAD', 'ANIMAL_SKELETON', 'DECAL_CRACK', 'GRASS_DRY_PATCH', 'WEED'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK1', 'ROCK2', 'BARRELS', 'RUGS', 'GRAVES', 'SKELETON'],
        waterPlants: ['REEDS', 'DEAD_TREE', 'WATER_LILY'],
        beachTerrain: 'bc3',
    },
    // 🔴 [2026-08-21 补全·DE Swamp biome] 沼泽湿地主题（全球低洼湿地通用）：
    //   DE 沼泽 = 棕/绿水 + 湿泥地 + 芦苇/睡莲 + 枯树柳树 + 湿滩边缘 + 潮湿岩石 rock_wet。素材全来自 DE：
    //   wt_brown/wt_green/wt_yellow（棕绿黄水）、gravel_wet/r01（湿泥）、beach_wet（湿滩）、
    //   REEDS/WATER_LILY/WILLOW/DEAD_TREE（水岸植物）。
    palustrine_swamp: {
        id: 'palustrine_swamp',
        baseTerrain: 'gravel_wet',
        // 🔴 [2026-08-21 素材全覆盖] qs2 流沙 + rock_wet 湿润岩石入沼泽地面
        groundTiles: ['wt_brown', 'wt_green', 'r01', 'gravel_wet', 'qs2', 'rock_wet'],
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
    elev: number | null = null,
    waterKind: 'sea' | 'lake' | 'river' | 'none' | undefined = undefined,
): DeMapThemePalette {
    // 🔴 [2026-08-21 完善·气候纯按坐标] 分流完全由「经纬度坐标带 + 柯本 biome + 海拔」决定，
    //    **不接收 region 文化区参数**——气候是自然边界，文化区是政治边界，二者解耦（主人定）。

    // 0. 澳洲大陆（lat < -10 才落澳洲；印尼爪哇/新几内亚是热带雨林，不能被澳洲主题劫持）
    if (lat < -10 && lng >= 100) return DE_MAP_THEMES.australasian_temperate;

    // 1. 热带雨林 biome（按经度分非洲/南美/东南亚）
    if (biome === 'tropical_rainforest') {
        if (lng < -30) return DE_MAP_THEMES.neotropical_tropical;
        if (lng < 55) return DE_MAP_THEMES.afrotropical_tropical;
        return DE_MAP_THEMES.indomalayan_tropical;
    }

    // 2. 岭南 / 越南 / 东南亚热带亚热带水乡（纯坐标带 lng 90~130、lat 0~24；不依赖 region——
    //    🔴 2026-08-21 气候按坐标划分：热带纬度(lat<24) + 东南亚经度 = 热带水乡，其余低纬各归其主）
    if (lng > 90 && lng < 130 && lat > 0 && lat < 24) {
        return DE_MAP_THEMES.indomalayan_tropical;
    }

    // 3. 青藏高原（纯坐标带 + 海拔：lat 26~40、lng 78~105；若有海拔需 ≥2500m 排除成都盆地）
    if (lat > 26 && lat < 40 && lng > 78 && lng < 105 && (elev === null || elev >= 2500)) {
        return DE_MAP_THEMES.palaearctic_tibetan_plateau;
    }

    // 4. 西亚带（安纳托利亚内陆/黎凡特/两河/伊朗高原：lng 30~62、lat 25~43；
    //    巴尔干/君士坦丁堡/爱琴海西岸 lng<30 属欧洲温带/地中海，不进入西亚带）
    if (lng >= 30 && lng < 62 && lat > 25 && lat < 43) {
        if (biome === 'desert' || lat < 31) return DE_MAP_THEMES.palaearctic_middle_east_desert; // 两河/波斯湾低地
        // 🔴 [2026-08-21 完善] 地中海东岸（黎凡特海岸 lat 33-36、安纳托利亚西岸）都是地中海气候：
        //    原 lat>36 漏掉贝鲁特（33.9）→ 改成 lng<40（东地中海沿岸带）即可
        if (biome === 'mediterranean' && lng < 40) return DE_MAP_THEMES.palaearctic_europe_mediterranean;
        return DE_MAP_THEMES.palaearctic_middle_east_highland; // 伊朗高原/扎格罗斯
    }

    // 5. 中亚 / 阿富汗 / 巴基斯坦带（lng 62~75、lat 25~45：伊朗东部/阿富汗/俾路支/旁遮普干旱带）
    if (lng >= 62 && lng < 75 && lat > 25 && lat < 45) {
        if (biome === 'desert') return DE_MAP_THEMES.palaearctic_middle_east_desert;
        return DE_MAP_THEMES.palaearctic_asia_steppe;
    }

    // 6. 🔴 [2026-08-22 主人定] 西域与河西走廊戈壁荒漠带（赤金堡/玉门关/敦煌/酒泉/嘉峪关/金塔/居延/哈密/吐鲁番/塔里木：
    //    lng 75~101.5、lat 36~44 且海拔 < 2500m 排除祁连山/天山雪山）
    if (lng >= 75 && lng < 101.5 && lat > 36 && lat < 44 && (elev ?? 1000) < 2500) {
        return DE_MAP_THEMES.palaearctic_asia_desert;
    }

    // 7. 陇右 / 陇东 / 陕北黄土高原带（天水/兰州/定西/陇西/平凉/庆阳：lng 101.5~110、lat 33~42）
    if (lng >= 101.5 && lng < 110 && lat > 33 && lat < 42 && (elev ?? 1000) < 2500) {
        return DE_MAP_THEMES.palaearctic_asia_steppe;
    }

    // 7. 塞外蒙古草原（纯坐标带 lng 85~125、lat 42~55；不依赖 region STEPPE——草原纬度带即草原）
    if (lng > 85 && lng < 125 && lat > 42 && lat < 55) {
        return DE_MAP_THEMES.palaearctic_asia_steppe;
    }

    // 8. 华北 / 晋北黄土高原（纯坐标带 lat 34~42、lng 103~120 + 海拔：
    //    🔴 2026-08-21 不依赖 region NORTH——华北带 = 黄河中下游平原/黄土高原坐标；
    //    elev≥600（黄土高原核心）→ 黄土草原；低地（华北平原）→ 亚洲温带）
    if (lat > 34 && lat < 42 && lng > 103 && lng < 120) {
        if (elev !== null && elev >= 600) return DE_MAP_THEMES.palaearctic_asia_steppe;
        return DE_MAP_THEMES.palaearctic_asia_temperate;
    }

    // 9. 热带稀树草原（印度 savanna → 东南亚；其余 → 塞伦盖蒂）
    if (biome === 'savanna') {
        if (lng >= 55 && lat < 30) return DE_MAP_THEMES.indomalayan_tropical;
        return DE_MAP_THEMES.serengeti;
    }
    // 10. 沙漠 / 地中海（先排除——绿洲/地中海不沼泽）/ 温带半干旱草原 / 低洼湿地（DE Swamp biome） / 寒带
    if (biome === 'desert') return DE_MAP_THEMES.palaearctic_middle_east_desert;
    if (biome === 'mediterranean') return DE_MAP_THEMES.palaearctic_europe_mediterranean;
    // 🔴 [2026-08-21 全面检查·补 gap] cold_steppe（温带半干旱草原：BSk/Dsa/Dsb——中亚草原/北美大平原/
    //    马德里高原/巴塔哥尼亚）→ 草原主题。原落默认 europe_temperate（温带绿），马德里半干旱高原出绿草地（违和）。
    if (biome === 'cold_steppe') return DE_MAP_THEMES.palaearctic_asia_steppe;
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

    // 12. 欧洲（🔴 2026-08-21 气候按坐标划分：不再依赖 region SLAVIC/GERMANIC/LATIN——
    //     欧洲气候由柯本 biome 决定：地中海(Csa/Csb)已在第 10 步分流；寒带(Dfc)→taiga 已在第 10 步；
    //     温带海洋/大陆(Cfb/Dfb)落默认 europe_temperate。巴黎 Cfb→温带 ✓、罗马 Csa→地中海 ✓、
    //     莫斯科 Dfb→温带（阔叶林带，比原 taiga 更贴实）、西伯利亚 Dfc→taiga ✓）

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
    isSiege: boolean = false,
): string {
    // 1. 终年积雪雪峰 / 冰川（>4800m 或达到极高纬度真实雪线）
    // 🔴 [2026-08-23 第6层冰雪地带 9 块定稿] 雪线以上地表全是雪（真实世界）：
    //    极地/苔原（tundra_snow）冬季出冰原 ice，其余 biome 一律深雪 sno
    //    （沙漠高山雪峰天山/祁连、地中海阿尔卑斯、草原阿尔泰、温带落基山、寒带针叶林雪原）。
    if (elevationBand === 'snow') {
        return biome === 'tundra_snow' && season === 2 ? 'ice' : 'sno';
    }

    // 2. 极高山石原与高寒冻土（4000m - 5200m）
    // 🔴 [2026-08-23 第5层高寒地带 9 块定稿] 高寒带真实=石漠（羌塘/帕米尔/青藏北部）：
    //    主力 rck 岩石；极地/苔原（tundra_snow）pm2 高寒冻土草甸；冬季一律雪。
    if (elevationBand === 'high_alpine') {
        if (season === 2) return 'sno';
        return biome === 'tundra_snow' ? 'pm2' : 'rck';
    }

    // 3. 高山草甸与戈壁砾石原（2500m - 4000m）
    // 🔴 [2026-08-23 第4层高山地带 9 块定稿] 树线以上高山草甸：
    //    湿润带 5 块（雨林/萨凡纳/地中海/温带草原/温带森林）→ pm1 绿草甸；
    //    干旱/高寒带 4 块（沙漠/冷草原/针叶林树线/苔原）→ pm2 枯草甸。
    if (elevationBand === 'alpine') {
        if (season === 2 && isSnowArea(lat, elev, biome)) return 'sn2';
        const wetAlpine =
            biome === 'tropical_rainforest' ||
            biome === 'savanna' ||
            biome === 'mediterranean' ||
            biome === 'temperate_grass' ||
            biome === 'temperate_forest';
        return wetAlpine ? 'pm1' : 'pm2';
    }

    // 4. 黄土高原与干旱中山（1000m - 2500m）：黄土 / 高原干旱冻土（如哈马丹、安卡拉、河西、晋北）
    if (elevationBand === 'mountain') {
        if (theme.id === 'palaearctic_middle_east_highland') {
            return season === 2 ? 'pm1' : 'ds3';
        }
        if (theme.id === 'palaearctic_asia_steppe') {
            return season === 2 ? 'gr4' : 'pm2';
        }
        if (season === 2 && isSnowArea(lat, elev, biome)) return 'sn2';
        if (theme.id === 'palaearctic_asia_temperate' || theme.id === 'palaearctic_europe_temperate') {
            return 'gr4'; // 温带山地草坡
        }
    }

    // 5. 🔴 [2026-08-22 主人定] 冬季降雪地表：
    //    - 攻防战（isSiege）：城郭周围车马践踏，采用「半土半雪」DE 经典雪草地皮 (sn2)，雪中露土露草；
    //    - 野战（野战遭遇战）：野外茫茫雪原，全量保留 DE 纯正大自然白雪深雪 (sno / sn2)。
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        if (isSiege) {
            return 'sn2'; // 攻防战：半土半雪
        }
        return (biome === 'tundra_snow' || biome === 'boreal') ? 'sno' : 'sno'; // 野战：茫茫纯白雪原
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
    isSiege: boolean = false,
): readonly string[] {
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        if (isSiege) {
            // 攻防战：半土半雪组合（浅雪 sn2 + 枯草冻土 gr4 / pm1 + 林间残雪 snf + 冻土砾石 ds5 + 城郭踩实雪地基 snd）
            return ['sn2', 'gr4', 'snf', 'pm1', 'ds5', 'snd'];
        }
        // 野战：纯正大自然雪原组合（深雪 sno + 浅雪 sn2 + 林雪 snf + 冰面 ice）
        return ['sno', 'sn2', 'snf', 'ice'];
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
    // 🔴 [2026-08-21 素材全覆盖] 秋季：主题定义了 autumnFlatDecor（落叶等）时优先
    if (season === 1 && theme.autumnFlatDecor) {
        return {
            flat: theme.autumnFlatDecor,
            solid: theme.solidDecor,
        };
    }
    return {
        flat: theme.flatDecor,
        solid: theme.solidDecor,
    };
}

export function waterTerrainForTheme(
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
): string {
    // 1. 冬季雪区 / 极寒带：深寒暗青蓝冰水 (wt2)
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        return 'wt2';
    }
    if (biome === 'tundra_snow' || biome === 'boreal') {
        return 'wt2';
    }
    // 2. 华南 / 东南亚 / 非洲热带雨林水乡：DE 经典清澈碧绿翡翠水 (river_clean_green)
    if (
        theme.id === 'indomalayan_tropical' ||
        theme.id === 'afrotropical_tropical' ||
        theme.id === 'neotropical_tropical'
    ) {
        return 'river_clean_green';
    }
    // 3. 低洼内陆沼泽 / 湿地：暗绿水苔泥沼 (wt6)
    if (theme.id === 'palustrine_swamp') {
        return 'wt6';
    }
    // 4. 绝大多数江河水系（温带、地中海、中原、高地、沙漠绿洲等）：DE 经典清澈蔚蓝江水 (wtr)
    return 'wtr';
}

export function beachTerrainForTheme(
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
): string {
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        return 'ice_beach'; // 冬季结冰覆雪海滩
    }
    // 沙漠/黄土带使用干黄细沙
    if (theme.id === 'palaearctic_middle_east_desert' || biome === 'desert') {
        return 'des';
    }
    if (theme.id === 'palaearctic_asia_steppe' || theme.id === 'palaearctic_middle_east_highland') {
        return 'ds2';
    }
    // 欧洲温带 / 地中海 / 东亚中原 / 热带水乡：采用 DE 官方湿润河岸浅滩 (beach_wet)，自然过渡
    if (
        theme.id === 'palaearctic_europe_temperate' ||
        theme.id === 'palaearctic_europe_mediterranean' ||
        theme.id === 'palaearctic_asia_temperate' ||
        theme.id === 'indomalayan_tropical' ||
        theme.id === 'afrotropical_tropical'
    ) {
        return 'beach_wet';
    }
    return theme.beachTerrain || 'beach_wet';
}
