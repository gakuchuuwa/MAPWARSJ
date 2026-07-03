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
            return ctx.battleType === 'field';
        case 'ratio_underdog':
            return ctx.selfTroops < ctx.enemyTroops;
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
            // 结算时由调用方在已判败且以少打多时传入
            return ctx.selfTroops < ctx.enemyTroops;
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
        case 'ally_add_troops_comeback':
        case 'luck_variance_self':
        case 'luck_variance_enemy':
        case 'luck_lock_self':
            return true;
        default:
            return false;
    }
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
 * 开战 luck 掷点：锁死 > 己方方差 > 对手扰敌 > 默认 [0.8,1.2]
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

/** 统计 v1 表引擎就绪度（审计 / CI） */
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
