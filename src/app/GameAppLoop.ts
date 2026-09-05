import L from 'leaflet';
import { GameTime } from './GameTime';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { perfDoctor } from '../debug/PerfDoctor';
import { marchStutterProbe } from '../debug/MarchStutterProbe';
import { CityAssetManager } from '../assets/CityAssetManager';
import { GameConfig } from '../config/GameConfig';
import type { GameApp } from './GameApp';


/** 跟随镜头：小于此距离视为已对准，不再 setView（避免静止时微抖） */
const FOLLOW_RECENTER_DEADZONE_M = 120;
/** 距离过大（切换跟随目标等）时直接吸附，不做插值 */
const FOLLOW_SNAP_DISTANCE_M = 12000;
/** 每帧向目标追近的比例（指数平滑；越大跟得越紧，越小越柔）。0.22 滞后太大，玩家拐弯时镜头「冲过头再退回来」 */
const FOLLOW_LERP_FACTOR = 0.5;

/**
 * 🔴 [2026-08-31 修「zoom9 行军跟拍一顿一顿」] 跟拍平移的**亚像素残差**。
 *
 * Leaflet 的 `panBy` 把偏移**取整到整像素，小数部分直接丢弃**。实测（zoom9，每帧固定偏移）：
 *   请求 0.20px/帧 → 实际 0，30 帧共走 **0** 像素（应走 6）
 *   请求 0.35px/帧 → 实际 0，30 帧共走 **0** 像素（应走 10.5）
 *   请求 0.49px/帧 → 实际 0，30 帧共走 **0** 像素（应走 14.7）
 *   请求 0.80px/帧 → 实际 1，30 帧走 30（应 24，多跑 25%）
 *
 * 跟拍是指数平滑（`FOLLOW_LERP_FACTOR`），镜头越接近军团、每帧像素增量越小；
 * 一旦低于 0.5px，panBy **什么都不做**，镜头彻底冻住，直到军团漂远到增量过半像素
 * 才猛跳一整格 —— 这就是「行军一顿一顿」。
 * zoom9 尤其明显：1px ≈ 250m，要动镜头得军团偏离中心 **570m 以上**，
 * 而行军是慢慢挪的，大部分帧镜头都是静止的。zoom10（125m/px）像素增量翻倍就跟得上。
 *
 * 解法是整数量化的标准做法：**把丢掉的小数攒到下一帧**，只把整数部分交给 panBy。
 * 平均速度因此精确等于请求速度，顿挫被摊成均匀的 1px 步进。
 */
const followPanResidual = { x: 0, y: 0 };
let lastFollowPanArmyId: string | null = null;

function resetFollowPanResidual(): void {
    followPanResidual.x = 0;
    followPanResidual.y = 0;
}

