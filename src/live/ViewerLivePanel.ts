/**
 * YouTube 单平台直播互动面板。只在战术模式显示；F9 是本地测试与官方接口配置。
 * 免费积分来自频道增长目标；真钱只来自 YouTube Super Chat / Super Sticker。
 */
import { type ViewerLive, ORDERS_PER_CAST } from './ViewerLive';
import type { YouTubeOfficialBridge } from './YouTubeOfficialBridge';

const PANEL_ID = 'viewer-live-panel';
const FONT = "'Noto Serif SC', 'SimSun', serif";
const WORDS = ['攻', '胜', '敌', '混', '并', '败'] as const;
const FS = { title: 16, main: 15, sub: 13.5, small: 12.5 } as const;
const FS_S13 = { title: 13.5, main: 13, sub: 12, small: 12 } as const;
const DESIGN_WIDTH = 1920;

export class ViewerLivePanel {
    private root: HTMLDivElement;
    private body: HTMLDivElement;
    private dev: HTMLDivElement;
    private devOpen = false;
    private inScene13Bar = false;

    constructor(private readonly live: ViewerLive, private readonly link: YouTubeOfficialBridge) {
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

    private applyScene13MergedStyle(): void {
        this.root.style.cssText = `
            position:relative; display:inline-flex; align-items:center; flex-shrink:0;
            margin-left:2px; padding-left:10px;
            border-left:1px solid rgba(212,175,55,0.45);
            color:#f5e6c8; font-family:${FONT}; font-size:${FS_S13.sub}px; line-height:1.2;
            pointer-events:auto; user-select:none;`;
        this.dev.style.cssText = `display:${this.devOpen ? 'block' : 'none'}; position:absolute; top:calc(100% + 8px); right:0; width:360px; padding:10px 12px; background:rgba(18,14,10,0.96); border:1px solid rgba(212,175,55,0.6); border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,0.7); font-size:13px; line-height:1.5; text-align:left; z-index:10060; white-space:normal;`;
    }

    private updatePosition(): void {
        const s13Bar = document.getElementById('player-scene13-bar');
        const s13Active = !!(s13Bar && s13Bar.style.display !== 'none');
        if (s13Active && s13Bar) {
            if (!this.inScene13Bar || this.root.parentElement !== s13Bar) {
                this.inScene13Bar = true;
                this.root.append(this.body, this.dev);
                this.applyScene13MergedStyle();
                s13Bar.appendChild(this.root);
            }
            return;
        }
        if (this.inScene13Bar || this.root.parentElement !== document.body) {
            this.inScene13Bar = false;
            this.root.append(this.dev, this.body);
            this.applyStrategicBottomStyle();
            document.body.appendChild(this.root);
        }
        let bottomPx = 6;
        const combatCenter = document.querySelector<HTMLElement>('.combat-center');
        if (combatCenter && combatCenter.style.display !== 'none' && combatCenter.offsetHeight > 0) {
            const top = combatCenter.getBoundingClientRect().top;
            if (top > 0 && top < window.innerHeight) bottomPx = Math.max(6, Math.round(window.innerHeight - top + 6));
        }
        const scale = Math.round(Math.max(1, window.innerWidth / DESIGN_WIDTH) * 100) / 100;
        this.root.style.bottom = `${bottomPx}px`;
        this.root.style.transform = `translateX(-50%) scale(${scale})`;
    }

    private render(): void {
        const s = this.live.snapshot();
        this.updatePosition();
        const linked = s.platform.includes('已连接');
        const show = this.devOpen || (this.inScene13Bar && (s.on || linked));
        if (!show) { this.root.style.display = 'none'; return; }
        this.root.style.display = 'inline-flex';
        const f = this.inScene13Bar ? FS_S13 : FS;
        const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
        const b = (t: string) => `<b style="color:#ffd700;">${t}</b>`;
        const sep = `<span style="color:rgba(212,175,55,0.45);margin:0 2px;">｜</span>`;
        const chat = s.lastChatAgo < 0 ? '还没收到弹幕' : `最近弹幕 ${s.lastChatAgo} 秒前`;
        const platform = this.devOpen
            ? `<div style="font-size:13px;color:#8fd3ff;margin-bottom:4px;text-align:center;">${esc(s.platform || '本地 YouTube 服务未连接')}　${chat}${s.yt ? '<br>' + esc(s.yt) : ''}</div>`
            : '';
        const titleBadge = `<span style="font-size:${f.title}px;color:#ffd700;font-weight:900;letter-spacing:1px;text-shadow:0 1px 2px rgba(0,0,0,0.9);">📢 发弹幕参战</span>`;
        const sideCmd = !s.on
            ? `<span style="font-size:${f.main}px;">开战发 ${b('1')} 攻方 · ${b('2')} 守方</span>`
            : `<span style="font-size:${f.main}px;">${b('1')} ${esc(s.names[0])}<span style="font-size:${f.sub}px;color:#dfc28c;">(${b(String(s.counts[0]))})</span> · ${b('2')} ${esc(s.names[1])}<span style="font-size:${f.sub}px;color:#dfc28c;">(${b(String(s.counts[1]))})</span></span>`;
        const castCmd = `<span style="font-size:${f.main}px;">${b('攻胜敌混并败')} 放计</span>`;
        const scoutCmd = `<span style="font-size:${f.main}px;">${b('技3')} 玩家技</span>`;
        const earnCmd = `<span style="font-size:${f.sub}px;color:#e0cfa9;">(${b(`${ORDERS_PER_CAST}积分`)}/计)</span>`;
        const mainRow = `<div style="display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;">${titleBadge}${sep}${sideCmd}${sep}${castCmd} ${earnCmd}${sep}${scoutCmd}</div>`;
        const subItems: string[] = [];
        subItems.push(`<span>Super Chat ${b(`$${s.price / 100}`)} 可放一计</span>`);
        const g = s.goal;
        if (s.yt || g.likes > 0 || g.subs > 0) {
            const pct = Math.min(100, Math.round(g.likeProg / g.likeStep * 100));
            subItems.push(
                `<span style="display:inline-flex;align-items:center;gap:5px;">点赞 ${b(`${g.likeProg}/${g.likeStep}`)} 新增发积分${g.subs > 0 ? ` · 订阅 ${b(String(g.subs))}` : ''} · 在线新高 ${b(String(g.viewers))}`
                + `<span style="display:inline-block;width:60px;height:6px;background:#3a2a16;border-radius:3px;overflow:hidden;"><span style="display:block;height:6px;width:${pct}%;background:#d4af37;"></span></span></span>`
            );
        }
        if (s.top.length) {
            subItems.push(`<span>积分：${s.top.slice(0, 3).map((t) =>
                `<span style="white-space:nowrap;${t.n >= ORDERS_PER_CAST ? 'color:#ffd700;' : ''}">${esc(t.name)} <b>${t.n}</b></span>`).join('　')}</span>`);
        }
        if (s.on && s.queueBrief.length) {
            const q = s.queueBrief;
            subItems.push(`<span><span style="color:#ffd700;">排队：</span>${q.slice(0, 3).map((x) =>
                `${esc(x.name)}${x.label ? `·${x.label}` : ''}${x.paid ? '<span style="color:#ffd700;">·赏</span>' : ''}`).join('　')}${q.length > 3 ? ` 等 ${q.length} 人` : ''}</span>`);
        }
        if (s.log.length) subItems.push(`<span style="color:#cdbb95;">${s.log.slice(-2).map(esc).join(' ｜ ')}</span>`);
        const subRow = subItems.length
            ? `<div style="position:absolute;top:calc(100% + 6px);right:0;display:flex;align-items:center;gap:8px;padding:3px 10px;background:rgba(20,16,12,0.92);border:1px solid rgba(212,175,55,0.5);border-radius:6px;font-size:${f.small}px;white-space:nowrap;pointer-events:none;">${subItems.join(sep)}</div>`
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
        const ytLabel = document.createElement('div');
        ytLabel.textContent = 'YouTube API 密钥、本场直播网址，回车生效；换网址时密钥留空即沿用';
        ytLabel.style.cssText = 'color:#8fd3ff;margin-bottom:2px;';
        const ytKey = document.createElement('input');
        ytKey.type = 'password';
        ytKey.placeholder = 'API 密钥（只保存到本机服务）';
        ytKey.style.cssText = name.style.cssText;
        const ytVideo = document.createElement('input');
        ytVideo.value = this.link.getVideo();
        ytVideo.placeholder = '直播网址或 11 位视频 ID';
        ytVideo.style.cssText = name.style.cssText;
        const applyYt = (e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key !== 'Enter') return;
            void this.link.configure(ytKey.value, ytVideo.value).then((ok) => {
                if (ok) {
                    ytKey.value = '';
                    if (document.activeElement !== ytVideo) ytVideo.value = this.link.getVideo();
                }
                this.render();
            });
        };
        ytKey.addEventListener('keydown', applyYt);
        ytVideo.addEventListener('keydown', applyYt);
        this.dev.append(ytLabel, ytKey, ytVideo, label, name, paidWrap,
            row(['1 站攻方', '2 站守方'], (w) => send(w[0])),
            row([...WORDS], send),
            row(['技3', '技4', '技5'], send),
            row(['Super Chat $1', 'Super Chat $10'], (w) => {
                this.live.onPayment(name.value.trim() || '观众', name.value, w.includes('10') ? 1000 : 100, `测试${w}`);
                this.render();
            }),
            row(['点赞+1', '点赞+10', '订阅+1', '在线+1'], (w) => {
                const g = this.live.snapshot().goal;
                if (w === '点赞+1' || w === '点赞+10') {
                    const d = w === '点赞+10' ? 10 : 1;
                    this.live.onLikeTotal(g.likes);
                    this.live.onLikeTotal(g.likes + d);
                } else if (w === '订阅+1') {
                    this.live.onSubTotal(g.subs);
                    this.live.onSubTotal(g.subs + 1);
                } else {
                    this.live.onViewers(Math.max(0, g.viewers - 1));
                    this.live.onViewers(g.viewers + 1);
                }
                this.render();
            }));
    }
}
