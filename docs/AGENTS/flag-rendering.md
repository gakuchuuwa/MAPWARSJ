<!-- 本文件为 AGENTS.md 外置细则（2026-08-07 拆分瘦身），内容与拆分前原文逐字一致；AGENTS.md 仅保留摘要与链接。 -->

## 十、地图旗号与势力色块（2026-06-01 立，AI 勿擅自“优化”）

本节约束 **据点旗、叛军旗、势力领土色块、启动性能**。改前先读 `src/assets/CityAssetManager.ts` 文件头注释。

### 10.1 势力色块（领土）— 默认关闭

| 项 | 约定 |
|---|---|
| **玩家默认** | 地图面板 `chk-faction`（开启势力区域显示）**未勾选** = 不显示势力色块/边界 |
| **代码默认** | `CityManager.territoryLayerVisible === false`；`GameApp` 启动时 **禁止** `toggleTerritoryLayer(true)` |
| **启动时** | **禁止** 自动 `renderTerritoryOnly()` / 全图 611 城 BFS；仅 `renderCitiesOnly()` 画据点旗号 |
| **用户勾选后** | `toggle-faction-color` → `CityManager.toggleTerritoryLayer(true)`，若尚未计算领土再 `renderTerritoryOnly()` |
| **占城增量** | 仅当 `territoryLayerVisible === true` 时才 `scheduleTerritoryIncremental` |

**禁止**：为“首屏好看”在启动时强制全图领土重绘（曾导致主线程卡死、F12 无响应）。

### 10.2 正规势力旗号（非叛军）

| 项 | 约定 |
|---|---|
| **势力色唯一来源** | 每局开局 `FactionManager.addFaction` **随机 HSL** → `getFactionColor()` → **旗帜染色、军队贴图、领土** 必须用同一值 |
| **数据文件** | `factions.ts` **不含** `color` 字段（勿写 hex，避免误导）；批量导入新势力也只写 `id` + `name` |
| **跨局** | 同一 `factionId` 每局颜色不同；认旗号汉字，不认固定配色 |
| **撞色** | 分配时尽量保证色相间距 ≥18°（重试有限次，仍可能偶发相近） |
| **染色模板** | `/SUCAI/S10QZ/7-1.png`（`templateFlagPath`） |
| **处理** | `chromaKeyImage` 抠绿幕 + 按 `FactionManager.getFactionColor` 染色 → Data URL |
| **CSS 类** | `.flag-faction-{factionId}`，规则由 `setFlagStyleRule` 写入（**可覆盖**旧规则） |
| **启动占位** | `seedBootPlaceholderFlags`：全体势力先用 **已抠绿、未染色** 的中性模板（`ensureChromaNeutralTemplate`），**禁止** 把未抠绿的 `7-1.png` 原图当 `background-image`（会出现绿块） |
| **后台补全** | 各势力 `processStandardFaction` 染色后必须 **更新** CSS；`placeholderFactionIds` 标记未染色势力，染色后删除 |

**禁止**：

- 启动 `await` 全势力 `chromaKey`（500+ 势力会占死主线程）
- `injectFlagStyles()` 用 `innerHTML` **整表重建** 全部旗号 CSS（曾卡 UI）
- `Promise.all` **并行** 多张 `chromaKey` / `toDataURL`
- 占位旗写进 CSS 后，用 `appendFlagStyleRule` 且 **检测到 selector 就 return** 导致永不更新（已改为 `setFlagStyleRule`）

### 10.2.1 旗号汉字黑白（2026-06-09 立）

玩家看见的旗号 **1–2 个汉字** 必须与旗面底色**对比分明**：深旗白字、浅旗黑字。

| 项 | 约定 |
|---|---|
| **唯一分界** | 旗面亮度 `lum`（ITU-R BT.601：`0.299R+0.587G+0.114B`，0–255）与 **`FLAG_TEXT_LUM_THRESHOLD = 128`** 比较 |
| **深旗**（`lum < 128`） | **白字** fill `#f0f0e8` + **黑边** stroke `rgba(0,0,0,0.80)` |
| **浅旗**（`lum ≥ 128`） | **黑字** fill `#1a1a1a` + **白边** stroke `rgba(255,255,255,0.70)` |
| **适用范围** | 固定色（`HistoricalFactionColors.ts`）与每局随机色（`FactionManager.getFactionColor`）**同一阈值**，禁止固定色另设 `<50` 等第二套 |
| **亮度来源** | 优先 `HistoricalFactionColors[factionId]`；否则 `FactionManager.getFactionColor(factionId)` |
| **强制白字例外** | `FLAG_TEXT_WHITE_STYLE_FACTIONS`：`yue_d` 岳（黑旗白字，戚继光《纪效新书》等可考） |
| **强制黑字例外** | `FLAG_TEXT_BLACK_STYLE_FACTIONS`：`han_d` 汉（赤旗黑字，史料可考） |
| **叛军 panjun** | 不渲染汉字（无字旗） |
| **单一真理** | 常量 `FLAG_TEXT_LUM_THRESHOLD` @ `HistoricalFactionColors.ts`；逻辑 `CityAssetManager.resolveFlagTextIsDark` |
| **审计** | `npm run flag-text:check` → 列出全部固定色势力 lum 与黑白判定；新增固定色须过审 |

