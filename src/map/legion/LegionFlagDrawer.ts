import { SPRITE_PATHS } from '../../config/GameConfig';
import { CityAssetManager } from '../../core/CityAssetManager';
import { gameLog } from '../../utils/GameLogger';

/**
 * LegionFlagDrawer - Handles rendering of animated flags for AI Legion units
 * Now supports per-faction flags, matching city flag system
 * Composites: Pole + Flag Body + Text Overlay (per faction)
 */
export class LegionFlagDrawer {
    private static pole: HTMLImageElement;
    private static factionFlags: Map<string, HTMLImageElement> = new Map();
    /** 与 CityAssetManager.processedFlagCache 同步，染色完成后 URL 变化须重载 */
    private static factionFlagSourceUrl: Map<string, string> = new Map();
    private static factionFlagLoading: Set<string> = new Set();
    private static factionTexts: Map<string, HTMLImageElement> = new Map();
    private static factionTextSourceUrl: Map<string, string> = new Map();
    private static factionTextLoading: Set<string> = new Set();
    private static generalPortraits: Map<string, HTMLImageElement> = new Map();
    private static isLoaded: boolean = false;

    // Dimensions
    private static FRAME_COLS = 4; // Animation frames
    private static FRAME_ROWS = 8; // Directions

    private static getDefaultFlagFallback(): HTMLImageElement | null {
        return this.factionFlags.get('qin') ?? this.factionFlags.get('panjun') ?? null;
    }

    /** 据点旗号染色完成 → 军队画布旗同步重载（与 CityAssetManager 同源） */
    public static invalidateFaction(factionId: string): void {
        if (!factionId) return;
        this.factionFlagSourceUrl.delete(factionId);
        this.factionFlagLoading.delete(factionId);
        this.factionFlags.delete(factionId);
        this.factionTextSourceUrl.delete(factionId);
        this.factionTextLoading.delete(factionId);
        this.factionTexts.delete(factionId);
    }

    /**
     * Dynamically retrieve or asynchronously load the faction flag body.
     */
    private static getOrLoadFactionFlag(factionId: string): HTMLImageElement | null {
        const flagUrl = CityAssetManager.getProcessedFlag(factionId);
        if (!flagUrl) return null;

        const cachedUrl = this.factionFlagSourceUrl.get(factionId);
        const cachedImg = this.factionFlags.get(factionId);
        if (cachedImg && cachedUrl === flagUrl) {
            return cachedImg;
        }

        if (!this.factionFlagLoading.has(factionId)) {
            this.factionFlagLoading.add(factionId);
            this.factionFlagSourceUrl.set(factionId, flagUrl);
            const img = new Image();
            img.onload = () => {
                this.factionFlagLoading.delete(factionId);
                if (this.factionFlagSourceUrl.get(factionId) === flagUrl) {
                    this.factionFlags.set(factionId, img);
                }
            };
            img.onerror = () => {
                this.factionFlagLoading.delete(factionId);
            };
            img.src = flagUrl;
        }

        return cachedImg ?? this.getDefaultFlagFallback();
    }

    /**
     * Dynamically retrieve or asynchronously load the faction flag text mask.
     */
    private static getOrLoadFactionText(factionId: string): HTMLImageElement | null {
        const textUrl = CityAssetManager.getProcessedFlagText(factionId);
        if (!textUrl) {
            return null;
        }

        const cachedUrl = this.factionTextSourceUrl.get(factionId);
        const cachedImg = this.factionTexts.get(factionId);
        if (cachedImg && cachedUrl === textUrl) {
            return cachedImg;
        }

        if (!this.factionTextLoading.has(factionId)) {
            this.factionTextLoading.add(factionId);
            this.factionTextSourceUrl.set(factionId, textUrl);
            const img = new Image();
            img.onload = () => {
                this.factionTextLoading.delete(factionId);
                if (this.factionTextSourceUrl.get(factionId) === textUrl) {
                    this.factionTexts.set(factionId, img);
                }
            };
            img.onerror = () => {
                this.factionTextLoading.delete(factionId);
            };
            img.src = textUrl;
        }

        return cachedImg ?? null;
    }

