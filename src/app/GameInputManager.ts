import { GameMap } from '../map/GameMap';
import { SpeedOverlayRenderer } from '../map/SpeedOverlayRenderer';
import { VectorRoadEditor } from '../roads/VectorRoadEditor';
import { CityEditor } from '../editors/CityEditor';
import { CityManager } from '../world/CityManager';
import { GameUIManager } from './GameUIManager';
import { GridSystem } from '../systems/GridSystem';
import * as L from 'leaflet';
import { EventEditor } from '../editors/EventEditor';
import { TargetEvaluator } from '../ai/TargetEvaluator';

export class GameInputManager {
    private map: GameMap;
    private speedOverlay: SpeedOverlayRenderer;
    private roadEditor: VectorRoadEditor;
    private cityEditor: CityEditor;
    private cityManager: CityManager;
    private uiManager: GameUIManager;
    private eventEditor: EventEditor;

    private lastMouseMoveTime: number = 0;

    constructor(
        map: GameMap,
        speedOverlay: SpeedOverlayRenderer,
        roadEditor: VectorRoadEditor,
        cityEditor: CityEditor,
        cityManager: CityManager,
        uiManager: GameUIManager,
        eventEditor: EventEditor
    ) {
        this.map = map;
        this.speedOverlay = speedOverlay;
        this.roadEditor = roadEditor;
        this.cityEditor = cityEditor;
        this.cityManager = cityManager;
        this.uiManager = uiManager;
        this.eventEditor = eventEditor;

        this.bindEvents();
    }

    private bindEvents() {
        const leafletMap = this.map.getLeafletMap();

        // 1. Map Click
        leafletMap.on('click', (e: L.LeafletMouseEvent) => {
            // 编辑器优先级：Speed Editor > City Editor > Event Editor
            if (this.speedOverlay.isEditing) return;
            if (this.cityEditor && this.cityEditor.isPickingLocation()) return;
            if (this.eventEditor && this.eventEditor.isPickingLocation()) {
                this.eventEditor.handleMapClick(e.latlng);
                return;
            }
        });

        // 2. Mouse Move (Throttled UI Update)
        leafletMap.on('mousemove', (e: L.LeafletMouseEvent) => {
            const now = Date.now();
            if (now - this.lastMouseMoveTime < 50) return; // Throttle 50ms
            this.lastMouseMoveTime = now;

            const { lat, lng } = e.latlng;
            this.uiManager.updateCursorInfo(lat, lng);

            // Edit Mode Preview
            if (this.speedOverlay.isEditing) {
                // Determine logic for hover preview if needed, usually handled by SpeedOverlayRenderer internally via its own listener
                // But if SpeedOverlayRenderer relies on manual calls, add here.
                // Assuming SpeedOverlayRenderer has its own listeners as seen in previous code analysis.
            }
        });

        // 2.5 Right-Click: Pick Coordinates for Editors
        leafletMap.on('contextmenu', (e: L.LeafletMouseEvent) => {
            e.originalEvent.preventDefault(); // Prevent browser context menu

            const { lat, lng } = e.latlng;
            const coordStr = `lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)},`;
            (window as any).pickedCoords = { lat, lng };

            // Show Toast notification
            const toast = document.createElement('div');

            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(coordStr).catch(err => console.error('Clipboard write failed', err));
                toast.innerText = `📍 已复制坐标: ${coordStr}`;
            } else {
                toast.innerText = `📍 已拾取: ${coordStr} (无法自动复制)`;
            }
            toast.style.cssText = `
                position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
                background: rgba(0,188,212,0.95); color: white; padding: 12px 24px;
                border-radius: 8px; z-index: 9999; font-size: 14px; font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);

            console.log('[GameInputManager] Picked coords:', lat.toFixed(4), lng.toFixed(4));
        });

        // 3. City Click
        this.cityManager.setOnCityClick((city: any, e?: any) => {
            // Priority 1: Event Editor Picking (Modal State)
            if (this.eventEditor && this.eventEditor.isPickingLocation()) {
                if (this.eventEditor.handleCityClick(city.id)) return;
            }

            // Priority 2: City Editor
            if (this.cityEditor && this.cityEditor.isEditMode()) {
                this.cityEditor.selectCityForEdit(city);
                return;
            }

            // this.cityEditor.selectCityForEdit(city);

            // Handle City Click Move (Logic from GameApp)
            // If friendly city -> Move to it?
            // If enemy city -> Attack it?
            // This logic was "handleCityClickMove" in GameApp.
            // For now, let's replicate the basic move logic here or call a delegate.
            // Since "handleCityClickMove" was just moving player, we implementation it here.

            // 大乱斗沙盒模式：点击敌对城池设为 AI 战略攻坚目标（自动战斗模式无 UI 提示）
            const playerFaction = TargetEvaluator.playerFactionId;
            if (city.factionId !== playerFaction) {
                TargetEvaluator.playerStrategicTargetId = city.id;
                console.log(`⚔️ 战略目标已设定: ${city.name}`);
            }
        });

        // 5. Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if in input
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            const step = 20; // pixels
            const map = this.map.getLeafletMap();

            switch (e.key.toLowerCase()) {
                case 'w': map.panBy([0, -step]); break;
                case 's': map.panBy([0, step]); break;
                case 'a': map.panBy([-step, 0]); break;
                case 'd': map.panBy([step, 0]); break;
                case 'h':
                    // Reset Camera / Help
                    this.map.flyTo({ lat: 34.5, lng: 112.5 }, 2, { zoom: 6 });
                    break;
            }

            // [NEW] WASD 移动时取消军团跟随
            if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                const game = (window as any).game;
                if (game?.cameraFollowUI?.isFollowing()) {
                    game.cameraFollowUI.cancelFollow();
                }
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                if (this.speedOverlay.isEditing) {
                    this.speedOverlay.undo();
                }
            } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
                if (this.speedOverlay.isEditing) {
                    this.speedOverlay.redo();
                }
            }
        });
    }

    public handleBattleEnd(result: string, opponent: any) {
        // Logic moved from GameApp
        console.log(`Battle Ended: ${result}`);
        // Maybe show modal via UI Manager?
        // uiManager.showBattleResult(result);
    }
}
