import { GameConfig } from '../config/GameConfig';

/**
 * PerformanceMonitor — 运行时性能监控面板
 *
 * 功能：
 * - 实时 FPS / 帧耗时
 * - 各子系统逐帧耗时（AI、战斗、领地渲染、历史事件等）
 * - Leaflet DOM 元素计数（多边形、标记、图层数量）
 * - 游戏实体计数（城市数、势力数、军团数）
 * - 可切换显示（F3 / Ctrl+Shift+M / Shift+反引号键）
 *
 * 使用方式：用数据说话，不靠猜。
 */

export interface PerfSnapshot {
    fps: number;
    frameTime: number;          // 当前帧总耗时 (ms)
    avgFrameTime: number;       // 滚动平均帧耗时 (ms)
    maxFrameTime: number;       // 滚动最大帧耗时 (ms)
    frameP95: number;           // 滚动窗口 P95 帧耗时
    frameP99: number;           // 滚动窗口 P99 帧耗时
    slowFrameRatio: number;     // >16ms 占比 (0~1)
    hitchFrameRatio: number;    // >50ms 占比 (0~1)

    aiTime: number;
    combatTime: number;
    recruitmentTime: number;
    historicalEventTime: number;
    legionTime: number;
    calendarTime: number;
    combatUITime: number;
    cameraTime: number;
    unaccountedTime: number;
    /** 单位画布独立 rAF 上报，不计入主循环「未计入」 */
    renderTime: number;
    /** 本次会话内各子系统耗时最高值 (ms)，只升不降，直至 resetPeaks() */
    aiTimePeak: number;
    combatTimePeak: number;
    recruitmentTimePeak: number;
    historicalEventTimePeak: number;
    legionTimePeak: number;
    calendarTimePeak: number;
    combatUITimePeak: number;
    cameraTimePeak: number;
    unaccountedTimePeak: number;
    renderTimePeak: number;
    /** 近 60 帧内主循环 >50ms 的次数（滚动窗口，会升降） */
    hitchCount: number;
    /** 近 60 帧内主循环 >16ms 的次数（滚动窗口，会升降） */
    microHitchCount: number;
    /** 会话内「近60帧计数」出现过的最大值（只升不降） */
    hitchCountPeak: number;
    microHitchCountPeak: number;

    territoryPolygonCount: number;
    cityMarkerCount: number;
    cityLabelCount: number;
    mapPaneCount: number;

    cityCount: number;
    factionCount: number;
    armyCount: number;
    activeSiegeCount: number;
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor | null = null;
    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    // ── 内部状态 ──
    private visible = false;
    private overlayEl: HTMLDivElement | null = null;
    private contentEl: HTMLDivElement | null = null;

    // FPS / 帧时间滚动统计
    private readonly SAMPLE_SIZE = 60;          // 滚动 60 帧
    private frameTimes: number[] = [];
    /** 单帧 >50ms 的次数（滚动 60 帧内）— 严重卡顿 */
    private hitchFrames = 0;
    /** 单帧 >16ms 的次数 — 可感知微顿 */
    private microHitchFrames = 0;
    private static readonly HITCH_THRESHOLD_MS = 50;
    private static readonly MICRO_HITCH_THRESHOLD_MS = 16;
    private static readonly CONSOLE_HITCH_MS = 20;
    /** F12 自动打印尖峰分解（见 GameConfig.LOG.PERFORMANCE_CONSOLE） */
    private hitchConsoleEnabled = GameConfig.LOG.PERFORMANCE_CONSOLE;
    private lastHitchLogTime = 0;
    /** 主循环上一帧结束时刻（用于检测「画面静止」空档） */
    private lastMainFrameEnd = 0;
    private lastCanvasFrameEnd = 0;
    private longTaskObserver: PerformanceObserver | null = null;
    private bootStartedAt = 0;
    private bootMarkTime = 0;
    private bootDone = false;
    private bootPhases: { name: string; ms: number }[] = [];
    private currentFrameStart = 0;
    private frameCount = 0;
    private lastFpsUpdate = 0;

    // 子系统秒表（由 GameApp 在每帧调用 startTimer / endTimer）
    private timers: Record<string, number> = {};
    private timerResults: Record<string, number> = {};
    /** 会话最高值（只升不降；画布 150ms 等尖峰会一直保持显示） */
    private sessionPeaks: Record<string, number> = {};
    /** 短窗口平均（EMA，偏灵敏，避免“太平均”） */
    private sessionAvg: Record<string, number> = {};
    private static readonly AVG_ALPHA = 0.32;

    // ── 频率统计（2026-06-12）：区分「偶发尖峰」vs「持续拖累」──
    /** 每个 noteAsyncWork 事件 key 的近 1 秒时间戳（滚动） */
    private eventTimes: Record<string, number[]> = {};
    /** 最近异步事件 [key, durationMs, ts]（供慢帧归因关联） */
    private recentAsync: Array<[string, number, number]> = [];
    /** 上次 >50ms 慢帧的归因快照：那一帧各系统耗时 + 邻近异步事件（按 key 聚合 [key, 总ms, 次数]） */
    private lastSlowFrame: {
        elapsed: number;
        breakdown: Array<[string, number]>;
        asyncTail: Array<[string, number, number]>;
    } | null = null;

    // 元素计数（由各系统在每帧上报）
    private counts: Record<string, number> = {};
    /** 最近一次非零计数（避免 sporadic 指标闪一下变 0） */
    private lastNonZeroCounts: Record<string, number> = {};

    // DOM 计数缓存（每 500ms 刷新一次避免性能反噬）
    private lastDomCount = 0;
    private domCountCache: { polygonCount: number; markerCount: number; labelCount: number; paneCount: number } = {
        polygonCount: 0, markerCount: 0, labelCount: 0, paneCount: 0,
    };

    // 快照缓存（供外部读取）
    private lastSnapshot: PerfSnapshot = this.emptySnapshot();
    private readonly KEYBIND = '`'; // Shift+` (keyCode 192, key '`')

    // ── 渲染抑制测试（用于量化势力和据点的渲染开销）──
    private renderSuppressed = false;
    private fpsBeforeSuppression = 0;

    private constructor() {
        this.createOverlay();
        this.setupKeybind();
    }

    // ════════════════════════════════════════════
    //  公开 API
    // ════════════════════════════════════════════

    /** 页面加载时初始化监控（由 perfEarly.ts / index.html 触发；面板默认隐藏，F3 切换） */
    public initAtPageLoad(): void {
        this.bootStartedAt = performance.now();
        this.bootMarkTime = this.bootStartedAt;
        this.visible = false;
        if (this.overlayEl) {
            this.overlayEl.style.display = 'none';
        }
        this.markBootPhase('HTML+监控脚本');
        this.setupLongTaskObserver();
    }

