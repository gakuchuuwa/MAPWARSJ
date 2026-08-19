import L from 'leaflet';
import { GameMap } from '../map/GameMap';
import { LatLng } from '../types/core';
import { GridSystem } from '../systems/GridSystem';
import { TerrainSpeedSystem, TERRAIN_SPEED_CONFIG } from '../core/TerrainSpeedSystem';
import { LandSeaSystem, LandTerrainSystem } from '../world/land-sea';
import { UnitRenderer } from '../map/UnitRenderer';
import { getGlobalUnitRenderer } from '../map/UnitRenderer';
import {
    GameConfig,
    LAND_TERRAIN_FLIP_CONFIRM_FRAMES,
    MOVEMENT_MATRIX,
    PLAYER_SPEED_TIERS,
    SEA_SPEED_MULTIPLIER,
    TERRAIN_SPEED_LERP_TAU_SEC,
} from '../config/GameConfig';
import { GameTime } from '../app/GameTime';
import { LegionType, getUnitTypeConfig } from '../types/UnitTypes';
import type { RegionType } from '../systems/RegionSystem';

import { IBattleUnit } from '../combat/CombatSystem';
import { gameLog } from '../utils/GameLogger';
import { getRandomFactionPortrait } from '../config/portrait_defaults';
import type { StrategicEffect } from '../data/GeneralSkills';
import {
    getGeneralMarchSpeedMultiplier,
    generalHasStrategicEffect,
    emitFollowedGeneralStrategicMapFx,
    emitFollowedVisionStrategicFxOnMarch,
    tryEmitPostBattleResumeStrategicFx,
    clearStrategicSkillOverride,
} from '../combat/GeneralSkillCombat';
import { captureMarchSaveSnapshot, emptyMarchSaveSnapshot } from './march/marchStopPolicy';
import { getFollowedArmyId } from '../utils/MapFloatingText';
import { getCultureMovementClass, isCultureCavalryOnly, type FormationMode } from '../types/CultureFormations';
import { getNavalShipAssetId, type NavalShipAssetId } from '../types/NavalShipTiers';
import { isDeployHeld } from './DeployGate';

export class Army implements IBattleUnit {
    private map: GameMap;
    private position: LatLng;
    private destination: LatLng;
    private targetCity: any;
    /** 攻城目标城 id（SiegeManager 攻城开始时对主攻+参战攻方设置；战斗结束不清——城破后 5s 城图缩回窗口
     *  外推仍需反查城图，残留由 isCitySiegeZoomed 判定自然兜底；GlobalUnitRenderer 攻城外推反查城图用，2026-08-04 修复外推死代码） */
    public siegeTargetCityId: string | null = null;
    public troops: number; // [IBattleUnit] Must be public
    private _factionId: string;
    private onArrive: (army: Army) => void;

    /** 事件链攻城任务的完成回调：只在最终目标城之战结束时触发（途中 hop 战不触发） */
    public siegeMissionComplete: (() => void) | null = null;

    /** 大乱斗军情：全军覆没播报（destroy 时触发）。kind='field'/'siege_attacker' 时语音由「野战败/攻城失败」接管，覆没语音跳过 */
    public feedAnnihilation?: { side: 'attacker' | 'defender'; cityName: string; kind?: 'siege' | 'field' | 'siege_attacker'; battleSkillId?: string | null };

    private static annihilationReporter?: (
        army: Army,
        info: { side: 'attacker' | 'defender'; cityName: string; kind?: 'siege' | 'field' | 'siege_attacker'; battleSkillId?: string | null }
    ) => void;

