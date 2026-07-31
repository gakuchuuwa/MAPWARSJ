/**
 * ZoomPerfProbe — 缩放卡顿自动采样（仅 DEV）
 *
 * 目的：主人只管正常玩，不必在控制台敲任何东西。每次缩放结束后自动采一份账单，
 * POST 到 /api/zoom-perf，落盘 scratch/zoom_perf_latest.json + zoom_perf_log.jsonl。
 *
 * 最关键的一列是 verdict：
 *   - JS 阻塞  → 长任务总时长能解释最长帧 ⇒ 去查是哪个 handler
 *   - 渲染绘制 → 长任务几乎为零但帧照样很长 ⇒ 主线程没被占住，是浏览器在光栅化/合成，
 *                这类问题优化 JS 无效，得减图层、减像素、减重绘面积
 *
 * 不改变任何游戏行为：只读取状态、包裹现有监听器计时。
 */

import type { GameApp } from '../app/GameApp';

interface FrameSample { t: number; d: number; }

const WINDOW_BEFORE_MS = 1500;
const WINDOW_AFTER_MS = 3000;
const REPORT_DELAY_MS = 3200;
const SLOW_FRAME_MS = 50;

export class ZoomPerfProbe {
    private static installed = false;

    private frames: FrameSample[] = [];
    private longtasks: Array<{ t: number; dur: number; name: string }> = [];
    private handlerCost: Map<string, { n: number; total: number; max: number }> = new Map();
    private lastFrameAt = 0;
    private seq = 0;

    static install(app: GameApp): void {
        if (!import.meta.env.DEV) return;
        if (this.installed) return;
        this.installed = true;
        new ZoomPerfProbe().start(app);
    }

    private start(app: GameApp): void {
        const leaflet = app.map.getLeafletMap();

        this.startFrameRecorder();
        this.startLongtaskObserver();
        this.wrapMapHandlers(leaflet);

        let fromZoom = leaflet.getZoom();
        let zoomStartAt = 0;
        let statsAtStart = this.readHillshadeStats(app);

        leaflet.on('zoomstart', () => {
            fromZoom = leaflet.getZoom();
            zoomStartAt = performance.now();
            statsAtStart = this.readHillshadeStats(app);
            this.handlerCost.clear();
            this.longtasks.length = 0;
        });

        leaflet.on('zoomend', () => {
            const toZoom = leaflet.getZoom();
            const t0 = zoomStartAt || performance.now();
            const before = statsAtStart;
            window.setTimeout(() => {
                this.report(app, leaflet, fromZoom, toZoom, t0, before);
            }, REPORT_DELAY_MS);
        });

        console.log('[ZoomPerfProbe] 已启用：每次缩放自动落盘 scratch/zoom_perf_latest.json');
    }

