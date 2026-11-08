import {
    getGeneralEliteLegionName,
    getLegionEliteLegionName,
    isCityGeneralEliteAnchor,
} from '../data/ExpeditionLegions';
import { getCityAnchoredGeneral, getCityAnchoredGenerals, getCityAnchoredGeneralsFast } from '../data/CityGeneralBridge';
import { isGeneralOnStage } from '../data/generalOnStage';
import { shouldGeneralWaitInCityForFirstBattle } from '../data/GeneralFirstBattles';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { pickRandomStrategicSkill, setStrategicSkillOverride } from '../combat/GeneralSkillCombat';
import { isGeneralOnCooldown, isEliteOnCooldown } from './DefeatCooldown';
import { applyLegionCultureComposition, getLegionNameOfGeneral } from '../types/CultureFormations';
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

let _reservedGeneralIdsProvider: (() => ReadonlySet<string>) | null = null;

/** 进行中的经典战所预置的敌将，不许再被据点掷出去领兵 */
export function setReservedGeneralIdsProvider(provider: () => ReadonlySet<string>): void {
    _reservedGeneralIdsProvider = provider;
}

/** 排除已在外领兵的武将 + 经典战预占的敌将 + 尚未打完本城就地/防守经典战、需留在城中等候玩家的武将 */
function getExcludedGeneralIdsForSpawn(cityId?: string | null): ReadonlySet<string> {
    let activeIds = getActiveLegionGeneralIds();
    const reserved = _reservedGeneralIdsProvider?.();
    if (reserved && reserved.size > 0) {
        const withReserved = new Set(activeIds);
        for (const id of reserved) withReserved.add(id);
        activeIds = withReserved;
    }
    if (!cityId) return activeIds;
    const waiting = getCityAnchoredGenerals(cityId).filter((g) =>
        shouldGeneralWaitInCityForFirstBattle(g.generalId, cityId),
    );
    if (waiting.length === 0) return activeIds;
    const merged = new Set(activeIds);
    for (const g of waiting) merged.add(g.generalId);
    return merged;
}

/** 该据点是否仍有未出征且可自由出征的在场武将（本城经典战待命武将留在城中等玩家，经典战打完后再自由出征） */
export function hasAvailableCityGeneral(
    cityId: string | null | undefined,
    precomputedActiveIds?: ReadonlySet<string>,
): boolean {
    if (!cityId) return false;
    const generals = getCityAnchoredGeneralsFast(cityId);
    if (generals.length === 0) return false;
    const activeIds = precomputedActiveIds ?? getActiveLegionGeneralIds();
    const reserved = _reservedGeneralIdsProvider?.();
    for (let i = 0; i < generals.length; i++) {
        const gid = generals[i].generalId;
        if (!isGeneralOnStage(gid)) continue;
        if (activeIds.has(gid)) continue;
        if (reserved?.has(gid)) continue;
        if (shouldGeneralWaitInCityForFirstBattle(gid, cityId)) continue;
        return true;
    }
    return false;
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

/** 挂据点锚定将领（一个据点多武将时取尚未带兵在外的在场武将）。 */
export function attachFactionGeneralToArmy(army: Army): boolean {
    if (army.generalId) return false;
    const cityId = army.homeCityId ?? army.getSourceCityId();
    if (!isCityGeneralEliteAnchor(cityId)) return false;
    const excludedIds = getExcludedGeneralIdsForSpawn(cityId);
    const general = getCityAnchoredGeneral(cityId, excludedIds);
    if (!general || !isGeneralOnStage(general.generalId) || excludedIds.has(general.generalId)) return false;
    army.generalId = general.generalId;
    army.portraitPath = general.portrait;
    if (army.isElite) {
        const genEliteName = getGeneralEliteLegionName(general.generalId);
        if (genEliteName) army.name = genEliteName;
    }
    const ownLegion = getLegionNameOfGeneral(army.factionId, general.generalId);
    if (ownLegion && !army.isElite) army.name = ownLegion;
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
        if (army.generalId) applyLegionCultureComposition(army, army.cultureRegion ?? undefined);
    } else if (resolvedEliteName) {
        army.name = resolvedEliteName;
    }
    return { elite: elite || army.isElite, general: general || !!army.generalId };
}

/** 募兵 / 建军团：有将/精必出，写入 Army */
export function applyLegionSpawnTierToArmy(
    army: Army,
    tierState?: CitySpawnTierState,
): void {
    const state = tierState ?? {};
    const cityId = army.homeCityId ?? army.getSourceCityId();
    const excludedIds = getExcludedGeneralIdsForSpawn(cityId);
    const anchoredGeneral = getCityAnchoredGeneral(cityId, excludedIds);
    const eliteName = (anchoredGeneral ? getGeneralEliteLegionName(anchoredGeneral.generalId) : null)
        ?? getLegionEliteLegionName(army);
    if (!eliteName && !anchoredGeneral) return;

    const hasGeneral = !!anchoredGeneral && isGeneralOnStage(anchoredGeneral.generalId) && !excludedIds.has(anchoredGeneral.generalId);
    const canGeneral = hasGeneral && !state.spawnGeneralUsed && !!cityId && !isGeneralOnCooldown(cityId);
    const canElite = !!eliteName && !state.spawnEliteUsed && !!cityId && !isEliteOnCooldown(cityId);

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
    if (canElite && eliteName) {
        const applied = makeArmyElite(army, eliteName, false);
        markSpawnTierConsumed(state, { elite: applied.elite });
        noteCitySpawnTierFromLegion(state, army);
    }
}