    public static setAnnihilationReporter(
        reporter: ((army: Army, info: { side: 'attacker' | 'defender'; cityName: string; kind?: 'siege' | 'field' | 'siege_attacker'; battleSkillId?: string | null }) => void) | null
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
    /** 实际用于位移的地形倍率（平滑后） */
    private currentTerrainMultiplier: number = 1.0;
    /** 查表目标倍率；current 以 tau 追赶，避免平原↔山地瞬间 2× 窜 */
    private terrainSpeedTarget: number = 1.0;
    /** 已确认的陆地地形（滞回后）；null = 尚未初始化 */
    private confirmedLandKind: 'plain' | 'mountain' | null = null;
    private landFlipFrames: number = 0;
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
    /** 本战攻城前已触发的纵横技，战后开拔前 pulse */
    private pendingPostBattleDiplomacyFx: StrategicEffect[] = [];

    // [NEW] IAnimatedUnit Interface Compatibility
    public isAttacking: boolean = false;
    public currentBattleType: 'siege' | 'field' | null = null;
    public isSiegeAttacker: boolean = false; // 攻城方才有器械
    public targetPos: { lat: number; lng: number } | null = null;
    public lastPosition: { lat: number; lng: number } = { lat: 0, lng: 0 };
    public lastDirection: number = 0; // Cache direction
    public lastPath: { lat: number; lng: number }[] = []; // [Siege Fix] Path history

    /**
     * 锚点滞回状态：上一次决策用的是「老家锚点」吗（见 LegionBehaviors 的 ANCHOR_HYSTERESIS_*）。
     * undefined = 还没决策过，按当前兵力直接判。
     */
    public usingHomeAnchor?: boolean;
    /**
     * 【目标失效重抽·继承原方向】刚刚失效（被友军抢占/消失）的目标城 id。
     * HasTarget 判定失效时写入，紧接着那一次 FindTarget 用完即清（见 AGENTS.md 规则 3.6）。
     * 作用：本来奔那个方向走了一半，目标没了就打那附近的，别当场调头往回走。
     */
    public lastLostTargetCityId?: string;
    /** 当前位置是否在海域 hex（WATER/OCEAN），用于海上船贴图（已去抖，见 updateTerrainSpeed） */
    public isOnSea: boolean = false;
    /** 反向判定已累计走过的距离（度）；见 updateTerrainSpeed 的翻转闸 */
    private seaFlipDist: number = 0;
    /** 反向判定已持续的游戏秒（原地不动时的兜底） */
    private seaFlipElapsed: number = 0;
    /** 上一次海陆采样时的位置，用来算每帧位移 */
    private prevSeaCheckPos: { lat: number; lng: number } | null = null;
    /**
     * 海陆翻转确认距离（度，≈22km）——「频繁水军陆军切换」的主闸。
     *
     * [2026-08-04 按实际行军速度标定] 军团速度 UNIFIED_MARCH_SPEED=0.2 **度/游戏秒**，
     * 即约 22km/游戏秒。原判据是「连续 8 帧」：60fps 下仅 0.13 游戏秒 ≈ 2.9km，
     * 于是海岸线附近只要出现超过 3km 的连续水域就翻一次 ⇒ 方阵↔船来回横跳。
     *
     * 改用「距离」而非帧数/时间：既不受帧率影响，也不受时间倍率影响——军团必须**真的走进**
     * 新介质这么远才认账。沿岸行军时那种几百米~几公里的海陆交替（掩膜 z9 精度约 300m）
     * 永远攒不满，一次都不会翻。
     *
     * 代价：短于此距离的渡海（<22km 的窄海峡）不会变水军，军团按陆军样式走过去。
     * 主人 2026-08-04 定：宁可这样，也不要频繁切换。要更早变船就调小这个值。
     */
    private static readonly SEA_FLIP_CONFIRM_DEG = 0.20;
    /**
     * 时间兜底（游戏秒）：原地不动/极慢移动的军团攒不出距离，靠它保证最终仍会翻。
     * 对行军中的军团不起作用（22km/游戏秒 下，距离闸远早于它满足）。
     */
    private static readonly SEA_FLIP_CONFIRM_SEC = 3.0;
    /**
     * 海上船型锁（2026-07-06）：登船那一刻按兵力定好小/中/大船，锁定整个航程；
     * 上岸清空，下次登船再按当时兵力重定。避免航行中折损跨过兵力档位、船贴图当场缩水的怪象。
     */
    public navalShipTierLock: NavalShipAssetId | null = null;

    // [NEW] Home City ID (One Legion Per City Rule)
    public homeCityId: string | null = null;

    /**
     * 远征目标城（GAME_DIRECTION「远征细则」2026-06-11）：
     * 非 null = 远征军团——目标锁死该城、绝不回头（家城被打/失守都不回），直至占领或全军覆没；
     * null = 据点军团（近 3 敌城抽签；家城正被攻城则回援、已失守则强制回师收复）。
     * 仅跟拍军团可被玩家下达远征指令（ExpeditionUI），AI 不会自行远征。
     */
    public expeditionTargetCityId: string | null = null;
    /** 远征前军团原名；功成保留番号后清空；仅目标异常时用于恢复 */
    public expeditionSavedName: string | null = null;
    /**
     * 远征资格滞回锁（2026-07-06 修复"按钮一闪就没"）：
     * 跟拍军团兵力达到过 UNLOCK_TROOPS（5 万）即置 true，此后即便战斗掉破仍保留可远征资格，
     * 直至真正发起远征 / 全军覆没 / 被打到低于半数（见 ExpeditionUI.eligibleArmy）才重置。
     * 解决"军团边打边掉血、瞬时判定让远征按钮反复闪现、点不到"的问题。
     */
    public expeditionUnlocked: boolean = false;

    /**
     * 行军减兵（远输困境）：自最后一次途经己方据点半径以来的游戏秒数（时间口径·一视同仁）。
     * LegionManager 主循环每帧累加（战斗中照走、战后休整停表；远征豁免军团不走表），
     * 途经任一己方据点 RESET_RADIUS_KM 内清零；split 时子军团继承（防拆分刷补给漏洞）。
     */
    public timeSinceSupply: number = 0;
    /**
     * 行军减兵整跳计时：断粮后向下一跳累计的游戏秒数，攒满 ATTRITION_CHUNK_SEC 扣一整跳。
     * 战斗/休整期间不累计（扣减暂停）；split 时子军团继承（防拆分刷补给漏洞）。
     */
    public attritionChunkSec: number = 0;

    // [NEW] Source City ID (One Legion Per City Rule)
    private sourceCityId: string | null = null;
    
    // [NEW] Morale System: First Sortie
    public hasFoughtSinceDepart: boolean = false;
    public get isFirstSortieSinceDepart(): boolean {
        return !this.hasFoughtSinceDepart;
    }

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
        if (!isFighting) {
            this.isSiegeAttacker = false; // 战斗结束清器械标记
            // 注意：siegeTargetCityId 不清——城破后 5s 城图缩回窗口内，GlobalUnitRenderer 外推
            // 仍需它反查城图（城图放大态判定），避免军团压进放大中的城图（2026-08-04 主人截图实锤）。
            // 残留无害：外推的 siegeActive 分支要 currentBattleType==='siege'，cityZoomed 分支要
            // isCitySiegeZoomed=true，两者都不满足时自然失效。
        }
        const validTarget = targetPos
            && Number.isFinite(targetPos.lat)
            && Number.isFinite(targetPos.lng)
            ? targetPos
            : null;
        this.targetPos = validTarget;

        // 神出鬼没：战斗开始现形；战斗结束不立即隐藏，等再次移动时隐身（与脉冲同步）
        if (isFighting && generalHasStrategicEffect(this, 'hide_during_peacetime')) {
            this.setVisible(true);
            getGlobalUnitRenderer()?.invalidateView();
        }

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
            // 行军减兵：战斗胜利 = 就地进行补给，重新计时（主人裁定 2026-07-21）
            this.timeSinceSupply = 0;
            this.attritionChunkSec = 0;
            if (!this.isPostBattleResting()) {
                this.tryEmitPostBattleResumeFx();
            }
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
        // siegeTargetCityId 不清（理由见 setCombatState：城破后 5s 外推仍需反查城图）
        if (this.marker) {
            const element = this.marker.getElement();
            if (element) element.classList.remove('army-combat');
        }
        if (this.renderer) {
            this.renderer.stopAttack();
        }
        // 神出鬼没：等再次移动时隐身，此处不立即隐藏
    }

