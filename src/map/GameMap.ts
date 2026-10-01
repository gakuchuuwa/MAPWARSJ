import L from 'leaflet';
import { GameConfig } from '../config/GameConfig';

import { TILE_CONFIG, tileToLatLng } from './TileMapConfig';
import { HillshadeLayer } from './HillshadeLayer';
import { RiverOverlayLayer } from './RiverOverlayLayer';
import { VectorRiverLayer } from './VectorRiverLayer';
import { setStrategicRiverProximityData } from './StrategicRiverProximity';
import { buildRiverSegments } from './RiverStripData';
import { StrategicGridLayer } from './StrategicGridLayer';
import { RegionBoundaryLayer } from './RegionBoundaryLayer';
import { CityCaptureRenderer } from './CityCaptureRenderer';
import { MonumentLayer } from './MonumentLayer';
import { BattlefieldLayer } from './BattlefieldLayer';
import { CITIES_V2 } from '../data/cities_v2';
import { BATTLEFIELDS } from '../data/Battlefields';
import { VegetationLayer } from './VegetationLayer';
import { MarineLifeLayer, registerMarineLifeLayer } from './MarineLifeLayer';
import { setAnimalAmbientLayerVisible, setLandAnimalVisible, setFlyingAnimalVisible } from './AnimalAmbientLayer';
import { setTradeTrafficLayerVisible } from './TradeTrafficLayer';
import { isMacroMapZoom } from '../config/StrategicView';
import { gameLog } from '../utils/GameLogger';

/**
 * [PERF 2026-08-29 主人授权] viewBox 式缩放优化：Leaflet 在 zoomend 对渲染器里每条 path 做
 * 同步 _project（河流 2910 条，实测 ~200ms 阻塞，是缩放"一顿"的主因）。
 * 改为分片到多帧（每帧 200 条），避免一次性冻结主线程。
 * 视觉：缩放停稳后一瞬河流仍处 transform 缩放（略糊），逐批重投影完即清晰，整体更顺。
 * 少量 path（≤150）仍走原同步路径，不改变小图层行为。
 */
