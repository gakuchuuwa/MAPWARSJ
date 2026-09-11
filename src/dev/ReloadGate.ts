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
    // [2026-08-10 13 独立时钟] 13 战术层期间 timeSystem 是**暂停**的（大战略冻结），
    // 但战斗正在打、观众正在看 —— 按「暂停=可刷新」会在每场双将战开打时放行整页刷新，
    // 直播看到一半被刷掉。战术层激活 = 照样算「在跑」。
    const inBattleScene = (window as any).game?.battleScene?.isActive?.() === true;
    const running = inBattleScene || (timeSystem ? !timeSystem.isGamePaused() : false);
    // F2 立绘校正打开时强制闸门关：校正需暂停推演，若按「暂停=可刷新」会让整页刷新打断校正
    const correctorOpen = (window as any).__portraitCorrectorOpen === true;
    // 🔴 [2026-09-11 修「玩家一到接任务那里游戏就重启」] 玩家任务对话框同理：
    //    它为了让主人看清而自己 setPaused(true)，那是**功能要的暂停**，不是「主人在修游戏」的信号。
    //    不挡的话，本局期间只要动过任何 src 文件，一弹对话就会被补发的整页刷新刷掉（必现）。
    //    判据必须是「有没有别的东西正占着暂停」，不能只看 isGamePaused —— 以后再有这种
    //    自己暂停推演的玩法功能（结算面板、剧情演出等），照样加到这一行来。
    //    ⚠️ 用 DOM 存在性而不是全局布尔：布尔要靠关闭路径去清，任何一条漏清（异常、切场景、
    //       直接 remove 节点）都会把闸门**永久焊死**，主人改文件再也刷不出来。对话框节点一没，
    //       这个判据自动失效，不存在卡住的状态。
    const dialogueOpen = document.getElementById('player-dialogue-overlay') !== null;
    return running || correctorOpen || dialogueOpen;
}

/**
 * 本页面的加载时刻（epoch ms）。
 *
 * [2026-08-17 改] 每次上报都带上它，服务端拿它跟「最近一次本该整页刷新的时刻」比：
 *   磁盘代码比本页新 → 开闸时补刷；本页更新 → 一定不刷。
 * 取代 08-04 的 fresh 标志与 08-10 的看门狗（那两处都是在给「布尔积压队列」打补丁：
 * 队列既会把该刷的丢掉——心跳被后台节流后闸门提前到期即丢——也会把过期刷新补给新页面）。
 * 用 performance.timeOrigin 而不是模块加载时刻：模块可能晚于页面几秒才被动态 import 进来。
 */
const PAGE_LOADED_AT = Math.round(performance.timeOrigin || (Date.now() - performance.now()));

function report(): void {
    void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block: shouldBlock(), loadedAt: PAGE_LOADED_AT }),
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
    // [2026-08-17] 页面被编辑器盖住 / 最小化时，Chrome 把 setInterval 压到 ~1 次/分，
    // 5 秒心跳会断档。回到前台立刻补报一次：既及时续上闸门，也让「暂停期间改的文件」马上刷。
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) report();
    });
    window.addEventListener('focus', () => report());
    window.setInterval(() => {
        tryHookPauseChange();
        report();
    }, HEARTBEAT_MS);
}
