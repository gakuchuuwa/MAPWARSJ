# 兵种鉴赏 × DE 对照：七类归属与缺少／多余

由 `node tools/de-unit-source-types.mjs` 生成。判据见脚本文件头。

兵种鉴赏共 463 个；能在 DE 找到出处的 463 个：城堡兵 131、文化兵 40、区域兵 38、特殊兵 51、普通兵 97、英雄 103、精英兵 3。

## 多余：兵种鉴赏有、DE 查不到出处（0 个）

多为项目自建或改名后对不上号的兵种，需逐个核对是自建还是对号漏了。

| id | 名字 | 类别 |
|---|---|---|

## 按 DE 英文名逐条对号的兵种（33 个）

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
| `jarl` | 维京首领骑兵高级 | Elite Jarl | 城堡兵 |
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

## DE 里有，但不在科技树和 wiki 不可训练清单里的兵种（6 个）

| id | 名字 | 类别 | 依据 |
|---|---|---|---|
| `xolotl_warrior` | 阿兹特克索洛特尔骑兵高级 | 特殊兵 | DE 文本有「Xolotl Warrior」「Create Xolotl Warrior」 |
| `hero_stoertebeker` | 英雄·斯托尔特贝克·条顿 | 英雄 | DE 文本有「Stoertebeker」，DE 单位 HSTOER id=114 |
| `hero_basileus` | 英雄·皇帝巴西琉斯·拜占庭 | 英雄 | DE 本体剧情单位「巴西琉斯」（见 WarTypes 注释） |
| `vanguard` | 诺曼先锋步兵高级 | 特殊兵 | DE 素材 u_inf_vanguard（SLD），DE 文本未见单位名 |
| `equites` | 罗马伴随骑士高级 | 特殊兵 | DE 素材（SLD），DE 文本未见单位名 |
| `sarmatian` | 萨尔马提亚骑兵 | 特殊兵 | DE 素材（SLD），DE 文本未见单位名 |

## 缺少①：DE 科技树里有、兵种鉴赏没有（7 个）

| DE 英文名 | DE 中文名 | 类别 | 是否战斗单位 | 出现于文明 |
|---|---|---|---|---|
| Missionary | 传教士 | 文化兵 | 非战斗 | 西班牙 |
| Fishing Ship | 渔船\n | 普通兵 | 非战斗 | 不列颠、法兰克、哥特、条顿、日本、中国 等 62 个 |
| Monk | 僧侣 | 普通兵 | 非战斗 | 不列颠、法兰克、哥特、条顿、日本、中国 等 56 个 |
| Priestess | 女祭司 | 普通兵 | 非战斗 | 阿契美尼德、雅典、斯巴达、马其顿人、色雷斯人、普鲁人 |
| Trade Cart | 贸易车 | 普通兵 | 非战斗 | 不列颠、法兰克、哥特、条顿、日本、中国 等 62 个 |
| Trebuchet (Packed) | 巨型投石机 | 普通兵 | 战斗 | 不列颠、法兰克、哥特、条顿、日本、中国 等 56 个 |
| Villager | 村民 | 普通兵 | 非战斗 | 不列颠、法兰克、哥特、条顿、日本、中国 等 62 个 |

## 缺少②：DE 不可训练单位里有、兵种鉴赏没有（英雄 136 个、战斗单位 0 个）

