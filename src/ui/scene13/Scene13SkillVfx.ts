import type { TacticalSixSet } from '../../data/TacticalSkillCatalog';
import type { WarMan } from './Scene13Types';

export interface Scene13SkillVfxPoint { x: number; y: number }

/** 六计释放特效：只读视觉事件，不参与伤害、兵力或选计结算。 */
export interface Scene13SkillVfx {
    six: TacticalSixSet;
    side: 0 | 1;
    x: number;
    y: number;
    angle: number;
    startMs: number;
    dur: number;
    playerCast: boolean;
    /** 直播观众付费打赏释放（true = 帝王鎏金天降排面强化） */
    paid?: boolean;
    targets: WarMan[];
    points: Scene13SkillVfxPoint[];
}

export interface Scene13SkillVisualState {
    frenzy: number;
    shield: number;
    panic: number;
}

export type SkillVfxLayer = 'ground' | 'top';
type Lift = (x: number, y: number) => number;

const TAU = Math.PI * 2;
const COLOR: Record<TacticalSixSet, string> = {
    gongzhan: '#ff6a24',
    dizhan: '#52ccff',
    shengzhan: '#26f065',
    hunzhan: '#b572ff',
    bingzhan: '#3b9eff',
    baizhan: '#f03240',
};

interface SkillPalette {
    main: string;
    light: string;
    core: string;
    rgba0: string;
    rgbaMid: string;
    rgbaHigh: string;
    rgbaEdge: string;
}

const PALETTE: Record<TacticalSixSet, SkillPalette> = {
    gongzhan: {
        main: '#ff6a24',
        light: '#ff9e5e',
        core: '#fff7d6',
        rgba0: 'rgba(255,106,36,0)',
        rgbaMid: 'rgba(255,106,36,0.26)',
        rgbaHigh: 'rgba(255,106,36,0.76)',
        rgbaEdge: 'rgba(255,168,100,0.58)',
    },
    shengzhan: {
        main: '#26f065',
        light: '#8affb3',
        core: '#eafff0',
        rgba0: 'rgba(38,240,101,0)',
        rgbaMid: 'rgba(38,240,101,0.24)',
        rgbaHigh: 'rgba(38,240,101,0.75)',
        rgbaEdge: 'rgba(120,255,168,0.55)',
    },
    dizhan: {
        main: '#52ccff',
        light: '#9be8ff',
        core: '#ebfbff',
        rgba0: 'rgba(82,204,255,0)',
        rgbaMid: 'rgba(82,204,255,0.26)',
        rgbaHigh: 'rgba(82,204,255,0.76)',
        rgbaEdge: 'rgba(155,232,255,0.58)',
    },
    hunzhan: {
        main: '#b572ff',
        light: '#df9eff',
        core: '#fff0ff',
        rgba0: 'rgba(181,114,255,0)',
        rgbaMid: 'rgba(181,114,255,0.26)',
        rgbaHigh: 'rgba(181,114,255,0.76)',
        rgbaEdge: 'rgba(223,158,255,0.58)',
    },
    bingzhan: {
        main: '#3b9eff',
        light: '#8ac5ff',
        core: '#eef7ff',
        rgba0: 'rgba(59,158,255,0)',
        rgbaMid: 'rgba(59,158,255,0.26)',
        rgbaHigh: 'rgba(59,158,255,0.76)',
        rgbaEdge: 'rgba(138,197,255,0.58)',
    },
    baizhan: {
        main: '#f03240',
        light: '#ff7b24',
        core: '#ffeaad',
        rgba0: 'rgba(240,50,64,0)',
        rgbaMid: 'rgba(240,50,64,0.28)',
        rgbaHigh: 'rgba(240,50,64,0.78)',
        rgbaEdge: 'rgba(255,123,36,0.58)',
    },
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (p: number) => 1 - (1 - p) ** 3;

// ── 1. 六计专属手绘图标（256×256 内部全不透明 PNG）＋ 离屏发光印章池 ──
const SIX_ICON_URLS: Record<TacticalSixSet, string> = {
    gongzhan: '/SUCAI_FX/SIX_ICONS/gongzhan.png?v=opaque2',
    shengzhan: '/SUCAI_FX/SIX_ICONS/shengzhan.png?v=opaque2',
    dizhan: '/SUCAI_FX/SIX_ICONS/dizhan.png?v=opaque2',
    hunzhan: '/SUCAI_FX/SIX_ICONS/hunzhan.png?v=opaque2',
    bingzhan: '/SUCAI_FX/SIX_ICONS/bingzhan.png?v=opaque2',
    baizhan: '/SUCAI_FX/SIX_ICONS/baizhan.png?v=opaque2',
};

const sixRawImages = new Map<TacticalSixSet, HTMLImageElement>();
const sixLoading = new Set<TacticalSixSet>();
const sixBadgeCache = new Map<string, HTMLCanvasElement>();

function getSixSkillIconBadge(six: TacticalSixSet, paid = false): HTMLCanvasElement | null {
    const cacheKey = `${six}_${paid ? 1 : 0}`;
    const existing = sixBadgeCache.get(cacheKey);
    if (existing) return existing;

    const rawImg = sixRawImages.get(six);
    if (!rawImg) {
        if (typeof Image !== 'undefined' && !sixLoading.has(six)) {
            sixLoading.add(six);
            const img = new Image();
            img.onload = () => {
                sixLoading.delete(six);
                sixRawImages.set(six, img);
            };
            img.onerror = () => {
                sixLoading.delete(six);
            };
            img.src = SIX_ICON_URLS[six];
        }
        return null;
    }

    const SIZE = 256;
    const PAD = 10;
    const DRAW_S = SIZE - PAD * 2;
    const cv = document.createElement('canvas');
    cv.width = SIZE;
    cv.height = SIZE;
    const g = cv.getContext('2d')!;

    g.save();
    g.shadowColor = paid ? 'rgba(255, 212, 72, 0.96)' : 'rgba(0, 0, 0, 0.96)';
    g.shadowBlur = paid ? 18 : 14;
    g.shadowOffsetX = 0;
    g.shadowOffsetY = paid ? 0 : 4;
    g.drawImage(rawImg, PAD, PAD, DRAW_S, DRAW_S);

    g.shadowColor = 'rgba(0, 0, 0, 0.92)';
    g.shadowBlur = 7;
    g.shadowOffsetY = 2;
    g.drawImage(rawImg, PAD, PAD, DRAW_S, DRAW_S);
    g.restore();

    // 第三遍无阴影实心绘制，确保贴图主体 100% 实心不透底，完全盖住下方士兵
    g.drawImage(rawImg, PAD, PAD, DRAW_S, DRAW_S);

    sixBadgeCache.set(cacheKey, cv);
    return cv;
}

const glowStampCache = new Map<string, HTMLCanvasElement>();
const flareStampCache = new Map<string, HTMLCanvasElement>();

function getGlowStamp(color: string): HTMLCanvasElement {
    let cv = glowStampCache.get(color);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    const gctx = cv.getContext('2d')!;
    const grad = gctx.createRadialGradient(32, 32, 1, 32, 32, 30);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.22, color);
    grad.addColorStop(0.62, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    glowStampCache.set(color, cv);
    return cv;
}

function getFlareStamp(color: string): HTMLCanvasElement {
    let cv = flareStampCache.get(color);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    const gctx = cv.getContext('2d')!;
    const grad = gctx.createRadialGradient(32, 32, 1, 32, 32, 26);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    gctx.fillStyle = '#ffffff';
    gctx.beginPath();
    gctx.moveTo(32, 2);
    gctx.quadraticCurveTo(34.5, 29.5, 62, 32);
    gctx.quadraticCurveTo(34.5, 34.5, 32, 62);
    gctx.quadraticCurveTo(29.5, 34.5, 2, 32);
    gctx.quadraticCurveTo(29.5, 29.5, 32, 2);
    gctx.fill();
    flareStampCache.set(color, cv);
    return cv;
}

function drawStamp(
    ctx: CanvasRenderingContext2D,
    stamp: HTMLCanvasElement,
    x: number,
    y: number,
    rx: number,
    ry = rx,
): void {
    ctx.drawImage(stamp, x - rx, y - ry, rx * 2, ry * 2);
}

// ── 2. 锥形弯月刀罡与两头尖裂空斩刃（Tapered Crescent & Blade Mesh） ──
function drawTaperedCrescent(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    thickness: number,
    spanAngle: number,
    outerColor: string,
    coreColor = '#fff7d6',
): void {
    const half = spanAngle * 0.5;
    const steps = 18;
    const buildPath = (thickScale: number) => {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = -half + t * spanAngle;
            const w = Math.sin(t * Math.PI) * thickness * thickScale;
            const r = radius + w * 0.55;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const a = -half + t * spanAngle;
            const w = Math.sin(t * Math.PI) * thickness * thickScale;
            const r = Math.max(1, radius - w * 0.45);
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            ctx.lineTo(px, py);
        }
        ctx.closePath();
    };
    ctx.fillStyle = outerColor;
    buildPath(1.0);
    ctx.fill();

    ctx.fillStyle = coreColor;
    buildPath(0.42);
    ctx.fill();
}

