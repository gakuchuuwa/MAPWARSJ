/**
 * RecruitmentSystem — 乱斗募兵
 *
 * 用户点「播放」后：执行一次出兵检查（runInitialSpawn，仅一次）
 * 每季（15 游戏秒 = 1 季度）：
 *   1. 据点驻军 + 大城400 / 中城300 / 小城200 / 关隘100（见 CityConfig.recruitPerSeason）
 *      【2026-06-12 主人裁定】产出**全进城防**——曾实装一日的「家城产出优先补自家军团」已删除
 *      （它关闭了"一城一军保护伞下家城囤积→军团死后爆发出大军"的通道，导致大军团绝迹）。
 *      军团兵力的恢复改为**战后恢复 30%**（CombatSystem.getPostBattleRecoveryRate）。
 *      家城失守仍强制回师（行为树 resolveRecaptureTarget，游戏原生行为，所有文化无豁免；
 *      例外：远征军团（shouldSkipHomeRecapture）不回师）。
 *   2. 大城/中城/小城/关隘检查是否可组建军团（总上限见 MAX_ACTIVE_LEGIONS）：
 *      ① 每文化区保底 1 支
 *      ② 优先：视野内、非跟随势力、驻军高的据点
 *      ③ 余量：全图驻军最高的据点
 */
import { CityManager } from '../core/CityManager';
import { LegionManager } from '../core/LegionManager';
import { GameConfig } from '../config/GameConfig';
import { CITY_CONFIG, clampCityTroops } from '../config/CityConfig';
import { GameTime } from '../core/GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { gameLog } from '../utils/GameLogger';
import { getCityRegion, REGION_ORDER, RegionType } from '../systems/RegionSystem';
import type { SiegeManager } from '../combat/SiegeManager';

type RecruitmentCity = ReturnType<CityManager['getCities']>[number];
type SpawnCandidate = {
    city: RecruitmentCity;
    armySize: number;
    region: RegionType;
    inViewport: boolean;
};

export class RecruitmentSystem {
    private cityManager: CityManager;
    private legionManager: LegionManager;
    private siegeManager: SiegeManager | null;
    private seasonTimer: number = 0;
    private hasRunInitialSpawn = false;
    /** 每季募兵后分批刷新城市标签，避免一帧更新 600+ DOM 卡顿 */
    private pendingLabelCityIds: Set<string> = new Set();
    private static readonly LABEL_UPDATES_PER_FRAME = 20;

    constructor(
        cityManager: CityManager,
        legionManager: LegionManager,
        siegeManager?: SiegeManager
    ) {
        this.cityManager = cityManager;
        this.legionManager = legionManager;
        this.siegeManager = siegeManager ?? null;
    }

    /** 攻城进行中：驻军已作为 city 单位参战，禁止再募兵/季末补进驻军 */
    private isCityGarrisonCommitted(cityId: string): boolean {
        return this.siegeManager?.isCityUnderAttack(cityId) ?? false;
    }

    /**
     * 用户点击「播放」并开始运行后出兵（仅一次，不等第一个 15 秒季度）
     * 条件与 trySpawnLegions 相同：大城/中城/小城/关隘、无现役军、90% 兵力 ≥ MIN_ARMY_SIZE
     */
    public runInitialSpawn(): void {
        if (this.hasRunInitialSpawn) return;
        this.hasRunInitialSpawn = true;

        this.legionManager.trimLegionsToCap();

        const cities = this.cityManager.getCities();
        gameLog('recruitment', '💂 [募兵] 播放开始 — 首次出兵（分帧异步）');

        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const candidates = this.buildSpawnPlan(cities);

        // 错峰生成：每隔 INITIAL_SPAWN_INTERVAL_MS 放行 INITIAL_SPAWN_PER_TICK 支，
        // 让军团陆续登场而非同帧爆出（直播观感 + 避免 INP 卡顿）。
        const perTick = Math.max(1, GameConfig.LEGION.INITIAL_SPAWN_PER_TICK);
        const intervalMs = GameConfig.LEGION.INITIAL_SPAWN_INTERVAL_MS;
        let idx = 0;

        const spawnTick = () => {
            let spawnedThisTick = 0;
            while (
                idx < candidates.length &&
                spawnedThisTick < perTick &&
                this.legionManager.getActiveLegionCount() < maxLegions
            ) {
                const { city, armySize } = candidates[idx++];
                if (this.cityHasActiveLegion(city.id)) continue; // 再次确认

                const newLegion = this.spawnCandidate(city, armySize);
                if (!newLegion) continue;
                spawnedThisTick++;
                (window as any).game?.cameraFollowUI?.tryAutoFollowOnStart();
            }

            // 还有剩余候选且未达上限，错峰等待下一批
            if (idx < candidates.length && this.legionManager.getActiveLegionCount() < maxLegions) {
                setTimeout(spawnTick, intervalMs);
            } else {
                gameLog('recruitment', `💂 [募兵] 首次出兵完成，共 ${this.legionManager.getActiveLegionCount()} 支军团`);
                (window as any).game?.cameraFollowUI?.tryAutoFollowOnStart();
            }
        };

        spawnTick();
    }

