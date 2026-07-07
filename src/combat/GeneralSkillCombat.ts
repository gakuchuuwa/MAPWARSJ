/**
 * 武将技战斗挂载：门禁、开局战术、普将逆局、战后战略
 */
import type { IBattleUnit, BattleType } from './CombatSystem';
import type { Army } from '../legion/Army';
import type { LegionManager } from '../legion/LegionManager';
import { GameConfig } from '../config/GameConfig';
import {
    getGeneralProfile,
    getStrategicSkillDef,
    getTacticalSkillDef,
    EXPEDITION_FORAGE_SKILL,
    PASS_GARRISON_DEFENSE_SKILL,
    REGION_CENTER_DEFENSE_SKILL,
    REINFORCEMENT_JOIN_SKILL,
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
import { sumCultureAdjustedTroops, getUnitEliteTier } from '../systems/CultureCombat';
import { LandSeaSystem, LandTerrainSystem, type LandTerrainKind } from '../world/land-sea';
import { COMEBACK_TROOP_THRESHOLD } from './TacticalConstants';
import { gameLog } from '../utils/GameLogger';
import { audioManager } from '../audio/AudioManager';

function getFollowedArmyId(): string | null {
    try {
        return (window as any).game?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
    } catch {
        return null;
    }
}

/** 普将逆局阈值：单一真理源 TacticalConstants（纯常量，供审计侧解耦引用），此处再导出保持兼容 */
export { COMEBACK_TROOP_THRESHOLD };

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

/**
 * 三势适性：按开局局势(优/均/劣)返回该武将对应局的战术技。
 * 未配对应局技 → 返回 null（调用方不设 battleOverriddenSkillId，回退招牌单技，现役零影响）。
 */
export function resolveSituationalSkillId(unit: IBattleUnit, situation: BattleSituation): string | null {
    if (!unit.generalId) return null;
    const p = getGeneralProfile(unit.generalId);
    if (!p) return null;
    if (situation === 'advantage') return p.advantageSkillId ?? null;
    if (situation === 'disadvantage') return p.disadvantageSkillId ?? null;
    return p.balanceSkillId ?? null;
}

function sideIsFirstSortie(units: IBattleUnit[]): boolean {
    return units.some(u => u.isFirstSortieSinceDepart === true);
}


/** 名将开局战术 UI 延迟（秒）：对峙立绘就绪后再闪字（短战下限 / 无时长信息时兜底） */
export const OPENING_TACTICAL_UI_DELAY_SEC = 3;

// 开局脉冲按本场目标时长比例后移：长战不至于「开打就放完、后段空一大截」；短战仍早放。
// 只影响 UI 演出显示时机，不改技能效果生效时机（效果仍走原调度）。
const OPENING_UI_DELAY_RATIO = 0.3;      // 第一次脉冲 ≈ 目标时长的 30%——对齐三阶段第二幕开场（前1/3=相持，技能亮相引爆悬殊）
const OPENING_UI_DELAY_MAX_SEC = 20;     // 上限放宽到 20s：60s 长战的脉冲(18s)也能落在第二幕边界
/** 本场战斗基础目标时长（秒），由 BattleField 开战时注入；用于按比例后移开局脉冲 */
let currentBattleTargetDurationSec = 0;
export function setBattleTargetDurationForSkillUi(sec: number): void {
    currentBattleTargetDurationSec = Number.isFinite(sec) && sec > 0 ? sec : 0;
}
/** 开局脉冲显示延迟：按本场目标时长比例，钳在 [默认下限, 上限]；无时长信息则回退默认 */
function resolveOpeningUiDelaySec(): number {
    if (currentBattleTargetDurationSec <= 0) return OPENING_TACTICAL_UI_DELAY_SEC;
    const scaled = currentBattleTargetDurationSec * OPENING_UI_DELAY_RATIO;
    return Math.max(OPENING_TACTICAL_UI_DELAY_SEC, Math.min(OPENING_UI_DELAY_MAX_SEC, scaled));
}

/**
 * 统一调度开局技能 UI 脉冲：按本场时长比例延迟（对齐三阶段第二幕开场），音效与脉冲同刻。
 * 所有「开局」路径（V1/乘区/压敌/命运）都必须走比例延迟——散落的裸 setTimeout 固定 3s
 * 会让不同技能类的脉冲时刻不一致（2026-07 全面检查里揪出的坑）。
 */
function scheduleOpeningTacticalUi(unit: IBattleUnit, trigger: TacticalSkillTrigger): void {
    const delay = resolveOpeningUiDelaySec();
    trigger.uiDelaySec = delay;
    window.setTimeout(() => {
        onTacticalSkillTriggered?.(trigger);
        playGeneralSkillAudio(unit);
    }, delay * 1000);
}

export type TacticalSkillTrigger = {
    displayName: string;
    generalId: string;
    skillId: string;
    /** 0 = 立即；名将开局默认 OPENING_TACTICAL_UI_DELAY_SEC */
    uiDelaySec?: number;
};

export type ComebackTacticalContext = {
    battleElapsed: number;
    triggeredSkillIds: Set<string>;
    scheduleInvincible: (unit: IBattleUnit, startElapsed: number, durationSec: number) => void;
    onSidesChanged: () => void;
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

function findEligibleGeneralUnit(units: IBattleUnit[]): IBattleUnit | null {
    for (const u of units) {
        if (canUnitUseGeneralSkills(u)) return u;
    }
    return null;
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
    // 脉冲 + 音效同一时刻触发（都延迟到 delay 后），避免音效开战即响、演出却延后显示而对不上。
    // getFollowedArmyId 在触发时刻读取：延迟期间玩家若已切走跟拍对象，则不为它响（正确）。
    const fire = () => {
        onTacticalSkillTriggered?.(trigger);
        const followedId = getFollowedArmyId();
        if (followedId && unit.id === followedId) {
            audioManager.play('general_skill');
        }
    };
    if (delay <= 0) {
        fire();
    } else {
        window.setTimeout(fire, delay * 1000);
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

    const selfUnit = findEligibleGeneralUnit(sideUnits);
    const oppUnit = findEligibleGeneralUnit(opponentUnits);
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
): { lossReduction: number; entry?: TacticalSkillEntry } {
    const selfUnit = findEligibleGeneralUnit(sideUnits);
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
): {
    recoveryRate: number;
    biteWinnerLossMult: number;
    recoveryBlocked: boolean;
    recoveryEntry?: TacticalSkillEntry;
    biteEntry?: TacticalSkillEntry;
    blockEntry?: TacticalSkillEntry;
} {
    const winnerUnit = findEligibleGeneralUnit(winnerUnits);
    const winnerProfile = winnerUnit?.generalId ? getGeneralProfile(winnerUnit.generalId) : null;
    const loserUnit = findEligibleGeneralUnit(loserUnits);
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

    return {
        recoveryRate,
        biteWinnerLossMult: bite.mult,
        recoveryBlocked: block.blocked,
        recoveryEntry,
        biteEntry: bite.entry,
        blockEntry: block.entry,
    };
}

/**
 * 一侧有效战力：文化修正兵力 × 命运系 luck（#12–#20；默认 [0.8,1.2]）
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
): number {
    const base = sideBasePower(sideUnits);
    const { luck } = resolveSideOpeningFateLuck(
        sideUnits, opponentUnits, battleType, terrain, sideIsAttacker, options,
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
    // fixedDelay=true（援军入场亮相）例外——入场后尽快亮相，不等全场 30%。
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
    if (delay > 0) {
        window.setTimeout(() => {
            onTacticalSkillTriggered?.(trigger);
            playGeneralSkillAudio(unit);
        }, delay * 1000);
    } else {
        onTacticalSkillTriggered?.(trigger);
        playGeneralSkillAudio(unit);
    }
}

function playGeneralSkillAudio(unit: IBattleUnit): void {
    const followedId = getFollowedArmyId();
    if (followedId && unit.id === followedId) {
        audioManager.play('general_skill');
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
    // 【2026-07-03】战术技不再限品阶：名将/普将均可用全部 10 个战术技。
    //   触发时机由 skill.timing 决定（①–⑤开局放、⑥–⑩降至 60% 兵力放），品阶只决定是否额外带战略技。
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
): number {
    const unit = findEligibleGeneralUnit(sideUnits);
    if (!unit || !canUnitUseGeneralSkills(unit)) return 1;
    const skill = getTacticalSkillForTiming(unit, 'opening');
    if (!skill || skill.effect !== 'ally_mult_1_2') return 1;
    if (!bridgedOpeningEnhanceActive(sideUnits, opponentUnits, isAttacker, opts)) return 1;
    return skill.magnitude;
}

/**
 * 开局战术战力压制乘区（④ 不战而屈类敌方减益，名将/普将通用）。
 * 接受单个 IBattleUnit 或整支部队数组（与底层 applyEnemyDebuff 逻辑一致，
 * 多单位时用 findEligibleGeneralUnit 找第一个有资格的将领）。
 */
export function getOpeningTacticalEnemyPowerDebuffMultiplier(
    opponentUnits: IBattleUnit | IBattleUnit[] | null
): { value: number; label: string } | null {
    if (!opponentUnits) return null;
    const unit = Array.isArray(opponentUnits)
        ? findEligibleGeneralUnit(opponentUnits)
        : opponentUnits;
    if (!unit || !canUnitUseGeneralSkills(unit)) return null;
    const skill = getTacticalSkillForTiming(unit, 'opening');
    if (!skill || skill.effect !== 'enemy_mult_0_8') return null;
    return { value: skill.magnitude, label: skill.displayName };
}

/**
 * 战略开战战力乘区（须匹配战场类型 / 地形）
 */
export function getStrategicBattlePowerMultiplier(
    unit: IBattleUnit,
    battleType?: BattleType,
    terrain?: LandTerrainKind | null,
    side?: 'attacker' | 'defender',
): number {
    if (!canUnitUseGeneralSkills(unit) || !battleType) return 1;
    const profile = getGeneralProfile(unit.generalId);
    if (!profile?.strategicSkillId) return 1;
    const skill = getStrategicSkillDef(profile.strategicSkillId);
    if (!skill) return 1;
    switch (skill.effect) {
        // S③所向披靡：进攻方专用，攻城/野战通吃
        case 'attacker_power_mult':
            return side === 'attacker' ? skill.magnitude : 1;
        default:
            return 1;
    }
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

/** 据点锚定将领的战略效果乘数（无匹配则 1） */
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

/** 名将 S① 兵贵神速：行军速度乘区 */
export function getGeneralMarchSpeedMultiplier(unit: IBattleUnit): number {
    const skill = getGeneralStrategicSkillDef(unit);
    if (!skill || skill.effect !== 'march_speed_mult') return 1;
    return skill.magnitude;
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
        effectLabel: `城防×${parseFloat(mult.toFixed(2))}`,
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
        effectLabel: `城防×${parseFloat(mult.toFixed(2))}`,
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

function appendStrategicDisplayTag(
    tags: { name: string; effectLabel: string; isFamous: boolean; skillType: 'tactical' | 'strategic' }[],
    skillId: string,
): void {
    const str = getStrategicSkillDef(skillId);
    if (!str) return;
    if (tags.some((t) => t.name === str.displayName)) return;
    tags.push({
        name: str.displayName,
        effectLabel: formatStrategicEffectLabel(str),
        isFamous: true,
        skillType: 'strategic',
    });
}

export function getGeneralSkillDisplayTags(
    unit: IBattleUnit,
): { name: string; effectLabel: string; isFamous: boolean; skillType: 'tactical' | 'strategic' }[] {
    const profile = getGeneralProfile(unit.generalId);
    if (!profile) return [];
    const tags: { name: string; effectLabel: string; isFamous: boolean; skillType: 'tactical' | 'strategic' }[] = [];
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
    }

    // [2026-07-05 Fix] 战略技作为大地图效果，已剥离战斗面板，转至战略地图 CameraFollowUI 展示。

    return tags;
}

export function getExpeditionForageSkillDisplay(
    unit: IBattleUnit,
): { name: string; effectLabel: string } | null {
    const army = getArmyEntity(unit);
    if (!army?.expeditionTargetCityId) return null;
    return {
        name: EXPEDITION_FORAGE_SKILL.displayName,
        effectLabel: `胜后+${Math.round(EXPEDITION_FORAGE_SKILL.magnitude * 100)}%`,
    };
}

function formatTacticalEffectLabel(skill: TacticalSkillDef): string {
    switch (skill.effect) {
        case 'ally_mult_1_2':
            return `己战×${skill.magnitude}`;
        case 'enemy_mult_0_8':
            return '敌战×0.8';
        case 'ally_add_troops':
            return `增兵${Math.round(skill.magnitude * 100)}%`;
        case 'enemy_sub_troops':
            return `减兵${Math.round(skill.magnitude * 100)}%`;
        case 'ally_invincible':
            return `免伤${skill.magnitude}秒`;
        case 'ally_casualty_reduce':
            return `减损${Math.round(skill.magnitude * 100)}%`;
        case 'ally_luck_up':
            return `己运+${Math.round(skill.magnitude * 100)}%`;
        case 'enemy_luck_down':
            return `敌运-${Math.round(skill.magnitude * 100)}%`;
        case 'ally_luck_lock':
            return '运锁';
        case 'ally_recovery':
            return `恢复${Math.round(skill.magnitude * 100)}%`;
        case 'lose_effect':
            return '败方惩罚';
        case 'ally_elite_casualty':
            return `精锐减损${Math.round(skill.magnitude * 100)}%`;
        case 'enemy_counter':
            return '对抗敌技';
        case 'opening_counter':
            return '对抗削兵';
        case 'terrain_counter':
            return '对抗地形';
        case 'ally_recompute':
            return '重算强弱';
        default:
            return '';
    }
}

/**
 * v1 原生路径战术技（无 V1_EFFECT_BRIDGE 映射，getTacticalSkillDef 返回 null）的常驻卡片标签。
 * 纯显示用，不参与任何战斗机制——机制仍由原生路径（tryApplyV1OpeningTroop 等）实现。
 */
function formatV1NativeTacticalDisplayLabel(entry: { baseEffect: string; magnitude: number }): string {
    const pct = Math.round(entry.magnitude * 100);
    switch (entry.baseEffect) {
        case 'dual_sub_troops_opening':
            return `双损${pct}%`;
        default:
            return '';
    }
}

function formatStrategicEffectLabel(skill: ReturnType<typeof getStrategicSkillDef>): string {
    if (!skill) return '';
    switch (skill.effect) {
        case 'march_speed_mult':
            return `速度×${skill.magnitude}`;
        case 'post_battle_troop_pct':
            return `胜后+${Math.round(skill.magnitude * 100)}%`;
        case 'attacker_power_mult':
            return `攻方×${skill.magnitude}`;
        case 'defender_power_mult':
            return `守方×${skill.magnitude}`;
        case 'plain_power_mult':
            return `平原×${skill.magnitude}`;
        case 'mountain_power_mult':
            return `山地×${skill.magnitude}`;
        case 'water_power_mult':
            return `水域×${skill.magnitude}`;
        // ── 战略 v1 新系（Step2 接引擎前仅展示用）──
        case 'mountain_march_immunity':
            return '山地不减速';
        case 'ignore_small_city_zoc':
            return '无视小城拦截';
        case 'skip_post_battle_rest':
            return '胜后即开拔';
        case 'field_resupply':
            return '野外缓补';
        case 'city_growth_mult':
            return `出身城增长×${skill.magnitude}`;
        case 'recruit_cooldown_mult':
            return `募兵冷却×${skill.magnitude}`;
        default:
            return '';
    }
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
            const oppUnit = findEligibleGeneralUnit(opponents);
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
        const unit = findEligibleGeneralUnit(units);
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
    );
    return applyStrategicBattleToRolls(
        attackerUnits,
        defenderUnits,
        tactical.attRoll,
        tactical.defRoll,
        battleType,
        terrain,
    );
}

/** 援军编入后强弱重算：仅战略乘区（不重发开局/逆局战术） */
export function applyStrategicRollMultipliersOnly(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    battleType: BattleType,
): { attRoll: number; defRoll: number } {
    const terrain = getBattleTerrainKind([...attackerUnits, ...defenderUnits], battleType);
    return applyStrategicBattleToRolls(
        attackerUnits,
        defenderUnits,
        attRoll,
        defRoll,
        battleType,
        terrain,
    );
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
): void {
    if (!canUnitUseGeneralSkills(joinedUnit)) return;
    const sideUnits = isAttacker ? attackerUnits : defenderUnits;
    const eligible = findEligibleGeneralUnit(sideUnits);
    if (eligible?.id !== joinedUnit.id) return;

    const skill = getTacticalSkillForTiming(joinedUnit, 'opening');
    if (!skill) return;

    const shown = isAttacker ? openingUiShown.attacker : openingUiShown.defender;
    if (shown) return;

    if (isAttacker) openingUiShown.attacker = true;
    else openingUiShown.defender = true;

    emitTacticalUi(joinedUnit, skill, isAttacker ? '攻方' : '守方', {
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
): boolean {
    const unit = findEligibleGeneralUnit(sideUnits);
    if (!unit?.generalId) return true;
    const tacId = (unit ? getActiveTacticalSkillId(unit) : null);
    if (!tacId) return true;
    const entry = resolveGeneralTacticalEntry(tacId);
    if (!entry || entry.condition === 'always') return true;
    const selfTroops = sideUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const enemyTroops = opponentUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
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
    ): number => {
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) return roll;
        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!skill) return roll;

        if (skill.effect === 'ally_mult_1_2') {
            if (!bridgedOpeningEnhanceActive(units, opponentUnits, isAttacker, opts)) return roll;
            let mult = skill.magnitude;
            const oppUnit = findEligibleGeneralUnit(opponentUnits);
            const oppActiveId = oppUnit ? getActiveTacticalSkillId(oppUnit) : null;
            if (oppActiveId && mult > 1) {
                const selfTroops = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
                const oppTroops = opponentUnits.reduce((s, u) => s + Math.max(0, u.troops), 0);
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
            const next = roll * mult;
            gameLog(
                'battle',
                `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}有效战力 ×${parseFloat(mult.toFixed(2))} (${roll.toFixed(0)}→${next.toFixed(0)})`,
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
        return roll;
    };

    const applyEnemyDebuff = (
        units: IBattleUnit[],
        opponentRoll: number,
        sideLabel: string,
        isAttacker: boolean,
    ): number => {
        const unit = findEligibleGeneralUnit(units);
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
        return opponentRoll;
    };

    const applyInvRollEdge = (
        units: IBattleUnit[],
        roll: number,
        sideLabel: string,
    ): number => {
        const unit = findEligibleGeneralUnit(units);
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

    let outAtt = applyAllyMult(attackerUnits, defenderUnits, attRoll, '攻方', true);
    let outDef = applyAllyMult(defenderUnits, attackerUnits, defRoll, '守方', false);
    outDef = applyEnemyDebuff(attackerUnits, outDef, '攻方', true);
    outAtt = applyEnemyDebuff(defenderUnits, outAtt, '守方', false);
    outAtt = applyInvRollEdge(attackerUnits, outAtt, '攻方');
    outDef = applyInvRollEdge(defenderUnits, outDef, '守方');

    return { attRoll: outAtt, defRoll: outDef, trigger: lastTrigger };
}

/**
 * 普将逆局战术（侧兵力 ≤ 开战 50% 时触发，⑥–⑩）
 */
export function tryApplyComebackTacticalForSide(
    sideUnits: IBattleUnit[],
    opponentUnits: IBattleUnit[],
    sideTotalTroops: number,
    sideInitialTroops: number,
    sideLabel: string,
    ctx: ComebackTacticalContext,
): boolean {
    const unit = findEligibleGeneralUnit(sideUnits);
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
        ctx.onSidesChanged();
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
        case 'ally_mult_1_2':
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
): { sideRoll: number; opponentRoll: number } {
    const unit = findEligibleGeneralUnit(sideUnits);
    if (!unit?.generalId) return { sideRoll, opponentRoll };
    const skill = getTacticalSkillForTiming(unit, 'comeback');
    if (!skill || !triggeredSkillIds.has(skill.id)) return { sideRoll, opponentRoll };

    if (skill.effect === 'ally_mult_1_2') {
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

export function applyStrategicBattleToRolls(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    battleType: BattleType,
    terrain?: LandTerrainKind | null,
): { attRoll: number; defRoll: number } {
    const terrainKind =
        terrain ?? getBattleTerrainKind([...attackerUnits, ...defenderUnits], battleType);

    const applySide = (
        units: IBattleUnit[],
        opponents: IBattleUnit[],
        roll: number,
        sideLabel: string,
        side: 'attacker' | 'defender',
    ): number => {
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) return roll;
        let mult = getStrategicBattlePowerMultiplier(unit, battleType, terrainKind, side);
        if (Math.abs(mult - 1) < 0.001) return roll;

        const oppUnit = findEligibleGeneralUnit(opponents);
        const oppActiveId = oppUnit ? getActiveTacticalSkillId(oppUnit) : null;
        if (oppActiveId) {
            const oppTroops = opponents.reduce((s, u) => s + Math.max(0, u.troops), 0);
            const selfTroops = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
            const oppCtx = buildTacticalConditionContext({
                battleType,
                terrain: terrainKind,
                selfTroops: oppTroops,
                enemyTroops: selfTroops,
                selfInitialTroops: oppTroops,
                enemyInitialTroops: selfTroops,
                selfIsAttacker: side !== 'attacker',
                enemyHasFamousGeneral: sideHasFamousGeneral(units),
                isFirstSortieSinceDepart: sideIsFirstSortie(opponents),
            });
            const counter = resolveEnemyTerrainBuffCounter(oppActiveId, mult, oppCtx);
            if (counter.adjustedMult < mult) {
                mult = counter.adjustedMult;
                if (counter.entry && oppUnit) {
                    gameLog('battle', `⛰️ [对抗系] ${oppUnit.generalId} 触发【${counter.entry.displayName}】，压制了${sideLabel}地形优势！`);
                }
            }
        }

        const profile = getGeneralProfile(unit.generalId);
        const skill = profile?.strategicSkillId
            ? getStrategicSkillDef(profile.strategicSkillId)
            : null;
        const label = skill?.displayName ?? '战略';
        const next = roll * mult;
        gameLog(
            'battle',
            `🏯 [武将技] ${unit.generalId} 【${label}】 ${sideLabel}有效战力 ×${parseFloat(mult.toFixed(2))} (${roll.toFixed(0)}→${next.toFixed(0)})`,
        );
        return next;
    };

    const outAtt = applySide(attackerUnits, defenderUnits, attRoll, '攻方', 'attacker');
    const outDef = applySide(defenderUnits, attackerUnits, defRoll, '守方', 'defender');
    return { attRoll: outAtt, defRoll: outDef };
}

function applyPostBattleTroopPct(
    unit: IBattleUnit,
    skill: { displayName: string; effect: string; magnitude: number },
    source: string,
): number {
    if (skill.effect !== 'post_battle_troop_pct') return 0;
    const bonus = Math.floor(unit.troops * skill.magnitude);
    if (bonus <= 0) return 0;

    unit.setTroops(unit.troops + bonus);
    gameLog(
        'battle',
        `🌾 [武将技] ${unit.generalId ?? '?'} ${source}【${skill.displayName}】 +${bonus}（当前兵 +${(skill.magnitude * 100).toFixed(0)}%）`,
    );
    return bonus;
}

export function applyPostBattleStrategicBonus(
    unit: IBattleUnit,
    _battleType: BattleType,
): number {
    let total = 0;

    let appliedForage = false;

    const army = getArmyEntity(unit);
    if (army?.expeditionTargetCityId) {
        total += applyPostBattleTroopPct(unit, EXPEDITION_FORAGE_SKILL, '[远征] ');
        appliedForage = true;
    }

    if (canUnitUseGeneralSkills(unit)) {
        const profile = getGeneralProfile(unit.generalId);
        if (profile?.strategicSkillId) {
            const profileSkill = getStrategicSkillDef(profile.strategicSkillId);
            if (profileSkill && profileSkill.effect === 'post_battle_troop_pct' && !appliedForage) {
                total += applyPostBattleTroopPct(unit, profileSkill, '');
            } else if (profileSkill?.hiddenPostBattlePct && profileSkill.hiddenPostBattlePct > 0) {
                // 地图系战略技隐藏胜后续航：静默补血，不写日志、不显示 UI（见 StrategicSkillDef.hiddenPostBattlePct）
                const bonus = Math.floor(unit.troops * profileSkill.hiddenPostBattlePct);
                if (bonus > 0) {
                    unit.setTroops(unit.troops + bonus);
                    total += bonus;
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
): void {
    const attUnit = findEligibleGeneralUnit(attackerUnits);
    const defUnit = findEligibleGeneralUnit(defenderUnits);

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
        attUnit.battleOverriddenSkillId = null;
        if (defCounter.isStolen && defUnit) {
            defUnit.battleOverriddenSkillId = attSkillId;
        }
        gameLog('battle', `⚔️ [对抗系] ${defUnit?.generalId} 触发【${defCounter.entry?.displayName}】，看破了攻方战术技！`);
        if (defUnit && defCounter.entry) emitTacticalUiV1(defUnit, defCounter.entry, '守方', { immediate: true });
    }

    // Attacker counters defender
    if (attCounter.isNegated && defUnit) {
        defUnit.battleOverriddenSkillId = null;
        if (attCounter.isStolen && attUnit) {
            attUnit.battleOverriddenSkillId = defSkillId;
        }
        gameLog('battle', `⚔️ [对抗系] ${attUnit?.generalId} 触发【${attCounter.entry?.displayName}】，看破了守方战术技！`);
        if (attUnit && attCounter.entry) emitTacticalUiV1(attUnit, attCounter.entry, '攻方', { immediate: true });
    }
}
