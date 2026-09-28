/**
 * 🔴 [2026-09-26 主人令「你要符合历史，看看这些据点符合建筑风格吗」→「符合历史，不要问我，直接改」]
 * 剧本期把据点建筑风格换成**那一年该有的那一套**（数据：`src/data/scriptBuildingStyles.ts`）；离开剧本期原样换回。
 *
 * · 只动「还挂着乱斗原风格」的城：别的系统动过的、玩家改过的一律不碰；
 * · 只改 `buildingStyle` 一个字段 —— 据点名、坐标、region、守将、精锐、旗号一概不动；
 * · 读档进剧本期时风格本来就是剧本值 → 只登记（切回乱斗时同样能还原）；
 * · 换完由调用方 `cityManager.refreshCityVisibility()` 重画据点（`TerritorySystem` 建 marker 时
 *   读的就是 `city.buildingStyle` → `resolveCityDeBuildingStyle`，所以重画即生效）。
 */
import { SCRIPT_BUILDING_STYLES } from '../data/scriptBuildingStyles';
import { CITIES_V2 } from '../data/cities_v2';
import type { CityManager } from '../world/CityManager';

const MELEE_STYLE = new Map(CITIES_V2.map((c) => [c.id, c.buildingStyle]));

/** 本局已换成剧本风格的城 → 所换的风格 */
const applied = new Map<string, string>();

/** scriptOn = 当前是否剧本期（乱斗期传 false，原样还原）。 */
export function syncScriptBuildingStyles(cityManager: CityManager, scriptOn: boolean): void {
    if (scriptOn) {
        for (const row of SCRIPT_BUILDING_STYLES) {
            const city = cityManager.getCity(row.cityId);
            if (!city) continue;
            if (city.buildingStyle === row.scriptStyle) {
                applied.set(row.cityId, row.scriptStyle);   // 读档进来已是剧本风格 → 只登记
                continue;
            }
            if (city.buildingStyle !== MELEE_STYLE.get(row.cityId)) continue;   // 已被别处改过 → 不碰
            cityManager.updateCity(row.cityId, { buildingStyle: row.scriptStyle } as never);
            applied.set(row.cityId, row.scriptStyle);
        }
        return;
    }
    for (const [cityId, scriptStyle] of applied) {
        const city = cityManager.getCity(cityId);
        const melee = MELEE_STYLE.get(cityId);
        if (city && melee && city.buildingStyle === scriptStyle) {
            cityManager.updateCity(cityId, { buildingStyle: melee } as never);
        }
    }
    applied.clear();
}
