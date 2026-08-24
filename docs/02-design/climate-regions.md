# 全球气候分区权威表（2026-08-21，主人定「像划分文化一样把气候划分开」）

> 单一真理来源：`src/ui/Scene13Biome.ts`（KoppenClass 柯本气候 + KOPPEN_TO_BIOME + BIOME_TREES + BIOME_GROUND_DECOR）
> + `src/ui/scene13/Scene13DeMapThemes.ts`（DE_MAP_THEMES 16 主题）。
> 结构对标：18 文化区（RegionSystem REGION_CENTERS，2026-08-19 主人定收敛 18 大文化）——文化区管「谁在这里」，
> **气候区管「这里长什么」**。文化按据点归属，气候按经纬度+海拔自动检测（柯本，全球覆盖）。

## 18 文化区 × 气候覆盖核对（2026-08-21 实测）

| 文化区 | 气候 | 战斗主题 | 覆盖 |
|--------|------|---------|------|
| 中原 CENTRAL | 温带大陆湿润 | asia_temperate | ✓ |
| 北方 NORTH | 温带大陆湿润（晋北黄土 elev≥600） | asia_temperate / asia_steppe | ✓ |
| 江南 JIANGNAN | 亚热带湿润 | asia_temperate | ✓ |
| 川蜀 BASHU | 亚热带湿润（盆地低地） | asia_temperate | ✓ |
| 岭南 LINGNAN | 热带/亚热带 | indomalayan_tropical | ✓ |
| 滇缅 DIANQIAN | 热带（低地）/温带（高原） | indomalayan / asia_temperate | ✓ |
| 河西 HEXI | 温带干旱草原 | asia_steppe | ✓ |
| 西域 WESTERN | 沙漠/干旱 | middle_east_desert / asia_steppe | ✓ |
| 青藏 TIBET | 极地高原 | tibetan_plateau | ✓ |
| 草原 STEPPE | 温带干旱草原 | asia_steppe | ✓ |
| 东北 NORTHEAST | 温带大陆湿润（黑土） | asia_temperate | ✓ |
| 朝鲜 KOREA | 温带大陆湿润 | asia_temperate | ✓ |
| 日本 JAPAN | 亚热带/温带湿润 | asia_temperate | ✓ |
| 中亚 CENTRAL_ASIA | 沙漠/干旱草原 | middle_east_desert / asia_steppe | ✓ |
| 西亚 WEST_ASIA | 沙漠/地中海/高原 | middle_east_desert / highland / mediterranean | ✓ |
| 斯拉夫 SLAVIC | 寒带针叶林 | europe_taiga | ✓ |
| 日耳曼 GERMANIC | 温带海洋 | europe_temperate | ✓ |
| 拉丁 LATIN | 地中海（南）/温带海洋（北≥45°） | europe_mediterranean / europe_temperate | ✓ |

**18/18 全覆盖**（验证脚本 `scratch/verify_theme_regions.mts` 34 点全过）。

## 9 大气候区（全球，任何坐标都可分到）

