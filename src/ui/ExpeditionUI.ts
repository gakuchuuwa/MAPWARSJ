/**
 * ExpeditionUI.ts - 远征指令 UI（GAME_DIRECTION「远征细则」2026-06-11；2026-07-06 改「达标即自动远征」）
 *
 * 仅对跟拍军团生效（镜头即玩家化身，干预通道唯一）：
 * 1. 跟拍军团兵力 ≥ GameConfig.EXPEDITION.UNLOCK_TROOPS 且不在远征中 → 自动锁定目标出征（无按钮、无面板）
 *      · 目标：全图据点最多的敌对势力、距大本营最远的那座城（剧本自行设 expeditionTargetCityId）
 * 2. 远征中顶部横幅显示「🐎 远征中 → 目标」；目标锁死、绝不回头（家城被打/失守都不回），
 *      直至占领目标城或全军覆没（收尾见 LegionBehaviors.resolveExpeditionState：目标变己方 = 功成）
 * 3. 资格滞回锁：兵力到过 UNLOCK_TROOPS 即解锁，掉破仍保留，低于半数才重锁（防 5 万线抖动反复触发）
 * 4. AI 军团永不远征（eligibleArmy 只认跟拍军团）。DEV：X 键补兵到 5.5 万便于秒验证。
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
import { STARTING_CAPITALS } from '../data/StartingCapitals';

interface ExpeditionArmy {
    id: string;
    name: string;
    isDestroyed: boolean;
    expeditionTargetCityId: string | null;
    expeditionSavedName: string | null;
    /** 远征资格滞回锁：达到过 UNLOCK_TROOPS 即 true，掉破 5 万仍保留资格 */
    expeditionUnlocked: boolean;
    /** 军团出身文化区 */
    cultureRegion: RegionType | null;
    homeCityId?: string | null;
    /** 军团主将 id */
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
    /** 据点类型（big_city/medium_city/small_city/pass）— 远征候选排序用 */
    type: string;
    /** 驻军兵力 — 同类型据点按此降序 */
    troops: number;
}

