# DE 随机地图生成算法（实测全量）

> 主人 2026-08-24：「你去看 DE 的制图算法是什么样的」「全部学习，不要一会石头有问题，
> 一会儿草有问题，能不能全部学习」。
>
> 本文是把 `AoE2DE/resources/_common/drs/gamedata_x2/` 下 **179 个 `.rms` + `.inc`**
> 全量统计出来的结果，不是看注释、不是凭印象。统计脚本见 §7。
>
> 🔴 **改 ZOOM13 地面观感之前先读这份**，别再一个点一个点地试。

---

## 1. 生成流程（六段，按执行顺序）

| 段 | 出现 | 作用 |
|---|---|---|
| `<PLAYER_SETUP>` | 126 | 玩家/资源/水体定义 |
| `<LAND_GENERATION>` | 121 | 陆地与水的分布 |
| `<ELEVATION_GENERATION>` | 153 | 高程 |
| `<CLIFF_GENERATION>` | 70 | 悬崖 |
| `<TERRAIN_GENERATION>` | 171 | **地形贴图**（地面观感的主体） |
| `<OBJECTS_GENERATION>` | 171 | **物件**（树/石/草/动物） |
| `<CONNECTION_GENERATION>` | 60 | 玩家间连接（道路） |

---

## 2. `<TERRAIN_GENERATION>` —— 地形怎么铺

### 2.1 指令与实测取值

| 指令 | 用了 | 中位 | 常见取值 |
|---|---|---|---|
| `create_terrain` | 10121 | — | — |
| `number_of_clumps` | 8282 | **512** | 512×3261 / 1000×1050 / 100×513 |
| `base_terrain` | 7697 | — | 铺在哪一层之上 |
| `land_percent` | 6942 | **100** | **100×5438（70%）** / 1 / 2 / 4 / 6 |
| `set_scale_by_groups` | 2873 | — | 随地图放大 |
| `spacing_to_other_terrain_types` | 2451 | 2 | 0 / 1 / 2 / 3 / 4 |
| `terrain_mask` | 2295 | 1 | 1×1821 / 2×474 |
| `number_of_tiles` | 1390 | 120 | 120 / 128 / 48 / 86 |
| `set_avoid_player_start_areas` | 805 | — | 避开出生点 |
| `height_limits` | 553 | — | `1 1` / `0 0` / `5 5` / `0 7` |
| `set_scale_by_size` | 352 | — | |
| `clumping_factor` | 226 | 15 | 15 / **-10** / 100 / 20 / -20 |
| `set_flat_terrain_only` | 167 | — | 只铺平地 |

### 2.2 🔴 核心机制：**按高度分层铺满**，不是随机撒斑块

`Acclivity.rms` 的完整形态：

```
create_terrain SLOPE_TERRAIN {
    base_terrain     EDGE_TERRAIN
    land_percent     100          ← 铺满
    number_of_clumps 512          ← 512 个碎块
    height_limits    0 2          ← 只铺在高度 0~2
}
create_terrain SLOPE_BLEND_TOP {
    base_terrain     SLOPE_TERRAIN    ← 铺在上一层之上
    land_percent     100
    number_of_clumps 512
    height_limits    2 3          ← 只铺在高度 2~3
}
```

三条要点：

1. **`land_percent 100` 占 70%** —— 地形层默认**铺满**，不是点缀。
2. **`number_of_clumps` 中位 512** —— 上千个小碎块，靠 blends 咬边，出来是**细密斑驳**而不是几块补丁。
3. **`height_limits` 把地形绑到高度带** —— 洼地一种、坡上一种、顶上一种，
   地面变化跟着**地形起伏**走，不是随机噪点。这才是 DE 地面「有地理感」的原因。

`base_terrain` 指向上一层 → 层层叠加，最终看到的是最上层 + 咬合缝隙里露出的下层。

### 2.3 季节分层：`F_seasons.inc`

`LAYER_A/B/C/E/F` 在 `F_seasons.inc` 里按气候带（`PH_ALPINE` 等）× `percent_chance` 随机组定义，
638 处 `create_terrain LAYER_x` 引用。一组示例（PH_ALPINE）：

```
#const LAYER_A 12   /* g_gr2  Grass 2   */
#const LAYER_B 5    /* g_for  Underbrush */
#const LAYER_C 0    /* g_grs  Grass      */
#const LAYER_E 9    /* g_gr3  Grass 3    */
#const LAYER_F 32   /* g_sno  Snow       */
```

**实测 LAYER 组内两两色差：中位 41，43% 超过 45**
（最大 `for↔sno` 185、`ds3↔sno` 153，去掉雪也有 `ds3↔pal` 81、`ds4↔pal` 73）。

> 🔴 **DE 敢用大色差，是因为它铺满 + 512 碎块 + blends 咬边。**
> 只铺 5~12% 的孤立斑块用大色差 = 补丁。
> **小斑块 + 大色差 = 补丁；碎块铺满 + 大色差 = 斑驳质感。**

---

## 3. `<OBJECTS_GENERATION>` —— 物件怎么放

### 3.1 六个槽位（每个地形亚区填一套 `#const`，见 `Arabia.rms`）