/** 累积亚像素残差后按整像素平移；1px 内停稳，且绝不越过目标反向修正。 */
function panByAccumulated(
    map: L.Map,
    dx: number,
    dy: number,
    remainingX: number,
    remainingY: number,
): void {
    const settleX = Math.abs(remainingX) < 1;
    const settleY = Math.abs(remainingY) < 1;
    if (settleX) followPanResidual.x = 0;
    if (settleY) followPanResidual.y = 0;
    if (settleX && settleY) return;

    // 🔴 拐弯（移动方向反转）时清零残差：旧方向攒下的小数带到新方向会造成过度转向，
    //    观感就是镜头「退一步」。判据：本帧位移 dx/dy 与残差方向相反。
    if (dx !== 0 && followPanResidual.x !== 0 && Math.sign(dx) !== Math.sign(followPanResidual.x)) followPanResidual.x = 0;
    if (dy !== 0 && followPanResidual.y !== 0 && Math.sign(dy) !== Math.sign(followPanResidual.y)) followPanResidual.y = 0;

    const fx = settleX ? 0 : dx + followPanResidual.x;
    const fy = settleY ? 0 : dy + followPanResidual.y;
    const constrain = (step: number, remaining: number, settled: boolean): number => {
        if (settled || step === 0 || Math.sign(step) !== Math.sign(remaining)) return 0;
        const maxWholePixels = Math.floor(Math.abs(remaining));
        return Math.sign(step) * Math.min(Math.abs(step), maxWholePixels);
    };
    const ix = constrain(Math.round(fx), remainingX, settleX);
    const iy = constrain(Math.round(fy), remainingY, settleY);
    followPanResidual.x = settleX ? 0 : Math.max(-0.499, Math.min(0.499, fx - ix));
    followPanResidual.y = settleY ? 0 : Math.max(-0.499, Math.min(0.499, fy - iy));
    // 都是 0 就别调 panBy —— 省掉一次 pane transform + move 事件广播
    if (ix !== 0 || iy !== 0) map.panBy(L.point(ix, iy), { animate: false });
}
/**
 * 🔴 [2026-09-05 修「人物移动一顿一顿」] 单帧时间步：**下限 0、上限 0.1**。
 *
 * 修前只有上限（`Math.min(rawDelta, 0.1)`），负 delta 会原样传下去，而负 delta 在移动代码里
 * 一律等于「这一段推进整个丢掉」（`moveDist = speed * dt` 为负 → `while (remainingDist > 0)`
 * 一次都不进；13 的 `m.x += dx * spd * dt` 更糟，直接**倒退**）。
 *
 * 负 delta 从哪来（实测，不是推测）：后台心跳 `setupGameAppBackgroundHeartbeat` 与 rAF 主循环
 * **各自**用 `performance.now()` / rAF timestamp 去减同一个 `app.lastFrameTime` 并覆写它。
 * rAF 的 timestamp 是「本帧开始时刻」，在回调真正执行之前就已确定；心跳若在这中间插了一拍，
 * 它写入的是**更晚**的 now，随后执行的 rAF 帧拿旧 timestamp 一减就是负数。
 *
 * 实测（无头 Chrome 11fps，探针挂在 Army.update 上）：
 *   修前 80 个更新帧里 **60 帧 delta 为负、位移被整段丢弃**，只有 20 帧在动，
 *   均速只剩设计值的 30% —— 观感就是主人报的「一顿一顿」；修后零位移帧 0/50、速度比 ≈ 1.0。
 * 心跳阈值同步放宽（见 GameAppBootUtils.BACKGROUND_TICK_THRESHOLD_MS），从根上少触发这种交替。
 * 回归脚本：`node scratch/probe_player_move.mjs`（需先起 dev server）。
 */
function clampFrameDelta(rawDelta: number): number {
    if (!Number.isFinite(rawDelta) || rawDelta <= 0) return 0;
    return Math.min(rawDelta, 0.1);
}

/**
 * [2026-09-05 玩家] 跟随目标解析：玩家单骑不在 LegionManager 里，id 命中玩家就返回玩家本体，
 * 否则按军团查。跟拍/自动缩放/音效都走这一个入口，别再各写一份。
 */
