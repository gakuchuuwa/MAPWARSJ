import { TimeSystem } from './TimeSystem';
import { FactionManager } from '../world/FactionManager';
import { HistoricalEventManager } from '../events/HistoricalEventManager';
import { SpeedOverlayRenderer } from '../map/SpeedOverlayRenderer';
import { TerrainSpeedSystem, TERRAIN_SPEED_CONFIG } from '../core/TerrainSpeedSystem';
import { GridSystem } from '../systems/GridSystem';
import { MARCH_SPEED_MULTIPLIERS } from '../config/GameConfig';

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
    public updateCursorInfo(lat: number, lng: number) {
        if (this.uiElements.coords) {
            this.uiElements.coords.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        if (this.uiElements.hexCoords) {
            const hex = GridSystem.latLngToAxial(lat, lng);
            this.uiElements.hexCoords.textContent = `${hex.q}, ${hex.r}`;
        }

        if (this.uiElements.terrainType) {
            const dummyHex = { q: 0, r: 0 };
            const speedType = TerrainSpeedSystem.getHexSpeed({ lat, lng }, dummyHex);
            const config = TERRAIN_SPEED_CONFIG[speedType];
            const marchMult =
                speedType === 'OCEAN' || speedType === 'WATER'
                    ? MARCH_SPEED_MULTIPLIERS.TERRAIN.sea
                    : speedType === 'SLOW'
                        ? MARCH_SPEED_MULTIPLIERS.TERRAIN.mountain
                        : MARCH_SPEED_MULTIPLIERS.TERRAIN.plain;
            this.uiElements.terrainType.textContent = `${config.name} ×${marchMult}`;
            this.uiElements.terrainType.style.color = config.color;
        }
    }
}
