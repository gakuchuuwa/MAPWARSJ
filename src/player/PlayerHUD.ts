/**
 * PlayerHUD —— 玩家面板（右侧）、据点对话框、提示条。纯 DOM，不碰引擎。
 */
import type { PlayerHero } from './PlayerHero';
import type { PlayerQuestSystem } from './PlayerQuestSystem';
import type { DialoguePayload } from './PlayerQuestSystem';
import { nextRankAfter, PLAYER_RANKS } from './PlayerConfig';
import { uiPx, COMBAT_UI_TOKENS as T } from '../config/combat-ui-tokens';
import { applyPortraitAdjustToElement } from '../config/PortraitAdjust';
import { resolvePortraitSourceFacing } from '../config/portrait_defaults';

const FONT = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";

export class PlayerHUD {
    private panel: HTMLDivElement | null = null;
    private body: HTMLDivElement | null = null;
    private title: HTMLDivElement | null = null;
    private minimizeBtn: HTMLButtonElement | null = null;
    private drawerBtn: HTMLButtonElement | null = null;
    private minimized = true; // 默认划入上方收起
    private panelSizeObserver: ResizeObserver | null = null;
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
            followCamera?(): void;
            releaseCamera?(): void;
            isFollowing?(): boolean;
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
        panel.classList.add('is-collapsed');
        panel.style.cssText = `
            position:fixed; left:50%; top:0; z-index:10003;
            width:280px; padding:10px 14px 10px; box-sizing:border-box;
            color:#f5e6c8; font-family:${FONT}; font-size:13px; line-height:1.5;
            background:rgba(20,16,12,0.95);
            backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
            border:1px solid rgba(212,175,55,0.55); border-top:none; border-radius:0 0 10px 10px;
            box-shadow:0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,235,170,0.12);
            pointer-events:auto; user-select:none;
            transition:transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            transform:translate(-50%, -100%);
        `;
        const titleRow = document.createElement('div');
        titleRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid rgba(212,175,55,0.25);';
        
        const titleLeft = document.createElement('div');
        titleLeft.style.cssText = 'display:flex; align-items:center; gap:6px;';

        const title = document.createElement('div');
        title.style.cssText = 'font-weight:900; font-size:15px; letter-spacing:1px; color:#e8c77e; text-shadow:0 1px 3px rgba(0,0,0,0.8);';
        title.textContent = `👤 ${this.hero.name}`;
        this.title = title;
        titleLeft.appendChild(title);

        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.textContent = '✎ 改名';
        renameBtn.title = '修改玩家名称';
        renameBtn.style.cssText = 'cursor:pointer; background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.4); color:#dfc28c; font-size:11px; padding:2px 6px; border-radius:4px; line-height:1.2; font-family:inherit;';
        renameBtn.addEventListener('mouseenter', () => { renameBtn.style.color = '#fffcee'; renameBtn.style.background = 'rgba(212,175,55,0.3)'; });
        renameBtn.addEventListener('mouseleave', () => { renameBtn.style.color = '#dfc28c'; renameBtn.style.background = 'rgba(212,175,55,0.15)'; });
        renameBtn.addEventListener('click', () => {
            const trimmed = prompt('请输入新的玩家名称：', this.hero.name)?.trim();
            if (!trimmed || trimmed === this.hero.name) return;
            this.hero.rename(trimmed);
            this.refresh();
        });
        titleLeft.appendChild(renameBtn);

        const minBtn = document.createElement('button');
        minBtn.type = 'button';
        minBtn.textContent = '▲';
        minBtn.title = '收起面板';
        minBtn.style.cssText = 'cursor:pointer; background:transparent; border:none; color:#dfc28c; font-size:15px; font-weight:900; line-height:1; padding:2px 4px; transition:color 0.2s;';
        minBtn.addEventListener('mouseenter', () => { minBtn.style.color = '#fffcee'; });
        minBtn.addEventListener('mouseleave', () => { minBtn.style.color = '#dfc28c'; });
        minBtn.addEventListener('click', () => this.toggleMinimize());
        
        titleRow.appendChild(titleLeft);
        titleRow.appendChild(minBtn);
        panel.appendChild(titleRow);

        const body = document.createElement('div');
        body.className = 'player-hud-body';
        panel.appendChild(body);

        // 下缘常驻外露抽屉把手（默认折叠时贴在屏幕正上方中央）
        const drawerBtn = document.createElement('button');
        drawerBtn.id = 'player-panel-drawer-btn';
        drawerBtn.type = 'button';
        drawerBtn.className = 'player-panel-drawer-btn';
        drawerBtn.innerHTML = `👤 ${this.hero.name} <span class="drawer-arrow">▼</span>`;
        drawerBtn.title = '展开玩家面板';
        drawerBtn.addEventListener('click', () => this.toggleMinimize());
        panel.appendChild(drawerBtn);
        this.drawerBtn = drawerBtn;

