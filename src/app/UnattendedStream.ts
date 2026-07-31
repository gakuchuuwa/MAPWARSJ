/**
 * UnattendedStream.ts — 直播自动接管（两种触发）
 *
 * ① 边修边播恢复：上次处于直播态（StreamModeToggle 存 localStorage）→ 刷新后仅自动重新开播，
 *    不开一统/每日刷新循环（免得开发中被自动整页刷新打断）。解决「刷新忘点直播被当挂机」。
 * ② 无人值守云机（URL 带 ?stream=1）：完整链路——
 *
 * 云机 24 小时直播链路（全程无人点击）：
 *   1. 开机自启：启动落定后自动走「直播」按钮的一键链路
 *      （进直播模式 + 开始推演 + 初始刷兵 + 拉镜头 + 打开跟拍列表）
 *   2. 一统天下检测：全图据点只剩一个势力并保持 5 分钟（给观众看结局）→ 整页刷新开新局
 *   3. 每日 04:00 低峰整页刷新兜底（防浏览器长跑内存缓涨）
 *
 * 刷新用 location.reload()：?stream=1 参数保留，刷新后本模块自动重新接管。
 */
import type { GameApp } from './GameApp';
import type { GameTimeHUD } from '../ui/GameTimeHUD';
import { StreamModeToggle, DEV_AUTOREFRESH_KEY } from '../ui/StreamModeToggle';
import { gameLog } from '../utils/GameLogger';

const AUTO_START_DELAY_MS = 10_000;
const CHECK_INTERVAL_MS = 60_000;
const UNIFIED_HOLD_MS = 5 * 60_000;
const DAILY_RELOAD_HOUR = 4;
const DAILY_RELOAD_MIN_UPTIME_MS = 2 * 3_600_000;

export function isUnattendedStream(): boolean {
    return new URLSearchParams(window.location.search).get('stream') === '1';
}

export function initUnattendedStream(app: GameApp, gameTimeHUD: GameTimeHUD): void {
    const unattended = isUnattendedStream();

    // 每次刷新自动开播（不再依赖 localStorage 残留）
    gameLog('startup', unattended
        ? '📺 [无人值守] ?stream=1 已激活：自动开播 + 一统重开 + 每日刷新'
        : '📺 [直播] 自动开播');
    window.setTimeout(() => autoStart(app, gameTimeHUD), AUTO_START_DELAY_MS);

    // 一统重开 / 每日刷新兜底：仅无人值守云机（?stream=1）启用；
    // 边修边播（localStorage 恢复）不启用，免得开发中被自动整页刷新打断。
    if (!unattended) return;

    const bootAt = Date.now();
    let unifiedSince = 0;
    window.setInterval(() => {
        const now = new Date();
        if (now.getHours() === DAILY_RELOAD_HOUR && Date.now() - bootAt >= DAILY_RELOAD_MIN_UPTIME_MS) {
            gameLog('world', '📺 [无人值守] 每日低峰刷新，重开新局');
            window.location.reload();
            return;
        }

        const factions = new Set<string>();
        for (const city of app.cityManager.getCities()) {
            if (city.factionId) factions.add(city.factionId);
            if (factions.size > 1) break;
        }
        if (factions.size === 1) {
            if (unifiedSince === 0) {
                unifiedSince = Date.now();
                gameLog('world', `👑 [无人值守] ${[...factions][0]} 一统天下，${UNIFIED_HOLD_MS / 60_000} 分钟后开新局`);
            } else if (Date.now() - unifiedSince >= UNIFIED_HOLD_MS) {
                window.location.reload();
            }
        } else {
            unifiedSince = 0;
        }
    }, CHECK_INTERVAL_MS);
}

function autoStart(app: GameApp, gameTimeHUD: GameTimeHUD): void {
    if (StreamModeToggle.isActive()) return;
    // 【2026-08-01 主人定】本机开发时若主人手动关掉了直播（= 要边改边看自动刷新），
    // 就别再 10 秒后把直播点回来，否则刷新闸门刚打开又被锁死。
    // 只对本机 dev 生效：云机 ?stream=1 与线上构建照旧无条件自动开播。
    if (import.meta.env.DEV
        && !isUnattendedStream()
        && localStorage.getItem(DEV_AUTOREFRESH_KEY) === '1') {
        gameLog('startup', '📺 [直播] 已手动关闭直播（自动刷新模式），跳过自动开播');
        return;
    }
    const btn = document.getElementById('stream-mode-btn');
    if (btn) {
        btn.click();
    } else {
        // 按钮缺失兜底：直接走播放链路（开局必为暂停态，toggle 即开始）
        const playing = app.historicalEventManager.togglePlayback();
        if (playing) app.recruitmentSystem.runInitialSpawn();
    }
    gameTimeHUD.setPlayingState(true);
    gameLog('startup', '📺 [无人值守] 已自动开播');
}
