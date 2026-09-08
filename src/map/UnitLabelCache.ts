import { perfDoctor } from '../debug/PerfDoctor';

const MAX_BYTES = 4 * 1024 * 1024;
const entries = new Map<string, { canvas: HTMLCanvasElement; width: number; height: number; bytes: number }>();
let bytes = 0;

perfDoctor.registerCache({
    name: 'UnitLabelCache:军团文字',
    where: 'src/map/UnitLabelCache.ts',
    entries: () => entries.size,
    bytes: () => bytes,
    limitKind: 'bytes',
    limitValue: MAX_BYTES,
});

function clear(): void {
    entries.clear();
    bytes = 0;
}

if (typeof document !== 'undefined') document.fonts?.addEventListener('loadingdone', clear);

/** 缓存固定字号的描边文字；位置与兵力变化仍由调用方每帧提供。 */
export function drawUnitLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string): void {
    ctx.fillStyle = fill;
    const ratio = window.devicePixelRatio || 1;
    const key = JSON.stringify([text, ctx.font, ctx.strokeStyle, ctx.lineWidth, fill, ratio]);
    let entry = entries.get(key);
    if (!entry) {
        const metrics = ctx.measureText(text);
        const padding = 4;
        const width = Math.ceil(Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight)) + padding * 2;
        const height = Math.ceil(Math.max(20, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) + padding * 2;
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(width * ratio);
        canvas.height = Math.ceil(height * ratio);
        const target = canvas.getContext('2d');
        if (!target) {
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
            return;
        }
        target.scale(ratio, ratio);
        target.font = ctx.font;
        target.textAlign = 'center';
        target.textBaseline = 'top';
        target.strokeStyle = ctx.strokeStyle;
        target.lineWidth = ctx.lineWidth;
        target.lineJoin = ctx.lineJoin;
        target.fillStyle = fill;
        target.strokeText(text, width / 2, padding);
        target.fillText(text, width / 2, padding);
        entry = { canvas, width, height, bytes: canvas.width * canvas.height * 4 };
        if (entry.bytes <= MAX_BYTES) {
            while (bytes + entry.bytes > MAX_BYTES && entries.size) {
                const oldest = entries.keys().next().value!;
                bytes -= entries.get(oldest)!.bytes;
                entries.delete(oldest);
            }
            entries.set(key, entry);
            bytes += entry.bytes;
        }
    } else {
        entries.delete(key);
        entries.set(key, entry);
    }
    ctx.drawImage(entry.canvas, x - entry.width / 2, y - 4, entry.width, entry.height);
}
