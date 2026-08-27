import L from 'leaflet';
import { STRATEGIC_VEGETATION, StrategicTree } from '../data/StrategicVegetation';

/** 树木 marker 基准尺寸 (px) */
const BASE_TREE_SIZE = 44;

export class VegetationLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private markers: Map<string, L.Marker> = new Map();

    constructor(map: L.Map) {
        this.map = map;

        // 创建专用 Pane，确保植被在底图之上、据点 (610) 与奇观 (650) 之下
        if (!this.map.getPane('vegetationPane')) {
            this.map.createPane('vegetationPane');
            const pane = this.map.getPane('vegetationPane');
            if (pane) {
                pane.style.zIndex = '590';
                pane.style.pointerEvents = 'none';
            }
        }

        this.layerGroup = L.layerGroup().addTo(this.map);
        this.renderTrees();

        // 随地图缩放平滑缩放
        this.map.on('zoomend', () => this.updateScale());
        this.updateScale();
    }

    private updateScale(): void {
        const zoom = this.map.getZoom();
        // zoom <= 6 隐藏；zoom 7=0.5, 8=0.75, 9=1.0, 10=1.35, 11=1.75
        const scale = zoom <= 6 ? 0 : Math.max(0.3, 1.0 + (zoom - 9) * 0.35);
        const pane = this.map.getPane('vegetationPane');
        if (pane) {
            pane.style.setProperty('--veg-scale', String(scale));
            pane.style.display = zoom <= 6 ? 'none' : 'block';
        }
    }

    public renderTrees(): void {
        this.layerGroup.clearLayers();
        this.markers.clear();

        for (const tree of STRATEGIC_VEGETATION) {
            const sizeMult = tree.scale || 1.0;
            const w = Math.round(BASE_TREE_SIZE * sizeMult);
            const h = w;

            const icon = L.divIcon({
                className: 'strategic-tree-container',
                html: `
                    <div class="strategic-tree-wrapper" style="
                        width: ${w}px;
                        height: ${h}px;
                        position: relative;
                        display: flex;
                        align-items: flex-end;
                        justify-content: center;
                        transform: scale(var(--veg-scale, 1));
                        transform-origin: bottom center;
                        transition: transform 0.2s ease-out;
                        pointer-events: none;
                    ">
                        <!-- 微弱地表自然阴影 -->
                        <div style="
                            position: absolute;
                            bottom: 2px;
                            width: ${w * 0.75}px;
                            height: ${h * 0.28}px;
                            background: radial-gradient(ellipse at center, rgba(10, 5, 0, 0.45) 0%, rgba(0,0,0,0) 70%);
                            border-radius: 50%;
                            z-index: 1;
                        "></div>
                        <!-- 树木高清立绘 -->
                        <img src="/SUCAI_NATURE/${tree.asset}/preview.png" style="
                            width: ${w}px;
                            height: ${h}px;
                            object-fit: contain;
                            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
                            z-index: 2;
                            pointer-events: none;
                        " alt="${tree.name}" />
                    </div>
                `,
                iconSize: [w, h],
                iconAnchor: [w / 2, h * 0.9],
            });

            const marker = L.marker([tree.lat, tree.lng], {
                icon,
                pane: 'vegetationPane',
                interactive: false,
            });

            marker.addTo(this.layerGroup);
            this.markers.set(tree.id, marker);
        }
    }
}
