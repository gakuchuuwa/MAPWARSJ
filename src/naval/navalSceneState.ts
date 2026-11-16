/**
 * 海战场面开着时，战略地图上要藏起来的军团（参战两支舰队 + 随军的玩家）。
 * 海战在战略地图真实海面上打，船由 NavalWarLayer 画；这几支军团原本的舰队精灵、旗帜、标签、
 * 双鱼对射特效都不画，免得同一支舰队出现两份。单独成模块，避免 GlobalUnitRenderer ↔ NavalWarLayer 循环引用。
 */
export const navalHiddenUnitIds = new Set<string>();

/**
 * 🔴 [2026-11-16 海战 zoom 15 试验] 海战把战略地图放大到 zoom 15 时：
 *   · hideAllUnits —— 战略地图上的其他军团一律不画（它们是按 zoom 9 摆的，放大 64 倍后位置、大小都失真）；
 *   · unitScaleOverride —— 战略投射物（炮弹、箭、水花）按海战场面的船体比例画，不按地图缩放（否则比 zoom 9 大一倍）。
 */
export const navalSceneFlags: { hideAllUnits: boolean; unitScaleOverride: number | null } = {
    hideAllUnits: false,
    unitScaleOverride: null,
};
