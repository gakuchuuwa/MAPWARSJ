/**
 * RoadRegistry - 智能矢量路网引擎 (Smart Vector Road Engine)
 * 
 * 基于图论 (Graph) 的寻路系统，替代旧版六边格网格寻路。
 * 
 * 核心概念：
 * - Node: 城市 (City) 或道路交叉点
 * - Edge: 一条矢量道路 (VectorRoadFeature)
 * - 权重: 道路长度 (km)
 */
import { GameConfig } from '../config/GameConfig';
import { CITIES } from '../data/cities';
import { VECTOR_ROAD_DATA, VectorRoadFeature } from '../data/VectorRoadData';
import { smoothRoad } from '../utils/GeometryUtils';
import { GridSystem } from '../systems/GridSystem';
import { getEuclideanDistance, joinStartToRoadPolyline, nearestPointOnPolyline } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';

// ===== 图论数据结构 =====

interface GraphNode {
    id: string;          // 城市ID 或 交叉点ID
    lat: number;
    lng: number;
    type: 'city' | 'junction';
}

interface GraphEdge {
    id: string;          // 道路ID
    from: string;        // 起点 node ID
    to: string;          // 终点 node ID
    weight: number;      // 距离 (km)
    coordinates: [number, number][]; // [lng, lat][] 完整路径坐标
    roadFeature: VectorRoadFeature;  // 原始道路数据引用
}

interface PathResult {
    nodes: string[];           // 经过的节点ID序列
    edges: GraphEdge[];        // 经过的边序列
    totalDistance: number;      // 总距离 (km)
    coordinates: [number, number][]; // 完整路径坐标 [lng, lat][]
}

/** Dijkstra 小根堆（替代每轮 array.sort，避免 O(V² log V)） */
class DijkstraMinHeap {
    private items: { nodeId: string; dist: number }[] = [];

    get size(): number {
        return this.items.length;
    }

    push(item: { nodeId: string; dist: number }): void {
        this.items.push(item);
        this.bubbleUp(this.items.length - 1);
    }

    pop(): { nodeId: string; dist: number } | undefined {
        if (this.items.length === 0) return undefined;
        const top = this.items[0];
        const last = this.items.pop()!;
        if (this.items.length > 0) {
            this.items[0] = last;
            this.bubbleDown(0);
        }
        return top;
    }

    private bubbleUp(i: number): void {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.items[parent].dist <= this.items[i].dist) break;
            [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
            i = parent;
        }
    }

    private bubbleDown(i: number): void {
        const n = this.items.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < n && this.items[left].dist < this.items[smallest].dist) smallest = left;
            if (right < n && this.items[right].dist < this.items[smallest].dist) smallest = right;
            if (smallest === i) break;
            [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
            i = smallest;
        }
    }
}

// ===== 主类 =====

export class RoadRegistry {
    private static instance: RoadRegistry;

    // 图结构
    private nodes: Map<string, GraphNode> = new Map();
    private edges: Map<string, GraphEdge> = new Map();
    private adjacencyList: Map<string, GraphEdge[]> = new Map(); // nodeId -> edges[]

    // 兼容层: 旧版回调
    private updateCallbacks: (() => void)[] = [];

    private cityAreaMap: Map<string, string> = new Map();

    // [RENDERER SUPPORT] Hex Cache
    private customRoadHexes: Set<string> = new Set();
    private cachedVectorHexes: Set<string> = new Set();
    // [METADATA SUPPORT] Metadata cache for rasterized roads
    private vectorHexMetadata: Map<string, { startYear?: number; endYear?: number }> = new Map();

    private constructor() {
        // 不再在构造函数中加载旧的 hex 数据
    }

    public static getInstance(): RoadRegistry {
        if (!RoadRegistry.instance) {
            RoadRegistry.instance = new RoadRegistry();
        }
        return RoadRegistry.instance;
    }

    // ===== 初始化 =====

    public initialize(cities: any[]): void {
        gameLog('startup', '🛤️ [RoadRegistry] Initializing Vector Road Graph...');

        // 1. 注册所有城市为图节点
        cities.forEach(city => {
            this.addNode({
                id: city.id,
                lat: city.lat,
                lng: city.lng,
                type: 'city'
            });
        });

        // 2. 加载矢量道路为图边
        this.loadVectorRoads();

        // 3. 构建旧版兼容缓存
        this.buildCityAreaCache(cities);

        gameLog('startup', `🛤️ [RoadRegistry] Graph built: ${this.nodes.size} nodes, ${this.edges.size} edges`);
    }