function drawTaperedSlash(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    maxHalfWidth: number,
    outerColor: string,
    coreColor = '#fff5dc',
): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const mx = (x1 + x2) * 0.5;
    const my = (y1 + y2) * 0.5;

    ctx.fillStyle = outerColor;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx + nx * maxHalfWidth, my + ny * maxHalfWidth, x2, y2);
    ctx.quadraticCurveTo(mx - nx * maxHalfWidth, my - ny * maxHalfWidth, x1, y1);
    ctx.closePath();
    ctx.fill();

    const cw = maxHalfWidth * 0.42;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.moveTo(x1 + dx * 0.08, y1 + dy * 0.08);
    ctx.quadraticCurveTo(mx + nx * cw, my + ny * cw, x2 - dx * 0.08, y2 - dy * 0.08);
    ctx.quadraticCurveTo(mx - nx * cw, my - ny * cw, x1 + dx * 0.08, y1 + dy * 0.08);
    ctx.closePath();
    ctx.fill();
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
}

function drawHealPlus(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    arm: number,
    thick: number,
    outerColor = '#26f065',
    coreColor = '#eafff0',
): void {
    const drawCross = (a: number, t: number) => {
        const h = t * 0.5;
        ctx.fillRect(cx - a, cy - h, a * 2, t);
        ctx.fillRect(cx - h, cy - a, t, a * 2);
    };
    ctx.fillStyle = outerColor;
    drawCross(arm, thick);
    ctx.fillStyle = coreColor;
    drawCross(arm * 0.78, thick * 0.48);
}

// ── 3. 状态追踪与叠加规则：「技能叠加时，保留前一个色彩，上后一个技能的贴图」 ──
const INSTANT_SYNC_SEC = 4.5;

interface UnitSkillTag {
    six: 'dizhan' | 'bingzhan' | 'baizhan';
    untilSec: number;
    seq: number;
    paid: boolean;
    playerCast: boolean;
}

const unitSkillTags = new WeakMap<WarMan, UnitSkillTag>();
const taggedCastVfx = new WeakSet<Scene13SkillVfx>();
const castColorMap = new WeakMap<Scene13SkillVfx, TacticalSixSet>();
let unitTagActiveUntilSec = 0;
let globalCastSeq = 0;

