import L from 'leaflet';

import { GameMap } from './GameMap';
import { LandSeaSystem, latToDemGlobalY, lngToDemGlobalX } from '../world/land-sea';
import { MAP_LAYER_ZINDEX, MAP_PANES } from '../config/MapLayers';
import { gameLog } from '../utils/GameLogger';

/**
 * 海陆分界调试图层（2026-08-04 主人要求）
 *
 * 作用：把游戏**真正在用**的海陆判定画出来——蓝色=海（军团在此变船、按统一海速），
 * 透明=陆，灰色=瓦片没到（游戏此刻当陆走，但其实还不知道），亮青线=分界线本身。
 *
 * 与既有「🌊 陆海视图」的区别：那个走 SpeedOverlayRenderer 的六边形网格，硬性要求
 * zoom≥9 且视野内 hex<1000，战略视角下什么都不画；且它判的是 hex 中心点，而军团
 * 实际是按连续经纬度判的。本图层逐屏幕像素采样，任何缩放级别都能看，判据与
 * Army.updateTerrainSpeed 完全同源（LandSeaSystem，见 WaterMask.ts）。
 *
 * 性能：默认关闭；开启后按 SAMPLE_STEP_PX 粗粒度采样（一屏约 3~4 万点），
 * 拖动期间限流重绘，停下再出完整结果。采样走 LandSeaSystem.probeLandSea——
 * 刻意绕开 resultCache，避免把军团正在用的判定缓存冲掉。
 */
