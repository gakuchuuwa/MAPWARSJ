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

export function setupGameAppVisibilityHandler(resetFrameTime: () => void): void {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            resetFrameTime();
            gameLog('startup', '👁️ [GameApp] Tab visible — resetting frame time');
        } else {
            gameLog('startup', '🙈 [GameApp] Tab hidden — gameLoop will pause until restored');
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
}
