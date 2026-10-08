# RMS 引擎语义 · 给 CC 的地图生成规格

> **目的**：给 `tools/rms/` 的引擎（`rmsEngine.mjs`）补齐「指令到底是什么意思」。
> **每条都标出处 + 已证实/推断**。凡推断一律写明。
> **建立**：2026-10-09 ｜ 由 DD 整理（只做研究，未改 `src/`、`public/`、`tools/rms/`）

---

## 0. 三份资料，按可信度排序

| # | 出处 | 位置 | 可信度 |
|---|---|---|---|
| ① | **AoE2 官方《Random Map Scripting Guide》**（The Conquerors 时代，Ensemble Studios 著） | 本机 `AoE2DE\Docs\All\TC Random Map Scripting Guide.doc`；已转文本 `scratch/rms-doc/tc-rms-guide.md`（2317 段） | **最高**（官方）。⚠️ 是 2000 年版本，DE 新增项它没有 |
| ② | **racket `aoe2-rms` 包文档**（Erbenos / Miroslav Foltýn，基于社区 Zetnus 的 RMS resource 改写） | <https://docs.racket-lang.org/aoe2-rms/> ｜ 其源头 Zetnus 文档：<https://docs.google.com/document/d/1jnhZXoeL9mkRUJxcGlKnO98fIwFKStP_OBozpr0CHXo/edit> | 高（社区权威，**覆盖 DE 新增**，且标了 Game versions） |
| ③ | 本机 DE 脚本实测（`gamedata_x2`，277 文件） | 见 [RMS解释器-参考资料.md](RMS解释器-参考资料.md) | 高（但只能证明"怎么用"，不能证明"什么意思"） |

