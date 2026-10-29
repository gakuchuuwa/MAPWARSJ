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

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (p: number) => 1 - (1 - p) ** 3;

// ── 1. 离屏预烘焙发光印章池（GitHub 粒子库核心做法：替代慢速 shadowBlur，抗直播推流压缩） ──
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
    // 柔和底晕
    const grad = gctx.createRadialGradient(32, 32, 1, 32, 32, 26);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    // 十字锐利星芒（白炽核心抗视频编码模糊）
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
/** 绘制两头尖锐如针、腰部饱满宽厚的弯月刀罡（外层饱和刀气＋内芯白炽刀锋） */
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

/** 绘制两头尖锐、中间宽厚的直线裂空斩刃 */
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

/** 绘制高对比翠绿十字 `+` 号（外层翠绿荧光＋内芯高亮白绿） */
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

// ── 3. 状态追踪：让持续类与瞬发类的「全军大阵＋单兵特效」时间严格一致，并记住是否打赏 ──
const INSTANT_SYNC_SEC = 4.2;
interface UnitSkillTag {
    six: 'dizhan' | 'bingzhan';
    untilSec: number;
    paid: boolean;
    playerCast: boolean;
}
const unitSkillTags = new WeakMap<WarMan, UnitSkillTag>();
const taggedCastVfx = new WeakSet<Scene13SkillVfx>();
let unitTagActiveUntilSec = 0;

/** 记录双方当前生效的持续技是否由观众/打赏触发，供持续 15~20 秒的全军大阵与单兵鎏金强化读取 */
const sideCastTier: [
    { frenzyPaid: boolean; frenzyPlayer: boolean; shieldPaid: boolean; shieldPlayer: boolean; panicPaid: boolean; panicPlayer: boolean },
    { frenzyPaid: boolean; frenzyPlayer: boolean; shieldPaid: boolean; shieldPlayer: boolean; panicPaid: boolean; panicPlayer: boolean },
] = [
    { frenzyPaid: false, frenzyPlayer: false, shieldPaid: false, shieldPlayer: false, panicPaid: false, panicPlayer: false },
    { frenzyPaid: false, frenzyPlayer: false, shieldPaid: false, shieldPlayer: false, panicPaid: false, panicPlayer: false },
];

