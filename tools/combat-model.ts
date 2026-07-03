/**
 * 战斗模型（无头，供 tools/ 下各测试程序复用）
 * ───────────────────────────────────────────────────────────────
 * 忠实复刻游戏战斗数学（对照 CombatSystem / BattleField / CultureCombat / GeneralSkillCombat）：
 *   1. 单位固定系数 = 文化区(野战/守城) × 关隘拒险(仅 pass 守军) × 精锐 tier 或 远征
 *   2. 一侧修正兵力 = Σ(兵力 × 固定系数)
 *   3. 一侧有效战力 = 修正兵力 × luck，luck ∈ [LUCK_MIN, LUCK_MAX]
 *   4. 武将技挂在有效战力上（开局③④⑤乘区 / 战略攻守地形乘区 / 逆局⑥⑦⑧⑨⑩），战力高者胜
 *
 * 所有 magnitude / 系数从游戏源文件 import，改游戏数值后重跑即同步。
 * ①以逸待劳 已于 2026-07-03 改为 ally_mult_1_2（战力乘区，不写真实兵力）→ 本模型自动经 catalog 生效。
 */

import { GameConfig } from '../src/config/GameConfig';
import {
    buildTacticalConditionContext,
    resolveGeneralTacticalEntry,
    resolveOpeningFateEntry,
    resolveOpeningLuckMultiplier,
    resolveMidBattleCasualtyReduction,
    resolvePostBattleRecoveryRate,
    resolveLoserBiteWinnerLossMult,
    resolveWinnerRecoveryBlockedByLoser,
    resolveOpeningTroopCutCounter,
    resolveEnemyTerrainBuffCounter,
    resolveOpeningTroopEffect,
} from '../src/combat/TacticalSkillResolver';

/** 战损系 baseEffect 集合（v1 catalog；判定是否需逐帧存活模拟） */
const CASUALTY_EFFECTS = new Set<string>([
    'win_casualty_reduction',
    'elite_casualty_reduction',
    'post_recovery_rate',
    'lose_enemy_casualty_boost',
    'lose_zero_enemy_recovery',
]);
import type { BattleType } from '../src/combat/CombatSystem';
import {
    TACTICAL_SKILL_CATALOG,
    STRATEGIC_SKILL_CATALOG,
    GENERAL_PROFILES,
    type GeneralProfile,
    type GeneralTier,
} from '../src/data/GeneralSkills';

export { TACTICAL_SKILL_CATALOG, STRATEGIC_SKILL_CATALOG, GENERAL_PROFILES };
export type { GeneralProfile, GeneralTier };

// ────────────────────────── 常量（全部来自游戏源） ──────────────────────────
export const { LUCK_MIN, LUCK_MAX, ELITE_TIER_MULT, CAMPAIGN_LEGION_MULT } = GameConfig.COMBAT;
export const TIER_TABLE = GameConfig.CULTURE_COMBAT.TIER_TABLE;
export const PASS_GARRISON_MULT = GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT;

/** 可调运行时配置（默认对齐游戏 GeneralSkillCombat / BattleField 行为） */
export const simConfig = {
    /** 逆局阈值 = GeneralSkillCombat.COMEBACK_TROOP_THRESHOLD */
    comebackThreshold: 0.80,
    /** 逆局重算掷 luck = BattleField 逆局路径行为（概率化翻盘） */
    comebackRollLuck: true,
};

export type Role = 'field' | 'garrison';
export type Terrain = 'plain' | 'mountain' | 'sea' | null;
export type Side = 'attacker' | 'defender';

/** 内联武将档（测试任意技能组合，无需真实 generalId） */
export type InlineGeneral = { tier: GeneralTier; tacticalSkillId?: string; strategicSkillId?: string };

export interface UnitSpec {
    name?: string;
    troops: number;
    maxTroops?: number;
    region?: string;          // TIER_TABLE 的键；缺省 CENTRAL(×1.0)
    role?: Role;              // field=野战单位 / garrison=守城单位
    pass?: boolean;           // 关隘据点（仅 garrison 生效 ×PASS_GARRISON_MULT）
    eliteTier?: number | null;// 0..4 → ELITE_TIER_MULT；null=非精锐
    campaign?: boolean;       // 非精锐远征军团 ×CAMPAIGN_LEGION_MULT
    general?: InlineGeneral | string | null; // 内联档 或 真实 GENERAL_PROFILES 键
    multOverride?: number;    // 直接指定固定系数（标定用，跳过文化/精锐推导）
}

