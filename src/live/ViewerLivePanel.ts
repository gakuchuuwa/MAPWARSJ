/**
 * 🔴 [2026-10-23] 直播观众互动的屏幕面板（`ViewerLive`）。
 *   · 打仗时右侧常显：玩法一句话、两边各多少人站队、排队名单、最近几条记录——给直播间观众看。
 *   · 按 F9 展开测试区：输入观众名，点「站攻方 / 站守方」、点六个字放计、勾「付费」——本地模拟弹幕，
 *     不用开直播就能试整套玩法。以后接上直播平台，消息走同一个 `ViewerLive.onChat`。
 *   · [2026-10-24] 接上直播间（SocialStreamBridge）后不打仗也常显；F9 里填 SSN 会话 ID、看连接状态、模拟打赏。
 *   · [2026-10-25] 免费模式（军令）：显示规矩、全场点赞 / 订阅目标、最近挣到令的几个人；F9 填 YouTube 接口，模拟点赞 / 订阅。
 *   · [2026-10-25 主人「你来定，只希望有人看、慢慢有钱挣」] 面板是给推流画面里的观众看的：
 *       1080p 推流放在网页播放器里只剩原尺寸四成多，原先 13px 的字到观众那边只有五六个像素，看不清怎么参加。
 *       字放大（FS），只留口令和最要紧的几句；细则（每 20 秒一令、订阅加几令）放进 YouTube 置顶留言。
 *       窗口比 1920 宽时整面板等比放大（DESIGN_WIDTH）：主人 4K 屏 150% 缩放，浏览器里 2560 宽。
 *       打赏一行只在 F9 填了「打赏方式」后才显示——没有付钱的地方就别写「打赏」。
 *       点赞 / 订阅目标只在接了 YouTube 接口（或真有数）时才显示，免得一直挂着「点赞 0/10」。
 *       F9 状态行加「最近弹幕几秒前」：SSN 连着不等于 YouTube 聊天窗口还开着，弹幕断了要看得出来。
 */
import { type ViewerLive, ORDERS_PER_CAST } from './ViewerLive';
import type { SocialStreamBridge } from './SocialStreamBridge';

const PANEL_ID = 'viewer-live-panel';
const FONT = "'Noto Serif SC', 'SimSun', serif";
const WORDS = ['攻', '胜', '敌', '混', '并', '败'] as const;
/** 面板字号（px，按 1920 宽的窗口设计）：标题 / 口令 / 说明 / 记录 */
const FS = { title: 26, main: 22, sub: 17, small: 15 } as const;
/**
 * 面板按 1920 宽设计；窗口更宽时整面板等比放大，在推流画面里占的比例不变。
 * 主人的屏是 4K、Windows 缩放 150%，浏览器里窗口 2560 宽：不放大的话，推到观众那边的字还要再小四分之一。
 */
const DESIGN_WIDTH = 1920;
/** F9 填的「打赏方式」（如 ko-fi.com/某某），存 localStorage */
const TIP_KEY = 'mapwar-live-tip';

export class ViewerLivePanel {
    private root: HTMLDivElement;
    private body: HTMLDivElement;
    private dev: HTMLDivElement;
    private devOpen = false;
    private tip = '';

    constructor(private readonly live: ViewerLive, private readonly link: SocialStreamBridge) {
        try { this.tip = localStorage.getItem(TIP_KEY) ?? ''; } catch { /* 隐私模式 */ }
        this.root = document.createElement('div');
        this.root.id = PANEL_ID;
        this.root.style.cssText = `
            position:fixed; right:16px; top:140px; z-index:10030; width:360px; display:none;
            background:rgba(16,12,9,0.85); border:1px solid rgba(212,175,55,0.55); border-radius:10px;
            padding:12px 14px; color:#f3e6c8; font-family:${FONT}; font-size:${FS.sub}px; line-height:1.45;
            box-shadow:0 8px 24px rgba(0,0,0,0.6);`;
        this.body = document.createElement('div');
        this.dev = document.createElement('div');
        this.dev.style.cssText = 'display:none; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(212,175,55,0.4); font-size:13px; line-height:1.5;';
        this.buildDev();
        this.root.append(this.body, this.dev);
        document.body.appendChild(this.root);

        window.addEventListener('keydown', (e) => {
            if (e.key !== 'F9') return;
            e.preventDefault();
            this.devOpen = !this.devOpen;
            this.dev.style.display = this.devOpen ? 'block' : 'none';
            this.render();
        });
        window.setInterval(() => this.render(), 300);
    }

