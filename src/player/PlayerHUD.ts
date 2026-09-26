/**
 * PlayerHUD —— 玩家面板（右侧）、据点对话框、提示条。纯 DOM，不碰引擎。
 */
import type { PlayerHero, PlayerAutoPlan } from './PlayerHero';
import type { PlayerQuestSystem } from './PlayerQuestSystem';
import type { DialoguePayload } from './PlayerQuestSystem';
import { heroKeyForRank, nextRankAfter, PLAYER_RANKS } from './PlayerConfig';
import { WAR_TYPES } from '../data/WarTypes';
import { getNavalShipChineseName } from '../types/NavalShipTiers';
import { uiPx, COMBAT_UI_TOKENS as T } from '../config/combat-ui-tokens';
import { applyPortraitAdjustToElement } from '../config/PortraitAdjust';
import { resolvePortraitSourceFacing } from '../config/portrait_defaults';
import { LegionPhalanxDrawer } from '../map/legion/LegionPhalanxDrawer';
import { isScriptPeriod } from '../events/scriptPeriod';

const FONT = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";

/**
 * 🔴 [2026-09-15 主人定]「改为 30 秒缩小，然后 1 分钟后再次展示，30 秒后再次缩小」——
 *    即战略地图上四面板**无限轮播**：展开 30s → 收起 60s → 展开 30s → …
 *
 * 为什么不再看「有没有势力」（原 2026-09-14 规则：没势力才展开、入伍后永不再展开）：
 *   主人明确「我这是自动直播，哪有手动」。自动直播里玩家开局几十秒就入伍、之后永久有势力，
 *   若沿用旧判据，这套轮播只在开局那一小段有效，整场直播四面板全程隐身 ——
 *   而观众恰恰是在**入伍之后**（跟着军团打仗）才最需要看军团/军情面板。
 *   旧判据的前提「没势力 = 玩家还在找武将、需要看信息」是给**人操作**设计的，自动直播里不成立。
 */
/** 轮播·展开停留时长（毫秒） */
const PANEL_CYCLE_EXPAND_MS = 30_000;
/** 轮播·收起停留时长（毫秒） */
const PANEL_CYCLE_COLLAPSE_MS = 60_000;

