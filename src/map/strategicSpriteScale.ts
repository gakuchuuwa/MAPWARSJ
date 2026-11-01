/**
 * 战略地图精灵统一基准（2026-10-31 ~ 2026-11-01 主人定稿）。
 *
 * 视觉层级与铁律：
 *   1. 一级沙盘主角棋子：
 *      - 据点城池：80~120px（见 city-marker-tokens.ts）
 *      - 出征军团（STRATEGIC_ARMY_SCALE = 0.70）：保持直播主画面中军团列阵交战的高辨识度（见 unit-sprite-scale.md）
 *   2. 二级大地图环境与生产生态（STRATEGIC_SPRITE_SCALE = 0.38，全局唯一系数，严禁再拆子档）：
 *      - 城外生产建筑（磨坊、房屋、船坞、牧栏、营地）、自然树木与灌木、村民、家畜、野生动物、飞鸟、
 *        海洋生物、渔船、商队/商船、采集果丛/矿石、战损尸骸残骸，100% 共用唯一系数 0.38 × DE 原生像素（boxW × boxH）。
 *      - 在 0.38 统一基准下（zoom 9）：磨坊/房屋约 90×71px（小于据点城池）、乔木约 56×76px、
 *        水牛/黄牛约 29×20px（严格为房屋的 1/3）、村民站立约 17px/挥锄 30px（严格为房屋的 1/4~1/3）、
 *        商队车马约 30×25px，100% 还原 DE 原生相对比例。
 */
export const STRATEGIC_SPRITE_SCALE = 0.38;
export const STRATEGIC_ARMY_SCALE = 0.7;

/** zoom → 二级大地图素材统一缩放：zoom 9 为基准（0.38），每级 ×2（与地图投影同步）。 */
export function strategicSpriteScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_SPRITE_SCALE;
}

/** zoom → 一级主角出征军团缩放：zoom 9 为基准（0.70），每级 ×2。 */
export function strategicArmyScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_ARMY_SCALE;
}
