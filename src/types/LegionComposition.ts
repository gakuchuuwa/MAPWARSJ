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
            { type: 'pikeman', count: 3 },               // Row 0: 枪步兵
            { type: 'light_riders', count: 1 },          // Row 1 Left: 枪骑兵
            { type: 'tiger_rider', count: 1 },           // Row 1 Center: 将骑兵
            { type: 'light_riders', count: 1 },          // Row 1 Right: 枪骑兵
            { type: 'crossbowman', count: 3 }            // Row 2: 弩步兵
        ]
    }
];

/**
 * 通用兜底编成 —— 没有 cultureSlots 的部队（含玩家单骑，其 cultureRegion 为 null）走这里。
 *
 * 🔴 [2026-09-07 主人定「游戏开始的时候，玩家套用的模式采用近东民兵」]
 *    改前是「剑士×3 / 枪骑+虎骑+枪骑 / 弓手×3」这套杂编，
 *    玩家一开局在长安单骑起步、身无一物，却顶着一支混编精锐的阵容，不合定位；
 *    而且这套正是记忆里「掉回默认集渲染成三国志10的兵」说的那一坨。
 *    现统一为**近东民兵**（levy）：全表最低档的征召步兵，配得上白身起家。
 *    ⚠️ 这是兜底，不是文化军团；文化军团一律走 CULTURE_TIERS_MAP，不受此表影响。
 */
export const GENERIC_MIXED_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'levy', count: 9 }                     // 九格全部 = 近东民兵
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
            { type: 'halberdier', count: 3 },        // Row 0: 步兵
            { type: 'cav_archer', count: 1 },        // Row 1 Left: 弓骑兵
            { type: 'tiger_rider', count: 1 },       // Row 1 Center: 将骑兵
            { type: 'cav_archer', count: 1 },        // Row 1 Right: 弓骑兵
            { type: 'archer', count: 3 }             // Row 2: 弓步兵
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
 * 🔴 [2026-09-08 主人令「好的走A」/ 2026-10-09 主人令「所有战略、战术、所有兵模显示的比例都应该一致」]
 *
 * **战车类「阵型适配」比例 —— 唯一出处（按兵种查表，不再靠编成数据里的 scale 字段）。**
 *
 * 规矩（原文见 `src/config/LegionSpacing.ts`）：战略地图的方阵格距是**常数**（横 46 / 纵 63，不看兵种），
 * 而战车素材帧框远大于格距 —— 所以要压绘制尺寸。**判据（2026-10-09 实测后定）：**
 *
 *      🔴 地图上「连马带车」的整乘，不得矮于一个骑兵  ⇒  适配 = 骑兵图形高(71) ÷ 该支图形高
 *
 * （旧口径是"宽度上限 2 × 46 = 92px、scale = 92 ÷ (move 最宽帧 × 68/64)"。实测它把整车连马一起压到
 *   0.67~0.81 个骑兵高：双轮战车 / 拉塔战车这两族本来就只比骑兵高 1~3%，被压后**比骑马的人还矮三成**，
 *   而 92px 的原意（一对战车各露一半、排面不糊）在它们身上也没换来更清楚的排面 —— 2026-10-09 作废。）
 *
 * 数值按**素材图形高（不透明包围盒）实测**算出：适配 = 骑兵图形高(71) ÷ 该支图形高（四舍五入到两位）。
 *   war_wagon 89 → 0.80 ／ elite_war_wagon 101 → 0.70
 *   war_chariot 73 → 0.97 ／ elite_war_chariot 72 → 0.99 ／ war_chariot_ranged 101 → 0.70
 *   ratha_melee / ratha_ranged / elite_ratha_* 72 → 0.99
 *   hussite_wagon / elite_hussite_wagon 104 → 0.83
 *
 * ⚠️ 为什么放在这张表、而不是各军团编成的 slot.scale 字段：
 *   2026-09-08 那次是把值写进编成数据的；2026-09-14 编制大迁移（新建 level2/level3 军团文件、
 *   砍掉 CultureFormations 4307 行）时这 16 处 scale **全被漏拷**，只剩先秦远程战车一处幸存
 *   —— 战车在地图上重新变成原大、压垮方阵。改成按兵种查表，编成怎么搬都不会再丢。
 *
 * 只有战车类 < 1，其余兵种一律 1.0（含攻城器械：2026-09-09 主人定「素材本身的车身尺寸就是该有的大小」）。
 * 编成里显式写了 `scale` 的 slot 仍以它为准（见 getEffectiveSlotScale）。
 *
 * 验收：`npx tsx scratch/_verify_unit_size_parity.mts`（逐兵种拿真 `_meta.json` 复核本表）。
 */
const CHARIOT_FIT_SCALE: Record<string, number> = {
    war_chariot: 0.97,
    elite_war_chariot: 0.99,
    war_chariot_ranged: 0.70,
    war_wagon: 0.80,
    elite_war_wagon: 0.70,
    ratha_melee: 0.99,
    ratha_ranged: 0.99,
    elite_ratha_melee: 0.99,
    elite_ratha_ranged: 0.99,
    hussite_wagon: 0.83,
    elite_hussite_wagon: 0.83,
};

/** 兵种默认比例：战车类＝阵型适配值（上表），其余一律 1.0。 */
export function getDefaultScaleForUnitType(type: string): number {
    return CHARIOT_FIT_SCALE[type] ?? 1.0;
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
