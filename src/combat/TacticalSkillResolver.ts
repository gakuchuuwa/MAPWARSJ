/**
 * 战术技 v1：条件判定与效果解析（数据驱动入口）
 * 战斗挂钩分阶段接入 GeneralSkillCombat / BattleField；本模块不直接改战斗结果。
 */
import type { BattleType } from './CombatSystem';
import type { LandTerrainKind } from '../world/land-sea';
import {
    getTacticalSkillEntry,
    getTacticalSkillEntryForGeneral,
    TACTICAL_SKILL_ENTRIES_V1,
    type TacticalBaseEffect,
    type TacticalConditionContext,
    type TacticalSkillCondition,
    type TacticalSkillEntry,
    type TacticalSkillPhase,
} from '../data/TacticalSkillCatalog';
import { COMEBACK_TROOP_THRESHOLD } from './TacticalConstants';
import { GameConfig, rollCombatLuckMultiplierInRange, LUCK_ABS_MIN, LUCK_ABS_MAX } from '../config/GameConfig';

export type { TacticalConditionContext, TacticalSkillEntry, TacticalBaseEffect, TacticalSkillPhase };

/** 构建条件上下文（调用方在战斗开局填入实测值） */
export function buildTacticalConditionContext(params: {
    battleType: BattleType;
    terrain: LandTerrainKind | null;
    selfTroops: number;
    enemyTroops: number;
    selfInitialTroops: number;
    enemyInitialTroops: number;
    selfIsAttacker: boolean;
    selfHasFamousGeneral?: boolean;
    enemyHasFamousGeneral?: boolean;
    selfDifferentCultureFromEnemy?: boolean;
    selfHasEliteLegion?: boolean;
    isFirstSortieSinceDepart?: boolean;
}): TacticalConditionContext {
    const selfInitial = Math.max(1, params.selfInitialTroops);
    const inComeback = params.selfTroops <= selfInitial * COMEBACK_TROOP_THRESHOLD;
    return {
        battleType: params.battleType,
        terrain: params.terrain,
        selfTroops: params.selfTroops,
        enemyTroops: params.enemyTroops,
        selfInitialTroops: params.selfInitialTroops,
        enemyInitialTroops: params.enemyInitialTroops,
        selfIsAttacker: params.selfIsAttacker,
        selfHasFamousGeneral: params.selfHasFamousGeneral ?? false,
        enemyHasFamousGeneral: params.enemyHasFamousGeneral ?? false,
        selfDifferentCultureFromEnemy: params.selfDifferentCultureFromEnemy ?? false,
        selfHasEliteLegion: params.selfHasEliteLegion ?? false,
        isFirstSortieSinceDepart: params.isFirstSortieSinceDepart ?? false,
        sideInComeback: inComeback,
    };
}

