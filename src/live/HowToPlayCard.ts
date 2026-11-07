/**
 * 「怎么玩」大卡片：直播画面正中弹出约 10 秒，给刚进直播间的观众看。
 * 🔴 [2026-10-29 主人「观众进来不知道怎么玩」「进来人就应该发」] YouTube 不通知谁进了直播间，
 *    聊天机器人也发不了「欢迎」；改由画面弹卡：在线人数涨了、或有人本场第一次说话时弹。
 *    两次之间至少隔 MIN_GAP_MS，免得人多时一直挡着战场。
 */
const SHOW_MS = 10_000;
const MIN_GAP_MS = 120_000;
const FONT = "'Noto Serif SC', 'SimSun', serif";

/** 战略局直播（公共玩家那一套）：观众跟着玩家，六计按官阶逐级解锁 */
const LINES_STREAM: [string, string][] = [
    ['说句话就在场', '发言每 3 分钟 +1 分；在场每 5 分钟 +1 分（每天最多 15 分）'],
    ['第一次来', '送 5 分；每天回来再送 2 分'],
    ['技1', '打仗时让主角爆发，出分高的先放'],
    ['攻 胜 敌 混 并 败', '打仗时放计，1 分一次，先到先放'],
    ['名 新名字 1', '给主角改名'],
    ['积分', '查自己有多少分'],
];
/**
 * 即时战斗（`?quickbattle=1`）：没有公共玩家，观众**先选边站队**，再用六字给自己这边放计。
 * 🔴 [2026-11-07 主人令「观众起初可以选择攻击方或者是防守方」] 这张卡是唯一点名口令的地方，
 *    两种模式的口令不同，不能混着给（战略局的「技1」在即时战斗里没有）。
 */
const LINES_DUEL: [string, string][] = [
    ['1攻方 / 2守方', '先选边站队，30 秒开战前都能改'],
    ['攻 胜 敌 混 并 败', '给自己这边放计，1 分一次，先到先放'],
    ['押1 10', '下注押攻方/守方/和（用筹码，与积分分开）'],
    ['说句话就在场', '发言每 3 分钟 +1 分；在场每 5 分钟 +1 分（每天最多 15 分）'],
    ['第一次来', '送 5 分；每天回来再送 2 分'],
    ['积分', '查自己有多少分多少筹码'],
];

export class HowToPlayCard {
    private lastShownAt = -Infinity;
    private el: HTMLDivElement | null = null;
    private hideTimer = 0;
    /** 即时战斗（只有战术模式、观众自选攻守）：口令表换成 LINES_DUEL */
    private readonly duel = new URLSearchParams(window.location.search).has('quickbattle');

    public show(): void {
        const now = Date.now();
        if (now - this.lastShownAt < MIN_GAP_MS) return;
        this.lastShownAt = now;
        this.el?.remove();
        window.clearTimeout(this.hideTimer);

        let topPx = 44;
        const s13Bar = document.getElementById('player-scene13-bar');
        const heroBar = document.getElementById('player-hero-panel');
        if (s13Bar && s13Bar.style.display !== 'none' && s13Bar.offsetHeight > 0) {
            topPx = Math.round(s13Bar.getBoundingClientRect().bottom + 8);
        } else if (heroBar && heroBar.style.display !== 'none' && heroBar.offsetHeight > 0) {
            topPx = Math.round(heroBar.getBoundingClientRect().bottom + 8);
        }

        const card = document.createElement('div');
        card.style.cssText = `
            position:fixed; left:50%; top:${topPx}px; transform:translateX(-50%) translateY(-8px); z-index:10070;
            display:flex; align-items:center; gap:14px; width:max-content; max-width:94vw;
            padding:8px 18px; font-family:${FONT}; color:#f5e6c8; pointer-events:none; opacity:0;
            background:linear-gradient(90deg, rgba(18,14,10,0.62) 0%, rgba(28,22,15,0.78) 12%, rgba(28,22,15,0.78) 88%, rgba(18,14,10,0.62) 100%);
            backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px);
            border-top:1px solid rgba(212,175,55,0.7); border-bottom:1px solid rgba(212,175,55,0.7);
            border-left:3px solid #d4af37; border-right:3px solid #d4af37; border-radius:8px;
            box-shadow:0 4px 20px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,215,0,0.2);
            transition:opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);`;

        const title = document.createElement('div');
        title.innerHTML = '📢 弹幕控将<br><span style="font-size:12px;font-weight:700;color:#e8c77e;letter-spacing:1px;">新观众指南</span>';
        title.style.cssText = `
            font-size:15px; font-weight:900; color:#ffd700; text-align:center; line-height:1.35;
            padding-right:12px; border-right:1px solid rgba(212,175,55,0.4); white-space:nowrap;
            text-shadow:0 1px 3px rgba(0,0,0,0.9);`;
        card.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns:repeat(3, auto); gap:5px 10px; align-items:center;';
        for (const [cmd, desc] of (this.duel ? LINES_DUEL : LINES_STREAM)) {
            const pill = document.createElement('div');
            pill.style.cssText = `
                display:inline-flex; align-items:baseline; gap:6px; font-size:13px; line-height:1.35; white-space:nowrap;
                padding:2px 9px; background:rgba(255,215,0,0.06); border:1px solid rgba(212,175,55,0.3); border-radius:5px;
                text-shadow:0 1px 2px rgba(0,0,0,0.85);`;
            const c = document.createElement('b');
            c.textContent = cmd;
            c.style.cssText = 'color:#ffd700; font-weight:900;';
            const d = document.createElement('span');
            d.textContent = desc;
            d.style.cssText = 'color:#f5e6c8; font-size:12px;';
            pill.append(c, d);
            grid.appendChild(pill);
        }
        card.appendChild(grid);

        document.body.appendChild(card);
        this.el = card;
        requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateX(-50%) translateY(0)';
        });
        this.hideTimer = window.setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-50%) translateY(-8px)';
            window.setTimeout(() => { card.remove(); if (this.el === card) this.el = null; }, 450);
        }, SHOW_MS);
    }
}

