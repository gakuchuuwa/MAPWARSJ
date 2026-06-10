/** 海上船型：按军团兵力选 S10DB 船贴图档位 */

export type NavalShipAssetId = 'ship_small' | 'ship_medium' | 'ship_large';

export function getNavalShipAssetId(troops: number): NavalShipAssetId {
    if (troops >= 20000) return 'ship_large';
    if (troops >= 10000) return 'ship_medium';
    return 'ship_small';
}
