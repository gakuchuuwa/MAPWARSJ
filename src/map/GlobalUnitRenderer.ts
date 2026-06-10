import L from 'leaflet';
import { GameMap } from './GameMap';
import { OrientationSystem } from '../core/OrientationSystem';
import { GridSystem } from '../systems/GridSystem';
import { MAP_LAYER_ZINDEX, MAP_PANES } from '../config/MapLayers';
import { isMacroMapZoom } from '../config/StrategicView';
import { PlayerPhalanxDrawer } from './player/PlayerPhalanxDrawer'; // [NEW] Preload only
import { LegionPhalanxDrawer, PhalanxAnimState } from './legion/LegionPhalanxDrawer'; // [AI SYSTEM]
import { LegionPhalanxStateManager } from './legion/LegionPhalanxState';
import { LegionFlagDrawer } from './legion/LegionFlagDrawer'; // [AI FLAG SYSTEM]
import { ProjectileRenderer } from './ProjectileRenderer'; // [NEW] Arrow System
import { BanditDrawer, BanditState } from './BanditDrawer';
import { LegionType } from '../types/UnitTypes';

import { GameConfig, SPRITE_PATHS } from '../config/GameConfig';
import { FACTIONS } from '../data/factions';
import { gameLog } from '../utils/GameLogger';

export interface IRenderable {
    getPosition(): { lat: number; lng: number };
    getTroops(): number;
    isDestroyed: boolean;
    name?: string;
}

export interface IAnimatedUnit extends IRenderable {
    // Animation State
    isAttacking: boolean;
    isMoving: boolean;

