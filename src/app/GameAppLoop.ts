import L from 'leaflet';
import { GameTime } from './GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { CityAssetManager } from '../assets/CityAssetManager';
import type { GameApp } from './GameApp';

/** 与 VectorRoadEditor.LOCKED_ZOOM / AGENTS.md 地图缩放锁定一致 */
const LOCKED_MAP_ZOOM = 9;
/** 跟随镜头：小于此距离视为已对准，不再 setView（避免静止时微抖） */
const FOLLOW_RECENTER_DEADZONE_M = 120;
/** 距离过大（切换跟随目标等）时直接吸附，不做插值 */
const FOLLOW_SNAP_DISTANCE_M = 12000;
/** 每帧向目标追近的比例（指数平滑；越大跟得越紧，越小越柔） */
const FOLLOW_LERP_FACTOR = 0.22;
/** 跟随中重复插队旗号优先（毫秒），避免每帧 setView 刷屏 */
const FOLLOW_FLAG_PRIORITY_INTERVAL_MS = 600;
let lastFollowFlagPriorityKick = 0;

/**
 * 单帧主循环（日历 / 事件 / 战斗 / AI / 招募 / 战斗 UI / 跟随镜头）。
 * 从 GameApp 抽出以便第二期继续拆分启动与编辑器绑定。
 */
/**
 * 仅推进游戏逻辑，不排队下一帧 rAF。
 * 供后台心跳调用：rAF 被节流/停止时（切 tab、最小化、窗口被遮挡）持续推进推演。
 * 不在此处调 requestAnimationFrame，避免 tab 恢复时积压回调爆发。
 */
export function tickGameLogicOnly(app: GameApp, timestamp: number): void {
    const rawDelta = (timestamp - app.lastFrameTime) / 1000;
    const deltaTime = Math.min(rawDelta, 0.1);
    app.lastFrameTime = timestamp;
    try {
        if (app.timeSystem.isGamePaused() || !app.cityManager) return;
        const gameDelta = GameTime.toGameDelta(deltaTime, app.timeSystem.getSpeed());
        app.timeSystem.update(gameDelta);
        app.cityManager.updateYear(app.timeSystem.getYear());
        if (app.historicalEventManager) {
            app.historicalEventManager.updateLegions(gameDelta);
            app.historicalEventManager.updateEvents(gameDelta);
        }
        if (app.combatSystem) app.combatSystem.update(gameDelta);
        if (app.aiController) app.aiController.update();
        if (app.recruitmentSystem) app.recruitmentSystem.update(gameDelta);
    } catch (error) {
        console.error('❌ Background Tick Error:', error);
    }
}

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
            const _tA = performance.now();
            app.timeSystem.update(gameDelta);
            const _tB = performance.now();
            app.cityManager.updateYear(app.timeSystem.getYear());
            const _tC = performance.now();
            perfMonitor.noteAsyncWork('timeUpdate', _tB - _tA);
            perfMonitor.noteAsyncWork('cityUpdateYear', _tC - _tB);
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
            const followedId = app.cameraFollowUI.getFollowedArmyId();
            if (followedId && legionManager) {
                const lMap = app.map.getLeafletMap();
                const followedArmy = legionManager.getLegionById(followedId);
                app.audioManager.syncFollowedLegionAudio({
                    armyId: followedArmy && !followedArmy.isDestroyed ? followedId : null,
                    marching: followedArmy?.isMarching?.() ?? false,
                    inCombat: followedArmy?.getIsInCombat?.() ?? false,
                });
                app.cameraFollowUI.tickFollowCamera(
                    (id) => legionManager.getLegionById(id),
                    (pos) => {
                        const target = L.latLng(pos.lat, pos.lng);
                        if (lMap.getZoom() !== LOCKED_MAP_ZOOM) {
                            lMap.setView(target, LOCKED_MAP_ZOOM, { animate: false });
                            return;
                        }
                        const center = lMap.getCenter();
                        const dist = center.distanceTo(target);
                        if (dist <= FOLLOW_RECENTER_DEADZONE_M) return;
                        if (dist >= FOLLOW_SNAP_DISTANCE_M) {
                            lMap.setView(target, LOCKED_MAP_ZOOM, { animate: false });
                            return;
                        }
                        // 每帧向目标插值一小段（指数平滑追踪）：
                        // 比「攒距离整步跳」平滑，比 panTo 动画叠加可控。
                        const next = L.latLng(
                            center.lat + (target.lat - center.lat) * FOLLOW_LERP_FACTOR,
                            center.lng + (target.lng - center.lng) * FOLLOW_LERP_FACTOR,
                        );
                        lMap.setView(next, LOCKED_MAP_ZOOM, { animate: false });
                    }
                );
                const now = performance.now();
                if (now - lastFollowFlagPriorityKick >= FOLLOW_FLAG_PRIORITY_INTERVAL_MS) {
                    lastFollowFlagPriorityKick = now;
                    const army = followedArmy;
                    if (army) {
                        CityAssetManager.prioritizeFollowedFaction(army.getFactionId());
                    }
                }
            } else {
                app.audioManager.syncFollowedLegionAudio({
                    armyId: null,
                    marching: false,
                    inCombat: false,
                });
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
