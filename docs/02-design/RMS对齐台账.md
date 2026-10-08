# RMS 引擎 · 对齐台账（我写 · CC 审）

> **规则**：每改一项，在此记一行 —— **状态 + 证据**。
> 状态只有三种：`✅ 已对齐` / `🟡 部分对齐` / `🔴 未做`。
> 🔴 本仓已出现过 4 次「文档说做了、代码里没有」，**没有台账就会重复踩**。
>
> 维护：DD（2026-10-09 起）。目标：**先生成出一张和 DE 一样的地图**。

---

## 一、总表

| # | 项 | 状态 | 证据 / 说明 |
|---|---|---|---|
| 1 | **RMS 解析器**（180 个官方脚本） | ✅ **179/180** | `node tools/rms/parseAll.mjs 3`；唯一失败 `real_world_manchuria.rms` 缺 `MAPSCALE_AREA` |
| 2 | 预处理（`#const`/`#define`/`#include_drs`/`if`/`start_random`） | 🟡 部分 | 主题旗标（`THEME_*`/`BIOME_*`）能正确选中；**但 `RND_*` 系列疑似没生效**（见 #4） |
| 3 | **移速 `spd`** | ✅ 已对齐 DE | `WarTypes.ts` 407 行按 `DE speed × 40`；骑兵 130→56、步兵 55→38、远程 50→38、象/攻城 40→32 |
| 4 | **玩家陆地 `create_player_lands`** | 🔴 **未铺** | 产出地形表里**没有 `SPAWN_PLACEHOLDER`(93)**；疑因 `number_of_tiles`/`base_size` 在嵌套 `if` 里、条件旗标 `RND_SPAWN_FOREST_*` 未定义 |
| 5 | **森林地形链** `93 → 97 → 89 → 10` | 🔴 **断在第一步** | 产出地形表只有基底与混合层（5/9/12/71），**没有 10/89/97/93** |
| 6 | 「森林自动长树」（dat `density=1000`） | ✅ 引擎逻辑正确 | `plantTerrainUnits()` 对 `density>=1000` 每格必长一棵；**但因 #5，森林地形根本没铺到，所以没树** |
| 7 | 物件映射 `DE_OBJECT_TO_ASSET` | ✅ 已修 | 20 → 约 80 条；能画率 103/2272（4.5%）→ 482/2272（21%，**去掉占位物后 98%**） |
| 8 | `GOLD_MINE`/`STONE_MINE` 目录名 | ✅ 已修 | 原值指向不存在的目录 → 15 金 + 6 石全丢；改为 `MINE_GOLD`/`MINE_STONE` |
| 9 | `DE_INVISIBLE` 占位物匹配 | ✅ 已修 | 原写 `PLACEHOLDER2` 但导出名是 `UNKNOWN_1902` → 永远匹配不上；现显式列入 |
| 10 | 动物素材（`SUCAI_ANIMAL`） | ✅ 已支持 | `render_de_map.mts` 增加 `assetDir()`，NATURE 找不到时查 ANIMAL |
| 11 | `create_object_group` | ✅ **已实现** | 组名**不是 `#const`**（解析后仍是符号字符串，`Number()` 得 NaN）→ 先全扫收集 `add_object <id> <权重>`，放置时**按权重逐个随机**（racket 文档：*"each one will be individually randomized"*）。实测 `HUNTABLE_SMALL_A` 产出 2098×7 / 2099×2 |
| 11b | **`number_of_groups 0` ＝「未指定」** | ✅ **已修** | 官方手册 `tc-rms-guide.md:374-376`：*"If no groups are specified, then there will be one group for each object"*。原写法 `!!P.number_of_groups` 对 `[0]` 也是 true → `capGroups = 0` → **一个物件都不放**。修后全图物件 **10910 → 12591**，动物 **23 → 44** |
| 12 | `<CLIFF_GENERATION>` 悬崖 | ✅ **已实现** | DE 里悬崖是**物件**（dat：`Cliff (X) NN` / `Marble Cliff N`，每类 **9 个变体**），**不是地形**（地形表里没有任何 cliff）。基址 `CLIFF_BASE = {0:264, 1:1849, 2:1858, 3:2178, 4:2069}`（Marble 命名格式特殊，是 `Marble Cliff N`）。算法：3×3 粗网格候选（9 格同高程 + 非水）→ `cliff_curliness` 方向游走 → `min_distance_cliffs` 排除周围 → `min_terrain_distance` 排除靠水。实测 3 种子：**41~51 个 cliff 物件 / 9~10 条**；`cliff_type` 随 `cliffs.inc` 的 50/50 随机（Desert/Marble/Default 各出现） |
| 12b | `min_terrain_distance` | ✅ 已实现 | `cliffs.inc:97` 定义；语义同 genie-rms 的 `invalidateArea(minDistanceToTerrain)`——靠水的候选块不许放悬崖。开启后 seed2 的 cliff 由 50 → **41** |
| 12c | **未实现指令总数** | ✅ **清零** | `genMap` 输出已无「未实现的指令」行（此前还有 `CLIFF:min_terrain_distance×1`） |
| 13 | 物件通行地形限制 | ✅ **已实现** | 改用 dat 的 **`unit.terrain_restriction`**（放置类别号），不再按名字正则猜。表 `scratch/de_unit_restriction.json`（2693 条，`export_de_unit_restriction.py` 导出）；水生类别号 **`WATER_RESTRICTIONS = {3,13,19,30}`**（dat 实测反推：13 鲸/海豚/渔船、19 鱼、3/30 战船；陆地对照 7 单位/动物、11 植被、8 矿脉、4 建筑、10 城墙）。缺表时退回名字判据。**副作用是修正了一个 bug**：`1547 = PLACEHOLDER (WATER)` 此前被当陆生物放了 **496 次**，现在只在水中 —— DE 真图 `de_map_1` 里该编号也是 **0** 个 |
| 14 | **地图尺寸口径**（Tiny 是 120 还是 144） | ✅ **已钉死：120 = Tiny、144 = Small** | 证据链：① `includes/scaling.inc:3-4` = `MAPSIDE_TINY 120` / `MAPSIDE_SMALL 144`；② 同文件 `:84 override_map_size MAPSIZE_SIDE`（脚本自己指定实际边长）；③ `Arabia.rms:12 #const MAPSCALE_MODIFIER 1`（系数为 1，故边长就等于 120/144/168…）；④ 侧证：`de_map_1` 是 144，走 `Arabia.rms:840 MAPSIZE_SMALL` 分支的 `circle_radius 34 1` → 34%×144 = 49 格圆心，实测 TC 距中心 46.2（TC 落在陆地内偏移 ≈3 格）。**我此前「144 = Tiny」的说法作废**；引擎 `rmsParse.mjs:301` 的 `SIZE_FLAG` 本就写对（120→TINY / 144→SMALL），**无需改代码** |
| 15 | 同口径并排对比工具 | ✅ 可用 | `npx tsx scratch/render_de_map.mts <A.json> <B.json> out.png` |

---

## 二、本轮（2026-10-09 第 1 轮）做了什么

### 已修
1. **`render_de_map.mts` 重写**：支持任意 JSON 路径 + **左右并排** + `SUCAI_ANIMAL` 支持。
2. **`tools/scene13-atlas/de-map.ts`**：
   - `GOLD_MINE`/`STONE_MINE` 指向不存在的目录 → `MINE_GOLD`/`MINE_STONE`（**15 金 + 6 石此前全丢**）
   - `DE_INVISIBLE` 补 `UNKNOWN_1902`/`UNKNOWN_647`（原键名与导出名不一致，**靠巧合跳过**）
   - 映射表 20 → 约 80 条（含动物）；**推断项已逐条标注 ⚠️**

### 诊断结论（未修，下一轮）
**「森林一棵不长」的完整根因链**：

```
create_player_lands 取不到 number_of_tiles（在嵌套 if 里）→ want = 0 → 93 没铺
  → forest.inc:48  铺不了 97（base_terrain SPAWN_PLACEHOLDER=93）
    → forest.inc:390 铺不了 89 SPAWN_FOREST（base_terrain PLACEHOLDER_TERRAIN_A=97）
      → Arabia.rms:1076 铺不了 10 BASE_FOREST（base_terrain BASE_FOREST_EDGE=89，density=1000）
        → 一棵树都不长
```
**旁证**：DE 真图 66×66 里森林格 552、树 472 棵（0.86 棵/格）；我们森林"格"357（全是混合层）、树 161 棵（**全部来自脚本 `create_object`**，102+35+15+9=161 完全吻合）。

**关键常量**（本主题 `PALAEARCTIC_EUROPE_TEMPERATE`，`Arabia.rms:644-660`）：
| 常量 | 值 | 含义 |
|---|---|---|
| `SPAWN_TERRAIN` / `BASE_TERRAIN` | 12 | Grass 2 |
| `SPAWN_FOREST` / `BASE_FOREST_EDGE` | 89 | Forest, Bush（density=1000） |
| **`BASE_FOREST`** | **10** | **Forest（density=1000，树=FORTR）** |
| `BASE_FOREST_VARIATION_A/B` | 19 / 104 | Pine Forest / Forest Autumn |
| `BASE_BLEND_A/B/C/D` | 5 / 9 / 12 / 12 | 混合过渡层（**我们只铺到了这一层**） |
| `SPAWN_PLACEHOLDER` | 93 | 玩家陆地（`constants.inc:101`） |
| `PLACEHOLDER_TERRAIN_A` | 97 | 森林母体（`constants.inc:104`） |
| `FOREST_PLACEHOLDER` | 99 | 全局森林占位（`constants.inc:103`） |

