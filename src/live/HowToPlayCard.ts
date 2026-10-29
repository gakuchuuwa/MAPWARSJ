/**
 * 「怎么玩」大卡片：直播画面正中弹出约 10 秒，给刚进直播间的观众看。
 * 🔴 [2026-10-29 主人「观众进来不知道怎么玩」「进来人就应该发」] YouTube 不通知谁进了直播间，
 *    聊天机器人也发不了「欢迎」；改由画面弹卡：在线人数涨了、或有人本场第一次说话时弹。
 *    两次之间至少隔 MIN_GAP_MS，免得人多时一直挡着战场。
 */
const SHOW_MS = 10_000;
const MIN_GAP_MS = 120_000;
const FONT = "'Noto Serif SC', 'SimSun', serif";

const LINES: [string, string][] = [
    ['说句话就在场', '10 分钟内说过话，每 3 分钟 +1 积分'],
    ['第一次来', '送 3 分，够放一计；每天回来再送 3 分'],
    ['技1', '打仗时让主角爆发，出分高的先放'],
    ['攻 胜 敌 混 并 败', '打仗时放计，3 分一次，先到先放'],
    ['名 新名字 1', '给主角改名'],
    ['积分', '查自己有多少分'],
];

export class HowToPlayCard {
    private lastShownAt = -Infinity;
    private el: HTMLDivElement | null = null;
    private hideTimer = 0;

    public show(): void {
        const now = Date.now();
        if (now - this.lastShownAt < MIN_GAP_MS) return;
        this.lastShownAt = now;
        this.el?.remove();
        window.clearTimeout(this.hideTimer);

        const card = document.createElement('div');
        card.style.cssText = `
            position:fixed; left:50%; top:46%; transform:translate(-50%,-50%) scale(0.92); z-index:10070;
            min-width:min(44vw, 900px); max-width:92vw; padding:clamp(14px,1.6vw,34px) clamp(18px,2.4vw,52px);
            font-family:${FONT}; color:#f5e6c8; pointer-events:none; opacity:0;
            background:linear-gradient(180deg, rgba(34,26,16,0.95) 0%, rgba(14,11,8,0.96) 100%);
            border:2px solid rgba(212,175,55,0.85); border-radius:14px;
            box-shadow:0 8px 40px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,215,0,0.3);
            transition:opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1);`;
        const title = document.createElement('div');
        title.textContent = '📢 弹幕操控主角 · 怎么玩';
        title.style.cssText = 'font-size:clamp(22px,2.4vw,52px); font-weight:900; color:#ffd700; text-align:center; margin-bottom:0.5em; letter-spacing:2px; text-shadow:0 2px 6px rgba(0,0,0,0.9);';
        card.appendChild(title);
        for (const [cmd, desc] of LINES) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; align-items:baseline; gap:0.8em; font-size:clamp(16px,1.55vw,34px); line-height:1.7; white-space:nowrap;';
            const c = document.createElement('b');
            c.textContent = cmd;
            c.style.cssText = 'color:#ffd700; min-width:7.5em;';
            const d = document.createElement('span');
            d.textContent = desc;
            row.append(c, d);
            card.appendChild(row);
        }
        document.body.appendChild(card);
        this.el = card;
        requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translate(-50%,-50%) scale(1)';
        });
        this.hideTimer = window.setTimeout(() => {
            card.style.opacity = '0';
            window.setTimeout(() => { card.remove(); if (this.el === card) this.el = null; }, 600);
        }, SHOW_MS);
    }
}
