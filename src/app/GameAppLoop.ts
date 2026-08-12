import L from 'leaflet';
import { GameTime } from './GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { CityAssetManager } from '../assets/CityAssetManager';
import { GameConfig } from '../config/GameConfig';
import type { GameApp } from './GameApp';


/** 跟随镜头：小于此距离视为已对准，不再 setView（避免静止时微抖） */
const FOLLOW_RECENTER_DEADZONE_M = 120;
/** 距离过大（切换跟随目标等）时直接吸附，不做插值 */
const FOLLOW_SNAP_DISTANCE_M = 12000;
/** 每帧向目标追近的比例（指数平滑；越大跟得越紧，越小越柔） */
const FOLLOW_LERP_FACTOR = 0.22;
/** 跟随中重复插队旗号优先（毫秒），避免每帧 setView 刷屏 */
const FOLLOW_FLAG_PRIORITY_INTERVAL_MS = 600;
let lastFollowFlagPriorityKick = 0;
let lastBgmFollowedId: string | null = null;

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
        if (app.timeSystem.isGamePaused() || !app.cityManager) {
            // 🔴 [2026-08-10 修死锁] 战术层期间 timeSystem 是暂停的，但战斗必须继续推进。
            // 漏了这一条的后果：标签页不可见（切窗口/切 OBS/最小化）→ rAF 被节流 → 主循环
            // 走到这条后台心跳 → 直接 return → 战斗 elapsed 永远不涨 → 60 秒永远走不完 →
            // 场景不退出 → 暂停不解除 → **整个世界永久卡死**，且 ReloadGate 因场景激活还
            // 挡着热更新，刷都刷不回来。实测采样：elapsed 十次全是 0。
            if (app.cityManager && app.battleScene?.isStrategyPausedByScene()) {
                const sceneDelta = deltaTime * GameConfig.COMBAT.SCENE13_TIME_SCALE;
                app.historicalEventManager?.updateLegions(sceneDelta);
                app.combatSystem?.update(sceneDelta, app.battleScene.getFollowUnitId());
                // [2026-08-11 13 v2] 后台心跳同样驱动出兵口互攻演出（否则切后台演出停摆，
                // 胜负推不出、场景不退出——与「战术层后台死锁」同族问题）
                app.scene13War?.tick(sceneDelta);
            }
            return;
        }
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
        } else if (app.battleScene?.isStrategyPausedByScene()) {
            // ── [2026-08-10 13 独立时钟] 战术层：大地图停着，只有镜头里这场战斗在跑 ──
            // 停的：年历、城池纪年、历史事件、AI 决策、募兵（大战略整体冻结）
            // 跑的：① 被跟拍的那一场战斗  ② 军团行军
            //   ②必须放行，否则援军永远走不到战场 —— 双将战「+10s/只」的加时和援军入场
            //   这个高光镜头会整个失效（援军是靠行军抵达的，不是凭空出现）。
            //   代价：暂停期间部队在动但年份不走，逻辑上略怪，视觉上无感（镜头在 13 里）。
            // 战术层走**真实秒**，不乘游戏倍速：主人定「13 战斗固定 1 分钟」，
            // 乘倍速的话开 4x 就变成 15 秒，固定时长就名存实亡了。
            const sceneDelta = deltaTime * GameConfig.COMBAT.SCENE13_TIME_SCALE;
            if (app.historicalEventManager) {
                perfMonitor.startTimer('legion');
                app.historicalEventManager.updateLegions(sceneDelta);
                perfMonitor.endTimer('legion');
            }
            if (app.combatSystem) {
                perfMonitor.startTimer('combat');
                app.combatSystem.update(sceneDelta, app.battleScene.getFollowUnitId());
                perfMonitor.endTimer('combat');
            }
            // [2026-08-11 13 v2] 出兵口互攻演出推进（引擎已冻结，胜负由演出判负写回）
            app.scene13War?.tick(sceneDelta);
        }

        if (app.combatUI) {
            perfMonitor.startTimer('combatUI');
            app.combatUI.update(app.timeSystem.getSpeed());
            perfMonitor.endTimer('combatUI');

            // 每帧检查：跟随军团在战斗中但 UI 未显示 → 补弹
            if (!app.combatUI.isRegionalVisible()) {
                const followedId = app.cameraFollowUI?.getFollowedArmyId();
                if (followedId && app.combatSystem) {
                    // 查区域战
                    for (const bf of app.combatSystem.getActiveBattleFields()) {
                        if (bf.isOver || !bf.hasParticipant(followedId)) continue;
                        const attackers = bf.getAttackerUnits();
                        const defenders = bf.getDefenderUnits();
                        if (attackers.length === 0 || defenders.length === 0) continue;
                        try {
                            app.combatUI.showRegional(
                                attackers, defenders, undefined, undefined,
                                (window as any).__huoqubingBattleTitle ?? bf.customTitle ?? (bf.type === 'siege' ? (bf.siegeCityId ? `${app.cityManager.getCity(bf.siegeCityId)?.name ?? ''} 攻防战` : '攻城战') : `${app.cityManager.getFactionName(bf.getAttackerFactionId())} 大战 ${app.cityManager.getFactionName(bf.getDefenderFactionId())}`),
                                '', false, bf.targetDuration, app.timeSystem.getSpeed(), bf,
                            );
                        } catch (e) { /* ignore */ }
                        break;
                    }
                    // 查 1v1 战斗
                    if (!app.combatUI.isRegionalVisible()) {
                        for (const battle of app.combatSystem.getActiveBattles()) {
                            if (battle.isOver) continue;
                            if (battle.attacker.id !== followedId && battle.defender.id !== followedId) continue;
                            try { app.combatUI.show(battle); } catch (e) { /* ignore */ }
                            break;
                        }
                    }
                }
            }
        }

        if (app.cameraFollowUI) {
            perfMonitor.startTimer('camera');
            const legionManager = app.historicalEventManager?.getLegionManager();
            const followedId = app.cameraFollowUI.getFollowedArmyId();
            // [2026-08-09 独立战斗场景空壳] 场景激活 → 冻结自动切 zoom + 跟拍 panTo
            // （下层地图当静止背景；音频/BGM/banner 照常跑）
            const sceneActive = !!app.battleScene?.isActive();
            if (followedId && legionManager) {
                const lMap = app.map.getLeafletMap();
                const followedArmy = legionManager.getLegionById(followedId);

                if (!sceneActive) {
                    // ── 自动缩放（ZoomController）：行军 8↔9，战斗 10↔11，≥15s ──
                    app.zoomController.tick();

                    app.cameraFollowUI.tickFollowCamera(
                        (id) => legionManager.getLegionById(id),
                        (pos) => {
                            const target = L.latLng(pos.lat, pos.lng);
                            const currentZoom = lMap.getZoom();
                            const center = lMap.getCenter();
                            const dist = center.distanceTo(target);
                            if (dist <= FOLLOW_RECENTER_DEADZONE_M) return;
                            if (dist >= FOLLOW_SNAP_DISTANCE_M) {
                                lMap.setView(target, currentZoom, { animate: false });
                                return;
                            }
                            // 每帧向目标插值一小段（指数平滑追踪）：
                            // 比「攒距离整步跳」平滑，比 panTo 动画叠加可控。
                            const next = L.latLng(
                                center.lat + (target.lat - center.lat) * FOLLOW_LERP_FACTOR,
                                center.lng + (target.lng - center.lng) * FOLLOW_LERP_FACTOR,
                            );
                            lMap.setView(next, currentZoom, { animate: false });
                        }
                    );
                } else {
                    // [2026-08-09 镜头跟随] 场景激活 → 不跑普通跟拍/自动缩放，
                    // 镜头改追将领编队实际渲染中心（battleScene.tick 内部指数平滑）。
                    app.battleScene?.tick();
                    // [2026-08-11 战败停留] 13 演出已停（战斗结束、画面冻结在待命态）时，
                    // 放行普通跟拍逻辑：tickFollowCamera 看到军团阵亡会启动 FOLLOW_SWITCH_DELAY_MS
                    // 延迟 → 到期 followLargestLegion() 切新军团。13 画面保持到切换那一刻
                    // （battleScene.tick 内部的 linger 到期才 exit 回 zoom8）。
                    const warStillActive = (window as any).game?.scene13War?.isActive?.() === true;
                    if (!warStillActive) {
                        app.cameraFollowUI.tickFollowCamera(
                            (id) => legionManager.getLegionById(id),
                            (pos) => {
                                // 🔴 13 场景仍激活（战败停留中）→ 不移动镜头：冻结画面保持到 exit。
                                // 镜头只在 linger 到期 exit（回 zoom8）后才跟着新军团走。
                                if (app.battleScene?.isActive?.()) return;
                                const target = L.latLng(pos.lat, pos.lng);
                                const lMap2 = app.map.getLeafletMap();
                                const currentZoom = lMap2.getZoom();
                                const center = lMap2.getCenter();
                                const dist = center.distanceTo(target);
                                if (dist <= FOLLOW_RECENTER_DEADZONE_M) return;
                                if (dist >= FOLLOW_SNAP_DISTANCE_M) {
                                    lMap2.setView(target, currentZoom, { animate: false });
                                    return;
                                }
                                const next = L.latLng(
                                    center.lat + (target.lat - center.lat) * FOLLOW_LERP_FACTOR,
                                    center.lng + (target.lng - center.lng) * FOLLOW_LERP_FACTOR,
                                );
                                lMap2.setView(next, currentZoom, { animate: false });
                            }
                        );
                    }
                }

                app.audioManager.syncFollowedLegionAudio({
                    armyId: followedArmy && !followedArmy.isDestroyed ? followedId : null,
                    marching: followedArmy?.isMarching?.() ?? false,
                    inCombat: followedArmy?.getIsInCombat?.() ?? false,
                    isCavalry: followedArmy?.isCavalryArmy?.() ?? false,
                    isNaval: followedArmy?.isOnSea ?? false,
                });
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
            // BGM 仅跟随军团切换时播放（不随镜头移动）
            if (followedId && legionManager) {
                const legion = legionManager.getLegionById(followedId);
                const pos = legion?.getPosition();
                if (pos && followedId !== lastBgmFollowedId) {
                    lastBgmFollowedId = followedId;
                    app.audioManager.syncPortraitBgm(legion?.portraitPath, pos.lat, pos.lng);
                }
            } else {
                lastBgmFollowedId = null;
            }
            perfMonitor.endTimer('camera');
        }
    } catch (error) {
        console.error('❌ Game Loop Error:', error);
    }

    perfMonitor.endFrame();
    app.animationFrameId = requestAnimationFrame((t) => app.gameLoop(t));
}
