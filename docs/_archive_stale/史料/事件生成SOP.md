# 战争事件数据生成 — 标准作业程序 (SOP)

> **项目核心目标：** 写好2000年中国战争史的所有事件，每个事件都要环环相扣。完善中国两千年的战争史事件。
> 
> **参考资料：**
> 1. `D:\MAPWARSJ\战争史料收集_总纲.md`
> 2. `D:\MAPWARSJ\史料\01秦朝\02战国秦朝战争史.md`
> 3. `D:\MAPWARSJ\史料\01秦朝\04秦朝军事史.txt`
>
> **适用对象：** 任何需要向 MAPWAR 项目添加历史战争事件的 AI
> **最后更新：** 2026-02-26
> **版本：** 1.1

---

## 一、项目结构速查

```
D:\MAPWARSJ\
├── src\data\events\             ← 事件数据文件（你的主要工作目录）
│   ├── index.ts                 ← 聚合所有时代的事件并按年份排序
│   ├── index_01_qin.ts          ← 秦朝 (示范文件，已完成)
│   ├── index_02_han.ts          ← 汉朝 (半完成)
│   ├── index_03_three_kingdoms.ts ~ index_14_late_qing.ts ← 待完成
│   └── ...
├── src\data\cities.ts           ← 城市数据库 (城市ID必须从这里查)
├── src\data\factions.ts         ← 势力数据库 (势力ID必须从这里查)
├── src\types\core.ts            ← TypeScript 类型定义 (SiegeData, FieldBattleData等)
├── 史料\                        ← 原始历史参考文档 (按时代分文件夹)
│   ├── 01秦朝\
│   ├── 02汉朝\ ... 14晚清\
│   └── 战争文案提示词.md        ← 描述文字的风格规范
├── 战争史料收集_总纲.md          ← 全部上千场战役的主清单
└── validate_events.ts           ← 验证脚本 (检查所有ID是否合法)
```

---

## 二、核心铁律（违反任何一条都会导致游戏崩溃）

### 🔴 规则1：所有 ID 必须来自数据库
- `defenderCityId` / `attackerCityId` → 必须在 `cities.ts` 中存在
- `attackerFactionId` / `defenderFactionId` → 必须在 `factions.ts` 中存在
- **绝对禁止** 凭空编造 ID（如 `city_xxx`），必须先用 `grep_search` 在 `cities.ts` 中搜索

### 🔴 规则2：每个事件必须有 title
- `title` 字段是必填的，用于 UI 显示
- 示例：`"秦灭赵之战"` `"秦楚巨鹿之战"` `"大泽乡起义"`

### 🔴 规则3：字符串中不能有裸双引号
- ❌ `"自称"始皇帝"。"` → 会导致TS编译错误
- ✅ `"自称「始皇帝」。"` → 用中文角引号替代

### 🔴 规则4：完成后必须运行验证
```bash
npx vite-node validate_events.ts
```
输出必须是 `All City IDs and Faction IDs in EVENTS_QIN are valid!`

---

## 三、势力ID映射表 (按历史系统划分)

| 势力ID | 系统/主线 | 颜色 | 包含的代表朝代/民族 |
|--------|----------|------|--------------------|
| `zhonghua` | **中原主线** | 红 | **汉**、魏晋、南朝、隋唐、宋明 |
| `huaxia` | **西部附属** | 黑 | **秦**、新朝、蜀汉 |
| `tianchao` | **东南附属** | 蓝 | **吴楚**、东吴、五代十国等东南政权 |
| `huihui` | **匈奴系统** | 黄 | 匈奴、高车、回纥、突厥、维吾尔 |
| `menggu` | **蒙古系统** | 青 | 鲜卑、契丹、蒙古 |
| `manzhou` | **女真系统** | 金 | 渤海、女真、满洲 |
| `chaoxian` | **朝鲜系统** | 绿 | 高句丽、高丽、新罗、朝鲜 |
| `dianmian` | **滇缅系统** | 棕 | 南诏、大理、缅甸 |
| `yuenan` | **百越系统** | 嫩绿 | 越、南越、大越 |

> ⚠️ **势力主线判定**：中原大统一王朝使用 `zhonghua` 为主线。秦、蜀汉等偏西政权归入 `huaxia`。

---

## 四、两种事件类型详解

### 4.1 攻城战 `siege`
**适用场景：** 围攻城池、夺取要塞、攻克都城、起义占城

