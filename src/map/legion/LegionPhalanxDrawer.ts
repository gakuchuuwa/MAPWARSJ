import { AssetLoader } from '../../core/AssetLoader';
import { SPRITE_PATHS } from '../../config/GameConfig';
import { FormationSystem } from '../../core/FormationSystem';
import { GeneralDrawer } from '../GeneralDrawer';
import { PhalanxVitality } from '../PhalanxVitality';
import { LegionPhalanxStateManager, LegionUnitState } from './LegionPhalanxState';
import { LegionType } from '../../types/UnitTypes';
import { SpriteTinter } from '../../systems/tinting/SpriteTinter';
import { FactionTintSystem } from '../../systems/tinting/FactionTintSystem';
import { getCompositionTier, CompositionTier, expandCompositionSlots } from '../../types/LegionComposition';
import { getNavalShipAssetId } from '../../types/NavalShipTiers';
import { gameLog } from '../../utils/GameLogger';

/** 启动时不预载（S10DB 860+ 素材尚未部署），首次水战再按需加载 */
const LAZY_BOOT_UNIT_IDS = new Set(['ship_small', 'ship_medium', 'ship_large']);

export type PhalanxAnimState = 'IDLE' | 'MOVE' | 'ATTACK' | 'DAMAGE' | 'DEATH';

export class LegionPhalanxDrawer {

    /** 纯骑 1-2-3 等腰三角 (6 人): 草原 / 青藏 / 西域 */
    private static readonly TRIANGLE_LAYOUT = [
        { r: 0, c: 0 },
        { r: 1, c: -1 }, { r: 1, c: 1 },
        { r: 2, c: -2 }, { r: 2, c: 0 }, { r: 2, c: 2 },
    ] as const;

    private static readonly PURE_CAVALRY_LEGION_TYPES: LegionType[] = ['cavalry', 'archer_cavalry'];

    /** S10DB 多数步兵/弩弓条带行高 64px；长枪、骑兵条带为 84px。绘制时按 64 归一化，避免同 scale 下 84px 素材显小。 */
    private static readonly S10DB_REF_FRAME_H = 64;

    // [DYNAMIC ASSET SYSTEM]
    // Key: unitAssetId (e.g. 'huaxia_infantry') -> Local Sprite Cache
    private static unitSpriteCache: Map<string, {
        MOVE: HTMLImageElement[],
        ATTACK: HTMLImageElement[],
        IDLE: HTMLImageElement[],
        DAMAGE: HTMLImageElement[],
        DEATH: HTMLImageElement[],
        SECONDARY?: {
            MOVE: HTMLImageElement[],
            ATTACK: HTMLImageElement[],
            IDLE: HTMLImageElement[],
            DAMAGE: HTMLImageElement[],
            DEATH: HTMLImageElement[],
            SHOOT: HTMLImageElement[]
        },
        TERTIARY?: {
            MOVE: HTMLImageElement[],
            ATTACK: HTMLImageElement[],
            IDLE: HTMLImageElement[],
            DAMAGE: HTMLImageElement[],
            DEATH: HTMLImageElement[],
            SHOOT: HTMLImageElement[]
        }
    }> = new Map();

    // [RTS INTERFACE] Expose assets for RTS renderer
    public static getUnitAssets(unitAssetsId: string) {
        return this.unitSpriteCache.get(unitAssetsId);
    }

    private static isLoaded = false;
    // [PERF-FIX] Re-entrancy guard：防止被并发调用时重复跑全量 canvas 处理
    private static loadingPromise: Promise<void> | null = null;

    public static async preload(): Promise<void> {
        if (this.isLoaded) return;
        if (this.loadingPromise) return this.loadingPromise;
        this.loadingPromise = this._doPreload();
        try {
            await this.loadingPromise;
        } finally {
            this.loadingPromise = null;
        }
    }

