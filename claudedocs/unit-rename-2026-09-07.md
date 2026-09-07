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

# 兵种重命名（2026-09-07）

格式：**文化 + 特征 + 档次**（档次 = 精锐 / 高级 / 重装）。

| id | 原名 | 新名 |
|---|---|---|
| `helepolis` | 希腊赫勒波利斯攻城塔 | **希腊赫勒波利斯攻城塔重装** |
| `siege_onager` | 重型攻城投石车 | **欧洲重型投石车重装** |
| `antiquity_siege_onager` | 古典重型投石车 | **古典重型投石车重装** |
| `houfnice` | 榴弹炮 | **波希米亚榴弹炮重装** |
| `elephant` | 象兵 | **南亚战象** |
| `traction_trebuchet` | 牵引投石机 | **华夏牵引投石机重装** |
| `onager` | 中型投石车 | **欧洲中型投石车高级** |
| `antiquity_onager` | 古典中型投石车 | **古典中型投石车高级** |
| `siege_elephant` | 攻城战象 | **南亚攻城战象重装** |
| `envoy` | 使者 | **欧洲使者** |
| `sannahya` | 孔雀王朝桑纳亚战象 | **孔雀桑纳亚战象精锐** |
| `bombard_cannon` | 火炮 | **欧洲攻城火炮重装** |
| `mangonel` | 轻型投石车 | **欧洲轻型投石车** |
| `frankish_paladin` | 法兰克圣骑士 | **法兰克圣骑士精锐** |
| `siege_tower` | 攻城塔 | **欧洲攻城塔** |
| `jarl` | 维京首领骑兵 | **维京首领骑兵精锐** |
| `shock_cavalry` | 冲击重骑兵 | **希腊化冲击骑兵重装** |
| `heavy_scorpion` | 重型弩炮 | **欧洲重型弩炮重装** |
| `imperial_centurion` | 帝国百夫长 | **罗马百夫长重装** |
| `antiquity_heavy_scorpion` | 古典重型弩炮 | **古典重型弩炮重装** |
| `general_cavalry` | 虎豹骑 | **华夏虎豹骑精锐** |
| `flamethrower` | 华夏猛火油柜 | **华夏猛火油柜重装** |
| `scythian_axe_cavalry` | 斯基泰斧骑兵 | **斯基泰斧骑兵精锐** |
| `mounted_trebuchet` | 骆驼投石机 | **沙漠骆驼投石机高级** |
| `sunda_royal_fighter` | 巽他皇家战士 | **爪哇巽他皇家战士精锐** |
| `sosso_guard` | 西非索索禁卫军 | **西非索索禁卫军精锐** |
| `siege_ram` | 重型攻城槌 | **欧洲重型攻城槌重装** |
| `antiquity_siege_ram` | 古典重型攻城槌 | **古典重型攻城槌重装** |
| `companion_cavalry` | 马其顿伙伴骑兵 | **马其顿伙伴骑兵精锐** |
| `ekdromos` | 埃克德罗摩斯 | **希腊埃克德罗摩斯精锐** |
| `aztec_raider` | 阿兹特克突袭者 | **阿兹特克突袭者精锐** |
| `heavy_cavalry` | 重骑兵 | **欧洲重骑兵重装** |
| `xolotl_warrior` | 阿兹特克索洛特尔骑兵 | **阿兹特克索洛特尔骑兵精锐** |
| `hippeus` | 斯巴达希皮乌斯 | **斯巴达希皮乌斯精锐** |
| `paragon` | 圣殿楷模武士 | **十字军圣殿楷模武士精锐** |
| `siege_ballista` | 攻城床弩车 | **华夏攻城床弩车重装** |
| `ballista` | 元戎弩 | **华夏元戎弩高级** |
| `scorpion` | 弩炮 | **欧洲弩炮** |
| `jian_swordsman` | 华夏刀剑手 | **华夏刀剑手精锐** |
| `jian_swordman_shielded` | 持盾刀剑手 | **华夏持盾刀剑手精锐** |
| `equites` | 罗马伴随骑士 | **罗马伴随骑士精锐** |
| `shield` | 近卫兵 | **欧洲近卫兵精锐** |
| `imperial_camel_rider` | 印度斯坦帝国骆驼骑兵 | **印度斯坦骆驼骑兵重装** |
| `royal_janissary` | 皇家苏丹亲兵 | **奥斯曼皇家亲兵精锐** |
| `sakan_axeman` | 萨迦斧兵 | **塞种萨迦斧兵精锐** |
| `warrior_priest` | 亚美尼亚修士战士 | **亚美尼亚修士战士精锐** |
| `camel_raider` | 骆驼突袭者 | **沙漠骆驼突袭者高级** |
| `winged_hussar` | 翼骑兵 | **波兰翼骑兵精锐** |
| `capped_ram` | 装甲攻城槌 | **欧洲装甲攻城槌高级** |
| `strategos` | 雅典将军卫队 | **雅典将军卫队精锐** |
| `antiquity_capped_ram` | 古典装甲攻城槌 | **古典装甲攻城槌高级** |
| `jian_swordman_unshielded` | 华夏双手剑士 | **华夏双手剑士精锐** |
| `condottiero` | 佣兵 | **意大利佣兵精锐** |
| `two_handed_swordsman` | 双手剑士 | **欧洲双手剑士** |


