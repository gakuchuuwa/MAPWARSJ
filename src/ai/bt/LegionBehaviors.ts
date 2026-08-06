/**
 * LegionBehaviors.ts
 *
 * 军团 AI 行为树节点（收复发出点 → 附近敌军团追击 → 推进锚点方向池抽签 → 沿路推进 → 攻城）
 *
 * 双模式（GAME_DIRECTION 2026-06-11；回援规则见 AGENTS.md「军团回援与收复规则」2026-07-11）：
 *   据点军团：
 *     · 本城正被攻城（真打起来的攻城战）且仍属己方 → 回援守城（reinforceHome）。
 *       仅「非战斗状态」的军团回援（交战中不脱离；排队攻城算在路上，可回）；敌军仅在途/迫近不触发。
 *     · 本城已失守（易主）→ 强制回师收复（HasTarget/FindTarget 内的 resolveRecaptureTarget，所有文化无豁免）
 *     · 否则 → 先扫附近敌军团（野战追击）→ 无则推进锚点**方向池**抽签
 *       （每条直连道路各取该方向最近 1 座敌城；池内有全图据点最多的势力则必打它；
 *        无直连/无方向敌城才回退「全局最近 3」，见 TargetEvaluator）
 *       【2026-08-06】途中改追击只**挂起**攻城目标（不清 strategicTargetCityId），
 *        追击结束/失败后恢复原城，禁止半路失忆重抽导致折返。
 *       ⚠️ 这里说的是【优先级顺序】，不是【发生频率】。追击半径只有
 *          HUNT_ENEMY_LEGION_RADIUS = 0.8°(≈89km)，圈内多数时候没有敌军团，
 *          所以实机约 90% 的战斗是攻城战、野战很少（AGENTS.md「战斗构成」节）。
 *          曾有 AI 把这行读成"野战比攻城多"而误判，勿重蹈。
 *   远征军团：目标锁死、绝不回头 —— 家城被攻城不回援、失守也不回师，直至占领目标或全军覆没
 */

import { BTNode, BTStatus, BTContext, Condition, Action, Sequence, Selector } from './BehaviorTree';
import { gameLog } from '../../utils/GameLogger';
import {
    btLog,
    clearHuntTarget,
    clearStrategicTarget,
    formatTargetLabel,
    getStrategicTargetArmyId,
    getStrategicTargetId,
    getStrategicTargetKey,
    markTargetCooldown,
    setStrategicArmyTarget,
    setStrategicTarget,
} from './BtDecisionLog';
import { TargetEvaluator } from '../TargetEvaluator';
import {
    getArmyOriginCityId,
    isHomeCityLost,
    resolveForwardAnchor,
    resolveRecaptureTarget,
} from '../TargetAnchorResolver';
import { GameConfig } from '../../config/GameConfig';
import {
    commitExpeditionEliteLegionName,
    restoreExpeditionLegionName,
} from '../../data/ExpeditionLegions';
import { isCampaignLegion, shouldSkipHomeRecapture } from '../../legion/LegionSpawnPolicy';
import { getEuclideanDistance } from '../../core/DistanceUtils';
import { clampCityTroops } from '../../config/CityConfig';
import { roadRegistry } from '../../roads/RoadRegistry';
import type { Army } from '../../legion/Army';

// =====================
// 条件检查节点
// =====================

/**
 * 交战中（铁律 1：绝不脱离）。根节点第一位，故每帧必跑——顺带给野战对手的冷却续期。
 *
 * [2026-08-06] 续期是必需的，不是顺手：FAILED_TARGET_COOLDOWN_MS 只有 12s，
 * 双将野战 30s+（见 memory: battle-duration-two-band），开战时盖一次章仗还没打完就过期，
 * 脱战瞬间 HasTarget 又会挑中同一支残兵接着追，挂起的攻城目标被无限期拖着。
 * 每帧续期 ⇒ 冷却实际从**脱战那刻**开始算 12s，够军团重新上路。
 */
export const IsInCombat = new Condition('IsInCombat', (ctx) => {
    if (!ctx.army.getIsInCombat()) {
        ctx.postBattleFoeArmyId = null; // 脱战：停止续期
        return false;
    }
    const foe = ctx.postBattleFoeArmyId;
    if (foe) markTargetCooldown(ctx, `army:${foe}`, 'field_battle_engaged');
    return true;
});

export const IsPostBattleResting = new Condition('IsPostBattleResting', (ctx) => {
    return ctx.army.isPostBattleResting?.() ?? false;
});

/**
 * 本城告急：正被攻城（仍我方，需回援）或已失守（需收复）。远征军团豁免（目标锁死不回家）。
 * 「正被攻城」取严格口径（isCityBeingSieged，真打起来才算；在途/迫近不算）。
 * 用于让「排队攻城干等」的军团在老家有事时立刻退出排队，回援/收复不受距离限制。
 */
function homeNeedsHelp(ctx: BTContext): boolean {
    if (shouldSkipHomeRecapture(ctx.army)) return false; // 远征军团不回
    const homeId = getArmyOriginCityId(ctx.army);
    if (!homeId) return false;
    // 已失守 → 收复（判据统一走 isHomeCityLost，勿再内联手写）
    if (isHomeCityLost(homeId, ctx.army.getFactionId(), ctx.cityManager)) return true;
    return ctx.legionManager.isCityBeingSieged(homeId);                   // 仍我方且正被攻城 → 回援（在途/迫近不算）
}

