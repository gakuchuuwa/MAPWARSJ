import L from 'leaflet';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../data/CityWonders';
import { isWonderFounded, getWonderGateYear } from '../data/wonderFoundedYears';
import { WONDER_NAME } from '../data/WonderNames';
import { WONDER_COORD } from '../data/WonderCoords';
import { CITIES_V2 } from '../data/cities_v2';
import { deHashString } from '../systems/cityWallShared';
import { isScriptPeriod } from '../events/scriptPeriod';
import { DE_SPRITE_BOX_W } from '../systems/battlefield/deSpriteSizes';
import { STRATEGIC_WONDER_SCALE } from './strategicSpriteScale';

/** 奇观 monument 数据（原 MonumentData 类型内联，野外奇观已全部转城内奇观挂靠据点） */
interface MonumentData {
    id: string;
    name: string;
    category: 'HOLY_SITE' | 'ANCIENT_WONDER' | 'HERITAGE_FORT' | 'SACRED_PAGODA';
    lat: number;
    lng: number;
    asset: string;
    /** SUCAI_BUILDING 素材目录名（建成年代闸门按它查 `WONDER_FOUNDED_YEAR`） */
    assetKey: string;
    scale?: number;
    description: string;
    /** 挂靠的据点：特殊建筑都和据点绑定，据点显示它才显示 */
    cityId: string;
}

/** [2026-08-29] 个别奇观素材底部带大段地面阴影（实心底边远高于精灵底边），常规「底边锚定」会把建筑抬高悬空。
 *  按该奇观实心底边改用 top 锚定到底座前角（参考其它奇观「实心底边≈精灵底边」的成熟做法）。
 *  键 = SUCAI_BUILDING 素材目录名；值 = top 像素（基准宽 90 下）。 */
const WONDER_GROUND_TOP: Record<string, number> = {
    'ORIE_WONDER_PERSIANS': 10,     // 泰西封巨拱：实心底边仅 65.5%（下方 34.5% 为地面阴影）→ 下移让其踏到底座前角
};
/** 重叠判定最小间距（度）：zoom 9 下 ≈ 90px（奇观 marker 宽），中心距小于此值判为重叠并外推 */
/** 
 * 🔴 [2026-11-02 主人令「凯旋门和竞技场重叠了，所有特殊建筑都不要重叠」]
 * 重叠判定最小间距（度）：确保立绘（w≈100~160px）、地基羽化底座（groundW≈160~250px）及下方铭牌标签
 * 在任何缩放与纬度下互不遮挡、无交叉重叠；北纬 40° 下 0.45 度对应经度约 122px、纬度约 220px。
 */
