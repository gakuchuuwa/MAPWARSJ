import 'leaflet/dist/leaflet.css';
import '../style.css';
import { GameApp } from './app/GameApp';
import { showGameAppErrorOverlay } from './app/boot/GameAppBootUtils';

if (import.meta.env.DEV) {
    import('./debug/perfEarly');
}

if (import.meta.env.PROD) {
    document.body.classList.add('mapwar-deploy');
}

function showBootError(err: unknown): void {
    console.error('[MAPWAR] 启动失败:', err);
    const msg =
        err instanceof Error
            ? `${err.message}${err.stack ? `\n\n${err.stack}` : ''}`
            : String(err);
    showGameAppErrorOverlay(msg);
}

window.addEventListener('error', (event) => {
    showBootError(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    showBootError(event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new GameApp();
        (window as any).gameApp = app;
        void app.start().catch(showBootError);

        // ⚠️ [P1a 临时验证] ?micro=1 → 强制微观模式并锁定 zoom 13（看 9×9 大方阵效果，验证完删除）
        //
        // 【2026-08-09 修】原写法取 `window.gameMap`，而这个全局**全项目从未赋值**
        // （只有 GameApp.ts:133 的 window.game 和上面的 window.gameApp）。
        // `win.gameMap?.getLeafletMap?.()` 被可选链静默短路成 undefined，
        // try/catch 也捕不到（根本没抛错）——这就是开关一直不生效、缩放上不去 13 的原因。
        // 现直接用局部 app 引用，不绕 window 全局；拿不到就重试并打日志，绝不静默吞。
        if (new URLSearchParams(location.search).get('micro') === '1') {
            const MICRO_ZOOM = 13;
            const win = window as any;
            win.__microForce = true;

            let mapReady = false;
            let zcOff = false;
            let tries = 0;

            const tick = (): void => {
                tries += 1;
                const leaflet = app.map?.getLeafletMap?.();
                if (!leaflet) {
                    if (tries % 10 === 0) console.warn(`[micro] 等待地图就绪…（第 ${tries} 次）`);
                    return;
                }
                if (!mapReady) {
                    mapReady = true;
                    console.info(`[micro] 地图就绪，锁定 zoom ${MICRO_ZOOM}；停止请执行 __microStop()`);
                }
                // ZoomController 可能晚于地图创建：拿到才关，拿不到下一轮再试
                if (!zcOff && app.zoomController) {
                    app.zoomController.enabled = false;
                    zcOff = true;
                    console.info('[micro] 已关闭 ZoomController 自动缩放');
                }
                if (leaflet.getZoom() < MICRO_ZOOM) {
                    leaflet.setView(leaflet.getCenter(), MICRO_ZOOM, { animate: false });
                }
            };

            const timer = window.setInterval(tick, 1000);
            win.__microStop = (): void => {
                window.clearInterval(timer);
                console.info('[micro] 已停止锁定');
            };
            window.setTimeout(tick, 1500);
        }
    } catch (err) {
        showBootError(err);
    }
});
