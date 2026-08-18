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

/** 军队编辑器可选阵型（2026-08-18 五大经典阵型，均 9 人）：
 *  triangle   三角阵 = 2+3+4（前2/中3/后4，尖刀破防·楔形突击）
 *  echelon    雁行阵 = 4+3+2（前4/中3/后2，宽线铜墙·远程覆盖）
 *  fish_scale 鱼鳞阵 = 3+4+2（前3/中4/后2，前抵抗线·中腰鳞叠）
 *  crane_wing 鹤翼阵 = 2+4+3（前2/中4/后3，双锋引敌·两翼合围）
 *  square     方阵   = 3+3+3（前3/中3/后3，九宫等边·坚若磐石）
 */
export type FormationMode = 'triangle' | 'echelon' | 'fish_scale' | 'crane_wing' | 'square';

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
    JAPAN:        'INFANTRY', // 日本纯步兵
    BASHU:        'INFANTRY',
    JIANGNAN:     'INFANTRY',
    LINGNAN:      'ELEPHANT',
    DIANQIAN:     'ELEPHANT',
    SLAVIC:       'MIXED',   // 东欧步骑
    GERMANIC:     'MIXED', // 中欧步骑（重步+骑士）
    LATIN:        'INFANTRY', // 西欧重步/军团
    GREEK:        'INFANTRY', // 希腊古典方阵重步
    NUERGAN:      'MIXED',    // 奴儿干步骑混合
};

export function getCultureMovementClass(culture: RegionType): MovementClass {
    return CULTURE_MOVEMENT_CLASS[culture] ?? 'MIXED';
}

/**
 * 【2026-08-18 主人定稿 · 20 文化区阵型规则】合规审计：`node scratch/audit_culture_formations.mjs`（现 0/20 违规）
 *
 *   ① 四个阵型都是 2/3/4 三排，**文化主力兵种必须占 4 档**（方阵 3+3+3 是主人指定的，不参与本规则）
 *   ② 主力类型 → 阵型：远→雁行 / 步→鱼鳞 / 近战骑→鹤翼 / 弓骑→三角
 *   ③ **象兵、火器不得当主力**（主人原话「太强大了」）
 *   ④ 骑兵只有近战骑、远程骑（弓骑）两类，没有「冲锋骑兵」；按兵种样子归类，不按 ID 名字猜
 *
 * 🔴 这条规则**不是排版，是平衡改动**——4 档 = 军团 4/9 的兵，换谁占 4 档直接改战力。
 *    落地时逐条实测过（`scratch/echelon_ab.mjs` / `echelon_ab2.mjs`，20 种子，新旧编制直接对打）：
 *      川蜀  9:11  → 两种排法强度相当，白换
 *      江南  0:20  → **变强**（精锐火焰弓 rng 400 从 3 档升 4 档，收益极大）
 *      西亚 17:3   → **变弱**（复合弓本身弱，东方剑士从 4 降 3）。已用「近战留 3 档」的排法补偿，
 *                    比直接降到 2 档少削一半（直接换是 20:0）。
 *      岭南 20:0   → **变弱**，且这正是主人要的：旧数据让皮甲战象占 4 档，实测碾压合规版 20:0，
 *                    坐实「象兵当主力太强大」。象已降到 3 档。
 *    ⚠️ 后续若要拉平这些差，改 `GameConfig.CULTURE_COMBAT` 的六维系数，别回头动 4 档归属。
 *
 * ⚠️ 雁行的「4」在**最前排**（`LAYOUT.echelon` row0 = 离敌最近那排），所以远程主力文化是
 *    「弓弩宽线在前齐射、近战居中接应、第二远程压阵」。这是雁行阵本义（张两翼、利弓弩），
 *    不是排错了。若哪天要改成「远程在后」，只能把 4 挪到后排 —— 但那样格位就和三角完全相同，
 *    五大阵型会少一个形状，**别顺手改**。
 *
 * 分组（2026-08-18 用户拍板：四个阵型都是2个3个4个构成，文化主力兵种必须是4个）：
 *  鹤翼阵（crane_wing 2+4+3，4 档在中排，近战骑主力）：北方、河西、朝鲜、青藏、斯拉夫、日耳曼、拉丁
 *  鱼鳞阵（fish_scale 3+4+2，4 档在中排，步兵主力）：日本、希腊、滇缅
 *  三角阵（triangle 2+3+4，4 档在后排，弓骑主力）：草原、东北、中亚、西域、奴儿干
 *  雁行阵（echelon 4+3+2，4 档在前排，远程主力）：中原、川蜀、江南、岭南、西亚
 */
export const CULTURE_FORMATION_MODE: Record<RegionType, FormationMode> = {
    // 鹤翼阵 (2+4+3，步骑远：步兵前锋2 + 主力骑兵两翼包抄4 + 远程中军后排3)
    KOREA:        'crane_wing',   // 朝鲜：剑士步兵(2) + 黑光铠骑兵主力(4) + 火焰弓后排(3)
    SLAVIC:       'crane_wing',   // 斯拉夫：贵族铁骑(2) + 精锐贵族铁骑主力(4) + 复合弓箭手后排(3)
    GERMANIC:     'crane_wing',   // 日耳曼：冠军剑士(2) + 游侠圣骑主力(4) + 弩手后排(3)
    LATIN:        'crane_wing',   // 拉丁：重装长枪(2) + 重装骑士主力(4) + 劲弩手后排(3)

    // 鱼鳞阵 (3+4+2，2近战+1远程：前卫抗线3 + 主力近战突破4 + 远程后排支援2)
    NORTH:        'fish_scale',   // 北方：辽刀前卫(3) + 精锐黑光铠骑兵突击主力(4) + 诸葛弩后排(2)
    JAPAN:        'fish_scale',   // 日本：日本武士(3) + 精锐武士主力(4) + 藤弓兵后排(2)
    GREEK:        'fish_scale',   // 希腊：希腊重装步兵(3) + 底比斯圣队主力(4) + 色雷斯轻装标枪后排(2)
    BASHU:        'fish_scale',   // 川蜀：白羽卫兵前卫(3) + 精锐白羽卫兵主力(4) + 诸葛弩后排(2)
    TIBET:        'fish_scale',   // 青藏：答剌罕前卫(3) + 精锐答剌罕主力(4) + 蒙古突骑后排(2)
    NORTHEAST:    'fish_scale',   // 东北：铁浮图前卫(3) + 精锐铁浮图主力(4) + 钦察后排(2)

    // 三角阵 (2+3+4，尖刀先锋2 + 冲击中坚3 + 主力底边4)
    CENTRAL:      'triangle',     // 中原：刀剑手(2) + 诸葛弩(3) + 精锐诸葛弩主力(4)
    STEPPE:       'triangle',     // 草原：草原枪兵(2) + 蒙古突骑(3) + 精锐蒙古突骑主力(4)
    JIANGNAN:     'triangle',     // 江南：剑士(2) + 火焰弓(3) + 精锐火焰弓主力(4)
    LINGNAN:      'triangle',     // 岭南：皮甲战象(2) + 藤弓兵(3) + 精锐藤弓兵主力(4)
    DIANQIAN:     'triangle',     // 滇缅：战斗象(2) + 步弓手(3) + 爪刀勇士主力(4)
    CENTRAL_ASIA: 'triangle',     // 中亚：草原枪骑(2) + 萨瓦尔铁骑(3) + 精锐钦察主力(4)
    NUERGAN:      'triangle',     // 奴儿干：答剌罕(2) + 反曲长弓(3) + 鲜卑掠骑主力(4后)
    WESTERN:      'triangle',     // 西域：斯基泰斧骑(2) + 斯基泰骑射(3) + 精锐斯基泰骑射主力(4)

    // 雁行阵 (4+3+2，前排宽线主力4 + 中坚3 + 压阵2)
    HEXI:         'echelon',      // 河西：精锐辽刀主力(4前) + 黑光铠骑兵中坚(3中) + 诸葛弩后排(2后)
    WEST_ASIA:    'echelon',      // 西亚：东方剑士前排抗线(4) + 重装骑射手中坚(3) + 精锐复合弓后排(2)
};

