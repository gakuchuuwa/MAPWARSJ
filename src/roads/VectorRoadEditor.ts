/*****************************************************************************
 * VectorRoadEditor - 城市对寻路编辑器
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ██ 第一原则 (FIRST PRINCIPLE) — 绝对不可违反，不可删除 ██           ║
 * ║                                                                      ║
 * ║  所有道路必须建立在 Natural Earth 路网的基础上。                       ║
 * ║  ALL ROADS MUST BE BUILT UPON THE NATURAL EARTH ROAD NETWORK.        ║
 * ║                                                                      ║
 * ║  无论是新建道路、修改端点、截断道路、合并道路，任何产生道路坐标的      ║
 * ║  操作都必须通过路网图 (GeoJSON Graph) 上的 Dijkstra 寻路来生成。      ║
 * ║  绝不允许直接使用直线坐标、手动坐标、或脱离路网的截断坐标。            ║
 * ║                                                                      ║
 * ║  没有这一条，道路编辑器没有任何意义。                                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * 工作流程：
 * 1. 加载 Natural Earth 路网 → 构建图 (Graph)
 * 2. 用户点击城市A (起点) → 点击城市B (终点)
 * 3. 系统在路网图上自动寻路 (Dijkstra)
 * 4. 生成可微调的矢量路径
 * 5. 拖拽控制点微调 → 保存
 *****************************************************************************/
import L from 'leaflet';
import { CityManager } from '../world/CityManager';
import { roadRegistry } from './RoadRegistry';
import { VECTOR_ROAD_DATA, VectorRoadFeature } from '../data/VectorRoadData';
import { SEA_ROUTE_DATA } from '../data/VectorSeaRouteData';
import { CITIES_V2 as CITIES } from '../data/cities_v2';
import { BATTLEFIELDS, battlefieldMergedCityId } from '../data/Battlefields';

/**
 * 🔴 [2026-09-24 主人定「要给战场连路…让战场和据点一致」]
 * 道路端点 = 据点 或 战场（`bf_*`）。编辑器里凡是「按 id 找端点」的地方一律走这里，
 * 选端点、生成路线、切换候选、全面审查、定位，战场与据点同一套待遇。
 */
type RoadEndpoint = { id: string; name: string; lat: number; lng: number; kind: 'city' | 'battlefield' };
function findEndpoint(id: string | null | undefined): RoadEndpoint | undefined {
    if (!id) return undefined;
    const c = CITIES.find((x) => x.id === id);
    if (c) return { id: c.id, name: c.name, lat: c.lat, lng: c.lng, kind: 'city' };
    const b = BATTLEFIELDS.find((x) => x.id === id);
    if (b) return { id: b.id, name: b.name, lat: b.lat, lng: b.lng, kind: 'battlefield' };
    return undefined;
}
/** 端点显示名：战场带 ⚔ 前缀，一眼分得清 */
function endpointLabel(ep: RoadEndpoint | undefined, fallback?: string | null): string {
    if (!ep) return fallback ?? '?';
    return ep.kind === 'battlefield' ? `⚔${ep.name}` : ep.name;
}
const ALL_ENDPOINT_IDS = (): Set<string> => new Set<string>([...CITIES.map((c) => c.id), ...BATTLEFIELDS.map((b) => b.id)]);

import {removeBacktracks} from '../utils/GeometryUtils';
import {REGION_CENTERS, getCityRegion, RegionType} from '../systems/RegionSystem';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { SeaRouteEditor, LAND_MASK_PATH, loadLandMask, isLand } from '../sea/SeaRouteEditor';

// ===== IEditor 接口 =====
interface IEditor {
    name: string;
    icon: string;
    show(): void;
    hide(): void;
    isVisible(): boolean;
}

// ===== GeoJSON 路网图 =====
interface GeoNode {
    id: number;
    lat: number;
    lng: number;
}

interface GeoEdge {
    from: number;
    to: number;
    weight: number; // km
    coords: [number, number][]; // [lng, lat][]
    /** 内河（NE 河流中心线） */
    isWater?: boolean;
    /** 海路（sea_routes_combined 航线网 / 港口接驳边）—— 默认不参与寻路，只有 sea_land 模式放行 */
    isSea?: boolean;
}

/** 编辑器候选路线模式 */
type RouteMode = 'prefer_water' | 'prefer_land' | 'sea_land' | 'straight';

interface RouteCandidate {
    mode: RouteMode;
    label: string;
    coordinates: [number, number][];
    totalDistance: number;
    edgeKeys?: Set<string>;
    isManualStraightLine?: boolean;
    /** 编辑器内存评分，不写盘 */
    score?: number;
    waterRatio?: number;
    detourRatio?: number;
    variantReason?: string;
}

const ROUTE_MODE_LABELS: Record<RouteMode, string> = {
    prefer_water: '🌊 水路为主',   // 内河/湖：NE 河流中心线，断口已就近接通
    prefer_land: '🛣️ 陆路为主',
    sea_land: '⚓ 海路为主',       // 沿岸+远洋航线，只在港口城上下船
    straight: '直线',
};

export class VectorRoadEditor implements IEditor {
    public name = '矢量道路编辑器';
    public icon = '🛤️';

    // ===== 静态常量（供 batchAutoConnect 使用）=====
    private static readonly BATCH_AUTO_CONNECT_LIMIT = 50;
    /** 批量补路绕行比例上限 2.5（兼顾山谷/河谷蜿蜒白线，防极端大绕圈） */
    private static readonly MAX_DETOUR_RATIO = 2.5;
    private static readonly NO_NE_PATH_MAX_STRAIGHT_KM = 150;
    /** [2026-05-30] 每个城连最近 K 个邻居 (两两相连 K-NN 自动连用) */
    private static readonly NEAREST_K_PER_CITY = 2;
    /**
     * [2026-05-30 v4 用户拍板] 权重保留, 改大点到 0.9 (温和偏好, 不蛮横)
     *
     * 用户原话: "把权重保留, 改大点吧 0.9"
     *
     * 解读:
     *   - 区中心: 0.9 (10% 优惠, 比距离差 10% 以内才能赢)
     *   - 大城/中城: 0.95 (5% 优惠, 微调)
     *   - 关/渡/小城: 1.0 (基准)
     *
     * 验证:
     *   江陵 → 汉城 171 × 1.0 = 171
     *   江陵 → 开城 208 × 0.9 = 187.2 → 汉城 赢 ✓ (差距 22%, 中心权重救不回)
     *
     *   骏府 → 清洲 142 × 1.0 = 142
     *   骏府 → 京都 238 × 0.9 = 214.2 → 清洲 赢 ✓ (差距 68%, 中心权重救不回)
     *
     *   100km 大城 vs 105km 小城:
     *     大城 100 × 0.95 = 95
     *     小城 105 × 1.0  = 105 → 大城 赢 (差距 5% 内, 大城略胜)
     *
     *   100km 大城 vs 120km 小城:
     *     大城 100 × 0.95 = 95
     *     小城 120 × 1.0  = 120 → 大城 赢 (差距 20%, 大城仍胜)
     *
     *   100km 大城 vs 150km 小城:
     *     大城 100 × 0.95 = 95
     *     小城 150 × 1.0  = 150 → 大城 赢
     *
     *   100km 中心 vs 120km 小城:
     *     中心 100 × 0.9  = 90
     *     小城 120 × 1.0  = 120 → 中心 赢
     */
    private static readonly TYPE_WEIGHT: Record<string, number> = {
        big_city:    0.95,
        medium_city: 0.95,
        pass:        1.0,
        small_city:  1.0,
        stockade:    1.0,
    };
    private static readonly REGION_CENTER_WEIGHT = 0.9;
    private static readonly MAX_CONNECTION_DIST_KM = 500;
    /**
     * 智能候选池上限：涵盖中线最短白线、左/右翼平行白线走廊、中段避让备选、水路为主、海路为主、直线保底。
     */
    private static readonly MAX_ROUTE_CANDIDATES = 7;
    private static readonly WATER_VARIANTS_PER_MODE = 1;
    /** 陆路三条：第 1 条陆路优先，第 2–3 条纯陆路 + 只罚中段（放开进出城共用三岔口） */
    private static readonly LAND_VARIANTS_PER_MODE = 3;
    private static readonly WATER_TRUNK_MIN_RATIO = 0.35;
    private static readonly VARIANT_PENALTY_FACTOR = 5.5;
    private static readonly SEA_VARIANTS_PER_MODE = 1;
    /** 海路里程相对陆路的选路惩罚（默认档：海路要短出 ~20% 才值得上船） */
    private static readonly SEA_LEG_FACTOR = 1.2;
    /** 「海路为主」候选专用：海路打八折，尽量走水 —— 这条候选就是给用户挑「走海」用的 */
    private static readonly SEA_PRIMARY_FACTOR = 0.8;
    /** 远洋主干额外惩罚，与 SeaRouteEditor 的 OPEN_SEA_PENALTY 同值（古代贴岸航海优先） */
    private static readonly OPEN_SEA_PENALTY = 1.5;
    /** 港口接驳：城市到最近**陆路**节点的上限（实测 998 城里 983 座 ≤45km） */
    private static readonly PORT_LAND_LINK_MAX_KM = 45;
    /** 港口接驳：城市到最近**航线**节点的上限。沿岸航路本身离岸 36km，卡 45km 只认得出 145 座港；
     *  放到 80km 是 209 座（实测：≤45km 153 / ≤80km 220 / ≤120km 266）。再放宽内陆城也会被当成港。 */
    private static readonly PORT_SEA_LINK_MAX_KM = 80;

    private map: L.Map;
    private cityManager: CityManager;
    private visible: boolean = false;

    // === GeoJSON 路网图 ===
    private geoNodes: GeoNode[] = [];

    private geoAdj: Map<number, GeoEdge[]> = new Map();
    /** 航线网节点 id 集合：城市锚点只许落在陆路节点上，绝不能锚到海里 */
    private seaNodeIds: Set<number> = new Set();
    /**
     * 🔴 [2026-09-28 主人「把陆路和海路分开计算」] 海路航线线段的空间索引（0.5° 格子）。
     *    陆路补桥（端点互连 / 端点接路）一律先问 `crossesSeaLane`：补出来的那一小段横穿航线 = 跨海峡/海湾，不补。
     *    ⚠️ 它只认「横穿航线」，不是完整的水陆掩膜：没有航线经过的水面（小海湾、湖）挡不住。
     */
    private seaLaneSegs: [number, number, number, number][] = [];
    private seaLaneGrid: Map<string, number[]> = new Map();
    private static readonly SEA_LANE_CELL = 0.5;
    /** 已接驳的港口城数（状态栏/日志用） */
    private portLinkCount = 0;
    /** 海陆掩膜已就绪（没就绪时 waterKmAlong 一律返回 0，等于不判） */
    private landMaskReady = false;
    /** 陆路直线段允许压到的水面（公里）：掩膜 0.03° 一格，海岸线锯齿和小河口别误杀 */
    private static readonly LAND_LINK_WATER_TOLERANCE_KM = 0.5;
    /** 每个陆路/内河图节点所属连通分量的节点数（防城市接入点全困在城边孤立短碎线上） */
    private nodeCompSize: Int32Array = new Int32Array(0);
    private geoGraphBuilt: boolean = false;
    private _dijkstraDebugLogged: boolean = false;

    // === 参考层渲染 ===
    private referenceLayer: L.GeoJSON | null = null;
    private cachedGeoJSON: any = null;  // [FIX] 缓存原始 GeoJSON, 用于二次开启时重建参考层

    // === [Phase B] 辐射网层 (radial_network.geojson) ===
    // 由 scripts/audit_radial_network.mjs 生成的 BFS 辐射连接 (333km 内, 锚点 洛阳/长安)
    private radialNetworkLayer: L.LayerGroup | null = null;
    private radialNetworkData: any = null;

    // === 城市选择状态 ===
    private startCityId: string | null = null;
    private endCityId: string | null = null;
    private startMarker: L.CircleMarker | null = null;
    private endMarker: L.CircleMarker | null = null;
    /**
     * 🔴 [2026-09-28 主人令「请优化」] 途经点：选好起点后，按住 Shift 点地图任意处加一个（途经地不一定有据点）。
     *    有途经点时，寻路按「起点→途经1→…→终点」逐段各跑一次再拼接；某一段底图寻不通就只那一段用直线。
     */
    private viaPoints: Array<{ lat: number; lng: number; marker: L.CircleMarker }> = [];
    private viaClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

    // === 编辑层 ===
    private editPolylines: Map<string, L.Polyline> = new Map();
    private editMarkers: Map<string, L.CircleMarker[]> = new Map();
    private midMarkers: Map<string, L.CircleMarker[]> = new Map();
    private selectedRoadId: string | null = null;

    // === 候选路径缓存与切换支持 ===
    private pathCandidates: RouteCandidate[] = [];
    private currentCandidateIdx: number = 0;
    private switchRouteBtn: HTMLButtonElement | null = null;

    // === UI ===
    private panel: HTMLElement | null = null;
    private statusLabel: HTMLElement | null = null;
    private roadSelect: HTMLSelectElement | null = null;
    private roadFilter: HTMLInputElement | null = null;
    /**
     * 🔴 [2026-09-25 主人令「给道路编辑器中的现有道路添加一个新旧道路排序，不然我看不到你新画的道路」]
     *    现有道路下拉原先按「坐标点数降序」（最长的路在最前），新画的路点少、被埋在后面翻不到。
     *    排序键取道路 id 末尾的时间戳（画路时以毫秒写进 id，如 `..._1790340000000`）；
     *    没有时间戳的老路按**文件里的先后**兜底（新画的都追加在数组末尾）。
     */
    private roadSort: HTMLSelectElement | null = null;
    private roadSortMode: 'len' | 'new' | 'old' | 'name' = 'len';

    // === 城市点击处理 ===
    private cityClickHandler: ((city: any, e?: any) => void) | null = null;

    /**
     * 🔴 [2026-08-25 主人定「把海图编辑器合并到道路编辑器中」]
     *    海路编辑器不再是独立入口，改由这里托管：面板顶部一个「🛣️ 陆路 / 🚢 海路」切换，
     *    面板嵌进本面板，同一时刻只有一边接管城市点击（两边都调 enableCitySelection，
     *    同时开会互相抢点击）。海路的实现仍留在 src/sea/SeaRouteEditor.ts，不往这个
     *    五千行的文件里再塞 685 行。
     */
    private seaEditor: SeaRouteEditor;
    private mode: 'land' | 'sea' = 'land';
    private seaHost: HTMLElement | null = null;
    private modeBtns: { land: HTMLButtonElement; sea: HTMLButtonElement } | null = null;

    constructor(map: L.Map, cityManager: CityManager) {
        this.map = map;
        this.cityManager = cityManager;
        this.seaEditor = new SeaRouteEditor(map, cityManager);
        this.seaEditor.setHost(() => this.seaHost);
    }

    /** 外部（面板/事件）切换陆路/海路模式。两者互斥：城市点击只能归一边。 */
    public setMode(mode: 'land' | 'sea'): void {
        if (this.mode === mode) return;
        this.mode = mode;
        const landRows = [this.panelRows?.row1, this.panelRows?.row2, this.reportArea];
        if (mode === 'sea') {
            // 陆路让出城市点击，否则两边的 cityClickHandler 互相覆盖
            this.clearCitySelection();
            this.disableCitySelection();
            for (const r of landRows) if (r) (r as HTMLElement).style.display = 'none';
            if (this.seaHost) this.seaHost.style.display = '';
            this.seaEditor.show();
        } else {
            this.seaEditor.hide();
            if (this.seaHost) this.seaHost.style.display = 'none';
            for (const r of landRows) if (r) (r as HTMLElement).style.display = '';
            this.enableCitySelection();
        }
        this.setStatus(mode === 'sea' ? '🚢 海路模式' : '🛣️ 陆路模式');
        this.syncModeButtons();
    }

    public getMode(): 'land' | 'sea' { return this.mode; }

    private syncModeButtons(): void {
        if (!this.modeBtns) return;
        const on = '#4caf50', off = '#455a64';
        this.modeBtns.land.style.background = this.mode === 'land' ? on : off;
        this.modeBtns.sea.style.background = this.mode === 'sea' ? '#0288d1' : off;
    }

    // ===== IEditor 接口 =====

    public show(): void {
        this.visible = true;
        this.createPanel();
        this.setMonumentClickThrough(true);   // 奇观图片挡住据点 → 编辑期间让点击穿透
        this.initLayerPanes();  // [Phase B v2] 4 层独立 pane (z-index 380/390/400/410)
        this.renderAllRoads();
        this.renderBattlefieldMarkers();
        if (!this.bfHooked) {
            this.bfHooked = true;
            // 增删路后刷新战场标记的「已连 / 未连」状态
            roadRegistry.onRoadsUpdated(() => { if (this.visible) this.renderBattlefieldMarkers(); });
        }
        // 道路线宽随地图缩放（Leaflet weight 固定像素，需手动按 zoom 等比缩放）
        this.map.on('zoomend', this.onZoomEnd);
        // 路网一改（增删路、拖点落位）就丢弃吸附包围盒缓存 —— 光看 features.length 挡不住
        // 「条数没变但某条路的形状变了」，那会让吸附漏掉已经移开的路。
        if (!this.snapCacheHooked) {
            this.snapCacheHooked = true;
            roadRegistry.onRoadsUpdated(() => this.invalidateSnapBboxCache());
        }
        this.applyZoomWeight();
        // === 关键: 等图构建完再允许城市选择 ===
        this.loadGeoJSONGraph().then(() => {
            this.enableCitySelection();
            console.log(`✅ [VectorRoadEditor] Ready! ${this.geoNodes.length} graph nodes`);
        });
        // [2026-05-30 用户公理] 不自动加载 Layer 4 黄色辐射网 (挡 NE 看不清)
        // 旧: this.autoShowRadialNetwork();
        // 现在: 完全不加载, 永久干掉
    }

    /**
     * 奇观 marker 在 monumentPane(z650) 上、图片有 90px 宽，压在据点(cityPane z610)上方，
     * 选起点/终点时点到的往往是奇观而不是据点。编辑器开着时直接让整层点击穿透。
     */
    private setMonumentClickThrough(on: boolean): void {
        // ⚠ 只给 pane 设 pointer-events:none 没用 —— leaflet.css 里
        //   `.leaflet-marker-icon.leaflet-interactive { pointer-events: auto }`
        //   是子元素规则，会把父层的 none 顶掉。必须直接压 marker 自身。
        const ID = 'road-editor-monument-clickthrough';
        const pane = this.map.getPane('monumentPane');
        if (pane) pane.style.pointerEvents = on ? 'none' : '';
        const existing = document.getElementById(ID);
        if (!on) { existing?.remove(); return; }
        if (existing) return;
        const style = document.createElement('style');
        style.id = ID;
        style.textContent = `
            .leaflet-marker-icon.monument-icon,
            .leaflet-marker-icon.monument-icon * { pointer-events: none !important; }
        `;
        document.head.appendChild(style);
    }

    /**
     * 控制点专用 pane：z 高于据点(610)与奇观(650)，保证节点永远点得中。
     * 中点(黄)用扩大的透明命中圈，必须比红点低一层，否则会盖住红点的拖拽/右键删。
     */
    private ensureEditPointPanes(): { mid: string; vertex: string } {
        const MID = 'road-edit-mid-pane', VERTEX = 'road-edit-vertex-pane';
        for (const [name, z] of [[MID, '688'], [VERTEX, '690']] as const) {
            if (!this.map.getPane(name)) this.map.createPane(name);
            const pane = this.map.getPane(name);
            if (pane) pane.style.zIndex = z;
        }
        return { mid: MID, vertex: VERTEX };
    }

    /**
     * [Phase B v2] 为 4 层路网创建独立 Leaflet pane, 用 z-index 控制层级,
     * 用 display:none 控制可见性 (开关切换)
     */
    private initLayerPanes(): void {
        const PANES = [
            { name: 'ne-original-pane',   z: 380 },  // Layer 3 NE 原始 17559 (底, 白)
            { name: 'bfs-radial-pane',    z: 400 },  // Layer 4 BFS 辐射网   (上, 黄)
            { name: 'manual-roads-pane',  z: 410 },  // Layer 1 手画 363     (顶, 橙)
        ];
        for (const { name, z } of PANES) {
            if (!this.map.getPane(name)) {
                this.map.createPane(name);
            }
            const pane = this.map.getPane(name);
            if (pane) pane.style.zIndex = String(z);
        }
    }

    /** 切换某层的显隐 (通过 CSS display, 不增删 layer) */
    private toggleLayerPane(paneName: string, visible: boolean): void {
        const pane = this.map.getPane(paneName);
        if (pane) pane.style.display = visible ? '' : 'none';
    }

    // === 道路线宽随地图缩放 ===
    /** 基准 zoom：线宽在此 zoom 取原始值；地图缩放时线宽等比缩放，跟着地图一起变大变小。 */
    private static readonly WEIGHT_REF_ZOOM = 8;

    private onZoomEnd = (): void => { this.applyZoomWeight(); };

    /** 地图缩放后重算道路线宽：Leaflet 的 weight 是固定屏幕像素、不随 zoom 变，手动按 2^(z−ref) 等比缩放。 */
    private applyZoomWeight(): void {
        const k = Math.pow(2, this.map.getZoom() - VectorRoadEditor.WEIGHT_REF_ZOOM);
        if (this.referenceLayer) this.referenceLayer.setStyle({ weight: 2.0 * k });
        if (this.radialNetworkLayer) {
            this.radialNetworkLayer.eachLayer((l) => {
                const p = l as L.Polyline;
                if (p.setStyle) p.setStyle({ weight: 2.5 * k });
            });
        }
        for (const p of this.editPolylines.values()) p.setStyle({ weight: 4 * k });
    }

    private async autoShowRadialNetwork(): Promise<void> {
        if (this.radialNetworkLayer) return;
        try {
            const basePath = (import.meta as any).env?.BASE_URL || '/';
            const res = await fetch(`${basePath}data/radial_network.geojson`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.radialNetworkData = await res.json();
        } catch (err) {
            console.warn('[VectorRoadEditor] 辐射网加载失败 (先跑 node scripts/audit_radial_network.mjs):', err);
            return;
        }
        this.renderRadialNetwork();
    }

    private renderRadialNetwork(): void {
        if (!this.radialNetworkData) return;
        const group = L.layerGroup();
        let n = 0;
        for (const f of this.radialNetworkData.features) {
            if (!f.geometry || f.geometry.type !== 'LineString') continue;
            const coords = f.geometry.coordinates;
            if (!coords || coords.length < 2) continue;
            const latLngs: L.LatLngExpression[] = coords.map((c: number[]) => [c[1], c[0]]);
            // Layer 4 = 鲜黄实线 (z-index 400 通过 pane)
            const polyline = L.polyline(latLngs, {
                pane: 'bfs-radial-pane',
                color: '#fdd835',
                weight: 2.5,
                opacity: 0.9,
                interactive: false,
            });
            group.addLayer(polyline);
            n++;
        }
        group.addTo(this.map);
        this.radialNetworkLayer = group;
        // z-order 由 pane 自动管理

        const meta = this.radialNetworkData.meta || {};
        const orphans = (meta.orphans || []).length;
        console.log(`[VectorRoadEditor] Layer 4 渲染: BFS 辐射 ${n} 条`);
    }

    public hide(): void {
        this.visible = false;
        if (this.bfLayer) { this.map.removeLayer(this.bfLayer); this.bfLayer = null; }
        if (this.flashMarker) { this.map.removeLayer(this.flashMarker); this.flashMarker = null; }
        this.map.off('zoomend', this.onZoomEnd);
        this.clearEditLayers();
        this.removeReferenceLayer();
        // [Phase B] 清理 Layer 4 (BFS 辐射)
        if (this.radialNetworkLayer) {
            this.map.removeLayer(this.radialNetworkLayer);
            this.radialNetworkLayer = null;
        }
        // 合并后的海路：关道路编辑器时一并收掉，并把模式复位到陆路
        this.seaEditor.hide();
        this.mode = 'land';
        this.seaHost = null;
        this.modeBtns = null;
        this.clearCitySelection();
        this.disableCitySelection();
        this.setMonumentClickThrough(false);  // 退出编辑器 → 奇观恢复可点
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }

    // ===== UI 面板 =====

    private createPanel(): void {
        if (this.panel) return;

        this.panel = document.createElement('div');
        this.panel.id = 'vector-road-editor-panel';
        // [LAYOUT 2026] 改成 2 行布局：
        //   Row 1: 单条道路编辑（旧）— 状态/搜索/下拉/路网开关/改起/改终/切换/保存/删除
        //   Row 2: 批量工作流（新）— 审计/清理/修端点/简化/查重/自动连
        // [2026-05-30 用户公理] 锁宽度 + 整体放大 (按钮位置 100% 固定)
        this.panel.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 30, 40, 0.97);
            color: #e0e0e0;
            padding: 20px 32px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            align-items: stretch;
            z-index: 10000;
            font-family: 'Microsoft YaHei', sans-serif;
            font-size: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.7);
            border: 2px solid rgba(255,215,0,0.5);
            width: 1700px;
            max-width: 98vw;
            box-sizing: border-box;
        `;

        // 状态提示 (cssText 在 Row 0 创建时统一设置)
        this.statusLabel = document.createElement('span');
        this.statusLabel.textContent = '🏙️ 请点击第一个城市（起点）';

        // 道路搜索过滤
        this.roadFilter = document.createElement('input');
        this.roadFilter.type = 'text';
        this.roadFilter.placeholder = '🔍 搜索道路...';
        this.roadFilter.style.cssText = `
            background: #2a2a3a; color: #e0e0e0; border: 1px solid #555;
            border-radius: 8px; padding: 10px 14px; font-size: 15px;
            width: 180px; flex-shrink: 0;
            outline: none;
        `;
        this.roadFilter.addEventListener('input', () => {
            this.updateRoadSelect();
        });

        // 🔴 [2026-09-25 主人令「给道路编辑器中的现有道路添加一个新旧道路排序，不然我看不到你新画的道路」]
        //    现有道路下拉原先按「坐标点数降序」，新画的路点少排在最后、翻不到；这里加一个排序开关。
        //    排序键：道路 id 末尾的毫秒时间戳（如 ..._1790340000000）＝ 画这条路的时刻；
        //    没有时间戳的老路按文件先后兜底（新画的都追加在文件末尾）。
        this.roadSort = document.createElement('select');
        this.roadSort.style.cssText = `
            background: #2a2a3a; color: #8fd6ff; border: 1px solid #555;
            border-radius: 8px; padding: 10px 14px; font-size: 15px;
            flex-shrink: 0; font-weight: bold;
        `;
        this.roadSort.title = '现有道路列表的排序方式（新建在前＝按画这条路的时刻倒序）';
        for (const [value, label] of [['len', '📏 长路在前'], ['new', '🆕 新建在前'], ['old', '🕰️ 最旧在前'], ['name', '🔤 按名称']] as const) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            this.roadSort.appendChild(opt);
        }
        this.roadSort.value = this.roadSortMode;
        this.roadSort.addEventListener('change', () => {
            const sel = this.roadSort!;
            this.roadSortMode = sel.value as 'len' | 'new' | 'old' | 'name';
            this.updateRoadSelect();
            const shown = this.roadSelect ? this.roadSelect.options.length - 1 : 0;
            this.setStatus(`🔀 排序：${sel.options[sel.selectedIndex]?.textContent ?? ''}（列出 ${shown} 条）`);
        });

        // 道路列表
        this.roadSelect = document.createElement('select');
        this.roadSelect.style.cssText = `
            background: #2a2a3a; color: #ffd700; border: 1px solid #555;
            border-radius: 8px; padding: 10px 14px; font-size: 15px;
            width: 280px; flex-shrink: 0;
            font-weight: bold;
        `;
        this.updateRoadSelect();
        this.roadSelect.addEventListener('change', () => {
            this.selectRoad(this.roadSelect!.value);
        });


        // ===== 按钮定义 =====

        // 保存 (写到磁盘, 自动重置准备下一条)
        const saveBtn = this.createButton('💾 保存', '#4caf50', async () => {
            await this.saveToFile();
            // 保存后自动重置, 立刻可画下一条
            this.resetForNextDraw();
        });
        saveBtn.title = '写入 VectorRoadData.ts 文件 (持久化)';

        // [2026-05-30] 暂存: 不写盘, 仅在内存保留, 重置准备下一条
        // 用法: 连续画 10 条, 每条画完点 "暂存" → 全部画完再点 "💾 保存" 一次性写盘
        const stashBtn = this.createButton('📥 暂存', '#3949ab', () => {
            // 当前路已经在 VECTOR_ROAD_DATA 内存里 (generatePath 时 addVectorRoad)
            // 暂存 = 不写盘, 直接重置准备下一条
            const total = VECTOR_ROAD_DATA.features.length;
            this.resetForNextDraw();
            this.setStatus(`📥 已暂存当前路 (内存共 ${total} 条) · 继续画下一条`);
        });
        stashBtn.title = '不写盘, 仅在内存保留; 全部画完再点 💾 保存 一次性写文件';

        // 删除当前选中的道路
        const deleteBtn = this.createButton('🗑️ 删除', '#f44336', () => this.deleteSelectedRoad());

        // 切换路径（只在有多候选时显示）
        this.switchRouteBtn = this.createButton('🔀 切换路径', '#009688', () => this.cycleCandidates());
        this.switchRouteBtn.style.visibility = 'hidden';
        this.switchRouteBtn.title = '在候选里切换（水路为主/陆路为主/纯陆路/海路为主/直线，最多5条）';

        const nodeHint = document.createElement('span');
        nodeHint.textContent = '🟡黄点=加节点 · 🔴红点右键=删节点';
        nodeHint.style.cssText = `
            color: #bbb; font-size: 13px; padding: 6px 10px;
            background: rgba(255,255,255,0.06); border-radius: 6px;
            white-space: nowrap; flex-shrink: 0;
        `;
        nodeHint.title = '选中道路后：点击黄色中点插入节点；右键红色控制点删除（至少保留首尾两点）';

        // 批量工作流按钮
        const fullAuditBtn = this.createButton('1️⃣ 🔍 全面审查', '#00bcd4', () => this.detectAllIssues());
        const singleRoadBtn = this.createButton('2️⃣ 🛤️ 单路据点', '#ff9800', () => this.reportSingleRoadCities());
        singleRoadBtn.title = '列出仅连接 1 条道路的据点（正常应 ≥2 条）';

        // 距离固定 250km（设计公理，不可调）
        // 超过的需要加历史中转城（如瓜州、玉门关），不放宽距离
        const distanceLabel = document.createElement('span');
        distanceLabel.style.cssText = `
            font-size: 14px; color: #c0e0c0; padding: 8px 14px;
            background: #1a3a1a; border: 1px solid #388e3c; border-radius: 8px;
            white-space: nowrap; flex-shrink: 0; font-weight: bold;
        `;
        distanceLabel.textContent = '🎯 距离上限: 250 km';
        distanceLabel.title = '设计公理：超过 250km 的请加中间据点（不放宽距离）';

        // [2026-05-30] Row 0: 状态栏独占一行, 文字变长不再挤按钮
        const row0 = document.createElement('div');
        row0.style.cssText = `
            display: flex; align-items: center; gap: 8px;
            padding: 6px 12px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            border-left: 4px solid #ffd700;
            min-height: 36px;
            overflow: hidden;
        `;
        // 状态文字 flex: 1 充满空间, 长了自动 ellipsis 截断 (不影响按钮)
        this.statusLabel.style.cssText = `
            color: #ffd700; font-weight: bold; font-size: 17px;
            flex: 1; min-width: 0;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        `;
        this.statusLabel.title = ''; // 完整文字鼠标 hover 不显示, 直接看 row0
        row0.appendChild(this.statusLabel);

        // [2026-05-30] 最小化按钮: 只留 row0 (状态栏), 隐藏其他全部
        const minBtn = document.createElement('button');
        minBtn.id = 'editor-min-btn';
        minBtn.textContent = '─';
        minBtn.title = '最小化道路编辑器 (只留状态栏)';
        minBtn.style.cssText = `
            background: rgba(255,215,0,0.2); color: #ffd700; border: 1.5px solid rgba(255,215,0,0.5);
            border-radius: 8px; padding: 4px 14px;
            cursor: pointer; font-size: 18px; font-weight: bold; line-height: 1;
            flex-shrink: 0; transition: filter 0.2s;
            margin-left: 12px;
        `;
        minBtn.addEventListener('mouseenter', () => minBtn.style.filter = 'brightness(1.3)');
        minBtn.addEventListener('mouseleave', () => minBtn.style.filter = 'brightness(1)');
        minBtn.addEventListener('click', () => this.togglePanelMinimized());
        // ===== 模式切换：陆路 / 海路（合并后海路不再有独立入口）=====
        const modeWrap = document.createElement('div');
        modeWrap.style.cssText = 'display:flex; gap:6px; align-items:center; margin-left:auto; padding-right:10px;';
        const landBtn = this.createButton('\u{1F6E3}️ 陆路', '#4caf50', () => this.setMode('land'));
        const seaBtn = this.createButton('\u{1F6A2} 海路', '#455a64', () => this.setMode('sea'));
        landBtn.title = '编辑陆上道路（NE 路网）';
        seaBtn.title = '编辑海上航线（原「海路编辑」入口，已并入这里）';
        modeWrap.appendChild(landBtn);
        modeWrap.appendChild(seaBtn);
        row0.appendChild(modeWrap);
        this.modeBtns = { land: landBtn, sea: seaBtn };

        row0.appendChild(minBtn);

        // ===== Row 1: 单条道路编辑 (按钮固定不挪) =====
        const row1 = document.createElement('div');
        // flex-wrap: nowrap → 按钮强制一行排列, 不换行
        row1.style.cssText = 'display:flex; gap:8px; align-items:center; flex-wrap:nowrap; overflow-x:auto;';

        const row1Label = document.createElement('span');
        row1Label.textContent = '单条编辑:';
        row1Label.style.cssText = 'color: #aaa; font-size: 14px; padding-right: 6px; white-space:nowrap; font-weight:bold; flex-shrink:0;';

        // [2026-05-30] 上/下条按钮: 在下拉列表中循环切换道路
        const prevRoadBtn = this.createButton('◀ 上一条', '#5e35b1', () => this.selectAdjacentRoad(-1));
        const nextRoadBtn = this.createButton('下一条 ▶', '#5e35b1', () => this.selectAdjacentRoad(1));
        prevRoadBtn.title = '在下拉列表中循环选上一条道路';
        nextRoadBtn.title = '在下拉列表中循环选下一条道路';

        row1.appendChild(this.roadFilter);
        row1.appendChild(this.roadSort);
        row1.appendChild(this.roadSelect);
        row1.appendChild(prevRoadBtn);
        row1.appendChild(nextRoadBtn);
        row1.appendChild(row1Label);
        row1.appendChild(this.switchRouteBtn);
        row1.appendChild(stashBtn);
        row1.appendChild(saveBtn);
        row1.appendChild(deleteBtn);
        row1.appendChild(nodeHint);

        // [2026-05-30] 隐藏/显示 橙色手画路 — 看清下面 NE 白线
        let orangeVisible = true;
        const toggleOrangeBtn = this.createButton('🟠 隐藏橙路', '#ff6f00', () => {
            orangeVisible = !orangeVisible;
            this.toggleLayerPane('manual-roads-pane', orangeVisible);
            toggleOrangeBtn.textContent = orangeVisible ? '🟠 隐藏橙路' : '⬜ 显示橙路';
            toggleOrangeBtn.style.background = orangeVisible ? '#ff6f00' : '#607d8b';
            this.setStatus(orangeVisible ? '👁 橙色手画路已显示' : '🚫 橙色手画路已隐藏 — 只看 NE 白线');
        });
        toggleOrangeBtn.title = '隐藏 Layer 1 橙色手画路, 只剩白色 NE 底图';
        row1.appendChild(toggleOrangeBtn);

        // ===== Row 2: 批量工作流 =====
        const row2 = document.createElement('div');
        row2.style.cssText = 'display:flex; gap:8px; align-items:center; flex-wrap:nowrap; overflow-x:auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;';

        const row2Label = document.createElement('span');
        row2Label.textContent = '批量工作流:';
        row2Label.style.cssText = 'color: #aaa; font-size: 14px; padding-right: 6px; white-space:nowrap; font-weight:bold; flex-shrink:0;';

        row2.appendChild(row2Label);
        // 🔴 [2026-11-14 主人「能算出来的道路太少了，能多加点吗」] 视野补路：一次把视野里缺的边算出来
        const fillRoadsBtn = this.createButton('➕ 视野补路', '#26a69a', () => { void this.batchFillVisibleRoads(); });
        fillRoadsBtn.title = '把当前视野内「最近却还没直路」的据点对自动算路（NE 路网 · ≤250km · 禁水路 · 绕行≤2×）· 只进内存，点 💾 保存 才写盘 · 再点一次补下一圈';

        row2.appendChild(fullAuditBtn);
        row2.appendChild(singleRoadBtn);
        row2.appendChild(fillRoadsBtn);
        row2.appendChild(distanceLabel);

        // [2026-05-30] 问题路导航 — 配合 1️⃣ 全面审查 用
        const prevProblemBtn = this.createButton('◀ 上问题', '#9c27b0', () => this.selectAdjacentProblem(-1));
        const nextProblemBtn = this.createButton('下问题 ▶', '#9c27b0', () => this.selectAdjacentProblem(1));
        prevProblemBtn.title = '在 1️⃣ 全面审查 的问题队列里上一条';
        nextProblemBtn.title = '在 1️⃣ 全面审查 的问题队列里下一条';
        row2.appendChild(prevProblemBtn);
        row2.appendChild(nextProblemBtn);

        this.panel.appendChild(row0);
        // 海路面板的宿主：SeaRouteEditor.createPanel 会把自己挂进来（见它的 setHost）
        this.seaHost = document.createElement('div');
        this.seaHost.id = 'sea-route-editor-host';
        this.seaHost.style.display = 'none';
        this.panel.appendChild(this.seaHost);
        this.panel.appendChild(row1);
        this.panel.appendChild(row2);
        // 保存引用以便 togglePanelMinimized 切换
        this.panelRows = { row1, row2 };

        // [2026-05-30] Row 3: 报告区 — 自动连/审计的详细报告显示在这里 (不再用 alert)
        this.reportArea = document.createElement('div');
        this.reportArea.style.cssText = `
            display: none;
            border-top: 1px solid rgba(255,215,0,0.2);
            padding-top: 12px; margin-top: 4px;
            max-height: 600px; overflow-y: auto;
            font-size: 14px; line-height: 1.7;
            background: rgba(0,0,0,0.3);
            border-radius: 10px; padding: 16px 20px;
            scrollbar-width: thin; scrollbar-color: #ffd700 #1a1a25;
        `;
        this.panel.appendChild(this.reportArea);

        document.body.appendChild(this.panel);
    }

    private reportArea!: HTMLDivElement;
    /** [2026-05-30] 上次审查的问题路 id 队列, 供 [◀ 上问题/下问题 ▶] 导航 */
    private problemRoadIds: string[] = [];
    /** 🔴 [2026-09-24] 问题队列里的「点」项（未连路的战场、孤儿城），排在道路问题之后一起轮 */
    private problemPointIds: string[] = [];
    private problemRoadIdx: number = -1;

    /** 在问题队列里上一/下一条（道路问题在前，据点/战场问题在后） */
    private selectAdjacentProblem(delta: number): void {
        const queue: Array<{ kind: 'road' | 'point'; id: string }> = [
            ...this.problemRoadIds.map((id) => ({ kind: 'road' as const, id })),
            ...this.problemPointIds.map((id) => ({ kind: 'point' as const, id })),
        ];
        if (queue.length === 0) {
            this.setStatus('⚠ 暂无问题队列, 先点 1️⃣ 全面审查');
            return;
        }
        let nextIdx = this.problemRoadIdx + delta;
        if (nextIdx < 0) nextIdx = queue.length - 1;
        if (nextIdx >= queue.length) nextIdx = 0;
        this.problemRoadIdx = nextIdx;
        const item = queue[nextIdx];
        if (item.kind === 'road') {
            this.selectRoad(item.id);
            if (this.roadSelect) this.roadSelect.value = item.id;
            this.setStatus(`🔍 问题 [${nextIdx + 1}/${queue.length}] ${item.id}`);
        } else {
            const ep = findEndpoint(item.id);
            if (ep) this.locatePoint(ep.lat, ep.lng, `问题 [${nextIdx + 1}/${queue.length}] ${endpointLabel(ep)}（${ep.kind === 'battlefield' ? '战场未连路' : '据点无路'}）`);
        }
    }

    /**
     * 🔴 [2026-09-24 主人「报错后要能定位」] 定位到一个点：固定 ZOOM 9、居中，并在该处闪一圈黄光 3 秒，
     * 据点与战场同一种定位。
     */
    private locatePoint(lat: number, lng: number, label: string): void {
        this.releaseCameraFollow();
        // 直接跳过去（不做动画）：动画靠浏览器动画帧推进，窗口不在前台时会卡在原地
        // 🔴 [2026-09-25 主人「道路编辑器不要总是切换ZOOM好吗，保持在9」] 定位一律 ZOOM 9
        this.map.setView([lat, lng], 9, { animate: false });
        this.flashAt(lat, lng);
        this.setStatus(`📍 ${label} (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
    }