let _zoomSliceInstalled = false;
let _zoomSliceJob = 0;
function installZoomProjectSlicing(): void {
    if (_zoomSliceInstalled) return;
    _zoomSliceInstalled = true;
    const RendererProto = (L as any).Renderer.prototype;
    const origOnZoomEnd = RendererProto._onZoomEnd;
    RendererProto._onZoomEnd = function (this: any) {
        const ids = Object.keys(this._layers || {});
        if (ids.length <= 150) {
            return origOnZoomEnd.call(this);
        }
        const jobId = ++_zoomSliceJob;
        let i = 0;
        const BATCH = 200;
        const step = () => {
            if (jobId !== _zoomSliceJob) return;
            const end = Math.min(i + BATCH, ids.length);
            for (; i < end; i++) {
                const layer = this._layers[ids[i]];
                if (layer && layer._project) layer._project();
            }
            if (i < ids.length) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
}

/**
 * 🔴 [2026-09-17 修] 消除 Chromium / WebKit 在非整数缩放（如 125%/150%）及亚像素位移下的瓦片接缝。
 * 原理：Leaflet 以 256px 瓦片排布，在非 1.0 的 devicePixelRatio 或带小数的 transform 变换下，
 * 邻接瓦片边缘会在 GPU 光栅化时因亚像素舍入产生 0.5~1px 的透明间隙，导致底色（#6395b8）透出形成网格方框。
 * 瓦片尺寸微扩 0.5px（相当于 0.2% 重叠）可严密封堵接缝，且肉眼完全无形变失真。
 */
let _tileSeamPatchInstalled = false;
function installTileSeamFix(): void {
    if (_tileSeamPatchInstalled) return;
    _tileSeamPatchInstalled = true;
    const GridLayerProto = (L as any).GridLayer.prototype;
    const origInitTile = GridLayerProto._initTile;
    GridLayerProto._initTile = function (this: any, tile: HTMLElement) {
        origInitTile.call(this, tile);
        const size = this.getTileSize();
        tile.style.width = (size.x + 0.5) + 'px';
        tile.style.height = (size.y + 0.5) + 'px';
    };
}

export class GameMap {
    private map: L.Map;
    private containerId: string;
    private currentTileLayer: L.TileLayer | null = null;
    /** 全球总览底图只在 zoom 2–7 生效；8/9/10 继续使用原有本地模式。 */
    private globalOverviewLayer: L.TileLayer | null = null;
    private zoom11TileLayer: L.TileLayer | null = null; // [NEW] Track 2nd layer
    private currentSourceKey: string = 'LOCAL';
    private hillshadeLayer: HillshadeLayer | null = null;
    private riverLayer: RiverOverlayLayer | null = null;
    private vectorRiverLayer: VectorRiverLayer | null = null;
    private monumentLayer: MonumentLayer | null = null;
    /** 🔴 [2026-09-12 主人定] 战场图层（战场不是据点，是独立地名，类似奇观） */
    private battlefieldLayer: BattlefieldLayer | null = null;
    private vegetationLayer: VegetationLayer | null = null;
    private marineLifeLayer: MarineLifeLayer | null = null;
    private cityCaptureRenderer: CityCaptureRenderer | null = null;
    private searchCoordMarker: L.Marker | null = null;
    private isVectorRiverEnabled: boolean = true; // [FIX] Track explicit enabled state
    private useGCJ02: boolean = true; // [NEW] Default to true for offset logic
    private currentYear: number = -236; // [NEW] Track year for temporal filtering
    /** 山体 zoom：单级立刻 apply；连滚 250ms 内合并，停稳再对齐最终级（同 zoom 不 redraw） */
    private hillshadeZoomDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    private hillshadeZoomBurstActive = false;
    private lastHillshadeAppliedZoom: number | null = null;
    private static readonly HILLSHADE_ZOOM_DEBOUNCE_MS = 250;
    /**
     * 河流用 GCJ-02 偏移组的最大 zoom（超过则用 WGS-84 原始组）。
     *
     * [PERF 2026-07-27] 原值 9 —— 而行军是 9、战斗是 10，**每一次战斗切换都正好跨过这条分界**，
     * 触发 VectorRiverLayer 整层换组：clearLayers + addLayer 让 Leaflet 把每条河的每个顶点
     * 重新投影并重建 SVG 路径。探针实测这一下 792ms（换组 327ms + 两组重设样式 465ms），
     * 就是"缩放一瞬间卡"的主因。
     *
     * 改为 12 后 8/9/10/11 全用同一组，热路径不再换组。
     * 底图是 Google 中国地形图（GCJ-02），所以偏移组才是对齐正确的那一组。
     * 若觉得 zoom 10+ 的河流位置变了不好看，把这里改回 9 即可复原（代价是卡顿回来）。
     */
    private static readonly RIVER_OFFSET_MAX_ZOOM = 12;
    private hillshadePrefetchTimer: ReturnType<typeof setTimeout> | null = null;
    /** 预取要等镜头稳下来再发，别和当前层级的可见瓦片抢同一个域的连接 */
    private static readonly HILLSHADE_PREFETCH_DELAY_MS = 2500;

    constructor(containerId: string) {
        this.containerId = containerId;

        const { lat, lng } = TILE_CONFIG.MAP_CENTER;

        const { xMin, xMax, yMin, yMax } = TILE_CONFIG.COVERAGE_BOUNDS[9];
        const southWest = tileToLatLng(xMin, yMax, 9);
        const northEast = tileToLatLng(xMax, yMin, 9);

        // 初始化
        this.map = L.map(containerId, {
            center: [lat, lng],
            zoom: 9, // 🔴 [2026-09-24 主人定] 开局一律 ZOOM9（原 8）
            minZoom: TILE_CONFIG.MIN_ZOOM,
            maxZoom: 13, // [UPDATE] Detailed view enabled
            zoomSnap: 1,
            zoomDelta: 1,
            zoomControl: false,
            attributionControl: false,
            doubleClickZoom: false // [FIX] 禁用双击放大
        });

        installZoomProjectSlicing();
        installTileSeamFix();

        const applyHillshadeForZoom = () => {
            if (!this.hillshadeLayer) return;
            const zoom = this.map.getZoom();
            // 同级再调（单级 trailing）→ setParams 本也不 redraw；此处直接跳过，避免无意义日志/UI 写
            if (this.lastHillshadeAppliedZoom === zoom) return;

            const targetZ = this.getZFactor(zoom);
            const targetAlt = this.getAltitude(zoom);
            const targetOpacity = this.getShadowOpacity(zoom);

            this.hillshadeLayer.setParams({ zFactor: targetZ, altitude: targetAlt, shadowOpacity: targetOpacity });
            this.lastHillshadeAppliedZoom = zoom;

            const rngZ = document.getElementById('rng-z') as HTMLInputElement;
            const valZ = document.getElementById('val-z');
            if (rngZ) rngZ.value = targetZ.toFixed(1);
            if (valZ) valZ.innerText = targetZ.toFixed(1);

            const rngA = document.getElementById('rng-a') as HTMLInputElement;
            const valA = document.getElementById('val-a');
            if (rngA) rngA.value = targetAlt.toString();
            if (valA) valA.innerText = targetAlt + '°';

            const rngO = document.getElementById('rng-o') as HTMLInputElement;
            const valO = document.getElementById('val-o');
            if (rngO) rngO.value = targetOpacity.toFixed(1);
            if (valO) valO.innerText = Math.round(targetOpacity * 100) + '%';

            console.log(`🏔️ Auto-adjusted Hillshade (Zoom:${zoom}) Z=${targetZ} Alt=${targetAlt}° Opacity=${targetOpacity}`);
        };

        // 领先立刻 + 拖尾合并：单级不在 250ms 后再炸一次；连滚只在首击与停稳各最多一次 redraw
        const updateZFactor = () => {
            if (!this.hillshadeZoomBurstActive) {
                this.hillshadeZoomBurstActive = true;
                applyHillshadeForZoom();
            }
            if (this.hillshadeZoomDebounceTimer != null) {
                clearTimeout(this.hillshadeZoomDebounceTimer);
            }
            this.hillshadeZoomDebounceTimer = setTimeout(() => {
                this.hillshadeZoomDebounceTimer = null;
                this.hillshadeZoomBurstActive = false;
                applyHillshadeForZoom(); // 连滚最终级；若与领先时同 zoom 则内部直接 return
            }, GameMap.HILLSHADE_ZOOM_DEBOUNCE_MS);
        };

        this.map.on('zoomend', () => {
            updateZFactor();
            // 后台预取相邻 zoom 的高程数据：延后到镜头稳定，避免和当前层级的可见瓦片抢连接
            if (this.hillshadePrefetchTimer != null) clearTimeout(this.hillshadePrefetchTimer);
            this.hillshadePrefetchTimer = setTimeout(() => {
                this.hillshadePrefetchTimer = null;
                this.hillshadeLayer?.prefetchAdjacentZoom(this.map.getZoom(), this.map);
            }, GameMap.HILLSHADE_PREFETCH_DELAY_MS);
        });

        // 缩放控件已并入左下 #game-time-hud（GameTimeHUD）

        // 默认加载源
        const initialSource = (TILE_CONFIG as any).ACTIVE_SOURCE || 'LOCAL';
        this.setMapSource(initialSource);

        setTimeout(() => {
            this.map.invalidateSize();
        }, 300);

        // [FIX] 创建专用河流图层 Pane，确保在山体之上
        this.map.createPane('riverPane');
        const riverPane = this.map.getPane('riverPane');
        if (riverPane) {
            riverPane.style.zIndex = '340'; // 低于领土(350)和城市(610)
        }

        // [USER REQUEST] 创建矢量河流 Pane，位于 ESRI 河流之下
        this.map.createPane('vectorRiverPane');
        const vectorRiverPane = this.map.getPane('vectorRiverPane');
        if (vectorRiverPane) {
            vectorRiverPane.style.zIndex = '335'; // 低于 riverPane(340)
            vectorRiverPane.style.opacity = '1.0';
            vectorRiverPane.style.filter = '';
        }



        this.vegetationLayer = new VegetationLayer(this.map);
        this.marineLifeLayer = new MarineLifeLayer().addTo(this.map);
        registerMarineLifeLayer(this.marineLifeLayer);

        if (import.meta.env.DEV) {
            this.addStyleControl();
        } else {
            this.applyProductionMapDefaults();
        }

        // 默认开启河流和山体（本地开发时同步侧栏勾选状态）
        if (import.meta.env.DEV && this.currentSourceKey === 'LOCAL') {
            this.applyDefaultMapVisuals(true);
        }

        // [NEW] Initialize City Capture Renderer
        this.cityCaptureRenderer = new CityCaptureRenderer(this);
        // [NEW] Initialize Wilderness Monument Layer (29 Historical Sites)
        this.monumentLayer = new MonumentLayer(this.map);
        // 🔴 [2026-09-12 主人定] 战场图层：战场独立于据点体系（一个地名而已，类似奇观）
        this.battlefieldLayer = new BattlefieldLayer(this.map);
        // 文化区界城环线（仅 zoom=6 显示）
        new RegionBoundaryLayer(this.map);

        // [USER REQUEST] WSAD 移动地图
        this.initKeyboardNavigation();
    }

    /** 战场图层（供 GameApp 注入 TerritorySystem，把攻城战战场画成据点样式） */
    public getMonumentLayer(): MonumentLayer | null {
        return this.monumentLayer;
    }

    public getBattlefieldLayer(): BattlefieldLayer | null {
        return this.battlefieldLayer;
    }

    /** 线上部署：无右侧 Leaflet 面板，仍启用与开发版相同的默认图层 */
    private applyProductionMapDefaults(): void {
        this.applyDefaultMapVisuals(false);
        window.dispatchEvent(new CustomEvent('toggle-road-layer', { detail: { visible: false } }));
        window.dispatchEvent(new CustomEvent('toggle-city-texture', { detail: { visible: true } }));
    }

    /** 河流/山体/海拔着色/美术滤镜（与侧栏默认勾选一致） */
    private applyDefaultMapVisuals(syncSidebarCheckboxes: boolean): void {
        if (this.currentSourceKey !== 'LOCAL') return;

        this.toggleRiver(true);
        this.toggleHillshade(true);
        // 🔴 [2026-08-31 修「战略地图植被一直不显示」] 原来这里写死 false，
        //    VegetationLayer 的 `visible` 初值也是 false —— 也就是说植被层**从来没被打开过**，
        //    只有 DEV 侧栏手动勾 chk-tree 才看得见，线上更是永远看不到。
        //    植被本身是好的（战略/战术已统一走 world-base 真实气候），缺的只是这一下开关。
        this.toggleTree(true);

        if (this.hillshadeLayer) {
            const initialZ = this.getZFactor(this.map.getZoom());
            this.hillshadeLayer.setParams({
                useElevationColor: true,
                zFactor: initialZ
            });
        }

        const pane = this.map.getPane('tilePane');
        if (pane) {
            pane.style.filter = 'sepia(8%) saturate(104%) contrast(104%) brightness(98%)';
        }

        if (!syncSidebarCheckboxes) return;

        const chkHillshade = document.getElementById('chk-hillshade') as HTMLInputElement;
        if (chkHillshade) {
            chkHillshade.checked = true;
            const controls = document.getElementById('hillshade-controls');
            if (controls) controls.style.display = 'flex';
        }
        const chkElevColor = document.getElementById('chk-elev-color') as HTMLInputElement;
        if (chkElevColor) chkElevColor.checked = true;
        const chkTree = document.getElementById('chk-tree') as HTMLInputElement;
        if (chkTree) chkTree.checked = true;   // 与 applyDefaultMapVisuals 的默认开启保持一致
        if (this.hillshadeLayer) {
            const initialZ = this.getZFactor(this.map.getZoom());
            const rngZ = document.getElementById('rng-z') as HTMLInputElement;
            const valZ = document.getElementById('val-z');
            if (rngZ) rngZ.value = initialZ.toFixed(1);
            if (valZ) valZ.innerText = initialZ.toFixed(1);
        }
    }

    private getZFactor(zoom: number): number {
        if (zoom <= 7) return 15.0;
        // 战略视图统一强度，保留山脊起伏并避免跨级重复重建瓦片。
        else if (zoom <= 11) return 33.0;
        else if (zoom <= 12) return 45.0;
        else return 50.0;
    }

    private getAltitude(zoom: number): number {
        // [USER] Constant 45 degrees
        return 45;
    }

    private getShadowOpacity(zoom: number): number {
        // [USER] Constant 100% opacity
        return 1.0;
    }

    /**
     * [NEW] Update map visuals based on game time
     */
    public updateTime(year: number) {
        this.currentYear = year;
        // 🔴 [2026-09-19 主人定] 战场图层不再按年份显示（「先不要时间这个限定条件了」），
        //    故此处不再调 battlefieldLayer.setYear —— 战场一旦打过由 onBattlefieldFought 自己重绘。
        // Vector road updates removed
    }

    /**
     * [DIRECTOR MODE] Cinematic Camera Move
     * Moves the camera to a target location. Omits `zoom` to keep the current level.
     */
    public async flyTo(target: { lat: number, lng: number }, duration: number, options: { zoom?: number } = {}): Promise<void> {
        const targetZoom = options.zoom ?? this.map.getZoom();

        console.log(`🎥 [GameMap] Flying to [${target.lat.toFixed(2)}, ${target.lng.toFixed(2)}] over ${duration}s (Zoom: ${targetZoom})`);

        return new Promise<void>((resolve) => {
            // Safety timeout: Resolve anyway if moveend never fires
            const safetyTimeout = setTimeout(() => {
                console.warn('⚠️ [GameMap] FlyTo timeout - forcing resolve');
                resolve();
            }, duration * 1000 + 1000);

            const onMoveEnd = () => {
                clearTimeout(safetyTimeout);
                this.map.off('moveend', onMoveEnd);
                resolve();
            };

            this.map.on('moveend', onMoveEnd);

            this.map.setView([target.lat, target.lng], targetZoom, {
                animate: true,
                duration: duration,
                easeLinearity: 0.5 // Smooth cinematic ease
            });
        });
    }


    public setMapSource(sourceKey: string) {
        if (this.globalOverviewLayer) {
            this.map.removeLayer(this.globalOverviewLayer);
            this.globalOverviewLayer = null;
        }
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
            this.currentTileLayer = null;
        }
        // Remove old zoom11 layer if it exists (legacy cleanup)
        if (this.zoom11TileLayer) {
            this.map.removeLayer(this.zoom11TileLayer);
            this.zoom11TileLayer = null;
        }

        const sourceConfig = (TILE_CONFIG as any).SOURCES[sourceKey];
        if (!sourceConfig) return;

        let tileUrl = sourceConfig.url;
        const layerOptions = {
            tileSize: 512, // Default to 512 for our local tiles
            ...sourceConfig.options
        };

        if (sourceKey === 'LOCAL') {
            this.currentSourceKey = sourceKey;

            // 全球总览层：只填补新开放的 zoom 2–7；maxZoom=7 保证 8/9/10 原有模式逐像素不受影响。
            this.globalOverviewLayer = L.tileLayer(
                (TILE_CONFIG as any).SOURCES.ESRI_SHADED.url,
                {
                    tileSize: 256,
                    minZoom: TILE_CONFIG.MIN_ZOOM,
                    maxZoom: 7,
                    noWrap: true,
                    bounds: L.latLngBounds([[-85.0511287798, -180], [85.0511287798, 180]]),
                    zIndex: 0,
                }
            );
            this.globalOverviewLayer.addTo(this.map);

            // 加载本地 Google Terrain 512px 瓦片（zoom 8–11，四级全覆盖）
            // 瓦片缺失时透明兜底，不显示裂图，由 HillshadeLayer 补位
            const terrainPath = 'Google Terrain Maps without labels  roads and POI  512px';
            this.currentTileLayer = L.tileLayer(
                `/{z}dixingtu/${terrainPath}/{x}/{y}.jpg`,
                {
                    // 文件为 512px 高清图，但 x/y 按标准 256px 网格编号。
                    // 显示尺寸若设为 512，会使请求坐标减半，命中不存在的文件。
                    tileSize: 256,
                    minZoom: 8,
                    maxZoom: 11,
                    minNativeZoom: 8,
                    maxNativeZoom: 11,
                    keepBuffer: 4,            // [OPTIMIZATION] 缓存上下左右 4 级瓦片，消除频繁切换与飞行的白块
                    updateWhenZooming: false, // [OPTIMIZATION] 缩放动画中保留上一层级瓦片不立刻释放，维持连续性
                    // 🔴 [2026-09-18 主人报障「移动时屏幕边部出现没刷新的边缘」]
                    //    Leaflet 的 updateInterval 默认 200ms —— 跟拍连续平移时，瓦片请求每 200ms 才补一次，
                    //    这 200ms 里新露出来的那一条还没有瓦片，露出的是 #map 的海蓝底色（style.css: #6395b8），
                    //    看起来就是「边缘没刷新」。压到 50ms：请求跟着镜头走，露边时间缩到 1/4。
                    //    ⚠️ 别改成 0 —— 每帧都跑一次 _update 会在 fps 低的时候雪上加霜。
                    updateInterval: 50,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                }
            );
            this.currentTileLayer.addTo(this.map);
        } else {
            this.currentSourceKey = sourceKey;
            this.currentTileLayer = L.tileLayer(tileUrl, layerOptions);
            this.currentTileLayer.addTo(this.map);
        }

        // 保持之前的滤镜：LOCAL 源恢复默认古卷滤镜；其他源（ESRI 晕渲）不用滤镜。
        const tilesPane = document.querySelector('.leaflet-tile-pane') as HTMLElement;
        if (tilesPane) {
            tilesPane.style.filter = sourceKey === 'LOCAL' ? 'sepia(8%) saturate(104%) contrast(104%) brightness(98%)' : 'none';
        }

        // 保持河流和地形的顺序
        // 1. Base Map (Added above)
        // 2. Hillshade (zIndex 2)
        // 3. River (zIndex 4)

        // 如果地形层已存在，不用动，它有 zIndex 控制
        // 如果河流层已存在，bringToFront 确保它在最上面
        if (this.riverLayer) {
            this.riverLayer.bringToFront();
        }

        // [FIX] 确保 HillshadeLayer 在底图之上（防止被新加载的 TileLayer 覆盖）
        if (this.hillshadeLayer && this.map.hasLayer(this.hillshadeLayer)) {
            this.hillshadeLayer.bringToFront();
        }
    }

    private isExperimentalReliefEnabled = (() => {
        try { return localStorage.getItem('mapwar.terrainRelief.enabled') !== 'false'; }
        catch { return true; }
    })();

    private isValleyReliefExpEnabled = (() => {
        try { return localStorage.getItem('mapwar.valleyRelief.enabled') !== 'false'; }
        catch { return true; }
    })();

    public setValleyReliefExp(enabled: boolean): void {
        this.isValleyReliefExpEnabled = enabled;
        try { localStorage.setItem('mapwar.valleyRelief.enabled', String(enabled)); }
        catch { /* 存储不可用时仍正常切换当前画面。 */ }
        this.hillshadeLayer?.setValleyReliefExp(enabled);
    }

    public setExperimentalRelief(enabled: boolean): void {
        this.isExperimentalReliefEnabled = enabled;
        try { localStorage.setItem('mapwar.terrainRelief.enabled', String(enabled)); }
        catch { /* 存储不可用时仍正常切换当前画面。 */ }
        if (enabled && (!this.hillshadeLayer || !this.map.hasLayer(this.hillshadeLayer))) {
            this.toggleHillshade(true);
            const chkHill = document.getElementById('chk-hillshade') as HTMLInputElement | null;
            if (chkHill && !chkHill.checked) {
                chkHill.checked = true;
                const controls = document.getElementById('hillshade-controls');
                if (controls) controls.style.display = 'flex';
            }
        }
        this.hillshadeLayer?.setExperimentalRelief(enabled);
    }

    public toggleHillshade(enable: boolean) {
        if (enable) {
            if (!this.hillshadeLayer) {
                this.hillshadeLayer = new HillshadeLayer({
                    zIndex: 2,
                    maxZoom: 18,
                    azimuth: 305,  // 偏西光照，更好突出东亚东西向山脉（秦岭、昆仑）
                    altitude: 45,  // 与 getAltitude() 对齐，避免首次 zoomend 触发全量重建
                    zFactor: 33,   // 与 getZFactor(8-11) 对齐，避免开机即 redraw
                    experimentalRelief: this.isExperimentalReliefEnabled,
                    valleyReliefExp: this.isValleyReliefExpEnabled,
                });
                // 沙漠河流绿带要河流线段：已加载就直接给，没加载就触发一次（加载完会自动转交）
                if (this.riverSegmentsCache) this.hillshadeLayer.setRiverSegments(this.riverSegmentsCache);
                else this.loadRiverData().catch(() => { /* 失败已通知 Worker，河流图层那边会报错 */ });
            }
            if (!this.map.hasLayer(this.hillshadeLayer)) {
                this.hillshadeLayer.addTo(this.map);
            }
        } else {
            if (this.hillshadeLayer && this.map.hasLayer(this.hillshadeLayer)) {
                this.map.removeLayer(this.hillshadeLayer);
            }
        }
    }

    public toggleTree(enable: boolean) {
        this.vegetationLayer?.setVisible(enable);
    }

    /**
     * Centralized visibility logic for Vector River Layer
     * Strictly controls Zoom 9 visibility.
     */
    private updateRiverVisibility = () => {
        // Safety checks
        if (!this.vectorRiverLayer || !this.isVectorRiverEnabled) return;

        const zoom = Math.floor(this.map.getZoom());
        const shouldShow = !isMacroMapZoom(zoom) && zoom >= 8 && zoom <= 12;

        if (shouldShow) {
            if (!this.map.hasLayer(this.vectorRiverLayer)) {
                this.vectorRiverLayer.addTo(this.map);
                this.vectorRiverLayer.bringToBack();
                // 重新挂载后恢复描边在下、水体在上的内部顺序。
                this.vectorRiverLayer.refresh();
                // Ensure ESRI stays on top
                if (this.riverLayer) this.riverLayer.bringToFront();
            }
            this.vectorRiverLayer.updateStyle(zoom);
            // 全球与国内统一使用标准 WGS84 坐标，消除火星坐标（GCJ-02）导致的 500 米偏位重影
            this.vectorRiverLayer.setOffsetMode(false);
            // 🔴 [2026-08-31] 视口裁剪：只有与「视口外扩一屏」相交的河才进图层。
            //    实测 zoom9 屏内只有 18/2404 条河、顶点占比 0.2%，
            //    不裁的话每次 zoomend 白重投影 98 万个顶点（缩放冻结 449ms 里 76~78% 是它）。
            this.vectorRiverLayer.cullTo(this.map.getBounds());
        } else {
            if (this.map.hasLayer(this.vectorRiverLayer)) {
                this.map.removeLayer(this.vectorRiverLayer);
            }
        }
    }

    /**
     * 河流数据只下载解析一次，河流图层与晕渲图层（沙漠河流绿带）共用。
     * 🔴 [2026-09-30] 晕渲图层创建时也会触发：河流图层关着时绿带照样有数据，干旱瓦片不会干等。
     */
    private riverDataPromise: Promise<any> | null = null;
    private riverSegmentsCache: Float32Array | null = null;
    private loadRiverData(): Promise<any> {
        return this.riverDataPromise ??= fetch(`${import.meta.env.BASE_URL || '/'}assets/ne_10m_rivers_lake_centerlines.geojson`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                gameLog('startup', '[GameMap] Vector river data loaded');
                setStrategicRiverProximityData(data);
                this.riverSegmentsCache = buildRiverSegments(data);
                this.hillshadeLayer?.setRiverSegments(this.riverSegmentsCache);
                return data;
            })
            .catch(err => {
                this.riverDataPromise = null;                    // 失败不缓存，下次再试
                this.hillshadeLayer?.setRiverSegments(null);     // 告诉晕渲 Worker 别再等
                throw err;
            });
    }

    public toggleRiver(enable: boolean) {
        // [FIX] Always clean up old listener to prevent duplicates/ghosts
        this.map.off('zoomend', this.updateRiverVisibility);
        this.map.off('moveend', this.updateRiverVisibility);

        // [MODIFIED] Keep existing RiverOverlayLayer (ESRI) Logic
        if (this.riverLayer) {
            if ((this.riverLayer as any)._map) {
                this.map.removeLayer(this.riverLayer as any);
            } else if (this.map.hasLayer(this.riverLayer as any)) {
                this.map.removeLayer(this.riverLayer as any);
            }
        }

        // [NEW] Toggle Vector Layer logic
        this.isVectorRiverEnabled = enable;

        if (this.vectorRiverLayer) {
            if (this.map.hasLayer(this.vectorRiverLayer)) {
                this.map.removeLayer(this.vectorRiverLayer);
            }
        }

        if (enable) {
            // [FIX] Bind listener centrally
            this.map.on('zoomend', this.updateRiverVisibility);
            // moveend 也要监听：跟拍走出上次裁剪范围时得把新进视野的河补进来。
            // cullTo 自带「还在上次范围内就直接返回」，所以平移时绝大多数 moveend 是零成本。
            this.map.on('moveend', this.updateRiverVisibility);

            // 1. ESRI 猜色水域层：河道宽、条数少，与下方矢量层互补
            //    （2026-07-19 主人明确要求两套河流都保留，勿再停用）
            this.riverLayer = new RiverOverlayLayer();
            this.riverLayer.addTo(this.map);

            // 2. Load Vector Layer (Authentic Data)：河流条数多、线细
            if (!this.vectorRiverLayer) {
                this.loadRiverData()
                    .then(data => {
                        if (this.vectorRiverLayer) return;
                        this.vectorRiverLayer = new VectorRiverLayer(data, { pane: 'vectorRiverPane' });

                        // [FIX] Initial Visibility Check
                        this.updateRiverVisibility();
                    })
                    .catch(err => console.error('[GameMap] Failed to load vector rivers:', err));
            } else {
                // [FIX] Initial Visibility Check for existing layer
                this.updateRiverVisibility();
            }
        }
    }

    /**
     * [NEW] 切换历史道路 (手绘数据 VectorRoadData.ts)
     */
    // toggleHistoryRoad and toggleGlobalRoad methods removed



    private addStyleControl() {
        // 创建一个简单的自定义控件
        const Control = L.Control.extend({
            onAdd: () => {
                const div = L.DomUtil.create('div', 'leaflet-bar result-tooltip');
                div.id = 'debug-control-panel'; // 直播模式（StreamModeToggle）按此 id 隐藏
                div.style.background = 'linear-gradient(135deg, rgba(235, 220, 195, 0.85) 0%, rgba(216, 197, 168, 0.9) 100%)';
                div.style.backdropFilter = 'blur(4px)';
                div.style.border = 'none';
                div.style.padding = '10px 12px';
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.gap = '8px';
                div.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                div.style.borderRadius = '8px';
                div.style.fontFamily = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";
                div.style.color = '#5b7a66';
                div.style.maxHeight = '85vh';
                div.style.width = '150px';
                div.style.overflowY = 'auto';
                
                let html = `
                    <div id="control-panel-header" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-weight:bold; font-size:14px; color:#1d3326; padding-bottom:6px; user-select:none; border-bottom:1px dashed rgba(125, 111, 90, 0.4); margin-bottom:4px;">
                        <span>⚙️ 调试面板</span>
                        <span id="control-panel-toggle-icon" style="color:#5b7a66;">▼</span>
                    </div>
                    <div id="control-panel-content" style="display:flex; flex-direction:column; gap:8px;">
                    <div style="font-weight:bold;margin-bottom:2px;font-size:12px;color:#666;">📍 坐标搜索</div>
                    <input type="text" id="inp-coord-search" placeholder="lat, lng（如 37.2833, 34.7833）" style="padding:6px;border:1px solid rgba(125,111,90,0.5);border-radius:4px;font-family:inherit;font-size:12px;color:#1d3326;background:rgba(255,255,255,0.6);width:100%;box-sizing:border-box;">
                    <div style="display:flex;gap:6px;margin-top:4px;">
                        <button id="btn-coord-search" style="flex:1;padding:6px;cursor:pointer;background:transparent;color:#1d3326;border:1px solid rgba(125,111,90,0.5);border-radius:4px;font-weight:bold;font-family:inherit;transition:all 0.2s;">🔍 查看 (ZOOM 9)</button>
                        <button id="btn-coord-search-clear" style="padding:6px 10px;cursor:pointer;background:transparent;color:#8d231b;border:1px solid rgba(141,35,27,0.4);border-radius:4px;font-size:12px;font-family:inherit;transition:all 0.2s;display:none;" title="清除地图上的搜索标记">❌ 清除</button>
                    </div>
                    <div id="coord-search-result" style="font-size:11px;color:#5c3e21;background:rgba(255,255,255,0.6);border-left:3px solid #8d231b;padding:4px 6px;border-radius:3px;line-height:1.4;display:none;margin-top:4px;"></div>
                    
                    <hr style="margin:4px 0;width:100%;border:0;border-top:1px dashed rgba(125, 111, 90, 0.4);">
                    
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#5b7a66;">
                        <input type="checkbox" id="chk-hillshade"> 
                        <b style="color:#1d3326;">📐 开启山体高度增强</b>
                    </label>

                    <div id="hillshade-controls" style="margin-left:20px;display:flex;flex-direction:column;gap:4px;">
                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            立体强度 (Z-Factor) <span id="val-z">33.0</span>
                        </label>
                        <input type="range" id="rng-z" min="10.0" max="40.0" step="1.0" value="33.0" style="width:120px;">
                        
                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            阴影浓度 (Opacity) <span id="val-o">100%</span>
                        </label>
                        <input type="range" id="rng-o" min="0.1" max="1.5" step="0.1" value="1.0" style="width:120px;">

                        <hr style="width:100%;border:0;border-top:1px dashed #eee;margin:2px 0;">

                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            阳光角度 (Sun Alt) <span id="val-a">45°</span>
                        </label>
                        <input type="range" id="rng-a" min="10" max="80" step="5" value="45" style="width:120px;">
                        <span style="font-size:9px;color:#999;">(较低角度=阴影更长)</span>

                    </div>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#2e7d32;margin-top:2px;margin-bottom:8px;">
                        <input type="checkbox" id="chk-elev-color" checked> 
                        <b>🎨 海拔分层着色</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#a9742a;margin-top:2px;margin-bottom:8px;">
                        <input type="checkbox" id="chk-desert-coloring" checked> 
                        <b>🏜️ 沙漠涂色</b>
                    </label>

                    <hr style="margin:8px 0;width:100%;border:0;border-top:1px solid #eee;">

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#0066cc;margin-top:8px;">
                        <input type="checkbox" id="chk-river" checked>  
                        <b>💧 开启河流图层</b>
                    </label>

                    <!-- 默认不勾选；与 CityManager.territoryLayerVisible 一致。见 AGENTS.md §10.1 -->
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#d32f2f;">
                        <input type="checkbox" id="chk-faction">
                        <b>🚩 开启势力区域显示</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#333;margin-top:4px;">
                        <input type="checkbox" id="chk-grid"> 
                        <b>🌐 开启战略网格</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#FFD700;margin-top:4px;">
                        <input type="checkbox" id="chk-road">
                        <b>🛣️ 开启道路网络</b>
                    </label>

                    <!-- History and Global Road checkboxes removed -->

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#8B4513;margin-top:4px;">
                        <input type="checkbox" id="chk-terrain"> 
                        <b>⛰️ 开启地形覆盖</b>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#2e7d32;margin-top:4px;">
                        <input type="checkbox" id="chk-tree"> 
                        <b>🌲 开启植被图层</b>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#6d4c41;margin-top:4px;">
                        <input type="checkbox" id="chk-land-animal">
                        <b>🦌 陆地动物</b>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#0288d1;margin-top:4px;">
                        <input type="checkbox" id="chk-flying-animal" checked>
                        <b>🦅 飞行动物</b>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#0097a7;margin-top:4px;">
                        <input type="checkbox" id="chk-marine-animal" checked>
                        <b>🐬 海洋动物</b>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#8d6e63;margin-top:4px;">
                        <input type="checkbox" id="chk-trade-traffic" checked>
                        <b>🐪 显示商队</b>
                    </label>
                    <!-- 逐像素海陆分界（默认关）：与军团变船用的判定同源，任何缩放级别都能看。
                         [2026-08-04] 原「🌊 陆海视图」已删：它走 SpeedOverlayRenderer 六边形网格，
                         硬限制 zoom≥9 且视野内 hex<1000，默认 zoom 8 下什么都不画；且判的是 hex 中心点，
                         与军团实际用的连续经纬度判定不是一回事。功能已被本图层完全覆盖。 -->
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#00838f;margin-top:4px;">
                        <input type="checkbox" id="chk-land-sea-boundary">
                        <b>🧭 海陆分界线</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#795548;margin-top:4px;">
                        <input type="checkbox" id="chk-city-texture" checked> 
                        <b>🏯 开启城市贴图</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#6a1b9a;margin-top:4px;">
                        <input type="checkbox" id="chk-wonder-layer" checked>
                        <b>🏛️ 显示奇观</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#8d4a2f;margin-top:4px;">
                        <input type="checkbox" id="chk-battlefield-layer" checked>
                        <b>⚔️ 显示战场</b>
                    </label>

                    <div style="display:grid;grid-template-columns:30px 1fr 30px;gap:4px;align-items:center;">
                        <button id="btn-wonder-prev" title="上一个奇观" style="padding:6px 2px;cursor:pointer;background:transparent;color:#6a1b9a;border:1px solid rgba(106,27,154,0.45);border-radius:4px;font-weight:bold;font-family:inherit;">◀</button>
                        <button id="btn-wonder-viewer" style="padding:6px 2px;cursor:pointer;background:transparent;color:#6a1b9a;border:1px solid rgba(106,27,154,0.45);border-radius:4px;font-weight:bold;font-family:inherit;">🏛️ 查看奇观</button>
                        <button id="btn-wonder-next" title="下一个奇观" style="padding:6px 2px;cursor:pointer;background:transparent;color:#6a1b9a;border:1px solid rgba(106,27,154,0.45);border-radius:4px;font-weight:bold;font-family:inherit;">▶</button>
                    </div>
                    <div id="wonder-viewer-label" style="display:none;text-align:center;font-size:11px;color:#6a1b9a;line-height:1.3;"></div>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#e65100;margin-top:4px;">
                        <input type="checkbox" id="chk-auto-zoom" checked> 
                        <b>🔍 自动缩放</b>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#e65100;margin-top:4px;">
                        <input type="checkbox" id="chk-tactical-mode" checked> 
                        <b>⚔️ 进入战术模式</b>
                    </label>


                    <hr style="margin:8px 0;width:100%;border:0;border-top:1px solid #eee;">
                    <div style="font-weight:bold;margin-bottom:4px;font-size:13px;color:#5d4037;">音效</div>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#5d4037;">
                        <input type="checkbox" id="chk-audio-enabled">
                        <b>开启音效</b>
                    </label>

                    <div id="audio-controls" style="margin-left:20px;display:flex;flex-direction:column;gap:4px;">
                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            主音量 <span id="val-audio-volume">50%</span>
                        </label>
                        <input type="range" id="rng-audio-volume" min="0" max="100" step="5" value="50" style="width:120px;">
                        <button id="btn-audio-test" style="padding:4px 6px;cursor:pointer;background:transparent;color:#5d4037;border:1px solid rgba(125,111,90,0.5);border-radius:4px;font-size:11px;font-family:inherit;">
                            测试音效
                        </button>
                    </div>
                `;

                if (import.meta.env.DEV) {
                    html += `
                    <hr style="margin:8px 0;width:100%;border:0;border-top:1px solid #eee;">
                    <div style="font-weight:bold;margin-bottom:4px;font-size:12px;color:#999;">编辑器</div>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#FF6F00;margin-top:2px;">
                        <input type="checkbox" id="chk-editor-city"> 
                        <b>🏯 城市编辑</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#1565C0;margin-top:4px;">
                        <input type="checkbox" id="chk-editor-event"> 
                        <b>📜 事件编辑</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#2E7D32;margin-top:4px;">
                        <input type="checkbox" id="chk-editor-road">
                        <b>🛤️ 路线编辑（陆路 / 🚢 海路）</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#C62828;margin-top:4px;">
                        <input type="checkbox" id="chk-editor-army">
                        <b>⚔ 军队编辑</b>
                    </label>


                    `;
                }
                
                html += `</div>`; // Close control-panel-content
                
                div.innerHTML = html;

                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div); // 防止滚动面板时缩放地图
                return div;
            }
        });

        this.map.addControl(new Control({ position: 'topright' }));

        setTimeout(() => {
            const panelHeader = document.getElementById('control-panel-header');
            const panelContent = document.getElementById('control-panel-content');
            const toggleIcon = document.getElementById('control-panel-toggle-icon');
            const debugPanelStorageKey = 'mapwar.debugPanel.options';
            let savedDebugPanelState: {
                sourceKey?: string;
                collapsed?: boolean;
                inputs?: Record<string, string | boolean>;
            } | null = null;

            try {
                const raw = localStorage.getItem(debugPanelStorageKey);
                if (raw) savedDebugPanelState = JSON.parse(raw);
            } catch {
                savedDebugPanelState = null;
            }

            const persistDebugPanelState = () => {
                if (!panelContent) return;
                const inputs: Record<string, string | boolean> = {};
                panelContent.querySelectorAll<HTMLInputElement>('input[id]').forEach((input) => {
                    if (input.id === 'chk-terrain-relief-experiment' || input.id === 'chk-valley-relief-experiment') return;
                    inputs[input.id] = input.type === 'checkbox' ? input.checked : input.value;
                });
                try {
                    localStorage.setItem(debugPanelStorageKey, JSON.stringify({
                        sourceKey: this.currentSourceKey,
                        collapsed: panelContent.style.display === 'none',
                        inputs,
                    }));
                } catch {
                    // 隐私模式或存储不可用时继续使用本次会话状态。
                }
            };

            if (panelContent && toggleIcon && savedDebugPanelState?.collapsed) {
                panelContent.style.display = 'none';
                toggleIcon.innerText = '◀';
            }
            if (panelHeader && panelContent && toggleIcon) {
                panelHeader.addEventListener('click', () => {
                    if (panelContent.style.display === 'none') {
                        panelContent.style.display = 'flex';
                        toggleIcon.innerText = '▼';
                    } else {
                        panelContent.style.display = 'none';
                        toggleIcon.innerText = '◀';
                    }
                    persistDebugPanelState();
                });
            }

            const chkHillshade = document.getElementById('chk-hillshade') as HTMLInputElement;
            const chkRiver = document.getElementById('chk-river') as HTMLInputElement;

            // 📍 坐标搜索：输入 lat, lng 跳转到 ZOOM 9 并标记定位（带波纹高亮、最近据点与距离提示）
            const btnCoordSearch = document.getElementById('btn-coord-search');
            const btnCoordClear = document.getElementById('btn-coord-search-clear');
            const inpCoordSearch = document.getElementById('inp-coord-search') as HTMLInputElement | null;
            const coordSearchResult = document.getElementById('coord-search-result');

            const clearCoordMarker = () => {
                if (this.searchCoordMarker) {
                    this.map.removeLayer(this.searchCoordMarker);
                    this.searchCoordMarker = null;
                }
                if (btnCoordClear) btnCoordClear.style.display = 'none';
                if (coordSearchResult) {
                    coordSearchResult.style.display = 'none';
                    coordSearchResult.innerHTML = '';
                }
            };
            if (btnCoordClear) {
                btnCoordClear.addEventListener('click', clearCoordMarker);
            }

            if (btnCoordSearch && inpCoordSearch) {
                const goCoord = () => {
                    const raw = inpCoordSearch.value.trim();
                    if (!raw) return;
                    const m = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
                    if (!m) { alert('坐标格式不对：请输入 lat, lng（如 37.2833, 34.7833）'); return; }
                    const lat = parseFloat(m[1]);
                    const lng = parseFloat(m[2]);
                    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { alert('经纬度超出范围'); return; }

                    // 1. 寻找最近的据点
                    let nearestCity: (typeof CITIES_V2)[number] | null = null;
                    let minCityDist = Infinity;
                    for (const c of CITIES_V2) {
                        const d = L.latLng(lat, lng).distanceTo([c.lat, c.lng]) / 1000;
                        if (d < minCityDist) {
                            minCityDist = d;
                            nearestCity = c;
                        }
                    }

                    // 2. 寻找最近的战场
                    let nearestBf: (typeof BATTLEFIELDS)[number] | null = null;
                    let minBfDist = Infinity;
                    for (const b of BATTLEFIELDS) {
                        const d = L.latLng(lat, lng).distanceTo([b.lat, b.lng]) / 1000;
                        if (d < minBfDist) {
                            minBfDist = d;
                            nearestBf = b;
                        }
                    }

                    // 方位角计算（以最近据点为原点看目标点）
                    let dirText = '';
                    if (nearestCity) {
                        const dLat = lat - nearestCity.lat;
                        const dLng = (lng - nearestCity.lng) * Math.cos(nearestCity.lat * Math.PI / 180);
                        const angle = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
                        const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北', '北'];
                        dirText = dirs[Math.round(angle / 45) % 8];
                    }

                    // 3. 清理旧标记
                    if (this.searchCoordMarker) {
                        this.map.removeLayer(this.searchCoordMarker);
                        this.searchCoordMarker = null;
                    }

                    // 4. 注入波纹动画样式
                    if (!document.getElementById('coord-search-style')) {
                        const st = document.createElement('style');
                        st.id = 'coord-search-style';
                        st.textContent = `
                            @keyframes coord-pulse-ring {
                                0% { transform: scale(0.3); opacity: 1; }
                                70% { transform: scale(2.2); opacity: 0.25; }
                                100% { transform: scale(2.8); opacity: 0; }
                            }
                            @keyframes coord-pin-bounce {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-7px); }
                            }
                            .coord-search-pin-anim {
                                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.55));
                                animation: coord-pin-bounce 1.6s ease-in-out infinite;
                            }
                        `;
                        document.head.appendChild(st);
                    }

                    // 5. 创建带脉冲动画的指示 Marker
                    const icon = L.divIcon({
                        className: 'coord-search-marker-icon',
                        html: `
                            <div style="position:relative;width:40px;height:40px;pointer-events:auto;cursor:pointer;">
                                <div style="position:absolute;left:20px;top:20px;width:34px;height:34px;margin-left:-17px;margin-top:-17px;border-radius:50%;border:2px solid #e74c3c;background:rgba(231,76,60,0.22);animation:coord-pulse-ring 1.6s cubic-bezier(0.2,0.8,0.2,1) infinite;pointer-events:none;"></div>
                                <div style="position:absolute;left:20px;top:20px;width:8px;height:8px;margin-left:-4px;margin-top:-4px;border-radius:50%;background:#e74c3c;border:2px solid #ffffff;box-shadow:0 0 6px #e74c3c;pointer-events:none;"></div>
                                <div class="coord-search-pin-anim" style="position:absolute;left:20px;top:-22px;transform:translateX(-50%);font-size:26px;line-height:1;user-select:none;pointer-events:none;">📍</div>
                            </div>
                        `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    });

                    const popupContent = `
                        <div style="font-family:serif;font-size:12px;color:#2c1810;min-width:180px;line-height:1.5;">
                            <div style="font-weight:bold;font-size:13px;color:#8d231b;border-bottom:1px solid rgba(141,35,27,0.3);padding-bottom:3px;margin-bottom:5px;">
                                📍 坐标搜索定位
                            </div>
                            <div><b>纬度 (lat):</b> ${lat.toFixed(4)}</div>
                            <div><b>经度 (lng):</b> ${lng.toFixed(4)}</div>
                            ${nearestCity ? `<div style="margin-top:4px;color:#1d3326;">🏛️ <b>最近据点:</b> ${nearestCity.name} <span style="color:#8d4a2f;">(${minCityDist.toFixed(1)} km, ${dirText}向)</span></div>` : ''}
                            ${nearestBf && minBfDist <= 150 ? `<div style="color:#555;">⚔️ <b>最近战场:</b> ${nearestBf.name} <span style="color:#8d4a2f;">(${minBfDist.toFixed(1)} km)</span></div>` : ''}
                            <div style="margin-top:6px;text-align:right;">
                                <button id="btn-coord-popup-clear" style="font-size:11px;padding:2px 8px;cursor:pointer;background:#fff;border:1px solid #ccc;border-radius:3px;color:#8d231b;">清除标记</button>
                            </div>
                        </div>
                    `;

                    const marker = L.marker([lat, lng], { icon, zIndexOffset: 10000 }).addTo(this.map);
                    marker.bindPopup(popupContent, { autoClose: false, closeOnClick: false, offset: [0, -16] });
                    this.searchCoordMarker = marker;

                    marker.on('popupopen', () => {
                        const btnPopupClear = document.getElementById('btn-coord-popup-clear');
                        if (btnPopupClear) {
                            btnPopupClear.addEventListener('click', clearCoordMarker);
                        }
                    });

                    // 6. 移动至 ZOOM 9 并自动弹出信息窗口
                    const targetZoom = 9; // 🔴 主人指定：移动至 ZOOM 9
                    this.map.flyTo([lat, lng], targetZoom, { duration: 1.0 });

                    // 飞行完成后打开弹窗
                    let popupOpened = false;
                    const openMarkerPopup = () => {
                        if (popupOpened) return;
                        popupOpened = true;
                        if (this.searchCoordMarker === marker) {
                            marker.openPopup();
                        }
                    };
                    this.map.once('moveend', openMarkerPopup);
                    setTimeout(openMarkerPopup, 1100);

                    // 7. 更新面板状态与显示清除按钮
                    if (btnCoordClear) btnCoordClear.style.display = 'inline-block';
                    if (coordSearchResult) {
                        coordSearchResult.style.display = 'block';
                        coordSearchResult.innerHTML = `<b>${lat.toFixed(4)}, ${lng.toFixed(4)}</b><br>${nearestCity ? `🏛️ 距据点【${nearestCity.name}】${minCityDist.toFixed(1)}km（${dirText}）` : ''}${nearestBf && minBfDist <= 150 ? `<br>⚔️ 距战场【${nearestBf.name}】${minBfDist.toFixed(1)}km` : ''}`;
                    }
                };

                btnCoordSearch.addEventListener('click', goCoord);
                inpCoordSearch.addEventListener('keydown', (e: any) => { if (e.key === 'Enter') goCoord(); });
            }

            if (chkHillshade) {
                chkHillshade.addEventListener('change', (e: any) => {
                    const isChecked = e.target.checked;
                    this.toggleHillshade(isChecked);
                    const controls = document.getElementById('hillshade-controls');
                    if (controls) controls.style.display = isChecked ? 'flex' : 'none';

                    // [NEW] 自动联动：开启山体高度 -> 自动开启海拔分层
                    if (isChecked) {
                        const chkElevColor = document.getElementById('chk-elev-color') as HTMLInputElement;
                        if (chkElevColor && !chkElevColor.checked) {
                            chkElevColor.checked = true;
                            // 触发一次 updateTerrain 以应用 Elevation Color
                            // 由于 updateTerrain 是内部定义的，无法直接调用，但可以通过触发 input 事件或重新 setParams
                            // 这里我们手动调用一下 updateTerrain 的逻辑 (需要获取引用，或者简单地再次 setParams)
                            // 最简单的方法是触发 chkElevColor 的 change 事件
                            chkElevColor.dispatchEvent(new Event('change'));
                        }
                    }
                });
            }

            // 沙漠涂色开关：关闭时 Worker 不传历史区域，沙漠回到纯海拔着色，用于对比效果
            const chkDesert = document.getElementById('chk-desert-coloring') as HTMLInputElement;
            if (chkDesert) {
                chkDesert.addEventListener('change', (e: any) => {
                    this.hillshadeLayer?.setParams({ useDesertColoring: e.target.checked });
                });
            }

            // Sliders
            const rngZ = document.getElementById('rng-z') as HTMLInputElement;
            const rngO = document.getElementById('rng-o') as HTMLInputElement;
            const rngA = document.getElementById('rng-a') as HTMLInputElement;

            const valZ = document.getElementById('val-z');
            const valO = document.getElementById('val-o');
            const valA = document.getElementById('val-a');

            const updateTerrain = () => {
                if (!this.hillshadeLayer) return;

                const z = parseFloat(rngZ.value);
                const o = parseFloat(rngO.value);
                const a = parseInt(rngA.value);
                const chkElevColor = document.getElementById('chk-elev-color') as HTMLInputElement;
                const useElevColor = chkElevColor ? chkElevColor.checked : false;

                if (valZ) valZ.innerText = z.toFixed(1);
                if (valO) valO.innerText = Math.round(o * 100) + '%';
                if (valA) valA.innerText = a + '°';

                this.hillshadeLayer.setParams({ zFactor: z, shadowOpacity: o, altitude: a, useElevationColor: useElevColor });
            };

            const chkElevColor = document.getElementById('chk-elev-color') as HTMLInputElement;
            if (chkElevColor) {
                chkElevColor.addEventListener('change', () => {
                    updateTerrain();
                    // If Elevation Color is enabled, make sure Hillshade layer is ON
                    if (chkElevColor.checked) {
                        const chkHill = document.getElementById('chk-hillshade') as HTMLInputElement;
                        if (chkHill && !chkHill.checked) {
                            chkHill.checked = true;
                            chkHill.dispatchEvent(new Event('change'));
                        }
                    }
                });
            }

            if (rngZ) { rngZ.addEventListener('input', updateTerrain); rngZ.addEventListener('change', updateTerrain); }
            if (rngO) { rngO.addEventListener('input', updateTerrain); rngO.addEventListener('change', updateTerrain); }
            if (rngA) { rngA.addEventListener('input', updateTerrain); rngA.addEventListener('change', updateTerrain); }



            // 🔴 [2026-10-01 主人定] 滤镜是设定好的，无用，删除面板调节，固定应用设定滤镜
            const tilePane = this.map.getPane('tilePane');
            if (tilePane) {
                tilePane.style.filter = 'sepia(8%) saturate(104%) contrast(104%) brightness(98%)';
            }

            // Faction Color Toggle
            const chkFaction = document.getElementById('chk-faction') as HTMLInputElement;
            if (chkFaction) {
                chkFaction.addEventListener('change', (e: any) => {
                    // Use a global event or access manager via window/app if possible
                    // Ideally GameMap should have a reference or emit an event
                    // For now, dispatch a custom event that GameApp can listen to
                    window.dispatchEvent(new CustomEvent('toggle-faction-color', {
                        detail: { visible: e.target.checked }
                    }));
                });
            }

            if (chkRiver) chkRiver.addEventListener('change', (e: any) => this.toggleRiver(e.target.checked));
            
            const chkTree = document.getElementById('chk-tree') as HTMLInputElement;
            if (chkTree) chkTree.addEventListener('change', (e: any) => this.toggleTree(e.target.checked));

            const chkLandAnimal = document.getElementById('chk-land-animal') as HTMLInputElement;
            if (chkLandAnimal) {
                chkLandAnimal.addEventListener('change', (e: any) => {
                    setLandAnimalVisible(!!e.target.checked);
                });
            }

            const chkFlyingAnimal = document.getElementById('chk-flying-animal') as HTMLInputElement;
            if (chkFlyingAnimal) {
                chkFlyingAnimal.addEventListener('change', (e: any) => {
                    setFlyingAnimalVisible(!!e.target.checked);
                });
            }

            const chkMarineAnimal = document.getElementById('chk-marine-animal') as HTMLInputElement;
            if (chkMarineAnimal) {
                chkMarineAnimal.addEventListener('change', (e: any) => {
                    this.marineLifeLayer?.setVisible(!!e.target.checked);
                });
            }

            const chkTradeTraffic = document.getElementById('chk-trade-traffic') as HTMLInputElement;
            if (chkTradeTraffic) {
                chkTradeTraffic.addEventListener('change', (e: any) => {
                    setTradeTrafficLayerVisible(!!e.target.checked);
                });
            }

            const chkGrid = document.getElementById('chk-grid') as HTMLInputElement;
            if (chkGrid) chkGrid.addEventListener('change', (e: any) => this.toggleGrid(e.target.checked));

            const chkRoad = document.getElementById('chk-road') as HTMLInputElement;
            if (chkRoad) {
                chkRoad.checked = false;
                window.dispatchEvent(new CustomEvent('toggle-road-layer', { detail: { visible: false } }));
                chkRoad.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-road-layer', {
                        detail: { visible: e.target.checked }
                    }));
                });
            }

            // History and Global Road listeners removed

            const chkTerrain = document.getElementById('chk-terrain') as HTMLInputElement;
            if (chkTerrain) {
                chkTerrain.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-terrain-layer', {
                        detail: { visible: e.target.checked }
                    }));
                });
            }

            const chkLandSeaBoundary = document.getElementById('chk-land-sea-boundary') as HTMLInputElement;
            if (chkLandSeaBoundary) {
                chkLandSeaBoundary.checked = false;   // 默认关闭
                chkLandSeaBoundary.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-land-sea-boundary', {
                        detail: { visible: e.target.checked }
                    }));
                });
            }

            const chkCityTexture = document.getElementById('chk-city-texture') as HTMLInputElement;
            if (chkCityTexture) {
                chkCityTexture.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-city-texture', {
                        detail: { visible: e.target.checked }
                    }));
                });
            }

            // 奇观图层显示开关（关掉后奇观既不显示也不吃点击，方便点据点/画路）
            const chkWonderLayer = document.getElementById('chk-wonder-layer') as HTMLInputElement;
            if (chkWonderLayer) {
                chkWonderLayer.addEventListener('change', (e: any) => {
                    this.monumentLayer?.setVisible(!!e.target.checked);
                });
            }

            // 🔴 [2026-09-12 主人定] 战场图层显示开关（与奇观同一套做法）
            const chkBattlefieldLayer = document.getElementById('chk-battlefield-layer') as HTMLInputElement;
            if (chkBattlefieldLayer) {
                chkBattlefieldLayer.addEventListener('change', (e: any) => {
                    this.battlefieldLayer?.setVisible(!!e.target.checked);
                });
            }

            const btnWonderViewer = document.getElementById('btn-wonder-viewer');
            if (btnWonderViewer) {
                let wonderIndex = 0;
                let viewing = false;   // 查看模式开/关 —— 再点一次即关闭
                const label = document.getElementById('wonder-viewer-label');
                const prevBtn = document.getElementById('btn-wonder-prev') as HTMLButtonElement | null;
                const nextBtn = document.getElementById('btn-wonder-next') as HTMLButtonElement | null;
                const focusWonder = (delta: number) => {
                    if (!viewing) return;
                    wonderIndex += delta;
                    const focused = this.monumentLayer?.focusMonument(wonderIndex, 10);
                    if (!focused) return;
                    wonderIndex = focused.index;
                    if (label) {
                        label.style.display = 'block';
                        label.innerText = `${focused.index + 1} / ${focused.total} · ${focused.name}`;
                    }
                };
                const setViewing = (on: boolean) => {
                    viewing = on;
                    btnWonderViewer.textContent = on ? '✕ 关闭查看' : '🏛️ 查看奇观';
                    (btnWonderViewer as HTMLButtonElement).style.background = on ? 'rgba(106,27,154,0.15)' : 'transparent';
                    if (prevBtn) prevBtn.disabled = !on;
                    if (nextBtn) nextBtn.disabled = !on;
                    if (!on) {
                        wonderIndex = 0;
                        if (label) { label.style.display = 'none'; label.innerText = ''; }
                    }
                };
                setViewing(false);
                btnWonderViewer.addEventListener('click', () => {
                    if (viewing) { setViewing(false); return; }
                    setViewing(true);
                    focusWonder(0);
                });
                prevBtn?.addEventListener('click', () => focusWonder(-1));
                nextBtn?.addEventListener('click', () => focusWonder(1));
            }

            const chkAutoZoom = document.getElementById('chk-auto-zoom') as HTMLInputElement;
            if (chkAutoZoom) {
                chkAutoZoom.addEventListener('change', (e: any) => {
                    const game = (window as any).game;
                    if (game?.zoomController) {
                        game.zoomController.enabled = !!e.target.checked;
                    }
                });
            }

            const chkTacticalMode = document.getElementById('chk-tactical-mode') as HTMLInputElement;
            if (chkTacticalMode) {
                chkTacticalMode.addEventListener('change', (e: any) => {
                    const game = (window as any).game;
                    if (game) {
                        game.tacticalModeEnabled = !!e.target.checked;
                    }
                });
            }

            const audioManager = (window as any).game?.audioManager;
            const audioSettings = audioManager?.getSettings?.();
            const chkAudioEnabled = document.getElementById('chk-audio-enabled') as HTMLInputElement;
            const rngAudioVolume = document.getElementById('rng-audio-volume') as HTMLInputElement;
            const valAudioVolume = document.getElementById('val-audio-volume');
            const audioControls = document.getElementById('audio-controls');
            const btnAudioTest = document.getElementById('btn-audio-test');

            const syncAudioControls = () => {
                if (audioControls && chkAudioEnabled) {
                    audioControls.style.display = chkAudioEnabled.checked ? 'flex' : 'none';
                }
                if (rngAudioVolume && valAudioVolume) {
                    valAudioVolume.innerText = `${rngAudioVolume.value}%`;
                }
            };

            if (chkAudioEnabled) {
                chkAudioEnabled.checked = audioSettings?.enabled ?? true;
                chkAudioEnabled.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('audio-settings-change', {
                        detail: { enabled: !!e.target.checked }
                    }));
                    syncAudioControls();
                });
            }

            if (rngAudioVolume) {
                const savedVolume = Math.round((audioSettings?.masterVolume ?? 0.5) * 100);
                rngAudioVolume.value = String(savedVolume);
                rngAudioVolume.addEventListener('input', () => {
                    window.dispatchEvent(new CustomEvent('audio-settings-change', {
                        detail: { masterVolume: parseInt(rngAudioVolume.value, 10) / 100 }
                    }));
                    syncAudioControls();
                });
                rngAudioVolume.addEventListener('change', () => {
                    window.dispatchEvent(new CustomEvent('audio-settings-change', {
                        detail: { masterVolume: parseInt(rngAudioVolume.value, 10) / 100 }
                    }));
                    syncAudioControls();
                });
            }

            if (btnAudioTest) {
                btnAudioTest.addEventListener('click', () => {
                    window.dispatchEvent(new CustomEvent('audio-test-sound'));
                });
            }

            syncAudioControls();



            // [FIX] 编辑器复选框事件绑定 (之前缺失，导致编辑器无法打开)
            const chkEditorCity = document.getElementById('chk-editor-city') as HTMLInputElement;
            if (chkEditorCity) {
                chkEditorCity.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-editor-city', {
                        detail: { enabled: e.target.checked }
                    }));
                });
            }

            const chkEditorEvent = document.getElementById('chk-editor-event') as HTMLInputElement;
            if (chkEditorEvent) {
                chkEditorEvent.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-editor-event', {
                        detail: { enabled: e.target.checked }
                    }));
                });
            }

            const chkEditorRoad = document.getElementById('chk-editor-road') as HTMLInputElement;
            if (chkEditorRoad) {
                chkEditorRoad.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-editor-road', {
                        detail: { enabled: e.target.checked }
                    }));
                });
            }

            const chkEditorArmy = document.getElementById('chk-editor-army') as HTMLInputElement;
            if (chkEditorArmy) {
                chkEditorArmy.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-editor-army', {
                        detail: { enabled: e.target.checked }
                    }));
                });
            }

            this.setMapSource('LOCAL');

            const savedInputs = savedDebugPanelState?.inputs;
            if (savedInputs && panelContent) {
                for (const [id, value] of Object.entries(savedInputs)) {
                    if (id.startsWith('rng-sep') || id.startsWith('rng-sat') || id.startsWith('rng-con') || id === 'chk-style') continue;
                    const input = panelContent.querySelector<HTMLInputElement>(`#${id}`);
                    if (!input) continue;
                    if (input.type === 'checkbox' && typeof value === 'boolean') {
                        input.checked = value;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    } else if (input.type !== 'checkbox' && typeof value === 'string') {
                        input.value = value;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }

            panelContent?.addEventListener('change', persistDebugPanelState);
            panelContent?.addEventListener('input', (event) => {
                if ((event.target as HTMLInputElement | null)?.type === 'range') {
                    persistDebugPanelState();
                }
            });
        }, 500);
    }

    public getLeafletMap(): L.Map {
        return this.map;
    }

    public getContainer(): HTMLElement {
        return this.map.getContainer();
    }

    public latLngToContainerPoint(latlng: [number, number]): L.Point {
        return this.map.latLngToContainerPoint(latlng);
    }

    public getCityCaptureRenderer(): CityCaptureRenderer | null {
        return this.cityCaptureRenderer;
    }

    private gridLayer: StrategicGridLayer | null = null;

    public toggleGrid(enable: boolean) {
        if (!this.gridLayer) {
            this.gridLayer = new StrategicGridLayer(this.map);
        }
        this.gridLayer.toggle(enable);
    }

    // [RESTORED] User simplified requests
    public unlockCamera(): void {
        console.log(`🔓 [GameMap] Unlocking camera`);
        this.map.stop(); // 停止所有动画(飞行动画等)
        this.map.dragging.enable();
        this.map.touchZoom.enable();
        this.map.doubleClickZoom.enable();
        this.map.scrollWheelZoom.enable();
        if ((this.map as any).tap) (this.map as any).tap.enable();
        if (this.map.keyboard) this.map.keyboard.enable();
        this.map.getContainer().style.cursor = 'grab';
    }

    /**
     * [USER REQUEST] 支持 WSAD 上下左右平滑移动地图
     */
    private initKeyboardNavigation(): void {
        const keys: { [key: string]: boolean } = {};
        
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                // [2026-09-05 玩家] F2 立绘校正期间：WASD 只微调立绘，不平移镜头
                if ((window as any).game?.combatUI?.isCorrectorOpen?.()) return;
                keys[key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                keys[key] = false;
            }
        });

        let lastTime = performance.now();
        
        const panLoop = (time: number) => {
            const deltaTime = time - lastTime;
            lastTime = time;
            
            // Adjust speed based on zoom level. Base speed: 500 pixels per second.
            const panSpeed = 600 * (deltaTime / 1000); 
            
            let dx = 0;
            let dy = 0;
            
            if (keys['w']) dy -= panSpeed;
            if (keys['s']) dy += panSpeed;
            if (keys['a']) dx -= panSpeed;
            if (keys['d']) dx += panSpeed;
            
            if (dx !== 0 || dy !== 0) {
                this.map.panBy([dx, dy], { animate: false });
            }
            
            requestAnimationFrame(panLoop);
        };
        
        requestAnimationFrame(panLoop);
    }
}
