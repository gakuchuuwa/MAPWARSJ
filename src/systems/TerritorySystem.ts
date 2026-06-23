import * as L from 'leaflet';
import { GameMap } from '../map/GameMap';
import { City } from '../types/core';
import { FactionManager } from '../world/FactionManager';
import { GridSystem } from '../systems/GridSystem';
import { OrientationSystem } from '../core/OrientationSystem';
// import { GameConfig } from '../config/GameConfig';
import { roadRegistry } from '../roads/RoadRegistry';
import { CityAssetManager } from '../assets/CityAssetManager';
// [PERF] Import Territory Worker
import TerritoryWorker from '../workers/TerritoryWorker?worker';
import { TerritoryRequest, TerritoryResponse } from '../workers/TerritoryWorker';
import {
    assignHexesSubset,
    buildCityCoreIndex,
    computeAffectedCityIds,
    computeClaimsForCity,
} from './territory/TerritoryClaimEngine';
import {
    collectGroupKeysForFactions,
    hexOwnershipToFactionHexes,
} from './territory/TerritoryRenderPatch';
import { resolveCityFlagClass } from './territory/TerritoryFlagClass';
import {
    getCityImageContainerClass,
    scheduleCityMarkerTerrainSample,
} from './city-marker/CityMarkerTerrain';
import {
    CITY_MARKER_BUILDING_CLASS,
    CITY_MARKER_SIZE_BIG_CLASS,
    getCityMarkerSizeClass,
} from '../config/city-marker-tokens';
import {
    CITY_EXCLUSIVE_MARKER_BASE_SIZE,
    hasCityExclusiveIcon,
} from './city-marker/CityExclusiveIcons';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import {
    FACTION_ONLY_HIDDEN_PANES,
    isFactionOnlyZoom,
    isMacroMapZoom,
    MACRO_HIDDEN_INFRA_PANES,
} from '../config/StrategicView';

export class TerritorySystem {
    private map: GameMap;
    private factionManager: FactionManager;
    private layerGroup: L.LayerGroup; // For City Icons
    private territoryLayerGroup: L.LayerGroup; // For Territory Polygons

    // UI Elements Mapped by City ID
    private cityMarkers: Map<string, L.Marker> = new Map();
    private cityLabels: Map<string, L.Marker> = new Map();

    // Caches
    private geometryCache: Map<string, { checksum: string, paths: L.LatLng[][] }> = new Map();

    // State
    private renderCounter = 0; // For cancelling stale async render jobs
    private cities: City[] = []; // Local cache for rendering
    private lastRenderedZoomFloor: number = -1; // [NEW] Track zoom for geometry rebuilds
    private showCityTextures: boolean = true; // [NEW] Default to true

    /** 全图 BFS 结果缓存，供占城增量更新 */
    private hexOwnershipCache: Map<number, City> = new Map();
    private ownershipCacheValid = false;

    // [PERF] Worker for territory calculation
    private worker: Worker;
    private workerMsgId: number = 0;
    private pendingWorkerCallback: ((response: TerritoryResponse) => void) | null = null;
    // [CONFIG] Set to true to enable Worker-based calculation (experimental)
    // [DEBUG] Disabled - Worker may have issues causing missing territory colors
    private static USE_WORKER = false;

    // Event Callbacks
    public onCityClick: ((city: City, e: L.LeafletMouseEvent) => void) | null = null;

    constructor(map: GameMap, factionManager: FactionManager) {
        this.map = map;
        this.factionManager = factionManager;

        const leafletMap = map.getLeafletMap();

        // Create dedicated panes for city markers (z-index 610) and labels (z-index 640)
        if (!leafletMap.getPane('cityPane')) {
            leafletMap.createPane('cityPane');
            leafletMap.getPane('cityPane')!.style.zIndex = '610';
        }
        if (!leafletMap.getPane('labelsPane')) {
            leafletMap.createPane('labelsPane');
            leafletMap.getPane('labelsPane')!.style.zIndex = '640';
        }
        // Dedicated pane for territory polygons (below cities)
        if (!leafletMap.getPane('territoryPane')) {
            leafletMap.createPane('territoryPane');
            leafletMap.getPane('territoryPane')!.style.zIndex = '350';
        }

        this.layerGroup = L.layerGroup().addTo(leafletMap);
        this.territoryLayerGroup = L.layerGroup([], { pane: 'territoryPane' }); // Default hidden

        // [PERF] Initialize Territory Worker
        this.worker = new TerritoryWorker();
        this.worker.onmessage = (e: MessageEvent<TerritoryResponse>) => {
            if (this.pendingWorkerCallback) {
                this.pendingWorkerCallback(e.data);
                this.pendingWorkerCallback = null;
            }
        };

        // Setup Zoom Listener for scaling (Real-time 'zoom' instead of 'zoomend')
        leafletMap.on('zoom', () => {
            this.updateCityScales();
            this.updateTerritoryStyle();
        });

        // 跟随军团每帧 setView 平移后，新进入视野的据点需补一次缩放（否则 getElement 曾为 null）
        let moveScaleTimer: ReturnType<typeof setTimeout> | null = null;
        leafletMap.on('moveend', () => {
            if (moveScaleTimer !== null) clearTimeout(moveScaleTimer);
            moveScaleTimer = setTimeout(() => {
                moveScaleTimer = null;
                this.updateCityScales();
            }, 50);
        });

        // [NEW] Geometry Rebuild on Boosted Zoom Range (7-9) Entry/Exit
        leafletMap.on('zoomend', () => {
            const currentZoom = Math.floor(leafletMap.getZoom());
            // Boosted range is now [7, 9] per user request
            const wasBoosted = (this.lastRenderedZoomFloor >= 7 && this.lastRenderedZoomFloor <= 9);
            const isBoosted = (currentZoom >= 7 && currentZoom <= 9);

            if (wasBoosted !== isBoosted) {
                console.log(`[TerritorySystem] Zoom boost transition detected (${this.lastRenderedZoomFloor} -> ${currentZoom}). Recomputing territories...`);
                this.update(this.cities);
            }
        });

    }

    public toggleCityTextures(visible: boolean): void {
        this.showCityTextures = visible;
        // Re-render cities to apply changes
        this.update(this.cities);
    }

