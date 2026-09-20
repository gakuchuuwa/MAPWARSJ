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
/**
 * 每帧向目标追近的比例（指数平滑；越大跟得越紧，越小越柔）。
 * ⚠️ 历史注释里「0.22 滞后太大、拐弯时冲过头再退回来」是 **dt 归一化之前** 的结论：
 *    那时系数被当成每帧固定值，长帧追过头、短帧追不动，才会来回荡。现在 k 按真实帧长换算，
 *    小系数只是更柔，不会冲过头 —— 别拿那句旧话当作「不能调小」的依据。
 *
 * 🔴 [2026-09-15 修「战略地图玩家移动时画面发抖」] 这个基准值是**按 60fps 一帧**定的，
 *    **不能直接当每帧系数用**，必须经 `followLerpFactor(dt)` 按真实帧长换算 —— 见下。
 *
 * 🔴 [2026-09-16] 「镜头逐帧步长 sd 大（mean 2.17 / sd 2.15px）＝抖」是**错判**，已实测证伪，别再照它改这个值。
 *    稳态下镜头速度必然等于目标速度，每帧位移 = v × dt —— dt 抖多少，步长就抖多少，
 *    这是数学必然，跟 k 无关。实测把 k 调到 0.13 跑同一探针：步长 sd 不降反升（3.50，因为那一跑
 *    dt 更散），而主角屏幕偏移从 mean 1.07/0.40·sd 0.39/0.54px 恶化到 mean -4.4/-4.9·sd 4.1/4.4px
 *    （滞后随速度漂移）。结论：k=0.5 保留；真正要量的是**每毫秒位移的稳定性**和 dt 本身。
 */
const FOLLOW_LERP_BASE_PER_FRAME = 0.5;
/** `FOLLOW_LERP_BASE_PER_FRAME` 对应的参考帧长（60fps 一帧，毫秒） */
const FOLLOW_LERP_REF_FRAME_MS = 1000 / 60;

/**
 * 🔴 [2026-09-15 修「战略地图玩家移动时画面发抖」] 帧率无关的指数平滑系数。
 *
 * **病灶**：原来每帧一律用固定的 0.5 去追目标。指数平滑的语义是「每单位时间衰减固定比例」，
 * 把它当成「每帧固定比例」，追赶速度就直接与帧长成反比 —— 帧长抖多少，镜头追赶量就抖多少。
 *
 * 实测（无头 Chrome，玩家行军 240 帧，scratch/probe_camera_jitter.mjs）：
 *   帧间隔 zoom8 p50=29ms/max=145ms、zoom9 p50=16.5ms/max=192ms —— 最长帧是最短帧的 12 倍。
 *   镜头本身单向平移（零位移帧 0%、方向反转 0~1 次 / 238），**但主角相对镜头中心的屏幕偏移**
 *   zoom8 sd=1.15/1.25px 峰峰 6.4/6.5px、方向反转 41%/44%；
 *   zoom9 sd=1.33/1.46px 峰峰 8.5/8.5px、方向反转 39%/53%。
 *   = 主角在屏幕上以 ±4px 幅度、每两帧换一次方向来回摆 —— 盯着主角看就是「地图在抖」。
 *   zoom9 比 zoom8 更晃：250m/px 下同样航速的像素速度快一倍，抖出来的绝对位移随之翻倍。
 *
 * **解法**（指数平滑的标准写法）：把「每参考帧衰减 (1-k)」换算到真实帧长：
 *   k(dt) = 1 - (1 - k_ref) ^ (dt / refFrame)
 * dt = refFrame 时精确退化为原来的 0.5，行为不变；长帧追得多、短帧追得少，追赶**速度**恒定。
 *
 * 模拟对比（scratch/sim_camera_jitter_causes.mjs，用实测帧间隔分布跑 5000 帧）：
 *   现状（固定 lerp + 整像素）  偏移 sd 1.05px 峰峰 8.74px
 *   仅本修（dt 归一化）         偏移 sd 0.43px 峰峰 2.66px   ← 抖幅降到 ~1/3
 *   再叠分数平移（未做）        偏移 sd 0.25px 峰峰 1.12px
 *
 * dt 上游已由 `clampFrameDelta` 夹到 (0, 0.1]s，这里再夹一次只为防御直接调用。
 */
function followLerpFactor(deltaSeconds: number): number {
    const dtMs = Math.min(100, Math.max(1, deltaSeconds * 1000));
    return 1 - Math.pow(1 - FOLLOW_LERP_BASE_PER_FRAME, dtMs / FOLLOW_LERP_REF_FRAME_MS);
}

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

