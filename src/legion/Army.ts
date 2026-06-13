import L from 'leaflet';
import { GameMap } from '../map/GameMap';
import { LatLng } from '../types/core';
import { GridSystem } from '../systems/GridSystem';
import { TerrainSpeedSystem, TERRAIN_SPEED_CONFIG } from '../core/TerrainSpeedSystem';
import { LandSeaSystem, LandTerrainSystem } from '../world/land-sea';
import { UnitRenderer } from '../map/UnitRenderer';
import { GameConfig, MARCH_SPEED_MULTIPLIERS, PLAYER_SPEED_TIERS } from '../config/GameConfig';
import { GameTime } from '../app/GameTime';
import { LegionType, getUnitTypeConfig } from '../types/UnitTypes';
import type { RegionType } from '../systems/RegionSystem';

import { IBattleUnit } from '../combat/CombatSystem';
import { gameLog } from '../utils/GameLogger';
import { getRandomFactionPortrait } from '../config/portrait_defaults';
import { captureMarchSaveSnapshot, emptyMarchSaveSnapshot } from './march/marchStopPolicy';

export class Army implements IBattleUnit {
    private map: GameMap;
    private position: LatLng;
    private destination: LatLng;
    private targetCity: any;
    public troops: number; // [IBattleUnit] Must be public
    private _factionId: string;
    private onArrive: (army: Army) => void;

    /** 剧本攻城任务的完成回调：只在最终目标城之战结束时触发（途中 hop 战不触发） */
    public siegeMissionComplete: (() => void) | null = null;

    /** 大乱斗军情：全军覆没播报（destroy 时触发） */
    public feedAnnihilation?: { side: 'attacker' | 'defender'; cityName: string };

    private static annihilationReporter?: (
        army: Army,
        info: { side: 'attacker' | 'defender'; cityName: string }
    ) => void;

    public static setAnnihilationReporter(
        reporter: ((army: Army, info: { side: 'attacker' | 'defender'; cityName: string }) => void) | null
    ): void {
        Army.annihilationReporter = reporter ?? undefined;
    }

    // [NEW] Visibility control for siege battles
    public visible: boolean = true;
    public ignoreCityCollision: boolean = false; // [FIX] Prevent accidental siege during field battles
    public ignoreUnitCollision: boolean = false; // [FIX] Allow passing through units during field battle movement
    public siegeMissionData: any = null; // [FIX] Store event data here to persist context through collision
    private onCombatEndedCallback: ((army: Army) => void) | null = null;

    public setVisible(visible: boolean): void {
        this.visible = visible;
        // [FIX] Also update renderer visibility for GlobalUnitRenderer
        if (this.renderer) {
            this.renderer.setVisible(visible);
        }
    }

    // Path movement
    private pathQueue: LatLng[] = [];

    private marker: L.Polygon | null = null;
    private label: L.Marker | null = null;
    private renderer: UnitRenderer | null = null;
    public isDestroyed: boolean = false;
    private currentTerrainMultiplier: number = 1.0;
    private lastRegisteredPos: { lat: number, lng: number } | null = null;
    private spatialRegistry: any = null; // [NEW] Keep reference for unregistration
    private hasArrived: boolean = true; // [FIX] 新建军队默认 idle，让 AI BT 首帧就能发出行军指令

    // Battles are fully managed by SiegeManager/CombatSystem.
    // Army only holds the visual state flag.
    private isExternalCombat: boolean = false;
    private speedMultiplier: number = 1.0; // [NEW] Event-based speed multiplier

    // [NEW] Blocked state management - prevents crowding behavior
    private blockedUntil: number = 0; // Timestamp when army can retry movement
    private static readonly BLOCKED_RETRY_INTERVAL = 1000; // Reduced from 3000ms for better responsiveness

    /** 战后驻留剩余时间（游戏秒，随 timeScale 流逝） */
    private postBattleRestRemaining: number = 0;

