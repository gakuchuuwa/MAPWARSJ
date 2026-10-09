# RMS 引擎对齐工作 · 给 CC 的审阅单

> 提交人：DD（`tools/rms/` 的代码由我写、CC 审）
> 时间：goal「生成的地图与 DE 真图一致」第 30 轮末
> 审阅范围：**上一次自动备份之后的全部改动**（`5adb48286 Auto Backup: 2026/10/9 02:02:14`）
> 🔴 本单里每条结论都带证据（`文件:行` / 命令 / 实测数字）。**凡我没实测到的，一律标「未证实」。**

---

## 一、改动清单（逐处，可直接对 `git diff` 核）

```
git diff --stat
 docs/02-design/RMS对齐台账.md   | 546 +++++++++
 tools/rms/rmsEngine.mjs         |  86 +++-
 tools/rms/rmsParse.mjs          |  19 +-
 3 files changed, 638 insertions(+), 13 deletions(-)
```

**受跟踪文件只有这 3 个被动过**；其余新增文件都在被 git 忽略的 `scratch/`（见 §三）。
核验命令：`git status --short` → 只应列出这 3 个 `M`。

### 1. `tools/rms/rmsParse.mjs`（19 行，5 处）

| # | 位置 | 改动 | 依据 |
|---|---|---|---|
| 1 | `:33-40` | `tokenizeFile(rel, extraDir = null)`：官方目录找不到时回退 `extraDir` | 需要跑"项目内改过的脚本副本"做同口径对账，又不许碰 DE 安装目录 |
| 2 | `:59-60` | `Preprocessor` 记住 `this.extraDir = env.rmsDir ?? null` | 同上 |
| 3 | `:160` | `#include_drs` 处改传 `tokenizeFile(rel, this.extraDir)` | ⚠️ 第 1 版漏了这里，导致 `missingIncludes: F_seasons_locked.inc`、全部常量 `undefined`（第 19 轮踩过） |
| 4 | `:311` | 默认 defines 加 **`PH_EXTENDEDSEASONS`** | 全库无 `#define`，只被 `if` 读（12 处）⇒ 引擎注入。实证：`PH_ALPINE` 下 `WOODIES` **19→131** |
| 5 | `:316, :320` | `loadScript` 把 `rmsDir` 传进 `Preprocessor` 与顶层 `tokenizeFile` | 同 #1 |

### 2. `tools/rms/rmsEngine.mjs`（86 行，15 处）

| # | 位置 | 改动 | 依据 |
|---|---|---|---|
| 6 | `:31-37` | `TUNE.useMaxZone: false`（新开关，**默认关**） | 见 §五-3 |
| 7 | `:48-49` | 新增 `D8`（8 邻域常量） | `max_distance_to_other_zones` 用 |
| 8 | `:72-75` | 新增 `landZone` / `zoneGrid` 字段 | `create_land` 的 `zone` 参数（此前从未实现） |
| 9 | `:122-127` | 物件段之前构建 `zoneGrid` | 同上 |
| 10 | `:175-176` | `createLand` 记录 `landZone.set(id, zone)` | 同上 |
| 11 | `:401-402` | `terrainCmd` 新增 `pending` 数组（记录"本条将写入的地形"） | `terrain` 要到末尾才统一写，判"同类"时得看 pending |
| 12 | `:415-423` | **修 `spacing_to_other_terrain_types` 语义**：`tj !== T && tj !== base`（判定行 `:423`） | 官方原话 "from **other terrain types**（including terrain of the same type）" ⇒ 同类型不算"其它"。原写法只比"是不是本团"，导致 `Mediterranean.rms` 连写两条 `create_terrain MED_WATER` 时第 2 条 **铺 0 格**（trace 实测 `got=0`） |
| 13 | `:428-434` | `seed`/`grow` 回调同步写 `pending` | 同 #11 |
| 14 | `:438-444` | 新增 `this.traceTerrain`（诊断，默认不开） | 查"链式 base_terrain 断在哪一步" |
| 15 | `:446-456` | **修 `terrainCmd` 只改种子格的 bug**：改为遍历 `regOf >= 0` 的全部格子 | `grow` 只把吞下的格子记进 `regOf`、**从不回填 `regions`**，而原代码只遍历 `regions`（＝每团 1 个种子格）。实测：水遮罩 10 条链最终 `Water,Medium` 只剩 **2.4%**（DE 10.5%） |
| 16 | `:688` | 新增 `maxZone = P.max_distance_to_other_zones` | — |
| 17 | `:698` | `gapSame` 不再取 `Math.max(gapAll, temp)`，只取 `temp_` | 两个参数分工应分开（见 #20） |
| 18 | `:737-745` | 新增 `max_distance_to_other_zones` 检查（8 方向 × N 格，zone 须一致；判定行 `:739`） | 官方："how close the objects can be to other zones … keeping objects away from the shore"；genie-rms：8 方向检查点 |
| 19 | `:757, :825` | 新增 `this.traceObjects`（诊断，默认不开） | 查"小批量 `create_object` 全灭" |
| 20 | `:804-806` | **修 `*_distance_group_placement` 语义**：`min_` = 聚集（`≤ N`）、`temp_` = 排斥（`≥ N`） | 官方鱼例子：`min_distance_group_placement 4` → "never more than 4 tiles from another fish" ⇒ **聚集**。第 28 轮 trace 实证：当排斥时 `FISH2`/`FISH4`/`GOLDM`/`STONM`/`GOAT`/`FORAG`/`MOUFLON` **全部实放 0** |

### 3. `docs/02-design/RMS对齐台账.md`（+546 行）

新增 §6.10–§6.23（每轮一条：做法／数据／依据／踩的坑）＋ **§七 交接摘要**。**只增不删**。

---

## 二、实测数据（判据 + 可复现命令）

**对账口径**：同主题、同季节、同子分支。
- DE 基准图：`scratch/de-ref/Mediterranean_144_full.json`（由 `public/de-maps/medi_*.json` 16 块拼成，144×144、0 空洞、9254 物件）
- 我方：`scratch/de-ref/Mediterranean_medisouth.rms`（官方脚本副本，锁 `PH_MEDISOUTH` + 锁子分支）

| 指标 | 我方 | DE | 判定 |
|---|---|---|---|
| `Underbrush` | 18.7% | 18.7% | ✅ **+0.0** |
| `Forest` | 1.0% | 1.0% | ✅ **−0.0** |
| `Forest, Mediterranean` | 9.0% | 9.2% | ✅ −0.2 |
| `Dry Grass` | 5.0% | 5.2% | ✅ −0.2 |
| **物件总数** | **9362** | **9254** | ✅ 差 **1.2%** |
| `GOLD_MINE` / `GOAT` / `STONE_MINE` | 35 / 25 / 19 | 36 / 26 / 22 | ✅ −3% / −4% / −14% |
| `MOUFLON` / `WILD_BOAR` | 8 / 4 | 6 / 4 | ✅ +33% / 0% |
| `TREE_ITALIAN_PINE` / `GRASS_DRY` / `GRASS_GREEN` | 958 / 157 / 80 | 929 / 151 / 83 | ✅ +3% / +4% / −4% |
| `SHORE_FISH` | 219 | 37 | 🔴 **+492%** |
| `FISH_SNAPPER` / `FISH_SALMON` / `FORAGE_BUSH` | 0 / 0 / 0 | 31 / 12 / 12 | 🔴 仍为 0 |
| 水总量 | 35.1% | 21.8% | 🔴 +13.3pp |

**复现**：
```powershell
node scratch/_make_locked_mediterranean.mjs   # 生成锁定的官方脚本副本
node scratch/_compare_objects.mjs             # 逐名物件对比（三级名字解析）
node tools/rms/genMap.mjs Arabia.rms 2 144    # 回归：物件 6297、森林 7.3%
node tools/rms/parseAll.mjs 3                 # 回归：解析 179/180
```

**回归基线**：`parseAll` **179/180**（唯一失败项 `real_world_manchuria.rms` 未定义常量 `MAPSCALE_AREA`，**改动前就存在**，非本次引入）。

---

## 三、新增工具（**在 `scratch/`，被 git 忽略，不入库**）

| 文件 | 用途 |
|---|---|
| `scratch/render_de_map.mts` | 任意两份地图 JSON 的左右并排渲染 |
| `scratch/_assemble_de_reference.mjs` | 把 `public/de-maps/medi_*` 16 块拼成完整基准图（**必须用各块自己的 offset**，按文件名顺序拼会 69% 空洞） |
| `scratch/_make_locked_mediterranean.mjs` | 生成季节/子分支全锁定的官方脚本副本 |
| `scratch/_lock_season_subranch.mjs` | 生成 `F_seasons_locked.inc`（把 5 分支收成第 2 支） |
| `scratch/_compare_objects.mjs` | 逐名物件对比（三级名字解析） |
| `scratch/export_de_unit_names.py` → `de_unit_names.json` | dat 全表 2602 条 id→规范化名 |
| `scratch/export_de_unit_restriction.py` → `de_unit_restriction.json` | dat 全表 id→通行类别 |
| `scratch/_probe_*.mjs` | 森林双链、1902 分布、悬崖、玩家陆地等专项探针 |

🔴 **请 CC 决定这些是否该入库**（我未擅自加进版本控制）。

---

## 四、🔴 我在本期**自我更正过**的结论（CC 若此前收到过旧版本，请以本节为准）

| # | 我曾说 | 实际 | 更正处 |
|---|---|---|---|
| 1 | `if/elseif` 长链有解析 bug | **不存在** —— `start_random` 抽到的是 `PH_SPRING`，它在链上更靠前，先命中 | §6.10 |
| 2 | 物件对照表（按数量排序逐行对齐） | **方法本身错** —— 两边顺序不同，等于乱点鸳鸯（我把 `1358`=`Grass Green` 当成了 `SHORE_FISH`，真身是 `69`） | §6.16 |
| 3 | `themes.inc` 物种常量 `undefined` 是"鱼少"的原因 | **不是** —— 那些常量只服务 `aquatic_*.inc`，而本图**根本没 include 它们** | §6.19 |
| 4 | `GNR_*` 是引擎注入的旗标 | **错** —— `Mediterranean.rms:225-229` 自己 `#define`。我当时**漏搜了 `.rms` 脚本本体** | §6.20 |
| 5 | `HAWK` = 0 | **查错名字** —— `96` 的 dat 名是 `HAWKX`，实际 4 个（DE 8） | §6.21 |
| 6 | 修 `gap` 时把两个参数都改成"聚集" | **爆炸** —— `SHORE_FISH` 218→3389。反证 `temp_` 必须是排斥 | §6.22 |
| 7 | 「144 = Tiny」 | **错** —— `120 = Tiny`、`144 = Small` | §6.1 |
| 8 | 「物件/树比 DE 多 40%」 | **口径混用**（全图 vs 66×66） | §5 |

**根因归纳**（我自己的血训，供 CC 参考）：**下结论前没确认"搜索范围覆盖了所有提供方/使用方"**，以及**拿不可比的两种口径直接对减**。

---

## 五、🔴 请 CC 重点审的 6 处（我自己拿不准）

1. **`spacing` 里放行 `base` 是否过宽**（`rmsEngine.mjs:415-423`，判定行 `:423`）
   我加 `tj !== base` 是为了避开"5×5 邻域包含自己导致每个候选格都被自己拒掉"。
   但如果某个脚本**本意**是"不许贴着尚未铺的 base 格生长"，我这一放行就宽了。请判：`base` 放行是必须的，还是应该改成"跳过 `dx===dy===0`"更精确？

2. **`gapAll`（聚集）的"同类"定义**（`:804-806`）
   官方例子说的是 "from another **fish**"（同类）。我用的是 `this.nearObject()` ＝ **任何已放物件**，且用 `objBuckets.size > 0` 当"第一个放行"的判据。
   请判：是否该按 **id / 单位类别** 限定"同类"？"第一个放行"的判据是否该更严格？

3. **`max_distance_to_other_zones` 的 zone 口径**（`:737-745` + `:122-127`）
   我用 `landZone`（内海 `zone 16` / 玩家陆地 `zone 1`）。开了之后：总数更准（0.7% vs 1.2%），但 `GOLD_MINE` 35→20、`STONE_MINE` 19→5（**过严**）。
   手册说的是 "keeping objects away from the shore（防敌船）" ⇒ 我怀疑 DE 指的是**玩家 zone**。**故默认关**。请判正确口径。

4. **`terrainCmd` 改遍历 `regOf` 是否会有误改**（`:446-456`）
   `regOf` 由 `seed` 的 `mark` 和 `grow` 的 `take` 写入。我核过两处都写，但**没写针对性测试**。
   请 CC 看：有没有"regOf 被标记但该格其实不该改地形"的路径？

5. **`PH_EXTENDEDSEASONS` 无条件注入是否过宽**（`rmsParse.mjs:311`）
   它是"扩展季节"DLC 开关。无条件定义 ⇒ 所有脚本都以为装了 DLC。
   我只有一条实证（`PH_ALPINE` 下 `WOODIES` 19→131）。**若某脚本在未装 DLC 时本不该走扩展分支，我这一条就是错的。** 请判是否该改成按地图/选项注入。

6. **两个诊断字段（`traceTerrain` / `traceObjects`）是否该留**
   都是"调用方不设就完全不执行"（默认零影响）。按"不给自己派活"的口径，请 CC 判要不要留。

7. 🔴 **一处我造成的注释矛盾（请 CC 判怎么处置）**
   `rmsEngine.mjs:410` 是我**没删掉的旧注释**：
   > `// 手册：与其它地形保持距离，「包括同类型」——即别的团（哪怕同一种地形）也要隔开，只有本团自己不算`
   而我在 `:415-419` 新写的注释说的是**相反**的语义（同类型不算"其它地形类型"）。
   **两段注释现在相互矛盾**，是我加新注释时忘了处理旧的。按"不擅自改动"的口径我**没有自行删它**，请 CC 判：删掉旧的、还是改写它。

---

## 六、已知**未完成**（目标未达成，我不标记完成）

1. **水总量 35.1% vs DE 21.8%（+13.3pp）** —— `create_land` 生长比 DE "填得满"。另：深浅比例我方 `Medium:Shallow ≈ 3:1`，DE 是 `1:0.93`。
2. **`FISH_SNAPPER` / `FISH_SALMON` / `FORAGE_BUSH` 仍为 0** —— 它们走 `GeneratingObjects.inc:7573` 的 `else` 分支，带 `max_distance_to_other_zones`，**可能正卡在 §五-3 那个 zone 口径上**。
3. **`SHORE_FISH` 是 DE 的 6 倍**（219 vs 37）—— `MELKARYBA` 靠 `number_of_objects 9999` + `temp_ 6` 排斥，容量偏大；第 27 轮实测 `GNR_SFISH_SPARSE`（间距 6→14）能压到 **56**。

**任务单完成度**：① ✅ ② ✅ ③ ✅（**120=Tiny、144=Small，无需基准图**）④ 🟡 进行中 ⑤ ✅

---

## 七、请 CC 回什么

1. §五 那 6 处，**逐条判可/不可**，附依据；
2. §一 的 diff 里，**有没有我"顺手"改了主人没说的东西**（这是最高铁律，请狠查）；
3. §四 那 8 条更正里，**有没有哪条我这次又改错了**；
4. `scratch/` 那批工具**要不要入库**。

---

# 八、第 31 轮返工报告（按 CC 判定执行）

## 8.0 先说基线（重要，影响 CC 怎么核 diff）

**自动备份在 `02:32` 把我第 16–30 轮的改动提交了**，所以现在：

| | |
|---|---|
| HEAD | `b8e551970 Auto Backup: 2026/10/9 02:32:14`（**已含**我 `rmsEngine.mjs` 86 行、`rmsParse.mjs` 19 行、台账、本审阅单） |
| 工作区相对 HEAD | **只有本轮按 CC 判定做的回滚**（`rmsEngine.mjs` 9 增 29 删） |
| 其他改动 | 只有 CC 自己生成的那张图 `claudedocs/rms-spike/Arabia_2.png` |

核 diff 请用 **`git show b8e551970 -- tools/rms/`**（看全量）+ **`git diff -- tools/rms/`**（看本轮回滚）。

**最高铁律自查**：`src/` 与素材 **0 改动**（`git status --short` 只有 `tools/rms/` 与 CC 那张图）。

## 8.1 CC 判定 → 执行情况

| CC 判定 | 我的处置 | 状态 |
|---|---|---|
| ① 同类型放行＝**不可** → 改回严格版 | 恢复原判定 `if (regOf[j] !== -1 ? regOf[j] !== r : this.terrain[j] !== base) return false;`，并**删掉我加的那段矛盾注释**（保留 `:410` 旧注释） | ✅ |
| ① 连带：`pending` 数组 | 改回严格版后 `pending` 变成**只写不读的死代码** → **一并删除**（是我加的，我删） | ✅ |
| ② 不带 `temp_` 的组间距＝**不可** → 改回**排斥** | 恢复 `gapSame = Math.max(gapAll, temp)`；`gapSame` 用 `abs<` 版；`gapAll` 用 `this.nearObject()` | ✅ |
| ④ 遍历 `regOf`＝**可** | 保留 | ✅ |
| ⑤ `PH_EXTENDEDSEASONS`＝**暂可** | 保留待核 | ⏳ |
| ⑥ 两个诊断字段＝**可，保留** | 保留 | ✅ |
| ⑦ 第 410 行矛盾注释 | 已随 ① 处理（删新留旧） | ✅ |
| `scratch/` **先不入库** | 未入库 | ✅ |

**验证回滚到位的证据**（`git diff`）：`gap` 两行现为
```js
if (gapSame > 0 && placedCenters.some((p) => Math.abs(p.x - x) < gapSame && Math.abs(p.y - y) < gapSame && Math.hypot(p.x - x, p.y - y) < gapSame)) continue;
if (gapAll > 0 && this.nearObject(x, y, gapAll)) continue;
```
即**与第 29 轮之前的原始版本逐字相同**。

## 8.2 CC 点名要的三项数据

**回归（每改一条都跑了）**：
```
parseAll 3  → 脚本 180；解析通过 179；失败 1（MAPSCALE_AREA，改动前既有）
Arabia 种子 2 → 物件 5756 ｜ 森林 5.8% ｜ 地形种类 6
```
🔴 **两者与 goal 起始基线逐位相同** —— 回滚干净。

**① 水量是否回落** → **没有回落，一分未动**：

| | 回滚前（我的错版） | **回滚后（CC 版）** | DE |
|---|---|---|---|
| 水总量 | 35.1% | **35.1%** | 21.8% |
| `Medium : Shallow` | 0.07 : 1 | **0.07 : 1** | 0.93 : 1 |

**原因（用 trace 查清了）**：水的深浅不是被 spacing 决定的，而是被水遮罩链的**第 4 条**决定的 ——

```
1. T=Water,Medium   base=Water,Shallow   base格数=7273  target=7273  实铺=5396
2. T=Water,Medium   base=Water,Shallow   base格数=1877  target=1877  实铺=0     ← 🔴 又出现
3. T=Water,DeepOcean base=Water,Medium   base格数=5396  target=5396  实铺=489
4. T=Water,Shallow  base=Water,Medium    base格数=4907  target=4907  实铺=4907  ← 100% 铺回浅水（mask=2）
5. T=Water,Medium   base=Water,DeepOcean base格数=489   target=489   实铺=489
7. T=Water,Deep     base=Water,Medium    base格数=489   target=489   实铺=0     ← 🔴 又出现
```
**第 4 条是 `land_percent 100` 的 `create_terrain VODA { base_terrain MED_WATER }`** —— 它把第 1 条铺出的中水**整片写回浅水**（`terrain` 变 Shallow、旧地形记进 `layer`）。所以最终浅水 32.7%、中水 2.4%。

🔴 **这指向一个更上游的问题**：`VODA` 本身铺了 **7273 格 = 35.1%**，而 DE 全部水才 21.8%。**水遮罩链只是在这个过大的水体里分配深浅**；总量偏多的根因在 `<LAND_GENERATION>` 的 `create_land { terrain_type VODA land_percent 80 borders 17 }`（§6.4–6.8 那条线）。**CC 的第 4 步（深浅比）建议直接查 LAND 阶段的水体大小，而不是水遮罩链。**

**② "铺 0 格"的指令是否又出现** → **又出现，共 2 条**：

| 条 | 目标 / 底 | **底地形区还剩多少格** | target |
|---|---|---|---|
| 2 | `Water,Medium` ← `Water,Shallow` | **1877 格** | 1877 |
| 7 | `Water,Deep` ← `Water,Medium` | **489 格** | 489 |

两条都是"底地形区还剩一点、但被 5×5 邻域的已铺格全挡掉"。**底地形区剩余格数已在 trace 里给出**（`baseCount` 就是"这条指令开工时底地形还有多少格"）。

**③ 岸边鱼数量** → `FISHS` **226**（DE 37，+511%）；批次鱼 `FISH4`=0、`FISH2`=0。

## 8.3 🔴 必须请 CC 复审的一处：`gapAll` 的**作用域**

CC 第 2 条写的是「与此前**所有已放物件**保持距离」。我按字面实现了，但**数据出现系统性退化**（下面有对照），于是做了一个**临时实验**（跑完立刻回滚，主代码仍是 CC 的版本）。

**手册原文（两处，均指向"本指令的组"）**：

> 行 351：`min_distance_group_placement <#tiles>` — "Distance to separate center of **a group**—prevents a massive wad of gold, stone and berries all together. … **if no groups are assigned, then this instruction will apply to all objects**."
> 行 532：「If `number_of_groups` is not specified, then **each object is treated as its own group** and will respond to the `set_scaling_of_groups_to_map_size` and `min_distance_group_placement` instructions」

→ 「a group」＝**本指令自己的组**；"apply to all objects" 也是指**本指令内的所有物件**，不是全地图物件。

**而我们的实现用 `this.nearObject(x, y, gapAll)`** —— 它查的是**全地图已放物件**，其中包括 **938 棵 `TREE_ITALIAN_PINE` 等树木**。于是"要放 7 个金矿"时，候选格几乎全被树挡掉。

**临时实验（仅改作用域，语义仍是 CC 要的"排斥"）**：

| 物件 | 严格版（`nearObject` 全地图） | **实验版（本指令组中心）** | DE | |
|---|---|---|---|---|
| `GOLDM` | 6 | **36** | 36 | ✅ **+0%** |
| `STONM` | 4 | **19** | 22 | ✅ −14% |
| `GOAT` | 4 | **24** | 26 | ✅ −8% |
| `FORAG` | 0 | **9** | 12 | ✅ −25% |
| `MOUFLON` | 0 | **8** | 6 | ✅ +33% |
| `BOARX` | 4 | 4 | 4 | ✅ 0% |
| `FISH2` | 0 | **6** | 12 | 🟡 −50% |
| `FISH4` | 0 | **121** | 31 | 🟡 +290% |
| `FISHS` | 226 | 220 | 37 | 🟡 +495% |
| **物件总数** | 9097 | **9309** | 9254 | ✅ **0.6%** |

**实验期间回归**：`parseAll` 179/180 ✅；`Arabia` 物件 5592（严格版 5756，−2.8%）、森林 5.8% ✅。

🔴 **结论**：CC 判的**语义（排斥）是对的**；但**作用域**如果按字面用"全地图物件"，会把 7 类小批量资源打到 0。**手册原文支持把作用域限定为"本指令的组中心"。**

**我按铁律没有擅自保留实验版**（主代码＝CC 版本，GOLDM=6 已复测确认）。**请 CC 裁定**：
- **(A)** 维持字面（`nearObject` 全地图）—— 我就这样留着；
- **(B)** 采纳手册口径（本指令组中心）—— 我一键改回，并补一条测试；
- **(C)** 折中：`gapAll` 只与**同类物件**（同 id / 同类别）比距离，不管树。

## 8.4 下一步待 CC 指示后继续

- **第 3 步**（zone 口径：没归属的格子按陆地/水归入底地形的 zone，再开启 `max_distance_to_other_zones`）—— **未开始**，等 CC 对 8.3 的裁定（同一处代码，避免来回改）。
- **第 4 步**（深浅比）—— 按 8.2 ① 的证据，**建议改查 LAND 阶段**，请 CC 确认方向。
- **第 5 步**（换阿拉伯再验一遍）—— 待前几步定了再做。

---

# 九、第 32 轮报告（按 CC 判定执行）

## 9.0 改动与基线

| | |
|---|---|
| 本轮实质改动 | **1 处**：`gapAll` 作用域按 CC 裁定改为 (B)（`rmsEngine.mjs`，本指令组中心） |
| 其余 | 两次**临时实验（D、玩家陆地切内海）做完即回滚**，已 `grep` 确认无残留 |
| 相对 HEAD | `tools/rms/rmsEngine.mjs` **15 增 29 删** |
| `src/` 与素材 | **0 改动** ✅ |

**回归（每改一条都跑）**：
```
parseAll 3   → 179/180（失败项仍是改动前既有的 MAPSCALE_AREA）
Arabia 种子 2 → 物件 5592 ｜ 森林 5.8%
```

## 9.1 任务 1：转正 (B) ＋ D 对照实验

**(B) 已转正**（`gapAll` 与本指令的组中心比距离）。地中海实测：

| | DE | **我方 (B)** | |
|---|---|---|---|
| `GOLDM` | 36 | **36** | ✅ **0%** |
| `STONM` | 22 | 19 | −14% |
| `GOAT` | 26 | 24 | −8% |
| `FORAG` | 12 | 9 | −25% |
| `MOUFLON` | 6 | 8 | +33% |
| `SHORE_FISH` | 37 | 220 | +495% |
| **物件总数** | 9254 | **9309** | ✅ **0.6%** |

**(D) 对照实验**（`gapAll` 只和"由 `create_object` 放下、且非占位"的物件比；占位 id = `647/1543/1902`，取自 `tools/scene13-atlas/de-map.ts:134`）：

| 指标 | DE 基准 | **(B)** | (D) |
|---|---|---|---|
| 资源物件数 | 111 | **105** | 92 |
| `GOLDM` / `STONM` / `GOAT` | 36 / 22 / 26 | **36 / 19 / 24** | 36 / 18 / **12** |
| `FISH4` | 31 | **121** | **0** |
| ③ 异类最近距离（中位） | 7.3 | 5.0 | 5.1 |
| ④' 同类最近距离（物件级·中位） | **1.0** | 5.0 | 5.1 |
| ④ 同类异堆距离（堆心≤6·中位） | 36.2 | 13.0 | 12.6 |

🔴 **数据判定：B 胜**。D 在两个"分布"指标上与 B **几乎无差别**（5.1 vs 5.0、12.6 vs 13.0），却把资源物件从 105 打到 92（`GOAT` 24→12、`FISH4` 121→0）。**故维持 B，D 已回滚。**（工具：`scratch/_probe_resource_spacing.mjs`，三边同一把尺）

## 9.2 任务 2：陆地生成阶段 —— 已定位到机制，附轮廓实测

### ① `borders` 语义：核实**实现正确**

`Mediterranean.rms:36-39` 用的是 `left_border / right_border / top_border / bottom_border`（各 17），**不是** `borders`；我们的 `bp()`（`rmsEngine.mjs:188-190`）读的正是这四个名字 ✅
手册（`tc-rms-guide.md`）："**Percent from edge to stop land growth**" + "land had a hard-coded feature to **round off edges**… border > 20% 时更像圆/八边形" —— 与 `:196-230` 的矩形 + 内切椭圆 + `border_fuzziness` 一致 ✅

### ② 轮廓并排实测（`scratch/_probe_land_contour.mjs`）

