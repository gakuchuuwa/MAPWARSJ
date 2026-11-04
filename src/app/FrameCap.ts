/**
 * 全局限帧（2026-11-04 主人报「项目一运行机箱就响，风扇一直疯狂转」）。
 *
 * 实测（scratch/_probe_fan_load_20261104.mjs）：页面里 12 条独立 rAF 循环每帧都跑，
 * 十几张整屏画布每帧都要合成，主线程战略 87% / 战术 96% 在忙 —— 一个核和显卡一直满载。
 * 各循环都按真实经过的时间推进（GameAppLoop 的 deltaTime、13 的 dt），所以在 rAF 这一层
 * 统一隔帧放行，所有循环一起降到 FRAME_CAP_FPS，行军和动画速度不变，只是每秒少画一半。
 * 13 的战斗步进另在 Scene13WarLayer.stepSubdivided 拆成 1/60 秒小步，结算与 60 帧一致。
 *
 * 想恢复满帧：把 FRAME_CAP_FPS 改成 0（运行中也可在控制台 `mapwarSetFrameCap(0)`，传 30 再开）。
 */
export const FRAME_CAP_FPS = 30;

export function installFrameCap(): void {
    if (!(FRAME_CAP_FPS > 0) || typeof window === 'undefined') return;
    const w = window as unknown as { __mapwarFrameCapFps?: number; mapwarSetFrameCap?: (fps: number) => void };
    if (w.mapwarSetFrameCap) return;
    w.__mapwarFrameCapFps = FRAME_CAP_FPS;

    const nativeRaf = window.requestAnimationFrame.bind(window);
    // 留 2ms 余量：vsync 间隔有抖动，严格按 33.3ms 判会偶尔多等一整帧
    let minGapMs = 1000 / FRAME_CAP_FPS - 2;
    w.mapwarSetFrameCap = (fps: number): void => {
        w.__mapwarFrameCapFps = fps > 0 ? fps : undefined;
        minGapMs = fps > 0 ? 1000 / fps - 2 : 0;
    };
    let queue = new Map<number, FrameRequestCallback>();
    let nextId = 1;
    let scheduled = false;
    let lastFlush = -Infinity;

    const pump = (t: number): void => {
        if (t - lastFlush < minGapMs) { nativeRaf(pump); return; }
        scheduled = false;
        lastFlush = t;
        const run = queue;
        queue = new Map();
        for (const cb of run.values()) {
            // 一个循环抛错不许拖垮别的循环；异步重抛，照样走全局未捕获错误出口
            try { cb(t); } catch (e) { setTimeout(() => { throw e; }); }
        }
    };

    window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
        const id = nextId++;
        queue.set(id, cb);
        if (!scheduled) { scheduled = true; nativeRaf(pump); }
        return id;
    };
    window.cancelAnimationFrame = (id: number): void => { queue.delete(id); };
}

// 必须在 leaflet 之前生效：Leaflet 在模块加载时就把 requestAnimationFrame 存成自己的引用，
// 晚装它的缩放/平移动画会绕过限帧。main.ts 第一行 import 本文件即可。
installFrameCap();
