/**
 * 🔴 [2026-09-25 主人定「据点的名字，文案要和图上的统一」]
 * 剧本期把据点显示名换成那一年的古名（数据：`src/data/scriptCityNames.ts`）；离开剧本期原样换回。
 *
 * · 只动「还挂着乱斗原名」的城：玩家改过名 / 别的系统动过的，一律不碰；
 * · 只改**显示名**，`id` 不动 —— 寻路、归属、战斗、存档一概按 id，不受影响；
 * · 读档进剧本期时，名字本来就是古名（存档里存的就是古名），也照样登记，切回乱斗时能还原。
 */
import { SCRIPT_CITY_NAMES } from '../data/scriptCityNames';
import { CITIES_V2 } from '../data/cities_v2';
import type { CityManager } from '../world/CityManager';

const MELEE_NAME = new Map(CITIES_V2.map((c) => [c.id, c.name]));

/** 本局已换成古名的城 → 所换的古名 */
const applied = new Map<string, string>();

/**
 * scriptOn = 当前是否剧本期（乱斗期传 false，原样还原）。
 */
export function syncScriptCityNames(cityManager: CityManager, scriptOn: boolean): void {
    if (scriptOn) {
        for (const row of SCRIPT_CITY_NAMES) {
            const city = cityManager.getCity(row.cityId);
            if (!city) continue;
            if (city.name === row.scriptName) {
                applied.set(row.cityId, row.scriptName);   // 读档进来已是古名 → 只登记，切回时仍能还原
                continue;
            }
            if (city.name !== MELEE_NAME.get(row.cityId)) continue;   // 已被改过名 → 不碰
            cityManager.updateCity(row.cityId, { name: row.scriptName });
            cityManager.updateCityLabel(row.cityId);
            applied.set(row.cityId, row.scriptName);
        }
        return;
    }
    for (const [cityId, scriptName] of applied) {
        const city = cityManager.getCity(cityId);
        const melee = MELEE_NAME.get(cityId);
        if (city && melee && city.name === scriptName) {
            cityManager.updateCity(cityId, { name: melee });
            cityManager.updateCityLabel(cityId);
        }
    }
    applied.clear();
}