function registerSkillCastMeta(v: Scene13SkillVfx, nowSec: number): void {
    if (taggedCastVfx.has(v)) return;
    taggedCastVfx.add(v);
    const paid = v.paid === true;
    const player = v.playerCast === true;
    const ef: 0 | 1 = v.side === 0 ? 1 : 0;

    if (v.six === 'gongzhan') {
        sideCastTier[v.side].frenzyPaid = paid;
        sideCastTier[v.side].frenzyPlayer = player;
    } else if (v.six === 'shengzhan') {
        sideCastTier[v.side].shieldPaid = paid;
        sideCastTier[v.side].shieldPlayer = player;
    } else if (v.six === 'hunzhan') {
        sideCastTier[ef].panicPaid = paid;
        sideCastTier[ef].panicPlayer = player;
    } else if (v.six === 'dizhan' || v.six === 'bingzhan') {
        const untilSec = nowSec + INSTANT_SYNC_SEC;
        if (untilSec > unitTagActiveUntilSec) unitTagActiveUntilSec = untilSec;
        for (const m of v.targets) {
            unitSkillTags.set(m, { six: v.six, untilSec, paid, playerCast: player });
        }
    }
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
    const col = COLOR[v.six];
    const glow = getGlowStamp(col);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 中心柔和能量光垫（抗推流压缩的大色块底光）
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

    // 打赏付费专属：地面双层帝王鎏金圣辉扩散震波
    if (v.paid) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.globalAlpha = fade * 0.92;
        ellipse(ctx, x, y, baseRx * 1.14, baseRy * 1.14);
        ctx.stroke();
    }

    // 3. 单兵／阵口地面发光环
    if (v.six === 'dizhan') {
        const pn = Math.min(v.points.length, 32);
        ctx.strokeStyle = '#9be8ff';
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
        const pn = Math.min(srcLen, 140);
        for (let i = 0; i < pn; i++) {
            const idx = Math.floor(i * srcLen / pn);
            const pt = useTargets ? v.targets[idx] : v.points[idx];
            const py = pt.y - lift(pt.x, pt.y);
            // 与上层流星下坠错峰同步：前半段地面预警收缩圈，撞击瞬间爆开火环
            const delay = ((i * 0.618034) % 1) * 0.42;
            const localP = clamp01((p - delay) / (1 - delay));
            const fallFrac = 0.42;
            if (localP < fallFrac) {
                const fp = localP / fallFrac;
                ctx.strokeStyle = COLOR.baizhan;
                ctx.globalAlpha = fade * (0.25 + fp * 0.45);
                ctx.lineWidth = 1.8;
                ellipse(ctx, pt.x, py, (18 - fp * 8) * scale, (9 - fp * 4) * scale);
                ctx.stroke();
            } else {
                const ip = (localP - fallFrac) / (1 - fallFrac);
                const ie = easeOut(ip);
                const ifade = (1 - ip) ** 1.25;
                ctx.globalAlpha = ifade * 0.52;
                drawStamp(ctx, glow, pt.x, py, (16 + ie * 12) * scale, (9 + ie * 6) * scale);
                ctx.strokeStyle = COLOR.baizhan;
                ctx.globalAlpha = ifade * 0.95;
                ctx.lineWidth = 3.2 * (1 - ip * 0.4);
                ellipse(ctx, pt.x, py, 8 + ie * 20, 4 + ie * 10);
                ctx.stroke();
                ctx.strokeStyle = v.paid ? '#ffe580' : '#ffeaad';
                ctx.globalAlpha = ifade * 0.85;
                ctx.lineWidth = 1.8;
                ellipse(ctx, pt.x, py, 4 + ie * 11, 2 + ie * 5.5);
                ctx.stroke();
            }
        }
    }

    if (v.six !== 'baizhan' && v.targets.length > 0) {
        const tn = Math.min(v.targets.length, 220);
        ctx.strokeStyle = v.paid ? '#ffe074' : col;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = fade * 0.72;
        for (let i = 0; i < tn; i++) {
            const m = v.targets[Math.floor(i * v.targets.length / tn)];
            if (m.hp <= 0) continue;
            const my = m.y - lift(m.x, m.y);
            ellipse(ctx, m.x, my, 10 + e * 9, 5 + e * 4.5);
            ctx.stroke();
        }
    }
    ctx.restore();
}

// ── 5. 释放瞬间上层大特效（Top Layer：锥形弯月刀罡、通天光柱、穹顶护罩、星芒粒子） ──
function drawAttack(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y) - 12;
    const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
    const px = -dy, py = dx;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 3 道巨型锥形赤金弯月破阵刀罡（两头如针、腰部饱满、白炽内芯）
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
            k === 0 && v.paid ? '#ffd700' : COLOR.gongzhan,
            '#fff8d6',
        );
    }
    ctx.restore();

    // 2. 9 道锥形破阵火矛疾刺贯穿军阵
    const flare = getFlareStamp(COLOR.gongzhan);
    for (let i = 0; i < 9; i++) {
        const off = (i - 4) * 18 * scale;
        const travel = e * (92 + (i % 3) * 24) * scale;
        const sx = cx + px * off + dx * (travel - 55);
        const sy = cy + py * off + dy * (travel - 55);
        const len = (76 - p * 22) * scale;
        const ex = sx + dx * len;
        const ey = sy + dy * len;
        ctx.globalAlpha = fade * (0.75 + (i % 2) * 0.22);
        drawTaperedSlash(ctx, sx, sy, ex, ey, (4.5 - (i % 3) * 0.8) * scale, COLOR.gongzhan, '#fff5c0');
        if (i % 2 === 0) {
            ctx.globalAlpha = fade * 0.85;
            drawStamp(ctx, flare, ex, ey, 11 * scale);
        }
    }
    ctx.restore();
}

