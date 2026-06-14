# 历史大乱斗 — 武将技（General Skills）系统设计

> **必读**：本文档定义武将技的分类、触发条件、数值边界和实现挂载点。新增技能必须在此框架内扩展。

---

## 〇、游戏特性约束（设计前提）

| 约束 | 说明 |
|:---|:---|
| **触发范围** | **仅跟拍军团**可触发武将技；且该军团须为**剧本军团**或**远征军团**——据点募兵军团不触发（即使被跟拍）。 |
| **实体模型** | 一据点 = 一势力 = 一军团 = 一将领。军团分三类：据点军团、剧本军团（scripted campaign）、远征军团（expedition）。 |
| **兵种** | 仅骑兵、步骑混编（无纯步兵，无兵种克制链）。 |
| **地形** | 山地、平原、水域（无森林/沙漠等细分）。 |
| **数值维度** | 只有兵力（troops）。无将领五维、无士气、无内政。 |
| **战斗模型** | 攻城/野战主战场为 `BattleField`（`SiegeManager` / `LegionFieldBattle` → `CombatSystem.startRegionalBattle`）：`pickPredictedSides()` 掷强弱 → `update()` 逐帧扣血 → `resolve()` 分级恢复（`GameConfig.COMBAT.POST_BATTLE_RECOVERY`）。 |

### 触发门禁（实现时最先判定）

武将技引擎在 `BattleField` 任何效果之前，对参战各方逐单位检查：

1. **跟拍**：`LegionManager.isFollowedLegion(army.id)` 为真（与 `ExpeditionUI` / `FollowResupplySystem` 同一跟拍对象）。
2. **军团类型**（二选一）：
   - **剧本军团**：`army.scriptedCampaignId != null`（见 `LegionSpawnPolicy.isScriptedLegion`）。
   - **远征军团**：`army.expeditionTargetCityId != null`（玩家下令远征或剧本绑定远征目标）。

不满足任一条 → 该军团在本场战斗中**视为无技能**（不读 `GeneralSkills.ts`、不播技能 UI）。AI 其余军团、城驻军、援军编入均不触发。

**预设胜负例外**：`BattleField.presetResult` 非空时（如剧本邯郸 `defender_win`），技能可播 UI，**不得改写预设结果**。

### 战斗管线（战术技能唯一挂载面）

| 阶段 | `BattleField` 方法 | 战术技能 |
|:---|:---|:---|
| **开局** | `pickPredictedSides()` 内、调用 `rollSideEffectivePower()` **之前/之时** | 开局五格（见 §二） |
| **逆局** | `update()` 内条件满足时 | 逆局五格（见 §二） |
| 改兵力后 | `refreshPredictedSidesFromTotals()` | **必调**（与援军编入同路径） |
| **战后** | — | **不属于战术层**（见 §一 战略技能） |

> `CombatSystem.Battle`（1v1）不是玩家主战场；实现以 `src/combat/BattleField.ts` 为准。

---

## 一、两大种：战略 vs 战术

| 大类 | 作用范围 | 现状 |
|:---|:---|:---|
| **战略技能** | 战外或战斗已结束后的地图/季节/补给/占城后等 | **先不做** |
| **战术技能** | 仅 `BattleField` 战斗进行中：开局 + 逆局 | **先只做这个** |

### 战略技能（搁置）

战后己方增兵（原【连战】【劫掠】等）归入**战略层**，不在战术十格内，**本期不实现**。  
连续远征续航改由现有 `POST_BATTLE_RECOVERY` + 未来战略技能承担。

---

## 二、战术技能：十格枚举（唯一真理）

战术技能 = **`时机` × `效果`**，共 **10 种**，严禁为单个武将发明第 11 种机制。

### 2.1 十格总表

| 时机 | 己方增兵 | 敌方减兵 | 己方 ×1.2 | 敌方 ×0.8 | 己方免伤 |
|:---|:---:|:---:|:---:|:---:|:---:|
| **开局** | ① | ② | ③ | ④ | ⑤ |
| **逆局** | ⑥ | ⑦ | ⑧ | ⑨ | ⑩ |

**时机定义（确定性，不掷点）：**

| 时机 | 含义 | 典型挂载 |
|:---|:---|:---|
| **开局** | 战斗开始、强弱掷色前后的一帧窗口 | `pickPredictedSides()` |
| **逆局** | 跟拍侧总兵力 **<** 敌方总兵力（可叠加残血等**额外条件**，仍落在逆局五格） | `update()` |

**效果定义：**

| 效果 | 底层实现 |
|:---|:---|
| 己方增兵 | 跟拍军团 `troops` 增加（比例或固定值，带上限） |
| 敌方减兵 | 敌方参战单位 `troops` 减少 |
| 己方 ×1.2 | 跟拍侧有效战力 ×1.2（注入 `rollSideEffectivePower` 输入） |
| 敌方 ×0.8 | 敌方有效战力 ×0.8（等价弱化敌侧掷色输入） |
| 己方免伤 | `IBattleUnit.isInvincible`，持续 N 秒；`BattleField.update()` 扣血前检查 |

