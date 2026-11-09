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

# 卡顿案例集（面向 AI）

> 工具：`docs/03-runtime/perf-doctor.md`（Shift+F3 出结构化诊断）
> 本文是**案例库**：每条卡顿的真凶、量法、前后数据、验收方式。

**这份文档的价值不在「修好了什么」，而在「我一开始猜错了什么」。**
下面每一条都记着当时最像元凶、实测却被否掉的那个方向 —— 那才是最省时间的部分。

---

## 零、先读这四条方法论

### 1. 结论必须实测，推测不许写成结论
本项目已有多次「把推测讲成结论」的记录。任何「因为 A 所以卡」的话，
要么给出测量，要么明写「这是猜测，未验证」。

### 2. 量之前先确认量具**量的是游戏真正走的那条路**
> 血训：查跟拍卡顿时我整组基准用 `setView` 测，
> 而跟拍走的是 `panBy`（2026-08-28 就为避开 `_resetView` 改过了）。那组数全部作废。

先 grep 出真实调用点，再决定量什么。

### 3. 数字反常时**加计数器**，不要连猜
> 血训 A：植被"回归"连猜四轮、每轮等 4 分钟重载，白烧一小时；
> 一加计数器立刻看到 `clusters: 4`（面板隐藏 ⇒ 视口 0×0 ⇒ 一屏只采到 4 格）。
> 血训 B：缓存"顶满"被我当成抖动证据，加了 `churn.reAdds` 一测：**恒为 0，从没抖过**。

### 4. 先读 `env.dataTrustworthy`
浏览器面板隐藏时 rAF 不触发、Leaflet 视口是 `0×0`，
**所有按帧/按视口的数字都是垃圾**。此时可用的只有：长任务（PerformanceObserver 照常）、
手动驱动主循环测逻辑成本、离屏数学验算。

---

## 一、案例索引

