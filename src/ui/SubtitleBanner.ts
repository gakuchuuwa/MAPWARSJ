/**
 * SubtitleBanner.ts - 大事与战役解说字幕条（电影级古典史诗质感）
 *
 * 1. S 级大事（灭国 / 复国 / 文化中心易主）语音播报时，底部中央淡入一条古籍风字幕，播报结束缓缓淡出；
 * 2. 战役背景解说（行军途中的历史教材旁白）：
 *    长篇文字无论是否包含换行，自动智能切为 1~2 行的精炼分片（按自然断句，每片约 40~85 字），
 *    以「渐显一部分 ➔ 停留 ➔ 渐隐 ➔ 渐显下一部分」的电影宽屏流式呈现，
 *    彻底杜绝多行大文本块遮挡地图，达到史诗纪录片与电影旁白般的视觉呼吸感。
 */

const BANNER_ID = 'subtitle-banner';
const STYLE_ID = 'subtitle-banner-style';
const FADE_MS = 450;

export class SubtitleBanner {
    private static el: HTMLDivElement | null = null;
    private static hideTimer: number | null = null;
    private static flowTimer: number | null = null;
    private static fadeTimer: number | null = null;

    private static ensure(): HTMLDivElement {
        if (this.el && document.body.contains(this.el)) return this.el;
        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
                #${BANNER_ID} {
                    position: fixed;
                    left: 50%;
                    /* 🔴 [2026-09-25 主人「这个字幕怎么总挡着道路编辑器，字幕放到下面去」]
                       编辑器页（道路/战场/据点编辑器，路径里带 editor）→ 贴到最下面（10px），不再压工具栏；
                       游戏内保持 84px（避开底部 HUD）。判据只看路径，不改任何游戏内位置。 */
                    bottom: ${/editor/i.test(location.pathname) ? '10px' : '84px'};
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
                    transition: opacity ${FADE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), transform ${FADE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1);
                    box-sizing: border-box;
                }
                /* 顶部与底部的微金流光饰线 */
                #${BANNER_ID}::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 8%;
                    right: 8%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.6) 20%, rgba(255, 235, 170, 0.95) 50%, rgba(212, 175, 55, 0.6) 80%, transparent 100%);
                    pointer-events: none;
                }
                #${BANNER_ID}::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 12%;
                    right: 12%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.3) 20%, rgba(212, 175, 55, 0.6) 50%, rgba(212, 175, 55, 0.3) 80%, transparent 100%);
                    pointer-events: none;
                }
                /* 战役背景播报流式呈现：宽屏电影双行视界（1040px），扁平延展，不遮挡大地图 */
                #${BANNER_ID}.multiline {
                    max-width: min(1040px, calc(100vw - 120px));
                    white-space: normal;
                    letter-spacing: 1.5px;
                    line-height: 1.85;
                    font-size: 18px;
                    font-weight: 500;
                    padding: 13px 36px 12px 36px;
                    text-align: justify;
                    text-justify: inter-ideograph;
                }
                #${BANNER_ID} .subtitle-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 6px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 4px;
                    color: #dfb86c;
                }
                #${BANNER_ID} .subtitle-header::before,
                #${BANNER_ID} .subtitle-header::after {
                    content: '';
                    height: 1px;
                    width: 32px;
                    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.6));
                }
                #${BANNER_ID} .subtitle-header::after {
                    background: linear-gradient(90deg, rgba(212,175,55,0.6), transparent);
                }
                #${BANNER_ID} .sub-content {
                    color: #f7eed8;
                    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.95), 0 0 10px rgba(212, 175, 55, 0.12);
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

    /**
     * 将长文本智能切分为适宜宽屏电影字幕呈现的微片段（每段约 40~85 字，严格保证 1~2 行且按标点完整断句）
     */
    private static splitIntoCinematicChunks(text: string, targetMaxChars = 85): string[] {
        const rawParagraphs = text.split('\n').map(l => l.trim()).filter(Boolean);
        const finalChunks: string[] = [];

        for (const para of rawParagraphs) {
            if (para.length <= targetMaxChars) {
                finalChunks.push(para);
                continue;
            }

            // 按中文终止标点切出完整子句（附带后引号）
            const sentences = para.match(/[^。！？；]+([。！？；][”’]?|$)/g) || [para];
            let currentChunk = '';

            for (const sentence of sentences) {
                const s = sentence.trim();
                if (!s) continue;
                if (!currentChunk) {
                    currentChunk = s;
                } else if ((currentChunk + s).length <= targetMaxChars) {
                    currentChunk += s;
                } else {
                    finalChunks.push(currentChunk);
                    currentChunk = s;
                }
            }
            if (currentChunk) {
                finalChunks.push(currentChunk);
            }
        }

        return finalChunks.length > 0 ? finalChunks : [text];
    }

    /**
     * 显示字幕
     * - 单行短句：标准单条居中显示；
     * - 多行长文（multiline）：智能断句切片，流式「渐显一部分 ➔ 停留 ➔ 渐隐 ➔ 渐显下一部分」，每幕仅 1~2 行。
     */
    static show(text: string, fallbackHoldMs = 9000, multiline = false): void {
        const el = this.ensure();
        this.clearAllTimers();

        // 如果是多行长文，智能切片为 1~2 行的微电影片段
        const chunks = multiline ? this.splitIntoCinematicChunks(text, 85) : [text];

        if (chunks.length <= 1) {
            // 单条模式
            el.classList.toggle('multiline', multiline);
            el.innerHTML = multiline
                ? `<div class="subtitle-header">❖ 史实纪事 ❖</div><div class="sub-content">${chunks[0] || text}</div>`
                : (chunks[0] || text);
            void el.offsetWidth;
            el.style.opacity = '1';
            el.style.transform = 'translateX(-50%) translateY(0)';
            this.hideTimer = window.setTimeout(() => this.hide(), fallbackHoldMs);
            return;
        }

        // 多段流式播报（渐显一部分 ➔ 停留 ➔ 渐隐 ➔ 渐显下一部分）
        el.classList.add('multiline');
        const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
        let currentIndex = 0;

        const playChunk = () => {
            if (currentIndex >= chunks.length) {
                this.hide();
                return;
            }

            const currentChunk = chunks[currentIndex];
            const ratio = currentChunk.length / Math.max(1, totalChars);
            // 本段时长按字数权重分配，保底至少 5.5 秒留足阅读时间
            const chunkTotalMs = Math.max(5500, Math.round(fallbackHoldMs * ratio));
            const holdMs = Math.max(2000, chunkTotalMs - FADE_MS);

            currentIndex++;
            el.innerHTML = `<div class="subtitle-header">❖ 史实纪事 (${currentIndex}/${chunks.length}) ❖</div><div class="sub-content">${currentChunk}</div>`;
            void el.offsetWidth;

            // 1. 优雅渐显
            el.style.opacity = '1';
            el.style.transform = 'translateX(-50%) translateY(0)';

            // 2. 停留到期后渐隐
            this.fadeTimer = window.setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateX(-50%) translateY(-4px)';

                // 3. 渐隐完成（450ms）后，微停 120ms 淡入下一部分
                this.flowTimer = window.setTimeout(() => {
                    playChunk();
                }, FADE_MS + 120);
            }, holdMs);
        };

        playChunk();
    }

    /** 隐藏字幕并清除所有流式轮播计时器 */
    static hide(): void {
        this.clearAllTimers();
        if (this.el) {
            this.el.style.opacity = '0';
            this.el.style.transform = 'translateX(-50%) translateY(-4px)';
        }
    }

    private static clearAllTimers(): void {
        if (this.hideTimer !== null) {
            window.clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        if (this.flowTimer !== null) {
            window.clearTimeout(this.flowTimer);
            this.flowTimer = null;
        }
        if (this.fadeTimer !== null) {
            window.clearTimeout(this.fadeTimer);
            this.fadeTimer = null;
        }
    }
}
