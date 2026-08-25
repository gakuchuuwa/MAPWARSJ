/**
 * SeaRouteEditor — 海路编辑器（独立于道路编辑器）
 *
 * 与 VectorRoadEditor 完全分离，专门编辑海上航线：
 *  - 路网底图：public/assets/sea_routes.geojson（Natural Earth Ferry Route + 手工历史航线）
 *  - 点击两个港口城市 → 在海上航线上 Dijkstra 寻路 → 生成海路 → 保存到 VectorSeaRouteData.ts
 *  - 跨洋无既有航线时回退为「大圆航线（great-circle）」，供用户手动微调
 *
 * 不修改、不引用道路编辑器（VectorRoadEditor）的任何内部状态。
 */
import L from 'leaflet';
import { CityManager } from '../world/CityManager';
import { CITIES_V2 as CITIES } from '../data/cities_v2';
import { SEA_ROUTE_DATA, SeaRouteFeature } from '../data/VectorSeaRouteData';
import { IEditor } from '../editors/UnifiedEditorManager';

interface SeaNode { id: number; lat: number; lng: number; }
/** weight = 选路代价（含远洋惩罚）；dist = 真实公里数（显示用，绝不带惩罚） */
interface SeaEdge { from: number; to: number; weight: number; dist: number; coords: [number, number][]; }

/**
 * 🔴 [2026-08-25 主人「你来定」] 远洋航段的选路惩罚系数。
 *
 * 为什么要有：古代航海（罗盘之前）以**沿岸航行**为主 —— 白天看着陆地走、夜里靠岸抛锚，
 * 横渡只在地中海、爱琴海这种视野可及的短程发生。纯按距离算 Dijkstra 会让每条海路都挑
 * 远洋直线，不符合「符合历史」这条标准。给 marnet（远洋主干）的边乘一个 >1 的系数，
 * 沿岸(coastal)/接驳(stitch)不乘，距离接近时沿岸就会胜出。
 *
 * 为什么是 1.5（实测标定，不是拍脑袋。跑五条有史实参照的航线扫系数）：
 *   系数    广州→马六甲            亚历山大→印度        雅典→迦太基
 *   ×1.0   2990km 岸 0%          21407km 岸 0%       1299km 岸 0%
 *   ×1.5   3199km 岸44%          25840km 岸88%       1299km 岸 0%   ← 取这档
 *   ×2.0   4062km 岸79%          26527km 岸91%       1613km 岸39%
 * 依据三条：
 *   · 广州→马六甲 3199km —— 海上丝路沿中南半岛（经占城、真腊）走，史实航程约 3500km，对上了
 *   · 亚历山大→印度 25840km —— 与葡萄牙绕好望角航线量级相符；×2.0 的 26527km 偏长
 *   · 雅典→迦太基保持 1299km 直航 —— 这条史实上就是跳西西里岛链的相对直接航线，
 *     不该强行掰弯；×2.0 把它拉到 1613km 就绕过分了
 * ⚠️ 惩罚**只进 weight**，`totalDistance` 累加的是 dist（真实公里），
 *    否则面板上显示的航程会是个带系数的假数。
 */
const OPEN_SEA_PENALTY = 1.5;

// 海路参考层（海上航线网）颜色：白色虚线（海洋是蓝色，白线才跳得出）
// 已保存海路颜色：琥珀橙实线（暖色，蓝海与纸色陆地都高对比）
const ROUTE_COLOR = '#ff9800';

export class SeaRouteEditor implements IEditor {
    public name = '海路编辑器';
    public icon = '🚢';

    private map: L.Map;
    private cityManager: CityManager;
    private visible = false;

    // === 海上航线图 ===
    private seaNodes: SeaNode[] = [];
    private seaAdj: Map<number, SeaEdge[]> = new Map();
    private graphBuilt = false;
    private cachedGeoJSON: any = null;

    // === 参考层 ===
    private referenceLayer: L.GeoJSON | null = null;

