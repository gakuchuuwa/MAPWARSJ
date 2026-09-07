> # 🔴 铁律 · 兵种归属只看「子分类 + 文化区挨不挨着」
>
> 判断一个兵种能不能进某支军团，**只看两条**：
>
> 1. **兵种子分类对不对** —— 近战骑兵 / 弓骑兵 / 枪骑兵 / 步弓手 / 重步兵 / 攻城器…
>    要补的是哪一类，就从那一类里挑。
> 2. **文化区在地理上挨着** —— 这个兵的本源文化区，和要用它的文化区，别隔太远。挨着就行，不必同族。
>
> 兵种 id 里的民族词（女真 / 波兰 / 越南 / 图皮 / 库曼…）、中文兵名、`age` 时代标签，**都不是判据**。
> 那是《帝国时代 2 DE》的出处标签，不是本作里这个兵属于谁。
>
> **正例**：铁浮屠是**近战骑兵**、本源**东北** → 朝鲜、北方、草原、契丹、女真、西夏、蒙古**都能用**。
> 　　　　西辽挨着蒙古、离女真远 → 西辽 4 档用**怯薛军**比铁浮屠更合适。
> **反例**：图皮黑木弓箭手（南美）给阿伊努（北海道）—— 子分类虽同是步弓，但隔着太平洋，**太远，不行**。
>
> **禁止**：只因为兵名里带别族的民族词，就说「跨国乱炖 / 不符合历史」。这条已被主人当场抓过三次：
> - 「契丹军团用女真铁浮屠 = 乱炖」→ **错**，同是东北近战骑兵，文化区挨着。
> - 「库曼钦察弓骑不该给东北民族」→ **错**。
> - 「捷克军团 4 档是波兰奥布奇战锤兵 = 乱炖」→ **错**，波兰捷克接壤。
>
> 另一条同级铁律：**别人（主人 / 其他 AI）已经做好的编制，不许擅自改。**
> 只有改动前就是红的（格位不符阵型 / 兵种不存在 / 象攻城违规 / 战力离群）才准动，其余一律先问。
> 自动闸门：`npm run legion:no-unjustified-edits`（已挂 PostToolUse 钩子，改完自动拦）。

---
title: 野战配置说明
summary: 定义 field_battle 事件的 JSON 结构、参数含义与示例。
owner: GAKU
status: active
last_updated: 2025-11-02
phase: production
---
# 野战配置说明

## 野战配置格式

野战事件使用以下格式：

```javascript
{
    type: "field_battle",
    location: { latitude: 38.03, longitude: 114.15 }, // 战场坐标（推荐）
    // 或者
    // location: "city_id", // 城市ID（也支持）
    battleName: "井陉之战",
    factions: [
        { factionId: "qi", troops: 10000 },
        { factionId: "zhao", troops: 10000 }
    ]
    // duration 字段已废弃，战斗时长会自动根据双方兵力计算
}
```

## 配置说明

### location（战场位置）

**推荐格式：坐标对象**
```javascript
location: { latitude: 38.03, longitude: 114.15 }
```

**也支持：城市ID**
```javascript
location: "xuzhou"
```

### battleName（战斗名称）

显示在地图上的战斗名称，例如：
- "井陉之战"
- "彭城之战"
- "垓下之战"

### factions（参战势力）

必须是2个势力，每个势力包含：
- `factionId`: 势力ID
- `troops`: 兵力数量（固定10000）

### duration（战斗时长）

**已废弃！** 战斗时长现在会自动根据双方总兵力计算：

```javascript
duration = calculateBattleDuration(faction1.troops, faction2.troops)
```

计算公式：
- 基础时间：10秒
- 每1000兵力增加1秒
- 例如：10000 vs 10000 = 30秒

## UI显示

野战在地图上会显示为：

```
┌─────────────┐
│  井陉之战   │  ← 战斗名称（黑底白字）
└─────────────┘
      ⚔          ← 交叉剑图标
     ◯◯◯         ← 红色进度圈
   (  ○  )       ← 半透明红色背景
```

## 示例配置

### 井陉之战（使用坐标）

```javascript
{
    id: "battle_of_jingxing",
    year: -204,
    season: 0,
    title: "井陉之战",
    description: "汉军韩信，千里迂回，在井陉关与赵军背水一战。",
    actions: [
        {
            type: "field_battle",
            location: { latitude: 38.03, longitude: 114.15 },
            battleName: "井陉之战",
            factions: [
                { factionId: "qi", troops: 10000 },
                { factionId: "zhao", troops: 10000 }
            ]
        },
        {
            type: "transfer_city",
            cityId: "handan",
            fromFactionId: "zhao",
            toFactionId: "qi"
        }
    ]
}
```

### 彭城之战（使用城市ID）

```javascript
{
    id: "battle_of_pengcheng",
    year: -205,
    season: 1,
    title: "彭城之战",
    description: "汉军挺进楚都彭城，项羽率军突袭，楚汉决战彭城。",
    actions: [
        {
            type: "field_battle",
            location: "xuzhou",
            battleName: "彭城之战",
            factions: [
                { factionId: "qi", troops: 10000 },
                { factionId: "chu", troops: 10000 }
            ]
        },
        {
            type: "transfer_city",
            cityId: "luoyang",
            fromFactionId: "qin",
            toFactionId: "qi"
        }
    ]
}
```

## 注意事项

1. **location 推荐使用坐标**：更精确，可以在任意位置显示战场
2. **duration 字段可以删除**：会自动计算，保留也不影响（会被覆盖）
3. **兵力固定10000**：遵循野战规则，双方各10000兵
4. **战斗名称必填**：否则显示为"野战"

## 更新日志

- **2025-11-02**: 战斗时长改为自动计算，基于双方总兵力
- **2025-11-02**: location 支持坐标对象格式
- **2025-11-02**: 删除进度百分比显示
- **2025-11-02**: 增强野战UI显示效果
