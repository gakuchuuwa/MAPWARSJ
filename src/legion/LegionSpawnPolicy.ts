/**
 * 军团类型策略（单一真理来源）
 *
 * · 据点军团 — 募兵出身，家城失守回师，无 expeditionTargetCityId
 * · 远征军团 — expeditionTargetCityId 非空，目标锁死、家城失守不回师，直至目标或覆没
 *
 * 玩家点远征、打文化中心；UI 见 ExpeditionUI。兵力上限见 getArmyMaxTroops。
 */
import type { Army } from './Army';
import { getArmyMaxTroops } from '../types/CultureFormations';

/** 远征军团（行军锁目标：expeditionTargetCityId 非空） */
export function isCampaignLegion(
    army: Pick<Army, 'expeditionTargetCityId'>,
): boolean {
    return army.expeditionTargetCityId != null;
}

/** 远征军团：家城（出发点）失守也不回师，直至远征目标或全军覆没 */
export function shouldSkipHomeRecapture(
    army: Pick<Army, 'expeditionTargetCityId'>,
): boolean {
    return isCampaignLegion(army);
}

/** 军团兵力上限：按文化区上限 */
export function getLegionTroopCap(army: Pick<Army, 'cultureRegion'>): number {
    return getArmyMaxTroops(army.cultureRegion);
}
