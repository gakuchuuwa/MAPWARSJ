/**
 * 武将技战斗挂载：门禁、开局战术、普将逆局、战后战略
 */
import type { IBattleUnit, BattleType } from './CombatSystem';
import type { Army } from '../legion/Army';
import type { LegionManager } from '../legion/LegionManager';
import type { CityType } from '../types/core';
import { GameConfig } from '../config/GameConfig';
import {
    getGeneralProfile,
    getStrategicSkillDef,
    getTacticalSkillDef,
    CONSCRIPT_DEFEATED_SKILL,
    PASS_GARRISON_DEFENSE_SKILL,
    REGION_CENTER_DEFENSE_SKILL,
    REINFORCEMENT_JOIN_SKILL,
    resolvePostBattlePctByCityType,
    type StrategicEffect,
    type TacticalSkillDef,
} from '../data/GeneralSkills';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { isRegionCenter } from '../systems/RegionSystem';
import {
    buildTacticalConditionContext,
    resolveGeneralTacticalEntry,
    resolveOpeningFateEntry,
    resolveOpeningLuckMultiplier,
    resolveMidBattleCasualtyReduction,
    resolvePostBattleRecoveryRate,
    resolveLoserBiteWinnerLossMult,
    resolveWinnerRecoveryBlockedByLoser,
    resolveOpeningTroopEffect,
    resolveOpeningTroopCutCounter, resolveEnemyTerrainBuffCounter,
    isTacticalSkillActive,
    resolveSkillCountersForSide,
    type TacticalSkillEntry,
} from './TacticalSkillResolver';
import { getTacticalSkillEntry, EFFECT_TO_SIX_SET } from '../data/TacticalSkillCatalog';
import { sumCultureAdjustedTroops, getUnitEliteTier } from '../systems/CultureCombat';
import { LandSeaSystem, LandTerrainSystem, type LandTerrainKind } from '../world/land-sea';
import { COMEBACK_TROOP_THRESHOLD, APTITUDE_POWER_MULT, APTITUDE_LOSER_BITE_FLOOR, ATTACK_STYLE_POWER_MULT, FAMOUS_GENERAL_MULT } from './TacticalConstants';
import { readSiegeGarrisonEliteName } from './SiegeGarrisonTier';
import { gameLog } from '../utils/GameLogger';
import { spawnMapFloatingText, spawnMapPulse, getFollowedArmyId } from '../utils/MapFloatingText';
export { COMEBACK_TROOP_THRESHOLD, APTITUDE_POWER_MULT, APTITUDE_LOSER_BITE_FLOOR, ATTACK_STYLE_POWER_MULT, FAMOUS_GENERAL_MULT };

export function getActiveTacticalSkillId(unit: IBattleUnit): string | null {
    if (unit.battleOverriddenSkillId !== undefined) {
        return unit.battleOverriddenSkillId;
    }
    if (!unit.generalId) return null;
    const profile = getGeneralProfile(unit.generalId);
    return profile?.tacticalSkillId ?? null;
}

/** 战斗局势（开局按兵力比判定） */
export type BattleSituation = 'advantage' | 'balance' | 'disadvantage';

/** 六计随机·局势匹配结果 */
export interface SituationalSkillResult {
    skillId: string | null;
    /** 技能六类是否匹配当前局势 */
    situationMatch: boolean;
}

/** 局势匹配加成系数 */

/**
 * 六计随机·四/四/六（2026-07-20 主人定稿）：
 *   优势 → 攻战/胜战/敌战/混战 四计随机（不含劣势组，优势方摸不到败战翻盘计，保「只有劣势方能翻盘」悬念铁律）
 *   劣势 → 并战/败战/敌战/混战 四计随机（不含优势组）
 *   均势 → 全六计随机
 * 攻守双方同池，_isAttacker 已作废（攻守数值差归第四层攻防环，不在技能层重复表达）。
 */
export function resolveSituationalSkillId(unit: IBattleUnit, situation: BattleSituation, _isAttacker: boolean): SituationalSkillResult {
    if (!unit.generalId) return { skillId: null, situationMatch: false };
    const p = getGeneralProfile(unit.generalId);
    if (!p) return { skillId: null, situationMatch: false };

    // 三势选池·四/四/六（2026-07-20 主人定稿）：六格一格一计，按势分三组。
    //   优势组=攻战/胜战、均势组=敌战/混战、劣势组=并战/败战。
    //   优势 = 优势组 + 均势组（四计随机；不含劣势组 → 优势方摸不到败战翻盘计，保悬念铁律）
    //   劣势 = 劣势组 + 均势组（四计随机；不含优势组）
    //   均势 = 全六计随机
    // 攻守双方同池，_isAttacker 不参与选技（字段前缀 atk/def 是攻防六槽时代遗留，选技已不分攻防）。
    const advGrp = [p.atkAdvantageSkillId, p.defAdvantageSkillId];       // 攻战 / 胜战
    const balGrp = [p.atkBalanceSkillId, p.defBalanceSkillId];           // 敌战 / 混战
    const disGrp = [p.atkDisadvantageSkillId, p.defDisadvantageSkillId]; // 并战 / 败战
    const bySituation: Record<BattleSituation, (string | undefined)[]> = {
        advantage: [...advGrp, ...balGrp],
        balance: [...advGrp, ...balGrp, ...disGrp],
        disadvantage: [...disGrp, ...balGrp],
    };
    const pool = bySituation[situation].filter(Boolean) as string[];
    // 兜底：该势池全空（数据不合规）→ 退回六格任取，保证必有技可放
    const available = pool.length > 0
        ? pool
        : ([...advGrp, ...balGrp, ...disGrp].filter(Boolean) as string[]);
    if (available.length === 0) return { skillId: null, situationMatch: false };

    // 池内等概率取一，同将同势也能打出不同花样
    const skillId = available[Math.floor(Math.random() * available.length)];

    // 判定局势匹配
    const entry = getTacticalSkillEntry(skillId);
    const cls = entry ? (EFFECT_TO_SIX_SET[entry.baseEffect] as string | undefined) : undefined;
    const MATCH_MAP: Record<BattleSituation, string[]> = {
        advantage: ['gongzhan', 'shengzhan'],
        balance: ['dizhan', 'hunzhan'],
        disadvantage: ['bingzhan', 'baizhan'],
    };
    const situationMatch = cls ? (MATCH_MAP[situation]?.includes(cls) ?? false) : false;

    return { skillId, situationMatch };
}

/** 查技能六类（攻战/胜战/敌战/混战/并战/败战），不在目录返回 null */
export function getSkillSixClass(skillId: string | null | undefined): string | null {
    if (!skillId) return null;
    const entry = getTacticalSkillEntry(skillId);
    if (!entry) return null;
    return (EFFECT_TO_SIX_SET[entry.baseEffect] as string) ?? null;
}

function sideIsFirstSortie(units: IBattleUnit[]): boolean {
    return units.some(u => u.isFirstSortieSinceDepart === true);
}


/** 名将开局战术 UI 延迟（秒）：无时长信息时的兜底 */
export const OPENING_TACTICAL_UI_DELAY_SEC = 3;

// 三幕分界已移至 TacticalConstants（零依赖叶子），供 map 层等直接取用；此处原样再导出保持旧引用可用
export { PHASE_STALEMATE_START, PHASE_COLLAPSE_START } from './TacticalConstants';
import { PHASE_STALEMATE_START, PHASE_COLLAPSE_START } from './TacticalConstants';

// 开局脉冲按本场目标时长比例后移；慢直播：短战略提早亮相留错开窗，长战对齐第一幕末。
const OPENING_UI_DELAY_RATIO = PHASE_STALEMATE_START;
const OPENING_UI_DELAY_MAX_SEC = 20;
/** 慢直播：双方技能 Cut-in 理想错开（秒），与 skill-cut-in 动画同长 */
export const SKILL_PULSE_STAGGER_IDEAL_SEC = 3;
/** 慢直播：最短错开（秒）；相持段够长时才用，短战可叠字 */
export const SKILL_PULSE_STAGGER_MIN_SEC = 1.25;
/** 低于此目标时长（秒）视为短战：双方脉冲可叠放，但必须都播 */
export const SKILL_PULSE_SHORT_BATTLE_SEC = 10;

/** 本场战斗基础目标时长（秒），由 BattleField 开战时注入 */
let currentBattleTargetDurationSec = 0;
export function setBattleTargetDurationForSkillUi(sec: number): void {
    currentBattleTargetDurationSec = Number.isFinite(sec) && sec > 0 ? sec : 0;
}

/** 相持第二幕结束时刻（游戏内秒）= 目标时长 × PHASE_COLLAPSE_START */
export function resolvePhase2EndSec(targetDurationSec: number): number {
    return targetDurationSec * PHASE_COLLAPSE_START;
}

/** 自当前时刻起，相持段还剩多少秒（供直播错开/是否播守方脉冲） */
export function resolvePhase2RemainingSec(targetDurationSec: number, elapsedSec: number): number {
    return Math.max(0, resolvePhase2EndSec(targetDurationSec) - elapsedSec);
}

/**
 * 相持段武将技亮相时刻（游戏内秒）= 第一幕末 ≈ 时长×40%。
 */
export function resolveStalemateUiThresholdSec(targetDurationSec: number): number {
    if (targetDurationSec <= 0) return 3.5;
    const T = targetDurationSec;
    const cap = (v: number) => Math.min(OPENING_UI_DELAY_MAX_SEC, v);
    if (T <= 12) {
        return cap(Math.max(3.0, T * 0.38));
    }
    return cap(Math.max(6.0, T * OPENING_UI_DELAY_RATIO));
}

/**
 * 双方脉冲错开间隔（秒）：长战理想 3s；短战或相持窗不足则返回 0（可叠字，双方都必须亮相）。
 */
export function resolveSkillPulseStaggerSec(targetDurationSec: number, elapsedSec: number): number {
    const room = resolvePhase2RemainingSec(targetDurationSec, elapsedSec);
    if (targetDurationSec <= SKILL_PULSE_SHORT_BATTLE_SEC || room < SKILL_PULSE_STAGGER_MIN_SEC * 1.5) {
        return 0;
    }
    return Math.min(
        SKILL_PULSE_STAGGER_IDEAL_SEC,
        Math.max(SKILL_PULSE_STAGGER_MIN_SEC, room * 0.48),
    );
}

/** @deprecated 仅兼容旧调用；新逻辑以 BattleField.elapsed 与 resolveStalemateUiThresholdSec 为准 */
function resolveOpeningUiDelaySec(): number {
    return resolveStalemateUiThresholdSec(currentBattleTargetDurationSec);
}

/** 开战战术脉冲入队目标（由 BattleField 在相持段统一释放） */
export interface IOpeningPulseSink {
    queueOpeningSkillPulse(trigger: TacticalSkillTrigger, audioUnitId?: string): void;
}

let activeOpeningPulseSink: IOpeningPulseSink | null = null;

export function setActiveOpeningPulseSink(sink: IOpeningPulseSink | null): void {
    activeOpeningPulseSink = sink;
}

function fireOpeningPulse(trigger: TacticalSkillTrigger, audioUnitId?: string): void {
    // unitId 随事件下发：CombatUI 钩子据此过滤异场事件（全图多战并行，异场技能曾借同名标签冒名顶替）
    onTacticalSkillTriggered?.(audioUnitId ? { ...trigger, unitId: audioUnitId } : trigger);
    // 技能音效改由语音 onStart 驱动（与 Cut-in 同刻）；无语音兜底见 CombatUI.run
}

/** BattleField 在相持段阈值到达时统一释放已排队脉冲 */
export function dispatchOpeningSkillPulse(trigger: TacticalSkillTrigger, audioUnitId?: string): void {
    fireOpeningPulse(trigger, audioUnitId);
}

/** 开局/相持亮相：入队等 BattleField.elapsed 达阈值再播，禁止 setTimeout 抢跑第一幕 */
function scheduleOpeningTacticalUi(unit: IBattleUnit, trigger: TacticalSkillTrigger): void {
    const delay = resolveStalemateUiThresholdSec(currentBattleTargetDurationSec);
    trigger.uiDelaySec = delay;
    if (activeOpeningPulseSink) {
        activeOpeningPulseSink.queueOpeningSkillPulse(trigger, unit.id);
        return;
    }
    window.setTimeout(() => fireOpeningPulse(trigger, unit.id), delay * 1000);
}

export type TacticalSkillTrigger = {
    displayName: string;
    generalId: string;
    skillId: string;
    /** 0 = 立即；名将开局默认 OPENING_TACTICAL_UI_DELAY_SEC */
    uiDelaySec?: number;
    /** 释放单位 id（fireOpeningPulse 下发时填）：CombatUI 钩子据此过滤异场事件 */
    unitId?: string;
};

