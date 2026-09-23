/**
 * 主将队（第 10 队）—— 🔴 [2026-09-23 主人定，硬规定]
 *
 * 主人原话：「现在的军团都是9队阵型，我想添加一队，改为10队阵型。亚历山大可以用英雄·骑马亚历山大，
 *           hero_mounted_alexander这个素材。」「我现在说的才是硬规定。现在战略，战术都改为10队。」
 *
 * 10 队 = 编制 9 队（骑兵 / 步兵 / 远程三排，比例规则不变）+ **主将队 1 队**。
 *   · 位置：前排正中再往前 —— 全阵的矛头（亚历山大亲率伙伴骑兵冲在最前，维基百科 Battle of the Granicus「亲统右翼」）；
 *   · 兵种：主将有专属英雄素材就用它；没有 → 用本军团前排的兵种（主将亲兵出自前锋）。
 *   · 兵力：与其余 9 队一起平分全军兵力，军团总兵力不变。
 * 编制数据（各层军团表）一个字不改；第 10 队在展开编制时追加。据点城防不带主将，仍是 9 队。
 * 🔴 剧本模式：每个主角武将的主将队兵种在事件编辑器里**必选**（事件字段 commanderUnit），按素材样貌选、不看兵名。
 */
import { getScriptCommanderUnit } from '../events/scriptPeriod';

/** 武将 → 专属英雄兵种（WAR_TYPES 键）。只登记有现成素材的 */
export const GENERAL_HERO_UNITS: Readonly<Record<string, string>> = {
    gen_alexander_great: 'hero_mounted_alexander',
};

/** 主将队用哪个兵种：剧本事件里选定的 > 专属英雄 > 本军团前排兵种 */
export function commanderUnitOf(generalId: string | null | undefined, expandedSlots: readonly string[]): string | null {
    const picked = generalId ? getScriptCommanderUnit(generalId) : null;
    const hero = generalId ? GENERAL_HERO_UNITS[generalId] : undefined;
    return picked ?? hero ?? expandedSlots[0] ?? null;
}

/** 编制 9 队展开后追加主将队 → 10 队；不是 9 队的（异常/旧数据）原样返回 */
export function withCommander(generalId: string | null | undefined, expandedSlots: string[]): string[] {
    if (expandedSlots.length !== 9) return expandedSlots;
    const cmd = commanderUnitOf(generalId, expandedSlots);
    return cmd ? [...expandedSlots, cmd] : expandedSlots;
}
