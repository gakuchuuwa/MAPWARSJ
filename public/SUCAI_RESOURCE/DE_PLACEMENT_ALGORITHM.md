# 帝国时代 2 决定版（AoE2 DE）自然资源与生态摆放算法规范

> 本文档详细阐述帝国时代 2 决定版（AoE2 DE）官方随机地图生成系统（RMS, Random Map Scripting）中，关于**露天矿产、水产鱼群、盐田硫磺、农林作物、野生动物与天空飞鸟**的摆放逻辑、数学模型与生成算法，作为本项目战术战场（Zoom 13）与战略大地图生态生成的权威实现依据。

---

## 一、 RMS 对象生成流水线总览（Pipeline Architecture）

AoE2 DE 的地图生成分为四大阶段：
1. **`<PLAYER_SETUP>`**：确定玩家数量、阵营分布与势力起点（TC Spawn Points）；
2. **`<LAND_GENERATION>`**：生成大陆、岛屿、高程丘陵与河流海岸拓扑；
3. **`<TERRAIN_GENERATION>`**：按照生物群落（Biome）铺设基础草皮、森林斑块、沙滩与浅水；
4. **`<OBJECTS_GENERATION>`**（**核心摆放阶段**）：按照空间几何约束、地形吸附规则与团簇算法，放置所有自然资源、矿产、动物、植物与环境装饰。

---

## 二、 核心摆放算法与数学模型

### 1. 簇状聚类生成算法（Clump / Cellular Automata Clustering）
DE 中的大部分地表资源（金矿、石矿、浆果丛、鹿群、水草）都不是单个零散出现，而是以**紧凑团簇（Resource Clusters）**形式呈现。

- **算法过程**：
  1. **确定簇锚点（Cluster Anchor / Seed）**：在满足全局距离约束的合法网格中选取一个种子坐标 (x0, y0)；
  2. **邻接胞元吸附生长（Constrained Random Walk / CA Growth）**：
     - 从种子点开始，以曼哈顿距离或切比雪夫距离在 R <= group_placement_radius（矿石通常为 2~3 格，浆果丛为 1~2 格）内随机搜寻相邻的 4-邻域或 8-邻域空闲格；
     - `set_tight_grouping`（紧凑贴合）：优先选择与已有矿块接触边最多的相邻空格，形成自然连贯、咬合紧密的矿脉斑块；
     - `group_variance`（数量浮动）：簇内实体数服从 N = N_base ± Variance 正态扰动。
  3. **防重叠与排斥（Exclusion Box Collision）**：
     - 每个放置的实体占用 1x1 或 2x2 格阻挡（Obstruction Tile），禁止任何其他建筑、树木或不同种类的矿物侵入。

---

### 2. 距离环分区算法（Distance Ring Partitioning）
为了兼顾竞技平衡性与自然真实感，DE 采用**同心距离环（Distance Bands）**算法对资源进行分层投放：

Band(R_min, R_max) = { (x, y) | R_min <= dist((x, y), Spawn) <= R_max }

| 资源类别 | 到基地的距离环 (R_min ~ R_max) | 簇数 (Groups) | 簇内数量 (Objects) | 排布特性 |
|---|---|---|---|---|
| **主金矿（Primary Gold）** | 10 ~ 14 格 | 1 | 7~8 块金矿 | 紧凑贴合，必在干燥平地 |
| **副金矿（Secondary Gold）**| 18 ~ 24 格 | 1 | 4~5 块金矿 | 中距离扩张点 |
| **远金矿（Tertiary Gold）** | 26 ~ 34 格 | 1 | 4 块金矿 | 野外争夺点 |
| **主石矿（Primary Stone）**| 12 ~ 18 格 | 1 | 5 块石矿 | 紧凑贴合 |
| **远石矿（Secondary Stone）**| 24 ~ 30 格 | 1 | 4 块石矿 | 野外石料点 |
| **浆果丛（Forage Bush）** | 10 ~ 13 格 | 1 | 6 丛浆果 | 紧贴基地呈弧形或排状 |
| **近身羊群/家畜** | 7 ~ 9 格 | 1 | 4 只 | 出生点直接可见 |
| **远方野猪/大型猎物** | 14 ~ 18 格 | 2 | 各 1 只 | 独立巡逻分布 |
| **鹿群（Deer / Prey）** | 18 ~ 26 格 | 1 | 4~6 只 | 疏松集群（Loose Grouping） |
| **掠食猛兽（Predators）** | 30 ~ 45 格 | 2~3 | 1~2 只 | 远离基地，散布野外阴影区 |