### dat 反查（本轮新增的权威清单）
- **`terrain_unit_id` 是数组**（30 槽位），配 `terrain_unit_density`；**`density == 1000` 才表示"每格必长"**
- **dat 里"真森林"共 24 种**（density≥1000）：`10 Forest`、`13 Palm Desert`、`17 Jungle`、`18 Bamboo`、`19 Pine Forest`、`20 Oak Bush`、`21 Snow Forest`、`48 Dragon`、`56 Rainforest`、`88 Mediterranean`、`89 Forest Bush`、`90/91/92 Reeds`、`104 Autumn`、`105 Snow Autumn`、`106 Dead Forest`、`110 Birch`、`112 Palm Grass`、`113 Lush Bamboo`、`128 Dry South American`、`131/132 Spruce`、`133 Oak Green`
- `Underbrush`(5) / `Underbrush, Leaves`(71) **不在其中**（density 全 0）—— 所以"铺 Underbrush"永远不会长树

---

## 三、下一轮待办（按优先级）

| 优先级 | 待办 | 依据 |
|---|---|---|
| **P0** | 查 `start_random/percent_chance` 有没有真正 `#define` 出 `RND_*` 旗标（打印引擎的 define 集合核对） | #4 |
| **P0** | 修 `create_player_lands`：嵌套 `if` 里的 `number_of_tiles`/`base_size` 要能取到；铺出 93 | #4 |
| **P1** | 让 `create_terrain` 支持"多级链"（铺在上一级产出的地形上） | #5 |
| **P1** | 森林面积对账（DE 552 格 vs 我们 357） | 校准 |
| **P2** | `create_object_group`（racket 文档：按概率随机取一个，每个独立随机） | #11 |
| **P2** | `<CLIFF_GENERATION>`（genie-rms 算法已整理进 `RMS引擎语义-给CC.md` §12.7） | #12 |
| **P2** | 物件通行地形限制改用 dat（`blend_type === 3` 才是水） | #13 |

---

## 四、🔴 本轮**排除**的假设（避免去修不存在的问题）

排查「森林一棵不长」时依次验证了三个假设，**全部排除** —— 记下来防止下轮重复走：

| 假设 | 结论 | 证据 |
|---|---|---|
| 解析器没展开嵌套 `if`，导致 `number_of_tiles` 取不到 | ❌ **排除** | `node scratch/_diag_player_lands.mjs` 打出 block 完整：`terrain_type 93` / `number_of_tiles 1450` / `base_size 16` / `circle_radius 34 1`；常量全部正确展开（93/97/89/10/19/104） |
| `land_percent` 的分母用错（官方说 "total land"，我们用 base 格数） | ❌ **排除**（本 case 无影响） | `PLACEHOLDER_TERRAIN_A` 的 `land_percent 100` 无论分母取哪个都 ≥ 候选区，结果同为"铺满候选区" |
| `circle_radius` 被当百分比是错的（怀疑单位是格数） | ❌ **排除** | 读 `default1.aoe2scenario` 实测：玩家 TC 距中心 **46.2 / 46.1** 格；而 `34% × 144 = 49` —— **百分比解释吻合** |

**「66×66 裁剪区没有森林」的真因**：**出生地角度是随机的**。
- DE 那张图两个出生地在 (43,108) 与 (113,51)，**对角分布**，森林内侧压进裁剪区；
- 我们 seed2 抽到的角度让森林落在裁剪区外；
- **全图森林其实是 12%**（`Forest 4.9% + Forest Bush 4.5% + Pine 2.0% + Autumn 0.6%`），与 DE 的 12.7% **量级相当**。

🔴 **由此确认**：`default1`（亚洲主题：Bamboo/Lush Bamboo/干草）与我们的 `Arabia`（欧洲温带主题：Forest/Birch/Pine）**根本不是同一张图**，逐项对账不成立 —— **必须先有「同脚本 + 同尺寸 + 同主题」的 DE 基准图**（CC 任务 3）。

### 4.1 下一轮改做「不依赖基准图」的项

既然对账被基准图卡住，下轮改为推进 CC 列的、**不需要 DE 基准图就能做**的两项：

| 优先级 | 待办 | 依据 |
|---|---|---|
| P1 | **`create_object_group`**（racket 文档：*"List a selection of objects with probabilities…每个独立随机"*；块内只有 `add_object <obj> <数量>`） | 引擎自报 ×3 未实现 |
| P1 | **`<CLIFF_GENERATION>` 悬崖**（genie-rms 算法已整理：3×3 粗网格找同高程草地块 → `curliness` 方向游走 → 坐标 ×3+1 落笔） | 引擎完全无悬崖 |
| P2 | 物件通行地形限制改用 dat（`blend_type === 3` 才是水；`is_water` 是深度档不是布尔） | "鱼只放水里"目前按名字猜 |

---

## 五、多种子统计对账（第 5 轮，66×66 同口径）

`node tools/rms/genMap.mjs Arabia.rms <seed> 144` × 6 个种子，对照 `public/de-maps/de_map_1.json`：

| 指标 | DE `de_map_1`（66×66） | 我们（66×66，seed 1~6） | 判断 |
|---|---|---|---|
| 地形种类 | 8 | 3 / 6 / 9 / 7 / 7 / 6 | ✅ 量级相当 |
| 有高度格子 | 23.4% | 14.4 ~ 23.2%（均 17.4%） | 🟡 略低 |
| **高程最大值** | **3** | **3**（6/6） | ✅ **完全一致** |
| 物件总数 | 1930 | 2405 ~ 2946 | 🔴 +42% |
| **占位物 `PLACEHOLDER_GENERIC`(1902)** | **1063（55%）** | **2231（82%）** | 🔴 **多 110%** |
| **扣掉占位物的真实物件** | **867** | **501** | 🔴 **反而少 42%** |
| 真实物件里的树 | **472** | **152** | 🔴 **少 68%** |
| 森林密度（全图口径） | **0.855 棵/格**（552 格 : 472 棵） | 0.64 ~ 0.74 | 🟡 略低 |

🔴 **更正（第 6 轮）**：第 5 轮写的「物件/树偏多 40%」是**口径混用**导致的误判 —— 我拿**我们的全图树数**去比 **DE 的 66×66 树数**。
同口径重算后的真相：**占位物偏多抬高了总数；扣掉占位物，真实物件反而少 42%、树少 68%**。

**下一轮抓手**：

1. **占位物 1902 偏多 2.1 倍**。它是 `PLACEHOLDER_GENERIC`（`constants.inc:116` / `GeneratingObjects.inc:10`），由 **4+ 条** `create_object 1902` 放出，每条都写 `number_of_objects 2048`（DE 社区惯例：2048/4096 = 「尽量多」）＋ `place_on_specific_land_id 420`（= `Arabia.rms:789` 唯一那处 land_id，即全图底层，我们实测占 17836 格/86%，**几乎不构成限制**）＋ `max_distance_to_players 28.8 / 46.8 / 57.6`。
   ✅ **第 7 轮已查明并修复**：`temp_min_distance_group_placement` 不是主因；真凶是 **`max_distance_to_players` 在未写 `set_place_for_every_player` 时被整段跳过**（引擎 `okTile` 的 `if (s) {…}` 把 `s=null` 当成"不检查"）。`object_setup.inc:3/16/29` 那 3 条 `PLACEHOLDER_GENERIC` 正好都没写它 → **全图乱放**。
2. **森林密度略低**（0.64 vs 0.855）。对 `density>=1000` 目前是「每格必长」，而 DE 实测 **0.855 棵/格** —— **说明 DE 并非每格必长**，那 14.5% 的缺口来自哪（候选：占位物抢位、或相邻格排斥）需再查。

⚠️ **本表只能说"结构量级"**：`de_map_1` 是**亚洲主题**（Bamboo/Lush Bamboo/干草），Arabia 是**欧洲温带主题**（Forest/Birch/Pine），地形组成本就不该相同。**逐项定案仍需同脚本基准图**。

---

### 5.1 第 7 轮修复与实测

**已修**：`max_distance_to_players` 不再依赖 `set_place_for_every_player`（`s=null` 时改按「最近的玩家」算距离）。

| 指标 | 修复前 | 修复后 | DE |
|---|---|---|---|
| 1902 总数（全图 144） | 9222 | **6758** | ~4800（外推） |
| 其中越界（>57.6 格） | 3337（36%） | **608** | **0** |
| 全图物件 | 13091 | **9951** | — |
| 66×66 占位物 | 2231 | **2213** | 1063 |

**剩余越界的 608 个**来自另一类条目（`herdable.inc:123` / `huntable.inc:148`）：`number_of_objects 1024` + **`actor_area_to_place_in 550/600`**（只在羊/鹿的 actor_area 内放）—— 这条限制引擎**已实现**（`areaGrid`），所以不是 bug。

**第 8 轮已实现 `set_circular_placement`**（语义为**实证推断** —— 官方手册与 racket 均无此词条）：