export type ComebackTacticalContext = {
    battleElapsed: number;
    triggeredSkillIds: Set<string>;
    scheduleInvincible: (unit: IBattleUnit, startElapsed: number, durationSec: number) => void;
    /** opts.ownerSkill：触发技是否在册（有 ownerGeneralId）——败战翻盘重掷按此选 [0.25,0.45] / [0.30,0.40] */
    onSidesChanged: (opts?: { ownerSkill?: boolean }) => void;
    emitUi: boolean;
};

let legionManagerRef: LegionManager | null = null;
let onTacticalSkillTriggered: ((info: TacticalSkillTrigger) => void) | null = null;

export function setGeneralSkillLegionManager(manager: LegionManager | null): void {
    legionManagerRef = manager;
}

export function setOnTacticalSkillTriggered(
    handler: ((info: TacticalSkillTrigger) => void) | null,
): void {
    onTacticalSkillTriggered = handler;
}

function getArmyEntity(unit: IBattleUnit): Army | null {
    if (unit.unitType !== 'legion' && unit.unitType !== 'army') return null;
    const entity = unit.getEntity?.();
    return (entity as Army) ?? null;
}

/**
 * 名将归势力：军团带 generalId 且档案存在即生效，AI 同样触发。
 */
export function canUnitUseGeneralSkills(unit: IBattleUnit): boolean {
    void legionManagerRef;
    if (unit.unitType === 'city') {
        return !!unit.generalId && !!getGeneralProfile(unit.generalId);
    }
    const army = getArmyEntity(unit);
    if (!army) return false;
    if (!getGeneralProfile(unit.generalId)) return false;
    return true;
}

/** 与 CombatUI.pickPrimaryDisplayUnit 同权：战斗机制与侧栏立绘/脉冲须同一将领 */
function scoreSideGeneralPickPriority(u: IBattleUnit): number {
    let score = 0;
    if (u.unitType === 'legion' || u.unitType === 'army') score += 10_000;
    if (u.generalId && getGeneralProfile(u.generalId)) score += 1_000;
    const army = getArmyEntity(u);
    if (army?.isElite) score += 500;
    if (u.unitType === 'city' && readSiegeGarrisonEliteName(u.getEntity?.())) score += 500;
    score += Math.min(Math.max(0, u.troops) / 1000, 99);
    return score;
}

/** 该侧「放技将领」：脉冲/机制/侧栏名牌与技能展示须同一单位 */
export function pickSideSkillGeneralUnit(units: IBattleUnit[]): IBattleUnit | null {
    return findEligibleGeneralUnit(units);
}

function findEligibleGeneralUnit(units: IBattleUnit[], commander?: IBattleUnit | null): IBattleUnit | null {
    if (commander && canUnitUseGeneralSkills(commander)) return commander;
    if (commander && !canUnitUseGeneralSkills(commander)) return null;
    let best: IBattleUnit | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const u of units) {
        if (!canUnitUseGeneralSkills(u)) continue;
        const score = scoreSideGeneralPickPriority(u);
        if (score > bestScore) {
            bestScore = score;
            best = u;
        }
    }
    return best;
}

/** 侧栏技能卡展示名（与 getGeneralSkillDisplayTags 战术条一致） */
function getActiveTacticalSkillDisplayName(unit: IBattleUnit): { displayName: string; skillId: string } | null {
    const tacId = getActiveTacticalSkillId(unit);
    if (tacId) {
        const tac = getTacticalSkillDef(tacId);
        if (tac) return { displayName: tac.displayName, skillId: tac.id };
        const v1 = resolveGeneralTacticalEntry(tacId);
        if (v1) return { displayName: v1.displayName, skillId: v1.id };
    }
    if (unit.battleOverriddenSkillId === null && unit.negatedSkillId) {
        const neg = getTacticalSkillDef(unit.negatedSkillId);
        const negName = neg?.displayName ?? resolveGeneralTacticalEntry(unit.negatedSkillId)?.displayName;
        if (negName) return { displayName: negName, skillId: unit.negatedSkillId };
    }
    return null;
}

/**
 * 相持阶段保底脉冲：机制未触发 UI 时，仍按侧栏当前战术技亮相（与开局比例延迟对齐）。
 * 与效果路径重复时由 CombatUI 按「侧+技名」去重。
 * @param firstSide 先放侧（优势方 / 均势攻方）；入队顺序与 BattleField 排序一致。
 * @param skipSides 该侧已有存活武将的机制/援军脉冲在队时跳过保底（一将一战一技：
 *        防止援军换将后，同侧既放原将真技、又放新将保底技的双亮相）
 * @param openingUiShown 保底亮相同样占用本侧「开局已亮相」名额，
 *        否则相持段之后才入场的援军会再放一次同侧 Cut-in。
 */
export function scheduleStalemateSkillShowcasePulses(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    firstSide: 'attacker' | 'defender' = 'attacker',
    skipSides?: { attacker: boolean; defender: boolean },
    openingUiShown?: { attacker: boolean; defender: boolean },
): void {
    const delay = resolveStalemateUiThresholdSec(currentBattleTargetDurationSec);
    const sides =
        firstSide === 'attacker'
            ? ([{ units: attackerUnits, isAttacker: true }, { units: defenderUnits, isAttacker: false }] as const)
            : ([{ units: defenderUnits, isAttacker: false }, { units: attackerUnits, isAttacker: true }] as const);
    for (const { units, isAttacker } of sides) {
        if (isAttacker ? skipSides?.attacker : skipSides?.defender) continue;
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) continue;
        const info = getActiveTacticalSkillDisplayName(unit);
        if (!info) continue;
        if (openingUiShown) {
            if (isAttacker) openingUiShown.attacker = true;
            else openingUiShown.defender = true;
        }
        const trigger: TacticalSkillTrigger = {
            displayName: info.displayName,
            generalId: unit.generalId,
            skillId: info.skillId,
            uiDelaySec: delay,
        };
        if (activeOpeningPulseSink) {
            activeOpeningPulseSink.queueOpeningSkillPulse(trigger, unit.id);
            continue;
        }
        window.setTimeout(() => fireOpeningPulse(trigger, unit.id), delay * 1000);
    }
}

function sideHasFamousGeneral(units: IBattleUnit[]): boolean {
    const unit = findEligibleGeneralUnit(units);
    if (!unit?.generalId) return false;
    return getGeneralProfile(unit.generalId)?.tier === 'famous';
}

function emitTacticalUiV1(
    unit: IBattleUnit,
    entry: TacticalSkillEntry,
    sideLabel: string,
    options?: { uiDelaySec?: number; immediate?: boolean },
): void {
    let delay: number;
    if (options?.immediate === true) {
        delay = 0;
    } else if (options?.uiDelaySec != null && options.uiDelaySec !== OPENING_TACTICAL_UI_DELAY_SEC) {
        delay = options.uiDelaySec; // 显式指定的非默认延迟（特殊调用）→ 尊重之
    } else {
        delay = resolveOpeningUiDelaySec(); // 开局默认延迟 → 按本场目标时长比例后移
    }
    const trigger: TacticalSkillTrigger = {
        displayName: entry.displayName,
        generalId: unit.generalId ?? '',
        skillId: entry.id,
        uiDelaySec: delay,
    };
    if (options?.immediate === true) {
        fireOpeningPulse(trigger, unit.id);
        gameLog(
            'battle',
            `⚔️ [战术技] ${unit.generalId} 【${entry.displayName}】 ${sideLabel}`,
        );
        return;
    }
    if (activeOpeningPulseSink && delay > 0) {
        activeOpeningPulseSink.queueOpeningSkillPulse(trigger, unit.id);
        gameLog(
            'battle',
            `⚔️ [战术技] ${unit.generalId} 【${entry.displayName}】 ${sideLabel}`,
        );
        return;
    }
    if (delay <= 0) {
        fireOpeningPulse(trigger, unit.id);
    } else {
        window.setTimeout(() => fireOpeningPulse(trigger, unit.id), delay * 1000);
    }
    gameLog(
        'battle',
        `⚔️ [战术技] ${unit.generalId} 【${entry.displayName}】 ${sideLabel}`,
    );
}

/**
 * 一侧开战命运 luck 解析（不含 base）：返回乘数并按需触发飘字。
 * 供 BattleField 缓存 luck 后在 refresh 时回放（P0：避免援军/逆局重算抹掉命运技掷点）。
 */
export function resolveSideOpeningFateLuck(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    battleType: BattleType,
    terrain: LandTerrainKind | null,
    sideIsAttacker: boolean,
    options?: {
        emitUi?: boolean;
        openingUiShown?: { attacker: boolean; defender: boolean };
    },
    selfCommander?: IBattleUnit | null,
    oppCommander?: IBattleUnit | null,
): { luck: number } {
    const selfTroops = sideUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const enemyTroops = opponentUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const ctx = buildTacticalConditionContext({ isFirstSortieSinceDepart: sideIsFirstSortie(sideUnits),
        battleType,
        terrain,
        selfTroops,
        enemyTroops,
        selfInitialTroops: selfTroops,
        enemyInitialTroops: enemyTroops,
        selfIsAttacker: sideIsAttacker,
        enemyHasFamousGeneral: sideHasFamousGeneral(opponentUnits),
    });

    const selfUnit = findEligibleGeneralUnit(sideUnits, selfCommander);
    const oppUnit = findEligibleGeneralUnit(opponentUnits, oppCommander);
    const selfProfile = selfUnit?.generalId ? getGeneralProfile(selfUnit.generalId) : null;
    const oppProfile = oppUnit?.generalId ? getGeneralProfile(oppUnit.generalId) : null;
    const selfFate = resolveOpeningFateEntry(selfUnit ? (getActiveTacticalSkillId(selfUnit) ?? undefined) : undefined);
    const oppFate = resolveOpeningFateEntry(oppUnit ? (getActiveTacticalSkillId(oppUnit) ?? undefined) : undefined);

    const luck = resolveOpeningLuckMultiplier(ctx, selfFate, oppFate);
    const sideLabel = sideIsAttacker ? '攻方' : '守方';

    if (options?.emitUi !== false) {
        const shown = options?.openingUiShown;
        const markShown = () => {
            if (!shown) return;
            if (sideIsAttacker) shown.attacker = true;
            else shown.defender = true;
        };
        if (luck.appliedSelfEntry && selfUnit) {
            markShown();
            emitTacticalUiV1(selfUnit, luck.appliedSelfEntry, sideLabel, {
                uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
            });
        } else if (luck.appliedEnemyPressureEntry && oppUnit) {
            markShown();
            const oppLabel = sideIsAttacker ? '守方' : '攻方';
            emitTacticalUiV1(oppUnit, luck.appliedEnemyPressureEntry, oppLabel, {
                uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
            });
        }
    }

    const rangeLabel = luck.appliedSelfEntry
        ? `命运技 ${luck.appliedSelfEntry.displayName}`
        : luck.appliedEnemyPressureEntry
            ? `扰敌 ${luck.appliedEnemyPressureEntry.displayName}`
            : `[${GameConfig.COMBAT.LUCK_MIN},${GameConfig.COMBAT.LUCK_MAX}]`;
    gameLog('battle', `⚔️ [luck] ${sideLabel} ×${luck.multiplier.toFixed(3)} (${rangeLabel})`);

    return { luck: luck.multiplier };
}

/** 一侧 base（文化修正兵力；全 0 时退回原兵力） */
export function sideBasePower(units: IBattleUnit[]): number {
    const adjusted = sumCultureAdjustedTroops(units);
    if (adjusted > 0) return adjusted;
    return units.reduce((s, u) => s + Math.max(0, u.troops), 0);
}

// ─────────────────────────────────────────────────────────────
// 战损系战斗挂载（Step2）：沿用 findEligibleGeneralUnit「一侧一将一技」，
// 数组接口只作宽容入参，不授权整侧叠乘（见 Resolver 契约规则1）。
// ─────────────────────────────────────────────────────────────

/**
 * 战中被动减损：该侧作为（预判）强方/胜方时的战损减免比例。
 * win_casualty_reduction（游刃有余/兵不血刃/众志成城/穷寇勿迫）+ elite_casualty_reduction（如臂使指）。
 *
 * ctx 兵力用「实时」值以支持穷寇勿迫（enemy_troops_below_pct 需当前敌兵/敌开战兵）：
 *   overrides.enemyTroops = 当前敌方兵、overrides.enemyInitialTroops = 敌开战兵。
 * 其余条件（always/守城/精锐）与实时兵力无关，开战/翻转时求值即可。
 */