export function getCultureFormationMode(culture: RegionType): FormationMode {
    return CULTURE_FORMATION_MODE[culture] ?? 'square';
}

/** 按阵型生成默认 slot 结构（2026-08-18 五阵型：三角2+3+4 / 雁行4+3+2 / 鱼鳞3+4+2 / 鹤翼2+4+3 / 方阵3+3+3，均 9 人） */
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
    if (mode === 'fish_scale') {
        return [
            { type: 'shield', count: 3 },
            { type: 'lancer', count: 4 },
            { type: 'crossbow', count: 2 },
        ];
    }
    if (mode === 'crane_wing') {
        return [
            { type: 'shield', count: 2 },
            { type: 'lancer', count: 4 },
            { type: 'crossbow', count: 3 },
        ];
    }
    // square (3+3+3 方阵)
    return [
        { type: 'shield', count: 3 },
        { type: 'shield', count: 3 },
        { type: 'crossbow', count: 3 },
    ];
}

/** 从 slot 结构推断阵型（兼容旧草稿；五阵型均为 9 人，靠各排 count 分布区分） */
export function inferFormationModeFromSlots(slots: CompositionSlot[]): FormationMode {
    const counts = slots.map(s => s.count);
    const total = counts.reduce((s, x) => s + x, 0);
    // 三角 2+3+4（三排）
    if (slots.length === 3 && counts[0] === 2 && counts[1] === 3 && counts[2] === 4) return 'triangle';
    // 雁行 4+3+2（三排）
    if (slots.length === 3 && counts[0] === 4 && counts[1] === 3 && counts[2] === 2) return 'echelon';
    // 鱼鳞 3+4+2（三排）
    if (slots.length === 3 && counts[0] === 3 && counts[1] === 4 && counts[2] === 2) return 'fish_scale';
    // 鹤翼 2+4+3（三排）
    if (slots.length === 3 && counts[0] === 2 && counts[1] === 4 && counts[2] === 3) return 'crane_wing';
    // 方阵 3+3+3（三排）
    if (slots.length === 3 && counts[0] === 3 && counts[1] === 3 && counts[2] === 3) return 'square';
    // 旧 1-2-3 三角（6 人，兼容历史草稿）
    if (slots.length === 3 && counts[0] === 1 && counts[1] === 2 && counts[2] === 3) return 'triangle';
    // 旧 3×3 鱼鳞/方阵（5 slot：3 + 1+1+1 + 3）
    if (total === 9 && slots.length === 5) return 'square';
    return slots.length <= 3 ? 'triangle' : 'square';
}

/** 切换阵型时转换 slot（100% 保留已有前排、中坚、后排兵种与缩放；五阵型 2026-08-18） */
export function convertSlotsToMode(slots: CompositionSlot[], mode: FormationMode): CompositionSlot[] {
    const r0 = { type: slots[0]?.type || 'swordsman', scale: slots[0]?.scale };
    let r1 = { type: 'lancer', scale: 1.0 as number | undefined };
    let r2 = { type: 'archer', scale: 1.0 as number | undefined };

    if (slots.length === 5) {
        // 旧 5-slot square: 0(前3), 1,2,3(中坚), 4(后3)
        r1 = { type: slots[1]?.type || slots[2]?.type || slots[3]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[4]?.type || 'archer', scale: slots[4]?.scale };
    } else if (slots.length >= 3) {
        // 0(前), 1(中), 2(后)
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
    if (mode === 'fish_scale') {
        return [
            { type: r0.type, count: 3, scale: r0.scale },
            { type: r1.type, count: 4, scale: r1.scale },
            { type: r2.type, count: 2, scale: r2.scale },
        ];
    }
    if (mode === 'crane_wing') {
        return [
            { type: r0.type, count: 2, scale: r0.scale },
            { type: r1.type, count: 4, scale: r1.scale },
            { type: r2.type, count: 3, scale: r2.scale },
        ];
    }
    // square (3+3+3 方阵)
    return [
        { type: r0.type, count: 3, scale: r0.scale },
        { type: r1.type, count: 3, scale: r1.scale },
        { type: r2.type, count: 3, scale: r2.scale },
    ];
}

import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';

// ============================================================
// 势力专属方阵（优先于文化区默认）
// ============================================================

/**
 * 秦及先秦·雁行阵（4+3+2）：印加枪兵长(4) + 双轮远程战车(3) + 诸葛弩(2)
 * 2026-08-18 主人定：秦国与所有秦国以前的武将统一套此阵（此前鹤翼 2+4+3 混用虎豹骑/剑手等三国贴图，时代错位）。
 */
export const QIN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'kamayuk', count: 4 },             // Row 0 前排·步兵前锋 = 印加枪兵长 4人
    { type: 'war_chariot_ranged', count: 3 },  // Row 1 中排 = 双轮远程战车 3人
    { type: 'chukonu', count: 2 },             // Row 2 后排压阵 = 诸葛弩 2人
];

/**
 * 汉国·鹤翼阵（2+4+3）：刀剑手(2) + 虎豹骑(4) + 诸葛弩(3)
 */
export const HAN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'jian_swordsman', count: 2 }, // Row 0 步兵前锋 = 刀剑手 2人
    { type: 'tiger_rider', count: 4 },    // Row 1 骑兵主力两翼合围 = 虎豹骑 4人
    { type: 'chukonu', count: 3 },        // Row 2 中军后排支援 = 诸葛弩 3人
];

/**
 * 曹魏·鹤翼阵（2+4+3）：魏武虎豹骑(2) + 魏武虎豹骑精锐(4) + 诸葛弩(3)
 */
export const WEI_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'tiger_rider', count: 2 },          // Row 0 前哨牵制 = 魏武虎豹骑 2人
    { type: 'elite_tiger_cavalry', count: 4 },  // Row 1 铁骑主力两翼合围 = 魏武虎豹骑精锐 4人
    { type: 'chukonu', count: 3 },              // Row 2 中军后排支援 = 诸葛弩 3人
];

/**
 * 唐朝·鹤翼阵（2+4+3）：辽刀(2) + 精锐黑光铠骑兵(4) + 诸葛弩(3)
 */
export const TANG_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'liao_dao', count: 2 },        // Row 0 步兵前锋 = 辽刀 2人
    { type: 'hei_kuang_heavy', count: 4 }, // Row 1 骑兵主力两翼合围 = 精锐黑光铠骑兵 4人
    { type: 'chukonu', count: 3 },         // Row 2 中军后排支援 = 诸葛弩 3人
];

/**
 * 宋朝·雁行阵（4+3+2）：诸葛弩(4) + 辽刀(3) + 精锐火矛手(2)
 * 2026-08-18 改：原「精锐火矛手 4 档主力」违反主人两条规矩（火器不得当主力 / 热兵器只许占 2 档）。
 * 主力改诸葛弩 —— 宋以强弩立国（神臂弓、床子弩），弩手宽线齐射正是雁行本义。
 */
export const SONG_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'chukonu', count: 4 },           // Row 0 主力·宽线齐射 = 诸葛弩 4人
    { type: 'liao_dao', count: 3 },          // Row 1 中军接应 = 辽刀 3人
    { type: 'elite_fire_lancer', count: 2 }, // Row 2 压阵火器 = 精锐火矛手 2人（🔴 热兵器只许 2 档）
];

