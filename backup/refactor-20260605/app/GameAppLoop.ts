import L from 'leaflet';
import { GameTime } from './GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import type { GameApp } from './GameApp';

/** 与 VectorRoadEditor.LOCKED_ZOOM / AGENTS.md 地图缩放锁定一致 */
const LOCKED_MAP_ZOOM = 9;
/** 跟随镜头：小于此距离不重复 setView，减轻瓦片抖动 */
const FOLLOW_RECENTER_DEADZONE_M = 30;

/**
 * 单帧主循环（日历 / 事件 / 战斗 / AI / 招募 / 战斗 UI / 跟随镜头）。
 * 从 GameApp 抽出以便第二期继续拆分启动与编辑器绑定。
 */
export function tickGameAppFrame(app: GameApp, timestamp: number): void {
    const rawDelta = (timestamp - app.lastFrameTime) / 1000;
    const deltaTime = Math.min(rawDelta, 0.1);
    app.lastFrameTime = timestamp;

    const perfMonitor = PerformanceMonitor.getInstance();
    perfMonitor.beginFrame();

    try {
        const isPaused = app.timeSystem.isGamePaused();

        if (!isPaused && app.cityManager) {
            const gameDelta = GameTime.toGameDelta(deltaTime, app.timeSystem.getSpeed());

            perfMonitor.startTimer('calendar');
            app.timeSystem.update(gameDelta);
            app.cityManager.updateYear(app.timeSystem.getYear());
            perfMonitor.endTimer('calendar');

            if (app.historicalEventManager) {
                perfMonitor.startTimer('historicalEvent');
                perfMonitor.startTimer('legion');
                app.historicalEventManager.updateLegions(gameDelta);
                perfMonitor.endTimer('legion');
                app.historicalEventManager.updateEvents(gameDelta);
                perfMonitor.endTimer('historicalEvent');
            }

            if (app.combatSystem) {
                perfMonitor.startTimer('combat');
                app.combatSystem.update(gameDelta);
                perfMonitor.endTimer('combat');
            }

            perfMonitor.startTimer('ai');
            if (app.aiController) {
                app.aiController.update();
            }
            perfMonitor.endTimer('ai');

            perfMonitor.startTimer('recruitment');
            if (app.recruitmentSystem) {
                app.recruitmentSystem.update(gameDelta);
            }
            perfMonitor.endTimer('recruitment');
        }

        if (app.combatUI) {
            perfMonitor.startTimer('combatUI');
            app.combatUI.update(app.timeSystem.getSpeed());
            perfMonitor.endTimer('combatUI');
        }

        if (app.cameraFollowUI) {
            perfMonitor.startTimer('camera');
            const legionManager = app.historicalEventManager?.getLegionManager();
            if (app.cameraFollowUI.getFollowedArmyId() && legionManager) {
                const lMap = app.map.getLeafletMap();
                app.cameraFollowUI.tickFollowCamera(
                    (id) => legionManager.getLegionById(id),
                    (pos) => {
                        const target = L.latLng(pos.lat, pos.lng);
                        if (lMap.getZoom() !== LOCKED_MAP_ZOOM) {
                            lMap.setView(target, LOCKED_MAP_ZOOM, { animate: false });
                            return;
                        }
                        const dist = lMap.getCenter().distanceTo(target);
                        if (dist <= FOLLOW_RECENTER_DEADZONE_M) return;
                        // 每帧无动画居中：避免 panTo 动画叠加造成背景「一步一步拖」
                        lMap.setView(target, LOCKED_MAP_ZOOM, { animate: false });
                    }
                );
            }
            app.cameraFollowUI.update();
            perfMonitor.endTimer('camera');
        }
    } catch (error) {
        console.error('❌ Game Loop Error:', error);
    }

    perfMonitor.endFrame();
    app.animationFrameId = requestAnimationFrame((t) => app.gameLoop(t));
}