interface SideCastState {
    frenzyPaid: boolean;
    frenzyPlayer: boolean;
    frenzySeq: number;
    shieldPaid: boolean;
    shieldPlayer: boolean;
    shieldSeq: number;
    panicPaid: boolean;
    panicPlayer: boolean;
    panicSeq: number;
    instantSix: 'dizhan' | 'bingzhan' | 'baizhan' | null;
    instantUntilSec: number;
    instantSeq: number;
}

const sideCastTier: [SideCastState, SideCastState] = [
    {
        frenzyPaid: false, frenzyPlayer: false, frenzySeq: 0,
        shieldPaid: false, shieldPlayer: false, shieldSeq: 0,
        panicPaid: false, panicPlayer: false, panicSeq: 0,
        instantSix: null, instantUntilSec: 0, instantSeq: 0,
    },
    {
        frenzyPaid: false, frenzyPlayer: false, frenzySeq: 0,
        shieldPaid: false, shieldPlayer: false, shieldSeq: 0,
        panicPaid: false, panicPlayer: false, panicSeq: 0,
        instantSix: null, instantUntilSec: 0, instantSeq: 0,
    },
];

let latestSideStates: [Scene13SkillVisualState, Scene13SkillVisualState] = [
    { frenzy: 0, shield: 0, panic: 0 },
    { frenzy: 0, shield: 0, panic: 0 },
];

/** 查询某一方当前正在生效的所有技能（按释放先后 seq 升序排列） */
function getSideActiveSkills(side: 0 | 1, nowSec: number, excludeSix?: TacticalSixSet): Array<{ six: TacticalSixSet; seq: number }> {
    const st = latestSideStates[side];
    const meta = sideCastTier[side];
    const list: Array<{ six: TacticalSixSet; seq: number }> = [];
    if (st.frenzy > 0 && excludeSix !== 'gongzhan') list.push({ six: 'gongzhan', seq: meta.frenzySeq });
    if (st.shield > 0 && excludeSix !== 'shengzhan') list.push({ six: 'shengzhan', seq: meta.shieldSeq });
    if (st.panic > 0 && excludeSix !== 'hunzhan') list.push({ six: 'hunzhan', seq: meta.panicSeq });
    if (meta.instantSix && nowSec < meta.instantUntilSec && excludeSix !== meta.instantSix) {
        list.push({ six: meta.instantSix, seq: meta.instantSeq });
    }
    list.sort((a, b) => a.seq - b.seq);
    return list;
}

function registerSkillCastMeta(v: Scene13SkillVfx, nowSec: number): void {
    if (taggedCastVfx.has(v)) return;
    taggedCastVfx.add(v);
    const paid = v.paid === true;
    const player = v.playerCast === true;
    const ef: 0 | 1 = v.side === 0 ? 1 : 0;
    const targetSide: 0 | 1 = (v.six === 'hunzhan' || v.six === 'baizhan') ? ef : v.side;

    // 检查受影响方是否已有正在生效的前序技能：若有，则本次叠加释放保留前一个技能的色彩，贴图用本次新技能
    const prevActive = getSideActiveSkills(targetSide, nowSec, v.six);
    const prevColorSix = prevActive.length > 0 ? prevActive[prevActive.length - 1].six : v.six;
    castColorMap.set(v, prevColorSix);

    const seq = ++globalCastSeq;
    const meta = sideCastTier[targetSide];

    if (v.six === 'gongzhan') {
        meta.frenzyPaid = paid;
        meta.frenzyPlayer = player;
        meta.frenzySeq = seq;
    } else if (v.six === 'shengzhan') {
        meta.shieldPaid = paid;
        meta.shieldPlayer = player;
        meta.shieldSeq = seq;
    } else if (v.six === 'hunzhan') {
        meta.panicPaid = paid;
        meta.panicPlayer = player;
        meta.panicSeq = seq;
    } else if (v.six === 'dizhan' || v.six === 'bingzhan' || v.six === 'baizhan') {
        const untilSec = nowSec + INSTANT_SYNC_SEC;
        if (untilSec > unitTagActiveUntilSec) unitTagActiveUntilSec = untilSec;
        meta.instantSix = v.six;
        meta.instantUntilSec = untilSec;
        meta.instantSeq = seq;
        for (const m of v.targets) {
            unitSkillTags.set(m, { six: v.six, untilSec, seq, paid, playerCast: player });
        }
    }
}

function getCastPalette(v: Scene13SkillVfx): SkillPalette {
    const colorSix = castColorMap.get(v) ?? v.six;
    return PALETTE[colorSix];
}

function tierScale(v: Scene13SkillVfx): number {
    return v.paid ? 1.35 : v.playerCast ? 1.15 : 1.0;
}

