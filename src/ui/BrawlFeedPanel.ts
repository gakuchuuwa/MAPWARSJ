import { TimeSystem } from '../app/TimeSystem';
import { formatBcYearChinese } from '../data/QinRegnalCalendar';
import { CityManager } from '../world/CityManager';

const SEASON_NAMES = ['春', '夏', '秋', '冬'] as const;

const NON_ELIMINABLE_FACTIONS = new Set(['', 'panjun', 'neutral']);

function formatFeedTime(year: number, season: number): string {
    const seasonLabel = SEASON_NAMES[season] ?? SEASON_NAMES[0];
    return `${formatBcYearChinese(year)} ${seasonLabel}`;
}

/** 行首汉字徽章（2026-06-12 排版分级）：灭=朱砂 / 歼=暗红 / 复=青绿 / 征=鎏金 */
function feedBadge(kind: 'fall' | 'wipe' | 'restore' | 'expedition'): string {
    const char = { fall: '灭', wipe: '歼', restore: '复', expedition: '征' }[kind];
    return `<span class="feed-badge feed-badge--${kind}">${char}</span>`;
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

/**
 * 大乱斗右侧军情面板（#event-display）
 * 记录：势力灭亡、攻/守军团全军覆没、据点复国。
 */
export class BrawlFeedPanel {
    private root: HTMLElement | null = null;
    private contentEl: HTMLElement | null = null;
    private toggleBtn: HTMLElement | null = null;
    private expanded = true;

    constructor(
        private timeSystem: TimeSystem,
        private cityManager: CityManager
    ) {}

    init(): void {
        this.root = document.getElementById('event-display');
        this.contentEl = document.getElementById('event-content');

        if (!this.root || !this.contentEl) {
            console.warn('⚠️ [BrawlFeedPanel] DOM not found');
            return;
        }

        this.root.classList.add('event-panel--brawl');

        const headerTitle = this.root.querySelector('.event-header span');
        if (headerTitle) {
            headerTitle.textContent = '军情';
        }

        this.toggleBtn = document.getElementById('toggle-event-list-btn');
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = this.expanded ? '▲ 收起' : '▼ 展开';
            this.toggleBtn.title = this.expanded ? '收起面板' : '展开面板';

            this.toggleBtn.addEventListener('click', () => {
                this.expanded = !this.expanded;
                this.root?.classList.toggle('collapsed', !this.expanded);
                if (this.toggleBtn) {
                    this.toggleBtn.innerHTML = this.expanded ? '▲ 收起' : '▼ 展开';
                    this.toggleBtn.title = this.expanded ? '收起面板' : '展开面板';
                }
            });
        }

        this.root.style.display = 'block';
        this.renderEmpty();
    }

    static isEliminableFaction(factionId: string | undefined): boolean {
        if (!factionId) return false;
        return !NON_ELIMINABLE_FACTIONS.has(factionId);
    }

    /** 势力灭亡：攻方占最后一城，守方势力亡（S 级，行级朱砂高亮） */
    pushFactionFall(params: {
        attackerFactionId: string;
        legionName: string;
        defenderFactionId: string;
        cityName: string;
    }): void {
        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const line = formatFactionFallLine(
            time,
            this.cityManager.getFactionName(params.attackerFactionId),
            params.legionName,
            params.cityName,
            this.cityManager.getFactionName(params.defenderFactionId)
        );
        this.pushFeedLine(line, 's');
    }

    /** 远征下令/功成（ExpeditionUI / 行为树远征结算调用，S 级） */
    pushExpedition(params: {
        legionName: string;
        cityName: string;
        kind: 'depart' | 'success';
    }): void {
        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        this.pushFeedLine(
            formatExpeditionLine(time, params.legionName, params.cityName, params.kind),
            's'
        );
    }

    /** 攻方或守方军团于某据点全军覆没 */
    pushLegionAnnihilated(params: {
        factionId: string;
        legionName: string;
        cityName: string;
    }): void {
        if (!BrawlFeedPanel.isEliminableFaction(params.factionId)) return;

        const time = formatFeedTime(this.timeSystem.getYear(), this.timeSystem.getSeason());
        const line = formatLegionAnnihilatedLine(
            time,
            this.cityManager.getFactionName(params.factionId),
            params.legionName,
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

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