    public isIdle(): boolean {
        // Army is idle only if not fighting AND has arrived at destination
        return !this.isExternalCombat && this.hasArrived;
    }

    public getIsInCombat(): boolean {
        return this.isExternalCombat;
    }

    public isMarching(): boolean {
        return !this.isDestroyed
            && !this.isExternalCombat
            && !this.hasArrived
            && !this.isBlocked()
            && !this.isPostBattleResting();
    }

    /** 纯骑部队（三角阵文化）——与行军提速判定同口径，用于区分行军音效 */
    public isCavalryArmy(): boolean {
        return this.cultureRegion ? isCultureCavalryOnly(this.cultureRegion) : false;
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
        if (generalHasStrategicEffect(this, 'skip_post_battle_rest')) {
            gameLog('army', `🏃 [Army] ${this.name} 【乘胜追击】胜后免休整，立即开拔`);
            return;
        }
        this.postBattleRestRemaining = durationSec;
        gameLog('army', `⏸️ [Army] ${this.name} 战胜驻留 ${durationSec}s 游戏时间`);
    }

    public isPostBattleResting(): boolean {
        return this.postBattleRestRemaining > 0;
    }

    public clearPostBattleRest(): void {
        this.postBattleRestRemaining = 0;
    }

    /** 攻城战前纵横技已触发，战后开拔前再 pulse */
    public markPendingPostBattleDiplomacyFx(effect: StrategicEffect): void {
        if (!this.pendingPostBattleDiplomacyFx.includes(effect)) {
            this.pendingPostBattleDiplomacyFx.push(effect);
        }
    }

