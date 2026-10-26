/** 军团兵力上限策略。 */
import type { Army } from './Army';
import { getArmyMaxTroops } from '../types/CultureFormations';
import { resolveArmyCulture66Key } from './march/MarchAttritionSystem';

/** 军团兵力上限：按 66 文化键上限 */
export function getLegionTroopCap(army: Pick<Army, 'cultureRegion'>): number {
    return getArmyMaxTroops(resolveArmyCulture66Key(army as Army) ?? army.cultureRegion);
}