export interface Unit {
    name: string;
    troops: number;
    maxTroops: number;
    mult: number;
    profile: GeneralProfile | null;
    /** 精锐档 0..4；null=非精锐（战损系 has_elite_legion 判定用） */
    eliteTier: number | null;
}

// ────────────────────────── 单位构建 ──────────────────────────
function resolveProfile(g: UnitSpec['general']): GeneralProfile | null {
    if (!g) return null;
    if (typeof g === 'string') return GENERAL_PROFILES[g] ?? null;
    return {
        generalId: '__inline__',
        tier: g.tier,
        tacticalSkillId: g.tacticalSkillId ?? '',
        strategicSkillId: g.strategicSkillId,
    };
}

function cultureMult(region: string | undefined, role: Role): number {
    if (!region) return 1;
    const t = TIER_TABLE[region];
    if (!t) return 1;
    return role === 'field' ? t[0] : t[1];
}

function eliteMult(spec: UnitSpec): number {
    if (spec.eliteTier !== null && spec.eliteTier !== undefined) {
        return ELITE_TIER_MULT[spec.eliteTier] ?? CAMPAIGN_LEGION_MULT;
    }
    if (spec.campaign && spec.role !== 'garrison') return CAMPAIGN_LEGION_MULT;
    return 1;
}

export function makeUnit(spec: UnitSpec): Unit {
    const role: Role = spec.role ?? 'field';
    const passMult = spec.pass && role === 'garrison' ? PASS_GARRISON_MULT : 1;
    const mult = spec.multOverride ?? cultureMult(spec.region, role) * passMult * eliteMult(spec);
    return {
        name: spec.name ?? 'unit',
        troops: spec.troops,
        maxTroops: spec.maxTroops ?? spec.troops,
        mult,
        profile: resolveProfile(spec.general),
        eliteTier: spec.eliteTier ?? null,
    };
}

// ────────────────────────── 技能查询 ──────────────────────────
function eligible(units: Unit[]): Unit | null {
    for (const u of units) if (u.profile && u.troops > 0) return u;
    return null;
}
/** 只看 profile、不看兵力：战后结算取败方技（败方兵力已归零，不能用 eligible） */
function eligibleProfile(units: Unit[]): Unit | null {
    for (const u of units) if (u.profile) return u;
    return null;
}
function openingTacticalOf(u: Unit | null) {
    const id = u?.profile?.tacticalSkillId;
    if (!id) return null;
    const s = TACTICAL_SKILL_CATALOG[id];
    return s && s.timing === 'opening' ? s : null;
}
function comebackTacticalOf(u: Unit | null) {
    const id = u?.profile?.tacticalSkillId;
    if (!id) return null;
    const s = TACTICAL_SKILL_CATALOG[id];
    return s && s.timing === 'comeback' ? s : null;
}
function strategicOf(u: Unit | null) {
    const id = u?.profile?.strategicSkillId;
    return id ? (STRATEGIC_SKILL_CATALOG[id] ?? null) : null;
}

export function rollLuck(): number {
    return LUCK_MIN + Math.random() * (LUCK_MAX - LUCK_MIN);
}

/** 一侧开战 luck（命运系 #12–#20；与 GeneralSkillCombat.rollSideEffectivePowerWithOpeningFate 对齐） */
export function rollLuckForSide(
    own: Unit[],
    opp: Unit[],
    battleType: BattleType,
    terrain: Terrain,
    sideIsAttacker: boolean,
): number {
    const selfTroops = own.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const enemyTroops = opp.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const ctx = buildTacticalConditionContext({
        battleType,
        terrain,
        selfTroops,
        enemyTroops,
        selfInitialTroops: selfTroops,
        enemyInitialTroops: enemyTroops,
        selfIsAttacker: sideIsAttacker,
        enemyHasFamousGeneral: eligible(opp)?.profile?.tier === 'famous',
    });
    const selfFate = resolveOpeningFateEntry(eligible(own)?.profile?.tacticalSkillId);
    const oppFate = resolveOpeningFateEntry(eligible(opp)?.profile?.tacticalSkillId);
    return resolveOpeningLuckMultiplier(ctx, selfFate, oppFate).multiplier;
}
function sumAdjusted(units: Unit[]): number {
    let s = 0;
    for (const u of units) if (u.troops > 0) s += u.troops * u.mult;
    return s;
}