/**
 * 大明·鹤翼阵（2+4+3）：精锐火矛手(2) + 黑光铠骑兵(4) + 诸葛弩(3)
 * 2026-08-18 改：原编制有**两个热兵器**（火矛手 4 + 掷弹兵 2），而一个编制只有一个 2 档位，
 * 按主人「热兵器只许占 2 档」必须去掉一个。留火矛手（神机营火铳是明军本色），
 * 去掉「女真掷弹兵」（女真是明的对手，挂在大明本就不合史）。主力改黑光铠骑兵 = 三千营骑兵。
 * ⚠️ 若主人更想保掷弹兵、去火矛手，把这两行对调即可。
 */
export const MING_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'elite_fire_lancer', count: 2 }, // Row 0 前排火器齐射 = 精锐火矛手 2人（🔴 热兵器只许 2 档）
    { type: 'hei_kuang', count: 4 },         // Row 1 主力·两翼合围 = 黑光铠骑兵 4人
    { type: 'chukonu', count: 3 },           // Row 2 中军后排支援 = 诸葛弩 3人
];

/**
 * 罗马军团·鱼鳞阵（3+4+2）：精锐罗马百夫长(3) + 罗马军团步兵(4) + 掷矛手(2)
 */
export const ROMAN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'elite_centurion', count: 3 }, // Row 0 前卫 = 精锐罗马百夫长 3人
    { type: 'legionary', count: 4 },       // Row 1 中军主力突破 = 罗马军团步兵 4人
    { type: 'skirmisher', count: 2 },      // Row 2 尾收压阵 = 掷矛手 2人
];

/**
 * 波斯阿契美尼德帝国·鹤翼阵（2+4+3）：不死军长矛步兵(2) + 萨珊萨瓦尔铁骑(4) + 不死军复合弓箭手(3)
 */
export const PERSIAN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'immortal', count: 2 },        // Row 0 步兵前锋 = 不死军长矛步兵 2人
    { type: 'savar', count: 4 },           // Row 1 骑兵主力两翼合围 = 萨珊萨瓦尔铁骑 4人
    { type: 'immortal_ranged', count: 3 }, // Row 2 中军后排支援 = 不死军复合弓箭手 3人
];

/**
 * 波兰王国·鹤翼阵（2+4+3）：战锤破甲勇士(2) + 精锐翼骑兵(4) + 劲弩手(3)
 */
export const POLISH_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'obuch', count: 2 },         // Row 0 步兵前锋 = 战锤破甲勇士 2人
    { type: 'winged_hussar', count: 4 }, // Row 1 骑兵主力两翼合围 = 精锐翼骑兵 4人
    { type: 'arbalest', count: 3 },      // Row 2 中军后排支援 = 劲弩手 3人
];

/**
 * 条顿骑士团·鹤翼阵（2+4+3）：精锐条顿武士(2) + 十字军圣殿骑士(4) + 长弓兵(3)
 */
export const TEUTONIC_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'elite_teutonic_knight', count: 2 }, // Row 0 步兵前锋 = 精锐条顿武士 2人
    { type: 'crusader_knight', count: 4 },       // Row 1 骑兵主力两翼合围 = 十字军圣殿骑士 4人
    { type: 'longbowman', count: 3 },            // Row 2 中军后排支援 = 长弓兵 3人
];

/**
 * 拜占庭帝国·鱼鳞阵（3+4+2）：拜占庭圣骑兵(3) + 拜占庭圣骑兵精锐(4) + 复合弓手(2)
 */
export const BYZANTINE_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'cataphract', count: 3 },        // Row 0 前卫 = 拜占庭圣骑兵 3人
    { type: 'elite_cataphract', count: 4 },  // Row 1 中军突破主力 = 拜占庭圣骑兵精锐 4人
    { type: 'composite_bowman', count: 2 },  // Row 2 尾收压阵 = 复合弓手 2人
];

/**
 * 柏柏尔/北非马格里布·三角阵（2+3+4）：萨拉森马穆鲁克(2) + 柏柏尔标枪骑兵(3) + 柏柏尔骆驼弓骑(4)
 */
export const BERBER_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'mameluke', count: 2 },      // Row 0 尖刀先锋 = 萨拉森马穆鲁克 2人
    { type: 'genitour', count: 3 },      // Row 1 冲击中坚 = 柏柏尔标枪骑兵 3人
    { type: 'camel_archer', count: 4 },  // Row 2 底边主力齐射 = 柏柏尔骆驼弓骑 4人
];



/** 秦朝名将 ID 集合 */
export const QIN_DYNASTY_GENERAL_IDS = new Set([
    'qin_simacuo',          // 司马错
    'xin_baiqi',            // 白起
    'ruo_wangjian',         // 王翦
    'baiyang_mengtian',     // 蒙恬
    'wazhai_zhanghan',      // 章邯
    'shangzhou_shangyang',  // 商鞅
    'nanyue_zhaotuo',       // 赵佗
    // 2026-08-18 主人定：秦国以前的武将（商/周/春秋/战国）一律并入秦阵（雁行 4+3+2）
    'shang_fuhao',          // 妇好（商）
    'yin_dixin',            // 子受（商纣）
    'zhou_jifa',            // 姬发（周武王）
    'shen_shenbo',          // 申伯（西周）
    'yong_lujili',          // 庐戢黎（楚）
    'jin_xianzhen',         // 先轸（晋）
    'yangshe_yangshezhi',   // 羊舌职（晋）
    'qi_simarangju',        // 司马穰苴（齐）
    'kong_d_caogui',        // 曹刿（鲁）
    'wu_sunwu',             // 孙武（吴）
    'yue_goujian',          // 勾践（越）
    'mi_chu_xionglv',       // 熊旅（楚庄王）
    'chunshen_huangxie',    // 黄歇（楚春申君）
    'wei_wuqi',             // 吴起（魏）
    'yan_leyi',             // 乐毅（燕）
    'zhao_lianpo',          // 廉颇（赵）
    'liguo_zhaoshe',        // 赵奢（赵）
    'lingqiu_zhaowuling',   // 赵雍（赵武灵王）
    'wuzhou_limu',          // 李牧（赵）
    'jiaodong_tiandan',     // 田单（齐）
    'dongxian_sunbin',      // 孙膑（齐）
    'han_baoyuan',          // 暴鸢（韩）
    'liangshidu_longjia',   // 龙贾（魏）
    'dianguo_zhuangqiao',   // 庄蹻（楚/滇）
    'quanrong_yiquhai',     // 义渠骇（义渠）
    'yun_wuli',             // 吾离（戎）
    'ouyue_zouyao',         // 驺摇（东瓯）
]);

/** 秦朝势力 ID 集合 */
export const QIN_DYNASTY_FACTION_IDS = new Set([
    'qin', 'xin', 'ruo', 'baiyang', 'wazhai', 'shangzhou', 'nanyue'
]);