        document.body.appendChild(panel);
        this.panel = panel;
        this.panelSizeObserver = new ResizeObserver(() => {
            const bottom = panel.getBoundingClientRect().bottom;
            document.documentElement.style.setProperty('--player-hud-bottom', `${bottom}px`);
        });
        this.panelSizeObserver.observe(panel);
        this.body = body;
        this.minimizeBtn = minBtn;
    }

    private toggleMinimize(): void {
        this.minimized = !this.minimized;
        if (this.panel) {
            this.panel.classList.toggle('is-collapsed', this.minimized);
            this.panel.style.transform = this.minimized ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
        }
        if (this.drawerBtn) {
            this.drawerBtn.innerHTML = this.minimized
                ? `👤 ${this.hero.name} <span class="drawer-arrow">▼</span>`
                : `👤 ${this.hero.name} <span class="drawer-arrow">▲</span>`;
            this.drawerBtn.title = this.minimized ? '展开玩家面板' : '收起玩家面板';
        }
        if (this.minimizeBtn) {
            this.minimizeBtn.textContent = this.minimized ? '▼' : '▲';
            this.minimizeBtn.title = this.minimized ? '展开' : '收起';
        }
    }

    public refresh(): void {
        if (!this.panel || !this.body) return;
        if (this.title) this.title.textContent = `👤 ${this.hero.name}`;
        if (this.drawerBtn) {
            const arrow = this.minimized ? '▼' : '▲';
            this.drawerBtn.innerHTML = `👤 ${this.hero.name} <span class="drawer-arrow">${arrow}</span>`;
        }
        this.panel.style.display = this.deps.isScene13Active() ? 'none' : 'block';
        if (this.panel.style.display === 'none') return;

        const hero = this.hero;
        const rank = hero.getRank();
        const next = nextRankAfter(rank);
        const quest = this.quests.getQuest();
        const host = hero.getHostLegion();
        const factionName = hero.factionId ? this.deps.getFactionName(hero.factionId) : '独行';
        const travel = hero.getTravelCityId();
        const state = host
            ? `随军 ${host.name}`
            : travel ? `前往【${this.deps.getCityName(travel)}】` : '独行，点据点前往';
        const questText = quest
            ? (quest.kind === 'restore'
                ? `助${quest.generalName}复国【${quest.cityName}】`
                : `随${quest.generalName}攻【${quest.targetCityName}】`)
            : '到据点找武将';
        const row = (k: string, v: string, color = '#f5e6c8') =>
            `<div class="player-hud-row" style="display:flex;justify-content:space-between;gap:8px;line-height:1.6;"><span style="color:#ba9e7b;font-weight:600;">${k}</span><span style="color:${color};font-weight:700;text-align:right;">${v}</span></div>`;
        let html = '';
        html += row('官阶', rank.name, '#e8c77e');
        html += row('战力', `第九环 ×${rank.powerMult.toFixed(1)}`, '#e8c77e');
        html += row('职权', rank.authority, '#9ec5e8');
        html += row('功勋', next ? `${hero.merit.toLocaleString()} / ${next.merit.toLocaleString()}` : hero.merit.toLocaleString(), '#fffcee');
        html += row('势力', factionName, hero.factionId ? '#52c486' : '#ba9e7b');
        html += row('状态', state, '#f5e6c8');
        html += row('任务', questText, quest ? '#ff8585' : '#ba9e7b');
        html += row('本势力兵种', hero.learnedUnits.length
            ? hero.learnedUnits.map((u) => u.unitName).join(' / ')
            : '尚未学会', hero.learnedUnits.length ? '#9ec5e8' : '#ba9e7b');
        html += `<div style="margin-top:7px;margin-bottom:3px;color:#ba9e7b;font-size:12px;font-weight:600;">我的兵种</div>`;
        this.body.innerHTML = html;

        // 🔴 [2026-09-07 主人定] 斥候学 1 个、探马学 2 个并**可自选**、先锋集齐 3 个。
        //    选中的兵种既是玩家在地图/13 里的素材，也决定战术模式能控哪些口（同兵种）。
        const uSel = document.createElement('select');
        uSel.style.cssText = `
            width:100%; margin-top:2px; margin-bottom:6px; font-family:inherit; font-size:12px; padding:3px 6px;
            background:rgba(35,28,20,0.92); color:#f5e6c8;
            border:1px solid rgba(212,175,55,0.45); border-radius:5px;
            outline:none; cursor:pointer; box-sizing:border-box;
        `;
        if (!hero.learnedUnits.length) {
            const o = document.createElement('option');
            o.value = '-1'; o.textContent = '近东民兵';
            uSel.appendChild(o);
        }
        hero.learnedUnits.forEach((u, i) => {
            const o = document.createElement('option');
            o.value = String(i);
            o.textContent = u.unitName;
            uSel.appendChild(o);
        });
        uSel.value = String(hero.selectedUnit);
        // 斥候只有一个兵种、且主人定「探马才可挑」→ 斥候阶段锁死
        const canPickUnit = hero.learnedUnits.length > 1
            && PLAYER_RANKS.findIndex((r) => r.id === rank.id) >= PLAYER_RANKS.findIndex((r) => r.id === 'outrider');
        uSel.disabled = !canPickUnit;
        uSel.addEventListener('change', () => hero.selectUnit(Number(uSel.value)));
        this.body.appendChild(uSel);
        if (!canPickUnit && hero.learnedUnits.length) {
            const h = document.createElement('div');
            h.style.cssText = 'font-size:12px;color:#b9ab95;margin-top:-4px;margin-bottom:6px;';
            h.textContent = '升至探马后可自选兵种素材';
            this.body.appendChild(h);
        }

        // 🔴 [2026-09-07 主人定「精锐战法是什么玩意，删除」] 面板里的「精锐战法」下拉已删。
        //    它选的是打城拿到的精锐番号（learnedElites → Scene13 自领编队 eliteLane），
        //    与新的「我的兵种」（本势力三排按官阶学，决定素材与受控编队）是两套东西，重复且难懂。
        //    ⚠️ 只删了面板入口；底层 learnedElites / eliteLane 仍在（出征克城照旧发奖励，存档不动）。
        //    要连底层一起拆，说一声。
        if (rank.control === 'none') {
            const hint = document.createElement('div');
            hint.style.cssText = 'font-size:12px;color:#b9ab95;margin-top:3px;';
            hint.textContent = '平民与斥候只管自己，升探马后可领一队';
            this.body.appendChild(hint);
        }

        // 控制栏：自动模式 + 视角跟随
        const ctrlRow = document.createElement('div');
        ctrlRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:8px;';

        const autoLabel = document.createElement('label');
        autoLabel.style.cssText = 'display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:#52c486; font-weight:700;';
        const autoCheck = document.createElement('input');
        autoCheck.type = 'checkbox';
        autoCheck.checked = hero.autoMode;
        autoCheck.style.cssText = 'cursor:pointer; accent-color:#d4af37;';
        autoCheck.addEventListener('change', () => hero.setAutoMode(autoCheck.checked));
        autoLabel.appendChild(autoCheck);
        autoLabel.appendChild(document.createTextNode('🤖 自动模式'));
        ctrlRow.appendChild(autoLabel);

        if (this.deps.followCamera) {
            const followBtn = document.createElement('button');
            followBtn.type = 'button';
            const isF = this.deps.isFollowing?.() ?? false;
            followBtn.textContent = isF ? '🎥 跟随中' : '🎥 跟随视角';
            followBtn.title = isF ? '正在跟随玩家视角（点击取消）' : '点击对准并跟随玩家';
            followBtn.style.cssText = `
                cursor:pointer; font-size:11px; font-weight:700; padding:2px 7px; border-radius:4px; font-family:inherit;
                background:${isF ? 'rgba(82,196,134,0.2)' : 'rgba(212,175,55,0.12)'};
                color:${isF ? '#52c486' : '#dfc28c'};
                border:1px solid ${isF ? 'rgba(82,196,134,0.5)' : 'rgba(212,175,55,0.35)'};
                transition:all 0.2s ease;
            `;
            followBtn.addEventListener('click', () => {
                if (this.deps.isFollowing?.()) {
                    this.deps.releaseCamera?.();
                } else {
                    this.deps.followCamera?.();
                }
                this.refresh();
            });
            ctrlRow.appendChild(followBtn);
        }

        this.body.appendChild(ctrlRow);

        if (host) {
            const note = document.createElement('div');
            note.style.cssText = 'margin-top:8px; font-size:12px; color:#ff8585; text-align:center; font-weight:bold;';
            note.textContent = '随军出征中，军团覆灭前不可离开';
            this.body.appendChild(note);
        }
        const tip = document.createElement('div');
        tip.style.cssText = 'font-size:12px;color:#b9ab95;margin-top:8px;border-top:1px dashed rgba(212,175,55,0.25);padding-top:5px;line-height:1.4;';
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
        // [2026-09-05 玩家] 抵达据点后弹出任务对话框，3 秒后自动确认（自动点接任务选项）
        const primary = p.options.find((o) => o.accent);
        if (primary) {
            window.setTimeout(() => {
                if (this.overlay) primary.onPick();
            }, 3000);
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
        this.panelSizeObserver?.disconnect();
        document.documentElement.style.removeProperty('--player-hud-bottom');
        if (this.refreshTimer) window.clearInterval(this.refreshTimer);
        this.closeDialogue();
        this.panel?.remove();
        this.toast?.remove();
    }
}