// ── 4. 释放瞬间地面层（Ground Layer） ──
function drawGroundOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = (1 - p) ** 1.3;
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y);
    const pal = getCastPalette(v);
    const col = pal.main;
    const glow = getGlowStamp(col);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 中心柔和能量光垫
    const baseRx = (32 + e * (v.six === 'hunzhan' ? 140 : 168)) * scale;
    const baseRy = baseRx * 0.48;
    ctx.globalAlpha = fade * (v.paid ? 0.42 : 0.28);
    drawStamp(ctx, glow, x, y, baseRx * 1.15, baseRy * 1.15);

    // 2. 全军主阵内外双扩环
    ctx.strokeStyle = col;
    ctx.lineWidth = (v.six === 'baizhan' ? 6 : 4.2) * (v.paid ? 1.2 : 1);
    ctx.globalAlpha = fade * 0.88;
    ellipse(ctx, x, y, baseRx, baseRy);
    ctx.stroke();

    ctx.lineWidth = 2.6;
    ctx.globalAlpha = fade * 0.72;
    ctx.strokeStyle = v.paid ? '#ffe580' : '#ffffff';
    ellipse(ctx, x, y, baseRx * 0.65, baseRy * 0.65);
    ctx.stroke();

    if (v.paid) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.globalAlpha = fade * 0.92;
        ellipse(ctx, x, y, baseRx * 1.14, baseRy * 1.14);
        ctx.stroke();
    }

    // 3. 阵口／落点地面发光环
    if (v.six === 'dizhan') {
        const pn = Math.min(v.points.length, 32);
        ctx.strokeStyle = pal.light;
        for (let i = 0; i < pn; i++) {
            const pt = v.points[i];
            const py = pt.y - lift(pt.x, pt.y);
            ctx.globalAlpha = fade * 0.85;
            ctx.lineWidth = 3;
            ellipse(ctx, pt.x, py, (16 + e * 28) * scale, (8 + e * 14) * scale);
            ctx.stroke();
        }
    } else if (v.six === 'baizhan') {
        const useTargets = v.targets.length > 0;
        const srcLen = useTargets ? v.targets.length : v.points.length;
        const pn = Math.min(srcLen, 160);
        ctx.strokeStyle = v.paid ? '#ffd700' : col;
        ctx.lineWidth = 2.4;
        for (let i = 0; i < pn; i++) {
            const idx = Math.floor(i * srcLen / pn);
            const pt = useTargets ? v.targets[idx] : v.points[idx];
            const py = pt.y - lift(pt.x, pt.y);
            ctx.globalAlpha = fade * 0.78;
            ellipse(ctx, pt.x, py, 11 + e * 7, 5.5 + e * 3.5);
            ctx.stroke();
        }
    }
    ctx.restore();
}

// ── 5. 释放瞬间上层大特效（Top Layer：动画色彩取 getCastPalette，贴图取当前释放技能） ──
function drawAttack(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y) - 12;
    const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
    const px = -dy, py = dx;
    const pal = getCastPalette(v);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 3 道巨型锥形弯月破阵刀罡
    ctx.save();
    ctx.translate(cx + dx * (e * 78 * scale - 18), cy + dy * (e * 78 * scale - 18));
    ctx.rotate(v.angle);
    for (let k = 0; k < 3; k++) {
        const r = (52 + k * 26 + e * 34) * scale;
        const thick = (18 - k * 4) * scale * (1 - p * 0.35);
        ctx.globalAlpha = fade * (0.95 - k * 0.22);
        drawTaperedCrescent(
            ctx,
            -22 + k * 15,
            0,
            r,
            thick,
            Math.PI * (0.92 - k * 0.08),
            k === 0 && v.paid ? '#ffd700' : pal.main,
            pal.core,
        );
    }
    ctx.restore();

    // 2. 9 道锥形破阵光矛疾刺贯穿军阵
    const flare = getFlareStamp(pal.main);
    for (let i = 0; i < 9; i++) {
        const off = (i - 4) * 18 * scale;
        const travel = e * (92 + (i % 3) * 24) * scale;
        const sx = cx + px * off + dx * (travel - 55);
        const sy = cy + py * off + dy * (travel - 55);
        const len = (76 - p * 22) * scale;
        const ex = sx + dx * len;
        const ey = sy + dy * len;
        ctx.globalAlpha = fade * (0.75 + (i % 2) * 0.22);
        drawTaperedSlash(ctx, sx, sy, ex, ey, (4.5 - (i % 3) * 0.8) * scale, pal.main, pal.core);
        if (i % 2 === 0) {
            ctx.globalAlpha = fade * 0.85;
            drawStamp(ctx, flare, ex, ey, 11 * scale);
        }
    }
    ctx.restore();

    // 3. 阵心上方浮现「攻战·宝剑」专属手绘图标
    const badge = getSixSkillIconBadge('gongzhan', v.paid);
    if (badge) {
        ctx.save();
        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = (p < 0.72 ? 1 : (1 - p) / 0.28);
        drawStamp(ctx, badge, cx, cy - 36 - e * 12 * scale, 108 * scale * pulse);
        ctx.restore();
    }
}

function drawReinforce(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y);
    const pal = getCastPalette(v);
    const flare = getFlareStamp(pal.main);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // 1. 前线军阵中心：巨型聚兵通天光柱
    const mainH = (130 + 80 * easeOut(Math.min(1, p * 2))) * scale;
    const mainGrad = ctx.createLinearGradient(0, cy - mainH, 0, cy);
    mainGrad.addColorStop(0, pal.rgba0);
    mainGrad.addColorStop(0.45, pal.rgbaHigh);
    mainGrad.addColorStop(1, '#ffffff');
    ctx.globalAlpha = fade * 0.92;
    ctx.strokeStyle = mainGrad;
    ctx.lineWidth = (30 - p * 12) * scale;
    ctx.beginPath();
    ctx.moveTo(cx, cy - mainH);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    ctx.lineWidth = (11 - p * 4) * scale;
    ctx.globalAlpha = fade * 0.95;
    ctx.beginPath();
    ctx.moveTo(cx, cy - mainH * 0.88);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    drawStamp(ctx, flare, cx, cy - 8, 28 * scale, 16 * scale);
    ctx.strokeStyle = v.paid ? '#ffe885' : pal.light;
    for (let k = 0; k < 3; k++) {
        const rise = (p * 1.45 + k * 0.33) % 1;
        const ry = cy - rise * 92 * scale;
        const r = (32 + (1 - rise) * 48) * scale;
        ctx.globalAlpha = fade * (1 - rise) * 0.9;
        ctx.lineWidth = 3.5 - rise * 1.5;
        ellipse(ctx, cx, ry, r, r * 0.48);
        ctx.stroke();
    }

    // 2. 各伏兵锚点：生力军天降光柱群
    const n = Math.min(v.points.length, 24);
    for (let i = 0; i < n; i++) {
        const pt = v.points[i];
        const y = pt.y - lift(pt.x, pt.y);
        const h = (72 + 64 * easeOut(Math.min(1, p * 2))) * scale;
        const grad = ctx.createLinearGradient(0, y - h, 0, y);
        grad.addColorStop(0, pal.rgba0);
        grad.addColorStop(0.5, pal.rgbaHigh);
        grad.addColorStop(1, '#ffffff');
        ctx.globalAlpha = fade * 0.9;
        ctx.strokeStyle = grad;
        ctx.lineWidth = (10 - p * 4) * scale;
        ctx.beginPath();
        ctx.moveTo(pt.x, y - h * (0.35 + e * 0.65));
        ctx.lineTo(pt.x, y);
        ctx.stroke();
    }
    ctx.restore();

    // 3. 阵心上方浮现「敌战·战号」专属手绘图标
    const badge = getSixSkillIconBadge('dizhan', v.paid);
    if (badge) {
        ctx.save();
        const dropOffset = (1 - easeOut(Math.min(1, p * 3.2))) * 32 * scale;
        ctx.globalAlpha = (p < 0.72 ? 1 : (1 - p) / 0.28);
        drawStamp(ctx, badge, cx, cy - 48 * scale - dropOffset, 108 * scale);
        ctx.restore();
    }
}