    private drainPendingPostBattleDiplomacyFx(): StrategicEffect[] {
        const pending = this.pendingPostBattleDiplomacyFx;
        this.pendingPostBattleDiplomacyFx = [];
        return pending;
    }

    /** 战后休整结束或免休整：纵横技 pulse；视野技统一在实际恢复行军时触发 */
    private tryEmitPostBattleResumeFx(): void {
        const { lat, lng } = this.position;
        tryEmitPostBattleResumeStrategicFx(
            this,
            lat,
            lng,
            this.drainPendingPostBattleDiplomacyFx(),
        );
    }

    public getMaxTroops(): number {
        return this.initialTroops;
    }

    public addTroops(amount: number): void {
        const cap = this.initialTroops;
        const space = cap - this.troops;
        const actualAdd = Math.min(amount, space);

        if (actualAdd > 0) {
            this.setTroops(this.troops + actualAdd);
        }
    }
    private initialTroops: number = 0;

    public id: string;
    public type: string = 'army'; // For compatibility
    public legionType: LegionType = 'infantry';
    public cultureSlots: string[] | null = null; // [NEW] 14 文化阵型 slot 类型列表
    public cultureScales: number[] | null = null; // [NEW] 自定义单位缩放列表
    /** 三值阵型（square 鱼鳞 / triangle 三角 / echelon 雁行）；渲染层据此定布局 */
    public formationMode: FormationMode | null = null;
    /** 军团文化区：用于三角纯骑行军加成（STEPPE/TIBET/CENTRAL_ASIA） */
    public cultureRegion: RegionType | null = null;
    public name: string; // [IBattleUnit]
    public generalId?: string; // [NEW] UI Avatar ID
    public portraitPath?: string; // [NEW] 军队创建时随机固定立绘
    /** 精锐军团（精锐番号 + 名将 + 战力加成）；≥4万必精锐，<4万 50% 概率。出生定，不降级 */
    public isElite: boolean = false;
    /** 解散标记（区别于战死 destroy）：disband() 设 true，removeArmy 据此判定是否触发战败冷却 */
    public wasDisbanded: boolean = false;
    /** 撤退意图锁：兵力 < DISBAND_TROOP_THRESHOLD 后锁定，途中补兵不掉头，抵家解散或老家沦陷才解除 */
    public isRetreatingHome: boolean = false;

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

        // 开局集结期：全军在都城列阵待命，不移动（见 DeployGate）。
        // 到点由时间自动放行，不依赖回调，因此不会把军团永久钉死。
        if (isDeployHeld()) return;

        this.updateTerrainSpeed(deltaTime);