function drawReinforce(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y);
    const flare = getFlareStamp(COLOR.dizhan);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // 1. 前线军阵中心：巨型冰蓝聚兵通天光柱（外层冰蓝＋内芯纯白高亮）
    const mainH = (130 + 80 * easeOut(Math.min(1, p * 2))) * scale;
    const mainGrad = ctx.createLinearGradient(0, cy - mainH, 0, cy);
    mainGrad.addColorStop(0, 'rgba(82,204,255,0)');
    mainGrad.addColorStop(0.45, 'rgba(82,204,255,0.75)');
    mainGrad.addColorStop(1, 'rgba(235,250,255,0.98)');
    ctx.globalAlpha = fade * 0.92;
    ctx.strokeStyle = mainGrad;
    ctx.lineWidth = (30 - p * 12) * scale;
    ctx.beginPath();
    ctx.moveTo(cx, cy - mainH);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // 光柱白炽内芯
    ctx.lineWidth = (11 - p * 4) * scale;
    ctx.globalAlpha = fade * 0.95;
    ctx.beginPath();
    ctx.moveTo(cx, cy - mainH * 0.88);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // 底部星芒爆发 + 3 层上升号令光环
    drawStamp(ctx, flare, cx, cy - 8, 28 * scale, 16 * scale);
    ctx.strokeStyle = v.paid ? '#ffe885' : '#b8efff';
    for (let k = 0; k < 3; k++) {
        const rise = (p * 1.45 + k * 0.33) % 1;
        const ry = cy - rise * 92 * scale;
        const r = (32 + (1 - rise) * 48) * scale;
        ctx.globalAlpha = fade * (1 - rise) * 0.9;
        ctx.lineWidth = 3.5 - rise * 1.5;
        ellipse(ctx, cx, ry, r, r * 0.48);
        ctx.stroke();
    }

    // 2. 后方各出兵口：生力军天降光柱群
    const n = Math.min(v.points.length, 24);
    for (let i = 0; i < n; i++) {
        const pt = v.points[i];
        const y = pt.y - lift(pt.x, pt.y);
        const h = (72 + 64 * easeOut(Math.min(1, p * 2))) * scale;
        const grad = ctx.createLinearGradient(0, y - h, 0, y);
        grad.addColorStop(0, 'rgba(150,230,255,0)');
        grad.addColorStop(0.5, 'rgba(82,204,255,0.78)');
        grad.addColorStop(1, 'rgba(255,255,255,0.96)');
        ctx.globalAlpha = fade * 0.9;
        ctx.strokeStyle = grad;
        ctx.lineWidth = (10 - p * 4) * scale;
        ctx.beginPath();
        ctx.moveTo(pt.x, y - h * (0.35 + e * 0.65));
        ctx.lineTo(pt.x, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawShield(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y) + 28;
    const r = (68 + e * 128) * scale;
    const flare = getFlareStamp(COLOR.shengzhan);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 全军巨型翠绿回血无敌穹顶（径向渐变通透能量罩）
    const domeGrad = ctx.createRadialGradient(x, y - r * 0.35, r * 0.15, x, y, r);
    domeGrad.addColorStop(0, 'rgba(220,255,232,0.06)');
    domeGrad.addColorStop(0.65, 'rgba(38,240,101,0.24)');
    domeGrad.addColorStop(1, 'rgba(120,255,168,0.55)');
    ctx.globalAlpha = fade * 0.85;
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.closePath();
    ctx.fill();

    // 穹顶高亮外弧 + 白炽内芯弧
    ctx.globalAlpha = fade * 0.95;
    ctx.strokeStyle = COLOR.shengzhan;
    ctx.lineWidth = (7 - p * 2.5) * scale;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI + 0.03, TAU - 0.03);
    ctx.stroke();

    // 穹顶内层翠绿满血光弧 + 升腾绿色 + 号群
    ctx.globalAlpha = fade * 0.82;
    ctx.strokeStyle = '#8affb3';
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
        drawHealPlus(ctx, px, py, 12 * po.s * scale, 4.2 * po.s * scale, COLOR.shengzhan, '#eafff0');
    }

    drawStamp(ctx, flare, x, y - r * 0.65, 24 * scale);
    ctx.restore();
}

function drawPanic(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const x = v.x, y = v.y - lift(v.x, v.y) - 12;
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const glow = getGlowStamp(COLOR.hunzhan);

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
            i % 2 === 0 ? COLOR.hunzhan : '#df9eff',
            '#fff0ff',
        );
        ctx.rotate(a * 0.25);
    }
    ctx.restore();
}

