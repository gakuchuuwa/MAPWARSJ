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

/** 瞬发计（【胜】增援 / 【并】倒戈）在士兵身上的持续余效时长（秒），只读渲染不参与结算 */
const UNIT_TAG_LINGER_SEC = 6.5;
interface UnitSkillTag {
    six: 'shengzhan' | 'bingzhan';
    untilSec: number;
}
const unitSkillTags = new WeakMap<WarMan, UnitSkillTag>();
const taggedCastVfx = new WeakSet<Scene13SkillVfx>();
let unitTagActiveUntilSec = 0;

function registerUnitSkillTags(v: Scene13SkillVfx, nowSec: number): void {
    if (taggedCastVfx.has(v)) return;
    taggedCastVfx.add(v);
    if (v.six !== 'shengzhan' && v.six !== 'bingzhan') return;
    const untilSec = nowSec + UNIT_TAG_LINGER_SEC;
    if (untilSec > unitTagActiveUntilSec) unitTagActiveUntilSec = untilSec;
    for (const m of v.targets) {
        unitSkillTags.set(m, { six: v.six, untilSec });
    }
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
}

function drawGroundOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = (1 - p) ** 1.35;
    const x = v.x, y = v.y - lift(v.x, v.y);
    const col = COLOR[v.six];

    // 1. 全军中心主阵大扩环（内外双环）
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = v.six === 'baizhan' ? 5.5 : 3.8;
    ctx.globalAlpha = fade * 0.78;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    const mainRx = 28 + e * (v.six === 'hunzhan' ? 135 : 160);
    const mainRy = 14 + e * 70;
    ellipse(ctx, x, y, mainRx, mainRy);
    ctx.stroke();

    // 内层副环（逆向或错相扩散，增强整体阵法层次感）
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = fade * 0.52;
    ctx.strokeStyle = v.six === 'bingzhan' ? '#ffd76a'
        : v.six === 'dizhan' ? '#a9f5e8'
            : v.six === 'gongzhan' ? '#ffd166'
                : col;
    ellipse(ctx, x, y, mainRx * 0.62, mainRy * 0.62);
    ctx.stroke();
    ctx.restore();

    // 2. 单兵／阵口地面光环（不挂 shadowBlur 保帧率，覆盖全军受影响目标）
    ctx.shadowBlur = 0;
    if (v.six === 'shengzhan') {
        // 后方各出兵口召唤阵环
        const pn = Math.min(v.points.length, 32);
        ctx.strokeStyle = '#9effdf';
        for (let i = 0; i < pn; i++) {
            const pt = v.points[i];
            const py = pt.y - lift(pt.x, pt.y);
            ctx.globalAlpha = fade * 0.78;
            ctx.lineWidth = 2.6;
            ellipse(ctx, pt.x, py, 14 + e * 26, 7 + e * 13);
            ctx.stroke();
        }
    } else if (v.six === 'baizhan') {
        // 前线每名被斩溃敌兵脚下的赤红碎裂环
        const pn = Math.min(v.points.length, 220);
        ctx.strokeStyle = COLOR.baizhan;
        for (let i = 0; i < pn; i++) {
            const pt = v.points[Math.floor(i * v.points.length / pn)];
            const py = pt.y - lift(pt.x, pt.y);
            ctx.globalAlpha = fade * 0.82;
            ctx.lineWidth = 2.2;
            ellipse(ctx, pt.x, py, 9 + e * 16, 4.5 + e * 8);
            ctx.stroke();
        }
    }

    // 其余五计在释放期间：所有受影响士兵脚下同步扩散单兵底环
    if (v.six !== 'baizhan' && v.targets.length > 0) {
        const tn = Math.min(v.targets.length, 220);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.globalAlpha = fade * 0.62;
        for (let i = 0; i < tn; i++) {
            const m = v.targets[Math.floor(i * v.targets.length / tn)];
            if (m.hp <= 0) continue;
            const my = m.y - lift(m.x, m.y);
            ellipse(ctx, m.x, my, 9 + e * 9, 4.5 + e * 4.5);
            ctx.stroke();
        }
    }
}