    public static async preload(): Promise<void> {
        if (this.isLoaded) return;

        const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        try {
            // Load pole (shared by all factions)
            this.pole = this.processImage(await loadImg(SPRITE_PATHS.PHALANX.FLAG.POLE));

            // Ensure CityAssetManager flags are preloaded
            await CityAssetManager.preloadFlags();

            // Load General Portraits
            if (SPRITE_PATHS.GENERAL_PORTRAITS) {
                for (const [genId, url] of Object.entries(SPRITE_PATHS.GENERAL_PORTRAITS)) {
                    try {
                        this.generalPortraits.set(genId, await loadImg(url));
                    } catch (err) {
                        console.warn(`Failed to load portrait for ${genId}`, err);
                    }
                }
            }

            // Warm up cache for default fallback flags
            const qinUrl = CityAssetManager.getProcessedFlag('qin');
            const panjunUrl = CityAssetManager.getProcessedFlag('panjun');
            
            const qinImg = await loadImg(qinUrl);
            const panjunImg = await loadImg(panjunUrl);
            
            this.factionFlags.set('qin', qinImg);
            this.factionFlags.set('panjun', panjunImg);

            const qinTextUrl = CityAssetManager.getProcessedFlagText('qin');
            if (qinTextUrl) {
                this.factionTexts.set('qin', await loadImg(qinTextUrl));
            }

            this.isLoaded = true;
            gameLog('unit', '🚩 LegionFlagDrawer: Core assets preloaded, others will load dynamically');
        } catch (e) {
            console.error("Failed to load Legion flag assets", e);
        }
    }

