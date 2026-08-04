import L from 'leaflet';
import { GameMap } from './GameMap';
import { OrientationSystem } from '../core/OrientationSystem';
import { GridSystem } from '../systems/GridSystem';
import { MAP_LAYER_ZINDEX, MAP_PANES } from '../config/MapLayers';
import { isMacroMapZoom } from '../config/StrategicView';
import { PlayerPhalanxDrawer } from './player/PlayerPhalanxDrawer'; // [NEW] Preload only
import { LegionPhalanxDrawer, PhalanxAnimState } from './legion/LegionPhalanxDrawer'; // [AI SYSTEM]
import type { NavalShipAssetId } from '../types/NavalShipTiers';
import { LegionPhalanxStateManager } from './legion/LegionPhalanxState';
import { LegionFlagDrawer } from './legion/LegionFlagDrawer'; // [AI FLAG SYSTEM]
import { ProjectileRenderer } from './ProjectileRenderer'; // [NEW] Arrow System
import { BanditDrawer, BanditState } from './BanditDrawer';
import { LegionType } from '../types/UnitTypes';

import { GameConfig, SPRITE_PATHS } from '../config/GameConfig';
import { FACTIONS } from '../data/factions';
import { gameLog } from '../utils/GameLogger';
import { GENERAL_PROFILES, STRATEGIC_SKILL_CATALOG, getStrategicSkillDef } from '../data/GeneralSkills';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { generalIdHasStrategicEffect } from '../combat/GeneralSkillCombat';

/** 虚张声势倍率：从武将的战略技 catalog 读取 magnitude，fallback 2 */
function getBluffMagnitude(generalId: string | undefined): number {
    if (!generalId) return 2;
    const profile = GENERAL_PROFILES[generalId];
    if (!profile?.strategicSkillId) return 2;
    const skill = STRATEGIC_SKILL_CATALOG[profile.strategicSkillId];
    if (skill?.effect !== 'bluff_troop_count') return 2;
    return skill.magnitude;
}

/** Leaflet LatLng 拒收 NaN；坐标无效时跳过渲染/投影，避免整页崩溃 */
function isValidMapCoord(pos: { lat?: number; lng?: number } | null | undefined): pos is { lat: number; lng: number } {
    return !!pos
        && Number.isFinite(pos.lat)
        && Number.isFinite(pos.lng);
}

export interface IRenderable {
    getPosition(): { lat: number; lng: number };
    getTroops(): number;
    isDestroyed: boolean;
    name?: string;
    generalId?: string;
}

export interface IAnimatedUnit extends IRenderable {
    // Animation State
    isAttacking: boolean;
    isMoving: boolean;

    // Battle Info
    currentBattleType: 'siege' | 'field' | null;
    isSiegeAttacker?: boolean; // 攻城方才有器械
    targetPos: { lat: number; lng: number } | null;

    // Movement Tracking
    lastPosition: { lat: number; lng: number };

    // Optional
    id?: string;
    type?: string;
    lastDirection?: number;
    lastDamageTime?: number; // [NEW] For visual damage feedback
    legionType?: LegionType; // [UNIT SYSTEM] 兵种类型
    factionId?: string; // [NEW] Faction ID for color tinting
    visible?: boolean; // [NEW] Visibility toggle
    isPlayer?: boolean; // [NEW] Player control flag

    // [NEW] Projectile Cooldown
    lastShotTime?: number;

    // [NEW] Corpse Persistence
    destroyTime?: number;
    cultureSlots?: string[] | null; // [NEW] 14-culture formation slots
    cultureScales?: number[] | null; // [NEW] Scales for each slot
    /** 海域 hex：渲染船贴图而非陆地方阵 */
    isOnSea?: boolean;
    /** 登船时锁定的船型（小/中/大）；null/缺省=按实时兵力算 */
    navalShipTierLock?: NavalShipAssetId | null;
    /** ArmyEditor：强制模拟海上 */
    forceNavalVisual?: boolean;
    /** 预览缩放倍率（仅编辑器用，默认 1） */
    previewScale?: number;
}

/**
 * Global Unit Renderer - Manages all unit rendering using Phalanx Visuals
 */
export class GlobalUnitRenderer {
    private map: L.Map;
    // Canvas High (Default, Field Battle, Moving) - Above Cities
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    // Canvas Low (Siege Battle) - Below Cities
    private canvasLow: HTMLCanvasElement;
    private ctxLow: CanvasRenderingContext2D;

    private units: Set<IAnimatedUnit> = new Set();
    // [OPTIMIZATION] Cache sorted array to avoid Array.from(Set) every frame
    private sortedUnitsCache: IAnimatedUnit[] = [];
    private needsSort: boolean = false;

    private unitFightingStates: Map<string, boolean> = new Map();
    private lastMapCenter: L.LatLng | null = null;
    private unitVisualAngles: Map<string, number> = new Map();

    private lastTime: number = 0;
    private isRunning: boolean = false;
    private showLabels: boolean = true; // [NEW] Toggle for text labels
    /** 地图拖动/缩放后需重绘（可跨帧分批） */
    private mapNeedsRedraw = true;
    private pendingViewRedraw = false;
    private lastViewRedrawAt = 0;
    /** 拖动中限制全量重绘频率，降低画布尖峰 */
    private static readonly VIEW_REDRAW_MIN_INTERVAL_MS = 33;
    private static readonly VIEW_CULL_MARGIN_PX = 100;
    /** 视口内单位过多时，每帧最多绘制数量（分帧累积，仅 mapNeedsRedraw 批次） */
    private static readonly VIEW_DRAW_CHUNK = 42;
    private viewDrawBatch: IAnimatedUnit[] | null = null;
    private viewDrawBatchIdx = 0;
    private idlePollAccumulator = 0;
    private static readonly IDLE_POLL_INTERVAL_MS = 200;

    // [NEW] Visual Systems
    private projectileSystem: ProjectileRenderer;

