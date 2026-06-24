import L from 'leaflet';

import { TILE_CONFIG, tileToLatLng } from './TileMapConfig';
import { HillshadeLayer } from './HillshadeLayer';
import { RiverOverlayLayer } from './RiverOverlayLayer';
import { VectorRiverLayer } from './VectorRiverLayer';
import { StrategicGridLayer } from './StrategicGridLayer';
import { RegionBoundaryLayer } from './RegionBoundaryLayer';
import { CityCaptureRenderer } from './CityCaptureRenderer';
import { GridSystem } from '../systems/GridSystem';
import { TreeLayer } from './TreeLayer';
import { isMacroMapZoom } from '../config/StrategicView';
import { GameConfig } from '../config/GameConfig';
import { gameLog } from '../utils/GameLogger';

export class GameMap {
    private map: L.Map;
    private containerId: string;
    private currentTileLayer: L.TileLayer | null = null;
    private zoom11TileLayer: L.TileLayer | null = null; // [NEW] Track 2nd layer
    private currentSourceKey: string = 'LOCAL';
    private hillshadeLayer: HillshadeLayer | null = null;
    private riverLayer: RiverOverlayLayer | null = null;
    private vectorRiverLayer: VectorRiverLayer | null = null;
    private treeLayer: TreeLayer | null = null;
    private cityCaptureRenderer: CityCaptureRenderer | null = null;
    private isVectorRiverEnabled: boolean = true; // [FIX] Track explicit enabled state
    private useGCJ02: boolean = true; // [NEW] Default to true for offset logic
    private currentYear: number = -236; // [NEW] Track year for temporal filtering

