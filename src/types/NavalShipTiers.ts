/**
 * 海上船型：按军团兵力选 S10DB 船贴图档位（素材定义见 UnitAssets.ts UNIT_ASSETS）
 *
 * 三档船 = 运力语义（按实际兵力分档）：
 *   小船（863-902）：兵力 < 2 万
 *   中船（906-945）：2 万 ≤ 兵力 < 5 万
 *   大船（949-988）：兵力 ≥ 5 万
 */

export type NavalShipAssetId = 'ship_small' | 'ship_medium' | 'ship_large';

/** 地图渲染各档船相对基准的缩放（小船 1.0，中船 0.8，大船 0.6） */
const NAVAL_SHIP_DRAW_SCALE: Readonly<Record<NavalShipAssetId, number>> = {
    ship_small: 1.0,
    ship_medium: 0.8,
    ship_large: 0.7,
};

export function getNavalShipDrawScale(shipId: NavalShipAssetId): number {
    return NAVAL_SHIP_DRAW_SCALE[shipId];
}

export function getNavalShipAssetId(troops: number): NavalShipAssetId {
    if (troops >= 50000) return 'ship_large';
    if (troops >= 20000) return 'ship_medium';
    return 'ship_small';
}