    /** [2026-07-18] 攻城器械渐隐锚点：军团乘胜开拔后器械留在城下原地淡出（经纬度+冻结朝向） */
    private siegeGearAnchors = new Map<string, { lat: number; lng: number; dir: number }>();

    /** [2026-08-04] 攻城视觉外推：据点图按城型 100/120/140px 宽（CSS），跟拍场攻城放大 ×4、city-scale 随 zoom；
     *  非跟拍场不放大（倍率 1）。图 4:3（1024×765）东西宽/南北窄。按接近方向把攻城方阵沿「背离城」方向推到图外缘 + 半兵牌空隙。
     *  全方向生效（旧版仅北面 18px 补偿，2026-07-18）。只动渲染，战斗逻辑坐标不变。 */
    private static readonly CITY_ICON_WIDTH_BY_TYPE: Record<string, number> = {
        big_city: 140, medium_city: 120, small_city: 100, pass: 100,
    };
    private static readonly CITY_ICON_HW_RATIO = 765 / 1024;
    /** 据点图边缘 ↔ 方阵**边缘**的真实空隙（像素）。[2026-08-04 修] 以前量到方阵中心，等于没有空隙 */
    private static readonly SIEGE_GAP_PX = 21;

    // [OPTIMIZATION] Static preload to start loading assets before Map exists
    private static assetsPromise: Promise<void> | null = null;
    private static assetsLoaded: boolean = false;

    public static async preloadAssets(): Promise<void> {
        if (this.assetsPromise) return this.assetsPromise;

        gameLog('startup', '🔄 GlobalUnitRenderer: Starting Static Preload...');

        this.assetsPromise = Promise.all([
            PlayerPhalanxDrawer.preload(),
            LegionPhalanxDrawer.preload(),
            LegionFlagDrawer.preload(),
            BanditDrawer.preload()
        ]).then(() => {
            this.assetsLoaded = true;
            gameLog('startup', '🎨 GlobalUnitRenderer: Assets Ready (Static Preload Complete)');
        });

        return this.assetsPromise;
    }

    constructor(gameMap: GameMap) {
        this.map = gameMap.getLeafletMap();

        // 1. Initialize High Canvas (Standard)
        this.canvas = this.createCanvas();
        this.ctx = this.canvas.getContext('2d')!;
        this.setupPane(MAP_PANES.UNITS, MAP_LAYER_ZINDEX.UNITS, this.canvas);

        // 2. Initialize Low Canvas (Siege)
        this.canvasLow = this.createCanvas();
        this.ctxLow = this.canvasLow.getContext('2d')!;
        this.setupPane(MAP_PANES.UNITS_LOW, MAP_LAYER_ZINDEX.UNITS_LOW, this.canvasLow);

        // Bind events
        const resetViewDrawBatch = () => {
            this.viewDrawBatch = null;
            this.viewDrawBatchIdx = 0;
        };
        const onMapViewChange = () => {
            this.updateCanvasPosition();
            resetViewDrawBatch();
            const now = performance.now();
            if (now - this.lastViewRedrawAt >= GlobalUnitRenderer.VIEW_REDRAW_MIN_INTERVAL_MS) {
                this.lastViewRedrawAt = now;
                this.pendingViewRedraw = false;
                this.mapNeedsRedraw = true;
            } else {
                this.pendingViewRedraw = true;
            }
        };
        const flushViewRedraw = () => {
            this.updateCanvasPosition();
            resetViewDrawBatch();
            this.pendingViewRedraw = false;
            this.lastViewRedrawAt = performance.now();
            this.mapNeedsRedraw = true;
        };
        this.map.on('move', onMapViewChange);
        this.map.on('zoom', onMapViewChange);
        this.map.on('moveend', flushViewRedraw);
        this.map.on('zoomend', flushViewRedraw);
        this.map.on('resize', this.resizeCanvas.bind(this));

        // Initial setup
        this.resizeCanvas();
        this.updateCanvasPosition();

        // [NEW] Projectile System (Arrows)
        this.projectileSystem = new ProjectileRenderer(this.map);

        // Ensure assets are loaded (if not already called via static preload)
        if (!GlobalUnitRenderer.assetsPromise) {
            GlobalUnitRenderer.preloadAssets();
        }

        // Wait for preload to finish then start
        GlobalUnitRenderer.assetsPromise!.then(() => {
            this.start();        });

        gameLog('startup', '🎨 GlobalUnitRenderer initialized');
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.pointerEvents = 'none';
        canvas.className = 'leaflet-zoom-animated';
        return canvas;
    }

    private setupPane(paneName: string, zIndex: number, canvas: HTMLCanvasElement): void {
        if (!this.map.getPane(paneName)) {
            this.map.createPane(paneName);
            const pane = this.map.getPane(paneName);
            if (pane) {
                pane.style.zIndex = zIndex.toString();
                pane.style.pointerEvents = 'none'; // Click-through
            }
        }
        const pane = this.map.getPane(paneName) || this.map.getPanes().overlayPane;
        pane.appendChild(canvas);
    }

    public register(unit: IAnimatedUnit): void {
        this.units.add(unit);
        this.needsSort = true;
        if (unit.id?.startsWith('army_editor_preview_')) {
            this.mapNeedsRedraw = true;
        }
        // [OPTIMIZATION] Force next frame render
        this.start();
    }

    /** 军队预览编辑器：待机也需每帧绘制 */
    private hasArmyEditorPreview(): boolean {
        for (const unit of this.units) {
            if (unit.id?.startsWith('army_editor_preview_')) return true;
        }
        return false;
    }

    public unregister(unit: IAnimatedUnit): void {
        const id = unit.id;
        if (id) {
            this.unitFightingStates.delete(id);
            LegionPhalanxStateManager.dispose(id);
            LegionPhalanxDrawer.disposeUnit(id); // 注销：方阵 + 攻城器械状态全清
            this.siegeGearAnchors.delete(id);
        }
        this.units.delete(unit);
        this.needsSort = true;
    }

