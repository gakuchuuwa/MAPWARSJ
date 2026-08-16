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

/** 军队编辑器可选阵型（2026-08-15 主人定稿三阵型）：
 *  square  鱼鳞阵 = 3×3（前3/中3/后3，9人）
 *  triangle 三角阵 = 2+3+4（前2/中3/后4，9人，楔形突击）
 *  echelon  雁行阵 = 4+3+2（前4/中3/后2，9人，宽正面两翼展开）
 */
export type FormationMode = 'square' | 'triangle' | 'echelon';

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

/** 15 文化默认阵型（可被军队编辑器覆盖保存）——2026-08-15 主人定稿三阵型：
 *  三角 = 骑兵为主（≥2 骑，含弓骑）；雁行 = 远程为主（≥2 远程）；鱼鳞 = 其余 */
export const CULTURE_FORMATION_MODE: Record<RegionType, FormationMode> = {
    CENTRAL:      'square',
    NORTH:        'triangle',   // 辽刀+印加枪兵长+鲜卑掠骑兵
    NORTHEAST:    'echelon',    // 精锐长弓兵+铁浮图+钦察
    KOREA:        'square',
    JAPAN:        'triangle',   // 忍者+日本武士+精锐武士
    STEPPE:       'triangle',
    HEXI:         'triangle',   // 精锐火矛手+精锐辽刀+黑光铠骑兵
    BASHU:        'echelon',    // 精锐诸葛弩+白毦兵+藤弓兵
    JIANGNAN:     'echelon',    // 精锐火焰弓箭手+剑士+诸葛弩
    LINGNAN:      'echelon',    // 精锐藤弓兵+帝王掷矛手+皮甲战象
    DIANQIAN:     'triangle',   // 象兵+精锐爪刀勇士+步弓手 = 象+刀近战前中 + 弓远程后 → 三角
    TIBET:        'triangle',
    CENTRAL_ASIA: 'triangle',
    WEST_ASIA:    'square',
    WESTERN:      'square',
    SLAVIC:       'square',
    GERMANIC:     'square',
    LATIN:        'square',
};

export function getCultureFormationMode(culture: RegionType): FormationMode {
    return CULTURE_FORMATION_MODE[culture] ?? 'square';
}

