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
    REINFORCEMENT_JOIN_SKILL,
    type TacticalSkillDef,
    type GeneralTier,
} from '../data/GeneralSkills';
import { LandSeaSystem, LandTerrainSystem, type LandTerrainKind } from '../world/land-sea';
import { gameLog } from '../utils/GameLogger';
import { audioManager } from '../audio/AudioManager';

function getFollowedArmyId(): string | null {
    try {
        return (window as any).game?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
    } catch {
        return null;
    }
}

/** 普将逆局：侧总兵力 ≤ 开战该侧总兵力 × 此比例时触发 */
export const COMEBACK_TROOP_THRESHOLD = 0.5;

/** 名将开局战术 UI 延迟（秒）：对峙立绘就绪后再闪字 */
export const OPENING_TACTICAL_UI_DELAY_SEC = 3;

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

function getTacticalSkill(unit: IBattleUnit): TacticalSkillDef | null {
    const profile = getGeneralProfile(unit.generalId);
    if (!profile) return null;
    return getTacticalSkillDef(profile.tacticalSkillId) ?? null;
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
    options?: { uiDelaySec?: number; immediate?: boolean },
): void {
    const delay =
        options?.immediate === true
            ? 0
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
    opts?: { useMaxTroops?: boolean },
): number {
    let added = 0;
    for (const u of units) {
        if (u.troops <= 0) continue;
        const base = opts?.useMaxTroops ? (u.maxTroops ?? u.troops) : u.troops;
        const bonus = Math.floor(base * ratio);
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
    tier: GeneralTier,
    triggeredSkillIds: Set<string>,
): boolean {
    if (skill.timing === 'opening' && tier !== 'famous') return false;
    if (skill.timing === 'comeback' && tier !== 'ordinary') return false;
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

/** 开局战术战力乘区（UI 徽章；仅名将开局 ③④ 类） */
export function getOpeningTacticalPowerMultiplier(unit: IBattleUnit): number {
    if (!canUnitUseGeneralSkills(unit)) return 1;
    const profile = getGeneralProfile(unit.generalId);
    if (profile?.tier !== 'famous') return 1;
    const skill = getTacticalSkillForTiming(unit, 'opening');
    if (!skill || skill.effect !== 'ally_mult_1_2') return 1;
    return skill.magnitude;
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
        // S③所向披靡（原含 S②攻城拔寨）：进攻方专用，攻城/野战通吃
        case 'attacker_power_mult':
            return side === 'attacker' ? skill.magnitude : 1;
        // S⑧固若金汤：防守方专用
        case 'defender_power_mult':
            return side === 'defender' ? skill.magnitude : 1;
        case 'plain_power_mult':
            return terrain === 'plain' ? skill.magnitude : 1;
        case 'mountain_power_mult':
            return terrain === 'mountain' ? skill.magnitude : 1;
        case 'water_power_mult':
            return terrain === 'sea' ? skill.magnitude : 1;
        default:
            return 1;
    }
}

/** 名将 S① 兵贵神速：行军速度乘区 */
export function getGeneralMarchSpeedMultiplier(unit: IBattleUnit): number {
    if (!canUnitUseGeneralSkills(unit)) return 1;
    const profile = getGeneralProfile(unit.generalId);
    if (!profile?.strategicSkillId) return 1;
    const skill = getStrategicSkillDef(profile.strategicSkillId);
    if (!skill || skill.effect !== 'march_speed_mult') return 1;
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
    tags: { name: string; effectLabel: string; isFamous: boolean }[],
    skillId: string,
): void {
    const str = getStrategicSkillDef(skillId);
    if (!str) return;
    if (tags.some((t) => t.name === str.displayName)) return;
    tags.push({
        name: str.displayName,
        effectLabel: formatStrategicEffectLabel(str),
        isFamous: true,
    });
}

export function getGeneralSkillDisplayTags(
    unit: IBattleUnit,
): { name: string; effectLabel: string; isFamous: boolean }[] {
    const profile = getGeneralProfile(unit.generalId);
    if (!profile) return [];
    const tags: { name: string; effectLabel: string; isFamous: boolean }[] = [];
    const famous = profile.tier === 'famous';

    const tac = getTacticalSkillDef(profile.tacticalSkillId);
    if (tac) {
        tags.push({
            name: tac.displayName,
            effectLabel: formatTacticalEffectLabel(tac),
            isFamous: famous,
        });
    }

    if (profile.strategicSkillId) {
        appendStrategicDisplayTag(tags, profile.strategicSkillId);
    }

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
            return `敌战×${skill.magnitude}`;
        case 'ally_add_troops':
            return `己兵+${Math.round(skill.magnitude * 100)}%`;
        case 'enemy_sub_troops':
            return `敌兵-${Math.round(skill.magnitude * 100)}%`;
        case 'ally_invincible':
            return `免伤${skill.magnitude}秒`;
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
            return `野战×${skill.magnitude}`;
        case 'defender_power_mult':
            return `守城×${skill.magnitude}`;
        case 'plain_power_mult':
            return `平原×${skill.magnitude}`;
        case 'mountain_power_mult':
            return `山地×${skill.magnitude}`;
        case 'water_power_mult':
            return `水域×${skill.magnitude}`;
        default:
            return '';
    }
}

