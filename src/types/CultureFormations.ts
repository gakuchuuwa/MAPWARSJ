/**
 * Culture Formations
 * 14 文化区 → 各自军队阵型 (CompositionTier 复用)
 *
 * [2026-05-30 立] 用户拍板的 14 区阵型 + 12 兵种映射
 *
 * 阵型 2 种:
 *   ① 3×3 方阵 (11 文化): 前列3 + 中列(侧2+刀骑1) + 后列3 = 9 人
 *     - 6 步骑: 中列侧 = 真骑兵
 *     - 5 纯步: 中列侧也是步兵 (但中心仍 general_cavalry, 仿中原简化)
 *   ② 1-2-3 三角 (3 文化, 纯骑): 单一兵种 ×6
 *
 * 12 兵种 (sprite IDs in UnitAssets.ts):
 *   步兵: light_infantry 1-48 / heavy_infantry 52-99 / shield 103-150 /
 *        spear 460-507 / armored 562-609 / axe 511-558
 *   骑兵: lancer 154-193 / heavy_cavalry 197-236 (斧骑) /
 *        general_cavalry 240-279 (刀骑/将领) / horse_archer 664-719 (弓骑)
 *   远程: archer 283-338 (弓兵) / crossbow 342-397 (弩兵)
 *
 * 显示比例（默认，见 LegionComposition.getDefaultScaleForUnitType）:
 *   步兵/弓弩类 slot → 1.0；骑兵类 slot → 1.2
 *   编辑器可 per-slot 写 scale 覆盖；未写则走默认
 */

import { GameConfig } from '../config/GameConfig';
import { RegionType } from '../systems/RegionSystem';
import { CompositionSlot, CompositionTier, expandCompositionScales, expandCompositionSlots } from './LegionComposition';
import type { LegionType } from './UnitTypes';

/** 军队编辑器可选阵型：3×3 方阵 (9人) 或 1-2-3 三角 (6人) */
export type FormationMode = 'square' | 'triangle';

/** 14 文化默认阵型（可被军队编辑器覆盖保存） */
export const CULTURE_FORMATION_MODE: Record<RegionType, FormationMode> = {
    CENTRAL:      'square',
    NORTH:        'square',
    NORTHEAST:    'square',
    KOREA:        'square',
    JAPAN:        'square',
    STEPPE:       'triangle',
    HEXI:         'square',
    BASHU:        'square',
    JIANGNAN:     'square',
    LINGNAN:      'square',
    DIANQIAN:     'square',
    TIBET:        'triangle',
    CENTRAL_ASIA: 'square',
    WESTERN:      'triangle',
};

export function getCultureFormationMode(culture: RegionType): FormationMode {
    return CULTURE_FORMATION_MODE[culture] ?? 'square';
}

/** 按阵型生成默认 slot 结构 */
export function getDefaultSlotsForMode(mode: FormationMode): CompositionSlot[] {
    if (mode === 'triangle') {
        return [
            { type: 'horse_archer', count: 1 },
            { type: 'horse_archer', count: 2 },
            { type: 'horse_archer', count: 3 },
        ];
    }
    return [
        { type: 'shield', count: 3 },
        { type: 'lancer', count: 1 },
        { type: 'general_cavalry', count: 1 },
        { type: 'lancer', count: 1 },
        { type: 'crossbow', count: 3 },
    ];
}

/** 从 slot 结构推断阵型（兼容旧草稿） */
export function inferFormationModeFromSlots(slots: CompositionSlot[]): FormationMode {
    const total = slots.reduce((s, x) => s + x.count, 0);
    if (total === 6 && slots.length === 3) return 'triangle';
    if (total === 9 && slots.length === 5) return 'square';
    return slots.length <= 3 ? 'triangle' : 'square';
}

/** 切换阵型时转换 slot（尽量保留已有兵种选择） */
export function convertSlotsToMode(slots: CompositionSlot[], mode: FormationMode): CompositionSlot[] {
    if (inferFormationModeFromSlots(slots) === mode) {
        return slots.map(s => ({ ...s }));
    }
    const frontType = slots[0]?.type || 'shield';
    const sideType = slots[1]?.type || slots[0]?.type || 'lancer';
    const backType = slots[slots.length - 1]?.type || 'crossbow';
    if (mode === 'triangle') {
        const base = frontType.includes('cavalry') || frontType === 'lancer' || frontType === 'elephant'
            ? frontType : 'horse_archer';
        return [
            { type: base, count: 1 },
            { type: base, count: 2 },
            { type: base, count: 3 },
        ];
    }
    return [
        { type: frontType, count: 3 },
        { type: sideType, count: 1 },
        { type: 'general_cavalry', count: 1 },
        { type: sideType, count: 1 },
        { type: backType, count: 3 },
    ];
}

/**
 * 构造 步骑 3×3 阵型的 helper:
 *   前3 + 中左 + 中心刀骑 + 中右 + 后3 = 9 人
 *   中心永远是 general_cavalry (刀骑)
 *   middleSide 可以是骑兵 (步骑) 或步兵 (纯步, 仿中原简化)
 */
