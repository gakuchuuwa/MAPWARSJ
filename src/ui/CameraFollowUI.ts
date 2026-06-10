/**
 * CameraFollowUI.ts - 军团跟随视角 UI 模块
 * 
 * 提供：
 * 1. 右下角"军团列表"入口按钮
 * 2. 展开后的活跃军团选择列表（点击跟随）
 * 3. 跟随状态下顶部悬浮提示条（含取消按钮）
 */

import { GameConfig } from '../config/GameConfig';

export class CameraFollowUI {
    // DOM Elements
    private listButton: HTMLButtonElement | null = null;
    private listPanel: HTMLDivElement | null = null;
    private followBanner: HTMLDivElement | null = null;
    private isListOpen: boolean = false;

    // State
    private followedArmyId: string | null = null;
    /** 跟随军阵亡后，延迟自动切换的时间戳（performance.now） */
    private pendingAutoSwitchAt = 0;
    private pendingAutoSwitchArmyId: string | null = null;
    private getArmiesFn: (() => any[]) | null = null;
    private onFollowChange: ((armyId: string | null) => void) | null = null;
    private onLegionCapChange: ((cap: number) => void) | null = null;
    private onRenameLegion: ((armyId: string, newName: string) => boolean) | null = null;
    private limitLabel: HTMLSpanElement | null = null;
    private listHeader: HTMLDivElement | null = null;
    private lastLegionCount: number = -1;

    constructor() {
        this.createListButton();
        this.createListPanel();
        this.createFollowBanner();
    }

    /** 开局尚未手动选军团时，首次出现野战军团则自动跟随兵力最多的一支 */
    private autoFollowOnStartPending = true;
    private pendingFollowName: string | null = null;

    /**
     * 注入依赖：军队列表、跟随回调、军团上限变更（写 GameConfig + 裁军）
     */
    public init(
        getArmies: () => any[],
        onFollowChange: (armyId: string | null) => void,
        onLegionCapChange?: (cap: number) => void,
        onRenameLegion?: (armyId: string, newName: string) => boolean
    ): void {
        this.getArmiesFn = getArmies;
        this.onFollowChange = onFollowChange;
        this.onLegionCapChange = onLegionCapChange ?? null;
        this.onRenameLegion = onRenameLegion ?? null;
    }

    // ─── 1. 入口按钮（右下角） ──────────────────────────

    private createListButton(): void {
        const btn = document.createElement('button');
        btn.id = 'army-list-btn';
        btn.title = '野战军团列表';
        btn.innerHTML = '🎖️ 军团';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
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

    // ─── 2. 军团列表面板 ──────────────────────────────

    private createListPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'army-list-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
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

        // 标题栏
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
        header.textContent = '⚔ 野战军团 (0) ⚔';
        panel.appendChild(header);
        this.listHeader = header;

        // 军团上限配置栏
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
        limitSlider.max = '100';
        limitSlider.step = '1';
        limitSlider.value = String(
            Math.min(100, Math.max(10, GameConfig.LEGION.MAX_ACTIVE_LEGIONS))
        );
        limitSlider.style.width = '120px';

        limitSlider.addEventListener('input', (e) => {
            const raw = parseInt((e.target as HTMLInputElement).value, 10);
            const val = Math.min(100, Math.max(10, Number.isFinite(raw) ? raw : 10));
            GameConfig.LEGION.MAX_ACTIVE_LEGIONS = val;
            this.syncLimitLabel();
            this.onLegionCapChange?.(val);
            this.lastLegionCount = -1;
            this.update();
            if (this.isListOpen) this.refreshList();
        });

        limitContainer.appendChild(limitLabel);
        limitContainer.appendChild(limitSlider);
        panel.appendChild(limitContainer);

        // 列表容器
        const listContainer = document.createElement('div');
        listContainer.id = 'army-list-items';
        listContainer.style.cssText = `padding: 4px 0;`;
        panel.appendChild(listContainer);

        document.body.appendChild(panel);
        this.listPanel = panel;
    }

    /** 数量变化时更新按钮/标题；面板展开时同步列表 */
    public update(): void {
        const count = this.getActiveLegionCount();
        if (count !== this.lastLegionCount) {
            this.updateCountDisplay(count);
            this.lastLegionCount = count;
            if (this.isListOpen) {
                this.refreshList();
            }
        }
        this.tryPendingFollowByName();
    }

    /** 等该名字的军团上场后跟随（已存在则立刻挂上） */
    public followByNameWhenReady(name: string): void {
        this.pendingFollowName = name;
        this.autoFollowOnStartPending = false;
        this.tryPendingFollowByName();
    }

    private tryPendingFollowByName(): void {
        if (!this.pendingFollowName || !this.getArmiesFn) return;
        const name = this.pendingFollowName;
        const army = this.getActiveLegions().find((a) => a.name === name);
        if (!army) return;
        this.pendingFollowName = null;
        this.setFollow(army.id, army.name || name);
    }

