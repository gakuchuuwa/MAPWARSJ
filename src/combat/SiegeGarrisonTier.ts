import { getCityEliteLegionName } from '../data/ExpeditionLegions';
import {
    factionHasExpeditionGeneral,
    getSiegeGarrisonGeneral,
    hasDedicatedSiegeGarrisonGeneral,
    pickRandomExpeditionGeneral,
} from '../data/FactionGeneralPools';
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
 * 守城军团未覆盖的档位：城防驻军加成。
 * · 有守城专将（秦嬴稷）→ 无附近带将军团时**必出**专将，不占出征将配额
 * · 精锐仍按据点四档掷色
 * · 其余势力：将/精同募兵四档掷色
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

    const applied = { general: false, elite: false };
    const dedicatedSiege = hasDedicatedSiegeGarrisonGeneral(city.factionId);

    // 守城专将（秦 qin_yingji）：必出，不消耗 spawnGeneralUsed
    if (!hasLegionGeneral && dedicatedSiege) {
        const garrisonGeneral = getSiegeGarrisonGeneral(city.factionId);
        if (garrisonGeneral) {
            city._siegeGarrisonGeneralId = garrisonGeneral.generalId;
            city._siegeGarrisonPortrait = garrisonGeneral.portrait;
        }
    }

    const needElite = !hasLegionElite && !!eliteName && !city.spawnEliteUsed;
    const needRandomGeneral =
        !hasLegionGeneral &&
        !city._siegeGarrisonGeneralId &&
        !dedicatedSiege &&
        !city.spawnGeneralUsed &&
        factionHasExpeditionGeneral(city.factionId);

    if (!needElite && !needRandomGeneral) return;

    const outcome = rollCityLegionSpawnTierOutcome(city.factionId, city, eliteName);

    if (needElite && (outcome === 'elite' || outcome === 'elite_general')) {
        city._siegeGarrisonElite = true;
        city._siegeGarrisonEliteName = eliteName;
        applied.elite = true;
    }

    if (needRandomGeneral && (outcome === 'general' || outcome === 'elite_general')) {
        const picked = pickRandomExpeditionGeneral(city.factionId);
        if (picked) {
            city._siegeGarrisonGeneralId = picked.generalId;
            city._siegeGarrisonPortrait = picked.portrait;
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
    return (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonPortrait;
}

export function readSiegeGarrisonElite(entity: unknown): boolean {
    return !!(entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonElite;
}

export function readSiegeGarrisonEliteName(entity: unknown): string | undefined {
    return (entity as SiegeGarrisonBoostFields | undefined)?._siegeGarrisonEliteName;
}
