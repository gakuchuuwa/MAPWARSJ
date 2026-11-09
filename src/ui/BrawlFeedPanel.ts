import { TimeSystem } from '../app/TimeSystem';
import { formatBcYearChinese } from '../data/QinRegnalCalendar';
import { CityManager } from '../world/CityManager';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { REGION_LABELS, type RegionType } from '../systems/RegionSystem';
import { StreamModeToggle } from './StreamModeToggle';
import type { PlayerLifeLog, LifeEvent } from '../player/PlayerLifeLog';
import { downloadLifeStoryPack } from '../player/PlayerLifeStoryPack';

const SEASON_NAMES = ['春', '夏', '秋', '冬'] as const;

// 🔴 [2026-10-25 主人令「删除起义势力」] 原 panjun（起义占位）已删除；特殊势力只剩 panshu（叛军＝无主状态，
//    没有正规政权、不该判「被消灭」），故由 panshu 顶替旧 panjun 的位置。
const NON_ELIMINABLE_FACTIONS = new Set(['', 'panshu', 'neutral']);

function formatFeedTime(year: number, season: number): string {
    const seasonLabel = SEASON_NAMES[season] ?? SEASON_NAMES[0];
    return `${formatBcYearChinese(year)} ${seasonLabel}`;
}

/** 行首汉字徽章（2026-06-12 排版分级）：灭=朱砂 / 歼=暗红 / 复=青绿 / 征=鎏金 / 隘=常灰 / 占=藏青 */
function feedBadge(kind: 'fall' | 'wipe' | 'restore' | 'expedition' | 'pass' | 'occupy'): string {
    const char = { fall: '灭', wipe: '歼', restore: '复', expedition: '征', pass: '隘', occupy: '占' }[kind];
    return `<span class="feed-badge feed-badge--${kind}">${char}</span>`;
}

/** 🔴 [2026-10-20 主人令「没有武将的，一律都叫将军」] 取这支军团**自己的**武将（原取「势力名下第一个武将」，
 *  武将领兵在外照样被写成「率」这支军团，张冠李戴）；军团没有武将 → 「将军」。不在世武将的名字已由
 *  getGeneralRecordByGeneralId 换成「将军」。 */
function formatLegionWithGeneral(generalId: string | null | undefined, legionName: string | undefined): string {
    const legionStr = legionName || '据点军团';
    const generalStr = (generalId ? getGeneralRecordByGeneralId(generalId)?.generalName : undefined) || '将军';
    return `${generalStr} 率 ${legionStr}`;
}

function formatFactionFallLine(
    time: string,
    attackerFactionName: string,
    legionName: string,
    cityName: string,
    defenderFactionName: string
): string {
    return feedBadge('fall') +
           `<span class="feed-time">${escapeHtml(time)}</span>` +
           `<span class="feed-faction">${escapeHtml(attackerFactionName)}</span>` +
           `<span class="feed-legion">${escapeHtml(legionName)}</span>` +
           `<span class="feed-action">攻占</span>` +
           `<span class="feed-city">${escapeHtml(cityName)}</span>` +
           `<span class="feed-fall">${escapeHtml(defenderFactionName)}亡</span>`;
}

function formatLegionAnnihilatedLine(
    time: string,
    factionName: string,
    legionName: string,
    cityName: string
): string {
    return feedBadge('wipe') +
           `<span class="feed-time">${escapeHtml(time)}</span>` +
           `<span class="feed-faction">${escapeHtml(factionName)}</span>` +
           `<span class="feed-legion">${escapeHtml(legionName)}</span>` +
           `<span class="feed-action">于</span>` +
           `<span class="feed-city">${escapeHtml(cityName)}</span>` +
           `<span class="feed-action">外</span>` +
           `<span class="feed-wipe">全军覆没</span>`;
}

/** 年季 + 势力 + 于 + 据点 + 复国（势力=getFactionName，非旗面短名） */
function formatRestorationLine(
    time: string,
    factionName: string,
    cityName: string
): string {
    return feedBadge('restore') +
           `<span class="feed-time">${escapeHtml(time)}</span>` +
           `<span class="feed-faction">${escapeHtml(factionName)}</span>` +
           `<span class="feed-action">于</span>` +
           `<span class="feed-city">${escapeHtml(cityName)}</span>` +
           `<span class="feed-restore">复国</span>`;
}