## 补充：「精锐」只留给城堡兵的升级档（2026-09-07 主人定）

以下 31 个 id 不是 `elite_*` 升级档，档次词由「精锐」改为「高级」。

| id | 原名 | 新名 |
|---|---|---|
| `aztec_raider` | 阿兹特克突袭者精锐 | **阿兹特克突袭者高级** |
| `sunda_royal_fighter` | 爪哇巽他皇家战士精锐 | **爪哇巽他皇家战士高级** |
| `frankish_paladin` | 法兰克圣骑士精锐 | **法兰克圣骑士高级** |
| `jarl` | 维京首领骑兵精锐 | **维京首领骑兵高级** |
| `shield` | 欧洲近卫兵精锐 | **欧洲近卫兵高级** |
| `jian_swordsman` | 华夏刀剑手精锐 | **华夏刀剑手高级** |
| `savar` | 波斯萨瓦尔重骑精锐 | **波斯萨瓦尔重骑高级** |
| `champion` | 欧洲冠军剑士精锐 | **欧洲冠军剑士高级** |
| `paladin` | 欧洲游侠精锐 | **欧洲游侠高级** |
| `legionary` | 罗马军团步兵精锐 | **罗马军团步兵高级** |
| `general_cavalry` | 华夏虎豹骑精锐 | **华夏虎豹骑高级** |
| `companion_cavalry` | 马其顿伙伴骑兵精锐 | **马其顿伙伴骑兵高级** |
| `condottiero` | 意大利佣兵精锐 | **意大利佣兵高级** |
| `ekdromos` | 希腊埃克德罗摩斯精锐 | **希腊埃克德罗摩斯高级** |
| `hippeus` | 斯巴达希皮乌斯精锐 | **斯巴达希皮乌斯高级** |
| `qizilbash_warrior` | 波斯红头骑士精锐 | **波斯红头骑士高级** |
| `royal_janissary` | 奥斯曼皇家亲兵精锐 | **奥斯曼皇家亲兵高级** |
| `sacred_band` | 希腊底比斯圣队精锐 | **希腊底比斯圣队高级** |
| `sannahya` | 孔雀桑纳亚战象精锐 | **孔雀桑纳亚战象高级** |
| `scythian_axe_cavalry` | 斯基泰斧骑兵精锐 | **斯基泰斧骑兵高级** |
| `strategos` | 雅典将军卫队精锐 | **雅典将军卫队高级** |
| `sakan_axeman` | 塞种萨迦斧兵精锐 | **塞种萨迦斧兵高级** |
| `warrior_priest` | 亚美尼亚修士战士精锐 | **亚美尼亚修士战士高级** |
| `winged_hussar` | 波兰翼骑兵精锐 | **波兰翼骑兵高级** |
| `xolotl_warrior` | 阿兹特克索洛特尔骑兵精锐 | **阿兹特克索洛特尔骑兵高级** |
| `jian_swordman_unshielded` | 华夏双手剑士精锐 | **华夏双手剑士高级** |
| `sosso_guard` | 西非索索禁卫军精锐 | **西非索索禁卫军高级** |
| `jian_swordman_shielded` | 华夏持盾刀剑手精锐 | **华夏持盾刀剑手高级** |
| `paragon` | 十字军圣殿楷模武士精锐 | **十字军圣殿楷模武士高级** |
| `equites` | 罗马伴随骑士精锐 | **罗马伴随骑士高级** |
| `crusader_knight` | 欧洲十字军骑士精锐 | **欧洲十字军骑士高级** |