function drawShield(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y) + 28;
    const r = (68 + e * 128) * scale;
    const pal = getCastPalette(v);
    const flare = getFlareStamp(pal.main);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 全军巨型回血无敌穹顶（色彩跟随 getCastPalette：叠加时保留前一个技能色彩）
    const domeGrad = ctx.createRadialGradient(x, y - r * 0.35, r * 0.15, x, y, r);
    domeGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
    domeGrad.addColorStop(0.65, pal.rgbaMid);
    domeGrad.addColorStop(1, pal.rgbaEdge);
    ctx.globalAlpha = fade * 0.85;
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.closePath();
    ctx.fill();

    // 穹顶高亮外弧 + 白炽内芯弧
    ctx.globalAlpha = fade * 0.95;
    ctx.strokeStyle = pal.main;
    ctx.lineWidth = (7 - p * 2.5) * scale;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI + 0.03, TAU - 0.03);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.82;
    ctx.strokeStyle = pal.light;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, r - 18 * scale), Math.PI + 0.1, TAU - 0.1);
    ctx.stroke();

    const plusOffsets = [
        { dx: 0, dy: -0.62, s: 1.35 },
        { dx: -0.42, dy: -0.38, s: 0.95 },
        { dx: 0.42, dy: -0.38, s: 0.95 },
        { dx: -0.22, dy: -0.78, s: 0.8 },
        { dx: 0.22, dy: -0.78, s: 0.8 },
    ];
    for (const po of plusOffsets) {
        const px = x + po.dx * r;
        const py = y + po.dy * r - e * 22 * scale;
        ctx.globalAlpha = fade * 0.95;
        drawHealPlus(ctx, px, py, 12 * po.s * scale, 4.2 * po.s * scale, pal.main, pal.core);
    }

    drawStamp(ctx, flare, x, y - r * 0.65, 24 * scale);
    ctx.restore();

    // 2. 穹顶中心上方浮现「胜战·重盾」专属手绘图标
    const badge = getSixSkillIconBadge('shengzhan', v.paid);
    if (badge) {
        ctx.save();
        const slamDrop = (1 - easeOut(Math.min(1, p * 3.5))) * 32 * scale;
        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = (p < 0.72 ? 1 : (1 - p) / 0.28);
        drawStamp(ctx, badge, x, y - 76 * scale - slamDrop, 108 * scale * pulse);
        ctx.restore();
    }
}

function drawPanic(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const x = v.x, y = v.y - lift(v.x, v.y) - 12;
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const pal = getCastPalette(v);
    const glow = getGlowStamp(pal.main);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = fade * 0.45;
    drawStamp(ctx, glow, x, y, 95 * scale, 58 * scale);

    ctx.translate(x, y);
    ctx.scale(1, 0.62);
    for (let i = 0; i < 5; i++) {
        const r = (28 + i * 20 + e * 26) * scale;
        const a = (i % 2 ? -1 : 1) * p * 5.5 + i * 1.17;
        ctx.globalAlpha = fade * (0.95 - i * 0.1);
        drawTaperedCrescent(
            ctx,
            0,
            0,
            r,
            (9 - i * 1.1) * scale,
            Math.PI * 1.22,
            i % 2 === 0 ? pal.main : pal.light,
            pal.core,
        );
        ctx.rotate(a * 0.25);
    }
    ctx.restore();

    // 阵心旋转「混战·眩晕双螺旋涡流」专属手绘图标
    const badge = getSixSkillIconBadge('hunzhan', v.paid);
    if (badge) {
        ctx.save();
        ctx.translate(x, y - 30 * scale);
        ctx.rotate(p * TAU * 1.15);
        ctx.globalAlpha = (p < 0.72 ? 1 : (1 - p) / 0.28);
        drawStamp(ctx, badge, 0, 0, 108 * scale);
        ctx.restore();
    }
}

