/**
 * 剧本事件：归属武将的军团从哪座城出发（游戏与战场事件编辑器共用同一口径）。
 *
 * 🔴 [2026-09-23 主人报「船队不对呀」] 前331年高加米拉那一场没写出发据点，军团就回到亚历山大本城佩拉，
 *    从马其顿本土渡海开到叙利亚外海 —— 史实是他从推罗走陆路经塔普萨库斯到高加米拉。
 *    第三场以后每一场都这样。主人：「难道有一千个事件，你也每次都挨个看一遍吗」→ 做成默认规则：
 *      ① 事件写了 startCityId → 用它（史料另有记载时，如伊苏斯从戈尔迪乌姆出发）；
 *      ② 没写 → 同一武将上一场打完的地方：攻城战 = 被攻的那座城，野战 = 离战场最近、那一年已存在的据点；
 *      ③ 他的第一场 → null（调用方用他的本城）。
 */
import { CITY_FOUNDED_YEAR } from '../data/cityFoundedYears';

/** 算出发地需要的事件信息（游戏的 HistoricalEvent、编辑器的草稿各自转成这个） */
export interface StartEventInfo {
    generalId: string;
    year: number;
    season: number;
    startCityId?: string;
    absentCities?: readonly string[];
    /** 这一场打在哪里（战场坐标 / 攻城战的城坐标） */
    point: { lat: number; lng: number } | null;
    /** 攻城战打的那座城（不是攻城战 = 无） */
    siegeCityId?: string;
}

export interface StartCity { id: string; lat: number; lng: number }

export function resolveEventStartCityId(
    ev: StartEventInfo,
    allEvents: readonly StartEventInfo[],
    cities: readonly StartCity[],
): { cityId: string; from: 'set' | 'previous' } | null {
    if (ev.startCityId) return { cityId: ev.startCityId, from: 'set' };
    if (!ev.generalId) return null;
    const prev = allEvents
        .filter((x) => x !== ev && x.generalId === ev.generalId
            && (x.year < ev.year || (x.year === ev.year && x.season < ev.season)))
        .sort((a, b) => (b.year - a.year) || (b.season - a.season))[0];
    if (!prev) return null;
    if (prev.siegeCityId && cities.some((c) => c.id === prev.siegeCityId)) {
        return { cityId: prev.siegeCityId, from: 'previous' };
    }
    if (!prev.point) return null;
    const absent = new Set(ev.absentCities ?? []);
    const cosLat = Math.cos(prev.point.lat * Math.PI / 180);
    let best: StartCity | null = null;
    let bestD = Infinity;
    for (const c of cities) {
        if (absent.has(c.id)) continue;
        const founded = CITY_FOUNDED_YEAR[c.id];
        if (founded !== undefined && founded > ev.year) continue;   // 那一年还没建
        const d = Math.hypot(c.lat - prev.point.lat, (c.lng - prev.point.lng) * cosLat);
        if (d < bestD) { bestD = d; best = c; }
    }
    return best ? { cityId: best.id, from: 'previous' } : null;
}