```
DE   : 水 4524 格 (21.8%)  包围盒 x[22,122] y[23,121]  连通域 1
我方 : 水 7273 格 (35.1%)  包围盒 x[24,119] y[24,119]  连通域 1
```

DE 的水是**被玩家陆地切开的两瓣**（上右半 + 下左半，仍连通）；**我方是一个完整椭圆**：

```
      DE 基准图                   我方
y24   ..........:%%%%%%:......     ........::%%%%%:........
y48   ........:%%%%%%%%%%%:...     ....:%%%%%%%%%%%%%%:....
y66   .........%%%::::%%%%:...     ....%%%%%%%%%%%%%%%%....
y78   ....%%:...%%:.....:.....     ....%%%%%%%%%%%%%%%%....
y90   ...:%%%%%%%%%...........     ....:%%%%%%%%%%%%%%:....
```

**我方 land 一览只有 2 个**：`326`＝VODA 7273 格、`100`＝玩家陆地 6221 格 —— 🔴 **`land 101`（玩家 2）根本没生成**。
**出生点 (119,87)/(25,57) 到最近水 1.0 / 2.0 格** → 玩家陆地被挤在内海**外面**。

### ③ 机制：两道闸把玩家陆地挡在内海之外

```js
rmsEngine.mjs:237   if (occ !== -1 && !(overwrite && occ < 100)) return false;
rmsEngine.mjs:238-245  if (avoid > 0) { … if (l !== -1 && l !== id) return false; }
```

- `create_land`（内海）**没写 `land_id`** → id 取 `this.rng.int(200, 400)` → 实测 **326**
- `create_player_lands` → `createLand(P, …, 100 + p, true)`（`:167`）→ id **100/101**、`overwrite = true`
- 于是 `overwrite && occ < 100` = `true && false` = **false** → **内海一格都不许覆盖**（与 `:231-235` 注释写的意图**正好相反**）
- 再加 `avoid = 5`（玩家陆地的 `other_zone_avoidance_distance`）连**靠近**都不许 → 玩家 2 的基点落在内海里 → `mine` 为空 → **land 101 消失**

### ④ 实验：两道闸都放开（跑完已回滚）

| | DE | 原版 | **实验** |
|---|---|---|---|
| 水量 | 21.8% | 35.1% | **12.4%** 🔴 反向过头 |
| **水连通域** | **1** | 1 | **110** 🔴 被切碎 |
| 玩家 land 数 | — | **1（101 缺失）** | **2** ✅ |
| `Beach` | 2.5% | 1.4% | 7.1% |

**结论**：这两道闸**确实是"玩家陆地进不了内海"的原因**（放开后 land 101 出现了）；但**只放开还不够** —— `land_percent 30` × 2 人 = 12442 格 > 椭圆 7238 格，两个玩家陆地各自向内海中央生长，把水**打碎成 110 块**。**DE 的水是 1 个连通域**，说明 DE 的玩家陆地是**从边缘切进去形成两个半岛**，而不是在内海里撒开。

### ⑤ 请 CC 裁定

1. **`occ < 100` 这道闸**：判据把"中立 land（id 200~400）"与"别的玩家 land（100~107）"混在一个阈值里。**无论水量怎么调，`land 101` 消失都是正确性缺陷**（`create_player_lands` 少生成一个玩家陆地）。
   建议改成按"是否玩家 land"判定（而不是数值阈值）；**请 CC 确认是否采纳**。
2. **`other_zone_avoidance_distance` 是否该避开中立地形**：若按字面避开一切别的 land，玩家陆地永远进不了内海。**请 CC 判它的正确作用域**（是否只避"别的玩家 land"）。
3. **水被切碎成 110 块**：这不是闸门问题，而是**玩家陆地生长方向**问题（应沿边缘切入而非向中央铺开）。**是否要为此查 `create_player_lands` 的 `circle_radius`/`base_size`/`land_percent` 语义？**

## 9.3 新增工具（`scratch/`，仍未入库）

| 文件 | 用途 |
|---|---|
| `scratch/_probe_resource_spacing.mjs` | 资源间距分布（DE / B / D 同一把尺：异类最近距离、同类最近距离、堆数） |
| `scratch/_probe_land_contour.mjs` | 水/陆轮廓并排（水体统计 + 每 12 行跨度 + 24×24 ASCII 并排 + land 一览 + 出生点到水距离） |
| `scratch/_report_cc31.mjs` | 地中海同口径一键报告（create_terrain 链 trace + 地形占比 + 关键物件） |

## 9.4 下一步（等 CC 对 9.2⑤ 裁定后继续）

- 任务 3（zone 口径）—— 与陆地阶段同一处代码，等 9.2 定了再做；
- 任务 4（岸边鱼）—— 待定；
- 任务 5（换阿拉伯复验）—— 最后做。

---

# 十、第 33 轮报告：按 CC 的「面积平分 + 同时生长」重构陆地生成

## 10.0 CC 的发现已用**两个独立来源**坐实

| 来源 | 原文 |
|---|---|
| 手册 :162 | "The percentage of land allotted to player lands is **divided among all the players**. Therefore, if player lands were specified to take up **20% of the map, then 2 players would each get 10%**" |
| 手册 :185 | "For Player Lands, **this area will be divided by the number of players**… 60% and 6 players → each about 10%" |
| 手册 :150 | "**Land is all generated at the same time, so the order used in placing land is not important.** (Terrain and objects, however, are placed in order.)" |
| 我早前抓的 genie-rms 结构（`RMS引擎语义-给CC.md` §12.2） | "1. 每块 land 先在 `land.position` 铺 `baseSize` 半径方块 … 3. 循环：**各 land 轮流** pop 一个点；`checkTerrainAndZone()` 发现**别的 zone → 不允许侵入**" |

→ **不需要靠推测**：面积要平分（手册两处）、陆地要同时生成（手册一处 + genie-rms 一处）。

## 10.1 改了什么（4 处，全部在本轮 CC 指令范围内）

| # | 位置 | 改动 |
|---|---|---|
| 1 | `runLand` | 两阶段：**先把每块 land 的底座全铺好**（`planLand`），再 `growLands()` 统一轮转生长；`deferred`（`number_of_tiles 0` 的填充区）仍在最后 |
| 2 | `planLand`（原 `createLand`） | 只铺底座、**不生长**，返回 `{id, zone, terr, want, clump, free, mine}`；新增 `playerDivisor`，**只作用于 `land_percent`**（`number_of_tiles` 不减，阿拉伯的 1300 是单人量级） |
| 3 | `planPlayerLands`（原 `createPlayerLands`） | 返回 specs 数组，传 `playerDivisor = this.players` |
| 4 | `growLands`（新增） | **各 land 轮流各吞一格**；每块自带候选堆（代价 `250 − clumping×四邻本land数 + rng(0..99)`） |
| 5 | `free()` 的占用/避让 | **删掉 `overwrite && occ < 100` 那套"覆盖"逻辑** → 任何别的 land 的格子都不许占；`avoid` 改为**只避开「不同 zone」的 land**（同 zone 可相邻） |

⚠️ **实现中踩的一个坑（已修，记下来）**：第一版 `growLands` 里 `free()` 对**本 land 自己的格子**返回 true，于是堆里的陈旧项被**重复认领** —— `total` 虚增到 `want`（三块相加 22809 > 20736，物理上不可能），生长在底座大小处就停了。修法：`expand` 只把**未占格**推入前沿；认领前再查一次 `this.landId[j] !== -1`。

## 10.2 地中海实测（CC 要求的三项）

```
DE   : 水 4524 格 (21.8%)  x[22,122] y[23,121]  连通块 1
我方 : 水 3997 格 (19.3%)  x[31,98]  y[25,119]  连通块 1
land 100 = 3110 格 ｜ land 101 = 3110 格（完全相等）
```

| 指标 | 改前 | **改后** | DE | 差 |
|---|---|---|---|---|
| **水占比** | 35.1% | **19.3%** | 21.8% | **−2.5pp**（标准 ≤2pp，接近） |
| **水连通块数** | 1 | **1** | 1 | ✅ **相同** |
| **玩家 1/2 陆地** | **只有 1 块（101 缺失）** | **3110 / 3110** | — | ✅ **都在且面积相等** |
| `Dirt 3` | 29.8% | 45.5% | 41.6% | +3.9 |
| `Underbrush` | 18.7% | 18.8% | 18.7% | ✅ +0.1 |
| `Forest, Mediterranean` | 9.0% | 9.0% | 9.2% | ✅ −0.2 |
| `Dry Grass` | 5.0% | 5.0% | 5.2% | ✅ −0.2 |
| `Forest` | 1.0% | 1.0% | 1.0% | ✅ −0.0 |
| `Beach` | 1.4% | 1.5% | 2.5% | −1.0 |
| **`Water, Shallow`** | 32.7% | **18.5%** | 11.3% | 🔴 +7.2（`Medium` 仍 0 vs 10.5） |
| **物件总数** | 9309 | **9488** | 9254 | ✅ +2.5%（标准 ≤5%） |
| `GOLDM` / `STONM` / `FORAG` | 36 / 19 / 9 | **36 / 22 / 12** | 36 / 22 / 12 | ✅ **全部 0%** |
| `GOAT` / `MOUFLON` | 24 / 8 | **28 / 8** | 26 / 6 | ✅ +8% / +33% |
| **`SHORE_FISH` / `FISH_SNAPPER`** | 220 / 121 | **282 / 146** | 37 / 31 | 🔴 +662% / +371% |

**轮廓并排（改后）**：我方水呈**中部偏左的一整块**（y54~114 最宽 x[31,98]），DE 是**上右 + 下左两瓣**。**连通块数已一致，形状尚未一致** —— 玩家基地的**角度**与 DE 不同（DE 的两块玩家陆地各占一侧把水挤成两瓣）。

## 10.3 回归

```
parseAll 3    → 179/180（失败项仍是改动前既有的 MAPSCALE_AREA）✅
Arabia 种子 2 → 物件 5478 ｜ 森林 9.4% ｜ 有高度 14.0% ｜ 对象 1674 ｜ 地形 7 种
```

🔴 **阿拉伯的数字变了**（改前 5592 / 森林 5.8%）：同时生长改变了陆地布局 → 地形成团随之改变。**目前无法判优劣**（缺 DE 阿拉伯基准图）。
**这正是 CC 第 6 条要的第二张基准图** —— 请 CC 在 DE 里生成一张已知脚本的阿拉伯 144（2 人），我负责导出并复验。

## 10.4 仍未达标（下一步）

1. **深浅比**：`Water, Medium` 仍 0（DE 10.5%）。水遮罩链第 1 条实铺 2535 / 3997，第 2 条（`base_terrain VODA` 再铺一次）又是 **0**（同第 31 轮那个"严格 spacing 下底地形区被 5×5 邻域全挡"的现象）。**下一步查这里**。
2. **`SHORE_FISH` +662% / `FISH_SNAPPER` +371%**：数量偏多（脚本里 `MELKARYBA` 是 `number_of_objects 9999`）。
3. **水形状**：连通块已对，位置/朝向未对。
4. **任务 3（zone 口径）**、**任务 5（180 脚本全量健壮性）** 未做。
5. **`Beach` −1.0**：沙滩偏少。

## 10.5 本轮新增/复用的度量工具（`scratch/`，未入库）

`_probe_land_contour.mjs`（水陆轮廓并排 + land 一览 + 出生点到水距离）｜`_probe_resource_spacing.mjs`｜`_report_cc31.mjs`

---

# 十一、第 34 轮报告

## 11.1 第 1 条：多种子统计（我方 10 个种子）vs DE 基准

**工具**：`scratch/_report_multiseed.mjs 10`（新增）

| 指标 | 我方均值 | **[最小,最大]** | DE | DE 是否在范围内 |
|---|---|---|---|---|
| `Dirt 3` | 43.9% | [38.4, 49.4] | 41.6% | ✅ |
| `Underbrush` | 18.9% | [18.6, 19.2] | 18.7% | ✅ |
| **水占比** | 20.6% | **[15.5, 26.2]** | **21.8%** | ✅ **在范围内** |
| **水连通块数** | 1 | [1, 1] | 1 | ✅ |
| 物件总数 | 9342 | [9075, 9582] | 9254 | ✅ |
| `TREE_ITALIAN_PINE` | 956 | [929, 985] | 929 | ✅ |
| `GOLD_MINE` | 36 | [36, 36] | 36 | ✅ |
| `STONE_MINE` | 22 | [20, 22] | 22 | ✅ |
| `GOAT` | 22 | [8, 28] | 26 | ✅ |
| `FORAGE_BUSH` | 12 | [10, 12] | 12 | ✅ |
| `MOUFLON` | 5 | [0, 8] | 6 | ✅ |
| `Water, Shallow` | 19.7% | [14.8, 24.8] | 11.3% | ❌ |
| 中/浅水比 | 0.05 | [0.04, 0.06] | 0.93 | ❌ |
| `SHORE_FISH` | 282 | [257, 300] | 37 | ❌ |
| `FISH_SNAPPER` | 147 | [136, 154] | 31 | ❌ |
| `FISH_SALMON` | 6 | [6, 6] | 12 | ❌ |
| `HAWK` | 4 | [4, 4] | 8 | ❌ |
| `TREE_OLIVE` | 759 | [732, 786] | 874 | ❌ |
| `Beach` | 1.7% | [1.2, 2.3] | 2.5% | ❌ |
| `Forest` | 0.9% | [0.6, 1.0] | 1.02% | ❌（差 0.1pp） |
| `Forest, Mediterranean` | 9.0% | [9.0, 9.0] | 9.19% | ❌（差 0.19pp） |
| `Dry Grass` | 5.0% | [5.0, 5.0] | 5.16% | ❌（差 0.16pp） |

**结论**：**10 项落在范围内**（含最关键的**水占比**与**水连通块数**）。**范围外**分两类：
- **真差距**：深浅比、鱼（`SHORE_FISH`/`FISH_SNAPPER`）、`TREE_OLIVE`、`Beach`
- **只是范围退化成一点**：`Forest,Med`/`Dry Grass`/`Forest` —— 这几项的格数是 `land_percent` **直接算出来的确定值**（9% / 5% 就是 9% / 5%），十个种子完全相同，所以"DE 落在范围内"这条判据对它们**没有区分力**。

🔴 **请 CC 裁一条口径**：对**由 `land_percent` 定死的确定性地形**，是否改用你的完成标准里那条"**各差 ≤1pp**"来判？（按 ≤1pp 判，这三项**都达标**：0.19 / 0.16 / 0.1pp。）

## 11.2 第 2 条：按原因计数的被拒分布

**工具**：`scratch/_probe_terrain_reject.mjs`（新增；引擎里加了可选计数器 `this.traceReject`，默认关、零影响）

```
  #  目标地形              底地形              底格数   target  实铺  | notBase  claimed  height  flat  avoidStart  spacing
   1  Water, Medium        Water, Shallow        3997    3997   2535  |   16739     6591       0     0          0     1763
   2  Water, Medium        Water, Shallow        1462    1462      0  |   19274        0       0     0          0     1462   ← 🔴
   3  Water, Deep Ocean    Water, Medium         2535    2535    165  |   18201     2454       0     0          0    30188
   4  Water, Shallow       Water, Medium         2370    2370   2370  |   19680     7062       0     0          0        0
```

**第 2 条那 1462 个候选格：`spacing` 拒了 1462 格（100%）**，其它原因（高度／平地／出生点避让／非底地形／已认领）**全为 0**。

→ **不是猜测，是计数**：#2 的候选区**整片都落在 #1 已铺格的 5×5 邻域内**，在 CC 裁定的严格 spacing 下**必然为 0**。
→ 水遮罩链 10 条合计被拒原因占比：`notBase` 79.6%｜`spacing` 13.5%｜`claimed` 7.0%｜高度/平地/避让 **全 0**。

## 11.3 顺带查清的两件事（都与"不猜"有关）

**① `terrain_mask` 语义：官方 DE 文档证实，我们的实现是对的** ✅
> 官方 [RMS Features](https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/rms-features)：*"force a terrain to **mask over or under** another with values 1 and 2 respectively"*，例子 `terrain_mask 1 /* SNOW is masked on top of GRASS */`、`terrain_mask 2 /* SNOW is masked underneath GRASS */`。
> 同页 `layer_to_place_on`：*"if a terrain is masked **on top** with terrain_mask 1, it should later be referred to with **layer_to_place_on**… if masked with terrain_mask 2 (underneath) or not masked, **terrain_to_place_on** can still be used."*

我们的 `mask===1 → layer=T、逻辑不变`、`mask===2 → 逻辑=T、layer=旧` **与该定义一致**。

**② 🔴 官方同页给了一条我们**可能错**的规则（`circle_radius`）**
> *"NOTE: left_border, right_border, bottom_border, top_border **do not affect the players' starting positions when circle_radius is used**."*

我们的 `planLand` 对**所有** land（含玩家陆地）一律按 `*_border` 裁切。地中海这张图玩家陆地没写 border 所以看不出问题；但**若某脚本同时写了 `circle_radius` 与 `*_border`，我们就会把玩家陆地裁错**。
→ 记为**待验证**（未证实是否真有脚本这么写），请 CC 决定要不要查。

## 11.4 第 3 条：`beach_terrain` 的查证结果

| 来源 | 结论 |
|---|---|
| AoC 手册 `tc-rms-guide.md` | ❌ **没有** `beach_terrain` |
| 官方 DE 页 [RMS Features](https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/rms-features) | ❌ **没有** `beach_terrain`（该页只讲了 rnd / direct_placement / terrain_mask / circle_radius / resource_delta / create_connect_to_nonplayer_land / color_correction / enable_waves / place_on_forest_zone / find_closest / actor_area / force_placement / layer_to_place_on） |
| **DE 脚本里的真实用法** | ✅ **是 `create_terrain` 块的参数**，且**总与 `terrain_mask 1` 同块** |

```rms
includes/coastal_blending.inc:14-21   （另有 :40/:68/:96 三处同构）
create_terrain COASTAL_TERRAIN
{
	base_terrain COASTAL_BASE
	land_percent 100
	number_of_clumps 512
	beach_terrain BEACH_TERRAIN     ← 这条地形临水的那一圈 → BEACH_TERRAIN
	terrain_mask 1
}
```
另有 `includes/forest.inc:1632-1637` 六处、`Acclivity.rms:81 #const BEACH_TERRAIN 2` 之类的按主题取值。

🔴 **我们的差距**：`applyBeaches()`（`rmsEngine.mjs:534-544`）是**全局后处理** —— "陆地格四邻有水 → `BEACH`(const 2) / 雪冰 → `ICE_BEACH`(37)"，**从不读 `beach_terrain` 参数**，也不区分是哪条地形临水。所以：
- 沙滩**种类**可能错（脚本说用 `BEACH_TERRAIN`，我们一律用 `BEACH`）；
- 沙滩**位置**可能错（我们给所有陆地贴一圈，而脚本的 `beach_terrain` 只贴**那一条地形**的边）。

→ 这与第 34 轮第 3 条的怀疑**一致**。**改法等 CC 定**：把 `beach_terrain` 做成 `create_terrain` 的参数（只改该地形的临水边），全局那套退为兜底。

## 11.5 本轮改动与回归

| | |
|---|---|
| 实质改动 | **0 处**（本轮只加**可选**诊断计数器 `this.traceReject`，默认关、零影响） |
| 新增工具 | `_report_multiseed.mjs`、`_probe_terrain_reject.mjs` |
| 回归 | `parseAll` **179/180** ✅｜`Arabia` 种子 2 → **5478 / 森林 9.4%**（与上轮一致） |

## 11.6 未做（等你裁定后继续）

- **第 3 条改法**（`beach_terrain` 参数化）—— 已查清，**等你点头再改**
- **第 4 条**（鱼的数量按原因计数 + zone 口径）
- **第 5 条**（180 脚本全量生成不报错）
- **第 6 条**（阿拉伯基准图）—— 等 CC 在 DE 里生成后给我路径
- 11.1 那条口径裁定（确定性地形用 ≤1pp 判？）与 11.3② 的 `circle_radius`×border 待验证

---

# 十二、第 35 轮报告

## 12.0 CC 的裁定已记录并生效

| CC 裁定 | 处置 |
|---|---|
| **确定性地形改用 ≤1pp 判**（有随机性的用 10 种子范围） | 已采纳，写进 §十二 的判定表 |
| **收回"同类型一律算其他地形"**（严格版） | 已在 §12.1 用三方案实测复核 |
| `beach_terrain` 参数化 + 兜底与否对比 | 待做（本轮先做第 1 条） |
| `circle_radius` 只改起始位置、生长标"未证实" | 待做 |

## 12.1 第 1 条：地形间距三方案并排测（**结果是一个平局，请你裁**）

**工具**：`scratch/_probe_spacing_variants.mjs`（单种子两把尺）＋ `scratch/_probe_spacing_multiseed.mjs`（10 种子分布）

### 三方案的写法（就是 `:505` 那一行）

| 方案 | 判定式 |
|---|---|
| **A 严格** | `regOf[j] !== -1 ? regOf[j] !== r : this.terrain[j] !== base` |
| **B 折中** | `regOf[j] !== -1 ? regOf[j] !== r : (this.terrain[j] !== base && this.terrain[j] !== T)` |
| **C 全放开** | `this.terrain[j] !== base && this.terrain[j] !== T` |

### 尺子① 水（10 个种子，DE 值是否落在范围内）

| 指标 | DE | **A 严格** | **B 折中** | **C 全放开** |
|---|---|---|---|---|
| 中水% | 10.5 | 0.9 [0.7, 1.4] ❌ | 1.7 [1.2, 2.4] ❌ | **11.2 [7.8, 16.6]** ✅ |
| 浅水% | 11.3 | 19.7 [14.8, 24.8] ❌ | 18.8 [14.3, 23.8] ❌ | **9.4 [6.4, 12.7]** ✅ |
| 中/浅比 | 0.93 | 0.05 [0.04, 0.06] ❌ | 0.09 [0.07, 0.11] ❌ | **1.22 [0.62, 1.73]** ✅ |

→ **只有 C 覆盖 DE 的三项水指标。**

### 尺子② 森林（10 个种子）

| 指标 | DE | **A 严格** | **B 折中** | **C 全放开** |
|---|---|---|---|---|
| 森林块数 | 29 | 31 [31, 31] | 31 [31, 31] | 20 [17, 24] |
| **森林最大块** | **149** | **82 [75, 131]** | 76 [75, 79] | **358 [222, 529]** |
| 森林中位块 | 79 | 75 [75, 76] | 76 [75, 78] | 75 [74, 76] |
| 森林格数 | 2116 | 2043 [1990, 2073] | 2040 [1981, 2073] | 2067 [2016, 2073] |

→ **A/B 明显更接近 DE（最大块 82/76 vs DE 149），C 最差（358）** —— 与你的预判一致（"全放开让树林连成一片"）。
→ ⚠️ 但注意：**DE 的 149 比 A 的上限 131 还大**，即**A/B 也覆盖不了 DE** —— 真值落在 A 与 C **之间**。

### 🔴 机制（按原因计数的 trace 查出来的）

C 之所以水对得上，**不是**因为"同类型放行"本身，而是因为**水遮罩 10 条链能一路跑到底**：

| 条 | A（严格） | B（折中） | **C（全放开）** |
|---|---|---|---|
| 1 VODA→中水 | 2535 | 2535 | **3258** |
| 2 VODA→中水 | **0** | 654 | 0 |
| 3 中水→水4 | 165 | 380 | 2315 |
| 4 中水→浅水 | 2370 | 2809 | 943 |
| 5 水4→中水 | 165 | 380 | 2315 |
| 7 中水→深水 | **0** | **0** | **1600** |
| 9/10 水4/深水→中水 | **0** | **0** | 1272 / 328 |

→ **A/B 下 #7/#9/#10 的 base 根本不存在，级联直接断掉**；C 下整条链跑完，浅/中/深水三层都出来了。水最终成分的差异**全部**来自这里。

### 请你裁（我的建议，但**没有自行拍板**）

- **完成标准里列的是**：主要地形占比 ≤1pp、水占比 ≤2pp、水连通块数相同、资源物件 ≤15%、物件总数 ≤5% —— **森林"块形"不在其中**，是你本轮为打破平局引入的第二把尺子。
- 按**完成标准**：C 全面胜出（中水 +0.7pp ✅、`Underbrush` +0.2、`Forest,Med` −0.2、`Dry Grass` −0.2、`Forest` 0.0、`GOLD_MINE`/`STONE_MINE`/`GOAT`/`FORAGE_BUSH` **四个资源物件全部 0%**）。
- 按**森林尺子**：A/B 胜（但两者也都覆盖不了 DE 的 149）。
- **我的建议**：**采用 C**，把"同一条指令自己的各团也会合并"（这正是 358 的来源）**当成另一个问题单独查**（可能与 `number_of_clumps`／种子分离有关，而不是 spacing）。理由是：水遮罩链的级联断掉是**结构性**的（A/B 永远出不了中水 10.5%），而森林过并可能是**可单独修**的。
- ⚠️ **当前代码停在 C，标注"待 CC 批准"**；改回 A/B 的写法已写在 `:500-504` 的注释里，一行可换。

## 12.2 本轮改动与回归

| | |
|---|---|
| 实质改动 | **1 行**（`:505` 的 spacing 判定式）＋ 注释；diff **7 增 1 删** |
| 新增工具 | `_probe_spacing_variants.mjs`、`_probe_spacing_multiseed.mjs` |
| 回归 | `parseAll` **179/180** ✅｜`Arabia` 种子 2 → **物件 6121 ｜ 森林 9.8%**（A/B 下是 5478 / 9.4%） |
| 范围 | `src/` 与素材 **0 改动** ✅ |

⚠️ **`Arabia` 在 C 下变了**（5478 → 6121）。同 §10.3：**缺 DE 阿拉伯基准图，无法判优劣**。

## 12.3 未做（等你裁定后按序继续）

2. `beach_terrain` 参数化 + 兜底与否对比
3. `circle_radius` 只改起始位置（生长是否受边界约束标"未证实"）
4. 鱼：按原因计数 → 再做 zone 口径
5. 180 个脚本全量生成不报错
6. 阿拉伯基准图（等 CC 给路径）

---

# 十三、第 36 轮报告

## 13.1 第 1 条：查证 + 方案 D

### ① 查证结果（CC 的问题：间距检查在放种子还是生长时调用）

我早前抓的 genie-rms 源码结构（`RMS引擎语义-给CC.md` §12.3）明确：

```
const baseArea = Math.min(2, 2 * Math.sqrt(desc.tiles / desc.numberOfClumps))
① 放种子：每放一个，就从全局栈里 removeArea(x, y, baseArea) 挖掉周围 → 保证团与团不挨着
② 各团在自己的栈里长到 tiles 总数
spacing_to_other_terrain_types（在 canPlaceTerrainOn() 里，生长时当 preference 用）：
    if (tile.terrain !== desc.baseTerrain && tile.terrain !== desc.type) return 0
```

→ **答案是"两套独立机制"**：`spacing_to_other_terrain_types` 在**生长**时用（且**只容忍 base 和自己** ＝ 我们的方案 C 谓词）；**种子分离**是另一套（`removeArea`）。
→ 🔴 **我们的 `seed()` 原本没有 `removeArea`**，而 C 的谓词看的是 `terrain`（要到指令末尾才写），所以**同一条指令的种子可以紧挨着放** → 团块从起点就连着 → 这正是 358 的来源。**CC 的假设方向完全正确。**

### ② 方案 D 的实现

`seed(n, ok, mark, seedRadius)`：每放一个种子就把周围 `seedRadius` 的格子挖掉（对应 `removeArea`）。

