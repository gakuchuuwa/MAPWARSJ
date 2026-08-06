<!-- 本文件为 AGENTS.md 外置细则（2026-08-07 拆分瘦身），内容与拆分前原文逐字一致；AGENTS.md 仅保留摘要与链接。 -->

## 十三、战斗立绘分配（三级规则 — 2026-06-21 定，AI 必读）

> **设计定案（2026-06-21 主人裁定 + 评审通过）**：三级规则 **无根本缺陷**，作为战斗立绘 **唯一方案** 长期有效。AI **不得**擅自改优先级、恢复 `portraits/`/`avg/`、或因审计/404 删改 `FactionGenerals` 占位路径。  
> **主人原话定案**：立绘按 **文化 → 政权夹 → 专属人物** 三级分配。  
> **单一实现**：`src/config/portrait_defaults.ts`（池 + `resolvePortraitAssetPath`）；将领表 `FactionGenerals.ts`；战斗 UI `CombatUI.setPortrait`。

### 13.1 三级优先级（从上到下，命中即停）

| 级 | 对象 | 规则 | 代码 / 数据 |
|---|---|---|---|
| **① 文化区** | **每个据点势力**（无专属政权夹、或无将的普通军团/守军） | 势力首都 `cities_v2.region` → 15 文化区之一 → 从该区 **文化夹随机池** 抽一张 | `REGION_PORTRAIT_POOLS`、`getFactionCultureRegion` |
| **② 政权专属夹** | **有独立素材夹的政权**（如秦→`qin/`、唐→`litang/`、武周→`wuzhou/`） | 从该 **政权夹** 随机抽；映射在 `FACTION_PORTRAIT_POOLS` | `FACTION_PORTRAIT_POOLS[factionId]` |
| **③ 专属人物** | **FactionGenerals 里的名将** | **先** 磁盘上该将 **专图**（`portrait` 路径）→ **无图则** 该将所属 **政权夹随机** → **再无则** 该势力 **文化区夹随机** | `getFactionGeneral` → `resolvePortraitAssetPath(general.portrait, { factionId })` |

**② 与 ① 的关系**：势力若在 `FACTION_PORTRAIT_POOLS` 有映射，**优先用政权夹**（② 覆盖 ①）；未映射的势力才纯走文化区池（①）。

**③ 与 ②① 的关系**：名将 **永远先试专图文件名**（如 `jinling_tandaoji.png`）；专图未补齐时 **不得** 跨区乱抽，只在 **本政权夹 → 本文化夹** 内随机兜底。

### 13.2 素材目录约定

| 类型 | 路径 | 说明 |
|---|---|---|
| 文化区池 | `public/assets/zhongyuan/`、`shuguo/`、`riben/` …（15 区对应夹） | 一夹 = 一文化；同夹内 **禁止 MD5 相同 PNG**（`npm run portrait:folder-audit`） |
| 政权专属 | `public/assets/qin/`、`litang/`、`wuzhou/` … | 仅 **有独立包** 的政权；在 `FACTION_PORTRAIT_POOLS` 登记 |
| 名将专图 | 同上政权夹或文化夹内，文件名 `{factionId}_{generalId}.png` 等 | `FactionGenerals.portrait` = **预留路径**；文件不存在时走 13.1③ fallback，**不删表项** |
| **废弃** | `portraits/`、`avg/portraits/`、`REGION_FIELD_PORTRAIT` | **禁止** 恢复或新建引用 |

### 13.3 运行时谁用哪一级

| 场景 | 行为 |
|---|---|
| 普通军团创建 | `getRandomFactionPortrait`：② 政权池 → ① 文化池 |
| 守军 / 无 portraitPath 单位 | `getCombatPortraitPath`：同上 |
| ≥4 万挂将军团 | `LegionManager` 设 `army.portraitPath = getFactionGeneral(...).portrait`（已 resolve） |
| 战斗 UI 显示 | `CombatUI.setPortrait`：场次自选 → 军团固定 path → generalId → 文化随机 |

**抽签一次跟定**：军团 `portraitPath` 在创建时定死，同军同脸；守军可每场随机（无 path 时走池）。

### 13.4 禁止（AI 常犯，务必记住）

- ❌ 用 `/assets/portraits/` 或 `avg/` 作战斗立绘源  
- ❌ 专图缺失时删 `FactionGenerals` 条目或改绑无关势力夹  
- ❌ 无政权夹、无文化依据时 **胡编** 跨区路径「凑绿审计」  
- ❌ 把「620 张专图未补齐」当 bug——表内路径是 **占位**，补图后自动生效  
- ❌ 名将 fallback 直接抽到中原/全库（除非本文化夹也空，代码层最后兜底）

### 13.5 维护命令

```bash
npm run portrait:folder-audit   # 同夹重复 PNG
npm run portrait:folder-dedupe  # 同夹去重（主人确认后）
```

### 13.6 立绘夹跟人物文化走（2026-06-29 定，AI 必读）

| 原则 | 说明 |
|---|---|
| **立绘夹 = 人物族群文化** | `FactionGenerals.portrait` 路径中的文件夹须匹配 **将领本人的民族/文化归属**，**不跟据点所在 RegionType** |
| 例 | 斛律光（敕勒人）据点轵关在 CENTRAL，立绘仍放 `STEPPE/` 夹 → 保证草原画风 |
| 反例 | ❌ 因据点 region='CENTRAL' 而把敕勒将领立绘挪到 CENTRAL 夹 → 会用汉人画风 |
| **FactionGenerals.portrait 是显式路径** | 直接命中，不经过三级分配的文化区兜底，不存在「夹不对就找不到」的问题 |

专图校正：游戏内 **F2**（居中/恢复，不自动缩放底对齐）；批量 `portrait-tuner`。

### 13.6 可选优化（非缺陷，主人需要时再改代码）

| 项 | 说明 | 现状 |
|---|---|---|
| 名将 fallback **稳定脸** | 专图缺失时，同一 `generalId` 每次 fallback 随机 → 直播可能「同将不同脸」；可改为按 id 哈希固定池内一张 | 军团 `portraitPath` 创建时抽签一次，同军已跟定；仅 **重复建军** 可能变脸 |
| 收紧最后兜底 | 名将 ideally 止步于本文化夹；代码在文化夹也空时仍会落中原/全库 | 极端空夹才触发，可后改 |
| 路径与池一致审计 | `FactionGenerals.portrait` 的目录宜与 `FACTION_PORTRAIT_POOLS` / 文化夹一致，减少 fallback 跳层 | 数据 hygiene，非玩法 bug |

**禁止**把上表当成「设计有问题要重做三级规则」——三级结构 **不动**，上表仅为锦上添花。

