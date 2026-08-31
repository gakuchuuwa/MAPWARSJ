# PerfDoctor — 卡顿诊断器（面向 AI）

> 代码：`src/debug/PerfDoctor.ts`
> 报告：`scratch/perf_doctor_latest.json`（历史追加在 `scratch/perf_doctor_log.jsonl`）
> 落盘端点：`vite.config.ts` 的 `/api/perf-doctor`

**这个工具的输出不是给人看的仪表盘，是给 AI 读的结构化诊断。**
它不回答「fps 多少」，而是回答「哪里坏了、在哪个文件、怎么改、怎么验收」。

---

## 一、怎么用

| 操作 | 作用 |
|---|---|
| **`Shift+F3`** | 落盘一份完整报告到 `scratch/perf_doctor_latest.json` |
| `F3` | **不变**，还是原来那个给人看的实时面板。两者不同 |
| `perfDoctor.dump()` | 控制台等价于 Shift+F3 |
| `perfDoctor.reset()` | 清零采样（保留缓存登记） |
| `await perfDoctor.auditCanvas(3000)` | 按**画布**归因，3 秒内每张 canvas 烧了多少毫秒 |

**AI 标准工作流**：`reset()` → 复现卡顿 → `dump()` → 读 `findings`。

战略／战术**共用同一套**，报告里 `context.scene` 自动标 `tactical(scene13)` 或 `strategic`。

---

## 二、报告结构

```
schema        mapwar.perf-doctor/2
env           ← 先读这段！数据可不可信
frames        真实 fps / 帧间 p50·p90·p99
longTasks     >50ms 的主线程阻塞
heap          JS 堆（⚠️ 看不到图片位图，见坑 1）
caches        各图片缓存的**实算字节数**
hotspots      已登记函数的耗时与扫描量
findings      ★ 结构化诊断结论，AI 直接照做
aiGuide       方法论 + 已踩过的死路
```

### `env` 必须先读

```json
"env": { "dataTrustworthy": false, "mapViewport": "0x0", "rafRunning": false }
```

`dataTrustworthy: false` 就**别读下面任何数字**。
浏览器面板隐藏时 Leaflet 视口是 `0×0`、rAF 不触发，按视口/按帧的数全是垃圾。

> 2026-08-31 血训：我拿 0×0 视口下的数当成「植被出现回归」，连改四轮、每轮等 4 分钟重载，**白烧一小时**，而根本没有回归。

### `findings` 每条长这样

```json
{
  "rule": "cache-unbounded",
  "severity": "critical",
  "symptom": "缓存【LegionPhalanxDrawer:unitSpriteCache】没有上限。",
  "evidence": { "entries": 322, "currentMB": 12961.9 },
  "where": "src/map/legion/LegionPhalanxDrawer.ts:unitSpriteCache",
  "fix":   "改成按字节预算 FIFO/LRU 淘汰…",
  "verify":"再次 dump，本项 limitKind 应为 bytes"
}
```

---

## 三、规则表

| 规则 | 触发条件 | 来源根因 |
|---|---|---|
| `heap-near-ceiling` | 堆峰值/上限 ≥0.45（≥0.65 critical） | 8-30 战术卡顿（堆撞 4096MB） |
| `cache-unbounded` | 缓存 `limitKind: none` | 8-31 兵种贴图 12961MB |
| `cache-count-limited` | 缓存按**条数**限容 | 8-30（单条实测 0.9~1.7MB，注释按 64KB 估，差 26 倍） |
| `hot-path-full-scan` | 平均每次扫描 ≥5000 元素 | 8-31 `findNearestRoadEntry` 每次扫 32.3 万坐标 |
| `hot-call-over-budget` | 单次 ≥8ms（≥16.7ms 且样本 ≥20 才 critical） | 同上（31.7ms/次） |
| `frame-gap-dominant` | fps<45 或帧间 p90>33ms，**而已登记热点很小** | 各子系统计时全 ≈0ms、fps 却只有 23 |
| `long-tasks` | 长任务合计 >300ms | 实测 438 次 / 49 秒 / 最长 8.9 秒 |

> `hot-call-over-budget` 有**样本数下限 20**：很多函数首次调用要建缓存
> （`findNearestRoadEntry` 首调 29~88ms、之后 0.2ms），少样本不判 critical，免得把冷启动当成稳态热点。

