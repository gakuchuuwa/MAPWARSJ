# 素材库总纲（怎么分类、怎么提取、现在缺什么）

> **主人原话（2026-09-12）**：「**你先把素材都整理好，看看还有什么素材没有提取的请提取，然后放到程序中，好好分类。**」
>
> 本文是**素材分类的唯一口径**：哪个库放什么、命名怎么起、图片几件套、怎么对账、怎么提取。

---

## 一、九个素材库（分类规则）

| 库 | 中文名 | 放什么 | 图片来源（实测） |
|---|---|---|---|
| `SUCAI` | 单位 · 武将 | 兵种、武将、攻城器、船、弹道（`PROJ_*`） | 逐动作：`<动作>_<方向>.png` + `.pc.png`（**无 preview.png**） |
| `SUCAI_ANIMAL` | 动物 | 野兽、家畜、鱼以外的活物 | 同单位（逐动作） |
| `SUCAI_RESOURCE` | 资源 | 鱼群、浆果丛、猎物尸体、渔网 | `preview.png` + `frames.png` + `_meta.json` |
| `SUCAI_NATURE` | 植被 · 自然 | 树、灌木、岩石、悬崖、矿脉、枯木 | 同上 |
| `SUCAI_BUILDING` | 建筑 | 16 套母体 × 4 时代的建筑、59 文明专属城堡/奇观、DE 场景建筑（`SCEN_*`） | 同上 |
| `SUCAI_BATTLEFIELD` | 战场遗存 | 军事残迹：拒马、路障、辎重车、骸骨、攻城器残骸、废墟 | 同上 |
| `SUCAI_SCEN` | 场景物件 | `s_*` 场景小件：双耳瓶、货摊、灯笼、长椅、水缸、武器架、井…… | 同上 |
| `SUCAI_TRADE` | 商船 · 贸易 | 商船、独木舟、舢板 | 同单位（逐动作） |
| `SUCAI_TERRAIN` | 地面 | 广场/泥石/碎石等地面贴片 | `*.png` 大图 |

**不属于素材库**：`SUCAI_BACKGROUND`（预览底图）、`SUCAI_FX`（特效帧，部分目录为空，按需扩）。

### 命名三铁律

1. **目录名一律大写**，词间用 `_`，与 DE 原名可对账（`b_asia_gate_stone_e_closed` → `ASIA_GATE_STONE_E_CLOSED`）。
2. **一个 DE 素材 = 一个目录**（逐动作的单位类除外：一个单位一个目录，动作在目录内的文件名里）。
3. **状态后缀沿用 DE**：`_DESTR`(受损) / `_RUBBLE`(废墟) / `_CLOSED` / `_OPEN` / `_CONSTR`(建造中) / `_D25/_D50/_D75`(25/50/75% 损)。

### 每个目录四件套

`preview.png`（封面，取动画第 0 帧）+ `frames.png`（全部帧横排）+ `frames.pc.png`（玩家色掩码）+ `_meta.json`
（`{name, frames, box_w, box_h, anchor_x, anchor_y, sld_source}`）。**单位类是逐动作多张**，另算。

---

## 二、DE 本体对账（实测，不是估）

工具：**`py scratch/audit_asset_coverage.py`**（只读）→ 明细 `scratch/out/asset_coverage.txt`。

对账口径（写死在脚本里，别凭感觉改）：

- DE 侧 = `…\AoE2DE\resources\_common\drs\graphics` 下全部 `.sld`（**7372** 个）。
- 项目侧 = `public/SUCAI*/*/` 目录名的**词段**（大写转小写、去 `SCEN_/MISC_/PROJ_/FISH_` 前缀）
  ＋ `_meta.json.sld_source` 里出现过的 DE 名。
- **命中判定两条**（缺一会大量误报，两个坑都踩过）：
  1. 目录词段在 DE 名里**连续出现**（`AMAZONARCHER` ⊂ `u_arc_amazonarcher_idleA`）；
  2. 目录名的词**全部**出现在 DE 名里、**不看顺序**（`BIRCH_GREEN` vs `n_tree_birch`、
     `BUSH_TREE_A` vs `n_tree_bush_a`、`SHORT_CLIFF_ALL` vs `n_short_all_cliff` 都是改名/换序）。
  ⚠️ 只能用**词集包含**，不能子串包含 —— 子串会让 `DUST` 撞上 `hindustanis`。

### 当前结果（2026-09-12）

```
DE 素材名 7372   已提取 4759   未提取 2613      （未提取里 1178 个是 u_ 单位逐动作）
```

