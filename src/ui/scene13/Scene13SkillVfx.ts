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
    paid: boolean;
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
    shengzhan: '#55edc5',
    dizhan: '#66cfff',
    hunzhan: '#b277ff',
    bingzhan: '#e5a2ff',
    baizhan: '#e83b45',
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (p: number) => 1 - (1 - p) ** 3;

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
}

function drawGroundOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = (1 - p) ** 1.4;
    const x = v.x, y = v.y - lift(v.x, v.y);
    ctx.strokeStyle = COLOR[v.six];
    ctx.lineWidth = v.six === 'baizhan' ? 5 : 3;
    ctx.globalAlpha = fade * 0.72;
    ctx.shadowColor = COLOR[v.six];
    ctx.shadowBlur = 10;
    ellipse(ctx, x, y, 24 + e * (v.six === 'hunzhan' ? 125 : 150), 12 + e * 64);
    ctx.stroke();

    if (v.six === 'shengzhan' || v.six === 'baizhan') {
        const points = v.six === 'shengzhan' ? v.points : v.points;
        const n = Math.min(points.length, 48);
        for (let i = 0; i < n; i++) {
            const pt = points[i];
            const py = pt.y - lift(pt.x, pt.y);
            ctx.globalAlpha = fade * 0.72;
            ctx.lineWidth = 2;
            ellipse(ctx, pt.x, py, 8 + e * 18, 4 + e * 9);
            ctx.stroke();
        }
    }
}

function drawAttack(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const cx = v.x, cy = v.y - lift(v.x, v.y) - 10;
    const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
    const px = -dy, py = dx;
    ctx.strokeStyle = COLOR.gongzhan;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ffb13b';
    ctx.shadowBlur = 12;
    for (let i = 0; i < 7; i++) {
        const off = (i - 3) * 18;
        const travel = e * (75 + (i % 3) * 18);
        const sx = cx + px * off + dx * (travel - 45);
        const sy = cy + py * off + dy * (travel - 45);
        ctx.globalAlpha = (1 - p) * (0.55 + (i % 2) * 0.25);
        ctx.lineWidth = 5 - (i % 3);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + dx * (62 - p * 20), sy + dy * (62 - p * 20));
        ctx.stroke();
        ctx.globalAlpha *= 0.75;
        ctx.strokeStyle = '#fff0bd';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.strokeStyle = COLOR.gongzhan;
    }
}

function drawReinforce(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const n = Math.min(v.points.length, 24);
    ctx.lineCap = 'round';
    ctx.shadowColor = COLOR.shengzhan;
    ctx.shadowBlur = 12;
    for (let i = 0; i < n; i++) {
        const pt = v.points[i];
        const y = pt.y - lift(pt.x, pt.y);
        const h = 48 + 52 * easeOut(Math.min(1, p * 2));
        const grad = ctx.createLinearGradient(0, y - h, 0, y);
        grad.addColorStop(0, 'rgba(160,255,225,0)');
        grad.addColorStop(0.55, 'rgba(85,237,197,0.55)');
        grad.addColorStop(1, 'rgba(220,255,240,0.9)');
        ctx.globalAlpha = (1 - p) * 0.85;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 7 - p * 3;
        ctx.beginPath();
        ctx.moveTo(pt.x, y - h * (0.4 + p * 0.6));
        ctx.lineTo(pt.x, y);
        ctx.stroke();
    }
}

function drawShield(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const x = v.x, y = v.y - lift(v.x, v.y) + 28;
    const r = 55 + e * 115;
    ctx.globalAlpha = (1 - p) * 0.16;
    ctx.fillStyle = COLOR.dizhan;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = (1 - p) * 0.9;
    ctx.strokeStyle = '#a9e9ff';
    ctx.lineWidth = 5 - p * 2;
    ctx.shadowColor = COLOR.dizhan;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.stroke();
    ctx.globalAlpha *= 0.65;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, r - 13), Math.PI + 0.08, TAU - 0.08);
    ctx.stroke();
}