export class LandSeaBoundaryLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private visible = false;

    /** 采样粒度（屏幕像素）：4px 在视觉上已看不出锯齿，采样量比逐像素少 16 倍 */
    private static readonly SAMPLE_STEP_PX = 4;
    /** 拖动期间最短重绘间隔；停下后 moveend 一定会补一次完整重绘 */
    private static readonly MOVE_REDRAW_MIN_INTERVAL_MS = 120;

    private static readonly COLOR_SEA = 'rgba(0, 122, 255, 0.30)';
    private static readonly COLOR_PENDING = 'rgba(130, 130, 130, 0.35)';
    private static readonly COLOR_COAST = '#00E5FF';

    private lastRedrawAt = 0;
    private rafPending = false;
    private lastSampleMs = 0;

    constructor(gameMap: GameMap) {
        this.map = gameMap.getLeafletMap();

        this.canvas = document.createElement('canvas');
        this.canvas.style.pointerEvents = 'none';
        this.canvas.className = 'leaflet-zoom-animated';
        this.canvas.style.display = 'none';
        this.ctx = this.canvas.getContext('2d')!;
        this.setupPane();

        this.map.on('move', this.onMapMove);
        this.map.on('zoom', this.onMapMove);
        this.map.on('moveend', this.onMapSettled);
        this.map.on('zoomend', this.onMapSettled);
        this.map.on('resize', this.onResize);

        // 掩膜/高程瓦片到货后判定会变，需重画（与 SpeedOverlayRenderer 同一事件）
        window.addEventListener('land-sea-tiles-updated', this.onTilesUpdated);

        this.resizeCanvas();
        gameLog('startup', '🌊 LandSeaBoundaryLayer 已初始化（默认关闭）');
    }

    private setupPane(): void {
        const paneName = MAP_PANES.LAND_SEA_DEBUG;
        if (!this.map.getPane(paneName)) {
            this.map.createPane(paneName);
            const created = this.map.getPane(paneName);
            if (created) {
                created.style.zIndex = String(MAP_LAYER_ZINDEX.LAND_SEA_DEBUG);
                created.style.pointerEvents = 'none';
            }
        }
        const pane = this.map.getPane(paneName) || this.map.getPanes().overlayPane;
        pane.appendChild(this.canvas);
    }

    // ── 事件（箭头函数：保证 off 时能摘干净） ──
    private onMapMove = (): void => {
        if (!this.visible) return;
        this.updateCanvasPosition();
        const now = performance.now();
        if (now - this.lastRedrawAt >= LandSeaBoundaryLayer.MOVE_REDRAW_MIN_INTERVAL_MS) {
            this.scheduleRedraw();
        } else {
            // 限流窗口内先清屏，避免旧图残留在错位的位置上误导判读
            this.clear();
        }
    };

    private onMapSettled = (): void => {
        if (!this.visible) return;
        this.updateCanvasPosition();
        this.scheduleRedraw();
    };

    private onResize = (): void => {
        this.resizeCanvas();
        if (this.visible) this.scheduleRedraw();
    };

    private onTilesUpdated = (): void => {
        if (this.visible) this.scheduleRedraw();
    };

    public isVisible(): boolean {
        return this.visible;
    }

    public setVisible(visible: boolean): void {
        if (this.visible === visible) return;
        this.visible = visible;
        this.canvas.style.display = visible ? '' : 'none';
        if (visible) {
            this.resizeCanvas();
            this.updateCanvasPosition();
            this.scheduleRedraw();
        } else {
            this.clear();
        }
        console.log(`🌊 海陆分界: ${visible ? '开启' : '关闭'}`);
    }

    public toggle(): boolean {
        this.setVisible(!this.visible);
        return this.visible;
    }

    private resizeCanvas(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.updateCanvasPosition();
    }

    private updateCanvasPosition(): void {
        L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]));
    }

    private clear(): void {
        this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private scheduleRedraw(): void {
        if (this.rafPending) return;
        this.rafPending = true;
        requestAnimationFrame(() => {
            this.rafPending = false;
            if (this.visible) this.render();
        });
    }

    private render(): void {
        const ctx = this.ctx;
        if (!ctx) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        if (w === 0 || h === 0) return;

        this.lastRedrawAt = performance.now();
        const t0 = this.lastRedrawAt;
        ctx.clearRect(0, 0, w, h);

        // 视口瓦片先预取，否则新进视野的区域永远是灰的
        LandSeaSystem.prefetchViewport(this.map);

        const step = LandSeaBoundaryLayer.SAMPLE_STEP_PX;
        const cols = Math.ceil(w / step) + 1;
        const rows = Math.ceil(h / step) + 1;

        // Web Mercator 下纬度只随 y 变、经度只随 x 变 ⇒ 行列各投影一次即可，
        // 比逐点 containerPointToLatLng 少算两个数量级（数万次 → 几百次）。
        // 直接算成 DEM 全局像素坐标，让探测器纯整数取值，不再逐点做三角运算。
        const demY = new Float64Array(rows);
        for (let r = 0; r < rows; r++) {
            demY[r] = latToDemGlobalY(this.map.containerPointToLatLng([0, Math.min(r * step, h)]).lat);
        }
        const demX = new Float64Array(cols);
        for (let c = 0; c < cols; c++) {
            demX[c] = lngToDemGlobalX(this.map.containerPointToLatLng([Math.min(c * step, w), 0]).lng);
        }

        // 0=陆 1=海 2=未到
        const probe = LandSeaSystem.createBlockProber();
        const grid = new Uint8Array(cols * rows);
        for (let r = 0; r < rows; r++) {
            const gy = demY[r];
            const rowBase = r * cols;
            for (let c = 0; c < cols; c++) {
                const kind = probe(demX[c], gy);
                grid[rowBase + c] = kind === 'sea' ? 1 : kind === 'pending' ? 2 : 0;
            }
        }

        this.fillRuns(ctx, grid, cols, rows, step);
        this.strokeCoastline(ctx, grid, cols, rows, step);

        this.lastSampleMs = performance.now() - t0;
        this.drawLegend(ctx, grid);
    }

    /** 按行合并连续同色格再填充：一屏 fillRect 从几万次降到几百次 */
    private fillRuns(
        ctx: CanvasRenderingContext2D,
        grid: Uint8Array,
        cols: number,
        rows: number,
        step: number,
    ): void {
        for (let r = 0; r < rows; r++) {
            const rowBase = r * cols;
            let c = 0;
            while (c < cols) {
                const v = grid[rowBase + c];
                if (v === 0) { c++; continue; }   // 陆地不涂，保持底图可读
                let end = c + 1;
                while (end < cols && grid[rowBase + end] === v) end++;
                ctx.fillStyle = v === 1
                    ? LandSeaBoundaryLayer.COLOR_SEA
                    : LandSeaBoundaryLayer.COLOR_PENDING;
                ctx.fillRect(c * step, r * step, (end - c) * step, step);
                c = end;
            }
        }
    }

    /** 海/陆相邻处描线；「未到」不参与，免得加载中的边界被误当成海岸线 */
    private strokeCoastline(
        ctx: CanvasRenderingContext2D,
        grid: Uint8Array,
        cols: number,
        rows: number,
        step: number,
    ): void {
        const path = new Path2D();
        const isEdge = (a: number, b: number) => (a === 1 && b === 0) || (a === 0 && b === 1);

        for (let r = 0; r < rows; r++) {
            const rowBase = r * cols;
            for (let c = 0; c < cols; c++) {
                const v = grid[rowBase + c];
                if (c + 1 < cols && isEdge(v, grid[rowBase + c + 1])) {
                    const x = (c + 1) * step;
                    path.moveTo(x, r * step);
                    path.lineTo(x, (r + 1) * step);
                }
                if (r + 1 < rows && isEdge(v, grid[rowBase + cols + c])) {
                    const y = (r + 1) * step;
                    path.moveTo(c * step, y);
                    path.lineTo((c + 1) * step, y);
                }
            }
        }

        // 先描一层深色再描亮色：亮青线压在浅色陆地上也看得清
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0, 40, 70, 0.75)';
        ctx.lineWidth = 3.5;
        ctx.stroke(path);
        ctx.strokeStyle = LandSeaBoundaryLayer.COLOR_COAST;
        ctx.lineWidth = 1.6;
        ctx.stroke(path);
    }

    /** 左下角小图例：不加这个，灰色区会被误读成「陆地」 */
    private drawLegend(ctx: CanvasRenderingContext2D, grid: Uint8Array): void {
        let pending = 0;
        for (let i = 0; i < grid.length; i++) if (grid[i] === 2) pending++;
        const pendingPct = grid.length > 0 ? (pending / grid.length) * 100 : 0;

        const rowsText: [string, string][] = [
            [LandSeaBoundaryLayer.COLOR_SEA, '海域（军团在此变船）'],
            [LandSeaBoundaryLayer.COLOR_COAST, '海陆分界线'],
        ];
        if (pending > 0) {
            rowsText.push([LandSeaBoundaryLayer.COLOR_PENDING, `瓦片加载中 ${pendingPct.toFixed(0)}%`]);
        }

        const pad = 8;
        const lineH = 16;
        const boxW = 178;
        const boxH = pad * 2 + lineH * rowsText.length + 14;
        const x = 10;
        const y = this.canvas.height - boxH - 10;

        ctx.save();
        ctx.fillStyle = 'rgba(20, 28, 34, 0.72)';
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = '11px "Noto Serif SC", SimSun, serif';
        ctx.textBaseline = 'middle';
        rowsText.forEach(([color, label], i) => {
            const cy = y + pad + lineH * i + lineH / 2;
            ctx.fillStyle = color;
            ctx.fillRect(x + pad, cy - 5, 16, 10);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.strokeRect(x + pad, cy - 5, 16, 10);
            ctx.fillStyle = '#e8f1f5';
            ctx.fillText(label, x + pad + 24, cy);
        });

        ctx.fillStyle = 'rgba(232,241,245,0.55)';
        ctx.fillText(
            `采样 ${LandSeaBoundaryLayer.SAMPLE_STEP_PX}px · ${this.lastSampleMs.toFixed(0)}ms`,
            x + pad,
            y + boxH - pad - 5,
        );
        ctx.restore();
    }

    public destroy(): void {
        this.map.off('move', this.onMapMove);
        this.map.off('zoom', this.onMapMove);
        this.map.off('moveend', this.onMapSettled);
        this.map.off('zoomend', this.onMapSettled);
        this.map.off('resize', this.onResize);
        window.removeEventListener('land-sea-tiles-updated', this.onTilesUpdated);
        this.canvas.remove();
    }
}
