import {
    HISTORICAL_FACTION_COLORS,
    RANDOM_PALETTE_BLACK_LIGHTNESS_MAX,
    RANDOM_PALETTE_BLACK_SATURATION_MAX,
    RANDOM_PALETTE_CYAN_HUE_MAX,
    RANDOM_PALETTE_CYAN_HUE_MIN,
    RANDOM_PALETTE_RED_HUE_MAX,
    RANDOM_PALETTE_RED_HUE_MIN,
    RANDOM_PALETTE_WHITE_LIGHTNESS_MIN,
    RANDOM_PALETTE_WHITE_SATURATION_MAX,
    RANDOM_PALETTE_YELLOW_HUE_MAX,
    RANDOM_PALETTE_YELLOW_HUE_MIN,
    RESERVED_COLOR_MIN_RGB_DISTANCE,
    RESERVED_FACTION_COLOR_HEXES,
} from '../data/HistoricalFactionColors';
import { Faction } from '../types/core';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 【正规势力色系统】— 与叛军旗面系统无关，勿混用 panjun 逻辑
 * ═══════════════════════════════════════════════════════════════════
 *
 * 每个正规 factionId（非 panjun）在开局 assignSpatialColors 后得到唯一 hex：
 *   · 势力色 / 领土色  → FactionManager.getFactionColor()
 *   · 旗帜色           → 同上，CityAssetManager chromaKey 模板旗时染色
 *   · 军队色           → 同上，FactionTintSystem 读同一 hex 染兵种贴图
 *
 * 来源：HistoricalFactionColors 固定色优先，其余每局 HSL 随机 + 邻邦避撞色。
 * factions.ts 不写 color 字段。
 *
 * 叛军 panjun 不在此系统内：无 getFactionColor、无领土色块、无军队染色。
 * 叛军仅见 CityAssetManager + RebelFlagConstants（52 面随机旗素材）。
 * ═══════════════════════════════════════════════════════════════════
 */

/** 黄金角：在色相环上尽量均匀撒点 */
const GOLDEN_ANGLE = 137.50776405003785;
/** 贴脸邻邦：优先保证肉眼可辨的不同色系 */
const CLOSE_NEIGHBOR_KM = 120;
/** 视为「地理相邻」的最大首都间距（km） */
const NEARBY_CAPITAL_KM = 520;
/** 贴脸邻邦最低可接受色相差（度） */
const MIN_HUE_DELTA_CLOSE = 55;

type NeighborEdge = { id: string; km: number };

export class FactionManager {
    private factions: Map<string, Faction> = new Map();
    private colorPalette: string[] = [];
    /** 每局随机色相起点，保证跨局同一势力颜色仍会变 */
    private readonly sessionHueOffset: number;

    constructor(paletteSize = 600) {
        this.sessionHueOffset = Math.random() * 360;
        this.colorPalette = this.buildDistinctPalette(paletteSize);
    }

    /**
     * 势力色来源：HistoricalFactionColors 固定色优先；其余每局随机 HSL。
     * 同一 hex 供旗帜染色、军队染色、领土色块读取；factions.ts 不含显示色。
     * 不含 panjun（叛军走 RebelFlagConstants + getProcessedRebelFlagIndex，无势力色）。
     */
    public addFaction(faction: Faction): void {
        this.factions.set(faction.id, { ...faction, color: '#999999' });
    }

