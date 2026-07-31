/**
 * ReloadGate.ts —— 开发期整页刷新闸门（客户端上报侧，仅 DEV）
 *
 * 【2026-08-01 主人定】改文件后到底刷不刷新，由左下角「直播」按钮决定：
 *   直播开着（默认）→ 闸门关，改文件不整页刷新，免得炸掉正在播的画面；
 *   手动点关直播     → 闸门开，改文件立刻刷新，且直播关着期间积压的那一次会立即补上。
 *
 * 本模块只负责「把闸门状态告诉 dev server」，真正的拦截在 vite.config.ts 的
 * suppress-portrait-dev-hmr 插件里（那里才拿得到 ws.send）。
 *
 * 为什么要心跳而不是只在状态变化时上报一次：
 *   页面关掉 / 崩了 / 换了标签页之后，dev server 无从知道浏览器已经不在了。
 *   若闸门是「一次性关上」，那之后 dev server 会永远拒绝刷新。所以改成续期式：
 *   每 5 秒续一次，超过 15 秒没续期，服务端自动把闸门打开。
 *
 * 生产构建不会包含本模块：唯一的引用点在 GameApp 的 import.meta.env.DEV 分支内，
 * 走动态 import，Rollup 会整块剔除。
 */
import { DEV_AUTOREFRESH_KEY } from '../ui/StreamModeToggle';

const ENDPOINT = '/__dev/reload-gate';
const HEARTBEAT_MS = 5_000;

/** 主人是否手动关掉了直播（= 允许自动刷新） */
function autoRefreshAllowed(): boolean {
    try {
        return localStorage.getItem(DEV_AUTOREFRESH_KEY) === '1';
    } catch {
        // localStorage 被禁用时按「允许刷新」处理：宁可多刷一次，也别把闸门永久焊死
        return true;
    }
}

function report(): void {
    void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block: !autoRefreshAllowed() }),
        keepalive: true,
    }).catch(() => {
        /* dev server 正在重启或已关闭，忽略即可——服务端 15 秒后自动开闸 */
    });
}

export function initReloadGate(): void {
    report();
    window.setInterval(report, HEARTBEAT_MS);
    // 点「直播」按钮后立刻上报，不必等下一次心跳
    window.addEventListener('stream-mode-change', report);
}
