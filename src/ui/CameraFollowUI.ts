/**
 * CameraFollowUI.ts - 军团跟随视角 UI 模块
 * 
 * 提供：
 * 1. 右下角"军团列表"入口按钮
 * 2. 展开后的活跃军团选择列表（点击跟随）
 * 3. 跟随状态下顶部悬浮提示条（含取消按钮）
 */

import { GameConfig } from '../config/GameConfig';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { CITIES_V2 } from '../data/cities_v2';

export interface HistoricalStreakRecord {
    streak: number;
    generalName: string;
    legionName: string;
    armyId: string;
    factionId: string;
}

export class CameraFollowUI {
    /** 全局历史最高连胜纪录（即使军团阵亡依然永久保留） */
    public static historicalMaxStreak: HistoricalStreakRecord | null = null;

    /** 记录/刷新全局历史最高连胜 */
    public static recordHistoricalStreak(army: any): void {
        const streak = (army as any)?.winStreak || 0;
        if (streak <= 0) return;

        const currentMax = CameraFollowUI.historicalMaxStreak?.streak || 0;
        if (streak > currentMax) {
            const gRecord = army.generalId ? getGeneralRecordByGeneralId(army.generalId) : null;
            const gName = gRecord?.generalName || '';
            const lName = army.name || gName || '军团';
            CameraFollowUI.historicalMaxStreak = {
                streak,
                generalName: gName,
                legionName: lName,
                armyId: army.id,
                factionId: army.getFactionId?.() ?? '',
            };
        }
    }

    // DOM Elements
    private listButton: HTMLButtonElement | null = null;
    private listPanel: HTMLDivElement | null = null;
    private followBanner: HTMLDivElement | null = null;
    public isListOpen: boolean = false;
    private preScene13ListOpen: boolean = false;
    private preScene13FollowBannerVisible: boolean = false;

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
    private topStatsContainer: HTMLDivElement | null = null;
    private listHeader: HTMLDivElement | null = null;
    private lastLegionCount: number = -1;
    /** 面板展开时列表节流刷新（势力兵力/据点/色条实时） */
    private lastListRefreshAt = 0;
    private static readonly LIST_REFRESH_INTERVAL_MS = 500;
    /** 军团按钮下缘 ≈ 62px；岳飞按钮固定于此，列表面板 z-index 更高盖住它 */
    private static readonly STACK_LEFT_PX = 16;
    private static readonly LIST_PANEL_TOP_PX = 62;
    /** 势力统计数据源（合并势力榜后，每行附带势力兵力/据点数） */
    private cityManager: { getCities(): any[] } | null = null;
    private factionManager: { getFactionName(id: string): string | undefined; getFactionColor(id: string): string | undefined } | null = null;

    constructor() {
        this.createListButton();
        this.createListPanel();
        this.createFollowBanner();
    }

    /** 玩家单骑；入伍时对外报的"跟随军团 id" = 所在军团（引擎/战斗 UI/13 都按军团认），否则 = 玩家本人 */
    private playerHero: { id: string; name: string; getHostLegionId(): string | null; getTravelCityId?(): string | null; factionId?: string | null; getHostLegion?(): any } | null = null;

    public setPlayerHero(hero: { id: string; name: string; getHostLegionId(): string | null; getTravelCityId?(): string | null; factionId?: string | null; getHostLegion?(): any } | null): void {
        this.playerHero = hero;
    }

    public isFollowingPlayer(): boolean {
        return !!this.playerHero && this.followedArmyId === this.playerHero.id;
    }

    public followPlayer(): void {
        if (!this.playerHero) return;
        this.setFollow(this.playerHero.id, this.playerHero.name);
    }

    /** 玩家入伍/离队/改名后：对外的跟随 id 变了（军团 ↔ 本人），重新广播给引擎侧监听者 */
    public refreshPlayerFollow(): void {
        if (!this.isFollowingPlayer()) return;
        this.syncFollowedHighlight();
        // [2026-09-05 玩家] 改名后同步跟拍横幅上的玩家名
        if (this.playerHero) {
            const text = document.getElementById('follow-banner-text');
            if (text) text.innerHTML = this.formatFollowBannerText(this.playerHero, this.playerHero.name);
        }
        this.onFollowChange?.(this.getFollowedArmyId());
    }

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

    /** 注入势力统计数据源（合并势力榜：每行显示该军团所属势力的兵力与据点数） */
    public setFactionStats(
        cityManager: { getCities(): any[] },
        factionManager: { getFactionName(id: string): string | undefined; getFactionColor(id: string): string | undefined },
    ): void {
        this.cityManager = cityManager;
        this.factionManager = factionManager;
    }

