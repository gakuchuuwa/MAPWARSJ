# RMS 解释器实现 · 参考资料（给 CC）

> **用途**：给要写「AoE2DE 的 RMS 解析器 + 地图生成引擎」的 AI 当参考。
> **数据来源**：全部在**本机**实测（DE 装在 `C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\drs\gamedata_x2`），每条都标了出处。凡是**推断而非实证**的，一律标注「未证实」。
> **建立日期**：2026-10-08

---

## 0. 结论先说

**RMS 解释执行完全可行，而且比预想的简单。** 实测支撑：

| 指标 | 实测值 |
|---|---|
| 脚本文件总数 | **277**（`.rms` 180 ＋ `.rms2` 16 ＋ `.inc` 81） |
| 不同指令数 | **123** 个（＋7 个流程控制词）＝ 130 个行首 token |
| 罕见指令（≤5 次） | 只有 **9** 个 |
| **结构配对预检** | **271 / 277 完全配对（97.8%）** |
| 条件语句里的比较运算 | **零命中** —— 一律只判「符号有没有被 `#define`」 |

配对预检明细（花括号 / `if`↔`endif` / `start_random`↔`end_random` 三项全查，277 个文件里只有 6 个不平衡）：
`Continental.rms`(+1 if)、`F_seasons.inc`(-1 rnd)、`GeneratingObjects.inc`(+2 花括号)、`Gold_Rush.rms`(-1/-1)、`Karsts.rms`(-1 if)、`Megarandom.rms2`(+5 花括号)。**多数是跨文件 include 造成的**（`if` 在主脚本、`endif` 在 `.inc`），不是语法错误。

**真正的难点（不在解析）**：
1. **引擎内部的摆放算法没有源码** —— 脚本只给参数（"几个团、多大间距"），"怎么长出来"在 exe 里。→ 同一随机种子逐格一致做不到；**同一脚本的整体样式与统计规律可以做到一致**。
2. **少数指令语义需实测反推**（见 §8，最大一条 `terrain_mask` 已反推出来）。
3. **渲染层** —— 地形过渡、高度光影、悬崖、水岸线是引擎渲染的，不是脚本给的（项目里已做了一部分）。

---

## 1. 文件构成

| 类型 | 数量 | 说明 |
|---|---|---|
| `.rms` | 180 | 随机地图主脚本 |
| `.rms2` | 16 | 变体脚本（含 `Megarandom` 等） |
| `.inc` | 81 | 库文件；其中 `includes\` 子目录下 54 个 |
| **合计** | **277** | |

🔴 **核心规则大量藏在 `.inc` 里，主脚本只是"调用 + 参数"**：
- `includes\themes.inc`（118 KB）—— 生物群系 → 素材/动物映射表（`if NEARCTIC_TUNDRA` → `#define BIOME_TUNDRA` ＋ `#const FORAGE_PLANT 59`）
- `includes\forest.inc`（92 KB）—— 森林生成，**光 `create_terrain` 就有 438 个块**（`create_object` 0 个）
- `includes\constants.inc`（57 KB）—— 物件/地形 ID 常量表

→ **解释器必须先把 `#include_drs` 递归展开**，否则主脚本跑不起来。

---

## 2. 段落标签（实测只有 7 个）

| 段落 | 出现次数 | 主指令 |
|---|---|---|
| `<PLAYER_SETUP>` | 308 | `effect_amount`、`ai_info_map_type`、`random_placement` |
| `<LAND_GENERATION>` | 258 | `create_land` |
| `<ELEVATION_GENERATION>` | 213 | `create_elevation` |
| `<CLIFF_GENERATION>` | 82 | `min/max_number_of_cliffs`、`cliff_type` |
| `<TERRAIN_GENERATION>` | 308 | `create_terrain` |
| `<OBJECTS_GENERATION>` | 188 | `create_object` |
| `<CONNECTION_GENERATION>` | 87 | `replace_terrain`、`create_connect_*` |

🔴 **`.inc` 里的代码通常不带段落标签** —— 它归属于「include 它的那个位置所在的段」。实测有大量指令出现在"段外"，就是这个原因（见 §3 末）。

---

## 3. 指令 × 段落 全表（解释器的结构依据）

括号内是该指令的**出现次数**。加粗的是各段独有、必须在段内解析的。

