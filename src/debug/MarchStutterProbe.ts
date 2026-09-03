/**
 * 行军顿挫探针（DEV 专用诊断，不改任何玩法）。
 *
 * 起因（2026-09-03 主人实锤）：「军团移动的时候一顿一顿，好像镜头跟不上的感觉。
 * 而且主要是偏远地区 —— 四周没有据点，反而一顿一顿的，或者海上。」
 *
 * 🔴 为什么要专门做这个：**「东西越少越顿」和「负载大所以卡」正好相反**，
 *    所以此前按长任务/渲染量查的那一路全部不成立。而顿挫只发生在主人那一局的
 *    特定地点，命令行和离线 bench 都复现不出来（路网几何在 tsx 下加载不到，
 *    edge.coordinates 全是 [null,null]，写出来的 bench 是假数据）。
 *    只能在**运行时**把顿的那一刻抓下来。
 *
 * 判据（三选一命中即记一次「顿」）：
 *   ① 镜头冻结后突跳：连续 ≥3 帧相机零位移，紧接着一帧跳 ≥6px；
 *   ② 军团屏幕位移突变：本帧位移 ≥ 最近中位数的 4 倍且 ≥4px（瞬移/速度抖动）；
 *   ③ 掉帧：帧间隔 ≥120ms（此时任何平滑都会看起来一顿）。
 * 每次命中都连同**当时的现场**一起记：军团位置、是否在海上、附近有没有据点
 * （0.5° 与 2° 两个半径的城数 —— 这正是 getFullPathToCity 分支的判据）、
 * 相机与军团的像素差、帧间隔。这样落盘的数据能直接回答
 * 「顿的时候到底是相机停了、军团跳了、还是整帧掉了」。
 *
 * 只诊断，不自愈：根因未定，先拿数据。
 */

import { PerformanceMonitor } from './PerformanceMonitor';
import { perfDoctor } from './PerfDoctor';

/** 相机连续零位移多少帧后再跳，算一次「冻结后突跳」 */
const FREEZE_FRAMES = 3;
/** 冻结后这一跳达到多少像素才算顿 */
const FREEZE_JUMP_PX = 6;
/** 军团屏幕位移超过近期中位数的几倍算突变 */
const SPIKE_RATIO = 4;
/** 突变的绝对下限（像素），滤掉静止时的噪声 */
const SPIKE_MIN_PX = 4;
/** 帧间隔超过多少毫秒算掉帧 */
const LONG_FRAME_MS = 120;
/** 最近多少帧用于算位移中位数 */
const WINDOW = 60;
/** 上报间隔（真实毫秒）：攒一批再发，别每次顿都打一次请求 */
const REPORT_INTERVAL_MS = 20_000;
/** 单次上报最多带几条现场 */
const MAX_EVENTS = 40;
/** 帧间隔超过这个值视为「刚从 13 / 后台回来」：重置基线、不算顿（否则会记出 13 万 ms 的假长帧） */
const RESUME_GAP_MS = 2000;
/** 一个上报窗口内命中 ≥ 此数就自动 perfDoctor.dump（带热点归因），免得主人再按 Shift+F3 */
const AUTO_DUMP_MIN_HITS = 3;
/** 自动 dump 最短间隔 */
const AUTO_DUMP_INTERVAL_MS = 60_000;

interface StutterEvent {
    kind: 'cameraFreezeJump' | 'unitPositionSpike' | 'longFrame';
    atMs: number;
    frameMs: number;
    /** 军团本帧屏幕位移（px） */
    unitStepPx: number;
    /** 最近窗口内军团屏幕位移中位数（px），用来看这一帧偏离多少 */
    unitStepMedianPx: number;
    /** 相机本帧位移（px） */
    camStepPx: number;
    /** 相机与军团的屏幕距离（px）：持续偏大 = 镜头跟不上 */
    camGapPx: number;
    /** 相机此前连续静止了几帧 */
    freezeFrames: number;
    /** 跟拍走了哪条分支：deadzone=死区不动 / snap=距离过大直接吸附 / lerp=正常平滑 */
    branch: 'deadzone' | 'snap' | 'lerp';
    /** 相机中心到军团的实际距离（米） */
    gapM: number;
    lat: number;
    lng: number;
    onSea: boolean;
    zoom: number;
    /** 0.5° 内的城数 —— getFullPathToCity 走贵分支的判据（0 = 必走全网扫路） */
    citiesWithin05: number;
    /** 2° 内的城数：看是不是真·荒僻 */
    citiesWithin2: number;
    armyName: string;
    /** 采样点：main=战略地图正常跟拍主路；battleScene=战略层战斗画布激活时的跟拍分支 */
    site: 'main' | 'battleScene';
    /** 本帧主循环子系统分解（ms，PerformanceMonitor 帧内计时；camera 段此时尚未结束故不含跟拍本身） */
    frame: Record<string, number>;
}