    /** 一次性汇总各势力的总兵力（城防+军团）与据点数 */
    private computeFactionTotals(): Map<string, { troops: number; cities: number }> {
        const totals = new Map<string, { troops: number; cities: number }>();
        const bump = (fid: string, troops: number, cities: number) => {
            if (!fid || fid === 'panjun') return;
            const e = totals.get(fid) ?? { troops: 0, cities: 0 };
            e.troops += troops; e.cities += cities;
            totals.set(fid, e);
        };
        if (this.cityManager) {
            for (const c of this.cityManager.getCities()) bump(c.factionId, c.troops ?? 0, 1);
        }
        for (const a of this.getArmiesFn?.() ?? []) {
            if (a.isDestroyed) continue;
            bump(a.getFactionId?.() ?? '', a.getTroops?.() ?? 0, 0);
        }
        return totals;
    }

    // ─── 1. 入口按钮（左上角） ──────────────────────────

    private createListButton(): void {
        const btn = document.createElement('button');
        btn.id = 'army-list-btn';
        btn.title = '野战军团列表';
        btn.innerHTML = '🎖️ 军团';
        btn.style.cssText = `
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 10000;
            padding: 7px 18px;
            font-size: 14px;
            font-weight: bold;
            color: #2c241c;
            background: linear-gradient(135deg, rgba(246, 240, 228, 0.88) 0%, rgba(230, 218, 198, 0.92) 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(125, 111, 90, 0.28);
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
            transition: all 0.25s ease;
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            letter-spacing: 2px;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = 'rgba(156, 48, 47, 0.55)';
            btn.style.color = '#9c302f';
            btn.style.background = 'linear-gradient(135deg, rgba(255, 250, 242, 0.96) 0%, rgba(242, 232, 216, 0.96) 100%)';
            btn.style.boxShadow = '0 4px 20px rgba(156,48,47,0.2), inset 0 1px 0 rgba(255,255,255,0.9)';
            btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(125, 111, 90, 0.28)';
            btn.style.color = '#2c241c';
            btn.style.background = 'linear-gradient(135deg, rgba(246, 240, 228, 0.88) 0%, rgba(230, 218, 198, 0.92) 100%)';
            btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7)';
            btn.style.transform = 'none';
        });

        btn.addEventListener('click', () => this.toggleList());

        document.body.appendChild(btn);
        this.listButton = btn;
    }

    // ─── 2. 军团列表面板（z-index 高于军团按钮，展开时盖住下层按钮） ────────

    private createListPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'army-list-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${CameraFollowUI.LIST_PANEL_TOP_PX}px;
            left: 0;
            width: 260px;
            max-height: calc(100vh - 460px);
            overflow-y: auto;
            z-index: 10001;
            background: linear-gradient(to right, rgba(216, 197, 168, 0.6) 0%, rgba(235, 220, 195, 0.35) 70%, rgba(235, 220, 195, 0) 100%);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            border: none;
            box-shadow: none;
            display: none;
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            color: #2c241c;
            padding: 0 10px 10px 0;
            box-sizing: border-box;
        `;

        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            position: relative;
            padding: 10px 14px 8px;
            font-size: 14px;
            font-weight: bold;
            border-bottom: 1px dashed rgba(125, 111, 90, 0.35);
            background: transparent;
            color: #1d3326;
            letter-spacing: 2px;
            text-align: center;
        `;
        const headerTitle = document.createElement('span');
        headerTitle.textContent = '⚔ 军团·势力榜 (0) ⚔';
        header.appendChild(headerTitle);
        this.listHeader = headerTitle as unknown as HTMLDivElement;

        panel.appendChild(header);

        // 滚动条与滑块美化
        const scrollStyle = document.createElement('style');
        scrollStyle.textContent = `
            #army-list-panel::-webkit-scrollbar {
                width: 5px;
            }
            #army-list-panel::-webkit-scrollbar-track {
                background: transparent;
            }
            #army-list-panel::-webkit-scrollbar-thumb {
                background: rgba(125, 111, 90, 0.25);
                border-radius: 4px;
            }
            #army-list-panel::-webkit-scrollbar-thumb:hover {
                background: rgba(125, 111, 90, 0.5);
            }

            #army-list-panel input[type=range] {
                -webkit-appearance: none;
                appearance: none;
                background: rgba(125, 111, 90, 0.18);
                height: 4px;
                border-radius: 2px;
                outline: none;
                border: none;
            }
            #army-list-panel input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #9c302f;
                border: 2px solid #fff;
                box-shadow: 0 1px 4px rgba(156,48,47,0.4);
                cursor: pointer;
                transition: transform 0.15s ease;
            }
            #army-list-panel input[type=range]::-webkit-slider-thumb:hover {
                transform: scale(1.15);
                background: #b83836;
            }
        `;
        panel.appendChild(scrollStyle);

        // 军团上限配置栏
        const limitContainer = document.createElement('div');
        limitContainer.style.cssText = `
            padding: 6px 14px;
            font-size: 12px;
            color: #5b7a66;
            font-weight: bold;
            border-bottom: 1px dashed rgba(125, 111, 90, 0.35);
            background: transparent;
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
        limitSlider.max = '99';
        limitSlider.step = '1';
        limitSlider.value = String(
            Math.min(99, Math.max(10, GameConfig.LEGION.MAX_ACTIVE_LEGIONS))
        );
        limitSlider.style.width = '120px';

        limitSlider.addEventListener('input', (e) => {
            const raw = parseInt((e.target as HTMLInputElement).value, 10);
            const val = Math.min(99, Math.max(10, Number.isFinite(raw) ? raw : 10));
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

        // 最多连胜武将与据点最多势力统计栏
        const topStatsContainer = document.createElement('div');
        topStatsContainer.id = 'army-top-stats';
        topStatsContainer.style.cssText = `
            padding: 6px 10px;
            border-bottom: 1px dashed rgba(125, 111, 90, 0.35);
            background: transparent;
            display: flex;
            gap: 6px;
        `;
        panel.appendChild(topStatsContainer);
        this.topStatsContainer = topStatsContainer;

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
            const oldCount = this.lastLegionCount;
            this.updateCountDisplay(count);
            this.lastLegionCount = count;
            if (this.isListOpen) {
                this.refreshList();
            }
        }
        // 面板展开时，即使军团数不变也节流刷新，保持势力兵力/据点/色条实时
        if (this.isListOpen) {
            const now = performance.now();
            if (now - this.lastListRefreshAt >= CameraFollowUI.LIST_REFRESH_INTERVAL_MS) {
                this.lastListRefreshAt = now;
                this.refreshList();
            }
        }
    }

    private getActiveLegions(): any[] {
        if (!this.getArmiesFn) return [];
        const active = this.getArmiesFn().filter(
            (a) => !a.isDestroyed && a.type === 'legion' && (a.getTroops?.() ?? 0) > 0
        );
        for (const army of active) {
            CameraFollowUI.recordHistoricalStreak(army);
        }
        return active;
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
            this.listHeader.textContent = `⚔ 军团·势力榜 (${count}) ⚔`;
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



    /** 进 13 战斗场景时保存状态并收起军团列表与跟随面板 */
    public onEnterBattleScene13(): void {
        if (this.isListOpen) {
            this.preScene13ListOpen = true;
        }
        this.closeList();
        if (this.listButton) this.listButton.style.display = 'none';
        // 🔴 幂等修复（2026-08-26）：onEnter 会被 Scene13WarLayer.start 与 BattleSceneLayer.enter
        //    各调一次。第二次进来时 banner 已被第一次隐藏（display='none'），原 else 分支把
        //    preScene13FollowBannerVisible 覆盖回 false，导致退出时 onExit 永不恢复跟随面板。
        //    现改为：只在 banner 仍可见时记录 true，已隐藏则保持第一次的值不变。
        if (this.followBanner && this.followBanner.style.display !== 'none') {
            this.preScene13FollowBannerVisible = true;
            this.followBanner.style.display = 'none';
        }
    }

    /** 退 13 战斗场景时恢复展开状态 */
    public onExitBattleScene13(): void {
        if (this.listButton) this.listButton.style.display = '';
        if (this.preScene13ListOpen) {
            this.preScene13ListOpen = false;
            this.openList();
        }
        if (this.preScene13FollowBannerVisible && this.followedArmyId) {
            this.preScene13FollowBannerVisible = false;
            if (this.followBanner) this.followBanner.style.display = 'flex';
        }
    }

    public openList(): void {
        if (this.isListOpen) return;
        this.isListOpen = true;
        const count = this.getActiveLegionCount();
        this.updateCountDisplay(count);
        this.lastLegionCount = count;
        this.refreshList();
        if (this.listPanel) this.listPanel.style.display = 'block';
    }

    public closeList(): void {
        this.isListOpen = false;
        if (this.listPanel) this.listPanel.style.display = 'none';
    }

    private refreshList(): void {
        const container = document.getElementById('army-list-items');
        if (!container || !this.getArmiesFn) return;

        const armies = this.getActiveLegions();
        const factionTotals = this.computeFactionTotals();
        this.updateTopStats(armies, factionTotals);

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

        let maxFactionTroops = 1;
        for (const v of factionTotals.values()) {
            if (v.troops > maxFactionTroops) maxFactionTroops = v.troops;
        }

        // 按所属势力据点数降序（据点相同按 factionId 字典序，避免兵力波动导致频繁跳动）
        armies.sort((a: any, b: any) => {
            const fidA = a.getFactionId?.() ?? '';
            const fidB = b.getFactionId?.() ?? '';
            const fa = factionTotals.get(fidA) ?? { troops: 0, cities: 0 };
            const fb = factionTotals.get(fidB) ?? { troops: 0, cities: 0 };
            if (fb.cities !== fa.cities) return fb.cities - fa.cities;
            return fidA.localeCompare(fidB);
        });

        for (let idx = 0; idx < armies.length; idx++) {
            const army = armies[idx];
            const item = document.createElement('div');
            const troops = army.getTroops?.() || 0;
            const name = army.name || army.id;
            const isFollowed = army.id === this.followedArmyId;
            const fid = army.getFactionId?.() ?? '';
            const fTotal = factionTotals.get(fid) ?? { troops: 0, cities: 0 };
            const fName = this.factionManager?.getFactionName(fid) ?? fid;
            const fColor = this.factionManager?.getFactionColor(fid) ?? '#ffffff';
            const fPct = maxFactionTroops > 0 ? Math.min(100, (fTotal.troops / maxFactionTroops) * 100) : 0;
            const generalRecord = army.generalId ? getGeneralRecordByGeneralId(army.generalId) : null;
            const isEliteAndGeneral = army.isElite && generalRecord;

            // 标题：武将名率军团名（武将在前）；精锐仅以朱砂高亮区分
            let titleHtml: string;
            if (generalRecord) {
                const gColor = isEliteAndGeneral ? '#9c302f' : '#8a2b22';
                titleHtml =
                    `<span style="color:${gColor}; font-weight:800; font-size:14px;">${generalRecord.generalName}</span>` +
                    `<span style="opacity:0.75; font-size:11px; margin:0 2px; color:#7d6f5a; font-weight:bold;">率</span>${name}`;
            } else {
                titleHtml = name;
            }

            let itemBg = isFollowed ? 'background: rgba(156,48,47,0.12); border-left: 3px solid #9c302f;' : '';
            let nameStyle = 'color: #2c241c; font-weight: 700;';

            if (isEliteAndGeneral) {
                if (!isFollowed) {
                    itemBg = 'background: linear-gradient(to right, rgba(156,48,47,0.06), transparent);';
                }
                nameStyle = 'color: #9c302f; font-weight: 800;';
            } else if (army.isElite) {
                nameStyle = 'color: #7d3826; font-weight: 800;';
            }

            item.style.cssText = `
                padding: 6px 10px;
                margin: 0;
                border-radius: 4px;
                cursor: pointer;
                border-bottom: 1px dashed rgba(125, 111, 90, 0.25);
                transition: all 0.2s ease;
                font-size: 13px;
                ${itemBg}
            `;

            const winStreak = (army as any).winStreak || 0;
            const streakHtml = winStreak > 0
                ? `<span style="display:inline-flex; flex-shrink:0; align-items:center; margin-left:6px; padding:0 5px; font-size:10px; font-weight:800; color:#9c302f; background:rgba(156,48,47,0.1); border:1px solid rgba(156,48,47,0.4); border-radius:10px; line-height:1.3; vertical-align:middle;">🔥${winStreak}连胜</span>`
                : '';

            // 第一行：名次 + 军团名 + 连胜 + 军团兵力；第二行：势力色点 + 势力名 + 势力兵力 + 据点数
            // 🔴 连胜徽章移出 ellipsis span：长名军团的徽章曾被 overflow:hidden 裁掉（2026-09-03 修复「有的军团不显示连胜」）
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="flex:1; min-width:0; display:flex; align-items:center; ${nameStyle}">
                        <span style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${isFollowed ? '🎥 ' : ''}<span style="color:#8c7e6b; font-weight:normal; font-size:12px;">${idx + 1}.</span> ${titleHtml}
                        </span>${streakHtml}
                    </span>
                    <span style="color:#9c302f; font-size:12px; font-weight:bold; margin-left:8px; white-space:nowrap; font-family:'JetBrains Mono', serif;">
                        ${this.formatTroops(troops)}
                    </span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px; font-size:11px; color:#5b7a66;">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:5px; color:#4a3f35;">
                        <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background-color:${fColor}; border:1px solid rgba(0,0,0,0.15);"></span>
                        ${fName}
                    </span>
                    <span style="margin-left:8px; white-space:nowrap; display:flex; align-items:center; gap:6px;">
                        势力 ${this.formatTroops(fTotal.troops)}
                        <span style="color:#9c302f; font-size:11px; font-weight:bold; border:1px solid rgba(156,48,47,0.3); border-radius:10px; padding:0 6px; background:rgba(156,48,47,0.06);">🏯 ${fTotal.cities} 城</span>
                    </span>
                </div>
            `;

            item.addEventListener('mouseenter', () => {
                if (!isFollowed) {
                    item.style.background = 'rgba(255, 255, 255, 0.28)';
                    item.style.transform = 'translateX(2px)';
                }
            });
            item.addEventListener('mouseleave', () => {
                if (!isFollowed) {
                    item.style.background = isEliteAndGeneral 
                        ? 'linear-gradient(to right, rgba(156,48,47,0.06), transparent)' 
                        : 'transparent';
                    item.style.transform = 'none';
                }
            });

            container.appendChild(item);
        }
    }

    /** 更新顶部高亮栏：历史最高连胜武将 + 据点最多势力 */
    private updateTopStats(armies: any[], factionTotals: Map<string, { troops: number; cities: number }>): void {
        if (!this.topStatsContainer) return;

        // 没有军团或数组为空时，直接隐藏
        if (!armies || armies.length === 0) {
            this.topStatsContainer.style.display = 'none';
            return;
        }

        // 1. 刷新全场活着的军团连胜至历史记录中
        for (const army of armies) {
            CameraFollowUI.recordHistoricalStreak(army);
        }

        const topRecord = CameraFollowUI.historicalMaxStreak;
        let hasStreak = false;
        let isStreakClickable = false;
        let streakArmyId = '';
        let streakArmyName = '';
        let streakCardHtml = '';

        if (topRecord && topRecord.streak > 0) {
            hasStreak = true;
            const aliveArmy = armies.find((a) => a.id === topRecord.armyId);
            const isAlive = !!aliveArmy;

            const gName = topRecord.generalName;
            const lName = topRecord.legionName;
            let pairTitle = '';
            if (gName && lName && gName !== lName) {
                pairTitle = `<span style="color:#9c302f; font-weight:bold;">${gName}</span><span style="opacity:0.6; font-size:10px; margin:0 1px;">率</span>${lName}`;
            } else {
                pairTitle = `<span style="color:#9c302f; font-weight:bold;">${gName || lName}</span>`;
            }

            const stateTag = isAlive ? '' : `<span style="color:#9c302f; font-size:9px; font-weight:bold; background:rgba(156,48,47,0.1); border:1px solid rgba(156,48,47,0.3); border-radius:3px; padding:0 2px; margin-left:3px; line-height:1; vertical-align:middle;" title="已阵亡覆灭">殁</span>`;

            if (isAlive) {
                isStreakClickable = true;
                streakArmyId = topRecord.armyId;
                streakArmyName = lName || gName;
            }

            streakCardHtml = `
                <div id="top-streak-card" style="flex:1.35; min-width:0; background:rgba(255,255,255,0.22); border:1px solid rgba(125,111,90,0.25); border-radius:6px; padding:5px 7px; box-sizing:border-box; ${isStreakClickable ? 'cursor:pointer;' : ''}" title="${isStreakClickable ? '点击视角跟随该历史连胜王者' : '传奇历史最高纪录'}">
                    <div style="display:flex; justify-content:space-between; align-items:center; line-height:1.3;">
                        <span style="color:#9c302f; font-size:11px; font-weight:bold; white-space:nowrap;">🔥 最高连胜</span>
                        <span style="color:#9c302f; font-weight:bold; font-size:10px; background:rgba(156,48,47,0.08); border:1px solid rgba(156,48,47,0.3); border-radius:10px; padding:0 5px; line-height:1.2; flex-shrink:0;">${topRecord.streak}连胜</span>
                    </div>
                    <div style="font-size:11px; color:#2c241c; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.3;">
                        ${pairTitle}${stateTag}
                    </div>
                </div>
            `;
        }

        // 2. 计算据点最多势力
        let maxCities = -1;
        let topFid = '';
        for (const [fid, data] of factionTotals.entries()) {
            if (data.cities > maxCities) {
                maxCities = data.cities;
                topFid = fid;
            }
        }

        let hasFaction = false;
        let factionCardHtml = '';

        if (topFid && maxCities > 0) {
            hasFaction = true;
            const fName = this.factionManager?.getFactionName(topFid) ?? topFid;
            const fColor = this.factionManager?.getFactionColor(topFid) ?? '#ffffff';
            const fTotal = factionTotals.get(topFid) ?? { troops: 0, cities: maxCities };

            factionCardHtml = `
                <div style="flex:0.85; min-width:0; background:rgba(255,255,255,0.22); border:1px solid rgba(125,111,90,0.25); border-radius:6px; padding:5px 7px; box-sizing:border-box;">
                    <div style="display:flex; justify-content:space-between; align-items:center; line-height:1.3;">
                        <span style="color:#1d3326; font-size:11px; font-weight:bold; white-space:nowrap;">🏯 据点最多</span>
                        <span style="color:#9c302f; font-size:10px; font-weight:bold; border:1px solid rgba(156,48,47,0.3); border-radius:10px; padding:0 5px; background:rgba(156,48,47,0.08); line-height:1.2; flex-shrink:0;">${maxCities}城</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px; font-size:11px; color:#5b7a66; line-height:1.3;">
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:4px; color:#2c241c; font-weight:bold;">
                            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background-color:${fColor}; border:1px solid rgba(0,0,0,0.15);"></span>
                            ${fName}
                        </span>
                        <span style="font-size:10px; color:#9c302f; font-weight:bold; margin-left:4px; flex-shrink:0;">
                            ${this.formatTroops(fTotal.troops)}
                        </span>
                    </div>
                </div>
            `;
        }

        if (!hasStreak && !hasFaction) {
            this.topStatsContainer.style.display = 'none';
            return;
        }

        this.topStatsContainer.style.display = 'flex';
        this.topStatsContainer.innerHTML = `${streakCardHtml}${factionCardHtml}`;

        if (isStreakClickable) {
            const streakCard = this.topStatsContainer.querySelector('#top-streak-card') as HTMLDivElement | null;
            if (streakCard) {
                streakCard.addEventListener('mouseenter', () => {
                    streakCard.style.background = 'rgba(255,255,255,0.75)';
                    streakCard.style.borderColor = 'rgba(156,48,47,0.4)';
                });
                streakCard.addEventListener('mouseleave', () => {
                    streakCard.style.background = 'rgba(255,255,255,0.45)';
                    streakCard.style.borderColor = 'rgba(255,255,255,0.7)';
                });
            }
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
            display: none;
            align-items: center;
            gap: 8px;
            padding: 7px 18px;
            font-size: 14px;
            font-weight: 700;
            color: #f5e6c8;
            background: rgba(20, 16, 12, 0.92);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(212, 175, 55, 0.55);
            border-radius: 8px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            letter-spacing: 0.5px;
            pointer-events: auto;
            white-space: nowrap;
        `;

        const text = document.createElement('span');
        text.id = 'follow-banner-text';
        text.textContent = '🎥 正在跟随';
        banner.appendChild(text);

        const renameBtn = document.createElement('button');
        renameBtn.textContent = '✎ 改名';
        renameBtn.style.cssText = `
            background: rgba(212, 175, 55, 0.12);
            border: 1px solid rgba(212, 175, 55, 0.4);
            color: #dfc28c;
            padding: 2px 8px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            font-weight: 700;
            transition: all 0.2s ease;
            margin-left: 8px;
        `;
        renameBtn.addEventListener('mouseenter', () => {
            renameBtn.style.background = 'rgba(212, 175, 55, 0.28)';
            renameBtn.style.borderColor = 'rgba(212, 175, 55, 0.8)';
            renameBtn.style.color = '#fffcee';
        });
        renameBtn.addEventListener('mouseleave', () => {
            renameBtn.style.background = 'rgba(212, 175, 55, 0.12)';
            renameBtn.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            renameBtn.style.color = '#dfc28c';
        });
        renameBtn.addEventListener('click', () => {
            if (!this.followedArmyId || !this.getArmiesFn) return;
            // [2026-09-05 玩家] 乱入者改名：跟玩家本人（type='hero'）时改玩家名，不再走军团改名
            const player = (window as any).game?.playerHero;
            if (player && this.followedArmyId === player.id) {
                const trimmed = prompt('请输入新的玩家名称：', player.name)?.trim();
                if (!trimmed || trimmed === player.name) return;
                player.rename(trimmed);
                this.refreshPlayerFollow();
                return;
            }
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

            if (this.isListOpen) this.refreshList();
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ 取消';
        closeBtn.style.cssText = `
            background: rgba(156, 48, 47, 0.2);
            border: 1px solid rgba(212, 175, 55, 0.35);
            color: #f5c8c8;
            padding: 2px 8px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            font-weight: 700;
            transition: all 0.2s ease;
            margin-left: 5px;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(156, 48, 47, 0.45)';
            closeBtn.style.borderColor = 'rgba(212, 175, 55, 0.75)';
            closeBtn.style.color = '#ffffff';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(156, 48, 47, 0.2)';
            closeBtn.style.borderColor = 'rgba(212, 175, 55, 0.35)';
            closeBtn.style.color = '#f5c8c8';
        });
        closeBtn.addEventListener('click', () => {
            this.cancelFollow();
        });

        banner.appendChild(renameBtn);
        banner.appendChild(closeBtn);

        const container = document.getElementById('top-center-hud');
        if (container) {
            container.appendChild(banner);
        } else {
            document.body.appendChild(banner);
        }
        this.followBanner = banner;
    }

    // ─── 公共接口 ─────────────────────────────────────

    private clearPendingAutoSwitch(): void {
        this.pendingAutoSwitchAt = 0;
        this.pendingAutoSwitchArmyId = null;
    }

    /**
     * 每帧：跟随存活军团；阵亡后停留 FOLLOW_SWITCH_DELAY_MS 再切到下一支（名将优先）。
     */
    public tickFollowCamera(
        getLegionById: (id: string) => { getPosition(): { lat: number; lng: number }; isDestroyed: boolean; getTroops(): number } | undefined,
        panToLegion: (pos: { lat: number; lng: number }) => void
    ): void {
        const followedId = this.followedArmyId;
        if (!followedId) return;

        // [2026-09-05 玩家] 跟随玩家分支：镜头贴着玩家，横幅固定显示玩家当前前往的目标
        if (this.isFollowingPlayer()) {
            this.clearPendingAutoSwitch();
            this.restoreFollowBannerName();
            const playerPos = (window as any).game?.playerHero?.getPosition?.();
            if (playerPos) panToLegion(playerPos);
            return;
        }

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
            this.followPlayer();
        }
    }

    private showPendingSwitchBanner(delayMs: number): void {
        const sec = Math.ceil(delayMs / 1000);
        const text = document.getElementById('follow-banner-text');
        if (text) text.innerHTML = `<span style="margin-right:6px;">🎥</span>军团阵亡，<span style="color:#ffd700;font-weight:900;">${sec}</span> 秒后切换视角…`;
    }

    private formatFollowBannerText(army: any, fallbackName: string): string {
        const isPlayer = !!(army.isPlayerHero || this.isFollowingPlayer() || (this.playerHero && army.id === this.playerHero.id));
        let label = army.name || fallbackName;

        let generalName = '';
        if (army.generalId) {
            const generalRecord = getGeneralRecordByGeneralId(army.generalId);
            if (generalRecord) generalName = generalRecord.generalName;
        }

        const factionId = (typeof army.getFactionId === 'function' ? army.getFactionId() : army.factionId) ?? '';
        const rawFactionName = this.factionManager?.getFactionName(factionId);
        const factionName = rawFactionName && rawFactionName !== '未知势力' ? rawFactionName : '';

        let targetCityId = '';
        let isExpedition = false;

        if (isPlayer) {
            const player = (window as any).game?.playerHero ?? army;
            const travelId = player.getTravelCityId?.() || player.army?.getTargetCity?.()?.id;
            const host = player.getHostLegion?.();
            if (travelId) {
                targetCityId = travelId;
                isExpedition = false;
            } else if (host) {
                if (host.expeditionTargetCityId) {
                    targetCityId = host.expeditionTargetCityId;
                    isExpedition = true;
                } else if (host.getTargetCity?.()?.id) {
                    targetCityId = host.getTargetCity().id;
                    isExpedition = false;
                }
            }
        } else {
            if (army.expeditionTargetCityId) {
                targetCityId = army.expeditionTargetCityId;
                isExpedition = true;
            } else if (army.getTargetCity?.()?.id) {
                targetCityId = army.getTargetCity().id;
                isExpedition = false;
            }
        }

        let targetCityName = '';
        if (targetCityId) {
            const targetCity = CITIES_V2.find((c: any) => c.id === targetCityId)
                ?? (this.cityManager as any)?.getCity?.(targetCityId);
            if (targetCity) targetCityName = targetCity.name;
        }

        // 图标：出征为 ⚔️，行军前往为 🐎，驻留守备为 🛡️
        const icon = isExpedition ? '⚔️' : (targetCityName ? '🐎' : '🛡️');

        // 势力前缀（非未知势力时展示）
        const factionHtml = factionName
            ? `<span style="color:#d4af37;font-weight:700;margin-right:4px;">[${factionName}]</span>`
            : '';

        // 主体名称拼接
        let subjectHtml = '';
        if (isPlayer) {
            const host = ((window as any).game?.playerHero ?? army)?.getHostLegion?.();
            const hostGenName = host?.generalId ? getGeneralRecordByGeneralId(host.generalId)?.generalName : null;
            if (hostGenName) {
                subjectHtml = `<span style="color:#f5e6c8;font-weight:700;">${hostGenName}</span><span style="color:#dfc28c;margin:0 2px;">率</span><span style="color:#ffffff;font-weight:700;">${label}</span>`;
            } else {
                subjectHtml = `<span style="color:#ffffff;font-weight:700;">${label}</span>`;
            }
        } else {
            if (generalName && label && label !== generalName) {
                subjectHtml = `<span style="color:#ffffff;font-weight:700;">${generalName}</span><span style="color:#dfc28c;margin:0 2px;">·</span><span style="color:#f5e6c8;font-weight:700;">${label}</span>`;
            } else if (generalName) {
                subjectHtml = `<span style="color:#ffffff;font-weight:700;">${generalName}</span>`;
            } else {
                subjectHtml = `<span style="color:#ffffff;font-weight:700;">${label}</span>`;
            }
        }

        // 动作与据点（黑金【据点】风格）
        let actionHtml = '';
        if (targetCityName) {
            const verb = isExpedition ? '征伐' : '前往';
            actionHtml = `<span style="color:#e6c894;margin-left:4px;">${verb}</span><span style="color:#fffcee;font-weight:900;">【${targetCityName}】</span>`;
        }

        return `<span style="margin-right:6px;">${icon}</span>${factionHtml}${subjectHtml}${actionHtml}`;
    }

    private restoreFollowBannerName(): void {
        if (!this.followedArmyId) return;
        const text = document.getElementById('follow-banner-text');
        if (!text) return;

        let newHtml: string | null = null;
        if (this.isFollowingPlayer()) {
            const player = (window as any).game?.playerHero ?? this.playerHero;
            if (player) {
                newHtml = this.formatFollowBannerText(player, player.name || '乱入者');
            }
        } else if (this.getArmiesFn) {
            const army = this.getArmiesFn().find((a) => a.id === this.followedArmyId);
            if (army) {
                newHtml = this.formatFollowBannerText(army, army.name || this.followedArmyId);
            }
        }

        if (newHtml && text.innerHTML !== newHtml) {
            text.innerHTML = newHtml;
        }
    }

    public setFollow(armyId: string, armyName: string): void {
        this.clearPendingAutoSwitch();
        this.followedArmyId = armyId;

        let label = armyName;
        if (this.isFollowingPlayer()) {
            const player = (window as any).game?.playerHero ?? this.playerHero;
            if (player) {
                label = this.formatFollowBannerText(player, armyName);
            }
        } else if (this.getArmiesFn) {
            const army = this.getArmiesFn().find((a) => a.id === armyId);
            if (army) {
                label = this.formatFollowBannerText(army, armyName);
            }
        }

        const text = document.getElementById('follow-banner-text');
        if (text) text.innerHTML = label;
        if (this.followBanner) {
            const inScene13 = (window as any).game?.scene13War?.isActive?.() || (window as any).game?.battleScene?.isInBattle?.();
            this.followBanner.style.display = inScene13 ? 'none' : 'flex';
        }
        this.syncFollowedHighlight();

        if (this.isListOpen) {
            this.refreshList();
        }

        if (this.onFollowChange) this.onFollowChange(this.getFollowedArmyId());
    }

    public cancelFollow(): void {
        this.clearPendingAutoSwitch();
        this.followedArmyId = null;

        if (this.followBanner) this.followBanner.style.display = 'none';
        this.syncFollowedHighlight();

        if (this.isListOpen) {
            this.refreshList();
        }

        if (this.onFollowChange) this.onFollowChange(null);
    }

    /** 跟随军团高亮（地图上区分玩家关注的一支） */
    private syncFollowedHighlight(): void {
        if (!this.getArmiesFn) return;
        const id = this.getFollowedArmyId();
        for (const army of this.getActiveLegions()) {
            army.setFollowedHighlight?.(army.id === id);
        }
    }

    public getFollowedArmyId(): string | null {
        // [2026-09-05 玩家] 跟玩家时对外报所在军团 id（入伍中）或玩家本人 id（独行）
        if (this.playerHero && this.followedArmyId === this.playerHero.id) {
            return this.playerHero.getHostLegionId() ?? this.playerHero.id;
        }
        return this.followedArmyId;
    }

    public isFollowing(): boolean {
        return this.followedArmyId !== null;
    }
}
