/**
 * 海战场面开着时，战略地图上要藏起来的军团（参战两支舰队 + 随军的玩家）。
 * 海战在战略地图真实海面上打，船由 NavalWarLayer 画；这几支军团原本的舰队精灵、旗帜、标签、
 * 双鱼对射特效都不画，免得同一支舰队出现两份。单独成模块，避免 GlobalUnitRenderer ↔ NavalWarLayer 循环引用。
 */
export const navalHiddenUnitIds = new Set<string>();
