/**
 * DechromaWorker — 抠绿（去绿幕）Web Worker。
 *
 * [2026-08-29 修卡顿·方案 A] 把 dechroma 从主线程搬进 Worker：
 *   原实现（Scene13WarLayer.dechroma）在每张素材图的 onload 回调里**同步**执行
 *   `drawImage → getImageData（GPU→CPU 强制回读）→ 逐像素抠绿 → putImageData → toDataURL（PNG 编码）`，
 *   开场批量加载几百张图时，多个 onload 回调挤在同一帧排队，形成偶发几百 ms 尖峰
 *   （实测 field=28 人也能卡 562ms——与精灵数无关，纯素材处理排队）。
 *   搬进 Worker 后，抠绿 + PNG 编码全程不占主线程，主循环零阻塞。
 *
 * 抠绿判据与主线程旧 dechroma **完全一致**（绿幕 g>150 且 r<110 且 b<110 → 透明），
 * 只是执行位置从主线程换到 Worker。染色仍走主线程 SpriteTinter（势力色每局变，不进 Worker）。
 */

export interface DechromaRequest {
    id: number;
    bitmap: ImageBitmap;
}

export interface DechromaResponse {
    id: number;
    dataUrl: string;
}

self.onmessage = (e: MessageEvent<DechromaRequest>) => {
    const { id, bitmap } = e.data;
    const w = bitmap.width;
    const h = bitmap.height;
    try {
        const canvas = new OffscreenCanvas(w, h);
        const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | null;
        if (!ctx) {
            bitmap.close();
            self.postMessage({ id, dataUrl: '' } satisfies DechromaResponse);
            return;
        }
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        const d = ctx.getImageData(0, 0, w, h);
        const p = d.data;
        for (let i = 0; i < p.length; i += 4) {
            if (p[i + 1] > 150 && p[i] < 110 && p[i + 2] < 110) p[i + 3] = 0;
        }
        ctx.putImageData(d, 0, 0);

        canvas
            .convertToBlob({ type: 'image/png' })
            .then((blob) => {
                const fr = new FileReader();
                fr.onload = () => self.postMessage({ id, dataUrl: fr.result as string } satisfies DechromaResponse);
                fr.onerror = () => self.postMessage({ id, dataUrl: '' } satisfies DechromaResponse);
                fr.readAsDataURL(blob);
            })
            .catch(() => {
                self.postMessage({ id, dataUrl: '' } satisfies DechromaResponse);
            });
    } catch (err) {
        try {
            bitmap.close();
        } catch { /* 已 close 则忽略 */ }
        self.postMessage({ id, dataUrl: '' } satisfies DechromaResponse);
    }
};