// ────────────────────────── 开局技能应用 ──────────────────────────
/**
 * ②：掷色前减敌兵（①现为乘区不改兵；⑤免伤不改兵，掷点乘区在 roll 阶段）。
 * own 的开局减兵技作用于 opp（被减方）；opp 若持对抗系 nullify(空城)/reflect(诱敌)，
 * 经 resolveOpeningTroopCutCounter 修正实际减兵，并把 reflect 的反弹伤害施加回 own。
 */
function applyOpeningPreRollTroops(
    own: Unit[], opp: Unit[], ownIsAttacker: boolean, battleType: BattleType, terrain: Terrain,
): void {
    const ownUnit = eligible(own);
    const skillId = ownUnit?.profile?.tacticalSkillId;
    if (!skillId) return;

    const oppTroops = opp.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const ownTroops = own.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const ownCtx = buildTacticalConditionContext({
        battleType, terrain,
        selfTroops: ownTroops, enemyTroops: oppTroops,
        selfInitialTroops: ownTroops, enemyInitialTroops: oppTroops,
        selfIsAttacker: ownIsAttacker,
        enemyHasFamousGeneral: eligible(opp)?.profile?.tier === 'famous',
    });
    const effect = resolveOpeningTroopEffect(skillId, ownCtx);
    if (!effect.entry) return;

    if (effect.selfCutMagnitude > 0) {
        for (const u of own) {
            if (u.troops <= 0) continue;
            u.troops = Math.max(0, u.troops - Math.floor(u.troops * effect.selfCutMagnitude));
        }
    }

    if (effect.enemyCutMagnitude > 0) {
        const oppCtx = buildTacticalConditionContext({
            battleType, terrain,
            selfTroops: oppTroops, enemyTroops: ownTroops,
            selfInitialTroops: oppTroops, enemyInitialTroops: ownTroops,
            selfIsAttacker: !ownIsAttacker,
            enemyHasFamousGeneral: ownUnit?.profile?.tier === 'famous',
        });
        const counter = resolveOpeningTroopCutCounter(
            eligible(opp)?.profile?.tacticalSkillId, effect.enemyCutMagnitude, oppCtx,
        );
        if (counter.selfCutMagnitude > 0) {
            for (const u of opp) {
                if (u.troops <= 0) continue;
                u.troops = Math.max(0, u.troops - Math.floor(u.troops * counter.selfCutMagnitude));
            }
        }
        if (counter.reflectBackMagnitude > 0) {
            for (const u of own) {
                if (u.troops <= 0) continue;
                u.troops = Math.max(0, u.troops - Math.floor(u.troops * counter.reflectBackMagnitude));
            }
        }
    }

    if (effect.allyAddMagnitude > 0) {
        for (const u of own) {
            if (u.troops <= 0) continue;
            const bonus = Math.floor(u.troops * effect.allyAddMagnitude);
            if (bonus <= 0) continue;
            u.troops = Math.min(u.troops + bonus, u.maxTroops);
        }
    }
}

/** ①③④⑤：开局战术掷色乘区（顺序同 applyOpeningTacticalToRolls） */
function applyOpeningRollMults(
    attU: Unit[], defU: Unit[], attRoll: number, defRoll: number,
): { attRoll: number; defRoll: number } {
    const a = openingTacticalOf(eligible(attU));
    const d = openingTacticalOf(eligible(defU));
    let oa = attRoll, od = defRoll;
    if (a?.effect === 'ally_mult_1_2') oa *= a.magnitude;
    if (d?.effect === 'ally_mult_1_2') od *= d.magnitude;
    if (a?.effect === 'enemy_mult_0_8') od *= a.magnitude;
    if (d?.effect === 'enemy_mult_0_8') oa *= d.magnitude;
    if (a?.effect === 'ally_invincible' && a.rollEdge) oa *= a.rollEdge;
    if (d?.effect === 'ally_invincible' && d.rollEdge) od *= d.rollEdge;
    return { attRoll: oa, defRoll: od };
}

