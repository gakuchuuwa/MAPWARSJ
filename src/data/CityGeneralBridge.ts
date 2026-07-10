import { getCityAnchorFactionId } from './ExpeditionLegions';
import { getFactionGeneral } from './FactionGenerals';

/** 据点锚定武将（录入表；四位一体，谁占城谁得将） */
export function getCityAnchoredGeneral(cityId: string | null | undefined) {
    const anchorFactionId = getCityAnchorFactionId(cityId);
    if (!anchorFactionId) return null;
    return getFactionGeneral(anchorFactionId);
}
