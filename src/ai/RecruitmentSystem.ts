/**
 * RecruitmentSystem — 战略地图募兵与军团组建
 *
 * 1. 开局首发（runInitialSpawn）：
 *    按 67 文化（buildingStyle）均衡抽选，每个文化最多出 1 支（文化内兵多/名将优先），
 *    随机抽满 MAX_ACTIVE_LEGIONS（默认 24 支），错峰生成并集结待命后全军拔营。
 * 2. 每季（15 游戏秒 = 1 季度）：
 *    - 据点驻军增长（大城 200 / 中城 150 / 小城 100 / 城寨 60 / 关隘 50）；
 *    - 组建军团（每季最多 MAX_LEGIONS_SPAWN_PER_SEASON 支，总上限 MAX_ACTIVE_LEGIONS）：
 *      ① 同屏保底：镜头内活跃军团 < 2 支时，优先在屏幕内敌方合格据点组建 1 支；
 *      ② 67 文化均衡轮转：优先从当前场上活跃军团数最少的文化（0 支优先）中随机抽选文化，
 *        再在该文化内挑兵最多（同兵力名将优先）的据点组建军团，保证据点少的文化也有同等出兵机会。
 */
import { CityManager } from '../core/CityManager';
import { LegionManager } from '../core/LegionManager';
import { GameConfig } from '../config/GameConfig';
import { CITY_CONFIG, clampCityTroops } from '../config/CityConfig';
import { roadRegistry } from '../roads/RoadRegistry';
import { GameTime } from '../core/GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { gameLog } from '../utils/GameLogger';
import { getCityRegion, RegionType, isRegionCenter } from '../systems/RegionSystem';
import type { SiegeManager } from '../combat/SiegeManager';
import { getCityAnchoredGenerals, getCityAnchoredGeneralsFast } from '../data/CityGeneralBridge';
import { isGeneralOnStage } from '../data/generalOnStage';
import { compareGeneralsByPriority } from '../data/generalSelection';
import { isGeneralOnCooldown } from '../legion/DefeatCooldown';
import { hasAvailableCityGeneral } from '../legion/LegionSpawnTier';
import { armDeploy } from '../legion/DeployGate';
import { toBase16, BASE_16_LEGION_NAMES, STYLE_TO_BASE16, type Base16Culture } from '../systems/CultureBase16';
import { toCulture66 } from '../systems/CultureHierarchy';
import { resolveCityBase16Style } from '../systems/cityDeStyle';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { getCultureLegionName } from '../types/CultureFormations';
import { getGeneralCulture } from '../data/GeneralCulture';

type RecruitmentCity = ReturnType<CityManager['getCities']>[number];
type SpawnCandidate = {
    city: RecruitmentCity;
    armySize: number;
    region: RegionType;
    base16: Base16Culture;
    culture67: string;
    inViewport: boolean;
};

export class RecruitmentSystem {
    private cityManager: CityManager;
    private legionManager: LegionManager;
    private siegeManager: SiegeManager | null;
    private seasonTimer: number = 0;
    private hasRunInitialSpawn = false;
    private initialSpawnDeferred = false;
    /** 每季募兵后分批刷新城市标签，避免一帧更新 600+ DOM 卡顿 */
    private pendingLabelCityIds: Set<string> = new Set();
    private static readonly LABEL_UPDATES_PER_FRAME = 20;

    private readonly isLegionSpawnPaused: () => boolean;

    constructor(
        cityManager: CityManager,
        legionManager: LegionManager,
        siegeManager?: SiegeManager,
        isLegionSpawnPaused?: () => boolean
    ) {
        this.cityManager = cityManager;
        this.legionManager = legionManager;
        this.siegeManager = siegeManager ?? null;
        this.isLegionSpawnPaused = isLegionSpawnPaused ?? (() => false);
    }

    /** 攻城进行中：驻军已作为 city 单位参战，禁止再募兵/季末补进驻军 */
    private isCityGarrisonCommitted(cityId: string): boolean {
        return this.siegeManager?.isCityUnderAttack(cityId) ?? false;
    }

    /** 读档后调用：世界已由存档恢复，禁止再执行「开局首次出兵」 */
    public markInitialSpawnDone(): void {
        this.hasRunInitialSpawn = true;
        this.initialSpawnDeferred = false;
    }

