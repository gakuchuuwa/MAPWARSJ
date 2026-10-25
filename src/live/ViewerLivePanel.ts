/**
 * 🔴 [2026-10-23] 直播观众互动的屏幕面板（`ViewerLive`）。
 *   · [2026-10-26 主人定] 双态融合展示：
 *       1) 战略地图平时：贴在屏幕正下方中央（`bottom: 6px`），位于左下纪年面板与右下小地图之间；
 *       2) 战术模式（Scene13）：直接并入顶部玩家指挥面板（`#player-scene13-bar`）内作为第二行，与上方玩家面板融为一体。
 *   · 按 F9 展开测试区：输入观众名，点「站攻方 / 站守方」、点六个字放计、勾「付费」——本地模拟弹幕，
 *     不用开直播就能试整套玩法。以后接上直播平台，消息走同一个 `ViewerLive.onChat`。
 *   · [2026-10-24] 接上直播间（SocialStreamBridge）后不打仗也常显；F9 里填 SSN 会话 ID、看连接状态、模拟打赏。
 *   · [2026-10-25] 免费模式（军令）：显示规矩、全场点赞 / 订阅目标、最近挣到令的几个人；F9 填 YouTube 接口，模拟点赞 / 订阅。
 */
import { type ViewerLive, ORDERS_PER_CAST } from './ViewerLive';
import type { SocialStreamBridge } from './SocialStreamBridge';