function drawConvert(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y) - 14;
    const goldFlare = getFlareStamp('#ffd76a');
    const purpleGlow = getGlowStamp(COLOR.bingzhan);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 全军重心：紫金阴阳策反大漩涡（锥形双色弯月环绕＋中心星芒）
    ctx.globalAlpha = fade * 0.55;
    drawStamp(ctx, purpleGlow, x, y, 85 * scale, 50 * scale);
    drawStamp(ctx, goldFlare, x, y, 28 * scale);

    ctx.save();
    ctx.translate(x, y);
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
            i % 2 ? '#ffd76a' : COLOR.bingzhan,
            '#ffffff',
        );
        ctx.restore();
    }
    ctx.restore();

    // 2. 射向每一名倒戈士兵的高亮招降弧光锁链＋彗星星芒节点
    const n = Math.min(v.targets.length, 96);
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
        const m = v.targets[Math.floor(i * v.targets.length / n)];
        if (m.hp <= 0) continue;
        const my = m.y - lift(m.x, m.y);
        const cpx = (x + m.x) * 0.5;
        const cpy = Math.min(y, my) - 52 - (i % 3) * 14;
        ctx.globalAlpha = fade * 0.72;
        ctx.strokeStyle = i % 2 ? '#ffd76a' : COLOR.bingzhan;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(cpx, cpy, m.x, my - 14);
        ctx.stroke();

        const t = clamp01(p * 1.35);
        const u = 1 - t;
        const px = u * u * x + 2 * u * t * cpx + t * t * m.x;
        const py = u * u * y + 2 * u * t * cpy + t * t * (my - 14);
        ctx.globalAlpha = fade * 0.95;
        drawStamp(ctx, goldFlare, px, py, 9);
    }
    ctx.restore();
}

