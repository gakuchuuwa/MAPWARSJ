# DE 素材使用清单（P3，2026-08-20）

> 覆盖核对：83 张地形 + 98 个装饰目录，逐个标注用途；未用上的单独列明原因。

---

## 一、地形 83 张

### 1. 主地形（17 张，biome × 季节，每季一张、全场统一铺）

| tile | biome | 季节 |
|---|---|---|
| gr8 | tropical_rainforest | 夏/秋/冬 |
| grs | savanna | 夏 |
| pc1 | savanna | 秋 |
| gr5 | savanna / mediterranean | 冬 |
| des | desert | 夏 |
| ds2 | desert | 秋 |
| qs | desert | 冬 |
| gr2 | mediterranean | 夏 |
| gr4 | mediterranean / temperate_grass | 秋 |
| gr6 | temperate_grass | 夏 |
| sn2 | temperate_grass / temperate_forest | 冬 |
| gr3 | temperate_forest | 夏 |
| for | temperate_forest | 秋 |
| gr9 | boreal | 夏 |
| pm2 | boreal | 秋 |
| sno | boreal / tundra_snow | 冬 / 夏秋 |
| ice | tundra_snow | 冬 |

### 2. L2 地貌修正（7 张主映射外）

| tile | 条件 |
|---|---|
| snf | 雪线以上（elev ≥ snowLine） |
| qs2 | 高原 ≥2500m |
| gravel_default | 高原 ≥2500m / 山地 ≥800m |
| rck | 山地 ≥800m 或坡度 ≥12° |
| rock_wet | 山地 ≥800m 或坡度 ≥12° |
| pc2 | 丘陵 ≥200m 掺 |
| pm1 | 丘陵 ≥200m 掺 |

### 3. L3 局部点缀

**海滩/海水（11）**：`bch bc2 bc3 bc4 beach_wet`（沙滩，随机）+ `wt2 wt3 wt4 wt5 wt6 wtr`（海水，随机）——临海（水域掩膜命中海）。

**水塘/沼泽（9）**：`wt_brown wt_green wt_yellow wt_yellow2`（浊水，随机）+ `sh2 sh3 sha`（浅滩描边）+ `sh4 sh5`（沼泽）——临河湖（命中内陆水）。

**冰面（3）**：`ic2 ic3 ice_beach`（随机）——高纬冬季（sceneSeason==2）临水。

**道路（3）**：`rd1`（拉丁/日耳曼，白石）、`rd2`（西亚/中亚，橙石）、`rd5`（其余，土路）——近城池斜穿。

**农田/梯田（10）**：`fm1 rc1 rc2 rc3`（东亚水田）、`fc1 fc2 fc3 fm2`（旱田/麦）、`rm1 rm2`（东亚山地梯田）——低海拔农田/东亚山地。

**地表变体散贴（13）**：`ds3 ds4 ds5 pal pal1 snd`（沙漠变体）、`gr7`（草）、`pc3`（稀树）、`sr2`（草）、`fo2 underbrush_leaves`（林地地表）、`gravel_wet r01`（砾石岩）——按 biome 低频散贴打散单调。

### 4. 未使用（10 张）——过渡混合 mask

`o_fo2 o_gr4 o_mod o_rd3 o_rd4 o_rd5 o_snd o_sng o_sr1 o_sr2`

**原因**：这 10 张带 X 网格的是 DE 的过渡混合 mask（blend mask），正确用法需要 `globalCompositeOperation:'destination-in'` 上 mask 合成管线。方案 §4.2 明确「第一期先不做」，属后续阶段的素材，非遗漏。

---

## 二、装饰 98 个目录（全部提取，97 用 + 1 未用）

### 1. 树（31）

| 类别 | 资产 | 用途 |
|---|---|---|
| 热带雨林 | JUNGLE RAINFOREST BRAZILWOOD | tropical_rainforest 树种（三季同） |
| 稀树草原 | ACACIA BAOBAB | savanna 树种 |
| 沙漠 | PALM WAX_PALM DEAD_TREE | desert 树种（三季同） |
| 地中海 | OLIVE CYPRESS ITALIAN_PINE CYPRESS_DEC | mediterranean 树种（夏） |
| 温带草原 | GREEN_OAK BIRCH_GREEN AUTUMN_OAK BIRCH_AUTUMN SNOW_AUTUMN_OAK BIRCH_WINTER | temperate_grass 树种（绿/秋/冬三档） |
| 温带森林 | 上述 + WILLOW ASIAN_MAPLE_GREEN BAMBOO PEACH_BLOSSOM ASIAN_MAPLE_AUTUMN SNOW_PINE | temperate_forest 树种 |
| 寒带 | PINE ASIAN_PINE MONKEY_PUZZLE | boreal 树种 |
| 水生 | REEDS MANGROVE LUSH_BAMBOO | 临河湖水塘点缀 |

### 2. 灌木/草/花（20）

| 类别 | 资产 | 用途 |
|---|---|---|
| 热带 | PLANT_JUNGLE PLANT_RAINFOREST FERNPATCH UNDERBRUSH_RAINFOREST | tropical 灌木 |
| 稀树/沙漠 | CACTUS PLANT_DEAD WEED GRASS_DRY GRASS_DRY_PATCH | savanna/desert 灌木 |
| 地中海 | FLOWER_1 FLOWER_2 FLOWER_3 FLOWER_4 FLOWERBED SHRUB_GREEN | mediterranean 花 |
| 温带 | BUSH_GREEN GRASS_GREEN GRASS_GREEN_PATCH UNDERBRUSH | temperate 灌木草 |
| 沼泽 | UNDERBRUSH_JUNGLE | 沼泽点缀 |

### 3. 岩石（12）

| 类别 | 资产 | 用途 |
|---|---|---|
| 稀树/沙漠 | ROCK_FORMATION1/2/3 ROCK_LIMESTONE | savanna/desert 岩石 |
| 热带 | ROCK_JUNGLE | tropical 岩石 |
| 寒带/雪 | ROCK1 ROCK2 ROCK3 | boreal/tundra 岩石 |
| 海滩 | ROCK_BEACH ROCK_SEA1 ROCK_SEA2 | 临海礁石 |
| 山地 | ROCK_PILLAR | L2 山地大件 |

### 4. 山体/悬崖（16）

`MOUNTAIN_01~11`（11）、`CLIFF_DEFAULT CLIFF_LIMESTONE CLIFF_SAND CLIFF_SNOW CLIFF_TERRACE`（5）——L2 山地大件（elev≥800 或坡度≥12°，贴边撒）。

### 5. 资源点（7）

`FORAGE_BUSH FORAGE_FRUIT FORAGE_PAPAYA FORAGE_PINEAPPLE MINE_GOLD MINE_STONE`（全 biome 低频）+ `OYSTERS`（临海）。

### 6. 贴花（7）

`DECAL_CRACK DECAL_CRATER`（战后残迹）、`DECAL_ICE`（冰面）、`DECAL_PATH_1~4`（道路）。

### 7. 落叶贴花（3）

`FALLEN_LEAVES_MAPLE_AUTUMN FALLEN_LEAVES_MAPLE_RED FALLEN_LEAVES_PEACH`——温带系秋季（season==1）。

### 8. 伐倒木/树桩（2）

`FELLED_GENERIC STUMP_GENERIC`——战后残迹（低频）。

### 9. 未使用（1）

**OAK**（`n_tree_oak`，通用橡树）——P2 工单明说「本单先不用它」，其帧含多季、与 green_oak/autumn_oak/snow_autumn_oak 重复，温带阔叶三季已由后三者覆盖。已提取但故意不接线，非遗漏。
