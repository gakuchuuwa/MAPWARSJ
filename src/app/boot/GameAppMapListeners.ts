import { CityAssetManager } from '../../assets/CityAssetManager';
import { getGlobalUnitRenderer } from '../../map/UnitRenderer';
import { GameConfig } from '../../config/GameConfig';
import type { GameApp } from '../GameApp';

/** 地图面板 toggle 与编辑器开关（从 GameApp 抽出）。 */
export function setupGameAppMapListeners(app: GameApp): void {
    window.addEventListener('toggle-faction-color', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.cityManager) app.cityManager.toggleTerritoryLayer(!!detail?.visible);
    });

    window.addEventListener('toggle-road-layer', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.roadRenderer) app.roadRenderer.toggle(!!detail?.visible);
    });

    window.addEventListener('toggle-terrain-layer', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.speedOverlay) app.speedOverlay.setVisible(!!detail?.visible);
    });

    window.addEventListener('toggle-land-sea-layer', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.speedOverlay) app.speedOverlay.setLandSeaViewMode(!!detail?.visible);
    });

    window.addEventListener('toggle-showcase-units', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        const renderer = getGlobalUnitRenderer();
        if (renderer) renderer.toggleShowcase(!!detail?.visible);
    });

    window.addEventListener('toggle-city-texture', (e: Event) => {
        const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
        if (app.cityManager) app.cityManager.toggleCityTextures(!!detail?.visible);
    });

    window.addEventListener('toggle-editor-city', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        if (app.cityEditor) {
            detail?.enabled ? app.cityEditor.show() : app.cityEditor.hide();
        }
        if (app.cityManager) app.cityManager.setEditorMode(!!detail?.enabled);
    });

    window.addEventListener('toggle-editor-event', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        if (app.eventEditor) {
            detail?.enabled ? app.eventEditor.show() : app.eventEditor.hide();
        }
    });

    window.addEventListener('toggle-editor-road', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        if (app.roadEditor) {
            detail?.enabled ? app.roadEditor.show() : app.roadEditor.hide();
        }
    });

    window.addEventListener('toggle-script-mode', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        app.historicalEventManager?.setScriptModeEnabled(!!detail?.enabled);
    });

    window.addEventListener('toggle-scripted-campaign', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
        GameConfig.SYSTEM.ENABLE_SCRIPTED_CAMPAIGNS = !!detail?.enabled;
    });

    const leaflet = app.map?.getLeafletMap?.();
    if (leaflet) {
        leaflet.on('move', () => CityAssetManager.notifyMapInteraction());
        leaflet.on('zoom', () => CityAssetManager.notifyMapInteraction());
    }
}
