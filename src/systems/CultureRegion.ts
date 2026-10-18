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
import { toCulture66 } from './CultureHierarchy';

const CITY_V2_BY_ID = new Map<string, (typeof CITIES_V2)[number]>();
const CAPITAL_V2_BY_FACTION = new Map<string, (typeof CITIES_V2)[number]>();
for (const c of CITIES_V2) {
    CITY_V2_BY_ID.set(c.id, c);
    if (c.factionId && !CAPITAL_V2_BY_FACTION.has(c.factionId)) {
        CAPITAL_V2_BY_FACTION.set(c.factionId, c);
    }
}

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
        const capital = CAPITAL_V2_BY_FACTION.get(unit.factionId);
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

/** 解析单位（军团或据点守军）所属的 66 文化键（62 二级 + 4 三级） */
export function resolveUnitCulture66(unit: IBattleUnit): string {
    const entity = unit.getEntity?.();

    if (isGarrisonUnit(unit) && entity) {
        const city = entity as City & { buildingStyle?: string };
        if (city.buildingStyle) return toCulture66(city.buildingStyle);
        if (city.id) {
            const c2 = CITY_V2_BY_ID.get(city.id);
            if (c2?.buildingStyle) return toCulture66(c2.buildingStyle);
        }
        return toCulture66(city.region ?? resolveUnitCultureRegion(unit));
    }

    const army = entity as Army | undefined;
    const cityId = army?.homeCityId ?? army?.getSourceCityId?.() ?? null;
    if (cityId) {
        const c2 = CITY_V2_BY_ID.get(cityId);
        if (c2?.buildingStyle) return toCulture66(c2.buildingStyle);
        const home = getCityFromManager(cityId) as (City & { buildingStyle?: string }) | null;
        if (home?.buildingStyle) return toCulture66(home.buildingStyle);
    }

    if (unit.factionId) {
        const capital = CAPITAL_V2_BY_FACTION.get(unit.factionId);
        if (capital?.buildingStyle) return toCulture66(capital.buildingStyle);
    }

    if (army && (army as unknown as { cultureRegion?: string }).cultureRegion) {
        return toCulture66((army as unknown as { cultureRegion?: string }).cultureRegion);
    }

    return toCulture66(resolveUnitCultureRegion(unit));
}

