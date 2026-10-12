# DE 地图分类与元素表

> 2026-10-12 整理。**全部数据直接取自本机 DE 安装目录的明文文件，没有推测：**
> - 地图清单与官方分类：`resources/_common/dat/maps.json`（194 张）
> - 每张图的地形/物件：`resources/_common/drs/gamedata_x2/*.rms`（180 个脚本）
> - 地貌主题与动物：`resources/_common/drs/gamedata_x2/includes/themes.inc`（22 个主题）
> - 地形编号 → 名称：项目 `src/data/battlefield/deTerrainData.ts`（由 DE dat 导出）

## 一、DE 的分类是两层

1. **地图布局**（决定陆地/水/林子/山的分布）：DE 官方按「风格 × 地形类型」分，见第二节。
2. **地貌主题**（决定用什么草、什么树、什么装饰、什么动物）：同一张布局（如 Arabia）每局随机套一个主题，见第三节。
   - 新版地图脚本里只写抽象名（`BASE_TERRAIN`、`BASE_FOREST`、`STRAGGLER_NEUTRAL`、`AESTHETIC_SCATTER`…），按主题换成具体素材。

## 二、地图布局：194 张，按官方标注分 10 类

| 风格 | 陆地 | 混合 | 水域 | 未标注 | 合计 |
|---|---|---|---|---|---|
| 随机图 random | 80 | 41 | 12 | 10 | 143 |
| 真实世界 real world | 1 | 26 | 2 | 0 | 29 |
| 特殊图 special | 10 | 8 | 4 | 0 | 22 |

（「陆地/混合/水域」取自 maps.json 的 `land` / `mixed` / `water` 字段。）

各类包含的地图：

- **random｜未标注**（10 张）：megarandom.rms2、CtR Random.rms2、CtR Monsoon.rms2、CtR Pyramid Descent.rms2、CtR Spiral.rms2、BR_BattleOnTheIce、BR_ElDorado、BR_FallOfAxum、BR_FallOfRome、BR_TheMajapahitEmpire
- **random｜水域**（12 张）：Archipelago、Baltic、Crater_Lake、Islands、Migration、Team_Islands、Pacific_Islands、Sandbank、NorthernIsles、Isthmus、The_Passage、Aquarena
- **random｜混合**（41 张）：Coastal、Continental、Highland、Mediterranean、Rivers、Scandanavia、nomad、Canals、Capricious、Dingos、Metropolis、Paradise Island、Pilgrims、Seasons、Shipwreck、Team Glaciers、budapest.rms2、cityoflakes.rms2、hamburger.rms2、Nile Delta、Bog_Islands、Mangrove_Jungle、Water_Nomad、GoldenSwamp、FourLakes、CoastalForest、Crossroads、VolcanicIsland、FrigidLake、Greenland、Kawasan、Shoals、Dunesprings、Golden_Stream、River_Divide、EM Nomad、Graupel、Stranded、Murkwood、Dorothea Quarry、Loch Ness
- **random｜陆地**（80 张）：Arabia、Black_Forest、Fortress、Gold_Rush、Mongolia、Yucatan、Salt_Marsh、Arena、Oasis、Ghost_Lake、Graveyards、Moats、Prairie、Sherwood Forest、acropolis.rms2、cenotes.rms2、goldenpit.rms2、hideout.rms2、hillfort.rms2、lombardia.rms2、steppe.rms2、valley.rms2、Kilimanjaro、Mountain Pass、Serengeti、Socotra、Alpine_Lakes、Bogland、Mountain_Ridge、Ravines、Wolf_Hill、LandNomad、AmazonTunnel、AfricanClearing、Atacama、SeizeTheMountain、Crater、Michi、TeamMoats、Acclivity、Eruption、Lowland、Marketplace、Meadow、MountainRange、RingFortress、Runestones、Aftermath、Enclosed、Haboob、LandMadness、SacredSprings、Wade、Morass、Cliffbound、Mountain_Dunes、Sandrift、Shrubland、Hollow_Woodlands、Karsts、Glade、fortified_clearing、EM Arabia、EM Fortified Clearing、EM Glade、EM Runestones、EM Arena、EM Black Forest、Border Dispute、Sardis、Chaos Pit、Mired、Crownwood、Glacis、Hengehold、Rampart、Stonefront、Thames、Vulpine、Arabian Desert
- **real world｜水域**（2 张）：real_world_nippon、real_world_madagascar
- **real world｜混合**（26 张）：real_world_spain、real_world_britain、real_world_mideast、real_world_texas、real_world_italy、real_world_caribbean、real_world_france、real_world_jutland、real_world_byzantium、real_world_amazon、real_world_china、real_world_eastafrica、real_world_india、real_world_westafrica、real_world_world、real_world_australia、real_world_indochina、real_world_indonesia、real_world_malacca、real_world_philippines、real_world_antarctica、real_world_aralsea、real_world_blacksea、real_world_caucasus、real_world_siberia、real_world_manchuria
- **real world｜陆地**（1 张）：real_world_bohemia
- **special｜水域**（4 张）：special_map_enemyarchipelago、special_map_enemyislands、special_map_theeye、special_map_jungleislands
- **special｜混合**（8 张）：special_map_motherland、special_map_ringofwater、special_map_snakepit、special_map_holyline、special_map_yinyang、special_map_swirlingriver、special_map_twinforests、special_map_sprawlingstreams
- **special｜陆地**（10 张）：special_map_canyons、special_map_farout、special_map_frontline、special_map_innercircle、special_map_openplains、special_map_borderstones、special_map_junglelanes、special_map_journeysouth、special_map_snakeforest、Forest Breach