/**
 * 第三方攻城排队中：原地待命，不打断（等战斗结束后再重新评估目标）。
 * 例外：本城告急（被攻打/已失守）→ 立即退出排队让位给回援/收复（铁律：多远都得回来）。
 * 退出排队走 dequeueArmyFromThirdPartyWaiters（重置战斗态、清碰撞、触发 onSiegeComplete 防卡队列）。
 */
export const IsWaitingSiege = new Condition('IsWaitingSiege', (ctx) => {
    if (!ctx.legionManager.isArmyWaitingSiege(ctx.army.id)) return false;
    if (homeNeedsHelp(ctx)) {
        ctx.legionManager.dequeueArmyFromThirdPartyWaiters(ctx.army.id);
        return false; // 退出排队，交由 reinforceHome（回援）或 attackSequence（收复）接手
    }
    return true;
});

/**
 * 远征模式（GAME_DIRECTION「远征细则」2026-06-11）：
 * expeditionTargetCityId 非 null 时目标锁死、断粮不回师；
 * 目标城已属己方（无论谁打下的）→ 远征功成，回归据点军团模式。
 * 返回 'locked'（继续远征）| 'done'（刚结束）| null（非远征）。
 */
function resolveExpeditionState(ctx: BTContext): 'locked' | 'done' | null {
    const army = ctx.army;

    const expeditionId: string | null = army.expeditionTargetCityId ?? null;
    if (!expeditionId) return null;

    const myFaction = army.getFactionId();
    const target = ctx.cityManager.getCity(expeditionId);

    if (!target || target.factionId === myFaction) {
        const legionName = army.name;
        army.expeditionTargetCityId = null;
        clearStrategicTarget(ctx);
        army.setTargetCity(null);
        gameLog(
            'expedition',
            `🐎 [远征] ${legionName} 远征${target ? `【${target.name}】功成` : '目标已不存在'}，回归据点军团模式`
        );
        if (target) {
            (window as unknown as {
                game?: { brawlFeedPanel?: { pushExpedition(p: { legionName: string; cityName: string; kind: 'depart' | 'success' }): void } };
            }).game?.brawlFeedPanel?.pushExpedition({
                legionName,
                cityName: target.name,
                kind: 'success',
            });
            commitExpeditionEliteLegionName(army);
        } else {
            restoreExpeditionLegionName(army);
        }
        return 'done';
    }

    // ⚠ 出发点失守也不取消远征（会让军团在目标和老家之间来回徘徊）。禁止加回失守取消分支。

    // 远征锁定：每 tick 幂等重设战略目标（setStrategicTarget 只写黑板 targetCityId/targetPosition，无副作用）。
    // 关键：不能再用「目标 id 未变就跳过」的旧守卫——野战/攻城/休整会把军团挪到新位置、并可能清空黑板目标；
    // 若战后仍奔同一城（如弓庐水战后仍去狼居胥山，id 未变），旧守卫会跳过重设 → 军团失去有效移动目标、
    // 留着打断前的陈旧路径卡在战场原地不动（祷余山因占应昌推进路点、目标改为阔亦田而侥幸绕过守卫）。
    // 幂等重设后，恢复行军时必按军团「当前位置」重新锁定→重新寻路，两场野战一致，绝不卡死。
    setStrategicTarget(ctx, expeditionId, {
        lat: target.latitude,
        lng: target.longitude,
    });
    return 'locked';
}

/** 从 LegionManager 按 id 取现役军团（无 getArmy API 时线性扫） */
function findArmyById(ctx: BTContext, armyId: string): Army | null {
    const armies: Army[] | undefined = ctx.legionManager?.getArmies?.();
    if (!armies) return null;
    return armies.find((a) => a.id === armyId) ?? null;
}

/** 追击目标是否仍有效；有效时刷新黑板坐标。失效时只清追击、保留挂起攻城目标。 */
function refreshHuntArmyTarget(ctx: BTContext): Army | null {
    const huntId = getStrategicTargetArmyId(ctx);
    if (!huntId) return null;
    const enemy = findArmyById(ctx, huntId);
    const abandonR = GameConfig.AI.HUNT_ENEMY_LEGION_ABANDON_RADIUS;
    if (
        !enemy ||
        enemy.isDestroyed ||
        enemy.getTroops() <= 0 ||
        enemy.getFactionId() === ctx.army.getFactionId()
    ) {
        markTargetCooldown(ctx, `army:${huntId}`, 'hunt_invalid');
        clearHuntTarget(ctx);
        ctx.army.stopMovement?.(false);
        return null;
    }
    const myPos = ctx.army.getPosition();
    const ePos = enemy.getPosition();
    if (getEuclideanDistance(myPos, ePos) > abandonR) {
        markTargetCooldown(ctx, `army:${huntId}`, 'hunt_out_of_range');
        clearHuntTarget(ctx);
        ctx.army.stopMovement?.(false);
        return null;
    }

    // 对方交战中 → 打不起来，只能等残局。计时防止永久趴窝：
    // HoldForFieldContact 会 stopMovement 并返回 SUCCESS，行为树不再往下走攻城分支，
    // 而对方若在攻城则既不会被打死也不会跑出放弃半径，没有别的出口。
    if (enemy.getIsInCombat?.()) {
        const now = performance.now();
        if (ctx.huntBlockedSinceMs === null) {
            ctx.huntBlockedSinceMs = now;
        } else if (now - ctx.huntBlockedSinceMs > GameConfig.AI.HUNT_BLOCKED_TIMEOUT_MS) {
            btLog(
                ctx,
                `hunt_blocked_timeout:${huntId}`,
                `[AI] ${ctx.army.name} 等【${enemy.name}】脱战超时，放弃追击改打据点`,
            );
            markTargetCooldown(ctx, `army:${huntId}`, 'hunt_blocked_timeout');
            clearHuntTarget(ctx);
            ctx.army.stopMovement?.(false);
            return null;
        }
    } else {
        ctx.huntBlockedSinceMs = null; // 对方脱战，卡住计时清零
    }

    ctx.targetPosition = { lat: ePos.lat, lng: ePos.lng };
    return enemy;
}