    // === 城市选择状态 ===
    private startCityId: string | null = null;
    private endCityId: string | null = null;
    private startMarker: L.CircleMarker | null = null;
    private endMarker: L.CircleMarker | null = null;

    // === 已保存海路渲染 ===
    private routePolylines: Map<string, L.Polyline> = new Map();
    private selectedRouteId: string | null = null;

    // === UI ===
    private panel: HTMLElement | null = null;
    private statusLabel: HTMLElement | null = null;
    private routeSelect: HTMLSelectElement | null = null;
    private routeFilter: HTMLInputElement | null = null;

    private cityClickHandler: ((city: any, e?: any) => void) | null = null;

    /**
     * 嵌入宿主：设了就把面板挂进这个容器（非 fixed），没设就照旧自己浮在屏幕底部。
     * 🔴 [2026-08-25 主人定「把海图编辑器合并到道路编辑器中」] 合并后由 VectorRoadEditor
     *    托管，面板作为它的一行；这里保留独立浮窗兜底，便于单独调试海路。
     */
    private hostProvider: (() => HTMLElement | null) | null = null;

    constructor(map: L.Map, cityManager: CityManager) {
        this.map = map;
        this.cityManager = cityManager;
    }

    /** 由宿主（道路编辑器）调用：面板改挂到它的容器里 */
    public setHost(provider: (() => HTMLElement | null) | null): void {
        this.hostProvider = provider;
    }

    // ===== IEditor 接口 =====

    public show(): void {
        this.visible = true;
        this.createPanel();
        this.renderAllRoutes();
        this.loadSeaGraph().then(() => {
            this.enableCitySelection();
            console.log(`🚢 [SeaRouteEditor] Ready! ${this.seaNodes.length} sea graph nodes`);
        });
    }

    public hide(): void {
        this.visible = false;
        this.clearRouteLayers();
        this.removeReferenceLayer();
        this.clearCitySelection();
        this.disableCitySelection();
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
            this.statusLabel = null;
            this.routeSelect = null;
            this.routeFilter = null;
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }

    // ===== UI 面板 =====

    private createPanel(): void {
        if (this.panel) return;

        const host = this.hostProvider?.() ?? null;

        this.panel = document.createElement('div');
        this.panel.id = 'sea-route-editor-panel';
        // 嵌入宿主时：不脱离文档流，铺满宿主宽度（样式与道路面板的行保持一致）
        this.panel.style.cssText = host ? `
            background: rgba(10, 25, 45, 0.96);
            color: #d0e4f7;
            padding: 14px 20px;
            border-radius: 14px;
            display: flex;
            gap: 10px;
            align-items: center;
            font-family: 'Microsoft YaHei', sans-serif;
            font-size: 14px;
            border: 2px solid rgba(41,182,246,0.5);
            box-sizing: border-box;
            flex-wrap: wrap;
        ` : `
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(10, 25, 45, 0.96);
            color: #d0e4f7;
            padding: 14px 20px;
            border-radius: 14px;
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 10001;
            font-family: 'Microsoft YaHei', sans-serif;
            font-size: 14px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.7);
            border: 2px solid rgba(41,182,246,0.5);
            max-width: 98vw;
            box-sizing: border-box;
            flex-wrap: wrap;
        `;

        this.statusLabel = document.createElement('span');
        this.statusLabel.style.cssText = 'color:#4fc3f7;min-width:220px;font-weight:bold;';
        this.statusLabel.textContent = '🚢 请点击第一个港口城市（起点）';

        this.routeFilter = document.createElement('input');
        this.routeFilter.type = 'text';
        this.routeFilter.placeholder = '🔍 搜索海路...';
        this.routeFilter.style.cssText = `background:#0f2a40;color:#d0e4f7;border:1px solid #2b5a7a;border-radius:6px;padding:8px 12px;font-size:13px;width:150px;outline:none;`;
        this.routeFilter.addEventListener('input', () => this.updateRouteSelect());

        this.routeSelect = document.createElement('select');
        this.routeSelect.style.cssText = `background:#0f2a40;color:#4fc3f7;border:1px solid #2b5a7a;border-radius:6px;padding:8px 12px;font-size:13px;min-width:160px;font-weight:bold;`;
        this.updateRouteSelect();
        this.routeSelect.addEventListener('change', () => this.selectRoute(this.routeSelect!.value));

        const refToggle = document.createElement('label');
        refToggle.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px;';
        const refCheck = document.createElement('input');
        refCheck.type = 'checkbox';
        refCheck.checked = true;
        refCheck.addEventListener('change', () => {
            if (refCheck.checked) this.showReferenceLayer();
            else this.removeReferenceLayer();
        });
        refToggle.appendChild(refCheck);
        refToggle.appendChild(document.createTextNode('🌊 航线网'));

        this.panel.appendChild(this.statusLabel);
        this.panel.appendChild(this.routeFilter);
        this.panel.appendChild(this.routeSelect);
        this.panel.appendChild(refToggle);
        this.panel.appendChild(this.createButton('🔄 重选', '#ff5722', () => {
            this.selectRoute('');
            this.clearCitySelection();
            this.setStatus('🚢 请点击第一个港口城市（起点）');
        }));
        this.panel.appendChild(this.createButton('📋 导出', '#2196f3', () => this.exportToClipboard()));
        this.panel.appendChild(this.createButton('💾 保存', '#4caf50', () => this.saveToFile()));
        this.panel.appendChild(this.createButton('🗑️ 删除', '#f44336', () => this.deleteSelectedRoute()));

        (host ?? document.body).appendChild(this.panel);
    }