/** 汉朝名将 ID 集合（含西汉、东汉、蜀汉/季汉） */
export const HAN_DYNASTY_GENERAL_IDS = new Set([
    'han_d_liubang',                // 刘邦
    'xianyu_hanxin',                // 韩信
    'suzhou_huoqubing',             // 霍去病
    'shuofang_weiqing',             // 卫青
    'li_lx_d_liguang',              // 李广
    'huaiyang_zhouyafu',            // 周亚夫
    'yangshao_zhoubo',              // 周勃
    'lanzhou_zhaochongguo',         // 赵充国
    'quli_chentang',                // 陈汤
    'xiyuduhu_banchao',             // 班超
    'jiluo_d_douxian',              // 窦宪
    'lulin_liuxiu',                 // 刘秀
    'you_gengyan',                  // 耿弇
    'jingzhou_gs_huangfusong',      // 皇甫嵩
    'huizhou_zhugeliang',           // 诸葛亮
    'shu_liubei',                   // 刘备
    'chu_guanyu',                   // 关羽
    'langzhou_zhangfei',            // 张飞
    'jingmen_zhaoyun',              // 赵云
    'cangsong_machao',              // 马超
    'qingqiang_jiangwei',           // 姜维
    'dongsheng_weishang',           // 魏尚
    'liu_yingbu',                   // 英布
]);

/** 汉朝势力 ID 集合 */
export const HAN_DYNASTY_FACTION_IDS = new Set([
    'han', 'han_d', 'xianyu', 'suzhou', 'shuofang', 'li_lx_d',
    'huaiyang', 'yangshao', 'lanzhou', 'quli', 'xiyuduhu', 'jiluo_d',
    'lulin', 'you', 'jingzhou_gs', 'huizhou_d', 'shu', 'chu',
    'langzhou', 'jingmen', 'cangsong', 'qingqiang', 'dongsheng', 'liu'
]);

/** 唐朝名将 ID 集合 */
export const TANG_DYNASTY_GENERAL_IDS = new Set([
    'tang_lishimin',                // 李世民
    'liang_d_zhangxun',             // 张巡
    'bing_liji',                    // 李勣
    'hepan_gaoxianzhi',             // 高仙芝
    'anxi_guoxin',                  // 郭昕
    'juandu_peixingjian',           // 裴行俭
    'heyuan_d_heichichangzhi',      // 黑齿常之
    'song2_houjunji',               // 侯君集
    'gaoliang_geshuhan',            // 哥舒翰
    'shazhou_zhangyichao',          // 张议潮
    'pugu_puguhuaien',              // 仆固怀恩
    'zhongshan_yangaoqing',         // 颜杲卿
    'liwang_liguangbi',             // 李光弼
    'yuan_cj_d_lishuo',             // 李愬
    'lingwu_guoziyi',               // 郭子仪
    'pingyuan_yanzhenqing',         // 颜真卿
    'loufan_xuerengui',             // 薛仁贵
    'weihaiwei_sudingfang',         // 苏定方
    'dingxiang_d_lijing',           // 李靖
    'jiashi_wangxuance',            // 王玄策
    'zhuoshi_gaopian',              // 高骈
    'qianzhou_lisheng',             // 李晟
    'shanzhou_wangzhongsi',         // 王忠嗣
    'weizhou_weigao',               // 韦皋
    'wei2_hunjian',                 // 浑瑊
]);

/** 唐朝势力 ID 集合 */
export const TANG_DYNASTY_FACTION_IDS = new Set([
    'tang', 'liang_d', 'bing', 'hepan', 'anxi', 'juandu', 'heyuan_d',
    'song2', 'gaoliang', 'shazhou', 'lingzhou', 'zhongshan', 'liwang',
    'yuan_cj_d', 'xinping', 'pingyuan', 'loufan', 'weihaiwei',
    'dingxiang_d', 'jiashi', 'zhuoshi', 'qianzhou', 'shanzhou', 'weizhou', 'wei2'
]);

/** 宋朝名将 ID 集合 */
export const SONG_DYNASTY_GENERAL_IDS = new Set([
    'sizhou_hanshizhong',           // 韩世忠
    'luoping_zhangshijie',          // 张世杰
    'xiangzhou_lvwenhuan',          // 吕文焕
    'zaoyang_d_menggong',           // 孟珙
    'fengzhou_wujie',               // 吴玠
    'hezhou_wangjian',              // 王坚
    'didao_wangshao',               // 王韶
    'zhai_han_diqing',              // 狄青
    'huan_zhongshidao',             // 种师道
    'yingzhou_d_liuqi',             // 刘锜
    'qing_quduan',                  // 曲端
    'changshan_yangyanzhao',        // 杨延昭
    'heng1_yangye',                 // 杨业
    'tingzhou_d_chenmin',           // 陈敏
    'changshaguo_xinqiji',          // 辛弃疾
    'shenshi_wentianxiang',         // 文天祥
    'yanchuan_d_yuefei',            // 岳飞
    'song_zhaokuangyin',            // 赵匡胤
    'yanzhou_zhongshiheng',         // 种世衡
]);

/** 宋朝势力 ID 集合 */
export const SONG_DYNASTY_FACTION_IDS = new Set([
    'sizhou', 'luoping', 'xiangzhou', 'zaoyang_d', 'fengzhou', 'hezhou',
    'didao', 'zhai_han', 'huan', 'yingzhou_d', 'qing',
    'changshan', 'heng1', 'tingzhou_d', 'changshaguo', 'shenshi',
    'yanchuan_d', 'song', 'yanzhou'
]);

/** 大明名将 ID 集合 */
export const MING_DYNASTY_GENERAL_IDS = new Set([
    'ming_d_zhudi',             // 朱棣
    'pingnan_muying',           // 沐英
    'guizhou_lidingguo',        // 李定国
    'dongshengwei_wangyue',     // 王越
    'jinan_tiexuan',            // 铁铉
    'suzhou_d_shikefa',         // 史可法
    'huai_zhuyuanzhang',        // 朱元璋
    'shanrong_lanyu',           // 蓝玉
    'yi_yuqian',                // 于谦
    'jinzhou_lichengliang',     // 李成梁
    'zu_d_yuanchonghuan',       // 袁崇焕
    'xuan_xuda',                // 徐达
    'linyu_wusangui',           // 吴三桂
    'qi_d_qijiguang',           // 戚继光
    'chizhou_changyuchun',      // 常遇春
    'luming_luxiangsheng',      // 卢象升
    'yansui_wangwei',           // 王威
]);

/** 大明势力 ID 集合 */
export const MING_DYNASTY_FACTION_IDS = new Set([
    'ming_d', 'pingnan', 'guizhou', 'dongshengwei', 'jinan',
    'suzhou_d', 'huai', 'shanrong', 'yi', 'jinzhou', 'zu_d',
    'xuan', 'linyu', 'qi_d', 'chizhou', 'luming', 'yansui'
]);

/** 曹魏名将 ID 集合 */
export const WEI_DYNASTY_GENERAL_IDS = new Set([
    'cao_d_caocao',             // 曹操（谯县）
    'lu_zhangliao',             // 张辽（合肥）
    'wudu_dengai',              // 邓艾（武都）
    'sima_d_simayi',            // 司马懿（获嘉）
    'bozhou_d_yujin',           // 于禁（聊城）
    'guzhu_tianyu',             // 田豫（肥如）
]);

/** 曹魏势力 ID 集合 */
export const WEI_DYNASTY_FACTION_IDS = new Set([
    'cao_d',                    // 曹魏·谯县
    'lu',                       // 合肥·张辽
    'wudu',                     // 武都·邓艾
    'sima_d',                   // 获嘉·司马懿
    'bozhou_d',                 // 聊城·于禁
    'guzhu',                    // 肥如·田豫
]);

