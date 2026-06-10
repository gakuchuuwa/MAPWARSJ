import L from 'leaflet';

import { GameMap } from '../map/GameMap';
import { GridSystem, Hex } from '../systems/GridSystem';
import { TerrainSpeedSystem, TerrainSpeed } from '../core/TerrainSpeedSystem';
import { TerrainOverrideManager } from '../core/TerrainOverrideManager';
import { LandSeaSystem } from '../world/land-sea';
import { gameLog } from '../utils/GameLogger';

interface HistoryEntry {
    changes: Map<string, TerrainSpeed | null>;
    timestamp: number;
}

export type ToolType = 'paint-normal' | 'paint-slow' | 'paint-water' | 'paint-ocean' | 'eraser';
export type BrushSize = 1 | 7 | 19;

export class SpeedOverlayRenderer {
    private map: L.Map;
    private layerGroup: any;
    private highlightLayer: any;
    private canvasRenderer: L.Canvas; // [OPTIMIZATION] Shared Canvas Renderer
    private isVisible: boolean = false;
    /** 陆海二元视图：只突出显示海域 hex，陆地 hex 隐藏 */
    private landSeaViewMode: boolean = false;
    private centerPoint = { lat: 34.26, lng: 108.94 };

    private isEditMode: boolean = false;
    private toolType: ToolType = 'paint-normal';
    private brushSize: BrushSize = 1;

    private overrideManager: TerrainOverrideManager;

    private history: HistoryEntry[] = [];
    private historyIndex: number = -1;
    private maxHistorySize: number = 50;

    constructor(gameMap: GameMap, overrideManager: TerrainOverrideManager) {
        this.map = gameMap.getLeafletMap();
        this.overrideManager = overrideManager;
        this.layerGroup = L.layerGroup();
        this.highlightLayer = L.layerGroup();

        // [OPTIMIZATION] Use Canvas renderer for thousands of polygons
        this.canvasRenderer = L.canvas({ padding: 0.5 });

        this.map.on('click', (e: any) => {
            this.handleMapClick(e);
        });

        this.map.on('mousemove', (e: any) => {
            if (this.isEditMode) {
                this.showHoverPreview(e);
            }
        });

        window.addEventListener('land-sea-tiles-updated', () => {
            if (this.isVisible && this.landSeaViewMode) {
                this.render();
            }
        });
        window.addEventListener('land-terrain-tiles-updated', () => {
            if (this.isVisible && !this.landSeaViewMode) {
                this.render();
            }
        });

        gameLog('startup', '🎨 SpeedOverlayRenderer 已初始化');
    }

    public toggle(): void {
        this.isVisible = !this.isVisible;
        this.setVisible(this.isVisible);
    }

    public setVisible(visible: boolean): void {
        this.isVisible = visible;
        if (this.isVisible) {
            this.render();
            // 确保图层被添加到地图
            if (!this.map.hasLayer(this.layerGroup)) {
                this.map.addLayer(this.layerGroup);
            }
            console.log('🗺️ 速度覆盖层: 开启');
        } else {
            if (this.map.hasLayer(this.layerGroup)) {
                this.map.removeLayer(this.layerGroup);
            }
            console.log('🗺️ 速度覆盖层: 关闭');
        }
    }

    public toggleEditMode(): boolean {
        this.isEditMode = !this.isEditMode;
        if (this.isEditMode) {
            this.map.addLayer(this.highlightLayer);
            if (!this.isVisible) {
                this.toggle();
            }
        } else {
            this.map.dragging.enable();
            this.map.removeLayer(this.highlightLayer);
            this.clearHoverPreview();
        }
        return this.isEditMode;
    }

    public get isEditing(): boolean {
        return this.isEditMode;
    }

    public isShowing(): boolean {
        return this.isVisible;
    }

    public isLandSeaView(): boolean {
        return this.landSeaViewMode;
    }