function drawAttack(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const cx = v.x, cy = v.y - lift(v.x, v.y) - 10;
    const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
    const px = -dy, py = dx;

    // 1. 全军中心破阵弧形刀罡（3 道向前推進的巨型赤金月牙斩波）
    ctx.save();
    ctx.translate(cx + dx * (e * 65 - 15), cy + dy * (e * 65 - 15));
    ctx.rotate(v.angle);
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ff6a24';
    ctx.shadowBlur = 14;
    for (let k = 0; k < 3; k++) {
        const r = 46 + k * 24 + e * 28;
        ctx.globalAlpha = fade * (0.85 - k * 0.2);
        ctx.strokeStyle = k === 0 ? '#ffd87a' : COLOR.gongzhan;
        ctx.lineWidth = 6.5 - k * 1.6;
        ctx.beginPath();
        ctx.arc(-18 + k * 14, 0, r, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
    }
    ctx.restore();

    // 2. 9 道疾冲锋矢火线贯穿军阵
    ctx.strokeStyle = COLOR.gongzhan;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ffb13b';
    ctx.shadowBlur = 12;
    for (let i = 0; i < 9; i++) {
        const off = (i - 4) * 16;
        const travel = e * (82 + (i % 3) * 20);
        const sx = cx + px * off + dx * (travel - 50);
        const sy = cy + py * off + dy * (travel - 50);
        ctx.globalAlpha = fade * (0.6 + (i % 2) * 0.28);
        ctx.lineWidth = 5.2 - (i % 3);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + dx * (68 - p * 20), sy + dy * (68 - p * 20));
        ctx.stroke();
        ctx.globalAlpha *= 0.78;
        ctx.strokeStyle = '#fff0bd';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.strokeStyle = COLOR.gongzhan;
    }
}

function drawReinforce(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const cx = v.x, cy = v.y - lift(v.x, v.y);

    // 1. 前线军阵中心：巨型翠青聚兵天柱＋上升号令光环（保证镜头看前线时也有壮观的主特效）
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = COLOR.shengzhan;
    ctx.shadowBlur = 16;
    const mainH = 95 + 65 * easeOut(Math.min(1, p * 2));
    const mainGrad = ctx.createLinearGradient(0, cy - mainH, 0, cy);
    mainGrad.addColorStop(0, 'rgba(160,255,225,0)');
    mainGrad.addColorStop(0.45, 'rgba(85,237,197,0.55)');
    mainGrad.addColorStop(1, 'rgba(225,255,244,0.95)');
    ctx.globalAlpha = fade * 0.9;
    ctx.strokeStyle = mainGrad;
    ctx.lineWidth = 22 - p * 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy - mainH);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // 中心上升的 3 层翠白羽翼光环
    ctx.strokeStyle = '#c4ffeb';
    for (let k = 0; k < 3; k++) {
        const rise = ((p * 1.4 + k * 0.33) % 1);
        const ry = cy - rise * 78;
        const r = 28 + (1 - rise) * 42;
        ctx.globalAlpha = fade * (1 - rise) * 0.85;
        ctx.lineWidth = 3.2 - rise * 1.5;
        ellipse(ctx, cx, ry, r, r * 0.48);
        ctx.stroke();
    }
    ctx.restore();

    // 2. 后方各出兵口：生力军降临光柱群
    const n = Math.min(v.points.length, 24);
    ctx.lineCap = 'round';
    ctx.shadowColor = COLOR.shengzhan;
    ctx.shadowBlur = 12;
    for (let i = 0; i < n; i++) {
        const pt = v.points[i];
        const y = pt.y - lift(pt.x, pt.y);
        const h = 56 + 56 * easeOut(Math.min(1, p * 2));
        const grad = ctx.createLinearGradient(0, y - h, 0, y);
        grad.addColorStop(0, 'rgba(160,255,225,0)');
        grad.addColorStop(0.55, 'rgba(85,237,197,0.6)');
        grad.addColorStop(1, 'rgba(220,255,240,0.92)');
        ctx.globalAlpha = fade * 0.88;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 8 - p * 3.5;
        ctx.beginPath();
        ctx.moveTo(pt.x, y - h * (0.35 + e * 0.65));
        ctx.lineTo(pt.x, y);
        ctx.stroke();
    }
}

