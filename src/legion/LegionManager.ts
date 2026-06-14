import { Army } from './Army';
import { CityManager } from '../world/CityManager';
import { GameMap } from '../map/GameMap';
import { GameConfig } from '../config/GameConfig';
import { City, LatLng, SiegeData } from '../types/core';
import { getEuclideanDistance } from '../core/DistanceUtils';
import {
    releaseFieldBattleCombatState,
    tryEngageFieldBattle,
    type LegionFieldBattleDeps,
} from './field/LegionFieldBattle';
import {
    moveLegionToCity as roadMarchMoveLegionToCity,
    type LegionRoadMarchDeps,
} from './march/LegionRoadMarch';
import { SpatialRegistry } from '../world/SpatialRegistry';
import { CombatSystem } from '../combat/CombatSystem';
import { LegionType } from '../types/UnitTypes';
import { roadRegistry } from '../roads/RoadRegistry';
import { getCityRegion, RegionType } from '../systems/RegionSystem';
import {
    getArmyMaxTroops,
    getCultureFormationMode,
    getCultureTier,
    getLegionTypeForCulture,
} from '../types/CultureFormations';
import { expandCompositionSlots, expandCompositionScales } from '../types/LegionComposition';
import { gameLog } from '../utils/GameLogger';
import { FollowResupplySystem } from './FollowResupplySystem';

export class LegionManager {
    private cityManager: CityManager;
    private map: GameMap;
    private armies: Army[] = [];
    private spatialRegistry: SpatialRegistry;

    private combatSystem: CombatSystem | null = null;
    private readonly roadMarchDeps: LegionRoadMarchDeps;
    private readonly fieldBattleDeps: LegionFieldBattleDeps;
    
    /** 相机跟随中的军团 id（用于 UI 高亮/定位） */
    private followedLegionId: string | null = null;
    /** 道路失败日志节流（armyId:targetId -> timestamp） */
    private roadFailureLogCooldown: Map<string, number> = new Map();
    /** 行军首段异常日志节流（armyId -> timestamp） */
    private marchDiagLogCooldown: Map<string, number> = new Map();

    constructor(cityManager: CityManager, map: GameMap) {
        this.cityManager = cityManager;
        this.map = map;
        this.spatialRegistry = SpatialRegistry.getInstance();

        this.roadMarchDeps = {
            cityManager: this.cityManager,
            roadFailureLogCooldown: this.roadFailureLogCooldown,
            marchDiagLogCooldown: this.marchDiagLogCooldown,
            triggerSiege: (army, city) => this.triggerSiege(army, city),
        };
        this.fieldBattleDeps = {
            getArmies: () => this.armies,
            getSpatialRegistry: () => this.spatialRegistry,
            getCityManager: () => this.cityManager,
            getCombatSystem: () => this.combatSystem,
            removeArmy: (a) => this.removeArmy(a),
            triggerSiege: (a, c) => this.triggerSiege(a, c),
            isArmyWaitingSiege: (armyId) => this.isArmyWaitingSiege(armyId),
        };

        // [HEX GRID] 将所有城市注册为静态障碍物
        this.refreshCityRegistry();

        // [NEW] Subscribe to City Manager updates for physics sync
        this.cityManager.setOnCityUpdated(() => this.refreshCityRegistry());

        // [NEW] Subscribe to Road Registry updates
        roadRegistry.onRoadsUpdated(() => this.recalculateAllLegionPaths());
    }

    /**
     * [NEW] 将所有城市注册到 SpatialRegistry 作为障碍物
     * 确保军队不能移动到城市格子上.
     * Should be called after cities are loaded or updated.
     */
    public refreshCityRegistry(): void {
        this.spatialRegistry.clearCityRegistry();
        const cities = this.cityManager.getCities();
        let logCount = 0;
        for (const city of cities) {
            this.spatialRegistry.registerCity(city.latitude, city.longitude, city.factionId || 'neutral', city.id);

            if (logCount < 3) {
                gameLog('world', `[LegionManager] Registering City ${city.name} at (${city.latitude.toFixed(2)},${city.longitude.toFixed(2)})`);
                logCount++;
            }
        }
        gameLog('world', `🏛️ [SpatialRegistry] 已注册 ${cities.length} 个城市节点作为据点索引`);
    }

