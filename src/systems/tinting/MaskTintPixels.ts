/** 主线程与 Worker 共用同一份玩家色算法，覆盖率和褶皱亮度保持一致。 */
export function tintMaskPixels(main: Uint8ClampedArray, mask: Uint8ClampedArray,
    tint: { r: number; g: number; b: number }, weakCoverage: number, extraTint: number,
    knownWeak?: boolean): boolean {
    const n = Math.min(main.length, mask.length);
    let weak = knownWeak;
    if (weak === undefined) {
        let body = 0, pc = 0;
        for (let i = 3; i < n; i += 4) {
            if (main[i] > 16) body++;
            if (mask[i] > 16) pc++;
        }
        weak = body > 0 && pc / body < weakCoverage;
    }
    const K = weak ? extraTint : 0;
    for (let i = 0; i < n; i += 4) {
        const w = mask[i + 3] / 255;
        if (w === 0) {
            if (K > 0 && main[i + 3] > 16) {
                const l0 = (0.299 * main[i] + 0.587 * main[i + 1] + 0.114 * main[i + 2]) / 255;
                main[i] = Math.round(main[i] * (1 - K) + tint.r * l0 * K);
                main[i + 1] = Math.round(main[i + 1] * (1 - K) + tint.g * l0 * K);
                main[i + 2] = Math.round(main[i + 2] * (1 - K) + tint.b * l0 * K);
            }
            continue;
        }
        const lum = 0.299 * main[i] + 0.587 * main[i + 1] + 0.114 * main[i + 2];
        const s = Math.min(255, lum * 2.2);
        main[i] = Math.round((tint.r * s / 255) * w + main[i] * (1 - w));
        main[i + 1] = Math.round((tint.g * s / 255) * w + main[i + 1] * (1 - w));
        main[i + 2] = Math.round((tint.b * s / 255) * w + main[i + 2] * (1 - w));
    }
    return weak;
}
