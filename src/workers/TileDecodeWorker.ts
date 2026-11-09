/**
 * 瓦片解码 Worker（2026-11-09 查掉帧）：下载 → 解码 → 读像素 →（水域）建掩膜，全在后台线程。
 *
 * 主人报「战略地图移动掉帧」；有头 Edge 实测海陆瓦片解码在主线程每帧吃 1.8~6.9ms
 * （TileDecoder 逐帧预算队列只能摊平，不能免掉：镜头一直在动，新瓦片源源不断）。
 * 主线程现在只收结果字节；与原 `decodeTileRGBA`（画布 drawImage 缩放到 size×size 再 getImageData）同口径。
 */
import { buildWaterMask, isDefectGrayTile } from '../world/land-sea/WaterMask';

export interface TileDecodeRequest {
    id: number;
    url: string;
    size: number;
    /** rgba = 原样像素；watermask = 建好的水域掩膜（坏瓦片返回 null） */
    kind: 'rgba' | 'watermask';
    timeoutMs: number;
}
export type TileDecodeResponse =
    | { id: number; ok: true; kind: 'rgba'; data: Uint8ClampedArray }
    | { id: number; ok: true; kind: 'watermask'; data: Uint8Array | null }
    | { id: number; ok: false; error: string };

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

function getCtx(size: number): OffscreenCanvasRenderingContext2D | null {
    if (!canvas || canvas.width < size || canvas.height < size) {
        canvas = new OffscreenCanvas(Math.max(size, canvas?.width ?? 0), Math.max(size, canvas?.height ?? 0));
        ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | null;
    }
    return ctx;
}

const post = (msg: TileDecodeResponse, transfer: Transferable[] = []) =>
    (self as unknown as { postMessage(m: unknown, t: Transferable[]): void }).postMessage(msg, transfer);

self.onmessage = async (ev: MessageEvent<TileDecodeRequest>) => {
    const { id, url, size, kind, timeoutMs } = ev.data;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
        const res = await fetch(url, { mode: 'cors', signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        clearTimeout(timer);
        const bmp = await createImageBitmap(blob);
        const c = getCtx(size);
        if (!c) { bmp.close(); throw new Error('no OffscreenCanvas 2d'); }
        c.clearRect(0, 0, size, size);
        c.drawImage(bmp, 0, 0, size, size);
        bmp.close();
        const rgba = c.getImageData(0, 0, size, size).data;
        if (kind === 'rgba') {
            post({ id, ok: true, kind, data: rgba }, [rgba.buffer]);
        } else {
            const mask = isDefectGrayTile(rgba, size, size) ? null : buildWaterMask(rgba, size * size);
            post({ id, ok: true, kind, data: mask }, mask ? [mask.buffer] : []);
        }
    } catch (e) {
        clearTimeout(timer);
        post({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
};
