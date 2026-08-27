import L from 'leaflet';
import { WILDERNESS_MONUMENTS, WildernessMonument } from '../data/WildernessMonuments';

export class MonumentLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private markers: Map<string, L.Marker> = new Map();

    /** 真实坐标不动；仅给相距 10km 内的名胜分配屏幕像素错位，避免素材互相覆盖。 */
    private buildVisualOffsets(): Map<string, { x: number; y: number }> {
        const monuments = WILDERNESS_MONUMENTS;
        const parent = monuments.map((_, i) => i);
        const root = (i: number): number => parent[i] === i ? i : (parent[i] = root(parent[i]));
        const join = (a: number, b: number): void => {
            const ra = root(a), rb = root(b);
            if (ra !== rb) parent[rb] = ra;
        };
        const distanceKm = (a: WildernessMonument, b: WildernessMonument): number => {
            const rad = Math.PI / 180;
            const p1 = a.lat * rad, p2 = b.lat * rad;
            const dp = (b.lat - a.lat) * rad, dl = (b.lng - a.lng) * rad;
            const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
            return 12742 * Math.asin(Math.sqrt(h));
        };
        for (let i = 0; i < monuments.length; i++) {
            for (let j = i + 1; j < monuments.length; j++) {
                if (distanceKm(monuments[i], monuments[j]) < 10) join(i, j);
            }
        }
        const groups = new Map<number, number[]>();
        for (let i = 0; i < monuments.length; i++) {
            const r = root(i);
            groups.set(r, [...(groups.get(r) ?? []), i]);
        }
        const offsets = new Map<string, { x: number; y: number }>();
        for (const indices of groups.values()) {
            if (indices.length < 2) continue;
            const radius = 38;
            indices.forEach((idx, order) => {
                const angle = order * Math.PI * 2 / indices.length;
                offsets.set(monuments[idx].id, {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius * 0.35,
                });
            });
        }
        return offsets;
    }

    constructor(map: L.Map) {
        this.map = map;
        
        // 创建专用高层级 Pane，确保奇观在据点（cityPane 610）与常规标记之上
        if (!this.map.getPane('monumentPane')) {
            this.map.createPane('monumentPane');
            const pane = this.map.getPane('monumentPane');
            if (pane) {
                pane.style.zIndex = '650';
            }
        }

        this.layerGroup = L.layerGroup().addTo(this.map);
        this.renderMonuments();
    }

    private renderMonuments(): void {
        this.layerGroup.clearLayers();
        this.markers.clear();
        const visualOffsets = this.buildVisualOffsets();

        // [2026-08-27 纠正尺寸]：野外单体名胜与城池单体建筑/城堡尺寸精确对齐（基准 60px）
        const baseSize = 68;

        for (const mon of WILDERNESS_MONUMENTS) {
            const offset = visualOffsets.get(mon.id) ?? { x: 0, y: 0 };
            const scale = mon.scale || 1.0;
            const w = 68;
            const h = w;
            const groundW = w * 1.6;
            const groundH = groundW * 0.58;

            // 自然野外地基：根据名胜类型选择岩石/泥地/石板底座
            const plazaSrc = mon.category === 'HERITAGE_FORT' 
                ? '/SUCAI_TERRAIN/rck_plaza.png'
                : (mon.category === 'ANCIENT_WONDER' ? '/SUCAI_TERRAIN/rd2_plaza.png' : '/SUCAI_TERRAIN/pm1_plaza.png');

            const html = `
                <div class="wilderness-monument-container" style="
                    position: relative;
                    width: ${w.toFixed(0)}px;
                    height: ${(h + 30).toFixed(0)}px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transform: translate(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px);
                ">
                    <!-- 2.5D 自然羽化底座 -->
                    <img src="${plazaSrc}" style="
                        position: absolute;
                        left: 50%;
                        top: 58%;
                        width: ${groundW.toFixed(1)}px;
                        height: ${groundH.toFixed(1)}px;
                        transform: translate(-50%, -50%);
                        z-index: 1;
                        opacity: 0.88;
                        pointer-events: none;
                    " />
                    <!-- 名胜建筑立绘 -->
                    <img src="${mon.asset}" style="
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        width: ${w.toFixed(1)}px;
                        transform: translate(-50%, -60%);
                        z-index: 2;
                        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translate(-50%, -65%) scale(1.08)'" onmouseout="this.style.transform='translate(-50%, -60%) scale(1.0)'" />
                    <!-- 金色名胜标牌 -->
                    <div style="
                        position: absolute;
                        bottom: -4px;
                        left: 50%;
                        transform: translateX(-50%);
                        white-space: nowrap;
                        background: linear-gradient(180deg, rgba(20, 24, 30, 0.95) 0%, rgba(10, 12, 16, 0.98) 100%);
                        border: 1px solid rgba(212, 175, 55, 0.85);
                        border-radius: 3px;
                        padding: 1px 5px;
                        color: #f7e6a1;
                        font-size: 11px;
                        font-weight: bold;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.9);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.6);
                        z-index: 3;
                        pointer-events: none;
                    ">
                        ${mon.name}
                    </div>
                </div>
            `;

            const icon = L.divIcon({
                className: 'monument-icon',
                html: html,
                iconSize: [w, h + 30],
                iconAnchor: [w / 2, (h + 30) / 2]
            });

            const marker = L.marker([mon.lat, mon.lng], {
                icon: icon,
                interactive: true,
                pane: 'monumentPane'
            }).addTo(this.layerGroup);

            // 绑定悬停与点击详情弹窗
            const popupContent = `
                <div style="padding: 6px 10px; font-family: sans-serif; color: #eee; background: #1a1e24; border-radius: 6px; border: 1px solid #d4af37; max-width: 240px;">
                    <div style="font-size: 13px; font-weight: bold; color: #ffd700; border-bottom: 1px solid rgba(212,175,55,0.4); padding-bottom: 3px; margin-bottom: 5px;">
                        ${mon.name}
                    </div>
                    <div style="font-size: 11px; color: #ccc; line-height: 1.4;">
                        ${mon.description}
                    </div>
                    <div style="margin-top: 5px; font-size: 10px; color: #888;">
                        坐标：${mon.lat.toFixed(3)}°N, ${mon.lng.toFixed(3)}°E
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent, {
                className: 'monument-popup',
                closeButton: false,
                offset: L.point(0, -20)
            });

            this.markers.set(mon.id, marker);
        }
    }

    public setVisible(visible: boolean): void {
        if (visible) {
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