function build3x3(front: string, middleSide: string, back: string): CompositionTier {
    return {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: front,             count: 3 }, // Row 0 (前)
            { type: middleSide,        count: 1 }, // Row 1 左（骑兵类默认 scale 1.2，步兵 1.0）
            { type: 'general_cavalry', count: 1 }, // Row 1 中 = 刀骑 (永远)
            { type: middleSide,        count: 1 }, // Row 1 右
            { type: back,              count: 3 }  // Row 2 (后)
        ]
    };
}

/**
 * 构造 纯骑 1-2-3 三角阵型的 helper:
 *   6 人三角, 全员同一兵种 (跟 huihui_cavalry 同模式)
 *   gridSize 3 是 LegionPhalanxDrawer 已有约定
 */
function buildTriangleCavalry(unitType1: string, unitType2: string, unitType3: string): CompositionTier {
    return {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: unitType1, count: 1 },
            { type: unitType2, count: 2 },
            { type: unitType3, count: 3 }
        ]
    };
}

// ============================================================
// 势力专属方阵（优先于文化区默认）
// ============================================================

/**
 * 秦国固定 3×3 方阵：枪兵 + 轻骑/刀骑/轻骑 + 弩手。
 * 中列中心 general_cavalry 写死，全项目不可省略。
 *
 * 适用范围（凡 factionId === 'qin' 的现役军团）：
 *   · 据点军团 — LegionManager.createArmy / createLegion
 *   · 远征军团 — applyExpeditionEliteRename 下令时重申
 */
export const QIN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'spear', count: 3 },
    { type: 'lancer', count: 1, scale: 1.2 },
    { type: 'general_cavalry', count: 1 },
    { type: 'lancer', count: 1, scale: 1.2 },
    { type: 'crossbow', count: 3 },
];

/** 势力专属阵型；无则返回 null，由调用方回退文化区 tier */
export function getFactionCompositionSlots(factionId: string): CompositionSlot[] | null {
    if (factionId === 'qin') {
        return [...QIN_FACTION_COMPOSITION];
    }
    return null;
}

export interface LegionCompositionTarget {
    factionId: string;
    cultureRegion: RegionType | null;
    cultureSlots: string[] | null;
    cultureScales: number[] | null;
    legionType: LegionType;
    getTroops(): number;
}

/** 写入军团 cultureSlots / cultureScales / legionType（势力专属优先于文化区） */
export function applyLegionCultureComposition(army: LegionCompositionTarget, region?: RegionType): void {
    const culture = region ?? army.cultureRegion ?? 'CENTRAL';
    const factionSlots = getFactionCompositionSlots(army.factionId);
    const slots = factionSlots ?? getCultureTier(culture, army.getTroops())?.slots;
    if (!slots) return;

    army.cultureSlots = expandCompositionSlots(slots);
    army.cultureScales = expandCompositionScales(slots);
    army.legionType =
        army.factionId === 'qin'
            ? 'mixed'
            : getCultureFormationMode(culture) === 'triangle'
              ? 'cavalry'
              : 'mixed';
}

// ============================================================
// 14 文化区阵型 (用户 2026-05-30 拍板)
// ============================================================

/** 1. 中原 步骑 盾+轻+弩 */
export const CENTRAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'shield', count: 3 },
            { type: 'lancer', count: 1 },
            { type: 'general_cavalry', count: 1 },
            { type: 'lancer', count: 1 },
            { type: 'crossbow', count: 3 }
        ]
    }
];
/** 2. 北方 步骑 枪+弓骑+弩 */
export const NORTH_TIERS: CompositionTier[] = [
    build3x3('spear', 'horse_archer', 'crossbow')
];

/** 3. 东北 步骑 重+弓骑+弓兵 */
export const NORTHEAST_TIERS: CompositionTier[] = [
    build3x3('heavy_infantry', 'horse_archer', 'archer')
];

/** 4. 朝鲜 步骑 藤+斧骑+弓 */
export const KOREA_TIERS: CompositionTier[] = [
    build3x3('armored', 'heavy_cavalry', 'archer')
];

