# 🔴 给 DS 的工单 · P3：把所有 DE 素材一次用上（2026-08-20）

> **主人指示**：「先别测试，先推进进度，把所有素材都用上，之后哪有问题调哪。」
>
> **本单不设中途验收点。** 从头做到尾，做完一次性交付。允许粗糙，重点是**素材全部上场**。
> 不要为任何一个素材的细节停下来问——按下面的表照做，有疑问选最合理的那个，做完在汇报里标注即可。

---

## 批次 A：植被/装饰全量提取

按 biome 映射表把**用得上的全部提出来**（P1 已提的 13 个跳过）。输出格式同 P1
（`public/SUCAI_NATURE/<NAME>/frames.png` + `.pc.png` + `_meta.json`，原尺寸不缩放，阴影保持半透明）。

**树（按 biome）**
| biome | SLD |
|---|---|
| 热带雨林 | `n_tree_jungle` `n_tree_rainforest` `n_tree_brazilwood` `n_tree_mangrove` |
| 稀树草原 | `n_tree_acacia` `n_tree_baobab` |
| 沙漠 | `n_tree_palm` `n_tree_wax_palm` `n_tree_dead` |
| 地中海 | `n_tree_olive` `n_tree_cypress` `n_tree_cypress_decorative` `n_tree_italian_pine` |
| 温带 | `n_tree_oak` `n_tree_autumn_oak` `n_tree_snow_autumn_oak` `n_tree_asian_maple_green` `n_tree_asian_maple_autumn` `n_tree_peach_blossom` |
| 针叶/寒带 | `n_tree_pine` `n_tree_asian_pine` `n_tree_snow_pine` `n_tree_monkey_puzzle` |
| 水生 | `n_tree_reeds` `n_tree_lush_bamboo` |

**灌木/草/花**
`n_plant_cactus` `n_plant_dead` `n_plant_weed` `n_plant_shrub_green` `n_plant_grass_dry` `n_plant_grass_dry_patch`
`n_plant_jungle` `n_plant_rainforest` `n_plant_fernpatch_rainforest` `n_plant_underbrush_jungle` `n_plant_underbrush_rainforest`
`n_plant_flower_2` `n_plant_flower_3` `n_plant_flower_4`

**岩石/地貌**
`n_rock_formation1~3` `n_rock_pillar` `n_rock_limestone` `n_rock_jungle` `n_rock_beach` `n_rock_sea1` `n_rock_sea2`
`n_mountain_01~11` `n_cliff_default` `n_cliff_limestone` `n_cliff_sand` `n_cliff_snow` `n_cliff_terrace`

**资源点/贴花**
`n_forage_bush` `n_forage_fruit` `n_forage_papaya` `n_forage_pineapple` `n_mine_gold` `n_mine_stone` `n_oysters`
`n_decal_crack` `n_decal_crater` `n_decal_ice` `n_decal_path_1~4`
`n_fallen_leaves_maple_autumn` `n_fallen_leaves_maple_red` `n_fallen_leaves_peach_blossom`
`n_tree_felled_generic` `n_tree_stump_generic`

**季节归属一律按文件名**（`green/autumn/snow/dead` 前缀自解释），`birch` 已按段拆好，其余当单季用。
**不要再为帧含义停下来**——多帧一律当外观变体随机取，`felled/stump` 是独立文件不会混进来。

---

## 批次 B：植被接线（`Scene13WarLayer.ts`）

1. **树种按 biome + 季节选**，表如下（`detectBiome` 已有，`sceneSeason` 已接回）：

| biome | 绿(0) | 橙(1) | 白(2) |
|---|---|---|---|
| tropical_rainforest | jungle / rainforest / brazilwood | 同 | 同 |
| savanna | acacia / baobab | acacia / baobab | acacia / dead |
| desert | palm / wax_palm / dead | 同 | 同 |
| mediterranean | olive / cypress / italian_pine | olive / cypress | cypress / dead |
| temperate_grass | green_oak / birch(绿) | autumn_oak / birch(秋) | snow_autumn_oak / birch(冬) |
| temperate_forest | green_oak / birch(绿) / willow / asian_maple_green / bamboo | autumn_oak / asian_maple_autumn / birch(秋) | snow_autumn_oak / snow_pine / birch(冬) / dead |
| boreal | pine / asian_pine / monkey_puzzle | pine / autumn_oak | snow_pine / dead |
| tundra_snow | dead / snow_pine（极稀） | 同 | 同 |

