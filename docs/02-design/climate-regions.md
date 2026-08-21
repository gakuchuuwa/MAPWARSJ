# 全球气候分区权威表（2026-08-21，主人定「像划分文化一样把气候划分开」）

> 单一真理来源：`src/ui/Scene13Biome.ts`（KoppenClass 柯本气候 + KOPPEN_TO_BIOME + BIOME_TREES + BIOME_GROUND_DECOR）
> + `src/ui/scene13/Scene13DeMapThemes.ts`（DE_MAP_THEMES 16 主题）。
> 结构对标：18 文化区（RegionSystem REGION_CENTERS，2026-08-19 主人定收敛 18 大文化）——文化区管「谁在这里」，
> **气候区管「这里长什么」**。文化按据点归属，气候按经纬度+海拔自动检测（柯本，全球覆盖）。

## 18 文化区 × 气候覆盖核对（2026-08-21 实测）

| 文化区 | 气候 | 战斗主题 | 覆盖 |
|--------|------|---------|------|
| 中原 CENTRAL | 温带大陆湿润 | asia_temperate | ✓ |
| 北方 NORTH | 温带大陆湿润（晋北黄土 elev≥600） | asia_temperate / asia_steppe | ✓ |
| 江南 JIANGNAN | 亚热带湿润 | asia_temperate | ✓ |
| 川蜀 BASHU | 亚热带湿润（盆地低地） | asia_temperate | ✓ |
| 岭南 LINGNAN | 热带/亚热带 | indomalayan_tropical | ✓ |
| 滇缅 DIANQIAN | 热带（低地）/温带（高原） | indomalayan / asia_temperate | ✓ |
| 河西 HEXI | 温带干旱草原 | asia_steppe | ✓ |
| 西域 WESTERN | 沙漠/干旱 | middle_east_desert / asia_steppe | ✓ |
| 青藏 TIBET | 极地高原 | tibetan_plateau | ✓ |
| 草原 STEPPE | 温带干旱草原 | asia_steppe | ✓ |
| 东北 NORTHEAST | 温带大陆湿润（黑土） | asia_temperate | ✓ |
| 朝鲜 KOREA | 温带大陆湿润 | asia_temperate | ✓ |
| 日本 JAPAN | 亚热带/温带湿润 | asia_temperate | ✓ |
| 中亚 CENTRAL_ASIA | 沙漠/干旱草原 | middle_east_desert / asia_steppe | ✓ |
| 西亚 WEST_ASIA | 沙漠/地中海/高原 | middle_east_desert / highland / mediterranean | ✓ |
| 斯拉夫 SLAVIC | 寒带针叶林 | europe_taiga | ✓ |
| 日耳曼 GERMANIC | 温带海洋 | europe_temperate | ✓ |
| 拉丁 LATIN | 地中海（南）/温带海洋（北≥45°） | europe_mediterranean / europe_temperate | ✓ |

**18/18 全覆盖**（验证脚本 `scratch/verify_theme_regions.mts` 34 点全过）。

## 9 大气候区（全球，任何坐标都可分到）

