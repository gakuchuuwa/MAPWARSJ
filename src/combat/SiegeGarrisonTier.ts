import { getCityEliteLegionName } from '../data/ExpeditionLegions';
import { getFactionGeneral } from '../data/FactionGenerals';
import { rollLegionSpawnTierOutcome } from '../legion/LegionSpawnTier';
import type { Army } from '../legion/Army';

/** 攻城战城防临时加成（仅本场，不写盘） */
export interface SiegeGarrisonBoostFields {
    _siegeGarrisonGeneralId?: string;
    _siegeGarrisonPortrait?: string;
    _siegeGarrisonElite?: boolean;
    _siegeGarrisonEliteName?: string;
}

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
 * 守城军团未覆盖的档位：对城防驻军按募兵同规则四档掷色（25%×4）。
 * 已有守城军团带将/精锐的档位不再掷城防，避免与军团重复。
 */
export function applySiegeGarrisonBoostIfNeeded(
    city: SiegeGarrisonBoostFields & { id: string; factionId: string },
    defendingLegions: Army[],
): void {
    clearSiegeGarrisonBoost(city);

    const hasLegionGeneral = defendingLegions.some((l) => l.generalId);
    const hasLegionElite = defendingLegions.some((l) => l.isElite);
    if (hasLegionGeneral && hasLegionElite) return;

    const eliteName = getCityEliteLegionName(city.id);
    if (!eliteName && hasLegionElite) return;

    const outcome = rollLegionSpawnTierOutcome(city.factionId);
    const general = getFactionGeneral(city.factionId);

    switch (outcome) {
        case 'plain':
            return;
        case 'elite':
            if (hasLegionElite || !eliteName) return;
            city._siegeGarrisonElite = true;
            city._siegeGarrisonEliteName = eliteName;
            break;
        case 'general':
            if (hasLegionGeneral || !general) return;
            city._siegeGarrisonGeneralId = general.generalId;
            city._siegeGarrisonPortrait = general.portrait;
            break;
        case 'elite_general':
            if (!hasLegionElite && eliteName) {
                city._siegeGarrisonElite = true;
                city._siegeGarrisonEliteName = eliteName;
            }
            if (!hasLegionGeneral && general) {
                city._siegeGarrisonGeneralId = general.generalId;
                city._siegeGarrisonPortrait = general.portrait;
            }
            break;
    }
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
