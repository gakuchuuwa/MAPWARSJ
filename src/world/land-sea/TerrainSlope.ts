import { decodeTerrariumElevation, TERRARIUM_TILE_SIZE } from './TerrariumCodec';

/** 与 HillshadeLayer 默认 zFactor=25 一致 */
export const HILLSHADE_Z_FACTOR = 25;

export interface SlopeSample {
    elevationM: number;
    slopeDeg: number;
}

function elevAtPixel(data: Uint8ClampedArray, px: number, py: number): number {
    const idx = (py * TERRARIUM_TILE_SIZE + px) * 4;
    return decodeTerrariumElevation(data[idx], data[idx + 1], data[idx + 2]);
}

/**
 * 3×3 Horn 核坡度（与 HillshadeWorker 同源公式）
 */
export function computeSlopeFromTile(
    data: Uint8ClampedArray,
    pixelX: number,
    pixelY: number,
    zFactor = HILLSHADE_Z_FACTOR
): SlopeSample {
    const w = TERRARIUM_TILE_SIZE;
    const h = TERRARIUM_TILE_SIZE;
    const xL = pixelX === 0 ? 0 : pixelX - 1;
    const xR = pixelX >= w - 1 ? w - 1 : pixelX + 1;
    const yT = pixelY === 0 ? 0 : pixelY - 1;
    const yB = pixelY >= h - 1 ? h - 1 : pixelY + 1;

    const zTL = elevAtPixel(data, xL, yT);
    const zT = elevAtPixel(data, pixelX, yT);
    const zTR = elevAtPixel(data, xR, yT);
    const zL = elevAtPixel(data, xL, pixelY);
    const zC = elevAtPixel(data, pixelX, pixelY);
    const zR = elevAtPixel(data, xR, pixelY);
    const zBL = elevAtPixel(data, xL, yB);
    const zB = elevAtPixel(data, pixelX, yB);
    const zBR = elevAtPixel(data, xR, yB);

    const INV_8 = 0.125;
    let divisor = 320 - zFactor * 10;
    if (divisor < 20) divisor = 20;

    const dzdx = (zTR + 2 * zR + zBR - (zTL + 2 * zL + zBL)) * INV_8;
    const dzdy = (zBL + 2 * zB + zBR - (zTL + 2 * zT + zTR)) * INV_8;
    const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy) / divisor);

    return {
        elevationM: zC,
        slopeDeg: (slopeRad * 180) / Math.PI,
    };
}
