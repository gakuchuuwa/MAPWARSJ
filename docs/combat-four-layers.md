# MAPWAR 战斗系统 · 四层架构详细报告

> 2026-07-16 定稿

---

## 一、四层总览

每一场战斗，双方各算一条掷色链：

```
roll = 兵力 × 运气  × 技能    × 势      × 攻防
             ①      ②       ③       ④
```

| 层 | 含义 | 取值 | 来源 |
|----|------|------|------|
| ① 运气 | 随机骰子 [0.9, 1.1] | 0.90–1.10 | 无 |
| ② 技能 | 六计 magnitude，按局势选对应槽位技 | 在册/不在册 | 武将技表 |
| ③ 势 | aptitude × 当前局势（优/均/劣） | 0.60–1.40 | 武将天赋 |
| ④ 攻防 | attackStyle × 攻守角色 | 0.70–1.30 | 武将风格 |

四层全部乘法。同一场战斗中攻守局势绑定（一方优 = 另一方劣）。

### 单边链范围与极端对战倍比

单边链极值：

```
最高: 运气1.1 × 攻战1.2 × 造势优1.40 × 善攻攻城1.30 = 2.40
最低: 运气0.9 × 技被克否1.0 × 造势劣0.60 × 善防攻城0.70 = 0.38
```

**单边范围 0.38–2.40，极端对战倍比 = 2.40 / 0.38 = 6.4 : 1。**

> 6.4:1 是两个极端同时出现在同一场战斗（造势劣+善防错位 vs 造势优+善攻对口）时的倍比，且攻方技被克否。若双方技层都取 1.2（或都取 1.0），倍比约 **5.3:1**。实战极少同时触发。按此逆推：劣势方要 **5–6 万兵** 才能拉平优势方 **1 万兵**。

---

## 二、③势层（0.6–1.4）

按兵力比判定局势：我方/敌方 > 1.5 → 优势，< 0.67 → 劣势，其间 → 均势。

| aptitude | 优势 | 均势 | 劣势 | 设计意图 |
|----------|:---:|:---:|:---:|------|
| **造势 create** | **1.40** | 1.00 | **0.60** | 顺风碾压，逆风崩盘 |
| **借势 leverage** | 0.90 | **1.20** | 0.90 | 永不吃亏，永不高光 |
| **逆势 reverse** | **0.60** | 1.00 | **1.40** | 顺风松懈，逆风觉醒 |

- 造势/逆势互相对称（1.40 ↔ 0.60），借势在均势有 20% 优势。
- **同兵力·同攻防（双行 1.20）下三势纯克制矩阵**：

```
           守造势    守借势    守逆势
均势(1:1)
 攻造势     49.9%     0.4%    49.9%
 攻借势     99.6%    50.0%    99.6%     ← 借势克一切均势局
 攻逆势     50.0%     0.4%    50.1%

攻优(2:1)
 攻造势    100.0%   100.0%   100.0%
 攻借势    100.0%   100.0%   100.0%
 攻逆势    100.0%   100.0%     2.6%     ← 逆势优局松懈(0.60) vs 逆势劣局觉醒(1.40)

攻劣(1:2)
 攻造势      0.0%     0.0%     0.0%
 攻借势      0.0%     0.0%     0.0%
 攻逆势      0.0%     0.0%    97.4%     ← 只有逆势在劣局存活
```

---

## 三、④攻防层（0.7–1.3）

| attackStyle | 攻城(攻方取此列) | 守城(守方取此列) | 设计意图 |
|-------------|:---:|:---:|------|
| **善攻 attack** | **1.30** | **0.70** | 攻城碾压，被迫守城 = 自杀 |
| **善防 defense** | **0.70** | **1.30** | 守城铁壁，被迫攻城 = 自杀 |
| **双行 balanced** | **1.20** | **1.20** | 攻守双全，名将专属 |