    private resizeCanvas(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.canvasLow.width = size.x;
        this.canvasLow.height = size.y;
        this.updateCanvasPosition();
        this.needsSort = true;
        this.viewDrawBatch = null;
        this.viewDrawBatchIdx = 0;
        this.mapNeedsRedraw = true;
    }

    private isUnitInContainerView(unit: IAnimatedUnit): boolean {
        const pos = unit.getPosition();
        if (!isValidMapCoord(pos)) return false;
        const pt = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
        const m = GlobalUnitRenderer.VIEW_CULL_MARGIN_PX;
        const w = this.canvas.width;
        const h = this.canvas.height;
        return pt.x >= -m && pt.x <= w + m && pt.y >= -m && pt.y <= h + m;
    }

    /** 视口内可见单位（已做屏幕裁剪 + 战略视野技判定） */
    private collectVisibleUnitsInView(): IAnimatedUnit[] {
        const list: IAnimatedUnit[] = [];
        for (let i = 0; i < this.sortedUnitsCache.length; i++) {
            const unit = this.sortedUnitsCache[i];
            if ((unit as any).visible === false) continue;
            if (!isValidMapCoord(unit.getPosition())) continue;
            if (!this.isUnitInContainerView(unit)) continue;
            list.push(unit);
        }
        return list;
    }

