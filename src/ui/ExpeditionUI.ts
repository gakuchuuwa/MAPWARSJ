/**
 * ExpeditionUI.ts - 远征指令 UI（GAME_DIRECTION「远征细则」2026-06-11；2026-07-06 改「达标即自动远征」）
 *
 * 仅对跟拍军团生效（镜头即玩家化身，干预通道唯一）：
 * 1. 跟拍军团兵力 ≥ GameConfig.EXPEDITION.UNLOCK_TROOPS 且不在远征中 → 自动锁定目标出征（无按钮、无面板）
 *      · 目标优先级：名将未竟历史目标（⭐，见 GeneralFirstExpeditionTargets）＞ 最近异文化中心
 * 2. 远征中顶部横幅显示「🐎 远征中 → 目标」；目标锁死、断粮不回，直至占领或全军覆没
 *      （收尾见 LegionBehaviors.resolveExpeditionState：目标变己方 = 功成回师）
 * 3. 资格滞回锁：兵力到过 UNLOCK_TROOPS 即解锁，掉破仍保留，低于半数才重锁（防 4 万线抖动导致反复触发）
 * 4. AI 军团永不远征（eligibleArmy 只认跟拍军团）。DEV：X 键补兵到 4.5 万便于秒验证。
 */

import { GameConfig } from '../config/GameConfig';
import {
    applyExpeditionEliteRename,
    canLegionLaunchExpedition,
} from '../data/ExpeditionLegions';
import { REGION_CENTERS, REGION_LABELS, RegionType } from '../systems/RegionSystem';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import { getGeneralFirstTarget } from '../data/GeneralFirstExpeditionTargets';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';

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
    /** 跟拍军团远征中：顶部横幅显示当前远征目标 */
    private statusBanner: HTMLDivElement | null = null;

    private getFollowedArmy: (() => ExpeditionArmy | null) | null = null;
    private cityManager: ExpeditionCityAccess | null = null;

    public init(
        getFollowedArmy: () => ExpeditionArmy | null,
        cityManager: ExpeditionCityAccess
    ): void {
        this.getFollowedArmy = getFollowedArmy;
        this.cityManager = cityManager;
        this.createStatusBanner();
        window.setInterval(() => this.refresh(), GameConfig.EXPEDITION.SCAN_INTERVAL_MS);
    }

    /** 远征目标横幅（跟随横幅正下方） */
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

    /** 半秒一次：远征中显示目标横幅；否则跟拍军团达标即自动出征 */
    private refresh(): void {
        if (!this.statusBanner) return;

        const followed = this.getFollowedArmy?.() ?? null;
        const targetId = followed && !followed.isDestroyed ? followed.expeditionTargetCityId : null;
        if (followed && targetId) {
            const cityName = this.cityManager?.getCity(targetId)?.name ?? targetId;
            // 历史使命远征（名将执念目标）：横幅打出「将名·⭐依据」高潮字幕；否则普通远征只报区·城名
            const historic = getGeneralFirstTarget(followed.generalId);
            if (historic && historic.cityId === targetId) {
                const genName = followed.generalId
                    ? getGeneralRecordByGeneralId(followed.generalId)?.generalName
                    : null;
                this.statusBanner.textContent =
                    `🐎 ${genName ? `${genName} · ` : ''}⭐${historic.label} → ${cityName}`;
            } else {
                const region = REGION_BY_CENTER.get(targetId);
                this.statusBanner.textContent =
                    `🐎 远征中 → ${region ? `${REGION_LABELS[region]}·` : ''}${cityName}`;
            }
            this.statusBanner.style.display = 'block';
            return;
        }

        this.statusBanner.style.display = 'none';

        // 达标即自动远征（2026-07-06）：跟拍军团一够 4 万且可远征，立即锁定目标出征
        //   （避免军团先跑去乱打把自己耗残、解锁又被撤销）。
        const army = this.eligibleArmy();
        if (army) this.autoLaunch(army);
    }

    /**
     * 达标即自动远征：eligibleArmy 通过即自动锁定目标出征。
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

    /** 距军团最近的可远征异文化中心 */
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
        //   直至被打到低于半数（RELOCK 线）才解除——避免军团在 4 万线抖动导致反复触发。
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
     * 补兵后下一轮 refresh（≤0.5s）会自动锁定目标出征，便于秒验证自动远征链路。
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
}