    /** 记录启动阶段耗时（GameApp.start 内各步骤调用） */
    public markBootPhase(name: string): void {
        const now = performance.now();
        const ms = this.bootMarkTime > 0 ? now - this.bootMarkTime : 0;
        this.bootPhases.push({ name, ms });
        this.bootMarkTime = now;
        this.bumpSessionPeak('bootStep', ms);
        if (this.visible) {
            this.renderOverlay();
        }
    }

    public finishBoot(): void {
        this.markBootPhase('启动完成');
        this.bootDone = true;
    }

    /** 异步/独立 rAF 工作（领土重绘、季末募兵等） */
    public noteAsyncWork(key: string, durationMs: number): void {
        this.bumpSessionPeak(key, durationMs);
        this.bumpSessionAvg(key, durationMs);
        // 频率：记一条近 1 秒时间戳（用于「每秒次数」列）
        const now = performance.now();
        const arr = (this.eventTimes[key] ??= []);
        arr.push(now);
        const cutoff = now - 1000;
        while (arr.length && arr[0] < cutoff) arr.shift();
        // 慢帧归因关联：保留最近 40 条异步事件
        this.recentAsync.push([key, durationMs, now]);
        if (this.recentAsync.length > 40) this.recentAsync.shift();
        if (durationMs >= 1000) {
            this.logWallHitch(`${key} 阻塞`, durationMs);
        }
    }

    /** 某 key 近 1 秒发生次数（次/秒）。仅 noteAsyncWork 类事件有意义 */
    private eventRate(key: string): number {
        const arr = this.eventTimes[key];
        if (!arr || arr.length === 0) return 0;
        const cutoff = performance.now() - 1000;
        let n = 0;
        for (let i = arr.length - 1; i >= 0 && arr[i] >= cutoff; i--) n++;
        return n;
    }

    /** 画布 rAF 每帧开头调用 */
    public noteCanvasFrameStart(now: number = performance.now()): void {
        if (this.lastCanvasFrameEnd > 0) {
            const gap = now - this.lastCanvasFrameEnd;
            this.bumpSessionPeak('canvasGap', gap);
            this.bumpSessionAvg('canvasGap', gap);
            // 切后台/标签页恢复会出现超长 gap（非业务卡顿），不刷告警噪音
            if (gap >= 800 && gap <= 5000) {
                this.logWallHitch('画布循环空档', gap);
            }
        }
    }

    public noteCanvasFrameEnd(now: number = performance.now()): void {
        this.lastCanvasFrameEnd = now;
    }

    /** 开始帧计时 — 在 gameLoop 最开头调用 */
    public beginFrame(): void {
        const now = performance.now();
        if (this.lastMainFrameEnd > 0) {
            const gap = now - this.lastMainFrameEnd;
            this.bumpSessionPeak('mainGap', gap);
            this.bumpSessionAvg('mainGap', gap);
            // 切后台/标签页恢复会出现超长 gap（非业务卡顿），不刷告警噪音
            if (gap >= 800 && gap <= 5000) {
                this.logWallHitch('主循环空档', gap);
            }
        }
        this.currentFrameStart = now;
    }

    /** 结束帧计时 — 在 gameLoop 最后调用，计算该帧总耗时 */
    public endFrame(): void {
        const elapsed = performance.now() - this.currentFrameStart;
        this.frameTimes.push(elapsed);
        if (elapsed > PerformanceMonitor.HITCH_THRESHOLD_MS) {
            this.hitchFrames++;
        }
        if (elapsed > PerformanceMonitor.MICRO_HITCH_THRESHOLD_MS) {
            this.microHitchFrames++;
        }
        if (this.frameTimes.length > this.SAMPLE_SIZE) {
            const dropped = this.frameTimes.shift();
            if (dropped !== undefined && dropped > PerformanceMonitor.HITCH_THRESHOLD_MS) {
                this.hitchFrames = Math.max(0, this.hitchFrames - 1);
            }
            if (dropped !== undefined && dropped > PerformanceMonitor.MICRO_HITCH_THRESHOLD_MS) {
                this.microHitchFrames = Math.max(0, this.microHitchFrames - 1);
            }
        }
        this.bumpSessionPeak('hitchWindow', this.hitchFrames);
        this.bumpSessionPeak('microHitchWindow', this.microHitchFrames);
        this.frameCount++;
        this.bumpSessionPeak('frame', elapsed);
        this.recordFrameMetrics(elapsed);
        if (this.hitchConsoleEnabled && elapsed >= PerformanceMonitor.CONSOLE_HITCH_MS) {
            this.maybeLogHitchToConsole(elapsed);
        }
        this.lastMainFrameEnd = performance.now();
        this.updateDomCounts();
        this.renderOverlay();
    }

    /** 开始某个子系统的计时 */
    public startTimer(system: string): void {
        this.timers[system] = performance.now();
    }

    /** 结束某个子系统的计时，记录耗时 */
    public endTimer(system: string): void {
        const start = this.timers[system];
        if (start !== undefined) {
            this.timerResults[system] = performance.now() - start;
        }
    }

    /** 上报某个计数（如领土多边形数量、标记数量） */
    public reportCount(key: string, value: number): void {
        this.counts[key] = value;
        if (value > 0) {
            this.lastNonZeroCounts[key] = value;
            this.bumpSessionPeak(key, value);
        }
        if (key === 'renderDrawMs') {
            this.bumpSessionPeak('render', value);
            this.bumpSessionAvg('renderDrawMs', value);
        }
    }

    /** 清零各项「最高」记录（F3 面板旁可在控制台执行 perMonitor.resetPeaks()） */
    public resetPeaks(): void {
        this.sessionPeaks = {};
        this.sessionAvg = {};
        this.lastNonZeroCounts = {};
        this.hitchFrames = 0;
        this.microHitchFrames = 0;
        this.frameTimes = [];
        this.lastMainFrameEnd = 0;
        this.lastCanvasFrameEnd = 0;
        // 频率/慢帧归因同步清零
        this.eventTimes = {};
        this.recentAsync = [];
        this.lastSlowFrame = null;
        if (this.visible) this.renderOverlay();
    }

