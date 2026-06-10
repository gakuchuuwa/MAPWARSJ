import { TimeSystem } from '../app/TimeSystem';
import { CityManager } from '../world/CityManager';
import { GameMap } from '../map/GameMap';
import { HISTORICAL_EVENTS } from '../data/events';
import { HistoricalEvent } from '../types/core';
import { CombatSystem } from '../combat/CombatSystem';
import { LegionManager } from '../legion/LegionManager';
import { SiegeManager } from '../combat/SiegeManager';
import { FieldBattleManager } from '../combat/FieldBattleManager';
import { EventVisualizer } from '../core/EventVisualizer';
import { GameConfig } from '../config/GameConfig';
import { GameTimeHUD } from '../ui/GameTimeHUD';
import { gameLog } from '../utils/GameLogger';

export class HistoricalEventManager {
    private timeSystem: TimeSystem;
    private cityManager: CityManager;
    private map: GameMap;
    // @ts-ignore: combatSystem is used by Managers but kept here for dependency injection if needed
    private combatSystem: CombatSystem;
    private processedEvents: Set<string> = new Set();
    private eventIndex: Map<number, HistoricalEvent[]> = new Map();
    private eventHistory: HistoricalEvent[] = [];
    private gameTimeHUD?: GameTimeHUD;

    /** 历史事件系统是否启用 */
    public isHistoricalEventsEnabled(): boolean {
        return GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS;
    }

    private eventQueue: HistoricalEvent[] = [];
    private isProcessingEvent: boolean = false;
    private yearlyQueue: HistoricalEvent[] = [];
    /** 开局点「播放」前为 true */
    private playbackPaused: boolean = true;

    // Skip Event Support
    private currentEventTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private currentEventCompleteCallback: (() => void) | null = null;

    private legionManager: LegionManager;
    private siegeManager: SiegeManager;
    private fieldBattleManager: FieldBattleManager;
    private eventVisualizer: EventVisualizer;

    public getLegionManager(): LegionManager { return this.legionManager; }
    public getSiegeManager(): SiegeManager { return this.siegeManager; }

    constructor(
        timeSystem: TimeSystem,
        cityManager: CityManager,
        map: GameMap,
        combatSystem: CombatSystem,
        gameTimeHUD?: GameTimeHUD
    ) {
        // this.cinematicManager = cinematicManager;
        this.timeSystem = timeSystem;
        this.cityManager = cityManager;
        this.map = map;
        this.combatSystem = combatSystem;
        this.gameTimeHUD = gameTimeHUD;

        this.combatSystem.onForceResolve = () => this.skipCurrentEvent();

        // Initialize Sub-Managers
        this.legionManager = new LegionManager(cityManager, map);
        this.eventVisualizer = new EventVisualizer(map);

        this.siegeManager = new SiegeManager(cityManager, this.legionManager, combatSystem, map, this.eventVisualizer);
        this.fieldBattleManager = new FieldBattleManager(cityManager, this.legionManager, combatSystem, map, this.eventVisualizer, this.siegeManager);

        // [PHASE 2] Initialize Contact Engine for proximity-based battles
        this.legionManager.initContactEngine(combatSystem);
        this.legionManager.setSiegeManager(this.siegeManager);
        combatSystem.setReinforcementPollTargets(this.legionManager, this.siegeManager);

        this.initializeIndex();

        this.timeSystem.onYearChange((year) => {
            this.onYearChange(year);
        });

        this.processedEvents.clear();

        this.onYearChange(this.timeSystem.getYear());
    }

    private initializeIndex(): void {
        this.buildIndex(HISTORICAL_EVENTS);
    }

    private buildIndex(events: HistoricalEvent[]): void {
        events.forEach((event, index) => {
            if (!this.eventIndex.has(event.year)) {
                this.eventIndex.set(event.year, []);
            }
            this.eventIndex.get(event.year)?.push(event);

            // [FIX] Generate Stable ID for Event Persistence
            // Format: Year_Season_Type_IndexInFile
            // Using global index ensures uniqueness even across same year/season
            const stableId = `${event.year}_${event.season}_${event.type}_${index}`;
            (event as any)._stableId = stableId;
        });
    }

