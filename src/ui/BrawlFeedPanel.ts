import { TimeSystem } from '../app/TimeSystem';
import { formatBcYearChinese } from '../data/QinRegnalCalendar';
import { Army } from '../legion/Army';
import { City } from '../types/core';
import { CityManager } from '../world/CityManager';

const SEASON_NAMES = ['春', '夏', '秋', '冬'] as const;

export interface BrawlAttackFeedEntry {
    year: number;
    season: number;
    attackerFactionName: string;
    legionName: string;
    defenderFactionName: string;
    cityName: string;
}

function formatFeedTime(year: number, season: number): string {
    const seasonLabel = SEASON_NAMES[season] ?? SEASON_NAMES[0];
    return `${formatBcYearChinese(year)} ${seasonLabel}`;
}

function formatAttackLine(entry: BrawlAttackFeedEntry): string {
    const time = formatFeedTime(entry.year, entry.season);
    return `<span class="feed-time">${escapeHtml(time)}</span>` +
           `<span class="feed-faction">${escapeHtml(entry.attackerFactionName)}</span>` +
           `<span class="feed-legion">${escapeHtml(entry.legionName)}</span>` +
           `<span class="feed-action">攻打</span>` +
           `<span class="feed-faction">${escapeHtml(entry.defenderFactionName)}</span>` +
           `<span class="feed-city">${escapeHtml(entry.cityName)}</span>`;
}

/**
 * 大乱斗右侧军情面板（#event-display）
 * 新消息从顶部插入，旧消息逐条下移；不删条目、不滚动。
 */
export class BrawlFeedPanel {
    private root: HTMLElement | null = null;
    private contentEl: HTMLElement | null = null;

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

        const toggleBtn = document.getElementById('toggle-event-list-btn');
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
        }

        this.root.style.display = 'block';
        this.renderEmpty();
    }

    /** 军团朝敌据点出发时追加一条「攻打」记录 */
    pushAttackMarch(army: Army, targetCity: City): void {
        const attackerFactionId = army.getFactionId();
        if (!attackerFactionId || attackerFactionId === 'neutral') return;
        if (!targetCity.factionId || targetCity.factionId === attackerFactionId) return;
        if (!this.contentEl) return;

        const entry: BrawlAttackFeedEntry = {
            year: this.timeSystem.getYear(),
            season: this.timeSystem.getSeason(),
            attackerFactionName: this.cityManager.getFactionName(attackerFactionId),
            legionName: army.name || '军团',
            defenderFactionName: this.cityManager.getFactionName(targetCity.factionId),
            cityName: targetCity.name,
        };

        this.contentEl.querySelector('.event-item--hint')?.remove();
        this.contentEl.querySelector('.event-item--current')?.classList.remove('event-item--current');

        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.renderLineBlock(entry, true);
        const newEl = wrapper.firstElementChild as HTMLElement | null;
        if (!newEl) return;

        this.contentEl.prepend(newEl);

        const onSettled = () => {
            newEl.classList.remove('animate-in');
        };
        newEl.addEventListener('animationend', onSettled, { once: true });
        requestAnimationFrame(onSettled);
    }

    private renderEmpty(): void {
        if (!this.contentEl) return;
        this.contentEl.innerHTML = '<div class="event-item event-item--hint">等待军情…</div>';
    }

    private renderLineBlock(entry: BrawlAttackFeedEntry, highlight: boolean): string {
        let cls = 'event-item animate-in';
        if (highlight) cls += ' event-item--current';
        const line = formatAttackLine(entry);
        return `<div class="${cls}"><div class="event-desc event-desc--feed">${line}</div></div>`;
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
