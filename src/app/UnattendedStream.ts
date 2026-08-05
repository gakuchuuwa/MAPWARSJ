/**
 * UnattendedStream.ts — 直播自动接管（两种触发）
 *
 * ① 本机开发：刷新后【无条件】5 秒自动开播（不开一统/每日刷新循环，免得开发中被
 *    自动整页刷新打断）。解决「刷新忘点直播被当挂机」。要改东西就点暂停把推演停下，
 *    改文件立刻整页刷新（闸门看推演运行状态，见 src/dev/ReloadGate.ts）。
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
import { StreamModeToggle } from '../ui/StreamModeToggle';
import { gameLog } from '../utils/GameLogger';

const AUTO_START_DELAY_MS = 5_000;
const CHECK_INTERVAL_MS = 60_000;
const UNIFIED_HOLD_MS = 5 * 60_000;
const DAILY_RELOAD_HOUR = 4;
const DAILY_RELOAD_MIN_UPTIME_MS = 2 * 3_600_000;

export function isUnattendedStream(): boolean {
    return new URLSearchParams(window.location.search).get('stream') === '1';
}

export function initUnattendedStream(app: GameApp, gameTimeHUD: GameTimeHUD): void {
    const unattended = isUnattendedStream();

    gameLog('startup', unattended
        ? '📺 [无人值守] ?stream=1 已激活：自动开播 + 一统重开 + 每日刷新'
        : `📺 [直播] ${AUTO_START_DELAY_MS / 1000} 秒后自动开播`);
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
    // 【2026-08-01 主人定】刷新后【无条件】自动开播，不看刷新前是开是关：
    // 刷新完就该自己播起来，要停手点一下就行。这跟「改文件刷不刷新」是两件事 ——
    // 后者只看【推演当前在不在跑】（ReloadGate 读 TimeSystem 暂停位），跟本函数无关。
    if (StreamModeToggle.hasStarted()) return;

    // 一键链路（2026-08-05 分离后显式补全）：直播按钮已只管画面开关（不再隐式开播），
    // 这里显式完成「进直播画面 + 开始推演 + 初始刷兵 + 同步播放按钮」。
    StreamModeToggle.activate();
    const playing = app.historicalEventManager.togglePlayback();
    if (playing) app.recruitmentSystem?.runInitialSpawn();
    gameTimeHUD.setPlayingState(true);
    gameLog('startup', '📺 [无人值守] 已自动开播');
}