export function resolveSideMidBattleCasualtyReduction(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    battleType: BattleType,
    terrain: LandTerrainKind | null,
    sideIsAttacker: boolean,
    overrides?: { enemyTroops?: number; enemyInitialTroops?: number },
    selfCommander?: IBattleUnit | null,
): { lossReduction: number; entry?: TacticalSkillEntry } {
    const selfUnit = findEligibleGeneralUnit(sideUnits, selfCommander);
    const profile = selfUnit?.generalId ? getGeneralProfile(selfUnit.generalId) : null;
    if (!profile?.tacticalSkillId) return { lossReduction: 0 };

    const selfTroops = sideUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const enemyTroopsNow = opponentUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const selfHasElite = sideUnits.some(u => getUnitEliteTier(u) !== null);
    const ctx = buildTacticalConditionContext({ isFirstSortieSinceDepart: sideIsFirstSortie(sideUnits),
        battleType,
        terrain,
        selfTroops,
        enemyTroops: overrides?.enemyTroops ?? enemyTroopsNow,
        selfInitialTroops: selfTroops,
        enemyInitialTroops: overrides?.enemyInitialTroops ?? enemyTroopsNow,
        selfIsAttacker: sideIsAttacker,
        selfHasEliteLegion: selfHasElite,
    });
    const res = resolveMidBattleCasualtyReduction(
        [selfUnit ? getActiveTacticalSkillId(selfUnit) : null],
        ctx,
    );
    return { lossReduction: res.lossReduction, entry: res.entries[0] };
}

/**
 * 战后战损结算：一次求出恢复率 / 咬人倍率 / 斩根，供 BattleField.resolve 按契约顺序施加。
 * 判据用【开战初始兵力】（战后败方已清零，绝不用残兵）。
 * 契约顺序（调用方遵守）：①斩根(恢复归零) → ②恢复 → ③咬人 → ④胜方保底10%。
 */
export function resolvePostBattleCasualtyOutcome(
    winnerUnits: IBattleUnit[],
    loserUnits: IBattleUnit[],
    battleType: BattleType,
    terrain: LandTerrainKind | null,
    winnerIsAttacker: boolean,
    baseRecoveryRate: number,
    winnerInitialTroops: number,
    loserInitialTroops: number,
    winCommander?: IBattleUnit | null,
    loseCommander?: IBattleUnit | null,
): {
    recoveryRate: number;
    biteWinnerLossMult: number;
    recoveryBlocked: boolean;
    recoveryEntry?: TacticalSkillEntry;
    biteEntry?: TacticalSkillEntry;
    blockEntry?: TacticalSkillEntry;
} {
    const winnerUnit = findEligibleGeneralUnit(winnerUnits, winCommander);
    const winnerProfile = winnerUnit?.generalId ? getGeneralProfile(winnerUnit.generalId) : null;
    const loserUnit = findEligibleGeneralUnit(loserUnits, loseCommander);
    const loserProfile = loserUnit?.generalId ? getGeneralProfile(loserUnit.generalId) : null;

    const winnerCtx = buildTacticalConditionContext({ isFirstSortieSinceDepart: sideIsFirstSortie(winnerUnits),
        battleType, terrain,
        selfTroops: winnerInitialTroops,
        enemyTroops: loserInitialTroops,
        selfInitialTroops: winnerInitialTroops,
        enemyInitialTroops: loserInitialTroops,
        selfIsAttacker: winnerIsAttacker,
    });
    const loserCtx = buildTacticalConditionContext({ isFirstSortieSinceDepart: sideIsFirstSortie(loserUnits),
        battleType, terrain,
        selfTroops: loserInitialTroops,
        enemyTroops: winnerInitialTroops,
        selfInitialTroops: loserInitialTroops,
        enemyInitialTroops: winnerInitialTroops,
        selfIsAttacker: !winnerIsAttacker,
    });

    // ① 斩草除根优先：败方持技 → 胜方恢复归零（压过胜方休养生息）
    const block = resolveWinnerRecoveryBlockedByLoser([loserUnit ? getActiveTacticalSkillId(loserUnit) : null], loserCtx);
    let recoveryRate = baseRecoveryRate;
    let recoveryEntry: TacticalSkillEntry | undefined;
    if (block.blocked) {
        recoveryRate = 0;
    } else {
        const rr = resolvePostBattleRecoveryRate([winnerUnit ? getActiveTacticalSkillId(winnerUnit) : null], winnerCtx, baseRecoveryRate);
        recoveryRate = rr.rate;
        recoveryEntry = rr.entry;
    }
    // ③ 咬人倍率（败方视角）
    const bite = resolveLoserBiteWinnerLossMult([loserUnit ? getActiveTacticalSkillId(loserUnit) : null], loserCtx);
    // ③b 三势适性·败不垒保底：逆势将在劣势(兵不到敌67%)战败 → 放大对方战损(让它惨胜)，即使未持败不垒技
    let biteMult = bite.mult;
    if (loserProfile?.aptitude === 'reverse' && loserInitialTroops < winnerInitialTroops * 0.67) {
        biteMult = Math.max(biteMult, APTITUDE_LOSER_BITE_FLOOR);
    }
    // ③c 并战计·劣势方失败：初始兵力少的一方输了，加敌损 ×1.5
    if (biteMult > 1 && loserInitialTroops < winnerInitialTroops) {
        biteMult = Math.min(4.0, biteMult * 1.5);
        gameLog('battle', `[并战计] 劣势方战败！加敌损 ×1.5 → ${biteMult.toFixed(2)}`);
    }

    return {
        recoveryRate,
        biteWinnerLossMult: biteMult,
        recoveryBlocked: block.blocked,
        recoveryEntry,
        biteEntry: bite.entry,
        blockEntry: block.entry,
    };
}

/**
 * 一侧有效战力：文化修正兵力 × 命运系 luck（#12–#20；默认 [0.9,1.1]）
 */
export function rollSideEffectivePowerWithOpeningFate(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    battleType: BattleType,
    terrain: LandTerrainKind | null,
    sideIsAttacker: boolean,
    options?: {
        emitUi?: boolean;
        openingUiShown?: { attacker: boolean; defender: boolean };
    },
    selfCommander?: IBattleUnit | null,
    oppCommander?: IBattleUnit | null,
): number {
    const base = sideBasePower(sideUnits);
    const { luck } = resolveSideOpeningFateLuck(
        sideUnits, opponentUnits, battleType, terrain, sideIsAttacker, options, selfCommander, oppCommander,
    );
    return base * luck;
}

function getTacticalSkill(unit: IBattleUnit): TacticalSkillDef | null {
    const profile = getGeneralProfile(unit.generalId);
    if (!profile) return null;
    // 有档案但无战术技（只有战略技 / 战术技未分配）时 getActiveTacticalSkillId 返回 null，
    // 不可用 ! 强断言传入——否则 getTacticalSkillDef 对 null 调 startsWith 会崩（每帧攻城战崩溃）。
    const skillId = getActiveTacticalSkillId(unit);
    return skillId ? (getTacticalSkillDef(skillId) ?? null) : null;
}

function getTacticalSkillForTiming(
    unit: IBattleUnit,
    timing: 'opening' | 'comeback',
): TacticalSkillDef | null {
    const skill = getTacticalSkill(unit);
    if (!skill || skill.timing !== timing) return null;
    return skill;
}

function isOncePerBattleTactical(skill: TacticalSkillDef): boolean {
    return skill.isOncePerBattle === true;
}

function emitTacticalUi(
    unit: IBattleUnit,
    skill: TacticalSkillDef,
    sideLabel: string,
    options?: { uiDelaySec?: number; immediate?: boolean; fixedDelay?: boolean },
): void {
    // 与 emitTacticalUiV1 同约定：传默认常量 = 开局语义 → 按本场时长比例延迟；
    // fixedDelay=true（援军入场亮相）例外——入场后尽快亮相，不等全场相持门槛。
    const delay =
        options?.immediate === true
            ? 0
            : options?.fixedDelay === true
                ? (options?.uiDelaySec ?? 0)
                : options?.uiDelaySec === OPENING_TACTICAL_UI_DELAY_SEC
                    ? resolveOpeningUiDelaySec()
                    : (options?.uiDelaySec ?? 0);
    const trigger: TacticalSkillTrigger = {
        displayName: skill.displayName,
        generalId: unit.generalId!,
        skillId: skill.id,
        uiDelaySec: delay > 0 ? delay : undefined,
    };
    gameLog(
        'battle',
        `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}`,
    );
    if (options?.immediate === true) {
        fireOpeningPulse(trigger, unit.id);
        return;
    }
    if (activeOpeningPulseSink && delay > 0 && !options?.fixedDelay) {
        activeOpeningPulseSink.queueOpeningSkillPulse(trigger, unit.id);
        return;
    }
    if (delay > 0) {
        window.setTimeout(() => fireOpeningPulse(trigger, unit.id), delay * 1000);
    } else {
        fireOpeningPulse(trigger, unit.id);
    }
}

function sideMeetsComebackThreshold(currentTroops: number, initialTroops: number): boolean {
    if (initialTroops <= 0) return false;
    return currentTroops <= initialTroops * COMEBACK_TROOP_THRESHOLD;
}

function applyTroopAddToUnits(
    units: IBattleUnit[],
    ratio: number,
    opts?: { openingCap?: number },
): number {
    let added = 0;
    // ⑥哀兵必胜/百折不挠(openingCap>0)：逆局归队，补员基数与封顶均为【开战总兵力】，非 maxTroops 满编。
    //   （2026-07-04 修复：原以 maxTroops 为基数→大编制军团每次触发补员过量、续航滚雪球、带任何战略技都霸榜；
    //    与本技 note「封顶开战上限」不符。改为按开战兵力 × ratio 补员，且全侧不超过开战上限。）
    //   注：①以逸待劳已于 2026-07-03 改为战力乘区(ally_mult_1_2)，不再走本加兵路径。
    const openingCap = opts?.openingCap;
    if (openingCap && openingCap > 0) {
        const sideNow = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
        const budget = Math.min(
            Math.floor(openingCap * ratio),        // 本次补员额度（按开战兵力）
            Math.max(0, openingCap - sideNow),     // 封顶开战上限：全侧不超过开战兵力
        );
        if (budget <= 0) return 0;
        const alive = units.filter((u) => u.troops > 0);
        const denom = alive.reduce((s, u) => s + u.troops, 0) || 1;
        for (const u of alive) {
            const share = Math.floor(budget * (u.troops / denom));
            if (share <= 0) continue;
            const before = u.troops;
            u.setTroops(Math.min(u.troops + share, u.maxTroops));
            added += u.troops - before;
        }
        return added;
    }
    for (const u of units) {
        if (u.troops <= 0) continue;
        const bonus = Math.floor(u.troops * ratio);
        if (bonus <= 0) continue;
        u.setTroops(Math.min(u.troops + bonus, u.maxTroops));
        added += bonus;
    }
    return added;
}

function applyTroopSubToUnits(units: IBattleUnit[], ratio: number): number {
    let removed = 0;
    for (const u of units) {
        if (u.troops <= 0) continue;
        const loss = Math.floor(u.troops * ratio);
        if (loss <= 0) continue;
        u.setTroops(Math.max(0, u.troops - loss));
        removed += loss;
    }
    return removed;
}

function canTriggerTactical(
    skill: TacticalSkillDef,
    triggeredSkillIds: Set<string>,
): boolean {
    // 战术技不按品阶限制；触发时机由 skill.timing / v1 phase 与 condition 决定。
    // 品阶只决定是否可额外携带战略技。
    if (isOncePerBattleTactical(skill) && triggeredSkillIds.has(skill.id)) return false;
    return true;
}

/** 战场锚点地形（攻城取城坐标，野战取首个存活单位） */
export function getBattleTerrainKind(
    units: IBattleUnit[],
    battleType: BattleType,
): LandTerrainKind | null {
    const alive = units.filter((u) => u.troops > 0);
    if (alive.length === 0) return null;
    const city = alive.find((u) => u.unitType === 'city');
    const anchor = (battleType === 'siege' && city ? city : alive[0]).getPosition();
    if (LandSeaSystem.isSeaAt(anchor)) return 'sea';
    return LandTerrainSystem.classifyAt(anchor) ?? 'plain';
}

/**
 * 开局战术战力乘区（UI 徽章 / 赔率显示；开局 ③ 侵掠如火类，名将/普将通用）。
 * 【条件门控】与真实掷色 applyAllyMult / bridgedOpeningEnhanceActive 完全对齐：
 *   条件技（敌有名将 ts_051 / 以少 ts_057 / 首次出击 ts_052 / 地形等）在条件不满足时返回 1，
 *   避免屏幕胜率把加成无条件计入而与真实结算不符。
 * 侧级判定：取该侧 findEligibleGeneralUnit 的开局强化技，与引擎「每侧一将一技」一致。
 * （bridgedOpeningEnhanceActive 为同文件 function 声明，已提升，前向引用安全。）
 */
