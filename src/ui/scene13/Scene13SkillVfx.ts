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
    /** 直播观众付费打赏释放（true = 帝王鎏金排面强化） */
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
    gongzhan: '#f97316', // 赤金战火
    dizhan: '#0ea5e9',   // 奇兵青旌
    shengzhan: '#22c55e', // 固防翠玉/金盾
    hunzhan: '#a855f7',  // 乱阵迷雾
    bingzhan: '#3b82f6', // 倒戈易帜
    baizhan: '#ef4444',  // 箭雨血刃
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (p: number) => 1 - (1 - p) ** 3;
/** 三段式饱满保持曲线：前 70% 时间保持满清晰度（1.0），最后 30% 平滑淡出，确保镜头切过去能看清完整大场面 */
const holdFade = (p: number) => (p < 0.70 ? 1.0 : clamp01((1 - p) / 0.30));

// ── 1. 离屏预烘焙冷兵器剪影图标池（Offscreen Silhouette Icon Atlas：高对比加粗描边，彻底替代魔法十字星芒） ──
type IconKind = 'swords' | 'shield' | 'banner' | 'dizzy' | 'defect' | 'slashKill' | 'dustPuff';
const iconStampCache = new Map<string, HTMLCanvasElement>();

function getColdWeaponIcon(kind: IconKind, paid = false): HTMLCanvasElement {
    const key = `${kind}_${paid ? 1 : 0}`;
    let cv = iconStampCache.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    const g = cv.getContext('2d')!;
    g.lineCap = 'round';
    g.lineJoin = 'round';

    if (kind === 'swords') {
        // 【攻】提升攻击：单把昂扬宽刃战刀 + 赤金向上提升双箭纹（刀 + ▲▲，代表加攻振威，非交叉双剑交战）
        g.save();
        g.translate(32, 32);

        // 1. 左侧单把威猛古代宽刃战刀（斜向右上昂扬，宽刃厚背 + 吞口刀镡 + 环首柄）
        g.save();
        g.translate(-5, 3);
        g.rotate(Math.PI * 0.14);

        // 外廓深色硬衬底
        g.fillStyle = '#140802';
        g.beginPath();
        g.moveTo(-6, 13);
        g.lineTo(-6, -15);
        g.quadraticCurveTo(-5, -28, 3, -31);
        g.quadraticCurveTo(9, -18, 7, 13);
        g.closePath();
        g.fill();

        // 刀身金属赤金渐变（左侧刀背赤橙、右侧弧形宽刀刃雪白寒光）
        const bladeGrad = g.createLinearGradient(-5, 0, 7, 0);
        bladeGrad.addColorStop(0, '#ea580c');
        bladeGrad.addColorStop(0.45, paid ? '#fef08a' : '#fed7aa');
        bladeGrad.addColorStop(1, '#ffffff');
        g.fillStyle = bladeGrad;
        g.beginPath();
        g.moveTo(-3.8, 10);
        g.lineTo(-3.8, -14);
        g.quadraticCurveTo(-3, -25, 2.5, -28);
        g.quadraticCurveTo(7.2, -16, 4.8, 10);
        g.closePath();
        g.fill();

        // 刀身血槽亮线
        g.strokeStyle = '#fff7ed';
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(-1, 7);
        g.lineTo(-0.5, -20);
        g.stroke();

        // 赤金刀镡护手与刀柄
        g.strokeStyle = '#140802';
        g.lineWidth = 7.0;
        g.beginPath();
        g.moveTo(-10, 10);
        g.lineTo(10, 10);
        g.stroke();
        g.strokeStyle = '#facc15';
        g.lineWidth = 3.8;
        g.beginPath();
        g.moveTo(-8.5, 10);
        g.lineTo(8.5, 10);
        g.stroke();

        g.fillStyle = '#140802';
        g.fillRect(-4.2, 11, 8.4, 12);
        g.fillStyle = '#dc2626';
        g.fillRect(-2.6, 12, 5.2, 10);
        g.restore();

        // 2. 右上侧两道醒目的「向上提升箭纹（▲▲）」直观表达「提升攻击」
        const drawUpChevron = (cx: number, cy: number, w: number, h: number, col: string) => {
            g.strokeStyle = '#140802';
            g.lineWidth = 6.4;
            g.beginPath();
            g.moveTo(cx - w, cy + h);
            g.lineTo(cx, cy);
            g.lineTo(cx + w, cy + h);
            g.stroke();

            g.strokeStyle = col;
            g.lineWidth = 3.6;
            g.beginPath();
            g.moveTo(cx - w, cy + h);
            g.lineTo(cx, cy);
            g.lineTo(cx + w, cy + h);
            g.stroke();
        };
        drawUpChevron(14, -19, 8.5, 8.5, '#fef08a');
        drawUpChevron(14, -6, 8.5, 8.5, paid ? '#fde047' : '#fb923c');

        g.restore();
    } else if (kind === 'shield') {
        // 【胜】重装黄金/青铜塔盾（饱满大盾面 + 金属高光 + 十字盾脊）
        g.save();
        g.translate(32, 32);
        const buildShieldPath = (s: number) => {
            g.beginPath();
            g.moveTo(0, -25 * s);
            g.lineTo(21 * s, -17 * s);
            g.quadraticCurveTo(21 * s, 7 * s, 0, 26 * s);
            g.quadraticCurveTo(-21 * s, 7 * s, -21 * s, -17 * s);
            g.closePath();
        };
        // 深色铁边
        g.fillStyle = '#0f170d';
        buildShieldPath(1.12);
        g.fill();
        // 外框金铜包边
        const rimGrad = g.createLinearGradient(-20, -25, 20, 25);
        rimGrad.addColorStop(0, '#fef08a');
        rimGrad.addColorStop(0.5, '#eab308');
        rimGrad.addColorStop(1, '#854d0e');
        g.fillStyle = rimGrad;
        buildShieldPath(1.0);
        g.fill();
        // 盾面内芯（翡翠绿金/帝王金纹理）
        const innerGrad = g.createLinearGradient(0, -18, 0, 20);
        innerGrad.addColorStop(0, paid ? '#fef9c3' : '#4ade80');
        innerGrad.addColorStop(0.55, paid ? '#ca8a04' : '#16a34a');
        innerGrad.addColorStop(1, '#064e3b');
        g.fillStyle = innerGrad;
        buildShieldPath(0.78);
        g.fill();
        // 中央竖向金属盾脊与横加强筋
        g.strokeStyle = '#fef9c3';
        g.lineWidth = 3.8;
        g.beginPath();
        g.moveTo(0, -18);
        g.lineTo(0, 19);
        g.moveTo(-13, -3);
        g.lineTo(13, -3);
        g.stroke();
        g.restore();
    } else if (kind === 'banner') {
        // 【敌】奇兵三角牙旗/令旗（加粗长矛旗杆 + 醒目迎风三角战旗）
        g.save();
        g.translate(32, 32);
        // 旗面外衬黑边
        g.fillStyle = '#06131c';
        g.beginPath();
        g.moveTo(-12, -22);
        g.lineTo(27, -9);
        g.lineTo(-12, 7);
        g.closePath();
        g.fill();
        // 旗面青金渐变
        const flagGrad = g.createLinearGradient(-11, -20, 24, -4);
        flagGrad.addColorStop(0, paid ? '#fef08a' : '#7dd3fc');
        flagGrad.addColorStop(0.55, paid ? '#eab308' : '#0284c7');
        flagGrad.addColorStop(1, '#0369a1');
        g.fillStyle = flagGrad;
        g.beginPath();
        g.moveTo(-10, -19);
        g.lineTo(23, -9);
        g.lineTo(-10, 4);
        g.closePath();
        g.fill();
        // 旗面亮边
        g.strokeStyle = '#f0f9ff';
        g.lineWidth = 2.2;
        g.stroke();
        // 旗杆与矛尖
        g.strokeStyle = '#06131c';
        g.lineWidth = 6.8;
        g.beginPath();
        g.moveTo(-10, -24);
        g.lineTo(-10, 25);
        g.stroke();
        g.strokeStyle = '#f8fafc';
        g.lineWidth = 3.4;
        g.beginPath();
        g.moveTo(-10, -24);
        g.lineTo(-10, 25);
        g.stroke();
        // 金色矛头
        g.fillStyle = '#facc15';
        g.beginPath();
        g.moveTo(-10, -30);
        g.lineTo(-15, -19);
        g.lineTo(-5, -19);
        g.closePath();
        g.fill();
        g.restore();
    } else if (kind === 'dizzy') {
        // 【混】乱阵眩晕双螺旋环（加粗高对比涡卷，一目了然）
        g.save();
        g.translate(32, 32);
        g.scale(1, 0.68);
        g.strokeStyle = '#19062e';
        g.lineWidth = 8.0;
        g.beginPath();
        g.arc(0, 0, 22, 0.15, Math.PI * 1.6);
        g.stroke();
        g.beginPath();
        g.arc(0, 0, 12, Math.PI * 0.85, Math.PI * 2.4);
        g.stroke();

        g.strokeStyle = paid ? '#fde047' : '#c084fc';
        g.lineWidth = 4.5;
        g.beginPath();
        g.arc(0, 0, 22, 0.15, Math.PI * 1.6);
        g.stroke();
        g.strokeStyle = '#faf5ff';
        g.lineWidth = 3.6;
        g.beginPath();
        g.arc(0, 0, 12, Math.PI * 0.85, Math.PI * 2.4);
        g.stroke();
        g.restore();
    } else if (kind === 'defect') {
        // 【并】倒戈易帜双箭图标（加粗金蓝交错回旋箭头 ⇄，代表阵前反水易帜）
        g.save();
        g.translate(32, 32);
        const drawTurnArrow = (rot: number, col: string) => {
            g.save();
            g.rotate(rot);
            g.strokeStyle = '#081221';
            g.lineWidth = 7.8;
            g.beginPath();
            g.arc(0, 0, 16, -Math.PI * 0.78, Math.PI * 0.18);
            g.stroke();
            g.strokeStyle = col;
            g.lineWidth = 4.4;
            g.beginPath();
            g.arc(0, 0, 16, -Math.PI * 0.78, Math.PI * 0.18);
            g.stroke();
            // 锋利大箭簇
            g.fillStyle = '#081221';
            g.beginPath();
            g.moveTo(16, 12);
            g.lineTo(6, 0);
            g.lineTo(24, -2);
            g.closePath();
            g.fill();
            g.fillStyle = col;
            g.beginPath();
            g.moveTo(16, 9.5);
            g.lineTo(8.5, 1);
            g.lineTo(21.5, -0.5);
            g.closePath();
            g.fill();
            g.restore();
        };
        drawTurnArrow(0, '#fbbf24');
        drawTurnArrow(Math.PI, '#60a5fa');
        g.restore();
    } else if (kind === 'slashKill') {
        // 【败】寒光血刃交叉斩痕（✕ 破甲大斩击）
        g.save();
        g.translate(32, 32);
        const drawSlash = (ang: number) => {
            g.save();
            g.rotate(ang);
            g.fillStyle = '#240303';
            g.beginPath();
            g.moveTo(-28, 0);
            g.quadraticCurveTo(0, -7.2, 28, 0);
            g.quadraticCurveTo(0, 7.2, -28, 0);
            g.closePath();
            g.fill();
            g.fillStyle = '#ef4444';
            g.beginPath();
            g.moveTo(-26, 0);
            g.quadraticCurveTo(0, -5.0, 26, 0);
            g.quadraticCurveTo(0, 5.0, -26, 0);
            g.closePath();
            g.fill();
            g.fillStyle = '#fef2f2';
            g.beginPath();
            g.moveTo(-19, 0);
            g.quadraticCurveTo(0, -2.2, 19, 0);
            g.quadraticCurveTo(0, 2.2, -19, 0);
            g.closePath();
            g.fill();
            g.restore();
        };
        drawSlash(Math.PI * 0.23);
        drawSlash(-Math.PI * 0.23);
        g.restore();
    } else {
        // 柔和沙尘烟团印章（物理尘土替代魔法光球）
        const grad = g.createRadialGradient(32, 32, 2, 32, 32, 29);
        grad.addColorStop(0, 'rgba(228, 212, 184, 0.85)');
        grad.addColorStop(0.55, 'rgba(182, 162, 128, 0.48)');
        grad.addColorStop(1, 'rgba(120, 102, 76, 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
    }

    iconStampCache.set(key, cv);
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

// ── 2. 冷兵器几何图元：刀锋弧线、实体羽箭、重装铁盾、冲锋箭纹、回血十字 ──
/** 绘制两头尖锐如刃、腰部饱满的金属刀气弧（外层赤铁＋内芯白刃） */
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
    buildPath(0.44);
    ctx.fill();
}

/** 绘制两头尖锐、中间宽厚的直线破风刀芒/枪芒 */
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

    const cw = maxHalfWidth * 0.45;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.moveTo(x1 + dx * 0.08, y1 + dy * 0.08);
    ctx.quadraticCurveTo(mx + nx * cw, my + ny * cw, x2 - dx * 0.08, y2 - dy * 0.08);
    ctx.quadraticCurveTo(mx - nx * cw, my - ny * cw, x1 + dx * 0.08, y1 + dy * 0.08);
    ctx.closePath();
    ctx.fill();
}