    private createButton(text: string, bg: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `background:${bg};color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:bold;font-size:13px;`;
        btn.addEventListener('click', onClick);
        return btn;
    }

    private setStatus(text: string): void {
        if (this.statusLabel) this.statusLabel.textContent = text;
    }

    private updateRouteSelect(): void {
        if (!this.routeSelect) return;
        const filterText = (this.routeFilter?.value || '').toLowerCase().trim();
        this.routeSelect.innerHTML = '<option value="">-- 已有海路 --</option>';
        const feats = SEA_ROUTE_DATA.features.slice().sort((a, b) =>
            (b.geometry?.coordinates?.length || 0) - (a.geometry?.coordinates?.length || 0));
        for (const f of feats) {
            if (!f || !f.properties || !f.geometry) continue;
            const name = (f.properties.name || '未命名').toLowerCase();
            const id = f.properties.id.toLowerCase();
            if (filterText && !name.includes(filterText) && !id.includes(filterText)) continue;
            const opt = document.createElement('option');
            opt.value = f.properties.id;
            opt.textContent = `${f.properties.name || '未命名'} (${f.geometry.coordinates.length}点)`;
            this.routeSelect.appendChild(opt);
        }
    }

    // ===== 城市选择 =====

    private enableCitySelection(): void {
        this.cityClickHandler = (city: any, _e?: any) => {
            if (!this.visible) return;
            const cityId = city.id || city.name;
            const cityData = CITIES.find(c => c.id === cityId);
            if (!cityData) return;

            if (!this.startCityId) {
                this.startCityId = cityId;
                this.startMarker = L.circleMarker([cityData.lat, cityData.lng], {
                    radius: 10, color: '#00e676', fillColor: '#00e676', fillOpacity: 0.8, weight: 3
                }).addTo(this.map);
                this.startMarker.bindTooltip(`起港: ${cityData.name}`, { permanent: true, direction: 'top' });
                this.setStatus(`✅ 起港: ${cityData.name} | 请点击第二个港口城市（终点）`);
            } else if (!this.endCityId) {
                if (cityId === this.startCityId) return;
                this.endCityId = cityId;
                this.endMarker = L.circleMarker([cityData.lat, cityData.lng], {
                    radius: 10, color: '#ff1744', fillColor: '#ff1744', fillOpacity: 0.8, weight: 3
                }).addTo(this.map);
                this.endMarker.bindTooltip(`终港: ${cityData.name}`, { permanent: true, direction: 'top' });
                const startName = CITIES.find(c => c.id === this.startCityId)?.name || this.startCityId;
                this.setStatus(`⏳ 正在海上寻路: ${startName} → ${cityData.name}...`);
                setTimeout(() => this.generateSeaPath(), 100);
            }
        };
        this.cityManager.setOnCityClick(this.cityClickHandler);
    }