    /**
     * Store combat system
     */
    public initContactEngine(combatSystem: CombatSystem): void {
        this.combatSystem = combatSystem;
        combatSystem.onFieldBattleEnd = releaseFieldBattleCombatState;
    }

    private siegeManager: any | null = null; // Use any to avoid circular import type issues if strict
    private followResupplySystem: FollowResupplySystem | null = null;

    public setFollowResupplySystem(system: FollowResupplySystem | null): void {
        this.followResupplySystem = system;
    }

    public setSiegeManager(siegeManager: any): void {
        this.siegeManager = siegeManager;
    }

    public getSpatialRegistry(): SpatialRegistry {
        return this.spatialRegistry;
    }





    /**
     * Get the list of all armies managed by this manager.
     */
    public getArmies(): Army[] {
        return this.armies;
    }

    /** 场上未灭军团数（沙盒上限统计用） */
    public getActiveLegionCount(): number {
        return this.armies.filter((a) => a.type === 'legion' && !a.isDestroyed).length;
    }

    public canSpawnMoreLegions(): boolean {
        return this.getActiveLegionCount() < GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
    }

    /** 若场上军团超过上限，按兵力从低到高裁掉多余（纠正旧存档/漏检） */
    public trimLegionsToCap(): void {
        const max = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        const legions = this.armies.filter((a) => a.type === 'legion' && !a.isDestroyed);
        if (legions.length <= max) return;

        legions.sort((a, b) => a.getTroops() - b.getTroops());
        const excess = legions.length - max;
        for (let i = 0; i < excess; i++) {
            const legion = legions[i];
            console.warn(`[LegionManager] 超上限裁撤: ${legion.name} (${legion.getTroops()} 兵)`);
            legion.destroy();
            this.removeArmy(legion);
        }
        gameLog('army', `[LegionManager] 军团已裁至 ${this.getActiveLegionCount()}/${max}`);
    }

    public getLegionById(id: string): Army | undefined {
        return this.armies.find(a => a.id === id);
    }

    public setFollowedLegionId(id: string | null): void {
        if (this.followedLegionId && this.followedLegionId !== id) {
            this.followResupplySystem?.clearForArmy(this.followedLegionId);
        }
        if (!id && this.followedLegionId) {
            this.followResupplySystem?.clearForArmy(this.followedLegionId);
        }
        this.followedLegionId = id;
    }

    public isFollowedLegion(army: Army | string): boolean {
        if (!this.followedLegionId) return false;
        const id = typeof army === 'string' ? army : army.id;
        return id === this.followedLegionId;
    }

    public getFollowedLegion(): Army | undefined {
        if (!this.followedLegionId) return undefined;
        return this.getLegionById(this.followedLegionId);
    }

    public hasMovingLegions(): boolean {
        return this.armies.some(army => !army.isIdle());
    }

    public addArmy(army: Army): void {
        // [FIX] Idempotency: Avoid adding the same army multiple times
        if (this.armies.includes(army)) return;

        if (army.type === 'legion' && !army.isDestroyed && !this.canSpawnMoreLegions()) {
            console.warn(
                `[LegionManager] 已达军团上限 ${GameConfig.LEGION.MAX_ACTIVE_LEGIONS}，拒绝加入: ${army.name}`
            );
            return;
        }

        this.armies.push(army);
        // Register initial position
        const pos = army.getPosition();
        this.spatialRegistry.registerArmy(army, pos.lat, pos.lng);
    }

    /** 文化阵型：优先据点 cities_v2.region，否则坐标多边形（梅尔夫等边界点可能落不到任何区 → 中原兜底） */
    private resolveCultureRegion(pos: { lat: number; lng: number }, cityId?: string | null): RegionType {
        const city = cityId ? this.cityManager.getCity(cityId) : undefined;
        return getCityRegion({
            latitude: pos.lat,
            longitude: pos.lng,
            region: city?.region,
        });
    }

