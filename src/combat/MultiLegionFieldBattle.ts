/**
 * MultiLegionFieldBattle - 多军团野战处理器
 * 
 * 处理指定多支军团参战的野战事件。
 * 使用 BattleField (区域战斗) 系统支持多单位混战。
 * [SIMPLIFIED] Player system removed for historical simulation.
 */

import { FieldBattleData } from '../types/core';
import { LegionManager } from '../legion/LegionManager';
import { Army } from '../legion/Army';
import { CityManager } from '../world/CityManager';
import { CombatSystem, IBattleUnit } from './CombatSystem';
import { BattleUnitFactory } from './BattleUnitFactory';
import { EventVisualizer } from '../core/EventVisualizer';
import { HISTORICAL_LEGIONS } from '../data/legions';
import { LegionType, getDefaultLegionTypeForFaction } from '../types/UnitTypes';
import { roadRegistry } from '../roads/RoadRegistry';
import { GameConfig } from '../config/GameConfig';
import { getEuclideanDistance, joinStartToRoadPolyline } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';

const battleLog = (...args: unknown[]) => gameLog('battle', ...args);
import { PLAYER_SPEED_TIERS } from '../config/GameConfig';

const BATTLE_OFFSET = 0.14;
const MARCH_TIME = 4.0;

export class MultiLegionFieldBattle {
    private legionManager: LegionManager;
    private cityManager: CityManager;
    private combatSystem: CombatSystem;
    private visualizer: EventVisualizer;

    constructor(
        legionManager: LegionManager,
        cityManager: CityManager,
        combatSystem: CombatSystem,
        visualizer: EventVisualizer
    ) {
        this.legionManager = legionManager;
        this.cityManager = cityManager;
        this.combatSystem = combatSystem;
        this.visualizer = visualizer;
    }

    /**
     * 检查是否应该使用多军团战斗系统
     */
    public static shouldUseMultiLegion(data: FieldBattleData): boolean {
        return !!(
            (data.attackerLegionNames && data.attackerLegionNames.length > 0) ||
            (data.defenderLegionNames && data.defenderLegionNames.length > 0) ||
            // 向后兼容旧的 ID 格式
            (data.attackerLegionIds && data.attackerLegionIds.length > 0) ||
            (data.defenderLegionIds && data.defenderLegionIds.length > 0)
        );
    }

