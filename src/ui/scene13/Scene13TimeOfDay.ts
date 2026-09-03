/**
 * ZOOM 13 时段色调（2026-09-03 主人定：先做，很重要）。
 *
 * 目的：每场战斗按「时段 × 季节 × 生物群系 × 纬度」给整个战场一层统一调色，
 * 让同一块地图打十场看起来不是同一场。
 *
 * 实现约束（13 性能史）：
 *   - 第一版用 DOM `mix-blend-mode` 覆盖层，主人实测「卡的不行」——混合层的背景是整个 body
 *     堆叠上下文（含地图 DOM 与几千个矢量元素），浏览器每帧都得把它们合成进混合组。已废。
 *   - 现行：在 13 自己的 canvas 上、所有精灵画完之后做 **两次整画布合成**（multiply 压色 + screen 提亮）。
 *     动态水面的教训是「每个 patch 每帧 3 次整画布」= 几十次；这里固定 2 次，与 patch 数无关。
 *     DEV 下单独计时进 perf.tint，落盘可查。
 *   - 开关：window.__s13Tint = false 关闭（只影响画面）。
 *
 * 时段来源：TimeSystem 没有时辰，故按环境种子确定性抽取（同一场仗重放结果相同），
 * 战斗 AI / 伤害 / 出兵一律不读这里的随机。
 */

import { hashString } from './Random';
import type { Biome } from '../Scene13Biome';

export type DayPhase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

type RGB = [number, number, number];

export interface ScreenGlow {
    /** 提亮色 */
    rgb: RGB;
    /** 顶部 alpha（渐变起点） */
    top: number;
    /** 渐变终点所在高度比例（0~1）；0 = 纯色平铺（用 top 作 alpha） */
    fadeTo: number;
}

export interface TimeOfDayGrade {
    phase: DayPhase;
    /** multiply 层颜色（白 = 不改变） */
    multiply: RGB;
    /** screen 层提亮 */
    screen: ScreenGlow;
    /** 战斗内缓慢漂移：multiply 目标色（例如黄昏→入夜），null = 不漂移 */
    driftTo: RGB | null;
}

interface ResolveInput {
    seed: string;
    /** TimeSystem 枚举：春0 夏1 秋2 冬3 */
    calendarSeason: number;
    biome: Biome | null;
    lat: number | null;
    isSiege: boolean;
    isNaval: boolean;
}

const BASE_MULTIPLY: Record<DayPhase, RGB> = {
    dawn:      [236, 214, 206],
    morning:   [255, 250, 236],
    noon:      [255, 255, 250],
    afternoon: [255, 241, 216],
    dusk:      [226, 188, 168],
    night:     [138, 156, 204],
};

const BASE_SCREEN: Record<DayPhase, ScreenGlow> = {
    dawn:      { rgb: [255, 160, 110], top: 0.20, fadeTo: 0.75 },
    morning:   { rgb: [255, 245, 215], top: 0.08, fadeTo: 0.60 },
    noon:      { rgb: [255, 255, 235], top: 0.05, fadeTo: 0 },
    afternoon: { rgb: [255, 225, 170], top: 0.10, fadeTo: 0.65 },
    dusk:      { rgb: [255, 120, 55],  top: 0.24, fadeTo: 0.70 },
    night:     { rgb: [80, 100, 175],  top: 0.08, fadeTo: 0 },
};

/** 各时段抽取权重（战斗多在白天；夜战存在但少） */
function phaseWeights(input: ResolveInput): Record<DayPhase, number> {
    // [2026-09-03 主人定] 夜战要少：一场仗里色调基本不变（只有黄昏/黎明慢漂），夜里整场都暗没意思
    const w: Record<DayPhase, number> = { dawn: 0.14, morning: 0.28, noon: 0.24, afternoon: 0.16, dusk: 0.14, night: 0.04 };
    // 水战夜里基本不打
    if (input.isNaval) { w.night = 0.01; w.morning += 0.05; w.noon += 0.02; }
    // 高纬度太阳低：晨昏更长、正午更少
    if (input.lat != null && Math.abs(input.lat) > 50) { w.dawn += 0.04; w.dusk += 0.05; w.noon -= 0.06; }
    // 冬季白天短：晨昏/夜略增
    if (input.calendarSeason === 3) { w.dusk += 0.03; w.night += 0.01; w.noon -= 0.04; }
    // 夏季白天长
    if (input.calendarSeason === 1) { w.noon += 0.04; w.afternoon += 0.03; w.night -= 0.03; }
    for (const k of Object.keys(w) as DayPhase[]) w[k] = Math.max(0.01, w[k]);
    return w;
}

function pickPhase(seed: string, input: ResolveInput): DayPhase {
    const w = phaseWeights(input);
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = (hashString(seed + '|tod') / 0xffffffff) * total;
    for (const k of Object.keys(w) as DayPhase[]) {
        r -= w[k];
        if (r <= 0) return k;
    }
    return 'morning';
}

function mix(a: RGB, b: RGB, t: number): RGB {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function round(c: RGB): RGB {
    return [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])];
}