export class MarchStutterProbe {
    private lastUnitPx: { x: number; y: number } | null = null;
    private lastCamPx: { x: number; y: number } | null = null;
    private lastTs = 0;
    private freezeRun = 0;
    private steps: number[] = [];
    private events: StutterEvent[] = [];
    private lastReportAt = 0;
    private followedId: string | null = null;
    /** 统计：总帧数与各类命中数，便于判断顿的比例 */
    private frames = 0;
    private hits = { cameraFreezeJump: 0, unitPositionSpike: 0, longFrame: 0 };
    /** 各分支被走到的帧数：deadzone 占比高 = 相机大部分时间根本没动 */
    private branchCount = { deadzone: 0, snap: 0, lerp: 0 };
    private siteCount = { main: 0, battleScene: 0 };
    private lastZoom = -1;
    private lastDumpAt = 0;

    /** 跟拍目标换人：清空历史，避免拿上一支军团的相位算突变 */
    private resetFor(armyId: string): void {
        this.followedId = armyId;
        this.lastUnitPx = null;
        this.lastCamPx = null;
        this.freezeRun = 0;
        this.steps.length = 0;
    }

    /**
     * 每帧在跟拍回调里调一次。
     * @param unitPx  军团在屏幕（container）上的像素坐标
     * @param camPx   地图中心在同一坐标系下的像素坐标
     * @param ctx     现场信息，由调用方按需提供（查城的开销由调用方控制）
     */
    public sample(
        armyId: string,
        armyName: string,
        unitPx: { x: number; y: number },
        camPx: { x: number; y: number },
        /**
         * 现场信息。城池计数用**惰性函数**：`getCitiesInRadius(2°)` 要摸几百个桶，
         * 每帧都算会把被诊断的东西自己拖慢 —— 只在真判定为「顿」时才调。
         */
        ctx: {
            lat: number; lng: number; onSea: boolean; zoom: number;
            branch: 'deadzone' | 'snap' | 'lerp';
            site: 'main' | 'battleScene';
            gapM: number;
            countCities: (deg: number) => number;
        },
    ): void {
        const now = performance.now();
        if (armyId !== this.followedId) {
            this.resetFor(armyId);
            this.lastTs = now;
            this.lastUnitPx = { ...unitPx };
            this.lastCamPx = { ...camPx };
            return;
        }
        const frameMs = this.lastTs ? now - this.lastTs : 0;
        this.lastTs = now;
        // 缩放变了（像素坐标系整体换算）或刚从 13 / 后台回来：重置基线，本帧不判定
        if (ctx.zoom !== this.lastZoom || frameMs >= RESUME_GAP_MS) {
            this.lastZoom = ctx.zoom;
            this.lastUnitPx = { ...unitPx };
            this.lastCamPx = { ...camPx };
            this.freezeRun = 0;
            this.steps.length = 0;
            return;
        }
        this.frames++;
        this.branchCount[ctx.branch]++;
        this.siteCount[ctx.site]++;

        const unitStep = this.lastUnitPx
            ? Math.hypot(unitPx.x - this.lastUnitPx.x, unitPx.y - this.lastUnitPx.y) : 0;
        const camStep = this.lastCamPx
            ? Math.hypot(camPx.x - this.lastCamPx.x, camPx.y - this.lastCamPx.y) : 0;
        this.lastUnitPx = { ...unitPx };
        this.lastCamPx = { ...camPx };

        const camGap = Math.hypot(unitPx.x - camPx.x, unitPx.y - camPx.y);

        // 位移中位数（近 WINDOW 帧），突变判据的基线
        this.steps.push(unitStep);
        if (this.steps.length > WINDOW) this.steps.shift();
        const sorted = [...this.steps].sort((a, b) => a - b);
        const median = sorted.length ? sorted[sorted.length >> 1] : 0;

        const push = (kind: StutterEvent['kind'], freezeFrames: number) => {
            this.hits[kind]++;
            if (this.events.length >= MAX_EVENTS) return;
            this.events.push({
                kind, atMs: Math.round(now), frameMs: +frameMs.toFixed(1),
                unitStepPx: +unitStep.toFixed(2), unitStepMedianPx: +median.toFixed(2),
                camStepPx: +camStep.toFixed(2), camGapPx: +camGap.toFixed(1),
                freezeFrames, armyName,
                lat: ctx.lat, lng: ctx.lng, onSea: ctx.onSea, zoom: ctx.zoom,
                branch: ctx.branch, site: ctx.site, gapM: ctx.gapM,
                citiesWithin05: ctx.countCities(0.5),
                citiesWithin2: ctx.countCities(2),
                frame: MarchStutterProbe.frameBreakdown(),
            });
        };

        // ① 相机冻结后突跳
        if (camStep < 0.001) {
            this.freezeRun++;
        } else {
            if (this.freezeRun >= FREEZE_FRAMES && camStep >= FREEZE_JUMP_PX) {
                push('cameraFreezeJump', this.freezeRun);
            }
            this.freezeRun = 0;
        }
        // ② 军团屏幕位移突变
        if (median > 0.01 && unitStep >= SPIKE_MIN_PX && unitStep >= median * SPIKE_RATIO) {
            push('unitPositionSpike', this.freezeRun);
        }
        // ③ 掉帧
        if (frameMs >= LONG_FRAME_MS) push('longFrame', this.freezeRun);

        // 即使一次都没顿也照常上报：统计段能证明探针在跑、并给出分支占比基线
        if (this.frames > 0 && now - this.lastReportAt >= REPORT_INTERVAL_MS) {
            this.report();
            this.lastReportAt = now;
        }
    }

