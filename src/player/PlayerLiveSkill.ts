/**
 * 直播观众共同操作的玩家技能：与武将六计、集气槽和主将光环完全分开。
 * 作用范围跟随玩家官职：斥候本人，探马本人和本队；不改兵种基础属性。
 * 更高官职沿用现有指挥范围，仍与武将六计、集气槽和主将光环完全分开。
 */
export const PLAYER_LIVE_SKILL = {
    /** 每次释放增加的持续秒数；连续释放累加，不刷新吞掉前一次 */
    durationSec: 12,
    /** 技能范围内单位的伤害倍率 */
    damageMult: 4,
    /** 技能范围内单位的攻击频率倍率 */
    attackSpeedMult: 2,
    /** 技能范围内单位的受伤倍率 */
    damageTakenMult: 0.25,
} as const;

export type PlayerLiveControl = 'none' | 'one' | 'front' | 'all';

/** 官职技能范围的唯一判定：本人始终包含；其他单位必须同方且在既有指挥范围内。 */
export function playerLiveSkillAffects(
    control: PlayerLiveControl,
    playerSide: number,
    unitSide: number,
    isPlayerHero: boolean,
    inControlledLane: boolean,
): boolean {
    if (unitSide !== playerSide) return false;
    if (isPlayerHero) return true;
    if (control === 'none') return false;
    if (control === 'all') return true;
    return inControlledLane;
}