/** 战略技掷色乘区（须匹配攻守/地形） */
function strategicMult(u: Unit | null, side: Side, terrain: Terrain): number {
    const s = strategicOf(u);
    if (!s) return 1;
    switch (s.effect) {
        case 'attacker_power_mult': return side === 'attacker' ? s.magnitude : 1;
        case 'defender_power_mult': return side === 'defender' ? s.magnitude : 1;
        case 'plain_power_mult':    return terrain === 'plain' ? s.magnitude : 1;
        case 'mountain_power_mult': return terrain === 'mountain' ? s.magnitude : 1;
        case 'water_power_mult':    return terrain === 'sea' ? s.magnitude : 1;
        default: return 1; // march_speed / post_battle 不参与掷色
    }
}
function applyStrategicRollMults(
    attU: Unit[], defU: Unit[], attRoll: number, defRoll: number, terrain: Terrain,
    battleType: BattleType = 'field',
): { attRoll: number; defRoll: number } {
    let attG = strategicMult(eligible(attU), 'attacker', terrain);
    let defG = strategicMult(eligible(defU), 'defender', terrain);
    // 地形对抗（#46 暗度陈仓 cancel / #47 声东击西 halve）：一方持对抗技 → 削弱对手地形增益。
    const attTroops = attU.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const defTroops = defU.reduce((s, u) => s + Math.max(0, u.troops), 0);
    const mkCtx = (selfT: number, enemyT: number, isAtt: boolean) =>
        buildTacticalConditionContext({
            battleType, terrain,
            selfTroops: selfT, enemyTroops: enemyT,
            selfInitialTroops: selfT, enemyInitialTroops: enemyT,
            selfIsAttacker: isAtt,
        });
    const attId = eligible(attU)?.profile?.tacticalSkillId;
    const defId = eligible(defU)?.profile?.tacticalSkillId;
    defG = resolveEnemyTerrainBuffCounter(attId, defG, mkCtx(attTroops, defTroops, true)).adjustedMult;
    attG = resolveEnemyTerrainBuffCounter(defId, attG, mkCtx(defTroops, attTroops, false)).adjustedMult;
    return { attRoll: attRoll * attG, defRoll: defRoll * defG };
}

/** ⑧⑨⑩ 逆局掷色乘区（refresh 时对已触发侧生效） */
function applyComebackRollMult(u: Unit | null, sideRoll: number, oppRoll: number, triggered: boolean) {
    const s = comebackTacticalOf(u);
    if (!s || !triggered) return { sideRoll, oppRoll };
    if (s.effect === 'ally_mult_1_2') return { sideRoll: sideRoll * s.magnitude, oppRoll };
    if (s.effect === 'enemy_mult_0_8') return { sideRoll, oppRoll: oppRoll * s.magnitude };
    if (s.effect === 'ally_invincible' && s.rollEdge) return { sideRoll: sideRoll * s.rollEdge, oppRoll };
    return { sideRoll, oppRoll };
}

// ────────────────────────── 威慑（影响强方战损地板 → 存活率） ──────────────────────────
function unitIntimidation(u: Unit, eliteTier: number | null): number {
    const gen = u.profile?.tier === 'famous' ? 2 : u.profile?.tier === 'ordinary' ? 1 : 0;
    const elite = eliteTier === null ? 0 : [2, 1.5, 1, 0.5, 0.25][eliteTier] ?? 0;
    return gen + elite;
}

// ────────────────────────── 单局模拟 ──────────────────────────
export interface SimResult {
    attackerWon: boolean;
    /** 战斗结束时存活兵力（逐帧模拟才有意义；快速判定路径为开战兵力） */
    attSurvivors: number;
    defSurvivors: number;
}

/**
 * 一局：克隆 spec → 开局定强弱；forceTicks 或有逆局技时逐帧模拟（可得存活兵力）。
 * forceTicks=true 时无论有无逆局技都逐帧跑（用于统计存活率）。
 */