/** 判断是否为曹魏武将或势力 */
export function isWeiDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && WEI_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && WEI_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 日本战国名将 ID 集合 */
export const SENGOKU_GENERAL_IDS = new Set([
    'owari_zhitianxinchang',            // 织田信长
    'kai_wutianxinxuan',                // 武田信玄
    'echigo_shangshanqianxin',          // 上杉谦信
    'edo_dechuanjiakang',               // 德川家康
    'hashiba_fengchenxiuji',            // 丰臣秀吉
    'date_d_yidazhengzong',             // 伊达政宗
    'sanada_d_zhentianxingcun',         // 真田幸村
    'sagami_beitiaoshikang',            // 北条氏康
    'chosokabe_changzongwobuyuanqin',   // 长宗我部元亲
    'satsuma_daojinjiajiu',             // 岛津家久
    'aki_maoliyuanjiu',                 // 毛利元就
    'jinchuan_jinchuanyiyuan',          // 今川义元
    'totomi_jiujingzhongci',            // 酒井忠次
    'mino_dagujiji',                    // 大谷吉继
    'aizu_pushengshixiang',             // 蒲生氏乡
    'iga_d_baididanbo',                 // 百地丹波
    'kaga_d_xiajianlailian',            // 下间赖廉
    'otomo_d_lihuadaoxue',              // 立花道雪
    'suwa_d_zoufanglaizhong',           // 诹访赖重
    'shimotsuke_yudougongguanggang',    // 宇都宫广纲
    'izumo_shanzhonglujie',             // 山中鹿介
    'jibei2_qingshuizongzhi',           // 清水宗治
    'kakizaki_liqiqingguang',           // 蛎崎庆广
    'so_zongyizhi',                     // 宗义智
]);

/** 日本战国势力 ID 集合 */
export const SENGOKU_FACTION_IDS = new Set([
    'owari', 'kai', 'echigo', 'edo', 'hashiba', 'date_d', 'sanada_d',
    'sagami', 'chosokabe', 'satsuma', 'aki', 'jinchuan', 'totomi',
    'mino', 'aizu', 'iga_d', 'kaga_d', 'otomo_d', 'suwa_d',
    'shimotsuke', 'izumo', 'jibei2', 'kakizaki', 'so'
]);

/** 罗马帝国名将 ID 集合 */
export const ROMAN_DYNASTY_GENERAL_IDS = new Set([
    'gen_julius_caesar',       // 恺撒
    'gen_scipio',              // 大西庇阿
    'gen_constantine_great',   // 君士坦丁
    'gen_julian_apostate',     // 尤里安
    'gen_clovis_i',            // 克洛维
]);

/** 罗马帝国/罗曼势力 ID 集合 */
export const ROMAN_DYNASTY_FACTION_IDS = new Set([
    'luoma_diguo',  // 罗马帝国
    'gaolu_luoma',  // 高卢罗曼
    'mozeer',       // 摩泽尔（君士坦丁）
    'aersasi',      // 阿尔萨斯（尤里安）
]);


/** 判断是否为秦朝武将或势力 */
export function isQinDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && QIN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && QIN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为汉朝武将或势力 */
export function isHanDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && HAN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && HAN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为唐朝武将或势力 */
export function isTangDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && TANG_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && TANG_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为宋朝武将或势力 */
export function isSongDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && SONG_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && SONG_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为大明武将或势力 */
export function isMingDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && MING_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && MING_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为日本战国武将或势力 */
export function isSengoku(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && SENGOKU_GENERAL_IDS.has(generalId)) return true;
    if (factionId && SENGOKU_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为罗马军团武将或势力 */
export function isRomanDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && ROMAN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && ROMAN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 波斯文化名将 ID 集合（阿契美尼德/萨珊/安息/萨非/米底/萨法尔等） */
export const PERSIAN_DYNASTY_GENERAL_IDS = new Set([
    'aqimeinide_daliushi',      // 大流士一世（波斯波利斯·阿契美尼德帝国）
    'bosi_bolisi_daliushi',     // 大流士（别名）
    'aba_shapuer',              // 沙普尔大帝（尼沙布尔·萨珊波斯帝国）
    'safawei_d_abasi',          // 阿拔斯大帝（伊斯法罕·萨非波斯帝国）
    'safawei_aisimaier',        // 艾斯迈尔/伊斯玛仪一世（加兹温·萨非波斯帝国）
    'delan_sulun',              // 苏伦（法拉·帕提亚安息战神）
    'ansxi_aershake',           // 阿尔沙克一世（尼萨·安息波斯帝国）
    'midi_daiaokaisi',          // 戴奥凯斯（哈马丹·米底王国）
    'ailan_shuteluke',          // 舒特鲁克（苏萨·埃兰古波斯）
    'kalan_suhela',             // 苏赫拉（图斯·萨珊卡伦家族大统帅）
    'xisi_yakubusafaer',        // 雅库布（博斯特·萨法尔波斯王朝）
    'saerbadaer_lazhake',       // 拉扎克（白哈格·萨尔巴达尔起义军）
    'kumisi_aerpu',             // 阿尔普（达姆甘·库米斯）
    'hali_gedaerzi',            // 戈达尔兹（萨拉赫斯·波斯统帅）
    'baha_gaiwamu',             // 盖瓦姆（泰巴德·波斯军团）
]);

/** 波斯文化势力 ID 集合 */
export const PERSIAN_DYNASTY_FACTION_IDS = new Set([
    'aqimeinide',               // 阿契美尼德帝国（波斯波利斯）
    'aba',                      // 萨珊波斯（尼沙布尔）
    'safawei_d',                // 萨非波斯帝国（伊斯法罕）
    'safawei',                  // 萨非帝国（加兹温）
    'delan',                    // 苏伦家族（法拉）
    'ansxi',                    // 安息帝国（尼萨）
    'midi',                     // 米底王国（哈马丹）
    'ailan',                    // 埃兰王国（苏萨）
    'kalan',                    // 卡伦家族（图斯）
    'xisi',                     // 萨法尔王朝（博斯特）
    'saerbadaer',               // 萨尔巴达尔（白哈格）
    'kumisi',                   // 库米斯（达姆甘）
    'hali',                     // 哈利（萨拉赫斯）
    'baha',                     // 巴哈尔兹（泰巴德）
]);

/** 判断是否为波斯文化武将或势力 */
export function isPersianDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && PERSIAN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && PERSIAN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 波兰文化名将 ID 集合（波兰王国 / 立陶宛大公国 / 皮雅斯特等） */
export const POLISH_DYNASTY_GENERAL_IDS = new Set([
    'gen_jogaila',          // 雅盖沃（波兰国王/立陶宛大公，华沙）
    'gen_casimir_great',    // 卡齐米日大帝（皮雅斯特王朝，克拉科夫）
    'gen_przemysl_ii',      // 普热梅斯二世（大波兰公，波兹南）
    'gen_gediminas',        // 格迪米纳斯（立陶宛大公，维尔纽斯）
    'gen_vytautas_great',    // 维托夫特大帝（格伦瓦德之战统帅，格罗德诺）
]);

/** 波兰文化势力 ID 集合 */
export const POLISH_DYNASTY_FACTION_IDS = new Set([
    'bolan',                // 波兰王国（华沙）
    'piyasite',             // 皮雅斯特王朝（克拉科夫）
    'dabolan',              // 大波兰（波兹南）
    'litaowan',             // 立陶宛大公国（维尔纽斯）
    'nieman',               // 涅曼公国（格罗德诺）
]);

/** 判断是否为波兰文化武将或势力 */
export function isPolishDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && POLISH_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && POLISH_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 条顿骑士团/十字军名将 ID 集合 */
export const TEUTONIC_DYNASTY_GENERAL_IDS = new Set([
    'gen_ulrich_jungingen',      // 容金根（条顿骑士团大团长 · 柯尼斯堡）
    'shengdian_qishi_demolai',   // 莫莱（圣殿骑士团大团长 · 阿卡）
    'gen_albert_riga',           // 阿尔伯特（宝剑骑士团创立者 · 里加）
    'gen_prettenberg',           // 普雷特贝格（利沃尼亚骑士团大统领 · 塔林）
]);

/** 条顿骑士团/十字军势力 ID 集合 */
export const TEUTONIC_DYNASTY_FACTION_IDS = new Set([
    'tiaodun_qishi',            // 条顿骑士团（柯尼斯堡）
    'shengdian_qishi',          // 圣殿骑士团（阿卡）
    'baojian_qishi',            // 宝剑骑士团（里加）
    'liwoniya',                 // 利沃尼亚骑士团（塔林）
]);

/** 判断是否为条顿骑士团/十字军武将或势力 */
export function isTeutonicDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && TEUTONIC_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && TEUTONIC_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 拜占庭名将 ID 集合 */
export const BYZANTINE_DYNASTY_GENERAL_IDS = new Set([
    'gen_basil_ii',       // 巴西尔二世（拜占庭帝国 · 君士坦丁堡）
    'maerta_qishi_walaite',     // 瓦莱特（医院骑士团/马耳他）
]);

/** 拜占庭势力 ID 集合 */
export const BYZANTINE_DYNASTY_FACTION_IDS = new Set([
    'baizanting',               // 拜占庭帝国（君士坦丁堡）
    'taolika',                  // 陶里卡/赫尔松涅斯（拜占庭克里米亚军区）
    'teluoyi',                  // 达尔达尼亚（达达尼尔要冲）
    'maerta_qishi',             // 圣约翰/医院骑士团（马耳他）
]);

/** 判断是否为拜占庭武将或势力 */
export function isByzantineDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && BYZANTINE_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && BYZANTINE_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 柏柏尔/北非名将 ID 集合 */
export const BERBER_DYNASTY_GENERAL_IDS = new Set([
    'gen_idris_i',          // 伊德里斯一世（非斯 · yidelisi）
    'gen_tashfin',          // 塔什芬（马拉喀什 · mulabite）
    'gen_yaghmurasen',      // 亚格姆拉森（特莱姆森 · zhayan）
    'gen_hammad',           // 哈马德（布佳亚 · hamade）
    'gen_uqba',             // 奥克巴（凯鲁万 · aguelabu）
    'gen_barbarossa',       // 巴巴罗萨·海雷丁（阿尔及尔 · babali）
    'gen_dragut',           // 德拉古特（的黎波里 · telibolisi）
]);

/** 柏柏尔/北非势力 ID 集合 */
export const BERBER_DYNASTY_FACTION_IDS = new Set([
    'yidelisi',             // 伊德里斯王朝（非斯）
    'mulabite',             // 穆拉比特王朝（马拉喀什）
    'zhayan',               // 扎扬王朝（特莱姆森）
    'hamade',               // 哈马德王朝（布佳亚）
    'aguelabu',             // 阿格拉布王朝（凯鲁万）
    'babali',               // 巴巴里海岸（阿尔及尔）
    'telibolisi',           // 的黎波里塔尼亚（的黎波里）
    'zhibuluotuo',          // 休达/直布罗陀
]);

/** 判断是否为柏柏尔/北非武将或势力 */
export function isBerberDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && BERBER_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && BERBER_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}