🔴 **一条避免踩坑的提醒**：Age of Empires 官方支持站那篇 [Random Map Scripting Commands](https://support.ageofempires.com/hc/en-us/articles/8478836252564-Random-Map-Scripting-Commands) **是 AoE3 的**（面包屑为 `Age of Empires III: Definitive Edition`，命令全是 `rmCreateArea`/`rmAddObjectDefItem` 这类 `rm*` 函数式 API）。**AoE2 是声明式（`create_land { … }`），两套语言无关**，不要用它。

---

## 1. 🔴 地图尺寸：三套数字，别混

同一个词在三处指三个不同的数 —— 这就是"界面 Tiny 是 144 还是 120"的分歧根源。

| 口径 | 出处 | TINY | SMALL | MEDIUM | LARGE | HUGE | GIGANTIC |
|---|---|---|---|---|---|---|---|
| **① 官方 TC（2000）** | `tc-rms-guide.md:44-52` | **72** | **96** | **120** | **144** | **200** | **255** |
| **② DE `EnlargeMap.inc`** | 本机 `gamedata_x2\EnlargeMap.inc:1-13` | **144** | 168 | 200 | 220 | 240 | 255 |
| **③ DE `includes/scaling.inc`** | 本机 `includes\scaling.inc:1-46` | **120** | 144 | 168 | 220(=`LARGE`) | 240 | 252(=`GIANT`) |

**关键区分（推断，但有强证据）**：
- **②`EnlargeMap.inc` 是"覆盖"用的** —— 它的指令是 **`override_map_size`**（"enlarge"＝放大），把档位**强制改写**成更大的边长；**它不是"界面档位定义表"**。
- **③`scaling.inc` 的 `MAPSIDE_*` 才是 RMS 侧尺寸档**，且 `MAPSIZE_TINY` 等旗标由**引擎按实际边长注入**。所以：
  - **界面 Tiny(144) 落在 `MAPSIDE_SMALL`(144)，不是 `MAPSIZE_TINY`(120)** —— 这是"错位一档"的来源。
- ⚠️ 官方表还给了 **Scaling factor**（`tiny 0.5 / small 0.9 / medium 1.4 / large 2.1 / huge 4.0 / gigantic 6.2`，基准 = 100×100），**这才是 `set_scale_by_size` / `set_scale_by_groups` 用的那个系数**（`tc-rms-guide.md:277,281` 明确点名 "base 100x100 map"）。

**结论（待实测确认）**：CC 印象里 "DE 现在 Tiny = 120" **对应 ③**；我说 "界面 Tiny = 144" **对应 ②**。**两者都不是凭空来的**。以导出结果为准（导出时读 `mm.map_size` 并记下界面选的档位）。

---

## 2. 生成顺序（官方原话）

> "A Random Map starts with **Land first, then Elevation, then Terrain, and finally Cliffs and Connections. The order is important.**" —— `tc-rms-guide.md:41`

> "**land is placed down before elevation, but terrain is placed down after elevation.** … **land is placed all at once. Terrain and objects are placed in order.**" —— `tc-rms-guide.md:236`

**两条对实现极关键的推论**：
1. **land 一次性铺完** → 不存在"边铺边看"的依赖；terrain/objects 则是**严格按脚本顺序**，**顺序错就看不到东西**（官方原话：先把棕榈沙漠铺在沙漠地形上、而沙漠地形还没铺 → "you aren't going to see any palm trees"）。
2. **terrain 在高程之后** → 所以 `height_limits` 能生效（地形按高度带铺）。

---

## 3. `create_land` 逐参数（官方 `tc-rms-guide.md:175-232`）

| 参数 | 官方语义 | 备注 |
|---|---|---|
| `terrain_type <常量>` | 这块陆地是什么地形 | **Player Lands 必须是 grass 或 desert**，否则"goofy results" |
| `land_percent <百分比>` | 这块陆地占地图的百分比 | **Player Lands 会被玩家数除**（60% ÷ 6 人 ≈ 每人 10%）；**官方建议 60–80%** |
| `number_of_tiles <格数>` | 另一种指定大小的方式 | 🔴 **不随地图尺寸缩放**（与 `land_percent` 相反）；**"必须只用 land_percent 或 number_of_tiles 之一"** |
| `base_size <格数>` | 陆地生长的**最小半径** | 不指定 → Player Lands **会又薄又蛇形** |
| `left/right/top/bottom_border <百分比>` | 距地图边多远停止生长 | 25 ≈ 只在地图中心 |
| `border_fuzziness <百分比>` | 每格停在边界的概率 | **不写就是直线**；5–20 才有地理感 |
| `zone <编号>` | **描述性**标签；同 id 可重叠，不同 id 是不同区域 | 不指定 → **每个玩家各自一座岛** |
| `land_id <编号>` | 给陆地区域打标 | 供 `place_on_specific_land_id` 用 |
| `set_zone_by_team` | 同队玩家同一 zone | |
| `set_zone_randomly` | 随机决定 zone | |
| **`other_zone_avoidance_distance <格数>`** | 🔴 **"This instruction is the one that specifies how large a land should be, so if it is not included, the land will not appear."** | **不含它，陆地就不出现** |
| `assign_to_player <玩家>` | 把陆地给某玩家 | **对 player lands 无效** |
| `clumping_factor <因子>` | **默认 8，范围 1–15**；低→蛇形岛，高→方形 | 🔴 **land 与 terrain 的范围/默认值不同** |

### 3.1 🔴 回到 `Arabia.rms:783-790` 那个"91% 沙漠"

```text
create_land
{
    terrain_type BASE_TERRAIN
    number_of_tiles 0
    base_size 0
    land_position 50 50
    land_id 420
}
```
- 它**既没写 `land_percent` 也没写有意义的 `number_of_tiles`**，官方规则说"必须只用其一" → **`0` 在 DE 里是"不限制/铺满"的约定**（与官方文档的 2000 版口径不同，属 DE 行为）。
- **它没写 `other_zone_avoidance_distance`** —— 按官方规则"不含它陆地就不出现"，但 DE 显然给了默认值。
- ⚠️ **所以这里必须实测反推**：`number_of_tiles 0` 到底是"铺满"还是"按 land_percent 兜底"，**用 DE 真图逐格验证**（这是 CC 修复的第一优先项）。

---

## 4. `create_terrain` 逐参数（官方 `tc-rms-guide.md:238-297`）

| 参数 | 官方语义 |
|---|---|
| `base_terrain <常量>` | **新地形铺在什么地形上**（例：棕榈沙漠铺在沙漠上） |
| `land_percent <百分比>` | **占"总陆地"的百分比**（不是总地图）；多种地形时**建议用 1–10** |
| `number_of_tiles <格数>` | 另一种方式；**百分比会随地图缩放，格数不会** |
| `number_of_clumps <团数>` | **总量被均分到各团**（3 团 18 格 → 每团 6 格） |
| `spacing_to_other_terrain_types <距离>` | 🔴 **包括同类型地形**的间距！用于防止"树连成一堵墙" |
| `set_scale_by_groups` | **按地图尺寸缩放团数**（基准 100×100；2 团 → Large 2×1.4、Gigantic 2×6.5） |
| `set_scale_by_size` | **按地图尺寸缩放团的大小**（10 格 → Large 140 格、Gigantic 650 格） |
| `set_avoid_player_start_areas` | **大多数地形（森林、水）默认就避开出生区**，这条用于让别的（如沙漠）也避开 |
| `clumping_factor <因子>` | 🔴 **默认 20**（land 是 8！）；低→蛇形，高→方形 |
| `height_limits <min> <max>` | **高度 0–8**（官方 TC 口径）；"可用来把草放在山顶、水只放洼地" |
| `set_flat_terrain_only` | 避开山丘（"防止池塘跨一个以上高程"） |

---

## 5. `create_object` 逐参数（官方 `tc-rms-guide.md:303-405`）

这是 CC 最缺的一段（"物件只有 8 个"）。

| 参数 | 官方语义 |
|---|---|
| `min/max_distance_to_players` | **相对"陆地块中心"**的距离；默认 **0 与 无穷**。⚠️ 配 `place_on_specific_land_id` 时，**距离指那块陆地的中心，不是玩家** |
| `number_of_objects <数>` | 🔴 **若没指定组，则每个物件自成一組**（＝全部散开） |
| `number_of_groups <数>` | **每组含 `number_of_objects` 个物件** |
| `group_variance <数>` | **组内物件数的加减波动**（3 只鹿 + variance 2 → 随机 1~5 只） |
| `group_placement_radius <格>` | 一组占多大地方；小半径把组收得更紧 |
| `set_loose_grouping` / `set_tight_grouping` | 松（羊/鹿，隔 1–2 格）／紧（金/石，无间隔） |
| `min_distance_group_placement <格>` | 分开**组中心**的距离；**若无组则作用于所有物件** |
| `temp_min_distance_group_placement <格>` | 临时间距（DE 新增，官方 TC 无此条）—— 推断：放置期约束，放下后可更近 |
| ⚠️ 覆盖关系 | **`group_placement_radius`、`set_loose_grouping`、`set_tight_grouping` 都会覆盖"散开"行为，把组保持在一起** |
| `set_scaling_to_map_size` | 缩放**组数**；⚠️ **`number_of_groups` 只适用于 Large Map**（6 组 → Medium 4、Small 2）。**若不用 groups，缩放作用于物件本身**（散鱼/树的正解） |
| `set_scaling_to_player_number` | 按玩家数缩放（与上面的地图缩放**互斥**） |
| `terrain_to_place_on <常量>` | 限制在某种地形上；不指定则"在地图上合理的地方" |
| `set_gaia_object_only` | 归 Gaia；⚠️ **对金/树等本来无归属的物件无效** |
| `set_place_for_every_player` | **每个玩家各放一组** |
| `place_on_specific_land_id <land id>` | **只放在指定 land_id 的陆地上** |
| `max_distance_to_other_zones <格>` | 离其他 zone 多近（防靠岸/防敌船） |

---

## 6. `create_elevation`（官方 `tc-rms-guide.md:407-424`）

- 🔴 **高度范围 1–7**（官方 TC）｜racket 文档说 DE 可到 **1–16**，但"接近 16 可能出异常行为（如 TC 弹道不同）"
- 🔴 **不是"放在指定高度"，而是"最多到指定高度"**：写 6 → 得到 1~6 的混合；写 7 → 1~7
- `base_terrain` / `number_of_clumps` / `number_of_tiles` / `set_scale_by_groups` / `set_scale_by_size` **与 terrain 同义**
- **高程总是避开玩家出生区**
- （racket 补充）DE 里若地形已被 land 的 `base_elevation` 抬高，**新山丘相对于那个高度**；pre-DE 是绝对值

---

## 7. 已验证的引擎「BUG」——要"完全一致"就得连 bug 一起复刻

来自 racket 文档（`create-connect-to-nonplayer-land`，标 **DE only**）：
> "**blocks all future connection generation**"；且在 `create-connect-teams-lands` 之后使用时，"**also blocks all team connection generation (except those involving player 1)**"。

---

## 8. 块的语义（racket 文档 `Blocks` 节）

> "For any block form, **attributes created within the body forms will become attributes of given block. Execution of the bodies is deferred to after the expansion of the block forms.**"

**对应我们实测的**：块可与 `create_*` **分离**（`{` 跟在 `endif` / `end_random` 之后，全语料 **691 处**），块归属**最近一条还没拿到块的 `create_*`**。
**对解释器的含义**：**先把块展开、再执行**；一条 `create_*` 可以吃多个块（`Loch Ness.rms:206-227`）。

---

## 9. 官方还给了两份"现成清单"（CC 可直接用）

| 内容 | 位置 |
|---|---|
| **地形名清单**（TERRAIN NAMES） | `tc-rms-guide.md:591-618` |
| **物件名清单**（Gaia / Scenario / 各兵营 / 城堡 / 船坞 / 英雄 / 攻城 / 马厩 / TC / 建筑） | `tc-rms-guide.md:619-973` |
| **一份带注释的完整示例脚本**（Annotated Random Map Script） | `tc-rms-guide.md:974+` |
| **Script writing tips**（资源、zone、出生区测试、散布物件、标准资源） | `tc-rms-guide.md:507-555` |

---

## 10. 仍是「未证实」的（不许猜）

1. DE 时代 `number_of_tiles 0` / `base_size 0` 的确切含义（官方 TC 无此写法）——**要靠 DE 真图反推**。
2. DE 里 `height_limits` 的上界到底是 8（官方 TC）还是 16（racket）。
3. 界面尺寸档 ↔ `override_map_size` ↔ `MAPSIZE_*` 三者的实际对应（**要靠导出实测**，见 §1）。
4. `percent_chance` 组和 ≠100 时是否归一化。
5. `$SpawnAvoidance` 等 5 个 `$变量` 的来源（脚本 0 处定义）。
6. `#include_drs <文件> <整数>` 的第二参数语义。
7. `includes/defend_wonder.inc` 被 58 处 include 但**整个 DE 目录树里不存在**（应静默跳过、当恒假）。
8. `set_loose grouping`(457 次) 与 `set_loose_grouping`(402 次) 是否等价。

---

## 11. 建议的修复顺序（对应 CC 现在的卡点）

| 优先级 | 修什么 | 依据 |
|---|---|---|
| **P0** | `create_land` 的 `number_of_tiles 0` → 按 DE 语义"铺满" | §3.1；这是"91% 沙漠"的直接根因 |
| **P0** | 块归属：`{` 可被 `if`/`start_random` 与 `create_*` 隔开（691 处） | §8 |
| **P1** | `create_object` 的 `number_of_objects` 无组时"每物件自成一組" | §5 |
| **P1** | `create_terrain` 的 `spacing_to_other_terrain_types` 要**包含同类型** | §4 |
| **P1** | `clumping_factor` 两套默认值（land **8** / terrain **20**） | §3、§4 |
| **P2** | `create_elevation` 的"**最多到**"语义 + 1–7 范围 | §6 |
| **P2** | `set_scale_by_size/groups` 用 **Scaling factor**（tiny 0.5 … gigantic 6.2，基准 100×100） | §1 |

---

## 12. 🔴 开源实现里的**真实算法**（genie-rms 源码精读）

> **出处**：[genie-js/genie-rms](https://github.com/genie-js/genie-rms)（GPL-3.0，JavaScript，Node + 浏览器）。
> 🔴 **可信度定位**：这是**目前唯一公开的、真正实现「脚本 → 地图」的项目**（`openage` 没有 RMS 执行器；`python-aoe2rms` 只能**写** RMS；`AoE2ScenarioParser` 只改场景文件）。
> ⚠️ **但它以 AoC 1.0c 为目标、作者自认 "probably inaccurate"，而且我读到的代码里有几处明显 bug**（见 §12.5）。
> **用法**：当**结构参考**（怎么组织生长、参数怎么参与），**不要当 DE 的数值权威**。

### 12.1 底层地形：`LandGenerator._applyBaseTerrain()`
```js
const { baseTerrain } = this.meta
for (...) this.map.get(x, y).terrain = baseTerrain     // 全场先铺 baseTerrain
```
→ **`<LAND_GENERATION>` 段级的 `base_terrain` 就是"先铺满全场的底色"**；`create_land` 再往上长。

### 12.2 陆地生长：`baseLandGenerate()`
```
1. 每块 land 先在 land.position 处铺一个 baseSize 半径的方块，searchMap = land.zone
2. 把方块四条外沿推入该 land 自己的栈（生长前沿）
3. 循环：各 land 轮流 pop 一个点
   - chance(x,y,land) > rng(100)      → 跳过   ← border_fuzziness 在这里生效
   - cost = checkTerrainAndZone(...)  → 0 就跳过
   - 铺地形、searchMap = land.zone
   - 四邻推栈，代价 = rng(100) - land.clumpiness * cost + 250
4. 填缝：弹出剩余节点，若左右（或上下）都被同 zone 夹住 → 补上地形
```

**`chance()` = 边界模糊度的实现**：
```js
if (!borderFuzziness) return 0                  // ← 不设 border_fuzziness 就是直线边
const chance = borderFuzziness * (horizDist + vertDist)
return chance >= 100 ? 101 : chance
```

**`checkTerrainAndZone()`**：中心 ±2 内统计同 zone 数（作为 cost）；**在 `land.area` 范围内发现别的 zone（>0）→ 直接返回 0**（不允许侵入别人的 land）；**越出地图边界反而 +1/+3 奖励**（倾向沿边生长）。

### 12.3 🔴 地形成团：`TerrainGenerator.generateTerrain()`

```js
const baseArea = Math.min(2, 2 * Math.sqrt(desc.tiles / desc.numberOfClumps))
// ① 放种子：每放一个，就从全局栈里 removeArea(x, y, baseArea) 挖掉周围 → 保证团与团不挨着
// ② 各团在自己的栈里长到 tiles 总数
//    推邻居的代价：cost + random.nextRange(100)，其中
function figChance (preference, x, y, clumping) {
  return 250 - clumping * preference     // preference = canPlaceTerrainOn() 的返回值
}
```
**`preference` = `canPlaceTerrainOn()`**：中心 ±2 内**同类型地形的数量 + 1**
（注意源码里那段求 score 的循环写错了：`Math.min(0, x + 2)` 应为 `Math.max(…)`，**导致 score 恒为 1、`clumping_factor` 实际失效** —— 这是 genie-rms 的 bug，别照抄）

**`spacing_to_other_terrain_types` = 方形邻域扫描**（不是距离场）：
```js
for (cy in [y-spacing, y+spacing]) for (cx in [x-spacing, x+spacing])
    if (tile.terrain !== desc.baseTerrain && tile.terrain !== desc.type) return 0   // 不允许
```
→ **只容忍 base 和自己**，出现任何第三种地形就否决。这就是"树不许连成墙"的实现。

**`checkBorders()`（`generate()` 末尾）**：
```
冰/雪 邻水 → 变 Ice Beach(37)
陆地 邻水 → 变 Beach(2)
```
🔴 **沙滩与冰滩是引擎后处理出来的，不是脚本铺的** —— 我们的引擎若不做这一步，海岸线就永远缺一圈沙滩。

### 12.4 物件放置：`ObjectsGenerator`

| 机制 | 源码实现 |
|---|---|
| **按地图缩放** | `numberOfGroups = sizeX * sizeY / 10000` ← **基准正是 100×100**，与官方 Scaling factor 呼应 |
| **按玩家缩放** | `numberOfGroups *= numPlayers`；最后 `floor()`，且 **`< 1` 时强制 1** |
| **候选点生成** | `generatePositions(pos, minD, maxD)`：取 `pos ± maxD` 内所有可用格，**再随机补 `diffX*diffY/4` 个点**（增随机性）。⚠️ **`minDistance` 参数没用**（源码 `TODO Correct implementation with min and max distance`） |
| **`min_distance_group_placement`** | `avoidPosition(positions, tile, margin)`：放下后**从候选栈里挖掉 margin 内的节点** |
| **`group_variance`** | `toPlace = max(1, rng(variance*2) + amount - variance)` ← 与官方"3 只鹿 ±2 → 1~5"**完全吻合** |
| **`set_loose_grouping`** | `placeLooseGroup`：在 `groupPlacementRadius` 内随机取点放 |
| **`set_tight_grouping`** | `placeTightGroup`：从一点**四邻扩张**（随机代价），放满为止 → **无间隙** |
| **`min_distance_to_players`** | `_tooClose()`：`distX < min && distY < min` —— 🔴 **方形（切比雪夫）判定，不是欧氏距离** |
| **`max_distance_to_other_zones`** | `_checkRestrictions()`：在**上/下/左/右 + 四角共 8 点**检查 zone 是否与中心一致 |

### 12.5 ⚠️ genie-rms 的已知 bug（照抄会踩）

1. `TerrainGenerator.canPlaceTerrainOn()` 的 score 循环：`Math.min(0, x + 2)` 应为 `Math.max` → **`clumping_factor` 在 terrain 上实际不生效**
2. 同函数里 `desc.flatOnly && tile.type !== 0` —— 应为 `tile.elevation`，**字段名写错**
3. `ObjectsGenerator.generatePositions()` 的 `minDistance` 参数**未使用**
4. `ConnectionGenerator.js` 只有 301 字节 → **连接完全没实现**
5. README 自述：陆地定位有 bug、**悬崖物件未实现**、高程"是否有用不清楚"、**文明加成不支持**

### 12.6 还没抓的（可按需再取）

`src/ElevationGenerator.js`(5.3K)、`src/CliffGenerator.js`(6.3K)、`src/Parser.js`(38K，**解析器可直接对照我们自己的**)、`src/ZoneMap.js`、`src/Map.js`、`src/Module.js`（`pushStack/popStack/removeStackNode/addStackNode` 这些基元）。
取法：`https://raw.githubusercontent.com/genie-js/genie-rms/master/src/<文件名>`

---

### 12.7 高程与悬崖（同样取自 genie-rms 源码）

**`ElevationGenerator.js`** —— 一个 `create_elevation` 块 = **一个等高平台**（不是阶梯）：
```js
// ① 先把全场 elevation 归 0
// ② findTiles(baseTerrain, baseElevation)：收集「地形=baseTerrain 且 elevation=baseElevation 且 modifier=0」的格
// ③ 放 numberOfClumps 个种子，直接 tile.elevation = height
// ④ 生长：只长在 tile.elevation === baseElevation 的格上；推邻居代价：
const chance = 250 - 15 * 1                       // ← 15 是硬编码
pushStack(clump, nx, ny, 0, this.random.nextRange(100) + chance)
```
🔴 **`15` 是硬编码**，因为 **`create_elevation` 没有 `clumping_factor` 参数**（官方列的属性里确实没有）。
🔴 **种子与生长都直接设成目标高度** → 一个块内部**等高**；官方"最多到 N 级"是靠**多个块层层叠加**实现的，不是单个块内部收敛。

**`CliffGenerator.js`** —— 悬崖在 **3×3 粗网格**上作业：
```
setupCliffMaps():
  width = sizeX/3, height = sizeY/3
  对每个 3×3 块：块内 9 格必须「全是 terrain 0 或 6」且「elevation 完全相同」→ 才算合格点
  块内有水(1/4/22) → invalidateArea(x,y,minDistanceToTerrain)
  searchMapRows[y][x] = curTerrainHeight + 1        ← 记「高度+1」
  再剔除孤立点（四邻皆为 0 的点）
generateCliff():
  size = minLength + rng(maxLength-minLength)；size < 3 直接放弃
  起点从 validCliffSites 弹
  方向游走：direction ∈ 0..3，按 curliness 随机转向
      r < curliness/2 → 左转；r < curliness → 右转
  每步 getValidSite(dir) 找「高度相同」的合格点，失败则试 dir±1（首步再试 dir-2）
  落笔：doTerrainBrushStroke(3x+1, 3y+1, 3nx+1, 3ny+1, 1, 16)
        doCliffBrushStroke (3x+1, 3y+1, 3nx+1, 3ny+1, 0, 0)
  然后 invalidateArea(node.x, node.y, minDistanceBetweenCliffs)
```
⚠️ 原作者自己在 `invalidateArea` 留了注释：*"It _SEEMS_ like src does this wrong?"* —— **他也是靠猜**。所以本节只当结构参考。

### 12.8 🔴 那些 `UNKNOWN_*` 到底是什么（解决"树看不到"）

`de-map-export.py:60-66` 的 `object_name()` 查不到时就输出 `UNKNOWN_{const}`。我用 genieutils 直接读 dat 反查，结果：

| 导出名 | dat 里的单位 | 关键属性 | 判断 |
|---|---|---|---|
| **`UNKNOWN_1902`**（de_map_1 里 1063 个） | **`PLACEHOLDER2`** | hp=0、`standing_graphic=(-1,-1)`（**无图**） | **林地占位物** —— 与 `tools/scene13-atlas/de-map.ts:66-69` 的注释 *"这张图 1063 个"* **数字完全吻合** |
| **`UNKNOWN_647`**（6793 个） | **`HRICH_D`** | hp=**−1**、无图 | `_D` 后缀 = **死亡单位/残骸占位**（具体指哪种残骸**未证实**） |
| `1305`（5 个） | **`VULTURE`** | graphic `Vulture (Fly)` | 飞禽装饰 |
| `96`（3 个） | **`HAWKX`** | graphic `Hawk (Fly)` | 飞禽装饰 |

**所以 `de_map_1` 里那"8 个物件"＝ 5 只秃鹫 + 3 只鹰**；**真正的树不在这份导出里**。

**树/草的真身（dat 里的 id）**：
`411 = FORTR`（graphic `Tree Oak`）｜`1348 = ITPINE`（Italian Pine）｜`1349 = OLIVE`｜`284 = TREETD`｜`349 = FOAK`｜`399~404 = TREEA~F`｜`1358 = 'Grass Green'`｜`1359 = 'Grass Dry'`
（另有 `59 = FORAG` 浆果丛、`66 = GOLDM` 金矿、`102 = STONM` 石矿、`83 = VMBAS` 男村民）

🔴 **对"森林地形自动长树"的含义**（官方 `tc-rms-guide.md:301` 原话：*"Note that some objects may already be placed by terrain. **Forests, for example, will be filled with tree objects.**"*）：
**森林地形上放的是 `PLACEHOLDER2` 这类占位物，树是引擎在渲染/结算阶段按地形替换出来的。**
→ 我们的引擎要"森林看起来像森林"，**要么在铺完森林地形后自动在每格放树**，**要么在渲染层把森林格画成树**。**不要指望脚本里 `create_object` 的树**。

同理 **`checkBorders()` 的沙滩/冰岸也是引擎后处理**（§12.3），两件事一起补。

### 12.9 还没抓的（按 CC 的优先级排序）

| 优先级 | 文件 | 取法 |
|---|---|---|
| 低（已能跑 179/180） | `src/Parser.js`(38K) —— 主要用来对"怪癖" | `https://raw.githubusercontent.com/genie-js/genie-rms/master/src/Parser.js` |
| 中 | `src/Module.js`、`src/StackNode.js` —— `pushStack/popStack/removeStackNode/randomizeStack` 这些基元 | 同名替换 |
| 中 | `src/ZoneMap.js`、`src/Map.js` —— zone 与地形清理（`cleanTerrain`/`cleanElevation`） | 同名替换 |
| ~~高~~ | ~~`LandGenerator.js` / `ObjectsGenerator.js` / `TerrainGenerator.js`~~ | **已抓，见 §12.2/12.3/12.4** |
| ~~高~~ | ~~`ElevationGenerator.js` / `CliffGenerator.js`~~ | **已抓，见 §12.7** |

---

_本文件只做研究；`tools/rms/` 的代码由 CC 自己改。_