    /**
     * 按首都坐标为邻邦分配高对比色：贴脸邻邦强制色相差，广义邻邦次之。
     * 全局 hex 严格唯一：固定色优先占坑，随机池不得与已占用 hex 相同。
     */
    public assignSpatialColors(capitalByFaction: Map<string, { lat: number; lng: number }>): void {
        const factionIds = Array.from(this.factions.keys());
        const neighbors = this.buildNeighborGraph(factionIds, capitalByFaction);

        const order = [...factionIds].sort(
            (a, b) => (neighbors.get(b)?.length ?? 0) - (neighbors.get(a)?.length ?? 0)
        );

        const assigned = new Map<string, string>();
        const usedHex = new Set<string>();
        const available = [...this.colorPalette];

        for (const fid of factionIds) {
            const fixed = HISTORICAL_FACTION_COLORS[fid];
            if (!fixed) continue;
            const norm = this.normalizeHex(fixed);
            if (usedHex.has(norm)) {
                console.warn(
                    `[FactionManager] 固定色 hex 已被占用，跳过 ${fid} → ${fixed}`,
                );
                continue;
            }
            usedHex.add(norm);
            assigned.set(fid, fixed);
            const faction = this.factions.get(fid);
            if (faction) this.factions.set(fid, { ...faction, color: fixed });
        }

        this.cullAvailableUsedHex(available, usedHex);
        this.cullAvailableNearReserved(available);

        for (const fid of order) {
            if (assigned.has(fid)) continue;
            const edges = neighbors.get(fid) ?? [];
            const closeColors = edges
                .filter((e) => e.km <= CLOSE_NEIGHBOR_KM)
                .map((e) => assigned.get(e.id))
                .filter((c): c is string => !!c);
            const farColors = edges
                .filter((e) => e.km > CLOSE_NEIGHBOR_KM)
                .map((e) => assigned.get(e.id))
                .filter((c): c is string => !!c);

            const color = this.pickBestColor(available, closeColors, farColors, usedHex);
            const norm = this.normalizeHex(color);
            usedHex.add(norm);
            assigned.set(fid, color);

            const idx = available.findIndex((c) => this.normalizeHex(c) === norm);
            if (idx >= 0) available.splice(idx, 1);

            const faction = this.factions.get(fid);
            if (faction) this.factions.set(fid, { ...faction, color });
        }
    }

    private normalizeHex(hex: string): string {
        return hex.toUpperCase();
    }

    /** 随机池剔除与已分配势力完全相同的 hex */
    private cullAvailableUsedHex(available: string[], usedHex: Set<string>): void {
        for (let i = available.length - 1; i >= 0; i--) {
            if (usedHex.has(this.normalizeHex(available[i]))) {
                available.splice(i, 1);
            }
        }
    }

    private pickBestColor(
        available: string[],
        closeNeighborColors: string[],
        farNeighborColors: string[],
        usedHex: Set<string>
    ): string {
        const unused = available.filter((c) => !usedHex.has(this.normalizeHex(c)));
        if (unused.length === 0) {
            return this.randomFallbackColor(usedHex);
        }

        let pool = unused;
        if (closeNeighborColors.length > 0) {
            const strict = unused.filter((c) =>
                closeNeighborColors.every((n) => this.hueDelta(c, n) >= MIN_HUE_DELTA_CLOSE)
            );
            if (strict.length > 0) pool = strict;
        }

        const usedColors = Array.from(usedHex);
        let best = pool[0];
        let bestScore = -1;

        for (const candidate of pool) {
            const score = this.colorAssignmentScore(
                candidate,
                closeNeighborColors,
                farNeighborColors,
                usedColors
            );
            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        }

        return best;
    }

    /**
     * 贴脸邻邦：色相环距离优先（避免「都是绿」）；广义邻邦与全局已用色次之。
     */
    private colorAssignmentScore(
        candidate: string,
        closeNeighborColors: string[],
        farNeighborColors: string[],
        usedColors: string[]
    ): number {
        let score = 0;

        if (closeNeighborColors.length > 0) {
            const minCloseHue = Math.min(
                ...closeNeighborColors.map((c) => this.hueDelta(candidate, c))
            );
            const minCloseRgb = Math.min(
                ...closeNeighborColors.map((c) => this.rgbDistance(candidate, c))
            );
            score += minCloseHue * 12 + minCloseRgb * 0.4;
        }

        if (farNeighborColors.length > 0) {
            const minFarHue = Math.min(
                ...farNeighborColors.map((c) => this.hueDelta(candidate, c))
            );
            const minFarRgb = Math.min(
                ...farNeighborColors.map((c) => this.rgbDistance(candidate, c))
            );
            score += minFarHue * 4 + minFarRgb * 0.6;
        }

        if (usedColors.length > 0) {
            const minGlobalHue = Math.min(...usedColors.map((c) => this.hueDelta(candidate, c)));
            const minGlobalRgb = Math.min(...usedColors.map((c) => this.rgbDistance(candidate, c)));
            score += minGlobalHue * 1.5 + minGlobalRgb * 0.2;
        }

        if (score === 0) return 999;
        return score;
    }