export function getOpeningTacticalPowerMultiplier(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    isAttacker: boolean,
    opts?: { battleType?: BattleType; terrain?: LandTerrainKind | null },
    selfCommander?: IBattleUnit | null,
    oppCommander?: IBattleUnit | null,
    overrideSelfTroops?: number,
    overrideEnemyTroops?: number,
): number {
    const unit = findEligibleGeneralUnit(sideUnits, selfCommander);
    if (!unit || !canUnitUseGeneralSkills(unit)) return 1;
    const skill = getTacticalSkillForTiming(unit, 'opening');
    if (!skill) return 1;

    // 攻战计（ally_mult_1_2）：加己攻/减敌攻，受条件门控 + 对手地形反制
    if (skill.effect === 'ally_power_mult') {
        if (!bridgedOpeningEnhanceActive(sideUnits, opponentUnits, isAttacker, opts, selfCommander, overrideSelfTroops, overrideEnemyTroops)) return 1;
        let mult = skill.magnitude;
        // 对手地形反制（与引擎 applyAllyMult 一致：传入对手锁定的指挥官）
        const oppUnit = findEligibleGeneralUnit(opponentUnits, oppCommander);
        if (oppUnit && mult > 1) {
            const oppActiveId = getActiveTacticalSkillId(oppUnit);
            if (oppActiveId) {
                const selfTroops = overrideSelfTroops ?? sideUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
                const oppTroops = overrideEnemyTroops ?? opponentUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
                const oppCtx = buildTacticalConditionContext({
                    battleType: opts?.battleType ?? 'field',
                    terrain: opts?.terrain ?? null,
                    selfTroops: oppTroops,
                    enemyTroops: selfTroops,
                    selfInitialTroops: oppTroops,
                    enemyInitialTroops: selfTroops,
                    selfIsAttacker: !isAttacker,
                    enemyHasFamousGeneral: sideHasFamousGeneral(sideUnits),
                    isFirstSortieSinceDepart: sideIsFirstSortie(opponentUnits),
                });
                const counter = resolveEnemyTerrainBuffCounter(oppActiveId, mult, oppCtx);
                if (counter.adjustedMult < mult) {
                    mult = counter.adjustedMult;
                }
            }
        }
        return mult;
    }

    // 摧锋（ally_invincible）：己方掷点 ×rollEdge，无条件（与引擎 applyInvRollEdge 一致）
    if (skill.effect === 'ally_invincible' && skill.rollEdge) {
        return skill.rollEdge;
    }

    return 1;
}

// ── 三势适性：势×局 开战战力系数（③整合。常量见 TacticalConstants.ts）──
// 势与局匹配放大战力：造势顺风碾压 / 借势均势破局 / 逆势逆风爆发(提翻盘机会,不稳赢)。
/** 按该侧带将单位的势 × 当前兵力局(我方/敌方 >1.5优 / <0.67劣 / 中间均)返回开战战力系数 */
export function getAptitudePowerMult(sideUnits: IBattleUnit[], oppUnits: IBattleUnit[], selfCommander?: IBattleUnit | null, overrideSelfTroops?: number, overrideEnemyTroops?: number): number {
    const unit = findEligibleGeneralUnit(sideUnits, selfCommander);
    if (!unit?.generalId) return 1;
    const apt = getGeneralProfile(unit.generalId)?.aptitude;
    if (!apt) return 1;
    const st = overrideSelfTroops ?? sideUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const ot = overrideEnemyTroops ?? oppUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const r = st / Math.max(1, ot);
    const sit: 'advantage'|'balance'|'disadvantage' = r > 1.5 ? 'advantage' : r < 0.67 ? 'disadvantage' : 'balance';
    return APTITUDE_POWER_MULT[apt]?.[sit] ?? 1;
}

/**
 * 第四层·攻防风格战力系数（2026-07-16 · 专精本位 1.20 > 双行 1.10 > 专精错位 0.80）
 * 武将 attackStyle → 攻/守不同角色下的 roll 乘数
 *   attack:  攻城专精 ×1.20，守城崩盘 ×0.80
 *   defense: 守城专精 ×1.20，攻城崩盘 ×0.80
 *   balanced:攻守双全，两面 ×1.10
 */
export function getAttackStylePowerMult(unit: IBattleUnit | null, isAttacker: boolean): number {
    if (!unit?.generalId) return 1;
    const style = getGeneralProfile(unit.generalId)?.attackStyle;
    if (!style) return 1;
    const row = ATTACK_STYLE_POWER_MULT[style];
    if (!row) return 1;
    return isAttacker ? row.attack : row.defense;
}

/**
 * 第五层·名将光环（2026-07-16 · 第 8 环）
 * 名将 (tier='famous') ×1.20，普将 ×1.00。
 */
export function getFamousGeneralMult(unit: IBattleUnit | null): number {
    if (!unit?.generalId) return 1;
    return getGeneralProfile(unit.generalId)?.tier === 'famous' ? FAMOUS_GENERAL_MULT : 1;
}

/**
 * 并战·借「拖长一档」（2026-07-19 定稿）：该侧任一带将单位的当前局技为 battle_duration_mult
 * → 胜负已定档 30s 抬回均势档 45s。收益在地图层：援军圈每 0.2s 轮询，多撑 15s 等友军编入。
 * 不碰胜负判定（并战计不改胜负，六计中只有败战计能翻盘）。
 */
export function sideHasBattleDurationExtend(units: IBattleUnit[]): boolean {
    return units.some((u) => {
        if (!u.generalId) return false;
        const entry = resolveGeneralTacticalEntry(getActiveTacticalSkillId(u) ?? '');
        return entry?.baseEffect === 'battle_duration_mult';
    });
}

/**
 * 战略技不再作用于战斗面板滚点（2026-07-16 定案）。
 * 全部 21 个战略技只在大地图层生效（行军/补给/征兵/视野/威慑/纵横/防务）。
 * 此函数保留以兼容 UI 调用方，始终返回 1。
 */
export function getStrategicBattlePowerMultiplier(
    _unit: IBattleUnit,
    _battleType?: BattleType,
    _terrain?: LandTerrainKind | null,
    _side?: 'attacker' | 'defender',
    _selfTroops?: number,
    _enemyTroops?: number,
): number {
    return 1;
}

/** 军团/城防单位当前战略技定义（无则 null） */
export function getGeneralStrategicSkillDef(unit: IBattleUnit) {
    if (!canUnitUseGeneralSkills(unit)) return null;
    const profile = getGeneralProfile(unit.generalId);
    if (!profile?.strategicSkillId) return null;
    return getStrategicSkillDef(profile.strategicSkillId) ?? null;
}

/** 是否持有指定战略效果 */
export function generalHasStrategicEffect(unit: IBattleUnit, effect: StrategicEffect): boolean {
    const skill = getGeneralStrategicSkillDef(unit);
    return skill?.effect === effect;
}

/** 轻量版：仅需 generalId（供渲染层等无 IBattleUnit 的调用方使用） */
export function generalIdHasStrategicEffect(generalId: string | undefined, effect: StrategicEffect): boolean {
    if (!generalId) return false;
    const profile = getGeneralProfile(generalId);
    if (!profile?.strategicSkillId) return false;
    const skill = getStrategicSkillDef(profile.strategicSkillId);
    return skill?.effect === effect;
}

/** 26 战略技大地图配色（绑 skill.id，禁止硬编码技名） */
const STRATEGIC_PULSE_COLORS: Record<string, string> = {
    str_01: '#55ff55',
    str_02: '#55ff55',
    str_03: '#ffaa00',
    str_04: '#aa55ff',
    str_05: '#ff5555',
    str_06: '#55ff55',
    str_07: '#55ff55',
    str_08: '#44aaff',
    str_09: '#ff5555',
    str_10: '#55ff55',
    str_11: '#55ff55',
    str_12: '#ffaa00',
    str_13: '#55ff55',
    str_16: '#8888cc', // 神出鬼没 视野
    str_17: '#8888cc', // 偃旗息鼓 视野
    str_18: '#8888cc', // 虚张声势 视野
    str_19: '#cc8844', // 不战而屈 威慑
    str_20: '#cc8844', // 先声夺人 威慑
    str_21: '#cc8844', // 越城而走 威慑
    str_22: '#ccaadd', // 纵横捭阖 纵横
    str_23: '#ccaadd', // 飞箝擒王 纵横
    str_24: '#ccaadd', // 转丸破军 纵横
    str_25: '#55ff55', // 足食足兵
    str_26: '#55ff55', // 招兵买马
    str_27: '#55ff55', // 屯兵经略
    str_28: '#55ff55', // 调兵遣将
};

export function getStrategicPulseColor(skillId: string): string {
    return STRATEGIC_PULSE_COLORS[skillId] ?? '#55ff55';
}

type StrategicMapFxUnit = Pick<IBattleUnit, 'id' | 'generalId'>;

const strategicMapFxDedupe = new Map<string, number>();

/** 防务战略技脉冲：同城同 effect 最短间隔（现实毫秒） */
const DEFENSE_PULSE_MIN_INTERVAL_MS = 15_000;

/** 变季类防务 effect：每城每游戏季至多 pulse 一次 */
const DEFENSE_PULSE_SEASON_ONCE_EFFECTS: ReadonlySet<StrategicEffect> = new Set([
    'city_growth_mult',
]);

const defensePulseSeasonShown = new Set<string>();

function getGameSeasonDedupeTag(): string | null {
    const ts = (window as any).game?.timeSystem as { getYear?: () => number; getSeason?: () => string } | undefined;
    if (!ts?.getYear || !ts?.getSeason) return null;
    return `${ts.getYear()}|${ts.getSeason()}`;
}

function resolveGeneralStrategicSkillForEffect(
    generalId: string | null | undefined,
    expectedEffect: StrategicEffect,
) {
    if (!generalId) return null;
    const profile = getGeneralProfile(generalId);
    if (!profile?.strategicSkillId) return null;
    const skill = getStrategicSkillDef(profile.strategicSkillId);
    if (!skill || skill.effect !== expectedEffect) return null;
    return skill;
}

/**
 * 跟拍名将战略技大地图展示：机制 effect 须与 profile.strategicSkillId 一致才上屏。
 * 保证「释放时机」与「脉冲技名」始终对应该将战略格。
 */
export function emitFollowedGeneralStrategicMapFx(
    unit: StrategicMapFxUnit,
    expectedEffect: StrategicEffect,
    lat: number,
    lng: number,
    style: 'pulse' | 'float' = 'pulse',
    opts?: { dedupeMs?: number; dedupeKey?: string },
): boolean {
    if (unit.id !== getFollowedArmyId()) return false;
    const skill = resolveGeneralStrategicSkillForEffect(unit.generalId, expectedEffect);
    if (!skill) return false;

    const dedupeMs = opts?.dedupeMs ?? 0;
    if (dedupeMs > 0) {
        const key = opts?.dedupeKey ?? `${unit.id}|${expectedEffect}`;
        const now = Date.now();
        if (now - (strategicMapFxDedupe.get(key) ?? 0) < dedupeMs) return false;
        strategicMapFxDedupe.set(key, now);
    }

    const color = getStrategicPulseColor(skill.id);
    if (style === 'pulse') spawnMapPulse(lat, lng, skill.displayName, color);
    else spawnMapFloatingText(lat, lng, skill.displayName, color);
    return true;
}

/** 防务类据点锚将战略 effect（S⑤/S㉕/S㉖/S㉗）— 统一大地图脉冲 */
export const DEFENSE_CITY_ANCHORED_EFFECTS = [
    'siege_approach_attrition',
    'city_growth_mult',
    'recruit_cooldown_mult',
    'garrison_reserve_troops',
] as const satisfies readonly StrategicEffect[];

type DefensePulseArmyContext = Pick<
    Army,
    'id' | 'homeCityId' | 'getSourceCityId' | 'getTargetCity'
>;

/** 跟拍军团与据点有关联：出身/来源城 或 当前行军目标城 */
export function isFollowedArmyRelatedToCity(
    army: DefensePulseArmyContext,
    cityId: string,
): boolean {
    if (army.id !== getFollowedArmyId()) return false;
    const homeId = army.homeCityId ?? army.getSourceCityId?.();
    if (homeId === cityId) return true;
    const target = army.getTargetCity?.();
    if (target?.id === cityId) return true;
    return false;
}

/**
 * 防务战略技统一脉冲：据点坐标 spawnMapPulse（非战斗 Cut-in）。
 * str_05 坚壁清野 / str_25 足食足兵 / str_26 招兵买马 / str_27 屯兵经略 共用。
 * 限频：同城同 effect 间隔 ≥15s；足食足兵（变季产兵）每城每季至多 1 次。
 */
