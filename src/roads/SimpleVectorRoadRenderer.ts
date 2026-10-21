
import * as L from 'leaflet';
import { VECTOR_ROAD_DATA } from '../data/VectorRoadData';
import { smoothRoad } from '../utils/GeometryUtils';
import { roadRegistry } from './RoadRegistry';

/**
 * 道路样式配置 (Road Style Configuration)
 * 基于用户提供的配色方案 (Earth Tones)
 */
const ROAD_STYLE = {
    innerColor: '#B6A183',
    outerColor: '#42352A',
    width: 2,
    borderWidth: 4
};

/**
 * 🔴 2026-10-21 主人令「中原要美化」第一步：战略图官道默认显示。
 *   原来线上与开发侧栏都写死关闭，中原平原一丝路都没有，看上去像一块空绿布。
 *   数据（VectorRoadData）本来就是按「城—城」画好的，缺的只是这一下开关。
 */
export const ROAD_LAYER_VISIBLE_BY_DEFAULT = true;

/**
 * 线宽按 zoom 加档：Z8 远景细、Z9/Z10 战略视距要看得见又不能压过城池、
 * Z11+ 放大后跟着粗起来。旧版所有档位都是 2/4，Z9 上一整张平原只有一根发丝。
 */
function widthsForZoom(zoom: number): { inner: number; outer: number } {
    if (zoom <= 8) return { inner: 2, outer: 3.5 };
    if (zoom <= 9) return { inner: 3, outer: 5 };
    if (zoom <= 10) return { inner: 4, outer: 6.5 };
    return { inner: 5.5, outer: 8.5 };
}

// [PERF] 渲染降级阈值
// zoom < MIN_RENDER_ZOOM: 完全不渲染（zoom≤7 宏观战略视图不显示道路）
// zoom 8 起可见（2026-08-07 改：原阈值 9，调试面板在开机 zoom=8 点「道路显示」无反应）
// zoom <= CASED_LINE_ZOOM: 只渲染 inner 一层（省一半 SVG 节点）
// zoom > CASED_LINE_ZOOM: 渲染 outer + inner 双层 cased-line
const MIN_RENDER_ZOOM = 8;
const CASED_LINE_ZOOM = 8;

// [PERF] Chaikin 平滑迭代次数 (3 → 2: 顶点数从 ×8 降到 ×4)
const CHAIKIN_ITERATIONS = 2;

/** 视口外扩倍数：与 VectorRiverLayer 同口径，1.0 = 上下左右各多留一屏才重建 */
const CULL_PAD = 1.0;

type PreparedRoad = {
    /** 平滑后的 [lat, lng] */
    latLngs: [number, number][];
    south: number; north: number; west: number; east: number;
    startYear?: number; endYear?: number;
};