    /**
     * Simple Chroma Key (Green Removal)
     */
    private static processImage(img: HTMLImageElement): HTMLImageElement {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Green Screen: R < 100, G > 200, B < 100
            if (g > 200 && r < 100 && b < 100) {
                data[i + 3] = 0; // Alpha 0
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const newImg = new Image();
        newImg.src = canvas.toDataURL();
        return newImg;
    }

    /**
     * Draws only the pole (for layering underneath soldiers)
     */
    public static drawPole(
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        scale: number,
        factionId: string = 'panjun'
    ): void {
        if (!this.isLoaded) return;

        const body = this.getOrLoadFactionFlag(factionId);
        if (!body) return;

        const baseSize = 60; // Reduced flag size
        const frameWidth = body.width / this.FRAME_COLS;
        const frameHeight = body.height / this.FRAME_ROWS;
        const flagRenderHeight = baseSize * scale;

        const poleRenderHeight = flagRenderHeight * (this.pole.height / frameHeight);
        const poleRenderWidth = poleRenderHeight * (this.pole.width / this.pole.height);

        const poleX = center.x - poleRenderWidth / 2;
        const poleY = center.y - poleRenderHeight;

        ctx.drawImage(
            this.pole,
            poleX, poleY, poleRenderWidth, poleRenderHeight
        );
    }

    /**
     * Draws the flag body and text (for layering on top of soldiers)
     */
    public static drawFlag(
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        _direction: number, // 0-7 (废弃, 用城市统一方向)
        scale: number,
        tick: number,
        factionId: string = 'panjun',
        year: number = -999 // [NEW] Year parameter for conditional text
    ): void {
        if (!this.isLoaded) return;

        const body = this.getOrLoadFactionFlag(factionId);
        if (!body) return;

        // [2026-05-30 用户公理] 军队旗帜跟据点统一: 永远 row 5 (NW向, 飘向一边)
        // 据点 TerritorySystem.ts background-position-y: -200 * 1.4 → row=5
        const direction: number = 5;

        const frameIndex = Math.floor(tick / 150) % this.FRAME_COLS;
        const frameWidth = body.width / this.FRAME_COLS;
        const frameHeight = body.height / this.FRAME_ROWS;
        const baseSize = 60; // Reduced flag size
        const flagRenderHeight = baseSize * scale;
        const flagRenderWidth = flagRenderHeight * (frameWidth / frameHeight);

        const poleRenderHeight = flagRenderHeight * (this.pole.height / frameHeight);
        const poleRenderWidth = poleRenderHeight * (this.pole.width / this.pole.height);
        const poleX = center.x - poleRenderWidth / 2;
        const poleY = center.y - poleRenderHeight;

        // === Draw Flag Body ===
        const facingLeft = direction >= 4 && direction <= 6;
        let flagX: number;
        if (facingLeft) {
            flagX = poleX + poleRenderWidth;
        } else if (direction === 3 || direction === 7) {
            flagX = poleX - flagRenderWidth / 2 + poleRenderWidth / 2;
        } else {
            flagX = poleX - flagRenderWidth;
        }

        let flagY: number;
        if (direction === 2 || direction === 3 || direction === 4) {
            flagY = poleY - flagRenderHeight * 0.3;
        } else {
            flagY = poleY + poleRenderHeight * 0.05;
        }

        const sx = frameIndex * frameWidth;
        const sy = direction * frameHeight;

        ctx.drawImage(
            body,
            sx, sy, frameWidth, frameHeight,
            flagX, flagY, flagRenderWidth, flagRenderHeight
        );

        // === Draw Text Overlay ===
        // [CLEANED] Removed hardcoded year-based text hiding and variant swapping.
        // Flags will now always display their assigned text asset dynamically.

        let text: HTMLImageElement | null = this.getOrLoadFactionText(factionId);

        if (text && direction !== 3 && direction !== 7) {
            const textFrameWidth = text.width / this.FRAME_COLS;
            const textFrameHeight = text.height / 6;

            let textRow = direction;
            if (direction >= 4) textRow = direction - 1;

            const textSx = frameIndex * textFrameWidth;
            const textSy = textRow * textFrameHeight;

            ctx.drawImage(
                text,
                textSx, textSy, textFrameWidth, textFrameHeight,
                flagX, flagY, flagRenderWidth, flagRenderHeight
            );
        }
    }

    /**
     * Draws the General's Portrait (Circular, Centered)
     */
    private static drawGeneralPortrait(
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        scale: number,
        generalId: string
    ): void {
        const img = this.generalPortraits.get(generalId) || this.generalPortraits.get('default');
        if (!img) return;

        // Portrait Size
        const size = 50 * scale; // [TUNING] Portrait diameter
        const x = center.x - size / 2;
        const y = center.y - size / 2; // Centered on 'center'

        // Save context for clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(center.x, center.y, size / 2, 0, Math.PI * 2);
        ctx.closePath();

        // Add Border/Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#d4af37'; // Gold Border
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.clip(); // Clip to circle

        // Draw Image
        ctx.drawImage(img, x, y, size, size);

        ctx.restore();
    }

    public static draw(
        ctx: CanvasRenderingContext2D,
        center: { x: number, y: number },
        direction: number, // 0-7
        scale: number,
        tick: number,
        factionId: string = 'panjun',
        year: number = -999, // [NEW] Pass through
        generalId?: string   // [NEW] Optional General ID
    ): void {
        if (!this.isLoaded) return;

        let flagCenter = { ...center };

        // [USER REQUEST] If General exists, draw Portrait at Center, shift Flag UP
        if (generalId && (this.generalPortraits.has(generalId) || this.generalPortraits.has('default'))) {
            // Draw Portrait FIRST (or LAST? Flag pole usually behind units, Portrait maybe above?)
            // Let's assume Portrait renders ON TOP of units (handled by caller layer order?), 
            // but here we are drawing Flag layer.
            // If FlagDrawer is called after UnitDrawer, Portrait is on top.

            this.drawGeneralPortrait(ctx, center, scale, generalId);

            // Shift Flag Upwards
            const shiftY = 60 * scale; // Shift up by approx portrait size + padding
            flagCenter.y -= shiftY;
        }

        this.drawPole(ctx, flagCenter, scale, factionId);
        this.drawFlag(ctx, flagCenter, direction, scale, tick, factionId, year);
    }
}