interface ExpeditionCityAccess {
    getCity(id: string): ExpeditionCity | undefined;
    /** 获取所有据点（用于统计势力城数） */
    getCities(): ExpeditionCity[];
    /** 获取势力名称 */
    getFactionName?(factionId: string): string;
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
            align-items: center;
            padding: 6px 14px;
            font-size: 13px;
            font-weight: bold;
            color: #ffe0b2;
            background: linear-gradient(180deg, rgba(30, 20, 12, 0.94) 0%, rgba(45, 28, 15, 0.90) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(230, 150, 60, 0.45);
            border-radius: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            letter-spacing: 0.5px;
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
                    `🐎 远征 → ${region ? `${REGION_LABELS[region]}·` : ''}${cityName}`;
            }
            this.statusBanner.style.display = 'block';
            return;
        }

        this.statusBanner.style.display = 'none';

        // 达标即自动远征（2026-07-06）：跟拍军团一够 5 万且可远征，立即锁定目标出征
        //   （避免军团先跑去乱打把自己耗残、解锁又被撤销）。
        const army = this.eligibleArmy();
        if (army) this.autoLaunch(army);
    }

    /**
     * 达标即自动远征：eligibleArmy 通过即自动锁定目标出征。
     * 目标：全图据点最多的敌对势力。改番号、断粮不回。
     * 仅跟拍军团走此路（eligibleArmy 只认跟拍军团；AI 军团不自动远征）。
     */
    private autoLaunch(army: ExpeditionArmy): void {
        const cand = this.farthestCandidate(army);
        if (!cand) return;
        const targetId = cand.city.id;
        const targetName = cand.city.name;
        const label = cand.factionName;
        if (!targetId) return;
        if (!applyExpeditionEliteRename(army)) return;

        army.expeditionTargetCityId = targetId;
        gameLog(
            'expedition',
            `🐎 [远征] ${army.name}（${Math.floor(army.getTroops() / 10000)} 万兵·自动）远征【${targetName}·${label}】——断粮不回，直至占领或全军覆没`
        );
        this.pushFeed(army.getFactionId(), army.name, targetName, 'depart');
    }

    /** 距大本营最远的可远征目标（远征嘛，往远了打；多个并列时取最远的） */
    private farthestCandidate(army: ExpeditionArmy): { city: ExpeditionCity; factionName: string } | null {
        const candidates = this.listCandidates(army);
        if (candidates.length === 0) return null;
        // 以大本营为锚点算距离（远征从家出发）
        const homeCity = army.homeCityId ? this.cityManager?.getCity(army.homeCityId) : null;
        const anchor = homeCity
            ? { lat: homeCity.latitude, lng: homeCity.longitude }
            : army.getPosition();
        let best = candidates[0];
        let bestDist = getEuclideanDistance(anchor, { lat: best.city.latitude, lng: best.city.longitude });
        for (let i = 1; i < candidates.length; i++) {
            const c = candidates[i];
            const d = getEuclideanDistance(anchor, { lat: c.city.latitude, lng: c.city.longitude });
            if (d > bestDist) {
                bestDist = d;
                best = c;
            }
        }
        return { city: best.city, factionName: this.cityManager?.getFactionName?.(best.city.factionId) ?? best.city.factionId };
    }

    /**
     * 远征目标：全图据点最多的敌对势力（枪打出头鸟）。
     * 排除本势力 + panjun；多个并列全取，交给 farthestCandidate 选最远。
     */
    private listCandidates(army: ExpeditionArmy): { city: ExpeditionCity; region: RegionType }[] {
        if (!this.cityManager) return [];
        const myFaction = army.getFactionId();
        const allCities = this.cityManager.getCities();

        // 统计各势力据点数量（排除本势力 + panjun）
        const countByFaction = new Map<string, number>();
        for (const c of allCities) {
            if (c.factionId === myFaction || c.factionId === 'panjun') continue;
            countByFaction.set(c.factionId, (countByFaction.get(c.factionId) ?? 0) + 1);
        }
        if (countByFaction.size === 0) return [];

        // 找到城数最多的势力（并列全取）
        let maxCount = 0;
        for (const cnt of countByFaction.values()) {
            if (cnt > maxCount) maxCount = cnt;
        }
        const leaders: string[] = [];
        for (const [fid, cnt] of countByFaction) {
            if (cnt === maxCount) leaders.push(fid);
        }

        // 每个领头势力取一座城：优先首都 → 大城 → 中城 → 小城 → 关隘
        const CITY_TYPE_RANK: Record<string, number> = { big_city: 1, medium_city: 2, small_city: 3, pass: 4, stockade: 5 };
        const out: { city: ExpeditionCity; region: RegionType }[] = [];
        for (const fid of leaders) {
            const factionCities = allCities.filter(c => c.factionId === fid);
            if (factionCities.length === 0) continue;
            const capitalId = STARTING_CAPITALS[fid];
            const capital = capitalId ? this.cityManager.getCity(capitalId) : null;
            const capitalStillOwned = capital && capital.factionId === fid;
            // 按类型优先级排序：首都优先，同类型按 troops 降序
            factionCities.sort((a, b) => {
                if (capitalStillOwned) {
                    if (a.id === capitalId) return -1;
                    if (b.id === capitalId) return 1;
                }
                const ra = CITY_TYPE_RANK[a.type] ?? 5;
                const rb = CITY_TYPE_RANK[b.type] ?? 5;
                if (ra !== rb) return ra - rb;
                return (b.troops ?? 0) - (a.troops ?? 0);
            });
            const city = factionCities[0];
            out.push({ city, region: 'CENTRAL' as RegionType });
        }
        return out;
    }

    private eligibleArmy(): ExpeditionArmy | null {
        const army = this.getFollowedArmy?.() ?? null;
        if (!army || army.isDestroyed) return null;
        if (army.expeditionTargetCityId) return null; // 已在远征中

        // 滞回资格锁：兵力达到过 5 万即置锁，掉破仍保留，低于半数才重锁（防 5 万线抖动反复触发）
        const troops = army.getTroops();
        const unlock = GameConfig.EXPEDITION.UNLOCK_TROOPS;
        if (troops >= unlock) {
            army.expeditionUnlocked = true;
        } else if (troops < unlock / 2) {
            army.expeditionUnlocked = false; // 已被打残，重新回到需满 5 万才解锁
        }
        if (!army.expeditionUnlocked) return null;

        if (!canLegionLaunchExpedition(army)) return null;
        if (this.listCandidates(army).length === 0) return null;
        return army;
    }

    /**
     * [DEV ONLY] 一键把当前跟随军团补到 5.5 万（刚过 5 万解锁线），**不**代设远征目标。
     * 补兵后下一轮 refresh（≤0.5s）会自动锁定目标出征，便于秒验证自动远征链路。
     * 返回给玩家看的结果字符串。生产构建不会调用（X 键被 import.meta.env.DEV 包裹）。
     */
    public devBoostTroops(): string {
        const army = this.getFollowedArmy?.() ?? null;
        if (!army || army.isDestroyed) return '⚠ 先在「🎖️ 军团」列表点一支军团跟随，再按 X';
        if (army.expeditionTargetCityId) return `${army.name} 已在远征中（目标未变）`;
        const setter = (army as unknown as { setTroops?: (n: number) => void }).setTroops;
        if (!setter) return `${army.name}：无法设置兵力（setTroops 缺失）`;
        setter.call(army, 55000);
        const canLaunch = canLegionLaunchExpedition(army);
        gameLog('expedition', `⚔ [DEV] ${army.name} 兵力补至 5.5 万${canLaunch ? '（已解锁，半秒内自动远征）' : '（无精锐番号，不能远征）'}`);
        return canLaunch
            ? `⚔ ${army.name} 已补至 5.5 万·已解锁——半秒内将自动锁定目标出征，盯着远征图标看`
            : `⚔ ${army.name} 已补至 5.5 万，但该势力无史籍精锐番号，不能远征`;
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
