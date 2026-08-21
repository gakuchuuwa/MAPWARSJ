# DE 战斗地图素材分类总表（2026-08-21，按 AoE2 DE 官方体系）

> 依据：DE 素材命名（n_tree_*/n_plant_*/n_rock_*/n_cliff_*/n_decal_*/n_mountain_*）、
> 官方 rms 对象组（AESTHETIC_FLAT 平面 / AESTHETIC_SCATTER 散落 / SOLID_OBJECT 实体 /
> FALLEN_TREE 倒地 / STUMP_OBJECT 树桩 / SEA_ROCKS 海岩 / GRAVE/SKELETON 战场物）、
> 官方地图表现（Serengeti=金合欢/猴面包树、Amazon=雨林/巴西木、Arabia=棕榈/仙人掌、
> Baltic=松/桦、Mediterranean=橄榄/柏、高山=雪松/枯树）。
> 素材库：`public/SUCAI_NATURE/`（119 个目录，每目录 frames.png + frames.pc.png + _meta.json）。

## 一、树（n_tree_*，按生物群系归属 —— 严禁跨区串用）

| 群系 | 树（DE 名 → SUCAI） | 官方依据 |
|------|---------------------|---------|
| 温带（欧/北美/东亚） | OAK / GREEN_OAK / BIRCH_GREEN / BIRCH_AUTUMN / BIRCH_WINTER / ASIAN_MAPLE_GREEN / ASIAN_MAPLE_AUTUMN / PEACH_BLOSSOM | Black Forest / Baltic / 亚洲地图 |
| 寒带针叶林（泰加/雪） | PINE / ASIAN_PINE / SNOW_PINE / SNOW_AUTUMN_OAK / DEAD_TREE | 高山/雪地地图 |
| 地中海 | OLIVE / CYPRESS / CYPRESS_DEC / ITALIAN_PINE | Mediterranean 地图 |
| 沙漠/干热 | PALM / DEAD_TREE | Arabia / Atacama |
| 热带雨林（非洲/南美/东南亚） | JUNGLE / RAINFOREST / BRAZILWOOD / BAMBOO / LUSH_BAMBOO | Amazon / 雨林地图 |
| 非洲稀树草原 | ACACIA / BAOBAB | Serengeti 地图 |
| 也门/索科特拉（干热岩岛） | DRAGON_TREE | 阿拉伯半岛南端 |
| 南美温带 | MONKEY_PUZZLE（智利南洋杉） | 南美温带 |
| 热带海岸/红树林/湿地 | MANGROVE / WILLOW / REEDS | 海岸/沼泽地图 |
| 大洋洲/热带棕榈 | WAX_PALM | 太平洋/热带 |

**主树铁律**：主树必须是上表「群系专属树」；BUSH_TREE_A/B/C 是**灌木树（下层植被）**，
可作森林下层混入，**禁止当主树**（palaearctic_asia_temperate 曾把 BUSH_TREE_B 当主树 = 张冠李戴）。

## 二、灌木/树丛（下层植被）

BUSH_GREEN（绿灌木）、SHRUB_GREEN（绿丛）、BUSH_TREE_A / B / C（灌木树）、PLANT（通用植物）。

## 三、平面装饰 flat（贴地，AESTHETIC_FLAT 系）

| 类 | 素材 |
|----|------|
| 草 | GRASS_GREEN / GRASS_GREEN_PATCH / GRASS_DRY / GRASS_DRY_PATCH |
| 花 | FLOWER / FLOWER_1 / FLOWER_2 / FLOWER_3 / FLOWER_4 / FLOWERBED |
| 杂草/枯植 | WEED / PLANT_DEAD |
| 蕨/丛林下层 | FERNPATCH / PLANT_JUNGLE / PLANT_RAINFOREST / UNDERBRUSH / UNDERBRUSH_JUNGLE / UNDERBRUSH_RAINFOREST |
| 落叶贴花 | FALLEN_LEAVES_MAPLE_AUTUMN / FALLEN_LEAVES_MAPLE_RED / FALLEN_LEAVES_PEACH |
| 地面贴花 | DECAL_PATH_1 / DECAL_PATH_2 / DECAL_PATH_3 / DECAL_PATH_4 / DECAL_CRACK / DECAL_CRATER / DECAL_ICE |