    /** 攒够一批就落盘（复用 /api/stuck-legion，不新增 vite 中间件——改 vite.config 会整页刷新） */
    private report(): void {
        const body = {
            probe: 'march-stutter',
            at: new Date().toISOString(),
            说明: '行军顿挫探针：kind=cameraFreezeJump 相机冻结后突跳 / unitPositionSpike 军团屏幕位移突变 / longFrame 掉帧',
            统计: { 采样帧数: this.frames, ...this.hits, 分支帧数: { ...this.branchCount }, 采样点帧数: { ...this.siteCount } },
            现场: this.events,
        };
        const hitsTotal = this.hits.cameraFreezeJump + this.hits.unitPositionSpike + this.hits.longFrame;
        this.events = [];
        this.frames = 0;
        this.hits = { cameraFreezeJump: 0, unitPositionSpike: 0, longFrame: 0 };
        this.branchCount = { deadzone: 0, snap: 0, lerp: 0 };
        this.siteCount = { main: 0, battleScene: 0 };
        void fetch('/api/stuck-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => { /* 诊断失败不影响玩法 */ });
        // 顿得够多 → 自动落一份 PerfDoctor（热点函数 where/fix + 长任务 + 缓存），窗口只含最近 20s
        const now = performance.now();
        if (hitsTotal >= AUTO_DUMP_MIN_HITS && now - this.lastDumpAt >= AUTO_DUMP_INTERVAL_MS) {
            this.lastDumpAt = now;
            void perfDoctor.dump({ trigger: 'march-stutter', 窗口统计: body.统计 }).catch(() => { /* 同上 */ });
        }
        perfDoctor.reset();
    }

    /** 主循环子系统分解（本帧已结束计时的段；未跑的为 0） */
    private static frameBreakdown(): Record<string, number> {
        const s = PerformanceMonitor.getInstance().getSnapshot();
        const r = (v: number) => +(v || 0).toFixed(1);
        return {
            ai: r(s.aiTime), combat: r(s.combatTime), legion: r(s.legionTime),
            historicalEvent: r(s.historicalEventTime), recruitment: r(s.recruitmentTime),
            combatUI: r(s.combatUITime), render: r(s.renderTime),
            lastFrameTotal: r(s.frameTime), fps: r(s.fps),
        };
    }
}

export const marchStutterProbe = new MarchStutterProbe();