    public isInitialized(): boolean {
        return this.nodes.size > 0;
    }

    // ===== 图操作 =====

    private addNode(node: GraphNode): void {
        this.nodes.set(node.id, node);
        if (!this.adjacencyList.has(node.id)) {
            this.adjacencyList.set(node.id, []);
        }
    }

    private addEdge(edge: GraphEdge): void {
        this.edges.set(edge.id, edge);

        // 双向边 (道路是双向的)
        if (!this.adjacencyList.has(edge.from)) {
            this.adjacencyList.set(edge.from, []);
        }
        if (!this.adjacencyList.has(edge.to)) {
            this.adjacencyList.set(edge.to, []);
        }
        this.adjacencyList.get(edge.from)!.push(edge);

        // 反向边
        const reverseEdge: GraphEdge = {
            ...edge,
            id: edge.id + '_rev',
            from: edge.to,
            to: edge.from,
            coordinates: [...edge.coordinates].reverse()
        };
        this.adjacencyList.get(edge.to)!.push(reverseEdge);
    }

    // ===== 加载矢量道路 =====

    private loadVectorRoads(): void {
        // [FIX] 启动时自动清理冗余重复路线（保留同起终点中最新的一条）
        const uniqueFeatures = new Map<string, any>();
        const validFeatures: any[] = [];
        
        for (const feature of VECTOR_ROAD_DATA.features) {
            if (!feature || !feature.properties || !feature.geometry) continue;
            const props = feature.properties;
            
            if (props.startConnection && props.endConnection) {
                // 统一键名格式，保证 start-end 和 end-start 相同
                const key = props.startConnection < props.endConnection 
                    ? `${props.startConnection}-${props.endConnection}`
                    : `${props.endConnection}-${props.startConnection}`;
                uniqueFeatures.set(key, feature);
            } else {
                validFeatures.push(feature); // 保留没有明确起终点的旧线
            }
        }

        // 用去重后的数据替换掉原始内存中的 features
        VECTOR_ROAD_DATA.features.length = 0;
        VECTOR_ROAD_DATA.features.push(...uniqueFeatures.values(), ...validFeatures);

        for (const feature of VECTOR_ROAD_DATA.features) {
            if (!feature || !feature.properties || !feature.geometry) continue;

            const props = feature.properties;
            const coords = feature.geometry.coordinates as [number, number][];

            if (!props.id) {
                console.warn(`⚠️ [RoadRegistry] Road "${props.name}" has no ID, skipping.`);
                continue;
            }

            // 确定起点和终点节点
            let fromId = props.startConnection;
            let toId = props.endConnection;

            // 如果没有明确指定连接，尝试自动吸附到最近城市
            if (!fromId) {
                fromId = this.findNearestCityId(coords[0][1], coords[0][0], 0.15);
            }
            if (!toId) {
                toId = this.findNearestCityId(
                    coords[coords.length - 1][1],
                    coords[coords.length - 1][0],
                    0.15
                );
            }

            if (!fromId || !toId) {
                console.warn(`⚠️ [RoadRegistry] Road "${props.name}" has no valid endpoints, skipping.`);
                continue;
            }

            // 吸附: 强制端点坐标与城市坐标一致
            const fromNode = this.nodes.get(fromId);
            const toNode = this.nodes.get(toId);
            if (fromNode) {
                coords[0] = [fromNode.lng, fromNode.lat];
            }
            if (toNode) {
                coords[coords.length - 1] = [toNode.lng, toNode.lat];
            }

            const smoothedCoords = smoothRoad(coords, 3);
            const weight = this.calculatePathLength(smoothedCoords);

            this.addEdge({
                id: props.id,
                from: fromId,
                to: toId,
                weight,
                coordinates: smoothedCoords,
                roadFeature: feature
            });

            // [PERF] 启动时不打 per-road 日志（230 条 console.log 会让 DevTools 开着时卡数秒）
            // 如需调试单条道路，请在浏览器控制台直接查询 roadRegistry。
        }

        // [PERF] 道路光栅化（视觉，仅 RoadLayer 用，非寻路必需）推迟到首屏后执行，
        // 避免阻塞首屏。由 GameApp 在首屏渲染后调 rasterizeRoadsDeferred()。
    }

