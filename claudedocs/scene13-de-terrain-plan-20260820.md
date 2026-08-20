# Scene13 全面 DE 化 · 战场环境识别与地形方案（2026-08-20）

> 目标：13 战斗场景**全部素材统一到 AoE2 DE**，弃用三国群英传树/湖；地面由「透明叠在真实地图上」
> 改为「DE 地形铺满」；战场样式按**真实地理细化识别**，让每一张 DE 地形都有它该出现的地方。
>
> 本文所有素材数字均为**磁盘实测**（DE 安装目录直接清点），非转述。

---

## 一、家底盘点（实测）

### 1.1 地形贴图 —— 85 张
路径：`AoE2DE/resources/_common/terrain/textures/2x/*.dds`，每张 **2048×2048 RGBA**，Pillow 可直接读。
总览图：`claudedocs/de-terrain-atlas-20260820.png`（85 张缩略 + 文件名，按此图分类，不靠文件名猜）。

| 类别 | 张数 | 文件 |
|---|---:|---|
| 草地（绿→黄的完整梯度） | 12 | `gr2 gr3 gr6 gr7 gr8 gr9 grs`（绿系）/ `gr4 gr5 pm1 pm2 sr2`（黄枯系） |
| 沙漠 | 9 | `des ds3 ds4`（橙红）/ `ds2 ds5 snd qs`（浅黄）/ `pal pal1`（棕/龟裂） |
| 干草原·稀树 | 4 | `pc1 pc2 pc3`（黄土带草点）/ `qs2` |
| 森林地表 | 3 | `fo2 for underbrush_leaves` |
| 雪·冰 | 6 | `sno sn2 snf`（雪）/ `ice ic2 ic3`（冰）+ `ice_beach` |
| 岩·砾 | 5 | `rck gravel_default gravel_wet rock_wet r01` |
| 海滩 | 5 | `bc2 bc3 bc4 bch beach_wet` |
| 浅滩·沼泽 | 5 | `sh2 sh3 sh4 sh5 sha` |
| 水面 | 9 | `wt2 wt3 wt4 wt5 wt6 wtr`（蓝）/ `wt_brown wt_green wt_yellow wt_yellow2`（浊水） |
| 农田 | 8 | `fc1 fc2 fc3 fm2`（旱田/麦）/ `fm1 rc1 rc2 rc3`（水田/稻） |
| 道路 | 3 | `rd1`（白石）/ `rd2`（橙石）/ `rd5`（灰土） |
| 梯田·条纹 | 2 | `rm1 rm2` |
| 过渡叠加层（overlay+mask） | 10 | `o_fo2 o_gr4 o_mod o_rd3 o_rd4 o_rd5 o_snd o_sng o_sr1 o_sr2` |
| 无效（纯黑占位） | 2 | `bla kf1` —— 不使用 |

**结论：可用 83 张。**

### 1.2 装饰/植被 —— 145 个
路径：`AoE2DE/resources/_common/drs/graphics/n_*.sld`

- **树 52 种**：`acacia baobab`（稀树草原）/ `palm wax_palm`（沙漠绿洲）/ `jungle rainforest mangrove brazilwood`（热带）/
  `olive cypress italian_pine`（地中海）/ `oak green_oak birch willow`（温带阔叶）/ `pine asian_pine monkey_puzzle`（针叶）/
  `bamboo lush_bamboo peach_blossom asian_maple_green/autumn`（东亚）/ `autumn_oak snow_autumn_oak snow_pine dead`（秋冬态）/
  `reeds`（水生）/ `stump_* felled_*`（伐倒/树桩）/ `scenario_a~l`（剧本树 12 种）
- **灌木花草**：`plant_bush_green plant_cactus plant_dead plant_fernpatch_rainforest plant_flower_1~4 plant_flowerbed`
  `plant_grass_green/dry(+_patch) plant_jungle plant_rainforest plant_shrub_green plant_underbrush(_jungle/_rainforest) plant_weed`
- **岩石·地貌**：`rock_rock1~3 rock_formation1~3 rock_pillar rock_limestone rock_jungle rock_beach rock_sea1~2`
  `mountain_01~11`（山体 11 种）、`cliff_default/limestone/marble/sand/snow/terrace`（悬崖 6 种）