    /**
     * 处理多军团野战事件
     */
    public handleMultiLegionBattle(
        data: FieldBattleData,
        onBattleEnd?: (winnerFaction: string, winningArmies: Army[]) => void
    ): void {
        battleLog(`🏟️ [MultiLegion] 开始多军团野战处理`);

        const battleLocation = data.location || { lat: 0, lng: 0 };
        const attackerPosition = { lat: battleLocation.lat, lng: battleLocation.lng - BATTLE_OFFSET };
        const defenderPosition = { lat: battleLocation.lat, lng: battleLocation.lng + BATTLE_OFFSET };

        // [NEW] Check for Narrative Mode (troops <= 1)
        const isNarrativeDuel = (data.attackerTroops || 0) <= 1 && (data.defenderTroops || 0) <= 1;

        // 优先使用 legionNames 数组，向后兼容 legionIds，同时支持单一军团名称
        let attackerLegionNames = data.attackerLegionNames || data.attackerLegionIds || [];
        let defenderLegionNames = data.defenderLegionNames || data.defenderLegionIds || [];

        // [FIX] 如果数组为空但有单一军团名称，使用单一名称（"创建新军团"场景）
        if (attackerLegionNames.length === 0 && data.attackerLegionName) {
            attackerLegionNames = [data.attackerLegionName];
        }
        if (defenderLegionNames.length === 0 && data.defenderLegionName) {
            defenderLegionNames = [data.defenderLegionName];
        }

        // [NEW] 如果防守方未指定军团，自动搜索附近的防守方军团
        if (defenderLegionNames.length === 0) {
            const allArmies = this.legionManager.getArmies();
            const nearbyDefenders = allArmies.filter(a =>
                a.getFactionId() === data.defenderFactionId &&
                !a.isDestroyed &&
                // 简单的距离检查 (约 100-200km 范围)
                Math.abs(a.getPosition().lat - battleLocation.lat) < 2.0 &&
                Math.abs(a.getPosition().lng - battleLocation.lng) < 2.0
            );

            if (nearbyDefenders.length > 0) {
                defenderLegionNames = nearbyDefenders.map(a => a.name || 'Unknown Legion');
                battleLog(`[MultiLegion] 自动检测到防守方军团 (${defenderLegionNames.length}): ${defenderLegionNames.join(', ')}`);
            }
        }

        // 收集攻击方军团
        const attackerArmies = this.collectArmies(
            attackerLegionNames,
            data.attackerFactionId,
            attackerPosition,
            data.attackerTroops,
            data.attackerSourceCityId,
            data.attackerSourceLocation // [NEW]
        );

        // 收集防守方军团
        const defenderArmies = this.collectArmies(
            defenderLegionNames,
            data.defenderFactionId,
            defenderPosition,
            data.defenderTroops,
            data.defenderSourceCityId,
            undefined // Defender source location not supported yet
        );

        battleLog(`[MultiLegion] 攻击方军团: ${attackerArmies.map(a => a.name).join(', ')}`);
        battleLog(`[MultiLegion] 防守方军团: ${defenderArmies.map(a => a.name).join(', ')}`);

        // [DEBUG] 详细日志：显示每个军团的状态
        attackerArmies.forEach(a => {
            const pos = a.getPosition();
            battleLog(`[DEBUG] 攻击方 ${a.name}: 位置=(${pos.lat.toFixed(2)}, ${pos.lng.toFixed(2)}), 兵力=${a.getTroops()}, 战斗中=${a.getIsInCombat()}, 已销毁=${a.isDestroyed}`);
        });
        defenderArmies.forEach(a => {
            const pos = a.getPosition();
            battleLog(`[DEBUG] 防守方 ${a.name}: 位置=(${pos.lat.toFixed(2)}, ${pos.lng.toFixed(2)}), 兵力=${a.getTroops()}, 战斗中=${a.getIsInCombat()}, 已销毁=${a.isDestroyed}`);
        });

        if (attackerArmies.length === 0 || defenderArmies.length === 0) {
            // Only error out if NOT a narrative duel (narrative duels don't use real armies)
            if (!isNarrativeDuel) {
                console.error(`[MultiLegion] 缺少参战军团，无法开始战斗`);
                // [FIX] Still call onBattleEnd to signal event completion (otherwise queue blocks forever)
                onBattleEnd?.('', []);
                return;
            }
        }

        // [FIX] 双方同时移动到战场

        // 总等待数量 = 攻击军团 + 防守军团
        const totalArmies = attackerArmies.length + defenderArmies.length;
        let arrivedCount = 0;

        battleLog(`[MultiLegion] 总参战单位: ${totalArmies}`);

        const onArmyArrived = () => {
            arrivedCount++;
            battleLog(`[MultiLegion] 单位到达战场 (${arrivedCount}/${totalArmies})`);
            if (arrivedCount >= totalArmies) {
                // 所有军团就位，开始战斗
                // [FIX] Delay battle start to next tick.
                // This prevents LegionManager.update (current frame) from reverting 
                // the forced teleportation we are about to do in startRegionalBattle.
                setTimeout(() => {
                    this.startRegionalBattle(data, attackerArmies, defenderArmies, onBattleEnd);
                }, 0);
            }
        };

        // [CAMERA FIX] Focus on battlefield center (Global Overview)
        // Ensure correct coordinate order: [lat, lng] for Leaflet
        // Skip camera movement if no specific location was provided or if narrative duel
        if (data.location && !isNarrativeDuel && (window as any).game?.map) {
            // Stop any existing camera follow first
            if ((window as any).game.cinematicManager) {
                (window as any).game.cinematicManager.stopFollowing();
            }
            // Use getLeafletMap() to access the raw L.Map instance
            const leafletMap = (window as any).game.map.getLeafletMap();
            const keepZoom = leafletMap.getZoom();
            leafletMap.setView([data.location.lat, data.location.lng], keepZoom, { animate: true, duration: 3.0 });
        }

        // 攻击方移动 (Skip for narrative duels)
        if (!isNarrativeDuel && data.location) {
            this.moveArmiesToBattleParallel(attackerArmies, attackerPosition, onArmyArrived, data.speedMultiplier);
            // 防守方移动
            this.moveArmiesToBattleParallel(defenderArmies, defenderPosition, onArmyArrived, data.speedMultiplier);
        } else if (isNarrativeDuel) {
            // Direct launch for narrative duels
            this.startRegionalBattle(data, attackerArmies, defenderArmies, onBattleEnd);
        } else {
            // Location missing but not a narrative duel... safety fallback
            onArmyArrived(); onArmyArrived(); // Fake arrival
        }

    }

