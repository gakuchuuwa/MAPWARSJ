import { HistoricalEvent } from '../types/core';
import { formatGameDateChinese } from '../data/QinRegnalCalendar';
import { GameConfig } from '../config/GameConfig';
import { Season } from '../core/TimeSystem';
import { PerformanceMonitor } from '../debug/PerformanceMonitor';
import { gameLog } from '../utils/GameLogger';

const SEASON_LABELS = ['春', '夏', '秋', '冬'] as const;

/** 阿拉伯数字纪年（例：236 BC、1912 AD） */
export function formatYearArabic(year: number): string {
    if (year < 0) return `${Math.abs(year)} BC`;
    return `${year} AD`;
}

/**
 * 左下角年季与播放控件（替代原竹简时间轴）
 */
export class GameTimeHUD {
    private root: HTMLElement | null = null;
    private dateEl: HTMLElement | null = null;
    private runBtn: HTMLElement | null = null;
    private speedBtn: HTMLElement | null = null;
    private speed2Btn: HTMLElement | null = null;

    init(): void {
        this.root = document.getElementById('game-time-hud');
        this.dateEl = document.getElementById('game-date-display');
        this.runBtn = document.getElementById('run-event-btn');
        this.speedBtn = document.getElementById('speed-btn');
        this.speed2Btn = document.getElementById('speed2-btn');

        if (!this.root || !this.dateEl) {
            console.warn('⚠️ [GameTimeHUD] DOM not found');
            return;
        }

        this.root.style.display = 'flex';

        if (this.runBtn) {
            this.runBtn.textContent = '播放';
            this.runBtn.addEventListener('click', () => {
                const game = (window as any).game;
                if (game?.historicalEventManager) {
                    const isPlaying = game.historicalEventManager.togglePlayback();
                    if (isPlaying) {
                        game.recruitmentSystem?.runInitialSpawn();
                        if (GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS) {
                            game.cameraFollowUI?.followByNameWhenReady('秦军');
                        }
                    }
                    this.setPlayingState(isPlaying);
                }
            });
        }

        if (this.speedBtn) {
            this.speedBtn.addEventListener('click', () => {
                const game = (window as any).game;
                if (game?.timeSystem) {
                    const ts = game.timeSystem;
                    const isActive = ts.getSpeed() === 5.0;
                    ts.setSpeed(isActive ? 1.0 : 5.0);
                    this.speedBtn!.classList.toggle('active', !isActive);
                    this.speed2Btn?.classList.remove('active');
                }
            });
        }

        const perfBtn = document.getElementById('perf-toggle-btn');
        if (perfBtn) {
            perfBtn.addEventListener('click', () => {
                PerformanceMonitor.getInstance().toggle();
            });
        }

        if (this.speed2Btn) {
            this.speed2Btn.addEventListener('click', () => {
                const game = (window as any).game;
                if (game?.timeSystem) {
                    const ts = game.timeSystem;
                    const isActive = ts.getSpeed() === 2.0;
                    ts.setSpeed(isActive ? 1.0 : 2.0);
                    this.speed2Btn!.classList.toggle('active', !isActive);
                    this.speedBtn?.classList.remove('active');
                }
            });
        }

        const game = (window as any).game;
        if (game?.timeSystem) {
            this.updateTime(game.timeSystem.getYear(), game.timeSystem.getSeason());
        }

        gameLog('startup', '🕐 [GameTimeHUD] Initialized');
    }

    updateTime(year: number, season: Season = Season.春): void {
        if (!this.dateEl) return;
        const seasonLabel = SEASON_LABELS[season] ?? SEASON_LABELS[0];
        const regnal = formatGameDateChinese(year);
        this.dateEl.textContent = `${regnal} · ${seasonLabel}`;
    }

    /** 同步播放/暂停按钮文案 */
    setPlayingState(playing: boolean): void {
        if (!this.runBtn) return;
        this.runBtn.textContent = playing ? '暂停' : '播放';
        this.runBtn.classList.toggle('playing', playing);
    }

    highlightEvent(_event: HistoricalEvent): void {
        // 纪年由 TimeSystem 独立推进，不在此覆盖 HUD
    }
}