    private static async _doPreload(): Promise<void> {

        // [PERF-FIX] 分批 + 每批让出主线程
        // 原版用 Promise.all 把一个 unit type 的所有动画帧 (5-15 套动画 × 4-8 帧)
        // 一次 processImage —— 每张都是同步 getImageData + 像素循环 + putImageData
        // + toDataURL (浏览器最慢的 API 之一)。这是和 preloadFlags 同等量级的主线程
        // 杀手，且在 GameApp.start 里两者还并发。
        //
        // 后台标签时跳过 yield —— setTimeout 在后台被钳制到 1000ms，几十个 yield 累计
        // 几十秒会让"切走再回来"启动慢到几分钟。后台时反正没人看 UI，
        // 同步连跑最快完成。前台时维持 yield 避免主线程卡死。
        const yieldMain = () => document.hidden
            ? Promise.resolve()
            : new Promise<void>(r => setTimeout(r, 0));
        const PROC_BATCH = 4;

        const loadBatch = async (sourcePaths: readonly string[], targetArray: HTMLImageElement[]) => {
            await AssetLoader.preloadImages([...sourcePaths]);
            // 分批 processImage 而不是一把梭，每批之间 yield
            for (let i = 0; i < sourcePaths.length; i += PROC_BATCH) {
                const slice = sourcePaths.slice(i, i + PROC_BATCH);
                await Promise.all(slice.map(async (path, batchIdx) => {
                    const realIdx = i + batchIdx;
                    const img = AssetLoader.getImage(path);
                    if (img) {
                        const processed = await this.processImage(img);
                        targetArray[realIdx] = processed;
                    }
                }));
                if (i + PROC_BATCH < sourcePaths.length) {
                    await yieldMain();
                }
            }
        };

        gameLog('unit', '🔄 LegionPhalanxDrawer: Processing Dynamic Unit Assets...');

        // 1. Load Generic / Legacy Assets (if needed)
        // ...

        // 2. Load Granular Unit Assets from GameConfig.UNIT_ASSETS
        const unitAssets = SPRITE_PATHS.UNIT_ASSETS as any;
        if (unitAssets) {
            for (const [key, assets] of Object.entries(unitAssets)) {
                if (LAZY_BOOT_UNIT_IDS.has(key)) continue;
                const config = assets as any;
                const cacheEntry = {
                    MOVE: [] as HTMLImageElement[],
                    ATTACK: [] as HTMLImageElement[],
                    IDLE: [] as HTMLImageElement[],
                    DAMAGE: [] as HTMLImageElement[],
                    DEATH: [] as HTMLImageElement[],
                    SHOOT: [] as HTMLImageElement[],  // [NEW] For mounted archers
                    CHARGE: [] as HTMLImageElement[], // [NEW] For cavalry charge animation
                    SECONDARY: config.SECONDARY ? {
                        MOVE: [] as HTMLImageElement[],
                        ATTACK: [] as HTMLImageElement[],
                        IDLE: [] as HTMLImageElement[],
                        DAMAGE: [] as HTMLImageElement[],

                        DEATH: [] as HTMLImageElement[],
                        SHOOT: [] as HTMLImageElement[],
                        CHARGE: [] as HTMLImageElement[] // [NEW] Added CHARGE support for Secondary
                    } : undefined,
                    TERTIARY: config.TERTIARY ? {
                        MOVE: [] as HTMLImageElement[],
                        ATTACK: [] as HTMLImageElement[],
                        IDLE: [] as HTMLImageElement[],
                        DAMAGE: [] as HTMLImageElement[],
                        DEATH: [] as HTMLImageElement[],
                        SHOOT: [] as HTMLImageElement[]
                    } : undefined
                };

                const promises = [
                    loadBatch(config.MOVE, cacheEntry.MOVE),
                    loadBatch(config.ATTACK, cacheEntry.ATTACK),
                    loadBatch(config.IDLE, cacheEntry.IDLE),
                    loadBatch(config.DAMAGE, cacheEntry.DAMAGE),
                    loadBatch(config.DEATH, cacheEntry.DEATH),
                ];

                // [NEW] Load SHOOT and CHARGE if available
                if (config.SHOOT) {
                    promises.push(loadBatch(config.SHOOT, cacheEntry.SHOOT));
                }
                if (config.CHARGE) {
                    promises.push(loadBatch(config.CHARGE, cacheEntry.CHARGE));
                }

                if (config.SECONDARY && cacheEntry.SECONDARY) {
                    promises.push(loadBatch(config.SECONDARY.MOVE, cacheEntry.SECONDARY.MOVE));
                    promises.push(loadBatch(config.SECONDARY.ATTACK, cacheEntry.SECONDARY.ATTACK));
                    promises.push(loadBatch(config.SECONDARY.IDLE, cacheEntry.SECONDARY.IDLE));
                    promises.push(loadBatch(config.SECONDARY.DAMAGE, cacheEntry.SECONDARY.DAMAGE));
                    promises.push(loadBatch(config.SECONDARY.DEATH, cacheEntry.SECONDARY.DEATH));
                    if (config.SECONDARY.SHOOT) {
                        promises.push(loadBatch(config.SECONDARY.SHOOT, cacheEntry.SECONDARY.SHOOT));
                    }
                    if (config.SECONDARY.CHARGE) {
                        promises.push(loadBatch(config.SECONDARY.CHARGE, cacheEntry.SECONDARY.CHARGE));
                    }

                }

                // [NEW] TERTIARY Support (for 3-tier formations like Mixed)
                if (config.TERTIARY && (cacheEntry as any).TERTIARY) {
                    const tert = (cacheEntry as any).TERTIARY;
                    promises.push(loadBatch(config.TERTIARY.MOVE, tert.MOVE));
                    promises.push(loadBatch(config.TERTIARY.ATTACK, tert.ATTACK));
                    promises.push(loadBatch(config.TERTIARY.IDLE, tert.IDLE));
                    promises.push(loadBatch(config.TERTIARY.DAMAGE, tert.DAMAGE));
                    promises.push(loadBatch(config.TERTIARY.DEATH, tert.DEATH));
                    if (config.TERTIARY.SHOOT) {
                        promises.push(loadBatch(config.TERTIARY.SHOOT, tert.SHOOT));
                    }
                }

                await Promise.all(promises);
                this.unitSpriteCache.set(key, cacheEntry);
                // [PERF] 每个 unit type 处理完再让一次主线程，
                // 避免连续多个 unit type 紧挨着跑（即使内部已经分批）
                await yieldMain();
            }
        }


        await GeneralDrawer.preload();
        this.isLoaded = true;
        gameLog('unit', '✅ LegionPhalanxDrawer: All dynamic unit assets loaded.');
    }