### `<PLAYER_SETUP>` —— 19 种
`effect_amount`(5205)、`if`/`endif`/`else`/`elseif`、`ai_info_map_type`(419)、`random_placement`(282)、`percent_chance`(235)、`nomad_resources`(151)、`start_random`/`end_random`、`force_nomad_treaty`(87)、`water_definition`(56)、`grouped_by_team`(46)、`behavior_version`(30)、`direct_placement`(29)、`effect_percent`(15)、`set_gaia_civilization`(7)、`override_map_size`(3)

### `<LAND_GENERATION>` —— 37 种
`create_land`(8491)、`base_size`(4425)、`number_of_tiles`(3411)、`base_elevation`(2814)、`land_position`(2737)、`terrain_type`(2654)、`land_percent`(1250)、`top_border`(1127)/`right_border`(1121)/`bottom_border`(1100)/`left_border`(1090)、`other_zone_avoidance_distance`(1064)、`border_fuzziness`(1028)、`assign_to`(963)、`circle_radius`(923)、`land_id`(740)、`zone`(600)、`clumping_factor`(518)、`base_terrain`(303)、`create_player_lands`(292)、`set_zone_by_team`(63)、`enable_waves`(51)、`set_circular_base`(26)、`min_placement_distance`(8)、`generate_mode`(8)、`set_zone_randomly`(3)、`land_conformity`(3)、`override_map_size`(1)、`assign_to_player`(1)、`water_definition`(1)

### `<ELEVATION_GENERATION>` —— 17 种
`number_of_tiles`(2060)、`number_of_clumps`(1273)、`create_elevation`(428)、`base_terrain`(422)、`spacing`(212)、`enable_balanced_elevation`(150)、`set_scale_by_size`(86)、`set_scale_by_groups`(86)、`clumping_factor`(10)、`spacing_to_other_terrain_types`(5)

### `<CLIFF_GENERATION>` —— 14 种
`max_number_of_cliffs`(97)、`min_number_of_cliffs`(97)、`cliff_type`(70)、`max_length_of_cliff`(25)、`min_length_of_cliff`(25)、`min_distance_cliffs`(24)、`cliff_curliness`(19)

### `<TERRAIN_GENERATION>` —— 25 种
`create_terrain`(12237)、`number_of_clumps`(10362)、`base_terrain`(9592)、`land_percent`(8971)、`spacing_to_other_terrain_types`(3738)、`set_scale_by_groups`(3404)、**`terrain_mask`(2416)**、`number_of_tiles`(1535)、`set_avoid_player_start_areas`(1307)、`height_limits`(825)、`set_scale_by_size`(418)、`clumping_factor`(342)、`beach_terrain`(335)、`color_correction`(323)、`set_flat_terrain_only`(205)、`spacing_to_specific_terrain`(35)、`border_fuzziness`(4)、`base_elevation`(1)

### `<OBJECTS_GENERATION>` —— 58 种（**最多**）
`avoid_actor_area`(26157)、`create_object`(9233)、`number_of_objects`(7787)、`actor_area_radius`(6959)、`actor_area`(6388)、`set_gaia_object_only`(5285)、`set_place_for_every_player`(4863)、`min_distance_group_placement`(3679)、`temp_min_distance_group_placement`(3634)、`min_distance_to_players`(3531)、`actor_area_to_place_in`(2806)、`max_distance_to_players`(2629)、`number_of_groups`(2472)、`terrain_to_place_on`(2001)、`max_distance_to_other_zones`(1931)、`avoid_forest_zone`(1832)、`find_closest`(1622)、`avoid_cliff_zone`(1544)、`second_object`(1499)、`min_distance_to_map_edge`(940)、`set_scaling_to_map_size`(800)、`group_placement_radius`(726)、`set_tight_grouping`(535)、`set_loose`(457)、`set_loose_grouping`(347)、`place_on_forest_zone`(264)、`place_on_specific_land_id`(259)、`set_circular_placement`(244)、`set_gaia_unconvertible`(109)、`ignore_terrain_restrictions`(85)、`building_architecture`(72)、`layer_to_place_on`(67)、`resource_delta`(57)、`set_facet`(50)、`force_placement`(42)、`enable_tile_shuffling`(39)、`find_closest_to_map_center`(29)、`group_variance`(27)、`override_actor_radius_if_required`(22)、`set_scaling_to_player_number`(19)、`require_path`(13)、`find_closest_to_map_edge`(11)、`make_indestructible`(10)、`effect_amount`(8)、`avoid_other_land_zones`(4)、`set_building_capturable`(2)、`generate_for_first_land_only`(2)、`avoid_all_actor_areas`(1)、`avoid_actor`(1)、`temp_min_distance_to_players`(1)、`other_zone_avoidance_distance`(1)