function resolveFollowTarget(app: GameApp, id: string) {
    const hero = app.playerHero;
    if (hero && hero.id === id) return hero.army;
    return app.historicalEventManager?.getLegionManager()?.getLegionById(id);
}
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
    const deltaTime = clampFrameDelta(rawDelta);
    // 🔴 时间戳只许前进：心跳与 rAF 交替时，rAF 的 timestamp 可能早于心跳刚写入的 lastFrameTime，
    //    直接覆盖会让下一拍再算出一个负 delta（见 clampFrameDelta）。
    if (timestamp > app.lastFrameTime) app.lastFrameTime = timestamp;
    try {
        if (app.timeSystem.isGamePaused() || !app.cityManager) {
            // 🔴 [2026-08-10 修死锁] 战术层期间 timeSystem 是暂停的，但战斗必须继续推进。
            // 漏了这一条的后果：标签页不可见（切窗口/切 OBS/最小化）→ rAF 被节流 → 主循环
            // 走到这条后台心跳 → 直接 return → 战斗 elapsed 永远不涨 → 60 秒永远走不完 →
            // 场景不退出 → 暂停不解除 → **整个世界永久卡死**，且 ReloadGate 因场景激活还
            // 挡着热更新，刷都刷不回来。实测采样：elapsed 十次全是 0。
            if (app.cityManager && app.battleScene?.isStrategyPausedByScene()) {
                const sceneDelta = deltaTime * GameConfig.COMBAT.SCENE13_TIME_SCALE;
                app.combatSystem?.update(sceneDelta, app.battleScene.getFollowUnitId());
                // [2026-08-11 13 v2] 后台心跳同样驱动出兵口互攻演出（否则切后台演出停摆，
                // 胜负推不出、场景不退出——与「战术层后台死锁」同族问题）
                app.scene13War?.tick(sceneDelta);
            }
            return;
        }
        const gameDelta = deltaTime;
        app.timeSystem.update(gameDelta);
        app.cityManager.updateYear(app.timeSystem.getYear());
        // [2026-09-03 查行军卡] 这条后台心跳路径此前**一个探针都没有**。
        //   窗口被遮挡/最小化/切到 OBS 时 rAF 被节流，推演全走这里 —— 也就是说
        //   直播常态很可能就在这条路上，测不到等于白测。与 tickGameAppFrame 同名同源。
        const dev = import.meta.env.DEV;
        if (app.historicalEventManager) {
            if (dev) {
                perfDoctor.measure('LegionManager.update(行军)',
                    () => app.historicalEventManager!.updateLegions(gameDelta),
                    'src/legion/LegionManager.ts:update');
            } else {
                app.historicalEventManager.updateLegions(gameDelta);
            }
            app.historicalEventManager.updateEvents(gameDelta);
            // [2026-09-05 玩家] 单骑行军 / 入伍贴军团（大战略未暂停才动；13 期间冻结）
            app.playerHero?.update(gameDelta);
            // [2026-09-05 玩家] 任务跟踪：目标据点易主 → 判成功；军团覆灭 → 判失败
            app.playerQuests?.tick();
        }
        if (app.combatSystem) {
            if (dev) {
                perfDoctor.measure('CombatSystem.update(战斗)',
                    () => app.combatSystem!.update(gameDelta), 'src/combat/CombatSystem.ts:update');
            } else {
                app.combatSystem.update(gameDelta);
            }
        }
        if (app.aiController) {
            if (dev) {
                perfDoctor.measure('AIController.update', () => app.aiController!.update(),
                    'src/ai/AIController.ts:update');
            } else {
                app.aiController.update();
            }
        }
        if (app.recruitmentSystem) {
            if (dev) {
                perfDoctor.measure('RecruitmentSystem.update(募兵)',
                    () => app.recruitmentSystem!.update(gameDelta),
                    'src/systems/RecruitmentSystem.ts:update');
            } else {
                app.recruitmentSystem.update(gameDelta);
            }
        }
    } catch (error) {
        console.error('❌ Background Tick Error:', error);
    }
}

