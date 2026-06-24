import { CityManager } from '../world/CityManager';
import { TimeSystem, Season } from '../app/TimeSystem';
import { getCityRegion, REGION_LABELS, REGION_ORDER, RegionType, isRegionCenter } from './RegionSystem';
import { gameLog } from '../utils/GameLogger';
import { City } from '../types/core';
import { Army } from '../legion/Army';
import { LegionManager } from '../legion/LegionManager';
import { SiegeManager } from '../combat/SiegeManager';
import { GameConfig } from '../config/GameConfig';
import { isNearCity } from '../core/DistanceUtils';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';

export type RestorationReport = {
    factionId: string;
    cityName: string;
};

export class RebellionSystem {
    private cityManager: CityManager;
    private timeSystem: TimeSystem;
    private legionManager: LegionManager | null;
    private siegeManager: SiegeManager | null;
    private restorationReporter: ((report: RestorationReport) => void) | null = null;

    /** 14文化轮流复国的当前下标（指向 REGION_ORDER） */
    private cultureRotationIndex: number = 0;

    /** 城市ID → 开局原生势力 */
    private initialFactionMap: Map<string, string> = new Map();
    /** 城市ID → 开局驻军 */
    private initialTroopsMap: Map<string, number> = new Map();
    /** 势力ID → 原生文化区 */
    private factionNativeRegionMap: Map<string, RegionType> = new Map();

    constructor(
        cityManager: CityManager,
        timeSystem: TimeSystem,
        legionManager?: LegionManager,
        siegeManager?: SiegeManager
    ) {
        this.cityManager = cityManager;
        this.timeSystem = timeSystem;
        this.legionManager = legionManager ?? null;
        this.siegeManager = siegeManager ?? null;

        this.initializeCaches();

        this.timeSystem.onSeasonChange((season: Season, year: number) => {
            const t0 = performance.now();
            this.executeSeasonalRebellion(season, year);
            PerformanceMonitor.getInstance().noteAsyncWork('rebellion', performance.now() - t0);
        });
    }

    /** 沙盒军情：成功复国时推送「势力 于 据点 复国」，跳过轮不通知 */
    setRestorationReporter(reporter: ((report: RestorationReport) => void) | null): void {
        this.restorationReporter = reporter;
    }

    /** 以 CityManager 开局快照为准（须与 loadGameAppCityData 沙盒改旗一致，不能用裸 CITIES） */
    private initializeCaches(): void {
        this.cityManager.getCities().forEach((city) => {
            if (!city.factionId || city.factionId === 'panjun') return;

            const region = getCityRegion(city);
            this.initialFactionMap.set(city.id, city.factionId);
            this.initialTroopsMap.set(
                city.id,
                city.troops ?? GameConfig.SIEGE.DEFAULT_CITY_TROOPS
            );
            this.factionNativeRegionMap.set(city.factionId, region);
        });
    }

    private getFactionNativeRegion(factionId: string): RegionType | null {
        return this.factionNativeRegionMap.get(factionId) ?? null;
    }

    /** 找单一最大势力（并列时随机选一个） */
    private pickLargestFaction(cities: City[]): { factionId: string; count: number } | null {
        const factionCityCount = new Map<string, number>();
        cities.forEach((city) => {
            if (!city.factionId || city.factionId === 'panjun') return;
            factionCityCount.set(city.factionId, (factionCityCount.get(city.factionId) ?? 0) + 1);
        });
        if (factionCityCount.size === 0) return null;

        let maxCount = 0;
        factionCityCount.forEach((c) => { if (c > maxCount) maxCount = c; });

        const tied: string[] = [];
        factionCityCount.forEach((c, id) => { if (c === maxCount) tied.push(id); });

        const factionId = tied[Math.floor(Math.random() * tied.length)]!;
        return { factionId, count: maxCount };
    }

    private getCityPos(cityId: string): { lat: number; lng: number } | null {
        const city = this.cityManager.getCity(cityId);
        return city ? { lat: city.latitude, lng: city.longitude } : null;
    }

    /** 军团以该城为驻地/目标，或位于城附近（≈30km） */
    private isArmyTiedToCity(
        army: Army,
        cityId: string,
        cityPos: { lat: number; lng: number } | null
    ): boolean {
        const homeId = army.homeCityId ?? army.getSourceCityId();
        const targetId = army.getTargetCity()?.id;
        return (
            homeId === cityId ||
            targetId === cityId ||
            (cityPos != null && isNearCity(army.getPosition(), cityPos))
        );
    }

