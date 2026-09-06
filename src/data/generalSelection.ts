/**
 * 选将优先级（2026-09-05 主人定，唯一一套，勿另写）：
 *   1 兵最多 > 2 名将 > 3 双行 > 4 擅攻；同档随机。
 * 军团出征（RecruitmentSystem）与玩家选将（PlayerQuestSystem）共用此函数。
 */
import { getCityAnchoredGeneral } from './CityGeneralBridge';
import { getGeneralProfile } from './general-skills/profiles';

export interface GeneralCandidateLike {
    /** 兵力（军团出征传 armySize，玩家选将传 city.troops） */
    troops: number;
    /** 据点 id */
    cityId: string;
}

export function compareGeneralsByPriority(a: GeneralCandidateLike, b: GeneralCandidateLike): number {
    const ga = getCityAnchoredGeneral(a.cityId);
    const gb = getCityAnchoredGeneral(b.cityId);
    const pa = ga ? getGeneralProfile(ga.generalId) : null;
    const pb = gb ? getGeneralProfile(gb.generalId) : null;
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
