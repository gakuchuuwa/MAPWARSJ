/**
 * 🔴 [2026-10-23] 直播观众互动的屏幕面板（`ViewerLive`）。
 *   · 打仗时右侧常显：玩法一句话、两边各多少人站队、排队名单、最近几条记录——给直播间观众看。
 *   · 按 F9 展开测试区：输入观众名，点「站攻方 / 站守方」、点六个字放计、勾「付费」——本地模拟弹幕，
 *     不用开直播就能试整套玩法。以后接上直播平台，消息走同一个 `ViewerLive.onChat`。
 *   · [2026-10-24] 接上直播间（SocialStreamBridge）后不打仗也常显；F9 里填 SSN 会话 ID、看连接状态、模拟打赏。
 *   · [2026-10-25] 免费模式（军令）：显示规矩、全场点赞 / 订阅目标、最近挣到令的几个人；F9 填 YouTube 接口，模拟点赞 / 订阅。
 */
import { type ViewerLive, ORDERS_PER_CAST, CHAT_COOLDOWN_MS } from './ViewerLive';
import type { SocialStreamBridge } from './SocialStreamBridge';

const PANEL_ID = 'viewer-live-panel';
const FONT = "'Noto Serif SC', 'SimSun', serif";
const WORDS = ['攻', '胜', '敌', '混', '并', '败'] as const;

export class ViewerLivePanel {
    private root: HTMLDivElement;
    private body: HTMLDivElement;
    private dev: HTMLDivElement;
    private devOpen = false;

    constructor(private readonly live: ViewerLive, private readonly link: SocialStreamBridge) {
        this.root = document.createElement('div');
        this.root.id = PANEL_ID;
        this.root.style.cssText = `
            position:fixed; right:16px; top:140px; z-index:10030; width:270px; display:none;
            background:rgba(16,12,9,0.82); border:1px solid rgba(212,175,55,0.5); border-radius:8px;
            padding:10px 12px; color:#f3e6c8; font-family:${FONT}; font-size:13px; line-height:1.55;
            box-shadow:0 8px 24px rgba(0,0,0,0.6);`;
        this.body = document.createElement('div');
        this.dev = document.createElement('div');
        this.dev.style.cssText = 'display:none; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(212,175,55,0.4);';
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
        const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
        const price = `打赏 <b>$${s.price / 100}</b> 马上放一计`;
        const g = s.goal;
        const goal = `<div style="margin-top:6px;color:#ffd700;">全场目标</div>
            <div>点赞 <b>${g.likeProg}/${g.likeStep}</b> → 在场每人 +1 令　｜　订阅 <b>${g.subs}</b>（涨 1 全场 +2 令）</div>
            <div style="height:6px;background:#3a2a16;border-radius:3px;overflow:hidden;margin:2px 0;"><div style="height:6px;width:${Math.min(100, Math.round(g.likeProg / g.likeStep * 100))}%;background:#d4af37;"></div></div>
            <div style="color:#a99;font-size:12px;">在线 ${g.viewers || '—'} 人　在场 ${g.present} 人</div>`;
        // 最近挣到令的人：让观众看见自己那条弹幕算上了；够一计的标金色
        const top = s.top.length
            ? `<div style="margin-top:6px;color:#ffd700;">军令</div><div>${s.top.map((t) =>
                `<span style="${t.n >= ORDERS_PER_CAST ?'color:#ffd700;' : ''}white-space:nowrap;">${esc(t.name)} <b>${t.n}</b></span>`).join('　')}</div>`
            : '';
        const platform = this.devOpen
            ? `<div style="color:#8fd3ff;font-size:12px;">${esc(s.platform)}${s.yt ? '　｜　' + esc(s.yt) : ''}</div>` : '';
        const log = s.log.slice(-4).map((l) => `<div style="color:#cdbb95">${esc(l)}</div>`).join('');
        if (!s.on) {
            this.body.innerHTML = `${platform}
                <div style="color:#ffd700;font-weight:900;font-size:14px;">发弹幕参战</div>
                <div>下一场战术战开打时：发 <b>1</b> 站攻方、<b>2</b> 站守方</div>
                <div>再发 <b>攻 胜 敌 混 并 败</b> 替本方放计</div>
                <div>开战后站队、发弹幕攒<b>军令</b>，点赞、订阅随时加令；<b>${ORDERS_PER_CAST} 令</b>放一计；${price}</div>
                ${goal}${top}
                <div style="margin-top:6px;">${log}</div>`;
            return;
        }
        const queue = s.queue.slice(0, 5).map((q, i) => `<div>${i + 1}. ${esc(q)}</div>`).join('') || '<div style="color:#a99">（没有人排队）</div>';
        this.body.innerHTML = `${platform}
            <div style="color:#ffd700;font-weight:900;font-size:14px;">发弹幕参战</div>
            <div>发 <b>1</b> 站 ${esc(s.names[0])}，发 <b>2</b> 站 ${esc(s.names[1])}</div>
            <div>再发 <b>攻 胜 敌 混 并 败</b> 替本方放计（也可一条发「1攻」）</div>
            <div>站队 +1 令，每 ${CHAT_COOLDOWN_MS / 1000} 秒发一条有效弹幕 +1 令，<b>${ORDERS_PER_CAST} 令</b>放一计；${price}</div>
            <div style="margin-top:6px;">${esc(s.names[0])} <b>${s.counts[0]}</b> 人　｜　${esc(s.names[1])} <b>${s.counts[1]}</b> 人</div>
            ${goal}${top}
            <div style="margin-top:6px;color:#ffd700;">排队</div>${queue}
            <div style="margin-top:6px;">${log}</div>`;
    }

    private buildDev(): void {
        const label = document.createElement('div');
        label.textContent = '测试（F9 收起）：模拟观众发弹幕';
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
        ssnLabel.textContent = 'SSN 会话 ID（回车生效）';
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
        ytLabel.textContent = 'YouTube 接口密钥 / 直播视频（回车生效）';
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
        this.dev.append(ssnLabel, ssn, ytLabel, ytKey, ytVideo, label, name, paidWrap,
            row(['1 站攻方', '2 站守方'], (w) => send(w[0])),
            row([...WORDS], send),
            // 模拟打赏：按昵称当观众 id，跟上面发字的是同一个人
            row(['打赏$1', '打赏$10'], (w) => {
                this.live.onPayment(name.value.trim() || '观众', name.value, w.includes('10') ? 1000 : 100, `测试${w}`);
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
