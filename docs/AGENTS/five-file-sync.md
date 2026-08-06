<!-- 本文件为 AGENTS.md 外置细则（2026-08-07 拆分瘦身），内容与拆分前原文逐字一致；AGENTS.md 仅保留摘要与链接。 -->

## 五、5 文件一致性

每新增 / 修改 / 删除 1 个势力，必须同步 5 处：

```
1. src/data/factions.ts                  → FACTIONS 数组
2. src/data/cities_v2.ts                 → CITIES_V2 数组
3. src/data/StartingCapitals.ts          → STARTING_CAPITALS 映射
4. src/assets/CityAssetManager.ts        → factionFlagMap（`src/core/CityAssetManager.ts` 为兼容 shim）
5. src/data/SandboxDisplayNames.ts       → SANDBOX_DISPLAY_NAMES
```

> **⚠️ 首都映射铁律（2026-06-29 补充，防 AI 踩坑）：**
> **凡是新建势力，必须在 `src/data/StartingCapitals.ts` 中写入首都映射（例如 `'taizhou': 'city_hailing',`）。**
> **核心原因：** 沙盒模式下，游戏引擎（`loadGameAppCityData`）强依赖 `STARTING_CAPITALS` 判断据点归属。如果新建势力没有在此登记，引擎找不到其立足之地，就会把该据点强制降格分配给 `'panjun'`（叛军）。叛军没有旗号文字，会导致该势力在地图上只显示空旗（背景板如 7-1.png）。
> **AI 犯错记录：** 曾漏写海陵城（taizhou）的首都映射，导致「泰」字大旗不显示，误判为 HMR 缓存问题。**此条红线绝对禁止再犯！手动改文件或用 FactionEditor 时，必须查验首都映射是否到位！**


**不要手动写 5 处。** 用 FactionEditor 批量模式：
- 新增 / 修改 → `/api/batch-import`
- 删除 → `/api/batch-delete`

两者都自动同步 5 文件，原子性写入（任一失败全部回滚）。

### 5.4 录入后验收（防丢项 — AI 必跑）

**batch-import 只写五文件**；以下须**另补**，最易漏 **EventParser**、**GeneralSkills**、**精锐区文件**。

| 步骤 | 文件 / 命令 | 说明 |
|------|-------------|------|
| 1 | FactionEditor `/api/batch-import` | 势力、据点、首都、旗号×2 |
| 2 | `EventParser.ts` | 与 cities_v2 **同 id** 城块同步（name/factionId/lat/lng/type/region） |
| 3 | `FactionGenerals.ts` | 要武将时；一势力一将 |
| 4 | `GeneralSkills.ts` `GENERAL_PROFILES` | **有将必写**；无档案则武将技不触发 |
<!-- 搁置 N+1：
| 3b | `FactionGeneralPools.ts` | **A/B 多将（N+1）**时：出征池、守城专将、显示名、立绘夹 |
-->
| 5 | `*ExpeditionLegions.ts` | 要精锐时；写进**正确 15 区**文件 |
| 6 | `cities_v2` 的 `region` + `note` | 文化区显式标注 + 史地备注 |
| 7 | 道路 | 主人 VectorRoadEditor 手画（**AI 禁止**改 VectorRoadData） |

**改完必跑**（硬缺口须为 0）：

```bash
npm run add:check -- <据点名>    # 单点验收清单
npm run faction:sync-audit
npm run expedition:triple-check   # 有精锐时
npm run city:spacing              # 新坐标时
npm run city:dossier              # 刷新 scratch/city_dossier.json
```

单点查询：`npm run city:lookup -- 龙门`。细则见 `.cursor/rules/add-entry-completeness.mdc` 与 §5.5 势力分级。

---

## 5.5 骨架优先与势力分级（2026-06-19 立）

**录入顺序铁律**：先定大中城，再铺民族/家族密度，最后投名将/精锐。**禁止**为小势力腾位而改动大中城的坐标、据点名或旗号。

### 录入阶梯（自上而下，缺了可以空，不许硬凑）

| 步骤 | 对象 | 数量 | 将领 | 精锐 | 说明 |
|------|------|------|------|------|------|
| **0** | **大城** (`big_city`) | ≥约40万人口 | 尽量有 | 优先 T0–T1 | §六 |
| **1** | **文化区中心** | **15** | 尽量有 | 建议有 | §七；`RegionSystem.REGION_CENTERS` |
| **2** | 中城 `medium_city` | ≥10万人口 | 可选 | 可选 | §6.1 |
| **3** | 小城 / pass / C 级势力 | 多数 | **可无** | **可无** | 地图热闹层；panjun 合法 |
| **4** | 名将 / 精锐 | 稀缺 | A/B 为主 | 全局不重复 | ；禁止为凑数迁点 |

文化区中心审计命令：

```bash
npm run skeleton:audit
```

输出 `scratch/skeleton_anchor_audit.json`。

### 势力 A / B / C 分级（录入门禁）

| 级别 | 典型 | 据点 | 将领 | 精锐 | AI 新增时 |
|------|------|------|------|------|-----------|
| **A** | 大城、国都、区中心 | 冻结 | **应有** | **应有**（A 优先 T0–T1） | 仅主人裁定可改旗/换将 |
| **B** | 中城、有名政权/州郡治 | 稳定 | 建议有 | 建议有（T1–T3） | 可增补，不得动 A 锚点 |
| **C** | 民族、小家族、州名、关隘 | 可增 | **可无** | **可无** | 默认批量模式；禁止借将/借精锐 |
| **D** | panjun / 待升格 | — | 无 | 无 | 仅审计清单驱动升格 |

**「统一」定义（对每个 A/B 锚点填一张定案表）**：

1. **据点名** — **冷兵器 · 约 17 世纪 / 至迟 18 世纪前**最知名城名旧称（一个点），全局不重复  
2. **坐标** — 史料锚定，原则上不改  
3. **旗号** — §4.1 最高可考一级；与据点名防重  
4. **势力全名** — `factions.ts`；军情/叙事用，≠旗号  
5. **将领** — 绑 `cityId`（四位一体：据点、势力、武将、精锐随城走）  
6. **精锐** — 绑 **首都 cityId**（番号随城）；与将领、旗号**不要求同代同族**  
7. **文化区** — `region` 字段与 `getCityRegion` 一致  

**禁止**：为 C 级家族/new 名将，改动 A/B 锚点的 `lat/lng`、据点名、或从锚点挤走已有旗号。

### 与「热闹 + 名将」的关系

- **热闹**靠第 3 步 **旗多、色多**（C 级可无将无精）  
- **名将**靠第 4 步 **向 A/B 集中投放**  
- **占不下** → 第二/第三首都（≥50 km）或暂不收录，**禁止**硬绑四件套  
