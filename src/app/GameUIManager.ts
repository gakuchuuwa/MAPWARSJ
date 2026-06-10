import { TimeSystem } from './TimeSystem';
import { FactionManager } from '../world/FactionManager';
import { HistoricalEventManager } from '../events/HistoricalEventManager';
import { SpeedOverlayRenderer } from '../map/SpeedOverlayRenderer';
import { TerrainSpeedSystem, TERRAIN_SPEED_CONFIG } from '../core/TerrainSpeedSystem';
import { GridSystem } from '../systems/GridSystem';
export class GameUIManager {
    private uiElements: Record<string, HTMLElement | null> = {};

    private timeSystem: TimeSystem;
    private factionManager: FactionManager;
    private historicalEventManager: HistoricalEventManager;
    private speedOverlay: SpeedOverlayRenderer;

    constructor(
        timeSystem: TimeSystem,
        factionManager: FactionManager,
        historicalEventManager: HistoricalEventManager,
        speedOverlay: SpeedOverlayRenderer
    ) {
        this.timeSystem = timeSystem;
        this.factionManager = factionManager;
        this.historicalEventManager = historicalEventManager;
        this.speedOverlay = speedOverlay;

        this.initializeUIElements();
        this.update();
    }

    private initializeUIElements() {
        this.uiElements = {
            coords: document.getElementById('coords'),
            hexCoords: document.getElementById('hex-coords'),
            terrainType: document.getElementById('terrain-type'),
            hud: document.getElementById('hud'),
            eventDisplay: document.getElementById('event-display')
        };
    }

    public update() {
        // 历史模拟模式下 HUD 无玩家信息显示
    }

    // Called on mouse move from map event directly or via InputManager
    /** HUD 地形：只显示「平原」「山地」等主名，去掉括号说明 */
    private static formatTerrainHudLabel(fullName: string): string {
        const base = fullName.split(/[\s(（]/)[0]?.trim();
        return base || fullName;
    }

    public updateCursorInfo(lat: number, lng: number) {
        if (this.uiElements.coords) {
            this.uiElements.coords.textContent = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        }

        if (this.uiElements.hexCoords) {
            const hex = GridSystem.latLngToAxial(lat, lng);
            this.uiElements.hexCoords.textContent = `${hex.q}, ${hex.r}`;
        }

        if (this.uiElements.terrainType) {
            const dummyHex = { q: 0, r: 0 };
            const speedType = TerrainSpeedSystem.getHexSpeed({ lat, lng }, dummyHex);
            const config = TERRAIN_SPEED_CONFIG[speedType];
            this.uiElements.terrainType.textContent = GameUIManager.formatTerrainHudLabel(config.name);
            this.uiElements.terrainType.style.color = config.color;
        }
    }
}