**归属铁律**：仙人掌 CACTUS、枯草 PLANT_DEAD、骷髅 SKELETON/ANIMAL_SKELETON = **沙漠/干地专属**，
**禁止**放进热带雨林（afrotropical 曾放 CACTUS+ANIMAL_SKELETON = 张冠李戴）。

## 四、实体装饰 solid（SOLID_OBJECT 系）

| 类 | 素材 |
|----|------|
| 岩石（通用） | ROCK1 / ROCK2 / ROCK3 |
| 岩组 | ROCK_FORMATION1 / ROCK_FORMATION2 / ROCK_FORMATION3 |
| 特殊岩 | ROCK_JUNGLE（雨林）/ ROCK_LIMESTONE（石灰岩·非洲/干旱区）/ ROCK_PILLAR（石柱） |
| 海岩/滩岩 | ROCK_SEA1 / ROCK_SEA2 / ROCK_BEACH |

## 五、悬崖 / 山（地貌）

| 类 | 素材 |
|----|------|
| 悬崖（大） | CLIFF_DEFAULT（普通）/ CLIFF_LIMESTONE（石灰岩）/ CLIFF_SAND（砂岩）/ CLIFF_SNOW（雪）/ CLIFF_TERRACE（梯田）/ CLIFF_MARBLE（大理石） |
| 矮悬崖（新提取） | SHORT_CLIFF_ALL / SHORT_CLIFF_MARBLE / SHORT_CLIFF_SAND / SHORT_CLIFF_SNOW |
| 山体 | MOUNTAIN_01 ~ MOUNTAIN_11 |

## 六、倒地 / 树桩（FALLEN_TREE / STUMP_OBJECT 系）

| 素材 | 归属 biome |
|------|-----------|
| FELLED_GENERIC / STUMP_GENERIC | 通用（温带/寒带） |
| FELLED_BAMBOO / STUMP_BAMBOO（新） | 东南亚/印度（竹林） |
| FELLED_BAOBAB / STUMP_BAOBAB（新） | 非洲稀树草原 |
| FELLED_LUSH_BAMBOO / STUMP_LUSH_BAMBOO（新） | 热带茂竹 |

## 七、水面（water）

| 素材 | 说明 |
|------|------|
| REEDS | 芦苇（通用水岸） |
| WATER_LILY（新提取） | 睡莲/荷叶（**静水面专属**：湖/河湾/池塘，禁止放海浪区） |
| OYSTERS | 牡蛎（海岸） |
| MANGROVE | 红树（热带海岸） |
| ROCK_SEA1 / ROCK_SEA2 / ROCK_BEACH | 海岩/滩岩 |

## 八、资源点（战场点缀）

MINE_GOLD / MINE_STONE（金/石矿）、FORAGE_BUSH / FORAGE_FRUIT / FORAGE_PAPAYA / FORAGE_PINEAPPLE（果丛）。

## 九、战场杂项（CX 新提取）

SKELETON（人骨）、ANIMAL_SKELETON（兽骨）、GRAVES（坟墓）、BARRELS（木桶）、RUGS（地毯）。
**归属**：骷髅/坟墓 = 干地/战场残骸（沙漠/稀树草原/战后场景）；木桶/地毯 = 营地/港口。

## 十、季节三套（树）

- 绿季：GREEN_OAK / BIRCH_GREEN / ASIAN_MAPLE_GREEN / PINE / MONKEY_PUZZLE …
- 秋季：AUTUMN_OAK / BIRCH_AUTUMN / ASIAN_MAPLE_AUTUMN / FALLEN_LEAVES_*
- 冬季：SNOW_PINE / SNOW_AUTUMN_OAK / BIRCH_WINTER / DEAD_TREE / DECAL_ICE

---

## 已发现并修正的张冠李戴（DE_MAP_THEMES 12 主题）

