import 'leaflet/dist/leaflet.css';
import '../style.css';
import './ui/map-hud-theme.css';
import { GameApp } from './app/GameApp';
import { showGameAppErrorOverlay } from './app/boot/GameAppBootUtils';
import { registerMapwarWebMcpTools } from './webmcp/registerMapwarTools';

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

// MetaMask 注入脚本的连接失败不代表游戏启动失败；仍保留浏览器原始错误日志。
function isMetaMaskExtensionError(error: unknown, filename = ''): boolean {
    if (!error || typeof error !== 'object') return false;
    const { message, stack } = error as { message?: unknown; stack?: unknown };
    if (message !== 'Failed to connect to MetaMask') return false;
    const firstFrame = typeof stack === 'string'
        ? stack.split('\n').find((line) => /^\s*at\s/.test(line)) ?? ''
        : '';
    return /^chrome-extension:\/\//.test(filename)
        || /^\s*at\s+(?:.*?\()?chrome-extension:\/\//.test(firstFrame);
}

window.addEventListener('error', (event) => {
    if (isMetaMaskExtensionError(event.error ?? { message: event.message }, event.filename)) return;
    showBootError(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    if (isMetaMaskExtensionError(event.reason)) return;
    showBootError(event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new GameApp();
        (window as any).gameApp = app;
        void app.start()
            .then(() => registerMapwarWebMcpTools(app))
            .catch(showBootError);
    } catch (err) {
        showBootError(err);
    }
});