/** 单条技能条件是否满足 */
export function evaluateTacticalCondition(
    condition: TacticalSkillCondition,
    ctx: TacticalConditionContext,
    entry?: TacticalSkillEntry,
): boolean {
    switch (condition) {
        case 'always':
            return true;
        case 'terrain_mountain':
            return ctx.terrain === 'mountain';
        case 'terrain_plain':
            return ctx.terrain === 'plain';
        case 'terrain_sea':
            return ctx.terrain === 'sea';
        case 'battle_siege_attacker':
            return ctx.battleType === 'siege' && ctx.selfIsAttacker;
        case 'battle_siege_defender':
            return ctx.battleType === 'siege' && !ctx.selfIsAttacker;
        case 'battle_field':
            // 【2026-07-03 主人定】游戏中野战稀少，绝大多数战斗是军团攻打据点（攻城）。
            // 若「野战加成」技只在野战触发，攻城时全废 → 辜负名将（如原野交锋@成吉思汗/努尔哈赤）。
            // 故引擎语义统一：野战技一律按【进攻方加成】结算——攻城/野战只要我方是进攻方即触发，
            // 仅守城方不吃。技能描述仍保留「野战」历史意象（原野争锋），实际战斗按进攻加成生效。
            return ctx.selfIsAttacker;
        case 'ratio_underdog':
            return ctx.selfTroops < ctx.enemyTroops;
        case 'self_troops_reach_ten_thousand':
            // 满万无敌（女真兵若满万则不可敌）：己方兵力达到满万（≥10000）即触发。
            // 阈值硬编码 10000，绝不读 entry.magnitude —— 避免 magnitude 既作战力又作阈值的耦合坑。
            return ctx.selfTroops >= 10000;
        case 'enemy_different_culture':
            return ctx.selfDifferentCultureFromEnemy;
        case 'enemy_famous_general':
            return ctx.enemyHasFamousGeneral;
        case 'side_comeback':
            return ctx.sideInComeback;
        case 'enemy_troops_below_pct':
            return ctx.enemyInitialTroops > 0
                && ctx.enemyTroops / ctx.enemyInitialTroops < 0.2;
        case 'self_troops_below_enemy_pct':
            return ctx.enemyTroops > 0
                && ctx.selfTroops / ctx.enemyTroops < (entry?.magnitude ?? 0.3);
        case 'lose_as_underdog':
            // 以少打多而败：判据为【开战初始兵力比】，绝不用战后残兵。
            // 战后败方已清零 → selfTroops≈0 恒 <enemyTroops，会把条件技退化成无条件。
            return ctx.selfInitialTroops < ctx.enemyInitialTroops;
        case 'has_elite_legion':
            return ctx.selfHasEliteLegion;
        case 'first_sortie':
            return ctx.isFirstSortieSinceDepart;
        case 'siege_attacker_on_water':
            return ctx.battleType === 'siege' && ctx.selfIsAttacker && ctx.terrain === 'sea';
        default:
            return false;
    }
}

/** 技能在本场是否应生效（条件 + 引擎状态非阻塞） */
export function isTacticalSkillActive(
    entry: TacticalSkillEntry,
    ctx: TacticalConditionContext,
): boolean {
    return evaluateTacticalCondition(entry.condition, ctx, entry);
}

/** 按结算时点筛技能 */
export function filterTacticalSkillsByPhase(
    skillIds: string[],
    phase: TacticalSkillPhase,
    ctx: TacticalConditionContext,
): TacticalSkillEntry[] {
    const out: TacticalSkillEntry[] = [];
    for (const id of skillIds) {
        const entry = getTacticalSkillEntry(id);
        if (!entry || entry.phase !== phase) continue;
        if (!isTacticalSkillActive(entry, ctx)) continue;
        out.push(entry);
    }
    return out;
}

/** 武将档案 tacticalSkillId → v1 条目（兼容 tac_01 等旧 ID） */
export function resolveGeneralTacticalEntry(tacticalSkillId: string): TacticalSkillEntry | null {
    return getTacticalSkillEntryForGeneral(tacticalSkillId);
}

