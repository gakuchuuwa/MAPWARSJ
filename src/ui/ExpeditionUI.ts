/**
 * ExpeditionUI.ts - 远征指令 UI（GAME_DIRECTION「远征细则」2026-06-11）
 *
 * 仅对跟拍军团生效（镜头即玩家化身，干预通道唯一）：
 * 1. 跟拍军团兵力 ≥ GameConfig.EXPEDITION.UNLOCK_TROOPS 且不在远征中 → 顶部横幅旁出现「🐎 远征」按钮
 * 2. 点击 → 弹出 15 文化中心城选择面板（己方已占的中心不可选）
 * 3. 15 秒倒计时内未选 → 自动选距军团最近的异文化中心
 * 4. 选定 → army.expeditionTargetCityId = 目标城；行为树进入远征模式
 *    （目标锁死、断粮不回师，直至占领或全军覆没，见 LegionBehaviors.resolveExpeditionState）
 * 5. 远征结束后兵力仍 ≥ 5 万 → 按钮自动再现，可连续远征
 */

import { GameConfig } from '../config/GameConfig';
import {
    applyExpeditionEliteRename,
    canLegionLaunchExpedition,
    getLegionEliteLegionName,
} from '../data/ExpeditionLegions';
import { REGION_CENTERS, REGION_LABELS, RegionType } from '../systems/RegionSystem';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';

interface ExpeditionArmy {
    id: string;
    name: string;
    isDestroyed: boolean;
    expeditionTargetCityId: string | null;
    expeditionSavedName: string | null;
    /** 军团出身文化区（远征不可选本文化中心） */
    cultureRegion: RegionType | null;
    homeCityId?: string | null;
    getTroops(): number;
    getFactionId(): string;
    getSourceCityId(): string | null;
    getPosition(): { lat: number; lng: number };
}

interface ExpeditionCity {
    id: string;
    name: string;
    factionId: string;
    latitude: number;
    longitude: number;
}

interface ExpeditionCityAccess {
    getCity(id: string): ExpeditionCity | undefined;
}

/** cityId → 所属文化区（用于远征目标横幅显示） */
const REGION_BY_CENTER = new Map<string, RegionType>();
for (const [region, cityIds] of Object.entries(REGION_CENTERS) as [RegionType, string[]][]) {
    for (const cityId of cityIds) REGION_BY_CENTER.set(cityId, region);
}

export class ExpeditionUI {
    private button: HTMLButtonElement | null = null;
    /** 跟拍军团远征中：显示远征目标（跟随横幅正下方，与远征按钮互斥） */
    private statusBanner: HTMLDivElement | null = null;
    private panel: HTMLDivElement | null = null;
    private countdownLabel: HTMLDivElement | null = null;
    private countdownTimer: number | null = null;
    private deadlineAt = 0;
    /** 面板打开时锁定的军团（防止倒计时途中切换跟拍对象） */
    private panelArmyId: string | null = null;

    private getFollowedArmy: (() => ExpeditionArmy | null) | null = null;
    private cityManager: ExpeditionCityAccess | null = null;

    public init(
        getFollowedArmy: () => ExpeditionArmy | null,
        cityManager: ExpeditionCityAccess
    ): void {
        this.getFollowedArmy = getFollowedArmy;
        this.cityManager = cityManager;
        this.createButton();
        this.createStatusBanner();
        window.setInterval(() => this.refreshButton(), GameConfig.EXPEDITION.SCAN_INTERVAL_MS);
    }

    // ─── 「远征」按钮（跟随横幅正下方） ─────────────────

