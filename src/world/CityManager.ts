import * as L from 'leaflet';
import { City } from '../types/core';
import { GameMap } from '../map/GameMap';
import { GridSystem } from '../systems/GridSystem';
import { FactionManager } from './FactionManager';
import { CITY_CONFIG, clampCityTroops } from '../config/CityConfig';
import { GameConfig } from '../config/GameConfig';
import { roadRegistry } from '../roads/RoadRegistry';
import { VECTOR_ROAD_DATA } from '../data/VectorRoadData';
import { SiegeEffectRenderer } from '../map/SiegeEffectRenderer';
import { TerritorySystem } from '../systems/TerritorySystem';
import { CityAssetManager } from '../assets/CityAssetManager';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { gameLog } from '../utils/GameLogger';
import { isMacroMapZoom } from '../config/StrategicView';

export interface CityUpdateOptions {
    skipCaptureLog?: boolean;
    /** 占城军团名（大乱斗军情用） */
    captorLegionName?: string;
}

export interface CityCapturedEvent {
    cityId: string;
    cityName: string;
    previousFactionId: string;
    newFactionId: string;
    captorLegionName?: string;
}

export class CityManager {
    private cities: City[] = [];
    private map: GameMap;
    private factionManager: FactionManager;
    private territorySystem: TerritorySystem;
    private siegeEffectRenderer: SiegeEffectRenderer;

    // Callbacks
    private onCityUpdatedCallback: (() => void) | null = null;
    private onCityCapturedCallback: ((event: CityCapturedEvent) => void) | null = null;

    // Debounce for deferred rendering
    private pendingRenderFrame: number | null = null;
    private territoryRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingIncrementalSeeds: { cityId: string; oldFactionId?: string }[] = [];
    /** 占城等合并为一次领土重绘，避免连续 1s 冻结 */
    private static readonly TERRITORY_REFRESH_DEBOUNCE_MS = 350;

    /**
     * 与地图面板 `chk-faction`（开启势力区域显示）一致，默认 false。
     * 为 false 时不跑全图领土 BFS。详见 AGENTS.md 第十节。
     */
    private territoryLayerVisible = false;

    // [NEW] Visual History State
    private currentYear: number = 0;
    private isEditorMode: boolean = false;

    constructor(map: GameMap, factionManager: FactionManager) {
        this.map = map;
        this.factionManager = factionManager;

        // Initialize Sub-Systems
        this.territorySystem = new TerritorySystem(map, factionManager);
        this.siegeEffectRenderer = new SiegeEffectRenderer(map);

        const leafletMap = this.map.getLeafletMap();
        const onStrategicZoom = () => this.applyStrategicMapView(leafletMap.getZoom());
        leafletMap.on('zoom', onStrategicZoom);
        leafletMap.on('zoomend', onStrategicZoom);
    }

    /**
     * zoom ≤ 7：仅势力色；zoom 8：据点 + 势力色；均隐藏军队/道路/河流。
     * zoom ≥ 9 恢复 chk-faction 对应的势力层开关。
     */
    private applyStrategicMapView(zoom: number): void {
        this.territorySystem.applyZoomLayerVisibility(zoom);

        if (isMacroMapZoom(zoom)) {
            this.siegeEffectRenderer.stopAll();
            this.territorySystem.toggleTerritoryLayer(true);
            if (this.territorySystem.getPolygonCount() === 0 && this.cities.length > 0) {
                void this.renderTerritoryOnly();
            }
        } else {
            this.territorySystem.toggleTerritoryLayer(this.territoryLayerVisible);
        }
    }

    // Proxy Methods for TerritorySystem
    public setOnCityClick(callback: (city: City, e: L.LeafletMouseEvent) => void): void {
        this.territorySystem.onCityClick = callback;
        // Re-bind clicks if needed (usually handled by update, but safe to trigger)
    }

    public setCityMarkersVisible(visible: boolean): void {
        this.territorySystem.setCityMarkersVisible(visible);
    }