- **依据**：① 本机脚本里它**总是与 `min_distance_to_players` 配对**（`Arabia.rms:1624-1625 / 1713-1714 / 1736-1737`）；② DE 真图侧证 —— `SOLID_OBJECT`（脚本 `number_of_objects 4` + `min_distance_to_players 32`）在 `de_map_1` 里**只出现 2 个**，说明它是**把候选收紧到一圈**，再被 `avoid_forest_zone` / `max_distance_to_other_zones` 排掉一部分。
- **实现**：候选生成改为「距玩家 ≈ 固定半径的圆环」（半径取 `min_distance_to_players`；未给 min 则取 `max_distance_to_players`；±1 格抖动防整格化重叠）。必须在**候选生成**处改 —— 只靠 `okTile` 拒绝的话，随机撒点命中圆环的概率太低，一个都放不出来。

| 指标（66×66 同口径） | 第 7 轮后 | **第 8 轮后** | DE |
|---|---|---|---|
| 1902 占位物 | 2213 | **767** | 1063 |
| 与 DE 的偏差 | +108% | **−28%** | — |
| 全图 1902 | 6758 | **2610** | — |
| 66×66 物件总数 | 2732 | **1287** | 1930 |
| 全图物件 | 9951 | **5756** | — |

**下一个 gap**：**真实物件（扣掉占位物）仍少 40%** —— 66×66 里我们 **520** vs DE **867**。

### 5.2 森林分布分析（第 9 轮）

**账算清了：不是面积问题，是分布问题。**

| | 我们（全图 144） | DE（66×66 裁剪） |
|---|---|---|
| 森林总面积占比 | **11.9%**（2459 格） | **12.7%**（552 格） |
| 距玩家 ≤46.8 | 457 | 251 |
| 距玩家 ≤57.6 | 428 | 40 |
| **距玩家 >70** | **397（16%）** | **0** |

**按地形分组（我们）**：`Forest`(10) 1010 格（>70: 131）｜`Forest, Bush`(89) 924（>70: 165）｜`Pine Forest`(19) 410（>70: 83）｜`Forest, Autumn`(104) 115（>70: 18）
→ **每一套森林都有 13~20% 铺到了 70 格以外**。

**机制定位（`forest.inc`）—— 森林有两条来源链，我们两条都在跑**：

| 链 | 起点 | 范围 | 走向 |
|---|---|---|---|
| **A** | `Arabia.rms:952` `create_terrain FOREST_PLACEHOLDER`（99；`base_terrain BASE_TERRAIN`＝**全图**；`land_percent 6~10`） | **全图均匀** | `forest.inc:1801` `create_terrain SPAWN_FOREST { base_terrain FOREST_PLACEHOLDER land_percent 100 }` → 89 → `Arabia.rms:1076` `BASE_FOREST` → 10 |
| **B** | `forest.inc:48` `create_terrain PLACEHOLDER_TERRAIN_A { base_terrain SPAWN_PLACEHOLDER }`（93＝玩家陆地） | **出生地附近** | 97 → 89 → 10 |

**DE 真图的森林全部落在出生地 ≤57.6 格内（>70 为 0）** → DE 侧似乎**只有 B 链产出了真森林**，A 链那条全图的没变成森林。**我们两条都跑，所以森林铺到了全图。**

⚠️ **待定案**：`de_map_1` 的主题与我们的 Arabia **不同**（它含 `Forest, Mediterranean`(88)，属另一支），所以还需**同脚本基准图**判定 DE 侧到底是「A 链被清掉」还是「A 链的 `land_percent` 很小」。

## 六、🔴 重大发现：本机已有完整 DE 基准图（第 10 轮）

`public/de-maps/` 里除 `de_map_1.json` 外，还有 **16 个 `medi_*.json`** —— 它们是
**`Mediterranean.rms`（官方脚本）+ 144×144（= Small 档）** 的**分块导出**：
块宽 66、步长 26（`crop.offset / offsetY ∈ {0,26,52,78}`），**16 块合起来正好覆盖 0~144**。

**已拼成完整图**：`node scratch/_assemble_de_reference.mjs` → `scratch/de-ref/Mediterranean_144_full.json`
（**空洞 0 格**｜地形 8 种｜物件 9254）

| 地形 | 占比 |
|---|---|
| `Dirt 3`(3) | 41.6% |
| `Underbrush`(5) | 18.7% |
| `Water, Shallow`(1) | 11.3% |
| `Water, Medium`(23) | 10.5% |
| `Forest, Mediterranean`(88) | 9.2% |
| `Dry Grass`(100) | 5.2% |
| `Beach`(2) | 2.5% |
| `Forest`(10) | 1.0% |

物件 TOP：`UNKNOWN_647:6612`（占位）｜`TREE_ITALIAN_PINE:929`｜`TREE_OLIVE:874`｜`TREE_OAK_FOREST:211`｜`TREE_CYPRESS:174`｜`SHORE_FISH:37`

⚠️ **所有 medi 文件的 `source` 都写 `default1.aoe2scenario`，但地形表各不相同 → 该字段不可信**（`de_map_1.json` 同样）。

**拼块的坑**：不能按文件名 `medi_A_B` 猜 x/y 先后（我第一版猜反了，拼出 69% 空洞）；要**用每个文件自带的 `crop.offset/offsetY` 定位**，每块只取自己的「独有区」`[offset, 下一个更大的 offset)`。

### 6.1 用 `defines` 做「同主题对比」

`Mediterranean.rms` 用 `start_random/percent_chance` 选季节（`PH_MEDISOUTH` 55%、`PH_SPRING`/`PH_ALPINE`/`PH_DESERT` 各 15%）。
实测 **`start_random` 实现正确**（`rmsParse.mjs:206-213` 的累加逻辑无误；我们抽到了 `PH_SPRING`，DE 那张是别的）。
→ 要复现 DE 那张图，可**注入 `defines: ['PH_<X>']` 强制同一分支**，实现真正的同主题对比。

### 6.2 🔴 `PH_EXTENDEDSEASONS` 未被注入（已定位，待修）

`F_seasons.inc` 里 **`PH_EXTENDEDSEASONS` 从未被 `#define`，只用 `if` 读（12 处）** → 它必须是**引擎注入的旗标**（同 `MAPSIZE_*`/`THEME_*`）。
**实测证明它是闸门**：注入后 `PH_ALPINE` 的 `WOODIES` 由 19 → **131**。
**DE 侧默认是开的**（否则那些地形常量只能用扩展分支之外的值域）。

### 6.3 🔴 待解释：水面积 80% vs DE 21.8%

```rms
Mediterranean.rms:32-43
create_land { terrain_type VODA  land_percent 80  left/right/top/bottom_border 17  border_fuzziness 40  zone 16 }
```
我们跑出来 **水 80.0%**，DE 基准图只有 **21.8%**（`Water,Shallow` 11.3% + `Water,Medium` 10.5%）。
→ **`create_land` 的 `land_percent` 语义要重新核对**（官方措辞是「percent of **total land**」，不是「占地图的百分比」）。这是下一轮的主攻项。

---

### 6.4 第 11 轮：实现 `*_border`，并发现 DE 的「硬编码圆角」

**已实现** `create_land` 的 `left/right/top/bottom_border`（官方：「Percent from edge to stop land growth」）。
⚠️ **中心点也必须约束在 border 内** —— 否则 base 圆盘整个落在边缘带外、一格都长不出来（我第一版就踩了这个：水从 80% 直接掉到 **0%**）。

| 阶段 | 水占比 | 水的形状（每 12 行取一个跨度） |
|---|---|---|
| 未实现 border | **80.0%** | 铺满全图 |
| 实现 border（中心点未约束） | **0.0%** | 无 |
| 实现 border（中心点已约束） | **44.4%** | **矩形**（1 1 96 96 96 96 96 96 96 96 1 1） |
| **DE 真图** | **21.8%** | 🔴 **圆/椭圆**（1 1 29 51 **67** 67 58 51 51 39 29 1） |

🔴 **官方文档明确说这是引擎的硬编码行为**：

> "Note that the map **land** had a hard-coded feature to **round off edges** to make land look more natural. As maps get smaller (**border > 20%**) they may look less like rectangles and more like **circles or octagons**."

**我们目前是矩形**（跨度恒为 96 = `120−24`），DE 是**中部最宽 67、两端收窄的圆/八边形**。这是下一个要攻的点。

**另一个未解差异**：DE 只铺 **21.8%**，而 border 17% 的可用区是 **43.5%** → **`create_land` 的生长本身也比我们保守**（候选原因：`border_fuzziness 40` 的确切作用，或 TUNE 里标「推断」的 `clumpScale`）。

**回归**：`Arabia.rms` 未退化（物件 5756、森林 5.8%），解析器仍 **179/180**。

---

### 6.5 第 12 轮：实现「圆角」（椭圆近似），形状首次对上

**实现**：border 存在时，把矩形可用区按**内切椭圆**裁切（`((x−ex)/erx)² + ((y−ey)/ery)² > 1` 即拒绝）；**没有 border 时不裁**，保持其它脚本原行为。中心点也一并约束进椭圆的内接方框。

| 阶段 | 水占比 | 每行跨度（每 12 行取一个） |
|---|---|---|
| 矩形（第 11 轮） | 44.4% | 1 1 **96 96 96 96 96 96 96 96** 1 1 |
| **椭圆（第 12 轮）** | **34.8%** | 1 1 1 **63 83 93 96 93 83 63** 1 1 |
| **DE 真图** | **21.8%** | 1 1 **29 51 67 67 58 51 51 39 29** 1 |

