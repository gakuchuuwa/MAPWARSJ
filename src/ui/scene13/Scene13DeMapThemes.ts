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
        // 🔴 [2026-08-21 素材科学审查] ANIMAL_SKELETON（骸骨=沙漠/干地物）放南美温带（巴塔哥尼亚）→ ROCK3
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
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
        solidDecor: ['ROCK_JUNGLE', 'ROCK1', 'ROCK_FORMATION1'],
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
        // 🔴 [2026-08-21 修·截图] 原 rm1/rm2 稻田入地面 → 绿色长条（人工地块，移除）
        groundTiles: ['gr6', 'grs', 'gr3'],
        forestFloorTiles: ['fo2', 'underbrush_leaves'],
        trees: ['BAMBOO', 'LUSH_BAMBOO'],
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
        //    换 gr2（深绿黑土）+ gr7 + gr4，去掉干旱土。
        // 🔴 [2026-08-21 修·截图] 原 rm1/rm2/fm1/fm2 稻田/苗田入地面 → 战场出现「绿色长方条」
        //    （稻田垄沟纹理平铺成斑块）。农田是人工地块（DE farm 是建造物），随机地图自然地形
        //    从不撒农田——已移除，恢复纯自然黑土绿草。
        groundTiles: ['gr2', 'gr7', 'gr4'],
        forestFloorTiles: ['for', 'fo2'],
        // [2026-08-21 分类修正] 亚洲温带主树 = 枫树/松；BUSH_TREE_B 是灌木树（下层植被），当主树 = 张冠李戴
        trees: ['ASIAN_MAPLE_GREEN', 'ASIAN_PINE'],
        autumnTrees: ['ASIAN_MAPLE_AUTUMN'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        // 🔴 [2026-08-21 素材全覆盖] 秋季枫叶落叶（DE FALLEN_LEAVES_MAPLE）
        autumnFlatDecor: ['FALLEN_LEAVES_MAPLE_AUTUMN', 'FALLEN_LEAVES_MAPLE_RED', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_middle_east_desert: {
        id: 'palaearctic_middle_east_desert',
        baseTerrain: 'pal',
        // 🔴 [2026-08-21 素材全覆盖] 石英沙/流沙入沙漠地面（qs 石英沙、qs2 流沙绿洲边缘）
        groundTiles: ['ds2', 'des', 'ds4', 'qs', 'qs2'],
        forestFloorTiles: ['pal', 'for'],
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
        groundTiles: ['gr2', 'gr4', 'for', 'grs'],
        forestFloorTiles: ['for', 'snf', 'underbrush_leaves'],
        trees: ['DEAD_TREE', 'PINE'],
        autumnTrees: ['DEAD_TREE', 'PINE', 'AUTUMN_OAK'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        // 🔴 [2026-08-21 素材科学审查] flat 的 STUMP_GENERIC（实体树桩）挪到 solid——平面装饰层放
        //    枯植/干草更符合寒带针叶林（苔藓地衣/枯枝落叶，DE taiga 下层）
        flatDecor: ['SHRUB_GREEN', 'PLANT_DEAD', 'GRASS_DRY_PATCH'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'STUMP_GENERIC'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_temperate: {
        id: 'palaearctic_europe_temperate',
        baseTerrain: 'gr2',
        // 🔴 [2026-08-21 修·截图] 原 fm/fc 农田/苗田/旱田入地面 → 垄沟条纹斑块违和
        //    （人工地块，DE 随机地图自然地形无农田，移除）
        groundTiles: ['for', 'gr3', 'gr2'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['BUSH_TREE_A', 'OAK'],
        autumnTrees: ['BUSH_TREE_A', 'AUTUMN_OAK'],
        winterTrees: ['DEAD_TREE', 'SNOW_AUTUMN_OAK'],
        // 🔴 [2026-08-21 素材科学审查] STUMP 挪 solid；温带 flat = 野花/灌木/杂草（DE 温带下层）
        flatDecor: ['FLOWER', 'BUSH_GREEN', 'WEED'],
        // 🔴 [2026-08-21 素材全覆盖] 秋季橡树落叶（DE FALLEN_LEAVES_MAPLE 泛化为欧洲秋叶）
        autumnFlatDecor: ['FALLEN_LEAVES_MAPLE_AUTUMN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'STUMP_GENERIC'],
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
        // 🔴 [2026-08-21 素材科学审查] STUMP 挪 solid；地中海 flat = 花/灌木/枯植（地中海夏旱，枯植点缀）
        flatDecor: ['FLOWER', 'SHRUB_GREEN', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 秋季桃叶落叶（DE FALLEN_LEAVES_PEACH——地中海桃树）
        autumnFlatDecor: ['FALLEN_LEAVES_PEACH', 'FLOWER', 'SHRUB_GREEN'],
        // 🔴 [2026-08-21 素材全覆盖] 地中海商港木桶/地毯（腓尼基/威尼斯商栈）+ 海滩 bc4
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'STUMP_GENERIC', 'BARRELS', 'RUGS'],
        waterPlants: ['REEDS', 'OLIVE', 'WATER_LILY'],
        beachTerrain: 'bc4',
    },
    australasian_temperate: {
        id: 'australasian_temperate',
        baseTerrain: 'gr7',
        // 🔴 [2026-08-21 素材科学审查] 去 ds3/ds5（干旱土）——澳洲东南（悉尼/墨尔本）是湿润温带森林
        groundTiles: ['gr4', 'gr7', 'for', 'gr6'],
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
        // 🔴 [2026-08-21 修·截图] 原 rc1 秸秆地/rd5 道路入地面 → 人工纹理斑块违和（移除；rd1/rd2 原有保留）
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
        // 🔴 [2026-08-21 素材全覆盖] 岩石地/碎石入伊朗高原（rck 碎石、rc2 岩地）
        groundTiles: ['ds2', 'pm1', 'gr4', 'rck', 'rc2'],
        forestFloorTiles: ['ds3', 'pal'],
        // [2026-08-21 完善] 伊朗高原无棕榈（棕榈是波斯湾低地绿洲植物）→ PINE（厄尔布尔士/扎格罗斯山松林）替代
        trees: ['OLIVE', 'DEAD_TREE', 'PINE'],
        autumnTrees: ['OLIVE', 'DEAD_TREE'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        // 🔴 [2026-08-21 素材全覆盖] DECAL_CRACK 干裂地 + 商旅地毯/古墓（高原丝路）
        flatDecor: ['GRASS_DRY', 'PLANT_DEAD', 'WEED', 'SHRUB_GREEN', 'DECAL_CRACK'],
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'ROCK_LIMESTONE', 'RUGS', 'GRAVES'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_steppe: {
        id: 'palaearctic_asia_steppe',
        baseTerrain: 'pm2',
        // 🔴 [2026-08-21 修·截图] 原 fc 旱田/rc1 秸秆地/rd5 道路入地面 → 人工/线性纹理平铺成斑块违和（移除）
        groundTiles: ['gr4', 'ds3', 'pm1', 'ds5'],
        forestFloorTiles: ['ds3', 'for'],
        trees: ['PINE', 'DEAD_TREE'],
        autumnTrees: ['PINE', 'DEAD_TREE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 古战场遗迹（草原石墓/骸骨）——游牧战场
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'GRAVES', 'SKELETON'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_tibetan_plateau: {
        id: 'palaearctic_tibetan_plateau',
        baseTerrain: 'pm2',
        // 🔴 [2026-08-21 素材全覆盖] 碎石地(rck)/岩地(rc3)入高原地面
        groundTiles: ['gr4', 'ds5', 'pm1', 'sno', 'rck', 'rc3'],
        forestFloorTiles: ['ds3', 'snf'],
        trees: ['PINE', 'DEAD_TREE'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['SHRUB_GREEN', 'PLANT_DEAD', 'DECAL_ICE'],
        // 🔴 [2026-08-21 素材全覆盖] 高原古墓（石墓）——吐蕃/古格战场
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'ROCK_LIMESTONE', 'GRAVES'],
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
        // 🔴 [2026-08-21 素材全覆盖] qs2 流沙入沼泽地面（流沙沼泽）
        groundTiles: ['wt_brown', 'wt_green', 'r01', 'gravel_wet', 'qs2'],
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

    // 3. 青藏高原（纯坐标带 + 海拔：lat 26~40、lng 78~105、elev≥2500——对齐大地图色阶 2500 高原起点；
    //    🔴 2026-08-21 不依赖 region：region polygon 把河西武威误归 TIBET，纯坐标 + 海拔判定即可排除；
    //    无海拔数据(null)不启用——成都盆地(500m)/武威(1500m)绝不当高原）
    if (elev !== null && elev >= 2500 && lat > 26 && lat < 40 && lng > 78 && lng < 105) {
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

    // 4. 黄土高原与干旱中山（1000m - 2500m）：黄土 / 高原干旱冻土（如哈马丹、安卡拉、河西、晋北）
    if (elevationBand === 'mountain') {
        // 西亚高寒旱地高原（哈马丹/大不里士/安纳托利亚）：冬季为高寒干草冻土底色（pm1/ds3），绝非 100% 极地白雪
        if (theme.id === 'palaearctic_middle_east_highland') {
            return season === 2 ? 'pm1' : 'ds3';
        }
        // 塞外干草原（蒙古高原/漠北）：冬季为枯草冻土底色（gr4/pm2）
        if (theme.id === 'palaearctic_asia_steppe') {
            return season === 2 ? 'gr4' : 'pm2';
        }
        if (season === 2 && isSnowArea(lat, elev, biome)) return 'sn2';
        if (theme.id === 'palaearctic_asia_temperate' || theme.id === 'palaearctic_europe_temperate') {
            return 'gr4'; // 温带山地草坡
        }
    }

    // 5. 冬季合法降雪（🔴 [2026-08-21 修·净州塞截图] 原全换纯雪 → 战场 100% 白、见不到冻土。
    //    DE 冬季是「雪 + 冻土/干草/砾石」混合：苔原=冻土底色+雪斑、塞外草原=干草+雪斑、
    //    针叶林=深雪+冻土斑。故 baseTerrain 按 biome 定底色，雪斑由 groundTiles 变化层混入）
    if (season === 2 && isSnowArea(lat, elev, biome)) {
        if (biome === 'tundra_snow') return 'pm1';      // 苔原冻土底色（灰褐苔原土）
        if (biome === 'boreal') return 'sno';           // 针叶林深雪
        if (biome === 'cold_steppe' || biome === 'temperate_grass') return 'gr4'; // 塞外/温带草原：枯草底色
        return 'sn2';                                   // 温带林浅雪
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
        // 🔴 [2026-08-21 修·净州塞截图] 原全雪（sno/sn2/snf）→ 战场 100% 白无冻土。
        //    混合冻土（pm1/pm2 苔原冻土）、干草（gr4）、砾石（ds5）——DE 冬季地面
        //    = 雪 + 露土/枯草斑块，雪盖不住一切（风蚀/地形起伏/牲畜踩踏处露土）。
        if (biome === 'tundra_snow') return ['sno', 'sn2', 'pm2', 'ds5'];      // 冻土 + 雪斑 + 砾石
        if (biome === 'boreal') return ['sno', 'sn2', 'snf', 'pm1', 'ds5'];    // 深雪 + 冻土斑
        if (biome === 'cold_steppe' || biome === 'temperate_grass') return ['sn2', 'snf', 'pm1', 'gr4']; // 枯草 + 雪斑 + 冻土
        return ['sn2', 'snf', 'gr4', 'pm1'];                                    // 温带林：浅雪 + 枯草 + 冻土斑
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
