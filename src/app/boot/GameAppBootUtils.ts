import { gameLog } from '../../utils/GameLogger';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** 启动批次之间让出主线程，避免首屏卡死（后台标签不节流）。 */
export function yieldToBrowser(): Promise<void> {
    if (document.hidden) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/** 心跳间隔（毫秒）。rAF 被节流/停止时，setInterval 补刀推进游戏逻辑。 */
const BACKGROUND_TICK_INTERVAL_MS = 200;
/**
 * rAF 超过此时长未更新 lastFrameTime，判定为被浏览器节流/停止。
 *
 * 🔴 [2026-09-05 修「人物移动一顿一顿」100 → 500] 100ms 等于「帧率一掉到 10fps 以下就判定 rAF 停了」，
 *    而本作卡顿时（战略地图跟拍、进 13、大批精灵）帧率**经常**低于 10fps —— 于是心跳与 rAF
 *    互相插队、互相覆写 lastFrameTime，rAF 那一拍算出负 delta 被整段丢弃（详见 GameAppLoop
 *    的 clampFrameDelta）。实测 11fps 下 80 帧里 60 帧位移为 0。
 *    500ms ≈ 2fps 才判定停止：真正的 tab 隐藏/最小化时 rAF 是**完全停止**的，age 会一路涨到
 *    任何阈值以上，最多晚半秒接管，对后台推演没有影响；而正常的低帧率不再被误判。
 */
const BACKGROUND_TICK_THRESHOLD_MS = 500;

/**
 * 启动全程运行的后台心跳：
 *   - rAF 正常时（tab 可见、窗口在前）：lastFrameTime 每帧刷新，心跳跳过。
 *   - rAF 被节流时（切 tab、最小化、被其他窗口遮挡）：心跳接管推进游戏逻辑。
 *
 * 注意：tickLogicFn 内部**不得**调用 requestAnimationFrame，
 * 否则 tab 恢复时积压的回调会同帧爆发，导致双重推进。
 */
export function setupGameAppBackgroundHeartbeat(
    getLastFrameAge: () => number,
    tickLogicFn: (timestamp: number) => void,
): void {
    setInterval(() => {
        if (getLastFrameAge() > BACKGROUND_TICK_THRESHOLD_MS) {
            tickLogicFn(performance.now());
        }
    }, BACKGROUND_TICK_INTERVAL_MS);
}

export function setupGameAppVisibilityHandler(resetFrameTime: () => void): void {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // tab 恢复：重置帧时间，防止 rAF 重启时算出过大的 delta
            resetFrameTime();
            gameLog('startup', '👁️ [GameApp] Tab visible — resetting frame time');
        } else {
            gameLog('startup', '🙈 [GameApp] Tab hidden — heartbeat will keep logic running');
        }
    });
}

