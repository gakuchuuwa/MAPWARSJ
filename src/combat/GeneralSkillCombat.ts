/**
 * 武将技战斗挂载：门禁、开局战术、战后战略
 */
import type { IBattleUnit, BattleType } from './CombatSystem';
import type { Army } from '../legion/Army';
import type { LegionManager } from '../legion/LegionManager';
import {
    getGeneralProfile,
    getStrategicSkillDef,
    getTacticalSkillDef,
    EXPEDITION_FORAGE_SKILL,
    PASS_GARRISON_DEFENSE_SKILL,
    REINFORCEMENT_JOIN_SKILL,
    type TacticalSkillDef,
} from '../data/GeneralSkills';
import { gameLog } from '../utils/GameLogger';

export type TacticalSkillTrigger = {
    displayName: string;
    generalId: string;
    skillId: string;
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
 * 名将归势力（2026-06-15）：只要军团带 generalId 且该 id 有武将技档案即生效，
 * 不再要求跟随/剧本/远征——AI 名将同样触发，攻守双方各自结算。
 * （跟随判定 legionManagerRef 保留供他处/未来用。）
 */
export function canUnitUseGeneralSkills(unit: IBattleUnit): boolean {
    void legionManagerRef;
    const army = getArmyEntity(unit);
    if (!army) return false;
    if (!getGeneralProfile(unit.generalId)) return false;
    return true;
}

/** 取某侧第一支可用武将技的军团（带名将档案的） */
function findEligibleGeneralUnit(units: IBattleUnit[]): IBattleUnit | null {
    for (const u of units) {
        if (canUnitUseGeneralSkills(u)) return u;
    }
    return null;
}

function getOpeningTacticalSkill(unit: IBattleUnit): TacticalSkillDef | null {
    const profile = getGeneralProfile(unit.generalId);
    if (!profile || profile.tier !== 'famous') return null;
    const def = getTacticalSkillDef(profile.tacticalSkillId);
    if (!def || def.timing !== 'opening') return null;
    return def;
}

/** 开局战术战力乘区（UI 徽章 / 与侧总掷色一致，如 ③ 侵掠如火 ×1.2） */
export function getOpeningTacticalPowerMultiplier(unit: IBattleUnit): number {
    if (!canUnitUseGeneralSkills(unit)) return 1;
    const skill = getOpeningTacticalSkill(unit);
    if (!skill || skill.effect !== 'ally_mult_1_2') return 1;
    return skill.magnitude;
}

/**
 * 战略开战战力乘区（须匹配战场类型；与掷色 `applyStrategicBattleToRolls` 一致）
 */
export function getStrategicBattlePowerMultiplier(
    unit: IBattleUnit,
    battleType?: BattleType,
): number {
    if (!canUnitUseGeneralSkills(unit) || !battleType) return 1;
    const profile = getGeneralProfile(unit.generalId);
    if (!profile?.strategicSkillId) return 1;
    const skill = getStrategicSkillDef(profile.strategicSkillId);
    if (!skill) return 1;
    switch (skill.effect) {
        case 'siege_power_mult':
            return battleType === 'siege' ? skill.magnitude : 1;
        case 'field_power_mult':
            return battleType === 'field' ? skill.magnitude : 1;
        default:
            return 1;
    }
}


/** 关隘守军（type===pass 城防）是否适用拒险而守 */
export function unitQualifiesForPassGarrisonDefenseSkill(unit: IBattleUnit): boolean {
    if (unit.unitType !== 'city') return false;
    const city = unit.getEntity?.() as { type?: string } | undefined;
    return city?.type === 'pass';
}

/** 守军系统技面板：拒险而守 */
export function getPassGarrisonDefenseSkillDisplay(
    unit: IBattleUnit,
): { name: string; effectLabel: string } | null {
    if (!unitQualifiesForPassGarrisonDefenseSkill(unit)) return null;
    const skill = PASS_GARRISON_DEFENSE_SKILL;
    return {
        name: skill.displayName,
        effectLabel: `城防×${parseFloat(skill.magnitude.toFixed(2))}`,
    };
}

/** 援军系统技面板：合兵一处（编入 luck 已掷定） */
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

/** 技能面板展示用（名将的战术 + 战略；远征军的「因粮于敌」另由 getExpeditionForageSkillDisplay 提供） */
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

/** 远征军系统技面板：因粮于敌（仅远征军 expeditionTargetCityId 显示） */
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
            return `行军×${skill.magnitude}`;
        case 'post_battle_troop_pct':
            return `胜后+${Math.round(skill.magnitude * 100)}%`;
        case 'siege_power_mult':
            return `攻城×${skill.magnitude}`;
        case 'field_power_mult':
            return `野战×${skill.magnitude}`;
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
 * 跟拍侧开局战术 + 战略战力乘区（开战掷色 / 援军编入后强弱重算共用）
 */
export function applyGeneralSkillSideRollMultipliers(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    battleType: BattleType,
    options?: { emitTacticalUi?: boolean },
): { attRoll: number; defRoll: number } {
    const emitUi = options?.emitTacticalUi !== false;
    const tactical = applyOpeningTacticalToRolls(
        attackerUnits,
        defenderUnits,
        attRoll,
        defRoll,
        emitUi,
    );
    return applyStrategicBattleToRolls(
        attackerUnits,
        defenderUnits,
        tactical.attRoll,
        tactical.defRoll,
        battleType,
    );
}

/**
 * 援军编入：跟拍剧本/远征军团首次入战时可补发战术技 UI（开战时不在场则错过首次闪光）
 */
export function tryEmitOpeningTacticalOnReinforcementJoin(
    joinedUnit: IBattleUnit,
    isAttacker: boolean,
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
): void {
    if (!canUnitUseGeneralSkills(joinedUnit)) return;
    const sideUnits = isAttacker ? attackerUnits : defenderUnits;
    const eligible = findEligibleGeneralUnit(sideUnits);
    if (eligible?.id !== joinedUnit.id) return;

    const skill = getOpeningTacticalSkill(joinedUnit);
    if (!skill || skill.effect !== 'ally_mult_1_2') return;

    onTacticalSkillTriggered?.({
        displayName: skill.displayName,
        generalId: joinedUnit.generalId!,
        skillId: skill.id,
    });
}

/**
 * 开局战术：跟拍侧有效战力掷色结果乘区（如 ③ 侵掠如火 ×1.2）
 */
export function applyOpeningTacticalToRolls(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    emitUi = true,
): { attRoll: number; defRoll: number; trigger?: TacticalSkillTrigger } {
    let lastTrigger: TacticalSkillTrigger | undefined;

    // 一侧的开局战术：有名将且为 ③侵掠如火（己战×1.2）则乘到该侧掷色
    const applySide = (units: IBattleUnit[], roll: number, sideLabel: string): number => {
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) return roll;
        const skill = getOpeningTacticalSkill(unit);
        if (!skill || skill.effect !== 'ally_mult_1_2') return roll;
        const next = roll * skill.magnitude;
        if (emitUi) {
            gameLog(
                'battle',
                `⚔️ [武将技] ${unit.generalId} 【${skill.displayName}】 ${sideLabel}有效战力 ×${skill.magnitude} (${roll.toFixed(0)}→${next.toFixed(0)})`,
            );
            const trigger: TacticalSkillTrigger = {
                displayName: skill.displayName,
                generalId: unit.generalId,
                skillId: skill.id,
            };
            onTacticalSkillTriggered?.(trigger);
            lastTrigger = trigger;
        }
        return next;
    };

    // 攻守双方各自结算（白起对廉颇：两边名将技都生效）
    const outAtt = applySide(attackerUnits, attRoll, '攻方');
    const outDef = applySide(defenderUnits, defRoll, '守方');
    return { attRoll: outAtt, defRoll: outDef, trigger: lastTrigger };
}