| # | 气候区 | 柯本组 | 代表分布（全球） | DE biome | 树（DE 素材） | 战斗主题 |
|---|--------|--------|-----------------|----------|--------------|---------|
| 1 | 热带雨林 | Af/Am | 亚马逊/刚果盆地/东南亚/爪哇 | Rainforest/Jungle | JUNGLE·RAINFOREST·BRAZILWOOD·BAMBOO·LUSH_BAMBOO | 南美/非洲/东南亚热带 |
| 2 | 热带稀树草原 | Aw/BSh | 非洲萨赫勒/塞伦盖蒂/印度德干/巴西高原 | Savannah | ACACIA·BAOBAB·WAX_PALM | serengeti |
| 3 | 沙漠 | BWh/BWk | 撒哈拉/阿拉伯/中亚沙漠/澳洲内陆 | Desert | PALM·DEAD_TREE·CACTUS(植) | middle_east_desert |
| 4 | 地中海 | Csa/Csb | 地中海沿岸/加州/智利中部 | Default+ | OLIVE·CYPRESS·CYPRESS_DEC·ITALIAN_PINE | europe_mediterranean |
| 5 | 亚热带湿润 | Cfa/Cwa | 中国东南/日本南部/美国东南/拉普拉塔 | Default | ASIAN_MAPLE·OAK·PEACH_BLOSSOM·BAMBOO(南缘) | asia/europe_temperate |
| 6 | 温带海洋 | Cfb/Cwb | 西欧/智利南部/新西兰/澳洲东南 | Default | OAK·BIRCH·GREEN_OAK·WILLOW | europe_temperate/australasian |
| 7 | 温带大陆性（湿润） | Dfa/Dwb/Dwa | 东北/华北/朝鲜/美国中西部 | Steppes/Default | PINE·ASIAN_PINE·BIRCH·ASIAN_MAPLE | asia_temperate |
| 8 | 温带大陆性（干旱草原） | BSk/Dsa/Dsb | 蒙古/中亚/河西/北美大平原 | Steppes | PINE·DEAD_TREE·SNOW_PINE(冬) | asia_steppe/middle_east_highland |
| 9 | 寒带针叶林/极地 | Dfc/Dsc/ET/EF | 西伯利亚/北欧/加拿大/青藏高原 | Arctic | PINE·SNOW_PINE·DEAD_TREE | europe_taiga/nearctic/tibetan |

## 三级分配链（代码路径）

1. **气候检测**（全球，任意坐标）：
   `resolveClimateRegion(lat,lng)` → KoppenClass（30 亚类，按经纬度+海拔）
   → `KOPPEN_TO_BIOME` → 9 类 biome（Scene13Biome.ts:46）
2. **植被分配**（全球）：
   `BIOME_TREES[biome][季节0/1/2]`（Scene13Biome.ts:174）→ 树候选
   `BIOME_GROUND_DECOR[biome]`（:187）→ 灌木/草/花/岩
3. **主题分配**（biome 驱动全球 + 欧亚地理带细化）：
   `resolveDeMapTheme`（Scene13DeMapThemes.ts:233）→ 16 主题
   - biome 分支（rainforest/savanna/desert/mediterranean/boreal/tundra）**全球通用**
   - 欧亚地理带（西亚/中亚/河西/蒙古/华北/岭南）**细化**
   - 美洲（lng<-30）/澳洲（lat<-10,lng≥100）已分流
   - 沼泽（lake+低地）全球湿地通用

## 树库存（2026-08-21 实测，全 DE 提取）

- **DE 树素材共 53 目录**（`public/SUCAI_NATURE/`，全部提取完成）：
  - **基本树种 33 种**：乔木 29（oak/pine/birch/maple/ash…）+ 灌木树 3（BUSH_TREE_A/B/C）+ 芦苇水植 1（REEDS）+ 枯树 1（DEAD_TREE）
  - **季节变体 9**：桦×3（绿/秋/冬）、枫×2（绿/秋）、橡×3（绿/秋/雪）、雪松 1
  - **倒地 4 + 树桩 4**（通用/竹/猴面包/茂竹）
  - **场景装饰树 12**（SCENARIO_TREE_A~L，战役专用大型树）
- 每种树 3~27 帧变体（方向/形态/季节池），按帧随机取用。

## DE 背景图分配机制（对照说明）

DE 官方 179 张地图（rms）不是 179 套素材——是 **terrain style（地形风格）机制**：

1. 每张官方地图指定 1 个 terrain style（温带/沙漠/雪/热带/丛林/冻原/稀树草原/草原）
2. style = 全套地面贴图（terrain textures）+ 树组 + 装饰组 + 配色（colorcorrection 19 套）
3. rms 里 `#const BASE_TERRAIN <id>` 定主地形，`create_object` 对象组（AESTHETIC_FLAT/SOLID_OBJECT/FALLEN_TREE 等）按 style 取成员

**我们的同构实现**：16 主题 = 16 个「style」，每个 = baseTerrain + groundTiles + trees（3 季）+ flatDecor + solidDecor + waterPlants + beachTerrain——结构与 DE style 一一对应；
季节 = DE colorcorrection 的 Spring/Summer/Autumn/Winter；
19 套配色中 Night/Evening 等 8 套时间氛围需昼夜系统（暂无，已记录）。