**半径用推导值，不是拟合值**：
> 每团平均格数 = `tiles / numberOfClumps`；团近似圆盘 → **团半径 = √(每团格数 / π)**。
> 种子相隔"一个团半径" → 各团长满后**刚好相切**：既不像 A/B 被 spacing 判死（水链断掉），也不像 C 从起点就重叠。
> 验算：森林 `tiles=1866, clumps=12` → √(1866/12/π) = **7.04**。

⚠️ **genie-rms 写的 `min(2, 2*sqrt(tiles/clumps))` 恒等于 2，实测无效**（最大块只从 358 降到 329）——那是 AoC 近似，不适用于 DE。

### ③ 四方案对比（森林＝10 种子分布；水同前）

| 指标 | DE | A 严格 | B 折中 | **C 全放开** | D（半径 2） | **D（团半径）** ⬅ 采用 |
|---|---|---|---|---|---|---|
| 中水% | 10.5 | 0.9 ❌ | 1.7 ❌ | 11.2 ✅ | 11.2 ✅ | **11.2 ✅** |
| 浅水% | 11.3 | 19.7 ❌ | 18.8 ❌ | 9.4 ✅ | 9.4 ✅ | **9.4 ✅** |
| 中/浅比 | 0.93 | 0.05 ❌ | 0.09 ❌ | 1.22 ✅ | 1.22 ✅ | **1.22 ✅** |
| 森林块数 | 29 | 31 | 31 | 20 [17,24] | 21 [18,23] | **23 [21,25]** |
| **森林最大块** | **149** | 82 [75,131] | 76 [75,79] | 358 [222,529] | 329 [223,449] | **247 [150,299]** |
| 森林中位块 | 79 | 75 | 76 | 75 | 75 | **75 [74,75]** |

**判定（按 CC 的规则）**：D 的**水三项不退步**（与 C 逐位相同）且**森林更接近 DE**（最大块 358→247）→ **采用 D** ✅

### ④ 仍差的部分（诚实报告，不掩盖）

- DE 的 **149 比 D 的下限 150 还小 1** —— 即 **D 也没能覆盖 DE 的最大块**（只差 1）。
- 块数 23 [21,25] vs DE 29，中位 75 vs 79 → DE 的森林比我们**更碎一点**。
- 单种子（种子 1）在半径 8 时曾给出**最大块 150**（与 DE 149 几乎逐格吻合），但 10 种子范围是 [150,299] → **种子分离只能解释一部分**，剩下的可能来自：我方森林的两条链（§5.2）产出的地形种类不同、被我的"10+88 合并成一个 mask"的尺子并成一块。

## 13.2 本轮改动与回归

| | |
|---|---|
| 实质改动 | **2 处**：`seed()` 支持 `seedRadius`（对应 genie-rms `removeArea`）；`terrainCmd` 传"团半径"；`spacing` 谓词维持 C（已获 CC 批准） |
| 回归 | `parseAll` **179/180** ✅｜`Arabia` 种子 2 → **物件 5902 ｜ 森林 9.6%** |
| 范围 | `src/` 与素材 **0 改动** ✅ |

⚠️ **`Arabia` 又变了**（C: 6121 → D: 5902；A/B: 5478）。**第 6 条（阿拉伯基准图）现在是唯一瓶颈** —— 没有它，阿拉伯的数字每改一次都在变，无法判断好坏。

## 13.3 未做（按序）

2. `beach_terrain` 参数化 + 有/无兜底对比
3. `circle_radius`：起始位置不受边界约束（生长标"未证实"）
4. 鱼：按原因计数 → zone 口径
5. 180 个脚本全量生成不报错
6. 阿拉伯基准图（等 CC 给文件路径）

---

# 十四、第 37 轮报告

## 14.0 CC 交代的"尺子核对"：✅ 两边口径一致

- DE 基准图里**只有两种森林地形**：`10 Forest`(211 格) 与 `88 Forest,Mediterranean`(1905 格) —— **恰好等于 dat 的森林认定**（用 `de_terrain_manifest.json` 的名字匹配 `forest|jungle|bamboo|palm|pine|oak|…` 全表扫过，DE 图上没有第三种森林地形被我漏掉）。
- 我的尺子对**两边用同一个集合、同一个判据**：`FOREST = {10, 88}`，DE 侧 `FOREST.has(deT[i])`、我方 `FOREST.has(e.terrain[i])`。
- → **合并规则一致，块数比较有效** ✅（脚本：`scratch/_probe_spacing_multiseed.mjs`）
- 📌 记为**观察项**：DE 29 块 / 中位 79，我方 23 块 / 中位 75 —— 按 CC 指示，等阿拉伯基准图到了用第二张图一起看再决定动不动。

## 14.1 第 1 条：`beach_terrain` 参数化（已实现；兜底**保留**，由数据判定）

### 查证（CC 要求：先查手册/官方文档怎么定义）

| 来源 | 结论 |
|---|---|
| AoC 手册 `tc-rms-guide.md` | ❌ **没有** `beach_terrain` |
| 官方 DE 页 [RMS Features](https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/rms-features) | ❌ **没有**（该页 13 条里不含它） |
| **DE 脚本真实用法** | ✅ **`create_terrain` 块的参数**，且总与 `terrain_mask 1` 同块 |

```rms
includes/coastal_blending.inc:14-21   （另 :40/:68/:96 三处同构）
create_terrain COASTAL_TERRAIN
{ base_terrain COASTAL_BASE  land_percent 100  number_of_clumps 512
  beach_terrain BEACH_TERRAIN     ← 这条地形临水的那一圈 → BEACH_TERRAIN
  terrain_mask 1 }
```
另有 `includes/forest.inc:1632-1637` 六处；`BEACH_TERRAIN` 按主题取值（如 `Acclivity.rms:81 #const BEACH_TERRAIN 2`）。

### 实现（3 处）

| 位置 | 改动 |
|---|---|
| `:80` | 新增 `this.beachOf = new Map()`（地形 id → 沙滩地形） |
| `:493` | `terrainCmd` 里 `if (P.beach_terrain) this.beachOf.set(T, Number(P.beach_terrain[0]))` |
| `:586-587` | `applyBeaches`：**脚本参数优先**（这条地形临水 → 用它指定的沙滩），没指定才走全局兜底 |

### 有兜底 / 无兜底对比（数据判定）

| | 沙滩占比 | DE |
|---|---|---|
| **有兜底（采用）** | **1.5%**（309 格） | 2.5% |
| 无兜底 | **0.0%**（0 格） | 2.5% |

🔴 **判定：兜底保留**。
⚠️ **重要限定**：**地中海这张图的脚本根本没有写 `beach_terrain`**（`beachOf` 为空）—— 所以参数化对**本基准图无影响**，它只对实际用它的脚本（`coastal_blending.inc` 那类）生效，而那些图目前没有 DE 基准可比。**这条"保留兜底"的结论只在本图上成立**，换图可能不同。

## 14.2 第 2 条：`circle_radius` 与边界

### 查证：这条规则**确实有用**（不是理论问题）

🔴 **DE 里有 21 处脚本**在 `create_player_lands` 块内**同时**写了 `circle_radius` 与 `*_border`
（例：`AfricanClearing.rms:24`、`Alpine_Lakes.rms:33`、`Chaos Pit.rms:155`、`Crater.rms:22` …）。
官方 DE 页原文：*"NOTE: left_border, right_border, bottom_border, top_border **do not affect the players' starting positions when `circle_radius` is used**."*

### 我们的现状：**起始位置本来就不受边界约束** → 已符合官方注记，**无需改代码**

- `planPlayerLands` 只用 `circle_radius` + 地图中心算起点：`cx = N/2 + cos(ang)*rr`（`rmsEngine.mjs:176-179`），**全程不碰 `*_border`**。
- `planLand` 里 `if (at) { cx = at.x; cy = at.y; }`（`:214`）—— 玩家陆地直接取算好的起点，**边界只参与 `free()`（生长判定）**。

### 未证实项（按 CC 指示标注，未改）

- 官方原文只说了"**起始位置**"不受影响；**底座（`base_size` 圆盘）与后续生长**是否也不受边界约束，**原文没说** → **标「未证实」，保持现状**。
- 影响面很实：那 21 处脚本里，若玩家起点被 `circle_radius` 推到 border 带内，我们的**底座圆盘会被 `free()` 的椭圆/矩形裁掉**，可能导致玩家陆地偏小甚至缺失（与地中海修复前 `land 101` 消失同类）。**这是待验证项，建议优先于"兜底"之类的细节。**

## 14.3 第 3 条：鱼（只读计数完成，zone 口径未做）

**三个来源与实放**（`scratch/_probe_fish_reasons.mjs`）：

| id | 名字 | `number_of_objects` | 声明间距 | cap | **实放** | DE |
|---|---|---|---|---|---|---|
| 69 | `FISHS`(MELKARYBA) | 9999 | `temp_ 6` | 3456 | **292** | `SHORE_FISH` 37 |
| 456 | `FISH2` | 6 | `min_ 4` | 6 | **6** | `FISH_SALMON` 12 |
| 458 | `FISH4` | 170 | `min_ 8` | 170 | **145** | `FISH_SNAPPER` 31 |
| | | | | | **合计 443** | **合计 80** |

🔴 **`间距` 完全生效，鱼偏多不是因为间距失效**（实测最近邻，精确命中声明值）：

| 鱼 | 声明 | **实测最近邻（最小 / 均值）** |
|---|---|---|
| `FISHS` | 6 | **6.00 / 6.47** ✅ |
| `FISH4` | 8 | **8.00 / 9.01** ✅ |
| `FISH2` | 4 | 17.03 / 32.17 |

**水域拥挤度**（3997 水格、9517 物件）：半径内已有物件的水格占比 —— r=2: 16.3%｜r=4: 33.2%｜r=6: 47.4%｜r=8: 59.0%｜r=12: 76.3%。

→ **所以偏多的原因是"DE 用了我们没实现/没开启的约束"**，两个候选（都还没做）：
1. **`max_distance_to_other_zones`** ← 我们有实现但 **`TUNE.useMaxZone` 默认关**，且 **zone 口径未定**（第 34 轮第 3 条就是这个）。DE 手册说它"keeping objects **away from the shore**"——正好像是把鱼赶离岸边。
2. **`GNR_SFISH_SPARSE`**（疑似引擎注入旗标）：第 27 轮实测把它注入后 `FISH_SNAPPER` `FISHS` **218 → 56**（DE 37），效果量级吻合；但**"它由引擎注入"这一点我从未证实**（第 26→27 轮我曾错判过 `GNR_*` 的来源）。

## 14.4 第 4 条：180 个脚本全量生成 —— **179/180，且发现 6 个脚本病态慢**

**工具**：`scratch/_sweep_gen_all.mjs`（登记在 §13 的清单里之外，本轮新增）

```
通过 179 / 180；失败 1；物件合计 1,198,084
失败：real_world_manchuria.rms → 未定义常量：MAPSCALE_AREA
```

✅ **唯一失败与解析回归里那个失败是同一个**（早已存在、CC 已接受），**不是本轮引入的生成错误** → **180 个里有 179 个能完整生成**。

🔴 **新发现：6 个脚本病态慢**（同一台机器、size=144）：

| 脚本 | 耗时 | 物件数 |
|---|---|---|
| **`Wade.rms`** | **283.0 s** | 4361 |
| **`MountainRange.rms`** | **239.5 s** | 4187 |
| **`NorthernIsles.rms`** | **225.5 s** | 4316 |
| **`Acclivity.rms`** | **130.8 s** | 2907 |
| **`Golden_Stream.rms`** | **93.0 s** | 4113 |
| `Team_Islands.rms` | 18.1 s | 4270 |
| 其余 173 个 | 0.2 ~ 7 s | — |

**共同特征**：**全是水/海岸线比重高的地图**，而且**物件数反而偏少**（2900~4400，而快的图有 10000+ 物件）→ **不是物件放置慢，是地形/水相关环节慢**，疑为超线性循环。
**影响**：单脚本 4.7 分钟让"全量验收"变得不可行（本轮一次扫描 ~20 分钟）。**建议列为本轮之后的第一个待查项**（可用 `node --cpu-prof` 定位）。

## 14.5 回归与基线

| | |
|---|---|
| `parseAll` | **179/180** ✅ |
| `Arabia` 种子 2 | **物件 5902 ｜ 森林 9.6% ｜ 有高度 14.0%**（与第 36 轮一致 —— beach 改动对它无影响） |
| 地中海 | 中水 11.2% / 浅水 8.1% / 中浅比 1.38（与第 36 轮逐位相同）｜物件总数 9517｜`Beach` 1.5% |
| 范围 | `src/` 与素材 **0 改动** ✅ |
| 基线 | 🔴 **自动备份 `03:32` 又把本轮改动提交了**（`HEAD=e32b759d6`），所以 `git status` 现在干净；本轮改动 = `git show e32b759d6 -- tools/rms/` |

## 14.6 未做 / 下一步建议

| 优先级 | 事项 |
|---|---|
| **高** | **6 个脚本病态慢**（§14.4）—— 不解决则全量验收不可行 |
| 高 | **`circle_radius` × 边界：底座/生长是否也该免边界**（§14.2，21 处脚本受影响） |
| 中 | 鱼：`max_distance_to_other_zones` + **zone 口径**（第 34 轮第 3 条）→ 再看 `GNR_SFISH_SPARSE` 的来源能否证实 |
| — | ~~阿拉伯基准图（唯一瓶颈，等 CC 给路径）~~ → **任务书已作废此项，见 §15.0** |

---

# 十五、第 38 轮 · **已读任务书 2026-10-09**

已读任务书 2026-10-09

**两份文件已通读**：`docs/02-design/给DD的任务书.md`（57 行）＋ `docs/02-design/战术模式-DE地图与玩法设计.md`（137 行）。
**以任务书为准**，与此前零散指令冲突处按任务书执行。

## 15.0 任务书带来的口径变更（我据此调整，不再按旧口径跑）

| 项 | 旧口径（此前几轮） | **任务书新口径** |
|---|---|---|
| **阿拉伯基准图** | CC 第 33–37 轮："唯一瓶颈，必须补" | 🔴 **不要**（主人：DE 图是随机的，单张只是样式） |
| 一致的范围 | 地图 + 玩法都往 DE 靠 | **只要地图一致**；玩法不复刻；**战略模式不动** |
| 地图尺寸 | 144 为主 | **120×120 落地**（校准仍用 144 DE 基准图，同尺寸才可比） |
| 只改哪里 | — | **只改 `tools/rms/` 与 `docs/02-design/`**；`src/`、`public/` 素材一律不动 |
| 常数 | — | **不拍脑袋**：手册原文／DE dat／genie-rms 结构／DE 基准图实测；缺出处标「推断」 |
| 判据 | 同 | 随机量看 **10 种子范围是否覆盖 DE 值**；确定性地形 **差 ≤1pp** |
| 战场地形来源 | 全由脚本生成 | **大形状用真实地理骨架 + 细节用 DE 样式**（脚本的 LAND/ELEVATION 段要能跳过） |

## 15.1 第一步第 1 条的准备工作：先冻结基线（因为验收要求"逐位不变"）

任务书要求提速后 **"地中海与阿拉伯的所有统计逐位不变"** → **改动前先冻结基线**，改完逐位比对。
工具：`scratch/_snapshot_stats.mjs`（新增）—— 对 `Mediterranean_medisouth` 与 `Arabia` 各 10 个种子记录
`terrain / layer / elev / landId / objects(有序 id,x,y) / starts` 的 sha256 与计数。

（本轮实测数据接在下面）

## 15.2 第一步第 1 条：**6 个慢脚本提速** —— 完成

### ① 找热点（按任务书用 `node --cpu-prof`，不猜）

```
$ node --cpu-prof --cpu-prof-dir=scratch/out/prof scratch/_prof_one.mjs Acclivity.rms 144 2
Acclivity.rms  size=144 seed=2  123826ms  物件 2907

总采样 123.9 秒
    123.33s   99.6%  ok  @rmsEngine.mjs:514        ← 全部时间都在这一个函数
      0.11s    0.1%  readFileUtf8
      …（其余全部 <0.1s）
```

（工具：`scratch/_prof_one.mjs` 跑单脚本；`scratch/_prof_report.mjs` 按自身耗时聚合 `.cpuprofile`）

### ② 根因

`ok`（`terrainCmd` 的候选格判定）里那段 **spacing 方形邻域扫描**：每次调用要扫 `(2·spacing+1)²` 格。
而 `ok` 在 `seed()` 里要对**全图 20736 格各调一次**（还要被 `grow` 的每次候选弹出再调一次）→
`20736 × (2·spacing+1)²` 随 spacing 平方增长。水/海岸多的图 `number_of_clumps` 与 `spacing` 都大，于是爆炸。

### ③ 修法：二维前缀和，O(spacing²) → **O(1)**（逐格等价）

**依据（不是经验）**：spacing 判定只看 `this.terrain[j]`（`!== base && !== T` 即算"别的类型"），
而 **`this.terrain` 在本指令执行期间完全不变**（要到函数末尾才统一写入）⇒ "半径 spacing 的方形邻域内有没有坏格"
是个**静态**问题，建一次前缀和（O(N²)）之后每次判定 O(1)。
**等价性证明**：原写法对越界格是 `continue`（跳过）⇒ 前缀窗口取「与网格的交集」即可，两侧集合逐格相同。

### ④ 🔴 踩到的坑（记下来，这类"等价优化"的通用陷阱）

**第一版对"非整数 spacing"不等价**，证据是全量扫描的物件合计从 `1,198,084` 变成了 `1,201,299`（+3215）：

- `Murkwood.rms` 有 4 条 `spacing_to_other_terrain_types 1.656 / 3.312`（非整数）。
- 原写法 `for (dy = -1.656; dy <= 1.656; dy++)` 步长错开 → `xx = x + dx` 是**非整数** → `this.idx()` 取到
  **非整数下标** → `this.terrain[小数]` 是 `undefined` → `undefined !== base && !== T` 为真 → **该格被判为"坏格"拒绝**。
  也就是说：非整数 spacing 在原实现里几乎会拒掉所有非边缘格。
- 我的前缀窗口用小数算区间 → 索引变 `NaN` → `NaN > 0` 为假 → **不拒绝** ⇒ 行为反了。

**修法**：`const spacingInt = Number.isInteger(spacing) && spacing > 0;` —— **只有整数走前缀和，非整数原样走老循环**
（全库只有 `Murkwood.rms` 4 条非整数，性能无关）。另 `NaN×4`（原文写 `undefined`）两侧都是"不拒绝"，本就等价。

### ⑤ 结果

| 脚本 | 改前 | **改后** | 倍数 |
|---|---|---|---|
| `Wade.rms` | 283,019 ms | **715 ms** | 396× |
| `MountainRange.rms` | 239,534 ms | **526 ms** | 455× |
| `NorthernIsles.rms` | 225,472 ms | **584 ms** | 386× |
| `Acclivity.rms` | 130,798 ms | **452 ms** | 289× |
| `Golden_Stream.rms` | 92,970 ms | **965 ms** | 96× |
| `Team_Islands.rms` | 18,090 ms | **1,126 ms** | 16× |

✅ **验收：6 个全部 ≤10 秒**（最慢 1.13 秒）。

### ⑥ 验收：**结果逐位不变**（任务书硬要求）

| 检查 | 结果 |
|---|---|
| 地中海 + 阿拉伯 **各 10 个种子** × 7 字段（`terrain/layer/elev/landId/物件哈希/物件数/出生点`）＝ **140 项** | ✅ **全部逐位相同** |
| 全量 180 脚本**物件合计** | 改前 `1,198,084` → 改后 `1,198,084` ✅ **完全一致** |
| 全量 180 脚本**通过数** | 179/180（唯一失败＝早有的 `real_world_manchuria` 缺 `MAPSCALE_AREA`，与生成无关）✅ |
| **全量扫描总耗时** | ~20 分钟 → **91.4 秒**（顺带的红利） |

### ⑦ 回归

```
node tools/rms/parseAll.mjs 3        → 179/180 ✅（指令总数 200942 不变）
node tools/rms/genMap.mjs Arabia.rms 2 144 → 物件 5902 ｜ 森林 9.6% ｜ 有高度 14.0%（与第 37 轮逐位相同）
```

### ⑧ 改动与范围

| | |
|---|---|
| 改动 | **仅 `tools/rms/rmsEngine.mjs` 一处**（`terrainCmd` 的 spacing 判定）：**47 增 12 删** |
| 新增工具（`scratch/`，未入库） | `_prof_one.mjs`、`_prof_report.mjs`、`_snapshot_stats.mjs`、`_probe_spacing_values.mjs` |
| `src/`、`public/` | **0 改动** ✅（任务书第 2 条） |

## 15.3 🔴 本轮最重要的发现：**我的探针此前大多没传 `unitRestrict`**（自查更正）

做第 2 条时发现：**我方所有鱼都落在 `Dirt 3`（陆地）上**。查下去不是引擎错，是**我的探针配置错**：

```js
// 引擎 okTile 的水生判定（rmsEngine.mjs）
const restrict = this.unitRestrict ? this.unitRestrict.get(id) : undefined;
const waterOnly = restrict !== undefined ? WATER_RESTRICTIONS.has(restrict) : /FISH|WHALE|…/.test(name);
```
探针既没传 `unitRestrict`（dat 通行类别表），**也没传名字表** ⇒ `waterOnly` 变成 `false` ⇒ **水生物件上了岸**。

**影响面审计**（我扫了全部 `scratch/_*.mjs`）：只有 `genMap.mjs` / `_snapshot_stats.mjs` / `_sweep_gen_all.mjs` / `_prof_one.mjs` 传了；
**其余 14 个探针都没传** ⇒ **「物件类」数字受影响；「地形类」不受影响**（已实测：地中海 seed 1 地形**完全一致**）。

**更正后的关键数字**（地中海 seed 1）：

| | 错配置（我此前报的） | **正确配置** | DE |
|---|---|---|---|
| 物件总数 | 9517 | **9220** | 9254（差 **−0.4%**） |
| `SHORE_FISH` | 292 | **89** | 37 |
| `FISH_SNAPPER` | 145 | **48** | 31 |
| `GOAT` | 28 | **31** | 26 |

→ **§14.3 里"鱼 +689%/+368%"的结论作废**，正确量级是 `SHORE_FISH` +141%、`FISH_SNAPPER` +55%。
→ 另：修正后**物件总数差 −0.4%**（此前报 +2.5%）—— **比原报告更准**。
→ **已修**：`_probe_fish_shore.mjs`、`_compare_objects.mjs` 补上该表；并在两处写了警示注释。其余探针若还要用，用前先补。

**另记一条引擎侧隐患**（未改，供 CC 判）：`unitRestrict` 与名字表**都缺**时，水生判定会**静默失效**（不报错、结果错）。考虑加一句"两者都缺且 id 命中水生物件模板时报错/告警"，避免下次再踩。

## 15.4 第 2 条：鱼 —— **离岸距离分布与 DE 一致**（⇒ 走"查脚本开关来源"这一支）

**工具**：`scratch/_probe_fish_shore.mjs`（多源 BFS 求每个水格到最近陆格的 4 邻格距）

| | n | 最小 | p25 | **中位** | p75 | 最大 |
|---|---|---|---|---|---|---|
| **DE 基准图** | 80 | 1 | 1 | **5** | 9 | 23 |
| **我方（10 种子合计）** | 1511 | 1 | 2 | **6** | 13 | 30 |

- **DE 中位 5 落在我方 10 种子的中位范围 [4, 9] 内** ✅ → **离岸分布一致**
- 离岸 >5 格的占比：DE 37.5% vs 我方 53.9%（我方略偏外，但同量级）

→ 按 CC 的规则（"DE 明显更远 → 定 zone 口径；**分布一样只是数量多 → 再查脚本开关来源**"）：
**应走后者** —— 即查 `GNR_SFISH_SPARSE` 这类开关的**来源**（脚本 / 引擎 / 大厅选项），**证实前不使用**。
（我对该旗标的来源**至今没有证据**：`Mediterranean.rms:225-229` 只定义了 `GNR_NORMALBIRDS`/`GNR_MAPSTRAGGLE`/`GNR_STANDARDFISH`，**没有** `GNR_SFISH_SPARSE`。）

## 15.5 第 3 条：沙滩 —— ❌ **刚好落在范围外**

| | 我方 10 种子 | DE |
|---|---|---|
| `Beach` 占比 | 均值 **1.75%**，范围 **[1.18, 2.33]** | **2.54%** |

DE 的 2.54% 比我方**上限 2.33% 高 0.21pp** → 范围外。差得很近，但按判据算未达标。
（注：沙滩是**地形**，不受 §15.3 那个配置问题影响。）

## 15.6 第 4 条：边界裁剪症状 —— 🔴 **21 个里 13 个受影响**

**方法**：同一脚本跑两遍 —— 原样 vs（在内存 AST 里）把 `create_player_lands` 块的 `*_border` 全去掉，比"玩家陆地总面积"（`landId` 100~109 的格数）。
**工具**：`scratch/_probe_border_clip.mjs`

| 脚本 | 原样 | 去掉 border | 差 |
|---|---|---|---|
| 🔴 **`Dorothea Quarry.rms`** | **0** | 18664 | **+18664（玩家陆地完全没了）** |
| `Shrubland.rms` | 5787 | 19977 | +14190 |
| `Crater.rms` | 6384 | 20431 | +14047 |
| `Socotra.rms` | 7215 | 20699 | +13484 |
| `Chaos Pit.rms` | 2763 | 15682 | +12919 |
| `VolcanicIsland.rms` | 5127 | 17895 | +12768 |
| `Acclivity.rms` | 9143 | 20039 | +10896 |
| 🔴 **`Graupel.rms`** | **26** | 10898 | **+10872（几乎没了）** |
| `NorthernIsles.rms` | 9592 | 20349 | +10757 |
| `Paradise Island.rms` | 9224 | 19578 | +10354 |
| `Team_Islands.rms` | 12451 | 20736 | +8285 |
| `Team Glaciers.rms` | 11356 | 18021 | +6665 |
| `Dingos.rms` | 8571 | 10368 | +1797 |

**受影响 13 个**：`Dorothea Quarry`、`Shrubland`、`Crater`、`Socotra`、`Chaos Pit`、`VolcanicIsland`、`Acclivity`、`Graupel`、`NorthernIsles`、`Paradise Island`、`Team_Islands`、`Team Glaciers`、`Dingos`
**无差别 8 个**：`Alpine_Lakes`、`Hengehold`、`Islands`、`Kawasan`、`Lowland`、`Ravines`、`RingFortress`、`Wolf_Hill`

🔴 **这不是"轻微裁小"**：`Dorothea Quarry` 玩家陆地 **0 格**、`Graupel` **26 格** —— 玩家等于**没有出生地**。
**但这是 DE 脚本 + 官方注记的组合**，官方只说"起始位置"不受边界影响；**底座与生长是否也不该被裁，原文没写**。
→ **请 CC 裁定**：是否改成「用 `circle_radius` 时，玩家陆地的 `free()` 不施加 `*_border`」。（数据支持改，但依据只有"官方只说起始位置"这一条反面推断，我没擅自改。）

## 15.7 第 5 条：120×120 复验 —— ✅ **无报错，比例一致**

| | 144 | **120** |
|---|---|---|
| 地中海 | 无报错 ✅ 物件均值 9063 | **无报错 ✅ 物件均值 8265** |
| 阿拉伯 | 无报错 ✅ 物件均值 5176 | **无报错 ✅ 物件均值 4033** |

**地形比例（10 种子均值 [最小,最大]）**：

