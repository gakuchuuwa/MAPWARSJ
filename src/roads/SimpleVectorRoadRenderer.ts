
import * as L from 'leaflet';
import { VECTOR_ROAD_DATA } from '../data/VectorRoadData';
import { smoothRoad } from '../utils/GeometryUtils';
import { roadRegistry } from './RoadRegistry';

/**
 * 道路样式配置 (Road Style Configuration)
 * 基于用户提供的配色方案 (Earth Tones)
 */
const ROAD_STYLE = {
    innerColor: '#A1887F',
    outerColor: '#4E342E',
    width: 2,
    borderWidth: 4
};

// [PERF] 渲染降级阈值
// zoom < MIN_RENDER_ZOOM: 完全不渲染（zoom≤8 宏观视图不显示道路）
// zoom <= CASED_LINE_ZOOM: 只渲染 inner 一层（省一半 SVG 节点）
// zoom > CASED_LINE_ZOOM: 渲染 outer + inner 双层 cased-line
const MIN_RENDER_ZOOM = 9;
const CASED_LINE_ZOOM = 8;

// [PERF] Chaikin 平滑迭代次数 (3 → 2: 顶点数从 ×8 降到 ×4)
const CHAIKIN_ITERATIONS = 2;

export class SimpleVectorRoadRenderer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private visible: boolean = false;
    private currentYear: number = -236; // 默认值，由外部 setYear 同步
    /** 上次重绘时的「可见路网签名」：年份变了但可见路网没变 → 跳过全量重绘（2026-06-12 性能） */
    private lastRenderedYearSignature: string | null = null;

    constructor(map: L.Map) {
        this.map = map;
        this.layerGroup = L.layerGroup();
        this.render();

        // [FIX] 监听道路更新事件，确保编辑器切换路线/删除路线时，底层的旧道路能立即消失
        roadRegistry.onRoadsUpdated(() => {
            this.render();
        });

        // [PERF] zoom 变化时按 LOD 重渲染
        this.map.on('zoomend', () => this.render());
        this.map.on('zoom', () => {
            if (this.map.getZoom() < MIN_RENDER_ZOOM && this.layerGroup.getLayers().length > 0) {
                this.layerGroup.clearLayers();
            }
        });
    }

    /** 某年可见路网签名（仅按 startYear/endYear 过滤，不做几何/绘制，廉价 O(features)） */
    private computeYearSignature(year: number): string {
        const feats = VECTOR_ROAD_DATA.features;
        let sig = '';
        for (let i = 0; i < feats.length; i++) {
            const f = feats[i];
            if (!f || !f.properties || !f.geometry) continue;
            const s = f.properties.startYear;
            const e = f.properties.endYear;
            if (s !== undefined && year < s) continue;
            if (e !== undefined && year > e) continue;
            sig += i + ',';
        }
        return sig;
    }

    public setYear(year: number): void {
        if (year === this.currentYear) return;
        this.currentYear = year;
        // 绝大多数年份路网可见集不变（仅少数路有年份限制）→ 跳过 40ms 全量重绘，消除每年顿挫
        const sig = this.computeYearSignature(year);
        if (sig === this.lastRenderedYearSignature) return;
        this.render();
    }

    public render(): void {
        this.layerGroup.clearLayers();
        // 记录本次重绘对应的可见路网签名，供 setYear 判断「年份变了但路网没变」跳过重绘
        this.lastRenderedYearSignature = this.computeYearSignature(this.currentYear);

        const zoom = this.map.getZoom();
        if (zoom < MIN_RENDER_ZOOM) {
            return; // 低 zoom 直接跳过整套渲染
        }

        const drawOuter = zoom > CASED_LINE_ZOOM;

        // [PERF] 按 currentYear 过滤 + 提前算好 smoothed latLngs
        const features = VECTOR_ROAD_DATA.features.filter(f => {
            if (!f || !f.properties || !f.geometry) return false;
            const startYear = f.properties.startYear;
            const endYear = f.properties.endYear;
            if (startYear !== undefined && this.currentYear < startYear) return false;
            if (endYear !== undefined && this.currentYear > endYear) return false;
            return true;
        });

        // 预算平滑后的坐标（两遍渲染共用）
        const prepared = features.map(f => ({
            latLngs: smoothRoad(
                f.geometry.coordinates.map(c => [c[1], c[0]] as [number, number]),
                CHAIKIN_ITERATIONS
            )
        }));

        if (drawOuter) {
            // 第一遍：底层轮廓
            for (const p of prepared) {
                this.drawPass(p.latLngs, 'outer');
            }
        }

        // 第二遍：顶层填充
        for (const p of prepared) {
            this.drawPass(p.latLngs, 'inner');
        }
    }

    private drawPass(
        latLngs: [number, number][],
        pass: 'inner' | 'outer'
    ): void {
        const style = ROAD_STYLE;
        const polyline = L.polyline(latLngs, {
            color: pass === 'inner' ? style.innerColor : style.outerColor,
            weight: pass === 'inner' ? style.width : style.borderWidth,
            opacity: pass === 'inner' ? 1.0 : 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            className: pass === 'inner' ? 'road-inner' : 'road-outer'
        });
        this.layerGroup.addLayer(polyline);
    }


    public toggle(show: boolean): void {
        this.visible = show;
        if (show) {
            if (!this.map.hasLayer(this.layerGroup)) {
                this.map.addLayer(this.layerGroup);
            }
        } else {
            if (this.map.hasLayer(this.layerGroup)) {
                this.map.removeLayer(this.layerGroup);
            }
        }
    }
}
