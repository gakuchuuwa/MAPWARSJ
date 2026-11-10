/**
 * 据点建筑图「去位移变换」。
 *
 * 🔴 [2026-11-10 修「战略地图移动掉帧」] 据点里每栋建筑图都是
 *    `left:50%;top:50%;transform:translate(calc(-50% + Xpx), calc(-50% + Ypx - 15%))` 这样居中的——
 *    一个据点约 44 张、一屏约 2700 张，每张都是浏览器里一个独立的变换节点。镜头每动一帧，
 *    浏览器整理图层时要把它们逐个重算（内存明细里累计出 68 万个 GeometryMapperTransformCache 对象）。
 *    真显卡时间线实测：把纯位移的那部分换成等价的 left/top 定位后，Layerize 每帧约 6.2 → 4.3ms。
 *
 * 做法：图片加载完（高度才确定，百分比才算得出）后，读出它实际的位移像素，改写成 left/top，画面位置不变。
 *      带左右翻转（scaleX(-1)）的图不是纯位移，保持原样。
 *      只处理战略地图上据点 / 遗迹 / 古战场三个图层里的图，不碰生成 HTML 的那二十几处代码。
 *
 * DEV 对照：`window.__cityImgFlatten(false)` 还原并停用，`(true)` 重新启用。
 */
import type L from 'leaflet';

const PANE_SELECTOR = '.leaflet-city-pane, .leaflet-monument-pane, .leaflet-battlefield-pane';
const DONE = 'data-flat';

let started = false;
let enabled = true;
let queue: HTMLImageElement[] = [];
let scheduled = false;

function flush(): void {
    scheduled = false;
    const batch = queue;
    queue = [];
    if (!enabled) return;
    // 先全部读（读变换会触发一次排版），再全部写，避免读写交替反复排版
    const jobs: Array<{ img: HTMLImageElement; x: number; y: number }> = [];
    for (const img of batch) {
        if (!img.isConnected || img.hasAttribute(DONE) || !img.complete || img.naturalWidth === 0) continue;
        // 只认「绝对定位 + 明写了 left/top」的图：没写 left/top 的图位置由排版决定，换算不出等价值
        if (img.style.position !== 'absolute' || !img.style.transform || !img.style.left || !img.style.top) continue;
        const t = getComputedStyle(img).transform;
        if (!t || t === 'none') continue;
        const m = new DOMMatrixReadOnly(t);
        if (m.a !== 1 || m.d !== 1 || m.b !== 0 || m.c !== 0) continue;   // 带翻转/缩放：不是纯位移，不动
        jobs.push({ img, x: m.e, y: m.f });
    }
    for (const { img, x, y } of jobs) {
        img.setAttribute(DONE, img.getAttribute('style') ?? '');
        img.style.left = `calc(${img.style.left || '0px'} + ${x.toFixed(2)}px)`;
        img.style.top = `calc(${img.style.top || '0px'} + ${y.toFixed(2)}px)`;
        img.style.transform = 'none';
    }
}

function enqueue(img: HTMLImageElement): void {
    queue.push(img);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
}

export function startCityImgFlatten(map: L.Map): void {
    if (started) return;
    started = true;
    const root = map.getPane('mapPane');
    if (!root) return;
    // load 不冒泡，用捕获阶段在地图根上统一接
    root.addEventListener('load', (ev) => {
        if (!enabled) return;
        const el = ev.target;
        if (el instanceof HTMLImageElement && el.closest(PANE_SELECTOR)) enqueue(el);
    }, true);
    const sweep = (): void => {
        for (const el of root.querySelectorAll<HTMLImageElement>(PANE_SELECTOR.split(', ').map((s) => `${s} img`).join(', '))) {
            if (!el.hasAttribute(DONE)) enqueue(el);
        }
    };
    sweep();
    if (import.meta.env.DEV) {
        (window as unknown as { __cityImgFlatten?: (on: boolean) => void }).__cityImgFlatten = (on: boolean) => {
            enabled = on;
            if (on) { sweep(); return; }
            for (const el of root.querySelectorAll<HTMLImageElement>(`img[${DONE}]`)) {
                el.setAttribute('style', el.getAttribute(DONE) ?? '');
                el.removeAttribute(DONE);
            }
        };
    }
}
