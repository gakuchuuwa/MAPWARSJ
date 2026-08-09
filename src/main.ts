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
    } catch (err) {
        showBootError(err);
    }
});