/**
 * 冷却名单：过期项顺手清理。
 * 【务必共用】HasTarget 的「途中改追击」和 FindTarget 的「选目标」必须用同一份名单——
 * 2026-08-05 修：HasTarget 那侧原先传 `new Set()`（等于没有冷却），
 * 于是 hunt_blocked_timeout 刚把打不动的敌军拉黑、下一 tick 就又被追回去，
 * 军团被一支交战中的敌军永久钉住、45 秒空转一轮，几乎不再攻城。
 */
function buildExcludeTargetIds(ctx: BTContext): Set<string> {
    const now = performance.now();
    const excludeTargetIds = new Set<string>();
    for (const [targetId, failedAt] of ctx.recentFailedTargets.entries()) {
        if (now - failedAt <= FAILED_TARGET_COOLDOWN_MS) {
            excludeTargetIds.add(targetId);
        } else {
            ctx.recentFailedTargets.delete(targetId);
        }
    }
    return excludeTargetIds;
}

/**
 * 在寻敌半径内找最近可野战敌军团（排除冷却中的目标）。
 * 收复本城优先于本函数；本函数优先于方向池抽签。
 */
function pickNearbyEnemyLegion(ctx: BTContext, excludeTargetIds: Set<string>): Army | null {
    const huntR = GameConfig.AI.HUNT_ENEMY_LEGION_RADIUS;
    const myPos = ctx.army.getPosition();
    const myFaction = ctx.army.getFactionId();
    const registry = ctx.legionManager?.getSpatialRegistry?.();
    if (!registry?.getArmiesInRadius) return null;

    const nearby: Army[] = registry.getArmiesInRadius(myPos.lat, myPos.lng, huntR);
    let best: Army | null = null;
    let bestDist = Infinity;

    for (const other of nearby) {
        if (!other || other === ctx.army || other.isDestroyed || other.getTroops() <= 0) continue;
        if (other.getFactionId() === myFaction) continue;
        const key = `army:${other.id}`;
        if (excludeTargetIds.has(key)) continue;

        const d = getEuclideanDistance(myPos, other.getPosition());
        if (d > huntR) continue;
        if (d < bestDist) {
            bestDist = d;
            best = other;
        }
    }
    return best;
}

export const HasTarget = new Condition('HasTarget', (ctx) => {
    // 远征模式：跳过回师检查（断粮不回），目标锁死
    const expedition = resolveExpeditionState(ctx);
    if (expedition === 'locked') return true;
    if (expedition === 'done') return false;

    const myFaction = ctx.army.getFactionId();
    if (!shouldSkipHomeRecapture(ctx.army)) {
        const originCityId = getArmyOriginCityId(ctx.army) ?? '';
        const recaptureId = resolveRecaptureTarget(myFaction, originCityId, ctx.cityManager);

        if (recaptureId) {
            const strategicId = getStrategicTargetId(ctx);
            const huntId = getStrategicTargetArmyId(ctx);
            if (strategicId !== recaptureId || huntId) {
                const prevKey = getStrategicTargetKey(ctx);
                if (prevKey) {
                    markTargetCooldown(ctx, prevKey, 'capital_recapture');
                }
                clearStrategicTarget(ctx);
                ctx.army.setTargetCity(null);
                // 目标确实变了：立即停步，让 FindTarget 马上改道收复，别走完旧路径（2026-08-05）
                ctx.army.stopMovement?.();
                
                // 已经清空了目标，必须返回 false 让行为树进入 FindTarget 重新寻找路径
                return false;
            }
            // 目标已是收复城 → 保持（true），不再每帧进 FindTarget 重复决策
            // [2026-08-05] 修复：原无条件 return false + FindTarget 无 stopMovement，
            // 本城失守时军团会先走完旧目标剩余路程才回头（延误收复）。
            return true;
        }
    }

    // 追击敌军团：仍有效则保持；已结束则落入下方，恢复挂起的攻城目标（勿直接 return false 进 FindTarget）
    if (getStrategicTargetArmyId(ctx)) {
        if (refreshHuntArmyTarget(ctx)) return true;
        // 追击已清：继续检查挂起的据点目标
    }

    const strategicId = getStrategicTargetId(ctx);
    if (!strategicId) return false;

    const city = ctx.cityManager.getCity(strategicId);
    if (!city || city.factionId === ctx.army.getFactionId()) {
        if (strategicId) {
            markTargetCooldown(ctx, strategicId, 'friendly_or_missing');
        }
        clearStrategicTarget(ctx);
        ctx.army.setTargetCity(null);
        // 目标已失效：立即停步，别继续冲向已变友军/消失的旧城（2026-08-05）
        ctx.army.stopMovement?.();
        return false;
    }

    // 关键：已锁定据点时 EnsureTarget 不会再进 FindTarget，同屏新刷敌军团会被无视。
    // 非收复/非远征的攻城途中，若寻敌半径内出现可打敌军团 → 挂起城目标并立刻改追（城 id 保留，勿 stopMovement 空窗卡死）。
    const nearbyEnemy = pickNearbyEnemyLegion(ctx, buildExcludeTargetIds(ctx));
    if (nearbyEnemy) {
        const ePos = nearbyEnemy.getPosition();
        const cityName = city.name;
        btLog(
            ctx,
            `retarget_hunt:${nearbyEnemy.id}`,
            `[AI] ${ctx.army.name} 途中发现敌军【${nearbyEnemy.name}】，暂停攻城【${cityName}】改追击`,
        );
        setStrategicArmyTarget(ctx, nearbyEnemy.id, { lat: ePos.lat, lng: ePos.lng });
        ctx.army.setTargetCity(null);
        // 沿路追击：取敌军最近路网城，路由过去（永不离开道路）
        const huntCityId = roadRegistry.getNearestCityId(ePos.lat, ePos.lng);
        if (huntCityId) {
            ctx.legionManager.moveLegionToCity(ctx.army, huntCityId);
        }
        return true;
    }

    return true;
});