---

# 底图生成实现（2026-08-24 对着 DE 真图重做）

> 起因：主人指出底图「做不出帝国时代那种美感」，要求和 DE 一模一样、不要「自以为是算出来的」。
> 为此从 DE 本体导出真实地图当标尺，量出事实后重写了林地与起伏。

## A. 数据来源分层（必须分清，别混着说）

| 组成 | 来源 |
|---|---|
| 地面贴图 | **DE 原文件** `public/SUCAI_TERRAIN/*.png` = DE 的 `g_*.dds` |
| 物件精灵 | **DE 原文件** `public/SUCAI_NATURE/*/frames.png` |
| 地形咬合遮罩 | **DE 原文件** `public/SUCAI_TERRAIN/blends/*.png` |
| 水面波光帧 | **DE 原文件** `terrain/water/atlas_v1_diag_*.png`（8×8=64 帧） |
| 水面法线贴图 | **DE 原文件** `terrain/water/normal0.png` (1024²) |
| 水面光照参数 | **DE 原文件** `terrain/water_json/water_def.json`（21 种水型） |
| 地形 ID→贴图名/咬合优先级 | **DE 原文件** `dat/empires2_x2_p1.dat` 的 terrain 表（`name_2` 即 `g_*`） |
| **布局**（哪格什么地形、树站哪） | **自己算** `Scene13EnvironmentGenerator.ts` |
| **水面着色公式** | **自己写**（DE 那部分在 GPU shader 里，扒不出来） |

**从未截过 DE 的屏**。「取 DE 的图」指读 DE 存档里的**数据表**，不是像素。

## B. DE 真值（验收基准）

样本：DE 场景编辑器生成的地中海图，中心截 66×66（= 我们战场网格尺寸）。

| 指标 | DE 真值 | 改造前 | 改造后 |
|---|---|---|---|
| 森林地形占比 | **12.4%**（542 格） | 无此概念 | 9~11% |
| 可见树数 | **472 棵** | 15~24 棵 | 323 棵 |
| 有高度的格 | **21.6%** | 13.8% | 23.7% |
| 相邻格有高差的边 | **14.1%** | 3.4% | 12.7% |
| 一步跳 ≥2 级（断崖） | **0.00%** | 0.00% | 0.00% |

**最关键的一条**：DE 的森林是**一种地形**，不是「草地上撒树」。
`Arabia.rms`：`create_terrain FOREST_PLACEHOLDER { land_percent 6~10; number_of_clumps 10~14 }`
——先铺成团林地地块，再在地块上长树。DE 的树要么密密麻麻连成林、要么是刻意的几株 straggler，
**不存在均匀散布的孤树**。改造前我们差约 23 倍，且是结构性错误，调参数救不了。

验收：`npx tsx scratch/cmp_forest.mts` / `npx tsx scratch/cmp_elevation.mts`

## C. 生成机制要点

**林地**（`buildVegetation`）：算可用地（屏幕内 ∧ 非水 ∧ 走廊外）→ 按可用地比例下预算
→ 12~16 个 clump 铺地块（种子间距 ≥9 格、块大小 0.55~1.45 倍浮动）
→ 每个林地格 **0.87 棵/格** 长树 → 林外少量 straggler 孤树。

- ⚠ 预算按**可用格**算，不能按 `gw*gh`（等距投影后大半格子在屏幕外/走廊里）
- ⚠ DE 的「全图 12.4%」不能照搬：DE 是大地图单位只占一角，我们是两军贴满一屏对撞
- 🔴 **树偏左**：攻方从左入场、守方在右且右侧多摆城池，林心在右半只以 22% 概率接受

**高度**（`generateElevation`）：战术高地（2~4 片大椭圆，主人定过别删）+ `addMicroRelief`
（满地 clump 生长的碎缓丘，恒抬 1 级）。补微起伏是因为原本只有大台地、台面全平——
高度总量不差，差的是**颗粒度**。微丘用 clump 不用画圆（圆的边界太光滑撑不出高差密度），
恒抬 1 级（自己叠高会造断崖，而 DE 断崖率是 0.00%）。

