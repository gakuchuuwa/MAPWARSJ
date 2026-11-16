import L from 'leaflet';
import { GREAT_WALL_SEGMENTS, resolveGreatWallSegmentLatLngs } from '../data/GreatWallData';
import { smoothRoad } from '../utils/GeometryUtils';

const PANE = 'greatWallPane';
const MIN_RENDER_ZOOM = 4;
const CHAIKIN_ITERATIONS = 2;

const LINE_STYLE = {
    outerColor: '#2c1e16',
    innerColor: '#e2b75b',
    outerOpacity: 0.9,
    innerOpacity: 0.95,
};

/**
 * 战略地图长城图层（第一阶段：线路预览）。
 *
 * 先在战略地图上绘出西起嘉峪关、东至山海关的长城线路供核对走向；
 * 确认路线后再按道路体系并入路网并沿线摆设 DE 垛墙素材。
 */
export class GreatWallLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private preparedLines: [number, number][][] = [];
    private visible = true;

    constructor(map: L.Map) {
        this.map = map;

        if (!this.map.getPane(PANE)) {
            this.map.createPane(PANE);
            const pane = this.map.getPane(PANE);
            if (pane) {
                pane.style.zIndex = '605';
                pane.style.pointerEvents = 'none';
            }
        }

        this.layerGroup = L.layerGroup().addTo(this.map);
        this.prepareGeometry();
        this.render();

        this.map.on('zoomend', () => this.render());
    }

    private prepareGeometry(): void {
        const stitched: [number, number][] = [];
        for (const seg of GREAT_WALL_SEGMENTS) {
            const pts = resolveGreatWallSegmentLatLngs(seg);
            if (pts.length < 2) continue;
            if (stitched.length === 0) {
                stitched.push(...pts);
            } else {
                const last = stitched[stitched.length - 1];
                const first = pts[0];
                const sameStart = Math.abs(last[0] - first[0]) < 1e-4 && Math.abs(last[1] - first[1]) < 1e-4;
                stitched.push(...(sameStart ? pts.slice(1) : pts));
            }
        }
        this.preparedLines = stitched.length >= 2 ? [smoothRoad(stitched, CHAIKIN_ITERATIONS)] : [];
    }

    public setVisible(show: boolean): void {
        if (this.visible === show) return;
        this.visible = show;
        if (show) {
            if (!this.map.hasLayer(this.layerGroup)) {
                this.map.addLayer(this.layerGroup);
            }
            this.render();
        } else {
            this.layerGroup.clearLayers();
            if (this.map.hasLayer(this.layerGroup)) {
                this.map.removeLayer(this.layerGroup);
            }
        }
    }

    public render(): void {
        this.layerGroup.clearLayers();
        if (!this.visible) return;

        const zoom = this.map.getZoom();
        if (zoom < MIN_RENDER_ZOOM) return;

        const innerW = zoom <= 6 ? 2.5 : zoom <= 8 ? 3.5 : 5;
        const outerW = innerW + (zoom <= 6 ? 2 : 3);

        for (const latLngs of this.preparedLines) {
            L.polyline(latLngs, {
                color: LINE_STYLE.outerColor,
                weight: outerW,
                opacity: LINE_STYLE.outerOpacity,
                lineCap: 'round',
                lineJoin: 'round',
                interactive: false,
                pane: PANE,
            }).addTo(this.layerGroup);

            L.polyline(latLngs, {
                color: LINE_STYLE.innerColor,
                weight: innerW,
                opacity: LINE_STYLE.innerOpacity,
                lineCap: 'round',
                lineJoin: 'round',
                interactive: false,
                pane: PANE,
            }).addTo(this.layerGroup);
        }
    }
}