        if (this.postBattleRestRemaining > 0) {
            this.postBattleRestRemaining = Math.max(0, this.postBattleRestRemaining - deltaTime);
            if (this.postBattleRestRemaining === 0) {
                if (this.id === getFollowedArmyId()) {
                    const { lat, lng } = this.position;
                    if (generalHasStrategicEffect(this, 'march_speed_mult')) {
                        emitFollowedGeneralStrategicMapFx(this, 'march_speed_mult', lat, lng, 'pulse', { dedupeMs: 5000, dedupeKey: `${this.id}|march_speed|rest_end` });
                    } else if (generalHasStrategicEffect(this, 'mountain_march_immunity')) {
                        emitFollowedGeneralStrategicMapFx(this, 'mountain_march_immunity', lat, lng, 'pulse', { dedupeMs: 5000, dedupeKey: `${this.id}|mountain|rest_end` });
                    }
                    this.tryEmitPostBattleResumeFx();
                }
            }
        }
        if (this.isPostBattleResting()) return;

        if (this.pathQueue.length === 0 && this.hasArrived) return;
        if (this.isBlocked()) return;

        // 坐标或路点已坏：停步，避免 NaN 继续污染并拖垮地图渲染
        if (!Number.isFinite(this.position.lat) || !Number.isFinite(this.position.lng)
            || !Number.isFinite(this.destination.lat) || !Number.isFinite(this.destination.lng)) {
            this.pathQueue = [];
            this.hasArrived = true;
            if (Number.isFinite(this.lastPosition.lat) && Number.isFinite(this.lastPosition.lng)) {
                this.position.lat = this.lastPosition.lat;
                this.position.lng = this.lastPosition.lng;
            }
            this.destination = { ...this.position };
            return;
        }

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

    /**
     * 更新海陆贴图 + 地形速度目标；实际倍率对目标做指数平滑。
     * @param deltaTime 游戏秒；≤0（构造/瞬移）时直接贴齐目标，不 lerp
     */
    private updateTerrainSpeed(deltaTime: number = 0): void {
        const pos = { lat: this.position.lat, lng: this.position.lng };
        const wasOnSea = this.isOnSea;

        // 海陆贴图去抖（主人 2026-08-04 定：宁可迟钝也不要频繁切换）：
        // 军团沿海岸线行军时 isSeaAt 会在海/陆边界反复变化，直接赋值会让贴图在陆军方阵↔三船阵
        // 之间来回横跳。改为「反向判定必须累计走出 SEA_FLIP_CONFIRM_DEG 的路程」才翻转，
        // 外加一个纯时间兜底给原地不动的军团。判据本身（哪里是海）一点没动，只改多久才认账。
        const step = this.prevSeaCheckPos
            ? Math.hypot(pos.lat - this.prevSeaCheckPos.lat, pos.lng - this.prevSeaCheckPos.lng)
            : 0;
        this.prevSeaCheckPos = { lat: pos.lat, lng: pos.lng };

        const rawSea = LandSeaSystem.isSeaAt(pos);
        if (rawSea === this.isOnSea) {
            // 判定与当前状态一致 → 清零（稳定态不累积，真正下海/上岸时无额外延迟）
            this.seaFlipDist = 0;
            this.seaFlipElapsed = 0;
        } else {
            this.seaFlipDist += step;
            this.seaFlipElapsed += Math.max(0, deltaTime);
            if (
                this.seaFlipDist >= Army.SEA_FLIP_CONFIRM_DEG
                || this.seaFlipElapsed >= Army.SEA_FLIP_CONFIRM_SEC
            ) {
                this.isOnSea = rawSea;
                this.seaFlipDist = 0;
                this.seaFlipElapsed = 0;
            }
        }

        // 船型锁：登船（上岸→海）当刻按兵力定船，锁定整航程；上岸清空。
        //   （已在海上却无锁，如中途注册的情形，也补一次锁，防回退到实时算法闪图。）
        if (this.isOnSea) {
            if (!wasOnSea || this.navalShipTierLock === null) {
                this.navalShipTierLock = getNavalShipAssetId(this.getTroops());
            }
        } else if (this.navalShipTierLock !== null) {
            this.navalShipTierLock = null;
        }

        // 水域：登船后全军统一速度（兵种加成失效）
        if (this.isOnSea) {
            this.terrainSpeedTarget = SEA_SPEED_MULTIPLIER;
            this.confirmedLandKind = null;
            this.landFlipFrames = 0;
        } else {
            // 陆地：四系 × 平原/山地；如履平地 → 山地按平原格查表
            const rawLand = LandTerrainSystem.classifyAt(pos) ?? 'mountain';
            const desiredKind: 'plain' | 'mountain' =
                rawLand === 'mountain'
                && generalHasStrategicEffect(this, 'mountain_march_immunity')
                    ? 'plain'
                    : rawLand === 'plain'
                        ? 'plain'
                        : 'mountain';

            // 平原/山地滞回：边界 hex 抖动时不立刻改目标倍率（与海陆去抖同思路）
            if (this.confirmedLandKind === null) {
                this.confirmedLandKind = desiredKind;
                this.landFlipFrames = 0;
            } else if (desiredKind === this.confirmedLandKind) {
                this.landFlipFrames = 0;
            } else if (++this.landFlipFrames >= LAND_TERRAIN_FLIP_CONFIRM_FRAMES) {
                this.confirmedLandKind = desiredKind;
                this.landFlipFrames = 0;
            }

            const moveClass = this.cultureRegion
                ? getCultureMovementClass(this.cultureRegion)
                : 'MIXED';
            this.terrainSpeedTarget = MOVEMENT_MATRIX[moveClass][this.confirmedLandKind];
        }

        // 平滑：约 TERRAIN_SPEED_LERP_TAU_SEC 内贴近目标；构造/瞬移 deltaTime≤0 则贴齐
        if (deltaTime <= 0) {
            this.currentTerrainMultiplier = this.terrainSpeedTarget;
        } else {
            const t = 1 - Math.exp(-deltaTime / TERRAIN_SPEED_LERP_TAU_SEC);
            this.currentTerrainMultiplier +=
                (this.terrainSpeedTarget - this.currentTerrainMultiplier) * t;
        }

        if (this.renderer) {
            this.renderer.isOnSea = this.isOnSea;
            this.renderer.navalShipTierLock = this.navalShipTierLock;
        }
    }