/** 远征下令/功成（仅玩家跟拍军团会触发，低频大事） */
function formatExpeditionLine(
    time: string,
    legionName: string,
    cityName: string,
    kind: 'depart' | 'success'
): string {
    return feedBadge('expedition') +
           `<span class="feed-time">${escapeHtml(time)}</span>` +
           `<span class="feed-legion">${escapeHtml(legionName)}</span>` +
           `<span class="feed-action">${kind === 'depart' ? '誓师远征' : '远征功成，攻克'}</span>` +
           `<span class="feed-city">${escapeHtml(cityName)}</span>`;
}

function formatCityCaptureLine(
    time: string,
    factionName: string,
    legionName: string,
    regionName: string,
    cityName: string
): string {
    return feedBadge('occupy') +
           `<span class="feed-time">${escapeHtml(time)}</span>` +
           `<span class="feed-faction">${escapeHtml(factionName)}</span>` +
           `<span class="feed-legion">${escapeHtml(legionName)}</span>` +
           `<span class="feed-action">攻占</span>` +
           `<span class="feed-region">${escapeHtml(regionName)}</span>` +
           `<span class="feed-city">${escapeHtml(cityName)}。</span>`;
}

/** 关隘军情：时间 势力 军团 攻打 据点 */
function formatPassSiegeLine(
    time: string,
    factionName: string,
    legionName: string,
    cityName: string
): string {
    return feedBadge('pass') +
           `<span class="feed-time">${escapeHtml(time)}</span>` +
           `<span class="feed-faction">${escapeHtml(factionName)}</span>` +
           `<span class="feed-legion">${escapeHtml(legionName)}</span>` +
           `<span class="feed-action">攻打</span>` +
           `<span class="feed-city">${escapeHtml(cityName)}</span>` +
           `<span class="feed-action">，驻军据险而守。</span>`;
}

/**
 * 大乱斗右侧军情面板（#event-display）
 * 记录：势力灭亡、攻/守军团全军覆没、据点复国。
 */
export class BrawlFeedPanel {
    private root: HTMLElement | null = null;
    private contentEl: HTMLElement | null = null;
    private toggleBtn: HTMLElement | null = null;
    private drawerBtn: HTMLElement | null = null;
    private expanded = false; // 默认收起划入右侧
    private passSiegeCooldowns: Map<string, number> = new Map();
    private preScene13Expanded = false;
    /** 🔴 [2026-11-09 主人定] 面板分两页：履历（默认）／军情 */
    private lifeEl: HTMLElement | null = null;
    private feedPaneEl: HTMLElement | null = null;
    private tab: 'life' | 'feed' = 'life';
    private tabBtns: Partial<Record<'life' | 'feed', HTMLButtonElement>> = {};
    private lifeLog: PlayerLifeLog | null = null;
    private lifeSummary: (() => { name: string; rank: string; peakRank: string }) | null = null;
    private lifeUnsub: (() => void) | null = null;
    private lifeTimer: number | null = null;

    constructor(
        private timeSystem: TimeSystem,
        private cityManager: CityManager
    ) {}

    public isExpanded(): boolean {
        return this.expanded;
    }

    /** 进 13 战斗场景时保存状态并收起面板 */
    public onEnterBattleScene13(): void {
        if (this.expanded) {
            this.preScene13Expanded = true;
        }
        this.setExpanded(false);
    }

    /** 退 13 战斗场景时恢复展开状态 */
    public onExitBattleScene13(): void {
        if (this.preScene13Expanded) {
            this.preScene13Expanded = false;
            this.setExpanded(true);
        }
    }