    public reloadEvents(events: HistoricalEvent[], skipImmediateCheck: boolean = false): void {
        this.eventIndex.clear();
        this.eventHistory = [];
        this.processedEvents.clear();
        this.buildIndex(events);
        gameLog('world', `[HistoricalEventManager] Reloaded ${events.length} events.`);
        if (!skipImmediateCheck) {
            this.onYearChange(this.timeSystem.getYear());
        }
    }

    private onYearChange(year: number): void {
        this.yearlyQueue = [];

        if (!GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS) {
            return;
        }

        gameLog('world', `[历史事件] 年份开始: ${year}`);

        const events = this.eventIndex.get(year);
        if (!events || events.length === 0) {
            gameLog('world', `[HistoricalEventManager] No events found for year ${year}`);
            return;
        }

        const sortedEvents = [...events].sort((a, b) => a.season - b.season);
        for (const e of sortedEvents) {
            const stableId = (e as any)._stableId;
            if (this.processedEvents.has(stableId)) continue;
            this.yearlyQueue.push(e);
        }
        gameLog('world', `[HistoricalEventManager] Queued ${this.yearlyQueue.length} events for year ${year}`);
    }

    /** 开局点一次「播放」；再点则暂停推演 */
    public togglePlayback(): boolean {
        if (!this.playbackPaused) {
            this.playbackPaused = true;
            this.map.unlockCamera();
            this.timeSystem.setPaused(true);
            return false;
        }

        this.playbackPaused = false;
        this.timeSystem.setPaused(false);
        return true;
    }

    /** 控制面板「剧本模式」开关 */
    public setScriptModeEnabled(enabled: boolean): void {
        if (GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS === enabled) return;
        GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS = enabled;

        if (!enabled) {
            if (!this.playbackPaused) {
                this.togglePlayback();
                this.gameTimeHUD?.setPlayingState(false);
            }
            this.yearlyQueue = [];
            this.eventQueue = [];
            console.log('[HistoricalEventManager] 剧本模式已关闭');
            return;
        }

        console.log('[HistoricalEventManager] 剧本模式已开启');
        this.onYearChange(this.timeSystem.getYear());
    }

    /** [NEW] 跳过当前事件（由 CombatUI 跳过按钮触发） */
    public skipCurrentEvent(): void {
        console.log(`⏭️ [HistoricalEventManager] skipCurrentEvent called`);
        // 清除等待中的计时器
        if (this.currentEventTimeoutId) {
            clearTimeout(this.currentEventTimeoutId);
            this.currentEventTimeoutId = null;
            console.log(`⏭️ [HistoricalEventManager] Cleared pending timer`);
        }
        // 立即触发事件完成回调
        if (this.currentEventCompleteCallback) {
            const cb = this.currentEventCompleteCallback;
            this.currentEventCompleteCallback = null;
            cb();
            console.log(`⏭️ [HistoricalEventManager] Forced event completion`);
        }
    }

    /** 军团移动 / 碰撞 / 增援（每帧） */
    public updateLegions(deltaTime: number): void {
        this.legionManager.update(deltaTime);
    }

    /** 按游戏日历年/季触发事件；时间由 TimeSystem 独立推进 */
    public updateEvents(_deltaTime: number): void {
        if (!GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS) return;
        if (this.isProcessingEvent || this.playbackPaused) return;

        this.dropProcessedFromQueueHead();
        if (this.yearlyQueue.length === 0) return;

        const nextEvent = this.yearlyQueue[0];
        const year = this.timeSystem.getYear();
        const season = this.timeSystem.getSeason();
        if (nextEvent.year !== year) return;
        if ((nextEvent.season ?? 0) > season) return;

        this.yearlyQueue.shift();
        this.triggerEvent(nextEvent);
    }

    private dropProcessedFromQueueHead(): void {
        while (this.yearlyQueue.length > 0) {
            const stableId = (this.yearlyQueue[0] as any)._stableId;
            if (!this.processedEvents.has(stableId)) break;
            this.yearlyQueue.shift();
        }
    }

    public onEventTriggered(callback: (event: HistoricalEvent) => void): void {
        this.onEventTriggeredCallbacks.push(callback);
    }