/**
 * 名将开局：①②⑤ 改兵力 / 免伤（在掷色前调用一次）
 */
export function applyOpeningTacticalPreRoll(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    battleElapsed: number,
    scheduleInvincible: (unit: IBattleUnit, startElapsed: number, durationSec: number) => void,
    triggeredSkillIds: { attacker: Set<string>; defender: Set<string> },
    emitUi: boolean,
    openingUiShown?: { attacker: boolean; defender: boolean },
): void {
    const markOpeningUiShown = (sideLabel: string) => {
        if (!openingUiShown) return;
        if (sideLabel === '攻方') openingUiShown.attacker = true;
        else openingUiShown.defender = true;
    };

    const applySide = (
        units: IBattleUnit[],
        opponents: IBattleUnit[],
        sideLabel: string,
        triggered: Set<string>,
    ) => {
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) return;
        const profile = getGeneralProfile(unit.generalId);
        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!profile || !skill || profile.tier !== 'famous') return;
        if (!canTriggerTactical(skill, profile.tier, triggered)) return;

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
                const startAt = battleElapsed + (emitUi ? OPENING_TACTICAL_UI_DELAY_SEC : 0);
                scheduleInvincible(unit, startAt, skill.magnitude);
                logMsg = `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel} 免伤 ${skill.magnitude} 秒`;
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

    applySide(attackerUnits, defenderUnits, '攻方', triggeredSkillIds.attacker);
    applySide(defenderUnits, attackerUnits, '守方', triggeredSkillIds.defender);
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

    const profile = getGeneralProfile(joinedUnit.generalId);
    const skill = getTacticalSkillForTiming(joinedUnit, 'opening');
    if (!profile || profile.tier !== 'famous' || !skill) return;

    const shown = isAttacker ? openingUiShown.attacker : openingUiShown.defender;
    if (shown) return;

    if (isAttacker) openingUiShown.attacker = true;
    else openingUiShown.defender = true;

    emitTacticalUi(joinedUnit, skill, isAttacker ? '攻方' : '守方', {
        uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
    });
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
): { attRoll: number; defRoll: number; trigger?: TacticalSkillTrigger } {
    let lastTrigger: TacticalSkillTrigger | undefined;

    const markShown = (isAttacker: boolean) => {
        if (!openingUiShown) return;
        if (isAttacker) openingUiShown.attacker = true;
        else openingUiShown.defender = true;
    };

    const applyAllyMult = (
        units: IBattleUnit[],
        roll: number,
        sideLabel: string,
        isAttacker: boolean,
    ): number => {
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) return roll;
        const profile = getGeneralProfile(unit.generalId);
        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!profile || profile.tier !== 'famous' || !skill) return roll;

        if (skill.effect === 'ally_mult_1_2') {
            const next = roll * skill.magnitude;
            gameLog(
                'battle',
                `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}有效战力 ×${skill.magnitude} (${roll.toFixed(0)}→${next.toFixed(0)})`,
            );
            if (emitUi) {
                markShown(isAttacker);
                const trigger: TacticalSkillTrigger = {
                    displayName: skill.displayName,
                    generalId: unit.generalId,
                    skillId: skill.id,
                    uiDelaySec: OPENING_TACTICAL_UI_DELAY_SEC,
                };
                window.setTimeout(
                    () => onTacticalSkillTriggered?.(trigger),
                    OPENING_TACTICAL_UI_DELAY_SEC * 1000,
                );
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
        const profile = getGeneralProfile(unit.generalId);
        const skill = getTacticalSkillForTiming(unit, 'opening');
        if (!profile || profile.tier !== 'famous' || !skill) return opponentRoll;

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
                window.setTimeout(
                    () => onTacticalSkillTriggered?.(trigger),
                    OPENING_TACTICAL_UI_DELAY_SEC * 1000,
                );
                lastTrigger = trigger;
            }
            return next;
        }
        return opponentRoll;
    };

    let outAtt = applyAllyMult(attackerUnits, attRoll, '攻方', true);
    let outDef = applyAllyMult(defenderUnits, defRoll, '守方', false);
    outDef = applyEnemyDebuff(attackerUnits, outDef, '攻方', true);
    outAtt = applyEnemyDebuff(defenderUnits, outAtt, '守方', false);

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
    if (!sideMeetsComebackThreshold(sideTotalTroops, sideInitialTroops)) return false;

    const unit = findEligibleGeneralUnit(sideUnits);
    if (!unit?.generalId) return false;
    const profile = getGeneralProfile(unit.generalId);
    const skill = getTacticalSkillForTiming(unit, 'comeback');
    if (!profile || profile.tier !== 'ordinary' || !skill) return false;
    if (!canTriggerTactical(skill, profile.tier, ctx.triggeredSkillIds)) return false;

    let applied = false;

    switch (skill.effect) {
        case 'ally_add_troops': {
            const added = applyTroopAddToUnits(sideUnits, skill.magnitude, { useMaxTroops: true });
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

/** 逆局 ⑧⑨：对已触发的乘区技能做掷色修正（在 onSidesChanged 内调用） */
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
        roll: number,
        sideLabel: string,
        side: 'attacker' | 'defender',
    ): number => {
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) return roll;
        const mult = getStrategicBattlePowerMultiplier(unit, battleType, terrainKind, side);
        if (Math.abs(mult - 1) < 0.001) return roll;
        const profile = getGeneralProfile(unit.generalId);
        const skill = profile?.strategicSkillId
            ? getStrategicSkillDef(profile.strategicSkillId)
            : null;
        const label = skill?.displayName ?? '战略';
        const next = roll * mult;
        gameLog(
            'battle',
            `🏰 [武将技] ${unit.generalId} 【${label}】 ${sideLabel}有效战力 ×${mult} (${roll.toFixed(0)}→${next.toFixed(0)})`,
        );
        return next;
    };

    const outAtt = applySide(attackerUnits, attRoll, '攻方', 'attacker');
    const outDef = applySide(defenderUnits, defRoll, '守方', 'defender');
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

    const army = getArmyEntity(unit);
    if (army?.expeditionTargetCityId) {
        total += applyPostBattleTroopPct(unit, EXPEDITION_FORAGE_SKILL, '[远征] ');
    }

    if (canUnitUseGeneralSkills(unit)) {
        const profile = getGeneralProfile(unit.generalId);
        if (profile?.strategicSkillId) {
            const profileSkill = getStrategicSkillDef(profile.strategicSkillId);
            if (profileSkill && profileSkill.effect === 'post_battle_troop_pct') {
                total += applyPostBattleTroopPct(unit, profileSkill, '');
            }
        }
    }

    return total;
}