    /** 设置展开/收起状态（由直播模式或手动点击调用） */
    setExpanded(expanded: boolean): void {
        this.expanded = expanded;
        this.root?.classList.toggle('collapsed', !expanded);
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = expanded ? '▶ 收起' : '◀ 展开';
            this.toggleBtn.title = expanded ? '收起面板' : '展开面板';
        }
        if (this.drawerBtn) {
            this.drawerBtn.innerHTML = expanded
                ? '▶<span class="drawer-label">收起</span>'
                : '◀<span class="drawer-label">军情</span>';
            this.drawerBtn.title = expanded ? '收起军情面板' : '展开军情面板';
        }
    }

    init(): void {
        this.root = document.getElementById('event-display');
        this.contentEl = document.getElementById('event-content');

        if (!this.root || !this.contentEl) {
            console.warn('⚠️ [BrawlFeedPanel] DOM not found');
            return;
        }

        this.root.classList.add('event-panel--brawl');

        // 内容区拆成两页：军情原样往 feedPane 里推，履历单独一页
        const outer = this.contentEl;
        outer.innerHTML = '';
        this.lifeEl = document.createElement('div');
        this.lifeEl.className = 'life-pane';
        this.lifeEl.addEventListener('click', (ev) => {
            const btn = (ev.target as HTMLElement | null)?.closest?.('[data-act="export-life"]');
            if (!btn || !this.lifeLog) return;
            const sum = this.lifeSummary?.() ?? { name: '主角', rank: '', peakRank: '' };
            const file = downloadLifeStoryPack(this.lifeLog, sum);
            (window as any).game?.playerHUD?.notify?.(`📜 已导出资料包：${file}（在「下载」文件夹）`);
        });
        this.feedPaneEl = document.createElement('div');
        this.feedPaneEl.className = 'feed-pane';
        outer.append(this.lifeEl, this.feedPaneEl);
        this.contentEl = this.feedPaneEl;

        const headerTitle = this.root.querySelector('.event-header span');
        if (headerTitle) {
            headerTitle.textContent = '';
            headerTitle.classList.add('feed-tabs');
            for (const [key, label] of [['life', '履历'], ['feed', '军情']] as const) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'feed-tab';
                b.textContent = label;
                b.addEventListener('click', () => this.setTab(key));
                headerTitle.appendChild(b);
                this.tabBtns[key] = b;
            }
        }
        this.setTab('life');
        const hero = (window as any).game?.playerHero;
        if (hero?.lifeLog) this.attachLifeLog(hero.lifeLog, () => ({ name: hero.name, rank: hero.getRank().name, peakRank: hero.getPeakRank().name }));

        this.toggleBtn = document.getElementById('toggle-event-list-btn');
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => {
                this.setExpanded(!this.expanded);
            });
        }

        // 侧边常驻外露抽屉按钮（折叠时贴在屏幕右边）
        const drawerBtn = document.createElement('button');
        drawerBtn.id = 'event-panel-drawer-btn';
        drawerBtn.type = 'button';
        drawerBtn.className = 'event-panel-drawer-btn';
        drawerBtn.innerHTML = '◀<span class="drawer-label">军情</span>';
        drawerBtn.title = '展开军情面板';
        drawerBtn.addEventListener('click', () => {
            this.setExpanded(!this.expanded);
        });
        this.root.appendChild(drawerBtn);
        this.drawerBtn = drawerBtn;

        // 默认划入右侧边不显示，除非点箭头
        this.setExpanded(false);

        // 监听直播模式切换
        // [2026-09-09 主人需求] 开播 → 收起（原来是开播即展开，方向反过来了）。
        // 关播不自动展开：那时主人在修游戏，面板开不开由他手点。
        window.addEventListener('stream-mode-change', (e: Event) => {
            const { on } = (e as CustomEvent<{ on: boolean }>).detail;
            if (on) this.setExpanded(false);
        });

        this.root.style.display = 'block';
        this.renderEmpty();
    }

    /** 切换页签 */
    public setTab(tab: 'life' | 'feed'): void {
        this.tab = tab;
        if (this.lifeEl) this.lifeEl.style.display = tab === 'life' ? '' : 'none';
        if (this.feedPaneEl) this.feedPaneEl.style.display = tab === 'feed' ? '' : 'none';
        for (const [k, b] of Object.entries(this.tabBtns)) b?.classList.toggle('feed-tab--on', k === tab);
        if (tab === 'life') this.renderLife();
    }

    /** 接上主角的一生履历（主角创建后由 GameApp 调；重复调只换绑定） */
    public attachLifeLog(log: PlayerLifeLog, summary: () => { name: string; rank: string; peakRank: string }): void {
        this.lifeUnsub?.();
        this.lifeLog = log;
        this.lifeSummary = summary;
        this.lifeUnsub = log.onChange(() => this.renderLife());
        // 年龄随游戏年份走、官职名随时会变：履历页开着时每 5 秒刷新一次抬头
        if (this.lifeTimer === null) {
            this.lifeTimer = window.setInterval(() => {
                if (this.tab === 'life' && this.expanded) this.renderLife();
            }, 5000);
        }
        this.renderLife();
    }

    private renderLife(): void {
        const el = this.lifeEl;
        if (!el) return;
        const log = this.lifeLog;
        if (!log) {
            el.innerHTML = '<div class="event-item event-item--hint">等待主角登场…</div>';
            return;
        }
        const sum = this.lifeSummary?.() ?? { name: '主角', rank: '', peakRank: '' };
        const t = log.getBattleTotals();
        const patron = log.getPatron();
        const rival = log.getRival();
        const head = `<div class="life-head">`
            + `<div class="life-head-name">${escapeHtml(sum.name)}<span class="life-head-sub">${log.getAge()}岁 · ${escapeHtml(sum.rank)}</span>`
            + `<button type="button" class="life-export-btn" data-act="export-life" title="把这一生的记录存成文件，剪视频、让 AI 写故事用">导出资料包</button></div>`
            + `<div class="life-head-stat">大战 ${t.battles} · 胜 ${t.wins} · 败 ${t.losses} · 斩敌 ${t.killed}</div>`
            + ((patron || rival)
                ? `<div class="life-head-stat">${patron ? `恩主 ${escapeHtml(patron.name)}` : ''}${patron && rival ? ' · ' : ''}${rival ? `宿敌 ${escapeHtml(rival.name)}` : ''}</div>`
                : '')
            + `</div>`;
        const events = log.getEvents();
        if (events.length === 0) {
            el.innerHTML = head + '<div class="event-item event-item--hint">一生尚未开始…</div>';
            return;
        }
        const rows: string[] = [];
        for (let i = events.length - 1, n = 0; i >= 0 && n < 300; i--, n++) rows.push(formatLifeLine(events[i]));
        el.innerHTML = head + rows.join('');
    }

    static isEliminableFaction(factionId: string | undefined): boolean {
        if (!factionId) return false;
        return !NON_ELIMINABLE_FACTIONS.has(factionId);
    }

    /** 攻占大城（重要据点，A 级） */
    pushCityCapture(params: {
        /** 这支军团自己的武将（无则播「将军」） */
        generalId?: string | null;
        attackerFactionId: string;
        legionName: string;
        regionKey?: string;
        cityName: string;
    }): void {
        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const displayLegion = formatLegionWithGeneral(params.generalId, params.legionName);
        const regionName = REGION_LABELS[params.regionKey as RegionType] || '未知区域';
        
        const line = formatCityCaptureLine(
            time,
            this.cityManager.getFactionName(params.attackerFactionId),
            displayLegion,
            regionName,
            params.cityName
        );
        this.pushFeedLine(line); // A tier
    }

    /** 势力灭亡：攻方占最后一城，守方势力亡（S 级，行级朱砂高亮） */
    pushFactionFall(params: {
        /** 这支军团自己的武将（无则播「将军」） */
        generalId?: string | null;
        attackerFactionId: string;
        legionName: string;
        defenderFactionId: string;
        cityName: string;
    }): void {
        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const displayLegion = formatLegionWithGeneral(params.generalId, params.legionName);
        const line = formatFactionFallLine(
            time,
            this.cityManager.getFactionName(params.attackerFactionId),
            displayLegion,
            params.cityName,
            this.cityManager.getFactionName(params.defenderFactionId)
        );
        this.pushFeedLine(line, 's');
    }

    /** 玩家出征下令/任务完成（S 级） */
    pushExpedition(params: {
        /** 这支军团自己的武将（无则播「将军」） */
        generalId?: string | null;
        factionId?: string;
        legionName: string;
        cityName: string;
        kind: 'depart' | 'success';
    }): void {
        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const displayLegion = formatLegionWithGeneral(params.generalId, params.legionName);
        this.pushFeedLine(
            formatExpeditionLine(time, displayLegion, params.cityName, params.kind),
            's'
        );
    }

    /** 攻方或守方军团于某据点全军覆没 */
    pushLegionAnnihilated(params: {
        /** 这支军团自己的武将（无则播「将军」） */
        generalId?: string | null;
        factionId: string;
        legionName: string;
        cityName: string;
    }): void {
        if (!BrawlFeedPanel.isEliminableFaction(params.factionId)) return;

        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const displayLegion = formatLegionWithGeneral(params.generalId, params.legionName);
        const line = formatLegionAnnihilatedLine(
            time,
            this.cityManager.getFactionName(params.factionId),
            displayLegion,
            params.cityName
        );
        this.pushFeedLine(line);
    }

    /** 异文化占领地起义：势力于该据点复国（面板显示势力全名，非旗号） */
    pushRestoration(params: {
        factionId: string;
        cityName: string;
    }): void {
        if (!BrawlFeedPanel.isEliminableFaction(params.factionId)) return;

        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const line = formatRestorationLine(
            time,
            this.cityManager.getFactionName(params.factionId),
            params.cityName
        );
        this.pushFeedLine(line);
    }

    /** 关隘被攻打（带 60 秒冷却防刷屏） */
    pushPassSiege(params: {
        /** 这支军团自己的武将（无则播「将军」） */
        generalId?: string | null;
        attackerFactionId: string;
        legionName: string;
        cityId: string;
        cityName: string;
    }): void {
        if (!BrawlFeedPanel.isEliminableFaction(params.attackerFactionId)) return;

        const now = Date.now();
        const last = this.passSiegeCooldowns.get(params.cityId) || 0;
        if (now - last < 60000) return; // 60s cooldown
        this.passSiegeCooldowns.set(params.cityId, now);

        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const displayLegion = formatLegionWithGeneral(params.generalId, params.legionName);
        const line = formatPassSiegeLine(
            time,
            this.cityManager.getFactionName(params.attackerFactionId),
            displayLegion,
            params.cityName
        );
        this.pushFeedLine(line); // A tier
    }

    /** @param tier 's' = 灭国/远征级大事（行级朱砂左条高亮），'a' = 常规军情 */
    private pushFeedLine(lineHtml: string, tier: 's' | 'a' = 'a'): void {
        if (!this.contentEl) return;

        this.contentEl.querySelector('.event-item--hint')?.remove();
        this.contentEl.querySelector('.event-item--current')?.classList.remove('event-item--current');

        const tierClass = tier === 's' ? ' feed-tier-s' : '';
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<div class="event-item animate-in event-item--current${tierClass}"><div class="event-desc event-desc--feed">${lineHtml}</div></div>`;
        const newEl = wrapper.firstElementChild as HTMLElement | null;
        if (!newEl) return;

        this.contentEl.prepend(newEl);

        const onSettled = () => {
            newEl.classList.remove('animate-in');
        };
        newEl.addEventListener('animationend', onSettled, { once: true });
        requestAnimationFrame(onSettled);

        while (this.contentEl.children.length > 1000) {
            this.contentEl.lastElementChild?.remove();
        }
    }

    private renderEmpty(): void {
        if (!this.contentEl) return;
        this.contentEl.innerHTML = '<div class="event-item event-item--hint">等待军情…</div>';
    }
}

const LIFE_BADGE: Record<string, string> = {
    start: '起', join: '投', leave: '离', promote: '升', demote: '贬', unit: '兵', rename: '名', title: '封',
};

function formatLifeLine(e: LifeEvent): string {
    const isBattle = e.kind === 'battle';
    const won = isBattle && e.data?.result === 'victory';
    const badge = isBattle ? (won ? '胜' : '败') : (LIFE_BADGE[e.kind] ?? '记');
    const badgeCls = isBattle ? (won ? 'life-badge--win' : 'life-badge--loss') : `life-badge--${e.kind}`;
    const big = e.kind === 'promote' || e.kind === 'title' || e.kind === 'start' || (isBattle && !won) || e.kind === 'demote';
    return `<div class="event-item life-item${big ? ' feed-tier-s' : ''}"><div class="event-desc event-desc--feed">`
        + `<span class="life-badge ${badgeCls}">${badge}</span>`
        + `<span class="feed-time">${escapeHtml(formatFeedTime(e.year, e.season))} ${e.age}岁</span>`
        + `<span class="life-text">${escapeHtml(e.text)}</span>`
        + `</div></div>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
