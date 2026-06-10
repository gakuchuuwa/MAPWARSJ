/**
 * Mapzen Terrarium 高程瓦片解码（与 HillshadeLayer / HillshadeWorker 同源）
 * https://github.com/tilezen/joerd/blob/master/docs/formats.md#terrarium
 */

export const TERRARIUM_TILE_URL =
    'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

/** 与地图锁定缩放一致 */
export const DEM_ZOOM = 9;

export const TERRARIUM_TILE_SIZE = 256;

/** 海拔低于此值视为海域（米） */
export const SEA_LEVEL_METERS = 0;

export function decodeTerrariumElevation(r: number, g: number, b: number): number {
    return r * 256 + g + b * 0.00390625 - 32768;
}

export function isSeaElevation(elevationMeters: number): boolean {
    return elevationMeters < SEA_LEVEL_METERS;
}