/** 绘制真实冷兵器羽箭（木质/铁质箭杆 + 三角破甲铁簇 + 尾羽），从 (tailX, tailY) 射向 (tipX, tipY) */
function drawWarArrow(
    ctx: CanvasRenderingContext2D,
    tailX: number,
    tailY: number,
    tipX: number,
    tipY: number,
    scale = 1,
    isFireOrGold = false,
): void {
    const dx = tipX - tailX;
    const dy = tipY - tailY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    // 破空风线（尾后醒目气流线）
    ctx.strokeStyle = isFireOrGold ? 'rgba(255, 215, 110, 0.72)' : 'rgba(241, 245, 249, 0.65)';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX - ux * 22 * scale, tailY - uy * 22 * scale);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // 箭杆（深褐木杆衬底 + 亮木/金芯）
    ctx.strokeStyle = '#18100a';
    ctx.lineWidth = 4.0 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX - ux * 4 * scale, tipY - uy * 4 * scale);
    ctx.stroke();

    ctx.strokeStyle = isFireOrGold ? '#fbbf24' : '#e2d2b5';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX - ux * 4 * scale, tipY - uy * 4 * scale);
    ctx.stroke();

    // 尾羽（双侧醒目雕翎）
    const fLen = 9 * scale;
    const fW = 4.2 * scale;
    ctx.fillStyle = isFireOrGold ? '#ef4444' : '#f8fafc';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.0 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tailX - ux * fLen + nx * fW, tailY - uy * fLen + ny * fW);
    ctx.lineTo(tailX + ux * 5 * scale, tailY + uy * 5 * scale);
    ctx.lineTo(tailX - ux * fLen - nx * fW, tailY - uy * fLen - ny * fW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 铁质三棱箭簇（寒铁白刃 / 火箭赤金簇）
    const headLen = 10.5 * scale;
    const headW = 4.5 * scale;
    ctx.fillStyle = isFireOrGold ? '#fef08a' : '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - ux * headLen + nx * headW, tipY - uy * headLen + ny * headW);
    ctx.lineTo(tipX - ux * (headLen * 0.72), tipY - uy * (headLen * 0.72));
    ctx.lineTo(tipX - ux * headLen - nx * headW, tipY - uy * headLen - ny * headW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
}

/** 绘制高对比翠绿十字 `+` 号（深色外衬＋翠绿外层＋内芯白绿） */
function drawHealPlus(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    arm: number,
    thick: number,
    outerColor = '#22c55e',
    coreColor = '#ecfdf5',
): void {
    const drawCross = (a: number, t: number) => {
        const h = t * 0.5;
        ctx.fillRect(cx - a, cy - h, a * 2, t);
        ctx.fillRect(cx - h, cy - a, t, a * 2);
    };
    ctx.fillStyle = '#052e16';
    drawCross(arm + 1.6, thick + 2.8);
    ctx.fillStyle = outerColor;
    drawCross(arm, thick);
    ctx.fillStyle = coreColor;
    drawCross(arm * 0.72, thick * 0.46);
}

// ── 3. 状态追踪：让持续类与瞬发类的「全军大阵＋单兵特效」时间严格一致，对齐 4.5 秒镜头 ──
const INSTANT_SYNC_SEC = 4.5;
interface UnitSkillTag {
    six: 'dizhan' | 'bingzhan';
    untilSec: number;
    paid: boolean;
    playerCast: boolean;
}
const unitSkillTags = new WeakMap<WarMan, UnitSkillTag>();
const taggedCastVfx = new WeakSet<Scene13SkillVfx>();
let unitTagActiveUntilSec = 0;

/** 记录双方当前生效的持续技是否由观众/打赏触发，以及胜战计刚释放时的回血飘字窗口 */
const sideCastTier: [
    { frenzyPaid: boolean; frenzyPlayer: boolean; shieldPaid: boolean; shieldPlayer: boolean; shieldCastSec: number; panicPaid: boolean; panicPlayer: boolean },
    { frenzyPaid: boolean; frenzyPlayer: boolean; shieldPaid: boolean; shieldPlayer: boolean; shieldCastSec: number; panicPaid: boolean; panicPlayer: boolean },
] = [
    { frenzyPaid: false, frenzyPlayer: false, shieldPaid: false, shieldPlayer: false, shieldCastSec: 0, panicPaid: false, panicPlayer: false },
    { frenzyPaid: false, frenzyPlayer: false, shieldPaid: false, shieldPlayer: false, shieldCastSec: 0, panicPaid: false, panicPlayer: false },
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
        sideCastTier[v.side].shieldCastSec = nowSec;
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
    return v.paid ? 1.38 : v.playerCast ? 1.18 : 1.05;
}

// ── 4. 释放瞬间地面层（Ground Layer：大幅强化战鼓波纹、冲锋指向箭纹、盾墙扬尘、箭雨落点） ──
function drawGroundOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.45);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y);
    const col = COLOR[v.six];
    const dust = getColdWeaponIcon('dustPuff');

    ctx.save();

    // 1. 地面踏阵扬尘 + 巨型战鼓双层扩散波纹（范围加大 35%，粗边高对比）
    const baseRx = (48 + e * (v.six === 'hunzhan' ? 185 : 220)) * scale;
    const baseRy = baseRx * 0.48;

    if (v.six === 'gongzhan' || v.six === 'shengzhan' || v.six === 'dizhan') {
        for (let k = 0; k < 10; k++) {
            const ang = k * (TAU / 10) + e * 0.3;
            const dx = x + Math.cos(ang) * baseRx * 0.78;
            const dy = y + Math.sin(ang) * baseRy * 0.78;
            ctx.globalAlpha = fade * 0.55;
            drawStamp(ctx, dust, dx, dy, 38 * scale, 22 * scale);
        }
    }

    // 战鼓主阵外圈深色衬环 + 高亮主环 + 内层副环
    ctx.strokeStyle = '#140f0a';
    ctx.lineWidth = (v.six === 'baizhan' ? 8.5 : 7.0) * (v.paid ? 1.15 : 1);
    ctx.globalAlpha = fade * 0.65;
    ellipse(ctx, x, y, baseRx, baseRy);
    ctx.stroke();

    ctx.strokeStyle = col;
    ctx.lineWidth = (v.six === 'baizhan' ? 5.5 : 4.5) * (v.paid ? 1.15 : 1);
    ctx.globalAlpha = fade * 0.94;
    ellipse(ctx, x, y, baseRx, baseRy);
    ctx.stroke();

    ctx.strokeStyle = v.paid ? '#fef08a' : '#ffffff';
    ctx.lineWidth = 2.6 * scale;
    ctx.globalAlpha = fade * 0.72;
    ellipse(ctx, x, y, baseRx * 0.68, baseRy * 0.68);
    ctx.stroke();

    // 攻战计专属地面：沿冲锋方向的 4 排巨型赤金突击指向箭纹（`>>>>` Marching Chevrons）
    if (v.six === 'gongzhan') {
        const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
        const px = -dy, py = dx;
        for (let k = -1; k <= 2; k++) {
            const advance = (e * 115 + k * 38) * scale;
            const cx = x + dx * advance;
            const cy = y + dy * advance;
            const wing = 48 * scale;
            const back = 24 * scale;
            ctx.globalAlpha = fade * (0.92 - Math.abs(k - 0.5) * 0.16);
            ctx.strokeStyle = '#1c0d04';
            ctx.lineWidth = 7.5 * scale;
            ctx.beginPath();
            ctx.moveTo(cx - dx * back + px * wing, cy - dy * back + py * wing * 0.55);
            ctx.lineTo(cx + dx * 14, cy + dy * 14);
            ctx.lineTo(cx - dx * back - px * wing, cy - dy * back - py * wing * 0.55);
            ctx.stroke();

            ctx.strokeStyle = v.paid ? '#fde047' : '#fb923c';
            ctx.lineWidth = 4.4 * scale;
            ctx.stroke();
        }
    }

    // 打赏付费专属：地面帝王鎏金外扩战鼓环
    if (v.paid) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4.5;
        ctx.globalAlpha = fade * 0.94;
        ellipse(ctx, x, y, baseRx * 1.14, baseRy * 1.14);
        ctx.stroke();
    }

    // 2. 敌战计（伏兵出兵口地面滚滚黄尘）与 败战计（箭雨攒射落点与血圈）
    if (v.six === 'dizhan') {
        const pn = Math.min(v.points.length, 32);
        for (let i = 0; i < pn; i++) {
            const pt = v.points[i];
            const py = pt.y - lift(pt.x, pt.y);
            ctx.globalAlpha = fade * 0.82;
            drawStamp(ctx, dust, pt.x, py, (32 + e * 32) * scale, (18 + e * 18) * scale);
            ctx.strokeStyle = '#082f49';
            ctx.lineWidth = 5.5;
            ellipse(ctx, pt.x, py, (20 + e * 34) * scale, (10 + e * 17) * scale);
            ctx.stroke();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3.4;
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
            const delay = ((i * 0.618034) % 1) * 0.35;
            const localP = clamp01((p - delay) / (1 - delay));
            const fallFrac = 0.28;
            if (localP < fallFrac) {
                const fp = localP / fallFrac;
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)';
                ctx.globalAlpha = fade * (0.35 + fp * 0.5);
                ctx.lineWidth = 2.4;
                ellipse(ctx, pt.x, py, (20 - fp * 7) * scale, (10 - fp * 3.5) * scale);
                ctx.stroke();
            } else {
                const ip = (localP - fallFrac) / (1 - fallFrac);
                const ie = easeOut(Math.min(1, ip * 1.8));
                ctx.globalAlpha = fade * 0.68;
                drawStamp(ctx, dust, pt.x, py, (20 + ie * 14) * scale, (11 + ie * 7) * scale);
                ctx.strokeStyle = '#991b1b';
                ctx.globalAlpha = fade * 0.92;
                ctx.lineWidth = 3.4 * (1 - ip * 0.35);
                ellipse(ctx, pt.x, py, 9 + ie * 20, 4.5 + ie * 10);
                ctx.stroke();
            }
        }
    }
    ctx.restore();
}

