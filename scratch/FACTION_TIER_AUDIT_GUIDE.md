# 势力级别 / 旗形 — 文件说明 & 给其他 AI 的审计指令

> 游戏内级别**运行时自动计算**，改 `SandboxDisplayNames.ts` 旗号后刷新即生效。  
> 审计目标是让势力**进入正确的类别**（民族/政权/家族/州郡/起义），而不是手改级别数字。

---

## 一、哪些文件管「级别 + 旗形」

| 文件 | 作用 |
|------|------|
| **`src/data/factionTierClassify.ts`** | **规则核心**：起义表、民族表、大政权表 + 读 4 份审计 JSON，算 1–6 级 |
| **`src/data/FactionTier.ts`** | 对外 API：`getFactionTier()`、`getFactionFlagTemplatePath()`（读旗号 + 调 classify） |
| **`src/data/SandboxDisplayNames.ts`** | 旗号汉字（1 字 / 2 字 → 影响 1/3/4/5 级） |
| **`src/assets/CityAssetManager.ts`** | 按级别选 S10QZ 底图 → 抠绿 + 染色 → 地图/军队显示 |
| **`scratch/ethnic_homeland_audit.json`** | 民族 → **2 级**（旗 43） |
| **`scratch/regime_capital_audit.json`** | 政权 → **1 级**（1 字旗）或 **3 级**（2 字旗） |
| **`scratch/family_state_audit.json`** | 家族 → **4/5 级**（按字数） |
| **`scratch/county_seat_audit.json`** | 州郡 → **4/5 级**（按字数） |
| **`scratch/faction_flag_template_by_tier.json`** | 快照（`npm run tier:export`），游戏不读 |
| **`scratch/faction_tier_pending_audit.json`** | **待审计清单**（321 个，见下） |

**旗形编号（当前）**

| 级 | 含义 | 旗形 |
|----|------|------|
| 1 | 1 字 · **正式国号**（仅秦汉唐级） | 7 |
| 2 | 民族（全部） | 43 |
| 3 | 2 字 · 政权 | 14 |
| 4 | 2 字 · 家族/州郡 | 46 |
| 5 | 1 字 · 家族/州郡 | 31 |
| 6 | 起义 | 22 |

**不管级别的（别混）**

- `panjun` 叛军：52 面随机旗 7–58，见 `CityAssetManager` + AGENTS.md §10.3  
- `HistoricalFactionColors.ts`：固定**颜色**，不是级别  
- `NavalShipTiers.ts`：船型，与势力旗无关  

---

## 二、判定顺序（`factionTierClassify.ts`）

```
6 起义（TIER6_UPRISING 表）
  ↓ 否
2 民族（TIER2_ETHNIC_SEED + ethnic_homeland_audit.json 全部）
  ↓ 否
4 或 5 家族（family_state_audit.json；按字数）
  ↓ 否
4 或 5 州郡（county_seat_audit.json；按字数）
  ↓ 否
1 或 3 政权（TIER1_REGIME_SEED + regime 审计；1字正式国号→1级，2字→3级）
  ↓ 否
4 或 5 默认（按旗号字数）
```

**family / county 优先于 regime** — 故意设计：防止 **苻、袁** 等姓氏误升 1 级。  
副作用：若误把 **汉、秦** 写进 family 表，会被压成 5 级。**一势力只进一张审计表。**

### 1 级单字国号锁定（定好勿改）

`TIER1_REGIME_SEED` 中 **旗号仅 1 字** 者（秦、汉、唐、魏、韩…）：

| 规则 | 说明 |
|------|------|
| **禁止** | 写入 ethnic / family / county 任一张审计表 |
| **运行时** | 必须为 **1 级**（旗形 7） |
| **校验** | `npm run tier:check` |
| **修改** | 仅项目主人裁定；AI 不得删改种子表或降级 |

二字国号（大明、大理、百济…）同属大政权种子，但运行时 **3 级**，不在此锁定。

### 1 级 vs 3 级 vs 5 级（极易混，必读）

| 旗号 | 性质 | 级别 | 反例 |
|------|------|------|------|
| **秦** | 史籍正式国号、单字 | **1** | — |
| **西秦** | 国号但 2 字 / 偏轨政权 | **3** | ❌ 不能进 1 级 |
| **苻** | **姓/氏**（前秦苻氏），不是国号「苻秦」 | **5**（家族） | ❌ 不能进 regime / 1 级 |
| **苻秦** | 后人俗称，非单列旗号 | — | 本项目无此旗号 |