export function showGameAppErrorOverlay(message: string): void {
    hideLoadingOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'game-error-overlay';
    overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 99999; color: #fff;
        `;
    overlay.innerHTML = `
            <h1 style="color: #ff5722; margin-bottom: 20px;">❌ 游戏加载失败</h1>
            <pre style="color: #ccc; max-width: 90vw; max-height: 50vh; overflow: auto; text-align: left; font-size: 12px; white-space: pre-wrap; word-break: break-word; background: rgba(255,255,255,0.06); padding: 12px 16px; border-radius: 6px;">${escapeHtml(message)}</pre>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 30px; cursor: pointer;">重试</button>
        `;
    document.body.appendChild(overlay);
}

// ── 启动完成之后的未捕获错误：只在角落显示一小行，不再整屏黑框 ──
// 🔴 [2026-10-27 主人批准「游戏启动完成后遇到的未捕获小错，不再整屏黑框，只在屏幕角落显示一小行错误（方便截图发给你）；
//    启动阶段的错照旧整屏显示」] 起因：浏览器自动填充发的「假按键」没有 key，GameMap 的 e.key.toLowerCase() 崩了，
//    被 main.ts 的全局错误监听整屏盖成「游戏加载失败」。直播就跑在 dev 服务上，一处小错不该让观众看到整屏黑框。
let gameAppBooted = false;

/** 启动全部完成（GameApp.completeLateBoot 末尾）后调用。此后的未捕获错误只在角落显示一小行 */
export function markGameAppBooted(): void { gameAppBooted = true; }
export function isGameAppBooted(): boolean { return gameAppBooted; }

const RUNTIME_ERROR_BADGE_ID = 'game-runtime-error-badge';
/** 角落提示停留多久（毫秒）：够截一张图；期间又有错误就重新计时 */
const RUNTIME_ERROR_BADGE_MS = 20_000;
const RUNTIME_ERROR_MAX_CHARS = 200;
let runtimeErrorTimer = 0;
let runtimeErrorLast = '';
let runtimeErrorCount = 0;

/**
 * 把未捕获错误压成一行：`文件:行:列  类型: 信息`。
 * 位置取堆栈第一帧；开发服务器给的是转译后的行号，比源码行号小（注释被剔掉），对不上时用
 * `curl http://localhost:5173/src/<路径>.ts` 取转译结果核对。位置放最前，信息太长被截断时不会丢位置。
 */
export function describeUncaughtError(err: unknown): string {
    let name = '';
    let message = '';
    let stack = '';
    if (err instanceof Error) {
        name = err.name;
        message = err.message;
        stack = err.stack ?? '';
    } else if (typeof err === 'string') {
        message = err;
    } else if (err && typeof err === 'object') {
        const o = err as { name?: unknown; message?: unknown; stack?: unknown };
        if (typeof o.name === 'string') name = o.name;
        if (typeof o.message === 'string') message = o.message;
        if (typeof o.stack === 'string') stack = o.stack;
        if (!message) {
            try { message = JSON.stringify(err) ?? ''; } catch { message = String(err); }
        }
    } else {
        message = String(err);
    }
    message = message.replace(/\s+/g, ' ').trim() || '未知错误';
    if (message.length > RUNTIME_ERROR_MAX_CHARS) message = `${message.slice(0, RUNTIME_ERROR_MAX_CHARS)}…`;
    const text = name && name !== 'Error' && !message.startsWith(`${name}:`) ? `${name}: ${message}` : message;
    const frame = stack.split('\n').find((l) => /^\s*at\s/.test(l)) ?? '';
    const m = frame.match(/([^\s()]+):(\d+):(\d+)\)?\s*$/);
    // 文件名按 / 和 \ 都拆：浏览器里是 URL，Windows 本机脚本（node 测试等）的堆栈是 C:\...
    const loc = m ? `${m[1].replace(/[?#].*$/, '').split(/[\\/]/).pop() || m[1]}:${m[2]}:${m[3]}` : '';
    return loc ? `${loc}  ${text}` : text;
}

/** 左下角一小行错误提示：不挡点击，约 20 秒后自己消失；同一条错误连着出现只加计数 */
export function showGameAppRuntimeErrorBadge(err: unknown): void {
    const line = describeUncaughtError(err);
    runtimeErrorCount = line === runtimeErrorLast ? runtimeErrorCount + 1 : 1;
    runtimeErrorLast = line;
    let el = document.getElementById(RUNTIME_ERROR_BADGE_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = RUNTIME_ERROR_BADGE_ID;
        el.style.cssText = `
            position: fixed; left: 6px; bottom: 6px; z-index: 99998;
            max-width: min(70vw, 1100px); padding: 2px 10px;
            background: rgba(30,6,0,0.82); color: #ffb4a0;
            border-left: 3px solid #ff5722; border-radius: 3px;
            font: 13px/1.5 Consolas, 'Courier New', monospace;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            pointer-events: none;
        `;
        document.body.appendChild(el);
    }
    el.textContent = `⚠ ${line}${runtimeErrorCount > 1 ? `  ×${runtimeErrorCount}` : ''}`;
    el.style.display = 'block';
    window.clearTimeout(runtimeErrorTimer);
    const badge = el;
    runtimeErrorTimer = window.setTimeout(() => {
        badge.style.display = 'none';
        runtimeErrorLast = '';
        runtimeErrorCount = 0;
    }, RUNTIME_ERROR_BADGE_MS);
}

/** 加载字幕轮播 timer（hideLoadingOverlay 清除） */
let loadingPhraseTimer: ReturnType<typeof setInterval> | null = null;

/** 加载主题词（无真实进度，纯氛围；契合历史大乱斗）。message 传入时锁定不轮播。 */
const LOADING_PHRASES = [
    '正在排布列国…',
    '正在绘制山河…',
    '正在召集英豪…',
    '正在点燃烽烟…',
    '正在丈量疆土…',
];

