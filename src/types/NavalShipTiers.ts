/**
 * 海上船型：按军团兵力选 S10DB 船贴图档位（素材定义见 UnitAssets.ts UNIT_ASSETS）
 *
 * 三档船 = 运力语义（主人 2026-06-12 口述确认，素材本身即按此设计）：
 *   1万船（小型运兵船，863-902）：兵力 ≤ 1 万
 *   2万船（中型战船，  906-945）：1 万 < 兵力 ≤ 2 万
 *   5万船（蓝顶楼船，  949-988）：兵力 > 2 万
 */

export type NavalShipAssetId = 'ship_small' | 'ship_medium' | 'ship_large';

export function getNavalShipAssetId(troops: number): NavalShipAssetId {
    if (troops > 20000) return 'ship_large';  // 5万船
    if (troops > 10000) return 'ship_medium'; // 2万船
    return 'ship_small';                      // 1万船
}
