/**
 * FactionTintSystem.ts
 *
 * 兵种贴图染色 — **仅正规势力**；颜色与 FactionManager（旗帜、领土）同一 hex 来源。
 *
 * 叛军 panjun 不在此系统：无势力色、军队保持 NPC 原色（见 NO_TINT_FACTION_IDS）。
 * 叛军视觉差异仅来自据点随机旗面（CityAssetManager.getProcessedRebelFlagIndex）。
 */

import type { FactionManager } from '../../core/FactionManager';

/**
 * 染色颜色接口
 */
export interface TintColor {
    r: number;  // 0-255
    g: number;  // 0-255
    b: number;  // 0-255
    intensity: number;  // 0-1 染色强度
}

/** 叛军：无势力 hex，旗面用 52 面随机素材，军队贴图不染色 */
const NO_TINT_FACTION_IDS = new Set(['panjun']);

/**
 * 势力染色系统
 */
export class FactionTintSystem {
    private static tintColorCache: Map<string, TintColor> = new Map();
    private static hexCache: Map<string, string> = new Map();
    private static factionManager: FactionManager | null = null;
    private static readonly DEFAULT_INTENSITY = 0.6;

    /**
     * 在 FactionManager 加载完所有势力后调用（GameApp 启动流程）
     */
    public static bindFactionManager(fm: FactionManager): void {
        this.factionManager = fm;
        this.tintColorCache.clear();
        this.hexCache.clear();

        for (const faction of fm.getFactions()) {
            if (NO_TINT_FACTION_IDS.has(faction.id)) continue;
            this.cacheTintForFaction(faction.id, fm.getFactionColor(faction.id));
        }
    }

    private static resolveFactionManager(): FactionManager | null {
        if (this.factionManager) return this.factionManager;
        const game = (typeof window !== 'undefined'
            ? (window as unknown as { game?: { factionManager?: FactionManager } }).game
            : undefined);
        return game?.factionManager ?? null;
    }

    private static cacheTintForFaction(factionId: string, hex: string): void {
        this.hexCache.set(factionId, hex);
        this.tintColorCache.set(factionId, this.hexToTintColor(hex, this.DEFAULT_INTENSITY));
    }

    /**
     * 获取势力的染色颜色
     */
    public static getTintColor(factionId: string): TintColor | null {
        if (!factionId || NO_TINT_FACTION_IDS.has(factionId)) return null;

        const fm = this.resolveFactionManager();
        if (!fm) return null;

        const hex = fm.getFactionColor(factionId);
        if (this.hexCache.get(factionId) !== hex) {
            this.cacheTintForFaction(factionId, hex);
        }
        return this.tintColorCache.get(factionId) ?? null;
    }

    /** 当前势力色 HEX（供精灵缓存键） */
    public static getTintHex(factionId: string): string | null {
        if (!factionId || NO_TINT_FACTION_IDS.has(factionId)) return null;
        const fm = this.resolveFactionManager();
        return fm ? fm.getFactionColor(factionId) : null;
    }

    /**
     * 检查是否需要染色
     */
    public static shouldTint(factionId: string): boolean {
        return this.getTintColor(factionId) !== null;
    }

    private static hexToTintColor(hex: string, intensity: number): TintColor {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        if (!result) {
            console.warn(`[FactionTintSystem] Invalid hex color: ${hex}, defaulting to Grey.`);
            return { r: 128, g: 128, b: 128, intensity: 0.3 };
        }
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            intensity
        };
    }
}
