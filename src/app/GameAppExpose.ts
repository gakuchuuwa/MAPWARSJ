import { getGlobalUnitRenderer } from '../map/UnitRenderer';
import type { GameApp } from './GameApp';

/** 调试/编辑器脚本使用的 window 全局挂载 */
export function exposeGameAppGlobals(app: GameApp): void {
    const win = window as any;
    win.game = app;
    win.gameMap = app.map;
    win.speedOverlay = app.speedOverlay;
    win.timeSystem = app.timeSystem;
    win.combatSystem = app.combatSystem;
    win.audioManager = app.audioManager;
    win.eventEditor = app.eventEditor;
    win.perfMonitor = app.perfMonitor;
    win.perMonitor = app.perfMonitor;
    win.getGlobalUnitRenderer = () => getGlobalUnitRenderer();
    win.cityManager = app.cityManager;
    win.siegeManager = app.historicalEventManager?.getSiegeManager();
}
