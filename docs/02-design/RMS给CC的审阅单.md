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
