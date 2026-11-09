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

/** 一种文字样式。`id` 进缓存键，其余只在缓存未命中、要新画一张文字图时才用到。 */
export interface UnitLabelStyle {
    readonly id: string;
    readonly font: string;
    readonly stroke: string;
    readonly lineWidth: number;
    readonly fill: string;
}

/**
 * 缓存固定字号的描边文字；位置与兵力变化仍由调用方每帧提供。
 *
 * 🔴 [2026-11-09 查掉帧] 原来样式靠调用方先设 `ctx.font / strokeStyle / lineWidth`、本函数再读回来拼键：
 *    每个军团每帧三行字 = 三次 `ctx.font` 赋值（浏览器要解析字体串）+ 三次读回序列化，命中缓存时全是白做。
 *    改成显式传样式，键 = 文字 + 样式 id；命中时只剩查表 + drawImage，不碰画布状态。
 *    产物（离屏文字图）与原来逐像素一致：同字体、同描边、lineJoin 一律 round（原来三行实际都是 round）。
 */
export function drawUnitLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: UnitLabelStyle): void {
    const ratio = window.devicePixelRatio || 1;
    const key = `${text}\u0001${style.id}\u0001${ratio}`;
    let entry = entries.get(key);
    if (!entry) {
        const canvas = document.createElement('canvas');
        const target = canvas.getContext('2d');
        if (!target) {
            ctx.font = style.font;
            ctx.strokeStyle = style.stroke;
            ctx.lineWidth = style.lineWidth;
            ctx.lineJoin = 'round';
            ctx.fillStyle = style.fill;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
            return;
        }
        target.font = style.font;
        const metrics = target.measureText(text);
        const padding = 4;
        const width = Math.ceil(Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight)) + padding * 2;
        const height = Math.ceil(Math.max(20, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) + padding * 2;
        canvas.width = Math.ceil(width * ratio);
        canvas.height = Math.ceil(height * ratio);
        // 改尺寸会重置上下文状态，字体等要在这之后重新设
        target.scale(ratio, ratio);
        target.font = style.font;
        target.textAlign = 'center';
        target.textBaseline = 'top';
        target.strokeStyle = style.stroke;
        target.lineWidth = style.lineWidth;
        target.lineJoin = 'round';
        target.fillStyle = style.fill;
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