    // ===== 寻路 (Dijkstra) =====

    /** 单源最短路缓存：按起点 LRU 多条；多军团不同起点不再互相冲掉、反复重算 Dijkstra */
    private static readonly DIJKSTRA_CACHE_MAX = 24;
    private dijkstraCache: Map<string, {
        distances: Map<string, number>;
        prev: Map<string, { nodeId: string; edge: GraphEdge }>;
    }> = new Map();

    private clearDistanceCache(): void {
        this.dijkstraCache.clear();
    }

    /** 取单源 Dijkstra 结果：命中 LRU 缓存则复用，否则计算并入缓存（路网不变期间结果确定） */
    private getDijkstraFrom(startNodeId: string): {
        distances: Map<string, number>;
        prev: Map<string, { nodeId: string; edge: GraphEdge }>;
    } | null {
        const hit = this.dijkstraCache.get(startNodeId);
        if (hit) {
            // LRU：命中后移到末尾标记为最近使用
            this.dijkstraCache.delete(startNodeId);
            this.dijkstraCache.set(startNodeId, hit);
            return hit;
        }
        const result = this.runDijkstra(startNodeId);
        if (!result) return null;
        const entry = { distances: result.dist, prev: result.prev };
        this.dijkstraCache.set(startNodeId, entry);
        if (this.dijkstraCache.size > RoadRegistry.DIJKSTRA_CACHE_MAX) {
            const oldest = this.dijkstraCache.keys().next().value;
            if (oldest !== undefined) this.dijkstraCache.delete(oldest);
        }
        return entry;
    }

    /**
     * 单源 Dijkstra：从 startNodeId 出发计算道路距离 (km)。
     * @param stopAtNodeId 若指定，到达该节点后提前结束（点对点寻路用）
     */
    private runDijkstra(
        startNodeId: string,
        stopAtNodeId?: string
    ): { dist: Map<string, number>; prev: Map<string, { nodeId: string; edge: GraphEdge }> } | null {
        if (!this.adjacencyList.has(startNodeId)) {
            return null;
        }

        const dist = new Map<string, number>();
        const prev = new Map<string, { nodeId: string; edge: GraphEdge }>();
        const visited = new Set<string>();
        const pq = new DijkstraMinHeap();

        dist.set(startNodeId, 0);
        pq.push({ nodeId: startNodeId, dist: 0 });

        while (pq.size > 0) {
            const entry = pq.pop()!;
            const current = entry.nodeId;

            if (visited.has(current)) continue;
            visited.add(current);

            if (stopAtNodeId && current === stopAtNodeId) break;

            const edges = this.adjacencyList.get(current) || [];
            for (const edge of edges) {
                if (visited.has(edge.to)) continue;

                const newDist = (dist.get(current) ?? Infinity) + edge.weight;
                if (newDist < (dist.get(edge.to) ?? Infinity)) {
                    dist.set(edge.to, newDist);
                    prev.set(edge.to, { nodeId: current, edge });
                    pq.push({ nodeId: edge.to, dist: newDist });
                }
            }
        }

        return { dist, prev };
    }

    private buildPathResult(
        startNodeId: string,
        endNodeId: string,
        dist: Map<string, number>,
        prev: Map<string, { nodeId: string; edge: GraphEdge }>
    ): PathResult | null {
        if (!prev.has(endNodeId) && startNodeId !== endNodeId) {
            return null;
        }

        const nodes: string[] = [];
        const edges: GraphEdge[] = [];
        let current = endNodeId;

        while (prev.has(current)) {
            nodes.unshift(current);
            const { nodeId: prevNode, edge } = prev.get(current)!;
            edges.unshift(edge);
            current = prevNode;
        }
        nodes.unshift(startNodeId);

        const coordinates: [number, number][] = [];
        for (let i = 0; i < edges.length; i++) {
            const edgeCoords = edges[i].coordinates;
            const startIdx = i === 0 ? 0 : 1;
            for (let j = startIdx; j < edgeCoords.length; j++) {
                coordinates.push(edgeCoords[j]);
            }
        }

        return {
            nodes,
            edges,
            totalDistance: dist.get(endNodeId) || 0,
            coordinates,
        };
    }

    /**
     * 从起点到所有可达节点的道路距离 (km)。
     * 供 AI 目标评估等批量查询；同一起点在同帧内复用缓存。
     */
    public getRoadDistancesKmFrom(startCityId: string): ReadonlyMap<string, number> {
        return this.getDijkstraFrom(startCityId)?.distances ?? new Map();
    }

