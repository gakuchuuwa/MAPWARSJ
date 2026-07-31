import L from 'leaflet';
import { GameMap } from './GameMap';
import { getGlobalUnitRenderer } from './UnitRenderer';
import { gameLog } from '../utils/GameLogger';
// TacticalConstants 是零依赖叶子模块，map 层引入不产生循环依赖
import { PHASE_START_RATIOS, PHASE_COLLAPSE_START } from '../combat/TacticalConstants';

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
    /** 本场每坨火的点燃时刻（ms），第 i 坨对应第 i 幕起点 */
    igniteOffsetsMs: number[];
    /** 本场单坨火的渐显时长（ms）；短战会被压缩以免越过战斗结束 */
    fadeInDurationMs: number;
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
    /** 停战渐隐时长（2026-07-18 主人定：0.8s→5s，慢慢熄灭并遮住据点缩回原尺寸） */
    private static readonly FADE_OUT_DURATION_MS = 5000;
    /** 渐隐步数（5s 长淡出需更密的步进保持丝滑，~83ms/步） */
    private static readonly FADE_OUT_STEPS = 60;
    private static readonly VOLLEY_INTERVAL_MS = 1100;
    private static readonly ARROWS_PER_VOLLEY = 5;
    private static readonly WALL_INSET = 0.014;
    private static readonly LAUNCH_HEIGHT = 0.032;
    /** 攻城态据点建筑视觉放大倍数：与 city-marker.css 的 scale(2) 同步（仅火箭发射点用；火焰不随城放大） */
    private static readonly SIEGE_CITY_VISUAL_ZOOM = 2.0;
    /** 火焰片散布半径（相对基准半径比例，<1 保证火落在城内） */
    private static readonly FIRE_SPREAD_RATIO = 0.7;
    /** 火苗群在贴图中的实测重心偏下 0.067H（2026-07-18 像素级测量：cx=0.46W、cy=0.57H）：
        bounds 上移 0.13×halfH 精确补偿，使火苗重心落在目标点（中心放大后 = 城视觉中心）。
        ⚠️ 勿凭感觉调大——过大火群飘到城北墙外，过小沉到城南墙根 */
    private static readonly FIRE_ANCHOR_LIFT_RATIO = 0.13;
    /** 火苗重心偏左 0.041W：bounds 东移 0.08×halfW 补偿；贴图镜像时火苗偏右，取反 */
    private static readonly FIRE_ANCHOR_EAST_RATIO = 0.08;
    /** 单片火渐显时长（2026-07-18 主人定：第一坨火 5 秒渐显）——固定，不随战斗时长变 */
    private static readonly FIRE_FADE_IN_DURATION_MS = 5000;
    /** 未传战斗时长时的兜底间隔（主人定：下一坨从第 9 秒开始） */
    private static readonly FIRE_FADE_IN_STAGGER_MS = 9000;

    /**
     * 三坨火各自的点燃时刻（ms）——每坨火对应战斗的一幕，火即幕的读数：
     *   第 1 坨 = 第一幕·胶着 开战即起（0%）
     *   第 2 坨 = 第二幕·相持 起（40%）
     *   第 3 坨 = 第三幕·溃败 起（80%）—— 城要破了，第三处火起
     * 观众看城里烧到第几处，就知道这仗打到第几幕。
     * @param battleDurationSec 本场战斗目标时长（游戏秒；直播 1x 下等同现实秒）；未知则退回等间隔兜底
     */
    private static resolveIgniteOffsetsMs(patchCount: number, battleDurationSec?: number): number[] {
        if (!battleDurationSec || battleDurationSec <= 0) {
            return Array.from(
                { length: patchCount },
                (_, i) => i * SiegeEffectRenderer.FIRE_FADE_IN_STAGGER_MS,
            );
        }
        const totalMs = battleDurationSec * 1000;
        return Array.from({ length: patchCount }, (_, i) => {
            // 火片数与幕数不等时按比例平摊，保证首坨恒在开战、末坨恒在末幕起点
            const ratio = PHASE_START_RATIOS[i]
                ?? (patchCount > 1 ? (i / (patchCount - 1)) * PHASE_COLLAPSE_START : 0);
            return totalMs * ratio;
        });
    }

    /** 末坨火的渐显不得越过战斗结束——短战（如 9 秒）压缩渐显时长，保证城破时火已烧满 */
    private static resolveFadeInDurationMs(
        igniteOffsetsMs: number[],
        battleDurationSec?: number,
    ): number {
        const base = SiegeEffectRenderer.FIRE_FADE_IN_DURATION_MS;
        if (!battleDurationSec || battleDurationSec <= 0 || igniteOffsetsMs.length === 0) return base;
        const lastIgnite = igniteOffsetsMs[igniteOffsetsMs.length - 1];
        const remainMs = battleDurationSec * 1000 - lastIgnite;
        return Math.max(500, Math.min(base, remainMs));
    }

    constructor(map: GameMap) {
        this.map = map;
        this.createEffectsPane();
        // [PERF] zoomend 而非 zoom：缩放仅在停稳后重算火焰 bounds 一次，避免动画中间帧密集 DOM 写
        this.map.getLeafletMap().on('zoomend', this.updateEffectScales.bind(this));
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
        getTarget?: TargetResolver,
        battleDurationSec?: number
    ): void {
        // 连锁攻城（2026-07-18 主人定）：同城连战火势延续——不清场、不重新渐显；
        // 只换攻击目标、重排齐射，并把（可能正在淡出的）旧火快速升回各自峰值
        const existing = this.activeEffects.get(cityId);
        if (existing) {
            gameLog('siegeEffect', `🔥 [SiegeEffect] 城市 ${cityId} 连战，火势延续`);
            existing.getTarget = getTarget;
            if (existing.volleyIntervalId) {
                clearInterval(existing.volleyIntervalId);
                existing.volleyIntervalId = undefined;
            }
            if (getTarget) {
                existing.volleyIntervalId = setInterval(() => {
                    this.fireVolley(cityId);
                }, SiegeEffectRenderer.VOLLEY_INTERVAL_MS);
                this.fireVolley(cityId);
            }
            this.rampToPeak(cityId, existing);
            return;
        }

        gameLog('siegeEffect', `🔥 [SiegeEffect] 在城市 ${cityId} (类型: ${cityType}) 启动火焰特效`);

        // 随机火片：统一 3 片——120° 三角分布天然覆盖全城无死角（2026-07-18 修：2 片丢南北）
        const base = this.getBaseHalfSize(cityType);
        const patchCount = 3;
        const igniteOffsetsMs = SiegeEffectRenderer.resolveIgniteOffsetsMs(patchCount, battleDurationSec);
        const fadeInDurationMs = SiegeEffectRenderer.resolveFadeInDurationMs(igniteOffsetsMs, battleDurationSec);
        gameLog(
            'siegeEffect',
            `🔥 [SiegeEffect] 战斗 ${battleDurationSec ?? '?'}s · 三幕点火于 ` +
            `${igniteOffsetsMs.map((ms) => (ms / 1000).toFixed(1) + 's').join(' / ')}` +
            `（每坨渐显 ${(fadeInDurationMs / 1000).toFixed(1)}s）`,
        );
        const effect: ActiveSiegeEffect = {
            patches: [],
            cityLocation: location,
            cityType,
            getTarget,
            igniteOffsetsMs,
            fadeInDurationMs,
        };

        // 风向全场统一 + 随机起始角（每次攻城火布局完全不同）
        const windFlipped = Math.random() > 0.5;
        const baseAngle = Math.random() * Math.PI * 2;

        for (let i = 0; i < patchCount; i++) {
            // 三角均分 + 随机起始角 + 抖动
            const ang = baseAngle + (i / patchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
            const rad = (0.3 + Math.sqrt(Math.random()) * 0.7) * SiegeEffectRenderer.FIRE_SPREAD_RATIO;
            const patch: FirePatch = {
                overlay: null as unknown as L.ImageOverlay, // 下方立即创建
                offsetLat: Math.sin(ang) * rad * base.halfHeight,
                offsetLng: Math.cos(ang) * rad * base.halfWidth,
                sizeScale: 0.6 + Math.random() * 0.4,  // 0.6 ~ 1.0
                peakOpacity: 0.7 + Math.random() * 0.3,  // 0.7 ~ 1.0
                isFlipped: windFlipped,
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

    /**
     * 错落渐显（2026-07-18 主人定）：第 1 坨火开战后 5 秒渐显；
     * 第 i 坨从第 i×9 秒开始、同样 5 秒渐显——火是一处处烧起来的，不是同时冒出来
     */
    private fadeIn(cityId: string): void {
        const effect = this.activeEffects.get(cityId);
        if (!effect) return;

        if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);

        const stepDuration = SiegeEffectRenderer.FADE_DURATION_MS / SiegeEffectRenderer.FADE_STEPS;
        const igniteOffsetsMs = effect.igniteOffsetsMs;
        const fadeInMs = effect.fadeInDurationMs;
        const totalMs = (igniteOffsetsMs[igniteOffsetsMs.length - 1] ?? 0) + fadeInMs;
        let elapsed = 0;

        effect.fadeTimerId = setInterval(() => {
            if (this.activeEffects.get(cityId) !== effect) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                return;
            }
            elapsed += stepDuration;
            const done = elapsed >= totalMs;
            effect.patches.forEach((patch, i) => {
                const local = (elapsed - (igniteOffsetsMs[i] ?? 0)) / fadeInMs;
                const t = done ? 1 : Math.min(1, Math.max(0, local));
                patch.overlay.setOpacity(t * patch.peakOpacity);
            });
            if (done) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
            }
        }, stepDuration);
    }

    /** 连战续火：各片火从【当前】透明度 ~0.4s 升回各自峰值——接住正在淡出/渐显的旧火，不硬切、不重新 5s 渐显 */
    private rampToPeak(cityId: string, effect: ActiveSiegeEffect): void {
        if (effect.fadeTimerId) {
            clearInterval(effect.fadeTimerId);
            effect.fadeTimerId = undefined;
        }
        const stepDuration = SiegeEffectRenderer.FADE_DURATION_MS / SiegeEffectRenderer.FADE_STEPS;
        const startOpacities = effect.patches.map(p => p.overlay.options.opacity ?? 0);
        const totalSteps = 10; // 10 × 40ms ≈ 0.4s
        let step = 0;

        effect.fadeTimerId = setInterval(() => {
            if (this.activeEffects.get(cityId) !== effect) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
                return;
            }
            step++;
            const t = Math.min(1, step / totalSteps);
            effect.patches.forEach((patch, i) => {
                patch.overlay.setOpacity(startOpacities[i] + (patch.peakOpacity - startOpacities[i]) * t);
            });
            if (t >= 1) {
                if (effect.fadeTimerId) clearInterval(effect.fadeTimerId);
                effect.fadeTimerId = undefined;
            }
        }, stepDuration);
    }

    /** 淡出：每片火从各自【当前】透明度 5s 归零（错落渐显中途停火也不会跳变；遮住据点缩回） */
    private fadeOut(cityId: string, effect: ActiveSiegeEffect): void {
        const stepDuration = SiegeEffectRenderer.FADE_OUT_DURATION_MS / SiegeEffectRenderer.FADE_OUT_STEPS;
        const opacityStep = 1.0 / SiegeEffectRenderer.FADE_OUT_STEPS;
        const startOpacities = effect.patches.map(p => p.overlay.options.opacity ?? p.peakOpacity);
        let t = 1;

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
            effect.patches.forEach((patch, i) => {
                patch.overlay.setOpacity(t * startOpacities[i]);
            });
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
        const zoom = this.map.getLeafletMap().getZoom();
        const pane = this.map.getLeafletMap().getPane('effectsPane');

        // zoom 8（俯瞰行军）不显示火焰/烟雾特效
        if (zoom <= 8) {
            if (pane) pane.style.display = 'none';
            return;
        }
        if (pane) pane.style.display = '';

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

        const halfW = base.halfWidth * scaleFactor * patch.sizeScale;
        const halfH = base.halfHeight * scaleFactor * patch.sizeScale;
        // 火苗重心补偿：垂直上移 0.13×halfH；水平东移 0.08×halfW，贴图镜像时火苗偏右、取反
        const flipSign = patch.isFlipped ? -1 : 1;
        const cLat = center.lat + patch.offsetLat * scaleFactor + halfH * SiegeEffectRenderer.FIRE_ANCHOR_LIFT_RATIO;
        const cLng = center.lng + patch.offsetLng * scaleFactor + halfW * SiegeEffectRenderer.FIRE_ANCHOR_EAST_RATIO * flipSign;

        return L.latLngBounds(
            [cLat - halfH, cLng - halfW],
            [cLat + halfH, cLng + halfW]
        );
    }
}
