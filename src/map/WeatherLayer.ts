import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import { audioManager, type SoundKey } from '../audio/AudioManager';
import { LandSeaSystem } from '../world/land-sea/LandSeaSystem';
import type { CalendarSeason4 } from '../world/environment/seasonalGround';
import {
    WEATHER_SPECS,
    canSustainSnowAt,
    pickWeightedWeather,
    resolveWeatherPoolAt,
    type WeatherKind,
} from '../world/environment/weatherCatalog';

/**
 * WeatherLayer - 战略地图动态天气系统（遵循 docs/AGENTS/environment-architecture.md）
 *
 * 支持 7 类与柯本气候带、海陆、海拔、四季实时联动的自然天气：
 *  · SEA_STORM（海上暴风雨：乌云压暗、疾风骤雨、分支闪电雷光、联动海面狂风巨浪）
 *  · MONSOON_SQUALL（季风骤雨：密集斜雨、雨滴涟漪、水汽暗云）
 *  · DRIZZLE_MIST（烟雨薄雾：轻柔细雨丝、流淌云纱、细碎涟漪）
 *  · SEA_FOG（海雾 / 浓雾：多层柔滑半透明云雾团随风流淌）
 *  · SNOW（漫天瑞雪：远中近三层摇曳雪花）
 *  · BLIZZARD（塞外暴风雪：高速斜飞雪粒、白毛风雪雾流线、寒霜雾幕）
 *  · SANDSTORM（大漠风沙：昏黄沙尘幕、高速跃移沙粒、贴地流沙线）
 */
const PANE = 'weatherPane';
const MIN_ZOOM = 6;
const MAX_ZOOM = 12;
const FRAME_MS = 1000 / 30;
const FADE_IN_MS = 3_200;
const FADE_OUT_MS = 3_800;

interface WeatherCell {
    id: number;
    kind: WeatherKind;
    lat: number;
    lng: number;
    radiusDeg: number;
    vLat: number;
    vLng: number;
    windAngle: number;
    spawnedAt: number;
    expiresAt: number;
    nextLightningAt: number;
    lightningEndAt: number;
    lightningSeed: number;
    lightningOffsetX: number;
    lightningOffsetY: number;
}

interface Particle {
    u: number;      // 0..1 归一化水平种子
    v: number;      // 0..1 归一化垂直种子
    speed: number;  // 速度倍率 0.65..1.45
    size: number;   // 尺寸倍率 0.6..1.5
    phase: number;  // 摇曳相位 0..2PI
    layer: number;  // 0=远景, 1=中景, 2=近景
}

interface FogPuff {
    u: number;
    v: number;
    rx: number;
    ry: number;
    speed: number;
    alpha: number;
    phase: number;
}

let activeWeatherLayer: WeatherLayer | null = null;

/**
 * 查询某经纬度当前受到的海上风暴涌浪增幅（0..1），供 CoastalWaveLayer 渲染狂风巨浪与碎沫
 */
export function getSeaStormWaveBoostAt(lat: number, lng: number, now = performance.now()): number {
    if (!activeWeatherLayer) return 0;
    return activeWeatherLayer.getWaveBoostAt(lat, lng, now);
}

export function setWeatherLayerVisible(visible: boolean): void {
    activeWeatherLayer?.setVisible(visible);
}

export class WeatherLayer extends L.Layer {
    private map: L.Map | null = null;
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    private rafId: number | null = null;
    private visible = true;
    private lastRenderAt = -Infinity;
    private lastTickAt = -Infinity;
    private nextCellId = 1;
    private cells: WeatherCell[] = [];
    private nextSpawnAllowedAt = 0;

    private readonly particles: Particle[] = [];
    private readonly splashes: Particle[] = [];
    private readonly fogPuffs: FogPuff[] = [];

    constructor() {
        super();
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
        this.initPools();
    }