    /**
     * 在图上寻找两个节点之间的最短路径
     */
    public findPath(startNodeId: string, endNodeId: string): PathResult | null {
        if (!this.adjacencyList.has(startNodeId)) {
            console.warn(`⚠️ [RoadRegistry] Start node not found: ${startNodeId}`);
            return null;
        }
        if (!this.adjacencyList.has(endNodeId)) {
            console.warn(`⚠️ [RoadRegistry] End node not found: ${endNodeId}`);
            return null;
        }

        const cached = this.getDijkstraFrom(startNodeId);
        if (!cached) return null;
        return this.buildPathResult(startNodeId, endNodeId, cached.distances, cached.prev);
    }

    /**
     * 将路径坐标转为 {lat, lng}[] 格式 (Leaflet 兼容)
     */
    public pathToLatLngs(path: PathResult): { lat: number; lng: number }[] {
        return path.coordinates.map(([lng, lat]) => ({ lat, lng }));
    }

    // ===== 旧版兼容接口 =====

    /**
     * 在矢量图上寻路，返回 {lat, lng}[]。
     *
     * 注意：当前仍被「历史事件野战」(MultiLegionFieldBattle) 用于赶赴战场，并非死代码。
     * 与沙盒 AI 主行军链 (getFullPathToCity) 不同：本接口用 1.0° 内最近城作起终点，
     * 且在两端各额外插入「当前位置→起点城」「终点城→目标点」的直线段。
     * 沙盒 AI 行军请用 getFullPathToCity（会就近贴最近道路点，离路斜线最短）。
     */
    public findPathOnRoad(
        startPos: { lat: number; lng: number },
        endPos: { lat: number; lng: number }
    ): { lat: number; lng: number }[] | null {
        const startId = this.findNearestCityId(startPos.lat, startPos.lng, 1.0);
        const endId = this.findNearestCityId(endPos.lat, endPos.lng, 1.0);

        if (!startId || !endId) {
            console.warn('⚠️ [RoadRegistry] No nearby city for path endpoints');
            return null;
        }

        const path = this.findPath(startId, endId);
        if (!path) {
            console.warn(`⚠️ [RoadRegistry] No path from ${startId} to ${endId}`);
            return null;
        }

        const latLngs = this.pathToLatLngs(path);

        const finalPath: { lat: number; lng: number }[] = [];
        finalPath.push(startPos);

        const startNode = this.nodes.get(startId);
        if (startNode) {
            finalPath.push({ lat: startNode.lat, lng: startNode.lng });
        }

        finalPath.push(...latLngs);

        const endNode = this.nodes.get(endId);
        if (endNode) {
            finalPath.push({ lat: endNode.lat, lng: endNode.lng });
        }

        finalPath.push(endPos);

        const deduped: { lat: number; lng: number }[] = [];
        for (const p of finalPath) {
            if (deduped.length === 0) {
                deduped.push(p);
            } else {
                const last = deduped[deduped.length - 1];
                if (Math.abs(last.lat - p.lat) > 0.0001 || Math.abs(last.lng - p.lng) > 0.0001) {
                    deduped.push(p);
                }
            }
        }

        return deduped.length >= 2 ? deduped : null;
    }

    /**
     * 获取到城市的完整路径（贴路行军）。
     *
     * 默认从最近的「已接入路网的城市」跑 Dijkstra，并把当前位置接到该城-城折线上。
     * 但当军队离这条折线较远（离路首段 > JOIN_EPS，多见于野战后落在野外）时，
     * 改为投影到**整个路网几何最近的道路点**进入，把"离路斜线"压到几何最短，
     * 然后全程沿道路行军。两种方案取离路首段更短者。
     */
    public getFullPathToCity(
        startPos: { lat: number; lng: number },
        targetCityId: string,
        sourceCityId?: string
    ): { lat: number; lng: number }[] {
        const start = { lat: startPos.lat, lng: startPos.lng };

        const cityRoute = this.buildCityAnchoredPath(start, targetCityId, sourceCityId);
        const cityLeg = this.offRoadFirstLeg(start, cityRoute);

        // 已经贴在道路上（含正常沿路行军）：直接返回，避免每次都全网扫描
        if (cityRoute.length >= 2 && cityLeg <= GameConfig.ROAD.JOIN_EPS) {
            return cityRoute;
        }

        // 离路较远：尝试投影到全网最近道路点进入，取离路首段更短的方案
        const netRoute = this.buildPathViaNearestRoad(start, targetCityId);
        if (netRoute && netRoute.length >= 2) {
            const netLeg = this.offRoadFirstLeg(start, netRoute);
            if (cityRoute.length < 2 || netLeg < cityLeg) {
                return netRoute;
            }
        }

        return cityRoute;
    }

