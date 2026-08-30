import L from 'leaflet';
import { GameMap } from './GameMap';
import { GlobalUnitRenderer, IAnimatedUnit } from './GlobalUnitRenderer';
import { LegionType } from '../types/UnitTypes';
import { GameConfig } from '../config/GameConfig';
import type { NavalShipAssetId } from '../types/NavalShipTiers';
import type { FormationMode } from '../types/CultureFormations';

export interface IRenderable {
    getPosition(): { lat: number; lng: number };
    getTroops(): number;
    isDestroyed: boolean;
    name?: string; // [NEW] Optional name: "Legion Name"
}

// Singleton reference to the global renderer
let globalRenderer: GlobalUnitRenderer | null = null;

export function initializeGlobalUnitRenderer(gameMap: GameMap): GlobalUnitRenderer {
    if (!globalRenderer) {
        globalRenderer = new GlobalUnitRenderer(gameMap);
    }
    return globalRenderer;
}

export function getGlobalUnitRenderer(): GlobalUnitRenderer | null {
    return globalRenderer;
}

/**
 * UnitRenderer - Now a lightweight state container that registers with GlobalUnitRenderer
 */
export class UnitRenderer implements IAnimatedUnit {
    private map: L.Map;
    private unit: IRenderable;
    public factionId?: string;

    // State Flags
    public isAttacking: boolean = false;
    public isMoving: boolean = false;
    /** 海域 hex 上显示船贴图（由 Army.updateTerrainSpeed 同步） */
    public isOnSea: boolean = false;
    /** 登船时锁定的船型（小/中/大），由 Army.updateTerrainSpeed 同步；null=按实时兵力算 */
    public navalShipTierLock: NavalShipAssetId | null = null;

    // Battle Info
    public currentBattleType: 'siege' | 'field' | null = null;
    public targetPos: { lat: number; lng: number } | null = null;
    public lastDamageTime?: number; // [NEW]
    public isPlayer: boolean = false; // [NEW] Track player control

    // Movement Tracking
    public lastPosition: { lat: number; lng: number };
    /** 阵亡时刻（供 GlobalUnitRenderer 保留尸体） */
    public destroyTime?: number;
    /** 非战死消失（回城解散、隐匿）的渐隐起点与时长 */
    public fadeOutStart?: number;
    public fadeOutDurationMs?: number;
    private fadeOutTimer?: ReturnType<typeof setTimeout>;

    // Optional identifiers
    public id?: string;
    public type?: string;
    // [FIX] name is now a getter, see below
    public legionType?: LegionType; // [UNIT SYSTEM] 兵种类型

    constructor(gameMap: GameMap, unit: IRenderable, zIndex: string = '999', factionId?: string) {
        this.map = gameMap.getLeafletMap();
        this.unit = unit;
        this.factionId = factionId;

        this.isPlayer = false;

        const pos = unit.getPosition();
        this.lastPosition = { lat: pos.lat, lng: pos.lng };

        // Copy identifiers
        this.id = (unit as any).id;
        this.type = (unit as any).type;
        // [FIX] Don't copy name here - use getter instead to get live value
        this.legionType = (unit as any).legionType; // [UNIT SYSTEM] 兵种类型

        // Register with global renderer
        if (globalRenderer) {
            globalRenderer.register(this);
            if (GameConfig.LOG.UNIT_REGISTER) {
                console.log(`✅ [UnitRenderer] Registered ${this.id} (${unit.name}) with GlobalRenderer`);
            }
        } else {
            console.warn(`⚠️ [UnitRenderer] GlobalRenderer not ready for ${this.id}. Using retry...`);
            // Retry registration
            setTimeout(() => {
                if (globalRenderer) {
                    globalRenderer.register(this);
                    if (GameConfig.LOG.UNIT_REGISTER) {
                        console.log(`✅ [UnitRenderer] Retry Registration Successful for ${this.id}`);
                    }
                } else {
                    console.error(`❌ [UnitRenderer] Failed to register ${this.id}: GlobalRenderer still missing.`);
                }
            }, 1000);
        }
    }

