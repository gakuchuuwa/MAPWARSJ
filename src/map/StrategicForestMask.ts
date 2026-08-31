interface StrategicForestMaskData {
    width: number;
    height: number;
    pixels: Uint8ClampedArray;
}

let store: StrategicForestMaskData | null = null;
let loading: Promise<boolean> | null = null;

export function queryStrategicForestBiome(lat: number, lng: number): number {
    if (!store) return 0;
    const x = ((Math.floor(((lng + 180) / 360) * store.width) % store.width) + store.width) % store.width;
    const y = Math.max(0, Math.min(store.height - 1, Math.floor(((90 - lat) / 180) * store.height)));
    return store.pixels[(y * store.width + x) * 4] ?? 0;
}

export function queryStrategicCanopyDensity(lat: number, lng: number): number {
    if (!store) return 0;
    const x = ((Math.floor(((lng + 180) / 360) * store.width) % store.width) + store.width) % store.width;
    const y = Math.max(0, Math.min(store.height - 1, Math.floor(((90 - lat) / 180) * store.height)));
    return store.pixels[(y * store.width + x) * 4 + 1] ?? 0;
}

export function loadStrategicForestMask(url = '/world/strategic-forest-mask.png'): Promise<boolean> {
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
