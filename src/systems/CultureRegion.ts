/**
 * 文化区判定（叶子模块）
 *
 * 从 CultureCombat 抽出：仅依赖 RegionSystem 与类型，无 combat/legion 依赖。
 * 目的：让 portrait_defaults 等模块只取「按单位判文化区」一个函数时，
 *       不必经 CultureCombat 拉入 SiegeGarrisonTier→ExpeditionLegions→FactionGenerals，
 *       从而打破循环依赖。
 */
import type { IBattleUnit } from '../core/CombatSystem';
import type { Army } from '../core/Army';
import type { City } from '../types/core';
import { getCityRegion, getRegion, RegionType } from './RegionSystem';
import { CITIES_V2 } from '../data/cities_v2';

export type CultureCombatRole = 'field' | 'garrison';

export function isGarrisonUnit(unit: IBattleUnit): boolean {
    return unit.unitType === 'city';
}

export function getCityFromManager(cityId: string | null | undefined): City | null {
    if (!cityId) return null;
    const mgr = (window as unknown as { game?: { cityManager?: { getCity(id: string): City | null } } })
        .game?.cityManager;
    return mgr?.getCity(cityId) ?? null;
}

/** 与 LegionManager.resolveCultureRegion 同源：据点 region 优先，否则坐标多边形 */
export function resolveUnitCultureRegion(unit: IBattleUnit): RegionType {
    const entity = unit.getEntity?.();

    if (isGarrisonUnit(unit) && entity) {
        const city = entity as City;
        return getCityRegion({
            latitude: city.latitude,
            longitude: city.longitude,
            region: city.region,
        });
    }

    const army = entity as Army | undefined;
    const cityId = army?.homeCityId ?? army?.getSourceCityId?.() ?? null;
    const home = getCityFromManager(cityId);
    if (home) {
        return getCityRegion({
            latitude: home.latitude,
            longitude: home.longitude,
            region: home.region,
        });
    }

    // 【2026-08-02 修】军团文化 = 势力文化（首都/出兵据点），不是当前位置坐标判定。
    // 环线只覆盖大文化圈宏观轮廓，军团在野外行军/远征途中坐标判定常落进 CENTRAL，
    // 导致斯拉夫/日耳曼/拉丁等新区无武将立绘抽到中原池（实测：斯拉夫据点出现中原武将）。
    // 守军 entity 缺失时同样落到这里：factionId 首都解析比坐标判定可靠。
    if (unit.factionId) {
        const capital = CITIES_V2.find((c) => c.factionId === unit.factionId);
        if (capital) {
            return getCityRegion({
                latitude: capital.lat,
                longitude: capital.lng,
                region: capital.region,
            });
        }
    }

    const pos = unit.getPosition();
    return getRegion(pos.lat, pos.lng);
}