    public setCityOpacity(opacity: number, interactable: boolean): void {
        this.territorySystem.setCityOpacity(opacity, interactable);
    }

    public toggleTerritoryLayer(visible: boolean): void {
        this.territoryLayerVisible = visible;
        this.territorySystem.toggleTerritoryLayer(visible);
        if (visible && this.territorySystem.getPolygonCount() === 0 && this.cities.length > 0) {
            void this.renderTerritoryOnly();
        }
    }

    public isTerritoryLayerVisible(): boolean {
        return this.territoryLayerVisible;
    }

    /** 按当前缩放同步战略视图（启动或外部改 zoom 后调用） */
    public syncStrategicMapView(): void {
        this.applyStrategicMapView(this.map.getLeafletMap().getZoom());
    }

    /** 叛军 52 面旗加载完成后，刷新已渲染 panjun 据点的 flag-rebel-* class */
    public refreshPanjunRebelFlagMarkers(): void {
        CityAssetManager.resetRebelFlagAssignments();
        for (const city of this.cities) {
            if (city.factionId !== 'panjun') continue;
            if (!this.territorySystem.hasCityMarker(city.id)) continue;
            this.territorySystem.patchCityMarkerFaction(city);
        }
    }

    public toggleCityTextures(visible: boolean): void {
        this.territorySystem.toggleCityTextures(visible);
    }

    public setOnCityUpdated(callback: () => void): void {
        this.onCityUpdatedCallback = callback;
    }

    public setOnCityCaptured(callback: ((event: CityCapturedEvent) => void) | null): void {
        this.onCityCapturedCallback = callback;
    }

    // [NEW] History & Editor Logic
    public updateYear(year: number): void {
        if (this.currentYear !== year) {
            this.currentYear = year;
            this.requestRender();
        }
    }

    public setEditorMode(enabled: boolean): void {
        this.isEditorMode = enabled;
        this.requestRender(); // Re-render to show/hide ghosts
    }

    public getIsEditorMode(): boolean {
        return this.isEditorMode;
    }

    public isCityVisible(city: City): boolean {
        // 1. Editor Mode: Always visible
        if (this.isEditorMode) return true;

        // 2. Default: Visible if no dates defined
        if (city.startYear === undefined && city.endYear === undefined) return true;

        // 3. Check Start Year - [DISABLED] Show all strongholds as requested
        // if (city.startYear !== undefined && this.currentYear < city.startYear) {
        //     console.log(`[DEBUG] City ${city.name} HIDDEN: Year ${this.currentYear} < startYear ${city.startYear}`);
        //     return false;
        // }

        // 4. Check End Year
        if (city.endYear !== undefined && this.currentYear > city.endYear) {
            console.log(`[DEBUG] City ${city.name} HIDDEN: Year ${this.currentYear} > endYear ${city.endYear}`);
            return false;
        }

        return true;
    }

    public isCityGhost(city: City): boolean {
        // Only makes sense in Editor Mode: "Ghost" if it WOULD be hidden normally
        if (!this.isEditorMode) return false;

        // Check normal visibility rules
        if (city.startYear !== undefined && this.currentYear < city.startYear) return true;
        if (city.endYear !== undefined && this.currentYear > city.endYear) return true;

        return false;
    }

    // CRUD & Logic
    public addCity(city: City): void {
        city.troops = clampCityTroops(city.type, city.troops || 0);
        this.cities.push(city);
        this.requestRender();
    }

    public addCities(cities: City[]): void {
        for (const city of cities) {
            city.troops = clampCityTroops(city.type, city.troops || 0);
        }
        this.cities.push(...cities);
        this.requestRender();
    }

    public removeCity(cityId: string): void {
        const index = this.cities.findIndex(c => c.id === cityId);
        if (index !== -1) {
            this.cities.splice(index, 1);
            this.requestRender();
            // 连带删除关联的道路
            this.removeAssociatedRoads(cityId);
        }
    }

