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
    JAPAN:        'MIXED',   // 日本战国步骑铁炮
    BASHU:        'INFANTRY',
    JIANGNAN:     'INFANTRY',
    LINGNAN:      'ELEPHANT',
    DIANQIAN:     'ELEPHANT',
    SLAVIC:       'MIXED',   // 东欧步骑
    GERMANIC:     'MIXED', // 中欧步骑（重步+骑士）
    LATIN:        'INFANTRY', // 西欧重步/军团
    GREEK:        'INFANTRY', // 希腊古典方阵重步
};

export function getCultureMovementClass(culture: RegionType): MovementClass {
    return CULTURE_MOVEMENT_CLASS[culture] ?? 'MIXED';
}

/** 18 文化默认阵型（可被军队编辑器覆盖保存）——2026-08-16 主人最新定稿：
 *  鱼鳞阵（square 3×3，9人）: 日本、草原、川蜀、江南、中亚
 *  三角阵（triangle 2+3+4，9人）: 岭南、滇缅、朝鲜、东北、拉丁、中原
 *  雁行阵（echelon 4+3+2，9人）: 北方、西域、河西、青藏、西亚、斯拉夫、日耳曼 */
export const CULTURE_FORMATION_MODE: Record<RegionType, FormationMode> = {
    // 鱼鳞阵 (5区)
    STEPPE:       'square',
    BASHU:        'square',
    JIANGNAN:     'square',
    CENTRAL_ASIA: 'square',
    GREEK:        'square',

    // 三角阵 (7区)
    JAPAN:        'triangle', // 日本战国三角阵
    LINGNAN:      'triangle',
    DIANQIAN:     'triangle',
    KOREA:        'triangle',
    NORTHEAST:    'triangle',
    LATIN:        'triangle',
    CENTRAL:      'triangle',

    // 雁行阵 (7区)
    NORTH:        'echelon',
    WESTERN:      'echelon',
    HEXI:         'echelon',
    TIBET:        'echelon',
    WEST_ASIA:    'echelon',
    SLAVIC:       'echelon',
    GERMANIC:     'echelon',
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
        { type: 'lancer', count: 1 },   // 中中 = 与左右同兵种（08-15 取消刀骑将领，勿再写 general_cavalry）
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

/** 切换阵型时转换 slot（100% 保留已有前排、中坚、后排兵种与缩放；三阵型 2026-08-15） */
export function convertSlotsToMode(slots: CompositionSlot[], mode: FormationMode): CompositionSlot[] {
    const r0 = { type: slots[0]?.type || 'swordsman', scale: slots[0]?.scale };
    let r1 = { type: 'lancer', scale: 1.0 as number | undefined };
    let r2 = { type: 'archer', scale: 1.0 as number | undefined };

    if (slots.length === 5) {
        // square: 0(前3), 1,2,3(中坚), 4(后3)
        r1 = { type: slots[1]?.type || slots[2]?.type || slots[3]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[4]?.type || 'archer', scale: slots[4]?.scale };
    } else if (slots.length >= 3) {
        // triangle or echelon: 0(前), 1(中), 2(后)
        r1 = { type: slots[1]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[2]?.type || 'archer', scale: slots[2]?.scale };
    } else if (slots.length === 2) {
        r1 = { type: slots[1]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[1]?.type || 'archer', scale: slots[1]?.scale };
    } else if (slots.length === 1) {
        r1 = { type: slots[0]?.type || 'lancer', scale: slots[0]?.scale };
        r2 = { type: slots[0]?.type || 'archer', scale: slots[0]?.scale };
    }

    if (mode === 'triangle') {
        return [
            { type: r0.type, count: 2, scale: r0.scale },
            { type: r1.type, count: 3, scale: r1.scale },
            { type: r2.type, count: 4, scale: r2.scale },
        ];
    }
    if (mode === 'echelon') {
        return [
            { type: r0.type, count: 4, scale: r0.scale },
            { type: r1.type, count: 3, scale: r1.scale },
            { type: r2.type, count: 2, scale: r2.scale },
        ];
    }
    // square
    return [
        { type: r0.type, count: 3, scale: r0.scale },
        { type: r1.type, count: 1, scale: r1.scale },
        { type: r1.type, count: 1, scale: r1.scale },
        { type: r1.type, count: 1, scale: r1.scale },
        { type: r2.type, count: 3, scale: r2.scale },
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
    { type: 'lancer', count: 1 },
    { type: 'general_cavalry', count: 1 },
    { type: 'lancer', count: 1 },
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

/** 1. 中原 剑士+虎豹骑+诸葛弩（三角阵 2+3+4：剑士尖刀前 + 虎豹骑中坚 + 诸葛弩底边） */
export const CENTRAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 2 },      // Row 0 尖刀 = 剑士 步兵
            { type: 'tiger_rider', count: 3 },    // Row 1 中坚 = 虎豹骑 骑兵
            { type: 'chukonu', count: 4 }         // Row 2 底边 = 诸葛弩 弩手
        ]
    }
];