**改兵力后**（①②⑥⑦）→ 调用 `refreshPredictedSidesFromTotals()`（`presetResult` 时跳过）。

### 2.2 技能名 = 十格上的展示皮肤

同一格可挂不同**展示名 / UI**，底层仍是同一效果。示例映射：

| 展示名 | 时机 | 效果 | 备注 |
|:---|:---|:---|:---|
| 【军神】【霸王】【飞将】 | 开局 | 己方 ×1.2 | 互斥皮肤，同格 |
| 【神算】 | 开局 | 敌方减兵 | 如扣敌当前兵力 15%，每场 1 次 |
| 【攻城】【讨夷】 | 开局 | 己方 ×1.2 | **附加条件**：敌为城 / 敌文化区为游牧四类，仍占③格 |
| 【背水】【破釜】 | 逆局 | 己方 ×1.2 | 互斥皮肤 |
| 【威压】【坚守】 | 逆局 | 己方免伤 | 互斥皮肤；如 3 秒，每场 1 次 |
| 【不屈】 | 逆局 | 己方增兵 | 如残血 &lt; 初始 20% 时触发 |
| 【坑杀】 | 逆局 | 敌方减兵 | 如敌 &lt; 初始 30% 时触发，每场 1 次 |

> 原【铁壁】等守城向技能：跟拍军团多为攻方，带 `generalId` 的守城军团若跟拍则可挂开局③/逆局⑩；城驻军无 `generalId`，不触发。

### 2.3 叠加与次数

| 规则 | 说明 |
|:---|:---|
| 战力倍率叠加 | 开局③④与逆局⑧⑨**最多同时生效 2 层**（如 1.2×1.2=1.44）；超出按 **开局 &gt; 逆局** 优先级丢弃 |
| 每场次数 | 减兵/增兵类逆局技默认 `maxTriggersPerBattle = 1`；免伤默认每场 1 次 |
| 数值默认 | ×1.2 / ×0.8；增减仓默认 15%–20% 当前或初始兵力（具体 per 技能数据，须推演后定） |

---

## 三、数据层

### 3.1 技能定义（十格 + 展示）

```typescript
/** 战术十格：时机 × 效果 */
export type TacticalTiming = 'opening' | 'comeback'; // 开局 | 逆局

export type TacticalEffect =
  | 'ally_add_troops'      // 己方增兵
  | 'enemy_sub_troops'     // 敌方减兵
  | 'ally_mult_1_2'        // 己方 ×1.2
  | 'enemy_mult_0_8'       // 敌方 ×0.8
  | 'ally_invincible';     // 己方免伤

export interface TacticalSkillDef {
  id: string;
  displayName: string;     // 玩家所见大字，如「军神」
  timing: TacticalTiming;
  effect: TacticalEffect;
  /** 可选：残血、攻城、讨夷等，不改变十格类型 */
  extraCondition?: string;
  magnitude?: number;      // 如 0.15、1.2、3（秒）
  maxTriggersPerBattle?: number;
}

/** 将领 → 战术技能 id 列表（仅战术层） */
export const GENERAL_TACTICAL_SKILLS: Record<string, string[]> = {
  baiqi: ['junshen', 'kengsha'],  // 开局③ + 逆局⑦（示例）
  // ...
};
```

> `generalId` 与 `factionId` 不同。战略技能将来用独立表，不与 `GENERAL_TACTICAL_SKILLS` 混写。

### 3.2 审计（实现后）

- 同一将领：同一 `(timing, effect)` 格最多 1 个技能 id  
- 同格互斥皮肤（军神/霸王/飞将）在数据录入时人工遵守  

---

## 四、开发纪律

1. **两大种分清**：战术只做十格；战后增兵等归战略，本期不写 `BattleField.resolve()` 技能钩子。
2. **先门禁，后十格**：跟拍 + 剧本/远征 → 读技能 def → 按时机挂 `pickPredictedSides` / `update`。
3. **改兵力必重算**：①②⑥⑦ 触发后 `refreshPredictedSidesFromTotals()`；`presetResult` 除外。
4. **重 UI 轻数值**：×1.2 / ×0.8 为默认上限；表现力靠 `CombatUI.ts` 大字与特效。
5. **判定确定**：技能触发不掷点（与 `rollSideEffectivePower` 的 luck 无关）。
6. **不新增第 11 机制**：新名将只组合十格 + 条件 + 展示名。

---

## 五、战术十格速查

| 格 | 时机 | 效果 |
|:---:|:---|:---|
| ① | 开局 | 己方增兵 |
| ② | 开局 | 敌方减兵 |
| ③ | 开局 | 己方 ×1.2 |
| ④ | 开局 | 敌方 ×0.8 |
| ⑤ | 开局 | 己方免伤 |
| ⑥ | 逆局 | 己方增兵 |
| ⑦ | 逆局 | 敌方减兵 |
| ⑧ | 逆局 | 己方 ×1.2 |
| ⑨ | 逆局 | 敌方 ×0.8 |
| ⑩ | 逆局 | 己方免伤 |

**战略层（本期不做）**：战后己方增兵、【连战】【劫掠】等。