---

## 四、🔴 铁律

### 1. 任何图片/位图缓存都必须登记，并提供**真实 `bytes()`**

```ts
perfDoctor.registerCache({
    name: 'XxxLayer:assets(说明)',
    where: 'src/xxx/XxxLayer.ts:常量名',
    entries: () => cache.size,
    bytes:   () => { /* 逐张 w×h×4，data: URL 再加 length×2 */ },
    limitKind: 'bytes',          // 'count' 和 'none' 都会被判 critical
    limitValue: BUDGET_BYTES,
});
```

**条数上限对尺寸方差大的资源等于没有上限**（本项目 DE strip 从 0.04MB 到 101MB）。

### 2. 容量预算必须**显著高于稳态工作集**

预算卡在稳态值上 = 抖动发生器。
8-31 把兵种贴图预算设成 1200MB 而稳态正好 1134MB → 反复淘汰又重载，
每次重载都要重跑抠绿（`getImageData` + 逐像素 + `toDataURL`），**长任务不降反升**。已放到 2000MB。

### 3. 加淘汰之前，先确认「淘汰掉的能不能自动回来」

没有按需重载就淘汰 = 内容永久消失。
兵种贴图是**先补了 `ensureUnitTypeLoading` 按需加载，才敢开淘汰**的。

### 4. 淘汰策略用 **LRU，不要 FIFO**

FIFO 按插入年龄淘汰，与「谁在用」无关 —— 会把**正在画的**那批顶掉。
8-31「军团士兵一直不显示」就是这么来的：打完一场 13，缓存被战场素材塞满，
回战略地图后每插一张就淘汰最旧的，而最旧的正是上一帧刚用过的士兵贴图。

### 5. 缓存里不能存「半成品」，或调用方必须检查

图片是**异步解码**的。`LegionPhalanxDrawer` 拿到染色结果**不检查 `.complete`**
就去算帧、`drawImage` —— 未解码图 `naturalWidth = 0` → 帧数算成 0 → 整格画不出来。
现在染色器在未解码时**直接返回原图**（最多这一瞬间没上势力色）。

---

## 五、已踩过的死路（别重走）

| ❌ 别做 | 实测反证 |
|---|---|
| 用 `performance.memory` 判断内存问题 | **已解码位图不在 JS 堆**。heap 报 702MB 时，贴图缓存实占 **12961MB** |
| 先怀疑寻路算法 | Dijkstra 缓存命中率 **99%**、单次 0.9ms |
| 先怀疑 13 的 step/render | 中位 2.4ms + 2.3ms，占 60fps 预算不到 30% |
| 信注释里的估算 | 「冷路径」「一张约 64KB」两次都被证伪（差 26 倍） |
| 把「子系统计时正常」读成「不卡」 | GC 停顿在**帧与帧之间**，任何子系统计时器都测不到 |
| 面板隐藏时测图层 | 视口 `0×0`，一屏只采到 4 个格子（正常是 54） |

**数字反常时先加计数器问「每道闸各拦掉多少」，不要连猜。**
8-31 一加计数器立刻看到 `clusters: 4`（不是「4 个被拒」而是「总共只跑了 4 格」），一眼定位；
之前猜四轮的时间够加二十次计数器。

---

## 六、已登记清单

**缓存**：SpriteTinter 染色/遮罩、Scene13 CLEAN/DECROMA、VegetationLayer 树贴图、
AnimalAmbientLayer 动物、TradeTrafficLayer 商队、**LegionPhalanxDrawer 兵种帧集/抠绿图**。

**热点**：`AIController.update`、`RoadRegistry.findNearestRoadEntry`（带 scanned 计数）、
`VegetationLayer.render`。

> 新增任何图片缓存或每帧热路径，**顺手登记**——看不见的东西没法优化。

---

## 七、页面里有多个独立 rAF 循环

`GameAppLoop` / `GlobalUnitRenderer` / 植被 · 动物 · 商队 · 海面生物各层，**各跑各的**。
任何一个空转都吃帧预算。检查它们在 **scene13 激活**或**视口 0×0** 时有没有直接 `return`。
