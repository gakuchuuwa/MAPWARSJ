/**
 * Culture Formations
 * 15 文化区 → 各自军队阵型 (CompositionTier 复用)
 *
 * [2026-05-30 立] 用户拍板的 14 区阵型 + 12 兵种映射
 * [2026-07-09] 行军四系 MovementClass（史地定案）：
 *   CAVALRY 纯骑 = 草原 / 青藏 / 中亚（三角 123）
 *   MIXED   步骑 = 中原 / 北方 / 东北 / 朝鲜 / 河西 / 西域
 *   INFANTRY 纯步 = 日本 / 川蜀 / 江南
 *   ELEPHANT 步象 = 岭南 / 滇缅
 *   ※ 西域=绿洲城郭步骑；中亚=河中突厥系纯骑（勿与旧文档「西域纯骑」混淆）
 *
 * 阵型 2 种:
 *   ① 3×3 方阵 (11 文化): 前列3 + 中列(侧2+刀骑1) + 后列3 = 9 人
 *   ② 1-2-3 三角 (3 文化, 纯骑): 草原 / 青藏 / 中亚
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

/**
 * 行军兵种大类（与阵型骨架相关但独立映射；速度查表用此，勿仅靠 triangle 布尔）
 * 史地定案 2026-07-09：中亚=纯骑，西域=步骑
 */
export type MovementClass = 'CAVALRY' | 'MIXED' | 'INFANTRY' | 'ELEPHANT';

/** 15 文化 → 行军大类（单一真理；改速度/上限逻辑只改这里） */
export const CULTURE_MOVEMENT_CLASS: Record<RegionType, MovementClass> = {
    STEPPE:       'CAVALRY',
    TIBET:        'CAVALRY',
    CENTRAL_ASIA: 'CAVALRY',
    WEST_ASIA:    'MIXED',
    NORTH:        'MIXED',
    CENTRAL:      'MIXED',
    NORTHEAST:    'MIXED',
    KOREA:        'MIXED',
    HEXI:         'MIXED',
    WESTERN:      'MIXED',
    JAPAN:        'INFANTRY',
    BASHU:        'INFANTRY',
    JIANGNAN:     'INFANTRY',
    LINGNAN:      'ELEPHANT',
    DIANQIAN:     'ELEPHANT',
    SLAVIC:       'MIXED',   // 东欧步骑
    GERMANIC:     'MIXED', // 中欧步骑（重步+骑士）
    LATIN:        'INFANTRY', // 西欧重步/军团
};

export function getCultureMovementClass(culture: RegionType): MovementClass {
    return CULTURE_MOVEMENT_CLASS[culture] ?? 'MIXED';
}

/** 15 文化默认阵型（可被军队编辑器覆盖保存） */
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
    CENTRAL_ASIA: 'triangle',
    WEST_ASIA:    'square',
    WESTERN:      'square',
    SLAVIC:       'square',   // 东欧：方阵
    GERMANIC:     'square',   // 中欧：方阵
    LATIN:        'square',   // 西欧：方阵（罗马龟甲阵）
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
            : getCultureMovementClass(culture) === 'CAVALRY'
              ? 'cavalry'
              : 'mixed';
}

// ============================================================
// 15 文化区阵型 (用户 2026-05-30 拍板)
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

/** 3. 东北 铁浮图+钦察+精锐长弓兵（2026-08-15 主人定：全决定版，中间刀骑取消→钦察，风格统一） */
export const NORTHEAST_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'iron_pagoda', count: 3 },     // Row 0 前 = 铁浮图 重骑兵（帝国决定）
            { type: 'kipchak', count: 1 },         // Row 1 左 = 钦察 弓骑兵（帝国决定）
            { type: 'kipchak', count: 1 },         // Row 1 中 = 钦察（原刀骑将领，取消）
            { type: 'kipchak', count: 1 },         // Row 1 右 = 钦察 弓骑兵（帝国决定）
            { type: 'longbowman_elite', count: 3 } // Row 2 后 = 精锐长弓兵 弓手（帝国决定）
        ]
    }
];

/** 4. 朝鲜 步骑 刀剑手+黑光铠骑兵+火焰弓箭手（2026-08-15 主人定：全决定版，中间刀骑取消→黑光铠骑兵，风格统一） */
export const KOREA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'eastern_swordsman', count: 3 },  // Row 0 前 = 刀剑手（帝国决定）
            { type: 'hei_kuang', count: 1 },          // Row 1 左 = 黑光铠骑兵（帝国决定）
            { type: 'hei_kuang', count: 1 },          // Row 1 中 = 黑光铠骑兵（原刀骑将领，取消）
            { type: 'hei_kuang', count: 1 },          // Row 1 右 = 黑光铠骑兵（帝国决定）
            { type: 'fire_archer', count: 3 }         // Row 2 后 = 火焰弓箭手（帝国决定）
        ]
    }
];