    /** 旧逻辑：从最近接入路网的城市跑 Dijkstra，再把当前位置接到该折线上 */
    private buildCityAnchoredPath(
        startPos: { lat: number; lng: number },
        targetCityId: string,
        sourceCityId?: string
    ): { lat: number; lng: number }[] {
        const startId = sourceCityId || this.findNearestCityId(startPos.lat, startPos.lng, 0.5);
        if (!startId) return [];

        const path = this.findPath(startId, targetCityId);
        if (!path) return [];

        const latLngs = this.pathToLatLngs(path);
        if (latLngs.length === 0) return [];

        return joinStartToRoadPolyline(
            { lat: startPos.lat, lng: startPos.lng },
            latLngs,
            GameConfig.ROAD.JOIN_EPS
        );
    }

    /** 路径离路首段长度（LatLng 欧氏）：当前位置到第一个落在道路上的点 */
    private offRoadFirstLeg(
        startPos: { lat: number; lng: number },
        route: { lat: number; lng: number }[]
    ): number {
        if (route.length === 0) return Infinity;
        const head = route[0];
        const headIsStart =
            Math.abs(head.lat - startPos.lat) < 1e-6 && Math.abs(head.lng - startPos.lng) < 1e-6;
        if (headIsStart) {
            return route.length >= 2 ? getEuclideanDistance(route[0], route[1]) : 0;
        }
        return getEuclideanDistance(startPos, head);
    }

    /**
     * 投影到整个路网几何最近的道路点（任意一条边上的最近投影点）。
     * 仅在离路较远的冷路径调用，遍历全部边一次。
     */
    private findNearestRoadEntry(
        pos: { lat: number; lng: number },
        maxDistDeg: number
    ): {
        fromNodeId: string;
        toNodeId: string;
        coords: { lat: number; lng: number }[];
        projPoint: { lat: number; lng: number };
        segmentIndex: number;
        distance: number;
    } | null {
        let best: {
            fromNodeId: string;
            toNodeId: string;
            coords: { lat: number; lng: number }[];
            projPoint: { lat: number; lng: number };
            segmentIndex: number;
            distance: number;
        } | null = null;

        for (const edge of this.edges.values()) {
            if (edge.coordinates.length === 0) continue;
            const coords = edge.coordinates.map(([lng, lat]) => ({ lat, lng }));
            const np = nearestPointOnPolyline(pos, coords);
            if (!np) continue;
            if (best === null || np.distance < best.distance) {
                best = {
                    fromNodeId: edge.from,
                    toNodeId: edge.to,
                    coords,
                    projPoint: np.point,
                    segmentIndex: np.segmentIndex,
                    distance: np.distance,
                };
            }
        }

        if (!best || best.distance > maxDistDeg) return null;
        return best;
    }

    /**
     * 从全网最近道路点进入，经较近的一端节点 Dijkstra 到目标城，
     * 拼成「当前位置 → 投影点(短直线归队) → 沿道路 → 目标」的折线。
     */
    private buildPathViaNearestRoad(
        startPos: { lat: number; lng: number },
        targetCityId: string
    ): { lat: number; lng: number }[] | null {
        const entry = this.findNearestRoadEntry(startPos, 2.0);
        if (!entry) return null;

        const { coords, segmentIndex, projPoint, fromNodeId, toNodeId } = entry;

        // 朝 to 端：投影点 → coords[seg+1 .. 末尾(=to 节点)]
        const forwardPartial = [projPoint, ...coords.slice(segmentIndex + 1)];
        // 朝 from 端：投影点 → coords[seg .. 起点(=from 节点)]（反向）
        const backwardPartial = [projPoint, ...coords.slice(0, segmentIndex + 1).reverse()];

        const viaTo = this.composeRouteFromNode(toNodeId, targetCityId, forwardPartial);
        const viaFrom = this.composeRouteFromNode(fromNodeId, targetCityId, backwardPartial);

        let chosen: { lat: number; lng: number }[] | null = null;
        if (viaTo && viaFrom) {
            chosen = this.polylineLengthDeg(viaTo) <= this.polylineLengthDeg(viaFrom) ? viaTo : viaFrom;
        } else {
            chosen = viaTo ?? viaFrom;
        }
        if (!chosen || chosen.length === 0) return null;

        return this.dedupeRoute([startPos, ...chosen]);
    }

