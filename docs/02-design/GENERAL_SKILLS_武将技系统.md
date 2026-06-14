# 历史大乱斗 — 武将技（General Skills）系统设计与维护约定

> **日后 AI 请先读本节，再动代码。**

## 〇、AI 阅读顺序（30 秒定位）

| 步骤 | 看什么 | 目的 |
|:---:|:---|:---|
| 1 | §一 立项链条 | 知道「秦之锐士 / 白起 / 侵掠如火」谁绑谁 |
| 2 | §二 三层加成 | 分清**系统层 / 战术层 / 战略层**（不要混为一谈） |
| 3 | §五 量化总表 | **唯一数值真理**：`magnitude` + 公式 + 是否实装 ✅/❌ |
| 4 | §七 代码地图 | 改哪个文件、挂哪个函数 |
| 5 | §八 加将流程 | 新增将领的标准步骤 |

**机制真理** = 格号（①–⑩ / S①–S⑦）+ `effect` + `magnitude` + §五 公式。  
**展示皮肤** = 技能名（以逸待劳、因粮于敌等）；**不得**用皮肤名发明新机制。  
**禁止**只写「己方增兵」而不写 §五 中的具体公式与 `magnitude`。

---

## 一、立项参考链条（必先于此，不可颠倒）

```
据点 → 势力 → 精锐（番号）→ 将领 → 武将技
```

| 环节 | 玩家所见 | 代码锚点 | 与武将技关系 |
|:---:|:---|:---|:---|
| 据点 | 地图城名（天水、邯郸） | `cities_v2` | 立项起点；不直接挂技能 |
| 势力 | 军情全名（秦） | `factions.ts` `name` | 军情叙事用，不绑技能 |
| 精锐 | 军团番号（**秦之锐士**） | `*ExpeditionLegions.ts`、`ScriptedCampaigns.eliteName` | 军团 `name`；**不是技能名** |
| 将领 | 主将（**白起**） | `Army.generalId`、`GENERAL_PROFILES` | **战术 + 战略绑 `generalId`** |

**例（第一个剧本军团）**：

| 环节 | 值 |
|:---|:---|
| 剧本 | `qin_handan`（`ScriptedCampaigns.ts`） |
| 精锐番号 | 秦之锐士 |
| 将领 | `baiqi` / 白起 |
| 战术 | ③ `tac_03` 侵掠如火 |
| 战略 | S② `str_02` 因粮于敌 |

**将阶**：名将 = 战术 ①–⑤ 选一 + 战略 S①–S⑦ 选一；普将 = 战术 ⑥–⑩ 选一，**无战略**。

---

## 二、三层加成（战斗里别搞混）

| 层 | 谁有 | 典型数值 | 数据来源 | 算武将技吗 |
|:---|:---|:---|:---|:---:|
| **A 系统·文化** | 所有军团 | 野战 0.8～1.2 | `GameConfig.CULTURE_COMBAT.TIER_TABLE` | 否 |
| **B 系统·剧本/远征** | `scriptedCampaignId` 或 `expeditionTargetCityId` 非空 | **×1.2** | `CAMPAIGN_LEGION_MULT` → `CultureCombat` | 否 |
| **C 战术** | 跟拍 + 有 `GENERAL_PROFILES` 的将 | 见 §5.1 | `GeneralSkillCombat` | 是 |
| **D 战略** | 仅名将，同上门禁 | 见 §5.2 | `GeneralSkillCombat` | 是 |

**开战掷色合成（跟拍名将攻方示例）**：

```
单单位有效兵力 = troops × A(文化) × B(剧本1.2)
侧总掷色 = Σ(单单位) × luck[0.8,1.2]
若开局战术③：侧总掷色 × 1.2
```

**胜后回血（与战术无关）**：

```
先 GameConfig.POST_BATTLE_RECOVERY（关10%～野战50%）
再 战略S②：troops += floor(当前兵 × 0.2)
```

**战斗 UI 徽章**（`CombatUI.formatBattlePowerBadge`）：把 **A、B、C 中 ≠1 的因子** 用 `×` 串联。  
例：中原秦之锐士跟拍白起 → `野战×1.2×1.2`（B 剧本 × C③；A=1.0 不显示）。

---

## 三、战术层 · 十格（纯兵书原典）

战术 = **`时机` × `效果`**，共 **10 格**，**禁止第 11 种机制**。

| 时机 | 名将格 | 普将格 |
|:---|:---|:---|
| **开局** `opening` | ①–⑤ | — |
| **逆局** `comeback` | — | ⑥–⑩ |

