/**
 * 海上船型：按军团兵力选船贴图档位（素材定义见 UnitAssets.ts UNIT_ASSETS）
 *
 * 三档船 = 运力语义（按实际兵力分档）：
 *   小船（GALLEY）：兵力 < 2 万
 *   中船（WAR_GALLEY）：2 万 ≤ 兵力 < 5 万
 *   大船（ANT_ELITE_GALLEY）：兵力 ≥ 5 万
 */

export type NavalShipAssetId = 'ship_small' | 'ship_medium' | 'ship_large';

/**
 * 地图渲染各档船相对基准的缩放。
 *
 * 三档**同一个系数**：DE 素材的 box 尺寸本身就自然分层（帧高 84 / 132 / 152），
 * 档位差由素材自己表达，这里只做整体收缩 —— 不再有 S10DB 时代那套「小船 1.0、大船 0.7」
 * 的贴图占比补偿（那是因为 S10DB 三档帧高都是 112、船身在帧里占比却差 4 倍）。
 *
 * 🔴 [2026-08-19 实算] 为什么是 0.6 而不是 1.0：
 *   1.0 时 zoom10 下大船绘制高 239px（S10DB 时代是 176px），而队列间距是按旗舰尺寸算的
 *   → 8 艘双列总长 814px，水平航行占 1920 屏宽的 42%、垂直航行占 1080 屏高的 75%，
 *   且船身达到单位基准高（72）的 3.3 倍，比陆军方阵大出一大截。
 *   0.6 后：小船 79 / 中船 125 / 大船 143px，队列总长约 486px，与换船前（419px）同量级，
 *   大船约 1.4 倍基准高（S10DB 时代 1.2 倍）—— DE 船更精致，略大一点是合理的。
 *   要整体调大调小改这一个数即可，三档比例由素材保证不会失衡。
 */
const NAVAL_SHIP_DRAW_SCALE: Readonly<Record<NavalShipAssetId, number>> = {
    ship_small: 0.38,
    ship_medium: 0.38,
    ship_large: 0.38,
};

export function getNavalShipDrawScale(shipId: NavalShipAssetId): number {
    return NAVAL_SHIP_DRAW_SCALE[shipId];
}

export function getNavalShipAssetId(troops: number): NavalShipAssetId {
    if (troops >= 50000) return 'ship_large';
    if (troops >= 20000) return 'ship_medium';
    return 'ship_small';
}