    /**
     * 删除与指定城市关联的所有道路（城市被删除时自动清理）
     */
    public removeAssociatedRoads(cityId: string): void {
        const roadsToDelete: string[] = [];
        for (const feature of VECTOR_ROAD_DATA.features) {
            if (!feature || !feature.properties) continue;
            const props = feature.properties;
            if (props.startConnection === cityId || props.endConnection === cityId) {
                roadsToDelete.push(props.id);
            }
        }
        for (const roadId of roadsToDelete) {
            console.log(`🗑️ [CityManager] 删除与城市 ${cityId} 关联的道路: ${roadId}`);
            roadRegistry.removeVectorRoad(roadId);
        }
        if (roadsToDelete.length > 0) {
            console.log(`🗑️ [CityManager] 共删除 ${roadsToDelete.length} 条与城市 ${cityId} 关联的道路`);
        }
    }

    /** 合并短时间内的多次全图领土重绘请求（乱斗占城主因） */
    private scheduleTerritoryRefresh(): void {
        if (this.territoryRefreshTimer !== null) {
            clearTimeout(this.territoryRefreshTimer);
        }
        this.territoryRefreshTimer = setTimeout(() => {
            this.territoryRefreshTimer = null;
            this.flushTerritoryRefresh();
        }, CityManager.TERRITORY_REFRESH_DEBOUNCE_MS);
    }

    /** 占城后增量领土更新（防抖合并） */
    private scheduleTerritoryIncremental(cityId: string, oldFactionId?: string): void {
        if (!this.territoryLayerVisible) return;
        this.pendingIncrementalSeeds.push({ cityId, oldFactionId });
        if (this.territoryRefreshTimer !== null) {
            clearTimeout(this.territoryRefreshTimer);
        }
        this.territoryRefreshTimer = setTimeout(() => {
            this.territoryRefreshTimer = null;
            void this.flushTerritoryRefresh();
        }, CityManager.TERRITORY_REFRESH_DEBOUNCE_MS);
    }

    /** 立即排队领土重绘（启动全图 / 编辑器批量改城） */
    public flushTerritoryRefresh(): void {
        if (this.territoryRefreshTimer !== null) {
            clearTimeout(this.territoryRefreshTimer);
            this.territoryRefreshTimer = null;
        }
        if (this.pendingRenderFrame !== null) {
            cancelAnimationFrame(this.pendingRenderFrame);
        }
        this.pendingRenderFrame = requestAnimationFrame(() => {
            this.pendingRenderFrame = null;
            if (!this.territoryLayerVisible) {
                void this.renderCitiesOnly();
                return;
            }
            const seeds = this.pendingIncrementalSeeds;
            this.pendingIncrementalSeeds = [];
            if (seeds.length > 0 && this.territorySystem.canIncrementalUpdate()) {
                void this.renderTerritoryIncremental(seeds);
            } else if (this.territorySystem.getMarkerCount() > 0) {
                void this.renderTerritoryOnly();
            } else {
                void this.renderAllCities();
            }
        });
    }

    private async renderTerritoryIncremental(
        seeds: { cityId: string; oldFactionId?: string }[]
    ): Promise<void> {
        const t0 = performance.now();
        const cityIds = [...new Set(seeds.map((s) => s.cityId))];
        const oldFactions = [...new Set(seeds.map((s) => s.oldFactionId).filter(Boolean) as string[])];
        const visibleCities = this.cities.filter((city) => this.isCityVisible(city));
        await this.territorySystem.updateIncremental(
            cityIds,
            (city) => this.isCityGhost(city),
            oldFactions,
            visibleCities
        );
        const elapsed = performance.now() - t0;
        const perf = PerformanceMonitor.getInstance();
        perf.noteAsyncWork('territoryBFS', elapsed);
        perf.noteAsyncWork('territoryBFSIncremental', elapsed);
    }

    private requestRender(): void {
        this.pendingIncrementalSeeds = [];
        this.scheduleTerritoryRefresh();
    }

    private viewportCitySyncBound = false;

