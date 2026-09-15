/**
 * 选将优先级（2026-09-05 主人定）：
 *   1 兵最多 > 2 名将 > 3 双行 > 4 擅攻；同档随机。
 * 🔴 军团出征（RecruitmentSystem.sortSpawnCandidates）用这一套，**未经主人指示不得改**。
 *
 * 🔴 [2026-09-15 主人定]「玩家找武将，改为兵多、名将，去掉其他的条件」——
 *    玩家选将已**另走** `comparePlayerGeneralsByPriority`（只看兵多 + 名将），不再共用本函数。
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

/**
 * 🔴 [2026-09-15 主人定]「玩家找武将，改为**兵多、名将**。去掉其他的条件。」
 *
 * 玩家自动寻将专用比较器：**只有两条判据**
 *   1 兵最多 → 2 名将；打平即随机。
 * 原先那两条「双行」「擅攻」已按主人指示去掉，攻防风格**完全不参与**玩家选将。
 *
 * ⚠️ 与 `compareGeneralsByPriority` 故意分开两个函数，**不要合并**：
 *    那一套仍是军团出征（RecruitmentSystem）的判据，主人这次只改玩家这一侧。
 */
export function comparePlayerGeneralsByPriority(a: GeneralCandidateLike, b: GeneralCandidateLike): number {
    const ga = getCityAnchoredGeneral(a.cityId);
    const gb = getCityAnchoredGeneral(b.cityId);
    const pa = ga ? getGeneralProfile(ga.generalId) : null;
    const pb = gb ? getGeneralProfile(gb.generalId) : null;
    // 无将（未录入档案）一律殿后
    if (!pa && !pb) return Math.random() - 0.5;
    if (!pa) return 1;
    if (!pb) return -1;
    // 1 兵最多（🔴 2026-09-15 方案A 主人定：按 500 兵阶梯分档，容差内同档继续比名将，避免各地季产兵几十人差值切碎同档）
    const tierA = Math.floor((a.troops || 0) / 500);
    const tierB = Math.floor((b.troops || 0) / 500);
    if (tierA !== tierB) return tierB - tierA;
    // 2 名将
    const fa = pa.tier === 'famous';
    const fb = pb.tier === 'famous';
    if (fa !== fb) return fa ? -1 : 1;
    return Math.random() - 0.5;
}