    private initPools(): void {
        // 预分配粒子池，全程零 GC
        for (let i = 0; i < 220; i++) {
            const layer = i < 90 ? 0 : i < 170 ? 1 : 2;
            this.particles.push({
                u: ((i * 0.61803398875) % 1),
                v: ((i * 0.38196601125) % 1),
                speed: (0.72 + ((i * 17) % 19) / 30) * (0.75 + layer * 0.22),
                size: (0.68 + ((i * 23) % 13) / 20) * (0.72 + layer * 0.28),
                phase: ((i * 1.37) % (Math.PI * 2)),
                layer,
            });
        }
        for (let i = 0; i < 55; i++) {
            this.splashes.push({
                u: ((i * 0.7548776662) % 1),
                v: ((i * 0.5698402909) % 1),
                speed: 0.8 + ((i * 11) % 9) * 0.08,
                size: 0.7 + ((i * 7) % 11) * 0.08,
                phase: (i * 0.43) % 1,
                layer: i % 2,
            });
        }
        for (let i = 0; i < 16; i++) {
            this.fogPuffs.push({
                u: ((i * 0.618034 + 0.13) % 1),
                v: ((i * 0.414213 + 0.07) % 1),
                rx: 180 + (i % 5) * 65,
                ry: 95 + (i % 4) * 38,
                speed: 14 + (i % 6) * 4,
                alpha: 0.055 + (i % 4) * 0.018,
                phase: i * 0.9,
            });
        }
    }

    public onAdd(map: L.Map): this {
        this.map = map;
        if (!map.getPane(PANE)) {
            map.createPane(PANE);
            const pane = map.getPane(PANE)!;
            pane.style.zIndex = '648'; // 高于飞鸟(645)与地面部队(620)，低于 UI 浮层(650+)
            pane.style.pointerEvents = 'none';
        }
        const pane = map.getPane(PANE)!;
        pane.appendChild(this.canvas);

        this.resize();
        this.syncCanvas();
        this.map.on('resize', this.resize);
        activeWeatherLayer = this;
        this.nextSpawnAllowedAt = performance.now() + 2_500;
        this.rafId = requestAnimationFrame(this.tick);
        return this;
    }

