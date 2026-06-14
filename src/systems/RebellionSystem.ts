import { CityManager } from '../world/CityManager';
import { TimeSystem, Season } from '../app/TimeSystem';
import { getCityRegion, REGION_LABELS, RegionType } from './RegionSystem';
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

    /** 并列最强文化时随机抽一个 */
    private pickDominantCulture(cultureCityCount: Map<RegionType, number>): RegionType | null {
        if (cultureCityCount.size === 0) return null;

        let maxCount = 0;
        cultureCityCount.forEach((count) => {
            if (count > maxCount) maxCount = count;
        });

        const tied: RegionType[] = [];
        cultureCityCount.forEach((count, region) => {
            if (count === maxCount) tied.push(region);
        });

        return tied[Math.floor(Math.random() * tied.length)] ?? null;
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

    /**
     * 在合格起义据点中，优先选「原主文化区当前无任何据点」的灭国复国目标。
     */
    private pickRebellionTarget(
        validTargetCities: City[],
        cultureCityCount: Map<RegionType, number>
    ): { city: City; priorityExtinctCulture: RegionType | null } {
        const extinctCultureTargets: City[] = [];

        for (const city of validTargetCities) {
            const originalFactionId = this.initialFactionMap.get(city.id);
            if (!originalFactionId) continue;
            const originalCulture = this.getFactionNativeRegion(originalFactionId);
            if (!originalCulture) continue;
            if ((cultureCityCount.get(originalCulture) ?? 0) === 0) {
                extinctCultureTargets.push(city);
            }
        }

        const pool = extinctCultureTargets.length > 0 ? extinctCultureTargets : validTargetCities;
        const city = pool[Math.floor(Math.random() * pool.length)]!;
        const originalCulture = this.getFactionNativeRegion(
            this.initialFactionMap.get(city.id)!
        );

        const priorityExtinctCulture =
            extinctCultureTargets.length > 0 && originalCulture ? originalCulture : null;

        return { city, priorityExtinctCulture };
    }

    private executeSeasonalRebellion(season: Season, year: number): void {
        const cities = this.cityManager.getCities();
        if (cities.length === 0) return;

        const cultureCityCount = new Map<RegionType, number>();

        cities.forEach((city) => {
            if (!city.factionId || city.factionId === 'panjun') return;
            const ownerNativeRegion = this.getFactionNativeRegion(city.factionId);
            if (!ownerNativeRegion) return;
            cultureCityCount.set(
                ownerNativeRegion,
                (cultureCityCount.get(ownerNativeRegion) ?? 0) + 1
            );
        });

        const dominantCulture = this.pickDominantCulture(cultureCityCount);
        if (!dominantCulture) return;

        const dominantCount = cultureCityCount.get(dominantCulture) ?? 0;
        const dominantLabel = REGION_LABELS[dominantCulture] ?? dominantCulture;

        // ── 2026-06-12 阶梯式季度复国 ──
        let shouldRebel = false;
        if (dominantCount >= 160) {
            shouldRebel = true; // 春、夏、秋、冬皆触发（4次/年）
        } else if (dominantCount >= 120) {
            shouldRebel = (season !== Season.冬); // 春、夏、秋触发（3次/年）
        } else if (dominantCount >= 80) {
            shouldRebel = (season === Season.春 || season === Season.秋); // 春、秋触发（2次/年）
        } else if (dominantCount >= 40) {
            shouldRebel = (season === Season.春); // 仅春季触发（1次/年）
        }

        if (!shouldRebel) {
            return;
        }

        // [2026-06-12 性能优化] 军团数据预计算一次（替代每城重扫全部军团的 O(候选×军团)）：
        //   home/target → Set（O(1) 查），位置 → 数组（紧凑数值距离循环）。结果与 hasLegionsAtCity 一致。
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

        const validTargetCities: City[] = [];
        let blockedByLegions = 0;

        cities.forEach((city) => {
            if (!city.factionId || city.factionId === 'panjun') return;

            const ownerNativeRegion = this.getFactionNativeRegion(city.factionId);
            if (ownerNativeRegion !== dominantCulture) return;

            const cityGeoRegion = getCityRegion(city);
            if (cityGeoRegion === dominantCulture) return;

            const originalFactionId = this.initialFactionMap.get(city.id);
            if (!originalFactionId) return;
            if (city.factionId === originalFactionId) return;

            if (cityBlockedByLegion(city)) {
                blockedByLegions++;
                return;
            }

            validTargetCities.push(city);
        });

        if (validTargetCities.length === 0) {
            // 为避免每个季度都刷屏，如果只是没找到目标，不强行写日志，或者仅春季写日志（可选）
            // 这里为了让玩家感受到霸主的阻力，依然打印跳过日志。
            const skipReason =
                blockedByLegions > 0
                    ? `可起义据点均仍有军团驻守或正被围攻（${blockedByLegions}座），本轮跳过`
                    : '但无无主异文化占领据点可起义，本轮跳过';
            gameLog(
                'world',
                `📜 【复国】${this.formatYear(year)}：${dominantLabel}文化扩张极度强势（总计${dominantCount}城），${skipReason}。`
            );
            return;
        }

        const { city: targetCity, priorityExtinctCulture } = this.pickRebellionTarget(
            validTargetCities,
            cultureCityCount
        );
        const originalFactionId = this.initialFactionMap.get(targetCity.id)!;
        const previousFactionId = targetCity.factionId;
        const cityGeoLabel = REGION_LABELS[getCityRegion(targetCity)] ?? getCityRegion(targetCity);
        const extinctLabel = priorityExtinctCulture
            ? REGION_LABELS[priorityExtinctCulture] ?? priorityExtinctCulture
            : null;

        this.evictOccupierForces(targetCity.id, previousFactionId);

        this.cityManager.updateCity(
            targetCity.id,
            {
                factionId: originalFactionId,
                troops: this.restoreTroops(targetCity.id, targetCity.troops ?? 0),
            },
            { skipCaptureLog: true }
        );

        const priorityNote = extinctLabel ? `灭国文化【${extinctLabel}】优先，` : '';
        gameLog(
            'world',
            `⚔️ 【复国】${this.formatYear(year)}：${dominantLabel}文化扩张过快，${priorityNote}` +
                `${cityGeoLabel}【${targetCity.name}】起义，` +
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