export function simulateOnce(
    attSpecs: UnitSpec[], defSpecs: UnitSpec[], terrain: Terrain, forceTicks = false,
    battleType: BattleType = 'field',
): SimResult {
    const att = attSpecs.map(makeUnit);
    const def = defSpecs.map(makeUnit);

    applyOpeningPreRollTroops(att, def, true, battleType, terrain);
    applyOpeningPreRollTroops(def, att, false, battleType, terrain);

    const attInit = att.reduce((s, u) => s + u.troops, 0);
    const defInit = def.reduce((s, u) => s + u.troops, 0);

    let attRoll = sumAdjusted(att) * rollLuckForSide(att, def, battleType, terrain, true);
    let defRoll = sumAdjusted(def) * rollLuckForSide(def, att, battleType, terrain, false);
    ({ attRoll, defRoll } = applyOpeningRollMults(att, def, attRoll, defRoll));
    ({ attRoll, defRoll } = applyStrategicRollMults(att, def, attRoll, defRoll, terrain, battleType));

    const attackerStronger = attRoll >= defRoll;

    const attCb = comebackTacticalOf(eligible(att));
    const defCb = comebackTacticalOf(eligible(def));
    const hasCasualtySkill =
        casualtySkillOf(eligible(att)) || casualtySkillOf(eligible(def));
    // 快速判定仅在「无逆局技、无战损技、非强制逐帧」时走：战损系需逐帧才能体现存活。
    if (!attCb && !defCb && !hasCasualtySkill && !forceTicks) {
        return {
            attackerWon: attackerStronger,
            attSurvivors: attackerStronger ? attInit : 0,
            defSurvivors: attackerStronger ? 0 : defInit,
        };
    }
    return simulateTicks(att, def, attInit, defInit, attackerStronger, terrain, battleType);
}

/** 该单位是否持战损系技（v1 baseEffect；用于决定是否走逐帧存活模拟） */
function casualtySkillOf(u: Unit | null): boolean {
    const id = u?.profile?.tacticalSkillId;
    if (!id) return false;
    const entry = resolveGeneralTacticalEntry(id);
    return entry ? CASUALTY_EFFECTS.has(entry.baseEffect) : false;
}

