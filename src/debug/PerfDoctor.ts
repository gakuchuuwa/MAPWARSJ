/**
 * PerfDoctor — 卡顿诊断器（输出面向 **AI**，不面向人）
 *
 * 为什么要有它：2026-08-30/31 两轮排查卡顿，真凶都**不在**「看起来最可疑」的地方 ——
 *   · 战术模式：13 自己的 step+render 中位只有 2.4+2.3ms，真凶是**堆撞 4096MB 天花板**
 *     （四个素材缓存按「条数」限容，而单条实测 0.9~1.7MB，注释里却按 64KB 估，差 26 倍）。
 *   · 战略模式：Dijkstra 缓存命中率 99%、单次仅 0.9ms（**不是**寻路算法），
 *     真凶是 `findNearestRoadEntry` 每次遍历 32.3 万个坐标并当场 new 出 32.3 万个临时对象（31.7ms）。
 * 两次都是「按条数/按直觉限容」与「热路径被当成冷路径」。这类问题**测一下就现形，猜一天也猜不到**。
 * 所以本模块不输出「fps 多少」这种给人看的数，而是输出**带证据、带定位、带修法的结构化 finding**，
 * 让接手的 AI 直接照着改，不必重走一遍死路。
 *
 * 用法（DEV）：
 *   · `Shift+F3` 或控制台 `perfDoctor.dump()` → 落盘 `scratch/perf_doctor_latest.json`（并追加 jsonl）
 *   · 想让某个缓存被体检：`perfDoctor.registerCache({...})`，**必须给 bytes() 而不是只给 size**
 *   · 想让某个函数被体检：把调用包进 `perfDoctor.measure('名字', () => ...)`，或手动 `note()`
 *
 * 🔴 铁律：**任何按条数限容的图片/位图缓存都必须在这里注册并提供 bytes()**。
 *    条数上限对尺寸方差大的资源（DE strip 从 0.04MB 到 101MB）等于没有上限。
 */

/** 缓存体检登记项。bytes() 是**必填**——只报 size 的缓存查不出「条数上限失真」这类根因。 */
export interface CacheProbe {
    /** 唯一名（建议 `文件:常量名`，便于 AI 直接定位） */
    name: string;
    /** 源码位置，形如 `src/ui/Scene13WarLayer.ts:129` */
    where: string;
    /** 当前条目数 */
    entries: () => number;
    /** 当前**实际占用字节**（位图按 w×h×4，字符串按 length×2） */
    bytes: () => number;
    /** 限容方式：'bytes' = 已按字节预算（健康）；'count' = 按条数（可疑）；'none' = 无上限（危险） */
    limitKind: 'bytes' | 'count' | 'none';
    /** 上限数值（limitKind='bytes' 时为字节，'count' 时为条数） */
    limitValue?: number;
}

/** 热点函数采样。 */
interface HotSample {
    n: number;
    total: number;
    max: number;
    /** 每次调用扫描/分配的元素量（可选）——用来抓「热路径上的 O(n) 全量扫描 + 临时对象」 */
    scanned: number;
}

/** 一条 AI 可直接执行的诊断结论。 */
export interface Finding {
    /** 规则 id，稳定不变，便于 AI 去重与查历史 */
    rule: string;
    severity: 'critical' | 'warn' | 'info';
    /** 一句话说清「哪里坏了」 */
    symptom: string;
    /** 支撑数字（AI 判断可信度用；空说明该规则未采到样） */
    evidence: Record<string, number | string>;
    /** 该去看哪个文件哪一行 */
    where: string;
    /** 怎么修（写成祈使句，AI 照做） */
    fix: string;
    /** 怎么验收 */
    verify: string;
}

const MB = 1024 * 1024;

export class PerfDoctor {
    private static instance: PerfDoctor | null = null;
    public static getInstance(): PerfDoctor {
        if (!PerfDoctor.instance) PerfDoctor.instance = new PerfDoctor();
        return PerfDoctor.instance;
    }

    private caches: CacheProbe[] = [];
    private hots = new Map<string, HotSample & { where: string }>();
    /** 堆采样滚动窗口（MB） */
    private heapSamples: number[] = [];
    private heapTimer: ReturnType<typeof setInterval> | null = null;

    // ── 登记 ────────────────────────────────────────────────
    public registerCache(p: CacheProbe): void {
        this.caches = this.caches.filter(c => c.name !== p.name);
        this.caches.push(p);
    }