const OVERLAP_MIN_DEG = 0.45;

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
    private initialized = false;

    constructor(map: L.Map) {
        this.map = map;

        // [2026-09-15 主人定「特殊建筑应该在军团的下层」]：
        // 调整层级：据点(cityPane 610) < 特殊建筑(monumentPane 615) < 军团(unitsPane 620)
        if (!this.map.getPane('monumentPane')) {
            this.map.createPane('monumentPane');
            const pane = this.map.getPane('monumentPane');
            if (pane) {
                pane.style.zIndex = '615';
            }
        }

        this.layerGroup = L.layerGroup().addTo(this.map);
        // [2026-09-25] 首次绘制若外部未调 setCityFilter 则在微任务中兜底执行一次，避免无 filter 场景漏画
        queueMicrotask(() => {
            if (!this.initialized) {
                this.initialized = true;
                this.renderMonuments();
            }
        });

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

    /**
     * 🔴 [2026-09-23 主人定「特殊建筑都是和据点绑定的」「应该是随着据点的显现而恢复」]
     * 外部据点显示判据：挂靠据点不显示 → 它的特殊建筑也不显示。null = 全部显示。
     */
    private cityFilter: ((cityId: string) => boolean) | null = null;

    public setCityFilter(filter: ((cityId: string) => boolean) | null): void {
        this.cityFilter = filter;
        this.initialized = true;
        this.renderMonuments();
    }

    /**
     * 🔴 [2026-10-20 主人令「给所有的特殊建筑也设计一个建城年，和据点一样。不到时间不显示。」]
     * 上次重画时用的建成年代闸门年份 —— 年份（或模式）变了才重画，没变就不动：
     * 百岁模式每跨一年、剧本每打完一场（事件年份前进）、切模式、开关编辑器时调用。
     */
    private foundedYearSnapshot: number | null | undefined = undefined;

    /** 按最新的建成年代闸门年份重画特殊建筑（判据见 `wonderFoundedYears.ts` 的 `isWonderFounded`） */
    public syncFoundedYear(): void {
        const year = getWonderGateYear();
        if (year === this.foundedYearSnapshot) return;
        this.foundedYearSnapshot = year;
        this.renderMonuments();
    }

    /** 据点显示范围变了（剧本进度 / 模式切换）→ 重画 */
    public refresh(): void {
        this.renderMonuments();
    }

    private renderMonuments(): void {
        // [2026-08-27 主人定「把所有奇观按坐标独立摆放到战略地图，不动据点」]：名城奇观也按城市坐标独立摆放
        const cityById = new Map(CITIES_V2.map((c) => [c.id, c]));
        const wonderMonuments: MonumentData[] = Object.entries(CITY_WONDER)
            .map(([cityId, asset]): MonumentData | null => {
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
                    cityId,
                };
            })
            .filter((x): x is MonumentData => x !== null);

        // [2026-08-28 主人定「所有奇观统称城内奇观」] 附加城内奇观（CITY_WONDER_EXTRA）：
        //   原野外奇观就近挂靠据点，同样参与去重叠。真实坐标保留在 lat/lng（弹窗用）。
        const extraMonuments: MonumentData[] = Object.entries(CITY_WONDER_EXTRA)
            .flatMap(([cityId, extras]) => {
                const city = cityById.get(cityId);
                if (!city) return [];
                return extras.map((ex) => ({
                    id: `extra_${cityId}_${ex.asset}`,
                    assetKey: ex.asset,
                    name: ex.name,
                    category: ex.category ?? 'ANCIENT_WONDER',
                    lat: ex.lat ?? city.lat,
                    lng: ex.lng ?? city.lng,
                    asset: `/SUCAI_BUILDING/${ex.asset}/preview.png`,
                    description: ex.description,
                    cityId,
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
        // 🔴 [2026-10-20 主人令「给所有的特殊建筑也设计一个建城年，和据点一样。不到时间不显示。」]
        //    建成年代还没到 → 不画。闸门放在**落位之后**：未建成的也照旧占位，
        //    将来建成登场时，旁边已显示的奇观不会因为去重叠重排而跳位。
        const founded = placed.filter((m) => isWonderFounded(m.assetKey));
        // 「查看奇观」只翻当前显示的
        this.browseMonuments = this.cityFilter ? founded.filter((m) => this.cityFilter!(m.cityId)) : founded;

        const visibleMonuments = new Map<string, PlacedMonument>();
        for (const mon of founded) {
            // 挂靠据点没显示 → 不画（落位仍按全部奇观算，位置不随显隐跳动）
            if (this.cityFilter && !this.cityFilter(mon.cityId)) continue;
            visibleMonuments.set(mon.id, mon);
        }

        // 1. 移除不再显示的奇观
        for (const [id, marker] of this.markers) {
            if (!visibleMonuments.has(id)) {
                this.layerGroup.removeLayer(marker);
                this.markers.delete(id);
            }
        }

        // 2. 添加新出现的奇观（已存在的保持不动，避免重复渐显或闪烁）
        for (const [id, mon] of visibleMonuments) {
            if (this.markers.has(id)) continue;
            const fadeIn = isScriptPeriod();
            const marker = this.createMonumentMarker(mon, fadeIn);
            this.markers.set(id, marker);
        }
    }

    private createMonumentMarker(mon: PlacedMonument, fadeIn = false): L.Marker {
        // [2026-08-28 主人要求「奇观和所有建筑一样随机镜像」]：会话级随机左右镜像，与 CityBuildingMirror.rollSessionCityMirror 一致
        // 🔴 [2026-10-03 主人令「所有特殊建筑也要随机镜像」] 与据点／战场**同一套掷签**：
        //    改前是 `Math.random() < 0.5`（每建一次 marker 掷一次）—— 奇观被撤下再放回（剧本期显隐、
        //    据点显隐切换）就会换个方向；改后按 `deHashString(id + '|mirror')` 落定
        //    （带每局会话种子，见 GameApp 的 `setCityStyleSessionSeed`）→ **每局随机、局内稳定、按 id 可复现**。
        const mirror = (deHashString(mon.id + '|mirror') & 1) === 1;
        const w = (DE_SPRITE_BOX_W[mon.assetKey] ?? 480) * STRATEGIC_WONDER_SCALE;
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
        const anchorStyle = groundTop != null ? `top: ${Math.round(groundTop * (w / 90))}px;` : `bottom: ${bottomOffset}px;`;
        const animClass = fadeIn ? ' map-fade-in' : '';

        const html = `
            <div class="wilderness-monument-container${animClass}" style="
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
                <!-- 金色名胜标牌（🔴 2026-09-14 修复据点名与特殊建筑名重叠：下移至 -32px，形成清晰双行排版） -->
                <div style="
                    position: absolute;
                    bottom: -32px;
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

        return marker;
    }

    /**
     * 去重叠：所有 monument（挂城市奇观 + 野外名胜）按 all 数组顺序落位，
     * 若与任一已放置锚点中心距 < OVERLAP_MIN_DEG，则沿「远离最近锚点」的方向外推到 OVERLAP_MIN_DEG。
     * all 已按「正确挂靠 → 错位修正 → 野外」排序，故正确城市地标留原位，重复/错位的往外散。
     * 真实坐标保留在 mon.lat/lng（弹窗用），仅 renderLat/renderLng 参与摆放。
     */
    /**
     * 🔴 [2026-11-02 主人令「凯旋门和竞技场重叠了，所有特殊建筑都不要重叠」]
     * 去重叠：
     * 1. 废除任何建筑特例，全图特殊建筑一视同仁应用 OVERLAP_MIN_DEG 严格去重叠；
     * 2. 同坐标/极近距离（<0.08度）的附加奇观，默认沿东南方向（2.5D 开阔视角，避开正南方城市铭牌）平移至安全距离；
     * 3. 运行多轮物理松弛迭代，确保全图任意两座特殊建筑之间间距绝对 >= OVERLAP_MIN_DEG，立绘与文字铭牌彻底不重叠。
     */
    private deoverlap(all: MonumentData[]): PlacedMonument[] {
        const placed: PlacedMonument[] = all.map((m) => ({ ...m, renderLat: m.lat, renderLng: m.lng }));

        // 第一阶段：单遍贪心落位（城市核心奇观优先保留原位，附加奇观遇重叠向外散）
        const fixedAnchors: { lat: number; lng: number }[] = [];
        for (const cur of placed) {
            for (const anc of fixedAnchors) {
                const d = Math.hypot(cur.renderLat - anc.lat, cur.renderLng - anc.lng);
                if (d < OVERLAP_MIN_DEG) {
                    let dLat = cur.renderLat - anc.lat;
                    let dLng = cur.renderLng - anc.lng;
                    // 若与锚点几乎在同一点（如凯旋门与斗兽场同在罗马城中），沿东南方（dLat < 0, dLng > 0）散开
                    if (Math.hypot(dLat, dLng) < 0.08) {
                        dLat = -0.32;
                        dLng = 0.35;
                    }
                    const dist = Math.hypot(dLat, dLng) || 1e-9;
                    cur.renderLat = anc.lat + (dLat / dist) * OVERLAP_MIN_DEG;
                    cur.renderLng = anc.lng + (dLng / dist) * OVERLAP_MIN_DEG;
                }
            }
            fixedAnchors.push({ lat: cur.renderLat, lng: cur.renderLng });
        }

        // 第二阶段：全局多轮松弛迭代（彻底消除级联次生冲突，确保无死角不重叠）
        for (let iter = 0; iter < 10; iter++) {
            let moved = false;
            for (let i = 0; i < placed.length; i++) {
                for (let j = i + 1; j < placed.length; j++) {
                    const p1 = placed[i];
                    const p2 = placed[j];
                    const d = Math.hypot(p1.renderLat - p2.renderLat, p1.renderLng - p2.renderLng);
                    if (d < OVERLAP_MIN_DEG) {
                        let dLat = p2.renderLat - p1.renderLat;
                        let dLng = p2.renderLng - p1.renderLng;
                        if (Math.hypot(dLat, dLng) < 1e-6) {
                            dLat = -0.32;
                            dLng = 0.35;
                        }
                        const dist = Math.hypot(dLat, dLng) || 1e-9;
                        const push = (OVERLAP_MIN_DEG - dist) * 0.55;
                        // p1 为优先建筑，p2 承担大部分外推
                        p2.renderLat += (dLat / dist) * push * 1.5;
                        p2.renderLng += (dLng / dist) * push * 1.5;
                        p1.renderLat -= (dLat / dist) * push * 0.5;
                        p1.renderLng -= (dLng / dist) * push * 0.5;
                        moved = true;
                    }
                }
            }
            if (!moved) break;
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
