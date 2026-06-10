# 待审计 19 势力 — AI 任务书（复制整份给其他 AI）

> **你不用猜级别数字。** 只定「史实类别 + 一句依据」；级别/旗形由 `factionTierClassify.ts` 自动算。  
> **项目主人**只裁定：删势力、改据点、拿不准条目。

---

## 一、你要做什么（交付物）

对 `scratch/faction_tier_pending_audit.json` 里 **19 条** `pendingAudit`，每条给出：

| 字段 | 必填 | 取值 |
|------|------|------|
| `auditCategory` | 是 | `民族` \| `政权` \| `家族` \| `州郡` \| `起义` \| `删势力` \| `维持panjun` \| `待定` |
| `auditNote` | 是 | 一句话：**史籍出处或治所/民族渊源**（无依据写「无据，建议删」） |
| `recommendedAction` | 是 | `写入ethnic` \| `写入regime` \| `写入family` \| `写入county` \| `写入TIER6` \| `batch-delete` \| `改绑第二首都` \| `仅备注` |

**然后**（不是只改 pending JSON）：

1. 确认项 → **追加**到对应 `scratch/*_audit.json`（格式见 §四）
2. 删势力 → FactionEditor `/api/batch-delete` 或同步删 5 文件
3. 跑验证：`npm run tier:check` → `npm run tier:export` → `node scratch/export_faction_tier_pending.mjs`  
   **成功标准：pending 从 19 降为 0（或仅剩「待定」且主人已签字）**

---

## 二、你先读什么

1. 根目录 `AGENTS.md` — §4.1 五级优先级、§4.8 宁缺毋滥  
2. `scratch/FACTION_TIER_AUDIT_GUIDE.md` — 判定顺序、1 级锁定  
3. `src/data/factionTierClassify.ts` — 运行时规则  
4. 本文件 §五 — 19 条清单 + 已知线索

**禁止**：`git checkout/restore/reset`；无据胡编；挪据点坐标；把秦汉唐级 id 写进 family 表。

---

## 三、怎么定类别（决策树）

对**每一个** pending 势力，按顺序只选**最高一级**有**可考史料**的身份：

```
1 民族（发源地/极深厚渊源）→ auditCategory=民族 → 2级，旗形43
2 政权（原生政权首都+正式国号）→ 政权 → 1级(单字国号)或3级(二字)
3 郡治 → 州郡 → 4/5级
4 家族大本营 → 家族 → 4/5级
5 州名 → 州郡 → 4/5级
6 农民军/短命起义 → 起义 → 6级
7 以上皆无可靠依据 → 删势力 或 据点改 panjun（§4.8）
8  genuinely 无法查证 → auditCategory=待定 + 说明缺什么史料
```

**铁律**

| 旗号 | 定类 | 反例 |
|------|------|------|
| 苻、袁、邹（姓） | 家族 4/5 | ❌ 不能政权/1级 |
| 秦、汉、唐（国号） | 已在种子表，不应出现在 pending | — |
| 月氏、工布、汪古 | 民族专名，整词不截字 | ❌ 不能当州郡 |
| 西秦、百济、大顺 | 二字国号 → 政权 3级 | ❌ 不能 1级 |
| 无据关隘/小堡 | panjun 或删点 | ❌ 不能硬升格 |

**级别不用你填**：写入审计表后自动为 2/3/4/5/6；仅 `TIER1_REGIME_SEED` 单字国号才是 1 级。

---

## 四、写入格式（追加到 audit JSON）

### 民族 → `scratch/ethnic_homeland_audit.json`

```json
{
  "factionId": "gongbu",
  "flag": "工布",
  "cityId": "city_nichi",
  "cityName": "太昭",
  "priority": 1,
  "type": "民族",
  "auditStatus": "ok",
  "note": "工布地区/工布土王，治所工布江达一带"
}
```

### 政权 → `scratch/regime_capital_audit.json`

```json
{
  "id": "xxx",
  "flag": "正式国号",
  "cityId": "city_xxx",
  "cityName": "据点名",
  "priority": 2,
  "type": "政权",
  "auditStatus": "ok",
  "note": "史籍国号+首都依据"
}
```

### 家族 → `scratch/family_state_audit.json`

```json
{
  "id": "zou",
  "flag": "邹",
  "cityId": "city_wenzhou",
  "cityName": "永嘉",
  "priority": 4,
  "type": "家族",
  "auditStatus": "ok",
  "note": "邹氏与大邹国/邹地渊源（须可考）"
}
```