## 三、地貌主题：22 个，每个主题用的元素

说明：
- 「地形类」（底地形、林地、林边…）括号里的数字＝在多少张地图脚本里这个主题用了它；只列前 4 个。
- 「动物类」取自 themes.inc，是该主题可能出现的全部动物（每局随机抽）。
- 194 张图里有 **63 张**是按主题写元素的新版脚本，下表的地形类数据来自这 63 张；另外约 130 张旧版/特殊脚本直接写死具体地形，不在本表。
- 有的主题「0 张图定义了它」：说明 DE 现有地图没有用这个主题配地形，只在 themes.inc 里定义了动物。

### NEARCTIC_TUNDRA（7 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Snow Soft Deep(4)、Snow Deep(1)、Snow Soft(1)、Grass(1) |
| 林地 | Dead Forest(4)、Forest, Snow Autumn(2)、Snow Forest(1) |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | Dead Tree(5)、Snow Bush(1)、Autumn Snow Bush(1) |
| 野外散树 | Dead Tree(5)、Snow Bush(1)、Autumn Snow Bush(1) |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Berry Bush |
| 大型猎物 | Seal |
| 可引诱猎物 | Walrus |
| 牲畜 | — |
| 猛兽 | Arctic Wolf、Polar Bear |
| 鸟 | Hawk、Falcon、Raven |

### NEARCTIC_TAIGA（0 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | — |
| 林地 | — |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | — |
| 野外散树 | — |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Berry Bush |
| 大型猎物 | Deer |
| 可引诱猎物 | Elk |
| 牲畜 | Goose |
| 猛兽 | Arctic Wolf、Black Bear、Brown Bear、Grey Wolf、Lynx |
| 鸟 | Hawk、Falcon、Raven |