/** 2. 北方 印加枪兵长+鲜卑掠骑兵+辽刀（雁行阵 4+3+2：印加枪兵长前 + 鲜卑掠骑兵中 + 辽刀后） */
export const NORTH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'kamayuk', count: 4 },        // Row 0 前排 = 印加枪兵长 步兵
            { type: 'xianbei_raider', count: 3 }, // Row 1 中排 = 鲜卑掠骑兵 骑兵
            { type: 'liao_dao', count: 2 }        // Row 2 后排 = 辽刀 步兵
        ]
    }
];

/** 3. 东北 精锐长弓兵+钦察+铁浮图（三角阵 2+3+4：精锐长弓兵尖刀前 + 钦察中坚 + 铁浮图底边） */
export const NORTHEAST_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longbowman_elite', count: 2 }, // Row 0 尖刀 = 精锐长弓兵 弓手
            { type: 'kipchak', count: 3 },          // Row 1 中坚 = 钦察 弓骑兵
            { type: 'iron_pagoda', count: 4 }       // Row 2 底边 = 铁浮图 重骑兵
        ]
    }
];

/** 4. 朝鲜 剑士+精锐黑光铠骑兵+火焰弓箭手（三角阵 2+3+4：剑士尖刀前 + 精锐黑光铠骑兵中坚 + 火焰弓箭手底边） */
export const KOREA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 2 },        // Row 0 尖刀 = 剑士 步兵
            { type: 'hei_kuang_heavy', count: 3 },  // Row 1 中坚 = 精锐黑光铠骑兵 重骑
            { type: 'fire_archer', count: 4 }       // Row 2 底边 = 火焰弓箭手 弓手
        ]
    }
];

/** 5. 日本战国 手炮手+黑光铠骑兵+精锐武士（三角阵 2+3+4：手炮手尖刀前 + 黑光铠骑兵中坚 + 精锐武士底边） */
export const JAPAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hand_cannoneer', count: 2 },   // Row 0 尖刀 = 手炮手 (铁炮前列齐射)
            { type: 'hei_kuang', count: 3 },        // Row 1 中坚 = 黑光铠骑兵 (具足骑兵突击)
            { type: 'samurai_elite', count: 4 }     // Row 2 底边 = 精锐武士 (大太刀精锐合围)
        ]
    }
];
export const SENGOKU_TIERS = JAPAN_TIERS;

/** 6. 草原 草原枪兵+怯薛+精锐蒙古突骑（鱼鳞阵 3×3：草原枪兵前 + 怯薛中 + 精锐蒙古突骑后） */
export const STEPPE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'steppe_lancer', count: 3 },    // Row 0 前排 = 草原枪兵 骑兵
            { type: 'keshik', count: 1 },           // Row 1 左 = 怯薛军 骑兵
            { type: 'keshik', count: 1 },           // Row 1 中 = 怯薛军 骑兵
            { type: 'keshik', count: 1 },           // Row 1 右 = 怯薛军 骑兵
            { type: 'mangudai_elite', count: 3 }    // Row 2 后排 = 精锐蒙古突骑 弓骑
        ]
    }
];