✅ **形状已对上**（都是中部最宽、两端收窄的曲线），不再是矩形。

🔴 **剩余差异是「尺寸」**：我们的椭圆最大跨度 **96**（＝ border 可用区宽），DE 只有 **67**。
比值 67/96 = **0.70**，与面积比 21.8/34.8 = **0.63** 同量级 → **DE 的实际可用区比「border 17%」对应的范围更小**。
候选原因（下一轮）：`border_fuzziness 40` 的确切作用（官方措辞 "percent chance per tile of stopping at a border" 有歧义），或 `zone 16` 的作用。

**回归**：`Arabia.rms` 未退化（物件 5756 / 森林 5.8%），解析器 **179/180**。

---

### 6.6 第 13 轮：实现 `border_fuzziness`，定位「填充率」差异

**已实现** `border_fuzziness`（官方：「percent chance per tile of stopping at a border」）。
⚠️ 它必须作用于**椭圆边缘**而不是 border 矩形边缘 —— 第一版加错了位置（加在矩形判定后），结果一点变化都没有，因为**内切椭圆比矩形更严格**，"越过 border"的格子根本走不到那一步。

| 阶段 | 水占比 | 每行跨度（每 12 行） |
|---|---|---|
| 光滑椭圆 | 34.8% | 1 1 1 63 83 93 96 93 83 63 1 1 |
| **＋ fuzziness** | **35.1%** | 1 1 **13** 63 **84 93 96 94 84 65** 1 1 ← 边缘参差 |
| DE 真图 | 21.8% | 1 1 29 51 67 67 58 51 51 39 29 1 |

🔴 **定位到「填充率」差异的根因**：

| | 水平范围 | 填充率 |
|---|---|---|
| 我们 | x 24~119（**96** 格） | 7279 / 96² = **79%** |
| DE | x **22~122（101 格）** | 4524 / (101×99) = **45%** |

**DE 是「范围更大 + 填充更稀」，我们是「范围更小 + 填得更密」**；而且 DE 的水形状是**两个分离区域**（y24~72 右半 + y76~120 左半）。

→ 说明 **DE 里后铺的 `create_player_lands` 会把先铺的内海「切开/覆盖」**；
而我们的 `createLand` 的 `free()` 要求 `landId === -1`，**后铺的 land 永远盖不到已占格**，所以内海是一整块、且填得满。

**这是下一轮要攻的点**：land 与 land 之间的覆盖规则。

**回归**：`Arabia.rms` 未退化（物件 5756 / 森林 5.8%），解析器 **179/180**。

---

### 6.7 第 14 轮：实现 land 覆盖规则；并**修正**上一轮对「两块水」的解释

**已实现**：`create_player_lands` 现在可以压在「中立 land」（`id < 100`）之上，仍不许覆盖别的玩家陆地。
依据：物理上玩家必须有落脚点，而 `Mediterranean.rms` 的内海先占了 80%。

**但实测水占比没变（35.1%）** —— 因为 `create_player_lands { other_zone_avoidance_distance 5 }` 让它**长不到水附近**，
这是**符合脚本要求**的，不是 bug。

🔴 **同时修正上一轮的判断**：上一轮我写"DE 的水被玩家陆地切开" —— **证据不足**。更合理的解释是 **`number_of_clumps`**：

- `Mediterranean.rms` 的 `create_land` **没写** `number_of_clumps`，DE 可能按默认生出**多个团** → 多块水；
- 我们的 `createLand` **固定只有 1 个团**（`this.grow([mine], …)`），所以水永远是**一整块**；
- 佐证：我们的形状曲线**单调增减**（`1 1 13 63 84 93 96 94 84 65 1 1`），
  而 DE 的曲线在 **y=72→76 处跳变**（58 → 86，x 从 61 跳到 27）—— 那是**换了区域**，不是同一个团。

**下一轮**：查 `number_of_clumps` 的默认值与多团生长。

**回归**：`Arabia.rms` 未退化（物件 5756 / 森林 5.8%），解析器 **179/180**。

---

### 6.8 第 15 轮：**再更正** —— DE 的水是 1 个连通分量，差异在「填充密度」

用**连通分量**分析（硬证据，不再依赖"跨度"这种间接指标）：

| | 连通分量 | 格数 | 范围 |
|---|---|---|---|
| DE 真图 | **1 个** | 4524 | x 22~122, y 23~121 |
| 我们 | 1 个 | 7279 | x 24~119, y 24~119 |

🔴 **所以上一轮"DE 是两个团"的判断也错了**。病根是**指标选错**：
「每行跨度」= 该行最左水到最右水的距离，**当一行里有两个分支时跨度会虚高**（DE 的 `y=76` 行跨度 86 就是这样，但它在上下行是连通的）。
**教训：判"分几块"要用连通分量，不能用跨度。**

**真正的差异在「填充密度」**：

| 行 | DE 水的格数 | 占比 | 我们的跨度 |
|---|---|---|---|
| y=68 | 41 / 144 | 28% | ~93 |
| y=72 | **25 / 144** | **17%** | 96 |
| y=80 | 20 / 144 | 14% | ~84 |

**DE 的水内部是「稀疏、带岛屿」的**（同一行水只占 17%，被 `Dirt 3`/`Underbrush`/`Forest`/`Beach` 穿插），
而我们是**实心椭圆**（同一行占 67%）。

**候选原因：`land_percent` 的「分母」**
- 我们：`80% × N² = 16589`，**远超可用区**（椭圆 ≈ 7238）→ 必然填满 → 35.1%
- DE：只填 4524（= 可用区的 **62%**）→ **DE 的 want 不是「地图的 80%」**
- 若按「**可用区的 80%**」算 = 5790（27.9%），与 4524 同量级 ✅

**下一轮**：验证 `land_percent` 是否该按「border 裁切后的可用区」计算。

**回归**：`Arabia.rms` 未退化，解析器 **179/180**。

---

### 6.9 第 16 轮：止损 + 注入 `PH_EXTENDEDSEASONS`（部分生效）+ 疑似长链解析 bug

**① 止损（按第 15 轮自己设的点）**
`border_fuzziness` 按「per tile（每格都掷骰）」解读的假设 —— **实测被证伪**：水直接掉到 **0%**（每次 `free()` 检查都掷骰，生长完全无法推进）。**已回滚**。
→ 内海这条线到此为止。它沿路贡献了 **`*_border` / 硬编码圆角 / `border_fuzziness` / land 覆盖规则** 四项**通用**语义，所以不算白走。

**② 注入 `PH_EXTENDEDSEASONS`**（加进 `rmsParse.mjs` 的默认 defines）
依据：它在 `F_seasons.inc` 里**从未被 `#define`、只用 `if` 读**（12 处）→ 必是引擎注入的旗标。

**实测「部分生效」**：

| 季节分支 | `WOODIES`（注入前 → 后） | |
|---|---|---|
| `PH_ALPINE` | 19 → **131** | ✅ 扩展分支进去了 |
| `PH_MEDISOUTH` | 10 → **10** | ❌ 应当是 88 |
| `PH_SPRING` / `PH_DESERT` | 10 → 10 | ❌ 同上 |

🔴 **决定性线索**：`PH_MEDISOUTH + EXT` 分支（`F_seasons.inc:481-528`）里 `LAYER_A` 的候选值是 **5 / 3 / 100**，我们却拿到**默认值 0** → **`:481` 的 `if PH_EXTENDEDSEASONS` 根本没进去**。

**嫌疑**：`F_seasons.inc` 的 `if/elseif` 链很长 ——
`:9 if PH_ALPINE` → `:274 elseif PH_SPRING` → `:406 elseif PH_SPRING_C` → `:480 elseif PH_MEDISOUTH` → `:694 elseif PH_TROPHICALSOUTH` → …
**位于链首的 `PH_ALPINE` 正常，链中第 4 个 `PH_MEDISOUTH` 异常** → 怀疑 **`elseif` 长链的解析有 bug**（**通用**问题，不只影响内海）。

**下一轮**：查 `rmsParse.mjs` 的 `if/elseif` 链切分（尤其 `elseif` 在长链中的 `hdr` 与区间计算）。

**回归**：`Arabia.rms` 未退化（物件 5756 / 森林 5.8%），解析器 **179/180**。

---

### 6.10 第 17 轮：**更正** —— `if/elseif` 解析没有 bug；真相是「抽到了另一个季节分支」

先怀疑 `elseif` 长链解析有 bug，于是查了 `findIfBranches`（`rmsParse.mjs:120-132`）、手算深度、又用 `unknownIf` 诊断 —— **三次推断全错**。

**真相**：`Mediterranean.rms:11-16` 的 `start_random` 抽到的是 **`PH_SPRING`**（第 10 轮诊断就打印过 `PH_SPRING [已 #define]`），
而 `F_seasons.inc:274 elseif PH_SPRING` **位于 `:480 elseif PH_MEDISOUTH` 之前** → **它先命中** ✅

**而 `PH_SPRING + EXT` 分支（`F_seasons.inc:275-288`）写的正是**：

```rms
:278    #const LAYER_A 0
:280    #const WOODIES 10
```

→ **与我们实测的 `LAYER_A=0` / `WOODIES=10` 完全一致** ✅ **解析器是对的，`PH_EXTENDEDSEASONS` 注入也确实生效了**（`PH_ALPINE` 的 `WOODIES` 19→131 就是证据）。

