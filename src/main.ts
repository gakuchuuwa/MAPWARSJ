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

        // ⚠️ [P1a 临时验证] ?micro=1 → 自动开微观模式并飞到 zoom 13（看 9×9 大方阵效果，验证完删除）
        if (new URLSearchParams(location.search).get('micro') === '1') {
            setTimeout(() => {
                (window as any).__microForce = true;
                setTimeout(() => {
                    try {
                        (window as any).gameMap?.getLeafletMap?.()?.setView([34.27, 108.93], 13, { animate: true });
                    } catch { /* 游戏未就绪则忽略 */ }
                }, 4000);
            }, 6000);
        }
    } catch (err) {
        showBootError(err);
    }
});