function drawConvert(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y) - 14;
    const pal = getCastPalette(v);
    const goldFlare = getFlareStamp('#ffd76a');
    const mainGlow = getGlowStamp(pal.main);

    // 将并战计大特效与大图标偏置到倒戈士兵队列旁边，避免大图标遮挡正在换旗倒戈的士兵
    let minDx = 0;
    let maxDx = 0;
    for (const m of v.targets) {
        if (m.hp <= 0) continue;
        const dx = m.x - x;
        const dy = m.y - v.y;
        if (Math.abs(dx) < 160 && Math.abs(dy) < 160) {
            if (dx < minDx) minDx = dx;
            if (dx > maxDx) maxDx = dx;
        }
    }
    const sideSign = Math.cos(v.angle) >= 0 ? -1 : 1;
    const edgeSpan = Math.min(85, Math.max(28, sideSign < 0 ? -minDx : maxDx));
    const iconX = x + sideSign * (edgeSpan + 116 * scale);
    const iconY = y - 18 * scale;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 士兵旁边：阴阳策反大漩涡（大图标底座）
    ctx.globalAlpha = fade * 0.55;
    drawStamp(ctx, mainGlow, iconX, iconY, 85 * scale, 50 * scale);
    drawStamp(ctx, goldFlare, iconX, iconY, 28 * scale);

    ctx.save();
    ctx.translate(iconX, iconY);
    ctx.scale(1, 0.6);
    for (let i = 0; i < 4; i++) {
        const r = (24 + i * 18 + e * 24) * scale;
        ctx.save();
        ctx.rotate((i % 2 ? 1 : -1) * p * 5.5 + i * 1.57);
        ctx.globalAlpha = fade * (0.95 - i * 0.12);
        drawTaperedCrescent(
            ctx,
            0,
            0,
            r,
            (8 - i * 1.1) * scale,
            Math.PI * 1.25,
            i % 2 ? '#ffd76a' : pal.main,
            '#ffffff',
        );
        ctx.restore();
    }
    ctx.restore();

    // 2. 从旁侧虎符大图标射向每一名倒戈士兵的高亮招降弧光锁链＋彗星星芒节点
    const n = Math.min(v.targets.length, 96);
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
        const m = v.targets[Math.floor(i * v.targets.length / n)];
        if (m.hp <= 0) continue;
        const my = m.y - lift(m.x, m.y);
        const cpx = (iconX + m.x) * 0.5;
        const cpy = Math.min(iconY, my) - 52 - (i % 3) * 14;
        ctx.globalAlpha = fade * 0.72;
        ctx.strokeStyle = i % 2 ? '#ffd76a' : pal.main;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(iconX, iconY);
        ctx.quadraticCurveTo(cpx, cpy, m.x, my - 14);
        ctx.stroke();

        const t = clamp01(p * 1.35);
        const u = 1 - t;
        const px = u * u * iconX + 2 * u * t * cpx + t * t * m.x;
        const py = u * u * iconY + 2 * u * t * cpy + t * t * (my - 14);
        ctx.globalAlpha = fade * 0.95;
        drawStamp(ctx, goldFlare, px, py, 9);
    }
    ctx.restore();

    // 3. 倒戈士兵旁侧浮现「并战·双回旋箭虎符」专属手绘大图标（不遮挡倒戈士兵与军旗）
    const badge = getSixSkillIconBadge('bingzhan', v.paid);
    if (badge) {
        ctx.save();
        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = (p < 0.72 ? 1 : (1 - p) / 0.28);
        drawStamp(ctx, badge, iconX, iconY - 12 * scale, 108 * scale * pulse);
        ctx.restore();
    }
}

function drawDefeat(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const cx = v.x;
    const cy = v.y - lift(v.x, v.y) - 12;
    const pal = getCastPalette(v);
    const mainGlow = getGlowStamp(pal.main);

    const useTargets = v.targets.length > 0;
    const srcLen = useTargets ? v.targets.length : v.points.length;
    const n = Math.min(srcLen, 140);

    // 1. 阵心动画色彩层：高对比赤红（或叠加前序技能色彩）能量光环与破阵气浪
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = fade * 0.52;
    drawStamp(ctx, mainGlow, cx, cy, (88 + e * 42) * scale, (50 + e * 24) * scale);

    ctx.strokeStyle = pal.main;
    ctx.lineWidth = (5.5 - p * 2.0) * scale;
    ctx.globalAlpha = fade * 0.92;
    ellipse(ctx, cx, cy + 8, (56 + e * 105) * scale, (28 + e * 52) * scale);
    ctx.stroke();

    ctx.strokeStyle = pal.light;
    ctx.lineWidth = 2.6 * scale;
    ctx.globalAlpha = fade * 0.78;
    ellipse(ctx, cx, cy + 8, (36 + e * 72) * scale, (18 + e * 36) * scale);
    ctx.stroke();
    ctx.restore();

    // 2. 漫天箭雨（单支箭贴图 baizhan 成片斜向下坠）
    const badge = getSixSkillIconBadge('baizhan', v.paid);
    if (badge) {
        const hash01 = (k: number) => {
            const s = Math.sin(k * 12.9898) * 43758.5453;
            return s - Math.floor(s);
        };
        const mainFlare = getFlareStamp(pal.main);
        const volleyCount = Math.max(84, Math.min(150, n > 0 ? n * 2 : 96));
        // 单支箭贴图朝向：左上 -> 右下（约 42°），飞行轨迹与箭身方向严格一致
        const FLIGHT_DX = 270 * scale;
        const FLIGHT_DY = 244 * scale;

        ctx.save();
        for (let i = 0; i < volleyCount; i++) {
            const h1 = hash01(i * 17 + 3);
            const h2 = hash01(i * 31 + 11);
            const h3 = hash01(i * 47 + 29);

            // 分多波次密集倾泻（0 ~ 0.60 陆续发射，飞行时长约 0.22，插地残留至淡出）
            const startP = h1 * 0.60;
            const flightDur = 0.20 + h2 * 0.05;
            const localP = (p - startP) / flightDur;
            if (localP < 0) continue;

            // 落点：优先锚定受创敌兵坐标，并带小幅散射覆盖整片阵地
            let tx: number;
            let ty: number;
            if (srcLen > 0) {
                const pt = useTargets ? v.targets[i % srcLen] : v.points[i % srcLen];
                const jitterX = (h2 - 0.5) * 34;
                const jitterY = (h3 - 0.5) * 22;
                tx = pt.x + jitterX;
                ty = pt.y - lift(pt.x, pt.y) + jitterY;
            } else {
                const ang = h2 * TAU;
                const rad = Math.sqrt(h3) * 120 * scale;
                tx = cx + Math.cos(ang) * rad;
                ty = cy + Math.sin(ang) * rad * 0.55;
            }

            const arrowR = (20 + (i % 3) * 3.5) * scale;
            // 箭头位于贴图中心偏右下 (+0.72*r, +0.66*r)，校准使落点恰好为箭头着地处
            const tipOffsetX = arrowR * 0.72;
            const tipOffsetY = arrowR * 0.66;

            if (localP <= 1) {
                // 空中高速下坠阶段
                const fp = localP;
                const curTipX = tx - (1 - fp) * FLIGHT_DX;
                const curTipY = ty - (1 - fp) * FLIGHT_DY;
                const cxArrow = curTipX - tipOffsetX;
                const cyArrow = curTipY - tipOffsetY;

                // 箭尾破空流光拖尾
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = i % 2 === 0 ? pal.light : pal.main;
                ctx.lineWidth = 2.0 * scale;
                ctx.globalAlpha = Math.min(1, fp * 3.5) * 0.75 * fade;
                ctx.beginPath();
                ctx.moveTo(curTipX, curTipY);
                ctx.lineTo(curTipX - FLIGHT_DX * 0.20, curTipY - FLIGHT_DY * 0.20);
                ctx.stroke();
                ctx.restore();

                // 飞行中的单箭贴图
                ctx.globalAlpha = Math.min(1, fp * 4) * (p < 0.85 ? 1 : (1 - p) / 0.15);
                drawStamp(ctx, badge, cxArrow, cyArrow, arrowR);
            } else {
                // 命中地面阶段：瞬间火花 + 箭矢插地短暂残留后淡出
                const groundT = localP - 1;
                if (groundT < 0.35) {
                    const burstFade = 1 - groundT / 0.35;
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.globalAlpha = burstFade * 0.85 * fade;
                    drawStamp(ctx, mainFlare, tx, ty, (15 + groundT * 20) * scale);
                    ctx.restore();
                }
                if (groundT < 1.15) {
                    const stickFade = (1 - groundT / 1.15) * (p < 0.78 ? 1 : (1 - p) / 0.22);
                    if (stickFade > 0.02) {
                        ctx.globalAlpha = stickFade * 0.92;
                        drawStamp(ctx, badge, tx - tipOffsetX, ty - tipOffsetY, arrowR * 0.92);
                    }
                }
            }
        }
        ctx.restore();
    }
}