    private buildNeighborGraph(
        factionIds: string[],
        capitalByFaction: Map<string, { lat: number; lng: number }>
    ): Map<string, NeighborEdge[]> {
        const neighbors = new Map<string, NeighborEdge[]>();

        for (let i = 0; i < factionIds.length; i++) {
            const a = factionIds[i];
            const posA = capitalByFaction.get(a);
            if (!posA) continue;

            for (let j = i + 1; j < factionIds.length; j++) {
                const b = factionIds[j];
                const posB = capitalByFaction.get(b);
                if (!posB) continue;

                const km = this.haversineKm(posA.lat, posA.lng, posB.lat, posB.lng);
                if (km > NEARBY_CAPITAL_KM) continue;

                if (!neighbors.has(a)) neighbors.set(a, []);
                if (!neighbors.has(b)) neighbors.set(b, []);
                neighbors.get(a)!.push({ id: b, km });
                neighbors.get(b)!.push({ id: a, km });
            }
        }

        return neighbors;
    }

    private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /** 黄金角 + 饱和/明度分层；调色板内也按色相差拉开，且不与固定色 hex 相同 */
    private buildDistinctPalette(count: number): string[] {
        const reservedExact = new Set(
            Array.from(RESERVED_FACTION_COLOR_HEXES).map((h) => h.toUpperCase()),
        );
        const colors: string[] = [];
        const satSteps = 6;
        const lightSteps = 5;
        let i = 0;

        while (colors.length < count && i < count * 12) {
            const h = (this.sessionHueOffset + i * GOLDEN_ANGLE) % 360;
            const s = 48 + (i % satSteps) * 7;
            const l = 34 + (Math.floor(i / satSteps) % lightSteps) * 5;
            if (
                this.isRandomPaletteReservedHue(h) ||
                this.isRandomPaletteNearWhite(s, l) ||
                this.isRandomPaletteNearBlack(s, l)
            ) {
                i++;
                continue;
            }
            const hex = this.hslToHex(Math.round(h), s, l);
            if (reservedExact.has(hex.toUpperCase())) {
                i++;
                continue;
            }

            const tooClose = colors.some(
                (c) => this.rgbDistance(c, hex) < 32 || this.hueDelta(c, hex) < 14
            );
            if (!tooClose) colors.push(hex);
            i++;
        }

        while (colors.length < count && i < count * 24) {
            const h = (this.sessionHueOffset + i * GOLDEN_ANGLE) % 360;
            const s = 48 + (i % satSteps) * 7;
            const l = 34 + (Math.floor(i / satSteps) % lightSteps) * 5;
            if (
                this.isRandomPaletteReservedHue(h) ||
                this.isRandomPaletteNearWhite(s, l) ||
                this.isRandomPaletteNearBlack(s, l)
            ) {
                i++;
                continue;
            }
            const hex = this.hslToHex(Math.round(h), s, l);
            if (reservedExact.has(hex.toUpperCase())) {
                i++;
                continue;
            }
            if (!colors.includes(hex)) colors.push(hex);
            i++;
        }

        return colors;
    }