**水系**：`sea`→`buildCoastline`（恒在左侧，攻方登陆）／`river`→`buildRiver`（只在野战渡口，
攻城战绝不横插假河）／`lake`→`buildLake`（**2026-08-24 才补**，此前 `waterKind` 有这个值、
`probeWater` 会返回、拓扑也按它分支，但**没有任何代码生成湖**）。

**军团走廊**：两军东西对进（攻方 x≈60~360、守方 x≈1640~1940，纵向铺满 80% 屏高），
走廊 = `x∈[18%,82%] ∧ y∈[12%,88%]`。树石是阻挡物而 13 的编队**不会绕路**（DE 的单位会寻路），
中场挡死就打不起来 → 走廊内只放不阻挡的地面贴花。这是林地只能待在边缘的根本原因。

## D. 水面渲染

**DE 的水长什么样**（照主人发的尼斯湖截图记录，作为目标）：

| 特征 | DE 实际 | 我们 |
|---|---|---|
| 运动 | 几乎静止，波纹细微缓慢 | 已改 90 帧 / 7.5 秒一圈 |
| 水色 | 明亮**天蓝**，深浅有梯度 | 偏暗偏深蓝 ❌ |
| 岸线 | 水→碎石→沙砾→枯草→草地 多层 | 只有 沙滩→浅水→深水 ❌ |
| 水中 | 成片**睡莲/水草** | 完全没有 ❌ |
| 岸边 | 芦苇、碎石堆 | 没有 ❌ |

**现行**：A 层（DE 法线贴图 + `water_def.json` 参数，算镜面高光 + 菲涅耳，公式自写）
+ B 层（DE 原生 64 帧波光，强度 **18%** 只作通透感补充）。
实机在 `Scene13WarLayer.renderDynamicWater()`；烘焙 `npx tsx tools/de-water-bake.mts`。

**五个坑（改水面前必读）**：

1. `specular_power = 1600` 直接套过来**全黑** —— 那是 DE 3D/HDR 管线的指数（要求法线偏离半角
   向量 <2°），2D 下必须按比例压低（现用 `/14`）
2. **坐标系**：法线贴图是切线空间（z 朝表面外），水面在世界里是 Y-up 水平面，
   需 `(x,y,z)→(x,z,y)`。直接当世界法线用 → 全朝 +Z，高光归零
3. **UV 缩放不能照搬 `scale`/`map_scale`**（DE 世界单位）—— 套过来整屏只采样到法线贴图两三个
   像素，波纹消失。且最近邻采样会把光斑采成规则鳞片网格，必须双线性 + 两层法线错位
4. **流速**：`velocity` 只有 0.125，很慢。曾 2 秒推过整张 1024px 法线贴图 → 水面「开锅」。
   循环无缝要求位移是贴图宽度整数倍，**不能减位移量**，要靠加帧 + 放慢播放拉长周期
5. **多层必须同向**：两张法线一正一反会对冲成「沸腾」感，DE 的多层波同向不同速

## E. 从 DE 取真图的链路（需要时再用）

1. DE 场景编辑器 → 新建场景 → 地图标签 → 选类型/尺寸 → 产生地图 → 菜单 → **另存为**
   （⚠ 每次必须改文件名，否则一律覆盖 `default1.aoe2scenario`）
2. `py tools/de-map-export.py <scenario> <名字> [切块步长]` → `public/de-maps/*.json`
3. atlas 工具读 `public/de-maps/index.json`，把 DE 真图排最前（★ 绿色标题）
4. 离线出图 `npx tsx scratch/render_de_map.mts <名字>`

依赖：`AoE2ScenarioParser`(0.8.4，支持 2026 版 DE)、`genieutils-py`(读 dat)。
一张 144² 切 16 块、240² 切 36 块。

> ⚠ `mgz` 解不开 2026 版 replay/存档（支持到 `save_version 66.3`）。曾试图逆向存档里的地图矩阵，
> 四轮全失败（两次撞可见性层、一次暴力扫描超时）。**别再走这条路**，走场景编辑器导出。