| 主题 | 原配置 | 问题 | 修正 |
|------|--------|------|------|
| afrotropical_tropical（非洲热带） | trees=[DRAGON_TREE]；flat=[PLANT_DEAD,CACTUS,ANIMAL_SKELETON] | 龙血树是也门/索科特拉非非洲雨林；仙人掌/骷髅是沙漠物，雨林里出现 = 张冠李戴 | trees=[JUNGLE,RAINFOREST]；flat=[FERNPATCH,PLANT_RAINFOREST,UNDERBRUSH_RAINFOREST] |
| palaearctic_asia_temperate（亚洲温带） | trees=[BUSH_TREE_B] | 灌木树当主树 = 张冠李戴 | trees=[ASIAN_MAPLE_GREEN,ASIAN_PINE]；autumn=[ASIAN_MAPLE_AUTUMN]；winter=[DEAD_TREE,SNOW_PINE] |
| australasian_temperate（澳大拉西亚） | trees=[BIRCH_GREEN] | 桦树是北半球树种，澳洲无桦树林；DE 无澳洲专属树 | ⚠️ 需主人裁定（候选：WAX_PALM 热带棕榈 / 保持 BIRCH） |

## 待接线（新提取 14 个 → 白名单/主题）

- `Scene13EnvironmentGenerator.ts` 白名单（主人编辑中，未动）：DE_TREE_OBJECTS / GROUND_COVER_ASSETS /
  DE_HALF_TILE_OBJECTS 需加入 BUSH_TREE_C、FELLED_BAMBOO/BAOBAB/LUSH_BAMBOO、STUMP_BAMBOO/BAOBAB/LUSH_BAMBOO、PLANT、WATER_LILY。
- themes waterPlants 加入 WATER_LILY（静水主题）；cliff 主题可加 CLIFF_MARBLE / SHORT_CLIFF_*。

## 2026-08-21 已接线（全部完成）

- 新提取 26 个素材入库：WATER_LILY / CLIFF_MARBLE / SHORT_CLIFF_ALL·MARBLE·SAND·SNOW / BUSH_TREE_C /
  PLANT / FELLED_BAMBOO·BAOBAB·LUSH_BAMBOO / STUMP_BAMBOO·BAOBAB·LUSH_BAMBOO / SCENARIO_TREE_A~L（12 个战役装饰树，归「通用/场景树」，可作未来大型装饰，不强行入 biome）。
- `Scene13EnvironmentGenerator.ts` 白名单已加：BUSH_TREE_C / PLANT / FELLED_* / STUMP_* / WATER_LILY / SCENARIO_TREE_*（树=间距+半格，水莲=半格）。
- `Scene13DeMapThemes.ts`：WATER_LILY 接入全部 12 主题 waterPlants（含沙漠绿洲/塞伦盖蒂湖/东南亚荷塘）；
  australasian 主树 BIRCH→WAX_PALM（主人定「能套用就套用」），水岸加 MANGROVE。
- `Scene13Biome.ts`：temperate_forest 删 BAMBOO（热带树混温带=张冠李戴）；MOUNTAIN_ASSETS 加 CLIFF_MARBLE + SHORT_CLIFF_* 四款。

## 地区 × 海拔两维划分（2026-08-21 主人定「严格专业划分」，与大地图海拔染色一致）

### 海拔色阶权威锚点（唯一真理 = `src/workers/HillshadeWorker.ts` initLUTs）

| 海拔带 | 大地图染色 | 13 场景主题 | 地面贴图 |
|--------|-----------|------------|---------|
| 0~400m 低地 | 低地 sage 绿 → 林地深绿 | europe/asia_temperate（温带绿）、indomalayan（热带绿）、neotropical（雨林绿） | gr2/gr7/gr6/for |
| 400~1000m 过渡 | 橄榄黄（sandBeige） | 绿→黄土渐变带；河西/陇西边缘 steppe | gr4/ds3 |
| 1000~2500m 黄土 | 黄土（loessYellow→loessMid） | **asia_steppe（黄土高原/塞外）**、middle_east_highland（伊朗高原） | pm2/ds3/pm1 |
| 2500~4000m 高山 | 冷灰绿（gobiBrown）→ 高山草甸黄 | **tibetan_plateau（青藏/帕米尔）** | pm2/ds5/sno |
| 4000~5200m 寒漠 | 石灰冷青 → 永冻青灰 → 裸岩 | tibetan_plateau 高海拔变体 | ds5/sno |
| 5200m+ 雪线 | 雪白 | terrainForTheme snow/ice | sno/ice |