    // [NEW] Dynamic Style Switching
    // [PERF] 简化领土样式更新：纯色填充 + 简单边框，无 SVG filter / CSS blur
    private updateTerritoryStyle(): void {
        const zoom = this.map.getLeafletMap().getZoom();
        const floorZoom = Math.floor(zoom);

        const isStrategic = floorZoom <= 8;
        const isBorderOnly = floorZoom === 9;
        const isHidden = floorZoom >= 10;

        this.territoryLayerGroup.eachLayer((layer: any) => {
            // 领土填充多边形
            if (layer instanceof L.Polygon && (layer as any).factionId) {
                if (isHidden) {
                    layer.setStyle({ fillOpacity: 0 });
                } else if (isBorderOnly) {
                    layer.setStyle({ fillOpacity: 0 });
                } else if (isStrategic) {
                    layer.setStyle({ fillOpacity: 0.5 });
                }
            }

            // 边框线
            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                if (isHidden) {
                    layer.setStyle({ opacity: 0, stroke: false });
                } else {
                    layer.setStyle({ opacity: 1.0, stroke: true });
                }
            }
        });
    }

    /**
     * [PERF] Dispatch territory calculation to Worker
     */
    private dispatchToWorker(): Promise<TerritoryResponse> {
        return new Promise((resolve) => {
            const currentZoom = Math.floor(this.map.getLeafletMap().getZoom());

            // Prepare city data for Worker
            const cityData = this.cities.map(c => ({
                id: c.id,
                factionId: c.factionId || 'neutral',
                lat: c.latitude,
                lng: c.longitude,
                type: c.type
            }));

            // Get road hexes from roadRegistry
            let roadHexes: string[] = [];
            if (roadRegistry.isInitialized()) {
                roadHexes = Array.from(roadRegistry.getCustomRoadHexes());
            }

            const request: TerritoryRequest = {
                id: ++this.workerMsgId,
                cities: cityData,
                roadHexes: roadHexes,
                currentZoom: currentZoom
            };

            this.pendingWorkerCallback = resolve;
            this.worker.postMessage(request);
        });
    }

    /**
     * Main Render Loop
     * Calculates territory ownership and renders cities/territories.
     * Async/Chunked to prevent UI freeze.
     */
    public canIncrementalUpdate(): boolean {
        return this.ownershipCacheValid && this.hexOwnershipCache.size > 0;
    }

    /**
     * 占城后增量更新：仅重算邻区 BFS + 局部六角格分配 + 重绘涉及势力（不全图 611 城）
     */
    public async updateIncremental(
        seedCityIds: string[],
        ghostPredicate?: (city: City) => boolean,
        oldFactionIds: string[] = [],
        citiesSnapshot?: City[]
    ): Promise<void> {
        if (citiesSnapshot?.length) {
            this.cities = citiesSnapshot;
        }
        if (!this.canIncrementalUpdate() || seedCityIds.length === 0) {
            await this.update(this.cities, ghostPredicate);
            return;
        }

        CityAssetManager.setTerritoryWorkActive(true);
        const renderId = ++this.renderCounter;
        const t0 = performance.now();

        try {
            const affected = computeAffectedCityIds(this.cities, seedCityIds);
            const cityLocations = buildCityCoreIndex(this.cities);
            const hexOwnership = new Map(this.hexOwnershipCache);
            const reassignKeys = new Set<number>();
            const cityClaimsMap = new Map<string, ReturnType<typeof computeClaimsForCity>>();

            for (const cityId of affected) {
                const city = this.cities.find((c) => c.id === cityId);
                if (!city) continue;
                const claims = computeClaimsForCity(city, cityLocations);
                cityClaimsMap.set(cityId, claims);
                for (const c of claims) reassignKeys.add(c.key);
            }
            for (const [key, owner] of hexOwnership) {
                if (affected.has(owner.id)) reassignKeys.add(key);
            }
            for (const key of reassignKeys) hexOwnership.delete(key);

            await assignHexesSubset(
                reassignKeys,
                cityClaimsMap,
                this.cities,
                affected,
                hexOwnership,
                () => this.renderCounter !== renderId
            );
            if (this.renderCounter !== renderId) return;

            this.hexOwnershipCache = hexOwnership;
            this.ownershipCacheValid = true;

            const factionsToRedraw = new Set<string>(oldFactionIds.filter(Boolean));
            for (const cityId of affected) {
                const c = this.cities.find((x) => x.id === cityId);
                if (c?.factionId) factionsToRedraw.add(c.factionId);
            }
            for (const key of reassignKeys) {
                const owner = hexOwnership.get(key);
                if (owner?.factionId) factionsToRedraw.add(owner.factionId);
            }

            this.patchFactionTerritoryLayers(factionsToRedraw, hexOwnership);

            for (const cityId of affected) {
                const city = this.cities.find((c) => c.id === cityId);
                if (city) this.refreshCityMarker(city);
            }
            this.updateTerritoryStyle();

            console.log(
                `[TerritorySystem] Incremental: seeds=${seedCityIds.length}, affected=${affected.size}, hexes=${reassignKeys.size}, factions=${factionsToRedraw.size}`
            );
            const perf = PerformanceMonitor.getInstance();
            perf.noteAsyncWork('territoryIncremental', performance.now() - t0);
            perf.reportCount('territoryBfsNodesIncremental', reassignKeys.size);
            perf.reportCount('territoryBfsAffectedCities', affected.size);
        } finally {
            CityAssetManager.setTerritoryWorkActive(false);
        }
    }

    private patchFactionTerritoryLayers(
        factionIds: Set<string>,
        hexOwnership: Map<number, City>
    ): void {
        if (factionIds.size === 0) return;

        const toRemove: L.Layer[] = [];
        this.territoryLayerGroup.eachLayer((layer) => {
            const fid = (layer as { factionId?: string }).factionId;
            if (fid && factionIds.has(fid)) toRemove.push(layer);
        });
        toRemove.forEach((l) => this.territoryLayerGroup.removeLayer(l));

        const groupKeys = collectGroupKeysForFactions(hexOwnership, factionIds);
        const factionHexes = hexOwnershipToFactionHexes(hexOwnership, groupKeys);
        const currentZoom = Math.floor(this.map.getLeafletMap().getZoom());
        const renderPolygons = currentZoom <= 8;
        const renderBorders = currentZoom <= 9;
        if (!renderPolygons && !renderBorders) return;

        const territoryPane = 'territory-faction-pane';
        this.ensureFactionPane(territoryPane);

        factionHexes.forEach((hexes, groupKey) => {
            const factionId = groupKey.startsWith('panjun_') ? 'panjun' : groupKey;
            if (factionId === 'panjun') return;

            const color = this.factionManager.getFactionColor(factionId);

            if (renderPolygons) {
                const sortedKeys = hexes.map((h) => h.key).sort((a, b) => a - b);
                const checksum = sortedKeys.join('|');
                let totalPaths: L.LatLng[][] = [];
                const cached = this.geometryCache.get(groupKey);
                if (cached && cached.checksum === checksum) {
                    totalPaths = cached.paths;
                } else {
                    totalPaths = this.getMergedPaths(hexes);
                    this.geometryCache.set(groupKey, { checksum, paths: totalPaths });
                }
                const polygon = L.polygon(totalPaths, {
                    stroke: false,
                    fill: true,
                    fillColor: color,
                    fillOpacity: 1,
                    interactive: false,
                    pane: territoryPane,
                });
                (polygon as L.Polygon & { factionId?: string }).factionId = factionId;
                polygon.addTo(this.territoryLayerGroup);
            }

            if (renderBorders) {
                this.renderFactionBorders(
                    hexes,
                    factionId,
                    hexOwnership,
                    territoryPane,
                    this.territoryLayerGroup
                );
            }
        });
    }

    /** 仅绘制据点旗号/标签（启动时先出图，避免全图 BFS 期间地图空白） */
    public async renderCitiesOnly(
        cities: City[],
        ghostPredicate?: (city: City) => boolean
    ): Promise<void> {
        this.cities = cities;
        const renderId = ++this.renderCounter;
        await this.renderCityLayersChunked(renderId, ghostPredicate);
    }

    /** 视口扩展：只追加尚未绘制的据点（拖图后分块补画） */
    public async appendCityMarkers(
        cities: City[],
        ghostPredicate?: (city: City) => boolean
    ): Promise<void> {
        const toAdd = cities.filter((c) => !this.cityMarkers.has(c.id));
        if (toAdd.length === 0) return;

        const renderId = ++this.renderCounter;
        const chunkSize = 12;
        let cityIndex = 0;

        while (cityIndex < toAdd.length) {
            // [2026-06-12 性能] 在每批（含第一批）前让出主线程：
            //   appendCityMarkers 由跟拍 moveend 同步调起，第一批 12 城的 renderSingleCity（建 DOM+旗号）
            //   原本卡在镜头帧里（峰值~73ms，慢帧头号「镜头跟随」）。先 yield → 渲染全部异步，镜头帧只剩廉价过滤。
            await new Promise((r) => setTimeout(r, 0));
            if (this.renderCounter !== renderId) return;
            const end = Math.min(cityIndex + chunkSize, toAdd.length);
            for (let i = cityIndex; i < end; i++) {
                const city = toAdd[i];
                const isGhost = ghostPredicate ? ghostPredicate(city) : false;
                this.renderSingleCity(city, this.layerGroup, this.cityMarkers, this.cityLabels, isGhost);
            }
            cityIndex = end;
        }
        this.updateCityScales();
    }

    public hasCityMarker(cityId: string): boolean {
        return this.cityMarkers.has(cityId);
    }

    public getCityImageContainer(cityId: string): HTMLElement | null {
        const marker = this.cityMarkers.get(cityId);
        return marker?.getElement()?.querySelector('.city-image-container') ?? null;
    }

    /** 仅重算并绘制领土（假定据点层已存在） */
    public async updateTerritoryOnly(
        cities: City[],
        ghostPredicate?: (city: City) => boolean
    ): Promise<void> {
        this.cities = cities;
        const renderId = ++this.renderCounter;
        CityAssetManager.setTerritoryWorkActive(true);
        try {
            const hexOwnership = await this.computeHexOwnership(renderId);
            if (!hexOwnership || this.renderCounter !== renderId) return;
            this.hexOwnershipCache = new Map(hexOwnership);
            this.ownershipCacheValid = true;
            await this.renderTerritoryToMap(renderId, hexOwnership);
        } finally {
            CityAssetManager.setTerritoryWorkActive(false);
        }
    }

    private async renderCityLayersChunked(
        renderId: number,
        ghostPredicate?: (city: City) => boolean
    ): Promise<void> {
        const tempLayerGroup = L.layerGroup();
        const tempCityLabels = new Map<string, L.Marker>();
        const tempCityMarkers = new Map<string, L.Marker>();
        const chunkSize = 12;
        let cityIndex = 0;

        while (cityIndex < this.cities.length) {
            if (this.renderCounter !== renderId) return;
            const end = Math.min(cityIndex + chunkSize, this.cities.length);
            for (let i = cityIndex; i < end; i++) {
                const city = this.cities[i];
                const isGhost = ghostPredicate ? ghostPredicate(city) : false;
                this.renderSingleCity(city, tempLayerGroup, tempCityMarkers, tempCityLabels, isGhost);
            }
            cityIndex = end;
            if (cityIndex < this.cities.length) {
                await new Promise((r) => setTimeout(r, 0));
            }
        }
        if (this.renderCounter !== renderId) return;

        const markerLayers: L.Layer[] = [];
        tempLayerGroup.eachLayer((l) => markerLayers.push(l));

        // 原子替换：先挂新 marker 再卸旧的。禁止 clearLayers + 分帧写入（cancel 后会丢据点贴图）
        const staleLayers: L.Layer[] = [];
        this.layerGroup.eachLayer((l) => staleLayers.push(l));

        for (const layer of markerLayers) {
            layer.addTo(this.layerGroup);
        }
        for (const layer of staleLayers) {
            this.layerGroup.removeLayer(layer);
        }

        this.cityMarkers = tempCityMarkers;
        this.cityLabels = tempCityLabels;
        this.updateCityScales();
    }

    private async swapTerritoryLayers(renderId: number, tempTerritoryLayerGroup: L.LayerGroup): Promise<void> {
        const territoryLayers: L.Layer[] = [];
        tempTerritoryLayerGroup.eachLayer((l) => territoryLayers.push(l));
        this.territoryLayerGroup.clearLayers();
        const SWAP_BATCH = 35;
        for (let ti = 0; ti < territoryLayers.length; ) {
            if (this.renderCounter !== renderId) return;
            const tEnd = Math.min(ti + SWAP_BATCH, territoryLayers.length);
            for (; ti < tEnd; ti++) territoryLayers[ti].addTo(this.territoryLayerGroup);
            if (ti < territoryLayers.length) {
                await new Promise((r) => setTimeout(r, 0));
            }
        }
        this.updateTerritoryStyle();
    }

    private async renderTerritoryToMap(
        renderId: number,
        hexOwnership: Map<number, City>
    ): Promise<void> {
        const currentZoom = Math.floor(this.map.getLeafletMap().getZoom());
        const renderPolygons = currentZoom <= 8;
        const renderBorders = currentZoom <= 9;
        if (!renderPolygons && !renderBorders) {
            this.territoryLayerGroup.clearLayers();
            return;
        }

        const factionHexes = new Map<string, { q: number; r: number; key: number }[]>();
        hexOwnership.forEach((city, key) => {
            const { q, r } = GridSystem.getCoordsFromKey(key);
            const fid = city.factionId || 'neutral';
            const groupKey = fid === 'panjun' ? `panjun_${city.id}` : fid;
            if (!factionHexes.has(groupKey)) factionHexes.set(groupKey, []);
            factionHexes.get(groupKey)!.push({ q, r, key });
        });

        const tempTerritoryLayerGroup = L.layerGroup();
        const territoryPane = 'territory-faction-pane';
        this.ensureFactionPane(territoryPane);

        const entries = Array.from(factionHexes.entries());
        const FACTIONS_PER_SLICE = 5;
        for (let fi = 0; fi < entries.length; ) {
            if (this.renderCounter !== renderId) return;
            const sliceEnd = Math.min(fi + FACTIONS_PER_SLICE, entries.length);
            for (let j = fi; j < sliceEnd; j++) {
                const [groupKey, hexes] = entries[j];
                const factionId = groupKey.startsWith('panjun_') ? 'panjun' : groupKey;
                if (factionId === 'panjun') continue;

                const color = this.factionManager.getFactionColor(factionId);

                if (renderPolygons) {
                    const sortedKeys = hexes.map((h) => h.key).sort((a, b) => a - b);
                    const checksum = sortedKeys.join('|');
                    let totalPaths: L.LatLng[][] = [];
                    const cached = this.geometryCache.get(groupKey);
                    if (cached && cached.checksum === checksum) {
                        totalPaths = cached.paths;
                    } else {
                        totalPaths = this.getMergedPaths(hexes);
                        this.geometryCache.set(groupKey, { checksum, paths: totalPaths });
                    }
                    const polygon = L.polygon(totalPaths, {
                        stroke: false,
                        fill: true,
                        fillColor: color,
                        fillOpacity: 1,
                        interactive: false,
                        pane: territoryPane,
                    });
                    (polygon as L.Polygon & { factionId?: string }).factionId = factionId;
                    polygon.addTo(tempTerritoryLayerGroup);
                }

                if (renderBorders) {
                    this.renderFactionBorders(
                        hexes,
                        factionId,
                        hexOwnership,
                        territoryPane,
                        tempTerritoryLayerGroup
                    );
                }
            }
            fi = sliceEnd;
            if (fi < entries.length) {
                await new Promise((r) => setTimeout(r, 0));
            }
        }

        await this.swapTerritoryLayers(renderId, tempTerritoryLayerGroup);
    }

    private async computeHexOwnership(renderId: number): Promise<Map<number, City> | null> {
        const hexOwnership = new Map<number, City>();
        const cityHexCounts = new Map<string, number>();

        // Initialize counts
        this.cities.forEach(c => cityHexCounts.set(c.id, 0));

        // ==================================================================================
        // [PERF] Worker Mode - Dispatch to background thread
        // ==================================================================================
        if (TerritorySystem.USE_WORKER && this.cities.length > 0) {
            console.log('[TerritorySystem] Using Worker for territory calculation...');
            const workerResult = await this.dispatchToWorker();

            // Check if still valid
            if (this.renderCounter !== renderId) return null;

            // Convert Worker result back to hexOwnership format
            const cityMap = new Map<string, City>();
            this.cities.forEach(c => cityMap.set(c.id, c));

            for (const [cityId, keys] of Object.entries(workerResult.ownership)) {
                const city = cityMap.get(cityId);
                if (city) {
                    for (const key of keys) {
                        hexOwnership.set(key, city);
                    }
                    cityHexCounts.set(cityId, keys.length);
                }
            }

            // Debug: Log what we got from Worker
            console.log(`[TerritorySystem Worker] Received ${Object.keys(workerResult.ownership).length} cities, ${hexOwnership.size} hexes`);
            PerformanceMonitor.getInstance().reportCount('territoryBfsNodesFull', hexOwnership.size);

            if (this.renderCounter !== renderId) return null;
            return hexOwnership;
        } else {
            // ==================================================================================
            // 1. Territory Calculation Logic (BFS Expansion) - Main Thread Fallback
            // ==================================================================================

            // Build City CORE Index for Blocking Logic (Center + Ring 1)
            const cityLocations = new Map<number, string>(); // spatialKey -> factionId
            const hexDirs = [
                { q: 0, r: 0 }, // Center
                { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
                { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 } // 6 Neighbors
            ];
            this.cities.forEach(c => {
                const axial = GridSystem.latLngToAxial(c.latitude, c.longitude);
                hexDirs.forEach(dir => {
                    const key = GridSystem.getSpatialKey(axial.q + dir.q, axial.r + dir.r);
                    // Only set if not already owned by another city (first claim wins for blocking)
                    if (!cityLocations.has(key)) {
                        cityLocations.set(key, c.factionId);
                    }
                });
            });

            // Generate all potential claims
            interface Claim {
                key: number; // [OPTIMIZATION] int key
                hexCenter: { lat: number, lng: number };
                city: City;
                rawDist: number;
            }
            let allClaims: Claim[] = [];

            let bfsCityIndex = 0;
            const BFS_CITIES_PER_SLICE = 6;
            const expandCityTerritoryBFS = async (): Promise<void> => {
                if (this.renderCounter !== renderId) return;
                const sliceEnd = Math.min(bfsCityIndex + BFS_CITIES_PER_SLICE, this.cities.length);
                for (let i = bfsCityIndex; i < sliceEnd; i++) {
                const city = this.cities[i];
                const centerAxial = GridSystem.latLngToAxial(city.latitude, city.longitude);

                const openSet = [{ q: centerAxial.q, r: centerAxial.r, cost: 0 }];
                const centerKey = GridSystem.getSpatialKey(centerAxial.q, centerAxial.r);
                const centerDist = 0;
                allClaims.push({
                    key: centerKey,
                    hexCenter: GridSystem.axialToLatLng(centerAxial.q, centerAxial.r),
                    city: city,
                    rawDist: centerDist
                });

                // [OPTIMIZATION] Integer Key for visited set
                const visited = new Map<number, number>();
                visited.set(centerKey, 0);

                // [NEW] 3-Level / 5-Type Classification
                // Level 1 (3 Radius): Big City
                // Level 2 (2 Radius): Medium City, Pass
                // Level 3 (1 Radius): Small City, Ferry

                let maxRadius = 1;

                // Use strict matching first, fall back to keywords for legacy safety
                const cityType = city.type.toLowerCase();

                if (cityType === 'big_city' || cityType.includes('big') || cityType.includes('capital')) {
                    maxRadius = 3;
                } else if (cityType === 'medium_city' || cityType === 'pass' || cityType.includes('medium')) {
                    // Medium City & Pass -> 2
                    maxRadius = 2;
                } else {
                    // Small City, Ferry, and others -> 1
                    maxRadius = 1;
                }

                // [NEW] Zoom Boost: REMOVED as per user request (Strict 1/2/3 rings)
                // const currentZoom = Math.floor(this.map.getLeafletMap().getZoom());
                // if (currentZoom >= 7 && currentZoom <= 9) {
                //    maxRadius += 1;
                // }

                // [DEBUG] Track last rendered zoom
                const currentZoom = Math.floor(this.map.getLeafletMap().getZoom());
                if (this.lastRenderedZoomFloor === -1 || i === 0) { // Update once per loop
                    this.lastRenderedZoomFloor = currentZoom;
                }

                // Rebels can optionally be restricted to 1
                if (city.factionId === 'panjun') {
                    // maxRadius = 1; // Un-comment if rebels must be small
                }

                const MAX_TERRITORY_COST = maxRadius;

                // Access Global Road Registry (assuming it's available or imported)
                // If import is needed, we should add it. For now, try/catch or window.
                const roadRegistry = (window as any).roadRegistry;

                // ------------------------------------------------------------------
                // STRICT RADIUS MODE: No wireless connection or road extensions.
                // Territory is limited to a circle of maxRadius from city center.
                // ------------------------------------------------------------------

                let head = 0;
                while (head < openSet.length) {
                    const curr = openSet[head++];
                    const dirs = [
                        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
                        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
                    ];

                    // ---------------------------------------------------------
                    // STRICT BFS: Simple radius-limited expansion.
                    // All hexes beyond maxRadius are rejected.
                    // ---------------------------------------------------------
                    for (const dir of dirs) {
                        const nq = curr.q + dir.q;
                        const nr = curr.r + dir.r;
                        const nKey = GridSystem.getSpatialKey(nq, nr);

                        // 1. Identify "Terrain" vs "Road"
                        const nextRoadKey = `${nq},${nr}`;
                        const currRoadKey = `${curr.q},${curr.r}`;
                        let isNextRoad = false;
                        let isCurrRoad = false;

                        if (roadRegistry) {
                            const customRoads = roadRegistry.getCustomRoadHexes();
                            // Check strict road membership ONLY (No Driveway)
                            isNextRoad = customRoads.has(nextRoadKey);
                            isCurrRoad = customRoads.has(currRoadKey);
                        }

                        // 2. Determine Step Cost & Permissions
                        let stepCost = 1.0;

                        if (isCurrRoad && isNextRoad) {
                            // Road -> Road (Conductive)
                            stepCost = 0.05;
                        } else if (!isCurrRoad && isNextRoad) {
                            // Terrain -> Road (Entry)
                            stepCost = 0.05;
                        } else if (isCurrRoad && !isNextRoad) {
                            // Road -> Terrain (Insulated Exit)
                            // CRITICAL FIX: Check if CURRENT road position is outside core.
                            // If we're on a road OUTSIDE the core, NEVER expand to terrain.
                            const distCurr = GridSystem.getDistance(centerAxial, { q: curr.q, r: curr.r });
                            if (distCurr > maxRadius) {
                                // We're on a road outside the core - block ALL terrain expansion
                                stepCost = 999;
                            } else {
                                // We're on a road inside the core - allow filling core terrain
                                const distNext = GridSystem.getDistance(centerAxial, { q: nq, r: nr });
                                if (distNext <= maxRadius) {
                                    stepCost = 1.0; // Allow filling core
                                } else {
                                    stepCost = 10.0; // Block spreading outside core
                                }
                            }
                        } else {
                            // Terrain -> Terrain (Normal Spread)
                            stepCost = 1.0;
                        }

                        // 3. Determine Limit
                        // STRICT MODE: Limit is always maxRadius. No infinite roads.
                        let limit = maxRadius;

                        // Blocking Rule: Cannot pass through Enemy City Core
                        const occupantFaction = cityLocations.get(nKey);
                        if (occupantFaction && occupantFaction !== city.factionId) {
                            stepCost = 999;
                        }

                        const newCost = curr.cost + stepCost;

                        // HARD PHYSICAL DISTANCE CHECK (Universal)
                        // Enforce strict physical distance limit for ALL hexes (including roads)
                        // This prevents any extension beyond the defined circle (1/2/3).
                        const physicalDist = GridSystem.getDistance(centerAxial, { q: nq, r: nr });
                        if (physicalDist > maxRadius) {
                            continue; // Skip - beyond physical core radius
                        }

                        if (newCost <= limit) {
                            if (!visited.has(nKey) || newCost < visited.get(nKey)!) {
                                visited.set(nKey, newCost);
                                openSet.push({ q: nq, r: nr, cost: newCost });

                                allClaims.push({
                                    key: nKey,
                                    hexCenter: GridSystem.axialToLatLng(nq, nr),
                                    city: city,
                                    rawDist: newCost
                                });
                            }
                        }
                    }
                }
                }
                bfsCityIndex = sliceEnd;
                if (bfsCityIndex < this.cities.length) {
                    await new Promise(r => setTimeout(r, 0));
                    return expandCityTerritoryBFS();
                }
            };
            await expandCityTerritoryBFS();
            if (this.renderCounter !== renderId) return null;

            // 2. Iterative Assignment (Optimized Round-Robin)
            const assignedHexes = new Set<number>();
            const totalUniqueHexes = new Set(allClaims.map(c => c.key)).size;
            PerformanceMonitor.getInstance().reportCount('territoryBfsNodesFull', totalUniqueHexes);

            // Group claims by city
            const cityClaimsMap = new Map<string, Claim[]>();
            this.cities.forEach(c => cityClaimsMap.set(c.id, []));
            for (const claim of allClaims) {
                cityClaimsMap.get(claim.city.id)?.push(claim);
            }
            // Sort each city's claims (Best/Closest first)
            for (const list of cityClaimsMap.values()) {
                list.sort((a, b) => {
                    if (Math.abs(a.rawDist - b.rawDist) > 0.001) return a.rawDist - b.rawDist;
                    return a.key - b.key; // Integer comparison
                });
            }

            const cityClaimIndices = new Map<string, number>();
            this.cities.forEach(c => cityClaimIndices.set(c.id, 0));

            // [PERF-FIX] Pre-build O(1) city lookup to replace O(n) find() inside the hot loop
            const cityById = new Map<string, City>();
            this.cities.forEach(c => cityById.set(c.id, c));

            // Candidate Pool: Best active claim for each city
            let candidatePool = new Map<string, Claim>();
            for (const city of this.cities) {
                const list = cityClaimsMap.get(city.id)!;
                if (list.length > 0) candidatePool.set(city.id, list[0]);
            }

            let opsSinceYield = 0;

            while (assignedHexes.size < totalUniqueHexes && candidatePool.size > 0) {
                let bestCityId: string | null = null;
                let minScore = Infinity;

                for (const [cityId, claim] of candidatePool.entries()) {
                    // Skip taken hexes
                    let activeClaim = claim;
                    while (assignedHexes.has(activeClaim.key)) {
                        const list = cityClaimsMap.get(cityId)!;
                        const idx = cityClaimIndices.get(cityId)! + 1;
                        cityClaimIndices.set(cityId, idx);
                        if (idx < list.length) {
                            activeClaim = list[idx];
                            candidatePool.set(cityId, activeClaim);
                        } else {
                            candidatePool.delete(cityId);
                            activeClaim = null as any;
                            break;
                        }
                    }
                    if (!activeClaim) continue;

                    // Score Validation
                    // Priority Rule: Physical Rings (1, 2, 3) always beat distant claims (Roads).
                    // "If both are large cities, prioritize 1 circle, 2 circle, 3 circle."

                    // Calculate Physical Distance (Manhattan/Axial)
                    // [PERF-FIX] Use O(1) map lookup instead of O(n) find()
                    const { q: hq, r: hr } = GridSystem.getCoordsFromKey(activeClaim.key);
                    const cityRef = cityById.get(cityId)!;
                    const physicalDist = GridSystem.getDistance(
                        GridSystem.latLngToAxial(cityRef.latitude, cityRef.longitude),
                        { q: hq, r: hr }
                    );

                    let score = activeClaim.rawDist;

                    // Apply Tier Priority Bonuses based on Physical Distance
                    // This ensures a city always owns its Rings 1/2/3 against an intruder from a road.
                    if (physicalDist <= 1) score -= 2000;
                    else if (physicalDist <= 2) score -= 1000;
                    else if (physicalDist <= 3) score -= 500;

                    // Minor tie-breaker using actual cost
                    if (score < minScore) {
                        minScore = score;
                        bestCityId = cityId;
                    } else if (score === minScore && bestCityId) {
                        // Tie-break: Prefer smaller ID or lower rawDist
                        if (activeClaim.rawDist < candidatePool.get(bestCityId)!.rawDist) {
                            bestCityId = cityId;
                        }
                    }
                }

                if (!bestCityId) break;

                const winnerClaim = candidatePool.get(bestCityId)!;
                hexOwnership.set(winnerClaim.key, winnerClaim.city);
                assignedHexes.add(winnerClaim.key);
                cityHexCounts.set(bestCityId, (cityHexCounts.get(bestCityId) || 0) + 1);

                const list = cityClaimsMap.get(bestCityId)!;
                const idx = cityClaimIndices.get(bestCityId)! + 1;
                cityClaimIndices.set(bestCityId, idx);
                if (idx < list.length) {
                    candidatePool.set(bestCityId, list[idx]);
                } else {
                    candidatePool.delete(bestCityId);
                }

                // Time Slicing
                opsSinceYield++;
                if (opsSinceYield > 80) {
                    if (this.renderCounter !== renderId) return null;
                    opsSinceYield = 0;
                    await new Promise(r => setTimeout(r, 0));
                }
            }
        } // End of else (main-thread BFS fallback)

        if (this.renderCounter !== renderId) return null;
        return hexOwnership;
    }

    public async update(cities: City[], ghostPredicate?: (city: City) => boolean): Promise<void> {
        this.cities = cities;
        const renderId = ++this.renderCounter;
        CityAssetManager.setTerritoryWorkActive(true);
        try {
            await this.renderCityLayersChunked(renderId, ghostPredicate);
            if (this.renderCounter !== renderId) return;

            const hexOwnership = await this.computeHexOwnership(renderId);
            if (!hexOwnership) return;

            this.hexOwnershipCache = new Map(hexOwnership);
            this.ownershipCacheValid = true;
            await this.renderTerritoryToMap(renderId, hexOwnership);
        } finally {
            CityAssetManager.setTerritoryWorkActive(false);
        }
    }

    private renderSingleCity(city: City, targetLayerGroup: L.LayerGroup, markersMap: Map<string, L.Marker>, labelsMap: Map<string, L.Marker>, isGhost: boolean = false): void {
        const color = this.factionManager.getFactionColor(city.factionId);
        // [USER REQUEST] Use original coordinates instead of snapping to hex center
        const displayLat = city.latitude;
        const displayLng = city.longitude;

        // [NEW] Ghost Style
        // [NEW] Ghost Style - [FIX] Allow interaction for editor
        const ghostStyle = isGhost ? 'opacity: 0.5; filter: grayscale(100%);' : '';

        // Size Logic: 大城 140 / 中城 120 / 小城与关隘 100（同档）
        const exclusiveIcon = hasCityExclusiveIcon(city.id);
        let baseSize = 100; // Default / Medium
        if (exclusiveIcon) {
            baseSize = CITY_EXCLUSIVE_MARKER_BASE_SIZE;
        } else {
            switch (city.type) {
                case 'big_city':
                    baseSize = 140;
                    break;
                case 'medium_city':
                    baseSize = 120;
                    break;
                case 'pass':
                case 'small_city':
                    baseSize = 100;
                    break;
                default:
                    baseSize = 100;
            }
        }

        // Assets (Using CSS Classes for better performance instead of inline Base64)
        const flagClass = resolveCityFlagClass(city);
        
        const flagText = CityAssetManager.getProcessedFlagText(city.factionId);
        const flagPole = CityAssetManager.getProcessedPole() || '';

        const flagFrameWidth = 32;
        const flagFrameHeight = 40;
        const flagScale = 1.4; // Keep at 1.4 for correct sprite sheet math
        const visualScale = 1.2; // [USER REQUEST] Enlarge flag for better visibility
        const poleHeight = flagFrameHeight * flagScale * 1.2 * visualScale;

        const flagTextOverlay = (flagText) ? `
                 <div class="city-flag-body city-flag-text-overlay" style="
                     position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                     background-image: url('${flagText}');
                     background-size: ${128 * flagScale}px ${240 * flagScale}px;
                     background-position-x: 0;
                     background-position-y: ${-160 * flagScale}px;
                     background-repeat: no-repeat;
                     image-rendering: auto !important;
                     z-index: 11;
                 "></div>` : '';

        // [USER REQUEST] 纠正：所有城池都有归属（势力或叛军），强制渲染旗帜。
        // 对于叛军，调用专用的随机旗帜获取方法以保证各个叛军城池旗帜不同
        // [PERFORMANCE FIX] 移除 inline data:image 渲染，改为注入到 style 的 class

        const flagBodyHtml = `
                     <div class="city-flag-body ${flagClass}" style="
                         position: absolute;
                         top: ${15 + poleHeight * 0.1}px;
                         left: 50%;
                         transform: translateX(5%) scale(${visualScale});
                         transform-origin: top left;
                         width: ${flagFrameWidth * flagScale}px;
                         height: ${flagFrameHeight * flagScale}px;
                         background-size: ${128 * flagScale}px ${320 * flagScale}px;
                         background-position-x: 0;
                         background-position-y: ${-200 * flagScale}px;
                         background-repeat: no-repeat;
                         z-index: 10;
                     ">
                         ${flagTextOverlay}
                     </div>`;

        // [RESTORED] Calculate transform for city image
        const baseTransform = OrientationSystem.getCityImageTransform(city.longitude);
        let transform = (baseTransform === 'none') ? '' : baseTransform;
        if (city.mirror) {
            transform = `scaleX(-1) ${transform}`;
        }
        if (!transform.trim()) transform = 'none';

        const terrainClass = getCityImageContainerClass(city.id);
        const sizeClass = exclusiveIcon ? CITY_MARKER_SIZE_BIG_CLASS : getCityMarkerSizeClass(city.type);
        const containerClass = [terrainClass, sizeClass].filter(Boolean).join(' ');
        const icon = L.divIcon({
            className: 'city-icon',
            html: `<div class="city-image-container ${containerClass}" style="
                     display: flex; flex-direction: column; justify-content: center; align-items: center;
                     width: ${baseSize}px; height: ${baseSize + 80}px;
                     transform-origin: center ${(baseSize + 80) / 2 + 4}px; position: relative;
                     ${ghostStyle}
                 ">
                     <img src="${flagPole}" style="
                         position: absolute; top: 15px; left: 50%;
                         transform: translateX(-30%);
                         height: ${poleHeight}px; width: auto; z-index: -1;
                     ">
                     <div class="city-building-stack" style="display: ${this.showCityTextures ? 'inline-block' : 'none'};">
                         <img class="${CITY_MARKER_BUILDING_CLASS}" src="${city.image}" style="
                             width: ${baseSize}px; height: auto;
                             transform: ${transform};
                         ">
                     </div>
                     ${flagBodyHtml}
                 </div>`,
            iconSize: [baseSize, baseSize + 80],
            iconAnchor: [baseSize / 2, (baseSize + 80) / 2]
        });

        const isEditorMode = (window as any).game?.cityManager?.getIsEditorMode() || false;

        const marker = L.marker([displayLat, displayLng], {
            icon: icon,
            interactive: true,
            draggable: isEditorMode,
            pane: 'cityPane'
        }).addTo(targetLayerGroup);

        if (isEditorMode) {
            marker.on('dragend', (e: any) => {
                const newPos = e.target.getLatLng();
                window.dispatchEvent(new CustomEvent('city-dragend', {
                    detail: { city: city, lat: newPos.lat, lng: newPos.lng }
                }));
            });
        }

        // Bind click event - using raw DOM event for precise mouse position
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (this.onCityClick) {
                const map = this.map.getLeafletMap();
                const mouseLatLng = map.mouseEventToLatLng(e.originalEvent);
                const fixedEvent = { ...e, latlng: mouseLatLng } as L.LeafletMouseEvent;
                this.onCityClick(city, fixedEvent);
            }
        });

        markersMap.set(city.id, marker);

        scheduleCityMarkerTerrainSample(city.id, displayLat, displayLng, (id) => this.getCityImageContainer(id));

        this.renderCityLabel(city, displayLat, displayLng, targetLayerGroup, labelsMap);
    }

    /** 兵力标签文案（2026-06-12 降噪）：≥1 万显示「X.X万」，串更短、全图更静 */
    private static formatTroopsLabel(troops: number): string {
        const t = Math.floor(troops);
        if (t >= 10000) {
            const wan = t / 10000;
            return `${wan >= 10 ? Math.round(wan) : wan.toFixed(1)}万`;
        }
        return String(t);
    }

    /** 据点标签 HTML（城名 + 城防）。renderCityLabel / updateCityLabel 共用，勿再复制粘贴 */
    private static buildCityLabelHtml(city: City): string {
        return `<div style="
            display: flex; justify-content: center; align-items: center; gap: 6px;
            width: 150px; margin-left: -75px; margin-top: 55px;
            cursor: inherit; white-space: nowrap;
        ">
            <span style="
                color: #ffffff; font-weight: bold;
                text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                font-size: 13px;
            ">${city.name}</span>
            <span style="
                color: #f0c75e; font-weight: bold;
                text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                font-size: 11px;
            ">${TerritorySystem.formatTroopsLabel(city.troops)}</span>
        </div>`;
    }

    private renderCityLabel(
        city: City,
        lat: number,
        lng: number,
        targetLayerGroup: L.LayerGroup,
        labelsMap: Map<string, L.Marker>
    ) {
        const html = TerritorySystem.buildCityLabelHtml(city);

        const labelIcon = L.divIcon({ className: 'city-troop-label', html: html });

        const label = L.marker([lat, lng], {
            icon: labelIcon,
            zIndexOffset: 1000,
            interactive: true,
            pane: 'labelsPane'
        }).addTo(targetLayerGroup);

        label.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (this.onCityClick) {
                const map = this.map.getLeafletMap();
                const mouseLatLng = map.mouseEventToLatLng(e.originalEvent);
                const fixedEvent = { ...e, latlng: mouseLatLng } as L.LeafletMouseEvent;
                this.onCityClick(city, fixedEvent);
            }
        });

        labelsMap.set(city.id, label);
    }

    /** 取消进行中的异步全图重绘，避免过期的分块结果覆盖最新占城旗号 */
    public cancelPendingRender(): void {
        this.renderCounter++;
        this.ownershipCacheValid = false;
    }

    private resolveFlagClass(city: City): string {
        return resolveCityFlagClass(city);
    }

    private getEffectiveFlagTextUrl(city: City): string | null {
        return CityAssetManager.getProcessedFlagText(city.factionId);
    }

    private patchFlagTextOverlay(flagBody: HTMLElement, city: City): void {
        const flagScale = 1.4;
        const textUrl = this.getEffectiveFlagTextUrl(city);
        let overlay = flagBody.querySelector<HTMLElement>('.city-flag-text-overlay');

        if (!textUrl) {
            overlay?.remove();
            return;
        }

        const bgSize = `${128 * flagScale}px ${240 * flagScale}px`;
        const bgPosY = `${-160 * flagScale}px`;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'city-flag-body city-flag-text-overlay';
            flagBody.appendChild(overlay);
        }
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: url('${textUrl}');
            background-size: ${bgSize};
            background-position-x: 0;
            background-position-y: ${bgPosY};
            background-repeat: no-repeat;
            image-rendering: auto !important;
            z-index: 11;
        `;
    }

    /**
     * 占城轻量刷新：只改旗号 class 与标签，避免整颗 Leaflet marker 重建。
     * @returns true 已 patch；false 需回退 refreshCityMarker
     */
    public patchCityMarkerFaction(city: City): boolean {
        const idx = this.cities.findIndex((c) => c.id === city.id);
        if (idx >= 0) {
            this.cities[idx] = city;
        }

        const marker = this.cityMarkers.get(city.id);
        if (!marker) return false;

        const root = marker.getElement()?.querySelector('.city-image-container');
        if (!root) return false;

        const flagBodies = root.querySelectorAll<HTMLElement>('.city-flag-body');
        let flagBody: HTMLElement | null = null;
        for (const el of flagBodies) {
            const cls = el.className;
            if (cls.includes('flag-faction-') || cls.includes('flag-rebel-')) {
                flagBody = el;
                break;
            }
        }
        if (!flagBody) return false;

        const nextClass = this.resolveFlagClass(city);
        flagBody.classList.remove(...Array.from(flagBody.classList).filter(
            (c) => c.startsWith('flag-faction-') || c.startsWith('flag-rebel-'),
        ));
        flagBody.classList.add('city-flag-body', nextClass);

        this.patchFlagTextOverlay(flagBody, city);
        this.updateCityLabel(city);
        return true;
    }

    /** 旗号染色完成后，刷新该势力所有据点的字色 overlay（黑字白边 / 白字黑边） */
    public patchFactionFlagText(factionId: string): void {
        for (const city of this.cities) {
            if (city.factionId !== factionId) continue;
            const marker = this.cityMarkers.get(city.id);
            if (!marker) continue;
            const root = marker.getElement()?.querySelector('.city-image-container');
            if (!root) continue;
            const flagBodies = root.querySelectorAll<HTMLElement>('.city-flag-body');
            for (const el of flagBodies) {
                const cls = el.className;
                if (cls.includes('flag-faction-') || cls.includes('flag-rebel-')) {
                    this.patchFlagTextOverlay(el, city);
                    break;
                }
            }
        }
    }

    /** 占城后立即刷新单个据点的旗号/图标（同步，不走分块重绘） */
    public refreshCityMarker(city: City): void {
        const idx = this.cities.findIndex(c => c.id === city.id);
        if (idx >= 0) {
            this.cities[idx] = city;
        }

        const oldMarker = this.cityMarkers.get(city.id);
        const oldLabel = this.cityLabels.get(city.id);
        if (oldMarker) {
            this.layerGroup.removeLayer(oldMarker);
            this.cityMarkers.delete(city.id);
        }
        if (oldLabel) {
            this.layerGroup.removeLayer(oldLabel);
            this.cityLabels.delete(city.id);
        }

        this.renderSingleCity(city, this.layerGroup, this.cityMarkers, this.cityLabels, false);
    }

    public updateCityLabel(city: City) {
        const labelOriginal = this.cityLabels.get(city.id);
        if (labelOriginal) {
            const newIcon = L.divIcon({
                className: 'city-troop-label',
                html: TerritorySystem.buildCityLabelHtml(city),
            });
            labelOriginal.setIcon(newIcon);
        }
    }

    // Helper: Merge hexes into polygon paths
    private getMergedPaths(hexList: { q: number, r: number, key: number }[]): L.LatLng[][] {
        if (hexList.length === 0) return [];
        const segments = new Set<string>();
        const coordMap = new Map<string, { lat: number, lng: number }>();
        const pKey = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

        hexList.forEach(h => {
            const center = GridSystem.axialToLatLng(h.q, h.r);
            const corners = GridSystem.getHexagonCorners(center);
            for (let i = 0; i < 6; i++) {
                const c1 = corners[i];
                const c2 = corners[(i + 1) % 6];
                const k1 = pKey(c1.lat, c1.lng);
                const k2 = pKey(c2.lat, c2.lng);
                const forward = `${k1}|${k2}`;
                const backward = `${k2}|${k1}`;
                if (segments.has(backward)) segments.delete(backward);
                else { segments.add(forward); coordMap.set(k1, c1); coordMap.set(k2, c2); }
            }
        });

        const paths: L.LatLng[][] = [];
        const nextMap = new Map<string, string>();
        segments.forEach(seg => { const [k1, k2] = seg.split('|'); nextMap.set(k1, k2); });
        while (nextMap.size > 0) {
            const loop: L.LatLng[] = [];
            const startKey = nextMap.keys().next().value!;
            let curr = startKey;
            let safety = 0;
            while (nextMap.has(curr) && safety++ < 1000) {
                loop.push(L.latLng(coordMap.get(curr)!));
                const next = nextMap.get(curr)!;
                nextMap.delete(curr);
                curr = next;
                if (curr === startKey) break;
            }
            if (loop.length > 0) paths.push(loop);
        }
        return paths;
    }

    // [PERF] 优化：用纯色边界线替代 CSS blur 发光条，减少 GPU 复合层
    private renderFactionBorders(
        hexes: { q: number, r: number, key: number }[],
        factionId: string,
        hexOwnership: Map<number, City>,
        paneName: string,
        targetTerritoryGroup: L.LayerGroup
    ) {
        const factionBorderSegments: L.LatLng[][] = [];
        const neighborDirs = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];
        const dirToEdge: { [key: number]: [number, number] } = {
            0: [0, 1], 1: [5, 0], 2: [4, 5], 3: [3, 4], 4: [2, 3], 5: [1, 2]
        };

        hexes.forEach(h => {
            const center = GridSystem.axialToLatLng(h.q, h.r);
            const corners = GridSystem.getHexagonCorners(center);

            for (let i = 0; i < 6; i++) {
                const nq = h.q + neighborDirs[i].q;
                const nr = h.r + neighborDirs[i].r;
                const neighborKey = GridSystem.getSpatialKey(nq, nr);

                const neighborCity = hexOwnership.get(neighborKey);
                if (neighborCity && neighborCity.factionId !== factionId) {
                    const [c1Idx, c2Idx] = dirToEdge[i];
                    const c1 = corners[c1Idx];
                    const c2 = corners[c2Idx];
                    factionBorderSegments.push([L.latLng(c1), L.latLng(c2)]);
                }
            }
        });

        if (factionBorderSegments.length > 0) {
            const factionColor = this.factionManager.getFactionColor(factionId);
            // 势力色彩细线（替换原有的 CSS blur 发光多边形）
            L.polyline(factionBorderSegments, {
                color: factionColor, weight: 3, opacity: 0.5,
                lineCap: 'round', lineJoin: 'round', interactive: false, pane: paneName
            }).addTo(targetTerritoryGroup);
            // 黑色边框线（保持清晰边界）
            L.polyline(factionBorderSegments, {
                color: '#000', weight: 1.5, opacity: 1.0,
                lineCap: 'round', lineJoin: 'round', interactive: false, pane: paneName
            }).addTo(targetTerritoryGroup);
        }
    }

    private ensureFactionPane(paneName: string): void {
        const leafletMap = this.map.getLeafletMap();
        if (!leafletMap.getPane(paneName)) {
            leafletMap.createPane(paneName);
            const pane = leafletMap.getPane(paneName)!;
            pane.style.zIndex = '350';
            pane.style.opacity = '1.0';
            pane.style.pointerEvents = 'none';
        }
    }

    private updateCityScales(): void {
        const currentZoom = this.map.getLeafletMap().getZoom();
        const baseZoom = 9;
        // [USER REQUEST] Linear scaling: 9=1.0, 10=1.5, 11=2.0, 12=2.5, 13=3.0
        // [USER REQUEST] Linear scaling: 9=1.0, 8=0.5, 7=0.0
        const scale = Math.max(0, 1.0 + (currentZoom - baseZoom) * 0.5);

        this.cityMarkers.forEach(marker => {
            const element = marker.getElement();
            if (element) {
                const container = element.querySelector('.city-image-container') as HTMLElement;
                if (container) {
                    container.style.transformOrigin = '50% 50%';
                    container.style.transform = `scale(${scale})`;
                }
            }
        });
    }

    /** 按缩放档位切换图层：6 界线无势力色；7 仅势力色；8 据点+势力色；≥9 常规 */
    public applyZoomLayerVisibility(zoom: number): void {
        const leafletMap = this.map.getLeafletMap();
        const hideCities = isFactionOnlyZoom(zoom);
        const hideInfra = isMacroMapZoom(zoom);

        FACTION_ONLY_HIDDEN_PANES.forEach((paneName) => {
            const pane = leafletMap.getPane(paneName);
            if (pane) pane.style.display = hideCities ? 'none' : '';
        });

        MACRO_HIDDEN_INFRA_PANES.forEach((paneName) => {
            const pane = leafletMap.getPane(paneName);
            if (pane) pane.style.display = hideInfra ? 'none' : '';
        });
    }

    /** @deprecated 使用 applyZoomLayerVisibility */
    public setStrategicViewMode(_isStrategic: boolean): void {
        this.applyZoomLayerVisibility(this.map.getLeafletMap().getZoom());
    }

    public isMacroMapZoom(): boolean {
        return isMacroMapZoom(this.map.getLeafletMap().getZoom());
    }

    public setCityMarkersVisible(visible: boolean) {
        if (visible) {
            this.layerGroup.addTo(this.map.getLeafletMap());
        } else {
            this.layerGroup.removeFrom(this.map.getLeafletMap());
        }
    }

    // [NEW] Control City Pane Opacity & Interaction (for Road Editor)
    public setCityOpacity(opacity: number, interactable: boolean) {
        const leafMap = this.map.getLeafletMap();
        const cityPane = leafMap.getPane('cityPane');
        const labelsPane = leafMap.getPane('labelsPane');

        const opacityStr = opacity.toString();
        // [FIX] Use !important when disabling interaction to override Leaflet's internal marker styles
        const pointerEvents = interactable ? 'auto' : 'none';
        const priority = interactable ? '' : 'important';
        // [FIX] Also force cursor to crosshair when non-interactable
        const cursorValue = interactable ? 'auto' : 'crosshair';

        if (cityPane) {
            cityPane.style.opacity = opacityStr;
            cityPane.style.setProperty('pointer-events', pointerEvents, priority);
            cityPane.style.setProperty('cursor', cursorValue, priority);
            // [FIX] Also set pointer-events on ALL child elements (markers have their own divs)
            cityPane.querySelectorAll('*').forEach((el) => {
                (el as HTMLElement).style.setProperty('pointer-events', pointerEvents, priority);
            });
        }
        if (labelsPane) {
            labelsPane.style.opacity = opacityStr;
            labelsPane.style.setProperty('pointer-events', pointerEvents, priority);
            labelsPane.style.setProperty('cursor', cursorValue, priority);
            // [FIX] Also set pointer-events on ALL child elements
            labelsPane.querySelectorAll('*').forEach((el) => {
                (el as HTMLElement).style.setProperty('pointer-events', pointerEvents, priority);
            });
        }
    }

    public toggleTerritoryLayer(visible: boolean) {
        if (visible) {
            this.territoryLayerGroup.addTo(this.map.getLeafletMap());
            // [FIX] Re-apply filters because Leaflet resets DOM on re-add
            this.territoryLayerGroup.eachLayer((layer: any) => {
                const fid = layer.factionId;
                if (fid) {
                    const el = (layer as L.Polygon).getElement();
                    // [MODIFIED] Use dynamic updater instead of direct set
                    // if (el) el.setAttribute('filter', `url(#glow-${fid})`);
                }
            });
            this.updateTerritoryStyle(); // Apply correct style

        } else {
            this.territoryLayerGroup.removeFrom(this.map.getLeafletMap());
        }
    }

    // ── [PERF] 性能监控计数接口 ──

    /** 返回领土多边形数量（势力边界 + 边框） */
    public getPolygonCount(): number {
        return this.territoryLayerGroup.getLayers().length;
    }

    /** 返回城市图标标记数量 */
    public getMarkerCount(): number {
        return this.cityMarkers.size;
    }

    /** 返回城市标签数量 */
    public getLabelCount(): number {
        return this.cityLabels.size;
    }
}
