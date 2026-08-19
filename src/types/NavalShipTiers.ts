/**
 * 海上船型：按军团兵力选船贴图档位（素材定义见 UnitAssets.ts UNIT_ASSETS）
 *
 * 三档船 = 运力语义（按实际兵力分档）：
 *   小船（GALLEY）：兵力 < 2 万
 *   中船（WAR_GALLEY）：2 万 ≤ 兵力 < 5 万
 *   大船（ANT_ELITE_GALLEY）：兵力 ≥ 5 万
 */

export type NavalShipAssetId = 'ship_small' | 'ship_medium' | 'ship_large';

/** 地图渲染各档船相对基准的缩放（全部 1.0：DE 素材 box 尺寸本身自然分层，不再做 S10DB 贴图占比补偿） */
const NAVAL_SHIP_DRAW_SCALE: Readonly<Record<NavalShipAssetId, number>> = {
    ship_small: 1.0,
    ship_medium: 1.0,
    ship_large: 1.0,
};

export function getNavalShipDrawScale(shipId: NavalShipAssetId): number {
    return NAVAL_SHIP_DRAW_SCALE[shipId];
}

export function getNavalShipAssetId(troops: number): NavalShipAssetId {
    if (troops >= 50000) return 'ship_large';
    if (troops >= 20000) return 'ship_medium';
    return 'ship_small';
}
