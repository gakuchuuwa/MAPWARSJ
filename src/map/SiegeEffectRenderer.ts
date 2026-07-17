import L from 'leaflet';
import { GameMap } from './GameMap';
import { getGlobalUnitRenderer } from './UnitRenderer';
import { gameLog } from '../utils/GameLogger';

type TargetResolver = () => { lat: number; lng: number } | null | undefined;

/** 一片火焰叠层及其归一化随机参数（地图缩放重算 bounds 时保持同一片火的位置/尺寸/翻转） */
interface FirePatch {
    overlay: L.ImageOverlay;
    offsetLat: number;   // 相对城心的纬度偏移（度，缩放前）
    offsetLng: number;   // 相对城心的经度偏移（度，缩放前）
    sizeScale: number;   // 尺寸系数（相对基准火焰）
    peakOpacity: number; // 各自峰值透明度（淡入终点不同，火势有强有弱）
    isFlipped: boolean;
}

interface ActiveSiegeEffect {
    patches: FirePatch[];
    cityLocation: { lat: number; lng: number };
    cityType: string;
    getTarget?: TargetResolver;
    volleyIntervalId?: ReturnType<typeof setInterval>;
    fadeTimerId?: ReturnType<typeof setInterval>;
}

/**
 * 攻城战视觉：火焰 APNG 叠层 + 守军向进攻军团射箭。
 * 2026-07-18 主人定：火焰不随据点放大同步放大——改为 3-4 片小火随机落在城内
 * （位置/大小/透明度/翻转各自随机，每场攻城火势布局都不同），像城中多处起火；
 * 火箭发射点仍按放大后的城墙外推（箭从墙上来）。
 */
export class SiegeEffectRenderer {
    private map: GameMap;
    private activeEffects = new Map<string, ActiveSiegeEffect>();

    private static readonly APNG_PATH = '/effects/ezgif.com-apng-maker.png';
    private static readonly FADE_DURATION_MS = 800;
    private static readonly FADE_STEPS = 20;
    private static readonly VOLLEY_INTERVAL_MS = 1100;
    private static readonly ARROWS_PER_VOLLEY = 5;
    private static readonly WALL_INSET = 0.014;
    private static readonly LAUNCH_HEIGHT = 0.032;
    /** 攻城态据点建筑视觉放大倍数：与 city-marker.css 的 scale(2) 同步（仅火箭发射点用；火焰不随城放大） */
    private static readonly SIEGE_CITY_VISUAL_ZOOM = 2.0;
    /** 火焰片散布半径（相对基准半径比例，<1 保证火落在城内） */
    private static readonly FIRE_SPREAD_RATIO = 0.7;

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
            pane.style.zIndex = '630';
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

        // 随机火片：大城 4 片、其余 3 片；圆盘均匀分布 × 散布系数 → 集中在城内
        const base = this.getBaseHalfSize(cityType);
        const patchCount = base.isHuge ? 4 : 3;
        const effect: ActiveSiegeEffect = {
            patches: [],
            cityLocation: location,
            cityType,
            getTarget,
        };

        for (let i = 0; i < patchCount; i++) {
            const ang = Math.random() * Math.PI * 2;
            const rad = Math.sqrt(Math.random()) * SiegeEffectRenderer.FIRE_SPREAD_RATIO;
            const patch: FirePatch = {
                overlay: null as unknown as L.ImageOverlay, // 下方立即创建
                offsetLat: Math.sin(ang) * rad * base.halfHeight,
                offsetLng: Math.cos(ang) * rad * base.halfWidth,
                sizeScale: 0.5 + Math.random() * 0.35,   // 0.5 ~ 0.85
                peakOpacity: 0.8 + Math.random() * 0.2,  // 0.8 ~ 1.0
                isFlipped: Math.random() > 0.5,
            };
            patch.overlay = L.imageOverlay(
                SiegeEffectRenderer.APNG_PATH,
                this.computePatchBounds(effect.cityLocation, effect.cityType, patch),
                {
                    pane: 'effectsPane',
                    interactive: false,
                    opacity: 0,
                }
            ).addTo(this.map.getLeafletMap());
            // 镜像：往 Leaflet 自己的 transform 后面追加翻转，不改 transform-origin
            this.applyFlip(patch);
            effect.patches.push(patch);
        }

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

