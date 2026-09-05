/**
 * PlayerHUD —— 玩家面板（右侧）、据点对话框、提示条。纯 DOM，不碰引擎。
 */
import type { PlayerHero } from './PlayerHero';
import type { PlayerQuestSystem } from './PlayerQuestSystem';
import type { DialoguePayload } from './PlayerQuestSystem';
import { nextRankAfter } from './PlayerConfig';
import { uiPx, COMBAT_UI_TOKENS as T } from '../config/combat-ui-tokens';
import { applyPortraitAdjustToElement } from '../config/PortraitAdjust';
import { resolvePortraitSourceFacing } from '../config/portrait_defaults';

const FONT = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";

export class PlayerHUD {
    private panel: HTMLDivElement | null = null;
    private body: HTMLDivElement | null = null;
    private title: HTMLDivElement | null = null;
    private minimizeBtn: HTMLButtonElement | null = null;
    private minimized = false;
    private overlay: HTMLDivElement | null = null;
    private toast: HTMLDivElement | null = null;
    private toastTimer: number | null = null;
    private refreshTimer: number | null = null;
    private dialoguePauseTaken = false;

    constructor(
        private hero: PlayerHero,
        private quests: PlayerQuestSystem,
        private deps: {
            getFactionName(id: string): string;
            getCityName(id: string): string;
            isScene13Active(): boolean;
            pause: { isGamePaused(): boolean; setPaused(v: boolean): void };
            onLeaveHost(): void;
        },
    ) {
        this.createPanel();
        this.createToast();
        hero.onChange(() => this.refresh());
        quests.onChange(() => this.refresh());
        this.refreshTimer = window.setInterval(() => this.refresh(), 1000);
        this.refresh();
    }

