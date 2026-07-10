/**
 * LegionBehaviors.ts
 *
 * 军团 AI 行为树节点（收复发出点 → 附近敌军团追击 → 推进锚点近敌池抽签 → 沿路推进 → 攻城）
 *
 * 双模式（GAME_DIRECTION 2026-06-11）：
 *   据点军团：
 *     · 本城正被攻打且仍属己方 → 回援守城（reinforceHome，以守方援军身份中途加入，早于城破）
 *     · 本城已失守（易主）→ 强制回师收复（HasTarget/FindTarget 内的 resolveRecaptureTarget，所有文化无豁免）
 *     · 否则 → 先扫附近敌军团（野战追击）→ 无则推进锚点近 3 敌城抽签
 *   远征军团：目标锁死、家城被攻打/失守均不回师（shouldSkipHomeRecapture），直至占领/兵败或全军覆没
 */

import { BTNode, BTStatus, BTContext, Condition, Action, Sequence, Selector } from './BehaviorTree';
import { gameLog } from '../../utils/GameLogger';
import {
    btLog,
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
import { clampCityTroopsForCity } from '../../config/CityConfig';
import { roadRegistry } from '../../roads/RoadRegistry';
import type { Army } from '../../legion/Army';

// =====================
// 条件检查节点
// =====================

export const IsInCombat = new Condition('IsInCombat', (ctx) => ctx.army.getIsInCombat());

export const IsPostBattleResting = new Condition('IsPostBattleResting', (ctx) => {
    return ctx.army.isPostBattleResting?.() ?? false;
});

/**
 * 本城告急：正被攻打（仍我方，需回援）或已失守（需收复）。远征军团豁免（目标锁死不回家）。
 * 用于让「排队攻城干等」的军团在老家有事时立刻退出排队，回援/收复不受距离限制。
 */
function homeNeedsHelp(ctx: BTContext): boolean {
    if (shouldSkipHomeRecapture(ctx.army)) return false; // 远征军团不回
    const homeId = getArmyOriginCityId(ctx.army);
    if (!homeId) return false;
    const home = ctx.cityManager.getCity(homeId);
    if (!home || home.factionId !== ctx.army.getFactionId()) return true; // 已失守 → 收复
    return ctx.legionManager.isCityUnderAttack(homeId);                    // 仍我方但被攻打 → 回援
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

    if (getStrategicTargetId(ctx) !== expeditionId) {
        setStrategicTarget(ctx, expeditionId, {
            lat: target.latitude,
            lng: target.longitude,
        });
    }
    return 'locked';
}

/** 从 LegionManager 按 id 取现役军团（无 getArmy API 时线性扫） */
function findArmyById(ctx: BTContext, armyId: string): Army | null {
    const armies: Army[] | undefined = ctx.legionManager?.getArmies?.();
    if (!armies) return null;
    return armies.find((a) => a.id === armyId) ?? null;
}

/** 追击目标是否仍有效；有效时刷新黑板坐标 */
function refreshHuntArmyTarget(ctx: BTContext): Army | null {
    const huntId = getStrategicTargetArmyId(ctx);
    if (!huntId) return null;
    const enemy = findArmyById(ctx, huntId);
    const abandonR = GameConfig.AI.HUNT_ENEMY_LEGION_ABANDON_RADIUS;
    if (
        !enemy ||
        enemy.isDestroyed ||
        enemy.getTroops() <= 0 ||
        enemy.getFactionId() === ctx.army.getFactionId() ||
        enemy.getFactionId() === 'neutral'
    ) {
        markTargetCooldown(ctx, `army:${huntId}`, 'hunt_invalid');
        clearStrategicTarget(ctx);
        return null;
    }
    // 敌已在交战：贴脸也无法再开战，必须放弃，否则永久 HoldForFieldContact
    if (enemy.getIsInCombat?.()) {
        markTargetCooldown(ctx, `army:${huntId}`, 'hunt_in_combat');
        clearStrategicTarget(ctx);
        return null;
    }
    const myPos = ctx.army.getPosition();
    const ePos = enemy.getPosition();
    if (getEuclideanDistance(myPos, ePos) > abandonR) {
        markTargetCooldown(ctx, `army:${huntId}`, 'hunt_out_of_range');
        clearStrategicTarget(ctx);
        return null;
    }
    ctx.targetPosition = { lat: ePos.lat, lng: ePos.lng };
    return enemy;
}

/**
 * 在寻敌半径内找最近可野战敌军团（排除冷却、交战中、排队攻城）。
 * 收复本城优先于本函数；本函数优先于近敌城抽签。
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
        if (other.getFactionId() === 'neutral') continue;
        if (other.getIsInCombat?.()) continue;
        if (ctx.legionManager.isArmyWaitingSiege?.(other.id)) continue;
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
            }
            return false;
        }
    }

    // 追击敌军团：目标仍有效则保持
    if (getStrategicTargetArmyId(ctx)) {
        return !!refreshHuntArmyTarget(ctx);
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
        return false;
    }

    // 关键：已锁定据点时 EnsureTarget 不会再进 FindTarget，同屏新刷敌军团会被无视。
    // 非收复/非远征的攻城途中，若寻敌半径内出现可打敌军团 → 清城目标并立刻改追（勿 stopMovement 空窗卡死）。
    const nearbyEnemy = pickNearbyEnemyLegion(ctx, new Set());
    if (nearbyEnemy) {
        const ePos = nearbyEnemy.getPosition();
        btLog(
            ctx,
            `retarget_hunt:${nearbyEnemy.id}`,
            `[AI] ${ctx.army.name} 途中发现敌军【${nearbyEnemy.name}】，放弃据点【${city.name}】改追击`,
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

export const FindTarget = new Action('FindTarget', (ctx) => {
    // 远征模式：目标只有一个，不进近 3 敌城抽签、不回师
    const expedition = resolveExpeditionState(ctx);
    if (expedition === 'locked') return BTStatus.SUCCESS;

    const myFaction = ctx.army.getFactionId();
    const now = performance.now();
    const excludeTargetIds = new Set<string>();

    for (const [targetId, failedAt] of ctx.recentFailedTargets.entries()) {
        if (now - failedAt <= FAILED_TARGET_COOLDOWN_MS) {
            excludeTargetIds.add(targetId);
        } else {
            ctx.recentFailedTargets.delete(targetId);
        }
    }

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
            btLog(
                ctx,
                `recapture:${recaptureId}`,
                `[AI] ${ctx.army.name} 收复本军出发点【${recaptureCity.name}】`
            );
            return BTStatus.SUCCESS;
        }
    }

    // ① 先找附近敌军团（野战追击）；无则再选据点
    const nearbyEnemy = pickNearbyEnemyLegion(ctx, excludeTargetIds);
    if (nearbyEnemy) {
        const ePos = nearbyEnemy.getPosition();
        setStrategicArmyTarget(ctx, nearbyEnemy.id, { lat: ePos.lat, lng: ePos.lng });
        ctx.army.setTargetCity(null);
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
    const anchorId = useHomeAnchor
        ? originCityId
        : resolveForwardAnchor(ctx.army.getPosition(), myFaction, originCityId, ctx.cityManager);

    const picked = TargetEvaluator.pickTarget(
        myFaction,
        anchorId,
        ctx.cityManager.getCities(),
        { excludeTargetIds }
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

    const poolN = GameConfig.AI.TARGET_NEAR_POOL;
    const anchorName = ctx.cityManager.getCity(anchorId)?.name ?? anchorId;
    btLog(
        ctx,
        `pick:${target.id}`,
        `[AI] ${ctx.army.name} 战略目标【${target.name}】` +
            `（自【${anchorName}】沿路 ${picked.distanceKm.toFixed(0)} km，近 ${poolN} 敌城抽签）`
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
    clearStrategicTarget(ctx);
    ctx.army.setTargetCity(null);
    ctx.army.stopMovement();

    const name = huntName ?? formatTargetLabel(ctx.cityManager, abandoned);
    btLog(ctx, `abandon:${abandoned}`, `[AI] ${ctx.army.name} 放弃【${name}】`);
    return BTStatus.SUCCESS;
});

/** 追击贴身后：开战由碰撞系统负责；此处仅占位成功，避免误走攻城 */
export const HoldForFieldContact = new Action('HoldForFieldContact', (ctx) => {
    if (!getStrategicTargetArmyId(ctx)) return BTStatus.FAILURE;
    const enemy = refreshHuntArmyTarget(ctx);
    if (!enemy) return BTStatus.FAILURE;
    // 已在战斗则清追击目标
    if (ctx.army.getIsInCombat()) {
        clearStrategicTarget(ctx);
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
    home.troops = clampCityTroopsForCity(home, (home.troops || 0) + merged);
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

/** 本城是否正被攻打（围城/在途/排队） */
export const IsHomeUnderAttack = new Condition('IsHomeUnderAttack', (ctx) => {
    const homeId = getArmyOriginCityId(ctx.army);
    return !!homeId && ctx.legionManager.isCityUnderAttack(homeId);
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
        btLog(ctx, `defend_home:${homeId}`, `[AI] ${army.name} 回援【${homeName}】守城战`);
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
        btLog(ctx, `march_home:${homeId}`, `[AI] ${army.name} 回援本城【${homeName}】`);
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

// 回援本城（不限兵力）：本城正被攻打且仍属己方（未沦陷）、非远征 →
// 抵家则以援军身份中途加入守城，未抵家则星夜回援。
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
    return new Selector('RootSelector', [
        IsInCombat,
        IsWaitingSiege,
        IsPostBattleResting,
        reinforceHome,
        retreatWeakLegion,
        attackSequence,
        Idle,
    ]);
}