/** 观众献计／打赏付费天降神威特效 */
function drawPatronBurst(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (!v.playerCast) return;
    const e = easeOut(p);
    const fade = 1 - p;
    const x = v.x, y = v.y - lift(v.x, v.y);
    const goldFlare = getFlareStamp('#ffd700');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (v.paid) {
        const beamH = 260;
        const grad = ctx.createLinearGradient(0, y - beamH, 0, y);
        grad.addColorStop(0, 'rgba(255,215,0,0)');
        grad.addColorStop(0.45, 'rgba(255,205,56,0.55)');
        grad.addColorStop(1, 'rgba(255,250,210,0.95)');
        ctx.globalAlpha = fade * 0.88;
        ctx.strokeStyle = grad;
        ctx.lineCap = 'round';
        ctx.lineWidth = 38 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.moveTo(x, y - beamH);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4.5;
        ctx.globalAlpha = fade * 0.96;
        ellipse(ctx, x, y, 46 + e * 185, 23 + e * 90);
        ctx.stroke();

        ctx.strokeStyle = '#fff6c4';
        ctx.lineWidth = 2.4;
        ellipse(ctx, x, y, 30 + e * 135, 15 + e * 66);
        ctx.stroke();

        for (let k = 0; k < 8; k++) {
            const ang = k * (TAU / 8) + p * 4;
            const r = 36 + e * 120;
            const sx = x + Math.cos(ang) * r;
            const sy = y + Math.sin(ang) * r * 0.48 - e * 38;
            ctx.globalAlpha = fade * 0.95;
            drawStamp(ctx, goldFlare, sx, sy, 14);
        }
    } else {
        ctx.globalAlpha = fade * 0.92;
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 3.5;
        ellipse(ctx, x, y, 38 + e * 145, 19 + e * 70);
        ctx.stroke();
    }
    ctx.restore();
}

function drawTopOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    drawPatronBurst(ctx, v, p, lift);
    if (v.six === 'gongzhan') drawAttack(ctx, v, p, lift);
    else if (v.six === 'dizhan') drawReinforce(ctx, v, p, lift);
    else if (v.six === 'shengzhan') drawShield(ctx, v, p, lift);
    else if (v.six === 'hunzhan') drawPanic(ctx, v, p, lift);
    else if (v.six === 'bingzhan') drawConvert(ctx, v, p, lift);
    else drawDefeat(ctx, v, p, lift);
}

export function drawScene13SkillCastVfx(
    ctx: CanvasRenderingContext2D,
    effects: readonly Scene13SkillVfx[],
    layer: SkillVfxLayer,
    lift: Lift,
    nowMs: number,
): void {
    if (!effects.length) return;
    const nowSec = nowMs * 0.001;
    ctx.save();
    for (const v of effects) {
        registerSkillCastMeta(v, nowSec);
        const p = clamp01((nowMs - v.startMs) / (v.dur * 1000));
        if (p >= 1) continue;
        ctx.save();
        if (layer === 'ground') drawGroundOne(ctx, v, p, lift);
        else drawTopOne(ctx, v, p, lift);
        ctx.restore();
    }
    ctx.restore();
}

// ── 6. 持续阶段的单兵特效（叠加规则：保留前一个技能的动画色彩，上后一个技能的贴图） ──
interface ActiveUnitSkillEntry {
    six: TacticalSixSet;
    seq: number;
    rem: number;
    paid: boolean;
}

