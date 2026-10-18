/**
 * 行军减兵（远输困境）v2（2026-07-21 主人定稿：时间口径·一视同仁·15 秒整跳）
 *
 * 语义：timeSinceSupply = 「最后一次途经己方据点至今的游戏秒数」（形成军团即起算；
 *   攻下敌城后该城即己方城，途经即复位；战斗胜利 = 就地进行补给，亦复位）。
 *   · 计时：LegionManager 主循环每帧 += deltaTime（战斗中照走、扣减暂停；战后休整停表停扣；
 *     远征军团 2026-07-27 起同样走表，见 GameConfig.MARCH_ATTRITION.EXEMPT_CAMPAIGN_LEGIONS）；
 *   · 途经复位：距任一己方（同 factionId）据点 ≤ RESET_RADIUS_KM 即清零（不要求驻停，静止军团也生效）；
 *   · 整跳扣减：陆上超过 15 游戏秒、海上超过 30 游戏秒后，每 ATTRITION_CHUNK_SEC（15 游戏秒）
 *     对当前兵力按连续跳数逐次加重（当前 15%、30%、45%……），允许归零；
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
import { isScriptPeriod } from '../../events/scriptPeriod';
import { CITIES_V2 } from '../../data/cities_v2';
import { toCulture66 } from '../../systems/CultureHierarchy';

const CITY_STYLE_BY_ID = new Map<string, string>();
const CAPITAL_STYLE_BY_FACTION = new Map<string, string>();
for (const c of CITIES_V2) {
    if (c.buildingStyle) {
        CITY_STYLE_BY_ID.set(c.id, c.buildingStyle);
        if (c.factionId && !CAPITAL_STYLE_BY_FACTION.has(c.factionId)) {
            CAPITAL_STYLE_BY_FACTION.set(c.factionId, c.buildingStyle);
        }
    }
}

/**
 * 解析军团所属的 66 文化键（62 二级 + 4 三级）：
 *   1. 优先取军团出兵据点（homeCityId / sourceCityId）的 buildingStyle；
 *   2. 其次取所属势力首都在 CITIES_V2 的 buildingStyle；
 *   3. 兜底由 army.cultureRegion 映射至 66 文化分支键。
 */
export function resolveArmyCulture66Key(army: Army): string | null {
    const cityId = army.homeCityId ?? army.getSourceCityId?.() ?? null;
    if (cityId) {
        const bs = CITY_STYLE_BY_ID.get(cityId);
        if (bs) return toCulture66(bs);
    }
    const factionId = army.getFactionId?.();
    if (factionId) {
        const bs = CAPITAL_STYLE_BY_FACTION.get(factionId);
        if (bs) return toCulture66(bs);
    }
    if (army.cultureRegion) return toCulture66(army.cultureRegion);
    return null;
}

/**
 * 判定军团当前所处水陆地形是否命中文化行军减兵豁免：
 *   · 海上行军（army.isOnSea === true）：命中 NAVAL_IMMUNE_CULTURES（北欧系、马来、葡、西、雅典）不减兵；
 *   · 陆地行军（!army.isOnSea）：命中 LAND_IMMUNE_CULTURES（草原游牧系、马扎尔、柏柏尔）不减兵。
 */
export function isArmyCultureExemptFromMarchAttrition(army: Army): boolean {
    const culture66 = resolveArmyCulture66Key(army);
    if (!culture66) return false;
    const cfg = GameConfig.MARCH_ATTRITION;
    if (army.isOnSea) {
        return cfg.NAVAL_IMMUNE_CULTURES.includes(culture66);
    }
    return cfg.LAND_IMMUNE_CULTURES.includes(culture66);
}

/** ③ 山地行军专精：命中 MOUNTAIN_MARCH_IMMUNE_CULTURES 的文化在山地行军如履平地（不减速） */
export function isArmyCultureMountainMarchImmune(army: Army): boolean {
    const culture66 = resolveArmyCulture66Key(army);
    if (!culture66) return false;
    return GameConfig.CULTURE_COMBAT.MOUNTAIN_MARCH_IMMUNE_CULTURES.includes(culture66);
}

/** ④ 渡海/水网机动：命中 SEA_SPEED_BONUS_CULTURES 的文化在海上航行移速 ×1.25 */
export function getArmyCultureSeaSpeedMultiplier(army: Army): number {
    const culture66 = resolveArmyCulture66Key(army);
    if (!culture66) return 1.0;
    return GameConfig.CULTURE_COMBAT.SEA_SPEED_BONUS_CULTURES.includes(culture66)
        ? GameConfig.CULTURE_COMBAT.SEA_SPEED_BONUS_MULT
        : 1.0;
}