    private setupLongTaskObserver(): void {
        if (this.longTaskObserver || typeof PerformanceObserver === 'undefined') return;
        try {
            this.longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const ms = entry.duration;
                    this.bumpSessionPeak('longTask', ms);
                    this.bumpSessionAvg('longTask', ms);
                    if (ms >= 1500) {
                        this.logWallHitch(`浏览器 Long Task (${entry.name || 'script'})`, ms);
                    }
                }
            });
            this.longTaskObserver.observe({ type: 'longtask', buffered: true });
        } catch {
            // Safari 等可能不支持
        }
    }

    private logWallHitch(label: string, ms: number): void {
        if (!this.hitchConsoleEnabled) return;
        const now = performance.now();
        if (now - this.lastHitchLogTime < 600) return;
        this.lastHitchLogTime = now;
        console.warn(
            `[Perf] ${label} ${ms.toFixed(1)}ms（未落在主循环计时内，易造成画面静止）`,
            '\n当前最高: 主循环空档',
            this.sessionPeak('mainGap').toFixed(1),
            'ms | 画布空档',
            this.sessionPeak('canvasGap').toFixed(1),
            'ms | LongTask',
            this.sessionPeak('longTask').toFixed(1),
            'ms | 领土重绘',
            this.sessionPeak('territoryRender').toFixed(1),
            'ms | 据点变更',
            this.sessionPeak('cityFactionChange').toFixed(1),
            'ms',
        );
    }

    /** 切换显隐 */
    public toggle(): void {
        this.visible = !this.visible;
        if (this.overlayEl) {
            this.overlayEl.style.display = this.visible ? 'block' : 'none';
        }
        if (this.visible) {
            this.updateDomCounts();
            this.renderOverlay();
        }
    }

    public show(): void {
        if (!this.visible) this.toggle();
    }

    public hide(): void {
        if (this.visible) this.toggle();
    }

    /** 获取当前快照（供外部读取、console.log） */
    public getSnapshot(): PerfSnapshot {
        return this.lastSnapshot;
    }

    /** 开关：主循环 ≥20ms 时自动在 F12 打印分解（默认开） */
    public setHitchConsoleLog(enabled: boolean): void {
        this.hitchConsoleEnabled = enabled;
    }

    /** 输出详细快报到控制台 */
    public logSnapshot(): void {
        const s = this.getSnapshot();
        console.log('═════════ Performance Snapshot ═════════');
        console.log(`FPS: ${s.fps.toFixed(1)} | 帧耗时: ${s.frameTime.toFixed(2)}ms (avg ${s.avgFrameTime.toFixed(2)}ms, max ${s.maxFrameTime.toFixed(2)}ms)`);
        console.log(
            `各项最高(ms): AI ${s.aiTimePeak.toFixed(2)} | 战斗 ${s.combatTimePeak.toFixed(2)} | 征兵 ${s.recruitmentTimePeak.toFixed(2)} | ` +
            `历史 ${s.historicalEventTimePeak.toFixed(2)} | 军团 ${s.legionTimePeak.toFixed(2)} | 日历 ${s.calendarTimePeak.toFixed(2)} | ` +
            `战斗UI ${s.combatUITimePeak.toFixed(2)} | 镜头 ${s.cameraTimePeak.toFixed(2)} | 画布 ${s.renderTimePeak.toFixed(2)} | 未计入 ${s.unaccountedTimePeak.toFixed(2)}`
        );
        console.log(`领土多边形: ${s.territoryPolygonCount} | 城市标记: ${s.cityMarkerCount} | 城市标签: ${s.cityLabelCount} | 地图图层: ${s.mapPaneCount}`);
        console.log(`城市: ${s.cityCount} | 势力: ${s.factionCount} | 军团: ${s.armyCount} | 攻城战: ${s.activeSiegeCount}`);
        console.log('═══════════════════════════════════════');
    }

    /**
     * 渲染抑制测试 — 临时隐藏领土多边形 + 城市标记 + 标签
     *
     * 在浏览器控制台输入 perMonitor.testRenderSuppression() 执行：
     *   第 1 次调用 → 隐藏渲染层，记录抑制前 FPS
     *   第 2 次调用 → 恢复渲染层，比较 FPS 差值
     *
     * 这能直接量化 "124 个势力和 183 个据点的渲染开销" 占了多少帧率。
     */
    public testRenderSuppression(): void {
        this.renderSuppressed = !this.renderSuppressed;
        const game = (window as any).game;
        const ts = game?.cityManager?.getTerritorySystem?.();
        if (!ts) {
            console.warn('⚠️ [PerfTest] 无法访问 TerritorySystem，请确认 game.cityManager.getTerritorySystem() 可用');
            return;
        }
        if (this.renderSuppressed) {
            this.fpsBeforeSuppression = this.lastSnapshot.fps;
            ts.toggleTerritoryLayer(false);
            ts.setCityMarkersVisible(false);
            console.log(`🧪 [PerfTest] 渲染已抑制（领土 + 城市标记 + 标签已隐藏）`);
            console.log(`   📊 抑制前 FPS: ${this.fpsBeforeSuppression.toFixed(1)}`);
            console.log(`   👉 观察 FPS 变化，然后再次调用 perMonitor.testRenderSuppression() 恢复`);
        } else {
            ts.toggleTerritoryLayer(true);
            ts.setCityMarkersVisible(true);
            const currentFps = this.lastSnapshot.fps;
            const diff = currentFps - this.fpsBeforeSuppression;
            const pct = this.fpsBeforeSuppression > 0 ? ((diff / this.fpsBeforeSuppression) * 100).toFixed(1) : 'N/A';
            console.log(`🧪 [PerfTest] 渲染已恢复`);
            console.log(`   📊 抑制前 FPS: ${this.fpsBeforeSuppression.toFixed(1)}`);
            console.log(`   📊 抑制后 FPS: ${currentFps.toFixed(1)}`);
            console.log(`   📈 差值: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} FPS (${pct}%)`);
            console.log(`   🎯 结论: 渲染开销约占总帧耗时的 ${pct}%`);
        }
    }

    // ════════════════════════════════════════════
    //  内部实现
    // ════════════════════════════════════════════

    private emptySnapshot(): PerfSnapshot {
        return {
            fps: 0, frameTime: 0, avgFrameTime: 0, maxFrameTime: 0, frameP95: 0, frameP99: 0, slowFrameRatio: 0, hitchFrameRatio: 0,
            aiTime: 0, combatTime: 0, recruitmentTime: 0, historicalEventTime: 0,
            legionTime: 0, calendarTime: 0, combatUITime: 0, cameraTime: 0,
            unaccountedTime: 0, renderTime: 0,
            aiTimePeak: 0, combatTimePeak: 0, recruitmentTimePeak: 0,
            historicalEventTimePeak: 0, legionTimePeak: 0,
            calendarTimePeak: 0, combatUITimePeak: 0, cameraTimePeak: 0,
            unaccountedTimePeak: 0, renderTimePeak: 0,
            hitchCount: 0, microHitchCount: 0, hitchCountPeak: 0, microHitchCountPeak: 0,
            territoryPolygonCount: 0, cityMarkerCount: 0, cityLabelCount: 0, mapPaneCount: 0,
            cityCount: 0, factionCount: 0, armyCount: 0, activeSiegeCount: 0,
        };
    }

    private createOverlay(): void {
        // 先检查是否已存在
        let existing = document.getElementById('perf-monitor-overlay');
        if (existing) {
            this.overlayEl = existing as HTMLDivElement;
            this.contentEl = this.overlayEl.querySelector('.perf-content') as HTMLDivElement;
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'perf-monitor-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 8px;
            left: 8px;
            z-index: 20000;
            background: rgba(0, 0, 0, 0.88);
            color: #e0e0e0;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.45;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.15);
            min-width: 340px;
            max-width: 420px;
            max-height: 90vh;
            overflow-y: auto;
            pointer-events: none;
            user-select: none;
            display: none;
            box-shadow: 0 4px 24px rgba(0,0,0,0.45);
        `;

        const content = document.createElement('div');
        content.className = 'perf-content';
        overlay.appendChild(content);

        // 标题栏（可点击展开更多）
        const header = document.createElement('div');
        header.style.cssText = 'font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #ffcc00; border-bottom: 1px solid #444; padding-bottom: 4px;';
        header.textContent = '📊 性能监控 (F3 或 Ctrl+Shift+M 切换)';
        overlay.insertBefore(header, content);

        document.body.appendChild(overlay);
        this.overlayEl = overlay;
        this.contentEl = content;
    }

    private setupKeybind(): void {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            const isPerfToggle =
                e.key === 'F3' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) ||
                (e.shiftKey && (e.code === 'Backquote' || e.key === '`' || e.key === '~'));

            if (isPerfToggle) {
                this.toggle();
                if (this.visible) {
                    this.logSnapshot();
                }
                e.preventDefault();
                return;
            }
            if (e.key === 'P' && e.ctrlKey && e.shiftKey) {
                this.logSnapshot();
                e.preventDefault();
                return;
            }
            if (e.key === 'T' && e.ctrlKey && e.shiftKey) {
                this.testRenderSuppression();
                e.preventDefault();
            }
        });
    }

    /** 更新 DOM 元素计数（每 500ms 一次避免开销） */
    private updateDomCounts(): void {
        // [2026-06-12 优化] 这些计数只在面板里显示；面板关着时全图 eachLayer 遍历纯属白费。
        // 守卫掉 → 侦察器关闭时零开销（不再每 500ms 遍历 648 城 + 标记/图层）。
        if (!this.visible) return;
        const now = performance.now();
        if (now - this.lastDomCount < 500) return;
        this.lastDomCount = now;

        try {
            const mapEl = document.getElementById('map');
            if (!mapEl) return;

            // 统计 Leaflet 特有类名的元素
            const leafletMap = (window as any).game?.map?.getLeafletMap?.() as any;
            if (leafletMap) {
                // 通过 Leaflet 内部计数多边形和标记
                const paneNames = Object.keys(leafletMap._panes || {});
                this.domCountCache.paneCount = paneNames.length;

                // 通过 Leaflet 图层管理器统计
                let polygonCount = 0;
                let markerCount = 0;
                let labelCount = 0;

                // 遍历所有图层
                leafletMap.eachLayer((layer: any) => {
                    if (layer instanceof (window as any).L?.Polygon || layer._latlngs) {
                        polygonCount++;
                    } else if (layer instanceof (window as any).L?.Marker || layer._icon) {
                        markerCount++;
                    }
                });

                // 使用 TerritorySystem 暴露的计数（通过 CityManager 访问）
                const cityMgr = (window as any).game?.cityManager;
                if (cityMgr) {
                    const ts = cityMgr.getTerritorySystem?.();
                    if (ts) {
                        polygonCount = ts.getPolygonCount?.() ?? polygonCount;
                        markerCount = ts.getMarkerCount?.() ?? markerCount;
                        labelCount = ts.getLabelCount?.() ?? labelCount;
                    }
                }

                this.domCountCache.polygonCount = polygonCount;
                this.domCountCache.markerCount = markerCount;
                this.domCountCache.labelCount = labelCount;
            } else {
                // 降级：通过 CSS 选择器统计
                this.domCountCache.polygonCount = mapEl.querySelectorAll('.leaflet-overlay-pane svg path.leaflet-interactive, .leaflet-overlay-pane path').length;
                this.domCountCache.markerCount = mapEl.querySelectorAll('.leaflet-marker-icon').length;
                this.domCountCache.labelCount = mapEl.querySelectorAll('.leaflet-marker-icon.map-city-label').length + mapEl.querySelectorAll('.city-label').length;
                this.domCountCache.paneCount = mapEl.querySelectorAll('.leaflet-pane').length;
            }
        } catch (e) {
            // 忽略统计中的错误
        }
    }

    /** 渲染叠加层内容 */
    private renderOverlay(): void {
        if (!this.contentEl || !this.visible) return;

        const s = this.buildSnapshot();

        // 根据 FPS 决定颜色
        let fpsColor = '#4CAF50'; // 绿色 >= 50
        if (s.fps < 30) {
            fpsColor = '#f44336'; // 红色
        } else if (s.fps < 50) {
            fpsColor = '#FF9800'; // 橙色
        }

        const maxFt = s.maxFrameTime; // 会话内主循环最高帧耗时
        let ftColor = '#e0e0e0';
        if (maxFt > 50) {
            ftColor = '#f44336';
        } else if (maxFt > 33) {
            ftColor = '#FF9800';
        }

        const bootTotal = this.bootStartedAt > 0 ? performance.now() - this.bootStartedAt : 0;
        const slowBoot = [...this.bootPhases]
            .filter((p) => p.ms >= 5)
            .sort((a, b) => b.ms - a.ms)
            .slice(0, 5);
        const bootHtml = !this.bootDone
            ? `
            <div style="margin-bottom:6px;padding:4px 0;border-bottom:1px solid #333;">
                <div style="color:#ffcc00;font-size:11px;margin-bottom:3px;">⏳ 加载中 ${bootTotal.toFixed(0)}ms</div>
                ${slowBoot.map((p) =>
                    `<div style="font-size:10px;color:${p.ms >= 50 ? '#f44336' : '#aaa'};">${p.name}: ${p.ms.toFixed(1)}ms</div>`
                ).join('')}
            </div>`
            : (slowBoot.length > 0
                ? `<div style="font-size:10px;color:#666;margin-bottom:4px;">启动最慢: ${slowBoot[0].name} ${slowBoot[0].ms.toFixed(0)}ms · 共 ${bootTotal.toFixed(0)}ms</div>`
                : '');

        const html = `
            ${bootHtml}
            <div style="display:flex;align-items:baseline;flex-wrap:nowrap;margin-bottom:4px;font-variant-numeric:tabular-nums;">
                <span style="color:${fpsColor};font-weight:bold;font-size:15px;min-width:5.5em;text-align:right;">${s.fps.toFixed(1)}</span>
                <span style="color:#888;margin-left:4px;">FPS</span>
                <span style="color:#888;margin-left:10px;">最高</span>
                <span style="color:${ftColor};min-width:4.5em;text-align:right;margin-left:4px;">${maxFt.toFixed(1)}</span>
                <span style="color:#888;margin-left:2px;">ms</span>
                <span style="color:#666;margin-left:10px;min-width:5.5em;text-align:right;">(均 ${s.avgFrameTime.toFixed(1)})</span>
            </div>
            <div style="margin-bottom:4px;font-size:11px;color:#9aa;">
                P95 <span style="color:#ddd;">${s.frameP95.toFixed(1)}ms</span> ·
                P99 <span style="color:#ddd;">${s.frameP99.toFixed(1)}ms</span> ·
                慢帧&gt;16ms <span style="color:${s.slowFrameRatio >= 0.25 ? '#FF9800' : '#bbb'};">${(s.slowFrameRatio * 100).toFixed(0)}%</span> ·
                重卡&gt;50ms <span style="color:${s.hitchFrameRatio >= 0.08 ? '#f44336' : '#bbb'};">${(s.hitchFrameRatio * 100).toFixed(0)}%</span>
            </div>
            ${this.buildStutterLine(s)}
            ${this.buildRatioLine()}
            ${this.buildSlowFrameLine()}
            <div style="color:#888;font-size:10px;margin-bottom:4px;font-weight:bold;">耗时最高 (ms) · 仅显示 &gt;0</div>
            <table style="${PerformanceMonitor.PERF_TABLE_STYLE}">
                <colgroup>
                    <col />
                    <col style="width:8ch" />
                    <col style="width:8ch" />
                    <col style="width:6ch" />
                </colgroup>
                <tr>
                    <td></td>
                    <td style="text-align:right;color:#666;font-size:10px;padding-bottom:2px;">最高</td>
                    <td style="text-align:right;color:#666;font-size:10px;padding-bottom:2px;padding-left:8px;">短均</td>
                    <td style="text-align:right;color:#666;font-size:10px;padding-bottom:2px;padding-left:8px;">次/秒</td>
                </tr>
                ${this.buildMetricTable(s)}
            </table>
            <div style="color:#666;font-size:10px;margin-top:4px;">最高=开页峰值 · 短均=仅有活动时更新 · 次/秒=近1秒频率(橙=>3/s持续拖累) · resetPeaks()清零</div>
            <div style="color:#555;font-size:9px;margin-top:2px;">旗号三行=异步任务累计耗时，非每帧；游玩中应看主循环空档/LongTask</div>
            <div style="border-top:1px solid #333; margin:6px 0 4px 0;"></div>
            <div style="color:#888;font-size:10px;margin-bottom:4px;font-weight:bold;">DOM / 实体</div>
            <table style="width:100%; border-collapse:collapse;">
                ${this.countRow('🏛', '领土', s.territoryPolygonCount)}
                ${this.countRow('📍', '城市标记', s.cityMarkerCount)}
                ${this.countRow('🏷', '标签', s.cityLabelCount)}
                ${this.countRow('🗺', '图层', s.mapPaneCount)}
                ${this.countRow('🏙', '城市', s.cityCount)}
                ${this.countRow('🚩', '势力', s.factionCount)}
                ${this.countRow('⚔', '军团', s.armyCount)}
                ${this.countRow('🏯', '攻城', s.activeSiegeCount)}
                ${this.countRow('🧠', 'BFS节点(全量)', this.displayCount('territoryBfsNodesFull'))}
                ${this.countRow('🧩', 'BFS节点(增量)', this.displayCount('territoryBfsNodesIncremental'))}
                ${this.countRow('🌐', 'BFS影响城', this.displayCount('territoryBfsAffectedCities'))}
                ${this.countRow('🛤', '道路候选数', this.displayCount('vectorPathCandidateCount'))}
            </table>
        `;

        this.contentEl.innerHTML = html;
    }

    private getMainLoopTimes(): {
        aiTime: number;
        combatTime: number;
        recruitmentTime: number;
        historicalEventTime: number;
        legionTime: number;
        calendarTime: number;
        combatUITime: number;
        cameraTime: number;
        unaccountedTime: number;
    } {
        const aiTime = this.timerResults['ai'] ?? 0;
        const combatTime = this.timerResults['combat'] ?? 0;
        const recruitmentTime = this.timerResults['recruitment'] ?? 0;
        const historicalEventTime = this.timerResults['historicalEvent'] ?? 0;
        const legionTime = this.timerResults['legion'] ?? 0;
        const calendarTime = this.timerResults['calendar'] ?? 0;
        const combatUITime = this.timerResults['combatUI'] ?? 0;
        const cameraTime = this.timerResults['camera'] ?? 0;
        const accounted =
            aiTime + combatTime + recruitmentTime + historicalEventTime + legionTime +
            calendarTime + combatUITime + cameraTime;
        const frameTime = this.frameTimes.length > 0 ? this.frameTimes[this.frameTimes.length - 1] : 0;
        const unaccountedTime = Math.max(0, frameTime - accounted);
        return {
            aiTime, combatTime, recruitmentTime, historicalEventTime, legionTime,
            calendarTime, combatUITime, cameraTime, unaccountedTime,
        };
    }

    private recordFrameMetrics(frameTime: number): void {
        const t = this.getMainLoopTimes();
        const renderTime = this.counts['renderDrawMs'] ?? 0;

        // 慢帧归因（>50ms）：快照这一帧各系统耗时 + 邻近 200ms 内的异步事件（旗号/占城/寻路）
        if (frameTime >= PerformanceMonitor.HITCH_THRESHOLD_MS) {
            const breakdown = ([
                ['AI', t.aiTime], ['战斗', t.combatTime], ['镜头跟随', t.cameraTime],
                ['历史事件', t.historicalEventTime], ['军团逻辑', t.legionTime],
                ['征兵', t.recruitmentTime], ['日历', t.calendarTime],
                ['画布绘制', renderTime], ['主循环未计入', t.unaccountedTime],
            ] as Array<[string, number]>)
                .filter(([, v]) => v >= 0.5)
                .sort((a, b) => b[1] - a[1]);
            const now = performance.now();
            // 邻近 200ms 异步事件按 key 聚合（[总ms, 次数]），滤掉 <0.5ms 噪音（如 cityLabel 0ms 刷屏）
            const agg = new Map<string, { ms: number; n: number }>();
            for (const [k, d, ts] of this.recentAsync) {
                if (now - ts > 200) continue;
                const e = agg.get(k) ?? { ms: 0, n: 0 };
                e.ms += d; e.n++;
                agg.set(k, e);
            }
            const asyncTail = [...agg.entries()]
                .map(([k, e]) => [k, e.ms, e.n] as [string, number, number])
                .filter(([, ms]) => ms >= 0.5)
                .sort((a, b) => b[1] - a[1]);
            this.lastSlowFrame = { elapsed: frameTime, breakdown, asyncTail };
        }

        this.bumpSessionPeak('ai', t.aiTime);
        this.bumpSessionPeak('combat', t.combatTime);
        this.bumpSessionPeak('recruitment', t.recruitmentTime);
        this.bumpSessionPeak('historicalEvent', t.historicalEventTime);
        this.bumpSessionPeak('legion', t.legionTime);
        this.bumpSessionPeak('calendar', t.calendarTime);
        this.bumpSessionPeak('combatUI', t.combatUITime);
        this.bumpSessionPeak('camera', t.cameraTime);
        this.bumpSessionPeak('unaccounted', t.unaccountedTime);
        // render 由 reportCount('renderDrawMs') 在画布 rAF 里更新
        this.bumpSessionAvg('ai', t.aiTime);
        this.bumpSessionAvg('combat', t.combatTime);
        this.bumpSessionAvg('recruitment', t.recruitmentTime);
        this.bumpSessionAvg('historicalEvent', t.historicalEventTime);
        this.bumpSessionAvg('legion', t.legionTime);
        this.bumpSessionAvg('calendar', t.calendarTime);
        this.bumpSessionAvg('combatUI', t.combatUITime);
        this.bumpSessionAvg('camera', t.cameraTime);
        this.bumpSessionAvg('unaccounted', t.unaccountedTime);
        this.bumpSessionAvg('renderDrawMs', renderTime);
    }

    private bumpSessionPeak(key: string, value: number): void {
        // 切标签/休眠会出现数万 ms 空档，不是游戏卡顿
        if ((key === 'mainGap' || key === 'canvasGap') && value > 5000) {
            return;
        }
        const prev = this.sessionPeaks[key] ?? 0;
        if (value > prev) {
            this.sessionPeaks[key] = value;
        }
    }

    private sessionPeak(key: string): number {
        return this.sessionPeaks[key] ?? 0;
    }

    private bumpSessionAvg(key: string, value: number): void {
        if (!isFinite(value) || value < 0) return;
        // 空闲帧不写入 0，避免短均几秒就被 EMA 拉到 0.00（看不清尖峰）
        if (value < 0.05) return;
        const prev = this.sessionAvg[key];
        if (prev === undefined) {
            this.sessionAvg[key] = value;
            return;
        }
        const a = PerformanceMonitor.AVG_ALPHA;
        this.sessionAvg[key] = prev * (1 - a) + value * a;
    }

    private maybeLogHitchToConsole(frameMs: number): void {
        const now = performance.now();
        if (now - this.lastHitchLogTime < 800) return;
        this.lastHitchLogTime = now;

        const t = this.getMainLoopTimes();
        const canvasMs = this.counts['renderDrawMs'] ?? 0;
        const rows = ([
            ['战斗', t.combatTime],
            ['AI', t.aiTime],
            ['征兵', t.recruitmentTime],
            ['历史事件', t.historicalEventTime],
            ['军团逻辑', t.legionTime],
            ['日历/据点', t.calendarTime],
            ['战斗UI', t.combatUITime],
            ['镜头跟随', t.cameraTime],
            ['主循环未计入', t.unaccountedTime],
            ['画布(独立rAF·参考)', canvasMs],
        ] as [string, number][]).filter(([, ms]) => ms >= 0.05);

        const breakdown = Object.fromEntries(rows.map(([k, v]) => [k, `${v.toFixed(2)}ms`]));
        console.warn(
            `[Perf] 主循环卡顿 ${frameMs.toFixed(1)}ms — 分解:`,
            breakdown,
            '\n关闭自动日志: perMonitor.setHitchConsoleLog(false)',
        );
    }

    /** 数字列样式：固定宽度 + 等宽数字，避免「短均」变长带动「最高」列晃动 */
    private static readonly PERF_TABLE_STYLE =
        'width:100%;table-layout:fixed;border-collapse:collapse;font-variant-numeric:tabular-nums;';
    private static readonly PERF_NUM_CELL =
        'text-align:right;padding-left:8px;min-width:9ch;width:9ch;max-width:9ch;white-space:nowrap;';
    private static readonly PERF_LABEL_CELL =
        'color:#aaa;padding-right:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

    private formatPerfMs(n: number): string {
        if (n >= 100000) return n.toFixed(0);
        if (n >= 1000) return n.toFixed(1);
        return n.toFixed(2);
    }

    /** 仅当最高值 > 0 时输出一行（避免满屏 0.00） */
    /** @param freqKey 传入则在第 4 列显示该 noteAsyncWork 事件的「每秒次数」（区分偶发尖峰 vs 持续拖累） */
    private metricRowMax(
        label: string,
        maxMs: number,
        avgMs: number,
        warnMs: number,
        danger = false,
        freqKey?: string,
    ): string {
        if (maxMs < 0.05 && avgMs < 0.05) return '';
        const style = maxMs >= warnMs
            ? (danger ? 'color:#f44336;font-weight:bold;' : 'color:#FF9800;font-weight:bold;')
            : (maxMs >= warnMs * 0.6 ? 'color:#bbb;' : 'color:#ccc;');
        const avgStyle = avgMs >= warnMs
            ? (danger ? 'color:#ff8a80;font-weight:bold;' : 'color:#ffd180;font-weight:bold;')
            : (avgMs >= warnMs * 0.6 ? 'color:#9e9e9e;' : 'color:#777;');
        // 频率：偶发(≤1/s)灰、密集(>3/s)橙——持续高频才是真拖累
        let freqCell = '';
        if (freqKey) {
            const r = this.eventRate(freqKey);
            const fStyle = r > 3 ? 'color:#FF9800;font-weight:bold;' : (r > 0 ? 'color:#aaa;' : 'color:#555;');
            freqCell = `<td style="${PerformanceMonitor.PERF_NUM_CELL}${fStyle}">${r > 0 ? r + '/s' : '·'}</td>`;
        } else {
            freqCell = `<td style="${PerformanceMonitor.PERF_NUM_CELL}color:#444;">·</td>`;
        }
        return `<tr>
            <td style="${PerformanceMonitor.PERF_LABEL_CELL}">${label}</td>
            <td style="${PerformanceMonitor.PERF_NUM_CELL}${style}">${this.formatPerfMs(maxMs)}</td>
            <td style="${PerformanceMonitor.PERF_NUM_CELL}${avgStyle}">${this.formatPerfMs(avgMs)}</td>
            ${freqCell}
        </tr>`;
    }

    private buildMetricTable(s: PerfSnapshot): string {
        const rows = [
            this.metricRowMax('AI', s.aiTimePeak, this.sessionAvg['ai'] ?? 0, 3),
            this.metricRowMax('寻路计算', this.sessionPeak('pathfinding'), this.sessionAvg['pathfinding'] ?? 0, 8, false, 'pathfinding'),
            this.metricRowMax('道路编辑寻路', this.sessionPeak('vectorPathfinding'), this.sessionAvg['vectorPathfinding'] ?? 0, 12, true, 'vectorPathfinding'),
            this.metricRowMax('领土BFS', this.sessionPeak('territoryBFS'), this.sessionAvg['territoryBFS'] ?? 0, 20, true, 'territoryBFS'),
            this.metricRowMax('领土BFS(增量)', this.sessionPeak('territoryBFSIncremental'), this.sessionAvg['territoryBFSIncremental'] ?? 0, 12, true, 'territoryBFSIncremental'),
            this.metricRowMax('领土BFS(全量)', this.sessionPeak('territoryBFSFull'), this.sessionAvg['territoryBFSFull'] ?? 0, 25, true, 'territoryBFSFull'),
            this.metricRowMax('战斗', s.combatTimePeak, this.sessionAvg['combat'] ?? 0, 5),
            this.metricRowMax('征兵', s.recruitmentTimePeak, this.sessionAvg['recruitment'] ?? 0, 3),
            this.metricRowMax('历史事件', s.historicalEventTimePeak, this.sessionAvg['historicalEvent'] ?? 0, 2),
            this.metricRowMax('军团逻辑', s.legionTimePeak, this.sessionAvg['legion'] ?? 0, 5),
            this.metricRowMax('日历', s.calendarTimePeak, this.sessionAvg['calendar'] ?? 0, 3),
            this.metricRowMax('└时间update', this.sessionPeak('timeUpdate'), this.sessionAvg['timeUpdate'] ?? 0, 10, true, 'timeUpdate'),
            this.metricRowMax('└城updateYear', this.sessionPeak('cityUpdateYear'), this.sessionAvg['cityUpdateYear'] ?? 0, 10, true, 'cityUpdateYear'),
            this.metricRowMax('复国(季)', this.sessionPeak('rebellion'), this.sessionAvg['rebellion'] ?? 0, 15, true, 'rebellion'),
            this.metricRowMax('据点变更', this.sessionPeak('cityFactionChange'), this.sessionAvg['cityFactionChange'] ?? 0, 20, true, 'cityFactionChange'),
            this.metricRowMax('据点标签', this.sessionPeak('cityLabel'), this.sessionAvg['cityLabel'] ?? 0, 5, false, 'cityLabel'),
            this.metricRowMax('战斗UI', s.combatUITimePeak, this.sessionAvg['combatUI'] ?? 0, 3),
            this.metricRowMax('镜头跟随', s.cameraTimePeak, this.sessionAvg['camera'] ?? 0, 5),
            this.metricRowMax('主循环未计入', s.unaccountedTimePeak, this.sessionAvg['unaccounted'] ?? 0, 8, true),
            this.metricRowMax('画布绘制', s.renderTimePeak, this.sessionAvg['renderDrawMs'] ?? 0, 8),
            this.metricRowMax('主循环空档', this.sessionPeak('mainGap'), this.sessionAvg['mainGap'] ?? 0, 50, true, 'mainGap'),
            this.metricRowMax('画布空档', this.sessionPeak('canvasGap'), this.sessionAvg['canvasGap'] ?? 0, 50, true, 'canvasGap'),
            this.metricRowMax('领土重绘', this.sessionPeak('territoryRender'), this.sessionAvg['territoryRender'] ?? 0, 50, true, 'territoryRender'),
            this.metricRowMax('季末募兵', this.sessionPeak('recruitSeason'), this.sessionAvg['recruitSeason'] ?? 0, 50, true, 'recruitSeason'),
            this.metricRowMax('旗号(启动)', this.sessionPeak('flagLoadBoot'), this.sessionAvg['flagLoadBoot'] ?? 0, 50, true, 'flagLoadBoot'),
            this.metricRowMax('旗号(后台)', this.sessionPeak('flagLoadBg'), this.sessionAvg['flagLoadBg'] ?? 0, 50, true, 'flagLoadBg'),
            this.metricRowMax('旗号(按需)', this.sessionPeak('flagLoadOnDemand'), this.sessionAvg['flagLoadOnDemand'] ?? 0, 50, true, 'flagLoadOnDemand'),
            this.metricRowMax('LongTask', this.sessionPeak('longTask'), this.sessionAvg['longTask'] ?? 0, 50, true, 'longTask'),
        ].filter(Boolean);
        if (rows.length === 0) {
            return '<tr><td colspan="4" style="color:#666;font-size:11px;">暂无耗时记录</td></tr>';
        }
        return rows.join('');
    }

    private countRow(icon: string, label: string, n: number): string {
        if (n <= 0) return '';
        return `<tr><td style="color:#888;padding-right:8px;">${icon} ${label}</td>
            <td style="text-align:right;">${n}</td></tr>`;
    }

    private buildStutterLine(s: PerfSnapshot): string {
        const parts: string[] = [];
        if (s.microHitchCountPeak > 0) {
            let t = `微卡&gt;16ms：最高 ${s.microHitchCountPeak} 次`;
            if (s.microHitchCount > 0) t += ` <span style="color:#666;">(现 ${s.microHitchCount})</span>`;
            parts.push(`<span style="color:#FF9800;">${t}</span>`);
        }
        if (s.hitchCountPeak > 0) {
            let t = `重卡&gt;50ms：最高 ${s.hitchCountPeak} 次`;
            if (s.hitchCount > 0) t += ` <span style="color:#666;">(现 ${s.hitchCount})</span>`;
            parts.push(`<span style="color:#f44336;">${t}</span>`);
        }
        if (parts.length === 0) {
            return '<div style="font-size:11px;color:#666;margin-bottom:6px;">微卡/重卡：暂无</div>';
        }
        return `<div style="margin-bottom:6px;font-size:11px;">${parts.join(' · ')}<span style="color:#666;"> /60帧窗</span></div>`;
    }

    /** 慢帧归因（2026-06-12）：上次 >50ms 卡顿那一帧，是哪些系统/异步事件干的 */
    private buildSlowFrameLine(): string {
        const sf = this.lastSlowFrame;
        if (!sf) return '';
        const top = sf.breakdown
            .slice(0, 4)
            .map(([k, v]) => `${k} ${v.toFixed(1)}`)
            .join(' · ');
        const asyncPart = sf.asyncTail.length
            ? ` <span style="color:#ffab91;">⟂邻近异步: ${sf.asyncTail
                  .slice(0, 3)
                  .map(([k, ms, n]) => `${k} ${ms.toFixed(0)}ms${n > 1 ? `×${n}` : ''}`)
                  .join(' · ')}</span>`
            : '';
        return `<div style="background:rgba(244,67,54,0.12);border-left:2px solid #f44336;padding:3px 6px;margin-bottom:6px;font-size:10px;color:#ffcdd2;">
            <b style="color:#ff8a80;">⚡上次慢帧 ${sf.elapsed.toFixed(0)}ms</b> · ${top || '主循环外'}${asyncPart}
        </div>`;
    }

    private buildRatioLine(): string {
        const aiPeak = this.sessionPeak('ai');
        const pfPeak = this.sessionPeak('pathfinding');
        const territoryPeak = this.sessionPeak('territoryRender');
        const territoryBfsPeak = this.sessionPeak('territoryBFS');
        const aiRatio = aiPeak > 0.05 ? Math.min(1, pfPeak / aiPeak) : 0;
        const territoryRatio = territoryPeak > 0.05 ? Math.min(1, territoryBfsPeak / territoryPeak) : 0;
        if (pfPeak < 0.05 && territoryBfsPeak < 0.05) return '';
        return `<div style="margin-bottom:6px;font-size:11px;color:#9aa;">
            寻路/AI(峰值) <span style="color:${aiRatio >= 0.8 ? '#f44336' : aiRatio >= 0.55 ? '#FF9800' : '#bbb'};">${(aiRatio * 100).toFixed(0)}%</span> ·
            BFS/领土(峰值) <span style="color:${territoryRatio >= 0.8 ? '#f44336' : territoryRatio >= 0.55 ? '#FF9800' : '#bbb'};">${(territoryRatio * 100).toFixed(0)}%</span>
        </div>`;
    }

    private displayCount(key: string): number {
        return this.lastNonZeroCounts[key] ?? this.counts[key] ?? 0;
    }

    private percentile(values: number[], p: number): number {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
        return sorted[idx];
    }

    /** 构建当前快照 */
    private buildSnapshot(): PerfSnapshot {
        const { polygonCount, markerCount, labelCount, paneCount } = this.domCountCache;

        // 计算 FPS 和帧统计
        const frameTime = this.frameTimes.length > 0 ? this.frameTimes[this.frameTimes.length - 1] : 0;
        const avgFrameTime = this.frameTimes.length > 0
            ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
            : 0;
        const maxFrameTime = this.sessionPeak('frame');
        const frameP95 = this.percentile(this.frameTimes, 0.95);
        const frameP99 = this.percentile(this.frameTimes, 0.99);
        const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
        const windowSize = Math.max(1, this.frameTimes.length);
        const slowFrameRatio = this.microHitchFrames / windowSize;
        const hitchFrameRatio = this.hitchFrames / windowSize;

        // 读取游戏实体数据
        const game = (window as any).game;
        const cityCount = this.counts['cities'] ?? 0;
        const factionCount = this.counts['factions'] ?? (game?.getFactionCount?.() as number | undefined) ?? 0;
        const armyCount = (game?.legionManager?.getArmies?.()?.filter(
            (a: { isDestroyed?: boolean; type?: string }) => !a.isDestroyed && a.type === 'legion'
        )?.length) ?? 0;
        const activeSiegeCount = (game?.siegeManager?.hasActiveSieges?.() as boolean) ? 1 : 0;

        const t = this.getMainLoopTimes();
        const renderTime = this.counts['renderDrawMs'] ?? 0;

        const s: PerfSnapshot = {
            fps, frameTime, avgFrameTime, maxFrameTime, frameP95, frameP99, slowFrameRatio, hitchFrameRatio,
            aiTime: t.aiTime,
            combatTime: t.combatTime,
            recruitmentTime: t.recruitmentTime,
            historicalEventTime: t.historicalEventTime,
            legionTime: t.legionTime,
            calendarTime: t.calendarTime,
            combatUITime: t.combatUITime,
            cameraTime: t.cameraTime,
            unaccountedTime: t.unaccountedTime,
            renderTime,
            aiTimePeak: this.sessionPeak('ai'),
            combatTimePeak: this.sessionPeak('combat'),
            recruitmentTimePeak: this.sessionPeak('recruitment'),
            historicalEventTimePeak: this.sessionPeak('historicalEvent'),
            legionTimePeak: this.sessionPeak('legion'),
            calendarTimePeak: this.sessionPeak('calendar'),
            combatUITimePeak: this.sessionPeak('combatUI'),
            cameraTimePeak: this.sessionPeak('camera'),
            unaccountedTimePeak: this.sessionPeak('unaccounted'),
            renderTimePeak: this.sessionPeak('render'),
            hitchCount: this.hitchFrames,
            microHitchCount: this.microHitchFrames,
            hitchCountPeak: this.sessionPeak('hitchWindow'),
            microHitchCountPeak: this.sessionPeak('microHitchWindow'),
            territoryPolygonCount: polygonCount,
            cityMarkerCount: markerCount,
            cityLabelCount: labelCount,
            mapPaneCount: paneCount,
            cityCount,
            factionCount,
            armyCount,
            activeSiegeCount: activeSiegeCount,
        };

        this.lastSnapshot = s;
        return s;
    }
}
