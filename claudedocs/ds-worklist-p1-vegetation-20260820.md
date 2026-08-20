# 给 DS 的工单 · P1：13 场景植被/装饰全面 DE 化（2026-08-20）

> 总方案见 `claudedocs/scene13-de-terrain-plan-20260820.md`。
> **本工单只做 P1**，不要顺手做 P2（biome 判定）——那是下一单。

---

## 0. 分期已调整，先看清楚顺序

| 期 | 内容 | 状态 |
|---|---|---|
| P0 | 铺地：3 张草地 + 每场统一一张 | ✅ 已完成（铺法已修：原尺寸 512 铺 + 每块镜像/旋转打散重复） |
| **P1** | **植被/装饰全面 DE 化，删三国素材** | ⬅ **本工单** |
| P2 | biome 识别（卫星色采样 + 海拔）→ 沙漠/雪原/水田各归各位 | 待 P1 完成 |
| P3 | 局部点缀（海滩/河岸/农田/道路/贴花）+ 过渡混合 | 最后 |

**为什么 P2 让位给 P1**：现在地面是 DE 像素草皮、树却是三国群英传的橙红树丛，
半 DE 半三国比全三国还难看。先统一画风，再谈地形细分。

---

## 1. 第一批只提「温带森林组」，别全提

主人拍板：**只提映射表用到的，不全提 52 种**。P1 只需要下面这批（配 P0 的温带草地）：

| 用途 | SLD（`AoE2DE/resources/_common/drs/graphics/`） |
|---|---|
| 阔叶树（夏/春） | `n_tree_green_oak` `n_tree_oak` `n_tree_birch` `n_tree_willow` `n_tree_asian_maple_green` |
| 针叶/竹 | `n_tree_pine` `n_tree_bamboo` |
| 秋态 | `n_tree_autumn_oak` `n_tree_asian_maple_autumn` |
| 冬态 | `n_tree_snow_pine` `n_tree_snow_autumn_oak` `n_tree_dead` |
| 灌木/草丛 | `n_plant_bush_green` `n_plant_grass_green` `n_plant_grass_green_patch` `n_plant_underbrush` |
| 花（点缀，低频） | `n_plant_flower_1` `n_plant_flowerbed` |
| 岩石 | `n_rock_rock1` `n_rock_rock2` `n_rock_rock3` |

**共 20 个。** 沙漠/热带/地中海那些树（palm、acacia、baobab、jungle、olive、cypress、cactus）
**P2 接上 biome 再提**——现在提了也没地方用，白占体积。

---

## 2. 🔴 第一步必须先做「帧含义确认」，不许猜

实测这些 SLD 都是**多帧**的：`green_oak` 27 帧、`birch` 42 帧、`bamboo` 12 帧、`grass_green` 8 帧、`rock1` 6 帧。

多帧在 DE 里可能是：**多个随机外观变体** / **倒地动画** / **不同生长阶段**。
**这三种含义混在一起，选错就会把"倒下的树"当成"站着的树"铺满战场。**

> 项目铁律（AGENTS.md + 记忆）：**精灵帧含义绝不猜**，不许看图推、不许按块数推。

**所以第一步交付物是一张「帧总览图」，不是代码**：
1. 把上述 20 个 SLD 的**全部帧**逐帧提取成 PNG；
2. 拼成每个素材一张总览图（每帧带帧号标注），放 `claudedocs/de-nature-frames-<name>.png`；
3. **交给主人指认**：哪些帧是可用的站立变体、哪些是倒地/残骸/生长阶段。
4. 拿到主人的答复后，才进第 3 步提取。

管线复用 `scratch/aoe2de_unit_convert.py` 的 SLD 解析（`parse_sld` + `composite_frame`），
参照 `scratch/aoe2de_projectile_convert.py` 的**单向**写法——这些是静态装饰，没有 8 方向。

---

## 3. 提取与输出