const PANEL_ID = 'viewer-live-panel';
const FONT = "'Noto Serif SC', 'SimSun', serif";
const WORDS = ['攻', '胜', '敌', '混', '并', '败'] as const;
/** 横条字号（px，按 1920 宽的窗口设计）：标题 / 口令 / 说明 / 动态记录 */
const FS = { title: 16, main: 15, sub: 13.5, small: 12.5 } as const;
/**
 * 面板按 1920 宽设计；战略地图底部独立展示时按窗口宽度等比缩放。
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
    private inScene13Bar = false;

    constructor(private readonly live: ViewerLive, private readonly link: SocialStreamBridge) {
        try { this.tip = localStorage.getItem(TIP_KEY) ?? ''; } catch { /* 隐私模式 */ }
        this.root = document.createElement('div');
        this.root.id = PANEL_ID;
        this.body = document.createElement('div');
        this.dev = document.createElement('div');
        this.buildDev();
        this.applyStrategicBottomStyle();
        this.root.append(this.dev, this.body);
        document.body.appendChild(this.root);

        window.addEventListener('keydown', (e) => {
            if (e.key !== 'F9') return;
            e.preventDefault();
            this.devOpen = !this.devOpen;
            this.dev.style.display = this.devOpen ? 'block' : 'none';
            this.render();
        });
        window.addEventListener('resize', () => this.updatePosition());
        window.setInterval(() => this.render(), 300);
    }

    /** 战略地图模式：独立挂在屏幕正下方居中 */
    private applyStrategicBottomStyle(): void {
        this.root.style.cssText = `
            position:fixed; left:50%; bottom:6px; top:auto; transform:translateX(-50%); transform-origin:bottom center;
            z-index:10054; width:max-content; max-width:94vw; display:none;
            background:linear-gradient(180deg, rgba(28,22,16,0.94) 0%, rgba(12,10,8,0.96) 100%);
            border:1px solid rgba(212,175,55,0.65); border-radius:8px;
            padding:6px 16px; color:#f5e6c8; font-family:${FONT}; font-size:${FS.sub}px; line-height:1.35;
            box-shadow:0 4px 16px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,225,130,0.22);
            pointer-events:auto; user-select:none;`;
        this.dev.style.cssText = `display:${this.devOpen ? 'block' : 'none'}; width:360px; margin:0 auto 8px; padding-bottom:8px; border-bottom:1px dashed rgba(212,175,55,0.4); font-size:13px; line-height:1.5; text-align:left;`;
    }

    /** 战术模式（Scene13）：无缝融进顶部 `#player-scene13-bar` 内部作为第二行 */
    private applyScene13MergedStyle(): void {
        this.root.style.cssText = `
            flex:0 0 100%; width:100%; box-sizing:border-box; display:block;
            margin-top:2px; padding-top:5px;
            border-top:1px solid rgba(212,175,55,0.35);
            color:#f5e6c8; font-family:${FONT}; font-size:${FS.sub}px; line-height:1.3;
            text-align:center; pointer-events:auto; user-select:none;`;
        this.dev.style.cssText = `display:${this.devOpen ? 'block' : 'none'}; width:360px; margin:8px auto 0; padding-top:8px; border-top:1px dashed rgba(212,175,55,0.4); font-size:13px; line-height:1.5; text-align:left;`;
    }

    /** 根据当前是否在战术模式（`#player-scene13-bar` 是否显示），自动在「顶部玩家面板内融合」与「战略地图底部居中」之间切换 */
    private updatePosition(): void {
        if (this.root.style.display === 'none') return;
        const s13Bar = document.getElementById('player-scene13-bar');
        const s13Active = !!(s13Bar && s13Bar.style.display !== 'none');

        if (s13Active && s13Bar) {
            if (!this.inScene13Bar || this.root.parentElement !== s13Bar) {
                this.inScene13Bar = true;
                // 在顶部面板内：body 在上、dev 在下（按 F9 往下展开）
                this.root.append(this.body, this.dev);
                this.applyScene13MergedStyle();
                s13Bar.appendChild(this.root);
            }
            return;
        }

        if (this.inScene13Bar || this.root.parentElement !== document.body) {
            this.inScene13Bar = false;
            // 在底部独立条内：dev 在上、body 在下（按 F9 往上展开）
            this.root.append(this.dev, this.body);
            this.applyStrategicBottomStyle();
            this.root.style.display = 'block';
            document.body.appendChild(this.root);
        }

        let bottomPx = 6;
        const combatCenter = document.querySelector<HTMLElement>('.combat-center');
        if (combatCenter && combatCenter.style.display !== 'none' && combatCenter.offsetHeight > 0) {
            const top = combatCenter.getBoundingClientRect().top;
            if (top > 0 && top < window.innerHeight) {
                bottomPx = Math.max(6, Math.round(window.innerHeight - top + 6));
            }
        }
        const scale = Math.round(Math.max(1, window.innerWidth / DESIGN_WIDTH) * 100) / 100;
        this.root.style.bottom = `${bottomPx}px`;
        this.root.style.transform = `translateX(-50%) scale(${scale})`;
    }

    private render(): void {
        const s = this.live.snapshot();
        // 接上直播间后不打仗也常显（打赏随时会来，要让观众看见感谢和规矩）
        const linked = s.platform === '直播间已连接';
        const show = s.on || linked || this.devOpen;
        if (!show) {
            this.root.style.display = 'none';
            return;
        }
        this.root.style.display = 'block';
        this.updatePosition();

        const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
        const b = (t: string) => `<b style="color:#ffd700;">${t}</b>`;
        const sep = `<span style="color:rgba(212,175,55,0.45);margin:0 2px;">｜</span>`;

        // F9 才看得到的状态（主播自己看）
        const chat = s.lastChatAgo < 0 ? '还没收到弹幕' : `最近弹幕 ${s.lastChatAgo} 秒前`;
        const port = location.port && location.port !== '5173'
            ? `<br><span style="color:#ff8a7a;">⚠ 游戏开在 ${esc(location.port)} 端口，存的会话 ID、观众余额都在 5173 那边：先关掉多开的游戏</span>`
            : '';
        const platform = this.devOpen
            ? `<div style="font-size:13px;color:#8fd3ff;margin-bottom:4px;text-align:center;">${esc(s.platform || '没接直播间')}${s.platform ? '　' + chat : ''}${s.yt ? '<br>' + esc(s.yt) : ''}${port}</div>`
            : '';

        // ── 第一行：核心参战口令（单行横向大字） ──
        const titleBadge = `<span style="font-size:${FS.title}px;color:#ffd700;font-weight:900;letter-spacing:1.5px;text-shadow:0 1px 3px rgba(0,0,0,0.9);">📢 发弹幕参战</span>`;
        const sideCmd = !s.on
            ? `<span style="font-size:${FS.main}px;">开战后发 ${b('1')} 站攻方 · ${b('2')} 站守方</span>`
            : `<span style="font-size:${FS.main}px;">${b('1')} ${esc(s.names[0])} <span style="font-size:${FS.sub}px;color:#dfc28c;">(${b(String(s.counts[0]))}人)</span> · ${b('2')} ${esc(s.names[1])} <span style="font-size:${FS.sub}px;color:#dfc28c;">(${b(String(s.counts[1]))}人)</span></span>`;
        const castCmd = `<span style="font-size:${FS.main}px;">${b('攻 胜 敌 混 并 败')} 放计</span>`;
        const earnCmd = `<span style="font-size:${FS.sub}px;color:#e0cfa9;">（站队/发弹幕攒军令，${b(`${ORDERS_PER_CAST} 令`)}放一计）</span>`;

        const mainRow = `<div style="display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;">${titleBadge}${sep}${sideCmd}${sep}${castCmd} ${earnCmd}</div>`;

        // ── 第二行：动态辅助信息（打赏 / 点赞目标 / 军令榜 / 排队 / 最近放计日志，有内容才显） ──
        const subItems: string[] = [];
        if (this.tip) {
            subItems.push(`<span>打赏 ${b(`$${s.price / 100}`)} 马上放一计 · ${esc(this.tip)} <span style="color:#cdbb95;">(留YouTube名)</span></span>`);
        }
        const g = s.goal;
        const showGoal = !!s.yt || g.likes > 0 || g.subs > 0;
        if (showGoal) {
            const pct = Math.min(100, Math.round(g.likeProg / g.likeStep * 100));
            subItems.push(
                `<span style="display:inline-flex;align-items:center;gap:5px;">点赞 ${b(`${g.likeProg}/${g.likeStep}`)} 满全军擂鼓${g.subs > 0 ? ` · 订阅 ${b(String(g.subs))}` : ''}`
                + `<span style="display:inline-block;width:60px;height:6px;background:#3a2a16;border-radius:3px;overflow:hidden;"><span style="display:block;height:6px;width:${pct}%;background:#d4af37;"></span></span></span>`
            );
        }
        if (s.top.length) {
            subItems.push(`<span>军令：${s.top.slice(0, 3).map((t) =>
                `<span style="white-space:nowrap;${t.n >= ORDERS_PER_CAST ? 'color:#ffd700;' : ''}">${esc(t.name)} <b>${t.n}</b></span>`).join('　')}</span>`);
        }
        if (s.on && s.queueBrief.length) {
            const q = s.queueBrief;
            subItems.push(`<span><span style="color:#ffd700;">排队：</span>${q.slice(0, 3).map((x) =>
                `${esc(x.name)}${x.paid ? '<span style="color:#ffd700;">·赏</span>' : ''}`).join('　')}${q.length > 3 ? ` 等 ${q.length} 人` : ''}</span>`);
        }
        if (s.log.length) {
            subItems.push(`<span style="color:#cdbb95;">${s.log.slice(-2).map(esc).join(' ｜ ')}</span>`);
        }

        const subRow = subItems.length
            ? `<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(212,175,55,0.25);font-size:${FS.small}px;">${subItems.join(sep)}</div>`
            : '';

        this.body.innerHTML = platform + mainRow + subRow;
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
