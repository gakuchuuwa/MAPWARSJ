---
name: tactical-skill-owner-audit
description: >-
  修剪战术技典故主（ownerName）：每人署名≤6，超额改「通用」不删技，必须保留 sourceQuote/note 史料。
  在主人给出某人定案表、修 TacticalSkillCatalog 典故主、改挂/改通用、或要求「一人最多六个技能」时使用。
---

# 战术技典故主修剪（史料必须保留）

主文件：`src/data/TacticalSkillCatalog.ts`  
同步：`SKILL_CHARACTER` 查找表。

## 最高优先级（血线）

**不删技能。不抹历史。修的是署名计数，不是改写正史。**

| 可改 | 必须保留 |
|------|----------|
| `ownerName`（人名 / `通用`） | **`sourceQuote`（出典原文）** |
| `ownerGeneralId`（人名绑在册 ID；通用则去掉） | **`note` 中的同源说明**（无则补） |
| `SKILL_CHARACTER` | 技名、`baseEffect`、六类字段（无主令勿动） |

**禁止**

- 删整条技、清空或掏空 `sourceQuote`
- 把史料句改成「通用计策」「多将皆有」等空话（可作补充，不可替代出典）
- 批量改 `baseEffect` / condition / phase / magnitude / series（见 AGENTS 武将技铁律）
- `git checkout` / `git restore` 回滚未提交心血

**「通用」≠「无历史」。通用 = 署名让位，史料留存。**

---

## 口径

1. **每人署名 ≤ 6**：仅统计 `ownerName` 为**具体人名**的条目。
2. **超额（默认）**：改 `ownerName: '通用'`，去掉 `ownerGeneralId`；**`sourceQuote` 仍写原史（可含【某人】）**；`note` 写：
   ```
   同源：某人·战例/主题（可与 ts_xxx 同典）
   ```
3. **改挂**：仅主人定案表中的争议项；有更典型战例才改人；接收者因此 >6 → 其同源变体改通用（同样保留史料）。
4. **同典重复**（如以寡摧盟 / 以寡破盟）：署名留 1；其余通用 + 同源备注。
5. **一次一人**（或主人点名的一批）；等定案表再改，勿全库一把梭。

---

## 工作流

```
- [ ] 列出该人全部技（id + displayName + ownerName）
- [ ] 按主人定案：必留署名 / 改挂 / 改通用
- [ ] 署名压到 ≤6；多出 → 通用 + 同源 note
- [ ] 核对每条：sourceQuote 仍有可考出处；通用必有「同源：某人」
- [ ] 同步 SKILL_CHARACTER
- [ ] 回报三类清单（署名 / 通用同源 / 改挂）
```

统计可用（项目内）：

```bash
node scratch/count_skill_owners.mjs
# 或按 owner 分块解析 TacticalSkillCatalog.ts
```

---

## 通用条目模板（正确）

```ts
{
  id: 'ts_727',
  ownerName: '通用',
  // 无 ownerGeneralId
  displayName: '轻锐扰阵',
  sourceQuote: '【霍去病】《史记·卫将军骠骑列传》：轻骑长途奔袭……',
  note: '同源：霍去病·轻骑奔袭（与 ts_733 驰骋扰阵同系）',
  // baseEffect / condition / phase / magnitude 不动
}
```

错误（禁止）：`ownerName: '通用'` 且 quote 被清空或只剩「通用」。

---

## 字段语义

| 字段 | 含义 |
|------|------|
| `ownerName: '韩信'` | 署名典故主（计入 ≤6） |
| `ownerName: '通用'` | 不占署名额度；技仍进池服役 |
| `sourceQuote` + `note` | **真实历史资料所在** — 重点，不可丢 |

---

## 回报格式

```
署名（N≤6）：id 技名 …
通用同源：id 技名 → 同源：某人·…
改挂：id 技名 旧主→新主
```

---

## 相关约束

- AGENTS.md：禁止批量改六类归属；六计各一 / 技必有主另论，本 skill 只动典故主署名与史料备注。
- 主人只交某人定案表时：只做该人；不擅自改玩法效果。
