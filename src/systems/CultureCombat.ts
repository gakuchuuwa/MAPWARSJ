/**
 * 开战有效战力（固定系数，只影响掷色，不改显示兵力）
 *
 * 文化区（按据点/军团所在区）：
 *   草原/东北/青藏：野战 ×1.2，守军 ×0.8
 *   岭南/滇缅：守军 ×1.2，野战 ×0.8
 *   其余 9 区 ×1.0
 *
 * 关隘（type===pass 的守军）：再 × PASS_GARRISON_MULT（默认 1.2），与文化区相乘。
 *   例：岭南关隘守军 = 1.2（文化）× 1.2（关隘）= 1.44，不是 1.2³。
 *
 * 一侧合算后再 × 总 luck [0.8, 1.2] 掷一次（与上述固定系数独立）。
 */

import { GameConfig, rollCombatEffectivePower } from '../config/GameConfig';
import type { IBattleUnit } from '../core/CombatSystem';
import type { Army } from '../core/Army';
import type { City } from '../types/core';
import { getCityRegion, getRegion, RegionType } from './RegionSystem';

export type CultureCombatRole = 'field' | 'garrison';

const NOMADIC_SET = new Set<RegionType>(GameConfig.CULTURE_COMBAT.NOMADIC_REGIONS);
const FORTRESS_SET = new Set<RegionType>(GameConfig.CULTURE_COMBAT.FORTRESS_REGIONS);

function isGarrisonUnit(unit: IBattleUnit): boolean {
    return unit.unitType === 'city';
}

function getCityFromManager(cityId: string | null | undefined): City | null {
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

/** 文化区固定攻防系数（非随机，不含关隘类型加成） */
export function getCultureCombatMultiplier(region: RegionType, role: CultureCombatRole): number {
    const c = GameConfig.CULTURE_COMBAT;
    if (NOMADIC_SET.has(region)) {
        return role === 'field' ? c.FIELD_ARMY_MULT : c.GARRISON_MULT;
    }
    if (FORTRESS_SET.has(region)) {
        return role === 'field' ? c.GARRISON_MULT : c.FIELD_ARMY_MULT;
    }
    return 1;
}

function getPassGarrisonMultiplier(unit: IBattleUnit): number {
    if (!isGarrisonUnit(unit)) return 1;
    const city = unit.getEntity?.() as City | undefined;
    if (city?.type === 'pass') {
        return GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT;
    }
    return 1;
}

/** 单单位固定战力系数 = 文化区 ×（关隘守军时 ×PASS_GARRISON_MULT） */
export function getUnitCultureCombatMultiplier(unit: IBattleUnit): number {
    const region = resolveUnitCultureRegion(unit);
    const role: CultureCombatRole = isGarrisonUnit(unit) ? 'garrison' : 'field';
    return getCultureCombatMultiplier(region, role) * getPassGarrisonMultiplier(unit);
}

/** 文化修正后兵力（固定系数相乘，未掷总 luck） */
export function sumCultureAdjustedTroops(units: IBattleUnit[]): number {
    let sum = 0;
    for (const u of units) {
        if (u.troops <= 0) continue;
        sum += u.troops * getUnitCultureCombatMultiplier(u);
    }
    return sum;
}

/** 一侧：Σ(兵力×文化固定系数) 后 × 总 luck [0.8, 1.2] 一次 */
export function rollSideEffectivePower(units: IBattleUnit[]): number {
    const adjusted = sumCultureAdjustedTroops(units);
    const raw = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
    return rollCombatEffectivePower(adjusted > 0 ? adjusted : raw);
}
