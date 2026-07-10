# 中亚守城名将不显示 — 问题分析报告

## 现象

GAKU 发现中亚（CENTRAL_ASIA）区域大量守城战不显示武将——要么不显示立绘，要么不显示名将身份。典型场景：粟特占领达尔甘后，塞尔柱来攻，守方只显示精锐"呼罗珊之剑"，无武将名、无立绘。

## 根因

**`City` 接口没有 `generalId` 字段。**

守城方战斗单位创建时（`BattleUnitFactory.createAdapter`），武将解析链路：

```
readSiegeGarrisonGeneralId(entity) ?? entity.generalId
```

- `readSiegeGarrisonGeneralId` → 查 `_siegeGarrisonGeneralId`（由 `applySiegeGarrisonBoostIfNeeded` 攻城前设置）
- `entity.generalId` → `City` 接口无此字段，永远 `undefined`

当据点**未被易主**时：锚定势力 = 占城势力 → `generalOwnedByOccupier = true` → `_siegeGarrisonGeneralId` 正常赋值 → 守城有将 ✓

当据点**已被易主**时（如粟特占达尔甘）：锚定势力（马蒙）≠ 占城势力（粟特）→ `generalOwnedByOccupier = false` → `anchoredGeneral = null` → `_siegeGarrisonGeneralId` 不赋值 → 兜底 `entity.generalId` 也是 `undefined` → **守城无将 ✗**

## 修复

### 1. 易主城武将兜底（核心修复）

**文件**：`src/combat/SiegeGarrisonTier.ts`

- 新增 `getFactionGeneral` 导入
- 当 `generalOwnedByOccupier` 为 false 时，取占城势力自己的武将作为兜底：

```typescript
const anchorGeneral = generalOwnedByOccupier ? getCityAnchoredGeneral(city.id) : null;
const occupierGeneral = !generalOwnedByOccupier ? getFactionGeneral(city.factionId) : null;
const anchoredGeneral = anchorGeneral ?? occupierGeneral;
```

后续的"同场唯一"检查（攻方已有该将则不出）依然生效，不会出现同一武将在攻守双方同时出场。

### 2. 编辑器误报借势武将（顺手修）

**文件**：`vite.config.ts`
- `serverValidateEntities` 中，借势（leverage）武将跳过 triClass 类别匹配校验。借势武将故意跨类放技是设计意图。

**文件**：`src/batch-manager/main.ts`
- 编辑面板 `slotOptions` 下拉框对借势武将不再标 ⚠

## 影响范围

- 所有被易主的据点，守城时现在都会显示占城势力自己的武将（名将/普将均适用）
- 不影响锚定势力=占城势力的据点（行为不变）
- 不影响守城军团已有武将的情况（军团优先，`hasLegionGeneral` 检查在前）