| 格 | 档位 | 技能名 | 出处 |
|:---:|:---|:---|:---|
| ① | 名将 | 以逸待劳 | 《孙子·军争》 |
| ② | 名将 | 避实击虚 | 《孙子·虚实》 |
| ③ | 名将 | 侵掠如火 | 《孙子·军争》 |
| ④ | 名将 | 不战而屈 | 《孙子·谋攻》 |
| ⑤ | 名将 | 不动如山 | 《孙子·军争》 |
| ⑥ | 普将 | 哀兵必胜 | 《老子·六十九章》 |
| ⑦ | 普将 | 攻其不备 | 《孙子·计》 |
| ⑧ | 普将 | 置之死地 | 《孙子·九地》 |
| ⑨ | 普将 | 釜底抽薪 | 《三十六计》第十九计 |
| ⑩ | 普将 | 深沟高垒 | 《孙子·虚实》 |

- **开局**：`BattleField.pickPredictedSides()`，掷色前后窗口。  
- **逆局**：`BattleField.update()`，跟拍侧总兵力 **<** 敌方（确定性，不掷点）。  
- 战术触发时：`CombatUI.flashTacticalSkill` 大字（目前仅 ③ 已接）。

---

## 四、战略层 · 七格（国民认知版）

战略 = **效果类**，名将 **七选一**；不按「开局/逆局」分。

| 格 | 技能名 | 类型 | 效果摘要 |
|:---:|:---|:---|:---|
| S① | 兵贵神速 | 军机运营 | 行军速度 ×1.2 |
| S② | 因粮于敌 | 军机运营 | 胜后当前兵 +20% |
| S③ | 攻城拔寨 | 城野专精 | 攻城战掷色 ×1.2 |
| S④ | 所向披靡 | 城野专精 | 野战掷色 ×1.2 |
| S⑤ | 长驱直入 | 地形专精 | 平原掷色 ×1.2 |
| S⑥ | 居高临下 | 地形专精 | 山地掷色 ×1.2 |
| S⑦ | 乘风破浪 | 地形专精 | 海面/水域掷色 ×1.2 |

地形判定：`LandTerrainSystem`（**不是**文化区）。战场锚点：攻城取城坐标，野战取接战位置。

---

## 五、量化总表（唯一数值真理）

> 下表 **`magnitude` 列必须与 `src/data/GeneralSkills.ts` 完全一致**。改数先改 TS，再改本表。

### 5.0 `effect` 枚举含义（代码用）

**战术 `TacticalEffect`**：

| effect | 含义 | magnitude 单位 |
|:---|:---|:---|
| `ally_add_troops` | 跟拍侧加兵 | 比例（0.15 = 15% 当前兵） |
| `enemy_sub_troops` | 敌方减兵 | 比例 |
| `ally_mult_1_2` | 跟拍侧有效战力乘区 | 倍数（1.2） |
| `enemy_mult_0_8` | 敌方有效战力乘区 | 倍数（0.8） |
| `ally_invincible` | 跟拍侧免伤 | **秒数**（3 = 3 游戏秒） |

**战略 `StrategicEffect`**：

| effect | 含义 | magnitude 单位 |
|:---|:---|:---|
| `march_speed_mult` | 行军速度 | 倍数（1.2） |
| `post_battle_troop_pct` | 胜后加兵 | 比例（0.2 = 20% 当前兵） |
| `siege_power_mult` | 攻城战掷色 | 倍数（1.2） |
| `field_power_mult` | 野战掷色 | 倍数（1.2） |
| `plain_power_mult` | 平原掷色 | 倍数（1.2） |
| `mountain_power_mult` | 山地掷色 | 倍数（1.2） |
| `water_power_mult` | 水域掷色 | 倍数（1.2） |

### 5.1 战术十格（公式 + 实装）