| 地形 | 144 | 120 |
|---|---|---|
| `Water, Shallow` | 9.4% [6.4,12.7] | 10.3% [7.9,11.6] |
| `Water, Medium` | 11.2% [7.8,16.6] | 10.8% [7.0,14.8] |
| `Dirt 3` | 44.0% [38.3,49.6] | 43.4% [39.7,49.0] |
| `Underbrush` | 18.8% [18.4,19.2] | 18.9% [18.4,19.6] |
| `Forest, Mediterranean` | 9.0% [9.0,9.0] | 9.0% [9.0,9.0] |
| `Dry Grass` | 5.0% [5.0,5.0] | 5.0% [5.0,5.0] |
| `Beach` | 1.7% [1.2,2.3] | 1.9% [1.5,2.3] |

阿拉伯同样逐项一致（`Beach` 0.2/0.2、`Forest` 1.1/1.1、`Forest, Autumn` 1.4/— 等同量级）。
→ **脚本自身按尺寸缩放（`land_percent`）生效，两种尺寸比例一致** ✅

## 15.8 Murkwood 非整数 spacing（CC 指示：登记为**已知缺陷**，暂不改）

已按 CC 裁定登记：

> **已知缺陷（2026-10-09 登记）**：`Murkwood.rms` 的 `spacing_to_other_terrain_types` 是**非整数**（1.656 / 3.312）。
> 现实现（第 38 轮为此**刻意保留的老写法**）在非整数起点上 `dy++` 步长错开 → 算出非整数坐标 → `this.idx()`
> 取到 `undefined` → **被当成"坏格"**，于是几乎拒掉所有非整数邻域内的格子。
> **这是我们的缺陷，不是 DE 的行为**（DE 地图是整数格）。**推断 DE 会把 spacing 取整（向下取整）。**
> **处置**：暂不改；等第一步全部做完**单独修一次**（按向下取整），**只允许 `Murkwood.rms` 的结果变化**，
> 其余 179 个脚本必须逐位不变（用 `_snapshot_stats.mjs` + 全量扫描物件合计双向校验）。

## 15.9 回归与范围（本轮）

```
parseAll 3        → 179/180 ✅（指令总数 200942 不变）
genMap Arabia 2 144 → 物件 5902 ｜ 森林 9.6% ｜ 有高度 14.0% ✅（与第 38 轮逐位相同）
```
**本轮引擎 0 改动**（只新增/修正 `scratch/` 下的探针）；`src/`、`public/` **0 改动** ✅

## 15.10 第一步第 6 条（未做）

**接口预留**：支持外部传入地理骨架（陆地/水、河流、高度）→ 跳过脚本的 LAND / ELEVATION 段，只跑 TERRAIN / OBJECTS；并支持**强制指定主题**；
用一份手工骨架（一条河穿过平地）跑通并出图给 CC 看。**下一轮做。**

---

# 十六、第 40 轮报告（第 1–4 条）

## 16.1 第 1 条：引擎缺表即报错 ✅

**改动**（`rmsEngine.mjs` 构造函数，紧跟字段赋值之后）：水生判定（`okTile`）依赖 `unitRestrict`（`:849`）与 `objNames`（`:852`）两张表，
两者同时缺失时会**静默**把"只能在水里"的物件放到陆地上（第 39 轮实测：`FISHS` 292 条全在 `Dirt 3` 上，不报错）。
现在**缺任一张就在构造期抛错并写明缺哪张**：

```
$ node … new MapEngine(sections, { size:144, players:2, seed:2 })
✅ 报错：MapEngine 缺少必需查表（缺任一张都会静默错放水生物件）：
   unitRestrict（dat 的 unit.terrain_restriction 表 → scratch/de_unit_restriction.json）；objNames（random_map.def 的物件名表）
```

**正式入口全部正常** ✅

```
genMap Arabia.rms 2 144  → 物件 5902
parseAll 3              → 179/180
全量扫描（180 脚本）     → 通过 179 / 180，失败 1（＝早有的 real_world_manchuria 缺 MAPSCALE_AREA），物件合计 1,198,084
```

**连带修复**：两个会因此报错的验收工具补上了表（`_snapshot_stats.mjs`、`_prof_one.mjs`），并新增共享查表模块 `scratch/_dat.mjs`，避免以后再漏。

## 16.2 第 2 条：边界裁剪修复 ✅

**改动**（`rmsEngine.mjs`）：`planLand(P, at, forcedId, playerDivisor, ignoreBorders)`；
`planPlayerLands` 在脚本写了 `circle_radius` 时传 `ignoreBorders = true` ⇒ 该玩家陆地的 **起始位置 / 底座 / 生长** 一律不施加 `*_border`（`bx0=0,bx1=N,by0=0,by1=N,hasBorder=false`）。**其它陆地照旧受约束**。
**台账标注**：「推断，依据为 13 个脚本的症状」（官方只明说"起始位置"不受约束；若生长仍受约束，`Dorothea Quarry` 玩家陆地 = 0 格、`Graupel` = 26 格，DE 显然不会这样生成）。

### 21 个脚本的玩家陆地面积（改前 → 改后）

| 脚本 | 改前 | **改后** |
|---|---|---|
| 🔴 `Dorothea Quarry.rms` | **0** | **18664** |
| 🔴 `Graupel.rms` | **26** | **10898** |
| `Shrubland.rms` | 5787 | 19977 |
| `Crater.rms` | 6384 | 20431 |
| `Socotra.rms` | 7215 | 20699 |
| `Chaos Pit.rms` | 2763 | 15682 |
| `VolcanicIsland.rms` | 5127 | 17895 |
| `Acclivity.rms` | 9143 | 20039 |
| `NorthernIsles.rms` | 9592 | 20349 |
| `Paradise Island.rms` | 9224 | 19578 |
| `Team_Islands.rms` | 12451 | 20736 |
| `Team Glaciers.rms` | 11356 | 18021 |
| `Dingos.rms` | 8571 | 10368 |
| `Alpine_Lakes.rms` | 4148 | 4148 |
| `Hengehold.rms` | 1024 | 1024 |
| `Islands.rms` | 7258 | 7258 |
| `Kawasan.rms` | 1948 | 1948 |
| `Lowland.rms` | 2048 | 2048 |
| `Ravines.rms` | 26 | 26 |
| `RingFortress.rms` | 1320 | 1320 |
| `Wolf_Hill.rms` | 1244 | 1244 |

✅ **21 个脚本现在"原样"与"去掉 border"完全一致**（差 ≤50 格 → 边界不再裁小玩家陆地）。
✅ **小面积那些不是 bug**（逐个对过脚本参数）：`Ravines` 写的是 **`land_percent 0`**（26 格＝底座）；`Hengehold`/`Lowland` 是 `number_of_tiles 512/1024`（×2 人 = 1024/2048）；`Wolf_Hill` `land_percent 6` → 1244；`Alpine_Lakes` `land_percent 20` → 4148。

### 「其余脚本逐位不变」的证明（180 脚本全量指纹）

**工具**：`scratch/_digest_all.mjs`（每脚本 terrain/layer/elev/landId/物件哈希/物件数/玩家陆地格数，`scratch/out/_digest_before.txt` vs `_after.txt`）

```
逐位相同: 162 / 180
有变化:   18 个
```
**变化的 18 个全部落在**那 21 个"同时写 `circle_radius` 与 `*_border`"的脚本内 ✅
（21 个里 3 个连地形都不变 —— `Hengehold`/`Kawasan`/`Ravines`，因为它们的 border 本来就没裁到东西。）
→ **其余 159 个脚本一个都没动** ✅（实际比要求的还多 3 个不变）

## 16.3 第 3 条：鱼 10 种子范围 + 海岸线 —— **"水体更碎"的假设被否**

### ① 海岸线长度（陆地格与水格相邻的**边数**）

| | 值 |
|---|---|
| **DE 基准图** | **522** |
| **我方 10 种子** | 均值 **466**，范围 **[318, 608]** |

→ **DE 落在我方范围内 ✅**（我方 / DE = **0.89×**）→ **我方海岸线并不更长**。

### ② 鱼数量（10 种子范围）

| | 我方范围 | 均值 | DE | |
|---|---|---|---|---|
| `SHORE_FISH`（`FISHS`） | **68 ~ 116** | 92 | **37** | ❌ DE 低于下限 |
| `FISH_SNAPPER`（`FISH4`） | **41 ~ 62** | 53 | **31** | ❌ DE 低于下限 |
| `FISH_SALMON`（`FISH2`） | 6 ~ 6 | 6 | 12 | ❌ DE 高于上限 |

🔴 **按 CC 的规则**：海岸线**没有明显更长**（0.89×，且 DE 落在范围内）⇒ **"水体形状更碎、要回头查水"这条假设被数据否掉**。
⇒ 剩下的解释只能落在**间距取值**上（我们声明 6 格、DE 疑似 14 格）—— 而那要 `GNR_SFISH_SPARSE` 的来源被证实，**目前仍未证实，继续不用**。
（另记：我方水域 19.3% / 4000 格，DE 21.8% / 4524 格 —— **DE 水更多反而鱼更少**，这进一步说明差异不在水体大小或形状。）

## 16.4 第 4 条：DE 沙滩「到最近水格」的距离分布 —— **不止一圈**

**工具**：`scratch/_probe_coast_beach.mjs`（多源 BFS）

| 到最近水格的距离 | 格数 | 占比 |
|---|---|---|
| **1 格** | 408 | **77.6%** |
| **2 格** | **118** | **22.4%** |
| 合计 | 526 | 2.54% |

🔴 **DE 有 22.4% 的沙滩格距水 2 格** ⇒ **DE 的沙滩不止一圈**，我们"只换一圈"（`applyBeaches` 只换四邻有水的陆地格）确实不够。
这与沙滩占比 1.75% vs DE 2.54% 的方向一致。
→ **请 CC 裁定改法**（我只查了分布，没擅自改）：把沙滩从"1 圈"扩成"2 圈"会大致把 1.75% 推到 3%+（过头）；
更可能的是"以水岸为起点按某种条件铺到 2 格"，具体规则**需要 DE 侧更多证据**（例如按海岸线曲率、或先铺 1 圈再让水退）。**建议留到与"水形状"一起看。**

## 16.5 回归与范围（本轮）

```
parseAll 3            → 179/180 ✅（指令总数 200942 不变）
genMap Arabia 2 144   → 物件 5902 ｜ 森林 9.6% ｜ 有高度 14.0% ✅（逐位相同）
全量 180 脚本指纹      → 162 逐位相同 / 18 变化（全在 21 个 circle_radius+border 脚本内）
```
引擎改动 **2 处**（缺表检查、边界豁免），全在 `tools/rms/rmsEngine.mjs`；`src/`、`public/` **0 改动** ✅

## 16.6 未做（下一轮）

- **第 5 条 接口预留**：外部地理骨架 → 跳过 LAND/ELEVATION、只跑 TERRAIN/OBJECTS；强制指定主题；用"一条河穿过平地"的手工骨架跑通并**出图**。
- **第 6 条**：Murkwood 非整数 spacing 改向下取整（只允许 `Murkwood` 变化，其余 179 逐位不变）。

---

# 十七、第 41 轮报告（边界修正 / 鱼证据 / 沙滩八邻）

## 17.1 第 2 条修正：边界豁免只到「起始位置 + 底座」✅ **但发现我自己的实现有 bug**

### ① 我先踩了自己的坑（记下来）

改完后数字**与上一版一模一样**（`Team_Islands` 仍 20736）→ 查代码发现：第 40 轮我把 `bx0/bx1/by0/by1` 按 `ignoreBorders` **清零**了，
而 `inBorders()` 正是用这些值 ⇒ **"生长仍受约束"根本没生效**。
**修**：边界**照常按脚本计算**，只在 `freeSeed`（底座专用）里跳过检查：

```js
const inBorders = (x, y) => { …矩形 + 内切椭圆 + border_fuzziness… };
const freeCore = (x, y, skipBorders) => { if (!this.inb(x,y)) return false; if (!skipBorders && !inBorders(x,y)) return false; …占用/避让… };
const free     = (x, y) => freeCore(x, y, false);   // 生长：受边界约束
const freeSeed = ignoreBorders ? ((x,y) => freeCore(x, y, true)) : free;   // 底座：circle_radius 时免边界
```

### ② 21 个脚本：改前 / 上一版 / **新版**（＋新版水占比）

| 脚本 | 改前 | 上一版（全免） | **新版** | 新版水占比 |
|---|---|---|---|---|
| `Dorothea Quarry` | **0** | 18664 | **98** 🔴 | 7.4% |
| `Graupel` | **26** | 10898 | **43** 🔴 | 7.5% |
| `Acclivity` | 9143 | 20039 | **9169** | 0.0% |
| `Alpine_Lakes` | 4148 | 4148 | 4148 | 0.2% |
| `Chaos Pit` | 2763 | 15682 | **2763** | 0.0% |
| `Crater` | 6384 | 20431 | **6456** | 0.0% |
| `Dingos` | 8571 | 10368 | **8571** | 16.5% |
| `Hengehold` | 1024 | 1024 | 1024 | 0.0% |
| `Islands` | 7258 | 7258 | **7296** | **56.7%** |
| `Kawasan` | 1948 | 1948 | 1948 | 3.3% |
| `Lowland` | 2048 | 2048 | 2048 | 0.0% |
| `NorthernIsles` | 9592 | 20349 | **9592** | **50.4%** |
| `Paradise Island` | 9224 | 19578 | **9224** | 9.5% |
| `Ravines` | 26 | 26 | 26 | 0.0% |
| `RingFortress` | 1320 | 1320 | 1320 | 0.0% |
| `Shrubland` | 5787 | 19977 | **5883** | 0.0% |
| `Socotra` | 7215 | 20699 | **7215** | **42.5%** |
| `Team Glaciers` | 11356 | 18021 | **11356** | **36.9%** |
| `Team_Islands` | 12451 | 20736 | **12750** | **34.4%** |
| `VolcanicIsland` | 5127 | 17895 | **5302** | **12.0%** |
| `Wolf_Hill` | 1244 | 1244 | 1244 | 0.0% |

### ③ 你的四条验收

| # | 验收 | 结果 |
|---|---|---|
| 1 | 三列面积 + 新版水占比 | ✅ 见上表 |
| 2 | **岛类脚本必须有明显的水** | ✅ **通过**：`Islands` 56.7%、`NorthernIsles` 50.4%、`Socotra` 42.5%、`Team Glaciers` 36.9%、`Team_Islands` 34.4%、`VolcanicIsland` 12.0%、`Paradise Island` 9.5% |
| 3 | `Dorothea Quarry`/`Graupel` 不能为 0 或接近 0 | 🔴 **未通过**：98 / 43 格 —— **按你的要求我不再换规则，数据报上来** |
| 4 | 其余 159 个逐位不变 | ✅ **通过且更宽**：相对改动前 **171/180 逐位相同**，变化的 9 个（`Acclivity`/`Alpine_Lakes`/`Crater`/`Dorothea Quarry`/`Graupel`/`Islands`/`Shrubland`/`Team_Islands`/`VolcanicIsland`）**全在那 21 个之内** |

### 🔴 两个异常脚本的数据（请你判，我不改）

```
Dorothea Quarry.rms : land_percent 100  base_size 4  clumping_factor 15  borders 各 28%  circle_radius 26,1
Graupel.rms         : land_percent 100  base_size 2  clumping_factor 15  borders 各 48%  circle_radius  2,0
```

**我的观察（不是结论）**：
- border 28% @144 → 可用框 = [40,104)（64×64）；`circle_radius 26%` = 37.4 格 → 玩家中心离图心 37 格，落在 x≈35 或 x≈109 —— **底座（半径 4）基本在可用框之外**，于是底座虽已铺下（免边界），**生长进不了框内** → 停在 98 格（≈2×π×4²）。
- border 48% @144 → 可用框只有 [69,75)（**6×6 = 36 格**）；`circle_radius 2%` = 2.9 格 → 玩家就在小框中心；`land_percent 100` 无从发挥 → 43 格（36 格框＋border_fuzziness 的一点外溢）。

→ **这两个脚本的"玩家陆地很小"看起来是脚本自身参数（超大 border + 圆形布点 + 底座半径小）的结果**，而不是某条规则还错。
但**我没有 DE 侧证据**判断 DE 在这种组合下会怎么生成，**所以按你的指示停手报数**。

## 17.2 第 3 条：鱼的证据 —— **`GNR_SFISH_SPARSE` 全库无人定义** ⇒ 记为「已知偏差」，不再追

**搜法**：`$g\*.rms` + `$g\*.inc` + `$g\includes\*.inc` + `$g\*.def` 全量搜 `GNR_SFISH_SPARSE`。

```
共 2 处，且**都是 if 读取**，没有任何 #define：
  GeneratingObjects.inc:7508   if GNR_SFISH_SPARSE
  GeneratingObjects.inc:7615   if GNR_SFISH_SPARSE
对照：GNR_STANDARDFISH / GNR_NORMALBIRDS / GNR_MAPSTRAGGLE 被大量脚本 #define
  （例：Aquarena.rms:824/826/829、Archipelago.rms:555/557/559 …）
地中海（2 人 / 144）闭包内的取值：GNR_SFISH_SPARSE = **未定义**，GNR_STANDARDFISH = 已定义，GNR_NORMALBIRDS = 已定义
```

→ **按 CC 的判定规则**：没有任何脚本定义它 ⇒ **来自引擎或大厅选项，无法证实** ⇒ **鱼的数量记为「已知偏差」，不再追** ✅
（数据留档：`SHORE_FISH` 68~116 均值 92（DE 37）｜`FISH_SNAPPER` 41~62 均值 53（DE 31）｜`FISH_SALMON` 6（DE 12）；海岸线长度 466 vs DE 522 已对齐，故差异不在水体。）

## 17.3 第 4 条：沙滩八邻假设 —— **完全证实，改后达标** ✅

### ① DE 基准图上量八邻

```
DE 沙滩格 526 个：
  四邻有水     408 ( 77.6%)
  八邻有水     526 (100.0%)   ← 100%
  仅斜对角邻水 118 ( 22.4%)   ← 正是之前被算成"距水 2 格"的那些
  八邻也无水     0 (  0.0%)
```

→ **DE 按八邻判定沙滩**（八邻 100%，四邻只有 77.6%）；我们原来用 `D4`，**漏掉整条斜向海岸线**。

### ② 改动（`rmsEngine.mjs` 的 `applyBeaches`）

```js
- if (D4.some((d) => … waterTerrains.has(…)))    // 四邻
+ if (D8.some((d) => … waterTerrains.has(…)))    // 八邻（依据 DE 实测 100%）
```

### ③ 10 种子范围

| | 均值 | 10 种子范围 | DE 2.54% |
|---|---|---|---|
| 改前（四邻） | 1.75% | [1.18, 2.33] | ❌ 范围外 |
| **改后（八邻）** | **2.25%** | **[1.55, 2.94]** | ✅ **落在范围内** |

**受影响脚本**（digest 对比）：**65 个**（凡有沙滩的图都会变）—— 这是**本改动的目的**，不是副作用；
变化会传导到物件（`applyBeaches` 在 `plantTerrainUnits`/物件之前），例如 `Arabia` 物件 5902 → 5838、`Beach` 0.3% → 0.4%。

## 17.4 回归与范围（本轮）

```
parseAll 3          → 179/180 ✅（指令总数 200942 不变）
genMap Arabia 2 144 → 物件 5838 ｜ 森林 9.5% ｜ 有高度 14.0% ｜ Beach 0.4%
                      （沙滩改八邻后阿拉伯也变了，属预期）
全量指纹             → 边界修正后 171/180 逐位相同（变化 9，全在 21 内）；沙滩修正后 115/180 相同（变化 65，皆因沙滩）
```
引擎改动 **3 处**（缺表检查、底座免边界、沙滩八邻），全在 `tools/rms/rmsEngine.mjs`；`src/`、`public/` **0 改动** ✅

## 17.5 未做（下一轮）

- **第 5 条 接口预留**：外部地理骨架 → 跳过 LAND/ELEVATION、只跑 TERRAIN/OBJECTS；强制指定主题；"一条河穿过平地"手工骨架跑通并**出图**。
- **第 6 条**：Murkwood 非整数 spacing 改向下取整（只允许 `Murkwood` 变化，其余 179 逐位不变）。
- 待你裁：§17.1 两个异常脚本（`Dorothea Quarry` 98 / `Graupel` 43）。

---

# 十八、第 42 轮报告（起始物件检查）

## 18.1 两个重点脚本：**通过，结案**（按你的新标准）

**工具**：`scratch/_probe_starting_units.mjs focus`（半径 12 格内统计）

| 脚本 | 种子 | P1 | P2 | 判定 |
|---|---|---|---|---|
| `Dorothea Quarry.rms` | 1 / 2 / 3 | 39 / 48 / 42 个物件 | 48 / 62 / 61 个物件 | ✅ **两个玩家都有起始物件** |
| `Graupel.rms` | 1 / 2 / 3 | 305 / 321 / 314 个物件 | 286 / 306 / 306 个物件 | ✅ **两个玩家都有起始物件** |

→ 按你的标准（"关键是每个玩家的起始物件能放出来"，而不是陆地面积大小）：**两者都通过** ⇒ **结案，台账标「脚本设计如此」**（陆地小是因为它们自己写了超大 border 28%/48%）。
📌 **已知偏差登记**：这两个脚本的玩家陆地面积（98 / 43 格）**照实留着**，不视为缺陷。

## 18.2 全量 180 脚本的起始物件检查 —— 🔴 **发现一个更根本的问题**

### ① 表面结果（种子 2，半径 12）

```
✅ 两玩家都同时有「身边物件 + 城镇中心 + 村民」：92 个
🔴 有玩家「身边一个物件都没有」：4 个
     BR_ElDorado.rms, BR_FallofAxum.rms, BR_TheMajapahitEmpire.rms, Pacific_Islands.rms
🔴 有玩家「身边 12 格内没有城镇中心」：87 个（含 Arabia、Mediterranean、Arena…）
🔴 有玩家「身边 12 格内没有村民」：83 个（含 Arabia、Mediterranean…）
✗ 运行失败 1 个（＝早有的 real_world_manchuria 缺 MAPSCALE_AREA）
```

### ② 🔴 但拿 DE 基准图一对照，**判据本身要改**：DE 也没有城镇中心

| 物件 | **DE 基准图（Mediterranean 144）** | **我方（同配置）** |
|---|---|---|
| `TOWN_CENTER` | **0** | 1 |
| `VILLAGER_MALE` / `VILLAGER_FEMALE` | **3 / 3** | **0 / 0** |
| `VILLAGER`（未分性别） | 0 | 1 |
| `SCOUT_CAVALRY` | **2** | **0** |

→ **DE 自己的基准图里也没有 TC**（说明 TC 不由 RMS 物件承载，用 TC 当判据是错的）；
→ 但 **DE 有 6 个村民 + 2 个侦察兵，我方几乎没有** ⇒ **我们确实缺「起始村民/侦察兵」**。

### ③ 根因线索：**133 个 `GNR_*` 旗标被读、但全库无人定义**

| | 个数 |
|---|---|
| 全库被读的 `GNR_*` | **317** |
| 被脚本 `#define` 的 | **184** |
| 🔴 **被读但全库无人 `#define`**（＝引擎/大厅注入） | **133** |

其中有直接管起始单位的：`GNR_HORSESCOUT`、`GNR_STARTVILLS_DOUBLE`、`GNR_GIVENOMADSCOUT`（三者**全库 0 处定义**）。
⚠️ **但我不下结论**：`GNR_NORMALTC`、`GNR_CLASSICSCOUT` 是**被 83 个脚本显式定义**的，而 `Arabia.rms` 两者都没定义 —— 说明**机制比"引擎注入"更细**（可能是"引擎给默认档、脚本按需覆盖"，也可能另有原因）。**需要你裁定怎么查**。

### ④ 请 CC 裁定

1. **起始单位的正确判据**：TC 显然不能用（DE 也没有）。是否改用「**村民 ≥3/玩家 + 侦察兵 ≥1/玩家**」（DE 基准是 6 村民/2 侦察兵·2 人）？按这个判据，我方的差距是**全面的**（`Arabia` 全图 0 村民 0 侦察兵）。
2. **`GNR_*` 里那 133 个无人定义的旗标**：按你第 41 轮对鱼的处理（"无人定义 ⇒ 无法证实 ⇒ 记已知偏差"），它们也该记为偏差；**但起始单位不一样** —— 它决定地图能不能用。是否要我**按 DE 基准图反推该注入哪几个**（例如从 DE 的 6 村民/2 侦察兵反推 `GNR_STARTVILLS_DOUBLE` 之类），还是先放着？

## 18.3 回归与范围

```
parseAll 3          → 179/180 ✅
genMap Arabia 2 144 → 物件 5838 ｜ 森林 9.5% ｜ 有高度 14.0%（与第 41 轮逐位相同）
```
**本轮引擎 0 改动**（只新增探针 `_probe_starting_units.mjs`）；`src/`、`public/` **0 改动** ✅

## 18.4 未做（下一轮）

- **第 5 条 接口预留**（外部地理骨架 + 跳过 LAND/ELEVATION + 强制主题 + "一条河穿过平地"出图）—— 未做
- **Murkwood** 非整数 spacing 向下取整 —— 未做
- 第一步完成清单 —— 待这两项做完一并出

---

# 十九、第 43 轮报告：**dat 类别清单 + 保留/去掉白名单提议**（请 CC 确认后再改）

**工具**：`scratch/export_de_unit_class.py` → `scratch/de_unit_class.json`（2693 条：`id → {name, class, type}`）；
`scratch/_probe_class_table.py` / `_probe_class_split.py`（类别清单与拆分）。
**字段**：`class_`（genieutils 的 Unit 字段）+ `type`。

## 19.1 `type` 是天然的粗分类（实测确认）

| type | 个数 | 实际是什么（按代表单位确认） |
|---|---|---|
| **10** | 660 | **地面装饰/自然物**：树、灌木、草丛、石头、矿、悬崖、遗迹装饰 |
| 20 | 101 | 旗帜 / 火把 / 天气特效（`FLAGX`、`BONFI`、`RAIN`、`SMOKE`） |
| 30 | 401 | **尸体/残骸** + 鱼/海豚/鲸（`PIG_D`、`BEAR_D`、`*_D`；`FISHX`、`FISHS`、`WHALE`） |
| 60 | 170 | 投射物（`ARROW`、`BOLTX`、`CATST`） |
| **70** | 869 | **活体单位**：动物、村民、军事单位、英雄、僧侣 |
| 80 | 491 | **建筑**（`WALL`、`HOUSE`、`MILL`、`TOWN_CENTER`、`BGAA`…） |
| 25 | 1 | `DOPL` |

→ **`type` 单独不够**（鱼在 30、动物在 70、树在 10，而 70 里混着所有军事单位），所以提议用 **(`class`, `type`) 组合**做白名单。

## 19.2 提议**保留**（自然物件）——17 组，共 **678 个 id**

