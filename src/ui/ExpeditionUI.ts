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
import { getGeneralFirstTarget } from '../data/GeneralFirstExpeditionTargets';

interface ExpeditionArmy {
    id: string;
    name: string;
    isDestroyed: boolean;
    expeditionTargetCityId: string | null;
    expeditionSavedName: string | null;
    /** 远征资格滞回锁：达到过 UNLOCK_TROOPS 即 true，掉破 4 万仍保留资格 */
    expeditionUnlocked: boolean;
    /** 军团出身文化区（远征不可选本文化中心） */
    cultureRegion: RegionType | null;
    homeCityId?: string | null;
    /** 军团主将 id（带将时）——查名将历史首征目标 */
    generalId?: string;
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
        this.button.style.display = 'none'; // 达标即自动远征后，手动按钮不再出现

        // 达标即自动远征（用户 2026-07-06 定，取代手动点按钮）：
        //   跟拍军团一够 4 万且可远征，立即锁定目标出征——避免军团先跑去乱打把自己耗残、解锁又被撤销。
        if (this.panel) return; // 面板开着时不打断（自动模式下理论上不会开）
        const army = this.eligibleArmy();
        if (army) this.autoLaunch(army);
    }

    /**
     * 达标即自动远征（用户 2026-07-06 定）：eligibleArmy 通过即自动锁定目标出征。
     * 目标优先级：名将未竟历史目标（⭐）＞ 最近异文化中心。改番号、断粮不回。
     * 仅跟拍军团走此路（eligibleArmy 只认跟拍军团；AI 军团不自动远征）。
     */
    private autoLaunch(army: ExpeditionArmy): void {
        let targetId: string | null = null;
        let targetName = '';
        let label = '';
        const historic = this.resolveHistoricTarget(army);
        if (historic) {
            targetId = historic.city.id;
            targetName = historic.city.name;
            label = `⭐${historic.label}`;
        } else {
            const cand = this.nearestCandidate(army);
            if (cand) {
                targetId = cand.city.id;
                targetName = cand.city.name;
                label = REGION_LABELS[cand.region];
            }
        }
        if (!targetId) return; // 无可远征目标（eligibleArmy 通常已挡掉）
        if (!applyExpeditionEliteRename(army)) return;

        army.expeditionTargetCityId = targetId;
        gameLog(
            'expedition',
            `🐎 [远征] ${army.name}（${Math.floor(army.getTroops() / 10000)} 万兵·自动）远征【${targetName}·${label}】——断粮不回，直至占领或全军覆没`
        );
        this.pushFeed(army.getFactionId(), army.name, targetName, 'depart');
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

    /**
     * 名将历史首征目标（generalId → cities_v2 城）：
     *   军团带的名将配了历史目标、且该城尚不属己方 → 返回它（默认锁定，优先夺取）。
     *   已属己方 / 无名将 / 未配置 → null（回落选文化中心）。历史目标不受「异文化」限制。
     */
    private resolveHistoricTarget(army: ExpeditionArmy): { city: ExpeditionCity; label: string } | null {
        const t = getGeneralFirstTarget(army.generalId);
        if (!t) return null;
        const city = this.cityManager?.getCity(t.cityId);
        if (!city) return null;
        if (city.factionId === army.getFactionId()) return null; // 已攥稳 → 走文化中心
        return { city, label: t.label };
    }

    private eligibleArmy(): ExpeditionArmy | null {
        const army = this.getFollowedArmy?.() ?? null;
        if (!army || army.isDestroyed) return null;
        if (army.expeditionTargetCityId) return null; // 已在远征中

        // 滞回资格锁（修复"按钮一闪就没"）：
        //   兵力达到过 UNLOCK_TROOPS → 置锁；此后即便战斗掉破 4 万仍保留可远征资格，
        //   直至被打到低于半数（RELOCK 线）才解除——避免军团在 4 万线抖动导致按钮反复闪现、点不到。
        const troops = army.getTroops();
        const unlock = GameConfig.EXPEDITION.UNLOCK_TROOPS;
        if (troops >= unlock) {
            army.expeditionUnlocked = true;
        } else if (troops < unlock / 2) {
            army.expeditionUnlocked = false; // 已被打残，重新回到需满 4 万才解锁
        }
        if (!army.expeditionUnlocked) return null;

        if (!canLegionLaunchExpedition(army)) return null;
        // 历史目标未拿下时，即便文化中心都已属己方，仍可远征去打历史目标
        if (this.listCandidates(army).length === 0 && !this.resolveHistoricTarget(army)) return null;
        return army;
    }

    /**
     * [DEV ONLY] 一键把当前跟随军团补到 4.5 万（刚过 4 万解锁线），**不**代设远征目标。
     * 用于观察：军团解锁后系统是否会自行发起远征、还是仅冒出「🐎 远征」按钮等玩家点。
     * 返回给玩家看的结果字符串。生产构建不会调用（X 键被 import.meta.env.DEV 包裹）。
     */
    public devBoostTroops(): string {
        const army = this.getFollowedArmy?.() ?? null;
        if (!army || army.isDestroyed) return '⚠ 先在「🎖️ 军团」列表点一支军团跟随，再按 X';
        if (army.expeditionTargetCityId) return `${army.name} 已在远征中（目标未变）`;
        const setter = (army as unknown as { setTroops?: (n: number) => void }).setTroops;
        if (!setter) return `${army.name}：无法设置兵力（setTroops 缺失）`;
        setter.call(army, 45000);
        const canLaunch = canLegionLaunchExpedition(army);
        gameLog('expedition', `⚔ [DEV] ${army.name} 兵力补至 4.5 万${canLaunch ? '（已解锁，半秒内自动远征）' : '（无精锐番号，不能远征）'}`);
        return canLaunch
            ? `⚔ ${army.name} 已补至 4.5 万·已解锁——半秒内将自动锁定目标出征，盯着远征图标看`
            : `⚔ ${army.name} 已补至 4.5 万，但该势力无史籍精锐番号，不能远征`;
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

        // 名将未竟的历史目标（默认锁定；仍可在下方改选文化中心）
        const historic = this.resolveHistoricTarget(army);

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

        if (historic) {
            const HBG = 'linear-gradient(90deg, rgba(200,140,40,0.28), rgba(160,90,30,0.16))';
            const HBG_HOVER = 'linear-gradient(90deg, rgba(220,160,55,0.45), rgba(180,105,38,0.32))';
            const hkm = Math.round(
                getEuclideanDistance(pos, { lat: historic.city.latitude, lng: historic.city.longitude }) * 111
            );
            const hitem = document.createElement('div');
            hitem.style.cssText = `
                padding: 10px 14px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(220,140,70,0.4);
                background: ${HBG};
                font-size: 14px;
                font-weight: bold;
                color: #ffdc8a;
                transition: background 0.15s;
            `;
            hitem.innerHTML = `
                <span>⭐ 历史使命 · ${historic.label} · ${historic.city.name}</span>
                <span style="color:#cfa860; font-size:12px;">约 ${hkm} km</span>
            `;
            hitem.addEventListener('mouseenter', () => (hitem.style.background = HBG_HOVER));
            hitem.addEventListener('mouseleave', () => (hitem.style.background = HBG));
            const hid = historic.city.id;
            hitem.addEventListener('click', () => this.confirmTarget(hid));
            panel.appendChild(hitem);
        }

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
                const autoId = historic ? historic.city.id : candidates[0]?.city.id;
                if (autoId) {
                    this.confirmTarget(autoId, true);
                } else {
                    this.closePanel();
                }
                return;
            }
            if (this.countdownLabel) {
                this.countdownLabel.textContent = historic
                    ? `⏳ ${Math.ceil(left / 1000)} 秒后自动出征 ⭐${historic.city.name}`
                    : `⏳ ${Math.ceil(left / 1000)} 秒后自动代选最近的文化中心`;
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