    private randomFallbackColor(usedHex: Set<string>): string {
        for (let t = 0; t < 96; t++) {
            const h = Math.floor(Math.random() * 360);
            const s = 55 + Math.floor(Math.random() * 25);
            const l = 38 + Math.floor(Math.random() * 18);
            if (
                this.isRandomPaletteReservedHue(h) ||
                this.isRandomPaletteNearWhite(s, l) ||
                this.isRandomPaletteNearBlack(s, l)
            ) continue;
            const hex = this.hslToHex(h, s, l);
            if (usedHex.has(hex.toUpperCase())) continue;
            if (
                Array.from(RESERVED_FACTION_COLOR_HEXES).some(
                    (r) => this.rgbDistance(r, hex) < RESERVED_COLOR_MIN_RGB_DISTANCE,
                )
            ) {
                continue;
            }
            return hex;
        }
        for (let t = 0; t < 96; t++) {
            const hex = this.hslToHex(
                Math.floor(Math.random() * 360),
                55 + Math.floor(Math.random() * 25),
                38 + Math.floor(Math.random() * 18),
            );
            if (!usedHex.has(hex.toUpperCase())) return hex;
        }
        return this.hslToHex(210, 55, 42);
    }

    /** 随机池避开红、黄、青楔及近白/近黑区，固定色由 HistoricalFactionColors 独占 */
    private isRandomPaletteReservedHue(h: number): boolean {
        const hue = ((h % 360) + 360) % 360;
        if (hue >= RANDOM_PALETTE_RED_HUE_MIN || hue <= RANDOM_PALETTE_RED_HUE_MAX) return true;
        if (hue >= RANDOM_PALETTE_YELLOW_HUE_MIN && hue <= RANDOM_PALETTE_YELLOW_HUE_MAX) return true;
        return hue >= RANDOM_PALETTE_CYAN_HUE_MIN && hue <= RANDOM_PALETTE_CYAN_HUE_MAX;
    }

    private isRandomPaletteNearWhite(s: number, l: number): boolean {
        return l >= RANDOM_PALETTE_WHITE_LIGHTNESS_MIN && s <= RANDOM_PALETTE_WHITE_SATURATION_MAX;
    }

    private isRandomPaletteNearBlack(s: number, l: number): boolean {
        return l <= RANDOM_PALETTE_BLACK_LIGHTNESS_MAX && s <= RANDOM_PALETTE_BLACK_SATURATION_MAX;
    }

    private cullAvailableNearReserved(available: string[]): void {
        const reserved = Array.from(RESERVED_FACTION_COLOR_HEXES);
        for (let i = available.length - 1; i >= 0; i--) {
            const c = available[i];
            if (reserved.some((r) => this.rgbDistance(c, r) < RESERVED_COLOR_MIN_RGB_DISTANCE)) {
                available.splice(i, 1);
            }
        }
    }

    /** 色相环最短角距离（0–180°） */
    private hueDelta(a: string, b: string): number {
        const ha = this.hexToHue(a);
        const hb = this.hexToHue(b);
        const d = Math.abs(ha - hb);
        return Math.min(d, 360 - d);
    }

    private hexToHue(hex: string): number {
        const [r, g, b] = this.hexToRgb(hex).map((v) => v / 255);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        if (d < 1e-6) return 0;
        let h = 0;
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
        return h;
    }

    private rgbDistance(a: string, b: string): number {
        const [r1, g1, b1] = this.hexToRgb(a);
        const [r2, g2, b2] = this.hexToRgb(b);
        return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
    }

    private hexToRgb(hex: string): [number, number, number] {
        const n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    private hslToHex(h: number, s: number, l: number): string {
        l /= 100;
        const a = (s * Math.min(l, 1 - l)) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color)
                .toString(16)
                .padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    public getFaction(id: string): Faction | undefined {
        return this.factions.get(id);
    }

    public getFactionColor(id: string): string {
        const faction = this.factions.get(id);
        return faction?.color ?? '#999999';
    }

    public getFactionName(id: string): string {
        const faction = this.factions.get(id);
        return faction ? faction.name : '未知势力';
    }

    public getFactions(): Faction[] {
        return Array.from(this.factions.values());
    }
}
