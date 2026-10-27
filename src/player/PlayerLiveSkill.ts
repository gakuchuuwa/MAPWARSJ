/**
 * 直播观众共同操作的玩家技能：与武将六计、集气槽和主将光环完全分开。
 * 只作用于 Scene13 的 heroMan，不改兵种基础属性，也不影响同兵模普通士兵。
 */
export const PLAYER_LIVE_SKILL = {
    /** 每次释放增加的持续秒数；连续释放累加，不刷新吞掉前一次 */
    durationSec: 12,
    /** 玩家本人伤害倍率 */
    damageMult: 4,
    /** 玩家本人攻击频率倍率 */
    attackSpeedMult: 2,
    /** 玩家本人受伤倍率 */
    damageTakenMult: 0.25,
} as const;
