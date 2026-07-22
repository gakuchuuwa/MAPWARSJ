/**
 * RecruitmentSystem — 乱斗募兵
 *
 * 用户点「播放」后：执行一次出兵检查（runInitialSpawn，仅一次）
 * 每季（15 游戏秒 = 1 季度）：
 *   1. 据点驻军 + 大城200 / 中城150 / 小城100 / 关隘50（见 CityConfig.recruitPerSeason）
 *      【2026-06-12 主人裁定】产出**全进城防**——曾实装一日的「家城产出优先补自家军团」已删除
 *      （它关闭了"一城一军保护伞下家城囤积→军团死后爆发出大军"的通道，导致大军团绝迹）。
 *      军团兵力的恢复改为**战后恢复 30%**（CombatSystem.getPostBattleRecoveryRate）。
 *      家城失守仍强制回师（行为树 resolveRecaptureTarget，游戏原生行为，所有文化无豁免；
 *      例外：远征军团（shouldSkipHomeRecapture）不回师）。
 *   2. 大城/中城/小城/关隘检查是否可组建军团（总上限见 MAX_ACTIVE_LEGIONS）：
 *      每季最多组建 MAX_LEGIONS_SPAWN_PER_SEASON 支（默认 1）；14 文化区轮流出兵，
 *      从上一季停下的区开始逐个尝试，找到该区驻军最高的合格据点即出兵。
 */