// ── 5. 释放瞬间上层大场面（Top Layer：尺寸与冲击力全面加大，前 70% 时间保持满清晰度） ──

/** 【攻战计·振己威】三道巨型寒铁赤金刀罡破阵 + 12 道破风枪芒 + 阵心巨型交叉双刀印 */
function drawAttack(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.35);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y) - 14;
    const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
    const px = -dy, py = dx;
    const swordsIcon = getColdWeaponIcon('swords', v.paid);

    ctx.save();

    // 1. 3 道巨型锥形破阵刀罡（半径与厚度放大 1.35×）
    ctx.save();
    ctx.translate(cx + dx * (e * 105 * scale - 20), cy + dy * (e * 105 * scale - 20));
    ctx.rotate(v.angle);
    for (let k = 0; k < 3; k++) {
        const r = (68 + k * 34 + e * 44) * scale;
        const thick = (22 - k * 4.5) * scale * (1 - p * 0.25);
        ctx.globalAlpha = fade * (0.96 - k * 0.18);
        drawTaperedCrescent(
            ctx,
            -26 + k * 18,
            0,
            r,
            thick,
            Math.PI * (0.94 - k * 0.07),
            k === 0 && v.paid ? '#eab308' : COLOR.gongzhan,
            '#fffbeb',
        );
    }
    ctx.restore();

    // 2. 12 道长距破风突击枪芒/疾风白浪贯穿军阵
    for (let i = 0; i < 12; i++) {
        const off = (i - 5.5) * 20 * scale;
        const waveP = (p * 1.6 + (i % 3) * 0.22) % 1;
        const travel = easeOut(waveP) * (125 + (i % 3) * 32) * scale;
        const sx = cx + px * off + dx * (travel - 70);
        const sy = cy + py * off + dy * (travel - 70);
        const len = (96 - waveP * 24) * scale;
        const ex = sx + dx * len;
        const ey = sy + dy * len;
        ctx.globalAlpha = fade * (1 - waveP * 0.45) * 0.92;
        drawTaperedSlash(
            ctx,
            sx,
            sy,
            ex,
            ey,
            (5.6 - (i % 3) * 0.8) * scale,
            i % 2 === 0 ? COLOR.gongzhan : '#e2e8f0',
            '#ffffff',
        );
    }

    // 3. 阵心上方浮现巨型「交叉双战刀」主将战令印记（直径 84px）
    const pulse = 1 + 0.08 * Math.sin(p * Math.PI * 6);
    const iconY = cy - 26 - e * 16 * scale;
    ctx.globalAlpha = fade * 0.98;
    drawStamp(ctx, swordsIcon, cx, iconY, 42 * scale * pulse);
    ctx.restore();
}

