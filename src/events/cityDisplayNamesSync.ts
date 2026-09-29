/**
 * 把「据点显示名」（`src/data/cityDisplayNames.ts`）套到战略地图上。
 *
 * 🔴 [2026-09-30 主人定「战略地图上只显示一种名字……不需要按年代显示名字」]
 *   —— **一处一名，与年代、与剧本/乱斗模式都无关**：开局套一次即可，之后永不换。
 *   （旧版是「进剧本期换古名、切回乱斗换回来」，那套按年代换名的逻辑已随 `scriptCityNames.ts` 一起删掉。）
 *
 * · 只动「还挂着库里原名」的城：玩家改过名 / 别的系统动过的，一律不碰；
 * · 只改**显示名**，`id` 不动 —— 寻路、归属、战斗、存档一概按 id，不受影响；
 * · 城市标签跟着重画（`TerritorySystem.updateCityLabel` 的两个 span 一起改）。
 */
import { CITY_DISPLAY_NAMES } from '../data/cityDisplayNames';
import { CITIES_V2 } from '../data/cities_v2';
import type { CityManager } from '../world/CityManager';

const DB_NAME = new Map(CITIES_V2.map((c) => [c.id, c.name]));

export function applyCityDisplayNames(cityManager: CityManager): void {
    for (const row of CITY_DISPLAY_NAMES) {
        const city = cityManager.getCity(row.cityId);
        if (!city) continue;
        if (city.name === row.displayName) continue;                          // 已经是唯一显示名
        if (city.name !== DB_NAME.get(row.cityId)) continue;                  // 已被改过名 → 不碰
        cityManager.updateCity(row.cityId, { name: row.displayName });
        cityManager.updateCityLabel(row.cityId);
    }
}