    private render(): void {
        const s = this.live.snapshot();
        // 接上直播间后不打仗也常显（打赏随时会来，要让观众看见感谢和规矩）
        const linked = s.platform === '直播间已连接';
        this.root.style.display = s.on || linked || this.devOpen ? 'block' : 'none';
        if (this.root.style.display === 'none') return;
        // zoom 连 top / right 一起放大，面板仍在右上角同样的相对位置
        this.root.style.setProperty('zoom', String(Math.round(Math.max(1, window.innerWidth / DESIGN_WIDTH) * 100) / 100));
        const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
        const b = (t: string) => `<b style="color:#ffd700;">${t}</b>`;
        const line = (size: number, html: string, extra = '') => `<div style="font-size:${size}px;${extra}">${html}</div>`;

        // F9 才看得到的状态（主播自己看）
        const chat = s.lastChatAgo < 0 ? '还没收到弹幕' : `最近弹幕 ${s.lastChatAgo} 秒前`;
        // 浏览器按「网址＋端口」分开存东西：5173 被占、Vite 换到 5174 时，存的会话 ID、观众余额都读不到（不是丢了，在 5173 那边）
        const port = location.port && location.port !== '5173'
            ? `<br><span style="color:#ff8a7a;">⚠ 游戏开在 ${esc(location.port)} 端口，存的会话 ID、观众余额都在 5173 那边：先关掉多开的游戏</span>`
            : '';
        const platform = this.devOpen
            ? line(13, `${esc(s.platform || '没接直播间')}${s.platform ? '　' + chat : ''}${s.yt ? '<br>' + esc(s.yt) : ''}${port}`, 'color:#8fd3ff;margin-bottom:4px;')
            : '';
        const title = line(FS.title, '发弹幕参战', 'color:#ffd700;font-weight:900;letter-spacing:2px;');
        const words = line(FS.main, `${b('攻 胜 敌 混 并 败')} 放计`);
        const earn = line(FS.sub, `站队、发弹幕攒军令，${b(`${ORDERS_PER_CAST} 令`)}放一计`);
        const tip = this.tip
            ? line(FS.sub, `打赏 ${b(`$${s.price / 100}`)} 马上放一计　${esc(this.tip)}`, 'margin-top:4px;')
                + line(FS.small, '打赏时留名用你的 YouTube 名字', 'color:#cdbb95;')
            : '';
        const g = s.goal;
        const showGoal = !!s.yt || g.likes > 0 || g.subs > 0;
        const pct = Math.min(100, Math.round(g.likeProg / g.likeStep * 100));
        const goal = showGoal
            ? line(FS.sub, `点赞 ${b(`${g.likeProg}/${g.likeStep}`)} 满了全军擂鼓${g.subs > 0 ? `　订阅 ${b(String(g.subs))}` : ''}`, 'margin-top:6px;')
                + `<div style="height:8px;background:#3a2a16;border-radius:4px;overflow:hidden;margin-top:3px;"><div style="height:8px;width:${pct}%;background:#d4af37;"></div></div>`
            : '';
        // 最近挣到令的人：让观众看见自己那条弹幕算上了；够一计的标金色
        // 面板别占太多战场：军令只列 3 人（一行），记录只留 2 条
        const top = s.top.length
            ? line(FS.small, `军令　${s.top.slice(0, 3).map((t) =>
                `<span style="white-space:nowrap;${t.n >= ORDERS_PER_CAST ? 'color:#ffd700;' : ''}">${esc(t.name)} <b>${t.n}</b></span>`).join('　')}`, 'margin-top:6px;')
            : '';
        const log = s.log.slice(-2).map((l) => `<div>${esc(l)}</div>`).join('');
        const logBox = log ? `<div style="margin-top:6px;font-size:${FS.small}px;color:#cdbb95;line-height:1.4;">${log}</div>` : '';

        if (!s.on) {
            this.body.innerHTML = platform + title
                + line(FS.main, `开战后发 ${b('1')} 站攻方　${b('2')} 站守方`)
                + words + earn + tip + goal + top + logBox;
            return;
        }
        const q = s.queueBrief;
        const queue = q.length
            ? line(FS.small, `<span style="color:#ffd700;">排队</span>　${q.slice(0, 3).map((x) =>
                `${esc(x.name)}${x.paid ? '<span style="color:#ffd700;">·赏</span>' : ''}`).join('　')}${q.length > 3 ? `　等 ${q.length} 人` : ''}`, 'margin-top:6px;')
            : '';
        this.body.innerHTML = platform + title
            + line(FS.main, `${b('1')} ${esc(s.names[0])}　${b('2')} ${esc(s.names[1])}`)
            + words + earn + tip
            + line(FS.sub, `${esc(s.names[0])} ${b(String(s.counts[0]))} 人　｜　${esc(s.names[1])} ${b(String(s.counts[1]))} 人`, 'margin-top:6px;')
            + goal + top + queue + logBox;
    }

