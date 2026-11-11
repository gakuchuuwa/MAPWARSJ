/**
 * GeneralExtraClassicBattles.ts —— 名将的第二、第三场经典战
 *
 * 🔴 [2026-11-11 主人定「一个名将多场经典战，按年份触发；只要经典战役」]
 *   · 第一场仍在 `GeneralFirstBattles.ts`（键＝generalId）；这里只放**补选**的后几场，每位最多再加两场。
 *   · 只收史上有名的大战，不收小规模冲突。
 *   · 每场必须写 `battleId`（全局唯一，惯例 `<generalId>@<年份>`），播报表、完成记录都按它认。
 *   · 由 `tools/classic-briefings/import-extra.mts` 从云盘「经典战补选表」导入生成，不要手改。
 */
import type { GeneralFirstBattle } from './GeneralFirstBattles';

export const GENERAL_EXTRA_CLASSIC_BATTLES: Readonly<Record<string, readonly GeneralFirstBattle[]>> = {
};