    // ─── 船贴图懒加载（2026-06-12 修复）────────────────────────────
    // LAZY_BOOT_UNIT_IDS 当年只做了"启动跳过"没做"事后加载"，
    // unitSpriteCache 永远没有三种船 → drawNaval 永远早退 → 船从不显示。
    // 现在由 drawNaval 首次被调用时触发后台加载（与 _doPreload 同样的分批 + 抠绿流程）。
    private static navalLoadStarted = false;

    private static ensureNavalAssetsLoading(): void {
        if (this.navalLoadStarted) return;
        this.navalLoadStarted = true;
        void this._loadNavalAssets().catch((e) => {
            gameLog('unit', '❌ 船贴图懒加载失败', e);
            this.navalLoadStarted = false; // 允许下次重试
        });
    }

    private static async _loadNavalAssets(): Promise<void> {
        const yieldMain = () => document.hidden
            ? Promise.resolve()
            : new Promise<void>(r => setTimeout(r, 0));
        const PROC_BATCH = 4;

        const loadBatch = async (sourcePaths: readonly string[], targetArray: HTMLImageElement[]) => {
            await AssetLoader.preloadImages([...sourcePaths]);
            for (let i = 0; i < sourcePaths.length; i += PROC_BATCH) {
                const slice = sourcePaths.slice(i, i + PROC_BATCH);
                await Promise.all(slice.map(async (path, batchIdx) => {
                    const img = AssetLoader.getImage(path);
                    if (img) {
                        targetArray[i + batchIdx] = await this.processImage(img);
                    }
                }));
                if (i + PROC_BATCH < sourcePaths.length) await yieldMain();
            }
        };

        const unitAssets = SPRITE_PATHS.UNIT_ASSETS as any;
        for (const key of LAZY_BOOT_UNIT_IDS) {
            const config = unitAssets?.[key];
            if (!config || this.unitSpriteCache.has(key)) continue;

            const cacheEntry = {
                MOVE: [] as HTMLImageElement[],
                ATTACK: [] as HTMLImageElement[],
                IDLE: [] as HTMLImageElement[],
                DAMAGE: [] as HTMLImageElement[],
                DEATH: [] as HTMLImageElement[],
            };
            await Promise.all([
                loadBatch(config.MOVE, cacheEntry.MOVE),
                loadBatch(config.ATTACK, cacheEntry.ATTACK),
                loadBatch(config.IDLE, cacheEntry.IDLE),
                loadBatch(config.DAMAGE, cacheEntry.DAMAGE),
                loadBatch(config.DEATH, cacheEntry.DEATH),
            ]);
            this.unitSpriteCache.set(key, cacheEntry);
            await yieldMain();
        }
        gameLog('unit', '⛵ 船贴图懒加载完成（1万/2万/5万 三档）');
    }

