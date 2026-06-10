import { GameConfig } from '../../config/GameConfig';
import { gameLog, gameWarn } from '../../utils/GameLogger';
import type { BTContext } from './BehaviorTree';

export function getStrategicTargetId(ctx: BTContext): string | null {
    return ctx.strategicTargetCityId ?? ctx.targetCityId;
}

export function setStrategicTarget(
    ctx: BTContext,
    cityId: string,
    position: { lat: number; lng: number }
): void {
    ctx.strategicTargetCityId = cityId;
    ctx.targetCityId = cityId;
    ctx.targetPosition = position;
}

export function clearStrategicTarget(ctx: BTContext): void {
    ctx.strategicTargetCityId = null;
    ctx.targetCityId = null;
    ctx.targetPosition = null;
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
