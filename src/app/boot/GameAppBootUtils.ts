import { gameLog } from '../../utils/GameLogger';

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
    const overlay = document.createElement('div');
    overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 99999; color: #fff;
        `;
    overlay.innerHTML = `
            <h1 style="color: #ff5722; margin-bottom: 20px;">❌ 游戏加载失败</h1>
            <p style="color: #aaa; max-width: 600px; text-align: center;">${message}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 30px; cursor: pointer;">重试</button>
        `;
    document.body.appendChild(overlay);
}