export function emitFollowedCityAnchoredDefensePulse(
    cityId: string,
    cityLat: number,
    cityLng: number,
    expectedEffect: StrategicEffect,
    contextArmy: DefensePulseArmyContext,
    opts?: { dedupeKey?: string; dedupeMs?: number },
): boolean {
    if (!isFollowedArmyRelatedToCity(contextArmy, cityId)) return false;
    const anchored = getCityAnchoredGeneral(cityId);
    const skill = resolveGeneralStrategicSkillForEffect(anchored?.generalId, expectedEffect);
    if (!skill) return false;

    const intervalKey = opts?.dedupeKey ?? `${cityId}|${expectedEffect}`;
    const minInterval = opts?.dedupeMs ?? DEFENSE_PULSE_MIN_INTERVAL_MS;

    if (DEFENSE_PULSE_SEASON_ONCE_EFFECTS.has(expectedEffect)) {
        const seasonTag = getGameSeasonDedupeTag();
        if (seasonTag) {
            const seasonKey = `${intervalKey}|${seasonTag}`;
            if (defensePulseSeasonShown.has(seasonKey)) return false;
        }
    }

    const now = Date.now();
    if (now - (strategicMapFxDedupe.get(intervalKey) ?? 0) < minInterval) return false;

    strategicMapFxDedupe.set(intervalKey, now);
    if (DEFENSE_PULSE_SEASON_ONCE_EFFECTS.has(expectedEffect)) {
        const seasonTag = getGameSeasonDedupeTag();
        if (seasonTag) {
            defensePulseSeasonShown.add(`${intervalKey}|${seasonTag}`);
        }
    }

    return spawnMapPulse(cityLat, cityLng, skill.displayName, getStrategicPulseColor(skill.id));
}

/** 跟拍军团出身城：据点锚将战略 effect 触发（S⑭ / S⑮ 等）。脉冲显示在据点坐标上（非军团脚下）。 */
export function emitFollowedHomeCityStrategicMapFx(
    army: Pick<Army, 'id' | 'homeCityId' | 'getSourceCityId' | 'getPosition'>,
    cityId: string,
    cityLat: number,
    cityLng: number,
    expectedEffect: StrategicEffect,
    style: 'pulse' | 'float' = 'pulse',
): boolean {
    if (army.id !== getFollowedArmyId()) return false;
    const homeId = army.homeCityId ?? army.getSourceCityId();
    if (homeId !== cityId) return false;
    const anchored = getCityAnchoredGeneral(cityId);
    const skill = resolveGeneralStrategicSkillForEffect(anchored?.generalId, expectedEffect);
    if (!skill) return false;
    const color = getStrategicPulseColor(skill.id);
    if (style === 'pulse') spawnMapPulse(cityLat, cityLng, skill.displayName, color);
    else spawnMapFloatingText(cityLat, cityLng, skill.displayName, color);
    return true;
}

/** 跟拍军团参与攻城战后：该城据点锚将战略技脉冲（脉冲在据点坐标，不要求出身城） */
export function emitFollowedSiegeCityStrategicMapFx(
    army: Pick<Army, 'id'>,
    cityId: string,
    cityLat: number,
    cityLng: number,
    expectedEffect: StrategicEffect,
    style: 'pulse' | 'float' = 'pulse',
): boolean {
    if (army.id !== getFollowedArmyId()) return false;
    const anchored = getCityAnchoredGeneral(cityId);
    const skill = resolveGeneralStrategicSkillForEffect(anchored?.generalId, expectedEffect);
    if (!skill) return false;
    const color = getStrategicPulseColor(skill.id);
    if (style === 'pulse') spawnMapPulse(cityLat, cityLng, skill.displayName, color);
    else spawnMapFloatingText(cityLat, cityLng, skill.displayName, color);
    return true;
}

const VISION_STRATEGIC_EFFECTS: StrategicEffect[] = [
    'hide_during_peacetime',
    'hide_troop_count',
    'bluff_troop_count',
];

/** 三种视野技统一入口：开始/恢复行军时，效果与脉冲同时起效。 */
export function emitFollowedVisionStrategicFxOnMarch(
    unit: StrategicMapFxUnit,
    lat: number,
    lng: number,
): void {
    const profile = getGeneralProfile(unit.generalId);
    const skill = profile?.strategicSkillId
        ? getStrategicSkillDef(profile.strategicSkillId)
        : null;
    if (!skill || !VISION_STRATEGIC_EFFECTS.includes(skill.effect)) return;
    emitFollowedGeneralStrategicMapFx(
        unit,
        skill.effect,
        lat,
        lng,
        'pulse',
        { dedupeMs: 3000, dedupeKey: `${unit.id}|vision|march` },
    );
}

/** 战后开拔前：本战已触发的纵横技脉冲（军团脚下） */
export function tryEmitPostBattleResumeStrategicFx(
    unit: StrategicMapFxUnit,
    lat: number,
    lng: number,
    pendingDiplomacyEffects: readonly StrategicEffect[] = [],
): void {
    if (unit.id !== getFollowedArmyId()) return;
    for (const effect of pendingDiplomacyEffects) {
        emitFollowedGeneralStrategicMapFx(
            unit,
            effect,
            lat,
            lng,
            'pulse',
            { dedupeMs: 5000, dedupeKey: `${unit.id}|diplomacy|${effect}|resume` },
        );
    }
}

export function getCityAnchoredStrategicMagnitude(
    cityId: string,
    effect: StrategicEffect,
): number {
    const anchored = getCityAnchoredGeneral(cityId);
    if (!anchored?.generalId) return 1;
    const profile = getGeneralProfile(anchored.generalId);
    if (!profile?.strategicSkillId) return 1;
    const skill = getStrategicSkillDef(profile.strategicSkillId);
    if (!skill || skill.effect !== effect) return 1;
    return skill.magnitude;
}

/** 名将 S① 兵贵神速：行军速度乘区；视野技（S⑯⑰⑱）自带 ×1.1 加速 */
export function getGeneralMarchSpeedMultiplier(unit: IBattleUnit): number {
    const skill = getGeneralStrategicSkillDef(unit);
    if (!skill) return 1;
    if (skill.effect === 'march_speed_mult') return skill.magnitude;
    // 视野三技：神出鬼没 / 偃旗息鼓 / 虚张声势 均带 ×1.1 加速
    if (skill.effect === 'hide_during_peacetime'
        || skill.effect === 'hide_troop_count'
        || skill.effect === 'bluff_troop_count') {
        return 1.1;
    }
    return 1;
}

/** 取名将战略技指定效果的 magnitude（无匹配则返回 fallback）。用于数据驱动概率/乘数，如 str_11 长驱深入 magnitude=0.5 即无视小城 ZOC 的概率。 */
export function getGeneralStrategicMagnitude(
    unit: IBattleUnit,
    effect: StrategicEffect,
    fallback = 1,
): number {
    const skill = getGeneralStrategicSkillDef(unit);
    if (!skill || skill.effect !== effect) return fallback;
    return skill.magnitude;
}

/** str_11 长驱深入：远征军团默认享有；非远征时仅挂 str_11 的将触发。二者不叠乘。 */
export function getLongDriveDeepBypassChance(
    army: Pick<Army, 'expeditionTargetCityId' | 'id'> & IBattleUnit,
): number {
    const def = getStrategicSkillDef('str_11');
    const catalogChance = def?.magnitude ?? 0.5;
    const onExpedition = army.expeditionTargetCityId != null;
    const generalHas = generalHasStrategicEffect(army, 'ignore_small_city_zoc');
    if (!onExpedition && !generalHas) return 0;
    if (onExpedition) return catalogChance;
    return getGeneralStrategicMagnitude(army, 'ignore_small_city_zoc', catalogChance);
}

/** 跟拍：长驱深入绕小城 pulse（不占用将 profile 的 strategicSkillId；坐标取军团脚下） */
export function emitFollowedLongDriveDeepBypassFx(
    army: Pick<Army, 'id'>,
    lat: number,
    lng: number,
    opts?: { dedupeMs?: number; dedupeKey?: string },
): boolean {
    if (army.id !== getFollowedArmyId()) return false;
    const skill = getStrategicSkillDef('str_11');
    if (!skill) return false;

    const dedupeMs = opts?.dedupeMs ?? 6000;
    const key = opts?.dedupeKey ?? `${army.id}|str_11`;
    if (dedupeMs > 0) {
        const now = Date.now();
        if (now - (strategicMapFxDedupe.get(key) ?? 0) < dedupeMs) return false;
    }

    const shown = spawnMapPulse(lat, lng, skill.displayName, getStrategicPulseColor(skill.id));
    if (shown && dedupeMs > 0) {
        strategicMapFxDedupe.set(key, Date.now());
    }
    return shown;
}

export function unitQualifiesForPassGarrisonDefenseSkill(unit: IBattleUnit): boolean {
    if (unit.unitType !== 'city') return false;
    const city = unit.getEntity?.() as { type?: string } | undefined;
    return city?.type === 'pass';
}

export function getPassGarrisonDefenseSkillDisplay(
    unit: IBattleUnit,
): { name: string; effectLabel: string } | null {
    if (!unitQualifiesForPassGarrisonDefenseSkill(unit)) return null;
    const mult = GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT;
    return {
        name: PASS_GARRISON_DEFENSE_SKILL.displayName,
        effectLabel: '加城防',
    };
}

export function unitQualifiesForRegionCenterDefenseSkill(unit: IBattleUnit): boolean {
    if (unit.unitType !== 'city') return false;
    const city = unit.getEntity?.() as { id?: string } | undefined;
    return !!city?.id && isRegionCenter(city.id);
}

export function getRegionCenterDefenseSkillDisplay(
    unit: IBattleUnit,
): { name: string; effectLabel: string } | null {
    if (!unitQualifiesForRegionCenterDefenseSkill(unit)) return null;
    const mult = GameConfig.CULTURE_COMBAT.REGION_CENTER_GARRISON_MULT;
    return {
        name: REGION_CENTER_DEFENSE_SKILL.displayName,
        effectLabel: '加城防',
    };
}

export function getReinforcementJoinSkillDisplay(
    joinLuck: number | null,
): { name: string; effectLabel: string } | null {
    if (joinLuck === null) return null;
    return {
        name: REINFORCEMENT_JOIN_SKILL.displayName,
        effectLabel: `×${parseFloat(joinLuck.toFixed(2))}`,
    };
}

export function getGeneralSkillDisplayTags(
    unit: IBattleUnit,
): { name: string; effectLabel: string; isFamous: boolean; skillType: 'tactical' }[] {
    const profile = getGeneralProfile(unit.generalId);
    if (!profile) return [];
    const tags: { name: string; effectLabel: string; isFamous: boolean; skillType: 'tactical' }[] = [];
    const famous = profile.tier === 'famous';

    const tacId = getActiveTacticalSkillId(unit);
    const tac = tacId ? getTacticalSkillDef(tacId) : null;
    if (tac) {
        tags.push({
            name: tac.displayName,
            effectLabel: formatTacticalEffectLabel(tac),
            isFamous: famous,
            skillType: 'tactical',
        });
    } else if (tacId) {
        // v1 原生路径战术技（如 ts_029 肉薄骨并 dual_sub_troops_opening）无 V1_EFFECT_BRIDGE 映射，
        // getTacticalSkillDef 返回 null，但其削兵机制照常由原生路径生效——仍需显示常驻卡片。
        // 用 v1 entry 直接合成显示标签，纯显示、不碰任何战斗机制。
        const v1 = resolveGeneralTacticalEntry(tacId);
        if (v1) {
            tags.push({
                name: v1.displayName,
                effectLabel: formatV1NativeTacticalDisplayLabel(v1),
                isFamous: famous,
                skillType: 'tactical',
            });
        }
    } else if (unit.battleOverriddenSkillId === null && unit.negatedSkillId) {
        // 战术技被对抗系(混战计)看破/夺走 → 显示原技名+「克夺反」
        const neg = getTacticalSkillDef(unit.negatedSkillId);
        const negName = neg ? neg.displayName : resolveGeneralTacticalEntry(unit.negatedSkillId)?.displayName;
        if (negName) {
            tags.push({ name: negName, effectLabel: '克夺反', isFamous: famous, skillType: 'tactical' });
        }
    }

    // [2026-07-05 Fix] 战略技作为大地图效果，已剥离战斗面板，转至战略地图 CameraFollowUI 展示。

    return tags;
}