    private getActiveLegions(): any[] {
        if (!this.getArmiesFn) return [];
        return this.getArmiesFn().filter(
            (a) => !a.isDestroyed && a.type === 'legion' && (a.getTroops?.() ?? 0) > 0
        );
    }

    private getActiveLegionCount(): number {
        return this.getActiveLegions().length;
    }

    private syncLimitLabel(): void {
        if (!this.limitLabel) return;
        const cap = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const n = this.getActiveLegionCount();
        this.limitLabel.textContent = `军团 ${n} / 上限 ${cap}`;
    }

    private updateCountDisplay(count: number): void {
        if (this.listButton) {
            this.listButton.innerHTML = `🎖️ 军团 (${count})`;
        }
        if (this.listHeader) {
            this.listHeader.textContent = `⚔ 野战军团 (${count}) ⚔`;
        }
        this.syncLimitLabel();
    }

    private toggleList(): void {
        this.isListOpen = !this.isListOpen;
        if (this.isListOpen) {
            const count = this.getActiveLegionCount();
            this.updateCountDisplay(count);
            this.lastLegionCount = count;
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

    private refreshList(): void {
        const container = document.getElementById('army-list-items');
        if (!container || !this.getArmiesFn) return;

        const armies = this.getActiveLegions();
        container.innerHTML = '';

        if (armies.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = `
                padding: 20px 14px;
                text-align: center;
                color: #888;
                font-size: 13px;
            `;
            empty.textContent = '暂无活跃军团';
            container.appendChild(empty);
            return;
        }

        // 按兵力降序排列
        armies.sort((a: any, b: any) => (b.getTroops?.() || 0) - (a.getTroops?.() || 0));

        for (const army of armies) {
            const item = document.createElement('div');
            const troops = army.getTroops?.() || 0;
            const name = army.name || army.id;
            const isFollowed = army.id === this.followedArmyId;

            item.style.cssText = `
                padding: 8px 14px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(100,80,40,0.2);
                transition: background 0.15s;
                font-size: 13px;
                ${isFollowed ? 'background: rgba(180,140,60,0.25);' : ''}
            `;

            item.innerHTML = `
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${isFollowed ? '🎥 ' : ''}${name}
                </span>
                <span style="color:#aaa; font-size:12px; margin-left:8px; white-space:nowrap;">
                    ${this.formatTroops(troops)}
                </span>
            `;

            item.addEventListener('mouseenter', () => {
                if (!isFollowed) item.style.background = 'rgba(180,140,60,0.15)';
            });
            item.addEventListener('mouseleave', () => {
                if (!isFollowed) item.style.background = 'transparent';
            });

            item.addEventListener('click', () => {
                this.setFollow(army.id, name);
                this.closeList();
            });

            container.appendChild(item);
        }
    }

    private formatTroops(n: number): string {
        const t = Math.floor(n);
        if (t >= 10000) return `${(t / 10000).toFixed(1)}万`;
        return `${t}`;
    }

    // ─── 3. 跟随状态横幅（顶部） ──────────────────────

    private createFollowBanner(): void {
        const banner = document.createElement('div');
        banner.id = 'follow-banner';
        banner.style.cssText = `
            position: fixed;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10002;
            display: none;
            align-items: center;
            gap: 12px;
            padding: 8px 20px;
            font-size: 14px;
            font-weight: bold;
            color: #f0e6d2;
            background: linear-gradient(135deg, rgba(40,30,15,0.94), rgba(55,40,20,0.96));
            border: 2px solid rgba(220,180,70,0.6);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            font-family: 'SimSun', 'Songti SC', serif;
            letter-spacing: 1px;
            pointer-events: auto;
        `;

        const text = document.createElement('span');
        text.id = 'follow-banner-text';
        text.textContent = '🎥 正在跟随：';
        banner.appendChild(text);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ 取消';
        closeBtn.style.cssText = `
            background: rgba(180,60,60,0.7);
            border: 1px solid rgba(220,100,100,0.5);
            color: #f0e6d2;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-family: inherit;
            transition: background 0.2s;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(200,70,70,0.9)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(180,60,60,0.7)';
        });
        closeBtn.addEventListener('click', () => {
            this.cancelFollow();
        });
        const renameBtn = document.createElement('button');
        renameBtn.textContent = '✎ 改名';
        renameBtn.style.cssText = `
            background: rgba(60,120,180,0.7);
            border: 1px solid rgba(100,160,220,0.5);
            color: #f0e6d2;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-family: inherit;
            transition: background 0.2s;
        `;
        renameBtn.addEventListener('mouseenter', () => {
            renameBtn.style.background = 'rgba(80,140,200,0.9)';
        });
        renameBtn.addEventListener('mouseleave', () => {
            renameBtn.style.background = 'rgba(60,120,180,0.7)';
        });
        renameBtn.addEventListener('click', () => {
            if (!this.followedArmyId || !this.getArmiesFn) return;
            const army = this.getArmiesFn().find(
                (a) => a.id === this.followedArmyId && !a.isDestroyed && a.type === 'legion'
            );
            if (!army) return;

            const trimmed = prompt('请输入新的军团名称：', army.name || army.id)?.trim();
            if (!trimmed || trimmed === army.name) return;

            const ok = this.onRenameLegion
                ? this.onRenameLegion(army.id, trimmed)
                : ((army.name = trimmed), true);
            if (!ok) return;

            this.setFollow(army.id, army.name);
            if (this.isListOpen) this.refreshList();
        });
        banner.appendChild(renameBtn);
        banner.appendChild(closeBtn);

        document.body.appendChild(banner);
        this.followBanner = banner;
    }

    // ─── 公共接口 ─────────────────────────────────────

    private clearPendingAutoSwitch(): void {
        this.pendingAutoSwitchAt = 0;
        this.pendingAutoSwitchArmyId = null;
    }

    /**
     * 每帧：跟随存活军团；阵亡后停留 FOLLOW_SWITCH_DELAY_MS 再切到兵力最多的一支。
     */
    public tickFollowCamera(
        getLegionById: (id: string) => { getPosition(): { lat: number; lng: number }; isDestroyed: boolean; getTroops(): number } | undefined,
        panToLegion: (pos: { lat: number; lng: number }) => void
    ): void {
        const followedId = this.followedArmyId;
        if (!followedId) return;

        const army = getLegionById(followedId);
        const alive = !!(army && !army.isDestroyed && army.getTroops() > 0);

        if (alive) {
            this.clearPendingAutoSwitch();
            this.restoreFollowBannerName();
            panToLegion(army!.getPosition());
            return;
        }

        const delayMs = GameConfig.LEGION.FOLLOW_SWITCH_DELAY_MS;
        if (!this.pendingAutoSwitchAt) {
            this.pendingAutoSwitchAt = performance.now() + delayMs;
            this.pendingAutoSwitchArmyId = followedId;
            this.showPendingSwitchBanner(delayMs);
        }

        const lingerId = this.pendingAutoSwitchArmyId || followedId;
        const lingerArmy = getLegionById(lingerId);
        if (lingerArmy) {
            panToLegion(lingerArmy.getPosition());
        }

        if (performance.now() >= this.pendingAutoSwitchAt) {
            this.clearPendingAutoSwitch();
            this.followLargestLegion();
        }
    }

    private showPendingSwitchBanner(delayMs: number): void {
        const sec = Math.ceil(delayMs / 1000);
        const text = document.getElementById('follow-banner-text');
        if (text) text.textContent = `🎥 军团阵亡，${sec} 秒后切换视角…`;
    }

    private restoreFollowBannerName(): void {
        if (!this.followedArmyId || !this.getArmiesFn) return;
        const army = this.getArmiesFn().find((a) => a.id === this.followedArmyId);
        if (!army) return;
        const text = document.getElementById('follow-banner-text');
        if (text) text.textContent = `🎥 正在跟随：${army.name || army.id}`;
    }

    public setFollow(armyId: string, armyName: string): void {
        this.clearPendingAutoSwitch();
        this.followedArmyId = armyId;

        const text = document.getElementById('follow-banner-text');
        if (text) text.textContent = `🎥 正在跟随：${armyName}`;
        if (this.followBanner) this.followBanner.style.display = 'flex';
        this.syncFollowedHighlight();

        if (this.onFollowChange) this.onFollowChange(armyId);
    }

    public cancelFollow(): void {
        this.clearPendingAutoSwitch();
        this.autoFollowOnStartPending = false;
        this.followedArmyId = null;
        if (this.followBanner) this.followBanner.style.display = 'none';
        this.syncFollowedHighlight();
        if (this.onFollowChange) this.onFollowChange(null);
    }

    /** 跟随军团高亮（地图上区分玩家关注的一支） */
    private syncFollowedHighlight(): void {
        if (!this.getArmiesFn) return;
        const id = this.followedArmyId;
        for (const army of this.getActiveLegions()) {
            army.setFollowedHighlight?.(army.id === id);
        }
    }

    /** 跟随的军团已灭：切到全图兵力最多的军团 */
    public followLargestLegion(): void {
        this.clearPendingAutoSwitch();
        if (!this.getArmiesFn) {
            this.cancelFollow();
            return;
        }

        const armies = this.getActiveLegions();
        if (armies.length === 0) {
            this.cancelFollow();
            return;
        }

        armies.sort(
            (a, b) => (b.getTroops?.() || 0) - (a.getTroops?.() || 0)
        );
        const best = armies[0];
        this.setFollow(best.id, best.name || best.id);
    }

    /** 游戏开始后自动跟随：尚无选中军团且场上已有野战军团时，跟随兵力最多的一支（仅触发一次） */
    public tryAutoFollowOnStart(): void {
        if (!this.autoFollowOnStartPending || this.followedArmyId) return;
        if (!this.getArmiesFn || this.getActiveLegions().length === 0) return;
        this.autoFollowOnStartPending = false;
        this.followLargestLegion();
    }

    public getFollowedArmyId(): string | null {
        return this.followedArmyId;
    }

    public isFollowing(): boolean {
        return this.followedArmyId !== null;
    }
}
