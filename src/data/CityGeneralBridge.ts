import { getCityAnchorFactionId } from './ExpeditionLegions';
import { getFactionGeneral } from './FactionGenerals';

/** 据点锚定武将（读录入表；与军团旗号/占城势力可不同） */
export function getCityAnchoredGeneral(cityId: string | null | undefined) {
    const anchorFactionId = getCityAnchorFactionId(cityId);
    if (!anchorFactionId) return null;
    return getFactionGeneral(anchorFactionId);
}
