import {
    getCityAnchorFactionId,
    getCityAnchoredGeneral,
    getCityEliteLegionName,
    isCityGeneralEliteAnchor,
} from '../data/ExpeditionLegions';
import { resolvePortraitAssetPath } from '../config/portrait_defaults';
import {
    markSpawnTierConsumed,
    rollCityLegionSpawnTierOutcome,
    type CitySpawnTierState,
} from '../legion/LegionSpawnTier';
import type { Army } from '../legion/Army';

/** 攻城战城防临时加成（仅本场，不写盘） */
export interface SiegeGarrisonBoostFields {
    _siegeGarrisonGeneralId?: string;
    _siegeGarrisonPortrait?: string;
    _siegeGarrisonElite?: boolean;
    _siegeGarrisonEliteName?: string;
}

export type SiegeGarrisonCity = SiegeGarrisonBoostFields &
    CitySpawnTierState & { id: string; factionId: string };

export function clearSiegeGarrisonBoost(city: SiegeGarrisonBoostFields): void {
    delete city._siegeGarrisonGeneralId;
    delete city._siegeGarrisonPortrait;
    delete city._siegeGarrisonElite;
    delete city._siegeGarrisonEliteName;
}

/** 守城军团已承担将/精锐时，从城防临时加成中剥掉对应项（援军编入后防重复） */
export function reconcileSiegeGarrisonBoostWithLegion(
    city: SiegeGarrisonBoostFields,
    legion: Army,
): void {
    if (legion.generalId) {
        delete city._siegeGarrisonGeneralId;
        delete city._siegeGarrisonPortrait;
    }
    if (legion.isElite) {
        delete city._siegeGarrisonElite;
        delete city._siegeGarrisonEliteName;
    }
}

/** 守方所有已参战军团：逐支 reconcile，城防临时将/精锐不与军团叠 */
export function reconcileSiegeGarrisonBoostWithLegions(
    city: SiegeGarrisonBoostFields | null | undefined,
    legions: Army[],
): void {
    if (!city) return;
    for (const legion of legions) {
        reconcileSiegeGarrisonBoostWithLegion(city, legion);
    }
}

/** 守城军团未覆盖的档位：城防驻军加成（将/精随据点，旗号随占城势力） */
export function applySiegeGarrisonBoostIfNeeded(
    city: SiegeGarrisonCity,
    defendingLegions: Army[],
): void {
    clearSiegeGarrisonBoost(city);

    const hasLegionGeneral = defendingLegions.some((l) => l.generalId);
    const hasLegionElite = defendingLegions.some((l) => l.isElite);
    if (hasLegionGeneral && hasLegionElite) return;

    if (!isCityGeneralEliteAnchor(city.id)) return;

    const eliteName = getCityEliteLegionName(city.id);
    if (!eliteName && hasLegionElite) return;

    const anchorFactionId = getCityAnchorFactionId(city.id);
    const anchoredGeneral = getCityAnchoredGeneral(city.id);

    const needElite = !hasLegionElite && !!eliteName && !city.spawnEliteUsed;
    const needRandomGeneral =
        !hasLegionGeneral && !city.spawnGeneralUsed && !!anchoredGeneral;

    if (!needElite && !needRandomGeneral) return;

    const outcome = rollCityLegionSpawnTierOutcome(anchorFactionId, city, eliteName);
    const applied = { general: false, elite: false };

    if (needElite && (outcome === 'elite' || outcome === 'elite_general')) {
        city._siegeGarrisonElite = true;
        city._siegeGarrisonEliteName = eliteName;
        applied.elite = true;
    }

    if (needRandomGeneral && (outcome === 'general' || outcome === 'elite_general')) {
        if (anchoredGeneral) {
            city._siegeGarrisonGeneralId = anchoredGeneral.generalId;
            city._siegeGarrisonPortrait = resolvePortraitAssetPath(anchoredGeneral.portrait, {
                factionId: anchorFactionId,
            });
            applied.general = true;
        }
    }

    if (applied.general || applied.elite) {
        markSpawnTierConsumed(city, applied);
    }
}

export function readSiegeGarrisonGeneralId(entity: unknown): string | undefined {
    return (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonGeneralId;
}

export function readSiegeGarrisonPortrait(entity: unknown): string | undefined {
    const raw = (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonPortrait;
    return raw?.trim() ? raw : undefined;
}

export function readSiegeGarrisonElite(entity: unknown): boolean {
    return !!(entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonElite;
}

export function readSiegeGarrisonEliteName(entity: unknown): string | undefined {
    return (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonEliteName;
}
