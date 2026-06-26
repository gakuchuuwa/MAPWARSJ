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

    const pos = unit.getPosition();
    return getRegion(pos.lat, pos.lng);
}
