/**
 * 据点旗帜飘动的统一时钟（2026-11-10 主人令「平时战略地图移动，掉帧优化」）。
 *
 * 原来：`style.css` 里 `.city-flag-body { animation: cityFlagWave 0.6s steps(1) infinite }`，
 * 每面旗（旗面 + 旗号文字两个元素）各跑一个 CSS 动画。`background-position` 动画只能在主线程跑，
 * 虽然画面每 150ms 才换一帧，浏览器却**每一帧**都要给每面旗重算一遍样式——
 * 有头浏览器实测（跟拍 6 秒）：因动画触发的旗帜样式重算 2.6 万次，样式重算合计 509ms（约 1.3ms/帧），
 * 连带每帧重画 / 重新分层。地图层里走过的据点都还在，屏幕外的旗也照算。
 *
 * 现在：全图共用一条样式规则，每 150ms 换一次帧（4 帧一循环，同原动画的 0 / -44.8 / -89.6 / -134.4px），
 * 浏览器只在换帧那一刻给旗帜重算样式。帧序号按 `Date.now()` 取，与军团旗（LegionFlagDrawer）同一个钟，
 * 旗面和旗号文字也因此永远同帧（原来各自从创建时刻起算，会错开）。
 * 差别：所有据点旗同步换帧（原来各旗相位随创建时间错开）。
 */
const FRAME_MS = 150;
const FRAMES = 4;
/** 单帧宽：精灵 32px × 旗帜缩放 1.4（与 TerritorySystem 里的 flagScale、原 cityFlagWave 关键帧一致） */
const FRAME_W_PX = 44.8;

let started = false;

export function startCityFlagWave(): void {
    if (started || typeof document === 'undefined') return;
    started = true;
    const st = document.createElement('style');
    st.id = 'city-flag-wave-clock';
    // !important：旗帜元素的内联样式里写着 background-position-x: 0（原来靠动画压过内联）
    st.textContent = '.city-flag-body{background-position-x:0px !important}';
    document.head.appendChild(st);
    const rule = st.sheet?.cssRules[0] as CSSStyleRule | undefined;
    if (!rule) return;

    let last = 0;
    const tick = (): void => {
        const now = Date.now();
        // 战略地图被战术画面盖住时不换帧（回来后下一拍自然对上）
        const hidden = document.getElementById('map')?.style.visibility === 'hidden';
        if (!hidden) {
            const f = Math.floor(now / FRAME_MS) % FRAMES;
            if (f !== last) {
                last = f;
                rule.style.setProperty('background-position-x', `${-f * FRAME_W_PX}px`, 'important');
            }
        }
        setTimeout(tick, FRAME_MS - (now % FRAME_MS) + 1);
    };
    tick();
}
