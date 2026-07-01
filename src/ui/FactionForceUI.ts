import { CityManager } from '../world/CityManager';
import { FactionManager } from '../world/FactionManager';

const MAX_DISPLAY = 12;
const BAR_UPDATE_INTERVAL = 500;

interface FactionStat {
    id: string;
    name: string;
    troops: number;
    cities: number;
    color: string;
}

export class FactionForceUI {
    private panel: HTMLDivElement | null = null;
    private bodyEl: HTMLDivElement | null = null;
    private cityManager: CityManager | null = null;
    private factionManager: FactionManager | null = null;
    private getArmiesFn: (() => any[]) | null = null;
    private lastUpdateTime = 0;
    private prevStatsJson = '';

    constructor() {
        this.injectStyles();
        this.createPanel();
    }

    public init(
        cityManager: CityManager,
        factionManager: FactionManager,
        getArmiesFn: () => any[],
    ): void {
        this.cityManager = cityManager;
        this.factionManager = factionManager;
        this.getArmiesFn = getArmiesFn;
    }

    public update(): void {
        const now = performance.now();
        if (now - this.lastUpdateTime < BAR_UPDATE_INTERVAL) return;
        this.lastUpdateTime = now;
        this.refresh();
    }

    private computeStats(): FactionStat[] {
        if (!this.cityManager || !this.factionManager || !this.getArmiesFn) return [];

        const map = new Map<string, { troops: number; cities: number }>();
        const bump = (fid: string, troops: number, cities: number) => {
            if (!fid || fid === 'panjun') return;
            const e = map.get(fid) ?? { troops: 0, cities: 0 };
            e.troops += troops;
            e.cities += cities;
            map.set(fid, e);
        };

        for (const c of this.cityManager.getCities()) {
            bump(c.factionId, c.troops ?? 0, 1);
        }
        for (const a of this.getArmiesFn()) {
            if (a.isDestroyed) continue;
            bump(a.getFactionId?.() ?? '', a.getTroops?.() ?? 0, 0);
        }

        const stats: FactionStat[] = [];
        for (const [fid, v] of map) {
            if (v.troops <= 0 && v.cities <= 0) continue;
            stats.push({
                id: fid,
                name: this.factionManager.getFactionName(fid) || fid,
                troops: v.troops,
                cities: v.cities,
                color: this.factionManager.getFactionColor(fid) || '#888',
            });
        }
        stats.sort((a, b) => b.troops - a.troops);
        return stats.slice(0, MAX_DISPLAY);
    }

    private refresh(): void {
        if (!this.bodyEl) return;
        const stats = this.computeStats();
        const json = JSON.stringify(stats.map((s) => `${s.id}:${s.troops}:${s.cities}`));
        if (json === this.prevStatsJson) return;
        this.prevStatsJson = json;

        const maxTroops = stats.length > 0 ? stats[0].troops : 1;

        this.bodyEl.innerHTML = '';
        for (let i = 0; i < stats.length; i++) {
            const s = stats[i];
            const pct = maxTroops > 0 ? (s.troops / maxTroops) * 100 : 0;
            const row = document.createElement('div');
            row.className = 'flb-row';
            if (i < 3) row.classList.add(`flb-top${i + 1}`);

            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span class="flb-rank-num">${i + 1}</span>`;

            row.innerHTML = `
                <span class="flb-rank">${medal}</span>
                <span class="flb-color" style="background:${s.color};"></span>
                <span class="flb-name">${s.name}</span>
                <span class="flb-val">${this.fmt(s.troops)}</span>
                <span class="flb-cities">${s.cities}城</span>
                <div class="flb-bar-bg"><div class="flb-bar" style="width:${pct.toFixed(1)}%;background:${s.color};"></div></div>
            `;

            this.bodyEl.appendChild(row);
        }

        if (stats.length === 0) {
            this.bodyEl.innerHTML = '<div class="flb-empty">等待势力数据…</div>';
        }
    }

    private fmt(n: number): string {
        const t = Math.floor(n);
        if (t >= 10000) return `${(t / 10000).toFixed(1)}万`;
        return `${t}`;
    }

    private createPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'faction-leaderboard';
        panel.className = 'flb-panel';

        const header = document.createElement('div');
        header.className = 'flb-header';
        header.textContent = '⚔ 势力排行 ⚔';
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'flb-body';
        panel.appendChild(body);
        this.bodyEl = body;

        document.body.appendChild(panel);
        this.panel = panel;
    }

    private injectStyles(): void {
        if (document.getElementById('flb-styles')) return;
        const style = document.createElement('style');
        style.id = 'flb-styles';
        style.textContent = `
.flb-panel {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 900;
    width: 260px;
    background: linear-gradient(180deg, rgba(20,16,10,0.88), rgba(12,10,6,0.92));
    border: 1px solid rgba(180,140,60,0.45);
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    font-family: 'SimSun', 'Songti SC', serif;
    color: #e8dcc8;
    pointer-events: auto;
    backdrop-filter: blur(6px);
    overflow: hidden;
}
.flb-header {
    padding: 8px 12px;
    font-size: 13px;
    font-weight: bold;
    color: #d4a843;
    text-align: center;
    letter-spacing: 3px;
    border-bottom: 1px solid rgba(180,140,60,0.25);
    background: linear-gradient(90deg, transparent, rgba(180,140,60,0.08), transparent);
}
.flb-body {
    padding: 4px 0;
    max-height: 420px;
    overflow-y: auto;
}
.flb-body::-webkit-scrollbar { width: 4px; }
.flb-body::-webkit-scrollbar-thumb { background: rgba(180,140,60,0.3); border-radius: 2px; }
.flb-row {
    display: grid;
    grid-template-columns: 26px 12px 1fr auto auto;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 0 6px;
    padding: 5px 10px 4px;
    border-bottom: 1px solid rgba(80,60,30,0.15);
    transition: background 0.2s;
}
.flb-row:last-child { border-bottom: none; }
.flb-row:hover { background: rgba(180,140,60,0.1); }
.flb-top1 { background: linear-gradient(90deg, rgba(255,215,0,0.1), transparent); }
.flb-top2 { background: linear-gradient(90deg, rgba(192,192,192,0.07), transparent); }
.flb-top3 { background: linear-gradient(90deg, rgba(205,127,50,0.07), transparent); }
.flb-rank {
    font-size: 14px;
    text-align: center;
    grid-row: 1;
    grid-column: 1;
}
.flb-rank-num {
    font-size: 11px;
    color: #8a8070;
}
.flb-color {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.3);
    grid-row: 1;
    grid-column: 2;
}
.flb-name {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    grid-row: 1;
    grid-column: 3;
}
.flb-val {
    font-size: 12px;
    color: #e0c878;
    white-space: nowrap;
    text-align: right;
    grid-row: 1;
    grid-column: 4;
}
.flb-cities {
    font-size: 11px;
    color: #9a8f7a;
    white-space: nowrap;
    grid-row: 1;
    grid-column: 5;
    min-width: 30px;
    text-align: right;
}
.flb-bar-bg {
    grid-row: 2;
    grid-column: 3 / 6;
    height: 3px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    margin-top: 2px;
    overflow: hidden;
}
.flb-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
    opacity: 0.8;
}
.flb-empty {
    padding: 16px;
    text-align: center;
    color: #666;
    font-size: 12px;
}
`;
        document.head.appendChild(style);
    }
}
