/**
 * 玩家官职在战术战场上的受控编队范围：
 * 斥候本人（none），探马本人和本队（one），先锋本人和本排（front），将军及以上本人和本军（all）。
 */
export type PlayerLiveControl = 'none' | 'one' | 'front' | 'all';

/** 官职范围的唯一判定：本人始终包含；其他单位必须同方且在既有指挥范围内。 */
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