    private onEventTriggeredCallbacks: ((event: HistoricalEvent) => void)[] = [];

    private notifyEventTriggered(event: HistoricalEvent): void {
        this.onEventTriggeredCallbacks.forEach(cb => cb(event));
    }

    public async triggerEvent(event: HistoricalEvent, force: boolean = false): Promise<void> {
        try {
            const stableId = (event as any)._stableId;

            // 1. Duplication Check
            if (!force && this.processedEvents.has(stableId)) {
                return;
            }

            // 2. [BLOCKING QUEUE] If busy, add to queue
            if (this.isProcessingEvent && !force) {
                console.log(`⏳ [Queue] System busy. Queuing event: ${event.description}`);
                this.eventQueue.push(event);
                return;
            }

            // 3. Lock System
            this.isProcessingEvent = true;
            this.processedEvents.add(stableId);
            this.eventHistory.push(event);

            // [NEW] Apply Troop Inheritance Logic
            this.applyTroopInheritance(event);

            console.log(`🎬 [ACTION] Triggering Event: ${event.description}`);

            // 4. Camera target
            const DURATION_PER_QUARTER = 5;
            let eventDuration = DURATION_PER_QUARTER;
            let targetLoc: { lat: number, lng: number } | null = null;
            const isBattleEvent = (event.type === 'siege' || event.type === 'field_battle');

            // [DEBUG] Log target location candidates
            console.log(`[EventCamera] Resolving target for ${event.type}:`, {
                siegeData: event.siegeData,
                fieldBattleData: event.fieldBattleData
            });

            // Extract target from Event Data
            // [OPTIMIZED] 攻城战：优先飞向进攻方军团当前位置，然后跟随军团全程前进
            if (event.type === 'siege' && event.siegeData) {
                // [NEW] 优先查找已存在的进攻方军团
                if (event.siegeData.legionName) {
                    const existingArmy = this.legionManager.getArmies().find(
                        (a) =>
                            a.name === event.siegeData!.legionName &&
                            !a.isDestroyed &&
                            (a.getFactionId() === event.siegeData!.attackerFactionId ||
                                a.name === '秦军')
                    );
                    if (existingArmy) {
                        const armyPos = existingArmy.getPosition();
                        targetLoc = { lat: armyPos.lat, lng: armyPos.lng };
                        console.log(`🎥 [Camera] Found existing army ${existingArmy.name}, target set to:`, targetLoc);
                    } else {
                        console.log(`🎥 [Camera] Legion "${event.siegeData.legionName}" not found.`);
                    }
                }

                // 回退：优先飞向进攻方出发城市（军团生成点）
                if (!targetLoc && event.siegeData.attackerCityId) {
                    const attackerCity = this.cityManager.getCityById(event.siegeData.attackerCityId);
                    if (attackerCity) {
                        targetLoc = { lat: attackerCity.latitude, lng: attackerCity.longitude };
                        console.log(`🎥 [Camera] Using attacker start city: ${attackerCity.name}`, targetLoc);
                    } else {
                        console.warn(`🎥 [Camera] Attacker city ID "${event.siegeData.attackerCityId}" not found.`);
                    }
                }

                // 再回退：如有明确定义的 attackerSourceLocation
                if (!targetLoc && event.siegeData.attackerSourceLocation) {
                    targetLoc = event.siegeData.attackerSourceLocation;
                    console.log(`🎥 [Camera] Using manual attackerSourceLocation`, targetLoc);
                }

                // 最后回退：防守方城市（不推荐，因为会导致镜头剧透或跳跃）
                if (!targetLoc && event.siegeData.defenderCityId) {
                    const defenderCity = this.cityManager.getCityById(event.siegeData.defenderCityId);
                    if (defenderCity) {
                        // [OPTIMIZATION] If no source specified, try to find nearest friendly city (spawn point)
                        const predictedSpawnCity = this.cityManager.getNearestCity(
                            event.siegeData.attackerFactionId,
                            { latitude: defenderCity.latitude, longitude: defenderCity.longitude }
                        );

                        if (predictedSpawnCity) {
                            console.log(`🎥 [Camera] Predicted spawn point at ${predictedSpawnCity.name} (Nearest to target)`);
                            targetLoc = { lat: predictedSpawnCity.latitude, lng: predictedSpawnCity.longitude };
                        } else {
                            targetLoc = { lat: defenderCity.latitude, lng: defenderCity.longitude };
                            console.log(`🎥 [Camera] Fallback to defender city: ${defenderCity.name}`, targetLoc);
                        }
                    } else {
                        console.warn(`🎥 [Camera] Defender city ID "${event.siegeData.defenderCityId}" not found.`);
                    }
                }

                if (!targetLoc) {
                    console.warn(`⚠️ [EventCamera] FAILED to resolve any target location for Siege!`);
                }

                // [FIX] 强制设置一个较长的观察时间，确保玩家能看到军团生成和移动
                // 默认 5s 可能太短，对于长途奔袭（如野王到邺城）建议延长
                eventDuration = event.siegeData.customDuration || 8.0;
            } else if (event.type === 'field_battle' && event.fieldBattleData) {
                // [NEW] Resolve locationCityId to actual location
                if (event.fieldBattleData.locationCityId) {
                    const locCity = this.cityManager.getCityById(event.fieldBattleData.locationCityId);
                    if (locCity) {
                        event.fieldBattleData.location = { lat: locCity.latitude, lng: locCity.longitude };
                    } else {
                        console.warn(`[HistoricalEventManager] Battlefield city ID ${event.fieldBattleData.locationCityId} not found!`);
                    }
                }

                // [REVERTED] Wild Battle: Priority 1 - Battle Location (No follow, only battlefield)
                if (event.fieldBattleData.location) {
                    targetLoc = event.fieldBattleData.location;
                    console.log(`🎥 [Camera] Using Field Battle location`, targetLoc);
                }

                // Fallbacks only if location is missing (which shouldn't happen for valid data)
                if (!targetLoc && event.fieldBattleData.attackerLegionName) {
                    const existingArmy = this.legionManager.getArmies().find(
                        a => a.name === event.fieldBattleData!.attackerLegionName &&
                            !a.isDestroyed
                    );
                    if (existingArmy) {
                        const armyPos = existingArmy.getPosition();
                        targetLoc = { lat: armyPos.lat, lng: armyPos.lng };
                        console.log(`🎥 [Camera] Location missing. Fallback to army ${existingArmy.name}`, targetLoc);
                    }
                }

                eventDuration = (event.fieldBattleData as any).customDuration || eventDuration;
            }

            // 5. [CAMERA HANDSHAKE] Intercept -> Move -> Release
            // Camera flies to target location FIRST for ALL event types.
            // For Siege: Fly to attacker's starting position (or defender city if not specified)
            // For Field Battle: Fly to battle location
            // For Narratives: Fly to specified location
            const isNarrativeDuel = event.type === 'field_battle' && (event.fieldBattleData?.attackerTroops || 0) <= 1 && (event.fieldBattleData?.defenderTroops || 0) <= 1;

            if (targetLoc && !isNarrativeDuel) {
                console.log(`🎥 [Camera] Intercepting Event. Flying to [${targetLoc.lat.toFixed(3)}, ${targetLoc.lng.toFixed(3)}]...`);

                // [FIX] Use flyTo for cinematic movement (User Request: 运镜)
                // Disable user interaction manually instead of using lockCameraOn
                this.map.getLeafletMap().dragging.disable();
                if (this.map.getLeafletMap().touchZoom) this.map.getLeafletMap().touchZoom.disable();
                if (this.map.getLeafletMap().doubleClickZoom) this.map.getLeafletMap().doubleClickZoom.disable();
                if (this.map.getLeafletMap().scrollWheelZoom) this.map.getLeafletMap().scrollWheelZoom.disable();

                this.map.flyTo(targetLoc, 2.0, { zoom: 9 }); // 2.0s duration
                console.log(`🔒 [Camera] Interactions disabled during flight.`);
            }


            // 6. Release Event Logic
            this.notifyEventTriggered(event);
            this.eventVisualizer.updateEventUI(event);
            if (this.gameTimeHUD) {
                this.gameTimeHUD.highlightEvent(event);
            }



            let eventCompleted = false;
            const onEventComplete = () => {
                if (eventCompleted) return;
                eventCompleted = true;
                this.map.unlockCamera();
                console.log(`✅ [事件完成]`);
                this.isProcessingEvent = false;
                this.checkQueue();
            };

            if (isBattleEvent) {
                this.processHistoricalEvent(event, onEventComplete);
            }

        } catch (error) {
            console.error(`❌ [HistoricalEventManager] Error triggering event:`, event, error);
            this.isProcessingEvent = false;
        }
    }

