
import L from 'leaflet';
import { gameLog } from '../utils/GameLogger';

/**
 * VectorRiverLayer
 * 
 * 使用 GeoJSON 矢量数据渲染真实的河流层。
 * 数据源: Natural Earth Rivers + Lake Centerlines (1:10m)
 * 
 * [ENHANCEMENT] 双层渲染 (Casing)
 * 为了模拟真实地图的"黑边"效果，我们使用两层 GeoJSON：
 * 1. 底层 (Border Layer): 深色，较宽 (Base + 2px)
 * 2. 顶层 (Water Layer): 浅蓝色，标准宽
 * 
 * [OPTIMIZATION] 预计算 + 双缓冲 (Pre-calculation & Double Buffering)
 * 为了解决缩放时的性能问题和"乱飞"现象，我们在初始化时就生成两套图层：
 * 1. WGS84 组 (Zoom 10+)
 * 2. GCJ02 组 (Zoom 8-9)
 * 运行时只需切换图层显示，无需任何计算。
 */
export class VectorRiverLayer extends L.FeatureGroup {
    private wgs84Group: L.FeatureGroup;
    private gcj02Group: L.FeatureGroup;
    private currentOffsetMode: boolean = false;
    /** 上次设定样式用的 zoom 档位；换组时据此补刷新组 */
    private lastStyledZoom: number | null = null;
    /** 上次真正刷过样式的**档位**（getScaleMultiplier 的返回值）。同档位内换 zoom 值不必重设。 */
    private lastStyledMult: number | null = null;

    constructor(data: any, options?: L.LayerOptions) {
        super([], options); // Initialize empty FeatureGroup

        // [SMOOTHING] 对 GeoJSON 坐标应用 Chaikin 拐角曲线平滑算法，消除硬直角折线感
        //
        // [PERF 2026-07-27] 迭代次数 2 → 1。每轮 Chaikin 顶点数约翻倍，2 轮 ≈ 原始的 4 倍，
        // 而 Leaflet 在每次 zoomend 都要把全部顶点重新投影（实测 330~600ms，缩放卡顿的剩余大头）。
        // Chaikin 收敛很快：1 轮已把直角切成圆角，第 2 轮的增量在 2~4px 线宽下肉眼难辨。
        const smoothedData = VectorRiverLayer.applyChaikinSmoothing(data, 1);

        // 1. 初始化 WGS84 组 (Create WGS84 Group)
        this.wgs84Group = this.createRiverGroup(smoothedData, options?.pane);

        // 2. 预计算偏移数据 (Pre-calculate GCJ02 Data)
        // [PERFORMANCE] Done once at startup, zero runtime cost later.
        const offsetData = VectorRiverLayer.applyGCJ02Offset(smoothedData);

        // 3. 初始化 GCJ02 组 (Create GCJ02 Group)
        this.gcj02Group = this.createRiverGroup(offsetData, options?.pane);

        // 4. Default: Show WGS84 (Standard)
        this.addLayer(this.wgs84Group);

        gameLog('startup', '[VectorRiverLayer] Initialized with Chaikin Curve Smoothing & Dual-Buffer ready.');
    }

    /**
     * 辅助方法：创建统一的双层河流组 (Border + Water)
     * Reduces code duplication.
     */
    private createRiverGroup(data: any, pane?: string): L.FeatureGroup {
        const group = new L.FeatureGroup();

        // 1. 底层描边（Border/Casing Layer）：深墨蓝，切断山谷杂乱阴影，提升山间河流辨识度
        const border = new L.GeoJSON(data, {
            style: (feature) => VectorRiverLayer.getBorderStyle(feature, 9),
            pane: pane
        });
        (border as any).riverType = 'border';

        // 2. 顶层水体线（Water Layer）：纯正浅蓝，亮丽不透明
        const water = new L.GeoJSON(data, {
            style: (feature) => VectorRiverLayer.getWaterStyle(feature, 9),
            pane: pane
        });
        (water as any).riverType = 'water';

        group.addLayer(border);
        group.addLayer(water);

        return group;
    }

