/** 据点建筑图标可读性（全图统一；浅底地块加强，由 DEM 判定） */

export const CITY_MARKER_BRIGHT_CLASS = 'city-icon--bright-terrain';

export const CITY_MARKER_BUILDING_CLASS = 'city-building-sprite';

/** 据点尺寸：中城为基准，大城更大，小城与关隘同档 */
export const CITY_MARKER_SIZE_BIG_CLASS = 'city-icon--size-big';
export const CITY_MARKER_SIZE_MEDIUM_CLASS = 'city-icon--size-medium';
export const CITY_MARKER_SIZE_SMALL_CLASS = 'city-icon--size-small';

/** 平时据点建筑图宽（px）：大 140 / 中 120 / 小与关 100 —— 攻城统一放大不改此表 */
export const CITY_MARKER_BASE_WIDTH_BY_TYPE: Readonly<Record<string, number>> = {
    big_city: 140,
    medium_city: 120,
    small_city: 100,
    pass: 100,
};

/** 据点素材常见原图宽（多数 1024×765） */
export const CITY_ART_NATIVE_WIDTH_PX = 1024;
export const CITY_ART_NATIVE_HEIGHT_PX = 765;

/**
 * 跟拍攻城放大：以 zoom=10 为基准，屏幕上显示为「原图宽 × 此倍数」。
 * 大/中/小平时底宽不同，但攻城态用分档 CSS scale 收到同一屏幕宽 → 对齐容易。
 * 例 0.4 → zoom10 上约 409.6px 宽。平时尺寸表不动。
 */
export const SIEGE_CITY_NATIVE_SCALE_AT_ZOOM10 = 0.4;

/** [2026-08-10 13 城图 6 折] zoom13 战斗场景（攻守编队对垒 + 守军锚点贴城图边缘）城图放大到原图 0.6。 */
export const SIEGE_CITY_NATIVE_SCALE_AT_ZOOM13 = 0.6;

/** 与 TerritorySystem.updateCityScales 一致：zoom10 时 --city-scale = 1.5 */
export const CITY_MARKER_PANE_SCALE_AT_ZOOM10 = 1.5;

export function getCityMarkerBaseWidthPx(cityType: string): number {
    return CITY_MARKER_BASE_WIDTH_BY_TYPE[cityType] ?? 100;
}

/** zoom10 目标屏幕宽 = 原图宽 × 0.4（随地图 zoom 按 pane scale 比例伸缩，各城型相同）；13 战斗场景 ×0.6 */
export function getSiegeCityScreenWidthPx(mapZoom: number): number {
    const paneScale = Math.max(0, 1 + (mapZoom - 9) * 0.5);
    // [2026-08-10] 13 战斗场景城图 6 折（0.6 原图，守军锚点/攻方外推按放大后城图算）；
    // 非 13 保持 4 折（0.4）。13 下实际宽 = 1024×0.6×(3.0/1.5) = 1228.8px。
    const nativeScale = mapZoom >= 13 ? SIEGE_CITY_NATIVE_SCALE_AT_ZOOM13 : SIEGE_CITY_NATIVE_SCALE_AT_ZOOM10;
    return (
        CITY_ART_NATIVE_WIDTH_PX
        * nativeScale
        * (paneScale / CITY_MARKER_PANE_SCALE_AT_ZOOM10)
    );
}

/**
 * 攻城时 .city-building-stack 的 CSS scale：使 baseWidth × scale × 1.5(zoom10) = 1024×0.4。
 * 火箭外推等与此同步。
 */
export function getSiegeCityBuildingStackScale(cityType: string): number {
    const base = getCityMarkerBaseWidthPx(cityType);
    return (
        (CITY_ART_NATIVE_WIDTH_PX * SIEGE_CITY_NATIVE_SCALE_AT_ZOOM10)
        / (base * CITY_MARKER_PANE_SCALE_AT_ZOOM10)
    );
}

export function getCityMarkerSizeClass(cityType: string): string {
    switch (cityType) {
        case 'big_city':
            return CITY_MARKER_SIZE_BIG_CLASS;
        case 'medium_city':
            return CITY_MARKER_SIZE_MEDIUM_CLASS;
        case 'pass':
        case 'small_city':
            return CITY_MARKER_SIZE_SMALL_CLASS;
        default:
            return CITY_MARKER_SIZE_SMALL_CLASS;
    }
}
