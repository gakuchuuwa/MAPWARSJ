/** 据点建筑图标可读性（全图统一；浅底地块加强，由 DEM 判定） */

export const CITY_MARKER_BRIGHT_CLASS = 'city-icon--bright-terrain';

export const CITY_MARKER_BUILDING_CLASS = 'city-building-sprite';

/** 据点尺寸：中城为基准，大城更大，小城与关隘同档 */
export const CITY_MARKER_SIZE_BIG_CLASS = 'city-icon--size-big';
export const CITY_MARKER_SIZE_MEDIUM_CLASS = 'city-icon--size-medium';
export const CITY_MARKER_SIZE_SMALL_CLASS = 'city-icon--size-small';

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