export const IsMoving = new Condition('IsMoving', (ctx) => !ctx.army.isIdle());

const SIEGE_REACH_RADIUS = GameConfig.SIEGE.COMBAT_RADIUS + 0.1;
/** 与 LegionFieldBattle 接触半径一致：追到此距离内等碰撞开战 */
const FIELD_HUNT_CONTACT_RADIUS = 0.2;
const FAILED_TARGET_COOLDOWN_MS = GameConfig.AI.FAILED_TARGET_COOLDOWN_MS;
const MOVE_FAILURE_LOG_COOLDOWN_MS = 10_000;

function markMoveFailure(ctx: BTContext, targetId: string, reason: string) {
    markTargetCooldown(ctx, targetId, reason);
    const logKey = `${ctx.army.id}:${targetId}:${reason}`;
    const now = performance.now();
    const last = ctx.moveFailureLogCooldown.get(logKey) ?? 0;
    if (now - last >= MOVE_FAILURE_LOG_COOLDOWN_MS) {
        const name = formatTargetLabel(ctx.cityManager, targetId);
        btLog(ctx, `fail:${targetId}`, `[AI] ${ctx.army.name} 无法进攻【${name}】（${reason}，冷却 ${FAILED_TARGET_COOLDOWN_MS / 1000}s）`, true);
        ctx.moveFailureLogCooldown.set(logKey, now);
    }
}

function resolveSiegeCity(ctx: BTContext) {
    return (
        ctx.army.getTargetCity() ||
        (getStrategicTargetId(ctx) ? ctx.cityManager.getCity(getStrategicTargetId(ctx)!) : null)
    );
}

export const IsNearTarget = new Condition('IsNearTarget', (ctx) => {
    // 追击军团：近到野战接触半径即可（开战由 LegionManager 碰撞触发）
    if (getStrategicTargetArmyId(ctx)) {
        const enemy = refreshHuntArmyTarget(ctx);
        if (!enemy) return false;
        const dist = getEuclideanDistance(ctx.army.getPosition(), enemy.getPosition());
        return dist <= FIELD_HUNT_CONTACT_RADIUS;
    }
    const target = resolveSiegeCity(ctx);
    if (!target || target.factionId === ctx.army.getFactionId()) return false;
    const armyPos = ctx.army.getPosition();
    const dist = getEuclideanDistance(armyPos, { lat: target.latitude, lng: target.longitude });
    return dist <= SIEGE_REACH_RADIUS;
});

// =====================
// 动作节点
// =====================

/**
 * 推进锚点迟滞（2026-08-06）。
 *
 * resolveForwardAnchor 每次都取「离军团最近的己方城」。两座己方城距离相近时，军团走两步、
 * 名次就换一次，方向池整组翻掉 → 观感是原地折返/斜切换战线。这里加一道迟滞：
 * 旧锚点仍是己方且路网可达就留着，除非新候选**明显**更近（≤80%）。
 *
 * 不是硬锁（DS 建议的「开拔后钉死出发城」没采纳）：深入敌境的军团若锚点钉在几百公里外的老家，
 * 方向池会算成老家周边的敌城，反而把军团往回拉——那是比抖动更糟的折返。
 * 迟滞只压掉「名次抖动」这一类纯噪声：军团亲自打下的城距离≈0，一定顶得掉旧锚点，推进不受影响。
 */
const ANCHOR_SWITCH_GAIN = 0.8;

