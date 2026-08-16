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
import { GENERAL_PROFILES } from '../data/GeneralSkills';

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
    private topStatsContainer: HTMLDivElement | null = null;
    private listHeader: HTMLDivElement | null = null;
    private lastLegionCount: number = -1;
    /** 面板展开时列表节流刷新（势力兵力/据点/色条实时） */
    private lastListRefreshAt = 0;
    private static readonly LIST_REFRESH_INTERVAL_MS = 500;
    /** 军团按钮下缘 ≈ 62px；岳飞按钮固定于此，列表面板 z-index 更高盖住它 */
    private static readonly STACK_LEFT_PX = 16;
    private static readonly YUEFEI_BTN_TOP_PX = 62;
    private static readonly HUOQUBING_BTN_TOP_PX = 104;
    private static readonly ZHUGELIANG_BTN_TOP_PX = 146;
    private static readonly LIST_PANEL_TOP_PX = 62;
    /** 势力统计数据源（合并势力榜后，每行附带势力兵力/据点数） */
    private cityManager: { getCities(): any[] } | null = null;
    private factionManager: { getFactionName(id: string): string | undefined; getFactionColor(id: string): string | undefined } | null = null;

    /** 「岳飞北伐黄龙」圆梦按钮回调（由 GameApp 注入） */
    private onYuefeiExpedition: (() => void) | null = null;
    /** 「霍去病封狼居胥」按钮回调（由 GameApp 注入） */
    private onHuoQubingExpedition: (() => void) | null = null;
    /** 「诸葛亮北伐中原」按钮回调（由 GameApp 注入） */
    private onZhugeLiangExpedition: (() => void) | null = null;

    constructor() {
        this.createListButton();
        this.createYuefeiButton();
        this.createHuoQubingButton();
        this.createZhugeLiangButton();
        this.createListPanel();
        this.createFollowBanner();
    }

    /** 注入「岳飞北伐黄龙」按钮点击回调 */
    public setYuefeiHandler(fn: () => void): void {
        this.onYuefeiExpedition = fn;
    }

    /** 注入「霍去病封狼居胥」按钮点击回调 */
    public setHuoQubingHandler(fn: () => void): void {
        this.onHuoQubingExpedition = fn;
    }

    /** 注入「诸葛亮北伐中原」按钮点击回调 */
    public setZhugeLiangHandler(fn: () => void): void {
        this.onZhugeLiangExpedition = fn;
    }

    /** 开局尚未手动选军团时，首次出现野战军团则自动跟随（名将优先，否则兵力最多） */
    private autoFollowOnStartPending = true;
    private pendingFollowName: string | null = null;

    private waitingForRespawn = false;

    private autoFollowEnabled = true;
    private autoFollowCheckbox: HTMLInputElement | null = null;
    /** 自动跟随计时：无目标时开始计时，5秒后触发 */
    private autoFollowNoTargetSince = 0;
    private static readonly AUTO_FOLLOW_DELAY_MS = 5000;

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

    // ─── 1b. 岳飞北伐黄龙（固定于军团按钮下；列表展开时被面板盖住） ────────

    private createYuefeiButton(): void {
        const btn = document.createElement('button');
        btn.id = 'yuefei-expedition-btn';
        btn.title = '岳飞率背嵬军十万，自郾城北伐：开封 → 北京 → 沈阳 → 黄龙府';
        btn.innerHTML = '⚔ 岳飞痛饮黄龙';
        btn.style.cssText = `
            position: fixed;
            top: ${CameraFollowUI.YUEFEI_BTN_TOP_PX}px;
            left: ${CameraFollowUI.STACK_LEFT_PX}px;
            z-index: 10000;
            padding: 7px 16px;
            font-size: 13px;
            font-weight: bold;
            color: #fdfbf7;
            background: linear-gradient(135deg, rgba(156, 48, 47, 0.85) 0%, rgba(110, 28, 30, 0.92) 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(156, 48, 47, 0.45);
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(156,48,47,0.22), inset 0 1px 0 rgba(255,255,255,0.25);
            transition: all 0.25s ease;
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            letter-spacing: 2px;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = '#d4a843';
            btn.style.background = 'linear-gradient(135deg, rgba(184, 56, 54, 0.95) 0%, rgba(125, 32, 35, 0.95) 100%)';
            btn.style.boxShadow = '0 4px 20px rgba(156,48,47,0.35), inset 0 1px 0 rgba(255,255,255,0.4)';
            btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(156, 48, 47, 0.45)';
            btn.style.background = 'linear-gradient(135deg, rgba(156, 48, 47, 0.85) 0%, rgba(110, 28, 30, 0.92) 100%)';
            btn.style.boxShadow = '0 4px 16px rgba(156,48,47,0.22), inset 0 1px 0 rgba(255,255,255,0.25)';
            btn.style.transform = 'none';
        });

        btn.addEventListener('click', () => this.onYuefeiExpedition?.());

        document.body.appendChild(btn);
    }

    // ─── 1c. 霍去病封狼居胥（固定于岳飞按钮下） ────────

    private createHuoQubingButton(): void {
        const btn = document.createElement('button');
        btn.id = 'huoqubing-expedition-btn';
        btn.title = '霍去病率轻勇骑，出灵仙北伐：上都 → 应昌 → 阔亦田 → 狼居胥山 → 姑衍山 → 贝加尔';
        btn.innerHTML = '⚔ 霍去病封狼居胥';
        btn.style.cssText = `
            position: fixed;
            top: ${CameraFollowUI.HUOQUBING_BTN_TOP_PX}px;
            left: ${CameraFollowUI.STACK_LEFT_PX}px;
            z-index: 10000;
            padding: 7px 16px;
            font-size: 13px;
            font-weight: bold;
            color: #fdfbf7;
            background: linear-gradient(135deg, rgba(156, 48, 47, 0.85) 0%, rgba(110, 28, 30, 0.92) 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(156, 48, 47, 0.45);
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(156,48,47,0.22), inset 0 1px 0 rgba(255,255,255,0.25);
            transition: all 0.25s ease;
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            letter-spacing: 2px;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = '#d4a843';
            btn.style.background = 'linear-gradient(135deg, rgba(184, 56, 54, 0.95) 0%, rgba(125, 32, 35, 0.95) 100%)';
            btn.style.boxShadow = '0 4px 20px rgba(156,48,47,0.35), inset 0 1px 0 rgba(255,255,255,0.4)';
            btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(156, 48, 47, 0.45)';
            btn.style.background = 'linear-gradient(135deg, rgba(156, 48, 47, 0.85) 0%, rgba(110, 28, 30, 0.92) 100%)';
            btn.style.boxShadow = '0 4px 16px rgba(156,48,47,0.22), inset 0 1px 0 rgba(255,255,255,0.25)';
            btn.style.transform = 'none';
        });

        btn.addEventListener('click', () => this.onHuoQubingExpedition?.());

        document.body.appendChild(btn);
    }

    // ─── 1d. 诸葛亮北伐中原（固定于霍去病按钮下） ────────

    private createZhugeLiangButton(): void {
        const btn = document.createElement('button');
        btn.id = 'zhugeliang-expedition-btn';
        btn.title = '诸葛亮率白毦军，出汉中北伐：略阳 → 河池 → 天水 → 汧源(街亭) → 岐山(五丈原) → 长安';
        btn.innerHTML = '⚔ 诸葛亮北伐中原';
        btn.style.cssText = `
            position: fixed;
            top: ${CameraFollowUI.ZHUGELIANG_BTN_TOP_PX}px;
            left: ${CameraFollowUI.STACK_LEFT_PX}px;
            z-index: 10000;
            padding: 7px 16px;
            font-size: 13px;
            font-weight: bold;
            color: #fdfbf7;
            background: linear-gradient(135deg, rgba(156, 48, 47, 0.85) 0%, rgba(110, 28, 30, 0.92) 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(156, 48, 47, 0.45);
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(156,48,47,0.22), inset 0 1px 0 rgba(255,255,255,0.25);
            transition: all 0.25s ease;
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            letter-spacing: 2px;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = '#d4a843';
            btn.style.background = 'linear-gradient(135deg, rgba(184, 56, 54, 0.95) 0%, rgba(125, 32, 35, 0.95) 100%)';
            btn.style.boxShadow = '0 4px 20px rgba(156,48,47,0.35), inset 0 1px 0 rgba(255,255,255,0.4)';
            btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(156, 48, 47, 0.45)';
            btn.style.background = 'linear-gradient(135deg, rgba(156, 48, 47, 0.85) 0%, rgba(110, 28, 30, 0.92) 100%)';
            btn.style.boxShadow = '0 4px 16px rgba(156,48,47,0.22), inset 0 1px 0 rgba(255,255,255,0.25)';
            btn.style.transform = 'none';
        });

        btn.addEventListener('click', () => this.onZhugeLiangExpedition?.());

        document.body.appendChild(btn);
    }

    // ─── 2. 军团列表面板（z-index 高于岳飞/霍去病/诸葛亮按钮，展开时盖住下层按钮） ────────

    private createListPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'army-list-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${CameraFollowUI.LIST_PANEL_TOP_PX}px;
            left: 0;
            width: 320px;
            max-height: 72vh;
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

        const autoFollowLabel = document.createElement('label');
        autoFollowLabel.title = '无目标时自动跟随：名将优先，同档比兵力';
        autoFollowLabel.style.cssText = `
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            display: flex;
            align-items: center;
        `;
        const autoFollowCheckbox = document.createElement('input');
        autoFollowCheckbox.type = 'checkbox';
        autoFollowCheckbox.checked = this.autoFollowEnabled;
        autoFollowCheckbox.style.cursor = 'pointer';
        autoFollowCheckbox.style.accentColor = '#9c302f';
        autoFollowCheckbox.addEventListener('change', (e) => {
            this.autoFollowEnabled = (e.target as HTMLInputElement).checked;
            this.autoFollowNoTargetSince = 0;
        });
        this.autoFollowCheckbox = autoFollowCheckbox;
        autoFollowLabel.appendChild(autoFollowCheckbox);
        header.appendChild(autoFollowLabel);

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
            // 全军覆灭后在等待，现在新军团出现了 → 自动跟随
            // 勾选自动跟随时，无目标10秒后自动跟随最强军团
            if (this.autoFollowEnabled && !this.followedArmyId && count > 0) {
                const now = performance.now();
                if (this.autoFollowNoTargetSince === 0) {
                    this.autoFollowNoTargetSince = now;
                } else if (now - this.autoFollowNoTargetSince >= CameraFollowUI.AUTO_FOLLOW_DELAY_MS) {
                    this.autoFollowNoTargetSince = 0;
                    this.followLargestLegion();
                }
            } else if (this.autoFollowEnabled && this.followedArmyId) {
                this.autoFollowNoTargetSince = 0;
            }
            if (this.waitingForRespawn && count > 0) {
                this.waitingForRespawn = false;
                this.followLargestLegion();
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
                ? `<span style="display:inline-flex; align-items:center; margin-left:6px; padding:0 5px; font-size:10px; font-weight:800; color:#9c302f; background:rgba(156,48,47,0.1); border:1px solid rgba(156,48,47,0.4); border-radius:10px; line-height:1.3; vertical-align:middle;">🔥${winStreak}连胜</span>`
                : '';

            // 第一行：名次 + 军团名 + 连胜 + 军团兵力；第二行：势力色点 + 势力名 + 势力兵力 + 据点数
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; ${nameStyle}">
                        ${isFollowed ? '🎥 ' : ''}<span style="color:#8c7e6b; font-weight:normal; font-size:12px;">${idx + 1}.</span> ${titleHtml}${streakHtml}
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

            item.addEventListener('click', () => {
                this.setFollow(army.id, name);
                this.closeList();
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
                streakCard.addEventListener('click', () => {
                    this.setFollow(streakArmyId, streakArmyName);
                    this.closeList();
                });
            }
        }
    }

    private isFamousGeneralLegion(army: any): boolean {
        const gid = army.generalId as string | undefined;
        if (!gid) return false;
        return GENERAL_PROFILES[gid]?.tier === 'famous';
    }

    /**
     * [2026-08-09 主人定] 自动跟随：名将优先保留，同档随机。
     * 开局兵力全相同 → "兵力高者优先"恒等无意义（此前导致总跟第一支生成的军团，如莫斯科）。
     * 实现：名将池非空 → 名将池随机取一；否则全场随机取一。不走 sort（随机比较器有风险）。
     */
    private pickBestAutoFollowLegion(armies: any[]): any | null {
        if (armies.length === 0) return null;
        const famous = armies.filter((a) => this.isFamousGeneralLegion(a));
        const pool = famous.length > 0 ? famous : armies;
        return pool[Math.floor(Math.random() * pool.length)];
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
            padding: 6px 18px;
            font-size: 14px;
            font-weight: bold;
            color: #1a1612;
            background: linear-gradient(135deg, rgba(248, 242, 230, 0.68) 0%, rgba(235, 220, 198, 0.75) 100%);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(125, 111, 90, 0.22);
            border-radius: 20px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7);
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            letter-spacing: 0.5px;
            pointer-events: auto;
            white-space: nowrap;
        `;

        const text = document.createElement('span');
        text.id = 'follow-banner-text';
        text.textContent = '🎥 正在跟随：';
        banner.appendChild(text);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ 取消';
        closeBtn.style.cssText = `
            background: rgba(156, 48, 47, 0.1);
            border: 1px solid rgba(156, 48, 47, 0.35);
            color: #9c302f;
            padding: 2px 9px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            font-weight: bold;
            transition: all 0.2s ease;
            margin-left: 4px;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(156, 48, 47, 0.22)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(156, 48, 47, 0.1)';
        });
        closeBtn.addEventListener('click', () => {
            this.cancelFollow();
        });
        const renameBtn = document.createElement('button');
        renameBtn.textContent = '✎ 改名';
        renameBtn.style.cssText = `
            background: rgba(91, 122, 102, 0.12);
            border: 1px solid rgba(91, 122, 102, 0.35);
            color: #1d3326;
            padding: 2px 9px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            font-weight: bold;
            transition: all 0.2s ease;
            margin-left: 6px;
        `;
        renameBtn.addEventListener('mouseenter', () => {
            renameBtn.style.background = 'rgba(91, 122, 102, 0.25)';
        });
        renameBtn.addEventListener('mouseleave', () => {
            renameBtn.style.background = 'rgba(91, 122, 102, 0.12)';
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

    private formatFollowBannerText(army: any, fallbackName: string): string {
        let label = army.name || fallbackName;

        let generalName = '';
        if (army.generalId) {
            const generalRecord = getGeneralRecordByGeneralId(army.generalId);
            if (generalRecord) generalName = generalRecord.generalName;
        }

        const factionId = army.getFactionId?.() ?? '';
        const factionName = this.factionManager?.getFactionName(factionId) ?? '';

        let targetCityName = '';
        if (army.expeditionTargetCityId) {
            const targetCity = CITIES_V2.find((c: any) => c.id === army.expeditionTargetCityId);
            if (targetCity) targetCityName = targetCity.name;
        }

        const tagFaction = factionName
            ? `<span style="color:#2e6b48;font-weight:800;margin-right:6px;font-size:13px;">${factionName}</span>`
            : '';
        const tagGen = generalName
            ? `<span style="color:#9c302f;font-weight:900;letter-spacing:0.5px;font-size:15px;">${generalName}</span>`
            : '';
        const tagShuai = `<span style="color:#5c4e3e;font-size:12px;margin:0 3px;font-weight:bold;">率</span>`;
        const tagElite = `<span style="color:#1a1612;font-weight:800;font-size:14px;">${label}</span>`;
        const tagYuanZheng = `<span style="color:#9c302f;font-size:12px;font-weight:bold;margin:0 4px;">远征 →</span>`;
        const tagTarget = `<span style="color:#9c302f;font-weight:800;background:rgba(156,48,47,0.08);border:1px solid rgba(156,48,47,0.35);border-radius:4px;padding:1px 6px;">${targetCityName}</span>`;

        if (generalName && targetCityName) {
            return `${tagFaction}${tagGen}${tagShuai}${tagElite}${tagYuanZheng}${tagTarget}`;
        }
        if (generalName) {
            return `${tagFaction}${tagGen}${tagShuai}${tagElite}`;
        }
        if (targetCityName) {
            return `${tagFaction}${tagElite}${tagYuanZheng}${tagTarget}`;
        }
        return `${tagFaction}${tagElite}`;
    }

    private restoreFollowBannerName(): void {
        if (!this.followedArmyId || !this.getArmiesFn) return;
        const army = this.getArmiesFn().find((a) => a.id === this.followedArmyId);
        if (!army) return;
        const text = document.getElementById('follow-banner-text');
        if (text) text.innerHTML = this.formatFollowBannerText(army, army.id);
    }

    public setFollow(armyId: string, armyName: string): void {
        this.clearPendingAutoSwitch();
        this.followedArmyId = armyId;
        this.autoFollowNoTargetSince = 0;

        let label = armyName;
        if (this.getArmiesFn) {
            const army = this.getArmiesFn().find((a) => a.id === armyId);
            if (army) {
                label = this.formatFollowBannerText(army, armyName);
            }
        }

        const text = document.getElementById('follow-banner-text');
        if (text) text.innerHTML = label;
        if (this.followBanner) this.followBanner.style.display = 'flex';
        this.syncFollowedHighlight();

        if (this.isListOpen) {
            this.refreshList();
        }

        if (this.onFollowChange) this.onFollowChange(armyId);
    }

    public cancelFollow(): void {
        this.clearPendingAutoSwitch();
        this.autoFollowOnStartPending = false;
        this.waitingForRespawn = false;
        this.followedArmyId = null;

        // [2026-06-23 Fix] 不要在取消跟随（如点击✖或拖拽地图）时强行把用户的“自动跟随”设置给关掉。
        // 既然这个 checkbox 代表用户的偏好，就应该一直保持用户自己勾选的状态。
        // this.autoFollowEnabled = false;
        // if (this.autoFollowCheckbox) this.autoFollowCheckbox.checked = false;

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
        const id = this.followedArmyId;
        for (const army of this.getActiveLegions()) {
            army.setFollowedHighlight?.(army.id === id);
        }
    }

    /** 跟随军团阵亡/无目标时：优先切到名将军团，否则兵力最多 */
    public followLargestLegion(): void {
        this.clearPendingAutoSwitch();
        if (!this.getArmiesFn) {
            this.cancelFollow();
            return;
        }

        const armies = this.getActiveLegions();
        if (armies.length === 0) {
            // 全军覆灭，保持跟随状态等待新军团
            this.waitingForRespawn = true;
            const text = document.getElementById('follow-banner-text');
            if (text) text.textContent = '🎥 军团全部阵亡，等待新军团…';
            if (this.followBanner) this.followBanner.style.display = 'flex';
            return;
        }

        const best = this.pickBestAutoFollowLegion(armies);
        if (!best) return;
        this.setFollow(best.id, best.name || best.id);
    }

    /** 游戏开始后自动跟随：尚无选中军团且场上已有野战军团时（名将优先，仅触发一次） */
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