export function tickGameAppFrame(app: GameApp, timestamp: number): void {
    const rawDelta = (timestamp - app.lastFrameTime) / 1000;
    const deltaTime = clampFrameDelta(rawDelta);
    if (timestamp > app.lastFrameTime) app.lastFrameTime = timestamp;

    const perfMonitor = PerformanceMonitor.getInstance();
    perfMonitor.beginFrame();

    try {
        const isPaused = app.timeSystem.isGamePaused();

        if (!isPaused && app.cityManager) {
            const gameDelta = deltaTime;

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
                // [2026-09-03 查行军卡] 军团行军单帧成本 —— 主人报「行军还是卡」，
                //   而此前 PerfDoctor 只测了 AI，行军与绘制两段全是黑的。
                if (import.meta.env.DEV) {
                    perfDoctor.measure('LegionManager.update(行军)',
                        () => app.historicalEventManager!.updateLegions(gameDelta),
                        'src/legion/LegionManager.ts:update');
                } else {
                    app.historicalEventManager.updateLegions(gameDelta);
                }
                perfMonitor.endTimer('legion');
                app.historicalEventManager.updateEvents(gameDelta);
            // [2026-09-05 玩家] 单骑行军 / 入伍贴军团（大战略未暂停才动；13 期间冻结）
            app.playerHero?.update(gameDelta);
            // [2026-09-05 玩家] 任务跟踪：目标据点易主 → 判成功；军团覆灭 → 判失败
            app.playerQuests?.tick();
                perfMonitor.endTimer('historicalEvent');
            }

            if (app.combatSystem) {
                perfMonitor.startTimer('combat');
                if (import.meta.env.DEV) {
                    perfDoctor.measure('CombatSystem.update(战斗)',
                        () => app.combatSystem!.update(gameDelta),
                        'src/combat/CombatSystem.ts:update');
                } else {
                    app.combatSystem.update(gameDelta);
                }
                perfMonitor.endTimer('combat');
            }

            perfMonitor.startTimer('ai');
            if (app.aiController) {
                // [2026-08-31] PerfDoctor 采样：AI 一帧的总成本。
                //   2026-08-31 实测修前 p90 89ms / p99 339ms（五帧一爆预算），根因在
                //   RoadRegistry.findNearestRoadEntry；修后 p90 1.0ms。两条曲线要一起看。
                if (import.meta.env.DEV) {
                    perfDoctor.measure('AIController.update', () => app.aiController!.update(),
                        'src/ai/AIController.ts:update');
                } else {
                    app.aiController.update();
                }
            }
            perfMonitor.endTimer('ai');

            perfMonitor.startTimer('recruitment');
            if (app.recruitmentSystem) {
                app.recruitmentSystem.update(gameDelta);
            }
            perfMonitor.endTimer('recruitment');
        } else if (app.battleScene?.isStrategyPausedByScene()) {
            // ── [2026-08-10 13 独立时钟] 战术层：大地图停着，只有镜头里这场战斗在跑 ──
            // 停的：年历、城池纪年、历史事件、AI 决策、募兵、军团行军（大战略整体冻结）
            // 跑的：只有被跟拍的那一场战斗（军团行军不再放行，见下）
            // [2026-08-16 主人定·含援军] 军团行军一并冻结：进 13 时开战圈（0.35°）内援军
            //   已全部编入（GameAppCombatHooks「开战时编入的援军就是全部、不会有中途加入」），
            //   13 期间放行行军只会让全图无关军团偷跑 60 秒——走到目标城因 AI 冻结傻等、
            //   途中撞敌因其他战斗冻结傻站。彻底定格 = 大战略 100% 冻结、时钟不再割裂。
            // 战术层走**真实秒**，不乘游戏倍速：主人定「13 战斗固定 1 分钟」，
            // 乘倍速的话开 4x 就变成 15 秒，固定时长就名存实亡了。
            const sceneDelta = deltaTime * GameConfig.COMBAT.SCENE13_TIME_SCALE;
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
            app.combatUI.update(1);
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
                                bf.customTitle ?? (bf.type === 'siege' ? (bf.siegeCityId ? `${app.cityManager.getCity(bf.siegeCityId)?.name ?? ''} 攻防战` : '攻城战') : `${app.cityManager.getFactionName(bf.getAttackerFactionId())} 大战 ${app.cityManager.getFactionName(bf.getDefenderFactionId())}`),
                                '', false, bf.targetDuration, 1, bf,
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
            if (followedId !== lastFollowPanArmyId) {
                resetFollowPanResidual();
                lastFollowPanArmyId = followedId;
            }
            // 独立战斗画布激活时冻结战略地图的自动缩放与普通跟拍。
            const sceneActive = !!app.battleScene?.isActive();
            if (followedId && legionManager) {
                const lMap = app.map.getLeafletMap();
                const followedArmy = resolveFollowTarget(app, followedId);

                // ── 自动缩放（ZoomController）──
                // 规则见 ZoomController 文件头（2026-09-01 主人重定）：
                //   跟随新军团 → 8；战略地图上一开打就切（海战 10 / 陆地战 9，攻城算陆地战）；
                //   战术层 13 期间冻结；战斗结束不再切。
                // ── 自动缩放/镜头自动跟随总开关（调试面板「🔍 自动缩放」）──
                // 关闭后：战略层不自动缩放（ZoomController 停）也不自动跟拍（tickFollowCamera 停），
                // 镜头完全交给玩家手动控制，除非玩家自己操作。开启时行为保持不变。
                const autoCtrl = app.zoomController.enabled;
                if (autoCtrl) app.zoomController.tick();

                if (!sceneActive) {
                    if (!autoCtrl) {
                        resetFollowPanResidual();   // 关闭自动缩放：镜头冻结，交给玩家手动控制
                    } else {
                        app.cameraFollowUI.tickFollowCamera(
                        (id) => resolveFollowTarget(app, id),
                        (pos) => {
                            const target = L.latLng(pos.lat, pos.lng);
                            const currentZoom = lMap.getZoom();
                            const center = lMap.getCenter();
                            const dist = center.distanceTo(target);
                            // [2026-09-03] 行军顿挫探针 —— 🔴 必须放在三条分支**之前**（死区 return / 吸附 setView
                            //   走不到 panByAccumulated，而它们恰恰最像「一顿一顿」）。
                            // 🔴 修：探针原先只挂在下面「战斗画布激活」的 else 分支，战略地图正常跟拍这条主路
                            //   从没调过它，所以 scratch/stuck_legion_log.jsonl 一条都没有。
                            if (import.meta.env.DEV) {
                                const fa = legionManager.getLegionById(followedId);
                                if (fa) {
                                    marchStutterProbe.sample(
                                        followedId, fa.name,
                                        lMap.project(target, currentZoom),
                                        lMap.project(center, currentZoom),
                                        {
                                            lat: +pos.lat.toFixed(4), lng: +pos.lng.toFixed(4),
                                            onSea: !!(fa as any).isOnSea, zoom: currentZoom,
                                            branch: dist <= FOLLOW_RECENTER_DEADZONE_M ? 'deadzone'
                                                : dist >= FOLLOW_SNAP_DISTANCE_M ? 'snap' : 'lerp',
                                            site: 'main',
                                            gapM: Math.round(dist),
                                            countCities: (deg: number) => legionManager.getSpatialRegistry()
                                                .getCitiesInRadius(pos.lat, pos.lng, deg).length,
                                        },
                                    );
                                }
                            }
                            if (dist <= FOLLOW_RECENTER_DEADZONE_M) {
                                resetFollowPanResidual();
                                return;
                            }
                            if (dist >= FOLLOW_SNAP_DISTANCE_M) {
                                resetFollowPanResidual();   // 吸附后残差作废
                                lMap.setView(target, currentZoom, { animate: false });
                                return;
                            }
                            // 每帧向目标插值一小段（指数平滑追踪）：
                            // 比「攒距离整步跳」平滑，比 panTo 动画叠加可控。
                            const next = L.latLng(
                                center.lat + (target.lat - center.lat) * FOLLOW_LERP_FACTOR,
                                center.lng + (target.lng - center.lng) * FOLLOW_LERP_FACTOR,
                            );
                            // [2026-08-28 修卡顿] 像素级 panBy 替代 setView：setView 每帧触发 Leaflet
                            // _resetView（全量重定位领土 SVG + 据点 DOM + 河流 path），跟拍实测帧时间
                            // ~30ms→~43ms。panBy 只 transform 各 pane（O(1)），不触发 _resetView，
                            // 跟拍帧时间回落到 ~28ms。吸附（>12km）仍走 setView，见上。
                            const _p1 = lMap.project(center, currentZoom);
                            const _p2 = lMap.project(next, currentZoom);
                            const _targetPx = lMap.project(target, currentZoom);
                            panByAccumulated(
                                lMap,
                                _p2.x - _p1.x,
                                _p2.y - _p1.y,
                                _targetPx.x - _p1.x,
                                _targetPx.y - _p1.y,
                            );
                        }
                    );
                    }
                } else {
                    // 场景激活 → 不跑战略地图跟拍/自动缩放，只维护战斗场景生命周期。
                    resetFollowPanResidual();
                    app.battleScene?.tick();
                    // [2026-08-11 战败停留] 13 演出已停（战斗结束、画面冻结在待命态）时，
                    // 放行普通跟拍逻辑：tickFollowCamera 看到军团阵亡会启动 FOLLOW_SWITCH_DELAY_MS
                    // 延迟 → 到期切回玩家。13 画面保持到切换那一刻
                    // （battleScene.tick 内部的 linger 到期才 exit 回 zoom8）。
                    const warStillActive = (window as any).game?.scene13War?.isActive?.() === true;
                    if (!warStillActive) {
                        app.cameraFollowUI.tickFollowCamera(
                            (id) => resolveFollowTarget(app, id),
                            (pos) => {
                                // 🔴 13 场景仍激活（战败停留中）→ 不移动镜头：冻结画面保持到 exit。
                                // 镜头只在 linger 到期 exit（回 zoom8）后才跟着新军团走。
                                if (app.battleScene?.isActive?.()) return;
                                const target = L.latLng(pos.lat, pos.lng);
                                const lMap2 = app.map.getLeafletMap();
                                const currentZoom = lMap2.getZoom();
                                const center = lMap2.getCenter();
                                const dist = center.distanceTo(target);
                                // [2026-09-03] 行军顿挫探针 —— 🔴 必须放在三条分支**之前**：
                                //   死区提前 return（相机冻结）与吸附 setView（相机突跳）这两条路
                                //   压根走不到下面的 panByAccumulated，而它们恰恰是最像「一顿一顿」的两种。
                                if (import.meta.env.DEV) {
                                    const fid = app.cameraFollowUI?.getFollowedArmyId?.();
                                    const fa = fid ? legionManager.getLegionById(fid) : null;
                                    if (fa) {
                                        marchStutterProbe.sample(
                                            fid!, fa.name,
                                            lMap2.project(target, currentZoom),
                                            lMap2.project(center, currentZoom),
                                            {
                                                lat: +pos.lat.toFixed(4), lng: +pos.lng.toFixed(4),
                                                onSea: !!(fa as any).isOnSea, zoom: currentZoom,
                                                branch: dist <= FOLLOW_RECENTER_DEADZONE_M ? 'deadzone'
                                                    : dist >= FOLLOW_SNAP_DISTANCE_M ? 'snap' : 'lerp',
                                                site: 'battleScene',
                                                gapM: Math.round(dist),
                                                // 惰性：只有判定为「顿」时才真去查城，别把诊断本身变成负担
                                                countCities: (deg: number) => legionManager.getSpatialRegistry()
                                                    .getCitiesInRadius(pos.lat, pos.lng, deg).length,
                                            },
                                        );
                                    }
                                }
                                if (dist <= FOLLOW_RECENTER_DEADZONE_M) {
                                    resetFollowPanResidual();
                                    return;
                                }
                                if (dist >= FOLLOW_SNAP_DISTANCE_M) {
                                    resetFollowPanResidual();   // 吸附后残差作废
                                    lMap2.setView(target, currentZoom, { animate: false });
                                    return;
                                }
                                const next = L.latLng(
                                    center.lat + (target.lat - center.lat) * FOLLOW_LERP_FACTOR,
                                    center.lng + (target.lng - center.lng) * FOLLOW_LERP_FACTOR,
                                );
                                // 同上：像素级 panBy 替代 setView，避免每帧 _resetView 全量重定位。
                                const _p1 = lMap2.project(center, currentZoom);
                                const _p2 = lMap2.project(next, currentZoom);
                                const _targetPx = lMap2.project(target, currentZoom);
                                panByAccumulated(
                                    lMap2,
                                    _p2.x - _p1.x,
                                    _p2.y - _p1.y,
                                    _targetPx.x - _p1.x,
                                    _targetPx.y - _p1.y,
                                );
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
                const legion = resolveFollowTarget(app, followedId);
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