### `<CONNECTION_GENERATION>` —— 16 种
`replace_terrain`(727)、`terrain_cost`(693)、`terrain_size`(607)、`create_connect_all_players_land`(78)、`create_connect_teams_lands`(22)、`create_connect_all_lands`(20)、`create_connect_to_nonplayer_land`(11)、`create_connect_land_zones`(9)、`accumulate_connections`(2)

### 段外（NONE）—— 重点
实测有 **约 100 种指令**出现在段落标签之外，原因就是 §2 说的「`.inc` 不带段落标签」。出现最多的：
`elseif`(5258)、`if`(4020)、`endif`(4011)、`percent_chance`(3995)、`avoid_actor_area`(2165)、`create_terrain`(671)、`create_object`(593)、`effect_amount`(507)…
→ **解释器不能按"段"来切分执行**，必须按「include 展开后的线性文本 + 段状态机」来处理。

---

## 4. 预处理

| 指令 | 语义 | 实测 |
|---|---|---|
| `#const NAME 值` | 定义常量，值可以是表达式（如 `(COASTAL_TILES / 2)`） | 全库 43983 次 |
| `#define NAME` | 定义布尔旗标（无值） | 全库 14314 次 |
| `#include_drs 路径` | 包含文件 | 全库 2992 次 |

- 🔴 **实测没有纯 `#include`**（0 命中），只有 `#include_drs`。
- 路径形态：`#include_drs includes/scaling.inc`（`Arabia.rms:12`）—— `includes/` 是子目录，路径相对脚本根。
- 可嵌套（`scaling.inc` 自己又 include 了 `includes/helpers.inc`）。

---

## 5. 流程控制

### 5.1 `if / elseif / else / endif`
- 🔴 **判据只有裸符号名**，只判「这个符号有没有被 `#define`」。
- **实测无比较运算**：形如 `^\s*if\s+[\w_]+\s*[<>]` **零命中**；24002 行 `if/elseif` 里 23968 行是裸符号，另 34 行是「符号 + 注释」。
- 也**没有** `!`、`&&`、`||`、括号条件（未见）。
- 可任意嵌套（`F_seasons.inc` 里 `if` 套 `start_random`，`percent_chance` 分支里再放 `#const` 和 `if/else/endif`）。

### 5.2 `start_random / percent_chance / end_random`
- `percent_chance N` 是随机分支的权重。用法（`Arabia.rms:16` 起）：
  ```
  start_random
      percent_chance 9
          ...
      percent_chance 10
          ...
  end_random
  ```
- 全库 `start_random` 3013 次 / `end_random` 3014 次 / `percent_chance` 11369 次。
- ⚠️ **未证实**：`percent_chance` 的精确归一化规则（是否按总和归一、并列时怎么取）。需要实测反推。

---

## 6. 🔴 内置旗标（宿主必须提供什么）

分成两类，**这个区分很重要**：

### (a) 引擎注入 —— 解释器**必须自己注入**，脚本没有定义
| 类别 | 旗标（实测出现次数） |
|---|---|
| 地图尺寸/类型 | `TINY_MAP`(759)、`LUDIKRIS_MAP`(162)、`MEDIUM_MAP`(110)、`SMALL_MAP`(54)、`NOMAD_MAP`(50)、`HUGE_MAP`(49)、`GIGANTIC_MAP`(41)、`LARGE_MAP`(37)、`HORIZONTAL_MAP`(15)、`TROPICAL_MAP`(12) |
| 玩家数 | `1_PLAYER_GAME`(168) ~ `8_PLAYER_GAME`(26) |
| 游戏模式 | `ANTIQUITY_MODE`(55) 等 |
| RMS 尺寸档 | `MAPSIZE_MINI`(106)、`MAPSIZE_TINY`(45)、`MAPSIZE_MEDIUM`(32)… |
| 脚本自定义（不算内置） | `MAPSCALE_MODIFIER`（`Arabia.rms:11` 里 `#const MAPSCALE_MODIFIER 1`）、`COLLAPSE`、`DEBUG_MODE` 等 |