/**
 * 每帧减员 tick。返回本帧实际扣减的整数兵力（供 LegionManager 飘字），0 = 本帧无扣减。
 *
 * 整跳模型（主人裁定 2026-07-21）：断粮后向 attritionChunkSec 累计，攒满 ATTRITION_CHUNK_SEC
 * 一跳、一次提高 ATTRITION_CHUNK_RATE——不逐帧涓流，飘字天然 15 秒一跳、观众可读；单跳至少扣 1。
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
    // 🔴 [2026-09-11 主人定 / 2026-09-12 归位] 剧本军团不扣兵：**剧本武将身份（isScriptArmy）特权**，
    //    （原话「剧本军团没有 15 秒兵力消耗」）。2026-09-12 主人定「军本与乱斗分开」——
    //    这个「不扣兵」是剧本身份，不是行军豁免（scriptMarchExempt），故改判 isScriptArmy。
    //    不豁免的后果是实的：跑过 15 秒免费期后每 15 秒扣 15%/30%/45%……，
    //    剧本写死的 35000 兵会在抵达战场前被啃光，甚至归零触发「战败销毁」→ 剧本整条断掉。
    //    与远征豁免（`EXEMPT_CAMPAIGN_LEGIONS`，2026-07-27 主人定为 false）是**两回事**，勿合并。
    // 亚历山大恢复常规战略地图减兵（2026-09-13）。
    if (army.isScriptArmy && army.generalId !== 'gen_alexander_great') return 0;
    // 🔴 [2026-09-23 主人定「剧本模式下，士兵数会在15秒自动减少，这个没有关闭」]
    //    历史剧本期一律不扣兵：兵力按史料写死，路上不许被啃掉。乱斗模式照旧。
    if (isScriptPeriod()) return 0;
    // 远征军团整体豁免（expeditionTargetCityId 非空，含岳飞脚本军）
    if (cfg.EXEMPT_CAMPAIGN_LEGIONS && army.expeditionTargetCityId != null) return 0;

    const troops = army.getTroops();
    if (troops <= 0) return 0;

    // 文化特性豁免：海上不减兵文化在海上、陆地不减兵文化在陆地行军时自给自足，清零断粮计时并免扣兵
    if (isArmyCultureExemptFromMarchAttrition(army)) {
        army.timeSinceSupply = 0;
        army.attritionChunkSec = 0;
        army.attritionChunkCount = 0;
        return 0;
    }

    // str_13 以战养战：行军减兵全免（写法照抄 Army.updateTerrainSpeed 查 mountain_march_immunity）
    if (generalHasStrategicEffect(army, 'march_attrition_immunity')) {
        const pos = army.getPosition();
        emitFollowedGeneralStrategicMapFx(army, 'march_attrition_immunity', pos.lat, pos.lng, 'pulse', { dedupeMs: 8000, dedupeKey: `${army.id}|march_attrition_immunity` });
        return 0;
    }

    // 舰船载粮能力更强：海上免费补给期为 30 秒，陆上为 15 秒。
    const freeSupplySec = army.isOnSea ? cfg.NAVAL_FREE_SUPPLY_SEC : cfg.FREE_SUPPLY_SEC;
    if (army.timeSinceSupply <= freeSupplySec) return 0;

    // 刚跨过免费期首帧：种子化为满 chunk，立刻触发第一次扣减（断粮即损，不等下一轮攒满）
    //
    // 🔴 [2026-08-26 修·15 秒跳变成 15+1 秒连跳] 原判据是 `attritionChunkSec === 0`，
    //    而每次扣减后 `-= ATTRITION_CHUNK_SEC` 恰好把它归零 —— 下一帧又被判成「首帧」
    //    重新种子化成满值，当场再扣一次。实测（scratch/_attr_probe.mts，dt=1s）：
    //      第 30s 扣 3825 → 第 31s 又扣 3251；第 45s / 第 46s 同样连跳……
    //    节奏成了 15s、1s、14s、1s…… 实际损耗几乎翻倍，与「15 秒整跳、飘字不刷屏」的定稿不符。
    //    改判「本帧是否**刚**跨过免费窗」：只有跨过那一刻才种子化，此后一律正常累计。
    const justRanOut = army.timeSinceSupply - deltaTime <= freeSupplySec;
    if (justRanOut) {
        army.attritionChunkSec = cfg.ATTRITION_CHUNK_SEC + deltaTime;
    } else {
        army.attritionChunkSec += deltaTime;
    }
    if (army.attritionChunkSec < cfg.ATTRITION_CHUNK_SEC) return 0;
    army.attritionChunkSec -= cfg.ATTRITION_CHUNK_SEC;
    army.attritionChunkCount += 1;
    const escalatingRate = cfg.ATTRITION_CHUNK_RATE * army.attritionChunkCount;
    const loss = Math.min(
        troops,
        Math.max(1, Math.floor(troops * escalatingRate)),
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
    if (army.timeSinceSupply === 0 && army.attritionChunkSec === 0 && army.attritionChunkCount === 0) return false;

    const radiusDeg = cfg.RESET_RADIUS_KM / cfg.KM_PER_DEGREE;
    const pos = army.getPosition();
    for (const city of ownCities) {
        const dist = getEuclideanDistance(pos, { lat: city.latitude, lng: city.longitude });
        if (dist <= radiusDeg) {
            army.timeSinceSupply = 0;
            army.attritionChunkSec = 0;
            army.attritionChunkCount = 0;
            return true;
        }
    }
    return false;
}