    /**
     * [OPTIMIZED] 极速切换坐标系
     * 简单的图层移除/添加，无计算，无重建。
     * @param enable - true = GCJ02 (offset), false = WGS84 (standard)
     * @param force - force refresh even if mode hasn't changed
     */
    public setOffsetMode(enable: boolean, force: boolean = false) {
        if (!force && this.currentOffsetMode === enable) return;
        this.currentOffsetMode = enable;

        // [注意 2026-07-27] 这里并不是"零计算"。clearLayers + addLayer 会让 Leaflet
        // 把新组每条河的每个顶点重新投影并重建 SVG 路径，实测一次约 327ms。
        // 所以调用方必须避免在高频路径（行军↔战斗）上跨越坐标系分界。
        this.clearLayers(); // Remove current visible
        this.addLayer(enable ? this.gcj02Group : this.wgs84Group);
        this.styleLiveGroup();
    }

    /**
     * Force refresh the layer rendering.
     * Call this after re-adding to the map to ensure proper layer order.
     */
    public refresh() {
        this.clearLayers();
        this.addLayer(this.currentOffsetMode ? this.gcj02Group : this.wgs84Group);
        this.styleLiveGroup();
    }

    /**
     * Update dynamic styles for BOTH groups (Background & Foreground)
     * 确保切换过去时样式也是正确的。
     */
    public updateStyle(zoom: number) {
        // 🔴 [2026-08-25 性能修·主人报「战略地图也卡」] 缓存必须按**档位**判，不能按 zoom 值判。
        //    样式只经 getScaleMultiplier 分 4 档：<=7→0.5 / 8~9→1.0 / 10~11→1.5 / >=12→2.0。
        //    旧写法 `lastStyledZoom === zoom` 是按具体 zoom 值缓存，于是 ZoomController 的
        //    行军 8↔9、战斗 10↔11 每次切档都判定"变了" → 全量 setStyle 约 2910 条 path，
        //    **而这两对 zoom 的 multiplier 完全相同、样式一模一样**，243ms 纯白花。
        //    实测（scratch/zoom_perf_log.jsonl 最近 3000 次缩放）：这个 handler 累计
        //    724982ms / 2980 次 = **243ms/次**，是全部监听器里最贵的一个。
        //    ZoomController 自动切档 ≥15s 一次，等于每十几秒白冻一次画面。
        const mult = VectorRiverLayer.getScaleMultiplier(zoom);
        this.lastStyledZoom = zoom;
        if (this.lastStyledMult === mult) return;   // 同档位：样式必然相同，一条都不用重设
        this.lastStyledMult = mult;
        // [PERF 2026-07-27] 原来对 wgs84/gcj02 两组都重设样式，其中一组根本不在地图上，
        // 白花一半时间（实测两组合计约 465ms）。改为只刷当前显示的那组，
        // 换组时由 setOffsetMode/refresh 补刷，视觉结果完全一致。
        this.styleLiveGroup();
    }

    /** 只给当前挂在地图上的那一组重设样式 */
    private styleLiveGroup(): void {
        const zoom = this.lastStyledZoom;
        if (zoom === null) return;
        const group = this.currentOffsetMode ? this.gcj02Group : this.wgs84Group;
        group.eachLayer((layer: any) => {
            if (layer.riverType === 'border') {
                layer.setStyle((feature: any) => VectorRiverLayer.getBorderStyle(feature, zoom));
            } else if (layer.riverType === 'water') {
                layer.setStyle((feature: any) => VectorRiverLayer.getWaterStyle(feature, zoom));
            }
        });
    }

    // --- Styling Logic ---

    // 1. Border Style — 底层深墨蓝描边，切断山谷阴影，让山间水系清晰显现
    private static getBorderStyle(feature: any, zoom: number): L.PathOptions {
        const featureCla = feature?.properties?.featurecla;
        if (featureCla === 'Lake Centerline') {
            return {
                stroke: false,
                opacity: 0
            };
        }

        const zoomMult = VectorRiverLayer.getScaleMultiplier(zoom);
        const waterWeight = Math.max(2.0 * zoomMult, 1.0);
        return {
            color: 'rgba(20, 38, 60, 0.75)',
            weight: waterWeight + 1.8,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'vector-river-border'
        };
    }