**1 级铁律**：只有**无可争议的单字正式国号**（秦、汉、唐、魏…）才进 1 级。  
**姓、氏、郡名、偏轨/复合国号**（西秦、大顺…）→ 3 级（2 字政权）或 4/5 级（家族/州郡）或 6 级（起义）。

改旗号字数（如 九江→浔）会自动从 4 级变 5 级，**无需跑脚本**。

---

## 三、哪些势力「还没识别」

**共 321 个**：未出现在 4 份审计 JSON 里，也未在起义/民族/大政权种子表中。  
现暂按旗号字数扔进 **4 级（250）** 或 **5 级（130）**，史实类别**未核实**。

清单：

- 机器可读：`scratch/faction_tier_pending_audit.json`
- 表格：`scratch/faction_tier_pending_audit.md`

更新清单：

```bash
npm run tier:export
node scratch/export_faction_tier_pending.mjs
```

**已识别（约 194 个）**

| 来源 | 约数量 | 级别 |
|------|--------|------|
| 大政权种子 + regime 审计 | 25+45 | 1 / 3 |
| 民族种子 + ethnic 审计 | 48 | 2 |
| family 审计 | 50 | 4 / 5 |
| county 审计 | 15 | 4 / 5 |
| 起义表 | 17 | 6 |

---

## 四、复制给其他 AI 的指令

```
你是 MAPWARSJ 势力级别审计助手。先读 scratch/FACTION_TIER_AUDIT_GUIDE.md 和 AGENTS.md。

【禁止】
- git checkout / restore / reset
- 改据点坐标、胡编历史
- 手改 FactionTier.ts 里的级别数字（已废弃静态表，运行时计算）
- 动 panjun 叛军
- **改 / 删 TIER1 单字国号种子，或将其 id 写入 family/county/ethnic 审计**

【任务】
审计 scratch/faction_tier_pending_audit.json 的 pendingAudit（321 个）。
对每个条目填：
- auditCategory: 民族 | 政权 | 家族 | 州郡 | 起义 | null
- auditNote: 一句话史实依据

【写入方式（审计完成后）】
按类别追加到对应 scratch 审计 JSON（不是改 pending 文件就结束）：
- 民族 → scratch/ethnic_homeland_audit.json（priority:1, type:民族）
- 政权 → scratch/regime_capital_audit.json（priority:2, type:政权）
- 家族 → scratch/family_state_audit.json（priority:4）
- 州郡 → scratch/county_seat_audit.json（priority:3）
- 起义 → 在 src/data/factionTierClassify.ts 的 TIER6_UPRISING 加 id

【判定要点】
- 1 级：仅单字、史籍正式国号（秦汉唐），绝对正确才写 regime；姓/氏（苻、袁）→ family
- 3 级：2 字国号/割据国（西秦、百济、大顺…），含偏轨、复国、非主流通称
- 民族：民族渊源/部族 → 2 级（不论 1 字 2 字）
- 家族：名门姓氏大本营 → 4/5 级（看字数）；苻=苻氏，不是苻秦
- 州郡：郡治/州名旗号 → 4/5 级（看字数）
- 起义：农民军/短命 rebel → 6 级
- 依据不足 → auditCategory 留 null

【工作方式】
- 每次 20–50 条，按地理区或字母分批
- 只改 scratch/*_audit.json（及必要时 factionTierClassify.ts 起义表）
- 不要改 SandboxDisplayNames 除非项目主人要求改旗号
- 每批汇报：本批 id、各类数量、拿不准的条目

【验证】
npm run tier:check              # 1级锁定 + 跨表冲突（必须通过）
npm run tier:export              # 刷新 scratch/faction_flag_template_by_tier.json
node scratch/export_faction_tier_pending.mjs   # 刷新待审计清单
```

---

## 五、维护命令

```bash
npm run tier:check               # 1 级锁定 + 审计冲突（改审计后必跑）
npm run tier:export              # 刷新 scratch/faction_flag_template_by_tier.json
node scratch/export_faction_tier_pending.mjs   # 刷新待审计清单
```