/** 效果是否已在旧战斗路径实现（迁移清单） */
export function isTacticalEffectImplemented(effect: TacticalBaseEffect): boolean {
    switch (effect) {
        case 'ally_power_mult':
        case 'recompute_comeback':
        case 'enemy_sub_troops_opening':
        case 'ally_add_troops_opening':
        case 'dual_sub_troops_opening':
        case 'ally_add_troops_comeback':
        case 'luck_variance_self':
        case 'luck_variance_enemy':
        case 'luck_lock_self':
        // ── 战损系（Step2 已接 BattleField update/resolve）──
        case 'win_casualty_reduction':
        case 'elite_casualty_reduction':
        case 'post_recovery_rate':
        case 'lose_enemy_casualty_boost':
        case 'lose_zero_enemy_recovery':
        // ── 对抗系（已接 applySkillCountersToUnits + 开局削兵对抗）──
        case 'negate_enemy_skill':
        case 'partial_negate_enemy_skill':
        case 'steal_enemy_skill':
        case 'reflect_enemy_opening_cut':
        case 'nullify_enemy_opening_cut':
        // ── 士气系（已接 first_sortie 桥接 + 门控）──
        case 'first_sortie_power_mult':
        case 'first_sortie_comeback_mult':
            return true;
        case 'cancel_enemy_terrain_buff':
        case 'halve_enemy_terrain_buff':
            return true;
        default:
            return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 战损系解析（纯逻辑；由 BattleField.update / resolve 调用施加）
//
// 统一货币口径：战损系不改胜率，只改「打完还剩多少兵」= 跟随军团存活率。
// 语义单一真理源集中在此，避免 BattleField 里散落魔法数。
//
// ── Step 2 引擎接线契约（三条定死规则，接 BattleField 时必须遵守）──
//  【规则1·每侧一将一技】NvN 一侧可能多个带将军团，但沿用引擎既有
//     findEligibleGeneralUnit：每侧只取第一个合格将的技。下列数组接口
//     只作「宽容入参」，不授权把整侧技全塞进来叠乘（否则 0.6×0.5×0.2=84% 减免）。
//  【规则2·减损跟随强弱重算链】减损值本身开战锁死（不逐帧重算，穷寇勿迫等
//     条件在开战判定一次），但「哪侧是强方」会在 refreshPredictedSidesFromTotals
//     翻转 → 两侧各缓存一个减损值，强方取自己那侧，
//     翻盘换边时跟着换，绝不张冠李戴。
//  【规则3·战后结算顺序】BattleField.resolve 必须按此序，顺序错会静默削弱咬人：
//     ① 斩草除根：败方持技 → 胜方恢复率归零
//     ② 恢复：基于本场战损 × 恢复率（取最大值规则）
//     ③ 咬人：胜方本场战损 × mult 追加扣兵
//     ④ 胜方保底：硬断言胜方存活 ≥ 10% 初始兵（防败方咬穿）
// ─────────────────────────────────────────────────────────────

const clamp01 = (v: number, hi = 1): number => Math.max(0, Math.min(hi, v));

/** 战中被动减损结果（施加于该侧作为胜方/强方时的战损） */
export interface MidBattleCasualtyReduction {
    /** 战损减免比例 0..0.9（1 - keep）；BattleField 用它抬高强方存活地板 */
    lossReduction: number;
    /** 生效技（UI / 日志 / 播报） */
    entries: TacticalSkillEntry[];
}

/**
 * 战中减损：`win_casualty_reduction`（游刃有余/兵不血刃/众志成城/穷寇勿迫）
 *   + `elite_casualty_reduction`（如臂使指）。
 * 只在该侧为（预判）胜方/强方时，由 BattleField 抬高其存活地板。
 * 多技相乘合并（引擎实际一侧仅 1 名合格将，通常单元素）。
 */
export function resolveMidBattleCasualtyReduction(
    skillIds: (string | undefined | null)[],
    ctx: TacticalConditionContext,
): MidBattleCasualtyReduction {
    let keep = 1;
    const entries: TacticalSkillEntry[] = [];
    for (const id of skillIds) {
        if (!id) continue;
        const entry = resolveGeneralTacticalEntry(id);
        if (!entry) continue;
        if (
            entry.baseEffect !== 'win_casualty_reduction'
            && entry.baseEffect !== 'elite_casualty_reduction'
        ) continue;
        if (!isTacticalSkillActive(entry, ctx)) continue;
        keep *= (1 - clamp01(entry.magnitude, 0.9));
        entries.push(entry);
    }
    return { lossReduction: 1 - keep, entries };
}

/**
 * 战后恢复率：`post_recovery_rate`（休养生息 0.5 / 爱兵如子 0.7）。
 * 胜方持有则用技的 magnitude 覆盖基础恢复率；多技取最大；无则返回 baseRate。
 */
export function resolvePostBattleRecoveryRate(
    winnerSkillIds: (string | undefined | null)[],
    ctx: TacticalConditionContext,
    baseRate: number,
): { rate: number; entry?: TacticalSkillEntry } {
    let rate = baseRate;
    let entry: TacticalSkillEntry | undefined;
    for (const id of winnerSkillIds) {
        if (!id) continue;
        const e = resolveGeneralTacticalEntry(id);
        if (!e || e.baseEffect !== 'post_recovery_rate') continue;
        if (!isTacticalSkillActive(e, ctx)) continue;
        if (e.magnitude > rate) {
            rate = e.magnitude;
            entry = e;
        }
    }
    return { rate: clamp01(rate), entry };
}

/**
 * 败方咬人：`lose_enemy_casualty_boost`（困兽犹斗 / 宁为玉碎 / 虽败犹荣）。
 * 语义统一 = 「胜方本场战损的最终倍率」（>1 才有意义）。
 *   困兽犹斗 1.5（胜方战损×1.5）、宁为玉碎 2.0、虽败犹荣 2.0（以少败）。
 * 由 BattleField.resolve 在败方持技且条件满足时，对胜方追加扣兵。
 * ctx 应为「败方视角」（selfTroops = 败方兵）。多技取最大倍率。
 */
export function resolveLoserBiteWinnerLossMult(
    loserSkillIds: (string | undefined | null)[],
    loserCtx: TacticalConditionContext,
): { mult: number; entry?: TacticalSkillEntry } {
    let mult = 1;
    let entry: TacticalSkillEntry | undefined;
    for (const id of loserSkillIds) {
        if (!id) continue;
        const e = resolveGeneralTacticalEntry(id);
        if (!e || e.baseEffect !== 'lose_enemy_casualty_boost') continue;
        if (!isTacticalSkillActive(e, loserCtx)) continue;
        if (e.magnitude > mult) {
            mult = e.magnitude;
            entry = e;
        }
    }
    return { mult, entry };
}

/**
 * 斩草除根：`lose_zero_enemy_recovery`（斩草除根）。
 * 败方持有 → 胜方战后恢复率归零。ctx 为败方视角。
 */
export function resolveWinnerRecoveryBlockedByLoser(
    loserSkillIds: (string | undefined | null)[],
    loserCtx: TacticalConditionContext,
): { blocked: boolean; entry?: TacticalSkillEntry } {
    for (const id of loserSkillIds) {
        if (!id) continue;
        const e = resolveGeneralTacticalEntry(id);
        if (!e || e.baseEffect !== 'lose_zero_enemy_recovery') continue;
        if (!isTacticalSkillActive(e, loserCtx)) continue;
        return { blocked: true, entry: e };
    }
    return { blocked: false };
}

// ─────────────────────────────────────────────────────────────
// 兵力系解析（开局 pre_opening_troops；由 GeneralSkillCombat / combat-model 调用）
// ─────────────────────────────────────────────────────────────

/** 开局兵力技解析结果（一侧一将一技；条件不满足时各 magnitude 为 0） */
export interface OpeningTroopEffect {
    /** 削敌比例（作用于敌方） */
    enemyCutMagnitude: number;
    /** 削己比例（肉薄骨并等双向削兵） */
    selfCutMagnitude: number;
    /** 增己比例（重整旗鼓等） */
    allyAddMagnitude: number;
    entry?: TacticalSkillEntry;
}

/**
 * 开局兵力技：enemy_sub / ally_add / dual_sub（phase=pre_opening_troops）。
 * 对抗系修正（空城/诱敌）由调用方在 enemyCut 施加前经 resolveOpeningTroopCutCounter 处理。
 */
export function resolveOpeningTroopEffect(
    skillId: string | undefined | null,
    ctx: TacticalConditionContext,
): OpeningTroopEffect {
    const empty: OpeningTroopEffect = {
        enemyCutMagnitude: 0,
        selfCutMagnitude: 0,
        allyAddMagnitude: 0,
    };
    if (!skillId) return empty;
    const entry = resolveGeneralTacticalEntry(skillId);
    if (!entry || entry.phase !== 'pre_opening_troops') return empty;
    if (!isTacticalSkillActive(entry, ctx)) return empty;
    switch (entry.baseEffect) {
        case 'enemy_sub_troops_opening':
            return { ...empty, enemyCutMagnitude: entry.magnitude, entry };
        case 'ally_add_troops_opening':
            return { ...empty, allyAddMagnitude: entry.magnitude, entry };
        case 'dual_sub_troops_opening':
            return {
                enemyCutMagnitude: entry.magnitude,
                selfCutMagnitude: entry.magnitude,
                allyAddMagnitude: 0,
                entry,
            };
        default:
            return empty;
    }
}

// ─────────────────────────────────────────────────────────────
// 对抗系解析（A/B 层：作用对象具体、量纲单一，先接开局阶段）
//   A 开局减兵对抗：#45 诱敌深入(reflect) / #48 空城退敌(nullify)
//   B 地形对抗：    #46 暗度陈仓(cancel) / #47 声东击西(halve)
//   C 通用否决/夺取(#42/43/44) 未纳入本组（多量纲，另行定案）。
// 全部纯函数，供 combat-model 与引擎共用，保证模型/引擎逻辑单一真理。
// ─────────────────────────────────────────────────────────────

/**
 * 开局减兵对抗：我方（被减方）持 nullify(空城) / reflect(诱敌) 时，
 * 修正敌方开局减兵技（先声夺人等 enemy_sub_troops_opening）对我方的实际效果。
 * @param selfSkillId       我方（被减方）战术技 id
 * @param enemyCutMagnitude 敌方开局减兵 magnitude（作用于我方，>0）
 * @param selfCtx           我方视角 ctx（判 self_troops_below_enemy_pct / battle_siege_defender）
 * @returns selfCutMagnitude 我方实际被减比例；reflectBackMagnitude 反弹给敌方的减兵比例
 */
export function resolveOpeningTroopCutCounter(
    selfSkillId: string | undefined | null,
    enemyCutMagnitude: number,
    selfCtx: TacticalConditionContext,
): { selfCutMagnitude: number; reflectBackMagnitude: number; entry?: TacticalSkillEntry } {
    if (enemyCutMagnitude <= 0) return { selfCutMagnitude: 0, reflectBackMagnitude: 0 };
    const e = selfSkillId ? resolveGeneralTacticalEntry(selfSkillId) : null;
    if (!e || !isTacticalSkillActive(e, selfCtx)) {
        return { selfCutMagnitude: enemyCutMagnitude, reflectBackMagnitude: 0 };
    }
    if (e.baseEffect === 'nullify_enemy_opening_cut') {
        return { selfCutMagnitude: 0, reflectBackMagnitude: 0, entry: e };
    }
    if (e.baseEffect === 'reflect_enemy_opening_cut') {
        return { selfCutMagnitude: 0, reflectBackMagnitude: enemyCutMagnitude, entry: e };
    }
    return { selfCutMagnitude: enemyCutMagnitude, reflectBackMagnitude: 0 };
}

/**
 * 地形对抗：我方持 cancel(暗度陈仓) / halve(声东击西) 时，
 * 修正敌方地形增益 g(>1)。cancel→1（取消增益）；halve→增益减半。
 * 靶子含：退役战略地形乘区 + v1 战术地形技（ts_002~004 等 ally_mult_1_2+terrain_*，见 applyOpeningTacticalToRolls）。
 */
export function resolveEnemyTerrainBuffCounter(
    selfSkillId: string | undefined | null,
    enemyTerrainMult: number,
    selfCtx: TacticalConditionContext,
): { adjustedMult: number; entry?: TacticalSkillEntry } {
    if (enemyTerrainMult <= 1) return { adjustedMult: enemyTerrainMult };
    const e = selfSkillId ? resolveGeneralTacticalEntry(selfSkillId) : null;
    if (!e || !isTacticalSkillActive(e, selfCtx)) return { adjustedMult: enemyTerrainMult };
    if (e.baseEffect === 'cancel_enemy_terrain_buff') {
        return { adjustedMult: 1, entry: e };
    }
    if (e.baseEffect === 'halve_enemy_terrain_buff') {
        return { adjustedMult: 1 + (enemyTerrainMult - 1) * 0.5, entry: e };
    }
    return { adjustedMult: enemyTerrainMult };
}

/** 对手视角翻转（评估扰敌技条件用） */
export function invertTacticalConditionContext(
    ctx: TacticalConditionContext,
): TacticalConditionContext {
    const enemyInComeback =
        ctx.enemyInitialTroops > 0
        && ctx.enemyTroops <= ctx.enemyInitialTroops * COMEBACK_TROOP_THRESHOLD;
    return {
        battleType: ctx.battleType,
        terrain: ctx.terrain,
        selfTroops: ctx.enemyTroops,
        enemyTroops: ctx.selfTroops,
        selfInitialTroops: ctx.enemyInitialTroops,
        enemyInitialTroops: ctx.selfInitialTroops,
        selfIsAttacker: !ctx.selfIsAttacker,
        selfHasFamousGeneral: ctx.enemyHasFamousGeneral,
        enemyHasFamousGeneral: ctx.selfHasFamousGeneral,
        selfDifferentCultureFromEnemy: ctx.selfDifferentCultureFromEnemy,
        selfHasEliteLegion: false,
        isFirstSortieSinceDepart: ctx.isFirstSortieSinceDepart,
        sideInComeback: enemyInComeback,
    };
}

export interface OpeningLuckResolveResult {
    multiplier: number;
    /** 己方命运技（锁死 / 方差） */
    appliedSelfEntry?: TacticalSkillEntry;
    /** 对手扰敌技（风声鹤唳，作用于己方掷点） */
    appliedEnemyPressureEntry?: TacticalSkillEntry;
}

function isOpeningFateLuckEntry(entry: TacticalSkillEntry | null): entry is TacticalSkillEntry {
    if (!entry || entry.phase !== 'opening_roll') return false;
    return entry.baseEffect === 'luck_variance_self'
        || entry.baseEffect === 'luck_lock_self'
        || entry.baseEffect === 'luck_variance_enemy';
}

/**
 * 开战 luck 掷点：锁死 > 己方方差 > 对手扰敌 > 默认 [0.9,1.1]
 * 仅评估 opening_roll 命运系；强化/兵力系由其他路径处理。
 */
export function resolveOpeningLuckMultiplier(
    ctx: TacticalConditionContext,
    selfEntry: TacticalSkillEntry | null,
    opponentEntry: TacticalSkillEntry | null,
): OpeningLuckResolveResult {
    const { LUCK_MIN, LUCK_MAX } = GameConfig.COMBAT;
    const defaultRoll = () => LUCK_MIN + Math.random() * (LUCK_MAX - LUCK_MIN);

    if (
        selfEntry
        && selfEntry.baseEffect === 'luck_lock_self'
        && isTacticalSkillActive(selfEntry, ctx)
    ) {
        const locked = selfEntry.magnitude ?? 1.0;
        return {
            multiplier: Math.max(LUCK_ABS_MIN, Math.min(LUCK_ABS_MAX, locked)),
            appliedSelfEntry: selfEntry,
        };
    }

    if (
        selfEntry
        && selfEntry.baseEffect === 'luck_variance_self'
        && isTacticalSkillActive(selfEntry, ctx)
    ) {
        const lo = selfEntry.luckMin ?? LUCK_MIN;
        const hi = selfEntry.luckMax ?? LUCK_MAX;
        return {
            multiplier: rollCombatLuckMultiplierInRange(lo, hi),
            appliedSelfEntry: selfEntry,
        };
    }

    const oppCtx = invertTacticalConditionContext(ctx);
    if (
        opponentEntry
        && opponentEntry.baseEffect === 'luck_variance_enemy'
        && isTacticalSkillActive(opponentEntry, oppCtx)
    ) {
        const lo = opponentEntry.luckMin ?? LUCK_MIN;
        const hi = opponentEntry.luckMax ?? LUCK_MAX;
        return {
            multiplier: rollCombatLuckMultiplierInRange(lo, hi),
            appliedEnemyPressureEntry: opponentEntry,
        };
    }

    return { multiplier: defaultRoll() };
}

/** 从档案 tacticalSkillId 取开战命运技条目（非命运技返回 null） */
export function resolveOpeningFateEntry(
    tacticalSkillId: string | undefined,
): TacticalSkillEntry | null {
    if (!tacticalSkillId) return null;
    const entry = resolveGeneralTacticalEntry(tacticalSkillId);
    return isOpeningFateLuckEntry(entry) ? entry : null;
}

/** 统计 v1 表引擎就绪度（审计 / CI）。bySeries 保留仅为兼容旧审计输出，设计分类以三势六计为准。 */
export function auditTacticalSkillEngineReadiness(): {
    total: number;
    ready: number;
    hook: number;
    newEffect: number;
    bySeries: Record<string, number>;
} {
    let ready = 0;
    let hook = 0;
    let newEffect = 0;
    const bySeries: Record<string, number> = {};
    for (const e of TACTICAL_SKILL_ENTRIES_V1) {
        bySeries[e.series] = (bySeries[e.series] ?? 0) + 1;
        if (e.engineStatus === 'ready') ready++;
        else if (e.engineStatus === 'hook') hook++;
        else newEffect++;
    }
    return {
        total: TACTICAL_SKILL_ENTRIES_V1.length,
        ready,
        hook,
        newEffect,
        bySeries,
    };
}


/**
 * 战前判定：三类效果的 magnitude 一律读作【触发概率】（2026-07-13 定，修复 negate 无视 magnitude 必否决）：
 *   negate_enemy_skill  按 magnitude 概率否决（料敌机先 mag=1 → 100%；反戈一击 mag=0.25 → 25%）
 *   partial_negate      按 magnitude 概率完全否决（将计就计 0.7）
 *   steal               按 magnitude 概率夺取为己用，失败仅否决（以子之矛 0.5；全目录封顶 0.5，不设 100% 夺取）
 */
export function resolveSkillCountersForSide(
    selfSkillId: string | undefined | null,
    selfCtx: TacticalConditionContext
): { isNegated: boolean; isStolen: boolean; entry?: TacticalSkillEntry } {
    const e = selfSkillId ? resolveGeneralTacticalEntry(selfSkillId) : null;
    if (!e || !isTacticalSkillActive(e, selfCtx)) return { isNegated: false, isStolen: false };

    if (e.baseEffect === 'negate_enemy_skill') {
        if (Math.random() <= e.magnitude) {
            return { isNegated: true, isStolen: false, entry: e };
        }
        return { isNegated: false, isStolen: false };
    }
    if (e.baseEffect === 'partial_negate_enemy_skill') {
        if (Math.random() <= e.magnitude) {
            return { isNegated: true, isStolen: false, entry: e };
        }
    }
    if (e.baseEffect === 'steal_enemy_skill') {
        if (Math.random() <= e.magnitude) {
            return { isNegated: true, isStolen: true, entry: e };
        } else {
            return { isNegated: true, isStolen: false, entry: e };
        }
    }
    return { isNegated: false, isStolen: false };
}
