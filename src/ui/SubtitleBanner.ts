/**
 * SubtitleBanner.ts - 大事字幕条（慢直播低调风格）
 *
 * S 级大事（灭国 / 复国 / 文化中心易主）语音播报时，底部中央淡入一条
 * 古籍风字幕，播报结束缓缓淡出；不播报时不占画面。
 * 字号按「1080p 直播压缩后手机可读」标准取 22px。
 */

const BANNER_ID = 'subtitle-banner';
const STYLE_ID = 'subtitle-banner-style';
const FADE_MS = 600;

export class SubtitleBanner {
    private static el: HTMLDivElement | null = null;
    private static hideTimer: number | null = null;

    private static ensure(): HTMLDivElement {
        if (this.el && document.body.contains(this.el)) return this.el;
        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
                #${BANNER_ID} {
                    position: fixed;
                    left: 50%;
                    bottom: 84px;
                    transform: translateX(-50%);
                    z-index: 10003;
                    max-width: 72vw;
                    padding: 10px 30px;
                    background: linear-gradient(to bottom, rgba(18, 12, 8, 0.78), rgba(10, 6, 4, 0.82));
                    border: 1px solid rgba(200, 160, 80, 0.38);
                    border-radius: 4px;
                    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
                    font-family: 'Noto Serif SC', serif;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: 6px;
                    color: #f0e6d2;
                    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
                    text-align: center;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity ${FADE_MS}ms ease;
                }
            `;
            document.head.appendChild(style);
        }
        const el = document.createElement('div');
        el.id = BANNER_ID;
        document.body.appendChild(el);
        this.el = el;
        return el;
    }

    /** 淡入显示；fallbackHoldMs 为兜底自动淡出时间，语音 onend 会提前调用 hide()。 */
    static show(text: string, fallbackHoldMs = 9000): void {
        const el = this.ensure();
        if (this.hideTimer !== null) {
            window.clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        el.textContent = text;
        void el.offsetWidth; // 连续两条字幕时也保证有淡入过渡
        el.style.opacity = '1';
        this.hideTimer = window.setTimeout(() => this.hide(), fallbackHoldMs);
    }

    static hide(): void {
        if (this.hideTimer !== null) {
            window.clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        if (this.el) this.el.style.opacity = '0';
    }
}