- 善攻/善防互相对称（1.30 ↔ 0.70）。**错位惩罚**：善攻守城 = 0.70，善防攻城 = 0.70。
- **同兵力·无势无技·纯攻防对撞**：

```
善攻攻城(1.30) vs 善防守城(1.30)  → 50.0%   抵消
双行攻城(1.20) vs 双行守城(1.20)  → 50.0%   抵消
善攻攻城(1.30) vs 双行守城(1.20)  → 82.0%   善攻在强面多 5%
善攻攻城(1.30) vs 善攻守城(0.70)  → 99.9%   守方错位
善防攻城(0.70) vs 善防守城(1.30)  →  0.0%   攻方错位
```

---

## 四、九种武将类型

3 势 × 3 攻防 = **9 种武将**：

| | 善攻 | 善防 | 双行 |
|---|:--:|:--:|:--:|
| **造势** | 造势善攻 | 造势善防 | 造势双行 |
| **借势** | 借势善攻 | 借势善防 | 借势双行 |
| **逆势** | 逆势善攻 | 逆势善防 | 逆势双行 |

### 攻 2万 vs 守 4万 · 双方攻 1.2 + 胜 0.08 · 九种攻方 × 三种守方

```
攻方\守方           造势善防(最强守)   借势双行(均衡守)   造势善攻(错位守)
造势善攻               0.0%             0.0%             0.0%
造势善防               0.0%             0.0%             0.0%
造势双行               0.0%             0.0%             0.0%
借势善攻               0.0%             0.0%             0.0%
借势善防               0.0%             0.0%             0.0%
借势双行               0.0%             0.0%             0.0%
逆势善攻               0.0%             1.1%            19.9%  ← 唯一翻盘点
逆势善防               0.0%             0.0%             0.0%
逆势双行               0.0%             0.0%             2.7%
```

### 攻 4万 vs 守 2万 · 攻方造势善防(错位)

```
守方               攻方胜率   守方翻盘
造势善攻(守错位)     100.0%      —
造势善防             100.0%      —
借势善防             100.0%      —
逆势善防              80.2%    19.8%  ← 逆势劣局觉醒 × 善防守城 = 1.82，守住了
逆势双行              97.4%     2.6%
```

---

## 五、同型对决示例

> 以下「= X」为 ③势 × ④攻防（技前系数），有效战力含 ②技（攻 1.2 + 胜 0.92）。

### 示例 1：攻方双重惩罚（逆势 + 善防夹击）

```
攻方 4万(优): 逆势×0.60 + 善防攻城×0.70 = 0.42
守方 2万(劣): 逆势×1.40 + 善防守城×1.30 = 1.82

有效: 攻 1.85万 vs 守 4.02万  → 攻方 0.0%
```

逆势将在优势松懈 + 善防将被追攻城 → 4 万反被 2 万碾压。

### 示例 2：攻方轻罚（借势 + 双行护航）

```
攻方 4万(优): 借势×0.90 + 双行攻城×1.20 = 1.08
守方 2万(劣): 逆势×1.40 + 善防守城×1.30 = 1.82

有效: 攻 4.77万 vs 守 4.02万  → 攻方 98.9%
```

借势在优势只被轻罚 10%，双行不拖后腿 → 2:1 兵力底子就够了。

### 示例 3：最强攻 vs 最强守（系数相消）

```
攻方 4万(优): 造势×1.40 + 善攻攻城×1.30 = 1.82
守方 2万(劣): 逆势×1.40 + 善防守城×1.30 = 1.82

有效: 攻 8.04万 vs 守 4.02万  → 攻方 ~100%
```

势 × 攻防完全抵消（1.82 = 1.82），胜负回到纯兵力比 2:1。**同局下造势善攻对口 vs 逆势善防对口 → 系数相消，谁兵多谁赢。**

---