    private checkQueue() {
        if (this.eventQueue.length > 0 && !this.isProcessingEvent) {
            const nextEvent = this.eventQueue.shift();
            if (nextEvent) {
                console.log(`⏭️ [Queue] Processing queued event: ${nextEvent.description}`);
                this.triggerEvent(nextEvent, true); // Force trigger to bypass logic but we use logic inside
            }
        }
    }

    /** 剧本兵力：事件未写 attackerTroops / defenderTroops 时默认 10000 */
    private applyTroopInheritance(event: HistoricalEvent): void {
        const TROOPS = 10000;

        if (event.type === 'siege' && event.siegeData) {
            const data = event.siegeData;
            data.description = event.description;
            if (data.attackerTroops === undefined) data.attackerTroops = TROOPS;
            if (data.defenderTroops === undefined) data.defenderTroops = TROOPS;
        } else if (event.type === 'field_battle' && event.fieldBattleData) {
            const data = event.fieldBattleData;
            data.description = event.description;
            if (data.attackerTroops === undefined) data.attackerTroops = TROOPS;
            if (data.defenderTroops === undefined) data.defenderTroops = TROOPS;
        }
    }

    private getHistoricalFactionName(factionId: string, legionName?: string): string {
        // 1. Try to extract from Legion Name (e.g. "秦-王翦军" -> "秦")
        if (legionName && legionName.includes('-')) {
            return legionName.split('-')[0];
        }

        // 2. Fallback to Hardcoded Historical Map (Qin Dynasty Scenario)
        switch (factionId) {
            case 'qin': return '秦';
            case 'huihui': return '赵';
            case 'chaoxian': return '朝鲜';
            case 'tianchao': return '楚';
            case 'yuenan': return '越';
            case 'zhonghua': return '汉';
            case 'panjun': return '叛军';
        }

        // 3. Fallback to System Name (Culture Name)
        return this.cityManager.getFactionName(factionId);
    }