/** 7. 河西 精锐火矛手+黑光铠骑兵+精锐辽刀（雁行阵 4+3+2：精锐火矛手前 + 黑光铠骑兵中 + 精锐辽刀后） */
export const HEXI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_fire_lancer', count: 4 },// Row 0 前排 = 精锐火矛手 步兵
            { type: 'hei_kuang', count: 3 },        // Row 1 中排 = 黑光铠骑兵 骑兵
            { type: 'elite_liao_dao', count: 2 }    // Row 2 后排 = 精锐辽刀 步兵
        ]
    }
];

/** 8. 川蜀 白毦兵+精锐诸葛弩+藤弓兵（鱼鳞阵 3×3：白毦兵前 + 精锐诸葛弩中 + 藤弓兵后） */
export const BASHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'white_feather_guard', count: 3 },  // Row 0 前排 = 白毦兵 步兵
            { type: 'elite_chukonu', count: 1 },        // Row 1 左 = 精锐诸葛弩 弩手
            { type: 'elite_chukonu', count: 1 },        // Row 1 中 = 精锐诸葛弩 弩手
            { type: 'elite_chukonu', count: 1 },        // Row 1 右 = 精锐诸葛弩 弩手
            { type: 'rattan_archer', count: 3 }         // Row 2 后排 = 藤弓兵 弓手
        ]
    }
];

/** 9. 江南 剑士+精锐火焰弓箭手+诸葛弩（鱼鳞阵 3×3：剑士前 + 精锐火焰弓箭手中 + 诸葛弩后） */
export const JIANGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 3 },          // Row 0 前排 = 剑士 步兵
            { type: 'elite_fire_archer', count: 1 },  // Row 1 左 = 精锐火焰弓箭手 弓手
            { type: 'elite_fire_archer', count: 1 },  // Row 1 中 = 精锐火焰弓箭手 弓手
            { type: 'elite_fire_archer', count: 1 },  // Row 1 右 = 精锐火焰弓箭手 弓手
            { type: 'chukonu', count: 3 }             // Row 2 后排 = 诸葛弩 弩手
        ]
    }
];

/** 10. 岭南 皮甲战象+帝王掷矛手+精锐藤弓兵（三角阵 2+3+4：皮甲战象尖刀前 + 帝王掷矛手中坚 + 精锐藤弓兵底边） */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'armored_elephant', count: 2 },    // Row 0 尖刀 = 皮甲战象 战象
            { type: 'imperial_skirmisher', count: 3 }, // Row 1 中坚 = 帝王掷矛手 掷矛手
            { type: 'rattan_archer_elite', count: 4 }  // Row 2 底边 = 精锐藤弓兵 弓手
        ]
    }
];

/** 11. 滇缅 象兵+步弓手+精锐爪刀勇士（三角阵 2+3+4：象兵尖刀前 + 步弓手中坚 + 精锐爪刀勇士底边） */
export const DIANQIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'war_elephant', count: 2 },          // Row 0 尖刀 = 象兵 战象
            { type: 'archer', count: 3 },                // Row 1 中坚 = 步弓手 弓手
            { type: 'karambit_warrior_elite', count: 4 } // Row 2 底边 = 精锐爪刀勇士 步兵
        ]
    }
];

/** 12. 青藏 蒙古突骑+答剌罕骑兵+精锐白毦兵（雁行阵 4+3+2：蒙古突骑前 + 答剌罕骑兵中 + 精锐白毦兵后） */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'mangudai', count: 4 },                  // Row 0 前排 = 蒙古突骑 弓骑
            { type: 'tarkan', count: 3 },                    // Row 1 中排 = 答剌罕骑兵 骑兵
            { type: 'elite_white_feather_guard', count: 2 }  // Row 2 后排 = 精锐白毦兵 步兵
        ]
    }
];

/** 13. 中亚 贵族铁骑+萨瓦尔+精锐钦察（鱼鳞阵 3×3：贵族铁骑前 + 萨瓦尔中 + 精锐钦察后） */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'boyar', count: 3 },         // Row 0 前排 = 贵族铁骑 骑兵
            { type: 'savar', count: 1 },         // Row 1 左 = 萨瓦尔 骑兵
            { type: 'savar', count: 1 },         // Row 1 中 = 萨瓦尔 骑兵
            { type: 'savar', count: 1 },         // Row 1 右 = 萨瓦尔 骑兵
            { type: 'elite_kipchak', count: 3 }  // Row 2 后排 = 精锐钦察 弓骑
        ]
    }
];