    // ── 面板 ──────────────────────────────────────────────
    private createPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'player-hero-panel';
        panel.style.cssText = `
            position:fixed; right:16px; top:16px; z-index:10003;
            width:230px; padding:10px 14px; box-sizing:border-box;
            color:#f5e6c8; font-family:${FONT}; font-size:13px; line-height:1.5;
            background:rgba(20,16,12,0.94);
            backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
            border:1px solid rgba(212,175,55,0.55); border-radius:8px;
            box-shadow:0 6px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,235,170,0.12);
            pointer-events:auto; user-select:none;
        `;
        const titleRow = document.createElement('div');
        titleRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid rgba(212,175,55,0.25);';
        const title = document.createElement('div');
        title.style.cssText = 'font-weight:900; font-size:15px; letter-spacing:1px; color:#ffd700; text-shadow:0 1px 3px rgba(0,0,0,0.8);';
        title.textContent = `👤 ${this.hero.name}`;
        this.title = title;
        const minBtn = document.createElement('button');
        minBtn.type = 'button';
        minBtn.textContent = '▾';
        minBtn.title = '最小化';
        minBtn.style.cssText = 'cursor:pointer; background:transparent; border:none; color:#dfc28c; font-size:15px; font-weight:900; line-height:1; padding:2px 4px; transition:color 0.2s;';
        minBtn.addEventListener('mouseenter', () => { minBtn.style.color = '#fffcee'; });
        minBtn.addEventListener('mouseleave', () => { minBtn.style.color = '#dfc28c'; });
        minBtn.addEventListener('click', () => this.toggleMinimize());
        titleRow.appendChild(title);
        titleRow.appendChild(minBtn);
        panel.appendChild(titleRow);
        const body = document.createElement('div');
        panel.appendChild(body);
        document.body.appendChild(panel);
        this.panel = panel;
        this.body = body;
        this.minimizeBtn = minBtn;
    }

    private toggleMinimize(): void {
        this.minimized = !this.minimized;
        if (this.body) this.body.style.display = this.minimized ? 'none' : 'block';
        if (this.minimizeBtn) {
            this.minimizeBtn.textContent = this.minimized ? '▸' : '▾';
            this.minimizeBtn.title = this.minimized ? '展开' : '最小化';
        }
    }

    public refresh(): void {
        if (!this.panel || !this.body) return;
        if (this.title) this.title.textContent = `👤 ${this.hero.name}`;
        this.panel.style.display = this.deps.isScene13Active() ? 'none' : 'block';
        if (this.panel.style.display === 'none') return;

        const hero = this.hero;
        const rank = hero.getRank();
        const next = nextRankAfter(rank);
        const quest = this.quests.getQuest();
        const host = hero.getHostLegion();
        const factionName = hero.factionId ? this.deps.getFactionName(hero.factionId) : '无（独行）';
        const travel = hero.getTravelCityId();
        const state = host
            ? `随军 ${host.name}（${Math.floor(host.getTroops() / 10000 * 10) / 10}万）`
            : travel ? `前往【${this.deps.getCityName(travel)}】` : '独行，点据点前往';
        const questText = quest
            ? (quest.kind === 'restore'
                ? `助${quest.generalName}复国【${quest.cityName}】`
                : `随${quest.generalName}攻【${quest.targetCityName}】`)
            : '无（到据点找武将）';
        const row = (k: string, v: string, color = '#f5e6c8') =>
            `<div style="display:flex;justify-content:space-between;gap:8px;line-height:1.6;"><span style="color:#ba9e7b;font-weight:600;">${k}</span><span style="color:${color};font-weight:700;text-align:right;">${v}</span></div>`;
        let html = '';
        html += row('官阶', rank.name, '#ffd700');
        html += row('功勋', next ? `${hero.merit} / ${next.merit}（→${next.name}）` : `${hero.merit}（已至顶）`, '#fffcee');
        html += row('势力', factionName, hero.factionId ? '#52c486' : '#ba9e7b');
        html += row('状态', state, '#f5e6c8');
        html += row('任务', questText, quest ? '#ff8585' : '#ba9e7b');
        html += `<div style="margin-top:7px;margin-bottom:3px;color:#ba9e7b;font-size:12px;font-weight:600;">精锐战法（战术模式自领）</div>`;
        this.body.innerHTML = html;

        const select = document.createElement('select');
        select.style.cssText = `
            width:100%; margin-top:2px; font-family:inherit; font-size:12px; padding:3px 6px;
            background:rgba(35,28,20,0.92); color:#f5e6c8;
            border:1px solid rgba(212,175,55,0.45); border-radius:5px;
            outline:none; cursor:pointer; box-sizing:border-box;
        `;
        const none = document.createElement('option');
        none.value = '-1';
        none.textContent = hero.learnedElites.length ? '不带精锐' : '尚未学会（出征克城可学）';
        select.appendChild(none);
        hero.learnedElites.forEach((e, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `${e.name}（${e.factionName}）`;
            select.appendChild(opt);
        });
        select.value = String(hero.selectedElite);
        select.disabled = hero.learnedElites.length === 0 || rank.control === 'none';
        select.addEventListener('change', () => hero.selectElite(Number(select.value)));
        this.body.appendChild(select);
        if (rank.control === 'none') {
            const hint = document.createElement('div');
            hint.style.cssText = 'font-size:11px;color:#9e8a75;margin-top:3px;';
            hint.textContent = '斥候只管自己，升探马后可领一队';
            this.body.appendChild(hint);
        }

        // 自动模式开关
        const autoLabel = document.createElement('label');
        autoLabel.style.cssText = 'display:flex; align-items:center; gap:6px; margin-top:8px; cursor:pointer; font-size:12px; color:#52c486; font-weight:700;';
        const autoCheck = document.createElement('input');
        autoCheck.type = 'checkbox';
        autoCheck.checked = hero.autoMode;
        autoCheck.style.cssText = 'cursor:pointer; accent-color:#d4af37;';
        autoCheck.addEventListener('change', () => hero.setAutoMode(autoCheck.checked));
        autoLabel.appendChild(autoCheck);
        autoLabel.appendChild(document.createTextNode('🤖 自动模式（自动入伍征战）'));
        this.body.appendChild(autoLabel);

        if (host) {
            const note = document.createElement('div');
            note.style.cssText = 'margin-top:8px; font-size:11px; color:#ff8585; text-align:center; font-weight:bold;';
            note.textContent = '随军出征中，军团覆灭前不可离开';
            this.body.appendChild(note);
        }
        const tip = document.createElement('div');
        tip.style.cssText = 'font-size:11px;color:#8a7a66;margin-top:8px;border-top:1px dashed rgba(212,175,55,0.25);padding-top:5px;line-height:1.4;';
        tip.textContent = '战术模式：WASD/方向键 移动，点地面前往；Q 全军攻击，E 待命';
        this.body.appendChild(tip);
    }

    // ── 对话 ──────────────────────────────────────────────
    public showDialogue(p: DialoguePayload): void {
        this.closeDialogue();
        if (!this.deps.pause.isGamePaused()) {
            this.deps.pause.setPaused(true);
            this.dialoguePauseTaken = true;
        }
        const overlay = document.createElement('div');
        overlay.id = 'player-dialogue-overlay';
        overlay.style.cssText = `
            position:fixed; inset:0; z-index:10060; display:flex; align-items:flex-end; justify-content:flex-start;
            background:rgba(10,8,6,0.45); pointer-events:auto;`;

        // 立绘：直接套用战斗面板同款立绘逻辑与调校（四缘渐隐融入地图 + 投影 + F2调校参数 + 朝向镜像）
        if (p.portrait) {
            const f = T.portraitEdgeFade;
            const hmask = `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
            const vmask = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
            const wrap = document.createElement('div');
            wrap.style.cssText = `
                flex:0 0 auto; align-self:flex-end; height:${uiPx(550)}; overflow:visible;
                filter:drop-shadow(0 20px 30px rgba(0,0,0,0.8)); pointer-events:none;
                transform-origin: center bottom;`;
            const clip = document.createElement('div');
            clip.style.cssText = `
                height:100%; display:inline-block; overflow:hidden;
                -webkit-mask-image:${hmask}, ${vmask}; mask-image:${hmask}, ${vmask};
                -webkit-mask-composite:source-in; mask-composite:intersect;
                -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;`;

            // 战斗面板同款内部轻微渐隐，与外框柔化双重融合
            const innerFade = Math.max(1.5, Math.min(4.5, T.portraitEdgeFade * 0.35));
            const innerH = `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${innerFade}%, rgba(0,0,0,1) calc(100% - ${innerFade}%), rgba(0,0,0,0) 100%)`;
            const innerV = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${innerFade}%, rgba(0,0,0,1) calc(100% - ${innerFade}%), rgba(0,0,0,0) 100%)`;
            const innerMask = `${innerH}, ${innerV}`;

            const img = document.createElement('img');
            img.src = p.portrait;
            img.alt = p.speaker;
            img.style.cssText = `
                height:100%; width:auto; display:block; pointer-events:auto;
                -webkit-mask-image:${innerMask}; mask-image:${innerMask};
                -webkit-mask-composite:source-in; mask-composite:intersect;
                -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;`;

            const onImgLoad = () => {
                // 1. 朝向处理：立绘位于屏幕左侧，理应面向右侧的对话框
                // 若原图朝左，则进行镜像翻转 scaleX(-1)，使目光注视对话框
                const facing = resolvePortraitSourceFacing(undefined, p.portrait!);
                if (facing === 'left') {
                    wrap.style.transform = 'scaleX(-1)';
                } else {
                    wrap.style.transform = 'none';
                }
                // 2. 直接套用战斗面板完全一致的调校（缩放、偏移、胸线/眼线中心）
                applyPortraitAdjustToElement(img, p.portrait!);
            };

            if (img.complete && img.naturalWidth > 0) {
                onImgLoad();
            } else {
                img.addEventListener('load', onImgLoad, { once: true });
            }
            img.addEventListener('error', () => { wrap.style.display = 'none'; });

            clip.appendChild(img);
            wrap.appendChild(clip);
            overlay.appendChild(wrap);
        }

        // 对话框：底部、立绘右侧（黑金风格升级）
        const box = document.createElement('div');
        box.style.cssText = `
            display:flex; flex-direction:column; gap:10px; width:min(560px, 58vw); margin:0 0 28px 18px; padding:16px 20px; box-sizing:border-box;
            font-family:${FONT}; color:#f5e6c8;
            background:rgba(20,16,12,0.95);
            backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
            border:1px solid rgba(212,175,55,0.6); border-radius:10px;
            box-shadow:0 10px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,235,170,0.15);`;
        box.innerHTML = `
            <div style="font-size:18px;font-weight:900;color:#ffd700;letter-spacing:1px;text-shadow:0 1px 3px rgba(0,0,0,0.8);">${p.speaker}
                <span style="font-size:12px;color:#52c486;margin-left:8px;font-weight:700;">${p.factionName}</span></div>
            <div style="font-size:14px;line-height:1.8;color:#f5e6c8;">${p.text}</div>`;
        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-top:4px;';
        for (const opt of p.options) {
            const b = document.createElement('button');
            b.textContent = opt.label;
            b.style.cssText = opt.accent
                ? 'padding:6px 18px; cursor:pointer; font-family:inherit; font-weight:900; font-size:14px; color:#fffcee; background:rgba(156,48,47,0.85); border:1px solid rgba(212,175,55,0.6); border-radius:6px; transition:all 0.2s;'
                : 'padding:6px 18px; cursor:pointer; font-family:inherit; font-weight:700; font-size:14px; color:#dfc28c; background:rgba(35,28,20,0.85); border:1px solid rgba(212,175,55,0.35); border-radius:6px; transition:all 0.2s;';
            b.addEventListener('mouseenter', () => {
                b.style.borderColor = 'rgba(212,175,55,0.85)';
                b.style.filter = 'brightness(1.15)';
            });
            b.addEventListener('mouseleave', () => {
                b.style.borderColor = opt.accent ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.35)';
                b.style.filter = 'none';
            });
            b.addEventListener('click', () => opt.onPick());
            btns.appendChild(b);
        }
        // [2026-09-05 玩家] 抵达据点后弹出任务对话框，1 秒后自动确认（自动点接任务选项）
        const primary = p.options.find((o) => o.accent);
        if (primary) {
            window.setTimeout(() => {
                if (this.overlay) primary.onPick();
            }, 1000);
        }
        box.appendChild(btns);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    public closeDialogue(): void {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.dialoguePauseTaken) {
            this.dialoguePauseTaken = false;
            if (this.deps.pause.isGamePaused()) this.deps.pause.setPaused(false);
        }
    }

    // ── 提示 ──────────────────────────────────────────────
    private createToast(): void {
        const el = document.createElement('div');
        el.id = 'player-toast';
        el.style.cssText = `
            position:fixed; top:110px; left:50%; transform:translateX(-50%); z-index:10070; display:none;
            padding:8px 18px; font-family:${FONT}; font-size:14px; font-weight:700; color:#f5e6c8;
            background:rgba(20,16,12,0.9); border:1px solid rgba(212,175,55,0.55); border-radius:8px;
            box-shadow:0 4px 14px rgba(0,0,0,0.4); pointer-events:none; white-space:nowrap;`;
        document.body.appendChild(el);
        this.toast = el;
    }

    public notify(msg: string): void {
        if (!this.toast) return;
        this.toast.textContent = msg;
        this.toast.style.display = 'block';
        if (this.toastTimer) window.clearTimeout(this.toastTimer);
        this.toastTimer = window.setTimeout(() => { if (this.toast) this.toast.style.display = 'none'; }, 4000);
    }

    public dispose(): void {
        if (this.refreshTimer) window.clearInterval(this.refreshTimer);
        this.closeDialogue();
        this.panel?.remove();
        this.toast?.remove();
    }
}