### (b) 脚本自己算出来的 —— **不用注入**，解释器正确执行 `#define`/`#const` 就能得到
- `MAPSIZE_BELOW_*` / `MAPSIZE_ABOVE_*` 全套 —— 在 `includes\helpers.inc:1-208` 用 `#define` 定义（按 `MAPSIZE_*` 分支）
- `PLAYER_COUNT`、`PLAYER_COUNT_ODD` / `PLAYER_COUNT_EVEN`
- `MAPSIZE_SIDE`、`MAPSCALE_SIDE`、`MAPSIZE_AREA`、`MAPSCALE_AREA`
- `ONE_GENERATION` ~ `N_GENERATION`（`forest.inc:1` 起，按玩家数）
- `BIOME_*`（`themes.inc`，按气候）

---

## 7. 🔴 两套地图尺寸体系（最容易踩的坑）

**本机同时存在两份尺寸定义，名字错位、含义不同：**

**① `EnlargeMap.inc`（顶层，13 行）—— 游戏界面档位**
```
TINY_MAP      → override_map_size 144
SMALL_MAP     → 168
MEDIUM_MAP    → 200
LARGE_MAP     → 220
HUGE_MAP      → 240
GIGANTIC_MAP  → 255
```

**② `includes\scaling.inc` —— RMS 内部的尺寸档（边长）**
```
MAPSIDE_MINI 80 / BASE 100 / TINY 120 / SMALL 144 / MEDIUM 168 / NORMAL 200 /
LARGE 220 / HUGE 240 / GIANT 252 / MASSIVE 276 / ENORMOUS 300 / COLOSSAL 320 /
INCREDIBLE 360 / MONSTREOUS 400 / LUDICROUS 480
```
并且：
```
#const MAPSIZE_SIDE   (MAPSIDE_x * MAPSCALE_MODIFIER)
#const MAPSCALE_SIDE  (MAPSIZE_SIDE / MAPSIDE_BASE)
#const MAPSIZE_AREA   (MAPSIZE_SIDE * MAPSIZE_SIDE)
#const MAPSCALE_AREA  (MAPSIZE_AREA / 10000)
```

⚠️ **两套名字是错位的**：界面 **Tiny ＝ 144 格**，而 RMS 的 `MAPSIZE_TINY ＝ 120`、`MAPSIZE_SMALL ＝ 144`。
→ 即「界面 Tiny」对应的 RMS 旗标是 **`MAPSIZE_SMALL`**，不是 `MAPSIZE_TINY`。

🔴 **项目文档 `docs/02-design/de-map-algorithm.md` §4 的尺寸表只抄了 ①**（TINY 144 / SMALL 168 / MEDIUM 200 / LARGE 220 / HUGE 240 / GIGANTIC 255），**没提 ② 这一套**。项目里所有「DE 密度换算」都建立在那张表上 —— 用之前必须确认**指的是界面档位还是 RMS 档**，否则会差一档（144→120 就是把格子数算错 44%）。

---

## 8. 指令语义分级（哪些直接做、哪些要实测）

### A. 语义明确（可照名字 + 项目已有实测取值直接实现）
`create_terrain` / `base_terrain` / `land_percent` / `number_of_clumps` / `number_of_tiles` / `height_limits` / `spacing_to_other_terrain_types` / `set_flat_terrain_only` / `clumping_factor` / `set_scale_by_size` / `set_scale_by_groups` / `create_object` / `number_of_objects` / `terrain_to_place_on` / `min_distance_group_placement` / `temp_min_distance_group_placement` / `group_placement_radius` / `number_of_groups` / `second_object` / `actor_area` / `actor_area_radius` / `actor_area_to_place_in` / `avoid_*` / `find_closest*` / `min_distance_to_map_edge` / `create_land` / `base_size` / `land_position` / `terrain_type` / `*_border` / `border_fuzziness` / `create_elevation` / `spacing` / `enable_balanced_elevation` / `min|max_number_of_cliffs` / `cliff_type` / `min|max_length_of_cliff` / `cliff_curliness` / `min_distance_cliffs` / `replace_terrain` / `terrain_cost` / `terrain_size`