    /**
     * 根据名称列表收集军团（如果被消灭则重新创建）
     */
    private collectArmies(
        legionNames: string[],
        factionId: string,
        targetPos: { lat: number, lng: number },
        troops?: number,
        sourceCityId?: string, // [NEW]
        sourceLocation?: { lat: number, lng: number } // [NEW]
    ): Army[] {
        const armies: Army[] = [];
        const allArmies = this.legionManager.getArmies();
        const DEFAULT_TROOPS = 10000; // [USER REQUEST] Standardize to 10k floor

        for (const legionName of legionNames) {
            // 目标兵力：如果事件指定了troops则用事件的，否则用默认值
            const targetTroops = troops || DEFAULT_TROOPS;

            // 按名称查找未被消灭的军团
            // [FIX] 移除 getIsInCombat() 检查。SiegeManager 的 setCombatState(false)
            // 在 setTimeout(1000) 中调用，但下一事件可能在此之前就触发。
            // 找到后由下方 setCombatState(false) 统一重置。
            let army = allArmies.find(a =>
                a.name === legionName &&
                a.getFactionId() === factionId &&
                !a.isDestroyed
            );

            if (army) {
                // [FIX] 彻底重置军队状态（遵守 coding-rules：找到后统一重置状态）
                army.setCombatState(false);
                army.stopMovement();
                // [FIX] 清除所有挂起的任务数据和回调，防止旧事件干扰
                army.siegeMissionData = null;
                army.setOnArriveCallback(() => { });
                army.ignoreCityCollision = false; // [NEW] 重置碰撞标记
                army.ignoreUnitCollision = false; // [NEW] 为后续重设做准备

                // [FIX] Update existing army properties for the historical event
                const config = HISTORICAL_LEGIONS.find(l => l.name === legionName);
                if (config) {
                    if (config.type) army.legionType = config.type as LegionType;
                    if (config.generalId) (army as any).generalId = config.generalId;
                }

                // [FIX] 复用军团时，如果当前兵力低于目标兵力，则补齐
                if (troops) {
                    army.setTroops(troops);
                } else if (army.getTroops() < targetTroops) {
                    battleLog(`[MultiLegion] 军团 ${army.name} 兵力不足 (${army.getTroops()}), 补齐至 ${targetTroops}`);
                    army.setTroops(targetTroops);
                }

                // [FIX] 已有军队从当前位置出发，不瞬移
                const pos = army.getPosition();
                battleLog(`[MultiLegion] 复用军团 ${army.name}，从当前位置 (${pos.lat.toFixed(2)}, ${pos.lng.toFixed(2)}) 出发`);

                armies.push(army);
                // [VISUAL] Ensure army is visible during march
                army.setVisible(true);
                battleLog(`[MultiLegion] 找到并准备军团: ${army.name} (${army.getTroops()} 兵)`);
            } else {
                // [NEW] 如果军团不存在或被消灭，重新创建
                battleLog(`[MultiLegion] 军团 "${legionName}" 不存在或已被消灭，重新创建...`);

                // 从阵营城市征兵
                const requestedTroops = targetTroops; // 使用计算出的目标兵力
                let recruitedTroops = this.cityManager.recruitTroopsFromFaction(factionId, requestedTroops);

                // [FIX] 如果征兵不足（少于目标的 80%），强制补全（剧情需要，确保战斗平衡）
                if (recruitedTroops < requestedTroops * 0.8) {
                    battleLog(`[MultiLegion] 征兵不足 (${recruitedTroops}/${requestedTroops})，系统强制补给`);
                    recruitedTroops = requestedTroops;
                }

                // [NEW] 确定出生点：优先使用指定的 sourceLocation / sourceCityId
                let spawnPos = targetPos;

                if (sourceLocation) {
                    spawnPos = sourceLocation;
                    battleLog(`[MultiLegion] 使用指定出发坐标: ${spawnPos.lat}, ${spawnPos.lng}`);
                } else if (sourceCityId) {
                    const specificCity = this.cityManager.getCityById(sourceCityId);
                    if (specificCity) {
                        // [FIX] 直接在出发城市生成，让军队有个行军过程，不要直接飞到战场附近
                        spawnPos = { lat: specificCity.latitude, lng: specificCity.longitude };
                        battleLog(`[MultiLegion] 在指定出发城市生成: ${specificCity.name} (${spawnPos.lat.toFixed(4)}, ${spawnPos.lng.toFixed(4)})`);
                    } else {
                        console.warn(`[MultiLegion] 未找到指定出发城市 ID: ${sourceCityId}，将寻找最近城市`);
                        // Fallback to nearest
                        const spawnCity = this.cityManager.getNearestCity(factionId, { latitude: targetPos.lat, longitude: targetPos.lng });
                        if (spawnCity) {
                            spawnPos = { lat: spawnCity.latitude, lng: spawnCity.longitude };
                            battleLog(`[MultiLegion] 在最近城市生成: ${spawnCity.name}`);
                        }
                    }
                } else {
                    // 默认逻辑：找最近的友方城市作为出生点
                    const spawnCity = this.cityManager.getNearestCity(factionId, { latitude: targetPos.lat, longitude: targetPos.lng });
                    if (spawnCity) {
                        spawnPos = { lat: spawnCity.latitude, lng: spawnCity.longitude };
                        battleLog(`[MultiLegion] 在最近城市生成: ${spawnCity.name}`);
                    }
                }

                // [UNIT SYSTEM] Resolve Type and General
                let lType: LegionType = getDefaultLegionTypeForFaction(factionId);
                let gId: string | undefined = undefined;
                const config = HISTORICAL_LEGIONS.find(l => l.name === legionName);
                if (config) {
                    if (config.type) lType = config.type as LegionType;
                    if (config.generalId) gId = config.generalId;
                }

                // 创建新军团
                const newArmy = this.legionManager.createLegion(
                    spawnPos,
                    recruitedTroops,
                    factionId,
                    legionName,
                    () => { }, // 到达回调稍后设置
                    lType,
                    sourceCityId,
                    gId
                );
                if (newArmy) {
                    this.legionManager.addArmy(newArmy);
                    // [VISUAL] Ensure army is visible during march
                    newArmy.setVisible(true);
                    armies.push(newArmy);
                    battleLog(`[MultiLegion] 重新创建军团: ${legionName} (${recruitedTroops} 兵)`);
                }
            }
        }

        return armies;
    }

