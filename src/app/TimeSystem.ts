import { GameConfig } from '../config/GameConfig';
import { GameTime } from './GameTime';

export enum Season {
    春 = 0,
    夏 = 1,
    秋 = 2,
    冬 = 3
}

/**
 * 游戏日历：春→夏→秋→冬→(nextYear)春 …
 * 1x 倍速：15 游戏秒/季，60 游戏秒/年；与历史事件调度无关。
 */
export class TimeSystem {
    private year: number;
    private season: Season;
    private accumulatedTime: number = 0;
    public timeScale: number = 1.0;
    private isPaused: boolean = true;

    constructor(startYear: number = GameConfig.TIME.TIMELINE_START_YEAR) {
        this.year = startYear;
        this.season = Season.春;
    }

    public setYear(year: number): void {
        this.year = year;
        this.notifyYearChange();
    }

    public setSeason(season: Season): void {
        this.season = season;
        this.notifySeasonChange();
    }

    /** @param gameDelta 已乘 timeScale 的游戏时间秒数 */
    /**
     * 单帧最多补算几个季度（2026-06-12 性能）：正常游玩每帧只推进一点点，永远 ≤1 季；
     * 仅在卡顿/切后台再切回那一帧会欠下大量时间——封顶后把补算摊到接下来几帧，
     * 避免所有季度回调（复国/募兵/标签刷新）挤在一帧爆发造成顿挫。
     */
    private static readonly MAX_SEASON_CATCHUP_PER_UPDATE = 4;

    public update(gameDelta: number): void {
        if (this.isPaused || gameDelta <= 0) return;

        this.accumulatedTime += gameDelta;

        const seasonDuration = GameTime.SEASON_DURATION;
        let processed = 0;
        while (
            this.accumulatedTime >= seasonDuration &&
            processed < TimeSystem.MAX_SEASON_CATCHUP_PER_UPDATE
        ) {
            this.accumulatedTime -= seasonDuration;
            this.advanceSeason();
            processed++;
        }
        // 长时间后台等导致欠太多时，钳住溢出（下一帧继续补），避免无限堆积拖慢
        if (this.accumulatedTime > seasonDuration * 2) {
            this.accumulatedTime = seasonDuration;
        }
    }

    private advanceSeason(): void {
        if (this.season < Season.冬) {
            this.season++;
            this.notifySeasonChange();
            return;
        }

        this.nextYear();
    }

    public nextYear(): void {
        this.season = Season.春;
        this.year++;
        if (this.year === 0) {
            this.year = 1;
        }
        this.notifyYearChange();
        this.notifySeasonChange();
    }

    private onYearChangeCallbacks: ((year: number) => void)[] = [];
    private onSeasonChangeCallbacks: ((season: Season, year: number) => void)[] = [];

    public onYearChange(callback: (year: number) => void): void {
        this.onYearChangeCallbacks.push(callback);
    }

    public onSeasonChange(callback: (season: Season, year: number) => void): void {
        this.onSeasonChangeCallbacks.push(callback);
    }

    private notifyYearChange(): void {
        this.onYearChangeCallbacks.forEach(cb => cb(this.year));
    }

    private notifySeasonChange(): void {
        this.onSeasonChangeCallbacks.forEach(cb => cb(this.season, this.year));
    }

    public getFormattedDate(): string {
        const era = this.year < 0 ? '公元前' : '公元';
        const absYear = Math.abs(this.year);
        const periodName = ['春', '夏', '秋', '冬'][this.season];
        return `${era}${absYear}年 ${periodName}`;
    }

    public getYear(): number {
        return this.year;
    }

    public getSeason(): Season {
        return this.season;
    }

    public isGamePaused(): boolean {
        return this.isPaused;
    }

    private onPauseChangeCallbacks: ((paused: boolean) => void)[] = [];

    public setPaused(paused: boolean): void {
        if (this.isPaused !== paused) {
            this.isPaused = paused;
            this.notifyPauseChange();
        }
    }

    public onPauseChange(callback: (paused: boolean) => void): void {
        this.onPauseChangeCallbacks.push(callback);
    }

    private notifyPauseChange(): void {
        this.onPauseChangeCallbacks.forEach(cb => cb(this.isPaused));
    }

    /** 距离下一季还剩多少游戏秒 */
    public getTimeToNextSeason(): number {
        return Math.max(0, GameTime.SEASON_DURATION - this.accumulatedTime);
    }

    public getSpeed(): number {
        return this.timeScale;
    }

    public setSpeed(scale: number): void {
        this.timeScale = Math.max(0, scale);
    }
}