export function resolveStickyAnchor(
    ctx: BTContext,
    candidateId: string,
    myFaction: string,
    roadDistances?: ReadonlyMap<string, number>,
): string {
    const prevId = ctx.marchAnchorCityId;
    if (!prevId || prevId === candidateId) return candidateId;

    const prev = ctx.cityManager.getCity(prevId);
    if (!prev || prev.factionId !== myFaction) return candidateId; // 旧锚点没了/易主
    if (!roadDistances) return candidateId;                        // 拿不到路网表，无从比较

    const prevKm = roadDistances.get(prevId);
    if (prevKm === undefined) return candidateId;                  // 旧锚点已不可达（断路/失陷）
    const candKm = roadDistances.get(candidateId);
    if (candKm === undefined) return prevId;

    return candKm <= prevKm * ANCHOR_SWITCH_GAIN ? candidateId : prevId;
}

export const FindTarget = new Action('FindTarget', (ctx) => {
    // 远征模式：目标只有一个，不进方向池抽签、不回师
    const expedition = resolveExpeditionState(ctx);
    if (expedition === 'locked') return BTStatus.SUCCESS;

    const myFaction = ctx.army.getFactionId();
    const excludeTargetIds = buildExcludeTargetIds(ctx);

    const originCityId = getArmyOriginCityId(ctx.army);
    if (!originCityId) {
        btLog(ctx, 'no_home', `[AI] ${ctx.army.name} 无出发点，无法选进攻目标`, true);
        return BTStatus.FAILURE;
    }

    if (!shouldSkipHomeRecapture(ctx.army)) {
        const recaptureId = resolveRecaptureTarget(myFaction, originCityId, ctx.cityManager);
        if (recaptureId) {
            const recaptureCity = ctx.cityManager.getCity(recaptureId);
            if (!recaptureCity) {
                return BTStatus.FAILURE;
            }
            setStrategicTarget(ctx, recaptureId, {
                lat: recaptureCity.latitude,
                lng: recaptureCity.longitude,
            });
            // 停掉旧目标残留路径，立即改道收复（2026-08-05）
            ctx.army.stopMovement?.();
            btLog(
                ctx,
                `recapture:${recaptureId}`,
                `[AI] ${ctx.army.name} 收复本军出发点【${recaptureCity.name}】`
            );
            return BTStatus.SUCCESS;
        }
    }

    // ① 先找附近敌军团（野战追击）；无则再选据点
    //    注意：这是优先级不是频率 —— 半径 0.8°(≈89km) 内多数时候没有敌军团，
    //    实机约 90% 的战斗是攻城战（见 AGENTS.md「战斗构成：90% 是攻城战」）。
    const nearbyEnemy = pickNearbyEnemyLegion(ctx, excludeTargetIds);
    if (nearbyEnemy) {
        const ePos = nearbyEnemy.getPosition();
        setStrategicArmyTarget(ctx, nearbyEnemy.id, { lat: ePos.lat, lng: ePos.lng });
        ctx.army.setTargetCity(null);
        // 停掉旧目标残留路径，立即改追（2026-08-05）
        ctx.army.stopMovement?.();
        const distKm = getEuclideanDistance(ctx.army.getPosition(), ePos) * 111;
        btLog(
            ctx,
            `hunt:${nearbyEnemy.id}`,
            `[AI] ${ctx.army.name} 追击附近敌军【${nearbyEnemy.name}】` +
                `（约 ${distKm.toFixed(0)} km，优先于攻城）`
        );
        return BTStatus.SUCCESS;
    }

    const useHomeAnchor = ctx.army.getTroops() < GameConfig.LEGION.HOME_ANCHOR_TROOP_THRESHOLD;
    let anchorId: string;
    if (useHomeAnchor) {
        anchorId = originCityId;
        ctx.marchAnchorCityId = null; // 小军团锁老家，不参与迟滞
    } else {
        // 锚点按「军团所在路网城」出发的道路距离选，隔海飞地不会被误选（见 resolveForwardAnchor）
        const armyPos = ctx.army.getPosition();
        const standCityId = roadRegistry.getNearestCityId(armyPos.lat, armyPos.lng);
        const roadDistances = standCityId
            ? roadRegistry.getRoadDistancesKmFrom(standCityId)
            : undefined;
        const candidateId = resolveForwardAnchor(
            armyPos,
            myFaction,
            originCityId,
            ctx.cityManager,
            roadDistances
        );
        anchorId = resolveStickyAnchor(ctx, candidateId, myFaction, roadDistances);
        ctx.marchAnchorCityId = anchorId;
    }

    const fromPos = ctx.army.getPosition();
    const picked = TargetEvaluator.pickTarget(
        myFaction,
        anchorId,
        originCityId,
        ctx.cityManager.getCities(),
        { excludeTargetIds, fromPosition: fromPos }
    );

    if (!picked) {
        const anchorName = ctx.cityManager.getCity(anchorId)?.name ?? anchorId;
        btLog(
            ctx,
            'no_enemy',
            `[AI] ${ctx.army.name} 无可用敌城（自【${anchorName}】沿路均不可达或在冷却中）`,
            true
        );
        return BTStatus.FAILURE;
    }

    const target = ctx.cityManager.getCity(picked.targetId);
    if (!target) {
        return BTStatus.FAILURE;
    }

    setStrategicTarget(ctx, target.id, { lat: target.latitude, lng: target.longitude });
    // 停掉旧目标残留路径，立即改道新目标（2026-08-05）
    ctx.army.stopMovement?.();

    const anchorName = ctx.cityManager.getCity(anchorId)?.name ?? anchorId;
    btLog(
        ctx,
        `pick:${target.id}`,
        `[AI] ${ctx.army.name} 战略目标【${target.name}】` +
            `（自【${anchorName}】沿路 ${picked.distanceKm.toFixed(0)} km，方向池抽签）`
    );
    return BTStatus.SUCCESS;
});