    /** 据点旁仍有任何机动军团或进行中攻城 → 不可起义（避免改旗后与军队不同势力） */
    private hasLegionsAtCity(cityId: string): boolean {
        if (this.siegeManager?.hasActiveSiegeAt(cityId)) return true;
        if (!this.legionManager) return false;

        const cityPos = this.getCityPos(cityId);
        for (const army of this.legionManager.getArmies()) {
            if (army.isDestroyed) continue;
            if (this.isArmyTiedToCity(army, cityId, cityPos)) return true;
        }
        return false;
    }

    private evictOccupierForces(cityId: string, previousFactionId: string): void {
        this.siegeManager?.abortCitySiege(cityId);

        if (!this.legionManager) return;

        const cityPos = this.getCityPos(cityId);
        const armies = [...this.legionManager.getArmies()];
        for (const army of armies) {
            if (army.isDestroyed || army.getFactionId() !== previousFactionId) continue;
            if (!this.isArmyTiedToCity(army, cityId, cityPos)) continue;

            army.destroy();
            this.legionManager.removeArmy(army);
        }
    }

    private restoreTroops(cityId: string, currentTroops: number): number {
        const baseline = this.initialTroopsMap.get(cityId) ?? GameConfig.SIEGE.DEFAULT_CITY_TROOPS;
        return Math.max(baseline, Math.floor(currentTroops * 0.5));
    }

    /** 失陷未满 MIN_YEARS_AFTER_FALL 游戏年 → 不可起义复国 */
    private isRestorationCooldownActive(city: City, year: number): boolean {
        const fallenAt = city.fallenAtYear;
        if (fallenAt == null) return false;
        return year - fallenAt < GameConfig.REBELLION.MIN_YEARS_AFTER_FALL;
    }

    /**
     * 从合格起义据点中按「14文化轮流 + 兵力/城级优先」选出复国目标。
     *
     * 流程：
     *   1. 将候选城按地理文化区分组
     *   2. 从当前轮次文化（cultureRotationIndex）开始顺序查找第一个有候选的文化区
     *   3. 在该文化区内按优先级选最优城：兵力↓ → 大城 → 文化中心 → 中城
     *   4. 旋转下标前进到下一个文化，留给下次复国使用
     */
    private pickRebellionTarget(validTargetCities: City[]): City {
        // 按地理区分组
        const byRegion = new Map<RegionType, City[]>();
        for (const city of validTargetCities) {
            const region = getCityRegion(city);
            if (!byRegion.has(region)) byRegion.set(region, []);
            byRegion.get(region)!.push(city);
        }

        // 从当前轮次开始找第一个有候选的文化区
        for (let i = 0; i < REGION_ORDER.length; i++) {
            const idx = (this.cultureRotationIndex + i) % REGION_ORDER.length;
            const region = REGION_ORDER[idx]!;
            const candidates = byRegion.get(region);
            if (!candidates || candidates.length === 0) continue;

            // 推进下标，下次从这个文化的下一个开始
            this.cultureRotationIndex = (idx + 1) % REGION_ORDER.length;

            return this.bestCityInPool(candidates);
        }

        // 兜底（理论上 validTargetCities 非空时不会到达）
        return this.bestCityInPool(validTargetCities);
    }

    /** 在池内按「兵力↓ → 大城 → 文化中心 → 中城」选最优城 */
    private bestCityInPool(cities: City[]): City {
        const typeScore = (city: City): number => {
            if (city.type === 'big_city') return 3;
            if (isRegionCenter(city.id)) return 2;
            if (city.type === 'medium_city') return 1;
            return 0;
        };
        return [...cities].sort((a, b) => {
            const troopsDiff = (b.troops ?? 0) - (a.troops ?? 0);
            if (troopsDiff !== 0) return troopsDiff;
            return typeScore(b) - typeScore(a);
        })[0]!;
    }

