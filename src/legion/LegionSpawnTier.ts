import { GameConfig } from '../config/GameConfig';
import {
    getCityAnchorFactionId,
    getGeneralEliteLegionName,
    getLegionEliteLegionName,
    isCityGeneralEliteAnchor,
} from '../data/ExpeditionLegions';
import { getCityAnchoredGeneral, getCityAnchoredGenerals } from '../data/CityGeneralBridge';
import { getFactionGeneral } from '../data/FactionGenerals';
import { isGeneralOnStage } from '../data/generalOnStage';
import { shouldGeneralWaitInCityForFirstBattle } from '../data/GeneralFirstBattles';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { pickRandomStrategicSkill, setStrategicSkillOverride } from '../combat/GeneralSkillCombat';
import { isGeneralOnCooldown, isEliteOnCooldown } from './DefeatCooldown';
import { applyLegionCultureComposition } from '../types/CultureFormations';
import type { Army } from './Army';

export type LegionSpawnTierOutcome = 'plain' | 'elite' | 'general' | 'elite_general';

/** 据点级将/精出场消耗（挂在 City 上，占城换旗号时重置） */
export interface CitySpawnTierState {
    id?: string;
    spawnGeneralUsed?: boolean;
    spawnEliteUsed?: boolean;
}

let _activeGeneralIdsProvider: (() => ReadonlySet<string>) | null = null;

/** 由 LegionManager 注入：获取当前地图上所有活跃军团占用的 generalId 集合 */
export function setActiveLegionGeneralIdsProvider(provider: () => ReadonlySet<string>): void {
    _activeGeneralIdsProvider = provider;
}

function getActiveLegionGeneralIds(): ReadonlySet<string> {
    return _activeGeneralIdsProvider ? _activeGeneralIdsProvider() : new Set<string>();
}

/** 排除已在外领兵的武将 + 尚未打完本城就地/防守首战、需留在城中等候玩家的武将 */
function getExcludedGeneralIdsForSpawn(cityId?: string | null): ReadonlySet<string> {
    const activeIds = getActiveLegionGeneralIds();
    if (!cityId) return activeIds;
    const waiting = getCityAnchoredGenerals(cityId).filter((g) =>
        shouldGeneralWaitInCityForFirstBattle(g.generalId, cityId),
    );
    if (waiting.length === 0) return activeIds;
    const merged = new Set(activeIds);
    for (const g of waiting) merged.add(g.generalId);
    return merged;
}

/** 该据点是否仍有未出征且可自由出征的在场武将（本城首战待命武将留在城中等玩家，首战打完后再自由出征） */
export function hasAvailableCityGeneral(cityId: string | null | undefined): boolean {
    if (!cityId) return false;
    const excludedIds = getExcludedGeneralIdsForSpawn(cityId);
    return getCityAnchoredGenerals(cityId).some(
        (g) => isGeneralOnStage(g.generalId) && !excludedIds.has(g.generalId),
    );
}

/** 仍可用的四档结果（等概率掷色）；generalFactionId = 据点锚定史料势力 */
export function listAvailableLegionSpawnOutcomes(
    generalFactionId: string | null,
    tierState: CitySpawnTierState,
    eliteName: string | null,
    cityId?: string | null,
): LegionSpawnTierOutcome[] {
    const excludedIds = getExcludedGeneralIdsForSpawn(cityId);
    const general = cityId
        ? getCityAnchoredGeneral(cityId, excludedIds)
        : (generalFactionId ? getFactionGeneral(generalFactionId, excludedIds) : null);
    const hasGeneral = !!general && isGeneralOnStage(general.generalId) && !excludedIds.has(general.generalId);
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
    const cityId = tierState.id;
    if (cityId) {
        const stillHasGeneral = hasAvailableCityGeneral(cityId);
        if (applied.general) tierState.spawnGeneralUsed = !stillHasGeneral;
        if (applied.elite) tierState.spawnEliteUsed = !stillHasGeneral;
        return;
    }
    if (applied.general) tierState.spawnGeneralUsed = true;
    if (applied.elite) tierState.spawnEliteUsed = true;
}

/** 据现有军团反推据点消耗（开局/热更后扫一遍） */
export function noteCitySpawnTierFromLegion(
    tierState: CitySpawnTierState | undefined,
    army: Army,
): void {
    if (!tierState) return;
    const cityId = tierState.id ?? army.homeCityId ?? army.getSourceCityId();
    if (cityId) {
        const stillHasGeneral = hasAvailableCityGeneral(cityId);
        if (army.generalId) tierState.spawnGeneralUsed = !stillHasGeneral;
        if (army.isElite) tierState.spawnEliteUsed = !stillHasGeneral;
        return;
    }
    if (army.generalId) tierState.spawnGeneralUsed = true;
    if (army.isElite) tierState.spawnEliteUsed = true;
}

/** 挂据点锚定将领（四位一体：据点、势力、武将、精锐随城走，谁占城谁得将；一个据点多武将时取尚未带兵在外的在场武将）。
 *  名将挂将即随机分配一个战略技 override（2026-08-03 主人定：名将无固定战略技，全部随机池）。 */
export function attachFactionGeneralToArmy(army: Army): boolean {
    if (army.generalId) return false;
    const cityId = army.homeCityId ?? army.getSourceCityId();
    if (!isCityGeneralEliteAnchor(cityId)) return false;
    const excludedIds = getExcludedGeneralIdsForSpawn(cityId);
    const general = getCityAnchoredGeneral(cityId, excludedIds);
    if (!general || !isGeneralOnStage(general.generalId) || excludedIds.has(general.generalId)) return false;
    army.generalId = general.generalId;
    army.portraitPath = general.portrait;
    // 一个武将一支精锐：已升精锐的军团挂上该武将后，番号同步为该武将专属精锐
    if (army.isElite) {
        const genEliteName = getGeneralEliteLegionName(general.generalId);
        if (genEliteName) army.name = genEliteName;
    }
    if (getGeneralProfile(general.generalId)?.tier === 'famous') {
        setStrategicSkillOverride(army.id, pickRandomStrategicSkill());
    }
    applyLegionCultureComposition(army, army.cultureRegion ?? undefined);
    return true;
}

/** 升为精锐：番号 + isElite；withGeneral 时先挂将领再按「一个武将一支精锐」定番号 */
export function makeArmyElite(army: Army, eliteName: string, withGeneral: boolean): {
    elite: boolean;
    general: boolean;
} {
    let elite = false;
    let general = false;
    if (withGeneral && !army.generalId) {
        general = attachFactionGeneralToArmy(army);
    }
    const resolvedEliteName = (army.generalId ? getGeneralEliteLegionName(army.generalId) : null) ?? eliteName;
    if (!army.isElite) {
        army.name = resolvedEliteName;
        army.isElite = true;
        elite = true;
        // 🔴 [2026-10-08] 已有将、后升精锐：第 10 队的条件刚满足，刷新一次编制
        if (army.generalId) applyLegionCultureComposition(army, army.cultureRegion ?? undefined);
    } else if (resolvedEliteName) {
        army.name = resolvedEliteName;
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
    const excludedIds = getExcludedGeneralIdsForSpawn(cityId);
    const anchoredGeneral = getCityAnchoredGeneral(cityId, excludedIds);
    const hasGeneral = !!anchoredGeneral && isGeneralOnStage(anchoredGeneral.generalId) && !excludedIds.has(anchoredGeneral.generalId);
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
    if (canGeneral) {
        if (attachFactionGeneralToArmy(army)) {
            markSpawnTierConsumed(state, { general: true });
        }
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