    constructor(containerId: string) {
        this.containerId = containerId;

        const { lat, lng } = TILE_CONFIG.MAP_CENTER;

        const { xMin, xMax, yMin, yMax } = TILE_CONFIG.COVERAGE_BOUNDS[9];
        const southWest = tileToLatLng(xMin, yMax, 9);
        const northEast = tileToLatLng(xMax, yMin, 9);

        // 初始化
        this.map = L.map(containerId, {
            center: [lat, lng],
            zoom: 9,
            minZoom: 4,  // [UPDATE] Macro view enabled
            maxZoom: 13, // [UPDATE] Detailed view enabled
            zoomSnap: 1,
            zoomDelta: 1,
            zoomControl: false,
            attributionControl: false,
            doubleClickZoom: false // [FIX] 禁用双击放大
        });

        const updateZFactor = () => {
            if (!this.hillshadeLayer) return;
            const zoom = this.map.getZoom();
            const targetZ = this.getZFactor(zoom);
            const targetAlt = this.getAltitude(zoom);
            const targetOpacity = this.getShadowOpacity(zoom);

            // Apply to layer
            this.hillshadeLayer.setParams({ zFactor: targetZ, altitude: targetAlt, shadowOpacity: targetOpacity });

            // Sync UI
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

        // [NEW] Auto-adjust Hillshade Z-Factor based on Zoom
        this.map.on('zoomend', updateZFactor);

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
            // [VISUAL FIX] Revert blend mode for visibility, keep slight transparency
            vectorRiverPane.style.opacity = '0.85';
        }



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

        // 文化区界城环线（仅 zoom=6 显示）
        new RegionBoundaryLayer(this.map);

        // [USER REQUEST] WSAD 移动地图
        this.initKeyboardNavigation();
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
        this.toggleTree(false);

        if (this.hillshadeLayer) {
            const initialZ = this.getZFactor(this.map.getZoom());
            this.hillshadeLayer.setParams({
                useElevationColor: true,
                zFactor: initialZ
            });
        }

        const pane = this.map.getPane('tilePane');
        if (pane) {
            pane.style.filter = 'sepia(10%) saturate(100%) contrast(110%)';
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
        if (chkTree) chkTree.checked = false;
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
        else if (zoom <= 8) return 25.0;
        else if (zoom <= 9) return 30.0;
        else if (zoom <= 10) return 35.0;
        else if (zoom <= 11) return 40.0;
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
            // [OPTIMIZED] Pure Procedural Mode
            // No local image tiles are loaded. The map relies entirely on HillshadeLayer (elevation data).
            // This offers the best performance and "clean historical" look.

            this.currentSourceKey = sourceKey;

            // We don't add any L.tileLayer here. 
            // The visual content will be provided by HillshadeLayer (zIndex 2).
            // Leaflet handles panning/zooming via its internal container.
        } else {
            this.currentSourceKey = sourceKey;
            this.currentTileLayer = L.tileLayer(tileUrl, layerOptions);
            this.currentTileLayer.addTo(this.map);
        }

        // 保持之前的滤镜
        const chkAncient = document.getElementById('chk-ancient') as HTMLInputElement;
        const tilesPane = document.querySelector('.leaflet-tile-pane') as HTMLElement;
        if (tilesPane && chkAncient) {
            this.toggleAncientStyle(chkAncient.checked);
        } else if (tilesPane) {
            tilesPane.style.filter = 'none';
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

    public toggleHillshade(enable: boolean) {
        if (enable) {
            if (!this.hillshadeLayer) {
                this.hillshadeLayer = new HillshadeLayer({
                    zIndex: 2,
                    maxZoom: 18,
                    azimuth: 305  // 偏西光照，更好突出东亚东西向山脉（秦岭、昆仑）
                });
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
        if (enable) {
            if (!this.treeLayer) {
                this.treeLayer = new TreeLayer(this.map);
            }
            if (!this.map.hasLayer(this.treeLayer)) {
                this.treeLayer.addTo(this.map);
            }
        } else {
            if (this.treeLayer && this.map.hasLayer(this.treeLayer)) {
                this.map.removeLayer(this.treeLayer);
            }
        }
    }

    /**
     * Centralized visibility logic for Vector River Layer
     * Strictly controls Zoom 9 visibility.
     */
    private updateRiverVisibility = () => {
        // Safety checks
        if (!this.vectorRiverLayer || !this.isVectorRiverEnabled) return;

        const zoom = Math.floor(this.map.getZoom());
        const shouldShow = !isMacroMapZoom(zoom) && zoom >= 9 && zoom <= 12;

        if (shouldShow) {
            if (!this.map.hasLayer(this.vectorRiverLayer)) {
                this.vectorRiverLayer.addTo(this.map);
                this.vectorRiverLayer.bringToBack();
                // [FIX] Force refresh to ensure both layers render correctly
                this.vectorRiverLayer.refresh();
                // Ensure ESRI stays on top
                if (this.riverLayer) this.riverLayer.bringToFront();
            }
            this.vectorRiverLayer.updateStyle(zoom);
            this.vectorRiverLayer.setOffsetMode(zoom <= 9);
        } else {
            if (this.map.hasLayer(this.vectorRiverLayer)) {
                this.map.removeLayer(this.vectorRiverLayer);
            }
        }
    }

    public toggleRiver(enable: boolean) {
        // [FIX] Always clean up old listener to prevent duplicates/ghosts
        this.map.off('zoomend', this.updateRiverVisibility);

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

            // 1. Load ESRI Layer (Existing)
            this.riverLayer = new RiverOverlayLayer();
            this.riverLayer.addTo(this.map);

            // 2. Load Vector Layer (New Authentic Data)
            if (!this.vectorRiverLayer) {
                const basePath = import.meta.env.BASE_URL || '/';
                fetch(`${basePath}assets/ne_10m_rivers_lake_centerlines.geojson`)
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        gameLog('startup', '[GameMap] Vector river data loaded');
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



    public toggleAncientStyle(enable: boolean) {
        const tilesPane = document.querySelector('.leaflet-tile-pane') as HTMLElement;
        if (!tilesPane) return;
        if (enable) {
            tilesPane.style.filter = 'sepia(0.6) contrast(1.2) brightness(0.95) hue-rotate(-10deg)';
        } else {
            tilesPane.style.filter = 'none';
        }
    }

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
                div.style.overflowY = 'auto';
                
                let html = `
                    <div id="control-panel-header" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-weight:bold; font-size:14px; color:#1d3326; padding-bottom:6px; user-select:none; border-bottom:1px dashed rgba(125, 111, 90, 0.4); margin-bottom:4px;">
                        <span>⚙️ 调试面板</span>
                        <span id="control-panel-toggle-icon" style="color:#5b7a66;">▼</span>
                    </div>
                    <div id="control-panel-content" style="display:flex; flex-direction:column; gap:8px;">
                    <div style="font-weight:bold;margin-bottom:4px;font-size:13px;color:#9c302f;">地图切换</div>
                    
                    <button id="btn-source-esri" style="padding:6px;cursor:pointer;background:transparent;color:#1d3326;border:1px solid rgba(125,111,90,0.5);border-radius:4px;font-weight:bold;font-family:inherit;transition:all 0.2s;">
                        ⛰️ 立体地形 (ESRI)
                    </button>
                    
                    <button id="btn-source-local" style="padding:6px;cursor:pointer;background:transparent;border:1px solid rgba(125,111,90,0.5);border-radius:4px;color:#5b7a66;font-family:inherit;transition:all 0.2s;">
                        🗺️ 原始地图 (Local)
                    </button>
                    
                    <hr style="margin:4px 0;width:100%;border:0;border-top:1px dashed rgba(125, 111, 90, 0.4);">
                    
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#5b7a66;">
                        <input type="checkbox" id="chk-hillshade"> 
                        <b style="color:#1d3326;">📐 开启山体高度增强</b>
                    </label>

                    <div id="hillshade-controls" style="margin-left:20px;display:flex;flex-direction:column;gap:4px;">
                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            立体强度 (Z-Factor) <span id="val-z">25.0</span>
                        </label>
                        <input type="range" id="rng-z" min="10.0" max="40.0" step="1.0" value="25.0" style="width:120px;">
                        
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

                    <hr style="margin:8px 0;width:100%;border:0;border-top:1px solid #eee;">
                    
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#333;margin-bottom:4px;">
                        <input type="checkbox" id="chk-style" checked> 
                        <b>🎨 开启美术滤镜</b>
                    </label>

                    <div id="style-controls" style="margin-left:20px;display:flex;flex-direction:column;gap:4px;">
                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            复古做旧 (Sepia) <span id="val-sep">10%</span>
                        </label>
                        <input type="range" id="rng-sep" min="0" max="100" step="5" value="10" style="width:120px;">

                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            色彩饱和 (Sat) <span id="val-sat">100%</span>
                        </label>
                        <input type="range" id="rng-sat" min="0" max="200" step="10" value="100" style="width:120px;">
                        
                        <label style="font-size:11px;color:#666;display:flex;justify-content:space-between;">
                            对比度 (Con) <span id="val-con">110%</span>
                        </label>
                        <input type="range" id="rng-con" min="50" max="200" step="5" value="110" style="width:120px;">
                    </div>

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
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#1565c0;margin-top:4px;">
                        <input type="checkbox" id="chk-land-sea"> 
                        <b>🌊 陆海视图</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#795548;margin-top:4px;">
                        <input type="checkbox" id="chk-city-texture" checked> 
                        <b>🏰 开启城市贴图</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#9c27b0;margin-top:4px;">
                        <input type="checkbox" id="chk-showcase"> 
                        <b>♟️ 开启兵种展示</b>
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
                        <b>🛤️ 道路编辑 (NE)</b>
                    </label>

                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#C62828;margin-top:4px;">
                        <input type="checkbox" id="chk-editor-army">
                        <b>⚔ 军队编辑</b>
                    </label>

                    <a href="/portrait-tuner.html" target="_blank" rel="noopener"
                       style="display:block;margin-top:6px;font-size:13px;color:#8E24AA;text-decoration:none;">
                        🖼 立绘调校（新标签页）
                    </a>
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
            if (panelHeader && panelContent && toggleIcon) {
                panelHeader.addEventListener('click', () => {
                    if (panelContent.style.display === 'none') {
                        panelContent.style.display = 'flex';
                        toggleIcon.innerText = '▼';
                    } else {
                        panelContent.style.display = 'none';
                        toggleIcon.innerText = '◀';
                    }
                });
            }

            const btnEsri = document.getElementById('btn-source-esri');
            const btnLocal = document.getElementById('btn-source-local');
            const chkHillshade = document.getElementById('chk-hillshade') as HTMLInputElement;
            const chkRiver = document.getElementById('chk-river') as HTMLInputElement;

            if (btnEsri) btnEsri.addEventListener('click', () => this.setMapSource('ESRI_SHADED'));
            if (btnLocal) btnLocal.addEventListener('click', () => this.setMapSource('LOCAL'));

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



            // Style Sliders
            const chkStyle = document.getElementById('chk-style') as HTMLInputElement;
            const styleControls = document.getElementById('style-controls');

            const rngSep = document.getElementById('rng-sep') as HTMLInputElement;
            const rngSat = document.getElementById('rng-sat') as HTMLInputElement;
            const rngCon = document.getElementById('rng-con') as HTMLInputElement;
            const valSep = document.getElementById('val-sep');
            const valSat = document.getElementById('val-sat');
            const valCon = document.getElementById('val-con');

            const updateStyle = () => {
                const isEnabled = chkStyle ? chkStyle.checked : false;

                if (styleControls) {
                    styleControls.style.display = isEnabled ? 'flex' : 'none';
                }

                const pane = this.map.getPane('tilePane');
                if (pane) {
                    if (isEnabled) {
                        const sep = rngSep.value;
                        const sat = rngSat.value;
                        const con = rngCon.value;

                        if (valSep) valSep.innerText = sep + '%';
                        if (valSat) valSat.innerText = sat + '%';
                        if (valCon) valCon.innerText = con + '%';

                        pane.style.filter = `sepia(${sep}%) saturate(${sat}%) contrast(${con}%)`;
                    } else {
                        pane.style.filter = 'none';
                    }
                }
            };

            // Init Default Style
            updateStyle();

            if (chkStyle) chkStyle.addEventListener('change', updateStyle);
            if (rngSep) { rngSep.addEventListener('input', updateStyle); rngSep.addEventListener('change', updateStyle); }
            if (rngSat) { rngSat.addEventListener('input', updateStyle); rngSat.addEventListener('change', updateStyle); }
            if (rngCon) { rngCon.addEventListener('input', updateStyle); rngCon.addEventListener('change', updateStyle); }

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

            const chkLandSea = document.getElementById('chk-land-sea') as HTMLInputElement;
            if (chkLandSea) {
                chkLandSea.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-land-sea-layer', {
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

            const chkShowcase = document.getElementById('chk-showcase') as HTMLInputElement;
            if (chkShowcase) {
                chkShowcase.addEventListener('change', (e: any) => {
                    window.dispatchEvent(new CustomEvent('toggle-showcase-units', {
                        detail: { visible: e.target.checked }
                    }));
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
