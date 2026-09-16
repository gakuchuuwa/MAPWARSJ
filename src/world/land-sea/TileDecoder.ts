/**
 * 瓦片解码：图片 → RGBA 字节。三个采样器（海拔 / 水域掩膜 / 影像）共用这一份。
 *
 * 🔴 [2026-09-05 修「玩家移动时战略画面卡」] 这个模块是从三处**各写一遍**的解码代码收口来的，
 *    收口的目的只有两个，都是实测定位到的开销：
 *
 * ① **`willReadFrequently: true` 必须带**。`ElevationSampler` 与 `ImagerySampler` 原来是裸的
 *    `getContext('2d')`：浏览器把画布放在 GPU 上，每次 `getImageData` 都要一次 GPU→CPU 同步回读。
 *    CPU Profile 实测（12 秒采样，玩家移动中）：`getImageData` 独占 **50% CPU**，其中
 *    `ElevationSampler.ensureTile` 一家就 **4287ms（36%）**。
 *    同一个坑项目里踩过一次 —— SpriteTinter 漏这个标志让 13 开场卡 12.8 秒，补上快 9.4 倍。
 *
 * ② **画布复用**。原来每块瓦片 `document.createElement('canvas')` 新建一张 256×256，
 *    快速移动时一次视口预取就是上百张一次性画布（各带一份 GPU 纹理），纯粹的分配与回收压力。
 *
 * 为什么这条路径在「玩家移动」时才浮出水面：跟拍镜头每帧 `panBy`，Leaflet 每次都 fire `moveend`，
 * 而 `LandSeaSystem.bindLeafletMap` 在 `moveend` 上挂着**整个视口的瓦片预取**。
 * 玩家速度是军团的 1.5 倍，镜头扫过的新瓦片自然成倍增长。
 */

/** 复用画布：按需扩到最大请求尺寸，不再逐瓦片新建（见文件头 ②） */
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getCtx(size: number): CanvasRenderingContext2D | null {
    if (!sharedCanvas) {
        sharedCanvas = document.createElement('canvas');
        sharedCanvas.width = size;
        sharedCanvas.height = size;
        // 🔴 这个标志是本模块存在的理由，别在重构时顺手删掉（见文件头 ①）
        sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
    } else if (sharedCanvas.width < size || sharedCanvas.height < size) {
        // 扩容会重置画布内容，无所谓：每次解码前本来就要清一遍
        sharedCanvas.width = Math.max(sharedCanvas.width, size);
        sharedCanvas.height = Math.max(sharedCanvas.height, size);
        sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
    }
    return sharedCtx;
}

/**
 * 把瓦片图解码成 `size × size` 的 RGBA 字节。失败返回 null。
 *
 * 复用画布 → 必须先清：瓦片理论上不透明、能整块覆盖，但坏图/尺寸不符时会露出上一块的残留，
 * 那种脏数据在海陆判定里会变成「凭空的陆地」，比多一次 clearRect 贵得多。
 */
export function decodeTileRGBA(img: CanvasImageSource, size: number): Uint8ClampedArray | null {
    const ctx = getCtx(size);
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return ctx.getImageData(0, 0, size, size).data;
}

/**
 * 🔴 [2026-09-16 修「玩家骑马一顿一顿」] 瓦片解码的**逐帧预算队列**。
 *
 * 病灶：解码本身已经不贵（willReadFrequently + 共享画布，见上），贵的是**到达时刻扎堆**。
 * 一次 `prefetchBounds` 会发出整屏（zoom9 约 130 块 × 两个采样器）的请求，
 * 它们的 `img.onload` 在网络回来那一瞬间集中排进同一帧，每块「getImageData 256×256
 * ＋ 逐像素建掩膜」约 2~3ms —— 十块挤在一帧就是 25ms+ 的整帧冻结。
 * CPU Profile 实测（zoom9 骑马 20 秒，scratch/probe_player_cpuprofile.mjs）：
 *   getImageData@WaterMaskSampler.ensureTile 749ms + buildWaterMask 336ms + 海拔瓦片 129ms
 *   ≈ 全窗口 6%，且全部集中在少数几帧里。
 * 玩家骑马比军团快，单位时间跨过的新瓦片成倍增长，所以「骑马时才一顿一顿」。
 *
 * 解法：解码不再在 onload 里直接做，而是排进本队列，每帧最多花 `FRAME_BUDGET_MS`。
 * 瓦片因此可能晚一两帧才可用 —— 这在设计上本来就允许：`isWaterSync` / `getElevationSync`
 * 查不到瓦片时返回 null，调用方回退海拔判据或下一帧再判，从来不是同步阻塞等它。
 *
 * ⚠️ 泵必须双驱动：rAF 在标签页隐藏时**不跑**（项目里已被旗号文字队列踩过一次），
 * 所以再挂一个 setTimeout 兜底，隐藏时仍以低频把队列排空。
 */
const FRAME_BUDGET_MS = 6;
/** 隐藏标签页里 rAF 不跑，用它兜底把队列抽干 */
const FALLBACK_PUMP_MS = 200;

type DecodeJob = () => void;

const jobQueue: DecodeJob[] = [];
let rafHandle: number | null = null;
let timerHandle: ReturnType<typeof setTimeout> | null = null;

function clearPumpHandles(): void {
    if (rafHandle !== null) { cancelAnimationFrame(rafHandle); rafHandle = null; }
    if (timerHandle !== null) { clearTimeout(timerHandle); timerHandle = null; }
}

function pump(): void {
    clearPumpHandles();
    const t0 = performance.now();
    while (jobQueue.length > 0) {
        jobQueue.shift()!();
        if (performance.now() - t0 >= FRAME_BUDGET_MS) break;
    }
    if (jobQueue.length > 0) schedulePump();
}

function schedulePump(): void {
    if (rafHandle !== null || timerHandle !== null) return;
    rafHandle = requestAnimationFrame(() => pump());
    timerHandle = setTimeout(() => pump(), FALLBACK_PUMP_MS);
}

/**
 * 把一段瓦片解码工作排进逐帧预算队列，返回它的结果。
 * 任务本身不切片（单块 2~3ms 远低于预算），队列只保证**一帧内不超预算**。
 */
export function decodeOnFrameBudget<T>(job: () => T): Promise<T> {
    // DEV 量具：把每次解码的耗时累加到 window.__tileDecodeMs，探针每帧读一次并清零，
    // 就得到「每帧花在瓦片解码上的毫秒数」—— 摊平与否看的就是这条曲线的峰值。
    // `__tileDecodeNoBudget = true` 退回改前行为（onload 里同步解），用于同一次运行内 A/B 对比。
    const measured = import.meta.env.DEV
        ? (): T => {
            const t0 = performance.now();
            try { return job(); } finally {
                const w = window as unknown as { __tileDecodeMs?: number };
                w.__tileDecodeMs = (w.__tileDecodeMs ?? 0) + (performance.now() - t0);
            }
        }
        : job;
    if (import.meta.env.DEV && (window as unknown as { __tileDecodeNoBudget?: boolean }).__tileDecodeNoBudget) {
        return Promise.resolve(measured());
    }
    return new Promise<T>((resolve, reject) => {
        jobQueue.push(() => {
            try { resolve(measured()); } catch (err) { reject(err); }
        });
        schedulePump();
    });
}

/** 队列深度（诊断用；探针读它判断是不是积压） */
export function pendingTileDecodeJobs(): number {
    return jobQueue.length;
}