| # | 气候区 | 柯本组 | 代表分布（全球） | DE biome | 树（DE 素材） | 战斗主题 |
|---|--------|--------|-----------------|----------|--------------|---------|
| 1 | 热带雨林 | Af/Am | 亚马逊/刚果盆地/东南亚/爪哇 | Rainforest/Jungle | JUNGLE·RAINFOREST·BRAZILWOOD·BAMBOO·LUSH_BAMBOO | 南美/非洲/东南亚热带 |
| 2 | 热带稀树草原 | Aw/BSh | 非洲萨赫勒/塞伦盖蒂/印度德干/巴西高原 | Savannah | ACACIA·BAOBAB·WAX_PALM | serengeti |
| 3 | 沙漠 | BWh/BWk | 撒哈拉/阿拉伯/中亚沙漠/澳洲内陆 | Desert | PALM·DEAD_TREE·CACTUS(植) | middle_east_desert |
| 4 | 地中海 | Csa/Csb | 地中海沿岸/加州/智利中部 | Default+ | OLIVE·CYPRESS·CYPRESS_DEC·ITALIAN_PINE | europe_mediterranean |
| 5 | 亚热带湿润 | Cfa/Cwa | 中国东南/日本南部/美国东南/拉普拉塔 | Default | ASIAN_MAPLE·OAK·PEACH_BLOSSOM·BAMBOO(南缘) | asia/europe_temperate |
| 6 | 温带海洋 | Cfb/Cwb | 西欧/智利南部/新西兰/澳洲东南 | Default | OAK·BIRCH·GREEN_OAK·WILLOW | europe_temperate/australasian |
| 7 | 温带大陆性（湿润） | Dfa/Dwb/Dwa | 东北/华北/朝鲜/美国中西部 | Steppes/Default | PINE·ASIAN_PINE·BIRCH·ASIAN_MAPLE | asia_temperate |
| 8 | 温带大陆性（干旱草原） | BSk/Dsa/Dsb | 蒙古/中亚/河西/北美大平原 | Steppes | PINE·DEAD_TREE·SNOW_PINE(冬) | asia_steppe/middle_east_highland |
| 9 | 寒带针叶林/极地 | Dfc/Dsc/ET/EF | 西伯利亚/北欧/加拿大/青藏高原 | Arctic | PINE·SNOW_PINE·DEAD_TREE | europe_taiga/nearctic/tibetan |

## 三级分配链（代码路径）

1. **气候检测**（全球，任意坐标）：
   `resolveClimateRegion(lat,lng)` → KoppenClass（30 亚类，按经纬度+海拔）
   → `KOPPEN_TO_BIOME` → 9 类 biome（Scene13Biome.ts:46）
2. **植被分配**（全球）：
   `BIOME_TREES[biome][季节0/1/2]`（Scene13Biome.ts:174）→ 树候选
   `BIOME_GROUND_DECOR[biome]`（:187）→ 灌木/草/花/岩
3. **主题分配**（biome 驱动全球 + 欧亚地理带细化）：
   `resolveDeMapTheme`（Scene13DeMapThemes.ts:233）→ 16 主题
   - biome 分支（rainforest/savanna/desert/mediterranean/boreal/tundra）**全球通用**
   - 欧亚地理带（西亚/中亚/河西/蒙古/华北/岭南）**细化**
   - 美洲（lng<-30）/澳洲（lat<-10,lng≥100）已分流
   - 沼泽（lake+低地）全球湿地通用

## 树库存（2026-08-21 实测，全 DE 提取）

- **DE 树素材共 53 目录**（`public/SUCAI_NATURE/`，全部提取完成）：
  - **基本树种 33 种**：乔木 29（oak/pine/birch/maple/ash…）+ 灌木树 3（BUSH_TREE_A/B/C）+ 芦苇水植 1（REEDS）+ 枯树 1（DEAD_TREE）
  - **季节变体 9**：桦×3（绿/秋/冬）、枫×2（绿/秋）、橡×3（绿/秋/雪）、雪松 1
  - **倒地 4 + 树桩 4**（通用/竹/猴面包/茂竹）
  - **场景装饰树 12**（SCENARIO_TREE_A~L，战役专用大型树）
- 每种树 3~27 帧变体（方向/形态/季节池），按帧随机取用。

## DE 背景图分配机制（对照说明）

DE 官方 179 张地图（rms）不是 179 套素材——是 **terrain style（地形风格）机制**：

1. 每张官方地图指定 1 个 terrain style（温带/沙漠/雪/热带/丛林/冻原/稀树草原/草原）
2. style = 全套地面贴图（terrain textures）+ 树组 + 装饰组 + 配色（colorcorrection 19 套）
3. rms 里 `#const BASE_TERRAIN <id>` 定主地形，`create_object` 对象组（AESTHETIC_FLAT/SOLID_OBJECT/FALLEN_TREE 等）按 style 取成员

**我们的同构实现**：16 主题 = 16 个「style」，每个 = baseTerrain + groundTiles + trees（3 季）+ flatDecor + solidDecor + waterPlants + beachTerrain——结构与 DE style 一一对应；
季节 = DE colorcorrection 的 Spring/Summer/Autumn/Winter；
19 套配色中 Night/Evening 等 8 套时间氛围需昼夜系统（暂无，已记录）。