    /**
     * [AI] 创建新军团并加入管理器
     * 供 RecruitmentSystem 和其他 AI 模块使用
     */
    public createArmy(config: {
        name: string;
        factionId: string;
        position: { lat: number; lng: number };
        troops: number;
        legionType?: LegionType;
        sourceCityId?: string; // [NEW] Source City
    }): Army | null {
        if (!this.canSpawnMoreLegions()) {
            return null;
        }

        const region = this.resolveCultureRegion(config.position, config.sourceCityId);
        const legionType = getLegionTypeForCulture(region);
        const troops = Math.min(Math.floor(config.troops), getArmyMaxTroops(region));
        if (troops < GameConfig.LEGION.MIN_ARMY_SIZE) {
            return null;
        }

        const army = new Army(
            this.map,
            { lat: config.position.lat, lng: config.position.lng },
            null, // targetCity
            troops,
            config.factionId,
            () => { }, // onArrive callback
            undefined, // onBattleTick
            undefined, // destination
            config.name,
            legionType
        );
        army.type = 'legion';
        army.cultureRegion = region;
        army.setSpatialRegistry(this.spatialRegistry); // [NEW] Link registry
        if (config.sourceCityId) {
            army.setSourceCityId(config.sourceCityId);
            army.homeCityId = config.sourceCityId;
        }

        // 14 文化阵型（与军队编辑器一致）
        const cultureTier = getCultureTier(region, troops);
        if (cultureTier) {
            army.cultureSlots = expandCompositionSlots(cultureTier.slots);
            army.cultureScales = expandCompositionScales(cultureTier.slots);
        }
        this.addArmy(army);
        return army;
    }

    /**
     * [NEW] 刷新所有现有军队的文化阵型和比例（用于编辑器保存后热更新）
     */
    public refreshCultureFormations(): void {
        gameLog('army', `[LegionManager] 刷新所有现有军队的文化阵型...`);
        this.armies.forEach(army => {
            const pos = army.getPosition();
            const region = this.resolveCultureRegion(pos, army.homeCityId ?? army.getSourceCityId());
            army.cultureRegion = region;
            const cultureTier = getCultureTier(region, army.getTroops());
            if (cultureTier) {
                army.cultureSlots = expandCompositionSlots(cultureTier.slots);
                army.cultureScales = expandCompositionScales(cultureTier.slots);
            }
            army.legionType = getCultureFormationMode(region) === 'triangle' ? 'cavalry' : 'mixed';
        });
    }

    public removeArmy(army: Army): void {
        this.followResupplySystem?.clearForArmy(army.id);
        this.armies = this.armies.filter(a => a !== army);

        // Remove from registry
        const pos = army.getPosition();
        this.spatialRegistry.unregisterArmy(army, pos.lat, pos.lng);
    }

