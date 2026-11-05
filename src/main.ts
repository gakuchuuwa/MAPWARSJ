import 'leaflet/dist/leaflet.css';
import '../style.css';
import './ui/map-hud-theme.css';
import { GameApp } from './app/GameApp';
import {
    isGameAppBooted,
    showGameAppErrorOverlay,
    showGameAppRuntimeErrorBadge,
} from './app/boot/GameAppBootUtils';
import { registerMapwarWebMcpTools } from './webmcp/registerMapwarTools';
import { startQuickBattleMode } from './quickbattle/QuickBattle';

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

/**
 * 全局未捕获错误的出口。
 * 🔴 [2026-10-27 主人批准] 启动阶段的错照旧整屏「游戏加载失败」；启动完成后遇到的小错不再整屏黑框，
 *    只在左下角显示一小行（方便截图），详细堆栈仍在控制台。
 */
function reportUncaughtError(err: unknown): void {
    if (!isGameAppBooted()) {
        showBootError(err);
        return;
    }
    console.error('[MAPWAR] 启动完成后的未捕获错误（只在左下角提示，不整屏遮挡）:', err);
    try {
        showGameAppRuntimeErrorBadge(err);
    } catch {
        // 提示本身出错就不再追加：控制台里已有完整记录，别在错误处理里再引出新的错误
    }
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
    reportUncaughtError(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    if (isMetaMaskExtensionError(event.reason)) return;
    reportUncaughtError(event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new GameApp();
        (window as any).gameApp = app;
        void app.start()
            .then(() => registerMapwarWebMcpTools(app))
            .catch(showBootError);
        // 即时战斗：`/?quickbattle=1`（quick-battle.html 跳过来），单独开一场战术模式对战
        //    静态 import：与游戏本体共用同一份模块实例（动态 import 在热更新后可能拿到另一份）
        if (new URLSearchParams(location.search).has('quickbattle')) startQuickBattleMode(app);
    } catch (err) {
        showBootError(err);
    }
});
