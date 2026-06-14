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

/** 跟拍 + 剧本/远征军团 + 有将领档案 */
export function canUnitUseGeneralSkills(unit: IBattleUnit): boolean {
    if (!legionManagerRef?.isFollowedLegion(unit.id)) return false;
    const army = getArmyEntity(unit);
    if (!army) return false;
    if (!army.scriptedCampaignId && !army.expeditionTargetCityId) return false;
    if (!getGeneralProfile(unit.generalId)) return false;
    return true;
}

function findEligibleFollowedUnit(units: IBattleUnit[]): IBattleUnit | null {
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

/** 技能面板展示用（战术 + 战略各一条） */
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
        const str = getStrategicSkillDef(profile.strategicSkillId);
        if (str) {
            tags.push({
                name: str.displayName,
                effectLabel: formatStrategicEffectLabel(str),
                isFamous: true,
            });
        }
    }
    return tags;
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
 * 开局战术：跟拍侧有效战力掷色结果乘区（如 ③ 侵掠如火 ×1.2）
 */
export function applyOpeningTacticalToRolls(
    attackerUnits: IBattleUnit[],
    defenderUnits: IBattleUnit[],
    attRoll: number,
    defRoll: number,
): { attRoll: number; defRoll: number; trigger?: TacticalSkillTrigger } {
    const followedAtt = findEligibleFollowedUnit(attackerUnits);
    const followedDef = findEligibleFollowedUnit(defenderUnits);
    const followed = followedAtt ?? followedDef;
    if (!followed?.generalId) return { attRoll, defRoll };

    const skill = getOpeningTacticalSkill(followed);
    if (!skill || skill.effect !== 'ally_mult_1_2') return { attRoll, defRoll };

    const trigger: TacticalSkillTrigger = {
        displayName: skill.displayName,
        generalId: followed.generalId,
        skillId: skill.id,
    };

    if (followedAtt) {
        const next = attRoll * skill.magnitude;
        gameLog(
            'battle',
            `⚔️ [武将技] ${followed.generalId} 【${skill.displayName}】 攻方有效战力 ×${skill.magnitude} (${attRoll.toFixed(0)}→${next.toFixed(0)})`,
        );
        onTacticalSkillTriggered?.(trigger);
        return { attRoll: next, defRoll, trigger };
    }

    const next = defRoll * skill.magnitude;
    gameLog(
        'battle',
        `⚔️ [武将技] ${followed.generalId} 【${skill.displayName}】 守方有效战力 ×${skill.magnitude} (${defRoll.toFixed(0)}→${next.toFixed(0)})`,
    );
    onTacticalSkillTriggered?.(trigger);
    return { attRoll, defRoll: next, trigger };
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
    const followedAtt = findEligibleFollowedUnit(attackerUnits);
    const followedDef = findEligibleFollowedUnit(defenderUnits);
    const followed = followedAtt ?? followedDef;
    if (!followed?.generalId) return { attRoll, defRoll };

    const mult = getStrategicBattlePowerMultiplier(followed, battleType);
    if (Math.abs(mult - 1) < 0.001) return { attRoll, defRoll };

    const profile = getGeneralProfile(followed.generalId);
    const skill = profile?.strategicSkillId
        ? getStrategicSkillDef(profile.strategicSkillId)
        : null;
    const label = skill?.displayName ?? '战略';

    if (followedAtt) {
        const next = attRoll * mult;
        gameLog(
            'battle',
            `🏰 [武将技] ${followed.generalId} 【${label}】 攻方有效战力 ×${mult} (${attRoll.toFixed(0)}→${next.toFixed(0)})`,
        );
        return { attRoll: next, defRoll };
    }

    const next = defRoll * mult;
    gameLog(
        'battle',
        `🏰 [武将技] ${followed.generalId} 【${label}】 守方有效战力 ×${mult} (${defRoll.toFixed(0)}→${next.toFixed(0)})`,
    );
    return { attRoll, defRoll: next };
}

/**
 * 战后战略：S② 因粮于敌 — 底座恢复后当前兵力 +10%
 */
export function applyPostBattleStrategicBonus(
    unit: IBattleUnit,
    _battleType: BattleType,
): number {
    if (!canUnitUseGeneralSkills(unit)) return 0;
    const profile = getGeneralProfile(unit.generalId);
    if (!profile?.strategicSkillId) return 0;
    const skill = getStrategicSkillDef(profile.strategicSkillId);
    if (!skill || skill.effect !== 'post_battle_troop_pct') return 0;

    const bonus = Math.floor(unit.troops * skill.magnitude);
    if (bonus <= 0) return 0;

    unit.setTroops(unit.troops + bonus);
    gameLog(
        'battle',
        `🌾 [武将技] ${unit.generalId} 【${skill.displayName}】 +${bonus}（当前兵 +${(skill.magnitude * 100).toFixed(0)}%）`,
    );
    return bonus;
}