/** 5. 日本 纯步 2藤+1弓 (中心仍刀骑) */
export const JAPAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'armored', count: 3 },
            { type: 'spear', count: 1 },
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'spear', count: 1 },
            { type: 'archer', count: 3 }
        ]
    }
];
/** 6. 草原 纯骑 刀骑+弓骑 123 */
export const STEPPE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'horse_archer', count: 2 },
            { type: 'general_cavalry', count: 3 }
        ]
    }
];
/** 7. 河西 步骑 斧+斧骑+弩 */
export const HEXI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'axe', count: 3 },
            { type: 'heavy_cavalry', count: 1 },
            { type: 'general_cavalry', count: 1 },
            { type: 'heavy_cavalry', count: 1 },
            { type: 'crossbow', count: 3 }
        ]
    }
];
/** 8. 川蜀 纯步 2盾+1弩 */
export const BASHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_infantry', count: 3 },
            { type: 'archer', count: 1 },
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'archer', count: 1 },
            { type: 'crossbow', count: 3 }
        ]
    }
];
/** 9. 南方 纯步 1轻步+2弓 (前1排步, 后2排弓) */
export const JIANGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'shield', count: 3 },
            { type: 'crossbow', count: 1 },
            { type: 'general_cavalry', count: 1 },
            { type: 'crossbow', count: 1 },
            { type: 'archer', count: 3 }
        ]
    }
];
/** 10. 岭南 纯步 2斧+1弓 */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'axe', count: 3 },
            { type: 'elephant', count: 1 },
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'elephant', count: 1 },
            { type: 'archer', count: 3 }
        ]
    }
];
/** 11. 滇缅 纯步 2藤+1弩 */
export const DIANQIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'armored', count: 3 },
            { type: 'elephant', count: 1 },
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'elephant', count: 1 },
            { type: 'crossbow', count: 3 }
        ]
    }
];
/** 12. 青藏 纯骑 斧骑+弓骑 123 */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'horse_archer', count: 2 },
            { type: 'heavy_cavalry', count: 3 }
        ]
    }
];
/** 13. 中亚 步骑 轻+轻骑+弓 */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'light_infantry', count: 3 },
            { type: 'lancer', count: 1 },
            { type: 'general_cavalry', count: 1 },
            { type: 'lancer', count: 1 },
            { type: 'archer', count: 3 }
        ]
    }
];
/** 14. 西域 纯骑 轻骑+弓骑 123 */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'horse_archer', count: 2 },
            { type: 'lancer', count: 3 }
        ]
    }
];
// ============================================================
// 14 文化 → CompositionTier[] 映射
// ============================================================

export const CULTURE_TIERS_MAP: Record<RegionType, CompositionTier[]> = {
    CENTRAL:      CENTRAL_TIERS,
    NORTH:        NORTH_TIERS,
    NORTHEAST:    NORTHEAST_TIERS,
    KOREA:        KOREA_TIERS,
    JAPAN:        JAPAN_TIERS,
    STEPPE:       STEPPE_TIERS,
    HEXI:         HEXI_TIERS,
    BASHU:        BASHU_TIERS,
    JIANGNAN:     JIANGNAN_TIERS,
    LINGNAN:      LINGNAN_TIERS,
    DIANQIAN:     DIANQIAN_TIERS,
    TIBET:        TIBET_TIERS,
    CENTRAL_ASIA: CENTRAL_ASIA_TIERS,
    WESTERN:      WESTERN_TIERS,
};

/** 编辑器保存后立刻写入内存（不依赖 HMR 才生效） */
export function applyCultureFormationPatch(
    culture: RegionType,
    slots: { type: string; count: number; scale?: number }[],
    formationMode?: FormationMode
): void {
    const normalized = slots.map((s) => {
        const slot: { type: string; count: number; scale?: number } = { type: s.type, count: s.count };
        if (s.scale != null && !Number.isNaN(s.scale)) slot.scale = s.scale;
        return slot;
    });
    const tiers = CULTURE_TIERS_MAP[culture];
    if (!tiers || tiers.length === 0) {
        CULTURE_TIERS_MAP[culture] = [{
            minTroops: 0,
            maxTroops: Infinity,
            gridSize: 3,
            slots: normalized,
        }];
        return;
    }
    tiers[0].slots = normalized;
    if (formationMode) {
        CULTURE_FORMATION_MODE[culture] = formationMode;
    }
}

/**
 * 按文化拿 tier
 */
export function getCultureTier(culture: RegionType, troops: number = 5000): CompositionTier | null {
    const tiers = CULTURE_TIERS_MAP[culture];
    if (!tiers) return null;
    for (const t of tiers) {
        if (troops >= t.minTroops && troops <= t.maxTroops) return t;
    }
    return tiers[tiers.length - 1] || null;
}

/**
 * 判断某文化是否使用 1-2-3 三角阵型（由 CULTURE_FORMATION_MODE 决定，编辑器可改）
 */
export function isCultureCavalryOnly(culture: RegionType): boolean {
    return getCultureFormationMode(culture) === 'triangle';
}

/** 军团兵力上限：纯骑三角 8 万，其余 10 万（与据点驻军上限无关） */
export function getArmyMaxTroops(culture: RegionType | null | undefined): number {
    if (culture && isCultureCavalryOnly(culture)) {
        return GameConfig.LEGION.TRIANGLE_CAVALRY_ARMY_MAX_TROOPS;
    }
    return GameConfig.LEGION.ARMY_MAX_TROOPS;
}

/**
 * 与军队编辑器一致：外观由 cultureSlots（14 区阵型）决定；
 * legionType 仅用于阵型骨架（三角 vs 3×3 步骑）。
 */
export function getLegionTypeForCulture(culture: RegionType): LegionType {
    return getCultureFormationMode(culture) === 'triangle' ? 'cavalry' : 'mixed';
}