function drawShield(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const x = v.x, y = v.y - lift(v.x, v.y) + 28;
    const r = 60 + e * 120;

    // 1. 全军巨型冰蓝穹顶护罩
    ctx.globalAlpha = fade * 0.20;
    ctx.fillStyle = COLOR.dizhan;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = fade * 0.92;
    ctx.strokeStyle = '#b8efff';
    ctx.lineWidth = 5.5 - p * 2;
    ctx.shadowColor = COLOR.dizhan;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.stroke();

    // 穹顶内层双护盾弧线 + 顶部十字圣辉
    ctx.globalAlpha = fade * 0.68;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, r - 14), Math.PI + 0.08, TAU - 0.08);
    ctx.stroke();
    ctx.strokeStyle = '#7ef7c8';
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, r - 28), Math.PI + 0.18, TAU - 0.18);
    ctx.stroke();

    // 穹顶上方中央巨盾徽记与回血十字星芒
    const cy = y - r * 0.62;
    ctx.strokeStyle = '#dff8ff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = fade * 0.88;
    ctx.beginPath();
    ctx.moveTo(x - 16, cy);
    ctx.lineTo(x + 16, cy);
    ctx.moveTo(x, cy - 16);
    ctx.lineTo(x, cy + 16);
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
    const e = easeOut(p);
    const fade = 1 - p;
    const x = v.x, y = v.y - lift(v.x, v.y) - 14;

    // 1. 全军重心：紫金双色阴阳策反大漩涡
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.6);
    ctx.lineCap = 'round';
    ctx.shadowColor = COLOR.bingzhan;
    ctx.shadowBlur = 14;
    for (let i = 0; i < 4; i++) {
        const r = 22 + i * 16 + e * 22;
        const a = (i % 2 ? 1 : -1) * p * 5.5 + i * 1.57;
        ctx.globalAlpha = fade * (0.92 - i * 0.12);
        ctx.strokeStyle = i % 2 ? '#ffd76a' : COLOR.bingzhan;
        ctx.lineWidth = 5.2 - i * 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, r, a, a + Math.PI * 1.25);
        ctx.stroke();
    }
    ctx.restore();

    // 2. 射向每一名倒戈士兵的招降锁链弧线＋流光节点
    const n = Math.min(v.targets.length, 96);
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;
    for (let i = 0; i < n; i++) {
        const m = v.targets[Math.floor(i * v.targets.length / n)];
        if (m.hp <= 0) continue;
        const my = m.y - lift(m.x, m.y);
        const cpx = (x + m.x) * 0.5;
        const cpy = Math.min(y, my) - 48 - (i % 3) * 12;
        ctx.globalAlpha = fade * 0.56;
        ctx.strokeStyle = i % 2 ? '#ffd777' : COLOR.bingzhan;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(cpx, cpy, m.x, my - 14);
        ctx.stroke();

        // 沿锁链飞向倒戈士兵的流光点
        const t = clamp01(p * 1.35);
        const u = 1 - t;
        const px = u * u * x + 2 * u * t * cpx + t * t * m.x;
        const py = u * u * y + 2 * u * t * cpy + t * t * (my - 14);
        ctx.globalAlpha = fade * 0.92;
        ctx.fillStyle = '#fff2b2';
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, TAU);
        ctx.fill();
    }
}

