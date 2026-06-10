# MAPWAR 性能分析报告（2026-06-01）

> 方法：**静态代码审计** + **微基准**（`node scripts/perf-static-audit.mjs`）+ 项目内置 `PerformanceMonitor`（已加强计时项）。  
> 自动化 Puppeteer 采样在本机因页面加载超时未完成；你可本地运行 `npm run dev` 后执行 `node scripts/perf-profile.mjs`。

---

## 1. 数据规模（决定「底子有多重」）

| 项目 | 数量 |
|------|------|
| 据点 `cities_v2` | **612** |
| 势力 `factions` | **~569** |
| 沙盒模式 | `SANDBOX_MODE: true`，历史剧本事件 **关闭** |

地图上要画：约 **569 块势力领土**（多边形 + 边界）+ **612 个城市标记/标签** + 所有军团精灵（Canvas）。

---

## 2. 帧循环结构（为何「未计入」往往很大）

当前有 **两条独立的 `requestAnimationFrame` 循环**：

1. **`GameApp.gameLoop`** — 日历、军团逻辑、战斗、AI、征兵  
2. **`GlobalUnitRenderer.animate`** — **每帧** `clearRect` + 遍历全部单位 `renderUnit`（**即使全部静止也画**）

监控面板里的 **「未计入*」** ≈ 总帧时间 −（军团 + 历史 + 战斗 + AI + 征兵 + 画布）。  
其中通常包含：**Leaflet/SVG 领土层**、地图平移缩放、DOM 合成、第二条 rAF 中与 GameApp 重叠的部分等。

---

## 3. 已量化热点（按影响大致排序）

### A. 单位画布 — `GlobalUnitRenderer`（高）

```403:446:src/map/GlobalUnitRenderer.ts
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // ... 遍历 sortedUnitsCache，每个单位 renderUnit ...
        requestAnimationFrame(this.animate.bind(this));
```

- **无静止跳过**：没有「全静止则停画」逻辑（注释里写了优化方向但未实现）。
- 军团越多、精灵越大（14 文化阵型格位），**每帧绘制成本线性上升**。
- 监控项：**单位画布**（`renderDrawMs`）。

**自测**：`Shift+\`` 看「单位画布」是否 >8ms；军团多时通常明显。

---

### B. 领土 + 城市 DOM — `TerritorySystem`（高）

- 约 **569 势力 ×（填充 + 边界）** → `getPolygonCount()` 常在 **1000+** 图层。
- **`zoom` / `zoomend`** 时对 **全部** `territoryLayerGroup.eachLayer` 调 `setStyle`（见 `updateTerritoryStyle`）。
- 锁定 **zoom=9** 时平移较少触发重算，但 **首次加载、势力变更、缩放穿阈值** 仍会卡一下。

**自测**：`Ctrl+Shift+T`（渲染抑制测试）隐藏领土+城市后对比 FPS（监控面板说明里有写）。  
若 FPS 明显上升 → **渲染是主因**。

---

### C. 军团逻辑 — `LegionManager.update`（中～高，随军团数上升）

每帧对每个军团：

- 最多 **2 次** `cityManager.getNearestCity(null, pos)` → **每次扫描 612 个据点**（O(据点)）。
- `spatialRegistry.getArmiesInRadius`（已分桶，较好）。
- 战后驻留还会扫邻近攻城/野战（新增逻辑）。

**微基准**（Node 模拟 60 帧，仅「最近城」扫描）：

| 军团数 | 约耗时/帧 |
|--------|-----------|
| 10 | ~0.15 ms |
| 30 | ~0.07–0.15 ms |
| 80 | ~0.19 ms+ |

据点全表扫描在军团 **几十上百** 且与其它系统叠加后，会成为可感知负担。  
监控项：**军团逻辑**。

---

### D. AI — `AIController`（中，沙盒已开）

- 沙盒下 **默认 enabled**。
- 每帧最多处理 **10 个军团** 的行为树（时间分片），军团多时 **轮转延迟**，但仍有稳定开销。
- 监控项：**AI**。

---

### E. 其它

| 项 | 说明 |
|----|------|
| 征兵 `RecruitmentSystem` | 每 **15 游戏秒** 扫一遍全部城市，平时很轻 |
| 历史事件 | 沙盒关闭剧本后几乎为 0 |
| ~~DEBUG 日志~~ | 原 `HistoricalEventManager` **每秒 `console.log`**（沙盒也跑）→ **已移除** |
| 镜头跟随 | 跟随时每帧 `setView`，额外地图重绘 |

---

## 4. 如何自己采「真实数据」

### 游戏内（推荐）

1. 运行 `npm run dev`，打开地图。  
2. **`Shift + \``**（Shift+反引号）打开性能监控。  
3. 看 5～10 秒：**FPS**、**未计入***、**单位画布**、**军团逻辑**。  
4. 点 **播放**，军团变多后再看一轮。  
5. **`Ctrl+Shift+T`**：隐藏/显示领土与城市，看 FPS 差多少（量化渲染占比）。

### 命令行

```bash
node scripts/perf-static-audit.mjs
# 浏览器（需 dev server）:
node scripts/perf-profile.mjs http://localhost:5174 8
```

---

## 5. 结论（直接回答「卡在哪」）

| 场景 | 最可能原因 |
|------|------------|
| **刚进游戏、地图刚出来就卡** | 领土多边形 + 城市标记 **首次构建/样式**（DOM/SVG 量大） |
| **暂停也略卡** | **GlobalUnitRenderer 全帧重绘** + Leaflet 底图 + 大量 DOM |
| **点播放、军团多了更卡** | 画布绘制 ↑ + 军团碰撞/最近城扫描 ↑ + AI ↑ |
| **拖动/缩放地图瞬间卡** | `updateTerritoryStyle` / `updateCityScales` 遍历全部图层 |

**不是单一 bug**，而是：**大地图 DOM（领土+城市）** 与 **全帧 Canvas 军团渲染** 叠加，沙盒军团增多后 **CPU 主线程** 吃满。

---

## 6. 若要做优化（按性价比）

1. **GlobalUnitRenderer**：全静止时降频或停画（例如 2fps 或跳过 clear/draw）。  
2. **getNearestCity**：改为空间索引 / 只查当前桶内城市（与 `SpatialRegistry` 一致）。  
3. **TerritorySystem**：zoom=9 锁定下缓存样式，避免 `eachLayer` 全量 `setStyle`。  
4. **合并 rAF** 或让 GameApp 驱动渲染 tick，避免双循环。  
5. 军团极多时：降低精灵细节或视口裁剪（只画视窗内）。

---

_监控增强已写入：`PerformanceMonitor` 增加军团/画布/未计入；`Shift+\`` 面板可见。_