### B. 可推断（有上下文证据，**建议实测确认**）
| 指令 | 反推结论 | 证据 |
|---|---|---|
| **`terrain_mask`** | ✅ **已由官方 DE 文档证实**：*"force a terrain to **mask over or under** another with values 1 and 2 respectively"* —— **1 ＝ 遮罩在基础地形之上**（官方注释 `/* SNOW is masked on top of GRASS */`）、**2 ＝ 遮罩在基础地形之下**。⚠️ **我原先反推的「1=陆地域／2=水域」是错的**（那只是"水通常铺在下层"的巧合），已更正。**联动**：用 `terrain_mask 1` 时后续物件须用 `layer_to_place_on` 引用它；`terrain_mask 2` 或未遮罩才用 `terrain_to_place_on`。出处：<https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/rms-features> | 取值只有 1(1855)/2(482)。**观测分布**（仅作佐证、不作判据）：mask=1 所在块多为陆地层（`BASE_TERRAIN`、`BASE_BLEND_A/B/C/D`、`SNOW_LIGHT`、`LAYER_A/C`、`DIRT3`）；mask=2 多为水/覆盖层（`WATER_SHALLOW`←`WATER_MEDIUM`、`WATER_MEDIUM`←`WATER_DEEP`、`POND_OVERLAY`）——**符合"水被压在下层"的用法，但不是语义本身** |
| `set_facet rnd(0,8)` | 物件外观变体/朝向 | `Aquarena.rms:991`，与 `set_gaia_object_only` 同块 |
| `land_conformity` | 陆地形状规整度 | `includes/islands.inc:19`，与 `set_circular_base`、`clumping_factor` 同块 |
| `generate_mode 1` | 区域填满模式 | `Graveyards.rms:119`，与 `border_fuzziness`、`min_placement_distance` 同块 |
| `enable_tile_shuffling` | 打乱铺法（避免规则排列） | `includes/capture_relic.inc:42`，与 `find_closest`、`set_circular_placement` 同块 |

### C. 需实测反推 / 可以先跳过
| 指令 | 说明 |
|---|---|
| `effect_amount SET_ATTRIBUTE <物件> <属性> <值>` | **改 DAT 属性**的引擎级指令（`includes/constants.inc:141` 做兼容 shim）。**对地图形态无影响 → 先跳过** |
| `group_variance`(27/60) | 文档说"正态扰动"但无 RMS 出处 → 需实测 |
| `set_tight_grouping`(535/666)、`set_loose`(457)、`set_loose_grouping`(347) | 成团松紧，精确几何需实测 |
| `direct_placement`(29)、`set_scaling_to_map_size`(800)、`set_scaling_to_player_number`(19) | 缩放公式需实测 |
| `behavior_version`(30)、`ai_info_map_type`(419)、`water_definition`(56)、`grouped_by_team`(46) | 元信息，可能可忽略 |
| `make_indestructible`(10)、`set_building_capturable`(2)、`resource_delta`(57)、`building_architecture`(72) | 玩法属性，与地形无关 |

---

## 9. 依赖文件地图（建议的阅读顺序）

| 文件 | 大小 | 作用 |
|---|---|---|
| `EnlargeMap.inc` | 251 B | 界面档位 → 格数 |
| `includes\scaling.inc` | — | 尺寸档 → `MAPSIZE_SIDE` / `PLAYER_COUNT` |
| `includes\helpers.inc` | 18 KB | 派生旗标 `MAPSIZE_BELOW/ABOVE_*` |
| `includes\preliminaries.inc` | — | 开局分支（`CONFINED_SETUP` / `SPACIOUS_SETUP` 等） |
| `includes\constants.inc` | 57 KB | 物件/地形 ID 常量 |
| `includes\themes.inc` | 118 KB | 生物群系 → 素材/动物映射 |
| `includes\forest.inc` | 92 KB | 森林生成（438 个 `create_terrain`） |
| `includes\water_blending.inc` | 19 KB | 水岸过渡（含 `terrain_mask 2` 的用法） |
| `includes\coastal_blending.inc` | 2 KB | 海岸过渡（含 `terrain_mask 1`） |
| `includes\mainland.inc` | 20 KB | 大陆生成 |
| `includes\starting_resources.inc` | 52 KB | 开局资源 |
| `Arabia.rms` | — | **最好的入门样本**（结构完整、参数典型） |
| `Acclivity.rms` | — | **分层铺满的最佳样本**（`height_limits` + `base_terrain` 叠层） |