```typescript
{
    "year": -230,                              // 年份（负数=公元前，必填）
    "regnalYear": "秦王政十七年",               // 年号（必填，UI依赖此精确展示年号）
    "title": "秦灭韩之战",                      // 标题（必填）
    "season": 0,                               // 0春 1夏 2秋 3冬
    "description": "秦王政命内史腾率军...",       // 描述（硬核军语风）
    "type": "siege",
    "siegeData": {
        "attackerFactionId": "huaxia",          // 攻方势力（必填）
        "defenderCityId": "city_xinzheng",      // 目标城市（必填，从cities.ts查）
        "attackerCityId": "city_xxx",           // 出发城市（可选）
        "attackerSourceLocation": {             // 或者直接给坐标（可选，二选一）
            "lat": 33.51, "lng": 117.09
        },
        "legionName": "秦-内史腾军",             // 军团名（必填）
        "attackerTroops": 100000,               // 兵力（可选）
        "result": "attacker_win",               // 结果
        "afterBattleChain": [                   // 战后指令链（可选）
            { "action": "move_to_city", "targetCityId": "city_xxx" },
            { "action": "garrison" }
        ],
        "destroyAfterBattle": true              // 战后双方所有军队解散（可选）
    }
}
```

**出发位置**优先级：`attackerSourceLocation` > `attackerCityId` > 不填（凭空生成在目标城市附近）

**afterBattleChain 动作：**
| 动作 | 说明 |
|------|------|
| `garrison` | 胜利后驻守（留在城里） |
| `move_to_city` | 移动到另一城市（需要 `targetCityId`） |
| `destroy` | 军团解散（仅解散当前执行指令的军队） |
| `attack_city` | 继续攻击下一城（需要 `targetCityId`） |

> 💡 **快捷清场标签 (推荐)**：如果希望战后**交战双方的所有残留军队全部消失**，请不要使用繁琐的 chain，直接在 `siegeData` 或 `fieldBattleData` 的最外层添加 `"destroyAfterBattle": true` 即可。

### 4.2 野战 `field_battle`
**适用场景：** 平原决战、追击战、遭遇战

```typescript
{
    "year": -208,                              // 年份（必填）
    "regnalYear": "秦二世二年",                  // 年号（必填，UI依赖此精确展示年号）
    "title": "巨鹿之战",
    "season": 2,
    "description": "项羽破釜沉舟...",
    "type": "field_battle",
    "fieldBattleData": {
        "attackerFactionId": "tianchao",         // 攻方势力
        "defenderFactionId": "huaxia",           // 守方势力
        "attackerLegionName": "楚-项羽军",        // 攻方军团名
        "defenderLegionName": "秦-王离军",        // 守方军团名
        "attackerTroops": 50000,                 // 攻方兵力
        "defenderTroops": 200000,                // 守方兵力（可选）
        "locationCityId": "city_julu",           // 战场据点ID（必填，来自 cities.ts。注：如果在城池附近野战，直接填城池ID即可，无需新建bf_前缀的野战点，如井陉之战填 city_jingxingkou，巨鹿之战填 city_julu）
        "result": "attacker_win",                // 结果
        "attackerSourceCityId": "city_xxx",      // 攻方出发城市（可选）
        "defenderSourceCityId": "city_xxx",      // 守方出发城市（可选）
        "afterBattle": "siege",                  // 战后动作（可选）
        "afterBattleTargetCityId": "city_julu",  // 战后目标城市
        "siegeAfterBattleChain": [],             // 攻城后续指令
        "destroyAfterBattle": true               // 战后双方所有军队解散（可选）
    }
}
```

**野战的 afterBattle：** 野战攻击方胜利后可以衔接攻城（`"siege"`）、移动（`"move_to_city"`）或驻扎（`"garrison"`）。如果不填对应指令，胜方默认留在原地的战场上。




## 五、标准工作流程（每个时代重复执行）

### 步骤1：确认目标范围
1. 打开 `战争史料收集_总纲.md`
2. 找到该时代对应的战役清单
3. 筛选核心战役（标准见下方）

### 步骤2：查缺城市和势力
```bash
# 搜索某个城市是否存在
grep_search "邯郸" cities.ts  # 或搜拼音 "handan"

# 如果不存在，需要先在 cities.ts 中添加
```