export class PlayerHUD {
    private panel: HTMLDivElement | null = null;
    private body: HTMLDivElement | null = null;
    private title: HTMLDivElement | null = null;
    private minimizeBtn: HTMLButtonElement | null = null;
    private drawerBtn: HTMLButtonElement | null = null;
    private minimized = true; // 默认划入上方收起
    private lastPanelFactionId: string | null | undefined = undefined;
    private panelsWereInScene13 = false;
    /** 轮播相位翻转计时（见 scheduleNextCyclePhase；dispose 时清） */
    private autoCollapseTimer: number | null = null;
    /** 🔴 [2026-09-15] 轮播当前处于「展开」还是「收起」相（进 13 时冻结，出来接着走） */
    private cyclePhaseExpanded = false;
    /** 🔴 [2026-09-15] 轮播是否已启动（只启一次，别每次 refresh 都重排计时） */
    private cycleStarted = false;
    private panelSizeObserver: ResizeObserver | null = null;
    private overlay: HTMLDivElement | null = null;
    private toast: HTMLDivElement | null = null;
    private toastTimer: number | null = null;
    private refreshTimer: number | null = null;
    /**
     * 🔴 [2026-09-24 主人「点不了呀，一点就缩回去了，你能设计得好点吗」]
     *    面板内容每秒整块重建（body.innerHTML = ''），下拉框一点开就被删掉换新，勾选框、按钮也常点空。
     *    现在：鼠标在面板上、或面板里的下拉框正打开着 → 不重建，只记「待刷新」；离开后立刻补上。
     *    自动轮播到点也一样先等你操作完再收。
     */
    private pointerInPanel = false;
    private refreshPending = false;
    /** 用户正在操作面板（鼠标在上面，或下拉框打开/获得焦点中） */
    private isUserInteracting(): boolean {
        if (this.pointerInPanel) return true;
        const ae = document.activeElement;
        return !!(ae && this.panel?.contains(ae) && ae.tagName === 'SELECT');
    }
    private flushPendingRefresh(): void {
        if (this.refreshPending && !this.isUserInteracting()) {
            this.refreshPending = false;
            this.refresh();
        }
    }
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
            // 🔴 [2026-09-15 主人定] 这三个面板（军团/军情/玩家）已改归**轮播规则**管
            //    （展开 30s / 收起 60s 往复，见 PANEL_CYCLE_*），不再归旧的「势力规则」。
            //    开播只是让 refresh 再跑一次；轮播相位与计时**不受开播影响**。
            //    置回 undefined 是为了不让下面那脚「势力变化 → 立即收起」被开播误触发。
            // 🔴 [2026-09-15 主人报障「开局的时候四个面板都展开」] 原来这里只说「下一次相位翻转
            //    会把它带回来」就不管了 —— 实测开播在 t≈5s 触发，把军团/军情/右下角三块收掉，
            //    而下一次翻转是 t=30s 翻到**收起**相，四面板要到 t=90s 才回来。
            //    开局那 30 秒的展开相等于没有。现在：**只要当前是展开相，就把四面板贴回展开**，
            //    开播收的那一下当场撤销。轮播相位与计时仍然不受影响。
            this.lastPanelFactionId = undefined;
            if (this.cycleStarted && this.cyclePhaseExpanded) this.applyCyclePhase(true);
            // 🔴 [2026-09-24 主人定] 剧本期右下角信息面板一直显示：开播收的那一下当场撤销
            //    （GameTimeHUD 的开播监听先注册、先收；这里后到，按剧本规则贴回展开）。
            // 🔴 [2026-09-26 主人「我说的隐藏是最小化，你要把展开的UI按钮留着呀」] 那条已被取代：
            //    剧本期右下角 HUD **就该是收起（最小化）的样子**（只剩展开按钮，点它去按「播放」开打），
            //    所以这里不再替它贴回展开 —— 交给 `GameApp.setCompanionPanelsExpanded` 的剧本期分支管。
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
            position:fixed; left:var(--army-panel-w, clamp(280px, 19vw, 360px)); right:var(--feed-panel-w, clamp(280px, 19vw, 360px)); top:0; z-index:10003;
            width:auto; padding:4px 10px; box-sizing:border-box;
            color:#f5e6c8; font-family:${FONT}; font-size:12px; line-height:1.35;
            background:rgba(20,16,12,0.95);
            backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
            border:1px solid rgba(212,175,55,0.55); border-top:none; border-radius:0 0 6px 6px;
            box-shadow:0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,235,170,0.12);
            pointer-events:auto; user-select:none;
            transition:transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            transform:translateY(-100%);
        `;

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
        panel.addEventListener('pointerenter', () => { this.pointerInPanel = true; });
        panel.addEventListener('pointerleave', () => {
            this.pointerInPanel = false;
            // 下拉框的选项列表会伸到面板外，此时焦点还在下拉框上 → 等它关掉（失焦）再刷新
            window.setTimeout(() => this.flushPendingRefresh(), 0);
        });
        panel.addEventListener('focusout', () => window.setTimeout(() => this.flushPendingRefresh(), 0));
        // 下拉框选完一项就交还焦点，面板随即刷新成新状态（否则焦点一直停在它上面，面板不更新）
        panel.addEventListener('change', (e) => {
            const t = e.target as HTMLElement | null;
            if (t?.tagName === 'SELECT') window.setTimeout(() => (t as HTMLSelectElement).blur(), 0);
        });
        this.panelSizeObserver = new ResizeObserver(() => {
            const bottom = panel.getBoundingClientRect().bottom;
            document.documentElement.style.setProperty('--player-hud-bottom', `${bottom}px`);
        });
        this.panelSizeObserver.observe(panel);
        this.body = body;
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
            this.panel.style.transform = this.minimized ? 'translateY(-100%)' : 'translateY(0)';
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

    /**
     * 🔴 [2026-09-15 主人定] 四面板轮播：展开 30s → 收起 60s → 往复，**无限循环**。
     *   四个面板一次收齐：玩家面板走 setMinimized，军团/军情/右下角信息面板走 setCompanionPanelsExpanded。
     *
     * ⚠️ 用「一次性 setTimeout + 到点再排下一个」而不是 setInterval：
     *    两相时长不等（30/60），setInterval 排不出来；且进 13 时要能整段暂停。
     */
    private applyCyclePhase(expanded: boolean): void {
        this.cyclePhaseExpanded = expanded;
        this.setMinimized(!expanded);
        this.deps.setCompanionPanelsExpanded(expanded);
    }

    /** 排下一次相位翻转；`expanded` = 当前相位，到点后翻到另一相 */
    private scheduleNextCyclePhase(): void {
        if (this.autoCollapseTimer !== null) {
            window.clearTimeout(this.autoCollapseTimer);
            this.autoCollapseTimer = null;
        }
        const hold = this.cyclePhaseExpanded ? PANEL_CYCLE_EXPAND_MS : PANEL_CYCLE_COLLAPSE_MS;
        this.autoCollapseTimer = window.setTimeout(() => {
            this.autoCollapseTimer = null;
            // 🔴 在 13 里不翻相：面板本来就 display:none，翻了观众也看不见，
            //    反而会把「刚回到战略地图就立刻收起」这种难看的时序做出来。
            //    直接原地重排，等回到战略地图再继续。
            if (this.deps.isScene13Active()) {
                this.scheduleNextCyclePhase();
                return;
            }
            // 用户正在操作面板：到点也先不收，1 秒后再看
            if (this.cyclePhaseExpanded && this.isUserInteracting()) {
                this.autoCollapseTimer = window.setTimeout(() => this.scheduleNextCycleRetry(), 1000);
                return;
            }
            // 第一个展开相走完 → 开局保护解除，之后「入伍即收起」那一脚才生效
            this.initialExpandDone = true;
            this.applyCyclePhase(!this.cyclePhaseExpanded);
            this.scheduleNextCyclePhase();
        }, hold);
    }

    /** 轮播到点时用户正在操作：等他操作完再翻相 */
    private scheduleNextCycleRetry(): void {
        this.autoCollapseTimer = null;
        if (this.isUserInteracting()) {
            this.autoCollapseTimer = window.setTimeout(() => this.scheduleNextCycleRetry(), 1000);
            return;
        }
        this.initialExpandDone = true;
        this.applyCyclePhase(!this.cyclePhaseExpanded);
        this.scheduleNextCyclePhase();
    }

    /**
     * 开局第一个展开相是否已走完。false = 还在开局那 30 秒里，
     * 此期间「入伍即收起」不许生效（见 kickCycleToCollapsed）。
     */
    private initialExpandDone = false;

    /** 启动轮播（幂等，只启一次）。开局从**展开**相起步，让观众先看一眼四面板。 */
    private startPanelCycle(): void {
        if (this.cycleStarted) return;
        this.cycleStarted = true;
        this.applyCyclePhase(true);
        this.scheduleNextCyclePhase();
    }

    /**
     * 🔴 [2026-09-15 主人定] 入伍加入势力那一刻**立即收起**（不等计时走完），
     *    然后从「收起 60s」重新起算，轮播照常接上。
     *    这一下不是多余的：它是个转场信号——面板唰地收起 = 「上路了」。
     *
     * 🔴 [2026-09-15 主人报障「开局的时候四个面板都展开」] **开局第一个展开相内不许踢收**。
     *    玩家开着自动模式，实测 t≈4~16s 就入伍拿到势力，这一脚正好落在开局那 30 秒里，
     *    观众根本没看到过四面板。第一个展开相走完（initialExpandDone）之后这脚才生效。
     */
    private kickCycleToCollapsed(): void {
        if (!this.initialExpandDone) return;
        if (this.isUserInteracting()) return;   // 正在操作面板：不当场收，轮播到点再收
        this.applyCyclePhase(false);
        this.scheduleNextCyclePhase();
    }

    /**
     * 🔴 [2026-09-15 主人定]「军团战败后，4 面板也不展开」——脱离势力那一刻**立即展开**，
     *    然后从「展开 30s」重新起算。
     *    与入伍那一脚是对称的一对转场信号：入伍 = 上路了，收起让路给画面；
     *    战败脱军 = 回到自由身，观众正需要看四面板（下一个目标是谁、场上什么局势）。
     *    改前这两种情况共用 kickCycleToCollapsed，于是战败后反而把面板收了 ——
     *    实测战败 3.34s 后四面板齐刷刷收起，正是主人报的那一幕。
     */
    private kickCycleToExpanded(): void {
        this.applyCyclePhase(true);
        this.scheduleNextCyclePhase();
    }

    public refresh(): void {
        if (!this.panel || !this.body) return;
        // 🔴 [2026-09-24 主人定] 剧本期不显示军团/军情面板（CSS body.script-period 藏），乱斗期照旧。
        //    每秒对齐一次：剧本打完自动切乱斗时，两块面板随之回来。
        document.body.classList.toggle('script-period', isScriptPeriod());
        const inScene13 = this.deps.isScene13Active();
        if (inScene13) {
            /* 🔴 [2026-09-17 主人报障「战术模式下右下角信息面板不缩小，应该缩小」]
             * 改之前这个分支**只标记 panelsWereInScene13、什么也不收**：玩家面板靠下面那行
             * display:none 自己藏了，军团/军情/右下角三个伙伴面板却原地保持进 13 那一刻的轮播相位
             * —— 撞上「展开 30s」那一相进 13，它们就整场战斗一直开着挡画面。
             * （佐证：panelsWereInScene13 这个字段在改之前全项目只被写、零处读，本该有的这段就是丢了。）
             *
             * 现在按既有设计「四个面板一次收齐」补上：进 13 那一刻把伙伴面板一并收起。
             * ⚠️ 必须用边沿检测（!panelsWereInScene13）：refresh 每秒跑一次 + onChange 还会额外触发，
             *    每次都调等于把主人在 13 里手动展开的面板每秒按回去。
             * ⚠️ 不碰轮播相位 cyclePhaseExpanded：它记的是战略地图上该是哪一相，
             *    出 13 时要照它恢复（见 else 分支），13 里的收起只是临时让位给战斗画面。
             */
            if (!this.panelsWereInScene13) this.deps.setCompanionPanelsExpanded(false);
            this.panelsWereInScene13 = true;
        } else {
            // 出 13 那一刻：把伙伴面板恢复成轮播当前该有的相位（13 里收起只是临时让位，不改相位本身）
            if (this.panelsWereInScene13) this.deps.setCompanionPanelsExpanded(this.cyclePhaseExpanded);
            // 🔴 [2026-09-15 主人定] 四面板在战略地图上**无限轮播**：展开 30s → 收起 60s → 往复。
            //    不再看「有没有势力」——主人「我这是自动直播，哪有手动」，旧那条
            //    （没势力才展开、入伍后永不再展开）在自动直播里等于全程隐身，见常量处注释。
            //    ⚠️ 这是这条规则的**唯一实现**，别在 PlayerHero 或别处再写一份（2026-09-10 我重复写过一次，已删）。
            this.startPanelCycle();
            // 入伍/脱离势力那一刻：立即收起 + 从「收起 60s」重新起算（转场信号）。
            //    lastPanelFactionId 初值 undefined ≠ null，但开局那一次已由 startPanelCycle
            //    置成展开相，所以这里只在**真正发生过势力变化**时才踢一脚。
            if (this.lastPanelFactionId !== undefined && this.lastPanelFactionId !== this.hero.factionId) {
                // 有势力 → 无势力 = 战败脱军，展开给观众看；无 → 有 = 入伍上路，收起让画面。
                if (this.hero.factionId) this.kickCycleToCollapsed();
                else this.kickCycleToExpanded();
            }
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
        // 用户正在操作面板：先不重建（重建会把打开的下拉框、正要点的按钮整个换掉）
        if (this.isUserInteracting()) { this.refreshPending = true; return; }

        const hero = this.hero;
        const rank = hero.getRank();
        const next = nextRankAfter(rank);
        const quest = this.quests.getQuest();
        const host = hero.getHostLegion();
        const factionName = hero.factionId ? this.deps.getFactionName(hero.factionId) : '独行';
        const travel = hero.getTravelCityId();
        const travelPoint = hero.getTravelPointLabel();
        const chasing = hero.isChasingArmy();
        const chaseName = hero.getChaseGeneralName();
        const state = host
            ? `随军 ${host.name}`
            : chasing
                ? `追击武将${chaseName ? `【${chaseName}】` : ''}（在外行军）`
                : travelPoint
                    ? `前往【${travelPoint}】`
                    : travel ? `前往【${this.deps.getCityName(travel)}】` : '独行，点据点前往';
        const questText = quest
            ? (quest.kind === 'restore'
                ? `助${quest.generalName}复国【${quest.cityName}】`
                // 🔴 [2026-09-19 主人定]「战场名称要写为XXX战役」——武将的那场史实战役照这条走，
                //    显示战役全称（如【格拉尼库斯河战役】），不显示战场地名给玩家当任务名。
                : quest.kind === 'general_event' && quest.event
                    ? `随${quest.generalName}赴【${quest.event.title}】`
                    : `随${quest.generalName}攻【${quest.targetCityName}】`)
            : travelPoint
                ? `奔赴【${travelPoint}】`
                : '到据点找武将';
        this.body.innerHTML = '';

        // ═══════════════════════════════════════════════════════════════
        // 单行布局：身份功勋 ｜ 动向任务 ｜ 控制开关 ｜ 兵装槽与折叠
        // ═══════════════════════════════════════════════════════════════
        const singleRow = document.createElement('div');
        singleRow.className = 'player-hud-single-row';

        // ── 1. 左区：名字/改名、官阶、倍率、功勋、势力 ──
        const secLeft = document.createElement('div');
        secLeft.className = 'player-hud-section';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-weight:900; font-size:12.5px; color:#e8c77e; letter-spacing:0.5px; white-space:nowrap;';
        nameSpan.textContent = `👤 ${hero.name}`;
        this.title = nameSpan as any;
        secLeft.appendChild(nameSpan);

        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.textContent = '✎';
        renameBtn.title = '修改玩家名称';
        renameBtn.style.cssText = 'cursor:pointer; background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.4); color:#dfc28c; font-size:11px; padding:1px 4px; border-radius:3px; line-height:1; font-family:inherit;';
        renameBtn.addEventListener('click', () => {
            const trimmed = prompt('请输入新的玩家名称：', hero.name)?.trim();
            if (!trimmed || trimmed === hero.name) return;
            hero.rename(trimmed);
            this.refresh();
        });
        secLeft.appendChild(renameBtn);

        const sep1 = document.createElement('span');
        sep1.className = 'player-hud-divider';
        sep1.textContent = '|';
        secLeft.appendChild(sep1);

        const rankSpan = document.createElement('span');
        rankSpan.style.cssText = 'color:#e8c77e; font-weight:700; white-space:nowrap;';
        rankSpan.title = rank.authority ? `职权：${rank.authority}` : '';
        rankSpan.textContent = rank.name;
        secLeft.appendChild(rankSpan);

        const powerSpan = document.createElement('span');
        powerSpan.style.cssText = 'color:#dfc28c; font-size:11px; white-space:nowrap;';
        powerSpan.textContent = `×${rank.powerMult.toFixed(1)}`;
        secLeft.appendChild(powerSpan);

        const meritSpan = document.createElement('span');
        meritSpan.style.cssText = 'color:#fffcee; font-size:11px; white-space:nowrap;';
        meritSpan.title = '功勋';
        meritSpan.textContent = next ? `${hero.merit.toLocaleString()}/${next.merit.toLocaleString()}` : hero.merit.toLocaleString();
        secLeft.appendChild(meritSpan);

        const sep2 = document.createElement('span');
        sep2.className = 'player-hud-divider';
        sep2.textContent = '|';
        secLeft.appendChild(sep2);

        const facSpan = document.createElement('span');
        facSpan.style.cssText = `color:${hero.factionId ? '#52c486' : '#ba9e7b'}; font-weight:700; white-space:nowrap;`;
        facSpan.textContent = factionName;
        secLeft.appendChild(facSpan);

        singleRow.appendChild(secLeft);

        // ── 2. 中区：动向状态与任务（自适应缩略） ──
        const secMid = document.createElement('div');
        secMid.className = 'player-hud-section-mid';

        const stateSpan = document.createElement('span');
        const stateColor = host ? '#f5a623' : '#f5e6c8';
        stateSpan.style.cssText = `color:${stateColor}; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;
        stateSpan.title = host ? '随军出征中，军团解散前不可离开' : state;
        stateSpan.textContent = `📍 ${state}`;
        secMid.appendChild(stateSpan);

        const sep3 = document.createElement('span');
        sep3.className = 'player-hud-divider';
        sep3.textContent = '|';
        secMid.appendChild(sep3);

        const questSpan = document.createElement('span');
        questSpan.style.cssText = `color:${quest ? '#ff8585' : '#ba9e7b'}; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;
        questSpan.title = `任务：${questText}`;
        questSpan.textContent = `🎯 ${questText}`;
        secMid.appendChild(questSpan);

        singleRow.appendChild(secMid);

        // ── 3. 控制区：自动模式、剧本/乱斗下拉、自动兵模、就近寻将、跟随视角 ──
        const secControls = document.createElement('div');
        secControls.className = 'player-hud-section';

        // 🤖 自动模式
        const autoLabel = document.createElement('label');
        autoLabel.style.cssText = 'display:flex; align-items:center; gap:3px; cursor:pointer; font-size:11px; color:#52c486; font-weight:700; user-select:none;';
        autoLabel.title = '开：自动寻找武将、自动入伍随军、自动接战；关：纯手动操作';
        const autoCheck = document.createElement('input');
        autoCheck.type = 'checkbox';
        autoCheck.checked = hero.autoMode;
        autoCheck.style.cssText = 'cursor:pointer; accent-color:#52c486; margin:0;';
        autoCheck.addEventListener('change', () => hero.setAutoMode(autoCheck.checked));
        autoLabel.appendChild(autoCheck);
        autoLabel.appendChild(document.createTextNode('🤖 自动'));
        secControls.appendChild(autoLabel);

        // 📜/⚔️ 自动模式玩法
        const planSel = document.createElement('select');
        planSel.title = '剧本模式：按历史顺序奔赴战场，全图不随机生军团、军团不自行寻敌，剧本全部打完自动转入乱斗；乱斗模式：完全不去战场，一直找武将入伍';
        planSel.disabled = false;
        planSel.style.cssText = 'cursor:pointer; font-size:11px; font-weight:700; color:#8ab4f8; background:#1b2333; border:1px solid #33415c; border-radius:4px; padding:1px 3px; height:22px;';
        for (const [val, text] of [['script', '📜 剧本'], ['melee', '⚔️ 乱斗']] as const) {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = text;
            if (hero.autoPlan === val) opt.selected = true;
            planSel.appendChild(opt);
        }
        planSel.addEventListener('change', () => hero.setAutoPlan(planSel.value as PlayerAutoPlan));
        secControls.appendChild(planSel);

        // 🎲 自动兵模
        const autoUnitLabel = document.createElement('label');
        autoUnitLabel.style.cssText = 'display:flex; align-items:center; gap:3px; cursor:pointer; font-size:11px; color:#dfc28c; font-weight:700; user-select:none;';
        autoUnitLabel.title = '开：随军时按军团统一兵模自动换，独行按 骑兵→战车→象兵→步兵 优选；关：只用你手选的兵模';
        const autoUnitCheck = document.createElement('input');
        autoUnitCheck.type = 'checkbox';
        autoUnitCheck.checked = hero.autoPickUnit;
        autoUnitCheck.style.cssText = 'cursor:pointer; accent-color:#d4af37; margin:0;';
        autoUnitCheck.addEventListener('change', () => hero.setAutoPickUnit(autoUnitCheck.checked));
        autoUnitLabel.appendChild(autoUnitCheck);
        autoUnitLabel.appendChild(document.createTextNode('🎲 自动兵模'));
        secControls.appendChild(autoUnitLabel);

        // 📍 就近寻将
        const nearLabel = document.createElement('label');
        nearLabel.style.cssText = 'display:flex; align-items:center; gap:3px; cursor:pointer; font-size:11px; color:#dfc28c; font-weight:700; user-select:none;';
        nearLabel.title = '开：只在身边一圈里抽签寻访，赶路最短；关：放宽到一州之地，更容易遇上别处的名将。两档都是加权抽签，不会死盯同一座城';
        const nearCheck = document.createElement('input');
        nearCheck.type = 'checkbox';
        nearCheck.checked = hero.nearbyFirst;
        nearCheck.style.cssText = 'cursor:pointer; accent-color:#d4af37; margin:0;';
        nearCheck.addEventListener('change', () => hero.setNearbyFirst(nearCheck.checked));
        nearLabel.appendChild(nearCheck);
        nearLabel.appendChild(document.createTextNode('📍 就近寻将'));
        secControls.appendChild(nearLabel);

        // 🎥 跟随视角
        if (this.deps.followCamera) {
            const followBtn = document.createElement('button');
            followBtn.type = 'button';
            const isF = this.deps.isFollowing?.() ?? false;
            followBtn.textContent = isF ? '🎥 跟随中' : '🎥 跟随';
            followBtn.title = isF ? '正在跟随玩家视角（点击取消）' : '点击对准并跟随玩家';
            followBtn.style.cssText = `
                cursor:pointer; font-size:11px; font-weight:700; padding:1px 5px; border-radius:4px; font-family:inherit;
                background:${isF ? 'rgba(82,196,134,0.22)' : 'rgba(212,175,55,0.14)'};
                color:${isF ? '#52c486' : '#dfc28c'};
                border:1px solid ${isF ? 'rgba(82,196,134,0.5)' : 'rgba(212,175,55,0.35)'};
                transition:all 0.2s ease; line-height:18px;
            `;
            followBtn.addEventListener('click', () => {
                if (this.deps.isFollowing?.()) {
                    this.deps.releaseCamera?.();
                } else {
                    this.deps.followCamera?.();
                }
                this.refresh();
            });
            secControls.appendChild(followBtn);
        }

        singleRow.appendChild(secControls);

        // ── 4. 右区：陆战下拉 + 战船下拉 + 收起按钮 ──
        const secRight = document.createElement('div');
        secRight.className = 'player-hud-section';

        // 陆战选择
        const uSel = document.createElement('select');
        uSel.style.cssText = `
            max-width:105px; font-family:inherit; font-size:11px; padding:1px 3px;
            background:rgba(35,28,20,0.92); color:#f5e6c8;
            border:1px solid rgba(212,175,55,0.45); border-radius:4px;
            outline:none; cursor:pointer; box-sizing:border-box; height:22px; margin:0 !important;
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
        const canPickUnit = hero.learnedUnits.length > 0;
        uSel.disabled = !canPickUnit;
        uSel.title = canPickUnit
            ? '选择陆战兵模（已获兵模终身可选用）'
            : '还没有收到任何兵模：加入军团即可获得';
        uSel.addEventListener('change', () => hero.selectUnit(Number(uSel.value)));
        secRight.appendChild(uSel);

        // 战船选择
        if (!hero.canPickShip()) {
            const shipDisplay = document.createElement('div');
            shipDisplay.style.cssText = `
                max-width:110px; font-size:11px; color:#9ec5e8; font-weight:700; height:22px; line-height:20px;
                padding:0 3px; background:rgba(25,22,18,0.7); border:1px solid rgba(212,175,55,0.25); border-radius:4px;
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap; box-sizing:border-box; margin:0 !important;
            `;
            shipDisplay.title = `随势力舰队出战：${getNavalShipChineseName(hero.shipKey)}`;
            shipDisplay.textContent = `⚓ ${getNavalShipChineseName(hero.shipKey)}`;
            secRight.appendChild(shipDisplay);
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
            sSel.title = '独行侠可自选水战战船';
            sSel.addEventListener('change', () => hero.selectShip(Number(sSel.value)));
            secRight.appendChild(sSel);
        }

        // 收起按钮
        const minBtn = document.createElement('button');
        minBtn.type = 'button';
        minBtn.textContent = this.minimized ? '▼' : '▲';
        minBtn.title = this.minimized ? '展开' : '收起';
        minBtn.style.cssText = 'cursor:pointer; background:transparent; border:none; color:#dfc28c; font-size:13px; font-weight:900; line-height:1; padding:0 2px; margin-left:2px; transition:color 0.2s;';
        minBtn.addEventListener('mouseenter', () => { minBtn.style.color = '#fffcee'; });
        minBtn.addEventListener('mouseleave', () => { minBtn.style.color = '#dfc28c'; });
        minBtn.addEventListener('click', () => this.toggleMinimize());
        this.minimizeBtn = minBtn;
        secRight.appendChild(minBtn);

        singleRow.appendChild(secRight);
        this.body.appendChild(singleRow);

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
            /* 🔴 [2026-09-16 主人定]「所有字幕都显示在下面」：操作提示原来吊在 top:110px，
               与下方的解说字幕条分居画面两端，观众得来回看。统一挪到下方，
               叠在解说字幕（SubtitleBanner，bottom:84px）之上，两条信息就近成一组。 */
            position:fixed; bottom:250px; left:50%; transform:translateX(-50%); z-index:10070; display:none;
            padding:8px 18px; font-family:${FONT}; font-size:14px; font-weight:700; color:#f5e6c8;
            background:rgba(20,16,12,0.9); border:1px solid rgba(212,175,55,0.55); border-radius:8px;
            box-shadow:0 4px 14px rgba(0,0,0,0.4); pointer-events:none; white-space:nowrap;`;
        document.body.appendChild(el);
        this.toast = el;
    }

    /**
     * @param scriptRelated 跟剧本直接有关的提示（战役背景字幕、剧本演完、赶赴战役失败、战场无路可达）。
     * 🔴 [2026-09-24 主人「这是剧本，跟剧本有关系吗，没关系的删除」] 剧本期只弹 scriptRelated 的提示，
     *    其余（兵模、官阶、功勋、抵达据点、离队……）一律不弹。乱斗期照旧全弹。
     */
    public notify(msg: string, durationMs = 4000, scriptRelated = false): (() => void) | void {
        if (!this.toast) return;
        if (isScriptPeriod() && !scriptRelated) return;
        // 🔴 [2026-09-24 主人「这种短时间，显示一下就没了的信息，都不要显示，显示就1秒，你显示它干什么」]
        //    一闪而过的短提示（默认 4 秒）一律不显示，剧本、乱斗都一样；
        //    只留按字数给足阅读时间的长段（战役背景解说在无声环境下的字幕）。
        if (durationMs <= 4000) return;
        this.toast.textContent = msg;
        this.toast.style.display = 'block';
        const longMessage = durationMs > 4000;
        this.toast.style.whiteSpace = longMessage ? 'normal' : 'nowrap';
        this.toast.style.width = longMessage ? 'min(680px, calc(100vw - 72px))' : 'auto';
        this.toast.style.lineHeight = longMessage ? '1.8' : 'normal';
        if (this.toastTimer) window.clearTimeout(this.toastTimer);
        const timer = window.setTimeout(() => { if (this.toast) this.toast.style.display = 'none'; }, durationMs);
        this.toastTimer = timer;
        return () => {
            // 不关闭后来覆盖上来的到达/参战提示。
            if (this.toastTimer !== timer) return;
            window.clearTimeout(timer);
            this.toastTimer = null;
            if (this.toast) this.toast.style.display = 'none';
        };
    }

    public dispose(): void {
        if (this.onStreamModeChange) window.removeEventListener('stream-mode-change', this.onStreamModeChange);
        this.panelSizeObserver?.disconnect();
        document.documentElement.style.removeProperty('--player-hud-bottom');
        if (this.refreshTimer) window.clearInterval(this.refreshTimer);
        // 🔴 [2026-09-15] 轮播计时也要清，否则 dispose 后它还会翻相位、去动已移除的面板
        if (this.autoCollapseTimer !== null) window.clearTimeout(this.autoCollapseTimer);
        this.closeDialogue();
        this.panel?.remove();
        this.toast?.remove();
    }
}
