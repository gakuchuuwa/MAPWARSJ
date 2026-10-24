/**
 * 🔴 [2026-10-20 主人令] 百岁模式：**据点归当年在场武将的势力**。
 *   主人原话：「据点和势力没有关系了，为什么还要属于唐国？」「真实的历史不应该是B吗？」
 *   （B ＝ 本地武将一登场，城就回到他的势力 —— 相当于他在本地起兵。）
 *
 * · 据点的「本地武将」＝ 锚定在这座城的武将（`CITY_ANCHOR_FACTION`，与谁占城无关）；
 *   在场的有几位、分属不同势力时：**名将优先，再看谁先登场**；武将的势力＝他自己的 `factionId`，没写就是据点势力。
 * · 开局（或切进百岁模式）：还是原主、没被打下过的城，直接归在场武将的势力（前 250 年长安 → 秦）。
 * · 跨年：本地「当家武将」换了人（有人登场）→ 城回到他的势力，不管此前被谁占着；
 *   当家武将没换 → 占领照旧有效（打下来的城不会每年被改回去）。
 * · 🔴 [2026-10-20 主人令「据点平时归泛称，例如长安没有在世武将，就是汉」]
 *   本地武将全部退场 → 城若还在他手里，回到据点原主（原主没有在场武将 → 显示时代泛称，见 eraFactionDisplay）；
 *   城已被别家打下 → 不动。
 * · 离开百岁模式：仍挂着本模块所给势力的城还原成乱斗原主。
 * · 不走占城流程（`skipCaptureLog`）：不播报、不冒烟、不记陷落年份（与剧本史实归属同口径）。
 */
import { CITIES_V2 } from '../data/cities_v2';
import { getCityAnchorFactionId } from '../data/ExpeditionLegions';
import { getCityGeneralsResolved } from '../data/FactionGenerals';
import { isGeneralOnStage } from '../data/generalOnStage';
import { getGeneralDebutYear } from '../data/GeneralLifeYears';
import { getGeneralProfile } from '../data/general-skills/profiles';
import type { CityManager } from '../world/CityManager';

const MELEE_OWNER = new Map(CITIES_V2.map((c) => [c.id, c.factionId]));

/** 据点此刻的当家武将（在场者里名将优先、登场早优先）；没人在场 → null */
function localLeadGeneral(cityId: string): { generalId: string; factionId: string } | null {
    const anchor = getCityAnchorFactionId(cityId);
    if (!anchor) return null;
    const onStage = getCityGeneralsResolved(cityId).filter((g) => isGeneralOnStage(g.generalId));
    if (onStage.length === 0) return null;
    const famous = (id: string) => getGeneralProfile(id)?.tier === 'famous';
    onStage.sort((a, b) => {
        const fa = famous(a.generalId);
        const fb = famous(b.generalId);
        if (fa !== fb) return fa ? -1 : 1;
        return (getGeneralDebutYear(a.generalId) ?? Infinity) - (getGeneralDebutYear(b.generalId) ?? Infinity);
    });
    const lead = onStage[0];
    return { generalId: lead.generalId, factionId: lead.factionId ?? anchor };
}

/** 上一次同步时各城的当家武将（null = 没人在场）；本模式未生效时为空 */
const lastLead = new Map<string, { generalId: string; factionId: string } | null>();
/** 本模块改过归属的城 → 所给势力（离开百岁模式时还原用） */
const applied = new Map<string, string>();
let active = false;

/**
 * 🔴 [2026-10-20 主人令「玩家面板加年代输入，跳到哪个年代就对应好所有登场武将、城市」]
 * 跳年前调：全部据点还原成原主（不播报），清空同步状态 —— 下一次 `syncCentenarianGeneralOwners`
 * 就按「开局」口径把据点归给新年份的在场武将；同时放开「武将已出完」标记，让新年代的武将能出兵。
 */
export function resetCentenarianGeneralOwnersForYearJump(cityManager: CityManager): void {
    for (const city of cityManager.getCities()) {
        const melee = MELEE_OWNER.get(city.id);
        if (melee && city.factionId !== melee) {
            cityManager.updateCity(city.id, { factionId: melee }, { skipCaptureLog: true });
        }
        const updated = cityManager.getCity(city.id);
        if (updated) updated.spawnGeneralUsed = false;
    }
    applied.clear();
    lastLead.clear();
    active = false;
}

export function syncCentenarianGeneralOwners(cityManager: CityManager, centenarianOn: boolean): void {
    if (!centenarianOn) {
        for (const [cityId, factionId] of applied) {
            const city = cityManager.getCity(cityId);
            const melee = MELEE_OWNER.get(cityId);
            if (city && melee && city.factionId === factionId) {
                cityManager.updateCity(cityId, { factionId: melee }, { skipCaptureLog: true });
            }
        }
        applied.clear();
        lastLead.clear();
        active = false;
        return;
    }
    const first = !active;
    active = true;
    for (const city of cityManager.getCities()) {
        const lead = localLeadGeneral(city.id);
        const prev = lastLead.get(city.id);
        lastLead.set(city.id, lead);
        if (!lead) {
            // 当家武将退场、城还在他手里 → 回原主（泛称）
            const melee = MELEE_OWNER.get(city.id);
            if (prev && melee && city.factionId === prev.factionId && city.factionId !== melee) {
                cityManager.updateCity(city.id, { factionId: melee }, { skipCaptureLog: true });
                applied.delete(city.id);
            }
            continue;
        }
        if (city.factionId === lead.factionId) continue;
        if (first) {
            // 开局 / 读档：只动还是原主的城（读档里已被打下的城不硬改）
            if (city.factionId !== MELEE_OWNER.get(city.id)) continue;
        } else if (prev?.generalId === lead.generalId) {
            continue;   // 当家武将没换 → 占领照旧有效
        }
        cityManager.updateCity(city.id, { factionId: lead.factionId }, { skipCaptureLog: true });
        applied.set(city.id, lead.factionId);
    }
}
