# 兵种鉴赏 × DE 对照：七类归属与缺少／多余

由 `node tools/de-unit-source-types.mjs` 生成。判据见脚本文件头。

兵种鉴赏共 641 个；能在 DE 找到出处的 641 个：城堡兵 130、文化兵 40、区域兵 38、特殊兵 75、普通兵 98、英雄 223、精英兵 19、非战斗 18。

## 多余：兵种鉴赏有、DE 查不到出处（0 个）

多为项目自建或改名后对不上号的兵种，需逐个核对是自建还是对号漏了。

| id | 名字 | 类别 |
|---|---|---|

## 按 DE 英文名逐条对号的兵种（42 个）

自动对号对不上（变体形态、女兵素材、英文名带变音等），逐个核实后登记在 tools/de-unit-name-alias.json。

| id | 名字 | DE 英文名 | 类别 |
|---|---|---|---|
| `elite_armored_elephant` | 装甲攻城战象高级 | Siege Elephant | 区域兵 |
| `ratha_ranged` | 孟加拉拉塔弓战车 | Ratha | 城堡兵 |
| `elite_ratha_ranged` | 孟加拉拉塔弓战车精锐 | Elite Ratha | 城堡兵 |
| `immortal_ranged` | 波斯长生军弓手 | Immortal | 城堡兵 |
| `elite_immortal_ranged` | 波斯长生军弓手高级 | Elite Immortal | 城堡兵 |
| `flemish_pikeman_f` | 勃艮第佛兰德民兵高级 | Flemish Militia | 文化兵 |
| `jian_swordman_shielded` | 华夏步兵高级 | Jian Swordsman | 文化兵 |
| `jian_swordman_unshielded` | 华夏双手步兵 | Jian Swordsman | 文化兵 |
| `elite_scythian_horse_archer` | 斯基泰骑射手高级 | Scythian Horse Archer | 特殊兵 |
| `elite_greek_cavalry` | 希腊贵族骑兵高级 | Greek Noble Cavalry | 特殊兵 |
| `elite_war_dog` | 战犬高级 | War Dog | 特殊兵 |
| `elite_peltast` | 色雷斯标枪手高级 | Mercenary Peltast | 特殊兵 |
| `bayinnaung_elephant` | 缅甸御驾战象 | Bayinnaung | 英雄 |
| `dagnajan_elephant` | 达格纳詹御驾战象 | Dagnajan | 英雄 |
| `porus_elephant` | 波鲁斯王战象 | Porus | 英雄 |
| `hero_arariboiamelee` | 英雄·阿拉里博亚·图皮 | Arariboia | 英雄 |
| `hero_arariboiaranged` | 英雄·阿拉里博亚（弓手）·图皮 | Arariboia | 英雄 |
| `hero_belaiv` | 英雄·贝拉四世国王·马扎尔 | King Bela IV | 英雄 |
| `hero_shahking` | 英雄·沙阿王·波斯 | Shah | 英雄 |
| `hero_ulf` | 英雄·乌尔夫·奥斯帕克松·维京 | Ulf Ospaksson | 英雄 |
| `hero_themistocles` | 英雄·地米斯托克利·雅典 | Themistocles (Warship) | 英雄 |
| `hero_themistocles_hoplite` | 英雄·地米斯托克利（步战）·雅典 | Themistocles | 英雄 |
| `hero_bernardarmagnac` | 英雄·贝尔纳·德·阿马尼亚克·法兰克 | Bernard d'Armagnac | 英雄 |
| `hero_dismounted_alexander` | 英雄·步战亚历山大·马其顿 | Alexander (Dismounted) | 英雄 |
| `hero_mounted_alexander` | 英雄·骑马亚历山大·马其顿 | Alexander | 英雄 |
| `hero_ivaylo` | 英雄·骑马伊瓦伊洛·保加利亚 | Ivaylo | 英雄 |
| `hero_ivaylofoot` | 英雄·步战伊瓦伊洛·保加利亚 | Ivaylo | 英雄 |
| `hero_lubu` | 英雄·吕布·河朔 | Lü Bu | 英雄 |
| `hero_macedonian_commander` | 英雄·腓力二世·马其顿 | Philip | 英雄 |
| `hero_sforza` | 英雄·斯福尔扎·意大利 | Francesco Sforza | 英雄 |
| `hero_dionysus` | 英雄·狄奥尼索斯·希腊 | Dionysius | 英雄 |
| `hero_aeginetan` | 英雄·波利克里托斯·希腊 | Polycritus | 英雄 |
| `hero_harald` | 英雄·哈拉尔·维京 | Harold Haardraade | 英雄 |
| `hero_attila` | 英雄·阿提拉·匈人 | Attila the Hun | 英雄 |
| `hero_alaric` | 英雄·亚拉里克·哥特 | Alaric the Goth | 英雄 |
| `hero_halldor` | 英雄·哈尔多尔·斯诺拉松·维京 | Halldor Snorrason | 英雄 |
| `hero_tostig` | 英雄·托斯蒂格·葛温森·撒克逊 | Tostig Godwinson | 英雄 |
| `ratha_melee` | 孟加拉拉塔战车 | Ratha | 城堡兵 |
| `elite_ratha_melee` | 孟加拉拉塔战车高级 | Elite Ratha | 城堡兵 |
| `hero_flagshipofnearchos` | 英雄·尼阿库斯旗舰·马其顿 | Flagship of Nearchos | 英雄 |
| `horse` | 马 | Horse | 特殊兵 |
| `wild_horse` | 野马 | Wild Horse | 特殊兵 |

## DE 里有，但不在科技树和 wiki 不可训练清单里的兵种（6 个）

| id | 名字 | 类别 | 依据 |
|---|---|---|---|
| `xolotl_warrior` | 阿兹特克索洛特尔骑兵高级 | 特殊兵 | DE 文本有「Xolotl Warrior」「Create Xolotl Warrior」 |
| `hero_stoertebeker` | 英雄·斯托尔特贝克·条顿 | 英雄 | DE 文本有「Stoertebeker」，DE 单位 HSTOER id=114 |
| `hero_basileus` | 英雄·皇帝巴西琉斯·拜占庭 | 英雄 | DE 本体剧情单位「巴西琉斯」（见 WarTypes 注释） |
| `vanguard` | 诺曼先锋步兵高级 | 特殊兵 | DE 素材 u_inf_vanguard（SLD），DE 文本未见单位名 |
| `equites` | 罗马伴随骑士高级 | 特殊兵 | DE 素材（SLD），DE 文本未见单位名 |
| `sarmatian` | 萨尔马提亚骑兵 | 特殊兵 | DE 素材（SLD），DE 文本未见单位名 |

## 缺少①：DE 科技树里有、兵种鉴赏没有（0 个）

| DE 英文名 | DE 中文名 | 类别 | 是否战斗单位 | 出现于文明 |
|---|---|---|---|---|

## 缺少②：DE 不可训练单位里有、兵种鉴赏没有（英雄 0 个、战斗单位 0 个、动物／平民／秘籍玩笑等 1 个）

| DE 英文名 | DE 中文名 | DE 分组 | 备注 |
|---|---|---|---|
| Butterflies | 蝴蝶 | 动物 | Gaia 专属 |