    // [FIX] Use getter to always return the current unit.name
    public get name(): string | undefined {
        return this.unit.name;
    }

    public get generalId(): string | undefined {
        return (this.unit as any).generalId;
    }

    public get cultureSlots(): string[] | null {
        return (this.unit as any).cultureSlots || null;
    }

    public get cultureScales(): number[] | null {
        return (this.unit as any).cultureScales || null;
    }

    /** 五阵型（triangle/echelon/fish_scale/crane_wing/square），委托底层 Army；渲染层据此定布局 */
    public get formationMode(): FormationMode | null {
        return (this.unit as any).formationMode ?? null;
    }

    /** 攻城方器械标记（委托底层 Army；GlobalUnitRenderer 石弹发射条件 reads 此值） */
    public get isSiegeAttacker(): boolean {
        return !!(this.unit as any).isSiegeAttacker;
    }

    /** 攻城目标城 id（只读底层 Army.siegeTargetCityId——SiegeManager 仅对主攻+参战攻方设置，守方/野战为 null；
     *  GlobalUnitRenderer 攻城外推反查城图用。不 fallback targetCity：守方军团自己的目标城会误判攻方）。
     *  2026-08-04 修复：渲染层原先无此字段 → 外推判定 siegeCityId 恒为 undefined → 外推死代码从未生效 */
    public get targetCityId(): string | null {
        return (this.unit as any).siegeTargetCityId ?? null;
    }

    // IRenderable implementation
    public getPosition(): { lat: number; lng: number } {
        return this.unit.getPosition();
    }

    public getTroops(): number {
        return this.unit.getTroops();
    }

    /** Army 海上实际航向；位置与船头共用，未启用时为 null。 */
    public get navalHeadingRad(): number | null {
        const getter = (this.unit as any).getNavalHeadingRad;
        return typeof getter === 'function' ? getter.call(this.unit) : null;
    }

    public get isDestroyed(): boolean {
        return this.unit.isDestroyed;
    }

    public triggerAttack(battleType: 'siege' | 'field' = 'field', targetPos?: { lat: number, lng: number }): void {
        this.isAttacking = true;
        this.currentBattleType = battleType;
        this.targetPos = targetPos || null;
    }

    public stopAttack(): void {
        this.isAttacking = false;
        this.currentBattleType = null;
        this.targetPos = null;
    }

    // Visibility control
    public visible: boolean = true;

    public setVisible(isVisible: boolean): void {
        if (isVisible) {
            if (this.fadeOutTimer) clearTimeout(this.fadeOutTimer);
            this.fadeOutTimer = undefined;
            this.fadeOutStart = undefined;
            this.fadeOutDurationMs = undefined;
            this.visible = true;
            globalRenderer?.invalidateView();
            return;
        }
        if (!this.visible || this.fadeOutStart !== undefined) return;
        this.beginFadeOut(GameConfig.LEGION.DESPAWN_FADE_OUT_MS, false);
    }

    public beginDespawnFade(): void {
        this.isMoving = false;
        this.stopAttack();
        this.visible = true;
        this.beginFadeOut(GameConfig.LEGION.DESPAWN_FADE_OUT_MS, true);
    }

    private beginFadeOut(durationMs: number, unregisterAfter: boolean): void {
        if (this.fadeOutTimer) clearTimeout(this.fadeOutTimer);
        this.fadeOutStart = Date.now();
        this.fadeOutDurationMs = durationMs;
        globalRenderer?.invalidateView();
        this.fadeOutTimer = setTimeout(() => {
            this.fadeOutTimer = undefined;
            this.fadeOutStart = undefined;
            this.fadeOutDurationMs = undefined;
            if (unregisterAfter) {
                this.destroy();
            } else {
                this.visible = false;
                globalRenderer?.invalidateView();
            }
        }, durationMs);
    }

    public destroy(): void {
        if (this.fadeOutTimer) clearTimeout(this.fadeOutTimer);
        this.fadeOutTimer = undefined;
        if (globalRenderer) {
            globalRenderer.unregister(this);
            globalRenderer.invalidateView();
        }
    }
}