| 家族 | 未提取 | sld 体积 | 处置 |
|---|---|---|---|
| `u_` 单位逐动作 | 1178 | **1722 MB** | ⏳ **未提取**，体积太大，等主人定夺 |
| `b_foundation_*` 地基/废墟态 | 52 | **122 MB** | ⏳ **未提取**，同上 |
| `b_<culture>_*` 各文化漏掉的建筑类型与状态 | ~800 | ~340 MB | ✅ **已提取**（本轮到 1120 个建筑） |
| `b_scen_*` 场景建筑（含 destruction/rubble/constr） | 128 | 83 MB | ✅ 已提取 |
| `s_*` 场景物件 | 177 | 18 MB | ✅ 已提取（新库 `SUCAI_SCEN`） |
| `b_misc_*` 骡车/渔网/地基 | 99 | 11 MB | ✅ 已提取 |
| `a_*` 动物/鱼/彩蛋 | 34 | 38 MB | ✅ 已提取 |
| `p_*` 弹道 | 44 | 2 MB | ✅ 已提取（`SUCAI/PROJ_*`） |
| `b_shp_flagship_*` 旗舰 | 4 | 12 MB | ✅ 已提取 |

> 合计本轮提取 **1341 个**，清单在 `scratch/out/extract_manifest.json`。

---

## 三、提取怎么做

工具：**`py scratch/extract_de_assets.py [--dry] [--lib 库名]`**

- `--dry` 只列计划（先看数量和落点，别盲跑）。
- 分类规则写死在脚本的 `classify()` 里，与本文 §一 一一对应。
- 复用既有 SLD 管线（`sld_extract.parse_sld` + `aoe2de_unit_convert.composite_frame`），
  **不新造美术、不改格式**；单目录最多 32 帧（`MAX_FRAMES`）防雪碧图过大。
- 两次跑挂掉的坑（已写进脚本注释）：**DE 名本身含 `_x1`，路径不能再拼一次 `_x1`**，
  否则 1341 个全 `FileNotFoundError`。

### 程序里怎么看

- **建筑鉴赏页**（`_citytest.html` 视图三）**只放建筑**：数据来自 `public/assets/de_buildings_catalog.json`
  （`node scratch/build_de_buildings_catalog.mjs` 生成），默认「全部状态」（完好/受损/摧毁/废墟全出）。
- 🔴 **[2026-09-16 主人「这里的建筑鉴赏，是显示所有建筑的」「不是建筑的[不要]在这里显示」
  「不要删除素材，只是不要在这里显示」]**：2026-09-12 曾把**其它 8 个库**（`asset_libraries_catalog.json`，
  818 条：`SUCAI` / `SUCAI_ANIMAL` / `SUCAI_BATTLEFIELD` / `SUCAI_FX` / `SUCAI_NATURE` /
  `SUCAI_RESOURCE` / `SUCAI_TERRAIN` / `SUCAI_TRADE`）合并进本页，**现已按指令从本页移除（只是不显示）**：
  - 图鉴：`load()` 不再 fetch `asset_libraries_catalog.json`；
  - 顶部的「📚 素材总览看板」：**整块从本页移除显示**（主人 2026-09-16：「这个不要这样显示，
    或者不要显示，有必要显示吗，这么占地方」—— 那张卡把 24 组、几十行目录名铺满一屏）。
    要看全量清单：`scratch/out/asset_inventory.md`（人看）或 `public/assets/asset_inventory.json`（数据）。
  - **素材本身一个都没删** —— 8 个库的目录、`asset_libraries_catalog.json`、`asset_inventory.json`
    里的对应条目全部原样保留（要恢复显示：`load()` 里重新 fetch 并 concat 那份清单、看板 DOM 与
    `renderInventoryBoard()` / `loadInventory()` 加回来即可，两处都在 `_citytest.html` 留了注释锚点）。
- **「全部风格 / 文明 / 其它前缀」下拉**（`#bldgPrefix`，2026-09-16 起带中文名）：
  它筛的是**目录名第一段**（`ASIA_ARCHERY_RANGE_AGE2` → `ASIA`），实测 **89 项 / 行数合计 2672**：
  16 套 DE 母体风格 + 50 个文明专属城堡码 + 3 个单时代共用/自建（`DARK`/`ARCHAIC`/`YURT`）
  + 19 个地标·城防·类型词 + 1 个空前缀（`_tmp_*` 临时素材，原来在下拉里只显示「(6)」）。
  中文名来源**全部是项目自有数据**：母体名 ← 图鉴 `de16Styles`；文明名 ← 本页 `CULTURE_MAP`
  （59 二层 + 2 三层自建）；地标专名 ← `src/data/WonderNames.ts`、`CityWonders.ts`、
  `cityWallShared.ts`、`Scene13WarLayer.ts`；少数没有中文专名的通用构件只用图鉴自带类别词。
  实现在 `_citytest.html` 的 `PREFIX_LANDMARK_CN` / `buildPrefixCn()` / `fillPrefixSelect()`，
  逐条写了出处；核对命令 `node scratch/dump_prefix_options.mjs`（真 Chrome 打印 89 项）。