function drawDefeat(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const fade = 1 - p;
    const scale = tierScale(v);
    const cx = v.x;
    const cy = v.y - lift(v.x, v.y) - 8;
    const redFlare = getFlareStamp(COLOR.baizhan);
    const orangeGlow = getGlowStamp('#ff5e1a');
    const redGlow = getGlowStamp(COLOR.baizhan);

    const useTargets = v.targets.length > 0;
    const srcLen = useTargets ? v.targets.length : v.points.length;
    const n = Math.min(srcLen, 140);
    const unitScale = v.paid ? 1.2 : 1;

    // 流星斜掠向量（从高空斜劈而下，带真实天象倾角）
    const fallVecX = -110 * scale;
    const fallVecY = -260 * scale;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 敌阵中心主陨星下坠（前 38% 拖曳巨型赤金火尾极速砸落，撞地后炸开巨型火云与飞溅火流星）
    const mainFallEnd = 0.38;
    if (p < mainFallEnd) {
        const mp = p / mainFallEnd;
        const headX = cx + fallVecX * (1 - mp);
        const headY = cy + fallVecY * (1 - mp);
        const tailX = headX + fallVecX * 0.55;
        const tailY = headY + fallVecY * 0.55;

        ctx.globalAlpha = 0.95;
        drawTaperedSlash(ctx, tailX, tailY, headX, headY, 16 * scale, COLOR.baizhan, '#ffeaad');
        drawTaperedSlash(
            ctx,
            headX + fallVecX * 0.32,
            headY + fallVecY * 0.32,
            headX,
            headY,
            10 * scale,
            '#ff7b24',
            '#ffffff',
        );
        drawStamp(ctx, orangeGlow, headX, headY, 38 * scale);
        drawStamp(ctx, redFlare, headX, headY, 26 * scale);
    } else {
        const ip = (p - mainFallEnd) / (1 - mainFallEnd);
        const ie = easeOut(ip);
        const ifade = (1 - ip) ** 1.2;
        ctx.globalAlpha = ifade * 0.65;
        drawStamp(ctx, redGlow, cx, cy, (75 + ie * 65) * scale, (42 + ie * 36) * scale);
        ctx.globalAlpha = ifade * 0.95;
        drawStamp(ctx, redFlare, cx, cy - ie * 14, (34 - ip * 14) * scale);
        // 主陨星撞地飞溅的 8 颗火流星余烬
        for (let k = 0; k < 8; k++) {
            const ang = k * (TAU / 8) + 0.35;
            const dist = ie * (45 + (k % 3) * 28) * scale;
            const sx = cx + Math.cos(ang) * dist;
            const sy = cy + Math.sin(ang) * dist * 0.52 - Math.sin(ip * Math.PI) * (26 + (k % 2) * 14);
            ctx.globalAlpha = ifade * 0.88;
            drawStamp(ctx, redFlare, sx, sy, (11 - ip * 5) * scale);
        }
    }

    // 2. 漫天流星雨锁定每一名折损敌兵：错峰斜坠 ➔ 贯顶砸落 ➔ 爆裂火球与星芒
    const uFallX = -72 * unitScale;
    const uFallY = -185 * unitScale;
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(i * srcLen / n);
        const pt = useTargets ? v.targets[idx] : v.points[idx];
        const py = pt.y - lift(pt.x, pt.y) - 10;

        // 黄金分割错峰（0~0.42），与 SKILL_KILL_SPREAD_SEC 分批倒下节奏呼应
        const delay = ((i * 0.618034) % 1) * 0.42;
        if (p < delay) continue;
        const localP = clamp01((p - delay) / (1 - delay));
        const fallFrac = 0.42;

        if (localP < fallFrac) {
            // 流星下坠阶段：高空斜劈火尾 + 白炽流星头
            const fp = localP / fallFrac;
            const hx = pt.x + uFallX * (1 - fp);
            const hy = py + uFallY * (1 - fp);
            const tx = hx + uFallX * 0.52;
            const ty = hy + uFallY * 0.52;

            ctx.globalAlpha = (0.55 + fp * 0.45) * fade;
            drawTaperedSlash(
                ctx,
                tx,
                ty,
                hx,
                hy,
                5.4 * unitScale,
                v.paid ? '#ffae38' : COLOR.baizhan,
                '#fff4cc',
            );
            ctx.globalAlpha = 0.95 * fade;
            drawStamp(ctx, orangeGlow, hx, hy, 14 * unitScale);
            drawStamp(ctx, redFlare, hx, hy, 10.5 * unitScale);
        } else {
            // 陨石命中爆裂阶段：冲击火球 + 冲天火柱 + 飞溅火星
            const ip = (localP - fallFrac) / (1 - fallFrac);
            const ie = easeOut(ip);
            const ifade = (1 - ip) ** 1.3;

            ctx.globalAlpha = ifade * 0.68;
            drawStamp(ctx, redGlow, pt.x, py, (22 + ie * 10) * unitScale, (14 + ie * 6) * unitScale);

            // 命中瞬间向上反冲的烈焰火舌
            const pillarH = (32 - ip * 16) * unitScale;
            ctx.globalAlpha = ifade * 0.94;
            drawTaperedSlash(
                ctx,
                pt.x,
                py - pillarH,
                pt.x,
                py + 6 * unitScale,
                4.6 * unitScale * (1 - ip * 0.35),
                '#ff6a24',
                '#fff5dc',
            );

            ctx.globalAlpha = ifade * 0.95;
            drawStamp(ctx, redFlare, pt.x, py - 4, (13 - ip * 5) * unitScale);

            if (i % 2 === 0) {
                const sparkX = pt.x + Math.sin(i * 2.3 + ip * 5) * (6 + ie * 14);
                const sparkY = py - 10 - ie * (22 + (i % 7) * 3);
                ctx.globalAlpha = ifade * 0.85;
                drawStamp(ctx, redFlare, sparkX, sparkY, (7.5 - ip * 3) * unitScale);
            }
        }
    }
    ctx.restore();
}