    private updateCanvasPosition(): void {
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
        L.DomUtil.setPosition(this.canvasLow, topLeft);
    }

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate.bind(this));
    }

    public stop(): void {
        this.isRunning = false;
    }

    public setShowLabels(visible: boolean): void {
        this.showLabels = visible;
    }

    // [NEW] Toggle specific unit visibility by ID
    public toggleUnitVisibility(unitId: string, visible: boolean): void {
        // Find unit in Set
        for (const unit of this.units) {
            if (unit.id === unitId) {
                (unit as any).visible = visible;
                this.needsSort = true;
                return;
            }
        }
        console.warn(`⚠️ [GlobalUnitRenderer] Unit not found for visibility toggle: ${unitId}`);
    }

    /** 强制下一帧重绘（状态变更但无动画驱动时，避免旧帧残留） */
    public invalidateView(): void {
        this.mapNeedsRedraw = true;
    }

    // [OPTIMIZATION]
    // Track if any unit is moving or animating to decide if we need to redraw
    private lastFrameDrawMs = 0;

    public getLastFrameDrawMs(): number {
        return this.lastFrameDrawMs;
    }

    public getUnitCount(): number {
        return this.units.size;
    }

    /** 据点 / 脚本：从一点向另一点齐射箭矢（复用军团箭矢渲染） */
    public spawnProjectileVolley(
        from: L.LatLngExpression,
        to: L.LatLngExpression,
        options?: {
            count?: number;
            spreadFactor?: number;
            staggerMs?: number;
            durationMs?: number;
            type?: 'arrow' | 'stone' | 'fire';
        }
    ): void {
        this.projectileSystem.spawnVolley(L.latLng(from), L.latLng(to), options);
    }


    private animate(time: number): void {
        if (!this.isRunning) return;

        const pm = (window as any).perfMonitor;
        const frameStart = performance.now();
        pm?.noteCanvasFrameStart?.(frameStart);
        const endCanvasTiming = () => pm?.noteCanvasFrameEnd?.(performance.now());
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        if (isMacroMapZoom(this.map.getZoom())) {
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctxLow.clearRect(0, 0, this.canvasLow.width, this.canvasLow.height);
            }
            endCanvasTiming();
            requestAnimationFrame(this.animate.bind(this));
            return;
        }

        // 1. Maintain Sorted Cache
        if (this.needsSort) {
            this.sortedUnitsCache = Array.from(this.units);
            this.needsSort = false;
            this.viewDrawBatch = null;
            this.viewDrawBatchIdx = 0;
        }

        // [PERF] Only sort when units are moving
        // Check if any unit moved since last frame by comparing positions
        let anyMoved = false;
        for (const unit of this.sortedUnitsCache) {
            if (unit.isMoving || unit.isAttacking) {
                anyMoved = true;
                break;
            }
        }
        if (anyMoved) {
            this.sortedUnitsCache.sort((a, b) => b.getPosition().lat - a.getPosition().lat);
        }

        let hasActiveAnimation = false;
        const corpseMs = GameConfig.LEGION.CORPSE_DISPLAY_MS;
        let hasVisibleCorpses = false;

        // 2. Check Loop - Update States（屏外且非动画中的单位跳过逻辑更新）
        for (let i = 0; i < this.sortedUnitsCache.length; i++) {
            const unit = this.sortedUnitsCache[i];
            if (unit.isDestroyed) {
                const t0 = unit.destroyTime ?? Date.now();
                if (!unit.destroyTime) unit.destroyTime = t0;
                // [PERF 2026-07-28] 必须判「在不在视口内」。
                // 原来只看时间：地图任意角落死一支军团，接下来整整 CORPSE_DISPLAY_MS(15s)
                // 全画布都在满帧重绘，哪怕镜头根本没看那边；战事密集时几乎等于常态重绘。
                // 屏外尸体不驱动重绘——镜头挪过去时 moveend/zoomend 会置 mapNeedsRedraw，
                // 该画的一帧不会漏。
                if (Date.now() - t0 <= corpseMs && this.isUnitInContainerView(unit)) {
                    hasVisibleCorpses = true;
                }
                continue;
            }

            const isVisible = (unit as any).visible !== false;
            const inView = isVisible && this.isUnitInContainerView(unit);
            const animating =
                unit.isMoving || unit.isAttacking || (unit as any).isBattling;

            if (isVisible && (inView || animating)) {
                this.updateUnitState(unit);
            }

            if (animating) {
                hasActiveAnimation = true;
            }
        }

        const projectilesActive = this.projectileSystem.hasActive();
        const hasArmyEditorPreview = this.hasArmyEditorPreview();
        const shouldDraw =
            hasActiveAnimation ||
            projectilesActive ||
            this.mapNeedsRedraw ||
            this.pendingViewRedraw ||
            hasVisibleCorpses ||
            hasArmyEditorPreview;

        if (!shouldDraw) {
            this.idlePollAccumulator += deltaTime;
            if (this.idlePollAccumulator < GlobalUnitRenderer.IDLE_POLL_INTERVAL_MS) {
                endCanvasTiming();
                requestAnimationFrame(this.animate.bind(this));
                return;
            }
            this.idlePollAccumulator = 0;
            if (this.pendingViewRedraw) {
                this.mapNeedsRedraw = true;
            }
            endCanvasTiming();
            requestAnimationFrame(this.animate.bind(this));
            return;
        }

        this.idlePollAccumulator = 0;

        if (projectilesActive) {
            this.projectileSystem.update(deltaTime);
        }

        const visibleInView = this.collectVisibleUnitsInView();
        const useBatch =
            this.mapNeedsRedraw &&
            !hasActiveAnimation &&
            !projectilesActive &&
            visibleInView.length > GlobalUnitRenderer.VIEW_DRAW_CHUNK * 4;

        let drawList: IAnimatedUnit[];
        let clearBeforeDraw = true;

        if (useBatch) {
            if (!this.viewDrawBatch) {
                this.viewDrawBatch = visibleInView;
                this.viewDrawBatchIdx = 0;
            }
            const end = Math.min(
                this.viewDrawBatchIdx + GlobalUnitRenderer.VIEW_DRAW_CHUNK,
                this.viewDrawBatch.length,
            );
            drawList = this.viewDrawBatch.slice(this.viewDrawBatchIdx, end);
            this.viewDrawBatchIdx = end;
            clearBeforeDraw = this.viewDrawBatchIdx <= GlobalUnitRenderer.VIEW_DRAW_CHUNK;
            if (this.viewDrawBatchIdx < this.viewDrawBatch.length) {
                this.mapNeedsRedraw = true;
            } else {
                this.viewDrawBatch = null;
                this.viewDrawBatchIdx = 0;
                this.mapNeedsRedraw = false;
                this.pendingViewRedraw = false;
            }
        } else {
            this.viewDrawBatch = null;
            this.viewDrawBatchIdx = 0;
            drawList = visibleInView;
            this.mapNeedsRedraw = false;
            this.pendingViewRedraw = false;
        }

        if (clearBeforeDraw) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        const corpseFadeMs = GameConfig.LEGION.CORPSE_FADE_OUT_MS;
        for (let i = 0; i < drawList.length; i++) {
            const unit = drawList[i];

            let corpseAlpha = 1;
            if (unit.isDestroyed) {
                const t0 = unit.destroyTime ?? Date.now();
                if (!unit.destroyTime) unit.destroyTime = t0;
                const age = Date.now() - t0;
                if (age > corpseMs) {
                    continue;
                }
                // 最后 corpseFadeMs 内线性淡出
                if (corpseFadeMs > 0 && age > corpseMs - corpseFadeMs) {
                    corpseAlpha = Math.max(0, (corpseMs - age) / corpseFadeMs);
                }
            }

            if (corpseAlpha < 1) {
                const prevAlpha = this.ctx.globalAlpha;
                this.ctx.globalAlpha = prevAlpha * corpseAlpha;
                this.renderUnit(unit, this.ctx);
                this.ctx.globalAlpha = prevAlpha;
            } else {
                this.renderUnit(unit, this.ctx);
            }
        }

        // [NEW] Draw Projectiles AFTER units
        const currentZoom = this.map.getZoom();
        const effectiveZoom = Math.min(currentZoom, 10);
        const scale = Math.pow(2, effectiveZoom - 9) * 0.7;

        this.projectileSystem.draw(this.ctx, scale);

        this.lastFrameDrawMs = performance.now() - frameStart;
        if (pm?.reportCount) {
            pm.reportCount('renderDrawMs', this.lastFrameDrawMs);
        }
        endCanvasTiming();

        requestAnimationFrame(this.animate.bind(this));
    }

    private updateUnitState(unit: IAnimatedUnit): void {
        // [FIX] Initialize random direction if undefined to prevent NaN angle in naval volleys
        if (unit.lastDirection === undefined) {
            unit.lastDirection = Math.floor(Math.random() * 8);
        }

        // [NEW] Check for battle end signal to clear corpses
        const id = unit.id || 'unknown';
        const isFighting = unit.currentBattleType !== null; // OR unit.isAttacking?
        const wasFighting = this.unitFightingStates.get(id) || false;

        if (wasFighting && !isFighting) {
            // 只重置方阵/额外弓步状态；器械 Map 保留给战后 4s 渐隐
            LegionPhalanxDrawer.resetUnit(id);
        }
        this.unitFightingStates.set(id, isFighting);

        const currentPos = unit.getPosition();
        if (!isValidMapCoord(currentPos)) {
            // 坐标已坏：清掉射击目标，避免 L.latLng(NaN) 拖垮整页
            if (unit.targetPos && !isValidMapCoord(unit.targetPos)) unit.targetPos = null;
            return;
        }
        if (unit.targetPos && !isValidMapCoord(unit.targetPos)) {
            unit.targetPos = null;
        }

        // Check if unit is moving
        const last = unit.lastPosition;
        const posChanged = isValidMapCoord(last)
            && (Math.abs(currentPos.lat - last.lat) > 0.0001
                || Math.abs(currentPos.lng - last.lng) > 0.0001);

        if (unit.id?.startsWith('army_editor_preview_')) {
            // ArmyEditor strictly controls its own isMoving state
        } else {
            if (posChanged) unit.isMoving = true;
            else unit.isMoving = false; // Or let unit decide.
        }

        // [NEW] Projectile Spawner Logic
        // If attacking AND is ranged/mixed AND has target
        if (unit.isAttacking && isValidMapCoord(unit.targetPos)) {
            const lType = unit.legionType || 'infantry';
            const hasRangedSlots = ((unit as any).cultureSlots as string[] | undefined)?.some(
                (s) => s === 'archer' || s === 'crossbow' || s.includes('archer')
            );
            const isRanged = hasRangedSlots || lType.includes('archer') || lType === 'mixed' || lType === 'infantry';

            if (isRanged) {
                const now = Date.now();
                // [USER REQUEST] Faster frequency (1000ms instead of 2000ms)
                if (!unit.lastShotTime || now - unit.lastShotTime > 1000) {
                    // Random offset to de-sync armies
                    if (!unit.lastShotTime) unit.lastShotTime = now - Math.random() * 1000;

                    if (now - unit.lastShotTime > 1000) {
                        // FIRE!
                        // [USER REQUEST] "Side-by-side lines" (Spread)

                        const startJitterLat = (Math.random() - 0.5) * 0.002;
                        const startJitterLng = (Math.random() - 0.5) * 0.002;

                        // [USER REQUEST] Adjust vertical position (Height Offset)
                        // Unit anchor is at FEET (0.9). We need arrows to spawn from CHEST/HEAD.
                        // Universal offset applied to all directions.
                        // 0.035 Lat is approx "Mid-Body" height visually at Zoom 9.
                        let BODY_HEIGHT_OFFSET = 0.035;

                        // [USER REQUEST] "SW/SE still too low" -> Add extra offset for these
                        if (unit.lastDirection === 1 || unit.lastDirection === 7) {
                            BODY_HEIGHT_OFFSET += 0.02; // Total ~0.055
                        }

                        const baseStart = L.latLng(
                            currentPos.lat + startJitterLat + BODY_HEIGHT_OFFSET,
                            currentPos.lng + startJitterLng
                        );
                        // 计算目标城池的视觉中心高程偏置与四位偏置
                        let targetLat = unit.targetPos.lat;
                        let targetLng = unit.targetPos.lng;
                        
                        // 若攻击目标为城池（攻城战），施加城墙主体视觉高度偏置
                        if ((unit as any).isSiegeAttacker || unit.currentBattleType === 'siege') {
                            const cityId = (unit as any).targetCityId || (unit as any).targetId;
                            const targetCity = cityId ? (window as any).game?.cityManager?.getCity?.(cityId) : null;
                            
                            let cityHeightOffset = 0.018; // 默认小城
                            if (targetCity) {
                                if (targetCity.type === 'big_city') cityHeightOffset = 0.038;
                                else if (targetCity.type === 'medium_city') cityHeightOffset = 0.028;
                                else if (targetCity.type === 'pass') cityHeightOffset = 0.026;
                                else cityHeightOffset = 0.020;
                            }
                            
                            // 沿着进攻方向向量，将落点引导至近侧城墙，防穿透落到背山处
                            const dLat = targetLat - currentPos.lat;
                            const dLng = targetLng - currentPos.lng;
                            const len = Math.hypot(dLat, dLng) || 0.001;
                            
                            targetLat = targetLat + cityHeightOffset - (dLat / len) * 0.006;
                            targetLng = targetLng - (dLng / len) * 0.006;
                        }

                        const baseEnd = L.latLng(targetLat, targetLng);

                        this.projectileSystem.spawnVolley(baseStart, baseEnd, { count: 5, spreadFactor: 0.025 });

                        // 攻城方额外发射石弹（投石机）
                        if ((unit as any).isSiegeAttacker && unit.currentBattleType === 'siege') {
                            setTimeout(() => {
                                this.projectileSystem.spawnVolley(baseStart, baseEnd, {
                                    count: 2,
                                    spreadFactor: 0.04,
                                    durationMs: 600,
                                    staggerMs: 400,
                                    type: 'stone',
                                });
                            }, 400); // 延迟发射，使箭雨和投石有先后层次感
                        }

                        unit.lastShotTime = now;
                    }
                }
            }
        }
    }

    private renderUnit(unit: IAnimatedUnit, ctx: CanvasRenderingContext2D): void {
        // ... (Checks for Bandit remain same)
        const banditTypes = ['bandit', 'raider', 'outlaw', 'barbarian', 'rebel', 'mercenary', 'cult', 'righteous', 'warlord'];
        const isBandit = banditTypes.includes(unit.type || '') || (unit as any).factionId === 'bandit';

        const unitPos = unit.getPosition();
        if (!isValidMapCoord(unitPos)) return;
        // Base center point
        let centerPoint = this.map.latLngToContainerPoint([unitPos.lat, unitPos.lng]);

        // 军团一律画在自身真实坐标，绝不做任何屏幕错开/位移——重叠就重叠，也不允许瞬移（不真实）。
        // 下面 scale 仅供贴图/方阵尺寸计算使用（不参与定位）。
        const currentZoom = this.map.getZoom();
        const effectiveZoom = Math.min(currentZoom, 10);
        const scale = Math.pow(2, effectiveZoom - 9) * 0.7;

        const m = GlobalUnitRenderer.VIEW_CULL_MARGIN_PX;
        if (
            centerPoint.x < -m ||
            centerPoint.x > this.canvas.width + m ||
            centerPoint.y < -m ||
            centerPoint.y > this.canvas.height + m
        ) {
            return;
        }

        const troops = unit.getTroops();

        // Determine Direction First (needed for offset)
        // Initialize random direction if undefined (for natural Bandit look)
        if (unit.lastDirection === undefined) {
            unit.lastDirection = Math.floor(Math.random() * 8);
        }
        let directionIndex = unit.lastDirection;
        if (unit.isAttacking && isValidMapCoord(unit.targetPos)) {
            const dLat = Math.abs(unitPos.lat - unit.targetPos.lat);
            const dLng = Math.abs(unitPos.lng - unit.targetPos.lng);
            if (dLat > 0.00001 || dLng > 0.00001) {
                // For attacking, we want precise facing to target
                directionIndex = OrientationSystem.get8DirectionIndex(unitPos, unit.targetPos);
                unit.lastDirection = directionIndex;
                // Sync visual angle to target immediately to avoid "slow turn" during attack start
                const angle = Math.atan2(unit.targetPos.lng - unitPos.lng, unit.targetPos.lat - unitPos.lat);
                this.unitVisualAngles.set(unit.id || 'unknown', angle);
            }
        } else if (unit.isMoving) {
            // [UX FIX] Smooth Rotation to prevent jitter
            // 1. Calculate raw target angle (Radians)
            const dy = unitPos.lng - unit.lastPosition.lng;
            const dx = unitPos.lat - unit.lastPosition.lat; // Note: lat is x-axis in Leaflet projection usually? No, lat is Y. 
            // OrientationSystem uses (lat, lng). atan2(x, y)? 
            // OrientationSystem: 
            // const angle = Math.atan2(target.lng - current.lng, target.lat - current.lat);
            // So dx = dLat, dy = dLng.

            if (Math.abs(dx) > 0.0000001 || Math.abs(dy) > 0.0000001) {
                const targetAngle = Math.atan2(dy, dx);
                const unitId = unit.id || 'unknown';
                let currentAngle = this.unitVisualAngles.get(unitId) ?? targetAngle;

                // 2. Lerp angle (handle wrap-around -PI to PI)
                // Shortest path interpolation
                let diff = targetAngle - currentAngle;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                // Formatting note: dt is variable, but here we run per frame. 
                // Using fixed factor 0.2 gives better responsiveness (~5 frames to settle)
                currentAngle += diff * 0.2;

                // Normalize
                while (currentAngle <= -Math.PI) currentAngle += Math.PI * 2;
                while (currentAngle > Math.PI) currentAngle -= Math.PI * 2;

                this.unitVisualAngles.set(unitId, currentAngle);

                // 3. Convert smoothed angle to 0-7 index
                // 0 is South (Lat -), 4 is North (Lat +) in this logic?
                // OrientationSystem: 0=S, 4=N. 
                // Math.atan2(dy, dx): 
                // South: dx=-1, dy=0 -> atan2(0, -1) = PI (or -PI). Index 0 implies South?
                // Let's rely on OrientationSystem structure.
                // Actually, let's just map angle to 8 directions manually to match OrientationSystem.
                // OrientationSystem.get8DirectionIndex uses logic:
                // angle = atan2(dLng, dLat). Note dLat is Y-like if North is Up.
                // But typically Lat is Y. 
                // Let's use the helper to convert angle to index if possible, or replicate:

                // Helper: Convert rad to 0-7. 
                // 0=S, 1=SE, 2=E, 3=NE, 4=N, 5=NW, 6=W, 7=SW
                // standard atan2(y,x): 0=E, PI/2=N, PI=W, -PI/2=S.
                // Our atan2(dLng, dLat) -> (x=dLat, y=dLng). 
                // dLat=1 (N) -> atan2(0, 1) = 0. Wait.
                // If 0=S, then dLat=-1. atan2(0, -1) = PI.

                // Let's just use the cached currentAngle to project a "virtual point" and ask OrientationSystem
                const virtualLat = unitPos.lat + Math.cos(currentAngle) * 0.001;
                const virtualLng = unitPos.lng + Math.sin(currentAngle) * 0.001;

                // Actually, since we used atan2(dLng, dLat), 
                // dx=dLat (cos), dy=dLng (sin).

                directionIndex = OrientationSystem.get8DirectionIndex(
                    unitPos,
                    { lat: virtualLat, lng: virtualLng }
                );

                unit.lastDirection = directionIndex;
            }
        }

        if (isBandit) {
            // [NEW] Snap NPC position to Hex center
            const hex = GridSystem.latLngToAxial(unitPos.lat, unitPos.lng);
            const snapped = GridSystem.axialToLatLng(hex.q, hex.r);
            centerPoint = this.map.latLngToContainerPoint([snapped.lat, snapped.lng]);

            let state: BanditState = 'IDLE';

            if (unit.isAttacking) state = 'ATTACK';
            else if (unit.isMoving) state = 'MOVE';

            BanditDrawer.draw(
                ctx,
                { x: centerPoint.x, y: centerPoint.y },
                state,
                directionIndex,
                scale * (unit.previewScale ?? 1),
                troops,
                Date.now(),
                unit.type || 'bandit' // Pass type for formation
            );

        } else {
            // ... (Phalanx Rendering logic)
            // [2026-05-30] 加 DAMAGE/DEATH 状态识别 (供 ArmyEditor 预览动作用)
            let state: PhalanxAnimState = 'IDLE';
            if (unit.isDestroyed) {
                state = 'DEATH';
            } else if (unit.lastDamageTime && Date.now() - unit.lastDamageTime < 800) {
                state = 'DAMAGE';
            } else if (unit.isAttacking) {
                state = 'ATTACK';
            } else if (unit.isMoving) {
                state = 'MOVE';
            }

            const useNavalVisual = !!(unit.isOnSea || unit.forceNavalVisual);

            // ── [2026-08-04] 攻城视觉外推：整支方阵沿「背离城」方向推到据点图外缘 + 空隙 ──
            // 按城型图宽（跟拍场 ×4 / 非跟拍 ×1、city-scale 随 zoom）+ 4:3 方向加权（东西宽/南北窄），
            // 全方向生效。**判定放宽**：凡目标为城（主攻/参战/排队/接近）都外推——2026-08-04 实测
            // 多军团攻城时只有主攻 isSiegeAttacker，参战军团不设 → 旧判定压城。野战打军团 targetId 查不到城 → 不外推。
            // 只动渲染，战斗逻辑坐标不变。
            const unitIdForGear = unit.id || 'unknown';
            // 器械只给真正的攻城方（外推判定已放宽到"目标是城"，器械保持严格，参战/接近中不画器械）
            const activelySieging = unit.currentBattleType === 'siege' && (unit as any).isSiegeAttacker === true;
            const siegeCityId = (unit as any).targetCityId || (unit as any).targetId;
            const siegeTargetCity = siegeCityId
                ? (window as any).game?.cityManager?.getCity?.(siegeCityId)
                : null;
            if (!useNavalVisual && siegeTargetCity && unit.targetPos && isValidMapCoord(unit.targetPos)) {
                const cityPt = this.map.latLngToContainerPoint([unit.targetPos.lat, unit.targetPos.lng]);
                const dx = centerPoint.x - cityPt.x;
                const dy = centerPoint.y - cityPt.y;
                const len = Math.hypot(dx, dy);
                if (len > 1) {
                    const baseW = GlobalUnitRenderer.CITY_ICON_WIDTH_BY_TYPE[siegeTargetCity.type] ?? 100;
                    const zoom = this.map.getZoom();
                    const cityScale = Math.max(0, 1 + (zoom - 9) * 0.5); // 与 TerritorySystem.updateCityScales 一致
                    const siegeZoom =
                        (window as any).game?.cityManager?.getTerritorySystem?.()?.isCitySiegeZoomed?.(siegeTargetCity.id)
                            ? 4
                            : 1;
                    const halfW = (baseW / 2) * cityScale * siegeZoom; // 跟拍 .city-under-siege scale(4)
                    const halfH = halfW * GlobalUnitRenderer.CITY_ICON_HW_RATIO;
                    const cosA = Math.abs(dx) / len; // 东西占比 → 图宽侧
                    const sinA = Math.abs(dy) / len; // 南北占比 → 图高侧
                    const halfPx = halfW * cosA + halfH * sinA;
                    // [2026-08-04 修] 必须再减掉方阵自身半径，否则 SIEGE_GAP_PX 量的是
                    // 「城图边缘 → 方阵中心」，前排士兵会压进城图 60~76px（zoom10 实测）。
                    const ext = LegionPhalanxDrawer.getPhalanxHalfExtent(
                        scale * (unit.previewScale ?? 1),
                        unit.cultureSlots,
                    );
                    const unitHalfPx = ext.x * cosA + ext.y * sinA;
                    const push = Math.max(
                        0,
                        halfPx
                            + unitHalfPx
                            + GlobalUnitRenderer.SIEGE_GAP_PX
                            - len
                    );
                    if (push > 0) {
                        centerPoint = L.point(
                            centerPoint.x + (dx / len) * push,
                            centerPoint.y + (dy / len) * push,
                        );
                    }
                }
            }

            // 1. Draw Flag Pole (Behind Soldiers / Ship)
            LegionFlagDrawer.drawPole(
                ctx,
                { x: centerPoint.x, y: centerPoint.y },
                useNavalVisual ? scale * (unit.previewScale ?? 1) * 0.85 : scale * (unit.previewScale ?? 1),
                unit.factionId || 'panjun'
            );

            // ── 攻城器械（仅攻城方陆战；覆灭后留尸体同步士兵）──
            if (!useNavalVisual && (activelySieging || LegionPhalanxDrawer.wasSiegeUnit(unitIdForGear))) {
                // [2026-07-18] 乘胜追击不休整时军团立即开拔，器械须留在城下原地渐隐（史实：器械就地弃置）。
                // 攻城期间每帧刷新锚点＝城下位置（含攻城视觉补偿，战终渐隐不跳位）；战后按锚点换算屏幕坐标并冻结朝向。
                if (activelySieging) {
                    const anchorLL = this.map.containerPointToLatLng(L.point(centerPoint.x, centerPoint.y));
                    this.siegeGearAnchors.set(unitIdForGear, { lat: anchorLL.lat, lng: anchorLL.lng, dir: directionIndex });
                }
                const gearAnchor = activelySieging ? null : this.siegeGearAnchors.get(unitIdForGear);
                const gearCenter = gearAnchor
                    ? this.map.latLngToContainerPoint([gearAnchor.lat, gearAnchor.lng])
                    : centerPoint;
                const gearDir = gearAnchor ? gearAnchor.dir : directionIndex;
                const siegeScale = scale * (unit.previewScale ?? 1);
                const baseH = 75;
                const rH = baseH * siegeScale;
                const ramSpacingY = rH * 0.42;
                const ramSpacingX = rH * 0.8 * 0.50;
                LegionPhalanxDrawer.drawSiegeGear(
                    ctx,
                    { x: gearCenter.x, y: gearCenter.y },
                    state,
                    gearDir,
                    siegeScale,
                    Date.now(),
                    ramSpacingX,
                    ramSpacingY,
                    unitIdForGear,
                    troops,
                );
                // 渐隐走完（drawSiegeGear 内部已清器械状态）→ 锚点同步清除
                if (!activelySieging && !LegionPhalanxDrawer.wasSiegeUnit(unitIdForGear)) {
                    this.siegeGearAnchors.delete(unitIdForGear);
                }
            }

            // ── 攻城额外士兵：三角形尖兵左右各一弓步兵（仅陆战）──
            if (!useNavalVisual
                && (unit as any).isSiegeAttacker && unit.currentBattleType === 'siege'
                && (unit.cultureSlots?.length ?? 0) === 6) {
                const siegeScale = scale * (unit.previewScale ?? 1);
                const baseH = 75;
                const rH = baseH * siegeScale;
                const sX = rH * 0.8 * 0.50;
                const sY = rH * 0.42;
                LegionPhalanxDrawer.drawSiegeSoldier(
                    ctx, { x: centerPoint.x, y: centerPoint.y },
                    state, directionIndex, siegeScale, Date.now(), sX, sY,
                    'archer', -1.2, -1.0, unit.id || 'unknown',
                    unit.factionId || 'panjun', troops,
                );
                LegionPhalanxDrawer.drawSiegeSoldier(
                    ctx, { x: centerPoint.x, y: centerPoint.y },
                    state, directionIndex, siegeScale, Date.now(), sX, sY,
                    'archer', +1.2, -1.0, unit.id || 'unknown',
                    unit.factionId || 'panjun', troops,
                );
            }


            if (useNavalVisual) {
                LegionPhalanxDrawer.drawNaval(
                    ctx,
                    { x: centerPoint.x, y: centerPoint.y },
                    state,
                    directionIndex,
                    scale * (unit.previewScale ?? 1),
                    troops,
                    Date.now(),
                    unit.factionId || 'zhonghua',
                    unit.navalShipTierLock ?? null,
                    unit.id ?? '',
                );
            } else {
                // [AI SYSTEM] Use Dedicated Legion Drawer
                const rawType = unit.legionType || 'mixed';
                const assetsId: LegionType =
                    rawType === 'cavalry' || rawType === 'archer_cavalry' || rawType === 'mixed' || rawType === 'infantry'
                        ? rawType
                        : 'mixed';

                LegionPhalanxDrawer.draw(
                    unit.id || 'unknown',
                    ctx,
                    { x: centerPoint.x, y: centerPoint.y },
                    state,
                    directionIndex,
                    scale * (unit.previewScale ?? 1),
                    troops,
                    Date.now(),
                    false,
                    unit.currentBattleType !== null,
                    (lat: number, lng: number) => {
                        const point = this.map.latLngToContainerPoint([lat, lng]);
                        return { x: point.x, y: point.y };
                    },
                    (x: number, y: number) => {
                        const latlng = this.map.containerPointToLatLng([x, y]);
                        return { lat: latlng.lat, lng: latlng.lng };
                    },
                    unit.legionType || 'infantry',
                    unit.factionId || 'zhonghua',
                    unit.cultureSlots || null,
                    assetsId,
                    unit.isPlayer || false,
                    unit.cultureScales || null
                );
            }


            // 3. Draw Flag Body (On Top of Soldiers / Ship)
            // [NEW] Get current year for conditional flag logic
            const currentYear = (window as any).game?.timeSystem?.getYear() ?? -999;

            LegionFlagDrawer.drawFlag(
                ctx,
                { x: centerPoint.x, y: centerPoint.y },
                directionIndex,
                useNavalVisual ? scale * (unit.previewScale ?? 1) * 0.85 : scale * (unit.previewScale ?? 1),
                Date.now(),
                unit.factionId || 'panjun',
                currentYear // [NEW] Pass year
            );
        }

        // Update last position for next frame
        unit.lastPosition = { lat: unitPos.lat, lng: unitPos.lng };

        // Draw Unit Name/Info (Optional)
        this.renderInfo(ctx, centerPoint, unit, scale * (unit.previewScale ?? 1));
    }

    private renderInfo(ctx: CanvasRenderingContext2D, center: L.Point, unit: IAnimatedUnit, scale: number) {
        if (!this.showLabels) return;
        if (!unit.name) return;

        const hideCount = generalIdHasStrategicEffect(unit.generalId, 'hide_troop_count');
        const inCombat = !!(unit as any).isAttacking;
        const isMoving = !!(unit as any).destination && !(unit as any).hasArrived && !inCombat;
        // 偃旗息鼓：生效时整组军情隐藏——武将名、精锐番号、兵力均不显示。
        if (hideCount && isMoving) return;

        let generalText = '';
        let eliteText = unit.name || '';

        if (unit.generalId) {
            const genRec = getGeneralRecordByGeneralId(unit.generalId);
            if (genRec && genRec.generalName) {
                generalText = genRec.generalName;
            }
        }

        // [MATCH CITY STYLE] Position label BELOW the unit
        const useNavalVisual = !!(unit.isOnSea || unit.forceNavalVisual);
        let currentY = center.y + (useNavalVisual ? 75 : 45) * scale;

        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'top';

        // 1. Draw General (if exists, Cyan)
        if (generalText) {
            const genFontSize = 13;
            ctx.font = `bold ${genFontSize}px Arial`;
            
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.strokeText(generalText, center.x, currentY);

            ctx.fillStyle = '#00FFFF'; // Bright Cyan
            ctx.fillText(generalText, center.x, currentY);
            
            currentY += genFontSize + 4;
        }

        // 2. Draw Elite / Unit Name (White)
        if (eliteText) {
            const nameFontSize = 13; // Changed back to 13 to keep name prominent
            ctx.font = `bold ${nameFontSize}px Arial`;
            
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.strokeText(eliteText, center.x, currentY);

            ctx.fillStyle = '#ffffff'; // White
            ctx.shadowBlur = 0; // Reset shadow
            ctx.fillText(eliteText, center.x, currentY);
            
            currentY += nameFontSize + 4;
        }

        // 3. Draw Troops（虚张声势 ×2；与其他视野技同步——非战移动时生效）
        const bluffCount = generalIdHasStrategicEffect(unit.generalId, 'bluff_troop_count');
        const rawTroops = Math.floor(unit.getTroops());
        const bluffMult = getBluffMagnitude(unit.generalId);
        const displayTroops = (bluffCount && isMoving) ? Math.floor(rawTroops * bluffMult) : rawTroops;
        const troopsFontSize = 12;
        const troopsText = `${displayTroops}`;
        ctx.font = `bold ${troopsFontSize}px Arial`;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(troopsText, center.x, currentY);

        ctx.fillStyle = '#ffd700'; // Gold
        ctx.fillText(troopsText, center.x, currentY);
    }

    public destroy(): void {
        this.stop();
        this.canvas.remove();
        this.canvasLow.remove();
    }
}