| class | type | 个数 | 是什么 | 代表 |
|---|---|---|---|---|
| **15** | 10 | 54 | **树 / 灌木** | `FOAK`、`FPIN`、`FPAL`、`FSNO`、`FJUN`、`BUSH`、`FBAM` |
| **14** | 10 | 392 | **地面装饰**（草、植物、岩石、冰、废墟、路牌） | `GRASS_GREEN`、`GRASS_DRY`、`PLANTS`、`PLANT_SHRUB_GREEN`、`ROCKX`、`ICE`、`RUBL1` |
| **7** | 10 | 5 | **浆果丛 / 食物丛** | `FORAG`、`FORAGM`、`PAPAYA`、`FORAGGURJ`、`FORAGPINEAPPLE` |
| **8** | 10 | 2 | **石矿 / 石头** | `STONM`、`ROCKSX` |
| **32** | 10 | 2 | **金矿 / 石头** | `GOLDM`、`ROCKGX` |
| 48 | 10 | 1 | 矿 | `OREMN` |
| **34** | 10 | 96 | **悬崖** | `CLF01`…、`CLIFF_SNOW_01`…、`MARBLE_CLIFF_*`、`CLIFF_DEFAULT_01` |
| **9** | 70 | 28 | **猎物**（鹿/羚/斑马/海豹/野马/大角羊） | `DEERX`、`IBEX`、`RHEA`、`ZEBRA`、`SEAL`、`MOUFLON` |
| **10** | 70 | 30 | **猛兽**（野猪/狼/狮/猞猁/麋鹿） | `BOARX`、`WOLFX`、`DWOLF`、`LION`、`LYNX`、`ELK` |
| **58** | 70 | 16 | **家畜**（羊/山羊/猪/鹅/火鸡/牛/羊驼） | `SHEEPG`、`GOAT`、`PIG`、`GOOSE`、`TURKYG`、`BUFFALO`、`LLAMAA` |
| 65 | 70 | 2 | 狐狸 | `REDFOX`、`ARCTICFOX` |
| **11** | 70 | 23 | **鸟** | `HAWKX`、`OWL`、`SGULL`、`STORK`、`MACAW` |
| **5** | 30 | 13 | **鱼 / 海豚** | `FISHX`、`FISH1`~`FISH5`、`DOLP1`… |
| **33** | 30 | 2 | **岸边鱼 / 海龟** | `FISHS`、`TURTLES` |
| 63 | 30 | 1 | 鲸 | `WHALE` |
| 63 | 10 | 1 | 牡蛎 | `OYSTERS` |
| **合计** | | **678** | | |

## 19.3 提议**去掉**（玩法/建筑/单位/特效）

| class | type | 个数 | 是什么 | 代表 |
|---|---|---|---|---|
| 3 | 80 | 215 | **建筑** | `DOCK`、`MILL`、`HOUS`、`CSTL`、`MRKT`、`STBL` |
| 27 | 80 | 39 | **城墙 / 栅栏** | `WALL`、`FENCE`、`SWAL`、`CWAL`、`TWAL` |
| 39 | 80 | 97 | 建筑图形（城门等） | `GTAA3`、`GTAB3` |
| 52 / 51 / 54 / 49 / 19 | 80/70 | 11+6+4+11+3 | 奇观 / 塔 / 攻城塔 / 农田 / 贸易车 | `WCTW`、`PTREB`、`TREBU`、`FARM`、`TCART` |
| **0 / 4 / 6 / 12 / 13 / 18 / 22 / 23 / 36 / 42 / 43 / 44 / 47 / 53 / 55 / 56 / 57 / 59 / 61 / 64** | 70 | 共 ~1100 | **军事单位/村民/僧侣/英雄/战船/攻城器/圣物/贸易/爆炸** | `ARCHR`、`VMDL`、`SPY`、`HREY`、`MANGO`、`MONKX`、`GALLY`、`RELIC`、`SCOUT` |
| 2 / 21 / 20 | 70 | 3+5+2 | 商船 / 渔船 / 运输船 | `JUNKX`、`FSHSP`、`XPORT` |
| 30 | 20/10 | 74 | 旗帜 / 火把 / 光效 | `FLAGX`、`BONFI`、`FLARE` |
| **11** | **30** | 380 | **尸体 / 残骸**（玩家单位与动物的） | `PIG_D`、`BEAR_D`、`HREY_D` |
| **11** | **60** | 170 | **投射物** | `ARROW`、`BOLTX`、`CATST` |
| 11 | 20 / 80 | 7+6 | 火焰尾迹 / 建筑残骸 | `S_FIRE`、`FARM_D` |
| **14** | **80** | 102 | **背景图** | `BGAA`、`BGAB` |
| 14 | 20 / 30 | 22+1 | 雨/烟/瀑布特效 | `RAIN`、`SMOKE`、`WFALL` |
| 40 | 70 | 6 | — | `PILE1`…`PILE8` |
| 41 | 70/10 | 5 | — | `POREX`、`PGOLD`、`PWOOD`、`PFOOD`、`PSTON` |

## 19.4 🔴 请你拍板的 4 处（我拿不准，不敢自己定）

| # | 项 | 我的倾向 | 疑问 |
|---|---|---|---|
| 1 | **class 11 / type 10**（13 个：`RUGS` 地毯、`FLARE2`… 光效） | 倾向**去掉** | 看着像装饰但不是自然物（地毯/光晕） |
| 2 | **class 14 / type 20**（22 个：`RAIN`、`SMOKE`、`WFALL` 瀑布） | 倾向**保留**（天气/水景） | 也可能是特效，DLC 里未必出现 |
| 3 | **class 40（`PILE1…8`）/ class 41（`POREX`/`PGOLD`/`PWOOD`/`PFOOD`/`PSTON`）** | 拿不准 | 名字像"资源堆/矿石堆"，但 dat 里没有更多信息 |
| 4 | **class 30（旗帜 `FLAGX`/`BONFI`）** | 倾向**去掉**（玩法标记） | 但 `BONFI` 可能是篝火（装饰） |

## 19.5 实现位置与验收（按你的要求：**不改引擎内部生成**）

- **过滤放在"出图/导出"这一层**：`tools/rms/genMap.mjs` 的输出与 `scratch/render_de_map.mts` 的渲染输入；
  **引擎照旧把它们放出来**（保证自然物件的互相避让与 DE 一致），只在导出时按白名单筛掉。
- 新增 `scratch/de_unit_class.json` 作为判据来源（**按 class+type，不按名字**）。
- **验收**：地中海 10 种子，过滤后**各类自然物件数量**与 DE 基准图**同口径**（DE 侧用同一份白名单过滤）对比。

## 19.6 回归与范围

```
parseAll 3          → 179/180 ✅
genMap Arabia 2 144 → 物件 5838 ｜ 森林 9.5% ｜ 有高度 14.0%（与上一轮逐位相同）
```
**本轮引擎 0 改动**（只加 dat 导出与探针）；`src/`、`public/` **0 改动** ✅

---

# 二十、第 44 轮报告：自然物件白名单落地 + 验收

## 20.1 4 处待定项的处置（按 CC 裁定 + 数据定案）

| # | 项 | 裁定 | 依据 |
|---|---|---|---|
| 1 | class 11 / type 10（`RUGS`、`FLARE2`…） | **去掉** | CC：非自然物 |
| 2 | class 14 / type 20（`RAIN`、`SMOKE`、`WFALL`） | **去掉** | CC：天气/烟雾归渲染层，瀑布留到第三步 |
| 3 | class 40 / 41（`PILE1…8`、`POREX`、`PGOLD`、`PWOOD`、`PFOOD`、`PSTON`、`PWOOD`） | **去掉** | ✅ **数据定**：这 **11 个 id 在 DE 基准图里出现 0 次**（逐个查过） |
| 4 | class 30（`FLAGX` 旗帜、`BONFI` 篝火） | **去掉** | CC：人造物 |

另按 CC 确认：**class 14 的"废墟"保留**（属风景装饰）；**动物与鸟先作装饰保留**（不参战）。

## 20.2 落地：`tools/rms/naturalObjects.mjs`（新文件）

- `NATURAL_CLASS_TYPES`：白名单，**按 dat 的 (class, type) 判，不按名字** —— 共 **16 组**；
- `loadUnitClassTable()` / `isNaturalObject(id, table)` / `filterNaturalObjects(objects, table)`；
- **表里查不到的 id 一律不算自然物件**（宁缺勿滥，避免漏进玩法物件）。

| 保留的 (class,type) | 类别 | | 保留的 (class,type) | 类别 |
|---|---|---|---|---|
| 15/10 | 树 / 灌木 | | 9/70 | 猎物 |
| 14/10 | 地面装饰（草/植物/岩石/冰/废墟） | | 10/70 | 猛兽 |
| 7/10 | 浆果丛 | | 58/70 | 家畜 |
| 8/10 | 石矿 | | 65/70 | 狐狸 |
| 32/10 | 金矿 | | 11/70 | 鸟 |
| 48/10 | 矿 | | 5/30 | 鱼 |
| 34/10 | 悬崖 | | 33/30 | 岸边鱼 |
| | | | 63/30 · 63/10 | 鲸 · 牡蛎 |

✅ **自检：16 组 (class,type) → 命中 668 个 id**（⚠️ 更正：我第 43 轮报告里写"678"是**加错了**，逐项重算 = 668）

## 20.3 过滤位置：**只在导出/出图层**（引擎照旧全部放出）

改动只在 `tools/rms/genMap.mjs`：import 白名单 → `const natural = filterNaturalObjects(eng.objects, unitClass)` →
**PNG 描点**与**导出 JSON 的 `objects`** 两处改用 `natural`；`eng.objects` **一个都没删**（玩家物件照旧参与避让，自然物件位置才与 DE 一致）。
命令输出里同时报两个数（便于对账）：

```
脚本 Arabia.rms 种子 2 边长 144  物件 5838（其中自然物件 3450）
脚本 Mediterranean.rms 种子 1 边长 144  物件 9469（其中自然物件 3111）
```

**导出 JSON 复验**（Arabia，66×66 crop）：**导出物件 649 个，非自然物件 0 个** ✅
⚠️ **踩坑记录**：我第一次是用 `| Select-Object -First 2` 看输出 —— PowerShell 会在取够行数时**掐断上游进程**，
genMap 还没写 JSON 就被杀了，于是我读到的仍是**上一轮的旧 JSON**（1416 个物件 / 771 个非自然），差点误判过滤没生效。
**以后跑 genMap 一律 `> 日志文件` 再读日志，不用 `Select-Object -First` 接在生成命令后面。**

## 20.4 验收：地中海 10 种子（**两侧同一份白名单**）

**工具**：`scratch/_probe_natural_compare.mjs`（DE 侧用 `isNaturalObject(o.const)` 过滤，与我方同一判据）

| | 全部物件 | **自然物件** |
|---|---|---|
| **DE 基准图** | 9254 | **2627**（过滤掉 6627） |
| **我方 10 种子** | 8852 ~ 9320（均值 9058） | **2539 ~ 2716**（均值 2661） |

✅ **总量：DE 的 2627 落在我方 10 种子范围 [2539, 2716] 内**
（DE 过滤掉的 6627 个里 **6612 个是 `UNKNOWN_647` = `HRICH_D`**，`class 11/type 30` 的不可见标记物）

**分类明细**（我方 10 种子范围 vs DE）：

| 类别 | 我方范围 | 均值 | DE | 判定 |
|---|---|---|---|---|
| 家畜 | 22 ~ 30 | 27 | 26 | ✅ |
| 悬崖 | 8 ~ 30 | 19 | 11 | ✅ |
| 浆果丛 | 6 ~ 12 | 11 | 12 | ✅ |
| 猎物 | 6 ~ 8 | 7 | 6 | ✅ |
| 猛兽 | 4 ~ 4 | 4 | 4 | ✅ |
| 石矿 | 19 ~ 22 | 21 | 22 | ✅ |
| 金矿 | 33 ~ 36 | 35 | 36 | ✅ |
| 树/灌木 | 1991 ~ 2113 | 2089 | 2188 | ❌ **我方偏少 4.5%**（DE 2188 **高于**我方上限 2113；CC 已接受：在 ≤15% 内） |
| 地面装饰 | 260 ~ 318 | 295 | 234 | ❌ 高 26% |
| 鱼 | 45 ~ 72 | 58 | 43 | ❌ 高 35% |
| 岸边鱼 | 68 ~ 116 | 90 | 37 | ❌ 高 143%（**第 41 轮已记为「已知偏差」**） |
| 鸟 | 4 ~ 4 | 4 | 8 | ❌ 低 50%（小数量） |

**7 类落在范围内 ｜ 5 类范围外**。其中 `岸边鱼` 属已结案的已知偏差；其余 4 类（树、地面装饰、鱼、鸟）**照实报上来**。

## 20.5 回归与范围

```
parseAll 3          → 179/180 ✅（指令总数 200942 不变）
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（与上轮逐位相同）
```
**改动**：新增 `tools/rms/naturalObjects.mjs`；`tools/rms/genMap.mjs` 只改导出层（4 处）；
**引擎 `rmsEngine.mjs` 本轮 0 改动**（无需"逐位不变"证明）；`src/`、`public/` **0 改动** ✅

## 20.6 未做（下一轮）

- **第 5 条 接口预留**（外部地理骨架 + 跳过 LAND/ELEVATION + 强制主题 + "一条河穿过平地"出图 + 报告河道两侧地形物件/河边沙滩/有无物件落水）
- **Murkwood** 非整数 spacing 向下取整（只允许 `Murkwood` 变化）
- **第一步完成清单**（每项：状态、证据、遗留已知偏差）

---

# 二十一、第 45 轮报告：地面装饰查证 + Murkwood 取整 + 第一步完成清单

## 21.1 口径更正（按 CC）

已把 §20.4 那行改成：**树/灌木是我方偏少 4.5%**（DE 2188 **高于**我方上限 2113），不是偏高。CC 已按 ≤15% 标准接受。

## 21.2 「地面装饰偏多 26%」查证一轮 —— **查不清，按 CC 规则记为已知偏差**

### ① 按来源拆（CC 要求的第一步）

`plantTerrainUnits` 生成的物件带 `auto: true`，据此拆开（地中海 10 种子）：

| 来源 | 均值 |
|---|---|
| **地形自带（`auto`）** | **295.4** |
| **`create_object` 放出** | **0.0** |

⇒ **全部来自地形自带**，与脚本的 `create_object` 无关。

### ② 在 **DE 基准图自己的地形格**上算期望（CC 要求的第二步）

| 地形 | 格数 | 装饰种类（普通/遮罩 ‰） | 普通期望 | 遮罩期望 |
|---|---|---|---|---|
| `Dirt 3` | 8630 | `GRASS_GREEN`(10/5) `GRASS_DRY`(10/5) | 173 | 86 |
| `Dry Grass` | 1071 | `GRASS_DRY`(80/40) | 86 | 43 |
| 其余（水/森林/灌木/沙滩） | — | — | 0 | 0 |
| **合计** | | | **258（差 +10%）** | **129（差 −45%）** |

⇒ 表面上**普通密度口径更接近 DE 的 234**。

### ③ 但按那条结论去改，结果**更差** ⇒ 实验不成立

| | 地面装饰均值 |
|---|---|
| 改前（现行：分层格用**遮罩地形的表 + 遮罩密度**） | **295.4** |
| 改后（分层格用**遮罩地形的表 + 普通密度**） | 🔴 **335.9（更差）** |
| DE 基准图 | **234** |

**为什么反了**：真正起作用的是"**用哪张表**"而不是密度字段 —— 分层格子取的是**遮罩地形的种类表**，
而遮罩地形的普通密度往往更高（例 `Dry Grass` 的 `GRASS_DRY` 80‰），所以换成普通密度反而更密。

**我方格子上的自洽性核对**：普通口径期望 263.9 ｜ 现行规则期望 **293.8** ｜ 实际生成 **295.4** ⇒ **现行实现与自己的规则自洽**。

🔴 **判定：查不清** —— **DE 基准图没有图层信息**，无法把"用哪张表"与"用哪个密度"这两个因素分开。
⇒ 按 CC 规则**回退，记为已知偏差**。**回退已复验：全量 180/180 逐位相同**（`_digest_after4` vs `_digest_after6` 完全一致），
现状与实验前**一模一样**，回归不变。

📌 **已知偏差登记**：地中海「地面装饰」我方 260~318（均值 295）vs DE 234，**偏多约 +26%**；原因是"分层格的装饰取遮罩地形的表 + 遮罩密度"这条推断，
**当前无 DE 侧证据可判**，不再追。

## 21.3 Murkwood 非整数 spacing 向下取整 ✅

**改动**（`rmsEngine.mjs` 的 `terrainCmd`，1 处）：`spacing` 声明改 `let`，紧接一行

```js
if (Number.isFinite(spacing)) spacing = Math.floor(spacing);
```

依据：DE 地图是整数格，取整才是 DE 的行为；老写法 `for (dy = -1.656; dy <= 1.656; dy++)` 步长错开 → 非整数坐标 →
`this.idx()` 取到 `undefined` → 被当成坏格 → **几乎拒掉所有格子**（那是我们的缺陷）。取整后走整数前缀和路径（O(1)）。

**验收（CC 定：只允许 Murkwood 变化，其余 179 逐位不变）**：

```
全量 180 脚本指纹比对：逐位相同 179 / 180；变化 1 个 = Murkwood.rms ✅
Murkwood：物件 7506（哈希 aade85009560）→ 7580（哈希 f23dcbb18404）
```

## 21.4 第一步「地图生成收尾」完成清单

| # | 任务 | 状态 | 证据 | 遗留的已知偏差 |
|---|---|---|---|---|
| 1 | **6 个慢脚本提速** | ✅ **完成** | 452 ~ 1126 ms（原 18 ~ 283 s，快 16~455 倍）；**地中海+阿拉伯各 10 种子 × 7 字段 = 140 项逐位相同**；全量物件合计 `1,198,084` 不变；全量扫描 20 分钟 → 91 秒 | 无 |
| 2 | **鱼偏多** | ⚠️ **结案（已知偏差）** | 离岸距离分布一致（DE 中位 **5** 落在我方 [4,9]）；海岸线 466 vs DE 522（DE 在范围内）⇒ 否掉"水体更碎"；`GNR_SFISH_SPARSE` **全库 0 处 `#define`**（只有 2 处 `if` 读取）⇒ 无开关可证 | 🔴 `SHORE_FISH` 90 vs DE 37；`FISH_SNAPPER` 53 vs 31；`FISH_SALMON` 6 vs 12 |
| 3 | **沙滩** | ✅ **完成** | DE 沙滩格**八邻有水 100.0%** / 四邻仅 77.6%（仅斜对角邻水 22.4%）⇒ 判定改为八邻；改后 10 种子 **[1.55, 2.94]** **覆盖 DE 2.54%** | 无 |
| 4 | **边界裁剪症状 + 修正** | ✅ **完成** | 统计：21 个脚本里 **13 个被裁小**（`Dorothea Quarry` 玩家陆地 **0 格**、`Graupel` 26 格）；修正为「用 `circle_radius` 时**起始位置与底座**免边界、**生长仍受约束**」；岛图水占比 9.5%~56.7% ✅ | `Dorothea Quarry` 98 格 / `Graupel` 43 格 —— 判定「脚本设计如此」（两玩家起始物件都在，各 3 种子验过） |
| 5 | **120×120 复验** | ✅ **完成** | 地中海与阿拉伯各 10 种子**均无报错**；比例一致（`Forest,Med` 9.0→9.0、`Dry Grass` 5.0→5.0、`Underbrush` 18.8→18.9、水 9.4/11.2→10.3/10.8） | 无 |
| 6 | **接口预留**（外部地理骨架 / 跳过 LAND·ELEVATION / 强制主题） | ❌ **未做** | —— | —— |
| — | 附加：**自然物件白名单** | ✅ **完成** | `tools/rms/naturalObjects.mjs`，按 dat 的 (class,type)，16 组 **668 个 id**；导出层过滤（引擎照旧全放）；导出 JSON 复验 **649 个物件 / 非自然 0 个**；DE 基准图过滤后 **2627** 落在我方 10 种子 **[2539, 2716]** 内 | 地面装饰 +26%（§21.2）；树/灌木 −4.5%、鸟 −50%（CC 已接受） |
| — | 附加：**引擎缺表即报错** | ✅ **完成** | 构造期检查 `unitRestrict`/`objNames`，缺任一张抛错并写明；正式入口（genMap/parseAll/全量扫描）全部正常 | 无 |
| — | 附加：**Murkwood 取整** | ✅ **完成** | 见 §21.3，179/180 逐位不变 | 无 |

### 遗留的已知偏差汇总（第一步范围内）

| # | 偏差 | 量 | 为什么不再追 |
|---|---|---|---|
| 1 | 鱼（岸边鱼/笛鲷/鲑鱼）偏多 | `SHORE_FISH` 90 vs 37 | `GNR_SFISH_SPARSE` 全库无人 `#define` ⇒ 开关来源无法证实 |
| 2 | 地面装饰偏多 | 295 vs 234（+26%） | DE 基准图无图层信息，"用哪张表/用哪个密度"分不开（§21.2） |
| 3 | 树/灌木偏少 | 2089 vs 2188（−4.5%） | CC 已按 ≤15% 接受 |
| 4 | 鸟偏少 | 4 vs 8 | 数量太小，CC 已接受 |
| 5 | 133 个 `GNR_*` 开关无人定义 | — | CC：记已知偏差，不追（多管玩家起始内容，已在白名单里过滤掉） |
| 6 | `real_world_manchuria.rms` 解析失败 | 1/180 | 早有的 `MAPSCALE_AREA` 未定义，与生成无关 |

## 21.5 回归与范围（本轮）

```
parseAll 3          → 179/180 ✅（指令总数 200942 不变）
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（与上轮逐位相同）
回退复验            → 180/180 逐位相同（地面装饰实验完全回退干净）
Murkwood 取整       → 179/180 逐位相同，仅 Murkwood 变化
```
引擎改动 **1 处**（Murkwood 取整，且已附逐位证明）；`src/`、`public/` **0 改动** ✅

## 21.6 未做（下一步）

**第 5 条 接口预留**（外部地理骨架 + 跳过 LAND/ELEVATION + 强制主题 + "一条河穿过平地"出图 + 报告河道两侧地形物件/河边沙滩/有无物件落水）—— **第一步唯一未完成项**，下一轮做。

---

# 二十二、第 46 轮报告：接口预留 + MAPSCALE_AREA + **第一步最终完成清单**

## 22.1 第 2 项：`real_world_manchuria` 缺 `MAPSCALE_AREA` ✅

**诊断**：`MAPSCALE_AREA` 全库用了 **155 处**（如 `Arabia.rms:924 number_of_tiles (… * MAPSCALE_AREA)`），
它由 `includes/scaling.inc:54` 定义（`= MAPSIZE_AREA / 10000`，而 `MAPSIZE_AREA = MAPSIZE_SIDE²`）。
**`real_world_manchuria.rms` 没有 include `scaling.inc`** ⇒ 解析直接失败。

**改动**（`rmsParse.mjs` 的 `loadScript` 默认常量，一处）：按 `scaling.inc` 的**原定义**补齐这一族 ——

| 常量 | 值 | scaling.inc 出处 |
|---|---|---|
| `MAPSIDE_MINI 80` … `MAPSIDE_LUDICROUS 480`（含 `MAPSIDE_BASE 100`） | 逐字照抄 | `:1-15` |
| `MAPSIZE_SIDE` | 边长 | 早有 |
| `MAPSCALE_SIDE` | 边长 / 100 | `:49` |
| `MAPSIZE_AREA` | 边长² | `:53` |
| `MAPSCALE_AREA` | 边长² / 10000 | `:54` |

（补 `MAPSCALE_AREA` 后下一个缺的是 `MAPSCALE_SIDE`，所以按同一族一起补齐；脚本自己 include 了 `scaling.inc` 时 `#const` 会覆盖成同值。）

**验收**：

```
解析：脚本 180 个；解析通过 180；失败 0（原 179/180）；指令总数 200942 → 205554
生成：全量 180 脚本 通过 180 / 180；失败 0（原 179/180）；物件合计 1,198,084 → 1,201,889
逐位不变：180 脚本指纹比对 —— 逐位相同 179 / 180；**唯一变化 = real_world_manchuria.rms**（原来失败，现生成 3462 个物件）✅
```

## 22.2 第 1 项：接口预留 ✅

### ① 引擎新增：外部地理骨架（`rmsEngine.mjs`，2 处）

```js
// 构造函数：多了 skeleton 选项
constructor(sections, { …, skeleton = null } = {})
// run()：给了骨架就跳过脚本的 LAND / ELEVATION 两段
if (this.skeleton) this.applySkeleton();
else { this.runLand(S.LAND_GENERATION ?? []); for (const c of S.ELEVATION_GENERATION ?? []) this.elevCmd(c); }
for (const c of S.TERRAIN_GENERATION ?? []) this.terrainCmd(c);   // 之后照旧
```

`applySkeleton()` 的骨架格式（**陆地/水、河流、每格高度**）：

| 字段 | 含义 |
|---|---|
| `land` | `Uint8Array(边长²)`，1 = 陆地、**0 = 水（河流就是水）** |
| `elev` | `Int8Array(边长²)`，每格高度（可省，省则全 0） |
| `landTerrain` / `waterTerrain` | 陆地与水的底地形编号 |
| `landId` | 给陆地格一个中立 land id（默认 200），让 TERRAIN/OBJECTS 的避让与 zone 逻辑有依据 |

### ② 引擎新增：强制指定主题（`rmsParse.mjs`）

`loadScript(file, { theme: 'PALAEARCTIC_MIDDLE_EAST_DESERT' })`：
① 把该主题 `#define` 注入；② 把脚本里**其余主题**的 `#define` 挡掉（新增 `Preprocessor.blockDefines`）。
**依据**：主题在各脚本里是用 `elseif <主题>` **互斥链**消费的（`Arabia.rms:553`、`themes.inc:1789`），所以只要保证"只有被强制的那个成立"，链上就只会走它 —— **不依赖链的顺序**。

### ③ 演示：一条河穿过平地（`scratch/_demo_skeleton.mjs`）

骨架：144×144 平地 + 一条正弦河（水宽 9 格），高度全 0；脚本用 `Arabia.rms`（内置 11 主题）。

📌 **关键点（踩过）**：骨架的陆地底地形**必须取该主题的 `BASE_TERRAIN`**（沙漠 = `Desert` 14、温带 = `Grass 2` 12）——
第一版我写死 `Dirt 3`，结果 TERRAIN 段因为 `base_terrain` 不匹配**一格都铺不上**（两张图都 92% `Dirt 3`）。改成按主题取之后就正常了。

| 检查项 | 沙漠（`PALAEARCTIC_MIDDLE_EAST_DESERT`） | 温带（`PALAEARCTIC_EUROPE_TEMPERATE`） |
|---|---|---|
| **① 河道两侧按主题铺地形** | **`Desert` 83.7%** · `Palm Desert` 5.6% · `Beach` 2.8% · `Forest, Birch` 2.1% · `Dragon Forest` 0.1% | **`Grass 2` 83.7%** · `Forest` 4.7% · `Beach` 2.8% · `Pine Forest` 2.1% · `Forest, Bush` 0.4% · `Forest, Autumn` 0.4% |
| **① 物件（按主题）** | 1696 个：`15/10`×1618（树）· `34/10`×42（悬崖）· `33/30`×24（岸边鱼）· `11/70`×5（鸟） | 2815 个：`15/10`×1484 · **`14/10`×1259（草）** · `34/10`×43 · `33/30`×21 · `11/70`×8 |
| **② 河边出现沙滩** | **581 格，100% 贴水** ✅ | **581 格，100% 贴水** ✅ |
| **③ 有没有物件落在水里** | 水里的 24 个**全是水生物件**（岸边鱼）；**陆生物件落水 0** ✅ | 水里的 21 个**全是水生物件**；**陆生物件落水 0** ✅ |
| ④ 出图 | `scratch/out/_demo_river_desert.png` | `scratch/out/_demo_river_temperate.png` |

（两张图肉眼可辨：沙漠＝土黄底 + 棕榈沙漠斑块；温带＝绿草底 + **河边一圈浅色沙滩**。物件类别与数量也明显不同。）

### ④ 不传骨架时：180 个脚本逐位不变 ✅