    private disableCitySelection(): void {
        this.cityManager.setOnCityClick(() => { });
    }

    private clearCitySelection(): void {
        this.startCityId = null;
        this.endCityId = null;
        if (this.startMarker) { this.map.removeLayer(this.startMarker); this.startMarker = null; }
        if (this.endMarker) { this.map.removeLayer(this.endMarker); this.endMarker = null; }
    }

    // ===== 海上航线图构建 =====

    private async loadSeaGraph(): Promise<void> {
        if (this.graphBuilt) {
            if (this.cachedGeoJSON) this.showReferenceLayerFromData(this.cachedGeoJSON);
            return;
        }
        this.setStatus('⏳ 加载海上航线网...');
        try {
            const basePath = import.meta.env.BASE_URL || '/';
            // ⚓ [2026-08-25] 换成 MARNET 烘出来的年代正确版（tools/build-sea-routes-marnet.py）。
            //    旧的 sea_routes.geojson 是 314 条现代渡轮 + 239 条商业航线，而且**图是碎的**：
            //    152 个连通分量、主网只占 34.8% —— 两个港口落在不同分量就直接找不到路。
            //    新数据是 C 方案的合并成品（tools/build-sea-routes-combined.py）：
            //      · marnet  远洋主干，100% 连通，已剔苏伊士/巴拿马/西北航道（游戏年代都不存在）
            //      · coastal 沿岸航路，离岸 36km 绕每块陆地一圈，古代贴岸航海的主力
            //      · stitch  571 条接驳边（沿岸点到最近主干点，≤120km），没有它两张图不通
            //    实测 328 座沿海城**全部**落在主网上；剩下的碎片是南北极和无城的太平洋孤岛。
            //    旧文件保留在 public/assets/ 未删，要对照随时能切回来。
            const res = await fetch(`${basePath}assets/sea_routes_combined.geojson`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const geojson = await res.json();
            this.cachedGeoJSON = geojson;
            this.buildGraphFromGeoJSON(geojson);
            this.graphBuilt = true;
            this.showReferenceLayerFromData(geojson);
            this.setStatus('🚢 请点击第一个港口城市（起点）');
            console.log(`🚢 [SeaRouteEditor] Graph built: ${this.seaNodes.length} nodes`);
        } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            console.error('[SeaRouteEditor] Failed to load sea routes:', err);
            this.setStatus(`❌ 加载航线网失败：${reason}`);
        }
    }

