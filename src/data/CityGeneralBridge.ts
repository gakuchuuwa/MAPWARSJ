import {
    getCityGeneral,
    getCityGeneralsRaw,
    getCityGeneralsResolved,
    getRawGeneralByGeneralId,
    type FactionGeneral,
} from './FactionGenerals';

/**
 * 据点挂的全部武将。
 *
 * 🔴 [2026-10-23 主人改机制] 按武将自己的 `cityId` 筛，**不再**按据点的势力取整份名单：
 *   - 一个势力可以有多座据点，各据点的武将互不串；
 *   - 归并势力时只改武将 `factionId`，`cityId` 不动。
 * 名将在前；乱斗模式只留一位。
 */
export function getCityAnchoredGenerals(cityId: string | null | undefined): FactionGeneral[] {
    return getCityGeneralsResolved(cityId);
}

/** 据点挂的全部武将（仅作 ID/在场判定用，不重复解析立绘路径与阶段名，零排序开销） */
export function getCityAnchoredGeneralsFast(cityId: string | null | undefined): FactionGeneral[] {
    return getCityGeneralsRaw(cityId);
}

/** 某位武将是否挂在该据点下（支持一个据点多武将；O(1) 索引直查） */
export function isGeneralAnchoredAtCity(
    cityId: string | null | undefined,
    generalId: string | null | undefined,
): boolean {
    if (!cityId || !generalId) return false;
    const raw = getRawGeneralByGeneralId(generalId);
    if (raw) return raw.general.cityId === cityId;
    return getCityGeneralsRaw(cityId).some((g) => g.generalId === generalId);
}

/** 据点守将（在场且不在 excludeGeneralIds 中的名将优先；谁占城谁得将） */
export function getCityAnchoredGeneral(
    cityId: string | null | undefined,
    excludeGeneralIds?: ReadonlySet<string>,
): FactionGeneral | null {
    return getCityGeneral(cityId, excludeGeneralIds);
}
