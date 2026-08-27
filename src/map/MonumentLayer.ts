import L from 'leaflet';
import { WILDERNESS_MONUMENTS, WildernessMonument } from '../data/WildernessMonuments';
import { CITY_WONDER } from '../data/CityWonders';
import { WONDER_NAME } from '../data/WonderNames';
import { WONDER_COORD } from '../data/WonderCoords';
import { CITIES_V2 } from '../data/cities_v2';

/** 野外/城市奇观 marker 基准宽度（px），与据点建筑尺寸基准对齐 */
const BASE_SIZE = 68;
/** 重叠判定最小间距（度）：zoom 9 下 ≈ 68px（marker 宽），中心距小于此值判为重叠并外推 */
const OVERLAP_MIN_DEG = 0.19;

interface PlacedMonument extends WildernessMonument {
    /** marker 实际摆放坐标（重叠时可能相对真实坐标外推） */
    renderLat: number;
    renderLng: number;
}

export class MonumentLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private markers: Map<string, L.Marker> = new Map();

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

        // [2026-08-27 主人要求「名胜随地图缩放」]：与据点 cityPane 同一线性公式（9=1.0/10=1.5/11=2.0…）
        this.map.on('zoomend', () => this.updateScale());
        this.updateScale();
    }

    /** 名胜随缩放：公式与 TerritorySystem.updateCityScales 一致（1.0 + (zoom-9)*0.5，下限 0） */
    private updateScale(): void {
        const zoom = this.map.getZoom();
        const scale = Math.max(0, 1.0 + (zoom - 9) * 0.5);
        const pane = this.map.getPane('monumentPane');
        if (pane) pane.style.setProperty('--monument-scale', String(scale));
    }

    private renderMonuments(): void {
        this.layerGroup.clearLayers();
        this.markers.clear();

        // [2026-08-27 主人定「把所有奇观按坐标独立摆放到战略地图，不动据点」]：名城奇观也按城市坐标独立摆放
        const cityById = new Map(CITIES_V2.map((c) => [c.id, c]));
        const wonderMonuments: WildernessMonument[] = Object.entries(CITY_WONDER)
            .map(([cityId, asset]): WildernessMonument | null => {
                const city = cityById.get(cityId);
                if (!city) return null;
                const wonderName = WONDER_NAME[asset] || city.name;
                // [2026-08-27] 奇观按史实真实坐标独立摆放：错位的用 WONDER_COORD，其余回退城市坐标
                const coord = WONDER_COORD[asset];
                const lat = coord?.lat ?? city.lat;
                const lng = coord?.lng ?? city.lng;
                const place = coord?.place ?? city.name;
                return {
                    id: `wonder_${cityId}`,
                    name: wonderName,
                    category: 'ANCIENT_WONDER' as const,
                    lat,
                    lng,
                    asset: `/SUCAI_BUILDING/${asset}/preview.png`,
                    description: `${place}的文明奇观·${wonderName}`,
                };
            })
            .filter((x): x is WildernessMonument => x !== null);
        const allMonuments = [...WILDERNESS_MONUMENTS, ...wonderMonuments];

        // [2026-08-27 主人要求「重叠的奇观以重叠点为中心排列，不要重叠」]：
        // 挂城市奇观固定在城市坐标（城市地标不动）；野外名胜若与固定点/已放名胜重叠则沿远离方向外推。
        const placed = this.deoverlap(allMonuments, new Set(wonderMonuments.map((m) => m.id)));

        for (const mon of placed) {
            const w = BASE_SIZE;
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
                    transform: scale(var(--monument-scale, 1));
                    transform-origin: 50% 50%;
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

            const marker = L.marker([mon.renderLat, mon.renderLng], {
                icon: icon,
                interactive: true,
                pane: 'monumentPane'
            }).addTo(this.layerGroup);

            // 绑定悬停与点击详情弹窗（坐标显示真实经纬度，非外推后的渲染坐标）
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

    /**
     * 去重叠：挂城市奇观是城市地标，固定在城市坐标不动；
     * 野外名胜若与任一固定点（或已放置的野外名胜）中心距 < OVERLAP_MIN_DEG，
     * 则沿「远离最近锚点」的方向外推到 OVERLAP_MIN_DEG，使 marker 互不遮挡。
     * 真实坐标保留在 mon.lat/lng（弹窗用），仅 renderLat/renderLng 参与摆放。
     */
    private deoverlap(all: WildernessMonument[], fixedIds: Set<string>): PlacedMonument[] {
        const placed: PlacedMonument[] = [];
        const anchors: { lat: number; lng: number }[] = [];

        // 第一遍：固定点（挂城市奇观）先落位，作为锚
        for (const mon of all) {
            if (fixedIds.has(mon.id)) {
                placed.push({ ...mon, renderLat: mon.lat, renderLng: mon.lng });
                anchors.push({ lat: mon.lat, lng: mon.lng });
            }
        }
        // 第二遍：野外名胜按序落位，重叠则外推
        for (const mon of all) {
            if (fixedIds.has(mon.id)) continue;
            let rLat = mon.lat;
            let rLng = mon.lng;
            let nearest: { lat: number; lng: number } | null = null;
            let minD = Infinity;
            for (const a of anchors) {
                const d = Math.hypot(rLat - a.lat, rLng - a.lng);
                if (d < minD) { minD = d; nearest = a; }
            }
            if (nearest && minD < OVERLAP_MIN_DEG) {
                const dLat = rLat - nearest.lat;
                const dLng = rLng - nearest.lng;
                const d = Math.hypot(dLat, dLng) || 1e-9;
                rLat = nearest.lat + (dLat / d) * OVERLAP_MIN_DEG;
                rLng = nearest.lng + (dLng / d) * OVERLAP_MIN_DEG;
            }
            placed.push({ ...mon, renderLat: rLat, renderLng: rLng });
            anchors.push({ lat: rLat, lng: rLng });
        }
        return placed;
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