    private buildGraphFromGeoJSON(geojson: any): void {
        const SNAP = 0.05; // ~5km 容差
        const nodeMap = new Map<string, number>();
        const snapKey = (lat: number, lng: number): string =>
            `${Math.round(lat / SNAP)}_${Math.round(lng / SNAP)}`;

        const getNode = (lat: number, lng: number): number => {
            const k = snapKey(lat, lng);
            const existing = nodeMap.get(k);
            if (existing !== undefined) return existing;
            const id = this.seaNodes.length;
            this.seaNodes.push({ id, lat, lng });
            this.seaAdj.set(id, []);
            nodeMap.set(k, id);
            return id;
        };

        const addEdge = (a: number, b: number, coords: [number, number][], source: string): void => {
            if (a === b) return;
            const d = this.calculatePathLength(coords);
            if (!isFinite(d) || d < 0.01) return;
            // 远洋主干加惩罚，沿岸/接驳按真实距离 —— 见 OPEN_SEA_PENALTY
            const w = source === 'marnet' ? d * OPEN_SEA_PENALTY : d;
            this.seaAdj.get(a)!.push({ from: a, to: b, weight: w, dist: d, coords });
            this.seaAdj.get(b)!.push({ from: b, to: a, weight: w, dist: d, coords: [...coords].reverse() as [number, number][] });
        };

        for (const f of geojson.features || []) {
            const g = f?.geometry;
            if (!g || !g.coordinates) continue;
            const source: string = f?.properties?.source ?? 'marnet';
            const lines = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates];
            for (const line of lines) {
                if (!line || line.length < 2) continue;
                for (let i = 0; i < line.length - 1; i++) {
                    const [lng1, lat1] = line[i];
                    const [lng2, lat2] = line[i + 1];
                    addEdge(getNode(lat1, lng1), getNode(lat2, lng2), [line[i], line[i + 1]], source);
                }
            }
        }
    }

    // ===== 参考层 =====

    private showReferenceLayerFromData(geojson: any): void {
        if (this.referenceLayer) return;
        this.referenceLayer = L.geoJSON(geojson, {
            pane: 'overlayPane',
            // 着色：普通航段淡白；**海峡（passage）高亮青色加粗** —— 直布罗陀/博斯普鲁斯/
            // 达达尼尔/曼德/霍尔木兹/马六甲/巽他/好望角/合恩角/白令这些咽喉是画海路时的关键节点，
            // 一眼能认出来才好判断走向。（旧数据的 laneType/ferry 分级已随数据源一起废弃。）
            style: (feature: any) => {
                const p = feature?.properties || {};
                // 海峡咽喉最显眼（画海路时的关键节点）
                if (p.passage) return { color: '#26c6da', weight: 4, opacity: 0.95 };
                // 沿岸航路：古代主力，给暖色实线，和远洋虚线一眼分得开
                if (p.source === 'coastal') return { color: '#ffb74d', weight: 1.8, opacity: 0.75 };
                // 接驳边：只是把沿岸接上主干，画淡一点别喧宾夺主
                if (p.source === 'stitch') return { color: '#9575cd', weight: 1, opacity: 0.35 };
                // 远洋主干
                return { color: '#ffffff', weight: 1.4, opacity: 0.45, dashArray: '5 5' };
            },
            onEachFeature: (feature: any, layer: L.Layer) => {
                const pass = feature?.properties?.passage;
                if (pass) layer.bindTooltip(`\u{1F30A} ${pass}`, { sticky: true });
            }
        });
        this.referenceLayer.addTo(this.map);
    }

    private showReferenceLayer(): void {
        if (this.referenceLayer || !this.cachedGeoJSON) return;
        this.showReferenceLayerFromData(this.cachedGeoJSON);
    }

    private removeReferenceLayer(): void {
        if (this.referenceLayer) {
            this.map.removeLayer(this.referenceLayer);
            this.referenceLayer = null;
        }
    }

    // ===== 寻路 =====

    private findKNearestSeaNodes(lat: number, lng: number, k: number): { id: number; dist: number }[] {
        const arr: { id: number; dist: number }[] = [];
        for (const n of this.seaNodes) {
            arr.push({ id: n.id, dist: this.haversine(lat, lng, n.lat, n.lng) });
        }
        arr.sort((a, b) => a.dist - b.dist);
        return arr.slice(0, k);
    }

    private dijkstra(startId: number, endId: number): { coordinates: [number, number][]; totalDistance: number } | null {
        const dist = new Map<number, number>();
        const prev = new Map<number, { nodeId: number; edge: SeaEdge }>();
        const visited = new Set<number>();
        const heap: { nodeId: number; dist: number }[] = [];
        const push = (item: { nodeId: number; dist: number }) => {
            heap.push(item);
            let i = heap.length - 1;
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (heap[p].dist <= heap[i].dist) break;
                [heap[p], heap[i]] = [heap[i], heap[p]];
                i = p;
            }
        };
        const pop = (): { nodeId: number; dist: number } | undefined => {
            if (heap.length === 0) return undefined;
            const top = heap[0];
            const last = heap.pop()!;
            if (heap.length > 0) {
                heap[0] = last;
                let i = 0;
                while (true) {
                    let s = i;
                    const l = 2 * i + 1, r = 2 * i + 2;
                    if (l < heap.length && heap[l].dist < heap[s].dist) s = l;
                    if (r < heap.length && heap[r].dist < heap[s].dist) s = r;
                    if (s === i) break;
                    [heap[i], heap[s]] = [heap[s], heap[i]];
                    i = s;
                }
            }
            return top;
        };

        dist.set(startId, 0);
        push({ nodeId: startId, dist: 0 });

        while (heap.length > 0) {
            const cur = pop()!;
            if (visited.has(cur.nodeId)) continue;
            visited.add(cur.nodeId);
            if (cur.nodeId === endId) break;
            for (const e of this.seaAdj.get(cur.nodeId) || []) {
                if (visited.has(e.to)) continue;
                const nd = (dist.get(cur.nodeId) ?? Infinity) + e.weight;
                if (nd < (dist.get(e.to) ?? Infinity)) {
                    dist.set(e.to, nd);
                    prev.set(e.to, { nodeId: cur.nodeId, edge: e });
                    push({ nodeId: e.to, dist: nd });
                }
            }
        }

        if (!prev.has(endId)) return null;

        const edges: SeaEdge[] = [];
        let cur = endId;
        while (prev.has(cur)) {
            const { nodeId, edge } = prev.get(cur)!;
            edges.unshift(edge);
            cur = nodeId;
        }

        const coordinates: [number, number][] = [];
        for (let i = 0; i < edges.length; i++) {
            const ec = edges[i].coords;
            const startIdx = i === 0 ? 0 : 1;
            for (let j = startIdx; j < ec.length; j++) coordinates.push(ec[j]);
        }
        // 🔴 显示的航程必须是**真实公里**：dist map 里存的是带 OPEN_SEA_PENALTY 的选路代价，
        //    直接拿它当航程会让远洋航线凭空多报 50%。沿路径累加 edge.dist 才是真数。
        let realKm = 0;
        for (const e of edges) realKm += e.dist;
        return { coordinates, totalDistance: realKm };
    }

    private generateSeaPath(): void {
        if (!this.startCityId || !this.endCityId) return;
        const startCity = CITIES.find(c => c.id === this.startCityId);
        const endCity = CITIES.find(c => c.id === this.endCityId);
        if (!startCity || !endCity) { this.setStatus('❌ 找不到城市数据'); return; }

        if (!this.graphBuilt || this.seaNodes.length === 0) {
            this.setStatus('⚠️ 航线网未加载完成，请稍后再试');
            this.clearCitySelection();
            return;
        }

        const directDist = this.haversine(startCity.lat, startCity.lng, endCity.lat, endCity.lng);
        const startCands = this.findKNearestSeaNodes(startCity.lat, startCity.lng, 5);
        const endCands = this.findKNearestSeaNodes(endCity.lat, endCity.lng, 5);

        let best: { coordinates: [number, number][]; totalDistance: number } | null = null;
        let bestDist = Infinity;
        for (const sc of startCands) {
            for (const ec of endCands) {
                const p = this.dijkstra(sc.id, ec.id);
                if (p && p.totalDistance < bestDist) {
                    best = p;
                    bestDist = p.totalDistance;
                }
            }
        }

        let finalCoords: [number, number][];
        let distStr: string;

        if (best) {
            // 拼接：城市坐标 + 航线路径 + 城市坐标
            finalCoords = [
                [startCity.lng, startCity.lat],
                ...best.coordinates,
                [endCity.lng, endCity.lat]
            ];
            distStr = `${bestDist.toFixed(0)}km 海上航线`;
        } else {
            // 跨洋无既有航线 → 回退大圆航线（供手动微调）
            finalCoords = this.greatCirclePath(
                startCity.lat, startCity.lng, endCity.lat, endCity.lng, 32
            );
            distStr = `${directDist.toFixed(0)}km 大圆航线(请微调)`;
        }

        // 创建/覆盖两港之间的既有海路
        const dupIds = SEA_ROUTE_DATA.features
            .filter(f =>
                (f.properties.startConnection === this.startCityId && f.properties.endConnection === this.endCityId) ||
                (f.properties.startConnection === this.endCityId && f.properties.endConnection === this.startCityId))
            .map(f => f.properties.id);
        for (const id of dupIds) {
            SEA_ROUTE_DATA.features.splice(SEA_ROUTE_DATA.features.findIndex(f => f.properties.id === id), 1);
            this.removeRouteLayer(id);
        }

        const routeName = `${startCity.name}-${endCity.name}`;
        const routeId = `sea_${this.startCityId}_${this.endCityId}_${Date.now()}`;
        const newFeature: SeaRouteFeature = {
            type: 'Feature',
            properties: {
                name: routeName,
                type: 'sea',
                id: routeId,
                startConnection: this.startCityId!,
                endConnection: this.endCityId!
            },
            geometry: { type: 'LineString', coordinates: finalCoords }
        };

        SEA_ROUTE_DATA.features.push(newFeature);
        this.updateRouteSelect();
        this.renderRoute(routeId);
        this.selectRoute(routeId);

        this.setStatus(`✅ ${routeName} (${distStr}, ${finalCoords.length}点) | 记得点 💾 保存`);
        this.clearCitySelection();
    }

    /**
     * 大圆航线：两点间最短球面路径的离散采样（标准球面几何，非启发式）。
     * 用于跨洋无既有航线时生成一条自然的弧形海路，供手动微调。
     */
    private greatCirclePath(lat1: number, lng1: number, lat2: number, lng2: number, steps: number): [number, number][] {
        const toRad = (d: number) => d * Math.PI / 180;
        const toDeg = (r: number) => r * 180 / Math.PI;
        const φ1 = toRad(lat1), λ1 = toRad(lng1);
        const φ2 = toRad(lat2), λ2 = toRad(lng2);
        const Δλ = λ2 - λ1;
        const δ = Math.acos(
            Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)
        );
        const out: [number, number][] = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const A = Math.sin((1 - t) * δ) / Math.sin(δ);
            const B = Math.sin(t * δ) / Math.sin(δ);
            const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
            const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
            const z = A * Math.sin(φ1) + B * Math.sin(φ2);
            const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
            const lng = Math.atan2(y, x);
            out.push([toDeg(lng), toDeg(lat)]);
        }
        return out;
    }

    // ===== 海路渲染 =====

    private renderAllRoutes(): void {
        this.clearRouteLayers();
        for (const f of SEA_ROUTE_DATA.features) {
            if (f && f.properties && f.geometry) this.renderRoute(f.properties.id);
        }
    }

    private renderRoute(routeId: string): void {
        const feature = SEA_ROUTE_DATA.features.find(f => f.properties.id === routeId);
        if (!feature) return;
        this.removeRouteLayer(routeId);
        const latLngs = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        const polyline = L.polyline(latLngs, {
            color: ROUTE_COLOR,
            weight: 2.5,
            opacity: 0.9,
            dashArray: '10 6',
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(this.map);
        polyline.bindTooltip(feature.properties.name, { sticky: true });
        this.routePolylines.set(routeId, polyline);
    }

    private removeRouteLayer(routeId: string): void {
        const p = this.routePolylines.get(routeId);
        if (p) { this.map.removeLayer(p); this.routePolylines.delete(routeId); }
    }

    private clearRouteLayers(): void {
        for (const [id, p] of this.routePolylines) this.map.removeLayer(p);
        this.routePolylines.clear();
    }

    private selectRoute(routeId: string): void {
        this.selectedRouteId = routeId || null;
        if (routeId) this.setStatus(`📌 已选中海路，可删除或继续画新海路`);
    }

    // ===== 保存 / 导出 / 删除 =====

    private async saveToFile(): Promise<void> {
        const content = this.generateTypeScriptContent();
        try {
            const res = await fetch('/api/save-sea-routes', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: content
            });
            const result = await res.json();
            if (result.ok) {
                this.setStatus(`✅ 已保存到 VectorSeaRouteData.ts (${result.bytes} 字节)`);
            } else {
                throw new Error(result.error || '保存失败');
            }
        } catch (err) {
            console.error('[SaveSeaRoutes] Dev API failed, fallback to clipboard:', err);
            await navigator.clipboard.writeText(content);
            this.setStatus('⚠️ 直接保存失败，已复制到剪贴板。请手动粘贴到 src/data/VectorSeaRouteData.ts');
            alert('直接保存失败！\n\n内容已复制到剪贴板，请手动粘贴替换:\nsrc/data/VectorSeaRouteData.ts');
        }
    }

    private exportToClipboard(): void {
        const content = this.generateTypeScriptContent();
        navigator.clipboard.writeText(content).then(() => this.setStatus('📋 已复制到剪贴板！'));
    }

    private deleteSelectedRoute(): void {
        let routeId = this.selectedRouteId;
        if (!routeId && this.routeSelect && this.routeSelect.value) routeId = this.routeSelect.value;
        if (!routeId) { this.setStatus('⚠️ 请先从下拉列表选择要删除的海路'); return; }
        const feature = SEA_ROUTE_DATA.features.find(f => f.properties.id === routeId);
        const name = feature?.properties.name || '未命名海路';
        if (!confirm(`确定要删除海路 "${name}" 吗？删除后记得点保存。`)) return;
        SEA_ROUTE_DATA.features.splice(SEA_ROUTE_DATA.features.findIndex(f => f.properties.id === routeId), 1);
        this.removeRouteLayer(routeId);
        this.selectedRouteId = null;
        if (this.routeSelect) this.routeSelect.value = '';
        this.updateRouteSelect();
        this.setStatus(`🗑️ 已删除 "${name}"，请点击保存以持久化`);
    }

    private generateTypeScriptContent(): string {
        let ts = `export interface SeaRouteFeature {\n`;
        ts += `    type: 'Feature';\n`;
        ts += `    properties: {\n`;
        ts += `        name: string;\n`;
        ts += `        type: 'sea';\n`;
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
        ts += `export const SEA_ROUTE_DATA: { type: 'FeatureCollection', features: SeaRouteFeature[] } = {\n`;
        ts += `    type: 'FeatureCollection',\n`;
        ts += `    features: [\n`;
        for (const f of SEA_ROUTE_DATA.features) {
            const p = f.properties;
            ts += `        {\n`;
            ts += `            type: "Feature",\n`;
            ts += `            properties: {\n`;
            ts += `                name: "${p.name}",\n`;
            ts += `                type: "sea",\n`;
            ts += `                id: "${p.id}"`;
            if (p.startConnection) ts += `,\n                startConnection: "${p.startConnection}"`;
            if (p.endConnection) ts += `,\n                endConnection: "${p.endConnection}"`;
            if (p.startYear !== undefined) ts += `,\n                startYear: ${p.startYear}`;
            if (p.endYear !== undefined) ts += `,\n                endYear: ${p.endYear}`;
            ts += `\n            },\n`;
            ts += `            geometry: {\n`;
            ts += `                type: "LineString",\n`;
            ts += `                coordinates: [\n`;
            for (const c of f.geometry.coordinates) ts += `                    [${c[0]}, ${c[1]}],\n`;
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

    private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const toRad = (d: number) => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