| DE 英文名 | DE 中文名 | DE 分组 | 备注 |
|---|---|---|---|
| Aethelfrith | 艾特尔弗里思 | 英雄 | 英雄类型：Infantry |
| Archbishop | 大主教 | 英雄 | 英雄类型：Monk |
| Archer of the Eyes | 神眼步弓手 | 英雄 | 英雄类型：Foot archer |
| Bad Neighbor | 坏邻居 | 英雄 | 英雄类型：Siege weapon |
| Belisarius | 贝利沙鲁斯 | 英雄 | 英雄类型：Cavalry |
| Charlemagne | 查理曼 | 英雄 | 英雄类型：Infantry |
| Charles Martel | 查理马特 | 英雄 | 英雄类型：Infantry |
| Constable Richemont | 康斯塔伯理察蒙 | 英雄 | 英雄类型：Cavalry |
| Duke D'Alençon | 诺曼底公爵 | 英雄 | 英雄类型：Cavalry |
| El Cid | 熙德 | 英雄 | 英雄类型：Infantry |
| Emperor in a Barrel | 装在桶里的皇帝 | 英雄 | 英雄类型：Civilian |
| Erik the Red | 红胡子艾里克 | 英雄 | 英雄类型：Infantry |
| Gawain | 高文爵士 | 英雄 | 英雄类型：Cavalry |
| Genghis Khan | 成吉思汗 | 英雄 | 英雄类型：Mounted archer |
| God's Own Sling | 神之弓 | 英雄 | 英雄类型：Siege weapon |
| Guy Josselyne | 盖佐斯尔立 | 英雄 | 英雄类型：Cavalry |
| Harold Haardraade |  | 英雄 | 英雄类型：Monk |
| Hrolf the Ganger | 首领罗夫 | 英雄 | 英雄类型：Infantry |
| Hunting Wolf | 猎狼 | 英雄 | 英雄类型：Infantry |
| Jean Bureau | 让·彼罗 | 英雄 | 英雄类型：Siege weapon |
| Jean de Lorrain | 让·德·洛兰 | 英雄 | 英雄类型：Siege weapon |
| King Arthur | 亚瑟王 | 英雄 | 英雄类型：Infantry |
| Kitabatake | 北畠氏 | 英雄 | 英雄类型：Infantry |
| La Hire | 拉海尔 | 英雄 | 英雄类型：Infantry |
| Lancelot | 兰斯洛特 | 英雄 | 英雄类型：Cavalry |
| Lord de Graville | 格拉维尔领主 | 英雄 | 英雄类型：Foot archer |
| Master of the Templar | 圣殿骑士团首领 | 英雄 | 英雄类型：Cavalry |
| Minamoto | 源氏 | 英雄 | 英雄类型：Infantry |
| Mordred | 莫特列德 | 英雄 | 英雄类型：Cavalry |
| Ornlu the Wolf | 灰狼欧鲁 | 英雄 | 英雄类型：Animal |
| Reynald de Chatillon | 沙蒂永的雷纳德 | 英雄 | 英雄类型：Cavalry |
| Richard the Lionheart | 狮心王理查 | 英雄 | 英雄类型：Cavalry |
| Robin Hood | 罗宾汉 | 英雄 | 英雄类型：Foot archer |
| Roland | 罗兰 | 英雄 | 英雄类型：Cavalry |
| Saboteur | 破坏者 | 英雄 | 英雄类型：Siege weapon |
| Sheriff of Nottingham | 诺丁安的郡长 | 英雄 | 英雄类型：Infantry |
| Siegfried | 齐格菲 | 英雄 | 英雄类型：Infantry |
| Sieur Bertrand | 伯特兰爵士 | 英雄 | 英雄类型：Cavalry |
| Sieur de Metz | 德·梅斯爵士 | 英雄 | 英雄类型：Cavalry |
| Sir John Fastolf | 约翰法斯托夫爵士 | 英雄 | 英雄类型：Cavalry |
| Tamerlane | 帖木儿 | 英雄 | 英雄类型：Mounted archer |
| The Black Prince | 黑亲王 | 英雄 | 英雄类型：Cavalry |
| Theodoric the Goth | 哥特人狄奥多利克 | 英雄 | 英雄类型：Infantry |
| Admiral Yi Sun-Shin | 李舜臣将军 | 英雄 | 英雄类型：Warship |
| Alexander Nevski | 亚历山大 莱斯基 | 英雄 | 英雄类型：Cavalry |
| Bleda the Hun | 匈奴王布莱达 | 英雄 | 英雄类型：Cavalry |
| El Cid Campeador | 熙德·坎培多尔 | 英雄 | 英雄类型：Cavalry |
| Henry V | 亨利五世 | 英雄 | 英雄类型：Cavalry |
| King Alfonso | 阿方索国王 | 英雄 | 英雄类型：King |
| King Sancho | 桑丘国王 | 英雄 | 英雄类型：King |
| Nobunaga | 织田信长 | 英雄 | 英雄类型：Infantry |
| Pope Leo I | 罗马教皇里奥一世 | 英雄 | 英雄类型：Monk |
| Scythian Scout | 斯基泰斥候 | 英雄 | 英雄类型：Cavalry |
| Scythian Wild Woman | 斯基泰的野女人 | 英雄 | 英雄类型：Infantry |
| William the Conqueror | 征服者威廉 | 英雄 | 英雄类型：Cavalry |
| Cuauhtemoc | 瓜特穆斯 | 英雄 | 英雄类型：Infantry |
| Francisco de Orellana | 弗朗西斯科·德·奥雷利亚纳 | 英雄 | 英雄类型：Gunpowder cavalry |
| Frederick Barbarossa | 腓特烈·巴巴罗萨 | 英雄 | 英雄类型：Infantry |
| Gonzalo Pizarro | 贡萨洛·皮萨罗 | 英雄 | 英雄类型：Gunpowder cavalry |
| Norse Chieftain | 北欧酋长 | 英雄 | 英雄类型：Cavalry |
| Khosrau | 霍斯劳 | 英雄 | 英雄类型：Mounted archer |
| Prithvi | 布里陀毗 | 英雄 | 英雄类型：Foot archer |
| Queen | 皇后 | 英雄 | 英雄类型：Civilian |
| Saladin | 萨拉丁 | 英雄 | 英雄类型：Cavalry |
| Sanyogita | 姗悦姬妲 | 英雄 | 英雄类型：Civilian |
| Abraha Elephant | 阿伯哈拉战象 | 英雄 | 英雄类型：Cavalry |
| Babur | 巴布尔 | 英雄 | 英雄类型：Cavalry |
| Guglielmo Embriaco | 古列尔莫·安布里科 | 英雄 | 英雄类型：Foot archer |
| Henry II | 亨利二世 | 英雄 | 英雄类型：Infantry |
| Huayna Capac | 瓦伊纳·卡帕克 | 英雄 | 英雄类型：Foot archer |
| Itzcoatl | 伊兹科阿图 | 英雄 | 英雄类型：Infantry |
| Little John | 小约翰 | 英雄 | 英雄类型：Infantry |
| Miklos Toldi | 米克罗斯·陶笛 | 英雄 | 英雄类型：Cavalry |
| Musa ibn Nusayr | 穆萨·伊本·奴萨尔 | 英雄 | 英雄类型：Mounted archer |
| Mustafa Pasha | 穆斯塔法帕夏 | 英雄 | 英雄类型：Gunpowder unit |
| Pacal II | 帕柯二世 | 英雄 | 英雄类型：Foot archer |
| Princess Yodit | 游娣特公主 | 英雄 | 英雄类型：Civilian |
| Richard de Clare | 理查·德·克莱尔伯爵 | 英雄 | 英雄类型：Cavalry |
| Su Dingfang | 苏定方 | 英雄 | 英雄类型：Foot archer |
| Tristan | 崔士坦爵士 | 英雄 | 英雄类型：Cavalry |
| Yekuno Amlak | 耶库诺·阿姆拉克 | 英雄 | 英雄类型：Infantry |
| Zawisza the Black | 兹瓦斯艾黑骑士 | 英雄 | 英雄类型：Cavalry |
| Bui Bi | 裴备 | 英雄 | 英雄类型：Monk |
| Jayaviravarman | 阇耶毗罗跋摩 | 英雄 | 英雄类型：Infantry |
| Le Lai | 黎来 | 英雄 | 英雄类型：Infantry |
| Le Trien | 李篆 | 英雄 | 英雄类型：Infantry |
| Luu Nhan Chu | 刘仁澍 | 英雄 | 英雄类型：Foot archer |
| Raden Wijaya | 拉登甲亮 | 英雄 | 英雄类型：Cavalry |
| Suryavarman I | 苏耶跋摩一世 | 英雄 | 英雄类型：Cavalry |
| Tabinshwehti | 莽瑞体 | 英雄 | 英雄类型：Mounted archer |
| Udayadityavarman I | 乌达雅迭耶跋摩一世 | 英雄 | 英雄类型：King |
| Wang Tong | 王通 | 英雄 | 英雄类型：Cavalry |
| Henry the Lion | 猛狮亨利 | 英雄 | 英雄类型：Cavalry |
| Leif Erikson | 莱夫·埃里克松 | 英雄 | 英雄类型：Warship |
| The Middlebrook | 米德尔布鲁克 | 英雄 | 英雄类型：Warship |
| Tokhtamysh Khan | 脱脱迷失汗 | 英雄 | 英雄类型：Cavalry |
| Topa Yupanqui | 托巴·尤潘基 | 英雄 | 英雄类型：Infantry |
| Urus Khan | 兀鲁思汗 | 英雄 | 英雄类型：Mounted archer |
| Vasco da Gama | 瓦斯科·达·伽马 | 英雄 | 英雄类型：Warship |
| Jacqueline of Hainaut | 埃诺的杰奎琳 | 英雄 | 英雄类型：Civilian |
| Warwolf Trebuchet | 战狼号巨型投石机 | 英雄 | 英雄类型：Siege weapon |
| Dmitry of Moscow | 莫斯科的德米特里 | 英雄 | 英雄类型：Cavalry |
| Emperor Sigismund | 西吉斯蒙德皇帝 | 英雄 | 英雄类型：Cavalry |
| Mikhail of Tver | 特维尔亲王米哈伊尔 | 英雄 | 英雄类型：Cavalry |
| Young Jadwiga | 年轻的雅德维加 | 英雄 | 英雄类型：Infantry |
| Amoghavarsha | 阿目佉跋沙 | 英雄 | 英雄类型：Infantry |
| Ibrahim Lodi | 易卜拉欣·洛迪 | 英雄 | 英雄类型：Mounted archer |
| Mihira Bhoja | 迷企罗·波阇 | 英雄 | 英雄类型：Cavalry |
| Shaybani Khan | 昔班尼汗 | 英雄 | 英雄类型：Mounted archer |
| Young Babur | 年轻的巴布尔 | 英雄 | 英雄类型：Cavalry |
| Ismail | 亦思马因 | 英雄 | 英雄类型：Cavalry |
| Ivane | 伊万 | 英雄 | 英雄类型：Cavalry |
| Mleh | 姆莱 | 英雄 | 英雄类型：Infantry |
| Selim the Grim | 冷酷者塞利姆 | 英雄 | 英雄类型：Cavalry |
| Stephan | 斯蒂芬 | 英雄 | 英雄类型：Infantry |
| Yury | 尤里 | 英雄 | 英雄类型：Infantry |
| Zakare | 扎卡雷 | 英雄 | 英雄类型：Infantry |
| Dong Zhuo | 董卓 | 英雄 | 英雄类型：Cavalry |
| Emperor in a Litter | 草垫中的皇帝 | 英雄 | 英雄类型：Artifact |
| Liu Biao | 刘表 | 英雄 | 英雄类型：Siege weapon |
| White Tiger Yan | 严白虎 | 英雄 | 英雄类型：Cavalry |
| Yu Ji | 于吉 | 英雄 | 英雄类型：Monk |
| Yuan Shao | 袁绍 | 英雄 | 英雄类型：Cavalry Archer |
| Zhang Jue | 张角 | 英雄 | 英雄类型：Monk |
| Zhao Yun | 赵云 | 英雄 | 英雄类型：Cavalry |
| Zhou Yu | 周瑜 | 英雄 | 英雄类型：Archer |
| Einar Paunch-Shaker | 神射手埃纳尔 | 英雄 | 英雄类型：Foot archer |
| Finn Arnason | 芬恩·阿纳森 | 英雄 | 英雄类型：Infantry |
| Kalf Arnason | 卡尔夫·阿纳森 | 英雄 | 英雄类型：Infantry |
| Cleon | 克里昂 | 英雄 | 英雄类型：Infantry |
| Darius | 大流士 | 英雄 | 英雄类型：Cavalry |
| Leonidas | 列奥尼达 | 英雄 | 英雄类型：Infantry |
| Miltiades | 米太亚德 | 英雄 | 英雄类型：Infantry |
| Flagship of Nearchos | 尼阿尔库斯的旗舰 | 英雄 | 英雄类型：Building |
| Hephaistion | 赫菲斯提昂 | 英雄 | 英雄类型：Infantry |
| Nearchos | 尼阿尔库斯 | 英雄 | 英雄类型：Infantry |