/** 朝敌军团沿路追击（永不离开道路） */
function chaseEnemyArmy(ctx: BTContext, enemy: Army): BTStatus {
    const myPos = ctx.army.getPosition();
    const ePos = enemy.getPosition();
    const dist = getEuclideanDistance(myPos, ePos);
    if (dist <= FIELD_HUNT_CONTACT_RADIUS) {
        // 已贴身：停步等碰撞开战；若本帧仍未开战则保持 SUCCESS 不放弃
        if (!ctx.army.isIdle()) ctx.army.stopMovement?.(false);
        ctx.targetPosition = { lat: ePos.lat, lng: ePos.lng };
        return BTStatus.SUCCESS;
    }

    // 已在沿路行军：持续，不每帧重设（避免路径抖动）
    ctx.targetPosition = { lat: ePos.lat, lng: ePos.lng };
    if (ctx.army.isBlocked()) {
        markMoveFailure(ctx, `army:${enemy.id}`, 'blocked');
        return BTStatus.FAILURE;
    }

    // 沿路追击：取敌军最近路网城，路由过去
    if (!ctx.army.isIdle()) return BTStatus.SUCCESS;

    const huntCityId = roadRegistry.getNearestCityId(ePos.lat, ePos.lng);
    if (!huntCityId) {
        markMoveFailure(ctx, `army:${enemy.id}`, 'no_road');
        return BTStatus.FAILURE;
    }
    ctx.legionManager.moveLegionToCity(ctx.army, huntCityId);
    ctx.lastMoveResult = 'success';
    btLog(
        ctx,
        `chase:${enemy.id}`,
        `[AI] ${ctx.army.name} 沿路追击【${enemy.name}】`
    );
    return BTStatus.SUCCESS;
}

export const MoveToTarget = new Action('MoveToTarget', (ctx) => {
    // 追击敌军团
    if (getStrategicTargetArmyId(ctx)) {
        const enemy = refreshHuntArmyTarget(ctx);
        if (!enemy) return BTStatus.FAILURE;
        return chaseEnemyArmy(ctx, enemy);
    }

    const strategicId = getStrategicTargetId(ctx);
    if (!strategicId) return BTStatus.FAILURE;

    const strategicCity = ctx.cityManager.getCity(strategicId);
    if (strategicCity && strategicCity.factionId !== ctx.army.getFactionId() && ctx.army.isIdle()) {
        const dist = getEuclideanDistance(ctx.army.getPosition(), {
            lat: strategicCity.latitude,
            lng: strategicCity.longitude,
        });
        if (dist <= SIEGE_REACH_RADIUS) {
            return BTStatus.SUCCESS;
        }
    }

    // 看似在走：若已 blocked，强制停步并重算，避免「非 idle 早退」永久卡死
    if (!ctx.army.isIdle()) {
        if (ctx.army.isBlocked()) {
            ctx.army.stopMovement?.(false);
            // 落入下方重算路径
        } else {
            return BTStatus.SUCCESS;
        }
    }

    if (ctx.army.isBlocked()) {
        markMoveFailure(ctx, strategicId, 'blocked');
        return BTStatus.FAILURE;
    }

    const success = ctx.legionManager.moveLegionToCity(ctx.army, strategicId);

    if (success) {
        ctx.lastMoveResult = 'success';
        const hop = ctx.army.getTargetCity();
        const hopLabel = hop ? formatTargetLabel(ctx.cityManager, hop.id) : strategicId;
        const finalLabel = formatTargetLabel(ctx.cityManager, strategicId);
        if (hop?.id && hop.id !== strategicId) {
            btLog(
                ctx,
                `march:${strategicId}`,
                `[AI] ${ctx.army.name} 行军 当前段【${hopLabel}】→ 终极目标【${finalLabel}】`
            );
        } else {
            btLog(ctx, `march:${strategicId}`, `[AI] ${ctx.army.name} 行军 →【${finalLabel}】`);
        }
        return BTStatus.SUCCESS;
    }

    ctx.lastMoveResult = 'failure';
    markMoveFailure(ctx, strategicId, 'no_road_path');
    return BTStatus.FAILURE;
});

export const AbandonTarget = new Action('AbandonTarget', (ctx) => {
    const abandoned = getStrategicTargetKey(ctx);
    if (!abandoned) {
        return BTStatus.FAILURE;
    }

    markTargetCooldown(ctx, abandoned, 'abandon');
    const huntId = getStrategicTargetArmyId(ctx);
    const huntName = huntId ? (findArmyById(ctx, huntId)?.name ?? huntId) : null;

    if (huntId) {
        // 只放弃追击：挂起的攻城目标保留，下一 tick 恢复行军（2026-08-06）
        clearHuntTarget(ctx);
        ctx.army.stopMovement?.(false);
        btLog(ctx, `abandon:${abandoned}`, `[AI] ${ctx.army.name} 放弃追击【${huntName}】，恢复攻城目标`);
        return BTStatus.SUCCESS;
    }

    clearStrategicTarget(ctx);
    ctx.army.setTargetCity(null);
    ctx.army.stopMovement();

    const name = formatTargetLabel(ctx.cityManager, abandoned);
    btLog(ctx, `abandon:${abandoned}`, `[AI] ${ctx.army.name} 放弃【${name}】`);
    return BTStatus.SUCCESS;
});

