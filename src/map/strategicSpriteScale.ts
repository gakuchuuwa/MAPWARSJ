/**
 * 战略地图精灵统一基准（2026-10-31 ~ 2026-11-01 主人定稿）。
 *
 * 视觉层级与铁律（ZOOM 9 下成 1 : 4 : 8 整比）：
 *   1. 据点城墙内单栋建筑（STRATEGIC_CITY_BUILDING_SCALE = 0.10）：
 *      - 平时为 0.10 × DE 原生像素（boxW）；放大 4 倍后即 0.40，与城外统一素材 100% 同大。
 *   1b. 特殊建筑/奇观名胜与树木（STRATEGIC_WONDER_SCALE = STRATEGIC_TREE_SCALE = 0.20）：
 *      - 特殊建筑（奇观/名胜）及自然树木与伴生树统一为 0.20 × DE 原生像素（即统一素材的 1/2、据点城墙内单栋建筑的 2 倍）。
 *   2. 战略地图统一素材（STRATEGIC_SPRITE_SCALE = 0.40）：
 *      - 城外生产建筑（磨坊、房屋、船坞、牧栏、毡帐、营地）、农田/水田/牧场地块、灌木、渔船、商队/商船、采集果丛/矿石、战损尸骸残骸，
 *        共用系数 0.40 × DE 原生像素（boxW × boxH）。
 *   2b. 生产方式人物、家畜、野生动物、空中飞鸟与海洋生物（STRATEGIC_ACTOR_SCALE = 0.60）：
 *      - 🔴 [2026-11-02 主人令「既然陆地动物是0.6，那么所有陆地，空中，海洋动物都应该是0.6」]
 *        村民（农夫/牧人/猎人/樵夫/矿工）、家畜/猎物、陆地野生动物、高空飞鸟与海洋生物（海豚/海龟/鱼群/鲸鱼/海怪）全部统一为 0.60 × DE 原生像素。
 *   3. 出征军团与水师战船（STRATEGIC_ARMY_SCALE = 0.80）：
 *      - 陆军出征军团与水师战船统一为 0.80 × DE 原生像素（统一素材的 2 倍），保持沙盘交战主角的高辨识度。
 */
export const STRATEGIC_SPRITE_SCALE = 0.40;
/** 据点城墙内单栋建筑平时比例（= STRATEGIC_SPRITE_SCALE / 4 = 0.10；放大 4 倍后即 0.40，与城外建筑 100% 同大） */
export const STRATEGIC_CITY_BUILDING_SCALE = STRATEGIC_SPRITE_SCALE / 4;
/** 战略地图特殊建筑（奇观/名胜）与城外生产建筑比例（= STRATEGIC_SPRITE_SCALE / 2 = 0.20） */
export const STRATEGIC_WONDER_SCALE = STRATEGIC_SPRITE_SCALE / 2;
/** 战略地图树木比例（= STRATEGIC_SPRITE_SCALE / 2 = 0.20，与城外生产建筑同尺） */
export const STRATEGIC_TREE_SCALE = STRATEGIC_SPRITE_SCALE / 2;
/** 生产方式人物、家畜与野生动物比例（0.60） */
export const STRATEGIC_ACTOR_SCALE = 0.60;
export const STRATEGIC_ARMY_SCALE = 0.80;

/** zoom → 战略地图统一素材缩放：zoom 9 为基准（0.40），每级 ×2（与地图投影同步）。 */
export function strategicSpriteScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_SPRITE_SCALE;
}

/** zoom → 战略地图树木缩放：zoom 9 为基准（0.20），每级 ×2。 */
export function strategicTreeScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_TREE_SCALE;
}

/** zoom → 生产方式人物/动物与野生动物缩放：zoom 9 为基准（0.60），每级 ×2。 */
export function strategicActorScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_ACTOR_SCALE;
}

/** zoom → 一级主角出征军团缩放：zoom 9 为基准（0.80），每级 ×2。 */
export function strategicArmyScale(zoom: number): number {
    return Math.pow(2, zoom - 9) * STRATEGIC_ARMY_SCALE;
}