---

## 10. 项目内已有资产（可直接复用）

> ⏳ 本节待补：另有一路调研正在汇总「仓库内 DE 地图相关资产」（含被删掉的 `buildGroundVariation` 旧实现 —— 那 335 行是**照 DE 规则写的 TS 实现**，是现成参考）。

**已确认存在的关键资产：**

| 资产 | 位置 | 能解决什么 |
|---|---|---|
| DE 制图算法全量统计 | `docs/02-design/de-map-algorithm.md` | 六段流程、各指令实测取值分布、逐项对齐表（⚠️ §6「已全部实现」已过期） |
| 资源摆放算法 | `docs/02-design/de-resource-placement-algorithm.md` | 资源/物件摆放规则 |
| DE 导出真图 | `public/de-maps/*.json`（17 张） | **DE 自己算出来的真地形矩阵 + 真物件坐标**，用来做校准基准 |
| 导出工具 | `tools/de-map-export.py` | DE 场景编辑器跑官方 RMS → `.aoe2scenario` → JSON（需本机 DE ＋ `AoE2ScenarioParser` ＋ `genieutils`） |
| DE 真图渲染 | `scratch/render_de_map.mts` | 离线把 DE 真图出成 PNG（简化合成，无撕边/blends） |
| 数值对账 | `scratch/cmp_forest.mts`、`scratch/cmp_elevation.mts` | 量「DE vs 我们」的森林占比、高程占比 |
| 素材 | `public/SUCAI_TERRAIN`（89 张 ＋ `blends/` 10 张）、`SUCAI_NATURE`（119 个目录）、`SUCAI_BUILDING` | DE 原图 |
| 物件映射表 | `tools/scene13-atlas/de-map.ts:42` `DE_OBJECT_TO_ASSET` | ⚠️ **只有 20 条** → DE 真图可画率仅 15.4%~43.5%，是当前最大短板 |

⚠️ **注意三个已知的坑**（别被误导）：
1. `docs/02-design/de-map-algorithm.md` §6 的**「已全部实现」是过期账**：核心的 `<TERRAIN_GENERATION>` 多层铺满（`base_terrain` 叠层 / `height_limits` / `clumping_factor`）在 2026-08-26（commit `77346dd4b`，-335/+39 行）被掏成空壳；
2. 同一个文件 §6.3 写「`<CLIFF_GENERATION>` ✅ `buildCliffs`」—— **`buildCliffs` 函数全库不存在**，只剩一句注释；
3. 在 Node 下跑 `scratch/cmp_*.mts` / `tools/audit-decor-density-vs-de.mts` 会刷 `ReferenceError: Image is not defined`（`WaterMaskSampler`/`ElevationSampler` 要浏览器的 `Image`），**"我们"那一侧的数字是在高程采样失败的退化条件下算出来的** —— 趋势可信，精确值不可信。

---

## 11. 建议的实施顺序

对应主人定的四步，补上「每步怎么单独验证」：

| 步 | 做什么 | 怎么验证 |
|---|---|---|
| **1** | **解析器 + 预处理器**：`#const`/`#define`/`#include_drs` 递归展开、`if/elseif/else/endif`、`start_random/percent_chance/end_random`、表达式与 `rnd()` | 拿 277 个文件全跑一遍，**要求 0 解析错误**；再用 `Arabia.rms` 打印展开后的旗标表，与手工核对 |
| **2** | **地图引擎核心**：先只做 `create_terrain` ＋ `create_object`，生成 TINY（界面档 144×144）整图，取中间 66×66 当战场 | 与 `public/de-maps/de_map_1.json`（DE 真图，同为 144 图正中切 66）**逐项比**：地形种类占比、物件数、团块大小分布 |
| 3 | **调统计一致** | 用 `cmp_forest.mts` / `cmp_elevation.mts` 那套量法（**先在浏览器或补上 `Image` 后再量**，别用退化值） |
| 4 | 再补 `create_land`、高程、悬崖；渲染层对不上的逐项补 | 逐段对齐 `de-map-algorithm.md` 的机制表 |