    private executeSeasonalRebellion(season: Season, year: number): void {
        const cities = this.cityManager.getCities();
        if (cities.length === 0) return;

        // ── 1. 找单一最大势力 ──
        const largest = this.pickLargestFaction(cities);
        if (!largest) return;
        const { factionId: largestFactionId, count: largestCount } = largest;
        const largestFactionName = this.cityManager.getFactionName(largestFactionId);

        // ── 2. 阶梯式季度触发（以最大势力城数为准）──
        // ≥400：春夏秋冬（4次/年）
        // ≥300：春夏秋（3次/年）
        // ≥200：春秋（2次/年）
        // ≥100：仅春（1次/年）
        // <100：不触发
        let shouldRebel = false;
        if (largestCount >= 400) {
            shouldRebel = true;
        } else if (largestCount >= 300) {
            shouldRebel = (season !== Season.冬);
        } else if (largestCount >= 200) {
            shouldRebel = (season === Season.春 || season === Season.秋);
        } else if (largestCount >= 100) {
            shouldRebel = (season === Season.春);
        }

        if (!shouldRebel) return;

        // ── 3. 最大势力的原生文化区（用于排除本文化据点）──
        const largestNativeRegion = this.getFactionNativeRegion(largestFactionId);

        // ── 4. 军团数据预计算（O(1) 城市查询）──
        const tiedCityIds = new Set<string>();
        const legionPositions: Array<{ lat: number; lng: number }> = [];
        if (this.legionManager) {
            for (const army of this.legionManager.getArmies()) {
                if (army.isDestroyed) continue;
                const homeId = army.homeCityId ?? army.getSourceCityId();
                if (homeId) tiedCityIds.add(homeId);
                const targetId = army.getTargetCity()?.id;
                if (targetId) tiedCityIds.add(targetId);
                legionPositions.push(army.getPosition());
            }
        }
        const cityBlockedByLegion = (city: City): boolean => {
            if (this.siegeManager?.hasActiveSiegeAt(city.id)) return true;
            if (tiedCityIds.has(city.id)) return true;
            const pos = { lat: city.latitude, lng: city.longitude };
            for (let i = 0; i < legionPositions.length; i++) {
                if (isNearCity(legionPositions[i], pos)) return true;
            }
            return false;
        };

        // ── 5. 筛选候选据点 ──
        // 条件：由最大势力占领 + 非本文化地理区 + 已易主 + 冷却到期 + 无军团驻守
        const validTargetCities: City[] = [];
        let blockedByLegions = 0;
        let blockedByCooldown = 0;

        cities.forEach((city) => {
            if (city.factionId !== largestFactionId) return;

            // 本文化据点不复国
            const cityGeoRegion = getCityRegion(city);
            if (largestNativeRegion && cityGeoRegion === largestNativeRegion) return;

            // 必须已易主（非原归属势力）
            const originalFactionId = this.initialFactionMap.get(city.id);
            if (!originalFactionId || city.factionId === originalFactionId) return;

            if (this.isRestorationCooldownActive(city, year)) {
                blockedByCooldown++;
                return;
            }
            if (cityBlockedByLegion(city)) {
                blockedByLegions++;
                return;
            }
            validTargetCities.push(city);
        });

        if (validTargetCities.length === 0) {
            const skipReason =
                blockedByLegions > 0 && blockedByCooldown > 0
                    ? `可起义据点均在失陷冷却、或有军团驻守/正被围攻（冷却${blockedByCooldown}座，驻军${blockedByLegions}座），本轮跳过`
                    : blockedByCooldown > 0
                      ? `可起义据点均在失陷冷却期内（${blockedByCooldown}座，须失陷满${GameConfig.REBELLION.MIN_YEARS_AFTER_FALL}游戏年），本轮跳过`
                      : blockedByLegions > 0
                        ? `可起义据点均仍有军团驻守或正被围攻（${blockedByLegions}座），本轮跳过`
                        : '但无异文化占领据点可起义，本轮跳过';
            gameLog(
                'world',
                `📜 【复国】${this.formatYear(year)}：${largestFactionName}（${largestCount}城）扩张强势，${skipReason}。`
            );
            return;
        }

        // ── 6. 按优先级选出最优复国目标（兵力→大城→文化中心→中城）──
        const targetCity = this.pickRebellionTarget(validTargetCities);
        const originalFactionId = this.initialFactionMap.get(targetCity.id)!;
        const previousFactionId = targetCity.factionId;
        const cityGeoLabel = REGION_LABELS[getCityRegion(targetCity)] ?? getCityRegion(targetCity);

        this.evictOccupierForces(targetCity.id, previousFactionId);
        this.cityManager.updateCity(
            targetCity.id,
            {
                factionId: originalFactionId,
                troops: this.restoreTroops(targetCity.id, targetCity.troops ?? 0),
            },
            { skipCaptureLog: true }
        );

        gameLog(
            'world',
            `⚔️ 【复国】${this.formatYear(year)}：${largestFactionName}（${largestCount}城）扩张过快，` +
                `${cityGeoLabel}【${targetCity.name}】（${targetCity.troops ?? 0}兵）起义，` +
                `${this.cityManager.getFactionName(previousFactionId)} 被驱逐，` +
                `${this.cityManager.getFactionName(originalFactionId)} 复国！`
        );

        this.restorationReporter?.({
            factionId: originalFactionId,
            cityName: targetCity.name,
        });
    }

    private formatYear(year: number): string {
        return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
    }
}