/** 势力专属阵型；无则返回 null，由调用方回退文化区 tier */
export function getFactionCompositionSlots(factionId: string, generalId?: string | null): CompositionSlot[] | null {
    // 1. 势力专属覆盖最优先（含支文化细分，如伊贺忍者军团、波斯帝国军团、波兰翼骑兵军团、条顿骑士军团、拜占庭圣骑兵军团、柏柏尔沙漠军团）
    const custom = FACTION_COMPOSITIONS[factionId];
    if (custom) {
        return [...custom.slots];
    }
    // 2. 武将专属判断
    if (generalId) {
        if (QIN_DYNASTY_GENERAL_IDS.has(generalId)) return [...QIN_FACTION_COMPOSITION];
        if (HAN_DYNASTY_GENERAL_IDS.has(generalId)) return [...HAN_FACTION_COMPOSITION];
        if (WEI_DYNASTY_GENERAL_IDS.has(generalId)) return [...WEI_FACTION_COMPOSITION];
        if (TANG_DYNASTY_GENERAL_IDS.has(generalId)) return [...TANG_FACTION_COMPOSITION];
        if (SONG_DYNASTY_GENERAL_IDS.has(generalId)) return [...SONG_FACTION_COMPOSITION];
        if (MING_DYNASTY_GENERAL_IDS.has(generalId)) return [...MING_FACTION_COMPOSITION];
        if (ROMAN_DYNASTY_GENERAL_IDS.has(generalId)) return [...ROMAN_FACTION_COMPOSITION];
        if (PERSIAN_DYNASTY_GENERAL_IDS.has(generalId)) return [...PERSIAN_FACTION_COMPOSITION];
        if (POLISH_DYNASTY_GENERAL_IDS.has(generalId)) return [...POLISH_FACTION_COMPOSITION];
        if (TEUTONIC_DYNASTY_GENERAL_IDS.has(generalId)) return [...TEUTONIC_FACTION_COMPOSITION];
        if (BYZANTINE_DYNASTY_GENERAL_IDS.has(generalId)) return [...BYZANTINE_FACTION_COMPOSITION];
        if (BERBER_DYNASTY_GENERAL_IDS.has(generalId)) return [...BERBER_FACTION_COMPOSITION];
        if (SENGOKU_GENERAL_IDS.has(generalId)) return [...SENGOKU_TIERS[0].slots];
    }
    // 3. 文化区判定
    if (isQinDynasty(factionId)) {
        return [...QIN_FACTION_COMPOSITION];
    }
    if (isHanDynasty(factionId)) {
        return [...HAN_FACTION_COMPOSITION];
    }
    if (isWeiDynasty(factionId)) {
        return [...WEI_FACTION_COMPOSITION];
    }
    if (isTangDynasty(factionId)) {
        return [...TANG_FACTION_COMPOSITION];
    }
    if (isSongDynasty(factionId)) {
        return [...SONG_FACTION_COMPOSITION];
    }
    if (isMingDynasty(factionId)) {
        return [...MING_FACTION_COMPOSITION];
    }
    if (isRomanDynasty(factionId)) {
        return [...ROMAN_FACTION_COMPOSITION];
    }
    if (isPersianDynasty(factionId)) {
        return [...PERSIAN_FACTION_COMPOSITION];
    }
    if (isPolishDynasty(factionId)) {
        return [...POLISH_FACTION_COMPOSITION];
    }
    if (isTeutonicDynasty(factionId)) {
        return [...TEUTONIC_FACTION_COMPOSITION];
    }
    if (isByzantineDynasty(factionId)) {
        return [...BYZANTINE_FACTION_COMPOSITION];
    }
    if (isBerberDynasty(factionId)) {
        return [...BERBER_FACTION_COMPOSITION];
    }
    if (isSengoku(factionId)) {
        return [...SENGOKU_TIERS[0].slots];
    }
    return null;
}

export interface LegionCompositionTarget {
    factionId: string;
    generalId?: string | null;
    cultureRegion: RegionType | null;
    cultureSlots: string[] | null;
    cultureScales: number[] | null;
    legionType: LegionType;
    /** 三值阵型（square 鱼鳞 / triangle 三角 / echelon 雁行）；渲染层据此定布局，不再靠 slots.length 猜 */
    formationMode?: FormationMode | null;
    getTroops(): number;
}