```
180 脚本指纹比对（改前 vs 改后）：逐位相同 180 / 180  ✅ 完全一致
```

## 22.3 回归与范围（本轮）

```
parseAll 3          → 180/180 ✅（指令总数 205554）
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（与上轮逐位相同）
全量扫描            → 180/180 ✅
```
改动：`rmsParse.mjs`（scaling 常量族 + `blockDefines` + `env.theme`）、`rmsEngine.mjs`（`skeleton` + `applySkeleton`，默认 null 不影响原路径）；
`src/`、`public/` **0 改动** ✅

## 22.4 ✅ 第一步「地图生成收尾」最终完成清单

| # | 任务 | 状态 | 证据 | 遗留的已知偏差 |
|---|---|---|---|---|
| 1 | **6 个慢脚本提速** | ✅ | 452~1126 ms（原 18~283 s）；地中海+阿拉伯 10 种子 × 7 字段 **140 项逐位相同**；全量物件合计不变；全量扫描 20 分钟 → 91 秒 | 无 |
| 2 | **鱼偏多** | ⚠️ 结案 | 离岸分布一致（DE 中位 5 ∈ [4,9]）；海岸线 466 vs DE 522；`GNR_SFISH_SPARSE` 全库 **0 处 `#define`** | 🔴 岸边鱼 90/37、笛鲷 53/31、鲑鱼 6/12 |
| 3 | **沙滩** | ✅ | DE 八邻有水 **100.0%** / 四邻 77.6% ⇒ 改八邻；10 种子 **[1.55, 2.94]** 覆盖 DE 2.54% | 无 |
| 4 | **边界裁剪** | ✅ | 21 个里 13 个被裁（`Dorothea Quarry` **0 格**）⇒ 改为「起始+底座免边界、生长受约束」；岛图水 9.5~56.7% | `Dorothea Quarry` 98 / `Graupel` 43（判「脚本设计如此」） |
| 5 | **120×120 复验** | ✅ | 两图各 10 种子无报错；比例一致（`Forest,Med` 9.0→9.0、`Dry Grass` 5.0→5.0） | 无 |
| 6 | **接口预留** | ✅ | 骨架 + 跳过 LAND/ELEVATION + 强制主题；"一条河穿过平地"两主题出图；沙滩 100% 贴水；陆生物件落水 0；**不传骨架 180/180 逐位不变** | 骨架底地形须按主题取 `BASE_TERRAIN`（已写进报告） |
| — | 自然物件白名单 | ✅ | 16 组 **668 个 id**；导出层过滤；导出 JSON **649 / 非自然 0**；DE 2627 ∈ 我方 **[2539, 2716]** | 地面装饰 +26%；树/灌木 −4.5%、鸟 −50%（已接受） |
| — | 引擎缺表即报错 | ✅ | 构造期检查 `unitRestrict`/`objNames` | 无 |
| — | Murkwood 非整数 spacing | ✅ | 向下取整；**只 Murkwood 变化**（179/180 逐位） | 无 |
| — | `MAPSCALE_AREA` 族 | ✅ | 解析 **180/180**、生成 **180/180**；**只 manchuria 变化** | 无 |

### 遗留已知偏差（第一步范围内，共 6 条）

| # | 偏差 | 量 | 不再追的理由 |
|---|---|---|---|
| 1 | 鱼偏多 | 岸边鱼 90 vs 37 等 | `GNR_SFISH_SPARSE` 全库无人 `#define`，开关来源无法证实 |
| 2 | 地面装饰偏多 | 295 vs 234（+26%） | DE 基准图无图层信息，"用哪张表/用哪个密度"分不开 |
| 3 | 树/灌木偏少 | 2089 vs 2188（−4.5%） | 在 ≤15% 内，CC 接受 |
| 4 | 鸟偏少 | 4 vs 8 | 数量太小，CC 接受 |
| 5 | 133 个 `GNR_*` 开关无人定义 | — | CC：记已知偏差，不追 |
| 6 | `MAPSCALE_AREA` 族（本轮已修） | — | **已修**，不再偏差 |

**第一步可以收工了** —— 6 项任务全部完成，解析与生成均 **180/180**，逐位不变证明齐备。

---

# 二十三、第 47 轮报告：第二步「格子数据模型」—— **样例待确认**

## 23.1 先解决你留的那个问题：河水发黑

**查证结果：水地形本身没问题，是我的渲染器用了 dat 的小地图色。**
`Arabia.rms` 各主题的 `WATER` 都是 **`1 = Water, Shallow`（真实 DE 水地形）**，
而它在 dat 里的小地图色就是 **`[19,19,19]`（近黑）** —— 所以我按 dat 色渲染出来就是黑的。**不是 `o_mod` 占位地形。**

不过你那条要求（**宽河河心深、近岸浅，比例照地中海**）是**对的、已照做**：

| | 河宽 | 河心 | 近岸 | 深浅比 |
|---|---|---|---|---|
| 河流骨架 | 13 格 | 7 格 **`Water, Medium`(23)** | 6 格 **`Water, Shallow`(1)** | **50 : 50**（地中海基准图：浅 51.8% : 中 48.2%） |

## 23.2 占地：**从 dat 读，不估** ✅

`genieutils` 在 dat 里暴露的占地字段：**`clearance_size`**（游戏自己"占多大地方"的字段，(x,y) 单位＝格）、
`collision_size_x/y`、`outline_size_x/y`。已导出 `scratch/de_unit_size.json`（2693 条）。

实测（我们地图里真出现的）：

| 物件 | clearance |
|---|---|
| 树（`ITPINE`/`OLIVE`/`CYPRESS`/`FOAK`/`BUSH`…） | **(0.5, 0.5)** |
| 金矿 `GOLDM` / 石矿 `STONM` / 浆果丛 `FORAG` | **(0.5, 0.5)** |
| 岸边鱼 `FISHS` | (0.5, 0.5) ｜ 笛鲷/鲑鱼 `FISH4`/`FISH2` | (1.0, 1.0) |
| 动物（羊/山羊/盘羊） | (0.3, 0.3) ｜ 野兔 (0.2, 0.2) |
| 狼 | clearance (0.5, 0.5)（碰撞 0.25） |
| **悬崖 `CLIFF_DEFAULT_01`** | **(1.5, 1.5)** |
| **草 `GRASS_GREEN`/`GRASS_DRY`** | **(0, 0)**（纯装饰，不占地） |

**采用的规则**：覆盖格 ＝ 中心落在「以物件坐标为中心、边长 `clearance` 的方形」内的格子；
`clearance` 为 0 的（草）覆盖格为空，另给 `cell` 字段标出它所在那一格。

## 23.3 通行与速度规则

| 项 | 规则 | 依据 |
|---|---|---|
| 能否通行 | **除悬崖外全部可通行**；**悬崖物件覆盖的格子 = 不可通行** | 设计文档第二节（CC 2026-10-09 定） |
| 森林 | **0.5** | 同上 |
| 浅滩 / 沼泽 | **0.6** | 同上 |
| 深水 | **0.3** | 同上 |
| 其余 | **1.0** | 同上 |
| **丘陵上下坡** | **未证实 → 先按 1.0** | 查不到 DE dat / 资料里的明确规则；设计文档亦写"待查证"。⚠️ 我**没有**在 dat 里找到"坡度减速"字段 |

实现：`speed` 存 **×100 的整数**（100/60/50/30），避免浮点误差（任务书要求"速度系数"，这样最稳）。

## 23.4 样例（**请你确认这个格式，确认后我再定稿**）

`scratch/rms-out/mapdata_river_120.json`（417 KB）/ `mapdata_arabia_120.json`（357 KB）

```
size      120                     边长
terrain   [120*120] 逻辑地形 id（行优先，index = y*120+x）—— 物件/森林/通行看它
layer     [120*120] 视觉图层 id，-1 = 无（terrain_mask 的图层）
elev      [120*120] 高度
passable  [120*120] 1/0           能否通行
speed     [120*120] 100/60/50/30  速度系数 ×100
objects[] 物件清单（**只含白名单内的自然物件**）：
          { id, name, kind, x, y, cell, clearW, clearH, cells[] }
          · id/name 来自 dat ｜ kind ∈ 树/灌木·地面装饰·浆果丛·石矿·金矿·悬崖·猎物·猛兽·家畜·鸟·鱼·岸边鱼…
          · x/y 格坐标（0.5 = 格心）｜ cell = 所在格索引 ｜ clearW/clearH = dat 的 clearance
          · cells[] = 覆盖格索引（草这种 clearance=0 的为空数组）
```

**片段**（河流骨架，x=30..37；格式 `terrain/layer/elev/passable/speed`）：

```
y=56: 12/-1/0/1/100  12/-1/0/1/100  12/-1/0/1/100  12/-1/0/1/100  19/12/0/1/50  12/-1/0/1/100  12/-1/0/1/100  12/-1/0/1/100
y=57: 12/-1/0/1/100  71/-1/0/1/100  71/-1/0/1/100  71/-1/0/1/100  19/12/0/1/50  71/-1/0/1/100  12/12/0/1/100  12/12/0/1/100
y=58: 12/-1/0/1/100  12/-1/0/1/100  19/12/0/1/50   71/-1/0/1/100  19/12/0/1/50  71/-1/0/1/100  12/-1/0/1/100  12/12/0/1/100
y=59: 12/-1/0/1/100  12/-1/0/1/100  19/12/0/1/50   19/12/0/1/50   19/12/0/1/50  71/-1/0/1/100  12/-1/0/1/100  12/12/0/1/100
```

**物件样例**：

```json
{"id":350,"name":"FPIN","kind":"树/灌木","x":0.5,"y":0.5,"cell":0,"clearW":0.5,"clearH":0.5,"cells":[0]}
{"id":411,"name":"FORTR","kind":"树/灌木","x":2.5,"y":0.5,"cell":2,"clearW":0.5,"clearH":0.5,"cells":[2]}
{"id":1358,"name":"GRASS_GREEN","kind":"地面装饰","x":11.5,"y":0.5,"cell":11,"clearW":0,"clearH":0,"cells":[]}
```

## 23.5 验收（任务书第 5 条）

| 项 | 结果 |
|---|---|
| **数据与生成结果逐格一致** | ✅ Arabia：`terrain/layer/elev` 逐格相同，自然物件 **1542/1542**<br>✅ 河流骨架：逐格相同，自然物件 **1962** |
| **两份数据** | `mapdata_arabia_120.json`（357 KB）｜ `mapdata_river_120.json`（417 KB） |
| **能否通行/速度可视化** | `scratch/out/_speed_arabia.png` ｜ `scratch/out/_speed_river.png` |
| 速度分布（Arabia） | 100:12873 ｜ 50:1504（森林）｜ 60:23（浅滩）｜ 不可通行 **108 格**（悬崖） |
| 速度分布（河流骨架） | 100:11819 ｜ 50:1113 ｜ **60:743（近岸浅水）** ｜ **30:725（河心）** ｜ 不可通行 **124 格** |

可视化配色：绿 = 1.0 ｜ 黄 = 0.6 ｜ **蓝 = 0.3（河心）** ｜ 深绿 = 0.5（森林）｜ **红 = 不可通行（悬崖）**。

## 23.6 🔴 请你拍板的格式问题（确认后我定稿）

| # | 问题 | 我的倾向 |
|---|---|---|
| 1 | **`layer`/`elev` 要不要保留？** 一个给渲染、一个给"高地伤害"，但第二步验收只要求"逐格一致" | 保留（第三步渲染与玩法都要用） |
| 2 | **数组用行优先一维 + `index = y*size+x`，还是 `size×size` 的二维数组？** | 一维（JSON 更小、读写更快；417 KB 已经是压缩前的裸数组） |
| 3 | **草这类 `clearance=0` 的物件，`cells` 给空数组还是给它所在那一格？** | 空数组 + 保留 `cell` 字段（忠于 dat） |
| 4 | **物件要不要按类别分组（`objects` 拆成 `trees`/`mines`/`animals`…）？** | 不拆，用 `kind` 字段筛；拆了反而不好加新类 |
| 5 | **`speed` 存 ×100 整数还是浮点 0.5/0.6？** | ×100 整数（避免浮点比较误差） |
| 6 | **是否还要"能否通行"的原始依据**（哪一格被哪个悬崖盖的）？ | 暂不加；需要时用 `objects[].cells` + `kind=悬崖` 反查 |

## 23.7 回归与范围

```
parseAll 3          → 180/180 ✅（指令总数 205554）
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（与上轮逐位相同）
```
新增 `tools/rms/mapData.mjs`；引擎本轮的改动：**仅新增 `skeleton` 选项与 `applySkeleton()`**（第 46 轮，默认 null 不影响原路径，已附 180/180 逐位证明）；
`src/`、`public/` **0 改动** ✅

---

# 二十四、第 48 轮报告：数据格式定稿 + 第三步渲染性能实测

## 24.1 数据格式定稿（按 CC 六条裁定 + 文件头）

```json
{ "header": { "formatVersion": 1, "script": "Arabia.rms", "seed": 7, "theme": null,
              "size": 120, "usedSkeleton": false,
              "datFingerprint": { "path": "…/empires2_x2_p1.dat", "bytes": 12023754, "mtime": "2026-09-24T05:29:47.100Z" },
              "generatedAt": "2026-10-09T05:26:57.263Z" },
  "source": "Arabia.rms seed 7 120×120",
  "width": 120, "height": 120,
  "terrain": [...], "layer": [...], "elev": [...], "passable": [...], "speed": [...],
  "objects": [ { "id":350, "name":"FPIN", "kind":"树/灌木", "x":0.5, "y":0.5, "cell":0, "clearW":0.5, "clearH":0.5, "cells":[0] } ] }
```

六条裁定**全部落地**：① `layer`/`elev` 保留 ② 一维行优先 + 显式 `width`/`height` ③ `clearance=0` 的 `cells` 为空数组、保留 `cell`
④ 物件不拆、用 `kind` 筛 ⑤ `speed` ×100 整数 ⑥ 不加悬崖反查表。
**文件头**含：格式版本／脚本名／种子／主题／边长／是否用外部骨架／**DE dat 指纹（大小 + 修改时间）**／生成时间。

## 24.2 第三步：两个渲染原型（`tools/rms/viewer/`，独立网页）

| 文件 | 说明 |
|---|---|
| `tools/rms/viewer/index.html` | 独立测试网页；**Canvas 2D 与 WebGL 两个渲染器**，内容相同：120×120 等距格铺 DE 地形贴图 + 全部自然物件精灵；内建基准（`window.__bench`） |
| `tools/rms/viewer/serve.mjs` | 单独的本机静态服务（根＝仓库根，`node tools/rms/viewer/serve.mjs` → `http://127.0.0.1:8787/tools/rms/viewer/index.html`） |
| `scratch/_bench_viewer.mjs` | puppeteer-core 基准：1080p / 4K 两种窗口 × 3 场景 × 2 渲染器 |

**素材**（只读 `public/`，未改）：地形贴图 = `public/SUCAI_TERRAIN/<manifest 的 name_2 去掉 g_>.png`（**8/8 全部命中**）；
物件精灵 = `public/SUCAI_NATURE|ANIMAL|RESOURCE/<目录>/frames.png + _meta.json`（**按 dat 的真实锚点 `anchor_x/anchor_y` 绘制**）—— **24/27 命中**，
未命中 3 个（`SKELA`/`VULTURE`/`STORK`）在素材里没有对应目录，原型里用色块占位。

## 24.3 实测数字（本机 GPU：NVIDIA GeForce GTX 1660 Ti，ANGLE/D3D11）

**1080p（1920×1080）**

| 渲染器 | 场景 | 帧率 | 单帧中位 | p95 | **CPU/帧** |
|---|---|---|---|---|---|
| **Canvas 2D** | 整图可见 | 🔴 **28.3 fps** | **33.3 ms** | 50.0 ms | **29.0 ms** |
| Canvas 2D | 拖动镜头 | 59.7 fps | 16.7 ms | 16.8 ms | 7.7 ms |
| Canvas 2D | 缩放 | 55.7 fps | 16.7 ms | 33.3 ms | 8.7 ms |
| **WebGL** | 整图可见 | ✅ **60.3 fps** | 16.7 ms | 16.8 ms | **0.2 ms** |
| WebGL | 拖动镜头 | ✅ 60.3 fps | 16.7 ms | 16.7 ms | 0.2 ms |
| WebGL | 缩放 | ✅ 60.7 fps | 16.7 ms | 16.8 ms | 0.2 ms |

**4K（3840×2160）**

| 渲染器 | 场景 | 帧率 | 单帧中位 | p95 | **CPU/帧** |
|---|---|---|---|---|---|
| **Canvas 2D** | 整图可见 | 🔴 **27.3 fps** | **33.3 ms** | 66.6 ms | **29.1 ms** |
| Canvas 2D | 拖动镜头 | 🔴 **42.0 fps** | 16.7 ms | 33.4 ms | **20.1 ms** |
| Canvas 2D | 缩放 | 🔴 **29.3 fps** | 33.3 ms | 66.6 ms | 29.1 ms |
| **WebGL** | 整图可见 | ✅ **60.3 fps** | 16.7 ms | 16.7 ms | **0.2 ms** |
| WebGL | 拖动镜头 | ✅ 60.7 fps | 16.7 ms | 16.8 ms | 0.2 ms |
| WebGL | 缩放 | ✅ 60.3 fps | 16.7 ms | 16.7 ms | 0.1 ms |

## 24.4 建议：**用 WebGL**

**理由（三条，都来自上面的数字）**：

1. **Canvas 2D 现在就已经守不住 60 帧**：整图可见 **28.3 fps（1080p）/ 27.3 fps（4K）**，4K 下连拖动都掉到 **42 fps**；
   而 **WebGL 在全部 6 种组合里都是 60 fps 顶格**。
2. **CPU 余量差 50~150 倍**：Canvas 2D 单帧 CPU **7.7~29.1 ms**（60 帧的预算是 16.7 ms ⇒ 整图视角已用掉 **174%**）；
   WebGL **0.1~0.3 ms**（约 1~2%）。**而后面还要加过渡、高度明暗、悬崖、水岸**（本原型按 CC 要求都还没做）——
   Canvas 2D 那点余量根本不够，WebGL 还有两个数量级的空间。
3. **分辨率不敏感**：WebGL 从 1080p 到 4K，帧率与 CPU 完全不变（代价落在 GPU 填充上，本机 1660 Ti 绰绰有余）；
   Canvas 2D 在 4K 下明显更差（拖动 59.7 → 42 fps）。

## 24.5 原型现状与已知限制（按 CC 要求**都不做**）

| 项 | 状态 |
|---|---|
| 地形过渡 / 高度明暗 | **未做**（CC 明确"选定技术之后的事"）—— 所以图里森林地块是**未混合的黑块**（`for.png` 本身是带透明的叠加层） |
| 悬崖、水岸渲染 | **未做** |
| 物件精灵 | 24/27（3 个素材里没有对应目录）；只取第一帧，无动画 |
| 剪裁/剔除 | **未做**（每次都把 14400 格全画一遍 —— 这正是"整图可见"最坏情况的口径） |

## 24.6 回归

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（与上轮逐位相同）
```
本轮改动：**只新增 `tools/rms/viewer/`（新目录，独立网页）**，未改引擎、未改 `src/`、未改 `public/` ✅

---

# 二十五、第 49 轮报告：第三步第 1 项「视野剔除」+ 模块化落地

## 25.1 接入架构（按 CC 裁定先定下）

**`tools/rms/viewer/groundLayer.mjs`** —— 地面层独立模块（**只有地面层是 WebGL**；士兵/特效/界面将来继续 Canvas 2D 叠在上层）：

```js
createGroundLayer(canvas, { data, manifest, textures, sprites })
  → { render(), setCamera({x, y, zoom}), setCull(bool), resize(w,h), stats() }