    // [NEW] IAnimatedUnit Interface Compatibility
    public isAttacking: boolean = false;
    public currentBattleType: 'siege' | 'field' | null = null;
    public targetPos: { lat: number; lng: number } | null = null;
    public lastPosition: { lat: number; lng: number } = { lat: 0, lng: 0 };
    public lastDirection: number = 0; // Cache direction
    public lastPath: { lat: number; lng: number }[] = []; // [Siege Fix] Path history
    /** 当前位置是否在海域 hex（WATER/OCEAN），用于海上船贴图 */
    public isOnSea: boolean = false;

    // [NEW] Home City ID (One Legion Per City Rule)
    public homeCityId: string | null = null;

    /**
     * 远征目标城（GAME_DIRECTION「远征细则」2026-06-11）：
     * 非 null = 远征模式——目标锁死该城、断粮不回师，直至占领或全军覆没；
     * null = 基础模式（近 3 敌城抽签 + 家城失守强制回师）。
     * 仅跟拍军团可被玩家下达远征指令（ExpeditionUI），AI 不会自行远征。
     */
    public expeditionTargetCityId: string | null = null;
    /** 远征前军团原名；功成保留番号后清空；仅目标异常时用于恢复 */
    public expeditionSavedName: string | null = null;
    
    // [NEW] Source City ID (One Legion Per City Rule)
    private sourceCityId: string | null = null;

    public setSourceCityId(cityId: string): void {
        this.sourceCityId = cityId;
    }

    public getSourceCityId(): string | null {
        return this.sourceCityId;
    }

    public setCombatState(isFighting: boolean, battleType?: 'siege' | 'field', targetPos?: { lat: number, lng: number }): void {
        const wasFighting = this.isExternalCombat;
        this.isExternalCombat = isFighting;
        this.isAttacking = isFighting; // Sync IAnimatedUnit property
        this.currentBattleType = isFighting ? (battleType || 'field') : null;
        this.targetPos = targetPos || null;

        // [DISABLED] 自动调速功能已禁用
        // const game = (window as any).game;
        // if (game && game.timeSystem) {
        //     if (isFighting) {
        //         console.log(`⏱️ [Auto-Speed] Combat Started -> Set Speed 1.0x`);
        //         game.timeSystem.setSpeed(1.0);
        //     } else {
        //         console.log(`⏱️ [Auto-Speed] Combat Ended -> Set Speed 10.0x`);
        //         game.timeSystem.setSpeed(10.0);
        //     }
        // }

        // Update marker style if exists
        if (this.marker) {
            const element = this.marker.getElement();
            if (element) {
                if (isFighting) {
                    element.classList.add('army-combat');
                } else {
                    element.classList.remove('army-combat');
                }
            }
        }

        // Trigger attack animation
        if (this.renderer) {
            if (isFighting) {
                this.renderer.triggerAttack(battleType, targetPos);
            } else {
                this.renderer.stopAttack();
            }
        }

        // 乱斗：战胜方战后驻留（仅胜军、仅一次，见 startPostBattleRest）
        if (wasFighting && !isFighting && this.type === 'legion' && !this.isDestroyed
            && GameConfig.SYSTEM.SANDBOX_MODE && this.troops > 0) {
            this.startPostBattleRest();
            this.onCombatEndedCallback?.(this);
        }
    }

    public setOnCombatEnded(cb: ((army: Army) => void) | null): void {
        this.onCombatEndedCallback = cb;
    }

    public setFollowedHighlight(active: boolean): void {
        if (this.renderer) {
            this.renderer.isPlayer = active;
        }
    }

    /** 结束战斗姿态但不触发战后驻留（用于战场收尾、败军清理等） */
    public clearExternalCombatState(): void {
        if (!this.isExternalCombat && !this.isAttacking) return;
        this.isExternalCombat = false;
        this.isAttacking = false;
        this.currentBattleType = null;
        this.targetPos = null;
        if (this.marker) {
            const element = this.marker.getElement();
            if (element) element.classList.remove('army-combat');
        }
        if (this.renderer) {
            this.renderer.stopAttack();
        }
    }