- **资源点**：`forage_bush/fruit/papaya/pineapple`（各 3 个消耗阶段）、`mine_gold mine_stone`、`oysters`
- **地面贴花**：`decal_crack decal_crater decal_ice decal_path_1~4`、`fallen_leaves_maple_autumn/red fallen_leaves_peach_blossom`

---

## 二、战场环境识别

### 2.1 现成的数据源（全部已在项目里，不用新造）

| 数据 | 接口 | 现状 |
|---|---|---|
| 战场中心经纬度 | `Scene13WarLayer.centerLat/centerLng` | 已由 `GameAppCombatHooks` 传入 |
| 海拔（米） | `LandSeaSystem.getSampler().getElevationSync(lat,lng)` | Terrarium DEM 瓦片，已用于选季节 |
| 坡度 | `TerrainSlope` | 已有 |
| 海/陆/山 | `LandTerrainSystem.classify()` → `sea/plain/mountain` | 已有，含缓存 |
| 水域掩膜 | `LandSeaSystem.getWaterSampler()` | ESRI 水体掩膜，海陆判定同源 |
| 文化区（18） | `getRegion(lat,lng)` | 已有 |
| 游戏季节 | `timeSystem.getSeason()` → 春夏秋冬 | 已有 |

**当前 13 只用了其中两条**（海拔选季、文化区兜底），且只分了绿/橙/白三档 —— 这就是"不够细化"的原因。

### 2.2 三层判定

```
L1 气候带  ── 决定「基础植被色调 + 树种」（8 类 biome）
L2 地貌    ── 决定「地表材质」（平原/丘陵/山地/高原/雪线，读海拔+坡度）
L3 局部    ── 决定「点缀层」（近水/农田/道路/岩滩，读水域掩膜+城池距离）
             ＋ 季节修正（春夏/秋/冬 换色系与树态）
```

#### L1 气候带的干湿度怎么来 —— 两条路

项目**没有降水数据**，这是细化的唯一硬缺口。两个方案：

**方案 A（推荐）：采样卫星底图颜色。**
项目已有完整的瓦片采样基础设施（`ElevationSampler` 的 `latLngToTilePixel` + 离屏 canvas 读像素），
换个 URL 就能采 ESRI World Imagery。取战场中心 32×32 像素的**中位色**，按 HSV 判：
- 绿（H 60~160，S>0.25）→ 湿润植被 → 草地/森林系
- 黄褐（H 20~60）→ 干旱 → 沙漠/干草原系
- 白（V>0.8，S<0.15）→ 雪原/冰川
- 灰（S<0.12，V 0.3~0.7）→ 裸岩/砾石
- 蓝青 → 水体（与水域掩膜互校）

**这是最真实的判据**——它直接读了地球上那块地真实长什么样，比任何经验规则都准，
而且顺带解决了「同一纬度，江南是水田、河西是戈壁」这种规则表写不完的情况。

**方案 B（兜底）：经验干旱带表。** 采样未命中（瓦片没加载）时，用经纬度矩形圈出主要干旱区：
撒哈拉、阿拉伯、伊朗高原、中亚、塔里木、戈壁、印度河、西南非。再叠文化区兜底。

> 落地时 **A 为主、B 兜底、季节永远参与**，与现有 `currentSeasonKind()` 的「同步取值 + 失败预取下局命中」
> 模式完全一致，不引入新的加载阻塞。

#### L1 的 8 类 biome

| biome | 判据（纬度 + 采样色 + 海拔） |
|---|---|
| `tropical_rainforest` 热带雨林 | \|lat\|<12°，绿，低地 |
| `savanna` 稀树草原 | 12~23°，黄绿相间 |
| `desert` 沙漠 | 黄褐为主，任意纬度（含高原冷漠） |
| `mediterranean` 地中海 | 30~45°，近海，黄绿 |
| `temperate_grass` 温带草原 | 35~55° 内陆，黄绿 |
| `temperate_forest` 温带森林 | 25~55°，绿，湿 |
| `boreal` 寒带针叶林 | 50~66°，绿暗 |
| `tundra_snow` 苔原雪原 | >66° 或 海拔≥雪线（按纬度动态：赤道 4800m → 60°N 1000m） |

