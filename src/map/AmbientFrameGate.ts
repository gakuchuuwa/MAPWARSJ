import type * as L from 'leaflet';

/**
 * 🔴 [2026-11-08 减负：战略地图移动时风扇狂转] 纯装饰画布（据点民生 / 动物 / 商队 / 海洋生物）的限帧闸。
 *
 * 这些层各自跑 rAF，在 144Hz 屏上每秒整屏重画 144 次，而它们的精灵动画本身只有 10~18 帧/秒。
 * 闸门规则：
 *   - 距上次绘制满 1/30 秒 → 画；
 *   - 缩放变了、或 Leaflet 重置了图层坐标原点（setView 吸附）→ 立刻画（否则画布会错位）；
 *   - 镜头平移超过 maxPanPx → 立刻画（防止画布边缘露空）；
 *   - 其余帧跳过。
 *
 * 跳过的帧里画布不挪位置：这几层的画布挂在地图 pane 里、只在绘制那一刻对齐镜头，
 * 所以不重画时画布随地图 pane 一起平移，画面上的动物/车队仍钉在地形上，不会滑动。
 *
 * 调用方必须在闸门之后才更新自己的 lastTime，被跳过的时长会并入下一帧的 dt。
 */
export class AmbientFrameGate {
    private lastRunAt = -Infinity;
    private lastZoom = NaN;
    private lastOriginX = NaN;
    private lastOriginY = NaN;
    private lastTopLeftX = NaN;
    private lastTopLeftY = NaN;

    constructor(
        private readonly minIntervalMs = 1000 / 30,
        private readonly maxPanPx = 32,
    ) {}

    public shouldRun(now: number, map: L.Map): boolean {
        const zoom = map.getZoom();
        const origin = map.getPixelOrigin();
        const topLeft = map.getPixelBounds().min!;
        const due = now - this.lastRunAt >= this.minIntervalMs - 1;
        const viewReset = zoom !== this.lastZoom || origin.x !== this.lastOriginX || origin.y !== this.lastOriginY;
        const panned = Math.abs(topLeft.x - this.lastTopLeftX) > this.maxPanPx
            || Math.abs(topLeft.y - this.lastTopLeftY) > this.maxPanPx;
        if (!due && !viewReset && !panned) return false;
        this.lastRunAt = now;
        this.lastZoom = zoom;
        this.lastOriginX = origin.x;
        this.lastOriginY = origin.y;
        this.lastTopLeftX = topLeft.x;
        this.lastTopLeftY = topLeft.y;
        return true;
    }
}