    /** 拼接「边上投影点→端节点」的局部段 + 该端节点到目标城的 Dijkstra 折线 */
    private composeRouteFromNode(
        nodeId: string,
        targetCityId: string,
        partialToNode: { lat: number; lng: number }[]
    ): { lat: number; lng: number }[] | null {
        const path = this.findPath(nodeId, targetCityId);
        if (!path) return null;
        const roadLatLngs = this.pathToLatLngs(path); // 首点 = nodeId 坐标
        // partialToNode 末点已是 nodeId 坐标，拼接时跳过 roadLatLngs[0] 防重复
        return this.dedupeRoute([...partialToNode, ...roadLatLngs.slice(1)]);
    }

    private polylineLengthDeg(route: { lat: number; lng: number }[]): number {
        let total = 0;
        for (let i = 1; i < route.length; i++) {
            total += getEuclideanDistance(route[i - 1], route[i]);
        }
        return total;
    }

    private dedupeRoute(route: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
        const out: { lat: number; lng: number }[] = [];
        for (const p of route) {
            if (out.length === 0) {
                out.push(p);
                continue;
            }
            const last = out[out.length - 1];
            if (Math.abs(last.lat - p.lat) > 0.0001 || Math.abs(last.lng - p.lng) > 0.0001) {
                out.push(p);
            }
        }
        return out;
    }

    // ===== 城市连接查询 =====

    /**
     * 获取一个城市直接连接的所有城市ID
     */
    public getConnectedCities(cityId: string): string[] {
        const edges = this.adjacencyList.get(cityId) || [];
        const connected = new Set<string>();
        for (const edge of edges) {
            if (edge.to !== cityId) connected.add(edge.to);
        }
        return Array.from(connected);
    }

    /** 两城之间的道路距离 (km)；无连通路径时返回 null */
    public getRoadDistanceKm(startCityId: string, endCityId: string): number | null {
        if (!startCityId || !endCityId) return null;
        if (startCityId === endCityId) return 0;
        const km = this.getRoadDistancesKmFrom(startCityId).get(endCityId);
        return km !== undefined ? km : null;
    }

    /**
     * 寻找城市之间的路径 (返回城市ID序列)
     */
    public findCityPath(startId: string, endId: string): string[] | null {
        const path = this.findPath(startId, endId);
        if (!path) return null;
        return path.nodes;
    }

    /**
     * 路上逐城排查：从 start 到 end 的城市链上，返回第一个非己方据点。
     * 仅与 army 同 factionId 的据点可穿过（含 panjun / 敌方 / 他势力，一律须先打）。
     */
    public resolveFirstHostileCityOnPath(
        factionId: string,
        startCityId: string,
        endCityId: string,
        getFaction: (cityId: string) => string | undefined
    ): string {
        if (!startCityId || !endCityId) return endCityId;

        const nodePath = this.findCityPath(startCityId, endCityId);
        if (!nodePath || nodePath.length === 0) return endCityId;

        for (const cityId of nodePath) {
            // 出发城不算行军目标：军团正站在这里，路径为 0 点会被误判「无路」；
            // 站在敌城 ZOC 内的情况由 LegionManager 的 ZOC 检查就地触发攻城
            if (cityId === startCityId) continue;
            const cityFaction = getFaction(cityId);
            if (cityFaction === undefined) continue;
            if (cityFaction !== factionId) return cityId;
        }
        return endCityId;
    }

    /** 查找距坐标最近、且已接入路网的城市节点 */
    public getNearestCityId(lat: number, lng: number, maxDistDeg: number = 0.5): string | undefined {
        return this.findNearestCityId(lat, lng, maxDistDeg);
    }

    // ===== 道路CRUD =====

    /**
     * 获取所有矢量道路
     */
    public getVectorRoads(): VectorRoadFeature[] {
        return VECTOR_ROAD_DATA.features;
    }

