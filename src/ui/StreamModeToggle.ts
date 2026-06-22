/**
 * StreamModeToggle.ts - 直播模式开关（2026-06-12 美化第一步）
 *
 * 一键隐藏所有开发者 UI，给无解说直播一个干净画面：
 *   隐藏：右侧调试面板（#debug-control-panel）、左下坐标/六边形/地形框（.hud-map-panel）、
 *         性能按钮（#perf-toggle-btn）
 *   保留：播放/倍速、日期条、军情面板、军团列表、势力榜、跟拍横幅、远征 UI
 *
 * 状态存 localStorage（mapwar-stream-mode），刷新后保持。
 */

const STORAGE_KEY = 'mapwar-stream-mode';
const STYLE_ID = 'stream-mode-style';
const BTN_ID = 'stream-mode-btn';

export class StreamModeToggle {
    private static button: HTMLButtonElement | null = null;

    public static init(): void {
        this.injectStyle();
        this.createButton();
        if (localStorage.getItem(STORAGE_KEY) === '1') {
            this.apply(true);
        }
    }

    private static injectStyle(): void {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            body.stream-mode #debug-control-panel,
            body.stream-mode .hud-map-panel,
            body.stream-mode #perf-toggle-btn {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    private static createButton(): void {
        const controls = document.querySelector('.hud-controls');
        if (!controls || document.getElementById(BTN_ID)) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.className = 'game-time-btn';
        btn.title = '直播模式：隐藏调试面板等开发界面';
        btn.textContent = '直播';
        btn.addEventListener('click', () => {
            this.apply(!document.body.classList.contains('stream-mode'));
        });
        controls.appendChild(btn);
        this.button = btn;
    }

    public static isActive(): boolean {
        return document.body.classList.contains('stream-mode');
    }

    private static apply(on: boolean): void {
        document.body.classList.toggle('stream-mode', on);
        localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
        if (this.button) {
            this.button.textContent = on ? '📺 直播中' : '直播';
            this.button.style.color = on ? '#e8b25a' : '';
        }
        // 通知其他 UI：直播模式已变更
        window.dispatchEvent(new CustomEvent('stream-mode-change', { detail: { on } }));
    }
}