    public processHistoricalEvent(event: HistoricalEvent, onComplete?: () => void): void {
        try {
            if (event.type === 'siege' && event.siegeData) {
                // [NEW] Auto-generate Title if missing
                if (!event.siegeData.title) {
                    const yearStr = `公元前${Math.abs(event.year)}年`;
                    const eraName = event.regnalYear || event.description.split('，')[0]; // Use explicit regnalYear if available

                    // Use Legion Name for Attacker if available
                    const attackerName = this.getHistoricalFactionName(
                        event.siegeData.attackerFactionId,
                        event.siegeData.legionName
                    );

                    let defenderName = '未知';
                    let cityName = '未知';

                    const city = this.cityManager.getCityById(event.siegeData.defenderCityId);
                    if (city) {
                        cityName = city.name;
                        // Use city owner as defender if not specified (Legion Name unavailable usually)
                        defenderName = this.getHistoricalFactionName(city.factionId);
                    }

                    // [FIX] Use high-level event title if available, otherwise generate
                    const baseTitle = event.title || `${attackerName}${defenderName}${cityName}之战`;

                    // Format: "公元前236年，始皇帝十一年，秦赵邺城之战"
                    event.siegeData.title = `${yearStr}，${eraName}，${baseTitle}`;
                    console.log(`📜 [History] Siege Title: ${event.siegeData.title}`);
                }

                this.siegeManager.handleSiegeEvent(event.siegeData, onComplete);
            } else if (event.type === 'field_battle' && event.fieldBattleData) {
                // [NEW] Auto-generate Title for Field Battle
                if (!event.fieldBattleData.title) {
                    const yearStr = `公元前${Math.abs(event.year)}年`;
                    const eraName = event.regnalYear || event.description.split('，')[0];

                    // Use Legion Names if available
                    const attackerName = this.getHistoricalFactionName(
                        event.fieldBattleData.attackerFactionId,
                        event.fieldBattleData.attackerLegionName
                    );
                    const defenderName = this.getHistoricalFactionName(
                        event.fieldBattleData.defenderFactionId,
                        event.fieldBattleData.defenderLegionName
                    );

                    let locName = '野外';
                    if (event.fieldBattleData.location) {
                        const nearest = this.cityManager.getNearestCity(null, { latitude: event.fieldBattleData.location.lat, longitude: event.fieldBattleData.location.lng });
                        if (nearest) {
                            locName = `${nearest.name}周边`;
                        }
                    }

                    // [FIX] Use high-level event title if available, otherwise generate
                    const baseTitle = event.title || `${attackerName}${defenderName}${locName}之战`;

                    event.fieldBattleData.title = `${yearStr}，${eraName}，${baseTitle}`;
                    console.log(`📜 [History] Field Battle Title: ${event.fieldBattleData.title}`);
                }

                // [FIX] 叙事模式：显式标记 isNarrative 或兼容旧数据（双方兵力均 ≤ 1）
                const isNarrative = event.fieldBattleData.isNarrative ||
                    ((event.fieldBattleData.attackerTroops || 0) <= 1 && (event.fieldBattleData.defenderTroops || 0) <= 1);
                if (isNarrative) {
                    console.log(`🎭 [Narrative Duel] 叙事对决模式：${event.fieldBattleData.attackerLegionName} vs ${event.fieldBattleData.defenderLegionName}`);

                    // 创建轻量级虚拟战斗单元（仅用于 CombatUI 展示，不生成地图实体）
                    const dummyPos = event.fieldBattleData.location || { lat: 0, lng: 0 };
                    const makeDummyUnit = (name: string, factionId: string): import('../combat/CombatSystem').IBattleUnit => ({
                        id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        name: name,
                        factionId: factionId,
                        unitType: 'legion',
                        troops: 1,
                        maxTroops: 1,
                        setTroops: () => { },
                        isDestroyed: false,
                        destroy: () => { },
                        getPosition: () => dummyPos,
                        morale: 100,
                        maxMorale: 100,
                        setMorale: () => { }
                    });

                    const attUnit = makeDummyUnit(
                        event.fieldBattleData.attackerLegionName || '攻方',
                        event.fieldBattleData.attackerFactionId
                    );
                    const defUnit = makeDummyUnit(
                        event.fieldBattleData.defenderLegionName || '守方',
                        event.fieldBattleData.defenderFactionId
                    );

                    // 触发 CombatUI 展示（叙事模式）
                    if (this.combatSystem.onRegionalBattleStart) {
                        this.combatSystem.onRegionalBattleStart(
                            [attUnit], [defUnit],
                            undefined, undefined,
                            event.fieldBattleData.title,
                            event.fieldBattleData.description || event.description,
                            true // [NEW] isNarrative = true
                        );
                    }

                    // 定时自动完成（展示若干秒后隐藏 UI）
                    const displayDuration = (event.fieldBattleData as any).customDuration || 5;
                    // [FIX] 追踪 timeout 和回调，以便跳过按钮可以取消
                    this.currentEventCompleteCallback = () => {
                        console.log(`🎭 [Narrative Duel] 展示结束`);
                        onComplete?.();
                    };
                    this.currentEventTimeoutId = setTimeout(() => {
                        this.currentEventTimeoutId = null;
                        if (this.currentEventCompleteCallback) {
                            const cb = this.currentEventCompleteCallback;
                            this.currentEventCompleteCallback = null;
                            cb();
                        }
                    }, displayDuration * 1000);
                    return; // 跳过 fieldBattleManager（不创建军队）
                }

                this.fieldBattleManager.handleFieldBattleEvent(event.fieldBattleData, onComplete);
            }
        } catch (error) {
            console.error(`❌ [HistoricalEventManager] Error processing event details:`, error);
            onComplete?.();
        }
    }

    public getEventHistory(): HistoricalEvent[] {
        return this.eventHistory;
    }
}