function formatTacticalEffectLabel(skill: TacticalSkillDef): string {
    switch (skill.effect) {
        case 'ally_power_mult':   return '加己攻';
        case 'enemy_mult_0_8':  return '克夺反';
        case 'ally_add_troops': return '克夺反';
        case 'enemy_sub_troops':return '减敌兵';
        case 'ally_invincible': return '减己损';
        case 'ally_casualty_reduce': return '减己损';
        case 'ally_luck_up':    return '变随机';
        case 'enemy_luck_down': return '变随机';
        case 'ally_luck_lock':  return '变随机';
        case 'ally_recovery':   return '加己攻';
        case 'lose_effect':     return '挽败局';
        case 'ally_elite_casualty': return '减己损';
        case 'enemy_counter':   return '克夺反';
        case 'opening_counter': return '克夺反';
        case 'terrain_counter': return '克夺反';
        case 'ally_recompute':  return '挽败局';
        default: return '';
    }
}

/**
 * v1 原生路径战术技（无 V1_EFFECT_BRIDGE 映射，getTacticalSkillDef 返回 null）的常驻卡片标签。
 * 纯显示用，不参与任何战斗机制——机制仍由原生路径（tryApplyV1OpeningTroop 等）实现。
 */
function formatV1NativeTacticalDisplayLabel(entry: { baseEffect: string; magnitude: number }): string {
    const be = entry.baseEffect ?? '';
    if (be.includes('power_mult')) return '加己攻';
    if (be.includes('enemy_sub_troops') || be.includes('dual_sub_troops')) return '减敌兵';
    if (be.includes('luck')) return '变随机';
    if (be.includes('negate') || be.includes('counter') || be.includes('steal')
        || be.includes('nullify') || be.includes('reflect') || be.includes('cancel_')
        || be.includes('ally_add_troops')) return '克夺反';
    if (be.includes('casualty') || be.includes('post_recovery')) return '减己损';
    if (be.includes('comeback') || be.includes('lose_effect') || be.includes('recompute')
        || be.includes('battle_duration')) return '挽败局';
    return '';
}

/**
 * 名将开局：①②⑤ 改兵力 / 免伤（在掷色前调用一次）
 * v1 兵力系走 resolveOpeningTroopEffect（含条件门控）；旧免伤等未迁移技仍走桥接路径。
 */
export function applyOpeningTacticalPreRoll(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    battleElapsed: number,
    scheduleInvincible: (unit: IBattleUnit, startElapsed: number, durationSec: number) => void,
    triggeredSkillIds: { attacker: Set<string>; defender: Set<string> },
    emitUi: boolean,
    openingUiShown?: { attacker: boolean; defender: boolean },
    opts?: { battleType?: BattleType; terrain?: LandTerrainKind | null },
    attCommander?: IBattleUnit | null,
    defCommander?: IBattleUnit | null,
): void {
    const battleType = opts?.battleType ?? 'field';
    const terrain =
        opts?.terrain ??
        getBattleTerrainKind([...attackerUnits, ...defenderUnits], battleType);

    const markOpeningUiShown = (sideLabel: string) => {
        if (!openingUiShown) return;
        if (sideLabel === '攻方') openingUiShown.attacker = true;
        else openingUiShown.defender = true;
    };

    const buildSideCtx = (
        units: IBattleUnit[],
        opponents: IBattleUnit[],
        isAttacker: boolean,
    ) => {
        const selfTroops = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
        const enemyTroops = opponents.reduce((s, u) => s + Math.max(0, u.troops), 0);
        return buildTacticalConditionContext({
            isFirstSortieSinceDepart: sideIsFirstSortie(units),
            battleType,
            terrain,
            selfTroops,
            enemyTroops,
            selfInitialTroops: selfTroops,
            enemyInitialTroops: enemyTroops,
            selfIsAttacker: isAttacker,
            enemyHasFamousGeneral: sideHasFamousGeneral(opponents),
        });
    };

    const tryApplyV1OpeningTroop = (
        unit: IBattleUnit,
        units: IBattleUnit[],
        opponents: IBattleUnit[],
        sideLabel: string,
        isAttacker: boolean,
        triggered: Set<string>,
    ): boolean => {
        // 用 getActiveTacticalSkillId 而非 profile：尊重对抗系否决(置 null)/夺取(替换)结果
        const activeId = getActiveTacticalSkillId(unit);
        if (!activeId) return false;
        const ctx = buildSideCtx(units, opponents, isAttacker);
        const effect = resolveOpeningTroopEffect(activeId, ctx);
        if (!effect.entry) return false;
        if (triggered.has(effect.entry.id)) return false;

        let logMsg = '';
        let applied = false;
        let selfLossTotal = 0;
        let enemyLossTotal = 0;

        // 双向削兵：先削己再削敌（肉薄骨并）
        if (effect.selfCutMagnitude > 0) {
            selfLossTotal = applyTroopSubToUnits(units, effect.selfCutMagnitude);
            if (selfLossTotal > 0) applied = true;
        }

        if (effect.enemyCutMagnitude > 0) {
            if (!isAttacker) {
                // 守方胜战计: 减敌兵 → 加己兵
                const added = applyTroopAddToUnits(units, effect.enemyCutMagnitude);
                if (added > 0) {
                    applied = true;
                    logMsg = `⚔️ [武将技] ${unit.generalId} 【${effect.entry.displayName}】 ${sideLabel} +${added} 兵（守方加己）`;
                }
            } else {
                // 攻方胜战计: 减敌兵（原有逻辑）
                const oppUnit = findEligibleGeneralUnit(opponents, isAttacker ? defCommander : attCommander);
                const oppActiveId = oppUnit ? getActiveTacticalSkillId(oppUnit) : null;
                const oppCtx = buildSideCtx(opponents, units, !isAttacker);
                const counter = resolveOpeningTroopCutCounter(
                    oppActiveId,
                    effect.enemyCutMagnitude,
                    oppCtx,
                );
                if (counter.selfCutMagnitude > 0) {
                    enemyLossTotal = applyTroopSubToUnits(opponents, counter.selfCutMagnitude);
                }
                if (counter.reflectBackMagnitude > 0) {
                    const reflectLoss = applyTroopSubToUnits(units, counter.reflectBackMagnitude);
                    if (reflectLoss > 0) {
                        selfLossTotal += reflectLoss;
                        applied = true;
                    }
                }
                if (enemyLossTotal > 0) applied = true;
                else if (counter.entry && counter.selfCutMagnitude === 0) applied = true;
            }
        }

        if (effect.allyAddMagnitude > 0) {
            const added = applyTroopAddToUnits(units, effect.allyAddMagnitude);
            if (added > 0) {
                applied = true;
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${effect.entry.displayName}】 ${sideLabel} +${added} 兵`;
            }
        }

        if (!logMsg && applied) {
            if (selfLossTotal > 0 && enemyLossTotal > 0) {
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${effect.entry.displayName}】 ${sideLabel} 自损 ${selfLossTotal} / 削敌 ${enemyLossTotal} 兵`;
            } else if (enemyLossTotal > 0) {
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${effect.entry.displayName}】 ${sideLabel} 削敌 ${enemyLossTotal} 兵`;
            } else if (selfLossTotal > 0) {
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${effect.entry.displayName}】 ${sideLabel} 自损 ${selfLossTotal} 兵`;
            } else {
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${effect.entry.displayName}】 ${sideLabel} 削敌被抵消`;
            }
        }

        if (!applied) return false;

        triggered.add(effect.entry.id);
        gameLog('battle', logMsg);
        if (emitUi) {
            markOpeningUiShown(sideLabel);
            emitTacticalUiV1(unit, effect.entry, sideLabel, {
                uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
            });
        }
        return true;
    };

    const applySide = (
        units: IBattleUnit[],
        opponents: IBattleUnit[],
        sideLabel: string,
        triggered: Set<string>,
        isAttacker: boolean,
    ) => {
        const unit = findEligibleGeneralUnit(units, isAttacker ? attCommander : defCommander);
        if (!unit?.generalId) return;

        if (tryApplyV1OpeningTroop(unit, units, opponents, sideLabel, isAttacker, triggered)) {
            return;
        }

        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!skill) return;
        if (!canTriggerTactical(skill, triggered)) return;

        let logMsg: string;
        switch (skill.effect) {
            case 'ally_add_troops': {
                const added = applyTroopAddToUnits(units, skill.magnitude);
                if (added <= 0) return;
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} +${added} 兵`;
                break;
            }
            case 'enemy_sub_troops': {
                const removed = applyTroopSubToUnits(opponents, skill.magnitude);
                if (removed <= 0) return;
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 削敌 ${removed} 兵`;
                break;
            }
            case 'ally_invincible': {
                // 免伤窗口与脉冲亮相同刻开始（比例延迟），字亮=免伤起，视觉因果一致
                const startAt = battleElapsed + (emitUi ? resolveOpeningUiDelaySec() : 0);
                scheduleInvincible(unit, startAt, skill.magnitude);
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 免伤 ${skill.magnitude} 秒`;
                break;
            }
            case 'ally_casualty_reduce': {
                // 检查 v1 条件：仅条件匹配时才发射脉冲
                const activeId = getActiveTacticalSkillId(unit);
                const v1Entry = activeId ? resolveGeneralTacticalEntry(activeId) : null;
                if (v1Entry) {
                    const condCtx = buildSideCtx(units, opponents, isAttacker);
                    if (!isTacticalSkillActive(v1Entry, condCtx)) return;
                }
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 战中减损生效`;
                break;
            }
            case 'self_casualty_reduce': {
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 减己损 ${(skill.magnitude * 100).toFixed(0)}%`;
                break;
            }
            default:
                return;
        }

        triggered.add(skill.id);
        gameLog('battle', logMsg);
        if (emitUi) {
            markOpeningUiShown(sideLabel);
            emitTacticalUi(unit, skill, sideLabel, {
                uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
            });
        }
    };

    applySide(attackerUnits, defenderUnits, '攻方', triggeredSkillIds.attacker, true);
    applySide(defenderUnits, attackerUnits, '守方', triggeredSkillIds.defender, false);
}

/**
 * 跟拍侧开局战术 + 战略战力乘区（开战掷色）
 */
export function applyGeneralSkillSideRollMultipliers(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    battleType: BattleType,
    options?: {
        emitTacticalUi?: boolean;
        terrain?: LandTerrainKind | null;
        openingUiShown?: { attacker: boolean; defender: boolean };
    },
    attCommander?: IBattleUnit | null,
    defCommander?: IBattleUnit | null,
): { attRoll: number; defRoll: number } {
    const emitUi = options?.emitTacticalUi !== false;
    const terrain =
        options?.terrain ??
        getBattleTerrainKind([...attackerUnits, ...defenderUnits], battleType);
    const tactical = applyOpeningTacticalToRolls(
        attackerUnits,
        defenderUnits,
        attRoll,
        defRoll,
        emitUi,
        options?.openingUiShown,
        { battleType, terrain },
        attCommander,
        defCommander,
    );

    return applyStrategicBattleToRolls(
        attackerUnits,
        defenderUnits,
        tactical.attRoll,
        tactical.defRoll,
        battleType,
        terrain,
        emitUi,
    );
}

/** 援军编入后强弱重算：仅战略乘区（不重发开局/逆局战术） */
export function applyStrategicRollMultipliersOnly(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    battleType: BattleType,
    attCommander?: IBattleUnit | null,
    defCommander?: IBattleUnit | null,
): { attRoll: number; defRoll: number } {
    const terrain = getBattleTerrainKind([...attackerUnits, ...defenderUnits], battleType);
    const base = applyStrategicBattleToRolls(
        attackerUnits,
        defenderUnits,
        attRoll,
        defRoll,
        battleType,
        terrain,
        false,
        attCommander,
        defCommander,
    );
    return { attRoll: base.attRoll, defRoll: base.defRoll };
}

/**
 * 援军编入：名将首次入战补发开局战术 UI（机制已在开战结算）
 */
