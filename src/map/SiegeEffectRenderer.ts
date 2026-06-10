import L from 'leaflet';
import { GameMap } from './GameMap';
import { getGlobalUnitRenderer } from './UnitRenderer';
import { gameLog } from '../utils/GameLogger';

type TargetResolver = () => { lat: number; lng: number } | null | undefined;

interface ActiveSiegeEffect {
    overlay: L.ImageOverlay;
    cityLocation: { lat: number; lng: number };
    cityType: string;
    getTarget?: TargetResolver;
    volleyIntervalId?: ReturnType<typeof setInterval>;
    fadeTimerId?: ReturnType<typeof setInterval>;
}

/**
 * 攻城战视觉：火焰 APNG 叠层 + 守军向进攻军团射箭。
 */
export class SiegeEffectRenderer {
    private map: GameMap;
    private activeEffects = new Map<string, ActiveSiegeEffect>();

    private static readonly APNG_PATH = '/effects/ezgif.com-apng-maker.png';
    private static readonly FADE_DURATION_MS = 800;
    private static readonly FADE_STEPS = 20;
    private static readonly VOLLEY_INTERVAL_MS = 1100;
    private static readonly ARROWS_PER_VOLLEY = 4;
    private static readonly WALL_INSET = 0.014;
    private static readonly LAUNCH_HEIGHT = 0.032;

    constructor(map: GameMap) {
        this.map = map;
        this.createEffectsPane();
        this.map.getLeafletMap().on('zoom', this.updateEffectScales.bind(this));
    }

    private createEffectsPane(): void {
        const leafletMap = this.map.getLeafletMap();
        if (!leafletMap.getPane('effectsPane')) {
            leafletMap.createPane('effectsPane');
            const pane = leafletMap.getPane('effectsPane')!;
            pane.style.zIndex = '610';
        }
    }

    public playEffect(
        cityId: string,
        location: { lat: number; lng: number },
        cityType: string = 'small_city',
        getTarget?: TargetResolver
    ): void {
        // 接战/连战须立刻清掉上一场，不能走淡出（否则旧 timer 会误删新叠层）
        this.disposeEffect(cityId, true);

        gameLog('siegeEffect', `🔥 [SiegeEffect] 在城市 ${cityId} (类型: ${cityType}) 启动火焰特效`);

        const bounds = this.getBounds(location, cityType);
        const overlay = L.imageOverlay(SiegeEffectRenderer.APNG_PATH, bounds, {
            pane: 'effectsPane',
            interactive: false,
            opacity: 0,
        }).addTo(this.map.getLeafletMap());

        const effect: ActiveSiegeEffect = {
            overlay,
            cityLocation: location,
            cityType,
            getTarget,
        };

        if (getTarget) {
            gameLog('siegeEffect', `🏹 [SiegeEffect] ${cityId} 守军向进攻方齐射`);
            effect.volleyIntervalId = setInterval(() => {
                this.fireVolley(cityId);
            }, SiegeEffectRenderer.VOLLEY_INTERVAL_MS);
            this.fireVolley(cityId);
        }

        this.activeEffects.set(cityId, effect);
        this.fadeIn(cityId);
    }

    public stopEffect(cityId: string): void {
        const effect = this.activeEffects.get(cityId);
        if (!effect) return;

        gameLog('siegeEffect', `🧯 [SiegeEffect] 停止城市 ${cityId} 的特效（开始淡出）`);
        this.disposeEffect(cityId, false);
    }

    public stopAll(): void {
        for (const cityId of [...this.activeEffects.keys()]) {
            this.disposeEffect(cityId, false);
        }
    }

    /** @param immediate true=立刻移除（开战替换）；false=淡出（正常停战） */
    private disposeEffect(cityId: string, immediate: boolean): void {
        const effect = this.activeEffects.get(cityId);
        if (!effect) return;

        if (effect.volleyIntervalId) {
            clearInterval(effect.volleyIntervalId);
            effect.volleyIntervalId = undefined;
        }
        if (effect.fadeTimerId) {
            clearInterval(effect.fadeTimerId);
            effect.fadeTimerId = undefined;
        }

        if (immediate) {
            effect.overlay.remove();
            this.activeEffects.delete(cityId);
            return;
        }

        this.fadeOut(cityId, effect);
    }

    private fadeIn(cityId: string): void {
        const effect = this.activeEffects.get(cityId);
        if (!effect) return;

        if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);

        const stepDuration = SiegeEffectRenderer.FADE_DURATION_MS / SiegeEffectRenderer.FADE_STEPS;
        const opacityStep = 1.0 / SiegeEffectRenderer.FADE_STEPS;
        let currentOpacity = 0;

