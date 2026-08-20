# 🔴 给 DS 的工单 · P2：biome 判定 —— 让地面按战场变（2026-08-20，最高优先级）

> **主人已明确不满**：「鼓捣半天了，怎么还是这片草地」。
> 所有战场都铺同一张温带绿草，塞维利亚（地中海）、喀布尔（半干旱山地）、饶乐水（草原）一个样。
> **这一单做完，地面必须按战场变。** 树的事往后放，不许再阻塞。

---

## 0. 先解锁：9 个待确认树素材，**按文件名定季，直接放行**

不用再出图、不用再等主人指认。DE 的命名自解释，风险仅为观感偏差、不是灾难：

| 素材 | 定季 |
|---|---|
| `n_tree_autumn_oak` | 秋 |
| `n_tree_snow_autumn_oak` | 冬 |
| `n_tree_asian_maple_green` | 绿 |
| `n_tree_asian_maple_autumn` | 秋 |
| `n_tree_pine` | **四季通用**（常绿针叶） |
| `n_tree_snow_pine` | 冬 |
| `n_tree_bamboo` | **四季通用**（常绿） |
| `n_tree_dead` | 冬 / 干旱区通用 |
| `n_tree_oak` | **唯一例外**：与 `green_oak` 并存，疑似含多季。→ **本单先不用它**，`green_oak` 已够用 |

色相测量表已废弃，不要再参考。**全部提取，然后立刻转入下面的正题。**

---

## 1. 核心任务：新建 `Scene13Biome.ts`

### 1.1 卫星色采样器（新写，仿 `ElevationSampler`）

`src/world/land-sea/ImagerySampler.ts`：
- 瓦片源：ESRI World Imagery
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **完全照抄 `ElevationSampler` 的结构**：同一套 `latLngToTilePixel`、离屏 canvas 读像素、
  `getXxxSync()` 命中缓存就返回、未命中返回 null 并 `scheduleFetch` 预取下局。
  **不要引入任何阻塞式等待**——这是 13 的铁律。
- 采样 zoom 建议 9~10（一块瓦片覆盖战场足够）。
- `getToneSync(lat,lng): 'green'|'yellow'|'white'|'gray'|'blue'|null`
  取战场中心 **32×32 像素的中位色**（中位数不是平均，避免个别亮点拉偏），转 HSV 后：
  - `V>0.80 && S<0.15` → `white`（雪/冰）
  - `S<0.12 && V 0.30~0.70` → `gray`（裸岩/砾石）
  - `H 60~160 && S>0.25` → `green`（植被）
  - `H 20~60` → `yellow`（干旱/枯黄）
  - `H 160~260 && S>0.2` → `blue`（水体）

### 1.2 biome 判定

```ts
export type Biome = 'tropical_rainforest' | 'savanna' | 'desert' | 'mediterranean'
                  | 'temperate_grass' | 'temperate_forest' | 'boreal' | 'tundra_snow';

export function detectBiome(lat: number, lng: number): Biome
```

判定顺序（**先硬后软**）：
1. **雪线**：`snowLine = 4800 - |lat| * 63`（赤道 4800m → 60° 约 1000m）。
   `elev >= snowLine` → `tundra_snow`；`|lat| >= 66` → `tundra_snow`。
2. **卫星色**（`getToneSync`，命中才用）：
   - `white` → `tundra_snow`
   - `gray` → 若 `elev >= 800` → `tundra_snow` 的岩石变体（走 L2 山地地表），否则 `desert`
   - `yellow` → `|lat| < 23 ? 'savanna' : 'desert'`
   - `green` → 落到第 3 步的纬度带，但**强制排除 desert**
3. **纬度带兜底**（采样未命中时的主判据）：
   - `|lat| < 12` → `tropical_rainforest`
   - `< 23` → `savanna`
   - `< 35` → 近海 `mediterranean`，内陆 `desert`
   - `< 50` → `green` 则 `temperate_forest`，否则 `temperate_grass`
   - `< 66` → `boreal`
4. **文化区兜底**（前面全没命中时）：沿用现有 `currentSeasonKind()` 里那套
   （TIBET→雪；西域/草原/河西/北方/中亚/东北→干旱系）。

### 1.3 L2 地貌修正（叠在 biome 之上，返回地表候选）

| 条件 | 地表 |
|---|---|
| `elev >= snowLine` | `sno sn2 snf` |
| `elev >= 2500` | `pm2 qs2 gravel_default` |
| `elev >= 800` 或坡度 ≥12° | `rck gravel_default rock_wet` |
| `elev >= 200` | 在 biome 主地形里掺 `pc1 pc2 pm1` |
| 否则 | biome 主地形 |

坡度用现成的 `TerrainSlope`。

---

## 2. 地形素材：转全部 83 张

`python scratch/aoe2de_terrain_convert.py`（不带参数 = 全转），输出 `public/SUCAI_TERRAIN/`。
排除 `bla` `kf1` 两张纯黑占位。**512² 降采样、必须 git add 入库**。

## 3. biome → 主地形映射（照抄，别自创）

| biome | 夏/春 | 秋 | 冬 |
|---|---|---|---|
| tropical_rainforest | `gr8` | `gr8` | `gr8` |
| savanna | `grs` | `pc1` | `gr5` |
| desert | `des` | `ds2` | `qs` |
| mediterranean | `gr2` | `gr4` | `gr5` |
| temperate_grass | `gr6` | `gr4` | `sn2` |
| temperate_forest | `gr3` | `for` | `sn2` |
| boreal | `gr9` | `pm2` | `sno` |
| tundra_snow | `sno` | `sno` | `ice` |

季节直接用现有 `sceneSeason`（0绿/1橙/2白），**不要另造**。
每场仍是**只选一张、全场统一、纯 `createPattern` 重复铺**——这三条已定稿，不许再动。

## 4. 验收（主人要看的就是这个）

开四场不同地区的战斗，地面必须明显不同：
- **塞维利亚**（37°N 西班牙）→ 地中海黄绿 `gr2`
- **喀布尔**（34°N 海拔1800）→ 干旱/山地 `des` 或 `rck`
- **饶乐水**（东北草原）→ `gr6` / `pc1`
- **青藏高原任一点**（海拔>3600）→ 雪 `sno`

四张截图交主人验收。**这一单的成败只看这个**。

## 5. 禁止

- ❌ 不许阻塞加载（采样未命中就走兜底，下局命中）
- ❌ 不许再动铺地方式（纯重复、每场一张、原尺寸）
- ❌ 不许碰引擎/结算/ZOOM 8/9/10
- ❌ 不许再为树的帧含义停下来等确认
