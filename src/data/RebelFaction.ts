/**
 * 【叛军（panshu）判定 · 单一真源】
 *
 * 🔴 [2026-10-24 主人令「叛军和义军完全是两回事，请不要乱搞」「叛军是旗帜上没有字、不能出征」
 *    「应该是只有旗帜，没有字」] 见 AGENTS.md §4.5。
 *
 * `panshu`（势力名「叛军」）是**游戏机制里的无主状态**，不是正规政权：
 *   · 旗面：随机 S10QZ 7–58 原素材（`.flag-rebel-*`），**一个字都不写**；
 *   · 没有势力色 / 领土色块 / 边界线 / 军队染色；
 *   · 不能征兵、不能出征；只用来兜底「没有武将的据点」（乱斗开局，`events/meleeRandomOwners.ts`）。
 *
 * ⚠️ 旧占位势力 `panjun`（势力名「起义」）已于 2026-10-25 删除（主人令「删除起义势力，哪有历史上哪有这个势力呀」）。
 *    历史起义首领的政权是**各自独立的正常势力**、可出征；别把「叛军」与「义军」混为一谈（2026-10-24 主人令）。
 *
 * 用法：需要判断「这是不是叛军」时一律调 `isBlankRebelFaction()`，不许在各处再写 `=== 'panshu'`。
 * 旗面相关的「无字旗」判定另外还认 `CityAssetManager.factionFlagMap` 里登记的 'RANDOM'
 * （见 `CityAssetManager.isBlankRebelFlagFaction()`），两处口径必须一致。
 */

/** 叛军：游戏机制里的无主状态（不是正规势力） */
export const BLANK_REBEL_FACTION_ID = 'panshu';

/** 是不是叛军（panshu）—— 无字旗、无势力色、不出征的那种（不是历史起义政权） */
export function isBlankRebelFaction(factionId: string | null | undefined): boolean {
    return factionId === BLANK_REBEL_FACTION_ID;
}
