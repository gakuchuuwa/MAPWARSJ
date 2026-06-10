import { HistoricalEvent } from '../types/core';
import { formatBcYearChinese } from '../data/QinRegnalCalendar';
const SEASON_NAMES = ['春', '夏', '秋', '冬'] as const;

function formatEventTime(event: HistoricalEvent): string {
    const season = SEASON_NAMES[event.season] ?? SEASON_NAMES[0];
    return `${formatBcYearChinese(event.year)} ${season}`;
}

/**
 * 右侧历史事件面板（#event-display / .event-panel）
 */
export class HistoricalEventPanel {
    private root: HTMLElement | null = null;
    private contentEl: HTMLElement | null = null;
    private toggleBtn: HTMLElement | null = null;
    private expanded = false;
    private events: HistoricalEvent[] = [];

    init(): void {
        this.root = document.getElementById('event-display');
        this.contentEl = document.getElementById('event-content');
        this.toggleBtn = document.getElementById('toggle-event-list-btn');

        if (!this.root || !this.contentEl) {
            console.warn('⚠️ [HistoricalEventPanel] DOM not found');
            return;
        }

        this.root.style.display = 'block';
        this.renderEmpty();

        this.toggleBtn?.addEventListener('click', () => {
            this.expanded = !this.expanded;
            this.root?.classList.toggle('expanded', this.expanded);
            if (this.toggleBtn) {
                this.toggleBtn.textContent = this.expanded ? '▲' : '▼';
                this.toggleBtn.title = this.expanded ? '隐藏历史事件' : '展示历史事件';
            }
            this.render();
        });
    }

    /** 新事件触发时追加 */
    pushEvent(event: HistoricalEvent): void {
        this.events.push(event);
        this.render();
    }

    /** 启动时灌入已有历史 */
    setHistory(events: HistoricalEvent[]): void {
        this.events = [...events];
        this.render();
    }

    private renderEmpty(): void {
        if (!this.contentEl) return;
        this.contentEl.innerHTML = '<div class="event-item event-item--hint">等待历史事件…</div>';
    }

    private render(): void {
        if (!this.contentEl) return;

        if (this.events.length === 0) {
            this.renderEmpty();
            return;
        }

        const latest = this.events[this.events.length - 1];

        if (!this.expanded) {
            this.contentEl.innerHTML = '';
            this.contentEl.style.display = 'none';
            return;
        }
        
        this.contentEl.style.display = 'block';

        const groups = new Map<string, HistoricalEvent[]>();
        for (let i = this.events.length - 1; i >= 0; i--) {
            const e = this.events[i];
            const key = `${e.year}-${e.season}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(e);
        }

        const parts: string[] = [];
        parts.push(this.renderEventBlock(latest, true));
        parts.push('<div class="event-history-divider">历史记录</div>');

        for (const [, groupEvents] of groups) {
            const head = groupEvents[0];
            parts.push(`<div class="event-time-group">${formatEventTime(head)}</div>`);
            for (const e of groupEvents) {
                parts.push(this.renderEventBlock(e, false));
            }
        }

        this.contentEl.innerHTML = parts.join('');
    }

    private renderEventBlock(event: HistoricalEvent, highlight: boolean): string {
        const title = event.title?.trim();
        const desc = event.description?.trim() || '（无描述）';
        const time = formatEventTime(event);
        const cls = highlight ? 'event-item event-item--current' : 'event-item';
        const titleHtml = title
            ? `<div class="event-title">${escapeHtml(title)}</div>`
            : '';
        return `
            <div class="${cls}">
                <div class="event-meta">${escapeHtml(time)}</div>
                ${titleHtml}
                <div class="event-desc">${escapeHtml(desc)}</div>
            </div>
        `;
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
