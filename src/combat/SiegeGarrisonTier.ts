import {
    getCityAnchorFactionId,
    getCityEliteLegionName,
    isCityGeneralEliteAnchor,
} from '../data/ExpeditionLegions';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { resolveGeneralPortraitPath } from '../config/portrait_defaults';
import { getCityRegion } from '../systems/RegionSystem';
import {
    markSpawnTierConsumed,
    type CitySpawnTierState,
} from '../legion/LegionSpawnTier';
import { isGeneralOnCooldown, isEliteOnCooldown } from '../legion/DefeatCooldown';
import type { Army } from '../legion/Army';

/** 攻城战城防临时加成（仅本场，不写盘） */
export interface SiegeGarrisonBoostFields {
    _siegeGarrisonGeneralId?: string;
    _siegeGarrisonPortrait?: string;
    _siegeGarrisonElite?: boolean;
    _siegeGarrisonEliteName?: string;
}

export type SiegeGarrisonCity = SiegeGarrisonBoostFields &
    CitySpawnTierState & {
        id: string;
        factionId: string;
        latitude?: number;
        longitude?: number;
        region?: string;
    };

export function clearSiegeGarrisonBoost(city: SiegeGarrisonBoostFields): void {
    delete city._siegeGarrisonGeneralId;
    delete city._siegeGarrisonPortrait;
    delete city._siegeGarrisonElite;
    delete city._siegeGarrisonEliteName;
}

/** 守城军团已承担将/精锐时，从城防临时加成中剥掉战力项（援军编入后防重复叠加）；
 *  保留名称供面板展示（精锐番号不变）。 */
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
        // _siegeGarrisonEliteName 保留，面板继续显示城池精锐番号
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

/** 为被攻城池判定是否需补发将领/精锐。
 *  ⚠️ 铁律「谁占城谁得将/精锐」：将/精锐锚定 cityId，与旗号无关。占领方守城被攻时，
 *  本城的武将+精锐照样为占领方守城（例：大清占宁远→袁崇焕+关宁铁骑守城）。
 *  **禁止**在此加 `if (city.factionId !== anchorFaction) return` 同旗判定——曾有此闸，
 *  2026-07-21 已删除，勿加回。详见 docs/GAME_DIRECTION.md「谁占城谁得将／精锐」节。 */
export function assignSiegeGarrisonTier(
    city: SiegeGarrisonCity,
    defendingLegions: Army[],
    attackingLegions: Army[]
): void {
    // 只有锚点城（文化中心）有资格
    if (!isCityGeneralEliteAnchor(city.id)) return;

    // 清理旧缓存（防连战残留）
    clearSiegeGarrisonBoost(city);

    // 谁占城谁得将：将/精锐锚定 cityId，占领换旗后仍随城发给当前守方（与出兵路径一致）
    const anchorFaction = getCityAnchorFactionId(city.id);

    const eliteName = getCityEliteLegionName(city.id);
    const anchoredGeneral = getCityAnchoredGeneral(city.id);

    // ② 城内已有自家军团带了（守城军团或在场援军），城防就不发了
    const hasLegionElite = defendingLegions.some((l) => l.isElite && l.name === eliteName);
    const hasLegionGeneral = defendingLegions.some(
        (l) => l.generalId === anchoredGeneral?.generalId
    );

    // ③ 同场唯一：攻方已有此将领，说明武将随军离城正在攻打老家，老家城防不得影分身
    const attackerHasThisGeneral =
        !!anchoredGeneral &&
        attackingLegions.some((l) => l.generalId === anchoredGeneral.generalId);

    // ④ 同场唯一：攻方已有同名精锐军团，说明精锐已随军离城，守城不得重复出场
    const attackerHasThisElite =
        !!eliteName &&
        attackingLegions.some((l) => l.isElite && l.name === eliteName);

    const needElite = !hasLegionElite && !attackerHasThisElite && !!eliteName && !city.spawnEliteUsed && !isEliteOnCooldown(city.id);
    const needGeneral =
        !hasLegionGeneral &&
        !city.spawnGeneralUsed &&
        !isGeneralOnCooldown(city.id) &&
        !!anchoredGeneral &&
        !attackerHasThisGeneral;

    if (!needElite && !needGeneral) return;

    // 防守战：未被军团占用的将/精锐必出（无随机）
    const applied = { general: false, elite: false };

    if (needElite) {
        city._siegeGarrisonElite = true;
        city._siegeGarrisonEliteName = eliteName;
        applied.elite = true;
    }

    if (needGeneral && anchoredGeneral) {
        city._siegeGarrisonGeneralId = anchoredGeneral.generalId;
        city._siegeGarrisonPortrait = resolveGeneralPortraitPath(anchoredGeneral.portrait, {
            factionId: anchorFaction ?? undefined,
            region: getCityRegion({
                latitude: city.latitude ?? 0,
                longitude: city.longitude ?? 0,
                region: city.region,
            }),
        });
        applied.general = true;
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
