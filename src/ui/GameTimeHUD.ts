import { HistoricalEvent } from '../types/core';
import { formatBcYearChinese } from '../data/QinRegnalCalendar';
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
 * 左下 HUD（Stitch 833dbd17 切图）
 */
export class GameTimeHUD {
    private root: HTMLElement | null = null;
    private yearEl: HTMLElement | null = null;
    private seasonEl: HTMLElement | null = null;
    private runBtn: HTMLElement | null = null;
    private speedBtn: HTMLElement | null = null;
    private speed2Btn: HTMLElement | null = null;
    private zoomLevelEl: HTMLElement | null = null;

    init(): void {
        this.root = document.getElementById('game-time-hud');
        this.yearEl = document.getElementById('game-year-display');
        this.seasonEl = document.getElementById('game-season-display');
        this.runBtn = document.getElementById('run-event-btn');
        this.speedBtn = document.getElementById('speed-btn');
        this.speed2Btn = document.getElementById('speed2-btn');

        if (!this.root || !this.yearEl || !this.seasonEl) {
            console.warn('⚠️ [GameTimeHUD] DOM not found');
            return;
        }

        this.root.style.display = 'flex';

        if (this.runBtn) {
            this.runBtn.setAttribute('aria-label', '播放');
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

        this.bindZoomControls();

        const game = (window as any).game;
        if (game?.timeSystem) {
            this.updateTime(game.timeSystem.getYear(), game.timeSystem.getSeason());
        }

        gameLog('startup', '🕐 [GameTimeHUD] Initialized');
    }

    private bindZoomControls(): void {
        const zoomIn = document.getElementById('map-zoom-in');
        const zoomOut = document.getElementById('map-zoom-out');
        this.zoomLevelEl = document.getElementById('map-zoom-level');

        const getLeafletMap = () => (window as any).game?.map?.getLeafletMap?.();

        const syncZoomLevel = () => {
            const map = getLeafletMap();
            if (!map || !this.zoomLevelEl) return;
            this.zoomLevelEl.textContent = `${Math.floor(map.getZoom())}`;
        };

        zoomIn?.addEventListener('click', () => getLeafletMap()?.zoomIn());
        zoomOut?.addEventListener('click', () => getLeafletMap()?.zoomOut());

        const map = getLeafletMap();
        if (map) {
            map.on('zoom', syncZoomLevel);
            syncZoomLevel();
        }
    }

    updateTime(year: number, season: Season = Season.春): void {
        if (!this.yearEl || !this.seasonEl) return;
        const seasonLabel = SEASON_LABELS[season] ?? SEASON_LABELS[0];
        this.yearEl.textContent = formatBcYearChinese(year);
        this.seasonEl.textContent = seasonLabel;
    }

    /** 同步播放/暂停按钮文案 */
    setPlayingState(playing: boolean): void {
        if (!this.runBtn) return;
        this.runBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
        this.runBtn.classList.toggle('playing', playing);
    }

    highlightEvent(_event: HistoricalEvent): void {
        // 纪年由 TimeSystem 独立推进，不在此覆盖 HUD
    }
}
