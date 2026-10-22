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

# 势力清理与修复计划

## 一、STARTING_CAPITALS city ID 共用修复

### 1. city_lanshi (蓝氏城) → 仅保留 yuezhi(月氏)
- 删除 `daxia` 势力（ factions.ts / SandboxDisplayNames / CityAssetManager / GameApp STARTING_CAPITALS / EventParser / cities_v2 ）
- 保留 `yuezhi` → city_lanshi

### 2. city_dunhuang (敦煌) → 新建归义
- 删除 `shazhou`（沙州）势力
- 删除 `cao`（曹氏归义军）势力
- 创建新势力 `guiyi`（归义），占领敦煌
- city_dunhuang 的 factionId 改为 `guiyi`
- 注：原 `cao` 的 flagText 是 '归义'，可复用

### 3. city_hami (哈密卫) → 仅保留 yiwu(伊吾)
- 删除 `hami`（哈密）势力
- 保留 `yiwu`（伊吾）→ city_hami

### 4. city_wuling (武陵) → 仅保留 zhongxiang(钟相)
- 删除 `wulingman`（武陵蛮）势力
- 保留 `zhongxiang`（钟相）→ city_wuling

### 5. city_guangzhou (广州) → 仅保留 yue(越国)
- 删除 `shangke`（尚可喜）势力
- 删除 `shaowu`（绍武）势力
- 保留 `yue`（越国）→ city_guangzhou

## 二、旗号重复 → 删除重复的 faction

### 需删除的势力（共13个）：
| faction ID | 当前 name | 当前 flagText | 当前据点 |
|-----------|-----------|--------------|---------|
| daxia | 大夏 | 大夏 | 蓝氏城(已删除) |
| menggu | 蒙古 | 蒙古 | 无都城 |
| liu_liu_qi | 刘 | 刘 | 文安 |
| bai | 白 | 白 | 克孜尔 |
| gao_d | 高 | 高 | 信都 |
| duan_shi | 段 | 段 | 通海 |
| zhangrong | 张 | 张 | 历城 |
| nong | 侬 | 无 | 无 |
| yaglakar | 药罗葛 | 药罗 | 仙娥河 |
| yaoluoge | 药罗葛 | 药罗 | 扎布汗河 |
| shazhou | 沙州 | ? | 敦煌(已删除) |
| cao | 曹 | 归义 | 敦煌(已删除) |
| hami | 哈密 | ? | 哈密(已删除) |
| wulingman | 武陵蛮 | ? | 武陵(已删除) |
| shangke | 尚 | ? | 广州(已删除) |
| shaowu | 绍武 | ? | 广州(已删除) |

## 三、新建

### 新建势力：归义 (guiyi)
- 据点：敦煌（city_dunhuang）
- 旗号：归义
- 说明：取代原有的 cao 和 shazhou

### 新建势力：药罗葛 (yaoluoge) — 保留ID
- 据点：娑陵（新城市）
- 坐标：lat=49.38, lng=103.87
- 旗号：药罗葛
- 说明：取代原有的 yaglakar 和 yaoluoge，新建 city_suoling

## 四、需要修改的文件清单

每个被删除的 faction 需在以下文件中移除：
1. `src/data/factions.ts` — 删除定义
2. `src/data/SandboxDisplayNames.ts` — 删除旗号
3. `src/core/CityAssetManager.ts` — 删除 factionFlagMap + _legacy_sandbox_dict
4. `src/core/GameApp.ts` — 删除 STARTING_CAPITALS
5. `src/core/EventParser.ts` — 删除别名（如有）
6. `src/data/cities_v2.ts` — 删除或修改相关城市的 factionId

需新增的：
1. `src/data/factions.ts` — 添加 guiyi 定义
2. `src/data/SandboxDisplayNames.ts` — 添加 guiyi 旗号
3. `src/core/CityAssetManager.ts` — 添加 guiyi
4. `src/core/GameApp.ts` — 添加 guiyi → city_dunhuang
5. `src/data/cities_v2.ts` — 添加 city_suoling（娑陵），修改 city_dunhuang 的 factionId
