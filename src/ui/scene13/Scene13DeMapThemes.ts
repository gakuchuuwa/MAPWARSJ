import type { Biome, ElevationBand } from '../Scene13Biome';
import { queryWinterSnow } from './WorldBaseMap';

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
    | 'palaearctic_salt_desert'
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
        // 🔴 [2026-08-24 主人定·分层原则] 底图只能是纯地表材质。
        //    森林是**树的组合**（第二层），不是一种地面——原来这里用 fo2(Rainforest)
        //    当底图，等于把「森林地形」当开阔地铺满全场。
        baseTerrain: 'gr6',
        groundTiles: ['fo2', 'gr3', 'gr7', 'gr6'], // gr6=Grass,Jungle 丛林草归位雨林
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
        // 🔴 [2026-08-23 清账] grs(带13%花)→gr2(纯绿草)
        baseTerrain: 'gr2',
        groundTiles: ['gr7', 'gr8', 'for', 'gr9'], // 移除 gr6(丛林草)——南美温带(巴塔哥尼亚)无丛林草
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
        // 🔴 [2026-08-24 主人定·分层原则] 改回 gr6(丛林草)。
        //    fo2 是 DE 的 Rainforest **森林地形**，属第二层（树的组合），不能当底图。
        baseTerrain: 'gr6',
        groundTiles: ['fo2', 'gr7', 'gr3', 'for', 'gr6'], // gr6=Grass,Jungle 丛林草归位雨林
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
        // 🔴 [2026-08-23 清账] ds3(黄土)→gr2(纯绿草)，北美温带草原/森林
        baseTerrain: 'gr2',
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
        // 🔴 [2026-08-23 DE化] 底色换纯净绿草 gr2；原 fo2（叶+土预混）改当副色斑块
        baseTerrain: 'gr2',
        groundTiles: ['gr2', 'gr7', 'gr9', 'fo2', 'gr6'], // gr6=Grass,Jungle 丛林草归位雨林
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
        // 🔴 [2026-08-21 修·乌舍城截图] 原 groundTiles 混 ds3（干旱黄褐土）→ 东北/华北战场
        //    显示黄褐干旱（乌舍城实锤）。亚洲温带湿润区（Dwa/Dwb）是黑土/草绿：
        //    换 gr2（深绿黑土）+ gr7 + gr4 + gr9，去掉干旱土。
        // 🔴 [2026-08-23 清账] gr7(枯黄)→gr2(纯绿草)，华北黑土草绿
        baseTerrain: 'gr2',
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
        // 🔴 [2026-08-23 清账] 移除 snd（官方 Snow Foundation 雪地基，误入沙漠）——归雪地类（§2.4.1）；qs2(沼泽泥)移入盐漠/沼泽
        groundTiles: ['ds2', 'des', 'ds4', 'qs', 'pal1'],
        forestFloorTiles: ['pal', 'pal1', 'for'],
        trees: ['PALM'],
        // 🔴 [2026-08-21 素材全覆盖] DECAL_CRACK 干裂地/ DECAL_CRATER 陨坑（荒漠地貌贴花）
        flatDecor: ['PLANT_DEAD', 'CACTUS', 'ANIMAL_SKELETON', 'DECAL_CRACK', 'DECAL_CRATER'],
        // 🔴 [2026-08-21 素材全覆盖] 丝路商栈（木桶/地毯）+ 古战场遗迹（墓碑/骸骨）——荒漠商旅战场
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'BARRELS', 'RUGS', 'SKELETON'],
        waterPlants: ['REEDS', 'PALM', 'WATER_LILY'],
        beachTerrain: 'bc3',
    },
    // 🔴 [2026-08-23 新增] 龟裂盐漠（playa/salt flat）——真实地理：伊朗大盐漠 Dasht-e Kavir（卡维尔）、
    //    卢特沙漠 Dasht-e Lut、突尼斯杰里德盐沼 Chott el Djerid。地面干涸龟裂盐渍（pal1 干裂沙），无树。
    palaearctic_salt_desert: {
        id: 'palaearctic_salt_desert',
        baseTerrain: 'pal1', // 干裂沙（龟裂盐渍地）
        groundTiles: ['pal1', 'pal', 'des', 'ds4'],
        forestFloorTiles: ['pal1', 'pal'],
        trees: ['DEAD_TREE'], // 盐漠无植被，边缘偶有枯树
        flatDecor: ['PLANT_DEAD', 'DECAL_CRACK', 'DECAL_CRATER', 'ANIMAL_SKELETON'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2'],
        waterPlants: ['REEDS'],
        beachTerrain: 'bc3',
    },
    palaearctic_europe_taiga: {
        id: 'palaearctic_europe_taiga',
        // 🔴 [2026-08-23 DE化] 底色换纯净枯草 gr7；原 underbrush_leaves（枯叶碎片预混）改当副色斑块
        baseTerrain: 'gr7',
        groundTiles: ['gr2', 'gr4', 'for', 'grs', 'pc1', 'pc2', 'rock_wet'],
        forestFloorTiles: ['for', 'pc1', 'pc2', 'snf', 'underbrush_leaves'],
        trees: ['DEAD_TREE', 'PINE'],
        autumnTrees: ['DEAD_TREE', 'PINE', 'AUTUMN_OAK'],
        winterTrees: ['SNOW_PINE', 'ASIAN_PINE', 'SNOW_AUTUMN_OAK', 'DEAD_TREE'],
        // 🔴 [2026-08-21 素材科学审查] flat 的 STUMP_GENERIC（实体树桩）挪到 solid——平面装饰层放
        //    枯植/干草更符合寒带针叶林（苔藓地衣/枯枝落叶，DE taiga 下层）
        flatDecor: ['SHRUB_GREEN', 'PLANT_DEAD', 'GRASS_DRY_PATCH'],
        solidDecor: ['ROCK1', 'ROCK2', 'STUMP_GENERIC', 'GRAVES'],
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
        solidDecor: ['ROCK1', 'ROCK2', 'STUMP_GENERIC', 'GRAVES'],
        waterPlants: ['REEDS', 'WILLOW', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_mediterranean: {
        id: 'palaearctic_europe_mediterranean',
        // 🔴 [2026-08-23 清账] gr3(花枯混杂)→gr7(纯枯草)，地中海夏旱
        baseTerrain: 'gr7',
        groundTiles: ['gr7', 'pm1', 'pc3', 'pc1', 'ds3'],
        forestFloorTiles: ['for', 'pc1', 'underbrush_leaves'],
        trees: ['OLIVE', 'ITALIAN_PINE'],
        winterTrees: ['OLIVE', 'ITALIAN_PINE'],
        // 🔴 [2026-08-21 素材科学审查] STUMP 挪 solid；地中海 flat = 花/灌木/枯植（地中海夏旱，枯植点缀）
        flatDecor: ['FLOWER', 'SHRUB_GREEN', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 秋季桃叶落叶（DE FALLEN_LEAVES_PEACH——地中海桃树）
        autumnFlatDecor: ['FALLEN_LEAVES_PEACH', 'FLOWER', 'SHRUB_GREEN'],
        // 🔴 [2026-08-21 素材全覆盖] 地中海商港木桶/地毯（腓尼基/威尼斯商栈）+ 海滩 bc4
        solidDecor: ['ROCK1', 'ROCK2', 'STUMP_GENERIC', 'BARRELS', 'RUGS', 'GRAVES'],
        waterPlants: ['REEDS', 'OLIVE', 'WATER_LILY'],
        beachTerrain: 'bc4',
    },
    australasian_temperate: {
        id: 'australasian_temperate',
        // 🔴 [2026-08-23 清账] gr7(枯黄)→gr2(纯绿草)，澳洲东南湿润森林
        baseTerrain: 'gr2',
        // 🔴 [2026-08-21 素材科学审查] 去 ds3/ds5（干旱土）——澳洲东南（悉尼/墨尔本）是湿润温带森林
        groundTiles: ['gr4', 'gr7', 'for', 'gr9'], // 移除 gr6(丛林草)——澳洲东南温带森林无丛林草
        forestFloorTiles: ['for', 'underbrush_leaves'],
        // 🔴 [2026-08-23 按现实修复] 澳洲东南温带（悉尼/墨尔本）= 桉树/金合欢(wattle)林；蜡棕榈(WAX_PALM)=南美安第斯东坡树，勿用。DE 无桉树，取澳洲标志性金合欢 ACACIA
        trees: ['ACACIA'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'ROCK2'],
        waterPlants: ['REEDS', 'MANGROVE', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    serengeti: {
        id: 'serengeti',
        baseTerrain: 'ds3',
        // 🔴 [2026-08-21 素材全覆盖] 沙漠纯金沙 snd 入塞伦盖蒂干草与沙化区域
        // 🔴 [2026-08-23 清账] 移除 snd（雪地基，误入塞伦盖蒂）——归雪地类（§2.4.1）
        groundTiles: ['gr5', 'rd1', 'rd2', 'ds5', 'des', 'grs', 'gr2', 'gr3'],
        forestFloorTiles: ['gr5', 'ds4'],
        trees: ['ACACIA', 'BAOBAB'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 古战场遗骸（骸骨/墓碑）——非洲草原战场
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE', 'SKELETON', 'ANIMAL_SKELETON'],
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
        trees: ['PINE'], // 🔴 [2026-08-23 按现实修复] 伊朗高原内陆=干燥大陆性，树少仅1种；PINE=厄尔布尔士/扎格罗斯高山松（无橄榄/无枯树第二树种）
        autumnTrees: ['DEAD_TREE'],
        winterTrees: ['SNOW_PINE'],
        // 🔴 [2026-08-21 素材全覆盖] DECAL_CRACK 干裂地 + 商旅地毯/古墓（高原丝路）
        flatDecor: ['GRASS_DRY', 'PLANT_DEAD', 'WEED', 'SHRUB_GREEN', 'DECAL_CRACK'],
        solidDecor: ['ROCK1', 'ROCK2', 'RUGS', 'ROCK3'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_steppe: {
        id: 'palaearctic_asia_steppe',
        // 🔴 [2026-08-23 清账] pm2(荒废牧场黄土)→gr7(纯枯草)，蒙古草原
        baseTerrain: 'gr7',
        // 🔴 [2026-08-21 素材全覆盖] 碎石与冷岩 sr2 入塞外干草原
        groundTiles: ['gr4', 'ds3', 'pm1', 'ds5', 'sr2'],
        forestFloorTiles: ['ds3', 'for'],
        trees: ['DEAD_TREE'], // 🔴 [2026-08-23 按现实修复] 温带草原(steppe)无树，松树勿作主树（蒙古高原草原+戈壁，树极少，仅河谷有树）
        autumnTrees: ['DEAD_TREE'],
        winterTrees: ['DEAD_TREE'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'WEED', 'PLANT_DEAD'],
        // 🔴 [2026-08-21 素材全覆盖] 古战场遗迹（草原石墓/骸骨）——游牧战场
        solidDecor: ['ROCK1', 'ROCK2', 'ANIMAL_SKELETON', 'SKELETON'],
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
        solidDecor: ['ROCK1', 'ROCK2', 'ROCK3', 'ANIMAL_SKELETON'],
        waterPlants: ['REEDS', 'WATER_LILY'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_desert: {
        id: 'palaearctic_asia_desert',
        baseTerrain: 'ds2', // 经典干燥戈壁黄土沙原
        // 🔴 [2026-08-23 清账] 移除 snd（雪地基，误入亚洲沙漠）——归雪地类（§2.4.1）
        groundTiles: ['des', 'ds2', 'ds3', 'ds5', 'rck', 'qs'],
        forestFloorTiles: ['ds2', 'ds3', 'for'],
        trees: ['DEAD_TREE'], // 戈壁极旱荒漠：仅枯树1种（树木极少地区，不配第二树种）
        autumnTrees: ['DEAD_TREE'],
        winterTrees: ['DEAD_TREE'],
        flatDecor: ['PLANT_DEAD', 'ANIMAL_SKELETON', 'DECAL_CRACK', 'GRASS_DRY_PATCH', 'WEED'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK1', 'ROCK2', 'BARRELS', 'RUGS', 'SKELETON'],
        waterPlants: ['REEDS', 'DEAD_TREE', 'WATER_LILY'],
        beachTerrain: 'bc3',
    },
    // 🔴 [2026-08-21 补全·DE Swamp biome] 沼泽湿地主题（全球低洼湿地通用）：
    //   DE 沼泽 = 棕/绿水 + 湿泥地 + 芦苇/睡莲 + 枯树柳树 + 湿滩边缘 + 潮湿岩石 rock_wet。素材全来自 DE：
    //   wt_brown/wt_green/wt_yellow（棕绿黄水）、gravel_wet/r01（湿泥）、beach_wet（湿滩）、
    //   REEDS/WATER_LILY/WILLOW/DEAD_TREE（水岸植物）。
    palustrine_swamp: {
        id: 'palustrine_swamp',
        // 🔴 [2026-08-23 清账] gravel_wet(湿砾石滩)→qs2(沼泽泥)
        baseTerrain: 'qs2',
        // 🔴 [2026-08-21 素材全覆盖] qs2 流沙 + rock_wet 湿润岩石入沼泽地面
        groundTiles: ['wt_brown', 'wt_green', 'r01', 'gravel_wet', 'qs2', 'rock_wet', 'sh4'], // sh4=沼泽浅水搭配湿地
        forestFloorTiles: ['r01', 'underbrush_leaves'],
        trees: ['DEAD_TREE', 'WILLOW'],
        flatDecor: ['GRASS_GREEN_PATCH', 'UNDERBRUSH', 'WEED'],
        solidDecor: ['STUMP_GENERIC', 'ROCK1', 'ROCK2'],
        waterPlants: ['REEDS', 'WATER_LILY', 'WILLOW'],
        beachTerrain: 'beach_wet',
    },
};


/**
 * 这里冬天积不积雪。
 *
 * 🔴 [2026-08-24] **有经度就查真实气候数据**（world-base 的冬季标志，来自 WorldClim 实测气温），
 *    和底图同源，一处真相。
 *
 *    旧的纯纬度估算对「温带中高纬」一律返回 true，于是**罗得岛、克里特岛(诺索斯)、
 *    底比斯这些爱琴海城冬天结了冰**——地中海从不结冰，是硬伤。
 *    那套估算只在拿不到经度（单测/兜底）时才用。
 */
export function isSnowArea(
    lat: number,
    elev: number | null,
    biome: Biome,
    lng?: number,
): boolean {
    if (lng !== undefined) {
        const flag = queryWinterSnow(lat, lng);
        if (flag !== null) return flag > 0;
    }
    // ── 以下是拿不到气候数据时的兜底估算，不要拿它当判据本身 ──
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
        // 🔴 [2026-08-23 新增·真实地理] 伊朗龟裂盐漠：大盐漠 Dasht-e Kavir（卡维尔 lng52~58 lat33~36）
        //    + 卢特沙漠 Dasht-e Lut（lng57~60 lat29~32）→ pal1 干裂沙（playa 干涸盐渍地）
        const inKavir = lng >= 52 && lng < 58 && lat >= 33 && lat < 36;
        const inLut = lng >= 57 && lng < 60 && lat >= 29 && lat < 32;
        if (biome === 'desert' && (inKavir || inLut)) return DE_MAP_THEMES.palaearctic_salt_desert;
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
    // 🔴 [2026-08-23 新增·真实地理] 突尼斯杰里德盐沼 Chott el Djerid（lng8~10 lat33~34）→ pal1 干裂沙
    if (biome === 'desert' && lng >= 8 && lng < 10 && lat >= 33 && lat < 34) return DE_MAP_THEMES.palaearctic_salt_desert;
    if (biome === 'desert') return DE_MAP_THEMES.palaearctic_middle_east_desert;
    if (biome === 'mediterranean') return DE_MAP_THEMES.palaearctic_europe_mediterranean;
    // 🔴 [2026-08-21 全面检查·补 gap] cold_steppe（温带半干旱草原：BSk/Dsa/Dsb——中亚草原/北美大平原/
    //    马德里高原/巴塔哥尼亚）→ 草原主题。原落默认 europe_temperate（温带绿），马德里半干旱高原出绿草地（违和）。
    if (biome === 'cold_steppe') return DE_MAP_THEMES.palaearctic_asia_steppe;
    // 🔴 [2026-08-21 补全·Swamp] 内陆水域（lake）+ 低地（<200m）→ 沼泽主题，优先于寒带针叶林：
    //   东北松嫩/三江湿地（boreal）、北欧波罗的海沿岸、中欧低地、洞庭湖边——低洼湿地就是沼泽观感。
    //   只认 lake 不认 sea——海边（东京湾/大连）是海岸战场不是沼泽。
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

/**
 * 🔴 [2026-08-23 主人定] 攻城战地面按「地区/气候」分档（不再全部塌成一种泥，越南/北方/饶乐水各归各的）：
 *   沙漠→des(泥土1) / 枯草区(地中海·苔原)→ds2(泥土2) / 绿一点(温带草原·森林)→ds3(泥土3)
 *   / 红土(热带)→ds4(泥土4) / 黑土淤泥(沼泽·泰加)→gr4(污泥) / 草原文化→牧场 / 稀树草原→gr5(萨凡纳土)。
 *   主题(坐标带)优先于 biome(Köppen)：越南等「主题热带但 Köppen 温带」的据点按主题→红土。
 *   每档 variations 用「本档 + 相邻档」做地面变体，6 张泥地全用上、分布尽量平均。
 */
function siegeSoil(theme: DeMapThemePalette, biome: Biome): { base: string; variations: readonly string[] } {
    const t = theme.id;
    // ── 主题（坐标带）优先 ──
    if (t === 'indomalayan_tropical' || t === 'afrotropical_tropical' || t === 'neotropical_tropical') {
        return { base: 'ds4', variations: ['ds4', 'gr4'] }; // 热带红壤 + 湿泥
    }
    if (t === 'palustrine_swamp') {
        return { base: 'gr4', variations: ['gr4', 'ds4'] }; // 沼泽黑土淤泥 + 湿红壤
    }
    if (t === 'serengeti') {
        return { base: 'gr5', variations: ['gr5', 'ds2', 'des'] }; // 稀树草原 + 干土沙尘
    }
    if (t === 'palaearctic_asia_steppe') {
        return { base: 'pm1', variations: ['pm1', 'pc1', 'pc2', 'pc3', 'pm2'] }; // 草原牧场（牧场家族）
    }
    if (t === 'palaearctic_asia_desert' || t === 'palaearctic_middle_east_desert' || t === 'palaearctic_salt_desert') {
        return { base: 'des', variations: ['des', 'ds2'] }; // 沙漠 + 半干土
    }
    if (t === 'palaearctic_europe_mediterranean' || t === 'palaearctic_middle_east_highland') {
        return { base: 'ds2', variations: ['ds2', 'des'] }; // 地中海夏旱枯草 + 干土
    }
    if (t === 'palaearctic_europe_taiga') {
        return { base: 'gr4', variations: ['gr4', 'ds3'] }; // 泰加针叶林（暗色湿冷土）
    }
    if (t === 'palaearctic_tibetan_plateau') {
        return { base: 'ds2', variations: ['ds2', 'gr4'] }; // 高寒枯草 + 冻土
    }
    // ── 其余按 biome（气候植被梯度） ──
    switch (biome) {
        case 'desert':             return { base: 'des', variations: ['des', 'ds2'] };
        case 'cold_steppe':        return { base: 'pm1', variations: ['pm1', 'pc1', 'pc2', 'pc3', 'pm2'] };
        case 'mediterranean':      return { base: 'ds2', variations: ['ds2', 'des'] };
        case 'tundra_snow':        return { base: 'ds2', variations: ['ds2', 'gr4'] };
        case 'savanna':            return { base: 'gr5', variations: ['gr5', 'ds2'] };
        case 'temperate_grass':    return { base: 'ds3', variations: ['ds3', 'ds2'] };
        case 'temperate_forest':   return { base: 'ds3', variations: ['ds3', 'ds2'] };
        case 'tropical_rainforest': return { base: 'ds4', variations: ['ds4', 'gr4'] };
        case 'boreal':             return { base: 'gr4', variations: ['gr4', 'ds3'] };
        default:                   return { base: 'ds3', variations: ['ds3', 'ds2'] };
    }
}

/** 攻城战单张底色：湿地(沼泽泥 qs2)→污泥，其余走 siegeSoil 的 biome/主题分档。 */
function siegeGround(tile: string, biome: Biome, theme: DeMapThemePalette, isSiege: boolean): string {
    if (!isSiege) return tile;
    // 湿地/沼泽泥（qs2 Swamp Bogland）→ 污泥
    if (tile === 'qs2') return 'gr4';
    return siegeSoil(theme, biome).base;
}

/**
 * 🔴 [2026-08-24 主人定·分层原则] **底图只能是纯地表材质**。
 *
 *   第一层（底图）= 草 / 土 / 沙 / 砾石 / 牧场 / 农田 / 路 / 雪 / 冰 / 水
 *   第二层（组合）= 树 / 花草 / 灌木 —— **森林就是树的组合，不是一种地面**
 *
 * 禁止把 for(Underbrush 灌木丛)、fo2(Rainforest)、underbrush_leaves(落叶层)、
 * snf(Snow Forest) 这些**森林地形**贴图当底图返回。
 * 它们在 DE 里是不可通行的树林，铺满全场等于整张图都是林子。
 * 曾经 6 个主题的底图就是这么选出来的（见 git history）。
 */
export function terrainForTheme(
    theme: DeMapThemePalette,
    biome: Biome,
    season: 0 | 1 | 2,
    elevationBand: ElevationBand,
    lat: number = 35,
    elev: number | null = null,
    isSiege: boolean = false,
    lng?: number,
): string {
    // 1. 终年积雪雪峰 / 冰川（>4800m 或达到极高纬度真实雪线）
    // 🔴 [2026-08-23 第6层冰雪地带 9 块定稿] 雪线以上地表全是雪（真实世界）：
    //    极地/苔原（tundra_snow）冬季出冰原 ice，其余 biome 一律深雪 sno
    //    （沙漠高山雪峰天山/祁连、地中海阿尔卑斯、草原阿尔泰、温带落基山、寒带针叶林雪原）。
    if (elevationBand === 'snow') {
        // 🔴 [2026-08-23 攻防/野战区分] 冬季：攻防战城郭=踩实雪地基 snd；野战=极地冰原 ice / 其余深雪 sno
        if (season === 2 && isSiege) return 'snd';
        return biome === 'tundra_snow' && season === 2 ? 'ice' : 'sno';
    }

    // 2. 极高山石原与高寒冻土（4000m - 5200m）
    // 🔴 [2026-08-23 第5层高寒地带 9 块定稿·真实地理] 高寒带真实=石漠+冻土草甸：
    //    高寒草原（冷草原 cold_steppe / 苔原 tundra_snow）→ pm2 冻土草甸（蒙古/中亚/青藏）；
    //    其余（赤道高山/东非/沙漠）→ rck 石漠；冬季攻防 snd / 野战 sno。
    if (elevationBand === 'high_alpine') {
        if (season === 2) return isSiege ? 'snd' : 'sno';
        // 🔴 [2026-08-23 主人定] rck 岩石是配属图（裸岩斑块点缀），不当底色；高寒石漠底色用砾石 gravel_default
        return (biome === 'tundra_snow' || biome === 'cold_steppe') ? 'pm2' : 'gravel_default';
    }

    // 3. 高山草甸与戈壁砾石原（2500m - 4000m）
    // 🔴 [2026-08-23 第4层高山地带 9 块定稿·草地类] 树线以上自然高山草甸（非人工牧场）：
    //    湿润带 → gr2 纯绿草（赤道 páramo/东非 afro-alpine/湿润温带草原/阿尔卑斯落基山）；
    //    干旱带 → gr7 纯枯草（帕米尔荒漠/地中海夏旱/蒙古半干旱/针叶林树线/高寒苔原）。
    if (elevationBand === 'alpine') {
        if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
            return isSiege ? 'snd' : 'sno';
        }
        const wetAlpine =
            biome === 'tropical_rainforest' ||
            biome === 'savanna' ||
            biome === 'temperate_grass' ||
            biome === 'temperate_forest';
        return siegeGround(wetAlpine ? 'gr2' : 'gr7', biome, theme, isSiege);
    }

    // 4. 中山地带（1000m - 2500m）
    // 🔴 [2026-08-23 第3层中山地带 9 块定稿·真实地貌] 山地森林/黄土高原/稀树草原：
    //    森林带（成片树木，林下腐殖土）：雨林 fo2 / 温带森林 for / 针叶林 underbrush_leaves；
    //    草原带：温带草原 gr2 / 稀树草原 gr5 / 冷草原 gr7；
    //    荒漠带：沙漠 ds5 / 地中海 gr7 / 苔原 gr7。
    if (elevationBand === 'mountain') {
        if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
            return isSiege ? 'snd' : 'sno';
        }
        switch (biome) {
            case 'tropical_rainforest': return 'gr6';      // 丛林草（Jungle Grass）
            case 'temperate_forest':    return 'gr3';      // 温带草地
            case 'boreal':              return 'gr7';      // 寒温带干草
            case 'temperate_grass':     return siegeGround('gr2', biome, theme, isSiege);      // 绿草
            case 'savanna':             return 'gr5';      // 萨凡纳土
            case 'cold_steppe':         return siegeGround('gr7', biome, theme, isSiege);      // 枯草（蒙古黄土）→牧场
            case 'desert':              return siegeGround('ds5', biome, theme, isSiege);      // 沙漠砾石→攻城泥土1
            case 'mediterranean':       return siegeGround('gr7', biome, theme, isSiege);      // 枯草（夏旱）
            case 'tundra_snow':         return siegeGround('gr7', biome, theme, isSiege);      // 枯草（高寒）
            default:                    return theme.baseTerrain;
        }
    }

    // 4.5 丘陵高地（400m - 1000m）
    // 🔴 [2026-08-23 第2层丘陵高地 9 块定稿·真实地貌] 丘陵/山麓/台地（农牧过渡带）：
    //    森林带同中山（林底图）；草原带同中山；沙漠 biome 用 pal 干沙（低海拔=沙丘，非砾石戈壁）。
    if (elevationBand === 'upland') {
        if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
            return isSiege ? 'snd' : 'sno';
        }
        switch (biome) {
            case 'tropical_rainforest': return 'gr6';      // 低山丛林草
            case 'temperate_forest':    return 'gr3';      // 丘陵温带草地
            case 'boreal':              return 'gr7';      // 丘陵寒温带干草
            case 'savanna':             return 'gr5';      // 稀树草原土
            case 'temperate_grass':     return siegeGround('gr2', biome, theme, isSiege);      // 绿草
            case 'cold_steppe':         return siegeGround('gr7', biome, theme, isSiege);      // 枯草→牧场
            case 'desert':              return siegeGround('pal', biome, theme, isSiege);      // 干沙（低海拔沙丘）→攻城泥土1
            case 'mediterranean':       return siegeGround('gr7', biome, theme, isSiege);      // 枯草（夏旱）
            case 'tundra_snow':         return siegeGround('gr7', biome, theme, isSiege);      // 枯草（高寒）
            default:                    return theme.baseTerrain;
        }
    }

    // 5. 🔴 [2026-08-22 主人定] 冬季降雪地表：
    //    - 攻防战（isSiege）：城郭周围车马践踏，踩实成雪地基 snd（不是雪灌木 snf）；
    //    - 野战（野战遭遇战）：野外茫茫雪原，全量保留 DE 纯正大自然白雪深雪 (sno / sn2)。
    if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
        if (isSiege) {
            return 'snd'; // 🔴 [2026-08-23 主人改] 攻城战=雪地基 snd（Snow Foundation 踩实雪），不是 snf 雪灌木
        }
        if (biome === 'tundra_snow') {
            return 'ic3'; // 极地苔原野战：薄冰/软冰冻原（冰原边缘）
        }
        return 'sno'; // 其余野战：茫茫纯雪深雪
    }

    // 6. 基础地表
    return siegeGround(theme.baseTerrain, biome, theme, isSiege);
}

export function treesForTheme(
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    elevationBand: ElevationBand,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
    lng?: number,
): readonly string[] {
    // 🔴 [2026-08-23 按现实修复] 树线以上无乔木：高山/高寒/冰雪带（alpine/high_alpine/snow）→ 只枯树点缀。
    //    青藏高原 3500m+ 高寒草甸/荒漠、阿尔卑斯/喜马拉雅树线上——真实世界乔木极少/无，绝不给松树/枫树做森林。
    if (elevationBand === 'snow' || elevationBand === 'high_alpine' || elevationBand === 'alpine') return ['DEAD_TREE'];
    if (season === 2 && isSnowArea(lat, elev, biome, lng) && theme.winterTrees?.length) return theme.winterTrees;
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
    lng?: number,
): readonly string[] {
    if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
        if (isSiege) {
            // 🔴 [2026-08-23 主人改] 攻城战=雪地基 snd 为主 + 浅雪 sn2 + 雪灌木 snf（纯雪系；去掉 gr4 污泥/pm1 牧场/ds5 沙漠砾石这些非雪素材）
            return ['snd', 'sn2', 'snf'];
        }
        // 野战：纯正大自然雪原组合（深雪 sno + 浅雪 sn2 + 林雪 snf + 冰面 ice）
        return ['sno', 'sn2', 'snf', 'ice'];
    }
    // 🔴 [2026-08-23 主人定] 攻城战地面变体按「地区/气候」分档（与 siegeSoil 同一份映射）：每档本档 + 相邻档做变体
    if (isSiege) {
        return siegeSoil(theme, biome).variations;
    }
    return theme.groundTiles;
}

export function forestFloorTilesForTheme(
    theme: DeMapThemePalette,
    biome: Biome,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
    lng?: number,
): readonly string[] {
    if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
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
    lng?: number,
): { flat: readonly string[]; solid: readonly string[] } {
    if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
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

// 🔴 [2026-08-23 P2 多色系咬合] 副色系表（学 DE create_terrain 多层地貌咬合）
//    DE：base_terrain 草 + create_terrain 土(18%) + create_terrain 沙(6%) → 不同色系互相咬合
//    我们：每个 biome 主色 + 1~2 个副色系，weight 按 land_percent 换算（副色系≈18% / 9%）
export const SECONDARY_TERRAINS: Record<Biome, ReadonlyArray<{ tile: string; weight: number }>> = {
    tropical_rainforest: [{ tile: 'gr4', weight: 1.0 }, { tile: 'gr6', weight: 0.5 }], // 雨林：腐殖土泥 + 丛林草
    savanna:            [{ tile: 'ds4', weight: 1.0 }, { tile: 'gr7', weight: 0.5 }], // 稀树草原：泥地 + 枯草
    desert:             [{ tile: 'ds5', weight: 1.0 }, { tile: 'ds4', weight: 0.5 }], // 沙漠：砾石 + 泥地
    mediterranean:      [{ tile: 'ds4', weight: 1.0 }, { tile: 'ds3', weight: 0.5 }], // 地中海：泥地 + 土
    // 🔴 [2026-08-24] 冷草原副色去掉 ds5 戈壁砾石：蒙古/中亚草原的地面变化主要是
    //    草的疏密（绿→黄），不是凭空一块石头地。沙漠(ds5)和苔原(gravel)保留——那里砾石是真地貌。
    cold_steppe:        [{ tile: 'ds3', weight: 1.0 }, { tile: 'gr7', weight: 0.5 }], // 冷草原：土 + 枯草
    temperate_grass:    [{ tile: 'ds3', weight: 1.0 }, { tile: 'ds2', weight: 0.5 }], // 温带草原：土 + 沙
    temperate_forest:   [{ tile: 'gr4', weight: 1.0 }, { tile: 'ds3', weight: 0.5 }], // 温带森林：腐殖土 + 泥地
    boreal:             [{ tile: 'gr4', weight: 1.0 }, { tile: 'ds3', weight: 0.5 }], // 针叶林：腐殖土 + 泥地
    tundra_snow:        [{ tile: 'gr4', weight: 1.0 }, { tile: 'gravel_default', weight: 0.5 }], // 苔原：泥地 + 砾石
};

export function waterTerrainForTheme(
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
    lng?: number,
): string {
    // 1. 冬季雪区 / 苔原：结冰
    if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
        return biome === 'tundra_snow' ? 'ic2' : 'wt2'; // 极地冻原湖冬季结冰=可航冰 ic2 / 一般冬季寒冰水 wt2
    }
    if (biome === 'tundra_snow') {
        return 'wt2'; // 极地夏季融水（寒冰水）
    }
    // 2. 寒带针叶林（泰加）：深湖深蓝黑水 (wt4，贝加尔湖/北欧深湖)
    if (biome === 'boreal') {
        return 'wt4';
    }
    // 3. 华南 / 东南亚 / 非洲热带雨林水乡：DE 经典清澈碧绿翡翠水 (river_clean_green)
    if (
        theme.id === 'indomalayan_tropical' ||
        theme.id === 'afrotropical_tropical' ||
        theme.id === 'neotropical_tropical'
    ) {
        return 'river_clean_green';
    }
    // 4. 低洼内陆沼泽 / 湿地：暗绿水苔泥沼 (wt6)
    if (theme.id === 'palustrine_swamp') {
        return 'wt6';
    }
    // 5. 沙漠：高含沙深黄水（塔里木河/尼罗河/沙漠绿洲河）
    if (biome === 'desert') {
        return 'wt_yellow2';
    }
    // 6. 地中海：清澈蔚蓝海水色 (wt5)
    if (biome === 'mediterranean') {
        return 'wt5';
    }
    // 7. 冷草原：含沙浅黄水（草原河流含沙）
    if (biome === 'cold_steppe') {
        return 'wt_yellow';
    }
    // 8. 稀树草原：浑浊棕水（旱季浊水）
    if (biome === 'savanna') {
        return 'wt_brown';
    }
    // 9. 温带草原：富营养绿水（藻类繁盛）
    if (biome === 'temperate_grass') {
        return 'wt_green';
    }
    // 10. 温带森林：中水 (wt3)
    if (biome === 'temperate_forest') {
        return 'wt3';
    }
    // 11. 默认：清澈浅蓝江水 (wtr)
    return 'wtr';
}

export function beachTerrainForTheme(
    theme: DeMapThemePalette,
    season: 0 | 1 | 2,
    lat: number = 35,
    elev: number | null = null,
    biome: Biome = 'temperate_forest',
    lng?: number,
): string {
    if (season === 2 && isSnowArea(lat, elev, biome, lng)) {
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