🔴 **同时暴露：「用 `defines` 强制季节」这个手段本身无效** —— 注入只是**追加**一个 `#define`，
脚本自己的 `start_random` 仍会抽出 `PH_SPRING`，而它在 `elseif` 链上更靠前，照样先命中。

**要对齐 DE 基准图**（`LAYER_A=3` Dirt 3 + `WOODIES=88` Forest,Mediterranean —— 正对应 `PH_MEDISOUTH + EXT` 的 `:493-495`），
必须让脚本**只走那一个分支**。做法（下一轮）：**复制一份 `Mediterranean.rms` 到 `scratch/`，把开头的 `start_random` 段改成单一 `#define PH_MEDISOUTH`** —— **不碰官方脚本**。

**回归**：`Arabia.rms` 未退化（物件 5756 / 森林 5.8%），解析器 **179/180**。

---

### 6.11 🔴 第 18 轮：第一次真正的同季节对比 —— **森林完全对上**

**做法**：复制官方 `Mediterranean.rms` → `scratch/de-ref/Mediterranean_medisouth.rms`，把开头 4 个 `PH_*` 的 `start_random` 换成单一 `#define PH_MEDISOUTH`（**不碰官方脚本**）。
为让项目内脚本跑得起来，给 `tokenizeFile` 加了 `extraDir` 回退（由 `loadScript` 的 `env.rmsDir` 传入）—— **只在官方目录找不到时才用**。

**季节锁定成功**：`LAYER_A=3`（Dirt 3）✅　`WOODIES=88`（Forest, Mediterranean）✅

| 地形 | 我们（同季节） | DE 基准图 | |
|---|---|---|---|
| **`Forest, Mediterranean`** | **9.0%** | **9.2%** | ✅ 几乎完美 |
| **`Forest`** | **1.0%** | **1.0%** | ✅ **完全一致** |
| `Dirt 3` | 29.8% | 41.6% | 🟡 |
| `Underbrush` | **5.0%** | **18.7%** | 🔴 |
| `Dry Grass` | **18.7%** | **5.2%** | 🔴 |
| `Water` 合计 | 35.1% | 21.8% | 🔴 |

🔴 **`Underbrush` 与 `Dry Grass` 的数字【互换】了** —— 查下去发现 `PH_MEDISOUTH + EXT` 里**还有一个 5 分支的 `start_random`**（`F_seasons.inc:482-528`，各 20%）：

| 分支 | LAYER_A | LAYER_B | LAYER_C | |
|---|---|---|---|---|
| `:493-500` | 3 | **5** | **100** | ← **DE 那张图对应的**（Underbrush 多、Dry Grass 少） |
| `:511-518` | 3 | **100** | **5** | ← **我们抽到的**（正好互换） |

→ **不是 bug，是「子分支随机」不同**。

**下一轮**：在副本里**再锁一层** —— 复制 `F_seasons.inc` 到 `scratch/de-ref/`（改名，并把副本的 `#include_drs` 路径改成官方目录里**不存在**的相对路径，以触发 `extraDir` 回退），把 `:482-528` 那个 `start_random` 固定为第 2 支。

**回归**：`Arabia.rms` 未退化（物件 5756 / 森林 5.8%），解析器 **179/180**（指令总数 200941 → 200942，因多注入了 `PH_EXTENDEDSEASONS`）。

---

### 6.12 🎉 第 19 轮：再锁一层后 **4 个地形完全对齐**

**做法**：复制 `F_seasons.inc` → `scratch/de-ref/F_seasons_locked.inc`，把 `PH_MEDISOUTH + EXT` 里那个 5 分支的 `start_random`（`:482-528`）收成第 2 支；副本的 `#include_drs` 指向新文件名（官方目录里没有这个名字 → 触发 `extraDir` 回退）。
⚠️ 为此还得修 `Preprocessor` 的 `extraDir` 传递 —— **`#include_drs` 那处原来没传**（第一次跑直接报 `missingIncludes: F_seasons_locked.inc`，全部常量变 undefined）。

| 地形 | 我们 | DE | 差 |
|---|---|---|---|
| **`Underbrush`** | **18.7%** | **18.7%** | ✅ **+0.0** |
| **`Forest`** | **1.0%** | **1.0%** | ✅ **−0.0** |
| `Forest, Mediterranean` | 9.0% | 9.2% | ✅ −0.2 |
| `Dry Grass` | 5.0% | 5.2% | ✅ −0.2 |
| `Dirt 3` | 29.8% | 41.6% | 🔴 −11.8 |
| `Water, Shallow` | **32.7%** | **11.3%** | 🔴 +21.4 |
| `Water, Medium` | **2.4%** | **10.5%** | 🔴 −8.1 |
| `Beach` | 1.4% | 2.5% | 🟡 −1.1 |

🔴 **4 个地形几乎完全一致** —— 「地形占比」这项任务的**第一个实质突破**。

**剩余差异全部收敛到「水」**，而且里面藏着一个**新发现**：

- 总量：35.1% vs 21.8%（内海偏大，即 §6.4–6.8 那条线）
- 🔴 **深浅比例完全反了**：DE 是 `Shallow 11.3 : Medium 10.5 ≈ 1 : 0.93`，我们是 `32.7 : 2.4 ≈ 1 : 0.07`
- `Dirt 3` 的 −11.8 是**被水挤掉**的（`LAYER_A` 铺在 `base_terrain` 上，而水先占了地）

**下一轮**：查 `Water, Medium`(23) 是谁生成的 —— `VODA` 只给 `Water, Shallow`(1)，DE 却有近一半的水是深水。

**回归**：`Arabia.rms` 未退化（物件 5756 / 森林 5.8%），解析器 **179/180**。

---

### 6.13 第 20 轮：找到「水遮罩」链，并定位它没被执行完

```rms
Mediterranean.rms:61-62
#define WMASK_VODA
#include_drs F_WaterMasking.inc
```

`F_WaterMasking.inc:89-123` 的 `WMASK_VODA` 分支展开成 **10 条 `create_terrain`**（实测 AST 的前 10 条就是它）：

| # | T | base | land% | clumps | mask | 作用 |
|---|---|---|---|---|---|---|
| 1 | **23** MED_WATER | **1** VODA | **40** | 10 | | VODA → 中水 |
| 2 | 23 | 1 | 40 | 10 | | 再来一次 |
| 3 | 57 DLC_WATER4 | 23 | 100 | 1000 | | 中水 → 水4 |
| 4 | **1** VODA | 23 | 100 | 1000 | **2** | 视觉层 |
| 5,6 | 23 | 57 | 100 | 1000 | | 水4 → 中水 |
| 7 | 22 DEEP_WATER | 23 | 20 | 12 | | 中水 → 深水 |
| 8 | 57 | 22 | 2 | 6 | | 深水 → 水4 |
| 9,10 | 23 | 22 / 57 | 100 | 1000 | **2** | 视觉层 |

**验算**：DE 的水 `Medium : Shallow = 10.5 : 11.3 ≈ 48%`，而第 1 条写的正是 **`land_percent 40`** ✅

🔴 **但我们只产出 `Water,Shallow`(1) 32.7% + `Water,Medium`(23) 2.4%，链里的 `22`(DEEP_WATER) / `57`(DLC_WATER4) 一个都没出现** → **这条链没被执行完**。

**下一轮**：查这条链为什么断 —— 重点两处：
① **`terrain_mask` 的处理**（我们把它做成 `layer`，而链里第 4/9/10 条都带 `terrain_mask 2`）；
② **「链式 `base_terrain`」**：每一步的 `base` 都是**上一步的产物**（1→23→57→23→22→57…），任何一步没铺满，后面全部落空。

**回归**：`Arabia.rms` 未退化，解析器 **179/180**。

---

### 6.14 🔴 第 21 轮：找到并修掉两个【通用】真 bug（水链终于跑通）

**诊断手段**：给 `terrainCmd` 加了一个**可选**的逐条 trace（`this.traceTerrain`，默认不开、零影响），打出每条 `create_terrain` 的 `base` / `baseCount` / `target` / **实铺 got**。数据当场指出病灶。

**Bug ① — `terrainCmd` 只改「种子格」的地形**

```js
for (const reg of regions) for (const i of reg) { … this.terrain[i] = T; }   // regions 只有每个团的种子格
```

`grow` 只把吞下的格子记进 `regOf`、**从不回填 `regions`** → 除种子外的格子地形根本没换。
**修**：改为遍历 `regOf` 里属于本条指令的**全部**格子。

**Bug ② — `spacing_to_other_terrain_types` 语义错**

官方：*"how far terrain should be from **other terrain types**（including terrain of the same type）"* → **同类型不算「其它」**。
原写法只比"是不是本团"，于是**同类型的第二条指令**（`Mediterranean.rms` 连写两条 `create_terrain MED_WATER { base_terrain VODA land_percent 40 }`）**一格都铺不出**（实测 `got=0`，而它前面那条刚好留下 1877 格没铺）。
**修**：`const tj = regOf[j] !== -1 ? pending[j] : this.terrain[j]; if (tj !== T && tj !== base) return false;`
⚠️ **必须放行 `base`** —— 5×5 邻域**包含自己**，否则每个候选格都会被自己拒掉（我第一版就是这么写的：`got` 全 0、`Arabia` 森林直接归零）。

**结果**：