/**
 * 战略开战：跟拍侧有效战力掷色再乘区（如 S③ 攻城拔寨，仅 siege）
 */
export function applyStrategicBattleToRolls(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
    battleType: BattleType,
): { attRoll: number; defRoll: number } {
    // 一侧的战略乘区（如 S③攻城拔寨，仅 siege；按战场类型匹配）
    const applySide = (units: IBattleUnit[], roll: number, sideLabel: string): number => {
        const unit = findEligibleGeneralUnit(units);
        if (!unit?.generalId) return roll;
        const mult = getStrategicBattlePowerMultiplier(unit, battleType);
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

    const outAtt = applySide(attackerUnits, attRoll, '攻方');
    const outDef = applySide(defenderUnits, defRoll, '守方');
    return { attRoll: outAtt, defRoll: outDef };
}

/**
 * 战后加兵：按战略技能 magnitude 对当前兵力比例结算
 */
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

/**
 * 战后战略：远征军系统技「因粮于敌」（仅远征军）+ 将领档案胜后战略（若有）
 */
export function applyPostBattleStrategicBonus(
    unit: IBattleUnit,
    _battleType: BattleType,
): number {
    let total = 0;

    // 因粮于敌：仅远征军（被下远征令、有 expeditionTargetCityId）享，与是否有名将无关
    const army = getArmyEntity(unit);
    if (army?.expeditionTargetCityId) {
        total += applyPostBattleTroopPct(unit, EXPEDITION_FORAGE_SKILL, '[远征] ');
    }

    // 名将自身的胜后战略（若其战略技恰为 post_battle_troop_pct）
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