function drawTargetGlow(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (v.six === 'baizhan') return;
    const n = Math.min(v.targets.length, 220);
    if (n === 0) return;
    const fade = 1 - p;
    const e = easeOut(p);
    const col = COLOR[v.six];
    const flare = getFlareStamp(v.paid ? '#ffd700' : col);
    const dx = Math.cos(v.angle), dy = Math.sin(v.angle);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (let i = 0; i < n; i++) {
        const m = v.targets[Math.floor(i * v.targets.length / n)];
        if (m.hp <= 0) continue;
        const y = m.y - lift(m.x, m.y);

        // 1. 单兵脚下高对比发光环（打赏付费额外嵌套亮金内环）
        ctx.strokeStyle = col;
        ctx.globalAlpha = fade * 0.9;
        ctx.lineWidth = 2.6;
        ellipse(ctx, m.x, y, 10 + e * 8, 5 + e * 4);
        ctx.stroke();

        if (v.paid) {
            ctx.strokeStyle = '#ffe680';
            ctx.lineWidth = 1.6;
            ellipse(ctx, m.x, y, 7 + e * 5, 3.5 + e * 2.5);
            ctx.stroke();
        }

        // 2. 单兵头顶高对比技策特效
        if (v.six === 'gongzhan') {
            const hy = y - 22 - e * 4;
            ctx.globalAlpha = fade * 0.95;
            drawTaperedSlash(
                ctx,
                m.x - dx * 9,
                hy - dy * 7 + 3,
                m.x + dx * 12,
                hy + dy * 7 - 5,
                2.8,
                COLOR.gongzhan,
                '#fff4bd',
            );
            if (i % 2 === 0) drawStamp(ctx, flare, m.x, hy - 3, 8);
        } else if (v.six === 'shengzhan') {
            const hy = y - 20 - e * 8;
            ctx.globalAlpha = fade * 0.96;
            drawHealPlus(ctx, m.x, hy, 7.5, 2.8, COLOR.shengzhan, '#eafff0');
            if (i % 2 === 0) drawStamp(ctx, flare, m.x, hy, 7.5);
        } else if (v.six === 'hunzhan') {
            const ang = p * 6 + m.zid;
            ctx.strokeStyle = '#d8a6ff';
            ctx.globalAlpha = fade * 0.92;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(m.x, y - 22, 7.5 + p * 3.5, ang, ang + Math.PI * 1.35);
            ctx.stroke();
        } else if (v.six === 'dizhan') {
            const hy = y - 22 - e * 4;
            ctx.strokeStyle = 'rgba(145,232,255,0.88)';
            ctx.globalAlpha = fade * 0.85;
            ctx.lineWidth = 3.5 * (1 - p * 0.45);
            ctx.beginPath();
            ctx.moveTo(m.x, y - 42 - (1 - e) * 18);
            ctx.lineTo(m.x, y - 6);
            ctx.stroke();
            drawStamp(ctx, flare, m.x, hy - 2, 9);
        } else if (v.six === 'bingzhan') {
            const hy = y - 23;
            const rot = p * 5 + m.zid;
            ctx.strokeStyle = '#ffd76a';
            ctx.globalAlpha = fade * 0.95;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(m.x, hy, 8, rot, rot + Math.PI * 0.95);
            ctx.stroke();
            ctx.strokeStyle = COLOR.bingzhan;
            ctx.beginPath();
            ctx.arc(m.x, hy, 8, rot + Math.PI, rot + Math.PI * 1.95);
            ctx.stroke();
            drawStamp(ctx, flare, m.x, hy, 8.5);
        }
    }
    ctx.restore();
}

/** 观众献计／打赏付费天降神威特效（三档排面差距） */
function drawPatronBurst(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (!v.playerCast) return;
    const e = easeOut(p);
    const fade = 1 - p;
    const x = v.x, y = v.y - lift(v.x, v.y);
    const goldFlare = getFlareStamp('#ffd700');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (v.paid) {
        // 打赏付费专属：贯穿屏幕顶端的「帝王鎏金天降神柱」＋ 双层金龙震波 ＋ 环绕上升金星
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

        // 双层鎏金扩张光环
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4.5;
        ctx.globalAlpha = fade * 0.96;
        ellipse(ctx, x, y, 46 + e * 185, 23 + e * 90);
        ctx.stroke();

        ctx.strokeStyle = '#fff6c4';
        ctx.lineWidth = 2.4;
        ellipse(ctx, x, y, 30 + e * 135, 15 + e * 66);
        ctx.stroke();

        // 8 颗环绕升腾的打赏金星芒
        for (let k = 0; k < 8; k++) {
            const ang = k * (TAU / 8) + p * 4;
            const r = 36 + e * 120;
            const sx = x + Math.cos(ang) * r;
            const sy = y + Math.sin(ang) * r * 0.48 - e * 38;
            ctx.globalAlpha = fade * 0.95;
            drawStamp(ctx, goldFlare, sx, sy, 14);
        }
    } else {
        // 免费弹幕积分：单层金色认主扫光环
        ctx.globalAlpha = fade * 0.92;
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 3.5;
        ellipse(ctx, x, y, 38 + e * 145, 19 + e * 70);
        ctx.stroke();
    }
    ctx.restore();
}

function drawTopOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (v.six === 'gongzhan') drawAttack(ctx, v, p, lift);
    else if (v.six === 'dizhan') drawReinforce(ctx, v, p, lift);
    else if (v.six === 'shengzhan') drawShield(ctx, v, p, lift);
    else if (v.six === 'hunzhan') drawPanic(ctx, v, p, lift);
    else if (v.six === 'bingzhan') drawConvert(ctx, v, p, lift);
    else drawDefeat(ctx, v, p, lift);
    drawTargetGlow(ctx, v, p, lift);
    drawPatronBurst(ctx, v, p, lift);
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

// ── 6. 持续阶段的单兵特效（大圈只在释放瞬间 1.5~1.8 秒爆发，持续期仅保留单兵脚下小圈与头顶小标，不遮挡战场） ──
export function drawScene13SkillStatusVfx(
    ctx: CanvasRenderingContext2D,
    men: readonly WarMan[],
    states: readonly [Scene13SkillVisualState, Scene13SkillVisualState],
    lift: Lift,
    nowSec: number,
    unitStateOf?: (m: WarMan) => Scene13SkillVisualState,
    hasExtraActive = false,
): void {
    const hasUnitTags = nowSec < unitTagActiveUntilSec;
    if (!hasUnitTags
        && !hasExtraActive
        && !states[0].frenzy && !states[0].shield && !states[0].panic
        && !states[1].frenzy && !states[1].shield && !states[1].panic) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    const gongFlare = getFlareStamp(COLOR.gongzhan);
    const shengFlare = getFlareStamp(COLOR.dizhan);
    const bingFlare = getFlareStamp('#ffd76a');

    // 绘制每名受影响士兵脚下的小光环与头顶状态小标
    for (const m of men) {
        if (m.hp <= 0) continue;
        const st = unitStateOf ? unitStateOf(m) : states[m.f];
        const tier = sideCastTier[m.f];
        const y = m.y - lift(m.x, m.y);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 7 + m.zid * 0.73);

        // 【攻】猛攻持续期：全员脚下赤橙战环 ＋ 头顶锥形赤金刀火与星芒
        if (st.frenzy > 0 && !m.siegeW) {
            const fadeOut = clamp01(st.frenzy / 1.0);
            ctx.globalAlpha = (0.34 + pulse * 0.22) * fadeOut;
            ctx.strokeStyle = tier.frenzyPaid && pulse > 0.55 ? '#ffd700' : COLOR.gongzhan;
            ctx.lineWidth = 2.3;
            ellipse(ctx, m.x, y, 10.5 + pulse * 2.5, 5.2 + pulse);
            ctx.stroke();
            if (m.zid % 2 === 0) {
                const sway = Math.sin(nowSec * 9 + m.zid) * 2.5;
                const hy = y - 21 - pulse * 4;
                ctx.globalAlpha = (0.62 + pulse * 0.34) * fadeOut;
                drawTaperedSlash(
                    ctx,
                    m.x - 5 + sway * 0.4,
                    hy + 5,
                    m.x + 5 + sway,
                    hy - 6,
                    2.4,
                    COLOR.gongzhan,
                    '#fff4bd',
                );
                if (m.zid % 4 === 0) {
                    ctx.globalAlpha = (0.55 + pulse * 0.35) * fadeOut;
                    drawStamp(ctx, gongFlare, m.x + sway * 0.6, hy - 2, 6.5);
                }
            }
        }

        // 【胜】回满血＋无敌持续期：全员脚下翠绿光圈 ＋ 头顶上升绿色 + 号特效
        if (st.shield > 0 && !m.siegeW) {
            const fadeOut = clamp01(st.shield / 1.0);
            ctx.globalAlpha = (0.36 + pulse * 0.22) * fadeOut;
            ctx.strokeStyle = tier.shieldPaid && pulse > 0.55 ? '#ffe680' : COLOR.shengzhan;
            ctx.lineWidth = 2.3;
            ellipse(ctx, m.x, y, 10.5 + pulse * 2, 5.2 + pulse);
            ctx.stroke();
            if (m.zid % 2 === 0) {
                const rise = ((nowSec * 1.4 + m.zid * 0.37) % 1);
                const hy = y - 18 - rise * 9;
                ctx.globalAlpha = (0.68 + (1 - rise) * 0.28) * fadeOut;
                drawHealPlus(ctx, m.x, hy, 5.8 + pulse * 1.2, 2.3, COLOR.shengzhan, '#eafff0');
            }
        }

        // 【混】乱阵持续期：全员脚下紫电光环 ＋ 头顶旋转眩晕双弧（行军、玩家和攻城器械不吃混乱，也不画混乱）
        if (st.panic > 0 && !m.march && !m.hero && !m.siegeW) {
            const fadeOut = clamp01(st.panic / 1.0);
            ctx.globalAlpha = (0.34 + pulse * 0.22) * fadeOut;
            ctx.strokeStyle = tier.panicPaid && pulse > 0.55 ? '#ffe680' : COLOR.hunzhan;
            ctx.lineWidth = 2.3;
            ellipse(ctx, m.x, y, 10.5 + pulse * 2, 5.2 + pulse);
            ctx.stroke();
            if (m.zid % 2 === 0) {
                const ang = nowSec * 3.8 + m.zid;
                ctx.globalAlpha = (0.58 + pulse * 0.35) * fadeOut;
                ctx.strokeStyle = '#d9abff';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(m.x, y - 24, 7.2 + pulse * 2, ang, ang + Math.PI * 1.35);
                ctx.stroke();
            }
        }

        // 【敌】伏兵生力军 & 【并】倒戈兵 入场同步特效（4.2 秒内脚踏光环＋头顶星芒印记）
        if (hasUnitTags) {
            const tag = unitSkillTags.get(m);
            if (tag && nowSec < tag.untilSec) {
                const rem = clamp01((tag.untilSec - nowSec) / 1.2);
                if (tag.six === 'dizhan') {
                    ctx.globalAlpha = (0.36 + pulse * 0.22) * rem;
                    ctx.strokeStyle = tag.paid && pulse > 0.5 ? '#ffd700' : COLOR.dizhan;
                    ctx.lineWidth = 2.3;
                    ellipse(ctx, m.x, y, 10.5 + pulse * 2, 5.2 + pulse);
                    ctx.stroke();
                    if (m.zid % 2 === 0) {
                        const hy = y - 22 - pulse * 2;
                        ctx.globalAlpha = (0.62 + pulse * 0.32) * rem;
                        drawStamp(ctx, shengFlare, m.x, hy, 7.5);
                    }
                } else {
                    ctx.globalAlpha = (0.38 + pulse * 0.24) * rem;
                    ctx.strokeStyle = pulse > 0.5 ? '#ffd76a' : COLOR.bingzhan;
                    ctx.lineWidth = 2.4;
                    ellipse(ctx, m.x, y, 10.5 + pulse * 2, 5.2 + pulse);
                    ctx.stroke();
                    if (m.zid % 2 === 0) {
                        const hy = y - 23;
                        const ang = nowSec * 3.6 + m.zid;
                        ctx.globalAlpha = (0.64 + pulse * 0.32) * rem;
                        ctx.strokeStyle = '#ffd76a';
                        ctx.lineWidth = 2.2;
                        ctx.beginPath();
                        ctx.arc(m.x, hy, 7, ang, ang + Math.PI * 1.15);
                        ctx.stroke();
                        drawStamp(ctx, bingFlare, m.x, hy, 7);
                    }
                }
            }
        }
    }
    ctx.restore();
}