export class SimpleVectorRoadRenderer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private visible: boolean = false;
    private currentYear: number = -236; // 默认值，由外部 setYear 同步
    /** 上次重绘时的「可见路网签名」：年份变了但可见路网没变 → 跳过全量重绘（2026-06-12 性能） */
    private lastRenderedYearSignature: string | null = null;
    /** 全库道路的平滑坐标 + bbox，构造时算一次（原来每次 render 都重算 3048 条 = 151ms） */
    private prepared: PreparedRoad[] = [];
    /** 上次裁剪所用的地图范围；视口没走出它就不重建 */
    private culledBounds: L.LatLngBounds | null = null;

    constructor(map: L.Map) {
        this.map = map;
        this.layerGroup = L.layerGroup();
        this.rebuildPrepared();
        this.render();

        // [FIX] 监听道路更新事件，确保编辑器切换路线/删除路线时，底层的旧道路能立即消失
        roadRegistry.onRoadsUpdated(() => {
            this.rebuildPrepared();
            this.culledBounds = null;   // 路网数据变了，旧裁剪范围作废
            this.render();
        });

        // [PERF] zoom 变化时按 LOD 重渲染
        this.map.on('zoomend', () => this.render());
        // [PERF] 只在视口走出上次裁剪范围时才重建（跟拍平移不再每次重画 3048 条 SVG）
        this.map.on('moveend', () => {
            if (!this.visible) return;
            if (this.culledBounds && this.culledBounds.contains(this.map.getBounds())) return;
            this.render();
        });
        this.map.on('zoom', () => {
            if (this.map.getZoom() < MIN_RENDER_ZOOM && this.layerGroup.getLayers().length > 0) {
                this.layerGroup.clearLayers();
            }
        });
    }

    /** 平滑几何 + 逐条 bbox，只在构造与道路数据变更时跑一次 */
    private rebuildPrepared(): void {
        const out: PreparedRoad[] = [];
        for (const f of VECTOR_ROAD_DATA.features) {
            if (!f || !f.properties || !f.geometry) continue;
            const coords = f.geometry.coordinates;
            if (!coords?.length) continue;
            const latLngs = smoothRoad(
                coords.map(c => [c[1], c[0]] as [number, number]),
                CHAIKIN_ITERATIONS
            );
            let south = Infinity, north = -Infinity, west = Infinity, east = -Infinity;
            for (const [lat, lng] of latLngs) {
                if (lat < south) south = lat;
                if (lat > north) north = lat;
                if (lng < west) west = lng;
                if (lng > east) east = lng;
            }
            out.push({
                latLngs,
                south, north, west, east,
                startYear: f.properties.startYear,
                endYear: f.properties.endYear,
            });
        }
        this.prepared = out;
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
        // 隐藏时 layerGroup 已从地图摘下，重建出来的 polyline 没人看得见。
        if (!this.visible) {
            this.layerGroup.clearLayers();
            this.culledBounds = null;
            this.lastRenderedYearSignature = null; // 下次显示时强制重绘
            return;
        }
        this.layerGroup.clearLayers();
        // 记录本次重绘对应的可见路网签名，供 setYear 判断「年份变了但路网没变」跳过重绘
        this.lastRenderedYearSignature = this.computeYearSignature(this.currentYear);

        const zoom = this.map.getZoom();
        if (zoom < MIN_RENDER_ZOOM) {
            this.culledBounds = null;
            return; // 低 zoom 直接跳过整套渲染
        }

        const drawOuter = zoom > CASED_LINE_ZOOM;
        const widths = widthsForZoom(zoom);

        // 🔴 [PERF] 视口裁剪：全库 3048 条路，Z9 一屏 ~90 条，其余全是白烧的 SVG 节点。
        const bounds = this.map.getBounds().pad(CULL_PAD);
        this.culledBounds = bounds;
        const south = bounds.getSouth(), north = bounds.getNorth();
        const west = bounds.getWest(), east = bounds.getEast();
        const year = this.currentYear;

        const visible = this.prepared.filter((r) => {
            if (r.startYear !== undefined && year < r.startYear) return false;
            if (r.endYear !== undefined && year > r.endYear) return false;
            return r.west <= east && r.east >= west && r.south <= north && r.north >= south;
        });

        if (drawOuter) {
            // 第一遍：底层轮廓
            for (const r of visible) {
                this.drawPass(r.latLngs, 'outer', widths);
            }
        }

        // 第二遍：顶层填充
        for (const r of visible) {
            this.drawPass(r.latLngs, 'inner', widths);
        }
    }

    private drawPass(
        latLngs: [number, number][],
        pass: 'inner' | 'outer',
        widths: { inner: number; outer: number }
    ): void {
        const style = ROAD_STYLE;
        const polyline = L.polyline(latLngs, {
            color: pass === 'inner' ? style.innerColor : style.outerColor,
            weight: pass === 'inner' ? widths.inner : widths.outer,
            opacity: pass === 'inner' ? 1.0 : 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            className: pass === 'inner' ? 'road-inner' : 'road-outer'
        });
        this.layerGroup.addLayer(polyline);
    }


    public toggle(show: boolean): void {
        const wasVisible = this.visible;
        this.visible = show;
        if (show) {
            if (!this.map.hasLayer(this.layerGroup)) {
                this.map.addLayer(this.layerGroup);
            }
            // 隐藏期间 render() 是空转，图层里没有内容——重新显示时补画一次
            if (!wasVisible) this.render();
        } else {
            if (this.map.hasLayer(this.layerGroup)) {
                this.map.removeLayer(this.layerGroup);
            }
        }
    }
}
