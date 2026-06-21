/**
 * 开战有效战力（固定系数，只影响掷色，不改显示兵力）
 *
 * 五级文化攻防（主人 2026-06-11 拍板，表在 GameConfig.CULTURE_COMBAT.TIER_TABLE）：
 *   高攻 草原/青藏/东北：野战 ×1.2，守军 ×0.8
 *   低攻 西域/河西/北方：野战 ×1.1，守军 ×0.9
 *   中性 中原/中亚：×1.0
 *   低防 日本/朝鲜/江南：野战 ×0.9，守军 ×1.1
 *   高防 岭南/滇缅/川蜀：野战 ×0.8，守军 ×1.2
 *
 * 关隘（type===pass 的守军）：再 × 拒险而守（`GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT`，默认 1.2），与文化区相乘。
 *   例：岭南关隘守军 = 1.2（文化）× 1.2（关隘）= 1.44，不是 1.2³。
 *
 * 一侧合算后再 × 总 luck [0.8, 1.2] 掷一次（与上述固定系数独立）。
 *
 * 远征军团（LegionSpawnPolicy.isCampaignLegion，expeditionTargetCityId 非空）：
 *   野战单位再 × CAMPAIGN_LEGION_MULT（默认 1.2），与文化系数相乘。
 *
 * 精锐 tier 加成（GameConfig.COMBAT.ELITE_TIER_MULT）：
 *   T0 ×1.5 | T1 ×1.4 | T2 ×1.2 | T3 ×1.1
 */

import { GameConfig, rollCombatEffectivePower } from '../config/GameConfig';
import type { IBattleUnit } from '../core/CombatSystem';
import type { Army } from '../core/Army';
import type { City } from '../types/core';
import { getCityRegion, getRegion, RegionType } from './RegionSystem';
import { getLegionEliteConfig } from '../data/ExpeditionLegions';
import { isCampaignLegion } from '../legion/LegionSpawnPolicy';

export type CultureCombatRole = 'field' | 'garrison';

const TIER_TABLE = GameConfig.CULTURE_COMBAT.TIER_TABLE;

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

/** 文化区固定攻防系数（非随机，不含关隘类型加成）——五级表，未列出区 ×1.0 */
export function getCultureCombatMultiplier(region: RegionType, role: CultureCombatRole): number {
    const tier = TIER_TABLE[region];
    if (!tier) return 1;
    return role === 'field' ? tier[0] : tier[1];
}

function getPassGarrisonMultiplier(unit: IBattleUnit): number {
    if (!isGarrisonUnit(unit)) return 1;
    const city = unit.getEntity?.() as City | undefined;
    if (city?.type === 'pass') {
        return GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT;
    }
    return 1;
}

/** 文化区固定系数（不含关隘拒险而守） */
export function getCultureOnlyCombatMultiplier(unit: IBattleUnit): number {
    const region = resolveUnitCultureRegion(unit);
    const role: CultureCombatRole = isGarrisonUnit(unit) ? 'garrison' : 'field';
    return getCultureCombatMultiplier(region, role);
}

/** 关隘守军拒险而守系数（非 pass 或非农夫城防恒为 1） */
export function getPassGarrisonCombatMultiplier(unit: IBattleUnit): number {
    return getPassGarrisonMultiplier(unit);
}

/** 单单位固定战力系数 = 文化区 ×（关隘守军时拒险而守 ×1.2） */
export function getUnitCultureCombatMultiplier(unit: IBattleUnit): number {
    return getCultureOnlyCombatMultiplier(unit) * getPassGarrisonMultiplier(unit);
}

/** 远征军团 / 远征精锐 tier 加成；城防单位恒为 1 */
export function getCampaignLegionCombatMultiplier(unit: IBattleUnit): number {
    if (isGarrisonUnit(unit)) return 1;
    const army = unit.getEntity?.() as Army | undefined;
    if (!army) return 1;
    
    // 如果是精锐，根据配置的 tier 返回阶梯乘数
    if (army.isElite) {
        const config = getLegionEliteConfig(army);
        if (config) {
            const mult = GameConfig.COMBAT.ELITE_TIER_MULT[config.tier];
            if (mult !== undefined) return mult;
        }
        return GameConfig.COMBAT.CAMPAIGN_LEGION_MULT; // 兜底 1.2
    }
    
    // 非精锐的远征军团（据点军团无 expeditionTargetCityId → 不加成）
    if (isCampaignLegion(army)) return GameConfig.COMBAT.CAMPAIGN_LEGION_MULT;
    
    return 1;
}

/** 开战掷色用综合系数 = 文化（含关隘）× 远征 */
export function getUnitBattlePowerMultiplier(unit: IBattleUnit): number {
    return getUnitCultureCombatMultiplier(unit) * getCampaignLegionCombatMultiplier(unit);
}

/** 文化 + 远征修正后兵力（固定系数相乘，未掷总 luck） */
export function sumCultureAdjustedTroops(units: IBattleUnit[]): number {
    let sum = 0;
    for (const u of units) {
        if (u.troops <= 0) continue;
        sum += u.troops * getUnitBattlePowerMultiplier(u);
    }
    return sum;
}

/** 一侧：Σ(兵力×文化固定系数) 后 × 总 luck [0.8, 1.2] 一次 */
export function rollSideEffectivePower(units: IBattleUnit[]): number {
    const adjusted = sumCultureAdjustedTroops(units);
    const raw = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
    return rollCombatEffectivePower(adjusted > 0 ? adjusted : raw);
}
