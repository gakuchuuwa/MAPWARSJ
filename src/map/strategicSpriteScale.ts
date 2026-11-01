/**
 * 战略地图精灵统一基准（2026-10-31 ~ 2026-11-01 主人令「让素材的显示大小都和 DE 一致，所有素材显示大小比例一致」）。
 *
 * 铁律：所有非据点素材一律直接按「DE 原生像素（boxW × boxH）× 统一缩放系数」等比绘制，
 * 严禁按固定像素高强行拉平（如把灌木/仙人掌拉成与大树同高），也严禁同层混用不同时代尺寸的建筑。
 *
 * 两档 DE 原生等比基准（zoom 9 基准）：
 *   1. STRATEGIC_SPRITE_SCALE = 0.7：所有活物、车船与地面资源（军团士兵、村民、家畜、野生动物、飞鸟、海兽、渔船、商队/商船、采集果丛/矿石/尸骸残骸）
 *   2. STRATEGIC_BUILDING_SCALE = 0.22 / STRATEGIC_TREE_SCALE = 0.20：城外生产建筑与自然树木（与战略据点内建筑 0.16~0.20 同比例系，避免城外单栋磨坊或单棵大树比整座城池还大，同时内部 100% 保持 DE 原生相对大小）
 */
export const STRATEGIC_SPRITE_SCALE = 0.7;
export const STRATEGIC_BUILDING_SCALE = 0.22;
export const STRATEGIC_TREE_SCALE = 0.20;

/** zoom → 精灵缩放：zoom 9 为基准，每级 ×2（与地图投影同步）。 */
export function strategicSpriteScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_SPRITE_SCALE;
}