import { CityManager } from '../core/CityManager';
import { LegionManager } from '../core/LegionManager';
import { GameConfig } from '../config/GameConfig';
import { CITY_CONFIG, clampCityTroops } from '../config/CityConfig';
import { GameTime } from '../core/GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { gameLog } from '../utils/GameLogger';
import { getCityRegion, REGION_ORDER, RegionType, isRegionCenter } from '../systems/RegionSystem';
import type { SiegeManager } from '../combat/SiegeManager';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralProfile, getStrategicSkillDef } from '../data/GeneralSkills';
import { getCityAnchoredStrategicMagnitude, emitFollowedCityAnchoredDefensePulse } from '../combat/GeneralSkillCombat';
import { getFollowedArmyId } from '../utils/MapFloatingText';
import { getEuclideanDistance } from '../core/DistanceUtils';

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
    /** 14 文化区轮流出兵：记录下一季从哪个区开始找 */
    private nextSpawnRegionIndex = 0;

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
        // 季初重算据点将/精名额：上季覆灭或解散的军团所占名额在此释放（方案A）
        this.legionManager.syncCitySpawnTierConsumption();
        this.trySpawnLegions(cities);
        this.legionManager.tickLegionTiers(); // 兵力长到 4万的军团晋升精锐（含名将）
        PerformanceMonitor.getInstance().noteAsyncWork('recruitSeason', performance.now() - t0);
    }

    /**
     * 每季：按据点等级补驻军（大200 / 中150 / 小100 / 关50），产出全进城防。
     * 【2026-06-12 主人裁定】「家城产出优先补自家军团」已删除；军团恢复改为战后统一 30%。
     */
    private recruitSeasonGarrison(cities: ReturnType<CityManager['getCities']>): void {
        for (const city of cities) {
            if (!city.factionId || city.factionId === '' || city.factionId === 'panjun') continue;

            const cfg = CITY_CONFIG[city.type];
            if (!cfg) continue;

            // 攻城战中驻军兵力由 BattleUnitFactory 适配器缓存驱动，勿直接改 city.troops
            if (!this.isCityGarrisonCommitted(city.id)) {
                const region = this.getCityRegion(city as RecruitmentCity);
                const recruitMult = GameConfig.CULTURE_COMBAT.RECRUIT_TABLE[region] ?? 1.0;
                
                // D类据点系：S⑭足食足兵（招兵买马 recruit_cooldown_mult 另有独立管线）
                const skillMult = getCityAnchoredStrategicMagnitude(city.id, 'city_growth_mult');
                
                const baseAdded = Math.floor(cfg.recruitPerSeason * recruitMult);
                const added = Math.floor(baseAdded * skillMult);
                city.troops = clampCityTroops(city.type, (city.troops || 0) + added, region);
                
                // S⑭足食足兵：跟拍军团出身城季度补兵 ×2
                if (skillMult > 1.0 && added > baseAdded) {
                    const followedId = getFollowedArmyId();
                    const followedArmy = followedId ? this.legionManager.getLegionById(followedId) : null;
                    if (followedArmy) {
                        emitFollowedCityAnchoredDefensePulse(
                            city.id,
                            city.latitude,
                            city.longitude,
                            'city_growth_mult',
                            followedArmy,
                        );
                    }
                }
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

    /** 随机打乱候选顺序，确保每次开局军团来自不同的城 */
    private static sortSpawnCandidates(
        candidates: Array<{ city: { troops?: number }; armySize: number }>
    ): void {
        // Fisher-Yates 洗牌
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
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

    /** 按据点类型 + 是否文化中心，返回最低出兵阈值（armySize 须 ≥ 此值） */
    private getCityMinSpawnTroops(city: RecruitmentCity): number {
        if (isRegionCenter(city.id)) {
            return GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS.region_center;
        }
        const map = GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS as Record<string, number>;
        return map[city.type] ?? 10000;
    }

    private collectSpawnCandidates(cities: RecruitmentCity[]): SpawnCandidate[] {
        const spawnTypes = GameConfig.LEGION.SPAWN_CITY_TYPES as readonly string[];
        const bounds = this.getCurrentViewportBounds();
        const candidates: SpawnCandidate[] = [];

        for (const city of cities) {
            if (!city.factionId || city.factionId === 'panjun') continue;
            if (!spawnTypes.includes(city.type)) continue;
            if (this.cityHasActiveLegion(city.id)) continue;
            if (this.isCityGarrisonCommitted(city.id)) continue;
            // 计算征兵兵力（城市兵力的90%）
            const baseArmySize = Math.floor((city.troops || 0) * 0.9);
            // 调兵遣将：征兵时出征兵力 +10%
            const recruitMult = getCityAnchoredStrategicMagnitude(city.id, 'recruit_troops_mult');
            let armySize = Math.floor(baseArmySize * (recruitMult > 1 ? recruitMult : 1));
            const minTroops = this.getCityMinSpawnTroops(city);
            // 屯兵经略：可征兵力不得超过城防减留兵保底
            const reserveMag = getCityAnchoredStrategicMagnitude(city.id, 'garrison_reserve_troops');
            if (reserveMag > 0) {
                armySize = Math.min(armySize, Math.max(0, Math.floor((city.troops || 0) - reserveMag)));
            }
            if (armySize < minTroops) continue;

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
        const remaining = maxLegions - this.legionManager.getActiveLegionCount();
        if (remaining <= 0) return [];

        const candidates = this.collectSpawnCandidates(cities);
        if (candidates.length === 0) return [];

        // 各区已有活跃军团数
        const regionLegionCounts = this.getActiveLegionRegions();
        // 14 区是否全有至少 1 支（全有则允许第二轮）
        const allRegionsHaveLegion = REGION_ORDER.every(
            (r) => (regionLegionCounts.get(r) ?? 0) >= 1
        );

        // 14 文化区轮流出兵：从上次停下的区开始，逐区找候选直到用完配额
        const selected: SpawnCandidate[] = [];
        const selectedCityIds = new Set<string>();
        const nRegions = REGION_ORDER.length;

        for (let attempt = 0; attempt < nRegions * remaining; attempt++) {
            if (selected.length >= remaining) break;
            const region = REGION_ORDER[(this.nextSpawnRegionIndex + attempt) % nRegions];

            // 该区已有军团且非全有 → 跳过
            if (!allRegionsHaveLegion && (regionLegionCounts.get(region) ?? 0) >= 1) continue;

            const candidate = candidates.find(
                (c) => c.region === region && !selectedCityIds.has(c.city.id)
            );
            if (!candidate) continue;

            selected.push(candidate);
            selectedCityIds.add(candidate.city.id);
        }
        // 轮转到下一个区（从命中的下一个开始）
        if (selected.length > 0) {
            const lastRegion = selected[selected.length - 1].region;
            const lastIdx = REGION_ORDER.indexOf(lastRegion);
            this.nextSpawnRegionIndex = (lastIdx + 1) % nRegions;
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

        // 屯兵经略：征兵后据点最低留兵（限制征用量）
        const reserveMag = getCityAnchoredStrategicMagnitude(city.id, 'garrison_reserve_troops');
        const minTroops = this.getCityMinSpawnTroops(city);
        if (reserveMag > 0) {
            const maxDeduction = Math.max(0, (city.troops || 0) - reserveMag);
            const actualDeduction = Math.min(newLegion.getTroops(), maxDeduction);
            if (actualDeduction < minTroops) {
                newLegion.destroy();
                return null;
            }
            city.troops = (city.troops || 0) - actualDeduction;
            if (actualDeduction < newLegion.getTroops()) {
                newLegion.setTroops(actualDeduction);
            }
        } else {
            city.troops = (city.troops || 0) - newLegion.getTroops();
        }

        this.queueCityLabel(city.id);

        const followedId = getFollowedArmyId();
        const followedArmy = followedId ? this.legionManager.getLegionById(followedId) : null;
        if (followedArmy) {
            if (getCityAnchoredStrategicMagnitude(city.id, 'recruit_cooldown_mult') < 1) {
                emitFollowedCityAnchoredDefensePulse(
                    city.id,
                    city.latitude,
                    city.longitude,
                    'recruit_cooldown_mult',
                    followedArmy,
                );
            }
            if (reserveMag > 0) {
                emitFollowedCityAnchoredDefensePulse(
                    city.id,
                    city.latitude,
                    city.longitude,
                    'garrison_reserve_troops',
                    followedArmy,
                );
            }
        }

        return newLegion;
    }

    private cityHasActiveLegion(cityId: string): boolean {
        const activeFromCity = this.legionManager.getArmies().filter((a) => {
            if (a.isDestroyed || a.type !== 'legion') return false;
            return a.homeCityId === cityId || a.getSourceCityId() === cityId;
        });
        if (activeFromCity.length === 0) return false;

        const anchored = getCityAnchoredGeneral(cityId);
        const profile = anchored?.generalId ? getGeneralProfile(anchored.generalId) : null;
        const skill = profile?.strategicSkillId
            ? getStrategicSkillDef(profile.strategicSkillId)
            : null;
        if (skill?.effect !== 'recruit_cooldown_mult') return true;

        const city = this.cityManager.getCity(cityId);
        if (!city) return true;
        const cityPos = { lat: city.latitude, lng: city.longitude };
        const departRadius = GameConfig.FOLLOW_RESUPPLY.PASS_RADIUS;

        // 募兵有道：绑定该城的军团均已离城 → 视为出征在外，可再募
        const allDeparted = activeFromCity.every((a) => {
            const dist = getEuclideanDistance(a.getPosition(), cityPos);
            return dist > departRadius;
        });
        return !allDeparted;
    }

    /**
     * 季度出兵逻辑（每季最多 1 支，见 MAX_LEGIONS_SPAWN_PER_SEASON）
     *
     * 优先级：
     *   1. 同屏保底：跟随镜头内活跃军团 < 2 支时，优先在同屏城池刷兵
     *      （保持跟随军团 + 至少 1 支其他军团的观赏性）
     *   2. 文化轮转：同屏已 ≥ 2 支军团 → 14 区轮转扶贫（buildSpawnPlan）
     *   3. 兵力排序：同组内按驻军从高到低（sortSpawnCandidates 已保证）
     */
    private trySpawnLegions(cities: ReturnType<CityManager['getCities']>): void {
        const maxLegions = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const perSeasonCap = Math.max(1, GameConfig.LEGION.MAX_LEGIONS_SPAWN_PER_SEASON);

        if (this.legionManager.getActiveLegionCount() >= maxLegions) {
            return;
        }

        // ── 统计同屏活跃军团数（含跟随军团自身） ──
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

        // ── 决定候选来源 ──
        let candidates: SpawnCandidate[];

        if (visibleLegionCount < 2) {
            // 同屏不足 2 支 → 优先在屏内刷兵；屏内无合格城池才回落轮转
            // 【2026-07-02 主人裁定】同屏优先出的军团不能是跟随军团（自己方）的势力，
            //   保证镜头内刷出的是敌方军团，避免自己人扎堆、缺乏对抗观赏性。
            const followedFactionId = this.getFollowedFactionId();
            const allCandidates = this.collectSpawnCandidates(cities);
            const viewportCandidates = allCandidates.filter(
                (c) => c.inViewport && (!followedFactionId || c.city.factionId !== followedFactionId)
            );
            candidates = viewportCandidates.length > 0
                ? viewportCandidates
                : this.buildSpawnPlan(cities);
        } else {
            // 同屏已 ≥ 2 支 → 14 区文化轮转（兵力从高到低）
            candidates = this.buildSpawnPlan(cities);
        }

        let spawnedThisSeason = 0;

        for (const { city, armySize } of candidates) {
            if (spawnedThisSeason >= perSeasonCap) break;
            if (this.legionManager.getActiveLegionCount() >= maxLegions) {
                break;
            }

            const newLegion = this.spawnCandidate(city, armySize);
            if (!newLegion) continue;

            spawnedThisSeason++;
            const n = this.legionManager.getActiveLegionCount();
            gameLog(
                'recruitment',
                `💂 [募兵] 据点【${city.name}】组建【${newLegion.name}】(${newLegion.getTroops()} 兵，本季 ${spawnedThisSeason}/${perSeasonCap}，场上 ${n}/${maxLegions})`
            );
        }
    }

}