    /** 手动上报一次调用耗时；scanned = 本次扫描/分配的元素数（抓全量扫描用） */
    public note(name: string, ms: number, where = '', scanned = 0): void {
        let s = this.hots.get(name);
        if (!s) { s = { n: 0, total: 0, max: 0, scanned: 0, where }; this.hots.set(name, s); }
        s.n++; s.total += ms; s.scanned += scanned;
        if (ms > s.max) s.max = ms;
        if (where && !s.where) s.where = where;
    }

    /** 包一层计时（返回值透传） */
    public measure<T>(name: string, fn: () => T, where = '', scanned = 0): T {
        const t = performance.now();
        try { return fn(); } finally { this.note(name, performance.now() - t, where, scanned); }
    }

    /**
     * 清零采样（保留缓存登记）。
     * AI 标准工作流：`perfDoctor.reset()` → 复现卡顿 → `perfDoctor.dump()`，
     * 这样 hotspots 里只有本次复现的数据，不掺历史噪声。
     */
    public reset(): void {
        this.hots.clear();
        this.heapSamples.length = 0;
    }

    /** 开始堆采样（DEV 自动调用一次即可） */
    public startHeapWatch(intervalMs = 2000): void {
        if (this.heapTimer) return;
        this.heapTimer = setInterval(() => {
            const m = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
            if (!m) return;
            this.heapSamples.push(m.usedJSHeapSize / MB);
            if (this.heapSamples.length > 900) this.heapSamples.shift();
        }, intervalMs);
    }

    // ── 规则 ────────────────────────────────────────────────
    /** 堆占天花板比例超过此值 = 必然频繁 major GC，帧间空档就是它 */
    private static readonly HEAP_CRITICAL = 0.65;
    private static readonly HEAP_WARN = 0.45;
    /** 单次调用超过此毫秒数 = 一帧预算(16.7ms)的显著部分 */
    private static readonly HOT_CALL_WARN_MS = 8;
    /** 平均每次调用扫描元素数超过此值 = 热路径上的全量扫描 */
    private static readonly SCAN_WARN = 5000;
    /** 少于这么多次采样不判 critical（防把冷启动建缓存当成稳态热点） */
    private static readonly MIN_SAMPLES_FOR_CRITICAL = 20;

    private q(a: number[], p: number): number {
        if (!a.length) return 0;
        const s = [...a].sort((x, y) => x - y);
        return s[Math.min(s.length - 1, Math.floor(s.length * p))];
    }