export function showLoadingOverlay(message?: string): void {
    // 移除已有的加载覆盖层（幂等）
    hideLoadingOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'game-loading-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background:
            radial-gradient(ellipse 60% 50% at 50% 42%, rgba(120,96,40,0.18) 0%, rgba(10,10,14,0) 70%),
            #0a0a0e;
        display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 99998; color: #c8b87c;
        font-family: 'Noto Serif SC', serif;
        animation: loading-overlay-breathe 5s ease-in-out infinite;
    `;

    // 标题逐字：升起入场 + 错峰流光（光从左向右扫过鎏金大字）
    const title = '历史大乱斗';
    const charSpans = [...title].map((ch, i) => {
        const rise = (i * 0.1).toFixed(2);
        const glow = (0.7 + i * 0.22).toFixed(2);
        return `<span style="
            display: inline-block;
            background: linear-gradient(180deg, #f5e6b8 0%, #c8a848 60%, #8a6820 100%);
            -webkit-background-clip: text; background-clip: text; color: transparent;
            animation:
                loading-char-rise 0.6s cubic-bezier(0.16,1,0.3,1) ${rise}s both,
                loading-char-glow 2.8s ease-in-out ${glow}s infinite;
        ">${ch}</span>`;
    }).join('');

    overlay.innerHTML = `
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 12px; margin-bottom: 24px; display: flex;">
            ${charSpans}
        </div>
        <div id="game-loading-msg" style="font-size: 14px; color: rgba(200,184,124,0.55); margin-bottom: 32px; letter-spacing: 4px;
            animation: loading-msg-fade 2.6s ease-in-out infinite;">
            ${message || LOADING_PHRASES[0]}
        </div>
        <div id="game-loading-bar-track" style="width: 200px; height: 2px; background: rgba(200,184,124,0.12); border-radius: 1px; overflow: hidden;">
            <div id="game-loading-bar-fill" style="height: 100%; width: 30%;
                background: linear-gradient(90deg, transparent, #f5e6b8, transparent);
                animation: loading-bar-sweep 1.6s ease-in-out infinite;">
            </div>
        </div>
    `;
    if (!document.getElementById('game-loading-styles')) {
        const style = document.createElement('style');
        style.id = 'game-loading-styles';
        style.textContent = `
            @keyframes loading-char-rise {
                0% { opacity: 0; transform: translateY(18px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes loading-char-glow {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.45) drop-shadow(0 0 10px rgba(255,210,110,0.55)); }
            }
            @keyframes loading-msg-fade {
                0%, 100% { opacity: 0.45; }
                50% { opacity: 0.85; }
            }
            @keyframes loading-bar-sweep {
                0% { transform: translateX(-180px); }
                100% { transform: translateX(200px); }
            }
            @keyframes loading-overlay-breathe {
                0%, 100% { background-position: 50% 42%, 0 0; filter: brightness(1); }
                50% { filter: brightness(1.08); }
            }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(overlay);

    // 无真实进度时，字幕主题词轮播（传了固定 message 则不轮播）
    if (!message) {
        let idx = 0;
        loadingPhraseTimer = setInterval(() => {
            idx = (idx + 1) % LOADING_PHRASES.length;
            const el = document.getElementById('game-loading-msg');
            if (el) el.textContent = LOADING_PHRASES[idx];
        }, 1600);
    }
}

/** 渐进更新加载文字（停止轮播，锁定为指定文案） */
export function setLoadingMessage(message: string): void {
    if (loadingPhraseTimer) {
        clearInterval(loadingPhraseTimer);
        loadingPhraseTimer = null;
    }
    const el = document.getElementById('game-loading-msg');
    if (el) el.textContent = message;
}

/** 推进加载进度条（0–100），-1 保留当前。调用即切为真实进度模式（停掉流光扫动） */
export function setLoadingProgress(pct: number): void {
    const fill = document.getElementById('game-loading-bar-fill');
    if (!fill || pct < 0) return;
    fill.style.animation = 'none';
    fill.style.transform = 'none';
    fill.style.background = 'linear-gradient(90deg, #c8a848, #f5e6b8)';
    fill.style.transition = 'width 0.4s ease-out';
    fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

export function hideLoadingOverlay(): void {
    if (loadingPhraseTimer) {
        clearInterval(loadingPhraseTimer);
        loadingPhraseTimer = null;
    }
    const el = document.getElementById('game-loading-overlay');
    if (el) el.remove();
    const style = document.getElementById('game-loading-styles');
    if (style) style.remove();
    // [诊断 2026-07-17] 记录"加载动画消失"墙钟时刻（= 用户看到游戏出现，从打开页面算起）
    // performance.now() 以导航开始为 0 点，故此值即用户主观等待时长。
    (window as any).__overlayHiddenAtMs = performance.now();
}