    public update(deltaTime: number): void {
        this.armies.forEach(army => {
            if (army.isDestroyed || army.getTroops() <= 0) return;
            const oldPos = army.getPosition();

            // Skip movement if army is in blocked cooldown
            if (army.isBlocked()) {
                army.update(deltaTime);
                return;
            }

            army.update(deltaTime);
            const newPos = army.getPosition();

            if (
                this.followResupplySystem &&
                this.isFollowedLegion(army) &&
                !army.getIsInCombat()
            ) {
                this.followResupplySystem.update(army);
            }

            // 行军 ZOC：进入非己方据点（含叛军 panjun）控制范围必须先停攻，不可绕路穿过
            if (
                !army.getIsInCombat() &&
                !army.isIdle() &&
                !army.isPostBattleResting?.()
            ) {
                const zocCity = this.findHostileCityInZOC(army);
                if (zocCity) {
                    gameLog(
                        'legionSiege',
                        `🛡️ [LegionManager] ${army.name} 进入【${zocCity.name}】控制范围，强制攻城（不可绕过）`
                    );
                    army.stopMovement();
                    army.setTargetCity(zocCity);
                    this.triggerSiege(army, zocCity);
                    return;
                }
            }

            // 1. Check for Siege Trigger (City Collision)
            // logic: If army finished moving (idle) and is at the designated siege point, trigger fallback siege.
            if (army.isIdle() && !army.getIsInCombat()) {
                if (this.siegeManager?.isArmyWaitingSiege(army.id)) {
                    return;
                }

                const targetCity = army.getTargetCity();
                if (targetCity) {
                    // [FIX] targetCity 可能是旧引用（城市易手后 factionId 过期），每帧用 CityManager 最新数据校正
                    const latestTargetCity = this.cityManager.getCity(targetCity.id) || targetCity;
                    const isHostile = latestTargetCity.factionId !== army.getFactionId();
                    if (isHostile) {
                        const dist = getEuclideanDistance(newPos, { lat: latestTargetCity.latitude, lng: latestTargetCity.longitude });
                        // Arrival threshold
                        if (dist <= 0.2) {
                            // 已有攻城战时仍走 triggerSiege → onArmyArrive（同旗加入 / 第三方排队 / 新开战）
                            gameLog('legionSiege', `🏰 [LegionManager] ${army.name} arrived at hostile city ${latestTargetCity.name} (${dist.toFixed(4)}). Triggering Siege!`);
                            this.triggerSiege(army, latestTargetCity);
                            return; // Stop processing this army
                        }
                    } else {
                        // 已变为友城，清理旧目标，避免重复触发“友城到达→攻城中止”噪音
                        army.setTargetCity(null);
                    }
                }
            }

            // 2. Check for Army Collision (Field Battle - Option B)
            if (!army.getIsInCombat()) { 
                // [NEW] Avoid preempting sieges: if I am a garrison, I don't initiate field battles.
                // Let the enemy trigger the siege against my city instead.
                let iAmGarrison = false;
                if (army.isIdle()) {
                    const nearestCity = this.cityManager.getNearestCity(null, { latitude: newPos.lat, longitude: newPos.lng });
                    if (nearestCity && nearestCity.factionId === army.getFactionId()) {
                        if (getEuclideanDistance(newPos, { lat: nearestCity.latitude, lng: nearestCity.longitude }) <= 0.2) {
                            iAmGarrison = true;
                        }
                    }
                }

                if (!iAmGarrison) {
                    if (tryEngageFieldBattle(this.fieldBattleDeps, army, oldPos, newPos)) {
                        return;
                    }
                }
            }

            // [NEW] No more strict block logic or traffic jams!
            // Armies can now pass through friendly armies or neutrals freely.
            // SpatialRegistry sync is already handled by Army.setPosition/moveArmy.
        });

        // 阵亡军团：清路径，延迟移出管理器（尸体由 GlobalUnitRenderer 保留 CORPSE_DISPLAY_MS）
        const corpseMs = GameConfig.LEGION.CORPSE_DISPLAY_MS;
        for (let i = this.armies.length - 1; i >= 0; i--) {
            const army = this.armies[i];
            if (!army.isDestroyed) continue;

            const scheduled = (army as Army & { _corpseRemovalScheduled?: boolean })._corpseRemovalScheduled;
            if (scheduled) continue;

            (army as Army & { _corpseRemovalScheduled?: boolean })._corpseRemovalScheduled = true;
            setTimeout(() => {
                if (this.armies.includes(army)) {
                    this.removeArmy(army);
                }
            }, corpseMs);
        }
    }

    public isArmyWaitingSiege(armyId: string): boolean {
        return this.siegeManager?.isArmyWaitingSiege?.(armyId) ?? false;
    }

    public triggerSiege(army: Army, targetCity: City): void {
        if (!this.siegeManager) {
            console.warn('[LegionManager] SiegeManager not linked! Cannot trigger siege.');
            return;
        }

        if (!targetCity) {
            console.error(`[LegionManager] Invalid targetCity passed to triggerSiege.`);
            return;
        }

        if (army.isDestroyed || army.getTroops() <= 0) return;
        if (army.getIsInCombat()) return; // Already busy
        if (this.siegeManager?.isArmyWaitingSiege(army.id)) return;

        if (targetCity.factionId === army.getFactionId()) {
            army.setTargetCity(null);
            army.stopMovement(true);
            return;
        }

        gameLog('legionSiege', `🏰 ${army.name} 攻城【${targetCity.name}】`);

        army.stopMovement(true);
        army.setCombatState(true, 'siege', { lat: targetCity.latitude, lng: targetCity.longitude });

        const siegeData: SiegeData = {
            ...(army.siegeMissionData ?? {}),
            defenderCityId: targetCity.id,
            attackerFactionId: army.getFactionId(),
        };

        this.siegeManager.startSiegeWithArmy(army, siegeData);
    }