/** 按阵型生成默认 slot 结构（2026-08-15 三阵型：鱼鳞3×3 / 三角2+3+4 / 雁行4+3+2，均 9 人） */
export function getDefaultSlotsForMode(mode: FormationMode): CompositionSlot[] {
    if (mode === 'triangle') {
        return [
            { type: 'horse_archer', count: 2 },
            { type: 'horse_archer', count: 3 },
            { type: 'horse_archer', count: 4 },
        ];
    }
    if (mode === 'echelon') {
        return [
            { type: 'shield', count: 4 },
            { type: 'crossbow', count: 3 },
            { type: 'crossbow', count: 2 },
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

/** 从 slot 结构推断阵型（兼容旧草稿；三阵型均为 9 人，靠各排 count 分布区分） */
export function inferFormationModeFromSlots(slots: CompositionSlot[]): FormationMode {
    const counts = slots.map(s => s.count);
    const total = counts.reduce((s, x) => s + x, 0);
    // 三角 2+3+4（三排）
    if (slots.length === 3 && counts[0] === 2 && counts[1] === 3 && counts[2] === 4) return 'triangle';
    // 雁行 4+3+2（三排）
    if (slots.length === 3 && counts[0] === 4 && counts[1] === 3 && counts[2] === 2) return 'echelon';
    // 旧 1-2-3 三角（6 人，兼容历史草稿）
    if (slots.length === 3 && counts[0] === 1 && counts[1] === 2 && counts[2] === 3) return 'triangle';
    // 鱼鳞 3×3（5 slot：3 + 1+1+1 + 3）
    if (total === 9 && slots.length === 5) return 'square';
    return slots.length <= 3 ? 'triangle' : 'square';
}

/** 切换阵型时转换 slot（尽量保留已有兵种选择；三阵型 2026-08-15） */
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
            { type: base, count: 2 },
            { type: base, count: 3 },
            { type: base, count: 4 },
        ];
    }
    if (mode === 'echelon') {
        const midBase = sideType.includes('cavalry') || sideType === 'lancer' ? sideType : 'crossbow';
        const backBase = backType.includes('cavalry') || backType === 'lancer' ? backType : 'crossbow';
        return [
            { type: frontType, count: 4 },
            { type: midBase, count: 3 },
            { type: backBase, count: 2 },
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

import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';

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
    const custom = FACTION_COMPOSITIONS[factionId];
    if (custom) {
        return [...custom.slots];
    }
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
    /** 三值阵型（square 鱼鳞 / triangle 三角 / echelon 雁行）；渲染层据此定布局，不再靠 slots.length 猜 */
    formationMode?: FormationMode | null;
    getTroops(): number;
}

/** 写入军团 cultureSlots / cultureScales / legionType / formationMode（势力专属优先于文化区） */
export function applyLegionCultureComposition(army: LegionCompositionTarget, region?: RegionType): void {
    const culture = region ?? army.cultureRegion ?? 'CENTRAL';
    const custom = FACTION_COMPOSITIONS[army.factionId];
    const factionSlots = custom ? custom.slots : getFactionCompositionSlots(army.factionId);
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
    // 阵型：势力专属固定方阵（秦国/自定义配置）→ 文化区默认；slot 结构能反推时以反推为准
    army.formationMode = custom?.formationMode
        ?? (army.factionId === 'qin'
            ? 'square'
            : (inferFormationModeFromSlots(slots) ?? getCultureFormationMode(culture)));
}

// ============================================================
// 15 文化区阵型 (用户 2026-05-30 拍板)
// ============================================================

/** 1. 中原 剑士+虎豹骑+诸葛弩（2026-08-15 主人定：全决定版，鱼鳞 3×3 步前骑中弓后） */
export const CENTRAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 3 },   // Row 0 前 = 剑士 步兵（帝国决定）
            { type: 'tiger_rider', count: 1 },   // Row 1 左 = 虎豹骑 骑兵（帝国决定）
            { type: 'tiger_rider', count: 1 },   // Row 1 中 = 虎豹骑（原刀骑将领，取消）
            { type: 'tiger_rider', count: 1 },   // Row 1 右 = 虎豹骑 骑兵（帝国决定）
            { type: 'chukonu', count: 3 }        // Row 2 后 = 诸葛弩 弩手（帝国决定）
        ]
    }
];
/** 2. 北方 辽刀+印加枪兵长+鲜卑掠骑兵（2026-08-15 主人定：全决定版，三角 2+3+4，辽刀近战尖刀领前 + 印加枪兵长中 + 鲜卑掠骑兵后） */
export const NORTH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'liao_dao', count: 2 },      // Row 0 尖刀 = 辽刀 步兵（帝国决定）
            { type: 'kamayuk', count: 3 },       // Row 1 中 = 印加枪兵长 步兵（帝国决定）
            { type: 'xianbei_raider', count: 4 } // Row 2 后 = 鲜卑掠骑兵 骑兵（帝国决定）
        ]
    }
];

/** 3. 东北 精锐长弓兵+铁浮图+钦察（2026-08-15 主人定：全决定版，雁行 4+3+2，精锐长弓兵远程顶前 + 铁浮图中 + 钦察后） */
export const NORTHEAST_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longbowman_elite', count: 4 }, // Row 0 前 = 精锐长弓兵 弓手（帝国决定）
            { type: 'iron_pagoda', count: 3 },      // Row 1 中 = 铁浮图 重骑兵（帝国决定）
            { type: 'kipchak', count: 2 }           // Row 2 后 = 钦察 弓骑兵（帝国决定）
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
            { type: 'jian_swordsman', count: 3 },     // Row 0 前 = 刀剑手（帝国决定，吴国 Jian Swordsman）
            { type: 'hei_kuang_heavy', count: 1 },    // Row 1 左 = 精锐黑光铠骑兵（帝国决定，重装）
            { type: 'hei_kuang_heavy', count: 1 },    // Row 1 中 = 精锐黑光铠骑兵（原刀骑将领，取消）
            { type: 'hei_kuang_heavy', count: 1 },    // Row 1 右 = 精锐黑光铠骑兵（帝国决定，重装）
            { type: 'fire_archer', count: 3 }         // Row 2 后 = 火焰弓箭手（帝国决定）
        ]
    }
];