---

### 3. 泊松圆盘与最小间隔排斥（Poisson-Disk Spacing & Mutual Exclusion）
避免资源扎堆和地形穿插的核心机制：
- **`min_distance_group_placement`（同类簇间距）**：
  同类资源簇之间必须保持最小空隙（例如金矿与金矿之间 >= 18 格，石矿之间 >= 14 格）；
- **`avoid_forest_zone` / `avoid_water`（跨地貌排斥）**：
  矿石、农作物必须与森林边界保持 >= 2 格距离（避免矿石被树木包围卡死采集路径），与水岸保持 >= 3 格距离。

---

## 三、 各类具体资源的 DE 官方摆放逻辑与参数

### 1. 露天金矿与石矿（Gold & Stone Mines）
- **地形要求**：严格生成于陆地干燥地面（`GRASS`, `DIRT`, `DESERT`, `SNOW` 等），严禁在水体、浅滩、沼泽或高陡坡边缘生成；
- **排布形态**：DE 官方通过 7 种不同角度与晶体朝向的切片贴图，在 2x3 或 3x3 菱形格内拼出高低错落的露天矿床；
- **衰减与残矿逻辑**：
  - 储量 > 66%：渲染满矿模型（`GOLD_MINE` / `STONE_MINE`），金光灿烂、石料棱角分明；
  - 储量 33% ~ 66%：切换为开采过半模型（`GOLD_MINE_66` / `STONE_MINE_66`）；
  - 储量 < 33%：切换为残矿基岩（`GOLD_MINE_33` / `STONE_MINE_33`）。

---

### 2. 水产鱼群与海洋资源（Fish & Marine Ecology）

#### ① 浅海鱼群（Shore Fish）
- **生成地形**：仅在 `WATER` 与 `SHALLOW` 距陆地岸线 1 ~ 2 格以内的狭窄水带生成；
- **渲染与动画**：
  - 固定于浅水网格中心，每秒循环播放轻微的水面波纹翻腾动画（90 帧连续序列）；
  - 渔民可直接站在岸边涉水采捕（无需渔船）。

#### ② 深海飞跃鱼群（Snapper, Salmon, Tuna, Marlin, Dorado, Perch）
- **生成地形**：仅在深水区（`DEEP_WATER`，距所有陆地岸线 >= 6 格）生成，且鱼群之间保持 >= 12 格最小间距；
- **动态跃水循环算法（Timer-Driven Jump Cycle）**：
  - **水下潜游状态（80% 时间）**：仅渲染水下跟随暗影（`*_FISH_UNDERWATER`）与半透明波光；
  - **飞跃破水状态（20% 时间）**：随机每隔 8 ~ 16 秒，触发一次 90 帧完整的冲出水面、阳光下鱼鳞反光、空中翻腾并砸入水中的激烈跳水动画（`*_FISH`）；
  - 各鱼群的计时器附加随机相位偏移 delta_t = rand(0, 2pi)，避免全屏鱼群同频起跳。

#### ③ 牡蛎礁与珍珠贝（Oysters）
- **生成地形**：生成于近海浅滩（`SHALLOW` 或近岸岩礁水域）；
- **排布**：以 2~4 格小斑块聚集，附带水面透明倒影（`n_oysters_reflection`）。

---

### 3. 农林经济作物、葡萄园与采集业（Vineyard, Crops & Forage）

#### ① 葡萄园（Vineyard / Grapevine）
- **生成地形**：地中海气候、温带平原或干燥山脚缓坡；
- **线性排布算法（Row-Aligned Vineyard Rows）**：
  - 葡萄藤架采用等距投影下的**平行直线阵列**（沿等距网格 X 轴或 Y 轴连续排布 4~8 格）；
  - 运用 16 种不同接头（直行架、端头木桩、拐角、转折），拼出整齐划一的庄园式葡萄垄行。

#### ② 浆果丛与野生果树（Forage Bushes & Fruit Trees）
- **生成形态**：6 丛浆果围绕锚点以半月形（Crescent）或扇形紧贴聚拢，高度紧凑；
- **储量动态视觉**：根据剩余浆果数在 `FORAGE_BUSH`（挂满红果）-> `_66` -> `_33` 之间无缝切换。