---

## 三、Biome → 素材映射（83 张全部有位置）

> 每个 biome 给：**主地形 2~3 张随机铺**（避免单调）＋ **点缀地形**＋ **树种**＋ **灌木/贴花**。
> 季节列只写「与主表不同」的替换项。

| biome | 主地形（夏） | 秋 | 冬 | 树种 | 灌木·贴花 |
|---|---|---|---|---|---|
| 热带雨林 | `gr8 gr9 fo2` | 同 | 同（热带无冬） | `jungle rainforest brazilwood mangrove` | `plant_jungle plant_rainforest plant_fernpatch_rainforest rock_jungle` |
| 稀树草原 | `grs gr7 pc2` | `pc1 pc3 gr4` | `gr5` | `acacia baobab` | `plant_grass_dry(_patch) plant_weed rock_formation1~3` |
| 沙漠 | `des ds3 ds4` | `ds2 ds5 snd` | `qs pal` | `palm wax_palm dead` | `plant_cactus plant_dead decal_crack rock_limestone` |
| 地中海 | `gr2 gr7 pc1` | `gr4 for` | `gr5 sr2` | `olive cypress cypress_decorative italian_pine` | `plant_flower_1~4 plant_flowerbed plant_shrub_green` |
| 温带草原 | `gr3 gr6 sr2` | `gr4 gr5 pm1` | `sn2 sno` | `oak green_oak birch`（疏） | `plant_grass_green(_patch) plant_bush_green` |
| 温带森林 | `gr3 gr6 fo2` | `for underbrush_leaves gr4` | `sn2 snf` | 夏 `oak green_oak birch willow asian_maple_green bamboo peach_blossom`／秋 `autumn_oak asian_maple_autumn`／冬 `snow_autumn_oak dead` | `plant_underbrush fallen_leaves_maple_autumn/red fallen_leaves_peach_blossom` |
| 寒带针叶 | `gr9 fo2 r01` | `for pm2` | `sno sn2 snf` | 夏 `pine asian_pine monkey_puzzle`／冬 `snow_pine dead` | `plant_shrub_green rock_rock1~3 decal_ice` |
| 苔原雪原 | `sno sn2 snf` | 同 | `ice ic2 ic3` | `dead snow_pine`（极稀） | `decal_ice decal_crack rock_rock1~3` |

### L2 地貌修正（叠在 biome 之上）

| 海拔/坡度 | 地表替换 | 追加装饰 |
|---|---|---|
| 平原 <200m | 不变 | — |
| 丘陵 200~800m | 掺 `pc1 pc2 pm1` | `rock_rock1~3` |
| 山地 >800m 或坡度≥12° | 主地形换 `rck gravel_default rock_wet` | `mountain_01~11`、`cliff_*`、`rock_formation1~3 rock_pillar` |
| 高原 >2500m | `pm2 qs2 gravel_default` | `rock_limestone` |
| 雪线以上 | `sno sn2 ice` | `cliff_snow decal_ice` |

### L3 局部点缀

| 条件 | 地形 | 装饰 |
|---|---|---|
| 战场临海（水域掩膜命中海） | 边缘铺 `bc2 bc3 bc4 bch beach_wet`＋`wt2~wt6 wtr` | `rock_beach rock_sea1~2 oysters` |
| 临河湖 | `sh2 sh3 sha`＋浊水 `wt_brown wt_green wt_yellow(2)` | `reeds mangrove willow` |
| 高纬冬季水域 | `ice ic2 ic3 ice_beach` | `decal_ice` |
| 沼泽（低海拔+高湿） | `sh4 sh5 sha` | `plant_underbrush_jungle` |
| 城池/关隘 500m 内 | 道路 `rd1`（欧洲石板）/`rd2`（西亚橙石）/`rd5`（土路） | `decal_path_1~4` |
| 农业区（东亚水稻） | `fm1 rc1 rc2 rc3` | — |
| 农业区（麦作） | `fc1 fc2 fc3 fm2` | — |
| 梯田（东亚山地） | `rm1 rm2` | — |
| 资源点装饰（随机低频） | — | `forage_bush/fruit/papaya/pineapple mine_gold mine_stone` |
| 战后（可选） | — | `decal_crater felled_* stump_*` |

