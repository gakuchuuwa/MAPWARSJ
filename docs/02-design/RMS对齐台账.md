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
| 11 | `create_object_group` | 🔴 未实现 | 引擎自报 `OBJ:create_object_group×3` |
| 12 | `<CLIFF_GENERATION>` 悬崖 | 🔴 未实现 | 引擎完全无悬崖 |
| 13 | 物件通行地形限制 | 🟡 部分 | "鱼只放水里"目前按名字猜，应改用 dat 的 `blend_type` |
| 14 | **地图尺寸口径**（Tiny 是 120 还是 144） | ⏳ 待 DE 基准图 | 已查出**三套数字**：官方 TC 72/96/120/144、DE `EnlargeMap.inc` 144/168/200、DE `scaling.inc` 120/144/168 |
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

_验算口径：66×66 裁剪区（`crop {size:66, offset:39}`，144 图正中），与 `de_map_1` 同口径。_
