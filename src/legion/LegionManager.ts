import { Army } from './Army';
import { getLegionEliteLegionName, isCityGeneralEliteAnchor } from '../data/ExpeditionLegions';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { generalHasStrategicEffect, getGeneralStrategicMagnitude, getCityAnchoredStrategicMagnitude, emitFollowedGeneralStrategicMapFx, emitFollowedLongDriveDeepBypassFx, getLongDriveDeepBypassChance, emitFollowedCityAnchoredDefensePulse } from '../combat/GeneralSkillCombat';
import {
    applyLegionSpawnTierToArmy,
    attachFactionGeneralToArmy,
    makeArmyElite,
    markSpawnTierConsumed,
    noteCitySpawnTierFromLegion,
    type CitySpawnTierState,
} from './LegionSpawnTier';
import {
    lockGeneralAfterDefeat,
    lockEliteAfterDefeat,
    tickAndApplyDefeatCooldowns,
    isGeneralOnCooldown,
    isEliteOnCooldown,
} from './DefeatCooldown';
import { CityManager } from '../world/CityManager';
import { GameMap } from '../map/GameMap';
import { GameConfig } from '../config/GameConfig';
import { City, LatLng, SiegeData } from '../types/core';
import { cityToLatLng, getEuclideanDistance } from '../core/DistanceUtils';
import { getFollowedArmyId, spawnMapFloatingText } from '../utils/MapFloatingText';
import {
    releaseFieldBattleCombatState,
    tryEngageFieldBattle,
    type LegionFieldBattleDeps,
} from './field/LegionFieldBattle';
import {
    moveLegionToCity as roadMarchMoveLegionToCity,
    type LegionRoadMarchDeps,
} from './march/LegionRoadMarch';
import {
    haversineKm,
    resetKmSinceSupplyIfNearOwnCity,
    tickMarchAttrition,
} from './march/MarchAttritionSystem';
import { SpatialRegistry } from '../world/SpatialRegistry';
import { CombatSystem } from '../combat/CombatSystem';
import { LegionType } from '../types/UnitTypes';
import { roadRegistry } from '../roads/RoadRegistry';
import { getCityRegion, RegionType } from '../systems/RegionSystem';
import {
    applyLegionCultureComposition,
    getArmyMaxTroops,
    getLegionTypeForCulture,
} from '../types/CultureFormations';
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
    /** 远输减员飘字汇总（armyId -> 未飘出的累计损失与计时，游戏秒；≥3 秒汇总一次） */
    private marchAttritionFloatAccum: Map<string, { loss: number; elapsed: number }> = new Map();

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
        const legions = this.armies.filter(
            (a) => a.type === 'legion' && !a.isDestroyed,
        );
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

    public addArmy(army: Army, force = false): void {
        // [FIX] Idempotency: Avoid adding the same army multiple times
        if (this.armies.includes(army)) return;

        if (
            !force &&
            army.type === 'legion' &&
            !army.isDestroyed &&
            !this.canSpawnMoreLegions()
        ) {
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

        applyLegionCultureComposition(army, region);
        this.addArmy(army);
        this.applyLegionTier(army);
        return army;
    }

    /**
     * 军团分层（有 CITY_ELITE_LEGIONS 的据点）：
     *   - 无番号映射 → 保持募兵默认「{城名}军团」。
     *   - ≥4万 → 在据点配额允许时补精锐/将领。
     *   - &lt;4万 → 四档各 25%（仅仍可用档位）：普通 / 仅精锐 / 仅将领 / 精锐+将领；据点将领/精锐各只能出一次。
     *   出生定档，精锐番号不降级；长到 4万 由 tickLegionTiers 在配额内补全。
     */
    private applyLegionTier(army: Army): void {
        const cityId = army.homeCityId ?? army.getSourceCityId();
        const city = cityId ? this.cityManager.getCity(cityId) : undefined;
        applyLegionSpawnTierToArmy(army, city);
    }

    /** 扫描现有军团，反推各据点将/精消耗（开局与热更后） */
    public syncCitySpawnTierConsumption(): void {
        const cities = this.cityManager.getCities();
        for (const city of cities) {
            city.spawnGeneralUsed = false;
            city.spawnEliteUsed = false;
        }
        for (const army of this.armies) {
            if (army.isDestroyed || army.type !== 'legion') continue;
            const cityId = army.homeCityId ?? army.getSourceCityId();
            if (!cityId) continue;
            const city = this.cityManager.getCity(cityId);
            if (!city || city.factionId !== army.getFactionId()) continue;
            noteCitySpawnTierFromLegion(city, army);
        }
        tickAndApplyDefeatCooldowns(cities);
    }

    /**
     * 每季扫描：兵力长到 ≥4万 的军团在据点配额允许时补精锐/将领。
     * 普通军团长到 4万 → 精锐+名将（若未消耗）；已是精锐（无将）的小军长到 4万 → 补名将。
     * 由 RecruitmentSystem 每季调用一次。
     */
    public tickLegionTiers(): void {
        const threshold = GameConfig.EXPEDITION.UNLOCK_TROOPS;
        for (const army of this.armies) {
            if (army.isDestroyed || army.type !== 'legion') continue;
            if (army.getTroops() < threshold) continue;
            if (army.isElite && army.generalId) continue;

            const eliteName = getLegionEliteLegionName(army);
            if (!eliteName) continue;

            const cityId = army.homeCityId ?? army.getSourceCityId();
            const city = cityId ? this.cityManager.getCity(cityId) : undefined;
            const state: CitySpawnTierState = city ?? {};
            const atAnchor = isCityGeneralEliteAnchor(cityId);
            const canGeneral =
                atAnchor && !state.spawnGeneralUsed && !!cityId && !isGeneralOnCooldown(cityId) && !!getCityAnchoredGeneral(cityId);
            const canElite = !state.spawnEliteUsed && !!cityId && !isEliteOnCooldown(cityId);

            if (army.isElite && !army.generalId) {
                if (!canGeneral) continue;
                if (attachFactionGeneralToArmy(army)) {
                    markSpawnTierConsumed(state, { general: true });
                    noteCitySpawnTierFromLegion(city, army);
                }
                continue;
            }

            if (!canElite && !canGeneral) continue;

            if (canElite) {
                const applied = makeArmyElite(army, eliteName, canGeneral);
                markSpawnTierConsumed(state, {
                    elite: applied.elite,
                    general: applied.general && canGeneral,
                });
            } else if (canGeneral) {
                if (attachFactionGeneralToArmy(army)) {
                    markSpawnTierConsumed(state, { general: true });
                }
            }
            noteCitySpawnTierFromLegion(city, army);
        }
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
            applyLegionCultureComposition(army, region);
        });
    }

    public removeArmy(army: Army): void {
        this.followResupplySystem?.clearForArmy(army.id);
        this.marchAttritionFloatAccum.delete(army.id);
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

            if (
                this.followResupplySystem &&
                army.type === 'legion' &&
                !army.getIsInCombat()
            ) {
                this.followResupplySystem.tickStrategicFieldResupply(army, deltaTime);
            }

            // 坚壁清野：本城被攻击（含沿途/排队/已开战）时来犯军每秒减兵，技挂录入锚将
            this.tickApproachAttrition(army, deltaTime);

            // 行军减兵（远输困境）：里程累计 → 途经己方据点复位 → 分档扣减
            this.tickMarchAttritionPipeline(army, oldPos, newPos, deltaTime);

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
                    // 先存档再攻城：勿 stop(false) 清空战前路径，否则战后无法 resume
                    army.stopMovement(true);
                    // 存档后再收位：setPosition 会清行军路径，先收位会毁掉战前存档
                    this.clampArmyToSiegeRing(army, zocCity, oldPos);
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
                            gameLog('legionSiege', `🏯 [LegionManager] ${army.name} arrived at hostile city ${latestTargetCity.name} (${dist.toFixed(4)}). Triggering Siege!`);
                            this.clampArmyToSiegeRing(army, latestTargetCity, oldPos);
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

            // 战败冷却与尸体显示彻底解耦：
            // 军团一旦判定阵亡（且非 disband），立刻给其锚点城挂将/精冷却，
            // 不再等待 CORPSE_DISPLAY_MS 的延迟 removeArmy。
            const defeatLocked = (army as Army & { _defeatCooldownLocked?: boolean })._defeatCooldownLocked;
            if (!army.wasDisbanded && !defeatLocked) {
                const cityId = army.homeCityId ?? army.getSourceCityId();
                if (cityId) {
                    if (army.generalId) lockGeneralAfterDefeat(cityId);
                    if (army.isElite) lockEliteAfterDefeat(cityId);
                }
                (army as Army & { _defeatCooldownLocked?: boolean })._defeatCooldownLocked = true;
            }

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

    /** 本城是否正被攻打（围城/在途/排队）——宽口径，募兵等通用判定用 */
    public isCityUnderAttack(cityId: string): boolean {
        return this.siegeManager?.isCityUnderAttack?.(cityId) ?? false;
    }

    /**
     * 本城是否正在被攻城——严格口径：只认真打起来的攻城战（hasActiveSiegeAt），
     * 敌军仅在途/迫近不算。军团回援判定专用（AGENTS.md 军团回援与收复规则）。
     */
    public isCityBeingSieged(cityId: string): boolean {
        return this.siegeManager?.hasActiveSiegeAt?.(cityId) ?? false;
    }

    /** 残兵撤回本城：本城守城战进行中则作为守方加入，成功返回 true */
    public tryJoinCityDefense(army: Army, cityId: string): boolean {
        return this.siegeManager?.tryJoinCityDefense?.(army, cityId) ?? false;
    }

    public dequeueArmyFromThirdPartyWaiters(armyId: string): boolean {
        return this.siegeManager?.dequeueArmyFromThirdPartyWaiters?.(armyId) ?? false;
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

        // ── 威慑·越城而走：兵力劣势时概率跳过此城（统一入口，覆盖 ZOC/idle/路网等所有调用路径）──
        if (generalHasStrategicEffect(army, 'skip_disadvantaged_siege')) {
            const myTroops = army.getTroops();
            const enemyTroops = targetCity.troops ?? 0;
            if (myTroops < enemyTroops) {
                const chance = getGeneralStrategicMagnitude(army, 'skip_disadvantaged_siege', 0.10);
                if (Math.random() < chance) {
                    gameLog('legionSiege', `[威慑] 越城而走：${army.name} 跳过【${targetCity.name}】`);
                    const pos = army.getPosition();
                    emitFollowedGeneralStrategicMapFx(army, 'skip_disadvantaged_siege', pos.lat, pos.lng, 'pulse');
                    army.setTargetCity(null);
                    return;
                }
            }
        }

        gameLog('legionSiege', `🏯 ${army.name} 攻城【${targetCity.name}】`);

        army.stopMovement(true);
        army.setCombatState(true, 'siege', { lat: targetCity.latitude, lng: targetCity.longitude });

        // isDynamic：沙盒 AI/碰撞攻城胜后交还 BT，禁止默认 garrison 清存档锁死原地
        const siegeData: SiegeData = {
            ...(army.siegeMissionData ?? {}),
            defenderCityId: targetCity.id,
            attackerFactionId: army.getFactionId(),
            isDynamic: !(army.siegeMissionData?.afterBattleChain?.length || army.siegeMissionData?.afterBattle),
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
        return this.findHostileCityNear(army.getPosition(), army.getFactionId(), army);
    }

    /**
     * 高速军团（骑兵×兵贵神速×高倍速）一帧步距可达 0.06+，越过 COMBAT_RADIUS 停步线
     * 才被逐帧检测发现，停得离城过近甚至穿心。停步后把越线部分沿「城→军团」方向收回
     * 到线上：同一帧渲染前完成，观感即「冲到停步线停住」，所有军团停在同一条线。
     * 必须在 stopMovement(true) 之后调用——setPosition 对行军中军团会清路径，先收位会毁战前存档。
     * @param fallbackFrom 本帧移动前坐标；军团恰好踩在城心（方向不可求）时用它定方向
     */
    private clampArmyToSiegeRing(army: Army, city: City, fallbackFrom: LatLng): void {
        const ring = GameConfig.SIEGE.COMBAT_RADIUS;
        const cityPos = { lat: city.latitude, lng: city.longitude };
        const pos = army.getPosition();
        if (getEuclideanDistance(pos, cityPos) >= ring) return;
        let dirLat = pos.lat - cityPos.lat;
        let dirLng = pos.lng - cityPos.lng;
        let len = Math.sqrt(dirLat * dirLat + dirLng * dirLng);
        if (len < 1e-9) {
            dirLat = fallbackFrom.lat - cityPos.lat;
            dirLng = fallbackFrom.lng - cityPos.lng;
            len = Math.sqrt(dirLat * dirLat + dirLng * dirLng);
            if (len < 1e-9) return; // 连上一帧也在城心：放弃收位（极端罕见）
        }
        army.setPosition(cityPos.lat + (dirLat / len) * ring, cityPos.lng + (dirLng / len) * ring);
    }

    /** 供 AI：军团站在敌对据点 ZOC 内时必须先处理该城 */
    public findHostileCityNear(pos: LatLng, factionId: string, army?: Army | null): City | null {
        // 长驱深入(str_11)：远征军团默认 50% 绕 small_city；非远征时仅挂 str_11 的将。概率 = 目录 magnitude。
        const smallCityBypassChance = army ? getLongDriveDeepBypassChance(army) : 0;
        const zoc = GameConfig.SIEGE.COMBAT_RADIUS;
        let nearest: City | null = null;
        let minDist = Infinity;

        for (const city of this.cityManager.getCities()) {
            if (!city.factionId || city.factionId === factionId) continue;
            const dist = getEuclideanDistance(pos, {
                lat: city.latitude,
                lng: city.longitude,
            });
            // 长驱深入：仅 small_city 可被绕过，按 (军团id+据点id) 稳定掷点（同一军团对同一小城结果固定，
            // 不逐帧闪烁），命中概率 = magnitude。big_city / medium_city / pass 不进此分支，恒拦截。
            // 本军团自己的攻击目标城不适用绕过：绕过意为"路过不被拦"，若绕过自己要打的城，
            // 军团会一直走到城中心才触发攻城，开战时贴在城头上（离城 0 而非统一的 0.1）。
            if (
                dist <= zoc &&
                city.type === 'small_city' &&
                smallCityBypassChance > 0 &&
                army &&
                city.id !== army.getTargetCity?.()?.id &&
                city.id !== army.expeditionTargetCityId &&
                this.rollSmallCityZocBypass(army.id, city.id, smallCityBypassChance)
            ) {
                const bypassedSet = (army as any).bypassedCities || ((army as any).bypassedCities = new Set<string>());
                if (!bypassedSet.has(city.id)) {
                    bypassedSet.add(city.id);
                    gameLog('battle', `〔长驱深入〕${army.expeditionTargetCityId ? '远征军' : (army.generalId || '将领')}无视【${city.name}】守军，长驱直入`);
                }
                // 进入 ZOC 且判定绕城：跟拍时在军团脚下 pulse（未跟拍不写 dedupe，开跟拍后仍可补显示）
                emitFollowedLongDriveDeepBypassFx(
                    army,
                    pos.lat,
                    pos.lng,
                    { dedupeMs: 6000, dedupeKey: `${army.id}|str_11|${city.id}` },
                );
                continue;
            }
            if (dist <= zoc && dist < minDist) {
                minDist = dist;
                nearest = city;
            }
        }
        return nearest;
    }

    /**
     * 长驱深入：判定某军团是否绕过某小城的 ZOC。
     * 用 (armyId + cityId) 做 FNV-1a 稳定哈希 → [0,1)，与 chance 比较。
     * 同一军团对同一小城结果恒定（不逐帧随机 → 不会「这帧过、下帧被拦」），整体命中率≈chance。
     */
    private rollSmallCityZocBypass(armyId: string, cityId: string, chance: number): boolean {
        if (chance <= 0) return false;
        if (chance >= 1) return true;
        const key = `${armyId}:${cityId}`;
        let h = 2166136261; // FNV offset basis
        for (let i = 0; i < key.length; i++) {
            h ^= key.charCodeAt(i);
            h = Math.imul(h, 16777619); // FNV prime
        }
        return (h >>> 0) / 4294967296 < chance;
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
        generalId?: string, // [NEW] General Avatar
        forceCreate: boolean = false
    ): Army | null {
        if (!forceCreate && !this.canSpawnMoreLegions()) {
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

        applyLegionCultureComposition(army, region);
        this.addArmy(army, forceCreate);

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

    /**
     * 坚壁清野（str_05）：守城据点录入锚将挂技；本城 isCityUnderAttack（1 宽）时，
     * 来犯军团每秒 −magnitude（默认 1%），含沿途迫近、排队与已开战攻城。
     */
    private tickApproachAttrition(army: Army, deltaTime: number): void {
        if (army.isDestroyed || army.getTroops() <= 0) return;

        const cityId = this.resolveApproachAttritionCityId(army);
        if (!cityId) return;

        const city = this.cityManager.getCity(cityId);
        if (!city) return;

        const armyFaction = army.getFactionId();
        if (!armyFaction || armyFaction === city.factionId) return;

        if (!this.isCityUnderAttack(cityId)) return;
        if (!this.isArmyThreateningCityUnderAttack(army, cityId)) return;

        const mag = getCityAnchoredStrategicMagnitude(cityId, 'siege_approach_attrition');
        if (mag <= 0 || mag >= 1) return;

        const loss = Math.max(1, Math.floor(army.getTroops() * mag * deltaTime));
        army.setTroops(Math.max(1, army.getTroops() - loss));

        const followedId = getFollowedArmyId();
        const pulseArmy =
            (followedId ? this.getLegionById(followedId) : undefined) ?? army;
        emitFollowedCityAnchoredDefensePulse(
            cityId,
            city.latitude,
            city.longitude,
            'siege_approach_attrition',
            pulseArmy,
        );
    }

    /**
     * 行军减兵（远输困境）管线（2026-07-21 主人裁定 v1）：
     *   ① 里程累计：非战斗、非海上、发生位移才按 haversine km 累加 kmSinceSupply（海上冻结）；
     *   ② 途经复位：距任一己方（同 factionId）据点 ≤ RESET_RADIUS_KM 即清零（不要求驻停，静止军团也生效）；
     *   ③ 分档扣减：战斗/远征/海运/str_13 豁免与保底 1 等守卫全在 MarchAttritionSystem 内。
     */
    private tickMarchAttritionPipeline(army: Army, oldPos: LatLng, newPos: LatLng, deltaTime: number): void {
        if (!GameConfig.MARCH_ATTRITION.ENABLED) return;
        if (army.isDestroyed || army.getTroops() <= 0) return;

        // ① 里程累计（海上/战斗中不计；blocked 分支在主循环已提前 return，不会走到这里）
        if (!army.getIsInCombat() && !army.isOnSea
            && (oldPos.lat !== newPos.lat || oldPos.lng !== newPos.lng)) {
            army.kmSinceSupply += haversineKm(oldPos.lat, oldPos.lng, newPos.lat, newPos.lng);
        }

        // ② 途经复位（己方城查询复用 FollowResupplySystem 同款 cityManager.getCitiesByFaction）
        resetKmSinceSupplyIfNearOwnCity(army, this.cityManager.getCitiesByFaction(army.getFactionId()));

        // ③ 分档扣减；本帧整数损失汇总给跟拍飘字
        const loss = tickMarchAttrition(army, deltaTime);
        if (loss > 0) this.accumulateMarchAttritionFloat(army, loss, deltaTime);
    }

    /** 远输减员飘字：每军团 ≥3 游戏秒汇总一次，只飘跟拍军团（与战略技 pulse 同规） */
    private accumulateMarchAttritionFloat(army: Army, loss: number, deltaTime: number): void {
        let entry = this.marchAttritionFloatAccum.get(army.id);
        if (!entry) {
            entry = { loss: 0, elapsed: 0 };
            this.marchAttritionFloatAccum.set(army.id, entry);
        }
        entry.loss += loss;
        entry.elapsed += deltaTime;
        if (entry.elapsed < 3) return;
        this.marchAttritionFloatAccum.delete(army.id);

        const totalLoss = Math.floor(entry.loss);
        if (totalLoss <= 0) return;
        if (army.id !== getFollowedArmyId()) return;
        const pos = army.getPosition();
        spawnMapFloatingText(pos.lat, pos.lng, `-${totalLoss} 远输减员`, '#ff5555');
    }

    /** 来犯减兵锚定之城：行军 targetCity，或已开打攻城战之 siegeCityId */
    private resolveApproachAttritionCityId(army: Army): string | null {
        const targetCity = army.getTargetCity();
        if (targetCity?.id) return targetCity.id;
        return this.siegeManager?.getActiveSiegeCityIdForArmy?.(army) ?? null;
    }

    /** 该军团是否构成对本城的来犯威胁（与 isCityUnderAttack 宽口径子集对齐） */
    private isArmyThreateningCityUnderAttack(army: Army, cityId: string): boolean {
        if (army.getIsInCombat()) {
            if (army.currentBattleType !== 'siege') return false;
            const siegeCityId = this.siegeManager?.getActiveSiegeCityIdForArmy?.(army);
            if (siegeCityId !== cityId) return false;
            const battle = this.siegeManager?.getActiveSiege(cityId);
            return !!battle && army.getFactionId() === battle.getAttackerFactionId();
        }

        if (army.getTargetCity()?.id !== cityId) return false;
        if (this.isArmyWaitingSiege(army.id)) return true;
        if (this.siegeManager?.isArmyPendingSiege?.(army.id)) return true;

        const city = this.cityManager.getCity(cityId);
        if (!city) return false;
        const dist = getEuclideanDistance(army.getPosition(), cityToLatLng(city));
        return dist <= GameConfig.COMBAT.BATTLE_JOIN_RADIUS;
    }
}
