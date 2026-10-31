/**
 * 历史土地利用掩膜（HYDE 3.3，CC BY 4.0，引用：Klein Goldewijk et al. 2017/2024，doi:10.24416/UU01-94FNH0）。
 * 由 tools/build-land-use-mask.py 烘焙：0.25° 一格，R = 公元前 1000 年、G = 公元 1000 年、B = 公元 1500 年，
 * 值 = 耕地 + 牧场占该格面积的比例（0–255）。
 */
interface LandUseMaskData {
    width: number;
    height: number;
    pixels: Uint8ClampedArray;
}

let store: LandUseMaskData | null = null;
let loading: Promise<boolean> | null = null;

/** 三个时间点（年份）对应 R/G/B 通道 */
const SNAPSHOT_YEARS: readonly number[] = [-1000, 1000, 1500];

export function isLandUseMaskReady(): boolean {
    return store !== null;
}

/** 命令行工具直接注入像素 */
export function setLandUseMaskData(pixels: Uint8ClampedArray, width: number, height: number): void {
    store = { width, height, pixels };
}

/** 该年份该处被开垦（耕地 + 牧场）的面积比例 0–1；三个时间点之间线性插值，两端取端点；未载入返回 null */
export function queryLandUseFraction(lat: number, lng: number, year: number): number | null {
    if (!store) return null;
    const x = ((Math.floor(((lng + 180) / 360) * store.width) % store.width) + store.width) % store.width;
    const y = Math.max(0, Math.min(store.height - 1, Math.floor(((90 - lat) / 180) * store.height)));
    const i = (y * store.width + x) * 4;
    const v = [store.pixels[i] / 255, store.pixels[i + 1] / 255, store.pixels[i + 2] / 255];
    if (year <= SNAPSHOT_YEARS[0]) return v[0];
    for (let k = 1; k < SNAPSHOT_YEARS.length; k++) {
        if (year <= SNAPSHOT_YEARS[k]) {
            const t = (year - SNAPSHOT_YEARS[k - 1]) / (SNAPSHOT_YEARS[k] - SNAPSHOT_YEARS[k - 1]);
            return v[k - 1] + (v[k] - v[k - 1]) * t;
        }
    }
    return v[SNAPSHOT_YEARS.length - 1];
}

export function loadLandUseMask(url = '/world/land-use-hyde.png'): Promise<boolean> {
    if (store) return Promise.resolve(true);
    if (loading) return loading;
    loading = (async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) return false;
            const bitmap = await createImageBitmap(await response.blob());
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return false;
            ctx.drawImage(bitmap, 0, 0);
            const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
            store = { width: bitmap.width, height: bitmap.height, pixels: data };
            bitmap.close();
            return true;
        } catch {
            return false;
        } finally {
            loading = null;
        }
    })();
    return loading;
}
