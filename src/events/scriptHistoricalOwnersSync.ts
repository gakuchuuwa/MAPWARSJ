/**
 * 🔴 [2026-09-25 主人定「写剧本的时候，战略地图上据点的旗帜上的字，应该符合历史」]
 * 剧本期把据点旗号换成那一年的史实归属（数据：`src/data/scriptHistoricalOwners.ts`）；离开剧本期原样换回。
 *
 * · 只动「还是乱斗原主」的城：剧本打下来的城（`cityUpdates` 易主）不碰，读档也不会被改回去；
 * · 撤下时只还原「仍挂着本表所给势力」的城；
 * · 不走占城流程（`skipCaptureLog`）：不播报、不冒烟、不记陷落年份。
 */
import { SCRIPT_HISTORICAL_OWNERS } from '../data/scriptHistoricalOwners';
import { CITIES_V2 } from '../data/cities_v2';
import type { CityManager } from '../world/CityManager';

const MELEE_OWNER = new Map(CITIES_V2.map((c) => [c.id, c.factionId]));

/** 某年的史实归属：同一座城取年份 ≤ year 的最后一条 */
function ownersAt(year: number): Map<string, string> {
    const out = new Map<string, string>();
    const rows = [...SCRIPT_HISTORICAL_OWNERS].filter((r) => r.year <= year).sort((a, b) => a.year - b.year);
    for (const r of rows) out.set(r.cityId, r.factionId);
    return out;
}

/** 本局已换上史实归属的城 → 所换的势力 */
const applied = new Map<string, string>();

/**
 * scriptOn = 当前是否剧本期；year = 当前这一场剧本事件的年份（剧本已打完传 null）。
 */
export function syncScriptHistoricalOwners(cityManager: CityManager, scriptOn: boolean, year: number | null): void {
    if (scriptOn && year !== null) {
        for (const [cityId, factionId] of ownersAt(year)) {
            const city = cityManager.getCity(cityId);
            if (!city || city.factionId === factionId) continue;
            if (city.factionId !== MELEE_OWNER.get(cityId)) continue;   // 已被剧本打下来 / 读档易过主 → 不碰
            cityManager.updateCity(cityId, { factionId }, { skipCaptureLog: true });
            applied.set(cityId, factionId);
        }
        return;
    }
    for (const [cityId, factionId] of applied) {
        const city = cityManager.getCity(cityId);
        const melee = MELEE_OWNER.get(cityId);
        if (city && melee && city.factionId === factionId) {
            cityManager.updateCity(cityId, { factionId: melee }, { skipCaptureLog: true });
        }
    }
    applied.clear();
}