| 格 | id | 技能名 | effect | magnitude | **公式（写死）** | 挂载点 | 实装 |
|:---:|:---|:---|:---|:---:|:---|:---|:---:|
| ① | `tac_01` | 以逸待劳 | `ally_add_troops` | 0.15 | `troops += floor(当前兵力 × 0.15)`；然后 `refreshPredictedSidesFromTotals()` | 开局 | ❌ |
| ② | `tac_02` | 避实击虚 | `enemy_sub_troops` | 0.15 | 每个敌参战单位：`troops -= floor(该单位当前兵力 × 0.15)` | 开局 | ❌ |
| ③ | `tac_03` | 侵掠如火 | `ally_mult_1_2` | 1.2 | 跟拍侧掷色结果 `× 1.2` | 开局 | ✅ |
| ④ | `tac_04` | 不战而屈 | `enemy_mult_0_8` | 0.8 | 敌侧掷色等效 `× 0.8` | 开局 | ❌ |
| ⑤ | `tac_05` | 不动如山 | `ally_invincible` | 3 | `unit.isInvincible = true`，持续 **3** 游戏秒 | 开局 | ❌ |
| ⑥ | `tac_06` | 哀兵必胜 | `ally_add_troops` | 0.15 | 同①；逆局触发；**每场 1 次** | 逆局 | ❌ |
| ⑦ | `tac_07` | 攻其不备 | `enemy_sub_troops` | 0.15 | 同②；逆局；**每场 1 次** | 逆局 | ❌ |
| ⑧ | `tac_08` | 置之死地 | `ally_mult_1_2` | 1.2 | 同③；逆局 | 逆局 | ❌ |
| ⑨ | `tac_09` | 釜底抽薪 | `enemy_mult_0_8` | 0.8 | 同④；逆局 | 逆局 | ❌ |
| ⑩ | `tac_10` | 深沟高垒 | `ally_invincible` | 3 | 同⑤；逆局；**每场 1 次** | 逆局 | ❌ |

**数值红线**：乘区格（③④⑧⑨、战略战力/行军）**magnitude 不得改**，除非主人拍板改 §一 ×1.2 铁律。  
**①⑥ 的 0.15**：数据表已写入，**战斗未实装**；若主人改比例，只改 `magnitude` 与本表，不要为人名写分支。

### 5.2 战略七格（公式 + 实装）

| 格 | id | 技能名 | effect | magnitude | **公式（写死）** | 挂载点 | 实装 |
|:---:|:---|:---|:---|:---:|:---|:---|:---:|
| S① | `str_01` | 兵贵神速 | `march_speed_mult` | 1.2 | 跟拍军团行军：`最终速度 × 1.2` | `Army` 速度链 | ❌ |
| S② | `str_02` | 因粮于敌 | `post_battle_troop_pct` | 0.2 | 仅**胜方**跟拍：`troops += floor(当前兵力 × 0.2)`，在 `POST_BATTLE_RECOVERY` **之后** | `BattleField.resolve` | ✅ |
| S③ | `str_03` | 攻城拔寨 | `siege_power_mult` | 1.2 | `BattleField.type === 'siege'` 时跟拍侧掷色 `× 1.2` | 开战 | ❌ |
| S④ | `str_04` | 所向披靡 | `field_power_mult` | 1.2 | `type === 'field'` 时跟拍侧掷色 `× 1.2` | 开战 | ❌ |
| S⑤ | `str_05` | 长驱直入 | `plain_power_mult` | 1.2 | 战场锚点 `plain` 时跟拍侧掷色 `× 1.2` | 开战 | ❌ |
| S⑥ | `str_06` | 居高临下 | `mountain_power_mult` | 1.2 | 锚点 `mountain` 时 `× 1.2` | 开战 | ❌ |
| S⑦ | `str_07` | 乘风破浪 | `water_power_mult` | 1.2 | 海面或 `sea` 时 `× 1.2` | 开战 | ❌ |

### 5.3 系统层（非武将技）

| 常量 / 函数 | 值 | 公式 |
|:---|:---:|:---|
| `GameConfig.COMBAT.CAMPAIGN_LEGION_MULT` | 1.2 | 剧本/远征军团单位：`getUnitBattlePowerMultiplier` 内含 |
| `POST_BATTLE_RECOVERY` | 0.1～0.5 | 胜方恢复 `floor(本场损失 × 率)`；关10% / 小20% / 中30% / 大40% / 野战50% |
| `CULTURE_COMBAT.TIER_TABLE` | 0.8～1.2 | 按军团**出身**文化区 |
| 开战 luck | 0.8～1.2 | 每侧掷一次 |

### 5.4 白起完整算例（跟拍秦之锐士，攻方，中原文化）

| 步骤 | 计算 |
|:---|:---|
| 1 | 单位：`troops × 1.0(中原) × 1.2(剧本)` |
| 2 | 侧掷色：`Σ × luck` |
| 3 | 战术③：`× 1.2` |
| 4 | 战斗中按掷定强弱扣血（`presetResult` 时不改结局） |
| 5 | 若胜：先恢复损失×率，再 `+ floor(当前兵 × 0.2)` |

---

## 六、触发门禁（所有武将技共用）

须**全部**满足，否则该场战斗**视为无武将技**：

1. **跟拍**：`LegionManager.isFollowedLegion(unit.id)`
2. **军团类型**：`scriptedCampaignId != null` **或** `expeditionTargetCityId != null`
3. **将领档案**：`generalId` 在 `GENERAL_PROFILES`，且将阶与格号匹配（名将不得 ⑥–⑩，普将不得 ①–⑤ 与战略）