**DE 真图的定位是标尺，不是图库**——用它量出事实校准生成器，然后就不用再导。
每场战斗底图都不同是无上限的需求，靠人在 DE 里点满足不了。

## F. 工具

| 用途 | 命令 |
|---|---|
| 全组合总览（网页） | `http://localhost:5173/tools/scene13-atlas/index.html` |
| DE 真图导出/切块 | `py tools/de-map-export.py <scenario> <名字> [步长]` |
| 水面帧烘焙 | `npx tsx tools/de-water-bake.mts [水型] [帧数] [边长]` |
| 森林量化对比 | `npx tsx scratch/cmp_forest.mts` |
| 起伏量化对比 | `npx tsx scratch/cmp_elevation.mts` |
| 离线出图（我们的） | `npx tsx scratch/render_ours.mts <名字>` |
| 离线出图（DE 真图） | `npx tsx scratch/render_de_map.mts <名字>` |
| 带动态水的样张 | `npx tsx scratch/render_shot.mts <名字> <帧数> <种子>` |

**atlas 编号**：稳定编号 = 完整笛卡尔积（18 主题 × 3 季节 × 4 海拔 × 4 水系 × 2 攻防 = 1728）
中的固定序号，与筛选/渲染顺序无关。🔴 别改回循环递增（会随筛选漂移，指认全废）。
编号只锁**组合**不锁具体那张图，**指认时编号和种子都要报**。
「删除」= 把组合拉黑不再生成（localStorage，可恢复、可导出），**绝不删素材文件**。

## G. 踩过的坑

| 坑 | 后果 | 教训 |
|---|---|---|
| 用「全局调色滤镜」救观感 | 做完几乎没差别，方向全错 | 观感问题先量事实，别拿估的参数糊近似 |
| `enforceAllObjectSpacing` 树斥力半径 65px | 两棵树最少隔 130px≈两格，密林被剔成散点（444 格只长出 58 棵树） | 林内树须标 `placementGroup` 豁免间距 |
| 海拔档写成 `hill`/`plateau` | 不在引擎合法值（`lowland/upland/mountain/alpine/high_alpine/snow`）里，按 band 查表全 `undefined`，两档林木预算算成 0 | 跨模块枚举以引擎类型为准 |
| 森林预算按 `gw*gh` 算 | 大部分格长在屏幕外/走廊里被筛掉，只落地 50 棵树 | 按**实际可用格**算 |
| sharp 对单通道 raw 做 `blur` | 吐出 3 通道，索引错位，水面重绘被静默跳过（40 帧全一样） | 单通道 blur 后要 `toColourspace('b-w')` |
| 离线预览逐格画菱形 | 水面呈方格拼接硬边，冤枉了生成器 | 实机有 blends 咬合，预览脚本的锅别算到引擎头上 |
| 逆向 replay/存档找地图矩阵 | 四轮全失败，浪费大量时间 | 走场景编辑器导出 |

## H. 未决

- **湖的大小与位置**：现在必须整个避开走廊，只能挤在边角、偏小。要更像 DE 绿洲就得放大、
  允许占一部分战场，但军团得绕路——取舍待主人定。
- **树种分配**：按地理/史实统一管理（主人 2026-08-24：「最后这个要统一按事实管理」）。
- **水面细节**：对照 §D，还缺水草/睡莲、岸线多层过渡、水色偏暗。
- **边缘咬合**：`blendomatic_x1.dat` 每个 mode 有 **31 个**邻接遮罩，我们现在每 mode 只用一张。
  主人：「边缘有更好的就用 DE 的」。（文件头 `9 modes, 31 tiles, 2353px 菱形` 已解出，
  完整走文件的格式尚未对上。）

## I. 铁律

1. 只影响 ZOOM 13 视觉，不碰 8/9/10，不改战斗时长/胜负/兵力/伤害/阵型/出兵
2. 一切随机走注入的 `RandomSource`，不许 `Math.random()`
3. 改任何影响观感的参数，**先跑 §B 的验收脚本对着 DE 真值量**，不靠肉眼拍脑袋
4. 注释与文档写「为什么」和「出处」，本节所有数字都可复现