    public isIdle(): boolean {
        // Army is idle only if not fighting AND has arrived at destination
        return !this.isExternalCombat && this.hasArrived;
    }

    public getIsInCombat(): boolean {
        return this.isExternalCombat;
    }

    // [NEW] Blocked state management
    public setBlocked(durationMs: number = Army.BLOCKED_RETRY_INTERVAL): void {
        this.blockedUntil = Date.now() + durationMs;
        // Only log if it's a significant wait
        if (durationMs >= Army.BLOCKED_RETRY_INTERVAL) {
            gameLog('army', `⏸️ [Army] ${this.name} blocked. Waiting ${durationMs}ms before retry.`);
        }
    }

    public isBlocked(): boolean {
        return Date.now() < this.blockedUntil;
    }

    public clearBlocked(): void {
        this.blockedUntil = 0;
    }

    /** 战胜方战后驻留（游戏秒，受倍速影响）；重复调用不叠加 */
    public startPostBattleRest(durationSec: number = GameTime.POST_BATTLE_REST): void {
        if (this.isDestroyed || this.troops < 1) return;
        if (this.postBattleRestRemaining > 0) return;
        this.postBattleRestRemaining = durationSec;
        gameLog('army', `⏸️ [Army] ${this.name} 战胜驻留 ${durationSec}s 游戏时间`);
    }

    public isPostBattleResting(): boolean {
        return this.postBattleRestRemaining > 0;
    }

    public clearPostBattleRest(): void {
        this.postBattleRestRemaining = 0;
    }

    public getMaxTroops(): number {
        return this.initialTroops;
    }

    public addTroops(amount: number): void {
        // [USER REQUIREMENT] Cap recovery at initial formation size
        // If it's a 50k legion, it can't grow beyond 50k via recovery
        const space = this.initialTroops - this.troops;
        const actualAdd = Math.min(amount, space);

        if (actualAdd > 0) {
            this.troops += actualAdd;
        }
    }
    private initialTroops: number = 0;

    public id: string;
    public type: string = 'army'; // For compatibility
    public legionType: LegionType = 'infantry';
    public cultureSlots: string[] | null = null; // [NEW] 14 文化阵型 slot 类型列表
    public cultureScales: number[] | null = null; // [NEW] 自定义单位缩放列表
    /** 军团文化区：用于三角纯骑行军加成（STEPPE/TIBET/WESTERN） */
    public cultureRegion: RegionType | null = null;
    public name: string; // [IBattleUnit]
    public generalId?: string; // [NEW] UI Avatar ID
    public portraitPath?: string; // [NEW] 军队创建时随机固定立绘

    // [IBattleUnit Implementation]
    public get factionId(): string {
        return this._factionId;
    }