    /**
     * 添加一条新的矢量道路
     */
    public addVectorRoad(feature: VectorRoadFeature): void {
        VECTOR_ROAD_DATA.features.push(feature);
        // 重建图
        this.rebuildGraph();
        this.notifyRoadsUpdated();
    }

    /**
     * [PERF] 批量添加道路 - 只重建图 + 触发渲染**一次**
     * 用于 batchAutoConnect 等场景。比单个 addVectorRoad 循环快 N 倍。
     */
    public addVectorRoadsBatch(features: VectorRoadFeature[]): void {
        if (features.length === 0) return;
        for (const f of features) {
            VECTOR_ROAD_DATA.features.push(f);
        }
        // 全部加完后，统一重建一次图 + 通知一次
        this.rebuildGraph();
        this.notifyRoadsUpdated();
    }

    /**
     * 更新一条矢量道路的坐标
     */
    public updateVectorRoadCoordinates(roadId: string, coordinates: [number, number][]): void {
        const feature = VECTOR_ROAD_DATA.features.find(f => f.properties.id === roadId);
        if (feature) {
            feature.geometry.coordinates = coordinates;
            this.rebuildGraph();
            this.notifyRoadsUpdated();
        }
    }

    /**
     * 删除一条矢量道路
     */
    public removeVectorRoad(roadId: string): void {
        const idx = VECTOR_ROAD_DATA.features.findIndex(f => f.properties.id === roadId);
        if (idx >= 0) {
            VECTOR_ROAD_DATA.features.splice(idx, 1);
            this.rebuildGraph();
            this.notifyRoadsUpdated();
        }
    }

    /**
     * 重建整个图
     */
    private rebuildGraph(): void {
        this.clearDistanceCache();
        this.edges.clear();
        this.adjacencyList.clear();

        // 重新注册所有节点的邻接表
        for (const [id] of this.nodes) {
            this.adjacencyList.set(id, []);
        }

        this.loadVectorRoads();
    }

    // ===== 工具方法 =====

    private findNearestCityId(lat: number, lng: number, maxDistDeg: number): string | undefined {
        let nearest: string | undefined;
        let minDist = Infinity;

        for (const [id, node] of this.nodes) {
            if (node.type !== 'city') continue;
            // 跳过未接入道路的节点
            const edges = this.adjacencyList.get(id);
            if (!edges || edges.length === 0) continue;
            const dLat = node.lat - lat;
            const dLng = (node.lng - lng) * Math.cos(lat * Math.PI / 180);
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            if (dist < minDist && dist < maxDistDeg) {
                minDist = dist;
                nearest = id;
            }
        }

        return nearest;
    }

    private calculatePathLength(coords: [number, number][]): number {
        let total = 0;
        for (let i = 1; i < coords.length; i++) {
            total += this.haversineDistance(
                coords[i - 1][1], coords[i - 1][0],
                coords[i][1], coords[i][0]
            );
        }
        return total;
    }

    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ===== 旧版兼容 =====

    private buildCityAreaCache(cities: any[]): void {
        this.cityAreaMap.clear();
        cities.forEach(city => {
            this.cityAreaMap.set(city.id, city.id);
        });
    }

    public onRoadsUpdated(callback: () => void): void {
        this.updateCallbacks.push(callback);
    }

    public notifyRoadsUpdated(): void {
        this.updateCallbacks.forEach(cb => cb());
    }



    // ===== 渲染器接口 (Renderer API) =====

    /**
     * 更新自定义（手动绘制）的道路格子
     */
    public updateCustomRoadHexes(hexes: Set<string>): void {
        this.customRoadHexes = hexes;
    }

    public getCustomRoadHexes(): Set<string> {
        return this.customRoadHexes;
    }

    public getDisabledRoadHexes(): Set<string> {
        return new Set(); // Dummy for now
    }

    /**
     * 获取所有需要渲染的格子 (Custom + Vector Rasterized)
     * RoadLayer 使用此方法决定绘制哪些区域
     */
    public getAllRenderableHexes(): Set<string> {
        const result = new Set<string>();
        // Add Custom
        this.customRoadHexes.forEach(h => result.add(h));
        // Add Vectors
        this.cachedVectorHexes.forEach(h => result.add(h));
        return result;
    }

