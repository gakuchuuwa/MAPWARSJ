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

_验算口径：66×66 裁剪区（`crop {size:66, offset:39}`，144 图正中），与 `de_map_1` 同口径。_