function resolveUnitSkillLayers(
    m: WarMan,
    st: Scene13SkillVisualState,
    tier: SideCastState,
    nowSec: number,
    hasUnitTags: boolean,
): { colorEntry: ActiveUnitSkillEntry; iconEntry: ActiveUnitSkillEntry; hasShieldHeal: boolean } | null {
    const active: ActiveUnitSkillEntry[] = [];
    if (st.frenzy > 0 && !m.siegeW) {
        active.push({ six: 'gongzhan', seq: tier.frenzySeq, rem: st.frenzy, paid: tier.frenzyPaid });
    }
    if (st.shield > 0 && !m.siegeW) {
        active.push({ six: 'shengzhan', seq: tier.shieldSeq, rem: st.shield, paid: tier.shieldPaid });
    }
    if (st.panic > 0 && !m.march && !m.hero && !m.siegeW) {
        active.push({ six: 'hunzhan', seq: tier.panicSeq, rem: st.panic, paid: tier.panicPaid });
    }
    if (hasUnitTags) {
        const tag = unitSkillTags.get(m);
        if (tag && nowSec < tag.untilSec) {
            active.push({ six: tag.six, seq: tag.seq, rem: tag.untilSec - nowSec, paid: tag.paid });
        }
    }
    if (active.length === 0) return null;
    if (active.length === 1) {
        return {
            colorEntry: active[0],
            iconEntry: active[0],
            hasShieldHeal: st.shield > 0 && !m.siegeW,
        };
    }
    active.sort((a, b) => a.seq - b.seq);
    // 叠加规则：保留前一个仍在生效的技能色彩（active[length - 2]），换上后一个最新释放的技能贴图（active[length - 1]）
    return {
        colorEntry: active[active.length - 2],
        iconEntry: active[active.length - 1],
        hasShieldHeal: st.shield > 0 && !m.siegeW,
    };
}

export function drawScene13SkillStatusVfx(
    ctx: CanvasRenderingContext2D,
    men: readonly WarMan[],
    states: readonly [Scene13SkillVisualState, Scene13SkillVisualState],
    lift: Lift,
    nowSec: number,
    unitStateOf?: (m: WarMan) => Scene13SkillVisualState,
    hasExtraActive = false,
): void {
    latestSideStates = [
        { frenzy: states[0].frenzy, shield: states[0].shield, panic: states[0].panic },
        { frenzy: states[1].frenzy, shield: states[1].shield, panic: states[1].panic },
    ];
    const hasUnitTags = nowSec < unitTagActiveUntilSec;
    if (!hasUnitTags
        && !hasExtraActive
        && !states[0].frenzy && !states[0].shield && !states[0].panic
        && !states[1].frenzy && !states[1].shield && !states[1].panic) return;

    // 1. 先用 lighter 叠加层绘制单兵脚下动画色彩光圈（叠加时保留前一个技能色彩）
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (const m of men) {
        if (m.hp <= 0) continue;
        const st = unitStateOf ? unitStateOf(m) : states[m.f];
        const tier = sideCastTier[m.f];
        const resolved = resolveUnitSkillLayers(m, st, tier, nowSec, hasUnitTags);
        if (!resolved) continue;

        const { colorEntry, hasShieldHeal } = resolved;
        const pal = PALETTE[colorEntry.six];
        const fadeOut = clamp01(colorEntry.rem / 1.0);
        const y = m.y - lift(m.x, m.y);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 7 + m.zid * 0.73);

        ctx.globalAlpha = (0.36 + pulse * 0.22) * fadeOut;
        ctx.strokeStyle = colorEntry.paid && pulse > 0.55 ? '#ffd700' : pal.main;
        ctx.lineWidth = 2.4;
        ellipse(ctx, m.x, y, 10.5 + pulse * 2.2, 5.2 + pulse);
        ctx.stroke();

        if (hasShieldHeal && m.zid % 2 === 0) {
            const rise = ((nowSec * 1.4 + m.zid * 0.37) % 1);
            const hy = y - 18 - rise * 9;
            ctx.globalAlpha = (0.68 + (1 - rise) * 0.28) * fadeOut;
            drawHealPlus(ctx, m.x + 10, hy, 5.2 + pulse * 1.0, 2.2, pal.main, pal.core);
        }
    }
    ctx.restore();

    // 2. 再用正常混合模式（source-over）在士兵头顶绘制单张六计专属手绘镂空贴图（叠加时上后一个技能的贴图）
    ctx.save();
    const ICON_R = 14.5;
    for (const m of men) {
        if (m.hp <= 0) continue;
        if (!m.hero && (m.zid % 2) !== 0) continue;

        const st = unitStateOf ? unitStateOf(m) : states[m.f];
        const tier = sideCastTier[m.f];
        const resolved = resolveUnitSkillLayers(m, st, tier, nowSec, hasUnitTags);
        if (!resolved) continue;

        const { iconEntry } = resolved;
        const badge = getSixSkillIconBadge(iconEntry.six, iconEntry.paid);
        if (!badge) continue;

        const fadeOut = clamp01(iconEntry.rem / 1.0);
        const y = m.y - lift(m.x, m.y);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 7 + m.zid * 0.73);
        const iconR = m.hero ? ICON_R * 1.22 : ICON_R;

        if (iconEntry.six === 'hunzhan') {
            const hy = y - 28;
            ctx.save();
            ctx.translate(m.x, hy);
            ctx.rotate(nowSec * 3.2 + m.zid);
            ctx.globalAlpha = fadeOut;
            drawStamp(ctx, badge, 0, 0, iconR);
            ctx.restore();
        } else {
            const hy = y - 28 - pulse * 2.0;
            ctx.globalAlpha = fadeOut;
            drawStamp(ctx, badge, m.x, hy, iconR);
        }
    }
    ctx.restore();
}