function simulateTicks(
    att: Unit[], def: Unit[], attInit: number, defInit: number,
    attackerStronger: boolean, terrain: Terrain, battleType: BattleType = 'field',
): SimResult {
    const dt = 0.1;
    const targetDuration = calcDuration(attInit + defInit);

    let elapsed = 0;
    let attTriggered = false, defTriggered = false;
    let attInvUntil = -1, defInvUntil = -1;
    const eliteTierAtt = null, eliteTierDef = null;

    const attU = () => att[0];
    const defU = () => def[0];

    const recompute = () => {
        let a = att[0].troops * att[0].mult;
        let d = def[0].troops * def[0].mult;
        ({ attRoll: a, defRoll: d } = applyOpeningRollMults(att, def, a, d));
        ({ attRoll: a, defRoll: d } = applyStrategicRollMults(att, def, a, d, terrain, battleType));
        let r1 = applyComebackRollMult(attU(), a, d, attTriggered); a = r1.sideRoll; d = r1.oppRoll;
        let r2 = applyComebackRollMult(defU(), d, a, defTriggered); d = r2.sideRoll; a = r2.oppRoll;
        if (simConfig.comebackRollLuck) { a *= rollLuck(); d *= rollLuck(); }
        attackerStronger = a >= d;
    };

    const fearLoss = (): number => {
        const strongIntim = attackerStronger
            ? unitIntimidation(attU(), eliteTierAtt) : unitIntimidation(defU(), eliteTierDef);
        const weakIntim = attackerStronger
            ? unitIntimidation(defU(), eliteTierDef) : unitIntimidation(attU(), eliteTierAtt);
        return 0.8 * Math.max(0, Math.min(1, (strongIntim - weakIntim) / 4));
    };

    // 战损系战中减损（强方 win_casualty_reduction / elite_casualty_reduction）：与引擎一致，
    // 与 fearLoss 叠乘抬高强方存活地板；穷寇勿迫用实时兵力，逐帧自然反映「敌残才触发」。
    const casualtyRed = (): number => {
        const strongerUnit = attackerStronger ? attU() : defU();
        const id = strongerUnit?.profile?.tacticalSkillId;
        if (!id) return 0;
        const sInit = attackerStronger ? attInit : defInit;
        const wInit = attackerStronger ? defInit : attInit;
        const sNow = attackerStronger ? att[0].troops : def[0].troops;
        const wNow = attackerStronger ? def[0].troops : att[0].troops;
        const sHasElite = (attackerStronger ? att : def).some(u => u.eliteTier != null);
        const ctx = buildTacticalConditionContext({
            battleType, terrain,
            selfTroops: sNow, enemyTroops: wNow,
            selfInitialTroops: sInit, enemyInitialTroops: wInit,
            selfIsAttacker: attackerStronger,
            selfHasEliteLegion: sHasElite,
        });
        return resolveMidBattleCasualtyReduction([id], ctx).lossReduction;
    };

    while (att[0].troops >= 1 && def[0].troops >= 1 && elapsed < targetDuration) {
        elapsed += dt;
        const timeLeft = Math.max(0.05, targetDuration - elapsed);

        const strongerInit = attackerStronger ? attInit : defInit;
        const weakerInit = attackerStronger ? defInit : attInit;
        const strongerTroops = attackerStronger ? att[0].troops : def[0].troops;
        const weakerTroops = attackerStronger ? def[0].troops : att[0].troops;

        const ratio = Math.max(1, strongerInit / Math.max(1, weakerInit));
        const strongerFloor =
            strongerInit * (1 - Math.max(0.05, 0.5 / ratio) * (1 - fearLoss()) * (1 - casualtyRed()));

        const weakerDmg = (weakerTroops / timeLeft) * dt;
        const strongerDmg = (Math.max(0, strongerTroops - strongerFloor) / timeLeft) * dt;

        const attInv = elapsed < attInvUntil;
        const defInv = elapsed < defInvUntil;

        if (attackerStronger) {
            if (!defInv) def[0].troops = Math.max(0, def[0].troops - weakerDmg);
            if (!attInv) att[0].troops = Math.max(0, att[0].troops - strongerDmg);
        } else {
            if (!attInv) att[0].troops = Math.max(0, att[0].troops - weakerDmg);
            if (!defInv) def[0].troops = Math.max(0, def[0].troops - strongerDmg);
        }

        if (!attTriggered) {
            const cb = comebackTacticalOf(attU());
            if (cb && att[0].troops <= attInit * simConfig.comebackThreshold && att[0].troops >= 1) {
                attTriggered = true;
                applyComebackEffect(cb, att, def, () => { attInvUntil = elapsed + cb.magnitude; });
                recompute();
            }
        }
        if (!defTriggered) {
            const cb = comebackTacticalOf(defU());
            if (cb && def[0].troops <= defInit * simConfig.comebackThreshold && def[0].troops >= 1) {
                defTriggered = true;
                applyComebackEffect(cb, def, att, () => { defInvUntil = elapsed + cb.magnitude; });
                recompute();
            }
        }
    }

    const attS0 = att[0].troops, defS0 = def[0].troops;
    let attackerWon: boolean;
    if (attS0 < 1 && defS0 >= 1) attackerWon = false;
    else if (defS0 < 1 && attS0 >= 1) attackerWon = true;
    else attackerWon = attackerStronger;

    // ── 战后战损结算（契约顺序 ①斩根→②恢复→③咬人→④保底，与 BattleField.resolve 一致）──
    const winnerUnits = attackerWon ? att : def;
    const loserUnits = attackerWon ? def : att;
    const winnerInit = attackerWon ? attInit : defInit;
    const loserInit = attackerWon ? defInit : attInit;
    const base = GameConfig.COMBAT.POST_BATTLE_RECOVERY_RATE;
    // 用 eligibleProfile（忽略兵力）：败方战斗结束时兵力已归零，eligible 会漏取其技
    const winnerId = eligibleProfile(winnerUnits)?.profile?.tacticalSkillId ?? null;
    const loserId = eligibleProfile(loserUnits)?.profile?.tacticalSkillId ?? null;
    const mkCtx = (selfInit: number, enemyInit: number, selfIsAtt: boolean) =>
        buildTacticalConditionContext({
            battleType, terrain,
            selfTroops: selfInit, enemyTroops: enemyInit,
            selfInitialTroops: selfInit, enemyInitialTroops: enemyInit,
            selfIsAttacker: selfIsAtt,
        });
    const winnerCtx = mkCtx(winnerInit, loserInit, attackerWon);
    const loserCtx = mkCtx(loserInit, winnerInit, !attackerWon);
    const blocked = resolveWinnerRecoveryBlockedByLoser([loserId], loserCtx).blocked;
    const recRate = blocked ? 0 : resolvePostBattleRecoveryRate([winnerId], winnerCtx, base).rate;
    const biteMult = resolveLoserBiteWinnerLossMult([loserId], loserCtx).mult;
    const wUnit = winnerUnits[0];
    const lost = Math.max(0, winnerInit - wUnit.troops);
    const recovery = Math.floor(lost * recRate);
    const extraBite = biteMult > 1 ? Math.floor(lost * (biteMult - 1)) : 0;
    const floor10 = Math.floor(winnerInit * 0.10);
    let finalW = wUnit.troops + recovery - extraBite;
    if (extraBite > 0 && finalW < floor10) finalW = floor10;

    const attS = attackerWon ? finalW : 0;
    const defS = attackerWon ? 0 : finalW;
    return { attackerWon, attSurvivors: Math.round(attS), defSurvivors: Math.round(defS) };
}

