/**
 * 军团三排的两套排序 + 主将队站位（战略地图方阵与战术模式共用的唯一口径）。
 *
 * 🔴 主人 2026-11-02：
 *   「战象，战车，步兵，骑兵，投掷，弩手，弓手，弓骑，法术，火器。这是占位排序。前面的靠前站」
 *   「法术，战象，战车，火器，骑兵，弓骑，投掷，步兵，弩手，弓手，这是挡位排序。前面的挡位少」
 * 🔴 主人 2026-11-04：「战略地图上主将和阵型的位置请和战术一致。主将在2档之间。」
 *
 * - 占位排序：三排从前往后按此表摆（slots[0] 前排 → slots[2] 后排）。
 * - 档位排序：三排各拿几档（几队）。表里越靠前档越少：排第一的拿 2 档，其次 3 档，最后 4 档。
 * - 主将队（第 10 队）：站在「2 档那一排」的两队正中；方阵 3-3-3 没有 2 档排，站前排正中再往前（矛头）。
 */
import { WAR_TYPES } from '../data/WarTypes';
import type { CompositionSlot } from './LegionComposition';
import type { FormationMode } from './CultureFormations';

export type LegionRowClass =
    | '战象' | '战车' | '步兵' | '骑兵' | '投掷' | '弩手' | '弓手' | '弓骑' | '法术' | '火器';

/** 占位排序：越靠前越站前排 */
export const ROW_PLACEMENT_ORDER: readonly LegionRowClass[] =
    ['战象', '战车', '步兵', '骑兵', '投掷', '弩手', '弓手', '弓骑', '法术', '火器'];

/** 档位排序：越靠前档越少（第一拿 2 档，最后拿 4 档） */
export const ROW_TIER_COUNT_ORDER: readonly LegionRowClass[] =
    ['法术', '战象', '战车', '火器', '骑兵', '弓骑', '投掷', '步兵', '弩手', '弓手'];

const SPELL = new Set(['monk', 'priest', 'priestess', 'pagan_priest', 'missionary', 'warrior_priest']);
const GUNPOWDER = new Set(['hand_cannoneer', 'janissary', 'elite_janissary', 'royal_janissary', 'grenadier', 'conquistador', 'elite_conquistador', 'organ_gun', 'elite_organ_gun', 'bombard_cannon', 'rocket_cart', 'heavy_rocket_cart', 'houfnice', 'flamethrower']);
const THROW = /skirmisher|peltast|sling|throwing_axeman|chakram|gbeto|javelin/;
const CROSSBOW = /crossbow|arbalest|gastraphetes|chukonu|archer_of_the_eyes/;
const BOW = /archer|bowman|longbow|recurve|laminated/;

/** 兵种归入十类之一（与 2026-11-02 两次落库所用判据一致） */
export function rowClassOf(unitKey: string): LegionRowClass {
    const t = unitKey;
    if (t.includes('elephant')) return '战象';
    if (t.includes('chariot') || t.includes('ratha') || t.includes('wagon')) return '战车';
    if (SPELL.has(t)) return '法术';
    if (GUNPOWDER.has(t)) return '火器';
    const w = (WAR_TYPES as Record<string, { cls?: string; rng?: number }>)[t];
    const cls = w?.cls ?? 'melee';
    const rng = w?.rng ?? 0;
    if (cls === 'cav') return rng >= 100 ? '弓骑' : '骑兵';
    if (THROW.test(t)) return '投掷';
    if (CROSSBOW.test(t)) return '弩手';
    if (BOW.test(t)) return '弓手';
    return cls === 'ranged' ? '弓手' : '步兵';
}

/** 档数模式 → 阵型（七阵型各排人数互不相同，一一对应） */
const PATTERN_TO_FORMATION: Readonly<Record<string, FormationMode>> = {
    '2-3-4': 'triangle', '2-4-3': 'crane_wing', '4-3-2': 'echelon',
    '4-2-3': 'balance_yoke', '3-4-2': 'fish_scale', '3-2-4': 'crescent', '3-3-3': 'square',
};

/**
 * 按两套排序给三排定位、定档：返回重排后的 slots 与对应阵型。
 * 同类兵种并列时保持原先后。不是 3 排的编制原样返回（formationMode = null）。
 */
export function arrangeLegionRows(slots: readonly CompositionSlot[]): { slots: CompositionSlot[]; formationMode: FormationMode | null } {
    if (slots.length !== 3) return { slots: slots.map((s) => ({ ...s })), formationMode: null };
    const rows = slots.map((s, i) => ({ s, i, cls: rowClassOf(s.type) }));
    const byTier = [...rows].sort((a, b) =>
        ROW_TIER_COUNT_ORDER.indexOf(a.cls) - ROW_TIER_COUNT_ORDER.indexOf(b.cls) || a.i - b.i);
    const count = new Map<number, number>();
    byTier.forEach((r, k) => count.set(r.i, k + 2));   // 2 / 3 / 4
    const byPlace = [...rows].sort((a, b) =>
        ROW_PLACEMENT_ORDER.indexOf(a.cls) - ROW_PLACEMENT_ORDER.indexOf(b.cls) || a.i - b.i);
    const out = byPlace.map((r) => ({ ...r.s, count: count.get(r.i)! }));
    return { slots: out, formationMode: PATTERN_TO_FORMATION[out.map((s) => s.count).join('-')] ?? null };
}

/** 七阵型各排格位数（唯一权威；CultureFormations 原样转出）。与 LegionPhalanxDrawer 的 *_9_LAYOUT、战术 LAYOUT 一一对应。
 *  🔴 渲染层按扁平 index 0..8 把 cultureSlots 填进布局表第 i 个格位 —— slots 自身不带分排信息，
 *  分排边界完全由阵型决定。所以 slots 的分组数必须与本表逐项相等，否则兵种跨排错位。
 *  （放在本文件而非 CultureFormations：本文件只依赖 WarTypes，渲染表在模块加载时就要读它，避开循环引用。） */
export const FORMATION_ROW_COUNTS: Readonly<Record<FormationMode, readonly [number, number, number]>> = {
    triangle:     [2, 3, 4],
    echelon:      [4, 3, 2],
    fish_scale:   [3, 4, 2],
    crane_wing:   [2, 4, 3],
    crescent:     [3, 2, 4],
    balance_yoke: [4, 2, 3],
    square:       [3, 3, 3],
};

/**
 * 主将队站在哪一排：「2 档那一排」的下标（0 前 / 1 中 / 2 后）；
 * 方阵 3-3-3 没有 2 档排 → -1（前排正中再往前一排，全阵矛头）。
 */
export function commanderRowOf(mode: FormationMode): -1 | 0 | 1 | 2 {
    const i = (FORMATION_ROW_COUNTS[mode] ?? FORMATION_ROW_COUNTS.square).indexOf(2);
    return i < 0 ? -1 : (i as 0 | 1 | 2);
}