    private createButton(): void {
        const btn = document.createElement('button');
        btn.id = 'expedition-btn';
        btn.innerHTML = '🐎 远征';
        btn.title = `跟拍军团兵力 ≥ ${GameConfig.EXPEDITION.UNLOCK_TROOPS / 10000} 万，且势力有史籍精锐专名：直取一座文化中心城`;
        btn.style.cssText = `
            display: none;
            padding: 6px 16px;
            font-size: 14px;
            font-weight: bold;
            color: #f0e6d2;
            background: linear-gradient(135deg, rgba(90,30,20,0.85), rgba(120,50,25,0.85));
            backdrop-filter: blur(4px);
            border: 1px solid rgba(220,140,70,0.5);
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            font-family: 'SimSun', 'Songti SC', serif;
            letter-spacing: 2px;
            pointer-events: auto;
            white-space: nowrap;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = 'rgba(255,180,90,0.95)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(220,140,70,0.7)';
        });
        btn.addEventListener('click', () => this.openPanel());
        
        const container = document.getElementById('top-center-hud');
        if (container) {
            container.appendChild(btn);
        } else {
            document.body.appendChild(btn);
        }
        this.button = btn;
    }

    /** 远征目标横幅（与远征按钮同位置，互斥显示） */
    private createStatusBanner(): void {
        const banner = document.createElement('div');
        banner.id = 'expedition-status';
        banner.style.cssText = `
            display: none;
            padding: 6px 16px;
            font-size: 14px;
            font-weight: bold;
            color: #f5d9a8;
            background: rgba(50, 25, 10, 0.85);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(220,140,70,0.5);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            font-family: 'SimSun', 'Songti SC', serif;
            letter-spacing: 1px;
            pointer-events: auto;
            white-space: nowrap;
        `;
        
        const container = document.getElementById('top-center-hud');
        if (container) {
            container.appendChild(banner);
        } else {
            document.body.appendChild(banner);
        }
        this.statusBanner = banner;
    }

    /** 半秒一次：远征中显示目标横幅；否则满足解锁条件才显示按钮 */
    private refreshButton(): void {
        if (!this.button || !this.statusBanner) return;

        const followed = this.getFollowedArmy?.() ?? null;
        const targetId = followed && !followed.isDestroyed ? followed.expeditionTargetCityId : null;
        if (targetId) {
            const city = this.cityManager?.getCity(targetId);
            const region = REGION_BY_CENTER.get(targetId);
            this.statusBanner.textContent =
                `🐎 远征中 → ${region ? `${REGION_LABELS[region]}·` : ''}${city?.name ?? targetId}`;
            this.statusBanner.style.display = 'block';
            this.button.style.display = 'none';
            return;
        }

        this.statusBanner.style.display = 'none';
        const army = this.eligibleArmy();
        if (army && !this.panel) {
            // 预览：显示最近的异文化中心（超时自动代选目标 = 默认主攻方向）
            const preview = this.nearestCandidate(army);
            this.button.innerHTML = preview
                ? `🐎 远征 → ${REGION_LABELS[preview.region]}·${preview.city.name}`
                : '🐎 远征';
            this.button.style.display = 'block';
        } else {
            this.button.style.display = 'none';
        }
    }

    /** 距军团最近的可远征异文化中心（用于按钮预览与超时代选一致） */
    private nearestCandidate(army: ExpeditionArmy): { city: ExpeditionCity; region: RegionType } | null {
        const candidates = this.listCandidates(army);
        if (candidates.length === 0) return null;
        const pos = army.getPosition();
        let best = candidates[0];
        let bestDist = getEuclideanDistance(pos, { lat: best.city.latitude, lng: best.city.longitude });
        for (let i = 1; i < candidates.length; i++) {
            const c = candidates[i];
            const d = getEuclideanDistance(pos, { lat: c.city.latitude, lng: c.city.longitude });
            if (d < bestDist) {
                bestDist = d;
                best = c;
            }
        }
        return best;
    }

    private eligibleArmy(): ExpeditionArmy | null {
        const army = this.getFollowedArmy?.() ?? null;
        if (!army || army.isDestroyed) return null;
        if (army.getTroops() < GameConfig.EXPEDITION.UNLOCK_TROOPS) return null;
        if (!canLegionLaunchExpedition(army)) return null;
        if (army.expeditionTargetCityId) return null; // 已在远征中
        if (this.listCandidates(army).length === 0) return null; // 全部文化中心已属己方
        return army;
    }

    /**
     * [DEV ONLY] 一键强制发起远征：把当前跟随军团补到 8 万 + 直取最近的异文化中心。
     * 用于避开"军团边打边掉血、远征按钮一闪就没、点不到"的问题（供 X 快捷键调用）。
     * 返回给玩家看的结果字符串。生产构建不会调用（X 键被 import.meta.env.DEV 包裹）。
     */
    public devForceLaunch(): string {
        const army = this.getFollowedArmy?.() ?? null;
        if (!army || army.isDestroyed) return '⚠ 先在「🎖️ 军团」列表点一支军团跟随，再按 X';
        if (army.expeditionTargetCityId) return `${army.name} 已在远征中（目标未变）`;
        // 只补到 4.2 万（刚过 4 万解锁线）：打一仗就会掉到 4 万以下，
        // 方便验证"跌破 4 万后远征是否还在"——这正是玩家要观察的关键。
        (army as unknown as { setTroops?: (n: number) => void }).setTroops?.(42000);
        if (!canLegionLaunchExpedition(army)) return `${army.name}：该势力无史籍精锐番号，不能远征`;
        const cand = this.nearestCandidate(army);
        if (!cand) return `${army.name}：附近文化中心都已是己方，无可远征目标`;
        if (!applyExpeditionEliteRename(army)) return `${army.name}：改番号失败`;
        army.expeditionTargetCityId = cand.city.id;
        gameLog('expedition', `🐎 [远征] ${army.name}（DEV一键·4.2万兵）远征【${cand.city.name}】——断粮不回`);
        this.pushFeed(army.getFactionId(), army.name, cand.city.name, 'depart');
        return `✅ ${army.name} → 远征 ${REGION_LABELS[cand.region]}·${cand.city.name}（补至4.2万，打一仗就掉破4万，盯着远征图标看）`;
    }

    /** 可选目标：15 文化中心里**异文化**且非己方的（本文化中心不可远征——主人 2026-06-11 补） */
    private listCandidates(army: ExpeditionArmy): { city: ExpeditionCity; region: RegionType }[] {
        if (!this.cityManager) return [];
        const myFaction = army.getFactionId();
        const myCulture = army.cultureRegion;
        const out: { city: ExpeditionCity; region: RegionType }[] = [];
        for (const [region, cityIds] of Object.entries(REGION_CENTERS) as [RegionType, string[]][]) {
            if (region === myCulture) continue; // 远征 = 对外文化用兵，不打自家文化中心
            for (const cityId of cityIds) {
                const city = this.cityManager.getCity(cityId);
                if (!city || city.factionId === myFaction) continue;
                out.push({ city, region });
            }
        }
        return out;
    }

    // ─── 选择面板（15 秒倒计时） ───────────────────────

    private openPanel(): void {
        if (this.panel) return;
        const army = this.eligibleArmy();
        if (!army) return;
        this.panelArmyId = army.id;

        const candidates = this.listCandidates(army);
        const pos = army.getPosition();
        candidates.sort(
            (a, b) =>
                getEuclideanDistance(pos, { lat: a.city.latitude, lng: a.city.longitude }) -
                getEuclideanDistance(pos, { lat: b.city.latitude, lng: b.city.longitude })
        );

        const panel = document.createElement('div');
        panel.id = 'expedition-panel';
        panel.style.cssText = `
            position: fixed;
            top: 90px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10003;
            width: 320px;
            max-height: 60vh;
            overflow-y: auto;
            background: linear-gradient(180deg, rgba(30,22,12,0.97), rgba(20,15,8,0.98));
            border: 2px solid rgba(220,140,70,0.7);
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.7);
            font-family: 'SimSun', 'Songti SC', serif;
            color: #f0e6d2;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px 14px;
            font-size: 14px;
            font-weight: bold;
            border-bottom: 1px solid rgba(220,140,70,0.35);
            color: #e8b25a;
            letter-spacing: 2px;
            text-align: center;
        `;
        const eliteHint = getLegionEliteLegionName(army);
        header.textContent = eliteHint
            ? `🐎 ${army.name} · 远征何方？（将编为「${eliteHint}」）`
            : `🐎 ${army.name} · 远征何方？`;
        panel.appendChild(header);

        const countdown = document.createElement('div');
        countdown.style.cssText = `
            padding: 6px 14px;
            font-size: 12px;
            text-align: center;
            color: #d08040;
            border-bottom: 1px solid rgba(220,140,70,0.25);
        `;
        panel.appendChild(countdown);
        this.countdownLabel = countdown;

        for (const { city, region } of candidates) {
            const item = document.createElement('div');
            const km = Math.round(
                getEuclideanDistance(pos, { lat: city.latitude, lng: city.longitude }) * 111
            );
            item.style.cssText = `
                padding: 8px 14px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid rgba(100,80,40,0.2);
                font-size: 13px;
                transition: background 0.15s;
            `;
            item.innerHTML = `
                <span>${REGION_LABELS[region]} · ${city.name}</span>
                <span style="color:#aaa; font-size:12px;">约 ${km} km</span>
            `;
            item.addEventListener('mouseenter', () => (item.style.background = 'rgba(220,140,70,0.18)'));
            item.addEventListener('mouseleave', () => (item.style.background = 'transparent'));
            item.addEventListener('click', () => this.confirmTarget(city.id));
            panel.appendChild(item);
        }

        const cancelBtn = document.createElement('div');
        cancelBtn.style.cssText = `
            padding: 8px 14px;
            text-align: center;
            cursor: pointer;
            font-size: 13px;
            color: #c08080;
        `;
        cancelBtn.textContent = '✕ 取消（本次不远征）';
        cancelBtn.addEventListener('click', () => this.closePanel());
        panel.appendChild(cancelBtn);

        document.body.appendChild(panel);
        this.panel = panel;
        if (this.button) this.button.style.display = 'none';

        // 15 秒倒计时，超时自动选最近异文化中心（candidates 已按距离排序）
        this.deadlineAt = performance.now() + GameConfig.EXPEDITION.SELECT_TIMEOUT_MS;
        const tick = () => {
            const left = this.deadlineAt - performance.now();
            if (left <= 0) {
                const auto = candidates[0];
                if (auto) {
                    this.confirmTarget(auto.city.id, true);
                } else {
                    this.closePanel();
                }
                return;
            }
            if (this.countdownLabel) {
                this.countdownLabel.textContent = `⏳ ${Math.ceil(left / 1000)} 秒后自动代选最近的文化中心`;
            }
        };
        tick();
        this.countdownTimer = window.setInterval(tick, 250);
    }

    private confirmTarget(cityId: string, isAuto = false): void {
        const lockedArmyId = this.panelArmyId; // closePanel 会清空，先取
        const army = this.getFollowedArmy?.() ?? null;
        const city = this.cityManager?.getCity(cityId);
        this.closePanel();

        // 倒计时期间军团可能阵亡/被切换/目标易主——逐项复核
        if (!army || army.isDestroyed || army.id !== lockedArmyId) return;
        if (!city) return;
        if (!applyExpeditionEliteRename(army)) return;

        if (city.factionId === army.getFactionId()) {
            // 选定瞬间目标已属己方 → 随机换一个异文化中心（远征细则）
            const rest = this.listCandidates(army);
            if (rest.length === 0) return;
            const swap = rest[Math.floor(Math.random() * rest.length)];
            army.expeditionTargetCityId = swap.city.id;
            gameLog(
                'expedition',
                `🐎 [远征] 【${city.name}】已属己方，改道：${army.name} 远征【${swap.city.name}】`
            );
            this.pushFeed(army.getFactionId(), army.name, swap.city.name, 'depart');
            return;
        }

        army.expeditionTargetCityId = cityId;
        gameLog(
            'expedition',
            `🐎 [远征] ${army.name}（${Math.floor(army.getTroops() / 10000)} 万兵）${isAuto ? '（超时代选）' : ''}远征【${city.name}】——断粮不回，直至占领或全军覆没`
        );
        this.pushFeed(army.getFactionId(), army.name, city.name, 'depart');
    }

    /** 军情面板播报（S 级「征」徽章行） */
    private pushFeed(factionId: string | undefined, legionName: string, cityName: string, kind: 'depart' | 'success'): void {
        if (window.game?.brawlFeedPanel) {
            (window as unknown as {
                game?: { brawlFeedPanel?: { pushExpedition(p: { factionId?: string; legionName: string; cityName: string; kind: 'depart' | 'success' }): void } };
            }).game?.brawlFeedPanel?.pushExpedition({
                factionId,
                legionName,
                cityName,
                kind
            });
        }
    }

    private closePanel(): void {
        if (this.countdownTimer !== null) {
            window.clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        this.countdownLabel = null;
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.panelArmyId = null;
        this.refreshButton();
    }
}
