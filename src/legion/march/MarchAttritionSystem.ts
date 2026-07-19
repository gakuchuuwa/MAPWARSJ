/**
 * 行军减兵（远输困境）v2（2026-07-21 主人定稿：时间口径·一视同仁）
 *
 * 语义：timeSinceSupply = 「最后一次途经己方据点至今的游戏秒数」（形成军团即起算；
 *   攻下敌城后该城即己方城，途经即复位）。
 *   · 计时：LegionManager 主循环每帧 += deltaTime（战斗中照走、扣减暂停；战后休整停表停扣；远征豁免军团不走表）；
 *   · 途经复位：距任一己方（同 factionId）据点 ≤ RESET_RADIUS_KM 即清零（不要求驻停，静止军团也生效）；
 *   · 扣减：超过 FREE_SUPPLY_SEC（15 游戏秒 = 1 季度携行粮）后对当前兵力按 ATTRITION_RATE_PER_SEC
 *     每秒百分比减员，保底 MIN_TROOPS_FLOOR；
 *   · 豁免：战斗中暂停扣减 / 远征军团整体豁免（含岳飞脚本军）/ str_13 以战养战全免；
 *   · 一视同仁：不分步骑水陆——同样的时间窗，速度快者走得更远，速度优势自动转为后勤优势
 *     （骑兵得补偿；海运快捷但长途航海同样断粮）。
 *
 * 本文件为纯逻辑函数（不持状态、不碰 UI），便于沙盒复刻验证；调用与飘字在 LegionManager。
 */
import { GameConfig } from '../../config/GameConfig';
import { getEuclideanDistance } from '../../core/DistanceUtils';
import { generalHasStrategicEffect } from '../../combat/GeneralSkillCombat';
import type { Army } from '../Army';

/**
 * 每帧减员 tick。返回本帧实际扣减的整数兵力（供 LegionManager 飘字汇总），0 = 本帧无扣减。
 *
 * 扣减用小数累加器：低费率 × 每帧小 dt 下先攒小数、满 1 才扣，保证任意帧率下速率精确——
 * 严禁照抄坚壁清野 max(1, floor(...)) 每帧至少扣 1 的写法，那写法在低费率下会严重超扣（主人裁定口径）。
 */
export function tickMarchAttrition(army: Army, deltaTime: number): number {
    const cfg = GameConfig.MARCH_ATTRITION;
    if (!cfg.ENABLED) return 0;
    if (army.isDestroyed) return 0;
    // 战斗暂停扣减：战斗结算按兵力锁配速（含 80% 翻盘阈值），外部掉血会搅乱六计判定（计时照走，在 LegionManager 累计）
    if (army.getIsInCombat()) return 0;
    // 战后休整：停表停扣（主人裁定：休整为战斗余韵；战斗中照走表但扣减暂停）
    if (army.isPostBattleResting?.()) return 0;
    // 远征军团整体豁免（expeditionTargetCityId 非空，含岳飞脚本军）
    if (cfg.EXEMPT_CAMPAIGN_LEGIONS && army.expeditionTargetCityId != null) return 0;

    const troops = army.getTroops();
    if (troops <= cfg.MIN_TROOPS_FLOOR) return 0;

    // str_13 以战养战：行军减兵全免（写法照抄 Army.updateTerrainSpeed 查 mountain_march_immunity）
    if (generalHasStrategicEffect(army, 'march_attrition_immunity')) return 0;

    // 免费补给时间窗：FREE_SUPPLY_SEC 游戏秒 = 1 季度携行粮
    if (army.timeSinceSupply <= cfg.FREE_SUPPLY_SEC) return 0;

    army.attritionLossCarry += troops * cfg.ATTRITION_RATE_PER_SEC * deltaTime;
    const whole = Math.floor(army.attritionLossCarry);
    if (whole < 1) return 0;
    army.setTroops(Math.max(cfg.MIN_TROOPS_FLOOR, troops - whole));
    army.attritionLossCarry -= whole;
    return whole;
}

/**
 * 途经复位：距任一己方据点 ≤ RESET_RADIUS_KM 即 timeSinceSupply 与 attritionLossCarry 清零。
 * 「己方城」由调用方筛好传入（LegionManager 用 cityManager.getCitiesByFaction(army.getFactionId())，
 * 与 FollowResupplySystem 同款查询）；空 factionId 传空数组自然不命中。
 * 半径换算：km ÷ KM_PER_DEGREE → 度，用 getEuclideanDistance（与 FollowResupplySystem 口径一致）。
 * 静止军团也生效；返回是否真的发生了清零。
 */
export function resetSupplyTimerIfNearOwnCity(
    army: Army,
    ownCities: readonly { latitude: number; longitude: number }[],
): boolean {
    const cfg = GameConfig.MARCH_ATTRITION;
    if (!cfg.ENABLED) return false;
    if (army.isDestroyed) return false;
    if (army.timeSinceSupply === 0 && army.attritionLossCarry === 0) return false;

    const radiusDeg = cfg.RESET_RADIUS_KM / cfg.KM_PER_DEGREE;
    const pos = army.getPosition();
    for (const city of ownCities) {
        const dist = getEuclideanDistance(pos, { lat: city.latitude, lng: city.longitude });
        if (dist <= radiusDeg) {
            army.timeSinceSupply = 0;
            army.attritionLossCarry = 0;
            return true;
        }
    }
    return false;
}