**例外**：`BattleField.presetResult` 非空 → 可播 UI，**不得改变预设胜负**。

据点募兵军团、无 `generalId`、不跟拍 → 不触发 C/D 层；仍可有 A/B 层（若属剧本/远征）。

---

## 七、代码地图（改哪里）

| 文件 | 职责 |
|:---|:---|
| `src/data/GeneralSkills.ts` | `TACTICAL_SKILL_CATALOG`、`STRATEGIC_SKILL_CATALOG`、`GENERAL_PROFILES` |
| `src/combat/GeneralSkillCombat.ts` | 门禁、`applyOpeningTacticalToRolls`、`applyPostBattleStrategicBonus`、`getOpeningTacticalPowerMultiplier` |
| `src/combat/BattleField.ts` | 开战掷色、胜后结算挂载 |
| `src/systems/CultureCombat.ts` | 文化 + **剧本/远征 ×1.2**（`getCampaignLegionCombatMultiplier`） |
| `src/legion/LegionSpawnPolicy.ts` | `isCampaignLegion()` 判定 |
| `src/config/GameConfig.ts` | `CAMPAIGN_LEGION_MULT`、`POST_BATTLE_RECOVERY`、`CULTURE_COMBAT` |
| `src/ui/CombatUI.ts` | 战术大字、`formatBattlePowerBadge` |
| `src/app/boot/GameAppCombatHooks.ts` | `wireGeneralSkillCombat` 绑定 LegionManager |

**实装新 `effect` 时**：在 `GeneralSkillCombat` 按 `effect` 分支读取 `skill.magnitude`，**禁止**在 `BattleField` 写 `if (generalId === 'baiqi')`。

---

## 八、AI 加将标准流程

1. 确认链条：据点 → 势力 → 精锐番号（`ExpeditionLegions` / `ScriptedCampaigns`）→ `generalId`
2. 定将阶：名将 / 普将
3. 在 §5 中选 **1 个战术格 +（名将）1 个战略格**，不得自造格
4. 写入 `GENERAL_PROFILES`：

```typescript
some_general: {
  generalId: 'some_general',
  tier: 'famous',           // 或 'ordinary'
  tacticalSkillId: 'tac_03',
  strategicSkillId: 'str_02', // 普将省略
},
```

5. 若该 `effect` 在 §5 标 ❌：只录入数据，**不要**在文档或对话里声称已上线
6. 改 §5「实装」列为 ✅ 后，须在 `GeneralSkillCombat` 实现并自测跟拍触发

---

## 九、装配示例（文档用）

| 将领 | 将阶 | 精锐 | 战术 id / 名 | 战略 id / 名 |
|:---|:---|:---|:---|:---|
| 白起 | 名将 | 秦之锐士 | `tac_03` 侵掠如火 | `str_02` 因粮于敌 |
| 王翦 | 名将 | （待定） | `tac_05` 不动如山 | `str_03` 攻城拔寨 |
| 霍去病 | 名将 | （待定） | `tac_03` 侵掠如火 | `str_01` 兵贵神速 |
| 曹纯 | 普将 | 虎豹骑 | `tac_08` 置之死地 | — |

---

## 十、开发纪律（红线）

1. **格号唯一真理**：战术 10 + 战略 7，禁止第 11 种机制
2. **文档必写公式**：禁止只写「己方增兵」「敌方减兵」等类型词而不写 §5 公式
3. **数值改一处**：`GeneralSkills.ts` `magnitude` 与本文件 §5 同步
4. **系统层 ≠ 武将技**：剧本 ×1.2 在 `CultureCombat`，不要写进 `GENERAL_PROFILES`
5. **最小侵入**：按 `effect` 分发；禁止为人名硬编码
6. **主战场**：区域战 `BattleField`；不是 `CombatSystem.Battle` 1v1
7. **相关约定**：立项链条见 `AGENTS.md` §十二；文化系数见 `GAME_DIRECTION.md` 五级文化攻防

---

## 十一、当前实装快照（随开发更新本行日期）

| 已实装 ✅ | 未实装 ❌ |
|:---|:---|
| 系统 B：剧本/远征 ×1.2 | 战术 ①②④⑤⑥⑦⑧⑨⑩ |
| 战术 ③ 侵掠如火 | 战略 S① S③–S⑦ |
| 战略 S② 因粮于敌 | |
| UI：战术大字（③）、徽章分段显示 | |

**最后更新**：2026-06-14
