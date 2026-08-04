/**
 * ReloadGate.ts —— 开发期整页刷新闸门（客户端上报侧，仅 DEV）
 *
 * 【2026-08-03 主人定】改文件后到底刷不刷新，由【推演是否正在运行】决定：
 *   推演在跑（点了播放且没暂停）→ 闸门关：游戏在跑说明可能正在直播，
 *                                  整页刷新会搅乱直播画面；
 *   推演没在跑（未开播 / 已暂停）→ 说明主人正在修游戏，闸门开，改文件立刻刷新，
 *                                  且闸门关着期间积压的那一次会立即补上。
 * （08-01 曾错按左下角「直播」按钮判定——那只是画面开关，不代表游戏在不在跑，已废。）
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

const ENDPOINT = '/__dev/reload-gate';
const HEARTBEAT_MS = 5_000;

function shouldBlock(): boolean {
    const timeSystem = (window as any).game?.timeSystem;
    const running = timeSystem ? !timeSystem.isGamePaused() : false;
    // F2 立绘校正打开时强制闸门关：校正需暂停推演，若按「暂停=可刷新」会让整页刷新打断校正
    const correctorOpen = (window as any).__portraitCorrectorOpen === true;
    return running || correctorOpen;
}

/**
 * 本页面实例是否还没上报过。
 *
 * [2026-08-04 修] 首次上报要带 fresh=true，让服务端把闸门关闭期间积压的那次整页刷新丢掉：
 * 积压的刷新是「让页面拿到最新代码」，而新页面本来就是从磁盘读的最新代码——补发给它纯属
 * 白烧一次启动（本项目一次启动 10~80s）。实测症状即「刚进入地图就又重启一次」，
 * 启动打点 scratch/boot_timing_log.jsonl 里表现为连着 2~3 次、间隔≈一次启动耗时。
 */
let firstReport = true;

function report(): void {
    const fresh = firstReport;
    firstReport = false;
    void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block: shouldBlock(), fresh }),
        keepalive: true,
    }).catch(() => {
        /* dev server 正在重启或已关闭，忽略即可——服务端 15 秒后自动开闸 */
    });
}

export function initReloadGate(): void {
    report();
    // 播放/暂停一切换就立刻上报，不必等下一次心跳。
    // timeSystem 可能晚于本模块就绪：没等到就先靠心跳兜着，等到了再挂钩。
    let hooked = false;
    const tryHookPauseChange = (): void => {
        if (hooked) return;
        const timeSystem = (window as any).game?.timeSystem;
        if (timeSystem?.onPauseChange) {
            hooked = true;
            timeSystem.onPauseChange(() => report());
        }
    };
    tryHookPauseChange();
    // F2 校正器关闭后主动补报一次（若恢复后的暂停状态与打开前相同，setPaused 不触发 onPauseChange）
    window.addEventListener('reload-gate-ping', () => report());
    window.setInterval(() => {
        tryHookPauseChange();
        report();
    }, HEARTBEAT_MS);
}