    /** 拖图后补画视口内据点；首次拖图解锁全图旗号 deferred */
    public bindViewportCitySync(): void {
        if (this.viewportCitySyncBound) return;
        const leaflet = this.map.getLeafletMap();
        leaflet.on('moveend', () => {
            void this.syncViewportCities();
            // 镜头跟随用 setView 不会触发 dragend，moveend 也需解锁全图 deferred
            CityAssetManager.unlockDeferredFlagDrain();
        });
        leaflet.on('dragend', () => {
            CityAssetManager.unlockDeferredFlagDrain();
        });
        this.viewportCitySyncBound = true;
    }

    private getCitiesInMapViewport(): City[] {
        const bounds = this.map.getLeafletMap().getBounds();
        return this.cities.filter(
            (city) =>
                this.isCityVisible(city) &&
                bounds.contains([city.latitude, city.longitude]),
        );
    }

    /** 启动优先：仅当前视口据点；不拖图则不画远处 */
    public async renderCitiesOnly(): Promise<void> {
        const viewportCities = this.getCitiesInMapViewport();
        await this.territorySystem.renderCitiesOnly(viewportCities, (city) => this.isCityGhost(city));
    }

    private async syncViewportCities(): Promise<void> {
        const viewportCities = this.getCitiesInMapViewport();
        await this.territorySystem.appendCityMarkers(viewportCities, (city) => this.isCityGhost(city));
        CityAssetManager.notifyMapInteraction();
    }

    /** 仅重绘领土（据点层已存在时使用） */
    public async renderTerritoryOnly(): Promise<void> {
        const t0 = performance.now();
        const visibleCities = this.cities.filter((city) => this.isCityVisible(city));
        await this.territorySystem.updateTerritoryOnly(visibleCities, (city) => this.isCityGhost(city));
        const elapsed = performance.now() - t0;
        const perf = PerformanceMonitor.getInstance();
        perf.noteAsyncWork('territoryRender', elapsed);
        perf.noteAsyncWork('territoryBFS', elapsed);
        perf.noteAsyncWork('territoryBFSFull', elapsed);
    }

    public async renderAllCities(): Promise<void> {
        const t0 = performance.now();
        // [NEW] Filter cities based on visibility
        const visibleCities = this.cities.filter(city => this.isCityVisible(city));

        // Pass "ghost" status via runtime property injection (or modify TerritorySystem)
        // For now, let's inject a temporary property if needed, or better:
        // Update TerritorySystem to accept a predicate or status map.
        // Quickest way: Map cities to include a _ghost flag if supported, 
        // OR just pass the full list to TerritorySystem and let it ask CityManager (dependency loop risk).
        // Let's modify visibleCities to include ghosts (implied by isCityVisible in Editor Mode)

        // We need to tell TerritorySystem which ones are ghosts.
        // Let's attach metadata to the array or objects? No, risky.
        // Let's rely on TerritorySystem checking `CityManager`? TerritorySystem has reference to FacitonManager not CityManager.

        // Current Plan: Pass ALL visible cities (including ghosts). 
        // NOTE: TerritorySystem needs modification to handle opacity based on date.
        // I will assume TerritorySystem draws them opaque for now, will fix opacity in next step.

        await this.territorySystem.update(visibleCities, (city) => this.isCityGhost(city));
        const elapsed = performance.now() - t0;
        const perf = PerformanceMonitor.getInstance();
        perf.noteAsyncWork('territoryRender', elapsed);
        perf.noteAsyncWork('territoryBFS', elapsed);
        perf.noteAsyncWork('territoryBFSFull', elapsed);
    }

    public refreshAll(): void {
        this.requestRender();
    }

    // [PERF] Expose territory system for performance monitoring
    public getTerritorySystem(): TerritorySystem {
        return this.territorySystem;
    }

    // Proxy for TerritorySystem label updates
    public updateCityLabel(cityId: string): void {
        const city = this.getCity(cityId);
        if (!city) return;
        const t0 = performance.now();
        this.territorySystem.updateCityLabel(city);
        PerformanceMonitor.getInstance().noteAsyncWork('cityLabel', performance.now() - t0);
    }

