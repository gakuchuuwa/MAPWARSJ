import { GameConfig } from '../config/GameConfig';
import { getFactionGeneral } from '../data/FactionGenerals';
import { getLegionEliteLegionName } from '../data/ExpeditionLegions';
import type { Army } from './Army';

export type LegionSpawnTierOutcome = 'plain' | 'elite' | 'general' | 'elite_general';

/** &lt;4万：四档各 25%；势力无将领档案时「仅将领/精锐+将」并入「普通/仅精锐」各 50% */
export function rollLegionSpawnTierOutcome(factionId: string): LegionSpawnTierOutcome {
    const tier = GameConfig.LEGION_TIER;
    const r = Math.random();
    if (!getFactionGeneral(factionId)) {
        return r < 0.5 ? 'plain' : 'elite';
    }
    if (r < tier.SPAWN_PLAIN_CHANCE) return 'plain';
    if (r < tier.SPAWN_PLAIN_CHANCE + tier.SPAWN_ELITE_CHANCE) return 'elite';
    if (r < tier.SPAWN_PLAIN_CHANCE + tier.SPAWN_ELITE_CHANCE + tier.SPAWN_GENERAL_ONLY_CHANCE) {
        return 'general';
    }
    return 'elite_general';
}

/** 仅挂将领：保留原名，不升 isElite */
export function attachFactionGeneralToArmy(army: Army): void {
    if (army.generalId) return;
    const general = getFactionGeneral(army.getFactionId());
    if (!general) return;
    army.generalId = general.generalId;
    army.portraitPath = general.portrait;
}

/** 升为精锐：番号 + isElite；withGeneral 时再挂将领 */
export function makeArmyElite(army: Army, eliteName: string, withGeneral: boolean): void {
    if (!army.isElite) {
        army.name = eliteName;
        army.isElite = true;
    }
    if (withGeneral && !army.generalId) {
        attachFactionGeneralToArmy(army);
    }
}

/** 募兵 / 建军团：按四档掷色写入 Army */
export function applyLegionSpawnTierToArmy(army: Army): void {
    const eliteName = getLegionEliteLegionName(army);
    if (!eliteName) return;

    const threshold = GameConfig.EXPEDITION.UNLOCK_TROOPS;
    if (army.getTroops() >= threshold) {
        makeArmyElite(army, eliteName, true);
        return;
    }

    switch (rollLegionSpawnTierOutcome(army.getFactionId())) {
        case 'plain':
            return;
        case 'elite':
            makeArmyElite(army, eliteName, false);
            break;
        case 'general':
            attachFactionGeneralToArmy(army);
            break;
        case 'elite_general':
            makeArmyElite(army, eliteName, true);
            break;
    }
}
