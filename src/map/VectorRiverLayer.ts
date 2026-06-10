
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

    constructor(data: any, options?: L.LayerOptions) {
        super([], options); // Initialize empty FeatureGroup

        // 1. 初始化 WGS84 组 (Create WGS84 Group)
        this.wgs84Group = this.createRiverGroup(data, options?.pane);

        // 2. 预计算偏移数据 (Pre-calculate GCJ02 Data)
        // [PERFORMANCE] Done once at startup, zero runtime cost later.
        const offsetData = VectorRiverLayer.applyGCJ02Offset(data);

        // 3. 初始化 GCJ02 组 (Create GCJ02 Group)
        this.gcj02Group = this.createRiverGroup(offsetData, options?.pane);

        // 4. Default: Show WGS84 (Standard)
        this.addLayer(this.wgs84Group);
        // this.addLayer(this.gcj02Group); // Don't add yet

        gameLog('startup', '[VectorRiverLayer] Initialized with Dual-Buffer (WGS84 + GCJ02) ready.');
    }

    /**
     * 辅助方法：创建统一的双层河流组 (Border + Water)
     * Reduces code duplication.
     */
    private createRiverGroup(data: any, pane?: string): L.FeatureGroup {
        const group = new L.FeatureGroup();

        // 1. Border Layer (Bottom)
        const border = new L.GeoJSON(data, {
            style: (feature) => VectorRiverLayer.getBorderStyle(feature, 9),
            pane: pane
        });
        (border as any).riverType = 'border'; // Tag for updates

        // 2. Water Layer (Top)
        const water = new L.GeoJSON(data, {
            style: (feature) => VectorRiverLayer.getWaterStyle(feature, 9),
            pane: pane
        });
        (water as any).riverType = 'water'; // Tag for updates

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

        // Fast Switch
        this.clearLayers(); // Remove current visible

        if (enable) {
            // Show GCJ-02 (Offset)
            this.addLayer(this.gcj02Group);
        } else {
            // Show WGS-84 (Standard)
            this.addLayer(this.wgs84Group);
        }
    }

    /**
     * Force refresh the layer rendering.
     * Call this after re-adding to the map to ensure proper layer order.
     */
    public refresh() {
        this.clearLayers();
        if (this.currentOffsetMode) {
            this.addLayer(this.gcj02Group);
        } else {
            this.addLayer(this.wgs84Group);
        }
    }

    /**
     * Update dynamic styles for BOTH groups (Background & Foreground)
     * 确保切换过去时样式也是正确的。
     */
    public updateStyle(zoom: number) {
        const updateGroup = (group: L.FeatureGroup) => {
            group.eachLayer((layer: any) => {
                if (layer.riverType === 'border') {
                    layer.setStyle((feature: any) => VectorRiverLayer.getBorderStyle(feature, zoom));
                } else if (layer.riverType === 'water') {
                    layer.setStyle((feature: any) => VectorRiverLayer.getWaterStyle(feature, zoom));
                }
            });
        };

        updateGroup(this.wgs84Group);
        updateGroup(this.gcj02Group);
    }

    // --- Styling Logic ---

    // 读取 scalerank 并转换为渲染等级
    // NE scalerank: 0-3=大江大河(长江/黄河), 4-6=中等, 7-10=支流
    private static getRiverTier(feature: any): number {
        const rank = feature?.properties?.scalerank ?? 7;
        if (rank <= 3) return 0;  // 大江大河
        if (rank <= 6) return 1;  // 中等河流
        return 2;                  // 小河支流
    }

    // 1. Water Style — 统一宽度, 仅颜色按等级分化
    // 大江深蓝(水量足/主干), 支流浅蓝(源头清浅)
    private static getWaterStyle(feature: any, zoom: number): L.PathOptions {
        const tier = VectorRiverLayer.getRiverTier(feature);
        const zoomMult = VectorRiverLayer.getScaleMultiplier(zoom);
        const colors = ['#3E7FAF', '#5A95C0', '#7BB8D4'];

        let weight = Math.max(3.0 * zoomMult, 1.5);

        return {
            color: colors[tier],
            weight: weight,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'vector-river-water'
        };
    }

    // 2. Border Style — 统一宽度, 软化颜色配合 sage 调色板
    private static getBorderStyle(feature: any, zoom: number): L.PathOptions {
        const tier = VectorRiverLayer.getRiverTier(feature);
        const zoomMult = VectorRiverLayer.getScaleMultiplier(zoom);
        let waterWeight = Math.max(3.0 * zoomMult, 1.5);
        let borderWeight = waterWeight + 1.0;

        return {
            color: '#2E4A5F',
            weight: borderWeight,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'vector-river-border'
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
}