/** 【敌战计·伏兵偷袭】中军巨型帅旗号令 + 出兵口浓厚黄尘、5 道冲天枪芒与大号青色三角牙旗 */
function drawReinforce(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y);
    const bannerIcon = getColdWeaponIcon('banner', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    ctx.save();

    // 1. 中军帅旗猎猎挥动 + 3 圈加粗战鼓号角扩散环
    for (let k = 0; k < 3; k++) {
        const wave = (p * 1.8 + k * 0.33) % 1;
        const rx = (38 + wave * 115) * scale;
        const ry = rx * 0.48;
        ctx.globalAlpha = fade * (1 - wave) * 0.92;
        ctx.strokeStyle = '#082f49';
        ctx.lineWidth = (6.5 - wave * 2.5) * scale;
        ellipse(ctx, cx, cy - 10, rx, ry);
        ctx.stroke();
        ctx.strokeStyle = v.paid ? '#fde047' : '#38bdf8';
        ctx.lineWidth = (4.2 - wave * 1.6) * scale;
        ctx.stroke();
    }
    const dropOffset = (1 - easeOut(Math.min(1, p * 3.2))) * 44 * scale;
    const sway = Math.sin(p * Math.PI * 5) * 3 * scale;
    ctx.globalAlpha = fade * 0.98;
    drawStamp(ctx, bannerIcon, cx + sway, cy - 36 * scale - dropOffset, 42 * scale);

    // 2. 各伏兵出兵口：滚滚沙尘暴腾起 + 5 道冲天寒铁枪芒 + 大号奇兵令旗
    const n = Math.min(v.points.length, 24);
    for (let i = 0; i < n; i++) {
        const pt = v.points[i];
        const y = pt.y - lift(pt.x, pt.y);
        ctx.globalAlpha = fade * 0.85;
        drawStamp(ctx, dust, pt.x, y - 10 * scale, (36 + e * 26) * scale, (22 + e * 14) * scale);
        for (let s = -2; s <= 2; s++) {
            const sx = pt.x + s * 9.5 * scale;
            const sy = y - 2;
            const spearH = (46 + e * 30 - Math.abs(s) * 6) * scale;
            ctx.globalAlpha = fade * 0.92;
            drawTaperedSlash(ctx, sx, sy, sx + s * 3.5, sy - spearH, 3.8 * scale, '#0284c7', '#f0f9ff');
        }
        ctx.globalAlpha = fade * 0.98;
        drawStamp(ctx, bannerIcon, pt.x, y - (34 + e * 16) * scale, 26 * scale);
    }
    ctx.restore();
}