    private getSpeed(): number {
        const regionSpeedMult = this.cultureRegion
            ? (GameConfig.CULTURE_COMBAT.SPEED_TABLE[this.cultureRegion] ?? 1.0)
            : 1.0;
        return (
            PLAYER_SPEED_TIERS.UNIFIED_MARCH_SPEED
            * this.speedMultiplier
            * getGeneralMarchSpeedMultiplier(this)
            * regionSpeedMult
        );
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
        newArmy.formationMode = this.formationMode; // [NEW] Inherit formation mode
        newArmy.cultureRegion = this.cultureRegion; // [NEW] Inherit culture region (三角纯骑加成)
        // 行军减兵：子军团继承父军团断粮计时（防拆分刷补给漏洞；小数累加器不复制，<1 兵无刷取空间）
        newArmy.timeSinceSupply = this.timeSinceSupply;
        newArmy.attritionChunkSec = this.attritionChunkSec;

        gameLog('army', `[Army] Splitting ${amount} from ${this.id}. Remaining: ${this.troops}. New Army: ${newArmy.id}`);
        return newArmy;
    }

    /** 解散：兵力已并入出发城，军团立即消失（无尸体、无覆没播报；区别于战死的 destroy） */
    public disband(): void {
        this.wasDisbanded = true;
        this.isDestroyed = true;
        this.isExternalCombat = false;
        this.isAttacking = false;
        this.currentBattleType = null;
        this.postBattleRestRemaining = 0;
        if (this.renderer) {
            this.renderer.stopAttack();
        }
        if (this.spatialRegistry && this.lastRegisteredPos) {
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
            this.renderer.destroy();
            this.renderer = null;
        }
    }