/** 写入军团 cultureSlots / cultureScales / legionType / formationMode（武将与势力专属优先于文化区） */
export function applyLegionCultureComposition(army: LegionCompositionTarget, region?: RegionType): void {
    const isQin = isQinDynasty(army.factionId, army.generalId);
    const isHan = isHanDynasty(army.factionId, army.generalId);
    const isTang = isTangDynasty(army.factionId, army.generalId);
    const isSong = isSongDynasty(army.factionId, army.generalId);
    const isMing = isMingDynasty(army.factionId, army.generalId);
    const isSen = isSengoku(army.factionId, army.generalId);
    const isRom = isRomanDynasty(army.factionId, army.generalId);
    const isPer = isPersianDynasty(army.factionId, army.generalId);
    const isPol = isPolishDynasty(army.factionId, army.generalId);
    const isTeu = isTeutonicDynasty(army.factionId, army.generalId);
    const isByz = isByzantineDynasty(army.factionId, army.generalId);
    const isBer = isBerberDynasty(army.factionId, army.generalId);

    const culture = region ?? army.cultureRegion ?? 'CENTRAL';
    const factionSlots = getFactionCompositionSlots(army.factionId, army.generalId);
    const slots = factionSlots ?? getCultureTier(culture, army.getTroops())?.slots;
    if (!slots) return;

    army.cultureSlots = expandCompositionSlots(slots);
    army.cultureScales = expandCompositionScales(slots);
    army.legionType =
        isQin || isHan || isTang || isSong || isMing || isSen || isRom || isPer || isPol || isTeu || isByz || isBer
            ? 'mixed'
            : getCultureMovementClass(culture) === 'CAVALRY'
              ? 'cavalry'
              : 'mixed';

    // 阵型判定：势力专属覆盖最优先（含支文化细分）→ 鹤翼阵(步骑远) / 鱼鳞阵(2近1远) / 三角阵(骑+弓骑) / 雁行阵(2远1近) → 文化区默认
    const custom = FACTION_COMPOSITIONS[army.factionId];
    if (custom?.formationMode) {
        army.formationMode = custom.formationMode;
    } else if (isQin || isHan || isTang || isSong || isPer || isPol || isTeu || isSen) {
        army.formationMode = 'crane_wing';
    } else if (isRom || isByz || isMing) {
        army.formationMode = 'fish_scale';
    } else if (isBer) {
        army.formationMode = 'triangle';
    } else {
        army.formationMode = inferFormationModeFromSlots(slots)
            ?? getCultureFormationMode(culture);
    }
}

// ============================================================
// 20 文化区阵型（2026-08-18 用户拍板：四个阵型均为 2+3+4 结构，文化主力为 4，远程/弓骑在后排）
// ============================================================

/** 1. 中原 刀剑手+诸葛弩+精锐诸葛弩（三角阵 2+3+4：刀剑手尖刀 + 诸葛弩中坚 + 精锐诸葛弩主力底边） */
export const CENTRAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jian_swordsman', count: 2 }, // Row 0 尖刀先锋 = 刀剑手 2人
            { type: 'chukonu', count: 3 },        // Row 1 齐射中坚 = 诸葛弩 3人
            { type: 'elite_chukonu', count: 4 }   // Row 2 底边主力齐射 = 精锐诸葛弩 4人
        ]
    }
];

/** 2. 北方 辽刀+精锐黑光铠骑兵+诸葛弩（鱼鳞阵 3+4+2：辽刀前卫 + 精锐黑光铠骑兵主力 + 诸葛弩后排支援） */
export const NORTH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'liao_dao', count: 3 },        // Row 0 前卫 = 辽刀 3人
            { type: 'hei_kuang_heavy', count: 4 }, // Row 1 中军突击主力 = 精锐黑光铠骑兵 4骑
            { type: 'chukonu', count: 2 }          // Row 2 尾收支援 = 诸葛弩 2人
        ]
    }
];

/** 3. 东北 铁浮图+精锐铁浮图+钦察（鱼鳞阵 3+4+2：铁浮图前卫 + 精锐铁浮图主力 + 钦察后排支援） */
export const NORTHEAST_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'iron_pagoda', count: 3 },        // Row 0 前卫突破 = 金国铁浮图 3骑
            { type: 'elite_iron_pagoda', count: 4 },  // Row 1 中军主力 = 精锐铁浮图 4骑
            { type: 'kipchak', count: 2 }             // Row 2 尾收支援 = 钦察弓骑 2骑
        ]
    }
];

/** 4. 朝鲜 剑士+黑光铠骑兵+火焰弓箭手（鹤翼阵 2+4+3：剑士步兵前锋 + 黑光铠骑兵主力 + 火焰弓箭手后排） */
export const KOREA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 2 },        // Row 0 步兵前锋 = 剑士 2人
            { type: 'hei_kuang', count: 4 },        // Row 1 骑兵主力两翼合围 = 黑光铠骑兵 4人
            { type: 'fire_archer', count: 3 }       // Row 2 中军后排支援 = 火焰弓箭手 3人
        ]
    }
];

/** 5. 日本 日本武士+精锐武士+藤弓兵（鱼鳞阵 3+4+2：日本武士前卫 + 精锐武士主力突击 + 藤弓兵后排支援） */
export const JAPAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'samurai', count: 3 },          // Row 0 前卫 = 日本武士 3人
            { type: 'samurai_elite', count: 4 },    // Row 1 中军突击主力 = 精锐武士 4人
            { type: 'rattan_archer', count: 2 }     // Row 2 尾收支援 = 藤弓兵 2人
        ]
    }
];

/** 日本战国 忍者+精锐武士+藤弓兵（鹤翼阵 2+4+3：忍者前哨 + 精锐武士两翼合围 + 藤弓兵中军托底） */
export const SENGOKU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'ninja', count: 2 },            // Row 0 前哨 = 忍者 步兵 2人
            { type: 'samurai_elite', count: 4 },    // Row 1 两翼合围主力 = 精锐武士 步兵 4人
            { type: 'rattan_archer', count: 3 }     // Row 2 中军托底 = 藤弓兵 弓手 3人
        ]
    }
];

/** 6. 草原 草原枪兵+蒙古突骑+精锐蒙古突骑（三角阵 2+3+4：草原枪兵尖刀 + 蒙古突骑中坚 + 精锐突骑主力底边） */
export const STEPPE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'steppe_lancer', count: 2 },    // Row 0 尖刀先锋 = 草原枪兵 2人
            { type: 'mangudai', count: 3 },         // Row 1 冲击中坚 = 蒙古突骑 3人
            { type: 'mangudai_elite', count: 4 }    // Row 2 底边主力齐射 = 精锐蒙古突骑 4人
        ]
    }
];

/** 7. 河西 精锐辽刀+黑光铠骑兵+诸葛弩（雁行阵 4+3+2：精锐辽刀宽线主力 + 黑光铠骑兵中坚 + 诸葛弩压阵） */
export const HEXI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_liao_dao', count: 4 }, // Row 0 主力·宽线抗线 = 精锐辽刀 4人
            { type: 'hei_kuang', count: 3 },      // Row 1 中军接应 = 黑光铠骑兵 3骑
            { type: 'chukonu', count: 2 }         // Row 2 压阵远程 = 诸葛弩 2人
        ]
    }
];

/** 8. 川蜀 白羽卫兵+精锐白羽卫兵+诸葛弩（鱼鳞阵 3+4+2：白羽卫兵前卫 + 精锐白羽卫兵突击主力 + 诸葛弩后排支援） */
export const BASHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'white_feather_guard', count: 3 },       // Row 0 前卫 = 白羽卫兵 3人
            { type: 'elite_white_feather_guard', count: 4 }, // Row 1 中军突击主力 = 精锐白羽卫兵 4人
            { type: 'chukonu', count: 2 }                    // Row 2 尾收支援 = 诸葛弩 2人
        ]
    }
];

