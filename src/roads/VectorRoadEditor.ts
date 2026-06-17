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
import { CITIES_V2 as CITIES } from '../data/cities_v2';
import { smoothRoad, removeBacktracks } from '../utils/GeometryUtils';
import { REGION_CENTERS, REGION_LABELS, REGION_ORDER, getCityRegion, RegionType } from '../systems/RegionSystem';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';

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
    isWater?: boolean;
}

/** 编辑器候选路线模式（固定三档，按此顺序循环切换） */
type RouteMode = 'prefer_water' | 'prefer_land' | 'straight';

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
    prefer_water: '优先水路·陆路为辅',
    prefer_land: '优先陆路·水路为辅',
    straight: '直线',
};

export class VectorRoadEditor implements IEditor {
    public name = '矢量道路编辑器';
    public icon = '🛤️';

    // ===== 静态常量（供 batchAutoConnect 使用）=====
    private static readonly BATCH_AUTO_CONNECT_LIMIT = 50;
    /** [2026-05-30] 绕行比例上限 2.5 → 2.0 (用户拍板, 2×已不能接受) */
    private static readonly MAX_DETOUR_RATIO = 2.0;
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
    };
    private static readonly REGION_CENTER_WEIGHT = 0.9;
    private static readonly MAX_CONNECTION_DIST_KM = 500;
    /** 智能候选池上限 */
    private static readonly MAX_ROUTE_CANDIDATES = 6;
    private static readonly WATER_VARIANTS_PER_MODE = 3;
    private static readonly LAND_VARIANTS_PER_MODE = 3;
    private static readonly WATER_TRUNK_MIN_RATIO = 0.35;
    private static readonly VARIANT_PENALTY_FACTOR = 5.5;

    private map: L.Map;
    private cityManager: CityManager;
    private visible: boolean = false;

    // === GeoJSON 路网图 ===
    private geoNodes: GeoNode[] = [];

    private geoAdj: Map<number, GeoEdge[]> = new Map();
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

    // === 编辑层 ===
    private editPolylines: Map<string, L.Polyline> = new Map();
    private editMarkers: Map<string, L.CircleMarker[]> = new Map();
    private midMarkers: Map<string, L.CircleMarker[]> = new Map();
    private selectedRoadId: string | null = null;
    private cutModeEnabled: boolean = false;
    private cutBtn: HTMLButtonElement | null = null;
    private pendingConnectRoadId: string | null = null;
    private connectBtn: HTMLButtonElement | null = null;

    // === 候选路径缓存与切换支持 ===
    private pathCandidates: RouteCandidate[] = [];
    private currentCandidateIdx: number = 0;
    private switchRouteBtn: HTMLButtonElement | null = null;

    // === UI ===
    private panel: HTMLElement | null = null;
    private statusLabel: HTMLElement | null = null;
    private roadSelect: HTMLSelectElement | null = null;
    private roadFilter: HTMLInputElement | null = null;

    // === 城市点击处理 ===
    private cityClickHandler: ((city: any, e?: any) => void) | null = null;

    constructor(map: L.Map, cityManager: CityManager) {
        this.map = map;
        this.cityManager = cityManager;
    }

    // ===== IEditor 接口 =====

    public show(): void {
        this.visible = true;
        this.createPanel();
        this.initLayerPanes();  // [Phase B v2] 4 层独立 pane (z-index 380/390/400/410)
        this.renderAllRoads();
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

    private async autoShowRadialNetwork(): Promise<void> {
        if (this.radialNetworkLayer) return;
        try {
            const basePath = (import.meta as any).env?.BASE_URL || '/';
            const res = await fetch(`${basePath}assets/radial_network.geojson`);
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
        this.clearEditLayers();
        this.removeReferenceLayer();
        // [Phase B] 清理 Layer 4 (BFS 辐射)
        if (this.radialNetworkLayer) {
            this.map.removeLayer(this.radialNetworkLayer);
            this.radialNetworkLayer = null;
        }
        this.clearCitySelection();
        this.disableCitySelection();
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
        //   Row 1: 单条道路编辑（旧）— 状态/搜索/下拉/路网开关/重选/改起/改终/切换/保存/删除
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

        // 重置（清空当前选择, 准备画下一条）
        // [2026-05-30] 强化重置: 真正清干净 + 重新注册城市点击, 立刻能点新起点
        const resetBtn = this.createButton('🔄 重选', '#ff5722', () => {
            this.resetForNextDraw();
        });

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
        this.cutBtn = this.createButton('✂ 切断', '#ff7043', () => this.toggleCutMode());
        this.connectBtn = this.createButton('🔗 连接', '#00897b', () => this.handleConnectRoads());

        // 改起点/终点
        const changeStartBtn = this.createButton('📍 改起点', '#9c27b0', () => this.enterChangeEndpointMode('start'));
        const changeEndBtn = this.createButton('📍 改终点', '#673ab7', () => this.enterChangeEndpointMode('end'));

        // 切换路径（只在有多候选时显示）
        this.switchRouteBtn = this.createButton('🔀 切换路径', '#009688', () => this.cycleCandidates());
        this.switchRouteBtn.style.visibility = 'hidden';
        this.switchRouteBtn.title = '在智能候选池中切换（水路/陆路捷径/偏西偏东侧路/直线，最多6条）';

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
        row1.appendChild(this.roadSelect);
        row1.appendChild(prevRoadBtn);
        row1.appendChild(nextRoadBtn);
        row1.appendChild(row1Label);
        row1.appendChild(resetBtn);
        row1.appendChild(changeStartBtn);
        row1.appendChild(changeEndBtn);
        row1.appendChild(this.switchRouteBtn);
        row1.appendChild(this.cutBtn);
        row1.appendChild(this.connectBtn);
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
        row2.appendChild(fullAuditBtn);
        row2.appendChild(singleRoadBtn);
        row2.appendChild(distanceLabel);

        // [2026-05-30] 区选择器 — 自动连只处理指定区, 不再全世界一起跑
        this.regionSelect = document.createElement('select');
        this.regionSelect.style.cssText = `
            background: rgba(0,0,0,0.4); color: #ffd700; border: 2px solid rgba(255,215,0,0.5);
            border-radius: 10px; padding: 10px 16px; font-size: 16px; font-weight: bold;
            cursor: pointer; width: 200px; flex-shrink: 0;
        `;
        this.regionSelect.title = '只连指定区, 选"全部"则跨区都连';
        const optAll = document.createElement('option');
        optAll.value = 'ALL';
        optAll.textContent = '🌐 全部 14 区';
        this.regionSelect.appendChild(optAll);
        for (const r of REGION_ORDER) {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = `${REGION_LABELS[r]} (${r})`;
            this.regionSelect.appendChild(opt);
        }
        this.regionSelect.addEventListener('change', () => {
            this.selectedRegion = this.regionSelect.value === 'ALL' ? null : this.regionSelect.value as RegionType;
            const label = this.selectedRegion ? REGION_LABELS[this.selectedRegion] : '全部';
            this.setStatus(`📍 自动连区已切为: ${label}`);
            // [2026-05-30] 视觉警告: 选"全部"时 自动连按钮变红 + 加 ⚠️
            this.updateAutoConnectBtnStyle();
        });
        row2.appendChild(this.regionSelect);

        // autoConnectBtn — 批量自动连接（batchAutoConnect）
        // [2026-05-30] 引用存类成员, 方便区切换时动态更新颜色
        this.autoConnectBtn = this.createButton('3️⃣ 🔗 自动连', '#4caf50', () => this.batchAutoConnectGuarded());
        row2.appendChild(this.autoConnectBtn);

        // [2026-05-30] 问题路导航 — 配合 1️⃣ 全面审查 用
        const prevProblemBtn = this.createButton('◀ 上问题', '#9c27b0', () => this.selectAdjacentProblem(-1));
        const nextProblemBtn = this.createButton('下问题 ▶', '#9c27b0', () => this.selectAdjacentProblem(1));
        prevProblemBtn.title = '在 1️⃣ 全面审查 的问题队列里上一条';
        nextProblemBtn.title = '在 1️⃣ 全面审查 的问题队列里下一条';
        row2.appendChild(prevProblemBtn);
        row2.appendChild(nextProblemBtn);

        this.panel.appendChild(row0);
        this.panel.appendChild(row1);
        this.panel.appendChild(row2);
        // 保存引用以便 togglePanelMinimized 切换
        this.panelRows = { row1, row2 };

        // [2026-05-30] 初始化"全部"红色警告 (默认选 ALL)
        this.updateAutoConnectBtnStyle();

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
    private regionSelect!: HTMLSelectElement;
    private autoConnectBtn!: HTMLButtonElement;
    /** [2026-05-30] 当前选中的文化区, null = 全部跨区 */
    private selectedRegion: RegionType | null = null;
    /** [2026-05-30] 上次审查的问题路 id 队列, 供 [◀ 上问题/下问题 ▶] 导航 */
    private problemRoadIds: string[] = [];
    private problemRoadIdx: number = -1;

    /** 在问题队列里上一/下一条 */
    private selectAdjacentProblem(delta: number): void {
        if (this.problemRoadIds.length === 0) {
            this.setStatus('⚠ 暂无问题队列, 先点 1️⃣ 全面审查');
            return;
        }
        let nextIdx = this.problemRoadIdx + delta;
        if (nextIdx < 0) nextIdx = this.problemRoadIds.length - 1;
        if (nextIdx >= this.problemRoadIds.length) nextIdx = 0;
        this.problemRoadIdx = nextIdx;
        const roadId = this.problemRoadIds[nextIdx];
        this.selectRoad(roadId);
        if (this.roadSelect) this.roadSelect.value = roadId;
        this.setStatus(`🔍 问题 [${nextIdx + 1}/${this.problemRoadIds.length}] ${roadId}`);
    }

    /** [2026-05-30] 根据选中区动态改 自动连按钮 颜色/文字, 防误点全部 */
    private updateAutoConnectBtnStyle(): void {
        if (!this.autoConnectBtn) return;
        if (this.selectedRegion === null) {
            // 全部 → 危险红 + ⚠ 警告
            this.autoConnectBtn.style.background = '#d32f2f';
            this.autoConnectBtn.textContent = '4️⃣ ⚠️ 全部自动连 (慢!)';
            this.autoConnectBtn.title = '⚠ 警告: 将处理全部 618 城, 可能卡死页面 30-90 秒!\n建议: 选具体区, 一区一区跑';
        } else {
            // 某区 → 正常绿
            this.autoConnectBtn.style.background = '#4caf50';
            this.autoConnectBtn.textContent = `4️⃣ 🔗 自动连 (${REGION_LABELS[this.selectedRegion]})`;
            this.autoConnectBtn.title = `只连 ${REGION_LABELS[this.selectedRegion]} 区内据点`;
        }
    }

    /**
     * [2026-05-30] 带"全部"二次确认的包装
     * 防误点全部自动连
     */
    private async batchAutoConnectGuarded(): Promise<void> {
        if (this.selectedRegion === null) {
            const ok = window.confirm(
                '⚠️ 即将自动连「全部 14 区」\n\n' +
                '将处理全部 618 个据点, 计算时间 30-90 秒.\n' +
                '期间页面可能卡顿/无响应.\n\n' +
                '推荐: 选具体区 (日本/朝鲜/中亚 等) 一区一区跑.\n\n' +
                '确定继续吗?'
            );
            if (!ok) {
                this.setStatus('❌ 已取消全部自动连');
                return;
            }
        }
        await this.batchAutoConnect();
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

    private pendingEndpointChange: 'start' | 'end' | null = null;

    /**
     * 进入"改端点"模式：下一次点击城市就会设为新起点/终点
     */
    private enterChangeEndpointMode(which: 'start' | 'end'): void {
        if (!this.selectedRoadId) {
            this.setStatus('⚠️ 请先选择一条道路');
            return;
        }
        this.pendingEndpointChange = which;
        this.setStatus(`🏙️ 请点击地图上的城市作为新${which === 'start' ? '起点' : '终点'}`);
    }

    /**
     * 修改道路的起点或终点（遵守第一原则：必须走路网寻路）
     * 选择新城市后，通过 Dijkstra 在路网上重新计算从起点到新终点的路径
     */
    private async changeEndpoint(roadId: string, which: 'start' | 'end', newCityId: string): Promise<void> {
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
        if (!feature) return;

        const city = CITIES.find(c => c.id === newCityId);
        if (!city) return;

        // 更新连接属性
        if (which === 'end') {
            feature.properties.endConnection = newCityId;
        } else {
            feature.properties.startConnection = newCityId;
        }

        // 获取更新后的起终点
        const startCityId = feature.properties.startConnection;
        const endCityId = feature.properties.endConnection;
        const startCity = CITIES.find(c => c.id === startCityId);
        const endCity = CITIES.find(c => c.id === endCityId);
        if (!startCity || !endCity) return;

        // 更新名称
        feature.properties.name = `${startCity.name}-${endCity.name}`;

        this.setStatus(`⏳ 正在路网上重新寻路: ${startCity.name} → ${endCity.name}...`);

        // ★ 第一原则：必须通过路网寻路生成坐标 ★
        // 确保路网图已加载
        if (!this.geoGraphBuilt) {
            await this.loadGeoJSONGraph();
        }

        // [FIX] 不再注入项目已有道路，纯粹在 Natural Earth 路网上寻路

        // 在路网上寻路 (尝试多个候选节点)
        const startCandidates = this.findKNearestGeoNodes(startCity.lat, startCity.lng, 5);
        const endCandidates = this.findKNearestGeoNodes(endCity.lat, endCity.lng, 5);

        let bestPath: { coordinates: [number, number][]; totalDistance: number } | null = null;
        let bestDist = Infinity;

        for (const sc of startCandidates) {
            for (const ec of endCandidates) {
                const path = this.dijkstraGeo(sc.id, ec.id);
                if (path && path.totalDistance < bestDist) {
                    bestPath = path;
                    bestDist = path.totalDistance;
                }
            }
        }

        if (bestPath) {
            // 拼接: 城市坐标 + 路网路径 + 城市坐标
            let rawCoords: [number, number][] = [
                [startCity.lng, startCity.lat],
                ...bestPath.coordinates,
                [endCity.lng, endCity.lat]
            ];

            // 后处理: 去折角 + 抽稀 + 清理周边 + 吸附
            const cleaned = removeBacktracks(rawCoords, 80);
            let simplified = this.simplifyCoords(cleaned, 0.002);
            simplified = this.simplifyCityVicinity(simplified, startCity, endCity, 15);
            const finalCoords = this.snapToExistingRoads(simplified, roadId);

            feature.geometry.coordinates = finalCoords;
            this.setStatus(`✅ ${which === 'start' ? '起点' : '终点'}已改为: ${city.name} (${bestDist.toFixed(0)}km 路网)`);
        } else {
            // 路网寻路失败，尝试桥接
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
                const finalCoords = this.snapToExistingRoads(simplified, roadId);
                feature.geometry.coordinates = finalCoords;
                this.setStatus(`✅ ${city.name} (含桥接 ${bridged.bridgeDist.toFixed(0)}km)`);
            } else {
                this.setStatus(`❌ 路网寻路失败，无法修改端点`);
                // 回滚连接属性
                if (which === 'end') {
                    feature.properties.endConnection = endCityId; // rollback
                } else {
                    feature.properties.startConnection = startCityId; // rollback
                }
                return;
            }
        }

        // 刷新显示
        this.renderRoad(roadId);
        this.showControlPoints(roadId);
        this.updateRoadSelect();
        console.log(`✏️ [Editor] Changed ${which} of "${roadId}" to ${newCityId} via road network`);
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
        // 倒序：新建道路在数组末尾，下拉列表 newest-first 便于选取
        const features = VECTOR_ROAD_DATA.features.slice().reverse();
        for (const feature of features) {
            if (!feature || !feature.properties || !feature.geometry) continue;
            const name = (feature.properties.name || '未命名').toLowerCase();
            const id = feature.properties.id.toLowerCase();
            // 过滤：搜索名称或ID
            if (filterText && !name.includes(filterText) && !id.includes(filterText)) continue;
            const opt = document.createElement('option');
            opt.value = feature.properties.id;
            opt.textContent = `${feature.properties.name || '未命名'} (${feature.geometry.coordinates.length}点)`;
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

            const cityId = city.id || city.name;
            const cityData = CITIES.find(c => c.id === cityId);
            if (!cityData) return;

            // 改端点模式：点击城市即设为新起点/终点
            if (this.pendingEndpointChange && this.selectedRoadId) {
                this.changeEndpoint(this.selectedRoadId, this.pendingEndpointChange, cityId);
                this.pendingEndpointChange = null;
                return;
            }

            if (!this.startCityId) {
                // 选择起点
                this.startCityId = cityId;
                this.startMarker = L.circleMarker([cityData.lat, cityData.lng], {
                    radius: 10, color: '#00e676', fillColor: '#00e676',
                    fillOpacity: 0.8, weight: 3
                }).addTo(this.map);
                this.startMarker.bindTooltip(`起点: ${cityData.name}`, { permanent: true, direction: 'top' });
                this.setStatus(`✅ 起点: ${cityData.name} | 请点击第二个城市（终点）`);

            } else if (!this.endCityId) {
                // 选择终点
                if (cityId === this.startCityId) return; // 不能选同一城市

                this.endCityId = cityId;
                this.endMarker = L.circleMarker([cityData.lat, cityData.lng], {
                    radius: 10, color: '#ff1744', fillColor: '#ff1744',
                    fillOpacity: 0.8, weight: 3
                }).addTo(this.map);
                this.endMarker.bindTooltip(`终点: ${cityData.name}`, { permanent: true, direction: 'top' });

                const startName = CITIES.find(c => c.id === this.startCityId)?.name || this.startCityId;
                this.setStatus(`⏳ 正在寻路: ${startName} → ${cityData.name}...`);

                // 触发寻路
                setTimeout(() => this.generatePath(), 100);
            }
        };

        // 注册城市点击
        this.cityManager.setOnCityClick(this.cityClickHandler);
    }

    private disableCitySelection(): void {
        // 恢复默认的城市点击（不做任何事）
        this.cityManager.setOnCityClick(() => { });
    }

    private clearCitySelection(): void {
        this.startCityId = null;
        this.endCityId = null;
        if (this.startMarker) { this.map.removeLayer(this.startMarker); this.startMarker = null; }
        if (this.endMarker) { this.map.removeLayer(this.endMarker); this.endMarker = null; }

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

        // 3. 清改端点模式
        this.pendingEndpointChange = null;
        this.pendingConnectRoadId = null;
        if (this.connectBtn) {
            this.connectBtn.style.background = '#00897b';
            this.connectBtn.textContent = '🔗 连接';
        }
        if (this.cutModeEnabled) {
            this.cutModeEnabled = false;
            if (this.cutBtn) {
                this.cutBtn.style.background = '#ff7043';
                this.cutBtn.textContent = '✂ 切断';
            }
        }

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
            const [resRoads, resWater] = await Promise.all([
                fetch(`${basePath}assets/roads_filtered.geojson`),
                fetch(`${basePath}assets/ne_10m_rivers_lake_centerlines.geojson`)
            ]);
            
            if (!resRoads.ok || !resWater.ok) throw new Error('HTTP Fetch failed');
            
            const geojsonRoads = await resRoads.json();
            const geojsonWater = await resWater.json();
            
            this.cachedGeoJSON = geojsonRoads;  // [FIX] 缓存道路底图以便二次开启重用

            this.setStatus('⏳ 构建水陆混合图...');

            // 构建图
            this.buildGraphFromGeoJSON(geojsonRoads, geojsonWater);
            // [GAP-BRIDGE] 桥接 NE 数据中端点 ≤ 80km 的断段
            // [2026-05-30] 40 → 80km: 用户反馈 光禄城-头曼城 71km 也算直线
            //              NE 内蒙古/西伯利亚段 真实路网有 50-70km 断口
            //              桥接边权 ×2.5 高惩罚, Dijkstra 优先走真路, 不会乱连
            this.bridgeEndpointGaps(80);
            this.geoGraphBuilt = true;

            // 显示参考层
            this.showReferenceLayerFromData(geojsonRoads);

            this.setStatus('🏙️ 请点击第一个城市（起点）');
            let edgeCount = 0;
            for (const edges of this.geoAdj.values()) edgeCount += edges.length;
            console.log(`🛤️ [VectorRoadEditor] Graph built: ${this.geoNodes.length} nodes, ${edgeCount} edges`);

        } catch (err) {
            console.error('[VectorRoadEditor] Failed to load GeoJSON:', err);
            this.setStatus('❌ 加载路网失败');
        }
    }

    private buildGraphFromGeoJSON(geojsonRoads: any, geojsonWater?: any): void {
        const SNAP_TOLERANCE = 0.05; // ~5km 容差 (增大以确保连接)
        const MAGNETIC_SNAP = 0.08;  // ~8km 强力磁吸容差 (确保并行路合并)
        const nodeMap: Map<string, number> = new Map();

        const snapKey = (lat: number, lng: number): string => {
            const rLat = Math.round(lat / SNAP_TOLERANCE) * SNAP_TOLERANCE;
            const rLng = Math.round(lng / SNAP_TOLERANCE) * SNAP_TOLERANCE;
            return `${rLat.toFixed(3)}_${rLng.toFixed(3)}`;
        };

        const getOrCreateNode = (lat: number, lng: number): number => {
            const key = snapKey(lat, lng);
            if (nodeMap.has(key)) return nodeMap.get(key)!;

            const id = this.geoNodes.length;
            this.geoNodes.push({ id, lat, lng });
            this.geoAdj.set(id, []);
            nodeMap.set(key, id);
            return id;
        };

        const addEdge = (fromId: number, toId: number, coords: [number, number][], weightDiscount: number = 1.0, isWater: boolean = false) => {
            if (fromId === toId) return;
            const weight = this.calculatePathLength(coords) * weightDiscount;
            if (!isFinite(weight) || weight < 0.01) return; // NaN/Infinity/零距离保护

            const edge: GeoEdge = { from: fromId, to: toId, weight, coords, isWater };
            this.geoAdj.get(fromId)!.push(edge);

            const rev: GeoEdge = {
                from: toId, to: fromId, weight,
                coords: [...coords].reverse() as [number, number][],
                isWater
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

        // 桥接断裂的路段
        this.addBridgeEdges(0.03);

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
     * [GAP-BRIDGE] 桥接附近未直接相连的节点对 - 解决 NE 稀疏区(如黄土高原)断段
     * 桥接 degree ≤ 4 的节点(地理上是"端点或近端点"的位置), 跳过高密度十字路口
     * 高权重(×2.5)惩罚, Dijkstra 优先走真路
     */
    private bridgeEndpointGaps(maxDistKm: number): void {
        // 桥接候选: degree === 1 的真实端点 (死胡同/断头路)
        const endpoints: number[] = [];
        for (const node of this.geoNodes) {
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
                        if (d <= maxDistKm) {
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

    // ===== 在 GeoJSON 图上寻路 =====

    private generatePath(): void {
        if (!this.startCityId || !this.endCityId) return;

        const startCity = CITIES.find(c => c.id === this.startCityId);
        const endCity = CITIES.find(c => c.id === this.endCityId);
        if (!startCity || !endCity) {
            this.setStatus('❌ 找不到城市数据');
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
        const startCandidates = this.findKNearestGeoNodes(startCity.lat, startCity.lng, 4);
        let endCandidates = this.findKNearestGeoNodes(endCity.lat, endCity.lng, 4);

        // [FIX] 不再注入项目已有道路，不再做分支合流
        // 纯粹在 Natural Earth 路网上寻最短路径
        console.log(`🛤️ [PathGen] Start candidates: ${startCandidates.length}, End candidates: ${endCandidates.length}`);

        const candidatesList = this.buildRouteCandidates(startCity, endCity);
        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
        const detourLimit = directDist < 150 ? 6.0 : directDist < 500 ? 3.0 : 2.0;

        let bestPath: RouteCandidate | null = null;
        let bestIdx = 0;
        for (let i = 0; i < candidatesList.length; i++) {
            const candidate = candidatesList[i];
            if (candidate.isManualStraightLine) continue;
            const detourRatio = candidate.detourRatio
                ?? this.calculatePathLength(candidate.coordinates) / Math.max(1, directDist);
            if (detourRatio <= detourLimit) {
                bestPath = candidate;
                bestIdx = i;
                break;
            }
            console.warn(`⚠️ [PathGen] ${candidate.label} 绕行 ${detourRatio.toFixed(1)}x > ${detourLimit}x, 尝试下一候选`);
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
            const bridgedPath = this.findSmartBridgedPath(startCandidates[0].id, endCandidates[0].id);

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
        const roadName = `${startCity.name}-${endCity.name}`;
        const roadId = `road_${this.startCityId}_${this.endCityId}_${Date.now()}`;

        const newFeature: VectorRoadFeature = {
            type: 'Feature',
            properties: {
                name: roadName,
                type: 'road',
                id: roadId,
                startConnection: this.startCityId!,
                endConnection: this.endCityId!
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

        this.setStatus(`✅ ${roadName} (${distStr}, ${finalCoords.length}点) | 🔴拖拽微调 · 🟡点击加节点 · 右键删节点`);
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
            const candidate = this.pathCandidates[0];
            this.setStatus(this.formatCandidateStatus(candidate, 0, this.pathCandidates.length) + ' (再点切下一条)');
            return;
        }
        if (this.pathCandidates.length <= 1) return;

        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === this.selectedRoadId);
        if (!feature) return;

        const startCityId = feature.properties.startConnection;
        const endCityId = feature.properties.endConnection;
        const startCity = CITIES.find(c => c.id === startCityId);
        const endCity = CITIES.find(c => c.id === endCityId);
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

        const roadName = `${startCity.name}-${endCity.name}`;
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

        // 如果路径非常短，或者起终点的清理半径发生重叠，保留首尾
        if (firstOutsideIdx > lastOutsideIdx) {
            return [coords[0], coords[coords.length - 1]];
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
    private findSmartBridgedPath(startId: number, endId: number): { coordinates: [number, number][]; totalDistance: number; bridgeDist: number } | null {
        // 1. 获取两端的可达区域
        console.log(`🌉 [SmartBridge] Exploring Start Component...`);
        const startReachable = this.getAllReachableNodes(startId);
        console.log(`🌉 [SmartBridge] Start Component: ${startReachable.size} nodes`);

        console.log(`🌉 [SmartBridge] Exploring End Component...`);
        const endReachable = this.getAllReachableNodes(endId);
        console.log(`🌉 [SmartBridge] End Component: ${endReachable.size} nodes`);

        if (startReachable.size === 0 || endReachable.size === 0) return null;

        // 2. 建立 End Component 的空间网格索引 (0.1度 ~ 10km)
        const cellSize = 0.1;
        const grid: Map<string, number[]> = new Map();

        for (const nodeId of endReachable.keys()) {
            const node = this.geoNodes[nodeId];
            const key = `${Math.floor(node.lat / cellSize)}_${Math.floor(node.lng / cellSize)}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(nodeId);
        }

        // 3. 遍历 Start Component，寻找最近的 End Component 节点
        let bestPair: { u: number; v: number; dist: number } | null = null;
        let minTotalPenalty = Infinity;

        // 限制搜索范围，避免遍历所有组合。只搜索"看起来比较近"的。
        // 优化: 只遍历 Start Component 的边界节点? 不，遍历所有吧，1万个点很快。

        for (const [uId, uInfo] of startReachable) {
            const uNode = this.geoNodes[uId];
            const cx = Math.floor(uNode.lat / cellSize);
            const cy = Math.floor(uNode.lng / cellSize);

            // 搜索周围 5x5 网格 (范围 ~50km)
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const key = `${cx + dx}_${cy + dy}`;
                    const targetNodes = grid.get(key);
                    if (!targetNodes) continue;

                    for (const vId of targetNodes) {
                        const vNode = this.geoNodes[vId];

                        // 计算欧氏距离 (近似)
                        const dLat = uNode.lat - vNode.lat;
                        const dLng = (uNode.lng - vNode.lng) * Math.cos(uNode.lat * Math.PI / 180);
                        const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // km

                        // 代价 = 起点到u距离 + 桥接距离*1.2 (轻微惩罚) + v到终点距离
                        const vInfo = endReachable.get(vId)!;
                        const totalPenalty = uInfo.dist + (dist * 1.2) + vInfo.dist;

                        if (totalPenalty < minTotalPenalty) {
                            minTotalPenalty = totalPenalty;
                            bestPair = { u: uId, v: vId, dist };
                        }
                    }
                }
            }
        }

        if (!bestPair) return null;

        // 4. 重建路径
        const pathStart = this.reconstructPath(startReachable, startId, bestPair.u);
        const pathEnd = this.reconstructPath(endReachable, endId, bestPair.v).reverse(); // 注意: getAllReachable 是从 source 出发的

        const coords: [number, number][] = [];
        pathStart.forEach(c => coords.push(c));
        // 桥接段 (直线)无需插入，pathStart 包含 u, pathEnd 包含 v
        pathEnd.forEach(c => coords.push(c));

        return {
            coordinates: coords,
            totalDistance: minTotalPenalty, // 近似值
            bridgeDist: bestPair.dist
        };
    }

    private getAllReachableNodes(startId: number): Map<number, { dist: number; prev: number }> {
        const dists = new Map<number, { dist: number; prev: number }>();
        const pq: { id: number; dist: number }[] = [];

        dists.set(startId, { dist: 0, prev: -1 });
        pq.push({ id: startId, dist: 0 });

        while (pq.length > 0) {
            pq.sort((a, b) => a.dist - b.dist);
            const { id: u, dist: d } = pq.shift()!;

            if (d > (dists.get(u)?.dist ?? Infinity)) continue;

            const adj = this.geoAdj.get(u) || [];
            for (const edge of adj) {
                const v = edge.to;
                const newDist = d + edge.weight;
                if (newDist < (dists.get(v)?.dist ?? Infinity)) {
                    dists.set(v, { dist: newDist, prev: u });
                    pq.push({ id: v, dist: newDist });
                }
            }
        }
        return dists;
    }

    private reconstructPath(map: Map<number, { prev: number }>, startId: number, endId: number): [number, number][] {
        const path: [number, number][] = [];
        let curr = endId;
        while (curr !== -1 && curr !== startId) {
            path.push([this.geoNodes[curr].lng, this.geoNodes[curr].lat]);
            curr = map.get(curr)?.prev ?? -1;
        }
        path.push([this.geoNodes[startId].lng, this.geoNodes[startId].lat]);
        return path.reverse();
    }

    /** 水陆偏好权重系数（混合图内偏好，非 forbidWater） */
    private static readonly WATER_PREFERRED_WATER_FACTOR = 0.82;
    private static readonly WATER_PREFERRED_LAND_FACTOR = 1.18;
    private static readonly LAND_PREFERRED_WATER_FACTOR = 1.18;
    private static readonly LAND_PREFERRED_LAND_FACTOR = 0.82;

    private dijkstraGeo(startId: number, endId: number, options?: { penaltyEdges?: Set<string>, penaltyFactor?: number, forbidWater?: boolean, routePreference?: 'water_first' | 'land_first' }): {
        coordinates: [number, number][];
        totalDistance: number;
        edgeKeys: Set<string>;
    } | null {
        const dist: Map<number, number> = new Map();
        const prev: Map<number, { nodeId: number; edge: GeoEdge }> = new Map();
        const visited: Set<number> = new Set();

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

        dist.set(startId, 0);
        heapPush({ nodeId: startId, dist: 0 });

        while (heap.length > 0) {
            const item = heapPop()!;
            const current = item.nodeId;

            if (visited.has(current)) continue;
            visited.add(current);

            if (current === endId) break;

            const edges = this.geoAdj.get(current) || [];
            for (const edge of edges) {
                if (visited.has(edge.to)) continue;
                if (options?.forbidWater && edge.isWater) continue;
                
                let weight = edge.weight;
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

                const newDist = (dist.get(current) ?? Infinity) + weight;
                if (newDist < (dist.get(edge.to) ?? Infinity)) {
                    dist.set(edge.to, newDist);
                    prev.set(edge.to, { nodeId: current, edge });
                    heapPush({ nodeId: edge.to, dist: newDist });
                }
            }
        }

        if (!prev.has(endId)) {
            // DEBUG: 第一次失败时记录详情
            if (!this._dijkstraDebugLogged) {
                this._dijkstraDebugLogged = true;
                const startEdges = this.geoAdj.get(startId) || [];
                const nanEdges = startEdges.filter(e => !isFinite(e.weight));
                console.warn(`❌ [Dijkstra] FAILED: visited ${visited.size}/${this.geoNodes.length} nodes, start=${startId} has ${startEdges.length} edges (${nanEdges.length} NaN), end=${endId}`);
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

    private findKNearestGeoNodes(lat: number, lng: number, k: number): { id: number; dist: number }[] {
        const candidates: { id: number; dist: number }[] = [];

        for (const node of this.geoNodes) {
            const dLat = node.lat - lat;
            const dLng = (node.lng - lng) * Math.cos(lat * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            candidates.push({ id: node.id, dist });
        }

        candidates.sort((a, b) => a.dist - b.dist);
        return candidates.slice(0, k);
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
                    this.switchRouteBtn.title = '在智能候选池中切换（水路/陆路捷径/偏西偏东侧路/直线，最多6条）';
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
        const startCity = CITIES.find(c => c.id === feature.properties.startConnection);
        const endCity = CITIES.find(c => c.id === feature.properties.endConnection);
        if (!startCity || !endCity || !this.geoGraphBuilt || this.geoNodes.length === 0) return false;
        this.setStatus('⏳ 计算候选路径中 ...');
        const list = this.buildRouteCandidates(startCity, endCity);
        this.pathCandidates = list;
        this.currentCandidateIdx = 0;
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

    /** 极端绕行判定（中短程 >2.4× 或任意 >4×） */
    private isExtremeDetour(pathLen: number, directDist: number): boolean {
        const detourRatio = pathLen / Math.max(1, directDist);
        return (directDist <= 400 && detourRatio > 2.4) || detourRatio > 4.0;
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
            if (edge.isWater) waterKm += edge.weight;
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

    /** 候选是否与已有列表过于相似 */
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
            const exBucket = Math.round(ex.totalDistance / 5) * 5;
            if (Math.abs(bucket - exBucket) <= 10) {
                const overlap = this.edgeKeyOverlap(candidate.edgeKeys, ex.edgeKeys);
                const lenRatio = Math.abs(candidate.totalDistance - ex.totalDistance)
                    / Math.max(candidate.totalDistance, ex.totalDistance);
                // 里程差 >20% 时放宽重合判定，保留绕西山/绕东路等走廊
                const overlapLimit = lenRatio > 0.2 ? 0.9 : 0.75;
                if (overlap >= overlapLimit) return true;
            }
            if (this.arePathsEqual(candidate.coordinates, ex.coordinates)) return true;
        }
        return false;
    }

    /** 按模式与水路占比生成用户可读标签 */
    private buildVariantLabel(mode: RouteMode, waterRatio: number, variantIndex: number): string {
        if (mode === 'prefer_water') {
            if (waterRatio >= VectorRoadEditor.WATER_TRUNK_MIN_RATIO) {
                return variantIndex === 0 ? '水路主干' : `水路近岸${variantIndex + 1}`;
            }
            return variantIndex === 0 ? '水陆混合' : `水陆备选${variantIndex + 1}`;
        }
        if (mode === 'prefer_land') {
            return variantIndex === 0 ? '陆路捷径' : `陆路备选${variantIndex + 1}`;
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
            routePreference?: 'water_first' | 'land_first';
            penaltyEdges?: Set<string>;
        }
    ): { coordinates: [number, number][]; totalDistance: number; edgeKeys: Set<string> } | null {
        let best: { coordinates: [number, number][]; totalDistance: number; edgeKeys: Set<string> } | null = null;
        for (const s of startNodes) {
            for (const e of endNodes) {
                const path = this.dijkstraGeo(s.id, e.id, {
                    forbidWater: options.forbidWater,
                    routePreference: options.routePreference,
                    penaltyEdges: options.penaltyEdges,
                    penaltyFactor: VectorRoadEditor.VARIANT_PENALTY_FACTOR,
                });
                if (path && (!best || path.totalDistance < best.totalDistance)) {
                    best = path;
                }
            }
        }
        return best;
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

        const sc = this.findKNearestGeoNodes(startCity.lat, startCity.lng, 6);
        const ec = this.findKNearestGeoNodes(endCity.lat, endCity.lng, 6);
        const penaltyEdges = new Set<string>();
        const variants: RouteCandidate[] = [];
        const maxRounds = maxVariants * 4;

        for (let round = 0; round < maxRounds && variants.length < maxVariants; round++) {
            const variantIndex = variants.length;
            const usePureLand = mode === 'prefer_land' && variantIndex === 1;
            const routePreference = mode === 'prefer_water' ? 'water_first' : 'land_first';

            const best = this.dijkstraBestAmongNodes(sc, ec, {
                forbidWater: usePureLand,
                routePreference: usePureLand ? undefined : routePreference,
                penaltyEdges,
            });

            if (!best || !best.coordinates || best.coordinates.length < 2) break;

            const actualLen = this.calculatePathLength(best.coordinates as [number, number][]);
            if (this.isExtremeDetour(actualLen, directDist)) break;

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

            if (this.isCandidateDuplicate(draft, variants)) {
                for (const k of best.edgeKeys) penaltyEdges.add(k);
                continue;
            }

            variants.push(draft);
            for (const k of best.edgeKeys) penaltyEdges.add(k);
        }

        return variants;
    }

    /**
     * 在起终点连线中点向两侧偏移设途经点，各拼一条陆路。
     * 用于近距双走廊（如琵琶湖捷径 vs 日本海沿岸）。
     */
    private findLateralLandVariants(
        startCity: { lat: number; lng: number; name?: string },
        endCity: { lat: number; lng: number; name?: string },
        maxVariants: number
    ): RouteCandidate[] {
        if (!this.geoGraphBuilt || this.geoNodes.length === 0) return [];

        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
        if (directDist < 50) return [];

        const midLat = (startCity.lat + endCity.lat) / 2;
        const midLng = (startCity.lng + endCity.lng) / 2;
        const dLat = endCity.lat - startCity.lat;
        const dLng = (endCity.lng - startCity.lng) * Math.cos(midLat * Math.PI / 180);
        const len = Math.hypot(dLat, dLng) || 1e-9;
        const nLat = -dLng / len;
        const nLng = dLat / len;
        const cosMid = Math.cos(midLat * Math.PI / 180);

        const sc = this.findKNearestGeoNodes(startCity.lat, startCity.lng, 5);
        const ec = this.findKNearestGeoNodes(endCity.lat, endCity.lng, 5);
        const sideKm = Math.min(55, Math.max(28, directDist * 0.22));
        const offsetDeg = sideKm / 111;

        const out: RouteCandidate[] = [];
        const sides: { sign: -1 | 1; label: string }[] = [
            { sign: -1, label: '陆路偏西' },
            { sign: 1, label: '陆路偏东' },
        ];

        for (const { sign, label } of sides) {
            if (out.length >= maxVariants) break;

            const wLat = midLat + nLat * offsetDeg * sign;
            const wLng = midLng + (nLng * offsetDeg * sign) / cosMid;
            const wc = this.findKNearestGeoNodes(wLat, wLng, 3);

            const leg1 = this.dijkstraBestAmongNodes(sc, wc, {
                forbidWater: true,
                routePreference: 'land_first',
            });
            const leg2 = this.dijkstraBestAmongNodes(wc, ec, {
                forbidWater: true,
                routePreference: 'land_first',
            });
            if (!leg1?.coordinates?.length || !leg2?.coordinates?.length) continue;

            const coordinates = [
                ...leg1.coordinates,
                ...leg2.coordinates.slice(1),
            ] as [number, number][];
            const totalDistance = leg1.totalDistance + leg2.totalDistance;
            if (this.isExtremeDetour(totalDistance, directDist)) continue;

            const edgeKeys = new Set<string>([...leg1.edgeKeys, ...leg2.edgeKeys]);
            const draft: RouteCandidate = {
                mode: 'prefer_land',
                label,
                coordinates,
                totalDistance,
                edgeKeys,
                isManualStraightLine: false,
                waterRatio: 0,
                detourRatio: totalDistance / Math.max(1, directDist),
                variantReason: `侧向${sideKm.toFixed(0)}km`,
            };
            if (this.isCandidateDuplicate(draft, out)) continue;
            out.push(draft);
        }

        return out;
    }

    /**
     * 智能候选池：每模式多条变体 → 评分排序 → 去重 → 截断前 6 条。
     * 排序：水路 2–3 条 → 陆路 2 条 → 直线兜底。
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
        const landRanked = scoreAndSort(landRaw).slice(0, VectorRoadEditor.LAND_VARIANTS_PER_MODE);

        const merged: RouteCandidate[] = [];
        for (const c of waterRanked) {
            if (!this.isCandidateDuplicate(c, merged)) merged.push(c);
        }
        for (const c of landRanked) {
            if (!this.isCandidateDuplicate(c, merged)) merged.push(c);
        }
        // 侧向途经：中点偏西/偏东各试一条，挖北陆道等第二条陆路走廊
        const lateralLand = this.findLateralLandVariants(startCity, endCity, 2);
        for (const c of lateralLand) {
            if (merged.length >= VectorRoadEditor.MAX_ROUTE_CANDIDATES) break;
            if (!this.isCandidateDuplicate(c, merged)) {
                c.score = this.scoreRouteCandidate(c, directDist, merged);
                merged.push(c);
            }
        }
        const straight = straightRaw[0];
        if (straight && merged.length < VectorRoadEditor.MAX_ROUTE_CANDIDATES) {
            if (!this.isCandidateDuplicate(straight, merged)) {
                straight.score = this.scoreRouteCandidate(straight, directDist, merged);
                merged.push(straight);
            }
        }

        const finalList = merged.slice(0, VectorRoadEditor.MAX_ROUTE_CANDIDATES);

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
        let sumLng = 0, sumLat = 0;
        for (const [lng, lat] of coords) { sumLng += lng; sumLat += lat; }
        const cLng = sumLng / coords.length;
        const cLat = sumLat / coords.length;
        this.map.panTo([cLat, cLng], { animate: true, duration: 0.5 });
    }

    private showControlPoints(roadId: string): void {
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
        if (!feature) return;

        const coords = feature.geometry.coordinates;
        const markers: L.CircleMarker[] = [];
        const mids: L.CircleMarker[] = [];

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
                fillOpacity: 1, weight: 2, interactive: true
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

            const mid = L.circleMarker([midLat, midLng], {
                radius: 4, color: '#ffc107', fillColor: '#ffeb3b',
                fillOpacity: 0.8, weight: 1, interactive: true
            }).addTo(this.map);

            const insertIdx = i + 1;
            mid.on('click', (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e);
                coords.splice(insertIdx, 0, [midLng, midLat]);
                roadRegistry.updateVectorRoadCoordinates(roadId, coords);
                this.renderRoad(roadId);
                this.showControlPoints(roadId);
                const roadName = feature.properties.name || roadId;
                this.setStatus(`➕ 已加节点 · ${roadName} (${coords.length}点) · 🟡点击加 · 🔴右键删`);
            });

            mid.bindTooltip('点击添加节点', { permanent: false, direction: 'top' });
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
            // [FIX 2026-06-02] 切断模式优先于拖拽，避免 click 被拖拽流程吞掉导致“切断不生效”
            if (this.cutModeEnabled) {
                L.DomEvent.stopPropagation(e);
                if (this.selectedRoadId !== roadId) {
                    this.setStatus('⚠ 请先选中要切断的道路');
                    return;
                }
                this.splitRoadAtPoint(roadId, pointIndex);
                return;
            }
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

    private toggleCutMode(): void {
        this.cutModeEnabled = !this.cutModeEnabled;
        if (this.cutBtn) {
            this.cutBtn.style.background = this.cutModeEnabled ? '#d84315' : '#ff7043';
            this.cutBtn.textContent = this.cutModeEnabled ? '✂ 切断中' : '✂ 切断';
        }
        if (this.cutModeEnabled) {
            this.setStatus('✂ 切断模式：点击红色控制点即可一刀分两段');
        } else {
            this.setStatus('✅ 已退出切断模式');
        }
    }

    private splitRoadAtPoint(roadId: string, pointIndex: number): void {
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
        if (!feature) return;
        const coords = feature.geometry.coordinates as [number, number][];
        if (coords.length < 3) {
            this.setStatus('⚠ 点太少，无法切断');
            return;
        }
        if (pointIndex <= 0 || pointIndex >= coords.length - 1) {
            this.setStatus('⚠ 只能在中间红点切断（首尾点不能切）');
            return;
        }

        const coordsA = coords.slice(0, pointIndex + 1);
        const coordsB = coords.slice(pointIndex);
        const baseName = feature.properties.name || roadId;
        const idA = `road_${Date.now()}_a`;
        const idB = `road_${Date.now()}_b`;

        const partA: VectorRoadFeature = {
            type: 'Feature',
            properties: {
                name: `${baseName}(上段)`,
                type: 'road',
                id: idA,
                startConnection: feature.properties.startConnection,
                endConnection: undefined
            },
            geometry: { type: 'LineString', coordinates: coordsA }
        };
        const partB: VectorRoadFeature = {
            type: 'Feature',
            properties: {
                name: `${baseName}(下段)`,
                type: 'road',
                id: idB,
                startConnection: undefined,
                endConnection: feature.properties.endConnection
            },
            geometry: { type: 'LineString', coordinates: coordsB }
        };

        roadRegistry.removeVectorRoad(roadId);
        roadRegistry.addVectorRoad(partA);
        roadRegistry.addVectorRoad(partB);

        this.removeRoadLayers(roadId);
        this.renderRoad(idA);
        this.renderRoad(idB);
        this.updateRoadSelect();
        this.selectRoad(idA);

        this.setStatus(`✂ 已切断：${baseName} → 2 段（记得点保存）`);
    }

    private handleConnectRoads(): void {
        if (!this.selectedRoadId) {
            this.setStatus('⚠ 请先选中道路');
            return;
        }
        if (!this.pendingConnectRoadId) {
            this.pendingConnectRoadId = this.selectedRoadId;
            if (this.connectBtn) {
                this.connectBtn.style.background = '#00695c';
                this.connectBtn.textContent = '🔗 选第2条';
            }
            this.setStatus('🔗 已选第1条路，请选第2条后再点连接');
            return;
        }
        if (this.pendingConnectRoadId === this.selectedRoadId) {
            this.setStatus('⚠ 第2条不能与第1条相同');
            return;
        }
        this.connectTwoRoads(this.pendingConnectRoadId, this.selectedRoadId);
        this.pendingConnectRoadId = null;
        if (this.connectBtn) {
            this.connectBtn.style.background = '#00897b';
            this.connectBtn.textContent = '🔗 连接';
        }
    }

    private connectTwoRoads(roadAId: string, roadBId: string): void {
        const a = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadAId);
        const b = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadBId);
        if (!a || !b) {
            this.setStatus('⚠ 连接失败：找不到道路');
            return;
        }

        let aCoords = [...(a.geometry.coordinates as [number, number][])];
        let bCoords = [...(b.geometry.coordinates as [number, number][])];
        if (aCoords.length < 2 || bCoords.length < 2) {
            this.setStatus('⚠ 连接失败：道路点数不足');
            return;
        }

        const aStart = aCoords[0], aEnd = aCoords[aCoords.length - 1];
        const bStart = bCoords[0], bEnd = bCoords[bCoords.length - 1];
        const dist = (p1: [number, number], p2: [number, number]) =>
            this.haversine(p1[1], p1[0], p2[1], p2[0]);

        const candidates = [
            { pair: 'aEnd_bStart', d: dist(aEnd, bStart) },
            { pair: 'aEnd_bEnd', d: dist(aEnd, bEnd) },
            { pair: 'aStart_bStart', d: dist(aStart, bStart) },
            { pair: 'aStart_bEnd', d: dist(aStart, bEnd) }
        ].sort((x, y) => x.d - y.d);

        const best = candidates[0];
        if (best.pair === 'aStart_bStart') aCoords = [...aCoords].reverse();
        else if (best.pair === 'aStart_bEnd') { aCoords = [...aCoords].reverse(); bCoords = [...bCoords].reverse(); }
        else if (best.pair === 'aEnd_bEnd') bCoords = [...bCoords].reverse();

        const tailA = aCoords[aCoords.length - 1];
        const headB = bCoords[0];
        const touchKm = dist(tailA, headB);
        const merged = touchKm < 1
            ? [...aCoords, ...bCoords.slice(1)]
            : [...aCoords, ...bCoords];

        const mergedFeature: VectorRoadFeature = {
            type: 'Feature',
            properties: {
                name: `${a.properties.name || roadAId}+${b.properties.name || roadBId}`,
                type: 'road',
                id: `road_${Date.now()}_merge`,
                startConnection: a.properties.startConnection,
                endConnection: b.properties.endConnection
            },
            geometry: { type: 'LineString', coordinates: merged }
        };

        roadRegistry.removeVectorRoad(roadAId);
        roadRegistry.removeVectorRoad(roadBId);
        roadRegistry.addVectorRoad(mergedFeature);

        this.removeRoadLayers(roadAId);
        this.removeRoadLayers(roadBId);
        this.renderRoad(mergedFeature.properties.id);
        this.updateRoadSelect();
        this.selectRoad(mergedFeature.properties.id);

        this.setStatus(`🔗 已连接两条路（间距 ${best.d.toFixed(1)}km），记得点保存`);
    }

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

            const startCity = CITIES.find(c => c.id === startCityId);
            const endCity = CITIES.find(c => c.id === endCityId);
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
            const startCandidates = this.findKNearestGeoNodes(startCity.lat, startCity.lng, 5);
            const endCandidates = this.findKNearestGeoNodes(endCity.lat, endCity.lng, 5);

            let bestPath: { coordinates: [number, number][]; totalDistance: number } | null = null;
            let bestDist = Infinity;

            for (const sc of startCandidates) {
                for (const ec of endCandidates) {
                    const path = this.dijkstraGeo(sc.id, ec.id);
                    if (path && path.totalDistance < bestDist) {
                        bestPath = path;
                        bestDist = path.totalDistance;
                    }
                }
            }

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
    //   B. 重复/重叠 (来自 batchDetectOverlaps 的检测逻辑)
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

    private detectAllIssues(): void {
        const features = VECTOR_ROAD_DATA.features;
        const validCityIds = new Set<string>(CITIES.map(c => c.id));

        const issues = {
            missingStart: [] as Array<{ id: string; name: string }>,
            missingEnd: [] as Array<{ id: string; name: string }>,
            invalidStart: [] as Array<{ id: string; name: string; ref: string }>,
            invalidEnd: [] as Array<{ id: string; name: string; ref: string }>,
            sameStartEnd: [] as Array<{ id: string; name: string; ref: string }>,
            tooFewPoints: [] as Array<{ id: string; name: string; count: number }>,
            // [2026-05-30 删除] 直线检测已停用 (用户公理: 没什么用)
            straightLines: [] as Array<{ id: string; name: string; pointCount: number; lengthKm: number; straightKm: number; ratio: number; startName: string; endName: string }>,
            // [2026-05-30 新] 端点漂移: 城坐标改了, 但道路 coords[0]/[-1] 是旧坐标
            endpointDrift: [] as Array<{ id: string; name: string; whichEnd: 'start' | 'end'; cityName: string; driftKm: number; cityCoord: [number, number]; roadCoord: [number, number] }>,
            // [2026-05-30 新] 名称过期: 道路 name 字段跟 startCity/endCity 当前 name 不匹配
            nameMismatch: [] as Array<{ id: string; oldName: string; expectedName: string; startName: string; endName: string }>,
            duplicates: [] as Array<{ keepId: string; deleteId: string; keepName: string; deleteName: string; reason: string; overlapPoints: number; ratioA: number; ratioB: number }>,
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

            // [2026-05-30 删除] 直线检测已停用 (用户公理: 没什么用)

            // [2026-05-30 新] 端点漂移检测 (城坐标改了 / 移走了)
            const DRIFT_THRESHOLD_KM = 5; // 漂移 > 5km 算异常
            if (startId && validCityIds.has(startId) && coords.length >= 1) {
                const c = CITIES.find(x => x.id === startId)!;
                const [lng0, lat0] = coords[0];
                const drift = this.haversine(lat0, lng0, c.lat, c.lng);
                if (drift > DRIFT_THRESHOLD_KM) {
                    issues.endpointDrift.push({
                        id, name,
                        whichEnd: 'start',
                        cityName: c.name,
                        driftKm: Math.round(drift * 10) / 10,
                        cityCoord: [c.lat, c.lng],
                        roadCoord: [lat0, lng0],
                    });
                }
            }
            if (endId && validCityIds.has(endId) && coords.length >= 2) {
                const c = CITIES.find(x => x.id === endId)!;
                const [lng1, lat1] = coords[coords.length - 1];
                const drift = this.haversine(lat1, lng1, c.lat, c.lng);
                if (drift > DRIFT_THRESHOLD_KM) {
                    issues.endpointDrift.push({
                        id, name,
                        whichEnd: 'end',
                        cityName: c.name,
                        driftKm: Math.round(drift * 10) / 10,
                        cityCoord: [c.lat, c.lng],
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

        const totalRoads = features.length;
        const orphanCities = this.getOrphanCities();
        const singleRoadCities = this.getSingleRoadCities();
        const totalIssues = issues.invalidStart.length + issues.invalidEnd.length +
            issues.sameStartEnd.length + issues.tooFewPoints.length +
            issues.duplicates.length +
            issues.endpointDrift.length;

        // ───── 控制台分组打印 ─────
        console.group(`🔍 [全面审查] ${totalRoads} 条路 · 问题 ${totalIssues} 项 · 孤儿城 ${orphanCities.length} · 单路据点 ${singleRoadCities.length}`);
        if (orphanCities.length) {
            console.group(`📋 孤儿城 (无路连接) [${orphanCities.length}]`);
            orphanCities.forEach(c => console.log(`  ${c.name}  [${c.id}]  (${c.lat.toFixed(2)}, ${c.lng.toFixed(2)})`));
            console.groupEnd();
        }
        if (singleRoadCities.length) {
            console.group(`🛤️ 单路据点 (仅 1 条路) [${singleRoadCities.length}]`);
            singleRoadCities.forEach(c => console.log(`  ${c.name}  [${c.id}]  → ${c.roadName} ↔ ${c.peerName}`));
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
        if (totalIssues === 0 && orphanCities.length === 0 && singleRoadCities.length === 0) {
            this.setStatus(`✅ 审查通过：${totalRoads} 条道路全部正常`);
        } else if (totalIssues === 0) {
            this.setStatus(`✅ 道路无问题 · 孤儿城 ${orphanCities.length} · 单路据点 ${singleRoadCities.length}`);
        } else {
            this.setStatus(`⚠ 问题 ${totalIssues} 项 · 孤儿城 ${orphanCities.length} · 单路据点 ${singleRoadCities.length}`);
        }
        this.showAuditReportModal(issues, totalRoads, totalIssues, orphanCities, singleRoadCities);
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
        singleRoadCities: Array<{ id: string; name: string; lat: number; lng: number; roadName: string; peerName: string }>
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

        const infoOnly = totalIssues === 0 && orphanCities.length === 0 && singleRoadCities.length === 0;
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
                    单路据点 <b style="color:${singleRoadCities.length > 0 ? '#ff9800' : '#4caf50'}">${singleRoadCities.length}</b>
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
                    <div style="color:#aaa;">✓ 端点完整 ✓ 无自环 ✓ 无重叠 (30% 阈值) ✓ 无孤儿城 ✓ 无单路据点</div>
                </div>
            `;
        } else {
            // [2026-05-30] 收集所有问题路 id (供编辑器内 ◀ ▶ 导航用)
            const allProblemIds: string[] = [];

            // [2026-05-30 删除] 直线检测已停用 (用户公理)

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

            // 孤儿城：没有任何道路连接的据点（信息项，非道路错误）
            const orphanItems = orphanCities.slice(0, 80).map(c => ({
                html: `<b>${c.name}</b> · (${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}) <span style="color:#666;font-size:11px;">[${c.id}]</span>`,
                cityId: c.id,
            }));
            html += citySection('📋 孤儿城 (无路连接)', '#ff9800', orphanCities.length, orphanItems);
            if (orphanCities.length > 80) {
                html += `<div style="color:#888;font-size:12px;margin-bottom:12px;">… 另有 ${orphanCities.length - 80} 座，见 F12 控制台完整列表</div>`;
            }

            const singleRoadItems = singleRoadCities.slice(0, 80).map(c => ({
                html: `<b>${c.name}</b> · 仅连 <span style="color:#ffb74d">${c.roadName}</span> ↔ <b>${c.peerName}</b> <span style="color:#666;font-size:11px;">[${c.id}]</span>`,
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
            html += section('🚶 端点漂移 (城坐标已改, 道路端点未跟)', '#ff9800', issues.endpointDrift.length, driftItems);

            // [2026-05-30 删除] 名称过期检测停用 (用户公理: 不影响功能)

            // 把问题路 id 列表存到编辑器, 供 [◀ 上问题/下问题 ▶] 用
            this.problemRoadIds = allProblemIds;

            if (totalIssues > 0) {
                html += `
                    <div style="margin-top:24px;padding:14px 18px;background:rgba(76,175,80,0.1);border-left:4px solid #4caf50;border-radius:6px;">
                        <div style="font-weight:bold;color:#4caf50;margin-bottom:6px;">下一步操作</div>
                        <div style="color:#ccc;line-height:1.8;">
                            1. 在下拉框选中问题路，逐条 <b>删除</b> 或 <b>改端点</b> 修复<br>
                            2. 看 <b style="color:#e91e63">重叠</b> 项: 如重叠源于据点过近, 考虑移据点 ≥50km<br>
                            3. 控制台 F12 有完整列表 (超过 80 条的部分)
                        </div>
                    </div>
                `;
            } else if (orphanCities.length > 0 || singleRoadCities.length > 0) {
                html += `
                    <div style="margin-top:24px;padding:14px 18px;background:rgba(255,152,0,0.1);border-left:4px solid #ff9800;border-radius:6px;">
                        <div style="font-weight:bold;color:#ff9800;margin-bottom:6px;">路网补全提示</div>
                        <div style="color:#ccc;line-height:1.8;">
                            道路数据无结构性错误。上方 <b>孤儿城</b> / <b>单路据点</b> 为连通性提示。<br>
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
            const city = CITIES.find(c => c.id === cityId);
            if (!city) return;
            close();
            this.map.panTo([city.lat, city.lng], { animate: true, duration: 0.5 });
            this.setStatus(`📍 孤儿城: ${city.name} (${city.lat.toFixed(2)}, ${city.lng.toFixed(2)})`);
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
    private getCityRoadConnectionCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const f of VECTOR_ROAD_DATA.features) {
            if (!f?.properties) continue;
            const start = f.properties.startConnection;
            const end = f.properties.endConnection;
            if (start) counts.set(start, (counts.get(start) ?? 0) + 1);
            if (end) counts.set(end, (counts.get(end) ?? 0) + 1);
        }
        return counts;
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
        roadName: string; peerName: string; roadId: string;
    }> {
        const counts = this.getCityRoadConnectionCounts();
        const cityById = new Map(CITIES.map(c => [c.id, c]));
        const result: Array<{
            id: string; name: string; lat: number; lng: number;
            roadName: string; peerName: string; roadId: string;
        }> = [];

        for (const city of CITIES) {
            if ((counts.get(city.id) ?? 0) !== 1) continue;
            let roadName = '(未命名)';
            let peerName = '?';
            let roadId = '';
            for (const f of VECTOR_ROAD_DATA.features) {
                if (!f?.properties) continue;
                const start = f.properties.startConnection;
                const end = f.properties.endConnection;
                if (start !== city.id && end !== city.id) continue;
                roadId = f.properties.id || '';
                roadName = f.properties.name || roadName;
                const peerId = start === city.id ? end : start;
                peerName = cityById.get(peerId)?.name ?? peerId ?? '?';
                break;
            }
            result.push({
                id: city.id,
                name: city.name,
                lat: city.lat,
                lng: city.lng,
                roadName,
                peerName,
                roadId,
            });
        }
        return result.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    }

    /** 🛤️ 单路据点：仅 1 条路连接的城（独立按钮，亦见全面审查） */
    private reportSingleRoadCities(): void {
        const singles = this.getSingleRoadCities();
        console.group(`🛤️ [单路据点] ${singles.length} 座（仅 1 条路，正常应 ≥2）`);
        singles.forEach(c => console.log(`  ${c.name}  [${c.id}]  → ${c.roadName} ↔ ${c.peerName}`));
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
                html: `<b>${c.name}</b> · 仅连 <span style="color:#ffb74d">${c.roadName}</span> ↔ <b>${c.peerName}</b> <span style="color:#666;font-size:11px;">[${c.id}]</span>`,
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
            const city = CITIES.find(c => c.id === cityId);
            if (!city) return;
            close();
            this.map.panTo([city.lat, city.lng], { animate: true, duration: 0.5 });
            this.setStatus(`📍 ${city.name} (${city.lat.toFixed(2)}, ${city.lng.toFixed(2)})`);
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
        const validCityIds = new Set<string>(CITIES.map(c => c.id));

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

        // 收集所有有效城市 ID
        const validCityIds = new Set<string>();
        for (const city of CITIES) {
            validCityIds.add(city.id);
        }

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

        // [2026-05-30] 区过滤: 只处理选中的区, null = 全部
        const targetRegion = this.selectedRegion;
        const regionLabel = targetRegion ? REGION_LABELS[targetRegion] : '全部跨区';

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
                const cSc = this.findKNearestGeoNodes(city.lat, city.lng, 3);
                const cEc = this.findKNearestGeoNodes(other.lat, other.lng, 3);
                let roadDist = Infinity;
                for (const s of cSc) for (const e of cEc) {
                    const p = this.dijkstraGeo(s.id, e.id, { forbidWater: true });
                    if (p && p.totalDistance < roadDist) roadDist = p.totalDistance;
                }
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
            const sc = this.findKNearestGeoNodes(a.lat, a.lng, 5);
            const ec = this.findKNearestGeoNodes(b.lat, b.lng, 5);
            let bestPath: any = null;
            let bestPathDist = Infinity;
            for (const s of sc) for (const e of ec) {
                const p = this.dijkstraGeo(s.id, e.id, { forbidWater: true });
                if (p && p.totalDistance < bestPathDist) { bestPath = p; bestPathDist = p.totalDistance; }
            }

            if (!bestPath) {
                rejectedNoPath++;
                if (sampleRejects.length < 5) sampleRejects.push(`${a.name}↔${b.name} (${dist.toFixed(0)}km, 无NE)`);
                continue;
            }

            const detour = bestPathDist / Math.max(dist, 1);
            if (detour > VectorRoadEditor.MAX_DETOUR_RATIO) {
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

    /**
     * [SNAP] Find nearest point on OTHER roads (pixel based)
     * Prioritizes existing vertices (Nodes) over edges.
     */
    private findSnapTarget(lat: number, lng: number, excludeRoadId: string): { lat: number, lng: number } | null {
        let bestPoint: { lat: number, lng: number } | null = null;
        let minDist = Infinity;
        const SNAP_THRESHOLD_PX = 15; // Snap within 15 pixels

        const currentPoint = this.map.latLngToContainerPoint([lat, lng]);

        for (const feature of VECTOR_ROAD_DATA.features) {
            if (feature.properties.id === excludeRoadId) continue;
            if (!feature.geometry.coordinates) continue;

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