| 地形 | 修前 | **修后** | DE |
|---|---|---|---|
| `Water, Medium` | 2.4% | **26.3%** | 10.5% |
| `Water, Shallow` | 32.7% | **8.8%** | 11.3% |
| `Underbrush` | 18.7% | 18.7% | 18.7% ✅ |
| `Forest, Mediterranean` | 9.0% | 9.0% | 9.2% ✅ |
| `Dry Grass` | 5.0% | 5.0% | 5.2% ✅ |
| `Forest` | 1.0% | 1.0% | 1.0% ✅ |

✅ 水链跑通（`Water, Deep` 也出现 4147 格）；**4 个地形仍保持对齐**。
🟡 水**总量**仍是 35.1%（vs DE 21.8%）—— 那是 `create_land` 生长的问题（§6.4–6.8 那条线），与本次修复无关。
🟡 **深浅比例**：现为 `Medium : Shallow ≈ 3 : 1`，DE 是 `1 : 0.93` —— 方向对了，还没到。

⚠️ **这个修复也改变了 `Arabia` 的输出**（森林 5.8% → **7.3%**、物件 5756 → **5907**、地形种类 6 → **8**）。
`de_map_1` 是另一主题、无法直接判"更准了"，但修复本身是**语义正确**的。

**回归**：解析器 **179/180**。

---

### 6.15 🎉 第 22 轮：同主题物件对比 —— **总数几乎一致**（旧结论「少 40%」作废）

用修好的引擎重跑 `Mediterranean_medisouth.rms`（144×144），与完整基准图 `scratch/de-ref/Mediterranean_144_full.json` 对**全图物件**：

**物件总数：我们 9104 ｜ DE 9254（差 1.6%）** ✅

| 我们（id） | | DE（名字） | 差 |
|---|---|---|---|
| 647: 6494 | | `UNKNOWN_647`: 6612 | ✅ −1.8% |
| **1348: 958** | | **`TREE_ITALIAN_PINE`: 929** | ✅ **+3.1%** |
| 1349: 712 | | `TREE_OLIVE`: 874 | 🟡 −18.5% |
| 1347: 228 | | `TREE_OAK_FOREST`: 211 | ✅ +8.1% |
| 69: 218 | | `TREE_CYPRESS`: 174 | 🟡 +25% |
| 411: 207 | | `GRASS_DRY`: 151 | 🟡 +37% |
| 1359: 157 | | `GRASS_GREEN`: 83 | 🟡 +89% |
| 1358: 80 | | `SHORE_FISH`: 37 | 🟡 +116% |
| 264: 19 | | `GOLD_MINE`: 36 | 🟡 −47% |
| 66: 6 | | `FISH_SNAPPER`: 31 | 🔴 −81% |

🔴 **§5「真实物件少 40%」这个结论【作废】** —— 它是在**旧引擎**（`regions` / `spacing` 两个 bug 未修）上量的，而且拿的是**异主题**的 `de_map_1`。
同主题、同口径重测：**总数只差 1.6%** ✅

**仍需细调**：草类偏多（`GRASS_GREEN` +89%、`GRASS_DRY` +37%）、鱼的种类分配不对（`SHORE_FISH` 多、`FISH_SNAPPER` 少）、金矿偏少（−47%）。

**Arabia 森林两条链（新引擎复测）**：链 A 11.3%（2007 格，>70 格 292）｜ 链 B 15.5%（450 格，>70 格 **0**）
→ 与旧数据几乎一致，说明那两个 bug 对**森林分布**影响不大（它们主要影响 `create_terrain` 的铺设量）。

---

### 6.16 第 23 轮：建立可复用的物件对比工具 + **更正对照方法**

**更正**：第 22 轮那张表是「**按数量排序后逐行对齐**」两边的 id/name —— **方法本身是错的**（两边顺序不同，逐行对齐等于乱点鸳鸯）。
实例：我把 `1358`（dat 里是 `Grass Green`）当成了 `SHORE_FISH`（真身是 **69**）；`647` 也不是 `UNKNOWN_647`（dat 叫 `HRICH_D`）。

**新增两件工具**（以后每次物件对比都用它们）：

- `scratch/export_de_unit_names.py` → `scratch/de_unit_names.json`（**2602 条** dat 全表 id → 规范化名）
- `scratch/_compare_objects.mjs` → **三级名字解析**（DE 真图用过的名 → `random_map.def` 物件段 **604 条** → dat 全表）后**逐名**对比

⚠️ 一个坑：`random_map.def` 的名字**必须靠分段注释**（`/* OBJECT TYPES */` 等）定位，否则一条都抓不到（第一版就抓空了）。

**同主题物件对比（更正后）**：总数 **我们 9104 ｜ DE 9254（−1.6%）** ✅

| 物件名 | 我们 | DE | 差 |
|---|---|---|---|
| `TREE_ITALIAN_PINE` | 958 | 929 | ✅ +3% |
| `GRASS_DRY` | 157 | 151 | ✅ +4% |
| `GRASS_GREEN` | 80 | 83 | ✅ −4% |
| `RELIC` | 5 | 5 | ✅ 0% |
| `TREE_OLIVE` | 712 | 874 | 🟡 −19% |
| `TREE_CYPRESS` | 228 | 174 | 🟡 +31% |
| **`SHORE_FISH`** | **218** | **37** | 🔴 **+489%** |
| **`GOLD_MINE`** | **6** | **36** | 🔴 −83% |
| **`STONE_MINE`** | **4** | **22** | 🔴 −82% |
| **`GOAT`** | 4 | 26 | 🔴 −85% |
| **`FISH_SNAPPER` / `FISH_SALMON` / `FORAGE_BUSH` / `MOUFLON`** | **0** | 31 / 12 / 12 / 6 | 🔴 **我们一个都没有** |
| `FOREST_TREE`(我们) vs `TREE_OAK_FOREST`(DE) | 207 / 0 | 0 / 211 | ✅ **同一物、两个名**（207 ≈ 211） |

**清晰的差异模式**：**鱼 / 矿 / 羊 / 浆果少，而 `SHORE_FISH` 多 5 倍** —— 很像「**物种没按主题选**」
（主题物种由 `themes.inc` 的 `SALTWATER_A/B`、`FORAGE_*` 等常量定，与 `LAYER_*` / `WOODIES` 同属"主题常量"一类）。

**下一轮**：查这些主题物种常量在我们的引擎里有没有正确取到。

---

### 6.17 第 24 轮：🔴 找到「物种常量全 undefined」的根因 —— **biome 旗标没注入**

**症状**（第 23 轮的物件对比）：鱼 / 矿 / 羊 / 浆果统统偏少，`SHORE_FISH` 却多 5 倍。

**查证链**：

1. `GeneratingObjects.inc` 里用 `create_object HERDABLE_A` 等（`:252/527/811/4147/4221/4259`），但**这个文件没有任何 `#include_drs`** → 物种常量必须由**外部**提供。
2. 提供方是 `includes/themes.inc`，而它的**顶层分支全是 biome 旗标**：
   `:12 if NEARCTIC_TUNDRA` → `:85 elseif NEARCTIC_TAIGA` → `:238 elseif NEARCTIC_TEMPERATE` → … → `:1338 elseif PALAEARCTIC_EUROPE_TEMPERATE` → `:1529 elseif PALAEARCTIC_EUROPE_MEDITERRANEAN`（共 20 个），
   每个分支里定义 `SALTWATER_A` / `FORAGE_A` / `GOLD_A` / `HUNTABLE_A` / `HERDABLE_A` / `RELIC_A` 等。
3. 🔴 **我们的 `loadScript` 一个 biome 旗标都没注入**（`rmsParse.mjs:311` 只有 `MAPSIZE_*` / `2_PLAYER_GAME` / `PH_EXTENDEDSEASONS`）。

**实测**（`Mediterranean_medisouth.rms`）：

| 常量 | 我们 | 说明 |
|---|---|---|
| `SALTWATER_A` / `FRESHWATER_A` / `FORAGE_A` / `GOLD_A` / `HUNTABLE_A` / `RELIC_A` | **undefined** | ❌ `themes.inc` 分支没进 |
| `WOODIES` = 88 ｜ `LAYER_A` = 3 | 有值 | ✅ 来自 `F_seasons.inc`（与 biome 无关） |

**另外两处澄清**：
- `thebr_setup.inc`（`Mediterranean.rms:24` include）**存在但只有 3 行**（`if BATTLE_ROYALE / /* nomad_resources */ / endif`）——**它不定义主题**；
- `genMap.mjs:68` 打印的"主题"只是**从 `pre.defs` 过滤后缀猜出来的**，**不是注入**（所以别被那行日志误导）。

**下一轮**：查 DE 侧 biome 旗标由什么决定（地图名？气候？UI？）—— `Arabia.rms` 自己会选主题，而 `Mediterranean.rms` **完全不选**，两者都得靠引擎注入。

---

### 6.18 第 25 轮：biome 旗标的两条来源 + 反推「DE 对 Mediterranean 注入了什么」

**发现 1 — `Arabia.rms` 自己 `#define` biome**（脚本内选）

```rms
Arabia.rms:27  #define PALAEARCTIC_EUROPE_MEDITERRANEAN     ← 固定
Arabia.rms:37  percent_chance 9 #define AFROTROPICAL_TROPICAL
…
:45            percent_chance 9 #define PALAEARCTIC_EUROPE_TEMPERATE
```