function drawPanic(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const x = v.x, y = v.y - lift(v.x, v.y) - 12;
    const e = easeOut(p);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.62);
    ctx.strokeStyle = COLOR.hunzhan;
    ctx.shadowColor = '#d7b4ff';
    ctx.shadowBlur = 13;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
        const r = 25 + i * 18 + e * 24;
        const a = (i % 2 ? -1 : 1) * p * 5 + i * 1.17;
        ctx.globalAlpha = (1 - p) * (0.9 - i * 0.1);
        ctx.lineWidth = 6 - i * 0.65;
        ctx.beginPath();
        ctx.arc(0, 0, r, a, a + Math.PI * 1.18);
        ctx.stroke();
    }
    ctx.restore();
}

function drawConvert(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const x = v.x, y = v.y - lift(v.x, v.y) - 12;
    const n = Math.min(v.targets.length, 40);
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
        const m = v.targets[i];
        if (m.hp <= 0) continue;
        const my = m.y - lift(m.x, m.y);
        ctx.globalAlpha = (1 - p) * 0.48;
        ctx.strokeStyle = i % 2 ? '#ffd777' : COLOR.bingzhan;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo((x + m.x) / 2, Math.min(y, my) - 45, m.x, my - 12);
        ctx.stroke();
        ctx.globalAlpha = (1 - p) * 0.9;
        ctx.lineWidth = 3;
        ellipse(ctx, m.x, my, 10 + p * 10, 5 + p * 5);
        ctx.stroke();
    }
}

function drawDefeat(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const cx = v.x + Math.cos(v.angle) * e * 105;
    const cy = v.y - lift(v.x, v.y) + Math.sin(v.angle) * e * 105 - 15;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(v.angle);
    ctx.lineCap = 'round';
    ctx.globalAlpha = (1 - p) * 0.72;
    ctx.strokeStyle = '#250d18';
    ctx.lineWidth = 22 - p * 8;
    ctx.beginPath();
    ctx.moveTo(0, -115);
    ctx.lineTo(0, 115);
    ctx.stroke();
    ctx.globalAlpha = (1 - p) * 0.95;
    ctx.strokeStyle = COLOR.baizhan;
    ctx.lineWidth = 6 - p * 2;
    ctx.shadowColor = COLOR.baizhan;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, -105);
    ctx.lineTo(0, 105);
    ctx.stroke();
    ctx.restore();

    const n = Math.min(v.points.length, 48);
    ctx.fillStyle = '#514854';
    for (let i = 0; i < n; i++) {
        const pt = v.points[i];
        const py = pt.y - lift(pt.x, pt.y);
        ctx.globalAlpha = (1 - p) * 0.55;
        ctx.beginPath();
        ctx.arc(pt.x + Math.sin(i * 2.3) * p * 12, py - 15 - p * (20 + i % 12), 3 + p * 6, 0, TAU);
        ctx.fill();
    }
}

function drawTargetGlow(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (v.six !== 'shengzhan' && v.six !== 'bingzhan') return;
    const n = Math.min(v.targets.length, 48);
    ctx.strokeStyle = v.six === 'shengzhan' ? '#c4ffeb' : '#ffe19a';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < n; i++) {
        const m = v.targets[i];
        if (m.hp <= 0) continue;
        const y = m.y - lift(m.x, m.y);
        ctx.globalAlpha = (1 - p) * 0.85;
        ellipse(ctx, m.x, y, 10 + p * 8, 5 + p * 4);
        ctx.stroke();
    }
}

function drawTopOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (v.six === 'gongzhan') drawAttack(ctx, v, p, lift);
    else if (v.six === 'shengzhan') drawReinforce(ctx, v, p, lift);
    else if (v.six === 'dizhan') drawShield(ctx, v, p, lift);
    else if (v.six === 'hunzhan') drawPanic(ctx, v, p, lift);
    else if (v.six === 'bingzhan') drawConvert(ctx, v, p, lift);
    else drawDefeat(ctx, v, p, lift);
    drawTargetGlow(ctx, v, p, lift);

    // 付费计的金色认主扫光：军令计与武将计没有这一层。
    if (v.paid) {
        const e = easeOut(p);
        const y = v.y - lift(v.x, v.y);
        ctx.globalAlpha = (1 - p) * 0.95;
        ctx.strokeStyle = '#ffd76a';
        ctx.shadowColor = '#fff0a8';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3.5;
        ellipse(ctx, v.x, y, 38 + e * 145, 19 + e * 70);
        ctx.stroke();
    }
}

export function drawScene13SkillCastVfx(
    ctx: CanvasRenderingContext2D,
    effects: readonly Scene13SkillVfx[],
    layer: SkillVfxLayer,
    lift: Lift,
    nowMs: number,
): void {
    if (!effects.length) return;
    ctx.save();
    for (const v of effects) {
        const p = clamp01((nowMs - v.startMs) / (v.dur * 1000));
        if (p >= 1) continue;
        ctx.save();
        if (layer === 'ground') drawGroundOne(ctx, v, p, lift);
        else drawTopOne(ctx, v, p, lift);
        ctx.restore();
    }
    ctx.restore();
}

/** 持续阶段的轻量余效：只读现有技能倒计时，不另造一套状态。 */
export function drawScene13SkillStatusVfx(
    ctx: CanvasRenderingContext2D,
    men: readonly WarMan[],
    states: readonly [Scene13SkillVisualState, Scene13SkillVisualState],
    lift: Lift,
    nowSec: number,
): void {
    if (!states[0].frenzy && !states[0].shield && !states[0].panic
        && !states[1].frenzy && !states[1].shield && !states[1].panic) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (const m of men) {
        if (m.hp <= 0) continue;
        const st = states[m.f];
        const y = m.y - lift(m.x, m.y);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 7 + m.zid * 0.73);
        if (st.frenzy > 0) {
            ctx.globalAlpha = 0.10 + pulse * 0.08;
            ctx.strokeStyle = COLOR.gongzhan;
            ctx.lineWidth = 2;
            ellipse(ctx, m.x, y, 10 + pulse * 3, 5 + pulse);
            ctx.stroke();
            if (m.zid % 4 === 0) {
                ctx.globalAlpha = 0.28 + pulse * 0.35;
                ctx.fillStyle = '#ffc15a';
                ctx.beginPath();
                ctx.arc(m.x + Math.sin(m.zid) * 5, y - 17 - pulse * 10, 1.8 + pulse, 0, TAU);
                ctx.fill();
            }
        }
        if (st.shield > 0 && m.zid % 3 === 0) {
            ctx.globalAlpha = 0.18 + pulse * 0.20;
            ctx.strokeStyle = '#9be4ff';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(m.x, y - 17, 11 + pulse * 2, Math.PI * 1.12, Math.PI * 1.88);
            ctx.stroke();
        }
        // 与伤害/行为结算保持同一批对象：行军、玩家和攻城器械不吃混乱，也不画混乱。
        if (st.panic > 0 && !m.march && !m.hero && !m.siegeW) {
            ctx.globalAlpha = 0.20 + pulse * 0.18;
            ctx.strokeStyle = COLOR.hunzhan;
            ctx.lineWidth = 2;
            ellipse(ctx, m.x, y, 10 + pulse * 2, 5 + pulse);
            ctx.stroke();
            if (m.zid % 3 === 0) {
                ctx.globalAlpha = 0.35 + pulse * 0.35;
                ctx.beginPath();
                ctx.arc(m.x, y - 24, 7 + pulse * 2, nowSec * 3 + m.zid, nowSec * 3 + m.zid + Math.PI * 1.35);
                ctx.stroke();
            }
        }
    }
    ctx.restore();
}
