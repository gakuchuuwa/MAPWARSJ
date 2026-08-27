import L from 'leaflet';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../data/CityWonders';
import { WONDER_NAME } from '../data/WonderNames';
import { WONDER_COORD } from '../data/WonderCoords';
import { CITIES_V2 } from '../data/cities_v2';

/** 奇观 monument 数据（原 MonumentData 类型内联，野外奇观已全部转城内奇观挂靠据点） */
interface MonumentData {
    id: string;
    name: string;
    category: 'HOLY_SITE' | 'ANCIENT_WONDER' | 'HERITAGE_FORT' | 'SACRED_PAGODA';
    lat: number;
    lng: number;
    asset: string;
    scale?: number;
    description: string;
}

/** 奇观 marker 基准宽度（px）：与城堡地标（baseSize×0.68）一般大小，比普通据点建筑（×0.40）略大更显眼 */
const BASE_SIZE = 90;
/** 重叠判定最小间距（度）：zoom 9 下 ≈ 90px（奇观 marker 宽），中心距小于此值判为重叠并外推 */
const OVERLAP_MIN_DEG = 0.25;

interface PlacedMonument extends MonumentData {
    /** marker 实际摆放坐标（重叠时可能相对真实坐标外推） */
    renderLat: number;
    renderLng: number;
}

export class MonumentLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private markers: Map<string, L.Marker> = new Map();
    private browseMonuments: PlacedMonument[] = [];

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
        interface WonderMonument extends MonumentData { assetKey: string; }
        const wonderMonuments: WonderMonument[] = Object.entries(CITY_WONDER)
            .map(([cityId, asset]): WonderMonument | null => {
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
                    assetKey: asset,
                    name: wonderName,
                    category: 'ANCIENT_WONDER' as const,
                    lat,
                    lng,
                    asset: `/SUCAI_BUILDING/${asset}/preview.png`,
                    description: `${place}的文明奇观·${wonderName}`,
                };
            })
            .filter((x): x is WonderMonument => x !== null);

        // [2026-08-28 主人定「所有奇观统称城内奇观」] 附加城内奇观（CITY_WONDER_EXTRA）：
        //   原野外奇观就近挂靠据点，同样参与去重叠。真实坐标保留在 lat/lng（弹窗用）。
        const extraMonuments: MonumentData[] = Object.entries(CITY_WONDER_EXTRA)
            .flatMap(([cityId, extras]) => {
                const city = cityById.get(cityId);
                if (!city) return [];
                return extras.map((ex) => ({
                    id: `extra_${cityId}_${ex.asset}`,
                    name: ex.name,
                    category: ex.category ?? 'ANCIENT_WONDER',
                    lat: ex.lat ?? city.lat,
                    lng: ex.lng ?? city.lng,
                    asset: `/SUCAI_BUILDING/${ex.asset}/preview.png`,
                    description: ex.description,
                }));
            });

        // [2026-08-27] 去重叠排序：正确挂靠（真实就在城市）优先落位固定；错位修正（WONDER_COORD）其次；
        // 附加城内奇观再次；野外名胜最后（暂留过渡，全部挂靠后删除）。
        // deoverlap 统一沿远离最近锚点外推，保证「城市地标留原位、重复/错位的往外散」。
        const allMonuments: MonumentData[] = [
            ...wonderMonuments.filter((m) => !WONDER_COORD[m.assetKey]),
            ...wonderMonuments.filter((m) => WONDER_COORD[m.assetKey]),
            ...extraMonuments,
        ];
        const placed = this.deoverlap(allMonuments);
        this.browseMonuments = placed;

        for (const mon of placed) {
            // [2026-08-28 主人要求「奇观和所有建筑一样随机镜像」]：会话级随机左右镜像，与 CityBuildingMirror.rollSessionCityMirror 一致
            const mirror = Math.random() < 0.5;
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
                        transform: translate(-50%, -60%)${mirror ? ' scaleX(-1)' : ''};
                        z-index: 2;
                        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translate(-50%, -65%) scale(1.08)${mirror ? ' scaleX(-1)' : ''}'" onmouseout="this.style.transform='translate(-50%, -60%) scale(1.0)${mirror ? ' scaleX(-1)' : ''}'" />
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

            // [2026-08-28 主人要求「奇观介绍写进文档，战略地图不显示」]：不再绑定详情弹窗
            this.markers.set(mon.id, marker);
        }
    }

    /**
     * 去重叠：所有 monument（挂城市奇观 + 野外名胜）按 all 数组顺序落位，
     * 若与任一已放置锚点中心距 < OVERLAP_MIN_DEG，则沿「远离最近锚点」的方向外推到 OVERLAP_MIN_DEG。
     * all 已按「正确挂靠 → 错位修正 → 野外」排序，故正确城市地标留原位，重复/错位的往外散。
     * 真实坐标保留在 mon.lat/lng（弹窗用），仅 renderLat/renderLng 参与摆放。
     */
    private deoverlap(all: MonumentData[]): PlacedMonument[] {
        const placed: PlacedMonument[] = [];
        const anchors: { lat: number; lng: number }[] = [];

        for (const mon of all) {
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

    public focusMonument(index: number, zoom = 10): { index: number; total: number; name: string } | null {
        const total = this.browseMonuments.length;
        if (total === 0) return null;
        const normalizedIndex = ((index % total) + total) % total;
        const monument = this.browseMonuments[normalizedIndex];
        this.map.setView([monument.renderLat, monument.renderLng], zoom, { animate: false });
        return { index: normalizedIndex, total, name: monument.name };
    }
}