    /**
     * 移动多支军团到战场位置（并行版本，每个军团到达时调用回调）
     */
    private moveArmiesToBattleParallel(
        armies: Army[],
        targetPos: { lat: number, lng: number },
        onEachArrived: () => void,
        speedMultiplier: number = 1.0 // [NEW] Accept speed multiplier
    ): void {
        const totalCount = armies.length;

        if (totalCount === 0) {
            return;
        }

        armies.forEach((army, index) => {
            // 稍微错开位置，避免重叠
            const offset = (index - (totalCount - 1) / 2) * 0.05;
            const armyTarget = { lat: targetPos.lat + offset, lng: targetPos.lng };

            // [FIX] Ignore city and unit collision during field battle movement
            army.ignoreCityCollision = true;
            army.ignoreUnitCollision = true;

            const startPos = army.getPosition();
            const directDist = getEuclideanDistance(startPos, armyTarget);

            // [FIX] Instant arrival check for extremely short distances (< 2km)
            // 防止防守方生成在战场附近时因距离过近导致速度计算异常或永远不到达
            if (directDist < 0.02) {
                battleLog(`[MultiLegion] Army ${army.name} is already at target (Dist: ${directDist.toFixed(4)}), instant arrival.`);
                army.setPosition(armyTarget.lat, armyTarget.lng);
                // Reset states immediately
                army.setSpeedMultiplier(1.0);
                onEachArrived();
                return;
            }

            // 先设置回调，再开始移动，确保万无一失
            army.setOnArriveCallback(() => {
                battleLog(`[MultiLegion] 军团 ${army.name} 到达战场`);
                // [NEW] Reset speed multiplier and collision flags after arrival
                army.setSpeedMultiplier(1.0);
                army.ignoreCityCollision = false;
                army.ignoreUnitCollision = false;
                onEachArrived();
            });

            const path = roadRegistry.findPathOnRoad(startPos, armyTarget);

            battleLog(`[MultiLegion][DEBUG] Army ${army.name}: start=(${startPos.lat.toFixed(2)}, ${startPos.lng.toFixed(2)}) target=(${armyTarget.lat.toFixed(2)}, ${armyTarget.lng.toFixed(2)})`);
            battleLog(`[MultiLegion][DEBUG] Road path result: ${path ? path.length + ' points' : 'null'}`);
            if (path && path.length > 0) {
                battleLog(`[MultiLegion][DEBUG] Path points: ${path.map(p => `(${p.lat.toFixed(2)},${p.lng.toFixed(2)})`).join(' → ')}`);
            }

            if (path && path.length >= 2) {
                let actualPathLength = 0;
                for (let i = 0; i < path.length - 1; i++) {
                    actualPathLength += getEuclideanDistance(path[i], path[i + 1]);
                }

                army.setSpeedMultiplier(1.0);
                battleLog(`[MultiLegion] Army ${army.name} moving via road (Distance: ${actualPathLength.toFixed(2)})`);
                const marchPath = joinStartToRoadPolyline(startPos, path, GameConfig.ROAD.JOIN_EPS);
                army.moveAlongPath(marchPath.slice(1));
            } else {
                console.warn(`[MultiLegion] Army ${army.name} 无道路可达战场，停止行军`);
                army.setSpeedMultiplier(1.0);
            }
        });
    }