每场从对应格随机选 2~3 种混布。**树可以混种**（杂树林），这和地形不同。

2. **灌木/草/花/岩石**：每个 biome 配一组，低频散布（数量约为树的 2~3 倍，尺寸小）：
   - 热带 → `plant_jungle` `plant_rainforest` `plant_fernpatch_rainforest` `rock_jungle`
   - 稀树草原/沙漠 → `plant_grass_dry(_patch)` `plant_weed` `plant_cactus` `plant_dead` `rock_formation1~3` `rock_limestone`
   - 地中海 → `plant_flower_1~4` `plant_flowerbed` `plant_shrub_green`
   - 温带 → `plant_grass_green(_patch)` `plant_bush_green` `plant_underbrush`
   - 寒带/雪 → `plant_shrub_green` `rock_rock1~3` `decal_ice`

3. **层序铁律不变**：树/岩/灌木画在 `ground`（尸体层）**之下**，永不遮士兵。

4. **L2 山地追加**：`elev >= 800` 或坡度≥12° 时，额外散布 `mountain_01~11` `cliff_*` `rock_pillar`（大件、少量、贴边缘放，别挡中央战场）。

---

## 批次 C：L3 局部点缀

按方案文档 §三 的 L3 表做，判据全部已有：

| 条件 | 判据来源 | 地形/装饰 |
|---|---|---|
| 临海 | `LandSeaSystem` 水域掩膜命中海 | 画面一侧铺 `bc2/bc3/bch/beach_wet` + `wt2~wt6`；散 `rock_beach` `rock_sea1/2` `oysters` |
| 临河湖 | 水域掩膜命中内陆水 | 不规则水塘：`wt_brown/wt_green/wt_yellow` 填 + `sh2/sh3/sha` 描边；散 `reeds` `mangrove` `willow` |
| 高纬冬季水域 | `sceneSeason==2` 且临水 | 换 `ice/ic2/ic3/ice_beach` + `decal_ice` |
| 沼泽 | 低海拔 + tone=green + 临水 | `sh4/sh5/sha` + `plant_underbrush_jungle` |
| 城池/关隘附近 | 战场坐标距最近城 < 一定阈值 | 斜穿一条路：`rd1`（拉丁/日耳曼）/`rd2`（西亚/中亚）/`rd5`（其余）+ `decal_path_1~4` |
| 东亚农业区 | 文化区 ∈ 中原/江南/岭南/日本/朝鲜 且低海拔 | 一角铺 `fm1/rc1/rc2/rc3`（水田） |
| 其他农业区 | 拉丁/日耳曼/西亚等低海拔 | 一角铺 `fc1/fc2/fc3/fm2`（旱田/麦） |
| 东亚山地 | 上述文化区 + `elev>=800` | `rm1/rm2`（梯田） |
| 资源点 | 全 biome，低频 | `forage_bush/fruit/papaya/pineapple` `mine_gold` `mine_stone` |
| 战后残迹 | 可选，低频 | `decal_crack` `decal_crater` `tree_felled_generic` `tree_stump_generic` |

**做法从简**：这些点缀都是「在离屏 ground 之下的装饰层上画若干张图」，
不需要真正的地形混合，随机位置 + 数量上限即可。**先让素材上场，观感后调。**

---

## 收尾要求

1. `npx tsc --noEmit` + `npm run build` 通过。
2. 所有新素材 **git add 入库**，确认 `.vercelignore` 没排掉 `public/SUCAI_NATURE` / `public/SUCAI_TERRAIN`。
3. 汇报里列一张**素材使用清单**：83 张地形 + 提取的全部装饰，逐个标注「用在哪个 biome / 哪个条件下」，
   **凡是没用上的，单独列出来说明原因**（主人的要求是「每个素材都有可用的地方」）。
4. 做完一次性交付，中途不要停下来问。

## 禁止

- ❌ 不许碰引擎/结算/寻敌/动画相位
- ❌ 不许动 ZOOM 8/9/10
- ❌ 不许改已定稿的铺地方式（纯重复、每场一张、原尺寸）
- ❌ 不许为帧含义、季节归属停下来等确认
