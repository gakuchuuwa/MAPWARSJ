/**
 * 🔴 [2026-10-23] 直播观众互动的屏幕面板（`ViewerLive`）。
 *   · 打仗时右侧常显：玩法一句话、两边各多少人站队、排队名单、最近几条记录——给直播间观众看。
 *   · 按 F9 展开测试区：输入观众名，点「站攻方 / 站守方」、点六个字放计、勾「付费」——本地模拟弹幕，
 *     不用开直播就能试整套玩法。以后接上直播平台，消息走同一个 `ViewerLive.onChat`。
 */
import type { ViewerLive } from './ViewerLive';

const PANEL_ID = 'viewer-live-panel';
const FONT = "'Noto Serif SC', 'SimSun', serif";
const WORDS = ['攻', '胜', '敌', '混', '并', '败'] as const;

export class ViewerLivePanel {
    private root: HTMLDivElement;
    private body: HTMLDivElement;
    private dev: HTMLDivElement;
    private devOpen = false;

    constructor(private readonly live: ViewerLive) {
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
        this.root.style.display = s.on || this.devOpen ? 'block' : 'none';
        if (this.root.style.display === 'none') return;
        const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
        const queue = s.queue.slice(0, 5).map((q, i) => `<div>${i + 1}. ${esc(q)}</div>`).join('') || '<div style="color:#a99">（没有人排队）</div>';
        const log = s.log.slice(-4).map((l) => `<div style="color:#cdbb95">${esc(l)}</div>`).join('');
        this.body.innerHTML = `
            <div style="color:#ffd700;font-weight:900;font-size:14px;">发弹幕参战</div>
            <div>发 <b>1</b> 站 ${esc(s.names[0])}，发 <b>2</b> 站 ${esc(s.names[1])}</div>
            <div>再发 <b>攻 胜 敌 混 并 败</b> 替本方放计，第一次免费</div>
            <div style="margin-top:6px;">${esc(s.names[0])} <b>${s.counts[0]}</b> 人　｜　${esc(s.names[1])} <b>${s.counts[1]}</b> 人</div>
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
        paidWrap.append(paid, document.createTextNode(' 这条是付费的'));
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
        this.dev.append(label, name, paidWrap,
            row(['1 站攻方', '2 站守方'], (w) => send(w[0])),
            row([...WORDS], send));
    }
}