/** 【胜战计·固己防】全军外围 10 面巨型黄金/青铜塔盾顿地列阵 + 9 枚大号翠玉回血 `+` 升腾 */
function drawShield(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y);
    const rx = (68 + e * 132) * scale;
    const ry = rx * 0.48;
    const shieldIcon = getColdWeaponIcon('shield', v.paid);

    ctx.save();

    // 1. 盾墙连环金铁锁链双环（连接 10 面重装大盾的古铜战阵线）
    ctx.strokeStyle = '#142611';
    ctx.lineWidth = 8.0 * scale;
    ctx.globalAlpha = fade * 0.75;
    ellipse(ctx, x, y - 10 * scale, rx, ry);
    ctx.stroke();

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 5.0 * scale;
    ctx.globalAlpha = fade * 0.94;
    ellipse(ctx, x, y - 10 * scale, rx, ry);
    ctx.stroke();

    // 2. 10 面巨型重装铁盾绕阵顿地列阵（单盾直径 56px）
    const slamDrop = (1 - easeOut(Math.min(1, p * 3.5))) * 42 * scale;
    const shieldCount = 10;
    for (let k = 0; k < shieldCount; k++) {
        const ang = k * (TAU / shieldCount) + p * 0.45;
        const sx = x + Math.cos(ang) * rx;
        const sy = y + Math.sin(ang) * ry - 14 * scale - slamDrop;
        ctx.globalAlpha = fade * 0.98;
        drawStamp(ctx, shieldIcon, sx, sy, 28 * scale);
    }

    // 阵心上方主帅巨盾印记（直径 78px）
    const pulse = 1 + 0.07 * Math.sin(p * Math.PI * 6);
    ctx.globalAlpha = fade * 0.98;
    drawStamp(ctx, shieldIcon, x, y - 38 * scale - slamDrop, 39 * scale * pulse);

    // 3. 回满血视觉：军阵中循环升腾而起的 9 枚大号翠绿 `+` 号群
    const plusOffsets = [
        { dx: 0, dy: -0.62, s: 1.55 },
        { dx: -0.48, dy: -0.28, s: 1.2 },
        { dx: 0.48, dy: -0.28, s: 1.2 },
        { dx: -0.28, dy: -0.82, s: 1.1 },
        { dx: 0.28, dy: -0.82, s: 1.1 },
        { dx: -0.72, dy: 0.05, s: 1.0 },
        { dx: 0.72, dy: 0.05, s: 1.0 },
        { dx: -0.35, dy: 0.32, s: 0.95 },
        { dx: 0.35, dy: 0.32, s: 0.95 },
    ];
    for (let i = 0; i < plusOffsets.length; i++) {
        const po = plusOffsets[i];
        const rise = (p * 1.5 + i * 0.14) % 1;
        const px = x + po.dx * rx;
        const py = y + po.dy * ry - 16 * scale - rise * 38 * scale;
        ctx.globalAlpha = fade * (1 - rise * 0.4) * 0.98;
        drawHealPlus(ctx, px, py, 14 * po.s * scale, 5.2 * po.s * scale, COLOR.shengzhan, '#ecfdf5');
    }
    ctx.restore();
}

