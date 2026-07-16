# 战斗逻辑报告 — 2026-07-16 终版

## 七层战力体系

| # | 层 | 生效条件 | 来源 |
|---|-----|---------|------|
| 1 | 运气 | 永远 | `fateLuck` 开局掷 0.6~1.4 |
| 2 | 技能效果 | 永远 | 六槽随机抽技，按 magnitude 结算 |
| 3 | 三势对齐 | 永远 | `APTITUDE_POWER_MULT` 3×3 表 |
| 4 | 攻防对齐 | 永远 | `ATTACK_STYLE_POWER_MULT` 3×2 表 |
| 5 | 文化 | 永远 | `CultureCombat` |
| 6 | 据点 | 永远 | 关隘/名城 |
| 7 | 精锐 | 永远 | `ELITE_TIER_MULT` T0~T4 |

---

## 层3：三势对齐（武将 aptitude × 兵力局势）

对角线对齐最强，对角线对面谷底，借势永居中游。

| | create 造势 | leverage 借势 | reverse 逆势 |
|--|-----------|-------------|------------|
| **优势** | **1.40** | 1.10 | 0.60 |
| **均势** | 1.00 | **1.20** | 1.00 |
| **劣势** | 0.60 | 1.10 | **1.40** |

> 代码：`getAptitudePowerMult` → `APTITUDE_POWER_MULT[apt][sit]`

---

## 层4：攻防对齐（武将 attackStyle × 位置）

| | 攻城 | 守城 |
|--|------|------|
| 擅攻 attack | **1.30** | 0.70 |
| 擅守 defense | 0.70 | **1.30** |
| 双行 balanced | 1.30 | 1.30 |

> 代码：`getAttackStylePowerMult` → `ATTACK_STYLE_POWER_MULT[style][攻/守]`

---

## 技能释放：六计随机

- 攻方从 `atkAdvantage / atkBalance / atkDisadvantage` 三槽等概率抽 1 技
- 守方从 `defAdvantage / defBalance / defDisadvantage` 三槽等概率抽 1 技
- 开局一次选定写入 `battleOverriddenSkillId`，全场不变
- 攻守双方技六类相同时，守方重抽（最多 5 次）

> 代码：`resolveSituationalSkillId` → 随机抽 + 六类判重

---

## 数值变迁

| 旧系统 | 新系统 |
|--------|--------|
| 8 层独立乘区，含惩罚（0.60/0.70） | 7 层，无惩罚，不对齐有自己的值 |
| 三势 + 六计对势 ×1.15 两层叠 | 合为一张 3×3 表 |
| `situationSkillMatch` 独立乘 ×1.15 | 已移除 |

---

## 精锐标签

| Tier | 标签 | 战力 |
|------|------|------|
| T0 | 天神军 | ×1.50 |
| T1 | 王者师 | ×1.40 |
| T2 | 劲锐旅 | ×1.30 |
| T3 | 精英团 | ×1.20 |
| T4 | 戍卫营 | ×1.10 |

---

## 状态链标签

| 来源 | 示例 | 规则 |
|------|------|------|
| 运气 | 好运 / 厄运 | fateLuck 上下阈值 |
| 援军 | 得助 / 掣肘 | joinLuck 0.9~1.1 |
| 据点 | 险要 / 名城 | 关隘/文化中心 |
| 文化 | 持重 / 骁勇 / 雄踞 | 文化表 2 字 |
| 六计 | 攻计 / 胜计 / 敌计 / 混计 / 并计 / 败计 | `EFFECT_TO_SIX_SET` 查表 |
| 攻防 | 擅攻 / 擅守 | 位匹配时显示 |
| 三势 | 造势 / 借势 / 逆势 | 势匹配时显示 |

全部 2 字。双行不显示，按实际位派生擅攻/擅守。

---

## 战斗面板字数规范

| 位置 | 字数 | 例 |
|------|------|---|
| 状态链 | 2 字 | 好运、持重、攻计、造势 |
| 技能名 | 4 字 | 金城汤池、倡义靖乱 |
| 效果 | 3 字 | 加己攻、天神军、挽败局 |

---

## 乘数徽章同源

`formatBattlePowerBadge` / `formatBattlePowerFactorChain` 统一用 `resolvePowerBadgeUnit` 强制取放技指挥官，文化/精锐/三势/风格/六计全读同一单位，不再跑偏。

---

## 今日修改文件

| 文件 | 改动 |
|------|------|
| `TacticalConstants.ts` | 层3 3×3 表、层4 balanced→1.30 |
| `GeneralSkillCombat.ts` | 六计随机 + 去 ×1.15 + `getSkillSixClass` |
| `BattleField.ts` | 随机选技 + 援军补写 + 攻防去重 + 注释 |
| `CombatUI.ts` | 标签显示、精锐重命名、同源修复、去 ×1.15 |
| `CombatSystem.ts` | `IBattleUnit` 加 `situationSkillMatch` |
| `TacticalSkillCatalog.ts` | ts_035 mag 0.5→0.2 + 存量重复键修复 |
| `general-skills/profiles.ts` | 48 条劣势槽攻战→并战/败战 |
| `general-skills/catalogs.ts` | 援军 luck 0.8-1.2→0.9-1.1 |
| `SituationalSelfCheck.ts` | 文案更新 |
| `AGENTS.md` | 字数规范 |
| 删除 | `EventParser.ts`, `EventEditor.ts`, `core/EventEditor.ts` |