    public stopEffect(cityId: string, immediate = false): void {
        const effect = this.activeEffects.get(cityId);
        if (!effect) return;

        gameLog('siegeEffect', `🧯 [SiegeEffect] 停止城市 ${cityId} 的特效${immediate ? '（立即）' : '（淡出）'}`);
        this.disposeEffect(cityId, immediate);
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
            for (const patch of effect.patches) patch.overlay.remove();
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
        let t = 0;

        effect.fadeTimerId = setInterval(() => {
            if (this.activeEffects.get(cityId) !== effect) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                return;
            }
            t += opacityStep;
            if (t >= 1.0) {
                t = 1.0;
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
            }
            // 各片火有自己的峰值透明度：同一次淡入，火势强弱不一
            for (const patch of effect.patches) {
                patch.overlay.setOpacity(t * patch.peakOpacity);
            }
        }, stepDuration);
    }

    private fadeOut(cityId: string, effect: ActiveSiegeEffect): void {
        const stepDuration = SiegeEffectRenderer.FADE_DURATION_MS / SiegeEffectRenderer.FADE_STEPS;
        const opacityStep = 1.0 / SiegeEffectRenderer.FADE_STEPS;
        const p0 = effect.patches[0];
        const startOpacity = p0 && p0.peakOpacity > 0
            ? (p0.overlay.options.opacity ?? p0.peakOpacity)
            : 1.0;
        let t = p0 && p0.peakOpacity > 0
            ? Math.min(1, Math.max(0, startOpacity / p0.peakOpacity))
            : 1;

        effect.fadeTimerId = setInterval(() => {
            if (this.activeEffects.get(cityId) !== effect) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                for (const patch of effect.patches) patch.overlay.remove();
                return;
            }
            t -= opacityStep;
            if (t <= 0) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                for (const patch of effect.patches) patch.overlay.remove();
                if (this.activeEffects.get(cityId) === effect) {
                    this.activeEffects.delete(cityId);
                }
                gameLog('siegeEffect', `🧯 [SiegeEffect] 城市 ${cityId} 的特效已完全消失`);
                return;
            }
            for (const patch of effect.patches) {
                patch.overlay.setOpacity(t * patch.peakOpacity);
            }
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
            type: 'fire', // 守军齐射火箭（2026-07-18 主人定）
        });
    }

    private launchPoint(
        city: { lat: number; lng: number },
        target: { lat: number; lng: number }
    ): L.LatLng {
        const dx = target.lng - city.lng;
        const dy = target.lat - city.lat;
        const len = Math.hypot(dx, dy) || 1;
        // 发射点按放大后的城墙外推（火焰不随城放大，火箭仍从城墙来）
        const visualZoom = SiegeEffectRenderer.SIEGE_CITY_VISUAL_ZOOM;
        return L.latLng(
            city.lat + (dy / len) * SiegeEffectRenderer.WALL_INSET * visualZoom + SiegeEffectRenderer.LAUNCH_HEIGHT * visualZoom,
            city.lng + (dx / len) * SiegeEffectRenderer.WALL_INSET * visualZoom
        );
    }

    private updateEffectScales(): void {
        this.activeEffects.forEach((effect) => {
            for (const patch of effect.patches) {
                patch.overlay.setBounds(
                    this.computePatchBounds(effect.cityLocation, effect.cityType, patch)
                );
                // setBounds 会重置 transform，需要重新追加翻转
                this.applyFlip(patch);
            }
        });
    }

    /**
     * 在 Leaflet 的 translate3d 后追加 translateX(100%) scaleX(-1)，
     * 实现原地水平镜像（不改 transform-origin，不偏移）。
     */
    private applyFlip(patch: FirePatch): void {
        if (!patch.isFlipped) return;
        const img = (patch.overlay as any)._image as HTMLElement;
        if (!img) return;
        const t = img.style.transform;
        if (t && !t.includes('scaleX')) {
            img.style.transform = t + ' translateX(100%) scaleX(-1)';
        }
    }

    /** 各城级火焰基准半径（不随据点视觉放大；isHuge 用于决定火片数量） */
    private getBaseHalfSize(cityType: string): { halfWidth: number; halfHeight: number; isHuge: boolean } {
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

        if (imperialCityTypes.includes(cityType) || hugeCityTypes.includes(cityType)) {
            return { halfWidth: 0.28, halfHeight: 0.18, isHuge: true };
        }
        if (smallCityTypes.includes(cityType)) {
            return { halfWidth: 0.18, halfHeight: 0.12, isHuge: false };
        }
        return { halfWidth: 0.22, halfHeight: 0.15, isHuge: false };
    }

    /** 单片火的 bounds：城心 + 随机偏移（随缩放系数），尺寸 = 基准 × 随机系数 */
    private computePatchBounds(
        center: { lat: number; lng: number },
        cityType: string,
        patch: FirePatch
    ): L.LatLngBounds {
        const zoom = this.map.getLeafletMap().getZoom();
        const scaleFactor = Math.pow(2, Math.min(zoom, 10) - zoom);
        const base = this.getBaseHalfSize(cityType);

        const cLat = center.lat + patch.offsetLat * scaleFactor;
        const cLng = center.lng + patch.offsetLng * scaleFactor;
        const halfW = base.halfWidth * scaleFactor * patch.sizeScale;
        const halfH = base.halfHeight * scaleFactor * patch.sizeScale;

        return L.latLngBounds(
            [cLat - halfH, cLng - halfW],
            [cLat + halfH, cLng + halfW]
        );
    }
}