> 覆盖核对：83 张可用地形**全部出现在上表**，无一闲置；`bla kf1` 两张纯黑占位排除。

---

## 四、技术实现

### 4.1 素材转换（一次性）
1. **地形**：DDS(2048²) → PNG。**必须降采样**：原图 85×~8MB 直接入库会撑爆仓库和部署。
   AoE2 实际每 tile 只取 96×48 菱形，**降到 512² 足够**（85 张 ≈ 15~20MB）。
   脚本仿 `scratch/aoe2de_projectile_convert.py` 的写法新增 `aoe2de_terrain_convert.py`，
   输出 `public/SUCAI_TERRAIN/<name>.png`。
2. **装饰**：`n_*.sld` 走现成的 `scratch/aoe2de_unit_convert.py` 管线（同一套 SLD 解析 + hotspot），
   输出到 `public/SUCAI_NATURE/<NAME>/`。树是**单向素材**（无 8 向），按抛射物的单向模式提取即可。

### 4.2 铺地渲染
- 13 的坐标系是**屏幕像素**（`UNIT_PX=50`），不是等距投影 → **不需要实现 AoE2 的地形引擎**。
  直接用 `ctx.createPattern(tileImg,'repeat')` 铺满，再按 biome 混第二/第三张（柏林噪声或分块随机）打散单调感。
- **层序**（现有 ground 层不能动）：`地形 → 过渡叠加 → 贴花 → 湖/水 → 尸体烙印(ground) → 树/岩 → 士兵`。
  现有铁律「树/湖不遮士兵、画在 ground 之下」保持不变。
- **过渡混合**：`o_*` 那 10 张带 X 网格的就是 DE 的 blend mask。第一期**先不做**，
  单一主地形＋2~3 张随机掺色已经不单调；真要做再用 `globalCompositeOperation:'destination-in'` 上 mask。

### 4.3 性能
铺地是**每帧一次 pattern fill**，比现在每帧画几百个精灵便宜得多。
装饰（树/岩）沿用现有 `scatterTrees` 的一次性散布 + 缓存，不逐帧重算。

---

## 五、分期落地

| 期 | 内容 | 验收 |
|---|---|---|
| **P0** | 转 3 张草地（`gr3 gr6 gr8`）＋铺地代码，硬编码温带森林 biome | 实机看风格是否对路 |
| **P1** | 转全部 83 张地形；实现 L1+L2 判定（采样卫星色 + 海拔）；biome→地形映射表落地 | 换几个不同地区开战，地表明显不同 |
| **P2** | 转 DE 植被，**删除三国群英传树/湖**，按 biome 散布树种；季节切换 | 三国素材零引用 |
| **P3** | L3 点缀（海滩/河岸/农田/道路/贴花）＋过渡混合 | 细节到位 |

**P0 是唯一需要你先看一眼的**——风格不对就没必要往下做。

---

## 六、风险与取舍（要你知道）

1. **13 期间看不见真实地图**：地面铺满后河流/海岸/城池/领土色块全被盖住。13 是贴脸跟拍双将战，
   本来也看不出地理，但这一条不可逆。
2. **仓库体积**：地形降采样后 ~20MB，植被按需提取（52 种树全提约 100~200MB，建议**只提映射表里用到的**）。
   新素材必须 `git add`，否则线上 404（本项目部署停摆老病根）。
3. **卫星采样有延迟**：首战可能落到兜底规则，第二战命中缓存。与现有选季逻辑同样的行为，可接受。
4. **`scenario_a~l` 12 种剧本树**未分配用途——它们是战役专用的异色树，建议留着不用，或作为
   「远征脚本专属战场」的彩蛋。

---

## 七、需要你拍板的两件事

1. **P0 先做哪个 biome**？我建议温带森林（中原/江南战场最多）。
2. **植被提取范围**：全提 52 种树（体积大、但一次到位），还是只提映射表用到的 ~25 种（省一半体积）？