    /**
     * Rename a legion (e.g., when commander changes: 王翦军 → 王贲军)
     */
    public renameLegion(armyIdOrName: string, newName: string): boolean {
        // Find by ID first, then by name
        let army = this.getLegionById(armyIdOrName);
        if (!army) {
            army = this.armies.find(a => a.name === armyIdOrName && !a.isDestroyed);
        }

        if (army) {
            gameLog('army', `📛 [LegionManager] Renaming "${army.name}" → "${newName}"`);
            army.name = newName;
            return true;
        }

        console.warn(`[LegionManager] Cannot rename: Legion "${armyIdOrName}" not found.`);
        return false;
    }


    /** 当前位置是否已进入敌方/叛军据点攻城圈 */
    private findHostileCityInZOC(army: Army): City | null {
        return this.findHostileCityNear(army.getPosition(), army.getFactionId());
    }

    /** 供 AI：军团站在敌对据点 ZOC 内时必须先处理该城 */
    public findHostileCityNear(pos: LatLng, factionId: string): City | null {
        const zoc = GameConfig.SIEGE.COMBAT_RADIUS;
        let nearest: City | null = null;
        let minDist = Infinity;

        for (const city of this.cityManager.getCities()) {
            if (!city.factionId || city.factionId === factionId) continue;
            const dist = getEuclideanDistance(pos, {
                lat: city.latitude,
                lng: city.longitude,
            });
            if (dist <= zoc && dist < minDist) {
                minDist = dist;
                nearest = city;
            }
        }
        return nearest;
    }

    public getCityManager(): CityManager {
        return this.cityManager;
    }

    public moveLegionToCity(army: Army, targetCityId: string, sourceCityId?: string): boolean {
        return roadMarchMoveLegionToCity(this.roadMarchDeps, army, targetCityId, sourceCityId);
    }

    /**
     * Find a suitable legion for an event.
     */
    public findCandidate(allArmies: Army[], factionId: string, targetPos: LatLng, name?: string): Army | null {
        // Filter valid candidates (Same faction, Legion type, Not destroyed, Idle)
        let candidates = allArmies.filter(a =>
            a.getFactionId() === factionId &&
            a.type === 'legion' &&
            !a.isDestroyed &&
            a.isIdle()
        );

        // 1. Name Match (Strict Faction + !Destroyed)
        if (name) {
            const namedCandidates = allArmies.filter(a =>
                a.getFactionId() === factionId &&
                a.name === name &&
                !a.isDestroyed &&
                !a.getIsInCombat()
            );

            if (namedCandidates.length > 0) {
                return namedCandidates[0]; // Return first match
            }
            return null;
        }

        // 2. Closest Match (Global)
        if (candidates.length === 0) return null;

        let closest: Army | null = null;
        let minDist = Infinity;

        candidates.forEach(legion => {
            const pos = legion.getPosition();
            const d = Math.sqrt(Math.pow(pos.lat - targetPos.lat, 2) + Math.pow(pos.lng - targetPos.lng, 2));

            if (d < minDist) {
                minDist = d;
                closest = legion;
            }
        });

        return closest;
    }

    /**
     * Split a legion if it has enough troops.
     * Returns the NEW split-off army, or null if failed.
     */
    public splitLegion(parentLegion: Army, requestedTroops: number, newName?: string): Army | null {
        // Buffer to keep parent meaningful
        if (requestedTroops >= (parentLegion.getTroops() - GameConfig.LEGION.SPLIT_BUFFER)) {
            return null; // Cannot split
        }

        const newArmy = parentLegion.split(requestedTroops);
        if (newArmy) {
            newArmy.legionType = parentLegion.legionType; // [FIX] Inherit type
            if (newName) {
                newArmy.name = newName;
            }
        }
        return newArmy;
    }