    // Battle Info
    currentBattleType: 'siege' | 'field' | null;
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
    /** ArmyEditor：强制模拟海上 */
    forceNavalVisual?: boolean;
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
    // [NEW] Visual Angle Smoothing
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
            this.start();
            // [DEBUG] Spawn Showcase Units if enabled
            if (GameConfig.SYSTEM.DEBUG_SHOWCASE_UNITS) {
                this.spawnShowcaseUnits();
            }
        });

        // [NEW] Listen for UI toggle events
        window.addEventListener('toggle-showcase-units', (e: any) => {
            this.toggleShowcase(e.detail?.visible ?? false);
        });
        window.addEventListener('toggle-showcase-battle', (e: any) => {
            this.toggleShowcaseBattle(e.detail?.attacking ?? false);
        });

        gameLog('startup', '🎨 GlobalUnitRenderer initialized');
    }

    private spawnShowcaseUnits(): void {
        gameLog('editorDebug', '🧪 [DEBUG] Spawning Showcase Units (Event Types)...');

        // [2026-05-30 修复] 旧聚合势力 id 已删，缺 factionId 时用 panjun
        // 换用项目里仍存在的势力 ID
        const showcaseTypes: { legionType: LegionType, factionId: string, label: string }[] = [
            { legionType: 'mixed',    factionId: 'tang',  label: '3×3 步骑骨架（示例）' },
            { legionType: 'cavalry',  factionId: 'menggu_d', label: '纯骑三角骨架（示例）' },
        ];

        // Grid Start (Near Luoyang)
        const startLat = 34.62;
        const startLng = 112.45;
        const gapLat = 0.60;

        showcaseTypes.forEach((entry, index) => {
            const lat = startLat - (index * gapLat);
            const lng = startLng;
            const id = `showcase_${entry.factionId}_${entry.legionType}_${index}`;
            const fixedPos = { lat, lng };

            const unit: IAnimatedUnit = {
                id: id,
                name: entry.label,
                getTroops: () => 60000,
                getPosition: () => fixedPos,
                isDestroyed: false,
                isAttacking: false,
                isMoving: false,
                currentBattleType: null,
                targetPos: null,
                lastPosition: fixedPos,
                type: 'legion',
                legionType: entry.legionType,
                factionId: entry.factionId,
                lastDirection: Math.floor(Math.random() * 8),
                visible: false, // Default OFF
            };

            this.register(unit);
            gameLog('editorDebug', `🧪 [DEBUG] Registered: ${id} (${entry.label})`);
        });

        gameLog('editorDebug', `✅ [DEBUG] Total showcase units: ${showcaseTypes.length}`);
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
        const pt = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
        const m = GlobalUnitRenderer.VIEW_CULL_MARGIN_PX;
        const w = this.canvas.width;
        const h = this.canvas.height;
        return pt.x >= -m && pt.x <= w + m && pt.y >= -m && pt.y <= h + m;
    }

    /** 视口内可见单位（已做屏幕裁剪） */
    private collectVisibleUnitsInView(): IAnimatedUnit[] {
        const list: IAnimatedUnit[] = [];
        for (let i = 0; i < this.sortedUnitsCache.length; i++) {
            const unit = this.sortedUnitsCache[i];
            if ((unit as any).visible === false) continue;
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

    // [NEW] Toggle Showcase Units Visibility
    public toggleShowcase(visible: boolean): void {
        console.log(`🧪 [GlobalUnitRenderer] Toggling showcase units: ${visible}`);
        let count = 0;
        this.units.forEach(unit => {
            if (unit.id && unit.id.startsWith('showcase_')) {
                (unit as any).visible = visible;
                count++;
            }
        });
        console.log(`   - Updated ${count} units`);
        this.needsSort = true; // Force redraw
        this.mapNeedsRedraw = true;
    }

    // [NEW] Toggle Showcase Units Battle State (for testing animations)
    public toggleShowcaseBattle(attacking: boolean): void {
        console.log(`⚔️ [GlobalUnitRenderer] Toggling showcase battle: ${attacking}`);
        let count = 0;
        let directionIndex = 0;

        // 8方向向量 (用于计算目标位置)
        const dirVectors = [
            { lat: -0.3, lng: 0 },     // 0: S
            { lat: -0.2, lng: 0.2 },   // 1: SE
            { lat: 0, lng: 0.3 },      // 2: E
            { lat: 0.2, lng: 0.2 },    // 3: NE
            { lat: 0.3, lng: 0 },      // 4: N
            { lat: 0.2, lng: -0.2 },   // 5: NW
            { lat: 0, lng: -0.3 },     // 6: W
            { lat: -0.2, lng: -0.2 },  // 7: SW
        ];

        this.units.forEach(unit => {
            if (unit.id && unit.id.startsWith('showcase_')) {
                unit.isAttacking = attacking;
                unit.currentBattleType = attacking ? 'field' : null;

                if (attacking) {
                    const pos = unit.getPosition();
                    // 每个单位使用不同朝向 (随机8个方向)
                    const dir = Math.floor(Math.random() * 8);
                    const vec = dirVectors[dir];
                    unit.targetPos = { lat: pos.lat + vec.lat, lng: pos.lng + vec.lng };
                    unit.lastDirection = dir;
                    directionIndex++;
                } else {
                    unit.targetPos = null;
                    unit.lastDirection = Math.floor(Math.random() * 8); // Randomize direction when idle
                }
                count++;
            }
        });
        console.log(`   - Updated ${count} units to ${attacking ? 'ATTACKING (8 directions)' : 'IDLE'}`);
        this.needsSort = true;
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
                if (Date.now() - t0 <= corpseMs) hasVisibleCorpses = true;
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

        for (let i = 0; i < drawList.length; i++) {
            const unit = drawList[i];

            if (unit.isDestroyed) {
                const t0 = unit.destroyTime ?? Date.now();
                if (!unit.destroyTime) unit.destroyTime = t0;
                if (Date.now() - t0 > corpseMs) {
                    continue;
                }
            }

            this.renderUnit(unit, this.ctx);
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
        // [NEW] Check for battle end signal to clear corpses
        const id = unit.id || 'unknown';
        const isFighting = unit.currentBattleType !== null; // OR unit.isAttacking?
        const wasFighting = this.unitFightingStates.get(id) || false;

        if (wasFighting && !isFighting) {
            LegionPhalanxDrawer.resetUnit(id); // [AI SYSTEM]
        }
        this.unitFightingStates.set(id, isFighting);

        const currentPos = unit.getPosition();

        // Check if unit is moving
        const posChanged = Math.abs(currentPos.lat - unit.lastPosition.lat) > 0.0001 ||
            Math.abs(currentPos.lng - unit.lastPosition.lng) > 0.0001;

        if (unit.id?.startsWith('army_editor_preview_')) {
            // ArmyEditor strictly controls its own isMoving state
        } else {
            if (posChanged) unit.isMoving = true;
            else unit.isMoving = false; // Or let unit decide.
        }

        // [NEW] Projectile Spawner Logic
        // If attacking AND is ranged/mixed AND has target
        if (unit.isAttacking && unit.targetPos) {
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
                        const baseEnd = L.latLng(unit.targetPos.lat, unit.targetPos.lng);
                        this.projectileSystem.spawnVolley(baseStart, baseEnd);

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
        // Base center point
        let centerPoint = this.map.latLngToContainerPoint([unitPos.lat, unitPos.lng]);

        const m = GlobalUnitRenderer.VIEW_CULL_MARGIN_PX;
        if (
            centerPoint.x < -m ||
            centerPoint.x > this.canvas.width + m ||
            centerPoint.y < -m ||
            centerPoint.y > this.canvas.height + m
        ) {
            return;
        }

        const currentZoom = this.map.getZoom();
        const effectiveZoom = Math.min(currentZoom, 10);
        const scale = Math.pow(2, effectiveZoom - 9) * 0.7; // [USER REQUEST] Reduced to 0.7
        const troops = unit.getTroops();

        // Determine Direction First (needed for offset)
        // Initialize random direction if undefined (for natural Bandit look)
        if (unit.lastDirection === undefined) {
            unit.lastDirection = Math.floor(Math.random() * 8);
        }
        let directionIndex = unit.lastDirection;
        if (unit.isAttacking && unit.targetPos) {
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
                scale,
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

            // 1. Draw Flag Pole (Behind Soldiers / Ship)
            LegionFlagDrawer.drawPole(
                ctx,
                { x: centerPoint.x, y: centerPoint.y },
                useNavalVisual ? scale * 0.85 : scale,
                unit.factionId || 'panjun'
            );

            if (useNavalVisual) {
                LegionPhalanxDrawer.drawNaval(
                    ctx,
                    { x: centerPoint.x, y: centerPoint.y },
                    state,
                    directionIndex,
                    scale,
                    troops,
                    Date.now(),
                    unit.factionId || 'zhonghua',
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
                    scale,
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
                scale,
                Date.now(),
                unit.factionId || 'panjun',
                currentYear // [NEW] Pass year
            );
        }

        // Update last position for next frame
        unit.lastPosition = { lat: unitPos.lat, lng: unitPos.lng };

        // Draw Unit Name/Info (Optional)
        this.renderInfo(ctx, centerPoint, unit, scale);
    }

    private renderInfo(ctx: CanvasRenderingContext2D, center: L.Point, unit: IAnimatedUnit, scale: number) {
        if (!this.showLabels) return;
        if (!unit.name) return;

        // [MATCH CITY STYLE] Position label BELOW the unit
        // Fixed offset + scale factor to avoid overlap
        const y = center.y + 45 * scale;

        // Fixed Font Size (13px) to match City Labels
        const fontSize = 13;

        // Standard Text (No Portrait)
        // Name (white with black outline)
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center'; // Center align
        ctx.textBaseline = 'top';

        // Draw black outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(unit.name, center.x, y);

        // Draw white text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(unit.name, center.x, y);

        // Troops (Below Name)
        // Gold like city
        const troopsFontSize = 12; // Match City Troop Size
        const troopsText = `${Math.floor(unit.getTroops())}`;
        ctx.font = `bold ${troopsFontSize}px Arial`;

        const troopsY = y + fontSize + 4; // Line gap

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(troopsText, center.x, troopsY);

        ctx.fillStyle = '#ffd700'; // Gold
        ctx.fillText(troopsText, center.x, troopsY);
    }

    public destroy(): void {
        this.stop();
        this.canvas.remove();
        this.canvasLow.remove();
    }
}