/** 5. 日本 忍者+日本武士+精锐武士（2026-08-15 主人定：全决定版，三角 2+3+4，忍者近战尖刀领前 + 日本武士中 + 精锐武士后） */
export const JAPAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'ninja', count: 2 },          // Row 0 尖刀 = 忍者 步兵（帝国决定）
            { type: 'samurai', count: 3 },        // Row 1 中 = 日本武士 步兵（帝国决定）
            { type: 'samurai_elite', count: 4 }   // Row 2 后 = 精锐武士 步兵（帝国决定）
        ]
    }
];
/** 6. 草原 草原枪兵+怯薛+精锐蒙古突骑（2026-08-15 主人定：全决定版，三角 2+3+4，草原枪兵近战尖刀领前 + 怯薛中 + 精锐蒙古突骑骑射后） */
export const STEPPE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'steppe_lancer', count: 2 },  // Row 0 尖刀 = 草原枪兵 近战骑（帝国决定）
            { type: 'keshik', count: 3 },         // Row 1 中 = 怯薛军 近战骑（帝国决定）
            { type: 'mangudai_elite', count: 4 }  // Row 2 后 = 精锐蒙古突骑 弓骑（帝国决定）
        ]
    }
];
/** 7. 河西 精锐火矛手+精锐辽刀+黑光铠骑兵（2026-08-15 主人定：全决定版，三角 2+3+4，精锐火矛手近战尖刀领前 + 精锐辽刀中 + 黑光铠骑兵后） */
export const HEXI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_fire_lancer', count: 2 },  // Row 0 尖刀 = 精锐火矛手 步兵（帝国决定）
            { type: 'elite_liao_dao', count: 3 },     // Row 1 中 = 精锐辽刀 步兵（帝国决定）
            { type: 'hei_kuang', count: 4 }           // Row 2 后 = 黑光铠骑兵 骑兵（帝国决定）
        ]
    }
];
/** 8. 川蜀 精锐诸葛弩+白毦兵+藤弓兵（2026-08-15 主人定：全决定版，雁行 4+3+2，精锐诸葛弩远程顶前 + 白毦兵中 + 藤弓兵后） */
export const BASHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_chukonu', count: 4 },        // Row 0 前 = 精锐诸葛弩 弩手（帝国决定）
            { type: 'white_feather_guard', count: 3 },  // Row 1 中 = 白毦兵 步兵（帝国决定）
            { type: 'rattan_archer', count: 2 }         // Row 2 后 = 藤弓兵 弓手（帝国决定）
        ]
    }
];
/** 9. 江南 精锐火焰弓箭手+剑士+诸葛弩（2026-08-15 主人定：全决定版，雁行 4+3+2，精锐火焰弓箭手远程顶前 + 剑士中 + 诸葛弩后） */
export const JIANGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_fire_archer', count: 4 },  // Row 0 前 = 精锐火焰弓箭手 弓手（帝国决定）
            { type: 'swordsman', count: 3 },          // Row 1 中 = 剑士 步兵（帝国决定）
            { type: 'chukonu', count: 2 }             // Row 2 后 = 诸葛弩 弩手（帝国决定）
        ]
    }
];
/** 10. 岭南 精锐藤弓兵+帝王掷矛手+皮甲战象（2026-08-15 主人定：全决定版，雁行 4+3+2，精锐藤弓兵远程顶前 + 帝王掷矛手中 + 皮甲战象后） */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'rattan_archer_elite', count: 4 }, // Row 0 前 = 精锐藤弓兵 弓手（帝国决定）
            { type: 'imperial_skirmisher', count: 3 }, // Row 1 中 = 帝王掷矛手 掷矛手（帝国决定）
            { type: 'armored_elephant', count: 2 }     // Row 2 后 = 皮甲战象 冲阵（帝国决定，DE 素材自带尺寸）
        ]
    }
];
/** 11. 滇缅 象兵+精锐爪刀勇士+步弓手（2026-08-15 主人定：全决定版，三角 2+3+4，象兵近战尖刀 + 精锐爪刀勇士中 + 步弓手后） */
export const DIANQIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'war_elephant', count: 2 },   // Row 0 尖刀 = 象兵 冲阵（帝国决定，DE 素材自带尺寸）
            { type: 'karambit_warrior_elite', count: 3 },// Row 1 中 = 精锐爪刀勇士 步兵（帝国决定）
            { type: 'archer', count: 4 }           // Row 2 后 = 步弓手 弓手（帝国决定）
        ]
    }
];
/** 12. 青藏 精锐白毦兵+答剌罕骑兵+蒙古突骑（2026-08-15 主人定：全决定版，三角 2+3+4，精锐白毦兵近战尖刀领前 + 答剌罕骑兵中 + 蒙古突骑后） */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_white_feather_guard', count: 2 }, // Row 0 尖刀 = 精锐白毦兵 步兵（帝国决定）
            { type: 'tarkan', count: 3 },                 // Row 1 中 = 答剌罕骑兵 近战骑（帝国决定）
            { type: 'mangudai', count: 4 }                // Row 2 后 = 蒙古突骑 弓骑（帝国决定）
        ]
    }
];
/** 13. 中亚 贵族铁骑+萨瓦尔+精锐钦察（2026-08-16 主人改：三角 2+3+4，贵族铁骑近战尖刀 + 萨瓦尔重骑中 + 精锐钦察弓骑后） — MovementClass=CAVALRY */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'boyar', count: 2 },         // Row 0 尖刀 = 贵族铁骑 近战重骑（帝国决定）
            { type: 'savar', count: 3 },         // Row 1 中 = 萨瓦尔 重骑（帝国决定）
            { type: 'elite_kipchak', count: 4 }  // Row 2 后 = 精锐钦察 弓骑（帝国决定）
        ]
    }
];
/** 14. 西域 精锐近卫军+骑射手+草原枪兵（2026-08-15 主人修订：前排长枪兵→精锐近卫军、后排轻骑兵→草原枪兵） — MovementClass=MIXED */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_guardsman', count: 3 },  // Row 0 前 = 精锐近卫军 步兵（帝国决定）
            { type: 'cav_archer', count: 1 },       // Row 1 左 = 骑射手 弓骑（帝国决定）
            { type: 'cav_archer', count: 1 },       // Row 1 中 = 骑射手（原刀骑将领，取消）
            { type: 'cav_archer', count: 1 },       // Row 1 右 = 骑射手 弓骑（帝国决定）
            { type: 'pattiyoda_longbowman', count: 3 } // Row 2 后 = 帕提尤达长弓手 弓手（帝国决定）
        ]
    }
];
/** 15. 西亚 东方剑士+重装骑射手+精锐复合弓箭手（2026-08-16 主人改：中排重装骆驼兵→重装骑射手，鱼鳞 3×3 步前骑中弓后） */
export const WEST_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'eastern_swordsman', count: 3 },     // Row 0 前 = 东方剑士 步兵（帝国决定）
            { type: 'cav_archer_heavy', count: 1 },      // Row 1 左 = 重装骑射手 弓骑（帝国决定）
            { type: 'cav_archer_heavy', count: 1 },      // Row 1 中 = 重装骑射手 弓骑（帝国决定）
            { type: 'cav_archer_heavy', count: 1 },      // Row 1 右 = 重装骑射手 弓骑（帝国决定）
            { type: 'elite_composite_bowman', count: 3 } // Row 2 后 = 精锐复合弓箭手 弓手（帝国决定）
        ]
    }
];
/** 16. 斯拉夫 罗马军+精锐草原枪兵+复合弓箭手（2026-08-15 主人定：全决定版，鱼鳞 3×3 步前骑中弓后；罗马军=Legionary 军团步兵） */
export const SLAVIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'legionary', count: 3 },           // Row 0 前 = 罗马军 步兵（帝国决定，u_inf_legionary）
            { type: 'elite_steppe_lancer', count: 1 }, // Row 1 左 = 精锐草原枪兵 骑兵（帝国决定）
            { type: 'elite_steppe_lancer', count: 1 }, // Row 1 中 = 精锐草原枪兵（原刀骑将领，取消）
            { type: 'elite_steppe_lancer', count: 1 }, // Row 1 右 = 精锐草原枪兵 骑兵（帝国决定）
            { type: 'composite_bowman', count: 3 }     // Row 2 后 = 复合弓箭手 弓手（帝国决定）
        ]
    }
];
/** 17. 日耳曼 冠军剑士+弩手+游侠（2026-08-15 主人定：全决定版，中间刀骑取消→游侠，风格统一） */
export const GERMANIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 3 },          // Row 0 前 = 冠军剑士 步兵（帝国决定）
            { type: 'paladin', count: 1 },           // Row 1 左 = 游侠 骑兵（帝国决定）
            { type: 'paladin', count: 1 },           // Row 1 中 = 游侠（原刀骑将领，取消）
            { type: 'paladin', count: 1 },           // Row 1 右 = 游侠 骑兵（帝国决定）
            { type: 'crossbowman', count: 3 }        // Row 2 后 = 弩手 弩手（帝国决定）
        ]
    }
];
/** 18. 拉丁 马上轻装兵+重装长枪兵+劲弩手（2026-08-15 主人定：全决定版，中间刀骑取消→马上轻装兵，风格统一） */
export const LATIN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_pikeman', count: 3 },     // Row 0 前 = 重装长枪兵 步兵（帝国决定）
            { type: 'coustillier', count: 1 },       // Row 1 左 = 马上轻装兵 骑兵（帝国决定）
            { type: 'coustillier', count: 1 },       // Row 1 中 = 马上轻装兵（原刀骑将领，取消）
            { type: 'coustillier', count: 1 },       // Row 1 右 = 马上轻装兵 骑兵（帝国决定）
            { type: 'arbalest', count: 3 }           // Row 2 后 = 劲弩手 弩手（帝国决定）
        ]
    }
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
