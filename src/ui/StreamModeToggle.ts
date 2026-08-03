/**
 * StreamModeToggle.ts - 直播模式开关（2026-06-12 美化第一步）
 *
 * 一键隐藏所有开发者 UI，给无解说直播一个干净画面：
 *   隐藏：右侧调试面板（#debug-control-panel）、左下坐标/六边形/地形框（.hud-map-panel）、
 *         性能按钮（#perf-toggle-btn）
 *   保留：播放/倍速、日期条、军情面板、军团列表、势力榜、跟拍横幅、远征 UI
 *
 * 状态存 localStorage（mapwar-stream-mode），刷新后保持。
 *
 * 【2026-08-03 主人定】本按钮只管画面干不干净，不兼任「开发期自动刷新」开关：
 * 改文件刷不刷新看的是【推演是否正在运行】（TimeSystem 暂停位）——
 * 推演在跑不刷新（可能正在直播），推演暂停/未开播立刻刷新（主人在修游戏）。
 * （上报在 src/dev/ReloadGate.ts，实际拦截在 vite.config.ts 的 suppress-portrait-dev-hmr）
 *
 * 与「刷新后自动开播」无关：那个是无条件的，刷新完 5 秒必播（UnattendedStream.autoStart）。
 * 要改东西就手点一下关掉，这一次会话内不会再被自动点回来（started 标志）。
 * STORAGE_KEY 只剩一个用途：刷新后立刻把画面恢复干净，别让观众看见 5 秒调试面板。
 */

const STORAGE_KEY = 'mapwar-stream-mode';
const STYLE_ID = 'stream-mode-style';
const BTN_ID = 'stream-mode-btn';

export class StreamModeToggle {
    private static button: HTMLButtonElement | null = null;
    /** 本次会话是否已经真正开播过（= 推演被开起来了），不含刷新后的纯视觉恢复 */
    private static started = false;

    public static init(): void {
        this.injectStyle();
        this.createButton();
        this.restoreVisual();
        // 2026-08-01 前的遗留键，职责已并入 STORAGE_KEY。留着不影响功能，
        // 但排查时会让人以为还有第二份状态，顺手清掉。
        try { localStorage.removeItem('mapwar-dev-autorefresh'); } catch { /* 隐私模式 */ }
    }

    /**
     * 刷新后立刻把「直播中」的画面恢复出来 —— 只隐藏开发 UI，不碰推演。
     *
     * 推演留给 UnattendedStream 在启动落定后调 activate() 真正开起来。分两步是因为
     * 启动尚未落定时军团/城池还没就位，不能在这里就开跑；而画面必须【马上】干净：
     * 老写法是「等 5 秒后由 autoStart 点一下按钮」，代价是直播一刷新，开头 5 秒
     * 整块调试面板明晃晃露在画面上，观众看得见。
     */
    private static restoreVisual(): void {
        if (!this.wasActiveLastSession()) return;
        document.body.classList.add('stream-mode');
        if (this.button) {
            this.button.textContent = '📺 直播中';
            this.button.style.color = '#e8b25a';
        }
    }

    /** 自动开播链路专用：进入直播态并把推演真正开起来（幂等，已开播则不重复切换） */
    public static activate(): void {
        if (this.started) return;
        this.apply(true);
    }

    /** 本次会话是否已经真正开播过 */
    public static hasStarted(): boolean {
        return this.started;
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

    /**
     * 刷新前是不是直播态 —— 只用来决定【画面】要不要立刻恢复干净，
     * 不决定要不要自动开播（那个是无条件的，见 UnattendedStream.autoStart）。
     * 首次访问（无记录）按「要直播」算：观众打开页面就该看到在播。
     */
    public static wasActiveLastSession(): boolean {
        try {
            return localStorage.getItem(STORAGE_KEY) !== '0';
        } catch {
            return true;
        }
    }

    private static apply(on: boolean): void {
        if (on) this.started = true;
        document.body.classList.toggle('stream-mode', on);
        // 这份状态管两件事：画面干不干净、刷新后画面要不要立刻恢复干净。
        // 改文件刷不刷新与本按钮无关（ReloadGate 读的是推演运行状态）。
        localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
        if (this.button) {
            this.button.textContent = on ? '📺 直播中' : '直播';
            this.button.style.color = on ? '#e8b25a' : '';
        }
        if (on) {
            const game = (window as any).game;
            game?.cameraFollowUI?.openList?.();
            if (game?.historicalEventManager) {
                const isPlaying = game.historicalEventManager.togglePlayback();
                if (isPlaying) game.recruitmentSystem?.runInitialSpawn();
            }
        }
        // 通知其他 UI：直播模式已变更
        window.dispatchEvent(new CustomEvent('stream-mode-change', { detail: { on } }));
    }
}