/** 【混战计·乱敌阵】大范围灰紫迷雾乱流 + 敌阵中心巨型眩晕双螺旋涡 */
function drawPanic(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const x = v.x, y = v.y - lift(v.x, v.y) - 14;
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const dizzyIcon = getColdWeaponIcon('dizzy', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    ctx.save();
    ctx.globalAlpha = fade * 0.65;
    drawStamp(ctx, dust, x, y, 125 * scale, 68 * scale);

    // 5 层巨型乱流狂风旋刃
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.58);
    for (let i = 0; i < 5; i++) {
        const r = (36 + i * 28 + e * 32) * scale;
        const a = (i % 2 ? -1 : 1) * p * 7.5 + i * 1.3;
        ctx.save();
        ctx.rotate(a);
        ctx.globalAlpha = fade * (0.94 - i * 0.11);
        drawTaperedCrescent(
            ctx,
            0,
            0,
            r,
            (11 - i * 1.3) * scale,
            Math.PI * 1.22,
            i % 2 === 0 ? COLOR.hunzhan : '#d8b4fe',
            '#faf5ff',
        );
        ctx.restore();
    }
    ctx.restore();

    // 阵心旋转巨型混乱眩晕螺旋印（直径 80px）
    ctx.save();
    ctx.translate(x, y - 22 * scale);
    ctx.rotate(p * 6.5);
    ctx.globalAlpha = fade * 0.98;
    drawStamp(ctx, dizzyIcon, 0, 0, 40 * scale);
    ctx.restore();
    ctx.restore();
}

/** 【并战计·夺敌兵】主阵巨型倒戈易帜印 + 大号金色招降令箭沿抛物线射向每名倒戈兵 */
function drawConvert(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y) - 16;
    const defectIcon = getColdWeaponIcon('defect', v.paid);

    ctx.save();

    // 1. 阵心招降虎符/易帜双波纹 + 巨型倒戈易帜双箭印（直径 80px）
    ctx.strokeStyle = '#0c192c';
    ctx.lineWidth = 7.0 * scale;
    ctx.globalAlpha = fade * 0.72;
    ellipse(ctx, x, y + 8, (44 + e * 96) * scale, (22 + e * 48) * scale);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4.4 * scale;
    ctx.globalAlpha = fade * 0.94;
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y - 14 * scale);
    ctx.rotate(p * Math.PI * 2.2);
    ctx.globalAlpha = fade * 0.98;
    drawStamp(ctx, defectIcon, 0, 0, 40 * scale);
    ctx.restore();

    // 2. 射向每一名倒戈士兵的「大号金色招降令箭」与醒目金蓝弧线
    const n = Math.min(v.targets.length, 96);
    for (let i = 0; i < n; i++) {
        const m = v.targets[Math.floor(i * v.targets.length / n)];
        if (m.hp <= 0) continue;
        const my = m.y - lift(m.x, m.y) - 18;
        const cpx = (x + m.x) * 0.5;
        const cpy = Math.min(y, my) - 68 - (i % 3) * 18;

        ctx.globalAlpha = fade * 0.65;
        ctx.strokeStyle = i % 2 ? '#fbbf24' : '#60a5fa';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(cpx, cpy, m.x, my);
        ctx.stroke();

        const t = clamp01(p * 1.65);
        const u = 1 - t;
        const px = u * u * x + 2 * u * t * cpx + t * t * m.x;
        const py = u * u * y + 2 * u * t * cpy + t * t * my;
        const tx = 2 * u * (cpx - x) + 2 * t * (m.x - cpx);
        const ty = 2 * u * (cpy - y) + 2 * t * (my - cpy);
        const tLen = Math.hypot(tx, ty) || 1;
        const tailX = px - (tx / tLen) * 24;
        const tailY = py - (ty / tLen) * 24;

        ctx.globalAlpha = fade * 0.98;
        drawWarArrow(ctx, tailX, tailY, px, py, 1.32, true);
    }
    ctx.restore();
}

