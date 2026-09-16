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

- **建筑鉴赏页**（`_citytest.html` 视图三）数据来自 `public/assets/de_buildings_catalog.json`
  （`node scratch/build_de_buildings_catalog.mjs` 生成）。
- **其它 8 个库**数据来自 `public/assets/asset_libraries_catalog.json`
  （`node scratch/build_asset_libraries_catalog.mjs` 生成）→ 鉴赏页顶部「**素材库**」下拉按库分类浏览。
- 行结构两边一致（`prefix / building / age / groupLabel / usage / img / w / h / frames / kb`），
  所以同一套筛选器、同一个大图弹窗都能用。

### 相关脚本一览

| 脚本 | 作用 |
|---|---|
| `scratch/audit_asset_coverage.py` | **对账**：DE 有哪些、项目已提哪些、还缺哪些（只读） |
| `scratch/extract_de_assets.py` | **批量提取**未提取素材并按分类写进对应库 |
| `scratch/build_de_buildings_catalog.mjs` | 生成建筑图鉴（`SUCAI_BUILDING`） |
| `scratch/build_asset_libraries_catalog.mjs` | 生成其余 8 库总目录 |
| `scratch/extract_battlefield_markers.py`、`extract_scen_flags.py`、`extract_yurts.py`… | 各专项提取（历史脚本，保留） |

---

## 四、还没做的（要主人一句话）

1. **`u_` 单位逐动作 1178 个 / 1722 MB** —— 提出来 SUCAI 会从 1.9 GB 涨到约 3.5 GB。
2. **`b_foundation_*` 52 个 / 122 MB** —— 建筑地基与废墟态（项目现在一个都没有）。
3. `SUCAI_FX` 里 **11 个空目录**（BLOOD 等只有目录没有图）—— 需要重新提或删，等确认。
