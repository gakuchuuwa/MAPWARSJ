/**
 * 战略地图精灵统一基准（2026-10-31 主人令「把生产方式，陆海空动物的显示比例统一，大小对齐 DE」）。
 *
 * DE 里村民、士兵、牛马、鹿、渔船、海兽全是同一套世界像素画的，所以**同一张 DE 素材链上只许有一个系数**；
 * 此前各层各拍一套（村民 0.42 / 家畜 0.48 / 渔船 0.46 / 鱼群 0.44 / 野生动物 0.60 / 商队 0.35 /
 * 海洋生物固定屏幕像素），于是同一只鹿在猎人身旁比野外小 25%、海豚比牛大 3 倍还不随缩放。
 *
 * 现在统一到**军团已经在用的 0.7**（GlobalUnitRenderer：zoom 9 基准，横 32px／纵 44px 出图挑的）：
 * 村民与士兵同高、牛按 DE 原生像素比村民宽、鲸比牛大 —— 都是 DE 原样的相对大小。
 * 唯一口径，不许再在别处另写系数。
 */
export const STRATEGIC_SPRITE_SCALE = 0.7;

/** zoom → 精灵缩放：zoom 9 为基准，每级 ×2（与地图投影同步）。 */
export function strategicSpriteScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_SPRITE_SCALE;
}