    private startFrameRecorder(): void {
        const loop = () => {
            const now = performance.now();
            if (this.lastFrameAt) {
                this.frames.push({ t: now, d: now - this.lastFrameAt });
                if (this.frames.length > 4000) this.frames.shift();
            }
            this.lastFrameAt = now;
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    private startLongtaskObserver(): void {
        try {
            const obs = new PerformanceObserver((list) => {
                for (const e of list.getEntries()) {
                    this.longtasks.push({ t: e.startTime, dur: e.duration, name: e.name });
                    if (this.longtasks.length > 200) this.longtasks.shift();
                }
            });
            obs.observe({ entryTypes: ['longtask'] });
        } catch {
            /* 浏览器不支持 longtask：verdict 退化为 unknown */
        }
    }

    /**
     * 包裹 map 上已注册的 zoom/move 监听器，逐个计时归因。
     *
     * 注意：Leaflet 的 fire() 用 `fn.call(listener.ctx || map)` 调用，
     * 没有 ctx 的内部监听器（如 _onMoveEnd）靠这个拿到 map 当 this。
     * 所以这里必须用普通函数并原样转发 this，绝不能用箭头函数或硬传 h.ctx。
     */
    private wrapMapHandlers(leaflet: any): void {
        const events = leaflet._events;
        if (!events) return;
        const probe = this;
        for (const type of ['zoomstart', 'zoom', 'zoomend', 'moveend']) {
            const arr = events[type];
            if (!Array.isArray(arr)) continue;
            arr.forEach((h: any, i: number) => {
                if (h.__zpWrapped) return;
                const orig = h.fn;
                const label = `${type}#${i} ${String(orig).replace(/\s+/g, ' ').slice(0, 70)}`;
                h.fn = function (this: any, ...args: any[]) {
                    // [SAFEGUARD] 避免已被从地图移除的废弃图层在异步事件回调时因 this._map === null 抛出 getCenter 异常
                    if (this && '_map' in this && this._map === null) return;
                    const t = performance.now();
                    try {
                        return orig.apply(this, args);
                    } catch (err: any) {
                        if (err && (err.message?.includes('getCenter') || err.message?.includes('Cannot read properties of null'))) {
                            return;
                        }
                        throw err;
                    } finally {
                        const d = performance.now() - t;
                        const s = probe.handlerCost.get(label) ?? { n: 0, total: 0, max: 0 };
                        s.n++; s.total += d; if (d > s.max) s.max = d;
                        probe.handlerCost.set(label, s);
                    }
                };
                h.__zpWrapped = true;
            });
        }
    }

    private readHillshadeStats(app: GameApp): any {
        const hl: any = (app.map as any).hillshadeLayer;
        return hl?.getStats ? hl.getStats() : null;
    }

    private report(app: GameApp, leaflet: any, fromZoom: number, toZoom: number, t0: number, before: any): void {
        const lo = t0 - WINDOW_BEFORE_MS;
        const hi = t0 + WINDOW_AFTER_MS;
        const win = this.frames.filter(f => f.t >= lo && f.t <= hi);
        if (win.length === 0) return;

        let worst: FrameSample = { t: 0, d: 0 };
        for (const f of win) if (f.d > worst.d) worst = f;

        const ltWin = this.longtasks.filter(l => l.t + l.dur >= lo && l.t <= hi);
        const ltTotal = ltWin.reduce((s, l) => s + l.dur, 0);
        // 最长帧附近（±该帧时长）是否有长任务：能解释就是 JS 阻塞，否则是绘制
        const ltNearWorst = ltWin
            .filter(l => l.t + l.dur >= worst.t - worst.d - 20 && l.t <= worst.t + 20)
            .reduce((s, l) => s + l.dur, 0);

        let verdict: string;
        if (this.longtasks.length === 0 && ltWin.length === 0) verdict = 'unknown(浏览器未上报长任务)';
        else if (ltNearWorst >= worst.d * 0.5) verdict = 'JS阻塞为主';
        else verdict = '渲染绘制为主(JS没被占住)';

        const after = this.readHillshadeStats(app);
        const handlers = [...this.handlerCost.entries()]
            .map(([k, v]) => ({ handler: k, n: v.n, total: Math.round(v.total), max: Math.round(v.max) }))
            .sort((a, b) => b.max - a.max)
            .slice(0, 6);

        const size = leaflet.getSize();
        const payload = {
            seq: ++this.seq,
            at: new Date().toISOString(),
            zoom: `${fromZoom} → ${toZoom}`,
            verdict,
            最长帧ms: Math.round(worst.d),
            最长帧相对缩放开始ms: Math.round(worst.t - t0),
            慢帧数: win.filter(f => f.d > SLOW_FRAME_MS).length,
            窗口内帧数: win.length,
            长任务总ms: Math.round(ltTotal),
            最长帧附近长任务ms: Math.round(ltNearWorst),
            长任务明细: ltWin.map(l => ({ 相对ms: Math.round(l.t - t0), 时长: Math.round(l.dur) })).slice(0, 10),
            监听器耗时Top: handlers,
            山体瓦片: before && after ? {
                本次新算: after.computed - before.computed,
                本次缓存命中: after.cacheHits - before.cacheHits,
                缓存占用: `${after.cacheSize}/${after.cacheMax}`,
                仍在算: after.pending,
            } : null,
            底图瓦片元素数: document.querySelectorAll('.leaflet-tile-pane img').length,
            山体瓦片元素数: document.querySelectorAll('.leaflet-tile-pane canvas').length,
            城marker数: document.querySelectorAll('.city-icon').length,
            视口: [size.x, size.y],
            像素比: window.devicePixelRatio,
        };

        void fetch('/api/zoom-perf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload, null, 2),
        }).catch(() => { /* 落盘失败不打扰游戏 */ });
    }
}