    /** 开启/关闭陆海视图（自动打开覆盖层） */
    public setLandSeaViewMode(enabled: boolean): void {
        this.landSeaViewMode = enabled;
        if (enabled && !this.isVisible) {
            this.setVisible(true);
        }
        if (this.isVisible) {
            this.render();
        }
        console.log(`🌊 陆海视图: ${enabled ? '开启' : '关闭'}`);
    }

    public setToolType(type: ToolType): void {
        this.toolType = type;
        console.log(`🛠️ 工具类型: ${type}`);
    }

    public setBrushSize(size: BrushSize): void {
        this.brushSize = size;
        console.log(`🖌️ 画笔大小: ${size}`);
    }

    public getToolType(): ToolType {
        return this.toolType;
    }

    public getBrushSize(): BrushSize {
        return this.brushSize;
    }

    public setToolMode(mode: 'pan' | 'paint'): void {
        if (mode === 'pan') {
            this.map.dragging.enable();
        }
        console.log(`🛠️ 工具模式: ${mode}`);
    }

    public exportData(): void {
        const data = this.overrideManager.exportData();
        console.log('📋 地形覆盖数据导出:', data);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mapwar_terrain_save_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    public importData(file: File): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                this.overrideManager.loadData(data);
                this.overrideManager.save(); // Also save to local storage
                this.render();
                alert(`✅ 成功读取存档！\n共加载了 ${Object.keys(data).length} 个地形修改数据。`);
            } catch (error) {
                console.error('Import failed:', error);
                alert('❌ 读取存档失败：文件格式不正确');
            }
        };
        reader.readAsText(file);
    }

    public exportAllTerrain(): void {
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        const centerLat = 34.26;

        const result: any = {};
        const minQ = -50;
        const maxQ = 50;
        const minR = -50;
        const maxR = 50;

        for (let q = minQ; q <= maxQ; q++) {
            for (let r = minR; r <= maxR; r++) {
                const center = GridSystem.axialToLatLng(q, r);
                const speedType = TerrainSpeedSystem.getHexSpeed({ lat: center.lat, lng: center.lng }, { q, r });
                const key = `${q},${r}`;
                result[key] = speedType;
            }
        }

        const dataStr = JSON.stringify(result, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `terrain_full_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('🗺️ 完整地形导出完成');
    }

    public save(): void {
        this.overrideManager.save();
        alert(`✅ 保存成功！\n\n已保存 ${this.overrideManager.getOverrideCount()} 个地形修改记录到浏览器缓存。\n下次刷新页面时会自动加载。`);
    }

    public saveQuietly(): void {
        this.overrideManager.save();
        console.log('💾 退出编辑模式，自动保存数据');
    }

    public update(): void {
        if (this.isVisible) {
            this.render();
        }
    }

    private render(): void {
        this.layerGroup.clearLayers();

        const zoom = this.map.getZoom();
        if (zoom < 9) {
            console.log('⚠️ 缩放级别过低，请放大地图');
            return;
        }

        const bounds = this.map.getBounds();
        const hexCenters = GridSystem.getHexesInBounds(bounds, this.centerPoint);

        if (hexCenters.length > 1000) {
            console.warn('⚠️ 视野内六边形过多，请继续放大地图');
            return;
        }

        // console.log(`🎨 开始渲染 ${hexCenters.length} 个六边形`);

        let greenCount = 0, orangeCount = 0, blueCount = 0, darkBlueCount = 0;

        if (this.landSeaViewMode) {
            LandSeaSystem.prefetchViewport(this.map);
        }

        hexCenters.forEach(center => {
            const hex = GridSystem.latLngToAxial(center.lat, center.lng);

            let hexColor = '#00FF00';
            let fillOpacity = 0.25;
            let strokeOpacity = 0.3;

            if (this.landSeaViewMode) {
                if (!LandSeaSystem.isSeaAt(center)) {
                    return;
                }
                hexColor = '#0088FF';
                fillOpacity = 0.45;
                strokeOpacity = 0.55;
                blueCount++;
            } else {
                const speed = TerrainSpeedSystem.getHexSpeed(center, hex);
                if (speed === TerrainSpeed.NORMAL) {
                    hexColor = '#00FF00';
                    greenCount++;
                } else if (speed === TerrainSpeed.WATER) {
                    hexColor = '#0088FF';
                    blueCount++;
                } else if (speed === TerrainSpeed.OCEAN) {
                    hexColor = '#00008B';
                    darkBlueCount++;
                } else {
                    hexColor = '#FF8800';
                    orangeCount++;
                }
            }

            const polygon = L.polygon(
                GridSystem.getHexagonCorners(center).map((c: any) => [c.lat, c.lng]),
                {
                    color: '#000000',
                    weight: 0.5,
                    fillColor: hexColor,
                    fillOpacity,
                    opacity: strokeOpacity,
                    renderer: this.canvasRenderer // [OPTIMIZATION] Bind to canvas
                }
            );

            polygon.on('click', (e: any) => {
                L.DomEvent.stopPropagation(e);
                if (this.isEditMode) {
                    this.applyOverride(hex);
                }
            });

            polygon.addTo(this.layerGroup);
        });

        // console.log(`✅ 渲染完成 - 绿:${greenCount} | 橙:${orangeCount} | 蓝:${blueCount}`);
    }

    private handleMapClick(e: any): void {
        if (!this.isEditMode) return;
        const { lat, lng } = e.latlng;
        const hex = GridSystem.latLngToAxial(lat, lng);
        this.applyOverride(hex);
    }

    private applyOverride(centerHex: Hex): void {
        const affectedHexes = this.getAffectedHexes(centerHex);
        const changes = new Map<string, TerrainSpeed | null>();

        affectedHexes.forEach(hex => {
            const hexKey = `${hex.q},${hex.r}`;
            const currentOverride = this.overrideManager.getOverride(hex);

            if (this.toolType === 'eraser') {
                if (currentOverride !== null) {
                    this.overrideManager.clearOverride(hex);
                    changes.set(hexKey, null);
                }
            } else if (this.toolType === 'paint-normal') {
                if (currentOverride !== TerrainSpeed.NORMAL) {
                    this.overrideManager.setOverride(hex, TerrainSpeed.NORMAL);
                    changes.set(hexKey, TerrainSpeed.NORMAL);
                }
            } else if (this.toolType === 'paint-slow') {
                if (currentOverride !== TerrainSpeed.SLOW) {
                    this.overrideManager.setOverride(hex, TerrainSpeed.SLOW);
                    changes.set(hexKey, TerrainSpeed.SLOW);
                }
            } else if (this.toolType === 'paint-water') {
                if (currentOverride !== TerrainSpeed.WATER) {
                    this.overrideManager.setOverride(hex, TerrainSpeed.WATER);
                    changes.set(hexKey, TerrainSpeed.WATER);
                }
            } else if (this.toolType === 'paint-ocean') {
                if (currentOverride !== TerrainSpeed.OCEAN) {
                    this.overrideManager.setOverride(hex, TerrainSpeed.OCEAN);
                    changes.set(hexKey, TerrainSpeed.OCEAN);
                }
            }
        });

        if (changes.size > 0) {
            this.addToHistory({ changes, timestamp: Date.now() });
        }
        this.render();
    }

    private getAffectedHexes(centerHex: Hex): Hex[] {
        if (this.brushSize === 1) {
            return [centerHex];
        } else if (this.brushSize === 7) {
            return [
                centerHex,
                { q: centerHex.q + 1, r: centerHex.r - 1 },
                { q: centerHex.q + 1, r: centerHex.r },
                { q: centerHex.q, r: centerHex.r + 1 },
                { q: centerHex.q - 1, r: centerHex.r + 1 },
                { q: centerHex.q - 1, r: centerHex.r },
                { q: centerHex.q, r: centerHex.r - 1 }
            ];
        } else {
            return [
                centerHex,
                { q: centerHex.q + 1, r: centerHex.r - 1 },
                { q: centerHex.q + 1, r: centerHex.r },
                { q: centerHex.q, r: centerHex.r + 1 },
                { q: centerHex.q - 1, r: centerHex.r + 1 },
                { q: centerHex.q - 1, r: centerHex.r },
                { q: centerHex.q, r: centerHex.r - 1 },
                { q: centerHex.q + 2, r: centerHex.r - 2 },
                { q: centerHex.q + 2, r: centerHex.r - 1 },
                { q: centerHex.q + 2, r: centerHex.r },
                { q: centerHex.q + 1, r: centerHex.r + 1 },
                { q: centerHex.q, r: centerHex.r + 2 },
                { q: centerHex.q - 1, r: centerHex.r + 2 },
                { q: centerHex.q - 2, r: centerHex.r + 2 },
                { q: centerHex.q - 2, r: centerHex.r + 1 },
                { q: centerHex.q - 2, r: centerHex.r },
                { q: centerHex.q - 1, r: centerHex.r - 1 },
                { q: centerHex.q, r: centerHex.r - 2 },
                { q: centerHex.q + 1, r: centerHex.r - 2 }
            ];
        }
    }

    private showHoverPreview(e: any): void {
        this.clearHoverPreview();
        const { lat, lng } = e.latlng;
        const centerHex = GridSystem.latLngToAxial(lat, lng);
        const affectedHexes = this.getAffectedHexes(centerHex);

        affectedHexes.forEach(hex => {
            const center = GridSystem.axialToLatLng(hex.q, hex.r);
            const corners = GridSystem.getHexagonCorners(center);

            let color = '#FFFF00';
            if (this.toolType === 'paint-normal') color = '#00FF00';
            else if (this.toolType === 'paint-slow') color = '#FF8800';
            else if (this.toolType === 'paint-water') color = '#0088FF';
            else if (this.toolType === 'paint-ocean') color = '#00008B';
            else if (this.toolType === 'eraser') color = '#FF0000';

            const polygon = L.polygon(
                corners.map((c: any) => [c.lat, c.lng]),
                { color, weight: 2, fillColor: color, fillOpacity: 0.2, opacity: 0.8 }
            );
            polygon.addTo(this.highlightLayer);
        });
    }

    private clearHoverPreview(): void {
        this.highlightLayer.clearLayers();
    }

    private addToHistory(entry: HistoryEntry): void {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(entry);
        this.historyIndex++;
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    public undo(): boolean {
        if (this.historyIndex < 0) return false;
        const entry = this.history[this.historyIndex];
        entry.changes.forEach((newValue, hexKey) => {
            const [q, r] = hexKey.split(',').map(Number);
            const hex = { q, r };
            if (newValue === null) {
                this.overrideManager.setOverride(hex, TerrainSpeed.NORMAL);
            } else {
                this.overrideManager.clearOverride(hex);
            }
        });
        this.historyIndex--;
        this.render();
        return true;
    }

    public redo(): boolean {
        if (this.historyIndex >= this.history.length - 1) return false;
        this.historyIndex++;
        const entry = this.history[this.historyIndex];
        entry.changes.forEach((newValue, hexKey) => {
            const [q, r] = hexKey.split(',').map(Number);
            const hex = { q, r };
            if (newValue !== null) {
                this.overrideManager.setOverride(hex, newValue);
            } else {
                this.overrideManager.clearOverride(hex);
            }
        });
        this.render();
        return true;
    }

    public canUndo(): boolean {
        return this.historyIndex >= 0;
    }

    public canRedo(): boolean {
        return this.historyIndex < this.history.length - 1;
    }

    public getModifiedCount(): number {
        return this.overrideManager.getOverrideCount();
    }

    public setAutoIDEnabled(enabled: boolean): void {
        TerrainSpeedSystem.setAutoIdentificationEnabled(enabled);
        this.render();
    }
}
