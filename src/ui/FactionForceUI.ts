import { CityManager } from '../world/CityManager';
import { FactionManager } from '../world/FactionManager';

export class FactionForceUI {
    private listButton: HTMLButtonElement | null = null;
    private listPanel: HTMLDivElement | null = null;
    private isListOpen: boolean = false;

    private cityManager: CityManager | null = null;
    private getArmiesFn: (() => any[]) | null = null;
    private factionManager: FactionManager | null = null;

    private limitLabel: HTMLSpanElement | null = null;
    private listHeader: HTMLDivElement | null = null;
    private displayLimit: number = 20;

    constructor() {
        this.createListButton();
        this.createListPanel();
    }

    public init(
        cityManager: CityManager,
        factionManager: FactionManager,
        getArmiesFn: () => any[]
    ): void {
        this.cityManager = cityManager;
        this.factionManager = factionManager;
        this.getArmiesFn = getArmiesFn;
    }

    private createListButton(): void {
        const btn = document.createElement('button');
        btn.id = 'faction-force-list-btn';
        btn.title = '势力兵力排行榜';
        btn.innerHTML = '📊 势力';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 180px;
            z-index: 10000;
            padding: 10px 18px;
            font-size: 15px;
            font-weight: bold;
            color: #f0e6d2;
            background: linear-gradient(135deg, rgba(40,30,20,0.92), rgba(60,45,25,0.95));
            border: 2px solid rgba(180,140,60,0.7);
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
            transition: all 0.2s ease;
            font-family: 'SimSun', 'Songti SC', serif;
            letter-spacing: 2px;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = 'rgba(220,180,80,0.9)';
            btn.style.boxShadow = '0 4px 20px rgba(180,140,60,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(180,140,60,0.7)';
            btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
        });

        btn.addEventListener('click', () => this.toggleList());

        document.body.appendChild(btn);
        this.listButton = btn;
    }

    private createListPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'faction-force-list-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 180px;
            width: 280px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 10001;
            background: linear-gradient(180deg, rgba(30,22,12,0.96), rgba(20,15,8,0.98));
            border: 2px solid rgba(180,140,60,0.6);
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            display: none;
            font-family: 'SimSun', 'Songti SC', serif;
            color: #f0e6d2;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px 14px;
            font-size: 14px;
            font-weight: bold;
            border-bottom: 1px solid rgba(180,140,60,0.3);
            color: #d4a843;
            letter-spacing: 3px;
            text-align: center;
        `;
        header.textContent = '📈 势力兵力榜';
        panel.appendChild(header);
        this.listHeader = header;

        const limitContainer = document.createElement('div');
        limitContainer.style.cssText = `
            padding: 8px 14px;
            font-size: 13px;
            color: #d4a843;
            border-bottom: 1px solid rgba(180,140,60,0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const limitLabel = document.createElement('span');
        this.limitLabel = limitLabel;
        this.syncLimitLabel();

        const limitSlider = document.createElement('input');
        limitSlider.type = 'range';
        limitSlider.min = '10';
        limitSlider.max = '30';
        limitSlider.step = '1';
        limitSlider.value = String(this.displayLimit);
        limitSlider.style.width = '120px';

        limitSlider.addEventListener('input', (e) => {
            const raw = parseInt((e.target as HTMLInputElement).value, 10);
            this.displayLimit = Math.min(30, Math.max(10, Number.isFinite(raw) ? raw : 20));
            this.syncLimitLabel();
            if (this.isListOpen) this.refreshList();
        });

        limitContainer.appendChild(limitLabel);
        limitContainer.appendChild(limitSlider);
        panel.appendChild(limitContainer);

        const listContainer = document.createElement('div');
        listContainer.id = 'faction-force-list-items';
        listContainer.style.cssText = `padding: 4px 0;`;
        panel.appendChild(listContainer);

        document.body.appendChild(panel);
        this.listPanel = panel;
    }

    private syncLimitLabel(): void {
        if (!this.limitLabel) return;
        this.limitLabel.textContent = `显示前 ${this.displayLimit} 名`;
    }

    private toggleList(): void {
        this.isListOpen = !this.isListOpen;
        if (this.isListOpen) {
            this.refreshList();
            this.listPanel!.style.display = 'block';
        } else {
            this.listPanel!.style.display = 'none';
        }
    }

    public closeList(): void {
        this.isListOpen = false;
        if (this.listPanel) this.listPanel.style.display = 'none';
    }

    public update(): void {
        if (this.isListOpen) {
            this.refreshList();
        }
    }

    private refreshList(): void {
        const container = document.getElementById('faction-force-list-items');
        if (!container || !this.cityManager || !this.factionManager || !this.getArmiesFn) return;

        const activeFactions = new Set(this.cityManager.getCities().map(c => c.factionId));
        const armies = this.getArmiesFn();
        for (const army of armies) {
            if (!army.isDestroyed && army.getTroops() > 0) {
                activeFactions.add(army.getFactionId());
            }
        }

        const stats: { id: string; name: string; troops: number; color: string }[] = [];
        
        for (const fid of activeFactions) {
            if (fid === 'panjun') continue;

            const cityTroops = this.cityManager.getCitiesByFaction(fid).reduce((sum, c) => sum + c.troops, 0);
            const armyTroops = armies.filter(a => a.getFactionId() === fid && !a.isDestroyed).reduce((sum, a) => sum + (a.getTroops ? a.getTroops() : 0), 0);
            const total = cityTroops + armyTroops;
            
            if (total > 0) {
                stats.push({
                    id: fid,
                    name: this.factionManager.getFactionName(fid) || fid,
                    troops: total,
                    color: this.factionManager.getFactionColor(fid) || '#ffffff'
                });
            }
        }

        stats.sort((a, b) => b.troops - a.troops);
        const topStats = stats.slice(0, this.displayLimit);

        container.innerHTML = '';

        if (topStats.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = `
                padding: 20px 14px;
                text-align: center;
                color: #888;
                font-size: 13px;
            `;
            empty.textContent = '暂无势力数据';
            container.appendChild(empty);
            return;
        }

        for (let i = 0; i < topStats.length; i++) {
            const stat = topStats[i];
            const item = document.createElement('div');

            item.style.cssText = `
                padding: 8px 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(100,80,40,0.2);
                font-size: 13px;
            `;

            item.innerHTML = `
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:6px;">
                    <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${stat.color}; border:1px solid rgba(255,255,255,0.3);"></span>
                    ${i + 1}. ${stat.name}
                </span>
                <span style="color:#aaa; font-size:12px; margin-left:8px; white-space:nowrap;">
                    ${this.formatTroops(stat.troops)}
                </span>
            `;

            container.appendChild(item);
        }
    }

    private formatTroops(n: number): string {
        const t = Math.floor(n);
        if (t >= 10000) return (t / 10000).toFixed(1) + '万';
        return t.toString();
    }
}