    // Game Logic
    public updateTroops(): void {
        this.cities.forEach(city => {
            const config = CITY_CONFIG[city.type];
            if (!config || city.factionId === 'panjun') return;

            const growth = Math.floor(config.maxTroops * config.growthRate);
            if (city.troops < config.maxTroops) {
                city.troops = clampCityTroops(city.type, city.troops + growth);
                this.territorySystem.updateCityLabel(city);
            }
        });
    }

    public updateCity(
        id: string,
        data: Partial<City>,
        options?: CityUpdateOptions
    ): void {
        const cityIndex = this.cities.findIndex(c => c.id === id);
        if (cityIndex !== -1) {
            const oldCity = this.cities[cityIndex];
            this.cities[cityIndex] = { ...oldCity, ...data };
            const updatedCity = this.cities[cityIndex];

            if ('troops' in data || 'type' in data) {
                updatedCity.troops = clampCityTroops(updatedCity.type, updatedCity.troops || 0);
            }

            const visualProps = ['factionId', 'type', 'name', 'image', 'mirror', 'latitude', 'longitude'];
            const needsFullRender = visualProps.some(prop => prop in data);

            // [NEW] Trigger Capture Effect if faction changed
            if (data.factionId && data.factionId !== oldCity.factionId) {
                if (!options?.skipCaptureLog) {
                    gameLog('world', `[CityManager] City ${oldCity.name} captured by ${data.factionId}! Playing effect.`);
                }
                const color = this.factionManager.getFactionColor(data.factionId);

                this.map.getCityCaptureRenderer()?.playCaptureEffect(oldCity.latitude, oldCity.longitude, color);

                // 旗号立即刷新（全图分块重绘有竞态，会偶发不更新）
                void this.applyFactionChangeVisual(updatedCity, oldCity.factionId);

                if (this.onCityCapturedCallback) {
                    this.onCityCapturedCallback({
                        cityId: id,
                        cityName: oldCity.name,
                        previousFactionId: oldCity.factionId,
                        newFactionId: data.factionId,
                        captorLegionName: options?.captorLegionName,
                    });
                }
            } else if (needsFullRender) {
                this.requestRender();
            } else if ('troops' in data) {
                this.territorySystem.updateCityLabel(updatedCity);
            }

            if (this.onCityUpdatedCallback) this.onCityUpdatedCallback();
        } else {
            console.warn('⚠️ [CityManager] City not found:', id);
        }
    }

    /** 占城后：取消过期重绘 → 补载旗号 CSS → 轻量 patch（失败则全量 refresh） */
    private async applyFactionChangeVisual(city: City, previousFactionId?: string): Promise<void> {
        const t0 = performance.now();
        this.territorySystem.cancelPendingRender();
        await CityAssetManager.ensureFactionFlag(city.factionId);

        if (!this.territorySystem.patchCityMarkerFaction(city)) {
            this.territorySystem.refreshCityMarker(city);
            this.territorySystem.updateCityLabel(city);
        }

        const cityRef = city;
        CityAssetManager.whenFactionFlagReady(city.factionId, () => {
            this.territorySystem.patchCityMarkerFaction(cityRef);
        });

        this.scheduleTerritoryIncremental(city.id, previousFactionId);
        PerformanceMonitor.getInstance().noteAsyncWork('cityFactionChange', performance.now() - t0);
    }

    public getCity(id: string): City | undefined {
        return this.cities.find(c => c.id === id);
    }

    public getCityById(id: string): City | undefined {
        return this.getCity(id);
    }

    public getCities(): City[] {
        return [...this.cities];
    }

    public getCitiesByFaction(factionId: string): City[] {
        return this.cities.filter(c => c.factionId === factionId);
    }

    /**
     * @deprecated Use getNearestCity(null, targetPos) instead.
     */
    public getClosestCity(targetPos: { latitude: number; longitude: number }): City | null {
        return this.getNearestCity(null, targetPos);
    }