    /**
     * 将所有矢量道路光栅化为六边形格子
     * Simple line interpolation
     */
    /** 首屏后延迟调用：光栅化道路 hex 供 RoadLayer 渲染，完成后通知重绘 */
    public rasterizeRoadsDeferred(): void {
        this.rasterizeVectorRoads();
        this.notifyRoadsUpdated();
    }

    private rasterizeVectorRoads(): void {
        this.cachedVectorHexes.clear();
        this.vectorHexMetadata.clear(); // Clear old metadata maps
        const edges = Array.from(this.edges.values());

        // Rasterize each edge
        for (const edge of edges) {
            const coords = edge.coordinates;
            // Cache metadata if available
            const meta = (edge.roadFeature.properties.startYear !== undefined || edge.roadFeature.properties.endYear !== undefined)
                ? { startYear: edge.roadFeature.properties.startYear, endYear: edge.roadFeature.properties.endYear }
                : undefined;

            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = { lat: coords[i][1], lng: coords[i][0] };
                const p2 = { lat: coords[i + 1][1], lng: coords[i + 1][0] };

                // Interpolate
                const dist = Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2));
                const steps = Math.ceil(dist / 0.05); // 0.05 deg step (approx 1/3 hex radius)

                for (let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const lat = p1.lat + (p2.lat - p1.lat) * t;
                    const lng = p1.lng + (p2.lng - p1.lng) * t;

                    const hex = GridSystem.latLngToAxial(lat, lng);
                    const key = `${hex.q},${hex.r}`;
                    this.cachedVectorHexes.add(key);

                    if (meta) {
                        // Store metadata for this hex (last writer wins, acceptable for overlapping roads)
                        this.vectorHexMetadata.set(key, meta);
                    }
                }
            }
        }
        // console.log(`[RoadRegistry] Rasterized ${this.cachedVectorHexes.size} hexes from vectors.`);
    }

    /**
     * [NEW] Get metadata for a specific road hex or segment
     */
    public getRoadMetadata(key: string): { startYear?: number; endYear?: number } | undefined {
        // Return metadata stored during rasterization
        return this.vectorHexMetadata.get(key);
    }

    // ===== 公共查询 =====

    // public getNodes(): Map<string, GraphNode> { return this.nodes; }
    // public getEdges(): Map<string, GraphEdge> { return this.edges; }
    public getAdjacencyList(): Map<string, GraphEdge[]> { return this.adjacencyList; }
    // ===== 几何计算 =====
    /**
     * [NEW] Find the nearest point on any road to a given location
     * Used for snapping field battles to roads
     */
    public findNearestRoadPoint(lat: number, lng: number, maxDistanceKm: number = 50): { lat: number, lng: number, distance: number } | null {
        let bestPoint: { lat: number, lng: number, distance: number } | null = null;
        let minDistance = Infinity;

        const allEdges = Array.from(this.edges.values());

        for (const edge of allEdges) {
            const coords = edge.coordinates;
            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = { lat: coords[i][1], lng: coords[i][0] };
                const p2 = { lat: coords[i + 1][1], lng: coords[i + 1][0] };

                const closest = this.getClosestPointOnSegment(lat, lng, p1.lat, p1.lng, p2.lat, p2.lng);
                const dist = this.haversineDistance(lat, lng, closest.lat, closest.lng);

                if (dist < minDistance && dist <= maxDistanceKm) {
                    minDistance = dist;
                    bestPoint = { ...closest, distance: dist };
                }
            }
        }

        return bestPoint;
    }

    private getClosestPointOnSegment(lat: number, lng: number, lat1: number, lng1: number, lat2: number, lng2: number) {
        const x = lat, y = lng;
        const x1 = lat1, y1 = lng1;
        const x2 = lat2, y2 = lng2;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) // in case of 0 length line
            param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return { lat: xx, lng: yy };
    }

    /**
     * Check if a location is on a road (vector or custom)
     */
    public isOnRoad(lat: number, lng: number): boolean {
        const hex = GridSystem.latLngToAxial(lat, lng);
        const key = `${hex.q},${hex.r}`;
        return this.cachedVectorHexes.has(key) || this.customRoadHexes.has(key);
    }

    public isHexOnRoad(q: number, r: number): boolean {
        const key = `${q},${r}`;
        return this.cachedVectorHexes.has(key) || this.customRoadHexes.has(key);
    }

    public isPassable(q: number, r: number): boolean {
        return this.isHexOnRoad(q, r);
    }

}

export const roadRegistry = RoadRegistry.getInstance();