| 槽位 | 角色 | `number_of_objects` | 间距 | 关键规则 |
|---|---|---|---|---|
| `AESTHETIC_FLAT` | 平面装饰 | 2 | 20 | `group_placement_radius 3`（成簇） |
| `AESTHETIC_GROUPED` | 成组装饰 | 2 | 28 | 同上 |
| `AESTHETIC_SCATTER` | 满地散布 | 1024 | 42 | 全场**同一种** |
| `SOLID_OBJECT` | 主岩石 | **4** | 16 | `second_object SOLID_UNDERBRUSH` 自带伴生 |
| `SOLID_SURROUND` | 环绕碎石 | **32 ×2** | 8 | `actor_area_to_place_in 560` 只能放主岩石区内 |
| `SOLID_UNDERBRUSH` | 岩石旁的植被 | — | — | 由 `second_object` 带出 |

⚠️ `Arabia.rms` 里 11 组 `#const` 是**按 `percent_chance` 随机选一组**，
`create_object` 只执行一次 —— 不是 11 组各来一遍，别把总量乘以 11。

### 3.2 指令与实测取值

| 指令 | 用了 | 中位 | 常见取值 |
|---|---|---|---|
| `avoid_actor_area` | 25412 | — | 避开出生点/村民/墙/伴生树 |
| `number_of_objects` | 6081 | 4 | 1×1427 / **1024×806** / 2 / 4 / 32 |
| `set_gaia_object_only` | 5066 | — | |
| `min_distance_group_placement` | 3493 | 12 | 1 / 2 / 18 / 21 / 16 |
| `temp_min_distance_group_placement` | 3141 | 6 | 4 / 1 / 6 / 2 / 16 |
| `actor_area_to_place_in` | 2821 | — | **只放在某个 actor area 内** |
| `terrain_to_place_on` | 1629 | — | BASE_TERRAIN×246 / ROAD2×150 / MIDDLE_TERRAIN×92 |
| `second_object` | 1481 | — | 一次生成两个对象 |
| `number_of_groups` | 1434 | 3 | 1 / 1024 / 3 / 2 |
| `set_scaling_to_map_size` | 697 | — | 随地图放大 |
| `group_placement_radius` | 627 | **1** | **1×317 / 2×196 / 3×95** |

### 3.3 🔴 关键：素材绑**地形**不绑气候

`terrain_to_place_on` 用了 1629 次。装饰长在哪，由**脚下地形**决定。
我们的 `DecorFit.GROUND_DECOR_BY_BASE` 就是照这条建的。

### 3.4 成簇半径很小

`group_placement_radius` 中位 **1**，常见 1~3 格。草花是**一小簇一小簇**的，
不是均匀噪点，也不是大片。

---

## 4. 地图尺寸（`EnlargeMap.inc`）

| | 边长 | 格数 |
|---|---|---|
| TINY | 144 | 20736 |
| SMALL | 168 | 28224 |
| MEDIUM | 200 | 40000 |
| LARGE | 220 | 48400 |
| HUGE | 240 | 57600 |
| GIGANTIC | 255 | 65025 |

**我们一屏（2000×1080，TILE 64×32）：屏内 2111 格 / 走廊外可用 1066 格。**
面积比 ≈ **1 : 9.8**（对 TINY）。

> 🔴 **引用 DE 任何数量之前，先做这个换算。**
> 曾经照一张 DE 截图目测「一屏 18~22 处岩石」直接改数字，
> 结果石头 34 个/屏、超 DE 密度 5~10 倍。那张还是**战役地图（手工摆放）**，
> 不是随机地图 —— 截图不能当密度基准。

---

## 5. 其他段

### `<ELEVATION_GENERATION>`
`create_elevation` (208) / `number_of_clumps` (391) / `number_of_tiles` (386) /
`enable_balanced_elevation` (128) / `spacing` (48)

### `<CLIFF_GENERATION>`
`min|max_number_of_cliffs` (各 90) / `cliff_type` (64) / `min|max_length_of_cliff` (各 18) /
`cliff_curliness` (17) / `min_distance_cliffs` (17)

### `<CONNECTION_GENERATION>`
`terrain_cost` (237) / `terrain_size` (212) / `replace_terrain` (183) /
`create_connect_all_players_land` (27)

—— 玩家间连通路径。我们的城门前石路由 `Scene13WarLayer.addGateFoundation` 负责，机制不同。

---

## 6. 我们的对齐状态

| DE 机制 | 我们 | 状态 |
|---|---|---|
| 装饰绑地形（`terrain_to_place_on`） | `DecorFit.GROUND_DECOR_BY_BASE` | ✅ 已对齐 |
| SCATTER 全场同一种 | `scatterAsset` 开场选定 | ✅ |
| FLAT 成簇（半径 1~3 格） | `flatClusters` + `TILE_W*1.5` | ✅ |
| 主岩石 + 环绕碎石 + 伴生植被 | 岩石成套伴生系统 | ✅ |
| 石头密度（换算 3.5~6.9/屏） | 实测 9.9（1.4×） | ✅ 容差内 |
| 碎块数（换算约 52） | 45 | ✅ |
| **`land_percent 100` 铺满** | 覆盖 25~45% | ⚠️ 偏低 |
| **`height_limits` 按高度分层** | **无** | 🔴 未实现 |
| **多层 `base_terrain` 叠加** | 单层 | 🔴 未实现 |
| `spacing_to_other_terrain_types` | 无 | 🔴 未实现 |
| `set_flat_terrain_only` | 无 | 🔴 未实现 |
| `clumping_factor`（含负值） | 固定随机游走 | 🔴 未实现 |
| `terrain_mask` | 无 | 语义未确认，暂不实现 |

---

## 7. 复现统计的脚本

```bash
npx tsx tools/audit-de-map-algorithm.mts
```

它重跑本文所有统计（指令频次 + 参数取值分布 + 地图尺寸 + 面积换算），
DE 更新后可以直接比对本文数字是否还成立。
