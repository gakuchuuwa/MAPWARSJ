import { GameConfig } from '../config/GameConfig';

/**
 * 乱斗游戏时间 — 单一真理来源
 *
 * 1x 倍速下（现实时间）：
 *   15 秒 = 1 季（春/夏/秋/冬）
 *   60 秒 = 1 年（4 季）
 *
 * 游戏秒 = 真实秒（倍速已删除，GameApp 每帧直接把 realDelta 当 gameDelta 用）。
 */
export class GameTime {
    static readonly SEASON_DURATION = GameConfig.TIME.SEASON_DURATION;
    static readonly SEASONS_PER_YEAR = GameConfig.TIME.SEASONS_PER_YEAR;
    static readonly YEAR_DURATION = GameConfig.TIME.YEAR_DURATION;
    static readonly POST_BATTLE_REST = GameConfig.TIME.POST_BATTLE_REST;
}