    // 2. Water Style — 顶层浅蓝水流主体
    private static getWaterStyle(feature: any, zoom: number): L.PathOptions {
        const featureCla = feature?.properties?.featurecla;
        if (featureCla === 'Lake Centerline') {
            return {
                stroke: false,
                opacity: 0
            };
        }

        const zoomMult = VectorRiverLayer.getScaleMultiplier(zoom);
        return {
            color: '#6496C8',
            weight: Math.max(2.0 * zoomMult, 1.0),
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'vector-river-water'
        };
    }

    private static getScaleMultiplier(zoom: number): number {
        if (zoom >= 12) return 2.0;
        else if (zoom >= 10) return 1.5;
        else if (zoom <= 7) return 0.5;
        return 1.0;
    }

    // GCJ-02 Offset Logic (Mars Coordinates)
    private static applyGCJ02Offset(geojson: any): any {
        const PI = 3.1415926535897932384626;
        const ee = 0.00669342162296594323;
        const a = 6378245.0;

        const transformLat = (x: number, y: number) => {
            let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
            return ret;
        };

        const transformLon = (x: number, y: number) => {
            let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
            return ret;
        };

        const wgs2gcj = (lng: number, lat: number): [number, number] => {
            if (lng < 103.0 || lng > 115.0 || lat < 29.0 || lat > 39.0) {
                return [lng, lat];
            }
            let dLat = transformLat(lng - 105.0, lat - 35.0);
            let dLon = transformLon(lng - 105.0, lat - 35.0);
            const radLat = lat / 180.0 * PI;
            let magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            const sqrtMagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
            dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
            return [lng + dLon, lat + dLat];
        };

        const newData = JSON.parse(JSON.stringify(geojson));

        if (newData.type === 'FeatureCollection') {
            for (const feature of newData.features) {
                if (feature.geometry && feature.geometry.coordinates) {
                    const traverse = (arr: any[]) => {
                        if (arr.length >= 2 && typeof arr[0] === 'number') {
                            const [lng, lat] = wgs2gcj(arr[0], arr[1]);
                            arr[0] = lng;
                            arr[1] = lat;
                        } else {
                            arr.forEach(item => traverse(item));
                        }
                    };
                    traverse(feature.geometry.coordinates);
                }
            }
        }
        return newData;
    }

    /**
     * [Chaikin Smoothing Algorithm]
     * 对 GeoJSON 的折线坐标做角点切削平滑，把生硬的直角折线转成自然水流曲线。
     * 轮数由调用方给（当前 1 轮，见构造函数处的性能说明），每轮顶点数约翻倍。
     */
    private static applyChaikinSmoothing(geojson: any, iterations: number = 1): any {
        if (!geojson) return geojson;
        const newData = JSON.parse(JSON.stringify(geojson));

        const smoothLine = (coords: [number, number][]): [number, number][] => {
            if (!coords || coords.length <= 2) return coords;
            let current = coords;
            for (let it = 0; it < iterations; it++) {
                const smoothed: [number, number][] = [];
                smoothed.push(current[0]);
                for (let i = 0; i < current.length - 1; i++) {
                    const p0 = current[i];
                    const p1 = current[i + 1];

                    const q: [number, number] = [
                        0.75 * p0[0] + 0.25 * p1[0],
                        0.75 * p0[1] + 0.25 * p1[1]
                    ];
                    const r: [number, number] = [
                        0.25 * p0[0] + 0.75 * p1[0],
                        0.25 * p0[1] + 0.75 * p1[1]
                    ];
                    smoothed.push(q);
                    smoothed.push(r);
                }
                smoothed.push(current[current.length - 1]);
                current = smoothed;
            }
            return current;
        };

        if (newData.type === 'FeatureCollection' && Array.isArray(newData.features)) {
            for (const feature of newData.features) {
                if (feature.geometry && feature.geometry.coordinates) {
                    const geomType = feature.geometry.type;
                    if (geomType === 'LineString') {
                        feature.geometry.coordinates = smoothLine(feature.geometry.coordinates);
                    } else if (geomType === 'MultiLineString') {
                        feature.geometry.coordinates = feature.geometry.coordinates.map((line: any) => smoothLine(line));
                    }
                }
            }
        }
        return newData;
    }
}