    private buildDev(): void {
        const label = document.createElement('div');
        label.textContent = '测试，按 F9 收起：模拟观众发弹幕';
        label.style.cssText = 'color:#8fd3ff;font-weight:700;margin-bottom:4px;';
        const name = document.createElement('input');
        name.value = '测试观众1';
        name.style.cssText = 'width:100%;box-sizing:border-box;margin-bottom:6px;background:#221a12;color:#f3e6c8;border:1px solid #6b5a3a;padding:3px 6px;';
        const paidWrap = document.createElement('label');
        paidWrap.style.cssText = 'display:block;margin-bottom:6px;';
        const paid = document.createElement('input');
        paid.type = 'checkbox';
        paidWrap.append(paid, document.createTextNode(' 这条带了一次的钱'));
        const row = (items: string[], onClick: (w: string) => void) => {
            const r = document.createElement('div');
            r.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;';
            for (const w of items) {
                const b = document.createElement('button');
                b.textContent = w;
                b.style.cssText = 'flex:1;min-width:34px;padding:3px 0;background:#3a2a16;color:#ffd700;border:1px solid #8a6a2a;border-radius:4px;cursor:pointer;';
                b.addEventListener('click', () => onClick(w));
                r.appendChild(b);
            }
            return r;
        };
        const send = (w: string) => { this.live.onChat(name.value, w, paid.checked); this.render(); };
        // 直播间：Social Stream Ninja 会话 ID（扩展弹窗里那串），回车生效，清空＝断开
        const ssnLabel = document.createElement('div');
        ssnLabel.textContent = 'SSN 会话 ID，回车生效';
        ssnLabel.style.cssText = 'color:#8fd3ff;margin-bottom:2px;';
        const ssn = document.createElement('input');
        ssn.type = 'password';
        ssn.value = this.link.getSession();
        ssn.style.cssText = name.style.cssText;
        ssn.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') { this.link.setSession(ssn.value); this.render(); }
        });
        // YouTube 点赞 / 订阅接口：API 密钥 + 直播视频 ID（可粘贴整条网址），回车生效，任一项清空＝停止
        const ytLabel = document.createElement('div');
        ytLabel.textContent = 'YouTube 接口密钥、本场直播网址，回车生效';
        ytLabel.style.cssText = ssnLabel.style.cssText;
        const ytKey = document.createElement('input');
        ytKey.type = 'password';
        ytKey.value = this.link.yt.getKey();
        ytKey.placeholder = 'API 密钥';
        ytKey.style.cssText = name.style.cssText;
        const ytVideo = document.createElement('input');
        ytVideo.value = this.link.yt.getVideo();
        ytVideo.placeholder = '直播网址或 11 位视频 ID';
        ytVideo.style.cssText = name.style.cssText;
        const applyYt = (e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key !== 'Enter') return;
            // 认出了就把整条网址换成视频 ID 给人看；认不出就留着原文，状态行报错
            if (this.link.yt.set(ytKey.value, ytVideo.value)) ytVideo.value = this.link.yt.getVideo();
            this.render();
        };
        ytKey.addEventListener('keydown', applyYt);
        ytVideo.addEventListener('keydown', applyYt);
        // 打赏方式：显示在面板上（如 ko-fi.com/某某）；清空＝面板不显示打赏那一行
        const tipLabel = document.createElement('div');
        tipLabel.textContent = '打赏方式，显示在面板上，如 ko-fi.com/你的名字，回车生效';
        tipLabel.style.cssText = ssnLabel.style.cssText;
        const tipInput = document.createElement('input');
        tipInput.value = this.tip;
        tipInput.placeholder = '不填＝面板不显示打赏';
        tipInput.style.cssText = name.style.cssText;
        tipInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key !== 'Enter') return;
            this.tip = tipInput.value.trim();
            try { localStorage.setItem(TIP_KEY, this.tip); } catch { /* 隐私模式 */ }
            this.render();
        });
        this.dev.append(ssnLabel, ssn, ytLabel, ytKey, ytVideo, tipLabel, tipInput, label, name, paidWrap,
            row(['1 站攻方', '2 站守方'], (w) => send(w[0])),
            row([...WORDS], send),
            // 模拟打赏：按昵称当观众 id，跟上面发字的是同一个人；「站外$1」模拟 Ko-fi：只给名字，按名字找人
            row(['打赏$1', '打赏$10', '站外$1'], (w) => {
                if (w === '站外$1') this.live.onExternalPayment(name.value, 100, '测试站外打赏', '');
                else this.live.onPayment(name.value.trim() || '观众', name.value, w.includes('10') ? 1000 : 100, `测试${w}`);
                this.render();
            }),
            // 模拟全场目标：点赞（TikTok 式一条一份）、订阅 +1、在线人数
            row(['点赞+1', '点赞+10', '订阅+1', '在线50人'], (w) => {
                if (w === '点赞+1') this.live.onLikes(1);
                else if (w === '点赞+10') this.live.onLikes(10);
                else if (w === '订阅+1') {
                    const cur = this.live.snapshot().goal.subs;
                    this.live.onSubTotal(cur);       // 还没基线时先记下，下一句才算涨
                    this.live.onSubTotal(cur + 1);
                }
                else this.live.onViewers(50);
                this.render();
            }));
    }
}