**禁止**（史料例外除外）：

- 深旗（秦、苻、大辽、大明等 `lum < 128`）用黑字 — **除外** `FLAG_TEXT_BLACK_STYLE_FACTIONS`
- 浅旗（商、唐、大元等 `lum ≥ 128`）用白字 — **除外** `FLAG_TEXT_WHITE_STYLE_FACTIONS`
- 在 `resolveFlagTextIsDark` 外硬编码 fill/stroke 而不走 lum 判定

### 10.3 叛军旗号（`factionId === 'panjun'`）— 与正规势力完全不同

**不是“12 种旗号”，也不是只载前 12 张图。**

| 项 | 约定 |
|---|---|
| **素材编号** | `S10QZ` **`7-1.png` ～ `58-1.png`**（闭区间 **7–58**，共 **52** 面独立旗面） |
| **存储** | `processedRebelFlags: string[]`，下标 `0..51` 对应上述 52 面（按加载顺序 push，**不是** 素材编号当数组下标） |
| **据点显示** | `TerritorySystem` 使用 CSS 类 **`flag-rebel-{index}`**，`index = getProcessedRebelFlagIndex(cityId)`（对 `processedRebelFlags.length` 取模） |
| **加载入口** | `processPanjunFlags()` **无 `rebelMax` 参数** = 加载完整 **7–58**；`ensureFullPanjunRebelFlags()` 仅补未跑完的尾段 |
| **启动** | `preloadRebelFlagsForBoot()`：画 611 据点前 **必须** 跑满 52 面抠绿（可慢，但叛军显示正确） |
| **完成标记** | `panjunRebelsFullyLoaded === true` 表示 7–58 已全部处理 |

**禁止**（历史错误，勿恢复）：

- `panjunRebelMax: 12` 或任何把叛军 **截断到 7–18** 的“性能优化”
- 叛军 `Promise.all` 并行抠 52 张图
- `seedBootPlaceholderFlags` 给 `panjun` 写 `.flag-faction-panjun`（叛军走 `flag-rebel-*`，不是势力模板旗）
- 据点已渲染但 `processedRebelFlags` 仍为空（会错用占位模板或透明异常）

### 10.4 启动旗号加载顺序（`GameApp.start`）

1. `FactionManager` 初始化  
2. `prepareDeferredFlagQueue`：登记全表待染队列，**首次拖图前不消化**  
3. `seedBootPlaceholderFlags`（正规势力中性透明占位，**不含 panjun**）  
4. `preloadRebelFlagsForBoot`：**只 await 兜底 1 面**叛军旗；其余 51 面 3s 后后台断点续载  
5. `onBootMapReady`：视口势力旗**不 await**，交给 onDemand 队列后台逐面上色  
6. `renderCitiesOnly`（**不要** 与全图领土 BFS 绑在同一 await 链上）  
7. `completeLateBoot` 等其余系统延后，主循环尽早 `requestAnimationFrame`

军团贴图 `GlobalUnitRenderer.preloadAssets` 不阻塞启动（`void` 起飞、不 await），但它**整个启动期都在跑**，
必须自己控制主线程占用，否则会把主链每一步的 `await` 续点全部撑长——2026-08-05 修掉了
`processImage` 重复抠图（2416 次未去重，实际只有 600 张不同的图），后台标签页同条件实测
9.3s→5.4s；**前台效果尚未取到干净样本**，勿引用未标条件的加速比。

⚠️ **对比启动耗时必须先分 `hidden` 字段**：后台标签页不渲染地图，本身就比前台快一个量级
（8-04 同日同代码：后台中位 9.3s、前台中位 20.4s）。拿后台样本比前台样本会得出假的加速比。
诊断判据：`sessionPeaks` 里 `bootLongTask` 笔数/总时长，以及 `flagPerf.imgLoadMs`
（它量的是**主线程排队**，不是网络——dev server 已实测排除）。

### 10.5 改代码前自检（旗号/领土）

- [ ] 势力色块默认仍关闭？`chk-faction` 与 `territoryLayerVisible` 一致？  
- [ ] 叛军仍是 **7–58 共 52 面**，没有新造 `panjunRebelMax`？  
- [ ] 正规势力占位是否仍用 **抠绿后** 模板，不是绿幕原图？  
- [ ] chromaKey 是否 **逐个** + `yieldSchedulingSlice`，无 `Promise.all`？  
- [ ] 是否避免启动全图领土 `update()`？  
- [ ] `factions.ts` 是否仍**无** `color` 字段？`FactionManager` 是否每局随机色（未读数据 hex）？
- [ ] 旗号汉字是否仍走 **§10.2.1** 单一阈值 `FLAG_TEXT_LUM_THRESHOLD=128`（深旗白字/浅旗黑字）？


---