        effect.fadeTimerId = setInterval(() => {
            if (this.activeEffects.get(cityId) !== effect) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                return;
            }
            currentOpacity += opacityStep;
            if (currentOpacity >= 1.0) {
                currentOpacity = 1.0;
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
            }
            effect.overlay.setOpacity(currentOpacity);
        }, stepDuration);
    }

    private fadeOut(cityId: string, effect: ActiveSiegeEffect): void {
        const stepDuration = SiegeEffectRenderer.FADE_DURATION_MS / SiegeEffectRenderer.FADE_STEPS;
        const opacityStep = 1.0 / SiegeEffectRenderer.FADE_STEPS;
        let currentOpacity = effect.overlay.options.opacity ?? 1.0;

        effect.fadeTimerId = setInterval(() => {
            if (this.activeEffects.get(cityId) !== effect) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                effect.overlay.remove();
                return;
            }
            currentOpacity -= opacityStep;
            if (currentOpacity <= 0) {
                currentOpacity = 0;
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                effect.overlay.remove();
                if (this.activeEffects.get(cityId) === effect) {
                    this.activeEffects.delete(cityId);
                }
                gameLog('siegeEffect', `🧯 [SiegeEffect] 城市 ${cityId} 的特效已完全消失`);
                return;
            }
            effect.overlay.setOpacity(currentOpacity);
        }, stepDuration);
    }

    private fireVolley(cityId: string): void {
        const effect = this.activeEffects.get(cityId);
        if (!effect?.getTarget) return;

        const target = effect.getTarget();
        if (!target) return;

        const renderer = getGlobalUnitRenderer();
        if (!renderer) return;

        const origin = this.launchPoint(effect.cityLocation, target);
        const end = L.latLng(target.lat, target.lng);

        renderer.spawnProjectileVolley(origin, end, {
            count: SiegeEffectRenderer.ARROWS_PER_VOLLEY,
            spreadFactor: 0.022,
            staggerMs: 70,
            durationMs: 380,
        });
    }

    private launchPoint(
        city: { lat: number; lng: number },
        target: { lat: number; lng: number }
    ): L.LatLng {
        const dx = target.lng - city.lng;
        const dy = target.lat - city.lat;
        const len = Math.hypot(dx, dy) || 1;
        return L.latLng(
            city.lat + (dy / len) * SiegeEffectRenderer.WALL_INSET + SiegeEffectRenderer.LAUNCH_HEIGHT,
            city.lng + (dx / len) * SiegeEffectRenderer.WALL_INSET
        );
    }

    private updateEffectScales(): void {
        this.activeEffects.forEach((effect) => {
            const newBounds = this.getBounds(effect.cityLocation, effect.cityType);
            effect.overlay.setBounds(newBounds);
        });
    }

    private getBounds(center: { lat: number; lng: number }, cityType: string = 'small_city'): L.LatLngBounds {
        const zoom = this.map.getLeafletMap().getZoom();
        const scaleFactor = Math.pow(2, Math.min(zoom, 10) - zoom);

        const hugeCityTypes = [
            'huge_city', 'hannan_huge_city', 'hanbei_huge_city', 'hanhuang_huge_city',
            'dian_huge_city', 'capital', 'west_huge_city', 'manchu_huge_city',
            'hanchuan_huge_city', 'hanling_huge_city', 'hanxiang_huge_city',
        ];
        const imperialCityTypes = ['imperial_city', 'hanhuang_imperial_city'];
        const smallCityTypes = [
            'pass', 'mountain_pass', 'north_mountain_pass', 'chuan_mountain_pass',
            'south_mountain_pass', 'hanling_mountain_pass', 'hanfu_small_city',
            'hanhuang_small_city', 'hanling_small_city', 'west_small_city', 'small_city',
            'nanping_pass', 'huangping_pass', 'beiping_pass', 'xiyu_ping_pass',
            'grassland_fortress', 'western_fortress', 'tibetan_fortress', 'huangdukou',
        ];

        let baseHalfWidth = 0.22;
        let baseHalfHeight = 0.15;
        let baseLatOffset = 0;

        if (imperialCityTypes.includes(cityType) || hugeCityTypes.includes(cityType)) {
            baseHalfWidth = 0.28;
            baseHalfHeight = 0.18;
        } else if (smallCityTypes.includes(cityType)) {
            baseHalfWidth = 0.18;
            baseHalfHeight = 0.12;
        }

        const currentHalfWidth = baseHalfWidth * scaleFactor;
        const currentHalfHeight = baseHalfHeight * scaleFactor;
        const currentLatOffset = baseLatOffset * scaleFactor;

        return L.latLngBounds(
            [center.lat - currentHalfHeight + currentLatOffset, center.lng - currentHalfWidth],
            [center.lat + currentHalfHeight + currentLatOffset, center.lng + currentHalfWidth]
        );
    }
}