function drawDefeat(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const e = easeOut(p);
    const fade = 1 - p;
    const cx = v.x + Math.cos(v.angle) * e * 85;
    const cy = v.y - lift(v.x, v.y) + Math.sin(v.angle) * e * 85 - 15;

    // 1. 全军重心：巨型暗红雷霆十字斩裂大刀罡
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(v.angle);
    ctx.lineCap = 'round';
    for (const ang of [0, Math.PI * 0.28, -Math.PI * 0.28]) {
        ctx.save();
        ctx.rotate(ang);
        const len = ang === 0 ? 125 : 88;
        ctx.globalAlpha = fade * 0.75;
        ctx.strokeStyle = '#250d18';
        ctx.lineWidth = (ang === 0 ? 22 : 14) - p * 6;
        ctx.beginPath();
        ctx.moveTo(0, -len);
        ctx.lineTo(0, len);
        ctx.stroke();

        ctx.globalAlpha = fade * 0.96;
        ctx.strokeStyle = ang === 0 ? '#ff6870' : COLOR.baizhan;
        ctx.lineWidth = (ang === 0 ? 7 : 4.5) - p * 2;
        ctx.shadowColor = COLOR.baizhan;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, -len * 0.92);
        ctx.lineTo(0, len * 0.92);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();

    // 2. 单兵溃灭特效：每一名被斩溃的前线敌兵原地上空爆开暗红十字斩芒＋溃散黑红魂点
    const n = Math.min(v.points.length, 200);
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;
    for (let i = 0; i < n; i++) {
        const pt = v.points[Math.floor(i * v.points.length / n)];
        const py = pt.y - lift(pt.x, pt.y);
        const slashY = py - 16 - e * 6;
        const sz = 7 + (1 - p) * 5;

        // 单兵头顶暗红十字裂斩
        ctx.globalAlpha = fade * 0.9;
        ctx.strokeStyle = i % 2 === 0 ? '#ff525b' : '#ffb088';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(pt.x - sz, slashY - sz * 0.7);
        ctx.lineTo(pt.x + sz, slashY + sz * 0.7);
        ctx.moveTo(pt.x + sz, slashY - sz * 0.7);
        ctx.lineTo(pt.x - sz, slashY + sz * 0.7);
        ctx.stroke();

        // 向上升腾消散的溃散暗影与血芒
        ctx.globalAlpha = fade * 0.68;
        ctx.fillStyle = i % 3 === 0 ? '#e83b45' : '#3a2330';
        ctx.beginPath();
        ctx.arc(
            pt.x + Math.sin(i * 2.3 + p * 4) * (4 + p * 10),
            py - 14 - e * (22 + (i % 10) * 1.8),
            2.5 + (1 - p) * 3.5,
            0,
            TAU,
        );
        ctx.fill();
    }
}

