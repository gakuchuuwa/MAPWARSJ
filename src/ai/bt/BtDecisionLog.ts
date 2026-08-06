import { GameConfig } from '../../config/GameConfig';
import { gameLog, gameWarn } from '../../utils/GameLogger';
import type { BTContext } from './BehaviorTree';

export function getStrategicTargetId(ctx: BTContext): string | null {
    return ctx.strategicTargetCityId ?? ctx.targetCityId;
}

export function getStrategicTargetArmyId(ctx: BTContext): string | null {
    return ctx.strategicTargetArmyId ?? null;
}

/** 冷却/日志用：军团目标记为 army:id，与城 id 不撞 */
export function getStrategicTargetKey(ctx: BTContext): string | null {
    const armyId = getStrategicTargetArmyId(ctx);
    if (armyId) return `army:${armyId}`;
    return getStrategicTargetId(ctx);
}

export function setStrategicTarget(
    ctx: BTContext,
    cityId: string,
    position: { lat: number; lng: number }
): void {
    ctx.strategicTargetArmyId = null;
    ctx.strategicTargetCityId = cityId;
    ctx.targetCityId = cityId;
    ctx.targetPosition = position;
    ctx.huntBlockedSinceMs = null;
}

/**
 * 改追击敌军团。
 * 【2026-08-06】不再清空 strategicTargetCityId：攻城目标挂起，追击结束后由 clearHuntTarget 恢复，
 * 避免半路失忆重抽签导致折返。追击进行中仍以 armyId 为优先（getStrategicTargetKey / MoveToTarget）。
 */
export function setStrategicArmyTarget(
    ctx: BTContext,
    armyId: string,
    position: { lat: number; lng: number }
): void {
    ctx.strategicTargetArmyId = armyId;
    ctx.targetPosition = position;
    ctx.huntBlockedSinceMs = null; // 换了追击对象，卡住计时重新开始
}

/** 仅结束野战追击，保留挂起的攻城目标（半路恢复行军用） */
export function clearHuntTarget(ctx: BTContext): void {
    ctx.strategicTargetArmyId = null;
    ctx.huntBlockedSinceMs = null;
    const cityId = ctx.strategicTargetCityId ?? ctx.targetCityId;
    if (cityId && ctx.cityManager?.getCity) {
        const city = ctx.cityManager.getCity(cityId);
        if (city) {
            ctx.targetPosition = { lat: city.latitude, lng: city.longitude };
            return;
        }
    }
}

export function clearStrategicTarget(ctx: BTContext): void {
    ctx.strategicTargetArmyId = null;
    ctx.strategicTargetCityId = null;
    ctx.targetCityId = null;
    ctx.targetPosition = null;
    ctx.huntBlockedSinceMs = null;
}

export function markTargetCooldown(ctx: BTContext, targetId: string, _reason: string): void {
    if (!targetId) return;
    ctx.recentFailedTargets.set(targetId, performance.now());
}

export function btLog(ctx: BTContext, key: string, message: string, asWarn = false): void {
    const throttleMs = GameConfig.AI.BT_LOG_THROTTLE_MS;
    const logKey = `${ctx.army.id}:${key}`;
    const now = performance.now();
    const last = ctx.btLogThrottle.get(logKey) ?? 0;
    if (now - last < throttleMs) return;
    ctx.btLogThrottle.set(logKey, now);

    if (asWarn) {
        gameWarn('ai', message);
    } else {
        gameLog('ai', message);
    }
}

export function formatTargetLabel(
    cityManager: { getCity: (id: string) => { name: string } | undefined },
    cityId: string | null
): string {
    if (!cityId) return '-';
    const city = cityManager.getCity(cityId);
    return city ? `${city.name}` : cityId;
}