## 六、引擎实现

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/combat/TacticalConstants.ts` | `APTITUDE_POWER_MULT` 0.6–1.4 + `ATTACK_STYLE_POWER_MULT` 0.7–1.3 |
| `src/combat/GeneralSkillCombat.ts` | `getAttackStylePowerMult()` + 接线 |
| `tools/combat-model.ts` | 同步常量、函数 + `simulateOnce` 主路径 + `recompute` 逆局路径 |

### 掷色链

```typescript
// src/combat/GeneralSkillCombat.ts:1918-1928

// ③ 势层
outAtt *= getAptitudePowerMult(attackerUnits, defenderUnits, attCommander);
outDef *= getAptitudePowerMult(defenderUnits, attackerUnits, defCommander);

// ④ 攻防层
const attGen = findEligibleGeneralUnit(attackerUnits, attCommander);
const defGen = findEligibleGeneralUnit(defenderUnits, defCommander);
outAtt *= getAttackStylePowerMult(attGen, true);
outDef *= getAttackStylePowerMult(defGen, false);
```

### 攻防系数常量

```typescript
// src/combat/TacticalConstants.ts
export const ATTACK_STYLE_POWER_MULT = {
    attack:   { attack: 1.30, defense: 0.70 },
    defense:  { attack: 0.70, defense: 1.30 },
    balanced: { attack: 1.20, defense: 1.20 },
};

export const APTITUDE_POWER_MULT = {
    create:   { advantage: 1.40, balance: 1.00, disadvantage: 0.60 },
    leverage: { advantage: 0.90, balance: 1.20, disadvantage: 0.90 },
    reverse:  { advantage: 0.60, balance: 1.00, disadvantage: 1.40 },
};
```

---

## 七、模拟器

### 独立模拟器

`scratch/combat_sim_v7.mjs` — 四层纯 JS 验证，不走 combat-model。

```bash
node scratch/combat_sim_v7.mjs
```

核心代码（与引擎一致，完整可自定参数）：

```javascript
// ── 可调参数 ──
const A = 40000;                         // 攻方兵力
const D = 20000;                         // 守方兵力
const SKILL = { 攻: 1.2, 胜: 0.08 };     // ②技能
const RUNS = 200000;

// ── ④攻防层 ──
const ATK = {
  attack:   { atk: 1.30, def: 0.70 },
  defense:  { atk: 0.70, def: 1.30 },
  balanced: { atk: 1.20, def: 1.20 },
};

// ── ③势层 ──
const APT = {
  create:   { a: 1.40, b: 1.00, d: 0.60 },
  leverage: { a: 0.90, b: 1.20, d: 0.90 },
  reverse:  { a: 0.60, b: 1.00, d: 1.40 },
};

function resolveApt(apt, my, opp) {
  const r = my / Math.max(1, opp);
  return APT[apt][r > 1.5 ? 'a' : r < 0.67 ? 'd' : 'b'];
}

// 掷色 = ①运气 × ②技能 × ③势 × ④攻防
function sim(aApt, dApt, aSt, dSt) {
  for (let i = 0; i < RUNS; i++) {
    let a = A, d = D;
    d *= (1 - SKILL.胜); a *= (1 - SKILL.胜);   // 胜战削敌
    const ar = a * luck() * SKILL.攻 * resolveApt(aApt, a, d) * ATK[aSt].atk;
    const dr = d * luck() * SKILL.攻 * resolveApt(dApt, d, a) * ATK[dSt].def;
    if (ar >= dr) wins++;
  }
}
```

> 修改 `tests[]` 数组可自定义对战场景。`npm run build` 后所有 combat-model 模拟器自动接入四层。

### combat-model 模拟器

```bash
npm run sim:legion         # 攻城排名
npm run sim:campaign       # 连续攻城
npm run sim:skill          # 技能平衡
npm run sim:expedition     # 远征续航
```

> `combat_sim_v7.mjs` 独立手写，不走 combat-model。其余经 combat-model 接入四层，与引擎严格对齐。