function applyComebackEffect(
    skill: (typeof TACTICAL_SKILL_CATALOG)[string],
    own: Unit[], opp: Unit[], scheduleInv: () => void,
): void {
    if (skill.effect === 'ally_add_troops') {
        for (const u of own) {
            if (u.troops <= 0) continue;
            u.troops = Math.min(u.troops + Math.floor(u.maxTroops * skill.magnitude), u.maxTroops);
        }
    } else if (skill.effect === 'enemy_sub_troops') {
        for (const u of opp) {
            if (u.troops <= 0) continue;
            u.troops = Math.max(0, u.troops - Math.floor(u.troops * skill.magnitude));
        }
    } else if (skill.effect === 'ally_invincible') {
        scheduleInv();
    }
}

function calcDuration(totalTroops: number): number {
    const c = GameConfig.COMBAT;
    const ratio = Math.min(1, Math.max(0, totalTroops) / c.BATTLE_DURATION_TROOPS_SCALE);
    return Math.min(
        c.BATTLE_DURATION_MAX_SEC,
        Math.max(c.BATTLE_DURATION_MIN_SEC,
            c.BATTLE_DURATION_MIN_SEC + (c.BATTLE_DURATION_MAX_SEC - c.BATTLE_DURATION_MIN_SEC) * ratio),
    );
}

// ────────────────────────── 蒙特卡洛聚合 ──────────────────────────
function clone(specs: UnitSpec[]): UnitSpec[] {
    return specs.map((s) => ({ ...s }));
}

/** 攻方胜率 */
export function winRate(
    attSpecs: UnitSpec[], defSpecs: UnitSpec[], trials: number, terrain: Terrain = 'plain',
    battleType: BattleType = 'field',
): number {
    let wins = 0;
    for (let i = 0; i < trials; i++) {
        if (simulateOnce(clone(attSpecs), clone(defSpecs), terrain, false, battleType).attackerWon) wins++;
    }
    return wins / trials;
}

export interface AggResult {
    attackerWinRate: number;
    /** 攻方胜局的平均存活兵力 */
    attackerAvgSurvivorsOnWin: number;
    /** 攻方开战兵力（用于算存活率） */
    attackerInitTroops: number;
    trials: number;
}

/** 聚合：胜率 + 攻方胜局平均存活兵力（forceTicks 逐帧，用于跟随军团续航评估） */
export function aggregate(
    attSpecs: UnitSpec[], defSpecs: UnitSpec[], trials: number, terrain: Terrain = 'plain',
    battleType: BattleType = 'field',
): AggResult {
    let wins = 0, survSum = 0;
    const initTroops = attSpecs.reduce((s, u) => s + u.troops, 0);
    for (let i = 0; i < trials; i++) {
        const r = simulateOnce(clone(attSpecs), clone(defSpecs), terrain, true, battleType);
        if (r.attackerWon) { wins++; survSum += r.attSurvivors; }
    }
    return {
        attackerWinRate: wins / trials,
        attackerAvgSurvivorsOnWin: wins > 0 ? survSum / wins : 0,
        attackerInitTroops: initTroops,
        trials,
    };
}

export { clone };
