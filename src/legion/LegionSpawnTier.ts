import { GameConfig } from '../config/GameConfig';
import {
    getCityAnchorFactionId,
    getLegionEliteLegionName,
    isCityGeneralEliteAnchor,
} from '../data/ExpeditionLegions';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getFactionGeneral } from '../data/FactionGenerals';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { pickRandomStrategicSkill, setStrategicSkillOverride } from '../combat/GeneralSkillCombat';
import { isGeneralOnCooldown, isEliteOnCooldown } from './DefeatCooldown';
import type { Army } from './Army';

export type LegionSpawnTierOutcome = 'plain' | 'elite' | 'general' | 'elite_general';

/** 据点级将/精出场消耗（挂在 City 上，占城换旗号时重置） */
export interface CitySpawnTierState {
    spawnGeneralUsed?: boolean;
    spawnEliteUsed?: boolean;
}

/** 仍可用的四档结果（等概率掷色）；generalFactionId = 据点锚定史料势力 */
export function listAvailableLegionSpawnOutcomes(
    generalFactionId: string | null,
    tierState: CitySpawnTierState,
    eliteName: string | null,
    cityId?: string | null,
): LegionSpawnTierOutcome[] {
    const hasGeneral = !!generalFactionId && !!getFactionGeneral(generalFactionId);
    const canGeneral = hasGeneral && !tierState.spawnGeneralUsed && (cityId ? !isGeneralOnCooldown(cityId) : true);
    const canElite = !!eliteName && !tierState.spawnEliteUsed && (cityId ? !isEliteOnCooldown(cityId) : true);

    const outcomes: LegionSpawnTierOutcome[] = [];
    outcomes.push('plain');
    if (canElite) outcomes.push('elite');
    if (canGeneral) outcomes.push('general');
    if (canGeneral && canElite) outcomes.push('elite_general');

    return outcomes;
}

/** 在仍可用档位中等概率掷色（据点锚点，将领/精锐各只能消耗一次） */
export function rollCityLegionSpawnTierOutcome(
    generalFactionId: string | null,
    tierState: CitySpawnTierState,
    eliteName: string | null,
    cityId?: string | null,
): LegionSpawnTierOutcome {
    const available = listAvailableLegionSpawnOutcomes(generalFactionId, tierState, eliteName, cityId);
    const idx = Math.floor(Math.random() * available.length);
    return available[idx] ?? 'plain';
}

/** @deprecated 仅兼容旧调用；新逻辑须传据点 tierState */
export function rollLegionSpawnTierOutcome(
    generalFactionId: string | null,
    tierState: CitySpawnTierState = {},
    eliteName: string | null = null,
): LegionSpawnTierOutcome {
    return rollCityLegionSpawnTierOutcome(generalFactionId, tierState, eliteName, undefined);
}

export function markSpawnTierConsumed(
    tierState: CitySpawnTierState,
    applied: { general?: boolean; elite?: boolean },
): void {
    if (applied.general) tierState.spawnGeneralUsed = true;
    if (applied.elite) tierState.spawnEliteUsed = true;
}

/** 据现有军团反推据点消耗（开局/热更后扫一遍） */
export function noteCitySpawnTierFromLegion(
    tierState: CitySpawnTierState | undefined,
    army: Army,
): void {
    if (!tierState) return;
    if (army.generalId) tierState.spawnGeneralUsed = true;
    if (army.isElite) tierState.spawnEliteUsed = true;
}

/** 挂据点锚定将领（四位一体：据点、势力、武将、精锐随城走，谁占城谁得将）。
 *  名将挂将即随机分配一个战略技 override（2026-08-03 主人定：名将无固定战略技，全部随机池）。 */
export function attachFactionGeneralToArmy(army: Army): boolean {
    if (army.generalId) return false;
    const cityId = army.homeCityId ?? army.getSourceCityId();
    if (!isCityGeneralEliteAnchor(cityId)) return false;
    const general = getCityAnchoredGeneral(cityId);
    if (!general) return false;
    army.generalId = general.generalId;
    army.portraitPath = general.portrait;
    if (getGeneralProfile(general.generalId)?.tier === 'famous') {
        setStrategicSkillOverride(army.id, pickRandomStrategicSkill());
    }
    return true;
}

/** 升为精锐：番号 + isElite；withGeneral 时再挂将领 */
export function makeArmyElite(army: Army, eliteName: string, withGeneral: boolean): {
    elite: boolean;
    general: boolean;
} {
    let elite = false;
    let general = false;
    if (!army.isElite) {
        army.name = eliteName;
        army.isElite = true;
        elite = true;
    }
    if (withGeneral && !army.generalId) {
        general = attachFactionGeneralToArmy(army);
    }
    return { elite: elite || army.isElite, general: general || !!army.generalId };
}

/** 募兵 / 建军团：按据点剩余档位四档掷色写入 Army */
export function applyLegionSpawnTierToArmy(
    army: Army,
    tierState?: CitySpawnTierState,
): void {
    const eliteName = getLegionEliteLegionName(army);
    if (!eliteName) return;

    const state = tierState ?? {};
    const threshold = GameConfig.LEGION_TIER.PROMOTE_TROOPS; // 大军线 4 万（与远征无关）
    const cityId = army.homeCityId ?? army.getSourceCityId();
    const anchorFactionId = getCityAnchorFactionId(cityId);
    const hasGeneral = !!getCityAnchoredGeneral(cityId);
    const canGeneral = hasGeneral && !state.spawnGeneralUsed && !!cityId && !isGeneralOnCooldown(cityId);
    const canElite = !state.spawnEliteUsed && !!cityId && !isEliteOnCooldown(cityId);

    if (army.getTroops() >= threshold) {
        if (canElite) {
            const applied = makeArmyElite(army, eliteName, canGeneral);
            markSpawnTierConsumed(state, {
                elite: applied.elite,
                general: applied.general && canGeneral,
            });
        } else if (canGeneral) {
            if (attachFactionGeneralToArmy(army)) {
                markSpawnTierConsumed(state, { general: true });
            }
        }
        noteCitySpawnTierFromLegion(state, army);
        return;
    }

    const outcome = rollCityLegionSpawnTierOutcome(anchorFactionId, state, eliteName, cityId);

    // 有将/精必出（不再随机）：两者可用则全给，仅一项可用则给一项
    if (canElite && canGeneral) {
        const applied = makeArmyElite(army, eliteName, true);
        markSpawnTierConsumed(state, { elite: applied.elite, general: applied.general });
        noteCitySpawnTierFromLegion(state, army);
        return;
    }

    switch (outcome) {
        case 'plain':
            return;
        case 'elite': {
            const applied = makeArmyElite(army, eliteName, false);
            markSpawnTierConsumed(state, { elite: applied.elite });
            break;
        }
        case 'general': {
            if (!canGeneral) return; // 冷却中，不贴将
            const ok = attachFactionGeneralToArmy(army);
            if (ok) markSpawnTierConsumed(state, { general: true });
            break;
        }
        case 'elite_general': {
            if (!canGeneral) {
                // 冷却中只贴精锐，不贴将
                const applied = makeArmyElite(army, eliteName, false);
                markSpawnTierConsumed(state, { elite: applied.elite });
                break;
            }
            const applied = makeArmyElite(army, eliteName, true);
            markSpawnTierConsumed(state, {
                elite: applied.elite,
                general: applied.general,
            });
            break;
        }
    }
    noteCitySpawnTierFromLegion(state, army);
}