---

### 4. 盐田、干盐湖与硫磺地热（Salt Lakes & Sulfur Craters）

- **干盐湖 / 盐田（Salt Crack & Salt Decals）**：
  - 生成于极度干旱盆地（`DESERT`, `DIRT4`, `CRACKED_SAND`）；
  - 采用多层贴花算法（Decal Layering）：底层铺设白盐地表纹理（`pal1` / `ds2`），上层点缀放射状干裂地壳贴花（`SALT_CRACK`）与高反光盐晶结晶斑（`SALT_ICE_DECAL`）。
- **硫磺地热坑（Sulfur Craters）**：
  - 生成于火山带、高山关隘或干旱地质断层裂隙附近；
  - 采用圆形/椭圆凹坑贴花（`SULFUR_CRATER`），自带暗黄硫磺边缘沉积与热泉水汽效果。

---

### 5. 野生动物与飞鸟群落（Flocking Animals & Ambient Avians）

#### ① 草原鹿群与羚羊的群聚算法（Boid-like Loose Flocking）
- **初始生成**：4~6 只同类动物生成在同一锚点周围 3x3 格范围内；
- **群聚重心牵引（Tethered Herd Centroid）**：
  - 族群计算几何重心 C = sum(P_i) / N；
  - 每只动物在闲逛（Idle -> Walk）时，随机朝向向量为 V = 0.6 * V_random + 0.4 * (C - P_i)，确保羊群/鹿群永远保持松散成群，绝不单独走失跑散。

#### ② 掠食猛兽的漫游与警戒（Predator Roaming）
- **生成位置**：严格限制在地图边缘与中立开阔荒野，远离双方基地；
- **AI 状态机**：
  - **巡逻态（Roam）**：在生成点 8x8 格领地内慢速游荡（`walk`）；
  - **警戒态（Aggro）**：当敌方士兵、村民或鹿群进入半径 6 格视野时，切换为高速奔跑（`run`）并靠近进入攻击（`attack`）。

#### ③ 高空巡航飞鸟（Sky Avians: Hawks, Falcons, Storks, Vultures）
- **空间独立**：不参与地面网格碰撞，脱离地面层在渲染层最高 Z 轴绘制；
- **样条航线生成算法（Spline Cruise Path）**：
  - 随机生成 4~6 个大尺度航路点（Waypoints，覆盖全图）；
  - 采用三次样条（Catmull-Rom）生成平滑无折角的闭合飞行曲线；
  - 在航路点附近有 30% 几率切换为定点盘旋（`hover` 动画，绕半径 60px 缓速圆周旋转 2~3 圈），再继续向前飞行动画（`fly`）。

---

## 四、 本项目（MAPWAR）落地对接结构

在战术战场生成器（`src/ui/scene13/Scene13EnvironmentGenerator.ts`）与战略大地图中应用上述算法的建议结构：

```typescript
// 战术模式（Zoom 13）资源与生态生成结构
export interface ResourcePlacementRule {
    category: 'mine' | 'marine' | 'agriculture' | 'geology' | 'animal' | 'bird';
    asset: string;
    underwaterAsset?: string;
    clustering: {
        groupsCount: number;
        objectsPerGroup: number;
        radius: number;
        tight: boolean;
    };
    spatialConstraints: {
        minDistToCenter: number;
        maxDistToCenter: number;
        minDistBetweenClusters: number;
        avoidCorridor: boolean;
    };
    terrainAffinity: {
        requiredTerrain?: string[];
        waterDepth?: 'deep' | 'shallow' | 'shore' | 'none';
        slopeLimitMax?: number;
    };
    animationCycle?: {
        hasJumpingCycle?: boolean;
        jumpIntervalSec?: [number, number];
        hasFlocking?: boolean;
    };
}
```

---

## 五、 总结

AoE2 DE 的资源摆放精髓在于**“规则严谨的团簇几何 + 贴合地理的距离环分区 + 呼吸感十足的动态循环”**：
1. **矿产**成簇咬合、依储量渐进衰减；
2. **水产**分层分布、深海鱼跃浪、浅海鱼翻波；
3. **农林**葡萄成垄、浆果成扇；
4. **动物**鹿群牵引、猛兽巡境、群鸟高飞。