```
- **输入** = 第二步的地图数据（`mapData.mjs` 的产物）；
- **输出** = 一张随镜头拖动/缩放的画面；
- **镜头参数由外部传入**（`setCamera`），页面里 `camView()` 算好 `{ox, oy, z}` 再喂进来 —— 日后士兵层用同一套参数同步 ✅

## 25.2 第 1 项：视野剔除 ✅

**实现**：每帧把镜头矩形（屏幕像素 → 世界像素 → 等距逆变换成格坐标）换算成可见格范围，
**只把范围内的格子与物件装进顶点数组**（地形 6 顶点/格，物件 6 顶点/个），一次 `drawArrays` 画完。

```
可见范围 = 镜头矩形四角 → 等距逆变换 → 取 min/max → 外扩 1 格（菱形角覆盖邻域）
物件剔除 = 世界像素矩形判定（外扩一个精灵尺寸）
```

**实测（GTX 1660 Ti / ANGLE-D3D11）—— 1080p**

| 配置 | 场景 | 帧率 | 单帧中位 | p95 | **CPU/帧** | **画的格数** | 画的物件 |
|---|---|---|---|---|---|---|---|
| **WebGL + 剔除** | 整图可见 | ✅ 60.0 | 16.7 ms | 16.8 ms | **4.5 ms** | 14400（全图） | 1542 |
| WebGL 无剔除 | 整图可见 | 59.7 | 16.7 ms | 16.8 ms | 4.4 ms | 14400 | 1542 |
| **WebGL + 剔除** | **拖动镜头** | ✅ 59.3 | 16.7 ms | 16.8 ms | **1.7 ms** | **4347（−70%）** | **286** |
| WebGL 无剔除 | 拖动镜头 | 59.7 | 16.7 ms | 16.8 ms | 4.0 ms | 14400 | 286 |
| **WebGL + 剔除** | **缩放** | ✅ 60.0 | 16.7 ms | 16.8 ms | **2.4 ms** | **6072（−58%）** | 507 |
| WebGL 无剔除 | 缩放 | 59.7 | 16.7 ms | 16.8 ms | 4.2 ms | 14400 | 563 |
| Canvas 2D | 整图可见 | 🔴 **23.0** | 49.9 ms | 66.7 ms | **34.9 ms** | — | — |

**4K**

| 配置 | 场景 | 帧率 | CPU/帧 | 画的格数 |
|---|---|---|---|---|
| **WebGL + 剔除** | 整图可见 | ✅ 60.0 | 4.5 ms | 14400 |
| **WebGL + 剔除** | 拖动镜头 | ✅ 59.3 | **3.5 ms** | **9880** |
| **WebGL + 剔除** | 缩放 | ✅ 60.3 | 3.4 ms | 9558 |
| Canvas 2D | 整图可见 | 🔴 **19.3** | **47.4 ms** | — |
| Canvas 2D | 拖动镜头 | 🔴 **39.7** | **22.0 ms** | — |
| Canvas 2D | 缩放 | 55.7 | 6.8 ms | — |

**结论**：① **剔除生效**（1080p 拖动：格 14400 → **4347**，CPU 4.0 → **1.7 ms**，−58%）；
② **WebGL 全部 9 种组合 ≥59.3 fps**（59.3 是 vsync 抖动，非掉帧）；③ Canvas 2D 在整图/4K 拖动下 19.3~39.7 fps，**再次印证第三步选 WebGL**。
📌 **注**：本模块每帧重建顶点数组（`DYNAMIC_DRAW`），整图视角 CPU 4.5 ms（上一版静态 VBO 是 0.2 ms）—— 为剔除付出的代价，仍在 16.7 ms 预算内（用掉 27%）。

## 25.3 对照图（左 DE 参考 ｜ 右我们）

- **DE 参考**：`scratch/de-ref/Mediterranean_144_full.json`（由 `public/de-maps/medi_*.json` 拼成）→ 转成同一数据格式后由**同一个 viewer** 渲染（贴图 6/6、精灵 10/17）
- **我们**：`mapdata_arabia_120.json`（贴图 8/8、精灵 24/27）
- 出图脚本：`scratch/_mk_de_mapdata.mjs`（DE→数据）、`scratch/_shot_cmp.mjs`（两张截图）、Pillow 拼接

📌 **主人若提供 DE 截图，以截图为准**（本条按 CC 指示记录）。

## 25.4 本项依据

| 内容 | 依据 |
|---|---|
| 等距格尺寸 64×32 | 项目现有 DE 地表贴图的长宽比（**推断**：DE 的 SLD 贴图按此比例铺格） |
| 地形贴图 | `public/SUCAI_TERRAIN/<dat terrain 的 name_2 去掉 g_>.png`（**DE dat 字段**） |
| 物件精灵与锚点 | `public/SUCAI_NATURE|ANIMAL|RESOURCE/<目录>/frames.png + _meta.json` 的 `anchor_x/anchor_y`（**素材自带元数据**） |
| 物件名 → 素材目录 | 目录名与 dat/random_map.def 规范名对应；**个别为推断**（如 `FDRA/FPAL→PALM`、`BIRCH→BIRCH_GREEN`） |
| 剔除范围 | 等距投影的逆变换（数学推导，无经验参数） |

## 25.5 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：新增 `tools/rms/viewer/groundLayer.mjs`，重写 `tools/rms/viewer/index.html`（改用模块 + 剔除开关 + `?map=` 参数）；
**未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **测试服务已停**。

---

# 二十六、第 50 轮报告：三项纠正 + 等距格核对 + 同口径对照

## 26.1 纠正 2（先做，因为它决定比例）：**等距格尺寸核对 —— 64×32 得到证实，是 DE 的 1/4**

**不是推断，是量出来的**：

| 证据 | 数值 |
|---|---|
| DE 地表贴图原始尺寸 | `public/SUCAI_TERRAIN/*.png` 全部 **512×512** |
| **贴图的平移周期**（`for.png` 实测：平移 256 的平均差 **0.1**，其它位移 ~30） | **256 px** ⇒ 一张贴图 = **2×2 个 256×256 的格** |
| 等距投影把正方形压成 2:1 | ⇒ **DE 一格屏幕菱形 = 256×128 px** |

**用同一棵树验证比例**（CC 要求）：

| 树 | 精灵箱（DE 原生像素） | ÷ 256 ⇒ **占几格** | 我方按 0.25 缩放后 |
|---|---|---|---|
| `ITALIAN_PINE` | 152×124 | **0.59 × 0.48 格** | 38×31 px（同一比例） |
| `OLIVE` | 216×176 | **0.84 × 0.69 格** | 54×44 px |

🔴 **由此修掉一个真 bug**：原实现把**每个精灵等比塞进图集格**（128 px）⇒ 树与地面的比例是**任意的**。
现在改成 **`精灵原生像素 × 0.25`**（`SPRITE_SCALE = 64/256`），与 DE 比例一致。

## 26.2 纠正 3：镜头不动就不重建顶点 ✅

`groundLayer.render()` 增加 `builtKey = cam.x|cam.y|cam.zoom|w|h|cull`：**相同就跳过顶点重建，只重画**。

| 场景 | 改前 CPU/帧 | **改后 CPU/帧** |
|---|---|---|
| 整图可见（镜头不动） | 4.5 ms | **0.0 ms** ✅ |
| 拖动镜头（每帧都变） | 4.0 ms | **1.5 ms** |
| 缩放（每帧都变） | 4.2 ms | **2.3 ms** |

**帧率（1080p）**：WebGL+剔除 整图 **60.0** / 拖动 **60.0** / 缩放 **59.7**；无剔除 59.7/59.7/59.7；Canvas 2D 整图 🔴 **22.0**（CPU 37.7 ms）。
**4K**：WebGL+剔除 全部 ~60 ✅（详见 §25.2 同口径表，本轮的增量重建只改 CPU，不掉帧）。

## 26.3 🔴 顺带查出一个会静默变黑的坑（记下来）

改精灵缩放后，图集被撑到 **2560×2560**（9 张贴图 512 + 16 个精灵，每格取 512）——该尺寸下 **D3D11/ANGLE 采样全黑**，
而画面**不报错**（亮度 12.6，其中大半还是工具栏文字）。已修：**图集总边长保守限到 ≤2048**（每格逐次减半直到放得下）。
修后画面区平均亮度 12.6 → **31.9**。

## 26.4 纠正 1：**同口径对照图**（左 DE 地中海 ｜ 右**我们生成的地中海**）

- 左：`de-ref/Mediterranean_144_full.json`（DE 真图，`public/de-maps/medi_*.json` 拼成）
- 右：**`Mediterranean_medisouth.rms` seed 2、144×144**（新脚本 `scratch/_mk_our_medi.mjs`，逐格一致 ✅，自然物件 **2697** vs DE **2627**）
- 同一个 viewer、同一镜头口径（整图可见）

![左：DE 地中海 ｜ 右：我们生成的地中海（同脚本同主题）](scratch/out/_cmp_side.png)

两侧的**大结构**（草地基底 + 泥地斑块 + 森林团 + 大水体）已能并排比较；差别主要在**水形**（不同种子）与森林/精灵的疏密。

## 26.5 主人新定的范围（已记）

**战场只做陆地**：纯陆地、有河流、沿海、有湖泊的陆地，全部由战略地图转换；**不做海战**。
⇒ 渲染里的水只需处理 **河流 / 湖泊 / 近岸水 + 沙滩**，不必考虑以海为主的地图。

## 26.6 第 2 项「地形过渡」—— **本轮未做，下一轮做**

本轮的分量用在了三项纠正 + 等距格核对（它必须先定，否则过渡与精灵比例都是错的）与那个图集变黑的坑上。
**下一轮**做地形过渡，已备好的依据：

| 依据 | 内容 |
|---|---|
| `blend_priority` / `blend_type` | 已在 `scratch/de_terrain_manifest.json` 里（每个地形都有，来自 dat） |
| **DE 过渡遮罩** | `public/SUCAI_TERRAIN/masks/`（26 张：`grass`/`dirt`/`beach`/`jungle`/`leaves`/`snowland`… `default_weak`/`default_strong`） |
| DE 混合贴图 | `public/SUCAI_TERRAIN/blends/`（10 张：`landland`/`watershore`/`shallowswater`/`waterwater`/`roadland`/`snowland`/`farmland`…） |
| 森林黑块的成因 | **本轮已排除**"贴图带透明"这一假设：`for.png` alpha 恒 255、近全黑像素 0% ⇒ 黑块来自**图集上限**那个坑（已修，见 §26.3） |

## 26.7 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`tools/rms/viewer/groundLayer.mjs`（精灵比例 + 增量重建 + 图集上限）；新增 `scratch/_mk_our_medi.mjs`；
**未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **测试服务已停、端口已关闭** ✅

---

# 二十七、第 51 轮报告：格子像素按权威数据重定（256×128 **已撤回**）

## 27.1 ❌ 撤回：256×128 是**推断**，证据不足（CC 裁定，我接受）

上一轮我据"`for.png` 的平移周期 = 256"推断"一格 = 256×128"。CC 指出：**重复周期是美术画法，不等于格子大小**；
且按它算 `ITALIAN_PINE` 只占 **0.59 格宽**，DE 森林是每格一棵树、树冠重叠很密，这个比例会让森林明显偏稀。
**台账已改为「已撤回的推断」**（代码注释里也写明）。

## 27.2 ✅ 权威口径（CC 指定的三步）

### (1) dat 自己登记的格子像素 —— **96×48**

```
terrain_block.tile_width       = 96
terrain_block.tile_height      = 48
terrain_block.tile_half_width  = 48
terrain_block.tile_half_height = 24
terrain_block.elev_height      = 24          ← 高度步长
terrain_block.tile_sizes       = 19 项，样例 TileSize(width=96, height=48, delta_y=0)
terrains[0] 样例：Terrain(name='Grass', name_2='g_grs', blend_priority=110, blend_type=0,
                          overlay_mask_name='grass.png', terrain_dimensions=(10,10), colors=(55,236,54))
```
**依据来源**：`genieutils` 读 `empires2_x2_p1.dat` 的 `terrain_block`（探针 `scratch/_probe_dat_tilesize.py`）。

### (2) 我们的素材是 **x1（普通版，非 4K）**

| 证据 | 内容 |
|---|---|
| 提取脚本 | `scratch/aoe2de_nature_extract.py:38` 固定取 **`{sld_prefix}_x1.sld`** |
| 文件大小 | 同一单位 `n_tree_italian_pine_x1.sld` **121 KB** vs `_x2.sld` **423 KB**（≈3.5 倍面积 ≈ 2× 线性） |

### (3) 正确比例 —— **精灵与格子同在 x1 空间 ⇒ 1:1**；我方 64×32 格 ⇒ **缩放 = 64/96 = 2/3**

**数值验证**：

| 树 | 精灵箱（x1 原生像素） | ÷ 96 ⇒ **占几格** |
|---|---|---|
| `ITALIAN_PINE` | 152×124 | **1.58 × 1.29 格** |
| `OLIVE` | 216×176 | **2.25 × 1.83 格** |
| `GREEN_OAK` | 184×200 | 1.92 × 2.08 格 |
| `GRASS_GREEN` | 108×60 | 1.13 × 0.63 格 |
| `MINE_GOLD` | 104×56 | 1.08 × 0.58 格 |

⇒ 树冠**必然互相重叠**，与"DE 森林每格一棵树、树冠很密"相符 ✅（而 256×128 只给 0.59 格，方向错了）。

## 27.3 ✅ (4) 验证图：同一片 DE 地中海森林，两种比例并排

取景：DE 地中海里树最密的 8×8 区（格 76,132，57 棵树）；同一 viewer、同一镜头、同一窗口。

![左：正确比例 2/3（树冠密集成片）｜右：已撤回的 0.25（树孤立稀疏）](scratch/out/_forest_cmp.png)

**量化**：裁同一区域，暗绿（树冠）像素占比 **左 40.9% ｜ 右 35.5%**；**肉眼可见左图树冠连成片、右图一格一棵孤立** ✅

## 27.4 台账更正

| 项 | 原记录 | **更正为** |
|---|---|---|
| 等距格像素 | 「DE 一格 = 256×128 px（据贴图周期推断）」 | 🔴 **已撤回的推断** → **DE 一格 = 96×48 px**（dat `terrain_block.tile_width/tile_height`，**权威**）；高度步长 `elev_height = 24` |
| 精灵比例 | 「原生像素 × 0.25」 | **原生像素 × 2/3**（我方 64×32 格 ÷ DE 96×48；两边同为 x1） |
| 我方素材分辨率 | 未记录 | **x1（普通版）**，来源 `aoe2de_nature_extract.py:38` 的 `_x1.sld` |

## 27.5 🔴 第 2 项「地形过渡」—— 比例定下了，本轮未做（下一轮做）

具体原因：本轮分量用在"按权威数据重定比例 + 出验证图"上（CC 要求"定下来之前先不做"）。
**依据已全部备好**：`blend_priority`/`blend_type`/`overlay_mask_name`（**就在 dat 的 terrain 里**，见 §27.2 的 Terrain 样例）、
`public/SUCAI_TERRAIN/masks/`（26 张）与 `blends/`（10 张）。

📌 附带发现：dat 的每个地形还带 **`overlay_mask_name`**（如 Grass = `grass.png`、对应 `masks/grass.png`）与 **`terrain_dimensions=(10,10)`**
—— 这两项正是做过渡要用的**官方字段**，下一轮按它们接。

## 27.6 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`tools/rms/viewer/groundLayer.mjs`（比例改为 2/3 + 注明撤回依据 + `?scale=` 便于对比）；新增 `_probe_dat_tilesize.py`、`_shot_forest.mjs`；
**未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅

---

# 二十八、第 52 轮报告：`terrain_dimensions` 核实（A/B）＋ 一个必须裁定的分辨率问题

## 28.1 ✅ dat 的过渡字段（全部来自 `terrain_block`，探针 `_probe_terrain_dims.py`）

| 地形 | `terrain_dimensions` | `overlay_mask_name` | `blend_priority` | `blend_type` |
|---|---|---|---|---|
| `Underbrush` | (10,10) | `leaves.png` | **2** | 0 |
| `Dirt 3` | (10,10) | `dirt.png` | 83 | 0 |
| `Desert` | (10,10) | （空） | 86 | 0 |
| `Palm Desert` | (10,10) | （空） | 91 | 0 |
| `Forest` | (10,10) | `leaves.png` | 94 | 0 |
| `Pine Forest` | (10,10) | （空） | 107 | 0 |
| `Forest, Mediterranean` | (10,10) | （空） | 108 | 0 |
| **`Grass`** | **(10,10)** | **`grass.png`** | **110** | 0 |
| `Grass 2` / `Grass 3` | (10,10) | `grass.png` | 118 / 119 | 0 |
| `Dry Grass` | (10,10) | `grass.png` | 126 | 0 |
| `Beach` | (10,10) | `beach_soft.png` | 130 | **2** |
| `Snow` | (10,10) | `snow.png` | 152 | 7 |
| `Water, Shallow` | (10,10) | `water.png` | 166 | **3** |
| `Water, Medium` | (10,10) | `water.png` | **178** | **3** |

**`terrain_dimensions` 的取值**：`(10,10)` 114 个 ｜ `(0,0)` 66 个 ｜ `(3,3)` 9 个 ｜ `(6,6)` 6 个 ｜ `(15,15)` 5 个。
**`overlay_mask_name` 与我们的素材完全对得上** ✅：`grass.png`/`dirt.png`/`leaves.png`/`beach.png`/`beach_soft.png`/`road.png`/`snow.png`/`snow_underbrush.png`/`water.png`/`ice.png`/`neutral_33.png`
—— 全部存在于 `public/SUCAI_TERRAIN/masks/`（26 张）。

## 28.2 🔴 **必须先请你裁定的分辨率问题**：我们的**地形贴图是 2x 版，精灵是 x1 版**

查 `terrain_dimensions` 时发现的：

| 素材 | 来源 | 版本 |
|---|---|---|
| **地形贴图** `SUCAI_TERRAIN/*.png`（512×512） | `scratch/aoe2de_terrain_convert.py:20` 的 `DE_TERRAIN_DIR = …\terrain\textures\`**`2x`** | **2x（HD/4K 版）** |
| **精灵** `SUCAI_NATURE|ANIMAL|RESOURCE` | `aoe2de_nature_extract.py:38` 的 `{prefix}`**`_x1.sld`** | **x1（普通版）** |

⇒ **两套素材不在同一分辨率的像素空间**。这与我们上一轮定的"精灵 1:1 对 96×48（x1）"**并不冲突**（96×48 本身就是 x1 口径），
但它直接决定 §28.3 的"贴图铺法"该按哪个尺度算 —— **我不敢自己定**：

| 选项 | 含义 | 后果 |
|---|---|---|
| **A. 把 2x 地形贴图降采样到 x1（512→256）** | 与精灵统一到 x1 空间 | 与 dat 的 96×48、精灵 2/3 缩放自洽；纹理细节损失一半 |
| **B. 精灵改用 x2 版**（`*_x2.sld`） | 统一到 2x | 素材要重新提取；与 dat 96×48 的换算要乘 2 |
| **C. 地形保持 2x、精灵保持 x1** | 不统一 | 地面纹理比精灵细一倍，**推断**会显得"地面比树精细" |

## 28.3 `terrain_dimensions` 语义核实：两种铺法 A/B（已实现，**语义标「推断」**）

**实现**（`groundLayer.mjs`，`?tscale=` 切换）：
- **`tile`（现状）**：每格贴**一整张** 512×512 贴图（菱形四角对到整张图的上/右/下/左中）
- **`world`（按 `terrain_dimensions`）**：一张贴图跨 `dim×dim` 格，相邻格取贴图里相邻子块 ⇒ 整片地面是一张连续大图

**A/B 图**（DE 地中海裁 34×34 的一角，`full` 视角即放大）：

![左：tile（每格一整张，水面平滑无纹理）｜右：world（按 10×10 铺，水面出现纹理与色带）](scratch/out/_tex_cmp.png)

**观察**：左图水面**几乎是纯色**（整张贴图压进一格，细节被抹平）；右图水面**出现纹理与横向色带**（贴图的水面渐变每 10 格重复一次）。
**我的判断（推断）**：DE 的大片水面**能看见纹理与深浅变化**，所以 **`world` 更接近**；但 `(10,10)` 的确切含义**我没有 DE 侧直接证据**，请你判。
（`(3,3)/(6,6)/(15,15)` 那几档若真是"覆盖格数"，则不同地形铺法不同 —— 这一点也请一并裁定。）

## 28.4 🔴 第 2 项「地形过渡」本轮**未做**

原因：核实 `terrain_dimensions` 时**撞出 §28.2 的分辨率问题**（地形 2x vs 精灵 x1）。它是过渡的**前置**——
过渡要把遮罩按格子铺，铺法取决于贴图在哪个像素空间；**先定分辨率再做过transition**，否则做完要返工。
**依据已 100% 备好**（见 §28.1）：`blend_priority` 决定谁盖谁（Underbrush 2 < … < Water,Medium 178）、
`overlay_mask_name` 直接指向 `masks/<名>.png`（名字全部命中）、`blends/` 10 张（`landland`/`watershore`/`shallowswater`/`waterwater`/`roadland`/`snowland`…）。

## 28.5 📌 记一条给第四步的备忘（CC 指示）

> **接入游戏时，士兵精灵必须与地图使用同一个比例**：同为 x1 素材、相对 96×48 的格 **1:1**（我方画面 64×32 格 ⇒ **2/3**）。
> **不能沿用现在战术层自己的缩放**，否则士兵与树、地面大小不协调。

## 28.6 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`groundLayer.mjs`（`texMode` + 按 dim 铺贴图）、`index.html`（`?tscale=` + 读 blend 表）；
**未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅

---

# 三十、第 54 轮报告：blends 形状量测 + 对应关系 + 白噪声清除

## 30.1 `blend_type` → `blends/` 哪张图：**dat 里没有引用，按文件名语义对应（推断）**

**先按 CC 要求查了出处**：在 `empires2_x2_p1.dat` 二进制里搜 9 个 blends 文件名 —— **全部 0 命中**：

```
landland / watershore / shallowswater / waterwater / snowland / icewater / roadland / farmland / herbwatershore
→ 每个都「（无）」
```

⇒ 只能按**文件名语义 + `blend_type` 的取值**对应，**标「推断」**：

| `blend_type`（dat 实测取值） | 地形类别（实例） | **推断对应的 blends 图** |
|---|---|---|
| 0 | 陆地（Grass / Dirt / Forest / Underbrush / Desert…） | `landland`（陆↔陆） |
| **2** | 沙滩（`Beach`） | `watershore`（水↔岸）｜与 type 3 相邻时用 `shallowswater` |
| **3** | 水（`Water, Shallow` / `Water, Medium`） | 水↔陆 = `watershore`；水↔水 = `waterwater`；浅↔深 = `shallowswater` |
| 6 | 冰（`Ice`） | `icewater`（冰↔水） |
| 7 | 雪（`Snow`） | `snowland`（雪↔陆） |
| — | 道路 / 农田 / 水生植物 | `roadland` / `farmland` / `herbwatershore`（本轮地图未出现） |
| — | — | `reserved` = 未使用 |

## 30.2 `landland.png` 的形状布局（量测 + 标注图）

```
512×512（2x）⇒ 4×4 共 16 个 128² 单元；缩到 x1 后 = 4×4 个 64²
白 = 该地形填充；黑 = 透明淡出；形状沿 45°（等距）排布
```
（探针 `scratch/_probe_blends.py`；标注图见下，网格按 128px 划分并编号 `(bx,by)`）

![landland 4×4 网格标注：每格一个边/角形状](scratch/out/_blend_landland_grid.png)

**逐格量测（四象限均值，0=黑 255=白）**：

| 格 | 左上 | 右上 | 左下 | 右下 | 均值 | **形状推断** |
|---|---|---|---|---|---|---|
| (0,0) | 20 | 86 | 92 | **254** | 114 | **外角**（左下亮、右上暗） |
| (1,0) | 89 | 89 | **254** | **254** | 172 | 上边（下半亮） |
| (2,0) | 47 | 90 | 169 | **254** | 141 | 上边/斜边 |
| (3,0) | 89 | 23 | **254** | 92 | 115 | **外角**（右下亮） |
| (0,1) | 95 | **254** | 94 | **254** | 175 | 左边（右半亮） |
| (1,1) | 114 | **254** | **254** | 255 | 220 | 角部/近全白 |
| (2,1) | 174 | **254** | **254** | 255 | 235 | 全白（基准块） |
| (3,1) | 171 | 171 | **254** | 95 | 173 | 右边 |
| (0,2) | 48 | 168 | 95 | **254** | 142 | 左边/斜边 |
| (1,2) | 171 | **254** | **254** | **254** | 234 | 全白 |
| (2,2) | 192 | 199 | 188 | 181 | 191 | **菱形（单格）** —— 正是 CC 说的那个菱形 |
| (3,2) | **254** | 94 | **254** | 94 | 175 | 右边/凹角 |
| (0,3) | 93 | **254** | 28 | 98 | 119 | **外角**（右上亮） |
| (1,3) | 170 | **254** | 172 | 101 | 175 | 下边 |
| (2,3) | **254** | 255 | 101 | 102 | 179 | 下边 |
| (3,3) | **254** | 95 | 101 | 28 | 120 | **外角**（左上亮） |

🔴 **"哪个格子=哪条边/哪个角"的确切对应，我没有 DE 侧证据**（形状是 45° 斜的，四象限法只能粗分）
⇒ **整张表标「推断」**，**请按标注图核对**；主人若给 DE 截图，以截图为准。

## 30.3 组合方式（CC 给的方案，**已设计、本轮未实现**）

| 步骤 | 做法 | 性质 |
|---|---|---|
| 边缘形状 | 按格子的**方向**从对应的 `blends/<对>.png` 取那一个 128²（x1 后 64²）单元 | **推断**（对应表见 §30.2） |
| 遮罩 | **按地图坐标连续平铺**（不再是每格各铺一张） | CC 指示 |
| 打碎边缘 | `alpha = smoothstep(mask − w, mask + w, shape)`，**w 先取 0.15** | **推断**，与 DE 截图对比后再调 |
| 多层 | 一个格子有多个更高优先级邻居时，**按优先级从低到高逐层叠**，每层只叠**属于这个邻居的那几个方向** | CC 指示 |

**现状**：现行实现只用到了 §28.1 的 `overlay_mask_name` 遮罩（而 CC 已查明 masks 只是**打碎边缘的噪声、不含方向**），
所以效果出不来 —— **与 CC 的判断一致**。本轮分量用在量测与对应关系上，**重写过渡留到下一轮**。

## 30.4 ✅ 白噪声方块：**已消除**

补完 30 条别名后复测（同一块 DE 地中海裁块）：

| | 修复前 | **修复后** |
|---|---|---|
| DE 裁块 | 精灵 **5/11**（`GOLD_MINE`/`STONE_MINE`/`WILD_BOAR`/`SHORE_FISH`… 渲染成白噪声） | **11/11** ✅ |
| 我们裁块 | — | **7/7** ✅ |

## 30.5 四格对比图（DE ｜ 我们 × 过渡开/关，同一镜头、同一格窗口）

裁块 `34² @ (40,30)`；DE 侧地形 `88,3,5,2,1,23,100`（森林/泥/灌木/沙滩/浅水/中水/干草），
我们侧 `3,5,100,2,1,23`（泥/灌木/干草/沙滩/浅水/中水）—— **草/林/沙/浅水交界都在** ✅

![左上 DE 过渡开 ｜ 右上 DE 过渡关 ｜ 左下 我们过渡开 ｜ 右下 我们过渡关](scratch/out/_cmp4.png)

**观察**：我们侧（下排）在沙滩/水交界处**已经能看到轻微边缘变化**（左下的浅色条 vs 右下的整块），DE 侧（上排）差别更细微 ⇒ 现行遮罩式过渡**有效但很弱**，与 §30.3 的诊断一致。

## 30.6 blends 缩到 x1 —— **本轮未做**

因为**还没有代码消费 blends**（§30.3 未实现）。下一轮实现过渡时，与地形贴图/遮罩**一并按 `toX1()` 缩半**。

## 30.7 帧率

本轮**未新增几何**（过渡逻辑未重写），沿用上一轮实测：1080p WebGL+剔除 整图 **60.0** / 拖动 **59.7** / 缩放 **60.0**，全部 ≥59 ✅。

## 30.8 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`index.html`（+30 条别名）、新增 `scratch/_probe_blends.py`、`_shot_cmp4.mjs`；
**只改 `tools/rms/` 与 `docs/`，未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅

---

# 三十一、第 55 轮报告：按新办法重写过渡 —— **格心保住了，但过渡整体没渲染出来（未解决）**

## 31.1 ✅ 已量准的数字（CC 要求写进台账）

**`landland` 外框「黑→白」渐变宽度**（横穿 512² 中间一行量的）：

```
黑(<8) 结束于 x=12，白(>246) 开始于 x=59  ⇒  渐变宽 = 47 px（512 口径）
缩到 x1(256) 后 = 24 px；我方一格 64 px  ⇒  ≈ 0.367 格（CC 估的"约半格"接近）
```
本实现取 `SHAPE_ZERO = 1 − 0.367/0.5 = 0.266`（形状从共享边 1 到格心 0 跨 0.5 格，故把"归零"定在 0.367 格处）。

## 31.2 ✅ 采纳 CC 的新办法（不查表，程序算 shape）

| 项 | 实现 |
|---|---|
| **边缘形状** | **程序算**：菱形四角给 `shape ∈ {0,1}` —— **落在与高优先级邻居共享边上的两个角 = 1**，另两角 = 0，片元里线性插值。方向映射：`+x → [0,1,1,0]`、`−x → [1,0,0,1]`、`+y → [0,0,1,1]`、`−y → [1,1,0,0]`（角序 `[上,右,下,左]`）—— **推断** |
| **渐变带** | `s = clamp((shape − 0.266) / 0.734, 0, 1)` ⇒ **格心 s = 0** |
| **遮罩** | **按地图坐标连续平铺**（用该格的世界子块，不再每格各一张） |
| **合成** | `alpha = smoothstep(mask − 0.15, mask + 0.15, s)`（**w = 0.15**，CC 指定） |
| **多层** | 一个格子有多个更高优先级邻居时，**按优先级从低到高逐层叠**，每层只叠该邻居那一侧的角（`SHAPE_OF_DIR`） |
| **水↔陆** | **同一套算法**，只换 `overlay_mask_name` 对应的遮罩 ✅ |
| blends 图集查表 | **未采用**（按 CC 裁定：留到有 DE 截图后再研究） |

## 31.3 🎯 专门验证：**沙滩（以及所有格子的）格心在过渡开/关时完全一样** ✅

对 40×40 窗口的全部 **1599 个格心像素**逐一比对（开 vs 关）：

| 地图 | 格心像素数 | **格心最大差** | 判定 |
|---|---|---|---|
| DE 地中海 | 1599 | **0** | ✅ **过渡没有动任何格心** |
| 我们地中海 | 1599 | **0** | ✅ 同上 |

⇒ **CC 第三条要求（格心必须保持本地形、沙滩不被盖掉）已满足**。

## 31.4 🔴 **但过渡整体没渲染出来（未解决）**

同一对图的**全画面**比对：

```
DE  全画面最大差 0 ｜ 平均差 0.000 ｜ 差>0 的像素 0.00%
我们 全画面最大差 0 ｜ 平均差 0.000 ｜ 差>0 的像素 0.00%
```
⇒ **过渡开/关两张图逐像素完全相同** ⇒ **过渡片元一个像素都没画出来**。

**已排除的**（诊断计数，`stats.dbg`）：
```
candSeen = 316（确实找到了 316 个"高优先级邻居"候选）
skipSame 5442 ｜ skipPrio 399 ｜ skipUv 83
blends = 361 个片元（顶点数换算，⚠️ 换算式用了旧的 /7，应为 /8 —— 见下）
atlas 24 张（含遮罩 5 张）｜ tiles 1600 ｜ objs 173
```
⇒ **候选有、顶点有、draw call 也发了**，但**片元全被判掉**。**未查清**的怀疑点（按可能性排序）：
1. `aShape` 属性没真正传到片元（属性位置/步长/偏移在 `aUse` 之后改动过，`STRIDE 32` 与 8 个 float 是否处处对齐 —— **最可疑**）；
2. `smoothstep(mask−w, mask+w, s)` 里遮罩 R 的实际分布与我实测的 130~170 不符（例如缩半后接近 1.0 ⇒ 阈值 >1 ⇒ 全判 0）；
3. 画序/混合状态问题。

**顺手发现的一个真 bug（本轮未修完）**：`mk()` 里 `f.length / 7` 应为 `/ 8`（顶点从 7 float 变 8 float 后没跟着改）⇒ `stats.blends` 报 361 而非 316，且 `drawArrays` 会多画 14% 的越界顶点。

## 31.5 ✅ 对比图重出的前置：窗口与地形格数（先列后出）

按要求**先列出窗口内各地形的格数**：

| 窗口 40×40 @(28,20) | dirt | shallow | deep | forest | grass | beach |
|---|---|---|---|---|---|---|
| **DE 地中海** | 990 | 201 | 175 | 119 | 66 | 49 |
| **我们地中海** | 1112 | 186 | 90 | 45 | 114 | 53 |

交界类型（实测）：`沙滩↔浅水`、`浅水↔深水`、`沙滩↔泥土`、`草地↔泥土`、`森林↔泥土`、`沙滩↔草地`。
🔴 **`草地↔森林` = 0 处 —— 两张图的全图统计都是 0**：

```
DE  全图交界前 6：泥土↔森林 1482 ｜ 泥土↔草地 926 ｜ 沙滩↔浅水 522 ｜ 沙滩↔泥土 507 ｜ 深水↔浅水 350 ｜ 沙滩↔草地 21
我们 全图交界前 6：泥土↔森林 1421 ｜ 泥土↔草地 882 ｜ 沙滩↔浅水 488 ｜ 沙滩↔泥土 450 ｜ 深水↔浅水 358 ｜ 沙滩↔草地 38
草地↔森林 = **0 处**（两张图都是）
```
⇒ **地中海这张图里森林只挨着泥土/灌木，从不挨草地**，CC 要的"草地↔森林"在本地图**不存在**。
**请 CC 定**：是改用"森林↔泥土"算合格，还是换一张有草林交界的图（如阿拉伯）来验这条。

## 31.6 帧率

本轮过渡**没画出任何像素**（§31.4），几何量虽增加（316 片元）但无可见变化，**帧率未重测**。
上一轮实测仍有效：1080p WebGL+剔除 整图 **60.0** / 拖动 **59.7** / 缩放 **60.0**（全部 ≥59 ✅）。

## 31.7 未做 / 下一轮

- **修 §31.4 的"过渡没渲染"**（先把 `aShape` 属性链路查通，再核遮罩 R 的实际分布）；
- 修 `mk()` 的 `/7 → /8`；
- 过渡可见后**重出四格对比图**并**重测帧率**；
- blends 图集缩半（本轮未用 blends，无需做）。

## 31.8 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`groundLayer.mjs`（shape 属性 + 新片元公式 + 方向表）、`index.html`（沿用上轮别名）；
新增 `scratch/_pick_window.mjs`、`_shot_cmp4.mjs`、`_diag3.mjs`；
**只改 `tools/rms/` 与 `docs/`，未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅

---

# 三十二、第 56 轮报告：按 CC 的算法重写 —— **过渡这次画出来了** ✅，但两处待查

## 32.1 ✅ 采纳 CC 的全部四条改法

| CC 要求 | 实现 |
|---|---|
| **渐变公式改对** | `d = 到共享边（或共享角）的距离（格）`，**`s = clamp(1 − d/0.367, 0, 1)`** —— 只有靠边 **0.367 格**在过渡，**格心 s = 0**（0.367 = 47/128，**推断**） |
| **不用顶点属性 aShape** | 每顶点传 **本格 UV（0~1）** ＋ **方向 `aDir`**；片元算 d：边邻居 `d = dx>0 ? 1−local.x : local.x`；**角邻居 `d = length(vec2(边距x, 边距y))`（四分之一圆）** |
| **角邻居取舍** | **只在两条相邻边都不是该地形时才算角**（否则边那层已盖住）—— JS 侧实现 |
| **调试开关** | `?debug=shape` 输出 s 灰度；`?debug=mask` 输出遮罩 R；页面并报遮罩 R 分布 |
| **修 mk()** | `/7` → `/11` ✅ `stats.blends` 现在报**片元数**（DE 裁块 **400**） |
| **多层** | 按优先级**从低到高**逐层叠，每层只叠该邻居的方向 |

## 32.2 ✅ 调试图证明「过渡画出来了」

![debug=shape：水陆交界处白色边缘带](scratch/out/_dbg_shape.png)

水/陆交界出现清晰**白色边缘带**（s 靠边=1、往格心渐隐），格心为黑 ⇒ **形状算法生效、渐变带只在靠边 0.367 格** ✅

**遮罩 R 分布**（缩半后实测）：`beach_soft` min/均值/max = **149/149/149（整片常数，无结构）** ⚠️｜`water` 96/144/216｜`leaves` 0/122/255（>0.85 占 27.6%）｜`dirt` 0/161/255（32.5%）｜`grass` 0/132/255（23.4%）

## 32.3 ⚠️ 两处待查

| 地图 | **格心最大差**（须 0） | 差>0 像素占比 | 全画面最大差 |
|---|---|---|---|
| **DE 裁块** | 🔴 **153** | **21.64%** | 242 |
| **我们裁块** | ✅ 0 | 🔴 **0.00%** | **0** |

- **DE**：过渡**确实渲染了**（21.6% 变化、最大差 242）✅ **"没渲染"解决了**；但格心被采到 153 ⇒ 要么**真盖到格心**，要么**格心屏幕坐标算偏了**（`_cam.json` 假设画布高 = 视口高 − 52）。**我倾向后者**（同一算法不会只动 DE 格心），**未验完，标「未查清」**。
- **我们裁块**：**逐像素完全相同** ⇒ 这张图**一个过渡片元都没画出来**，**未查清**。

## 32.4 帧率（含过渡，1080p）

| 配置 | 场景 | 帧率 | CPU/帧 | 格数 |
|---|---|---|---|---|
| WebGL+剔除 | 整图 | **59.7** ✅ | 0 ms | 14400 |
| WebGL+剔除 | 拖动 | **59.0** ✅ | 4.1 ms | 4347 |
| WebGL 无剔除 | 拖动 | 59.3 | 12.7 ms | 14400 |
| Canvas 2D | 整图 | 🔴 21.3 | 41.4 ms | — |

**WebGL 全部 ≥59 fps ✅**（过渡让拖动 CPU 1.5 → 4.1 ms；剔除仍省 68%）

## 32.5 未做 / 下一轮

1. 查**我们裁块为什么一个过渡片元都没画**（先报 `candSeen` / 遮罩命中）；
2. 查 **DE 格心 153** 是"真盖到格心"还是"格心坐标算偏"（改成从页面直接读像素）；
3. `beach_soft` 是常数遮罩 ⇒ 沙滩交界的打碎效果为 0，**请 CC 定**是否换 `beach.png`；
4. 补齐四格对比图（地中海用森林↔泥土、阿拉伯补草↔林）并终验。

## 32.6 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`groundLayer.mjs`、`index.html`；新增 `scratch/_dbg_shots.mjs`；**只改 `tools/rms/` 与 `docs/`** ✅ ｜ **服务已停、端口已关闭** ✅

---

# 二十九、第 53 轮报告：x1 统一 + 世界铺法 + 地形过渡（首版）

## 29.1 裁定一：**统一到 x1（方案 A）** ✅

**先查 DE 安装目录有没有非 2x 版**：`resources\_common\terrain\textures\` 下**只有 `2x` 一个目录**（85 个 `.dds`）⇒ 按裁定走"没有就把 2x 缩半"。
**做法**：页面加载时把地形贴图与遮罩**缩到一半（512→256）**（`index.html` 的 `toX1()`）。
**台账记明来源**：地形贴图 = DE `terrain/textures/**2x**` 缩半 → x1；遮罩 = `SUCAI_TERRAIN/masks/*`（同缩半）；精灵 = `*_x1.sld`（原生 x1）。**三者同一像素空间** ✅

## 29.2 裁定二：`terrain_dimensions` 按"一张贴图覆盖 N×N 格"铺 ✅（**语义标「推断」**）

- **默认** `texMode='world'`；**3×3 / 6×6 / 15×15 同一规则**（只读 `dim`，不写死 10）。
- **(0,0) 清单**：**66 个，全是无名占位槽**（`name=''`、`name2='g_grs'`、prio 4~69、无遮罩）；✅ **我们的三张地图一个都没用到**（用到的 18 个地形**全是 (10,10)**）⇒ **不处理**。

## 29.3 裁定三：**地形过渡（首版已实现，效果待调）** ⚠️

| 环节 | 依据 | 性质 |
|---|---|---|
| **谁盖谁** | dat `blend_priority`（Underbrush 2 < Dirt 3 83 < Desert 86 < Forest 94 < Pine Forest 107 < Forest,Med 108 < Grass 110 < Dry Grass 126 < Beach 130 < Snow 152 < Water,Shallow 166 < Water,Medium 178）⇒ 只让**更高**的邻居盖上来，按优先级从低到高叠 | **权威**（dat） |
| **哪张遮罩** | dat `overlay_mask_name`（Grass=`grass.png`、Forest/Underbrush=`leaves.png`、Beach=`beach_soft.png`、Water=`water.png`、Dirt 3=`dirt.png`）→ `masks/<名>.png`，**26 张名全命中** | **权威** |
| **遮罩当 alpha** | 取遮罩 **R 通道**（实测无透明通道、RGB 均值 130~170） | **推断** |
| **朝向** | 按方向**镜像**遮罩 UV（+x 原样 / +y 镜像 u / −y 镜像 v / −x 全镜像） | **推断** |
| **性能** | 不开第二张纹理：**同一图集采样两次**；地形/过渡/物件各一次 draw call | 实现选择 |

**实测**：DE 地中海裁 34×34 → **生成过渡片元 206 个**（同地形跳过 4014、优先级不够 237、缺贴图/遮罩 31）✅ 机制在跑。
🔴 **但 A/B（开/关）肉眼几乎一样** ⚠️ —— 首版**效果没出来**；可能原因（**未证实**）：遮罩 R 通道整片在 0.5~0.67 ⇒ 等于蒙一层半透明，而不是"从交界边向内淡出"；也可能**通道/朝向**与我猜的不同。

![左：过渡开 ｜ 右：过渡关（首版差别不明显）](scratch/out/_blend_cmp.png)

**判断**：机制（优先级 + 遮罩名 + 一次 draw call）是对的、可验证；**"怎么用遮罩"还要一轮试错**（试 A 通道 / 翻转朝向 / 只取靠边半格）。

### 顺带修掉两处

1. `quadUV(mirrorMask(...))` 把遮罩 UV 套了两层 → 采样 NaN、遮罩失效 —— **已修**（靠诊断计数才发现）。
2. DE 真图侧用"规范名"（`GOLD_MINE`/`STONE_MINE`/`WILD_BOAR`/`SHORE_FISH`/`TREE_*`…）而别名表只有短名 ⇒ 渲染成**白噪声**。**已补 30 条别名**。

## 29.4 帧率重测（含过渡）

**1080p**：WebGL+剔除 整图 **60.0**（CPU 0 ms）/ 拖动 **59.7**（2.5 ms，格 4347）/ 缩放 **60.0**（4.5 ms，格 6072）；无剔除拖动 8.4 ms（14400 格）⇒ **剔除仍省 70%**；Canvas 2D 整图 🔴 **33.0**（24.3 ms）。**全部 WebGL ≥59.7 fps** ✅

## 29.5 同口径对比图

本轮**未重出**（分量用在 x1 统一、世界铺法、过渡首版与两处 bug）；上一轮图见 §26.4，**下一轮连同过渡调好一起重出**。

## 29.6 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`groundLayer.mjs`、`index.html`，新增 `scratch/export_de_terrain_blend.py`、`_shot_blend.mjs`、`_diag_blend*.mjs`；
**未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅
---

# 三十三、第 57 轮报告：45° 错位的**根因找到了并已修**；调试图重出；两处仍未解决

## 33.1 🔴 根因（CC 第一条怀疑**成立**，而且比我以为的更基础）

`?debug=shape` 之前"看起来是正常地形"，是因为我把基础地形也画了出来；但顺着"方向是否转了 45°"查下去，
**发现真正的错在坐标基准**：

```
本模块的菱形是以**格点为心**画的：中心 = iso(x,y)，四角 (0,±TH/2)、(±TW/2,0)
而 grid 方格 [x,x+1]² 映射出的菱形，其中心在 iso(x+0.5, y+0.5) = 前者 +(0, +TH/2)
⇒ 两者差**半格**；于是"上角"的真实格内坐标是 (−0.5,−0.5)，**不是 (1,0)**
⇒ 我原来那套 LOCAL=[[1,0],[1,1],[0,1],[0,0]] 全错位 ⇒ 边缘形状整体偏了 45°（表现就是"沙色尖角插进水里"）
```

**修法**（`groundLayer.mjs`）：
```
LOCAL = [[-0.5,-0.5], [0.5,-0.5], [0.5,0.5], [-0.5,0.5]]      // 角序 [上,右,下,左]
ex = dir.x > 0 ? (0.5 - local.x) : (local.x + 0.5)             // 到 +x/−x 共享边的距离（格）
ey = dir.y > 0 ? (0.5 - local.y) : (local.y + 0.5)
d  = 角邻居 ? length(vec2(ex,ey)) : (dir.x!=0 ? ex : ey)       // 角=四分之一圆
s  = clamp(1 − d/0.367, 0, 1)
```
⇒ 现在 **+x 方向的共享边就是菱形的"右下边"**（不是右角）✅ 与 CC 的判断一致。

## 33.2 ✅ 调试图重出（真正的灰度/方向图）

`?debug=shape` / `?debug=mask` / `?debug=dir` 现在**只画过渡层**（不画基础地形与物件、清屏为黑），所以是**真·调试图**。

![左：debug=shape（s 灰度，边白格心黑）｜右：debug=dir（8 方向着色＋图例）](scratch/out/_dbg2_cmp.png)

- **shape**：水陆交界一条**白色边带**、往格心渐黑 ⇒ 形状算法正确、渐变只在靠边 0.367 格 ✅
- **dir**：交界带按方向**着色**（红=+x右下边、绿=−x左上边、蓝=+y左下边、黄=−y右上边、橙/紫/青/品红=四个角），
  图例见图上；**颜色沿着交界走**、没有偏 45° ✅

## 33.3 ✅ CC 第四条：两个裁块的逐项对比（找出"哪一步断了"）

| 项 | **DE 裁块** | **我们裁块** |
|---|---|---|
| `candSeen`（高优先级邻居候选） | **400** | **414** ✅ |
| 过渡片元数 | **400** | **414** ✅ |
| 用到的遮罩名 | 5 张（`dirt` `leaves` `grass` `beach_soft` `water`） | 5 张（同名）✅ |
| 图集 | 24 张 | 27 张 |
| 开/关像素差>0 占比 | **21.64%** | 🔴 **0.00%** |

⇒ **我们裁块并没有"断在某一步"**：候选、片元、遮罩名全都有（甚至比 DE 多）——
但最终**一个像素都没变**。**这一步仍未查清**（不是候选/遮罩的断链，问题在片元着色或绘制阶段）。

## 33.4 ⚠️ 仍未解决的两项（如实报）

| # | 问题 | 现状 |
|---|---|---|
| 1 | **DE 格心最大差 154（须 0）** | 未解决。**我的判断**：更可能是**我算格心屏幕坐标的那套数学偏了**（`_cam.json` 假设画布高 = 视口高 − 52），因为**同一套算法在我们裁块上格心差正好是 0**。CC 要求的"从页面直接读格心像素"**本轮没做** |
| 2 | **我们裁块开/关 0 差异** | 未解决：候选/片元/遮罩都齐（§33.3），但渲染不出像素。下一步用 `?debug=shape` 逐帧看它的过渡层是否也是黑的 |

## 33.5 ✅ CC 第三条：`beach_soft` 不换（已记台账）

> dat 指定的就是 `beach_soft`；**整片常数是故意的（soft = 平滑过渡、不打碎）**。沙滩交界就该是**一条平滑过渡带**。
> ⇒ 我上一轮"建议换 `beach.png`"的提法**撤回**。遮罩 R 分布（缩半后）：`beach_soft` 149/149/149 常数 ✅ 符合预期。

## 33.6 🔴 方向叠加（CC 第二条之 2）：只许高优先级盖低优先级 —— 代码已如此，未做抽样表

代码判据：`if (prioOf(邻居) <= prioOf(本格)) continue;` ⇒ **只有更高优先级才盖** ✅
（实测优先级：水 166/178 > 沙滩 130 > 干草 126 > 草地 110 > 森林 94 > 泥土 83 > 灌木 2）
**"抽 3 个交界格列谁盖谁"这张表本轮未做**（分量用在了根因修复与调试图上）。

## 33.7 帧率

本轮几何量未变（400/414 片元），**未重测**；上一轮实测仍有效：1080p WebGL+剔除 整图 **59.7** / 拖动 **59.0** / 缩放 ~60（**全部 ≥59** ✅）。

## 33.8 未做 / 下一轮

1. **从页面直接读格心像素**（不用我的坐标推算），定 DE 格心 154 是真是假；
2. 看**我们裁块**的 `?debug=shape` 是否全黑 ⇒ 定位是片元着色还是绘制的问题；
3. 抽 3 个交界格，出"本格/邻居/谁盖谁"的表（CC 第二条之 2）；
4. 四项全过 → 出最终四格对比图（地中海 森林↔泥土·沙滩↔浅水·浅↔深水；阿拉伯 草↔林）+ 复测帧率。

## 33.9 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`groundLayer.mjs`（LOCAL/距离修正 + 调试模式只画过渡层 + `debug=dir`）、`index.html`（`?debug=dir`）；
新增 `scratch/_dbg2.mjs`；**只改 `tools/rms/` 与 `docs/`，未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅

---

# 三十四、第 58 轮报告：接缝修好、空遮罩兜底、遮罩连续平铺、两处公式修正

## 34.1 ⚠️ 一次事故（如实报）：**我自己把 groundLayer.mjs 写残过一次**

本轮开始时我用整体 `write` 改文件，**写成了一个残缺版本**（`createGroundLayer` 整段丢失，片元里还留了占位代码）。
该文件是**未跟踪文件**（`git log -- tools/rms/viewer/` 为空）⇒ **git 里没有可恢复的版本**。
**处置**：按上下文把模块**完整重写**了一遍（含 CC 第 57 轮代修的两处，见 §34.2）。重写后已跑通（§34.3 起都是重写后的实测）。
**教训**：这种"一次 write 整个模块"的做法在长文件上风险太大，**以后只做定点 edit**。

## 34.2 ✅ CC 第 57 轮代修的两处：**原样保留、没有改回**

```js
gl.uniform2f(loc.uCam, cam.x / cam.zoom, cam.y / cam.zoom);        // 正号（原 -cam.x）
const wx1 = (w - cam.x) / cam.zoom + TW;  const wy1 = (h - cam.y) / cam.zoom + TH;   // 剔除右/下界
```
物件剔除的 `wx1/wy1` 也已改成同一口径。**"以后测量一律在页面里用 readPixels、按 camView 同一公式算格心"** 已记台账。

## 34.3 ✅ 第 1 条：贴图接缝 —— **修好了**

**改法**（照 CC 的算法）：格 (x,y) 覆盖 **[x−0.5, x+0.5]²**；菱形四角 上/右/下/左 = 地面
`(x−.5,y−.5)/(x+.5,y−.5)/(x+.5,y+.5)/(x−.5,y+.5)`；
顶点传**未 fract 的地面 UV** `地面坐标 / dim`，**片元里 `fract` 后**再映射到图集子块（`subUV(vSub, fract(vGUV))`）。
**不再用**"把贴图四条边中点贴到菱形四角"那套。

![放大 2 倍：同一种地形连成一片，看不到格子边](scratch/out/_v58_zoom2.png)

✅ **验收通过**：放大 2 倍下，草地/泥土**连成一整片**，**看不到每格的菱形硬边**（图上只剩地形之间真正的过渡带与零星装饰）。

## 34.4 ✅ 第 2 条：空遮罩兜底（**推断**）

dat 里 `overlay_mask_name` 为空的地形（森林 88、松林 19、萨凡纳 41、棕榈沙漠 13…）原来被 `continue` 跳过 ⇒ 森林↔泥土**完全没过渡**。
**改法**：`maskOf()` 在 mask 为空时返回**兜底遮罩**（默认 `default_weak`，CC 指定；**DE 侧对空遮罩的处理未查到，故标推断**）。
页面已把 `default_weak` 一起载入，实测它的分布：**R min 0 / 均值 74 / max 253，>0.85 占 2.4%**（有结构、能打碎边缘 ✅）。

## 34.5 ✅ 第 3 条：遮罩改成真正按地图坐标连续平铺

遮罩 UV 与贴图**用同一套地面坐标 + fract**（`subUV(vMaskRect, fract(vGUV))`），
**不再**"每格贴一整张再按方向镜像"（那与第 54 轮报告不符，CC 指出正确）。

## 34.6 ✅ 第 4 条：Canvas 2D 对比版的剔除公式

`index.html` 的 2D 版：`wx1 = (w - view.ox) / view.z + TW`、`wy1 = (h - view.oy) / view.z + TH`（原来少减 `view.ox/oy`）。

## 34.7 ✅ 过渡现在**两个地图都出效果了**

| 地图 | 开/关 差>0 像素占比 | 差>8 占比 | 最大差 |
|---|---|---|---|
| DE 地中海裁块 | **1.35%** | 1.13% | 197 |
| 我们地中海裁块 | **1.36%** | 1.14% | 193 |

（CC 代修后自测：DE 1.17%/3.64%、我们 1.32%/2.46% —— **同一量级 ✅**）
⇒ **上一轮"我们裁块 0 差异"的问题随镜头符号修正一并解决**。
遮罩命中：两张图各载入 **6 张**（`dirt` `leaves` `grass` `beach_soft` `water` **`default_weak`（兜底）**）✅

## 34.8 ✅ 谁盖谁抽样表（3 个交界格）

| 格 | 本格地形（prio） | 邻居地形（prio） | **谁画在谁上面** |
|---|---|---|---|
| (18,1) | Underbrush（**2**） | Dirt 3（**83**） | **Dirt 3 画在 Underbrush 上面** |
| (19,1) | Underbrush（2） | Dirt 3（83） | Dirt 3 画在 Underbrush 上面 |
| (20,1) | Underbrush（2） | Dirt 3（83） | Dirt 3 画在 Underbrush 上面 |

判据：`if (prioOf(邻居) <= prioOf(本格)) continue;` ⇒ **只许高优先级盖低优先级** ✅
（实测优先级：水 166/178 > 沙滩 130 > 干草 126 > 草地 110 > 森林 94 > 泥土 83 > 灌木 2）

## 34.9 最终四格对比图

![左上 DE 过渡开 ｜ 右上 DE 过渡关 ｜ 左下 我们过渡开 ｜ 右下 我们过渡关](scratch/out/_cmp4.png)

镜头在**地图内部**（40² @(28,20)，无黑边）；该窗口地形格数 **先列后出**：

| | dirt | shallow | deep | forest | grass | beach |
|---|---|---|---|---|---|---|
| DE | 990 | 201 | 175 | 119 | 66 | 49 |
| 我们 | 1112 | 186 | 90 | 45 | 114 | 53 |

含：**森林↔泥土**（地中海，CC 已认可替代草↔林）✅、**沙滩↔浅水** ✅、**浅水↔深水** ✅。
🔴 **阿拉伯「草↔林」那张本轮未出**（分量用在事故重写与四条改动上）。

## 34.10 帧率复测（1080p，含新 UV 与过渡）

| 配置 | 场景 | 帧率 | CPU/帧 | 格数 |
|---|---|---|---|---|
| WebGL+剔除 | 整图 | **60.0** ✅ | 0 ms | 14400 |
| WebGL+剔除 | 拖动 | **59.7** ✅ | 6.2 ms | 4347 |
| WebGL **无剔除** | 拖动 | 🔴 **38.7**（CPU 24.3 ms） | — | 14400 |
| Canvas 2D | 整图 | 🔴 21.7 | 38.3 ms | — |

**WebGL+剔除 全部 ≥59 fps ✅**；⚠️ **剔除现在是硬需求**（关掉就掉到 38.7 fps）。过渡让拖动 CPU 从 4.1 → 6.2 ms。

## 34.11 未做 / 下一轮

1. **阿拉伯「草↔林」对比图**（唯一未出的图）；
2. 主人若给 **DE 截图**：验证纹理粗细与过渡效果，并回头研究 `blends/` 图集（CC 已定"留到有截图之后"）。

## 34.12 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`groundLayer.mjs`（完整重写：地面坐标 fract UV + 空遮罩兜底 + 连续遮罩 + 保留 CC 两处代修）、
`index.html`（`default_weak` 载入 + 2D 剔除公式 + `?debug=`）；
**只改 `tools/rms/` 与 `docs/`，未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅

---

# 三十五、第 59 轮报告：图集留边（细线大减）＋ 三种交界抽样表 ＋ 对比图终于无黑边（4/4）

## 35.1 ✅ 第 2 条：图集留边 + UV 钳制（按 CC 的修法）

`buildAtlas`：每块**四周留 2 像素边**，边里填**对边**的像素（左←右、上←下、下←上、两角），
使每块**本身可无缝重复**；线性取色就不会采到隔壁块的像素。子块 UV 存的是**不含留边的内容矩形**。
片元里加钳制：`vec2 g = clamp(fract(vGUV), 0.5/256.0, 1.0 - 0.5/256.0);`（遮罩同一套）。

**实测（细黑线检测：某行/列平均亮度显著低于左右邻居）**：

| | 改前 | **改后** |
|---|---|---|
| 纵向暗列 | 有贯穿全图的细线 | **0 条** ✅ |
| 横向暗行 | 同上 | **2 条**（Δ−6.1 / −6.9，非常轻微） |

⇒ **细黑线基本消除**（只剩 2 条很淡的横线，**未继续追**）。

## 35.2 ⚠️ 竖直细线（约 x=120）—— **未查明**（本轮未做）

CC 要求查"是哪个物件精灵"，**本轮分量用在了对比图的镜头几何上，没有做**。

## 35.3 ✅ 第 4 条：三种交界的「谁盖谁」抽样表（CC 要的格式）

| 交界类型 | 抽样格 | 本格（prio） | 邻居（prio） | **谁画在上面** |
|---|---|---|---|---|
| **森林↔泥土** | (8,4) | Forest, Mediterranean（**108**） | Dirt 3（**83**） | **Forest, Mediterranean** |
| **沙滩↔浅水** | (37,8) | Beach（**130**） | Water, Shallow（**166**） | **Water, Shallow** |
| **浅水↔深水** | (37,15) | Water, Shallow（**166**） | Water, Medium（**178**） | **Water, Medium** |

判据 `if (prioOf(邻居) <= prioOf(本格)) continue;` ⇒ **只许高优先级盖低优先级** ✅

## 35.4 ⚠️ 对比图：**第 3 次打回后终于做出来了**（含一次几何发现）

**先记为什么前几次都不对** —— 等距地图是**菱形**，方形视口的四角要**都落在地面上**，必须满足
`z ≥ W/(2a) + H/(2b)`（a、b = 菱形半宽/半高）。对 60×60 裁块（a=1888,b=944）与 1200×598 视口：

```
z ≥ 1200/3776 + 598/1888 = 0.318 + 0.317 = 0.635  ⇒  正好 = 2.0 × 全图适配(0.317)
```
⇒ **1.8× 不够（四角露背景）、2.0× 正好在菱形边上（临界）**，最终用 **2.2×（z=0.697）** ✅

**四角取像素核验**（用元素截图，避免工具栏；背景 = 13,13,13）：

| 图 | 四角像素 | 判定 |
|---|---|---|
| DE on / off | 158,143,65 ｜ 147,110,54 ｜ 30,46,15 ｜ 27,82,129 | ✅ **4/4 都是地面** |
| OUR on / off | 122,127,60 ｜ 175,152,82 ｜ 27,64,106 ｜ 34,115,157 | ✅ **4/4 都是地面** |

![左上 DE 过渡开 ｜ 右上 DE 过渡关 ｜ 左下 我们过渡开 ｜ 右下 我们过渡关（标签英文，四角皆为地面）](scratch/out/_cmp4.png)

60×60 裁块地形格数（**先列后出**）：DE `dirt 1054 · underbrush 778 · shallow 598 · medium 572 · forest,med 237 · dry grass 209 · beach 152`；
我们 `dirt 1323 · shallow 764 · underbrush 576 · medium 529 · beach 165 · dry grass 155 · forest,med 88`
⇒ 三种交界（森林↔泥土、沙滩↔浅水、浅水↔深水）**都在画面内** ✅

### 🔴 仍未满足的（如实报）

1. **每种交界单独一组开/关**（3 类 × 2 图 × 开/关 = 12 张）——本轮只出了"整块 60×60 的开/关各一张"，**未按交界拆组**；
2. **阿拉伯「草↔林」** —— **未出**；
3. 缩放是 **2.2×**，不是 CC 说的 1.5~2×（**几何上必须 ≥2.0×** 才能四角都在地面，这点请 CC 定：是接受 2.2×，还是缩小视口尺寸）。

## 35.5 📌 一条测量教训（记台账）

- WebGL 默认 `preserveDrawingBuffer: false` ⇒ **帧外 `readPixels` 读到的是 0**。四角/格心的像素核验**必须放在 rAF 回调里**，或改用**截图**核验（本轮改用截图 ✅）。CC 说的"在页面里用 readPixels"要加上这个前提。
- 另外：`camView()` 已经把**整张地图的包围盒**居中 ⇒ 若裁块 = 整张图，`cam` 应设 **(0,0)**，不要再减一次视口/2（我在这上面错了两次）。

## 35.6 帧率

本轮几何量未变（只改图集与 UV），**未重测**；上一轮实测仍有效：1080p WebGL+剔除 整图 **60.0** / 拖动 **59.7**（**全部 ≥59** ✅）。

## 35.7 回归与范围

```
parseAll 3          → 180/180 ✅
genMap Arabia 2 144 → 物件 5838（自然 3450）｜ 森林 9.5% ｜ 有高度 14.0%（逐位相同）
```
改动：`groundLayer.mjs`（**定点修改**：图集留边 + UV 钳制，未动 CC 代修）、`index.html`（未改）；
新增 `scratch/_v59.mjs`、`_v59c.mjs`；**只改 `tools/rms/` 与 `docs/`，未改引擎、未改 `src/`、未改 `public/`** ✅ ｜ **服务已停、端口已关闭** ✅