- 输出目录：`public/SUCAI_NATURE/<NAME>/`，每个素材一张横排 sheet `frames.png` + `_meta.json`
  （`{frames, box_w, box_h, anchor_x, anchor_y}`，与 `PROJ_*` 同格式，13 已有读取代码可复用）。
- **必须带 `.pc.png` 玩家色遮罩**（与主图同批产出）。`MASK_DIRS` 白名单已于 08-18 废除，不需要登记，
  但遮罩文件缺了会回落亮度染色 —— 树不该被染色，注意确认 DE 树本来就没有玩家色层。
- **原图多大画多大**：主人 08-12 定过「绝不缩放，不然有的模糊有的清晰」。这条对 DE 树同样适用。

---

## 4. 代码替换（`src/ui/Scene13WarLayer.ts`）

### 4.1 树
- 替换 `TREE_BASE_URL = '/sanguoqunying/樹/'` 及其 6 变体逻辑。
- 树种按**季节**选（现有 `sceneSeason` 0绿/1橙/2白 直接复用，不要另起一套）：
  - 绿 → `green_oak / oak / birch / willow / asian_maple_green / bamboo / pine`
  - 橙 → `autumn_oak / asian_maple_autumn / pine`
  - 白 → `snow_pine / snow_autumn_oak / dead`
- 每场从对应季节组里随机选 2~3 种混布（**树可以混种，这和地形不同**——地形混色块会露棋盘格，
  树本来就是杂树林）。
- 保留铁律：**树画在 ground（尸体层）之下，永远不遮士兵**。

### 4.2 湖
DE **没有**「湖」这种装饰素材，湖必须用**水面地形贴图**画：
- 水体用 `wt2/wt3/wtr`（P0 转换脚本已支持，跑一次 `python scratch/aoe2de_terrain_convert.py wt2 wt3 wtr sh2 sh3`）；
- 画法：现有 `lakes` 的随机位置不动，把那张三国湖图换成「**不规则椭圆裁剪 + 水面纹理填充**」，
  边缘用 `sh2/sh3` 浅滩色描一圈过渡；
- 保留铁律：湖是贴地水域，画在最底层，不参与 y 深度排序。

### 4.3 云 —— ⚠️ 这条要主人拍板，先别动
AoE2 **没有云素材**（游戏里没有天气层）。所以「全 DE」严格执行的话就是**去掉云**。
但云是主人 08-12 专门加的动感元素。**两个选项，等主人一句话**：
- (a) 去掉云 —— 画风 100% 纯 DE；
- (b) 云作为唯一例外保留三国素材 —— 它是半透明白色积云，风格中性，混搭违和感最低。

**在主人答复前，云的代码一行都不要改。**

### 4.4 删干净
三国素材引用全部清零后，`grep -rn "sanguoqunying" src/` 应该只剩云（若主人选 b）或零结果。
`public/sanguoqunying/` 目录**不要删**（主人的素材，动它要单独许可），只断引用。

---

## 5. 验收标准

1. `npx tsc --noEmit` 通过、`npm run build` 通过。
2. 新素材**全部 `git add` 入库**（新素材没入库 = 线上 404，本项目部署停摆老病根）；
   顺带确认 `.vercelignore` 没把 `public/SUCAI_NATURE` 排掉。
3. 实机开一场 13：地面草皮 + DE 树 + DE 水塘，**画面里找不到三国风格的橙红树丛**。
4. 三种季节各开一场（或临时改 `sceneSeason` 强测），确认绿/橙/白三套树都能出、不混季。
5. 截图交付，主人验收。

---

## 6. 禁止事项

- ❌ 不许碰 13 的引擎/结算/寻敌/动画相位（本工单纯视觉层）。
- ❌ 不许改 ZOOM 8/9/10 的任何渲染（成品封冻）。
- ❌ 不许猜帧含义（见第 2 节）。
- ❌ 不许顺手做 P2 的 biome 判定。
- ❌ 不许删 `public/sanguoqunying/` 下的任何文件。
