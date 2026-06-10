import { GameConfig } from '../config/GameConfig';

/**
 * 乱斗游戏时间 — 单一真理来源
 *
 * 1x 倍速下（现实时间）：
 *   15 秒 = 1 季（春/夏/秋/冬）
 *   60 秒 = 1 年（4 季）
 *
 * GameApp 每帧计算一次 gameDelta = realDelta × timeScale，
 * 日历、行军、战斗、募兵、战后驻留均使用同一 gameDelta。
 */
export class GameTime {
    static readonly SEASON_DURATION = GameConfig.TIME.SEASON_DURATION;
    static readonly SEASONS_PER_YEAR = GameConfig.TIME.SEASONS_PER_YEAR;
    static readonly YEAR_DURATION = GameConfig.TIME.YEAR_DURATION;
    static readonly POST_BATTLE_REST = GameConfig.TIME.POST_BATTLE_REST;

    /** 现实帧间隔（秒）→ 游戏时间间隔（秒） */
    static toGameDelta(realDeltaSec: number, timeScale: number): number {
        return realDeltaSec * timeScale;
    }
}
