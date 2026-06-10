# 秦朝事件提取提示词

扫描笔记本中的秦朝史料，**仅提取前236年**的战争事件。

> ⚠️ 每次使用时只需修改上面的年份（一年一年地处理）,除非战争连续到下一年。

---

## 秦朝势力映射（严格遵守）

| 势力ID | 对应国家 |
|--------|---------|
| `huaxia` | **秦** |
| `qiangzang` | **韩** |
| `menggu` | **魏** |
| `zhonghua` | **齐** |
| `huihui` | **赵**、匈奴 |
| `tianchao` | **楚** |
| `chaoxian` | **燕** |
| `yuenan` | 百越 |
| `panjun` | 叛军（陈胜吴广等起义军） |

---

## 两种事件模板

### A. 攻城战 siege

```json
{
    "year": -236,
    "regnalYear": "秦王政十一年",
    "title": "秦赵阏与之战",
    "season": 1,
    "description": "秦将王翦趁赵军主力北伐燕国之际，率大军自长子出击，越太行山攻克赵国要塞阏与。",
    "type": "siege",
    "siegeData": {
        "attackerFactionId": "huaxia",
        "defenderCityName": "阏与（今山西和顺）",
        "attackerCityName": "长子（今山西长治长子县）",
        "result": "attacker_win",
        "legionName": "秦-王翦军",
        "attackerTroops": 150000
    }
}
```

### B. 野战 field_battle

```json
{
    "year": -234,
    "regnalYear": "秦王政十三年",
    "title": "秦赵平阳之战",
    "season": 0,
    "description": "秦将桓齮率军从邺城出发，大破赵军于平阳，斩首十万，杀赵将扈辄。",
    "type": "field_battle",
    "fieldBattleData": {
        "attackerFactionId": "huaxia",
        "defenderFactionId": "huihui",
        "attackerLegionName": "秦-桓齮军",
        "defenderLegionName": "赵-扈辄军",
        "attackerTroops": 100000,
        "defenderTroops": 80000,
        "result": "attacker_win",
        "locationName": "平阳（今河北磁县）",
        "attackerSourceCityName": "邺城（今河北临漳）",
        "defenderSourceCityName": "邯郸（今河北邯郸）"
    }
}
```

---

## 筛选规则

### 写什么
- **攻城战**：有战略意义的城池攻取。同一将领连续攻占的小城合并为一个事件（主要目标命名，描述中提及次要目标）
- **野战**：万人以上的决定性会战。追击阶段合并到主战事件中

### 不写什么
- 不影响战争格局的政治事件（如吕不韦死、韩非死）
- 未达万人的小规模冲突

---

## 格式规则

1. **title**：`攻方+守方+地名+之战`；灭国用 `攻方灭守方之战`
2. **legionName**：`势力名-主将名军`（如 `秦-王翦军`）
3. **description**：50-80字，硬核军语风，禁用现代词汇
4. **地名格式**：`古地名（今xx省xx市）`，攻城战和野战均写出发地
5. **season**：0春 1夏 2秋 3冬
6. **year**：公元前用负数