**建议的第一个里程碑**：只做解析器 ＋ `Arabia.rms` 的地形与物件，出图与 DE 实机并排看。
**卡点预判**：物件摆放（`<OBJECTS_GENERATION>`，58 种指令、`avoid_actor_area` 一个就 26157 次）比地形难得多；建议地形先跑通再碰物件。

---

## 附：完整指令清单（130 个行首 token，按频次）

```
avoid_actor_area 28322   elseif 17595   endif 16276   if 16275
create_terrain 12908   number_of_clumps 11914   percent_chance 11369
base_terrain 10530   land_percent 10389   create_object 9826
number_of_objects 8648   create_land 8529   else 7418   actor_area_radius 7271
number_of_tiles 7155   actor_area 6663   effect_amount 5720
set_gaia_object_only 5624   set_place_for_every_player 5244   base_size 4671
min_distance_to_players 4151   temp_min_distance_group_placement 4002
spacing_to_other_terrain_types 3893   min_distance_group_placement 3873
set_scale_by_groups 3556   max_distance_to_players 3062   end_random 3014
start_random 3013   actor_area_to_place_in 2957   land_position 2870
base_elevation 2815   number_of_groups 2771   terrain_type 2692
terrain_mask 2458   terrain_to_place_on 2144   max_distance_to_other_zones 2072
avoid_forest_zone 2022   find_closest 1855   avoid_cliff_zone 1664
second_object 1593   set_avoid_player_start_areas 1355   top_border 1147
right_border 1141   bottom_border 1120   left_border 1110
other_zone_avoidance_distance 1076   border_fuzziness 1060
group_placement_radius 1036   min_distance_to_map_edge 996   assign_to 963
clumping_factor 951   circle_radius 923   set_scaling_to_map_size 837
height_limits 833   land_id 753   replace_terrain 727   terrain_cost 693
set_tight_grouping 666   zone 611   terrain_size 607   set_scale_by_size 561
set_loose 457   create_elevation 434   ai_info_map_type 426
set_loose_grouping 402   beach_terrain 346   color_correction 330
set_circular_placement 316   create_player_lands 292   random_placement 282
place_on_forest_zone 276   place_on_specific_land_id 266   set_flat_terrain_only 213
spacing 212   spacing_to_specific_terrain 163   effect_percent 161
nomad_resources 152   enable_balanced_elevation 151   ignore_terrain_restrictions 111
set_gaia_unconvertible 109   min_number_of_cliffs 100   max_number_of_cliffs 100
enable_tile_shuffling 92   force_nomad_treaty 88   create_connect_all_players_land 78
building_architecture 72   cliff_type 70   force_placement 67   layer_to_place_on 67
set_zone_by_team 63   group_variance 60   resource_delta 58   water_definition 57
enable_waves 55   require_path 54   set_facet 50   grouped_by_team 46
set_circular_base 37   find_closest_to_map_center 32   behavior_version 31
direct_placement 29   add_object 28   max_length_of_cliff 26   min_length_of_cliff 26
min_distance_cliffs 25   override_actor_radius_if_required 24
avoid_other_land_zones 22   create_connect_teams_lands 22   cliff_curliness 20
create_connect_all_lands 20   set_scaling_to_player_number 19   override_map_size 18
land_conformity 14   find_closest_to_map_edge 13   create_connect_to_nonplayer_land 11
create_object_group 10   make_indestructible 10   create_connect_land_zones 9
min_placement_distance 8   generate_mode 8   set_gaia_civilization 7
set_zone_randomly 3   generate_for_first_land_only 3   set_building_capturable 2
accumulate_connections 2   temp_min_distance_to_players 1   assign_to_player 1
min_terrain_distance 1   avoid_actor 1   avoid_all_actor_areas 1
```
（其中 `if`/`elseif`/`else`/`endif`/`start_random`/`end_random`/`percent_chance` 这 7 个是流程控制词，其余 123 个是地图指令。）

---

_本文所有数字均为 2026-10-08 在本机对 277 个脚本文件的实测结果。DE 更新后应重跑核对。_
