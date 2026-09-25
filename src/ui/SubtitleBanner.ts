/**
 * SubtitleBanner.ts - 大事与战役解说字幕条（电影级古典史诗质感）
 *
 * 1. S 级大事（灭国 / 复国 / 文化中心易主）语音播报时，底部中央淡入一条古籍风字幕，播报结束缓缓淡出；
 * 2. 战役背景解说（行军途中的历史教材旁白）多行流式呈现，具备典雅暗金卷轴微光与毛玻璃通透感。
 */

const BANNER_ID = 'subtitle-banner';
const STYLE_ID = 'subtitle-banner-style';
const FADE_MS = 500;

export class SubtitleBanner {
    private static el: HTMLDivElement | null = null;
    private static hideTimer: number | null = null;
    private static transitionTimer: number | null = null;

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
                    max-width: 76vw;
                    padding: 12px 36px;
                    background: linear-gradient(180deg, rgba(22, 17, 13, 0.90) 0%, rgba(12, 9, 7, 0.95) 100%);
                    border: 1px solid rgba(212, 175, 55, 0.35);
                    border-radius: 8px;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 235, 170, 0.12) inset, 0 2px 10px rgba(212, 175, 55, 0.15);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'Cinzel', serif;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: 6px;
                    color: #f7eed8;
                    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95), 0 0 14px rgba(212, 175, 55, 0.18);
                    text-align: center;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity ${FADE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1);
                    box-sizing: border-box;
                }
                /* 顶部与底部的微金流光饰线 */
                #${BANNER_ID}::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 12%;
                    right: 12%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.6) 20%, rgba(255, 235, 170, 0.95) 50%, rgba(212, 175, 55, 0.6) 80%, transparent 100%);
                    pointer-events: none;
                }
                #${BANNER_ID}::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 16%;
                    right: 16%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.3) 20%, rgba(212, 175, 55, 0.6) 50%, rgba(212, 175, 55, 0.3) 80%, transparent 100%);
                    pointer-events: none;
                }
                /* 战役背景播报与多行长段落解说：书本最佳阅读行宽（~880px），呼吸感行高 */
                #${BANNER_ID}.multiline {
                    max-width: min(880px, calc(100vw - 100px));
                    white-space: pre-wrap;
                    letter-spacing: 1.5px;
                    line-height: 2.05;
                    font-size: 19px;
                    font-weight: 500;
                    padding: 20px 38px;
                    text-align: justify;
                    text-justify: inter-ideograph;
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
    static show(text: string, fallbackHoldMs = 9000, multiline = false): void {
        const el = this.ensure();
        if (this.hideTimer !== null) {
            window.clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        if (this.transitionTimer !== null) {
            window.clearTimeout(this.transitionTimer);
            this.transitionTimer = null;
        }

        const applyContent = () => {
            el.classList.toggle('multiline', multiline);
            el.textContent = text;
            void el.offsetWidth; // 触发回流确保动画生效
            el.style.opacity = '1';
            this.hideTimer = window.setTimeout(() => this.hide(), fallbackHoldMs);
        };

        // 如果已经在显示中且文字有变化，先平滑微淡出 120ms 再淡入，实现电影台词般呼吸感切换
        if (el.style.opacity === '1' && el.textContent !== text) {
            el.style.opacity = '0.2';
            this.transitionTimer = window.setTimeout(applyContent, 120);
        } else {
            applyContent();
        }
    }

    static hide(): void {
        if (this.hideTimer !== null) {
            window.clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        if (this.transitionTimer !== null) {
            window.clearTimeout(this.transitionTimer);
            this.transitionTimer = null;
        }
        if (this.el) this.el.style.opacity = '0';
    }
}
