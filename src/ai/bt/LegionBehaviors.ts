/**
 * LegionBehaviors.ts
 *
 * 军团 AI 行为树节点（收复发出点 → 推进锚点近敌池抽签 → 沿路推进 → 攻城）
 *
 * 双模式（GAME_DIRECTION 2026-06-11）：
 *   基础模式：家城失守强制回师（HasTarget/FindTarget 内的 resolveRecaptureTarget，所有文化无豁免）
 *           → 推进锚点近 3 敌城抽签
 *   远征模式：army.expeditionTargetCityId 锁死目标，断粮不回师，直至占领或全军覆没（仅玩家可下令）
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
import { getEuclideanDistance } from '../../core/DistanceUtils';

// =====================
// 条件检查节点
// =====================

export const IsInCombat = new Condition('IsInCombat', (ctx) => ctx.army.getIsInCombat());

export const IsPostBattleResting = new Condition('IsPostBattleResting', (ctx) => {
    return ctx.army.isPostBattleResting?.() ?? false;
});

/** 第三方攻城排队中：原地待命，不重新选目标 */
export const IsWaitingSiege = new Condition('IsWaitingSiege', (ctx) =>
    ctx.legionManager.isArmyWaitingSiege(ctx.army.id),
);

/**
 * 远征模式（GAME_DIRECTION「远征细则」2026-06-11）：
 * expeditionTargetCityId 非 null 时目标锁死、断粮不回师；
 * 目标城已属己方（无论谁打下的）→ 远征功成，回归基础模式。
 * 返回 'locked'（继续远征）| 'done'（刚结束）| null（非远征）。
 */
function resolveExpeditionState(ctx: BTContext): 'locked' | 'done' | null {
    const expeditionId: string | null = ctx.army.expeditionTargetCityId ?? null;
    if (!expeditionId) return null;

    const myFaction = ctx.army.getFactionId();
    const target = ctx.cityManager.getCity(expeditionId);

    if (!target || target.factionId === myFaction) {
        ctx.army.expeditionTargetCityId = null;
        clearStrategicTarget(ctx);
        ctx.army.setTargetCity(null);
        gameLog(
            'expedition',
            `🐎 [远征] ${ctx.army.name} 远征${target ? `【${target.name}】功成` : '目标已不存在'}，回归基础模式`
        );
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

export function createLegionBehaviorTree(): BTNode {
    return new Selector('RootSelector', [
        IsInCombat,
        IsWaitingSiege,
        IsPostBattleResting,
        attackSequence,
        Idle,
    ]);
}