export function tryEmitOpeningTacticalOnReinforcementJoin(
    joinedUnit: IBattleUnit,
    isAttacker: boolean,
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    openingUiShown: { attacker: boolean; defender: boolean },
    pulseSink?: IOpeningPulseSink | null,
    stalemateSkillUiReleased?: boolean,
    selfCommander?: IBattleUnit | null,
    oppCommander?: IBattleUnit | null,
): void {
    if (!canUnitUseGeneralSkills(joinedUnit)) return;
    const sideUnits = isAttacker ? attackerUnits : defenderUnits;
    const eligible = findEligibleGeneralUnit(sideUnits, selfCommander);
    if (eligible?.id !== joinedUnit.id) return;

    const skill = getTacticalSkillForTiming(joinedUnit, 'opening');
    if (!skill) return;

    const shown = isAttacker ? openingUiShown.attacker : openingUiShown.defender;
    if (shown) return;

    if (isAttacker) openingUiShown.attacker = true;
    else openingUiShown.defender = true;

    const sideLabel = isAttacker ? '攻方' : '守方';
    if (pulseSink && !stalemateSkillUiReleased) {
        const trigger: TacticalSkillTrigger = {
            displayName: skill.displayName,
            generalId: joinedUnit.generalId!,
            skillId: skill.id,
            uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
        };
        pulseSink.queueOpeningSkillPulse(trigger, joinedUnit.id);
        gameLog(
            'battle',
            `⚔️ [武将技] ${joinedUnit.generalId} 【${skill.displayName}】 ${sideLabel}（援军入队，相持段亮相）`,
        );
        return;
    }

    emitTacticalUi(joinedUnit, skill, sideLabel, {
        uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
        fixedDelay: true, // 援军将领入场后 3s 内亮相，不等全场时长比例
    });
}

/**
 * 桥接的 v1 opening 强化技（ally_power_mult→ally_mult_1_2）可能带环境条件
 * （battle_field / terrain_* / battle_siege_* 等），旧 def 无法表达。此处按 v1 condition 门控：
 * 条件不满足 → 该桥接技本次不生效。旧 tac 技（无 v1 entry）或 always 一律放行；
 * comeback 类已由 bridgeV1PhaseToTiming 分流到 comeback timing，不进本 opening 路径。
 */
function bridgedOpeningEnhanceActive(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    isAttacker: boolean,
    opts?: { battleType?: BattleType; terrain?: LandTerrainKind | null },
    selfCommander?: IBattleUnit | null,
    overrideSelfTroops?: number,
    overrideEnemyTroops?: number,
): boolean {
    const unit = findEligibleGeneralUnit(sideUnits, selfCommander);
    if (!unit?.generalId) return true;
    const tacId = (unit ? getActiveTacticalSkillId(unit) : null);
    if (!tacId) return true;
    const entry = resolveGeneralTacticalEntry(tacId);
    if (!entry || entry.condition === 'always') return true;
    const selfTroops = overrideSelfTroops ?? sideUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const enemyTroops = overrideEnemyTroops ?? opponentUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const ctx = buildTacticalConditionContext({ isFirstSortieSinceDepart: sideIsFirstSortie(sideUnits),
        battleType: opts?.battleType ?? 'field',
        terrain: opts?.terrain ?? null,
        selfTroops,
        enemyTroops,
        selfInitialTroops: selfTroops,
        enemyInitialTroops: enemyTroops,
        selfIsAttacker: isAttacker,
        enemyHasFamousGeneral: sideHasFamousGeneral(opponentUnits),
    });
    return isTacticalSkillActive(entry, ctx);
}

/**
 * 名将开局战术掷色乘区（③ 己×1.2、④ 敌×0.8）
 */
export function applyOpeningTacticalToRolls(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    emitUi = true,
    openingUiShown?: { attacker: boolean; defender: boolean },
    opts?: { battleType?: BattleType; terrain?: LandTerrainKind | null },
    attCommander?: IBattleUnit | null,
    defCommander?: IBattleUnit | null,
): { attRoll: number; defRoll: number; trigger?: TacticalSkillTrigger } {
    let lastTrigger: TacticalSkillTrigger | undefined;

    const markShown = (isAttacker: boolean) => {
        if (!openingUiShown) return;
        if (isAttacker) openingUiShown.attacker = true;
        else openingUiShown.defender = true;
    };

    const applyAllyMult = (
        units: IBattleUnit[],
        opponentUnits: IBattleUnit[],
        roll: number,
        sideLabel: string,
        isAttacker: boolean,
    ): { roll: number; enemyDebuff: number } => {
        const unit = findEligibleGeneralUnit(units, isAttacker ? attCommander : defCommander);
        if (!unit?.generalId) return { roll, enemyDebuff: 1 };
        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!skill) return { roll, enemyDebuff: 1 };

        if (skill.effect === 'ally_power_mult') {
            if (!bridgedOpeningEnhanceActive(units, opponentUnits, isAttacker, opts, isAttacker ? attCommander : defCommander)) return { roll, enemyDebuff: 1 };
            const selfTroops = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
            const oppTroops = opponentUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
            let mult = skill.magnitude;
            const oppUnit = findEligibleGeneralUnit(opponentUnits, isAttacker ? defCommander : attCommander);
            const oppActiveId = oppUnit ? getActiveTacticalSkillId(oppUnit) : null;
            // 混战·克/夺（enemy_counter）：否掉本侧加己攻
            if (oppActiveId && mult > 1) {
                const oppSkill = getTacticalSkill(oppUnit!);
                if (oppSkill?.effect === 'enemy_counter') {
                    // 检查本侧是否有混战·反（opening_counter）护盾
                    const selfSkill = getTacticalSkill(unit);
                    if (selfSkill?.effect !== 'opening_counter') {
                        mult = 1;
                        gameLog('battle', `⚔️ [武将技] ${oppUnit!.generalId} 【${oppSkill.displayName}】否掉了${sideLabel}加己攻`);
                    } else {
                        gameLog('battle', `⚔️ [武将技] ${unit.generalId} 【${selfSkill.displayName}】反制，${sideLabel}加己攻保全`);
                    }
                }
            }
            if (oppActiveId && mult > 1) {
                const oppCtx = buildTacticalConditionContext({
                    battleType: opts?.battleType ?? 'field',
                    terrain: opts?.terrain ?? null,
                    selfTroops: oppTroops,
                    enemyTroops: selfTroops,
                    selfInitialTroops: oppTroops,
                    enemyInitialTroops: selfTroops,
                    selfIsAttacker: !isAttacker,
                    enemyHasFamousGeneral: sideHasFamousGeneral(units),
                    isFirstSortieSinceDepart: sideIsFirstSortie(opponentUnits),
                });
                const counter = resolveEnemyTerrainBuffCounter(oppActiveId, mult, oppCtx);
                if (counter.adjustedMult < mult) {
                    mult = counter.adjustedMult;
                    if (counter.entry && oppUnit) {
                        gameLog(
                            'battle',
                            `⛰️ [对抗系] ${oppUnit.generalId} 触发【${counter.entry.displayName}】，压制了${sideLabel}地形优势！`,
                        );
                    }
                }
            }
            if (isAttacker) {
                // 攻方攻战计: 加己攻
                const next = roll * mult;
                gameLog(
                    'battle',
                    `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}加己攻 ×${parseFloat(mult.toFixed(2))} (${roll.toFixed(0)}→${next.toFixed(0)})`,
                );
                if (emitUi) {
                    markShown(isAttacker);
                    const trigger: TacticalSkillTrigger = {
                        displayName: skill.displayName,
                        generalId: unit.generalId,
                        skillId: skill.id,
                        uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
                    };
                    scheduleOpeningTacticalUi(unit, trigger);
                    lastTrigger = trigger;
                }
                return { roll: next, enemyDebuff: 1 };
            } else {
                // 守方攻战计: 减敌攻
                gameLog(
                    'battle',
                    `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}减敌攻 ÷${parseFloat(mult.toFixed(2))}`,
                );
                if (emitUi) {
                    markShown(isAttacker);
                    const trigger: TacticalSkillTrigger = {
                        displayName: skill.displayName,
                        generalId: unit.generalId,
                        skillId: skill.id,
                        uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
                    };
                    scheduleOpeningTacticalUi(unit, trigger);
                    lastTrigger = trigger;
                }
                return { roll, enemyDebuff: mult };
            }
        }
        return { roll, enemyDebuff: 1 };
    };

    const applyEnemyDebuff = (
        units: IBattleUnit[],
        opponentRoll: number,
        sideLabel: string,
        isAttacker: boolean,
    ): number => {
        const unit = findEligibleGeneralUnit(units, isAttacker ? attCommander : defCommander);
        if (!unit?.generalId) return opponentRoll;
        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!skill) return opponentRoll;

        if (skill.effect === 'enemy_mult_0_8') {
            const next = opponentRoll * skill.magnitude;
            gameLog(
                'battle',
                `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}压制敌战力 ×${skill.magnitude}`,
            );
            if (emitUi) {
                markShown(isAttacker);
                const trigger: TacticalSkillTrigger = {
                    displayName: skill.displayName,
                    generalId: unit.generalId,
                    skillId: skill.id,
                    uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
                };
                scheduleOpeningTacticalUi(unit, trigger);
                lastTrigger = trigger;
            }
            return next;
        }
        // 并战·乱（enemy_luck_down）：随机搅乱对手 roll
        if (skill.effect === 'enemy_luck_down') {
            const variance = skill.magnitude || 1;
            const lo = 0.7, hi = 1.3;
            const r = lo + Math.random() * (hi - lo);
            const next = opponentRoll * r;
            gameLog(
                'battle',
                `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}搅乱敌运 ×${r.toFixed(2)}`,
            );
            return next;
        }
        return opponentRoll;
    };

    const applyInvRollEdge = (
        units: IBattleUnit[],
        roll: number,
        sideLabel: string,
        isAttacker: boolean,
    ): number => {
        const unit = findEligibleGeneralUnit(units, isAttacker ? attCommander : defCommander);
        if (!unit?.generalId) return roll;
        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!skill) return roll;
        if (skill.effect !== 'ally_invincible' || !skill.rollEdge) return roll;

        const next = roll * skill.rollEdge;
        gameLog(
            'battle',
            `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}掷点 ×${skill.rollEdge} (${roll.toFixed(0)}→${next.toFixed(0)})`,
        );
        return next;
    };

    const attAlly = applyAllyMult(attackerUnits, defenderUnits, attRoll, '攻方', true);
    const defAlly = applyAllyMult(defenderUnits, attackerUnits, defRoll, '守方', false);
    let outAtt = attAlly.roll / defAlly.enemyDebuff;  // 守方攻战计减敌攻
    let outDef = defAlly.roll;
    outDef = applyEnemyDebuff(attackerUnits, outDef, '攻方', true);
    outAtt = applyEnemyDebuff(defenderUnits, outAtt, '守方', false);
    outAtt = applyInvRollEdge(attackerUnits, outAtt, '攻方', true);
    outDef = applyInvRollEdge(defenderUnits, outDef, '守方', false);

    // 三势适性：势×局 开战战力系数（造势顺风↑ / 逆势逆风↑提翻盘机会；初值待模拟器调 APTITUDE_POWER_MULT）
    outAtt *= getAptitudePowerMult(attackerUnits, defenderUnits, attCommander);
    outDef *= getAptitudePowerMult(defenderUnits, attackerUnits, defCommander);

    // 第四层·攻防风格（attackStyle → 攻/守角色系数）
    const attGen = findEligibleGeneralUnit(attackerUnits, attCommander);
    const defGen = findEligibleGeneralUnit(defenderUnits, defCommander);
    outAtt *= getAttackStylePowerMult(attGen, true);
    outDef *= getAttackStylePowerMult(defGen, false);

    // 第五层·名将光环（tier='famous' ×1.20，普将 ×1.00）
    outAtt *= getFamousGeneralMult(attGen);
    outDef *= getFamousGeneralMult(defGen);

    return { attRoll: outAtt, defRoll: outDef, trigger: lastTrigger };
}

