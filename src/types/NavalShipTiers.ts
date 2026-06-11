/**
 * 海上船型：按军团兵力选 S10DB 船贴图档位（素材定义见 UnitAssets.ts UNIT_ASSETS）
 *
 * 三档船 = 运力语义（按实际兵力分档）：
 *   小船（863-902）：兵力 < 2 万
 *   中船（906-945）：2 万 ≤ 兵力 < 5 万
 *   大船（949-988）：兵力 ≥ 5 万
 */

export type NavalShipAssetId = 'ship_small' | 'ship_medium' | 'ship_large';

export function getNavalShipAssetId(troops: number): NavalShipAssetId {
    if (troops >= 50000) return 'ship_large';
    if (troops >= 20000) return 'ship_medium';
    return 'ship_small';
}