/** 追击贴身后：开战由碰撞系统负责；此处仅占位成功，避免误走攻城 */
export const HoldForFieldContact = new Action('HoldForFieldContact', (ctx) => {
    const huntId = getStrategicTargetArmyId(ctx);
    if (!huntId) return BTStatus.FAILURE;
    const enemy = refreshHuntArmyTarget(ctx);
    if (!enemy) return BTStatus.FAILURE;
    // 已在战斗：只清追击，保留挂起攻城目标，战后继续赶路（2026-08-06）
    if (ctx.army.getIsInCombat()) {
        // [2026-08-06] 记下对手并盖冷却章：打完若对方没被歼灭且仍在 0.8° 内，HasTarget 下一帧
        // 会立刻再追同一支，挂起的攻城目标被无限期拖着（旧代码就这样，非本次回归）。
        // 章由 IsInCombat 每帧续期到脱战为止，中间那 12s 不会在仗打完前失效。
        ctx.postBattleFoeArmyId = huntId;
        markTargetCooldown(ctx, `army:${huntId}`, 'field_battle_engaged');
        clearHuntTarget(ctx);
        return BTStatus.SUCCESS;
    }
    if (!ctx.army.isIdle()) ctx.army.stopMovement?.(false);
    return BTStatus.SUCCESS;
});

export const TriggerSiege = new Action('TriggerSiege', (ctx) => {
    // 军团追击目标不走攻城
    if (getStrategicTargetArmyId(ctx)) return BTStatus.FAILURE;

    const targetCity = resolveSiegeCity(ctx);
    if (!targetCity) return BTStatus.FAILURE;
    if (targetCity.factionId === ctx.army.getFactionId()) {
        clearStrategicTarget(ctx);
        ctx.army.setTargetCity(null);
        return BTStatus.SUCCESS;
    }

    const strategicId = getStrategicTargetId(ctx);
    const isMarchHop = !!(strategicId && targetCity.id !== strategicId);

    ctx.legionManager.triggerSiege(ctx.army, targetCity);
    ctx.army.setTargetCity(null);

    if (isMarchHop) {
        return BTStatus.SUCCESS;
    }

    clearStrategicTarget(ctx);
    return BTStatus.SUCCESS;
});

export const Idle = new Action('Idle', () => BTStatus.SUCCESS);

// =====================
// 残兵撤退（据点军团兵力跌破阈值 → 回出发城解散、兵力并入驻军；远征军团不受此限）
// =====================

/** 兵力 < 阈值、非远征、出发城仍属己方 → 该撤回解散 */
export const IsWeakLegion = new Condition('IsWeakLegion', (ctx) => {
    const army = ctx.army;
    if (army.getTroops() >= GameConfig.LEGION.DISBAND_TROOP_THRESHOLD) return false;
    if (isCampaignLegion(army)) return false; // 远征军团不解散
    const homeId = getArmyOriginCityId(army);
    if (!homeId) return false;
    const home = ctx.cityManager.getCity(homeId);
    // 出发城失守 → false，交回 attackSequence 的收复逻辑（打回来后才解散）
    return !!home && home.factionId === army.getFactionId();
});

/** 已抵达出发城（到达/攻城半径内） */
export const IsAtHomeCity = new Condition('IsAtHomeCity', (ctx) => {
    const army = ctx.army;
    const homeId = getArmyOriginCityId(army);
    if (!homeId) return false;
    const home = ctx.cityManager.getCity(homeId);
    if (!home) return false;
    const dist = getEuclideanDistance(army.getPosition(), {
        lat: home.latitude,
        lng: home.longitude,
    });
    return dist <= SIEGE_REACH_RADIUS;
});

/** 抵达出发城：兵力并入驻军，军团解散 */
export const DisbandIntoHome = new Action('DisbandIntoHome', (ctx) => {
    const army = ctx.army;
    const homeId = getArmyOriginCityId(army);
    const home = homeId ? ctx.cityManager.getCity(homeId) : null;
    if (!home) return BTStatus.FAILURE;

    const merged = army.getTroops();
    home.troops = clampCityTroops(home.type, (home.troops || 0) + merged);
    ctx.cityManager.updateCityLabel?.(home.id);

    btLog(
        ctx,
        `disband:${home.id}`,
        `[AI] ${army.name}（残兵 ${merged}）撤回【${home.name}】解散，兵力并入驻军`,
    );

    clearStrategicTarget(ctx);
    army.disband(); // 解散立即消失（不留尸体）
    ctx.legionManager.removeArmy(army);
    return BTStatus.SUCCESS;
});

/** 本城是否正在被攻城（严格：真打起来的攻城战；敌军在途/迫近不算） */
export const IsHomeUnderAttack = new Condition('IsHomeUnderAttack', (ctx) => {
    const homeId = getArmyOriginCityId(ctx.army);
    return !!homeId && ctx.legionManager.isCityBeingSieged(homeId);
});

