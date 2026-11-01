/**
 * 战略地图精灵统一基准（2026-10-31 ~ 2026-11-01 主人定稿）。
 *
 * 视觉层级与铁律（ZOOM 9 下成 1 : 4 : 8 整比）：
 *   1. 据点城墙内单栋建筑与特殊建筑（STRATEGIC_CITY_BUILDING_SCALE = 0.10）：
 *      - 平时为 0.10 × DE 原生像素（boxW）；放大 4 倍后即 0.40，与城外统一素材 100% 同大。
 *   2. 战略地图统一素材（STRATEGIC_SPRITE_SCALE = 0.40，全局唯一系数，严禁再拆子档）：
 *      - 城外生产建筑（磨坊、房屋、船坞、牧栏、营地）、农田/牧场地块、自然树木与灌木、
 *        村民、家畜、野生动物、飞鸟、海洋生物、渔船、商队/商船、采集果丛/矿石、战损尸骸残骸，
 *        100% 共用唯一系数 0.40 × DE 原生像素（boxW × boxH）。
 *   3. 出征军团与水师战船（STRATEGIC_ARMY_SCALE = 0.80）：
 *      - 陆军出征军团与水师战船统一为 0.80 × DE 原生像素（统一素材的 2 倍），保持沙盘交战主角的高辨识度。
 */
export const STRATEGIC_SPRITE_SCALE = 0.40;
/** 据点城墙内单栋建筑平时比例（= STRATEGIC_SPRITE_SCALE / 4 = 0.10；放大 4 倍后即 0.40，与城外建筑 100% 同大） */
export const STRATEGIC_CITY_BUILDING_SCALE = STRATEGIC_SPRITE_SCALE / 4;
export const STRATEGIC_ARMY_SCALE = 0.80;

/** zoom → 战略地图统一素材缩放：zoom 9 为基准（0.40），每级 ×2（与地图投影同步）。 */
export function strategicSpriteScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_SPRITE_SCALE;
}

/** zoom → 一级主角出征军团缩放：zoom 9 为基准（0.80），每级 ×2。 */
export function strategicArmyScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_ARMY_SCALE;
}
