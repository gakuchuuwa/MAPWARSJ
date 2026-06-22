import {
    getCityAnchorFactionId,
    getCityAnchoredGeneral,
    getCityEliteLegionName,
    isCityGeneralEliteAnchor,
} from '../data/ExpeditionLegions';
import { resolveGeneralPortraitPath } from '../config/portrait_defaults';
import { getCityRegion } from '../systems/RegionSystem';
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
 * 守城军团未覆盖的档位：城防驻军加成（将/精随据点，旗号随占城势力）
 *
 * 出将前提（缺一不可）：
 *  1. 占城势力 === 锚点势力（占城不过户；他势不得用敌将）
 *  2. 守方军团尚无该武将
 *  3. 攻方军团尚无该武将（同场唯一；防攻守双方出同一将领）
 *  4. city.spawnGeneralUsed 未消耗
 *
 * 规则来源：city-anchor-first.mdc 铁律 B；主人 2026-06-23 定。
 */
export function applySiegeGarrisonBoostIfNeeded(
    city: SiegeGarrisonCity,
    defendingLegions: Army[],
    attackingLegions: Army[] = [],
): void {
    clearSiegeGarrisonBoost(city);

    const hasLegionGeneral = defendingLegions.some((l) => l.generalId);
    const hasLegionElite = defendingLegions.some((l) => l.isElite);
    if (hasLegionGeneral && hasLegionElite) return;

    if (!isCityGeneralEliteAnchor(city.id)) return;

    const anchorFactionId = getCityAnchorFactionId(city.id);

    // ① 占城不过户：占城方 ≠ 锚点方时不出武将/精锐
    if (city.factionId !== anchorFactionId) {
        // 精锐同理：占城不过户
        return;
    }

    const eliteName = getCityEliteLegionName(city.id);
    if (!eliteName && hasLegionElite) return;

    const anchoredGeneral = getCityAnchoredGeneral(city.id);

    // ③ 同场唯一：攻方已有该武将则守城不得重复出场
    const attackerHasThisGeneral =
        !!anchoredGeneral &&
        attackingLegions.some((l) => l.generalId === anchoredGeneral.generalId);

    const needElite = !hasLegionElite && !!eliteName && !city.spawnEliteUsed;
    const needRandomGeneral =
        !hasLegionGeneral &&
        !city.spawnGeneralUsed &&
        !!anchoredGeneral &&
        !attackerHasThisGeneral;  // ③ 防重

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
            city._siegeGarrisonPortrait = resolveGeneralPortraitPath(anchoredGeneral.portrait, {
                factionId: anchorFactionId,
                region: getCityRegion({
                    latitude: city.latitude,
                    longitude: city.longitude,
                    region: city.region,
                }),
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