    private buildFindings(): Finding[] {
        const out: Finding[] = [];
        const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;

        // ── 规则 1：堆逼近天花板（2026-08-30 战术卡顿的真凶就是这条）──
        if (mem) {
            const limitMB = mem.jsHeapSizeLimit / MB;
            const peakMB = this.heapSamples.length ? Math.max(...this.heapSamples) : mem.usedJSHeapSize / MB;
            const ratio = peakMB / limitMB;
            if (ratio >= PerfDoctor.HEAP_WARN) {
                out.push({
                    rule: 'heap-near-ceiling',
                    severity: ratio >= PerfDoctor.HEAP_CRITICAL ? 'critical' : 'warn',
                    symptom: '堆占用逼近浏览器上限，major GC 频繁 → 帧与帧之间出现长空档。'
                        + '注意：此时各子系统自身的 step/render 计时可能完全正常，别据此判定「不卡」。',
                    evidence: {
                        heapPeakMB: +peakMB.toFixed(0),
                        heapLimitMB: +limitMB.toFixed(0),
                        ratio: +ratio.toFixed(2),
                        samples: this.heapSamples.length,
                    },
                    where: 'src/debug/PerfDoctor.ts (规则 heap-near-ceiling)',
                    fix: '先看本报告 caches 段里 limitKind 非 bytes 的项，把它们改成**按字节预算**淘汰；'
                        + '再检查是否有「同一份数据存了两份」（如解码位图 + 它自己的 data URL 字符串）。',
                    verify: '连开 8~10 次相关场景，堆峰值应稳定在上限的 1/3 以下。',
                });
            }
        }

        // ── 规则 2：按条数限容（两轮卡顿的共同根因）──
        for (const c of this.caches) {
            let entries = 0, bytes = 0;
            try { entries = c.entries(); bytes = c.bytes(); } catch { continue; }
            const perEntryKB = entries > 0 ? bytes / entries / 1024 : 0;
            if (c.limitKind === 'count' || c.limitKind === 'none') {
                const projectedMB = c.limitKind === 'count' && c.limitValue
                    ? (c.limitValue * (bytes / Math.max(1, entries))) / MB
                    : Number.NaN;
                out.push({
                    rule: c.limitKind === 'none' ? 'cache-unbounded' : 'cache-count-limited',
                    severity: 'critical',
                    symptom: c.limitKind === 'none'
                        ? `缓存【${c.name}】没有上限。`
                        : `缓存【${c.name}】按**条数**限容。当资源尺寸方差大时（本项目 DE strip 从 0.04MB 到 101MB），`
                          + '条数上限等于没有上限——这正是 2026-08-30 堆撞 4096MB 的成因。',
                    evidence: {
                        entries,
                        currentMB: +(bytes / MB).toFixed(1),
                        perEntryKB: +perEntryKB.toFixed(0),
                        limitCount: c.limitValue ?? 'none',
                        projectedWorstCaseMB: Number.isNaN(projectedMB) ? '无上限' : +projectedMB.toFixed(0),
                    },
                    where: c.where,
                    fix: '改成按字节预算 FIFO/LRU 淘汰：维护 bytes 累加值，超预算就淘汰最旧的。'
                        + '⚠️ 图片是**异步解码**的，写入时 naturalWidth 常为 0，必须在 load 后补记差额，否则预算形同虚设。',
                    verify: '再次 dump，本项 limitKind 应为 bytes，且 currentMB 稳定在预算内。',
                });
            }
        }

        // ── 规则 3：热路径上的全量扫描（战略卡顿的真凶形态）──
        for (const [name, s] of this.hots) {
            const avg = s.total / Math.max(1, s.n);
            const avgScan = s.scanned / Math.max(1, s.n);
            // 🔴 样本太少不判 critical：很多函数**第一次调用要建缓存**（如 findNearestRoadEntry
            //    首调要为 1491 条边建几何缓存，实测 29~88ms，之后每次 0.2ms）。
            //    只有 1~2 次采样时把冷启动当成稳态，会把接手 AI 引去优化一个根本不热的地方。
            const enoughSamples = s.n >= PerfDoctor.MIN_SAMPLES_FOR_CRITICAL;
            if (avg >= PerfDoctor.HOT_CALL_WARN_MS || avgScan >= PerfDoctor.SCAN_WARN) {
                out.push({
                    rule: avgScan >= PerfDoctor.SCAN_WARN ? 'hot-path-full-scan' : 'hot-call-over-budget',
                    severity: (avg >= 16.7 && enoughSamples) ? 'critical' : 'warn',
                    symptom: `【${name}】单次 ${avg.toFixed(1)}ms（峰值 ${s.max.toFixed(1)}ms）`
                        + (avgScan >= 1 ? `，平均每次扫描 ${Math.round(avgScan)} 个元素` : '')
                        + '。若注释自称「冷路径」请勿轻信——2026-08-31 的 findNearestRoadEntry 就自称冷路径，'
                        + '实际每次行军重算都走（攻城结束军团停在攻城圈边=离路，而战斗 90% 是攻城）。',
                    evidence: {
                        calls: s.n,
                        coldStartSuspected: enoughSamples ? 'no' : `是（仅 ${s.n} 次采样，首调常含建缓存成本，请多跑一会儿再 dump）`,
                        avgMs: +avg.toFixed(2),
                        maxMs: +s.max.toFixed(1),
                        totalMs: +s.total.toFixed(0),
                        avgScannedPerCall: Math.round(avgScan),
                    },
                    where: s.where || '(未登记位置)',
                    fix: '① 把「每次调用现算」的派生数据缓存起来（几何/坐标数组随源数据变化才失效）；'
                        + '② 加空间剪枝（包围盒下界 ≥ 当前最优就跳过），把 O(全量) 降成 O(近邻)；'
                        + '③ 检查有没有 `.map()` 之类**每次调用都 new 一批临时对象**的写法，那同时也在喂 GC。',
                    verify: '再次 dump，本项 avgMs 应下降一个数量级；avgScannedPerCall 应显著变小。',
                });
            }
        }

        return out;
    }

