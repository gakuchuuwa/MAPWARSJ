import { getCityAnchorFactionId } from './ExpeditionLegions';
import {
    getFactionGeneral,
    getFactionGeneralsResolved,
    type FactionGeneral,
} from './FactionGenerals';

/** 据点锚定的全部武将（2026-10-19 主人定：「一个据点，一个势力，可以多个武将，一个武将一支精锐」；名将在前） */
export function getCityAnchoredGenerals(cityId: string | null | undefined): FactionGeneral[] {
    const anchorFactionId = getCityAnchorFactionId(cityId);
    if (!anchorFactionId) return [];
    return getFactionGeneralsResolved(anchorFactionId);
}

/** 某位武将是否锚定在该据点下（支持一个据点多武将） */
export function isGeneralAnchoredAtCity(
    cityId: string | null | undefined,
    generalId: string | null | undefined,
): boolean {
    if (!cityId || !generalId) return false;
    return getCityAnchoredGenerals(cityId).some((g) => g.generalId === generalId);
}

/** 据点锚定武将（优先取在场且不在 excludeGeneralIds 中的名将；谁占城谁得将） */
export function getCityAnchoredGeneral(
    cityId: string | null | undefined,
    excludeGeneralIds?: ReadonlySet<string>,
): FactionGeneral | null {
    const anchorFactionId = getCityAnchorFactionId(cityId);
    if (!anchorFactionId) return null;
    return getFactionGeneral(anchorFactionId, excludeGeneralIds);
}