/** 逆局战术（达到 COMEBACK_TROOP_THRESHOLD 后按当前局技触发） */
export function tryApplyComebackTacticalForSide(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    sideTotalTroops: number,
    sideInitialTroops: number,
    sideLabel: string,
    ctx: ComebackTacticalContext,
    selfCommander?: IBattleUnit | null,
    oppCommander?: IBattleUnit | null,
): boolean {
    const unit = findEligibleGeneralUnit(sideUnits, selfCommander);
    if (!unit?.generalId) return false;

    const v1 = resolveGeneralTacticalEntry((unit ? getActiveTacticalSkillId(unit) : null) ?? '');
    if (v1?.phase === 'mid_battle_comeback' && v1.baseEffect === 'recompute_comeback') {
        const threshold = v1.comebackThreshold ?? COMEBACK_TROOP_THRESHOLD;
        if (sideInitialTroops <= 0 || sideTotalTroops > sideInitialTroops * threshold) {
            return false;
        }
        if (ctx.triggeredSkillIds.has(v1.id)) return false;
        ctx.triggeredSkillIds.add(v1.id);
        gameLog(
            'battle',
            `⚔️ [战术技·逆局] ${unit.generalId} 【${v1.displayName}】 ${sideLabel} 重算强弱（兵力≤${(threshold * 100).toFixed(0)}%）`,
        );
        ctx.onSidesChanged({ ownerSkill: !!v1.ownerGeneralId });
        if (ctx.emitUi) {
            emitTacticalUiV1(unit, v1, sideLabel, { immediate: true });
        }
        return true;
    }

    if (!sideMeetsComebackThreshold(sideTotalTroops, sideInitialTroops)) return false;
    const skill = getTacticalSkillForTiming(unit, 'comeback');
    if (!skill) return false;
    if (!canTriggerTactical(skill, ctx.triggeredSkillIds)) return false;

    let applied = false;

    switch (skill.effect) {
        case 'ally_add_troops': {
            const added = applyTroopAddToUnits(sideUnits, skill.magnitude, { openingCap: sideInitialTroops });
            if (added <= 0) return false;
            ctx.triggeredSkillIds.add(skill.id);
            applied = true;
            gameLog(
                'battle',
                `⚔️ [武将技·逆局] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} +${added} 兵（兵力≤${COMEBACK_TROOP_THRESHOLD * 100}%）`,
            );
            ctx.onSidesChanged();
            break;
        }
        case 'enemy_sub_troops': {
            const removed = applyTroopSubToUnits(opponentUnits, skill.magnitude);
            if (removed <= 0) return false;
            ctx.triggeredSkillIds.add(skill.id);
            applied = true;
            gameLog(
                'battle',
                `⚔️ [武将技·逆局] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 削敌 ${removed} 兵`,
            );
            ctx.onSidesChanged();
            break;
        }
        case 'ally_invincible': {
            ctx.triggeredSkillIds.add(skill.id);
            applied = true;
            ctx.scheduleInvincible(unit, ctx.battleElapsed, skill.magnitude);
            gameLog(
                'battle',
                `⚔️ [武将技·逆局] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 免伤 ${skill.magnitude} 秒`,
            );
            break;
        }
        case 'ally_power_mult':
        case 'enemy_mult_0_8':
            ctx.triggeredSkillIds.add(skill.id);
            applied = true;
            gameLog(
                'battle',
                `⚔️ [武将技·逆局] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 战力乘区生效`,
            );
            ctx.onSidesChanged();
            break;
        default:
            return false;
    }

    if (applied && ctx.emitUi) {
        emitTacticalUi(unit, skill, sideLabel, { immediate: true });
    }
    return applied;
}

/** 逆局 ⑧⑨⑩：对已触发的乘区/免伤技能做掷色修正（在 onSidesChanged 内调用） */
export function applyComebackRollMultipliersForSide(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    sideRoll: number,
    opponentRoll: number,
    triggeredSkillIds: Set<string>,
    selfCommander?: IBattleUnit | null,
): { sideRoll: number; opponentRoll: number } {
    const unit = findEligibleGeneralUnit(sideUnits, selfCommander);
    if (!unit?.generalId) return { sideRoll, opponentRoll };
    const skill = getTacticalSkillForTiming(unit, 'comeback');
    if (!skill || !triggeredSkillIds.has(skill.id)) return { sideRoll, opponentRoll };

    if (skill.effect === 'ally_power_mult') {
        return { sideRoll: sideRoll * skill.magnitude, opponentRoll };
    }
    if (skill.effect === 'enemy_mult_0_8') {
        return { sideRoll, opponentRoll: opponentRoll * skill.magnitude };
    }
    if (skill.effect === 'ally_invincible' && skill.rollEdge) {
        return { sideRoll: sideRoll * skill.rollEdge, opponentRoll };
    }
    return { sideRoll, opponentRoll };
}

/**
 * 战略技不再作用于战斗面板滚点（2026-07-16 定案）。
 * 全部 21 个战略技只在大地图层生效。
 * 此函数保留以兼容调用方，直接透传 roll 值。
 */
export function applyStrategicBattleToRolls(
    _attackerUnits: IBattleUnit[],
    _defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    _battleType: BattleType,
    _terrain?: LandTerrainKind | null,
    _emitUi: boolean = true,
    _attCommander?: IBattleUnit | null,
    _defCommander?: IBattleUnit | null,
): { attRoll: number; defRoll: number } {
    return { attRoll, defRoll };
}

function applyPostBattleTroopPct(
    unit: IBattleUnit,
    skill: { displayName: string; effect: string; magnitude: number },
    source: string,
    emitMapText = true,
): number {
    if (skill.effect !== 'post_battle_troop_pct') return 0;
    const bonus = Math.floor(unit.troops * skill.magnitude);
    if (bonus <= 0) return 0;

    unit.setTroops(unit.troops + bonus);
    
    // S⑦因粮于敌：数字小，仅面板小字或不刷屏的简单记录
    gameLog(
        'battle',
        `🌾 [武将技] ${unit.generalId ?? '?'} ${source}【${skill.displayName}】 +${bonus}`,
    );
    // 飘字须与名将战略格一致（禁止用传入 skill 的 displayName 顶替 profile）
    if (emitMapText) {
        const army = getArmyEntity(unit);
        if (army) {
            const pos = army.getPosition();
            emitFollowedGeneralStrategicMapFx(unit, 'post_battle_troop_pct', pos.lat, pos.lng, 'float', { dedupeMs: 3000, dedupeKey: `${unit.id}|post_battle_troop` });
        }
    }
    return bonus;
}

/**
 * 整编归伍（全员通用系统技，静默不飘字）：胜方战后收编败军。
 * rate = 以少胜多 ? 30% : 15%（敌开战总兵为基数），全侧按存活军团兵力分摊，逐军团封顶 maxTroops。
 * 每支存活胜方军团都会走一遍封顶，因此顺带兜底「招降纳叛」等逐将加兵造成的溢出（不再突破军团上限）。
 * 须在恢复 + applyPostBattleStrategicBonus（招降纳叛 +10%）之后调用，作为收编与统一封顶的最后一步。
 */
export function applyPostBattleConscription(
    winnerSurvivingUnits: IBattleUnit[],
    loserInitialTotalTroops: number,
    isUnderdogWin: boolean,
): number {
    const alive = winnerSurvivingUnits.filter((u) => u.troops > 0);
    if (alive.length === 0) return 0;

    const rate = isUnderdogWin
        ? CONSCRIPT_DEFEATED_SKILL.underdogRate
        : CONSCRIPT_DEFEATED_SKILL.baseRate;
    const pool = Math.floor(Math.max(0, loserInitialTotalTroops) * rate);
    const denom = alive.reduce((s, u) => s + u.troops, 0) || 1;

    let added = 0;
    for (const u of alive) {
        const share = pool > 0 ? Math.floor(pool * (u.troops / denom)) : 0;
        const before = u.troops;
        // min(…, maxTroops)：收编不突破军团上限；share=0 时仍执行，兜底招降纳叛溢出
        u.setTroops(Math.min(u.troops + share, u.maxTroops));
        added += u.troops - before;
    }
    return added;
}

export function applyPostBattleStrategicBonus(
    unit: IBattleUnit,
    battleType: BattleType,
    enemyInitialTroops?: number,
    defenderCityType?: CityType | null,
    isAttacker?: boolean,
): number {
    let total = 0;

    const army = getArmyEntity(unit);

    if (canUnitUseGeneralSkills(unit)) {
        const profile = getGeneralProfile(unit.generalId);
        if (profile?.strategicSkillId) {
            const profileSkill = getStrategicSkillDef(profile.strategicSkillId);
            if (profileSkill && profileSkill.effect === 'post_battle_troop_pct') {
                // S⑦因粮于敌：攻城胜后按守方城型补兵；无城型表时回退 magnitude 固定比例
                if (isAttacker && battleType === 'siege' && profileSkill.postBattlePctByCityType && defenderCityType) {
                    const pct = resolvePostBattlePctByCityType(profileSkill, defenderCityType);
                    if (pct > 0) {
                        const bonus = Math.floor(unit.troops * pct);
                        if (bonus > 0) {
                            unit.setTroops(unit.troops + bonus);
                            total += bonus;
                            gameLog(
                                'battle',
                                `🌾 [武将技] ${unit.generalId ?? '?'} 【${profileSkill.displayName}】 +${bonus}`,
                            );
                            if (army) {
                                const pos = army.getPosition();
                                emitFollowedGeneralStrategicMapFx(
                                    unit,
                                    'post_battle_troop_pct',
                                    pos.lat,
                                    pos.lng,
                                    'float',
                                );
                            }
                        }
                    }
                } else if (profileSkill.magnitude > 0) {
                    total += applyPostBattleTroopPct(unit, profileSkill, '');
                }
            } else if (profileSkill?.effect === 'post_battle_recruit_enemy_pct' && enemyInitialTroops !== undefined && enemyInitialTroops > 0) {
                // S⑥招降纳叛：胜后收编敌方开战总兵 10%（与战损系同用 initialTotalTroops）
                const bonus = Math.floor(enemyInitialTroops * profileSkill.magnitude);
                if (bonus > 0) {
                    unit.setTroops(unit.troops + bonus);
                    total += bonus;
                    gameLog('battle', `〔${profileSkill.displayName}〕${unit.generalId ?? '将领'}收编降卒 ${bonus.toLocaleString()}（敌开战兵 ${enemyInitialTroops.toLocaleString()} 之 ${Math.round(profileSkill.magnitude * 100)}%）`);
                    if (army) {
                        const pos = army.getPosition();
                        emitFollowedGeneralStrategicMapFx(
                            unit,
                            'post_battle_recruit_enemy_pct',
                            pos.lat,
                            pos.lng,
                            'float',
                        );
                    }
                }
            }

            // S⑫乘胜追击 (skip_post_battle_rest)
            if (profileSkill?.effect === 'skip_post_battle_rest') {
                gameLog('battle', `〔${profileSkill.displayName}〕${unit.generalId ?? '将领'}不作休整，挥师再进`);
                if (army) {
                    const pos = army.getPosition();
                    emitFollowedGeneralStrategicMapFx(unit, 'skip_post_battle_rest', pos.lat, pos.lng, 'pulse');
                }
            }
        }
    }

    return total;
}

/**
 * 开战判定：对抗系否决/夺取技能
 */
export function applySkillCountersToUnits(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    battleType: BattleType,
    terrain: LandTerrainKind | null,
    attCommander?: IBattleUnit | null,
    defCommander?: IBattleUnit | null,
): void {
    const attUnit = findEligibleGeneralUnit(attackerUnits, attCommander);
    const defUnit = findEligibleGeneralUnit(defenderUnits, defCommander);

    const attSkillId = attUnit ? getActiveTacticalSkillId(attUnit) : null;
    const defSkillId = defUnit ? getActiveTacticalSkillId(defUnit) : null;

    if (!attSkillId && !defSkillId) return;

    const attTroops = attackerUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const defTroops = defenderUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);

    const attCtx = buildTacticalConditionContext({
        battleType, terrain,
        selfTroops: attTroops, enemyTroops: defTroops,
        selfInitialTroops: attTroops, enemyInitialTroops: defTroops,
        selfIsAttacker: true,
        enemyHasFamousGeneral: sideHasFamousGeneral(defenderUnits),
        isFirstSortieSinceDepart: sideIsFirstSortie(attackerUnits),
    });

    const defCtx = buildTacticalConditionContext({
        battleType, terrain,
        selfTroops: defTroops, enemyTroops: attTroops,
        selfInitialTroops: defTroops, enemyInitialTroops: attTroops,
        selfIsAttacker: false,
        enemyHasFamousGeneral: sideHasFamousGeneral(attackerUnits),
        isFirstSortieSinceDepart: sideIsFirstSortie(defenderUnits),
    });

    const attCounter = resolveSkillCountersForSide(attSkillId, attCtx);
    const defCounter = resolveSkillCountersForSide(defSkillId, defCtx);

    // Defender counters attacker
    if (defCounter.isNegated && attUnit) {
        attUnit.negatedSkillId = attSkillId;
        attUnit.battleOverriddenSkillId = null;
        if (defCounter.isStolen && defUnit) {
            defUnit.battleOverriddenSkillId = attSkillId;
        }
        gameLog('battle', `⚔️ [对抗系] ${defUnit?.generalId} 触发【${defCounter.entry?.displayName}】，看破了攻方战术技！`);
        if (defUnit && defCounter.entry) {
            emitTacticalUiV1(defUnit, defCounter.entry, '守方');
        }
    }

    // Attacker counters defender
    if (attCounter.isNegated && defUnit) {
        defUnit.negatedSkillId = defSkillId;
        defUnit.battleOverriddenSkillId = null;
        if (attCounter.isStolen && attUnit) {
            attUnit.battleOverriddenSkillId = defSkillId;
        }
        gameLog('battle', `⚔️ [对抗系] ${attUnit?.generalId} 触发【${attCounter.entry?.displayName}】，看破了守方战术技！`);
        if (attUnit && attCounter.entry) {
            emitTacticalUiV1(attUnit, attCounter.entry, '攻方');
        }
    }
}
