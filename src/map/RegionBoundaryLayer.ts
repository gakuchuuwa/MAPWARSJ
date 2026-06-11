import L from 'leaflet';
import { REGION_BOUNDARY_ZOOM } from '../config/StrategicView';
import {
    REGION_BOUNDARY_LOOPS,
    REGION_BOUNDARY_COLORS,
    REGION_LABELS,
} from '../systems/RegionSystem';
import { CITIES_V2 } from '../data/cities_v2';

/** 14 文化区界城环线 — 仅在 zoom=6 显示；定义见 RegionSystem.ts REGION_BOUNDARY_LOOPS */
export class RegionBoundaryLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private polylines: L.Polyline[] = [];

    constructor(map: L.Map) {
        this.map = map;
        this.layerGroup = L.layerGroup();
        this.buildPolylines();
        this.map.on('zoomend', () => this.syncVisibility());
        this.syncVisibility();
    }

    private buildPolylines(): void {
        const cityById = new Map(CITIES_V2.map(c => [c.id, c]));

        for (const loop of REGION_BOUNDARY_LOOPS) {
            const latlngs: L.LatLngExpression[] = [];
            for (const cityId of loop.cityIds) {
                const city = cityById.get(cityId);
                if (!city) {
                    console.warn(`[RegionBoundaryLayer] 界城未找到: ${cityId} (${REGION_LABELS[loop.region]})`);
                    continue;
                }
                latlngs.push([city.lat, city.lng]);
            }
            if (latlngs.length < 2) continue;

            // 闭合环线
            const first = latlngs[0];
            const last = latlngs[latlngs.length - 1];
            if (Array.isArray(first) && Array.isArray(last)) {
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    latlngs.push(first);
                }
            }

            const color = REGION_BOUNDARY_COLORS[loop.region];
            const polyline = L.polyline(latlngs, {
                color,
                weight: 2.5,
                opacity: 0.85,
                dashArray: '8 6',
                interactive: false,
            });
            polyline.bindTooltip(REGION_LABELS[loop.region], {
                sticky: true,
                opacity: 0.9,
            });
            this.polylines.push(polyline);
            this.layerGroup.addLayer(polyline);
        }
    }

    private syncVisibility(): void {
        const show = Math.floor(this.map.getZoom()) === REGION_BOUNDARY_ZOOM;
        if (show) {
            if (!this.map.hasLayer(this.layerGroup)) {
                this.layerGroup.addTo(this.map);
            }
        } else if (this.map.hasLayer(this.layerGroup)) {
            this.map.removeLayer(this.layerGroup);
        }
    }
}