→ 与第 4 轮"主题由脚本选"一致 ✅

**发现 2 — `Mediterranean.rms` 完全不定义 biome**

它的 include 只有 `F_seasons.inc` / `thebr_setup.inc` / `F_ColorCorrection.inc` / `F_WaterMasking.inc` / `GeneratingObjects.inc` / `GeneratingElevation.inc`
—— **没有 `themes.inc`、也没有任何 biome `#define`** → **只能由引擎注入** ✅

**发现 3 — 反推 DE 的注入值**

DE 基准图里最多的咸水鱼是 **`FISH_SNAPPER`(458)**。`themes.inc` 里 `SALTWATER_A = 458` 只出现在 **4 个分支**：

| 分支 | 行 |
|---|---|
| `NEARCTIC_TEMPERATE` | `:343` |
| `NEARCTIC_DESERT` | `:499` |
| `NEOTROPICAL_TEMPERATE` | `:665` |
| `NEOTROPICAL_TROPICAL` | `:902` |

→ **DE 对 `Mediterranean.rms` 注入的 biome 必是这 4 个之一**。

⚠️ **关键反例**：地理上的"地中海"对应 `PALAEARCTIC_EUROPE_MEDITERRANEAN`，但那个分支给的是 **`457`（Tuna）** —— **对不上**。
所以 **DE 的 biome 不是按地图名/地理定的**（可能是地图的 climate/region 元数据，或另有随机）。

**下一轮**：用**多物种交叉**把候选缩到一个 —— 列出这 4 个分支里的 `FORAGE_A` / `GOLD_A` / `HERDABLE_A` / `HUNTABLE_A` / `RELIC_A`，
与第 23 轮的 DE 物件表（`SHORE_FISH:37`、`FISH_SNAPPER:31`、`FISH_SALMON:12`、`GOAT:26`、`FORAGE_BUSH:12`、`GOLD_MINE:36`、`STONE_MINE:22`、`MOUFLON:6`）逐项对照。

---

### 6.19 🔴 第 26 轮：找到**第三类引擎注入旗标** `GNR_*`（生成规则）—— 它才是「鱼少」的直接原因

**先排除两个嫌疑人**（都用硬证据，不靠推理）：

| 嫌疑人 | 排除理由 |
|---|---|
| **biome**（第 24/25 轮的怀疑） | `SALTWATER_A` / `FRESHWATER_A` **只用在** `aquatic_saltwater.inc` / `aquatic_freshwater.inc`，而 **`Mediterranean.rms` 根本没 include 这两个文件** |
| **常量值** | 实测我们取到的是**正确值**：`FISH_A = 456`(Salmon)、`FISH_B = 458`(**Snapper**)、`HUNTABLE = 2340`(Mouflon)、`HERDABLE_A = 1060`(Goat)、`GOLD = 66`、`STONE = 102` |

**真凶**：`GeneratingObjects.inc:7498-7533`

```rms
if INFINITE_RESOURCES
elseif GNR_STANDARDFISH                    ← 🔑 未定义 → 整段跳过
    create_object MELKARYBA { number_of_objects 9999  set_gaia_object_only  temp_min_distance_group_placement 6/14 }
    if GNR_BIGFISH_DENSE                   ← 🔑 未定义
        create_object FISH_A { number_of_objects 1  number_of_groups 99999  set_gaia_object_only }
        create_object FISH_B { … }
    elseif GNR_BIGFISH_DENSEEXTRA
        …
```

🔴 **`GNR_*` 系列在全库没有任何 `#define`**（查过 `F_seasons.inc` / `themes.inc` / 所有 include）→ **必是引擎注入的旗标**，而我们**一个都没注入** → **整段鱼的生成逻辑被跳过**。

**同类旗标**（都在 `GeneratingObjects.inc` 里当开关）：`GNR_STANDARDFISH` / `GNR_BIGFISH_DENSE` / `GNR_BIGFISH_DENSEEXTRA` / `GNR_SFISH_SPARSE` / `GNR_NORMALBIRDS` / `GNR_ABIRDS_ONLY`。

**这是第三类引擎注入旗标**：

| 类 | 例子 | 影响 |
|---|---|---|
| ① 尺寸 | `MAPSIZE_*` | 地图档位 |
| ② 主题/季节 | `PH_EXTENDEDSEASONS`、biome | 地形、物种常量 |
| ③ **生成规则** | **`GNR_*`** | **鱼 / 鸟 / 装饰的数量与种类** |

**修正第 24/25 轮的结论**：`themes.inc` 的物种常量确实没取到，但**它们不是"鱼少"的原因**（那些常量只服务 `aquatic_*.inc`，本图没 include 它们）。

**下一轮**：从 DE 基准图**反推 `GNR_*` 的取值** —— `SHORE_FISH:37` / `FISH_SNAPPER:31` / `FISH_SALMON:12` 的数量比可以判 `GNR_BIGFISH_DENSE` 还是 `DENSEEXTRA`。

---

### 6.20 🔴 第 27 轮：**更正第 26 轮** —— `GNR_*` 是脚本自己定义的；并定位 DE 走的哪一支

**更正**：第 26 轮我断言"`GNR_*` 全库没有 `#define`，必是引擎注入" —— **错了**。
`Mediterranean.rms:225-229` 自己就写着：

```rms
:225  #define GNR_NORMALBIRDS
:227  #define GNR_MAPSTRAGGLE
:229  #define GNR_STANDARDFISH
```

（第 26 轮我只搜了 `F_seasons.inc` / `themes.inc` / `includes/*.inc`，**漏了 `.rms` 脚本本体**。）

**所以「鱼少」也不是"旗标没注入"** —— `GNR_STANDARDFISH` 一直定义着。

🔴 **真正原因**：脚本**没有**定义 `GNR_BIGFISH_DENSE / DENSEEXTRA / SUPERDENSE` 中的任何一个 → 鱼的放置走 `GeneratingObjects.inc:7573` 的 **`else` 分支**：

| 分支 | FISH_A / FISH_B 的参数 |
|---|---|
| `GNR_BIGFISH_DENSE` | `number_of_objects 1` + `number_of_groups 99999` + 间距 **6** |
| `GNR_BIGFISH_DENSEEXTRA` | 同上 + **`max_distance_to_other_zones 3`** |
| `GNR_BIGFISH_SUPERDENSE` | 同上 + 间距 **4** |
| **`else` ← DE 走的** | **`number_of_objects 6`** + `set_scaling_to_map_size` + **`max_distance_to_other_zones 4`** |

**我上一轮的错误**：在副本里**注入了脚本本来没有的 `GNR_BIGFISH_DENSE`** → 跑到了错分支（`number_of_objects 1` + `99999` 组）→ 鱼 212/214（DE 是 31/12）。

**实验数据**：

| 配置 | 总数 | `FISHS` | `FISH4` | `FISH2` | `HAWK` |
|---|---|---|---|---|---|
| DENSE（我注入的，属错分支） | 9530 | 218 | 212 | 214 | 0 |
| DENSE + `GNR_SFISH_SPARSE` | 9375 | **56** | 215 | 218 | 0 |
| **DE 基准** | **9254** | **37** | **31** | **12** | **8** |

✅ **顺带确认一件好事**：`GNR_SFISH_SPARSE` 把 `FISHS` 从 218 拉到 **56**（DE 37），说明它的作用点找对了（只作用于 `MELKARYBA` 那条的 `temp_min_distance_group_placement 6→14`）。

**下一轮**：① 副本**去掉** `GNR_BIGFISH_DENSE`（让它走 `else`）；② **实现 `max_distance_to_other_zones`**（`else` 分支靠它限位，而我们目前只有注释、没有实现）；③ 查 `HAWK` 为什么是 0（`GNR_NORMALBIRDS` 与 `BIRDS_A/B=96` 都对，`restriction=0` 说明它该放陆地）。

---

### 6.21 🔴 第 28 轮：`objectCmd` trace 找到「一批 create_object 实放 0」的共同根因

**先更正一处**：第 27 轮我说 `HAWK`=0 —— **查错名字了**。`96` 的 dat 名是 **`HAWKX`**（`HAWK` 是 `random_map.def` 的名字），实际是 **4 个**（DE 8）。

**给 `objectCmd` 加了可选 trace**（`this.traceObjects`，默认不开、零影响）：

| id(名) | `number_of_objects` | cap | **实放** |
|---|---|---|---|
| `HAWKX`(96) | 2 | 2 | **2** ✅ |
| `FISHS`(69) | **9999** | 3456 | **218** ✅ |
| `FISH2`(456) | 6 | 6 | **0** ❌ |
| `FISH4`(458) | 170 | 170 | **0** ❌ |
| `FORAG`(59) | 6 | 6 | **0** ❌ |
| `GOLDM`(66) | 7 / 4 / 4 | 同 | **0** ❌ |
| `STONM`(102) | 5 / 4 | 同 | **0** ❌ |
| `GOAT`(1060) | 2 / 3 | 同 | **0** ❌ |
| `MOUFLON`(2340) | 4 | 1 | **0** ❌ |

🔴 **规律**：**`number_of_objects` 大的（9999）能放出一批；小的（2~170）全灭** —— 因为 `FISHS` 有几千次尝试机会，而 `FISH2` 只有 6 次。

**根因**：`objectCmd` 里这一行**把语义搞反了**：

