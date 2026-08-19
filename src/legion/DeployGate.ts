/**
 * 开局集结闸门 —— 首发军团在都城列阵待命，时间一到**全军同时拔营**。
 *
 * 为什么需要（2026-08-19 主人定）：
 *   原来首发是错峰生成（INITIAL_SPAWN_PER_TICK=1，每 200ms 一支），军团一出生就各自开拔，
 *   开局画面是「18 支军团先后冒出来、各走各的」，没有齐发的仪式感；而且跟随目标是在
 *   最后一支出完才选，前面十几支早就散到地图各处了。
 *   现在：全部生成 → 集结待命 → 选定跟随军团 → 同一时刻全军开拔。
 *
 * 🔴 计时必须走「游戏真正在跑的时间」，不能用 performance.now() 从生成起算。
 *   实测教训（2026-08-19，第一版就是这么写的，浏览器实测才发现）：
 *     **首发军团是在 boot 阶段生成的，那时游戏是暂停态**（采样 t=0 就已 18 支、暂停:Y）。
 *     用真实时间从生成起算 → 主人还没点「播放」，5 秒就已经走完，集结从未发生过。
 *   所以闸门由 LegionManager.update（只在游戏运行时被调用）驱动，且只在 deltaTime>0 时推进；
 *   计的是**真实秒**而非游戏秒 —— 5 秒指的是观众看到的 5 秒，与 2×/5× 倍速无关。
 *
 * 🔴 只闸「移动」，不闸生成、不闸战斗、不闸渲染：
 *   闸生成会让军团一支支冒出来（正是要治的病）；闸战斗会在开局遭遇战时把引擎冻住。
 *   闸门到点即开，且有 MAX_STEP_MS 兜底防跳变，不存在卡死通道。
 */

/** 剩余集结时间（ms）；≤0 = 没有闸门 */
let remainingMs = 0;
/** 上一次 tick 的墙钟时刻 */
let lastTickAt = 0;
/** 放行时执行一次的回调（选跟随军团） */
let onRelease: (() => void) | null = null;
/** 单次 tick 最多推进多少（防标签页切走/长卡顿后一次跳完） */
const MAX_STEP_MS = 250;

/** 起闸：集结 ms 毫秒（按游戏运行时间计）。release 在放行时执行一次。 */
export function armDeploy(ms: number, release?: () => void): void {
    if (ms <= 0) {
        release?.();
        return;
    }
    remainingMs = ms;
    lastTickAt = 0;
    onRelease = release ?? null;
}

/**
 * 推进闸门 —— 只许 LegionManager.update 在 deltaTime>0 时调用（= 游戏确实在跑）。
 * 到点触发一次 onRelease 并自动失效。
 */
export function tickDeploy(): void {
    if (remainingMs <= 0) return;
    const now = performance.now();
    if (lastTickAt === 0) { lastTickAt = now; return; }   // 首帧只对表，不计时
    remainingMs -= Math.min(MAX_STEP_MS, now - lastTickAt);
    lastTickAt = now;
    if (remainingMs <= 0) {
        remainingMs = 0;
        const cb = onRelease;
        onRelease = null;
        cb?.();
    }
}

/** 立刻放行（读档、跳过开局演出等场景）。不触发 onRelease。 */
export function releaseDeploy(): void {
    remainingMs = 0;
    onRelease = null;
}

/** 当前是否处于集结待命期 */
export function isDeployHeld(): boolean {
    return remainingMs > 0;
}

/** 距离拔营还剩多少毫秒（0 = 已拔营）。供 UI 倒计时用。 */
export function deployHoldRemainingMs(): number {
    return Math.max(0, remainingMs);
}