/** 14. 西域 精锐近卫军+骑射手+帕提尤达长弓手（雁行阵 4+3+2：精锐近卫军前 + 骑射手中 + 帕提尤达长弓手后） */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_guardsman', count: 4 },     // Row 0 前排 = 精锐近卫军 步兵
            { type: 'cav_archer', count: 3 },          // Row 1 中排 = 骑射手 弓骑
            { type: 'pattiyoda_longbowman', count: 2 } // Row 2 后排 = 帕提尤达长弓手 弓手
        ]
    }
];

/** 15. 西亚 精锐复合弓箭手+重装骑射手+东方剑士（雁行阵 4+3+2：精锐复合弓箭手前 + 重装骑射手中 + 东方剑士后） */
export const WEST_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_composite_bowman', count: 4 }, // Row 0 前排 = 精锐复合弓箭手 弓手
            { type: 'cav_archer_heavy', count: 3 },       // Row 1 中排 = 重装骑射手 弓骑
            { type: 'eastern_swordsman', count: 2 }       // Row 2 后排 = 东方剑士 步兵
        ]
    }
];

/** 16. 斯拉夫 复合弓箭手+精锐草原枪兵+罗马军（雁行阵 4+3+2：复合弓箭手前 + 精锐草原枪兵中 + 罗马军团步兵后） */
export const SLAVIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'composite_bowman', count: 4 },    // Row 0 前排 = 复合弓箭手 弓手
            { type: 'elite_steppe_lancer', count: 3 }, // Row 1 中排 = 精锐草原枪兵 骑兵
            { type: 'legionary', count: 2 }            // Row 2 后排 = 罗马军团步兵 步兵
        ]
    }
];

/** 17. 日耳曼 冠军剑士+游侠+弩手（雁行阵 4+3+2：冠军剑士前 + 游侠中 + 弩手后） */
export const GERMANIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 4 },   // Row 0 前排 = 冠军剑士 步兵
            { type: 'paladin', count: 3 },    // Row 1 中排 = 游侠 骑兵
            { type: 'crossbowman', count: 2 } // Row 2 后排 = 弩手 弩手
        ]
    }
];

/** 18. 拉丁 重装长枪兵+重装骑士+劲弩手（三角阵 2+3+4：重装长枪兵尖刀前 + 重装骑士中坚 + 劲弩手底边） */
export const LATIN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_pikeman', count: 2 }, // Row 0 尖刀 = 重装长枪兵 步兵
            { type: 'knight', count: 3 },        // Row 1 中坚 = 重装骑士/骑士 骑兵
            { type: 'arbalest', count: 4 }       // Row 2 底边 = 劲弩手 弩手
        ]
    }
];

/** 19. 希腊 希腊重装步兵+底比斯圣队+罗得岛投石兵（鱼鳞阵 3×3：希腊重装步兵前 + 底比斯圣队中 + 罗得岛投石兵后） */
export const GREEK_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hoplite', count: 3 },          // Row 0 前排 = 希腊重装步兵 步兵
            { type: 'sacred_band', count: 1 },      // Row 1 左 = 底比斯圣队 步兵
            { type: 'sacred_band', count: 1 },      // Row 1 中 = 底比斯圣队 步兵
            { type: 'sacred_band', count: 1 },      // Row 1 右 = 底比斯圣队 步兵
            { type: 'rhodian_slinger', count: 3 }   // Row 2 后排 = 罗得岛投石兵 远程
        ]
    }
];

/** 亚历山大·马其顿帝国军团（三角阵 2+3+4：希腊重装步兵尖刀前 + 伙伴骑兵中坚 + 克里特弓手底边） */
export const ALEXANDER_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hoplite', count: 2 },            // Row 0 尖刀 = 希腊重装步兵 步兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵 骑兵
            { type: 'cretan_archer', count: 4 }       // Row 2 底边 = 克里特弓手 弓手
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
    GREEK:        GREEK_TIERS,
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