## 补充二：查 DE 本体分清专属兵 / 通用线（2026-09-07）

判据 = DE 单位说明里有没有「X unique …」字样。以下 8 个是专属兵的 elite 升级档，档次词由「高级」改回「精锐」；
另修「精锐华夏戟兵」的词序（档次词必须在最后）。

| id | 原名 | 新名 | DE 判定 |
|---|---|---|---|
| `elite_blackwood_archer` | 图皮黑木弓箭手高级 | **图皮黑木弓箭手精锐** | Tupi unique |
| `elite_bolas_rider` | 马普切套索骑兵高级 | **马普切套索骑兵精锐** | Mapuche unique |
| `elite_guecha_warrior` | 穆伊斯卡格查勇士高级 | **穆伊斯卡格查勇士精锐** | Muisca unique |
| `elite_ibirapema_warrior` | 图皮战棍勇士高级 | **图皮战棍勇士精锐** | Tupi unique |
| `elite_kona` | 马普切科纳勇士高级 | **马普切科纳勇士精锐** | Mapuche unique |
| `elite_konnik_foot` | 锤炼兵高级 | **锤炼兵精锐** | Bulgarian unique |
| `elite_shrivamsha_rider` | 什里瓦姆沙骑手高级 | **什里瓦姆沙骑手精锐** | Gurjara unique |
| `elite_temple_guard` | 穆伊斯卡神庙守卫高级 | **穆伊斯卡神庙守卫精锐** | Muisca unique |
| `ji_infantry_elite` | 精锐华夏戟兵 | **华夏戟兵精锐** | 项目自造·词序修正 |


## 补充三：按 DE 字符串分段定文明归属（2026-09-07）

DE `key-value-strings-utf8.txt` 里**同一段连号 id 就是同一个文明的兵表**。
`405001-405053` 那段（Immortal / Strategos / Hippeus / Hoplite / Lembos 四档 /
Lancer → Shock Cavalry → Imperial Cavalry / Sparabara / Sakan Axeman）
= 《Chronicles: Battle for Greece》希腊-阿契美尼德那批。据此：

| id | 原名 | 新名 | 依据 |
|---|---|---|---|
| `shock_cavalry` | 希腊化冲击骑兵重装 | **波斯冲击铁骑高级** | 尖顶盔+札甲马铠的具装形制；DE 里是 Lancer→Shock Cavalry→Imperial Cavalry 马厩线，同段配 Sparabara/Immortal |
| `imperial_cavalry` | 拜占庭骑兵重装 | **波斯具装铁骑重装** | DE 原文「Upgrade to Imperial Cavalry — Upgrades your Shock Cavalry」，同线最后一档 |
| `lembos` | 小艇 | **希腊轻型伦博斯** | DE 405009 |
| `war_lembos` | 小艇高级 | **希腊战型伦博斯高级** | DE 405010 |
| `heavy_lembos` | 小艇重装 | **希腊重型伦博斯重装** | DE 405011 |
| `elite_lembos` | 小艇精锐 | **希腊旗舰伦博斯重装** | DE 405012；船坞船不是城堡兵，不用「精锐」 |

### 保持不动（主人 2026-09-07 拍板）

- 卡拉维尔帆船高级 / 维京长船高级 / 龟船高级：DE 判 unique，但**船坞造的不是城堡兵**，规则字面如此，保持「高级」。
- `imperial_centurion` **罗马百夫长重装**：与罗马百夫长精锐是同一张素材，DE 未给文明，归罗马。
- 古典色雷斯军团 2 档保留波斯冲击铁骑高级（战力 70），不换回本族兵。
