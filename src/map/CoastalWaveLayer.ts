import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { RiverOverlayLayer } from './RiverOverlayLayer';
import { getSeaStormWaveBoostAt } from './WeatherLayer';

/**
 * CoastalWaveLayer - 战略地图开阔水面细纹与海岸潮汐层
 *
 * 1. 开阔水面：地理坐标固定的细碎波峰缓慢推进，深色波谷托住低亮波光，不随屏幕拖动打滑；
 * 2. 近岸：两组交错呼吸波浪沿水陆法线向岸推涌，曲线碎沫而非连续白边；
 * 3. 全视口单 Canvas、30fps、波纹按亮度分批描边，避免每朵浪单独 stroke 的开销。
 */
const PANE = 'coastalWavePane';
const MIN_ZOOM = 7;
const MAX_ZOOM = 12;
const FRAME_MS = 1000 / 30;

export class CoastalWaveLayer extends L.Layer {
    private map: L.Map | null = null;
    private riverLayer: RiverOverlayLayer | null = null;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private rafId: number | null = null;
    private visible = true;
    private lastRenderAt = -Infinity;

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

        // 🔴 [2026-10-31 修「玩家移动时有拖拽感」] 不在 move/zoom 事件里挪画布，只在 render() 绘制那一刻对齐
        //    （同 AnimalAmbientLayer 2026-10-28）。本层 30fps 且 rAF 排在主循环镜头平移之前：
        //    原来 move 时把画布钉回屏幕原点，跳过绘制的那帧浪花就「粘在屏幕上」不随地图走，下一帧再一跳。
        this.map.on('resize', this.resize);
        this.rafId = requestAnimationFrame(this.tick);
        return this;
    }

    public onRemove(map: L.Map): this {
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
        if (!this.map || !this.ctx || !this.visible || now - this.lastRenderAt < FRAME_MS) return;
        if (
            this.map.getContainer().style.visibility === 'hidden'
            || (window as any).game?.scene13War?.isActive?.() === true
            || ((window as any).game?.battleScene?.isLingering?.() === true && !(window as any).game?.navalWar?.isActive?.())
        ) return;
        this.lastRenderAt = now;

        const _t0 = performance.now();
        try {
            this.render(now);
        } finally {
            perfDoctor.note('CoastalWaveLayer.tick(海面细纹与海岸潮汐)', performance.now() - _t0, 'src/map/CoastalWaveLayer.ts:tick');
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
        this.syncCanvas();   // 画布与本次绘制用同一镜头位置（见 onAdd 说明）
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 🔴 [2026-10-11 主人「玩家在战略地图移动时掉帧」] 不再每帧 getBoundingClientRect：
        //    本层自有 rAF 紧跟在主循环 panBy 之后，读矩形会逼浏览器同步重排整张地图 DOM（实测 15 秒 793ms，全是它）。
        //    改用 Leaflet 坐标换算（只读已存的位置，不触发排版）：画布左上角 = 它的 layer 位置，瓦片左上角 = 瓦片坐标反投影。
        const map = this.map;
        const canvasPt = map.layerPointToContainerPoint(L.DomUtil.getPosition(this.canvas) ?? L.point(0, 0));
        const t = now / 1000;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const center = map.getCenter();
        const stormBoost = getSeaStormWaveBoostAt(center.lat, center.lng, now);

        for (let ti = 0; ti < activeTiles.length; ti++) {
            const { waves, ripples, coords } = activeTiles[ti];
            const tilePt = map.latLngToContainerPoint(map.unproject(L.point(coords.x * 256, coords.y * 256), coords.z));
            const tx = tilePt.x - canvasPt.x;
            const ty = tilePt.y - canvasPt.y;

            // 视口粗裁剪
            if (tx > cw || tx + 256 < 0 || ty > ch || ty + 256 < 0) continue;

            if (ripples) this.drawSeaRipples(g, ripples, tx, ty, t, cw, ch, stormBoost);
            if (!waves) continue;
            const len = waves.length;
            const waveSpeed = 0.28 * (1 + stormBoost * 1.15);
            for (let i = 0; i < len; i += 6) {
                const px = waves[i];
                const py = waves[i + 1];
                const nx = waves[i + 3];
                const ny = waves[i + 4];
                const noise = waves[i + 5];

                const sx = tx + px;
                const sy = ty + py;
                if (sx < -10 || sx > cw + 10 || sy < -10 || sy > ch + 10) continue;

                // 两组波浪交错循环（周期约 3.6 秒，暴风雨时急促翻涌）
                const basePhase = (t * waveSpeed + noise * 0.35 + (px * 0.02 + py * 0.03)) % 1;
                const phase1 = basePhase < 0 ? basePhase + 1 : basePhase;
                const phase2 = (phase1 + 0.5) % 1;

                const angle = Math.atan2(ny, nx) + Math.PI / 2;

                this.drawWaveCrest(g, sx, sy, nx, ny, phase1, angle, stormBoost);
                this.drawWaveCrest(g, sx, sy, nx, ny, phase2, angle, stormBoost);
            }
        }
    }

    /** 开阔海面：细波峰有慢速推进与呼吸，暴风雨时涌浪翻滚、白沫加亮。 */
    private drawSeaRipples(
        g: CanvasRenderingContext2D,
        ripples: Float32Array,
        tx: number, ty: number, t: number,
        cw: number, ch: number,
        stormBoost: number,
    ): void {
        // 四档亮度共用 Path2D：每块瓦片最多 8 次 stroke，而不是每根波纹两次。
        const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
        const rippleFreq = 0.16 * (1 + stormBoost * 1.35);
        const travelScale = 4.0 * (1 + stormBoost * 0.85);
        const halfScale = 1 + stormBoost * 0.45;
        const liftScale = 1 + stormBoost * 0.90;
        for (let i = 0; i < ripples.length; i += 5) {
            const px = ripples[i], py = ripples[i + 1];
            const sx = tx + px, sy = ty + py;
            if (sx < -20 || sx > cw + 20 || sy < -20 || sy > ch + 20) continue;

            const phase = (t * rippleFreq + ripples[i + 2]) % 1;
            const crest = Math.sin(phase * Math.PI);
            if (crest < 0.18 - stormBoost * 0.06) continue;
            const bucket = Math.min(3, Math.floor(crest * 4));
            const angle = ripples[i + 4];
            const dx = Math.cos(angle), dy = Math.sin(angle);
            const nx = -dy, ny = dx;
            const travel = (phase - 0.5) * travelScale;
            const wx = sx - nx * travel, wy = sy - ny * travel;
            const half = ripples[i + 3] * (0.38 + crest * 0.12) * halfScale;
            const lift = (0.35 + crest * 0.45) * liftScale;
            const path = paths[bucket];
            path.moveTo(wx - dx * half, wy - dy * half);
            path.quadraticCurveTo(wx + nx * lift, wy + ny * lift, wx + dx * half, wy + dy * half);
        }

        g.save();
        g.lineCap = 'round';
        g.lineJoin = 'round';
        const troughAlphaMul = 0.040 * (1 + stormBoost * 1.2);
        const crestAlphaMul = 0.18 * (1 + stormBoost * 1.15);
        for (let bucket = 0; bucket < paths.length; bucket++) {
            const strength = (bucket + 1) / paths.length;
            // 稍宽的深蓝波谷托住细亮波峰，海面有体积感但不靠高曝白光。
            g.strokeStyle = `rgba(8, 45, 72, ${(troughAlphaMul * strength).toFixed(3)})`;
            g.lineWidth = 1.65 + stormBoost * 0.65;
            g.stroke(paths[bucket]);
            g.strokeStyle = `rgba(195, 232, 242, ${(crestAlphaMul * strength).toFixed(3)})`;
            g.lineWidth = 0.72 + stormBoost * 0.42;
            g.stroke(paths[bucket]);
        }
        g.restore();
    }

    private drawWaveCrest(
        g: CanvasRenderingContext2D,
        sx: number, sy: number,
        nx: number, ny: number,
        phase: number, angle: number,
        stormBoost: number,
    ): void {
        // 向岸微推，末段随碎沫淡化。
        const travel = (1 - phase) * (2.8 + stormBoost * 2.2);
        const wx = sx - nx * travel;
        const wy = sy - ny * travel;

        const crest = Math.sin(phase * Math.PI);
        const alpha = Math.pow(crest, 3.0) * (0.20 + stormBoost * 0.18);
        if (alpha < 0.015) return;

        const dx = Math.cos(angle), dy = Math.sin(angle);
        const half = (1.8 + phase * 1.2) * (1 + stormBoost * 0.45);
        g.save();
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(wx - dx * half, wy - dy * half);
        g.quadraticCurveTo(wx + nx * (0.45 + stormBoost * 0.35), wy + ny * (0.45 + stormBoost * 0.35), wx + dx * half, wy + dy * half);
        g.strokeStyle = `rgba(22, 93, 111, ${(alpha * 0.45).toFixed(3)})`;
        g.lineWidth = 1.5 + stormBoost * 0.5;
        g.stroke();
        g.strokeStyle = `rgba(244, 252, 250, ${alpha.toFixed(3)})`;
        g.lineWidth = 0.65 + stormBoost * 0.35;
        g.stroke();
        g.restore();
    }
}
