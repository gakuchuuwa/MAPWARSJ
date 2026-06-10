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
}

export class VectorRoadEditorOSM implements IEditor {
    public name = '矢量道路编辑器';
    public icon = '🛤️';

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
    private cachedGeoJSON: any = null;  // [V2-OSM-FIX] 缓存原始 GeoJSON, 用于二次开启时重建参考层

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

    // === 候选路径缓存与切换支持 ===
    private pathCandidates: { coordinates: [number, number][]; totalDistance: number }[] = [];
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
        this.renderAllRoads();
        // === 关键: 等图构建完再允许城市选择 ===
        this.loadGeoJSONGraph().then(() => {
            this.enableCitySelection();
            console.log(`✅ [VectorRoadEditor] Ready! ${this.geoNodes.length} graph nodes`);
        });
    }

    public hide(): void {
        this.visible = false;
        this.clearEditLayers();
        this.removeReferenceLayer();
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
        this.panel.id = 'vector-road-editor-osm-panel';
        this.panel.style.cssText = `
            position: fixed;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 30, 40, 0.95);
            color: #e0e0e0;
            padding: 12px 20px;
            border-radius: 12px;
            display: flex;
            gap: 12px;
            align-items: center;
            z-index: 10000;
            font-family: 'Microsoft YaHei', sans-serif;
            font-size: 13px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,215,0,0.3);
        `;

        // 状态提示
        this.statusLabel = document.createElement('span');
        this.statusLabel.style.cssText = 'color: #ffd700; min-width: 200px; font-weight: bold;';
        this.statusLabel.textContent = '🏙️ 请点击第一个城市（起点）';

        // 道路搜索过滤
        this.roadFilter = document.createElement('input');
        this.roadFilter.type = 'text';
        this.roadFilter.placeholder = '🔍 搜索道路...';
        this.roadFilter.style.cssText = `
            background: #2a2a3a; color: #e0e0e0; border: 1px solid #555;
            border-radius: 6px; padding: 6px 10px; font-size: 12px; width: 120px;
            outline: none;
        `;
        this.roadFilter.addEventListener('input', () => {
            this.updateRoadSelect();
        });

        // 道路列表
        this.roadSelect = document.createElement('select');
        this.roadSelect.style.cssText = `
            background: #2a2a3a; color: #ffd700; border: 1px solid #555;
            border-radius: 6px; padding: 6px 10px; font-size: 12px; min-width: 140px;
        `;
        this.updateRoadSelect();
        this.roadSelect.addEventListener('change', () => {
            this.selectRoad(this.roadSelect!.value);
        });

        // 参考层开关
        const refToggle = document.createElement('label');
        refToggle.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;';
        const refCheck = document.createElement('input');
        refCheck.type = 'checkbox';
        refCheck.checked = true; // 默认开启参考层
        refCheck.addEventListener('change', () => {
            if (refCheck.checked) this.showReferenceLayer();
            else this.removeReferenceLayer();
        });
        refToggle.appendChild(refCheck);
        refToggle.appendChild(document.createTextNode('🗺️ 路网'));

        // 重置按钮
        const resetBtn = this.createButton('🔄 重选', '#ff5722', () => {
            this.selectRoad(''); // 清除当前选中的已有道路编辑状态及控制点
            this.clearCitySelection();
            this.setStatus('🏙️ 请点击第一个城市（起点）');
        });

        // 导出按钮
        const exportBtn = this.createButton('📋 导出', '#2196f3', () => this.exportToClipboard());

        // 保存按钮
        const saveBtn = this.createButton('💾 保存', '#4caf50', () => this.saveToFile());

        // 删除按钮
        const deleteBtn = this.createButton('🗑️ 删除', '#f44336', () => this.deleteSelectedRoad());

        // 改起点/终点按钮
        const changeStartBtn = this.createButton('📍 改起点', '#9c27b0', () => this.enterChangeEndpointMode('start'));
        const changeEndBtn = this.createButton('📍 改终点', '#673ab7', () => this.enterChangeEndpointMode('end'));

        // 切换路径按钮
        this.switchRouteBtn = this.createButton('🔀 切换路径', '#009688', () => this.cycleCandidates());
        this.switchRouteBtn.style.display = 'none';

        this.panel.appendChild(this.statusLabel);
        this.panel.appendChild(this.roadFilter);
        this.panel.appendChild(this.roadSelect);
        this.panel.appendChild(refToggle);
        this.panel.appendChild(resetBtn);
        this.panel.appendChild(changeStartBtn);
        this.panel.appendChild(changeEndBtn);
        this.panel.appendChild(this.switchRouteBtn);
        this.panel.appendChild(exportBtn);
        this.panel.appendChild(saveBtn);
        this.panel.appendChild(deleteBtn);

        // === 批量处理按钮 ===
        const dedupBtn = this.createButton('🔍 查重', '#ff9800', () => this.batchDetectOverlaps());
        const simplifyBtn = this.createButton('✂️ 简化', '#795548', () => this.batchSimplifyAllRoads());
        this.panel.appendChild(dedupBtn);
        this.panel.appendChild(simplifyBtn);

        document.body.appendChild(this.panel);
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

            // 后处理: 去折角 + 抽稀 + 吸附
            const cleaned = removeBacktracks(rawCoords, 80);
            const simplified = this.simplifyCoords(cleaned, 0.002);
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
                const simplified = this.simplifyCoords(cleaned, 0.002);
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
        btn.style.cssText = `
            background: ${bg}; color: white; border: none; border-radius: 6px;
            padding: 6px 14px; cursor: pointer; font-weight: bold; font-size: 12px;
        `;
        btn.addEventListener('click', onClick);
        return btn;
    }

    private setStatus(text: string): void {
        if (this.statusLabel) this.statusLabel.textContent = text;
    }

    private updateRoadSelect(): void {
        if (!this.roadSelect) return;
        const filterText = (this.roadFilter?.value || '').toLowerCase().trim();
        this.roadSelect.innerHTML = '<option value="">-- 已有道路 --</option>';
        for (const feature of VECTOR_ROAD_DATA.features) {
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
        if (this.switchRouteBtn) this.switchRouteBtn.style.display = 'none';
    }

    // ===== GeoJSON 路网图构建 =====

    private async loadGeoJSONGraph(): Promise<void> {
        // [V2-OSM-FIX] 二次开启: 图已构建, 用缓存的 GeoJSON 重建参考层
        if (this.geoGraphBuilt) {
            if (this.cachedGeoJSON) {
                this.showReferenceLayerFromData(this.cachedGeoJSON);
            }
            return;
        }

        this.setStatus('⏳ 加载路网数据...');

        try {
            const basePath = import.meta.env.BASE_URL || '/';
            const res = await fetch(`${basePath}assets/roads_osm_test.geojson`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const geojson = await res.json();
            this.cachedGeoJSON = geojson;  // [V2-OSM-FIX] 缓存以便二次开启重用

            this.setStatus('⏳ 构建路网图...');

            // 构建图
            this.buildGraphFromGeoJSON(geojson);
            // [GAP-BRIDGE] 同 NE 编辑器, 桥接 ≤20km 端点断段
            this.bridgeEndpointGaps(20);
            this.geoGraphBuilt = true;

            // 显示参考层
            this.showReferenceLayerFromData(geojson);

            this.setStatus('🏙️ 请点击第一个城市（起点）');
            let edgeCount = 0;
            for (const edges of this.geoAdj.values()) edgeCount += edges.length;
            console.log(`🌐 [VectorRoadEditorOSM] Graph built: ${this.geoNodes.length} nodes, ${edgeCount} edges`);

        } catch (err) {
            console.error('[VectorRoadEditorOSM] Failed to load GeoJSON:', err);
            this.setStatus('❌ 加载路网失败');
        }
    }

    private buildGraphFromGeoJSON(geojson: any): void {
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

        const addEdge = (fromId: number, toId: number, coords: [number, number][], weightDiscount: number = 1.0) => {
            if (fromId === toId) return;
            const weight = this.calculatePathLength(coords) * weightDiscount;
            if (!isFinite(weight) || weight < 0.01) return; // NaN/Infinity/零距离保护

            const edge: GeoEdge = { from: fromId, to: toId, weight, coords };
            this.geoAdj.get(fromId)!.push(edge);

            const rev: GeoEdge = {
                from: toId, to: fromId, weight,
                coords: [...coords].reverse() as [number, number][]
            };
            this.geoAdj.get(toId)!.push(rev);
        };

        // [FIX] 不再注入项目已有道路（VECTOR_ROAD_DATA）到图中
        // 道路编辑器纯粹基于 Natural Earth 路网寻最短路径

        // === 注入 Natural Earth 路网 ===
        const processLineString = (coords: [number, number][]) => {
            if (coords.length < 2) return;
            for (let i = 0; i < coords.length - 1; i++) {
                const [lng1, lat1] = coords[i];
                const [lng2, lat2] = coords[i + 1];
                const fromId = getOrCreateNode(lat1, lng1);
                const toId = getOrCreateNode(lat2, lng2);
                addEdge(fromId, toId, [coords[i], coords[i + 1]]);
            }
        };

        const features = geojson.features || [];
        let skippedExpressway = 0;
        for (const feature of features) {
            // [FILTER] 排除现代高速公路 — 古代道路不走高速,沿国道/老路更真实
            if (feature.properties?.expressway === 1) {
                skippedExpressway++;
                continue;
            }
            const geom = feature.geometry;
            if (geom?.type === 'LineString') {
                processLineString(geom.coordinates);
            } else if (geom?.type === 'MultiLineString') {
                for (const line of geom.coordinates) processLineString(line);
            }
        }

        // 桥接断裂的路段
        this.addBridgeEdges(0.03);

        console.log(`🛤️ [GraphBuilder] ${this.geoNodes.length} nodes (${skippedExpressway} 段高速被排除), graph built from Natural Earth data only.`);
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
     * [GAP-BRIDGE] 桥接孤立段端点 - 解决数据稀疏区(如黄土高原)的断段问题
     * 只连接 degree=1 的节点(短段端点), 避免误连主干路
     */
    private bridgeEndpointGaps(maxDistKm: number): void {
        const endpoints: number[] = [];
        for (const node of this.geoNodes) {
            const adj = this.geoAdj.get(node.id);
            if (adj && adj.length === 1) endpoints.push(node.id);
        }

        const cellSize = 0.1;
        const grid: Map<string, number[]> = new Map();
        for (const id of endpoints) {
            const n = this.geoNodes[id];
            const key = `${Math.floor(n.lng / cellSize)}_${Math.floor(n.lat / cellSize)}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(id);
        }

        const used = new Set<number>();
        let bridged = 0;
        const searchRange = Math.ceil(maxDistKm / 11);

        for (const id of endpoints) {
            if (used.has(id)) continue;
            const node = this.geoNodes[id];
            const adj = this.geoAdj.get(id);
            const connectedTo = new Set(adj?.map(e => e.to) || []);

            const cx = Math.floor(node.lng / cellSize);
            const cy = Math.floor(node.lat / cellSize);

            let bestId = -1, bestDist = Infinity;
            for (let dx = -searchRange; dx <= searchRange; dx++) {
                for (let dy = -searchRange; dy <= searchRange; dy++) {
                    const cellNodes = grid.get(`${cx + dx}_${cy + dy}`);
                    if (!cellNodes) continue;
                    for (const otherId of cellNodes) {
                        if (otherId === id || used.has(otherId) || connectedTo.has(otherId)) continue;
                        const other = this.geoNodes[otherId];
                        const d = this.haversine(node.lat, node.lng, other.lat, other.lng);
                        if (d < bestDist && d <= maxDistKm) {
                            bestDist = d;
                            bestId = otherId;
                        }
                    }
                }
            }

            if (bestId !== -1) {
                const other = this.geoNodes[bestId];
                const weight = bestDist * 2.5;
                const coords: [number, number][] = [[node.lng, node.lat], [other.lng, other.lat]];
                this.geoAdj.get(id)!.push({ from: id, to: bestId, weight, coords });
                this.geoAdj.get(bestId)!.push({ from: bestId, to: id, weight, coords: [coords[1], coords[0]] });

                used.add(id);
                used.add(bestId);
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

        // 找最近的图节点 (Top K = 5)
        const startCandidates = this.findKNearestGeoNodes(startCity.lat, startCity.lng, 5);
        let endCandidates = this.findKNearestGeoNodes(endCity.lat, endCity.lng, 5);

        // [FIX] 不再注入项目已有道路，不再做分支合流
        // 纯粹在 Natural Earth 路网上寻最短路径
        console.log(`🛤️ [PathGen] Start candidates: ${startCandidates.length}, End candidates: ${endCandidates.length}`);

        // [FIX] 收集所有可行的 Dijkstra 路径候选，过滤掉极其相近的路径以保持界面清爽
        const candidatesList: { coordinates: [number, number][]; totalDistance: number }[] = [];
        const seenDistance = new Set<string>();

        for (const sc of startCandidates) {
            for (const ec of endCandidates) {
                const path = this.dijkstraGeo(sc.id, ec.id);
                if (!path) continue;

                const distKey = path.totalDistance.toFixed(2);
                if (seenDistance.has(distKey)) continue;
                seenDistance.add(distKey);

                candidatesList.push(path);
            }
        }

        // 按路程升序排序
        candidatesList.sort((a, b) => a.totalDistance - b.totalDistance);

        this.pathCandidates = candidatesList;
        this.currentCandidateIdx = 0;

        if (this.switchRouteBtn) {
            if (this.pathCandidates.length > 1) {
                this.switchRouteBtn.style.display = 'inline-block';
            } else {
                this.switchRouteBtn.style.display = 'none';
            }
        }

        let bestPath: { coordinates: [number, number][]; totalDistance: number } | null = candidatesList[0] || null;
        let bestDist = bestPath ? bestPath.totalDistance : Infinity;

        let rawCoords: [number, number][] = [];
        let distStr = '';

        if (bestPath) {
            // [DIRECT CONNECTION ENFORCEMENT]
            // Calculate direct distance
            const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
            // [FIX] 使用实际路径公里数（非权重折扣距离）计算绕路比
            const actualPathLength = this.calculatePathLength(bestPath.coordinates);
            const detourRatio = actualPathLength / Math.max(1, directDist);

            // [DEBUG] 详细日志
            console.log(`📏 [PathGen] 直线距离: ${directDist.toFixed(0)}km, 实际路径: ${actualPathLength.toFixed(0)}km, 权重距离: ${bestPath.totalDistance.toFixed(0)}, 绕路比: ${detourRatio.toFixed(2)}x`);

            // 1. Check Network Path
            let useNetworkPath = false;

            if (detourRatio <= 1.5) { // [FIX] 实际路径本身就比直线长
                // Good network path found
                useNetworkPath = true;
                console.log(`✅ [PathGen] Network path acceptable. Ratio: ${detourRatio.toFixed(2)}x`);

                rawCoords.push([startCity.lng, startCity.lat]);
                for (const coord of bestPath.coordinates) {
                    rawCoords.push(coord);
                }
                rawCoords.push([endCity.lng, endCity.lat]);

                distStr = `${actualPathLength.toFixed(0)}km 路网`;
            } else {
                console.warn(`⚠️ [PathGen] Network path rejected! Detour ${detourRatio.toFixed(1)}x too large. Forcing new road construction.`);
            }

            // 2. Fallback to Straight Line (New Road Construction)
            if (!useNetworkPath) {
                // "如果没有路，就修一条路"
                console.log(`🚧 [PathGen] Constructing new direct road: ${startCity.name} -> ${endCity.name}`);
                const straightPath = this.generateStraightLinePath(
                    startCity.lat, startCity.lng,
                    endCity.lat, endCity.lng
                );

                for (const coord of straightPath) {
                    rawCoords.push(coord);
                }

                distStr = `${directDist.toFixed(0)}km 新建直连道路`;
            }

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

        // === 去折角 + 抽稀（先做，不影响后续吸附）===
        const cleaned = removeBacktracks(rawCoords, 80);
        const simplified = this.simplifyCoords(cleaned, 0.002); // ~200m 精度

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

        this.setStatus(`✅ ${roadName} (${distStr}, ${finalCoords.length}点) | 拖拽红点微调`);
        this.clearCitySelection();
        // 保持 pathCandidates 缓存，便于用户切换
        this.pathCandidates = finalCoords.length > 2 ? this.pathCandidates : [];
        if (this.switchRouteBtn && this.pathCandidates.length > 1) {
            this.switchRouteBtn.style.display = 'inline-block';
            this.selectedRoadId = roadId; // 保持选定状态，以便切换
        }
    }

    /**
     * 循环切换当前的候选路径
     */
    private cycleCandidates(): void {
        if (this.pathCandidates.length <= 1 || !this.selectedRoadId) return;

        this.currentCandidateIdx = (this.currentCandidateIdx + 1) % this.pathCandidates.length;
        const candidate = this.pathCandidates[this.currentCandidateIdx];

        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === this.selectedRoadId);
        if (!feature) return;

        const startCityId = feature.properties.startConnection;
        const endCityId = feature.properties.endConnection;
        const startCity = CITIES.find(c => c.id === startCityId);
        const endCity = CITIES.find(c => c.id === endCityId);
        if (!startCity || !endCity) return;

        let rawCoords: [number, number][] = [
            [startCity.lng, startCity.lat],
            ...candidate.coordinates,
            [endCity.lng, endCity.lat]
        ];

        const cleaned = removeBacktracks(rawCoords, 80);
        const simplified = this.simplifyCoords(cleaned, 0.002);

        feature.geometry.coordinates = simplified;

        // 重新渲染该道路及其控制点
        this.renderRoad(this.selectedRoadId);
        this.showControlPoints(this.selectedRoadId);

        const roadName = `${startCity.name}-${endCity.name}`;
        this.setStatus(`🔀 已切换至路径 [${this.currentCandidateIdx + 1}/${this.pathCandidates.length}] | 路程约 ${candidate.totalDistance.toFixed(0)}km`);
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

    private dijkstraGeo(startId: number, endId: number): {
        coordinates: [number, number][];
        totalDistance: number;
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
                const newDist = (dist.get(current) ?? Infinity) + edge.weight;
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

        // 合并坐标
        const coordinates: [number, number][] = [];
        for (let i = 0; i < edgeList.length; i++) {
            const edgeCoords = edgeList[i].coords;
            const startIdx = i === 0 ? 0 : 1; // 跳过重复端点
            for (let j = startIdx; j < edgeCoords.length; j++) {
                coordinates.push(edgeCoords[j]);
            }
        }

        return { coordinates, totalDistance: dist.get(endId) || 0 };
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

        this.referenceLayer = L.geoJSON(geojson, {
            style: () => ({
                color: '#FFFFFF', // [V2-OSM] 白色, 避免与河流(蓝)、NE 编辑器(黑)冲突
                weight: 2,
                opacity: 0.85,
                dashArray: '4,4'
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
        if (roadId) {
            this.showControlPoints(roadId);
        }
        // [FIX] 选择已有道路时隐藏切换路径按钮
        if (this.switchRouteBtn) this.switchRouteBtn.style.display = 'none';
    }

    private showControlPoints(roadId: string): void {
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
        if (!feature) return;

        const coords = feature.geometry.coordinates;
        const markers: L.CircleMarker[] = [];
        const mids: L.CircleMarker[] = [];

        // 红色控制点
        for (let i = 0; i < coords.length; i++) {
            const [lng, lat] = coords[i];
            const marker = L.circleMarker([lat, lng], {
                radius: 6, color: '#ff1744', fillColor: '#ff5252',
                fillOpacity: 1, weight: 2, interactive: true
            }).addTo(this.map);

            this.makeDraggable(marker, roadId, i);

            marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e);
                if (coords.length > 2) {
                    coords.splice(i, 1);
                    roadRegistry.updateVectorRoadCoordinates(roadId, coords);
                    this.renderRoad(roadId);
                    this.showControlPoints(roadId);
                }
            });

            marker.bindTooltip(`点${i}`, { permanent: false, direction: 'top', offset: [0, -10] });
            markers.push(marker);
        }

        // 黄色中间点
        for (let i = 0; i < coords.length - 1; i++) {
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
            });

            mid.bindTooltip('+', { permanent: false, direction: 'top' });
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

                // 检查 A 是否为 B 的子路径（含反向）
                if (this.isSubpath(coordsA, coordsB) || this.isSubpath(coordsA, [...coordsB].reverse())) {
                    toDelete.add(featureA.properties.id);
                    deleteReasons.push(`"${featureA.properties.name || '未命名'}" 是 "${featureB.properties.name || '未命名'}" 的子路径`);
                    break;
                }
                // 检查 B 是否为 A 的子路径（含反向）
                if (this.isSubpath(coordsB, coordsA) || this.isSubpath(coordsB, [...coordsA].reverse())) {
                    toDelete.add(featureB.properties.id);
                    deleteReasons.push(`"${featureB.properties.name || '未命名'}" 是 "${featureA.properties.name || '未命名'}" 的子路径`);
                }
            }
        }

        // Phase 2: 高度重叠检查（>50% 点数重合）
        for (const featureA of features) {
            if (!featureA || !featureA.geometry || toDelete.has(featureA.properties.id)) continue;
            const coordsA = featureA.geometry.coordinates as [number, number][];
            if (coordsA.length < 3) continue;

            for (const featureB of features) {
                if (!featureB || !featureB.geometry) continue;
                if (featureA.properties.id === featureB.properties.id) continue;
                if (toDelete.has(featureB.properties.id)) continue;
                const coordsB = featureB.geometry.coordinates as [number, number][];
                if (coordsB.length < 3) continue;

                let matchCount = 0;
                for (const p of coordsA) {
                    for (const q of coordsB) {
                        if (this.arePointsEqual(p, q)) {
                            matchCount++;
                            break;
                        }
                    }
                }
                const overlapRatio = matchCount / coordsA.length;
                if (overlapRatio > 0.5) {
                    if (coordsA.length < coordsB.length) {
                        toDelete.add(featureA.properties.id);
                        deleteReasons.push(`"${featureA.properties.name || '未命名'}" 与 "${featureB.properties.name || '未命名'}" 高度重叠(${(overlapRatio * 100).toFixed(0)}%)`);
                    }
                }
            }
        }

        let removedCount = 0;
        for (const id of toDelete) {
            console.log(`🗑️ [Batch Dedup] ${deleteReasons[removedCount]}`);
            this.deleteRoad(id);
            removedCount++;
        }

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
     */
    private batchSimplifyAllRoads(): void {
        const TOLERANCE = 0.002;
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

        this.renderAllRoads();
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
