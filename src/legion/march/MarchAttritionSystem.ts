/**
 * 行军减兵（远输困境）v1（2026-07-21 主人逐条裁定，GAME_DIRECTION「携行粮」口径 B）
 *
 * 语义：kmSinceSupply = 「越过最后一座己方城之后走了多远」（km）。
 *   · 里程累计：LegionManager 主循环按帧位移 haversine 累加（战斗中/海上不计）；
 *   · 途经复位：距任一己方（同 factionId）据点 ≤ RESET_RADIUS_KM 即清零（不要求驻停，静止军团也生效）；
 *   · 分档扣减：超过 FREE_KM 后对当前兵力按 TIERS 每秒百分比减员，保底 MIN_TROOPS_FLOOR；
 *   · 豁免：战斗中暂停 / 远征军团整体豁免（含岳飞脚本军）/ 海运冻结 / str_13 以战养战全免。
 *
 * 本文件为纯逻辑函数（不持状态、不碰 UI），便于沙盒复刻验证；调用与飘字在 LegionManager。
 */
import { GameConfig } from '../../config/GameConfig';
import { getEuclideanDistance } from '../../core/DistanceUtils';
import { generalHasStrategicEffect } from '../../combat/GeneralSkillCombat';
import type { Army } from '../Army';

/**
 * 球面距离（km）。R=6371，与 RoadRegistry.haversineDistance 同源同式
 * （RoadRegistry 该函数为 private 未导出，此处等价重写，勿改数值）。
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 按 kmSinceSupply 查当前减员费率（每秒对当前兵力百分比）。
 * 0–FREE_KM 免；之后命中 TIERS 第一个上界 ≥ 当前里程的档。
 */
export function getAttritionRatePerSec(kmSinceSupply: number): number {
    const cfg = GameConfig.MARCH_ATTRITION;
    if (kmSinceSupply <= cfg.FREE_KM) return 0;
    for (const tier of cfg.TIERS) {
        if (kmSinceSupply <= tier.upToKm) return tier.ratePerSec;
    }
    return 0;
}

/**
 * 每帧减员 tick。返回本帧实际扣减的整数兵力（供 LegionManager 飘字汇总），0 = 本帧无扣减。
 *
 * 扣减用小数累加器：低费率档（0.3%/秒）× 每帧小 dt 下先攒小数、满 1 才扣，
 * 保证任意帧率下速率精确——严禁照抄坚壁清野 max(1, floor(...)) 每帧至少扣 1 的写法，
 * 那写法在 0.3%/秒低费率下会严重超扣（主人裁定口径）。
 */
export function tickMarchAttrition(army: Army, deltaTime: number): number {
    const cfg = GameConfig.MARCH_ATTRITION;
    if (!cfg.ENABLED) return 0;
    if (army.isDestroyed) return 0;
    // 战斗暂停：战斗结算按兵力锁配速（含 80% 翻盘阈值），外部掉血会搅乱六计判定
    if (army.getIsInCombat()) return 0;
    // 远征军团整体豁免（expeditionTargetCityId 非空，含岳飞脚本军）
    if (cfg.EXEMPT_CAMPAIGN_LEGIONS && army.expeditionTargetCityId != null) return 0;
    // 海运豁免：海上地形不计里程也不扣减（isOnSea 为 Army 地形去抖后的确认状态）
    if (cfg.SEA_EXEMPT && army.isOnSea) return 0;

    const troops = army.getTroops();
    if (troops <= cfg.MIN_TROOPS_FLOOR) return 0;

    // str_13 以战养战：行军减兵全免（写法照抄 Army.updateTerrainSpeed 查 mountain_march_immunity）
    if (generalHasStrategicEffect(army, 'march_attrition_immunity')) return 0;

    const ratePerSec = getAttritionRatePerSec(army.kmSinceSupply);
    if (ratePerSec <= 0 || deltaTime <= 0) return 0;

    army.attritionLossCarry += troops * ratePerSec * deltaTime;
    const whole = Math.floor(army.attritionLossCarry);
    if (whole < 1) return 0;
    army.setTroops(Math.max(cfg.MIN_TROOPS_FLOOR, troops - whole));
    army.attritionLossCarry -= whole;
    return whole;
}

/**
 * 途经复位：距任一己方据点 ≤ RESET_RADIUS_KM 即 kmSinceSupply 与 attritionLossCarry 清零。
 * 「己方城」由调用方筛好传入（LegionManager 用 cityManager.getCitiesByFaction(army.getFactionId())，
 * 与 FollowResupplySystem 同款查询）；空 factionId 传空数组自然不命中。
 * 半径换算：km ÷ KM_PER_DEGREE → 度，用 getEuclideanDistance（与 FollowResupplySystem 口径一致）。
 * 静止军团也生效；返回是否真的发生了清零。
 */
export function resetKmSinceSupplyIfNearOwnCity(
    army: Army,
    ownCities: readonly { latitude: number; longitude: number }[],
): boolean {
    const cfg = GameConfig.MARCH_ATTRITION;
    if (!cfg.ENABLED) return false;
    if (army.isDestroyed) return false;
    if (army.kmSinceSupply === 0 && army.attritionLossCarry === 0) return false;

    const radiusDeg = cfg.RESET_RADIUS_KM / cfg.KM_PER_DEGREE;
    const pos = army.getPosition();
    for (const city of ownCities) {
        const dist = getEuclideanDistance(pos, { lat: city.latitude, lng: city.longitude });
        if (dist <= radiusDeg) {
            army.kmSinceSupply = 0;
            army.attritionLossCarry = 0;
            return true;
        }
    }
    return false;
}
