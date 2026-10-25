/**
 * 选将优先级（2026-09-05 主人定）：
 *   1 兵最多 > 2 名将 > 3 双行 > 4 擅攻；同档随机。
 * 🔴 军团出征（RecruitmentSystem.sortSpawnCandidates）用这一套，**未经主人指示不得改**。
 *
 * 🔴 玩家自动寻将不用本函数：[2026-10-26 主人令「不要设计兵最多了，改为兵5000以上随机」]
 *    玩家那一侧只看「能出征（5000）+ 名将优先 + 最近几座随机」，见 PlayerQuestSystem.pickAutoCity。
 */
import { getCityAnchoredGeneral, getCityAnchoredGenerals } from './CityGeneralBridge';
import { getGeneralProfile } from './general-skills/profiles';
import { isGeneralOnStage } from './generalOnStage';

export interface GeneralCandidateLike {
    /** 兵力（军团出征传 armySize，玩家选将传 city.troops） */
    troops: number;
    /** 据点 id */
    cityId: string;
    /** 指定武将 id（一据点多武将时传入当前挑选的那位武将） */
    generalId?: string | null;
}

function bestAnchoredProfileForCity(cityId: string, preferredGeneralId?: string | null) {
    if (preferredGeneralId) {
        return getGeneralProfile(preferredGeneralId);
    }
    const gens = getCityAnchoredGenerals(cityId);
    const onStage = gens.filter((g) => isGeneralOnStage(g.generalId));
    const list = onStage.length > 0 ? onStage : gens;
    for (const g of list) {
        const p = getGeneralProfile(g.generalId);
        if (p?.tier === 'famous') return p;
    }
    const first = list[0] ?? getCityAnchoredGeneral(cityId);
    return first ? getGeneralProfile(first.generalId) : null;
}

export function compareGeneralsByPriority(a: GeneralCandidateLike, b: GeneralCandidateLike): number {
    const pa = bestAnchoredProfileForCity(a.cityId, a.generalId);
    const pb = bestAnchoredProfileForCity(b.cityId, b.generalId);
    // 无将（未录入档案）一律殿后
    if (!pa && !pb) return Math.random() - 0.5;
    if (!pa) return 1;
    if (!pb) return -1;
    // 1 兵最多
    if (a.troops !== b.troops) return b.troops - a.troops;
    // 2 名将
    const fa = pa.tier === 'famous';
    const fb = pb.tier === 'famous';
    if (fa !== fb) return fa ? -1 : 1;
    // 3 双行
    const ba = pa.attackStyle === 'balanced';
    const bb = pb.attackStyle === 'balanced';
    if (ba !== bb) return ba ? -1 : 1;
    // 4 擅攻
    const aa = pa.attackStyle === 'attack';
    const ab = pb.attackStyle === 'attack';
    if (aa !== ab) return aa ? -1 : 1;
    return Math.random() - 0.5;
}