    private static processImage(img: HTMLImageElement): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            if (!img.complete || img.naturalWidth === 0) { resolve(img); return; }
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(img); return; }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 1] > 200 && data[i] < 100 && data[i + 2] < 100) data[i + 3] = 0;
            }
            ctx.putImageData(imageData, 0, 0);
            const newImg = new Image();
            newImg.onload = () => resolve(newImg);
            newImg.src = canvas.toDataURL();
        });
    }

    // [New Standard] 3x3 Grid Offset


    // [POOLED RENDERING] Reuse objects to reduce GC
    private static renderPool: { y: number, drawParams: any }[] = [];
    private static poolIndex = 0;

    // [OFFSET CACHING] Cache grid calculations
    // Key: `${index}_${rows}_${cols}_${spacingX}_${spacingY}_${direction}`
    private static offsetCache: Map<string, { x: number, y: number }> = new Map();

    private static getPooledItem(): { y: number, drawParams: any } {
        if (this.poolIndex >= this.renderPool.length) {
            this.renderPool.push({
                y: 0,
                drawParams: {
                    img: null,
                    sx: 0, sy: 0, sw: 0, sh: 0,
                    dx: 0, dy: 0, dw: 0, dh: 0,
                    alpha: 1, scale: 1 // [NEW] Supports opacity and scale
                }
            });
        }
        return this.renderPool[this.poolIndex++];
    }
    private static resetPool(): void {
        this.poolIndex = 0;
    }

    public static resetUnit(unitId: string): void {
        LegionPhalanxStateManager.reset(unitId);
    }

    // [NEW] Helper: Get Frame Count based on Aspect Ratio
    private static getFrameCount(img: HTMLImageElement | null): number {
        if (!img || img.naturalWidth === 0) return 1;
        // If width approx equals height (< 2x), it's single frame (S10DB/NPC)
        if (img.naturalWidth < img.naturalHeight * 2) return 1;
        // Standard convention: 8 frames
        return 8;
    }

    /**
     * Draw a Legion Phalanx (3x3 Grid or Hex)
     */
    public static draw(
        unitId: string,
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        troops: number,
        tick: number = 0,
        hasGeneral: boolean = false,
        isFighting: boolean = false,
        projectFn?: (lat: number, lng: number) => { x: number, y: number },
        unprojectFn?: (x: number, y: number) => { lat: number, lng: number },
        legionType: LegionType = 'infantry',
        factionId: string = 'zhonghua',
        cultureSlots: string[] | null = null,
        unitAssetsId: string = 'light_infantry',
        isPlayer: boolean = false, // [NEW] Identify plain player units
        cultureScales: number[] | null = null // [NEW] Custom scales
    ): void {
        if (!this.isLoaded) return;

        // --- 1. SETUP & CONFIG ---
        // [CLEANED] Data-driven: cultureSlots defines count. No more hardcoded legionType checks.
        let count = 9; // Default for 3x3
        let gridSize = 3; // Default 3x3
        let isTriangleFormation = false;

        // Priority 1: Use cultureSlots length (from editor / CultureFormations.ts)
        if (cultureSlots && cultureSlots.length > 0) {
            count = cultureSlots.length;
            isTriangleFormation = count === 6;
            gridSize = 3;
            if (!isTriangleFormation) {
                gridSize = Math.ceil(Math.sqrt(count));
            }
        } else {
            // Priority 2: Try legacy getCompositionTier fallback
            const tier = getCompositionTier(troops, legionType);
            if (tier) {
                gridSize = tier.gridSize;
                count = gridSize * gridSize;
            }
            if (LegionPhalanxDrawer.PURE_CAVALRY_LEGION_TYPES.includes(legionType)) {
                count = 6;
                isTriangleFormation = true;
                gridSize = 3;
            }
        }

        const rows = gridSize;
        const cols = gridSize;

        // Retrieve Asset Cache
        let assets = this.unitSpriteCache.get(unitAssetsId);

        if (!assets) {
            assets = this.unitSpriteCache.get(legionType);
        }
        if (!assets) {
            assets = this.unitSpriteCache.get('mixed');
        }
        if (!assets) {
            assets = this.unitSpriteCache.get('light_infantry');
        }
        if (!assets) {
            console.error(`❌ [LPD] CRITICAL: No assets found for ${unitAssetsId} / ${legionType}. Rendering Aborted.`);
            return;
        }

        // Base Dimension Reference (from Primary Idle)
        const refSprite = assets.IDLE[direction] || assets.IDLE[0];
        if (!refSprite) return;

        const refTotalFrames = this.getFrameCount(refSprite);
        const baseHeight = 100; // Standard size for all units

        // [DYNAMIC RATIO]
        // Do NOT force unitRatio here. We calculate it per-sprite in the loop.
        // We just need a rough spacing estimation here.
        // Assuming typical sprite is roughly square-ish or 0.8 ratio.
        const estRatio = 0.8;
        const renderH = baseHeight * scale;
        const estRenderW = renderH * estRatio;

        // Spacing based on estimated width
        // [3x3 TUNED] Balanced spacing - not too dense, not too loose
        const spacingX = estRenderW * 0.50;
        const spacingY = renderH * 0.42;

        // --- 2. UPDATE STATE ---
        const currentState = LegionPhalanxStateManager.update(
            unitId, troops, rows, cols, count, direction, tick, isFighting, center, unprojectFn,
            (idx) => this.getFormationOffset(idx, spacingX, spacingY, direction, legionType, rows, isTriangleFormation)
        );

        this.resetPool();
        const activeItems: { y: number, drawParams: any }[] = [];
        const totalSlots = currentState.slots.length;

        // --- 3. RENDER LOOP ---
        // [NEW] Spawn Animation Progress
        const spawnDuration = 800;
        const timeAlive = tick - (currentState.spawnTick || 0);
        const isSpawning = timeAlive < spawnDuration && timeAlive >= 0;

        // B. Select Sprite Set & Identify Unit Type (Moved Up for Logic)
        for (let i = 0; i < totalSlots; i++) {
            const slot = currentState.slots[i];
            let currentSet = assets;
            let resolvedUnitType = unitAssetsId; // Default
            let isMixed = false; // [FIX] Declared at loop scope for combat crowding logic

            // [NEW] 14-culture formation slots override
            if (cultureSlots && i < cultureSlots.length) {
                resolvedUnitType = cultureSlots[i];
                currentSet = this.unitSpriteCache.get(resolvedUnitType) || assets;
            } else {
                // [GENERIC FALLBACK] 
                // If no cultureSlots are defined (e.g. legacy or unconfigured army),
                // attempt to resolve via generic getCompositionTier data structure.
                const tier = getCompositionTier(troops, legionType);
                if (tier) {
                    const expandedSlots = expandCompositionSlots(tier.slots);
                    resolvedUnitType = expandedSlots[i] || unitAssetsId;
                    currentSet = this.unitSpriteCache.get(resolvedUnitType) || assets;
                }
            }

            // A. Calculate Position
            let drawX: number, drawY: number;
            let dynamicScale = 1.0;
            let dynamicAlpha = 1.0;

            // [NEW] Spawn Animation
            if (isSpawning) {
                const cx = (cols - 1) / 2;
                const cy = (rows - 1) / 2;
                const r = Math.floor(i / cols);
                const c = i % cols;
                const dist = Math.sqrt((r - cy) ** 2 + (c - cx) ** 2);

                const delay = dist * 50;
                const unitTime = timeAlive - delay;

                if (unitTime < 0) {
                    dynamicScale = 0;
                    dynamicAlpha = 0;
                } else {
                    const progress = Math.min(1, unitTime / 400);
                    const back = (t: number) => {
                        const c1 = 1.70158;
                        const c3 = c1 + 1;
                        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                    };
                    dynamicScale = back(progress);
                    dynamicAlpha = progress;
                }
            } else {
                dynamicScale = 1.0;
                dynamicAlpha = 1.0;
            }

            // Skip if invisible
            if (dynamicAlpha <= 0.01) continue;

            const baseOffset = this.getFormationOffset(i, spacingX, spacingY, direction, legionType, rows, isTriangleFormation);
            drawX = center.x + baseOffset.x;
            drawY = center.y + baseOffset.y;

            if ((slot.state === 'DEAD' || slot.state === 'DYING') && slot.deadLat && slot.deadLng && projectFn) {
                const proj = projectFn(slot.deadLat, slot.deadLng);
                drawX = proj.x;
                drawY = proj.y;
            } else if (isFighting && slot.state !== 'DEAD' && slot.state !== 'DYING') {

                // 2. CAVALRY CHARGE (Refined with resolvedUnitType)
                // Identify if this unit IS a cavalry type unit
                const isCavalryUnit =
                    resolvedUnitType.includes('cavalry') ||
                    resolvedUnitType === 'lancer' ||
                    resolvedUnitType === 'general_cavalry' ||
                    legionType.includes('cavalry'); // Fallback

                // Only charge if it IS cavalry, AND we are in a mixed/cavalry context
                // (Pure infantry shouldn't charge even if they have cavalry name? No, sticking to intent)
                // The intent: "Cavalry rows in mixed formations or pure cavalry should charge"

                if (isCavalryUnit) {
                    const cycleDur = 2000;
                    const unitPhase = (i * 0.35) * 1000;
                    const phase = ((tick + unitPhase) % cycleDur) / cycleDur;

                    const formationAngle = (direction + 1) * Math.PI / 4;
                    const chargeAngle = formationAngle - Math.PI / 2;

                    // Rank Multiplier Logic
                    let rankMultiplier = 0.5;
                    // Simple heuristic: Further back = larger surge to pass front
                    const rowIdx = isTriangleFormation
                        ? (LegionPhalanxDrawer.TRIANGLE_LAYOUT[i]?.r ?? 2)
                        : Math.floor(i / cols);
                    if (rowIdx === 0) rankMultiplier = 0.3;
                    else if (rowIdx === 1) rankMultiplier = 0.8;
                    else if (rowIdx >= 2) rankMultiplier = 1.2;

                    const baseSurge = spacingY * 1.2;
                    const chargeRange = baseSurge * rankMultiplier;

                    const rawSin = Math.sin(phase * Math.PI * 2);
                    let surgeFactor = rawSin;
                    if (surgeFactor < 0) surgeFactor *= 0.2;

                    drawX += Math.cos(chargeAngle) * (surgeFactor * chargeRange);
                    drawY += Math.sin(chargeAngle) * (surgeFactor * chargeRange);

                    if (surgeFactor > 0) {
                        dynamicScale = 1.0 + (surgeFactor * 0.15);
                    }
                }

                // 3. JITTER
                const seed = (i * 9301 + 49297) % 233280;
                const rnd = seed / 233280.0;
                const jitterAmt = 8 * (spacingX / 35);
                drawX += (rnd - 0.5) * jitterAmt;
                drawY += ((1.0 - rnd) - 0.5) * jitterAmt;
            }

            // C. Select Specific Sprite based on State
            // (Note: currentSet is already selected above)
            let rawSprite: HTMLImageElement | undefined;
            let animState = state; // Default to global state

            if (slot.state === 'DYING' || slot.state === 'DEAD') {
                const deathDir = slot.deathDirection ?? direction;
                rawSprite = currentSet.DEATH[deathDir] || currentSet.DEATH[0];
                animState = 'DEATH';
            } else if (state === 'DEATH') {
                // [2026-05-30] 全局 DEATH 状态 (ArmyEditor 预览用)
                // 每兵真随机朝向 (Math.random) + 起始时间
                // slot.deathDirection 设一次后缓存, 不闪
                if (slot.deathDirection === undefined) {
                    slot.deathDirection = Math.floor(Math.random() * 8);
                    slot.stateStartTime = tick;
                }
                rawSprite = currentSet.DEATH[slot.deathDirection] || currentSet.DEATH[0];
                animState = 'DEATH';
            } else if (state === 'DAMAGE') {
                rawSprite = currentSet.DAMAGE[direction] || currentSet.DAMAGE[0];
            } else if (state === 'ATTACK') {
                if ((currentSet as any).SHOOT?.length > 0 && (currentSet as any).CHARGE?.length > 0) {
                    const cycleDuration = 4000;
                    const cyclePhase = (tick % cycleDuration) / cycleDuration;
                    if (cyclePhase < 0.25) rawSprite = (currentSet as any).SHOOT[direction] || (currentSet as any).SHOOT[0];
                    else if (cyclePhase < 0.50) rawSprite = (currentSet as any).CHARGE[direction] || (currentSet as any).CHARGE[0];
                    else if (cyclePhase < 0.75) rawSprite = currentSet.ATTACK[direction] || currentSet.ATTACK[0];
                    else rawSprite = (currentSet as any).SHOOT[direction] || (currentSet as any).SHOOT[0];
                } else if ((currentSet as any).SHOOT && (currentSet as any).SHOOT.length > 0) {
                    rawSprite = (currentSet as any).SHOOT[direction] || (currentSet as any).SHOOT[0];
                } else {
                    rawSprite = currentSet.ATTACK[direction] || currentSet.ATTACK[0];
                }
            } else if (state === 'MOVE') {
                rawSprite = currentSet.MOVE[direction] || currentSet.MOVE[0];
            } else {
                rawSprite = currentSet.IDLE[direction] || currentSet.IDLE[0];
            }

            // Fallback to IDLE if specific action missing
            if (!rawSprite && state !== 'IDLE') {
                rawSprite = currentSet.IDLE[direction] || currentSet.IDLE[0];
            }

            if (!rawSprite || !rawSprite.complete || rawSprite.naturalWidth === 0) continue;

            // D. Tinting (Apply Tint)
            // Ideally we cache this, but SpriteTinter has internal cache
            const tintedSprite = SpriteTinter.getTintedSprite(rawSprite, factionId);
            if (!tintedSprite) continue;

            // E. Frame Calculation
            // Independent check per sprite
            const spriteTotalFrames = this.getFrameCount(tintedSprite);
            let currentFrameIndex = 0;

            if (slot.state === 'ALIVE') {
                if (animState === 'DEATH') {
                    // [2026-05-30] DEATH 不循环, 播 1 次冻结末帧
                    const startT = slot.stateStartTime || tick;
                    const timeDead = tick - startT;
                    const deathFrame = Math.floor(timeDead / 150);
                    currentFrameIndex = Math.min(deathFrame, spriteTotalFrames - 1);
                } else if (animState === 'MOVE' || animState === 'ATTACK' || animState === 'DAMAGE') {
                    // 帧循环
                    const stagger = i * 2;
                    currentFrameIndex = Math.floor((tick / 150) + stagger) % spriteTotalFrames;
                } else {
                    // IDLE: Force Frame 0
                    currentFrameIndex = 0;
                }
            } else if (slot.state === 'DYING' || slot.state === 'DEAD') {
                // Death Animation
                if (spriteTotalFrames === 1) {
                    currentFrameIndex = 0; // Single frame corpse
                } else {
                    const timeDead = tick - slot.stateStartTime;
                    const deathFrame = Math.floor(timeDead / 150);
                    currentFrameIndex = Math.min(deathFrame, spriteTotalFrames - 1);
                }

                // Transition to fully DEAD if anim done
                if (currentFrameIndex >= spriteTotalFrames - 1) {
                    slot.state = 'DEAD';
                }
            }

            // F. Prepare Draw
            const frameW = tintedSprite.width / spriteTotalFrames;
            const frameH = tintedSprite.height;
            const frameCol = currentFrameIndex;

            // Pool Item
            const item = this.getPooledItem();
            item.y = drawY + renderH / 2;

            item.drawParams.img = tintedSprite;
            item.drawParams.sx = frameCol * frameW;
            item.drawParams.sy = 0;
            item.drawParams.sw = frameW;
            item.drawParams.sh = frameH;
            item.drawParams.alpha = dynamicAlpha; // Store Alpha

            let scalingFactor = 1.0; // [USER REQUEST] Default to 1.0 exactly.

            // [DYNAMIC RENDERING]
            // If the user has saved custom culture scales from the editor, 
            // those scales OVERRIDE the legacy perspective scaling entirely
            // to ensure 100% visual consistency with the editor's UI grid.
            if (cultureScales && i < cultureScales.length) {
                scalingFactor = cultureScales[i];
            }
            // Apply dynamic scale (spawn animation etc.) into the single scaling factor
            scalingFactor *= dynamicScale;

            // Calculate Render Dimensions based on ACTUAL sprite aspect ratio.
            // [FIX] Use height-based sizing to ensure all unit types (infantry/cavalry)
            // appear at consistent visual heights regardless of aspect ratio.
            const currentRatio = frameW / frameH;
            
            const baseHeight = 80;

            // Height is the primary constraint, width follows from aspect ratio.
            // Normalize by source strip row height so spear (84px) matches crossbow (64px) at scale 1.
            const frameHeightNorm = frameH / this.S10DB_REF_FRAME_H;
            let targetH = baseHeight * scale * scalingFactor * frameHeightNorm;
            let targetW = targetH * currentRatio;

            const scaledRenderW = targetW;
            const scaledRenderH = targetH;
            item.drawParams.dx = drawX - scaledRenderW / 2;

            // Optimized Anchor: 0.5 (Center) default
            // [USER REQUEST] All units should be centered on the hex, not feet-anchored
            item.drawParams.dy = drawY - scaledRenderH * 0.5;
            item.drawParams.dw = scaledRenderW;
            item.drawParams.dh = scaledRenderH;

            // [DEBUG] One-time dimension check
            if (!(LegionPhalanxDrawer as any)._debugLogDone && unitAssetsId === 'huaxia_infantry' && (i === 0 || i === 6)) {
                console.log(`🔍 [LPD Analysis] Slot ${i} (${i === 0 ? 'Infantry' : 'Crossbow'}):`,
                    `NatSize: ${tintedSprite.width}x${tintedSprite.height}`,
                    `Frames: ${spriteTotalFrames}`,
                    `FrameSize: ${frameW.toFixed(1)}x${frameH}`,
                    `Ratio: ${(frameW / frameH).toFixed(2)}`,
                    `Render: ${item.drawParams.dw.toFixed(1)}x${item.drawParams.dh.toFixed(1)}`
                );
                if (i === 6) (LegionPhalanxDrawer as any)._debugLogDone = true;
            }

            activeItems.push(item);
        }

        // --- 4. FLUSH ---
        activeItems.sort((a, b) => a.y - b.y);
        for (let i = 0; i < activeItems.length; i++) {
            const p = activeItems[i].drawParams;
            if (p.alpha < 1) ctx.globalAlpha = p.alpha;
            ctx.drawImage(p.img, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.dw, p.dh);
            if (p.alpha < 1) ctx.globalAlpha = 1.0; // Reset
        }
    }

    /**
     * 海上单船渲染（海域 hex 或编辑器模拟）
     */
    public static drawNaval(
        ctx: CanvasRenderingContext2D,
        center: { x: number; y: number },
        state: PhalanxAnimState,
        direction: number,
        scale: number,
        troops: number,
        tick: number,
        factionId: string,
    ): void {
        const shipId = getNavalShipAssetId(troops);
        const currentSet = this.unitSpriteCache.get(shipId);
        if (!currentSet) {
            this.ensureNavalAssetsLoading(); // 首次海上渲染触发后台加载，加载完成前先不画
            return;
        }

        let rawSprite: HTMLImageElement | undefined;
        if (state === 'DEATH') {
            rawSprite = currentSet.DEATH[direction] || currentSet.DEATH[0];
        } else if (state === 'DAMAGE') {
            rawSprite = currentSet.DAMAGE[direction] || currentSet.DAMAGE[0];
        } else if (state === 'ATTACK') {
            rawSprite = currentSet.ATTACK[direction] || currentSet.ATTACK[0];
        } else if (state === 'MOVE') {
            rawSprite = currentSet.MOVE[direction] || currentSet.MOVE[0];
        } else {
            rawSprite = currentSet.IDLE[direction] || currentSet.IDLE[0];
        }
        if (!rawSprite?.complete || rawSprite.naturalWidth === 0) return;

        const tintedSprite = SpriteTinter.getTintedSprite(rawSprite, factionId);
        if (!tintedSprite) return;

        const spriteTotalFrames = this.getFrameCount(tintedSprite);
        let currentFrameIndex = 0;
        if (state === 'DEATH') {
            currentFrameIndex = Math.min(Math.floor(tick / 150), spriteTotalFrames - 1);
        } else if (state === 'MOVE' || state === 'ATTACK' || state === 'DAMAGE') {
            currentFrameIndex = Math.floor(tick / 150) % spriteTotalFrames;
        }

        const frameW = tintedSprite.width / spriteTotalFrames;
        const frameH = tintedSprite.height;
        const frameHeightNorm = frameH / this.S10DB_REF_FRAME_H;
        const baseHeight = 110;
        const targetH = baseHeight * scale * frameHeightNorm;
        const targetW = targetH * (frameW / frameH);

        ctx.drawImage(
            tintedSprite,
            currentFrameIndex * frameW, 0, frameW, frameH,
            center.x - targetW / 2,
            center.y - targetH / 2,
            targetW,
            targetH,
        );
    }

    // [NEW] Custom Formation Offset Calculation
    private static getFormationOffset(
        index: number,
        spacingX: number,
        spacingY: number,
        direction: number,
        type: LegionType,
        gridSizeInput?: number,
        useTriangle: boolean = false
    ): { x: number, y: number } {
        const key = `${index}_${direction}_${spacingX.toFixed(2)}_${spacingY.toFixed(2)}_${type}_${gridSizeInput}_${useTriangle ? 'tri' : 'grid'}`;

        if (this.offsetCache.has(key)) {
            return this.offsetCache.get(key)!;
        }

        let originalX = 0;
        let originalY = 0;

        // --- FORMATION LOGIC ---
        if (useTriangle && index < 6) {
            const pos = LegionPhalanxDrawer.TRIANGLE_LAYOUT[index] ?? LegionPhalanxDrawer.TRIANGLE_LAYOUT[0];
            originalY = (pos.r - 1.0) * spacingY;
            originalX = pos.c * spacingX * 0.7;
        } else {
            const gridSize = gridSizeInput || 3;
            const rows = gridSize;
            const cols = gridSize;
            const r = Math.floor(index / cols);
            const c = index % cols;

            const centerX = (cols - 1) / 2;
            const centerY = (rows - 1) / 2;

            originalX = (c - centerX) * spacingX;
            originalY = (r - centerY) * spacingY;
        }

        // [ROTATION]
        // Rotate the formation based on direction
        const angle = (direction + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const result = {
            x: originalX * cos - originalY * sin,
            y: originalX * sin + originalY * cos
        };

        if (this.offsetCache.size > 2000) this.offsetCache.clear();
        this.offsetCache.set(key, result);

        return result;
    }
}
