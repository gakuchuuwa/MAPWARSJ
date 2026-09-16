// 战略水面只取真实水域掩膜；明暗来自 DE 材质，不再透出各块 DEM 的水深接缝。
const SIZE = 128;
let texture: Promise<Float32Array | null> | undefined;

export function loadStrategicWaterTexture(): Promise<Float32Array | null> {
    return texture ??= (async () => {
        const response = await fetch('/SUCAI_TERRAIN/wtr.png', { signal: AbortSignal.timeout(4000) });
        if (!response.ok) throw new Error(`Water texture HTTP ${response.status}`);
        const bitmap = await createImageBitmap(await response.blob());
        try {
            const canvas = new OffscreenCanvas(SIZE, SIZE);
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
            const rgba = ctx.getImageData(0, 0, SIZE, SIZE).data;
            const detail = new Float32Array(SIZE * SIZE);
            let mean = 0;
            for (let p = 0; p < detail.length; p++) {
                detail[p] = rgba[p * 4] * 0.2126 + rgba[p * 4 + 1] * 0.7152 + rgba[p * 4 + 2] * 0.0722;
                mean += detail[p];
            }
            mean /= detail.length;
            for (let p = 0; p < detail.length; p++) detail[p] = (detail[p] - mean) * 0.55;
            return detail;
        } finally {
            bitmap.close();
        }
    })().catch(() => null);
}

/** 镜像平铺的周期恰为瓦片宽 256，跨瓦片边缘连续，不出现纹理接缝。 */
export function waterDetailAt(detail: Float32Array | null, x: number, y: number): number {
    const mirror = (v: number) => {
        const p = ((v % 256) + 256) % 256;
        return p < SIZE ? p : 255 - p;
    };
    return detail ? detail[mirror(y) * SIZE + mirror(x)] : 0;
}