/**
 * 🔴 [2026-09-20 修「行军过程中持续有延迟感」] 跟拍平移的 `moveend` **节流**。
 *
 * 病灶（实测，不是推测）：跟拍靠每帧 `panBy` 推镜头，而 Leaflet 的 `panBy` 每调一次就
 * 完整 fire 一轮 `movestart` / `move` / `moveend`。`moveend` 的语义是「移动结束了」，
 * 挂在它上面的监听器（整屏瓦片预取、各图层按视口刷新…）全都是按「这事很少发生」写的，
 * 结果在行军期间**每秒被触发 38 次**。
 *
 * 实测（`scratch/audit_moveend.mjs`，zoom8 行军 20 秒 / 931 帧）：
 *   movestart 758 次 · move 758 次 · moveend 758 次  —— 81% 的帧都在 fire 一整轮；
 *   moveend 监听器 15 个 × 758 次 = **11370 次调用 / 794ms / 20s ≈ 4% CPU**，
 *   且全部集中在移动期间 —— 正是主人报的「一移动就顿、停下就好」。
 *
 * ⚠️ 不能直接吞掉 moveend：Leaflet 自己的 GridLayer 也听它来拉瓦片，全吞会让长途行军
 *    期间底图永远不加载（连续行军时「停下」这个时刻根本不到来）。所以是**节流**不是**屏蔽**：
 *    移动期间按 `MOVEEND_THROTTLE_MS` 放行（38 次/秒 → 10 次/秒），并在平移停下后
 *    用 trailing 补发一次，保证「最终状态」一定被下游看到。
 *
 * `move` 事件照常逐帧 fire —— 画布层（syncCanvas / onCanvasFollow）靠它按帧对齐位置，吞了会错位。
 * 回归脚本：`node scratch/audit_moveend.mjs`（需先起 dev server）。
 */
const MOVEEND_THROTTLE_MS = 100;
let lastMoveEndFiredAt = 0;
let moveEndTrailingTimer: ReturnType<typeof setTimeout> | null = null;

/** 按整像素平移，并把逐帧 moveend 收敛成「节流 + 停稳补发」。 */
function panByThrottledMoveEnd(map: L.Map, pt: L.Point): void {
    const now = performance.now();
    const due = now - lastMoveEndFiredAt >= MOVEEND_THROTTLE_MS;

    type Firer = { fire: (type: string, data?: unknown, propagate?: boolean) => unknown };
    const anyMap = map as unknown as Firer;
    const origFire = anyMap.fire;
    let swallowed = false;

    if (!due) {
        anyMap.fire = function (this: Firer, type: string, data?: unknown, propagate?: boolean) {
            if (type === 'moveend') { swallowed = true; return this; }
            return origFire.call(this, type, data, propagate);
        };
    }
    try {
        map.panBy(pt, { animate: false });
    } finally {
        anyMap.fire = origFire;
    }
    if (due) lastMoveEndFiredAt = now;

    // trailing：镜头停稳后一定补发一次，保证下游拿到最终视口（瓦片预取、图层刷新都依赖它）
    if (swallowed) {
        if (moveEndTrailingTimer !== null) clearTimeout(moveEndTrailingTimer);
        moveEndTrailingTimer = setTimeout(() => {
            moveEndTrailingTimer = null;
            lastMoveEndFiredAt = performance.now();
            map.fire('moveend');
        }, MOVEEND_THROTTLE_MS);
    }
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
    if (ix !== 0 || iy !== 0) panByThrottledMoveEnd(map, L.point(ix, iy));
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
        // 🔴 [2026-09-14 主人定]「以后没有剧本了，就是乱斗模式中加战场玩法。」
        //    原先这里有个剧本模式闸（剧本跑时停 AI 与募兵），剧本已整套删除，故恒定跑。
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
                            // 🔴 [2026-09-15] 系数按真实帧长换算（followLerpFactor），不再用固定 0.5 —— 见其注释。
                            const k = followLerpFactor(deltaTime);
                            const next = L.latLng(
                                center.lat + (target.lat - center.lat) * k,
                                center.lng + (target.lng - center.lng) * k,
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
                                // 🔴 [2026-09-15] 同上：系数按真实帧长换算，不再用固定 0.5。
                                const k2 = followLerpFactor(deltaTime);
                                const next = L.latLng(
                                    center.lat + (target.lat - center.lat) * k2,
                                    center.lng + (target.lng - center.lng) * k2,
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
                    // 🔴 [2026-09-11 主人定] 跟拍对象 = 玩家本人（乱入者独骑）→ 播「玩家骑马」行军音。
                    //    随军时 getFollowedArmyId 报的是所在军团 id，这里自然为 false，仍播军团那两条行军音。
                    isPlayer: !!(app.playerHero && followedArmy === app.playerHero.army),
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
                    app.audioManager.syncPortraitBgm(legion?.portraitPath, pos.lat, pos.lng, legion?.cultureRegion);
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
