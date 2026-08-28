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
/** [2026-08-28 主人要求「杰姆宣礼塔图改大」、「斯芬克斯雕像缩小」、「德尔斐神谕缩小」]：单独调整相对基准宽的倍数 */
const WONDER_SCALE_OVERRIDE: Record<string, number> = {
    'MINARET_OF_JAM': 1.15,         // 杰姆宣礼塔（贾姆宣礼塔）：缩小至 1.15 倍，保持修长协调
    'SCEN_INDIAN_RUINS': 0.9,       // 亨比巨石神庙群遗迹：缩小至 0.9 倍
    'SCEN_SPHINX': 0.65,            // 斯芬克斯雕像：雕像体量较小，缩小至 0.65 倍
    'SCEN_ARCHAIC_THOLOS': 0.75,    // 德尔斐神谕（古圆庙）：缩小至 0.75 倍
    'ARCH_OF_CONSTANTINE': 0.55,    // 君士坦丁凯旋门：缩小至 0.55 倍，体量更小巧精致，紧邻斗兽场呈现良好纵深感
    'SEAS_WONDER_MALAY': 0.8,       // 卡拉桑神庙：缩小至 0.8 倍
};
/** [2026-08-29] 个别奇观素材底部带大段地面阴影（实心底边远高于精灵底边），常规「底边锚定」会把建筑抬高悬空。
 *  按该奇观实心底边改用 top 锚定到底座前角（参考其它奇观「实心底边≈精灵底边」的成熟做法）。
 *  键 = SUCAI_BUILDING 素材目录名；值 = top 像素（基准宽 90 下）。 */
const WONDER_GROUND_TOP: Record<string, number> = {
    'ORIE_WONDER_PERSIANS': 10,     // 泰西封巨拱：实心底边仅 65.5%（下方 34.5% 为地面阴影）→ 下移让其踏到底座前角
};
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
                    scale: WONDER_SCALE_OVERRIDE[asset],
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
                    scale: WONDER_SCALE_OVERRIDE[ex.asset],
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
            const w = BASE_SIZE * (mon.scale ?? 1);
            const h = w;
            const groundW = w * 1.6;
            const groundH = groundW * 0.58;

            // 自然野外地基：根据名胜类型选择岩石/泥地/石板底座
            const plazaSrc = mon.category === 'HERITAGE_FORT'
                ? '/SUCAI_TERRAIN/rck_plaza.png'
                : (mon.category === 'ANCIENT_WONDER' ? '/SUCAI_TERRAIN/rd2_plaza.png' : '/SUCAI_TERRAIN/pm1_plaza.png');

            const containerH = h + 30;
            // 底座菱形中心设在 62%，底边前角在 ~74%（加 0.238*groundH）
            // 建筑以底部地基为基准锚定（bottom: bottomOffset），使建筑地基完美踏在底座菱形中心，彻底解决悬空错位
            const plazaCenterY = containerH * 0.62;
            const plazaFrontY = plazaCenterY + 0.238 * groundH;
            const bottomOffset = Math.max(16, Math.round(containerH - plazaFrontY));

            // [2026-08-29] 素材名 + 实心底边锚定：个别底部带地面阴影的奇观（泰西封巨拱）用 top 锚定实心底边，其余走原底边锚定
            const assetName = mon.asset.split('/').filter(Boolean).slice(-2)[0] ?? '';
            const groundTop = WONDER_GROUND_TOP[assetName];
            const anchorStyle = groundTop != null ? `top: ${groundTop}px;` : `bottom: ${bottomOffset}px;`;

            const html = `
                <div class="wilderness-monument-container" style="
                    position: relative;
                    width: ${w.toFixed(0)}px;
                    height: ${containerH.toFixed(0)}px;
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
                        top: 62%;
                        width: ${groundW.toFixed(1)}px;
                        height: ${groundH.toFixed(1)}px;
                        transform: translate(-50%, -50%);
                        z-index: 1;
                        opacity: 0.88;
                        pointer-events: none;
                    " />
                    <!-- 名胜建筑立绘：默认按精灵底边锚定到底座前角；底部带大段地面阴影的奇观改用 top 锚定实心底边，避免抬高悬空 -->
                    <img src="${mon.asset}" style="
                        position: absolute;
                        left: 50%;
                        ${anchorStyle}
                        width: ${w.toFixed(1)}px;
                        transform: translateX(-50%)${mirror ? ' scaleX(-1)' : ''};
                        transform-origin: 50% 100%;
                        z-index: 2;
                        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateX(-50%) scale(1.08)${mirror ? ' scaleX(-1)' : ''}'" onmouseout="this.style.transform='translateX(-50%) scale(1.0)${mirror ? ' scaleX(-1)' : ''}'" />
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
            // [2026-08-28 主人要求「君士坦丁凯旋门和罗马斗兽场两个奇观要挨着」]：紧邻搭档允许紧凑间距(0.06度)
            const minReqDeg = mon.id.includes('ARCH_OF_CONSTANTINE') ? 0.06 : OVERLAP_MIN_DEG;
            for (const a of anchors) {
                const d = Math.hypot(rLat - a.lat, rLng - a.lng);
                if (d < minD) { minD = d; nearest = a; }
            }
            if (nearest && minD < minReqDeg) {
                const dLat = rLat - nearest.lat;
                const dLng = rLng - nearest.lng;
                const d = Math.hypot(dLat, dLng) || 1e-9;
                rLat = nearest.lat + (dLat / d) * minReqDeg;
                rLng = nearest.lng + (dLng / d) * minReqDeg;
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