/** 本城仍属己方（尚未沦陷）——区分「回援守城」与「回攻收复」 */
export const IsHomeStillMine = new Condition('IsHomeStillMine', (ctx) => {
    const homeId = getArmyOriginCityId(ctx.army);
    if (!homeId) return false;
    const home = ctx.cityManager.getCity(homeId);
    return !!home && home.factionId === ctx.army.getFactionId();
});

/** 非远征军团（远征目标锁死，本城被攻打也不回援） */
export const IsNotExpeditionLegion = new Condition(
    'IsNotExpeditionLegion',
    (ctx) => !shouldSkipHomeRecapture(ctx.army),
);

/** 本城守城战进行中：加入守城；敌军尚在途/排队则原地待命，均不解散 */
export const DefendHome = new Action('DefendHome', (ctx) => {
    const army = ctx.army;
    const homeId = getArmyOriginCityId(army);
    if (!homeId) return BTStatus.FAILURE;
    if (ctx.legionManager.tryJoinCityDefense(army, homeId)) {
        const homeName = ctx.cityManager.getCity(homeId)?.name ?? homeId;
        btLog(ctx, `defend_home:${homeId}`, `[AI] ${army.name} 加入【${homeName}】守城战`);
        return BTStatus.SUCCESS;
    }
    army.stopMovement?.(); // 敌军在途、尚未开打 → 原地待命，不解散
    return BTStatus.SUCCESS;
});

/** 撤回出发城（沿路网行军；行军中直接成功，避免每帧重设路径） */
export const MarchHome = new Action('MarchHome', (ctx) => {
    const army = ctx.army;
    const homeId = getArmyOriginCityId(army);
    if (!homeId) return BTStatus.FAILURE;

    // 锁定回家为战略目标；若原本奔向别处（攻击目标），先停下改道，避免继续冲向敌城
    if (getStrategicTargetId(ctx) !== homeId) {
        const home = ctx.cityManager.getCity(homeId);
        if (!home) return BTStatus.FAILURE;
        army.stopMovement?.();
        setStrategicTarget(ctx, homeId, { lat: home.latitude, lng: home.longitude });
    }

    if (!army.isIdle()) return BTStatus.SUCCESS; // 已在回家路上

    if (ctx.legionManager.moveLegionToCity(army, homeId)) {
        const homeName = ctx.cityManager.getCity(homeId)?.name ?? homeId;
        btLog(ctx, `march_home:${homeId}`, `[AI] ${army.name} 返回本城【${homeName}】`);
        return BTStatus.SUCCESS;
    }
    return BTStatus.FAILURE;
});

// =====================
// 组合行为树
// =====================

const giveUpUnreachable = new Sequence('GiveUpUnreachable', [
    AbandonTarget,
    new Action('MarchFailed', () => BTStatus.FAILURE),
]);

const approachOrStrike = new Selector('ApproachOrStrike', [
    // 追击敌军：贴身后等待野战碰撞；攻城链仅对城目标
    new Sequence('EngageIfNear', [
        IsNearTarget,
        new Selector('SiegeOrHoldHunt', [TriggerSiege, HoldForFieldContact]),
    ]),
    new Selector('MarchOrGiveUp', [MoveToTarget, giveUpUnreachable]),
]);

const ensureTarget = new Selector('EnsureTarget', [HasTarget, FindTarget]);

const attackSequence = new Sequence('AttackSequence', [ensureTarget, approachOrStrike]);

// 残兵撤退：抵家则解散并入，否则撤回出发城
const retreatWeakLegion = new Sequence('RetreatWeakLegion', [
    IsWeakLegion,
    new Selector('HomeOrMarch', [
        // 已抵家：本城在战 → 加入守城（先战斗）；否则解散并入
        new Sequence('AtHome', [
            IsAtHomeCity,
            new Selector('DefendOrDisband', [
                new Sequence('DefendIfSieged', [IsHomeUnderAttack, DefendHome]),
                DisbandIntoHome,
            ]),
        ]),
        MarchHome,
    ]),
]);

// 回援本城（不限兵力）：本城正被攻城（真打起来）且仍属己方（未沦陷）、非远征 →
// 抵家则以援军身份中途加入守城，未抵家则星夜回援。敌军仅在途/迫近不触发。
// 比「等城破再回攻」更早救援；城一旦失守则由 attackSequence 内的收复逻辑接手。
const reinforceHome = new Sequence('ReinforceHome', [
    IsNotExpeditionLegion,
    IsHomeUnderAttack,
    IsHomeStillMine,
    new Selector('ReinforceOrMarchHome', [
        new Sequence('AtHomeDefend', [IsAtHomeCity, DefendHome]),
        MarchHome,
    ]),
]);

export function createLegionBehaviorTree(): BTNode {
    // 顺序即优先级。[2026-08-05] IsPostBattleResting 从 reinforceHome 之前挪到之后：
    // 铁律 2「在路上行军、待命均可回援」，战后休整本质是待命，原顺序会让休整中的军团
    // 眼看着老家被攻城而不动。IsInCombat 仍在最前，交战中绝不脱离（铁律 1）不受影响。
    return new Selector('RootSelector', [
        IsInCombat,
        IsWaitingSiege,
        reinforceHome,
        IsPostBattleResting,
        retreatWeakLegion,
        attackSequence,
        Idle,
    ]);
}
