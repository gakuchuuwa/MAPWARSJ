/**
 * LegionBehaviors.ts
 *
 * 军团 AI 行为树节点（收复发出点 → 推进锚点近敌池抽签 → 沿路推进 → 攻城）
 *
 * 双模式（GAME_DIRECTION 2026-06-11）：
 *   据点军团：家城失守强制回师（HasTarget/FindTarget 内的 resolveRecaptureTarget，所有文化无豁免）
 *           → 推进锚点近 3 敌城抽签
 *   远征军团：目标锁死、家城失守不回师（shouldSkipHomeRecapture），直至占领/兵败或全军覆没
 */

import { BTNode, BTStatus, BTContext, Condition, Action, Sequence, Selector } from './BehaviorTree';
import { gameLog } from '../../utils/GameLogger';
import {
    btLog,
    clearStrategicTarget,
    formatTargetLabel,
    getStrategicTargetId,
    markTargetCooldown,
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
import { clampCityTroops } from '../../config/CityConfig';

// =====================
// 条件检查节点
// =====================

export const IsInCombat = new Condition('IsInCombat', (ctx) => ctx.army.getIsInCombat());

export const IsPostBattleResting = new Condition('IsPostBattleResting', (ctx) => {
    return ctx.army.isPostBattleResting?.() ?? false;
});

/** 第三方攻城排队中：原地待命；出发点已失守则打断排队改走收复 */
export const IsWaitingSiege = new Condition('IsWaitingSiege', (ctx) => {
    if (!ctx.legionManager.isArmyWaitingSiege(ctx.army.id)) {
        return false;
    }
    if (!shouldSkipHomeRecapture(ctx.army)) {
        const originCityId = getArmyOriginCityId(ctx.army) ?? '';
        const recaptureId = resolveRecaptureTarget(
            ctx.army.getFactionId(),
            originCityId,
            ctx.cityManager,
        );
        if (recaptureId) {
            ctx.legionManager.dequeueArmyFromThirdPartyWaiters?.(ctx.army.id);
            return false;
        }
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
            if (strategicId !== recaptureId) {
                if (strategicId) {
                    markTargetCooldown(ctx, strategicId, 'capital_recapture');
                }
                clearStrategicTarget(ctx);
                ctx.army.setTargetCity(null);
            }
            return false;
        }
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
    return true;
});

export const IsMoving = new Condition('IsMoving', (ctx) => !ctx.army.isIdle());

const SIEGE_REACH_RADIUS = GameConfig.SIEGE.COMBAT_RADIUS + 0.1;
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

    const anchorId = resolveForwardAnchor(
        ctx.army.getPosition(),
        myFaction,
        originCityId,
        ctx.cityManager
    );

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

export const MoveToTarget = new Action('MoveToTarget', (ctx) => {
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

    if (!ctx.army.isIdle()) {
        return BTStatus.SUCCESS;
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
    const abandoned = getStrategicTargetId(ctx);
    if (!abandoned) {
        return BTStatus.FAILURE;
    }

    markTargetCooldown(ctx, abandoned, 'abandon');
    clearStrategicTarget(ctx);
    ctx.army.setTargetCity(null);
    ctx.army.stopMovement();

    const name = formatTargetLabel(ctx.cityManager, abandoned);
    btLog(ctx, `abandon:${abandoned}`, `[AI] ${ctx.army.name} 放弃【${name}】`);
    return BTStatus.SUCCESS;
});

export const TriggerSiege = new Action('TriggerSiege', (ctx) => {
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
    army.disband();
    ctx.legionManager.removeArmy(army);
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
        btLog(ctx, `march_home:${homeId}`, `[AI] ${army.name}（残兵）撤回出发城【${homeName}】`);
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
    new Sequence('StrikeIfNear', [IsNearTarget, TriggerSiege]),
    new Selector('MarchOrGiveUp', [MoveToTarget, giveUpUnreachable]),
]);

const ensureTarget = new Selector('EnsureTarget', [HasTarget, FindTarget]);

const attackSequence = new Sequence('AttackSequence', [ensureTarget, approachOrStrike]);

// 残兵撤退：抵家则解散并入，否则撤回出发城
const retreatWeakLegion = new Sequence('RetreatWeakLegion', [
    IsWeakLegion,
    new Selector('HomeOrMarch', [
        new Sequence('DisbandAtHome', [IsAtHomeCity, DisbandIntoHome]),
        MarchHome,
    ]),
]);

export function createLegionBehaviorTree(): BTNode {
    return new Selector('RootSelector', [
        IsInCombat,
        IsWaitingSiege,
        IsPostBattleResting,
        retreatWeakLegion,
        attackSequence,
        Idle,
    ]);
}