### 地区 × 海拔分流（resolveDeMapTheme，地理带优先——RegionSystem polygon 不可靠）

| 地理带 | 经度 | 纬度 | 海拔条件 | 主题 |
|--------|------|------|---------|------|
| 澳洲大陆 | ≥100 | < -10 | — | australasian_temperate |
| 热带雨林 | 全球 | 全球 | biome=rainforest | 非洲<55 / 南美<-30 / 东南亚其余 |
| 岭南/中南半岛 | 90~130 | 0~24（或 LINGNAN 且 <1500m） | — | indomalayan_tropical |
| 青藏/帕米尔 | 78~105 | 26~40 | **≥2500m**（对齐大地图高原起点）或 region TIBET | tibetan_plateau |
| 西亚（安纳托利亚/两河/伊朗高原） | 26~62 | 25~43 | desert/lat<31→沙漠；地中海沿岸 lng<40→地中海；其余→高原 | middle_east_highland / _desert |
| 中亚/阿富汗/巴基斯坦 | 62~90 | 25~45 | desert→沙漠；其余→干旱草原 | asia_steppe |
| 河西/陇右黄土带 | 90~110 | 33~42 | <2500m（武威 1500 → steppe，不被青藏劫持） | asia_steppe |
| 塞外蒙古高原 | 85~125 | 42~55 | — | asia_steppe |
| 华北/晋北 | NORTH | — | ≥600m→黄土高原 steppe；低地→温带 | asia_steppe / asia_temperate |
| 撒哈拉/阿拉伯沙漠 | — | — | biome=desert | middle_east_desert |
| 非洲稀树草原 | — | — | biome=savanna（除印度 lng≥55 lat<30→东南亚） | serengeti |
| 地中海 | — | — | biome=mediterranean；LATIN 区 lat≥45→温带（巴黎） | europe_mediterranean / _temperate |
| 美洲 | < -30 | — | 南北美温带 | nearctic / neotropical_temperate |
| 东亚（日本/朝鲜/华东华北） | ≥60 | — | 温带 | asia_temperate |
| 欧洲 | SLAVIC→taiga / GERMANIC→temperate / LATIN→mediterranean(或≥45°温带) | | | |

### 阈值对照（13 场景 vs 大地图，保持一致）

| 阈值 | 13 场景（Scene13Biome） | 大地图（HillshadeWorker） | 状态 |
|------|------------------------|--------------------------|------|
| 雪线 | 4800-|lat|×63 | 5200m 固定雪白 | 13 场景按纬度更合理，大地图渲染上限兜底 ✓ |
| 高原起点（青藏主题） | **2500m**（已对齐） | 2500m loessMid→gobiBrown | ✓ |
| 黄土起点（河西/NORTH） | 600m | 1000m sandBeige 满值 | 渐变带，可接受 ✓ |
| mountain 地形带（树密度） | C 类 800m / D 类 700m | 400m 色相已转黄 | 用途不同（biome 树密度 vs 颜色），不冲突 ✓ |

### 验证

- `npx tsx --import ./tools/sim-preload.mjs scratch/verify_theme_regions.mts`：29 个真实坐标点全过
  （塞伦盖蒂/撒哈拉/也门/大不里士/摩苏尔/马什哈德/贝鲁特/拉合尔/太原/拉萨/武威/乌兰巴托/广州/曼谷/
  东京/北京/巴黎/米兰/罗马/悉尼/雅加达/莫斯科/亚马逊/金沙萨/加尔各答/云贵高原 等）。