/** 9. 江南 剑士+火焰弓箭手+精锐火焰弓箭手（三角阵 2+3+4：剑士尖刀 + 火焰弓中坚 + 精锐火焰弓主力底边） */
export const JIANGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 2 },         // Row 0 尖刀先锋 = 剑士 2人
            { type: 'fire_archer', count: 3 },       // Row 1 齐射中坚 = 火焰弓箭手 3人
            { type: 'elite_fire_archer', count: 4 }  // Row 2 底边主力齐射 = 精锐火焰弓箭手 4人
        ]
    }
];

/** 10. 岭南 皮甲战象+藤弓兵+精锐藤弓兵（三角阵 2+3+4：皮甲战象尖刀 + 藤弓兵中坚 + 精锐藤弓兵主力底边） */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'armored_elephant', count: 2 },    // Row 0 尖刀巨兽 = 皮甲战象 2人
            { type: 'rattan_archer', count: 3 },       // Row 1 齐射中坚 = 藤弓兵 3人
            { type: 'rattan_archer_elite', count: 4 }  // Row 2 底边主力齐射 = 精锐藤弓兵 4人
        ]
    }
];

/** 11. 滇缅 东南亚战斗象+步弓手+马来爪刀勇士（三角阵 2+3+4：战斗象尖刀 + 步弓手中坚 + 爪刀勇士主力底边） */
export const DIANQIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'battle_elephant', count: 2 },   // Row 0 尖刀巨兽 = 东南亚战斗象 2人
            { type: 'archer', count: 3 },            // Row 1 散射中坚 = 步弓手 3人
            { type: 'karambit_warrior', count: 4 }   // Row 2 底边主力突击 = 马来爪刀勇士 4人
        ]
    }
];

/** 12. 青藏 答剌罕骑兵+精锐答剌罕骑兵+蒙古突骑（鱼鳞阵 3+4+2：答剌罕前卫 + 精锐答剌罕突击主力 + 蒙古突骑后排支援） */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'tarkan', count: 3 },       // Row 0 前卫 = 答剌罕骑兵 3人
            { type: 'elite_tarkan', count: 4 }, // Row 1 中军突击主力 = 精锐答剌罕骑兵 4人
            { type: 'mangudai', count: 2 }      // Row 2 尾收支援 = 蒙古突骑 2人
        ]
    }
];

/** 13. 中亚 精锐草原枪兵+萨瓦尔+精锐钦察（三角阵 2+3+4：草原枪兵尖刀 + 萨瓦尔铁骑中坚 + 精锐钦察主力底边） */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_steppe_lancer', count: 2 }, // Row 0 尖刀先锋 = 精锐草原枪兵 2人
            { type: 'savar', count: 3 },               // Row 1 冲击中坚 = 萨瓦尔 3人
            { type: 'elite_kipchak', count: 4 }        // Row 2 底边主力齐射 = 精锐钦察 4人
        ]
    }
];

/** 14. 西域 斯基泰斧骑兵+斯基泰骑射手+斯基泰骑射手精锐（三角阵 2+3+4：斧骑兵尖刀 + 骑射手中坚 + 精锐骑射主力底边） */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'scythian_axe_cavalry', count: 2 },       // Row 0 尖刀先锋 = 斯基泰斧骑兵 2人
            { type: 'scythian_horse_archer', count: 3 },      // Row 1 冲击中坚 = 斯基泰骑射手 3人
            { type: 'elite_scythian_horse_archer', count: 4 } // Row 2 底边主力齐射 = 斯基泰骑射手精锐 4人
        ]
    }
];

/** 15. 西亚 东方剑士+重装骑射手+精锐复合弓箭手（雁行阵 4+3+2：东方剑士宽线肉盾主力 + 重装骑射中坚 + 精锐复合弓压阵） */
export const WEST_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_composite_bowman', count: 4 }, // Row 0 主力·宽线齐射 = 精锐复合弓箭手 4人
            { type: 'eastern_swordsman', count: 3 },      // Row 1 中军接应 = 东方剑士 3人（留 3 档补偿，见文件头）
            { type: 'cav_archer_heavy', count: 2 }        // Row 2 压阵骑射 = 重装骑射手 2人
        ]
    }
];

/** 16. 斯拉夫 贵族铁骑+精锐贵族铁骑+复合弓箭手（鹤翼阵 2+4+3：贵族铁骑前锋 + 精锐波雅尔重骑主力 + 复合弓后排） */
export const SLAVIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'boyar', count: 2 },                // Row 0 骑兵前锋 = 贵族铁骑 2骑
            { type: 'elite_boyar', count: 4 },          // Row 1 骑兵主力两翼合围 = 精锐贵族铁骑 4骑
            { type: 'composite_bowman', count: 3 }      // Row 2 中军后排支援 = 复合弓箭手 3人
        ]
    }
];

/** 17. 日耳曼 冠军剑士+游侠+弩手（鹤翼阵 2+4+3：冠军剑士前锋 + 游侠圣骑主力 + 弩手后排） */
export const GERMANIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 2 },   // Row 0 步兵前锋 = 冠军剑士 2人
            { type: 'paladin', count: 4 },    // Row 1 骑兵主力两翼合围 = 游侠 4人
            { type: 'crossbowman', count: 3 } // Row 2 中军后排支援 = 弩手 3人
        ]
    }
];

/** 18. 拉丁 重装长枪兵+重装骑士+劲弩手（鹤翼阵 2+4+3：重装长枪兵前锋 + 重装骑士主力 + 劲弩手后排） */
export const LATIN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_pikeman', count: 2 }, // Row 0 步兵前锋 = 重装长枪兵 2人
            { type: 'knight', count: 4 },        // Row 1 骑兵主力两翼合围 = 重装骑士 4人
            { type: 'arbalest', count: 3 }       // Row 2 中军后排支援 = 劲弩手 3人
        ]
    }
];

/** 19. 希腊 希腊重装步兵+底比斯圣队+色雷斯轻装兵（鱼鳞阵 3+4+2：希腊重装步兵前卫 + 底比斯圣队突破主力 + 色雷斯标枪后排） */
export const GREEK_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hoplite', count: 3 },          // Row 0 前卫 = 希腊重装步兵 3人
            { type: 'sacred_band', count: 4 },      // Row 1 中军突破主力 = 底比斯圣队 4人
            { type: 'thracian_peltast', count: 2 }  // Row 2 尾收支援 = 色雷斯轻装兵 2人
        ]
    }
];

/** 亚历山大·马其顿帝国军团（鹤翼阵 2+4+3：马其顿方阵兵前锋 + 伙伴骑兵主力 + 克里特弓手后排） */
export const ALEXANDER_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'phalangite', count: 2 },         // Row 0 步兵前锋 = 马其顿方阵兵 2人
            { type: 'companion_cavalry', count: 4 },  // Row 1 骑兵主力两翼合围 = 伙伴骑兵 4人
            { type: 'cretan_archer', count: 3 }       // Row 2 中军后排支援 = 克里特弓手 3人
        ]
    }
];

/** 20. 奴儿干 答剌罕骑兵+鲜卑掠骑兵+反曲长弓手（鱼鳞阵 3+4+2：答剌罕骑兵前卫 + 鲜卑掠骑兵突击主力 + 反曲长弓手后排） */
export const NUERGAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'tarkan', count: 2 },           // Row 0 尖刀先锋 = 答剌罕骑兵 2人
            { type: 'recurve_bowman', count: 3 },   // Row 1 中坚步射 = 反曲长弓手 3人
            { type: 'xianbei_raider', count: 4 }    // Row 2 主力·骑射底边 = 鲜卑掠骑兵 4人
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
    NUERGAN:      NUERGAN_TIERS,
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