/** 季节 / 群系对 multiply 色的偏移（白天生效强、夜里减半） */
function applyClimate(base: RGB, phase: DayPhase, input: ResolveInput): RGB {
    let c = base;
    const k = phase === 'night' ? 0.5 : 1;
    switch (input.calendarSeason) {
        case 3: c = mix(c, [226, 236, 255], 0.30 * k); break;   // 冬：冷青白
        case 2: c = mix(c, [255, 226, 190], 0.20 * k); break;   // 秋：琥珀
        case 1: c = mix(c, [255, 246, 220], 0.12 * k); break;   // 夏：暖
        default: break;                                        // 春：中性
    }
    switch (input.biome) {
        case 'desert':              c = mix(c, [255, 236, 190], 0.25 * k); break;   // 烈日炙烤
        case 'savanna':             c = mix(c, [255, 240, 200], 0.15 * k); break;
        case 'tropical_rainforest': c = mix(c, [232, 255, 214], 0.18 * k); break;   // 湿热绿雾
        case 'tundra_snow':
        case 'boreal':              c = mix(c, [222, 234, 255], 0.22 * k); break;   // 高寒冷光
        case 'mediterranean':       c = mix(c, [255, 248, 226], 0.10 * k); break;
        default: break;
    }
    return c;
}

/** 测试口：window.__s13Phase = 'dusk' 强制时段（只影响画面，不进存档） */
function forcedPhase(): DayPhase | null {
    const v = (globalThis as any).__s13Phase;
    return (v && v in BASE_MULTIPLY) ? (v as DayPhase) : null;
}

export function resolveTimeOfDay(input: ResolveInput): TimeOfDayGrade {
    const phase = forcedPhase() ?? pickPhase(input.seed, input);
    const multiply = round(applyClimate(BASE_MULTIPLY[phase], phase, input));
    let driftTo: RGB | null = null;
    // 黄昏在一场仗里慢慢入夜、黎明慢慢放亮：60s 内可见，但不到夜战那么暗
    if (phase === 'dusk') driftTo = round(applyClimate(mix(BASE_MULTIPLY.dusk, BASE_MULTIPLY.night, 0.45), 'dusk', input));
    if (phase === 'dawn') driftTo = round(applyClimate(mix(BASE_MULTIPLY.dawn, BASE_MULTIPLY.morning, 0.7), 'dawn', input));
    return { phase, multiply, screen: BASE_SCREEN[phase], driftTo };
}

/**
 * 画布内调色：每帧固定两次整画布合成（multiply + screen）。
 * 进场 1.5s 淡入（避免硬切），黄昏/黎明 60s 线性漂移。
 */
export class Scene13TimeOfDayGrader {
    private grade: TimeOfDayGrade | null = null;
    private t0 = 0;
    private gradCache: { w: number; h: number; key: string; g: CanvasGradient | string } | null = null;
    private static readonly FADE_MS = 1500;
    private static readonly DRIFT_MS = 60_000;

    begin(grade: TimeOfDayGrade, now: number): void {
        this.grade = grade;
        this.t0 = now;
        this.gradCache = null;
    }

    end(): void {
        this.grade = null;
        this.gradCache = null;
    }

    get active(): boolean { return !!this.grade; }

    /** 在所有精灵画完之后调用（flip 之外：调色对称，翻不翻都一样） */
    paint(ctx: CanvasRenderingContext2D, w: number, h: number, now: number): void {
        const g = this.grade;
        if (!g) return;
        if ((globalThis as any).__s13Tint === false) return;
        const fade = Math.min(1, (now - this.t0) / Scene13TimeOfDayGrader.FADE_MS);
        let mul = g.multiply;
        if (g.driftTo) {
            const k = Math.min(1, (now - this.t0) / Scene13TimeOfDayGrader.DRIFT_MS);
            mul = mix(g.multiply, g.driftTo, k);
        }
        // 淡入：把 multiply 色向白插值（白 = 不改变）
        if (fade < 1) mul = mix([255, 255, 255], mul, fade);
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgb(${mul[0] | 0},${mul[1] | 0},${mul[2] | 0})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = fade;
        ctx.fillStyle = this.screenFill(ctx, g.screen, w, h);
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    private screenFill(ctx: CanvasRenderingContext2D, s: ScreenGlow, w: number, h: number): CanvasGradient | string {
        const key = `${s.rgb.join(',')}|${s.top}|${s.fadeTo}`;
        const c = this.gradCache;
        if (c && c.w === w && c.h === h && c.key === key) return c.g;
        const [r, gg, b] = s.rgb;
        let fill: CanvasGradient | string;
        if (s.fadeTo <= 0) {
            fill = `rgba(${r},${gg},${b},${s.top})`;
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, h * s.fadeTo);
            grad.addColorStop(0, `rgba(${r},${gg},${b},${s.top})`);
            grad.addColorStop(0.55, `rgba(${r},${gg},${b},${s.top * 0.3})`);
            grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
            fill = grad;
        }
        this.gradCache = { w, h, key, g: fill };
        return fill;
    }
}