| 案例 | 真凶 | 前 → 后 |
|---|---|---|
| [A. 开机长任务风暴](#a) | 开机全量预载 322 个兵种 | 600 次/160.2s → **39 次/7.1s** |
| [B. 缓存"抖动"](#b) | **误判**，根本没抖 | 抬预算无效，反而多占 2GB |
| [C. 跟拍一顿一顿](#c) | `panBy` 取整丢小数 | 0.2px/帧 走 **0** → 走满 |
| [D. 缩放冻结半秒](#d) | 河流 99.8% 顶点在屏外仍重投影 | 449ms → **18.7ms** |
| [E. zoom9 平移偏慢](#e) | 植被层每次 move 重画 | 5.20 → 4.23（与 8/10 持平）|
| [E-2. 植被整层空白几秒](#e) | 掩膜未就绪→采样整片为空→`trees=[]`→清屏后早退 | 瞬移后 trees 0（持续 6s+）→ **保持 498**；换季+平移 0 次归零 |
| [F. 13「做完色调后卡的不行」](#f) | 水面每帧全量合成（第一刀「每块各一张」反而 96ms）| water 26.7→96.3ms/帧 → 改 15Hz 半分辨率 **待验证** |
| [G. 行军探针零记录](#g) | 探针挂错分支，主路从没调过 | 0 条 → 每 20s 一条 |
| [H. 战略行军一顿一顿（进行中）](#h) | 缩放窗口内长任务 50~322ms 连片，**归因未定** | 待探针自动 dump |
| [I. 玩家移动时战略画面卡](#i) | `getImageData` 独占 46% CPU（瓦片解码漏 `willReadFrequently`）+ 抠绿 PNG 往返 + 旗号文字集中生成 | 长任务 20365 → **6513ms**；最坏 712 → **313ms** |
| [J. 战术模式很肉·一顿一顿](#j) | DE 素材白跑抠绿：判据 0 命中，却付 PNG 重编码 + 二次解码，单线程 Worker 串行排队 | 一场 39.4s 攻城战 `frames:0`、退场 `pending:78` → 跳过空操作 |
| [L. 玩家移动有点卡·植被层重采样过勤](#l) | 采样窗按 1 格（46px）对齐 + 每批地形瓦片 / 未解码贴图都强制整层重采样；paint 逐树 `latLngToLayerPoint` | 重采样合计 993–1190 → **448–662ms/12s**，单次最长 75 → **≤32ms**；单次 paint 约 −35% |
| [K. 跟拍把 `moveend` 打成每帧事件](#k) | 跟拍每帧 `panBy` → Leaflet 每帧完整 fire `moveend`，15 个「按移动结束写」的监听器每秒跑 38 遍 | 冗余工作 **−84%**（moveend 351→55、监听器 129→21ms）；⚠️ **帧间隔无可测改善**，见下 |
| [M. 战略地图上移动有点卡·长帧](#m) | ① 新兵种进视野按需加载，DE 雪碧图同步 `getImageData` 白跑抠绿（504 个 DE 目录 498 个 0 命中）② 环球每规划一段对路线**每个点**全扫路网节点找最近据点 | 无头 20s 长帧 7 个/1900ms → **2 个/1100ms**，p90 33→**16.8ms**；②单项 116.6s→**8.0s**（300 条路线），逐点 0 差异 |
| [N. 植被是不是卡的主因（进行中）](#n) | **不是**：主人局 25 份落盘里植被只占长任务 2%～13%；无头复现不了主人的负载 → 给 PerfDoctor 加 LoAF 归因 `longFrames`，等主人局自动落盘 | 待主人局数据 |

---

<a id="a"></a>
## A. 开机长任务风暴 —— 全量预载

**症状**：开机长任务 600 次 / 合计 160.2 秒 / 最长单次 4804ms。

**真凶**：`LegionPhalanxDrawer._doPreload` 遍历整张 `UNIT_ASSETS`（322 个兵种）全部解码 +
抠绿（`getImageData` + 逐像素 + `toDataURL`）。
**证据**：`churn` 计数器显示 `evicts:144 / reAdds:0` —— 144 个兵种装完就被淘汰、**全程一次没用过**。

**修法**：`EAGER_BOOT_UNIT_IDS = {mixed, light_infantry}`，开机只预载兜底两种，其余按需
（`ensureUnitTypeLoading`，绘制入口有完整兜底链，缺就后台补载、当帧先用兜底顶着，不会画空白）。

| | 前 | 后 |
|---|---|---|
| 开机长任务 | 600 次 / 160.2s | **39 次 / 7.1s** |
| 最长单次 | 4804ms | **1066ms** |
| 兵种贴图 | 1865MB | **5.9MB**（打完一场战术 139MB）|
| 一场战术后总位图 | 3700MB | **1707MB** |

**代价**：某兵种首次出现的一两秒用兜底贴图。

> 🔴 **踩坑**：按需加载那条路当时只载 `MOVE/ATTACK/IDLE/DAMAGE/DEATH`，
> **漏了 `SHOOT/CHARGE/SECONDARY/TERTIARY`** —— 开机路和按需路各写了一份，早晚要漂。
> 已合并成一份（开机委托 `_loadNavalAssets`）。
> **教训：同一件事绝不留两份实现。**

---

<a id="b"></a>
## B. 缓存"抖动" —— 这条是**误判**，记下来防止重走

**当时的推理**：染色缓存占用顶死在 599.6/600MB ⇒ 整场战斗在反复淘汰又重染 ⇒ 抬预算。
于是把四个缓存预算成倍抬高（染色 600→1600 / 遮罩 300→700 / 抠绿 300→700 / dataURL 200→500）。

**实测否定**：补上 `churn` 计数器（`evicts` / `reAdds`）后，**`reAdds` 全是 0** ——
淘汰掉的全是冷数据，从来没抖过。抬预算对帧率毫无帮助，只把解码位图从 1.7GB 堆到 3.7GB。

🔴 **「占用顶在预算上」和「抖动」在 `currentMB` 上长得一模一样**，只有 `reAdds` 能分辨：

| 现象 | 含义 | 该怎么办 |
|---|---|---|
| 顶满 + `reAdds ≈ 0` | 淘汰的都是冷数据，**健康** | 别动预算，去查别处 |
| 顶满 + `reAdds/evicts` 高 | 反复重建同一批，**抖动** | 才轮到抬预算 |

PerfDoctor 已加 `cache-thrashing` 规则与 `CacheProbe.churn`；
`registerCache` **务必提供 churn**。

---

<a id="c"></a>
## C. 跟拍行军一顿一顿 —— `panBy` 的亚像素量化

**症状**：主人报「zoom9 行军不够顺畅」。

**真凶**：Leaflet `panBy` 把偏移**取整到整像素，小数部分直接丢弃、不累积**。实测（zoom9，30 帧）：

| 每帧请求 | 实际每帧 | 应走 | 实走 |
|---|---|---|---|
| 0.20px | **0** | 6px | **0** |
| 0.35px | **0** | 10.5px | **0** |
| 0.49px | **0** | 14.7px | **0** |
| 0.80px | 1 | 24px | 30px（多跑 25%）|
| 2.40px | 2 | 72px | 60px（少跑 17%）|

跟拍是指数平滑（`FOLLOW_LERP_FACTOR=0.22`），镜头越贴近军团像素增量越小；
低于 0.5px 时 panBy **什么都不做**，镜头冻住，直到军团漂远才猛跳一格。

**为什么 zoom9 最明显**：1px≈250m ⇒ 要动镜头得军团偏离中心 **570m 以上**（2.3px × 0.22）。
zoom10 是 125m/px，同样航速像素增量翻倍就跟得上。

**修法**：`GameAppLoop.panByAccumulated` —— 残差累积，只把整数交给 `panBy`，
小数攒到下一帧；吸附（`setView`）时清零残差。
**验收**：0.2px/帧 从「30 帧一动不动」变成走满 6px；0.49 变成 `0,1,0,1` 均匀交替
（整像素能做到的最平滑）；0.8 从多跑 25% 变精确 24。

> ⚠️ 整像素步进是 Leaflet 的物理极限。若主人反馈「匀速但有颗粒感」，
> 那是这条极限，得改成分数 transform；若反馈「走走停停」，说明还有别的原因。

---

<a id="d"></a>
## D. 缩放冻结近半秒 —— 河流全量重投影

**症状**：切一次 zoom 同步冻结 449~487ms，而 ZoomController 每场战斗前后都切档。

**归因**（关掉图层对比，最直接的量法）：

| | 缩放 8→9 | 缩放 9→10 |
|---|---|---|
| 开河流 | 449ms | 487ms |
| 关河流 | 107ms | 107ms |
| **河流占比** | **76%** | **78%** |

**真凶不是「河流多」，是「全都在重投影」**：
全库 1202 条河 / **985368 个顶点**，Leaflet 每次 `zoomend` 全量重新投影；
而 zoom9 屏幕里只有 **18 条**（顶点占比 **0.2%**）→ **99.8% 是白烧**。

**修法**：逐要素 `__bbox` + 视口裁剪（`VectorRiverLayer.cullTo`）。
只把与「视口外扩 `CULL_PAD=1.0`（3×3 屏）」相交的要素放进图层；
`culledBounds` 记住上次范围，视口没走出去就直接返回 ⇒ 跟拍平移的 `moveend` 几乎零成本。
`setOffsetMode`/`refresh` 换组后必须 `culledBounds=null` 重裁（新组是空的）。

**结果**：8→9 **449ms → 18.7ms**（快 24 倍），9→10 487ms → 23.9ms；屏上 path 2910 → 38。

**顺带清掉的纯浪费**：
- **506 条 `Lake Centerline`**：两个样式函数都返回 `stroke:false, opacity:0`，一根都画不出来，
  却占 17% 的 path、39736 个顶点、照样重投影。构造时直接扔掉。
- **WGS84 组从来没被显示过**：`RIVER_OFFSET_MAX_ZOOM=12` 而可见范围就是 8~12，
  `setOffsetMode(zoom<=12)` 恒为 true。两组现在都建成空组按需填充。

### 🔴 验收脚本（改这块必须重跑）
拿源数据 `__bbox` 算「严格与**真实视口**（不外扩）相交的要素数」当基准，
比对 DOM 里 `path.vector-river-water` 的数量，必须 **DOM ≥ 基准**。
已验 zoom 8~12 五档 + 武汉/泰晤士/开罗/马瑙斯/黄河上游五地跨洲跳转，全部达标。

### 试过但没用的两个方向
- **几何简化**：在 zoom12 看不出差别的容差下只省 1~9%（数据本身已接近最简）。
  要省一半得放宽到「1px@zoom10」容差，那时 zoom12 会看出河道形变。不划算。
- **藏掉河流 pane**：`display:none` 后平移 p50 **完全不变**（4.7→4.7）。
  平移只 transform pane，不重投影 —— **河流是「缩放」的开销，不是「平移」的开销**，别搞混。

---

<a id="e"></a>
## E. zoom9 平移比 8/10 慢 —— 植被层

**实测**（三轮交叉，无重叠 ⇒ 不是噪声）：

| | 各轮 p50 | 均值 |
|---|---|---|
| zoom8 | 4.4 / 3.7 / 3.6 | 3.90 |
| zoom9 | 5.0 / 5.2 / 5.4 | **5.20** |
| zoom10 | 3.9 / 4.2 / 4.4 | 4.17 |

**定位思路**：找「在 9 开、在 8 关、在 10 变便宜」的东西 ——
植被层 `MIN_ZOOM=9`，而 zoom10 视野面积只有 zoom9 的四分之一。
**验证**：`toggleTree` 开/关三轮 → 开 5.4/5.2/5.1，关 3.8/4.9/4.0，关掉后与 8/10 持平。

**现状**：`GameMap.ts` 里是 `toggleTree(true)` 默认开。这是**观感取舍不是技术问题**，
关掉就抹平这 25~33%，但树就没了 —— 交给主人定。

> 逐个 `display:none` 藏 pane 来定位是**无效手段**：只挡绘制，不挡 Leaflet 的 move 回调。

### E-2 同一个植被层的另一坑：**整层会空白几秒**（2026-09-11 主人报「植被在渐变的过程中有一段消失的状态」）

**症状**：换季渐变（季末 45% 的交叉淡出）期间、或跟拍行军移动时，整片植被会**消失一段时间**再回来。

**实测定位**（`scratch/_verify_veg_blank_render.mjs`）：
- 把镜头瞬移到一处「地形/水域掩膜尚未就绪」的区域后，`vegetationLayer.trees.length` **立刻变 0 并持续 6s+**；
- 成因在 `render()`：掩膜未就绪时采样会**整片跳过**（`missingTiles>0`），于是 `drawCommands` 为空 →
  `this.trees = []` → `paint()` 第一行 `clearRect` 清空画布后立刻 `if (trees.length === 0) return` → **画布全白**；
- 层里本有 15 次 `missingTiles` 重试，但**重试期间 `this.trees` 已经是空的**，所以那几秒就是空白 ✗；
- 换季要重算整层（`renderKey` 含 gameSeason），跟拍移动本身也在重算 —— 两者叠加正好撞上这个空窗。

**矫正**：`render()` 里加一条守护 —— **新采样为空 + 旧列表非空 + 确有瓦片未就绪** → 保留旧列表继续画（不闪白），
并沿用原有重试，掩膜到齐后再换成新列表。掩膜真就绪时（`missingTiles===0`）依旧接受空列表，
所以「搬去真正的无林区」不会残留旧树。

**复测**：瞬移后 `trees` 保持 498（改前 0 且持续 6s+）；换季 + 缓慢平移 20 步 → `trees` **0 次为 0**，最小值 55。

---

<a id="f"></a>
## F. 13「做完时段色调后卡的不行」—— 色调背锅，水面是真凶（2026-09-03）

**症状**：主人加完 13 时段色调后报「卡的不行」。

**我先猜的**：色调层本身。第一版确实有问题——用两个 `position:fixed; mix-blend-mode` 的 DOM 层压在 13 canvas 上，
我写的是「GPU 合成零成本」，**没测**。实际混合层的背景是整个 body 堆叠上下文（地图 DOM + 几千矢量元素），
每帧都要把它们合成进混合组。已改成在 13 自己的 canvas 里、所有精灵之后做固定两次整画布合成。

**改完后读 13 的 perf 落盘**（`scene13_probe_latest.json`，21:01 那场，803 帧）：

| 段 | 中位 |
|---|---|
| step | 1.9ms |
| **water** | **26.7ms**（只有 2 个水块）|
| tint | 0.0ms |
| render 总 | 32.2ms |

色调 0.0ms，**水面吃了八成帧预算**。所以「做完色调后卡」是水面在卡，与色调无关。

**第一刀（错）**：以为是所有水块共用一张离屏 canvas、每帧按各自尺寸重设导致。改成每块各一张后，21:26 那场（1702 帧、2 块）
`water` 中位 **96.3ms**、render 101ms——比改前还差（两场水块面积不同，不能直接比，但至少证明「重设尺寸」不是主因）。

**第二刀（现行）**：水面每帧要做 clear + 软遮罩 drawImage + 两次 pattern `fillRect`（各铺满 bbox+2 贴图）+ 一次色 fillRect + 上屏，
全在**满分辨率**（2552×1274×1.5 DPR）上做，一块半屏海就是几百万像素 × 5 次。改成：
① 只按 15Hz 重新合成，其余帧把上次结果 `drawImage` 上屏（水流才 8px/s）；② 合成画布半分辨率（像素量 /4，水本来有 14~16px 羽化）。
**量具**：`perf.waterOps` 分 `composeAvgMs / composeN / blitAvgMs / blitN`，下一场直接看合成和上屏各多少。
**验收**：`perf.water` 中位应 <10ms；若 `blitAvgMs` 仍大，说明主画布 drawImage 本身慢（怀疑 canvas 掉软件渲染），
那时查 `getContext('2d', {willReadFrequently})` 是否被误设到主画布、以及画布数量。

> ⚠️ 这条与「不是瓶颈」清单里「13 的 step/render 中位 2.4+2.3ms」不矛盾：那是**无水**的场。有水先看 `perf.water`。
> ⚠️ 记忆里「13 卡的是动态水面（8-21）」记的是发现，不是修好——09-03 数据证明它还在。

---

<a id="g"></a>
## G. 行军顿挫探针零记录 —— 挂错分支（2026-09-03）

**症状**：`MarchStutterProbe` 上线后 `scratch/stuck_legion_log.jsonl` 一直**不存在**。

**我先猜的**：没卡所以没记。错。探针每 20s 无条件上报（哪怕零命中），文件不存在只能是**没跑**。

**真凶**：探针写在 `GameAppLoop` 里「战斗画布激活」的 `else` 分支，战略地图正常跟拍走的是 `!sceneActive` 主路，从没调过它。
**修法**：主路三分支之前也接一份（`site:'main'`），else 分支那份保留（`site:'battleScene'`），记录里可分辨。
**验收**：修后 2 分钟内落了 3 条。

**顺带发现的假象**：修后前几条 `采样帧数:1`、`frameMs:187301`——是从 13 回到战略图的**第一帧**把整场战斗的时长算成了帧间隔。
已在探针内过滤：缩放变化或帧间隔 ≥2s 一律重置基线、不判定。**读到这种记录别当成「掉了 187 秒的帧」。**

---

<a id="h"></a>
## H. 战略地图行军一顿一顿 —— 进行中（2026-09-03）

**主人原话**：「军团在战略底图移动的时候就卡」「没据点的荒地和海上反而顿」。

**已有的硬数据**（`zoom_perf_latest.json`，21:05，缩放 8→9 前后 2 秒）：
最长帧 418ms；38 帧里 24 帧慢帧；长任务 10 个：203/322/136/103/170/64/86/50/63/195ms，几乎连成一片；
Leaflet 监听器最大才 14ms；山体瓦片本次新算 126 块（有 worker，但主线程那头的收尾没量过）。
**判定：主循环 JS 阻塞，不是地图库。归因未定。**

**别再走的路**（都被前面案例否掉）：Dijkstra、河流平移、画布绘制量、13 的 step/render、抬缓存预算。

**探针修好后第一批数据**（21:21~21:29，全部 `site:main`，167 条 longFrame）：

| | 数值 |
|---|---|
| longFrame 帧间隔 p50 / p90 / max | 171 / 280 / 785 ms |
| 同一帧主循环自身 lastFrameTotal p50 / p90 | **6.8 / 26 ms** |
| ai / legion / combat / render p50 | 0.6 / 2.1 / 0.4 / 2.1 ms |
| 自动 dump：fpsP50 57、gapP90 28ms、over50ms 7/991 帧 | 大部分时间正常 |
| 长任务 | 4 个 / 803ms / 最长 333ms（20s 窗口）|
| 已登记热点最大单次 | AIController.update 108.8ms（一次），其余 <8ms |
| heap | used 974 / p50 820 / peak 944 MB（锯齿）|

**读法**：帧掉 170~300ms 时主循环自己只花 5~7ms → 时间在主循环**之外**。候选只剩三类：
① major GC（堆 820↔944 锯齿，每次回落约 120MB，`heap.gc` 规则 09-03 已加，等下一份 dump 看 `与长任务配对次数`）；
② 其他独立 rAF 循环 / Leaflet 回调（09-03 已把 7 条循环全部登记进 hotspots，下一份 dump 谁大谁现形）；
③ 山体瓦片：缩放窗口 `缓存 240/240、命中 0、新算 84~126`，每次切档整批重算（worker 算，但上屏 + LRU 在主线程，已登记）。
刚回战略图的第一个窗口（21:26:33）155 帧里 84 帧 >120ms，是战后素材回填期，与稳态的「偶尔一顿」分开看。

**接手的 AI**：读最新 `perf_doctor_latest.json`（`context.trigger:'march-stutter'`）的 `heap.gc`、`hotspots` 前 5、`findings`；
`gc-suspect` 成立就去找每秒分配几 MB 的那条路（规则里写了怎么找），不成立就看 hotspots 里新登记的 7 条循环谁的 `maxMs` 大。**不要先改代码。**

---

---

<a id="i"></a>
## I. 玩家移动时战略画面卡 —— `getImageData` 占一半 CPU（2026-09-05）

**主人原话**：「玩家移动的时候战略画面很卡」。

**为什么这次一测就中**：已登记的热点计时器全都正常（每帧合计只有 22ms，而帧间隔 200ms），
`findings` 只会给出「差额在帧与帧之间」这种方向性结论。**这时候必须上 CPU Profile**，
按 `selfTime` 排序 + **回溯调用链**，不要再往已登记的计时点里找。
脚本：`node scratch/probe_cpu_callers.mjs`（先起 dev server），它直接给出
「哪个原生函数吃了多少毫秒、是谁调的」。

**第一刀（真凶）**：`getImageData` 占 **46% CPU**（12 秒采样 5581ms），回溯调用者：

| 调用者 | 耗时 |
|---|---|
| `ElevationSampler.ensureTile` | 4287ms |
| `WaterMaskSampler.ensureTile` | 1278ms |

`ElevationSampler` 与 `ImagerySampler` 用的是**裸** `getContext('2d')` —— 画布落在 GPU 上，
每次 `getImageData` 都要一次 GPU→CPU 同步回读。**与 SpriteTinter 那次（13 开场卡 12.8 秒）同一个坑。**
顺带两处结构问题：① 每块瓦片新建一张 256×256 画布；
② `LandSeaSystem.bindLeafletMap` 把**整个视口的瓦片预取**挂在 `moveend` 上，
而跟拍镜头**每帧** `panBy`、Leaflet 每次都 fire `moveend` —— 这个回调其实是每帧在跑。

**修法**：新建 `src/world/land-sea/TileDecoder.ts`（共享画布 + `willReadFrequently`），三个采样器共用；
预取加「视口瓦片范围没变就跳过」（只比四个整数，行为等价、瓦片一块不少）。

**第二刀（排掉第一层后浮出来的）**：抠绿 `LegionPhalanxDrawer.doProcessImage`
`getImageData 1674ms + toDataURL 1124ms`。它把刚处理好的位图**再 PNG 编码一遍**、
浏览器拿到 data URL **再解码一遍**，而 DE 雪碧图动辄 8820×160 到 12240×144。
改用 `createImageBitmap`（不编码不重解码，产物 GPU 友好），并给四处抠绿画布补上 `willReadFrequently`
（`LegionPhalanxDrawer` / `LegionFlagDrawer` / `GeneralDrawer` / `CityAssetManager`）。
> ⚠️ 直接返回 canvas 是**错的**：canvas 每帧 drawImage 都要重新上传，反而拖慢渲染。用 ImageBitmap。
> 下游要的只是 Image 的**形状**（`naturalWidth`/`complete`/`src`），补齐即可 —— 全项目无 `instanceof HTMLImageElement`。

**顺带两个每帧开销**：`getGeneralRecordByGeneralId` 每次调用都 `Object.entries` 摊平 800+ 条再线性扫，
而它是**每帧每单位**调（画名牌查将领名）→ 改反向索引 Map；`HeroSpriteDrawer.drawLabel`
每帧描边+填充文字 → 预渲染成小图复用。

**结果**（同一环境，玩家移动 10~12 秒采样）：

| | 修前 | 修后 |
|---|---|---|
| `getImageData` | 5581ms（46%）| **780ms（8.4%）** |
| 抠绿的 `toDataURL` | 1124ms | **0** |
| `drawImage` | 469ms | **42ms** |
| 主线程 `(idle)` | 160ms（1.3%）| **2029ms（19.4%）** |

**视觉验收**：46 支军团、城池旗号、关羽精灵全部正常，控制台 0 错误
（ImageBitmap 换掉了图片对象类型，这一步**必须**截图确认，别只看数字）。

**⚠️ fps 不要当结论**：headless 是软件渲染，同一配置三轮 idle 测出 43.9 / 7.2 / 25.7fps，
噪声比信号大。要判断改善**只看 CPU Profile 的确定性归因**。

**第三刀（旗号文字，2026-09-05 同日补完）**：`DynamicFlagTextGenerator.generate` 占约 20% CPU ——
每个势力**一次**地生成 512×960（`renderScale=4`）的旗号文字 PNG。有缓存，但全局 800+ 势力，
镜头扫过没去过的地区时**集中**触发几十次，全砸在少数几帧里 = 卡顿尖峰。

先算了两条「省事」的路，**都不安全，别再试**：
- **降超采样**：旗面一格屏幕尺寸 `32×40 ×flagScale1.4 ×visualScale1.2 ≈ 54×67` CSS px，
  2× DPR 需要 107×134 物理像素，而一格源图正好 `32×4 × 40×4 = 128×160` —— **刚好够、零余量**，
  降到 3 倍（96×120）就在高分屏发糊。
- **砍雪碧图行数**：据点旗确实只用第 4 行（`background-position-y` 写死 `-160*1.4`，横向 4 帧是 CSS 动画），
  但 `LegionFlagDrawer.drawFlag` 按朝向取 `text.height / 6` 的第 `direction` 行 —— **6 行军团旗都要用**，砍了军团旗就没字。

**采用的第三条**：产物一个像素不改，只把生成**摊开** —— 每 16ms 窗口最多生成 2 张，
超出的进队列由 `requestIdleCallback` 补齐，补齐后调 `patchFactionFlagText` 就地给该势力据点补上文字。
> 🔴 补齐**只能** patch，**不能**走 `CityManager.refreshFactionFlagText`：那个会先删缓存，
> 删完 patch 又重新生成一张，等于把省下的活儿原样做回去（还会自我循环）。
> 🔴 `getProcessedFlagText` 返回 null 从此有**两种**含义，`patchFlagTextOverlay` 必须用
> `isFlagTextPending` 分清：「排队中」要**保留**已有文字，抹掉会让旗号一闪一闪。

**长任务（最能反映「卡」的指标，长任务期间画面完全不动）**：

| 场景 | 修前 次数/总时长/最坏 | 修后 |
|---|---|---|
| 玩家移动 | 184 / 20365ms / 712ms | **72 / 6513ms / 313ms** |
| 静止 | 115 / 12533ms / 274ms | **25 / 1952ms / 342ms** |

**视觉验收**：49 支军团、旗号文字（郢/荆/荆门/宜都）、关羽精灵全部正常，控制台 0 错误。


## 二、本轮一并量到的「不是瓶颈」清单

别再重复查这些：

| 怀疑对象 | 实测 |
|---|---|
| 画布绘制（战略地图） | 4 秒内合计 62ms = **1.5% 帧预算** |
| 植被的 5 万次 canvas 调用 | 只花 14.7ms / 4 秒 |
| 2914 个矢量河流 path 拖慢**平移** | 藏掉后 p50 完全不变（见 D）|
| 13 自己的 step/render（**无水**的场） | 中位 2.4 + 2.3ms。有水的场 water 单项 26.7ms，见案例 F |
| 寻路 Dijkstra | 缓存命中率 99%、单次 0.9ms |
| `performance.memory` 反映图片内存 | **已解码位图不在 JS 堆**，heap 报 702MB 时贴图实占 12961MB |

<a id="j"></a>
## J. 战术模式很肉·一顿一顿 —— DE 素材白跑一遍抠绿（2026-09-09）

**主人原话**：「战术模式，是很肉，一顿一顿的。为什么一个网页游戏都不流畅呢？」

**一测就中的证据**（按 perf-doctor 的「战术地图卡」流程读 `scratch/scene13_probe_latest.json`）：

```
"totalSec": 39.38, "perf": { "frames": 0, ... }
events: [39.38,"assetTimeout",{"pending":78}] → [39.38,"forceByRatio"]
```

`perf.frames` 是**过了素材闸之后**才累加的 —— 它是 0，说明这场 39.4 秒的攻城战
**一帧都没跑过**，全程卡在开战前的素材加载上，最后被 30 秒防死锁计时器强制判负。
退场时还有 78 个 blocking 加载没回来。同窗口 PerfDoctor：600 个长任务合计 46.8s，
已登记热点加起来才 5.9s —— 时间全在没登记的地方。

**真凶**：`ensureCleanImage` 对**每一张**素材都走抠绿流水线：

```
createImageBitmap → DechromaWorker(getImageData → 逐像素 → putImageData → **PNG 重编码**)
→ FileReader base64 → 主线程 new Image(dataUrl) **第二次解码** → 缓存里再背一份 ~0.8MB 字符串
```

而 **DE 素材本来就是透明 PNG，抠绿判据（g>150 且 r<110 且 b<110）一个像素都命中不了**：
抽样 16 张 DE strip、385 万不透明像素，**命中 0**。这是可证明的空操作。

代价却是实打实的。以探针里那场（JIANGNAN 攻城）为例，开场计入 `pending` 的只有 move+atk：

| 量 | 数 |
|---|---|
| 必须先处理的图 | **160 张** |
| 像素 | **6940 万** |
| 解码位图 | **265MB** |
| 源文件 | 31MB |

这 6940 万像素要在**一条** Worker 线程里逐个扫一遍并**重新编码成 PNG**（单张 strip 可达
13680×180），再回主线程解码第二遍。几百张串行排队，几十秒排不完，
而 `pending > 0` 期间 `tick()` 整个 return —— 不推进也不渲染，画面就是冻住／一顿一顿。

**修法**：`ensureCleanImage` 的抠绿参数允许传 `null`；`ensureType` 里 `isDE` 为真就传 `null`，
原图直接当干净图用（照挂 `sourceUrl`，`SpriteTinter` 推 `.pc.png` 与 `de:` 前缀键都不变）。
绿幕素材（三国志 10 那批，不在 `DE_DYN_DIRS` 里）判据一字未改，照旧走 Worker。

> 与案例 I 第二刀是同一个坑的两个位置：那次修的是战略地图 `LegionPhalanxDrawer`
> （`toDataURL` → `createImageBitmap`，抠绿仍在做）；这次是 13，直接**证明这一步对 DE 是空操作**并跳过。
> ⚠️ 战略地图那条链路（`LegionPhalanxDrawer.doProcessImage`）**至今仍对 DE 素材做抠绿**，
> 同样是空转，但 8/9/10 是成品、不许擅动，只记录不修。

**验收**：打一场 13 攻城战，读 `scratch/scene13_probe_latest.json`：
`perf.frames` 必须 > 0（不再是 0），`events` 里应出现 `assetsReady` 且不再有 `assetTimeout`。

---

<a id="k"></a>
## K. 跟拍把 `moveend` 打成了每帧事件（2026-09-20）

**主人报障**：「我感觉玩家在移动的过程中有延迟」。

### 先排除掉的三个「像是真凶」的方向

这轮一开始有三份分析各指一个方向，实测**全部不成立**，记下来防止重走：

| 说法 | 实测 | 结论 |
|---|---|---|
| 相机滞后 400~657 米 = 橡皮筋拖拽感 | zoom9 实测 **1px ≈ 250m**（见 `GameAppLoop` 头注），400m = **1.6 像素**；120m 死区 = **0.5 像素** | ❌ 眼睛看不见 1.6px。且实机报告 `cameraFreezeJump: 0` |
| 镜头一半帧不动、然后跳一格 = 量化 bug | 那正是**案例 C 修好之后应有的样子**（残差攒够 1px 走一格，平均速度精确等于请求速度） | ❌ 把疗效当病症 |
| GC 停顿 | 实机 `heap.used 610 / limit 4192MB`（15%），57 个长任务里 `gc.matchedLongTasks: **1**` | ❌ 56/57 是同步计算，不是 GC |

另外一并量到的「不是瓶颈」：

- **画布渲染**：`perfDoctor.auditCanvas(4000)` 全部画布加起来只有 **5.6 ms/秒**；
- **寻路**：20 秒内 `runDijkstra` 真实计算 16 次 / 合计 13ms，LRU 命中率 90.1%，**零淘汰**；
- **Scene13 空转**：战略行军 15 秒内 `render` 调用 **0 次**（profile 里那 206ms 是真有战斗在打）；
- **瓦片解码**：已有逐帧预算队列，415ms/30s ≈ 1.4% CPU。

### 真凶

跟拍镜头靠每帧 `panBy` 推进（案例 C 的亚像素残差版），而 **Leaflet 的 `panBy` 每调一次就完整
fire 一轮 `movestart` / `move` / `moveend`**。

`moveend` 的语义是「移动结束了」，挂在它上面的监听器 —— 整屏瓦片预取、各图层按视口刷新 ——
全都是按「这事很少发生」写的。跟拍把它变成了**每帧事件**：

实测（`scratch/audit_moveend.mjs`，zoom8 行军 20 秒）：

| 量 | 数 |
|---|---|
| 帧数 | 931 |
| `movestart` / `move` / `moveend` | 各 **758** 次（81% 的帧都在 fire 一整轮）|
| `moveend` 监听器 | **15 个** |
| 监听器总调用 | **11,370 次** |
| 监听器总耗时 | **794ms / 20s ≈ 4% CPU** |

全部集中在移动期间 —— 所以症状是「**一移动就顿、停下就好**」。

> 这条其实早就写在 `TileDecoder.ts` 头注里了（「跟拍镜头每帧 panBy，Leaflet 每次都 fire moveend，
> 而 LandSeaSystem 在 moveend 上挂着整个视口的瓦片预取」），当时只针对瓦片那一家做了预算队列，
> **没人回头看 moveend 上还挂着另外 14 个监听器**。

### 修法

`GameAppLoop.panByThrottledMoveEnd()`：跟拍平移期间把 `moveend` **节流**到 100ms 一次
（38 次/秒 → 10 次/秒），并在镜头停稳后用 trailing 补发一次，保证下游一定看到最终视口。

⚠️ **不能直接吞掉**：Leaflet 自己的 `GridLayer` 也听 `moveend` 拉瓦片，全吞会让长途行军期间
底图永远不加载（连续行军时「停下」这个时刻根本不到来）。所以是**节流**，不是**屏蔽**。

⚠️ `move` 事件**照常逐帧 fire** —— 画布层（`syncCanvas` / `onCanvasFollow`）靠它按帧对齐位置，吞了会错位。

### 前 → 后：**同会话交替 A/B**，不是单次跑对比

> 🔴 **本案最重要的方法论教训**，比结论本身更值得记住。
>
> 第一版验收是「改前跑一次 / 改后跑一次」，报出「帧数 +29%、gapP90 32.5→21.5ms」。
> **这个结论是错的。** 同一个脚本连跑三次拿到 508 / 656 / 412 帧 —— 跑间方差（路线不同、
> 途中有没有开战、无头软件渲染的机器负载）远大于本次改动的效果，单次对比只是在报噪声。
>
> 重测方式：`scratch/audit_moveend_ab.mjs` 在**同一个页面会话**里，用 DEV 开关
> `__moveEndNoThrottle` 交替切换 A/B，各采 9 个 6 秒窗口取中位数，同一条行军、同样负载。

| 量（各 9 个 6s 窗口中位数）| A：每帧 moveend | B：节流 | 变化 |
|---|---|---|---|
| `moveend` 触发 | 351 | **55** | **−84.3%** |
| `moveend` 监听器耗时 | 129ms | **21ms** | **−83.7%** |
| 帧数 | 357 | 358 | +0.3% |
| 帧间隔 p50 | 16.7ms | 16.7ms | 0% |
| 帧间隔 p90 | 17.5ms | 17.5ms | 0% |
| 帧间隔 p99 | 23.9ms | 25.3ms | +5.9% |
| 最长帧 | 60.1ms | 57.6ms | −4.2% |
| >50ms 帧数 | 1 | 1 | 0% |

**诚实结论，分两句写清楚**：

1. ✅ **冗余工作确实被消掉了**：`moveend` 从每帧触发降到约 10 次/秒，15 个监听器的总调用与
   总耗时都降了 **84%**。这一条重复、稳定、无争议。
2. ⚠️ **但在这台无头机器上，帧间隔没有可测的改善**。p50/p90 完全持平，p99/max 的
   ±5% 落在方差里。原因不难理解：省下的约 **18ms/秒 ≈ 1.8% 单核**，而该环境
   p50 本来就是 16.7ms（满 60fps），没有可挤的空间。

**那为什么还留着这个改动？** 因为省掉的是**可证明的纯冗余**（同一个视口每秒被重算 38 遍），
且风险已实测封边（见下「瓦片回归」）。但它在主人实机上到底值多少 —— **未验证**。
实机场景重得多（`dom.total 4457`、`monument` 子元素 137、`canvases 201`、`gapP90 37.1ms`），
单次 `moveend` 的代价理应远高于无头环境的 0.37ms，但这需要在实机上量，不许推断成结论。

> **实机自测方法**：F12 控制台里 `window.__moveEndNoThrottle = true` 退回改前行为，
> `= false` 恢复节流，同一局里来回切，对比体感与 `perfDoctor.report()`。

### 瓦片回归：纯时间节流会让底图跟不上，必须加位移闸门

第一版只按时间节流（100ms），实测**引入了回归**：

| 量（25s 高速行军）| 对照组：每帧 moveend | 纯时间节流 | 时间节流 **+ 位移闸门** |
|---|---|---|---|
| 最长「零新瓦片」间隔 | 161ms | **2804ms** ❌ | **200ms** ✓ |
| 加载率 <60% 的采样 | 6/89 | **10/83** ❌ | **6/83** ✓ |
| 结束时视口瓦片 | 183/190 | 158/158 | 172/172 |
| `moveend` 触发 | 868 | 180 | 214 |

**原因**：瓦片是**按距离**失效的，不是按时间。纯时间闸门在高速行军时放行太慢。
**修法**：加 `MOVEEND_DISTANCE_PX = 128`（半块瓦片），累计平移够半块就立刻放行，
不等时间片。瓦片行为回到对照组水平，而 `moveend` 只从 180 升到 214，CPU 收益基本保留。

探针：`scratch/audit_tile_during_march.mjs`（`NOTHROTTLE=1` 跑对照组）。

### 🔴 验收脚本（改跟拍或 moveend 相关代码必须重跑）

```
node scratch/audit_moveend_ab.mjs          # 🔴 主验收：同会话交替 A/B，唯一可信的对比
node scratch/audit_tile_during_march.mjs   # 瓦片回归（NOTHROTTLE=1 跑对照组）
node scratch/audit_moveend.mjs             # 单次快查：moveend 触发次数与监听器耗时
```

判据：
- `moveend` 触发应降到帧数的 **1/6 左右**，监听器耗时降 **80%+**；
- 瓦片「最长零新瓦片间隔」必须与对照组同量级（**≤ 300ms**），否则位移闸门失效；
- ⚠️ **不要用 `audit_march_latency.mjs` 的单次结果判断帧间隔有没有改善** —— 跑间方差
  （508/656/412 帧）远大于效果，本案就是这样报错过一次。

### 尚未修的一条（已定位，风险较高）

`CombatSystem.startRegionalBattle` 在**跟拍军团卷入战斗**那一瞬间同步花 **109.4ms**：

```
startRegionalBattle 总计          峰值 109.4ms
  └ onRegionalBattleStart(UI回调)  峰值 108.8ms   ← 几乎全部
       └ scene13War.start              65.4ms
       └ combatUI.showRegional         36.8ms
            └ resetBattleOverlays      31.4ms（内含一次强制同步重排 void offsetWidth）
  └ new BattleField + 其余         峰值   4.1ms   ← 战场构造本身不贵
```

规模无关（实测那场是 **1v1**）。`showRegional` 在 `if (eligible)` **之外**，所以即使这场仗
不够格进战术层、人还在战略地图上，也照样付这 37ms。

未修原因：那 4 处 `void offsetWidth` 是**有意的**（注释写明要把归位与缓动分成两帧），
硬拆会破坏动画契约；且强制重排多半只是把浏览器本来就要做的布局**提前**到同一帧，
不一定真省。要动需要先做 A/B 实测。

探针：`scratch/audit_battle_init.mjs`、`scratch/audit_ui_cb.mjs`、`scratch/audit_ai_tick.mjs`。

<a id="l"></a>
## L. 玩家移动有点卡 —— 植被层重采样过勤（2026-11-02）

**主人原话**：「玩家在地图上移动有点卡，可以优化吗？」

**量法**：无头 Chrome 独立开一局（不碰主人的局），玩家切「🌍 环球」（不入伍、不打仗、一直走），
zoom9 跟拍，CPU Profile 按「最近的项目源码帧」归因 + 包住 `VegetationLayer.paint/renderInner` 计次计时。
⚠️ 开局位置随机、各次地区树量不同，只能比同量级地区；无头 `(program)` 原生开销约占 60%，不代表真机。

**归因**（移动 15 秒）：植被层 `drawTreeAsset/paint/renderInner` 合计约 1.6s（≈10%）为项目代码第一；
`WorldMiniMap.applyView` 593ms（10-26 已节流，未再动）。重采样 renderInner 每 12 秒 54–66 次，分类：
**强制（采样键被清空）占大头**，按视口移动触发的反而少。

**三个根因与修法**（`src/map/VegetationLayer.ts`）：
1. 采样窗按 1 格（46px）对齐 → 每走 46px 整层重采样。改按 `RESAMPLE_CHUNK_PX = 4 格` 外扩对齐（格距整数倍，树位网格不变）；
   抽稀比例只按原窗口内树数算，外扩那圈不挤配额。
2. `land-sea-tiles-updated` 每批都清采样键 → 改为只在上一次采样**确有高程/水域缺失**（`lastRenderIncomplete`）时才重算，合并窗 250→500ms；
   `pendingImages>0` 不再清键（树已在 drawCommands，贴图到了 `onTreeImageReady` 会补画）。
3. paint 逐树 `latLngToLayerPoint` + 逐树拼 posKey 字符串 → 采样时存 SAMPLE_ZOOM 世界像素 `wx/wy` 与 `posKey`，
   paint 按 `getZoomScale` 换算后同样取整。**逐树比对 0 像素差**（2814 / 1804 / 1667 棵）。
4. 换季渐变 5 秒内每帧整层重画 → 限到约 30fps（`BLEND_PAINT_MIN_INTERVAL_MS = 33`）。画面观感待主人确认。

**前 → 后**（同量级地区，每 12 秒）：renderInner 合计 993–1190 → **448–662ms**，单次最长 32–75 → **19–32ms**；
单次 paint 5.9/10.7 → **3.6/7.1ms**。

**顺带修的功能缺陷**：环球模式在偏远处（昆仑山北麓）0.5° 内没有接路据点 → 每 1.5 秒静默放弃、永远不出发。
`PlayerHero.stepTour` 改为 0.5° → 5° → 30° 逐级放宽，目的地规划失败换下一个。

---

<a id="m"></a>
## M. 战略地图上移动有点卡 —— 长帧归因到抠绿空转 + 逐点全扫（2026-11-03）

**主人原话**：「检查下，战略地图上移动有点卡。」

**先读的落盘数据**（主人的局，跟拍 神圣罗马骑 / 萨克森重骑，zoom9）：fpsP50 48、gap p90 35 / p99 60ms；
20s 窗口 88 个长任务 / 8044ms（最长 1498）；`longFrame` 130~300ms 时主循环自己只花几 ms → 时间在主循环之外，
已登记热点只到 24.7ms/帧。按案例 I 的结论**直接上 CPU Profile**。

**量法**：`node scratch/_probe_march_longframes_20261103.mjs <tag>` —— 无头独立开一局（不碰主人的局），玩家切「环球」、zoom9 跟拍 20s，
页面里记每帧 rAF 间隔，把落在 >100ms 帧里的 CPU 样本按「最近 src 帧」归因；附带打印还在走抠绿的目录（`chromaDirs`）和②的新旧逐点对比（`equiv`）。
⚠️ 开局位置随机，各次长帧数波动大，要看归因里谁消失了，不要只比总数。

**真凶①**：`LegionPhalanxDrawer.doProcessImage` —— 镜头一动，新军团进视野 → `ensureUnitTypeLoading` → 每张雪碧图主线程同步
`drawImage + getImageData + 逐像素`，一批 4 张连着跑。修前一次 20s：7 个长帧采样 945ms 里**514ms** 在这（其中 `getImageData` 384ms）。
离线扫 `public/SUCAI` 全部 37158 张非遮罩图（`scratch/_scan_sucai_green_20261103.mjs`，结果 `.json`）：
绿幕大户 `S10QZ`（三国志10，无 `_meta.json`）463 张；有 `_meta.json` 的 DE 目录 504 个，只有 6 个出现零星命中（素材自带绿色，几十~几百像素）。
**修法**：按每张图自己的目录判定 —— 有 `_meta.json` 且不在 `CHROMA_KEEP_DE_DIRS`（那 6 个）里就跳过抠绿，直接 `createImageBitmap(img)`，
产物形状（`sourceUrl` / `src=''` / 原图照常释放）与抠绿路径完全一样。那 6 个和无 meta 的目录照旧抠 → 8/9/10 画面不变
（唯一差别是不再经过 get/putImageData 的预乘 alpha 往返，半透明边缘像素可能差 1~2 个色阶，肉眼不可见）。
修后长帧归因里 `getImageData` 消失；剩下的 `doProcessImage` 采样是 `createImageBitmap` 首次解码，属于素材本身的成本。

**真凶②**：`PlayerHero.stepTour`（环球）每规划一段，对路线**每个点**调 `getNearestCityId(…, 0.2)` 记沿途据点 = 点数 × 全部路网节点，
一次长帧里 443ms。**修法**：`RoadRegistry.getNearestCityIdsAlongPath` —— 外包框筛候选 + 分格，只比 3×3 邻格；等距按原遍历序取先者，跨日界线退回逐点全扫。
验收：300 条随机真实路线、183 万个点逐点 **0 差异**，耗时 116.6s → **8.0s**。

**前 → 后**（无头、各 20s，地区不同）：长帧 7 个/1900ms → **2 个/1100ms**；gap p90 33.3 → **16.8ms**，p99 66.8 → **50ms**。
剩下两个长帧里 JS 采样只有 136ms，其余不在 JS（无头合成器），不代表真机。主人的局要等暂停/重开（ReloadGate）后，看下一份
`perf_doctor_latest.json`（`context.trigger:'march-stutter'`）的 `longTasks` 验收。


---

<a id="n"></a>
## N. 植被是不是战略地图移动卡的主因（2026-11-09，进行中）

**主人原话**：「玩家在战略地图上移动卡顿是植被过多造成的吗？」→「接着查主因」。（本项目不在 zoom8 下运行。）

**主人局数据**（`perf_doctor_log.jsonl` 11-08 共 25 份 march-stutter）：植被 `VegetationLayer.render` 每份 0.05～0.9s，
长任务每份 3～27.6s → 植被占 **2%～13%**，且与长任务多少不相关（05:59 那份长任务 23s、植被 0.5s）。
最卡一份（09:06）：`GlobalUnitRenderer.animate` 5.0s 居首、植被 3.6s（单次峰值 123ms）、堆锯齿 5 次 major GC（19MB/s）、
登记热点合计 ~17s 对长任务 27.6s → **~10s 在热点之外**。

**无头复现**（`scratch/_probe_march_trace_20261109.mjs`，CDP 时间线按 CrRendererMain 归因）：Layerize 几乎每帧一次，10s 合计 ~1.6s，
每次 ~375 个合成层；但跟拍 372 帧里只有 39 帧有 DOM 增删 → **不是 DOM 增删触发**。

**🔴 已证伪，别重走**：「合成层多 → Layerize 慢」。`.map-fade-in` 用 `both` 让 287 个播完的淡入动画常驻（成层原因 `ActiveOpacityAnimation`），
运行时注入 `animation-fill-mode:backwards` 后层数 704/1021 → 643/646，但 Layerize 1607/2138 → **3815/3653ms**（反而更高），
组内差异大于组间 → 无收益，**未改**。藏小地图同样无可测差异。

**无头的局限**：开局不久、军团少，部队渲染与 GC 量级远小于主人局；页面还会被并行会话的源码改动 HMR 整页刷新
（探针已加 timeOrigin 校验，刷新即作废）。

**下一步**：PerfDoctor 已加 `longFrames`（Long Animation Frames API，常驻，近零开销）。主人局暂停/重开（ReloadGate）后，
读下一份 march-stutter 落盘的 `longFrames.按脚本` 与 `未归因ms` 定真凶；`GameAppLoop ← FrameRequestCallback` 大时再对照 `hotspots` 拆子系统。
无头验证：20s 内 12 个长帧 1145ms = 脚本 793 / 渲染段 612 / 未归因 293，按脚本能定位到 `CityLifeAmbientLayer.tick` 单次 116ms 等。

**🔴 11-09 主人纠正：说的是「掉帧」不是「卡住」**。掉帧看每帧成本，不看 >50ms 长任务。
主人局 25 份按真实帧数加权：已登记 JS **每帧合计 3.4ms**（fps<45 的份 4.3ms，其中植被 0.32ms）→ 掉帧时间不在游戏逻辑里。
无头控制变量（每组 10s 时间线，记镜头位移防「没在走」）：正常跟拍 Layerize 每次 3.0～8.1ms、同组复测差一倍以上；
藏据点 / 遗迹 / 战场 / 地名 / 画布各组都落在这个噪声区间内 → **无头定不出是哪一层**。曾有一次「藏全部标记 0.9ms」是单次，复测不成立。
⚠️ LoAF（`longFrames`）只收 >50ms 的帧，30fps 掉帧（33ms/帧）它**收不到**；掉帧要在主人机器上录时间线。
**11-09 补：PerfDoctor 新增 `frameCost`**（包住 rAF/setTimeout/setInterval，常驻 DEV）——掉帧专用：按帧给「游戏JS / 其余（渲染侧+GC）」，
另列 rAF 回调每帧 ms。无头验证一次：掉帧帧平均 35.4ms = 游戏JS 14.4 + 其余 20.9；`GameAppLoop` 7.1ms/帧居首。等主人局落盘看真机比例。
**11-09 主人局 frameCost 首批（环球，6 份）**：掉帧帧平均 27～69ms，其中**游戏 JS 20～36ms（占 60～75%）**，其余 6～33ms →
**掉帧主要是 JS，不是渲染侧**。JS 几乎全在 `GameAppLoop` 主循环 rAF 里，而已登记热点合计每帧 <1ms（逻辑段 ~10 帧才跑一次）。
已补计时：`主循环:<段>`（PerformanceMonitor.endTimer 转记）、`主循环:整帧`、`主循环:部队渲染调度`、`跟拍:move/moveend 监听器合计`、
`move监听:<函数名>`（DEV 下逐个计时，等同 Leaflet fire）。rAF 匿名回调抽样改随机（原按序号会锁死同一回调，GameAppLoop 被算 2 倍）。
无头参考：主循环整帧 8.3ms/帧 = 部队渲染调度 2.4 / camera 2.3（moveend 2.0）/ ai 1.5 / historicalEvent 1.4。等主人局第二批数据。
**11-09 第二批只落了 1 份**：MarchStutterProbe 的自动 dump 要求 20s 内 ≥3 次 >120ms 大顿 —— 持续 30~40fps 的掉帧**永远不触发**。
已加「窗口跟拍 fps <45 且 ≥200 帧」也 dump（`trigger:'march-lowfps'`，仍 ≥60s 一份）。
那 1 份（08:51，fps 44）：掉帧帧 30.1ms = 游戏 JS 10.7 + 其余 19.4；JS 里 `GlobalUnitRenderer.animate` 4.1ms/帧（峰值 120ms）居首，
行军 0.9、AI 0.7、camera 0.6（moveend 0.46）、move 监听 0.02。与第一批（JS 20~36ms）差很大，样本不足，不下结论。
**11-09 有头 Edge（真显卡，2538×1302，新开局环球 zoom9，10 分钟每分钟一份，`scratch/_edge_globe_20261109.json`）**：
fps 30~60；掉帧帧 25~42ms = 游戏 JS 10~18ms + 其余 14~24ms（⚠️ 其余含等下一个 vsync 的时间，会高估渲染侧）。
主循环每帧 6~7ms：部队渲染调度（GlobalUnitRenderer.animate）2.0~3.7 居首，AI 1.1~2.4，行军 0.9~1.6，camera 0.5~1.9；
主循环外的独立 rAF（海浪 1.0~1.5、植被 0~1.3、民生等）另占 ~4~11ms。植被不是主因，与主人局结论一致。

**11-09 部队渲染优化（主人：「好的，请优化」）**
分段（Edge 有头 3 分钟）：排序 0.01 / 更新状态 0.05~0.07 / 收集可见 0.02 / **逐军团绘制 1.0~2.3ms/帧（仅 1~2 支）** → 病在画单支军团。
Edge CPU 采样（renderUnit 内）：`renderInfo` 自身最大——每军团每帧三行字各设一次 `ctx.font`/描边（字体串解析）再由 `drawUnitLabel` 读回拼键，命中缓存时全白做；
另每帧 `getGeneralRecordByGeneralId` 只为取名字却新建整条记录 + 解析立绘路径。CPU 采样只占量到时长的 1/4~1/7，其余是 GPU 画布同步，采样器看不到。
修法：① `drawUnitLabel` 改收显式样式 `UnitLabelStyle`，键 = 文字 + 样式 id，命中只剩查表 + drawImage（四种样式新旧离屏图逐像素 0 差异）；
② 标签武将名 1 秒缓存；③ `PlayerTourSpriteDrawer.findPassingCity` 1° 格网（22 万次随机含日界线与全扫 0 差异，25→0.8µs/次）。
前→后：逐军团绘制 1.03/2.31/2.10 → **0.75/0.78/0.79 ms/帧**（同为每帧 ~2 支）。

**11-09 继续优化（主人：「继续优化」）**——Edge 有头，欧洲林区（START=city_weiyeena，`scratch/_probe_edge_all_20261109.mjs`）
① **海陆瓦片解码搬进 Worker**（`src/workers/TileDecodeWorker.ts` + `TileDecoder.decodeTileInWorker`）：主线程原每帧 1.8~6.9ms（逐帧预算队列只能摊平）。
   三采样器（高程/水域掩膜/影像）有 Worker 走后台，否则退回原路径。6 块×3 种瓦片与主线程解码**逐字节 0 差异**（掩膜含全海/全陆/海岸）。改后 rAF 列表里该项消失。
② **小地图 setView 门槛 0.02°→小图 1px**（`WorldMiniMap.applyView`，纬度乘 cos）：30s 内 setView 219→99、耗时 945→379ms、单次最长 21→7.6ms。
   另 `requestMiniSync(true)` 也守 10Hz（不足 100ms 排补发，停稳仍对准）。
③ **植被**：树贴图到达的重画合并到下一帧；换季渐变重画 30→15fps（`BLEND_PAINT_MIN_INTERVAL_MS` 33→66，**画面待主人看**）；
   视野内无换季树时渐变期不重画。30s 重画 248→198 次（其中渐变 159→107）。
   实测整层重画一次（2000~3000 棵）显卡忙 25~45ms（读 1 像素强制同步量出；JS 只 4.5ms）——这才是林区「其余」时间的大头。
🔴 **已证伪，别重走**：「frames.png 长条太宽（最宽 24012px）超显卡纹理上限导致慢」。单独基准（小数坐标、单树种）里拼图快 2~4 倍，
   但真实植被层（整数坐标、10 种树交替）拼图——画布或 ImageBitmap——都**更慢**（旧 24~36ms vs 新 43~61ms），已完整撤回。

**11-09 晚 主人报「特别卡」（F3 面板 91fps 是主循环 JS 时长的倒数，不是真帧率；DD、AA 各出一份分析，AA 已改 CombatUI 签名去重 / 战术期暂停战略装饰层 / 攻城标签节流等）**
21:24 主人局落盘（AA 改动未生效前）：跟拍 fps 22.9，20s 内长任务 125 个 10.5s、最长 763ms；moveend 里小地图同步单次最长 608ms。
- 撤掉 PerfDoctor 常驻包 rAF/定时器：LoAF「按脚本」第一名变成 PerfDoctor.ts 自己（包装让所有回调记到它头上）。改为控制台手动 `perfDoctor.wrapJsEntryPoints()`。
- 🔴 已证伪：小地图同级改 panBy 代替 setView 能省重投影——新开局实测 4.4ms/次 vs setView 3.8ms/次，无收益且中心差 1.18px，已撤回。608ms 尖峰新开局复现不出（最长 11ms），待 AA 改动生效后的落盘再看。
- **DD ① 军团列表差分更新**（`CameraFollowUI.refreshList`）：原每 500ms 清空容器重建 24 行；改为逐行比对样式/HTML（签名存 WeakMap，不写 DOM 属性），只改变了的行，悬停只绑一次。
  表头「最高连胜/据点最多」卡同样内容不变不重写。无头验：22 军团 22 行、无空行，10s 内新增节点 1175（仅兵力变化的行）。
- **DD ③ `RoadRegistry.findNearestCityId` 1° 格网**（路网增点/增边/重建即作废，另以节点数|边数兜底）：12 万次随机查询（含日界线、半径 0.02~10°）与全扫 **0 差异**，88→4.8µs/次。半径 >10° 或近极点退回全扫。

**11-09 22:00 主人「突然又出现严重卡顿」**
- F3「旗号(按需) 24018ms」是 processStandardFaction 的**异步全程墙钟**（含让步等待），不是主线程阻塞，别当成 24 秒冻结。
- 21:36~22:04 游戏重载 9 次（boot_timing_log）；21:59 起几次与 CC 改 GameAppLoop.ts 时间重合 → 开发服 HMR 整页刷新 → 重开后旗号/素材预热期很卡。主人在玩时改主循环文件会刷掉局。
- 最重一份（21:56:01，450 个长任务/36.7s）发生在**战术战斗**里：`主循环:combat`（含 scene13War.tick）每帧均 18.4ms、最长 171ms；
  进战斗一次性 `Scene13GroundSetup` getMapData().then 同步建地面 **2039ms** + `Scene13CityLayout` **934ms** ≈ 进战斗冻 3 秒。未处理。
- 名字颤抖：无头按「入伍→随军战败→停顿」复现不出（120 帧名字/地图层不动；测试 dpr=1，主人 4K 150%）。已加 `src/debug/LabelJitterProbe.ts`（DEV 每帧量中心 6 个城名 Y，30 帧内 ≤4px 来回翻 ≥6 次即落 stuck_legion_log，probe:'label-jitter'）。自测：静止 0 误报、人为 ±0.6px 抖动 1 条。

**11-09 22:20 真凶：「玩家离开军团就卡」= 直播面板选去处候选列表**
主人局 13:18:47 落盘 LoAF：`ViewerLivePanel.ts ← setInterval` 32 次合计 **86s、单次最长 5157ms**（窗口长任务 458 个 / 123s）。
链路：ViewerLivePanel 每 300ms render → ViewerLive.snapshot → `PlayerQuestSystem.getLiveJoinCandidates`。玩家无归属（离队）时才有候选（截图「共 671 位」），
缓存校验对**每条势力随机项**调 `liveJoinFactionPool`（扫 1255 城×武将，逐武将 `isGeneralSortieReady`→`armyOfGeneral` 全扫军团 + `getGeneralRecordByGeneralId` 新建记录）。
修：`makeSortieReadyChecker`（武将→军团表一次建好，取 getArmies 首个 = 原 find）+ `liveJoinPoolCounts`（一遍扫出 势力|文化 / 势力|* 计数），缓存校验逐项查表；整体重算也用批量判定器。
无头验：1431 组 城×武将 判定 0 差异；1680 组 势力×文化（含 null/''）池非空 0 差异；旧单池 0.95ms×百余项/300ms → 新全量计数 9.7ms/300ms。
- LabelJitterProbe 改为纯 JS 读 pane.y + 标记 _leaflet_pos.y，不再每帧 getBoundingClientRect（6 分钟自身吃 279ms）。13:14 抓到一次：跟拍行军中名字在 575 ↔ 574.34 间来回（亚像素平移 → 文字贴像素行），dpr=1。
- 进战术 1~2.3s 冻结（另案，未改）：`generateDeElevationGrid/generateFieldBattleTerrain` 的 `growCohesiveClump`（count5x5/inGrowthGuard/inProtect）≈0.9~1.2s + `mkProgram` 着色器每场重编 ~300ms。

**11-09 22:40 进战术冻结修复**（`Scene13GroundLayerGL.ts`）
- `GridSet extends Set<number>`：插入序/迭代/size 全走父类，has 读字节数组（团块 count5x5 每格 25 次 has + 每团全图 5×5 平滑扫）。
- `memoGrid`：城池 `inGrowthGuard`（atan2/sin/cos）与野战 `inProtect`（逐地基 hypot）按格记忆；依赖变量在建表前已定、之后不变。rnd() 调用序不动。
- 着色器 `getProgram` 按 GL 上下文 WeakMap 缓存（glCanvas 由幂等 attach 只建一次），destroy 不再 deleteProgram；上下文丢失/失效自动重编。
- 等价：页面内对拍 GridSet≡Set 60 万次随机增删查清（含越界）0 差异、迭代序一致；memoGrid≡原函数 107 万点（含越界/小数）0 差异。
- 前后（5~6 分钟无头随机局，>700ms 长任务）：前 2329/938/1012ms 里 growCohesiveClump ~0.9~1.2s + mkProgram ~0.3s；后 749/974/710/706ms 里两者都不再出现，进战术那次剩 828ms 原生（贴图上传等）。非同一场对比。
- 新看到的战略侧尖峰：`CityLifeAmbientLayer.drawHuntingTree` 单帧 222ms、`TerritorySystem.relayoutCityLabels` 130ms（未处理）。

**11-09 23:00 战略单帧尖峰（drawHuntingTree 222ms / relayoutCityLabels 130ms）**
- `TerritorySystem.relayoutCityLabels`：不再「先全部 transform='' 再量」（写后读 = 全部城名强制重排），改为量当前外框减本函数上次写入位移（`CITY_LABEL_SHIFT`），只给位移变了的写回。
  合成对拍：40 轮 2392 个城名（1528 个需避让，含连排两次、中途改字宽）与原写法 **0 差异**。理论边界：1/64px 布局单位 vs 0.1px 位移，贴边恰好时可能差千分之几像素。尖峰真机未复测。
- 🔴 已证伪，别重走：「长条图首次 drawImage 慢是同步解码 → 先 img.decode()」。页面实测首画 decode 前后同量级（雨林 41.9→44.1ms、橡树 18→15.2ms）：贵的是**整条上传显卡**，不是解码。已完整撤回（CityLifeAmbientLayer / VegetationLayer 与 21:22 备份逐字相同）。
