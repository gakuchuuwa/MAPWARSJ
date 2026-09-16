/**
 * PlayerHUD —— 玩家面板（右侧）、据点对话框、提示条。纯 DOM，不碰引擎。
 */
import type { PlayerHero } from './PlayerHero';
import type { PlayerQuestSystem } from './PlayerQuestSystem';
import type { DialoguePayload } from './PlayerQuestSystem';
import { heroKeyForRank, nextRankAfter, PLAYER_RANKS } from './PlayerConfig';
import { WAR_TYPES } from '../data/WarTypes';
import { getNavalShipChineseName } from '../types/NavalShipTiers';
import { uiPx, COMBAT_UI_TOKENS as T } from '../config/combat-ui-tokens';
import { applyPortraitAdjustToElement } from '../config/PortraitAdjust';
import { resolvePortraitSourceFacing } from '../config/portrait_defaults';
import { LegionPhalanxDrawer } from '../map/legion/LegionPhalanxDrawer';

const FONT = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";

export class PlayerHUD {
    private panel: HTMLDivElement | null = null;
    private body: HTMLDivElement | null = null;
    private title: HTMLDivElement | null = null;
    private minimizeBtn: HTMLButtonElement | null = null;
    private drawerBtn: HTMLButtonElement | null = null;
    private minimized = true; // 默认划入上方收起
    private lastPanelFactionId: string | null | undefined = undefined;
    private panelsWereInScene13 = false;
    private panelSizeObserver: ResizeObserver | null = null;
    private overlay: HTMLDivElement | null = null;
    private toast: HTMLDivElement | null = null;
    private toastTimer: number | null = null;
    private refreshTimer: number | null = null;
    private dialoguePauseTaken = false;
    private onStreamModeChange: ((e: Event) => void) | null = null;

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
            setCompanionPanelsExpanded(expanded: boolean): void;
        },
    ) {
        this.createPanel();
        this.createToast();
        hero.onChange(() => this.refresh());
        quests.onChange(() => this.refresh());
        this.refreshTimer = window.setInterval(() => this.refresh(), 1000);
        // [2026-09-09 主人需求] 开播 → 面板自动收起（关播不自动展开，留给主人手点）
        this.onStreamModeChange = (e: Event) => {
            if (!(e as CustomEvent<{ on: boolean }>).detail?.on) return;
            // 🔴 [2026-09-10 主人定「开局也是」] 开播那一下不再无条件收玩家面板。
            //    这三个面板（军团/军情/玩家）归**势力规则**管：没势力就展开、加入势力才缩小。
            //    开局玩家本来就没势力，若在这里强收，等于开播把主人要的展开状态又抹掉。
            //    做法是把 lastPanelFactionId 置回 undefined，让下面 refresh 的势力分支重新裁决一次。
            //    （右下角时间面板不在这三个之内，仍由 StreamModeToggle 按开播收起。）
            this.lastPanelFactionId = undefined;
            this.refresh();
        };
        window.addEventListener('stream-mode-change', this.onStreamModeChange);
        this.refresh();
    }

    // ── 面板 ──────────────────────────────────────────────
    private createPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'player-hero-panel';
        panel.classList.add('is-collapsed');
        panel.style.cssText = `
            position:fixed; left:50%; top:0; z-index:10003;
            width:min(920px, calc(100vw - 32px)); padding:10px 16px 8px; box-sizing:border-box;
            color:#f5e6c8; font-family:${FONT}; font-size:13px; line-height:1.4;
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
        this.setMinimized(!this.minimized);
    }

    /**
     * [2026-09-09 主人需求] 开播即最小化：直播中玩家面板不占画面。
     * 幂等，状态没变直接返回（refresh 每秒跑一次，不做无谓 DOM 写）。
     */
    public setMinimized(minimized: boolean): void {
        if (this.minimized === minimized) return;
        this.minimized = minimized;
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
        const inScene13 = this.deps.isScene13Active();
        if (inScene13) {
            this.panelsWereInScene13 = true;
        } else if (this.lastPanelFactionId !== this.hero.factionId || this.panelsWereInScene13) {
            // 🔴 [主人定] 没有势力 → 军团/军情/玩家三面板自动展开；加入势力 → 自动缩小。
            //    lastPanelFactionId 初值 undefined ≠ null，所以**开局第一次 refresh 就会应用一次**。
            //    ⚠️ 这是这条规则的**唯一实现**，别在 PlayerHero 或别处再写一份（2026-09-10 我重复写过一次，已删）。
            const expanded = !this.hero.factionId;
            this.setMinimized(!expanded);
            this.deps.setCompanionPanelsExpanded(expanded);
            this.lastPanelFactionId = this.hero.factionId;
            this.panelsWereInScene13 = false;
        }
        if (this.title) this.title.textContent = `👤 ${this.hero.name}`;
        if (this.drawerBtn) {
            const arrow = this.minimized ? '▼' : '▲';
            this.drawerBtn.innerHTML = `👤 ${this.hero.name} <span class="drawer-arrow">${arrow}</span>`;
        }
        this.panel.style.display = inScene13 ? 'none' : 'block';
        if (this.panel.style.display === 'none') return;

        const hero = this.hero;
        const rank = hero.getRank();
        const next = nextRankAfter(rank);
        const quest = this.quests.getQuest();
        const host = hero.getHostLegion();
        const factionName = hero.factionId ? this.deps.getFactionName(hero.factionId) : '独行';
        const travel = hero.getTravelCityId();
        const chasing = hero.isChasingArmy();
        const chaseName = hero.getChaseGeneralName();
        const state = host
            ? `随军 ${host.name}`
            : chasing
                ? `追击武将${chaseName ? `【${chaseName}】` : ''}（在外行军）`
                : travel ? `前往【${this.deps.getCityName(travel)}】` : '独行，点据点前往';
        const questText = quest
            ? (quest.kind === 'restore'
                ? `助${quest.generalName}复国【${quest.cityName}】`
                // 🔴 [2026-09-11 主人定 A 方案] 剧本任务显示**真历史目标**
                //    （如「随亚历山大进军格拉尼库斯」），不显示引擎那套「攻【某城】」
                : quest.scriptObjective
                    ? `随${quest.generalName}${quest.scriptObjective.label}`
                    : `随${quest.generalName}攻【${quest.targetCityName}】`)
            : '到据点找武将';
        this.body.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'player-hud-grid';
        grid.style.cssText = 'display:grid; grid-template-columns:1fr 1.15fr 1fr; gap:16px; align-items:start;';

        const row = (k: string, v: string, color = '#f5e6c8', title = '') =>
            `<div class="player-hud-row" ${title ? `title="${title}"` : ''} style="display:flex;justify-content:space-between;gap:8px;line-height:1.5;padding:2px 0;"><span style="color:#ba9e7b;font-weight:600;">${k}</span><span style="color:${color};font-weight:700;text-align:right;">${v}</span></div>`;

        // ── 第 1 列：身份与功勋 ──
        const col1 = document.createElement('div');
        col1.className = 'player-hud-col';
        let htmlCol1 = '';
        htmlCol1 += row('官阶', rank.name, '#e8c77e');
        htmlCol1 += row('战力', `第九环 ×${rank.powerMult.toFixed(1)}`, '#e8c77e');
        htmlCol1 += row('功勋', next ? `${hero.merit.toLocaleString()} / ${next.merit.toLocaleString()}` : hero.merit.toLocaleString(), '#fffcee');
        const authTitle = rank.control === 'none' ? '平民与斥候单枪匹马，升至探马后可领一队' : '';
        htmlCol1 += row('职权', rank.authority, '#9ec5e8', authTitle);
        htmlCol1 += row('势力', factionName, hero.factionId ? '#52c486' : '#ba9e7b');
        col1.innerHTML = htmlCol1;
        grid.appendChild(col1);

        // ── 第 2 列：动向与任务 ──
        const col2 = document.createElement('div');
        col2.className = 'player-hud-col';
        let htmlCol2 = '';
        const stateColor = host ? '#f5a623' : '#f5e6c8';
        const stateTitle = host ? '随军出征中，军团解散前不可离开' : '';
        htmlCol2 += row('状态', state, stateColor, stateTitle);
        htmlCol2 += row('任务', questText, quest ? '#ff8585' : '#ba9e7b');
        col2.innerHTML = htmlCol2;
        grid.appendChild(col2);

        // ── 第 3 列：兵模与战船（兵装槽） ──
        const col3 = document.createElement('div');
        col3.className = 'player-hud-col';

        const uTitle = document.createElement('div');
        uTitle.style.cssText = 'color:#ba9e7b; font-size:12px; font-weight:600; margin-bottom:4px;';
        uTitle.textContent = '我的兵装';
        col3.appendChild(uTitle);

        // 兵装插槽卡片：左侧 64x64 兵模预览，右侧紧凑放置陆战与战船选择
        const gearCard = document.createElement('div');
        gearCard.style.cssText = 'display:flex; align-items:center; gap:10px; background:rgba(25,20,15,0.45); padding:4px 6px; border:1px solid rgba(212,175,55,0.22); border-radius:6px; box-sizing:border-box;';

        // 兵模缩略图
        const preview = document.createElement('canvas');
        preview.width = 128;
        preview.height = 128;
        preview.style.cssText = 'display:block; width:64px; height:64px; flex-shrink:0; background:rgba(15,12,8,0.7); border:1px solid rgba(212,175,55,0.35); border-radius:4px; box-sizing:border-box;';
        this.renderUnitPreview(preview, hero.heroKey);
        gearCard.appendChild(preview);

        // 右侧选择器组合
        const gearSelects = document.createElement('div');
        gearSelects.style.cssText = 'flex:1; min-width:0; display:flex; flex-direction:column; gap:5px;';

        // 陆战选择行
        const landRow = document.createElement('div');
        landRow.style.cssText = 'display:flex; align-items:center; gap:6px;';
        const landTag = document.createElement('span');
        landTag.style.cssText = 'font-size:11px; color:#ba9e7b; font-weight:600; flex-shrink:0; width:26px;';
        landTag.textContent = '陆战';
        landRow.appendChild(landTag);

        const uSel = document.createElement('select');
        uSel.style.cssText = `
            flex:1; min-width:0; font-family:inherit; font-size:12px; padding:1px 5px;
            background:rgba(35,28,20,0.92); color:#f5e6c8;
            border:1px solid rgba(212,175,55,0.45); border-radius:4px;
            outline:none; cursor:pointer; box-sizing:border-box; height:24px; min-height:24px; margin:0 !important;
        `;
        if (!hero.learnedUnits.length) {
            const fallbackKey = heroKeyForRank(rank.id);
            const o = document.createElement('option');
            o.value = '-1';
            o.textContent = WAR_TYPES[fallbackKey]?.name ?? fallbackKey;
            uSel.appendChild(o);
        }
        hero.learnedUnits.forEach((u, i) => {
            const o = document.createElement('option');
            o.value = String(i);
            o.textContent = u.unitName;
            uSel.appendChild(o);
        });
        uSel.value = String(hero.selectedUnit);
        // 🔴 [2026-09-11 主人报「玩家面板中的我的兵装打不开」] 真因：这里原先把「能不能手选」绑在**官阶**上
        //   （`!autoPickUnit || 官阶 >= 斥候`），于是「自动兵模」开着时，**掉阶回平民**的玩家下拉被 disable、
        //   点不动（主人当时正是：布衣平民 + 已获骆驼骑兵）。
        //   而 docs/AGENTS/player-hero.md §2.3 明定：已获得兵模**终身保留、掉阶后「一律仍可选用」** ——
        //   这道官阶闸违反规则。现改为：**只要手上有兵模就能手选**；
        //   「自动兵模」只管「加入军团时自动换」，不再挡手选（它关掉时本就不自动换，规则见 §二·四）。
        const canPickUnit = hero.learnedUnits.length > 0;
        uSel.disabled = !canPickUnit;
        uSel.title = canPickUnit
            ? '选择出战兵模（已获兵模终身可选用；开着「自动兵模」时，加入新军团会再自动换成该军团的兵模）'
            : '还没有收到任何兵模：加入一支军团即可获得该军团的兵模';
        uSel.addEventListener('change', () => hero.selectUnit(Number(uSel.value)));
        landRow.appendChild(uSel);
        gearSelects.appendChild(landRow);

        // 战船选择行
        const seaRow = document.createElement('div');
        seaRow.style.cssText = 'display:flex; align-items:center; gap:6px;';
        const seaTag = document.createElement('span');
        seaTag.style.cssText = 'font-size:11px; color:#ba9e7b; font-weight:600; flex-shrink:0; width:26px;';
        seaTag.textContent = '战船';
        seaRow.appendChild(seaTag);

        if (!hero.canPickShip()) {
            const shipDisplay = document.createElement('div');
            shipDisplay.style.cssText = `
                flex:1; min-width:0; font-size:11.5px; color:#9ec5e8; font-weight:700; height:24px; line-height:22px;
                padding:0 6px; background:rgba(25,22,18,0.7); border:1px solid rgba(212,175,55,0.25); border-radius:4px;
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap; box-sizing:border-box; margin:0 !important;
            `;
            shipDisplay.title = `随势力舰队出战：${getNavalShipChineseName(hero.shipKey)}`;
            shipDisplay.textContent = `⚓ 随舰队 · ${getNavalShipChineseName(hero.shipKey)}`;
            seaRow.appendChild(shipDisplay);
        } else {
            const sSel = document.createElement('select');
            sSel.style.cssText = uSel.style.cssText;
            const opt0 = document.createElement('option');
            opt0.value = '-1';
            opt0.textContent = getNavalShipChineseName('CANOE');
            sSel.appendChild(opt0);
            hero.learnedShips.forEach((sh, i) => {
                const o = document.createElement('option');
                o.value = String(i);
                o.textContent = getNavalShipChineseName(sh);
                sSel.appendChild(o);
            });
            sSel.value = String(hero.selectedShip);
            sSel.disabled = hero.learnedShips.length === 0;
            sSel.title = '独行侠可自选水战坐骑战船';
            sSel.addEventListener('change', () => hero.selectShip(Number(sSel.value)));
            seaRow.appendChild(sSel);
        }
        gearSelects.appendChild(seaRow);
        gearCard.appendChild(gearSelects);
        col3.appendChild(gearCard);
        grid.appendChild(col3);

        this.body.appendChild(grid);

        // ── 底部横栏：控制开关 + 快捷操作提示 ──
        const footer = document.createElement('div');
        footer.className = 'player-hud-footer';
        footer.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:8px; padding-top:6px; border-top:1px dashed rgba(212,175,55,0.25); flex-wrap:wrap;';

        const ctrlRow = document.createElement('div');
        ctrlRow.className = 'player-hud-footer-controls';
        ctrlRow.style.cssText = 'display:flex; align-items:center; gap:14px; flex-shrink:0; flex-wrap:wrap;';

        // 🤖 自动模式
        const autoLabel = document.createElement('label');
        autoLabel.style.cssText = 'display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; color:#52c486; font-weight:700; user-select:none;';
        autoLabel.title = '开：自动寻找武将、自动入伍随军、自动接战；关：纯手动操作';
        const autoCheck = document.createElement('input');
        autoCheck.type = 'checkbox';
        autoCheck.checked = hero.autoMode;
        autoCheck.style.cssText = 'cursor:pointer; accent-color:#52c486;';
        autoCheck.addEventListener('change', () => hero.setAutoMode(autoCheck.checked));
        autoLabel.appendChild(autoCheck);
        autoLabel.appendChild(document.createTextNode('🤖 自动模式'));
        ctrlRow.appendChild(autoLabel);

        // 🎲 自动兵模
        const autoUnitLabel = document.createElement('label');
        autoUnitLabel.style.cssText = 'display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; color:#dfc28c; font-weight:700; user-select:none;';
        autoUnitLabel.title = '开：随军时按军团统一兵模自动换，独行按 骑兵→战车→象兵→步兵 优选；关：只用你手选的兵模';
        const autoUnitCheck = document.createElement('input');
        autoUnitCheck.type = 'checkbox';
        autoUnitCheck.checked = hero.autoPickUnit;
        autoUnitCheck.style.cssText = 'cursor:pointer; accent-color:#d4af37;';
        autoUnitCheck.addEventListener('change', () => hero.setAutoPickUnit(autoUnitCheck.checked));
        autoUnitLabel.appendChild(autoUnitCheck);
        autoUnitLabel.appendChild(document.createTextNode('🎲 自动兵模'));
        ctrlRow.appendChild(autoUnitLabel);

        // 📍 就近寻将
        const nearLabel = document.createElement('label');
        nearLabel.style.cssText = 'display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; color:#dfc28c; font-weight:700; user-select:none;';
        nearLabel.title = '开：优先寻访离自己最近的武将；关：在同等条件的武将中随机挑';
        const nearCheck = document.createElement('input');
        nearCheck.type = 'checkbox';
        nearCheck.checked = hero.nearbyFirst;
        nearCheck.style.cssText = 'cursor:pointer; accent-color:#d4af37;';
        nearCheck.addEventListener('change', () => hero.setNearbyFirst(nearCheck.checked));
        nearLabel.appendChild(nearCheck);
        nearLabel.appendChild(document.createTextNode('📍 就近寻将'));
        ctrlRow.appendChild(nearLabel);

        // 🚫 不出军团（[2026-09-11 主人定]「在玩家面板添加一个功能选项，默认不出军团」）
        const noLegionLabel = document.createElement('label');
        noLegionLabel.style.cssText = 'display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; color:#dfc28c; font-weight:700; user-select:none;';
        noLegionLabel.title = '开：全图不生任何军团，武将都留在城里；关：恢复常规募兵（开局首发属一次性事件，不会补跑）。乱斗开局默认关闭此项';
        const noLegionCheck = document.createElement('input');
        noLegionCheck.type = 'checkbox';
        noLegionCheck.checked = hero.noLegionSpawn;
        noLegionCheck.style.cssText = 'cursor:pointer; accent-color:#d4af37;';
        noLegionCheck.addEventListener('change', () => hero.setNoLegionSpawn(noLegionCheck.checked));
        noLegionLabel.appendChild(noLegionCheck);
        noLegionLabel.appendChild(document.createTextNode('🚫 不出军团'));
        ctrlRow.appendChild(noLegionLabel);

        if (this.deps.followCamera) {
            const followBtn = document.createElement('button');
            followBtn.type = 'button';
            const isF = this.deps.isFollowing?.() ?? false;
            followBtn.textContent = isF ? '🎥 跟随中' : '🎥 跟随视角';
            followBtn.title = isF ? '正在跟随玩家视角（点击取消）' : '点击对准并跟随玩家';
            followBtn.style.cssText = `
                cursor:pointer; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; font-family:inherit;
                background:${isF ? 'rgba(82,196,134,0.22)' : 'rgba(212,175,55,0.14)'};
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

        footer.appendChild(ctrlRow);

        // 精简操作提示
        const tip = document.createElement('div');
        tip.className = 'player-hud-footer-tip';
        tip.style.cssText = 'font-size:11px; color:#a89984; line-height:1.4; text-align:right; user-select:none;';
        tip.title = '战术模式操作：WASD / 方向键移动，点击地面前往；Q 切换自动作战，E 命令全军待命';
        tip.textContent = '⌨ 战术：WASD 移动 · Q 自动 · E 待命';
        footer.appendChild(tip);

        this.body.appendChild(footer);
    }

    /** 兵模预览：把玩家当前素材（key）的 IDLE 第 0 帧画到面板缩略图上。 */
    private renderUnitPreview(canvas: HTMLCanvasElement, key: string): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = canvas.width;
        ctx.clearRect(0, 0, size, size);
        const assets = LegionPhalanxDrawer.getUnitAssets(key);
        if (!assets) {
            LegionPhalanxDrawer.ensureUnitTypeLoading(key);
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = `${Math.max(10, Math.round(size * 0.14))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('载入中…', size / 2, size / 2);
            return;
        }
        // 南向（dir 3）是标准正面观，最直观；取不到就回退方向 0。
        const raw = assets.IDLE?.[3] ?? assets.IDLE?.[0];
        if (!raw || !raw.complete || raw.naturalWidth === 0) {
            LegionPhalanxDrawer.ensureUnitTypeLoading(key);
            if (raw && !raw.complete) {
                raw.addEventListener('load', () => this.renderUnitPreview(canvas, key), { once: true });
            }
            return;
        }
        const dynEntry = assets.dyn?.IDLE;
        const dynDir = dynEntry?.dirs?.['3'] ?? dynEntry?.dirs?.['0'];
        const frames = dynEntry ? dynEntry.frames : Math.max(1, Math.round(raw.naturalWidth / raw.naturalHeight));
        const fw = dynDir ? dynDir.fw : raw.naturalWidth / frames;
        const fh = dynDir ? dynDir.fh : raw.naturalHeight;
        const pad = Math.round(size * 0.08);
        const avail = size - pad * 2;
        const scale = Math.min(avail / fw, avail / fh);
        const dw = fw * scale;
        const dh = fh * scale;
        ctx.drawImage(raw, 0, 0, fw, fh, (size - dw) / 2, (size - dh) / 2, dw, dh);
    }

    // ── 对话 ──────────────────────────────────────────────
    public showDialogue(p: DialoguePayload): void {
        this.closeDialogue();
        // 🔴 [2026-09-11 二修] **暂停必须放在 overlay 挂进 DOM 之后**，挪回来这里就会复发
        //    「玩家一到据点游戏就重启」。链路：`setPaused(true)` 会**同步**触发
        //    TimeSystem.notifyPauseChange → ReloadGate 挂的 onPauseChange → 立刻 report()
        //    → shouldBlock() 去查 `#player-dialogue-overlay`。而那一刻 overlay 连
        //    createElement 都还没走到，查出来是 null → 判定「推演暂停且无人占用 = 主人在修游戏」
        //    → 开闸 → dev server 把积压的整页刷新当场发下来。5 秒心跳根本轮不上。
        //    见下面挂载处的暂停块。

        const overlay = document.createElement('div');
        // 🔴 这个 id 被开发期刷新闸门读（src/dev/ReloadGate.ts）：对话框自己 setPaused(true)，
        //    而闸门原判据「推演没在跑 = 主人在修游戏 → 放行整页刷新」会把弹着对话的这一局刷掉
        //    （2026-09-11 主人报「一到接任务那里游戏就重启」）。改 id 要同步改那边。
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
        // 🔴 挂进 DOM **之后**才暂停：这样 setPaused 同步触发的那次闸门上报能查到
        //    `#player-dialogue-overlay`，闸门保持关闭，整页刷新不会把这一局刷掉（见函数开头的说明）。
        //    ⚠️ 反过来 closeDialogue 里的 setPaused(false) 不需要这种保护：恢复运行后
        //    闸门判据第一项 running 就是 true，本来就是关的。
        if (!this.deps.pause.isGamePaused()) {
            this.deps.pause.setPaused(true);
            this.dialoguePauseTaken = true;
        }
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
        if (this.onStreamModeChange) window.removeEventListener('stream-mode-change', this.onStreamModeChange);
        this.panelSizeObserver?.disconnect();
        document.documentElement.style.removeProperty('--player-hud-bottom');
        if (this.refreshTimer) window.clearInterval(this.refreshTimer);
        this.closeDialogue();
        this.panel?.remove();
        this.toast?.remove();
    }
}