    constructor(
        map: GameMap,
        startPos: LatLng,
        targetCity: any,
        troops: number,
        factionId: string,
        onArrive: (army: Army) => void,
        onBattleTick?: (army: Army, deltaTime: number) => void,
        destination?: LatLng, // Optional custom destination
        name?: string, // [NEW] Optional name
        legionType?: LegionType, // [UNIT SYSTEM] 兵种类型
        generalId?: string // [NEW] General Avatar
    ) {
        this.map = map;
        this.position = { ...startPos };
        this.targetCity = targetCity;
        // If destination is provided, use it; otherwise default to city location
        this.destination = destination || (targetCity ? { lat: targetCity.latitude, lng: targetCity.longitude } : startPos);
        this.troops = troops;
        this.initialTroops = troops;
        this._factionId = factionId;
        this.onArrive = onArrive;

        this.id = `army_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name || `Army ${this.id.substr(-4)}`; // [FIX] Ensure name is never undefined
        if (legionType) this.legionType = legionType;
        this.generalId = generalId; // Store for UI use only
        this.portraitPath = getRandomFactionPortrait(factionId); // 随机立绘，跟定此军队

        this.createMarker();
        this.updateTerrainSpeed();

        // Initialize renderer with faction ID
        this.renderer = new UnitRenderer(map, this, '999', this.factionId);

        // Registration will be handled by LegionManager after instantiation.
        this.lastRegisteredPos = null;

        // [FIX] Initialize lastPosition to prevent jump
        this.lastPosition = { ...startPos };
    }

    public setSpatialRegistry(registry: any): void {
        this.spatialRegistry = registry;
    }

    public getPosition(): LatLng {
        return { ...this.position };
    }

    private createMarker(): void {
        // Marker creation logic removed in favor of UnitRenderer, 
        // kept minimal here if needed in future or logic preservation
    }

    private formatTroops(troops: number): string {
        return Math.floor(troops).toString();
    }

    private debugFrameCount: number = 0;

    public update(deltaTime: number): void {
        if (this.isDestroyed) return;

        this.updateTerrainSpeed();

        if (this.postBattleRestRemaining > 0) {
            this.postBattleRestRemaining = Math.max(0, this.postBattleRestRemaining - deltaTime);
        }
        if (this.isPostBattleResting()) return;

        if (this.pathQueue.length === 0 && this.hasArrived) return;
        if (this.isBlocked()) return;

        const currentPos = this.position;
        const dest = this.destination;
        const targetLat = dest.lat;
        const targetLng = dest.lng;

        const dx = targetLat - currentPos.lat;
        const dy = targetLng - currentPos.lng;
        const distance = Math.sqrt(dx * dx + dy * dy);



        // If externally managed combat is active, do not move
        if (this.isExternalCombat) {
            return;
        }

        const baseSpeed = this.getSpeed();
        const finalSpeed = baseSpeed * this.currentTerrainMultiplier;
        const moveDist = finalSpeed * deltaTime;

        if (this.hasArrived) return;

        // [FIX] Track position BEFORE moving for renderer interpolation / direction
        this.lastPosition = { lat: this.position.lat, lng: this.position.lng };

        let remainingDist = moveDist;

        // [VECTOR MOVEMENT] Consume path points until distance exhausted
        while (remainingDist > 0) {
            const dx = this.destination.lat - this.position.lat;
            const dy = this.destination.lng - this.position.lng;
            const distToNext = Math.sqrt(dx * dx + dy * dy);

            // [FIX] Update direction (simple calculation)
            if (distToNext > 0.000001) {
                this.lastDirection = Math.atan2(dy, dx);
            }

            if (distToNext <= remainingDist) {
                // Reached waypoint: Snap to it and consume distance
                this.position.lat = this.destination.lat;
                this.position.lng = this.destination.lng;
                remainingDist -= distToNext;

                // Move to next point if available
                if (this.pathQueue.length > 0) {
                    this.destination = this.pathQueue.shift()!;
                } else {
                    // Path finished!
                    this.hasArrived = true;
                    this.updateMarkerPosition();

                    const callback = this.onArrive;
                    this.onArrive = () => { };
                    if (typeof callback === 'function') callback(this);

                    return; // Stop moving
                }
            } else {
                // Not enough distance to reach next point: Interpolate
                const ratio = remainingDist / distToNext;
                this.position.lat += dx * ratio;
                this.position.lng += dy * ratio;
                remainingDist = 0;
            }
        }

        this.syncSpatialRegistry();
        this.updateMarkerPosition();
    }

    /** 行军每帧同步空间索引，否则 LegionManager 野战碰撞永远用旧坐标 */
    private syncSpatialRegistry(): void {
        if (!this.spatialRegistry || this.isDestroyed) return;
        const { lat, lng } = this.position;
        if (this.lastRegisteredPos) {
            const dLat = Math.abs(this.lastRegisteredPos.lat - lat);
            const dLng = Math.abs(this.lastRegisteredPos.lng - lng);
            if (dLat < 1e-9 && dLng < 1e-9) return;
            this.spatialRegistry.moveArmy(
                this,
                this.lastRegisteredPos.lat,
                this.lastRegisteredPos.lng,
                lat,
                lng
            );
        } else {
            this.spatialRegistry.registerArmy(this, lat, lng);
        }
        this.lastRegisteredPos = { lat, lng };
    }

    private updateTerrainSpeed(): void {
        const pos = { lat: this.position.lat, lng: this.position.lng };
        this.isOnSea = LandSeaSystem.isSeaAt(pos);

        const terrainKind = this.isOnSea ? 'sea' : (LandTerrainSystem.classifyAt(pos) ?? 'mountain');
        const terrainMult =
            terrainKind === 'sea'
                ? MARCH_SPEED_MULTIPLIERS.TERRAIN.sea
                : terrainKind === 'plain'
                    ? MARCH_SPEED_MULTIPLIERS.TERRAIN.plain
                    : MARCH_SPEED_MULTIPLIERS.TERRAIN.mountain;

        let cavalryMult = 1.0;
        const isTriangleCavalryCulture =
            this.cultureRegion === 'STEPPE' || this.cultureRegion === 'TIBET' || this.cultureRegion === 'WESTERN';
        if (!this.isOnSea && isTriangleCavalryCulture) {
            const preset = MARCH_SPEED_MULTIPLIERS.USE_CONSERVATIVE_CAVALRY_PRESET
                ? MARCH_SPEED_MULTIPLIERS.CAVALRY_LAND.conservative
                : MARCH_SPEED_MULTIPLIERS.CAVALRY_LAND.current;
            cavalryMult = terrainKind === 'plain' ? preset.plain : preset.mountain;
        }

        this.currentTerrainMultiplier = terrainMult * cavalryMult;

        if (this.renderer) {
            this.renderer.isOnSea = this.isOnSea;
        }
    }

    private getSpeed(): number {
        return PLAYER_SPEED_TIERS.UNIFIED_MARCH_SPEED * this.speedMultiplier;
    }

    public setSpeedMultiplier(multiplier: number): void {
        this.speedMultiplier = multiplier || 1.0;
        gameLog('army', `[Army] ${this.name || this.id} speed multiplier set to: ${this.speedMultiplier}`);
    }

    private updateMarkerPosition(): void {
        if (!this.marker && !this.renderer) return;

        if (this.renderer) {
            // Renderer handles its own position updates via game loop or we can notify it
            // In current architecture, renderer tracks army position.
            // But we might need to strictly sync it here if needed.
        }

        // Legacy marker logic removed or simplified
    }

    private rotatePoint(x: number, y: number, angle: number): { lat: number, lng: number } {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return {
            lat: y * cos - x * sin,
            lng: y * sin + x * cos
        };
    }

    public split(amount: number): Army | null {
        if (amount <= 0 || amount >= this.troops) {
            console.warn(`[Army] Invalid split amount: ${amount} (Current: ${this.troops})`);
            return null;
        }

        // Deduct troops
        this.troops -= amount;

        // Create new army (clone properties)
        const newPos = { ...this.position }; // Clone position
        const newArmy = new Army(
            this.map,
            newPos,
            null, // No target initially
            amount,
            this.factionId,
            () => { }, // Dummy onArrive
            undefined, // onBattleTick
            undefined, // destination
            this.name // [USER REQUEST] Keep same name, no suffix
        );
        newArmy.type = this.type; // Inherit type (legion/army)
        newArmy.cultureSlots = this.cultureSlots ? [...this.cultureSlots] : null; // [NEW] Inherit culture slots
        newArmy.cultureScales = this.cultureScales ? [...this.cultureScales] : null; // [NEW] Inherit culture scales

        gameLog('army', `[Army] Splitting ${amount} from ${this.id}. Remaining: ${this.troops}. New Army: ${newArmy.id}`);
        return newArmy;
    }

    public destroy(): void {
        this.isDestroyed = true;
        this.isExternalCombat = false;
        this.isAttacking = false;
        this.currentBattleType = null;
        this.postBattleRestRemaining = 0;
        if (this.renderer) {
            this.renderer.stopAttack();
        }

        // [CRITICAL] Unregister from physics engine to prevent "Ghost Residue"
        if (this.spatialRegistry && this.lastRegisteredPos) {
            gameLog('army', `[Army] Destroying ${this.name || this.id}. Unregistering from (${this.lastRegisteredPos.lat},${this.lastRegisteredPos.lng})`);
            this.spatialRegistry.unregisterArmy(this, this.lastRegisteredPos.lat, this.lastRegisteredPos.lng);
            this.lastRegisteredPos = null;
        }

        if (this.marker) {
            this.marker.remove();
            this.marker = null;
        }
        if (this.label) {
            this.label.remove();
            this.label = null;
        }
        if (this.renderer) {
            const rendererRef = this.renderer;
            rendererRef.destroyTime = Date.now();
            const corpseMs = GameConfig.LEGION.CORPSE_DISPLAY_MS;
            setTimeout(() => {
                rendererRef.destroy();
            }, corpseMs);
            this.renderer = null;
        }

        if (this.type === 'legion' && this.feedAnnihilation && Army.annihilationReporter) {
            const info = this.feedAnnihilation;
            this.feedAnnihilation = undefined;
            Army.annihilationReporter(this, info);
        }
    }

    public getFactionId(): string {
        return this._factionId;
    }

    /** 历史剧本接管军团时统一势力 id（如旧 huaxia → qin） */
    public setFactionId(factionId: string): void {
        if (this._factionId === factionId) return;
        this._factionId = factionId;
        if (this.renderer) {
            this.renderer.factionId = factionId;
        }
    }

    public getTargetCity(): any {
        return this.targetCity;
    }

    public getTroops(): number {
        return this.troops;
    }

    public getInitialTroops(): number {
        return this.initialTroops;
    }

    public setTroops(troops: number): void {
        this.troops = troops;
        if (this.label) {
            // Label update logic...
            // Kept for minimizing diff but practically unused if label is null
        }
    }

    public setOnArriveCallback(callback: (army: Army) => void): void {
        this.onArrive = callback;
        this.hasArrived = false;
    }

    // Resume Logic
    private savedPathQueue: LatLng[] = [];
    private savedDestination: LatLng | null = null;
    private savedTargetCity: any = null;

    /** 立即停止行军；saveState=true 时写入战前道路存档（规则见 march/marchStopPolicy.ts） */
    public stopMovement(saveState: boolean = false): void {
        if (saveState) {
            const prevLen = this.savedPathQueue.length;
            const snapshot = captureMarchSaveSnapshot(
                this.pathQueue,
                this.destination,
                this.targetCity,
                {
                    savedPathQueue: this.savedPathQueue,
                    savedDestination: this.savedDestination,
                    savedTargetCity: this.savedTargetCity,
                }
            );
            this.savedPathQueue = snapshot.savedPathQueue;
            this.savedDestination = snapshot.savedDestination;
            this.savedTargetCity = snapshot.savedTargetCity;
            if (this.pathQueue.length > 0 || (snapshot.savedPathQueue.length > 0 && prevLen === 0)) {
                gameLog(
                    'army',
                    `[Army] Stopped movement and SAVED state. Path length: ${snapshot.savedPathQueue.length}`
                );
            }
        } else {
            const cleared = emptyMarchSaveSnapshot();
            this.savedPathQueue = cleared.savedPathQueue;
            this.savedDestination = cleared.savedDestination;
            this.savedTargetCity = cleared.savedTargetCity;
        }

        this.pathQueue = [];

        this.destination = { ...this.position };
        this.hasArrived = true;

        // [FIX] Synchronize physics registry with position
        if (this.spatialRegistry) {
            if (this.lastRegisteredPos) {
                this.spatialRegistry.moveArmy(this, this.lastRegisteredPos.lat, this.lastRegisteredPos.lng, this.position.lat, this.position.lng);
            } else {
                this.spatialRegistry.registerArmy(this, this.position.lat, this.position.lng);
            }
            this.lastRegisteredPos = { lat: this.position.lat, lng: this.position.lng };
        }

        this.updateMarkerPosition();
    }

    public hasSavedMarchState(): boolean {
        return !!(this.savedDestination || this.savedPathQueue.length > 0);
    }

    public getSavedMarchTargetCityId(): string | undefined {
        return this.savedTargetCity?.id;
    }

    public clearSavedMarchState(): void {
        this.savedPathQueue = [];
        this.savedDestination = null;
        this.savedTargetCity = null;
    }

    /** 战前保存的完整路径预览（恢复前） */
    public buildMarchDisplayPath(): LatLng[] {
        const pos = this.getPosition();
        if (!this.savedDestination && this.savedPathQueue.length === 0) {
            return [pos];
        }
        const path: LatLng[] = [pos];
        if (this.savedDestination) {
            path.push({ ...this.savedDestination });
        }
        path.push(...this.savedPathQueue.map((p) => ({ ...p })));
        return path;
    }

    /**
     * [NEW] Resume movement from saved state (if any)
     * Returns true if resumed, false if no saved state
     */
    public resumeMovement(): boolean {
        if (!this.savedDestination && this.savedPathQueue.length === 0) {
            return false;
        }

        gameLog('army', `[Army] ${this.name} 恢复战前道路行军，剩余 ${this.savedPathQueue.length + 1} 段`);
        this.destination = this.savedDestination
            ? { ...this.savedDestination }
            : { ...this.savedPathQueue.shift()! };
        this.pathQueue = this.savedPathQueue.map((p) => ({ ...p }));
        this.hasArrived = false;

        this.savedDestination = null;
        this.savedPathQueue = [];
        this.savedTargetCity = null;

        this.updateMarkerPosition();
        return true;
    }

    public moveAlongPath(path: LatLng[]): void {
        if (path.length === 0) return;

        // clone to avoid side effects
        const newPath = [...path];
        this.destination = newPath.shift()!;
        this.pathQueue = newPath;
        this.hasArrived = false;

        // Update marker rotation immediately
        this.updateMarkerPosition();
    }

    public getRenderer() {
        return this.renderer;
    }

    public setPosition(lat: number, lng: number): void {
        this.position.lat = lat;
        this.position.lng = lng;

        // [FIX] Sync with physics engine
        if (this.spatialRegistry) {
            if (this.lastRegisteredPos) {
                this.spatialRegistry.moveArmy(this, this.lastRegisteredPos.lat, this.lastRegisteredPos.lng, lat, lng);
            } else {
                this.spatialRegistry.registerArmy(this, lat, lng);
            }
            this.lastRegisteredPos = { lat, lng };
        }

        this.updateMarkerPosition();
    }

    // [IBattleUnit] 野战/攻城由 CombatSystem 驱动；必须在此收尾战斗姿态
    public onBattleStart = (_opponent: IBattleUnit, battleType: 'siege' | 'field'): void => {
        const opponentPos = _opponent.getPosition();
        this.setCombatState(true, battleType, opponentPos);
        // 停步与路径存档由 LegionManager/SiegeManager 开战前完成；勿再 stopMovement 以免空队列覆写 savedPathQueue
    };

    public onBattleEnd = (result: 'victory' | 'defeat', _opponent: IBattleUnit, _enemyKilled: number): void => {
        if (this.isDestroyed) return;
        if (result === 'victory') {
            this.setCombatState(false);
        } else {
            this.clearExternalCombatState();
        }
    };

    // [IBattleUnit Implementation]
    public get unitType(): import('../combat/CombatSystem').UnitType {
        return 'army'; // 明确作为 army 类型
    }

    // Morale System
    public morale: number = 100;
    public maxMorale: number = 100;

    public setMorale(value: number): void {
        this.morale = Math.max(0, Math.min(this.maxMorale, value));
    }

    public get maxTroops(): number {
        return this.initialTroops;
    }

    // 显式实现 getPosition 以匹配 IBattleUnit (返回 {lat, lng})
    // getPosition() 已经存在并返回 LatLng (兼容)

    public setTargetCity(city: any): void {
        this.targetCity = city;
    }
}
