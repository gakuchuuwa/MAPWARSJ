/**
 * 行军减兵（远输困境）v2（2026-07-21 主人定稿：时间口径·一视同仁·15 秒整跳）
 *
 * 语义：timeSinceSupply = 「最后一次途经己方据点至今的游戏秒数」（形成军团即起算；
 *   攻下敌城后该城即己方城，途经即复位；战斗胜利 = 就地进行补给，亦复位）。
 *   · 计时：LegionManager 主循环每帧 += deltaTime（战斗中照走、扣减暂停；战后休整停表停扣；
 *     远征军团 2026-07-27 起同样走表，见 GameConfig.MARCH_ATTRITION.EXEMPT_CAMPAIGN_LEGIONS）；
 *   · 途经复位：距任一己方（同 factionId）据点 ≤ RESET_RADIUS_KM 即清零（不要求驻停，静止军团也生效）；
 *   · 整跳扣减：超过 FREE_SUPPLY_SEC（15 游戏秒 = 1 季度携行粮）后，每 ATTRITION_CHUNK_SEC（15 游戏秒）
 *     对当前兵力扣 ATTRITION_CHUNK_RATE（当前 15%，实际值以 GameConfig 为准），保底 MIN_TROOPS_FLOOR；
 *   · 豁免：战斗中暂停扣减 / 战后休整停表 / str_13 以战养战全免（远征军团已不再豁免）；
 *   · 一视同仁：不分步骑水陆——同样的时间窗，速度快者走得更远，速度优势自动转为后勤优势
 *     （骑兵得补偿；海运快捷但长途航海同样断粮）。
 *
 * 本文件为纯逻辑函数（不持状态、不碰 UI），便于沙盒复刻验证；调用与飘字在 LegionManager。
 */
import { GameConfig } from '../../config/GameConfig';
import { getEuclideanDistance } from '../../core/DistanceUtils';
import { generalHasStrategicEffect, emitFollowedGeneralStrategicMapFx } from '../../combat/GeneralSkillCombat';
import type { Army } from '../Army';

/**
 * 每帧减员 tick。返回本帧实际扣减的整数兵力（供 LegionManager 飘字），0 = 本帧无扣减。
 *
 * 整跳模型（主人裁定 2026-07-21）：断粮后向 attritionChunkSec 累计，攒满 ATTRITION_CHUNK_SEC
 * 一跳、一次扣 ATTRITION_CHUNK_RATE——不逐帧涓流，飘字天然 15 秒一跳、观众可读；单跳至少扣 1。
 * 一帧 dt 再大也只结一跳（余量留到下帧），避免暂停恢复后单帧暴扣。
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
    if (generalHasStrategicEffect(army, 'march_attrition_immunity')) {
        const pos = army.getPosition();
        emitFollowedGeneralStrategicMapFx(army, 'march_attrition_immunity', pos.lat, pos.lng, 'pulse', { dedupeMs: 8000, dedupeKey: `${army.id}|march_attrition_immunity` });
        return 0;
    }

    // 免费补给时间窗：FREE_SUPPLY_SEC 游戏秒 = 1 季度携行粮
    if (army.timeSinceSupply <= cfg.FREE_SUPPLY_SEC) return 0;

    // 刚跨过免费期首帧：种子化为满 chunk，立刻触发第一次扣减（断粮即损，不等下一轮攒满）
    //
    // 🔴 [2026-08-26 修·15 秒跳变成 15+1 秒连跳] 原判据是 `attritionChunkSec === 0`，
    //    而每次扣减后 `-= ATTRITION_CHUNK_SEC` 恰好把它归零 —— 下一帧又被判成「首帧」
    //    重新种子化成满值，当场再扣一次。实测（scratch/_attr_probe.mts，dt=1s）：
    //      第 30s 扣 3825 → 第 31s 又扣 3251；第 45s / 第 46s 同样连跳……
    //    节奏成了 15s、1s、14s、1s…… 实际损耗几乎翻倍，与「15 秒整跳、飘字不刷屏」的定稿不符。
    //    改判「本帧是否**刚**跨过免费窗」：只有跨过那一刻才种子化，此后一律正常累计。
    const justRanOut = army.timeSinceSupply - deltaTime <= cfg.FREE_SUPPLY_SEC;
    if (justRanOut) {
        army.attritionChunkSec = cfg.ATTRITION_CHUNK_SEC + deltaTime;
    } else {
        army.attritionChunkSec += deltaTime;
    }
    if (army.attritionChunkSec < cfg.ATTRITION_CHUNK_SEC) return 0;
    army.attritionChunkSec -= cfg.ATTRITION_CHUNK_SEC;
    const loss = Math.min(
        troops - cfg.MIN_TROOPS_FLOOR,
        Math.max(1, Math.floor(troops * cfg.ATTRITION_CHUNK_RATE)),
    );
    if (loss <= 0) return 0;
    army.setTroops(troops - loss);
    return loss;
}

/**
 * 途经复位：距任一己方据点 ≤ RESET_RADIUS_KM 即 timeSinceSupply 与 attritionChunkSec 清零。
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
    if (army.timeSinceSupply === 0 && army.attritionChunkSec === 0) return false;

    const radiusDeg = cfg.RESET_RADIUS_KM / cfg.KM_PER_DEGREE;
    const pos = army.getPosition();
    for (const city of ownCities) {
        const dist = getEuclideanDistance(pos, { lat: city.latitude, lng: city.longitude });
        if (dist <= radiusDeg) {
            army.timeSinceSupply = 0;
            army.attritionChunkSec = 0;
            return true;
        }
    }
    return false;
}