    public runInitialSpawn(): void {
        if (this.hasRunInitialSpawn) return;
        this.hasRunInitialSpawn = true;

        if (this.isLegionSpawnPaused()) {
            this.initialSpawnDeferred = true;
            gameLog('recruitment', '💂 [募兵] 历史剧本期 → 开局首发推迟到剧本结束（全图不随机生军团）');
            return;
        }

        this.legionManager.trimLegionsToCap();
        this.legionManager.syncCitySpawnTierConsumption();

        const cities = this.cityManager.getCities();
        gameLog('recruitment', '💂 [募兵] 播放开始 — 首次出兵（分帧异步）');

        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const candidates = this.buildInitialSpawnPlan(cities);

        const holdMs = GameConfig.LEGION.INITIAL_DEPLOY_HOLD_MS;
        armDeploy(holdMs, () => {
            gameLog('recruitment', `🚩 [募兵] 集结完毕，全军同时拔营（集结 ${holdMs}ms 游戏运行时间）`);
        });

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
                if (this.cityHasActiveLegion(city.id)) continue;

                const newLegion = this.spawnCandidate(city, armySize);
                if (!newLegion) continue;
                spawnedThisTick++;
            }

            if (idx < candidates.length && this.legionManager.getActiveLegionCount() < maxLegions) {
                setTimeout(spawnTick, intervalMs);
            } else {
                gameLog('recruitment', `💂 [募兵] 首次出兵完成，共 ${this.legionManager.getActiveLegionCount()} 支军团`);
            }
        };

        spawnTick();
    }

    public update(gameDelta: number): void {
        if (gameDelta <= 0) return;

        this.flushPendingCityLabels();

        if (this.initialSpawnDeferred && !this.isLegionSpawnPaused()) {
            this.initialSpawnDeferred = false;
            this.hasRunInitialSpawn = false;
            this.runInitialSpawn();
        }

        this.seasonTimer += gameDelta;
        if (this.seasonTimer < GameTime.SEASON_DURATION) return;

        this.seasonTimer -= GameTime.SEASON_DURATION;
        this.runSeasonTick();
    }

    private runSeasonTick(): void {
        const t0 = performance.now();
        const cities = this.cityManager.getCities();
        this.recruitSeasonGarrison(cities);
        this.legionManager.syncCitySpawnTierConsumption();
        if (!this.isLegionSpawnPaused()) {
            this.trySpawnLegions(cities);
        }
        this.legionManager.tickLegionTiers();
        PerformanceMonitor.getInstance().noteAsyncWork('recruitSeason', performance.now() - t0);
    }

    /**
     * 每季：按据点等级补驻军（大200 / 中150 / 小100 / 寨60 / 关50），产出全进城防。
     * 边境城 × BORDER_RECRUIT_MULT；内地城够基础治安兵后 × INTERIOR_RECRUIT_MULT。
     */
    private recruitSeasonGarrison(cities: ReturnType<CityManager['getCities']>): void {
        const factionOf = new Map<string, string>();
        for (const city of cities) factionOf.set(city.id, city.factionId || '');

        for (const city of cities) {
            if (!city.factionId || city.factionId === '' || city.factionId === 'panjun' || city.factionId === 'panshu') continue;

            const cfg = CITY_CONFIG[city.type];
            if (!cfg) continue;

            if (!this.isCityGarrisonCommitted(city.id)) {
                const culture67 = this.getCityCulture67(city as RecruitmentCity);
                const recruitMult = GameConfig.CULTURE_COMBAT.RECRUIT_TABLE[culture67] ?? 1.0;
                const troops = city.troops || 0;
                const postureMult = this.isBorderCity(city.id, city.factionId, factionOf)
                    ? GameConfig.CITY.BORDER_RECRUIT_MULT
                    : troops >= this.getCityBaseGarrison(city as RecruitmentCity)
                        ? GameConfig.CITY.INTERIOR_RECRUIT_MULT
                        : 1;
                const added = Math.floor(cfg.recruitPerSeason * recruitMult * postureMult);
                const nextTroops = clampCityTroops(city.type, troops + added, culture67);
                if (nextTroops !== troops) {
                    city.troops = nextTroops;
                    this.pendingLabelCityIds.add(city.id);
                }
            }
        }
    }

    /** 基础治安兵：开局驻军量，且不低于出兵线 */
    private getCityBaseGarrison(city: RecruitmentCity): number {
        const initial = CITY_CONFIG[city.type]?.initialTroops ?? 0;
        return Math.max(initial, this.getCityMinSpawnTroops(city) / 0.9);
    }

    private adjacentCityCache = new Map<string, string[]>();

    /** 边境城：路网直连（战场节点穿过去）的据点里有别家势力（含叛军/无主）的城 */
    private isBorderCity(cityId: string, factionId: string, factionOf: Map<string, string>): boolean {
        let neighbors = this.adjacentCityCache.get(cityId);
        if (!neighbors) {
            neighbors = [];
            const seen = new Set<string>([cityId]);
            const queue = [cityId];
            while (queue.length > 0) {
                const cur = queue.pop()!;
                for (const n of roadRegistry.getConnectedCities(cur)) {
                    if (seen.has(n)) continue;
                    seen.add(n);
                    if (!factionOf.has(n)) queue.push(n);
                    else neighbors.push(n);
                }
            }
            this.adjacentCityCache.set(cityId, neighbors);
        }
        for (let i = 0; i < neighbors.length; i++) {
            if (factionOf.get(neighbors[i]) !== factionId) return true;
        }
        return false;
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

    /** 同一文化内的候选据点排序：兵力从大到小，同兵力名将优先 */
    private static sortSpawnCandidates(candidates: SpawnCandidate[]): void {
        candidates.sort((a, b) => {
            if (b.armySize !== a.armySize) {
                return b.armySize - a.armySize;
            }
            return compareGeneralsByPriority(
                { troops: a.armySize, cityId: a.city.id },
                { troops: b.armySize, cityId: b.city.id },
            );
        });
    }

    private getCityRegion(city: RecruitmentCity): RegionType {
        return getCityRegion({
            latitude: city.latitude,
            longitude: city.longitude,
            region: city.region,
        });
    }

    private getCityCulture67(city: RecruitmentCity): string {
        return toCulture66((city as { buildingStyle?: string }).buildingStyle || this.getCityRegion(city));
    }

    private getCityBase16(city: RecruitmentCity): Base16Culture {
        const s16 = resolveCityBase16Style(
            city.id,
            city.type,
            city.region,
            city.latitude ?? (city as any).lat,
            city.longitude ?? (city as any).lng,
            city.buildingStyle,
        );
        if (s16 && STYLE_TO_BASE16[s16]) {
            return STYLE_TO_BASE16[s16];
        }
        return toBase16(city.region);
    }

    private getCurrentViewportBounds(): { contains(latlng: [number, number]): boolean } | null {
        if (typeof window === 'undefined') return null;
        const map = (window as any).game?.map?.getLeafletMap?.();
        return map?.getBounds?.() ?? null;
    }

    /** 按据点类型 + 是否文化中心，返回最低出兵阈值（armySize 须 ≥ 此值） */
    private getCityMinSpawnTroops(city: RecruitmentCity): number {
        if (isRegionCenter(city.id)) {
            return GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS.region_center;
        }
        const map = GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS as Record<string, number>;
        return map[city.type] ?? 5000;
    }

    private collectSpawnCandidates(cities: RecruitmentCity[]): SpawnCandidate[] {
        const spawnTypes = GameConfig.LEGION.SPAWN_CITY_TYPES as readonly string[];
        const bounds = this.getCurrentViewportBounds();
        const candidates: SpawnCandidate[] = [];
        const activeGenIds = this.legionManager.getActiveGeneralIds();

        for (const city of cities) {
            if (!city.factionId || city.factionId === 'panjun' || city.factionId === 'panshu') continue;
            if (!spawnTypes.includes(city.type)) continue;
            if (city.spawnGeneralUsed) continue;
            const baseArmySize = Math.floor((city.troops || 0) * 0.9);
            const minTroops = this.getCityMinSpawnTroops(city);
            if (baseArmySize < minTroops) continue;
            if (isGeneralOnCooldown(city.id)) continue;
            if (this.isCityGarrisonCommitted(city.id)) continue;
            const anchoredGenerals = getCityAnchoredGeneralsFast(city.id);
            if (!anchoredGenerals.some((g) => isGeneralOnStage(g.generalId))) continue;
            if (!hasAvailableCityGeneral(city.id, activeGenIds)) continue;
            if (this.cityHasActiveLegion(city.id)) continue;

            const region = this.getCityRegion(city);
            const base16 = this.getCityBase16(city);
            const culture67 = this.getCityCulture67(city);
            candidates.push({
                city,
                armySize: baseArmySize,
                region,
                base16,
                culture67,
                inViewport: bounds?.contains([city.latitude, city.longitude]) ?? false,
            });
        }

        RecruitmentSystem.sortSpawnCandidates(candidates);
        return candidates;
    }

    /** 统计当前场上活跃军团在 67 文化上的数量分布 */
    private getActiveCulture67Counts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const army of this.legionManager.getArmies()) {
            if (army.isDestroyed || army.type !== 'legion') continue;
            const cityId = army.homeCityId ?? army.getSourceCityId();
            const city = cityId ? this.cityManager.getCity(cityId) : undefined;
            const cult = city?.buildingStyle
                ? toCulture66(city.buildingStyle)
                : (army.generalId ? toCulture66(getGeneralCulture(army.generalId)) : toCulture66(army.cultureRegion));
            counts.set(cult, (counts.get(cult) ?? 0) + 1);
        }
        return counts;
    }

    /**
     * 按 67 文化均衡挑选最多 count 支候选军团：
     * - 每個文化内部按兵多/名将排好序；
     * - 每一轮从「当前场上军团数最少」的文化集合中随机抽 1 个文化，取该文化的头号候选城，并将该文化计数 +1；
     * - 如此循环直到挑满 count 支或无候选为止。
     * 这样 1 座城的小文化与 50 座城的大文化在文化层面上拥有完全相等的出兵抽签权。
     */
    private pickBalancedByCulture67(candidates: SpawnCandidate[], count: number): SpawnCandidate[] {
        if (candidates.length === 0 || count <= 0) return [];

        const byCulture = new Map<string, SpawnCandidate[]>();
        for (const c of candidates) {
            let list = byCulture.get(c.culture67);
            if (!list) {
                list = [];
                byCulture.set(c.culture67, list);
            }
            list.push(c);
        }

        const activeCounts = this.getActiveCulture67Counts();
        const selected: SpawnCandidate[] = [];

        while (selected.length < count && byCulture.size > 0) {
            let minActive = Infinity;
            for (const cult of byCulture.keys()) {
                const n = activeCounts.get(cult) ?? 0;
                if (n < minActive) minActive = n;
            }

            const lowestCultures: string[] = [];
            for (const cult of byCulture.keys()) {
                if ((activeCounts.get(cult) ?? 0) === minActive) {
                    lowestCultures.push(cult);
                }
            }

            const pickedCult = lowestCultures[Math.floor(Math.random() * lowestCultures.length)];
            const list = byCulture.get(pickedCult)!;
            const pickedCandidate = list.shift()!;
            if (list.length === 0) {
                byCulture.delete(pickedCult);
            }

            selected.push(pickedCandidate);
            activeCounts.set(pickedCult, (activeCounts.get(pickedCult) ?? 0) + 1);
        }

        return selected;
    }

    /**
     * 开局第一轮出兵：按 67 文化均衡随机抽选，每个文化最多 1 支，凑满 MAX_ACTIVE_LEGIONS（默认 24 支）。
     */
    private buildInitialSpawnPlan(cities: RecruitmentCity[]): SpawnCandidate[] {
        const candidates = this.collectSpawnCandidates(cities);
        if (candidates.length === 0) return [];
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        return this.pickBalancedByCulture67(candidates, maxLegions);
    }

    /**
     * 季度出兵计划：优先从场上还没有军团（或军团最少）的 67 文化中抽选。
     */
    private buildSpawnPlan(cities: RecruitmentCity[], count: number): SpawnCandidate[] {
        const candidates = this.collectSpawnCandidates(cities);
        if (candidates.length === 0) return [];
        return this.pickBalancedByCulture67(candidates, count);
    }

    private spawnCandidate(city: RecruitmentCity, armySize: number) {
        if (city.spawnGeneralUsed || isGeneralOnCooldown(city.id) || !hasAvailableCityGeneral(city.id)) return null;
        const anchoredGenerals = getCityAnchoredGenerals(city.id);
        if (!anchoredGenerals.some((g) => isGeneralOnStage(g.generalId))) return null;
        const region = this.getCityRegion(city);
        const base16 = this.getCityBase16(city);
        const factionLegion = FACTION_COMPOSITIONS[city.factionId]?.legionName?.trim();
        const legionName = factionLegion || BASE_16_LEGION_NAMES[base16] || getCultureLegionName(region);
        const newLegion = this.legionManager.createArmy({
            name: legionName,
            factionId: city.factionId,
            position: { lat: city.latitude, lng: city.longitude },
            troops: armySize,
            sourceCityId: city.id,
        });

        if (!newLegion) return null;

        if (!newLegion.generalId || !isGeneralOnStage(newLegion.generalId)) {
            newLegion.destroy();
            this.legionManager.removeArmy(newLegion);
            return null;
        }

        const minTroops = this.getCityMinSpawnTroops(city);
        if (newLegion.getTroops() < minTroops) {
            newLegion.destroy();
            this.legionManager.removeArmy(newLegion);
            return null;
        }
        city.troops = (city.troops || 0) - newLegion.getTroops();

        this.queueCityLabel(city.id);

        return newLegion;
    }

    /** 一座据点同时只允许 1 支现役军团在外（战死或解散后才可派下一支） */
    private cityHasActiveLegion(cityId: string): boolean {
        const anchoredGenIds = new Set(
            getCityAnchoredGeneralsFast(cityId)
                .filter((g) => isGeneralOnStage(g.generalId))
                .map((g) => g.generalId),
        );
        return this.legionManager.getArmies().some((a) => {
            if (a.isDestroyed || a.type !== 'legion') return false;
            if (a.generalId && anchoredGenIds.has(a.generalId)) return true;
            return a.homeCityId === cityId || a.getSourceCityId() === cityId;
        });
    }

    /**
     * 季度出兵逻辑（每季最多 MAX_LEGIONS_SPAWN_PER_SEASON 支，默认 2 支）：
     *   1. 同屏保底：跟随镜头内活跃军团 < 2 支时，第 1 支优先在同屏敌方据点组建（保证屏幕内有对手）；
     *   2. 剩余名额走全图 67 文化均衡轮转（优先场上 0 军团的文化）。
     */
    private trySpawnLegions(cities: ReturnType<CityManager['getCities']>): void {
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const perSeasonCap = Math.max(1, GameConfig.LEGION.MAX_LEGIONS_SPAWN_PER_SEASON);
        const remainingCap = maxLegions - this.legionManager.getActiveLegionCount();
        if (remainingCap <= 0) return;

        const targetSpawnCount = Math.min(perSeasonCap, remainingCap);
        const bounds = this.getCurrentViewportBounds();
        let visibleLegionCount = 0;
        if (bounds) {
            for (const army of this.legionManager.getArmies()) {
                if (army.isDestroyed || army.type !== 'legion') continue;
                const pos = army.getPosition();
                if (bounds.contains([pos.lat, pos.lng])) {
                    visibleLegionCount++;
                }
            }
        }

        const allCandidates = this.collectSpawnCandidates(cities);
        if (allCandidates.length === 0) return;

        const planned: SpawnCandidate[] = [];
        const usedCityIds = new Set<string>();

        if (visibleLegionCount < 2) {
            const followed = this.legionManager.getFollowedLegion();
            const followedFactionId = followed?.getFactionId?.() ?? null;
            const followedTroops = followed && !followed.isDestroyed ? followed.getTroops() : 0;
            const viewportEnemyCandidates = allCandidates.filter(
                (c) => c.inViewport && (!followedFactionId || c.city.factionId !== followedFactionId)
            );
            if (viewportEnemyCandidates.length > 0) {
                const strongEnough = followedTroops > 0
                    ? viewportEnemyCandidates.filter(
                        (c) => c.armySize * GameConfig.AI.ENEMY_STRENGTH_MAX_RATIO >= followedTroops
                    )
                    : viewportEnemyCandidates;
                const vpPool = strongEnough.length > 0 ? strongEnough : viewportEnemyCandidates;
                const pickedVp = this.pickBalancedByCulture67(vpPool, 1)[0];
                if (pickedVp) {
                    planned.push(pickedVp);
                    usedCityIds.add(pickedVp.city.id);
                }
            }
        }

        const restNeeded = targetSpawnCount - planned.length;
        if (restNeeded > 0) {
            const restPool = allCandidates.filter((c) => !usedCityIds.has(c.city.id));
            planned.push(...this.pickBalancedByCulture67(restPool, restNeeded));
        }

        let spawnedThisSeason = 0;
        for (const { city, armySize, inViewport } of planned) {
            if (spawnedThisSeason >= perSeasonCap) break;
            if (this.legionManager.getActiveLegionCount() >= maxLegions) break;

            const newLegion = this.spawnCandidate(city, armySize);
            if (!newLegion) continue;
            if (inViewport && visibleLegionCount < 2) {
                (newLegion as { spawnedInViewport?: boolean }).spawnedInViewport = true;
                visibleLegionCount++;
            }

            spawnedThisSeason++;
            const n = this.legionManager.getActiveLegionCount();
            gameLog(
                'recruitment',
                `💂 [募兵] 据点【${city.name}】组建【${newLegion.name}】(${newLegion.getTroops()} 兵，本季 ${spawnedThisSeason}/${perSeasonCap}，场上 ${n}/${maxLegions})`
            );
        }
    }
}