/** 【败战计·减敌兵】漫天加粗黑羽箭/火箭齐射覆盖敌阵 + 大号破甲十字斩痕与插地箭杆留存 */
function drawDefeat(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const fade = holdFade(p);
    const scale = tierScale(v);
    const slashIcon = getColdWeaponIcon('slashKill', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    const useTargets = v.targets.length > 0;
    const srcLen = useTargets ? v.targets.length : v.points.length;
    const n = Math.min(srcLen, 140);
    const unitScale = v.paid ? 1.32 : 1.15;

    // 箭雨高空攒射倾角
    const uFallX = -98 * unitScale;
    const uFallY = -245 * unitScale;

    ctx.save();

    // 1. 敌阵上空 64 支密集背景箭雨（两波齐射，营造「万箭齐发、遮天蔽日」的大场面）
    const cx = v.x;
    const cy = v.y - lift(v.x, v.y) - 8;
    for (let k = 0; k < 64; k++) {
        const delay = ((k * 0.381966) % 1) * 0.52;
        if (p < delay) continue;
        const lp = clamp01((p - delay) / 0.36);
        const ang = k * 2.39996;
        const rad = Math.sqrt((k + 0.5) / 64) * 195 * scale;
        const tx = cx + Math.cos(ang) * rad;
        const ty = cy + Math.sin(ang) * rad * 0.5;
        if (lp < 1) {
            const tipX = tx + uFallX * (1 - lp);
            const tipY = ty + uFallY * (1 - lp);
            const tailX = tipX + uFallX * 0.16;
            const tailY = tipY + uFallY * 0.16;
            ctx.globalAlpha = fade * 0.92;
            drawWarArrow(ctx, tailX, tailY, tipX, tipY, 1.35 * scale, v.paid);
        } else {
            // 背景箭雨插在地面上保持可见
            ctx.globalAlpha = fade * 0.78;
            drawWarArrow(ctx, tx + uFallX * 0.11, ty + uFallY * 0.11, tx, ty, 1.1 * scale, v.paid);
        }
    }

    // 2. 锁定每一名折损敌兵的夺命羽箭：错峰齐射 ➔ 贯顶命中 ➔ 大号破甲十字斩痕 + 插地箭杆
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(i * srcLen / n);
        const pt = useTargets ? v.targets[idx] : v.points[idx];
        const py = pt.y - lift(pt.x, pt.y) - 8;

        const delay = ((i * 0.618034) % 1) * 0.35;
        if (p < delay) continue;
        const localP = clamp01((p - delay) / (1 - delay));
        const fallFrac = 0.28;

        if (localP < fallFrac) {
            const fp = localP / fallFrac;
            const hx = pt.x + uFallX * (1 - fp);
            const hy = py + uFallY * (1 - fp);
            const tx = hx + uFallX * 0.18;
            const ty = hy + uFallY * 0.18;

            ctx.globalAlpha = (0.72 + fp * 0.28) * fade;
            drawWarArrow(ctx, tx, ty, hx, hy, 1.42 * unitScale, v.paid);
        } else {
            const ip = (localP - fallFrac) / (1 - fallFrac);

            // 命中后爆开醒目的大号血色交叉破甲斩痕（✕ 直径 42px）
            if (ip < 0.65) {
                const slashAlpha = (1 - (ip / 0.65) ** 1.4) * 0.98 * fade;
                ctx.globalAlpha = slashAlpha;
                drawStamp(ctx, slashIcon, pt.x, py - 10, (18 + ip * 10) * unitScale);
            }

            // 斜插在阵亡士兵旁的大号羽箭箭杆与尾羽（一直留存到 3 秒大特效结束）
            ctx.globalAlpha = fade * 0.95;
            const plantedTailX = pt.x + uFallX * 0.13;
            const plantedTailY = py + 4 + uFallY * 0.13;
            drawWarArrow(ctx, plantedTailX, plantedTailY, pt.x, py + 4, 1.2 * unitScale, v.paid);

            if (i % 2 === 0) {
                ctx.globalAlpha = fade * 0.58;
                drawStamp(ctx, dust, pt.x, py + 2, 16 * unitScale, 9 * unitScale);
            }
        }
    }
    ctx.restore();
}