/** 5. 日本 前日本武士/中精锐武士/后步弓手（2026-08-15 主人定：取消刀骑将领） */
export const JAPAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'samurai', count: 3 },          // Row 0 前 = 日本武士（帝国决定）
            { type: 'samurai_elite', count: 1 },     // Row 1 左 = 精锐武士（帝国决定）
            { type: 'samurai_elite', count: 1 },     // Row 1 中 = 精锐武士（原刀骑将领，取消）
            { type: 'samurai_elite', count: 1 },     // Row 1 右 = 精锐武士（帝国决定）
            { type: 'archer', count: 3 }             // Row 2 后 = 步弓手（帝国决定）
        ]
    }
];
/** 6. 草原 纯骑 刀骑1+弓骑5 123（骑射云：尖刀骑领，中后排全弓骑） */
export const STEPPE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'general_cavalry', count: 1, scale: 1.2 },
            { type: 'horse_archer', count: 2 },
            { type: 'horse_archer', count: 3 }
        ]
    }
];
/** 7. 河西 步骑 长刀+斧骑+弩（横山步跋子击刺长刀 + 凉州大马铁骑）— 2026-08-04 拍板定稿 */
export const HEXI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'spear', count: 3 },
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
/** 9. 江南 纯步 1轻步+2弓 (前1排步, 后2排弓) */
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
/** 10. 岭南 步象 轻步+象+弓（俚僚轻装步 + 交趾象兵）— 2026-08-04 拍板定稿 */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'light_infantry', count: 3 },
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
/** 12. 青藏 纯骑三角 123 斧骑 + 456 弓骑 */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_cavalry', count: 3 },
            { type: 'horse_archer', count: 3 }
        ]
    }
];
/** 13. 中亚 纯骑三角（轻骑前锋 + 弓骑后排）— MovementClass=CAVALRY */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'lancer', count: 3 },
            { type: 'horse_archer', count: 3 }
        ]
    }
];
/** 14. 西域 长枪兵+骑射手+轻骑兵（2026-08-15 主人定：全决定版，中间刀骑取消→骑射手，风格统一） — MovementClass=MIXED */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'pikeman', count: 3 },       // Row 0 前 = 长枪兵 步兵（帝国决定）
            { type: 'cav_archer', count: 1 },    // Row 1 左 = 骑射手 弓骑（帝国决定）
            { type: 'cav_archer', count: 1 },    // Row 1 中 = 骑射手（原刀骑将领，取消）
            { type: 'cav_archer', count: 1 },    // Row 1 右 = 骑射手 弓骑（帝国决定）
            { type: 'light_riders', count: 3 }   // Row 2 后 = 轻骑兵 骑兵（帝国决定）
        ]
    }
];
/** 15. 西亚 盾阵铁骑（前大盾中斧骑后弓手：拜占庭/萨珊铁甲圣骑兵）— MovementClass=MIXED，2026-08-02 定稿 */
export const WEST_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'shield', count: 3 },
            { type: 'heavy_cavalry', count: 1 },
            { type: 'general_cavalry', count: 1 },
            { type: 'heavy_cavalry', count: 1 },
            { type: 'archer', count: 3 }
        ]
    }
];
/** 16. 斯拉夫 步骑 斧步+斧骑+弓（罗斯斧军：双手斧步 + 长斧骑 + 弓手）— MovementClass=MIXED，2026-08-04 拍板定稿 */
export const SLAVIC_TIERS: CompositionTier[] = [
    build3x3('axe', 'heavy_cavalry', 'archer')
];
/** 17. 日耳曼 步骑 斧盾+斧骑+弩（法兰克重步+条顿骑士+德意志弩手）— MovementClass=MIXED，2026-08-04 拍板定稿 */
export const GERMANIC_TIERS: CompositionTier[] = [
    build3x3('heavy_infantry', 'heavy_cavalry', 'crossbow')
];
/** 18. 拉丁 纯步 盾步+枪步+床弩（罗马军团盾墙+长枪卫+蝎子弩 scorpio）— MovementClass=INFANTRY，2026-08-04 拍板定稿 */
export const LATIN_TIERS: CompositionTier[] = [
    build3x3('shield', 'spear', 'ballista')
];
// ============================================================
// 15 文化 → CompositionTier[] 映射
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
    WEST_ASIA:    WEST_ASIA_TIERS,
    WESTERN:      WESTERN_TIERS,
    SLAVIC:       SLAVIC_TIERS,
    GERMANIC:     GERMANIC_TIERS,
    LATIN:        LATIN_TIERS,
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
 * 是否纯骑文化（行军/贴图/音效用）。
 * 以 MovementClass 为准（草原/青藏/中亚），与三角阵型默认一致。
 */
export function isCultureCavalryOnly(culture: RegionType): boolean {
    return getCultureMovementClass(culture) === 'CAVALRY';
}

/** 军团兵力上限：10 万基准 × LEGION_TROOP_CAP_TABLE（见 CultureTroopCaps） */
export { getArmyMaxTroops } from '../systems/CultureTroopCaps';

/**
 * 与军队编辑器一致：外观由 cultureSlots（15 区阵型）决定；
 * legionType 仅用于阵型骨架（三角 vs 3×3 步骑）。
 */
export function getLegionTypeForCulture(culture: RegionType): LegionType {
    return getCultureMovementClass(culture) === 'CAVALRY' ? 'cavalry' : 'mixed';
}