    // ── 输出 ────────────────────────────────────────────────
    /** 生成结构化报告（给 AI 读；人读不友好是有意的） */
    public report(context: Record<string, unknown> = {}): Record<string, unknown> {
        const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        const findings = this.buildFindings();
        return {
            schema: 'mapwar.perf-doctor/1',
            at: new Date().toISOString(),
            context,
            heap: mem ? {
                usedMB: +(mem.usedJSHeapSize / MB).toFixed(0),
                limitMB: +(mem.jsHeapSizeLimit / MB).toFixed(0),
                peakMB: this.heapSamples.length ? +Math.max(...this.heapSamples).toFixed(0) : null,
                p50MB: this.heapSamples.length ? +this.q(this.heapSamples, 0.5).toFixed(0) : null,
            } : null,
            caches: this.caches.map(c => {
                let entries = 0, bytes = 0;
                try { entries = c.entries(); bytes = c.bytes(); } catch { /* 探针自身不许抛 */ }
                return {
                    name: c.name, where: c.where, entries,
                    MB: +(bytes / MB).toFixed(1),
                    perEntryKB: entries ? +(bytes / entries / 1024).toFixed(0) : 0,
                    limitKind: c.limitKind, limitValue: c.limitValue ?? null,
                };
            }).sort((a, b) => b.MB - a.MB),
            hotspots: [...this.hots.entries()].map(([name, s]) => ({
                name, where: s.where, calls: s.n,
                avgMs: +(s.total / Math.max(1, s.n)).toFixed(3),
                maxMs: +s.max.toFixed(1),
                totalMs: +s.total.toFixed(0),
                avgScannedPerCall: Math.round(s.scanned / Math.max(1, s.n)),
            })).sort((a, b) => b.totalMs - a.totalMs),
            findings,
            /** 给接手 AI 的方法论：这些是**已经踩过的坑**，别重走 */
            aiGuide: {
                workflow: [
                    '1) perfDoctor.reset()  2) 复现卡顿（进战斗/跑战略）  3) perfDoctor.dump()',
                    '报告落在 scratch/perf_doctor_latest.json，历史追加在 scratch/perf_doctor_log.jsonl。',
                    '游戏里 Shift+F3 等价于 dump()（F3 是给人看的实时面板，两者不同）。',
                    '⚠️ 战术演出（scene13）激活时战略层整体冻结，AI/军团相关 hotspots 采不到样 —— 那是设计，不是探针坏了。',
                ],
                readFirst: [
                    '先看 findings；它已按规则给出定位与修法。hotspots/caches 是原始证据。',
                    'findings 为空不等于不卡：可能是探针没登记。检查 caches 是否覆盖了所有图片/位图缓存。',
                ],
                deadEnds: [
                    '❌ 别先怀疑寻路算法：实测 Dijkstra 缓存命中率 99%、单次 0.9ms，不是瓶颈。',
                    '❌ 别先怀疑 13 的 step/render：实测中位 2.4ms + 2.3ms，占 60fps 预算不到 30%。',
                    '❌ 别信注释里的「冷路径」「一张约 64KB」这类估算——两次都被证伪（实测差 26 倍）。',
                    '❌ 别把「子系统计时都正常」读成「不卡」：GC 停顿发生在**帧与帧之间**，任何子系统计时器都测不到它。',
                ],
                measuringTips: [
                    '浏览器面板隐藏时 rAF 不触发，帧率测不了、演出推不动；此时用 setInterval 手动驱动 gameLoop 仍可测逻辑成本。',
                    '定位行为树热点：递归包 aiController.behaviorTree 每个节点的 tick 计时，36 个节点一次包完。',
                    '算某场素材内存：遍历 scene13War.bank 累加 naturalWidth*naturalHeight*4，再加 src 里 data: URL 的 length*2。',
                    '⚠️ 逐像素读的 canvas 必须 getContext("2d",{willReadFrequently:true})；主渲染 canvas 反而不能加。',
                ],
                thresholds: {
                    heapWarnRatio: PerfDoctor.HEAP_WARN,
                    heapCriticalRatio: PerfDoctor.HEAP_CRITICAL,
                    hotCallWarnMs: PerfDoctor.HOT_CALL_WARN_MS,
                    scanWarnPerCall: PerfDoctor.SCAN_WARN,
                },
            },
        };
    }

    /** 落盘到 scratch/perf_doctor_latest.json（DEV 中间件），并把 JSON 复制一份到控制台变量 */
    public async dump(context: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
        const rep = this.report(context);
        (window as unknown as { __perfDoctorLast?: unknown }).__perfDoctorLast = rep;
        try {
            await fetch('/api/perf-doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rep),
            });
            console.log('[PerfDoctor] 已落盘 scratch/perf_doctor_latest.json；findings =', (rep.findings as Finding[]).length);
        } catch (e) {
            console.warn('[PerfDoctor] 落盘失败（非 DEV？），报告仍在 window.__perfDoctorLast', e);
        }
        return rep;
    }
}

export const perfDoctor = PerfDoctor.getInstance();

// 挂到 window 供控制台/接手 AI 直接调用：`perfDoctor.dump()` / `perfDoctor.report()`
if (typeof window !== 'undefined') {
    (window as unknown as { perfDoctor?: PerfDoctor }).perfDoctor = perfDoctor;
    if (import.meta.env?.DEV) perfDoctor.startHeapWatch();
}