    public getNearestCity(factionId: string | null, targetPos: { latitude: number; longitude: number }): City | null {
        let nearest: City | null = null;
        let minDist = Infinity;

        this.cities.forEach(city => {
            if (factionId === null || city.factionId === factionId) {
                const avgLatRad = (city.latitude + targetPos.latitude) / 2 * (Math.PI / 180);
                const dLat = city.latitude - targetPos.latitude;
                const dLon = (city.longitude - targetPos.longitude) * Math.cos(avgLatRad);
                const dist = dLat * dLat + dLon * dLon;

                if (dist < minDist) {
                    minDist = dist;
                    nearest = city;
                }
            }
        });
        return nearest;
    }

    public getFactionTotalTroops(factionId: string): number {
        return this.cities
            .filter(c => c.factionId === factionId)
            .reduce((sum, c) => sum + c.troops, 0);
    }

    public getFactionName(factionId: string): string {
        return this.factionManager.getFactionName(factionId);
    }

    public recruitTroopsFromFaction(factionId: string, requiredAmount: number, autoFill: boolean = false): number {
        const cities = this.cities.filter(c => c.factionId === factionId);
        if (cities.length === 0) return 0;

        // 1. Calculate total available excess troops (above 1000)
        let totalExcess = 0;
        const capableCities: City[] = [];

        cities.forEach(c => {
            const excess = Math.max(0, c.troops - GameConfig.CITY.MIN_GARRISON);
            if (excess > 0) {
                totalExcess += excess;
                capableCities.push(c);
            }
        });

        // 2. Determine actual recruit amount
        let actualRecruit = requiredAmount;
        if (totalExcess < requiredAmount) {
            if (autoFill) {
                actualRecruit = requiredAmount;
            } else {
                actualRecruit = totalExcess; // Strict limit
            }
        }

        if (actualRecruit <= 0) return 0;

        // 3. Distribute the cost
        let amountToDeduct = Math.min(actualRecruit, totalExcess);
        let remainingToDeduct = amountToDeduct;

        while (remainingToDeduct > 0.1 && capableCities.length > 0) {
            const amountPerCity = remainingToDeduct / capableCities.length;
            for (let i = capableCities.length - 1; i >= 0; i--) {
                const city = capableCities[i];
                const available = city.troops - GameConfig.CITY.MIN_GARRISON;

                if (available <= amountPerCity) {
                    city.troops -= available;
                    remainingToDeduct -= available;
                    capableCities.splice(i, 1);
                    this.territorySystem.updateCityLabel(city);
                } else {
                    city.troops -= amountPerCity;
                    remainingToDeduct -= amountPerCity;
                    this.territorySystem.updateCityLabel(city);
                }
            }
        }
        return Math.floor(actualRecruit);
    }

    public addTroops(cityId: string, amount: number): void {
        const city = this.getCity(cityId);
        if (city) {
            city.troops = clampCityTroops(city.type, city.troops + amount);
            this.territorySystem.updateCityLabel(city);
        }
    }

    // Siege Effects
    public playSiegeEffect(
        cityId: string,
        getAttackerPos?: () => { lat: number; lng: number } | null | undefined
    ): void {
        const city = this.getCity(cityId);
        if (city) {
            this.siegeEffectRenderer.playEffect(
                cityId,
                { lat: city.latitude, lng: city.longitude },
                city.type,
                getAttackerPos
            );
        }
    }

    public stopSiegeEffect(cityId: string): void {
        this.siegeEffectRenderer.stopEffect(cityId);
    }

    // Road / Path Utils
    public getConnectedCities(cityId: string): City[] {
        const connectedIds = roadRegistry.getConnectedCities(cityId);
        return connectedIds
            .map((id: string) => this.getCityById(id))
            .filter((c: City | undefined): c is City => c !== undefined);
    }

    public findPath(startId: string, endId: string): City[] | null {
        const cityIds = roadRegistry.findCityPath(startId, endId);
        if (!cityIds) return null;
        return cityIds
            .map((id: string) => this.getCityById(id))
            .filter((c: City | undefined): c is City => c !== undefined);
    }

    // Deprecated but kept for API compatibility if needed
    public refreshConnections(): void {
        this.requestRender();
    }
}