### 州郡 → `scratch/county_seat_audit.json`

```json
{
  "id": "xxx",
  "flag": "郡名或州名",
  "cityId": "city_xxx",
  "cityName": "据点名",
  "priority": 3,
  "type": "郡治",
  "jun": "郡名",
  "auditStatus": "ok",
  "note": "某郡治所"
}
```

### 起义 → `src/data/factionTierClassify.ts` 的 `TIER6_UPRISING` 加 id

---

## 五、19 条清单 + 已知线索（AI 从这里查史料定案）

| id | 旗号 | 据点 | 现暂级 | 线索 / 注意 |
|----|------|------|--------|-------------|
| `bade` | 巴德 | 彭迪 | 4 | ⚠ 彭迪=中亚 Badakhshan，≠ 藏区巴底土司；**大概率删势力或换第二据点** |
| `daca` | 达擦 | 八宿宗 | 4 | 藏区达擦族/林周一带；据点是否应为 **甘丹曲果** 等，需史料；勿用玛旁雍错 |
| `dalung` | 达隆 | 类乌齐 | 4 | 达隆塘/达隆巴；类乌齐或 **热振** 方向，需定治所 |
| `gangdisi` | 冈底 | 玛旁雍错 | 4 | ⚠ 玛旁雍错非治所；古格在 **札达**；冈底斯是山系名，可能删或改绑 |
| `gongbu` | 工布 | 太昭 | 4 | 倾向 **民族**「工布」@ 太昭（工布江达） |
| `ningjing` | 宁静 | 芒康宗 | 4 | 宁静县/茶马道；定民族还是政权小邦 |
| `pulige` | 普里 | 喀吉尔 | 4 | 普兰/普里地区；喀吉尔坐标需核对 |
| `paluan` | 帕銮 | 双河城 | 4 | 东南亚/澜沧；查帕銮国 |
| `sapi` | 萨毗 | 悉万斤 | 4 | 萨毗国（西域）；悉万斤=撒马尔罕？核对据点 |
| `yutou` | 郁头 | 握瑟德 | 4 | 西域郁头国；握瑟德据点名需可考 |
| `tashili` | 踏实 | 姑衍山 | 4 | 匈奴姑衍山祭天？大概率 **删或 panjun** |
| `taiyuan` | 泰沅 | 清坎城 | 4 | 老挝/兰沧 **清坎**；定政权还是民族 |
| `songlin` | 松林 | 越嶲 | 4 | 西南林区；查是否州郡/家族 |
| `toutuo` | 头陀 | 政和 | 4 | 政和=福建县名；头陀国？易混，需删或改 |
| `chen3` | 月支 | 大木岳 | 4 | ⚠ 已有民族 `yuezhi` 月氏；**可能重复，删并或改旗号** |
| `jing` | 京 | 华闾 | 5 | 林邑/京族？华闾=越南；定民族「京」或删 |
| `li_s` | 里 | 合浦 | 5 | 里族？合浦=岭南；无据则删 |
| `huang_tianzhou` | 瓦 | 横山 | 5 | 横山≠瓦；党项/横山一带；查正式旗号 |
| `zou` | 邹 | 永嘉 | 5 | 邹姓/邹国；永嘉=温州；倾向 **家族** 若可考 |

---

## 六、项目主人只需裁定的事（AI 标「需主人」）

AI 在 `auditNote` 末尾加 `[需主人]` 当遇到：

1. **删势力** vs **改第二首都**（≥50km）  
2. **撞旗**（旗号全局已占用）  
3. **据点据点名/坐标要改**（防重或删小留大）  
4. **与已有势力重复**（如 chen3 月支 vs yuezhi）  
5. **史料两可**，两种类别都说得通  

主人回复格式：`id: 裁定结果（一句话）`

---

## 七、AI 汇报模板（每批结束）

```
本批审计：#1–#10
写入 ethnic: 2 | regime: 0 | family: 3 | county: 1 | 删势力: 2 | 待定: 2
需主人: bade, gangdisi, chen3
npm run tier:check → pass
pending 剩余: 9
```

---

## 八、推荐批次

- **批 1（藏 7）**：bade, daca, dalung, gangdisi, gongbu, ningjing, pulige  
- **批 2（西域/南亚 4）**：paluan, sapi, yutou, taiyuan  
- **批 3（华南/一字 5）**：jing, li_s, zou, huang_tianzhou, chen3  
- **批 4（存疑 3）**：songlin, toutuo, tashili  

每批 ≤10 条，批批验证 pending 下降。