    public onRemove(_map: L.Map): this {
        this.map?.off('resize', this.resize);
        this.map = null;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.canvas.remove();
        this.cells = [];
        audioManager.syncWeatherAudio(null, 0);
        if (activeWeatherLayer === this) activeWeatherLayer = null;
        return this;
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        this.canvas.style.display = visible ? 'block' : 'none';
        if (!visible) {
            audioManager.syncWeatherAudio(null, 0);
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    public getWaveBoostAt(lat: number, lng: number, now: number): number {
        if (!this.visible || this.cells.length === 0) return 0;
        let maxBoost = 0;
        for (const cell of this.cells) {
            const spec = WEATHER_SPECS[cell.kind];
            if (spec.waveBoost <= 0) continue;
            const w = this.cellStrengthAt(cell, lat, lng, now);
            if (w * spec.waveBoost > maxBoost) {
                maxBoost = w * spec.waveBoost;
            }
        }
        return maxBoost;
    }

    private resize = (): void => {
        if (!this.map) return;
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';
        this.syncCanvas();
    };

    private syncCanvas = (): void => {
        if (!this.map) return;
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
    };

    private getCalendarSeason(): CalendarSeason4 {
        const s = (window as any).game?.timeSystem?.getSeason?.();
        return (typeof s === 'number' && s >= 0 && s <= 3 ? s : 0) as CalendarSeason4;
    }

    private cellTimeAlpha(cell: WeatherCell, now: number): number {
        const fadeIn = Math.min(1, Math.max(0, (now - cell.spawnedAt) / FADE_IN_MS));
        const fadeOut = Math.min(1, Math.max(0, (cell.expiresAt - now) / FADE_OUT_MS));
        return fadeIn * fadeOut;
    }

    private cellStrengthAt(cell: WeatherCell, lat: number, lng: number, now: number): number {
        const timeA = this.cellTimeAlpha(cell, now);
        if (timeA <= 0.001) return 0;
        // 🔴 [2026-11-02 优化] 雨雪分界线阻断：降雪与暴风雪气团绝不侵入亚热带/南方温暖视口
        if ((cell.kind === 'SNOW' || cell.kind === 'BLIZZARD') && !canSustainSnowAt(lat, lng, this.getCalendarSeason())) {
            return 0;
        }
        const cosLat = Math.max(0.25, Math.cos((lat * Math.PI) / 180));
        const dLat = lat - cell.lat;
        const dLng = (lng - cell.lng) * cosLat;
        const dist = Math.hypot(dLat, dLng);
        if (dist >= cell.radiusDeg) return 0;
        const u = dist / cell.radiusDeg;
        // 平滑余弦钟形气团分布：中心饱满，边缘自然羽化为 0
        const spatial = 0.5 * (1 + Math.cos(Math.PI * u));
        return timeA * spatial;
    }

    private tick = (now: number): void => {
        this.rafId = requestAnimationFrame(this.tick);
        if (!this.map || !this.ctx || !this.visible || now - this.lastRenderAt < FRAME_MS) return;
        const dt = this.lastTickAt > 0 ? Math.min(0.1, (now - this.lastTickAt) / 1000) : 1 / 30;
        this.lastTickAt = now;
        this.lastRenderAt = now;

        const _t0 = performance.now();
        try {
            this.stepCells(now, dt);
            this.render(now);
        } finally {
            perfDoctor.note('WeatherLayer.tick(战略动态天气层)', performance.now() - _t0, 'src/map/WeatherLayer.ts:tick');
        }
    };

    private stepCells(now: number, dt: number): void {
        if (!this.map) return;
        const zoom = this.map.getZoom();
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM) return;

        const bounds = this.map.getBounds();
        const keepBounds = bounds.pad(1.5);
        const center = this.map.getCenter();

        // 1. 推进现有天气气团漂移与闪电计时，清理过期或远离视口的气团
        this.cells = this.cells.filter((c) => {
            if (now >= c.expiresAt) return false;
            c.lat += c.vLat * dt;
            c.lng += c.vLng * dt;
            if (!keepBounds.contains([c.lat, c.lng])) return false;

            if (c.kind === 'SEA_STORM' && now >= c.nextLightningAt) {
                c.lightningEndAt = now + 220 + Math.random() * 160;
                c.nextLightningAt = now + 3_800 + Math.random() * 5_200;
                c.lightningSeed = Math.floor(Math.random() * 10000);
                c.lightningOffsetX = (Math.random() - 0.5) * 0.55;
                c.lightningOffsetY = (Math.random() - 0.5) * 0.35;
                const s = this.cellStrengthAt(c, center.lat, center.lng, now);
                if (this.visible && s > 0.14 && !(window as any).game?.scene13War?.isActive?.()) {
                    audioManager.play('weather_thunder', { volumeScale: Math.min(1, 0.35 + s * 0.65) });
                }
            }
            return true;
        });

        // 2. 若当前视口内尚无活跃气团，按自然节律在当前视野附近生成符合当地气候与季节的天气气团
        const hasActiveInView = this.cells.some(
            (c) => this.cellStrengthAt(c, center.lat, center.lng, now) > 0.15,
        );
        if (!hasActiveInView && this.cells.length < 2 && now >= this.nextSpawnAllowedAt) {
            this.spawnWeatherCellForView(now, center.lat, center.lng);
            // 下一次气团生成间隔：留出晴朗窗口期（约 9~16 秒晴空后迎来下一场区域天气）
            this.nextSpawnAllowedAt = now + 32_000 + Math.random() * 12_000;
        }
    }

    private spawnWeatherCellForView(now: number, centerLat: number, centerLng: number): void {
        const isSea = LandSeaSystem.isSeaAt(L.latLng(centerLat, centerLng));
        const elevM = LandSeaSystem.getSampler().getElevationSync(centerLat, centerLng);
        const calendarSeason = this.getCalendarSeason();

        const pool = resolveWeatherPoolAt({
            lat: centerLat,
            lng: centerLng,
            isSea,
            elevM,
            calendarSeason,
        });
        const kind = pickWeightedWeather(pool, Math.random());
        const spec = WEATHER_SPECS[kind];

        const dur = spec.durationMs[0] + Math.random() * (spec.durationMs[1] - spec.durationMs[0]);
        const radiusDeg = spec.radiusDeg[0] + Math.random() * (spec.radiusDeg[1] - spec.radiusDeg[0]);
        const windSign = Math.random() < 0.5 ? 1 : -1;
        const windAngle = spec.windAngleRad * windSign + (Math.random() - 0.5) * 0.08;
        const driftDir = Math.random() * Math.PI * 2;

        // 气团中心略偏离视野正中，随风自然掠过视野
        const offsetLat = (Math.random() - 0.5) * 0.35;
        const offsetLng = (Math.random() - 0.5) * 0.45;

        this.cells.push({
            id: this.nextCellId++,
            kind,
            lat: centerLat + offsetLat,
            lng: centerLng + offsetLng,
            radiusDeg,
            vLat: Math.sin(driftDir) * spec.driftDegPerSec,
            vLng: Math.cos(driftDir) * spec.driftDegPerSec,
            windAngle,
            spawnedAt: now,
            expiresAt: now + dur,
            nextLightningAt: now + 2_200 + Math.random() * 3_500,
            lightningEndAt: 0,
            lightningSeed: Math.floor(Math.random() * 10000),
            lightningOffsetX: 0,
            lightningOffsetY: 0,
        });
    }

    private render(now: number): void {
        if (!this.map || !this.ctx) return;
        const g = this.ctx;
        this.syncCanvas();
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        g.clearRect(0, 0, cw, ch);

        const zoom = this.map.getZoom();
        if (zoom < MIN_ZOOM || zoom > MAX_ZOOM || this.cells.length === 0) {
            audioManager.syncWeatherAudio(null, 0);
            return;
        }

        const center = this.map.getCenter();
        // 选取当前视口中心主导的天气气团
        let bestCell: WeatherCell | null = null;
        let bestStrength = 0;
        for (const cell of this.cells) {
            const s = this.cellStrengthAt(cell, center.lat, center.lng, now);
            if (s > bestStrength) {
                bestStrength = s;
                bestCell = cell;
            }
        }
        if (!bestCell || bestStrength <= 0.01) {
            audioManager.syncWeatherAudio(null, 0);
            return;
        }

        const cellPt = this.map.latLngToContainerPoint([bestCell.lat, bestCell.lng]);
        const edgePt = this.map.latLngToContainerPoint([bestCell.lat + bestCell.radiusDeg, bestCell.lng]);
        const radiusPx = Math.max(Math.min(cw, ch) * 0.75, Math.abs(edgePt.y - cellPt.y));
        const t = now / 1000;

        let loopKey: SoundKey | null = null;
        let audioStrength = bestStrength;
        switch (bestCell.kind) {
            case 'SEA_STORM':
                loopKey = 'weather_storm_loop';
                this.drawSeaStorm(g, bestCell, bestStrength, cellPt.x, cellPt.y, radiusPx, cw, ch, t, now);
                break;
            case 'MONSOON_SQUALL':
                loopKey = 'weather_rain_loop';
                this.drawRainWeather(g, bestCell, bestStrength, cellPt.x, cellPt.y, radiusPx, cw, ch, t, true);
                break;
            case 'DRIZZLE_MIST':
                loopKey = 'weather_rain_loop';
                audioStrength = bestStrength * 0.65;
                this.drawRainWeather(g, bestCell, bestStrength, cellPt.x, cellPt.y, radiusPx, cw, ch, t, false);
                break;
            case 'SEA_FOG':
                loopKey = 'weather_fog_loop';
                this.drawFogWeather(g, bestStrength, cw, ch, t, 'rgba(222, 235, 245,');
                break;
            case 'SNOW':
                loopKey = 'weather_wind_loop';
                audioStrength = bestStrength * 0.75;
                this.drawSnowWeather(g, bestCell, bestStrength, cw, ch, t, false);
                break;
            case 'BLIZZARD':
                loopKey = 'weather_blizzard_loop';
                this.drawSnowWeather(g, bestCell, bestStrength, cw, ch, t, true);
                break;
            case 'SANDSTORM':
                loopKey = 'weather_sandstorm_loop';
                this.drawSandstorm(g, bestCell, bestStrength, cellPt.x, cellPt.y, radiusPx, cw, ch, t);
                break;
        }
        audioManager.syncWeatherAudio(loopKey, audioStrength);
    }

    /** 海上暴风雨：深海雷云压暗 + 狂风斜雨 + 水花涟漪 + 狂风海沫流线 + 分支闪电雷光 */
    private drawSeaStorm(
        g: CanvasRenderingContext2D,
        cell: WeatherCell,
        strength: number,
        cx: number,
        cy: number,
        radiusPx: number,
        cw: number,
        ch: number,
        t: number,
        now: number,
    ): void {
        g.save();

        // 1. 暴风雨深蓝铅灰雷云压暗光晕
        const cloudGrad = g.createRadialGradient(
            cx, cy, radiusPx * 0.08,
            cx, cy, radiusPx * 1.15,
        );
        cloudGrad.addColorStop(0, `rgba(10, 22, 38, ${(0.38 * strength).toFixed(3)})`);
        cloudGrad.addColorStop(0.65, `rgba(14, 28, 46, ${(0.24 * strength).toFixed(3)})`);
        cloudGrad.addColorStop(1, 'rgba(14, 28, 46, 0)');
        g.fillStyle = cloudGrad;
        g.fillRect(0, 0, cw, ch);

        // 2. 翻滚风暴云雾层
        this.drawFogWeather(g, strength * 0.75, cw, ch, t * 2.2, 'rgba(32, 48, 68,');

        // 3. 海面狂风碎沫流线（随狂风掠过海面的白沫水雾丝）
        const windDx = Math.sin(cell.windAngle);
        const windDy = Math.cos(cell.windAngle);
        g.strokeStyle = `rgba(210, 235, 250, ${(0.16 * strength).toFixed(3)})`;
        g.lineWidth = 1.2;
        g.beginPath();
        for (let i = 0; i < 36; i++) {
            const p = this.splashes[i];
            const sx = ((p.u * cw + t * 380 * p.speed * windDx) % (cw + 120) + cw + 120) % (cw + 120) - 60;
            const sy = ((p.v * ch + t * 120 * p.speed) % (ch + 80) + ch + 80) % (ch + 80) - 40;
            const len = (28 + p.size * 26) * strength;
            g.moveTo(sx, sy);
            g.quadraticCurveTo(sx + len * 0.5, sy - 3, sx + len, sy + 2);
        }
        g.stroke();

        // 4. 密集疾风急雨线（远、中、近三层）与海面水花涟漪
        this.drawRainStreaks(g, cell.windAngle, strength, cw, ch, t, 210, 980, 34);
        this.drawRainSplashes(g, strength, cw, ch, t, 48);

        // 5. 云间闪电与雷光映射
        if (now < cell.lightningEndAt) {
            const remain = (cell.lightningEndAt - now) / 380;
            const flashPulse = Math.sin(remain * Math.PI * 3) > 0 ? remain : remain * 0.35;
            const flashAlpha = Math.max(0, Math.min(1, flashPulse)) * strength;
            if (flashAlpha > 0.02) {
                const lx = cw * (0.5 + cell.lightningOffsetX);
                const ly = ch * (0.32 + cell.lightningOffsetY);
                const flashGrad = g.createRadialGradient(lx, ly, 10, lx, ly, Math.max(cw, ch) * 0.65);
                flashGrad.addColorStop(0, `rgba(220, 238, 255, ${(0.42 * flashAlpha).toFixed(3)})`);
                flashGrad.addColorStop(0.4, `rgba(165, 205, 255, ${(0.16 * flashAlpha).toFixed(3)})`);
                flashGrad.addColorStop(1, 'rgba(165, 205, 255, 0)');
                g.fillStyle = flashGrad;
                g.fillRect(0, 0, cw, ch);

                this.drawLightningBolt(g, lx, Math.max(0, ly - 140), cell.lightningSeed, flashAlpha);
            }
        }

        g.restore();
    }

    /** 季风骤雨 / 江南烟雨 */
    private drawRainWeather(
        g: CanvasRenderingContext2D,
        cell: WeatherCell,
        strength: number,
        cx: number,
        cy: number,
        radiusPx: number,
        cw: number,
        ch: number,
        t: number,
        isHeavy: boolean,
    ): void {
        g.save();
        const shadeAlpha = (isHeavy ? 0.22 : 0.11) * strength;
        const grad = g.createRadialGradient(cx, cy, radiusPx * 0.1, cx, cy, radiusPx * 1.15);
        grad.addColorStop(0, `rgba(18, 30, 44, ${shadeAlpha.toFixed(3)})`);
        grad.addColorStop(1, 'rgba(18, 30, 44, 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, cw, ch);

        this.drawFogWeather(
            g,
            strength * (isHeavy ? 0.55 : 0.72),
            cw,
            ch,
            t * (isHeavy ? 1.4 : 0.85),
            isHeavy ? 'rgba(185, 205, 222,' : 'rgba(218, 232, 242,',
        );

        const count = isHeavy ? 175 : 105;
        const fallSpeed = isHeavy ? 820 : 540;
        const baseLen = isHeavy ? 28 : 19;
        this.drawRainStreaks(g, cell.windAngle, strength, cw, ch, t, count, fallSpeed, baseLen);
        this.drawRainSplashes(g, strength * (isHeavy ? 0.9 : 0.55), cw, ch, t, isHeavy ? 40 : 24);
        g.restore();
    }

    private drawRainStreaks(
        g: CanvasRenderingContext2D,
        windAngle: number,
        strength: number,
        cw: number,
        ch: number,
        t: number,
        count: number,
        fallSpeed: number,
        baseLen: number,
    ): void {
        const sinA = Math.sin(windAngle);
        const cosA = Math.cos(windAngle);
        const paths = [new Path2D(), new Path2D(), new Path2D()];

        for (let i = 0; i < count; i++) {
            const p = this.particles[i];
            const spd = fallSpeed * p.speed;
            const x = ((p.u * (cw + 200) + t * spd * sinA) % (cw + 200) + (cw + 200)) % (cw + 200) - 100;
            const y = ((p.v * (ch + 200) + t * spd * cosA) % (ch + 200) + (ch + 200)) % (ch + 200) - 100;
            const len = baseLen * p.size;
            const path = paths[p.layer];
            path.moveTo(x, y);
            path.lineTo(x + sinA * len, y + cosA * len);
        }

        g.lineCap = 'round';
        const alphas = [0.22 * strength, 0.36 * strength, 0.52 * strength];
        const widths = [0.85, 1.15, 1.55];
        for (let layer = 0; layer < 3; layer++) {
            g.strokeStyle = `rgba(208, 230, 248, ${alphas[layer].toFixed(3)})`;
            g.lineWidth = widths[layer];
            g.stroke(paths[layer]);
        }
    }

    private drawRainSplashes(
        g: CanvasRenderingContext2D,
        strength: number,
        cw: number,
        ch: number,
        t: number,
        count: number,
    ): void {
        g.strokeStyle = `rgba(215, 236, 252, ${(0.28 * strength).toFixed(3)})`;
        g.lineWidth = 0.9;
        g.beginPath();
        for (let i = 0; i < count; i++) {
            const s = this.splashes[i];
            const cycle = (t * 2.4 * s.speed + s.phase) % 1;
            if (cycle > 0.75) continue;
            const x = s.u * cw;
            const y = s.v * ch;
            const r = (2.0 + cycle * 8.5) * s.size;
            g.moveTo(x + r, y);
            g.ellipse(x, y, r, r * 0.48, 0, 0, Math.PI * 2);
        }
        g.stroke();
    }

    private drawLightningBolt(
        g: CanvasRenderingContext2D,
        startX: number,
        startY: number,
        seed: number,
        alpha: number,
    ): void {
        g.save();
        g.lineCap = 'round';
        g.lineJoin = 'round';

        const buildBranch = (x0: number, y0: number, segs: number, spread: number, s0: number): [number, number][] => {
            const pts: [number, number][] = [[x0, y0]];
            let cx = x0;
            let cy = y0;
            let s = s0;
            for (let i = 0; i < segs; i++) {
                s = (s * 1664525 + 1013904223) >>> 0;
                const r1 = ((s & 0xffff) / 0xffff) - 0.5;
                const r2 = (((s >>> 16) & 0xffff) / 0xffff);
                cx += r1 * spread;
                cy += 18 + r2 * 24;
                pts.push([cx, cy]);
            }
            return pts;
        };

        const mainPts = buildBranch(startX, startY, 10, 46, seed);
        const branchIdx = 3 + (seed % 3);
        const branchOrigin = mainPts[branchIdx];
        const subPts = buildBranch(branchOrigin[0], branchOrigin[1], 5, 36, seed + 7919);

        const strokePts = (pts: [number, number][], width: number, strokeStyle: string) => {
            g.beginPath();
            g.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
            g.lineWidth = width;
            g.strokeStyle = strokeStyle;
            g.stroke();
        };

        // 外层雷光辉光 + 亮白闪电主干
        strokePts(mainPts, 5.0, `rgba(155, 205, 255, ${(0.35 * alpha).toFixed(3)})`);
        strokePts(mainPts, 1.8, `rgba(245, 250, 255, ${(0.92 * alpha).toFixed(3)})`);
        strokePts(subPts, 3.2, `rgba(155, 205, 255, ${(0.25 * alpha).toFixed(3)})`);
        strokePts(subPts, 1.1, `rgba(235, 245, 255, ${(0.75 * alpha).toFixed(3)})`);
        g.restore();
    }

    /** 海雾 / 江南云雾：多层半透明柔滑雾团随风流淌 */
    private drawFogWeather(
        g: CanvasRenderingContext2D,
        strength: number,
        cw: number,
        ch: number,
        t: number,
        rgbPrefix: string,
    ): void {
        g.save();
        for (const puff of this.fogPuffs) {
            const x = ((puff.u * (cw + puff.rx * 2) + t * puff.speed) % (cw + puff.rx * 2)) - puff.rx;
            const y = puff.v * ch + Math.sin(t * 0.4 + puff.phase) * 24;
            const r = Math.max(puff.rx, puff.ry);
            const grad = g.createRadialGradient(x, y, r * 0.1, x, y, r);
            const a = puff.alpha * strength;
            grad.addColorStop(0, `${rgbPrefix} ${a.toFixed(3)})`);
            grad.addColorStop(0.55, `${rgbPrefix} ${(a * 0.5).toFixed(3)})`);
            grad.addColorStop(1, `${rgbPrefix} 0)`);
            g.fillStyle = grad;
            g.beginPath();
            g.arc(x, y, r, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }

    /** 瑞雪 / 塞外暴风雪 */
    private drawSnowWeather(
        g: CanvasRenderingContext2D,
        cell: WeatherCell,
        strength: number,
        cw: number,
        ch: number,
        t: number,
        isBlizzard: boolean,
    ): void {
        g.save();
        if (isBlizzard) {
            g.fillStyle = `rgba(215, 228, 242, ${(0.16 * strength).toFixed(3)})`;
            g.fillRect(0, 0, cw, ch);
            this.drawFogWeather(g, strength * 0.85, cw, ch, t * 2.6, 'rgba(228, 238, 248,');
        } else {
            this.drawFogWeather(g, strength * 0.42, cw, ch, t * 0.7, 'rgba(235, 242, 250,');
        }

        const count = isBlizzard ? 210 : 135;
        const fallSpeed = isBlizzard ? 340 : 105;
        const windDrift = isBlizzard ? 420 * (cell.windAngle >= 0 ? 1 : -1) : 38 * Math.sin(cell.windAngle);

        // 暴风雪增加高速斜飞雪线与白毛风流线
        if (isBlizzard) {
            g.strokeStyle = `rgba(245, 250, 255, ${(0.36 * strength).toFixed(3)})`;
            g.lineWidth = 1.4;
            g.beginPath();
            for (let i = 0; i < 70; i++) {
                const p = this.particles[i];
                const x = ((p.u * (cw + 160) + t * windDrift * p.speed) % (cw + 160) + (cw + 160)) % (cw + 160) - 80;
                const y = ((p.v * (ch + 160) + t * fallSpeed * p.speed) % (ch + 160) + (ch + 160)) % (ch + 160) - 80;
                const dx = windDrift * 0.035 * p.size;
                const dy = fallSpeed * 0.035 * p.size;
                g.moveTo(x, y);
                g.lineTo(x + dx, y + dy);
            }
            g.stroke();
        }

        // 远中近三层雪花颗粒
        const paths = [new Path2D(), new Path2D(), new Path2D()];
        for (let i = 0; i < count; i++) {
            const p = this.particles[i];
            const sway = Math.sin(t * 1.8 * p.speed + p.phase) * (isBlizzard ? 8 : 22);
            const x = ((p.u * (cw + 120) + t * windDrift * p.speed + sway) % (cw + 120) + (cw + 120)) % (cw + 120) - 60;
            const y = ((p.v * (ch + 120) + t * fallSpeed * p.speed) % (ch + 120) + (ch + 120)) % (ch + 120) - 60;
            const r = (1.3 + p.layer * 0.85) * p.size;
            const path = paths[p.layer];
            path.moveTo(x + r, y);
            path.arc(x, y, r, 0, Math.PI * 2);
        }

        const alphas = [0.42 * strength, 0.65 * strength, 0.88 * strength];
        for (let layer = 0; layer < 3; layer++) {
            g.fillStyle = `rgba(248, 252, 255, ${alphas[layer].toFixed(3)})`;
            g.fill(paths[layer]);
        }
        g.restore();
    }

    /** 大漠风沙 / 沙尘暴 */
    private drawSandstorm(
        g: CanvasRenderingContext2D,
        cell: WeatherCell,
        strength: number,
        cx: number,
        cy: number,
        radiusPx: number,
        cw: number,
        ch: number,
        t: number,
    ): void {
        g.save();
        // 1. 昏黄大漠风沙滤镜光晕
        const grad = g.createRadialGradient(cx, cy, radiusPx * 0.1, cx, cy, radiusPx * 1.15);
        grad.addColorStop(0, `rgba(186, 142, 78, ${(0.30 * strength).toFixed(3)})`);
        grad.addColorStop(0.7, `rgba(172, 128, 66, ${(0.18 * strength).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(172, 128, 66, 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, cw, ch);

        // 2. 滚滚黄沙尘幕
        this.drawFogWeather(g, strength * 0.95, cw, ch, t * 2.8, 'rgba(204, 162, 98,');

        // 3. 高速水平飞掠的流沙线与跃移沙粒
        const dir = cell.windAngle >= 0 ? 1 : -1;
        g.strokeStyle = `rgba(232, 198, 138, ${(0.32 * strength).toFixed(3)})`;
        g.lineWidth = 1.2;
        g.beginPath();
        for (let i = 0; i < 85; i++) {
            const p = this.particles[i];
            const spd = 560 * p.speed * dir;
            const x = ((p.u * (cw + 200) + t * spd) % (cw + 200) + (cw + 200)) % (cw + 200) - 100;
            const y = ((p.v * ch + Math.sin(t * 2.5 + p.phase) * 18) % ch + ch) % ch;
            const len = (24 + p.size * 28) * dir;
            g.moveTo(x, y);
            g.lineTo(x + len, y + 3);
        }
        g.stroke();

        // 4. 飞沙颗粒
        const grainPath = new Path2D();
        for (let i = 85; i < 195; i++) {
            const p = this.particles[i];
            const spd = 460 * p.speed * dir;
            const x = ((p.u * (cw + 120) + t * spd) % (cw + 120) + (cw + 120)) % (cw + 120) - 60;
            const y = ((p.v * ch + Math.cos(t * 3.1 + p.phase) * 14) % ch + ch) % ch;
            const r = 1.2 * p.size;
            grainPath.moveTo(x + r, y);
            grainPath.arc(x, y, r, 0, Math.PI * 2);
        }
        g.fillStyle = `rgba(225, 188, 122, ${(0.55 * strength).toFixed(3)})`;
        g.fill(grainPath);

        g.restore();
    }
}
