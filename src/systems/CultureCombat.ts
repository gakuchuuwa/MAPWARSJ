/**
 * 开战有效战力（固定系数，只影响掷色，不改显示兵力）
 *
 * 文化攻防表 = `GameConfig.CULTURE_COMBAT.TIER_TABLE`（15 文化 × [野战, 守军]，那里有改表约束）。
 *
 * ⚠️ 此处**不再复述具体数值**：原先这段写着一套「五级、攻+防恒等于 2.00」的旧设计，
 *    早已与实表脱节且方向相反（注释说青藏高攻 1.2/0.8，实表是 0.90/1.20；说日本低攻
 *    0.9/1.1，实表是 1.15/1.05），先后误导过多次判断。数值只认 GameConfig，别在这里抄。
 *    —— 2026-07-29 清理，同日重配平：青藏改进攻型、日本削野战、西域给坚城、西亚定型。
 *
 * 关隘（type===pass 的守军）：再 × 拒险而守（`GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT`，默认 1.2），与文化区相乘。
 *   例：岭南关隘守军 = 1.2（文化）× 1.2（关隘）= 1.44，不是 1.2³。
 *
 * 一侧合算后再 × 总 luck [0.9, 1.1] 掷一次（与上述固定系数独立）。
 *
 * 精锐环（第 7 环，GameConfig.COMBAT.ELITE_TIER_MULT）：
 *   T0 ×1.5 | T1 ×1.4 | T2 ×1.3 | T3 ×1.2 | T4 ×1.1，无精锐 ×1.0。
 *   ⚠️ 精锐环**只有这 5 个档**。2026-08-01 清理：原先还有一个 CAMPAIGN_LEGION_MULT=1.2
 *   （"是远征军团 / 精锐但查不到 tier"就给 1.2）挂在这一环，引擎侧 2026-07-24 起就不再乘它，
 *   只有面板角标还在显示，长期误导。常量与全部兜底分支已删除，别再加回来：
 *   **远征身份不进战力环**，精锐档由 CITY_ELITE_LEGIONS 的 tier 唯一决定。
 */

import { GameConfig, rollCombatEffectivePower } from '../config/GameConfig';
import type { IBattleUnit } from '../core/CombatSystem';
import type { Army } from '../core/Army';
import type { City } from '../types/core';
import { RegionType, isRegionCenter } from './RegionSystem';
import {
    type CultureCombatRole,
    isGarrisonUnit,
    resolveUnitCultureRegion,
} from './CultureRegion';
import { type EliteTier, getCityEliteConfig, getLegionEliteConfig } from '../data/ExpeditionLegions';
import { readSiegeGarrisonElite } from '../combat/SiegeGarrisonTier';

/** 文化区判定已抽至 CultureRegion（叶子模块，破循环依赖）；此处重新导出兼容旧引用 */
export { type CultureCombatRole, resolveUnitCultureRegion } from './CultureRegion';

const TIER_TABLE = GameConfig.CULTURE_COMBAT.TIER_TABLE;

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

/** 15 文化中心据点守军「守土继绝」系数（非中心或非城防恒为 1） */
function getRegionCenterGarrisonMultiplier(unit: IBattleUnit): number {
    if (!isGarrisonUnit(unit)) return 1;
    const city = unit.getEntity?.() as { id?: string } | undefined;
    if (city?.id && isRegionCenter(city.id)) {
        return GameConfig.CULTURE_COMBAT.REGION_CENTER_GARRISON_MULT;
    }
    return 1;
}

/** 文化区固定系数（不含关隘拒险而守） */
export function getCultureOnlyCombatMultiplier(unit: IBattleUnit): number {
    const region = resolveUnitCultureRegion(unit);
    const role: CultureCombatRole = isGarrisonUnit(unit) ? 'garrison' : 'field';
    return getCultureCombatMultiplier(region, role);
}

/** 关隘守军「据险而守」系数（非 pass 或非城防恒为 1） */
export function getPassGarrisonCombatMultiplier(unit: IBattleUnit): number {
    return getPassGarrisonMultiplier(unit);
}

/** 15 文化中心守军「守土继绝」系数（非中心或非城防恒为 1） */
export function getRegionCenterCombatMultiplier(unit: IBattleUnit): number {
    return getRegionCenterGarrisonMultiplier(unit);
}

/**
 * 单单位固定战力系数 = 文化环 × 据点环
 *   文化环：文化区攻防表
 *   据点环：关隘「据险而守」与文化中心「守土继绝」**取最大值**，不相乘 —— 焊死据点环上限 1.2。
 *     当前数据两者零重叠（149 关隘 / 15 文化中心），取 max 与相乘结果一致；
 *     此写法是为了防止日后把某个文化中心改成关隘时，1.44 悄悄出现且无任何报错。
 */
export function getUnitCultureCombatMultiplier(unit: IBattleUnit): number {
    const cultureRing = getCultureOnlyCombatMultiplier(unit);
    const siteRing = Math.max(
        getPassGarrisonMultiplier(unit),
        getRegionCenterGarrisonMultiplier(unit),
    );
    return cultureRing * siteRing;
}

/**
 * 精锐环（第 7 环）系数：T0 ×1.5 / T1 ×1.4 / T2 ×1.3 / T3 ×1.2 / T4 ×1.1，无精锐 ×1.0。
 * 军团（isElite）与城防（本场掷出精锐）同表。档位唯一来源 = getUnitEliteTier。
 * 面板角标与引擎 环7（GeneralSkillCombat.getElitePowerMult）必须同表，勿再引入任何兜底常量。
 */
export function getEliteCombatMultiplier(unit: IBattleUnit): number {
    const tier = getUnitEliteTier(unit);
    if (tier === null) return 1;
    return GameConfig.COMBAT.ELITE_TIER_MULT[tier] ?? 1;
}

/** 单位精锐档（T0=0 … T4=4）；无精锐返回 null。守军本场掷出精锐时同样计。 */
export function getUnitEliteTier(unit: IBattleUnit): EliteTier | null {
    if (isGarrisonUnit(unit)) {
        const city = unit.getEntity?.() as { id?: string } | undefined;
        if (city?.id && readSiegeGarrisonElite(city)) {
            return getCityEliteConfig(city.id)?.tier ?? null;
        }
        return null;
    }
    const army = unit.getEntity?.() as Army | undefined;
    if (army?.isElite) {
        return getLegionEliteConfig(army)?.tier ?? null;
    }
    return null;
}

/** 开战掷色用综合系数 = 文化（含关隘）；精锐光环在 环7 applyOpeningTacticalToRolls 中单独乘入，此处不重复 */
export function getUnitBattlePowerMultiplier(unit: IBattleUnit): number {
    return getUnitCultureCombatMultiplier(unit);
}

/** 文化修正后兵力（含关隘/文化中心据点加成；精锐光环在 环7 单独乘入） */
export function sumCultureAdjustedTroops(units: IBattleUnit[]): number {
    let sum = 0;
    for (const u of units) {
        if (u.troops <= 0) continue;
        sum += u.troops * getUnitBattlePowerMultiplier(u);
    }
    return sum;
}

/** 一侧：Σ(兵力×文化固定系数) 后 × 总 luck [0.9, 1.1] 一次 */
export function rollSideEffectivePower(units: IBattleUnit[]): number {
    const adjusted = sumCultureAdjustedTroops(units);
    const raw = units.reduce((s, u) => s + Math.max(0, u.troops), 0);
    return rollCombatEffectivePower(adjusted > 0 ? adjusted : raw);
}