```js
if (gapAll > 0 && this.nearObject(x, y, gapAll)) continue;   // ← 当成「排斥」
```

官方手册（第 6 轮就抄录过）的鱼例子写的是：

> `min_distance_group_placement 4` → "Creates 50 fish … but **never more than 4 tiles from another fish**."

→ 它是**「必须离已有物件 ≤ N 格」的聚集约束**（防止孤岛），**不是排斥**。

🔴 **后果**：先放的 `FISHS`（间距 6）占满水域后，**后放的 `FISH_B`（我们把"间距 8"当排斥）一个都插不进去** → 0。
同理 **`GOLDM` / `STONM` / `GOAT` / `FORAG` / `MOUFLON` 这些小批量资源物件全灭** —— 这正好对应第 23 轮物件对比里那批「−80% 甚至 0」的项。

**这是本轮最大的收获：一个语义反了的指令，一次性解释了整批缺失物件。**

**下一轮**：把 `min_distance_group_placement` / `temp_min_distance_group_placement` 改成「聚集约束」（第一个物件不受限、之后要求离已有**同类** ≤ N 格），再复测第 23 轮那张物件表。

---

### 6.22 🎉 第 29 轮：修 `*_distance_group_placement` 语义 —— **一批资源物件全对上**

**修法**（把两个参数的分工拆开）：

| 参数 | 语义 | 实现 |
|---|---|---|
| `min_distance_group_placement` | **聚集约束**（官方鱼例子："never more than N tiles from another fish"） | 必须离已有物件 **≤ N** 格；⚠️ **第一个放行** |
| `temp_min_distance_group_placement` | **排斥**（"临时"＝放完即忘，只管本条内各组之间） | 本条内组中心两两 **≥ N** 格 |

⚠️ 我第一版把**两个都**改成聚集 → `SHORE_FISH` 从 218 **爆炸到 3389**（`MELKARYBA` 是 `number_of_objects 9999` + `temp_ 6`）→ 这反证了 `temp_` 必须是排斥。

**效果（同主题物件对比）**：

| 物件 | 第 22 轮 | **第 29 轮** | DE | |
|---|---|---|---|---|
| **物件总数** | 9104 | **9362** | 9254 | ✅ **差 1.2%**（原 1.6%） |
| `TREE_ITALIAN_PINE` | 958 | 958 | 929 | ✅ +3% |
| `GRASS_DRY` / `GRASS_GREEN` | 157 / 80 | 157 / 80 | 151 / 83 | ✅ +4% / −4% |
| **`GOLD_MINE`** | 6 | **35** | 36 | ✅ **−3%**（原 −83%） |
| **`GOAT`** | 4 | **25** | 26 | ✅ **−4%**（原 −85%） |
| **`STONE_MINE`** | 4 | **19** | 22 | ✅ −14%（原 −82%） |
| **`MOUFLON`** | 0 | **8** | 6 | ✅ +33%（原 −100%） |
| `WILD_BOAR` | 2 | **4** | 4 | ✅ **0%** |

**回归**：`Arabia` 物件 5756 → 6297（+9%，**未爆炸**），解析器 **179/180** ✅

**仍待解决**（下一轮）：

- `SHORE_FISH` **219 vs DE 37**（+492%）—— `MELKARYBA` 靠 `number_of_objects 9999` + `temp_ 6` 排斥，容量仍偏大（`GNR_SFISH_SPARSE` 会把它改成 14，容量降到 ~1/5，第 27 轮实测能到 56）
- `FISH_SNAPPER` / `FISH_SALMON` / `FORAGE_BUSH` 仍 **0** —— 它们走 `GeneratingObjects.inc:7573` 的 `else` 分支，带 **`max_distance_to_other_zones`**（**我们没实现，只有注释**）

---

### 6.23 第 30 轮：实现 zone 网格 + `max_distance_to_other_zones`（**默认关**，待校准）

**新增基础设施**：`landZone`（land id → zone）+ `zoneGrid`（每格 zone），在物件段之前构建。

依据（官方 + genie-rms 两处印证）：

> `max_distance_to_other_zones <#tiles>` — "**how close the objects can be to other zones**. This is useful in **keeping objects away from the shore**."
> genie-rms：在**上/下/左/右 + 四角共 8 个方向**、距离 N 处检查 zone 是否与中心一致。

**实测（同主题对比）——方向对，但过严**：

| | 关（默认） | 开 |
|---|---|---|
| **物件总数** | 9362（DE 9254，**1.2%**） | **9319（0.7%）** |
| `GOLD_MINE` | **35**（DE 36，−3%） | 20（−44%） |
| `STONE_MINE` | **19**（DE 22，−14%） | 5（−77%） |

🔴 **「zone」的口径存疑**：我们用 `landZone`（内海 `zone 16` / 玩家陆地 `zone 1`），而手册说的 "other zones（防靠岸、防敌船）" 更可能指**玩家 zone**。

**处置**：基础设施**保留**，行为由 `TUNE.useMaxZone`（**默认 false**）控制 —— 开关两侧的实测数据都留在表里，供下一轮定夺。

**回归**：`Arabia` 物件 6297，解析器 **179/180** ✅

---

## 七、交接摘要（第 30 轮末）

**CC 任务单完成情况**：

| # | 任务 | 状态 |
|---|---|---|
| ① | 同口径并排对比工具 | ✅ `scratch/render_de_map.mts`（任意路径 + 左右并排 + 动物目录） |
| ② | 补缺语义 | ✅ `create_object_group`、`<CLIFF_GENERATION>` 悬崖、`min_terrain_distance`、通行地形限制改用 dat、`*_border`、圆角、`border_fuzziness`、land 覆盖规则、`*_distance_group_placement` 语义、`terrainCmd` 只改种子格的 bug、`spacing` 语义 |
| ③ | 尺寸口径 | ✅ **120=Tiny / 144=Small**（`scaling.inc` + `override_map_size` + `MAPSCALE_MODIFIER 1`，**无需基准图**） |
| ④ | 逐项校准 | 🟡 **进行中**（见下表） |
| ⑤ | 对齐台账 | ✅ 本文件 |

**④ 的实测进度（同主题 `Mediterranean` 144×144）**：

| 指标 | 我们 | DE | |
|---|---|---|---|
| **地形（4 项）** | `Underbrush` 18.7% / `Forest` 1.0% / `Forest,Med` 9.0% / `Dry Grass` 5.0% | 18.7 / 1.0 / 9.2 / 5.2 | ✅ 误差 ≤0.2pp |
| **物件总数** | 9362 | 9254 | ✅ 差 1.2% |
| `GOLD_MINE` / `GOAT` / `STONE_MINE` / `MOUFLON` / `WILD_BOAR` | 35 / 25 / 19 / 8 / 4 | 36 / 26 / 22 / 6 / 4 | ✅ −3% / −4% / −14% / +33% / 0% |
| `TREE_ITALIAN_PINE` / `GRASS_DRY` / `GRASS_GREEN` | 958 / 157 / 80 | 929 / 151 / 83 | ✅ +3% / +4% / −4% |
| `SHORE_FISH` | 219 | 37 | 🔴 +492% |
| `FISH_SNAPPER` / `FISH_SALMON` / `FORAGE_BUSH` | 0 / 0 / 0 | 31 / 12 / 12 | 🔴 仍为 0 |
| 水总量 | 35.1% | 21.8% | 🔴 +13.3pp |

**仍未做的（下一位接手者可从这三条开始）**：

1. **水总量**偏高 13.3pp（`create_land` 的生长比 DE "填得满"，见 §6.4–6.8、§6.11）；深浅比例也从 1:0.07 拉到 3:1，DE 是 1:0.93。
2. **`FISH_SNAPPER`/`FISH_SALMON`/`FORAGE_BUSH` 为 0**：鱼走 `GeneratingObjects.inc:7573` 的 `else` 分支、`FORAGE_BUSH` 待查；两者都可能与 **`max_distance_to_other_zones`**（本轮实现但默认关）或 `zone` 口径有关。
3. **`SHORE_FISH` 是 DE 的 6 倍**：`MELKARYBA` 靠 `number_of_objects 9999` + `temp_ 6` 排斥，容量偏大（第 27 轮实测 `GNR_SFISH_SPARSE` 能把它压到 56）。

**已建成的可复用工具**（下一位继续时直接用）：

| 工具 | 用途 |
|---|---|
| `scratch/render_de_map.mts` | 任意两份地图 JSON 的左右并排渲染 |
| `scratch/_assemble_de_reference.mjs` | 把 `public/de-maps/medi_*` 的 16 块拼成完整 144×144 基准图 |
| `scratch/_make_locked_mediterranean.mjs` | 生成"季节/子分支全锁定"的 Mediterranean 副本（同口径对账用） |
| `scratch/_compare_objects.mjs` | 三级名字解析后的逐名物件对比 |
| `scratch/export_de_unit_names.py` / `export_de_unit_restriction.py` | dat 全表 id→名 / id→通行类别 |
| `scratch/_probe_*.mjs` | 森林双链、1902 分布、悬崖验证等专项探针 |

**引擎侧的诊断开关**（默认关、零影响）：`this.traceTerrain`（逐条 `create_terrain` 的 base/target/实铺）、`this.traceObjects`（逐条 `create_object` 的参数与实放数）。

---

_验算口径：66×66 裁剪区（`crop {size:66, offset:39}`，144 图正中），与 `de_map_1` 同口径。_
