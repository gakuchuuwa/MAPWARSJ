/**
 * 野战打掉据点武将 —— 记录在该据点上，供随后攻城判「不战而下」。
 *
 * 🔴 [2026-10-24 主人令]
 *   主人原话：「刚才的逻辑有个前提，就是上一次战斗，野战中刚刚打败了这个据点的武将。」
 *   · 野战结束时记：败方参战军团带着**该据点锚定的武将**（`homeCityId ?? sourceCityId`，
 *     且该武将条目的 `cityId` 就是这座据点）→ 在据点记「胜方势力」；
 *   · 攻城开战前判：攻方势力＝记录的胜方势力、守方这一仗无将出场、攻方兵力 ≥ 守军 5 倍、
 *     据点不是关隘、**乱斗或历史模式** → 不战而下（守军置 1000，播报「开城归附」）；
 *   · **只供该据点的下一场攻城用**：这场攻城一开（不论哪一方来、也不论中不中），取过一次即失效
 *     —— 对应「上一仗」这个前提。
 *
 * 🔴 [2026-10-24 下午 主人「你觉得历史模式也该是这样」] 历史模式同样适用：
 *   历史模式的空城本来就多（将未登场/已退场），若只按「无将」免战会白送；带上
 *   「刚被打掉武将」这个野战前提，只在「野战决胜后乘胜拔城」这一种情形生效，不会滥发。
 *   剧本模式仍不适用（史实战役必须打，且经典战攻城另有闸门）。
 *
 * 纯运行时记录：不进存档、不占 City / Army 字段（与 `DefeatCooldown` 同一做法）。
 */
export interface CityFieldDefeatRecord {
    /** 这场野战的胜方势力：只有它能受降（第三方跑来不算白捡） */
    winnerFactionId: string;
}

/** 生效模式：乱斗 ＋ 历史模式（剧本不适用；编辑器/离线未注入模式＝null 也不适用） */
export const FIELD_YIELD_GAME_MODES: ReadonlySet<string> = new Set(['melee', 'centenarian']);

const records = new Map<string, CityFieldDefeatRecord>();

/** 野战结束：某据点锚定的武将随军团被打掉 */
export function markCityGeneralDefeatedInField(cityId: string, winnerFactionId: string): void {
    if (!cityId || !winnerFactionId) return;
    records.set(cityId, { winnerFactionId });
}

/** 该据点是否刚在野战中被打掉武将（未消费） */
export function getCityFieldDefeat(cityId: string): CityFieldDefeatRecord | undefined {
    return records.get(cityId);
}

/** 取走记录：一次即失效（这场攻城一开就算用掉，不论是否触发不战而下） */
export function consumeCityFieldDefeat(cityId: string): CityFieldDefeatRecord | undefined {
    const rec = records.get(cityId);
    if (rec) records.delete(cityId);
    return rec;
}

/** 清空全部记录：切玩法模式 / 读档时调（旧世界的野战战功不能带进新局面） */
export function clearAllFieldDefeats(): void {
    records.clear();
}

// ───────────────────────────────────────────────────────────────
// 受降判定（纯函数，供 SiegeManager 调用、供探针验收）
// ───────────────────────────────────────────────────────────────

/** 兵力悬殊门槛：守军 ≤ 攻方 1/5（2026-10-24 主人定 5 倍） */
export const FIELD_YIELD_ATTACKER_TROOP_MULTIPLE = 5;

export interface FieldYieldCheckInput {
    /** 该据点刚在野战中被哪个势力打掉武将；undefined = 没有记录 */
    fieldDefeatWinnerFactionId?: string | null;
    attackerFactionId: string;
    /** 守方这一仗是否出场了将（守城军团 + 附近援军都算；有一个就必须打） */
    defenderHasGeneral: boolean;
    attackerTroops: number;
    defenderTroops: number;
    /** 据点类型（'pass' 关隘不适用） */
    cityType: string;
    /** getGameMode()：乱斗／历史模式生效（见 FIELD_YIELD_GAME_MODES） */
    gameMode: string | null;
    /** 剧本经典战攻城禁止跳过战斗 */
    isFirstBattleSiege: boolean;
}

/**
 * 「野战余威受降」判定（2026-11-10 主人定「野战被打败的武将，必须是该据点武将，那么该据点可以不战而降」）：
 * 该据点武将刚在野战中被本势力打败 + 守方这一仗无将 + 乱斗/历史模式 → 100% 直接获得据点。
 */
export function canYieldCityFromFieldDefeat(input: FieldYieldCheckInput): boolean {
    return !!input.gameMode
        && FIELD_YIELD_GAME_MODES.has(input.gameMode)
        && !input.isFirstBattleSiege
        && !!input.fieldDefeatWinnerFactionId
        && input.fieldDefeatWinnerFactionId === input.attackerFactionId
        && !input.defenderHasGeneral
        && input.attackerTroops > 0;
}