    /**
     * [AI HELPER] 获取指定位置周围的军团
     * 用于威胁评估和战场扫描
     */
    public getArmiesInRadius(center: LatLng, radiusInHexes: number): Army[] {
        // Approximate 1 hex to 0.15 degrees
        const radiusInDegrees = radiusInHexes * 0.15;
        return this.spatialRegistry.getArmiesInRadius(center.lat, center.lng, radiusInDegrees);
    }

    /**
     * Create a completely new Legion.
     */
    public createLegion(
        pos: LatLng,
        troops: number,
        factionId: string,
        name?: string,
        onArrive?: (army: Army) => void,
        legionType?: LegionType, // [UNIT SYSTEM] 兵种类型
        sourceCityId?: string, // [NEW] Source City
        generalId?: string // [NEW] General Avatar
    ): Army | null {
        if (!this.canSpawnMoreLegions()) {
            console.warn(`[LegionManager] 已达军团上限 ${GameConfig.LEGION.MAX_ACTIVE_LEGIONS}，无法创建 ${name ?? '军团'}`);
            return null;
        }

        // [PHYSICS] Ensure we don't spawn exactly on top of another unit
        let spawnPos = { ...pos };

        // [SIMPLIFIED] Euclidean overlapping check
        const occupants = this.spatialRegistry.getArmiesInRadius(spawnPos.lat, spawnPos.lng, 0.05);
        if (occupants.length > 0) {
            gameLog('army', `[LegionManager] Spawn location occupied. Applying slight offset...`);
            // Add a small jitter offset (approx 5-10km)
            spawnPos.lat += (Math.random() - 0.5) * 0.1;
            spawnPos.lng += (Math.random() - 0.5) * 0.1;
        }

        const region = this.resolveCultureRegion(spawnPos, sourceCityId);
        const skeletonType = getLegionTypeForCulture(region);
        const cappedTroops = Math.min(Math.floor(troops), getArmyMaxTroops(region));

        const army = new Army(
            this.map,
            spawnPos,
            null,
            cappedTroops,
            factionId,
            onArrive || (() => {}),
            undefined,
            undefined,
            name,
            skeletonType,
            generalId
        );

        army.type = 'legion';
        army.cultureRegion = region;

        if (sourceCityId) {
            army.setSourceCityId(sourceCityId);
            army.homeCityId = sourceCityId;
        }

        // 14 文化阵型（与军队编辑器一致）
        const cultureTier = getCultureTier(region, cappedTroops);
        if (cultureTier) {
            army.cultureSlots = expandCompositionSlots(cultureTier.slots);
            army.cultureScales = expandCompositionScales(cultureTier.slots);
        }
        this.addArmy(army);

        return army;
    }

    /**
     * [NEW] Recalculate paths for all moving legions (e.g. when road network changes)
     */
    public recalculateAllLegionPaths(): void {
        gameLog('legionMarch', `[LegionManager] Road network updated. Recalculating all legion paths...`);
        let updateCount = 0;

        this.armies.forEach(army => {
            if (army.isIdle() || army.getIsInCombat()) return;

            const targetCity = army.getTargetCity();
            if (!targetCity) return;

            const pos = army.getPosition();
            const roadStartId =
                roadRegistry.getNearestCityId(pos.lat, pos.lng) ??
                army.homeCityId ??
                army.getSourceCityId() ??
                undefined;

            if (this.moveLegionToCity(army, targetCity.id, roadStartId)) {
                updateCount++;
            } else {
                console.warn(`⛔ [LegionManager] 道路中断！${army.name} 无法前往 ${targetCity.name}，被迫原地待命。`);
                army.stopMovement();
            }
        });

        if (updateCount > 0) {
            gameLog('legionMarch', `🔄 [LegionManager] 共更新了 ${updateCount} 个军团的行军路线。`);
        }
    }

}
