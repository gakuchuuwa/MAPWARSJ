import { CityManager } from '../world/CityManager';
import { LegionManager } from '../legion/LegionManager';
import { CombatSystem, IBattleUnit } from './CombatSystem';
import { GameMap } from '../map/GameMap';
import { EventVisualizer } from '../core/EventVisualizer';
import { SiegeData } from '../types/core';
import { HISTORICAL_LEGIONS } from '../data/legions';
import { Army } from '../legion/Army';
import { BattleUnitFactory } from './BattleUnitFactory';
import { BattleField } from './BattleField';
import { GameConfig } from '../config/GameConfig';
import { gameLog } from '../utils/GameLogger';
import { getFactionGeneral, getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { getUnitEliteTier } from '../systems/CultureCombat';
import { getLegionEliteLegionName } from '../data/ExpeditionLegions';
import { generalHasStrategicEffect, getGeneralStrategicMagnitude, getCityAnchoredStrategicMagnitude, emitFollowedGeneralStrategicMapFx } from './GeneralSkillCombat';
import { applyLegionSpawnTierToArmy } from '../legion/LegionSpawnTier';
import { getFollowedArmyId } from '../utils/MapFloatingText';

const siegeLog = (...args: unknown[]) => gameLog('siege', ...args);
import { LegionType, getDefaultLegionTypeForFaction } from '../types/UnitTypes';
import {
    getHexDistance,
    getEuclideanDistance,
    isWithinReinforcementRange,
    cityToLatLng,
    DISTANCE_THRESHOLDS,
} from '../core/DistanceUtils';
import {
    pollSiegeReinforcements,
    tryJoinLegionToBattle,
    type ReinforcementJoinDeps,
} from '../legion/combat/BattleReinforcementPoll';
import { markLegionAnnihilationFeed } from '../legion/LegionAnnihilationFeed';
import { speechAnnouncer, type CaptureJu } from '../audio/SpeechAnnouncer';
import { shouldSkipHomeRecapture } from '../legion/LegionSpawnPolicy';
import {
    applySiegeGarrisonBoostIfNeeded,
    clearSiegeGarrisonBoost,
    type SiegeGarrisonBoostFields,
} from './SiegeGarrisonTier';
import { repositionAllLegionsNearSiegeCity } from './SiegeArmyPlacement';

export class SiegeManager {
    private static get JOIN_RADIUS(): number {
        return GameConfig.COMBAT.BATTLE_JOIN_RADIUS;
    }
    private static readonly VERBOSE_REINFORCEMENT_LOG = false;

    private cityManager: CityManager;
    private legionManager: LegionManager;
    private combatSystem: CombatSystem;
    private map: GameMap;
    private visualizer: EventVisualizer;
    private onLegionUpdate?: (name: string, troops: number) => void;

    // [新增] 追踪每个城市的活跃战场
    private activeSieges: Map<string, BattleField> = new Map();
    // [新增] 追踪正在前往目标的攻城军团（移动阶段，尚未开战）
    private pendingSieges: Set<string> = new Set(); // armyId -> pending

    /** 第三方攻城：先到先等，当前战场结束后再开战（按抵达顺序 FCFS） */
    private siegeThirdPartyWaiters: Map<string, Array<{
        army: Army;
        siegeData: SiegeData;
        onSiegeComplete?: () => void;
        /** 该等待者的停步环距离（先到者近、后到者远，沿各自道路错开，防重叠） */
        stopDist: number;
        /** true=已入队但仍在沿原路走近停步环（绝不传送，走到环上再停） */
        approaching: boolean;
    }>> = new Map();

    /** 看门狗（2026-07-17）：等候队列所在城首次被发现「无进行中攻城」的时刻（cityId → ms）。
     *  正常流转下队列只在攻城进行中存在；无战超时 = 某条结束路径漏调 processSiegeThirdPartyWaiters
     *  （如曾经的不战而屈泄漏），排队者会被 BT 的 IsWaitingSiege 永久冻结——自动直播不可接受，超时整队放行兜底。 */
    private waiterQueueOrphanSince: Map<string, number> = new Map();

    /** 看门狗超时：160 秒真实时间（主人 2026-07-17 定；正常"唤醒者走向城下开新战"的空窗只有几秒到十几秒，160s 远在其外） */
    private static readonly WAITER_WATCHDOG_MS = 160_000;

    /** 等待环基准：比开战圈稍外（攻城军停在 COMBAT_RADIUS≈0.1，等待者最近停 0.2） */
    private static readonly WAIT_RING_BASE = GameConfig.SIEGE.COMBAT_RADIUS + 0.1;
    /** 同城每多一个等待者，停步环外推一档（同路来的自然前后排开，不同路来的方向本就不同） */
    private static readonly WAIT_RING_SPACING = 0.05;

    private getReinforcementJoinDeps(): ReinforcementJoinDeps {
        return {
            spatialRegistry: this.legionManager.getSpatialRegistry(),
            removeArmy: (army) => this.legionManager.removeArmy(army),
            isArmyWaitingSiege: (armyId) => this.isArmyWaitingSiege(armyId),
            resolveBattleCityName: (center) => {
                const nearest = this.cityManager.getNearestCity(null, {
                    latitude: center.lat,
                    longitude: center.lng,
                });
                return nearest?.name ?? '未知';
            },
            beforeJoinLegion: (legion, center) => {
                this.positionArmyForSiege(legion, center);
            },
        };
    }

    /** 编入攻城：只强制挪本军 + 本场相关单位，不传送路过/闲置军团 */
    private positionArmyForSiege(army: Army, cityPos: { lat: number; lng: number }): void {
        const cityId = army.getTargetCity()?.id ?? null;
        repositionAllLegionsNearSiegeCity(cityPos, this.legionManager.getArmies(), {
            cityId,
            forceArmies: [army],
            isWaitingSiege: (id) => this.isArmyWaitingSiege(id),
        });
    }

    /** 第三方排队：只统一面朝据点，不传送（仍在走近的不转向，行军朝向由移动系统管） */
    private repositionThirdPartyWaiters(cityId: string, cityPos: { lat: number; lng: number }): void {
        const queue = this.siegeThirdPartyWaiters.get(cityId) ?? [];
        const forceArmies = queue.filter((e) => !e.approaching).map((e) => e.army).filter((a) => !a.isDestroyed);
        repositionAllLegionsNearSiegeCity(cityPos, this.legionManager.getArmies(), {
            cityId,
            forceArmies,
            isWaitingSiege: (id) => this.isArmyWaitingSiege(id),
        });
    }

    /** 由 CombatSystem 节流调用：扫描圈内同旗军团并加入进行中的攻城战；异旗军团排队等待 */
    public runReinforcementPoll(): void {
        pollSiegeReinforcements(
            this.activeSieges,
            (cityId) => {
                const city = this.cityManager.getCity(cityId);
                return city ? cityToLatLng(city) : null;
            },
            this.legionManager,
            (armyId) => this.isArmyWaitingSiege(armyId),
            (legion, center) => this.positionArmyForSiege(legion, center),
        );

        // 扫描圈内异旗军团：不穿过交战区，排队等待
        this.interceptThirdPartyPassersBy();

        // 看门狗：兜住任何"攻城已结束却没人放行队列"的漏网（防排队者被 IsWaitingSiege 永久冻结）
        this.tickWaiterWatchdog();
    }

    /**
     * 排队看门狗（2026-07-17 主人定，自动直播兜底）：
     * 队列所在城已无进行中的攻城 → 开始计时；持续 60s 仍无战 → 整队放行交还 AI 决策。
     * 交战中的等待者保留在队（其战斗结束自有流转，且不能丢事件链回调）；其余出队并触发回调解锁事件队列。
     */
    private tickWaiterWatchdog(): void {
        const now = Date.now();
        for (const [cityId, queue] of [...this.siegeThirdPartyWaiters.entries()]) {
            const battle = this.activeSieges.get(cityId);
            if (battle && !battle.isOver) {
                this.waiterQueueOrphanSince.delete(cityId);
                continue;
            }
            const since = this.waiterQueueOrphanSince.get(cityId);
            if (since === undefined) {
                this.waiterQueueOrphanSince.set(cityId, now);
                continue;
            }
            if (now - since < SiegeManager.WAITER_WATCHDOG_MS) continue;

            // 超时：放行整队（交战中的保留，等其战斗结束后由下一轮看门狗接手）
            const remaining: typeof queue = [];
            const cityName = this.cityManager.getCity(cityId)?.name ?? cityId;
            for (const entry of queue) {
                const { army, onSiegeComplete } = entry;
                if (army.isDestroyed) continue;
                if (army.getIsInCombat()) { remaining.push(entry); continue; }
                army.setCombatState(false);
                army.ignoreCityCollision = false;
                army.ignoreUnitCollision = false;
                army.clearBlocked();
                army.setTargetCity(null);
                onSiegeComplete?.(); // 事件链回调必须触发，防事件队列锁死
                siegeLog(`⏰ [看门狗] ${army.name} 在【${cityName}】排队等待超时（攻城早已结束却未出队），放行交还 AI 决策`);
            }
            if (remaining.length > 0) {
                this.siegeThirdPartyWaiters.set(cityId, remaining);
                // 保留计时（不删 orphanSince）：残留者战斗结束后下一次超时判定立即放行
            } else {
                this.siegeThirdPartyWaiters.delete(cityId);
                this.waiterQueueOrphanSince.delete(cityId);
            }
        }
        // 清理已不存在队列的孤儿计时
        for (const cityId of [...this.waiterQueueOrphanSince.keys()]) {
            if (!this.siegeThirdPartyWaiters.has(cityId)) this.waiterQueueOrphanSince.delete(cityId);
        }
    }

    /** 扫所有活跃攻城战：圈内非同旗军团 → 排队等待（不穿越交战区、不瞬移） */
    private interceptThirdPartyPassersBy(): void {
        for (const [cityId, battleField] of this.activeSieges) {
            if (battleField.isOver) continue;
            const city = this.cityManager.getCity(cityId);
            if (!city) continue;
            const center = cityToLatLng(city);
            const attFaction = battleField.getAttackerFactionId();
            const defFaction = battleField.getDefenderFactionId();

            const nearby = this.legionManager.getSpatialRegistry().getArmiesInRadius(
                center.lat, center.lng, GameConfig.COMBAT.BATTLE_JOIN_RADIUS,
            );
            for (const legion of nearby) {
                if (legion.isDestroyed || legion.type !== 'legion') continue;
                if (legion.getIsInCombat()) continue;
                if (this.isArmyWaitingSiege(legion.id)) continue;
                const myFaction = legion.getFactionId();
                if (myFaction === attFaction || myFaction === defFaction) continue; // 同旗由 pollSiegeReinforcements 处理

                // 异旗：入队。已在停步环内的原地停步；还在环外的继续沿原路走近，
                // 由 settleApproachingWaiters 每次轮询检查、走到环上再停（绝不传送）。
                this.enqueueSiegeThirdPartyWaiter(cityId, legion, {
                    defenderCityId: cityId,
                    attackerFactionId: attFaction,
                    isDynamic: true,
                } as SiegeData, undefined, /* approaching */ true);
                siegeLog(`🚧 [SiegeManager] ${legion.name} (${myFaction}) 途经【${city.name}】交战区，排队等待（走近停步环）`);
            }
            this.settleApproachingWaiters(cityId, center);
        }
    }

    /**
     * 已入队但仍在行军的等待者：走到各自停步环（先到者近、后到者远）即停步面城。
     * 路径只是擦圈而过、已走出开战圈的 → 出队放行（从未穿越交战核心区）。
     */
    private settleApproachingWaiters(cityId: string, center: { lat: number; lng: number }): void {
        const queue = this.siegeThirdPartyWaiters.get(cityId);
        if (!queue || queue.length === 0) return;

        let settled = false;
        const remaining: typeof queue = [];
        for (const entry of queue) {
            const { army } = entry;
            if (army.isDestroyed) continue;
            if (!entry.approaching) { remaining.push(entry); continue; }
            if (army.getIsInCombat()) { remaining.push(entry); continue; }

            const dist = getEuclideanDistance(army.getPosition(), center);
            if (dist <= entry.stopDist || army.isIdle()) {
                // 到环（或已自行停步）→ 正式停步排队
                army.stopMovement(true);
                army.setTargetCity(null);
                army.setCombatState(false);
                entry.approaching = false;
                settled = true;
                siegeLog(`🚧 [SiegeManager] ${army.name} 抵达【${cityId}】停步环（${dist.toFixed(2)}），排队等待`);
                this.tryAnnounceQueueWait(army);
                remaining.push(entry);
            } else if (dist > SiegeManager.JOIN_RADIUS + 0.05) {
                // 路线只是擦边而过，已走远 → 放行，不再视为等待者
                entry.onSiegeComplete?.();
                siegeLog(`↩️ [SiegeManager] ${army.name} 擦边路过【${cityId}】未入交战区，放行`);
            } else {
                remaining.push(entry); // 仍在走近，下轮再查
            }
        }

        if (remaining.length > 0) {
            this.siegeThirdPartyWaiters.set(cityId, remaining);
        } else {
            this.siegeThirdPartyWaiters.delete(cityId);
        }
        if (settled) this.repositionThirdPartyWaiters(cityId, center);
    }

    public hasActiveSieges(): boolean {
        // [修复] 同时检查进行中的战斗和正在行军的攻城军团
        return this.activeSieges.size > 0 || this.pendingSieges.size > 0;
    }

    /** 该城是否已有进行中的攻城战 */
    public hasActiveSiegeAt(cityId: string): boolean {
        const battle = this.activeSieges.get(cityId);
        return !!battle && !battle.isOver;
    }

    /** 军团是否在 pending 攻城队列（已触发、尚未抵达开打） */
    public isArmyPendingSiege(armyId: string): boolean {
        return this.pendingSieges.has(armyId);
    }

    /** 已开打攻城战中 targetCity 可能已清，按参战军团反查 siegeCityId */
    public getActiveSiegeCityIdForArmy(army: Army): string | null {
        if (!army.getIsInCombat() || army.currentBattleType !== 'siege') return null;
        for (const [cityId, battle] of this.activeSieges) {
            if (battle.isOver) continue;
            if (battle.hasParticipant(army.id)) return cityId;
        }
        return null;
    }

    /** 该城是否正被围攻或已有军团在途/排队攻城（驻军已投入战场，不可再募兵出城） */
    public isCityUnderAttack(cityId: string): boolean {
        if (this.hasActiveSiegeAt(cityId)) return true;
        if ((this.siegeThirdPartyWaiters.get(cityId)?.length ?? 0) > 0) return true;
        for (const armyId of this.pendingSieges) {
            const army = this.legionManager.getArmies().find((a) => a.id === armyId);
            if (!army || army.isDestroyed) continue;
            if (army.getTargetCity()?.id === cityId) return true;
        }
        // 行为树行军路径：LegionRoadMarch 会设 army.setTargetCity()，不在 pendingSieges 中
        // 仅计算真正迫近的威胁（≤ BATTLE_JOIN_RADIUS），避免远在千里外的行军触发送头
        const city = this.cityManager.getCity(cityId);
        if (city) {
            const cityPos = cityToLatLng(city);
            const threatR = GameConfig.COMBAT.BATTLE_JOIN_RADIUS;
            for (const army of this.legionManager.getArmies()) {
                if (army.isDestroyed) continue;
                if (army.getTargetCity()?.id !== cityId) continue;
                const dist = getEuclideanDistance(army.getPosition(), cityPos);
                if (dist <= threatR) return true;
            }
        }
        return false;
    }

    /** 军团是否在第三方攻城排队中（等候当前战场结束） */
    public isArmyWaitingSiege(armyId: string): boolean {
        for (const queue of this.siegeThirdPartyWaiters.values()) {
            if (queue.some((e) => e.army.id === armyId)) return true;
        }
        return false;
    }

    /**
     * 将军团移出第三方攻城排队（如出发点失守须改走收复）。
     * 调用 onSiegeComplete 以免攻城事件队列卡死。
     */
    public dequeueArmyFromThirdPartyWaiters(armyId: string): boolean {
        for (const [cityId, queue] of this.siegeThirdPartyWaiters.entries()) {
            const idx = queue.findIndex((e) => e.army.id === armyId);
            if (idx === -1) continue;

            const entry = queue[idx];
            if (!entry.army.isDestroyed) {
                entry.army.setCombatState(false);
                entry.army.ignoreCityCollision = false;
                entry.army.ignoreUnitCollision = false;
            }
            entry.onSiegeComplete?.();
            queue.splice(idx, 1);
            if (queue.length === 0) {
                this.siegeThirdPartyWaiters.delete(cityId);
            } else {
                this.siegeThirdPartyWaiters.set(cityId, queue);
            }
            const city = this.cityManager.getCity(cityId);
            if (city) this.repositionThirdPartyWaiters(cityId, cityToLatLng(city));
            siegeLog(`↩️ [SiegeManager] ${entry.army.name ?? armyId} 离开第三方排队（${cityId}）`);
            return true;
        }
        return false;
    }

    constructor(
        cityManager: CityManager,
        legionManager: LegionManager,
        combatSystem: CombatSystem,
        map: GameMap,
        visualizer: EventVisualizer,
        onLegionUpdate?: (name: string, troops: number) => void
    ) {
        this.cityManager = cityManager;
        this.legionManager = legionManager;
        this.combatSystem = combatSystem;
        this.map = map;
        this.visualizer = visualizer;
        this.onLegionUpdate = onLegionUpdate;

        BattleField.setSiegeVisualStopHandler((cityId, immediate) => {
            this.cityManager.stopSiegeEffect(cityId, immediate);
        });
    }

    /**
     * [NEW] 直接使用指定军团开始攻城战（用于野战后链式攻城）
     * 跳过 findCandidate 逻辑，直接触发战斗
     */
    public startSiegeWithArmy(army: Army, siegeData: SiegeData, onSiegeComplete?: () => void): void {
        if (army.isDestroyed || army.getTroops() <= 0) {
            console.warn(
                `[SiegeManager] Skip startSiegeWithArmy for invalid army ${army.name}: ` +
                `destroyed=${army.isDestroyed}, troops=${army.getTroops()}`
            );
            onSiegeComplete?.();
            return;
        }
        const targetCity = this.cityManager.getCity(siegeData.defenderCityId);
        if (!targetCity) {
            console.warn(`[SiegeManager] Target city ${siegeData.defenderCityId} not found.`);
            onSiegeComplete?.();
            return;
        }

        siegeLog(`[SiegeManager] Starting siege with army ${army.name} against ${targetCity.name}`);

        // 触发防御增援
        this.triggerDefensiveReinforcements(targetCity);

        // 直接开始攻城战
        this.onArmyArrive(army, targetCity, siegeData.attackerFactionId, siegeData, onSiegeComplete);
    }

    public handleSiegeEvent(siegeData: SiegeData, onSiegeComplete?: () => void): void {
        siegeLog(`[SiegeManager] Handling Siege Event (with callback):`, siegeData);

        // STABILITY CHECK
        if (!siegeData || !siegeData.defenderCityId || !siegeData.attackerFactionId) {
            console.error(`[SiegeManager] Invalid SiegeData: missing keys. Aborting.`, siegeData);
            onSiegeComplete?.(); // Unblock queue if invalid
            return;
        }

        // 1. Initial State Check (Target City)
        const targetCity = this.cityManager.getCity(siegeData.defenderCityId);
        if (!targetCity) {
            console.warn(`[EVENT DEBUG] Target city ${siegeData.defenderCityId} not found for siege event.`);
            onSiegeComplete?.();
            return;
        }

        siegeLog(`[EVENT DEBUG] Processing Siege: ${siegeData.attackerFactionId} vs ${targetCity.name} (${targetCity.id})`);

        // [NEW] 触发防御增援
        this.triggerDefensiveReinforcements(targetCity);

        // 2. Spawn Defender/City Logic (If needed - usually city exists)
        // [Logic from original: lines 589-606 omitted as 'newCityParams' implies city creation which is rare but supported]
        if (siegeData.newCityParams) {
            // ... if needed, add back city creation logic from CityManager
            // For now assuming city exists or relying on CityManager to handle spawns elsewhere
        }

        // 3. Get Attacker Legion (Find or Spawn)
        let attackerArmy: Army | null = null;

        if (siegeData.legionId) {
            attackerArmy = this.legionManager.getLegionById(siegeData.legionId) || null;
        }

        if (!attackerArmy && siegeData.legionName) {
            // Find Candidate (Name match)
            attackerArmy = this.legionManager.findCandidate(
                this.legionManager.getArmies(),
                siegeData.attackerFactionId,
                { lat: targetCity.latitude, lng: targetCity.longitude },
                siegeData.legionName
            );

            if (!attackerArmy) {
                // Spawn New if not found
                siegeLog(`[SiegeManager] Legion "${siegeData.legionName}" not found on map. Spawning new for event...`);

                // Determine spawn position: 
                // Priority 1: attackerSourceLocation (if specified)
                // Priority 2: attackerCityId (if specified)
                // Priority 3: nearest friendly city to target

                let spawnPos: { lat: number, lng: number } | null = null;
                let spawnCity = null;

                // 1. Direct Coordinates from Event
                if (siegeData.attackerSourceLocation) {
                    spawnPos = siegeData.attackerSourceLocation;
                    siegeLog(`[SiegeManager] Spawning legion at specified coordinates: (${spawnPos.lat}, ${spawnPos.lng})`);
                }

                // 2. City-based Spawn
                if (!spawnPos) {
                    const sourceCityId = siegeData.attackerCityId || siegeData.attackerSourceCityId;
                    if (sourceCityId) {
                        spawnCity = this.cityManager.getCity(sourceCityId);
                        if (spawnCity) {
                            siegeLog(`[SiegeManager] Spawning legion at specified attackerCityId: ${spawnCity.name}`);
                            // [FIX] Spawn directly at city coordinates (road start point)
                            spawnPos = { lat: spawnCity.latitude, lng: spawnCity.longitude };
                            siegeLog(`[SiegeManager] Spawn at city origin: (${spawnPos.lat.toFixed(2)}, ${spawnPos.lng.toFixed(2)})`);
                        } else {
                            console.warn(`[SiegeManager] attackerCityId ${siegeData.attackerCityId} not found, using fallback`);
                        }
                    }

                    if (!spawnCity) {
                        spawnCity = this.cityManager.getNearestCity(
                            siegeData.attackerFactionId,
                            { latitude: targetCity.latitude, longitude: targetCity.longitude }
                        );
                    }

                    if (spawnCity && !spawnPos) {
                        // Fallback: spawn near city (offset towards target)
                        // [FIX] Manual close spawn calculation (avoid huge hex jumps)
                        const start = { lat: spawnCity.latitude, lng: spawnCity.longitude };
                        const angle = Math.atan2(targetCity.latitude - start.lat, targetCity.longitude - start.lng);
                        const spawnDist = 0.04; // ~4-5km
                        spawnPos = {
                            lat: start.lat + Math.sin(angle) * spawnDist,
                            lng: start.lng + Math.cos(angle) * spawnDist
                        };
                        siegeLog(`[SiegeManager] Calculated precise spawn position at (${spawnPos.lat.toFixed(4)}, ${spawnPos.lng.toFixed(4)}) from city ${spawnCity.name}`);
                    }
                }

                // Fallback position if no cities
                if (!spawnPos) {
                    spawnPos = { lat: targetCity.latitude, lng: targetCity.longitude - 0.5 };
                }

                const troops = siegeData.attackerTroops ?? 10000;

                // [UNIT SYSTEM] Resolve Type and General from historical config
                let lType: LegionType = getDefaultLegionTypeForFaction(siegeData.attackerFactionId);
                let gId: string | undefined = undefined;
                const config = HISTORICAL_LEGIONS.find(l => l.name === siegeData.legionName);
                if (config) {
                    if (config.type) lType = config.type as LegionType;
                    if (config.generalId) gId = config.generalId;
                }

                attackerArmy = this.legionManager.createLegion(
                    spawnPos,
                    troops,
                    siegeData.attackerFactionId,
                    siegeData.legionName,
                    (arrived) => this.onArmyArrive(arrived, targetCity, siegeData.attackerFactionId, siegeData, onSiegeComplete),
                    lType,
                    spawnCity ? spawnCity.id : undefined,
                    gId // [FIX] Properly pass generalId
                );
                if (attackerArmy) {
                    this.legionManager.addArmy(attackerArmy);
                }
            }
        }

        if (!attackerArmy) {
            console.error(`[SiegeManager] ❌ Event Error: No legionId or legionName specified for siege. Aborting.`);
            alert(`[SiegeManager] Error: Event missing legion information. Check script/event data.`);
            onSiegeComplete?.();
            return;
        }

        siegeLog(`[SiegeManager] Commanding existing legion: ${attackerArmy.name} (${attackerArmy.id})`);

        // [FIX] 事件链接管已有军团：清残留战斗/驻留，统一势力 id，避免「找到了但不走」
        attackerArmy.clearPostBattleRest();
        attackerArmy.clearExternalCombatState();
        attackerArmy.clearBlocked();
        if (attackerArmy.getFactionId() !== siegeData.attackerFactionId) {
            siegeLog(
                `[SiegeManager] Normalizing legion faction ${attackerArmy.getFactionId()} → ${siegeData.attackerFactionId}`
            );
            attackerArmy.setFactionId(siegeData.attackerFactionId);
        }

        if (siegeData.attackerTroops != null && attackerArmy.getTroops() !== siegeData.attackerTroops) {
            attackerArmy.setTroops(siegeData.attackerTroops);
        }

        // [FIX] Update existing army properties for the historical event
        const config = HISTORICAL_LEGIONS.find(l => l.name === siegeData.legionName);
        if (config) {
            if (config.type) attackerArmy.legionType = config.type as LegionType;
            if (config.generalId) (attackerArmy as any).generalId = config.generalId;
        }

        // 4. Command Legion
        // Ensure faction matches (integrity check)
        if (attackerArmy.factionId !== siegeData.attackerFactionId) {
            console.warn(`[SiegeManager] Warning: Legion faction (${attackerArmy.factionId}) != Event faction (${siegeData.attackerFactionId})`);
        }

        // Setup Callback (Overwrite previous callbacks if any, as this event takes control)
        // [FIX] 事件完成只绑定最终目标城之战：途中 hop 城之战不触发 onSiegeComplete，
        // 否则事件提前完成、下一年事件会把军团调走，最终目标永远打不下来
        attackerArmy.siegeMissionComplete = onSiegeComplete ?? null;
        attackerArmy.setOnArriveCallback((arrivedArmy: Army) => {
            const hopTarget = arrivedArmy.getTargetCity() || targetCity;
            const done = hopTarget.id === targetCity.id
                ? this.consumeMissionComplete(arrivedArmy)
                : undefined;
            this.onArmyArrive(arrivedArmy, hopTarget, siegeData.attackerFactionId, siegeData, done);
        });
        attackerArmy.siegeMissionData = siegeData;

        // [VISUAL] Ensure army is visible during march (re-set if reused)
        attackerArmy.setVisible(true);

        // [UNIFIED PHYSICS]
        // Remove artificial pacing. Speed is constant (1.0) unless strictly overridden by event data.

        if (siegeData.speedMultiplier !== undefined && siegeData.speedMultiplier > 0) {
            // === MANUAL MODE ===
            siegeLog(`⏱️ [Manual-Pacing] Using preset speedMultiplier: ${siegeData.speedMultiplier}x`);
            attackerArmy.setSpeedMultiplier(siegeData.speedMultiplier);
        } else {
            // === STANDARD MODE ===
            // Use standard speed. No artificial slowdowns or speedups.
            attackerArmy.setSpeedMultiplier(1.0);
            siegeLog(`⏱️ [Unified-Pacing] Using standard speed (1.0x)`);
        }

        // Ensure customDuration is handled correctly
        // If undefined in siegeData, BattleField will auto-calculate based on troops.
        if (siegeData.customDuration) {
            siegeLog(`⏱️ [Siege] Using Event Custom Duration: ${siegeData.customDuration}s`);
        }


        // [Unified Physics] Distance-based Siege Trigger (No Hex Grid)
        const cityPos = { lat: targetCity.latitude, lng: targetCity.longitude };
        const armyPos = attackerArmy.getPosition();
        const distToCity = getEuclideanDistance(armyPos, cityPos);
        const SIEGE_TRIGGER_DISTANCE = GameConfig.SIEGE.COMBAT_RADIUS; // [Unified Constant]

        // [FIX] 军团脚下据点仍为敌方（前序事件被跳过/旧档归属残留）：
        // 先就地夺取脚下城，打完再重新执行本事件，否则行军被 ZOC 卡死、事件队列永久阻塞
        const standingHostile = this.legionManager.findHostileCityNear(
            armyPos,
            siegeData.attackerFactionId,
            attackerArmy,
        );
        if (standingHostile && standingHostile.id !== targetCity.id) {
            console.warn(
                `[SiegeManager] ${attackerArmy.name} 出发城【${standingHostile.name}】仍属 ${standingHostile.factionId}，先就地夺城再进军 ${targetCity.name}`
            );
            const preSiege = {
                ...siegeData,
                defenderCityId: standingHostile.id,
                result: 'attacker_win',
                afterBattleChain: undefined,
                afterBattle: undefined,
            } as SiegeData;
            // 战后由 resolveChain 的「任务目标未达 → 继续推进」接管，最终目标之战才触发事件完成
            this.startSiegeWithArmy(attackerArmy, preSiege);
            return;
        }

        if (distToCity <= SIEGE_TRIGGER_DISTANCE) {
            // 已在攻击范围内 — 直接开始战斗
            siegeLog(`🏯 [SiegeManager] ${attackerArmy.name} within siege range of ${targetCity.name}, starting combat.`);
            this.onArmyArrive(attackerArmy, targetCity, siegeData.attackerFactionId, siegeData, this.consumeMissionComplete(attackerArmy));
        } else {
            // 需要行军 — 标记为 pending
            this.pendingSieges.add(attackerArmy.id);
            let success = this.legionManager.moveLegionToCity(
                attackerArmy,
                targetCity.id,
                siegeData.attackerCityId
            );
            if (!success) {
                siegeLog(
                    `[SiegeManager] Retry march to ${targetCity.name} without attackerCityId anchor`
                );
                success = this.legionManager.moveLegionToCity(attackerArmy, targetCity.id);
            }
            if (!success) {
                console.warn(`[SiegeManager] ${attackerArmy.name} failed to find ROAD to ${targetCity.name}. Unit stopped.`);
                attackerArmy.stopMovement();
                this.pendingSieges.delete(attackerArmy.id);
                this.consumeMissionComplete(attackerArmy)?.();
            }
        }



        // [DISABLED] Auto-join - Player no longer auto-follows events
        // this.checkPlayerParticipation(
        //     siegeData.attackerFactionId,
        //     targetCity.factionId,
        //     { lat: targetCity.latitude, lng: targetCity.longitude },
        //     { lat: targetCity.latitude, lng: targetCity.longitude }
        // );
    }

    private moveArmyToTarget(army: Army, targetCity: any): boolean {
        const success = this.legionManager.moveLegionToCity(army, targetCity.id);
        if (!success) {
            console.warn(`[SiegeManager] ${army.name} failed to find ROAD to ${targetCity.name}. Unit stopped.`);
            army.stopMovement();
        }
        return success;
    }

    /** 攻城触发时，自动卷入附近同阵营友军（只做两边，不做第三方混战）。
     * @param allowPassingBy 守方设 true：同旗军团即使是路过/奔他城也强制参战。攻方通常 false。 */
    private collectNearbyLegionsForFaction(
        center: { lat: number; lng: number },
        factionId: string,
        excludeArmyIds: Set<string>,
        /** 开战城 id：仅拉闲置或目标就是本城的军团，勿拉路过奔他城者 */
        siegeCityId?: string,
        allowPassingBy?: boolean,
    ): Army[] {
        const allArmies = this.legionManager.getArmies();
        const candidates = allArmies.filter((legion) => {
            if (legion.getFactionId() !== factionId) return false;
            if (excludeArmyIds.has(legion.id)) {
                siegeLog(`🔍 [SiegeManager] ${legion.name} 排除: 在 exclude 列表中`);
                return false;
            }
            if (legion.type !== 'legion' || legion.isDestroyed) {
                siegeLog(`🔍 [SiegeManager] ${legion.name} 排除: type=${legion.type}, isDestroyed=${legion.isDestroyed}`);
                return false;
            }
            if (legion.getIsInCombat()) {
                siegeLog(`🔍 [SiegeManager] ${legion.name} 排除: 已经在战斗中`);
                return false;
            }

            const dist = getEuclideanDistance(legion.getPosition(), center);
            if (dist > SiegeManager.JOIN_RADIUS) {
                siegeLog(`🔍 [SiegeManager] ${legion.name} 排除: 距离过远 (${dist.toFixed(3)} > ${SiegeManager.JOIN_RADIUS})`);
                return false;
            }

            // 路过/奔他城：守方 allowPassingBy=true 时同旗不论目标强制参战
            if (siegeCityId && !allowPassingBy) {
                const targetId = legion.getTargetCity?.()?.id;
                const idle = legion.isIdle();
                const isHomeLegion = legion.homeCityId === siegeCityId;
                if (!idle && targetId && targetId !== siegeCityId && !isHomeLegion) {
                    siegeLog(`🔍 [SiegeManager] ${legion.name} 排除: 路过/奔他城（目标≠本城）`);
                    return false;
                }
                if (!idle && !targetId && !isHomeLegion) {
                    // 有路径但无城目标（如追击敌军）：也不强拉协战
                    siegeLog(`🔍 [SiegeManager] ${legion.name} 排除: 行军中且无本城目标`);
                    return false;
                }
            }

            siegeLog(`✅ [SiegeManager] ${legion.name} 符合支援条件! 距离: ${dist.toFixed(3)}`);
            return true;
        });

        candidates.sort(
            (a, b) => (b.getTroops() || 0) - (a.getTroops() || 0)
        );
        return candidates;
    }

    /** 守城参战军团：同旗路过也强制参战（BATTLE_JOIN_RADIUS 内） */
    private collectDefenderLegionsForSiege(
        targetCity: { id: string; factionId: string; latitude: number; longitude: number },
        cityPos: { lat: number; lng: number },
        excludeArmyIds: Set<string>,
    ): Army[] {
        return this.collectNearbyLegionsForFaction(
            cityPos,
            targetCity.factionId,
            excludeArmyIds,
            targetCity.id,
            true, // 守方：同旗路过也强制参战
        );
    }

    private onArmyArrive(
        army: Army,
        targetCity: any,
        attackerFactionId: string,
        siegeData: SiegeData,
        onSiegeComplete?: () => void // [NEW] Callback
    ): void {
        if (army.isDestroyed || army.getTroops() <= 0) {
            console.warn(
                `[SiegeManager] onArmyArrive ignored invalid army ${army.name}: ` +
                `destroyed=${army.isDestroyed}, troops=${army.getTroops()}`
            );
            this.pendingSieges.delete(army.id);
            onSiegeComplete?.();
            return;
        }
        // [新增] 移除 pending 追踪（军团已抵达）
        this.pendingSieges.delete(army.id);
        siegeLog(`🏯 [SiegeManager] 军团 ${army.name} 抵达，pending sieges 剩余: ${this.pendingSieges.size}`);

        // [FIX] Always use the latest city data from CityManager to avoid stale closure objects
        targetCity = this.cityManager.getCity(targetCity.id);
        if (!targetCity) {
            console.warn(`[SiegeManager] Target city not found in onArmyArrive. Aborting.`);
            army.setCombatState(false); // [FIX] Prevent deadlock
            onSiegeComplete?.(); // Unblock queue if aborted
            return;
        }

        // [FIX] Guard against friendly fire if city was already taken
        if (targetCity.factionId === army.getFactionId()) {
            siegeLog(`[SiegeManager] ${army.name || army.id} arrived at friendly city ${targetCity.name}. Aborting siege.`);
            army.setTargetCity(null);
            army.setCombatState(false); // [FIX] Ensure visual state is cleared
            army.ignoreCityCollision = false; // [FIX] Reset collision flags
            army.ignoreUnitCollision = false;

            this.resolveChain(siegeData, targetCity, army);
            onSiegeComplete?.();
            return;
        }

        // [FIX] 检查该城市是否已经在战斗中
        const activeBattle = this.activeSieges.get(targetCity.id);
        if (activeBattle && !activeBattle.isOver) {
            const myFaction = army.getFactionId();
            const attackerFaction = activeBattle.getAttackerFactionId();
            const defenderFaction = activeBattle.getDefenderFactionId();

            if (myFaction === attackerFaction || myFaction === defenderFaction) {
                const cityPos = cityToLatLng(targetCity);
                const isAttacker = myFaction === attackerFaction;
                if (tryJoinLegionToBattle(activeBattle, army, isAttacker, cityPos, this.getReinforcementJoinDeps())) {
                    siegeLog(`📯 [SiegeManager] ${army.name} 中途加入【${targetCity.name}】攻城战`);
                    onSiegeComplete?.();
                    return;
                }
                siegeLog(
                    `⏭️ [SiegeManager] ${army.name} 无法加入本场（圈外或已在战）: ${targetCity.name}`
                );
                army.setCombatState(false);
                army.setTargetCity(null);
                onSiegeComplete?.();
                return;
            }

            // 第三方：不混入当前战场，排队等上一场打完
            siegeLog(`⏳ [SiegeManager] ${army.name} (${myFaction}) 等候 ${targetCity.name} 战场决出胜负 (当前 ${attackerFaction} vs ${defenderFaction})`);
            army.stopMovement(true);
            army.setTargetCity(null);
            army.setCombatState(false);
            this.enqueueSiegeThirdPartyWaiter(targetCity.id, army, siegeData, onSiegeComplete);
            this.repositionThirdPartyWaiters(targetCity.id, cityToLatLng(targetCity));
            return;
        }

        siegeLog(`[SiegeManager] Army arrived at ${targetCity.name}, starting battle...`);

        // [新增] 触发关隘攻打军情
        if (targetCity.type === 'pass') {
            window.game?.brawlFeedPanel?.pushPassSiege({
                attackerFactionId: army.getFactionId(),
                legionName: army.name,
                cityId: targetCity.id,
                cityName: targetCity.name
            });
        }

        const cityPos = cityToLatLng(targetCity);

        const excludedIds = new Set<string>([army.id]);

        const nearbyDefenderLegions = this.collectDefenderLegionsForSiege(
            targetCity,
            cityPos,
            excludedIds
        );
        nearbyDefenderLegions.forEach((legion) => excludedIds.add(legion.id));

        // 攻方：主攻军团 + 附近援军（仅闲置/目标本城；路过不拉）
        const nearbyAttackerLegions = this.collectNearbyLegionsForFaction(
            cityPos,
            army.getFactionId(),
            excludedIds,
            targetCity.id,
        );

        // ── 纵横技（必须在守城加成 applySiegeGarrisonBoostIfNeeded 前执行，确保 spawnUsed 优先消耗）──

        // 翦除羽翼：攻城前按 magnitude 概率消耗守城将/精出场配额（原100%必触发过强：守方次次无将无精）
        if (generalHasStrategicEffect(army, 'sabotage_garrison')) {
            const chance = getGeneralStrategicMagnitude(army, 'sabotage_garrison', 0.25);
            if (Math.random() < chance) {
                targetCity.spawnGeneralUsed = true;
                targetCity.spawnEliteUsed = true;
                army.markPendingPostBattleDiplomacyFx('sabotage_garrison');
                siegeLog(`[纵横] 翦除羽翼触发：【${targetCity.name}】将/精出场配额已消耗`);
            }
        }

        // 调虎离山：攻城前守城将/精组建军团出征（仅有将/精才出兵）
        if (generalHasStrategicEffect(army, 'lure_tiger_leave_mountain')) {
            army.markPendingPostBattleDiplomacyFx('lure_tiger_leave_mountain');
            const canGen = !targetCity.spawnGeneralUsed;
            const canEli = !targetCity.spawnEliteUsed;
            if (canGen || canEli) {
                const baseArmySize = Math.floor((targetCity.troops || 0) * 0.9);
                const recruitMult = getCityAnchoredStrategicMagnitude(targetCity.id, 'recruit_troops_mult');
                const armySize = Math.floor(baseArmySize * (recruitMult > 1 ? recruitMult : 1));
                const minTroops = (GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS as any)[targetCity.type] ?? 20000;
                if (armySize >= minTroops) {
                    const lured = this.legionManager.createArmy({
                        name: `${targetCity.name}军团`,
                        factionId: targetCity.factionId || 'panjun',
                        position: { lat: targetCity.latitude, lng: targetCity.longitude },
                        troops: armySize,
                        sourceCityId: targetCity.id,
                    });
                    if (lured) {
                        applyLegionSpawnTierToArmy(lured, targetCity);
                        targetCity.troops = (targetCity.troops || 0) - lured.getTroops();
                        siegeLog(`[纵横] 调虎离山：【${targetCity.name}】将/精出征，${targetCity.troops} 城防留守`);
                    }
                }
            }
        }

        // 坐收渔翁：攻城前调用己方附近据点出兵助攻
        if (generalHasStrategicEffect(army, 'third_party_siege')) {
            army.markPendingPostBattleDiplomacyFx('third_party_siege');
            const myFaction = army.getFactionId();
            const myPos = army.getPosition();
            const targetPos = { lat: targetCity.latitude, lng: targetCity.longitude };
            const myDistToTarget = getEuclideanDistance(myPos, targetPos);
            const maxAllies = getGeneralStrategicMagnitude(army, 'third_party_siege', 3);

            const activeLegionCityIds = new Set(
                this.legionManager.getArmies()
                    .filter(a => !a.isDestroyed && a.type === 'legion')
                    .map(a => a.getSourceCityId() || a.homeCityId)
                    .filter(Boolean)
            );

            const candidates = this.cityManager.getCities()
                .filter(c => c.id !== targetCity.id && c.factionId && c.factionId !== 'panjun')
                .filter(c => c.factionId === myFaction)
                .filter(c => !activeLegionCityIds.has(c.id))
                .map(c => ({
                    city: c,
                    dist: getEuclideanDistance({ lat: c.latitude, lng: c.longitude }, targetPos),
                }))
                .filter(x => x.dist < myDistToTarget)
                .filter(x => Math.floor((x.city.troops || 0) * 0.9) >=
                    ((GameConfig.LEGION.CITY_MIN_SPAWN_TROOPS as any)[x.city.type] ?? 20000))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, maxAllies);

            for (const { city, dist } of candidates) {
                const baseAllySize = Math.floor((city.troops || 0) * 0.9);
                const allyRecruitMult = getCityAnchoredStrategicMagnitude(city.id, 'recruit_troops_mult');
                const allySize = Math.floor(baseAllySize * (allyRecruitMult > 1 ? allyRecruitMult : 1));
                const ally = this.legionManager.createArmy({
                    name: `${city.name}军团`,
                    factionId: city.factionId!,
                    position: { lat: city.latitude, lng: city.longitude },
                    troops: allySize,
                    sourceCityId: city.id,
                });
                if (ally) {
                    applyLegionSpawnTierToArmy(ally, city);
                    city.troops = (city.troops || 0) - ally.getTroops();
                    this.legionManager.moveLegionToCity(ally, targetCity.id);
                    siegeLog(`[纵横] 坐收渔翁：【${city.name}】出兵助攻【${targetCity.name}】（距${targetCity.name} ${dist.toFixed(0)}°<攻方${myDistToTarget.toFixed(0)}°）`);
                }
            }
        }

        // 守城城防加成：传入攻方军团列表，防止攻守双方出现同一武将
        applySiegeGarrisonBoostIfNeeded(
            targetCity as typeof targetCity & SiegeGarrisonBoostFields,
            nearbyDefenderLegions,
            [army, ...nearbyAttackerLegions],  // 攻方全体，含主攻军团
        );

        // 开战前：停步存档 + 统一面朝据点（绝不 setPosition）
        army.stopMovement(true);
        for (const legion of [...nearbyAttackerLegions, ...nearbyDefenderLegions]) {
            legion.stopMovement(true);
        }
        repositionAllLegionsNearSiegeCity(cityPos, this.legionManager.getArmies(), {
            cityId: targetCity.id,
            forceArmies: [army, ...nearbyAttackerLegions, ...nearbyDefenderLegions],
            isWaitingSiege: (id) => this.isArmyWaitingSiege(id),
        });
        siegeLog(`🛤️ [Sandbox Siege] ${army.name} 城周就位（无传送）后开战`);

        const siegePreset = siegeData.result;

        // Adapters
        const attackerAdapter = BattleUnitFactory.createAdapter(
            army.id,
            army.name || '攻城军团',
            army.getFactionId(),
            army,
            'legion', // [CHANGED] 明确指定单位类型
            army.getTroops(),
            () => { // Victory
                siegeLog(`[Siege] Attacker Victory!`);

                // [NEW] Report Surviving Troops
                if (this.onLegionUpdate && army.name) {
                    this.onLegionUpdate(army.name, army.getTroops());
                }

                // [FIX] 统一 capture 逻辑：检查是否需要更新城市
                const latestCity = this.cityManager.getCity(targetCity.id);
                if (latestCity && latestCity.factionId !== army.getFactionId()) {
                    siegeLog(`🏯 [Siege] City Conquered by ${army.name}: ${targetCity.name}`);
                    // 守方这一仗是否出了将/精：看实际参战守方单位（城驻军 + 参战守军军团）。
                    // 全空 = 无名据点（守将/精锐或随军出征、或本就未出场）→ 播报简化为「势力攻占据点」。
                    const defenderHadNamedForce = defenderUnits.some(
                        (u) => !!u.generalId || getUnitEliteTier(u) !== null
                    );
                    // [语音播报·攻占] 势=攻守初始兵力比（与 announceSiegeStart 同算法）
                    const capAttackerUnit = attackerUnits.find((u) => u.generalId === army.generalId)
                        ?? attackerUnits.find((u) => !!u.battleOverriddenSkillId) ?? null;
                    const capAttackerSkillId = capAttackerUnit?.battleOverriddenSkillId ?? undefined;
                    const capDefenderGeneralId = defenderUnits.find((u) => !!u.generalId)?.generalId ?? undefined;
                    const capR = battleField.getInitialAttDefRatio();
                    const capAttackerJu: CaptureJu = capR > 1.5 ? 'advantage' : capR < 0.67 ? 'disadvantage' : 'balance';
                    this.cityManager.updateCity(targetCity.id, {
                        factionId: army.getFactionId(),
                        troops: 1000,
                    }, {
                        captorLegionName: army.name || '军团',
                        captorLegionId: army.id,
                        captorGeneralId: army.generalId,
                        defenderHadNamedForce,
                        attackerSkillId: capAttackerSkillId ?? undefined,
                        attackerJu: capAttackerJu,
                        defenderGeneralId: capDefenderGeneralId,
                    });

                    // [FIX] CityManager 的 updateCity 内部会触发 onCityUpdated 回调，自动调用 legionManager.refreshCityRegistry()
                    // 这里删除了重复调用，避免同一帧内对 607 个城市执行两次 O(N) 的物理引擎重建，解决 31ms 的性能毛刺

                    this.activeSieges.delete(targetCity.id);


                }

                siegeLog(`[Siege] Army ${army.name} has ${army.getTroops()} troops remaining`);

                // 战斗姿态已在 onBattleEnd 中解除并开启战胜驻留；此处只清视觉/碰撞
                army.clearExternalCombatState();
                army.setVisible(true);
                army.setSpeedMultiplier(1.0);

                army.ignoreCityCollision = false;
                army.ignoreUnitCollision = false;

                // 延迟执行战后逻辑（留1秒给视觉展示）
                setTimeout(() => {
                    this.resolveChain(siegeData, latestCity || targetCity, army);
                }, 1000);
            },
            () => { // Defeat
                siegeLog(`[Siege] Attacker Defeat!`);
                this.activeSieges.delete(targetCity.id);
                // [语音播报] 跟随军团攻城失败（守方有将才播）；专句真播出时才标记 siege_attacker 抑制通用覆没语音，
                // 否则（守方无将/未跟随）保持默认 'siege'，覆没语音照常兜底，避免跟随军团无声覆没。
                const followedIdFail = window.game?.cameraFollowUI?.getFollowedArmyId?.();
                const failDefGeneralId = defenderUnits.find((u) => !!u.generalId)?.generalId ?? null;
                const failSpeechTaken = followedIdFail === army.id && !!failDefGeneralId;
                if (failSpeechTaken) {
                    const failAtkUnit = attackerUnits.find((u) => u.generalId === army.generalId)
                        ?? attackerUnits.find((u) => !!u.battleOverriddenSkillId) ?? null;
                    const failR = battleField.getInitialAttDefRatio();
                    const failJu: CaptureJu = failR > 1.5 ? 'advantage' : failR < 0.67 ? 'disadvantage' : 'balance';
                    speechAnnouncer.announceSiegeFailure({
                        attackerFactionId: army.getFactionId(),
                        ju: failJu,
                        attackerSkillId: failAtkUnit?.battleOverriddenSkillId ?? null,
                        cityName: targetCity.name,
                        defenderGeneralId: failDefGeneralId,
                    });
                }
                markLegionAnnihilationFeed(army, 'attacker', targetCity.name, failSpeechTaken ? 'siege_attacker' : 'siege');
                army.expeditionTargetCityId = null;
                army.destroy();
            }
        );

        const defenderAdapter = BattleUnitFactory.createAdapter(
            targetCity.id,
            `${targetCity.name}${targetCity.type === 'pass' ? '守军' : '驻军'}`,
            targetCity.factionId,
            targetCity,
            'city', // [CHANGED] 明确指定单位类型
            targetCity.troops,
            () => { // Victory (Defender Win)
                siegeLog(`[Siege] Defender Victory!`);
                this.activeSieges.delete(targetCity.id);
            },
            () => { // Defeat (Defender Lose -> City Conquered)
                siegeLog(`[Siege] Defender Defeat!`);
            },
            undefined,
            // Update city label when troops change
            (newTroops: number) => {
                this.cityManager.updateCityLabel(targetCity.id);
            }
        );

        // [EFFECT] 守军从据点向进攻军团射箭（须在 battleField 创建并挂回调之后启动，避免异常泄漏）
        // Army stays visible during siege
        // 主攻军团：siege 姿态 + 攻城目标（自身发箭前提），并标记带器械（投石机石弹发射条件）
        army.isSiegeAttacker = true;
        army.setCombatState(true, 'siege', cityPos);
        // Use adapters directly - no player participation
        const finalAttacker: IBattleUnit = attackerAdapter;
        const finalDefender: IBattleUnit = defenderAdapter;

        const attackerUnits: IBattleUnit[] = [finalAttacker];
        const defenderUnits: IBattleUnit[] = [finalDefender];

        if (nearbyDefenderLegions.length > 0 || nearbyAttackerLegions.length > 0) {
            siegeLog(
                `⚔️ [Siege] 区域协同参战：攻方+${nearbyAttackerLegions.length} / 守方+${nearbyDefenderLegions.length}`
            );
        }

        nearbyDefenderLegions.forEach((legion) => {
            // 开战前已统一 stopMovement(true)；此处勿二次 stop 以免空队列覆写存档意图
            legion.setCombatState(true, 'siege', cityPos);
            legion.isSiegeAttacker = false; // 守方无器械
            const legionAdapter = BattleUnitFactory.createAdapter(
                legion.id,
                legion.name || '守军',
                legion.getFactionId(),
                legion,
                'legion',
                legion.getTroops(),
                () => { siegeLog(`[Siege] Defender Legion ${legion.name} Victory`); },
                () => {
                    markLegionAnnihilationFeed(legion, 'defender', targetCity.name, 'siege', legionAdapter.battleOverriddenSkillId);
                    legion.destroy();
                    this.legionManager.removeArmy(legion);
                }
            );
            defenderUnits.push(legionAdapter);
        });

        nearbyAttackerLegions.forEach((legion) => {
            // 开战前已统一 stopMovement(true)
            legion.setCombatState(true, 'siege', cityPos);
            legion.isSiegeAttacker = true; // 攻方带器械
            const legionAdapter = BattleUnitFactory.createAdapter(
                legion.id,
                legion.name || '攻军',
                legion.getFactionId(),
                legion,
                'legion',
                legion.getTroops(),
                () => { siegeLog(`[Siege] Attacker Legion ${legion.name} Victory`); },
                () => {
                    markLegionAnnihilationFeed(legion, 'attacker', targetCity.name, 'siege', legionAdapter.battleOverriddenSkillId);
                    legion.destroy();
                    this.legionManager.removeArmy(legion);
                }
            );
            attackerUnits.push(legionAdapter);
        });

        const finalTitle = siegeData.title || `${targetCity.name} 攻防战`;

        // ── 威慑·先声夺人：战前削守方城防（仅据点，不动附近援军）──
        if (generalHasStrategicEffect(army, 'pre_battle_intimidate')) {
            const pct = getGeneralStrategicMagnitude(army, 'pre_battle_intimidate', 0.10);
            const before = finalDefender.troops;
            const after = Math.max(1, Math.floor(before * (1 - pct)));
            finalDefender.setTroops(after);
            siegeLog(`[威慑] 先声夺人：${finalDefender.name} ${before} → ${after} (-${Math.round(pct * 100)}%)`);
            const pos = army.getPosition();
            emitFollowedGeneralStrategicMapFx(army, 'pre_battle_intimidate', pos.lat, pos.lng, 'pulse');
        }

        // ── 威慑·不战而屈：兵力优势时概率跳过战斗直接占城 ──
        if (generalHasStrategicEffect(army, 'intimidate_instant_win')) {
            const myTroops = army.getTroops();
            const enemyTroops = targetCity.troops;
            if (myTroops > enemyTroops) {
                const chance = getGeneralStrategicMagnitude(army, 'intimidate_instant_win', 0.01);
                if (Math.random() < chance) {
                    siegeLog(`[威慑] 不战而屈触发！${army.name} 不战而胜，占【${targetCity.name}】`);
                    const pos = army.getPosition();
                    emitFollowedGeneralStrategicMapFx(army, 'intimidate_instant_win', pos.lat, pos.lng, 'pulse');

                    // 清协同军团战斗态（已调过 setCombatState(true) 的附近攻守军团）
                    nearbyDefenderLegions.forEach((l) => l.clearExternalCombatState());
                    nearbyAttackerLegions.forEach((l) => l.clearExternalCombatState());
                    army.setCombatState(false);

                    // 守方这一仗是否出了将/精（对齐正常胜后军情口径）
                    const defenderHadNamedForce = defenderUnits.some(
                        (u) => !!u.generalId || getUnitEliteTier(u) !== null
                    );
                    this.cityManager.updateCity(targetCity.id, {
                        factionId: army.getFactionId(),
                        troops: 1000,
                    }, {
                        captorLegionName: army.name || '军团',
                        captorLegionId: army.id,
                        captorGeneralId: army.generalId,
                        defenderHadNamedForce,
                    });
                    this.activeSieges.delete(targetCity.id);
                    army.clearExternalCombatState();
                    army.setVisible(true);
                    army.setSpeedMultiplier(1.0);
                    army.ignoreCityCollision = false;
                    army.ignoreUnitCollision = false;

                    this.resolveChain(siegeData, targetCity, army);
                    onSiegeComplete?.();
                    // [修复 2026-07-17] 与正常胜利路径(onBattleComplete)对齐：处理排队等候的第三方军团。
                    // 此前漏调 → 排队者永远留在 siegeThirdPartyWaiters，被 BT 的 IsWaitingSiege 冻结原地（弋阳英布卡死事故）
                    this.processSiegeThirdPartyWaiters(targetCity.id, army.getFactionId());
                    return;
                }
            }
        }

        let battleField: BattleField;
        try {
            battleField = this.combatSystem.startRegionalBattle(
                army.getFactionId(),
                attackerUnits,
                targetCity.factionId,
                defenderUnits,
                siegePreset,
                siegeData.customDuration, // [NEW] 传递导演指定时长
                siegeData.attackerPortrait, // [NEW] 传递攻击方立绘
                siegeData.defenderPortrait, // [NEW] 传递防守方立绘
                finalTitle, // [NEW] 传递战斗标题
                siegeData.description // [NEW] 传递历史描述
            );
        } catch (err) {
            console.error('[SiegeManager] startRegionalBattle failed:', err);
            army.setCombatState(false);
            onSiegeComplete?.();
            throw err;
        }

        // [语音播报] 跟随军团攻城：开战后一刻触发，势=攻守初始兵力比（与 BattleField assignSituationalSkills 同公式）。
        // 城池「兵临」、关隘「攻打」；守方有将续「势前缀…赵国[名将]武将，守方八字」，无将只一句。
        const followedIdForSpeech = window.game?.cameraFollowUI?.getFollowedArmyId?.();
        // [修复 2026-07-17] r 原在 if 块内声明，下方援军播报循环（块外）引用会 ReferenceError 崩溃——提升到共用作用域
        const r = battleField.getInitialAttDefRatio(); // attacker / defender
        if (followedIdForSpeech === army.id) {
            const siegeAtkUnit = attackerUnits.find((u) => u.generalId === army.generalId)
                ?? attackerUnits.find((u) => !!u.battleOverriddenSkillId) ?? null;
            const siegeDefGeneralId = defenderUnits.find((u) => !!u.generalId)?.generalId ?? null;
            const attJu: CaptureJu = r > 1.5 ? 'advantage' : r < 0.67 ? 'disadvantage' : 'balance';
            speechAnnouncer.announceSiegeStart({
                attackerFactionId: army.getFactionId(),
                attackerGeneralId: army.generalId,
                ju: attJu,
                attackerSkillId: siegeAtkUnit?.battleOverriddenSkillId ?? null,
                cityName: targetCity.name,
                isPass: targetCity.type === 'pass',
                defenderFactionId: targetCity.factionId,
                defenderGeneralId: siegeDefGeneralId,
            });
        }

        // [语音播报] 跟随军团作为援军参战（开战时卷入的附近友军）
        for (const legion of [...nearbyDefenderLegions, ...nearbyAttackerLegions]) {
            if (followedIdForSpeech !== legion.id) continue;
            const isAttacker = nearbyAttackerLegions.includes(legion);
            const unit = (isAttacker ? attackerUnits : defenderUnits).find((u) => u.generalId === legion.generalId)
                ?? null;
            const genRec = legion.generalId ? getGeneralRecordByGeneralId(legion.generalId) : null;
            // 援军加入的势：攻方用 attJu，守方用 defJu（取反）
            const reinfR = isAttacker ? r : (1 / Math.max(r, 0.001));
            const reinfJu: CaptureJu = reinfR > 1.5 ? 'advantage' : reinfR < 0.67 ? 'disadvantage' : 'balance';
            speechAnnouncer.announceReinforcementJoin({
                factionId: legion.getFactionId(),
                generalId: legion.generalId ?? null,
                generalName: genRec?.generalName ?? null,
                eliteName: getLegionEliteLegionName(legion),
                side: isAttacker ? 'attacker' : 'defender',
                cityName: targetCity.name,
                ju: reinfJu,
                battleSkillId: unit?.battleOverriddenSkillId ?? null,
            });
        }

        // 战斗结束 = 事件结束（战后动作在后台运行）
        battleField.onBattleComplete = (winnerFactionId) => {
            siegeLog(`✅ [Siege] Battle complete. Winner: ${winnerFactionId}`);
            clearSiegeGarrisonBoost(targetCity as typeof targetCity & SiegeGarrisonBoostFields);
            this.cityManager.stopSiegeEffect(targetCity.id, true);
            this.activeSieges.delete(targetCity.id);
            onSiegeComplete?.();
            this.processSiegeThirdPartyWaiters(targetCity.id, winnerFactionId);
        };

        this.activeSieges.set(targetCity.id, battleField);
        this.cityManager.playSiegeEffect(targetCity.id, () => army.getPosition());
    }

    private enqueueSiegeThirdPartyWaiter(
        cityId: string,
        army: Army,
        siegeData: SiegeData,
        onSiegeComplete?: () => void,
        approaching: boolean = false,
    ): void {
        const queue = this.siegeThirdPartyWaiters.get(cityId) || [];
        if (queue.some((e) => e.army.id === army.id)) return;
        const stopDist = Math.min(
            SiegeManager.WAIT_RING_BASE + queue.length * SiegeManager.WAIT_RING_SPACING,
            SiegeManager.JOIN_RADIUS - 0.02,
        );
        queue.push({ army, siegeData, onSiegeComplete, stopDist, approaching });
        this.siegeThirdPartyWaiters.set(cityId, queue);
        // 已停步入队（非走近途中）→ 跟拍军团播排队旁观
        if (!approaching) this.tryAnnounceQueueWait(army);
    }

    /** 跟拍军团进入排队旁观时播报（原句） */
    private tryAnnounceQueueWait(army: Army): void {
        if (getFollowedArmyId() !== army.id) return;
        const genRec = army.generalId ? getGeneralRecordByGeneralId(army.generalId) : null;
        const eliteName = getLegionEliteLegionName(army);
        if (!genRec || !eliteName) return;
        speechAnnouncer.announceQueueWait({
            generalName: genRec.generalName,
            eliteName,
        });
    }

    /** 每场攻城结束后唤醒一个第三方（FCFS），与胜方再开新战 */
    private processSiegeThirdPartyWaiters(cityId: string, winnerFactionId: string): void {
        const queue = this.siegeThirdPartyWaiters.get(cityId);
        if (!queue || queue.length === 0) return;

        const remaining: typeof queue = [];
        let started = false;

        for (const entry of queue) {
            const { army, siegeData, onSiegeComplete } = entry;
            if (army.isDestroyed) continue;

            const myFaction = army.getFactionId();
            if (myFaction === winnerFactionId) {
                // 己方已胜：出队交还 BT（勿留战斗态；目标由下一帧 FindTarget 重选）
                army.setCombatState(false);
                army.ignoreCityCollision = false;
                army.ignoreUnitCollision = false;
                army.clearBlocked();
                onSiegeComplete?.();
                continue;
            }

            if (army.getIsInCombat()) {
                remaining.push(entry);
                continue;
            }

            if (!started) {
                started = true;
                const city = this.cityManager.getCity(cityId);
                if (!city) {
                    onSiegeComplete?.();
                    continue;
                }
                // 在途走近中、或停在外环离城尚远（>0.2 到达阈值）→ 不在远处原地开战，
                // 沿道路走到城下由 ZOC/到达检测自然触发攻城（出队；绝不传送）。
                // 带事件链回调的等待者不走此分支（重新触发会丢回调），它们本就停在城边。
                const distToCity = getEuclideanDistance(army.getPosition(), cityToLatLng(city));
                if ((entry.approaching || distToCity > 0.2) && !onSiegeComplete) {
                    army.setCombatState(false);
                    if (this.moveArmyToTarget(army, city)) {
                        siegeLog(`⚔️ [SiegeManager] ${army.name} (${myFaction}) 接战胜方 ${winnerFactionId} @ ${city.name}（走到城下开战，距 ${distToCity.toFixed(2)}）`);
                        continue;
                    }
                    // 无路可走 → 回落原地开战
                }
                siegeLog(`⚔️ [SiegeManager] ${army.name} (${myFaction}) 接战胜方 ${winnerFactionId} @ ${city.name}`);
                this.onArmyArrive(army, city, myFaction, siegeData, onSiegeComplete);
            } else {
                remaining.push(entry);
            }
        }

        // 留队的在途者就地停步转正式等待：唤醒者在走向城下、新战斗尚未开打，
        // 此窗口没有 settleApproachingWaiters 轮询，放任行军会一路进 ZOC 抢跑插队
        for (const entry of remaining) {
            if (!entry.approaching || entry.army.isDestroyed || entry.army.getIsInCombat()) continue;
            entry.army.stopMovement(true);
            entry.army.setTargetCity(null);
            entry.army.setCombatState(false);
            entry.approaching = false;
        }

        if (remaining.length > 0) {
            this.siegeThirdPartyWaiters.set(cityId, remaining);
        } else {
            this.siegeThirdPartyWaiters.delete(cityId);
        }
        const city = this.cityManager.getCity(cityId);
        if (city) this.repositionThirdPartyWaiters(cityId, cityToLatLng(city));
    }

    /** AI/碰撞触发的动态攻城：战后交还 AI，不要默认 garrison 锁死 */
    private releaseArmyAfterSiege(army: Army): void {
        army.setTargetCity(null);
        army.setOnArriveCallback(() => { });
        army.ignoreCityCollision = false;
        army.ignoreUnitCollision = false;
        army.siegeMissionData = null;
        army.clearBlocked();
    }

    /** 取走军团身上的事件任务完成回调（一次性），任务被放弃时也必须调用以解锁事件队列 */
    private consumeMissionComplete(army: Army): (() => void) | undefined {
        const cb = army.siegeMissionComplete;
        army.siegeMissionComplete = null;
        return cb ?? undefined;
    }

    /**
     * 统一解析战后行为：destroyAfterBattle > afterBattleChain > afterBattle > 默认驻守
     */
    private resolveChain(siegeData: SiegeData, city: any, army: Army): void {
        if (siegeData.destroyAfterBattle) {
            siegeLog(`[SiegeManager] destroyAfterBattle，解散 ${army.name}`);
            army.destroy();
            this.legionManager.removeArmy(army);
            return;
        }
        // [FIX] 任务目标未达（途中敌城拦截被迫先打 hop 城）：胜利后继续向最终目标推进，
        // 而不是在中途城就地驻守——否则事件链目标城（如 -235 太原）永远打不下来
        const hasExplicitChain = !!(siegeData.afterBattleChain?.length || siegeData.afterBattle);
        const missionTargetId = army.siegeMissionData?.defenderCityId;
        if (!hasExplicitChain && missionTargetId && missionTargetId !== city.id) {
            const missionCity = this.cityManager.getCity(missionTargetId);
            if (missionCity && missionCity.factionId !== army.getFactionId()) {
                siegeLog(
                    `[SiegeManager] ${army.name} 攻克中途城【${city.name}】，继续向任务目标【${missionCity.name}】推进`
                );
                const missionData = { ...army.siegeMissionData } as SiegeData;
                army.setOnArriveCallback((a) => {
                    const hop = a.getTargetCity() || missionCity;
                    const done = hop.id === missionCity.id
                        ? this.consumeMissionComplete(a)
                        : undefined;
                    this.onArmyArrive(a, hop, a.getFactionId(), missionData, done);
                });
                this.pendingSieges.add(army.id);
                if (this.moveArmyToTarget(army, missionCity)) return;
                this.pendingSieges.delete(army.id);
                this.consumeMissionComplete(army)?.(); // 无路可走：解锁事件队列，回落默认驻守
            }
        }

        const isDynamicSiege = !!(siegeData as SiegeData & { isDynamic?: boolean }).isDynamic;
        const defaultChain = isDynamicSiege ? [] : [{ action: 'garrison' as const }];
        const chain = siegeData.afterBattleChain
            || (siegeData.afterBattle ? [{ action: siegeData.afterBattle, targetCityId: siegeData.afterBattleTargetCityId }] : defaultChain);

        if (chain.length === 0) {
            siegeLog(`[SiegeManager] ${army.name} 动态攻城结束，交还 AI 决策`);
            this.consumeMissionComplete(army)?.(); // 安全网：事件任务被动态攻城终结时解锁事件队列
            this.releaseArmyAfterSiege(army);
            return;
        }

        this.processAfterBattleChain(chain as any, 0, city, army, army.getFactionId());
    }

    public processAfterBattleChain(
        chain: Array<{ action: string, targetCityId?: string, speedMultiplier?: number }>,
        currentIndex: number,
        currentCity: any,
        army: Army,
        attackerFactionId: string,
        onChainComplete?: () => void // [NEW] Chain Completion Callback
    ) {
        // [FIX] Prevent infinite recursion / stack overflow
        const MAX_CHAIN_DEPTH = 10;
        if (currentIndex >= chain.length || currentIndex >= MAX_CHAIN_DEPTH) {
            if (currentIndex >= MAX_CHAIN_DEPTH) {
                console.warn(`[SiegeManager] Battle chain depth exceeded limit (${MAX_CHAIN_DEPTH}). Stopping chain.`);
            }
            siegeLog(`[SiegeManager] Chain finished. Signaling completion.`);
            onChainComplete?.();
            return;
        }

        const step = chain[currentIndex];

        // [FIX] If army has been reassigned to a field battle, abort this stale chain
        // 注意：ignoreCityCollision 也会被 move_to_city 设置，所以需要排除这种情况
        if (army.ignoreUnitCollision) {
            siegeLog(`[SiegeManager] Chain aborted for ${army.name} — army reassigned to field battle.`);
            onChainComplete?.();
            return;
        }

        // [SPEED OPTIMIZATION] Apply step-specific speed if defined
        if (step.speedMultiplier) {
            army.setSpeedMultiplier(step.speedMultiplier);
        }

        if (step.action === 'garrison') {
            // [FIX] 驻扎：停止移动，清除目标，标记为空闲
            siegeLog(`[Siege] ${army.name} is now garrisoning at ${currentCity.name}.`);
            army.stopMovement(); // Stop any ongoing movement
            army.setTargetCity(null); // Clear target
            army.setOnArriveCallback(() => { }); // Clear callbacks
            army.siegeMissionData = null;
            this.consumeMissionComplete(army)?.(); // 安全网：驻扎收尾时若事件任务回调仍未触发，解锁事件队列
            army.clearBlocked();

            // [CRITICAL] Ensure we don't drop the chain here if there are more steps
            // But garrison usually implies end of active movement.
            // If chain continues, we must call onChainComplete.
            onChainComplete?.(); // Done
        } else if (step.action === 'destroy') {
            siegeLog(`[SiegeManager] Chain Action: Destroying army ${army.name}`);
            army.destroy();
            onChainComplete?.(); // Done
            return; // End chain
        } else if (step.action === 'move_to_city' && step.targetCityId) {
            const dest = this.cityManager.getCity(step.targetCityId);
            if (dest) {
                // [FIX] Update mission data so physics engine knows the chain continues if collision happens
                if (army.siegeMissionData) {
                    army.siegeMissionData = {
                        ...army.siegeMissionData,
                        defenderCityId: step.targetCityId, // Update target context
                        afterBattleChain: chain.slice(currentIndex + 1)
                    };
                }

                // 逐据点推进：moveLegionToCity 会自动解析路径上第一个非己方据点

                // [CRITICAL FIX] Check if we are ALREADY at the target city (e.g. conquered it)
                const dist = getHexDistance(army.getPosition(), cityToLatLng(dest));
                if (dist <= 1) { // Already there
                    siegeLog(`[Siege] Army ${army.name} is already at ${dest.name} (dist=${dist}). Skipping move, executing next step directly.`);
                    army.ignoreCityCollision = false;
                    this.processAfterBattleChain(
                        chain,
                        currentIndex + 1,
                        dest,
                        army,
                        attackerFactionId,
                        onChainComplete
                    );
                } else {
                    siegeLog(`[SiegeManager] ${army.name} moving to ${dest.name} as part of afterBattleChain`);
                    // 设置到达回调
                    army.setOnArriveCallback(() => {
                        siegeLog(`[Siege] Army ${army.name} arrived at ${dest.name}. Executing next step...`);
                        // [FIX] 到达后重置碰撞标记，防止后续链条被误 abort
                        army.ignoreCityCollision = false;
                        this.processAfterBattleChain(
                            chain,
                            currentIndex + 1,
                            dest,
                            army,
                            attackerFactionId,
                            onChainComplete
                        );
                    });

                    if (!this.moveArmyToTarget(army, dest)) {
                        console.warn(`[SiegeManager] move_to_city 道路失败，军团原地待命`);
                    }
                }
            }
        } else if (step.action === 'attack_city' && step.targetCityId) {
            const dest = this.cityManager.getCity(step.targetCityId);
            if (dest) {
                const nextSiegeData: SiegeData = {
                    attackerFactionId: attackerFactionId,
                    defenderCityId: step.targetCityId,
                    afterBattleChain: chain.slice(currentIndex + 1) as any
                };

                // [FIX] Update Army's mission data so collision triggers use THIS new siege data
                army.siegeMissionData = nextSiegeData;

                // [FIX] Removed setCombatState(true) to allow movement
                // Army.isIdle() now checks for movement (hasArrived), so findCandidate will skip it naturally.

                // Recursion via callbacks
                army.setTargetCity(dest);
                army.setOnArriveCallback((a) => {
                    // 到达后直接开始攻城，使用 startSiegeWithArmy 跳过 findCandidate
                    // [IMPORTANT] Pass onChainComplete to the next siege's completion handler
                    this.startSiegeWithArmy(a, nextSiegeData, onChainComplete);
                });
                if (!this.moveArmyToTarget(army, dest)) {
                    console.warn(`[SiegeManager] attack_city 路径失败，跳过此步骤`);
                    onChainComplete?.();
                }

                // [DISABLED] Auto-Join for Chain - Player no longer auto-follows events
                // this.checkPlayerParticipation(
                //     attackerFactionId,
                //     dest.factionId,
                //     { lat: dest.latitude, lng: dest.longitude },
                //     { lat: dest.latitude, lng: dest.longitude }
                // );
            }
        }
    }





    // ==================== 城市增援系统 ====================
    // 使用 DISTANCE_THRESHOLDS.REINFORCEMENT_RANGE 替代硬编码

    /**
     * 触发防御增援：距被围城市 ≤2 hex 的同阵营空闲军团前往支援（非「回援」，不拉第三方排队/远征军）
     */
    public triggerDefensiveReinforcements(targetCity: { id: string; name: string; latitude: number; longitude: number; factionId: string; troops: number }): void {
        const defenderFactionId = targetCity.factionId;
        if (!defenderFactionId) return;

        siegeLog(`🛡️ [Reinforcement] 触发城市增援检查: ${targetCity.name} (${defenderFactionId})`);

        // 1. 搜索同阵营空闲军团
        const allArmies = this.legionManager.getArmies();
        if (SiegeManager.VERBOSE_REINFORCEMENT_LOG) {
            siegeLog(`[Reinforcement] 所有军队数量: ${allArmies.length}`);
        }

        // 详细日志：列出每个军队的状态
        if (SiegeManager.VERBOSE_REINFORCEMENT_LOG) {
            allArmies.forEach(army => {
                const pos = army.getPosition();
                const targetPosInner = cityToLatLng(targetCity);
                const hexDist = getHexDistance(pos, targetPosInner);
                siegeLog(`  - ${army.name || army.id}: faction=${army.getFactionId()}, type=${army.type}, idle=${army.isIdle()}, combat=${army.getIsInCombat()}, destroyed=${army.isDestroyed}, hexDist=${hexDist}`);
            });
        }

        const candidates = allArmies.filter(army =>
            army.getFactionId() === defenderFactionId &&
            army.type === 'legion' &&
            !army.isDestroyed &&
            army.isIdle() &&
            !army.getIsInCombat() &&
            !this.isArmyWaitingSiege(army.id) &&
            !shouldSkipHomeRecapture(army)
        );

        if (candidates.length === 0) {
            siegeLog(`[Reinforcement] 没有可用的援军 (同阵营空闲军团)`);
            return;
        }

        siegeLog(`[Reinforcement] 候选军团: ${candidates.length}`);

        // 2. 使用统一的距离工具筛选增援范围内的军团
        const targetPos = cityToLatLng(targetCity);
        const nearbyLegions = candidates.filter(legion => {
            const legionPos = legion.getPosition();
            const inRange = isWithinReinforcementRange(legionPos, targetPos);
            siegeLog(`  - ${legion.name || legion.id} 距离检查: inRange=${inRange}`);
            return inRange;
        });

        if (nearbyLegions.length === 0) {
            siegeLog(`[Reinforcement] 增援半径内没有可用军团 (增援范围: ${DISTANCE_THRESHOLDS.REINFORCEMENT_RANGE} 圈六边形)`);
            return;
        }

        siegeLog(`🛡️ [Reinforcement] 发现 ${nearbyLegions.length} 支援军，正在派遣...`);

        // 3. 派遣增援
        nearbyLegions.forEach(legion => {
            siegeLog(`📯 [Reinforcement] ${legion.name || legion.id} (${legion.getTroops()}兵) 前往增援 ${targetCity.name}`);

            // 设置到达回调：兵力汇入城市
            legion.setOnArriveCallback((arrivedArmy) => {
                this.onReinforcementArrive(arrivedArmy, targetCity);
            });

            // 派遣军团 (moveLegionToCity 内部会自动处理道路寻路)
            const success = this.legionManager.moveLegionToCity(legion, targetCity.id);

            if (!success) {
                console.warn(`[Reinforcement] ${legion.name || legion.id} failed to find ROAD to ${targetCity.name}. Stopped.`);
                legion.stopMovement();
            }
        });
    }

    /**
     * 增援到达处理：军团加入正在进行的战场或驻扎待命
     */
    private onReinforcementArrive(army: Army, targetCity: { id: string; name: string; troops: number; factionId: string }): void {
        siegeLog(`✅ [Reinforcement] ${army.name || army.id} 到达 ${targetCity.name} 附近 (${army.getTroops()}兵)`);

        const city = this.cityManager.getCity(targetCity.id);
        const activeBattle = this.activeSieges.get(targetCity.id);
        if (activeBattle && !activeBattle.isOver) {
            if (!city) {
                siegeLog(`🏕️ [Reinforcement] 未找到 ${targetCity.name} 坐标，${army.name} 无法加入本场，驻扎待命`);
                army.setCombatState(false);
                return;
            }
            const cityPos = cityToLatLng(city);
            const myFaction = army.getFactionId();
            const att = activeBattle.getAttackerFactionId();
            const def = activeBattle.getDefenderFactionId();
            if (myFaction === att || myFaction === def) {
                const isAttacker = myFaction === att;
                if (tryJoinLegionToBattle(activeBattle, army, isAttacker, cityPos, this.getReinforcementJoinDeps())) {
                    siegeLog(`📯 [Reinforcement] ${army.name} 中途加入【${targetCity.name}】攻城战`);
                    return;
                }
            }
            siegeLog(`🏕️ [Reinforcement] ${army.name} 无法加入本场，驻扎待命`);
            army.setCombatState(false);
            return;
        }

        siegeLog(`🏕️ [Reinforcement] ${army.name || army.id} 在 ${targetCity.name} 附近驻扎待命`);
    }

    /**
     * 获取城市的活跃战场 (可用于外部查询)
     */
    public getActiveSiege(cityId: string): BattleField | undefined {
        const battle = this.activeSieges.get(cityId);
        return battle && !battle.isOver ? battle : undefined;
    }

    /**
     * 残兵撤回本城：若本城正在守城战中，作为守方援军中途加入；成功返回 true。
     * 无活跃战场（敌军仅在途/排队、尚未开打）时返回 false，由调用方决定待命。
     */
    public tryJoinCityDefense(army: Army, cityId: string): boolean {
        const battle = this.activeSieges.get(cityId);
        if (!battle || battle.isOver) return false;
        const city = this.cityManager.getCity(cityId);
        if (!city) return false;
        if (army.getFactionId() !== battle.getDefenderFactionId()) return false;
        const cityPos = cityToLatLng(city);
        return tryJoinLegionToBattle(battle, army, false, cityPos, this.getReinforcementJoinDeps());
    }

    /**
     * 复国等外部占城：中止该城攻城战/排队，不触发胜负结算与自动占城。
     */
    public abortCitySiege(cityId: string): void {
        const battle = this.activeSieges.get(cityId);
        if (battle && !battle.isOver) {
            battle.abortWithoutSettlement();
        }
        this.activeSieges.delete(cityId);
        this.cityManager.stopSiegeEffect(cityId, true);

        const queue = this.siegeThirdPartyWaiters.get(cityId);
        if (queue) {
            for (const { army, onSiegeComplete } of queue) {
                if (!army.isDestroyed) {
                    army.setCombatState(false);
                    army.ignoreCityCollision = false;
                    army.ignoreUnitCollision = false;
                }
                onSiegeComplete?.();
            }
            this.siegeThirdPartyWaiters.delete(cityId);
        }

        for (const armyId of [...this.pendingSieges]) {
            const army = this.legionManager.getArmies().find((a) => a.id === armyId);
            if (!army || army.isDestroyed) {
                this.pendingSieges.delete(armyId);
                continue;
            }
            if (army.getTargetCity()?.id === cityId) {
                army.setCombatState(false);
                army.ignoreCityCollision = false;
                army.ignoreUnitCollision = false;
                this.pendingSieges.delete(armyId);
            }
        }
    }

}