    private flashMarker: L.CircleMarker | null = null;
    private flashTimer = 0;
    private flashAt(lat: number, lng: number): void {
        if (this.flashMarker) { this.map.removeLayer(this.flashMarker); this.flashMarker = null; }
        window.clearTimeout(this.flashTimer);
        const m = L.circleMarker([lat, lng], {
            radius: 28, color: '#ffeb3b', weight: 4, fill: false, opacity: 1, interactive: false,
        }).addTo(this.map);
        this.flashMarker = m;
        let t = 0;
        const tick = () => {
            if (this.flashMarker !== m) return;
            t += 1;
            m.setStyle({ opacity: t % 2 ? 0.25 : 1 });
            if (t < 12) this.flashTimer = window.setTimeout(tick, 250);
            else { this.map.removeLayer(m); this.flashMarker = null; }
        };
        this.flashTimer = window.setTimeout(tick, 250);
    }

    // ===== 战场标记（编辑器专用；与据点一样可点选作起点/终点）=====
    private bfLayer: L.LayerGroup | null = null;
    private bfHooked = false;

    /** 各战场连着几条路（陆路；海路不会连到战场） */
    private battlefieldRoadCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const f of VECTOR_ROAD_DATA.features) {
            const a = f?.properties?.startConnection, b = f?.properties?.endConnection;
            for (const id of [a, b]) if (id && id.startsWith('bf_')) counts.set(id, (counts.get(id) ?? 0) + 1);
        }
        return counts;
    }

    /**
     * 🔴 [2026-09-24 主人「让战场和据点一致，这样我就可以轻松给战场选择线路了」]
     * 编辑器开着时把**全部**战场画成 ⚔ 标记（不看剧本年份，与游戏里的战场图层互不影响）：
     * 已连路 = 紫色，未连路 = 红色虚线圈；点击与点据点一样，依次选作起点 / 终点。
     */
    private renderBattlefieldMarkers(): void {
        if (this.bfLayer) { this.map.removeLayer(this.bfLayer); this.bfLayer = null; }
        if (!this.visible) return;
        const PANE = 'road-editor-bf-pane';
        if (!this.map.getPane(PANE)) {
            const pane = this.map.createPane(PANE);
            pane.style.zIndex = '660';   // 高于据点(610)与奇观(650)，保证点得到
        }
        const counts = this.battlefieldRoadCounts();
        const group = L.layerGroup();
        for (const bf of BATTLEFIELDS) {
            // 🔴 [2026-09-25] 离据点 ≤ BATTLEFIELD_MERGE_KM 的战场「归为一点」：绿色，点它 = 点那座城
            const mergedCity = findEndpoint(battlefieldMergedCityId(bf.id));
            if (mergedCity) {
                const mm = L.circleMarker([bf.lat, bf.lng], {
                    pane: PANE, radius: 9, color: '#2e7d32', weight: 3, fillColor: '#81c784', fillOpacity: 0.85,
                });
                mm.bindTooltip(`⚔${bf.name} ＝ ${mergedCity.name}（归为一点）`, { permanent: true, direction: 'right', offset: [8, 0] });
                mm.on('click', (e: L.LeafletMouseEvent) => {
                    L.DomEvent.stopPropagation(e);
                    this.pickEndpoint(mergedCity);
                });
                group.addLayer(mm);
                continue;
            }
            const n = counts.get(bf.id) ?? 0;
            const linked = n > 0;
            const m = L.circleMarker([bf.lat, bf.lng], {
                pane: PANE,
                radius: 9,
                color: linked ? '#7c4dff' : '#ff1744',
                weight: 3,
                dashArray: linked ? undefined : '4 3',
                fillColor: linked ? '#b388ff' : '#ff80ab',
                fillOpacity: 0.85,
            });
            m.bindTooltip(`⚔${bf.name}${linked ? ` · ${n} 条路` : ' · 未连路'}`, { permanent: true, direction: 'right', offset: [8, 0] });
            m.on('click', (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e);
                const ep = findEndpoint(bf.id);
                if (ep) this.pickEndpoint(ep);
            });
            group.addLayer(m);
        }
        group.addTo(this.map);
        this.bfLayer = group;
    }

    /** [2026-05-30] 面板最小化状态 (true = 只显示状态栏) */
    private panelMinimized: boolean = false;
    /** Row 引用, 用于 togglePanelMinimized */
    private panelRows!: { row1: HTMLDivElement; row2: HTMLDivElement };

    private togglePanelMinimized(): void {
        this.panelMinimized = !this.panelMinimized;
        const newDisplay = this.panelMinimized ? 'none' : 'flex';
        if (this.panelRows?.row1) this.panelRows.row1.style.display = newDisplay;
        if (this.panelRows?.row2) this.panelRows.row2.style.display = newDisplay;
        if (this.reportArea) this.reportArea.style.display = this.panelMinimized ? 'none' : (this.reportArea.innerHTML ? 'block' : 'none');
        // 同步缩窄面板宽度 (最小化时变窄, 让出地图)
        if (this.panel) {
            this.panel.style.width = this.panelMinimized ? '600px' : '1700px';
        }
        // 更新按钮文字
        const btn = document.getElementById('editor-min-btn');
        if (btn) {
            btn.textContent = this.panelMinimized ? '🗖' : '─';
            btn.title = this.panelMinimized ? '展开道路编辑器' : '最小化道路编辑器 (只留状态栏)';
        }
    }

    /** [2026-05-30] 在编辑器面板内显示报告 (替代 alert) */
    private showInlineReport(htmlContent: string): void {
        if (!this.reportArea) return;
        this.reportArea.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="color:#ffd700;font-weight:bold;font-size:16px;">📋 操作报告</span>
                <button id="report-min-btn" style="
                    background:rgba(255,215,0,0.2);color:#ffd700;border:1.5px solid rgba(255,215,0,0.5);
                    padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:bold;">
                    ─ 最小化
                </button>
            </div>
            <div>${htmlContent}</div>
        `;
        this.reportArea.style.display = 'block';
        // [2026-05-30] 关闭改最小化 — 仅隐藏, 不清空 innerHTML
        document.getElementById('report-min-btn')?.addEventListener('click', () => {
            this.reportArea.style.display = 'none';
            // 在状态栏右侧显示"展开报告"按钮
            this.showReportToggleBtn();
        });
        // 已有 toggle 按钮就移除 (因为现在 reportArea 已经显示)
        document.getElementById('report-toggle-btn')?.remove();
        // 给 "👁 看路" 按钮绑事件: 选中道路 + 定位
        this.reportArea.querySelectorAll('.overlap-locate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).dataset.roadId;
                if (id) {
                    this.selectRoad(id);
                    if (this.roadSelect) this.roadSelect.value = id;
                }
            });
        });
    }

    /**
     * [2026-05-30] 在 row0 状态栏右侧显示"📋 展开报告"按钮 (仅当报告最小化时)
     * 点击后 reportArea 重新显示, 不丢内容
     */
    private showReportToggleBtn(): void {
        // 已有则不重复
        if (document.getElementById('report-toggle-btn')) return;
        const minBtn = document.getElementById('editor-min-btn'); // panel 的最小化按钮
        if (!minBtn || !minBtn.parentElement) return;
        const btn = document.createElement('button');
        btn.id = 'report-toggle-btn';
        btn.textContent = '📋 展开报告';
        btn.title = '上次报告内容仍保留, 点击展开';
        btn.style.cssText = `
            background: rgba(255,215,0,0.3); color: #ffd700; border: 1.5px solid rgba(255,215,0,0.6);
            border-radius: 8px; padding: 4px 14px;
            cursor: pointer; font-size: 13px; font-weight: bold;
            flex-shrink: 0; margin-right: 8px;
            transition: filter 0.2s;
        `;
        btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(1.3)');
        btn.addEventListener('mouseleave', () => btn.style.filter = 'brightness(1)');
        btn.addEventListener('click', () => {
            if (this.reportArea) this.reportArea.style.display = 'block';
            btn.remove(); // 展开后该按钮消失
        });
        // 插在 minBtn 之前 (左侧)
        minBtn.parentElement.insertBefore(btn, minBtn);
    }

    private createButton(text: string, bg: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        // [2026-05-30] 放大 + flex-shrink:0 + 固定 padding → 按钮位置永不变
        btn.style.cssText = `
            background: ${bg}; color: white; border: none; border-radius: 10px;
            padding: 10px 20px; cursor: pointer; font-weight: bold; font-size: 16px;
            flex-shrink: 0; white-space: nowrap;
            transition: filter 0.2s;
        `;
        btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(1.15)');
        btn.addEventListener('mouseleave', () => btn.style.filter = 'brightness(1)');
        btn.addEventListener('click', onClick);
        return btn;
    }

    private setStatus(text: string): void {
        if (this.statusLabel) {
            this.statusLabel.textContent = text;
            // [2026-05-30] 长文字 ellipsis 截断, hover 看完整
            this.statusLabel.title = text;
        }
    }

    private updateRoadSelect(): void {
        if (!this.roadSelect) return;
        const filterText = (this.roadFilter?.value || '').toLowerCase().trim();
        this.roadSelect.innerHTML = '<option value="">-- 已有道路 --</option>';
        // 🔴 [2026-09-25 主人令] 排序可切：长路在前（原行为）／新建在前／最旧在前／按名称。
        //    「新/旧」取道路 id 末尾的毫秒时间戳（画路那一刻）；没有时间戳的老路按文件先后兜底。
        const stampOf = (id: string): number => {
            const m = /_(\d{10,})$/.exec(id || '');
            return m ? Number(m[1]) : 0;
        };
        const mode = this.roadSortMode;
        const indexed = VECTOR_ROAD_DATA.features.map((f, i) => ({ f, i }));
        indexed.sort((a, b) => {
            const idA = a.f?.properties?.id ?? '';
            const idB = b.f?.properties?.id ?? '';
            switch (mode) {
                case 'new': {
                    const sA = stampOf(idA), sB = stampOf(idB);
                    if (sA !== sB) return (sB || 0) - (sA || 0);      // 时间戳大的在前；没时间戳的（0）沉底
                    return b.i - a.i;                                  // 同为老路：文件里靠后的在前
                }
                case 'old': {
                    const sA = stampOf(idA) || a.i, sB = stampOf(idB) || b.i;
                    return sA - sB;
                }
                case 'name':
                    return String(a.f?.properties?.name ?? '').localeCompare(String(b.f?.properties?.name ?? ''), 'zh-Hans');
                default:
                    return (b.f?.geometry?.coordinates?.length || 0) - (a.f?.geometry?.coordinates?.length || 0); // 长路在前（原行为）
            }
        });
        for (const { f: feature } of indexed) {
            if (!feature || !feature.properties || !feature.geometry) continue;
            const name = (feature.properties.name || '未命名').toLowerCase();
            const id = (feature.properties.id || '').toLowerCase();
            // 过滤：搜索名称或ID
            if (filterText && !name.includes(filterText) && !id.includes(filterText)) continue;
            const opt = document.createElement('option');
            opt.value = feature.properties.id;
            // 按新旧排序时把日期一并显示出来，方便一眼看出哪几条是新画的
            let when = '';
            if (mode === 'new' || mode === 'old') {
                const ms = stampOf(feature.properties.id || '');
                if (ms) {
                    const d = new Date(ms);
                    const p = (x: number) => String(x).padStart(2, '0');
                    when = ` · ${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
                }
            }
            opt.textContent = `${feature.properties.name || '未命名'} (${feature.geometry.coordinates.length}点${when})`;
            this.roadSelect.appendChild(opt);
        }
    }

    /**
     * [2026-05-30] 在下拉列表里循环切换上一条/下一条道路
     * delta = -1 上一条; +1 下一条
     * 循环: 末尾的下一条回到开头; 开头的上一条到末尾
     * 受搜索过滤影响 (只在过滤结果内循环)
     */
    private selectAdjacentRoad(delta: number): void {
        if (!this.roadSelect) return;
        // 拿所有有 value 的 option (跳过 "-- 已有道路 --" 占位)
        const opts = Array.from(this.roadSelect.options).filter(o => o.value);
        if (opts.length === 0) {
            this.setStatus('⚠ 当前列表为空 (检查搜索框)');
            return;
        }
        const curIdx = opts.findIndex(o => o.value === this.roadSelect!.value);
        let nextIdx = curIdx === -1 ? 0 : curIdx + delta;
        // 循环
        if (nextIdx < 0) nextIdx = opts.length - 1;
        if (nextIdx >= opts.length) nextIdx = 0;
        const nextId = opts[nextIdx].value;
        this.selectRoad(nextId);
        // 状态栏额外提示位置
        this.setStatus(`${this.statusLabel?.textContent || ''} · [${nextIdx + 1}/${opts.length}]`);
    }

    // ===== 城市选择模式 =====

    private enableCitySelection(): void {
        this.cityClickHandler = (city: any, _e?: any) => {
            if (!this.visible) return;
            const ep = findEndpoint(city.id || city.name);
            if (ep) this.pickEndpoint(ep);
        };

        // 注册城市点击
        this.cityManager.setOnCityClick(this.cityClickHandler);

        // 🔴 [2026-09-28] 途经点：起点选好后，按住 Shift 点地图任意处 → 加一个途经点；终点已选则立即重算
        if (this.viaClickHandler) this.map.off('click', this.viaClickHandler);
        this.viaClickHandler = (e: L.LeafletMouseEvent) => {
            if (!this.visible || !this.startCityId || !e.originalEvent?.shiftKey) return;
            this.addViaPoint(e.latlng.lat, e.latlng.lng);
        };
        this.map.on('click', this.viaClickHandler);
    }

    private addViaPoint(lat: number, lng: number): void {
        const idx = this.viaPoints.length + 1;
        const marker = L.circleMarker([lat, lng], {
            radius: 8, color: '#ff9100', fillColor: '#ffab40', fillOpacity: 0.9, weight: 3
        }).addTo(this.map);
        marker.bindTooltip(`途经${idx}（右键删）`, { permanent: true, direction: 'top' });
        const via = { lat, lng, marker };
        marker.on('contextmenu', (ev: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(ev);
            this.map.removeLayer(marker);
            this.viaPoints = this.viaPoints.filter(v => v !== via);
            this.viaPoints.forEach((v, i) => v.marker.setTooltipContent(`途经${i + 1}（右键删）`));
            if (this.endCityId) { this.setStatus('⏳ 途经点已删，重新寻路...'); setTimeout(() => this.generatePath(), 50); }
        });
        this.viaPoints.push(via);
        if (this.endCityId) {
            this.setStatus(`⏳ 已加途经${idx}，重新寻路...`);
            setTimeout(() => this.generatePath(), 50);
        } else {
            this.setStatus(`📍 已加途经${idx} | 继续 Shift+点地图加途经点，或点击终点据点/⚔战场`);
        }
    }

    private clearViaPoints(): void {
        for (const v of this.viaPoints) this.map.removeLayer(v.marker);
        this.viaPoints = [];
    }

    /**
     * 途经点路线：起点→途经1→…→终点 逐段寻路（陆路为主，不走海路）再拼接。
     * 某一段底图寻不通、或绕得离谱（与 isExtremeDetour 同一口径）→ 只那一段用直线，其余照样贴着底图的路。
     */
    private buildViaCandidate(startCity: { lat: number; lng: number }, endCity: { lat: number; lng: number }): RouteCandidate | null {
        if (!this.viaPoints.length || !this.geoGraphBuilt) return null;
        const pts = [startCity, ...this.viaPoints.map(v => ({ lat: v.lat, lng: v.lng })), endCity];
        const coords: [number, number][] = [];
        const edgeKeys = new Set<string>();
        let straightLegs = 0;
        for (let i = 0; i + 1 < pts.length; i++) {
            const a = pts[i], b = pts[i + 1];
            const direct = this.haversine(a.lat, a.lng, b.lat, b.lng);
            const best = this.dijkstraBestAmongNodes(
                this.findAccessGeoNodes(a.lat, a.lng, 4),
                this.findAccessGeoNodes(b.lat, b.lng, 4),
                { routePreference: 'land_first' }
            );
            let leg: [number, number][];
            if (best && best.coordinates.length >= 2 && !this.isExtremeDetour(this.calculatePathLength(best.coordinates as [number, number][]), direct, a, b)) {
                leg = best.coordinates as [number, number][];
                best.edgeKeys.forEach(k => edgeKeys.add(k));
            } else {
                leg = [[a.lng, a.lat], [b.lng, b.lat]];
                straightLegs++;
            }
            // 途经点本身也要落在线上：段首接上途经点坐标（第一段由调用方拼起点城）
            if (i > 0) coords.push([a.lng, a.lat]);
            for (const c of leg) coords.push(c);
        }
        const total = this.calculatePathLength(coords);
        const directAll = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
        return {
            mode: 'prefer_land',
            label: `📍 途经点路线（${this.viaPoints.length}点${straightLegs ? `·${straightLegs}段直线` : ''}）`,
            coordinates: coords,
            totalDistance: total,
            edgeKeys,
            isManualStraightLine: false,
            waterRatio: this.computeWaterRatioFromEdgeKeys(edgeKeys),
            detourRatio: total / Math.max(1, directAll),
            variantReason: '途经点',
            score: Number.MAX_SAFE_INTEGER,
        };
    }

    /** 选起点 / 终点：据点与战场同一条路（战场由编辑器自己的 ⚔ 标记点击进来） */
    private pickEndpoint(ep: RoadEndpoint): void {
        if (!this.visible) return;
        if (!this.startCityId) {
            this.startCityId = ep.id;
            this.startMarker = L.circleMarker([ep.lat, ep.lng], {
                radius: 10, color: '#00e676', fillColor: '#00e676',
                fillOpacity: 0.8, weight: 3
            }).addTo(this.map);
            this.startMarker.bindTooltip(`起点: ${endpointLabel(ep)}`, { permanent: true, direction: 'top' });
            this.setStatus(`✅ 起点: ${endpointLabel(ep)} | 请点击第二个据点或 ⚔战场（终点）· 按住 Shift 点地图可先加途经点`);
        } else if (!this.endCityId) {
            if (ep.id === this.startCityId) return; // 不能选同一端点
            this.endCityId = ep.id;
            this.endMarker = L.circleMarker([ep.lat, ep.lng], {
                radius: 10, color: '#ff1744', fillColor: '#ff1744',
                fillOpacity: 0.8, weight: 3
            }).addTo(this.map);
            this.endMarker.bindTooltip(`终点: ${endpointLabel(ep)}`, { permanent: true, direction: 'top' });
            const startName = endpointLabel(findEndpoint(this.startCityId), this.startCityId);
            this.setStatus(`⏳ 正在寻路: ${startName} → ${endpointLabel(ep)}...`);
            setTimeout(() => this.generatePath(), 100);
        }
    }

    private disableCitySelection(): void {
        // 恢复默认的城市点击（不做任何事）
        this.cityManager.setOnCityClick(() => { });
        if (this.viaClickHandler) { this.map.off('click', this.viaClickHandler); this.viaClickHandler = null; }
        this.clearViaPoints();
    }

    private clearCitySelection(): void {
        this.startCityId = null;
        this.endCityId = null;
        if (this.startMarker) { this.map.removeLayer(this.startMarker); this.startMarker = null; }
        if (this.endMarker) { this.map.removeLayer(this.endMarker); this.endMarker = null; }
        this.clearViaPoints();

        // [FIX] 清空候选路径并隐藏切换按钮
        this.pathCandidates = [];
        this.currentCandidateIdx = 0;
        if (this.switchRouteBtn) this.switchRouteBtn.style.visibility = 'hidden';
    }

    /**
     * [2026-05-30] 完整重置: 清当前选择 + 清城市点击 + 重新注册城市点击
     * 用于"画好一条想继续画下一条"场景
     */
    private resetForNextDraw(): void {
        // 1. 清当前选中的道路 (含控制点)
        if (this.selectedRoadId) this.clearControlPoints(this.selectedRoadId);
        this.selectedRoadId = null;
        if (this.roadSelect) this.roadSelect.value = '';

        // 2. 清城市起终点 (含 marker)
        this.clearCitySelection();

        // 4. 重新注册城市点击 (确保 handler 活的)
        this.enableCitySelection();

        // 5. 状态提示
        this.setStatus('🏙️ 请点击第一个城市（起点） — 准备画下一条');
    }

    // ===== GeoJSON 路网图构建 =====

    private async loadGeoJSONGraph(): Promise<void> {
        // [FIX] 二次开启: 图已构建, 用缓存的 GeoJSON 重建参考层
        if (this.geoGraphBuilt) {
            if (this.cachedGeoJSON) {
                this.showReferenceLayerFromData(this.cachedGeoJSON);
            }
            return;
        }

        this.setStatus('⏳ 加载路网数据...');

        try {
            const basePath = import.meta.env.BASE_URL || '/';
            const roadsUrl = `${basePath}data/roads_filtered.geojson`;
            const waterUrl = `${basePath}data/ne_10m_rivers_lake_centerlines.geojson`;

            const resRoads = await fetch(roadsUrl);
            if (!resRoads.ok) throw new Error(`取 ${roadsUrl} 失败：HTTP ${resRoads.status}`);
            const textRoads = await resRoads.text();
            let geojsonRoads: any;
            try {
                geojsonRoads = JSON.parse(textRoads);
            } catch (e: any) {
                throw new Error(`解析道路 GeoJSON 失败(${roadsUrl})：${e.message}`);
            }

            // ⚓ [2026-08-28] 海路一并进图：陆路绕海湾/海峡绕远时，改走「陆路→港口→海路→港口→陆路」。
            //    用的就是海路编辑器那份 sea_routes_combined（marnet 远洋主干 + 沿岸航路 + 接驳边，
            //    已剔苏伊士/巴拿马/西北航道）。取不到不算致命 —— 退回纯陆路寻路。
            const seaUrl = `${basePath}data/sea_routes_combined.geojson`;
            let geojsonSea: any = null;
            try {
                const resSea = await fetch(seaUrl);
                if (resSea.ok) geojsonSea = JSON.parse(await resSea.text());
                else console.warn(`[VectorRoadEditor] 海上航线网 HTTP ${resSea.status}，本次只用陆路`);
            } catch (e) {
                console.warn('[VectorRoadEditor] 海上航线网加载失败，本次只用陆路:', e);
            }

            const resWater = await fetch(waterUrl);
            if (!resWater.ok) throw new Error(`取 ${waterUrl} 失败：HTTP ${resWater.status}`);
            const textWater = await resWater.text();
            let geojsonWater: any;
            try {
                geojsonWater = JSON.parse(textWater);
            } catch (e: any) {
                throw new Error(`解析水系 GeoJSON 失败(${waterUrl})：${e.message}`);
            }

            this.cachedGeoJSON = geojsonRoads;  // [FIX] 缓存道路底图以便二次开启重用

            // 海陆掩膜：补桥、城→路口接驳、清理周边都靠它判「这段直线有没有跨海」。取不到就退回不判。
            this.landMaskReady = await loadLandMask(`${basePath}${LAND_MASK_PATH}`);
            if (!this.landMaskReady) console.warn('[VectorRoadEditor] 海陆掩膜加载失败，本次不判陆路跨海');

            this.setStatus('⏳ 构建水陆混合图...');

            // 构建图
            this.buildGraphFromGeoJSON(geojsonRoads, geojsonWater, geojsonSea);
            // [GAP-BRIDGE] 桥接 NE 数据中端点 ≤ 80km 的断段
            // [2026-05-30] 40 → 80km: 用户反馈 光禄城-头曼城 71km 也算直线
            //              NE 内蒙古/西伯利亚段 真实路网有 50-70km 断口
            //              桥接边权 ×2.5 高惩罚, Dijkstra 优先走真路, 不会乱连
            // 🔴 [2026-09-28] 断头先接 25km 内任意陆路（卡什那类「一头是端点、另一头是路中间」的口子）。
            //    必须排在 bridgeEndpointGaps(80) 与 addBridgeEdges(0.03) 之前：那两步会给断头加边，加完它就不再是「度=1 的断头」了。
            this.bridgeEndpointToRoad(25);
            this.bridgeEndpointGaps(80);
            // 邻近节点微距桥接放在端点桥接之后，避免提前把真实度=1断头连回自身后方节点而漏掉 T 字路口接驳
            this.addBridgeEdges(0.03);
            // 🔴 [2026-11-02] 连通分量级浅海陆桥与窄海峡桥接（斯里兰卡保克海峡、达达尼尔海峡、琼州海峡、墨西拿海峡等）
            this.bridgeShallowStraitsAndComponents(45, 12);
            // 水系断口就近连通，「水路为主」才走得通
            this.bridgeWaterGaps(40);
            // 缓存各节点连通块规模，供 findAccessGeoNodes 避开局部孤立碎线
            this.computeNodeComponentSizes();
            // 港口接驳必须在 bridgeEndpointGaps 之后：那之前陆路节点还没补全
            if (geojsonSea) this.linkPortCities();
            this.geoGraphBuilt = true;

            // 显示参考层
            this.showReferenceLayerFromData(geojsonRoads);

            this.setStatus('🏙️ 请点击第一个城市（起点）');
            let edgeCount = 0;
            for (const edges of this.geoAdj.values()) edgeCount += edges.length;
            console.log(`🛤️ [VectorRoadEditor] Graph built: ${this.geoNodes.length} nodes, ${edgeCount} edges`
                + `, 海路节点 ${this.seaNodeIds.size}, 港口接驳 ${this.portLinkCount} 座`);

        } catch (err) {
            // 别把原因吞掉：面板上直接显示真实报错，否则只能看到一句笼统的 ❌，
            // 排查时必须开 console 才知道是取文件失败、JSON 解析失败还是建图/画层出错。
            const reason = err instanceof Error ? err.message : String(err);
            console.error('[VectorRoadEditor] Failed to load GeoJSON:', err);
            this.setStatus(`❌ 加载路网失败：${reason}`);
        }
    }

    private buildGraphFromGeoJSON(geojsonRoads: any, geojsonWater?: any, geojsonSea?: any): void {
        const SNAP_TOLERANCE = 0.05; // ~5km 容差 (增大以确保连接)
        this.seaLaneSegs = [];
        this.seaLaneGrid = new Map();
        const nodeMap: Map<string, number> = new Map();

        const snapKey = (lat: number, lng: number): string => {
            const rLat = Math.round(lat / SNAP_TOLERANCE) * SNAP_TOLERANCE;
            const rLng = Math.round(lng / SNAP_TOLERANCE) * SNAP_TOLERANCE;
            return `${rLat.toFixed(3)}_${rLng.toFixed(3)}`;
        };

        // ns: 'L' 陆路/内河 · 'S' 海路。两套节点**绝不共用** —— 否则近岸的航线顶点会和公路顶点
        // 撞进同一个 key，等于凭空多出一堆「随便哪段海岸都能上下船」的暗门。上下船只走港口城。
        const getOrCreateNode = (lat: number, lng: number, ns: 'L' | 'S' = 'L'): number => {
            const key = ns + snapKey(lat, lng);
            if (nodeMap.has(key)) return nodeMap.get(key)!;

            const id = this.geoNodes.length;
            this.geoNodes.push({ id, lat, lng });
            this.geoAdj.set(id, []);
            nodeMap.set(key, id);
            return id;
        };

        const addEdge = (fromId: number, toId: number, coords: [number, number][], weightDiscount: number = 1.0, isWater: boolean = false, isSea: boolean = false) => {
            if (fromId === toId) return;
            const weight = this.calculatePathLength(coords) * weightDiscount;
            if (!isFinite(weight) || weight < 0.01) return; // NaN/Infinity/零距离保护

            const edge: GeoEdge = { from: fromId, to: toId, weight, coords, isWater, isSea };
            this.geoAdj.get(fromId)!.push(edge);

            const rev: GeoEdge = {
                from: toId, to: fromId, weight,
                coords: [...coords].reverse() as [number, number][],
                isWater, isSea
            };
            this.geoAdj.get(toId)!.push(rev);
        };

        // [FIX] 不再注入项目已有道路（VECTOR_ROAD_DATA）到图中
        // 道路编辑器纯粹基于 Natural Earth 路网寻最短路径

        // === 注入 Natural Earth 路网 ===
        const processLineString = (coords: [number, number][], isWater: boolean = false) => {
            if (coords.length < 2) return;
            for (let i = 0; i < coords.length - 1; i++) {
                const [lng1, lat1] = coords[i];
                const [lng2, lat2] = coords[i + 1];
                const fromId = getOrCreateNode(lat1, lng1);
                const toId = getOrCreateNode(lat2, lng2);
                addEdge(fromId, toId, [coords[i], coords[i + 1]], 1.0, isWater);
            }
        };

        const processFeatures = (features: any[], isWater: boolean = false) => {
            for (const feature of features) {
                const geom = feature.geometry;
                if (geom?.type === 'LineString') {
                    processLineString(geom.coordinates, isWater);
                } else if (geom?.type === 'MultiLineString') {
                    for (const line of geom.coordinates) processLineString(line, isWater);
                }
            }
        };

        processFeatures(geojsonRoads.features || [], false);
        if (geojsonWater) {
            processFeatures(geojsonWater.features || [], true);
        }

        // === 注入海上航线网（独立节点空间，只经港口城与陆路相接）===
        if (geojsonSea) {
            const addSeaLine = (line: [number, number][], source: string, passage?: string | null) => {
                if (!line || line.length < 2) return;
                // 远洋主干加惩罚，沿岸/接驳/海峡咽喉(passage)按真实里程 —— 与 SeaRouteEditor 同规矩
                const discount = (source === 'marnet' && !passage) ? VectorRoadEditor.OPEN_SEA_PENALTY : 1.0;
                for (let i = 0; i < line.length - 1; i++) {
                    const [lng1, lat1] = line[i];
                    const [lng2, lat2] = line[i + 1];
                    const a = getOrCreateNode(lat1, lng1, 'S');
                    const b = getOrCreateNode(lat2, lng2, 'S');
                    this.seaNodeIds.add(a);
                    this.seaNodeIds.add(b);
                    addEdge(a, b, [line[i], line[i + 1]], discount, false, true);
                    this.indexSeaLaneSeg(lng1, lat1, lng2, lat2);
                }
            };
            for (const f of geojsonSea.features || []) {
                const g = f?.geometry;
                if (!g?.coordinates) continue;
                const source: string = f?.properties?.source ?? 'marnet';
                const passage: string | null = f?.properties?.passage ?? null;
                const lines = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates];
                for (const line of lines) addSeaLine(line, source, passage);
            }
        }

        console.log(`🛤️ [GraphBuilder] ${this.geoNodes.length} nodes, graph built from Natural Earth data (Roads + Water).`);
    }

    /**
     * 后处理：吸附到已有道路 (区段替换算法 v3)
     * 
     * 核心思路：
     * 1. 对新路径的每个点，找最近的已有道路（使用"点到折线"距离）
     * 2. 找连续的、靠近同一条已有道路的"run"（区段）
     * 3. 对于每个 run，用该已有道路上对应的实际坐标段替换
     *    (不是投影，是直接复制已有道路的坐标)
     * 
     * 这保证了替换后的线段和已有道路 **像素级重合**，
     * 而不是"靠近但有偏差"的并排线。
     */
    private snapToExistingRoads(newCoords: [number, number][], excludeRoadId: string | null = null): [number, number][] {
        if (newCoords.length < 3) return newCoords;
        const SNAP_DIST = 0.05; // ~5km 经纬度距离
        const MIN_RUN = 2; // 至少连续 2 个点靠近同一条路才触发替换

        // Exclude self to avoid snapping to own geometry
        const existingRoads = VECTOR_ROAD_DATA.features.filter(f => f.properties.id !== excludeRoadId);
        if (existingRoads.length === 0) return newCoords;

        // 🔴 [2026-09-01 修「连接路时卡住」] 包围盒剪枝。
        //    原实现对新路的**每个点**都遍历全部 1368 条路的全部 40444 个顶点：
        //    一条 607 点的长路要算 2450 万次点-线段投影，主线程同步跑 = 编辑器假死。
        //    先按「点到该路包围盒的距离」筛掉够不着的路（盒外距离是真实距离的下界，
        //    不会漏判），只对少数候选跑逐段投影。同 RoadRegistry.findNearestRoadEntry 的做法。
        const bboxes = existingRoads.map((f) => {
            const cs = f.geometry.coordinates as [number, number][];
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const c of cs) {
                if (c[0] < minX) minX = c[0];
                if (c[0] > maxX) maxX = c[0];
                if (c[1] < minY) minY = c[1];
                if (c[1] > maxY) maxY = c[1];
            }
            return { minX, maxX, minY, maxY };
        });
        /** 点到包围盒的距离（盒内为 0）；这是点到该路任意一段距离的下界 */
        const bboxDist = (p: [number, number], b: { minX: number; maxX: number; minY: number; maxY: number }): number => {
            const dx = p[0] < b.minX ? b.minX - p[0] : p[0] > b.maxX ? p[0] - b.maxX : 0;
            const dy = p[1] < b.minY ? b.minY - p[1] : p[1] > b.maxY ? p[1] - b.maxY : 0;
            return Math.hypot(dx, dy);
        };

        // Helper: 计算点到折线(Polyline)的最近点信息
        const nearestOnPolyline = (p: [number, number], polyCoords: [number, number][]): {
            segIdx: number;  // 最近线段的起始索引
            t: number;       // 在该线段上的参数 [0,1]
            dist: number;    // 距离
            point: [number, number]; // 最近点坐标
        } | null => {
            let best: { segIdx: number; t: number; dist: number; point: [number, number] } | null = null;

            for (let j = 0; j < polyCoords.length - 1; j++) {
                const a = polyCoords[j];
                const b = polyCoords[j + 1];
                const dx = b[0] - a[0];
                const dy = b[1] - a[1];
                const lenSq = dx * dx + dy * dy;

                let t: number;
                let projX: number, projY: number;

                if (lenSq === 0) {
                    t = 0;
                    projX = a[0]; projY = a[1];
                } else {
                    t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
                    t = Math.max(0, Math.min(1, t));
                    projX = a[0] + t * dx;
                    projY = a[1] + t * dy;
                }

                const dist = Math.sqrt((p[0] - projX) ** 2 + (p[1] - projY) ** 2);

                if (!best || dist < best.dist) {
                    best = { segIdx: j, t, dist, point: [projX, projY] };
                }
            }
            return best;
        };

        // Step 1: 对每个新路径点，找最近的已有道路
        type SnapInfo = { roadIdx: number; segIdx: number; t: number; dist: number } | null;
        const snapInfos: SnapInfo[] = newCoords.map(p => {
            let best: SnapInfo = null;
            for (let ri = 0; ri < existingRoads.length; ri++) {
                // 剪枝：盒距已经够不着吸附半径（或不可能比当前最优更近）→ 整条路跳过
                const lower = bboxDist(p, bboxes[ri]);
                if (lower >= SNAP_DIST) continue;
                if (best && lower >= best.dist) continue;
                const roadCoords = existingRoads[ri].geometry.coordinates as [number, number][];
                const nearest = nearestOnPolyline(p, roadCoords);
                if (nearest && nearest.dist < SNAP_DIST && (!best || nearest.dist < best.dist)) {
                    best = { roadIdx: ri, segIdx: nearest.segIdx, t: nearest.t, dist: nearest.dist };
                }
            }
            return best;
        });

        // Step 2: 找连续的 "run"（同一条路的连续点）并替换
        const result: [number, number][] = [];
        let i = 0;

        while (i < newCoords.length) {
            const snap = snapInfos[i];

            if (!snap) {
                // 不靠近任何已有道路，保持原样
                result.push(newCoords[i]);
                i++;
                continue;
            }

            // 看连续多少个点都靠近同一条路
            let runEnd = i + 1;
            while (runEnd < newCoords.length &&
                snapInfos[runEnd] &&
                snapInfos[runEnd]!.roadIdx === snap.roadIdx) {
                runEnd++;
            }

            const runLength = runEnd - i;

            if (runLength < MIN_RUN) {
                // 太短，不替换（避免误吸附）
                for (let j = i; j < runEnd; j++) {
                    result.push(newCoords[j]);
                }
                i = runEnd;
                continue;
            }

            // ✅ 连续 MIN_RUN+ 个点靠近同一条已有道路 → 用道路的实际坐标替换
            const road = existingRoads[snap.roadIdx];
            const roadCoords = road.geometry.coordinates as [number, number][];

            // 获取 run 的起始和结束在已有道路上的位置
            const startInfo = snapInfos[i]!;
            const endInfo = snapInfos[runEnd - 1]!;

            // 确定在已有道路坐标上的提取范围
            // startPos / endPos 是 "线性位置" = segIdx + t
            const startPos = startInfo.segIdx + startInfo.t;
            const endPos = endInfo.segIdx + endInfo.t;
            const posFrom = Math.min(startPos, endPos);
            const posTo = Math.max(startPos, endPos);
            const idxFrom = Math.floor(posFrom);
            const idxTo = Math.ceil(posTo);

            console.log(`🔗 [SnapMerge] Replacing ${runLength} points with "${road.properties.name}" coords [${idxFrom}..${idxTo}] of ${roadCoords.length}`);

            // 过渡点：新路的起始点（平滑过渡到已有道路）
            result.push(newCoords[i]);

            // 提取已有道路的实际坐标
            const safeFrom = Math.max(0, idxFrom);
            const safeTo = Math.min(roadCoords.length - 1, idxTo);

            if (startPos <= endPos) {
                // 正向
                for (let s = safeFrom; s <= safeTo; s++) {
                    result.push(roadCoords[s]);
                }
            } else {
                // 反向
                for (let s = safeTo; s >= safeFrom; s--) {
                    result.push(roadCoords[s]);
                }
            }

            // 过渡点：新路的末尾点（从已有道路平滑过渡回来）
            if (runEnd - 1 !== i) {
                result.push(newCoords[runEnd - 1]);
            }

            i = runEnd;
        }

        // 去重
        const deduped: [number, number][] = [];
        if (result.length > 0) deduped.push(result[0]);
        for (let k = 1; k < result.length; k++) {
            const last = deduped[deduped.length - 1];
            const curr = result[k];
            if (Math.abs(last[0] - curr[0]) > 0.00001 || Math.abs(last[1] - curr[1]) > 0.00001) {
                deduped.push(curr);
            }
        }

        console.log(`🔗 [SnapMerge] ${newCoords.length} → ${deduped.length} points after section replacement`);
        return deduped;
    }

    /**
     * 桥接: 对每个节点查找邻近节点，添加桥接边。
     * 使用空间网格加速。
     */
    private addBridgeEdges(tolerance: number): void {
        const grid: Map<string, number[]> = new Map();

        for (const node of this.geoNodes) {
            const cx = Math.floor(node.lng / tolerance);
            const cy = Math.floor(node.lat / tolerance);
            const key = `${cx}_${cy}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(node.id);
        }

        let bridgeCount = 0;

        for (const node of this.geoNodes) {
            if (this.seaNodeIds.has(node.id)) continue;   // 海路节点不参与陆路补洞（否则等于随处可登陆）
            const adj = this.geoAdj.get(node.id);
            const connectedTo = new Set(adj?.map(e => e.to) || []);

            const cx = Math.floor(node.lng / tolerance);
            const cy = Math.floor(node.lat / tolerance);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const neighbors = grid.get(`${cx + dx}_${cy + dy}`);
                    if (!neighbors) continue;

                    for (const otherId of neighbors) {
                        if (otherId === node.id || connectedTo.has(otherId)) continue;
                        if (this.seaNodeIds.has(otherId)) continue;

                        const other = this.geoNodes[otherId];
                        const dLat = node.lat - other.lat;
                        const dLng = (node.lng - other.lng) * Math.cos(node.lat * Math.PI / 180);
                        const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);

                        if (distDeg < tolerance) {
                            const distKm = this.haversine(node.lat, node.lng, other.lat, other.lng);
                            const weight = distKm * 1.5; // 惩罚，优先走真实路
                            if (!isFinite(weight) || weight < 0.01) continue; // NaN保护

                            const coords: [number, number][] = [
                                [node.lng, node.lat], [other.lng, other.lat]
                            ];

                            const edge: GeoEdge = { from: node.id, to: otherId, weight, coords };
                            this.geoAdj.get(node.id)!.push(edge);

                            const rev: GeoEdge = {
                                from: otherId, to: node.id, weight,
                                coords: [[other.lng, other.lat], [node.lng, node.lat]]
                            };
                            this.geoAdj.get(otherId)!.push(rev);

                            connectedTo.add(otherId);
                            bridgeCount++;
                        }
                    }
                }
            }
        }

        console.log(`🔗 [GraphBuilder] Added ${bridgeCount} bridge edges`);
    }

    /**
     * 水系断口就近连通（「水路为主」候选的基础）。
     *
     * 矢量水系只有 NE 河流中心线这一份（ESRI 那层是栅格瓦片 + WaterMask 掩膜，没有可寻路的线），
     * 它天然是断的：入湖、入海口、三角洲、跨图幅都会断。断着的话「水路为主」一走就掉回陆路。
     * 这里把**只连水的端点**接到最近的另一个水节点上（≤maxKm），边仍标 isWater，权重 ×1.5
     * —— 有真河就走真河，接驳段只在没得选时用。
     */
    private bridgeWaterGaps(maxKm: number): void {
        const isWaterNode = (id: number): boolean => {
            const adj = this.geoAdj.get(id);
            return !!adj && adj.length > 0 && adj.some(e => e.isWater) && !this.seaNodeIds.has(id);
        };
        const waterNodes: number[] = [];
        const endpoints: number[] = [];
        for (const node of this.geoNodes) {
            if (!isWaterNode(node.id)) continue;
            waterNodes.push(node.id);
            const adj = this.geoAdj.get(node.id)!;
            if (adj.filter(e => e.isWater).length === 1) endpoints.push(node.id);
        }

        const CELL = 0.5;
        const grid = new Map<string, number[]>();
        for (const id of waterNodes) {
            const n = this.geoNodes[id];
            const k = `${Math.floor(n.lng / CELL)}_${Math.floor(n.lat / CELL)}`;
            let b = grid.get(k);
            if (!b) { b = []; grid.set(k, b); }
            b.push(id);
        }

        const rings = Math.ceil(maxKm / 55) + 1;
        const linked = new Set<string>();
        let bridged = 0;
        for (const id of endpoints) {
            const node = this.geoNodes[id];
            const connected = new Set((this.geoAdj.get(id) || []).map(e => e.to));
            const cx = Math.floor(node.lng / CELL), cy = Math.floor(node.lat / CELL);
            let bestId = -1, bestKm = Infinity;
            for (let dx = -rings; dx <= rings; dx++) {
                for (let dy = -rings; dy <= rings; dy++) {
                    const bucket = grid.get(`${cx + dx}_${cy + dy}`);
                    if (!bucket) continue;
                    for (const other of bucket) {
                        if (other === id || connected.has(other)) continue;
                        const o = this.geoNodes[other];
                        const km = this.haversine(node.lat, node.lng, o.lat, o.lng);
                        if (km < bestKm) { bestKm = km; bestId = other; }
                    }
                }
            }
            if (bestId < 0 || bestKm > maxKm) continue;
            const key = id < bestId ? `${id}_${bestId}` : `${bestId}_${id}`;
            if (linked.has(key)) continue;
            const other = this.geoNodes[bestId];
            const coords: [number, number][] = [[node.lng, node.lat], [other.lng, other.lat]];
            const weight = bestKm * 1.5;
            if (!isFinite(weight) || weight < 0.01) continue;
            this.geoAdj.get(id)!.push({ from: id, to: bestId, weight, coords, isWater: true });
            this.geoAdj.get(bestId)!.push({ from: bestId, to: id, weight, coords: [coords[1], coords[0]], isWater: true });
            linked.add(key);
            bridged++;
        }
        console.log(`🌊 [WaterBridge] 水系端点 ${endpoints.length} 个，就近接通 ${bridged} 处断口（≤${maxKm}km）`);
    }

    /**
     * 港口接驳：把「陆路图」和「航线图」只在**城市**这一个点上焊起来。
     *
     * 每座城找一次最近陆路节点 + 最近航线节点，两边都在 PORT_LINK_MAX_KM 内才算港口城，
     * 加一条 陆节点—城—海节点 的双向边（isSea，默认寻路不放行，只有 sea_land 模式打开）。
     * 这样「上下船只能在港口城」是图结构本身保证的，不靠后续判断。
     */
    private linkPortCities(): void {
        const CELL = 0.5;
        const key = (lng: number, lat: number) => `${Math.floor(lng / CELL)}_${Math.floor(lat / CELL)}`;
        const landGrid = new Map<string, number[]>();
        const seaGrid = new Map<string, number[]>();
        for (const node of this.geoNodes) {
            const g = this.seaNodeIds.has(node.id) ? seaGrid : landGrid;
            const k = key(node.lng, node.lat);
            let bucket = g.get(k);
            if (!bucket) { bucket = []; g.set(k, bucket); }
            bucket.push(node.id);
        }

        const rings = Math.ceil(VectorRoadEditor.PORT_SEA_LINK_MAX_KM / 55) + 1;   // 0.5° ≈ 55km
        const nearest = (grid: Map<string, number[]>, lat: number, lng: number, maxKm: number): { id: number; km: number } | null => {
            const cx = Math.floor(lng / CELL), cy = Math.floor(lat / CELL);
            let bestId = -1, bestKm = Infinity;
            for (let dx = -rings; dx <= rings; dx++) {
                for (let dy = -rings; dy <= rings; dy++) {
                    const bucket = grid.get(`${cx + dx}_${cy + dy}`);
                    if (!bucket) continue;
                    for (const id of bucket) {
                        const n = this.geoNodes[id];
                        const km = this.haversine(lat, lng, n.lat, n.lng);
                        if (km < bestKm) { bestKm = km; bestId = id; }
                    }
                }
            }
            return bestId >= 0 && bestKm <= maxKm ? { id: bestId, km: bestKm } : null;
        };

        let linked = 0;
        for (const city of CITIES) {
            const land = nearest(landGrid, city.lat, city.lng, VectorRoadEditor.PORT_LAND_LINK_MAX_KM);
            if (!land) continue;
            const sea = nearest(seaGrid, city.lat, city.lng, VectorRoadEditor.PORT_SEA_LINK_MAX_KM);
            if (!sea) continue;

            const landNode = this.geoNodes[land.id];
            const seaNode = this.geoNodes[sea.id];
            const coords: [number, number][] = [
                [landNode.lng, landNode.lat],
                [city.lng, city.lat],
                [seaNode.lng, seaNode.lat],
            ];
            const weight = land.km + sea.km;
            if (!isFinite(weight) || weight < 0.01) continue;
            this.geoAdj.get(land.id)!.push({ from: land.id, to: sea.id, weight, coords, isSea: true });
            this.geoAdj.get(sea.id)!.push({
                from: sea.id, to: land.id, weight,
                coords: [...coords].reverse() as [number, number][], isSea: true,
            });
            linked++;
        }
        this.portLinkCount = linked;
        console.log(`⚓ [PortLink] ${linked} 座港口城已把陆路网与航线网焊通`
            + `（陆 ≤${VectorRoadEditor.PORT_LAND_LINK_MAX_KM}km / 海 ≤${VectorRoadEditor.PORT_SEA_LINK_MAX_KM}km）`);
    }

    /**
     * [GAP-BRIDGE] 桥接附近未直接相连的节点对 - 解决 NE 稀疏区(如黄土高原)断段
     * 桥接 degree ≤ 4 的节点(地理上是"端点或近端点"的位置), 跳过高密度十字路口
     * 高权重(×2.5)惩罚, Dijkstra 优先走真路
     */
    /** 把一段海路航线登记进 0.5° 格子索引（供 crossesSeaLane 查） */
    private indexSeaLaneSeg(lng1: number, lat1: number, lng2: number, lat2: number): void {
        const C = VectorRoadEditor.SEA_LANE_CELL;
        const id = this.seaLaneSegs.push([lng1, lat1, lng2, lat2]) - 1;
        const x0 = Math.floor(Math.min(lng1, lng2) / C), x1 = Math.floor(Math.max(lng1, lng2) / C);
        const y0 = Math.floor(Math.min(lat1, lat2) / C), y1 = Math.floor(Math.max(lat1, lat2) / C);
        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                const k = `${x}_${y}`;
                let b = this.seaLaneGrid.get(k);
                if (!b) { b = []; this.seaLaneGrid.set(k, b); }
                b.push(id);
            }
        }
    }

    /**
     * 这段直线（陆路补桥）是否横穿海路航线 —— 横穿 = 跨海峡/海湾，陆路不许这么补（渡海必须坐船）。
     * 离线评估（scratch/_probe_bridge_sea_check.mjs）：卡什断口判陆路、可补；达达尼尔海峡判跨海；
     * 现有「端点 80km 互连」4677+1198 条里有 1198 条被它拦下（贝尔岛海峡、休伦湖面等）。
     */
    /**
     * 🔴 [2026-10-28 主人「这是陆路」截图：君士坦丁堡—巴菲乌斯战役的路横穿马尔马拉海/伊兹密特湾]
     * 一段直线压在水面上的公里数（每公里取一个样点，按海陆掩膜判）。
     * 补桥、城→路口接驳、清理周边都是凭空拉直线，只查 crossesSeaLane 不够：海湾里没有航线也照样是海。
     */
    private waterKmAlong(lng1: number, lat1: number, lng2: number, lat2: number): number {
        if (!this.landMaskReady) return 0;
        const km = this.haversine(lat1, lng1, lat2, lng2);
        const n = Math.max(1, Math.ceil(km));
        let wet = 0;
        for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n;
            if (!isLand(lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t)) wet++;
        }
        return km * wet / n;
    }

    private isOverWater(lng1: number, lat1: number, lng2: number, lat2: number): boolean {
        return this.waterKmAlong(lng1, lat1, lng2, lat2) > VectorRoadEditor.LAND_LINK_WATER_TOLERANCE_KM;
    }

    private crossesSeaLane(lng1: number, lat1: number, lng2: number, lat2: number): boolean {
        if (this.seaLaneSegs.length === 0) return false;
        const C = VectorRoadEditor.SEA_LANE_CELL;
        const x0 = Math.floor(Math.min(lng1, lng2) / C), x1 = Math.floor(Math.max(lng1, lng2) / C);
        const y0 = Math.floor(Math.min(lat1, lat2) / C), y1 = Math.floor(Math.max(lat1, lat2) / C);
        const side = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) =>
            Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px));
        const seen = new Set<number>();
        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                for (const id of this.seaLaneGrid.get(`${x}_${y}`) ?? []) {
                    if (seen.has(id)) continue;
                    seen.add(id);
                    const [cx, cy, dx, dy] = this.seaLaneSegs[id];
                    if (side(lng1, lat1, lng2, lat2, cx, cy) !== side(lng1, lat1, lng2, lat2, dx, dy)
                        && side(cx, cy, dx, dy, lng1, lat1) !== side(cx, cy, dx, dy, lng2, lat2)) return true;
                }
            }
        }
        return false;
    }

    /**
     * 🔴 [2026-09-28 主人「请修复」] 断头端点接到 maxKm 内最近的**任意**陆路节点（不止端点对端点）。
     *    病例：吕基亚沿海路在卡什断开 8.5km —— 西段 #4137 的尽头是断头，东段两条路共用的起点度数为 2、
     *    不算端点，于是 bridgeEndpointGaps（只连端点对端点）永远补不上，哈利卡纳苏斯→佩尔格只能绕内陆。
     *    规矩：只连陆路节点；横穿海路航线不补；跳过自己这条路上 30 步以内的点（免得接回自己）；权重 ×1.5。
     */
    private bridgeEndpointToRoad(maxKm: number): void {
        const CELL = 0.1;
        const grid = new Map<string, number[]>();
        for (const n of this.geoNodes) {
            if (this.seaNodeIds.has(n.id)) continue;
            const k = `${Math.floor(n.lng / CELL)}_${Math.floor(n.lat / CELL)}`;
            let b = grid.get(k);
            if (!b) { b = []; grid.set(k, b); }
            b.push(n.id);
        }
        const nearOnOwnRoad = (from: number): Set<number> => {
            const seen = new Set<number>([from]);
            let frontier = [from];
            for (let step = 0; step < 30 && frontier.length; step++) {
                const next: number[] = [];
                for (const u of frontier) for (const e of this.geoAdj.get(u) ?? []) if (!seen.has(e.to)) { seen.add(e.to); next.push(e.to); }
                frontier = next;
            }
            return seen;
        };
        const rings = Math.ceil(maxKm / 11);
        let bridged = 0, seaRejected = 0;
        for (const node of this.geoNodes) {
            if (this.seaNodeIds.has(node.id)) continue;
            const adj = this.geoAdj.get(node.id);
            if (!adj || adj.length !== 1) continue;
            const own = nearOnOwnRoad(node.id);
            const cx = Math.floor(node.lng / CELL), cy = Math.floor(node.lat / CELL);
            const cands: { id: number; d: number }[] = [];
            for (let dx = -rings; dx <= rings; dx++) {
                for (let dy = -rings; dy <= rings; dy++) {
                    for (const oid of grid.get(`${cx + dx}_${cy + dy}`) ?? []) {
                        if (own.has(oid)) continue;
                        const o = this.geoNodes[oid];
                        const d = this.haversine(node.lat, node.lng, o.lat, o.lng);
                        if (d <= maxKm) cands.push({ id: oid, d });
                    }
                }
            }
            if (cands.length === 0) continue;
            cands.sort((a, b) => a.d - b.d);
            let chosen: { id: number; d: number } | null = null;
            let hitSea = false;
            for (const cand of cands) {
                const o = this.geoNodes[cand.id];
                if (this.crossesSeaLane(node.lng, node.lat, o.lng, o.lat) || this.isOverWater(node.lng, node.lat, o.lng, o.lat)) {
                    hitSea = true;
                    continue;
                }
                chosen = cand;
                break;
            }
            if (!chosen) {
                if (hitSea) seaRejected++;
                continue;
            }
            const o = this.geoNodes[chosen.id];
            const coords: [number, number][] = [[node.lng, node.lat], [o.lng, o.lat]];
            const weight = chosen.d * 1.5;
            this.geoAdj.get(node.id)!.push({ from: node.id, to: chosen.id, weight, coords });
            this.geoAdj.get(chosen.id)!.push({ from: chosen.id, to: node.id, weight, coords: [coords[1], coords[0]] });
            bridged++;
        }
        console.log(`🔗 [EndpointToRoad] 断头接路 ${bridged} 条（≤${maxKm}km），横穿海路不补 ${seaRejected} 条`);
    }

    private bridgeEndpointGaps(maxDistKm: number): void {
        // 桥接候选: degree === 1 的真实端点 (死胡同/断头路)
        const endpoints: number[] = [];
        for (const node of this.geoNodes) {
            if (this.seaNodeIds.has(node.id)) continue;   // 海路端点不许被 80km 桥接拽上岸
            const adj = this.geoAdj.get(node.id);
            if (adj && adj.length === 1) endpoints.push(node.id);
        }

        // 空间格子索引(0.1° 约 11km)
        const cellSize = 0.1;
        const grid: Map<string, number[]> = new Map();
        for (const id of endpoints) {
            const n = this.geoNodes[id];
            const key = `${Math.floor(n.lng / cellSize)}_${Math.floor(n.lat / cellSize)}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(id);
        }

        let bridged = 0;
        const searchRange = Math.ceil(maxDistKm / 11);
        const bridgedPairs = new Set<string>();
        const pairKey = (a: number, b: number) => a < b ? `${a}_${b}` : `${b}_${a}`;

        for (const id of endpoints) {
            const node = this.geoNodes[id];
            const adj = this.geoAdj.get(id);
            const connectedTo = new Set(adj?.map(e => e.to) || []);

            const cx = Math.floor(node.lng / cellSize);
            const cy = Math.floor(node.lat / cellSize);

            const candidates: {id: number, dist: number}[] = [];

            for (let dx = -searchRange; dx <= searchRange; dx++) {
                for (let dy = -searchRange; dy <= searchRange; dy++) {
                    const cellNodes = grid.get(`${cx + dx}_${cy + dy}`);
                    if (!cellNodes) continue;
                    for (const otherId of cellNodes) {
                        if (otherId === id || connectedTo.has(otherId)) continue;
                        if (bridgedPairs.has(pairKey(id, otherId))) continue;
                        const other = this.geoNodes[otherId];
                        const d = this.haversine(node.lat, node.lng, other.lat, other.lng);
                        // 🔴 [2026-09-28 陆海分开] 横穿海路航线的不当陆路补（渡海必须坐船）
                        if (d <= maxDistKm && !this.crossesSeaLane(node.lng, node.lat, other.lng, other.lat)
                            && !this.isOverWater(node.lng, node.lat, other.lng, other.lat)) {
                            candidates.push({id: otherId, dist: d});
                        }
                    }
                }
            }

            // 桥接所有在距离范围内的真实端点，不再限制 top 3
            // 因为真实端点数量稀少，全部桥接不会导致网格爆炸，但能确保长距离缺口被跨越
            for (const neighbor of candidates) {
                const bestId = neighbor.id;
                const bestDist = neighbor.dist;
                
                const other = this.geoNodes[bestId];
                const weight = bestDist * 1.2;  // 降低惩罚为1.2
                const coords: [number, number][] = [[node.lng, node.lat], [other.lng, other.lat]];
                this.geoAdj.get(id)!.push({ from: id, to: bestId, weight, coords });
                this.geoAdj.get(bestId)!.push({ from: bestId, to: id, weight, coords: [coords[1], coords[0]] });

                bridgedPairs.add(pairKey(id, bestId));
                bridged++;
            }
        }

        console.log(`🔗 [EndpointBridge] ${endpoints.length} endpoints, bridged ${bridged} pairs (≤${maxDistKm}km)`);
    }

    /**
     * 🔴 [2026-11-02 主人「有的时候两个据点之间有浅海就连不上道路，例如斯里兰卡，例如君士坦丁堡」]
     * 连通分量级浅海陆桥 & 窄海峡渡口桥接：
     * 1. 计算纯陆路连通分量（Connected Components），对不同连通分量之间距离 ≤ maxComponentGapKm（默认 45km）的节点对，
     *    在每对连通分量最窄的唯一咽喉处补桥（如斯里兰卡罗摩桥 30.8km、琼州海峡 28.7km、墨西拿海峡 10.4km、间宫海峡 8.2km 等）：
     *    - 纯陆上断口（度 ≥ 2 导致未被端点桥接覆盖）以 ×1.5 权重接通；
     *    - 跨浅海/窄海峡咽喉以 ×3.0 高权重接通（同分量内部绝不走水，跨岛/跨海峡必走最窄渡口）。
     * 2. 对同一连通分量内部隔着极窄海峡（≤ maxFerryKm，默认 12km，如达达尼尔海峡 7.3km、博斯普鲁斯海峡南口 11km）
     *    但陆路图上距离 ≥ 25 步的两岸节点，在最窄处补一条海峡渡口边（×2.5 权重），同时 12km 上限确保绝不横穿宽海湾（如伊兹密特湾/马尔马拉海）。
     */
    private bridgeShallowStraitsAndComponents(maxComponentGapKm: number = 45, maxFerryKm: number = 12): void {
        const comp = new Int32Array(this.geoNodes.length);
        let cidCounter = 0;

        for (const node of this.geoNodes) {
            if (this.seaNodeIds.has(node.id) || comp[node.id] !== 0) continue;
            const adj = this.geoAdj.get(node.id);
            if (!adj || !adj.some(e => !e.isWater && !e.isSea)) continue;
            cidCounter++;
            const queue: number[] = [node.id];
            comp[node.id] = cidCounter;
            while (queue.length > 0) {
                const u = queue.pop()!;
                for (const e of this.geoAdj.get(u) ?? []) {
                    if (e.isWater || e.isSea || this.seaNodeIds.has(e.to)) continue;
                    if (comp[e.to] === 0) {
                        comp[e.to] = cidCounter;
                        queue.push(e.to);
                    }
                }
            }
        }

        // 1) 不同连通分量之间：找每对分量在 ≤ maxComponentGapKm 内的最短节点对
        const CELL = 0.2;
        const cgrid = new Map<string, number[]>();
        for (const node of this.geoNodes) {
            if (comp[node.id] === 0) continue;
            const k = `${Math.floor(node.lng / CELL)}_${Math.floor(node.lat / CELL)}`;
            let b = cgrid.get(k);
            if (!b) { b = []; cgrid.set(k, b); }
            b.push(node.id);
        }

        const rings = Math.ceil(maxComponentGapKm / 22);
        const compBest = new Map<string, { d: number; u: number; v: number }>();
        for (const node of this.geoNodes) {
            const c1 = comp[node.id];
            if (c1 === 0) continue;
            const cx = Math.floor(node.lng / CELL), cy = Math.floor(node.lat / CELL);
            for (let dx = -rings; dx <= rings; dx++) {
                for (let dy = -rings; dy <= rings; dy++) {
                    const bucket = cgrid.get(`${cx + dx}_${cy + dy}`);
                    if (!bucket) continue;
                    for (const oid of bucket) {
                        const c2 = comp[oid];
                        if (c2 === 0 || c1 >= c2) continue;
                        const o = this.geoNodes[oid];
                        const d = this.haversine(node.lat, node.lng, o.lat, o.lng);
                        if (d <= maxComponentGapKm) {
                            const pk = `${c1}_${c2}`;
                            const prev = compBest.get(pk);
                            if (!prev || d < prev.d) compBest.set(pk, { d, u: node.id, v: oid });
                        }
                    }
                }
            }
        }

        let compLandBridged = 0;
        let compStraitBridged = 0;
        for (const { d, u, v } of compBest.values()) {
            const nu = this.geoNodes[u], nv = this.geoNodes[v];
            const overWater = this.isOverWater(nu.lng, nu.lat, nv.lng, nv.lat) || this.crossesSeaLane(nu.lng, nu.lat, nv.lng, nv.lat);
            const penalty = overWater ? 3.0 : 1.5;
            const weight = d * penalty;
            if (!isFinite(weight) || weight < 0.01) continue;
            const coords: [number, number][] = [[nu.lng, nu.lat], [nv.lng, nv.lat]];
            this.geoAdj.get(u)!.push({ from: u, to: v, weight, coords });
            this.geoAdj.get(v)!.push({ from: v, to: u, weight, coords: [coords[1], coords[0]] });
            if (overWater) compStraitBridged++;
            else compLandBridged++;
        }

        // 2) 同一连通分量内部的极窄海峡渡口（≤ maxFerryKm，如达达尼尔海峡、博斯普鲁斯南口）
        const FCELL = 0.1;
        const fgrid = new Map<string, number[]>();
        for (const node of this.geoNodes) {
            if (comp[node.id] === 0) continue;
            const k = `${Math.floor(node.lng / FCELL)}_${Math.floor(node.lat / FCELL)}`;
            let b = fgrid.get(k);
            if (!b) { b = []; fgrid.set(k, b); }
            b.push(node.id);
        }

        const nearOnLandRoad = (from: number, maxSteps: number): Set<number> => {
            const seen = new Set<number>([from]);
            let frontier = [from];
            for (let step = 0; step < maxSteps && frontier.length > 0; step++) {
                const next: number[] = [];
                for (const x of frontier) {
                    for (const e of this.geoAdj.get(x) ?? []) {
                        if (!e.isWater && !e.isSea && !seen.has(e.to)) {
                            seen.add(e.to);
                            next.push(e.to);
                        }
                    }
                }
                frontier = next;
            }
            return seen;
        };

        const ferryCands: { d: number; u: number; v: number }[] = [];
        for (const node of this.geoNodes) {
            if (comp[node.id] === 0) continue;
            const landDeg = (this.geoAdj.get(node.id) ?? []).filter(e => !e.isWater && !e.isSea).length;
            if (landDeg !== 1) continue;
            const cx = Math.floor(node.lng / FCELL), cy = Math.floor(node.lat / FCELL);
            let best: { d: number; oid: number } | null = null;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (const oid of fgrid.get(`${cx + dx}_${cy + dy}`) ?? []) {
                        if (oid === node.id) continue;
                        const o = this.geoNodes[oid];
                        const d = this.haversine(node.lat, node.lng, o.lat, o.lng);
                        if (d <= maxFerryKm && (!best || d < best.d)) {
                            if (this.isOverWater(node.lng, node.lat, o.lng, o.lat) || this.crossesSeaLane(node.lng, node.lat, o.lng, o.lat)) {
                                best = { d, oid };
                            }
                        }
                    }
                }
            }
            if (best) ferryCands.push({ d: best.d, u: node.id, v: best.oid });
        }

        ferryCands.sort((a, b) => a.d - b.d);
        let narrowFerryCount = 0;
        for (const { d, u, v } of ferryCands) {
            const own = nearOnLandRoad(u, 25);
            if (own.has(v)) continue;
            const nu = this.geoNodes[u], nv = this.geoNodes[v];
            const weight = d * 2.5;
            if (!isFinite(weight) || weight < 0.01) continue;
            const coords: [number, number][] = [[nu.lng, nu.lat], [nv.lng, nv.lat]];
            this.geoAdj.get(u)!.push({ from: u, to: v, weight, coords });
            this.geoAdj.get(v)!.push({ from: v, to: u, weight, coords: [coords[1], coords[0]] });
            narrowFerryCount++;
        }

        console.log(`🌉 [StraitBridge] 跨海/浅海连通桥 ${compStraitBridged} 处 (≤${maxComponentGapKm}km), 陆路分量断口 ${compLandBridged} 处, 窄海峡渡口 ${narrowFerryCount} 处 (≤${maxFerryKm}km)`);
    }

    // ===== 在 GeoJSON 图上寻路 =====

    private generatePath(): void {
        if (!this.startCityId || !this.endCityId) return;

        const startCity = findEndpoint(this.startCityId);
        const endCity = findEndpoint(this.endCityId);
        if (!startCity || !endCity) {
            this.setStatus('❌ 找不到端点数据（据点或战场）');
            return;
        }

        // === Debug: 图状态 ===
        console.log(`🛤️ [PathGen] Graph: ${this.geoNodes.length} nodes, built=${this.geoGraphBuilt}`);
        console.log(`🛤️ [PathGen] Start: ${startCity.name} (${startCity.lat}, ${startCity.lng})`);
        console.log(`🛤️ [PathGen] End: ${endCity.name} (${endCity.lat}, ${endCity.lng})`);

        if (!this.geoGraphBuilt || this.geoNodes.length === 0) {
            this.setStatus('⚠️ 路网图未加载完成，请稍后再试');
            this.clearCitySelection();
            return;
        }

        // 找最近的图节点（略多几个，便于接到不同走廊）
        const startCandidates = this.findAccessGeoNodes(startCity.lat, startCity.lng, 4);
        let endCandidates = this.findAccessGeoNodes(endCity.lat, endCity.lng, 4);

        // [FIX] 不再注入项目已有道路，不再做分支合流
        // 纯粹在 Natural Earth 路网上寻最短路径
        console.log(`🛤️ [PathGen] Start candidates: ${startCandidates.length}, End candidates: ${endCandidates.length}`);

        const candidatesList = this.buildRouteCandidates(startCity, endCity);
        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);

        // 🔴 [2026-08-28 主人「道路经常绕远」] 选路改成**按实际里程取最短**。
        //    改前是「按评分排序后取第一条绕行比合格的」，而评分给水路 +22~+40 的偏好、
        //    合格线又松到 6.0x（<150km），于是一条 2.5x 的沿河路能盖过 1.2x 的陆路直连 —— 这就是绕远的来源。
        //    现在：非直线候选里取最短的那条；只有一条候选都没有时才落到直线兜底。
        //    其余候选仍留在 🔀 切换路径里，想要沿河/沿海走法随时切。
        let bestPath: RouteCandidate | null = null;
        let bestIdx = 0;
        let bestLen = Infinity;
        // 🔴 [2026-09-28] 用户点了途经点 → 就用途经点路线，不再按「最短」挑
        const viaIdx = candidatesList.findIndex(c => c.variantReason === '途经点');
        if (viaIdx >= 0) { bestPath = candidatesList[viaIdx]; bestIdx = viaIdx; bestLen = -1; }
        for (let i = 0; i < candidatesList.length && viaIdx < 0; i++) {
            const candidate = candidatesList[i];
            if (candidate.isManualStraightLine) continue;
            const len = candidate.totalDistance || this.calculatePathLength(candidate.coordinates);
            if (len < bestLen) {
                bestLen = len;
                bestPath = candidate;
                bestIdx = i;
            }
        }
        if (!bestPath) {
            const straightIdx = candidatesList.findIndex(c => c.mode === 'straight');
            bestPath = straightIdx >= 0 ? candidatesList[straightIdx] : (candidatesList[0] ?? null);
            bestIdx = straightIdx >= 0 ? straightIdx : 0;
        }

        this.pathCandidates = candidatesList;
        this.currentCandidateIdx = bestIdx;

        if (this.switchRouteBtn) {
            this.switchRouteBtn.style.visibility = candidatesList.length > 1 ? 'visible' : 'hidden';
        }

        let rawCoords: [number, number][] = [];
        let distStr = '';

        if (bestPath && !bestPath.isManualStraightLine) {
            const actualPathLength = this.calculatePathLength(bestPath.coordinates);
            const detourRatio = actualPathLength / Math.max(1, directDist);

            console.log(`📏 [PathGen] 直线距离: ${directDist.toFixed(0)}km, 实际路径: ${actualPathLength.toFixed(0)}km, 绕路比: ${detourRatio.toFixed(2)}x, 模式: ${bestPath.label}`);

            rawCoords.push([startCity.lng, startCity.lat]);
            for (const coord of bestPath.coordinates) {
                rawCoords.push(coord);
            }
            rawCoords.push([endCity.lng, endCity.lat]);
            distStr = `${actualPathLength.toFixed(0)}km ${bestPath.label}`;

        } else if (bestPath?.isManualStraightLine) {
            for (const coord of bestPath.coordinates) {
                rawCoords.push(coord);
            }
            distStr = `${bestPath.totalDistance.toFixed(0)}km ${bestPath.label}`;

        } else {
            // ⚠️ 尝试智能桥接 (连接断开的路网孤岛)
            console.warn(`[PathGen] Direct path failed. Trying smart bridging...`);
            const bridgedPath = (startCandidates.length > 0 && endCandidates.length > 0)
                ? this.findSmartBridgedPath(
                    startCandidates.map(n => n.id),
                    endCandidates.map(n => n.id),
                    Math.max(200, directDist * 4.5)
                )
                : null;

            if (bridgedPath) {
                console.log(`✅ [PathGen] Found bridged path! Off-road: ${bridgedPath.bridgeDist.toFixed(1)}km`);
                rawCoords.push([startCity.lng, startCity.lat]);
                for (const coord of bridgedPath.coordinates) {
                    rawCoords.push(coord);
                }
                rawCoords.push([endCity.lng, endCity.lat]);
                distStr = `${bridgedPath.totalDistance.toFixed(0)}km (含智能桥接)`;
            } else {
                // ❌ 彻底失败，回退直线
                console.warn(`❌ [PathGen] Bridge failed. Fallback to straight line.`);
                rawCoords = this.generateStraightLinePath(
                    startCity.lat, startCity.lng,
                    endCity.lat, endCity.lng
                );
                const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
                distStr = `${directDist.toFixed(0)}km 直线(请微调)`;
            }
        }

        // === 去折角 + 抽稀 + 清理周边 ===
        const cleaned = removeBacktracks(rawCoords, 80);
        let simplified = this.simplifyCoords(cleaned, 0.002); // ~200m 精度
        simplified = this.simplifyCityVicinity(simplified, startCity, endCity, 15);

        // [FIX] 不再吸附到已有道路，纯粹走 Natural Earth 路网最短路
        const finalCoords = simplified;

        // [FIX] 创建新道路前，删除两个城市之间已有的所有路线（防止产生重复乱线）

        const duplicates = VECTOR_ROAD_DATA.features.filter(f =>

            (f.properties.startConnection === this.startCityId && f.properties.endConnection === this.endCityId) ||

            (f.properties.startConnection === this.endCityId && f.properties.endConnection === this.startCityId)

        );

        for (const dup of duplicates) {

            console.log(`[PathGen] 删除重复旧路线: ${dup.properties.id}`);

            roadRegistry.removeVectorRoad(dup.properties.id);

            this.removeRoadLayers(dup.properties.id);

        }

        // 创建新道路
        const roadName = `${endpointLabel(startCity)}-${endpointLabel(endCity)}`;
        const roadId = `road_${this.startCityId}_${this.endCityId}_${Date.now()}`;

        // 含海路段的路要标记：RoadRegistry 靠这个跳过 smoothRoad（平滑会把海上顶点推上岸）
        const hasSeaLeg = bestPath?.mode === 'sea_land';
        const newFeature: VectorRoadFeature = {
            type: 'Feature',
            properties: {
                name: roadName,
                type: 'road',
                id: roadId,
                startConnection: this.startCityId!,
                endConnection: this.endCityId!,
                ...(hasSeaLeg ? { hasSeaLeg: true } as { hasSeaLeg?: boolean } : {})
            },
            geometry: {
                type: 'LineString',
                coordinates: finalCoords
            }
        };

        roadRegistry.addVectorRoad(newFeature);
        this.updateRoadSelect();
        this.renderRoad(roadId);
        this.selectRoad(roadId);

        const seaTag = hasSeaLeg ? '⚓水陆联运 · ' : '';
        this.setStatus(`✅ ${roadName} (${seaTag}${distStr}, ${finalCoords.length}点) | 🔴拖拽微调 · 🟡点击加节点 · 右键删节点`);
        this.clearCitySelection();
        // 保持 candidatesList 缓存，因为 clearCitySelection 刚刚清空了 this.pathCandidates
        this.pathCandidates = finalCoords.length > 2 ? candidatesList : [];
        if (this.switchRouteBtn && this.pathCandidates.length > 1) {
            this.switchRouteBtn.style.visibility = 'visible';
            this.selectedRoadId = roadId; // 保持选定状态，以便切换
        }
    }

    /**
     * 循环切换当前的候选路径（按固定模式顺序：优先水路 → 优先陆路 → 直线）
     */
    private cycleCandidates(): void {
        if (!this.selectedRoadId) return;
        if (this.pathCandidates.length === 0) {
            const ok = this.ensureCandidatesComputed();
            if (!ok) {
                this.setStatus('⚠ 算不出候选 (该道路缺起终点)');
                return;
            }
            if (this.pathCandidates.length <= 1) {
                const only = this.pathCandidates[0];
                if (only?.mode === 'straight') {
                    this.setStatus(`⚠ NE 路网在此断段, 仅「${only.label}」可用`);
                } else {
                    this.setStatus(`✅ 该道路只有 1 条候选 (${only?.label}), 无法切换`);
                }
                return;
            }
            // 计算完直接往下走，第一次点击就立即切到下一条走廊（不再空点一次）
        }
        if (this.pathCandidates.length <= 1) return;

        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === this.selectedRoadId);
        if (!feature) return;

        const startCityId = feature.properties.startConnection;
        const endCityId = feature.properties.endConnection;
        const startCity = findEndpoint(startCityId);
        const endCity = findEndpoint(endCityId);
        if (!startCity || !endCity) return;

        const nextIdx = (this.currentCandidateIdx + 1) % this.pathCandidates.length;
        const candidate = this.pathCandidates[nextIdx];
        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
        const switchDetourLimit = VectorRoadEditor.MAX_DETOUR_RATIO * 1.4;

        const simplified = this.applyCandidateGeometry(candidate, startCity, endCity);
        if (!simplified || simplified.length < 2) {
            this.setStatus(`⚠ 候选几何无效，无法切换`);
            return;
        }

        this.currentCandidateIdx = nextIdx;
        feature.geometry.coordinates = simplified;
        roadRegistry.updateVectorRoadCoordinates(this.selectedRoadId, simplified);
        // 切到/切走「水陆联运」时同步标记，否则含海段的路会被 RoadRegistry 平滑推上岸
        // ⚠ VectorRoadData.ts 是编辑器机器生成的，旧版编辑器一保存就会把新字段从接口里抹掉，
        //   所以这里一律用结构类型断言读写，别让它把整个工程的编译带崩。
        const props = feature.properties as { hasSeaLeg?: boolean };
        if (candidate.mode === 'sea_land') props.hasSeaLeg = true;
        else delete props.hasSeaLeg;

        this.renderRoad(this.selectedRoadId);
        this.showControlPoints(this.selectedRoadId);
        this.panMapToRoad(simplified);

        let warn = '';
        if (candidate.mode !== 'straight') {
            const pathLen = this.calculatePathLength(simplified);
            const detourRatio = pathLen / Math.max(1, directDist);
            if (detourRatio > switchDetourLimit) {
                warn = ` ⚠绕行${detourRatio.toFixed(2)}x`;
            }
        }

        const roadName = `${endpointLabel(startCity)}-${endpointLabel(endCity)}`;
        this.setStatus(`${this.formatCandidateStatus(candidate, nextIdx, this.pathCandidates.length)} | ${roadName}${warn}`);
    }

    /**
     * 回退方案: 生成直线路径，每 ~50km 插入一个中间点。
     */
    private generateStraightLinePath(
        lat1: number, lng1: number, lat2: number, lng2: number
    ): [number, number][] {
        const dist = this.haversine(lat1, lng1, lat2, lng2);
        const numSegments = Math.max(2, Math.ceil(dist / 50));
        const coords: [number, number][] = [];

        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const lat = lat1 + (lat2 - lat1) * t;
            const lng = lng1 + (lng2 - lng1) * t;
            coords.push([lng, lat]);
        }

        return coords;
    }

    // ===== Catmull-Rom 样条平滑 =====

    /**
     * Catmull-Rom 样条插值: 在控制点之间生成平滑曲线。
     * 比 Bézier 更简单，且曲线必定经过控制点。
     */
    private catmullRomSmooth(points: [number, number][], segmentsPerCurve: number): [number, number][] {
        if (points.length < 3) return points;

        const result: [number, number][] = [points[0]];

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[Math.min(points.length - 1, i + 1)];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            for (let t = 1; t <= segmentsPerCurve; t++) {
                const s = t / segmentsPerCurve;
                const s2 = s * s;
                const s3 = s2 * s;

                const lng = 0.5 * (
                    (2 * p1[0]) +
                    (-p0[0] + p2[0]) * s +
                    (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 +
                    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3
                );
                const lat = 0.5 * (
                    (2 * p1[1]) +
                    (-p0[1] + p2[1]) * s +
                    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 +
                    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3
                );

                result.push([lng, lat]);
            }
        }

        return result;
    }

    // ===== 坐标抽稀 (Douglas-Peucker 简化版) =====

    private simplifyCoords(coords: [number, number][], tolerance: number): [number, number][] {
        if (coords.length <= 2) return coords;

        // 找最远点
        let maxDist = 0;
        let maxIdx = 0;
        const start = coords[0];
        const end = coords[coords.length - 1];

        for (let i = 1; i < coords.length - 1; i++) {
            const dist = this.pointToLineDist(coords[i], start, end);
            if (dist > maxDist) {
                maxDist = dist;
                maxIdx = i;
            }
        }

        if (maxDist > tolerance) {
            const left = this.simplifyCoords(coords.slice(0, maxIdx + 1), tolerance);
            const right = this.simplifyCoords(coords.slice(maxIdx), tolerance);
            return [...left.slice(0, -1), ...right];
        } else {
            return [start, end];
        }
    }

    private pointToLineDist(p: [number, number], a: [number, number], b: [number, number]): number {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2);

        let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const projX = a[0] + t * dx;
        const projY = a[1] + t * dy;
        return Math.sqrt((p[0] - projX) ** 2 + (p[1] - projY) ** 2);
    }

    /**
     * 清理据点周边复杂的现代环线 (City Vicinity Simplification)
     * 移除城市半径内的错综复杂路段，直接用一条从城中心发出的直线连接到该半径外的网络边缘，
     * 避免城门外出现类似现代立交桥和环城高速的蜘蛛网形状。
     */
    private simplifyCityVicinity(coords: [number, number][], startCity: any, endCity: any, radiusKm: number = 15): [number, number][] {
        if (coords.length <= 2) return coords;

        const result: [number, number][] = [];
        
        let firstOutsideIdx = 1;
        for (let i = 1; i < coords.length - 1; i++) {
            const dist = this.haversine(startCity.lat, startCity.lng, coords[i][1], coords[i][0]);
            if (dist > radiusKm) {
                firstOutsideIdx = i;
                break;
            }
        }

        let lastOutsideIdx = coords.length - 2;
        for (let i = coords.length - 2; i >= 1; i--) {
            const dist = this.haversine(endCity.lat, endCity.lng, coords[i][1], coords[i][0]);
            if (dist > radiusKm) {
                lastOutsideIdx = i;
                break;
            }
        }

        // 删掉半径内的点等于从城直接拉直线过去：这条直线跨海就不删（沿岸绕湾的路必须留着）
        // 从远到近退一步找最远且不跨水、不穿航线的截断点，既清掉城内折角又绝不拉成穿海直线
        const [sLng, sLat] = coords[0];
        const [eLng, eLat] = coords[coords.length - 1];
        while (firstOutsideIdx > 1 && (
            this.isOverWater(sLng, sLat, coords[firstOutsideIdx][0], coords[firstOutsideIdx][1]) ||
            this.crossesSeaLane(sLng, sLat, coords[firstOutsideIdx][0], coords[firstOutsideIdx][1])
        )) {
            firstOutsideIdx--;
        }
        while (lastOutsideIdx < coords.length - 2 && (
            this.isOverWater(coords[lastOutsideIdx][0], coords[lastOutsideIdx][1], eLng, eLat) ||
            this.crossesSeaLane(coords[lastOutsideIdx][0], coords[lastOutsideIdx][1], eLng, eLat)
        )) {
            lastOutsideIdx++;
        }

        // 如果路径非常短，或者起终点的清理半径发生重叠，保留首尾
        if (firstOutsideIdx > lastOutsideIdx) {
            return (this.isOverWater(sLng, sLat, eLng, eLat) || this.crossesSeaLane(sLng, sLat, eLng, eLat))
                ? coords
                : [coords[0], coords[coords.length - 1]];
        }

        result.push(coords[0]);
        for (let i = firstOutsideIdx; i <= lastOutsideIdx; i++) {
            result.push(coords[i]);
        }
        result.push(coords[coords.length - 1]);

        return result;
    }

    // ===== 智能桥接算法 (Smart Bridging) =====

    /**
     * 当直连失败时，寻找两个断开路网组件之间最短的"桥"。
     * 1. BFS 找到起点能到达的所有节点 (Component A)
     * 2. BFS 找到终点能到达的所有节点 (Component B)
     * 3. 空间网格加速，寻找 Component A 和 B 之间距离最近的节点对
     * 4. 路径 = Start -> ... -> NodeA -> (Bridge) -> NodeB -> ... -> End
     */
    private findSmartBridgedPath(
        startIds: number | number[],
        endIds: number | number[],
        maxExploreKm?: number
    ): { coordinates: [number, number][]; totalDistance: number; bridgeDist: number; edgeKeys: Set<string> } | null {
        const MAX_BRIDGE_KM = 50;
        // 1. 获取两端的可达区域（不走海路边）
        const startReachable = this.getAllReachableNodes(startIds, maxExploreKm);
        const endReachable = this.getAllReachableNodes(endIds, maxExploreKm);

        if (startReachable.size === 0 || endReachable.size === 0) return null;

        // 2. 建立 End Component 的空间网格索引 (0.1度 ~ 11km)
        const cellSize = 0.1;
        const grid: Map<string, number[]> = new Map();

        for (const nodeId of endReachable.keys()) {
            const node = this.geoNodes[nodeId];
            const key = `${Math.floor(node.lat / cellSize)}_${Math.floor(node.lng / cellSize)}`;
            let bucket = grid.get(key);
            if (!bucket) { bucket = []; grid.set(key, bucket); }
            bucket.push(nodeId);
        }

        // 3. 遍历 Start Component，寻找 ≤50km 且不跨海/水面的最优桥接节点对
        const rings = Math.ceil(MAX_BRIDGE_KM / 11);
        let bestPair: { u: number; v: number; dist: number } | null = null;
        let minTotalPenalty = Infinity;

        for (const [uId, uInfo] of startReachable) {
            if (uInfo.dist >= minTotalPenalty) continue;
            const uNode = this.geoNodes[uId];
            const cx = Math.floor(uNode.lat / cellSize);
            const cy = Math.floor(uNode.lng / cellSize);

            for (let dx = -rings; dx <= rings; dx++) {
                for (let dy = -rings; dy <= rings; dy++) {
                    const targetNodes = grid.get(`${cx + dx}_${cy + dy}`);
                    if (!targetNodes) continue;

                    for (const vId of targetNodes) {
                        if (uId === vId) continue;
                        const vInfo = endReachable.get(vId)!;
                        if (uInfo.dist + vInfo.dist >= minTotalPenalty) continue;

                        const vNode = this.geoNodes[vId];
                        const dist = this.haversine(uNode.lat, uNode.lng, vNode.lat, vNode.lng);
                        if (dist > MAX_BRIDGE_KM || dist < 0.05) continue;

                        // 代价 = 起点到u距离 + 桥接距离*1.5 + v到终点距离
                        const totalPenalty = uInfo.dist + (dist * 1.5) + vInfo.dist;
                        if (totalPenalty >= minTotalPenalty) continue;

                        // 陆路桥接禁穿海路航线与水面
                        if (this.crossesSeaLane(uNode.lng, uNode.lat, vNode.lng, vNode.lat)
                            || this.isOverWater(uNode.lng, uNode.lat, vNode.lng, vNode.lat)) {
                            continue;
                        }

                        minTotalPenalty = totalPenalty;
                        bestPair = { u: uId, v: vId, dist };
                    }
                }
            }
        }

        if (!bestPair) return null;

        // 4. 重建路径（保留原始边折线坐标与 edgeKeys）
        const startSide = this.reconstructPath(startReachable, bestPair.u);
        const endSide = this.reconstructPath(endReachable, bestPair.v);
        const pathEndReversed = endSide.coords.slice().reverse();

        const coords: [number, number][] = [...startSide.coords, ...pathEndReversed];
        const edgeKeys = new Set<string>([...startSide.edgeKeys, ...endSide.edgeKeys]);

        return {
            coordinates: coords,
            totalDistance: this.calculatePathLength(coords),
            bridgeDist: bestPair.dist,
            edgeKeys,
        };
    }

    private getAllReachableNodes(
        startIds: number | number[],
        maxExploreKm: number = Infinity
    ): Map<number, { dist: number; prev: number; edge?: GeoEdge }> {
        const sources = Array.isArray(startIds) ? startIds : [startIds];
        const dists = new Map<number, { dist: number; prev: number; edge?: GeoEdge }>();
        const heap: { id: number; dist: number }[] = [];

        const heapPush = (item: { id: number; dist: number }) => {
            heap.push(item);
            let i = heap.length - 1;
            while (i > 0) {
                const parent = (i - 1) >> 1;
                if (heap[parent].dist <= heap[i].dist) break;
                [heap[parent], heap[i]] = [heap[i], heap[parent]];
                i = parent;
            }
        };
        const heapPop = (): { id: number; dist: number } | undefined => {
            if (heap.length === 0) return undefined;
            const top = heap[0];
            const last = heap.pop()!;
            if (heap.length > 0) {
                heap[0] = last;
                let i = 0;
                while (true) {
                    let smallest = i;
                    const left = 2 * i + 1, right = 2 * i + 2;
                    if (left < heap.length && heap[left].dist < heap[smallest].dist) smallest = left;
                    if (right < heap.length && heap[right].dist < heap[smallest].dist) smallest = right;
                    if (smallest === i) break;
                    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
                    i = smallest;
                }
            }
            return top;
        };

        for (const s of sources) {
            if (s == null || s < 0 || this.seaNodeIds.has(s)) continue;
            dists.set(s, { dist: 0, prev: -1 });
            heapPush({ id: s, dist: 0 });
        }

        while (heap.length > 0) {
            const { id: u, dist: d } = heapPop()!;
            if (d > (dists.get(u)?.dist ?? Infinity)) continue;
            if (d > maxExploreKm) continue;

            const adj = this.geoAdj.get(u) || [];
            for (const edge of adj) {
                if (edge.isSea || this.seaNodeIds.has(edge.to)) continue;
                const v = edge.to;
                const newDist = d + edge.weight;
                if (newDist <= maxExploreKm && newDist < (dists.get(v)?.dist ?? Infinity)) {
                    dists.set(v, { dist: newDist, prev: u, edge });
                    heapPush({ id: v, dist: newDist });
                }
            }
        }
        return dists;
    }

    private reconstructPath(
        map: Map<number, { prev: number; edge?: GeoEdge }>,
        targetId: number
    ): { coords: [number, number][]; edgeKeys: Set<string> } {
        const edgeList: GeoEdge[] = [];
        let curr = targetId;
        while (curr !== -1) {
            const info = map.get(curr);
            if (!info || info.prev === -1 || !info.edge) break;
            edgeList.unshift(info.edge);
            curr = info.prev;
        }
        if (edgeList.length === 0) {
            const node = this.geoNodes[targetId];
            return { coords: node ? [[node.lng, node.lat]] : [], edgeKeys: new Set() };
        }
        const coords: [number, number][] = [];
        const edgeKeys = new Set<string>();
        for (let i = 0; i < edgeList.length; i++) {
            const edge = edgeList[i];
            const startIdx = i === 0 ? 0 : 1;
            for (let j = startIdx; j < edge.coords.length; j++) {
                coords.push(edge.coords[j]);
            }
            edgeKeys.add(`${Math.min(edge.from, edge.to)}_${Math.max(edge.from, edge.to)}`);
        }
        return { coords, edgeKeys };
    }

    /** 水陆偏好权重系数（混合图内偏好，非 forbidWater） */
    private static readonly WATER_PREFERRED_WATER_FACTOR = 0.82;
    private static readonly WATER_PREFERRED_LAND_FACTOR = 1.18;
    private static readonly LAND_PREFERRED_WATER_FACTOR = 1.18;
    private static readonly LAND_PREFERRED_LAND_FACTOR = 0.82;

    /**
     * 起点/终点可以各传一组节点：多源多汇一次跑完，等价于「每对起终点各跑一次再取最短」。
     * 🔴 [2026-10-28 主人「计算道路会卡」] 原来每轮 6×6=36 次单源单汇，实测开封-杭州一轮要近 0.9 秒。
     */
    private dijkstraGeo(
        startIds: number | number[],
        endIds: number | number[],
        options?: {
            penaltyEdges?: Set<string>;
            penaltyFactor?: number;
            forbidWater?: boolean;
            allowSea?: boolean;
            seaFactor?: number;
            routePreference?: 'water_first' | 'land_first';
            lateralBias?: { startLat: number; startLng: number; endLat: number; endLng: number; side: 'left' | 'right' };
        }
    ): {
        coordinates: [number, number][];
        totalDistance: number;
        edgeKeys: Set<string>;
    } | null {
        const sources = Array.isArray(startIds) ? startIds : [startIds];
        const targets = new Set(Array.isArray(endIds) ? endIds : [endIds]);
        if (sources.length === 0 || targets.size === 0) return null;
        const dist: Map<number, number> = new Map();
        const prev: Map<number, { nodeId: number; edge: GeoEdge }> = new Map();
        const visited: Set<number> = new Set();

        // 预计算左右侧翼方位走廊法向量（单位 km）
        const lb = options?.lateralBias;
        let lbCosMid = 1, lbNx = 0, lbNy = 0, lbScaleKm = 30;
        if (lb) {
            lbCosMid = Math.max(0.2, Math.cos(((lb.startLat + lb.endLat) * 0.5) * Math.PI / 180));
            const ax = (lb.endLng - lb.startLng) * lbCosMid * 111;
            const ay = (lb.endLat - lb.startLat) * 111;
            const axisLen = Math.hypot(ax, ay) || 1;
            const sign = lb.side === 'left' ? 1 : -1;
            lbNx = (-ay / axisLen) * sign;
            lbNy = (ax / axisLen) * sign;
            lbScaleKm = Math.max(20, axisLen * 0.22);
        }

        // 二叉最小堆 (Binary Min-Heap) — O(log n) 插入/提取
        const heap: { nodeId: number; dist: number }[] = [];
        const heapPush = (item: { nodeId: number; dist: number }) => {
            heap.push(item);
            let i = heap.length - 1;
            while (i > 0) {
                const parent = (i - 1) >> 1;
                if (heap[parent].dist <= heap[i].dist) break;
                [heap[parent], heap[i]] = [heap[i], heap[parent]];
                i = parent;
            }
        };
        const heapPop = (): { nodeId: number; dist: number } | undefined => {
            if (heap.length === 0) return undefined;
            const top = heap[0];
            const last = heap.pop()!;
            if (heap.length > 0) {
                heap[0] = last;
                let i = 0;
                while (true) {
                    let smallest = i;
                    const left = 2 * i + 1, right = 2 * i + 2;
                    if (left < heap.length && heap[left].dist < heap[smallest].dist) smallest = left;
                    if (right < heap.length && heap[right].dist < heap[smallest].dist) smallest = right;
                    if (smallest === i) break;
                    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
                    i = smallest;
                }
            }
            return top;
        };

        for (const s of sources) {
            dist.set(s, 0);
            heapPush({ nodeId: s, dist: 0 });
        }

        let endId = -1;
        while (heap.length > 0) {
            const item = heapPop()!;
            const current = item.nodeId;

            if (visited.has(current)) continue;
            visited.add(current);

            // 起终点吸到同一节点时那个点没有路可言，跳过它继续找别的终点
            if (targets.has(current) && prev.has(current)) { endId = current; break; }

            const edges = this.geoAdj.get(current) || [];
            for (const edge of edges) {
                if (visited.has(edge.to)) continue;
                if (options?.forbidWater && edge.isWater) continue;
                // 海路默认关闭：只有 sea_land 模式显式放行，其余候选全是纯陆路/内河，行为与改前一致
                if (edge.isSea && !options?.allowSea) continue;

                let weight = edge.weight;
                if (edge.isSea) weight *= options?.seaFactor ?? VectorRoadEditor.SEA_LEG_FACTOR;
                if (!options?.forbidWater && options?.routePreference) {
                    if (options.routePreference === 'water_first') {
                        weight *= edge.isWater
                            ? VectorRoadEditor.WATER_PREFERRED_WATER_FACTOR
                            : VectorRoadEditor.WATER_PREFERRED_LAND_FACTOR;
                    } else if (options.routePreference === 'land_first') {
                        weight *= edge.isWater
                            ? VectorRoadEditor.LAND_PREFERRED_WATER_FACTOR
                            : VectorRoadEditor.LAND_PREFERRED_LAND_FACTOR;
                    }
                }
                const edgeKey = `${Math.min(current, edge.to)}_${Math.max(current, edge.to)}`;
                if (options?.penaltyEdges && options.penaltyEdges.has(edgeKey)) {
                    weight *= (options?.penaltyFactor || 5.0);
                }
                if (lb && !edge.isSea) {
                    const nu = this.geoNodes[current];
                    const nv = this.geoNodes[edge.to];
                    const mLng = (nu.lng + nv.lng) * 0.5;
                    const mLat = (nu.lat + nv.lat) * 0.5;
                    const offsetKm = ((mLng - lb.startLng) * lbCosMid * 111) * lbNx + ((mLat - lb.startLat) * 111) * lbNy;
                    const s = Math.max(-1.5, Math.min(1.5, offsetKm / lbScaleKm));
                    if (s > 0) {
                        weight *= (1 - 0.22 * Math.min(1, s));
                    } else {
                        weight *= (1 + 0.50 * Math.min(1.5, -s + 0.20));
                    }
                }

                const newDist = (dist.get(current) ?? Infinity) + weight;
                if (newDist < (dist.get(edge.to) ?? Infinity)) {
                    dist.set(edge.to, newDist);
                    prev.set(edge.to, { nodeId: current, edge });
                    heapPush({ nodeId: edge.to, dist: newDist });
                }
            }
        }

        if (endId < 0) {
            // DEBUG: 第一次失败时记录详情
            if (!this._dijkstraDebugLogged) {
                this._dijkstraDebugLogged = true;
                const startEdges = this.geoAdj.get(sources[0]) || [];
                const nanEdges = startEdges.filter(e => !isFinite(e.weight));
                console.warn(`❌ [Dijkstra] FAILED: visited ${visited.size}/${this.geoNodes.length} nodes, start=${sources[0]} has ${startEdges.length} edges (${nanEdges.length} NaN), end=${[...targets][0]}`);
            }
            return null;
        }

        // 重建路径
        const edgeList: GeoEdge[] = [];
        let current = endId;
        while (prev.has(current)) {
            const { nodeId: prevNode, edge } = prev.get(current)!;
            edgeList.unshift(edge);
            current = prevNode;
        }

        // 合并坐标并收集 edgeKeys
        const coordinates: [number, number][] = [];
        const edgeKeys = new Set<string>();

        for (let i = 0; i < edgeList.length; i++) {
            const edge = edgeList[i];
            const edgeCoords = edge.coords;
            const startIdx = i === 0 ? 0 : 1; // 跳过重复端点
            for (let j = startIdx; j < edgeCoords.length; j++) {
                coordinates.push(edgeCoords[j]);
            }
            edgeKeys.add(`${Math.min(edge.from, edge.to)}_${Math.max(edge.from, edge.to)}`);
        }

        return { coordinates, totalDistance: dist.get(endId) || 0, edgeKeys };
    }

    /** 取离城市最近且接有水路边的图节点（限定最大半径，避免乱接） */
    private findNearestWaterNode(lat: number, lng: number, maxDistKm: number = 140): number | null {
        let bestId: number | null = null;
        let bestDist = Infinity;
        for (const node of this.geoNodes) {
            const edges = this.geoAdj.get(node.id) || [];
            if (!edges.some(e => !!e.isWater)) continue;
            const d = this.haversine(lat, lng, node.lat, node.lng);
            if (d <= maxDistKm && d < bestDist) {
                bestDist = d;
                bestId = node.id;
            }
        }
        return bestId;
    }

    /**
     * 轻量兜底：常规候选断网时，优先尝试“城市接入最近河道节点 + 河道主干连接”。
     * 目标：避免只有直线，并保持计算开销可控。
     */
    private buildWaterLinkedFallback(startCity: any, endCity: any): { coordinates: [number, number][]; totalDistance: number; edgeKeys: Set<string> } | null {
        const startWaterNode = this.findNearestWaterNode(startCity.lat, startCity.lng, 160);
        const endWaterNode = this.findNearestWaterNode(endCity.lat, endCity.lng, 160);
        if (startWaterNode == null || endWaterNode == null) return null;

        const riverPath = this.dijkstraGeo(startWaterNode, endWaterNode, { forbidWater: false, routePreference: 'water_first' });
        if (!riverPath || !riverPath.coordinates || riverPath.coordinates.length < 2) return null;

        const merged: [number, number][] = [];
        merged.push([startCity.lng, startCity.lat]);
        for (const c of riverPath.coordinates as [number, number][]) merged.push(c);
        merged.push([endCity.lng, endCity.lat]);

        const cleaned = removeBacktracks(merged, 80);
        const totalDistance = this.calculatePathLength(cleaned);
        return {
            coordinates: cleaned,
            totalDistance,
            edgeKeys: riverPath.edgeKeys || new Set<string>()
        };
    }

    private findNearestGeoNode(lat: number, lng: number): number {
        let nearestId = -1;
        let minDist = Infinity;

        for (const node of this.geoNodes) {
            const dLat = node.lat - lat;
            const dLng = (node.lng - lng) * Math.cos(lat * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            if (dist < minDist) {
                minDist = dist;
                nearestId = node.id;
            }
        }

        return nearestId;
    }

    /** 找城市最近的**陆路**节点（海路节点永远不作城市锚点：城在岸上，上船只走港口接驳边） */
    private findKNearestGeoNodes(lat: number, lng: number, k: number): { id: number; dist: number }[] {
        // 图有近 50 万节点：只保留前 k 名，不再整表建对象再排序（原来一次要 0.4–0.7 秒）
        const best: { id: number; dist: number }[] = [];
        const cosLat = Math.cos(lat * Math.PI / 180);

        for (const node of this.geoNodes) {
            const dLat = node.lat - lat;
            const dLng = (node.lng - lng) * cosLat;
            const d2 = dLat * dLat + dLng * dLng;
            if (best.length >= k && d2 >= best[best.length - 1].dist) continue;
            if (this.seaNodeIds.has(node.id)) continue;
            let i = best.length;
            while (i > 0 && best[i - 1].dist > d2) i--;
            best.splice(i, 0, { id: node.id, dist: d2 });
            if (best.length > k) best.pop();
        }

        for (const b of best) b.dist = Math.sqrt(b.dist);
        return best;
    }

    /** 统计每个非海路节点所在连通分量的大小（O(V+E)，建图完跑一次） */
    private computeNodeComponentSizes(): void {
        const n = this.geoNodes.length;
        const compId = new Int32Array(n);
        const sizes: number[] = [0];
        let cid = 0;

        for (let i = 0; i < n; i++) {
            if (this.seaNodeIds.has(i) || compId[i] !== 0) continue;
            cid++;
            let count = 0;
            const stack: number[] = [i];
            compId[i] = cid;
            while (stack.length > 0) {
                const u = stack.pop()!;
                count++;
                for (const e of this.geoAdj.get(u) ?? []) {
                    if (e.isSea || this.seaNodeIds.has(e.to)) continue;
                    if (compId[e.to] === 0) {
                        compId[e.to] = cid;
                        stack.push(e.to);
                    }
                }
            }
            sizes.push(count);
        }

        this.nodeCompSize = new Int32Array(n);
        for (let i = 0; i < n; i++) {
            const c = compId[i];
            if (c > 0) this.nodeCompSize[i] = sizes[c];
        }
    }

    /**
     * 城/战场接进路网用的近邻节点：城到节点那段直线跨海的不要（伊兹密特湾对岸的路口离得再近也不能直接连）。
     * 优先选接有真实陆路边（!isWater && !isSea）的节点；若城自身坐标在掩膜上紧贴水面，按涉水公里数最少排序兜底。
     * 同时做两项轻量保底：
     *   1) 若近邻全落在局部短碎线上，而 ≤35km 内有主干白线大网（不跨海/水面），保底留 1 个名额给主干网最近点；
     *   2) 若 ≤20km 内有内河节点（不穿海路航线且不跨宽水面），保底留 1 个名额给最近河道入口。
     */
    private findAccessGeoNodes(lat: number, lng: number, k: number): { id: number; dist: number }[] {
        const pool = this.findKNearestGeoNodes(lat, lng, Math.max(48, k * 8));
        const hasLandEdge = (id: number): boolean => {
            const adj = this.geoAdj.get(id);
            return !!adj && adj.some(e => !e.isWater && !e.isSea);
        };
        const hasWaterEdge = (id: number): boolean => {
            const adj = this.geoAdj.get(id);
            return !!adj && adj.some(e => !!e.isWater);
        };
        const roadPool = pool.filter(n => hasLandEdge(n.id));
        const basePool = roadPool.length > 0 ? roadPool : pool;
        const dry = basePool.filter(n => {
            const node = this.geoNodes[n.id];
            return !this.isOverWater(lng, lat, node.lng, node.lat)
                && !this.crossesSeaLane(lng, lat, node.lng, node.lat);
        });
        let result: { id: number; dist: number }[];
        if (dry.length > 0) {
            result = dry.slice(0, k);
        } else {
            // 海岸/岛屿据点自身坐标在掩膜上紧贴水面时，按涉水最少排序取最近节点（仍拦跨航线对岸点）
            const nonCross = basePool.filter(n => {
                const node = this.geoNodes[n.id];
                return !this.crossesSeaLane(lng, lat, node.lng, node.lat);
            });
            const fallback = (nonCross.length > 0 ? nonCross : basePool).slice();
            fallback.sort((a, b) => {
                const na = this.geoNodes[a.id], nb = this.geoNodes[b.id];
                const wa = this.waterKmAlong(lng, lat, na.lng, na.lat);
                const wb = this.waterKmAlong(lng, lat, nb.lng, nb.lat);
                return (wa - wb) || (a.dist - b.dist);
            });
            result = fallback.slice(0, k);
        }

        if (k < 2 || result.length === 0) return result;

        const MAJOR_COMP_MIN_NODES = 1000;
        const MAX_TRUNK_SEARCH_KM = 35;
        const MAX_RIVER_ACCESS_KM = 20;
        const cosLat = Math.max(0.2, Math.cos(lat * Math.PI / 180));
        let reservedTrunkSlot = false;

        // 保底 1：全困在小碎线上时，若 ≤35km 内有主干白线网（不跨水/航线），腾 1 个名额给主干网最近点
        if (this.nodeCompSize.length === this.geoNodes.length
            && !result.some(r => this.nodeCompSize[r.id] >= MAJOR_COMP_MIN_NODES)) {
            const dLatMax = MAX_TRUNK_SEARCH_KM / 111;
            const dLngMax = MAX_TRUNK_SEARCH_KM / (111 * cosLat);
            const trunkCands: { id: number; km: number; degDist: number }[] = [];
            for (const node of this.geoNodes) {
                if (this.seaNodeIds.has(node.id)) continue;
                if (this.nodeCompSize[node.id] < MAJOR_COMP_MIN_NODES) continue;
                if (Math.abs(node.lat - lat) > dLatMax || Math.abs(node.lng - lng) > dLngMax) continue;
                if (!hasLandEdge(node.id)) continue;
                const km = this.haversine(lat, lng, node.lat, node.lng);
                if (km <= MAX_TRUNK_SEARCH_KM) {
                    const degDist = Math.hypot(node.lat - lat, (node.lng - lng) * cosLat);
                    trunkCands.push({ id: node.id, km, degDist });
                }
            }
            trunkCands.sort((a, b) => a.km - b.km);
            for (const tc of trunkCands) {
                const tn = this.geoNodes[tc.id];
                if (!this.isOverWater(lng, lat, tn.lng, tn.lat) && !this.crossesSeaLane(lng, lat, tn.lng, tn.lat)) {
                    if (!result.some(r => r.id === tc.id)) {
                        const entry = { id: tc.id, dist: tc.degDist };
                        if (result.length < k) result.push(entry);
                        else result[result.length - 1] = entry;
                        reservedTrunkSlot = true;
                    }
                    break;
                }
            }
        }

        // 保底 2：候选里无内河入口且 ≤20km 内有河道节点（不穿海路航线、涉水 ≤4km），腾 1 个名额给最近河道点
        if (!result.some(r => hasWaterEdge(r.id))) {
            let bestRiver: { id: number; dist: number; km: number } | null = null;
            for (const cand of pool) {
                if (!hasWaterEdge(cand.id)) continue;
                const wn = this.geoNodes[cand.id];
                const km = this.haversine(lat, lng, wn.lat, wn.lng);
                if (km > MAX_RIVER_ACCESS_KM) continue;
                if (bestRiver && km >= bestRiver.km) continue;
                if (this.crossesSeaLane(lng, lat, wn.lng, wn.lat)) continue;
                if (this.waterKmAlong(lng, lat, wn.lng, wn.lat) > 4.0) continue;
                bestRiver = { id: cand.id, dist: cand.dist, km };
            }
            if (bestRiver && !result.some(r => r.id === bestRiver!.id)) {
                const entry = { id: bestRiver.id, dist: bestRiver.dist };
                if (result.length < k) {
                    result.push(entry);
                } else if (reservedTrunkSlot && result.length >= 3) {
                    result[result.length - 2] = entry;
                } else if (!reservedTrunkSlot) {
                    result[result.length - 1] = entry;
                }
            }
        }

        return result;
    }

    // ===== 参考层 =====

    private showReferenceLayer(): void {
        if (this.referenceLayer) return;
        // 延迟加载，先加载图
        this.loadGeoJSONGraph();
    }

    private showReferenceLayerFromData(geojson: any): void {
        if (this.referenceLayer) return;

        // [Phase B v2] Layer 3 (底层) = 原始 NE 17559
        // 改为白色细线 — 用户反馈深蓝灰看不清; 2026-05-29 加粗到 weight 2.0
        this.referenceLayer = L.geoJSON(geojson, {
            pane: 'ne-original-pane',
            style: () => ({
                color: '#ffffff',  // 纯白
                weight: 2.0,
                opacity: 0.85,
            })
        });
        this.referenceLayer.addTo(this.map);
    }

    private removeReferenceLayer(): void {
        if (this.referenceLayer) {
            this.map.removeLayer(this.referenceLayer);
            this.referenceLayer = null;
        }
    }

    // ===== 道路渲染与编辑 =====

    private renderAllRoads(): void {
        this.clearEditLayers();
        for (const feature of VECTOR_ROAD_DATA.features) {
            if (!feature || !feature.properties) continue;
            this.renderRoad(feature.properties.id);
        }
    }

    private renderRoad(roadId: string): void {
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
        if (!feature || !feature.properties || !feature.geometry) return;

        this.removeRoadLayers(roadId);

        const coords = feature.geometry.coordinates;
        const latLngs = coords.map(([lng, lat]) => L.latLng(lat, lng));

        const polyline = L.polyline(latLngs, {
            pane: 'manual-roads-pane',  // [BUGFIX 2026-05-29] 加 pane, 之前漏了 → 开关 🟠手画 失效
            color: '#ff9800', weight: 4, opacity: 1.0, interactive: true
        }).addTo(this.map);

        polyline.on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            // 🔴 [2026-09-28] 正在连路（已选起点）时 Shift+点到已有道路上 = 加途经点，不是选中这条路
            if (this.startCityId && e.originalEvent?.shiftKey) { this.addViaPoint(e.latlng.lat, e.latlng.lng); return; }
            this.selectRoad(roadId);
            const roadName = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId)?.properties.name || roadId;
            this.setStatus('selected: ' + roadName);
        });
        this.editPolylines.set(roadId, polyline);
    }

    private selectRoad(roadId: string): void {
        if (this.selectedRoadId) this.clearControlPoints(this.selectedRoadId);
        this.selectedRoadId = roadId;
        if (this.roadSelect) this.roadSelect.value = roadId;

        // [2026-05-30 性能] 清缓存; 候选路径只在 🔀 切换按钮被点时才算
        this.pathCandidates = [];
        this.currentCandidateIdx = 0;

        if (roadId) {
            this.showControlPoints(roadId);

            const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
            if (feature && feature.geometry && feature.geometry.coordinates.length > 0) {
                this.panMapToRoad(feature.geometry.coordinates as [number, number][]);
            }

            if (feature && feature.properties.startConnection && feature.properties.endConnection) {
                this.startCityId = feature.properties.startConnection;
                this.endCityId = feature.properties.endConnection;
                // 显示 🔀 按钮 (悬停提示懒计算)
                if (this.switchRouteBtn) {
                    this.switchRouteBtn.style.visibility = 'visible';
                    this.switchRouteBtn.title = '在候选里切换（水路为主/陆路为主/纯陆路/海路为主/直线，最多5条）';
                }
            } else {
                if (this.switchRouteBtn) this.switchRouteBtn.style.visibility = 'hidden';
            }
        } else {
            if (this.switchRouteBtn) this.switchRouteBtn.style.visibility = 'hidden';
        }
    }

    /**
     * [2026-05-30 性能] 懒加载: 选中道路时不算候选, 第一次点 🔀 才算
     * 避免连续点 [上/下一条] 时反复跑 Dijkstra 卡顿
     */
    private ensureCandidatesComputed(): boolean {
        if (this.pathCandidates.length > 0) return true; // 已有缓存
        if (!this.selectedRoadId) return false;
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === this.selectedRoadId);
        if (!feature || !feature.properties.startConnection || !feature.properties.endConnection) return false;
        const startCity = findEndpoint(feature.properties.startConnection);
        const endCity = findEndpoint(feature.properties.endConnection);
        if (!startCity || !endCity || !this.geoGraphBuilt || this.geoNodes.length === 0) return false;
        this.setStatus('⏳ 计算候选路径中 ...');
        const list = this.buildRouteCandidates(startCity, endCity);

        // 对齐当前画布上正在显示的路线：命中则排第 0 位，点一下 🔀 立即切到第 1 位新走廊；未命中则从 -1 起跳直达最优走廊
        const curCoords = (feature.geometry?.coordinates ?? []) as [number, number][];
        let matchedIdx = -1;
        let bestSep = Infinity;
        if (curCoords.length >= 2) {
            const curLen = this.calculatePathLength(curCoords);
            for (let i = 0; i < list.length; i++) {
                const candCoords = this.applyCandidateGeometry(list[i], startCity, endCity);
                const candLen = this.calculatePathLength(candCoords);
                const lenDiffRatio = Math.abs(curLen - candLen) / Math.max(1, curLen, candLen);
                if (lenDiffRatio > 0.15) continue;
                const sep = Math.max(
                    this.midCorridorSeparationKm(curCoords, candCoords),
                    this.midCorridorSeparationKm(candCoords, curCoords)
                );
                if (sep < 8.0 && sep < bestSep) {
                    bestSep = sep;
                    matchedIdx = i;
                }
            }
        }
        if (matchedIdx > 0) {
            const [curCand] = list.splice(matchedIdx, 1);
            list.unshift(curCand);
            this.currentCandidateIdx = 0;
        } else if (matchedIdx === 0) {
            this.currentCandidateIdx = 0;
        } else {
            this.currentCandidateIdx = -1;
        }

        this.pathCandidates = list;
        if (this.switchRouteBtn) {
            this.switchRouteBtn.style.visibility = list.length > 1 ? 'visible' : 'hidden';
        }
        return list.length > 0;
    }

    /** 状态栏格式化：序号 + 标签 + 距离 + 水路占比 + 绕行比 */
    private formatCandidateStatus(candidate: RouteCandidate, idx: number, total: number): string {
        const waterPct = Math.round((candidate.waterRatio ?? 0) * 100);
        const detour = candidate.detourRatio?.toFixed(2) ?? '?';
        return `🔀 [${idx + 1}/${total}] ${candidate.label} ${candidate.totalDistance.toFixed(0)}km · 水路${waterPct}% · 绕行${detour}x`;
    }

    /**
     * 极端绕行判定（常规中短程 >3.0× 或长途 >4.0×；
     * 若起终点球面直线跨越海湾/海峡/浅海，陆路需绕海湾或经海峡咽喉通行，放宽至 4.5× / 5.5×）。
     */
    private isExtremeDetour(
        pathLen: number,
        directDist: number,
        startPt?: { lat: number; lng: number },
        endPt?: { lat: number; lng: number }
    ): boolean {
        const detourRatio = pathLen / Math.max(1, directDist);
        const crossesWater = startPt && endPt && (
            this.waterKmAlong(startPt.lng, startPt.lat, endPt.lng, endPt.lat) > 2.0 ||
            this.crossesSeaLane(startPt.lng, startPt.lat, endPt.lng, endPt.lat)
        );
        if (crossesWater) {
            return (directDist <= 400 && detourRatio > 4.5) || detourRatio > 5.5;
        }
        return (directDist <= 400 && detourRatio > 3.0) || detourRatio > 4.0;
    }

    /** 根据 edgeKeys 统计水路里程占比 */
    private computeWaterRatioFromEdgeKeys(edgeKeys?: Set<string>): number {
        if (!edgeKeys || edgeKeys.size === 0) return 0;
        let waterKm = 0;
        let totalKm = 0;
        for (const key of edgeKeys) {
            const parts = key.split('_');
            if (parts.length !== 2) continue;
            const fromId = Number(parts[0]);
            const toId = Number(parts[1]);
            const edges = this.geoAdj.get(fromId) || [];
            const edge = edges.find(e => e.to === toId);
            if (!edge) continue;
            totalKm += edge.weight;
            if (edge.isWater || edge.isSea) waterKm += edge.weight;
        }
        return totalKm > 0 ? waterKm / totalKm : 0;
    }

    /** 两条路径 edgeKeys 重合率 (0–1) */
    private edgeKeyOverlap(a?: Set<string>, b?: Set<string>): number {
        if (!a || !b || a.size === 0 || b.size === 0) return 0;
        let shared = 0;
        for (const k of a) {
            if (b.has(k)) shared++;
        }
        return shared / Math.max(a.size, b.size);
    }

    /** 衡量两条折线在中段（25%/50%/75% 分位点）的走廊偏离距离（km） */
    private midCorridorSeparationKm(a: [number, number][], b: [number, number][]): number {
        if (a.length < 2 || b.length < 2) return 0;
        const fractions = [0.25, 0.5, 0.75];
        let maxMinDist = 0;
        for (const f of fractions) {
            const idx = Math.min(a.length - 1, Math.max(0, Math.round((a.length - 1) * f)));
            const [lngA, latA] = a[idx];
            let minDist = Infinity;
            for (let j = 0; j < b.length; j++) {
                const d = this.haversine(latA, lngA, b[j][1], b[j][0]);
                if (d < minDist) minDist = d;
            }
            if (minDist > maxMinDist) maxMinDist = minDist;
        }
        return maxMinDist;
    }

    /**
     * 「掐头去尾」收集路径中段边 key：起终点三岔口半径内的进出城共用主干不加惩罚，
     * 避免替代轮为了躲城门口那段必经之路而大绕远路、漏掉旁边平行的白线走廊。
     */
    private addMiddlePenaltyEdges(
        targetSet: Set<string>,
        edgeKeys: Set<string>,
        startCity: { lat: number; lng: number },
        endCity: { lat: number; lng: number },
        directDist: number
    ): void {
        const terminalRadiusKm = Math.min(65, Math.max(15, directDist * 0.30));
        const midKeys: string[] = [];
        const allKeys = Array.from(edgeKeys);
        for (const key of allKeys) {
            const sepIdx = key.indexOf('_');
            if (sepIdx <= 0) continue;
            const u = Number(key.slice(0, sepIdx));
            const v = Number(key.slice(sepIdx + 1));
            const nu = this.geoNodes[u];
            const nv = this.geoNodes[v];
            if (!nu || !nv) continue;
            const mLat = (nu.lat + nv.lat) * 0.5;
            const mLng = (nu.lng + nv.lng) * 0.5;
            if (this.haversine(startCity.lat, startCity.lng, mLat, mLng) > terminalRadiusKm
                && this.haversine(endCity.lat, endCity.lng, mLat, mLng) > terminalRadiusKm) {
                midKeys.push(key);
            }
        }
        if (midKeys.length >= 2) {
            for (const k of midKeys) targetSet.add(k);
        } else {
            // 超短途兜底：只罚中间 60% 的边
            const s = Math.floor(allKeys.length * 0.2);
            const e = Math.max(s + 1, Math.ceil(allKeys.length * 0.8));
            for (let i = s; i < e && i < allKeys.length; i++) targetSet.add(allKeys[i]);
        }
    }

    /** 候选是否与已有列表过于相似（中段相隔 ≥12km 的独立白线走廊一律保留） */
    private isCandidateDuplicate(
        candidate: {
            edgeKeys?: Set<string>;
            totalDistance: number;
            coordinates: [number, number][];
        },
        existing: RouteCandidate[]
    ): boolean {
        const bucket = Math.round(candidate.totalDistance / 5) * 5;
        for (const ex of existing) {
            if (this.arePathsEqual(candidate.coordinates, ex.coordinates)) return true;
            const overlap = this.edgeKeyOverlap(candidate.edgeKeys, ex.edgeKeys);
            if (overlap >= 0.88) return true;

            const sepKm = Math.max(
                this.midCorridorSeparationKm(candidate.coordinates, ex.coordinates),
                this.midCorridorSeparationKm(ex.coordinates, candidate.coordinates)
            );
            // 中段明显分道扬镳（≥12km）的是两条不同走廊，不算重复
            if (sepKm >= 12) continue;

            const exBucket = Math.round(ex.totalDistance / 5) * 5;
            if (Math.abs(bucket - exBucket) <= 10) {
                const lenRatio = Math.abs(candidate.totalDistance - ex.totalDistance)
                    / Math.max(candidate.totalDistance, ex.totalDistance);
                const overlapLimit = lenRatio > 0.2 ? 0.9 : 0.72;
                if (overlap >= overlapLimit || sepKm < 4.5) return true;
            }
        }
        return false;
    }

    /** 按模式与水路占比生成用户可读标签 */
    private buildVariantLabel(mode: RouteMode, waterRatio: number, variantIndex: number): string {
        const suffix = variantIndex === 0 ? '' : String(variantIndex + 1);
        if (mode === 'prefer_water') {
            const pct = Math.round(waterRatio * 100);
            return `🌊 水路为主${suffix}(水${pct}%)`;
        }
        if (mode === 'prefer_land') {
            return `🛣️ 陆路为主${suffix}`;
        }
        if (mode === 'sea_land') {
            const pct = Math.round(waterRatio * 100);
            return `⚓ 海路为主${suffix}(海${pct}%)`;
        }
        return ROUTE_MODE_LABELS.straight;
    }

    /** 统一评分：水路占比、绕行比、与已有候选差异 */
    private scoreRouteCandidate(
        candidate: RouteCandidate,
        directDist: number,
        rankedSoFar: RouteCandidate[]
    ): number {
        let score = 100;
        const detour = candidate.detourRatio ?? candidate.totalDistance / Math.max(1, directDist);
        const waterRatio = candidate.waterRatio ?? 0;

        score -= Math.max(0, (detour - 1) * 28);

        if (candidate.mode === 'prefer_water') {
            if (waterRatio >= VectorRoadEditor.WATER_TRUNK_MIN_RATIO) score += 22;
            score += waterRatio * 18;
        } else if (candidate.mode === 'prefer_land') {
            score += (1 - waterRatio) * 14;
        } else if (candidate.mode === 'sea_land') {
            score += 12;   // 只给一点点，真正决定用不用的是它省下来的里程
        } else if (candidate.mode === 'straight') {
            score -= 35;
        }

        for (const ex of rankedSoFar) {
            const overlap = this.edgeKeyOverlap(candidate.edgeKeys, ex.edgeKeys);
            if (overlap >= 0.85) score -= 45;
            else if (overlap >= 0.6) score -= 18;
        }

        return score;
    }

    /** 在起终点候选节点对上跑一轮 Dijkstra，取最短 */
    private dijkstraBestAmongNodes(
        startNodes: { id: number }[],
        endNodes: { id: number }[],
        options: {
            forbidWater?: boolean;
            allowSea?: boolean;
            seaFactor?: number;
            routePreference?: 'water_first' | 'land_first';
            penaltyEdges?: Set<string>;
        }
    ): { coordinates: [number, number][]; totalDistance: number; edgeKeys: Set<string> } | null {
        return this.dijkstraGeo(startNodes.map(n => n.id), endNodes.map(n => n.id), {
            forbidWater: options.forbidWater,
            allowSea: options.allowSea,
            seaFactor: options.seaFactor,
            routePreference: options.routePreference,
            penaltyEdges: options.penaltyEdges,
            penaltyFactor: VectorRoadEditor.VARIANT_PENALTY_FACTOR,
        });
    }

    /**
     * 多轮 Dijkstra + penaltyEdges 生成同模式多条临近替代路线。
     */
    private findRouteVariantsForMode(
        startCity: { lat: number; lng: number; name?: string },
        endCity: { lat: number; lng: number; name?: string },
        mode: RouteMode,
        maxVariants: number
    ): RouteCandidate[] {
        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);

        if (mode === 'straight') {
            const numSegments = Math.max(3, Math.ceil(directDist / 30));
            const straightCoords: [number, number][] = [];
            for (let i = 0; i <= numSegments; i++) {
                const t = i / numSegments;
                straightCoords.push([
                    startCity.lng + (endCity.lng - startCity.lng) * t,
                    startCity.lat + (endCity.lat - startCity.lat) * t,
                ]);
            }
            return [{
                mode: 'straight',
                label: ROUTE_MODE_LABELS.straight,
                coordinates: straightCoords,
                totalDistance: directDist,
                edgeKeys: new Set(),
                isManualStraightLine: true,
                waterRatio: 0,
                detourRatio: 1,
                variantReason: '直线兜底',
                score: 0,
            }];
        }

        if (!this.geoGraphBuilt || this.geoNodes.length === 0) return [];

        const sc = this.findAccessGeoNodes(startCity.lat, startCity.lng, 6);
        const ec = this.findAccessGeoNodes(endCity.lat, endCity.lng, 6);
        const penaltyEdges = new Set<string>();
        const variants: RouteCandidate[] = [];
        const maxRounds = maxVariants * 2;

        for (let round = 0; round < maxRounds && variants.length < maxVariants; round++) {
            const variantIndex = variants.length;
            const usePureLand = mode === 'prefer_land' && variantIndex >= 1;
            const routePreference = mode === 'prefer_water' ? 'water_first' : 'land_first';

            const best = this.dijkstraBestAmongNodes(sc, ec, {
                forbidWater: usePureLand,
                allowSea: mode === 'sea_land',
                // 「海路为主」给海路打折(0.8)，让它尽量走水；其余模式海路根本不放行
                seaFactor: mode === 'sea_land' ? VectorRoadEditor.SEA_PRIMARY_FACTOR : undefined,
                routePreference: usePureLand ? undefined : routePreference,
                penaltyEdges,
            });

            if (!best || !best.coordinates || best.coordinates.length < 2) break;

            const fullCoords: [number, number][] = [
                [startCity.lng, startCity.lat],
                ...(best.coordinates as [number, number][]),
                [endCity.lng, endCity.lat],
            ];
            const actualLen = this.calculatePathLength(fullCoords);
            if (this.isExtremeDetour(actualLen, directDist, startCity, endCity)) {
                this.addMiddlePenaltyEdges(penaltyEdges, best.edgeKeys, startCity, endCity, directDist);
                continue;
            }

            const waterRatio = this.computeWaterRatioFromEdgeKeys(best.edgeKeys);
            const detourRatio = actualLen / Math.max(1, directDist);
            const draft: RouteCandidate = {
                mode,
                label: this.buildVariantLabel(mode, waterRatio, variantIndex),
                coordinates: best.coordinates as [number, number][],
                totalDistance: actualLen,
                edgeKeys: best.edgeKeys,
                isManualStraightLine: false,
                waterRatio,
                detourRatio,
                variantReason: usePureLand ? '纯陆路' : (variantIndex === 0 ? '最优' : '临近替代'),
            };

            this.addMiddlePenaltyEdges(penaltyEdges, best.edgeKeys, startCity, endCity, directDist);
            if (this.isCandidateDuplicate(draft, variants)) {
                continue;
            }

            variants.push(draft);
        }

        return variants;
    }

    /**
     * 沿「起点→终点」连线的左右法线方向，各搜一条侧翼平行白线走廊（左翼 / 右翼）。
     */
    private findLateralCorridorVariants(
        startCity: { lat: number; lng: number; name?: string },
        endCity: { lat: number; lng: number; name?: string },
        centerMidPenalty?: Set<string>
    ): RouteCandidate[] {
        if (!this.geoGraphBuilt || this.geoNodes.length === 0) return [];
        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
        const sc = this.findAccessGeoNodes(startCity.lat, startCity.lng, 6).map(n => n.id);
        const ec = this.findAccessGeoNodes(endCity.lat, endCity.lng, 6).map(n => n.id);
        if (sc.length === 0 || ec.length === 0) return [];

        const results: RouteCandidate[] = [];
        const sides: Array<{ side: 'left' | 'right'; tag: string }> = [
            { side: 'right', tag: '🛣️ 右翼白线' },
            { side: 'left', tag: '🛣️ 左翼白线' },
        ];

        for (const { side, tag } of sides) {
            const lateralBias = {
                startLat: startCity.lat,
                startLng: startCity.lng,
                endLat: endCity.lat,
                endLng: endCity.lng,
                side,
            };
            // 优先找纯白线侧翼走廊；若断水才退到陆路优先混合图
            let best = this.dijkstraGeo(sc, ec, {
                forbidWater: true,
                penaltyEdges: centerMidPenalty,
                penaltyFactor: 2.2,
                lateralBias,
            });
            if (!best || best.coordinates.length < 2) {
                best = this.dijkstraGeo(sc, ec, {
                    forbidWater: false,
                    routePreference: 'land_first',
                    penaltyEdges: centerMidPenalty,
                    penaltyFactor: 2.2,
                    lateralBias,
                });
            }
            if (!best || best.coordinates.length < 2) continue;

            const fullCoords: [number, number][] = [
                [startCity.lng, startCity.lat],
                ...(best.coordinates as [number, number][]),
                [endCity.lng, endCity.lat],
            ];
            const actualLen = this.calculatePathLength(fullCoords);
            if (this.isExtremeDetour(actualLen, directDist, startCity, endCity)) continue;

            const waterRatio = this.computeWaterRatioFromEdgeKeys(best.edgeKeys);
            results.push({
                mode: 'prefer_land',
                label: tag,
                coordinates: best.coordinates as [number, number][],
                totalDistance: actualLen,
                edgeKeys: best.edgeKeys,
                isManualStraightLine: false,
                waterRatio,
                detourRatio: actualLen / Math.max(1, directDist),
                variantReason: side === 'left' ? '左翼走廊' : '右翼走廊',
            });
        }

        return results;
    }

    /**
     * 智能候选池：多白线走廊（中线 + 左右翼 + 中段避让）+ 水路为主 + 海路为主 + 直线兜底，去重后最多 7 条。
     */
    private buildRouteCandidates(startCity: any, endCity: any): RouteCandidate[] {
        const pfStart = performance.now();
        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
        console.group(`🔍 [Routes] ${startCity.name} → ${endCity.name} (直线 ${directDist.toFixed(0)}km)`);

        const waterRaw = this.findRouteVariantsForMode(
            startCity, endCity, 'prefer_water', VectorRoadEditor.WATER_VARIANTS_PER_MODE
        );
        const landRaw = this.findRouteVariantsForMode(
            startCity, endCity, 'prefer_land', VectorRoadEditor.LAND_VARIANTS_PER_MODE
        );
        const centerMidPenalty = new Set<string>();
        if (landRaw[0]?.edgeKeys) {
            this.addMiddlePenaltyEdges(centerMidPenalty, landRaw[0].edgeKeys, startCity, endCity, directDist);
        }
        const lateralRaw = this.findLateralCorridorVariants(startCity, endCity, centerMidPenalty);
        // ⚓ 水陆联运：只有港口接驳建起来了才有意义（linkPortCities 没跑就是纯陆路图）
        const seaRaw = this.portLinkCount > 0
            ? this.findRouteVariantsForMode(startCity, endCity, 'sea_land', VectorRoadEditor.SEA_VARIANTS_PER_MODE)
            : [];
        const straightRaw = this.findRouteVariantsForMode(startCity, endCity, 'straight', 1);

        const scoreAndSort = (list: RouteCandidate[]): RouteCandidate[] => {
            const ranked: RouteCandidate[] = [];
            for (const c of list) {
                if (this.isCandidateDuplicate(c, ranked)) continue;
                c.score = this.scoreRouteCandidate(c, directDist, ranked);
                ranked.push(c);
            }
            ranked.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
            return ranked;
        };

        const waterRanked = scoreAndSort(waterRaw).slice(0, VectorRoadEditor.WATER_VARIANTS_PER_MODE);
        const landRanked = scoreAndSort([...landRaw, ...lateralRaw]);
        const seaRanked = scoreAndSort(seaRaw).slice(0, VectorRoadEditor.SEA_VARIANTS_PER_MODE);

        // 三种走法各自的头名先占位，再把不同方位的陆路白线走廊补齐，按真实里程由短到长排好方便切换
        const nonStraightMerged: RouteCandidate[] = [];
        for (const head of [landRanked[0], waterRanked[0], seaRanked[0]]) {
            if (head && !this.isCandidateDuplicate(head, nonStraightMerged)) nonStraightMerged.push(head);
        }
        for (const c of [...landRanked.slice(1), ...waterRanked.slice(1), ...seaRanked.slice(1)]) {
            if (!this.isCandidateDuplicate(c, nonStraightMerged)) nonStraightMerged.push(c);
        }
        nonStraightMerged.sort((a, b) => a.totalDistance - b.totalDistance);

        const merged: RouteCandidate[] = [...nonStraightMerged];
        // 直连无路时，在落回纯直线之前尝试智能桥接（≤50km 陆上断口，不跨海/水面）
        if (merged.length === 0 && this.geoGraphBuilt && this.geoNodes.length > 0) {
            const sc = this.findAccessGeoNodes(startCity.lat, startCity.lng, 6);
            const ec = this.findAccessGeoNodes(endCity.lat, endCity.lng, 6);
            if (sc.length > 0 && ec.length > 0) {
                const maxExploreKm = Math.max(200, directDist * 4.5);
                const bridged = this.findSmartBridgedPath(
                    sc.map(n => n.id),
                    ec.map(n => n.id),
                    maxExploreKm
                );
                if (bridged && bridged.coordinates.length >= 2) {
                    const actualLen = this.calculatePathLength(bridged.coordinates);
                    if (!this.isExtremeDetour(actualLen, directDist, startCity, endCity)) {
                        const waterRatio = this.computeWaterRatioFromEdgeKeys(bridged.edgeKeys);
                        const bridgedCandidate: RouteCandidate = {
                            mode: 'prefer_land',
                            label: `🛣️ 陆路桥接(补${bridged.bridgeDist.toFixed(0)}km)`,
                            coordinates: bridged.coordinates,
                            totalDistance: actualLen,
                            edgeKeys: bridged.edgeKeys,
                            isManualStraightLine: false,
                            waterRatio,
                            detourRatio: actualLen / Math.max(1, directDist),
                            variantReason: '智能桥接',
                        };
                        bridgedCandidate.score = this.scoreRouteCandidate(bridgedCandidate, directDist, merged);
                        merged.push(bridgedCandidate);
                    }
                }
            }
        }
        const straight = straightRaw[0];
        if (straight && !this.isCandidateDuplicate(straight, merged)) {
            straight.score = this.scoreRouteCandidate(straight, directDist, merged);
            merged.push(straight);
        }

        const finalList = merged.slice(0, VectorRoadEditor.MAX_ROUTE_CANDIDATES);
        // 🔴 [2026-09-28] 有途经点：途经点路线排第一（其余候选仍在 🔀 切换路径里）
        const via = this.buildViaCandidate(startCity, endCity);
        if (via) finalList.unshift(via);
        // 直线始终保底：若被 slice 切掉，替换最后一位
        if (straight && !finalList.some(c => c.mode === 'straight')) {
            finalList[finalList.length - 1] = straight;
        }

        for (const c of finalList) {
            const wr = Math.round((c.waterRatio ?? 0) * 100);
            console.log(
                `  ✓ ${c.label}: ${c.totalDistance.toFixed(0)}km · 水路${wr}% · 绕行${(c.detourRatio ?? 0).toFixed(2)}x · score=${(c.score ?? 0).toFixed(0)}`
            );
        }
        console.log(`  → 共 ${finalList.length} 条智能候选`);
        console.groupEnd();

        const pfElapsed = performance.now() - pfStart;
        const perf = PerformanceMonitor.getInstance();
        perf.noteAsyncWork('vectorPathfinding', pfElapsed);
        perf.reportCount('vectorPathCandidateCount', finalList.length);
        return finalList;
    }

    /** 将候选几何写入道路坐标（含起终点拼接与抽稀） */
    private applyCandidateGeometry(
        candidate: RouteCandidate,
        startCity: { lat: number; lng: number },
        endCity: { lat: number; lng: number }
    ): [number, number][] {
        if (candidate.mode === 'straight' || candidate.isManualStraightLine) {
            return candidate.coordinates as [number, number][];
        }
        const rawCoords: [number, number][] = [
            [startCity.lng, startCity.lat],
            ...(candidate.coordinates as [number, number][]),
            [endCity.lng, endCity.lat],
        ];
        const cleaned = removeBacktracks(rawCoords, 80);
        let simplified = this.simplifyCoords(cleaned, 0.002);
        simplified = this.simplifyCityVicinity(simplified, startCity, endCity, 15);
        return simplified;
    }

    /** 定位到道路：仅平移视野中心，不改动当前缩放 */
    private panMapToRoad(coords: [number, number][]): void {
        if (!this.map || coords.length === 0) return;
        // 🔴 [2026-09-24 主人「报错后要能定位」] 整条路框进视野（原来只平移到路的重心、不缩放：
        //    几百公里的路只露一截）。2026-09-25 起改为固定 ZOOM 9、居中到路中心。
        // 🔴 [2026-09-25 主人「不要总是切换ZOOM，保持在9」] 不再按路长缩放：以整条路的中心为准，固定 ZOOM 9
        const bounds = L.latLngBounds(coords.map(([lng, lat]) => [lat, lng] as [number, number]));
        this.releaseCameraFollow();
        this.map.setView(bounds.getCenter(), 9, { animate: false });
    }

    /**
     * 定位前先放开镜头跟随：游戏主循环每帧都把镜头拉回被跟随的军团/玩家，
     * 不放开的话定位过去马上又被拽回来（编辑器原来的「选中道路 → 平移」也一直有这个问题）。
     */
    private releaseCameraFollow(): void {
        const follow = (window as { game?: { cameraFollowUI?: { getFollowedArmyId?: () => string | null; isFollowingPlayer?: () => boolean; cancelFollow?: () => void } } })
            .game?.cameraFollowUI;
        if (follow && (follow.getFollowedArmyId?.() || follow.isFollowingPlayer?.())) follow.cancelFollow?.();
    }

    private showControlPoints(roadId: string): void {
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
        if (!feature) return;

        const coords = feature.geometry.coordinates;
        const markers: L.CircleMarker[] = [];
        const mids: L.CircleMarker[] = [];
        const pointPanes = this.ensureEditPointPanes();

        // [2026-05-30 性能] 道路超过 60 点时只显示采样控制点 (太多卡顿)
        // 始终保留首尾, 中间按比例稀疏化
        const MAX_CONTROL_POINTS = 60;
        const stride = coords.length > MAX_CONTROL_POINTS
            ? Math.ceil(coords.length / MAX_CONTROL_POINTS)
            : 1;

        // 红色控制点
        for (let i = 0; i < coords.length; i++) {
            // 跳过中间点 (按 stride), 首尾必显
            if (i !== 0 && i !== coords.length - 1 && i % stride !== 0) continue;
            const [lng, lat] = coords[i];
            const marker = L.circleMarker([lat, lng], {
                radius: 6, color: '#ff1744', fillColor: '#ff5252',
                fillOpacity: 1, weight: 2, interactive: true,
                pane: pointPanes.vertex, bubblingMouseEvents: false
            }).addTo(this.map);

            this.makeDraggable(marker, roadId, i);

            marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e);
                if (coords.length <= 2) {
                    this.setStatus('⚠ 至少保留首尾两个点，无法删除');
                    return;
                }
                coords.splice(i, 1);
                roadRegistry.updateVectorRoadCoordinates(roadId, coords);
                this.renderRoad(roadId);
                this.showControlPoints(roadId);
                const roadName = feature.properties.name || roadId;
                this.setStatus(`🗑 已删节点 · ${roadName} (${coords.length}点) · 🟡点击加 · 🔴右键删`);
            });

            const isEndpoint = i === 0 || i === coords.length - 1;
            marker.bindTooltip(
                isEndpoint ? `点${i} · 拖拽调整` : `点${i} · 拖拽调整 · 右键删除`,
                { permanent: false, direction: 'top', offset: [0, -10] }
            );
            markers.push(marker);
        }

        // 黄色中间点 (同样稀疏化)
        for (let i = 0; i < coords.length - 1; i++) {
            // 稀疏化: 同 stride 步进
            if (i !== 0 && i !== coords.length - 2 && i % stride !== 0) continue;
            const [lng1, lat1] = coords[i];
            const [lng2, lat2] = coords[i + 1];
            const midLat = (lat1 + lat2) / 2;
            const midLng = (lng1 + lng2) / 2;

            // [命中优化] 视觉还是小黄点(radius 5)，但用一圈半透明粗描边把可点面积撑到 ~14px 半径，
            // 再放进 z688 的专用 pane，不会被据点/奇观/道路线抢走点击（红点 z690 仍压在上面）。
            const mid = L.circleMarker([midLat, midLng], {
                radius: 5, color: '#ffc107', fillColor: '#ffeb3b',
                fillOpacity: 0.9, weight: 16, opacity: 0.12, interactive: true,
                pane: pointPanes.mid, bubblingMouseEvents: false
            }).addTo(this.map);
            mid.on('mouseover', () => mid.setStyle({ opacity: 0.3, fillColor: '#fff59d' }));
            mid.on('mouseout', () => mid.setStyle({ opacity: 0.12, fillColor: '#ffeb3b' }));

            const insertIdx = i + 1;
            // mousedown 而不是 click：click 需要 down+up 落在同一元素上，鼠标稍抖就丢
            mid.on('mousedown', (e: L.LeafletMouseEvent) => {
                if ((e.originalEvent as MouseEvent)?.button !== 0) return;  // 只认左键
                L.DomEvent.stopPropagation(e);
                coords.splice(insertIdx, 0, [midLng, midLat]);
                roadRegistry.updateVectorRoadCoordinates(roadId, coords);
                this.renderRoad(roadId);
                this.showControlPoints(roadId);
                const roadName = feature.properties.name || roadId;
                this.setStatus(`➕ 已加节点 · ${roadName} (${coords.length}点) · 🟡点击加 · 🔴右键删`);
            });

            mid.bindTooltip('点击添加节点', { permanent: false, direction: 'top', offset: [0, -8] });
            mids.push(mid);
        }

        this.editMarkers.set(roadId, markers);
        this.midMarkers.set(roadId, mids);

        // 高亮线
        const polyline = this.editPolylines.get(roadId);
        if (polyline) polyline.setStyle({ color: '#ff9800', weight: 4, opacity: 1 });
    }

    private makeDraggable(marker: L.CircleMarker, roadId: string, pointIndex: number): void {
        let isDragging = false;

        marker.on('mousedown', (e: L.LeafletMouseEvent) => {
            isDragging = true;
            this.map.dragging.disable();
            L.DomEvent.stopPropagation(e);
        });

        const onMove = (e: L.LeafletMouseEvent) => {
            if (!isDragging) return;

            let newLat = e.latlng.lat;
            let newLng = e.latlng.lng;

            // [SNAP] Check for snapping to other roads
            const snapPoint = this.findSnapTarget(newLat, newLng, roadId);
            if (snapPoint) {
                newLat = snapPoint.lat;
                newLng = snapPoint.lng;

                // Visual feedback (optional): could change marker color
                marker.setStyle({ fillColor: '#00FF00', color: '#00FF00' });
            } else {
                marker.setStyle({ fillColor: '#ff5252', color: '#ff1744' });
            }

            const newLatLng = L.latLng(newLat, newLng);
            marker.setLatLng(newLatLng);

            const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
            if (feature) {
                feature.geometry.coordinates[pointIndex] = [newLng, newLat];
                const polyline = this.editPolylines.get(roadId);
                if (polyline) {
                    polyline.setLatLngs(feature.geometry.coordinates.map(([lng, lat]) => L.latLng(lat, lng)));
                }
            }
        };
        const onUp = () => {
            if (!isDragging) return;
            isDragging = false;
            this.map.dragging.enable();

            // 1. Vertex Snap (Single Point)
            const snapPoint = this.findSnapTarget(marker.getLatLng().lat, marker.getLatLng().lng, roadId);
            if (snapPoint) {
                const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
                if (feature) {
                    feature.geometry.coordinates[pointIndex] = [snapPoint.lng, snapPoint.lat];
                }
            }
            marker.setStyle({ fillColor: '#ff5252', color: '#ff1744' });

            // 仅保存拖拽后的顶点；不做整条路 snapToExistingRoads（避免两条独立路被自动合并）
            const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
            if (feature) {
                const coords = feature.geometry.coordinates as [number, number][];
                roadRegistry.updateVectorRoadCoordinates(roadId, coords);
                this.renderRoad(roadId);
                this.showControlPoints(roadId);
            }
        };

        this.map.on('mousemove', onMove);
        this.map.on('mouseup', onUp);
    } // Close makeDraggable

    /**
     * [DEDUP] Check if the given road geometry is redundant (fully covered by another road).
     * If so, delete it.
     */
    private checkAndRemoveDuplicateRoad(roadId: string, coords: [number, number][]): boolean {
        // Robustness over complexity:
        // A simple fuzzy subset check handles Exact Match, Reverse Match, and Subset.

        for (const other of VECTOR_ROAD_DATA.features) {
            if (other.properties.id === roadId) continue;
            const otherCoords = other.geometry.coordinates as [number, number][];

            // Check if current road is a sub-segment (or exact match, reverse match) of the other road
            if (this.isSubpath(coords, otherCoords) ||
                this.isSubpath(coords, [...otherCoords].reverse())) {

                console.log(`🗑️ [Dedup] Road ${roadId} is redundant (subset of ${other.properties.id}). Deleting.`);
                this.deleteRoad(roadId);
                return true;
            }
        }
        return false;
    }

    /**
     * [BATCH DEDUP] 扫描所有道路，自动检测并删除重叠/重复道路。
     * 包含两阶段检测：
     *   Phase 1: 精确子路径匹配 — 一条路完全包含在另一条路内
     *   Phase 2: 高度重叠检查 — 一条路 >50% 的点与另一条路重合
     */
    private batchDetectOverlaps(): void {
        const features = VECTOR_ROAD_DATA.features;
        const toDelete = new Set<string>();
        const deleteReasons: string[] = [];

        // Phase 1: 精确子路径匹配（双向）
        for (const featureA of features) {
            if (!featureA || !featureA.geometry || toDelete.has(featureA.properties.id)) continue;
            const coordsA = featureA.geometry.coordinates as [number, number][];

            for (const featureB of features) {
                if (!featureB || !featureB.geometry) continue;
                if (featureA.properties.id === featureB.properties.id) continue;
                if (toDelete.has(featureB.properties.id)) continue;
                const coordsB = featureB.geometry.coordinates as [number, number][];

                // 检查 A 是否为 B 的子路径（含反向）→ 删短的冗余路 A
                if (this.isSubpath(coordsA, coordsB) || this.isSubpath(coordsA, [...coordsB].reverse())) {
                    toDelete.add(featureA.properties.id);
                    deleteReasons.push(`"${featureA.properties.name || '未命名'}" 是 "${featureB.properties.name || '未命名'}" 的子路径`);
                    break;
                }
                // 检查 B 是否为 A 的子路径（含反向）→ 删短的冗余路 B
                if (this.isSubpath(coordsB, coordsA) || this.isSubpath(coordsB, [...coordsA].reverse())) {
                    toDelete.add(featureB.properties.id);
                    deleteReasons.push(`"${featureB.properties.name || '未命名'}" 是 "${featureA.properties.name || '未命名'}" 的子路径`);
                }
            }
        }

        // Phase 2: 高度重叠检查（双向检测，>50% 点数重合则删长的）
        for (let i = 0; i < features.length; i++) {
            const featureA = features[i];
            if (!featureA || !featureA.geometry || toDelete.has(featureA.properties.id)) continue;
            const coordsA = featureA.geometry.coordinates as [number, number][];
            if (coordsA.length < 3) continue;

            for (let j = i + 1; j < features.length; j++) {
                const featureB = features[j];
                if (!featureB || !featureB.geometry) continue;
                if (toDelete.has(featureB.properties.id)) continue;
                const coordsB = featureB.geometry.coordinates as [number, number][];
                if (coordsB.length < 3) continue;

                // 双向计算重叠点数
                const countOverlap = (a: [number, number][], b: [number, number][]): number => {
                    let n = 0;
                    for (const p of a) {
                        for (const q of b) {
                            if (this.arePointsEqual(p, q)) { n++; break; }
                        }
                    }
                    return n;
                };

                const matchAinB = countOverlap(coordsA, coordsB); // A 的点在 B 中出现的数量
                const matchBinA = countOverlap(coordsB, coordsA); // B 的点在 A 中出现的数量
                const ratioAinB = matchAinB / coordsA.length;
                const ratioBinA = matchBinA / coordsB.length;

                // [2026-05-30 v3] 重叠规则: ≥2 点 AND > 30%; 1 点是端共享 NE 节点的正常情况
                const absOverlap = Math.max(matchAinB, matchBinA);
                if (absOverlap >= 2 && (ratioAinB > 0.3 || ratioBinA > 0.3)) {
                    // 删点数多的（长的），保留点数少的（短的）
                    // 被删长路的端点城市在下一轮自动连接时会被重新连接
                    if (coordsA.length > coordsB.length) {
                        toDelete.add(featureA.properties.id);
                        deleteReasons.push(`"${featureA.properties.name || '未命名'}" 与 "${featureB.properties.name || '未命名'}" 重叠 ${absOverlap} 点 (A:${(ratioAinB*100).toFixed(0)}% / B:${(ratioBinA*100).toFixed(0)}%)，删长保短 → 删除"${featureA.properties.name}"`);
                    } else if (coordsB.length > coordsA.length) {
                        toDelete.add(featureB.properties.id);
                        deleteReasons.push(`"${featureB.properties.name || '未命名'}" 与 "${featureA.properties.name || '未命名'}" 重叠 ${absOverlap} 点 (A:${(ratioAinB*100).toFixed(0)}% / B:${(ratioBinA*100).toFixed(0)}%)，删长保短 → 删除"${featureB.properties.name}"`);
                    }
                    // 点数相等时都不删（需要人工判断）
                }
            }
        }

        // 执行删除
        let removedCount = 0;
        for (const id of toDelete) {
            console.log(`🗑️ [Batch Dedup] ${deleteReasons[removedCount]}`);
            this.deleteRoad(id);
            removedCount++;
        }

        // 更新 UI
        this.updateRoadSelect();
        this.renderAllRoads();
        if (removedCount > 0) {
            this.setStatus(`✅ 查重完成: 删除了 ${removedCount} 条重叠道路`);
        } else {
            this.setStatus('✅ 查重完成: 未发现重叠道路');
        }
    }

    /**
     * [BATCH SIMPLIFY] 批量简化所有道路中点数过多的路径。
     * 对点数 > 100 的道路执行 Douglas-Peucker 抽稀，tolerance=0.002(~200m)。
     * 显示简化统计信息。
     */
    private batchSimplifyAllRoads(): void {
        const TOLERANCE = 0.002; // ~200m
        const MAX_POINTS = 100;
        let totalRemoved = 0;
        let simplifiedCount = 0;

        for (const feature of VECTOR_ROAD_DATA.features) {
            if (!feature || !feature.geometry) continue;
            const coords = feature.geometry.coordinates as [number, number][];
            if (coords.length <= MAX_POINTS) continue;

            const beforeCount = coords.length;
            const simplified = this.simplifyCoords(coords, TOLERANCE);
            const afterCount = simplified.length;
            const removed = beforeCount - afterCount;

            if (removed > 0) {
                feature.geometry.coordinates = simplified;
                roadRegistry.updateVectorRoadCoordinates(feature.properties.id, simplified);
                totalRemoved += removed;
                simplifiedCount++;
                console.log(`✂️ [Simplify] "${feature.properties.name || '未命名'}" (${feature.properties.id}): ${beforeCount}→${afterCount}点 (-${removed})`);
            }
        }

        // 刷新渲染
        this.renderAllRoads();
        // 如果有选中的道路，刷新控制点
        if (this.selectedRoadId) {
            this.showControlPoints(this.selectedRoadId);
        }
        this.updateRoadSelect();

        if (simplifiedCount > 0) {
            this.setStatus(`✅ 简化完成: ${simplifiedCount} 条道路, 共精简 ${totalRemoved} 点`);
        } else {
            this.setStatus('✅ 简化完成: 无需简化');
        }
    }

    // =====================================================================
    // [批量修复] 检测并修复道路端点与城市实际位置不匹配的问题
    // =====================================================================

    private static readonly ENDPOINT_MISMATCH_THRESHOLD_KM = 5; // 5km 触发修复
    /** 据点变更后道路仍挂旧端点 → 地图超长直线（全面审查） */
    private static readonly STALE_STRETCH_DRIFT_KM = 5;
    private static readonly STALE_STRETCH_MIN_SPAN_KM = 80;
    private static readonly STALE_STRETCH_CITY_EXTRA_KM = 30;
    /** 相邻坐标单段过长：城挪走后常见「一端已对齐、中段仍拴旧路网」 */
    private static readonly STALE_SEGMENT_JUMP_KM = 150;

    /**
     * 🔧 批量修复端点不匹配
     *
     * 扫描所有道路，检查首末坐标与关联城市坐标是否匹配。
     * 如果 Haversine 距离 > 阈值，则重新在 NE 路网上寻路并更新坐标。
     */
    private async batchFixEndpoints(): Promise<void> {
        this.setStatus('⏳ 正在检测端点不匹配...');
        const THRESHOLD_KM = VectorRoadEditor.ENDPOINT_MISMATCH_THRESHOLD_KM;

        // 确保路网图已加载
        if (!this.geoGraphBuilt) {
            await this.loadGeoJSONGraph();
        }

        let fixedCount = 0;
        let checkedCount = 0;

        for (const feature of VECTOR_ROAD_DATA.features) {
            if (!feature || !feature.properties || !feature.geometry) continue;
            const props = feature.properties;
            const coords = feature.geometry.coordinates as [number, number][];
            if (coords.length < 2) continue;

            const startCityId = props.startConnection;
            const endCityId = props.endConnection;
            if (!startCityId || !endCityId) continue;

            const startCity = findEndpoint(startCityId);
            const endCity = findEndpoint(endCityId);
            if (!startCity || !endCity) continue;

            checkedCount++;

            // 检测起点：道路首坐标 vs 城市坐标
            const firstCoord = coords[0]; // [lng, lat]
            const lastCoord = coords[coords.length - 1]; // [lng, lat]

            const startDist = this.haversine(startCity.lat, startCity.lng, firstCoord[1], firstCoord[0]);
            const endDist = this.haversine(endCity.lat, endCity.lng, lastCoord[1], lastCoord[0]);

            if (startDist <= THRESHOLD_KM && endDist <= THRESHOLD_KM) {
                continue; // 两端都匹配，跳过
            }

            console.log(`🔧 [FixEndpoint] "${props.name}": 起点偏差 ${startDist.toFixed(1)}km, 终点偏差 ${endDist.toFixed(1)}km`);

            // 重新寻路
            const startCandidates = this.findAccessGeoNodes(startCity.lat, startCity.lng, 5);
            const endCandidates = this.findAccessGeoNodes(endCity.lat, endCity.lng, 5);

            const bestPath: { coordinates: [number, number][]; totalDistance: number } | null =
                this.dijkstraGeo(startCandidates.map(n => n.id), endCandidates.map(n => n.id));

            if (bestPath) {
                // 拼接: 城市坐标 + 路网路径 + 城市坐标
                let rawCoords: [number, number][] = [
                    [startCity.lng, startCity.lat],
                    ...bestPath.coordinates,
                    [endCity.lng, endCity.lat]
                ];

                // 后处理: 去折角 + 抽稀 + 清理周边
                const cleaned = removeBacktracks(rawCoords, 80);
                let simplified = this.simplifyCoords(cleaned, 0.002);
                simplified = this.simplifyCityVicinity(simplified, startCity, endCity, 15);
                const snappedCoords = this.snapToExistingRoads(simplified, feature.properties.id);
                // [FIX] 强制首尾坐标对齐城市位置
                const finalCoords: [number, number][] = snappedCoords as [number, number][];
                if (finalCoords.length > 0) {
                    finalCoords[0] = [startCity.lng, startCity.lat];
                    finalCoords[finalCoords.length - 1] = [endCity.lng, endCity.lat];
                }

                feature.geometry.coordinates = finalCoords;
                roadRegistry.updateVectorRoadCoordinates(feature.properties.id, finalCoords);
                fixedCount++;
            } else {
                // 尝试桥接
                const bridged = this.findSmartBridgedPath(startCandidates[0].id, endCandidates[0].id);
                if (bridged) {
                    let rawCoords: [number, number][] = [
                        [startCity.lng, startCity.lat],
                        ...bridged.coordinates,
                        [endCity.lng, endCity.lat]
                    ];
                    const cleaned = removeBacktracks(rawCoords, 80);
                    let simplified = this.simplifyCoords(cleaned, 0.002);
                    simplified = this.simplifyCityVicinity(simplified, startCity, endCity, 15);
                    const snappedCoords = this.snapToExistingRoads(simplified, feature.properties.id);
                    // [FIX] 强制首尾坐标对齐城市位置
                    const finalCoords: [number, number][] = snappedCoords as [number, number][];
                    if (finalCoords.length > 0) {
                        finalCoords[0] = [startCity.lng, startCity.lat];
                        finalCoords[finalCoords.length - 1] = [endCity.lng, endCity.lat];
                    }
                    feature.geometry.coordinates = finalCoords;
                    roadRegistry.updateVectorRoadCoordinates(feature.properties.id, finalCoords);
                    fixedCount++;
                    console.log(`🔧 [FixEndpoint] "${props.name}" 通过桥接修复`);
                } else {
                    console.warn(`⚠️ [FixEndpoint] "${props.name}" 路网不可达，跳过`);
                }
            }
        }

        // 刷新渲染
        this.renderAllRoads();
        this.updateRoadSelect();

        if (fixedCount > 0) {
            this.setStatus(`✅ 端点修复完成: 检查 ${checkedCount} 条, 修复 ${fixedCount} 条`);
        } else {
            this.setStatus(`✅ 端点检查完成: 所有 ${checkedCount} 条道路端点匹配`);
        }
    }

    // =====================================================================
    // [清理悬挂道路] 移除引用了已删除据点的道路
    // =====================================================================

    /**
     * 🧹 清理悬挂道路：遍历所有道路，删除那些 startConnection 或 endConnection
     * 指向不存在城市的道路（城市已被删除但道路未清理）。
     * 自动在 🚧 自动连 前执行。
     */
    // =====================================================================
    // [NEW 2026] 🔍 全面审查：综合检测所有问题（端点 + 重复 + 自环），不修改数据
    //
    // 检查类别:
    //   A. 端点完整性 (auditRoads 的 6 类问题)
    //   C. 据点变更拉伸线 (端点仍拴旧坐标 → 超长直线)
    //   D. 端点漂移 (城移了但拉伸不显著)
    //
    //       + 控制台详情 + 模态报告
    // =====================================================================

    /**
     * 自动连接的距离限制 (km) — 固定 250
     *
     * 设计公理：
     *   - 250km 是基于汉唐驿道系统的"两州治之间标准距离"
     *   - 河西、陇右等真实边疆走廊典型段距正好 ~220-240km
     *   - 如果两城超过 250km 无法连通，**不应该放宽距离**，
     *     而是**应该在中间加一座历史名城作中转**（参见瓜州补充示例）
     */
    private connectDistanceKm: number = 250;

    private async detectAllIssues(): Promise<void> {
        // 「一条陆路都没有」要靠海陆掩膜排除岛上的城；路网图还没建时掩膜可能没载，这里先补载
        if (!this.landMaskReady) {
            this.setStatus('⏳ 载入海陆掩膜...');
            this.landMaskReady = await loadLandMask(`${import.meta.env.BASE_URL || '/'}${LAND_MASK_PATH}`);
        }
        const features = VECTOR_ROAD_DATA.features;
        const validCityIds = ALL_ENDPOINT_IDS();   // 据点 + 战场，都是合法端点

        const issues = {
            missingStart: [] as Array<{ id: string; name: string }>,
            missingEnd: [] as Array<{ id: string; name: string }>,
            invalidStart: [] as Array<{ id: string; name: string; ref: string }>,
            invalidEnd: [] as Array<{ id: string; name: string; ref: string }>,
            sameStartEnd: [] as Array<{ id: string; name: string; ref: string }>,
            tooFewPoints: [] as Array<{ id: string; name: string; count: number }>,
            // [2026-06-19] 据点变更拉伸线：城已挪走, 道路 geometry 仍拴旧端点 → 地图超长直线
            staleStretchLines: [] as Array<{
                id: string; name: string; startName: string; endName: string;
                startDriftKm: number; endDriftKm: number;
                pathKm: number; geomSpanKm: number; cityDirectKm: number; pointCount: number;
                maxSegmentKm: number;
                reason: 'endpointDrift' | 'segmentJump' | 'both';
            }>,
            // [2026-05-30 删除] 旧直线检测 (未区分据点变更) 已停用
            straightLines: [] as Array<{ id: string; name: string; pointCount: number; lengthKm: number; straightKm: number; ratio: number; startName: string; endName: string }>,
            // [2026-05-30 新] 端点漂移: 城坐标改了, 但道路 coords[0]/[-1] 是旧坐标
            endpointDrift: [] as Array<{ id: string; name: string; whichEnd: 'start' | 'end'; cityName: string; driftKm: number; cityCoord: [number, number]; roadCoord: [number, number] }>,
            // [2026-05-30 新] 名称过期: 道路 name 字段跟 startCity/endCity 当前 name 不匹配
            nameMismatch: [] as Array<{ id: string; oldName: string; expectedName: string; startName: string; endName: string }>,
            duplicates: [] as Array<{ keepId: string; deleteId: string; keepName: string; deleteName: string; reason: string; overlapPoints: number; ratioA: number; ratioB: number }>,
            // 据点压在 A-C 道路中间, 却不是这条路的端点 (B 忘了连路)
            cityOnRoad: [] as Array<{ roadId: string; roadName: string; startName: string; endName: string; cityId: string; cityName: string; distKm: number }>,
            // 一条陆路都没有, 但 500km 内有别的据点 (该连陆路却没连)
            noLandRoad: [] as Array<{ cityId: string; cityName: string; seaCount: number; nearId: string; nearName: string; nearKm: number }>,
        };

        // ───── 端点完整性检查 ─────
        for (const f of features) {
            if (!f || !f.properties) continue;
            const id = f.properties.id || '(无 ID)';
            const name = f.properties.name || '(未命名)';
            const startId = f.properties.startConnection;
            const endId = f.properties.endConnection;
            const coords = (f.geometry?.coordinates || []) as [number, number][];

            if (!startId) issues.missingStart.push({ id, name });
            else if (!validCityIds.has(startId)) issues.invalidStart.push({ id, name, ref: startId });

            if (!endId) issues.missingEnd.push({ id, name });
            else if (!validCityIds.has(endId)) issues.invalidEnd.push({ id, name, ref: endId });

            if (startId && endId && startId === endId) issues.sameStartEnd.push({ id, name, ref: startId });
            if (coords.length < 2) issues.tooFewPoints.push({ id, name, count: coords.length });

            // [2026-05-30 删除] 旧 NE 直线检测已停用

            const DRIFT_THRESHOLD_KM = VectorRoadEditor.STALE_STRETCH_DRIFT_KM;
            const startCity = findEndpoint(startId);
            const endCity = findEndpoint(endId);

            let startDriftKm = 0;
            let endDriftKm = 0;
            if (startCity && coords.length >= 1) {
                const [lng0, lat0] = coords[0];
                startDriftKm = this.haversine(lat0, lng0, startCity.lat, startCity.lng);
            }
            if (endCity && coords.length >= 2) {
                const [lng1, lat1] = coords[coords.length - 1];
                endDriftKm = this.haversine(lat1, lng1, endCity.lat, endCity.lng);
            }
            const maxDriftKm = Math.max(startDriftKm, endDriftKm);

            // 据点变更拉伸线：端点漂移和/或相邻坐标出现超长跳段
            if (startCity && endCity && coords.length >= 2) {
                const pathKm = this.computePathLength(coords);
                const [lng0, lat0] = coords[0];
                const [lng1, lat1] = coords[coords.length - 1];
                const geomSpanKm = this.haversine(lat0, lng0, lat1, lng1);
                const cityDirectKm = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);

                let maxSegmentKm = 0;
                let maxSegmentIdx = 0;
                for (let si = 0; si < coords.length - 1; si++) {
                    const [lngA, latA] = coords[si];
                    const [lngB, latB] = coords[si + 1];
                    const segKm = this.haversine(latA, lngA, latB, lngB);
                    if (segKm > maxSegmentKm) {
                        maxSegmentKm = segKm;
                        maxSegmentIdx = si;
                    }
                }
                const jumpAtRoadEnd = maxSegmentIdx === 0 || maxSegmentIdx === coords.length - 2;

                const driftStretch =
                    maxDriftKm > DRIFT_THRESHOLD_KM &&
                    geomSpanKm >= VectorRoadEditor.STALE_STRETCH_MIN_SPAN_KM &&
                    geomSpanKm > cityDirectKm + VectorRoadEditor.STALE_STRETCH_CITY_EXTRA_KM;

                const segmentJump =
                    coords.length >= 3 &&
                    maxSegmentKm >= VectorRoadEditor.STALE_SEGMENT_JUMP_KM &&
                    jumpAtRoadEnd &&
                    (
                        maxDriftKm > DRIFT_THRESHOLD_KM ||
                        maxSegmentKm > cityDirectKm + VectorRoadEditor.STALE_STRETCH_CITY_EXTRA_KM ||
                        (cityDirectKm > 0 && pathKm > cityDirectKm * 1.35 + 50) ||
                        maxSegmentKm >= 400
                    );

                if (driftStretch || segmentJump) {
                    issues.staleStretchLines.push({
                        id,
                        name,
                        startName: startCity.name,
                        endName: endCity.name,
                        startDriftKm: Math.round(startDriftKm * 10) / 10,
                        endDriftKm: Math.round(endDriftKm * 10) / 10,
                        pathKm: Math.round(pathKm),
                        geomSpanKm: Math.round(geomSpanKm),
                        cityDirectKm: Math.round(cityDirectKm),
                        pointCount: coords.length,
                        maxSegmentKm: Math.round(maxSegmentKm),
                        reason: driftStretch && segmentJump ? 'both' : driftStretch ? 'endpointDrift' : 'segmentJump',
                    });
                }
            }

            // 端点漂移（非超长拉伸的轻微偏差）
            if (startCity && coords.length >= 1 && startDriftKm > DRIFT_THRESHOLD_KM) {
                const alreadyStale = issues.staleStretchLines.some(s => s.id === id);
                if (!alreadyStale) {
                    const [lng0, lat0] = coords[0];
                    issues.endpointDrift.push({
                        id, name,
                        whichEnd: 'start',
                        cityName: startCity.name,
                        driftKm: Math.round(startDriftKm * 10) / 10,
                        cityCoord: [startCity.lat, startCity.lng],
                        roadCoord: [lat0, lng0],
                    });
                }
            }
            if (endCity && coords.length >= 2 && endDriftKm > DRIFT_THRESHOLD_KM) {
                const alreadyStale = issues.staleStretchLines.some(s => s.id === id);
                if (!alreadyStale) {
                    const [lng1, lat1] = coords[coords.length - 1];
                    issues.endpointDrift.push({
                        id, name,
                        whichEnd: 'end',
                        cityName: endCity.name,
                        driftKm: Math.round(endDriftKm * 10) / 10,
                        cityCoord: [endCity.lat, endCity.lng],
                        roadCoord: [lat1, lng1],
                    });
                }
            }

            // [2026-05-30 删除] 名称过期检测已停用
            // 用户公理: 道路只认坐标, name 字段是装饰, 改名不影响功能
            // 玩家完全看不到 road.name (他们只看据点上的"城名"和"旗号")
            // 编辑器下拉的旧名字也无所谓, 不算 error
        }

        // ───── 重复/重叠检查 (同 batchDetectOverlaps 但不删) ─────
        const dupDeletedIds = new Set<string>();
        // Phase 1: 子路径匹配
        for (const fA of features) {
            if (!fA || !fA.geometry || dupDeletedIds.has(fA.properties.id)) continue;
            const cA = fA.geometry.coordinates as [number, number][];
            for (const fB of features) {
                if (!fB || !fB.geometry) continue;
                if (fA.properties.id === fB.properties.id) continue;
                if (dupDeletedIds.has(fB.properties.id)) continue;
                const cB = fB.geometry.coordinates as [number, number][];
                if (this.isSubpath(cA, cB) || this.isSubpath(cA, [...cB].reverse())) {
                    issues.duplicates.push({
                        keepId: fA.properties.id, deleteId: fB.properties.id,
                        keepName: fA.properties.name || '(未命名)', deleteName: fB.properties.name || '(未命名)',
                        reason: '子路径(短) ⊂ 超集(长)',
                        overlapPoints: cA.length, ratioA: 1.0, ratioB: cA.length / cB.length,
                    });
                    dupDeletedIds.add(fB.properties.id);
                    break;
                }
            }
        }
        // Phase 2: >50% 点重合（双向）
        for (let i = 0; i < features.length; i++) {
            const fA = features[i];
            if (!fA || !fA.geometry || dupDeletedIds.has(fA.properties.id)) continue;
            const cA = fA.geometry.coordinates as [number, number][];
            if (cA.length < 3) continue;
            for (let j = i + 1; j < features.length; j++) {
                const fB = features[j];
                if (!fB || !fB.geometry) continue;
                if (dupDeletedIds.has(fB.properties.id)) continue;
                const cB = fB.geometry.coordinates as [number, number][];
                if (cB.length < 3) continue;
                const countOverlap = (a: [number, number][], b: [number, number][]): number => {
                    let n = 0;
                    for (const p of a) for (const q of b) if (this.arePointsEqual(p, q)) { n++; break; }
                    return n;
                };
                const matchAinB = countOverlap(cA, cB);
                const matchBinA = countOverlap(cB, cA);
                const ratA = matchAinB / cA.length;
                const ratB = matchBinA / cB.length;
                const absOverlap = Math.max(matchAinB, matchBinA);
                // [2026-05-30 v3] 重叠规则: 必须 ≥2 点 AND (30% 或绝对多)
                // 1 点是正常 (端共享 NE 节点), 不算重叠
                if (absOverlap >= 2 && (ratA > 0.3 || ratB > 0.3)) {
                    // 删长的，保留短的（按实际公里数算长度更准确）
                    const lenA = this.computePathLength(cA);
                    const lenB = this.computePathLength(cB);
                    if (lenA > lenB) {
                        issues.duplicates.push({
                            keepId: fB.properties.id, deleteId: fA.properties.id,
                            keepName: fB.properties.name || '(未命名)', deleteName: fA.properties.name || '(未命名)',
                            reason: `重叠 ${absOverlap} 点 (A:${(ratA*100).toFixed(0)}% / B:${(ratB*100).toFixed(0)}%); 删长保短 (${lenA.toFixed(0)}km vs ${lenB.toFixed(0)}km)`,
                            overlapPoints: absOverlap, ratioA: ratA, ratioB: ratB,
                        });
                        dupDeletedIds.add(fA.properties.id);
                        break;
                    } else if (lenB > lenA) {
                        issues.duplicates.push({
                            keepId: fA.properties.id, deleteId: fB.properties.id,
                            keepName: fA.properties.name || '(未命名)', deleteName: fB.properties.name || '(未命名)',
                            reason: `重叠 ${absOverlap} 点 (A:${(ratA*100).toFixed(0)}% / B:${(ratB*100).toFixed(0)}%); 删长保短 (${lenB.toFixed(0)}km vs ${lenA.toFixed(0)}km)`,
                            overlapPoints: absOverlap, ratioA: ratA, ratioB: ratB,
                        });
                        dupDeletedIds.add(fB.properties.id);
                    }
                }
            }
        }

        // ───── 据点压在别的路中间却没连上 (A-C 之间有 B，B 忘了连路) ─────
        issues.cityOnRoad = this.findCitiesOnRoads();
        issues.noLandRoad = this.findCitiesWithoutLandRoad();

        const totalRoads = features.length;
        const orphanCities = this.getOrphanCities();
        const singleRoadCities = this.getSingleRoadCities();
        // 🔴 [2026-09-24] 战场与据点一致：没有任何道路连到的战场单列一栏（信息项，可定位）
        const bfCounts = this.battlefieldRoadCounts();
        const unlinkedBattlefields = BATTLEFIELDS
            .filter((b) => !bfCounts.has(b.id) && !battlefieldMergedCityId(b.id))   // 归为一点的战场不算未连路
            .map((b) => ({ id: b.id, name: b.name, lat: b.lat, lng: b.lng, scriptYear: b.scriptYear }));

        const totalIssues = issues.invalidStart.length + issues.invalidEnd.length +
            issues.sameStartEnd.length + issues.tooFewPoints.length +
            issues.duplicates.length +
            issues.staleStretchLines.length +
            issues.endpointDrift.length +
            issues.cityOnRoad.length +
            issues.noLandRoad.length;

        // ───── 控制台分组打印 ─────
        console.group(`🔍 [全面审查] ${totalRoads} 条路 · 问题 ${totalIssues} 项 · 孤儿城 ${orphanCities.length} · 单路据点 ${singleRoadCities.length} · 未连路战场 ${unlinkedBattlefields.length}`);
        if (orphanCities.length) {
            console.group(`📋 孤儿城 (无路连接) [${orphanCities.length}]`);
            orphanCities.forEach(c => console.log(`  ${c.name}  [${c.id}]  (${c.lat.toFixed(2)}, ${c.lng.toFixed(2)})`));
            console.groupEnd();
        }
        if (singleRoadCities.length) {
            console.group(`🛤️ 单路据点 (仅 1 条路) [${singleRoadCities.length}]`);
            singleRoadCities.forEach(c => console.log(`  ${c.name}  [${c.id}]  → [${c.kind}] ${c.roadName} ↔ ${c.peerName}`));
            console.groupEnd();
        }

        if (issues.invalidStart.length) {
            console.group(`❌ start 指向不存在的城 [${issues.invalidStart.length}] → 将被清理`);
            issues.invalidStart.forEach(i => console.log(`  ${i.name}  → start="${i.ref}"`));
            console.groupEnd();
        }
        if (issues.invalidEnd.length) {
            console.group(`❌ end 指向不存在的城 [${issues.invalidEnd.length}] → 将被清理`);
            issues.invalidEnd.forEach(i => console.log(`  ${i.name}  → end="${i.ref}"`));
            console.groupEnd();
        }
        if (issues.sameStartEnd.length) {
            console.group(`❌ 起点=终点 (自环) [${issues.sameStartEnd.length}] → 将被清理`);
            issues.sameStartEnd.forEach(i => console.log(`  ${i.name}  → ${i.ref}`));
            console.groupEnd();
        }
        if (issues.tooFewPoints.length) {
            console.group(`❌ 坐标点 < 2 [${issues.tooFewPoints.length}] → 将被清理`);
            issues.tooFewPoints.forEach(i => console.log(`  ${i.name}  只有 ${i.count} 个点`));
            console.groupEnd();
        }
        if (issues.staleStretchLines.length) {
            console.group(`📐 据点变更拉伸线 (端点仍拴旧坐标) [${issues.staleStretchLines.length}] → 删后重画或 🔧 修端点`);
            issues.staleStretchLines.forEach(s => {
                const tag = s.reason === 'segmentJump' ? '跳段' : s.reason === 'both' ? '漂移+跳段' : '端点漂移';
                console.log(
                    `  ${s.startName} ↔ ${s.endName} [${tag}] 最长段${s.maxSegmentKm}km 几何${s.geomSpanKm}km 城距${s.cityDirectKm}km 起漂${s.startDriftKm}km 终漂${s.endDriftKm}km [${s.id}]`
                );
            });
            console.groupEnd();
        }
        if (issues.endpointDrift.length) {
            console.group(`🚶 端点漂移 (轻微, 非超长直线) [${issues.endpointDrift.length}]`);
            issues.endpointDrift.forEach(i => console.log(
                `  ${i.name} · ${i.whichEnd === 'start' ? '起' : '终'}点 ${i.cityName} 漂移 ${i.driftKm}km [${i.id}]`
            ));
            console.groupEnd();
        }
        if (issues.cityOnRoad.length) {
            console.group(`🏙️ 据点压在路中间却没连上 [${issues.cityOnRoad.length}] → 把这条路在该据点处断开, 或补 A-B / B-C`);
            issues.cityOnRoad.forEach(i => console.log(
                `  ${i.startName} ↔ ${i.endName} 途经 ${i.cityName} (离路 ${i.distKm}km) [路 ${i.roadId}] [城 ${i.cityId}]`
            ));
            console.groupEnd();
        }
        if (issues.noLandRoad.length) {
            console.group(`🚫 一条陆路都没有, 但 ${VectorRoadEditor.NO_LAND_ROAD_NEIGHBOR_KM}km 内有据点 [${issues.noLandRoad.length}]`);
            issues.noLandRoad.forEach(i => console.log(
                `  ${i.cityName} [${i.cityId}] 海路 ${i.seaCount} 条 · 最近 ${i.nearName} ${i.nearKm}km`
            ));
            console.groupEnd();
        }
        if (issues.straightLines.length) {
            console.group(`📏 疑似直线 (未走 NE 真实路径) [${issues.straightLines.length}] → 将被清理`);
            issues.straightLines.forEach(s => console.log(`  ${s.startName} ↔ ${s.endName}  ${s.pointCount}点 直径${s.straightKm}km 路径${s.lengthKm}km 比${s.ratio}× [${s.id}]`));
            console.groupEnd();
        }
        if (issues.duplicates.length) {
            console.group(`❌ 重复/重叠路 [${issues.duplicates.length}] → 将被清理（保留短的）`);
            issues.duplicates.forEach(d => console.log(`  保留 "${d.keepName}", 删 "${d.deleteName}"  (${d.reason})`));
            console.groupEnd();
        }
        console.groupEnd();

        // ───── 状态栏 + 富文本模态 ─────
        const bfTag = ` · 未连路战场 ${unlinkedBattlefields.length}`;
        if (totalIssues === 0 && orphanCities.length === 0 && singleRoadCities.length === 0 && unlinkedBattlefields.length === 0) {
            this.setStatus(`✅ 审查通过：${totalRoads} 条道路全部正常`);
        } else if (totalIssues === 0) {
            this.setStatus(`✅ 道路无问题 · 孤儿城 ${orphanCities.length} · 单路据点 ${singleRoadCities.length}${bfTag}`);
        } else {
            this.setStatus(`⚠ 问题 ${totalIssues} 项 · 孤儿城 ${orphanCities.length} · 单路据点 ${singleRoadCities.length}${bfTag}`);
        }
        this.showAuditReportModal(issues, totalRoads, totalIssues, orphanCities, singleRoadCities, unlinkedBattlefields);
    }

    /**
     * [2026-05-30 新] 富文本审查报告模态框
     * 替代 alert(), 可滚动查看每条问题路的详情, 点击行可定位.
     */
    private showAuditReportModal(
        issues: any,
        totalRoads: number,
        totalIssues: number,
        orphanCities: Array<{ id: string; name: string; lat: number; lng: number }>,
        singleRoadCities: Array<{ id: string; name: string; lat: number; lng: number; roadName: string; peerName: string; kind: '陆' | '海' }>,
        unlinkedBattlefields: Array<{ id: string; name: string; lat: number; lng: number; scriptYear: number }> = [],
    ): void {
        // 已有模态先移除
        document.querySelectorAll('#audit-report-modal').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.id = 'audit-report-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.7); z-index: 20000;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Microsoft YaHei', sans-serif;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #1e1e28; color: #e0e0e0;
            width: 85vw; max-width: 1100px; height: 80vh;
            border-radius: 14px; padding: 0;
            box-shadow: 0 8px 40px rgba(0,0,0,0.8);
            border: 2px solid rgba(255,215,0,0.4);
            display: flex; flex-direction: column;
            overflow: hidden;
        `;

        const infoOnly = totalIssues === 0 && orphanCities.length === 0 && singleRoadCities.length === 0 && unlinkedBattlefields.length === 0;
        this.problemRoadIds = [];
        this.problemPointIds = [];
        this.problemRoadIdx = -1;
        const okBadge = infoOnly ? '✅' : '⚠';
        const titleColor = infoOnly ? '#4caf50' : '#ff9800';
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 18px 24px; background: rgba(255,215,0,0.08);
            border-bottom: 1px solid rgba(255,215,0,0.2);
            display: flex; justify-content: space-between; align-items: center;
        `;
        header.innerHTML = `
            <div>
                <div style="font-size:20px;font-weight:bold;color:${titleColor};">${okBadge} 道路全面审查报告</div>
                <div style="font-size:13px;color:#aaa;margin-top:4px;">
                    📊 道路总数 <b style="color:#fff">${totalRoads}</b> ·
                    问题总数 <b style="color:${totalIssues > 0 ? '#ff9800' : '#4caf50'}">${totalIssues}</b> ·
                    孤儿城 <b style="color:${orphanCities.length > 0 ? '#ff9800' : '#4caf50'}">${orphanCities.length}</b> ·
                    单路据点 <b style="color:${singleRoadCities.length > 0 ? '#ff9800' : '#4caf50'}">${singleRoadCities.length}</b> ·
                    未连路战场 <b style="color:${unlinkedBattlefields.length > 0 ? '#e040fb' : '#4caf50'}">${unlinkedBattlefields.length}</b>
                </div>
            </div>
            <button id="audit-close-btn" style="
                background:rgba(255,255,255,0.1); color:#e0e0e0; border:none;
                padding:8px 16px; border-radius:6px; cursor:pointer; font-size:14px;
            ">✕ 关闭</button>
        `;
        modal.appendChild(header);

        const body = document.createElement('div');
        body.style.cssText = `
            flex: 1; overflow-y: auto; padding: 16px 24px;
            font-size: 13px; line-height: 1.6;
        `;

        // [2026-05-30] 行可点击 → 关模态 + 定位道路
        // rows 改为 {html, roadId} 数组, 每行带 data-road-id
        const section = (title: string, color: string, count: number, items: Array<{ html: string; roadId: string }>) => {
            if (count === 0) return '';
            const rowsHtml = items.map(it => `
                <div class="audit-row" data-road-id="${it.roadId}" style="
                    padding:8px 12px; border-left:3px solid ${color}; margin:4px 0;
                    background:rgba(255,255,255,0.03); border-radius:4px;
                    cursor:pointer; transition: background 0.15s;
                ">
                    ${it.html}
                    <button class="audit-locate" data-road-id="${it.roadId}" style="
                        background:${color}; color:#fff; border:none; border-radius:4px;
                        padding:3px 10px; cursor:pointer; font-size:12px; margin-left:8px;
                        float:right;
                    ">👁 看</button>
                    <div style="clear:both;"></div>
                </div>
            `).join('');
            return `
                <div style="margin-bottom:18px;">
                    <div style="font-size:15px;font-weight:bold;color:${color};margin-bottom:6px;">
                        ${title} <span style="background:${color};color:#000;border-radius:10px;padding:1px 8px;font-size:12px;margin-left:6px;">${count}</span>
                    </div>
                    <div>${rowsHtml}</div>
                </div>
            `;
        };

        const citySection = (title: string, color: string, count: number, items: Array<{ html: string; cityId: string }>) => {
            if (count === 0) return '';
            const rowsHtml = items.map(it => `
                <div class="audit-city-row" data-city-id="${it.cityId}" style="
                    padding:8px 12px; border-left:3px solid ${color}; margin:4px 0;
                    background:rgba(255,255,255,0.03); border-radius:4px;
                    cursor:pointer; transition: background 0.15s;
                ">
                    ${it.html}
                    <button class="audit-city-locate" data-city-id="${it.cityId}" style="
                        background:${color}; color:#fff; border:none; border-radius:4px;
                        padding:3px 10px; cursor:pointer; font-size:12px; margin-left:8px;
                        float:right;
                    ">👁 看</button>
                    <div style="clear:both;"></div>
                </div>
            `).join('');
            return `
                <div style="margin-bottom:18px;">
                    <div style="font-size:15px;font-weight:bold;color:${color};margin-bottom:6px;">
                        ${title} <span style="background:${color};color:#000;border-radius:10px;padding:1px 8px;font-size:12px;margin-left:6px;">${count}</span>
                    </div>
                    <div>${rowsHtml}</div>
                </div>
            `;
        };

        let html = '';

        if (infoOnly) {
            html = `
                <div style="text-align:center;padding:60px 20px;">
                    <div style="font-size:60px;margin-bottom:16px;">🎉</div>
                    <div style="font-size:18px;color:#4caf50;margin-bottom:8px;">所有 ${totalRoads} 条道路审查通过</div>
                    <div style="color:#aaa;">✓ 端点完整 ✓ 无据点变更拉伸线 ✓ 无自环 ✓ 无重叠 (30% 阈值) ✓ 无孤儿城 ✓ 无单路据点</div>
                </div>
            `;
        } else {
            // [2026-05-30] 收集所有问题路 id (供编辑器内 ◀ ▶ 导航用)
            const allProblemIds: string[] = [];

            // [2026-06-19] 据点变更拉伸线 — 优先展示（截图里那种超长橙线）
            const sortedStale = issues.staleStretchLines.slice().sort((a: any, b: any) => b.maxSegmentKm - a.maxSegmentKm);
            const staleItems = sortedStale.slice(0, 50).map((s: any) => {
                allProblemIds.push(s.id);
                const reasonTag = s.reason === 'segmentJump'
                    ? '超长跳段'
                    : s.reason === 'both' ? '漂移+跳段' : '端点漂移';
                const spanTag = `<span style="background:rgba(244,67,54,0.5);color:#fff;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:bold;margin-right:8px;">${s.maxSegmentKm} km 段</span>`;
                return {
                    html: `${spanTag}<b>${s.name}</b> · <b>${s.startName}</b> ↔ <b>${s.endName}</b> <span style="color:#ffab91;font-size:11px;">${reasonTag}</span><br>`
                        + `<span style="color:#aaa;font-size:12px;margin-left:16px;">└ 最长段 ${s.maxSegmentKm}km · 路径 ${s.pathKm}km · 两城现距 ${s.cityDirectKm}km · 几何跨度 ${s.geomSpanKm}km · 起漂 ${s.startDriftKm}km 终漂 ${s.endDriftKm}km · ${s.pointCount} 点</span>`
                        + `<span style="color:#666;font-size:11px;"> [${s.id}]</span>`,
                    roadId: s.id,
                };
            });
            html += section(
                '📐 据点变更拉伸线 (城已挪走, 道路仍拴旧坐标 → 地图超长直线)',
                '#f44336',
                issues.staleStretchLines.length,
                staleItems,
            );

            // [2026-05-30 删除] 旧直线检测已停用

            // 重叠 (30% 阈值)
            // [2026-05-30 v3] 按重叠点数降序: 重叠点最多的在最上面
            // (1 点重叠已过滤掉, 是端共享 NE 节点的正常情况)
            const sortedDups = issues.duplicates.slice().sort((a: any, b: any) => {
                return (b.overlapPoints || 0) - (a.overlapPoints || 0); // 降序
            });
            const dupItems = sortedDups.slice(0, 50).map((d: any) => {
                allProblemIds.push(d.deleteId);
                const pts = d.overlapPoints || 0;
                const maxR = Math.max(d.ratioA || 0, d.ratioB || 0);
                const ptTag = `<span style="background:rgba(233,30,99,0.4);color:#fff;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:bold;margin-right:8px;">${pts} 点</span>`;
                const pctTag = `<span style="background:rgba(233,30,99,0.2);color:#ff80a0;border-radius:6px;padding:1px 6px;font-size:10px;margin-right:6px;">${(maxR*100).toFixed(0)}%</span>`;
                return {
                    html: `${ptTag}${pctTag}保留 <b style="color:#4caf50">"${d.keepName}"</b> ✓ &nbsp; 删 <b style="color:#f44336">"${d.deleteName}"</b> ✗<br><span style="color:#aaa;font-size:12px;margin-left:16px;">└ ${d.reason}</span>`,
                    roadId: d.deleteId,
                };
            });
            html += section('❌ 重复/重叠路 (按重叠点数降序, ≥2 点 ≥30%)', '#e91e63', issues.duplicates.length, dupItems);

            // 自环
            const selfLoopItems = issues.sameStartEnd.map((i: any) => {
                allProblemIds.push(i.id);
                return { html: `<b>${i.name}</b> · 起=终 = "${i.ref}" <span style="color:#666;font-size:11px;">[${i.id}]</span>`, roadId: i.id };
            });
            html += section('❌ 自环路 (起=终)', '#9c27b0', issues.sameStartEnd.length, selfLoopItems);

            // start 指向不存在
            const invStartItems = issues.invalidStart.slice(0, 30).map((i: any) => {
                allProblemIds.push(i.id);
                return { html: `<b>${i.name}</b> · start="<span style="color:#ff5722">${i.ref}</span>" (城已删) <span style="color:#666;font-size:11px;">[${i.id}]</span>`, roadId: i.id };
            });
            html += section('❌ start 指向已删城', '#3f51b5', issues.invalidStart.length, invStartItems);
            const invEndItems = issues.invalidEnd.slice(0, 30).map((i: any) => {
                allProblemIds.push(i.id);
                return { html: `<b>${i.name}</b> · end="<span style="color:#ff5722">${i.ref}</span>" (城已删) <span style="color:#666;font-size:11px;">[${i.id}]</span>`, roadId: i.id };
            });
            html += section('❌ end 指向已删城', '#3f51b5', issues.invalidEnd.length, invEndItems);

            // 点数 < 2
            const fewPtsItems = issues.tooFewPoints.map((i: any) => {
                allProblemIds.push(i.id);
                return { html: `<b>${i.name}</b> · 只有 ${i.count} 个点 <span style="color:#666;font-size:11px;">[${i.id}]</span>`, roadId: i.id };
            });
            html += section('❌ 坐标点 < 2', '#607d8b', issues.tooFewPoints.length, fewPtsItems);

            // 据点压在别的路中间却没连上：定位到这条路，点开就能看到 B 在哪
            const onRoadItems = issues.cityOnRoad.slice(0, 80).map((i: any) => {
                allProblemIds.push(i.roadId);
                return {
                    html: `<span style="background:rgba(0,188,212,0.4);color:#fff;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:bold;margin-right:8px;">${i.distKm} km</span>`
                        + `<b>${i.startName}</b> ↔ <b>${i.endName}</b> 途经 <b style="color:#4dd0e1">${i.cityName}</b> 却没连 <span style="color:#666;font-size:11px;">[路 ${i.roadId}] [城 ${i.cityId}]</span>`,
                    roadId: i.roadId,
                };
            });
            html += section('🏙️ 据点压在路中间却没连上 (A-C 之间有 B, B 忘了连路)', '#00bcd4', issues.cityOnRoad.length, onRoadItems);

            // 一条陆路都没有，但附近有据点：定位到这座据点
            const noLandItems = issues.noLandRoad.slice(0, 80).map((i: any) => ({
                html: `<span style="background:rgba(255,87,34,0.4);color:#fff;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:bold;margin-right:8px;">${i.nearKm} km</span>`
                    + `<b>${i.cityName}</b> · 陆路 0 条${i.seaCount > 0 ? ` · 海路 ${i.seaCount} 条` : ''} · 最近据点 <b>${i.nearName}</b> <span style="color:#666;font-size:11px;">[${i.cityId}]</span>`,
                cityId: i.cityId,
            }));
            html += citySection(`🚫 一条陆路都没有 (${VectorRoadEditor.NO_LAND_ROAD_NEIGHBOR_KM}km 内有据点)`, '#ff5722', issues.noLandRoad.length, noLandItems);

            // 孤儿城：没有任何道路连接的据点（信息项，非道路错误）
            const orphanItems = orphanCities.slice(0, 80).map(c => ({
                html: `<b>${c.name}</b> · (${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}) <span style="color:#666;font-size:11px;">[${c.id}]</span>`,
                cityId: c.id,
            }));
            html += citySection('📋 孤儿城 (无路连接)', '#ff9800', orphanCities.length, orphanItems);
            if (orphanCities.length > 80) {
                html += `<div style="color:#888;font-size:12px;margin-bottom:12px;">… 另有 ${orphanCities.length - 80} 座，见 F12 控制台完整列表</div>`;
            }

            // 🔴 [2026-09-24] 未连路的战场：点 👁 定位 → 点地图上的 ⚔ 标记与据点一样选端点，画一条支线接到史料来路
            const bfItems = unlinkedBattlefields.slice().sort((a, b) => a.scriptYear - b.scriptYear).map((b) => ({
                html: `<b>⚔${b.name}</b> · ${b.scriptYear < 0 ? `前${-b.scriptYear}年` : `${b.scriptYear}年`} · (${b.lat.toFixed(2)}, ${b.lng.toFixed(2)}) <span style="color:#666;font-size:11px;">[${b.id}]</span>`,
                cityId: b.id,
            }));
            html += citySection('⚔ 未连路的战场 (画一条支线接到史料里大军来的那条路)', '#e040fb', unlinkedBattlefields.length, bfItems);

            const singleRoadItems = singleRoadCities.slice(0, 80).map(c => ({
                html: `<b>${c.name}</b> · 仅连 <span style="color:${c.kind === '海' ? '#4fc3f7' : '#ffb74d'}">${c.kind === '海' ? '🚢' : '🛣️'} ${c.roadName}</span> ↔ <b>${c.peerName}</b> <span style="color:#666;font-size:11px;">[${c.id}]</span>`,
                cityId: c.id,
            }));
            html += citySection('🛤️ 单路据点 (仅 1 条路，正常应 ≥2)', '#ff9800', singleRoadCities.length, singleRoadItems);
            if (singleRoadCities.length > 80) {
                html += `<div style="color:#888;font-size:12px;margin-bottom:12px;">… 另有 ${singleRoadCities.length - 80} 座，见 F12 控制台完整列表</div>`;
            }

            // [2026-05-30 新] 端点漂移 (城坐标改了/移走了)
            const sortedDrift = issues.endpointDrift.slice().sort((a: any, b: any) => b.driftKm - a.driftKm);
            const driftItems = sortedDrift.slice(0, 30).map((i: any) => {
                allProblemIds.push(i.id);
                const dTag = `<span style="background:rgba(255,152,0,0.4);color:#fff;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:bold;margin-right:8px;">${i.driftKm} km</span>`;
                const endTag = i.whichEnd === 'start' ? '起' : '终';
                return {
                    html: `${dTag}<b>${i.name}</b> · <span style="color:#ff9800">${endTag}点</span>城 <b>${i.cityName}</b> 已移走 ${i.driftKm}km <span style="color:#666;font-size:11px;">[${i.id}]</span>`,
                    roadId: i.id,
                };
            });
            html += section('🚶 端点漂移 (城已移, 拉伸不显著)', '#ff9800', issues.endpointDrift.length, driftItems);

            // [2026-05-30 删除] 名称过期检测停用 (用户公理: 不影响功能)

            // 把问题路 id 列表存到编辑器, 供 [◀ 上问题/下问题 ▶] 用；点项（未连路战场、孤儿城）排在后面
            this.problemRoadIds = allProblemIds;
            this.problemPointIds = [
                ...issues.noLandRoad.map((i: any) => i.cityId),
                ...unlinkedBattlefields.map((b) => b.id),
                ...orphanCities.map((c) => c.id),
            ];

            if (totalIssues > 0) {
                html += `
                    <div style="margin-top:24px;padding:14px 18px;background:rgba(76,175,80,0.1);border-left:4px solid #4caf50;border-radius:6px;">
                        <div style="font-weight:bold;color:#4caf50;margin-bottom:6px;">下一步操作</div>
                        <div style="color:#ccc;line-height:1.8;">
                            1. 优先处理 <b style="color:#f44336">据点变更拉伸线</b>：删除该路后按新城位重画，或点 <b>🔧 修端点</b><br>
                            2. 在下拉框选中问题路，逐条 <b>删除</b> 或 <b>改端点</b> 修复<br>
                            3. 看 <b style="color:#e91e63">重叠</b> 项: 如重叠源于据点过近, 考虑移据点 ≥50km<br>
                            4. 控制台 F12 有完整列表 (超过 80 条的部分)
                        </div>
                    </div>
                `;
            } else if (orphanCities.length > 0 || singleRoadCities.length > 0 || unlinkedBattlefields.length > 0) {
                html += `
                    <div style="margin-top:24px;padding:14px 18px;background:rgba(255,152,0,0.1);border-left:4px solid #ff9800;border-radius:6px;">
                        <div style="font-weight:bold;color:#ff9800;margin-bottom:6px;">路网补全提示</div>
                        <div style="color:#ccc;line-height:1.8;">
                            道路数据无结构性错误。上方 <b>孤儿城</b> / <b>单路据点</b> / <b>未连路战场</b> 为连通性提示。<br>
                            建议: 点 👁 定位 → 手动画路，或点 <b>🔗 自动连</b> 批量补网。
                        </div>
                    </div>
                `;
            }
        }

        body.innerHTML = html;
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 关闭逻辑
        const close = () => overlay.remove();
        document.getElementById('audit-close-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
        });

        // [2026-05-30] 点击行 / 👁 看 按钮 → 关闭模态 + 选中道路定位
        const goToRoad = (roadId: string) => {
            if (!roadId) return;
            close();
            this.selectRoad(roadId);
            if (this.roadSelect) this.roadSelect.value = roadId;
        };
        overlay.querySelectorAll('.audit-locate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                goToRoad((e.currentTarget as HTMLElement).dataset.roadId || '');
            });
        });
        overlay.querySelectorAll('.audit-row').forEach(row => {
            row.addEventListener('mouseenter', () => {
                (row as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
            });
            row.addEventListener('mouseleave', () => {
                (row as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
            });
            row.addEventListener('click', (e) => {
                goToRoad((e.currentTarget as HTMLElement).dataset.roadId || '');
            });
        });

        const goToCity = (cityId: string) => {
            if (!cityId) return;
            const ep = findEndpoint(cityId);   // 据点或战场，同一种定位
            if (!ep) return;
            close();
            this.locatePoint(ep.lat, ep.lng, endpointLabel(ep));
        };
        overlay.querySelectorAll('.audit-city-locate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                goToCity((e.currentTarget as HTMLElement).dataset.cityId || '');
            });
        });
        overlay.querySelectorAll('.audit-city-row').forEach(row => {
            row.addEventListener('mouseenter', () => {
                (row as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
            });
            row.addEventListener('mouseleave', () => {
                (row as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
            });
            row.addEventListener('click', (e) => {
                goToCity((e.currentTarget as HTMLElement).dataset.cityId || '');
            });
        });

    }

    /** 各据点连接的道路条数（start/end 各计 1） */
    /**
     * 每座城的连接数 —— **陆路 + 海路一起算**。
     *
     * 🔴 [2026-08-26 主人：「马六甲连接了海路，也连接了陆路，为什么审查还有问题？
     *    你没有把海路和陆路一起算吗」] 原来只遍历 VECTOR_ROAD_DATA，海路完全没数。
     *    实测马六甲：陆路 1 条 + 海路 1 条 = 2 条，却因为只数到陆路那 1 条被报「单路据点」。
     *    港口城本来就靠海路连通（见 SEA_ROUTE_DATA），只数陆路必然误报一片沿海城。
     *    海路要素与陆路同结构，一样有 startConnection / endConnection，直接并进来即可。
     */
    private getCityConnectionBreakdown(): Map<string, { land: number; sea: number }> {
        const out = new Map<string, { land: number; sea: number }>();
        const bump = (id: string | undefined, kind: 'land' | 'sea'): void => {
            if (!id) return;
            const cur = out.get(id) ?? { land: 0, sea: 0 };
            cur[kind]++;
            out.set(id, cur);
        };
        for (const f of VECTOR_ROAD_DATA.features) {
            if (!f?.properties) continue;
            bump(f.properties.startConnection, 'land');
            bump(f.properties.endConnection, 'land');
        }
        for (const f of SEA_ROUTE_DATA.features) {
            if (!f?.properties) continue;
            bump(f.properties.startConnection, 'sea');
            bump(f.properties.endConnection, 'sea');
        }
        return out;
    }

    /** 连接总数（陆 + 海）。判「孤儿城 / 单路据点」一律用这个，别再只数陆路。 */
    private getCityRoadConnectionCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const [id, b] of this.getCityConnectionBreakdown()) {
            counts.set(id, b.land + b.sea);
        }
        return counts;
    }


    /** 据点离路多近算「压在路上」(km)。据点间距 ≥40km，4km 内基本就是路穿过城 */
    private static readonly CITY_ON_ROAD_KM = 4;

    /**
     * 找出「压在别的路中间却不是该路端点」的据点：A-C 之间有 B，B 忘了连路。
     * 用 0.25° 网格把据点分桶，每段只查附近桶，不做 据点×线段 全对比。
     */
    private findCitiesOnRoads(): Array<{ roadId: string; roadName: string; startName: string; endName: string; cityId: string; cityName: string; distKm: number }> {
        const limitKm = VectorRoadEditor.CITY_ON_ROAD_KM;
        const CELL = 0.25;
        const key = (cx: number, cy: number) => `${cx},${cy}`;
        const grid = new Map<string, typeof CITIES>();
        for (const c of CITIES) {
            const k = key(Math.floor(c.lng / CELL), Math.floor(c.lat / CELL));
            const arr = grid.get(k);
            if (arr) arr.push(c); else grid.set(k, [c] as any);
        }
        const padDeg = limitKm / 111 + 0.01;
        const out: ReturnType<VectorRoadEditor['findCitiesOnRoads']> = [];

        for (const f of VECTOR_ROAD_DATA.features) {
            if (!f?.properties || !f.geometry) continue;
            const coords = f.geometry.coordinates as [number, number][];
            if (coords.length < 2) continue;
            const startId = f.properties.startConnection;
            const endId = f.properties.endConnection;
            const best = new Map<string, number>();

            for (let i = 0; i < coords.length - 1; i++) {
                const [lngA, latA] = coords[i];
                const [lngB, latB] = coords[i + 1];
                const x0 = Math.floor((Math.min(lngA, lngB) - padDeg) / CELL);
                const x1 = Math.floor((Math.max(lngA, lngB) + padDeg) / CELL);
                const y0 = Math.floor((Math.min(latA, latB) - padDeg) / CELL);
                const y1 = Math.floor((Math.max(latA, latB) + padDeg) / CELL);
                for (let cx = x0; cx <= x1; cx++) {
                    for (let cy = y0; cy <= y1; cy++) {
                        const cell = grid.get(key(cx, cy));
                        if (!cell) continue;
                        for (const c of cell) {
                            if (c.id === startId || c.id === endId) continue;
                            const d = this.pointToSegmentKm(c.lat, c.lng, latA, lngA, latB, lngB);
                            if (d > limitKm) continue;
                            const prev = best.get(c.id);
                            if (prev === undefined || d < prev) best.set(c.id, d);
                        }
                    }
                }
            }
            if (best.size === 0) continue;

            const roadName = f.properties.name || '(未命名)';
            const startName = findEndpoint(startId)?.name ?? '?';
            const endName = findEndpoint(endId)?.name ?? '?';
            for (const [cityId, d] of best) {
                const city = CITIES.find(c => c.id === cityId);
                out.push({
                    roadId: f.properties.id, roadName, startName, endName,
                    cityId, cityName: city?.name ?? cityId, distKm: Math.round(d * 10) / 10,
                });
            }
        }
        return out;
    }

    /** 点到线段的最短距离 (km)，局部等距投影，几十 km 内够准 */
    private pointToSegmentKm(pLat: number, pLng: number, aLat: number, aLng: number, bLat: number, bLng: number): number {
        const kx = 111.32 * Math.cos(pLat * Math.PI / 180);
        const ky = 110.57;
        const ax = (aLng - pLng) * kx, ay = (aLat - pLat) * ky;
        const bx = (bLng - pLng) * kx, by = (bLat - pLat) * ky;
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
        return Math.hypot(ax + t * dx, ay + t * dy);
    }

    /** 附近多远内有据点，就认为这座城该有陆路 (km) */
    private static readonly NO_LAND_ROAD_NEIGHBOR_KM = 300;

    /**
     * 一条陆路都没有、但 NO_LAND_ROAD_NEIGHBOR_KM 内有别的据点的城（只连海路的也算）。
     * 只认「同一块陆地上」的邻城：从城所在陆地沿海陆掩膜洪水填充，邻城落在填到的格子里才算。
     * 岛上的城到不了大陆，本来就修不了陆路，不报；隔着海湾的同一大陆邻城照样算。
     * 掩膜没载到时没法分岛，宁可不报（避免一片岛城误报）。
     */
    private findCitiesWithoutLandRoad(): Array<{ cityId: string; cityName: string; seaCount: number; nearId: string; nearName: string; nearKm: number }> {
        const limitKm = VectorRoadEditor.NO_LAND_ROAD_NEIGHBOR_KM;
        if (!this.landMaskReady) return [];
        const breakdown = this.getCityConnectionBreakdown();
        const out: ReturnType<VectorRoadEditor['findCitiesWithoutLandRoad']> = [];
        for (const c of CITIES) {
            const b = breakdown.get(c.id);
            if (b && b.land > 0) continue;
            const sameLand = this.landRegionAround(c.lat, c.lng, limitKm);
            let near: (typeof CITIES)[number] | null = null;
            let nearKm = Infinity;
            for (const o of CITIES) {
                if (o.id === c.id) continue;
                if (Math.abs(o.lat - c.lat) > limitKm / 110) continue;   // 先按纬度粗筛
                const d = this.haversine(c.lat, c.lng, o.lat, o.lng);
                if (d > limitKm || d >= nearKm) continue;
                if (!sameLand(o.lat, o.lng)) continue;
                nearKm = d; near = o;
            }
            if (!near || nearKm > limitKm) continue;
            out.push({
                cityId: c.id, cityName: c.name, seaCount: b?.sea ?? 0,
                nearId: near.id, nearName: near.name, nearKm: Math.round(nearKm),
            });
        }
        return out.sort((a, b) => a.nearKm - b.nearKm);
    }

    /**
     * 以 (lat,lng) 为中心、半径 radiusKm 的方框里，沿海陆掩膜洪水填充出这座城所在的那块陆地，
     * 返回「某点是否在这块陆地上」的判定。沿海城的坐标常落在水格上，起点 / 查询点都就近 2 格找陆地。
     */
    private landRegionAround(lat: number, lng: number, radiusKm: number): (qLat: number, qLng: number) => boolean {
        const STEP = 0.03;   // ≈ 掩膜分辨率 (180°/6000)
        const halfLat = radiusKm / 111;
        const halfLng = Math.min(180, radiusKm / (111 * Math.max(0.1, Math.cos(lat * Math.PI / 180))));
        const nx = Math.ceil(2 * halfLng / STEP) + 1;
        const ny = Math.ceil(2 * halfLat / STEP) + 1;
        const lng0 = lng - halfLng, lat0 = lat - halfLat;
        const cellOf = (qLat: number, qLng: number): [number, number] =>
            [Math.round((qLng - lng0) / STEP), Math.round((qLat - lat0) / STEP)];
        const inBox = (x: number, y: number) => x >= 0 && y >= 0 && x < nx && y < ny;
        const landAt = (x: number, y: number) => isLand(lat0 + y * STEP, lng0 + x * STEP);
        const filled = new Uint8Array(nx * ny);
        const nearestLand = (x: number, y: number, test: (x: number, y: number) => boolean): number => {
            for (let r = 0; r <= 2; r++) {
                for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if (inBox(xx, yy) && test(xx, yy)) return yy * nx + xx;
                }
            }
            return -1;
        };

        const [sx, sy] = cellOf(lat, lng);
        const start = nearestLand(sx, sy, landAt);
        if (start < 0) return () => false;
        const stack = [start];
        filled[start] = 1;
        while (stack.length) {
            const i = stack.pop()!;
            const x = i % nx, y = (i - x) / nx;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const xx = x + dx, yy = y + dy;
                if (!inBox(xx, yy)) continue;
                const j = yy * nx + xx;
                if (filled[j] || !landAt(xx, yy)) continue;
                filled[j] = 1;
                stack.push(j);
            }
        }
        return (qLat, qLng) => {
            const [qx, qy] = cellOf(qLat, qLng);
            return nearestLand(qx, qy, (x, y) => filled[y * nx + x] === 1) >= 0;
        };
    }

    /** 没有任何道路 start/end 连接的据点 */
    private getOrphanCities(): Array<{ id: string; name: string; lat: number; lng: number }> {
        const counts = this.getCityRoadConnectionCounts();
        return CITIES
            .filter(c => !counts.has(c.id))
            .map(c => ({ id: c.id, name: c.name, lat: c.lat, lng: c.lng }));
    }

    /** 仅连接 1 条道路的据点（正常路网一般 ≥2） */
    private getSingleRoadCities(): Array<{
        id: string; name: string; lat: number; lng: number;
        roadName: string; peerName: string; roadId: string; kind: '陆' | '海';
    }> {
        const counts = this.getCityRoadConnectionCounts();
        const cityById = new Map(CITIES.map(c => [c.id, c]));
        const result: Array<{
            id: string; name: string; lat: number; lng: number;
            roadName: string; peerName: string; roadId: string; kind: '陆' | '海';
        }> = [];

        for (const city of CITIES) {
            if ((counts.get(city.id) ?? 0) !== 1) continue;
            let roadName = '(未命名)';
            let peerName = '?';
            let roadId = '';
            let kind: '陆' | '海' = '陆';
            // 🔴 [2026-08-26] 陆路找不到就去海路找 —— 只有一条海路的港口城
            //    （陆路 0 条）原来会显示「(未命名)」，看不出它到底连到哪。
            const pools: Array<{ feats: readonly any[]; kind: '陆' | '海' }> = [
                { feats: VECTOR_ROAD_DATA.features, kind: '陆' },
                { feats: SEA_ROUTE_DATA.features, kind: '海' },
            ];
            outer: for (const pool of pools) {
                for (const f of pool.feats) {
                    if (!f?.properties) continue;
                    const start = f.properties.startConnection;
                    const end = f.properties.endConnection;
                    if (start !== city.id && end !== city.id) continue;
                    roadId = f.properties.id || '';
                    roadName = f.properties.name || roadName;
                    const peerId = start === city.id ? end : start;
                    peerName = (peerId ? cityById.get(peerId)?.name : undefined) ?? peerId ?? '?';
                    kind = pool.kind;
                    break outer;
                }
            }
            result.push({
                id: city.id,
                name: city.name,
                lat: city.lat,
                lng: city.lng,
                roadName,
                peerName,
                roadId,
                kind,
            });
        }
        return result.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    }

    /** 🛤️ 单路据点：仅 1 条路连接的城（独立按钮，亦见全面审查） */
    private reportSingleRoadCities(): void {
        const singles = this.getSingleRoadCities();
        console.group(`🛤️ [单路据点] ${singles.length} 座（仅 1 条路，正常应 ≥2）`);
        singles.forEach(c => console.log(`  ${c.name}  [${c.id}]  → [${c.kind}] ${c.roadName} ↔ ${c.peerName}`));
        console.groupEnd();

        if (singles.length === 0) {
            this.setStatus(`✅ 全部 ${CITIES.length} 座据点均连接 ≥2 条路`);
            alert(`✅ 无单路据点\n\n共 ${CITIES.length} 座城，每座至少连接 2 条道路。`);
            return;
        }

        this.setStatus(`⚠ ${singles.length} 座单路据点（仅 1 条路）`);
        this.showCityListModal({
            title: '🛤️ 单路据点',
            subtitle: `仅连接 1 条道路 · 共 ${singles.length} 座（正常应 ≥2）`,
            color: '#ff9800',
            items: singles.map(c => ({
                cityId: c.id,
                html: `<b>${c.name}</b> · 仅连 <span style="color:${c.kind === '海' ? '#4fc3f7' : '#ffb74d'}">${c.kind === '海' ? '🚢' : '🛣️'} ${c.roadName}</span> ↔ <b>${c.peerName}</b> <span style="color:#666;font-size:11px;">[${c.id}]</span>`,
            })),
            hint: '建议补第二条路或检查是否为路网末梢/待删据点。',
        });
    }

    /** 据点列表模态（单路据点等） */
    private showCityListModal(opts: {
        title: string;
        subtitle: string;
        color: string;
        items: Array<{ cityId: string; html: string }>;
        hint?: string;
    }): void {
        document.querySelectorAll('#city-list-modal').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.id = 'city-list-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.7); z-index: 20000;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Microsoft YaHei', sans-serif;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #1e1e28; color: #e0e0e0;
            width: 85vw; max-width: 900px; height: 75vh;
            border-radius: 14px; overflow: hidden;
            box-shadow: 0 8px 40px rgba(0,0,0,0.8);
            border: 2px solid rgba(255,152,0,0.4);
            display: flex; flex-direction: column;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 18px 24px; background: rgba(255,152,0,0.08);
            border-bottom: 1px solid rgba(255,152,0,0.2);
            display: flex; justify-content: space-between; align-items: center;
        `;
        header.innerHTML = `
            <div>
                <div style="font-size:20px;font-weight:bold;color:${opts.color};">${opts.title}</div>
                <div style="font-size:13px;color:#aaa;margin-top:4px;">${opts.subtitle}</div>
            </div>
            <button id="city-list-close-btn" style="
                background:rgba(255,255,255,0.1); color:#e0e0e0; border:none;
                padding:8px 16px; border-radius:6px; cursor:pointer; font-size:14px;
            ">✕ 关闭</button>
        `;
        modal.appendChild(header);

        const body = document.createElement('div');
        body.style.cssText = 'flex:1; overflow-y:auto; padding:16px 24px; font-size:13px;';
        const rowsHtml = opts.items.map(it => `
            <div class="city-list-row" data-city-id="${it.cityId}" style="
                padding:8px 12px; border-left:3px solid ${opts.color}; margin:4px 0;
                background:rgba(255,255,255,0.03); border-radius:4px; cursor:pointer;
            ">
                ${it.html}
                <button class="city-list-locate" data-city-id="${it.cityId}" style="
                    background:${opts.color}; color:#fff; border:none; border-radius:4px;
                    padding:3px 10px; cursor:pointer; font-size:12px; margin-left:8px; float:right;
                ">👁 看</button>
                <div style="clear:both;"></div>
            </div>
        `).join('');
        body.innerHTML = rowsHtml + (opts.hint
            ? `<div style="margin-top:16px;padding:12px;background:rgba(255,152,0,0.1);border-radius:6px;color:#ccc;">${opts.hint}</div>`
            : '');
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        document.getElementById('city-list-close-btn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        const goToCity = (cityId: string) => {
            const ep = findEndpoint(cityId);
            if (!ep) return;
            close();
            this.locatePoint(ep.lat, ep.lng, endpointLabel(ep));
        };
        overlay.querySelectorAll('.city-list-locate, .city-list-row').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                goToCity((e.currentTarget as HTMLElement).dataset.cityId || '');
            });
        });
    }

    /** 算路径总长度 (km，haversine 求和) */
    private computePathLength(coords: [number, number][]): number {
        let total = 0;
        for (let i = 1; i < coords.length; i++) {
            total += this.haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
        }
        return total;
    }

    private auditRoads(): void {
        const features = VECTOR_ROAD_DATA.features;
        const validCityIds = ALL_ENDPOINT_IDS();

        const issues = {
            missingStart: [] as Array<{ id: string; name: string }>,
            missingEnd: [] as Array<{ id: string; name: string }>,
            invalidStart: [] as Array<{ id: string; name: string; ref: string }>,
            invalidEnd: [] as Array<{ id: string; name: string; ref: string }>,
            sameStartEnd: [] as Array<{ id: string; name: string; ref: string }>,
            tooFewPoints: [] as Array<{ id: string; name: string; count: number }>,
        };

        for (const f of features) {
            if (!f || !f.properties) continue;
            const id = f.properties.id || '(无 ID)';
            const name = f.properties.name || '(未命名)';
            const startId = f.properties.startConnection;
            const endId = f.properties.endConnection;
            const coords = (f.geometry?.coordinates || []) as [number, number][];

            if (!startId) {
                issues.missingStart.push({ id, name });
            } else if (!validCityIds.has(startId)) {
                issues.invalidStart.push({ id, name, ref: startId });
            }

            if (!endId) {
                issues.missingEnd.push({ id, name });
            } else if (!validCityIds.has(endId)) {
                issues.invalidEnd.push({ id, name, ref: endId });
            }

            if (startId && endId && startId === endId) {
                issues.sameStartEnd.push({ id, name, ref: startId });
            }

            if (coords.length < 2) {
                issues.tooFewPoints.push({ id, name, count: coords.length });
            }
        }

        const total = features.length;
        const problemCount =
            issues.invalidStart.length + issues.invalidEnd.length +
            issues.sameStartEnd.length + issues.tooFewPoints.length;

        // 控制台分组详情
        console.group(`🔍 [AuditRoads] 道路审计 — 总 ${total} 条，问题 ${problemCount} 条`);

        if (issues.invalidStart.length > 0) {
            console.group(`⚠ startConnection 指向不存在的城 (${issues.invalidStart.length})`);
            issues.invalidStart.forEach(i => console.log(`  ${i.name}  → start="${i.ref}" 不存在`));
            console.groupEnd();
        }
        if (issues.invalidEnd.length > 0) {
            console.group(`⚠ endConnection 指向不存在的城 (${issues.invalidEnd.length})`);
            issues.invalidEnd.forEach(i => console.log(`  ${i.name}  → end="${i.ref}" 不存在`));
            console.groupEnd();
        }
        if (issues.sameStartEnd.length > 0) {
            console.group(`⚠ 起点=终点 (自环) (${issues.sameStartEnd.length})`);
            issues.sameStartEnd.forEach(i => console.log(`  ${i.name}  → ${i.ref}`));
            console.groupEnd();
        }
        if (issues.tooFewPoints.length > 0) {
            console.group(`⚠ 坐标点不足 < 2 (${issues.tooFewPoints.length})`);
            issues.tooFewPoints.forEach(i => console.log(`  ${i.name}  只有 ${i.count} 个点`));
            console.groupEnd();
        }
        console.groupEnd();

        // Alert 摘要
        if (problemCount === 0) {
            this.setStatus(`✅ 审计通过：${total} 条道路全部完整`);
            alert(`✅ 道路审计通过\n\n总数: ${total} 条\n问题: 0\n\n所有道路起终点都正确，可以进入下一步（清理 / 自动连）。`);
        } else {
            this.setStatus(`⚠ 发现 ${problemCount} 条问题路 (按 F12 看详情)`);
            const lines: string[] = [
                `📊 道路总数: ${total}`,
                `📊 问题数: ${problemCount}`,
                ``,
            ];
            if (issues.invalidStart.length > 0) lines.push(`⚠ start 指向不存在的城: ${issues.invalidStart.length}`);
            if (issues.invalidEnd.length > 0) lines.push(`⚠ end 指向不存在的城: ${issues.invalidEnd.length}`);
            if (issues.sameStartEnd.length > 0) lines.push(`⚠ 起点=终点 (自环): ${issues.sameStartEnd.length}`);
            if (issues.tooFewPoints.length > 0) lines.push(`⚠ 坐标点 < 2: ${issues.tooFewPoints.length}`);
            lines.push(``);
            lines.push(`完整明细请按 F12 看控制台。`);
            lines.push(``);
            lines.push(`下一步建议: 点 🧹 清理 删除指向不存在城的道路。`);
            alert(`🔍 道路审计报告\n\n${lines.join('\n')}`);
        }
    }

    private cleanDanglingRoads(): void {
        this.setStatus('🧹 正在扫描悬挂道路...');

        // 收集所有有效端点 ID（据点 + 战场；战场支线不是悬空路）
        const validCityIds = ALL_ENDPOINT_IDS();

        // 找出悬挂道路
        const danglingIds: string[] = [];
        for (const feature of VECTOR_ROAD_DATA.features) {
            if (!feature || !feature.properties) continue;
            const startId = feature.properties.startConnection;
            const endId = feature.properties.endConnection;
            if (startId && !validCityIds.has(startId)) {
                danglingIds.push(feature.properties.id || '');
                console.log(`  🗑️ [CleanDangling] "${feature.properties.name}" start="${startId}" 不存在`);
            } else if (endId && !validCityIds.has(endId)) {
                danglingIds.push(feature.properties.id || '');
                console.log(`  🗑️ [CleanDangling] "${feature.properties.name}" end="${endId}" 不存在`);
            }
        }

        if (danglingIds.length === 0) {
            this.setStatus('✅ 无悬挂道路需要清理');
            return;
        }

        // 删除悬挂道路（从后往前删，避免索引问题）
        const removedIds = new Set(danglingIds);
        for (let i = VECTOR_ROAD_DATA.features.length - 1; i >= 0; i--) {
            const f = VECTOR_ROAD_DATA.features[i];
            if (f && f.properties && removedIds.has(f.properties.id)) {
                this.deleteRoad(f.properties.id);
            }
        }

        // 刷新 UI
        this.renderAllRoads();
        this.updateRoadSelect();
        this.setStatus(`🧹 已清理 ${danglingIds.length} 条悬挂道路（引用了已删除的据点）`);
    }

    // =====================================================================
    // [落路] 将无路城市的坐标微调到最近的道路线段上
    // =====================================================================

    /**
     * 📍 落路：遍历所有无路城市，找到最近的道路线段上的最近点，
     * 将城市坐标微调到该点，使得城市图标显示在道路线上。
     * 距离 < 50km 的直接微调坐标，>= 50km 的提示用 🚧 自动连 建路。
     */
    private snapCitiesToRoads(): void {
        this.setStatus('📍 正在将无路城市吸附到道路上...');

        // 1. 收集所有已连接城市
        const connectedCityIds = new Set<string>();
        for (const feature of VECTOR_ROAD_DATA.features) {
            if (feature.properties.startConnection) connectedCityIds.add(feature.properties.startConnection);
            if (feature.properties.endConnection) connectedCityIds.add(feature.properties.endConnection);
        }

        // 2. 找无路城市
        const orphanCities = CITIES.filter(c => !connectedCityIds.has(c.id));
        if (orphanCities.length === 0) {
            this.setStatus('✅ 所有城市都已在道路上');
            return;
        }

        let snapCount = 0;
        let farCount = 0;
        const details: string[] = [];
        const SNAP_THRESHOLD_KM = 50; // <50km 微调坐标

        for (const city of orphanCities) {
            // 找到最近的道路点（先查顶点，再查线段投影）
            let minDistKm = Infinity;
            let bestLat = city.lat;
            let bestLng = city.lng;

            for (const feature of VECTOR_ROAD_DATA.features) {
                const coords = feature.geometry.coordinates as [number, number][];
                if (coords.length === 0) continue;

                // 检查每个顶点
                for (const [lng, lat] of coords) {
                    const d = this.haversine(city.lat, city.lng, lat, lng);
                    if (d < minDistKm) {
                        minDistKm = d;
                        bestLat = lat;
                        bestLng = lng;
                    }
                }

                // 检查线段投影（可能比顶点更近）
                for (let i = 0; i < coords.length - 1; i++) {
                    const [lng1, lat1] = coords[i];
                    const [lng2, lat2] = coords[i + 1];
                    const closest = this.closestPointOnSegmentGeo(city.lat, city.lng, lat1, lng1, lat2, lng2);
                    const d = this.haversine(city.lat, city.lng, closest.lat, closest.lng);
                    if (d < minDistKm) {
                        minDistKm = d;
                        bestLat = closest.lat;
                        bestLng = closest.lng;
                    }
                }
            }

            const origLat = city.lat;
            const origLng = city.lng;

            if (minDistKm < SNAP_THRESHOLD_KM) {
                // 更新 CityManager 中的城市位置（运行时视觉更新）
                const gameCity = this.cityManager.getCity(city.id);
                if (gameCity) {
                    this.cityManager.updateCity(city.id, {
                        latitude: bestLat,
                        longitude: bestLng
                    });
                }
                // 更新源数据引用
                city.lat = bestLat;
                city.lng = bestLng;

                snapCount++;
                details.push(`  ✅ ${city.name}: ${minDistKm.toFixed(1)}km → 已微调`);
                console.log(`📍 [Snap] "${city.name}" (${origLat.toFixed(4)},${origLng.toFixed(4)}) → (${bestLat.toFixed(4)},${bestLng.toFixed(4)}) 偏差=${minDistKm.toFixed(1)}km`);
            } else {
                farCount++;
                details.push(`  🔸 ${city.name}: ${minDistKm.toFixed(0)}km (需建路)`);
            }
        }

        // 刷新城市渲染
        this.cityManager.refreshAll();

        // 输出详情
        console.log(`📍 [Snap] 落路结果:\n${details.join('\n')}`);

        if (farCount > 0) {
            this.setStatus(`📍 落路完成: ${snapCount} 个微调, ${farCount} 个距离远需点 🚧 自动连`);
        } else {
            this.setStatus(`📍 落路完成: ${snapCount} 个城市已吸附到道路上`);
        }
    }

    /**
     * 计算经纬度坐标下，点 P 到线段 AB 的最近点（平面近似，适用于 < 50km 距离）
     */
    private closestPointOnSegmentGeo(
        pLat: number, pLng: number,
        aLat: number, aLng: number,
        bLat: number, bLng: number
    ): { lat: number; lng: number } {
        const abLat = bLat - aLat;
        const abLng = bLng - aLng;
        const apLat = pLat - aLat;
        const apLng = pLng - aLng;
        const dot = apLat * abLat + apLng * abLng;
        const len2 = abLat * abLat + abLng * abLng;
        let t = len2 > 0 ? dot / len2 : 0;
        t = Math.max(0, Math.min(1, t));
        return {
            lat: aLat + t * abLat,
            lng: aLng + t * abLng
        };
    }

    // =====================================================================
    // [批量自动连接] 为无路城市自动创建道路
    // =====================================================================

    /**
     * [2026-05-30 重写] 两两相连 K-NN 自动连
     *
     * 旧逻辑: 只处理"孤儿"(没路的城), newlyConnected Set 空启动 → 第一个孤儿没候选 → 全部失败
     * 新逻辑: 对每个城求最近 K 个邻居, 没路的对就建路
     *
     * 设计:
     *   - K = NEAREST_K_PER_CITY (默认 2)  每城连最近 2 个邻居
     *   - 距离 ≤ connectDistanceKm (默认 250km) 跳过远邻
     *   - 已有路的对直接跳过 (不会重复建)
     *   - 走 NE 路网 (Dijkstra), 绕行 > 2.5× 拒绝
     *   - 单批次上限 BATCH_AUTO_CONNECT_LIMIT (默认 50)
     *
     * 最终拓扑 ≈ 2-NN 图 (每城连最近 2 个), 历史上的"邻里"关系会被还原
     */
    private async batchAutoConnect(): Promise<void> {
        const K = VectorRoadEditor.NEAREST_K_PER_CITY;
        const maxDistKm = this.connectDistanceKm;
        const LIMIT = VectorRoadEditor.BATCH_AUTO_CONNECT_LIMIT;

        // 区过滤: 全部跨区（自动连按钮已移除）
        const targetRegion: RegionType | null = null;
        const regionLabel = '全部跨区';

        // 把每个城贴上区标签 (按坐标 / 显式 region 字段)
        const cityRegion = new Map<string, RegionType>();
        for (const c of CITIES) {
            const r = getCityRegion({ latitude: c.lat, longitude: c.lng, region: (c as any).region });
            cityRegion.set(c.id, r);
        }
        // 候选集 = 全部 (若指定区, 则只该区的城), 否则全城
        const targetCities = targetRegion
            ? CITIES.filter(c => cityRegion.get(c.id) === targetRegion)
            : CITIES;

        console.group(`🔗 [AutoConnect-KNN] 区=${regionLabel} K=${K} maxDist=${maxDistKm}km limit=${LIMIT}`);
        console.log(`Phase 0: 区 ${regionLabel} 内有 ${targetCities.length} 城 (全图 ${CITIES.length})`);

        if (targetRegion && targetCities.length === 0) {
            this.setStatus(`⚠ ${regionLabel} 区 0 个城, 无法连接`);
            this.showInlineReport(`<div style="color:#ff5722">⚠ ${regionLabel} 区 0 个城</div>`);
            console.groupEnd();
            return;
        }

        // === Phase 1: 建立"已有路对"索引 (城A_城B → 已连接) ===
        const pairKey = (a: string, b: string) => [a, b].sort().join('|');
        const existingPairs = new Set<string>();
        for (const f of VECTOR_ROAD_DATA.features) {
            const s = f?.properties?.startConnection;
            const e = f?.properties?.endConnection;
            if (s && e) existingPairs.add(pairKey(s, e));
        }
        console.log(`Phase 1: 已有 ${existingPairs.size} 对城已连`);

        // === Phase 2: 向心树 — 每个非中心城找 1 个"离中心更近"的父节点 ===
        // [2026-05-30 改] K-NN → 向心树
        // 规则:
        //   1. 区中心不生成 outgoing (它们是树根)
        //   2. 每个非中心城找最佳父节点 = 离区中心更近 + 加权 score 最低
        //   3. 候选父必须 ≤250km 且离区中心比自己更近
        //   4. 找不到合格父 → 该城列入"无向心父"孤儿
        const allCenterIds = new Set(Object.values(REGION_CENTERS).flat());
        const isCenterFn = (cid: string) => allCenterIds.has(cid);
        const typeWFn = (other: any): number => {
            if (isCenterFn(other.id)) return VectorRoadEditor.REGION_CENTER_WEIGHT;
            return VectorRoadEditor.TYPE_WEIGHT[other.type] ?? 1.0;
        };

        // 构建: region → center city 对象
        const centersByRegion = new Map<string, any[]>();
        for (const [region, ids] of Object.entries(REGION_CENTERS)) {
            const cities = ids.map(id => CITIES.find(c => c.id === id)).filter(Boolean);
            centersByRegion.set(region, cities);
        }

        // 取某城所属区的"最近中心" (CENTRAL 有 2 个 → 选近的)
        const nearestCenterFor = (city: any): any | null => {
            const region = cityRegion.get(city.id) || 'CENTRAL';
            const centers = centersByRegion.get(region) || [];
            if (centers.length === 0) return null;
            if (centers.length === 1) return centers[0];
            // 多中心: 选最近
            return centers.slice().sort((a, b) =>
                this.haversine(city.lat, city.lng, a.lat, a.lng) -
                this.haversine(city.lat, city.lng, b.lat, b.lng)
            )[0];
        };

        // [2026-05-30 v4] 算法不变性: 每城的"算法父"是确定的
        // 改判断: 先算出该城的"算法父", 再看"该城←→算法父"这条特定边是否存在
        // - 存在: 跳过 (已满足算法)
        // - 不存在: 创建 (无论该城是否有其他手画路)
        //
        // 用户场景:
        //   鹤之城 的算法父 = 宇都宫 (确定)
        //   用户加 鹤之城-春日山 (用户自定义辅路, 不影响算法)
        //   算法: 鹤之城-宇都宫 不存在 → 创建 → 鹤之城 有 2 条 outgoing
        //   最终: 春日山(用户) + 宇都宫(算法) 并存

        const candidatePairs: Array<{ a: any; b: any; dist: number; score: number; key: string }> = [];
        const seenPairs = new Set<string>();
        const noParentOrphans: any[] = []; // 找不到"更近中心"的父
        let skippedAlgEdgeExists = 0;

        for (const city of targetCities) {
            // 跳过中心: 它们不生成 outgoing
            if (isCenterFn(city.id)) continue;

            const center = nearestCenterFor(city);
            if (!center) continue; // 此区无中心配置, 跳过 (异常情况)
            const distSelfToCenter = this.haversine(city.lat, city.lng, center.lat, center.lng);

            // [2026-05-30 v6] 改为 "道路距离最近" (Dijkstra), 不是直线距离
            //
            // Step 1: Haversine 粗筛, ≤250km 内的向心候选 (≤5 个最近)
            const haversineCands: Array<{ city: any; hDist: number }> = [];
            for (const other of CITIES) {
                if (other.id === city.id) continue;
                if (targetRegion && cityRegion.get(other.id) !== targetRegion) continue;
                const d = this.haversine(city.lat, city.lng, other.lat, other.lng);
                if (d > maxDistKm) continue;
                const dOtherToCenter = this.haversine(other.lat, other.lng, center.lat, center.lng);
                if (dOtherToCenter >= distSelfToCenter) continue; // ✗ 直线不向心
                haversineCands.push({ city: other, hDist: d });
            }
            // 取直线最近的前 8 个 (cap, 防 Dijkstra 跑太多)
            haversineCands.sort((a, b) => a.hDist - b.hDist);
            const topCands = haversineCands.slice(0, 8);

            // Step 2: 对每个 top 候选, 跑 Dijkstra 算实际道路距离
            let bestParent: any = null;
            let bestScore = Infinity;
            let bestRoadDist = 0;
            let bestHDist = 0;
            for (const { city: other, hDist } of topCands) {
                const cSc = this.findAccessGeoNodes(city.lat, city.lng, 3);
                const cEc = this.findAccessGeoNodes(other.lat, other.lng, 3);
                const roadDist = this.dijkstraGeo(cSc.map(n => n.id), cEc.map(n => n.id), { forbidWater: true })?.totalDistance ?? Infinity;
                if (roadDist === Infinity) continue; // 无 NE 陆路, 跳过
                // 道路距离 × 类型权重 = score
                const score = roadDist * typeWFn(other);
                if (score < bestScore) {
                    bestScore = score;
                    bestParent = other;
                    bestRoadDist = roadDist;
                    bestHDist = hDist;
                }
            }

            if (!bestParent) {
                noParentOrphans.push(city);
                continue;
            }

            const k = pairKey(city.id, bestParent.id);
            // 算法父这条特定边已存在 → 跳过
            if (existingPairs.has(k)) {
                skippedAlgEdgeExists++;
                continue;
            }
            if (seenPairs.has(k)) continue; // 同批 dedup
            seenPairs.add(k);
            candidatePairs.push({ a: city, b: bestParent, dist: bestHDist, score: bestScore, key: k });
        }

        // 按 score 升序: 离中心近的对先建 (从中心向外辐射)
        candidatePairs.sort((a, b) => a.score - b.score);
        console.log(`Phase 2: 向心树 ${candidatePairs.length} 对父子边 (无向心父 ${noParentOrphans.length} 个, 算法边已存在 ${skippedAlgEdgeExists} 个)`);

        // === Phase 3: 逐对建路 ===
        const newRoads: any[] = [];
        let skippedExist = 0;
        let rejectedDetour = 0;
        let rejectedNoPath = 0;
        const sampleRejects: string[] = [];

        let processedIdx = 0;
        for (const { a, b, dist, key } of candidatePairs) {
            if (newRoads.length >= LIMIT) {
                console.warn(`⚠ 达上限 ${LIMIT}, 剩余 ${candidatePairs.length - processedIdx} 对下次再处理`);
                break;
            }
            processedIdx++;
            if (existingPairs.has(key)) { skippedExist++; continue; }

            // NE 路径 (5 候选 起 × 5 候选 终)
            // [2026-05-30] forbidWater: true — 自动连绝不走水路 (用户公理)
            // 只有手动改路 / 切换候选 时才允许选水路
            const sc = this.findAccessGeoNodes(a.lat, a.lng, 5);
            const ec = this.findAccessGeoNodes(b.lat, b.lng, 5);
            const bestPath = this.dijkstraGeo(sc.map(n => n.id), ec.map(n => n.id), { forbidWater: true });
            const bestPathDist = bestPath?.totalDistance ?? Infinity;

            if (!bestPath) {
                rejectedNoPath++;
                if (sampleRejects.length < 5) sampleRejects.push(`${a.name}↔${b.name} (${dist.toFixed(0)}km, 无NE)`);
                continue;
            }

            const detour = bestPathDist / Math.max(dist, 1);
            const crossesWater = this.waterKmAlong(a.lng, a.lat, b.lng, b.lat) > 2.0 || this.crossesSeaLane(a.lng, a.lat, b.lng, b.lat);
            const maxDetour = crossesWater ? 4.5 : VectorRoadEditor.MAX_DETOUR_RATIO;
            if (detour > maxDetour) {
                rejectedDetour++;
                if (sampleRejects.length < 5) sampleRejects.push(`${a.name}↔${b.name} (${detour.toFixed(1)}×绕行)`);
                continue;
            }

            // 构造 + 清理 + 简化 + 吸附
            const rawCoords: [number, number][] = [
                [a.lng, a.lat], ...bestPath.coordinates, [b.lng, b.lat]
            ];
            const cleaned = removeBacktracks(rawCoords, 80);
            let simplified = this.simplifyCoords(cleaned, 0.002);
            simplified = this.simplifyCityVicinity(simplified, a, b, 15);
            const snapped = this.snapToExistingRoads(simplified, null) as [number, number][];
            if (snapped.length > 0) {
                snapped[0] = [a.lng, a.lat];
                snapped[snapped.length - 1] = [b.lng, b.lat];
            }

            newRoads.push({ startCity: a, endCity: b, coordinates: snapped, dist, pathDist: bestPathDist });
            existingPairs.add(key);
            console.log(`  ✅ ${a.name} ↔ ${b.name}  直径${dist.toFixed(0)}km / 路径${bestPathDist.toFixed(0)}km`);
        }

        console.groupEnd();

        // === Phase 4: 批量创建道路 ===
        if (newRoads.length === 0) {
            this.setStatus(`⚠ 0 新建 (候选 ${candidatePairs.length} · 已有 ${skippedExist} · 绕行 ${rejectedDetour} · 无NE ${rejectedNoPath})`);
            this.showInlineReport(`
                <div style="color:#ff9800;font-weight:bold;margin-bottom:6px;">🔗 两两自动连 · 区=<span style="color:#ffd700">${regionLabel}</span> · K=${K} · ≤${maxDistKm}km · 禁水路</div>
                <div>候选对: <b>${candidatePairs.length}</b></div>
                <div>已存在路对: <b>${skippedExist}</b> (无需重建)</div>
                <div style="color:#ff5722;">❌ 拒 绕行>2.5×: <b>${rejectedDetour}</b></div>
                <div style="color:#ff5722;">❌ 拒 无 NE 陆路: <b>${rejectedNoPath}</b></div>
                <div style="margin-top:10px;color:#ff9800;">→ 0 条新路</div>
                <div style="color:#aaa;font-size:12px;margin-top:6px;">建议: 提高 K (代码常量 NEAREST_K_PER_CITY) 或检查 250km 公理是否合理</div>
            `);
            return;
        }

        for (const nr of newRoads) {
            const roadName = `${nr.startCity.name}-${nr.endCity.name}`;
            const roadId = `road_${nr.startCity.id}_${nr.endCity.id}_${Date.now()}`;
            const newFeature: VectorRoadFeature = {
                type: 'Feature',
                properties: {
                    name: roadName, type: 'road', id: roadId,
                    startConnection: nr.startCity.id, endConnection: nr.endCity.id
                },
                geometry: { type: 'LineString', coordinates: nr.coordinates }
            };
            roadRegistry.addVectorRoad(newFeature);
        }

        // === Phase 5: UI 刷新 + 自动重叠扫描 (只报告, 不删) ===
        this.renderAllRoads();
        this.updateRoadSelect();

        // [2026-05-30] 扫描新建路与所有路的重叠, 只列出, 不删除
        // 用户场景: 江陵→开城 和 汉城→开城 几乎重合
        // 不删 (避免误杀, 沿用 Phase 5 改动决定)
        // 只报告 (让用户知道哪些路有问题)
        const overlapWarnings: Array<{ newRoad: string; oldRoad: string; overlapPoints: number; ratio: string }> = [];
        const arePointsEqual = (p: [number, number], q: [number, number]) =>
            Math.abs(p[0] - q[0]) < 1e-4 && Math.abs(p[1] - q[1]) < 1e-4;
        for (const nr of newRoads) {
            const nName = `${nr.startCity.name}-${nr.endCity.name}`;
            const nCoords = nr.coordinates;
            if (nCoords.length < 3) continue;
            for (const f of VECTOR_ROAD_DATA.features) {
                if (!f || !f.properties || !f.geometry) continue;
                const oName = f.properties.name || '?';
                if (oName === nName) continue; // 自己跟自己, 跳过
                const oCoords = f.geometry.coordinates as [number, number][];
                if (oCoords.length < 3) continue;
                // 算两路共享点数
                let shared = 0;
                for (const p of nCoords) {
                    for (const q of oCoords) {
                        if (arePointsEqual(p, q)) { shared++; break; }
                    }
                }
                const ratioNew = shared / nCoords.length;
                const ratioOld = shared / oCoords.length;
                if (shared >= 2 && (ratioNew > 0.3 || ratioOld > 0.3)) {
                    overlapWarnings.push({
                        newRoad: nName, oldRoad: oName,
                        overlapPoints: shared,
                        ratio: `新${(ratioNew*100).toFixed(0)}% / 旧${(ratioOld*100).toFixed(0)}%`,
                    });
                    break; // 一条新路只报一次最严重的, 防灌爆报告
                }
            }
        }

        // === Phase 6: 按区诊断每个城的状态 ===
        // 区内每个非中心城 → 看它最终有没有路
        // - has_road:  Phase 4 成功新建 OR 之前已有
        // - no_parent: noParentOrphans (没找到向心父)
        // - path_rej:  找到父但 Phase 3 NE 路径被拒
        type CityState = 'has_road' | 'has_existing' | 'no_parent' | 'path_rej';
        const cityState = new Map<string, CityState>();

        const cityHasAnyRoad = (cid: string): boolean => {
            for (const f of VECTOR_ROAD_DATA.features) {
                if (!f || !f.properties) continue;
                if (f.properties.startConnection === cid || f.properties.endConnection === cid) return true;
            }
            return false;
        };

        for (const c of targetCities) {
            if (isCenterFn(c.id)) continue;
            cityState.set(c.id, cityHasAnyRoad(c.id) ? 'has_road' : 'path_rej');
        }
        for (const c of noParentOrphans) {
            cityState.set(c.id, 'no_parent');
        }

        // 仍无路的城分类 (排除"本次已跳过的已有路城")
        const stillBroken: any[] = [];
        const noParentList: any[] = [];
        const pathRejList: any[] = [];
        let alreadyConnectedCount = 0;
        for (const c of targetCities) {
            if (isCenterFn(c.id)) continue;
            const st = cityState.get(c.id);
            if (st === 'has_road' || st === 'has_existing') { alreadyConnectedCount++; continue; }
            if (st === 'no_parent') { stillBroken.push(c); noParentList.push(c); }
            else if (st === 'path_rej') { stillBroken.push(c); pathRejList.push(c); }
        }

        this.setStatus(`✅ 向心树连: 新建 ${newRoads.length}, 仍无路 ${stillBroken.length}`);
        const reachedLimit = newRoads.length >= LIMIT;

        const renderBadgeList = (cs: any[], bgColor: string, max: number = 20) =>
            cs.slice(0, max).map(c => `<span style="background:${bgColor};padding:2px 6px;border-radius:4px;margin:2px;display:inline-block;">${c.name}</span>`).join('')
            + (cs.length > max ? ` <span style="color:#888;">...等 ${cs.length} 个</span>` : '');

        const rejectHtml = sampleRejects.length
            ? `<div style="margin-top:8px;color:#aaa;font-size:12px;">拒绝样本:<br>${sampleRejects.map(s => `&nbsp;&nbsp;· ${s}`).join('<br>')}</div>`
            : '';
        const noParentHtml = noParentList.length > 0
            ? `<div style="margin-top:8px;padding:8px 10px;background:rgba(255,87,34,0.1);border-left:3px solid #ff5722;border-radius:4px;">
                 <div style="color:#ff5722;font-weight:bold;font-size:13px;">📍 ${noParentList.length} 城 无向心父 (250km 内无更近中心的邻居)</div>
                 <div style="color:#ccc;font-size:12px;margin-top:4px;">${renderBadgeList(noParentList, 'rgba(255,87,34,0.15)')}</div>
                 <div style="color:#888;font-size:11px;margin-top:4px;">💡 这些城需在和区中心之间加历史中转城</div>
               </div>`
            : '';
        const pathRejHtml = pathRejList.length > 0
            ? `<div style="margin-top:8px;padding:8px 10px;background:rgba(255,193,7,0.1);border-left:3px solid #ffc107;border-radius:4px;">
                 <div style="color:#ffc107;font-weight:bold;font-size:13px;">⚠ ${pathRejList.length} 城 路径被拒 (有向心父, 但 NE 走不通 / 绕行>2×)</div>
                 <div style="color:#ccc;font-size:12px;margin-top:4px;">${renderBadgeList(pathRejList, 'rgba(255,193,7,0.15)')}</div>
                 <div style="color:#888;font-size:11px;margin-top:4px;">💡 这些城离父太远 / 中间无 NE 路 — 加中转或调整坐标</div>
               </div>`
            : '';
        // [2026-05-30] 重叠警告 (只报告, 不删)
        // [2026-05-30] 重叠条目可点击定位 — 用 data-attribute 存 road name
        // 找路 id (根据 road.properties.name 反查)
        const findRoadIdByName = (name: string) => {
            const f = VECTOR_ROAD_DATA.features.find(f => f.properties && f.properties.name === name);
            return f?.properties?.id || '';
        };
        const overlapHtml = overlapWarnings.length > 0
            ? `<div style="margin-top:10px;padding:12px 14px;background:rgba(233,30,99,0.15);border-left:4px solid #e91e63;border-radius:6px;">
                 <div style="color:#ff4081;font-weight:bold;font-size:15px;margin-bottom:8px;">🔁 ${overlapWarnings.length} 条新路与现有路严重重叠 (≥30%)</div>
                 <div style="color:#ddd;font-size:13px;line-height:2.0;">
                   ${overlapWarnings.slice(0, 20).map(w => {
                     const idNew = findRoadIdByName(w.newRoad);
                     const idOld = findRoadIdByName(w.oldRoad);
                     return `<div style="background:rgba(255,255,255,0.05);padding:6px 10px;border-radius:6px;margin:4px 0;">
                       <span style="color:#ff9999">新</span> <b>${w.newRoad}</b>
                       <button class="overlap-locate" data-road-id="${idNew}" style="background:#e91e63;color:white;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px;margin-left:6px;">👁 看新路</button>
                       <span style="color:#aaa;margin:0 8px;">⟷</span>
                       <span style="color:#9999ff">旧</span> <b>${w.oldRoad}</b>
                       <button class="overlap-locate" data-road-id="${idOld}" style="background:#5c6bc0;color:white;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px;margin-left:6px;">👁 看旧路</button>
                       <br><span style="color:#888;font-size:11px;margin-left:8px;">└ 共享 ${w.overlapPoints} 点 (${w.ratio})</span>
                     </div>`;
                   }).join('')}
                   ${overlapWarnings.length > 20 ? `<div style="color:#888;margin-top:6px;">...等 ${overlapWarnings.length} 条 (前 20 已列)</div>` : ''}
                 </div>
                 <div style="color:#888;font-size:12px;margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.1);">
                   💡 未自动删 (防误杀). 点 👁 看路 自动定位 + 选中. 人工判断: 历史多线? 据点过近? → 删一条
                 </div>
               </div>`
            : '';
        const allOkHtml = stillBroken.length === 0
            ? `<div style="margin-top:10px;color:#4caf50;font-weight:bold;">🎉 ${regionLabel} 全部入网 (${targetCities.length} 城)</div>`
            : `<div style="margin-top:10px;color:#ff9800;font-size:12px;">⚠ 共 <b>${stillBroken.length}</b> / ${targetCities.length - 1} 非中心城 仍无路</div>`;

        this.showInlineReport(`
            <div style="color:#4caf50;font-weight:bold;margin-bottom:8px;font-size:14px;">
                🌳 向心树自动连完成 · 区=<span style="color:#ffd700">${regionLabel}</span> · ≤${maxDistKm}km · <span style="color:#03a9f4">禁水路</span> · 绕行≤2× · <span style="color:#80cbc4">保留已有</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px 16px;">
                <div>📊 区内城: <b>${targetCities.length}</b> (含中心)</div>
                <div>✅ 新建道路: <b style="color:#4caf50">${newRoads.length}</b>${reachedLimit ? ` <span style="color:#ff9800;font-size:11px;">(达上限 ${LIMIT}, 可再点)</span>` : ''}</div>
                <div>🔒 算法边已存在: <b style="color:#80cbc4">${skippedAlgEdgeExists}</b></div>
                <div>⏭ 已有路对: <b>${skippedExist}</b></div>
                <div style="color:#ff5722;">❌ 拒 绕行>2×: <b>${rejectedDetour}</b></div>
                <div style="color:#ff5722;">❌ 拒 无 NE 陆路: <b>${rejectedNoPath}</b></div>
                <div style="grid-column:1/3;color:#888;font-size:11px;">🔒 算法不变性: 每城都必有"算法父"专属边, 你手画的辅路不影响 · 未自动去重 (跑 1️⃣ 全面审查)</div>
            </div>
            ${rejectHtml}
            ${noParentHtml}
            ${pathRejHtml}
            ${overlapHtml}
            ${allOkHtml}
        `);
    }

    // =====================================================================
    // [2026-11-14 主人「道路编辑器中，能算出来的道路太少了，能多加点吗」]
    // 视野补路：当前视野（外扩 60%）里「最近却还没直路」的据点对，一次算一批
    // =====================================================================

    /**
     * 🔴 [2026-11-14 主人「能算出来的道路太少了，能多加点吗」]
     *
     * 原来只能一对一对点：点起点、点终点，一次一条，视野里缺的边全靠手点，太慢。
     * 这里把**当前视野内**「最近、但还没有直路」的据点对一次算出来，规矩和手画一模一样：
     *   - 只走 NE 路网 + 水系 Dijkstra（第一原则，绝不用直线拼）
     *   - ≤ connectDistanceKm（250km）· 陆路优先(可走河流) · 直连断口尝试 ≤50km 智能桥接 · 绕行 ≤ MAX_DETOUR_RATIO（跨水的放宽到 4.5×）
     *   - **只进内存**，点 💾 保存 才写盘（路归主人）
     * 每座城每点一次补 K=4 条最近的空档；再点一次就补下一圈，或者用 1️⃣ 全面审查 收尾。
     */
    private async batchFillVisibleRoads(): Promise<void> {
        if (!this.geoGraphBuilt || this.geoNodes.length === 0) {
            this.setStatus('⏳ 路网图还在建，稍等再点「➕ 视野补路」');
            return;
        }
        const K = 4;                                                // 每座城补几条空档（2 → 4）
        const LIMIT = VectorRoadEditor.BATCH_AUTO_CONNECT_LIMIT;    // 单次上限
        const maxDistKm = this.connectDistanceKm;

        // 视野外扩 60%：视野里常常只看得见两三座城，不外扩就没有可连的邻居
        const bounds = this.map.getBounds().pad(0.6);
        const inView = CITIES.filter((c) => bounds.contains(L.latLng(c.lat, c.lng)));
        if (inView.length < 2) {
            this.setStatus(`⚠ 视野里只有 ${inView.length} 座据点，先缩到要补路的区域`);
            this.showInlineReport(`<div style="color:#ff9800;font-weight:bold;">⚠ 当前视野只有 ${inView.length} 座据点，补不了路 —— 先把地图缩到要补路的区域。</div>`);
            return;
        }

        // === 已有路对（据点 + 战场都算） ===
        const pairKey = (a: string, b: string) => [a, b].sort().join('|');
        const existingPairs = new Set<string>();
        for (const f of VECTOR_ROAD_DATA.features) {
            const s = f?.properties?.startConnection;
            const e = f?.properties?.endConnection;
            if (s && e) existingPairs.add(pairKey(s, e));
        }

        // === 每座视野内的城：取 K 个「最近、但还没有直路」的邻居 ===
        const seen = new Set<string>();
        const pairs: Array<{ a: any; b: any; dist: number; key: string }> = [];
        for (const city of inView) {
            const cands: Array<{ city: any; d: number }> = [];
            for (const other of CITIES) {   // 邻居可以是视野外的：补的是缺边，不是缺城
                if (other.id === city.id) continue;
                const d = this.haversine(city.lat, city.lng, other.lat, other.lng);
                if (d > maxDistKm) continue;
                if (existingPairs.has(pairKey(city.id, other.id))) continue;
                cands.push({ city: other, d });
            }
            cands.sort((x, y) => x.d - y.d);
            for (const { city: other, d } of cands.slice(0, K)) {
                const key = pairKey(city.id, other.id);
                if (seen.has(key)) continue;
                seen.add(key);
                pairs.push({ a: city, b: other, dist: d, key });
            }
        }
        // 近的边先建：视野里先织密网，远边留给下一次
        pairs.sort((x, y) => x.dist - y.dist);

        console.group(`➕ [FillVisible] 视野据点 ${inView.length} · 缺边候选 ${pairs.length} · K=${K} · ≤${maxDistKm}km · 陆路优先(可走河)`);

        // === 逐对算路（同一套：NE/水系 Dijkstra → 断口智能桥接 → 清理 → 简化 → 吸附） ===
        const newRoads: Array<{ a: any; b: any; coordinates: [number, number][]; dist: number; pathKm: number }> = [];
        const rejects: string[] = [];
        let rejectedNoPath = 0;
        let rejectedDetour = 0;
        let processed = 0;

        for (const { a, b, dist, key } of pairs) {
            if (newRoads.length >= LIMIT) break;
            if (existingPairs.has(key)) continue;
            processed++;
            if (processed % 8 === 0) await new Promise((r) => setTimeout(r, 0));   // 别把界面卡死

            const sc = this.findAccessGeoNodes(a.lat, a.lng, 6);
            const ec = this.findAccessGeoNodes(b.lat, b.lng, 6);
            const scIds = sc.map((n) => n.id);
            const ecIds = ec.map((n) => n.id);
            let routeCoords: [number, number][] | null = null;

            const bestPath = this.dijkstraGeo(scIds, ecIds, {
                forbidWater: false,
                routePreference: 'land_first',
            });
            if (bestPath && bestPath.coordinates && bestPath.coordinates.length >= 2) {
                routeCoords = bestPath.coordinates as [number, number][];
            } else if (scIds.length > 0 && ecIds.length > 0) {
                const bridged = this.findSmartBridgedPath(scIds, ecIds, Math.max(200, dist * 4.5));
                if (bridged && bridged.coordinates && bridged.coordinates.length >= 2) {
                    routeCoords = bridged.coordinates;
                }
            }

            if (!routeCoords) {
                rejectedNoPath++;
                if (rejects.length < 6) rejects.push(`${a.name}↔${b.name}（${dist.toFixed(0)}km 无连通白线/水路）`);
                continue;
            }
            const pathKm = this.calculatePathLength(routeCoords);
            const crossesWater = this.waterKmAlong(a.lng, a.lat, b.lng, b.lat) > 2.0 || this.crossesSeaLane(a.lng, a.lat, b.lng, b.lat);
            const maxDetour = crossesWater ? 4.5 : VectorRoadEditor.MAX_DETOUR_RATIO;
            if (pathKm / Math.max(dist, 1) > maxDetour) {
                rejectedDetour++;
                if (rejects.length < 6) rejects.push(`${a.name}↔${b.name}（${(pathKm / Math.max(dist, 1)).toFixed(1)}× 绕行）`);
                continue;
            }

            const rawCoords: [number, number][] = [[a.lng, a.lat], ...routeCoords, [b.lng, b.lat]];
            let simplified = this.simplifyCoords(removeBacktracks(rawCoords, 80), 0.002);
            simplified = this.simplifyCityVicinity(simplified, a, b, 15);
            const snapped = this.snapToExistingRoads(simplified, null) as [number, number][];
            if (snapped.length > 0) {
                snapped[0] = [a.lng, a.lat];
                snapped[snapped.length - 1] = [b.lng, b.lat];
            }
            newRoads.push({ a, b, coordinates: snapped, dist, pathKm });
            existingPairs.add(key);
            console.log(`  ✅ ${a.name} ↔ ${b.name}  直径${dist.toFixed(0)}km / 路径${pathKm.toFixed(0)}km`);
        }
        console.groupEnd();

        const rejectHtml = rejects.length
            ? `<div style="margin-top:8px;color:#aaa;font-size:12px;">未算出（可手点补）:<br>${rejects.map((s) => `&nbsp;&nbsp;· ${s}`).join('<br>')}</div>`
            : '';

        if (newRoads.length === 0) {
            this.setStatus(`⚠ 0 条新路（缺边候选 ${pairs.length} · 无连通 ${rejectedNoPath} · 绕行超限 ${rejectedDetour}）`);
            this.showInlineReport(`
                <div style="color:#ff9800;font-weight:bold;margin-bottom:6px;">➕ 视野补路 · 视野内据点 ${inView.length} 座</div>
                <div>缺边候选: <b>${pairs.length}</b></div>
                <div style="color:#ff5722;">❌ 无连通白线/水路: <b>${rejectedNoPath}</b> · 绕行超限: <b>${rejectedDetour}</b></div>
                <div style="margin-top:8px;color:#ff9800;">→ 0 条新路（这一圈已经补满，换个区域再点）</div>
                ${rejectHtml}
            `);
            return;
        }

        // === 建路（内存）===
        const newFeatures: VectorRoadFeature[] = [];
        for (const nr of newRoads) {
            const roadId = `road_${nr.a.id}_${nr.b.id}_${Date.now()}`;
            newFeatures.push({
                type: 'Feature',
                properties: {
                    name: `${nr.a.name}-${nr.b.name}`, type: 'road', id: roadId,
                    startConnection: nr.a.id, endConnection: nr.b.id
                },
                geometry: { type: 'LineString', coordinates: nr.coordinates }
            });
        }
        roadRegistry.addVectorRoadsBatch(newFeatures);
        this.renderAllRoads();
        this.updateRoadSelect();

        const hitLimit = newRoads.length >= LIMIT;
        this.setStatus(`➕ 视野补路: 新建 ${newRoads.length} 条${hitLimit ? `（达上限 ${LIMIT}，可再点）` : ''} · 未写盘，点 💾 保存`);
        this.showInlineReport(`
            <div style="color:#26a69a;font-weight:bold;margin-bottom:8px;font-size:14px;">
                ➕ 视野补路 · 视野内据点 <b>${inView.length}</b> 座 · ≤${maxDistKm}km · <span style="color:#03a9f4">陆路优先(可走河)</span> · 绕行≤${VectorRoadEditor.MAX_DETOUR_RATIO}× · 每城 ${K} 条空档
            </div>
            <div>缺边候选: <b>${pairs.length}</b> · 新建: <b style="color:#4caf50">${newRoads.length}</b>${hitLimit ? ` <span style="color:#ff9800;">(达上限 ${LIMIT})</span>` : ''}</div>
            <div style="color:#ff5722;">❌ 无连通白线/水路: <b>${rejectedNoPath}</b> · 绕行超限: <b>${rejectedDetour}</b></div>
            <div style="margin-top:8px;color:#ddd;font-size:13px;line-height:1.9;">
                ${newRoads.map((r) => `<span style="background:rgba(38,166,154,0.18);padding:2px 8px;border-radius:4px;margin:2px;display:inline-block;">${r.a.name}↔${r.b.name} <span style="color:#888;font-size:11px;">${r.dist.toFixed(0)}km</span></span>`).join('')}
            </div>
            ${rejectHtml}
            <div style="margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.12);color:#ffd700;font-size:12px;">
                💾 只进内存，还没写文件：满意了点 💾 保存；不满意点 🗑️ 删除 逐条退，或再点一次 ➕ 视野补路 补下一圈。
            </div>
        `);
    }

    /**
     * 为一个无路城市寻找最佳连接目标
     * 规则：只连接最近的已连接据点（不考虑势力）
     * @param maxDistKm 最大搜索距离（公里），默认使用 MAX_CONNECTION_DIST_KM (500)
     */
    private findBestConnectionTarget(orphanCity: any, connectedSet: Set<string>, maxDistKm: number = VectorRoadEditor.MAX_CONNECTION_DIST_KM): any | null {
        let best: { city: any; dist: number } | null = null;

        for (const city of CITIES) {
            if (city.id === orphanCity.id) continue;
            if (!connectedSet.has(city.id)) continue;

            const dist = this.haversine(orphanCity.lat, orphanCity.lng, city.lat, city.lng);
            if (dist > maxDistKm) continue;

            if (!best || dist < best.dist) {
                best = { city, dist };
            }
        }

        if (!best) return null;
        return best.city;
    }

    /**
     * [NEW 2026] 返回按距离排序的前 N 个候选目标（用于"被拒就试下一个"的回退逻辑）
     */
    private findConnectionCandidates(
        orphanCity: any,
        connectedSet: Set<string>,
        maxDistKm: number,
        limit: number = 5
    ): any[] {
        const candidates: { city: any; dist: number }[] = [];
        for (const city of CITIES) {
            if (city.id === orphanCity.id) continue;
            if (!connectedSet.has(city.id)) continue;
            const dist = this.haversine(orphanCity.lat, orphanCity.lng, city.lat, city.lng);
            if (dist > maxDistKm) continue;
            candidates.push({ city, dist });
        }
        candidates.sort((a, b) => a.dist - b.dist);
        return candidates.slice(0, limit).map(c => c.city);
    }

    private arePathsEqual(path1: [number, number][], path2: [number, number][]): boolean {
        if (path1.length !== path2.length) return false;
        // Check normal
        let match = true;
        for (let i = 0; i < path1.length; i++) {
            if (!this.arePointsEqual(path1[i], path2[i])) { match = false; break; }
        }
        if (match) return true;

        // Check reverse
        match = true;
        for (let i = 0; i < path1.length; i++) {
            if (!this.arePointsEqual(path1[i], path2[path2.length - 1 - i])) { match = false; break; }
        }
        return match;
    }

    private isSubpath(sub: [number, number][], main: [number, number][]): boolean {
        if (sub.length > main.length) return false;

        // Find matching start position in main path
        for (let i = 0; i <= main.length - sub.length; i++) {
            let match = true;
            for (let j = 0; j < sub.length; j++) {
                // Use fuzzy equality to handle float drift
                if (!this.arePointsEqual(main[i + j], sub[j])) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
        return false;
    }

    private arePointsEqual(p1: [number, number], p2: [number, number]): boolean {
        const EPSILON = 1e-4; // ~11 meters. 
        // Leaflet's latLngToContainerPoint -> containerPointToLatLng can introduce drift.
        // But snapToExistingRoads *should* copy exact values.
        // However, if manual drag happened, drift is possible.
        return Math.abs(p1[0] - p2[0]) < EPSILON && Math.abs(p1[1] - p2[1]) < EPSILON;
    }

    private deleteRoad(roadId: string): void {
        this.clearControlPoints(roadId);
        this.removeRoadLayers(roadId);
        if (this.selectedRoadId === roadId) this.selectedRoadId = null;

        roadRegistry.removeVectorRoad(roadId);
        // Note: removeVectorRoad updates VECTOR_ROAD_DATA and rebuilds graph

        // Also remove from editor cache
        this.editPolylines.delete(roadId);
        this.editMarkers.delete(roadId);
        this.midMarkers.delete(roadId);
    }

    /** 每条路的经纬度包围盒 [minLat, minLng, maxLat, maxLng]，按 feature 顺序平铺。
     *  🔴 [2026-09-08] findSnapTarget 原来是全网扫描：1365 条路 / 41070 段，每段两次
     *  latLngToContainerPoint ≈ 8 万次 Leaflet 投影，而它挂在**拖拽的 mousemove** 上，
     *  每动一下鼠标跑一遍 —— 这就是「道路编辑器寻路卡」。改成先用包围盒在经纬度空间
     *  粗筛，只有可能落在吸附半径内的路才做投影细算。同一套思路见 RoadRegistry 的
     *  findNearestRoadEntry（那次修的是游戏侧，编辑器这条漏了）。 */
    private snapBboxCache: Float64Array | null = null;
    private snapBboxCount = 0;
    /** onRoadsUpdated 没有退订接口，只订阅一次，避免每次 show() 叠加一个回调。 */
    private snapCacheHooked = false;

    /** 路网数据变了就丢弃包围盒缓存（增删路、拖点都会改 VECTOR_ROAD_DATA）。 */
    public invalidateSnapBboxCache(): void {
        this.snapBboxCache = null;
        this.snapBboxCount = 0;
    }

    private ensureSnapBboxCache(): Float64Array {
        const feats = VECTOR_ROAD_DATA.features;
        if (this.snapBboxCache && this.snapBboxCount === feats.length) return this.snapBboxCache;
        const boxes = new Float64Array(feats.length * 4);
        for (let i = 0; i < feats.length; i++) {
            const coords = feats[i]?.geometry?.coordinates;
            if (!coords || !coords.length) {
                boxes[i * 4] = NaN;   // 标记为空，细扫时跳过
                continue;
            }
            let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
            for (let j = 0; j < coords.length; j++) {
                const lng = coords[j][0], lat = coords[j][1];
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
            }
            boxes[i * 4] = minLat; boxes[i * 4 + 1] = minLng;
            boxes[i * 4 + 2] = maxLat; boxes[i * 4 + 3] = maxLng;
        }
        this.snapBboxCache = boxes;
        this.snapBboxCount = feats.length;
        return boxes;
    }

    /**
     * [SNAP] Find nearest point on OTHER roads (pixel based)
     * Prioritizes existing vertices (Nodes) over edges.
     */
    private findSnapTarget(lat: number, lng: number, excludeRoadId: string): { lat: number, lng: number } | null {
        let bestPoint: { lat: number, lng: number } | null = null;
        let minDist = Infinity;
        const SNAP_THRESHOLD_PX = 15; // Snap within 15 pixels

        const currentPoint = this.map.latLngToContainerPoint([lat, lng]);

        // 15px 在当前 zoom/纬度下对应多少度 —— 用它把包围盒外扩，作为粗筛的搜索框。
        // 乘 2 留余量：墨卡托下经度尺度随纬度变，宁可多放进来几条也别漏掉该吸附的。
        const probe = this.map.containerPointToLatLng([
            currentPoint.x + SNAP_THRESHOLD_PX,
            currentPoint.y + SNAP_THRESHOLD_PX,
        ]);
        const padLat = Math.abs(probe.lat - lat) * 2 || 1e-4;
        const padLng = Math.abs(probe.lng - lng) * 2 || 1e-4;

        const boxes = this.ensureSnapBboxCache();
        const feats = VECTOR_ROAD_DATA.features;

        for (let fi = 0; fi < feats.length; fi++) {
            const feature = feats[fi];
            if (feature.properties.id === excludeRoadId) continue;
            if (!feature.geometry.coordinates) continue;

            // 包围盒粗筛：整条路都离鼠标太远就整条跳过，省掉它全部顶点的投影
            const b = fi * 4;
            const minLat = boxes[b];
            if (Number.isNaN(minLat)) continue;
            if (lat < minLat - padLat || lat > boxes[b + 2] + padLat) continue;
            if (lng < boxes[b + 1] - padLng || lng > boxes[b + 3] + padLng) continue;

            const coords = feature.geometry.coordinates;
            // Check segments
            for (let i = 0; i < coords.length - 1; i++) {
                const [lng1, lat1] = coords[i];
                const [lng2, lat2] = coords[i + 1];

                const p1 = this.map.latLngToContainerPoint([lat1, lng1]);
                const p2 = this.map.latLngToContainerPoint([lat2, lng2]);

                // 1. Check Vertex Snapping (Start of segment)
                // We check p1. We don't strictly need to check p2 because it will be p1 of next segment, 
                // except for the very last point. But calculating dist to p1 is cheap.
                const distToP1 = currentPoint.distanceTo(p1);
                if (distToP1 < SNAP_THRESHOLD_PX && distToP1 < minDist) {
                    minDist = distToP1;
                    // EXACT coordinate from data
                    bestPoint = { lat: lat1, lng: lng1 };
                    continue; // Vertex priority
                }

                // Check last point of entire line
                if (i === coords.length - 2) {
                    const distToP2 = currentPoint.distanceTo(p2);
                    if (distToP2 < SNAP_THRESHOLD_PX && distToP2 < minDist) {
                        minDist = distToP2;
                        bestPoint = { lat: lat2, lng: lng2 };
                        continue;
                    }
                }

                // 2. Check Edge Snapping
                const distToSegment = L.LineUtil.pointToSegmentDistance(currentPoint, p1, p2);

                if (distToSegment < SNAP_THRESHOLD_PX && distToSegment < minDist) {
                    // Only snap to edge if we haven't found a closer vertex?
                    // actually if we are here, we are not close to p1.
                    // But we might be close to p2 (next vertex).
                    // The loop handles vertices.
                    // If we are strictly on the edge (not near vertex), snap to edge.

                    minDist = distToSegment;
                    const closestPx = L.LineUtil.closestPointOnSegment(currentPoint, p1, p2);
                    bestPoint = this.map.containerPointToLatLng(closestPx);
                }
            }
        }
        return bestPoint;
    }

    // ===== 清理 =====

    private clearControlPoints(roadId: string): void {
        this.editMarkers.get(roadId)?.forEach(m => this.map.removeLayer(m));
        this.editMarkers.delete(roadId);
        this.midMarkers.get(roadId)?.forEach(m => this.map.removeLayer(m));
        this.midMarkers.delete(roadId);

        const polyline = this.editPolylines.get(roadId);
        if (polyline) polyline.setStyle({ color: '#ff9800', weight: 4, opacity: 1.0 });
    }

    private clearEditLayers(): void {
        for (const [_, p] of this.editPolylines) this.map.removeLayer(p);
        this.editPolylines.clear();
        for (const [_, ms] of this.editMarkers) ms.forEach(m => this.map.removeLayer(m));
        this.editMarkers.clear();
        for (const [_, ms] of this.midMarkers) ms.forEach(m => this.map.removeLayer(m));
        this.midMarkers.clear();
        this.selectedRoadId = null;
    }

    private removeRoadLayers(roadId: string): void {
        const p = this.editPolylines.get(roadId);
        if (p) { this.map.removeLayer(p); this.editPolylines.delete(roadId); }
        this.clearControlPoints(roadId);
    }

    // ===== 保存 =====

    private async saveToFile(): Promise<void> {
        const content = this.generateTypeScriptContent();
        try {
            // [FIX] 通过 Vite dev server 直接写入源文件
            const res = await fetch('/api/save-roads', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: content
            });
            const result = await res.json();
            if (result.ok) {
                this.setStatus(`✅ 已保存到 VectorRoadData.ts (${result.bytes} 字节)`);
            } else {
                throw new Error(result.error || '保存失败');
            }
        } catch (err) {
            console.error('[SaveRoads] Dev API failed, fallback to clipboard:', err);
            // 回退：复制到剪贴板
            await navigator.clipboard.writeText(content);
            this.setStatus('⚠️ 直接保存失败，已复制到剪贴板。请手动粘贴到 src/data/VectorRoadData.ts');
            alert('直接保存失败！\n\n内容已复制到剪贴板，请手动粘贴替换:\nsrc/data/VectorRoadData.ts');
        }
    }

    private deleteSelectedRoad(): void {
        // [FIX] Fallback: use dropdown value if no road selected via click
        let roadIdToDelete = this.selectedRoadId;
        if (!roadIdToDelete && this.roadSelect && this.roadSelect.value) {
            roadIdToDelete = this.roadSelect.value;
        }

        if (!roadIdToDelete) {
            this.setStatus('⚠️ 请先从下拉列表选择或点击要删除的道路');
            return;
        }

        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadIdToDelete);
        const name = feature?.properties.name || '未命名道路';

        if (!confirm(`确定要彻底删除道路 "${name}" 吗？\n删除后无法撤销，记得点“保存”！`)) {
            return;
        }

        // 1. 从图和数据中移除
        roadRegistry.removeVectorRoad(roadIdToDelete);

        // 2. 清除编辑器中的视觉元素
        this.removeRoadLayers(roadIdToDelete);

        // 3. 重置状态
        this.selectedRoadId = null;
        if (this.roadSelect) this.roadSelect.value = '';

        // 4. 更新下拉列表
        this.updateRoadSelect();

        this.setStatus(`🗑️ 已删除 "${name}"，请点击保存以持久化`);
    }

    private exportToClipboard(): void {
        const content = this.generateTypeScriptContent();
        navigator.clipboard.writeText(content).then(() => {
            this.setStatus('📋 已复制到剪贴板！');
        });
    }

    private generateTypeScriptContent(): string {
        const features = VECTOR_ROAD_DATA.features;
        let ts = `export interface VectorRoadFeature {\n`;
        ts += `    type: 'Feature';\n`;
        ts += `    properties: {\n`;
        ts += `        name: string;\n`;
        ts += `        type: 'road';\n`;
        ts += `        color?: string;\n`;
        ts += `        id: string;\n`;
        ts += `        startYear?: number;\n`;
        ts += `        endYear?: number;\n`;
        ts += `        startConnection?: string;\n`;
        ts += `        endConnection?: string;\n`;
        ts += `        hasSeaLeg?: boolean;\n`;
        ts += `    };\n`;
        ts += `    geometry: {\n`;
        ts += `        type: 'LineString';\n`;
        ts += `        coordinates: [number, number][];\n`;
        ts += `    };\n`;
        ts += `}\n\n`;

        ts += `export const VECTOR_ROAD_DATA: { type: 'FeatureCollection', features: VectorRoadFeature[] } = {\n`;
        ts += `    type: 'FeatureCollection',\n`;
        ts += `    features: [\n`;

        for (const feature of features) {
            const p = feature.properties;
            ts += `        {\n`;
            ts += `            type: "Feature",\n`;
            ts += `            properties: {\n`;
            ts += `                name: "${p.name}",\n`;
            ts += `                type: "${p.type}",\n`;
            ts += `                id: "${p.id}"`;
            if (p.startConnection) ts += `,\n                startConnection: "${p.startConnection}"`;
            if (p.endConnection) ts += `,\n                endConnection: "${p.endConnection}"`;
            if (p.startYear !== undefined) ts += `,\n                startYear: ${p.startYear}`;
            if (p.endYear !== undefined) ts += `,\n                endYear: ${p.endYear}`;
            if ((p as { hasSeaLeg?: boolean }).hasSeaLeg) ts += `,\n                hasSeaLeg: true`;
            ts += `\n            },\n`;
            ts += `            geometry: {\n`;
            ts += `                type: "LineString",\n`;
            ts += `                coordinates: [\n`;
            for (const coord of feature.geometry.coordinates) {
                ts += `                    [${coord[0]}, ${coord[1]}],\n`;
            }
            ts += `                ]\n`;
            ts += `            }\n`;
            ts += `        },\n`;
        }

        ts += `    ]\n`;
        ts += `};\n`;
        return ts;
    }

    // ===== 工具 =====

    private calculatePathLength(coords: [number, number][]): number {
        let total = 0;
        for (let i = 1; i < coords.length; i++) {
            total += this.haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
        }
        return total;
    }

    private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