function drawTargetGlow(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (v.six === 'baizhan') return; // 溃逃目标单兵斩裂与碎环已在 drawGroundOne / drawDefeat 的 v.points 中逐兵绘制
    const n = Math.min(v.targets.length, 220);
    if (n === 0) return;
    const fade = 1 - p;
    const e = easeOut(p);
    const glow = v.six === 'shengzhan' ? '#7effd4'
        : v.six === 'bingzhan' ? '#ffd76a'
            : COLOR[v.six];
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;
    const dx = Math.cos(v.angle), dy = Math.sin(v.angle);

    for (let i = 0; i < n; i++) {
        // 均匀覆盖全场受影响士兵
        const m = v.targets[Math.floor(i * v.targets.length / n)];
        if (m.hp <= 0) continue;
        const y = m.y - lift(m.x, m.y);

        // 1. 单兵脚下高亮脉冲环
        ctx.strokeStyle = glow;
        ctx.globalAlpha = fade * 0.85;
        ctx.lineWidth = 2.4;
        ellipse(ctx, m.x, y, 10 + e * 8, 5 + e * 4);
        ctx.stroke();

        // 2. 单兵头顶专属技策印记
        if (v.six === 'gongzhan') {
            // 【攻】：每名士兵头顶赤金破阵刀芒＋上扬战火锋刃
            const hy = y - 22 - e * 4;
            ctx.strokeStyle = '#ff6a24';
            ctx.globalAlpha = fade * 0.92;
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(m.x - dx * 8, hy - dy * 6 + 3);
            ctx.lineTo(m.x + dx * 11, hy + dy * 6 - 5);
            ctx.stroke();
            ctx.strokeStyle = '#ffe082';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(m.x, hy + 4);
            ctx.lineTo(m.x, hy - 7 - e * 4);
            ctx.stroke();
        } else if (v.six === 'dizhan') {
            // 【敌】：每名士兵头顶冰蓝拱盾＋翠白回血十字微光
            const hy = y - 18;
            ctx.strokeStyle = '#8ce2ff';
            ctx.globalAlpha = fade * 0.92;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(m.x, hy, 10 + e * 3, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
            ctx.strokeStyle = '#9effd6';
            ctx.lineWidth = 1.8;
            const cy = hy - 7 - e * 5;
            ctx.beginPath();
            ctx.moveTo(m.x - 3.5, cy);
            ctx.lineTo(m.x + 3.5, cy);
            ctx.moveTo(m.x, cy - 3.5);
            ctx.lineTo(m.x, cy + 3.5);
            ctx.stroke();
        } else if (v.six === 'hunzhan') {
            // 【混】：每名士兵头顶旋转紫电眩晕双弧
            const ang = p * 6 + m.zid;
            ctx.strokeStyle = '#c896ff';
            ctx.globalAlpha = fade * 0.9;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(m.x, y - 22, 7.5 + p * 3.5, ang, ang + Math.PI * 1.35);
            ctx.stroke();
        } else if (v.six === 'shengzhan') {
            // 【胜】：每名新刷出的增援士兵头顶降下接引光束＋上扬翠白双翼羽冠
            const hy = y - 22 - e * 4;
            ctx.strokeStyle = 'rgba(160,255,225,0.75)';
            ctx.globalAlpha = fade * 0.78;
            ctx.lineWidth = 3.2 * (1 - p * 0.5);
            ctx.beginPath();
            ctx.moveTo(m.x, y - 38 - (1 - e) * 18);
            ctx.lineTo(m.x, y - 6);
            ctx.stroke();

            ctx.strokeStyle = '#d4fff0';
            ctx.globalAlpha = fade * 0.95;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(m.x - 6, hy + 2);
            ctx.lineTo(m.x, hy - 4);
            ctx.lineTo(m.x + 6, hy + 2);
            ctx.stroke();
        } else if (v.six === 'bingzhan') {
            // 【并】：每名倒戈士兵头顶升起鎏金「反戈」双弧印记＋逆转金芒
            const hy = y - 23;
            const rot = p * 5 + m.zid;
            ctx.strokeStyle = '#ffd76a';
            ctx.globalAlpha = fade * 0.92;
            ctx.lineWidth = 2.3;
            ctx.beginPath();
            ctx.arc(m.x, hy, 7.5, rot, rot + Math.PI * 0.9);
            ctx.stroke();
            ctx.strokeStyle = COLOR.bingzhan;
            ctx.beginPath();
            ctx.arc(m.x, hy, 7.5, rot + Math.PI, rot + Math.PI * 1.9);
            ctx.stroke();
        }
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

    // 玩家／观众释放统一带金色认主扫光；武将自己放计没有这一层。
    if (v.playerCast) {
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
    const nowSec = nowMs * 0.001;
    ctx.save();
    for (const v of effects) {
        registerUnitSkillTags(v, nowSec);
        const p = clamp01((nowMs - v.startMs) / (v.dur * 1000));
        if (p >= 1) continue;
        ctx.save();
        if (layer === 'ground') drawGroundOne(ctx, v, p, lift);
        else drawTopOne(ctx, v, p, lift);
        ctx.restore();
    }
    ctx.restore();
}

/** 持续阶段的单兵＋全军余效：让【攻】【敌】【胜】【并】的单兵视觉饱满度与【混】完全对齐。 */
export function drawScene13SkillStatusVfx(
    ctx: CanvasRenderingContext2D,
    men: readonly WarMan[],
    states: readonly [Scene13SkillVisualState, Scene13SkillVisualState],
    lift: Lift,
    nowSec: number,
): void {
    const hasUnitTags = nowSec < unitTagActiveUntilSec;
    if (!hasUnitTags
        && !states[0].frenzy && !states[0].shield && !states[0].panic
        && !states[1].frenzy && !states[1].shield && !states[1].panic) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (const m of men) {
        if (m.hp <= 0) continue;
        const st = states[m.f];
        const y = m.y - lift(m.x, m.y);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 7 + m.zid * 0.73);

        // 1. 【攻】猛攻持续期：全员脚下赤橙战环 ＋ 头顶跃动刀火锋芒
        if (st.frenzy > 0 && !m.siegeW) {
            ctx.globalAlpha = 0.22 + pulse * 0.16;
            ctx.strokeStyle = COLOR.gongzhan;
            ctx.lineWidth = 2;
            ellipse(ctx, m.x, y, 10 + pulse * 2.5, 5 + pulse);
            ctx.stroke();
            if (m.zid % 2 === 0) {
                const sway = Math.sin(nowSec * 9 + m.zid) * 2.5;
                const hy = y - 21 - pulse * 4;
                ctx.globalAlpha = 0.42 + pulse * 0.36;
                ctx.strokeStyle = '#ff7b29';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(m.x - 4 + sway * 0.4, hy + 4);
                ctx.lineTo(m.x + 3 + sway, hy - 5);
                ctx.stroke();
                ctx.strokeStyle = '#ffe082';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(m.x + sway * 0.5, hy + 3);
                ctx.lineTo(m.x + sway * 0.8, hy - 4 - pulse * 2);
                ctx.stroke();
            }
        }

        // 2. 【敌】固己防持续期：全员脚下冰蓝护体光圈 ＋ 头顶冰蓝弧盾与微光
        if (st.shield > 0 && !m.siegeW) {
            ctx.globalAlpha = 0.20 + pulse * 0.15;
            ctx.strokeStyle = COLOR.dizhan;
            ctx.lineWidth = 2;
            ellipse(ctx, m.x, y, 10 + pulse * 2, 5 + pulse);
            ctx.stroke();
            if (m.zid % 2 === 0) {
                ctx.globalAlpha = 0.36 + pulse * 0.32;
                ctx.strokeStyle = '#9be4ff';
                ctx.lineWidth = 2.1;
                ctx.beginPath();
                ctx.arc(m.x, y - 18, 9.5 + pulse * 2, Math.PI * 1.12, Math.PI * 1.88);
                ctx.stroke();
            }
        }

        // 3. 【混】乱阵持续期：与伤害/行为结算保持同一批对象（行军、玩家和攻城器械不吃混乱，也不画混乱）
        if (st.panic > 0 && !m.march && !m.hero && !m.siegeW) {
            ctx.globalAlpha = 0.22 + pulse * 0.18;
            ctx.strokeStyle = COLOR.hunzhan;
            ctx.lineWidth = 2;
            ellipse(ctx, m.x, y, 10 + pulse * 2, 5 + pulse);
            ctx.stroke();
            if (m.zid % 2 === 0) {
                const ang = nowSec * 3.6 + m.zid;
                ctx.globalAlpha = 0.38 + pulse * 0.35;
                ctx.strokeStyle = '#c896ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(m.x, y - 24, 7 + pulse * 2, ang, ang + Math.PI * 1.35);
                ctx.stroke();
            }
        }

        // 4. 【胜】增援生力军 & 【并】倒戈兵 入场余效（6.5 秒内脚下光环＋头顶专属战羽/反戈印记）
        if (hasUnitTags) {
            const tag = unitSkillTags.get(m);
            if (tag && nowSec < tag.untilSec) {
                const rem = clamp01((tag.untilSec - nowSec) / 1.5);
                if (tag.six === 'shengzhan') {
                    ctx.globalAlpha = (0.20 + pulse * 0.16) * rem;
                    ctx.strokeStyle = COLOR.shengzhan;
                    ctx.lineWidth = 2;
                    ellipse(ctx, m.x, y, 10 + pulse * 2, 5 + pulse);
                    ctx.stroke();
                    if (m.zid % 2 === 0) {
                        const hy = y - 22 - pulse * 2;
                        ctx.globalAlpha = (0.38 + pulse * 0.32) * rem;
                        ctx.strokeStyle = '#b8ffea';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(m.x - 5, hy + 2);
                        ctx.lineTo(m.x, hy - 3);
                        ctx.lineTo(m.x + 5, hy + 2);
                        ctx.stroke();
                    }
                } else {
                    ctx.globalAlpha = (0.22 + pulse * 0.18) * rem;
                    ctx.strokeStyle = pulse > 0.5 ? '#ffd76a' : COLOR.bingzhan;
                    ctx.lineWidth = 2;
                    ellipse(ctx, m.x, y, 10 + pulse * 2, 5 + pulse);
                    ctx.stroke();
                    if (m.zid % 2 === 0) {
                        const hy = y - 23;
                        const ang = nowSec * 3.2 + m.zid;
                        ctx.globalAlpha = (0.40 + pulse * 0.32) * rem;
                        ctx.strokeStyle = '#ffd76a';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(m.x, hy, 6.5, ang, ang + Math.PI * 1.15);
                        ctx.stroke();
                    }
                }
            }
        }
    }
    ctx.restore();
}