- 🔴 **两套数字口径都要留着，但必须注明含义**（2026-09-16 主人定）：
  **59 = DE 可玩文明数**（看板五张卡片 + 图鉴副标题用它）；**64 / 61 = 图鉴物理目录数**
  （分组下拉、用途下拉用它）。实测构成：城堡 64 座 = 页面 59 文明 + 2 套三层自建分支用到的 61 座，
  另加滇黔 / 岭南 / 希腊母体通用 3 座；普鲁强化态与色雷斯单复数等 5 个变体目录**不重复计入**。
  奇观 61 座 = 60 座 `X_WONDER_*` 目录（覆盖 58 个文明名，不列颠与斯拉夫各多一座）+ 罗马斗兽场
  `SCEN_COLOSSEUM`。两处标签都要写清是「文明数」还是「物理目录数」，别再让人以为是同一个数。
- 🔴 **城堡素材的完整对账（2026-09-16 主人「希腊的是游戏本身的吗，先确保游戏本身的都解析了吗」）**：
  DE 侧 `resources\_common\drs\graphics` 里名字含 castle 的 `.sld` = **384 个**，逐条对账 **0 缺失**；
  DE 的城堡码 **61 个**，与项目**双向无差**（含 `THRACIANS` 单复数重复目录，收为变体不重复计数）。
  出处实测：**60 座来自 DE 本体**（`sld_source = b_*`），**4 座是项目自建**（`user_dianqian_castle` /
  `user_lingnan_castle` / `user_tibet_castle` / `user_western_castle`）。
  16 母体里 **15 个有自己的母体城堡**，唯一没有 `ANDE` —— **DE 本体就没有** `b_ande_castle_age3`，
  游戏侧写死 `ANDE → INCA_CASTLE_AGE3`（安第斯借印加堡），其 4 个分支各有专属城堡，**不是缺件**。
  重叠 **14 座**（母体码同时被某文明分支当专属城堡用），故 **16 + 61 − 14 = 63 码 → 62 座有目录 →
  + 滇黔 / 岭南 2 座自建 = 64 座**。
  🔴 **同次改动**：把本体素材 `GREEK_CASTLE_AGE3`（`b_greek_castle_age3`，DE 编年史希腊；
  `deCastleAssets.ts` 引用 7 次、映射大希腊/塞琉古/波奥蒂亚/伊庇鲁斯/多德卡尼斯/古希腊/斯基泰）
  **补进据点编辑页「专属城堡」下拉** —— 原来图鉴有、游戏在用，但页面选不到。
  该下拉实测由 61 项变 **62 项**（+ 1 个「自动对号入座」= 63 个 option）。未新增母体、未动 59 二级铁律。
  验收：`node scratch/verify_greek_castle.mjs`（真 Chrome：手选后险要卡真的插入并加载
  `/SUCAI_BUILDING/GREEK_CASTLE_AGE3/preview.png` 480×408）；逐座归属表 `py scratch/audit_castle_map.py`。
- 🔴 **「全部分组」下拉不许写死组名**（2026-09-16 主人「为什么看不到专属城堡」血训）：
  排序白名单原来写的是精确组名 `'文明专属城堡 (59座)'`，而图鉴里的实际组名是
  `'文明专属城堡 (64座)'`（构建脚本按物理目录数定名）→ 精确匹配失败，**城堡 187 条 + 奇观 61 条
  共 248 条整组从下拉里静默消失**（22 组 / 合计 2424）。现改为**按前缀匹配 + 末尾兜底追加**
  （任何没进白名单的分组一律排到最后），实测回到 **24 组 / 合计 2672 一条不漏**。
  验收断言已写进 `scratch/verify_bldg_all_buildings.mjs`（缺组 / 合计不符直接 exit 1）。
- 行结构两边一致（`prefix / building / age / groupLabel / usage / img / w / h / frames / kb`），
  所以同一套筛选器、同一个大图弹窗都能用（这也是当初能合并、现在能拆开的原因）。

### 相关脚本一览

| 脚本 | 作用 |
|---|---|
| `scratch/audit_asset_coverage.py` | **对账**：DE 有哪些、项目已提哪些、还缺哪些（只读） |
| `scratch/extract_de_assets.py` | **批量提取**未提取素材并按分类写进对应库 |
| `scratch/build_de_buildings_catalog.mjs` | 生成建筑图鉴（`SUCAI_BUILDING`） |
| `scratch/verify_bldg_all_buildings.mjs` | **建筑鉴赏页验收**（真 Chrome）：默认全状态/只放建筑/补回缺失/看板已移除/前缀下拉全中文 |
| `scratch/dump_prefix_options.mjs` | 打印前缀下拉 89 项（中文名逐条核对） |
| `scratch/build_asset_libraries_catalog.mjs` | 生成其余 8 库总目录 |
| `scratch/extract_battlefield_markers.py`、`extract_scen_flags.py`、`extract_yurts.py`… | 各专项提取（历史脚本，保留） |

---

## 四、还没做的（要主人一句话）

1. **`u_` 单位逐动作 1178 个 / 1722 MB** —— 提出来 SUCAI 会从 1.9 GB 涨到约 3.5 GB。
2. **`b_foundation_*` 52 个 / 122 MB** —— 建筑地基与废墟态（项目现在一个都没有）。
3. `SUCAI_FX` 里 **11 个空目录**（BLOOD 等只有目录没有图）—— 需要重新提或删，等确认。
