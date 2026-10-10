import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { RiverOverlayLayer } from './RiverOverlayLayer';

/**
 * CoastalWaveLayer - 战略地图海岸线动态海浪/潮汐层
 *
 * 功能：
 * 1. 浅滩过渡上的动态点睛：在陆地边缘碧绿环礁与浅滩水面，增加极微弱、半透明的白色泛浪与潮汐微动；
 * 2. 真实推涌动态：两组交错呼吸波浪，沿着水陆法线向陆地方向自然涌动后轻柔消散；
 * 3. 性能极其轻量：全视口单 Canvas，仅在 zoom 7~12 显示，开销 < 0.2ms，低功耗高帧率。
 */
const PANE = 'coastalWavePane';
const MIN_ZOOM = 7;
const MAX_ZOOM = 12;

export class CoastalWaveLayer extends L.Layer {
    private map: L.Map | null = null;
    private riverLayer: RiverOverlayLayer | null = null;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private rafId: number | null = null;
    private visible = true;

    constructor(riverLayer: RiverOverlayLayer) {
        super();
        this.riverLayer = riverLayer;
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
    }

    public onAdd(map: L.Map): this {
        this.map = map;
        if (!map.getPane(PANE)) {
            map.createPane(PANE);
            const pane = map.getPane(PANE)!;
            pane.style.zIndex = '342'; // 位于 riverPane(340)之上，低于领土/道路(350)
            pane.style.pointerEvents = 'none';
        }
        const pane = map.getPane(PANE)!;
        pane.appendChild(this.canvas);

        this.resize();
        this.syncCanvas();

        this.map.on('move', this.syncCanvas);
        this.map.on('zoom', this.syncCanvas);
        this.map.on('resize', this.resize);
        this.rafId = requestAnimationFrame(this.tick);
        return this;
    }

    public onRemove(map: L.Map): this {
        this.map?.off('move', this.syncCanvas);
        this.map?.off('zoom', this.syncCanvas);
        this.map?.off('resize', this.resize);
        this.map = null;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.canvas.remove();
        return this;
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
        if (!visible && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private resize = (): void => {
        if (!this.map) return;
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';
        this.syncCanvas();
    };

    private syncCanvas = (): void => {
        if (!this.map) return;
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
    };

    private tick = (now: number): void => {
        this.rafId = requestAnimationFrame(this.tick);
        if (!this.map || !this.ctx || !this.visible) return;

        const _t0 = performance.now();
        try {
            this.render(now);
        } finally {
            perfDoctor.note('CoastalWaveLayer.tick(海岸微浪潮汐)', performance.now() - _t0, 'src/map/CoastalWaveLayer.ts:tick');
        }
    };

    private render(now: number): void {
        if (!this.map || !this.ctx || !this.riverLayer) return;
        const zoom = this.map.getZoom();
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        const activeTiles = this.riverLayer.getActiveWaveTiles();
        if (activeTiles.length === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        const g = this.ctx;
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 🔴 [2026-10-11 主人「玩家在战略地图移动时掉帧」] 不再每帧 getBoundingClientRect：
        //    本层自有 rAF 紧跟在主循环 panBy 之后，读矩形会逼浏览器同步重排整张地图 DOM（实测 15 秒 793ms，全是它）。
        //    改用 Leaflet 坐标换算（只读已存的位置，不触发排版）：画布左上角 = 它的 layer 位置，瓦片左上角 = 瓦片坐标反投影。
        const map = this.map;
        const canvasPt = map.layerPointToContainerPoint(L.DomUtil.getPosition(this.canvas) ?? L.point(0, 0));
        const t = now / 1000;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        for (let ti = 0; ti < activeTiles.length; ti++) {
            const { waves, coords } = activeTiles[ti];
            const tilePt = map.latLngToContainerPoint(map.unproject(L.point(coords.x * 256, coords.y * 256), coords.z));
            const tx = tilePt.x - canvasPt.x;
            const ty = tilePt.y - canvasPt.y;

            // 视口粗裁剪
            if (tx > cw || tx + 256 < 0 || ty > ch || ty + 256 < 0) continue;

            const len = waves.length;
            for (let i = 0; i < len; i += 6) {
                const px = waves[i];
                const py = waves[i + 1];
                const nx = waves[i + 3];
                const ny = waves[i + 4];
                const noise = waves[i + 5];

                const sx = tx + px;
                const sy = ty + py;
                if (sx < -10 || sx > cw + 10 || sy < -10 || sy > ch + 10) continue;

                // 两组波浪交错循环（周期约 3.6 秒，缓慢悠扬）
                const basePhase = (t * 0.28 + noise * 0.35 + (px * 0.02 + py * 0.03)) % 1;
                const phase1 = basePhase < 0 ? basePhase + 1 : basePhase;
                const phase2 = (phase1 + 0.5) % 1;

                const angle = Math.atan2(ny, nx) + Math.PI / 2;

                // 潮浪 1
                this.drawWaveCrest(g, sx, sy, nx, ny, phase1, angle);
                // 潮浪 2
                this.drawWaveCrest(g, sx, sy, nx, ny, phase2, angle);
            }
        }
    }

    private drawWaveCrest(
        g: CanvasRenderingContext2D,
        sx: number, sy: number,
        nx: number, ny: number,
        phase: number, angle: number,
    ): void {
        // 向岸微推 (仅 2.0 像素)
        const travel = (1 - phase) * 2.0;
        const wx = sx - nx * travel;
        const wy = sy - ny * travel;

        // 极轻微的微沫泛白呼吸（峰值仅 0.16）
        const crest = Math.sin(phase * Math.PI);
        const alpha = Math.pow(crest, 3.0) * 0.16;
        if (alpha < 0.015) return;

        g.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        g.beginPath();
        g.ellipse(wx, wy, 1.5 + phase * 0.5, 0.60, angle, 0, Math.PI * 2);
        g.fill();
    }
}