/** 观众献计／打赏付费天降帅令排面（加粗双层战鼓金环） */
function drawPatronBurst(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (!v.playerCast) return;
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const x = v.x, y = v.y - lift(v.x, v.y);

    ctx.save();
    if (v.paid) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 5.5;
        ctx.globalAlpha = fade * 0.94;
        ellipse(ctx, x, y, 56 + e * 220, 28 + e * 108);
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3.0;
        ellipse(ctx, x, y, 36 + e * 165, 18 + e * 80);
        ctx.stroke();
    } else {
        ctx.globalAlpha = fade * 0.9;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4.0;
        ellipse(ctx, x, y, 46 + e * 175, 23 + e * 85);
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

// ── 6. 持续阶段的单兵小特效（显著放大头顶冷兵器图标与脚下高对比战环，全员清晰可见） ──
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
    ctx.lineCap = 'round';

    const swordsStd = getColdWeaponIcon('swords', false);
    const swordsPaid = getColdWeaponIcon('swords', true);
    const shieldStd = getColdWeaponIcon('shield', false);
    const shieldPaid = getColdWeaponIcon('shield', true);
    const bannerStd = getColdWeaponIcon('banner', false);
    const bannerPaid = getColdWeaponIcon('banner', true);
    const dizzyStd = getColdWeaponIcon('dizzy', false);
    const dizzyPaid = getColdWeaponIcon('dizzy', true);
    const defectStd = getColdWeaponIcon('defect', false);

    // 单兵头顶图标半径从 8px 放大到 13px（直径 26px），脚下战环从 10px 放大到 13.5px 并带深色衬底
    const ICON_R = 13.0;

    for (const m of men) {
        if (m.hp <= 0) continue;
        const st = unitStateOf ? unitStateOf(m) : states[m.f];
        const tier = sideCastTier[m.f];
        const y = m.y - lift(m.x, m.y);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 6.5 + m.zid * 0.73);
        const footRx = 13.5 + pulse * 2.5;
        const footRy = 6.8 + pulse * 1.2;

        // 【攻】振己威持续期（10秒加攻速移速）：脚下加粗赤金战环 ＋ 头顶大号「交叉双刀」图标
        if (st.frenzy > 0 && !m.siegeW) {
            const fadeOut = clamp01(st.frenzy / 0.8);
            ctx.globalAlpha = 0.45 * fadeOut;
            ctx.strokeStyle = '#1a0a02';
            ctx.lineWidth = 4.6;
            ellipse(ctx, m.x, y, footRx, footRy);
            ctx.stroke();

            ctx.globalAlpha = (0.65 + pulse * 0.28) * fadeOut;
            ctx.strokeStyle = tier.frenzyPaid && pulse > 0.5 ? '#ffd700' : COLOR.gongzhan;
            ctx.lineWidth = 2.8;
            ctx.stroke();

            const hy = y - 26 - pulse * 3;
            ctx.globalAlpha = (0.88 + pulse * 0.12) * fadeOut;
            drawStamp(ctx, tier.frenzyPaid ? swordsPaid : swordsStd, m.x, hy, ICON_R);
        }

        // 【胜】固己防持续期（回满血＋10秒无敌）：脚下加粗翠绿金环 ＋ 头顶大号「重装铁盾」（前 2.4 秒伴随飘升大号翠绿 + 号）
        if (st.shield > 0 && !m.siegeW) {
            const fadeOut = clamp01(st.shield / 0.8);
            ctx.globalAlpha = 0.45 * fadeOut;
            ctx.strokeStyle = '#071f0e';
            ctx.lineWidth = 4.6;
            ellipse(ctx, m.x, y, footRx, footRy);
            ctx.stroke();

            ctx.globalAlpha = (0.68 + pulse * 0.26) * fadeOut;
            ctx.strokeStyle = tier.shieldPaid && pulse > 0.5 ? '#fde047' : COLOR.shengzhan;
            ctx.lineWidth = 2.8;
            ctx.stroke();

            const hy = y - 26 - pulse * 2.5;
            ctx.globalAlpha = (0.9 + pulse * 0.1) * fadeOut;
            drawStamp(ctx, tier.shieldPaid ? shieldPaid : shieldStd, m.x, hy, ICON_R);

            // 释放后前 2.4 秒：每名士兵头顶额外飘升醒目的翠绿回血 `+` 号
            const sinceCast = Math.max(0, nowSec - tier.shieldCastSec);
            if (sinceCast < 2.4) {
                const hpP = sinceCast / 2.4;
                const hpFade = hpP < 0.65 ? 1 : (1 - hpP) / 0.35;
                ctx.globalAlpha = hpFade * fadeOut;
                drawHealPlus(ctx, m.x + 11, hy - hpP * 12, 7.2, 3.0, COLOR.shengzhan, '#ecfdf5');
            }
        }

        // 【混】乱敌阵持续期（15秒混乱）：脚下加粗紫环 ＋ 头顶大号旋转「眩晕双螺旋」
        if (st.panic > 0 && !m.march && !m.hero && !m.siegeW) {
            const fadeOut = clamp01(st.panic / 0.8);
            ctx.globalAlpha = 0.45 * fadeOut;
            ctx.strokeStyle = '#180529';
            ctx.lineWidth = 4.6;
            ellipse(ctx, m.x, y, footRx, footRy);
            ctx.stroke();

            ctx.globalAlpha = (0.65 + pulse * 0.28) * fadeOut;
            ctx.strokeStyle = tier.panicPaid && pulse > 0.5 ? '#fde047' : COLOR.hunzhan;
            ctx.lineWidth = 2.8;
            ctx.stroke();

            const hy = y - 26;
            ctx.save();
            ctx.translate(m.x, hy);
            ctx.rotate(nowSec * 4.2 + m.zid);
            ctx.globalAlpha = (0.88 + pulse * 0.12) * fadeOut;
            drawStamp(ctx, tier.panicPaid ? dizzyPaid : dizzyStd, 0, 0, ICON_R);
            ctx.restore();
        }

        // 【敌】伏兵生力军（头顶大号「青色令旗」4.5秒） & 【并】倒戈兵（头顶大号「倒戈易帜双箭」4.5秒）
        if (hasUnitTags) {
            const tag = unitSkillTags.get(m);
            if (tag && nowSec < tag.untilSec) {
                const rem = clamp01((tag.untilSec - nowSec) / 1.0);
                if (tag.six === 'dizhan') {
                    ctx.globalAlpha = 0.45 * rem;
                    ctx.strokeStyle = '#061a29';
                    ctx.lineWidth = 4.6;
                    ellipse(ctx, m.x, y, footRx, footRy);
                    ctx.stroke();

                    ctx.globalAlpha = (0.68 + pulse * 0.26) * rem;
                    ctx.strokeStyle = tag.paid && pulse > 0.5 ? '#ffd700' : COLOR.dizhan;
                    ctx.lineWidth = 2.8;
                    ctx.stroke();

                    const hy = y - 26 - pulse * 2.5;
                    ctx.globalAlpha = (0.9 + pulse * 0.1) * rem;
                    drawStamp(ctx, tag.paid ? bannerPaid : bannerStd, m.x, hy, ICON_R);
                } else {
                    ctx.globalAlpha = 0.45 * rem;
                    ctx.strokeStyle = '#081426';
                    ctx.lineWidth = 4.6;
                    ellipse(ctx, m.x, y, footRx, footRy);
                    ctx.stroke();

                    ctx.globalAlpha = (0.7 + pulse * 0.26) * rem;
                    ctx.strokeStyle = pulse > 0.5 ? '#fbbf24' : COLOR.bingzhan;
                    ctx.lineWidth = 2.8;
                    ctx.stroke();

                    const hy = y - 26 - pulse * 2.5;
                    ctx.globalAlpha = (0.9 + pulse * 0.1) * rem;
                    drawStamp(ctx, defectStd, m.x, hy, ICON_R);
                }
            }
        }
    }
    ctx.restore();
}