    public update(gameDelta: number): void {
        if (gameDelta <= 0) return;

        this.flushPendingCityLabels();

        this.seasonTimer += gameDelta;
        if (this.seasonTimer < GameTime.SEASON_DURATION) return;

        // 保留溢出，避免丢帧累积误差
        this.seasonTimer -= GameTime.SEASON_DURATION;
        this.runSeasonTick();
    }

    private runSeasonTick(): void {
        const t0 = performance.now();
        const cities = this.cityManager.getCities();
        this.recruitSeasonGarrison(cities);
        this.trySpawnLegions(cities);
        this.legionManager.tickLegionTiers(); // 兵力长到 4万的军团晋升精锐（含名将）
        PerformanceMonitor.getInstance().noteAsyncWork('recruitSeason', performance.now() - t0);
    }

    /**
     * 每季：按据点等级补驻军（大400 / 中300 / 小200 / 关100），产出全进城防。
     * 【2026-06-12 主人裁定】「家城产出优先补自家军团」已删除；军团恢复改为战后统一 30%。
     */
    private recruitSeasonGarrison(cities: ReturnType<CityManager['getCities']>): void {
        for (const city of cities) {
            if (!city.factionId || city.factionId === '' || city.factionId === 'panjun') continue;

            const cfg = CITY_CONFIG[city.type];
            if (!cfg) continue;

            // 攻城战中驻军兵力由 BattleUnitFactory 适配器缓存驱动，勿直接改 city.troops
            if (!this.isCityGarrisonCommitted(city.id)) {
                city.troops = clampCityTroops(city.type, (city.troops || 0) + cfg.recruitPerSeason);
            }
            this.pendingLabelCityIds.add(city.id);
        }
    }

    private queueCityLabel(cityId: string): void {
        this.pendingLabelCityIds.add(cityId);
    }

    private flushPendingCityLabels(): void {
        if (this.pendingLabelCityIds.size === 0) return;

        let n = 0;
        for (const cityId of this.pendingLabelCityIds) {
            if (n >= RecruitmentSystem.LABEL_UPDATES_PER_FRAME) break;
            this.cityManager.updateCityLabel(cityId);
            this.pendingLabelCityIds.delete(cityId);
            n++;
        }
    }

    /** 驻军高的优先；同驻军随机，避免 cities_v2 录入顺序让固定录入顺序总是先出兵 */
    private static sortSpawnCandidates(
        candidates: Array<{ city: { troops?: number }; armySize: number }>
    ): void {
        candidates.sort((a, b) => {
            const diff = (b.city.troops || 0) - (a.city.troops || 0);
            return diff !== 0 ? diff : Math.random() - 0.5;
        });
    }

    private getCityRegion(city: RecruitmentCity): RegionType {
        return getCityRegion({
            latitude: city.latitude,
            longitude: city.longitude,
            region: city.region,
        });
    }

    private getActiveLegionRegions(): Map<RegionType, number> {
        const counts = new Map<RegionType, number>();
        for (const army of this.legionManager.getArmies()) {
            if (army.isDestroyed || army.type !== 'legion') continue;
            const region = army.cultureRegion;
            if (!region) continue;
            counts.set(region, (counts.get(region) ?? 0) + 1);
        }
        return counts;
    }

    private getCurrentViewportBounds(): { contains(latlng: [number, number]): boolean } | null {
        const map = (window as any).game?.map?.getLeafletMap?.();
        return map?.getBounds?.() ?? null;
    }

    private getFollowedFactionId(): string | null {
        return this.legionManager.getFollowedLegion()?.getFactionId?.() ?? null;
    }

