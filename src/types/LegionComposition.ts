/**
 * Legion Composition System
 * Defines how legion troop counts map to visual unit compositions on the strategic map.
 */

export interface CompositionSlot {
    type: string;  // RTSUnitConfig ID (e.g. 'general_cavalry', 'spear', 'lancer', 'crossbow')
    count: number; // Number of this unit type
    scale?: number; // [NEW] Optional scale override
}

export interface CompositionTier {
    minTroops: number;
    maxTroops: number; // Use Infinity for no upper limit
    gridSize: number;  // 1, 2, 3, 4, or 5
    slots: CompositionSlot[];
}

/**
 * Huaxia Mixed Army Composition Tiers
 * Based on troop count, determines the visual makeup of the army on the strategic map.
 */
export const HUAXIA_MIXED_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'spear', count: 3 },               // Row 0: 枪步兵
            { type: 'lancer', count: 1 },              // Row 1 Left: 枪骑兵
            { type: 'general_cavalry', count: 1 },     // Row 1 Center: 将骑兵
            { type: 'lancer', count: 1 },              // Row 1 Right: 枪骑兵
            { type: 'crossbow', count: 3 }             // Row 2: 弩步兵
        ]
    }
];

/**
 * 通用 Mixed 组合（轻步兵 + 骑兵 + 弓手）
 */
export const GENERIC_MIXED_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'light_infantry', count: 3 },         // Row 0: 轻步兵
            { type: 'lancer', count: 1 },                  // Row 1 Left: 枪骑兵
            { type: 'general_cavalry', count: 1 },         // Row 1 Center: 将骑兵
            { type: 'lancer', count: 1 },                  // Row 1 Right: 枪骑兵
            { type: 'archer', count: 3 }                   // Row 2: 弓步兵
        ]
    }
];

/**
 * Huihui Mixed Army Composition Tiers
 */
export const HUIHUI_MIXED_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'huaxia_infantry', count: 3 },    // Row 0: 步兵
            { type: 'huihui_cavalry', count: 1 },     // Row 1 Left: 弓骑兵
            { type: 'general_cavalry', count: 1 },    // Row 1 Center: 将骑兵
            { type: 'huihui_cavalry', count: 1 },     // Row 1 Right: 弓骑兵
            { type: 'archer', count: 3 }               // Row 2: 弓步兵
        ]
    }
];

/**
 * 无 cultureSlots 时的兜底阵型（应优先用 CultureFormations 14 区）。
 */
export function getCompositionTier(troops: number, _factionType: string = 'mixed'): CompositionTier | null {
    const tiers = GENERIC_MIXED_TIERS;
    for (const tier of tiers) {
        if (troops >= tier.minTroops && troops <= tier.maxTroops) {
            return tier;
        }
    }
    return tiers[tiers.length - 1];
}

/**
 * Expand slots into an ordered array of unit types for grid placement.
 * Example: [{type: 'general_cavalry', count: 1}, {type: 'spear', count: 3}]
 * Returns: ['general_cavalry', 'spear', 'spear', 'spear']
 */
export function expandCompositionSlots(slots: CompositionSlot[]): string[] {
    const result: string[] = [];
    for (const slot of slots) {
        for (let i = 0; i < slot.count; i++) {
            result.push(slot.type);
        }
    }
    return result;
}

/** slot 在编辑器/渲染中实际使用的比例（显式 scale 优先，否则按兵种默认） */
export function getEffectiveSlotScale(slot: { type: string; scale?: number }): number {
    return slot.scale ?? getDefaultScaleForUnitType(slot.type);
}

/**
 * 骑兵兵种集合（含 AoE2 DE 骑兵）。🔴 战略地图渲染比例（getDefaultScaleForUnitType）+
 * 13 战斗阵型判定（LegionPhalanxDrawer.isCavalryType）同源，勿只改一处。
 * 旧判定只认 lancer/horse_archer/cavalry 后缀，DE 兵种名（kipchak/cav_archer/tarkan/...）全漏，
 * 导致骑射手等 DE 骑兵在大地图按步兵比例（1.0 而非 1.2）/步兵方阵渲染（2026-08-16 补）。
 */
export const CAVALRY_UNIT_TYPES: ReadonlySet<string> = new Set([
    // 旧兵种
    'lancer', 'heavy_cavalry', 'general_cavalry', 'horse_archer', 'huihui_cavalry',
    // DE 弓骑（cav + kite/rng）
    'kipchak', 'elite_kipchak', 'cav_archer', 'cav_archer_heavy',
    'mangudai', 'mangudai_elite', 'arambai', 'steppe_horse_archer',
    // DE 纯骑（cav）
    'hei_kuang', 'hei_kuang_heavy', 'iron_pagoda', 'light_riders',
    'tarkan', 'elite_tarkan', 'steppe_lancer', 'elite_steppe_lancer',
    'xianbei_raider', 'tiger_rider', 'keshik', 'boyar', 'savar',
    'camel_heavy', 'paladin', 'coustillier',
]);

/** 骑兵判定（含 DE）：精确白名单 + cavalry 后缀兜底。 */
export function isCavalryUnitType(type: string): boolean {
    return CAVALRY_UNIT_TYPES.has(type) || type.includes('cavalry');
}

/** 军队编辑器 / 地图渲染默认比例：步兵与弓弩 1.0，骑兵 1.2（2026-06-01 军队编辑器拍板） */
export function getDefaultScaleForUnitType(type: string): number {
    if (isCavalryUnitType(type) || type === 'elephant') {
        return 1.2;
    }
    return 1.0;
}

/**
 * Expand slots into an ordered array of unit scales for grid placement.
 */
export function expandCompositionScales(slots: CompositionSlot[]): number[] {
    const result: number[] = [];
    for (const slot of slots) {
        for (let i = 0; i < slot.count; i++) {
            result.push(getEffectiveSlotScale(slot));
        }
    }
    return result;
}