    public destroy(): void {
        this.isDestroyed = true;
        // 清掉运行时战略技 override 与「已脉冲」记录：否则 Map/Set 只增不减，
        // 且军团 id 若被复用，新军团会继承前任随机到的技。
        clearStrategicSkillOverride(this.id);
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
            // 尸体必须可见：战败前 resume/神出鬼没可能已把 visible 关掉
            rendererRef.visible = true;
            rendererRef.destroyTime = Date.now();
            getGlobalUnitRenderer()?.invalidateView();
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

    /** 事件链接管军团时统一势力 id（如旧 huaxia → qin） */
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
        let next = Math.max(0, Math.floor(troops));
        this.troops = next;
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

        // 三种视野技统一于恢复行军时起效并 pulse
        if (generalHasStrategicEffect(this, 'hide_during_peacetime')) {
            this.setVisible(false);
            getGlobalUnitRenderer()?.invalidateView();
        }
        emitFollowedVisionStrategicFxOnMarch(this, this.position.lat, this.position.lng);

        this.updateMarkerPosition();
        return true;
    }

    public moveAlongPath(path: LatLng[]): void {
        if (path.length === 0) return;

        // clone to avoid side effects；滤掉坏点，避免一路写进 NaN
        const newPath = path.filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng));
        if (newPath.length === 0) return;
        this.destination = newPath.shift()!;
        this.pathQueue = newPath;
        this.hasArrived = false;

        // 三种视野技统一于开始行军时起效并 pulse
        if (generalHasStrategicEffect(this, 'hide_during_peacetime')) {
            this.setVisible(false);
            getGlobalUnitRenderer()?.invalidateView();
        }
        emitFollowedVisionStrategicFxOnMarch(this, this.position.lat, this.position.lng);

        // Update marker rotation immediately
        this.updateMarkerPosition();
    }

    public getRenderer() {
        return this.renderer;
    }

    /**
     * 硬设坐标。若仍在行军（pathQueue 非空），先停步并清空路径，避免传送后沿旧路点蠕动/卡死。
     * 战前道路存档请调用方用 stopMovement(true) 自行处理；此处不写存档。
     */
    public setPosition(lat: number, lng: number): void {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        if (!this.hasArrived || this.pathQueue.length > 0) {
            this.pathQueue = [];
            this.hasArrived = true;
            this.destination = { lat, lng };
        }
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
    public winStreak: number = 0;

    public onBattleStart = (_opponent: IBattleUnit, battleType: 'siege' | 'field'): void => {
        const opponentPos = _opponent.getPosition();
        this.setCombatState(true, battleType, opponentPos);
        // 停步与路径存档由 LegionManager/SiegeManager 开战前完成；勿再 stopMovement 以免空队列覆写 savedPathQueue
    };

    public onBattleEnd = (result: 'victory' | 'defeat', _opponent: IBattleUnit, _enemyKilled: number): void => {
        // [Morale] First Sortie ends after the first battle
        this.hasFoughtSinceDepart = true;
        if (result === 'victory') {
            this.winStreak = (this.winStreak || 0) + 1;
        } else {
            this.winStreak = 0;
        }
        if (this.isDestroyed) return;
        // 攻城战后：战前存档路径的终点 = 刚打完的城锚点，恢复它 = 打完先进城再走。
        // 必须清存档让行为树重新选目标 → moveLegionToCity 走「来路折返」直接去下一个目标。
        // （currentBattleType 会在 setCombatState(false) 时被清空，须先读。）
        const wasSiegeBattle = this.currentBattleType === 'siege';
        if (result === 'victory') {
            this.setCombatState(false);
            if (wasSiegeBattle) {
                this.clearSavedMarchState();
                gameLog('army', `[Army] ${this.name} 攻城胜后清战前路径存档，由行为树重新选目标（不再先进城）`);
            } else {
                this.resumeMovement();
            }
        } else {
            // 战败：只清战斗态。即将 destroy 留 15s 尸体，禁止 resume（会触发隐身/清档）
            this.clearExternalCombatState();
        }
    };

    // [IBattleUnit Implementation]
    public get unitType(): import('../combat/CombatSystem').UnitType {
        return 'army'; // 明确作为 army 类型
    }

    /** 战略技门禁需由 IBattleUnit 取回实际军团实体。 */
    public getEntity(): Army {
        return this;
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
