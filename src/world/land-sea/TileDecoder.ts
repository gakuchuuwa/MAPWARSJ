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
