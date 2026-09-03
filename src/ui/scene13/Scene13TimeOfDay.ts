/**
 * ZOOM 13 时段色调（2026-09-03 主人定：先做，很重要）。
 *
 * 目的：每场战斗按「时段 × 季节 × 生物群系 × 纬度」给整个战场一层统一调色，
 * 让同一块地图打十场看起来不是同一场。
 *
 * 实现约束（13 性能史）：
 *   - 绝不在 canvas 里逐帧 fillRect 整画布（动态水面曾把 fps 从 55 拖到 5）。
 *   - 这里只用两个 DOM 覆盖层（multiply 压色 + screen 提亮），由浏览器合成器在 GPU 上混合，
 *     JS 每帧零成本；进场 1.5s 淡入，退场即隐藏。
 *   - 覆盖层 z-index 401/402：只压 13 的 canvas（400），血条/立绘/HUD（450、9000、10002）不受影响。
 *
 * 时段来源：TimeSystem 没有时辰，故按环境种子确定性抽取（同一场仗重放结果相同），
 * 战斗 AI / 伤害 / 出兵一律不读这里的随机。
 */

import { hashString } from './Random';
import type { Biome } from '../Scene13Biome';

export type DayPhase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

export interface TimeOfDayGrade {
    phase: DayPhase;
    /** multiply 层颜色（白 = 不改变） */
    multiply: [number, number, number];
    /** screen 层：CSS background（渐变或纯色，含 alpha） */
    screen: string;
    /** 战斗内缓慢漂移：multiply 目标色（例如黄昏→入夜），null = 不漂移 */
    driftTo: [number, number, number] | null;
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

type RGB = [number, number, number];

const BASE_MULTIPLY: Record<DayPhase, RGB> = {
    dawn:      [236, 214, 206],
    morning:   [255, 250, 236],
    noon:      [255, 255, 250],
    afternoon: [255, 241, 216],
    dusk:      [226, 188, 168],
    night:     [138, 156, 204],
};

const BASE_SCREEN: Record<DayPhase, string> = {
    dawn:      'linear-gradient(180deg, rgba(255,160,110,0.20) 0%, rgba(255,160,110,0.06) 45%, rgba(255,160,110,0) 75%)',
    morning:   'linear-gradient(180deg, rgba(255,245,215,0.08) 0%, rgba(255,245,215,0) 60%)',
    noon:      'rgba(255,255,235,0.05)',
    afternoon: 'linear-gradient(180deg, rgba(255,225,170,0.10) 0%, rgba(255,225,170,0) 65%)',
    dusk:      'linear-gradient(180deg, rgba(255,120,55,0.24) 0%, rgba(255,120,55,0.08) 40%, rgba(255,120,55,0) 70%)',
    night:     'rgba(80,100,175,0.08)',
};

/** 各时段抽取权重（战斗多在白天；夜战存在但少） */
function phaseWeights(input: ResolveInput): Record<DayPhase, number> {
    const w: Record<DayPhase, number> = { dawn: 0.12, morning: 0.26, noon: 0.22, afternoon: 0.16, dusk: 0.14, night: 0.10 };
    // 夜袭多见于攻城战；水战夜里基本不打
    if (input.isSiege) w.night += 0.04;
    if (input.isNaval) { w.night = 0.03; w.morning += 0.05; w.noon += 0.02; }
    // 高纬度太阳低：晨昏更长、正午更少
    if (input.lat != null && Math.abs(input.lat) > 50) { w.dawn += 0.04; w.dusk += 0.05; w.noon -= 0.06; }
    // 冬季白天短：晨昏/夜略增
    if (input.calendarSeason === 3) { w.dusk += 0.03; w.night += 0.02; w.noon -= 0.04; }
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

/** 两个全屏 DOM 覆盖层：multiply 压色 + screen 提亮；GPU 合成，逐帧零 JS 成本。 */
export class Scene13TimeOfDayOverlay {
    private mul: HTMLDivElement | null = null;
    private scr: HTMLDivElement | null = null;
    private driftTimer: number | null = null;
    /** 覆盖层压在 13 canvas（z 400）之上、退出按钮（450）与战斗面板（9000）之下 */
    private static readonly Z_MULTIPLY = 401;
    private static readonly Z_SCREEN = 402;
    /** 黄昏/黎明漂移时长（与双将战 60s 封顶同量级，普通 30s 战只走一半） */
    private static readonly DRIFT_MS = 60_000;

    private ensure(): void {
        if (this.mul && this.scr) return;
        const mk = (z: number, blend: string) => {
            const d = document.createElement('div');
            d.style.cssText = `position:fixed;inset:0;z-index:${z};pointer-events:none;display:none;` +
                `mix-blend-mode:${blend};opacity:0;transition:opacity 1.5s ease, background-color ${Scene13TimeOfDayOverlay.DRIFT_MS}ms linear;`;
            document.body.appendChild(d);
            return d;
        };
        this.mul = mk(Scene13TimeOfDayOverlay.Z_MULTIPLY, 'multiply');
        this.scr = mk(Scene13TimeOfDayOverlay.Z_SCREEN, 'screen');
    }

    apply(grade: TimeOfDayGrade): void {
        this.ensure();
        const mul = this.mul!, scr = this.scr!;
        if (this.driftTimer != null) { clearTimeout(this.driftTimer); this.driftTimer = null; }
        const rgb = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
        // 先无过渡地落到起始色，再开启过渡（否则会从上一场的颜色缓慢滑过来）
        mul.style.transition = 'none';
        mul.style.backgroundColor = rgb(grade.multiply);
        mul.style.background = rgb(grade.multiply);
        scr.style.background = grade.screen;
        mul.style.display = 'block';
        scr.style.display = 'block';
        // 强制回流后再启用过渡与淡入
        void mul.offsetHeight;
        mul.style.transition = `opacity 1.5s ease, background-color ${Scene13TimeOfDayOverlay.DRIFT_MS}ms linear`;
        mul.style.opacity = '1';
        scr.style.opacity = '1';
        if (grade.driftTo) {
            const to = grade.driftTo;
            this.driftTimer = window.setTimeout(() => {
                this.driftTimer = null;
                if (this.mul) this.mul.style.backgroundColor = rgb(to);
            }, 1600);
        }
    }

    hide(): void {
        if (this.driftTimer != null) { clearTimeout(this.driftTimer); this.driftTimer = null; }
        for (const d of [this.mul, this.scr]) {
            if (!d) continue;
            d.style.opacity = '0';
            d.style.display = 'none';
        }
    }

    dispose(): void {
        this.hide();
        this.mul?.remove();
        this.scr?.remove();
        this.mul = null;
        this.scr = null;
    }
}
