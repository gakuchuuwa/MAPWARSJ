import { getCityEliteLegionName } from '../data/ExpeditionLegions';
import { getFactionGeneral } from '../data/FactionGenerals';
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

/**
 * 守城军团未覆盖的档位：对城防驻军按据点剩余档位掷色（与募兵同规则）。
 * 城防掷出将/精同样消耗据点配额；已有守城军团带将/精锐的档位不再掷城防。
 */
export function applySiegeGarrisonBoostIfNeeded(
    city: SiegeGarrisonCity,
    defendingLegions: Army[],
): void {
    clearSiegeGarrisonBoost(city);

    const hasLegionGeneral = defendingLegions.some((l) => l.generalId);
    const hasLegionElite = defendingLegions.some((l) => l.isElite);
    if (hasLegionGeneral && hasLegionElite) return;

    const eliteName = getCityEliteLegionName(city.id);
    if (!eliteName && hasLegionElite) return;

    const outcome = rollCityLegionSpawnTierOutcome(city.factionId, city, eliteName);
    const general = getFactionGeneral(city.factionId);
    const applied = { general: false, elite: false };

    switch (outcome) {
        case 'plain':
            return;
        case 'elite':
            if (hasLegionElite || !eliteName) return;
            city._siegeGarrisonElite = true;
            city._siegeGarrisonEliteName = eliteName;
            applied.elite = true;
            break;
        case 'general':
            if (hasLegionGeneral || !general) return;
            city._siegeGarrisonGeneralId = general.generalId;
            city._siegeGarrisonPortrait = general.portrait;
            applied.general = true;
            break;
        case 'elite_general':
            if (!hasLegionElite && eliteName) {
                city._siegeGarrisonElite = true;
                city._siegeGarrisonEliteName = eliteName;
                applied.elite = true;
            }
            if (!hasLegionGeneral && general) {
                city._siegeGarrisonGeneralId = general.generalId;
                city._siegeGarrisonPortrait = general.portrait;
                applied.general = true;
            }
            break;
    }

    markSpawnTierConsumed(city, applied);
}

export function readSiegeGarrisonGeneralId(entity: unknown): string | undefined {
    return (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonGeneralId;
}

export function readSiegeGarrisonPortrait(entity: unknown): string | undefined {
    return (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonPortrait;
}

export function readSiegeGarrisonElite(entity: unknown): boolean {
    return !!(entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonElite;
}

export function readSiegeGarrisonEliteName(entity: unknown): string | undefined {
    return (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonEliteName;
}