### 步骤3：阅读史料
- 对应的史料在 `史料\XX时代\` 文件夹下
- 阅读 `战争文案提示词.md` 了解描述文字风格要求

### 步骤4：编写事件
- 直接在对应的 `index_XX_xxx.ts` 文件中编写TypeScript代码
- 每个时代一个文件，按年份从早到晚排列
- 参考 `index_01_qin.ts` 开头的样本模板

### 步骤5：验证
```bash
npx vite-node validate_events.ts
```
必须输出 `All City IDs and Faction IDs ... are valid!`

### 步骤6：列出所有事件确认覆盖率
```bash
npx vite-node list_events.ts  # 修改此脚本以导入对应时代
```
检查：无重复、无缺标题、年份范围正确

---

## 六、战役筛选标准

### ✅ 必做
- 改变了版图/政权的**决定性战役**（赤壁、淝水、萨尔浒）
- 连续的**征服战争链**（秦灭六国、蒙古西征）
- 有明确双方、地点、结果的**主要战役**
- 重大起义的**关键节点**（大泽乡起义、巨鹿之战）

### ✅ 应做
- 统一战争的**每一步**（如刘秀统一战争的逐步推进）
- 重大**政治事件**作为 narrative（如荆轲刺秦、沙丘之变）

### ❌ 跳过
- 无法确定地点的小规模起义
- 同年重复的多次小冲突 → 合并为一个事件

---

## 七、描述文字风格（摘自 战争文案提示词.md）

1. **白话句式，专业词汇**：主谓宾结构，使用硬核军语
2. **短句为主**：四字、六字短语，斩钉截铁
3. **去虚留实**：少用"之、乎、者、也"

**词汇替换表：**
| ❌ 不要写 | ✅ 要写 |
|-----------|---------|
| 部队集合 | 集结 / 屯兵 |
| 发动进攻 | 进剿 / 攻略 / 挺进 |
| 占领了 | 克 / 拔 / 下 |
| 被打败了 | 溃 / 败绩 |
| 非常困难 | 维艰 / 势成胶着 |
| 粮食不够 | 粮秣不继 |

---

## 八、常见错误与排查

| 错误现象 | 原因 | 修复方法 |
|----------|------|----------|
| TS编译错误 `',' expected` | 字符串中有裸双引号 | 用 `「」` 替换 `""` |
| 验证输出 `Invalid defenderCityId` | 城市ID在 cities.ts 中不存在 | grep搜索正确ID，或添加新城市 |
| 验证输出 `Invalid attackerFactionId` | 势力ID拼写错误 | 对照势力映射表 |
| 事件重复 | 多个会话分别生成了相同战役 | 运行 list_events.ts 去重 |
| 事件缺 title | AI生成时遗漏了 | 逐一补上 |
| 事件不按年份出现 | index.ts 会自动排序 | 无需手动排序，但同年事件用 season 控制先后 |

---

## 九、添加新城市/据点的方法

如果某个战役需要的地点在 `cities.ts` 中不存在，**必须立即新建**，遵循以下命名规则：

1. **ID (id)**：
   - 城市据点：使用该据点的**现代名称/拼音**（例如：成都用 `chengdu`，北京用 `beijing`）。
   - 野战专门据点：必须带 `bf_` 前缀，如 `bf_julu` (巨鹿郊外)。但**注意**：如果是发生在已有城池据点附近的野战（如井陉之战、巨鹿之战），直接填该城池的 ID 即可，**绝对不要**画蛇添足新建一个 `bf_` 的据点。
2. **名称 (name)**：使用该城市在**历史当时的古代名称**（例如：秦朝的成都要写成 `成都`，燕国的北京要写成 `蓟`）。
3. **类型 (type)**：游戏地图上有多种据点类型，请根据史实选择最合适的规模：
   - `big_city`: 大城（如国都、重镇）
   - `medium_city`: 中城（如郡治）
   - `small_city`: 小城（如普通县邑）
   - `pass`: 关隘（如函谷关、虎牢关）
   - `ferry`: 渡口（如蒲坂津、白马津）
   - `battlefield`: 战役地（仅限前无村后无店，纯粹为了打野战而加的坐标点）

```typescript
// 在 cities.ts 的 CITIES 数组中添加示例
{ 
  id: 'beijing',            // [ID] 现代名/拼音 (必填)
  name: '蓟',               // [名称] 历史当时的古代名 (必填)
  factionId: 'chaoxian',    // 初始所属势力
  lat: 39.90,               // 纬度
  lng: 116.40,              // 经度
  type: 'big_city',         // 类型 (big_city | medium_city | small_city | pass | ferry | battlefield)
  troops: 10000,
  startYear: -1000          // 出现的起始年份
}
```

---

## 十一、战役命名规范 (title)

为了保持全时代数据的一致性，战役标题必须严格遵循以下公式：

### 公式 A：标准遭遇战
> **[攻方势力名] + [守方势力名] + [战争地点] + "之战"**

- ❌ 秦攻赵阏与之战 (错误：中间严禁掺杂"攻"、"击"、"伐"等动词)
- ❌ 秦灭赵之战 (不推荐，请使用公式B)
- ✅ **秦赵阏与之战**
- ✅ **秦赵邯郸之战**
- ✅ **楚秦棘原之战**

### 公式 B：灭国战争
> **[攻方名] + "灭" + [守方名] + "之战"**

- ✅ **秦灭韩国之战**
- ✅ **汉灭西羌之战**

> ⚠️ 注意：势力名要简洁，如 "秦赵" 而非 "大秦大赵"。

---

## 十、index.ts 聚合机制

`src/data/events/index.ts` 会自动导入所有14个时代的事件并按 `year` + `season` 排序。
你只需要在对应的 `index_XX_xxx.ts` 文件中 export 一个数组即可，聚合器会自动处理。

```typescript
// 每个时代文件的标准格式
import { HistoricalEvent } from '../../types/core';

export const EVENTS_XXX: HistoricalEvent[] = [
    // ... 事件数据
];
```