### NEARCTIC_TEMPERATE（20 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Dirt 3(9)、Grass 3(5)、Grass(2)、Dirt Mud(2) |
| 林地 | Pine Forest(14)、Forest, Oak Bush(2)、Forest, Bush(2)、Acacia Forest(1) |
| 林边 | Forest, Bush(4) |
| 林地变体 | Forest(4)、Forest, Oak Bush(1) |
| 散树林地 | Forest, Bush(2) |
| 出生点散树 | Pine Tree(18)、Bush B(1)、#350(1) |
| 野外散树 | Pine Tree(19)、#350(1) |
| 地面装饰（平铺） | Bush Plant(2)、#1366(1) |
| 地面装饰（成团） | Flower Plant(2)、#809(1) |
| 地面装饰（散布） | Shrub Plant(2)、#1366(1) |
| 大石头 | Rock A(2) |
| 石头周边 | Barrels(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush、Fruit Bush |
| 大型猎物 | Deer |
| 可引诱猎物 | Elk |
| 牲畜 | Goose、Turkey |
| 猛兽 | Black Bear、Grey Wolf |
| 鸟 | Hawk、Falcon、Condor、Owl、Raven |

### NEARCTIC_DESERT（0 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | — |
| 林地 | — |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | — |
| 野外散树 | — |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Fruit Bush |
| 大型猎物 | Deer |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Turkey、Goose |
| 猛兽 | Jaguar、Grey Wolf |
| 鸟 | Hawk、Falcon、Condor |

### NEOTROPICAL_TEMPERATE（6 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Jungle Grass(4)、Grass(2) |
| 林地 | Forest, Oak Bush(4)、Forest, Dry South American(2) |
| 林边 | Forest, Bush(2) |
| 林地变体 | Forest, Dry South American(2) |
| 散树林地 | Jungle(2) |
| 出生点散树 | Oak Tree(4)、Monkey Puzzle Tree(2) |
| 野外散树 | Oak Tree(4)、Monkey Puzzle Tree(2) |
| 地面装饰（平铺） | Weeds Plant(2) |
| 地面装饰（成团） | Flower Plant(2) |
| 地面装饰（散布） | Shrub Plant(2) |
| 大石头 | Rock A(2) |
| 石头周边 | Skeleton(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush、Fruit Bush、Papaya Tree、Pineapple Bush |
| 大型猎物 | Guanaco、Rhea |
| 可引诱猎物 | Wild Boar、Javelina、Tapir |
| 牲畜 | Goose、Capybara |
| 猛兽 | Jaguar |
| 鸟 | Hawk、Macaw、Stork、Falcon、Condor、Flamingo、Owl |

### NEOTROPICAL_TROPICAL（19 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Jungle Grass(11)、Jungle Grass (Rainforest)(7) |
| 林地 | Rainforest(11)、Jungle(6)、Bamboo(1) |
| 林边 | Forest, Bush(3) |
| 林地变体 | Rainforest(2)、Jungle(2) |
| 散树林地 | Rainforest(2) |
| 出生点散树 | Jungle Tree(8)、Rainforest Tree(7)、#302(1)、Palm Tree(1) |
| 野外散树 | Rainforest Tree(9)、Jungle Tree(7)、#302(1)、#414(1) |
| 地面装饰（平铺） | Weeds Plant(2)、#1366(1) |
| 地面装饰（成团） | Flower Plant(2)、#809(1) |
| 地面装饰（散布） | Shrub Plant(2)、#1366(1) |
| 大石头 | Rock A(2) |
| 石头周边 | Skeleton(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush、Fruit Bush、Papaya Tree、Pineapple Bush |
| 大型猎物 | Guanaco、Rhea |
| 可引诱猎物 | Javelina、Tapir |
| 牲畜 | Goose、Capybara |
| 猛兽 | Jaguar、Black Panther |
| 鸟 | Hawk、Macaw、Stork、Falcon、Condor、Flamingo、Owl |

### NEOTROPICAL_DESERT（5 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Desert(4)、Dirt 3(1) |
| 林地 | Palm Desert(4)、Dragon Forest(1) |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | Dead Tree(3)、Palm Tree(2) |
| 野外散树 | Dead Tree(3)、Palm Tree(2) |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Fruit Bush、Papaya Tree、Pineapple Bush |
| 大型猎物 | Guanaco |
| 可引诱猎物 | Javelina |
| 牲畜 | — |
| 猛兽 | Jaguar |
| 鸟 | Hawk、Falcon、Condor、Flamingo |

### PALAEARCTIC_EUROPE_TAIGA（10 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Grass 2(6)、Dry Grass(3) |
| 林地 | Forest(5)、Dead Forest(2)、#131(2)、Forest, Oak Bush(1) |
| 林边 | Forest, Bush(3) |
| 林地变体 | Forest, Snow Autumn(2)、Pine Forest(1)、Snow Forest(1) |
| 散树林地 | Pine Forest(2) |
| 出生点散树 | Oak Tree(4)、Dead Tree(2)、Spruce Tree(2)、Snowy Pine Tree(1) |
| 野外散树 | Oak Tree(5)、Dead Tree(2)、Spruce Tree(2)、Snowy Pine Tree(1) |
| 地面装饰（平铺） | Flowers(2)、#1366(1) |
| 地面装饰（成团） | Stump(2)、#809(1) |
| 地面装饰（散布） | Flowers(2)、#1366(1) |
| 大石头 | Rock A(2) |
| 石头周边 | Skeleton(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush |
| 大型猎物 | Deer |
| 可引诱猎物 | Elk |
| 牲畜 | Goose、Pig、Sheep |
| 猛兽 | Arctic Wolf、Grey Wolf |
| 鸟 | Hawk、Falcon、Raven |

### PALAEARCTIC_EUROPE_TEMPERATE（15 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Grass 2(5)、Grass(4)、Grass 3(2)、Bogland(1) |
| 林地 | Forest(9)、Forest, Oak Bush(3)、Pine Forest(1)、Acacia Forest(1) |
| 林边 | Forest, Bush(3) |
| 林地变体 | Pine Forest(4) |
| 散树林地 | Pine Forest(2) |
| 出生点散树 | Oak Tree(8)、Bush A(3)、Bush B(2)、Palm Tree(1) |
| 野外散树 | Oak Tree(12)、Bush B(2)、Birch Tree(1) |
| 地面装饰（平铺） | Flowers(2)、#1366(1) |
| 地面装饰（成团） | Stump(2)、#809(1) |
| 地面装饰（散布） | Flowers(2)、#1366(1) |
| 大石头 | Rock A(2) |
| 石头周边 | Skeleton(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush |
| 大型猎物 | Deer、Mouflon |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goose、Pig、Sheep |
| 猛兽 | Brown Bear、Grey Wolf |
| 鸟 | Hawk、Falcon、Owl、Raven |

### PALAEARCTIC_EUROPE_MEDITERRANEAN（11 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Grass(4)、Dirt Mud(3)、Grass 3(2)、Dry Grass(1) |
| 林地 | Forest, Mediterranean(7)、Forest(3)、Forest, Oak Bush(1) |
| 林边 | Forest, Bush(3) |
| 林地变体 | Pine Forest(3) |
| 散树林地 | Pine Forest(2) |
| 出生点散树 | Olive Tree(11) |
| 野外散树 | Italian Pine Tree(8)、Olive Tree(3) |
| 地面装饰（平铺） | Flowers(2) |
| 地面装饰（成团） | Stump(2) |
| 地面装饰（散布） | Flowers(2) |
| 大石头 | Rock A(2) |
| 石头周边 | Barrels(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush、Fruit Bush |
| 大型猎物 | Deer、Mouflon、Ibex |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goat、Pig、Sheep |
| 猛兽 | Grey Wolf |
| 鸟 | Hawk、Stork、Falcon、Vulture、Flamingo、Owl |

### PALAEARCTIC_MIDDLE_EAST_DESERT（18 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Desert(17)、Dirt 3(1) |
| 林地 | Palm Desert(11)、Forest, Palm Grass(5)、Dragon Forest(1) |
| 林边 | Palm Desert(4) |
| 林地变体 | Forest, Birch(3)、Forest, Palm Grass(1) |
| 散树林地 | Dragon Forest(2) |
| 出生点散树 | Palm Tree(16)、#351(1)、Dragon Tree(1) |
| 野外散树 | Palm Tree(16)、#351(1)、Dragon Tree(1) |
| 地面装饰（平铺） | Dead Plant(2) |
| 地面装饰（成团） | Cactus(2) |
| 地面装饰（散布） | Animal Skeleton(2) |
| 大石头 | Boulder B(2) |
| 石头周边 | Boulder A(2) |
| 矮灌木 | Dead Plant(2) |
| 采集植物 | Fruit Bush |
| 大型猎物 | Gazelle、Ibex、Mouflon、Argali |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goat、Sheep |
| 猛兽 | Lion、Arabian Wolf、Jaguar、Cheetah |
| 鸟 | Hawk、Stork、Falcon、Vulture |

### PALAEARCTIC_ASIA_TAIGA（5 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Dry Grass(4)、Dirt Mud(1) |
| 林地 | Forest, Autumn(4)、Jungle(1) |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | Autumn Tree(4)、Snowy Autumn Tree(1) |
| 野外散树 | Autumn Tree(4)、Snowy Autumn Tree(1) |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Berry Bush |
| 大型猎物 | Deer、Ibex |
| 可引诱猎物 | Elk |
| 牲畜 | Goose、Pig |
| 猛兽 | Arctic Wolf、Brown Bear、Grey Wolf、Snow Leopard、Tiger、Lynx |
| 鸟 | Hawk、Red Crowned Crane、Falcon、Raven |

### PALAEARCTIC_ASIA_TEMPERATE（15 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Dry Grass(7)、Grass(5)、Dirt 3(1)、Bogland(1) |
| 林地 | Forest, Autumn(9)、Bamboo(3)、Forest, Birch(1)、Acacia Forest(1) |
| 林边 | Forest, Bush(3) |
| 林地变体 | Bamboo(4) |
| 散树林地 | Bamboo(2) |
| 出生点散树 | Autumn Maple Tree(4)、Bush B(3)、Bamboo(3)、Beach Blossom(2) |
| 野外散树 | Autumn Tree(5)、Autumn Maple Tree(4)、Bamboo(2)、Asian Pine Tree(2) |
| 地面装饰（平铺） | Shrub Plant(2)、#1366(1) |
| 地面装饰（成团） | Flower Plant(2)、#809(1) |
| 地面装饰（散布） | Bush Plant(2)、#2743(1) |
| 大石头 | Rock A(2) |
| 石头周边 | Rugs(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush、Fruit Bush |
| 大型猎物 | Argali、Deer、Ibex、Mouflon |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goat、Goose、Sheep、Pig |
| 猛兽 | Black Bear、Brown Bear、Grey Wolf、Tiger、Snake、Jaguar |
| 鸟 | Hawk、Stork、Falcon、Vulture、Flamingo、Red Crowned Crane、Owl |

### PALAEARCTIC_ASIA_DESERT（0 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | — |
| 林地 | — |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | — |
| 野外散树 | — |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Fruit Bush |
| 大型猎物 | Argali、Gazelle、Ibex、Mouflon |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goat、Goose、Pig、Sheep |
| 猛兽 | Grey Wolf、Jaguar |
| 鸟 | Hawk、Stork、Falcon、Vulture、Flamingo |

### AFROTROPICAL_TROPICAL（20 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Savannah(15)、Dirt(3)、Bogland(1) |
| 林地 | Dragon Forest(14)、Acacia Forest(4)、Baobab Forest(1) |
| 林边 | Forest, Bush(3)、Dragon Forest(1) |
| 林地变体 | Dragon Forest(5) |
| 散树林地 | Palm Desert(2) |
| 出生点散树 | Dragon Tree(16)、Acacia Tree(3)、Palm Tree(1) |
| 野外散树 | Dragon Tree(16)、Acacia Tree(3)、Baobab Tree(1) |
| 地面装饰（平铺） | Dead Plant(2)、#1366(1) |
| 地面装饰（成团） | Cactus(2)、#809(1) |
| 地面装饰（散布） | Animal Skeleton(2)、#1366(1) |
| 大石头 | Boulder B(2) |
| 石头周边 | Boulder A(2) |
| 矮灌木 | Dead Plant(2) |
| 采集植物 | Fruit Bush |
| 大型猎物 | Gazelle、Ostrich、Zebra |
| 可引诱猎物 | Elephant、Rhinoceros、Wild Boar、Javelina |
| 牲畜 | Goat、Goose |
| 猛兽 | Lion、Jaguar |
| 鸟 | Stork、Vulture、Falcon、Flamingo、Owl、Hawk |

### AFROTROPICAL_DESERT（0 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | — |
| 林地 | — |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | — |
| 野外散树 | — |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Fruit Bush |
| 大型猎物 | Gazelle、Ostrich、Zebra |
| 可引诱猎物 | Elephant、Rhinoceros |
| 牲畜 | Goat、Goose |
| 猛兽 | Lion、Black Panther |
| 鸟 | Vulture、Stork、Falcon、Flamingo |

### INDOMALAYAN_TROPICAL（22 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Dry Grass(10)、Jungle Grass(6)、Jungle Grass (Rainforest)(3)、Dirt Mud(2) |
| 林地 | Forest, Lush Bamboo(15)、Bamboo(4)、Rainforest(2)、Forest, Birch(1) |
| 林边 | Forest, Bush(3)、Bamboo(1) |
| 林地变体 | Bamboo(5) |
| 散树林地 | Bamboo(2) |
| 出生点散树 | Bamboo(10)、Bamboo Tree(5)、Rainforest Tree(2)、Lush Bamboo(2) |
| 野外散树 | Lush Bamboo(7)、Bamboo(6)、Bamboo Tree(5)、Rainforest Tree(2) |
| 地面装饰（平铺） | Shrub Plant(2)、#1366(1) |
| 地面装饰（成团） | Grave(2)、#809(1) |
| 地面装饰（散布） | Flower Bed(2)、#1366(1) |
| 大石头 | Rock A(2) |
| 石头周边 | Rugs(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush、Fruit Bush |
| 大型猎物 | Deer |
| 可引诱猎物 | Wild Boar、Elephant、Rhinoceros、Tapir |
| 牲畜 | Goat、Pig、Water Buffalo |
| 猛兽 | Komodo Dragon、Tiger、Snake、Black Panther |
| 鸟 | Hawk、Stork、Falcon、Flamingo、Owl |

### AUSTRALASIAN_TEMPERATE（6 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Dirt 3(4)、Dry Grass(2) |
| 林地 | Forest, Birch(6) |
| 林边 | Forest, Bush(2) |
| 林地变体 | Forest(2) |
| 散树林地 | Forest, Bush(2) |
| 出生点散树 | Birch Tree(6) |
| 野外散树 | Birch Tree(6) |
| 地面装饰（平铺） | Shrub Plant(2) |
| 地面装饰（成团） | Flower Plant(2) |
| 地面装饰（散布） | Bush Plant(2) |
| 大石头 | Rock A(2) |
| 石头周边 | Rugs(2) |
| 矮灌木 | Flower Bed(2) |
| 采集植物 | Berry Bush、Fruit Bush |
| 大型猎物 | Rhea |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goose、Pig |
| 猛兽 | Arabian Wolf、Snake |
| 鸟 | Hawk、Falcon、Owl |

### AUSTRALASIAN_TROPICAL（0 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | — |
| 林地 | — |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | — |
| 野外散树 | — |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Berry Bush、Fruit Bush |
| 大型猎物 | Rhea |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goose |
| 猛兽 | Arabian Wolf、Snake |
| 鸟 | Hawk、Stork、Falcon、Owl |

### AUSTRALASIAN_DESERT（0 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | — |
| 林地 | — |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | — |
| 野外散树 | — |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Fruit Bush |
| 大型猎物 | Rhea |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Goat |
| 猛兽 | Arabian Wolf |
| 鸟 | Hawk、Falcon |

### OCEANIAN_TROPICAL（0 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | — |
| 林地 | — |
| 林边 | — |
| 林地变体 | — |
| 散树林地 | — |
| 出生点散树 | — |
| 野外散树 | — |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Berry Bush、Fruit Bush |
| 大型猎物 | Deer |
| 可引诱猎物 | Wild Boar |
| 牲畜 | Pig、Water Buffalo |
| 猛兽 | Komodo Dragon、Crocodile |
| 鸟 | Hawk |

### ANTARCTIC_TUNDRA（8 张图定义了它）

| 元素 | DE 用的（括号＝出现在几张图里） |
|---|---|
| 底地形 | Snow(6) |
| 林地 | Dead Forest(6) |
| 林边 | Forest, Snow Autumn(1) |
| 林地变体 | Snow Forest(1) |
| 散树林地 | — |
| 出生点散树 | Dead Tree(5)、Snow Bush(1) |
| 野外散树 | Dead Tree(6) |
| 地面装饰（平铺） | — |
| 地面装饰（成团） | — |
| 地面装饰（散布） | — |
| 大石头 | — |
| 石头周边 | — |
| 矮灌木 | — |
| 采集植物 | Berry Bush |
| 大型猎物 | Seal |
| 可引诱猎物 | Walrus |
| 牲畜 | — |
| 猛兽 | Arctic Wolf |
| 鸟 | Hawk、Falcon |