    private collectSpawnCandidates(cities: RecruitmentCity[]): SpawnCandidate[] {
        const minArmySize = GameConfig.LEGION.MIN_ARMY_SIZE;
        const spawnTypes = GameConfig.LEGION.SPAWN_CITY_TYPES as readonly string[];
        const bounds = this.getCurrentViewportBounds();
        const candidates: SpawnCandidate[] = [];

        for (const city of cities) {
            if (!city.factionId || city.factionId === 'panjun') continue;
            if (!spawnTypes.includes(city.type)) continue;
            if (this.cityHasActiveLegion(city.id)) continue;
            if (this.isCityGarrisonCommitted(city.id)) continue;

            const armySize = Math.floor((city.troops || 0) * 0.9);
            if (armySize < minArmySize) continue;

            candidates.push({
                city,
                armySize,
                region: this.getCityRegion(city),
                inViewport: bounds?.contains([city.latitude, city.longitude]) ?? false,
            });
        }

        RecruitmentSystem.sortSpawnCandidates(candidates);
        return candidates;
    }

    private buildSpawnPlan(cities: RecruitmentCity[]): SpawnCandidate[] {
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        let remaining = maxLegions - this.legionManager.getActiveLegionCount();
        if (remaining <= 0) return [];

        const candidates = this.collectSpawnCandidates(cities);
        const activeRegionCounts = this.getActiveLegionRegions();
        const selected: SpawnCandidate[] = [];
        const selectedCityIds = new Set<string>();
        const baseline = GameConfig.LEGION.REGION_BASELINE_LEGIONS;

        // 第一段：每个文化区先保底 1 支（或配置值），只选该区当前最强候选城。
        for (const region of REGION_ORDER) {
            if (remaining <= 0) break;
            if ((activeRegionCounts.get(region) ?? 0) >= baseline) continue;

            const candidate = candidates.find(
                (c) => c.region === region && !selectedCityIds.has(c.city.id)
            );
            if (!candidate) continue;

            selected.push(candidate);
            selectedCityIds.add(candidate.city.id);
            activeRegionCounts.set(region, (activeRegionCounts.get(region) ?? 0) + 1);
            remaining--;
        }

        // 第二段（优先）：视野内、非跟随势力、驻军高（已按驻军排序）。
        // 加视野配额：单次最多塞 VIEWPORT_SPAWN_QUOTA 支进镜头，避免开局一屏爆出十几支；
        // 余量留给第三段从全图高兵据点分散补足。
        const followedFactionId = this.getFollowedFactionId();
        let viewportQuota = GameConfig.LEGION.VIEWPORT_SPAWN_QUOTA;
        for (const candidate of candidates) {
            if (remaining <= 0 || viewportQuota <= 0) break;
            if (selectedCityIds.has(candidate.city.id)) continue;
            if (!candidate.inViewport) continue;
            if (followedFactionId && candidate.city.factionId === followedFactionId) continue;

            selected.push(candidate);
            selectedCityIds.add(candidate.city.id);
            remaining--;
            viewportQuota--;
        }

        // 第三段：余量给全图驻军最高的据点（候选已按驻军降序）。
        for (const candidate of candidates) {
            if (remaining <= 0) break;
            if (selectedCityIds.has(candidate.city.id)) continue;

            selected.push(candidate);
            selectedCityIds.add(candidate.city.id);
            remaining--;
        }

        return selected;
    }

    private spawnCandidate(city: RecruitmentCity, armySize: number) {
        const newLegion = this.legionManager.createArmy({
            name: `${city.name}军团`,
            factionId: city.factionId,
            position: { lat: city.latitude, lng: city.longitude },
            troops: armySize,
            sourceCityId: city.id,
        });

        if (!newLegion) return null;

        city.troops = (city.troops || 0) - newLegion.getTroops();
        this.queueCityLabel(city.id);
        return newLegion;
    }

    private cityHasActiveLegion(cityId: string): boolean {
        return this.legionManager.getArmies().some((a) => {
            if (a.isDestroyed || a.type !== 'legion') return false;
            return a.homeCityId === cityId || a.getSourceCityId() === cityId;
        });
    }

    /** 大城/中城/小城/关隘、无现役军、兵够则出征；文化区保底 → 视野优先 → 全图高兵力 */
    private trySpawnLegions(cities: ReturnType<CityManager['getCities']>): void {
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;

        if (this.legionManager.getActiveLegionCount() >= maxLegions) {
            return;
        }

        const candidates = this.buildSpawnPlan(cities);

        for (const { city, armySize } of candidates) {
            if (this.legionManager.getActiveLegionCount() >= maxLegions) {
                break;
            }

            const newLegion = this.spawnCandidate(city, armySize);
            if (!newLegion) continue;

            const n = this.legionManager.getActiveLegionCount();
            gameLog(
                'recruitment',
                `💂 [募兵] 据点【${city.name}】组建【${newLegion.name}】(${newLegion.getTroops()} 兵，保底/视野/高兵，场上 ${n}/${maxLegions})`
            );
        }
    }

}