    /**
     * 启动区域战斗
     */
    private startRegionalBattle(
        data: FieldBattleData,
        attackerArmies: Army[],
        defenderArmies: Army[],
        onBattleEnd?: (winnerFaction: string, winningArmies: Army[]) => void
    ): void {
        battleLog(`⚔️ [MultiLegion] 启动区域战斗!`);

        // 显示战斗特效
        const battleId = `mfb_${Date.now()}`;
        const effectId = battleId + '_effect';
        // [USER REQUEST] Disable Field Battle Effect
        // this.visualizer.showFieldBattleEffect(data.location.lat, data.location.lng, effectId);

        // 战斗结束清理回调
        let isBattleOver = false;
        let hasTriggeredEnd = false;

        const onBattleComplete = () => {
            if (isBattleOver) return; // 避免重复清理
            isBattleOver = true;
            this.visualizer.hideFieldBattleEffect(effectId);

            // [FIX] Reset combat state for all armies
            [...attackerArmies, ...defenderArmies].forEach(army => {
                if (!army.isDestroyed) {
                    army.setCombatState(false);
                }
            });
        };

        const locLat = data.location ? data.location.lat : 0;
        const locLng = data.location ? data.location.lng : 0;
        const attackerPosition = { lat: locLat, lng: locLng - BATTLE_OFFSET };
        const defenderPosition = { lat: locLat, lng: locLng + BATTLE_OFFSET };

        // [NEW] Auto-RTS Trigger
        if (data.autoEnterRTS) {
            battleLog(`[MultiLegion] 🎬 Auto-Triggering RTS Mode`);
            const rtsSystem = (window as any).game?.rtsBattleSystem as any;

            if (rtsSystem) {
                // Create Adapters for RTS
                // We need to create valid IBattleUnit objects.
                // BattleUnitFactory.createAdapter is convenient.
                const rtsAttackerUnits = attackerArmies.map(army =>
                    BattleUnitFactory.createAdapter(
                        army.id, army.name, army.getFactionId(), army, 'legion', army.getTroops(),
                        () => { },
                        () => { }
                    )
                );
                const rtsDefenderUnits = defenderArmies.map(army =>
                    BattleUnitFactory.createAdapter(
                        army.id, army.name, army.getFactionId(), army, 'legion', army.getTroops(),
                        () => { },
                        () => { }
                    )
                );

                rtsSystem.startBattle(rtsAttackerUnits, rtsDefenderUnits, data.location);
            } else {
                console.warn('[FieldBattle] RTSBattleSystem not found on global game object');
            }
        }

        const handleAttackerVictory = () => {
            if (!hasTriggeredEnd && onBattleEnd) {
                hasTriggeredEnd = true;
                const survivingArmies = attackerArmies.filter(a => !a.isDestroyed);
                battleLog(`[MultiLegion] 攻击方胜利，触发后续逻辑，剩余军团数: ${survivingArmies.length}`);
                onBattleEnd(data.attackerFactionId, survivingArmies);
            }
        };

        // 创建战斗单位适配器
        // [FIX] 事件链预设战果：该侧按 result 锁定胜负
        const attackerShouldSurvive = data.result === 'attacker_win';

        const attackerUnits: IBattleUnit[] = attackerArmies.map((army, index) =>
            BattleUnitFactory.createAdapter(
                army.id,
                army.name || 'Attacker',
                army.getFactionId(),
                army,
                'legion',
                army.getTroops(),
                () => {
                    // Victory
                    onBattleComplete(); // 清除特效
                    battleLog(`[MultiLegion] ${army.name} 获胜!`);
                    handleAttackerVictory();
                },
                () => {
                    // Defeat Callback
                    onBattleComplete(); // 清除特效

                    if (attackerShouldSurvive) {
                        battleLog(`[MultiLegion] 剧情保护触发: ${army.name} 虽然兵力耗尽但在剧情中获胜，避免销毁。`);
                        army.setTroops(10000); // 剧情幸存 - 保底 10000 兵力
                        // 此时仍视为"Defeat"回调被调用，但我们强制保留军团
                        handleAttackerVictory(); // 强制触发这一方的胜利后续
                    } else {
                        army.destroy();
                    }
                },
                undefined
            )
        );

        // [FIX] Plot Armor for Defender
        const defenderShouldSurvive = data.result === 'defender_win';

        const defenderUnits: IBattleUnit[] = defenderArmies.map(army =>
            BattleUnitFactory.createAdapter(
                army.id,
                army.name || 'Defender',
                army.getFactionId(),
                army,
                'legion',
                army.getTroops(),
                () => { onBattleComplete(); /* victory */ },
                () => {
                    onBattleComplete();
                    if (defenderShouldSurvive) {
                        battleLog(`[MultiLegion] 剧情保护触发: ${army.name} 虽然兵力耗尽但在剧情中获胜，避免销毁。`);
                        army.setTroops(10000); // 剧情幸存 - 保底 10000 兵力
                    } else {
                        army.destroy();
                    }
                },
                undefined
            )
        );

        // No player can join battles in historical simulation mode



        // 启动区域战斗
        // [FIX] 传递预设结果参数 (data.result)

        // [FIX] try-catch 保护：防止 UI 回调（如 CombatUI.setPortrait）抛异常
        // 导致 battleField.onBattleComplete 回调无法被设置，从而阻塞年份推进
        let battleField;
        try {
            battleField = this.combatSystem.startRegionalBattle(
                data.attackerFactionId,
                attackerUnits,
                data.defenderFactionId,
                defenderUnits,
                data.result, // [FIX] 传递预设胜负结果
                data.customDuration, // [NEW] 传递自定义战斗时长
                undefined, // attackerPortrait (field battle simplified)
                undefined, // defenderPortrait
                data.title, // [NEW] 传递战斗标题
                data.description // [NEW] 传递历史描述
            );
        } catch (err) {
            console.error(`[MultiLegion] startRegionalBattle 抛出异常，直接回调结束:`, err);
            // 战斗无法启动，立即通知完成以避免永久阻塞
            this.visualizer.hideFieldBattleEffect(effectId);
            if (onBattleEnd) {
                onBattleEnd('', []);
            }
            return;
        }

        // [NEW] Hook up BattleField completion to external system
        battleField.onBattleComplete = (winnerFactionId) => {
            battleLog(`[MultiLegion] BattleField ${battleField.id} reports completion. Winner: ${winnerFactionId}`);
            // Ensure visualizer cleanup
            this.visualizer.hideFieldBattleEffect(effectId);

            if (onBattleEnd && !hasTriggeredEnd) {
                hasTriggeredEnd = true;
                const survivingArmies = winnerFactionId === data.attackerFactionId
                    ? attackerArmies.filter(a => !a.isDestroyed)
                    : defenderArmies.filter(a => !a.isDestroyed);
                onBattleEnd(winnerFactionId, survivingArmies);
            }
        };

        battleLog(`[MultiLegion] 战场创建成功: ${battleField.id}`);
    }
}
